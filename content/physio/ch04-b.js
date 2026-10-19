import { pulseSpeed, reflectedDelay } from './vessel-flow.shared.js';
import { vesselVolume, pressureForVolume, vesselCompliance } from './compliance.shared.js';
// Human Physiology — Chapter 4: Circulation: pressure, flow and resistance (part b: 4.6–4.10)
import { clamp, windkessel, RHO_BLOOD } from './ch04.shared.js';

const AGES = {
  young: { C: 1.6, Zc: 0.04, label: 'young' },
  middle: { C: 1.1, Zc: 0.06, label: 'middle-aged' },
  old: { C: 0.6, Zc: 0.1, label: 'old / stiff' },
};

export default {
  collection: 'physio',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.6
    {
      num: '4.6',
      kind: 'Concept',
      name: 'Compliance and vascular distensibility',
      statement: String.raw`The **compliance** of a vascular segment is the volume it gains per unit rise in its transmural pressure, $C=dV/dP$ (mL/mmHg); its **distensibility** is the same quantity as a fraction of the starting volume, $C/V$. Veins are highly compliant (they have to be: a large venous volume change takes place at a few mmHg of pressure), arteries are much stiffer. The same added volume therefore raises the pressure of an artery many times more than that of a vein, and the veins act as the body's blood reservoir, holding the large majority of the blood at low pressure.`,
      idea: String.raw`Compliance is the slope of the pressure–volume curve. Vessel walls are thin elastic (and, for veins, partly collapsible) shells: a vein is floppy and its cross-section can open from a flat slit to a circle at almost no pressure, whereas an artery's wall contains the collagen and elastin that stiffen it within the physiological range, which is why its curve is steep. The stiffening is also the origin of the pulse pressure (physio-4.7): the arterial compliance is what the Windkessel stores each stroke in. In the model the volume is $V=V_u+C_0 p_\infty(1-e^{-P/p_\infty})$: an unstressed part plus a stressed part that saturates as the wall stiffens.`,
      caption: String.raw`The **left** panel is the pressure–volume curve of the arterial and the venous system (a model with textbook-like orders of magnitude, not a data fit); drag the **operating pressure** to read the local compliance (the tangent). The **right** panel adds the same volume to each side: the arterial pressure climbs far more than the venous pressure. Raise the added volume: if it exceeds the remaining capacity of the saturating model, no finite pressure can accommodate it. The common-pressure control includes high pressures that are unphysiological for systemic veins; the model curves can then reverse their compliance ordering.`,
      scope: String.raw`Static (equilibrium) compliances; vessel walls also creep and relax over minutes (viscoelasticity), and veins are actively tuned by sympathetic tone. The numbers are chosen to match typical textbook statements (the veins carry roughly two thirds of the blood, with a compliance an order of magnitude or more above the arteries), so they are illustrative.`,
      deps: [],
      see: ['physio-4.7', 'physio-4.17'],
      refs: ['Guyton–Hall'],
      tags: ['compliance', 'veins'],
      verify: true,
      viz(v) {
        const A = { Vu: 500, C0: 2.2, pinf: 250 }, B = { Vu: 2800, C0: 110, pinf: 25 };
        const V = vesselVolume;
        const slope = vesselCompliance;
        const Pof = pressureForVolume;
        const sP = v.slider('operating pressure', 2, 120, 10, { step: 1, fmt: (x) => `${x} mmHg` });
        const sdV = v.slider('volume added to each', 10, 500, 100, { step: 10, fmt: (x) => `${x} mL` });
        const a = v.stage({ x: [0, 130], y: [0, 6000], height: 320, axes: 'box', gutter: true, xlabel: 'transmural pressure (mmHg)', ylabel: 'volume (mL)', weight: 1.2 });
        const b = v.stage({ x: [0, 3], y: [0, 400], height: 320, axes: 'box', gutter: true, ylabel: 'pressure rise (mmHg)', xticks: [[1, 'artery'], [2, 'vein']], weight: 0.8, minWidth: 220 });
        let o = null;
        v.render(() => {
          const P = sP.value, dV = sdV.value;
          a.fn((p) => V(A, p), { color: 'red', width: 2.6 }); a.fn((p) => V(B, p), { color: 'accent', width: 2.6 });
          a.text('arteries', 118, V(A, 118) + 260, { size: 12, color: 'red', align: 'right', weight: 700 }); a.text('veins', 118, V(B, 118) - 300, { size: 12, color: 'accent', align: 'right', weight: 700 });
          for (const [m, col] of [[A, 'red'], [B, 'accent']]) {
            const y = V(m, P), s0 = slope(m, P);
            a.dot(P, y, { r: 6, color: col });
            a.path([[P - 12, y - 12 * s0], [P + 12, y + 12 * s0]], { color: 'gold', width: 3 });
          }
          a.vline(P, { color: 'faint', dash: [4, 4] });
          const pa = Pof(A, V(A, P) + dV) - P, pv = Pof(B, V(B, P) + dV) - P;
          const ymax = Math.max(400, ...[pa, pv].filter(Number.isFinite).map(x => x * 1.15)); b.setView([0, 3], [0, ymax]);
          const shown = x => Number.isFinite(x) ? x : ymax * .9;
          const label = (x, digits) => Number.isFinite(x) ? `+${v.fix(x, digits)}` : 'no finite P';
          b.rect(0.6, 0, 1.4, shown(pa), { fill: 'red', fillAlpha: 0.35, color: 'red' }); b.rect(1.6, 0, 2.4, shown(pv), { fill: 'accent', fillAlpha: 0.35, color: 'accent' });
          b.text(label(pa, 0), 1, shown(pa) + 14, { size: 13, color: 'red', align: 'center', weight: 700 }); b.text(label(pv, 1), 2, shown(pv) + ymax * .035, { size: 13, color: 'accent', align: 'center', weight: 700 });
          o = { Ca: slope(A, P), Cv: slope(B, P), pa, pv, fv: V(B, 8) / (V(B, 8) + V(A, 100)) };
        });
        v.readout(() => `at ${sP.value} mmHg: $C_\\text{artery}=dV/dP=${v.fix(o.Ca, 2)}$ mL/mmHg, $C_\\text{vein}=${v.fix(o.Cv, 1)}$ mL/mmHg (ratio ${v.fix(o.Cv / o.Ca, 0)}:1)\nadding ${sdV.value} mL raises arterial pressure by ${Number.isFinite(o.pa) ? `${v.fix(o.pa, 0)} mmHg` : 'no finite amount (capacity exceeded)'} and venous pressure by ${Number.isFinite(o.pv) ? `${v.fix(o.pv, 1)} mmHg` : 'no finite amount (capacity exceeded)'};  in the model ${v.fix(100 * o.fv, 0)}% of the volume of these two compartments is venous (at 8 and 100 mmHg)`);
      },
    },
    // ------------------------------------------------------------------ 4.7
    {
      num: '4.7',
      kind: 'Model',
      name: 'Two-element Windkessel model',
      statement: String.raw`Model the arterial tree as one elastic chamber of compliance $C$ draining through one peripheral resistance $R$. With inflow $Q(t)$ from the heart and venous pressure taken as zero,
$$C\,\frac{dP}{dt}=Q(t)-\frac{P}{R}.$$
During diastole $Q=0$ and the pressure decays exponentially, $P(t)=P_{es}\,e^{-(t-t_{es})/RC}$, with time constant $\tau=RC$ (typically about 1–2 s); averaged over a beat, $\bar P=\bar Q R$ regardless of $C$. A compliant chamber turns the pulsatile output of the heart into a nearly steady flow through the periphery.`,
      idea: String.raw`It is an RC circuit (em-6.12) with flow as current and pressure as voltage: the chamber stores the part of each stroke that does not leave through $R$ during ejection, and returns it during diastole, so the peripheral flow is smoother than the cardiac flow. Integrating the equation over a whole beat kills the storage term (the chamber ends where it started) and leaves $\bar Q=\bar P/R$, which is Ohm's law (physio-4.1) for the mean. The word comes from the German *Windkessel*, the air chamber of a fire-engine pump, an analogy attributed to Otto Frank (1899); the idea of an elastic reservoir smoothing the pulse is older.`,
      caption: String.raw`The heart ejects a half-sine of flow during the first 35% of each beat. **Top:** aortic pressure (blue) and the exponential $P_{es}e^{-t/RC}$ continuing from end-systole (dashed green), which it follows exactly in diastole. **Bottom:** inflow (gold) and outflow through the peripheral resistance (green), whose areas are equal over a beat. Lower the **compliance** to a stiff vessel and the pressure swings wide; make it large and the pressure and outflow flatten to a constant. Raise the **resistance** and the mean pressure and the decay time both rise.`,
      scope: String.raw`Lumped model: it carries no wave propagation or reflections, and an ejection with a sharp onset makes the pressure jump unrealistically fast (fixed in the three-element version, physio-4.8). It reproduces the mean pressure and the diastolic decay well, and gets the pulse pressure only roughly. Venous pressure is set to zero.`,
      deps: ['physio-4.1', 'physio-4.6', 'em-6.12', 'ode-1.4'],
      see: ['physio-4.8'],
      refs: ['Keener–Sneyd ch. 11'],
      tags: ['Windkessel', 'RC circuit'],
      credit: 'S. Hales (1733) for the idea; O. Frank (1899) for the analysis',
      links: { doi: 'https://doi.org/10.1016/0022-2828(90)91459-K' },
      verify: true,
      viz(v) {
        const sR = v.slider('peripheral resistance $R$', 0.4, 2, 1.05, { step: 0.05, fmt: (x) => `${v.fix(x, 2)} mmHg·s/mL` });
        const sC = v.slider('compliance $C$', 0.2, 8, 1.5, { log: true, sig: 2, fmt: (x) => `${v.fix(x, 2)} mL/mmHg` });
        const sHR = v.slider('heart rate', 50, 130, 75, { step: 1, fmt: (x) => `${x} /min` });
        const a = v.stage({ x: [0, 2], y: [40, 150], height: 280, axes: 'box', gutter: true, xlabel: 'time (beats)', ylabel: 'pressure (mmHg)', weight: 1, full: true });
        const b = v.stage({ x: [0, 2], y: [0, 450], height: 200, axes: 'box', gutter: true, xlabel: 'time (beats)', ylabel: 'flow (mL/s)', weight: 1, full: true });
        let o = null;
        v.render(() => {
          const R = sR.value, C = sC.value, HR = sHR.value;
          const W = windkessel({ R, C, HR }), T = W.T;
          const pressureSpan = Math.max(30, W.Ps - W.Pd);
          a.setView([0, 2], [Math.max(0, W.Pd - .2 * pressureSpan), W.Ps + .3 * pressureSpan]);
          b.setView([0, 2], [0, 1.15 * Math.max(...W.Q, W.Ps / R)]);
          const x = (t) => t / T;
          const two = (arr, f) => { const pts = []; for (let b2 = 0; b2 < 2; b2++) for (let i = 0; i < W.t.length; i++) pts.push([(W.t[i] + b2 * T) / T, f(i)]); return pts; };
          a.vband(0, W.Ts / T, { color: 'red', alpha: 0.06 }); a.vband(1, 1 + W.Ts / T, { color: 'red', alpha: 0.06 });
          a.path(two(W.P, (i) => W.P[i]), { color: 'accent', width: 2.8 });
          // diastolic exponential from end-systole
          const iEs = W.t.findIndex((t) => t >= W.Ts), tEs = W.t[iEs], Pes = W.P[iEs];
          for (let b2 = 0; b2 < 2; b2++) { const pts = []; for (let t = tEs; t <= T; t += T / 80) pts.push([(t + b2 * T) / T, Pes * Math.exp(-(t - tEs) / (R * C))]); a.path(pts, { color: 'green', width: 2, dash: [6, 4] }); }
          a.hline(W.Pm, { color: 'orange', dash: [3, 4] }); a.text('mean', 1.98, W.Pm, { size: 11, color: 'orange', align: 'right', baseline: 'bottom', dy: -2 });
          a.text(`${v.fix(W.Ps, 0)}`, 0.0 + W.Ts / T, W.Ps + 8, { size: 11, color: 'accent', align: 'center' });
          b.path(two(W.Q, (i) => W.Q[i]), { color: 'gold', width: 2.4 });
          b.path(two(W.Q, (i) => W.P[i] / R), { color: 'green', width: 2.4 });
          b.hline(W.Qmean, { color: 'orange', dash: [3, 4] });
          o = { W, R, C, Pes, tau: R * C, fall: Pes * Math.exp(-(T - tEs) / (R * C)) };
        });
        v.legend([['accent', 'aortic pressure'], ['green', 'diastolic decay $P_{es}e^{-t/RC}$', { dash: true }], ['gold', 'flow in (heart)'], ['green', 'flow out (periphery)']]);
        v.readout(() => `$\\tau=RC=${v.fix(o.tau, 2)}$ s;  mean pressure ${v.fix(o.W.Pm, 1)} mmHg vs $\\bar Q R=${v.fix(o.W.Qmean * o.R, 1)}$ mmHg;  systolic/diastolic ${v.fix(o.W.Ps, 0)}/${v.fix(o.W.Pd, 0)} (pulse pressure ${v.fix(o.W.PP, 0)})\nend-diastolic pressure from the exponential: ${v.fix(o.fall, 1)} mmHg vs simulated ${v.fix(o.W.P.at(-1), 1)} mmHg`);
      },
    },
    // ------------------------------------------------------------------ 4.8
    {
      num: '4.8',
      kind: 'Model',
      name: 'Three-element Windkessel and pulse pressure',
      statement: String.raw`Adding a **characteristic impedance** $Z_c$ in series between the heart and the two-element chamber gives the three-element Windkessel: the pressure at the aortic root is
$$P(t)=P_w(t)+Z_c\,Q(t),\qquad C\,\dot P_w=Q-\frac{P_w-P_v}{R}.$$
The jump $Z_cQ$ models the pressure needed to push flow into the proximal aorta, which damps the unphysiological spike of the two-element model. At fixed stroke volume, heart rate, $R$ and $Z_c$, changing $C$ leaves the mean pressure unchanged: $\bar P=P_v+(R+Z_c)\bar Q$, while the **pulse pressure** $P_{sys}-P_{dia}$ rises as the compliance $C$ falls: stiffer arteries give a higher systolic and lower diastolic pressure, as in ageing.`,
      idea: String.raw`The chamber's compliance sets how much of each stroke it can absorb: with a stroke volume $SV$, the pressure swing is roughly $SV_\text{stored}/C$, so halving $C$ roughly doubles the swing about an unchanged mean (physio-4.7). The element $Z_c$ is the high-frequency impedance of the aorta (the pressure–flow ratio when reflections are absent), and a stiffer aorta, which has a larger $Z_c$ as well as a smaller $C$, has a larger early-systolic pressure. The three-element form was proposed as an electrical load for isolated heart experiments and has become the standard lumped arterial load.`,
      caption: String.raw`Choose a stage of life or drag the elements yourself. The **top** panel draws the aortic pressure of the three-element model (blue) against the two-element model with the same $R$ and $C$ (dashed grey); the **bottom** panel plots pulse pressure against compliance with your setting marked. Lower $C$: systolic pressure rises, diastolic pressure falls, the mean barely moves. Set $Z_c=0$ and the two models coincide.`,
      scope: String.raw`Parameter sets for "young, middle-aged, old" are illustrative round numbers chosen to give familiar pressures, not patient data. The model has the same stroke volume and rate in all cases, whereas an older heart usually adapts; real pulse pressure also depends on wave reflection (physio-4.9).`,
      deps: ['physio-4.7', 'circ-2.3'],
      see: ['physio-4.9'],
      refs: ['Keener–Sneyd ch. 11'],
      tags: ['Windkessel', 'pulse pressure', 'ageing'],
      credit: 'N. Westerhof, G. Elzinga and P. Sipkema, 1971',
      links: { doi: 'https://doi.org/10.1152/jappl.1971.31.5.776' },
      viz(v) {
        const age = v.select('arteries', Object.entries(AGES).map(([k, a]) => ({ value: k, label: a.label })).concat([{ value: 'custom', label: 'custom' }]), 'young', {
          onChange: (k) => { if (AGES[k]) { sC.set(AGES[k].C); sZ.set(AGES[k].Zc); } },
        });
        const sC = v.slider('compliance $C$', 0.3, 3, 1.6, { log: true, sig: 2, fmt: (x) => `${v.fix(x, 2)} mL/mmHg` });
        const sZ = v.slider('characteristic impedance $Z_c$', 0, 0.15, 0.04, { step: 0.005, fmt: (x) => `${v.fix(x, 3)}` });
        const sR = v.slider('resistance $R$', 0.6, 1.8, 1.05, { step: 0.05, fmt: (x) => `${v.fix(x, 2)}` });
        const a = v.stage({ x: [0, 1], y: [40, 190], height: 300, axes: 'box', gutter: true, xlabel: 'time in the beat (fraction of one beat)', ylabel: 'aortic pressure (mmHg)', weight: 1.2 });
        const b = v.stage({ x: [0.3, 3], y: [20, 100], height: 300, axes: 'box', gutter: true, xlabel: 'compliance C (mL/mmHg)', ylabel: 'pulse pressure (mmHg)', weight: 0.8, minWidth: 240 });
        const cache = {};
        let o = null;
        v.render(() => {
          const C = sC.value, Zc = sZ.value, R = sR.value;
          const W3 = windkessel({ R, C, Zc }), W2 = windkessel({ R, C, Zc: 0 }), T = W3.T;
          const low = Math.min(W2.Pd, W3.Pd), high = Math.max(W2.Ps, W3.Ps), span = Math.max(30, high-low);
          a.setView([0, 1], [Math.max(0, low-.2*span), high+.2*span]);
          a.path(W2.t.map((t, i) => [t / T, W2.P[i]]), { color: 'muted', width: 1.8, dash: [6, 4] });
          a.path(W3.t.map((t, i) => [t / T, W3.P[i]]), { color: 'accent', width: 2.8 });
          a.hline(W3.Pm, { color: 'orange', dash: [3, 4] }); a.text('mean', 0.99, W3.Pm, { size: 11, color: 'orange', align: 'right', baseline: 'bottom', dy: -2 });
          a.hline(W3.Ps, { color: 'red', dash: [2, 4], alpha: 0.7 }); a.hline(W3.Pd, { color: 'green', dash: [2, 4], alpha: 0.7 });
          a.text(`${v.fix(W3.Ps, 0)}`, 0.02, W3.Ps + 5, { size: 12, color: 'red', weight: 700, align: 'left' }); a.text(`${v.fix(W3.Pd, 0)}`, 0.02, W3.Pd - 7, { size: 12, color: 'green', weight: 700, align: 'left' });
          const key = `${R}|${Zc}`; cache[key] ??= Array.from({ length: 22 }, (_, k) => { const c = 0.3 * Math.pow(10, (k / 21)); return [c, windkessel({ R, C: c, Zc, beats: 10 }).PP]; });
          b.setView([.3, 3], [0, Math.max(...cache[key].map(p=>p[1]))*1.15]);
          b.path(cache[key], { color: 'purple', width: 2.6 }); b.dot(C, W3.PP, { r: 8, color: 'gold' });
          o = { W3, W2 };
        });
        v.legend([['accent', 'three-element'], ['muted', 'two-element, same R, C', { dash: true }]]);
        v.readout(() => `systolic / diastolic = ${v.fix(o.W3.Ps, 0)} / ${v.fix(o.W3.Pd, 0)} mmHg → pulse pressure ${v.fix(o.W3.PP, 0)} mmHg;  mean ${v.fix(o.W3.Pm, 1)} mmHg ($(R+Z_c)\\bar Q=${v.fix(o.W3.Qmean * (sR.value + sZ.value), 1)}$)\ntwo-element model with the same $R,C$: ${v.fix(o.W2.Ps, 0)} / ${v.fix(o.W2.Pd, 0)} mmHg`);
      },
    },
    // ------------------------------------------------------------------ 4.9
    {
      num: '4.9',
      kind: 'Phenomenon',
      name: 'Pulse-wave velocity and wave reflection',
      statement: String.raw`A pressure pulse in an elastic artery travels as a wave at the **Moens–Korteweg speed** $c=\sqrt{Eh/(\rho d)}$, where $E$ is the wall's elastic modulus, $h$ its thickness, $d$ the lumen diameter and $\rho$ the blood density; stiffer arteries carry the pulse faster (about 4–5 m/s in a young adult's aorta, 8 m/s or more in an old one). Where the arterial tree changes (branches, a smaller-calibre bed, the resistance vessels) part of the wave is reflected with coefficient $\Gamma$ and travels back; the pressure measured at a site is the sum of the forward and the reflected waves, $p(t)=p_f(t)+\Gamma\,p_f(t-2\ell/c)$ for a reflector at distance $\ell$. The faster the wave, the sooner the reflection returns, and when it arrives during systole it **augments** the central systolic pressure.`,
      idea: String.raw`The wall stiffness enters because a pressure rise distends the wall and the inertia of the fluid has to drag that distension along; in the linear, long-wavelength limit the equations of mass and momentum conservation in an elastic tube give a wave equation with speed $\sqrt{A/(\rho\,dA/dP)}$, which for a thin wall is the Moens–Korteweg formula. A reflection arises wherever the impedance changes; the returning wave is a delayed copy of the forward one, so its effect depends only on the round-trip time $2\ell/c$ relative to the length of systole. Young arteries are compliant, the reflection comes back in diastole and helps coronary filling; stiff arteries bring it back in late systole and raise the load on the ventricle.`,
      caption: String.raw`**Top:** a snapshot of the pulse running down the artery (forward wave blue, reflected wave orange, sum black) towards a reflecting site at distance $\ell$; it animates, and you can pause it. **Bottom:** the pressure waveform at the measuring site (drag it along the artery) as a function of time. Raise the **wall stiffness** $E$: the speed $c$ rises, the round-trip delay shrinks, and the reflected hump slides from diastole into late systole, adding to the central peak. The **reflection coefficient** scales it.`,
      scope: String.raw`Linear, lossless, non-dispersive waves in a uniform tube with a single point reflector; real arteries have damping, taper, many reflection sites and frequency-dependent wave speed. $h/r$ is fixed at 0.1 and the "elastic modulus" is an effective value; the controls generate calculated speeds of about 3.1–10.9 m/s. The stiffness/thickness settings and sinusoidal humps are illustrative, not measured human reference data.`,
      deps: ['physio-4.6', 'pde-1.3', 'solid-1.4'],
      see: ['physio-4.8'],
      refs: ['Keener–Sneyd ch. 11'],
      tags: ['waves', 'stiffness', 'reflection'],
      credit: 'A. I. Moens and D. J. Korteweg, 1878',
      links: { doi: 'https://doi.org/10.1002/andp.18782411206' },
      verify: true,
      viz(v) {
        const sE = v.slider('wall stiffness $E$', 0.2, 2.5, 1.8, { step: 0.05, fmt: (x) => `${v.fix(x, 2)} MPa` });
        const sG = v.slider('reflection coefficient $\\Gamma$', 0, 1, 0.6, { step: 0.05 });
        const sL = v.slider('distance to reflector $\\ell$', 0.2, 0.9, 0.6, { step: 0.02, fmt: (x) => `${v.fix(x, 2)} m` });
        const sp = v.stage({ x: [0, 0.9], y: [-0.4, 2.2], height: 230, axes: 'box', gutter: true, xlabel: 'distance along the artery (m)', ylabel: 'pressure (relative)', weight: 1, full: true });
        const st = v.stage({ x: [0, 0.8], y: [-0.1, 2.2], height: 230, axes: 'box', gutter: true, xlabel: 'time (s)', ylabel: 'pressure at site (relative)', weight: 1, full: true });
        const site = sp.handle(0.05, 1.12, { color: 'gold', label: 'site', constrain: (x) => [clamp(x, 0, sL.value - .01), 1.12] });
        const TP = 0.3;
        const pf = (tau) => (tau > 0 && tau < TP ? Math.sin((Math.PI * tau) / TP) ** 2 : 0);
        let o = null;
        v.animate((t) => {
          const c = pulseSpeed(sE.value * 1e6), G = sG.value, l = sL.value;
          if (site.x > l - .01) site.set(l - .01, 1.12);
          const xs = site.x;
          const tt = (t % 1.2) * 0.8 / 0.8; // 0..1.2 s clock, the snapshot time
          const fwd = (x) => pf(tt - x / c), bwd = (x) => G * pf(tt - (2 * l - x) / c);
          sp.fn((x) => (x <= l ? fwd(x) : NaN), { color: 'accent', width: 2.2, domain: [0, l] });
          sp.fn((x) => (x <= l ? bwd(x) : NaN), { color: 'orange', width: 2.2, domain: [0, l] });
          sp.fn((x) => (x <= l ? fwd(x) + bwd(x) : NaN), { color: 'ink', width: 2.8, domain: [0, l] });
          sp.vline(l, { color: 'red', width: 3 }); sp.text('reflector', l - 0.01, 1.1, { size: 11, color: 'red', align: 'right' });
          sp.vline(xs, { color: 'gold', dash: [4, 4] });
          const F = (tau) => pf(tau - xs / c), Bk = (tau) => G * pf(tau - (2 * l - xs) / c);
          st.fn(F, { color: 'accent', width: 2, domain: [0, 0.8] }); st.fn(Bk, { color: 'orange', width: 2, domain: [0, 0.8] });
          st.fn((tau) => F(tau) + Bk(tau), { color: 'ink', width: 2.8, domain: [0, 0.8] });
          st.vline(Math.min(tt, 0.8), { color: 'gold', dash: [3, 4] });
          st.vband(xs / c, xs / c + 0.3, { color: 'red', alpha: 0.05 });
          let pk = 0, tpk = 0; for (let tau = 0; tau < 0.8; tau += 0.002) { const y = F(tau) + Bk(tau); if (y > pk) { pk = y; tpk = tau; } }
          o = { c, delay: reflectedDelay(l, xs, c), pk, aug: pk - 1, tpk: tpk - xs / c };
        }, { period: 1.2, still: 0.3 });
        v.legend([['accent', 'forward wave'], ['orange', 'reflected wave'], ['ink', 'sum (what is measured)']]);
        v.readout(() => `$c=\\sqrt{Eh/(\\rho d)}=${v.fix(o.c, 1)}$ m/s;  reflected wave arrives ${v.fix(o.delay * 1000, 0)} ms after the forward component starts (systole ≈ 300 ms)\nmeasured peak ${v.fix(o.pk, 2)} × forward peak: augmentation ${v.fix(100 * Math.max(0, o.aug), 0)}% of the pulse amplitude`);
      },
    },
    // ------------------------------------------------------------------ 4.10
    {
      num: '4.10',
      kind: 'Concept',
      name: 'Continuity: blood slows in the capillaries',
      statement: String.raw`In steady flow the same volume per second $Q$ (the cardiac output) passes every cross-section of the circulation in series, so the mean velocity in a class of vessels is $\bar u = Q/A_\text{tot}$, where $A_\text{tot}$ is the **total** cross-sectional area of all the parallel vessels of that class. Because the capillaries together have a cross-section hundreds to a thousand times that of the aorta, blood in them moves at a fraction of a millimetre per second, which gives the red cells about a second to exchange gases and solutes with the tissue before they leave.`,
      idea: String.raw`It is the continuity equation (fluid-1.5) for an incompressible fluid in a tube network whose cross-section changes: the flux $A\bar u$ is the same through each generation. The velocity is therefore *inverse* to the summed area, not to any single vessel's area: each capillary is only 5–10 µm wide, but there are billions of them, so the total area is large. The total area peaks in the capillaries and then falls again through the venules, veins and venae cavae, giving the characteristic dip of the velocity curve. Murray-type branching (physio-4.5) is one reason the total area grows.`,
      caption: String.raw`Seven vessel classes from aorta to vena cava, with approximate textbook total cross-sectional areas (**left**, log scale) and the resulting mean velocity $\bar u=Q/A$ (**right**, log scale). Raise the **cardiac output** (exercise) and all velocities scale up with it; **recruit** extra capillaries (open more parallel beds) and the capillary velocity falls. The readout checks that $A\bar u$ is the same everywhere and gives the fluid transit time at that mean speed along the chosen capillary length. Red-cell speed can differ from cross-sectional mean blood speed.`,
      scope: String.raw`Areas are the rounded, widely reproduced textbook values (order-of-magnitude, they vary with the source and with the vessel definitions) and are used as a model, not as a measured data set; velocities are mean velocities, whereas the aortic flow is pulsatile with peak velocity several times higher.`,
      deps: ['fluid-1.5'],
      see: ['physio-4.5', 'physio-4.18'],
      refs: ['Guyton–Hall'],
      tags: ['continuity', 'capillaries'],
      verify: true,
      viz(v) {
        const CL = [
          { n: 'aorta', A: 2.5 }, { n: 'small arteries', A: 20 }, { n: 'arterioles', A: 40 }, { n: 'capillaries', A: 2500 },
          { n: 'venules', A: 250 }, { n: 'small veins', A: 80 }, { n: 'venae cavae', A: 8 },
        ];
        const sQ = v.slider('cardiac output', 2, 25, 5, { step: 0.5, fmt: (x) => `${x} L/min` });
        const sRec = v.slider('capillary recruitment', 0.3, 3, 1, { step: 0.1, fmt: (x) => `×${v.fix(x, 1)}` });
        const sLc = v.slider('capillary length', 0.03, 0.15, 0.07, { step: 0.01, fmt: (x) => `${v.fix(x * 10, 1)} mm` });
        const xt = CL.map((c, i) => [i + 1, ['aorta', 'arteries', 'arterioles', 'capill.', 'venules', 'veins', 'v. cavae'][i]]);
        const a = v.stage({ x: [0.4, 7.6], y: [1, 1e4], ylog: true, height: 300, axes: 'box', gutter: true, ylabel: 'total area (cm²)', xticks: xt, weight: 1 });
        const b = v.stage({ x: [0.4, 7.6], y: [1e-3, 1e2], ylog: true, height: 300, axes: 'box', gutter: true, ylabel: 'mean velocity (cm/s)', xticks: xt, weight: 1 });
        let o = null;
        v.render(() => {
          const Q = (sQ.value * 1000) / 60;
          const area = CL.map((c, i) => (i === 3 ? c.A * sRec.value : c.A)), vel = area.map((A) => Q / A);
          a.setView([.4, 7.6], [1, Math.max(1e4, 2 * Math.max(...area))]);
          b.setView([.4, 7.6], [1e-3, Math.max(1e2, 2.1 * Math.max(...vel))]);
          a.path(area.map((A, i) => [i + 1, A]), { color: 'orange', width: 2, alpha: 0.6 }); b.path(vel.map((u, i) => [i + 1, u]), { color: 'accent', width: 2, alpha: 0.6 });
          area.forEach((A, i) => {
            const cap = i === 3;
            a.line(i + 1, 1, i + 1, A, { color: cap ? 'red' : 'orange', width: 10, alpha: 0.35 }); a.dot(i + 1, A, { r: 5, color: cap ? 'red' : 'orange' });
            b.line(i + 1, 1e-3, i + 1, vel[i], { color: cap ? 'red' : 'accent', width: 10, alpha: 0.35 }); b.dot(i + 1, vel[i], { r: 5, color: cap ? 'red' : 'accent' });
            a.text(v.fmt(A, 2), i + 1, A * 1.5, { size: 11, color: 'ink', align: 'center' });
            b.text(v.fmt(vel[i], 2), i + 1, vel[i] * 1.8, { size: 11, color: 'ink', align: 'center' });
          });
          o = { Q, flux: area.map((A, i) => A * vel[i]), vc: vel[3], va: vel[0], t: sLc.value / vel[3], ratio: area[3] / area[0] };
        });
        v.readout(() => `$Q=${v.fix(o.Q, 1)}$ cm³/s; $A\\bar u$ is ${v.fix(Math.min(...o.flux), 1)}–${v.fix(Math.max(...o.flux), 1)} cm³/s in every class\naorta ${v.fix(o.va, 0)} cm/s → capillaries ${v.fix(o.vc * 10, 2)} mm/s (area ratio ${v.fix(o.ratio, 0)}:1);  mean-flow transit through a ${v.fix(sLc.value * 10, 1)} mm capillary in ${v.fix(o.t, 1)} s`);
      },
    },
  ],
};
