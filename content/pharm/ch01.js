// Pharmacology — Chapter 1: Drug disposition: the basic quantities
import { BODY, clamp, trapz, trapzLog, logSlope, bateman, rk4, idxAt, trace, memo, sig, box, wire, flowDots } from './ch01.shared.js';

// ---------- Theophylline, subject 1 of the classic data set (Boeckmann, Sheiner & Beal 1994; R: datasets::Theoph) ----------
// 79.6 kg man, 4.02 mg/kg orally (≈ 320 mg); serum theophylline in mg/L. Times in h.
const THEO = { wt: 79.6, dose: 4.02, t: [0, 0.25, 0.57, 1.12, 2.02, 3.82, 5.1, 7.03, 9.05, 12.12, 24.37], c: [0.74, 2.84, 6.57, 10.5, 9.66, 8.58, 8.36, 7.47, 6.89, 5.94, 3.28] };

// ---------- 1.1: the ADME run ----------
/** Five-place model of 100 mg: gut G, plasma P, tissue T, cumulative metabolised M, cumulative excreted U. */
function admeRun(p) {
  const D = 100, k12 = 0.3 * p.dist, k21 = 0.15, km = 0.12 * p.hep, kr = 0.06 * p.ren, ka = p.ka, E = p.fp;
  const f = (y) => {
    const [G, P, Tt] = y;
    return [-ka * G, ka * (1 - E) * G - (k12 + km + kr) * P + k21 * Tt, k12 * P - k21 * Tt, E * ka * G + km * P, kr * P];
  };
  let y = p.route === 'iv' ? [0, D, 0, 0, 0] : [D, 0, 0, 0, 0];
  const out = { t: [], G: [], P: [], T: [], M: [], U: [], k12, k21, km, kr, ka, E, D };
  const h = 0.02;
  for (let i = 0; i <= 1200; i++) {
    if (i % 5 === 0) { out.t.push(i * h); out.G.push(y[0]); out.P.push(y[1]); out.T.push(y[2]); out.M.push(y[3]); out.U.push(y[4]); }
    y = rk4(f, y, i * h, h);
  }
  return out;
}

// ---------- 1.2: AUC estimators ----------
/** Estimate AUC(0→∞) from samples (ts, cs sorted): trapezoids over [t0, tlast] plus the tail C_last/k_z, k_z from the last 3 positive points. */
function aucEstimate(ts, cs, method) {
  const f = method === 'log' ? trapzLog : trapz;
  const n = ts.length, body = f(ts, cs);
  let kz = NaN, tail = 0;
  if (n >= 3 && cs.slice(-3).every((c) => c > 0)) {
    const r = logSlope(ts, cs, [n - 3, n - 2, n - 1]);
    kz = r.k;
    if (kz > 0) tail = cs[n - 1] / kz;
  }
  return { body, tail, kz, total: body + tail, c0: n >= 3 ? logSlope(ts, cs, [n - 3, n - 2, n - 1]).c0 : NaN };
}

