// Human Physiology — Chapter 1: Homeostasis and membrane transport (part a: 1.1–1.6)
import { R_GAS, clamp, bisect, rk4, trace, idxAt, clocked, box, sumJ, wire, flowDots, bilayer } from './ch01.shared.js';

// ---------- helpers for this file ----------
/** Poisson sample with mean lam (inverse transform; lam is small here). */
function poisson(r, lam) {
  if (lam <= 0) return 0;
  if (lam > 30) return Math.max(0, Math.round(lam + Math.sqrt(lam) * r.normal()));
  let k = 0, p = Math.exp(-lam), s = p; const u = r();
  while (u > s && k < 200) { k++; p *= lam / k; s += p; }
  return k;
}

// Thermoregulation (1.1): a 70 kg body, heat capacity 70 kg × 3.5 kJ/(kg K), basal heat 80 W, dry heat conductance
// k = 6.7 W/K (so that 25 °C air balances the basal heat at 37 °C); effectors saturate at +320 W (shivering, ~4×
// basal) and −600 W (sweating, ~1 L/h).
const TH = { C: 245e3, M0: 80, k: 80 / 12, Ta0: 25, Tset: 37, umax: 320, umin: -600, t0: 0.5 };
function thermoRun(mode, G, dist, tEnd = 8, dt = 0.01) {
  const Ta = (t) => (t < TH.t0 ? TH.Ta0 : dist === 'cold' ? 5 : dist === 'heat' ? 45 : TH.Ta0);
  const Mex = (t) => (dist === 'ex' && t >= TH.t0 && t < 3.5 ? 500 : 0);
  const u = (T) => clamp(-mode * G * (T - TH.Tset), TH.umin, TH.umax);
  const f = (y, t) => [(3600 * (TH.M0 + Mex(t) + u(y[0]) - TH.k * (y[0] - Ta(t)))) / TH.C];
  const ts = [], Ts = [], us = [];
  let y = [TH.Tset];
  for (let i = 0, n = Math.round(tEnd / dt); i <= n; i++) {
    const t = i * dt; ts.push(t); Ts.push(y[0]); us.push(u(y[0]));
    if (i < n) y = rk4(f, y, t, dt);
    if (!isFinite(y[0]) || Math.abs(y[0]) > 200) y = [y[0] > 0 ? 200 : -200];
  }
  return { t: ts, T: Ts, u: us };
}

// Red cell (1.5): Evans–Fung biconcave profile (half-thickness, µm) for x = r/R0 ∈ [0, 1].
const EF = { R0: 3.91, C0: 0.81, C2: 7.83, C4: -4.39 };
const efHalf = (x) => 0.5 * Math.sqrt(Math.max(0, 1 - x * x)) * (EF.C0 + EF.C2 * x * x + EF.C4 * x ** 4);

