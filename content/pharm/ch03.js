import {redistributionTrace,redistributionCrossings} from './source-audit-redistribution.js';
import { hepaticClearance, hepaticElasticities } from './source-audit-hepatic.js';
// Pharmacology — Chapter 3: Multi-compartment and physiological models (part a: items 3.1–3.6)
import { LN2, clamp, logSlope, rk4, idxAt, memo, sig, box, wire, mamm, cBolus, cDecay, aucBolus, firstBelow, tTerminal } from './ch03.shared.js';

const nice = (x) => (x >= 100 ? Math.round(x) : x >= 10 ? Math.round(x * 10) / 10 : Math.round(x * 100) / 100);

export default {
  collection: 'pharm',
  chapter: 3,
  title: 'Multi-compartment and physiological models',
  summary: String.raw`Many drugs first distribute into tissues and only then are eliminated, giving biexponential curves that a two-compartment model captures. Redistribution explains why some anaesthetics wear off quickly; context-sensitive half-time replaces half-life for infusions. Organ clearance depends on blood flow and extraction, which explains first-pass loss, and physiologically based models assemble organs into a whole-body circuit. All parameter values in this chapter are rounded teaching figures or models, not fitted data and not dosing advice.`,
  items: [
    // ------------------------------------------------------------------ 3.1
    {
      num: '3.1',
      kind: 'Model',
      name: 'Two-compartment model: biexponential decline',
      statement: String.raw`Let a central compartment (volume $V_1$, which holds the plasma) lose drug by elimination with clearance CL and exchange it with a peripheral compartment (volume $V_2$) at the intercompartmental clearance $Q$. With rate constants $k_{10}=\mathrm{CL}/V_1$, $k_{12}=Q/V_1$, $k_{21}=Q/V_2$ the amounts obey $\dot A_1=-(k_{10}+k_{12})A_1+k_{21}A_2$ and $\dot A_2=k_{12}A_1-k_{21}A_2$. After an intravenous bolus $D$ the plasma concentration is the sum of two exponentials, $C(t)=A\,e^{-\alpha t}+B\,e^{-\beta t}$ with $\alpha>\beta>0$. The rate matrix has eigenvalues $-\alpha$ and $-\beta$; the positive decay rates therefore satisfy $\alpha+\beta=k_{10}+k_{12}+k_{21}$ and $\alpha\beta=k_{10}k_{21}$; $A+B=D/V_1$, and $\mathrm{AUC}=D/\mathrm{CL}$ still holds.`,
      idea: String.raw`Two coupled linear equations are a $2\times2$ linear ODE (kin-1.5 for one compartment, here for a vector), solved by the eigenvalues and eigenvectors of its matrix. Written for concentrations the exchange is reversible, so after the scaling $x_i=\sqrt{V_i}\,C_i$ the matrix becomes **symmetric**; the real spectral theorem (ladr-7.29) then guarantees two real eigenvalues, hence no oscillation, and orthogonal modes. The weights are $A/(D/V_1)=u_{1}^2$ and $B/(D/V_1)=u_{2}^2$, the squared first components of the two orthonormal eigenvectors, which add to one. The modes combine exchange and loss. When exchange is fast relative to clearance, the fast mode is mainly redistribution and the slow mode describes gradual depletion after approximate distribution balance; the spectral representation itself does not require that separation.

The constant-matrix flow theorem ode 3.3 supplies the dynamical step after diagonalization: if M denotes the coefficient matrix of the displayed amount balances, the amount vector is $e^{tM}(D,0)^T$. Each eigenvector with generator eigenvalue $-\alpha$ or $-\beta$ evolves with the corresponding decaying exponential. The symmetric scaling and spectral theorem already used above provide the real orthogonal modes; matrix-flow uniqueness turns their sum into the solution for the specified bolus, rather than merely a representation of a symmetric matrix. Strictly positive exchange and elimination give positive decay rates.`,
      caption: String.raw`Two tanks whose widths are proportional to $V_1$ and $V_2$ exchange drug through pipes whose thickness is $Q$ and drain through CL; the fill level is concentration. The right panel is the plasma curve on a semilog plot: the **bend** is where the fast mode $A e^{-\alpha t}$ (orange, dashed) has died away and the slow mode $B e^{-\beta t}$ (green, dashed) takes over. Make $V_2$ small or $Q$ tiny and the bend disappears (one compartment, 2.1); make $V_2$ large and the terminal slope flattens. The readout compares the eigenvalues with the trace and determinant of the rate matrix and checks the formula against RK4 integration of the two ODEs.`,
      scope: String.raw`Needs linear (first-order) exchange and elimination from the central compartment only, with instantaneous mixing within each compartment. Real bodies have a continuum of tissues, so the number of exponentials needed grows with sampling time and assay precision; three are common for lipophilic drugs.`,
      deps: ['pharm-2.1', 'ladr-7.29', 'ode-3.3'],
      refs: ['Rowland–Tozer'],
      tags: ['two-compartment', 'eigenvalues'],
      viz(v) {
        const D = 300;
        const V1 = v.slider('central volume $V_1$ (L)', 5, 60, 15, { step: 1 });
        const V2 = v.slider('peripheral volume $V_2$ (L)', 5, 150, 40, { step: 1 });
        const CL = v.slider('clearance CL (L/h)', 0.5, 20, 5, { step: 0.1 });
        const Q = v.slider('exchange $Q$ (L/h)', 0.5, 40, 12, { step: 0.5 });
        const sT = v.stage({ x: [0, 10], y: [0, 10], axes: false, height: 330, weight: 0.9, minWidth: 250 });
        const sC = v.stage({ x: [0, 24], y: [0.01, 40], ylog: true, axes: 'box', gutter: true, xlabel: 'time (h)', ylabel: 'C (mg/L, log)', height: 330, weight: 1.1, minWidth: 260 });
        let info = null;
        v.animate((tt) => {
          const m = mamm({ V1: V1.value, V2: V2.value, CL: CL.value, Q2: Q.value });
          const k10 = CL.value / V1.value, k12 = Q.value / V1.value, k21 = Q.value / V2.value;
          const [beta, alpha] = m.lam, wB = m.w[0], wA = m.w[1], C0 = D / V1.value;
          const tMax = nice(clamp(5 * (LN2 / beta), 6, 400));
          const th = tMax * clamp(tt / 8, 0, 1) * 0.5;
          const Cf = (t) => cBolus(m, D, t);
          // independent check: RK4 on the two amount equations
          let y = [D, 0]; const nS = 400, h = th / nS;
          const F = ([a1, a2]) => [-(k10 + k12) * a1 + k21 * a2, k12 * a1 - k21 * a2];
          for (let i = 0; i < nS && th > 0; i++) y = rk4(F, y, 0, h);
          const err = Math.abs(y[0] / V1.value - Cf(th));
          info = { m, alpha, beta, wA, wB, C0, k10, k12, k21, err, th, tr: k10 + k12 + k21, det: k10 * k21 };
          // tanks
          const w1 = 0.8 + 0.035 * V1.value, w2 = 0.8 + 0.035 * V2.value, x1 = 2.7, x2 = 7.3, bot = 3, top = 8, Cmax = C0;
          const c1 = y[0] / V1.value, c2 = y[1] / V2.value;
          const tank = (cx, w, c, col, name, vol) => {
            sT.rect(cx - w / 2, bot, cx + w / 2, top, { fill: col, fillAlpha: 0.05, color: 'ink', width: 2 });
            const hgt = (top - bot) * clamp(c / Cmax, 0, 1);
            sT.rect(cx - w / 2, bot, cx + w / 2, bot + hgt, { fill: col, fillAlpha: 0.45, stroke: false });
            sT.text(name, cx, top + 1.0, { size: 12, color: 'ink', align: 'center', baseline: 'middle', weight: 600 });
            sT.text(`${vol} L`, cx, top + 0.45, { size: 10.5, color: 'muted', align: 'center', baseline: 'middle' });
            sT.text(`${v.fix(c, 2)} mg/L`, cx, bot - 0.55, { size: 10.5, color: col, align: 'center', baseline: 'middle', weight: 600 });
          };
          tank(x1, w1, c1, 'accent', 'central', v.fix(V1.value, 0));
          tank(x2, w2, c2, 'orange', 'peripheral', v.fix(V2.value, 0));
          const qw = 1.2 + 0.2 * Q.value;
          sT.arrow(x1 + w1 / 2 + 0.1, 6.2, x2 - w2 / 2 - 0.1, 6.2, { color: 'muted', width: qw, head: 9 });
          sT.arrow(x2 - w2 / 2 - 0.1, 5, x1 + w1 / 2 + 0.1, 5, { color: 'muted', width: qw, head: 9 });
          sT.text(`Q = ${v.fix(Q.value, 1)} L/h`, 5, 7.0, { size: 10.5, color: 'muted', align: 'center', baseline: 'middle' });
          sT.arrow(x1, bot - 1.0, x1, 0.6, { color: 'green', width: 1.4 + 0.22 * CL.value * c1 / Math.max(C0, 1e-9) * 3, head: 9 });
          sT.text(`CL = ${v.fix(CL.value, 1)} L/h`, x1 + 0.4, 1.0, { size: 10.5, color: 'green', align: 'left', baseline: 'middle' });
          sT.text(`t = ${v.fix(th, 1)} h`, 5, 9.7, { size: 11, color: 'muted', align: 'center', baseline: 'middle' });
          // semilog
          sC.setView([0, tMax], [C0 * 0.0015, C0 * 1.5]);
          sC.fn((t) => C0 * wA * Math.exp(-alpha * t), { domain: [0, tMax], color: 'orange', dash: true, width: 1.6 });
          sC.fn((t) => C0 * wB * Math.exp(-beta * t), { domain: [0, tMax], color: 'green', dash: true, width: 1.6 });
          sC.fn(Cf, { domain: [0, tMax], color: 'accent', width: 2.4 });
          sC.dot(th, Cf(th), { r: 5.5, color: 'gold' });
          sC.dot(0, C0, { r: 4, color: 'accent', hollow: true });
          sC.text('$A+B=D/V_1$', 0, C0, { size: 10.5, color: 'muted', align: 'left', baseline: 'bottom', dx: 8, dy: -2 });
        }, { period: 11, still: 3 });
        v.legend([['accent', 'plasma $C(t)$'], ['orange', '$A e^{-\\alpha t}$ (fast)', { dash: true }], ['green', '$B e^{-\\beta t}$ (slow)', { dash: true }]]);
        v.readout(() => `$\\alpha=${v.fix(info.alpha, 3)}$ h$^{-1}$, $\\beta=${v.fix(info.beta, 3)}$ h$^{-1}$ (distribution $t_{1/2}=${v.fix(LN2 / info.alpha, 2)}$ h, terminal $t_{1/2}=${v.fix(LN2 / info.beta, 1)}$ h); weights $A/C_0=${v.fix(info.wA, 3)}$, $B/C_0=${v.fix(info.wB, 3)}$.\nTrace: $\\alpha+\\beta=${v.fix(info.alpha + info.beta, 4)}$ vs $k_{10}+k_{12}+k_{21}=${v.fix(info.tr, 4)}$; determinant: $\\alpha\\beta=${v.fix(info.alpha * info.beta, 4)}$ vs $k_{10}k_{21}=${v.fix(info.det, 4)}$. AUC $=D/\\mathrm{CL}=${v.fix(D / CL.value, 1)}$ mg·h/L from the formula: $${v.fix(aucBolus(info.m, D), 1)}$. RK4 versus formula at $t=${v.fix(info.th, 1)}$ h: $${v.sci(info.err + 1e-12, 2)}$ mg/L.`);
      },
    },
    // ------------------------------------------------------------------ 3.2
    {
      num: '3.2',
      kind: 'Method',
      name: 'Method of residuals (curve stripping)',
      statement: String.raw`Given plasma concentrations $C_i$ after a bolus that follow $C(t)=A e^{-\alpha t}+B e^{-\beta t}$, estimate the parameters in stages. (1) On the semilog plot the late samples lie on the slow line: regress $\ln C$ on $t$ over them to get $\hat\beta$ and $\hat B$. (2) Subtract the extrapolated slow line from the early samples; the residuals $r_i=C_i-\hat B e^{-\hat\beta t_i}$ estimate $A e^{-\alpha t_i}$. (3) Regress $\ln r_i$ on $t_i$ to get $\hat\alpha$ and $\hat A$. The result is a good starting point for a joint nonlinear least-squares fit, which removes the bias that comes from treating the terminal points as exactly one exponential.`,
      idea: String.raw`If $\alpha\gg\beta$ the fast term has vanished by the late times, so there the curve is the single exponential $B e^{-\beta t}$ and the straight-line regression of 2.3 applies. Extending that line backward and subtracting it from the early data leaves what the fast term alone contributes, again an exponential, so a second regression finishes the job. The method is only as good as the separation of the two phases: if the terminal points still contain some fast term, $\hat\beta$ is too large and every later step inherits the error, and residuals can become negative (their logarithm does not exist) where noise exceeds the small difference.`,
      caption: String.raw`Left: fourteen noisy samples of a biexponential curve (true curve dashed green). The **last $n$ samples (gold)** define the terminal line (orange), extended back to $t=0$; the stripped fit is the accent curve and the joint nonlinear fit (Nelder–Mead on $\ln C$) the purple one. Right: the residuals of the early samples on a semilog plot with their fitted line; points with non-positive residual cannot be plotted and are counted. Slide $n$ up until distribution-phase points contaminate the terminal fit, bring $\alpha$ close to $\beta$, or raise the noise, and watch the stripped estimates drift away from the truth while the joint fit stays closer. **Resample** draws new noise.`,
      scope: String.raw`Requires well-separated phases ($\alpha/\beta$ of about 5 or more) and samples in both phases. Stripping weights the residuals as if the noise were additive; with a proportional error the joint fit on $\ln C$ is preferred. Here the noise is lognormal and the data are simulated, not measured.`,
      deps: ['pharm-3.1'],
      refs: ['Rowland–Tozer'],
      tags: ['curve stripping', 'regression'],
      viz(v) {
        const T = [0.1, 0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 6, 8, 12, 16, 24];
        const A0 = 30, B0 = 6, beta0 = 0.12;
        const alpha = v.slider('true fast rate $\\alpha$ (h$^{-1}$)', 0.25, 5, 1.6, { step: 0.05 });
        const noise = v.slider('assay noise (ln s.d.)', 0.01, 0.4, 0.08, { step: 0.01 });
        const nT = v.slider('terminal samples used $n$', 2, 8, 5, { int: true });
        let seed = 11;
        v.button('resample', () => { seed++; });
        const sL = v.stage({ x: [0, 24], y: [0.05, 100], ylog: true, axes: 'box', gutter: true, xlabel: 'time (h)', ylabel: 'C (mg/L, log)', height: 340, weight: 1.2, minWidth: 270 });
        const sR = v.stage({ x: [0, 8], y: [0.05, 100], ylog: true, axes: 'box', gutter: true, xlabel: 'time (h)', ylabel: 'residual (mg/L, log)', height: 340, weight: 1, minWidth: 250 });
        const draw = memo();
        let info = null;
        v.render(() => {
          const truth = (t) => A0 * Math.exp(-alpha.value * t) + B0 * Math.exp(-beta0 * t);
          const data = draw(`${seed}|${alpha.value}|${noise.value}`, () => { const r = v.rng(seed * 37 + 1); return T.map((t) => truth(t) * Math.exp(noise.value * r.normal())); });
          const n = nT.value, N = T.length, term = Array.from({ length: n }, (_, i) => N - n + i), early = Array.from({ length: N - n }, (_, i) => i);
          const fit2 = logSlope(T, data, term), beta = fit2.k, B = fit2.c0;
          const res = early.map((i) => ({ i, r: data[i] - B * Math.exp(-beta * T[i]) }));
          const pos = res.filter((o) => o.r > 0);
          const nNeg = res.length - pos.length;
          let a1 = null;
          if (pos.length >= 2) { const ts = pos.map((o) => T[o.i]), ys = pos.map((o) => o.r), f = logSlope(ts, ys, ts.map((_, j) => j)); a1 = { alpha: f.k, A: f.c0 }; }
          const strip = a1 ? (t) => a1.A * Math.exp(-a1.alpha * t) + B * Math.exp(-beta * t) : null;
          // joint nonlinear least squares on ln C, parameters in logs
          let nls = null;
          if (a1 && a1.alpha > 0) {
            const obj = (p) => { let s = 0; for (let i = 0; i < N; i++) { const mdl = Math.exp(p[0]) * Math.exp(-Math.exp(p[1]) * T[i]) + Math.exp(p[2]) * Math.exp(-Math.exp(p[3]) * T[i]); s += (Math.log(data[i]) - Math.log(mdl)) ** 2; } return s; };
            const x0 = [Math.log(a1.A), Math.log(Math.max(a1.alpha, 1e-3)), Math.log(B), Math.log(Math.max(beta, 1e-3))];
            const R = v.M.nelderMead(obj, x0, { step: 0.3, tol: 1e-10, maxIt: 1500 });
            nls = { A: Math.exp(R.x[0]), alpha: Math.exp(R.x[1]), B: Math.exp(R.x[2]), beta: Math.exp(R.x[3]) };
            if (nls.alpha < nls.beta) nls = { A: nls.B, alpha: nls.beta, B: nls.A, beta: nls.alpha };
          }
          info = { beta, B, a1, nls, nNeg, n, fit2, res: res.length };
          sL.fn(truth, { domain: [0, 24], color: 'green', dash: true, width: 1.6 });
          sL.fn((t) => B * Math.exp(-beta * t), { domain: [0, 24], color: 'orange', width: 1.8 });
          if (strip) sL.fn(strip, { domain: [0, 24], color: 'accent', width: 2.2 });
          if (nls) sL.fn((t) => nls.A * Math.exp(-nls.alpha * t) + nls.B * Math.exp(-nls.beta * t), { domain: [0, 24], color: 'purple', width: 2, dash: [6, 3] });
          T.forEach((t, i) => sL.dot(t, data[i], { r: 4.5, color: term.includes(i) ? 'gold' : 'accent' }));
          sL.vband(T[N - n] - 0.05, 24, { color: 'gold', alpha: 0.06 });
          // residuals
          sR.fn((t) => A0 * Math.exp(-alpha.value * t), { domain: [0, 8], color: 'green', dash: true, width: 1.6 });
          if (a1) sR.fn((t) => a1.A * Math.exp(-a1.alpha * t), { domain: [0, 8], color: 'accent', width: 2.2 });
          pos.forEach((o) => sR.dot(T[o.i], o.r, { r: 4.5, color: 'accent' }));
          res.filter((o) => o.r <= 0).forEach((o) => sR.text('×', T[o.i], 0.07, { size: 14, color: 'red', align: 'center', baseline: 'bottom' }));
        });
        v.legend([['green', 'true curve', { dash: true }], ['orange', 'terminal line'], ['accent', 'stripped fit'], ['purple', 'joint fit', { dash: true }], ['gold', 'terminal samples', { dot: true }]]);
        v.readout(() => {
          const { a1, nls, beta, B, nNeg } = info;
          const row = (name, aa, al, bb, be) => `${name}: $A=${v.fix(aa, 1)}$, $\\alpha=${v.fix(al, 2)}$, $B=${v.fix(bb, 2)}$, $\\beta=${v.fix(be, 3)}$`;
          return [row('truth', A0, alpha.value, B0, beta0), a1 ? row('stripping', a1.A, a1.alpha, B, beta) : 'stripping: fewer than two positive residuals', nls ? row('joint fit', nls.A, nls.alpha, nls.B, nls.beta) : ''].filter(Boolean).join('\n') + (nNeg ? `\n${nNeg} residual(s) were not positive (red crosses): their logarithm does not exist.` : '');
        });
      },
    },
    // ------------------------------------------------------------------ 3.3
    {
      num: '3.3',
      kind: 'Concept',
      name: 'Distribution and elimination phases',
      statement: String.raw`After an intravenous bolus into a two-compartment body the plasma curve has two phases. In the early **distribution ($\alpha$) phase** the concentrations in the two compartments differ, and both redistribution and elimination lower the central concentration. At the initial bolus their outward fluxes are in the ratio $Q:\mathrm{CL}$, so redistribution dominates initially only when exchange is large relative to clearance; the phase label alone does not make elimination small. When the fast mode has died out the concentration ratio $C_2/C_1$ has become constant and the body behaves as one pool: the **elimination ($\beta$) phase**, in which both compartments decline together at rate $\beta$ and the loss is by clearance. The peripheral amount is greatest exactly when $C_1=C_2$.`,
      idea: String.raw`The peripheral amount changes at rate $Q\,(C_1-C_2)$, so it grows while plasma is richer than tissue and shrinks when the order reverses; its maximum is the instant $C_1=C_2$. The fast mode, an eigenvector pointing across the compartments (3.1), decays with $\alpha$; once it is gone only the slow eigenvector survives, along which the ratio $C_2/C_1$ is fixed, so both curves become parallel lines on the semilog plot. When exchange dominates the initial central loss, a rapid plasma fall can mainly reflect movement into a larger effective volume while much of the dose remains. This interpretation depends on the exchange-to-clearance ratio; the slow fixed-ratio mode and the distinction between initial and steady-state volumes do not require elimination to be negligible.`,
      caption: String.raw`Left: where the dose is, as a stacked area: central compartment (blue), peripheral (orange) and eliminated (green). Right: the concentrations $C_1$ and $C_2$ on a semilog plot. Move the **time slider**: the shaded early period is the distribution phase, ending (dashed line) when the fast mode has fallen below 5 % of the slow one; the dots mark the moment of maximum peripheral amount, where the two concentration curves cross. Raise $V_2$ or $Q$ to make a larger and faster distribution phase; lower CL to see elimination dominate later.`,
      scope: String.raw`Two linear compartments with elimination from the central one. The 5 % criterion for the end of the distribution phase is a convention chosen here; there is no sharp boundary.`,
      deps: ['pharm-3.1'],
      refs: ['Rowland–Tozer'],
      tags: ['distribution', 'elimination'],
      viz(v) {
        const D = 100;
        const V1 = v.slider('central volume $V_1$ (L)', 5, 60, 12, { step: 1 });
        const V2 = v.slider('peripheral volume $V_2$ (L)', 5, 150, 50, { step: 1 });
        const CL = v.slider('clearance CL (L/h)', 0.5, 10, 2, { step: 0.1 });
        const Q = v.slider('exchange $Q$ (L/h)', 0.5, 40, 8, { step: 0.5 });
        const win = v.select('time axis', [{ value: 'all', label: 'whole curve' }, { value: 'early', label: 'distribution phase' }], 'all');
        const tS = v.slider('time marker (fraction of the plotted span)', 0, 1, 0.2, { step: 0.005 });
        const sA = v.stage({ x: [0, 40], y: [0, 1], axes: 'box', gutter: true, xlabel: 'time (h)', ylabel: 'fraction of dose', height: 330, weight: 1, minWidth: 260 });
        const sC = v.stage({ x: [0, 40], y: [0.01, 10], ylog: true, axes: 'box', gutter: true, xlabel: 'time (h)', ylabel: 'C (mg/L, log)', height: 330, weight: 1.1, minWidth: 260 });
        let info = null;
        v.render(() => {
          const m = mamm({ V1: V1.value, V2: V2.value, CL: CL.value, Q2: Q.value });
          const [beta, alpha] = m.lam, C0 = D / V1.value;
          const tAll = nice(clamp(4.5 * (LN2 / beta), 8, 600)), tPh = firstBelow((t) => m.w[1] * Math.exp(-alpha * t) / (m.w[0] * Math.exp(-beta * t)), 0.05, 1e4);
          const tMax = win.value === 'all' ? tAll : nice(clamp(3 * tPh, 0.5, tAll));
          const C1 = (t) => cDecay(m, [C0, 0], t)[0], C2 = (t) => cDecay(m, [C0, 0], t)[1];
          const A1 = (t) => V1.value * C1(t) / D, A2 = (t) => V2.value * C2(t) / D, E = (t) => 1 - A1(t) - A2(t);
          const tS_ = tS.value * tMax;
          // end of the distribution phase: fast term below 5 % of slow term
          const fast = (t) => m.w[1] * Math.exp(-alpha * t), slow = (t) => m.w[0] * Math.exp(-beta * t);
          const tEnd = firstBelow((t) => fast(t) / slow(t), 0.05, 1e4);
          // peak peripheral amount: C1 = C2
          const tPk = firstBelow((t) => C1(t) - C2(t), 0, 1e4);
          let ratioLate = C2(tMax * 0.9) / C1(tMax * 0.9);
          info = { m, alpha, beta, tEnd, tPk, ts: tS_, a1: A1(tS_), a2: A2(tS_), e: E(tS_), r: C2(tS_) / C1(tS_), ratioLate, A2pk: A2(tPk), c1pk: C1(tPk), c2pk: C2(tPk), Eend: E(tEnd), tMax };
          sA.setView([0, tMax], [0, 1]);
          sC.setView([0, tMax], [C0 * 0.002, C0 * 1.5]);
          sA.vband(0, tEnd, { color: 'orange', alpha: 0.1 });
          const N = 200, ts = Array.from({ length: N + 1 }, (_, i) => (i * tMax) / N);
          const a1 = ts.map(A1), a2 = ts.map(A2);
          sA.poly([...ts.map((t, i) => [t, a1[i]]), [tMax, 0], [0, 0]], { fill: 'accent', fillAlpha: 0.35, color: 'accent', width: 1.5 });
          sA.poly([...ts.map((t, i) => [t, a1[i] + a2[i]]), ...ts.map((t, i) => [ts[N - i], a1[N - i]])], { fill: 'orange', fillAlpha: 0.4, color: 'orange', width: 1.5 });
          sA.poly([...ts.map((t, i) => [t, 1]), ...ts.map((t, i) => [ts[N - i], a1[N - i] + a2[N - i]])], { fill: 'green', fillAlpha: 0.3, color: 'green', width: 1.5 });
          sA.vline(tEnd, { color: 'ink', dash: true, alpha: 0.7 });
          sA.vline(tS_, { color: 'gold', width: 2 });
          sA.dot(tPk, A1(tPk) + A2(tPk), { r: 5, color: 'orange' });
          sC.vband(0, tEnd, { color: 'orange', alpha: 0.1 });
          sC.fn(C1, { domain: [0, tMax], color: 'accent', width: 2.4 });
          sC.fn(C2, { domain: [0, tMax], color: 'orange', width: 2.4 });
          sC.vline(tEnd, { color: 'ink', dash: true, alpha: 0.7 });
          sC.vline(tS_, { color: 'gold', width: 2 });
          sC.dot(tPk, C1(tPk), { r: 5.5, color: 'ink' });
          sC.text('$\\beta$ phase', (tEnd + tMax) / 2, C0 * 1.3, { size: 10.5, color: 'muted', align: 'center', baseline: 'top' });
        });
        v.legend([['accent', 'central'], ['orange', 'peripheral'], ['green', 'eliminated']]);
        v.readout(() => `Distribution phase (fast mode above 5 % of slow) ends at $t=${v.fix(info.tEnd, 2)}$ h, when ${v.fix(100 * info.Eend, 0)} % of the dose has been eliminated; the peripheral amount peaks at $t=${v.fix(info.tPk, 2)}$ h with ${v.fix(100 * info.A2pk, 0)} % of the dose, where $C_1=${v.fix(info.c1pk, 3)}$ and $C_2=${v.fix(info.c2pk, 3)}$ mg/L. Late ratio $C_2/C_1\\to${v.fix(info.ratioLate, 3)}$.\nAt $t=${v.fix(info.ts, 2)}$ h: central $${v.fix(100 * info.a1, 0)}$ %, peripheral $${v.fix(100 * info.a2, 0)}$ %, eliminated $${v.fix(100 * info.e, 0)}$ %, $C_2/C_1=${v.fix(info.r, 3)}$.`);
      },
    },
    // ------------------------------------------------------------------ 3.4
    {
      num: '3.4',
      kind: 'Model',
      name: 'Thiopental redistribution: concentration falls before elimination',
      statement: String.raw`A falling central concentration need not mean that most drug has left the body: exchange with initially empty tissues can lower it while total drug remains high. Thiopental motivates this distinction. In the primary experiments of Mark and colleagues (1957), serial dog brain/plasma samples showed rapid brain entry and declining concentrations in both tissues; additional dogs sampled at 30 seconds supported rapid passage. Those measurements support rapid brain access, not a universal human waking concentration or the numerical parameters below.`,
      idea: String.raw`The chosen model exchanges drug between a central pool, a muscle-like pool and a large fat-like pool. Exchange terms $Q_j(C_1-C_j)$ move mass without removing it; only $\mathrm{CL}C_1$ removes mass. A separate, massless effect-site proxy obeys $\dot C_e=k_{e0}(C_1-C_e)$ and follows central concentration with an assumed delay. Setting clearance to zero isolates redistribution: concentrations can cross a chosen reference even while the entire dose remains in the three pools.

For the separate massless effect-site proxy, ode 1.4 gives $C_e(t)=e^{-k_{e0}t}C_e(0)+\int_0^t k_{e0}e^{-k_{e0}(t-s)}C_1(s)\,ds$. The central concentration is the prescribed forcing of this scalar equation; the proxy does not feed back into the three amount balances. Its lagged concentration therefore adds no stored drug to the conserved body total. This positive-kernel calculation describes the chosen proxy and supplies no patient recovery threshold.`,
      caption: String.raw`Left: central and effect-site concentrations, divided by the first effect-site peak. The reference slider defines a mathematical crossing, not observed waking. Right: central, muscle-like, fat-like and eliminated amounts as fractions of the dose given so far. Toggle exchange or elimination and compare the crossings. A second bolus at 30 minutes can produce another above-reference episode; every downward crossing within the full 120-minute window is reported.`,
      scope: String.raw`Three linear, instantly mixed pools and a massless effect-site proxy; all volumes, clearances, dose and the assumed $k_{e0}=0.55$ per minute are chosen teaching values, not fitted dog or human thiopental parameters. The 1957 dog study does not validate this proxy, a human waking threshold, or the second-dose prediction. The threshold is tied to the first-dose peak in each configuration. Fractions use one dose before 30 minutes and two after a second bolus.`,
      credit: 'Mark, Burns, Campomanes, Ngai, Trousof, Papper & Brodie, 1957 (rapid brain passage in dogs)',
      deps: ['pharm-3.3', 'ode-1.4'],
      refs: ['Mark et al., The Passage of Thiopental into Brain, J Pharmacol Exp Ther 119(1):35–38 (1957), complete Methods, Results, Tables I–II and Discussion read 2026-10-19; PMID13417057'],
      links: {source:'https://pubmed.ncbi.nlm.nih.gov/13417057/'},
      tags: ['redistribution', 'anaesthesia'],
      verify: false,
      viz(v) {
        const lvl=v.slider('reference (fraction of first effect-site peak)',.05,.6,.3,{step:.01});
        const tMus=v.toggle('muscle-like exchange',true),tFat=v.toggle('fat-like exchange',true),tLiv=v.toggle('central elimination',true),tSec=v.toggle('second bolus at 30 min',false);
        const sB=v.stage({x:[-2,122],y:[-.03,2],axes:'box',gutter:true,xlabel:'time (min)',ylabel:'relative concentration',height:330,weight:1.1,minWidth:260});
        const sD=v.stage({x:[-2,122],y:[-.03,1.04],axes:'box',gutter:true,xlabel:'time (min)',ylabel:'fraction of dose given',height:330,weight:1,minWidth:250});
        const sim=memo();let info;
        v.render(()=>{
          const options={muscle:tMus.value,fat:tFat.value,liver:tLiv.value,second:tSec.value},key=Object.values(options).join('|'),S=sim(key,()=>redistributionTrace(options)),R=redistributionCrossings(S,lvl.value),{peak}=R;
          const max=Math.max(...S.c1,...S.ce)/peak;
          sB.setView([-2,122],[-max*.03,max*1.07]);
          sB.hline(lvl.value,{color:'red',dash:true,width:1.6});sB.text('chosen reference',120,lvl.value,{size:10.5,color:'red',align:'right',baseline:'bottom',dy:-3});
          sB.path(S.t.map((t,i)=>[t,S.c1[i]/peak]),{color:'muted',dash:[5,3],width:1.8});sB.path(S.t.map((t,i)=>[t,S.ce[i]/peak]),{color:'accent',width:2.6});
          for(const c of R.crossings){sB.vline(c.t,{color:'green',dash:true});sB.dot(c.t,lvl.value,{r:6,color:'green'});sD.vline(c.t,{color:'ink',dash:true});}
          const pts=g=>S.t.map((t,i)=>[t,g(i)]),b1=i=>S.a1[i]/S.given[i],b2=i=>(S.a1[i]+S.a2[i])/S.given[i],b3=i=>(S.a1[i]+S.a2[i]+S.a3[i])/S.given[i];
          const stack=(lo,hi,col)=>sD.poly([...pts(hi),...pts(lo).reverse()],{fill:col,fillAlpha:.38,color:col,width:1.4});
          stack(()=>0,b1,'accent');stack(b1,b2,'orange');stack(b2,b3,'purple');stack(b3,()=>1,'green');
          if(tSec.value){sB.vline(30,{color:'gold',dash:[3,4]});sD.vline(30,{color:'gold',dash:[3,4]});}
          info={...R,options,balanceError:Math.max(...S.t.map((_,i)=>Math.abs((S.a1[i]+S.a2[i]+S.a3[i]+S.el[i])/S.given[i]-1)))};
        });
        v.legend([['accent','effect-site proxy / central amount'],['muted','central concentration',{dash:true}],['orange','muscle-like amount'],['purple','fat-like amount'],['green','eliminated amount']]);
        v.readout(()=>{
          const last=info.crossings.at(-1),times=info.crossings.map(c=>v.fix(c.t,1)).join(', '),common=`First effect-site peak at ${v.fix(info.peakTime,1)} min; maximum mass-balance error ${info.balanceError.toExponential(1)}.`;
          return last?`Downward reference crossings at ${times} min. At the last crossing ${v.fix(100*(1-last.el/last.given),1)}% of the dose given remains: central ${v.fix(100*last.a1/last.given,1)}%, muscle-like ${v.fix(100*last.a2/last.given,1)}%, fat-like ${v.fix(100*last.a3/last.given,1)}%; eliminated ${v.fix(100*last.el/last.given,1)}%.\n${common}`:`No downward reference crossing within 120 min. ${common}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.5
    {
      num: '3.5',
      kind: 'Concept',
      name: 'Context-sensitive half-time',
      statement: String.raw`The **context-sensitive half-time** is the time for the plasma concentration to fall by half after an infusion is stopped, as a function of the infusion's duration, its *context*. It is conventionally defined for an infusion that holds the plasma concentration constant. For a one-compartment body it equals the half-life $\ln2\,V/\mathrm{CL}$ for every duration. With a peripheral compartment it is short after a brief infusion, when the tissues are still nearly empty and redistribution helps lower the plasma level, and it grows with the duration as the tissues fill and hand drug back, approaching a limit. It can differ greatly from the elimination half-life, and for large peripheral compartments it may exceed the distribution half-life manyfold at moderate durations.`,
      idea: String.raw`During a plasma-holding infusion the peripheral concentration climbs as $C_2(T)=C_1\bigl(1-e^{-QT/V_2}\bigr)$ (the plateau principle of 2.4, with $Q/V_2$ as the rate). The longer the infusion, the closer the tissues are to equilibrium and the less they can absorb after the stop; they instead feed back. After the stop the plasma level follows the two-compartment decay of 3.1 started from $(C_1,C_2(T))$, so the half-time is found by solving $C_1(t)=\tfrac12 C_1(0)$. Short infusions leave $C_2\approx0$ and the fall is the fast phase; long ones leave $C_2\to C_1$ and the fall is dominated by the slow phase.`,
      caption: String.raw`Right: the context-sensitive half-time against infusion duration (log scale, 1 min to 24 h) for a two-compartment drug; the dashed line is the half-life of the same drug taken as one compartment of volume $V_1$, the dotted one its terminal half-life $\ln2/\beta$. Slide the **duration** (gold dot) and the left panel shows the plasma level after the stop, scaled to 1 at the stop, for the current duration (gold) and for 10 min, 1 h and 8 h (faint). Grow $V_2$ and the curve rises higher and later. Switch to a **constant-rate infusion**, which holds nothing constant: the halving is then measured from the level at the stop. The readout checks the closed form against RK4 integration of the whole infusion.`,
      scope: String.raw`Two linear compartments, plasma-holding infusion (the usual definition) or constant rate. A real pump scheme to hold a concentration needs the loading dose and a decreasing rate; the effect-site concentration, which is what matters for wake-up, can differ from the plasma one.`,
      deps: ['pharm-3.1', 'pharm-2.4'],
      refs: ['Rowland–Tozer'],
      tags: ['infusion', 'half-time'],
      viz(v) {
        const V1 = v.slider('central volume $V_1$ (L)', 5, 40, 12, { step: 1 });
        const V2 = v.slider('peripheral volume $V_2$ (L)', 0, 300, 100, { step: 1 });
        const CL = v.slider('clearance CL (L/min)', 0.1, 2, 0.6, { step: 0.05 });
        const Q = v.slider('exchange $Q$ (L/min)', 0.1, 5, 1.2, { step: 0.05 });
        const Tn = v.slider('infusion duration (min)', 1, 1440, 240, { log: true, sig: 2 });
        const mode = v.select('infusion', [{ value: 'hold', label: 'holds concentration' }, { value: 'rate', label: 'constant rate' }], 'hold');
        const sL = v.stage({ x: [0, 200], y: [0, 1.05], axes: 'box', gutter: true, xlabel: 'time after stopping (min)', ylabel: 'C / C(stop)', height: 330, weight: 1, minWidth: 250 });
        const sR = v.stage({ x: [1, 1440], y: [0, 200], xlog: true, axes: 'box', gutter: true, xlabel: 'infusion duration (min, log)', ylabel: 'context-sensitive half-time (min)', height: 330, weight: 1.1, minWidth: 260 });
        let info = null;
        const startVec = (m, T) => { const c = [1]; for (let i = 1; i < m.n; i++) c.push(1 - Math.exp(-(m.Q[i - 1] * T) / m.V[i])); return c; };
        const rateTrace = (m, T, t) => { let s = 0; for (let j = 0; j < m.n; j++) s += (m.w[j] / m.lam[j]) * (Math.exp(-m.lam[j] * t) - Math.exp(-m.lam[j] * (t + T))); return s; };
        const dec = (m, T, t) => (mode.value === 'hold' ? cDecay(m, startVec(m, T), t)[0] : rateTrace(m, T, t) / rateTrace(m, T, 0));
        const csht = (m, T) => firstBelow((t) => dec(m, T, t), 0.5, 20000);
        v.render(() => {
          const m = mamm({ V1: V1.value, V2: V2.value, CL: CL.value, Q2: Q.value });
          const T = Tn.value, one = (LN2 * V1.value) / CL.value, term = tTerminal(m), c = csht(m, T);
          // independent RK4 check of the whole infusion, then free decay to the crossing
          const k10 = CL.value / V1.value, k12 = Q.value / V1.value, k21 = V2.value > 0 ? Q.value / V2.value : 0;
          let a1 = 0, a2 = 0, t = 0, tc = NaN;
          const dt = Math.min(0.1, T / 2000 + 0.02);
          const Rhold = (a2_) => CL.value + Q.value * (1 - a2_ / V2.value);
          const Rc = 1; // constant-rate case: unit rate
          const fI = ([x, y]) => {
            const R = mode.value === 'hold' ? Rhold(y) : Rc;
            return [R - (k10 + k12) * x + k21 * y, k12 * x - k21 * y];
          };
          if (V2.value > 0) {
            let y = mode.value === 'hold' ? [V1.value, 0] : [0, 0];
            const nI = Math.max(1, Math.round(T / dt)), h1 = T / nI;
            for (let i = 0; i < nI; i++) y = rk4(fI, y, 0, h1);
            const c0 = y[0] / V1.value;
            const fF = ([x, z]) => [-(k10 + k12) * x + k21 * z, k12 * x - k21 * z];
            let tt = 0, prev = c0;
            for (let i = 0; i < 100000; i++) {
              const y2 = rk4(fF, y, 0, 0.05), cn = y2[0] / V1.value;
              tt += 0.05;
              if (cn <= c0 / 2) { tc = tt - 0.05 + 0.05 * ((prev - c0 / 2) / (prev - cn)); break; }
              y = y2; prev = cn;
            }
          } else tc = one;
          void a1; void a2; void t;
          info = { one, term, c, T, tc };
          const tmax = clamp(nice(1.5 * Math.max(c || 0, csht(m, 480) || 0, 10)), 10, 20000);
          sL.setView([0, tmax], [0, 1.05]);
          sL.hline(0.5, { color: 'faint', dash: [4, 4] });
          for (const T2 of [10, 60, 480]) sL.fn((tt) => dec(m, T2, tt), { domain: [0, tmax], color: 'muted', alpha: 0.5, width: 1.4 });
          sL.fn((tt) => dec(m, T, tt), { domain: [0, tmax], color: 'gold', width: 2.6 });
          if (isFinite(c)) { sL.vline(c, { color: 'green', dash: true }); sL.dot(c, 0.5, { r: 6, color: 'green' }); }
          // right: csht vs duration
          const Ts = Array.from({ length: 61 }, (_, i) => 10 ** ((i / 60) * Math.log10(1440)));
          const ys = Ts.map((x) => csht(m, x));
          const top = Math.max(1, ...ys.filter(isFinite), one, term > 4000 ? 0 : term) * 1.1;
          sR.setView([1, 1440], [0, nice(top)]);
          sR.hline(one, { color: 'orange', dash: true, width: 1.6 });
          if (term < top) sR.hline(term, { color: 'purple', dash: [2, 4], width: 1.6 });
          sR.path(Ts.map((x, i) => [x, ys[i]]), { color: 'accent', width: 2.6 });
          if (isFinite(c)) sR.dot(T, c, { r: 6.5, color: 'gold' });
          sR.vline(T, { color: 'gold', alpha: 0.4 });
        });
        v.legend([['accent', 'context-sensitive half-time'], ['orange', 'one-compartment $\\ln2\\,V_1/\\mathrm{CL}$', { dash: true }], ['purple', 'terminal $t_{1/2}$', { dash: true }], ['gold', 'current duration']]);
        v.readout(() => `Duration ${v.fix(info.T, 0)} min: context-sensitive half-time $=${v.fix(info.c, 1)}$ min (closed form) vs $${v.fix(info.tc, 1)}$ min from RK4 on the amounts. One-compartment reference $${v.fix(info.one, 1)}$ min, terminal half-life $${v.fix(info.term, 1)}$ min.`);
      },
    },
    // ------------------------------------------------------------------ 3.6
    {
      num: '3.6',
      kind: 'Model',
      name: 'Well-stirred liver model and hepatic extraction',
      statement: String.raw`In the **well-stirred model** the liver is one mixed compartment fed by blood flow $Q$; the drug concentration inside it equals that in the leaving blood, and enzymes remove only the unbound drug with intrinsic clearance $\mathrm{CL}_{int}$ (the clearance the enzymes would show without any flow limit). Mass balance gives the hepatic clearance $\mathrm{CL}_H=\dfrac{Q\,f_u\mathrm{CL}_{int}}{Q+f_u\mathrm{CL}_{int}}$ and extraction ratio $E=\mathrm{CL}_H/Q=\dfrac{f_u\mathrm{CL}_{int}}{Q+f_u\mathrm{CL}_{int}}$. If $f_u\mathrm{CL}_{int}\ll Q$ (low extraction) then $\mathrm{CL}_H\approx f_u\mathrm{CL}_{int}$ and depends on enzymes and binding but not on flow; if $f_u\mathrm{CL}_{int}\gg Q$ (high extraction) then $\mathrm{CL}_H\to Q$ and depends on flow only. The elasticities are $\partial\ln\mathrm{CL}_H/\partial\ln Q=E$ and $\partial\ln\mathrm{CL}_H/\partial\ln(f_u\mathrm{CL}_{int})=1-E$.`,
      idea: String.raw`Steady state: what enters the liver minus what leaves equals what the enzymes remove, $Q(C_{in}-C_{out})=f_u\mathrm{CL}_{int}\,C_{out}$ with $C_{out}$ the concentration in the liver. Solving for $C_{out}/C_{in}=Q/(Q+f_u\mathrm{CL}_{int})$ gives $E=1-C_{out}/C_{in}$, and $\mathrm{CL}_H=QE$ is the clearance defined in 1.4. The expression is a harmonic combination of the two resistances, delivery $Q$ and enzymatic capacity $f_u\mathrm{CL}_{int}$, so the smaller one decides, like two resistors in series. The alternative **parallel-tube** model (enzymes spread along flow-through sinusoids) gives $\mathrm{CL}_H=Q\bigl(1-e^{-f_u\mathrm{CL}_{int}/Q}\bigr)$; both approach capacity at low extraction and flow at very high capacity; they differ between these limits.

For positive flow Q and capacity $x=f_u\mathrm{CL}_{int}$, apply the chain rule pma 5.5 to the logarithm of $\mathrm{CL}_H=Qx/(Q+x)$. Multiplying each partial derivative by its positive input and dividing by clearance gives $\partial\log\mathrm{CL}_H/\partial\log Q=x/(Q+x)=E$ and $\partial\log\mathrm{CL}_H/\partial\log x=Q/(Q+x)=1-E$. These are local elasticities of this well-stirred formula. For the alternative tube expression the same differentiation yields different intermediate elasticities; equal limiting regimes do not identify the models.`,
      caption: String.raw`Left: hepatic clearance against $f_u\mathrm{CL}_{int}$ (log axis) for the current blood flow (blue) and for half and double that flow (faint): the curve follows the diagonal $\mathrm{CL}_H=f_u\mathrm{CL}_{int}$ at the left and flattens at $Q$ at the right. Right: a schematic liver, with blood in at concentration1 and out at $1-E$, with bars showing what happens to $\mathrm{CL}_H$ if you **double the flow** or **double the enzyme capacity**, computed from the model, beside the exact elasticities for the selected model. Use the preset buttons for a low-, intermediate- and high-extraction drug, or switch the model to the parallel tube.`,
      scope: String.raw`Steady linear metabolism with a chosen blood-unbound fraction $f_u$, rapid equilibration and no transporter limitation. Flow and clearance use a common blood-concentration basis. The 90 L/h default and all preset capacities are chosen examples, not independently fitted physiological measurements. The two models make different assumptions about concentrations inside the liver; applying the same numerical intrinsic clearance in both is a mathematical comparison, not a claim that separately fitted intrinsic clearances are interchangeable. The elasticity identities $E$ and $1-E$ apply to the well-stirred model; the parallel-tube elasticities are computed separately.`,
      credit: 'Rowland, Benet & Graham, 1973; Wilkinson & Shand, 1975 (physiological approach to hepatic clearance); Pang & Rowland, 1977 (comparison with the parallel-tube model)',
      deps: ['pharm-1.4', 'pharm-1.7', 'pma-5.5'],
      refs: ['Jusko & Li (2021), Assessment of the Kochak-Benet Equation for Hepatic Clearance for the Parallel-Tube Model, AAPS J24:5, equations2/3/8/10, model assumptions and limitations; DOI 10.1208/s12248-021-00656-z'],
      links: { source: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9639621/' },
      tags: ['hepatic clearance', 'extraction'],
      verify: false,
      viz(v) {
        const Q = v.slider('hepatic blood flow $Q$ (L/h)', 20, 300, 90, { step: 5 });
        const fu = v.slider('unbound fraction $f_u$', 0.01, 1, 0.5, { log: true, sig: 2 });
        const CI = v.slider('intrinsic clearance CL$_{int}$ (L/h)', 1, 20000, 60, { log: true, sig: 2 });
        const mod = v.select('model', [{ value: 'ws', label: 'well-stirred' }, { value: 'pt', label: 'parallel tube' }], 'ws');
        const set = (fuv, ci) => () => { fu.set(fuv); CI.set(ci); };
        v.button('low extraction', set(0.05, 40));
        v.button('intermediate', set(0.5, 120));
        v.button('high extraction', set(0.8, 3000));
        const sL = v.stage({ x: [0.1, 1e4], y: [0, 330], xlog: true, axes: 'box', gutter: true, xlabel: 'enzyme capacity $f_u$CL$_{int}$ (L/h, log)', ylabel: 'CL$_H$ (L/h)', height: 330, weight: 1.1, minWidth: 260 });
        const sR = v.stage({ x: [0, 10], y: [0, 10], axes: false, height: 330, weight: 1, minWidth: 250 });
        const CLH=(q,x)=>hepaticClearance(q,x,mod.value);
        let info = null;
        v.render(() => {
          const q = Q.value, x = fu.value * CI.value, cl = CLH(q, x), E = cl / q;
          const dQ = CLH(2 * q, x) / cl, dX = CLH(q, 2 * x) / cl;
          // numerical elasticities by a 1 % change
          const eQ = Math.log(CLH(q * 1.01, x) / cl) / Math.log(1.01), eX = Math.log(CLH(q, x * 1.01) / cl) / Math.log(1.01);
          const exact=hepaticElasticities(q,x,mod.value);info = { q, x, cl, E, dQ, dX, eQ, eX, exact };
          sL.setView([.005,40000],[-q*.1,q*2.4]);
          const xs = Array.from({ length: 121 }, (_, i) => 10 ** (-2 + (i / 120) * Math.log10(2000000)));
          sL.path(xs.filter(t=>t<q*2.2).map(t=>[t,t]), { color: 'orange', dash: [5, 4], width: 1.4 });
          sL.hline(q, { color: 'green', dash: [5, 4], width: 1.4 });
          sL.hline(q / 2, { color: 'faint', alpha: 0.7, dash: [3, 4] });
          sL.hline(2 * q, { color: 'faint', alpha: 0.7, dash: [3, 4] });
          for (const f of [0.5, 2]) sL.path(xs.map((t) => [t, CLH(q * f, t)]), { color: 'accent', alpha: 0.35, width: 1.6 });
          sL.path(xs.map((t) => [t, CLH(q, t)]), { color: 'accent', width: 2.6 });
          sL.dot(x, cl, { r: 7, color: 'gold' });
          sL.text('$Q$', 0.13, q, { size: 11, color: 'green', align: 'left', baseline: 'bottom', dy: -3 });
          sL.text('CL$_H$ = $f_u$CL$_{int}$', 0.5, 0.5, { size: 10.5, color: 'orange', align: 'left', baseline: 'bottom', dx: 4, dy: -4 });
          // right: the liver as a chamber
          const aw = 3 + 0.05 * q;
          sR.arrow(0.3, 8.1, 3, 8.1, { color: 'accent', width: aw, head: 10 });
          sR.text('blood in, $C=1$', 0.3, 9.4, { size: 11, color: 'accent', align: 'left', baseline: 'middle' });
          sR.rect(3, 6.7, 7, 9.7, { fill: 'orange', fillAlpha: 0.1 + 0.4 * E, color: 'ink', width: 2, radius: 10 });
          sR.text(mod.value==='ws'?'well-stirred':'parallel tube', 5, 9.25, { size: 12, color: 'ink', align: 'center', baseline: 'middle', weight: 600 });
          sR.text(`E = ${v.fix(E, 2)}`, 5, 8.2, { size: 15, color: 'ink', align: 'center', baseline: 'middle', weight: 700 });
          sR.text(`CL_H = ${v.fix(cl,cl<.1?3:1)} L/h`, 5, 7.25, { size: 11, color: 'muted', align: 'center', baseline: 'middle' });
          sR.arrow(7, 8.1, 9.7, 8.1, { color: 'accent', alpha: 0.25 + 0.75 * (1 - E), width: aw, head: 10 });
          sR.text(`out: $C=${v.fix(1 - E, 2)}$`, 9.7, 9.4, { size: 11, color: 'accent', align: 'right', baseline: 'middle' });
          sR.text('what happens to CL$_H$ if you ...', 0.3, 6.2, { size: 11, color: 'muted', align: 'left', baseline: 'middle' });
          const y0 = 2.3, hs = 3.0;
          sR.line(0.6, y0, 9.4, y0, { color: 'faint' });
          const bar = (xc, r, lab, pred, col) => {
            sR.rect(xc - 0.9, y0, xc + 0.9, y0 + Math.max((r - 1) * hs, 0.02), { fill: col, fillAlpha: 0.4, color: col, width: 1.5 });
            sR.text(`×${v.fix(r, 2)}`, xc, y0 + Math.max((r - 1) * hs, 0) + 0.4, { size: 12, color: col, align: 'center', baseline: 'middle', weight: 700 });
            sR.text(lab, xc, y0 - 0.5, { size: 11, color: 'ink', align: 'center', baseline: 'middle' });
            sR.text(pred, xc, y0 - 1.1, { size: 10, color: 'muted', align: 'center', baseline: 'middle' });
          };
          bar(3, dQ, 'double the flow', `exact flow elasticity ${v.fix(exact.flow,2)}`, 'accent');
          bar(7, dX, 'double the enzymes', `exact capacity elasticity ${v.fix(exact.capacity,2)}`, 'orange');
        });
        v.legend([['accent', '$Q$ as set'], ['orange', '$f_u$CL$_{int}$ asymptote', { dash: true }], ['green', '$Q$ asymptote', { dash: true }], ['gold', 'this drug', { dot: true }]]);
        v.readout(() => `$f_u\\mathrm{CL}_{int}=${v.fix(info.x,info.x<.1?3:1)}$ L/h against $Q=${v.fix(info.q, 0)}$ L/h: $E=${v.fix(info.E, 3)}$, $\\mathrm{CL}_H=${v.fix(info.cl,info.cl<.1?3:1)}$ L/h (${info.E > 0.7 ? 'high extraction: flow-limited' : info.E < 0.3 ? 'low extraction: enzyme-limited' : 'intermediate'}).\nNumerical elasticities (+1 %): $\\partial\\ln\\mathrm{CL}_H/\\partial\\ln Q=${v.fix(info.eQ, 3)}$ (exact ${v.fix(info.exact.flow,3)}), $\\partial\\ln\\mathrm{CL}_H/\\partial\\ln(f_u\\mathrm{CL}_{int})=${v.fix(info.eX, 3)}$ (exact ${v.fix(info.exact.capacity,3)}).`);
      },
    },
  ],
};