export default {
  collection: 'pharm',
  chapter: 1,
  title: 'Drug disposition: the basic quantities',
  summary: String.raw`What the body does to a drug is summarized by a few numbers. The area under the concentration–time curve measures exposure; volume of distribution relates the amount in the body to the plasma concentration; clearance relates the elimination rate to concentration; bioavailability says how much of an oral dose arrives. Protein binding, pH partitioning and membrane permeability decide where a drug can go. Every model in this chapter is educational and every drug value is a rounded textbook figure; nothing here is dosing advice.`,
  items: [
    // ------------------------------------------------------------------ 1.1
    {
      num: '1.1',
      kind: 'Concept',
      name: 'ADME: absorption, distribution, metabolism, excretion',
      statement: String.raw`What the body does to a drug can be sorted into four processes. **Absorption** moves the drug from its site of administration into the blood (an intravenous dose skips it). **Distribution** carries it from the blood into tissues and back. **Metabolism**, mostly in the liver, chemically alters it, and **excretion**, mostly by the kidneys, removes it unchanged or as metabolites. The last two together are **elimination**. For an oral dose the blood leaving the gut passes through the liver first, so some drug can be metabolized before it ever reaches the general circulation (the first-pass effect, 1.6). At every instant the amounts in all places add up to the dose that was given.`,
      idea: String.raw`ADME is bookkeeping. Each process is a flow between two places, and in the simplest models the flow is proportional to the amount in the source (a rate constant times an amount). Writing the flows down gives a small system of linear differential equations in which the total amount is conserved, so the stacked picture of "where is the drug" always sums to the dose; only the split changes. Fast absorption empties the gut early; strong tissue uptake parks drug away from the blood; high hepatic or renal function pushes drug into the "gone" columns sooner.

The sum rule for derivatives (pma 5.3) turns the five displayed model balances into a conservation check. In $G+P+T+M+U$, each gut-to-plasma, plasma-to-tissue, return, metabolism and excretion flow occurs once with each sign, so the derivative of the total is zero. Its initial value is the administered dose. M and U are cumulative parent-dose equivalents in this bookkeeping model; this cancellation is not a claim that every real metabolite has the same molecular mass as its parent.`,
      caption: String.raw`A 100 mg dose is followed through a five-place body: gut, plasma, tissue, metabolized (liver) and excreted (kidney). Boxes fill with their amounts and dots stream along the arrows that are carrying drug. The stacked chart on the right shows the same run in full; its total height is always 100 mg. Switch to an **intravenous** dose to skip absorption, raise the first-pass loss to see drug destroyed before it arrives, or lower hepatic and renal function to see elimination slow down. The rate constants are illustrative, not those of a particular drug.`,
      scope: String.raw`A deliberately simple linear model: first-order flows, the whole oral dose absorbed, instant mixing inside plasma and inside tissue. Real drugs have several tissues, active transport, saturable steps and incomplete absorption.`,
      deps: ['pma-5.3'],
      see: ['physio-1.3'],
      refs: ['Goodman–Gilman ch. 2', 'Rowland–Tozer'],
      tags: ['ADME', 'compartments'],
      viz(v) {
        const route = v.select('route', [{ value: 'oral', label: 'oral tablet' }, { value: 'iv', label: 'intravenous bolus' }], 'oral');
        const ka = v.slider('absorption rate $k_a$', 0.2, 5, 1, { log: true, fmt: (x) => `${v.fix(x, 2)} /h` });
        const fp = v.slider('first-pass loss in liver', 0, 0.8, 0.2, { step: 0.05, fmt: (x) => `${Math.round(100 * x)} %` });
        const dist = v.slider('tissue uptake', 0, 3, 1, { step: 0.1, fmt: (x) => `×${v.fix(x, 1)}` });
        const hep = v.slider('hepatic function', 0, 2, 1, { step: 0.1, fmt: (x) => `×${v.fix(x, 1)}` });
        const ren = v.slider('renal function', 0, 2, 1, { step: 0.1, fmt: (x) => `×${v.fix(x, 1)}` });
        const sb = v.stage({ x: [0, 10], y: [0, 6], axes: false, height: 330, weight: 1 });
        const sc = v.stage({ x: [0, 24], y: [0, 100], axes: 'box', gutter: true, xlabel: 'time (h)', ylabel: 'amount (mg)', height: 330, weight: 1, yticks: [0, 25, 50, 75, 100], xticks: [0, 4, 8, 12, 16, 20, 24] });
        const get = memo();
        let th = 0, R0 = null;
        const COL = { G: 'orange', P: 'accent', T: 'purple', M: 'teal', U: 'green' };
        v.animate((tt) => {
          const R = get(`${route.value}|${ka.value}|${fp.value}|${dist.value}|${hep.value}|${ren.value}`, () => admeRun({ route: route.value, ka: ka.value, fp: fp.value, dist: dist.value, hep: hep.value, ren: ren.value }));
          R0 = R; th = clamp(((tt % 16) / 13) * 24, 0, 24);
          const i = idxAt(R.t, th), G = R.G[i], P = R.P[i], T = R.T[i], M = R.M[i], U = R.U[i];
          const iv = route.value === 'iv';
          // ---- body diagram
          const phase = tt * 1.6;
          const fl = { port: R.ka * G, hv: R.ka * (1 - R.E) * G, met: R.km * P, ren: R.kr * P, in: R.k12 * P, out: R.k21 * T };
          const arrows = [
            ['port', [[2.2, 5], [3.5, 5]], 'orange'],
            ['hv', [[4.55, 4.45], [4.55, 3.15]], 'accent'],
            ['met', [[5.45, 3.15], [5.45, 4.45]], 'teal'],
            ['in', [[6.15, 2.85], [7.5, 2.85]], 'purple'],
            ['out', [[7.5, 2.35], [6.15, 2.35]], 'purple'],
            ['ren', [[3.85, 2.6], [2.8, 2.6]], 'green'],
          ];
          for (const [k, pts, col] of arrows) {
            wire(sb, pts, { color: 'faint', width: 1.4 });
            const a = clamp(Math.sqrt(fl[k] / 12), 0, 1);
            if (fl[k] > 0.15) flowDots(sb, pts, phase * 0.45, 0.42, { color: col, alpha: 0.25 + 0.75 * a, r: 2.2 + 1.4 * a });
          }
          if (iv) { wire(sb, [[5, 0.6], [5, 2.0]], { color: 'red', width: 2 }); sb.text('IV injection', 5.15, 0.75, { size: 10.5, color: 'red', align: 'left', baseline: 'middle', weight: 600 }); }
          sb.text('portal vein', 2.9, 4.62, { size: 9.5, color: 'muted', align: 'center', baseline: 'middle' });
          sb.text('first pass', 4.45, 3.8, { size: 10, color: 'muted', align: 'right', baseline: 'middle' });
          const b = (x, y, label, amt, col, w = 2.3, sub) => box(sb, x, y, w, 1.2, label, { color: col, fill: col, fillAlpha: 0.05 + 0.5 * clamp(amt / R.D, 0, 1), active: amt / R.D > 0.15, sub: sub ?? `${v.fix(amt, 1)} mg` });
          b(1.2, 5, 'gut', G, COL.G, 2.0);
          b(5, 5, 'liver', M, COL.M, 2.9, `${v.fix(M, 1)} mg metabolized`);
          b(5, 2.6, 'plasma', P, COL.P);
          b(8.7, 2.6, 'tissues', T, COL.T, 2.2);
          b(1.45, 2.6, 'urine', U, COL.U, 2.6, `${v.fix(U, 1)} mg excreted`);
          sb.text('absorption', 1.2, 4.2, { size: 10.5, color: 'orange', align: 'center', baseline: 'middle' });
          sb.text('distribution', 6.85, 3.15, { size: 10.5, color: 'purple', align: 'center', baseline: 'middle' });
          sb.text('metabolism', 5.6, 3.8, { size: 10.5, color: 'teal', align: 'left', baseline: 'middle', dx: 0 });
          sb.text('excretion', 3.3, 1.9, { size: 10.5, color: 'green', align: 'center', baseline: 'middle' });
          // ---- stacked chart
          const lay = [['G', 'G'], ['P', 'P'], ['T', 'T'], ['M', 'M'], ['U', 'U']];
          const n = i + 1;
          let low = new Array(n).fill(0);
          for (const [key, name] of lay) {
            const up = low.map((l, j) => l + R[name][j]);
            const pts = [];
            for (let j = 0; j < n; j++) pts.push([R.t[j], up[j]]);
            for (let j = n - 1; j >= 0; j--) pts.push([R.t[j], low[j]]);
            sc.poly(pts, { fill: COL[key], fillAlpha: 0.45, color: COL[key], width: 1 });
            low = up;
          }
          sc.vline(th, { color: 'gold', width: 1.3 });
          sc.text('total = dose', 23.7, 98, { size: 10.5, color: 'muted', align: 'right', baseline: 'top' });
        }, { period: 16, still: 4.5 });
        v.legend([['orange', 'in gut', { area: true }], ['accent', 'in plasma', { area: true }], ['purple', 'in tissues', { area: true }], ['teal', 'metabolized', { area: true }], ['green', 'excreted', { area: true }]]);
        v.readout(() => {
          const R = R0;
          const i = idxAt(R.t, th), tot = R.G[i] + R.P[i] + R.T[i] + R.M[i] + R.U[i];
          return `at $t = ${v.fix(th, 1)}$ h: gut $${v.fix(R.G[i], 1)}$ · plasma $${v.fix(R.P[i], 1)}$ · tissues $${v.fix(R.T[i], 1)}$ · metabolized $${v.fix(R.M[i], 1)}$ · excreted $${v.fix(R.U[i], 1)}$ mg; sum $= ${v.fix(tot, 2)}$ mg (the dose). After 24 h, $${v.fix(100 * (R.M[R.M.length - 1] + R.U[R.U.length - 1]) / R.D, 0)}$ % has been eliminated.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.2
    {
      num: '1.2',
      kind: 'Concept',
      name: 'Concentration–time profile and AUC',
      statement: String.raw`After a dose, the plasma concentration $C(t)$ rises (if the drug is absorbed), peaks and falls away. The **area under the curve**, $\mathrm{AUC}_{0\to\infty}=\int_0^\infty C(t)\,dt$, in mg·h/L, measures the total exposure to the drug. It is estimated from a finite set of blood samples by the **trapezoidal rule** over the sampled interval $[0,t_{\text{last}}]$ plus an extrapolated tail $C_{\text{last}}/k_z$, where $k_z$ is the terminal slope of $\ln C$ against $t$. The trapezoid estimate converges to the true area as samples are added, while the tail correction matters whenever the last sample is still well above zero.`,
      idea: String.raw`The area under a curve is an integral, and the trapezoidal rule replaces the curve between samples by straight chords, which is the numerical integration of pma-6.1 applied to sparse data. Chords lie below a concave peak and above a convex decline, so the error shrinks as the samples get denser, most quickly where the curve bends. Beyond the last sample nothing was measured, so the tail is extrapolated by assuming the terminal phase is a single exponential, whose area from $t_{\text{last}}$ onward is exactly $C_{\text{last}}/k_z$. The "log-down" variant integrates declining segments as exponentials, which is exact for a one-compartment decline.`,
      caption: String.raw`The data are **subject 1 of the classic theophylline data set** (one oral dose of 320 mg; 11 serum samples over 24 h). Shaded blue: trapezoids over the sampled interval; green: the extrapolated tail. **Click a sample to drop it or restore it** and watch the area change. Choose the **simulated** curve (a Bateman curve fitted to those data, whose exact area is known) to add samples with the slider and see the estimate converge on the right, for even or early-heavy sampling and for linear or log-down trapezoids. The middle panel shows the terminal fit on a log axis.`,
      scope: String.raw`Valid for a single dose with a log-linear terminal phase observed in the last samples. Multi-phase tails, sampling that stops before the terminal phase, or a rising last sample make the extrapolation unreliable (the code then reports no tail).`,
      deps: ['pharm-1.1', 'pma-6.1'],
      refs: ['Rowland–Tozer'],
      tags: ['AUC', 'trapezoidal rule'],
      credit: 'Data: R. Upton, theophylline kinetics, as printed in Boeckmann, Sheiner & Beal, NONMEM Users Guide Part V (1994), as distributed in R datasets::Theoph',
      viz(v) {
        const M = v.M;
        const D = THEO.dose * THEO.wt;
        const obs = THEO.t.map((t, i) => [t, THEO.c[i]]).filter((p) => p[0] > 0);
        const fit = M.nelderMead((x) => {
          let e = 0;
          for (const [t, c] of obs) { const p = bateman(1, D, Math.exp(x[0]), Math.exp(x[1]), Math.exp(x[2]), t); e += (Math.log(Math.max(p, 1e-9)) - Math.log(c)) ** 2; }
          return e;
        }, [Math.log(32), Math.log(1.5), Math.log(0.08)], { step: 0.3, tol: 1e-13, maxIt: 4000 });
        const Vf = Math.exp(fit.x[0]), kaf = Math.exp(fit.x[1]), kf = Math.exp(fit.x[2]);
        const model = (t) => bateman(1, D, Vf, kaf, kf, t);
        const truth = D / (Vf * kf);
        const src = v.select('data', [{ value: 'real', label: 'real samples (theophylline)' }, { value: 'sim', label: 'simulated curve' }], 'real');
        const meth = v.select('trapezoids', [{ value: 'lin', label: 'linear' }, { value: 'log', label: 'log-down' }], 'lin');
        const sched = v.select('sampling', [{ value: 'even', label: 'even' }, { value: 'early', label: 'early-heavy' }], 'even');
        const nS = v.slider('number of samples $n$', 3, 40, 8, { int: true });
        const on = THEO.t.map(() => true);
        const sA = v.stage({ x: [0, 48], y: [0, 13], axes: 'box', gutter: true, xlabel: 'time (h)', ylabel: 'concentration (mg/L)', height: 300, weight: 1.25, xticks: [0, 6, 12, 18, 24, 30, 36, 42, 48] });
        const sB = v.stage({ x: [0, 48], y: [0.3, 20], ylog: true, axes: 'box', gutter: true, xlabel: 'time (h)', ylabel: 'concentration (mg/L, log)', height: 300, weight: 1, xticks: [0, 12, 24, 36, 48], yticks: [[0.5, '0.5'], [1, '1'], [2, '2'], [5, '5'], [10, '10']] });
        const sC = v.stage({ x: [3, 40], y: [0.4, 1.8], axes: 'box', gutter: true, xlabel: 'number of samples used', ylabel: 'AUC estimate / reference', height: 300, weight: 1, yticks: [0.5, 0.75, 1, 1.25, 1.5] });
        const samples = () => {
          if (src.value === 'real') { const ts = [], cs = []; THEO.t.forEach((t, i) => { if (on[i]) { ts.push(t); cs.push(THEO.c[i]); } }); return { ts, cs, idx: THEO.t.map((_, i) => i) }; }
          return simSamples(nS.value, sched.value);
        };
        const simSamples = (n, kind) => {
          const ts = [], cs = [];
          for (let i = 0; i < n; i++) {
            const u = i / (n - 1), t = 24 * (kind === 'even' ? u : (Math.exp(3 * u) - 1) / (Math.exp(3) - 1));
            ts.push(t); cs.push(model(t));
          }
          return { ts, cs };
        };
        sA.onClick((x, y) => {
          if (src.value !== 'real') return;
          let best = -1, bd = 16;
          THEO.t.forEach((t, i) => { const d = Math.hypot(sA.X(t) - sA.X(x), sA.Y(THEO.c[i]) - sA.Y(y)); if (d < bd) { bd = d; best = i; } });
          if (best > 0) { if (on[best] && on.filter(Boolean).length <= 4) return; on[best] = !on[best]; v.invalidate(); }
        });
        const shade = (ts, cs, method) => {
          for (let i = 1; i < ts.length; i++) {
            const t0 = ts[i - 1], t1 = ts[i], c0 = cs[i - 1], c1 = cs[i];
            const pts = [[t0, 0]];
            if (method === 'log' && c1 < c0 && c1 > 0) for (let j = 0; j <= 14; j++) { const u = j / 14; pts.push([t0 + u * (t1 - t0), c0 * Math.pow(c1 / c0, u)]); }
            else pts.push([t0, c0], [t1, c1]);
            pts.push([t1, 0]);
            sA.poly(pts, { fill: 'accent', fillAlpha: 0.2, color: 'accent', width: 1 });
          }
        };
        let lastInfo = null;
        v.render(() => {
          const S = samples(), est = aucEstimate(S.ts, S.cs, meth.value);
          const ref = src.value === 'real' ? truth : D / (Vf * kf);
          const n = S.ts.length, tl = S.ts[n - 1], cl = S.cs[n - 1];
          sched.el.hidden = src.value === 'real'; nS.el.hidden = src.value === 'real';
          // ---- A
          shade(S.ts, S.cs, meth.value);
          if (est.tail > 0) {
            const pts = [[tl, 0], [tl, cl]];
            for (let j = 1; j <= 60; j++) { const t = tl + (j / 60) * (48 - tl); pts.push([t, cl * Math.exp(-est.kz * (t - tl))]); }
            pts.push([48, 0]);
            sA.poly(pts, { fill: 'green', fillAlpha: 0.2, color: 'green', width: 1, dash: [4, 3] });
          }
          sA.fn(model, { domain: [0, 48], color: 'muted', width: 1.4, dash: [5, 4] });
          if (src.value === 'real') THEO.t.forEach((t, i) => sA.dot(t, THEO.c[i], { r: on[i] ? 5 : 4.5, color: on[i] ? 'gold' : 'muted', hollow: !on[i] }));
          else sA.dots(S.ts.map((t, i) => [t, S.cs[i]]), { r: 4.5, color: 'gold' });
          sA.text(`AUC ≈ ${v.fix(est.total, 1)} mg·h/L`, 47.5, 12.4, { size: 11.5, color: 'ink', align: 'right', baseline: 'top', weight: 600 });
          // ---- B (semilog)
          const pos = S.ts.map((t, i) => [t, S.cs[i]]).filter((p) => p[1] > 0);
          sB.fn(model, { domain: [0.02, 48], color: 'muted', width: 1.4, dash: [5, 4] });
          if (est.kz > 0) { const t0 = S.ts[n - 3]; sB.fn((t) => est.c0 * Math.exp(-est.kz * t), { domain: [Math.max(0, t0 - 6), 48], color: 'green', width: 2 }); }
          sB.dots(pos, { r: 4.5, color: 'gold' });
          if (src.value === 'real') THEO.t.forEach((t, i) => { if (!on[i] && t > 0) sB.dot(t, THEO.c[i], { r: 4, color: 'muted', hollow: true }); });
          sB.corner(est.kz > 0 ? `k_z = ${v.fix(est.kz, 3)} /h · t½ = ${v.fix(Math.LN2 / est.kz, 1)} h` : 'no valid terminal slope', 'tr', { color: 'green' });
          // ---- C (convergence)
          let curve = [];
          if (src.value === 'sim') {
            sC.setView([3, 40], [0.4, 1.8]);
            for (let m = 3; m <= 40; m++) { const q = simSamples(m, sched.value); curve.push([m, aucEstimate(q.ts, q.cs, meth.value).total / ref]); }
            sC.setLabels('number of samples $n$');
            sC.hline(1, { color: 'green', width: 1.5 });
            sC.path(curve, { color: 'accent', width: 2 });
            sC.dot(n, curve[n - 3][1], { r: 5.5, color: 'gold' });
          } else {
            sC.setView([3, 11], [0.4, 1.8]);
            sC.setLabels('earliest samples used');
            sC.hline(1, { color: 'green', width: 1.5 });
            const all = THEO.t;
            for (let m = 3; m <= all.length; m++) { const e = aucEstimate(all.slice(0, m), THEO.c.slice(0, m), meth.value); curve.push([m, e.total / ref]); }
            sC.path(curve, { color: 'accent', width: 2 }); sC.dots(curve, { r: 3.5, color: 'accent' });
          }
          lastInfo = { est, ref, n };
        }, {});
        v.legend([['accent', 'trapezoids (sampled interval)', { area: true }], ['green', 'extrapolated tail', { area: true }], ['muted', src.value === 'real' ? 'fitted Bateman curve' : 'exact curve', { dash: true }], ['gold', 'samples', { dot: true }]]);
        v.readout(() => {
          const { est, ref, n } = lastInfo;
          return `$n = ${n}$ samples: $\\mathrm{AUC}_{0\\to t_\\text{last}} = ${v.fix(est.body, 1)}$ + tail $${v.fix(est.tail, 1)}$ = $${v.fix(est.total, 1)}$ mg·h/L; reference $\\mathrm{AUC}_{0\\to\\infty} = D/(V k) = ${v.fix(ref, 1)}$ (${src.value === 'real' ? 'from the model fitted to all samples' : 'exact'}), ratio $${v.fix(est.total / ref, 3)}$. Apparent clearance $D/\\mathrm{AUC} = ${v.fix(D / est.total, 2)}$ L/h (here $D = ${v.fix(D, 0)}$ mg, oral, so this is $CL/F$).`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.3
    {
      num: '1.3',
      kind: 'Definition',
      name: 'Volume of distribution',
      statement: String.raw`The **apparent volume of distribution** of a drug is the proportionality constant between the amount of drug in the body and the plasma concentration, $V = A/C$. After an intravenous bolus of dose $D$ it is $V = D/C(0)$, with $C(0)$ found by extrapolating the decline back to time zero. It is not a real volume. If the drug stays in plasma, $V\approx 3$ L; if it spreads through all body water, $V\approx 42$ L (70 kg adult); if tissues bind it much more strongly than plasma does, $V$ can be hundreds or thousands of litres. In a model where the body is plasma (volume $V_p$) in equilibrium with tissue water (volume $V_T$) with tissue-to-plasma concentration ratio $K_p$, $V = V_p + K_p V_T$.`,
      idea: String.raw`At equilibrium the same plasma concentration is paired with a tissue concentration $K_p C$, so the amount in the body is $A = C\,V_p + K_p C\,V_T$. Dividing by $C$ gives $V = V_p + K_p V_T$. A drug that is bound or dissolved in tissue (fat, bone, cell proteins) has a large $K_p$: most of the dose hides outside the blood and the plasma concentration is low, which is the same as saying the dose was "diluted" into a huge volume. Polar drugs that cannot enter cells, or that stick to albumin, have $K_p<1$ and a small volume.`,
      caption: String.raw`A dose of 200 dots (1 dot = 0.5 % of the dose) is dissolved in a body with 3 L of plasma and 39 L of tissue water; the box areas are drawn to scale. Dot density is concentration. Drag the **tissue-to-plasma ratio** $K_p$, or click a drug (preset values for a 70 kg adult): the more tissue binding, the sparser the plasma and the larger the apparent volume $V = D/C$, shown on the log ruler against plasma, extracellular fluid and total body water. Chloroquine's apparent volume, taken here as 200 L/kg (published estimates run from about 100 to several hundred L/kg), is hundreds of times total body water.`,
      scope: String.raw`$V$ is a ratio defined by a distribution that has reached equilibrium; for a real drug the value depends on the model used (initial volume, steady-state volume, terminal volume differ for multi-compartment drugs, ch. 3).`,
      deps: ['pharm-1.2'],
      refs: ['Rowland–Tozer', 'Rang, Pharmacology (2003) p. 103'],
      tags: ['volume of distribution'],
      viz(v) {
        const Vp = BODY.plasma, VT = BODY.tbw - BODY.plasma;
        const PRE = [
          ['warfarin', 'warfarin', 0.14], ['gentamicin', 'gentamicin', 0.25], ['theophylline', 'theophylline', 0.5], ['caffeine', 'caffeine', 0.6],
          ['digoxin', 'digoxin', 7], ['amiodarone', 'amiodarone', 66], ['chloroquine', 'chloroquine', 200],
        ].map(([id, name, lkg]) => ({ id, name, lkg, V: lkg * BODY.kg, Kp: (lkg * BODY.kg - Vp) / VT }));
        const sel = v.select('drug', [...PRE.map((p) => ({ value: p.id, label: p.name })), { value: 'free', label: 'free' }], 'warfarin');
        let prog = false;
        const Kp = v.slider('tissue : plasma ratio $K_p$', 0.01, 1000, PRE[0].Kp, { log: true, sig: 2, fmt: (x) => sig(x, 2), onChange: () => { if (!prog) sel.value = 'free'; } });
        const dose = v.slider('dose', 10, 1000, 100, { log: true, sig: 2, fmt: (x) => `${Math.round(x)} mg` });
        const rng = v.rng(7);
        const N = 200;
        const dotsP = Array.from({ length: N }, () => [rng(), rng()]), dotsT = Array.from({ length: N }, () => [rng(), rng()]);
        const sb = v.stage({ x: [0, 10], y: [0, 6], axes: false, height: 290, weight: 1 });
        const sr = v.stage({ x: [1, 3e4], y: [0, 1], xlog: true, axes: 'box', gutter: { l: 12, r: 8, t: 34, b: 38 }, xlabel: 'apparent volume of distribution (L)', height: 290, weight: 1.15, yticks: [] });
        const pick = (id) => PRE.find((p) => p.id === id);
        let lastSel = sel.value;
        v.render(() => {
          if (sel.value !== lastSel) { lastSel = sel.value; if (sel.value !== 'free') { prog = true; Kp.set(pick(sel.value).Kp); prog = false; } }
          const kp = Kp.value, V = Vp + kp * VT, fp = Vp / V, np = Math.round(N * fp), nt = N - np;
          // ---- boxes (areas ∝ volumes)
          const x0 = 0.5, wP = 0.6, xT0 = 1.9, wT = 7.7, y0 = 1.2, y1 = 4.7;
          sb.rect(x0, y0, x0 + wP, y1, { fill: 'accent', fillAlpha: 0.07, color: 'accent', width: 1.8 });
          sb.rect(xT0, y0, xT0 + wT, y1, { fill: 'purple', fillAlpha: 0.07, color: 'purple', width: 1.8 });
          sb.dots(dotsP.slice(0, np).map(([a, b]) => [x0 + 0.06 + a * (wP - 0.12), y0 + 0.08 + b * (y1 - y0 - 0.16)]), { r: 2.6, color: 'accent' });
          sb.dots(dotsT.slice(0, nt).map(([a, b]) => [xT0 + 0.1 + a * (wT - 0.2), y0 + 0.08 + b * (y1 - y0 - 0.16)]), { r: 2.6, color: 'purple' });
          sb.text('plasma, 3 L', 0.15, y1 + 0.2, { size: 11, color: 'accent', align: 'left', baseline: 'bottom', weight: 600 });
          sb.text('tissue water, 39 L', xT0 + wT / 2, y1 + 0.2, { size: 11, color: 'purple', align: 'center', baseline: 'bottom', weight: 600 });
          sb.text(`${v.fix(100 * fp, fp < 0.01 ? 2 : 1)} % of the dose in plasma`, x0, y0 - 0.2, { size: 11, color: 'accent', align: 'left', baseline: 'top' });
          sb.text(`${v.fix(100 * (1 - fp), (1 - fp) > 0.99 ? 2 : 1)} % in tissue`, xT0 + wT, y0 - 0.2, { size: 11, color: 'purple', align: 'right', baseline: 'top' });
          sb.text(`C(plasma) = D/V = ${sig(dose.value / V, 3)} mg/L`, 5, 0.35, { size: 12, color: 'ink', align: 'center', baseline: 'middle', weight: 600 });
          // ---- ruler
          const refs = [[BODY.plasma, 'plasma 3 L', 'accent'], [BODY.ecf, 'ECF 14 L', 'teal'], [BODY.tbw, 'body water 42 L', 'green']];
          refs.forEach(([x, lab, col], i) => { sr.vline(x, { color: col, width: 1.6, dash: [5, 3] }); sr.text(lab, x, 0.98 - 0.085 * i, { size: 10.5, color: col, align: 'left', baseline: 'top', dx: 4 }); });
          sr.vband(BODY.plasma, BODY.tbw, { color: 'green', alpha: 0.05 });
          const rows = PRE.length;
          PRE.forEach((p, i) => {
            const y = 0.66 - i * (0.54 / rows), chosen = sel.value === p.id;
            sr.dot(p.V, y, { r: chosen ? 6 : 4, color: chosen ? 'gold' : 'faint', hollow: !chosen });
            sr.text(`${p.name} (${p.lkg} L/kg)`, p.V, y, { size: 10.5, color: chosen ? 'ink' : 'muted', align: p.V > 400 ? 'right' : 'left', baseline: 'middle', dx: p.V > 400 ? -9 : 9, weight: chosen ? 700 : 400 });
          });
          sr.dot(V, 0.07, { r: 7, color: 'orange' });
          sr.text(`this model: V = ${sig(V, 3)} L = ${sig(V / BODY.tbw, 2)} × body water`, V, 0.07, { size: 11, color: 'orange', align: V > 200 ? 'right' : 'left', baseline: 'middle', dx: V > 200 ? -11 : 11, weight: 600 });
        });
        v.legend([['accent', 'drug in plasma', { dot: true }], ['purple', 'drug in tissue', { dot: true }], ['gold', 'selected drug', { dot: true }], ['orange', 'this model', { dot: true }]]);
        v.readout(() => {
          const kp = Kp.value, V = Vp + kp * VT;
          return `$V = V_p + K_p V_T = 3 + ${sig(kp, 3)}\\times 39 = ${sig(V, 3)}$ L; after a ${Math.round(dose.value)} mg bolus $C(0) = D/V = ${sig(dose.value / V, 3)}$ mg/L, and the plasma holds only $V_p/V = ${v.fix(100 * Vp / V, 2)}$ % of the body's drug. Preset values are rounded literature figures (Rang 2003 table, drug labels); real drugs are not one-tissue systems.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.4
    {
      num: '1.4',
      kind: 'Definition',
      name: 'Clearance',
      statement: String.raw`The **clearance** of a drug by an organ or by the whole body is the volume of blood (or plasma) from which the drug is completely removed per unit time, $CL = \text{rate of elimination}/C$. Equivalently, if blood flows through an eliminating organ at rate $Q$ with inflow concentration $C_{\text{in}}$ and outflow concentration $C_{\text{out}}$, the organ removes $Q(C_{\text{in}}-C_{\text{out}})$ per unit time and its clearance is $CL = Q\,E$, where the **extraction ratio** is $E=(C_{\text{in}}-C_{\text{out}})/C_{\text{in}}$. Clearance cannot exceed the flow, since $E \le 1$. For a first-order drug it is a constant: the elimination rate is directly proportional to concentration.`,
      idea: String.raw`Mass balance across the organ. Per minute, $Q\,C_{\text{in}}$ enters and $Q\,C_{\text{out}}$ leaves, so the difference is eliminated. Dividing the removal rate by the concentration presented to the organ turns it into a volume per time, which can be read as the part of the stream that is scrubbed clean ($E\cdot Q$) with the rest passing untouched. Clearance is therefore a property of the organ and the drug (flow and efficiency), not of the dose, and clearances of parallel organs add (3.8). It is the number that connects exposure to dose, as the next result shows.`,
      caption: String.raw`Plasma flows left to right through an eliminating organ. Each dot is a drug molecule; the fraction $E$ of them is removed in the organ (orange region: the part of the stream that is cleared, of volume $E\,Q$ per minute). Choose a drug and organ, or set the flow $Q$ and extraction $E$ yourself, then drag the inflow concentration on the right: the removal rate is a straight line through the origin whose **slope is the clearance**. Compare inulin (filtered, $E\approx 0.2$), p-aminohippurate (filtered and secreted, $E\approx 0.9$) and warfarin (barely extracted by the liver).`,
      scope: String.raw`$CL=QE$ holds for any organ in a steady state. $E$ itself is constant, independent of concentration, only when the removal process is not saturated (first-order kinetics).`,
      deps: ['pharm-1.2', 'physio-7.3'],
      refs: ['Rowland–Tozer'],
      tags: ['clearance', 'extraction'],
      viz(v) {
        const PRE = {
          inulin: { Q: 600, E: 0.21, lab: 'inulin · kidney (plasma flow)' },
          pah: { Q: 600, E: 0.9, lab: 'p-aminohippurate · kidney' },
          lido: { Q: 1500, E: 0.7, lab: 'lidocaine · liver (blood flow)' },
          warf: { Q: 1500, E: 0.002, lab: 'warfarin · liver' },
        };
        const sel = v.select('example', [{ value: 'inulin', label: 'inulin, kidney' }, { value: 'pah', label: 'p-aminohippurate, kidney' }, { value: 'lido', label: 'lidocaine, liver' }, { value: 'warf', label: 'warfarin, liver' }, { value: 'free', label: 'free' }], 'inulin');
        let prog = false;
        const Qs = v.slider('flow $Q$', 100, 2000, 600, { step: 10, fmt: (x) => `${Math.round(x)} mL/min`, onChange: () => { if (!prog) sel.value = 'free'; } });
        const Es = v.slider('extraction $E$', 0, 1, 0.21, { step: 0.005, fmt: (x) => v.fix(x, 3), onChange: () => { if (!prog) sel.value = 'free'; } });
        const sb = v.stage({ x: [0, 10], y: [0, 6], axes: false, height: 300, weight: 1.15 });
        const sr = v.stage({ x: [0, 10], y: [0, 10], axes: 'box', gutter: true, xlabel: 'concentration entering the organ (mg/L)', ylabel: 'elimination rate (mg/min)', height: 300, weight: 1 });
        const hC = sr.handle(4, 0, { color: 'gold', r: 8, label: 'C', constrain: { x: [0.2, 10], y: [0, 0] } });
        let last = sel.value;
        const hash = (i) => { const s = Math.sin(i * 12.9898 + 4.1) * 43758.5453; return s - Math.floor(s); };
        const N = 26, L = 9.4, gap = L / N;
        v.animate((t) => {
          if (sel.value !== last) { last = sel.value; if (sel.value !== 'free') { prog = true; Qs.set(PRE[sel.value].Q); Es.set(PRE[sel.value].E); prog = false; } }
          const Q = Qs.value, E = Es.value, Cin = hC.x, Cout = Cin * (1 - E), CL = Q * E; // mL/min
          const yc = 3, hh = 1.7;
          // vessel and organ
          sb.rect(0.3, yc - hh / 2, 9.7, yc + hh / 2, { fill: 'accent', fillAlpha: 0.05, color: 'faint', width: 1.2 });
          sb.rect(0.3, yc - hh / 2, 3.6, yc + hh / 2, { fill: 'accent', fillAlpha: 0.04 + 0.22 * (Cin / 10), stroke: false });
          sb.rect(6.4, yc - hh / 2, 9.7, yc + hh / 2, { fill: 'accent', fillAlpha: 0.04 + 0.22 * (Cout / 10), stroke: false });
          sb.rect(3.6, yc - 1.45, 6.4, yc + 1.45, { fill: 'orange', fillAlpha: 0.07, color: 'orange', width: 2, radius: 10 });
          // cleared part of the stream (cross-section at the inlet)
          sb.rect(0.3, yc - hh / 2, 3.6, yc - hh / 2 + E * hh, { fill: 'orange', fillAlpha: 0.3, color: 'orange', width: 1 });
          sb.text('organ', 5, yc + 1.45, { size: 11.5, color: 'orange', align: 'center', baseline: 'bottom', dy: -4, weight: 600 });
          sb.text(`cleared: ${Math.round(CL)} mL/min`, 0.45, yc - hh / 2 - 0.15, { size: 10.5, color: 'orange', align: 'left', baseline: 'top' });
          sb.arrow(0.0, yc, 0.3, yc, { color: 'muted', width: 2, head: 7 });
          sb.arrow(9.7, yc, 10.0, yc, { color: 'muted', width: 2, head: 7 });
          sb.text(`C_in = ${v.fix(Cin, 2)}`, 1.9, yc + hh / 2 + 0.2, { size: 11.5, color: 'ink', align: 'center', baseline: 'bottom', weight: 600 });
          sb.text(`C_out = ${v.fix(Cout, 2)}`, 8.1, yc + hh / 2 + 0.2, { size: 11.5, color: 'ink', align: 'center', baseline: 'bottom', weight: 600 });
          sb.text(`flow Q = ${Math.round(Q)} mL/min`, 5, 0.85, { size: 11.5, color: 'muted', align: 'center', baseline: 'middle' });
          // molecules: each is removed in the organ with probability E (fixed random number per molecule)
          const keep = [], gone = [];
          const speed = 1.5, ph = t * speed;
          for (let j = 0; j < N; j++) {
            const s = ph + j * gap, lap = Math.floor(s / L), x = 0.3 + (s - lap * L), id = j + N * lap + 7 * j * j;
            const u = hash(id), yy = yc + (hash(id + 0.5) - 0.5) * (hh - 0.3);
            if (u < E && x > 5) { const d = x - 5; const ty = yy - d * 1.15; if (ty > 0.7) gone.push([5 + d * 0.15, ty]); }
            else keep.push([x, yy]);
          }
          sb.dots(keep, { r: 3.3, color: 'accent' });
          sb.dots(gone, { r: 3.3, color: 'orange', alpha: 0.7 });
          // ---- rate line
          const rate = (CL / 1000) * 10;
          const ymax = Math.max(CL / 1000 * 10 * 1.15, 0.02);
          sr.setView([0, 10], [0, ymax]);
          sr.line(0, 0, 10, (CL / 1000) * 10, { color: 'orange', width: 2.4 });
          const C = hC.x, r = (CL / 1000) * C;
          hC.set(C, 0);
          sr.vline(C, { color: 'gold', dash: [4, 3], width: 1 });
          sr.hline(r, { color: 'gold', dash: [4, 3], width: 1 });
          sr.dot(C, r, { r: 6, color: 'gold' });
          sr.text(`rate = CL·C = ${sig(r, 3)} mg/min`, C, r, { size: 11, color: 'ink', align: C > 6 ? 'right' : 'left', baseline: 'bottom', dx: C > 6 ? -8 : 8, dy: -8, weight: 600 });
          sr.text(`slope = CL = ${sig(CL / 1000, 3)} L/min`, 9.8, ymax * 0.1, { size: 11, color: 'orange', align: 'right', baseline: 'middle', weight: 600 });
        }, { period: 14, still: 3 });
        v.legend([['accent', 'drug in the stream', { dot: true }], ['orange', 'molecules removed in the organ', { dot: true }]]);
        v.readout(() => {
          const Q = Qs.value, E = Es.value, C = hC.x, CL = Q * E;
          const tHalf = Math.LN2 * 42000 / Math.max(CL, 1e-9) / 60;
          return `$CL = Q\\,E = ${Math.round(Q)}\\times ${v.fix(E, 3)} = ${sig(CL, 3)}$ mL/min. Mass balance: $Q(C_\\text{in} - C_\\text{out}) = ${sig(Q * (C - C * (1 - E)) / 1000, 3)}$ mg/min $= CL\\cdot C_\\text{in} = ${sig(CL * C / 1000, 3)}$ mg/min. A body of 42 L cleared at this rate alone would have a half-life of ${tHalf < 100 ? v.fix(tHalf, 1) + ' h' : Math.round(tHalf) + ' h'} ($0.693\\,V/CL$, next chapter).`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.5
    {
      num: '1.5',
      kind: 'Theorem',
      name: 'Dose = clearance × AUC',
      statement: String.raw`For a drug eliminated with a constant clearance $CL$ (first-order kinetics), the total amount eliminated from the body equals the amount that entered it, $D = CL\int_0^\infty C(t)\,dt$. Hence $\mathrm{AUC}_{0\to\infty}=D/CL$, whatever the route, rate or pattern of administration and whatever the volume of distribution, provided the dose is completely available to the circulation (for an oral dose, $F\,D$ replaces $D$). Conversely, $CL = D/\mathrm{AUC}$ is how clearance is measured.`,
      idea: String.raw`Let $A(t)$ be the amount in the body, so $A' = I(t) - CL\,C(t)$ where $I$ is the input rate. Integrate from $0$ to $\infty$: the body starts and ends empty ($A(0)=A(\infty)=0$), so $0 = \int I\,dt - CL\int C\,dt$, which is the claim. Only the elimination law "rate $=CL\cdot C$" was used, not the shape of $C$, which is why the input pattern and the volume (the compartment structure) drop out. If elimination saturates, the amount eliminated is still the dose, but the rate is no longer a constant times $C$, so $D/\mathrm{AUC}$ is no longer a fixed clearance.`,
      caption: String.raw`**Draw the input**: drag the orange handles to shape the rate at which drug enters over the first 12 h (or press a preset), and add an intravenous bolus with the slider. The middle panel shows the concentration and its shaded area; the right panel compares the running total entered (dashed) with the total eliminated, $CL\int_0^t C$ (solid). They meet at the dose. Change the volume $V$ and the curve changes shape but not the area; change $CL$ and the area scales as $1/CL$. Turn on **saturable elimination** (hypothesis broken) and the area no longer obeys $D/CL$.`,
      scope: String.raw`Linear kinetics (constant $CL$), complete availability, a single dose or any superposition of doses; the area runs to infinity, which here includes the part of the curve beyond the plotted 48 h.`,
      deps: ['pharm-1.4', 'pma-6.21'],
      refs: ['Rowland–Tozer'],
      tags: ['AUC', 'clearance'],
      viz(v) {
        const CL = v.slider('clearance $CL$', 1, 30, 6, { log: true, sig: 2, fmt: (x) => `${sig(x, 2)} L/h` });
        const Vs = v.slider('volume $V$', 10, 150, 40, { log: true, sig: 2, fmt: (x) => `${Math.round(x)} L` });
        const bol = v.slider('IV bolus', 0, 500, 0, { step: 10, fmt: (x) => `${Math.round(x)} mg` });
        const sat = v.toggle('saturable elimination (break linearity)', false);
        const Km = v.slider('$K_m$', 1, 20, 4, { log: true, sig: 2, fmt: (x) => `${sig(x, 2)} mg/L` });
        const TS = [0, 2, 4, 6, 8, 10, 12];
        const PRE = {
          bolus: { b: 300, y: [0, 0, 0, 0, 0, 0, 0] }, inf: { b: 0, y: [50, 50, 50, 50, 50, 50, 0] },
          oral: { b: 0, y: [100, 55, 30, 16, 9, 5, 3] }, two: { b: 0, y: [0, 90, 20, 0, 90, 20, 0] },
        };
        const sI = v.stage({ x: [0, 48], y: [0, 100], axes: 'box', gutter: true, xlabel: 'time (h)', ylabel: 'input rate (mg/h)', height: 280, weight: 1, xticks: [0, 12, 24, 36, 48], yticks: [0, 25, 50, 75, 100] });
        const sC = v.stage({ x: [0, 48], y: [0, 10], axes: 'box', gutter: true, xlabel: 'time (h)', ylabel: 'concentration (mg/L)', height: 280, weight: 1, xticks: [0, 12, 24, 36, 48] });
        const sA = v.stage({ x: [0, 48], y: [0, 500], axes: 'box', gutter: true, xlabel: 'time (h)', ylabel: 'cumulative amount (mg)', height: 280, weight: 1, xticks: [0, 12, 24, 36, 48] });
        const hs = TS.map((t, i) => sI.handle(t, PRE.oral.y[i], { color: 'orange', r: 7, constrain: 'y' }));
        const clampH = () => hs.forEach((h) => { if (h.y < 0) h.set(h.x, 0); if (h.y > 100) h.set(h.x, 100); });
        const setPre = (k) => { PRE[k].y.forEach((y, i) => hs[i].set(TS[i], y)); bol.set(PRE[k].b); };
        v.button('IV bolus', () => setPre('bolus'));
        v.button('IV infusion', () => setPre('inf'));
        v.button('oral-like', () => setPre('oral'));
        v.button('two doses', () => setPre('two'));
        bol.set(0);
        const rate = (t) => {
          if (t >= 12) return 0;
          let i = Math.min(5, Math.floor(t / 2)); const f = (t - TS[i]) / 2;
          return hs[i].y * (1 - f) + hs[i + 1].y * f;
        };
        const get = memo();
        function run() {
          const cl = CL.value, V = Vs.value, nl = sat.value, km = Km.value, vmax = cl * km;
          const key = `${hs.map((h) => Math.round(h.y * 4)).join(',')}|${bol.value}|${cl}|${V}|${nl}|${km}`;
          return get(key, () => {
            const el = (C) => (nl ? (vmax * C) / (km + C) : cl * C);
            let y = [bol.value / V, 0, 0, 0, 0]; // C, ∫C, ∫elim, ∫input, (unused)
            const f = (s, t) => [(rate(t) - el(Math.max(0, s[0]) )) / V, s[0], el(Math.max(0, s[0])), rate(t), 0];
            const out = { t: [], C: [], auc: [], elim: [], inp: [] };
            let t = 0, rec = 0;
            for (let i = 0; i < 200000; i++) {
              if (t >= rec - 1e-9 && t <= 72) { out.t.push(t); out.C.push(y[0]); out.auc.push(y[1]); out.elim.push(y[2]); out.inp.push(bol.value + y[3]); rec += 0.2; }
              if (t > 12 && y[0] * V < 1e-5 * Math.max(1, bol.value + y[3])) break;
              const h = t < 72 ? 0.02 : 0.1;
              y = rk4(f, y, t, h); t += h;
            }
            const D = bol.value + y[3], tail = (y[0] * V) / cl;
            return { ...out, D, aucTotal: y[1] + tail, elimTotal: y[2] + y[0] * V, tEnd: t, cl, V, nl };
          });
        }
        v.render(() => {
          clampH();
          const R = run();
          // input panel
          const pts = [[0, 0]]; for (let t = 0; t <= 12.001; t += 0.25) pts.push([t, rate(t)]); pts.push([12, 0]);
          sI.poly(pts, { fill: 'orange', fillAlpha: 0.18, color: 'orange', width: 2 });
          if (bol.value > 0) { sI.arrow(0.4, 0, 0.4, 100, { color: 'red', width: 3, head: 9 }); sI.text(`bolus ${Math.round(bol.value)} mg`, 1.2, 95, { size: 11, color: 'red', align: 'left', baseline: 'top', weight: 600 }); }
          // concentration + AUC
          const cmax = Math.max(1, ...R.C), top = Math.max(2, Math.ceil(cmax * 1.15));
          sC.setView([0, 48], [0, top]);
          const n = R.t.findIndex((t) => t > 48), nn = n < 0 ? R.t.length : n;
          const apts = []; for (let j = 0; j < nn; j++) apts.push([R.t[j], R.C[j]]);
          sC.poly([[0, 0], ...apts, [apts[apts.length - 1][0], 0]], { fill: 'accent', fillAlpha: 0.22, stroke: false });
          trace(sC, R.t.slice(0, nn), R.C.slice(0, nn), { color: 'accent', width: 2.4 });
          // cumulative
          const dTop = Math.max(100, Math.ceil(R.D / 100) * 100);
          sA.setView([0, 48], [0, dTop * 1.05]);
          sA.hline(R.D, { color: 'muted', dash: [4, 3], width: 1 });
          trace(sA, R.t.slice(0, nn), R.inp.slice(0, nn), { color: 'accent', width: 2, dash: [6, 4] });
          trace(sA, R.t.slice(0, nn), R.elim.slice(0, nn), { color: 'green', width: 2.6 });
          sA.text(`dose ${sig(R.D, 4)} mg`, 47.5, R.D, { size: 11, color: 'muted', align: 'right', baseline: 'bottom', dy: -3 });
        });
        v.legend([['orange', 'input rate', { area: true }], ['accent', 'concentration (area = AUC)', { area: true }], ['accent', 'cumulative input', { dash: true }], ['green', 'cumulative eliminated']]);
        v.readout(() => {
          const R = run(), cl = R.cl;
          if (!R.nl) return `Dose $D = ${sig(R.D, 4)}$ mg · $\\mathrm{AUC}_{0\\to\\infty} = ${sig(R.aucTotal, 4)}$ mg·h/L · $CL\\times\\mathrm{AUC} = ${sig(cl * R.aucTotal, 4)}$ mg · ratio $CL\\cdot\\mathrm{AUC}/D = ${v.fix(cl * R.aucTotal / R.D, 4)}$ (numerical integration; $V = ${Math.round(R.V)}$ L has no effect on the area). Total eliminated $= ${sig(R.elimTotal, 4)}$ mg.`;
          return `Saturable elimination: $D = ${sig(R.D, 4)}$ mg, $\\mathrm{AUC} = ${sig(R.aucTotal, 4)}$ mg·h/L, so $CL_\\text{low}\\times\\mathrm{AUC}/D = ${v.fix(cl * R.aucTotal / R.D, 3)}$ ≠ 1: the effective clearance $D/\\mathrm{AUC} = ${sig(R.D / R.aucTotal, 3)}$ L/h is below the low-concentration clearance ${sig(cl, 3)} L/h and depends on the dose. The eliminated total still reaches the dose (solid line).`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.6
    {
      num: '1.6',
      kind: 'Definition',
      name: 'Bioavailability',
      statement: String.raw`The **(absolute) bioavailability** $F$ of a drug given by a non-intravenous route is the fraction of the dose that reaches the systemic circulation unchanged. It is measured by comparing exposures after an oral and an intravenous dose of the same drug in the same person: $F = \dfrac{\mathrm{AUC}_{\text{po}}\,D_{\text{iv}}}{\mathrm{AUC}_{\text{iv}}\,D_{\text{po}}}$. For an oral dose it is the product of three survival fractions: absorbed through the gut wall ($F_a$), escaping metabolism in the gut wall ($F_g$) and escaping extraction by the liver on the first pass ($F_h = 1-E_h$), so $F = F_a F_g F_h$.`,
      idea: String.raw`The intravenous dose delivers everything to the blood, so its area is $D_{\text{iv}}/CL$ (1.5) and defines the reference. An oral dose delivers only $F D_{\text{po}}$ to the circulation, and the same clearance acts on it, so its area is $F D_{\text{po}}/CL$. The ratio of dose-normalized areas is $F$, with no model of absorption needed. Splitting $F$ into factors follows the dose through the successive barriers: every molecule must cross the gut wall, survive the enzymes there and then survive one pass through the liver before it counts.`,
      caption: String.raw`A hundred tablets' worth of drug on the left: green dots reach the circulation, the others are lost to incomplete absorption (red), gut-wall metabolism (purple) or the liver's first pass (orange). On the right, the same dose is given by mouth and intravenously; the AUCs are integrated numerically (trapezoids with an extrapolated tail) and their ratio is $F$. Pick a drug or drag the three survival fractions, and change the absorption rate: the peak moves but the area ratio $F$ does not. Only the total $F$ of each preset is a literature figure; its split into $F_a$, $F_g$, $F_h$ is illustrative.`,
      scope: String.raw`Needs linear kinetics with the same clearance after both routes, and the same subject. Slow or incomplete absorption changes the shape of the curve, never the area for a given $F$. If the drug is also cleared by the lung or gut before reaching the sampling site, $F$ can exceed or fall short of what the liver alone predicts.`,
      deps: ['pharm-1.5'],
      refs: ['Rowland–Tozer'],
      tags: ['bioavailability', 'first-pass'],
      viz(v) {
        const PRE = {
          propranolol: { Fa: 1, Fg: 1, Eh: 0.74, V: 280, CL: 60, ka: 1.5, note: 'F ≈ 0.26 (textbooks quote about 0.2–0.3)' },
          midazolam: { Fa: 1, Fg: 0.55, Eh: 0.2, V: 70, CL: 27, ka: 3, note: 'F ≈ 0.44 (sources differ)' },
          morphine: { Fa: 0.85, Fg: 0.9, Eh: 0.6, V: 245, CL: 72, ka: 1, note: 'F ≈ 0.3 (textbooks quote about 0.2–0.35)' },
          lidocaine: { Fa: 1, Fg: 1, Eh: 0.65, V: 90, CL: 45, ka: 2, note: 'F ≈ 0.35 (sources differ)' },
          atenolol: { Fa: 0.5, Fg: 1, Eh: 0, V: 49, CL: 5.2, ka: 0.8, note: 'F ≈ 0.5 (sources quote 0.5–0.6)' },
          digoxin: { Fa: 0.7, Fg: 1, Eh: 0, V: 490, CL: 8.5, ka: 1.5, note: 'F ≈ 0.7' },
          warfarin: { Fa: 1, Fg: 1, Eh: 0, V: 9.8, CL: 0.17, ka: 2, note: 'F ≈ 1' },
        };
        const names = Object.keys(PRE);
        const sel = v.select('drug', [...names.map((n) => ({ value: n, label: n })), { value: 'free', label: 'free' }], 'propranolol');
        let prog = false;
        const mk = (label, init, opt = {}) => v.slider(label, 0, opt.max ?? 1, init, { step: 0.01, fmt: (x) => `${v.fix(x, 2)}`, onChange: () => { if (!prog) sel.value = 'free'; } });
        const Fa = mk('absorbed, $F_a$', PRE.propranolol.Fa), Fg = mk('survives gut wall, $F_g$', PRE.propranolol.Fg), Eh = mk('hepatic extraction $E_h$', PRE.propranolol.Eh, { max: 0.98 });
        const ka = v.slider('absorption rate $k_a$', 0.2, 6, 1.5, { log: true, sig: 2, fmt: (x) => `${sig(x, 2)} /h` });
        const si = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 300, weight: 0.8, minWidth: 230 });
        const sc = v.stage({ x: [0, 20], y: [0, 1], axes: 'box', gutter: true, xlabel: 'time (h)', ylabel: 'concentration (mg/L)', height: 300, weight: 1.3 });
        const I = v.icons(si, { n: 100, order: 'group', shape: 'dot', cols: 10, rows: 10 });
        let last = sel.value, info = null, lastPre = 'propranolol';
        v.render(() => {
          if (sel.value !== last) { last = sel.value; if (sel.value !== 'free') { const p = PRE[sel.value]; prog = true; Fa.set(p.Fa); Fg.set(p.Fg); Eh.set(p.Eh); ka.set(p.ka); prog = false; } }
          if (sel.value !== 'free') lastPre = sel.value;
          const V = PRE[lastPre].V, CL = PRE[lastPre].CL, k = CL / V, Dd = 100;
          const F = Fa.value * Fg.value * (1 - Eh.value);
          const nUn = Math.round(100 * (1 - Fa.value)), nGut = Math.round(100 * Fa.value * (1 - Fg.value)), nLiv = Math.round(100 * Fa.value * Fg.value * Eh.value);
          const nSys = Math.max(0, 100 - nUn - nGut - nLiv);
          I.set({ groups: [{ n: nSys, color: 'green', label: 'reaches the circulation' }, { n: nLiv, color: 'orange', label: 'lost in the liver (first pass)' }, { n: nGut, color: 'purple', label: 'lost in the gut wall' }, { n: nUn, color: 'red', label: 'not absorbed' }], rest: { color: 'muted', alpha: 0.3 } });
          I.draw(); I.legend();
          // curves
          const tmax = Math.max(4, Math.min(300, 6 * Math.LN2 / k)), nt = 600;
          const ts = [], civ = [], cpo = [];
          for (let i = 0; i <= nt; i++) { const t = (i / nt) * tmax; ts.push(t); civ.push((Dd / V) * Math.exp(-k * t)); cpo.push(bateman(F, Dd, V, ka.value, k, t)); }
          const aivB = trapz(ts, civ), apoB = trapz(ts, cpo);
          const aiv = aivB + civ[nt] / k, apo = apoB + cpo[nt] / k;
          const Fm = apo / aiv;
          const top = (Dd / V) * 1.1;
          sc.setView([0, tmax], [0, top]);
          sc.fn((t) => (Dd / V) * Math.exp(-k * t), { domain: [0, tmax], color: 'blue', width: 2.2, fill: true, fillAlpha: 0.12 });
          sc.fn((t) => bateman(F, Dd, V, ka.value, k, t), { domain: [0, tmax], color: 'orange', width: 2.4, fill: true, fillAlpha: 0.25 });
          sc.text(`AUC iv = ${sig(aiv, 3)} mg·h/L`, tmax * 0.98, top * 0.97, { size: 11, color: 'blue', align: 'right', baseline: 'top', weight: 600 });
          sc.text(`AUC oral = ${sig(apo, 3)} mg·h/L`, tmax * 0.98, top * 0.88, { size: 11, color: 'orange', align: 'right', baseline: 'top', weight: 600 });
          info = { F, Fm, aiv, apo, V, CL, nSys, nLiv, nGut, nUn };
        });
        v.legend([['blue', 'intravenous 100 mg', { area: true }], ['orange', 'oral 100 mg', { area: true }]]);
        v.readout(() => {
          const r = info;
          return `$F = F_a F_g (1-E_h) = ${v.fix(Fa.value, 2)}\\times ${v.fix(Fg.value, 2)}\\times ${v.fix(1 - Eh.value, 2)} = ${v.fix(r.F, 3)}$. From the curves: $\\mathrm{AUC_{po}}/\\mathrm{AUC_{iv}} = ${sig(r.apo, 4)}/${sig(r.aiv, 4)} = ${v.fix(r.Fm, 3)}$. Tablet fates (of 100): ${r.nSys} reach the circulation, ${r.nLiv} lost in the liver, ${r.nGut} in the gut wall, ${r.nUn} not absorbed. Systemic parameters used: $V = ${sig(r.V, 3)}$ L, $CL = ${sig(r.CL, 3)}$ L/h (typical adult values; educational).`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.7
    {
      num: '1.7',
      kind: 'Concept',
      name: 'Plasma protein binding and the unbound fraction',
      statement: String.raw`Many drugs bind reversibly to plasma proteins, chiefly albumin (acidic and neutral drugs) and $\alpha_1$-acid glycoprotein (basic drugs). With binding sites of total concentration $P_T$ and dissociation constant $K_d$, the bound concentration is $B = P_T\,C_u/(K_d + C_u)$ (a Langmuir isotherm), where $C_u$ is the **unbound** concentration. Far below saturation the unbound fraction $f_u = C_u/(C_u + B) \approx 1/(1+P_T/K_d)$ is a constant. Only unbound drug crosses membranes, reaches receptors and is filtered or metabolized (for a drug with a low extraction ratio). A displacing drug that competes for the sites raises $f_u$: the unbound concentration jumps transiently, but at steady state under constant dosing the unbound concentration of a low-extraction drug returns to its original value, since it is set by dosing rate and unbound clearance, while the total concentration falls.`,
      idea: String.raw`Mass action gives the isotherm, and in the linear range $B = (P_T/K_d)C_u$, a fixed fraction. A competitor with concentration $I$ and constant $K_i$ multiplies the apparent $K_d$ by $1+I/K_i$, so $f_u$ rises. For a low-extraction drug the elimination rate is $CL_u\,C_u$, with unbound clearance $CL_u$ unchanged. At steady state input equals output, $R = CL_u\,C_u$, so $C_u = R/CL_u$ does not depend on $f_u$ at all, and the total concentration $C_u/f_u$ drops by the factor by which $f_u$ rose. If the drug is instead cleared as fast as the blood delivers it (high extraction, $CL\approx Q$), the total concentration $R/Q$ is fixed and the unbound one rises permanently.`,
      caption: String.raw`Left: the albumin binding isotherm on a log axis, for warfarin-like binding ($K_d$ chosen so that 99 % is bound), without (blue) and with (orange) a competing drug; the shaded band marks the unbound concentrations of a typical therapeutic range. Right: constant-rate dosing at steady state; at the dashed line the displacer is added. Time is in baseline half-lives. With **enzyme-limited** (low-extraction) clearance the unbound concentration spikes and then returns to baseline while the total concentration settles lower; with **flow-limited** clearance the unbound concentration stays elevated. Lower the albumin to mimic hypoalbuminaemia.`,
      scope: String.raw`One-compartment model with instantaneous equilibrium, a single class of binding sites and competitive displacement; $K_d$ and the tissue binding are tuned to a warfarin-like drug (99 % bound, $V\approx 10$ L), not measured. Educational only; this is not guidance on drug interactions.`,
      deps: ['pharm-1.3', 'mathbio-5.2'],
      refs: ['Rowland–Tozer'],
      tags: ['protein binding', 'displacement'],
      viz(v) {
        const Kd = 6, PT0 = 40000 / 66.5; // µM; albumin 40 g/L, M = 66.5 kg/mol
        const alb = v.slider('albumin', 15, 50, 40, { step: 1, fmt: (x) => `${Math.round(x)} g/L` });
        const disp = v.slider('displacer $I/K_i$', 0, 10, 3, { step: 0.1, fmt: (x) => v.fix(x, 1) });
        const mode = v.select('clearance of the drug', [{ value: 'enz', label: 'enzyme-limited (low extraction)' }, { value: 'flow', label: 'flow-limited (high extraction)' }], 'enz');
        const sI = v.stage({ x: [0.01, 3000], y: [0, 640], xlog: true, axes: 'box', gutter: true, xlabel: 'unbound drug concentration $C_u$ (µM)', ylabel: 'bound drug (µM)', height: 300, weight: 1 });
        const sT = v.stage({ x: [0, 14], y: [0, 2.2], axes: 'box', gutter: true, xlabel: 'time (baseline half-lives)', ylabel: 'concentration / its baseline value', height: 300, weight: 1.15 });
        const fuOf = (P, kd) => { const lo = 1e-9; return 1 / (1 + P / kd); };
        const T0 = 6, Vp = 3, VT = 39, V0 = 9.8, fu0w = 0.01;
        const fut = (fu0w * VT) / (V0 - Vp);
        const model = () => {
          const P = (alb.value * 1000) / 66.5, fuA = 1 / (1 + P / Kd), fuB = 1 / (1 + P / (Kd * (1 + disp.value)));
          const fu0 = fuA, fu1 = fuB;
          const Vf = (fu) => Vp + (VT * fu) / fut;
          const V0m = Vf(fu0), V1 = Vf(fu1);
          const CL0 = 1; // arbitrary unit; baseline half-life ln2·V0/CL0
          const th0 = (Math.LN2 * V0m) / CL0; // one baseline half-life (time unit)
          const CL1 = mode.value === 'enz' ? (CL0 * fu1) / fu0 : CL0;
          const R = CL0 * 1; // dosing rate giving C_tot,ss = R/CL0 = 1 in the baseline
          const A0 = (R * V0m) / CL0; // steady-state amount at baseline (C_tot = 1)
          const Ainf = (R * V1) / CL1, k1 = CL1 / V1;
          const f = (tt) => {
            // tt in baseline half-lives; baseline is at steady state until T0
            const t = tt * th0;
            if (tt < T0) return { Ct: A0 / V0m, Cu: (fu0 * A0) / V0m };
            const A = Ainf + (A0 - Ainf) * Math.exp(-k1 * (t - T0 * th0));
            return { Ct: A / V1, Cu: (fu1 * A) / V1 };
          };
          return { fu0, fu1, V0: V0m, V1, f, A0, Ainf, CL0, CL1, P };
        };
        let mdl = null;
        v.render(() => {
          mdl = model();
          const P = mdl.P;
          // isotherm: with and without displacer. Bound = P·Cu/(Kd_app + Cu) (free-ligand form).
          const bnd = (kd) => (Cu) => (P * Cu) / (kd + Cu);
          sI.hband(P - 0.5, P + 0.5, { color: 'muted', alpha: 0.35 });
          sI.text(`all binding sites occupied: ${Math.round(P)} µM`, 0.012, P + 6, { size: 10.5, color: 'muted', align: 'left', baseline: 'bottom' });
          sI.fn(bnd(Kd), { color: 'accent', width: 2.4, domain: [0.01, 3000] });
          sI.fn(bnd(Kd * (1 + disp.value)), { color: 'orange', width: 2.4, domain: [0.01, 3000] });
          // therapeutic band: total 3–16 µM (warfarin-like 1–5 mg/L)
          const cuOf = (Ct, kd) => { let lo = 0, hi = Ct; for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (m + (P * m) / (kd + m) > Ct) hi = m; else lo = m; } return (lo + hi) / 2; };
          const a = cuOf(3, Kd), b = cuOf(16, Kd);
          sI.vband(a, b, { color: 'green', alpha: 0.14 });
          sI.text('therapeutic range', b * 1.3, 0.55 * P, { size: 10.5, color: 'green', align: 'left', baseline: 'top' }); sI.text('(total 3–16 µM)', b * 1.3, 0.55 * P - 30, { size: 10.5, color: 'green', align: 'left', baseline: 'top' });
          const Ct0 = 8, cu0 = cuOf(Ct0, Kd), cu1 = cuOf(Ct0, Kd * (1 + disp.value));
          sI.dot(cu0, bnd(Kd)(cu0), { r: 5.5, color: 'accent' });
          sI.dot(cu1, bnd(Kd * (1 + disp.value))(cu1), { r: 5.5, color: 'orange' });
          // time course
          const ts = []; for (let i = 0; i <= 280; i++) ts.push((i / 280) * 14);
          const f0 = mdl.f(0);
          sT.vline(T0, { color: 'orange', dash: [5, 4], width: 1.4 });
          sT.text('displacer added', T0 + 0.15, 2.15, { size: 10.5, color: 'orange', align: 'left', baseline: 'top' });
          sT.hline(1, { color: 'muted', width: 1, dash: [3, 3] });
          sT.clip(() => {
            sT.path(ts.map((t) => [t, mdl.f(t).Ct / f0.Ct]), { color: 'accent', width: 2.6 });
            sT.path(ts.map((t) => [t, mdl.f(t).Cu / f0.Cu]), { color: 'green', width: 2.6 });
          });
        });
        v.legend([['accent', 'total drug (bound + unbound)'], ['green', 'unbound drug'], ['orange', 'with displacer (left panel)']]);
        v.readout(() => {
          const m = mdl, a = m.f(0), z = m.f(T0 + 0.01), e = m.f(14);
          const peak = Math.max(...Array.from({ length: 200 }, (_, i) => m.f(T0 + (i / 199) * 8).Cu)) / a.Cu;
          return `$f_u$ rises from ${v.fix(100 * m.fu0, 2)} % to ${v.fix(100 * m.fu1, 2)} % (×${v.fix(m.fu1 / m.fu0, 2)}). Right after the displacement: total $\\times ${v.fix(z.Ct / a.Ct, 2)}$, unbound $\\times ${v.fix(z.Cu / a.Cu, 2)}$ (peak unbound ×${v.fix(peak, 2)}). After 8 more half-lives: total $\\times ${v.fix(e.Ct / a.Ct, 2)}$, unbound $\\times ${v.fix(e.Cu / a.Cu, 2)}$ — ${mode.value === 'enz' ? 'unbound returns to baseline, total falls by $1/(f_{u,1}/f_{u,0})$' : 'total is unchanged, unbound stays raised by $f_{u,1}/f_{u,0}$'}. (Modelled, educational.)`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.8
    {
      num: '1.8',
      kind: 'Model',
      name: 'pH partition and ion trapping',
      statement: String.raw`A weak electrolyte exists as a neutral and an ionized form in a ratio set by the pH and its $\mathrm{p}K_a$ (Henderson–Hasselbalch): for an acid the neutral fraction is $f = 1/(1+10^{\mathrm{pH}-\mathrm{p}K_a})$, for a base $f = 1/(1+10^{\mathrm{p}K_a-\mathrm{pH}})$. If only the neutral form can cross a membrane, then at equilibrium the neutral concentrations are equal on both sides, so the total concentrations differ in the ratio $\dfrac{C_2}{C_1} = \dfrac{f_1}{f_2}$; for an acid $\dfrac{C_2}{C_1} = \dfrac{1+10^{\mathrm{pH}_2-\mathrm{p}K_a}}{1+10^{\mathrm{pH}_1-\mathrm{p}K_a}}$. A weak acid accumulates on the more alkaline side and a weak base on the more acidic side: **ion trapping**.`,
      idea: String.raw`Charged molecules cannot cross the lipid bilayer (1.9), so the neutral species equilibrates: net flux is proportional to $f_1C_1 - f_2C_2$ and stops when this vanishes. Mass is conserved, so the totals simply redistribute to satisfy $f_1C_1=f_2C_2$, and the relaxation is a single exponential at rate $k(f_1+f_2)$. The ratio does not depend on the permeability, only on pH and $\mathrm{p}K_a$, which is why alkalinizing the urine speeds the excretion of a weak acid such as phenobarbital or salicylate (it traps more of it in the urine), while acidifying it does the same for amphetamine (a base).`,
      caption: String.raw`Two compartments of equal volume with equal total drug at the start, separated by a membrane that passes only the neutral form (hollow dots; filled dots are ionized). Pick a drug or set its $\mathrm{p}K_a$, and set the pH of each side (or use a preset pair). The chambers equilibrate (animation, time in units of $1/k$); the middle panel shows both total concentrations on a log axis diverging to the Henderson–Hasselbalch ratio, and the right panel plots that ratio against the pH of side B. Dot density is relative to the more concentrated side. The $\mathrm{p}K_a$ values are rounded textbook figures.`,
      scope: String.raw`Applies to weak electrolytes that cross only as the neutral species by passive diffusion, with no active transport and no binding; the two sides are assumed to keep their pH. Real membranes also pass some ionized drug and have transporters.`,
      deps: ['physio-8.2', 'physio-1.3'],
      refs: ['Goodman–Gilman ch. 2'],
      tags: ['pH partition', 'ionization'],
      credit: 'Brodie, Schanker, Hogben and others, 1950s (pH-partition hypothesis)',
      viz(v) {
        const PRE = {
          aspirin: { kind: 'acid', pKa: 3.5 }, phenobarbital: { kind: 'acid', pKa: 7.2 },
          morphine: { kind: 'base', pKa: 8.2 }, amphetamine: { kind: 'base', pKa: 9.9 },
        };
        const sel = v.select('drug', [{ value: 'aspirin', label: 'aspirin (acid, 3.5)' }, { value: 'phenobarbital', label: 'phenobarbital (acid, 7.2)' }, { value: 'morphine', label: 'morphine (base, 8.2)' }, { value: 'amphetamine', label: 'amphetamine (base, 9.9)' }, { value: 'free', label: 'free' }], 'aspirin');
        const kind = v.select('type', [{ value: 'acid', label: 'weak acid' }, { value: 'base', label: 'weak base' }], 'acid');
        let prog = false;
        const pKa = v.slider('$\\mathrm{p}K_a$', 1, 12, 3.5, { step: 0.1, fmt: (x) => v.fix(x, 1), onChange: () => { if (!prog) sel.value = 'free'; } });
        const pH1 = v.slider('pH of side A', 1, 9, 1.5, { step: 0.1, fmt: (x) => v.fix(x, 1) });
        const pH2 = v.slider('pH of side B', 1, 9, 7.4, { step: 0.1, fmt: (x) => v.fix(x, 1) });
        v.button('plasma | acidic urine', () => { pH1.set(7.4); pH2.set(5.5); });
        v.button('plasma | alkaline urine', () => { pH1.set(7.4); pH2.set(8.0); });
        v.button('stomach | plasma', () => { pH1.set(1.5); pH2.set(7.4); });
        const sc = v.stage({ x: [0, 10], y: [0, 6], axes: false, height: 300, weight: 1.05, minWidth: 250 });
        const st = v.stage({ x: [0, 6], y: [1e-4, 10], ylog: true, axes: 'box', gutter: true, xlabel: 'time ($1/k$)', ylabel: 'total concentration / initial', height: 300, weight: 1, minWidth: 250 });
        const sr = v.stage({ x: [1, 9], y: [1e-4, 1e4], ylog: true, axes: 'box', gutter: true, xlabel: 'pH of side B', ylabel: 'ratio $C_B/C_A$', height: 300, weight: 0.95, minWidth: 250 });
        const rng = v.rng(11);
        const N = 120;
        const pts = [0, 1].map(() => Array.from({ length: N }, () => [rng(), rng(), rng()]));
        const neut = (pH, pk, kd) => (kd === 'acid' ? 1 / (1 + Math.pow(10, pH - pk)) : 1 / (1 + Math.pow(10, pk - pH)));
        let last = sel.value, info = null;
        v.animate((tt) => {
          if (sel.value !== last) { last = sel.value; if (sel.value !== 'free') { const p = PRE[sel.value]; prog = true; pKa.set(p.pKa); kind.set(p.kind); prog = false; } }
          const f1 = neut(pH1.value, pKa.value, kind.value), f2 = neut(pH2.value, pKa.value, kind.value);
          const lam = f1 + f2, C1inf = (2 * f2) / (f1 + f2), C2inf = 2 - C1inf;
          const C = (t) => { const e = Math.exp(-lam * t); return [C1inf + (1 - C1inf) * e, C2inf + (1 - C2inf) * e]; };
          const t = clamp(((tt % 12) / 9) * 6, 0, 6);
          const [c1, c2] = C(t), cm = Math.max(c1, c2);
          // ---- chambers
          const y0 = 0.6, y1 = 5.0, xm = 5, wm = 0.28;
          const side = (xa, xb, c, f, col, label, pH, k) => {
            sc.rect(xa, y0, xb, y1, { fill: col, fillAlpha: 0.05, color: col, width: 1.6 });
            const n = Math.round((N * c) / cm), nN = Math.round(n * f);
            const P = pts[k];
            const nn = [], ni = [];
            for (let i = 0; i < n; i++) { const p = [xa + 0.15 + P[i][0] * (xb - xa - 0.3), y0 + 0.15 + P[i][1] * (y1 - y0 - 0.3)]; (i < nN ? nn : ni).push(p); }
            sc.dots(ni, { r: 2.8, color: col });
            for (const p of nn) sc.dot(p[0], p[1], { r: 3.4, color: col, hollow: true, width: 1.5 });
            sc.text(label, (xa + xb) / 2, y1 + 0.18, { size: 11.5, color: col, align: 'center', baseline: 'bottom', weight: 600 });
            sc.text(`pH ${v.fix(pH, 1)} · neutral ${v.fix(100 * f, f < 0.01 ? 2 : 1)} %`, (xa + xb) / 2, y0 - 0.12, { size: 10.5, color: 'muted', align: 'center', baseline: 'top' });
          };
          side(0.3, xm - wm / 2, c1, f1, 'accent', 'side A', pH1.value, 0);
          side(xm + wm / 2, 9.7, c2, f2, 'orange', 'side B', pH2.value, 1);
          sc.rect(xm - wm / 2, y0, xm + wm / 2, y1, { fill: 'gold', fillAlpha: 0.2, color: 'gold', width: 1.2 });
          // neutral molecules crossing (decorative, scaled to the net flux sign)
          const flux = f1 * c1 - f2 * c2;
          if (Math.abs(flux) > 0.02) for (let j = 0; j < 4; j++) { const u = ((tt * 0.8 + j / 4) % 1), x = flux > 0 ? 3.6 + u * 2.8 : 6.4 - u * 2.8; sc.dot(x, 1.3 + j * 0.95, { r: 3.4, color: flux > 0 ? 'accent' : 'orange', hollow: true, width: 1.5, alpha: 0.9 }); }
          sc.text('passes neutral form only', xm, y1 + 0.18 + 0.55, { size: 10, color: 'gold', align: 'center', baseline: 'bottom' });
          // ---- time curves
          const ts = []; for (let i = 0; i <= 120; i++) ts.push((i / 120) * 6);
          st.hline(1, { color: 'muted', width: 1, dash: [3, 3] });
          st.path(ts.map((x) => [x, C(x)[0]]), { color: 'accent', width: 1.4, alpha: 0.3 });
          st.path(ts.map((x) => [x, C(x)[1]]), { color: 'orange', width: 1.4, alpha: 0.3 });
          const tt2 = ts.filter((x) => x <= t);
          st.path(tt2.map((x) => [x, C(x)[0]]), { color: 'accent', width: 2.6 });
          st.path(tt2.map((x) => [x, C(x)[1]]), { color: 'orange', width: 2.6 });
          st.dot(t, c1, { r: 5, color: 'accent' }); st.dot(t, c2, { r: 5, color: 'orange' });
          st.vline(t, { color: 'gold', width: 1 });
          // ---- ratio vs pH B
          const ratio = (ph2) => neut(pH1.value, pKa.value, kind.value) / neut(ph2, pKa.value, kind.value);
          sr.hline(1, { color: 'muted', width: 1, dash: [3, 3] });
          sr.vline(pH1.value, { color: 'accent', width: 1, dash: [4, 3] });
          sr.fn(ratio, { color: 'ink', width: 2.4, domain: [1, 9] });
          sr.dot(pH2.value, ratio(pH2.value), { r: 6, color: 'orange' });
          sr.vline(pKa.value, { color: 'purple', width: 1, dash: [2, 3] });
          sr.text('p$K_a$', pKa.value, 3000, { size: 10.5, color: 'purple', align: 'left', baseline: 'top', dx: 4 });
          info = { f1, f2, c1, c2, t, R: f1 / f2 };
        }, { period: 12, still: 8 });
        v.legend([['accent', 'side A, total'], ['orange', 'side B, total'], ['gold', 'membrane (neutral form only)', { area: true }]]);
        v.readout(() => {
          const r = info;
          return `Neutral fractions $f_A = ${v.sci(r.f1, 3)}$, $f_B = ${v.sci(r.f2, 3)}$. Predicted equilibrium ratio $C_B/C_A = f_A/f_B = ${v.sci(r.R, 3)}$; simulated now (t = ${v.fix(r.t, 1)}): $C_B/C_A = ${v.sci(r.c2 / r.c1, 3)}$. The ${kind.value === 'acid' ? 'weak acid piles up on the more alkaline side' : 'weak base piles up on the more acidic side'}; equilibration speed is $k(f_A+f_B) = ${v.fix(r.f1 + r.f2, 3)}\\,k$, but the final ratio does not depend on $k$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.9
    {
      num: '1.9',
      kind: 'Concept',
      name: 'Membrane permeability, lipophilicity and the blood–brain barrier',
      statement: String.raw`Drugs cross cell membranes mainly by passive diffusion through the lipid bilayer, so the permeability of the neutral form rises with its **lipophilicity**, measured by the octanol–water partition coefficient $\log P$ (Overton's rule). Ionized forms are excluded, so for acids and bases the relevant quantity is the distribution coefficient at the local pH, $\log D = \log P - \log_{10}(1+10^{\mathrm{pH}-\mathrm{p}K_a})$ for an acid and $\log P - \log_{10}(1+10^{\mathrm{p}K_a-\mathrm{pH}})$ for a base. The blood–brain barrier, formed by tight junctions between brain capillary endothelial cells, has almost no gaps between cells, so entry into the brain follows these rules, except that **efflux transporters** such as P-glycoprotein pump certain drugs back out, giving brain levels far below what lipophilicity predicts.`,
      idea: String.raw`A molecule must leave water, dissolve in the oily interior of the bilayer and re-enter water on the other side, so permeability scales with its oil/water solubility ratio; this is the same logic as the neutral-form-only crossing of 1.8. A strong acid at pH 7.4 is almost entirely ionized, so its effective lipophilicity is $\log D\ll\log P$; replacing $\log P$ by $\log D$ therefore moves the acids (salicylic acid, indometacin) toward the trend line. What remains off the line are drugs with an extra mechanism: here quinidine, a P-glycoprotein substrate.`,
      caption: String.raw`Each point is a compound with a measured steady-state brain/blood ratio ($\log BB$, 21 compounds from the literature). **Hover** over a point for its name and values. Plot against $\log P$ or against $\log D$ at the pH you set (acids move left when the pH is high and base-like drugs move left when it is low) and choose which points enter the least-squares line. The neutral compounds rise clearly with lipophilicity; the acids lie far below the line until ionization is accounted for, and the efflux substrate stays well below it. $\log P$ and $\mathrm{p}K_a$ values are rounded textbook figures.`,
      scope: String.raw`$\log BB$ for 21 mixed compounds from rodent studies is a coarse picture: each compound has its own protein binding, blood flow and active-transport behaviour. The trend is for passive entry only; no rule of lipophilicity alone predicts brain uptake of a transporter substrate.`,
      deps: ['physio-1.3'],
      refs: ['Goodman–Gilman ch. 2'],
      tags: ['permeability', 'lipophilicity', 'blood–brain barrier'],
      credit: 'Overton, 1890s (lipid solubility); logBB set compiled from the literature (see PMC3617654, Table 1)',
      viz(v) {
        // name, logBB (as printed in the literature table), logP (octanol/water, rounded), kind, pKa, P-gp substrate
        const DATA = [
          ['acetone', -0.15, -0.24, 'n'], ['butan-2-one', -0.08, 0.29, 'n'], ['trichloroethene', 0.34, 2.42, 'n'], ['toluene', 0.37, 2.73, 'n'],
          ['o-xylene', 0.37, 3.12, 'n'], ['p-xylene', 0.31, 3.15, 'n'], ['carbon disulphide', 0.6, 1.94, 'n'],
          ['salicylic acid', -1.1, 2.26, 'a', 3.0], ['aspirin', -0.5, 1.19, 'a', 3.5], ['paracetamol', -0.31, 0.46, 'n'], ['ibuprofen', -0.18, 3.97, 'a', 4.4],
          ['indometacin', -1.26, 4.27, 'a', 4.5], ['phenazone', -0.097, 0.38, 'n'], ['aminophenazone', 0, 1.0, 'n'], ['codeine', 0.55, 1.19, 'b', 8.2],
          ['phenytoin', -0.04, 2.47, 'a', 8.3], ['caffeine', -0.055, -0.07, 'n'], ['theophylline', -0.29, -0.02, 'a', 8.8], ['quinidine', -0.46, 3.44, 'b', 8.6, true],
          ['physostigmine', 0.079, 1.58, 'b', 7.9], ['diazepam', 0.52, 2.82, 'n'],
        ].map(([name, bb, lp, kind, pka, pgp]) => ({ name, bb, lp, kind, pka, pgp: !!pgp }));
        const xs = v.select('horizontal axis', [{ value: 'P', label: 'log P (octanol/water)' }, { value: 'D', label: 'log D at the pH below' }], 'P');
        const fitSel = v.select('line fitted to', [{ value: 'all', label: 'all points' }, { value: 'nopgp', label: 'all but the efflux substrate' }, { value: 'neutral', label: 'neutral compounds only' }], 'neutral');
        const pH = v.slider('pH', 6.4, 8.4, 7.4, { step: 0.1, fmt: (x) => v.fix(x, 1) });
        const s = v.stage({ x: [-2, 5.2], y: [-1.5, 0.9], axes: 'box', gutter: true, xlabel: 'lipophilicity', ylabel: 'log BB (brain / blood)', height: 360, weight: 1, hover: true });
        const lgD = (d) => (d.kind === 'a' ? d.lp - Math.log10(1 + Math.pow(10, pH.value - d.pka)) : d.kind === 'b' ? d.lp - Math.log10(1 + Math.pow(10, d.pka - pH.value)) : d.lp);
        let fitInfo = null, hit = null;
        v.render(() => {
          const X = DATA.map((d) => (xs.value === 'P' ? d.lp : lgD(d)));
          s.setView(xs.value === 'P' ? [-2, 5.2] : [-4, 5.2], [-1.5, 0.9]);
          s.setLabels(xs.value === 'P' ? 'log P (octanol/water)' : `log D at pH ${v.fix(pH.value, 1)}`);
          pH.el.hidden = xs.value === 'P';
          const idx = DATA.map((_, i) => i).filter((i) => fitSel.value === 'all' || (fitSel.value === 'nopgp' ? !DATA[i].pgp : DATA[i].kind === 'n'));
          const lr = v.M.linreg(idx.map((i) => X[i]), idx.map((i) => DATA[i].bb));
          const lrAll = v.M.linreg(X, DATA.map((d) => d.bb));
          s.hline(0, { color: 'faint', width: 1 });
          s.hband(-1.5, -1, { color: 'red', alpha: 0.05 });
          s.text('log BB < −1: poorly distributed to brain', 5.1, -1.42, { size: 10, color: 'muted', align: 'right', baseline: 'middle' });
          s.fn((x) => lr.predict(x), { color: 'ink', width: 1.8, dash: [6, 4], domain: [-4, 5.2] });
          DATA.forEach((d, i) => {
            const col = d.pgp ? 'red' : d.kind === 'a' ? 'orange' : d.kind === 'b' ? 'purple' : 'accent';
            s.dot(X[i], d.bb, { r: 6, color: col, hollow: false });
            if (xs.value === 'D' && d.kind !== 'n') s.arrow(d.lp, d.bb, X[i] + (X[i] < d.lp ? 0.06 : -0.06), d.bb, { color: col, width: 1, alpha: 0.45, head: 5 });
          });
          // hover
          hit = null;
          const p = s.pointer;
          if (p && p.inside) { let bd = 24; DATA.forEach((d, i) => { const dd = Math.hypot(s.X(X[i]) - s.X(p.x), s.Y(d.bb) - s.Y(p.y)); if (dd < bd) { bd = dd; hit = i; } }); }
          if (hit !== null) {
            const d = DATA[hit];
            s.dot(X[hit], d.bb, { r: 9, color: 'gold', hollow: true, width: 2 });
            s.text(`${d.name}: log BB ${v.fix(d.bb, 2)}, log P ${v.fix(d.lp, 2)}${d.kind !== 'n' ? `, log D ${v.fix(lgD(d), 2)}` : ''}${d.pgp ? ' · P-gp substrate' : ''}`, X[hit], d.bb, { size: 11, color: 'ink', align: X[hit] > 2.5 ? 'right' : 'left', baseline: 'bottom', dx: X[hit] > 2.5 ? -10 : 10, dy: -10, weight: 600, plate: true });
          }
          const r2P = v.M.linreg(DATA.map((d) => d.lp), DATA.map((d) => d.bb)).r2, r2D = v.M.linreg(DATA.map(lgD), DATA.map((d) => d.bb)).r2;
          fitInfo = { lr, lrAll, r2P, r2D, n: idx.length };
        });
        v.legend([['accent', 'neutral', { dot: true }], ['orange', 'acid', { dot: true }], ['purple', 'base', { dot: true }], ['red', 'P-glycoprotein substrate', { dot: true }], ['ink', 'least-squares line', { dash: true }]]);
        v.readout(() => {
          const f = fitInfo;
          return `Line through the ${f.n} selected points: $\\log BB = ${v.fix(f.lr.intercept, 2)} + ${v.fix(f.lr.slope, 2)}\\,x$, $r^2 = ${v.fix(f.lr.r2, 2)}$. For all 21 compounds: $r^2 = ${v.fix(f.r2P, 2)}$ against $\\log P$ and $${v.fix(f.r2D, 2)}$ against $\\log D$ at pH ${v.fix(pH.value, 1)}. The neutral compounds rise with $\\log P$; acids (orange) fall far below it in $\\log P$ because they are ionized in blood, and correcting for ionization closes much of the gap. Quinidine remains low because it is pumped out.`;
        });
      },
    },
  ],
};
