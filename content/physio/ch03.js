// Human Physiology — Chapter 3: The heart as a pump (part a: 3.1–3.6)
import { clamp, trace, heartBeat, beatAt, beatIdx, phases, phaseLoop, ecgAt, soundAt, drawLoop, cornerPoints, HEART } from './ch03.shared.js';

import { valveStates, cycleDurations } from './physio-source-audit-cycle.js';
import { OUTPUT_PRESETS, integrateSamples } from './physio-source-audit-cardiac.js';

// ---------- helpers for this file ----------
const fmt0 = (x) => String(Math.round(x));
/** A sweep of beats over one parameter; cached per call site by the caller. */
const sweep = (name, vals, base = {}) => vals.map((x) => ({ x, R: heartBeat({ ...base, [name]: x }) }));
const NAMES = { A: 'atrial systole', IC: 'isovolumic contraction', E: 'ejection', IR: 'isovolumic relaxation', F: 'ventricular filling' };

export default {
  collection: 'physio',
  chapter: 3,
  title: 'The heart as a pump',
  summary: String.raw`Each heartbeat is a cycle of filling, isovolumic contraction, ejection and relaxation, best seen as a loop on the pressure–volume plane. The Frank–Starling law and the time-varying elastance model explain how stroke volume follows filling, afterload and contractility, and the loop's area is the work done. The ECG is the body-surface signature of the heart's rotating electrical dipole, and re-entrant waves are the mechanism of many arrhythmias. Every curve in this chapter comes from one small left-heart model (an atrium, a ventricle of time-varying stiffness, two valves and an arterial load), so the pictures stay consistent with each other.`,
  items: [
    // ------------------------------------------------------------------ 3.1
    {
      num: '3.1',
      kind: 'Concept',
      name: 'The cardiac cycle and the Wiggers diagram',
      statement: String.raw`A normally coordinated left-heart beat can be divided into five mechanical phases. **Atrial systole** adds filling. As the ventricle contracts and its pressure exceeds atrial pressure, the **mitral valve closes**; with both valves shut, pressure rises at nearly constant volume (**isovolumic contraction**). When ventricular pressure exceeds aortic pressure, the **aortic valve opens** and ejection starts. As ventricular pressure falls below aortic pressure, the **aortic valve closes**, followed by **isovolumic relaxation**. When ventricular pressure falls below atrial pressure, the mitral valve opens and ventricular filling resumes. A Wiggers-style diagram aligns the pressure, volume, ECG and sound traces on one time axis.`,
      idea: String.raw`The atrial and ventricular muscle activations change chamber pressure; the ideal model valves then respond to pressure differences. When both are closed, neither inflow nor outflow changes ventricular volume. Patterson and Starling's 1914 discussion describes ventricular contraction, aortic opening, ejection and closure during relaxation; the panel illustrates that mechanical sequence with a chosen lumped atrium/ventricle/arterial-load model. Its first- and second-sound bursts are synthetic marks near the model's mitral and aortic closure times, and its Gaussian ECG is schematic, not a simulated electrical recording.`,
      caption: String.raw`Each model beat takes **four display seconds**. Follow the cursor and shaded phases across the aligned curves; gold dots mark the sampled valve events. Change the **heart rate** to compare the model's systolic and filling intervals. Toggle phase shading or pause the cursor to inspect the pressure comparisons. The display slowdown therefore varies with the chosen beat duration.`,
      scope: String.raw`Chosen left-heart model with instantaneous one-way resistive valves and a two-element Windkessel load. RK4 uses 1 ms steps and 12 warmup beats; the displayed last beat has a small residual end-to-start volume difference, reported below, rather than a guaranteed exact periodic orbit. Event times are sampled at approximately 1 ms resolution. Numerical pressures, volumes, ECG amplitudes and sound frequencies are illustrative; valve inertia, the right heart and measured acoustic/electrical signals are absent. This is not a patient trace or a reconstruction of an original Wiggers plate.`,
      deps: ['physio-2.9'],
      see: ['physio-3.2', 'physio-4.7'],
      refs: ['Patterson & Starling (1914), On the mechanical factors which determine the output of the ventricles, J Physiol 48:357–379, pp.358–359 mechanical valve sequence; DOI 10.1113/jphysiol.1914.sp001669', 'Keener & Sneyd, author manuscript, section11.4 pp.490–492 and Fig.11.5, pressure–volume phase interpretation'],
      tags: ['cardiac cycle', 'heart'],
      links: { source: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC1420422/' },
      verify: false,
      viz(v) {
        const hr = v.slider('heart rate', 50, 120, 75, { step: 1, fmt: (x) => `${fmt0(x)} /min` });
        const bands = v.toggle('shade the phases', true);
        const gut = (b) => ({ l: 50, r: 10, t: 20, b });
        const sP = v.stage({ x: [0, 1], y: [0, 150], height: 230, axes: 'box', gutter: gut(6), ylabel: 'pressure (mmHg)', xticks: [], full: true });
        const sV = v.stage({ x: [0, 1], y: [40, 130], height: 110, axes: 'box', gutter: gut(6), ylabel: 'volume (mL)', xticks: [], full: true });
        const sE = v.stage({ x: [0, 1], y: [-0.4, 1.2], height: 96, axes: 'box', gutter: gut(6), ylabel: 'ECG', yticks: [], xticks: [], full: true });
        const sS = v.stage({ x: [0, 1], y: [-1.3, 1.3], height: 90, axes: 'box', gutter: gut(34), xlabel: 't (s)', ylabel: 'sound', yticks: [], full: true });
        let T = 0.8, R = null, tc = 0;
        v.animate((t) => {
          R = heartBeat({ HR: hr.value }); T = R.T;
          tc = (((t / 4) % 1) * T);
          for (const s of [sP,sV,sE,sS]) s.setView([-.02,T+.02],undefined);
          sV.setView(undefined,[Math.min(...R.V)-8,Math.max(...R.V)+8]);
          const ph = phases(R);
          for (const s of [sP, sV, sE, sS]) {
            if (bands.value) for (const p of ph) s.vband(p.t0, p.t1, { color: p.color, alpha: 0.1, edges: false });
            s.vline(tc, { color: 'gold', width: 1.6 });
          }
          if (bands.value) { const lab = { A: 'A', IC: 'IC', E: 'ejection', IR: 'IR', F: 'filling' }; for (const p of ph) sP.text(lab[p.key], (p.t0 + p.t1) / 2, 148, { size: 11, color: p.color, align: 'center', baseline: 'top', weight: 700 }); }
          trace(sP, R.t, R.Pa, { color: 'red', width: 2.2 });
          trace(sP, R.t, R.P, { color: 'accent', width: 2.4 });
          trace(sP, R.t, R.Pat, { color: 'green', width: 2 });
          trace(sV, R.t, R.V, { color: 'purple', width: 2.4 });
          trace(sE, R.t, R.t.map((x) => ecgAt(R, x)), { color: 'ink', width: 1.8 });
          trace(sS, R.t, R.t.map((x) => soundAt(R, x)), { color: 'teal', width: 1.4 });
          sS.text('S1', R.tMVC + 0.02, 1.0, { size: 11, color: 'teal', align: 'left', weight: 700 });
          sS.text('S2', R.tAVC + 0.02, 0.8, { size: 11, color: 'teal', align: 'left', weight: 700 });
          sE.text('P', 0.045, 0.3, { size: 11, color: 'muted', align: 'center', baseline: 'bottom' });
          sE.text('QRS', R.par.tVent - 0.01, 1.2, { size: 11, color: 'muted', align: 'center', baseline: 'top', dx: 22 });
          sE.text('T', (R.tAVC ?? 0.36) - 0.07, 0.4, { size: 11, color: 'muted', align: 'center', baseline: 'bottom' });
          for (const [tt, k] of [[R.tMVC, 'mitral closes'], [R.tAVO, 'aortic opens'], [R.tAVC, 'aortic closes'], [R.tMVO, 'mitral opens']]) if (tt != null) sP.dot(tt, beatAt(R, k === 'mitral closes' || k === 'mitral opens' ? R.Pat : R.Pa, tt) , { r: 4, color: 'gold' });
        }, { period: 4, still: 1.1 });
        v.legend([['red', 'aortic pressure'], ['accent', 'ventricular pressure'], ['green', 'atrial pressure'], ['purple', 'ventricular volume'], ['gold', 'valve events (dots) and cursor']]);
        v.readout(() => {
          if (!R) return '';
          const i = beatIdx(R, tc), ph = phases(R).find((p) => tc >= p.t0 && tc < p.t1) || phases(R)[4];
          const {mitral:mit,aortic:ao}=valveStates(R,i),d=cycleDurations(R);
          return `**${NAMES[ph.key]}** · mitral valve **${mit}**, aortic valve **${ao}** · $P_{\\mathrm{LV}} = ${v.fix(R.P[i], 0)}$, $P_{\\mathrm{Ao}} = ${v.fix(R.Pa[i], 0)}$, $P_{\\mathrm{LA}} = ${v.fix(R.Pat[i], 0)}$ mmHg, $V = ${v.fix(R.V[i], 0)}$ mL\ncycle ${v.fix(R.T*1000,0)} ms: isovolumic contraction ${v.fix(d.contraction*1000,0)} ms, ejection ${v.fix(d.ejection*1000,0)} ms, isovolumic relaxation ${v.fix(d.relaxation*1000,0)} ms, filling ${v.fix(d.filling*1000,0)} ms; end-to-start volume difference ${v.fix(R.drift,3)} mL`;
        });
      },
    },

    // ------------------------------------------------------------------ 3.2
    {
      num: '3.2',
      kind: 'Concept',
      name: 'Pressure–volume loop',
      statement: String.raw`If the left-ventricular pressure $P$ of one beat is plotted against the ventricular volume $V$ (time disappears as a coordinate), the beat traces a closed loop, run **counter-clockwise**. Its four corners are valve events: **1** mitral valve closes (end-diastole, the right-hand bottom corner), **2** aortic valve opens, **3** aortic valve closes (end-systole, top left), **4** mitral valve opens. The right side from 1 to 2 is isovolumic contraction, the top from 2 to 3 is ejection, the left side from 3 to 4 is isovolumic relaxation, and the bottom from 4 to 1 is filling. The horizontal width of the loop is the stroke volume, $SV = V_{\mathrm{ED}} - V_{\mathrm{ES}}$, and its area is the work done by the ventricle on the blood in the beat.`,
      idea: String.raw`The loop is the Wiggers diagram (physio-3.1) with time eliminated: the same curves $P(t)$ and $V(t)$, plotted against each other. Isovolumic phases are vertical segments because $V$ cannot change while both valves are closed; ejection and filling are the segments along which blood actually moves. Because a closed loop encloses a signed area $\oint P\,dV$, the plane is the natural place to talk about work (physio-3.7) and, with the end-systolic and end-diastolic boundary curves, about contractility and stiffness (physio-3.4).`,
      caption: String.raw`A gold dot runs round the loop while the small panel on the right shows the same instant on the pressure curves. The numbered corners carry the valve events; the loop's four sides are coloured by phase. Pick a **phase** to thicken it, and change the **arterial resistance**: the top of the loop moves up and the ejection side shortens, but the right and bottom sides (filling) do not change.`,
      scope: String.raw`Shown for the model left ventricle of this chapter; clinical loops are measured with a pressure–volume catheter (conductance or imaging volumes) and have the same four corners, although the sides are rounded and slightly sloped.`,
      deps: ['physio-3.1'],
      see: ['physio-3.7'],
      refs: ['Keener–Sneyd ch. 11'],
      tags: ['pressure–volume loop', 'heart'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Pressure%E2%80%93volume_loop_analysis_in_cardiology' },
      viz(v) {
        const res = v.slider('arterial resistance', 0.7, 2, HEART.R, { step: 0.05, fmt: (x) => `${v.fix(x, 2)} mmHg·s/mL` });
        const hi = v.select('thicken', [{ value: 'all', label: 'all' }, { value: 'F', label: 'filling' }, { value: 'IC', label: 'isovol. contraction' }, { value: 'E', label: 'ejection' }, { value: 'IR', label: 'isovol. relaxation' }], 'all');
        const sL = v.stage({ x: [30, 150], y: [0, 160], height: 340, axes: 'box', gutter: true, xlabel: 'ventricular volume (mL)', ylabel: 'ventricular pressure (mmHg)', weight: 1.3 });
        const sT = v.stage({ x: [0, 1], y: [0, 160], height: 340, axes: 'box', gutter: true, xlabel: 't (s)', ylabel: 'pressure (mmHg)', weight: 1 });
        let R = null, tc = 0;
        v.animate((t) => {
          R = heartBeat({ R: res.value }); tc = ((t / 5) % 1) * R.T;
          sT.setView([0, R.T], undefined);
          const ph = phases(R);
          for (const p of ph) sT.vband(p.t0, p.t1, { color: p.color, alpha: 0.1, edges: false });
          trace(sT, R.t, R.Pa, { color: 'red', width: 2 });
          trace(sT, R.t, R.P, { color: 'accent', width: 2.2 });
          trace(sT, R.t, R.Pat, { color: 'green', width: 1.6 });
          sT.vline(tc, { color: 'gold', width: 1.6 });
          // loop, with the chosen phase thickened
          for (const p of ph) {
            const pts = phaseLoop(R, p), key = p.key === 'A' ? 'F' : p.key, col = p.key === 'A' ? 'accent' : p.color;
            sL.path(pts, { color: col, width: hi.value === 'all' ? 2.8 : hi.value === key ? 5 : 1.4, alpha: hi.value === 'all' || hi.value === key ? 1 : 0.5 });
          }
          const cs = cornerPoints(R), pos = ['ne', 'ne', 'nw', 'nw'];
          cs.forEach((c, k) => sL.dot(c[0], c[1], { r: 6, color: 'ink', label: c[2], labelPos: pos[k] }));
          sL.text('mitral closes', cs[0][0] + 2, cs[0][1] - 9, { size: 10.5, color: 'muted', align: 'center', baseline: 'top' });
          sL.text('aortic opens', cs[1][0] + 4, cs[1][1], { size: 10.5, color: 'muted', align: 'left' });
          sL.text('aortic closes', cs[2][0] + 4, cs[2][1] + 7, { size: 10.5, color: 'muted', align: 'left' });
          sL.text('mitral opens', cs[3][0] + 3, cs[3][1] + 16, { size: 10.5, color: 'muted', align: 'left' });
          sL.measure(R.ESV, 150, R.EDV, 150, `SV = ${v.fix(R.SV, 0)} mL`);
          const i = beatIdx(R, tc);
          sL.dot(R.V[i], R.P[i], { r: 7, color: 'gold' });
        }, { period: 5, still: 1.7 });
        v.legend([['accent', 'filling'], ['orange', 'isovolumic contraction'], ['red', 'ejection'], ['purple', 'isovolumic relaxation'], ['gold', 'now']]);
        v.readout(() => {
          if (!R) return '';
          const e = R.ev, p = phases(R).find((q) => tc >= q.t0 && tc < q.t1) || phases(R)[4];
          return `now: **${NAMES[p.key]}** · $V_{\\mathrm{ED}} = ${v.fix(R.EDV, 0)}$ mL, $V_{\\mathrm{ES}} = ${v.fix(R.ESV, 0)}$ mL, $SV = ${v.fix(R.SV, 0)}$ mL · valve opens at ${v.fix(R.P[e.iAVO], 0)} mmHg, peak ${v.fix(R.Pmax, 0)} mmHg · loop runs counter-clockwise: the loop area is ${v.fix(R.work, 0)} mmHg·mL`;
        });
      },
    },

    // ------------------------------------------------------------------ 3.3
    {
      num: '3.3',
      kind: 'Law',
      name: 'Frank–Starling law of the heart',
      statement: String.raw`Within the physiological range, the volume of blood the ventricle ejects in a beat increases with the volume (and so the pressure) at which it was filled: a more stretched ventricle beats harder, and in the intact circulation the output of the heart automatically matches the venous return. In the language of the pressure–volume plane, raising the filling pressure moves end-diastole to the right, the loop widens, and stroke volume rises along a **Starling curve** that is steep at low filling and **flattens** at high filling pressure, where the heart is at the stiff end of its passive pressure–volume curve. The law holds beat by beat, without nerves or hormones.`,
      idea: String.raw`Two relations do the work in the elastance picture (physio-3.4). The end-systolic pressure–volume line is the same whatever the filling, so a larger end-diastolic volume ends at a somewhat larger end-systolic volume, but not as much larger: the difference, the stroke volume, grows. At the cellular level the stretched sarcomere develops more force because of the length–tension relation (physio-2.4) and a higher calcium sensitivity; the model below deliberately contains none of that, only the organ-level elastance, so it shows how much of the Starling curve comes from the geometry of the pressure–volume plane alone. The flattening comes from the steepening passive curve: the ventricle cannot be filled much beyond about 140–150 mL without a large pressure.`,
      caption: String.raw`Drag the **filling pressure** (the pressure feeding the atrium). The coloured loop is the beat at that filling, with six other fillings behind it in grey; the plotted point on the Starling curve (stroke volume against end-diastolic pressure) follows. Switch the **contractility** to a failing ventricle (low end-systolic elastance) and the curve flattens and drops: the same filling now ejects less, and filling pressure rises for any output.`,
      scope: String.raw`Holds for a ventricle working in its normal range of fillings with a given arterial load and contractility; at extreme stretch the curve flattens or declines, and in a failing, dilated ventricle the operating point lies on the flat part. The model has no length-dependent activation or nervous control, so its curve is shallower than measured ones; the shape is the point.`,
      deps: ['physio-3.2', 'physio-2.4'],
      see: ['physio-3.11'],
      refs: ['Guyton–Hall', 'Keener–Sneyd ch. 11'],
      tags: ['Starling law', 'heart'],
      credit: 'Otto Frank (isolated frog hearts, 1895) and Ernest H. Starling (heart–lung preparation, 1914; the name "law of the heart" is from his Linacre lecture, delivered 1915 and published 1918)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Frank%E2%80%93Starling_law' },
      viz(v) {
        const pv = v.slider('filling pressure (venous side)', 2, 22, 10, { step: 0.5, fmt: (x) => `${v.fix(x, 1)} mmHg` });
        const con = v.select('contractility', [{ value: 1.3, label: 'failing' }, { value: 2.8, label: 'normal' }, { value: 4.5, label: 'increased' }], 2.8);
        const sL = v.stage({ x: [30, 170], y: [0, 170], height: 330, axes: 'box', gutter: true, xlabel: 'ventricular volume (mL)', ylabel: 'ventricular pressure (mmHg)', weight: 1.2 });
        const sS = v.stage({ x: [0, 28], y: [0, 100], height: 330, axes: 'box', gutter: true, xlabel: 'end-diastolic pressure (mmHg)', ylabel: 'stroke volume (mL)', weight: 1 });
        const curve = (Ees) => { const out = []; for (let p = 2; p <= 22.01; p += 2) { const R = heartBeat({ Pv: p, Ees }); out.push([R.EDP, R.SV]); } return out; };
        const curves = { 1.3: curve(1.3), 2.8: curve(2.8), 4.5: curve(4.5) };
        let R = null;
        v.render(() => {
          const Ees = +con.value;
          R = heartBeat({ Pv: pv.value, Ees });
          for (const p of [4, 7, 10, 14, 18, 22]) { const Q = heartBeat({ Pv: p, Ees }); sL.path(Q.loop, { color: 'faint', width: 1.2, alpha: 0.8, close: true }); }
          sL.fn((V) => Ees * (V - HEART.V0), { color: 'orange', dash: [6, 4], width: 1.3, domain: [HEART.V0, 170] });
          sL.fn((V) => HEART.A * (Math.exp(HEART.B * (V - HEART.V0)) - 1), { color: 'blue', dash: [6, 4], width: 1.3, domain: [HEART.V0, 170] });
          { const Vt = HEART.V0 + 70 / Ees; sL.text('end-systolic line', Vt, 70, { size: 10.5, color: 'orange', align: 'left', baseline: 'middle', dx: 8, plate: true }); }
          sL.text('passive filling curve', 168, 28, { size: 10.5, color: 'blue', align: 'right' });
          drawLoop(sL, R);
          sL.dot(R.EDV, R.EDP, { r: 5, color: 'ink' }); sL.dot(R.ESV, R.Pes, { r: 5, color: 'ink' });
          sL.measure(R.ESV, 160, R.EDV, 160, `SV = ${v.fix(R.SV, 0)} mL`);
          for (const [E, c] of [[1.3, 'red'], [2.8, 'accent'], [4.5, 'green']]) sS.path(curves[E], { color: c, width: Ees === E ? 3 : 1.4, alpha: Ees === E ? 1 : 0.55 });
          sS.dot(R.EDP, R.SV, { r: 8, color: 'gold' });
          sS.text('failing', 26.5, curves[1.3][curves[1.3].length - 1][1] - 4, { size: 11, color: 'red', align: 'right', baseline: 'top' });
          sS.text('normal', 26.5, curves[2.8][curves[2.8].length - 1][1] + 3, { size: 11, color: 'accent', align: 'right', baseline: 'bottom' });
          sS.text('increased', 26.5, curves[4.5][curves[4.5].length - 1][1] + 3, { size: 11, color: 'green', align: 'right', baseline: 'bottom' });
        });
        v.legend([['accent', 'filling'], ['red', 'ejection'], ['orange', 'end-systolic line', { dash: true }], ['blue', 'passive curve', { dash: true }], ['gold', 'current beat on the Starling curve']]);
        v.readout(() => {
          const a = heartBeat({ Pv: pv.value - 2, Ees: +con.value }), b = heartBeat({ Pv: pv.value + 2, Ees: +con.value });
          const slope = (b.SV - a.SV) / (b.EDP - a.EDP), dEDV = b.EDV - a.EDV;
          return `$V_{\\mathrm{ED}} = ${v.fix(R.EDV, 0)}$ mL at $P_{\\mathrm{ED}} = ${v.fix(R.EDP, 1)}$ mmHg → $SV = ${v.fix(R.SV, 0)}$ mL, $EF = ${v.fix(100 * R.EF, 0)}\\%$ · local slope of the Starling curve ${v.fix(slope, 1)} mL/mmHg (${v.fix(dEDV, 0)} mL more end-diastolic volume gives ${v.fix(b.SV - a.SV, 0)} mL more output)`;
        });
      },
    },

    // ------------------------------------------------------------------ 3.4
    {
      num: '3.4',
      kind: 'Model',
      name: 'Time-varying elastance model of the ventricle',
      statement: String.raw`Model the ventricle as a chamber whose stiffness, its **elastance** $E(t) = P/(V - V_0)$, changes through the beat: low during filling, rising to a maximum $E_{\max}$ at end-systole, then falling again. With a normalised activation $e(t) \in [0,1]$ (the shape is the same in every beat),
$$P(t) = e(t)\,E_{\mathrm{es}}\,(V - V_0) + \bigl(1 - e(t)\bigr)\,P_{\mathrm{ed}}(V),$$
where $P_{\mathrm{ed}}(V)$ is the passive (end-diastolic) pressure–volume curve and $E_{\mathrm{es}}$ the slope of the **end-systolic pressure–volume line** $P = E_{\mathrm{es}}(V - V_0)$. The remarkable empirical fact is that $E_{\mathrm{es}}$ is nearly independent of the loading: loops from any filling and any arterial resistance end on the same line, so its slope measures **contractility**. Together with the arterial load, the line determines the stroke volume and the pressure of every beat.`,
      idea: String.raw`Treat the ventricle as a spring whose stiffness is switched on by the activation $e(t)$ (physio-2.3 supplies the rise and fall: calcium transient and then relaxation). Ejection stops when the pressure the ventricle can produce, $E(t)(V - V_0)$, falls below the pressure of the aorta; that happens when $e$ is close to its maximum, so the end-systolic point lies on the line of slope $E_{\mathrm{es}}$ almost regardless of how the ventricle was loaded. The loop's top-left corner is therefore pinned by the line, and its bottom-right corner by the passive curve. The simulation draws the loops from the model, and the line fitted through their end-systolic points is measured, not assumed.`,
      caption: String.raw`Five loops are drawn at once, with different fillings (three, at constant arterial resistance) and different arterial resistances (three, at constant filling); each has an end-systolic dot. Move the **time slider** to draw the instantaneous pressure–volume line $E(t)(V-V_0)$ and the dot that the current loop has on it: the line rotates up from the passive curve and back. Change the contractility $E_{\mathrm{es}}$ and the whole family of loops moves to a line of the new slope; the readout gives the slope fitted through the dots.`,
      scope: String.raw`Holds when contractility, heart rate and the activation shape are not themselves changed by the loading. Real ventricles show a slight curvature of the end-systolic relation and a dependence on heart rate; in the model, the "load independence" is a property built from the activation shape, but the fitted line and the loops it explains are computed, not drawn.`,
      deps: ['physio-3.2'],
      see: ['physio-3.5', 'physio-3.6'],
      refs: ['Keener–Sneyd ch. 11'],
      tags: ['elastance', 'contractility'],
      credit: 'Hiroyuki Suga and Kiichi Sagawa, 1973–74 (time-varying elastance from experiments on the canine left ventricle); the activation curve used here is a normalised double-Hill shape of the kind used by Stergiopulos and colleagues',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Elastance_(medicine)' },
      viz(v) {
        const ees = v.slider('contractility $E_{\\mathrm{es}}$', 1, 5, HEART.Ees, { step: 0.1, fmt: (x) => `${v.fix(x, 1)} mmHg/mL` });
        const tt = v.slider('time in the beat', 0, 0.8, 0.2, { step: 0.005, fmt: (x) => `${v.fix(x * 1000, 0)} ms` });
        const sL = v.stage({ x: [30, 170], y: [0, 180], height: 350, axes: 'box', gutter: true, xlabel: 'ventricular volume (mL)', ylabel: 'ventricular pressure (mmHg)', weight: 1.3 });
        const sE = v.stage({ x: [0, 0.8], y: [0, 1.15], height: 350, axes: 'box', gutter: true, xlabel: 't (s)', ylabel: 'activation  e(t) = E(t)/E_es', weight: 0.8, minWidth: 240 });
        const combos = [[6, 1.25], [10, 1.25], [15, 1.25], [10, 0.8], [10, 1.8]];
        let runs = null, fit = null, e1 = null;
        v.render(() => {
          const Ees = ees.value;
          runs = combos.map(([Pv, Rr]) => heartBeat({ Pv, R: Rr, Ees }));
          const pts = runs.map((R) => [R.ESV, R.Pes]);
          const n = pts.length, mx = pts.reduce((a, p) => a + p[0], 0) / n, my = pts.reduce((a, p) => a + p[1], 0) / n;
          let sxx = 0, sxy = 0, syy = 0; for (const p of pts) { sxx += (p[0] - mx) ** 2; sxy += (p[0] - mx) * (p[1] - my); syy += (p[1] - my) ** 2; }
          const slope = sxy / sxx, icpt = mx - my / slope; fit = { slope, V0: icpt, r2: (sxy * sxy) / (sxx * syy) };
          sL.fn((V) => HEART.A * (Math.exp(HEART.B * (V - HEART.V0)) - 1), { color: 'blue', dash: [6, 4], width: 1.3, domain: [HEART.V0, 170] });
          sL.fn((V) => Ees * (V - HEART.V0), { color: 'orange', width: 2, domain: [HEART.V0, 170] });
          sL.text('end-systolic line  $P = E_{es}(V-V_0)$', 168, Math.min(172, Ees * 120), { size: 11, color: 'orange', align: 'right', baseline: 'bottom', dy: -10 });
          const R0 = runs[1], e = beatAt(R0, R0.e, tt.value);
          sL.fn((V) => e * Ees * (V - HEART.V0) + (1 - e) * HEART.A * (Math.exp(HEART.B * (V - HEART.V0)) - 1), { color: 'gold', width: 2.4, domain: [HEART.V0, 170] });
          runs.forEach((R, k) => { sL.path(R.loop, { color: k === 1 ? 'accent' : 'faint', width: k === 1 ? 2.8 : 1.6, close: true }); });
          runs.forEach((R) => sL.dot(R.ESV, R.Pes, { r: 5, color: 'red' }));
          sL.dot(beatAt(R0, R0.V, tt.value), beatAt(R0, R0.P, tt.value), { r: 7, color: 'gold' });
          sE.fn((x) => 0, { color: 'faint' });
          trace(sE, R0.t, R0.e, { color: 'orange', width: 2.4 });
          sE.vline(tt.value, { color: 'gold', width: 1.6 });
          sE.dot(tt.value, e, { r: 6, color: 'gold' });
          e1 = e;
        });
        v.legend([['accent', 'the beat followed by the time slider'], ['faint', 'four more loadings'], ['red', 'end-systolic points'], ['orange', 'end-systolic line'], ['gold', 'line $E(t)(V-V_0)+\\ldots$ at the chosen time'], ['blue', 'passive curve', { dash: true }]]);
        v.readout(() => {
          const dev = Math.max(...runs.map((R) => Math.abs(R.Pes - ees.value * (R.ESV - HEART.V0))));
          return `slope of the line fitted through the five end-systolic points: **${v.fix(fit.slope, 2)}** mmHg/mL (set $E_{\\mathrm{es}} = ${v.fix(ees.value, 1)}$), $R^2 = ${v.fix(fit.r2, 4)}$ · largest distance of an end-systolic point from the line: ${v.fix(dev, 1)} mmHg · now $e(t) = ${v.fix(e1, 2)}$\nend-systolic volumes ${runs.map((R) => v.fix(R.ESV, 0)).join(', ')} mL for filling pressures 6, 10, 15 mmHg and resistances 0.8, 1.8 (centre loop in blue)`;
        });
      },
    },

    // ------------------------------------------------------------------ 3.5
    {
      num: '3.5',
      kind: 'Concept',
      name: 'Preload, afterload and contractility',
      statement: String.raw`Three quantities set what a ventricle does in a beat. **Preload** is the load that stretches the muscle before it contracts: in practice the end-diastolic volume or pressure, set by venous return. **Afterload** is the load the muscle works against while ejecting: in practice aortic pressure and arterial resistance (more precisely the wall stress, physio-3.8). **Contractility** (inotropy) is the strength of contraction at a given length and load, the slope $E_{\mathrm{es}}$ of the end-systolic line. On the pressure–volume plane each has its signature. More preload moves the right side of the loop out and raises stroke volume. More afterload makes the loop taller and narrower, so stroke volume falls and the end-systolic volume rises. More contractility steepens the end-systolic line, lowers the end-systolic volume and raises stroke volume and ejection fraction.`,
      idea: String.raw`All three signatures follow from the elastance model (physio-3.4): preload moves the starting point on the passive curve, contractility rotates the end-systolic line about $V_0$, and afterload changes where on the line the ejection ends because the ventricle must push the arterial pressure up to that value. Because cardiac output is the stroke volume times the rate, the circulation can adjust it by changing any of the three; real physiology couples them (for example, venous constriction raises preload; sympathetic stimulation raises both rate and contractility).`,
      caption: String.raw`Three sliders: **preload** (venous filling pressure), **afterload** (arterial resistance) and **contractility** ($E_{\mathrm{es}}$). The grey dashed loop is the resting baseline, the coloured one the present beat; the small panel compares the arterial pressure curves. The buttons set the textbook cases (volume loading, hypertension, a positive inotrope, a failing heart). Change just one slider at a time and see which corner of the loop moves.`,
      scope: String.raw`Resistance stands in for afterload and filling pressure for preload because those are the quantities that can be set directly in the model; in a patient, afterload is the wall stress and preload the end-diastolic wall stress, and the three interact (for example, stroke volume depends on the ratio of arterial to ventricular elastance). Illustrative values only.`,
      deps: ['physio-3.4'],
      see: ['physio-3.3', 'physio-3.6', 'physio-3.8'],
      refs: ['Guyton–Hall'],
      tags: ['preload', 'afterload', 'contractility'],
      viz(v) {
        const pre = v.slider('preload (filling pressure)', 3, 18, HEART.Pv, { step: 0.5, fmt: (x) => `${v.fix(x, 1)} mmHg` });
        const aft = v.slider('afterload (arterial resistance)', 0.7, 2.2, HEART.R, { step: 0.05, fmt: (x) => `${v.fix(x, 2)} mmHg·s/mL` });
        const ino = v.slider('contractility $E_{\\mathrm{es}}$', 0.8, 5, HEART.Ees, { step: 0.1, fmt: (x) => `${v.fix(x, 1)} mmHg/mL` });
        const set = (a, b, c) => { pre.set(a); aft.set(b); ino.set(c); };
        v.button('resting', () => set(HEART.Pv, HEART.R, HEART.Ees));
        v.button('volume loading', () => set(16, HEART.R, HEART.Ees));
        v.button('hypertension', () => set(HEART.Pv, 2.1, HEART.Ees));
        v.button('positive inotrope', () => set(HEART.Pv, HEART.R, 4.5));
        v.button('failing ventricle', () => set(14, 1.6, 1.0));
        const sL = v.stage({ x: [30, 160], y: [0, 180], height: 340, axes: 'box', gutter: true, xlabel: 'ventricular volume (mL)', ylabel: 'ventricular pressure (mmHg)', weight: 1.4 });
        const sT = v.stage({ x: [0, 0.8], y: [40, 180], height: 340, axes: 'box', gutter: true, xlabel: 't (s)', ylabel: 'aortic pressure (mmHg)', weight: 0.9, minWidth: 240 });
        let R = null, B = null;
        v.render(() => {
          R = heartBeat({ Pv: pre.value, R: aft.value, Ees: ino.value }); B = heartBeat({});
          sL.path(B.loop, { color: 'muted', dash: [5, 4], width: 1.6, close: true });
          sL.fn((V) => ino.value * (V - HEART.V0), { color: 'orange', dash: [6, 4], width: 1.2, domain: [HEART.V0, 160] });
          drawLoop(sL, R);
          sL.dot(R.EDV, R.EDP, { r: 5, color: 'ink' }); sL.dot(R.ESV, R.Pes, { r: 5, color: 'ink' });
          sT.setView([0, Math.max(B.T, R.T)], undefined);
          trace(sT, B.t, B.Pa, { color: 'muted', width: 1.6, dash: [5, 4] });
          trace(sT, R.t, R.Pa, { color: 'red', width: 2.6 });
        });
        v.legend([['muted', 'resting baseline', { dash: true }], ['accent', 'filling'], ['red', 'ejection (and aortic pressure)'], ['orange', 'end-systolic line', { dash: true }]]);
        const d = (x, y, u = '') => `${v.fix(x, 0)}${u} (${y >= 0 ? '+' : '−'}${v.fix(Math.abs(y), 0)})`;
        v.readout(() => `$V_{\\mathrm{ED}}$ ${d(R.EDV, R.EDV - B.EDV)} mL · $V_{\\mathrm{ES}}$ ${d(R.ESV, R.ESV - B.ESV)} mL · $SV$ ${d(R.SV, R.SV - B.SV)} mL · $EF$ ${v.fix(100 * R.EF, 0)}% (rest ${v.fix(100 * B.EF, 0)}%) · peak $P$ ${d(R.Pmax, R.Pmax - B.Pmax)} mmHg · $CO$ ${v.fix(R.CO, 1)} L/min (rest ${v.fix(B.CO, 1)})\nchanges from the resting beat in brackets`);
      },
    },

    // ------------------------------------------------------------------ 3.6
    {
      num: '3.6',
      kind: 'Definition',
      name: 'Stroke volume, ejection fraction and cardiac output',
      statement: String.raw`The **stroke volume** is the blood ejected by the ventricle in one beat, $SV = V_{\mathrm{ED}} - V_{\mathrm{ES}}$, the difference of the end-diastolic and end-systolic volumes. The **ejection fraction** is the fraction of the filled volume that is ejected, $EF = SV/V_{\mathrm{ED}}$. The **cardiac output** is the volume ejected per minute, $CO = SV \times HR$, and in the steady state equals the output of the other ventricle and the venous return. For mL and beats/min, divide $SV\times HR$ by 1000 to express output in L/min. The **2015 ASE/EACVI document** reports biplane 2-D echocardiographic reference ranges of 52–72% for men and 54–74% for women (Table 2, mean ± two standard deviations; Table 4). These method-specific reference values do not define the model parameters or diagnose an individual.`,
      idea: String.raw`These three numbers are read straight from the pressure–volume loop (physio-3.2): the loop's width is $SV$, its right edge is $V_{\mathrm{ED}}$, and multiplying by the heart rate turns a per-beat quantity into a flow. $EF$ is a ratio, so it can look normal while the heart is small and the output low, and it can fall as a dilated heart ejects the same $SV$ out of a larger $V_{\mathrm{ED}}$. A numerical example makes the distinction: 60 mL ejected from 100 mL and from 150 mL gives the same stroke volume but ejection fractions of 60% and 40%. At the same heart rate these give equal cardiac output. Filling, loading and rate can all change the model’s stroke volume.`,
      caption: String.raw`Choose a **model preset** and change its heart rate. The left panel shows the computed pressure–volume loop; its width is the stroke volume. On the right, rectangle area is $SV\times HR$ in mL/min, divided by 1000 in the output label. The dashed rectangle is the baseline model at 75 beats/min. The large-stroke-volume preset uses a slower default rate, while the dilated weak preset ejects a smaller fraction of its filled volume. At its default rate, the small stiff preset has an EF close to the baseline despite a smaller output; changing the rate can change both. Compare the actual numbers in the readout.`,
      scope: String.raw`The four presets are chosen parameters of the chapter's lumped left-heart model, not patient data or measured athlete/disease populations. The source's 2015 reference ranges are specifically for biplane 2-D echocardiography and are presented as historical method-specific context. The simulation uses a finite warm-up; the readout reports its residual ventricular-volume drift over the displayed cycle. The pressure readout uses numerical time averaging, not a systolic/diastolic shortcut.`,
      deps: ['physio-3.2'],
      see: ['physio-3.5', 'physio-4.1'],
      refs: ['Lang et al. (2015), ASE/EACVI chamber quantification, JASE 28:1–39; §§1.3, 2.2 and 2.4, pp. 6–7; Tables 2 (p. 7) and 4 (p. 10); DOI 10.1016/j.echo.2014.10.003'],
      tags: ['cardiac output', 'ejection fraction'],
      verify: false,
      links: { source: 'https://www.asecho.org/wp-content/uploads/2016/02/2015_ChamberQuantificationREV.pdf#page=7', doi: 'https://doi.org/10.1016/j.echo.2014.10.003' },
      viz(v) {
        const P = OUTPUT_PRESETS;
        const hr = v.slider('heart rate', 40, 130, 75, { step: 1, fmt: (x) => `${fmt0(x)} /min` });
        const type = v.select('heart', [{ value: 'healthy', label: 'baseline' }, { value: 'failing', label: 'dilated, weak' }, { value: 'athlete', label: 'large stroke volume' }, { value: 'stiff', label: 'small, stiff' }], 'healthy', { onChange: (k) => hr.set(P[k.value ?? k].hr) });
        const sL = v.stage({ x: [20, 230], y: [0, 160], height: 330, axes: 'box', gutter: true, xlabel: 'ventricular volume (mL)', ylabel: 'ventricular pressure (mmHg)', weight: 1.2 });
        const sA = v.stage({ x: [0, 140], y: [0, 130], height: 330, axes: 'box', gutter: true, xlabel: 'heart rate (beats/min)', ylabel: 'stroke volume (mL)', weight: 1 });
        let R = null, B = null;
        v.render(() => {
          const { hr: _h, ...pp } = P[type.value]; R = heartBeat({ ...pp, HR: hr.value }); B = heartBeat({});
          const pressureTop = Math.max(R.Pmax, B.Pmax) * 1.3;
          sL.setView([Math.min(R.ESV, B.ESV) - 15, Math.max(R.EDV, B.EDV) + 35], [-5, pressureTop]);
          sA.setView([0, 140], [0, Math.max(R.SV, B.SV) * 1.2]);
          sL.path(B.loop, { color: 'muted', dash: [5, 4], width: 1.4, close: true });
          drawLoop(sL, R);
          sL.vline(R.EDV, { color: 'faint', dash: [3, 4], width: 1 }); sL.vline(R.ESV, { color: 'faint', dash: [3, 4], width: 1 });
          sL.measure(R.ESV, pressureTop * .94, R.EDV, pressureTop * .94, `SV = ${v.fix(R.SV, 0)} mL`);
          sL.text(`$V_{ES}$ = ${v.fix(R.ESV, 0)}`, R.ESV, pressureTop * .82, { size: 11, color: 'muted', align: 'left', dx: 4 });
          sL.text(`$V_{ED}$ = ${v.fix(R.EDV, 0)}`, R.EDV, pressureTop * .82, { size: 11, color: 'muted', align: 'left', dx: 4 });
          const bs = B.SV, b75 = 75;
          sA.rect(0, 0, b75, bs, { fill: 'muted', fillAlpha: 0.1, stroke: true, color: 'muted', dash: [5, 4] });
          sA.rect(0, 0, hr.value, R.SV, { fill: 'accent', fillAlpha: 0.25, color: 'accent', width: 2 });
          sA.text(`CO = ${v.fix(hr.value * R.SV / 1000, 1)} L/min`, hr.value / 2, R.SV / 2, { size: 14, color: 'ink', align: 'center', baseline: 'middle', weight: 700 });
        });
        v.legend([['accent', 'this heart: area = cardiac output'], ['muted', 'baseline model (75/min)', { dash: true }]]);
        v.readout(() => {
          const co = (hr.value * R.SV) / 1000;
          return `$SV = ${v.fix(R.EDV, 1)} - ${v.fix(R.ESV, 1)} = ${v.fix(R.SV, 1)}$ mL · $EF = ${v.fix(R.SV, 1)}/${v.fix(R.EDV, 1)} = ${v.fix(100 * R.EF, 1)}\\%$ · $CO = ${v.fix(R.SV, 1)} \\times ${fmt0(hr.value)}/1000 = ${v.fix(co, 2)}$ L/min\nmean arterial pressure ${v.fix(integrateSamples(R.t, R.Pa) / R.t.at(-1), 1)} mmHg; residual cycle volume drift ${v.fix(R.drift, 3)} mL`;
        });
      },
    },
  ],
};
