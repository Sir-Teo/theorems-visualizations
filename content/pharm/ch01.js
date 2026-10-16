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
  ],
};
