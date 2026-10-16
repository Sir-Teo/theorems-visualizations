// Pharmacology — Chapter 1: Drug disposition: the basic quantities
import { BODY, DRUGS, clOf, clamp, trapz, trapzLog, logSlope, bateman, rk4, idxAt, trace, memo, sig, box, wire, flowDots, logTicks } from './ch01.shared.js';

// ---------- Theophylline, subject 1 of the classic data set (Boeckmann, Sheiner & Beal 1992; R: datasets::Theoph) ----------
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
      idea: String.raw`ADME is bookkeeping. Each process is a flow between two places, and in the simplest models the flow is proportional to the amount in the source (a rate constant times an amount). Writing the flows down gives a small system of linear differential equations in which the total amount is conserved, so the stacked picture of "where is the drug" always sums to the dose; only the split changes. Fast absorption empties the gut early; strong tissue uptake parks drug away from the blood; high hepatic or renal function pushes drug into the "gone" columns sooner.`,
      caption: String.raw`A 100 mg dose is followed through a five-place body: gut, plasma, tissue, metabolized (liver) and excreted (kidney). Boxes fill with their amounts and dots stream along the arrows that are carrying drug. The stacked chart on the right shows the same run in full; its total height is always 100 mg. Switch to an **intravenous** dose to skip absorption, raise the first-pass loss to see drug destroyed before it arrives, or lower hepatic and renal function to see elimination slow down. The rate constants are illustrative, not those of a particular drug.`,
      scope: String.raw`A deliberately simple linear model: first-order flows, the whole oral dose absorbed, instant mixing inside plasma and inside tissue. Real drugs have several tissues, active transport, saturable steps and incomplete absorption.`,
      deps: [],
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
            ['port', [[2.65, 5], [3.5, 5]], 'orange'],
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
          sb.text('portal vein', 3.0, 4.6, { size: 10, color: 'muted', align: 'center', baseline: 'middle' });
          sb.text('first pass', 4.45, 3.8, { size: 10, color: 'muted', align: 'right', baseline: 'middle' });
          const b = (x, y, label, amt, col, w = 2.3, sub) => box(sb, x, y, w, 1.2, label, { color: col, fill: col, fillAlpha: 0.05 + 0.5 * clamp(amt / R.D, 0, 1), active: amt / R.D > 0.15, sub: sub ?? `${v.fix(amt, 1)} mg` });
          b(1.45, 5, 'gut', G, COL.G);
          b(5, 5, 'liver', M, COL.M, 2.9, `${v.fix(M, 1)} mg metabolized`);
          b(5, 2.6, 'plasma', P, COL.P);
          b(8.7, 2.6, 'tissues', T, COL.T, 2.2);
          b(1.45, 2.6, 'urine', U, COL.U, 2.6, `${v.fix(U, 1)} mg excreted`);
          sb.text('absorption', 1.45, 4.2, { size: 10.5, color: 'orange', align: 'center', baseline: 'middle' });
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
      credit: 'Data: R. Upton, theophylline kinetics, as printed in Boeckmann, Sheiner & Beal, NONMEM Users Guide Part V (1992)',
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
      caption: String.raw`A dose of 200 dots (1 dot = 0.5 % of the dose) is dissolved in a body with 3 L of plasma and 39 L of tissue water; the box areas are drawn to scale. Dot density is concentration. Drag the **tissue-to-plasma ratio** $K_p$, or click a drug (preset values for a 70 kg adult): the more tissue binding, the sparser the plasma and the larger the apparent volume $V = D/C$, shown on the log ruler against plasma, extracellular fluid and total body water. Chloroquine's volume is about a thousand times total body water.`,
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
  ],
};