// Carrier (1.6): four-state alternating-access carrier Eo ⇄ ESo ⇄ ESi ⇄ Ei ⇄ Eo (flip rate kf both ways, loaded or
// empty; binding kon·c, release koff on each side). Zero-trans: no substrate inside.
const CAR = { kf: 1, koff: 30 };
function carrierPi(c, Kd, ci = 0) {
  const kon = CAR.koff / Kd, kf = CAR.kf, ko = CAR.koff;
  // generator rows: from-state i to j
  const Q = [
    [0, kon * c, 0, kf],
    [ko, 0, kf, 0],
    [0, kf, 0, ko],
    [kf, 0, kon * ci, 0],
  ];
  for (let i = 0; i < 4; i++) Q[i][i] = -Q[i].reduce((a, b) => a + b, 0);
  // solve πQ = 0 with Σπ = 1: transpose and replace the last equation by normalisation
  const A = [0, 1, 2, 3].map((j) => [0, 1, 2, 3].map((i) => Q[i][j])), b = [0, 0, 0, 0];
  A[3] = [1, 1, 1, 1]; b[3] = 1;
  // Gaussian elimination
  for (let i = 0; i < 4; i++) {
    let p = i; for (let r = i + 1; r < 4; r++) if (Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r;
    [A[i], A[p]] = [A[p], A[i]]; [b[i], b[p]] = [b[p], b[i]];
    for (let r = 0; r < 4; r++) if (r !== i) { const f = A[r][i] / A[i][i]; for (let k = i; k < 4; k++) A[r][k] -= f * A[i][k]; b[r] -= f * b[i]; }
  }
  return b.map((x, i) => x / A[i][i]);
}
const carrierFlux = (c, Kd) => { const p = carrierPi(c, Kd); return CAR.kf * (p[1] - p[2]); };
const carrierJmax = (Kd) => carrierFlux(1e7, Kd);
const carrierKm = (Kd) => { const J = carrierJmax(Kd); return bisect((c) => carrierFlux(c, Kd) - J / 2, 1e-6, 1e4); };
/** Kd that gives the requested zero-trans Km. */
const kdForKm = (Km) => Math.exp(bisect((lk) => carrierKm(Math.exp(lk)) - Km, Math.log(1e-3), Math.log(1e4)));

export default {
  collection: 'physio',
  chapter: 1,
  title: 'Homeostasis and membrane transport',
  summary: String.raw`Physiology studies how the body holds its internal environment steady against disturbance. Negative feedback, whose effectiveness is measured by its gain, is the central idea. At the level of the cell, diffusion, osmosis and carrier-mediated transport move water and solutes across membranes, and the sodium–potassium pump keeps ion gradients in place against their leaks. The Nernst, Goldman–Hodgkin–Katz and Donnan relations turn those gradients into membrane voltages. The pump–leak model ties voltage and cell volume together, and Cannon's 1929 review named the whole programme homeostasis.`,
  items: [
    // ------------------------------------------------------------------ 1.1
    {
      num: '1.1',
      kind: 'Principle',
      name: 'Homeostasis and negative feedback',
      statement: String.raw`The cells of the body live in the extracellular fluid, Claude Bernard's *milieu intérieur*. Its temperature, glucose, salt and water content, $\mathrm{pH}$, $\mathrm{O_2}$ and $\mathrm{CO_2}$ tensions and arterial pressure are held within narrow ranges although the outside world and the body's own activity keep disturbing them. This constancy is called **homeostasis**. It is produced mainly by **negative-feedback loops** with four parts:

- a **sensor** that measures the regulated variable $x$;
- a **controller** that compares it with a set point $x_0$;
- **effectors** that act in proportion to the error $e = x - x_0$;
- and an action whose sign *opposes* the error.

A disturbance that would shift $x$ by $\Delta x_{\text{open}}$ with the loop open shifts it only by about $\Delta x_{\text{open}}/(1+G)$ with the loop closed, where $G$ is the loop gain (1.2). Positive feedback, where the action reinforces the error, has the opposite effect: it amplifies deviations instead of correcting them.`,
      idea: String.raw`Without regulation the variable drifts until the disturbance is balanced by passive processes alone. For body heat this means Newton cooling: in a cold room the body would keep cooling for hours toward a new and lethal equilibrium. With feedback, any error recruits effectors such as shivering, skin vasoconstriction or sweating. Their output grows with the error until it nearly cancels the disturbance, so only a small residual error is needed to keep them working. This is disturbance rejection, as in control theory (ctrl-1.8). The same loop with its sign reversed turns a small deviation into a runaway, which is why physiological positive feedback is reserved for events that must run to completion, such as clotting, the LH surge and labour.`,
      caption: String.raw`A body at 37 °C meets a disturbance at $t = 0.5$ h. Three copies are simulated at once: with **negative feedback** (green), with the controller **switched off** (grey) and with the loop sign **reversed** (red). The loop diagram shows the live signals of the negative-feedback body: the sensed temperature, the error and the effector output (orange for heating, blue for cooling). Lower the controller gain $G$ and the green trace slides toward the grey one. In the cold, the unregulated body is still cooling after 8 hours, while the regulated one settles within half a kelvin.`,
      scope: String.raw`Holds while the effectors stay within their capacity: past maximal shivering or sweating the loop saturates and the variable escapes (heat stroke, hypothermia). Delays in the loop can make high gains oscillate (1.2).`,
      deps: [],
      see: ['ctrl-1.1', 'ctrl-1.3', 'ctrl-1.8', 'ctrl-1.12', 'physio-9.14'],
      refs: ['Guyton–Hall', 'Boron–Boulpaep'],
      tags: ['homeostasis', 'feedback'],
      credit: 'Claude Bernard, 1865 (milieu intérieur); Walter B. Cannon, 1926–1929 (homeostasis)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Homeostasis' },
      viz(v) {
        const dist = v.select('disturbance', [{ value: 'cold', label: 'cold room 5 °C' }, { value: 'heat', label: 'hot room 45 °C' }, { value: 'ex', label: 'exercise +500 W' }], 'cold');
        const Gs = v.slider('controller gain $G$', 0, 400, 200, { step: 5, fmt: (x) => `${Math.round(x)} W/K` });
        const showPos = v.toggle('show reversed (positive) feedback', true);
        const sd = v.stage({ x: [0, 11], y: [0.2, 5.9], equal: true, axes: false, height: 300, weight: 1 });
        const sp = v.stage({ x: [0, 8], y: [30, 42], height: 300, axes: 'box', xlabel: 't (h)', ylabel: 'core temperature (°C)', weight: 1.1, yticks: [30, 32, 34, 36, 38, 40, 42] });
        let key = '', runs = null;
        const get = () => {
          const k = `${dist.value}|${Gs.value}`;
          if (k !== key) { key = k; runs = { neg: thermoRun(1, Gs.value, dist.value), off: thermoRun(0, 0, dist.value), pos: thermoRun(-1, Gs.value, dist.value) }; }
          return runs;
        };
        let th = 0;
        v.animate((t) => {
          const R = get(); th = Math.min(8, ((t % 15) / 12.5) * 8);
          const i = idxAt(R.neg.t, th), T = R.neg.T[i], u = R.neg.u[i], e = T - TH.Tset;
          // ---- loop diagram
          const heat = u > 1, cool = u < -1, effCol = heat ? 'orange' : cool ? 'blue' : 'muted';
          const amt = Math.min(1, Math.abs(u) / 300), phase = t * 1.2;
          const wSet = [[0.2, 4.6], [1.58, 4.6]], wE = [[2.22, 4.6], [3.05, 4.6]], wU = [[5.55, 4.6], [6.65, 4.6]], wEff = [[9.25, 4.08], [9.25, 2.33]];
          const wT = [[6.65, 1.8], [5.55, 1.8]], wFb = [[3.05, 1.8], [1.9, 1.8], [1.9, 4.28]];
          for (const w of [wSet, wE, wU, wEff, wT, wFb]) wire(sd, w, { color: 'muted' });
          for (const w of [wE, wU, wEff, wT, wFb]) flowDots(sd, w, phase, 0.38, { color: 'gold', r: 2 });
          sumJ(sd, 1.9, 4.6, 0.32, { w: '+', s: '−' });
          box(sd, 4.3, 4.6, 2.5, 1.0, 'hypothalamus', { math: false, color: 'accent', sub: 'controller', note: `error e = ${e >= 0 ? '+' : ''}${v.fix(e, 2)} K` });
          box(sd, 8.15, 4.6, 3.0, 1.0, heat ? 'shivering' : cool ? 'sweating' : 'idle', { math: false, color: effCol, fill: effCol, fillAlpha: 0.06 + 0.3 * amt, active: amt > 0.05, sub: 'effectors', note: `${heat ? 'heat +' : cool ? 'heat −' : ''}${Math.round(Math.abs(u))} W`, noteDx: -0.35, noteColor: effCol === 'muted' ? 'ink' : effCol });
          box(sd, 8.15, 1.8, 3.0, 1.0, 'body heat store', { math: false, color: 'ink', sub: 'plant' });
          box(sd, 4.3, 1.8, 2.5, 1.0, 'thermoreceptors', { math: false, color: 'teal', sub: 'sensor', note: `T = ${v.fix(T, 2)} °C` });
          sd.text('set point', 0.15, 4.72, { size: 10.5, color: 'muted', align: 'left', baseline: 'bottom' });
          sd.text('37 °C', 0.15, 4.48, { size: 10.5, color: 'ink', align: 'left', baseline: 'top', weight: 600 });
          const dLab = dist.value === 'cold' ? (th >= TH.t0 ? 'air 5 °C' : 'air 25 °C') : dist.value === 'heat' ? (th >= TH.t0 ? 'air 45 °C' : 'air 25 °C') : th >= TH.t0 && th < 3.5 ? 'exercise +500 W' : 'at rest';
          wire(sd, [[8.15, 0.45], [8.15, 1.25]], { color: 'red', width: 2 });
          sd.text(`disturbance: ${dLab}`, 7.95, 0.62, { size: 10.5, color: 'red', align: 'right', baseline: 'middle', weight: 600 });
          // ---- time traces
          sp.hband(36.5, 37.5, { color: 'green', alpha: 0.08 });
          sp.vline(TH.t0, { color: 'red', dash: [3, 3], width: 1 });
          const series = [['off', 'gray', [6, 4]], ['neg', 'green', null]]; if (showPos.value) series.push(['pos', 'red', null]);
          sp.clip(() => {
            for (const [k, col, dash] of series) {
              const r = R[k];
              trace(sp, r.t, r.T, { color: col, width: 1.2, alpha: 0.25, dash });
              const j = idxAt(r.t, th);
              trace(sp, r.t.slice(0, j + 1), r.T.slice(0, j + 1), { color: col, width: 2.4, dash });
              sp.dot(r.t[j], r.T[j], { r: 4, color: col });
            }
          });
          sp.vline(th, { color: 'gold', width: 1.2 });
          sp.text('normal range', 7.9, 37.5, { size: 10.5, color: 'green', align: 'right', baseline: 'bottom', dy: -2 });
        }, { period: 15, still: 13 });
        v.legend([['green', 'negative feedback'], ['gray', 'no feedback', { dash: true }], ['red', 'reversed sign (positive feedback)']]);
        v.readout(() => {
          const R = get(), G = Gs.value, i = idxAt(R.neg.t, th);
          const dOpen = dist.value === 'cold' ? -20 : dist.value === 'heat' ? 20 : 500 / TH.k;
          const pred = dOpen / (1 + G / TH.k), uNeed = -G * pred, sat = uNeed > TH.umax || uNeed < TH.umin;
          const fmt = (x) => (x > 45 ? '> 45' : x < 25 ? '< 25' : v.fix(x, 2));
          return `at $t = ${v.fix(th, 2)}$ h: feedback $${fmt(R.neg.T[i])}$ °C · no feedback $${fmt(R.off.T[i])}$ °C · reversed $${fmt(R.pos.T[i])}$ °C · open-loop shift $\\Delta T_{\\text{open}} = ${v.fix(dOpen, 1)}$ K; loop gain $G/k = ${v.fix(G / TH.k, 1)}$, so the predicted closed-loop error is $\\Delta T_{\\text{open}}/(1 + G/k) = ${v.fix(pred, 2)}$ K${sat ? ' — but that needs more than the effectors can deliver: **saturated**' : ''}; simulated at 8 h: $${v.fix(R.neg.T.at(-1) - TH.Tset, 2)}$ K`;
        });
      },
    },

    // ------------------------------------------------------------------ 1.2
    {
      num: '1.2',
      kind: 'Concept',
      name: 'Gain of a feedback system',
      statement: String.raw`Let a disturbance shift a regulated variable by $D$ when its feedback loop is open. With the loop closed the variable ends up shifted by a smaller **error** $E$, and the difference $C = E - D$ is the **correction** the loop supplied. The (static) **gain** of the feedback system is
$$G_{\text{fb}} = \frac{\text{correction}}{\text{error}} = \frac{E - D}{E}.$$
For a proportional loop whose effectors respond with $-K$ times the error, $E = D/(1+K)$ and $G_{\text{fb}} = -K$. The minus sign marks negative feedback, and the larger $|G_{\text{fb}}|$, the smaller the fraction $1/(1+K)$ of the disturbance that survives. With a delay $T_d$ in the loop, gains beyond a critical value $K_c(T_d)$ no longer settle: the variable oscillates with growing amplitude.`,
      idea: String.raw`At steady state the effector output $-KE$ must cancel what the disturbance does, apart from the residual error itself. Hence $E + KE = D$, which is the closed-loop disturbance law of control theory, $E = D/(1+L)$ with loop gain $L = K$ (ctrl-1.8). Guyton's textbook example is a transfusion that would raise arterial pressure from 100 to 175 mmHg without the baroreceptors but raises it only to 125 mmHg with them, so the correction is $-50$, the error $+25$ and the gain $-2$. Temperature control in moderate cold is quoted at about $-33$, and the renal control of body fluid volume is effectively infinite because it integrates the error. A delay turns high gain into overcorrection: the effector keeps pushing against an error that has already reversed. The loop turns unstable when the phase lag of the delay reaches $180^\circ$ at the frequency where the loop gain is 1 (ctrl-1.9).`,
      caption: String.raw`A model of arterial pressure, $\tau\dot P = -(P-100) + D + u$ with $\tau = 5$ s, and a baroreflex $u(t) = -K\,(P(t-T_d) - 100)$ that responds after a delay $T_d$. A transfusion adds $D = 75$ mmHg at $t = 5$ s. Left: the open-loop response (dashed) and the regulated one, with the correction and the error marked. Right: the surviving fraction $1/(1+K)$ against $K$, with the region where the delayed loop is unstable shaded red. Set $K = 2$ to recover Guyton's numbers. Then raise $K$, or lengthen the delay, until the pressure starts to oscillate. That is a model of Mayer waves (physio-8.8).`,
      deps: ['physio-1.1', 'ctrl-1.8'],
      see: ['ctrl-1.9', 'ctrl-5.1', 'physio-8.8', 'physio-5.14', 'physio-8.9'],
      refs: ['Guyton–Hall'],
      tags: ['feedback', 'gain'],
      credit: 'Arthur C. Guyton, 1970s (gain of physiological control systems)',
      viz(v) {
        const Ks = v.slider('effector gain $K$', 0.1, 20, 2, { log: true, fmt: (x) => v.fix(x, 2) });
        const Td = v.slider('loop delay $T_d$', 0, 4, 2, { step: 0.05, fmt: (x) => `${v.fix(x, 2)} s` });
        const tau = 5, D = 75, t0 = 5, tEnd = 80, dt = 0.01;
        const sp = v.stage({ x: [0, tEnd], y: [80, 195], height: 300, axes: 'box', xlabel: 't (s)', ylabel: 'arterial pressure (mmHg)', weight: 1.35 });
        const sg = v.stage({ x: [0.1, 100], y: [0, 1.05], xlog: true, height: 300, axes: 'box', xlabel: 'gain K', ylabel: 'surviving fraction of D', weight: 1 });
        const sim = (K, td) => {
          const n = Math.round(tEnd / dt), x = new Float64Array(n + 1), lag = td / dt;
          const delayed = (k) => { const q = k - lag; if (q <= 0) return 0; const i = Math.floor(q), f = q - i; return x[i] + f * ((x[i + 1] ?? x[i]) - x[i]); };
          for (let k = 0; k < n; k++) {
            const t = k * dt, d0 = t >= t0 ? D : 0, d1 = t + dt >= t0 ? D : 0;
            const xd0 = lag < 1 ? x[k] : delayed(k);
            const f0 = (-x[k] + d0 - K * xd0) / tau, xp = x[k] + dt * f0;
            const xd1 = lag < 1 ? xp : delayed(k + 1);
            x[k + 1] = x[k] + (dt / 2) * (f0 + (-xp + d1 - K * xd1) / tau);
          }
          return x;
        };
        const Kcrit = (td) => (td <= 0 ? Infinity : bisect((K) => Math.sqrt(K * K - 1) * (td / tau) - Math.acos(-1 / K), 1 + 1e-9, 1e5));
        let key = '', X = null;
        const get = () => { const k = `${Ks.value}|${Td.value}`; if (k !== key) { key = k; X = sim(Ks.value, Td.value); } return X; };
        const stats = () => {
          const x = get(), n = x.length, from = Math.round((tEnd - 15) / dt);
          let m = 0, lo = Infinity, hi = -Infinity; for (let k = from; k < n; k++) { m += x[k]; lo = Math.min(lo, x[k]); hi = Math.max(hi, x[k]); }
          m /= n - from;
          return { E: m, swing: hi - lo };
        };
        v.render(() => {
          const x = get(), K = Ks.value, kc = Kcrit(Td.value), st = stats(), stable = K < kc && st.swing < 2;
          sp.vline(t0, { color: 'red', dash: [3, 3], width: 1 });
          sp.text('transfusion', t0 + 1, 191, { size: 10.5, color: 'red', align: 'left', baseline: 'top' });
          sp.fn((t) => (t < t0 ? 100 : 100 + D * (1 - Math.exp(-(t - t0) / tau))), { color: 'gray', dash: [6, 4], width: 1.8 });
          sp.hline(100, { color: 'faint', width: 1 });
          const pts = []; for (let k = 0; k < x.length; k += 4) pts.push([k * dt, 100 + x[k]]);
          sp.clip(() => sp.path(pts, { color: stable ? 'accent' : 'red', width: 2.4 }));
          if (stable) {
            const E = st.E, xm = tEnd - 4;
            sp.measure(xm, 100, xm, 100 + E, '');
            sp.text(`error +${v.fix(E, 1)}`, xm - 1.5, 100 + E / 2, { size: 11, color: 'accent', align: 'right', weight: 600 });
            sp.measure(xm - 14, 100 + E, xm - 14, 175, '');
            sp.text(`correction −${v.fix(D - E, 1)}`, xm - 15.5, 100 + E + (D - E) / 2, { size: 11, color: 'green', align: 'right', weight: 600 });
          } else sp.corner('no steady state: the pressure oscillates', 'br', { color: 'red', weight: 600 });
          sp.text('open loop → 175', tEnd - 1, 178, { size: 10.5, color: 'gray', align: 'right', baseline: 'bottom' });
          // gain panel
          if (isFinite(kc) && kc < 100) sg.vband(kc, 100, { color: 'red', alpha: 0.1 });
          sg.fn((k) => 1 / (1 + k), { color: 'accent', width: 2.2 });
          for (const [k, lab] of [[2, 'baroreflex −2'], [33, 'temperature −33']]) { sg.vline(k, { color: 'faint', dash: [2, 3] }); sg.text(lab, k, 0.98, { size: 10, color: 'muted', align: 'center', baseline: 'top', dx: k > 10 ? -4 : 0 }); }
          if (isFinite(kc) && kc < 100) sg.text(`unstable for K > ${v.fix(kc, 2)}`, Math.min(kc * 1.08, 60), 0.62, { size: 11, color: 'red', align: 'left', weight: 600 });
          sg.dot(K, 1 / (1 + K), { r: 5.5, color: stable ? 'accent' : 'red' });
          if (stable) sg.dot(K, st.E / D, { r: 3, color: 'gold', hollow: true });
        });
        v.legend([['gray', 'open loop (no reflex)', { dash: true }], ['accent', 'with the reflex'], ['red', 'unstable: growing oscillation'], ['gold', 'simulated E/D', { dot: true }]]);
        v.readout(() => {
          const K = Ks.value, kc = Kcrit(Td.value), st = stats(), stable = K < kc && st.swing < 2;
          const w = Math.sqrt(Math.max(0, kc * kc - 1)) / tau;
          const crit = isFinite(kc) ? `with a ${v.fix(Td.value, 2)} s delay the loop loses stability at $K_c = ${v.fix(kc, 2)}$ (oscillation period $2\\pi\\tau/\\sqrt{K_c^2-1} = ${v.fix((2 * Math.PI) / w, 1)}$ s)` : 'without delay every $K$ is stable';
          if (!stable) return `$K = ${v.fix(K, 2)}$ exceeds the critical gain: no steady state, peak-to-peak swing ${v.fix(st.swing, 0)} mmHg in the last 15 s · ${crit}`;
          const E = st.E, C = E - D;
          return `simulated: error $E = +${v.fix(E, 2)}$ mmHg, correction $C = ${v.fix(C, 2)}$ mmHg, gain $C/E = ${v.fix(C / E, 3)}$ (theory $-K = ${v.fix(-K, 3)}$) · surviving fraction $E/D = ${v.fix(E / D, 3)}$ vs $1/(1+K) = ${v.fix(1 / (1 + K), 3)}$ · ${crit}`;
        });
      },
    },

    // ------------------------------------------------------------------ 1.3
    {
      num: '1.3',
      kind: 'Law',
      name: 'Fick’s law of diffusion across membranes',
      statement: String.raw`A solute that dissolves in a membrane of thickness $\Delta x$ and diffuses through it with diffusion coefficient $D_m$ crosses at a net rate
$$J = P\,A\,(c_1 - c_2), \qquad P = \frac{K\,D_m}{\Delta x},$$
where $c_1, c_2$ are the concentrations in the two well-stirred baths, $A$ is the membrane area and $K$ is the partition coefficient (membrane concentration divided by bath concentration at equilibrium). The flux is proportional to the concentration difference and to the area, and inversely proportional to the thickness. For two closed compartments of volumes $V_1, V_2$ the difference therefore decays exponentially, $\Delta c(t) = \Delta c(0)\,e^{-t/\tau}$ with $1/\tau = PA\,(1/V_1 + 1/V_2)$.`,
      idea: String.raw`Inside the membrane, Fick's first law $j = -D_m\,dc/dx$ (thermo-7.6, pchem-10.1) with no sources forces a steady linear profile. Its end values are set by partition equilibrium at the two faces, $Kc_1$ and $Kc_2$, so the gradient is $K(c_1-c_2)/\Delta x$. Microscopically, the flux is a small imbalance between huge numbers of random back-and-forth steps (thermo-7.9). Of the molecules that enter from the left face, a fraction of about $1/\text{(number of steps across)}$ gets through to the right, and the rest return. The time to establish the linear profile is the lag time $\Delta x^2/6D_m$. After that the flux follows the bath concentrations.`,
      caption: String.raw`Every dot is a solute molecule doing a random walk. The baths are well stirred and the membrane is a strip of sites in which molecules hop left or right at every step. A molecule enters the membrane with probability set by the partition coefficient $K$ and leaves freely. The readout counts complete crossings since the start, left-to-right minus right-to-left, and compares them with Fick's flux $PA\,\Delta c$ integrated over the run. Halve the thickness and $P$ and the initial flux double while the equilibration time $\tau$ halves; widening the membrane window (the area) raises the flux in proportion. Right: the two bath concentrations, simulated (steps) and predicted by Fick's law (smooth). The animation restarts after 40 s.`,
      scope: String.raw`Holds for an uncharged solute crossing a homogeneous membrane by solubility–diffusion, with stirred baths (unstirred layers add resistance in series). Charged solutes also feel the membrane voltage (1.9); carriers saturate (1.6).`,
      deps: ['thermo-7.6', 'pchem-10.1'],
      see: ['pchem-10.2', 'thermo-7.9', 'mathbio-8.4', 'physio-5.9', 'pharm-1.9'],
      refs: ['Keener–Sneyd ch. 2'],
      tags: ['diffusion', 'membrane transport'],
      credit: 'Adolf Fick, 1855',
      viz(v) {
        const Ls = v.slider('membrane thickness $\\Delta x$', 4, 24, 10, { int: true, fmt: (x) => `${x} sites` });
        const Ks = v.slider('partition coefficient $K$', 0.1, 1, 0.5, { step: 0.05 });
        const hs = v.slider('membrane area $A$', 10, 40, 30, { int: true, fmt: (x) => `${x} sites high` });
        const W = 40, H = 40, Dm = 0.5, SPS = 300, N1 = 520, N2 = 60, TP = 40;
        const sb = v.stage({ x: [-50, 50], y: [-2, 42], equal: true, axes: false, height: 290, weight: 1.25 });
        const sc = v.stage({ x: [0, TP], y: [0, 0.36], height: 290, axes: 'box', xlabel: 't (s)', ylabel: 'concentration (per site)', weight: 1 });
        let sim = null, key = '';
        const make = () => {
          const L = Ls.value, K = Ks.value, h = hs.value, y0 = (H - h) / 2, y1 = y0 + h;
          const xl = -L / 2, xr = L / 2;
          return clocked(1 / SPS, () => {
            const r = v.rng(11), left = [], right = [];
            for (let i = 0; i < N1; i++) left.push({ x: xl - W * r(), y: H * r() });
            for (let i = 0; i < N2; i++) right.push({ x: xr + W * r(), y: H * r() });
            return { left, right, mem: [], r, hist: { t: [0], c1: [N1 / (W * H)], c2: [N2 / (W * H)] }, net: 0, gross: 0, pred: 0, steps: 0 };
          }, (S) => {
            const r = S.r;
            // cosmetic bath motion (stirred baths)
            for (const b of [S.left, S.right]) for (const q of b) {
              q.x += (r() - 0.5) * 1.6; q.y += (r() - 0.5) * 1.6;
              if (q.y < 0) q.y = -q.y; if (q.y > H) q.y = 2 * H - q.y;
            }
            for (const q of S.left) { if (q.x > xl - 0.3) q.x = 2 * (xl - 0.3) - q.x; if (q.x < xl - W) q.x = 2 * (xl - W) - q.x; }
            for (const q of S.right) { if (q.x < xr + 0.3) q.x = 2 * (xr + 0.3) - q.x; if (q.x > xr + W) q.x = 2 * (xr + W) - q.x; }
            // hops inside the membrane
            const keep = [];
            for (const m of S.mem) {
              m.j += r() < 0.5 ? -1 : 1; m.y = clamp(m.y + (r() - 0.5) * 1.2, y0 + 0.3, y1 - 0.3);
              if (m.j < 0) { S.left.push({ x: xl - 0.6, y: m.y }); if (m.from === 'R') { S.net--; S.gross++; } }
              else if (m.j >= L) { S.right.push({ x: xr + 0.6, y: m.y }); if (m.from === 'L') { S.net++; S.gross++; } }
              else keep.push(m);
            }
            S.mem = keep;
            // entries from the stirred baths: rate K·(1/2)·c per unit window height (detailed balance gives c_m = K c)
            for (const [bath, side] of [[S.left, 'L'], [S.right, 'R']]) {
              const c = bath.length / (W * H), k = poisson(r, 0.5 * K * c * h);
              for (let e = 0; e < k && bath.length; e++) {
                let best = -1, bx = -Infinity;
                for (let i = 0; i < bath.length; i++) { const q = bath[i]; if (q.y < y0 || q.y > y1) continue; const d = side === 'L' ? q.x : -q.x; if (d > bx) { bx = d; best = i; } }
                if (best < 0) best = Math.floor(r() * bath.length);
                const q = bath.splice(best, 1)[0];
                S.mem.push({ j: side === 'L' ? 0 : L - 1, y: clamp(q.y, y0 + 0.3, y1 - 0.3), from: side });
              }
            }
            S.pred += ((K * Dm) / (L + 1)) * h * (S.left.length - S.right.length) / (W * H);
            S.steps++;
            if (S.steps % 30 === 0) { S.hist.t.push(S.steps / SPS); S.hist.c1.push(S.left.length / (W * H)); S.hist.c2.push(S.right.length / (W * H)); }
          });
        };
        const params = () => { const L = Ls.value, K = Ks.value, h = hs.value; return { L, K, h, P: (K * Dm) / (L + 1), y0: (H - h) / 2 }; };
        let S = null;
        v.animate((t) => {
          const k = `${Ls.value}|${Ks.value}|${hs.value}`;
          if (k !== key) { key = k; sim = make(); }
          const tt = t % TP; S = sim.to(tt);
          const { L, h, y0 } = params(), xl = -L / 2, xr = L / 2, span = W + L / 2 + 2;
          sb.setView([-span, span], [-2, 42]);
          // baths, walls and membrane window
          sb.rect(xl - W, 0, xl, H, { fill: 'blue', fillAlpha: 0.06, stroke: false });
          sb.rect(xr, 0, xr + W, H, { fill: 'blue', fillAlpha: 0.06, stroke: false });
          sb.rect(xl - W, 0, xr + W, H, { color: 'muted', width: 1.4 });
          bilayer(sb, xl, xr, y0, y0 + h, { spacing: 10 });
          sb.rect(xl, 0, xr, y0, { fill: 'muted', fillAlpha: 0.35, hatch: true, evenodd: true, color: 'muted', width: 1 });
          sb.rect(xl, y0 + h, xr, H, { fill: 'muted', fillAlpha: 0.35, hatch: true, evenodd: true, color: 'muted', width: 1 });
          sb.dots(S.left.map((q) => [q.x, q.y]), { r: 2.1, color: 'gold' });
          sb.dots(S.right.map((q) => [q.x, q.y]), { r: 2.1, color: 'gold' });
          sb.dots(S.mem.map((m) => [xl + 0.5 + m.j, m.y]), { r: 2.6, color: 'orange' });
          sb.text(`c₁ = ${v.fix(S.left.length / (W * H), 3)}`, xl - W / 2, H + 0.8, { size: 11, color: 'ink', align: 'center', baseline: 'bottom', weight: 600 });
          sb.text(`c₂ = ${v.fix(S.right.length / (W * H), 3)}`, xr + W / 2, H + 0.8, { size: 11, color: 'ink', align: 'center', baseline: 'bottom', weight: 600 });
          sb.text('membrane', 0, -0.6, { size: 10.5, color: 'muted', align: 'center', baseline: 'top' });
          // concentration histories
          const { P } = params(), c10 = N1 / (W * H), c20 = N2 / (W * H), cm = (c10 + c20) / 2, rate = (2 * P * h) / (W * H) * SPS;
          sc.fn((x) => cm + ((c10 - c20) / 2) * Math.exp(-rate * x), { color: 'ink', dash: [5, 4], width: 1.4 });
          sc.fn((x) => cm - ((c10 - c20) / 2) * Math.exp(-rate * x), { color: 'ink', dash: [5, 4], width: 1.4 });
          trace(sc, S.hist.t, S.hist.c1, { color: 'accent', width: 2.2 });
          trace(sc, S.hist.t, S.hist.c2, { color: 'orange', width: 2.2 });
          sc.vline(tt, { color: 'gold', width: 1 });
          sc.text(`τ = ${v.fix(1 / rate, 1)} s`, TP - 1, 0.33, { size: 11, color: 'muted', align: 'right' });
        }, { period: TP, still: 12 });
        v.legend([['gold', 'solute in the baths', { dot: true }], ['orange', 'solute inside the membrane', { dot: true }], ['accent', '$c_1$ simulated'], ['orange', '$c_2$ simulated'], ['ink', 'Fick prediction', { dash: true }]]);
        v.readout(() => {
          if (!S) return '';
          const { L, K, P } = params(), lag = (L + 1) ** 2 / (6 * Dm);
          return `$P = KD_m/\\Delta x = ${v.fix(K, 2)}\\times ${Dm} / ${L + 1} = ${v.fix(P, 4)}$ sites/step, initial flux $PA\\,\\Delta c_0 = ${v.fix(P * hs.value * (N1 - N2) / (W * H), 3)}$/step · in ${S.steps} steps: **${S.net}** net crossings counted ($\\pm$ ${Math.round(Math.sqrt(S.gross))}) vs Fick's $\\int PA\\,\\Delta c\\,dt = ${v.fix(S.pred, 1)}$ · lag time $\\Delta x^2/6D_m \\approx ${Math.round(lag)}$ steps`;
        });
      },
    },

    // ------------------------------------------------------------------ 1.4
    {
      num: '1.4',
      kind: 'Law',
      name: 'Osmosis and van ’t Hoff’s law',
      statement: String.raw`When a membrane permeable to water but not to a solute separates pure water from a dilute solution of that solute, water flows into the solution. It stops when the solution side is at a higher hydrostatic pressure by the **osmotic pressure**
$$\Pi = R\,T\,c$$
(van 't Hoff), where $c$ is the total concentration of impermeant solute particles (osmolarity, in $\mathrm{mol/m^3}$). Across a membrane separating two solutions, the volume flux is $J_v = L_p\,(\Delta P - \sigma\,RT\,\Delta c)$. Here $L_p$ is the hydraulic conductivity and $\sigma$ the reflection coefficient: $\sigma = 1$ for an impermeant solute and $\sigma = 0$ for one that crosses as freely as water.`,
      idea: String.raw`Water moves toward lower water chemical potential. Dissolved solute lowers that potential by $RT$ times the solute mole fraction (dilute ideal solution: entropy of mixing, thermo-4.12), and raising the pressure by $\Delta P$ raises it by $\bar V_w\Delta P$. Equilibrium requires the two effects to cancel, and since $x_s/\bar V_w \approx c$ this gives $\Pi = RTc$, formally the ideal-gas law for the solute particles (thermo-4.14, pchem-5.13). The numbers are large: 1 mM at body temperature is 2.6 kPa, about 26 cm of water, and plasma at about 290 mOsm/L would support some 7.5 atm. In a U-tube the inflow also dilutes the solution, so the final column is a little lower than $RTc_0/\rho g$.`,
      caption: String.raw`Left arm: pure water. Right arm: a solution of an impermeant solute (orange dots). They are separated by a membrane at the bottom of the U. Water crosses (blue arrow, width ∝ flow) until the column difference $\Delta h$ supplies $\rho g\,\Delta h = RTc$. The flow has been sped up for display. Change the concentration or the temperature and the final height scales with $c$ and with $T$. Then make the membrane **leaky** to the solute ($\sigma < 1$): the column rises, but as solute leaks across the osmotic pressure difference fades and the levels return together.`,
      scope: String.raw`Holds for dilute ideal solutions (activity coefficients near 1); concentrated or ionic solutions need an osmotic coefficient ($\approx 0.93$ for NaCl in saline). Only solutes that cannot cross the membrane count ($\sigma = 1$); permeant solutes exert only transient osmotic effects (1.5).`,
      deps: ['thermo-4.14'],
      see: ['pchem-5.13', 'pchem-5.17', 'pchem-5.14', 'physio-4.20'],
      refs: ['Keener–Sneyd ch. 2'],
      tags: ['osmosis', 'colligative'],
      credit: 'W. Pfeffer, 1877 (measurements); J. H. van ’t Hoff, 1887 (law)',
      viz(v) {
        const cs = v.slider('solute concentration $c_0$', 0.2, 4, 2, { step: 0.05, fmt: (x) => `${v.fix(x, 2)} mM` });
        const Ts = v.slider('temperature', 0, 40, 37, { step: 1, fmt: (x) => `${x} °C` });
        const mem = v.select('membrane', [{ value: 'semi', label: 'semipermeable ($\\sigma = 1$)' }, { value: 'leaky', label: 'leaky to the solute' }], 'semi');
        const su = v.stage({ x: [-46, 50], y: [-22, 168], equal: true, axes: false, height: 340, weight: 0.9 });
        const sh = v.stage({ x: [0, 30], y: [0, 120], height: 340, axes: 'box', xlabel: 't (display s)', ylabel: 'Δh (cm)', weight: 1.1 });
        const rhog = 1000 * 9.81, A = 1e-4, h0 = 0.5, tauV = 2.2, Lp = 1 / (2 * tauV * rhog), Ps = 0.5 / (2 * 12), dt = 0.01, TEND = 30;
        let key = '', run = null;
        const simulate = () => {
          const T = Ts.value + 273.15, n0 = cs.value * A * h0, sigma = 1, leaky = mem.value === 'leaky';
          let hR = h0, hL = h0, nR = n0, nL = 0; const out = { t: [], dh: [], hR: [], hL: [], nR: [], nL: [], q: [] };
          for (let k = 0, N = Math.round(TEND / dt); k <= N; k++) {
            const cR = nR / (A * hR), cL = nL / (A * hL), dP = rhog * (hR - hL), Jv = Lp * (sigma * R_GAS * T * (cR - cL) - dP);
            out.t.push(k * dt); out.dh.push((hR - hL) * 100); out.hR.push(hR * 100); out.hL.push(hL * 100); out.nR.push(nR); out.nL.push(nL); out.q.push(Jv);
            hR += Jv * dt; hL -= Jv * dt;
            if (leaky) { const js = Ps * A * (cR - cL); nR -= js * dt; nL += js * dt; }
          }
          // equilibrium with dilution (semipermeable): 2ρg hR² − 2ρg h0 hR − RT n/A = 0
          const a = 2 * rhog, b = -2 * rhog * h0, c = -R_GAS * T * n0 / A, hEq = (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a);
          out.eq = 2 * (hEq - h0) * 100; out.naive = (R_GAS * T * cs.value) / rhog * 100; out.hEq = hEq;
          return out;
        };
        const get = () => { const k = `${cs.value}|${Ts.value}|${mem.value}`; if (k !== key) { key = k; run = simulate(); } return run; };
        const pts = (() => { const r = v.rng(3), a = []; for (let i = 0; i < 900; i++) a.push([r(), r()]); return a; })();
        let cur = 0;
        v.animate((t) => {
          const R = get(), tt = Math.min(TEND, t % (TEND + 3)), i = idxAt(R.t, tt); cur = i;
          const hL = R.hL[i], hR = R.hR[i], q = R.q[i];
          // tube geometry (cm): arms x∈[−30,−14] and [14,30], bottom channel y∈[−16,0]
          const xo = 30, xi = 14, yb = -16;
          su.rect(-xo, yb, xo, 0, { fill: 'blue', fillAlpha: 0.13, stroke: false });
          su.rect(-xo, 0, -xi, hL, { fill: 'blue', fillAlpha: 0.13, stroke: false });
          su.rect(xi, 0, xo, hR, { fill: 'blue', fillAlpha: 0.13, stroke: false });
          su.path([[-xi, 160], [-xi, 0], [xi, 0], [xi, 160]], { color: 'ink', width: 2 });
          su.path([[-xo, 160], [-xo, yb], [xo, yb], [xo, 160]], { color: 'ink', width: 2 });
          bilayer(su, -1.6, 1.6, yb, 0, { spacing: 7, r: 1.8 });
          for (let y = 0; y <= 150; y += 25) { su.line(xo, y, xo + 2.5, y, { color: 'muted', width: 1 }); su.text(`${y}`, xo + 3.5, y, { size: 9.5, color: 'muted', align: 'left', baseline: 'middle' }); }
          su.text('cm', xo + 3.5, 160, { size: 9.5, color: 'muted', align: 'left', baseline: 'middle' });
          // solute dots: density ∝ moles per volume on each side
          const kR = Math.round((400 * R.nR[i]) / 2e-4), kL = Math.round((400 * R.nL[i]) / 2e-4);
          const place = (u, w, side, h) => { const a = (xo - 1.6) * 16, tot = a + 16 * h; return u * tot < a ? [side * (1.6 + (u * tot) / 16), yb + w * 16] : [side * (xi + w * 16), (u * tot - a) / 16]; };
          su.dots(pts.slice(0, Math.min(450, kR)).map(([a, b]) => place(a, b, 1, hR)), { r: 2, color: 'orange' });
          if (mem.value === 'leaky') su.dots(pts.slice(450, 450 + Math.min(450, kL)).map(([a, b]) => place(a, b, -1, hL)), { r: 2, color: 'orange' });
          // water flux arrow
          const wq = Math.min(1, Math.abs(q) / 0.02);
          if (wq > 0.02) { const d = q > 0 ? 1 : -1; su.arrow(-9 * d, -8, 9 * d, -8, { color: 'blue', width: 1.5 + 5 * wq, head: 9 + 6 * wq }); }
          su.text('water', -22, yb - 2, { size: 10.5, color: 'blue', align: 'center', baseline: 'top' });
          su.text('solution', 22, yb - 2, { size: 10.5, color: 'orange', align: 'center', baseline: 'top' });
          // Δh bracket
          su.line(-xi - 1, hL, xi + 1, hL, { color: 'muted', dash: [3, 3], width: 1 });
          if (hR - hL > 2) { su.measure(8, hL, 8, hR, ''); su.text(`Δh = ${v.fix(hR - hL, 1)} cm`, 7, (hL + hR) / 2, { size: 11, color: 'ink', align: 'right', weight: 600 }); }
          // history
          sh.setView([0, TEND], [0, Math.max(30, R.naive * 1.15)]);
          sh.hline(R.naive, { color: 'muted', dash: [6, 4], width: 1.3 });
          sh.text('RTc₀/ρg (no dilution)', TEND - 0.5, R.naive, { size: 10.5, color: 'muted', align: 'right', baseline: 'bottom', dy: -2 });
          if (mem.value === 'semi') { sh.hline(R.eq, { color: 'green', dash: [3, 3], width: 1.3 }); sh.text('equilibrium with dilution', TEND - 0.5, R.eq, { size: 10.5, color: 'green', align: 'right', baseline: 'top', dy: 3 }); }
          trace(sh, R.t, R.dh, { color: 'accent', width: 1.2, alpha: 0.25 });
          trace(sh, R.t.slice(0, i + 1), R.dh.slice(0, i + 1), { color: 'accent', width: 2.4 });
          sh.dot(R.t[i], R.dh[i], { r: 4.5, color: 'accent' });
        }, { period: TEND + 3, still: 24 });
        v.legend([['blue', 'net water flow'], ['orange', 'solute', { dot: true }], ['accent', 'column difference Δh']]);
        v.readout(() => {
          const R = get(), i = cur, T = Ts.value + 273.15, cR = R.nR[i] / (A * R.hR[i] / 100), cL = R.nL[i] / (A * R.hL[i] / 100);
          const Pi = R_GAS * T * (cR - cL), dP = rhog * R.dh[i] / 100;
          return `now: $\\rho g\\,\\Delta h = ${v.fix(dP, 0)}$ Pa, $RT\\,\\Delta c = ${v.fix(Pi, 0)}$ Pa (concentration diluted to ${v.fix(cR, 3)} mM) · van 't Hoff for $c_0$: $\\Pi = RTc_0 = ${v.fix(R_GAS * T * cs.value / 1000, 2)}$ kPa $= ${v.fix(R.naive, 1)}$ cm of water${mem.value === 'semi' ? `; with dilution the column stops at ${v.fix(R.eq, 1)} cm` : ''} · for scale, plasma (≈ 290 mOsm/L) has $\\Pi \\approx ${v.fix(R_GAS * 310.15 * 290 / 101325, 1)}$ atm`;
        });
      },
    },

    // ------------------------------------------------------------------ 1.5
    {
      num: '1.5',
      kind: 'Concept',
      name: 'Tonicity and cell volume',
      statement: String.raw`A cell whose membrane passes water freely but holds its contents in behaves as an osmometer. It gains or loses water until its internal osmolality equals the effective osmolality outside. Only solutes that cannot cross the membrane count, and their total outside is the solution's **tonicity**. If the cell contains a fixed amount of osmolyte and an osmotically inactive volume $bV_0$ (solids and bound water), its volume obeys the **Boyle–van 't Hoff relation**
$$\frac{V}{V_0} = b + (1-b)\,\frac{\pi_0}{\pi_{\text{eff}}},$$
where $\pi_0$ is the isotonic osmolality. **Hypotonic** solutions swell cells and **hypertonic** ones shrink them. A red cell can swell only until its fixed membrane area is stretched into a sphere, and beyond that it lyses. A solution can be iso-osmotic yet hypotonic if part of its osmolality is a permeant solute such as urea.`,
      idea: String.raw`Water equilibrates within seconds, much faster than the cell's solute content changes, so the number of trapped osmoles $n$ is fixed and equilibrium means $n/(V - bV_0) = \pi_{\text{eff}}$ (1.4). That is a straight line in $V$ against $1/\pi_{\text{eff}}$. A red cell has a membrane area of roughly $140\ \mu\mathrm{m}^2$ (Evans and Fung measured 135–145) around about 90 fL of contents. The largest volume that area can enclose is a sphere of about 155 fL, about 1.7 times normal. The Boyle–van 't Hoff line reaches that volume at roughly half of normal tonicity, which is why hemolysis starts near 0.45 % NaCl. Cells differ in their area-to-volume ratio, so lysis is spread out until it is complete near 0.30–0.33 %. That spread is what the clinical osmotic fragility test measures.`,
      caption: String.raw`Drag the NaCl concentration. The red cell, drawn in cross-section from the Evans–Fung biconcave shape, swells toward a sphere, holds its shape at 0.9 % or crenates into spiky echinocytes. Blue arrows show the water flow that took it there. Middle: the Boyle–van 't Hoff line, with the critical spherical volume dashed. Bottom: a simulated population of 4,000 cells with realistic spread in volume and area, giving the fraction lysed against NaCl concentration, beside the normal clinical range. Add urea: it raises the osmolality but crosses the membrane, so 300 mM urea in water is iso-osmotic yet lyses the cells.`,
      scope: String.raw`Equilibrium volumes for a perfect osmometer; real red cells regulate volume slowly through ion transporters, and the inactive fraction $b$ depends on the non-ideality of hemoglobin (apparent values 0.4–0.5).`,
      deps: ['physio-1.4'],
      see: ['pchem-5.10', 'physio-1.11'],
      refs: ['Keener–Sneyd ch. 2'],
      tags: ['osmosis', 'cell volume'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Tonicity' },
      viz(v) {
        const nacl = v.slider('NaCl outside', 0.2, 2, 0.9, { step: 0.01, fmt: (x) => `${v.fix(x, 2)} %` });
        const urea = v.slider('urea outside (permeant)', 0, 600, 0, { step: 10, fmt: (x) => `${Math.round(x)} mM` });
        const bs = v.slider('osmotically inactive fraction $b$', 0.3, 0.6, 0.4, { step: 0.01 });
        const scell = v.stage({ x: [-6.2, 6.2], y: [-4.2, 4.2], equal: true, axes: false, height: 270, weight: 1 });
        const sbv = v.stage({ x: [0, 3.6], y: [0, 2.4], height: 270, axes: 'box', xlabel: 'π₀/π_eff', ylabel: 'V/V₀', weight: 1 });
        const sf = v.stage({ x: [0.2, 0.9], y: [0, 1.05], height: 190, axes: 'box', xlabel: 'NaCl (%)', ylabel: 'fraction lysed', full: true, xticks: [0.2, 0.3, 0.4, 0.45, 0.5, 0.6, 0.7, 0.8, 0.9] });
        const phi = 0.93, osmPerPct = 2 * phi * (10 / 58.44) * 1000, pi0 = 0.9 * osmPerPct, V0 = 90, Amem = 140;
        const Vcrit = Amem ** 1.5 / (6 * Math.sqrt(Math.PI)), rc = Math.cbrt((3 * Vcrit) / (4 * Math.PI));
        // population: area-to-volume spread (lognormal-ish), seeded
        const pop = (() => { const r = v.rng(21), out = []; for (let i = 0; i < 4000; i++) { const V = 90 * Math.exp(0.09 * r.normal()), A = 140 * (V / 90) ** 0.667 * Math.exp(0.04 * r.normal()); out.push((A ** 1.5 / (6 * Math.sqrt(Math.PI))) / V); } return out; })();
        const state = () => {
          const b = bs.value, pe = nacl.value * osmPerPct, x = pi0 / pe, Vr = b + (1 - b) * x, V = V0 * Vr;
          return { b, pe, x, Vr, V, lysed: V > Vcrit, total: pe + urea.value };
        };
        const outline = (V) => {
          const pts = [], n = 64;
          if (V >= V0) {
            const s = clamp((V - V0) / (Vcrit - V0), 0, 1), R = EF.R0 * (1 - s) + rc * s;
            for (let k = 0; k <= n; k++) { const th = Math.PI * (k / n), x = Math.cos(th); const z = (1 - s) * efHalf(Math.abs(x)) + s * rc * Math.sqrt(Math.max(0, 1 - x * x)); pts.push([R * x, z]); }
            for (let k = n; k >= 0; k--) { const th = Math.PI * (k / n), x = Math.cos(th); const z = (1 - s) * efHalf(Math.abs(x)) + s * rc * Math.sqrt(Math.max(0, 1 - x * x)); pts.push([R * x, -z]); }
            return pts;
          }
          const f = V / V0, R = EF.R0 * f ** 0.25, zs = f ** 1.2, spike = clamp((0.92 - f) / 0.3, 0, 1);
          const raw = [];
          for (let k = 0; k <= n; k++) { const x = Math.cos(Math.PI * (k / n)); raw.push([R * x, zs * Math.max(efHalf(Math.abs(x)), 0.12)]); }
          for (let k = n; k >= 0; k--) { const x = Math.cos(Math.PI * (k / n)); raw.push([R * x, -zs * Math.max(efHalf(Math.abs(x)), 0.12)]); }
          // crenation: bumps along the outline normal
          const L = raw.length;
          return raw.map((p, k) => { const a = raw[(k + 1) % L], c = raw[(k - 1 + L) % L], tx = a[0] - c[0], ty = a[1] - c[1], nl = Math.hypot(tx, ty) || 1; const bump = spike * 0.42 * Math.max(0, Math.sin((k / L) * Math.PI * 2 * 16)) ** 3; return [p[0] + (ty / nl) * bump, p[1] - (tx / nl) * bump]; });
        };
        v.render(() => {
          const st = state(), { V, lysed } = st;
          // the cell
          scell.rect(-6.2, -4.2, 6.2, 4.2, { fill: 'blue', fillAlpha: 0.04, stroke: false });
          if (!lysed) {
            const conc = clamp(V0 / V, 0.5, 1.6);
            scell.poly(outline(V), { fill: 'red', fillAlpha: 0.18 + 0.35 * (conc - 0.5), color: 'red', width: 2 });
          } else {
            scell.circle(0, 0, rc, { color: 'red', width: 1.6, dash: [5, 4], fill: 'red', fillAlpha: 0.04 });
            const r = v.rng(5), hb = []; for (let i = 0; i < 70; i++) { const a = r() * 2 * Math.PI, d = rc * (0.4 + 1.1 * r()); hb.push([d * Math.cos(a), d * Math.sin(a)]); }
            scell.dots(hb, { r: 2, color: 'red', alpha: 0.55 });
            scell.text('lysed: hemoglobin escapes', 0, -3.75, { size: 11.5, color: 'red', align: 'center', weight: 700 });
          }
          // water arrows
          const flow = Math.log(st.x), mag = clamp(Math.abs(flow) / 0.7, 0, 1);
          if (mag > 0.05) for (let k = 0; k < 8; k++) {
            const a = (k / 8) * 2 * Math.PI + 0.2, r0 = 4.9, r1 = 4.9 - 1.1 * mag, [p, q] = flow > 0 ? [r0, r1] : [r1, r0];
            scell.arrow(p * Math.cos(a) * 1.15, p * Math.sin(a) * 0.82, q * Math.cos(a) * 1.15, q * Math.sin(a) * 0.82, { color: 'blue', width: 1.2 + 1.6 * mag, head: 7 });
          }
          const tag = lysed ? 'hypotonic: swelling past the sphere' : st.x > 1.04 ? 'hypotonic: the cell swells' : st.x < 0.96 ? 'hypertonic: the cell crenates' : 'isotonic: biconcave disc';
          scell.text(tag, 0, 3.85, { size: 11.5, color: lysed ? 'red' : 'ink', align: 'center', weight: 600 });
          scell.text(`V = ${lysed ? '> ' + v.fix(Vcrit, 0) : v.fix(V, 0)} fL`, -6, -3.95, { size: 11, color: 'muted', align: 'left' });
          // Boyle–van 't Hoff line
          const b = st.b;
          sbv.fn((x) => b + (1 - b) * x, { color: 'accent', width: 2.2 });
          sbv.hline(Vcrit / V0, { color: 'red', dash: [5, 4], width: 1.4 });
          sbv.text(`sphere of 140 µm²: ${v.fix(Vcrit, 0)} fL`, 0.1, Vcrit / V0, { size: 10.5, color: 'red', align: 'left', baseline: 'bottom', dy: -2 });
          sbv.hline(b, { color: 'faint', dash: [2, 3] }); sbv.text('b', 3.5, b, { size: 11, color: 'muted', align: 'right', baseline: 'bottom', dy: -2 });
          sbv.vline(1, { color: 'faint', dash: [2, 3] });
          sbv.dot(Math.min(st.x, 3.55), Math.min(st.Vr, 2.35), { r: 5.5, color: lysed ? 'red' : 'accent' });
          // fragility curve of the population
          const curve = [];
          for (let k = 0; k <= 140; k++) { const pct = 0.2 + (0.7 * k) / 140, xr = pi0 / (pct * osmPerPct), vr = b + (1 - b) * xr; let n = 0; for (const c of pop) if (vr > c) n++; curve.push([pct, n / pop.length]); }
          sf.vband(0.3, 0.45, { color: 'green', alpha: 0.1 });
          sf.text('normal clinical range: onset ≈ 0.45 %, complete ≈ 0.30–0.33 %', 0.455, 0.55, { size: 10.5, color: 'green', align: 'left' });
          sf.path(curve, { color: 'red', width: 2.2 });
          const pc = nacl.value; if (pc <= 0.9) sf.vline(pc, { color: 'gold', width: 1.4 });
        });
        v.legend([['accent', "Boyle–van 't Hoff line"], ['red', 'lysis limit / fraction lysed'], ['blue', 'water flow'], ['green', 'clinical fragility range', { area: true }]]);
        v.readout(() => {
          const st = state(), half = bisect((p) => { const xr = pi0 / (p * osmPerPct), vr = st.b + (1 - st.b) * xr; let n = 0; for (const c of pop) if (vr > c) n++; return n / pop.length - 0.5; }, 0.2, 0.9);
          return `osmolality outside ${Math.round(st.total)} mOsm/kg, effective (tonicity) ${Math.round(st.pe)} vs cell ${Math.round(pi0)} · $V/V_0 = ${v.fix(st.Vr, 3)}$ (${st.lysed ? '**lysed**: past' : 'limit'} $V_{\\text{crit}}/V_0 = ${v.fix(Vcrit / V0, 2)}$) · model population: 50 % lysis at ${v.fix(half, 3)} % NaCl${urea.value > 0 ? ` · the ${Math.round(urea.value)} mM urea adds osmolality but no tonicity` : ''}`;
        });
      },
    },

    // ------------------------------------------------------------------ 1.6
    {
      num: '1.6',
      kind: 'Model',
      name: 'Carrier-mediated transport and saturation',
      statement: String.raw`Many solutes, glucose among them, cross membranes on **carrier proteins** that bind the solute on one side, change conformation and release it on the other (alternating access). Because there are finitely many carriers and each takes a finite time per cycle, the flux saturates:
$$J = J_{\max}\,\frac{c}{K_m + c}\qquad(\text{zero-trans uptake}),$$
with $J_{\max} = N\times$(turnover per carrier) and $K_m$ the concentration of half-maximal flux. Simple diffusion instead grows linearly, $J = PAc$ (1.3), without limit. Facilitated transport is passive: the net flux always runs down the concentration gradient and vanishes when $c_{\text{in}} = c_{\text{out}}$. It also shows specificity and competitive inhibition.`,
      idea: String.raw`Model the carrier as a four-state cycle: empty outward-facing ⇄ loaded outward-facing ⇄ loaded inward-facing ⇄ empty inward-facing ⇄ empty outward-facing. With nothing inside, the steady-state flux of this Markov chain has exactly the Michaelis–Menten form (mathbio-5.3). At low $c$ the carriers wait for substrate, so the flux is proportional to $c$. At high $c$ every carrier is loaded as soon as it faces out, and the flux is capped by the conformational rates. $K_m$ is not the binding constant: for this symmetric carrier with fast binding it is about half the dissociation constant. Isoforms with different $K_m$ suit different jobs. GLUT1 in red cells and brain endothelium ($K_m \approx 1.5$ mM) is nearly saturated at blood glucose. Liver and β-cell GLUT2 ($K_m \approx 17$–20 mM) is not, so its flux tracks blood glucose (Lodish, Molecular Cell Biology).`,
      caption: String.raw`Each carrier in the membrane is a stochastic four-state machine with its own random transitions: binding (gold hexagon), flipping, release and flipping back empty. Glucose is cleared inside as fast as it arrives (zero-trans). Right: the flux per carrier against outside concentration. The blue curve is the exact steady state of the chain, the dashed curve the Michaelis–Menten fit, the orange line a channel-like pathway with the same initial slope, and the gold point the flux counted from the animation. Switch between GLUT1 and GLUT2 and compare the flux at a blood glucose of 5 mM.`,
      scope: String.raw`A single symmetric carrier species with no substrate on the trans side; with trans substrate, exchange and asymmetry add terms, and coupled carriers (symporters) can move a solute uphill.`,
      deps: ['physio-1.3', 'mathbio-5.3'],
      see: ['mathbio-5.4', 'pharm-5.1', 'sysbio-10.5'],
      refs: ['Keener–Sneyd ch. 2', 'Lodish, Molecular Cell Biology §11.2'],
      tags: ['membrane transport', 'saturation'],
      viz(v) {
        const iso = v.select('carrier', [{ value: 1.5, label: 'GLUT1 ($K_m$ 1.5 mM)' }, { value: 17, label: 'GLUT2 ($K_m$ 17 mM)' }], 1.5);
        const cs = v.slider('glucose outside $c$', 0, 40, 5, { step: 0.5, fmt: (x) => `${v.fix(x, 1)} mM` });
        const Ns = v.slider('carriers', 4, 14, 10, { int: true });
        const sm = v.stage({ x: [0, 14.5], y: [-2.6, 4.2], equal: true, axes: false, height: 270, weight: 1.15 });
        const sj = v.stage({ x: [0, 40], y: [0, 0.6], height: 270, axes: 'box', xlabel: 'c outside (mM)', ylabel: 'flux per carrier (s⁻¹)', weight: 1 });
        const kdCache = new Map();
        const kd = () => { const k = +iso.value; if (!kdCache.has(k)) kdCache.set(k, kdForKm(k)); return kdCache.get(k); };
        let sim = null, key = '';
        const make = () => {
          const Kd = kd(), N = Ns.value, c = cs.value, kon = CAR.koff / Kd;
          return clocked(0.004, () => ({ st: Array.from({ length: N }, (_, i) => i % 4), done: 0, t: 0, r: v.rng(17), flash: new Array(N).fill(-9) }), (S, t, dt) => {
            const r = S.r;
            for (let i = 0; i < N; i++) {
              const s = S.st[i];
              // rates out of each state: 0 Eo → 1 (kon c), 3 (kf); 1 ESo → 0 (koff), 2 (kf); 2 ESi → 1 (kf), 3 (koff, release inside); 3 Ei → 0 (kf)
              const rates = s === 0 ? [[1, kon * c], [3, CAR.kf]] : s === 1 ? [[0, CAR.koff], [2, CAR.kf]] : s === 2 ? [[1, CAR.kf], [3, CAR.koff]] : [[0, CAR.kf]];
              let tot = 0; for (const [, k] of rates) tot += k;
              if (r() < 1 - Math.exp(-tot * dt)) {
                let u = r() * tot; for (const [to, k] of rates) { u -= k; if (u <= 0) { if (s === 2 && to === 3) { S.done++; S.flash[i] = t; } S.st[i] = to; break; } }
              }
            }
            S.t = t + dt;
          });
        };
        let S = null;
        v.animate((t) => {
          const k = `${iso.value}|${Ns.value}|${cs.value}`;
          if (k !== key) { key = k; sim = make(); }
          S = sim.to(t * 1.0);
          const N = Ns.value, c = cs.value;
          // membrane and compartments
          sm.rect(0, 0.9, 14.5, 4.2, { fill: 'blue', fillAlpha: 0.05, stroke: false });
          sm.rect(0, -2.6, 14.5, -0.9, { fill: 'gold', fillAlpha: 0.05, stroke: false });
          bilayer(sm, 0, 14.5, -0.9, 0.9, { vertical: false, spacing: 8 });
          sm.text('outside', 0.2, 3.95, { size: 11, color: 'muted', align: 'left', baseline: 'top' });
          sm.text('inside (glucose used at once)', 0.2, -2.45, { size: 11, color: 'muted', align: 'left', baseline: 'bottom' });
          // free glucose outside, density ∝ c
          const r = v.rng(4), nG = Math.round(Math.min(120, c * 3.2));
          const gl = []; for (let i = 0; i < nG; i++) gl.push([0.3 + 13.9 * r(), 1.5 + 2.2 * r()]);
          const hex = (x, y, sz, col) => { const p = []; for (let j = 0; j < 6; j++) p.push([x + sz * Math.cos((j * Math.PI) / 3), y + sz * Math.sin((j * Math.PI) / 3)]); sm.poly(p, { fill: col, fillAlpha: 0.75, color: col, width: 1 }); };
          for (const [x, y] of gl) hex(x + 0.12 * Math.sin(3 * t + x * 7), y + 0.1 * Math.cos(2.3 * t + y * 5), 0.13, 'gold');
          // carriers
          const dx = 14.5 / N;
          for (let i = 0; i < N; i++) {
            const x = dx * (i + 0.5), s = S.st[i], outF = s === 0 || s === 1, w = Math.min(0.42, dx * 0.32);
            const col = 'teal', a = x - w - 0.15, near = x - 0.03, far = x - 0.28;
            const Lp = outF ? [[a, -1.15], [near, -1.15], [far, 1.15], [a, 1.15]] : [[a, -1.15], [far, -1.15], [near, 1.15], [a, 1.15]];
            sm.poly(Lp, { fill: col, fillAlpha: 0.55, color: col, width: 1.2 });
            sm.poly(Lp.map(([px, py]) => [2 * x - px, py]), { fill: col, fillAlpha: 0.55, color: col, width: 1.2 });
            if (s === 1 || s === 2) hex(x, s === 1 ? 0.45 : -0.45, 0.17, 'gold');
            const since = S.t - S.flash[i];
            if (since < 0.35) hex(x, -1.3 - since * 2.2, 0.15, 'gold');
          }
          // flux curve
          const Kd = kd(), Jm = carrierJmax(Kd), Km = carrierKm(Kd);
          sj.setView([0, 40], [0, Jm * 1.3]);
          const slope = carrierFlux(1e-4, Kd) / 1e-4;
          sj.fn((x) => slope * x, { color: 'orange', width: 1.8 });
          sj.fn((x) => (Jm * x) / (Km + x), { color: 'ink', dash: [6, 4], width: 1.3 });
          sj.fn((x) => carrierFlux(x, Kd), { color: 'accent', width: 2.4, n: 120 });
          sj.hline(Jm, { color: 'muted', dash: [2, 3] }); sj.text('J_max', 39.5, Jm, { size: 11, color: 'muted', align: 'right', baseline: 'bottom', dy: -2 });
          sj.vline(Km, { color: 'faint', dash: [2, 3] }); sj.text('K_m', Km, Jm * 0.08, { size: 11, color: 'muted', align: 'left', dx: 4 });
          sj.hline(Jm / 2, { color: 'faint', dash: [2, 3] });
          sj.vline(c, { color: 'gold', width: 1 });
          if (S.t > 2) {
            const m = S.done / (N * S.t), se = Math.sqrt(Math.max(1, S.done)) / (N * S.t);
            sj.line(c, m - se, c, m + se, { color: 'gold', width: 2 });
            sj.dot(c, m, { r: 5, color: 'gold' });
          }
        }, { period: 1e9, still: 40 });
        v.legend([['accent', 'four-state chain, exact'], ['ink', 'Michaelis–Menten fit', { dash: true }], ['orange', 'linear (diffusion-like) pathway'], ['gold', 'counted from the animation', { dot: true }]]);
        v.readout(() => {
          if (!S) return '';
          const Kd = kd(), Jm = carrierJmax(Kd), Km = carrierKm(Kd), c = cs.value, J = carrierFlux(c, Kd), N = Ns.value;
          return `chain: $J(c) = ${v.fix(J, 4)}$ s⁻¹ per carrier; Michaelis–Menten with $J_{\\max} = ${v.fix(Jm, 3)}$, $K_m = ${v.fix(Km, 2)}$ mM gives ${v.fix((Jm * c) / (Km + c), 4)} · counted: ${S.done} crossings by ${N} carriers in ${v.fix(S.t, 1)} s = ${v.fix(S.done / (N * Math.max(S.t, 1e-9)), 3)} s⁻¹ · saturation $c/(K_m + c) = ${v.fix((100 * c) / (Km + c), 0)}\\%$ (binding $K_d = ${v.fix(Kd, 2)}$ mM, so $K_m \\approx K_d/2$)`;
        });
      },
    },
  ],
};
