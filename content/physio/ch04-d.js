// Human Physiology — Chapter 4: Circulation: pressure, flow and resistance (part d: 4.16–4.20)
import { oncoticPressure, frozenFiltration } from './physio-source-audit-starling.js';
import { stenosisFlow, BERNOULLI_MMHG } from './physio-source-audit-flow.js';
import { clamp, RHO_BLOOD, PA_PER_MMHG } from './ch04.shared.js';

const DRAM_ML = 3.7; // an apothecary dram (3.89 g) of blood is about 3.7 mL (density 1.06 g/mL)

export default {
  collection: 'physio',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.16
    {
      num: '4.16',
      kind: 'Phenomenon',
      name: 'Myogenic autoregulation of blood flow',
      statement: String.raw`Over a wide range of perfusion pressure (roughly 60–160 mmHg in the brain, kidney and many other organs) the blood flow through an organ stays nearly constant instead of rising in proportion to pressure as it would through passive tubes. Vascular smooth muscle in the arterioles contracts when it is stretched by a rise in pressure and relaxes when pressure falls, so the resistance changes in step with pressure; the radius adjusts until the flow returns to its set level, and since $Q\propto P\,r^4$ (physio-4.2) a decrease of radius by only $\tfrac14$ of the proportional rise of $P$ is enough. The response takes some seconds, so a pressure step first gives a flow transient that then relaxes. Outside the range, when the muscle is fully contracted or fully relaxed, flow follows pressure again.`,
      idea: String.raw`This is negative feedback (physio-1.2) with the stretch of the wall as the sensed variable: the controller is the vessel's own muscle, the actuator its radius, and the fourth-power law (physio-4.3) makes the gain of the loop large for a modest radius change. The quality of the regulation is expressed by the autoregulatory gain $g=1-\Delta\ln Q_\text{reg}/\Delta\ln Q_\text{pass}$, which is 0 for passive vessels and 1 for perfect regulation. The first observation of a local arterial reaction to the internal pressure is Bayliss's (1902); the flow plateau of whole organs was demonstrated later.`,
      caption: String.raw`**Left:** flow (relative to its set value at 100 mmHg) against perfusion pressure for passive vessels (dashed) and for vessels with myogenic tone (solid); drag the **pressure** handle. The plateau ends where the muscle runs out of range: reduce the **reserve** and the plateau narrows. **Right:** a step of pressure at 5 s: the flow jumps with the passive distension and then relaxes, with the time constant you choose. Set the **myogenic gain** to 0 for a passive bed.`,
      scope: String.raw`A model in which the muscle adjusts the vessel radius toward the value that would hold flow at its set point, with a first-order delay and with limits of constriction and dilation: it reproduces the shape of the phenomenon (plateau, limits, transient), not any organ's data. The passive distensibility, the limits (about −30% and +35% in radius at full reserve) and the time constant are illustrative. Metabolic and flow-dependent controls act in parallel in real tissues.`,
      deps: ['physio-4.2', 'physio-1.2'],
      see: ['physio-4.3', 'physio-7.12'],
      refs: ['Guyton–Hall'],
      tags: ['autoregulation', 'feedback', 'arterioles'],
      credit: 'W. M. Bayliss, 1902',
      links: { doi: 'https://doi.org/10.1113/jphysiol.1902.sp000911' },
      verify: true,
      viz(v) {
        const sG = v.slider('myogenic gain', 0, 1, 0.9, { step: 0.05, fmt: (x) => v.fix(x, 2) });
        const sRes = v.slider('reserve of constriction / dilation', 0.2, 1.4, 1, { step: 0.05, fmt: (x) => `${v.fix(100 * x, 0)}%` });
        const sTau = v.slider('response time $\\tau$', 2, 30, 8, { step: 1, fmt: (x) => `${x} s` });
        const sStep = v.slider('pressure step at 5 s', 40, 200, 160, { step: 5, fmt: (x) => `100 → ${x} mmHg` });
        const a = v.stage({ x: [20, 220], y: [0, 3.2], height: 300, axes: 'box', gutter: true, xlabel: 'perfusion pressure (mmHg)', ylabel: 'flow Q / Q_set', weight: 1.1 });
        const b = v.stage({ x: [0, 60], y: [0, 3.2], height: 300, axes: 'box', gutter: true, xlabel: 'time (s)', ylabel: 'flow, radius (relative)', weight: 1 });
        const h = a.handle(160, 1, { color: 'gold', label: 'P', constrain: (x) => [clamp(x, 20, 220), 1] });
        const rp = (P) => 1 + (0.25 * (P - 100)) / 100, qp = (P) => (P / 100) * rp(P) ** 4;
        let o = null;
        v.render(() => {
          const g = sG.value, res = sRes.value, rmin = 1 - 0.3 * res, rmax = 1 + 0.35 * res;
          const ratio = (P) => clamp(Math.pow(1 / qp(P), g / 4), rmin, rmax), qr = (P) => (P / 100) * (rp(P) * ratio(P)) ** 4;
          a.fn(qp, { color: 'muted', width: 2, dash: [6, 4], domain: [20, 220] });
          a.fn(qr, { color: 'accent', width: 2.8, domain: [20, 220] });
          a.hline(1, { color: 'faint', dash: [3, 4] });
          const P = h.x; h.set(P, qr(P)); a.dot(P, qp(P), { r: 5, hollow: true, color: 'muted' }); a.line(P, qp(P), P, qr(P), { color: 'orange', dash: true });
          // plateau: pressures where flow lies within ±10% of the set value
          let lo = null, hi = null; for (let p = 20; p <= 220; p += 1) if (Math.abs(qr(p) - 1) <= 0.1) { if (lo === null) lo = p; hi = p; }
          if (lo !== null && hi - lo > 5) a.hband(0.9, 1.1, { color: 'green', alpha: 0.08 });
          // gain over the 80–140 mmHg range
          const gm = 1 - (Math.log(qr(140)) - Math.log(qr(80))) / (Math.log(qp(140)) - Math.log(qp(80)));
          // step response
          const P1 = sStep.value, tau = sTau.value, pts = [], rr = [], pp = [];
          let rho = 1; const dt = 0.1;
          for (let k = 0; k <= 600; k++) { const t = k * dt, Pt = t < 5 ? 100 : P1; const tgt = ratio(Pt); rho += ((tgt - rho) * dt) / tau; pts.push([t, (Pt / 100) * (rp(Pt) * rho) ** 4]); rr.push([t, rp(Pt) * rho]); pp.push([t, Pt / 100]); }
          b.path(pp, { color: 'faint', width: 1.6, dash: [4, 4] }); b.path(pts, { color: 'accent', width: 2.8 }); b.path(rr, { color: 'purple', width: 2 });
          b.hline(1, { color: 'faint', dash: [3, 4] });
          o = { P, q: qr(P), qpass: qp(P), lo, hi, gm, peak: Math.max(...pts.map((p) => p[1])), end: pts[pts.length - 1][1] };
        });
        v.legend([['muted', 'passive vessels', { dash: true }], ['accent', 'with myogenic tone / flow'], ['purple', 'radius (right)'], ['faint', 'pressure (right, ÷100)', { dash: true }]]);
        v.readout(() => `at ${v.fix(o.P, 0)} mmHg: flow ${v.fix(o.q, 2)} of set value (passive would be ${v.fix(o.qpass, 2)});  plateau within ±10% from ${o.lo ?? '–'} to ${o.hi ?? '–'} mmHg;  autoregulatory gain over 80–140 mmHg ≈ ${v.fix(o.gm, 2)}\nafter the step the flow jumps to ${v.fix(o.peak, 2)} and relaxes to ${v.fix(o.end, 2)} within 55 s`);
      },
    },
    // ------------------------------------------------------------------ 4.17
    {
      num: '4.17',
      kind: 'Model',
      name: 'Guyton’s venous return and the cardiac-output equilibrium',
      statement: String.raw`Cardiac output is the one flow that the heart and the vessels must agree on, and each side has its own curve against right-atrial pressure $P_{ra}$. The **cardiac function curve** $CO=f(P_{ra})$ (Frank–Starling, physio-3.3) rises with filling and then plateaus; the **venous return curve** is linear, $VR=(P_{msf}-P_{ra})/R_{VR}$, where $P_{msf}$ is the mean systemic filling pressure (the pressure everywhere in the circulation when the heart is stopped) and $R_{VR}$ the resistance to venous return, until it plateaus at negative $P_{ra}$ because the veins collapse as they enter the thorax. In steady state $CO=VR$: the operating point is the **intersection** of the two curves. A transfusion raises $P_{msf}$ and moves the venous curve right, sympathetic stimulation raises $P_{msf}$ and contractility, heart failure lowers the plateau of the cardiac curve.`,
      idea: String.raw`The heart can only pump out what the veins deliver to it, and the veins deliver more when the right atrial pressure is lower (a bigger gradient from the periphery); the heart pumps more when it is filled more. These two monotone relations of opposite slope cross in exactly one point, which is stable (a transient rise of $P_{ra}$ reduces venous return below the output, lowering $P_{ra}$ again). The venous return curve is Ohm's law (physio-4.1) with the "voltage" $P_{msf}-P_{ra}$, and $P_{msf}$ is set by the stressed blood volume divided by the total compliance (physio-4.6). Guyton introduced the graphical solution in 1955.`,
      caption: String.raw`The cardiac function curve (red) and venous return curve (blue) are plotted against right-atrial pressure; the green dot is their intersection, with the baseline equilibrium shown in grey. Drag **blood volume** (transfusion or haemorrhage), **sympathetic tone** or **heart contractility** and watch the intersection move: more volume moves the venous curve to the right and raises output at a higher $P_{ra}$; failure lowers the plateau and pushes the operating point to a high $P_{ra}$ and low output.`,
      scope: String.raw`A reconstruction with round-number textbook-style parameters (normal $P_{msf}$ about 7 mmHg, $R_{VR}$ about 1.4 mmHg·min/L, a plateau of 13 L/min at normal contractility); the dependence of $P_{msf}$ on volume ($\Delta P_{msf}=\Delta V/100\,\text{mL/mmHg}$) and the sympathetic effects are schematic. Real operating points also involve the arterial side (afterload) and the heart rate, which this graphical model holds fixed.`,
      deps: ['physio-3.3', 'physio-4.6'],
      see: ['physio-8.7'],
      refs: ['Guyton–Hall'],
      tags: ['cardiac output', 'venous return', 'Guyton'],
      credit: 'A. C. Guyton, 1955',
      links: { doi: 'https://doi.org/10.1152/physrev.1955.35.1.123' },
      verify: true,
      viz(v) {
        const sV = v.slider('blood volume change', -1500, 1500, 0, { step: 50, fmt: (x) => `${x >= 0 ? '+' : ''}${x} mL` });
        const sS = v.slider('sympathetic tone', 0, 1, 0, { step: 0.05, fmt: (x) => `${v.fix(100 * x, 0)}%` });
        const sC = v.slider('cardiac contractility', 0.2, 1.6, 1, { step: 0.05, fmt: (x) => `${v.fix(100 * x, 0)}%` });
        const sR = v.slider('resistance to venous return', 0.8, 3, 1.4, { step: 0.05, fmt: (x) => `${v.fix(x, 2)} mmHg·min/L` });
        const s = v.stage({ x: [-4, 16], y: [0, 15], height: 330, axes: 'box', gutter: true, xlabel: 'right atrial pressure (mmHg)', ylabel: 'cardiac output = venous return (L/min)', weight: 1 });
        const CO = (P, c) => 13 * c * (1 - Math.exp(-(P + 4) / 8.2));
        const VR = (P, pm, r) => (pm - Math.max(P, -2)) / r;
        const solve = (c, pm, r) => { let lo = -4, hi = 20; for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; if (CO(m, c) > VR(m, pm, r)) hi = m; else lo = m; } const P = (lo + hi) / 2; return { P, Q: VR(P, pm, r) }; };
        let o = null;
        v.render(() => {
          const sym = sS.value, pm = 7 + sV.value / 100 + 4 * sym, c = sC.value * (1 + 0.4 * sym), r = sR.value * (1 - 0.15 * sym);
          s.fn((P) => CO(P, 1), { color: 'faint', width: 1.6, dash: [5, 4], domain: [-4, 16] }); s.fn((P) => VR(P, 7, 1.4), { color: 'faint', width: 1.6, dash: [5, 4], domain: [-4, 16] });
          s.fn((P) => CO(P, c), { color: 'red', width: 2.8, domain: [-4, 16] });
          s.fn((P) => Math.max(VR(P, pm, r), 0), { color: 'accent', width: 2.8, domain: [-4, 16] });
          s.vline(pm, { color: 'accent', alpha: 0.4, dash: [3, 4] }); s.text('P_msf', pm, 0.6, { size: 11, color: 'accent', align: 'center' });
          const e = solve(c, pm, r), e0 = solve(1, 7, 1.4); o = { e, e0, pm, c, r };
          s.dot(e0.P, e0.Q, { r: 5, color: 'muted' }); s.dot(e.P, e.Q, { r: 8, color: 'green' });
          s.text(`${v.fix(e.Q, 1)} L/min`, e.P + 0.4, e.Q + 0.9, { size: 12, color: 'green', align: 'left', weight: 700 });
          s.text('cardiac function', 15.8, CO(15.8, c) + 0.7, { size: 11, color: 'red', align: 'right' }); s.text('venous return', -3.8, VR(-3.8, pm, r) + 0.7, { size: 11, color: 'accent', align: 'left' });
        });
        v.legend([['red', 'cardiac function curve'], ['accent', 'venous return curve'], ['faint', 'normal curves', { dash: true }]]);
        v.readout(() => `equilibrium: CO = ${v.fix(o.e.Q, 1)} L/min at $P_{ra}$ = ${v.fix(o.e.P + 0, 1).replace('−0.0', '0.0')} mmHg (normal: ${v.fix(o.e0.Q, 1)} at 0.0);  $P_{msf}$ = ${v.fix(o.pm, 1)} mmHg, $R_{VR}$ = ${v.fix(o.r, 2)}\ncheck: $(P_{msf}-P_{ra})/R_{VR}$ = ${v.fix((o.pm - o.e.P) / o.r, 2)} L/min`);
      },
    },
    // ------------------------------------------------------------------ 4.18
    {
      num: '4.18',
      kind: 'Phenomenon',
      name: 'Bernoulli and the pressure drop across a stenosis',
      statement: String.raw`When blood flows steadily through a narrowing, continuity (physio-4.10) makes the velocity rise from $v_1=Q/A_1$ in the normal vessel to $v_2=Q/A_2$ in the throat, and Bernoulli's theorem for the streamline gives a fall of pressure $\Delta P=\tfrac12\rho\,(v_2^2-v_1^2)$ at the throat. With $\rho=1060$ kg/m³ and velocities in m/s, $\Delta P\approx 4\,(v_2^2-v_1^2)$ mmHg, and when the upstream velocity is small, the **simplified Bernoulli equation** used with Doppler echocardiography is $\Delta P\approx 4v_2^2$. The pressure falls with the *square* of the velocity, so a tight stenosis (a small throat area) produces a large gradient: halving $A_2$ quadruples the throat kinetic-pressure term at fixed flow; the total drop also subtracts the unchanged upstream term. Part of the pressure is recovered where the vessel widens again, and part is lost to turbulence.`,
      idea: String.raw`Bernoulli's theorem (fluid-2.9) says that along a streamline of a steady, inviscid flow the sum of the pressure and kinetic energy per unit volume, $P+\tfrac12\rho v^2$, is conserved. Where the flow speeds up through a narrowing, the pressure must fall by the increase in kinetic energy density; a pressure of 1 mmHg is 133 Pa, so a throat velocity of 1 m/s costs $\tfrac12\cdot1060\cdot1^2/133\approx4$ mmHg. Neglecting viscous and local-acceleration terms is an assumption, not a guarantee for every stenosis. The chosen downstream recovery fraction illustrates how incomplete recovery leaves a residual loss; it is not calculated from jet turbulence. Hatle and colleagues applied the simplified rule to peak jet velocity and discussed beam-angle and proximal-velocity limitations.`,
      caption: String.raw`The vessel with its narrowing is on the **left** (arrow length scales with velocity up to a display cap); the **right** panel plots pressure along it. Drag the **stenosis** from 0 to 90% of the area, raise the **flow** (exercise), and use the **recovery** slider to say how much of the pressure comes back downstream. The readout compares the exact Bernoulli drop with the clinical rule $4v^2$, separating omission of the upstream term from rounding the coefficient to 4.`,
      scope: String.raw`Steady, inviscid, one-dimensional flow with an assumed pressure recovery; real stenoses are pulsatile, the throat can be longer than the "streamline" idealisation, and eccentric lesions and jets add losses. The simplified rule $4v_2^2$ is for the peak velocity in the jet, neglects the proximal velocity (a reasonable approximation only when $v_1\ll v_2$) and has known limits in the clinic; the picture is not for diagnosis.`,
      deps: ['fluid-2.9', 'physio-4.10'],
      see: ['physio-4.14'],
      refs: ['Hatle, Angelsen & Tromsdal (1980), Br Heart J 43:284–292, pp. 284–285 equation (1), pp. 291–292 discussion; DOI 10.1136/hrt.43.3.284'],
      tags: ['Bernoulli', 'stenosis', 'Doppler'],
      credit: 'L. Hatle, B. A. Angelsen and A. Tromsdal, 1980 (cited Doppler study)',
      links: { doi: 'https://doi.org/10.1136/hrt.43.3.284' },
      verify: false,
      viz(v) {
        const sS = v.slider('stenosis (area reduction)', 0, 90, 75, { step: 1, fmt: (x) => `${x}%` });
        const sQ = v.slider('flow $Q$', 50, 500, 250, { step: 10, fmt: (x) => `${x} mL/s` });
        const sRec = v.slider('pressure recovery downstream', 0, 100, 60, { step: 5, fmt: (x) => `${x}%` });
        const g = v.stage({ x: [0, 10], y: [-1.9, 1.9], height: 290, axes: false, weight: 1 });
        const p = v.stage({ x: [0, 10], y: [-40, 100], height: 290, axes: 'box', gutter: true, xlabel: 'position along the vessel', ylabel: 'pressure change (mmHg)', weight: 1 });
        const R1 = 1.2; // cm
        let o = null;
        v.render(() => {
          const model = stenosisFlow(sS.value, sQ.value, sRec.value, R1);
          const { A1, A2 } = model, Q = sQ.value, rec = sRec.value / 100;
          const shape = (x) => (x > 3.5 && x < 6.5 ? Math.cos(((x - 5) / 1.5) * (Math.PI / 2)) ** 2 : 0);
          const Aof = (x) => A1 - (A1 - A2) * shape(x), rof = (x) => Math.sqrt(Aof(x) / Math.PI);
          const vel = (x) => (Q / Aof(x)); // cm/s
          const Pin = (x) => -0.5 * RHO_BLOOD * ((vel(x) / 100) ** 2 - (vel(0) / 100) ** 2) / PA_PER_MMHG; // inviscid
          const Pthr = Pin(5);
          const Pof = (x) => (x <= 5 ? Pin(x) : Pthr + rec * (Pin(x) - Pthr));
          const sc = 1.5 / R1;
          const top = [], bot = []; for (let k = 0; k <= 120; k++) { const x = (k / 120) * 10; top.push([x, rof(x) * sc]); bot.push([x, -rof(x) * sc]); }
          g.poly([...top, ...bot.slice().reverse()], { fill: 'red', fillAlpha: 0.12, stroke: false });
          g.path(top, { color: 'red', width: 3 }); g.path(bot, { color: 'red', width: 3 });
          const vmax = vel(5) / 100;
          for (const x of [0.8, 2.2, 3.6, 4.4, 5, 5.6, 6.4, 7.8, 9.2]) { const L = Math.min(1.6, 0.6 * (vel(x) / 100)); for (const f of [-0.5, 0, 0.5]) { const yy = f * rof(x) * sc; g.arrow(x - L / 2, yy, x + L / 2, yy, { color: vel(x) / 100 > 2 ? 'orange' : 'accent', width: 2, head: 6 }); } }
          g.text(`v₁ = ${v.fix(vel(0) / 100, 2)} m/s`, 0.2, 1.75, { size: 12, color: 'accent', align: 'left', weight: 700 });
          g.text(`v₂ = ${v.fix(vmax, 2)} m/s`, 5, -1.75, { size: 12, color: vmax > 2 ? 'orange' : 'accent', align: 'center', weight: 700 });
          p.setView([0, 10], [Math.min(-12, Pthr * 1.25 - 4), 12]);
          p.fn(Pof, { color: 'accent', width: 2.8, domain: [0, 10] });
          p.fn(Pin, { color: 'faint', width: 1.4, dash: [4, 4], domain: [0, 10] });
          p.hline(0, { color: 'muted', width: 1 }); p.dot(5, Pthr, { r: 6, color: 'orange' });
          o = { ...model, dPex: -Pthr, d4: model.simplified, dFinal: -Pof(10) };
        });
        v.legend([['accent', 'pressure with recovery'], ['faint', 'inviscid (full recovery)', { dash: true }]]);
        v.readout(() => `throat area ${v.fix(o.A2, 2)} cm²; $v_1=${v.fix(o.v1, 2)}$, $v_2=${v.fix(o.v2, 2)}$ m/s → ideal $\\Delta P=${v.fix(o.dPex, 2)}$ mmHg (coefficient ${v.fix(BERNOULLI_MMHG, 4)})\nsimplified $4v_2^2=${v.fix(o.d4, 2)}$ mmHg = exact drop + omitted proximal term $4v_1^2=${v.fix(o.proximalRounded, 2)}$ + coefficient rounding ${v.fix(o.rounding, 2)} mmHg\nresidual loss for the chosen recovery fraction: ${v.fix(o.dFinal, 2)} mmHg`);
      },
    },
    // ------------------------------------------------------------------ 4.19
    {
      num: '4.19',
      kind: 'Paper',
      name: 'Exercitatio Anatomica de Motu Cordis et Sanguinis',
      paper: { authors: 'William Harvey', year: 1628, title: 'Exercitatio Anatomica de Motu Cordis et Sanguinis in Animalibus', venue: 'Frankfurt: William Fitzer', url: 'https://archive.org/details/exercitatioanat00harv' },
      introduces: ['physio-3.6'],
      statement: String.raw`Harvey argued that the blood **circulates**: it is driven by the heart out through the arteries to the body and returns through the veins to the heart, in a closed circuit, instead of being made in the liver and consumed by the tissues as Galen's doctrine taught. His quantitative argument takes a lower bound for the output of the left ventricle: he reasoned that the ventricle, which in a dead body holds more than two ounces, expels at each beat only a part of its charge, so that at a very low estimate of one drachm per beat and a rate of more than a thousand beats in half an hour more blood passes through the heart than the whole body contains: far more than could be made from food or consumed by the tissues, so the same blood must return again and again. His second argument, from the one-way valves of the veins, shows that in a limb the venous blood can flow only toward the heart.`,
      idea: String.raw`The accepted view had the blood continually generated and used up, which fixes the quantity required at the rate of nutrition. Harvey replaced it with a calculation: stroke volume times rate gives a flow (the cardiac output, physio-3.6) that exceeds any plausible rate of production, and a simple consequence of continuity is that the same blood is pumped repeatedly. The experiments on the valves of the veins (a ligature on the arm, and a vein emptied by pressure with the finger and then watched as it refills) supplied the return path, which he could not see: capillaries were not seen until Malpighi in 1661. The paper marks the start of experimental, quantitative physiology. The quoted numbers are those of the 1628 text (Willis's 19th-century translation was consulted for the passage; the Latin was not checked), and it is flagged for verification.`,
      caption: String.raw`**Top:** Harvey's arithmetic with his own cautious numbers (capacity of the ventricle, the share expelled per beat, beats in half an hour) and the blood of a sheep or dog, about four pounds by his estimate; the line shows the weight of blood pumped through the heart against time and where it passes the whole body's blood. **Middle:** the same quantities in millilitres next to today's measured stroke volume. **Bottom:** the experiment on the valves of the veins, in four steps (pick the step, then move the finger): stripped toward the heart a vein stays empty when stroked the other way, because the valve closes, and refills only from the hand side.`,
      scope: String.raw`The figures are Harvey's own (apothecary weights: 8 drachms to the ounce, 12 ounces to the pound, which is how his "ten pounds five ounces" arises from 1000 drachms) and are conservative; the conversion 1 drachm of blood ≈ 3.7 mL assumes a blood density near 1.06 g/mL and the apothecary drachm of 3.89 g. The modern values (stroke volume about 70 mL, blood volume about 5 L) are standard textbook values (physio-3.6). The vein experiment is drawn schematically, not from Harvey's plates.`,
      deps: [],
      see: ['physio-3.6'],
      refs: [],
      tags: ['Harvey', 'circulation', 'history'],
      credit: 'William Harvey, 1628',
      links: { archive: 'https://archive.org/details/exercitatioanat00harv' },
      verify: true,
      viz(v) {
        const sCap = v.slider('ventricle capacity', 1, 3, 2, { step: 0.1, fmt: (x) => `${v.fix(x, 1)} oz` });
        const sDr = v.slider('blood expelled per beat', 0.25, 4, 1, { step: 0.25, fmt: (x) => `${v.fix(x, 2)} drachm` });
        const sB = v.slider('beats in half an hour', 600, 2500, 1000, { step: 50 });
        const sBody = v.slider('blood in the whole body', 2, 12, 4, { step: 0.5, fmt: (x) => `${x} lb` });
        const step = v.select('vein experiment', [{ value: 1, label: '1 tied arm' }, { value: 2, label: '2 strip to heart' }, { value: 3, label: '3 stroke back' }, { value: 4, label: '4 release' }], 2);
        const sF = v.slider('finger position', 0, 1, 0.6, { step: 0.02, fmt: (x) => v.fix(x, 2) });
        const a = v.stage({ x: [0, 30], y: [0, 14], height: 270, axes: 'box', gutter: true, xlabel: 'minutes', ylabel: 'blood pumped through the heart (lb)', weight: 1.1 });
        const b = v.stage({ x: [0, 4], y: [1, 1e6], ylog: true, height: 270, axes: 'box', gutter: true, ylabel: 'mL (log scale)', xticks: [[1, 'per beat'], [2, 'in 30 min'], [3, 'whole body']], weight: 0.9, minWidth: 240 });
        const c = v.stage({ x: [0, 10], y: [0.3, 3.7], height: 240, axes: false, full: true });
        let o = null;
        v.render(() => {
          const perBeat = sDr.value, N = sB.value, body = sBody.value, rate = N / 30;
          const lbAt = (t) => (perBeat * rate * t) / 96;
          a.fn(lbAt, { color: 'red', width: 2.8, domain: [0, 30] });
          a.hline(body, { color: 'accent', width: 2.2 }); a.text(`all the blood of the body (${body} lb)`, 29.5, body + 0.5, { size: 12, color: 'accent', align: 'right', weight: 700 });
          const tx = (body * 96) / (perBeat * rate);
          if (tx < 30) { a.vline(tx, { color: 'green', dash: [5, 4] }); a.dot(tx, body, { r: 7, color: 'green' }); a.text(`passes it after ${v.fix(tx, 1)} min`, tx + 0.5, body - 0.9, { size: 11, color: 'green', align: 'left' }); }
          const tot = lbAt(30); a.text(`${v.fix(tot, 1)} lb`, 29.5, Math.min(tot, 13) - 0.6, { size: 12, color: 'red', align: 'right', weight: 700 });
          // modern comparison
          const mlH = perBeat * DRAM_ML, totH = perBeat * N * DRAM_ML, bodyH = body * 12 * 8 * DRAM_ML;
          const bars = [[1, mlH, 70, 'Harvey', 'today'], [2, totH, 70 * 75 * 30, '', ''], [3, bodyH, 5000, '', '']];
          for (const [x, h, m] of bars) { b.rect(x - 0.38, 1, x - 0.02, h, { fill: 'red', fillAlpha: 0.35, color: 'red' }); b.rect(x + 0.02, 1, x + 0.38, m, { fill: 'accent', fillAlpha: 0.35, color: 'accent' }); b.text(Math.round(h).toLocaleString('en'), x - 0.2, h * 1.5, { size: 10, color: 'red', align: 'center' }); b.text(Math.round(m).toLocaleString('en'), x + 0.2, m * 1.5, { size: 10, color: 'accent', align: 'center' }); }
          // veins
          const stp = +step.value, s = sF.value, a0 = 2.0, b0 = 7.6, valve = 4.8, f = a0 + s * (b0 - a0);
          c.rect(0.1, 0.6, 9.9, 3.5, { fill: 'gold', fillAlpha: 0.1, stroke: false, radius: 14 });
          const full = (x) => { // is the vein filled at x
            if (stp === 1) return true;
            if (stp === 2) return !(x > a0 && x < f);
            if (stp === 3) return !(x > a0 && x < b0);
            return !(x > f && x < b0);
          };
          const segs = []; let cur = null; for (let k = 0; k <= 200; k++) { const x = 0.4 + (k / 200) * 9.2, fl = full(x); if (!cur || cur.fl !== fl) { cur = { fl, pts: [] }; segs.push(cur); } cur.pts.push([x, 2]); }
          segs.forEach((sg, i) => { if (i > 0) sg.pts.unshift(segs[i - 1].pts[segs[i - 1].pts.length - 1]); c.path(sg.pts, { color: sg.fl ? 'purple' : 'faint', width: sg.fl ? 14 : 2.5, alpha: sg.fl ? 0.75 : 1 }); });
          { const vx = valve, shut = stp === 3 || (stp === 4 && f < vx), tipY = shut ? 0.02 : 0.2, tipX = shut ? vx + 0.15 : vx + 0.3;
            for (const sgn of [1, -1]) c.line(vx - 0.2, 2 + sgn * 0.17, tipX, 2 + sgn * tipY, { color: 'ink', width: 3 }); }
          c.text('valve', valve, 1.5, { size: 11, color: 'muted', align: 'center' });
          c.text('hand', 0.4, 1.0, { size: 12, color: 'muted', align: 'left' }); c.text('heart →', 9.8, 1.0, { size: 12, color: 'muted', align: 'right' });
          c.dot(a0, 2, { r: 8, color: 'orange', hollow: stp === 1 }); c.text('lower finger', a0, 1.45, { size: 11, color: 'orange', align: 'center' });
          if (stp === 2) { c.dot(f, 2, { r: 8, color: 'gold' }); c.arrow(f - 0.9, 2.9, f + 0.1, 2.9, { color: 'gold', width: 2 }); }
          if (stp === 3) { const g2 = b0 - s * (b0 - a0); c.dot(g2, 2, { r: 8, color: 'gold' }); c.arrow(g2 + 0.9, 2.9, g2 - 0.1, 2.9, { color: 'gold', width: 2 }); c.text('valve shuts: nothing comes back', 6.5, 3.35, { size: 12, color: 'red', align: 'center', weight: 700 }); }
          if (stp === 4) c.text('lower finger lifted: the vein fills from the hand side', 5, 3.35, { size: 12, color: 'green', align: 'center', weight: 700 });
          if (stp === 2) c.text('blood is pushed through the valve toward the heart', 5, 3.35, { size: 12, color: 'gold', align: 'center', weight: 700 });
          if (stp === 1) c.text('arm tied: the veins swell', 5, 3.35, { size: 12, color: 'purple', align: 'center', weight: 700 });
          o = { tot, tx, mlH, totH, bodyH, perBeat };
        });
        v.readout(() => `${v.fix(sCap.value, 1)} oz holds ${v.fix(sCap.value * 8, 0)} drachms; Harvey's ${v.fix(o.perBeat, 2)} drachm per beat is ${v.fix(100 * o.perBeat / (sCap.value * 8), 0)}% of it → ${sB.value} beats pump ${v.fix(o.tot * 12, 0)} oz = ${v.fix(o.tot, 1)} lb in half an hour${o.tot > sBody.value ? ` (${v.fix(o.tot / sBody.value, 1)}× the whole body)` : ' (less than the body holds)'}\nin modern units ${v.fix(o.mlH, 1)} mL per beat against a measured stroke volume of about 70 mL; his total, ${v.fix(o.totH / 1000, 1)} L in 30 min, against about ${v.fix((70 * 75 * 30) / 1000, 0)} L today (the 1628 estimate is low by a factor ${v.fix(70 / o.mlH, 0)})`);
      },
    },
    // ------------------------------------------------------------------ 4.20
    {
      num: '4.20',
      kind: 'Paper',
      name: 'Absorption of Fluids from the Connective Tissue Spaces',
      paper: { authors: 'Ernest H. Starling', year: 1896, title: 'On the Absorption of Fluids from the Connective Tissue Spaces', venue: 'Journal of Physiology 19 (4): 312–326', doi: '10.1113/jphysiol.1896.sp000596' },
      introduces: ['physio-4.12'],
      statement: String.raw`In his 1896 paper, Starling investigated whether blood vessels could absorb isotonic fluid from tissue spaces. In paired isolated dog-limb perfusions with defibrinated blood, the blood passing through a limb made oedematous with salt solution became more dilute than blood passing through the control limb. He also measured serum-protein osmotic pressure using membrane osmometers. He argued that a difference in protein osmotic pressure could oppose capillary hydrostatic pressure and account for absorption of salt-rich tissue fluid. The paper explicitly distinguishes this from protein-rich tissue fluid, whose removal he associated mainly with lymphatics.`,
      idea: String.raw`The argument concerns **selective permeability**: salts that readily cross a membrane do not sustain the same osmotic difference as retained proteins. The paper's limb experiments (pp. 314–316) and osmometer experiments (pp. 321–324) were distinct pieces of evidence. The panel below is a later classical flux model inspired by this force balance, not a reconstruction of his apparatus, his measured curves or a modern glycocalyx model. It keeps both compartments' pressures and composition fixed while the reader varies perfusate protein.`,
      caption: String.raw`Choose the model perfusate's **protein concentration**, drag the **capillary-pressure** handle and choose a duration. The left panel plots signed classical filtration: positive is outward, negative is absorption. The right panel multiplies that constant flux by time and by ten 100-g tissue units to give the signed fluid-mass change for a nominal 1-kg limb (using 1 mL ≈ 1 g). The zero-flux pressure is computed from the chosen oncotic relation. The marker and full curves remain visible even when the model predicts a large gain or loss.`,
      scope: String.raw`Frozen-compartment illustration: $J=K_f[(P_c-P_i)-\pi(c)]$, with chosen $K_f=0.01$ mL/min/mmHg per 100 g, $P_i=-3$ mmHg and zero interstitial oncotic pressure. The polynomial $\pi(c)=2.1c+0.16c^2+0.009c^3$ mmHg for $c$ in g/dL is the Landis–Pappenheimer relation as reproduced in Weinstein's 2017 computational kidney model, equation (46); the 1963 original fit was not independently inspected and this is not a new validation of it. The model omits changing tissue/plasma volume, protein redistribution, lymph flow and glycocalyx effects, so long-duration straight lines are mathematical extrapolations. The parameters are not asserted skeletal-muscle measurements.`,
      deps: ['physio-1.4'],
      see: ['physio-4.12', 'physio-4.13'],
      refs: ['Starling (1896), J Physiol 19:312–326, pp. 314–316, 321–325; DOI 10.1113/jphysiol.1896.sp000596', 'Weinstein (2017), A mathematical model of the rat kidney: K+-induced natriuresis, Model Calculations, equation (46); PMCID PMC6148314'],
      tags: ['Starling', 'oncotic pressure', 'history'],
      credit: 'E. H. Starling, 1896',
      links: { doi: 'https://doi.org/10.1113/jphysiol.1896.sp000596' },
      verify: false,
      viz(v) {
        const sC = v.slider('perfusate protein', 0, 10, 7, { step: 0.5, fmt: (x) => `${x} g/dL` });
        const sT = v.slider('duration', 5, 120, 60, { step: 5, fmt: (x) => `${x} min` });
        const KF = 0.01; // mL/min/mmHg per 100 g
        const pi = oncoticPressure;
        const a = v.stage({ x: [-2, 52], y: [-1, 1], height: 320, axes: 'box', gutter: true, xlabel: 'capillary pressure (mmHg)', ylabel: 'net filtration (mL/min per 100 g)', weight: 1.1 });
        const b = v.stage({ x: [-2, 52], y: [-100, 100], height: 320, axes: 'box', gutter: true, xlabel: 'capillary pressure (mmHg)', ylabel: 'weight change of 1 kg limb (g)', weight: 1 });
        const h = a.handle(30, 0, { color: 'gold', label: 'Pc', constrain: (x) => [clamp(x, 0, 50), 0] });
        const PI = -3; // chosen interstitial pressure in mmHg
        let o = null;
        v.render(() => {
          const T = sT.value, Pc = h.x;
          const flux = (P, c) => KF * ((P - PI) - (pi(c) - 0));
          const Pstar = (c) => pi(c) + PI;
          const extrema = [0, 3.5, 7, sC.value].flatMap(c => [0, 50].map(p => 10 * flux(p, c) * T));
          b.setView([-2, 52], [Math.min(-1, ...extrema) * 1.2, Math.max(1, ...extrema) * 1.2]);
          for (const [c, col, nm, labelX] of [[0, 'red', 'salt solution', 2], [3.5, 'orange', '3.5 g/dL', 20], [7, 'green', '7 g/dL model', 36]]) {
            a.fn((P) => flux(P, c), { color: col, width: 1.6, alpha: 0.55, domain: [0, 50] });
            b.fn((P) => 10 * flux(P, c) * T, { color: col, width: 1.6, alpha: 0.55, domain: [0, 50] });
            a.text(nm, labelX, flux(labelX, c) + 0.03, { size: 10, color: col, align: 'left', baseline: 'bottom' });
          }
          const c = sC.value;
          a.fn((P) => flux(P, c), { color: 'accent', width: 3, domain: [0, 50] }); a.hline(0, { color: 'muted', width: 1 });
          b.fn((P) => 10 * flux(P, c) * T, { color: 'accent', width: 3, domain: [0, 50] }); b.hline(0, { color: 'muted', width: 1 });
          h.set(Pc, flux(Pc, c)); if (Pstar(c) >= 0 && Pstar(c) <= 50) a.vline(Pstar(c), { color: 'green', dash: [4, 4] });
          const gain = 10 * flux(Pc, c) * T; b.dot(Pc, gain, { r: 7, color: 'gold' });
          o = { ...frozenFiltration(Pc, c, T), c, Pc, pi: pi(c), Pstar: Pstar(c), f: flux(Pc, c), gain, T };
        });
        v.readout(() => `${v.fix(o.c, 1)} g/dL protein → osmotic pressure ${v.fix(o.pi, 1)} mmHg; no net movement at capillary pressure ≈ ${v.fix(o.Pstar, 1)} mmHg (hydrostatic = oncotic, with the interstitial pressure of −3 mmHg)\nat ${v.fix(o.Pc, 0)} mmHg: ${o.f >= 0 ? 'filtration' : 'absorption'} of ${v.fix(Math.abs(o.f), 3)} mL/min per 100 g → ${o.gain >= 0 ? '+' : '−'}${v.fix(Math.abs(o.gain), 0)} g of limb weight in ${o.T} min`);
      },
    },
  ],
};
