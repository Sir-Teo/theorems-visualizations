// Human Physiology — Chapter 3: The heart as a pump (part b: 3.7–3.11)
import { clamp, trace, heartBeat, beatAt, beatIdx, phases, drawLoop, HEART, MMHG_ML_TO_J, gauss, makeSheet, cableProps } from './ch03.shared.js';

import { wall, hvec, LEADS, leadAxis, proj } from './cardiac-observables.shared.js';

// ---------- helpers for this file ----------
const fmt0 = (x) => String(Math.round(x));
const KPA = 0.133322; // 1 mmHg in kPa

const range = (a, b) => { const o = []; for (let i = a; i <= b; i++) o.push(i); return o; };
function ejectionIdx(R) { return range(R.ev.iAVO, R.ev.iAVC); }
function fillingIdx(R) { const n = R.t.length - 1; return [...range(R.ev.iMVO, n), ...range(0, R.ev.iMVC)]; }

// Stroke work against afterload for the normal and the weak ventricle (computed once, 14 beats each).
const RSWEEP = Array.from({ length: 14 }, (_, k) => 0.5 + 0.2 * k);
const wsweep = {};
function workSweep(Ees) { return (wsweep[Ees] ??= RSWEEP.map((R) => { const B = heartBeat({ R, Ees }); return { R, SV: B.SV, SW: B.work * MMHG_ML_TO_J, Pmax: B.Pmax }; })); }


