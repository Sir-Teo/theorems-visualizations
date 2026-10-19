// Human Physiology — Chapter 4: Circulation: pressure, flow and resistance (part b: 4.6–4.10)
import { clamp, RHO_BLOOD } from './ch04.shared.js';
import { periodicWindkessel, pulseShape, pulsePeak, waveSpeed } from './physio-source-audit-dynamics.js';
import { COMPLIANCE_MODELS, vesselVolume, vesselCompliance, addedVolumePressure, classFlow } from './physio-source-audit-geometry.js';

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
      statement: String.raw`The **compliance** of a vascular segment is the volume it gains per unit rise in its transmural pressure, $C=dV/dP$ (mL/mmHg); its **distensibility** is the same quantity as a fraction of the starting volume, $C/V$. In their usual low-pressure range veins accommodate substantial volume with a small pressure rise, forming a reservoir. A comparison must specify the operating pressure: compliance is a local slope and need not stay large when a vessel is stretched far beyond that range.`,
      idea: String.raw`Compliance is the slope of the pressure–volume curve. A larger slope on a plot of volume against pressure means greater compliance. The local approximation is $\Delta V\approx C\Delta P$; a large volume change requires the full constitutive curve. The stiffening is also the origin of the pulse pressure (physio-4.7): the arterial compliance is what the Windkessel stores each stroke in. Keener and Sneyd use the simple linear law $V=V_0+CP$ in §11.2. Here a deliberately nonlinear illustrative law is $V=V_u+C_0 p_\infty(1-e^{-P/p_\infty})$: an unstressed part plus a stressed part that saturates as the wall stiffens.`,
      caption: String.raw`The **left** panel shows two illustrative pressure–volume curves. Choose a **common operating pressure** to compare their local slopes (gold tangents). The **right** panel adds the same volume separately to each model compartment. The ordering can reverse at high pressures. If the added volume reaches a curve’s finite asymptotic capacity, no finite pressure solves the model; the panel says so rather than truncating the pressure.`,
      scope: String.raw`Static toy constitutive curves, not fitted measurements or an estimate of the body’s blood-volume partition. The two compartments have deliberately different low-pressure slopes and stiffening scales. The common pressure permits a mathematical comparison; it is not a claim that systemic arteries and veins operate at equal pressure. Negative-pressure collapse, active tone and time-dependent wall mechanics are omitted.`,
      deps: [],
      see: ['physio-4.7', 'physio-4.17'],
      refs: ['Keener–Sneyd, author manuscript §11.2, pp. 485–487, equation (11.13)'],
      links: { source: 'https://www.math.utah.edu/~keener/books/control.pdf#page=485' },
      tags: ['compliance', 'veins'],
      verify: false,
      viz(v) {
        const [A, B] = COMPLIANCE_MODELS, V = vesselVolume, slope = vesselCompliance;
        const sP = v.slider('common operating pressure', 2, 120, 10, { step: 1, fmt: (x) => `${x} mmHg` });
        const sdV = v.slider('volume added to each', 10, 500, 100, { step: 10, fmt: (x) => `${x} mL` });
        const a = v.stage({ x: [-4, 134], y: [0, 6000], height: 320, axes: 'box', gutter: true, xlabel: 'transmural pressure (mmHg)', ylabel: 'volume (mL)', weight: 1.2 });
        const b = v.stage({ x: [0, 3], y: [0, 400], height: 320, axes: 'box', gutter: true, ylabel: 'pressure rise (mmHg)', xticks: [[1, 'artery'], [2, 'vein']], weight: 0.8, minWidth: 220 });
        let o = null;
        v.render(() => {
          const P = sP.value, dV = sdV.value;
          a.fn((p) => V(A, p), { domain: [0, 130], color: 'red', width: 2.6 }); a.fn((p) => V(B, p), { domain: [0, 130], color: 'accent', width: 2.6 });
          a.text('arteries', 118, V(A, 118) + 260, { size: 12, color: 'red', align: 'right', weight: 700 }); a.text('veins', 118, V(B, 118) - 300, { size: 12, color: 'accent', align: 'right', weight: 700 });
          for (const [m, col] of [[A, 'red'], [B, 'accent']]) {
            const y = V(m, P), s0 = slope(m, P);
            a.dot(P, y, { r: 6, color: col });
            const lo = Math.max(0, P - 12), hi = Math.min(130, P + 12);
            a.path([[lo, y + (lo - P) * s0], [hi, y + (hi - P) * s0]], { color: 'gold', width: 3 });
          }
          a.vline(P, { color: 'faint', dash: [4, 4] });
          const pa = addedVolumePressure(A, P, dV), pv = addedVolumePressure(B, P, dV);
          const top = Math.max(10, ...[pa, pv].filter(Number.isFinite)) * 1.25;
          b.setView([0, 3], [0, top]);
          for (const [i, jump, col] of [[1, pa, 'red'], [2, pv, 'accent']]) {
            if (jump !== null) b.rect(i - .4, 0, i + .4, jump, { fill: col, fillAlpha: .35, color: col });
            b.text(jump === null ? 'no finite solution' : `+${v.fix(jump, 1)}`, i, jump === null ? top * .55 : jump + top * .06, { size: 11, color: col, align: 'center', weight: 700 });
          }
          o = { Ca: slope(A, P), Cv: slope(B, P), pa, pv };

        });
        const jumpLabel = x => x === null ? 'no finite solution (capacity reached)' : `${v.fix(x, 1)} mmHg`;
        v.readout(() => `at common pressure ${sP.value} mmHg: $C_\\text{artery}=dV/dP=${v.fix(o.Ca, 2)}$ mL/mmHg, $C_\\text{vein}=${v.fix(o.Cv, 2)}$ mL/mmHg (vein/artery ratio ${v.fix(o.Cv / o.Ca, 2)})\nadding ${sdV.value} mL: arterial pressure rise ${jumpLabel(o.pa)}; venous rise ${jumpLabel(o.pv)}. These are illustrative equilibrium curves, not a whole-body blood-volume estimate.`);
      },
    },
    // ------------------------------------------------------------------ 4.7
    {
      num: '4.7',
      kind: 'Model',
      name: 'Two-element Windkessel model',
      statement: String.raw`Model the arterial tree as one elastic chamber of compliance $C$ draining through one peripheral resistance $R$. With inflow $Q(t)$ from the heart and venous pressure taken as zero,
$$C\,\frac{dP}{dt}=Q(t)-\frac{P}{R}.$$
During diastole $Q=0$ and the pressure decays exponentially, $P(t)=P_{es}\,e^{-(t-t_{es})/RC}$, with time constant $\tau=RC$; in a periodic steady state, averaged over a beat, $\bar P=\bar Q R$ regardless of $C$. The outflow is smoother than the inflow; how nearly steady it becomes depends on $RC$ relative to the beat period.`,
      idea: String.raw`It is an RC circuit (em-6.12) with flow as current and pressure as voltage: the chamber stores the part of each stroke that does not leave through $R$ during ejection, and returns it during diastole, so the peripheral flow is smoother than the cardiac flow. Integrating the equation over a whole beat kills the storage term (the chamber ends where it started) and leaves $\bar Q=\bar P/R$, which is Ohm's law (physio-4.1) for the mean. The term *Windkessel* refers to an air-chamber analogy. No propagation delay appears because this is a lumped storage model.`,
      caption: String.raw`The periodic solution is evaluated analytically, without a finite warm-up. The model heart ejects a fixed 70 mL as a half-sine of flow during the first 35% of each beat. **Top:** aortic pressure (blue) and the exponential $P_{es}e^{-t/RC}$ continuing from end-systole (dashed green), which it follows exactly in diastole. **Bottom:** inflow (gold) and outflow through the peripheral resistance (green), whose areas are equal over a beat. Lower the **compliance** to a stiff vessel and the pressure swings wide; make it large and the pressure and outflow flatten to a constant. Raise the **resistance** and the mean pressure and the decay time both rise.`,
      scope: String.raw`Constant-compliance lumped model, with venous pressure set to zero. Pressure is continuous for bounded inflow, even if the flow has a finite step; its derivative can jump. It has no wave propagation, spatial reflections or valve-closure notch. The half-sine input and parameters are illustrative, not a fit to a patient's waveform. End-of-cycle pressure and the cycle's absolute minimum are reported separately: the latter can occur shortly after flow starts.`,
      deps: ['physio-4.1', 'physio-4.6', 'em-6.12'],
      see: ['physio-4.8'],
      refs: ['Keener–Sneyd, author manuscript §11.8.2, pp. 522–523, equation (11.161)', 'Westerhof, Lankhaar & Westerhof (2009), §§1–2, pp. 131–134'],
      tags: ['Windkessel', 'RC circuit'],
      links: { doi: 'https://doi.org/10.1007/s11517-008-0359-2' },
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
          const W = periodicWindkessel({ R, C, HR }), T = W.T;
          a.setView([0, 2], [0, W.Ps * 1.2]); b.setView([0, 2], [0, Math.max(...W.Q, W.Ps / R) * 1.15]);
          const two = (arr, f) => { const pts = []; for (let b2 = 0; b2 < 2; b2++) for (let i = 0; i < W.t.length; i++) pts.push([(W.t[i] + b2 * T) / T, f(i)]); return pts; };
          a.vband(0, W.Ts / T, { color: 'red', alpha: 0.06 }); a.vband(1, 1 + W.Ts / T, { color: 'red', alpha: 0.06 });
          a.path(two(W.P, (i) => W.P[i]), { color: 'accent', width: 2.8 });
          // diastolic exponential from end-systole
          const Pes = W.Pes;
          for (let b2 = 0; b2 < 2; b2++) { const pts = []; for (let t = W.Ts; t <= T; t += T / 80) pts.push([(t + b2 * T) / T, Pes * Math.exp(-(t - W.Ts) / (R * C))]); a.path(pts, { color: 'green', width: 2, dash: [6, 4] }); }
          a.hline(W.Pm, { color: 'orange', dash: [3, 4] }); a.text('mean', 1.98, W.Pm, { size: 11, color: 'orange', align: 'right', baseline: 'bottom', dy: -2 });
          b.path(two(W.Q, (i) => W.Q[i]), { color: 'gold', width: 2.4 });
          b.path(two(W.Q, (i) => W.P[i] / R), { color: 'green', width: 2.4 });
          b.hline(W.Qmean, { color: 'orange', dash: [3, 4] });
          o = { W, R, C, Pes, tau: R * C, fall: Pes * Math.exp(-(T - W.Ts) / (R * C)) };
        });
        v.legend([['accent', 'aortic pressure'], ['green', 'diastolic decay $P_{es}e^{-t/RC}$', { dash: true }], ['gold', 'flow in (heart)'], ['green', 'flow out (periphery)']]);
        v.readout(() => `$\\tau=RC=${v.fix(o.tau, 2)}$ s;  mean pressure ${v.fix(o.W.Pm, 1)} mmHg vs $\\bar Q R=${v.fix(o.W.Qmean * o.R, 1)}$ mmHg;  cycle maximum/minimum ${v.fix(o.W.Ps, 0)}/${v.fix(o.W.Pd, 0)} (pulse pressure ${v.fix(o.W.PP, 0)})\nend-of-cycle pressure from the exponential: ${v.fix(o.fall, 1)} mmHg vs periodic endpoint ${v.fix(o.W.P0, 1)} mmHg`);
      },
    },
    // ------------------------------------------------------------------ 4.8
    {
      num: '4.8',
      kind: 'Model',
      name: 'Three-element Windkessel and pulse pressure',
      statement: String.raw`Adding a **characteristic impedance** $Z_c$ in series between the heart and the two-element chamber gives the three-element Windkessel: the pressure at the aortic root is
$$P(t)=P_w(t)+Z_c\,Q(t),\qquad C\,\dot P_w=Q-\frac{P_w-P_v}{R}.$$
The direct term $Z_cQ$ gives a finite high-frequency pressure–flow response, unlike a pure storage chamber. For periodic flow in this displayed circuit, $\bar P=P_v+(R+Z_c)\bar Q$: $R$ is the **distal** resistor, so the total zero-frequency resistance is $R+Z_c$. Varying $C$ alone leaves this mean unchanged while changing pulse pressure. Bounded steps in flow leave the two-element chamber pressure continuous; the series term can introduce a pressure step.`,
      idea: String.raw`The chamber's compliance sets how much of each stroke it can absorb: with a stroke volume $SV$, a storage-only increment is $\Delta P=\Delta V/C$, although continuous outflow and the direct series term also affect the full cycle’s pulse pressure (physio-4.7). The element $Z_c$ is the high-frequency impedance of the aorta (the pressure–flow ratio when reflections are absent), and a stiffer aorta, which has a larger $Z_c$ as well as a smaller $C$, has a larger early-systolic pressure. The resistor representation of $Z_c$ is a lumped approximation to characteristic impedance; it does not resolve wave travel or a reflected-wave hump.`,
      caption: String.raw`Choose a stage of life or drag the elements yourself. The **top** panel draws the aortic pressure of the three-element model (blue) against the two-element model with the same $R$ and $C$ (dashed grey); the **bottom** panel plots pulse pressure against compliance with your setting marked. Lower $C$: systolic pressure rises, diastolic pressure falls, the mean stays fixed when only $C$ changes. Increasing $Z_c$ at fixed distal $R$ also increases the mean. Set $Z_c=0$ and the two models coincide. Both are analytical periodic solutions with the same 70 mL half-sine input.`,
      scope: String.raw`Parameter sets for "young, middle-aged, old" are illustrative round numbers chosen to give familiar pressures, not patient data. The model has the same stroke volume and rate in all cases, whereas an older heart usually adapts; real pulse pressure also depends on wave reflection (physio-4.9).`,
      deps: ['physio-4.7'],
      see: ['physio-4.9'],
      refs: ['Westerhof, Lankhaar & Westerhof (2009), §2, pp. 132–134 and Fig. 5'],
      tags: ['Windkessel', 'pulse pressure', 'ageing'],
      links: { doi: 'https://doi.org/10.1007/s11517-008-0359-2' },
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
          const W3 = periodicWindkessel({ R, C, Zc }), W2 = periodicWindkessel({ R, C, Zc: 0 }), T = W3.T;
          a.setView([0, 1], [0, Math.max(W3.Ps, W2.Ps) * 1.15]);
          a.path(W2.t.map((t, i) => [t / T, W2.P[i]]), { color: 'muted', width: 1.8, dash: [6, 4] });
          a.path(W3.t.map((t, i) => [t / T, W3.P[i]]), { color: 'accent', width: 2.8 });
          a.hline(W3.Pm, { color: 'orange', dash: [3, 4] }); a.text('mean', 0.99, W3.Pm, { size: 11, color: 'orange', align: 'right', baseline: 'bottom', dy: -2 });
          a.hline(W3.Ps, { color: 'red', dash: [2, 4], alpha: 0.7 }); a.hline(W3.Pd, { color: 'green', dash: [2, 4], alpha: 0.7 });
          const key = `${R}|${Zc}`; cache[key] ??= Array.from({ length: 22 }, (_, k) => { const c = 0.3 * Math.pow(10, (k / 21)); return [c, periodicWindkessel({ R, C: c, Zc }).PP]; });
          b.setView([0.1, 3.35], [0, Math.max(...cache[key].map(p => p[1]), W3.PP) * 1.18]);
          b.path(cache[key], { color: 'purple', width: 2.6 }); b.dot(C, W3.PP, { r: 8, color: 'gold' });
          o = { W3, W2 };
        });
        v.legend([['accent', 'three-element'], ['muted', 'two-element, same R, C', { dash: true }]]);
        v.readout(() => `systolic / diastolic = ${v.fix(o.W3.Ps, 0)} / ${v.fix(o.W3.Pd, 0)} mmHg → pulse pressure ${v.fix(o.W3.PP, 0)} mmHg;  mean ${v.fix(o.W3.Pm, 1)} mmHg ($\\bar Q(R+Z_c)=${v.fix(o.W3.Qmean * (sR.value + sZ.value), 1)}$)\ntwo-element model with the same $R,C$: ${v.fix(o.W2.Ps, 0)} / ${v.fix(o.W2.Pd, 0)} mmHg`);
      },
    },
    // ------------------------------------------------------------------ 4.9
    {
      num: '4.9',
      kind: 'Phenomenon',
      name: 'Pulse-wave velocity and wave reflection',
      statement: String.raw`A pressure pulse in an elastic artery travels as a wave at the **Moens–Korteweg speed** $c=\sqrt{Eh/(\rho d)}$, where $E$ is the wall's elastic modulus, $h$ its thickness, $d$ the lumen diameter and $\rho$ the blood density; this thin-wall approximation neglects axial constraints and assumes small changes about a uniform vessel. Where the arterial tree changes (branches, a smaller-calibre bed, the resistance vessels) part of the wave is reflected with coefficient $\Gamma$ and travels back; the pressure measured at a site is the sum of the forward and the reflected waves, $p(t)=p_f(t)+\Gamma\,p_f(t-2\ell/c)$ for a reflector at distance $\ell$. The faster the wave, the sooner the reflection returns, a positive reflected pulse can increase the peak if it overlaps the forward pulse. Timing alone does not guarantee overlap or a larger peak.`,
      idea: String.raw`The wall stiffness enters because a pressure rise distends the wall and the inertia of the fluid has to drag that distension along; in the linear, long-wavelength limit the equations of mass and momentum conservation in an elastic tube give a wave equation with speed $\sqrt{A/(\rho\,dA/dP)}$, which for a thin wall is the Moens–Korteweg formula. A reflection arises wherever the impedance changes; the returning wave is a delayed copy of the forward one, so its effect depends only on the round-trip time $2\ell/c$ relative to the length of systole. For this positive pulse model, sufficiently separated forward and reflected pulses have no peak augmentation. A faster wave can increase their overlap at a fixed observation site.`,
      caption: String.raw`**Top:** a snapshot of the pulse running down the artery (forward wave blue, reflected wave orange, sum black) towards a reflecting site at distance $\ell$; it animates, and you can pause it. **Bottom:** the pressure waveform at the measuring site (drag it along the artery) as a function of time. Raise the **wall stiffness** $E$: the speed $c$ rises, the round-trip delay shrinks, and the reflected hump moves earlier and its overlap with the forward hump changes. The observation handle stays upstream of the reflector. The **reflection coefficient** scales it.`,
      scope: String.raw`Linear, lossless, non-dispersive waves in a uniform tube with a single point reflector; real arteries have damping, taper, many reflection sites and frequency-dependent wave speed. $h/r$ is fixed at 0.1 and the "elastic modulus" is an effective value; the slider gives a model speed of about 3.1–10.9 m/s, not an age-specific measurement. The waveform is one isolated sinusoidal-squared pulse, and the coefficient is a prescribed nonnegative pressure-amplitude ratio. There is no full cardiac cycle, coronary model or measurement of an individual patient.`,
      deps: ['physio-4.6'],
      see: ['physio-4.8'],
      refs: ['Keener–Sneyd, author manuscript §11.8.3, p. 523, equations (11.162)–(11.166); thin-wall compliance derived here'],
      tags: ['waves', 'stiffness', 'reflection'],
      links: { source: 'https://www.math.utah.edu/~keener/books/control.pdf#page=523' },
      verify: true,
      viz(v) {
        const sE = v.slider('wall stiffness $E$', 0.2, 2.5, 1.8, { step: 0.05, fmt: (x) => `${v.fix(x, 2)} MPa` });
        const sG = v.slider('reflection coefficient $\\Gamma$', 0, 1, 0.6, { step: 0.05 });
        const sL = v.slider('distance to reflector $\\ell$', 0.2, 0.9, 0.6, { step: 0.02, fmt: (x) => `${v.fix(x, 2)} m` });
        const sp = v.stage({ x: [-0.03, 0.94], y: [-0.1, 2.3], height: 230, axes: 'box', gutter: true, xlabel: 'distance along the artery (m)', ylabel: 'pressure (relative)', weight: 1, full: true });
        const st = v.stage({ x: [-0.03, 1], y: [-0.1, 2.3], height: 230, axes: 'box', gutter: true, xlabel: 'time (s)', ylabel: 'pressure at site (relative)', weight: 1, full: true });
        const site = sp.handle(0.05, 2.15, { color: 'gold', label: 'site', constrain: (x) => [clamp(x, 0, sL.value - 0.01), 2.15] });
        const TP = 0.3;
        const pf = pulseShape;
        let o = null;
        v.animate((t) => {
          const c = waveSpeed(sE.value, RHO_BLOOD), G = sG.value, l = sL.value, xs = clamp(site.x, 0, l - 0.01);
          site.set(xs, 2.15);
          const last = Math.max(.8, (2 * l - xs) / c + TP + .04); st.setView([-.03, last], [-.1, 2.3]);
          const tt = t % 1.2; // 0..1.2 s clock, the snapshot time
          const fwd = (x) => pf(tt - x / c), bwd = (x) => G * pf(tt - (2 * l - x) / c);
          sp.fn((x) => fwd(x), { color: 'accent', width: 2.2, domain: [0, l] });
          sp.fn((x) => bwd(x), { color: 'orange', width: 2.2, domain: [0, l] });
          sp.fn((x) => fwd(x) + bwd(x), { color: 'ink', width: 2.8, domain: [0, l] });
          sp.vline(l, { color: 'red', width: 3 }); sp.text('reflector', l - 0.01, 2.02, { size: 11, color: 'red', align: 'right' });
          sp.vline(xs, { color: 'gold', dash: [4, 4] });
          const F = (tau) => pf(tau - xs / c), Bk = (tau) => G * pf(tau - (2 * l - xs) / c);
          st.fn(F, { color: 'accent', width: 2, domain: [0, last] }); st.fn(Bk, { color: 'orange', width: 2, domain: [0, last] });
          st.fn((tau) => F(tau) + Bk(tau), { color: 'ink', width: 2.8, domain: [0, last] });
          st.vline(Math.min(tt, last), { color: 'gold', dash: [3, 4] });
          st.vband(xs / c, xs / c + 0.3, { color: 'red', alpha: 0.05 });
          const delay = 2 * (l - xs) / c, peak = pulsePeak(delay, G, TP);
          o = { c, delay, pk: peak.value, aug: peak.value - 1, tpk: peak.time, xs, l };

        }, { period: 1.2, still: 0.3 });
        v.legend([['accent', 'forward wave'], ['orange', 'reflected wave'], ['ink', 'model pressure sum']]);
        v.readout(() => `$c=\\sqrt{Eh/(\\rho d)}=${v.fix(o.c, 1)}$ m/s;  reflected wave arrives ${v.fix(o.delay * 1000, 0)} ms after forward-pulse onset at this site (pulse duration 300 ms)\nmodel peak ${v.fix(o.pk, 2)} × forward peak: augmentation ${v.fix(100 * Math.max(0, o.aug), 0)}% of the pulse amplitude`);
      },
    },
    // ------------------------------------------------------------------ 4.10
    {
      num: '4.10',
      kind: 'Concept',
      name: 'Continuity: blood slows in the capillaries',
      statement: String.raw`In steady flow the same volume per second $Q$ (the cardiac output) passes every cross-section of the circulation in series, so the mean velocity in a class of vessels is $\bar u = Q/A_\text{tot}$, where $A_\text{tot}$ is the **total** cross-sectional area of all the parallel vessels of that class. The summed capillary area can greatly exceed aortic area, giving a much smaller mean velocity at the same flow. A uniform-path estimate of transit time is $t=L/\bar u$; it is not an individual red-cell transit measurement.`,
      idea: String.raw`It is the continuity equation (fluid-1.5) for an incompressible fluid in a tube network whose cross-section changes: the flux $A\bar u$ is the same through each generation. The velocity is therefore *inverse* to the summed area, not to any single vessel's area: many narrow capillaries in parallel can have a large summed area. The total area peaks in the capillaries and then falls again through the venules, veins and venae cavae, giving the characteristic dip of the velocity curve. Murray-type branching (physio-4.5) is one reason the total area grows.`,
      caption: String.raw`Seven vessel classes from aorta to vena cava, using the area column of Keener and Sneyd’s Table 11.1 (p. 484) (**left**, log scale) and the resulting mean velocity $\bar u=Q/A$ (**right**, log scale). Raise the **cardiac output** (exercise) and all velocities scale up with it; **recruit** extra capillaries (open more parallel beds) and the capillary velocity falls. The readout checks that $A\bar u$ is the same everywhere and gives the bulk-fluid transit estimate for a uniform capillary of the chosen length.`,
      scope: String.raw`The areas are rounded textbook model values from the cited table, not a measured participant dataset. Its separate velocity column is not copied: all displayed velocities are computed at the single selected flow, preserving continuity exactly. Recruitment changes only total capillary area at fixed output; this is a controlled model comparison, not a complete exercise response. Pulsatility, unequal parallel flows, shunts and differences between red-cell and bulk-blood velocities are omitted.`,
      deps: ['fluid-1.5'],
      see: ['physio-4.5', 'physio-4.18'],
      refs: ['Keener–Sneyd, author manuscript §11.1, p. 484, Table 11.1 and equations (11.10)–(11.11)'],
      links: { source: 'https://www.math.utah.edu/~keener/books/control.pdf#page=484' },
      tags: ['continuity', 'capillaries'],
      verify: false,
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
          const model = classFlow(sQ.value, sRec.value, sLc.value), { Q, area, velocity: vel } = model;
          a.setView([0.4, 7.6], [1, Math.max(...area) * 2.2]);
          b.setView([0.4, 7.6], [1e-3, Math.max(...vel) * 2.4]);
          a.path(area.map((A, i) => [i + 1, A]), { color: 'orange', width: 2, alpha: 0.6 }); b.path(vel.map((u, i) => [i + 1, u]), { color: 'accent', width: 2, alpha: 0.6 });
          area.forEach((A, i) => {
            const cap = i === 3;
            a.line(i + 1, 1, i + 1, A, { color: cap ? 'red' : 'orange', width: 10, alpha: 0.35 }); a.dot(i + 1, A, { r: 5, color: cap ? 'red' : 'orange' });
            b.line(i + 1, 1e-3, i + 1, vel[i], { color: cap ? 'red' : 'accent', width: 10, alpha: 0.35 }); b.dot(i + 1, vel[i], { r: 5, color: cap ? 'red' : 'accent' });
            a.text(v.fmt(A, 2), i + 1, A * 1.5, { size: 11, color: 'ink', align: 'center' });
            b.text(v.fmt(vel[i], 2), i + 1, vel[i] * 1.8, { size: 11, color: 'ink', align: 'center' });
          });
          o = { Q, flux: area.map((A, i) => A * vel[i]), vc: vel[3], va: vel[0], t: model.transit, ratio: area[3] / area[0] };
        });
        v.readout(() => `$Q=${v.fix(o.Q, 1)}$ cm³/s; $A\\bar u$ is ${v.fix(Math.min(...o.flux), 1)}–${v.fix(Math.max(...o.flux), 1)} cm³/s in every class\naorta ${v.fix(o.va, 0)} cm/s → capillaries ${v.fix(o.vc * 10, 2)} mm/s (area ratio ${v.fix(o.ratio, 0)}:1);  uniform bulk-flow transit estimate for a ${v.fix(sLc.value * 10, 1)} mm capillary: ${v.fix(o.t, 1)} s`);
      },
    },
  ],
};
