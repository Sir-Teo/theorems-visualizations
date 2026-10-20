// Pharmacology — Chapter 2: One-compartment kinetics (part b: items 2.6–2.10)
import { LN2, halfLife, integrateSegs, crossUp, crossDown, clamp, logSlope, trapz, bateman, rk4, idxAt, memo, sig, box, wire } from './ch02.shared.js';

const nice = (x) => (x >= 100 ? Math.round(x) : x >= 10 ? Math.round(x * 10) / 10 : Math.round(x * 100) / 100);
/** Peak time and height of the Bateman curve (F·D/V · stuff), with the ka = k limit. */
function peak(FD, V, ka, k) {
  if (Math.abs(ka - k) < 1e-6 * k) return { tmax: 1 / k, Cmax: FD / V / Math.E };
  return { tmax: Math.log(ka / k) / (ka - k), Cmax: (FD / V) * Math.pow(k / ka, k / (ka - k)) };
}

export default {
  collection: 'pharm',
  chapter: 2,
  items: [
    // ------------------------------------------------------------------ 2.6
    {
      num: '2.6',
      kind: 'Concept',
      name: 'Loading dose',
      statement: String.raw`A constant infusion needs about five half-lives to reach the plateau (2.5), which is too slow when a drug with a long half-life is needed at once. A **loading dose** is a bolus given at the start that puts the body at the target amount immediately: $D_L=C_{ss}\,V=\dfrac{R}{k}$, where $C_{ss}=R/\mathrm{CL}$ is the target concentration. Followed by the infusion at rate $R$, the concentration is then $C_{ss}$ for all time, since input $R$ exactly replaces what elimination removes. A loading dose smaller or larger than $C_{ss}V$ leaves a gap $(1-f)\,C_{ss}\,e^{-kt}$ that decays with the half-life, where $f=D_L/(C_{ss}V)$.`,
      idea: String.raw`With a bolus $D_L$ and infusion $R$ together, $A'=R-kA$ and $A(0)=D_L$ (2.4). The plateau amount is $A_{ss}=R/k$, and $A(t)-A_{ss}=(D_L-A_{ss})e^{-kt}$: the starting distance from the plateau decays by the usual factor. Choosing $D_L=A_{ss}$ makes the distance zero. In concentration, $D_L/V=C_{ss}$, which is where the volume of distribution (1.3) enters: the loading dose is the amount that fills the volume to the target concentration. Equivalent form: $D_L=R/k=1.44\,t_{1/2}R$, the infusion of 1.44 half-lives.`,
      caption: String.raw`Left: infusion alone (grey) and infusion plus a bolus of fraction $f$ of the correct loading dose (blue). At $f=1$ the concentration sits on the plateau from the first moment; below 1 it creeps up from underneath, above 1 it overshoots and drifts down. The shaded band is ±10 % of the plateau. Right: the time (in half-lives) to enter that band as a function of $f$; it is zero at $f=1$ and 3.3 half-lives with no loading dose. Drag the sliders to confirm that $D_L=C_{ss}V$ moves with $V$ but is the same bolus however long the half-life.`,
      scope: String.raw`One compartment, instant mixing. A real bolus into a drug that distributes slowly overshoots early in plasma (the initial volume is smaller than $V_{ss}$, ch. 3), which is why loading doses of such drugs are given slowly or in portions. Nothing here is dosing advice.`,
      deps: ['pharm-2.4', 'pharm-1.3'],
      refs: ['Rowland–Tozer'],
      tags: ['loading dose', 'steady state'],
      viz(v) {
        const R = v.slider('infusion rate $R$ (mg/h)', 5, 100, 50, { step: 1 });
        const CL = v.slider('clearance CL (L/h)', 1, 20, 5, { step: 0.1 });
        const V = v.slider('volume $V$ (L)', 10, 100, 40, { step: 1 });
        const fr = v.slider('loading dose $f\\cdot C_{ss}V$, $f=$', 0, 2, 1, { step: 0.05 });
        const sA = v.stage({ x: [0, 40], y: [0, 14], axes: 'box', gutter: true, xlabel: 'time (h)', ylabel: 'C (mg/L)', height: 320, weight: 1.2, minWidth: 260 });
        const sB = v.stage({ x: [0, 2], y: [0, 6], axes: 'box', gutter: true, xlabel: 'loading fraction $f$', ylabel: 'time to within 10 % (half-lives)', height: 320, weight: 0.9, minWidth: 250, xticks: [0, 0.5, 1, 1.5, 2], yticks: [0, 1, 2, 3, 4, 5, 6] });
        const hl = (f) => (Math.abs(1 - f) <= 0.1 ? 0 : Math.log2(10 * Math.abs(1 - f)));
        let info = null;
        v.render(() => {
          const k = CL.value / V.value, t12 = halfLife(CL.value, V.value), Css = R.value / CL.value, DL = fr.value * Css * V.value, tMax = nice(7 * t12);
          const run = integrateSegs(k, [[tMax, R.value]], DL, 700), C = run.A.map((a) => a / V.value);
          const noload = (t) => Css * (1 - Math.exp(-k * t));
          sA.setView([0, tMax], [0, Css * 1.9]);
          sA.hband(0.9 * Css, 1.1 * Css, { color: 'green', alpha: 0.1 });
          sA.hline(Css, { color: 'green', dash: true, width: 1.5 });
          sA.fn(noload, { domain: [0, tMax], color: 'muted', width: 2, dash: true });
          sA.path(run.t.map((t, i) => [t, C[i]]), { color: 'accent', width: 2.6 });
          sA.dot(0, DL / V.value, { r: 5.5, color: 'gold' });
          sA.text('$C_{ss}$', tMax * 0.99, Css, { size: 11.5, color: 'green', align: 'right', baseline: 'bottom', dy: -3 });
          // measured time to band
          const lvl = DL / V.value < Css ? crossUp(run.t, C, 0.9 * Css) : crossDown(run.t, C, 1.1 * Css);
          const tb = Math.abs(1 - fr.value) <= 0.1 ? 0 : lvl;
          info = { k, t12, Css, DL, tb, tbH: tb / t12, theory: hl(fr.value) };
          // right
          sB.setView([0, 2], [0, 6]);
          sB.fn((f) => (Math.abs(1 - f) <= 0.1 ? 0 : Math.log2(10 * Math.abs(1 - f))), { domain: [0, 2], color: 'accent', width: 2.4, n: 400 });
          sB.vline(1, { color: 'green', dash: true });
          sB.dot(fr.value, Math.min(6, info.tbH), { r: 6, color: 'gold' });
          sB.text('no loading dose', 0.03, 4.3, { size: 10.5, color: 'muted', align: 'left', baseline: 'middle' });
          sB.arrow(0.1, 4.0, 0.0, hl(0) + 0.1, { color: 'muted', head: 6 });
          sB.text('exact load', 1.02, 5.7, { size: 10.5, color: 'green', align: 'left', baseline: 'top' });
        });
        v.legend([['accent', 'with loading dose'], ['muted', 'infusion only', { dash: true }], ['green', 'plateau ±10 %', { area: true }]]);
        v.readout(() => `Target $C_{ss}=R/\\mathrm{CL}=${v.fix(info.Css, 2)}$ mg/L; exact loading dose $C_{ss}V=${v.fix(info.Css * V.value, 0)}$ mg $=R/k=${v.fix(1 / LN2, 2)}\\,t_{1/2}R$. You give $${v.fix(info.DL, 0)}$ mg ($f=${v.fix(fr.value, 2)}$): enters the band after $${v.fix(info.tb, 1)}$ h $=${v.fix(info.tbH, 2)}$ half-lives (formula $\\log_2(10|1-f|)=${v.fix(info.theory, 2)}$).`);
      },
    },
    // ------------------------------------------------------------------ 2.7
    {
      num: '2.7',
      kind: 'Model',
      name: 'First-order absorption: the Bateman function',
      statement: String.raw`After an oral dose $D$ of which a fraction $F$ is absorbed, let the amount $G$ in the gut empty into the body by a first-order process, $G'=-k_aG$, and let the body be one compartment with elimination constant $k=\mathrm{CL}/V$, $A'=k_aG-kA$. Then the concentration is the **Bateman function** $C(t)=\dfrac{F\,D\,k_a}{V\,(k_a-k)}\bigl(e^{-kt}-e^{-k_at}\bigr)$ for $k_a\ne k$ (and $\dfrac{FDk_a}{V}\,t\,e^{-kt}$ when $k_a=k$). It starts at zero, rises, peaks and decays: a difference of two exponentials whose slower one controls the late decline.`,
      idea: String.raw`Two first-order stages in series. The gut amount is the exponential $F D e^{-k_at}$ (2.1 with $k_a$ in place of $k$) and it is the input to the one-compartment body of 2.1. Solving $A'+kA=k_aFDe^{-k_at}$ by an integrating factor gives $A=\dfrac{FDk_a}{k_a-k}(e^{-kt}-e^{-k_at})$, and $C=A/V$. At $t=0$ the two exponentials cancel; the faster one dies first and leaves the slower. The same formula describes the intermediate of a radioactive decay chain (Bateman's solution of 1910).

Here ode 1.4 is used with a time-varying source, not a constant infusion: multiplying $A'+kA=k_aFD e^{-k_at}$ by $e^{kt}$ leaves the integral of $k_aFD e^{(k-k_a)t}$. Its value gives the difference of exponentials when the two positive rates differ. If they coincide, the integrand is constant and the solution is $FDk\,t e^{-kt}$ directly; there is no division by a zero rate difference. This calculation presumes a fixed bioavailable gut amount FD and linear disposition.`,
      caption: String.raw`Left: the gut empties into the body (animated; box fill is amount, dots flow in proportion to the absorption rate). Right: the concentration curve (solid blue) is the difference of the two dashed exponentials: orange is $Pe^{-kt}$, purple $Pe^{-k_at}$, with $P=\frac{FDk_a}{V(k_a-k)}$. Drag $k_a$ and watch the peak move and the curve change shape; set $k_a$ close to $k$ and the two exponentials nearly cancel (the formula switches to the limit $t\,e^{-kt}$). The curve is also integrated numerically (RK4 on the two ODEs); the readout gives the largest discrepancy.`,
      scope: String.raw`First-order absorption from a single site with no lag time, one-compartment disposition, constant $F$. Real absorption often has a delay, a dissolution-limited or saturable step, or several phases.`,
      credit: 'Harry Bateman, 1910 (decay chains; applied to drug absorption from the 1930s)',
      deps: ['pharm-2.1', 'ode-1.4'],
      refs: ['Rowland–Tozer'],
      tags: ['absorption', 'oral'],
      viz(v) {
        const D = v.slider('oral dose $D$ (mg)', 100, 600, 300, { step: 10 });
        const F = v.slider('bioavailability $F$', 0.2, 1, 0.8, { step: 0.05 });
        const ka = v.slider('absorption rate $k_a$ (1/h)', 0.1, 5, 1.2, { log: true, sig: 2, fmt: (x) => v.fix(x, 2) });
        const CL = v.slider('clearance CL (L/h)', 1, 20, 5, { step: 0.1 });
        const V = v.slider('volume $V$ (L)', 10, 100, 40, { step: 1 });
        const sT = v.stage({ x: [0, 10], y: [0, 10], axes: false, height: 320, weight: 0.65, minWidth: 210 });
        const sC = v.stage({ x: [0, 24], y: [0, 10], axes: 'box', gutter: true, xlabel: 'time (h)', ylabel: 'C (mg/L)', height: 320, weight: 1.3, minWidth: 270 });
        const get = memo();
        let info = null;
        v.animate((tt) => {
          const k = CL.value / V.value, t12 = halfLife(CL.value, V.value), FD = F.value * D.value;
          const slow = Math.min(ka.value, k), tMax = nice(Math.max(8 / Math.min(ka.value, k) * 0.5 + 3 / ka.value, 4 / k) * 1);
          const th = tMax * clamp(tt / 8, 0, 1);
          const ode = get(`${FD}|${ka.value}|${k}|${tMax}`, () => {
            const n = 800, h = tMax / n, f = (y) => [-ka.value * y[0], ka.value * y[0] - k * y[1]];
            let y = [FD, 0]; const t = [], G = [], A = [];
            for (let i = 0; i <= n; i++) { t.push(i * h); G.push(y[0]); A.push(y[1]); y = rk4(f, y, i * h, h); }
            return { t, G, A };
          });
          const Cb = (t) => bateman(F.value, D.value, V.value, ka.value, k, t);
          const pk = peak(FD, V.value, ka.value, k);
          let err = 0; for (let i = 0; i < ode.t.length; i += 5) err = Math.max(err, Math.abs(ode.A[i] / V.value - Cb(ode.t[i])));
          const i = idxAt(ode.t, th);
          info = { k, t12, pk, th, err, G: ode.G[i], A: ode.A[i], FD };
          // cartoon
          const fillG = clamp(ode.G[i] / FD, 0, 1), fillA = clamp(ode.A[i] / (pk.Cmax * V.value * 1.1 + 1e-9), 0, 1);
          box(sT, 5, 8, 4.6, 2.4, 'gut', { color: 'orange', fill: 'orange', fillAlpha: 0.05 + 0.5 * fillG, sub: `${v.fix(ode.G[i], 0)} mg` });
          box(sT, 5, 2.8, 4.6, 2.4, 'body', { color: 'accent', fill: 'accent', fillAlpha: 0.05 + 0.5 * fillA, sub: `${v.fix(ode.A[i], 0)} mg · ${v.fix(ode.A[i] / V.value, 2)} mg/L` });
          wire(sT, [[5, 6.7], [5, 4.1]], { color: 'faint', width: 1.6 });
          const flow = ka.value * ode.G[i];
          const nd = Math.round(clamp(flow / (FD * 0.35 + 1e-9), 0, 1) * 5) + (flow > 0.5 ? 1 : 0);
          for (let j = 0; j < nd; j++) sT.dot(5, 6.5 - 2.2 * (((tt * 0.8 + j / Math.max(1, nd)) % 1)), { r: 3.4, color: 'orange' });
          sT.text('$k_a G$', 5.4, 5.4, { size: 11.5, color: 'orange', align: 'left', baseline: 'middle' });
          wire(sT, [[5, 1.5], [5, 0.2]], { color: 'faint', width: 1.6 });
          sT.text('$kA$ out', 5.4, 0.8, { size: 11.5, color: 'muted', align: 'left', baseline: 'middle' });
          // curve
          sC.setView([0, tMax], [0, pk.Cmax * 1.45]);
          const A_ = (FD * ka.value) / (V.value * (ka.value - k));
          if (Math.abs(ka.value - k) > 0.08 * k) {
            sC.clip(() => {
              sC.fn((t) => A_ * Math.exp(-k * t), { domain: [0, tMax], color: 'orange', dash: true, width: 1.6, alpha: 0.9 });
              sC.fn((t) => A_ * Math.exp(-ka.value * t), { domain: [0, tMax], color: 'purple', dash: true, width: 1.6, alpha: 0.9 });
            });
          }
          sC.fn(Cb, { domain: [0, tMax], color: 'accent', width: 2.6 });
          sC.fn(Cb, { domain: [0, th], color: 'accent', width: 0, fill: true, fillAlpha: 0.12 });
          sC.dot(th, Cb(th), { r: 5.5, color: 'gold' });
          sC.dot(pk.tmax, pk.Cmax, { r: 4.5, color: 'green', hollow: true });
        }, { period: 11, still: 3 });
        v.legend([['accent', 'plasma concentration'], ['orange', '$Pe^{-kt}$', { dash: true }], ['purple', '$Pe^{-k_at}$', { dash: true }]]);
        v.readout(() => `$k=${v.fix(info.k, 3)}$ h$^{-1}$ ($t_{1/2}=${v.fix(info.t12, 1)}$ h), $k_a=${v.fix(ka.value, 2)}$ h$^{-1}$. At $t=${v.fix(info.th, 1)}$ h: gut $${v.fix(info.G, 0)}$ mg, body $${v.fix(info.A, 0)}$ mg, $C=${v.fix(info.A / V.value, 2)}$ mg/L. Peak $C_{max}=${v.fix(info.pk.Cmax, 2)}$ mg/L at $t=${v.fix(info.pk.tmax, 1)}$ h. RK4 versus formula: $${v.sci(info.err + 1e-12, 2)}$ mg/L.`);
      },
    },
    // ------------------------------------------------------------------ 2.8
    {
      num: '2.8',
      kind: 'Concept',
      name: 'Peak concentration and time to peak',
      statement: String.raw`For the Bateman curve (2.7) with $k_a\ne k$ the concentration peaks when its derivative vanishes, i.e. when the input $k_aFDe^{-k_at}$ equals the elimination $kA$: $t_{max}=\dfrac{\ln(k_a/k)}{k_a-k}$ and $C_{max}=\dfrac{FD}{V}\Bigl(\dfrac{k}{k_a}\Bigr)^{k/(k_a-k)}$. Faster absorption brings an earlier and higher peak, with $t_{max}\to0$ and $C_{max}\to FD/V$ as $k_a\to\infty$. The total exposure $\mathrm{AUC}_{0\to\infty}=FD/\mathrm{CL}$ does **not** depend on $k_a$ at all (it is the same area, spread differently in time). For $k_a=k$, $t_{max}=1/k$.`,
      idea: String.raw`Setting $C'(t)=0$ in the difference of exponentials gives $ke^{-kt}=k_ae^{-k_at}$, i.e. $e^{(k_a-k)t}=k_a/k$, hence $t_{max}$; substituting it back gives $C_{max}$. The area is the integral of $C$: $\int_0^\infty e^{-kt}-e^{-k_at}\,dt=1/k-1/k_a$, so $\mathrm{AUC}=\dfrac{FDk_a}{V(k_a-k)}\cdot\dfrac{k_a-k}{k k_a}=\dfrac{FD}{Vk}=\dfrac{FD}{\mathrm{CL}}$ (compare 1.5 and the bioavailability definition 1.6): absorption speed redistributes the same exposure in time.

For positive dose, volume and rate constants the Bateman curve is differentiable, starts at zero, is positive at positive times and returns to zero. Any interior peak therefore has zero derivative by pma 5.8. The derivative equation shown above has exactly one positive solution: its exponential ratio is strictly monotone, and the derivative changes from positive to negative there. Thus the stationary point is the global peak; a zero derivative alone would not suffice for that conclusion. With equal rates the derivative of $t e^{-kt}$ changes sign at 1/k.`,
      caption: String.raw`Drag the **absorption rate** slider: the blue curve is the current one, the grey dashed curves the same dose absorbed three times slower and three times faster. All three enclose the same area (shaded, computed by the trapezoidal rule). The right panels follow $t_{max}$ and $C_{max}$ as functions of $k_a$ on a log axis, with the limits as $k_a\to\infty$ (dashed) and the current value in gold. The readout compares the formulas with the maximum found by scanning the curve.`,
      scope: String.raw`For the one-compartment model with first-order absorption and no lag time. Real peaks also depend on gastric emptying, food and formulation, and tiny differences in $C_{max}$ can matter for narrow-window drugs.`,
      deps: ['pharm-2.7', 'pharm-1.6', 'pma-5.8'],
      refs: ['Rowland–Tozer'],
      tags: ['Cmax', 'tmax', 'AUC'],
      viz(v) {
        const ka = v.slider('absorption rate $k_a$ (1/h)', 0.1, 10, 1, { log: true, sig: 2, fmt: (x) => v.fix(x, 2) });
        const CL = v.slider('clearance CL (L/h)', 1, 20, 5, { step: 0.1 });
        const V = v.slider('volume $V$ (L)', 10, 100, 40, { step: 1 });
        const F = v.slider('bioavailability $F$', 0.2, 1, 1, { step: 0.05 });
        const D = 300;
        const sC = v.stage({ x: [0, 24], y: [0, 10], axes: 'box', gutter: true, xlabel: 'time (h)', ylabel: 'C (mg/L)', height: 320, weight: 1.3, minWidth: 270 });
        const sM = v.stage({ x: [0.1, 10], y: [0, 12], xlog: true, axes: 'box', gutter: true, xlabel: '$k_a$ (1/h, log)', ylabel: '$C_{max}$ (mg/L)', height: 320, weight: 0.85, minWidth: 220 });
        const sT = v.stage({ x: [0.1, 10], y: [0, 12], xlog: true, axes: 'box', gutter: true, xlabel: '$k_a$ (1/h, log)', ylabel: '$t_{max}$ (h)', height: 320, weight: 0.85, minWidth: 220 });
        let info = null;
        v.render(() => {
          const k = CL.value / V.value, FD = F.value * D, auc = FD / CL.value, t12 = halfLife(CL.value, V.value);
          const tMax = nice(Math.min(120, 5.5 / Math.min(k, ka.value))), Cf = (kk) => (t) => bateman(F.value, D, V.value, kk, k, t);
          const pk = peak(FD, V.value, ka.value, k);
          const C = Cf(ka.value);
          const slow = Math.max(0.1, ka.value / 3), fast = ka.value * 3;
          sC.setView([0, tMax], [0, (FD / V.value) * 1.12]);
          sC.fn(Cf(slow), { domain: [0, tMax], color: 'muted', dash: true, width: 1.6, n: 500 });
          sC.fn(Cf(fast), { domain: [0, tMax], color: 'muted', dash: true, width: 1.6, n: 500 });
          sC.fn(C, { domain: [0, tMax], color: 'accent', width: 2.6, fill: true, fillAlpha: 0.14, n: 500 });
          sC.hline(FD / V.value, { color: 'faint', dash: [3, 4] });
          sC.text('$FD/V$', tMax * 0.99, FD / V.value, { size: 10.5, color: 'muted', align: 'right', baseline: 'bottom' });
          sC.segment([pk.tmax, 0], [pk.tmax, pk.Cmax], { color: 'green', dash: true });
          sC.dot(pk.tmax, pk.Cmax, { r: 5.5, color: 'gold' });
          // scan for the maximum and the area
          const n = 4000, ts = [], cs = []; let bi = 0;
          for (let i = 0; i <= n; i++) { const t = (i / n) * 60 / Math.min(k, ka.value) * 0.25; ts.push(t); cs.push(C(t)); if (cs[i] > cs[bi]) bi = i; }
          const aucNum = trapz(ts, cs) + cs[n] / Math.min(k, ka.value);
          info = { k, pk, auc, aucNum, tscan: ts[bi], cscan: cs[bi], t12 };
          // right panels
          sM.setView([0.1, 10], [0, (FD / V.value) * 1.1]);
          sM.hline(FD / V.value, { color: 'green', dash: true });
          sM.fn((a) => peak(FD, V.value, a, k).Cmax, { domain: [0.1, 10], color: 'accent', width: 2.2, n: 300 });
          sM.dot(ka.value, pk.Cmax, { r: 5.5, color: 'gold' });
          sM.vline(k, { color: 'faint', dash: [3, 4] });
          sM.text('$k_a=k$', k, 0, { size: 10.5, color: 'muted', align: 'left', baseline: 'bottom', dx: 4, dy: -6 });
          const tt = peak(FD, V.value, 0.1, k).tmax;
          sT.setView([0.1, 10], [0, Math.max(2, tt * 1.1)]);
          sT.fn((a) => peak(FD, V.value, a, k).tmax, { domain: [0.1, 10], color: 'orange', width: 2.2, n: 300 });
          sT.dot(ka.value, pk.tmax, { r: 5.5, color: 'gold' });
          sT.vline(k, { color: 'faint', dash: [3, 4] });
          sT.hline(0, { color: 'green', dash: true });
        });
        v.legend([['accent', 'current $k_a$', { area: true }], ['muted', '$k_a/3$ and $3k_a$ (same area)', { dash: true }], ['green', 'limits as $k_a\\to\\infty$', { dash: true }]]);
        v.readout(() => `$t_{max}=\\ln(k_a/k)/(k_a-k)=${v.fix(info.pk.tmax, 2)}$ h (scan: $${v.fix(info.tscan, 2)}$), $C_{max}=${v.fix(info.pk.Cmax, 2)}$ mg/L (scan: $${v.fix(info.cscan, 2)}$). Area by trapezoids $${v.fix(info.aucNum, 1)}$ mg·h/L; $FD/\\mathrm{CL}=${v.fix(info.auc, 1)}$ mg·h/L, whatever $k_a$ is.`);
      },
    },
    // ------------------------------------------------------------------ 2.9
    {
      num: '2.9',
      kind: 'Phenomenon',
      name: 'Flip-flop kinetics',
      statement: String.raw`In the Bateman curve (2.7) the two rate constants play almost symmetric roles: the terminal decline has slope $-\min(k_a,k)$. Normally absorption is the faster step, $k_a>k$, and the terminal slope measures elimination. When absorption is slower than elimination, $k_a<k$ (a depot injection, a slow-release tablet, a transdermal patch), the terminal slope measures **absorption** instead: the terminal half-life $\ln 2/k_a$ is longer than the true elimination half-life $\ln 2/k$. This is **flip-flop kinetics**. From oral (extravascular) data alone the two cases cannot be told apart: the curve with $(k_a,k,V)$ is identical to the curve with $(k,k_a,\,Vk/k_a)$.`,
      idea: String.raw`The Bateman function $\frac{FDk_a}{V(k_a-k)}(e^{-kt}-e^{-k_at})$ is a difference of two exponentials; at late times the faster one is gone and the slower one remains, whichever it is. Swapping $k_a\leftrightarrow k$ changes the prefactor by the factor $k/k_a$, which can be absorbed into a different volume $V'=Vk/k_a$, so the fitted curve is the same. Only an intravenous dose, which has no absorption step, shows the true elimination rate (2.1). Reading the terminal slope of an oral curve as elimination without checking is a classic error in estimating clearance and half-life.`,
      caption: String.raw`A depot dose with $k_a=0.12$ h$^{-1}$ and $k=0.6$ h$^{-1}$ (elimination half-life 1.2 h). On the log plot, the red line is the **naive fit to the terminal phase**; its half-life (readout) matches the absorption half-life of 5.8 h, not the elimination half-life. Switch on the **twin** (dashed): a drug with $k_a$ and $k$ exchanged and volume rescaled lies exactly on top of the data. Then add the **intravenous bolus** curves of both: the real drug (green) falls quickly, the twin (purple) slowly, so one IV dose settles which is which. Drag $k_a$ above $k$ and the flip-flop disappears.`,
      scope: String.raw`Applies to first-order absorption into a one-compartment body. In practice it is recognised from IV data, from the known formulation, or from a terminal half-life that changes with the route of administration.`,
      deps: ['pharm-2.7'],
      refs: ['Rowland–Tozer'],
      tags: ['absorption', 'half-life'],
      viz(v) {
        const D = 300, F = 1, V = 40;
        const ka = v.slider('absorption $k_a$ (1/h)', 0.05, 5, 0.12, { log: true, sig: 2, fmt: (x) => v.fix(x, 2) });
        const k = v.slider('elimination $k$ (1/h)', 0.05, 5, 0.6, { log: true, sig: 2, fmt: (x) => v.fix(x, 2) });
        const twin = v.toggle('show the swapped twin', false);
        const iv = v.toggle('add intravenous bolus', false);
        const s = v.stage({ x: [0, 60], y: [0.01, 10], ylog: true, axes: 'box', gutter: true, xlabel: 'time (h)', ylabel: 'C (mg/L, log)', height: 340, weight: 1.2, minWidth: 280 });
        const s2 = v.stage({ x: [0, 60], y: [0, 10], axes: 'box', gutter: true, xlabel: 'time (h)', ylabel: 'C (mg/L)', height: 340, weight: 0.9, minWidth: 240 });
        let info = null;
        v.render(() => {
          const a = ka.value, kk = k.value, slow = Math.min(a, kk), fastR = Math.max(a, kk);
          const t12s = LN2 / slow, tEnd = nice(Math.min(2000, 7 * t12s));
          const pk = peak(F * D, V, a, kk);
          const C = (t) => bateman(F, D, V, a, kk, t);
          const Vt = (V * kk) / a, Ct = (t) => bateman(F, D, Vt, kk, a, t);
          s.setView([0, tEnd], [pk.Cmax * 0.004, Math.max(D / V, D / Vt) * (iv.value ? 1.4 : 0.35)]);
          s2.setView([0, tEnd], [0, pk.Cmax * 1.25]);
          // terminal window: where the faster exponential is < 1% of the slower
          const gap = Math.abs(a - kk), t0 = gap > 1e-9 ? Math.min(tEnd * 0.6, 4.6 / gap + pk.tmax) : tEnd * 0.4, t1 = Math.min(tEnd, t0 + 3 * t12s);
          const idx = [], ts = [], ys = [];
          for (let i = 0; i < 12; i++) { const t = t0 + ((t1 - t0) * i) / 11; ts.push(t); ys.push(C(t)); idx.push(i); }
          const fit = logSlope(ts, ys, idx);
          info = { a, kk, fitK: fit.k, fitHalf: LN2 / fit.k, flip: a < kk, pk };
          for (const st of [s, s2]) {
            if (twin.value) st.fn(Ct, { domain: [0, tEnd], color: 'orange', width: 5, alpha: 0.5, dash: [8, 6], n: 500 });
            st.fn(C, { domain: [0, tEnd], color: 'accent', width: 2.4, n: 500 });
          }
          s.fn((t) => fit.c0 * Math.exp(-fit.k * t), { domain: [0, tEnd], color: 'red', width: 1.8, dash: [2, 3] });
          s.dots(ts.map((t, i) => [t, ys[i]]), { r: 3.5, color: 'red' });
          if (iv.value) {
            s.fn((t) => (D / V) * Math.exp(-kk * t), { domain: [0, tEnd], color: 'green', width: 2, n: 300 });
            if (twin.value) s.fn((t) => (D / Vt) * Math.exp(-a * t), { domain: [0, tEnd], color: 'purple', width: 2, n: 300 });
            s2.fn((t) => (D / V) * Math.exp(-kk * t), { domain: [0, tEnd], color: 'green', width: 2, n: 300, alpha: 0.9 });
            if (twin.value) s2.fn((t) => (D / Vt) * Math.exp(-a * t), { domain: [0, tEnd], color: 'purple', width: 2, n: 300 });
          }
          s.vband(t0, t1, { color: 'red', alpha: 0.07 });
          s.corner(info.flip ? 'FLIP-FLOP: terminal slope is absorption' : 'normal: terminal slope is elimination', 'tr', { color: info.flip ? 'red' : 'green', weight: 600 });
        });
        v.legend([['accent', 'oral curve'], ['red', 'naive terminal fit', { dash: true }], ['green', 'IV, real drug'], ['orange', 'swapped twin (oral)', { dash: true }], ['purple', 'IV, twin']]);
        v.readout(() => `$k_a=${v.fix(info.a, 2)}$, $k=${v.fix(info.kk, 2)}$ h$^{-1}$: elimination half-life $${v.fix(LN2 / info.kk, 2)}$ h, absorption half-life $${v.fix(LN2 / info.a, 2)}$ h. The terminal fit gives slope $${v.fix(info.fitK, 3)}$ h$^{-1}$, apparent half-life $${v.fix(info.fitHalf, 2)}$ h: it equals the ${info.flip ? '**absorption** half-life (flip-flop; the apparent half-life overestimates the true one by a factor ' + v.fix(info.fitHalf / (LN2 / info.kk), 1) + ')' : 'elimination half-life'}.`);
      },
    },
    // ------------------------------------------------------------------ 2.10
    {
      num: '2.10',
      kind: 'Method',
      name: 'Urinary excretion data and the sigma-minus method',
      statement: String.raw`If a fraction $f_e$ of the dose is excreted unchanged in urine (renal rate constant $k_e=f_ek$), the cumulative amount excreted after an intravenous bolus is $A_e(t)=f_eD\,(1-e^{-kt})$, approaching $A_e^\infty=f_eD$. The **sigma-minus method** plots the amount still to be excreted, $A_e^\infty-A_e(t)=f_eD\,e^{-kt}$, on a log scale: it is a straight line of slope $-k$ whose intercept is $f_eD$. So $k$, $t_{1/2}$ and $f_e$ can be found from timed urine collections without any blood sample. $A_e^\infty$ is taken as the total collected once collection has run for about seven half-lives; a shorter collection underestimates it and biases the slope.`,
      idea: String.raw`Excretion into urine is a first-order process fed by the same exponential, $dA_e/dt=k_eA=k_eDe^{-kt}$ (2.1), so integrating gives the cumulative amount and its complement $A_e^\infty-A_e=f_eDe^{-kt}$: the amount left to excrete decays with the elimination rate constant itself, not with $k_e$. Its logarithm is linear in time (the same logic as 2.3), so the same straight-line fit applies. The advantage over the rate method (plotting $\Delta A_e/\Delta t$ at interval midpoints) is that cumulative data smooth out errors in single collections; the disadvantage is that $A_e^\infty$ must be known.

The fundamental theorem pma 6.21 integrates the continuous urinary outflow on a finite interval: $A_e(t)-A_e(0)=\int_0^t k_eD e^{-ks}\,ds=(k_eD/k)(1-e^{-kt})$. Letting t tend to infinity for k>0 gives $A_e^\infty=f_eD$, and subtracting yields the sigma-minus exponential. This argument requires the complete cumulative amount or a justified tail estimate; replacing the infinite total by a short collection changes the logged residual rather than merely adding noise.`,
      caption: String.raw`A 500 mg intravenous dose is eliminated with half-life $t_{1/2}$, a fraction $f_e$ of it into urine. The urine is collected in $n$ intervals of length $\Delta$ (set the collection plan with the sliders; every interval amount carries assay noise). Left: cumulative amount excreted. Right: **amount remaining to be excreted** on a log axis, with the fitted line (blue) and the true line (green dashed). Choose how $A_e^\infty$ is obtained: the **last collection** (what a real study has) or the **true** value (an oracle). With a collection shorter than about seven half-lives the first choice makes the line bend and overestimates $k$.`,
      scope: String.raw`Needs a drug that is eliminated by one-compartment first-order kinetics, complete urine collection, and a collection long enough to estimate $A_e^\infty$. If the renal route is minor ($f_e$ small) the urine amounts are small and the noise matters more.`,
      deps: ['pharm-2.1', 'pma-6.21'],
      refs: ['Rowland–Tozer'],
      tags: ['urine', 'renal excretion'],
      viz(v) {
        const D = 500;
        const t12 = v.slider('half-life $t_{1/2}$ (h)', 2, 10, 4, { step: 0.5 });
        const fe = v.slider('urinary fraction $f_e$', 0.1, 0.9, 0.4, { step: 0.05 });
        const dt = v.slider('interval length $\\Delta$ (h)', 1, 8, 3.5, { step: 0.5 });
        const nI = v.slider('number of intervals $n$', 3, 14, 10, { int: true });
        const noise = v.slider('assay noise (ln s.d.)', 0, 0.2, 0.03, { step: 0.01 });
        const mode = v.select('$A_e^\\infty$', [{ value: 'last', label: 'last collection' }, { value: 'true', label: 'true value (oracle)' }], 'last');
        const sA = v.stage({ x: [0, 40], y: [0, 240], axes: 'box', gutter: true, xlabel: 'time (h)', ylabel: 'cumulative urine amount $A_e$ (mg)', height: 330, weight: 1, minWidth: 250 });
        const sB = v.stage({ x: [0, 40], y: [0.5, 300], ylog: true, axes: 'box', gutter: true, xlabel: 'time (h)', ylabel: '$A_e^\\infty - A_e$ (mg, log)', height: 330, weight: 1.05, minWidth: 260 });
        const r = v.rng(11), eps = Array.from({ length: 14 }, () => r.normal());
        let info = null;
        v.render(() => {
          const k = LN2 / t12.value, Ainf = fe.value * D, n = nI.value, Tn = n * dt.value, tEnd = Math.max(Tn * 1.15, 16);
          const cumTrue = (t) => Ainf * (1 - Math.exp(-k * t));
          const ends = [], Ae = []; let c = 0;
          for (let j = 1; j <= n; j++) {
            const a = Ainf * (Math.exp(-k * (j - 1) * dt.value) - Math.exp(-k * j * dt.value)) * Math.exp(noise.value * eps[j - 1]);
            c += a; ends.push(j * dt.value); Ae.push(c);
          }
          const est = mode.value === 'last' ? c : Ainf;
          const rem = Ae.map((a) => est - a);
          const idx = rem.map((x, i) => i).filter((i) => rem[i] > 0);
          const fit = idx.length >= 2 ? logSlope(ends, rem, idx) : null;
          info = { k, Ainf, Tn, est, fit, hl: Tn / t12.value, n };
          sA.setView([0, tEnd], [0, Math.max(Ainf * 1.2, 40)]);
          sA.hline(Ainf, { color: 'green', dash: true, width: 1.4 });
          sA.text('$f_eD$', tEnd * 0.99, Ainf, { size: 11.5, color: 'green', align: 'right', baseline: 'bottom', dy: -3 });
          sA.fn(cumTrue, { domain: [0, tEnd], color: 'green', width: 1.6, dash: true });
          const pts = [[0, 0]]; ends.forEach((t, i) => pts.push([t, Ae[i]]));
          sA.path(pts, { color: 'accent', width: 2 });
          sA.dots(ends.map((t, i) => [t, Ae[i]]), { r: 5, color: 'gold' });
          if (mode.value === 'last') sA.hline(c, { color: 'red', dash: [4, 4], alpha: 0.7 });
          sB.setView([0, tEnd], [Ainf * 0.003 + 0.2, Ainf * 1.6]);
          sB.fn((t) => Ainf * Math.exp(-k * t), { domain: [0, tEnd], color: 'green', width: 1.8, dash: true });
          if (fit) sB.fn((t) => fit.c0 * Math.exp(-fit.k * t), { domain: [0, tEnd], color: 'accent', width: 2.2 });
          sB.dots(idx.map((i) => [ends[i], rem[i]]), { r: 5, color: 'gold' });
          if (!idx.includes(n - 1)) sB.corner('last point: remaining = 0, not plottable', 'bl', { color: 'red' });
        });
        v.legend([['gold', 'collections (interval ends)', { dot: true }], ['accent', 'fitted line'], ['green', 'truth', { dash: true }]]);
        v.readout(() => {
          if (!info.fit) return 'need at least two positive points';
          const kh = info.fit.k;
          return `Collected for $${v.fix(info.Tn, 0)}$ h $=${v.fix(info.hl, 1)}$ half-lives. Fit: $\\hat k=${v.fix(kh, 3)}$ h$^{-1}$ (true $${v.fix(info.k, 3)}$), $\\hat t_{1/2}=${v.fix(LN2 / kh, 1)}$ h (true $${v.fix(LN2 / info.k, 1)}$); $\\hat f_e=A_e^\\infty/D=${v.fix(info.est / D, 2)}$ (true $${v.fix(info.Ainf / D, 2)}$), $r^2=${v.fix(info.fit.r2, 3)}$. Renal clearance $k_eV$ is then $\\hat f_e\\widehat{\\mathrm{CL}}$.`;
        });
      },
    },
  ],
};