export default {
  collection: 'physio',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.7
    {
      num: '3.7',
      kind: 'Concept',
      name: 'Stroke work: the area of the PV loop',
      statement: String.raw`The work done by the ventricle on the blood in one beat, the **stroke work**, is the area enclosed by its pressure–volume loop: $SW = -\oint P\,dV$ for the counter-clockwise loop with ventricular volume on the horizontal axis. It is the work done during ejection, $-\int_{\rm ejection} P\,dV>0$ over the decreasing-volume segment, minus the small work returned during filling. The units are mmHg·mL (1 mmHg·mL $=1.333\times10^{-4}$ J), and multiplying by the heart rate in beats per second gives the power. Because the work is the area, not the width, it depends on both stroke volume and the pressure against which it is ejected: roughly $SW \approx SV \times (\text{mean ejection pressure} - \text{filling pressure})$. Raising the arterial load makes the loop taller and narrower, so the stroke work can rise even while the stroke volume falls.`,
      idea: String.raw`The pressure–volume loop (physio-3.2) plots the pressure the muscle exerts against the volume it displaces, and force times displacement is work, so work delivered to blood is $-P\,dV$: the negative closed-loop integral is the net work per beat; the ejection segment is positive work done on the blood and the filling segment is a small amount of work done by the inflowing blood on the ventricle. Evaluating the area numerically (the trapezoid rule along the sampled loop) needs no assumption about the shape of the loop. Stroke work rises with afterload at first because the extra pressure outweighs the lost volume, and it can level off or decline when the stroke volume has fallen far enough.`,
      caption: String.raw`The **left** panel shades the loop (switch the toggle to see the same area as the ejection region minus the filling region, each integrated separately). The **right** panels sweep the arterial resistance from 0.5 to 3.1 mmHg·s/mL for the chosen ventricle and mark the present beat: stroke volume falls steadily, while stroke work rises and then flattens or, for the weak ventricle, declines. Drag the **afterload** and watch the area grow while the width shrinks. Choose the **weak** ventricle (low contractility) and both curves drop: it ejects less volume and does less work at every load.`,
      scope: String.raw`Computed for the chapter's model ventricle at fixed filling pressure, heart rate and contractility. The work done on the blood (external work) is what the loop encloses; the oxygen the muscle uses also depends on the pressure it develops during isovolumic contraction, which the loop area does not capture.`,
      deps: ['physio-3.2', 'thermo-1.9'],
      see: ['physio-3.5', 'physio-3.8'],
      refs: ['Guyton–Hall', 'Klabunde, Cardiovascular Physiology Concepts: Ventricular Pressure–Volume Relationship (revised 2023), https://cvphysiology.com/cardiac-function/cf024'],
      tags: ['stroke work', 'heart'],
      viz(v) {
        const aft = v.slider('afterload (arterial resistance)', 0.5, 3.1, 1.25, { step: 0.05, fmt: (x) => `${v.fix(x, 2)} mmHg·s/mL` });
        const vent = v.select('ventricle', [{ value: 2.8, label: 'normal' }, { value: 1.5, label: 'weak' }], 2.8);
        const split = v.toggle('ejection minus filling', false);
        const sL = v.stage({ x: [30, 160], y: [0, 190], height: 330, axes: 'box', gutter: true, xlabel: 'ventricular volume (mL)', ylabel: 'ventricular pressure (mmHg)', weight: 1.4 });
        const sW = v.stage({ x: [0.4, 3.2], y: [0, 1.3], height: 330, axes: 'box', gutter: true, xlabel: 'arterial resistance', ylabel: 'stroke work (J)', weight: 0.8, minWidth: 220 });
        const sS = v.stage({ x: [0.4, 3.2], y: [0, 90], height: 330, axes: 'box', gutter: true, xlabel: 'arterial resistance', ylabel: 'stroke volume (mL)', weight: 0.8, minWidth: 220 });
        let R = null, parts = null;
        v.render(() => {
          const Ees = +vent.value;
          R = heartBeat({ R: aft.value, Ees });
          const ej = ejectionIdx(R), fl = fillingIdx(R);
          parts = { ej: R.ejectionWork, fl: R.fillingWork };
          if (split.value) {
            sL.poly([...ej.map((i) => [R.V[i], R.P[i]]), [R.V[ej[ej.length - 1]], 0], [R.V[ej[0]], 0]], { fill: 'red', fillAlpha: 0.25, stroke: false });
            sL.poly([...fl.map((i) => [R.V[i], R.P[i]]), [R.V[fl[fl.length - 1]], 0], [R.V[fl[0]], 0]], { fill: 'accent', fillAlpha: 0.55, stroke: false });
            sL.text('ejection: −∫P dV', (R.ESV + R.EDV) / 2, 0.5 * Math.max(R.Pes, 20) + 12, { size: 12, color: 'red', align: 'center', weight: 700 });
          } else sL.poly(R.loop, { fill: 'accent', fillAlpha: 0.25, stroke: false });
          drawLoop(sL, R);
          if (!split.value) sL.text(`SW = ${v.fix(R.work * MMHG_ML_TO_J, 2)} J`, (R.ESV + R.EDV) / 2, R.Pes * 0.45, { size: 15, color: 'ink', align: 'center', weight: 700 });
          sL.measure(R.ESV, 180, R.EDV, 180, `SV = ${v.fix(R.SV, 0)} mL`);
          const sw = workSweep(Ees);
          sW.path(sw.map((p) => [p.R, p.SW]), { color: 'purple', width: 2.4 }); sW.dot(aft.value, R.work * MMHG_ML_TO_J, { r: 7, color: 'gold' });
          sS.path(sw.map((p) => [p.R, p.SV]), { color: 'green', width: 2.4 }); sS.dot(aft.value, R.SV, { r: 7, color: 'gold' });
        });
        v.legend([['accent', 'filling'], ['red', 'ejection'], ['purple', 'stroke work'], ['green', 'stroke volume'], ['gold', 'this beat']]);
        v.readout(() => {
          const map = R.Pa.reduce((a, b) => a + b, 0) / R.Pa.length, rect = R.SV * (map - R.EDP);
          return `loop area (trapezoid rule) **${v.fix(R.work, 0)}** mmHg·mL $= ${v.fix(R.work * MMHG_ML_TO_J, 2)}$ J · ejection ${v.fix(parts.ej, 0)} − filling ${v.fix(parts.fl, 0)} = ${v.fix(parts.ej - parts.fl, 0)} mmHg·mL\n$SV \\times (\\text{mean arterial pressure} - P_{\\mathrm{ED}}) = ${v.fix(rect, 0)}$ mmHg·mL (an estimate within ${v.fix(100 * Math.abs(rect / R.work - 1), 0)}% of the area) · power at ${fmt0(R.HR)}/min: ${v.fix(R.work * MMHG_ML_TO_J * R.HR / 60, 2)} W`;
        });
      },
    },

    // ------------------------------------------------------------------ 3.8
    {
      num: '3.8',
      kind: 'Law',
      name: 'Law of Laplace for the ventricular wall',
      statement: String.raw`For a thin-walled hollow sphere of cavity radius $r$ and wall thickness $h \ll r$, held open by an internal pressure $P$, the tension per unit length across the wall gives a **wall stress**
$$\sigma = \frac{P\,r}{2h}.$$
(A thin cylinder has $\sigma = Pr/h$ along the circumference.) Applied to the left ventricle as an approximation, it says that the stress each muscle fibre has to bear grows with the pressure and with the cavity radius, and falls with the thickness of the wall. Hence a dilated ventricle (large $r$) must develop more stress for the same pressure, and a ventricle facing a raised pressure can restore its stress to normal by thickening its wall (concentric hypertrophy) in proportion to $P$.`,
      idea: String.raw`Cut the sphere in half: the pressure on the flat cross-section, $P\pi r^2$, is balanced by the wall tension acting around the rim of length $2\pi r$ and thickness $h$, giving $P\pi r^2 = \sigma\,2\pi r h$. This is the Young–Laplace pressure–curvature relation (fluid-2.7) for a thin membrane. The model beat of the chapter (physio-3.5) supplies $P(t)$ and the cavity volume $V(t)$; the wall is taken to have a fixed muscle volume, so as the cavity empties the wall must thicken, and the thickness follows from geometry, not from a fitted number. That is why the stress curve is not just the pressure curve rescaled.`,
      caption: String.raw`The cursor runs through the beat and the cross-section shows the cavity and the wall at that moment (outlines of the normal heart at the same instant are dashed). The right panel plots the wall stress $\sigma(t)$ for the present ventricle, the pressure in kPa, and the normal baseline. Use the buttons: raising the **afterload** raises the pressure and the stress; adding **wall muscle** (hypertrophy) brings the stress back down; a **dilated** ventricle has a larger radius and so a larger stress at the same pressure.`,
      scope: String.raw`A thin-wall, spherical, uniform-wall approximation (the actual ventricle is ellipsoidal and its wall has a stress gradient from the inner to the outer layer, so true fibre stresses differ by a geometry factor and with the formula used), with the cavity radius in the formula and a wall of fixed muscle volume. Numbers are illustrative; the laws of proportion are the point.`,
      deps: ['physio-3.5', 'fluid-2.7'],
      see: ['physio-3.7'],
      refs: ['Guyton–Hall'],
      tags: ['wall stress', 'hypertrophy'],
      credit: 'Pierre-Simon Laplace and Thomas Young, 1805–06 (pressure–curvature relation); its use for the ventricular wall is a standard physiological approximation',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Young%E2%80%93Laplace_equation' },
      verify: true,
      viz(v) {
        const aft = v.slider('afterload (arterial resistance)', 0.7, 2.4, HEART.R, { step: 0.05, fmt: (x) => `${v.fix(x, 2)} mmHg·s/mL` });
        const mass = v.slider('wall muscle volume', 80, 320, 150, { step: 5, fmt: (x) => `${fmt0(x)} mL` });
        const dil = v.slider('dilation (unstressed volume $V_0$)', 10, 60, HEART.V0, { step: 1, fmt: (x) => `${fmt0(x)} mL` });
        const ino = v.slider('contractility $E_{\\mathrm{es}}$', 1, 4, HEART.Ees, { step: 0.1, fmt: (x) => `${v.fix(x, 1)} mmHg/mL` });
        const set = (a, m, d, e) => { aft.set(a); mass.set(m); dil.set(d); ino.set(e); };
        v.button('normal', () => set(HEART.R, 150, HEART.V0, HEART.Ees));
        v.button('hypertension', () => set(2.1, 150, HEART.V0, HEART.Ees));
        v.button('+ hypertrophy', () => set(2.1, 240, HEART.V0, HEART.Ees));
        v.button('dilated, weak', () => set(HEART.R, 150, 45, 1.2));
        const sC = v.stage({ x: [-6, 6], y: [-5.2, 5.2], equal: true, axes: false, height: 340, weight: 0.9, minWidth: 260, title: 'cross-section at the cursor' });
        const sT = v.stage({ x: [0, 0.8], y: [0, 45], height: 340, axes: 'box', gutter: true, xlabel: 't (s)', ylabel: 'kPa', weight: 1.2 });
        const geo = (R, Vw) => R.V.map((V, i) => { const w = wall(V, Vw), P = R.P[i] * KPA; return { ...w, P, s: (P * w.ri) / (2 * w.h) }; });
        let R = null, B = null, G = null, GB = null, tc = 0;
        const circ = (r) => Array.from({ length: 61 }, (_, k) => [r * Math.cos((2 * Math.PI * k) / 60), r * Math.sin((2 * Math.PI * k) / 60)]);
        v.animate((t) => {
          R = heartBeat({ R: aft.value, Ees: ino.value, V0: dil.value }); B = heartBeat({});
          G = geo(R, mass.value); GB = geo(B, 150); tc = ((t / 4) % 1) * R.T;
          const i = beatIdx(R, tc), g = G[i], iB = beatIdx(B, tc), gb = GB[iB];
          sC.rings([circ(g.ro), circ(g.ri)], { evenodd: true, fill: 'red', fillAlpha: 0.35, color: 'red', width: 2 });
          sC.path(circ(gb.ro), { color: 'muted', dash: [4, 4], width: 1.2 }); sC.path(circ(gb.ri), { color: 'muted', dash: [4, 4], width: 1.2 });
          for (let k = 0; k < 8; k++) { const a = (k * Math.PI) / 4 + 0.2, L = 0.25 + g.P * 0.1; sC.arrow(0.5 * g.ri * Math.cos(a), 0.5 * g.ri * Math.sin(a), g.ri * 0.9 * Math.cos(a) * Math.min(1, 0.35 + g.P / 20), g.ri * 0.85 * Math.sin(a) * Math.min(1, 0.35 + g.P / 20), { color: 'accent', width: 1 + g.P / 8, head: 8 }); }
          sC.text(`P = ${v.fix(R.P[i], 0)} mmHg`, 0, 0, { size: 13, color: 'accent', align: 'center', baseline: 'middle', weight: 700 });
          sC.measure(0, -g.ri, 0, -g.ro, '');
          sC.text(`r = ${v.fix(g.ri, 1)} cm`, -g.ri * 0.74, g.ri * 0.74, { size: 11, color: 'ink', align: 'right', baseline: 'bottom' });
          sC.text(`h = ${v.fix(g.h * 10, 1)} mm`, 0.25, -(g.ri + g.ro) / 2, { size: 11, color: 'ink', align: 'left', baseline: 'middle' });
          sT.setView([0, Math.max(R.T, B.T)], [0, 1.15 * Math.max(45, ...G.map(q => q.s), ...GB.map(q => q.s), ...G.map(q => q.P))]);
          sT.vband(R.tAVO, R.tAVC, { color: 'red', alpha: 0.08, edges: false });
          trace(sT, B.t, GB.map((q) => q.s), { color: 'muted', width: 1.6, dash: [5, 4] });
          trace(sT, R.t, G.map((q) => q.P), { color: 'teal', width: 1.8 });
          trace(sT, R.t, G.map((q) => q.s), { color: 'accent', width: 2.8 });
          sT.vline(tc, { color: 'gold', width: 1.6 }); sT.dot(tc, g.s, { r: 6, color: 'gold' });
        }, { period: 4, still: 1.4 });
        v.legend([['accent', 'wall stress $\\sigma = Pr/2h$'], ['teal', 'pressure $P$ (kPa)'], ['muted', 'normal heart: stress', { dash: true }], ['red', 'wall (constant muscle volume)']]);
        v.readout(() => {
          if (!G) return '';
          const i = beatIdx(R, tc), g = G[i], pk = Math.max(...G.map((q) => q.s)), pkB = Math.max(...GB.map((q) => q.s));
          return `now: $\\sigma = P r/(2h) = ${v.fix(g.P, 1)} \\times ${v.fix(g.ri, 2)} / (2 \\times ${v.fix(g.h, 2)}) = ${v.fix(g.s, 1)}$ kPa · peak stress **${v.fix(pk, 0)} kPa** (normal heart ${v.fix(pkB, 0)} kPa, ${pk >= pkB ? '+' : '−'}${v.fix(100 * Math.abs(pk / pkB - 1), 0)}%) · end-diastolic wall ${v.fix(wall(R.EDV, mass.value).h * 10, 1)} mm, end-systolic ${v.fix(wall(R.ESV, mass.value).h * 10, 1)} mm · current $h/r=${v.fix(g.h/g.ri, 2)}$${g.h/g.ri > .1 ? ' — wall is not thin: stress is an illustrative extrapolation' : ''}`;
        });
      },
    },

    // ------------------------------------------------------------------ 3.9
    {
      num: '3.9',
      kind: 'Concept',
      name: 'The ECG as a rotating cardiac dipole (Einthoven’s triangle)',
      statement: String.raw`In the equivalent-dipole approximation, the electrical activity of the heart as seen from the body surface is represented by a single current dipole whose moment, the **heart vector** $\mathbf{H}(t)$, changes in size and direction through the beat. Far from a dipole the potential is $\phi \propto \mathbf p\cdot\hat{\mathbf r}/r^2$, so an electrode records the component of $\mathbf H$ along the line from the heart to it. A **limb lead** is the potential difference between two limb electrodes; in the idealized equilateral geometry, with the right arm (RA), left arm (LA) and left leg (LL) at the corners of **Einthoven's triangle** in the frontal plane, lead I (RA→LA) lies along $0^\circ$, lead II (RA→LL) along $60^\circ$ and lead III (LA→LL) along $120^\circ$, and each lead records the projection of $\mathbf H$ on its axis. As differences of three potentials, the leads satisfy **Einthoven's law**, $\mathrm{I} + \mathrm{III} = \mathrm{II}$. In a normal heart the mean QRS vector points down and to the left, an electrical axis between about $-30^\circ$ and $+90^\circ$ (some sources say $+105^\circ$).`,
      idea: String.raw`Depolarization spreads through the ventricles as a wavefront; a wavefront of depolarized tissue is a sheet of dipoles, whose sum is one resultant vector (the dipole of em-2.14, summed). As the wave sweeps from septum to the apex and then to the base, that vector grows, rotates and shrinks, tracing a loop; repolarization traces a slower, smaller loop (the T wave). Projecting the moving arrow on three fixed axes gives three scalar traces at once: the ECG leads. The triangle is a model of the body as a homogeneous conductor in which the three limb electrodes are equidistant from a point-like heart, which is why the triangle is drawn as equilateral and the three projections are consistent with each other.`,
      caption: String.raw`The red arrow is the heart vector in the frontal plane, in slow motion; its tip leaves a trail (P, QRS and T loops). The coloured bars on the triangle's sides are the projections of the arrow on lead axes I, II and III; the traces on the right are those projections over time (the P, QRS and T waves) and the cursor shows the same instant. **Rotate** the heart's electrical axis until the mean QRS axis in the readout reaches about $-60^\circ$ (left-axis deviation) and the lead II complex turns negative; at about $+110^\circ$ (right-axis deviation) it is lead I that turns negative. Check Einthoven's law in the readout at any instant.`,
      scope: String.raw`A schematic frontal-plane model: the vector loop is built from five Gaussian waves of chosen directions and sizes (it is not a recording or a bidomain simulation), the torso is taken as a homogeneous volume conductor, and only the frontal plane is shown. The normal axis range is conventional (about $-30^\circ$ to $+90^\circ$, sometimes up to $+105^\circ$). Not for interpreting a real ECG.`,
      deps: ['physio-2.9', 'em-2.14'],
      see: ['physio-3.1'],
      refs: ['Einthoven, Nobel Lecture (11 December 1925), pp. 102–105: limb-lead identity and resultant potentials; clinical axis limits and early dates require separate sources'],
      tags: ['ECG', 'dipole'],
      credit: 'Willem Einthoven (string galvanometer, c. 1901–03; the triangle scheme, c. 1912; Nobel Prize 1924); the dates are from secondary sources and some accounts differ',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Einthoven%27s_triangle' },
      verify: true,
      viz(v) {
        const rot = v.slider('rotate the heart’s electrical axis', -120, 90, 0, { step: 1, fmt: (x) => `${x > 0 ? '+' : x < 0 ? '−' : ''}${fmt0(Math.abs(x))}°` });
        const sT = v.stage({ x: [-1.7, 1.7], y: [-1.75, 1.2], equal: true, axes: false, height: 360, weight: 1, minWidth: 280, title: 'frontal plane' });
        const sL = v.stage({ x: [0, 0.8], y: [-3.9, 3.9], height: 360, axes: 'box', gutter: { l: 44, r: 10, t: 16, b: 34 }, xlabel: 't (s)', ylabel: 'leads', yticks: [], weight: 1.2, minWidth: 300 });
        const RA = [-1.15, 0.7], LA = [1.15, 0.7], LL = [0, 0.7 - 1.15 * Math.sqrt(3)], C = [0, -0.1], SC = 0.95;
        const tip = (t) => { const H = hvec(t, rot.value); return [C[0] + SC * H[0], C[1] + SC * H[1]]; };
        let tc = 0, info = null;
        v.animate((t) => {
          tc = ((t / 4) % 1) * 0.8;
          const ts = Array.from({ length: 161 }, (_, k) => (k * 0.8) / 160);
          const sides = [[RA, LA, 0], [RA, LL, 1], [LA, LL, 2]];
          sides.forEach(([a, b, k]) => sT.line(a[0], a[1], b[0], b[1], { color: LEADS[k].color, width: 2.4 }));
          sT.dot(RA[0], RA[1], { r: 5, color: 'ink' }); sT.dot(LA[0], LA[1], { r: 5, color: 'ink' }); sT.dot(LL[0], LL[1], { r: 5, color: 'ink' });
          sT.text('RA', RA[0] - 0.08, RA[1] + 0.06, { size: 13, color: 'ink', align: 'right', baseline: 'bottom', weight: 700 });
          sT.text('LA', LA[0] + 0.08, LA[1] + 0.06, { size: 13, color: 'ink', align: 'left', baseline: 'bottom', weight: 700 });
          sT.text('LL', LL[0] + 0.1, LL[1] - 0.04, { size: 13, color: 'ink', align: 'left', baseline: 'top', weight: 700 });
          // trails of the P, QRS and T loops
          const loop = (names) => ts.map((x) => { const H = hvec(x, rot.value, names); return [C[0] + SC * H[0], C[1] + SC * H[1]]; });
          sT.path(loop(['P']), { color: 'green', width: 1.4, alpha: 0.7 }); sT.path(loop(['Q', 'R', 'S']), { color: 'red', width: 1.4, alpha: 0.5 }); sT.path(loop(['T']), { color: 'purple', width: 1.4, alpha: 0.7 });
          // lead bars at the midpoints of the sides
          const H = hvec(tc, rot.value), vals = LEADS.map((L) => proj(H, L.ang));
          sides.forEach(([a, b, k]) => {
            const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], u = leadAxis(LEADS[k].ang), L = vals[k] * 0.85;
            const nrm = [-u[1], u[0]], off = [nrm[0] * (k === 0 ? 0.12 : k === 1 ? -0.12 : -0.12), nrm[1] * (k === 0 ? 0.12 : k === 1 ? -0.12 : -0.12)];
            sT.arrow(m[0] + off[0], m[1] + off[1], m[0] + off[0] + u[0] * L, m[1] + off[1] + u[1] * L, { color: LEADS[k].color, width: 4, head: 8 });
            sT.text(['I', 'II', 'III'][k], m[0] + off[0] * 2.7, m[1] + off[1] * 2.7, { size: 12, color: LEADS[k].color, align: 'center', baseline: 'middle', weight: 700 });
          });
          // heart vector and its projection guides
          const tp = tip(tc);
          sT.arrow(C[0], C[1], tp[0], tp[1], { color: 'red', width: 3.4, head: 11 });
          sT.dot(C[0], C[1], { r: 4, color: 'ink' });
          // lead traces, offset vertically
          const OFF = [2.6, 0, -2.6];
          LEADS.forEach((L, k) => {
            sL.hline(OFF[k], { color: 'faint', width: 1 });
            trace(sL, ts, ts.map((x) => OFF[k] + proj(hvec(x, rot.value), L.ang)), { color: L.color, width: 2.2 });
            sL.text(`lead ${L.n}`, 0.79, OFF[k] + 0.95, { size: 12, color: L.color, align: 'right', weight: 700 });
            sL.dot(tc, OFF[k] + vals[k], { r: 5, color: 'gold' });
          });
          sL.vline(tc, { color: 'gold', width: 1.6 });
          // QRS mean axis (area of the QRS loop)
          let sx = 0, sy = 0; for (let x = 0.055; x < 0.13; x += 0.001) { const h = hvec(x, rot.value, ['Q', 'R', 'S']); sx += h[0]; sy += h[1]; }
          info = { vals, axis: (Math.atan2(-sy, sx) * 180) / Math.PI };
        }, { period: 4, still: 0.44 });
        v.legend([['red', 'heart vector (QRS loop red, P green, T purple)'], ['accent', 'lead I'], ['green', 'lead II'], ['orange', 'lead III'], ['gold', 'cursor']]);
        v.readout(() => {
          if (!info) return '';
          const [a, b, c] = info.vals, ax = info.axis;
          const kind = ax > 90 ? 'right-axis deviation' : ax < -30 ? 'left-axis deviation' : 'within the conventional normal range';
          return `at the cursor: I = ${v.fix(a, 2)}, II = ${v.fix(b, 2)}, III = ${v.fix(c, 2)} → I + III = ${v.fix(a + c, 2)} = II (Einthoven's law) · mean QRS axis **${v.fix(ax, 0)}°** (${kind})`;
        });
      },
    },

    // ------------------------------------------------------------------ 3.10
    {
      num: '3.10',
      kind: 'Phenomenon',
      name: 'Re-entry, spiral waves and fibrillation',
      statement: String.raw`Cardiac tissue is **excitable**: a stimulated region fires an action potential that spreads as a wave, and then is refractory for roughly the duration of the action potential. A wave normally dies at the boundary of the tissue or where it meets another wave. **Re-entry** occurs when a wave finds a path that lets it return to tissue that has recovered: it then circulates indefinitely and excites the heart at its own, rapid rate. It needs a region of one-way block, and a path long enough that, when the wave returns, the tissue ahead has recovered, that is, a path longer than the **wavelength** $\lambda \approx CV \times (\text{refractory period})$. Re-entry can circulate round an anatomical obstacle (a scar, a vein, a valve ring), or, in homogeneous tissue, as a **spiral wave** whose tip rotates about a core of its own making. Shortening the refractory period shortens the wavelength and makes re-entry easier to start and to sustain; a rapid, disorganised state with many such waves is the substrate of **fibrillation**.`,
      idea: String.raw`The model is the Mitchell–Schaeffer cell of chapter 2 (physio-2.9), a two-variable description of the plateau and refractoriness, coupled to its neighbours by diffusion of voltage on a square sheet: the standard reaction–diffusion equation for an excitable medium, with spiral waves as in mathbio-9.11. A plane wave at the right moment in the recovering wake of a previous wave meets tissue that is still partly refractory on one side only: it propagates where the tissue has recovered and fails where it has not, curling around the end of the block into a spiral (the "cross-field" protocol). Around an obstacle the same logic closes the loop. Conduction velocity and action potential duration used for the wavelength are measured here by simulating the same cell on a one-dimensional cable.`,
      caption: String.raw`Choose a protocol and press **restart**. In the **cross-field** protocol a plane wave sweeps from the left and a second stimulus hits the lower-left quadrant after the **coupling interval**; if it comes too early the tissue is still refractory and nothing happens, if too late it simply sends a second plane wave, and in a window in between (the vulnerable window) it breaks the wave and a spiral forms. In the runs behind this picture (60 ms setting) couplings of 170–240 ms gave a lasting spiral and 130–150 ms and 280 ms did not. In the **obstacle** protocol a wave is started circulating round a hole after one-way block; in my runs it kept circulating for refractory settings of 40 ms or less and died out from 50 ms on, for obstacle radii 14 and 20 alike, so lengthening the action potential makes the wave overtake its own refractory tail. You can also **click** the sheet to stimulate a disk at any time. Red is depolarised tissue, blue is refractory, the grey disk an obstacle; the trace at the bottom is the voltage at the marked cell.`,
      scope: String.raw`A two-dimensional isotropic sheet of about 4 cm × 4 cm of a simplified ventricular cell (Mitchell–Schaeffer, illustrative parameters with a slowed conduction so that spirals fit), no fibre orientation, no heterogeneity, no calcium dynamics. Real fibrillation needs more: a larger heart, restitution and heterogeneity that break one rotor into several. In this small sheet one rotor (cut into several arms by the boundary) is what you will usually see, and that is stated here rather than dressed up as fibrillation.`,
      deps: ['mathbio-9.11', 'physio-2.9'],
      see: ['physio-3.9'],
      refs: ['Keener–Sneyd ch. 12'],
      tags: ['arrhythmia', 'spiral waves', 'excitable media'],
      credit: 'G. R. Mines, 1913 (re-entry round a ring of tissue, "circus movement"); M. A. Allessie, F. I. Bonke and F. J. Schopman, 1977 (the leading-circle concept); C. C. Mitchell and D. G. Schaeffer, 2003 (the cell model)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Reentry_(cardiology)' },
      viz(v) {
        const NG = 100, C0 = 49.5;
        const proto = v.select('protocol', [{ value: 'cross', label: 'cross-field (spiral)' }, { value: 'ring', label: 'around an obstacle' }], 'cross', { onChange: (k) => { const val = k && k.value !== undefined ? k.value : k; apd.set(val === 'ring' ? 40 : 60); } });
        const apd = v.slider('refractory duration $t_{\\mathrm{close}}$', 30, 130, 60, { step: 1, fmt: (x) => `${fmt0(x)} ms` });
        const gap = v.slider('coupling interval', 90, 300, 190, { step: 5, fmt: (x) => `${fmt0(x)} ms` });
        const hole = v.slider('obstacle radius', 8, 24, 14, { step: 1, fmt: (x) => `${fmt0(x)} cells` });
        const rst = v.button('restart', () => { S.reset(); });
        const sS = v.stage({ x: [0, NG], y: [0, NG], equal: true, axes: false, height: 400, weight: 1.2, minWidth: 300 });
        const sV = v.stage({ x: [0, 1500], y: [-0.1, 1.1], height: 400, axes: 'box', gutter: true, xlabel: 't (ms), last 1.5 s', ylabel: 'v at marked cell', weight: 0.7, minWidth: 240 });
        const PROBE = [78, 50], PER = 1500;
        const SPEED = 6; // ms of tissue time per animation step
        let pending = [];
        const mkMask = (kind, r) => { const m = new Uint8Array(NG * NG).fill(1); if (kind === 'ring') for (let j = 0; j < NG; j++) for (let i = 0; i < NG; i++) if (Math.hypot(i - C0, j - C0) <= r) m[j * NG + i] = 0; return m; };
        const init = () => {
          const kind = proto.value, sh = makeSheet(NG, mkMask(kind, hole.value), { tclose: apd.value });
          const st = { sh, kind, hist: [], s2: kind === 'cross' ? gap.value : -1, done: false, key: `${kind}|${apd.value}|${gap.value}|${hole.value}` };
          if (kind === 'cross') sh.stim((i) => i < 4);
          else {
            const rh = hole.value, ang = (i, j) => (Math.atan2(j - C0, i - C0) * 180) / Math.PI;
            sh.refractory((i, j) => { const r = Math.hypot(i - C0, j - C0); return r < rh + 9 && ang(i, j) > -70 && ang(i, j) < 0; });
            sh.stim((i, j) => { const r = Math.hypot(i - C0, j - C0); return r < rh + 9 && ang(i, j) >= 0 && ang(i, j) < 20; });
          }
          return st;
        };
        const S = v.sim(init, (st) => {
          const sh = st.sh;
          if (!st.done && st.s2 >= 0 && sh.t >= st.s2) { sh.stim((i, j) => i < 50 && j < 50); st.done = true; }
          for (const [x, y] of pending) sh.stim((i, j) => Math.hypot(i - x, j - y) < 5);
          pending = [];
          sh.step(Math.round(SPEED / sh.dt));
          st.hist.push([sh.t, sh.v[PROBE[1] * NG + PROBE[0]]]);
          if (st.hist.length > 260) st.hist.shift();
        }, { dt: 1 / 30 });
        let lastKey = `${proto.value}|${apd.value}|${gap.value}|${hole.value}`;
        const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
        sS.onClick((x, y) => { pending.push([x, y]); v.invalidate(); });
        v.animate((t) => {
          hole.el.hidden = proto.value !== 'ring'; gap.el.hidden = proto.value !== 'cross';
          const key = `${proto.value}|${apd.value}|${gap.value}|${hole.value}`;
          if (key !== lastKey) { lastKey = key; S.reset(); v.restart(); }
          S.advance(t);
          const st = S.state, sh = st.sh, base = v.rgb('panel'), blue = v.rgb('blue'), red = v.rgb('red'), grey = v.rgb('faint');
          sS.raster((x, y) => {
            const i = Math.floor(x), j = Math.floor(y); if (i < 0 || j < 0 || i >= NG || j >= NG) return null;
            const c = j * NG + i; if (!sh.mask[c]) return [grey[0], grey[1], grey[2], 1];
            const u = sh.v[c], rf = 1 - sh.h[c];
            const col = mixc(mixc(base, blue, 0.55 * rf), red, Math.min(1, u * 1.15));
            return [col[0], col[1], col[2], 1];
          }, { res: 3, key: `${sh.t}|${key}` });
          sS.dot(PROBE[0] + 0.5, PROBE[1] + 0.5, { r: 4, color: 'ink' });
          sS.text(st.kind === 'cross' ? (st.done ? 'S2 delivered' : `S2 in ${fmt0(Math.max(0, st.s2 - sh.t))} ms`) : 'obstacle', 3, NG - 4, { size: 12, color: 'ink', align: 'left', baseline: 'top', plate: true });
          const h = st.hist, t1 = h.length ? h[h.length - 1][0] : 0; sV.setView([Math.max(0, t1 - PER), Math.max(PER, t1)], undefined);
          sV.path(h.map((p) => [p[0], p[1]]), { color: 'accent', width: 2 });
        }, { period: 40, still: 2.2 });
        v.legend([['red', 'depolarised'], ['blue', 'refractory (still recovering)'], ['faint', 'obstacle']]);
        v.readout(() => {
          const st = S.state; if (!st) return '';
          const sh = st.sh, cp = cableProps(apd.value);
          let act = 0, n = 0; for (let c = 0; c < NG * NG; c++) if (sh.mask[c]) { n++; if (sh.v[c] > 0.5) act++; }
          // wave fronts: connected components of depolarised tissue
          const seen = new Uint8Array(NG * NG); let comps = 0;
          for (let c = 0; c < NG * NG; c++) if (sh.v[c] > 0.5 && !seen[c]) { comps++; const q = [c]; seen[c] = 1; while (q.length) { const a = q.pop(), i = a % NG, j = (a / NG) | 0; for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const x = i + di, y = j + dj; if (x < 0 || y < 0 || x >= NG || y >= NG) continue; const b = y * NG + x; if (!seen[b] && sh.v[b] > 0.5) { seen[b] = 1; q.push(b); } } } }
          const lam = cp.cv * 100 * cp.apd / 1000, L = 2 * Math.PI * (hole.value + 1) * sh.dx;
          const ring = st.kind === 'ring' ? ` · path round the obstacle $L = ${v.fix(L, 1)}$ cm = ${v.fix(L / lam, 1)} wavelengths` : '';
          return `t = ${v.fix(sh.t, 0)} ms · ${v.fix(100 * act / n, 0)}% of the tissue depolarised in ${comps} wavefront piece${comps === 1 ? '' : 's'}${sh.t > 700 && act === 0 ? ' — **all activity has died**' : sh.t > 700 && act > 0 ? ' — still active' : ''}\nconduction velocity ${v.fix(cp.cv, 2)} m/s, action potential duration ${v.fix(cp.apd, 0)} ms → wavelength $\\lambda = CV\\times APD = ${v.fix(lam, 1)}$ cm (cable simulation)${ring}`;
        });
      },
    },

    // ------------------------------------------------------------------ 3.11
    {
      num: '3.11',
      kind: 'Paper',
      name: 'On the Mechanical Factors Determining Ventricular Output',
      paper: { authors: 'S. W. Patterson and E. H. Starling', year: 1914, title: 'On the mechanical factors which determine the output of the ventricles', venue: 'Journal of Physiology 48 (5): 357–379', doi: '10.1113/jphysiol.1914.sp001669' },
      introduces: ['physio-3.3'],
      statement: String.raw`Patterson and Starling studied the dog **heart–lung preparation** with the systemic circulation replaced by an externally controlled circuit. They varied venous inflow by reservoir height in earlier experiments and by a clip on the venous tube in later ones; a separate artificial arterial resistance set the load. Left-ventricular output was measured by collecting blood in a graduated vessel and timing it. Within the preparation's working range, sustained output matched venous inflow, and output per beat depended on diastolic filling. Greater arterial resistance required higher venous pressure for a given inflow and increased residual blood; at excessive distension or failure, output could fall despite rising venous pressure. These limits matter: raising filling pressure does not increase output without bound.`,
      idea: String.raw`The isolated preparation let the authors distinguish inflow, venous pressure and arterial load. Their fixed-inflow result is different from holding venous pressure fixed: when the load rises, more filling pressure may be needed to maintain that inflow and output. The original apparatus (Fig. 1, p. 363), pressure–output curves (Fig. 2, p. 367), experimental tables and conclusions (pp. 378–379) were checked in the complete paper. The picture here is a **modern model reconstruction**, not a digitization of those measurements: it uses the chapter's left-heart model at a fixed rate and treats venous pressure as an independent control. It does not model the original preparation's two-sided failure, changing heart rate or fatigue.`,
      caption: String.raw`The **reservoir height** sets the model's venous filling pressure and **resistance** varies its arterial load. In the original experiments the venous clip controlled inflow; the artificial arterial resistance was controlled pneumatically. Left: model output against filling pressure for three resistances. Right: the corresponding end-diastolic volume; your setting is the gold dot. Raising resistance lowers model output at fixed filling pressure. Increasing filling pressure can restore the baseline model output at a larger diastolic volume; the readout finds this point when it lies in the plotted range. These curves are illustrative, not the original dog's measured values.`,
      scope: String.raw`The complete 1914 paper supports the experimental protocol and the conditioned inflow–output/filling interpretation above. This simulation is a one-sided, fixed-rate teaching model without nervous or hormonal feedback; the actual preparation retained circulating blood, and some reported experiments used adrenaline. Its artificial pressure conditions differ from an intact animal, as the authors emphasize (pp. 361–363, 375–376). Neither the numerical presets nor the model's baseline are presented as measured patient or resting-dog values.`,
      deps: ['physio-3.2'],
      see: ['physio-3.3'],
      refs: ['Patterson and Starling (1914), Journal of Physiology 48:357–379, doi:10.1113/jphysiol.1914.sp001669; complete public scan https://archive.org/details/sim_journal-of-physiology_the-journal-of-physiology_1914_48/page/n364/mode/2up'],
      tags: ['Starling', 'heart–lung preparation'],
      credit: 'S. W. Patterson and E. H. Starling, 1914',
      links: { doi: 'https://doi.org/10.1113/jphysiol.1914.sp001669' },
      viz(v) {
        const hgt = v.slider('venous reservoir height', 3, 32, 14, { step: 0.5, fmt: (x) => `${v.fix(x, 1)} cm H₂O` });
        const rr = v.slider('arterial resistance', 0.7, 2.6, 2.0, { step: 0.05, fmt: (x) => `${v.fix(x, 2)} mmHg·s/mL` });
        const sO = v.stage({ x: [0, 27], y: [0, 9], height: 330, axes: 'box', gutter: true, xlabel: 'venous (filling) pressure (mmHg)', ylabel: 'output (L/min)', weight: 1.1 });
        const sD = v.stage({ x: [0, 27], y: [30, 190], height: 330, axes: 'box', gutter: true, xlabel: 'venous (filling) pressure (mmHg)', ylabel: 'diastolic volume (mL)', weight: 1.1 });
        const RS = [0.8, 1.25, 2.0], PVS = Array.from({ length: 13 }, (_, k) => 2 + 2 * k);
        const curves = {}; const curve = (R) => (curves[R] ??= PVS.map((Pv) => { const B = heartBeat({ Pv, R, HR: 75 }); return { Pv, CO: B.CO, EDV: B.EDV }; }));
        const cols = ['green', 'accent', 'red'];
        let R = null, Pv = 0, base = null, need = null;
        v.render(() => {
          Pv = hgt.value * 0.7356; R = heartBeat({ Pv, R: rr.value, HR: 75 });
          base = heartBeat({ Pv: 14 * 0.7356, R: 1.25, HR: 75 });
          RS.forEach((r, k) => {
            const c = curve(r);
            sO.path(c.map((p) => [p.Pv, p.CO]), { color: cols[k], width: 2, alpha: Math.abs(r - rr.value) < 0.01 ? 1 : 0.65 });
            sD.path(c.map((p) => [p.Pv, p.EDV]), { color: cols[k], width: 2, alpha: Math.abs(r - rr.value) < 0.01 ? 1 : 0.65 });
            sO.text(`R = ${r}`, 24.5, c[c.length - 1].CO + 0.2, { size: 11, color: cols[k], align: 'right', baseline: 'bottom' });
          });
          // the user's own curve
          const mine = PVS.map((p) => { const B = heartBeat({ Pv: p, R: rr.value, HR: 75 }); return { Pv: p, CO: B.CO, EDV: B.EDV }; });
          sO.path(mine.map((p) => [p.Pv, p.CO]), { color: 'ink', width: 1.4, dash: [4, 3] }); sD.path(mine.map((p) => [p.Pv, p.EDV]), { color: 'ink', width: 1.4, dash: [4, 3] });
          sO.hline(base.CO, { color: 'faint', dash: [6, 4], width: 1.2 }); sO.text('resting output', 0.4, base.CO, { size: 11, color: 'muted', align: 'left', baseline: 'bottom', dy: -3 });
          sO.dot(Pv, R.CO, { r: 8, color: 'gold' }); sD.dot(Pv, R.EDV, { r: 8, color: 'gold' });
          // filling pressure at which the output of this resistance returns to the resting value (linear interpolation along the curve)
          need = null;
          for (let k = 1; k < mine.length; k++) if (mine[k - 1].CO < base.CO && mine[k].CO >= base.CO) { const f = (base.CO - mine[k - 1].CO) / (mine[k].CO - mine[k - 1].CO); need = { Pv: mine[k - 1].Pv + f * 2, EDV: mine[k - 1].EDV + f * (mine[k].EDV - mine[k - 1].EDV) }; }
          if (need) { sO.dot(need.Pv, base.CO, { r: 5, color: 'ink' }); sD.dot(need.Pv, need.EDV, { r: 5, color: 'ink' }); }
        });
        v.legend([['green', 'low resistance 0.8'], ['accent', 'resting 1.25'], ['red', 'high 2.0'], ['ink', 'your resistance', { dash: true }], ['gold', 'your setting']]);
        v.readout(() => `venous pressure ${v.fix(Pv, 1)} mmHg → output **${v.fix(R.CO, 2)}** L/min at diastolic volume ${v.fix(R.EDV, 0)} mL (resting: ${v.fix(base.CO, 2)} L/min at ${v.fix(base.EDV, 0)} mL)\n` + (need ? `at resistance ${v.fix(rr.value, 2)} the resting output is restored at filling pressure ${v.fix(need.Pv, 1)} mmHg and diastolic volume ${v.fix(need.EDV, 0)} mL (${need.EDV >= base.EDV ? '+' : '−'}${v.fix(Math.abs(need.EDV - base.EDV), 0)} mL vs rest): the heart has dilated to compensate` : `at resistance ${v.fix(rr.value, 2)} the resting output is not reached within the range of filling pressures shown`));
      },
    },
  ],
};
