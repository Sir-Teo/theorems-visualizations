// History of Technology — Chapter 2: Simple machines and the ancient engineers (items 2.1–2.6; 2.7–2.11 are in ch02-b.js)
import { yearStage, drawYears, block, ground, gear } from './ch02.shared.js';

const D2R = Math.PI / 180;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const G = 9.81;

export default {
  collection: 'tech',
  chapter: 2,
  title: 'Simple machines and the ancient engineers',
  summary: String.raw`The lever, the wheel and axle, the pulley, the inclined plane, the wedge and the screw trade force for distance and never create work. Greek mechanics made this exact: Archimedes proved the law of the lever, Hero of Alexandria listed five "powers" that move a load, and Roman builders combined a treadwheel with a block and tackle to lift several tonnes with two men. The same few principles run through the farmer's shadoof and the water screw, the bronze gear trains of the Antikythera mechanism, the crank and connecting rod of a Roman stone-sawing mill and the counterweight trebuchet. Each item below is a working model with real mechanics, a way to break it, and a strip of dated evidence with the disputed dates marked.`,
  items: [
    // ------------------------------------------------------------------ 2.1
    {
      num: '2.1',
      kind: 'Law',
      name: 'The law of the lever (Archimedes)',
      credit: 'Archimedes of Syracuse, On the Equilibrium of Planes, 3rd century BCE',
      statement: String.raw`Two weights on a rigid beam resting on a fulcrum balance when they are at distances from the fulcrum **inversely proportional** to their weights:
$$W_A\,d_A = W_B\,d_B .$$
More generally a lever is in equilibrium when the sums of the moments (weight times horizontal distance from the fulcrum) on the two sides are equal; if not, it turns toward the side with the larger moment. Archimedes proved the law in Book I of *On the Equilibrium of Planes* (Propositions 6 and 7, for commensurable and then incommensurable magnitudes), from postulates such as "equal weights at equal distances balance". Applied to an effort and a load it says that a small effort at a long arm holds a large load at a short arm, and that, while the lever turns, the effort's end moves farther than the load's end in exactly the same ratio.

Scope: rigid, weightless beam (or a beam whose own weight is added as one more moment), weights acting vertically, static equilibrium.`,
      idea: String.raw`Archimedes' proof avoids any appeal to motion. Take a weight of 4 units at distance 3 and a weight of 3 units at distance 4. Cut each weight into equal unit blocks, and spread the 4 blocks of the first evenly over a length $2\times 4$ centred where it hangs and the 3 blocks of the second over a length $2\times 3$ centred where it hangs. Spreading a weight symmetrically about its own point does not change its effect. Because $4\times 3 = 3\times 4$, the two stretches have the **same density**, they meet exactly, and together they form one uniform row centred on the fulcrum, which balances by symmetry. If the products differ, the densities differ and the symmetry argument fails.

In modern language the moment $W d$ is the torque of the weight about the fulcrum (mech-2.8), and equilibrium means zero net torque. A real balance is built with its pivot slightly above the line of the beam, so an imbalance tilts it to a definite angle instead of slamming it against a stop: $\tan\theta = \sum W_i d_i \big/ \bigl(h \sum W_i\bigr)$, where $h$ is the height of the pivot above the beam.`,
      caption: String.raw`**Balance:** drag the two loads along the pegs and set their weights. The beam tilts by the computed angle; the bars under it are the two moments, and the right-hand panel shows the tilt as the right load slides, crossing zero where $W_A d_A = W_B d_B$ (often between two pegs). Set the pivot height to 0 for a neutral beam that swings hard onto its stop at the smallest imbalance. **Archimedes' proof:** each load is cut into unit blocks spread over a stretch centred where it hangs. They form one uniform row symmetric about the fulcrum exactly when the moments match. **A place to stand:** how long a lever must be for you to hold up the Earth.`,
      deps: ['mech-2.8'],
      refs: ['Mokyr ch. 2', 'Archimedes, On the Equilibrium of Planes I, Props. 6–7 (tr. Heath 1897)', 'Pappus, Synagoge VIII', 'Dijksterhuis, Archimedes (1987)'],
      tags: ['ancient', 'statics', 'lever'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Lever' },
      viz(v) {
        const A = v.stage({ x: [-11.6, 11.6], y: [-5.3, 3.0], equal: true, axes: false, height: 310, weight: 1.45, minWidth: 380, title: 'balance beam (distances in peg units)' });
        const B = v.stage({ x: [0.5, 10.5], y: [-14, 14], axes: 'box', gutter: true, height: 310, weight: 1, minWidth: 280, xlabel: 'distance of the right load', ylabel: 'tilt (°)', title: 'tilt as the right load slides' });
        const C = yearStage(v, [-2800, 450], { height: 190, full: true, title: 'dated evidence: balances and the theory of the lever' });
        const mode = v.select('show', [{ value: 'bal', label: 'balance' }, { value: 'proof', label: 'Archimedes’ proof' }, { value: 'earth', label: 'a place to stand' }], 'bal');
        const mA = v.slider('left weight $W_A$', 1, 12, 4, { int: true });
        const mB = v.slider('right weight $W_B$', 1, 12, 3, { int: true });
        const hS = v.slider('pivot height above the beam', 0, 1, 0.35, { step: 0.05 });
        const you = v.slider('your mass (kg)', 30, 120, 70, { step: 1 });
        const shortArm = v.slider('short arm (m)', 0.1, 10, 1, { log: true });
        const MB = 3; // beam weight, same units
        let dAv = 3, dBv = 4; // peg distances; the handles ride on the (tilted) beam
        const beamPt = (x) => { // beam point at peg x for the current state
          const m = mode.value, th = m === 'proof' ? 0 : tilt(dAv, dBv, mA.value, mB.value, hS.value), t = -th * D2R, hh = m === 'bal' ? hS.value : 0.35;
          return [x * Math.cos(t) + hh * Math.sin(t), 2.2 + x * Math.sin(t) - hh * Math.cos(t)];
        };
        const hA = A.handle(-3, 1.85, { color: 'accent', label: 'A', labelPos: 'n', constrain: (x) => { dAv = clamp(Math.round(-x), 1, 10); return beamPt(-dAv); } });
        const hB = A.handle(4, 1.85, { color: 'orange', label: 'B', labelPos: 'n', constrain: (x) => { dBv = clamp(Math.round(x), 1, 10); return beamPt(dBv); } });
        const tilt = (dA, dB, wA, wB, h) => { // equilibrium tilt in degrees (positive: right side down), with ±12° stops
          const tau = wB * dB - wA * dA; if (Math.abs(tau) < 1e-9) return 0;
          if (h < 1e-6) return 12 * Math.sign(tau);
          return clamp(Math.atan(tau / (h * (wA + wB + MB))) / D2R, -12, 12);
        };
        v.render(() => {
          const m = mode.value, dA = dAv, dB = dBv, wA = mA.value, wB = mB.value, h = hS.value;
          { const a = beamPt(-dA), b = beamPt(dB); if (!hA.dragging) hA.set(a[0], a[1]); if (!hB.dragging) hB.set(b[0], b[1]); }
          hS.el.hidden = m !== 'bal'; you.el.hidden = m !== 'earth'; shortArm.el.hidden = m !== 'earth';
          const th = m === 'proof' ? 0 : tilt(dA, dB, wA, wB, h), t = -th * D2R; // rotation (CCW positive)
          const piv = [0, 2.2], hh = m === 'bal' ? h : 0.35;
          const P = (x) => [piv[0] + x * Math.cos(t) + hh * Math.sin(t), piv[1] + x * Math.sin(t) - hh * Math.cos(t)];
          // fulcrum and beam
          A.poly([[0, piv[1]], [-0.9, -3.0], [0.9, -3.0]], { fill: 'muted', fillAlpha: 0.35, color: 'muted', width: 1.4 });
          ground(A, -11.4, 11.4, -3.0);
          const L = P(-10.7), R = P(10.7);
          A.line(L[0], L[1], R[0], R[1], { color: 'ink', width: 5 });
          for (let k = -10; k <= 10; k++) { const q = P(k); A.dot(q[0], q[1], { r: k === 0 ? 0 : 2, color: 'muted' }); }
          A.dot(piv[0], piv[1], { r: 3.5, color: 'ink' });
          // stops
          for (const sx of [-10.4, 10.4]) A.line(sx, -3.0, sx, piv[1] - hh - 10.4 * Math.sin(12 * D2R) - 0.12, { color: 'faint', width: 3 });
          // hanging loads
          const hang = (x, w, col, lab) => {
            const q = P(x), top = q[1] - 0.15, size = 0.5 + 0.1 * w, bot = top - 0.6 - size;
            A.line(q[0], q[1], q[0], bot + size, { color: 'muted', width: 1.2 });
            block(A, q[0], bot, 0.7 + 0.08 * w, size, `${w}`, { color: col, fillAlpha: 0.5, size: 13 });
          };
          if (m !== 'proof') { hang(-dA, wA, 'accent', `d = ${dA}`); hang(dB, wB, 'orange', `d = ${dB}`); }
          if (m === 'bal' || m === 'earth') {
            // moment bars
            const mx = Math.max(wA * dA, wB * dB, 1), sc = 10 / Math.max(mx, 40);
            A.rect(-wA * dA * sc, -4.25, 0, -3.8, { fill: 'accent', fillAlpha: 0.6, stroke: false });
            A.rect(0, -4.25, wB * dB * sc, -3.8, { fill: 'orange', fillAlpha: 0.6, stroke: false });
            A.line(0, -4.45, 0, -3.6, { color: 'ink', width: 1.2 });
            A.text(`moment ${wA}×${dA} = ${wA * dA}`, -0.3, -4.8, { size: 11.5, color: 'accent', align: 'right', baseline: 'middle' });
            A.text(`${wB}×${dB} = ${wB * dB}`, 0.3, -4.8, { size: 11.5, color: 'orange', align: 'left', baseline: 'middle' });
            const bal = wA * dA === wB * dB;
            A.corner(bal ? 'balanced: moments equal' : `${wA * dA > wB * dB ? 'left' : 'right'} side down, tilt ${v.fix(Math.abs(th), 1)}°${Math.abs(th) >= 12 ? ' (on the stop)' : ''}`, 'tl', { size: 12.5, color: bal ? 'green' : 'red', weight: 700 });
          }
          if (m === 'proof') {
            // Archimedes: spread A's wA unit blocks over [−dA−dB, −dA+dB], B's wB over [dB−dA, dB+dA]
            const y0 = -4.5, dens = (w, len) => w / len, rhoA = dens(wA, 2 * dB), rhoB = dens(wB, 2 * dA), Hs = 1.2 / Math.max(rhoA, rhoB);
            const row = (c, half, w, rho, col) => {
              const wd = (2 * half) / w;
              for (let k = 0; k < w; k++) { const x0 = c - half + k * wd; A.rect(x0, y0, x0 + wd, y0 + rho * Hs, { fill: col, fillAlpha: 0.45, color: col, width: 1 }); }
            };
            row(-dA, dB, wA, rhoA, 'accent'); row(dB, dA, wB, rhoB, 'orange');
            A.line(0, y0 - 0.3, 0, y0 + 1.45, { color: 'ink', width: 1.2, dash: [4, 3] });
            const cg = (-wA * dA + wB * dB) / (wA + wB);
            A.dot(cg, y0 - 0.25, { r: 4.5, color: Math.abs(cg) < 1e-9 ? 'green' : 'red' });
            A.text('centre of the row', cg + 0.4, y0 - 0.25, { size: 11, color: Math.abs(cg) < 1e-9 ? 'green' : 'red', align: 'left', baseline: 'middle' });
            // the loads themselves, drawn on the beam as point weights
            for (const [x, w, col] of [[-dA, wA, 'accent'], [dB, wB, 'orange']]) { const q = P(x); A.dot(q[0], q[1], { r: 4 + w * 0.6, color: col }); A.text(`${w}`, q[0], q[1] + 0.75, { size: 12, color: col, align: 'center', weight: 700 }); }
            const ok = wA * dA === wB * dB;
            A.corner(ok ? 'uniform row, symmetric about the fulcrum: it balances' : 'densities differ: the row is lopsided', 'tl', { size: 12.5, color: ok ? 'green' : 'red', weight: 700 });
          }
          // ---- B
          if (m === 'bal') {
            B.setView([0.5, 10.5], [-14, 14]); B.setLabels('distance of the right load', 'tilt (°)'); B.setTitle('tilt as the right load slides'); B.setTicks(null, null);
            B.hline(0, { color: 'faint', width: 1 });
            B.fn((x) => tilt(dA, x, wA, wB, h), { color: 'orange', width: 2.2, n: 400 });
            const xs = (wA * dA) / wB;
            if (xs <= 10.5) { B.vline(xs, { color: 'green', width: 1.2, dash: [4, 3] }); B.text(`balance at ${v.fix(xs, 2)}`, xs, 12.5, { size: 11, color: 'green', align: xs > 7 ? 'right' : 'left', dx: xs > 7 ? -4 : 4 }); }
            for (let k = 1; k <= 10; k++) B.dot(k, tilt(dA, k, wA, wB, h), { r: k === dB ? 5.5 : 2.5, color: k === dB ? 'orange' : 'muted' });
          } else if (m === 'proof') {
            const span = dA + dB;
            B.setView([-span - 0.6, span + 0.6], [0, 1.25 * Math.max(wA / (2 * dB), wB / (2 * dA))]); B.setLabels('position along the beam', 'weight per unit length'); B.setTitle('density of the spread row and its mirror image'); B.setTicks(null, null);
            const rho = (x) => (x >= -dA - dB && x <= -dA + dB ? wA / (2 * dB) : 0) + (x > dB - dA && x <= dB + dA ? wB / (2 * dA) : 0);
            B.fn(rho, { color: 'ink', width: 2, n: 800, fill: 'accent', fillAlpha: 0.15 });
            B.fn((x) => rho(-x), { color: 'red', width: 1.5, dash: [5, 4], n: 800 });
            B.vline(0, { color: 'muted', width: 1, dash: [3, 3] });
          } else {
            const ratio = 5.972e24 / you.value, Llong = ratio * shortArm.value;
            B.setView([0, 24.5], [0, 1]); B.setLabels('length (m), log scale', null); B.setTitle('the long arm you would need');
            B.setTicks([0, 4, 8, 12, 16, 20, 24].map((e) => [e, e === 0 ? '1' : `10${sup(e)}`]), []);
            const marks = [[3.844e8, 'Moon'], [1.496e11, 'Sun'], [4.0e16, 'Proxima'], [9.5e20, 'Milky Way'], [2.4e22, 'Andromeda']];
            marks.forEach(([d, lab], i) => { const x = Math.log10(d); B.vline(x, { color: 'faint', width: 1 }); B.text(lab, x, 0.08 + 0.11 * i, { size: 10.5, color: 'muted', align: i >= 3 ? 'right' : 'center', dx: i >= 3 ? -3 : 0, plate: true }); });
            const xl = Math.log10(Llong);
            B.rect(Math.log10(shortArm.value), 0.55, Math.min(xl, 24.5), 0.68, { fill: 'accent', fillAlpha: 0.55, stroke: false });
            B.dot(Math.min(xl, 24.5), 0.615, { r: 5, color: 'accent' });
            B.text(`long arm ≈ 10^${v.fix(xl, 1)} m`, Math.min(xl, 23.5), 0.8, { size: 12, color: 'accent', align: 'right', weight: 700 });
          }
          drawYears(v, C, [
            { t: -2600, label: 'balance weights, Egypt (Sneferu)' },
            { t: [-2400, -1800], label: 'Indus weight cubes' },
            { t: -400, label: 'unequal-arm scales' },
            { t: [-400, -200], label: 'Chu balance, China' },
            { t: [-330, -250], label: 'Mechanical Problems', color: 'purple' },
            { t: -250, label: 'Archimedes proves the law', color: 'green' },
            { t: 320, label: 'Pappus: "give me a place to stand"', color: 'orange' },
          ], { lanes: 5, ticks: [-2500, -2000, -1500, -1000, -500, 1] });
        });
        function sup(e) { return String(e).split('').map((c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+c]).join(''); }
        v.legend([['accent', 'load A and its moment', { area: true }], ['orange', 'load B and its moment', { area: true }], ['green', 'balance point']]);
        v.readout(() => {
          const dA = dAv, dB = dBv, wA = mA.value, wB = mB.value;
          if (mode.value === 'earth') {
            const ratio = 5.972e24 / you.value, Ll = ratio * shortArm.value, ly = Ll / 9.461e15;
            return `Earth's mass $5.97\\times10^{24}$ kg against your ${you.value} kg: arm ratio $${v.sci(ratio, 3)}$. With a ${v.fmt(shortArm.value, 3)} m short arm the long arm is $${v.sci(Ll, 2)}$ m, about **${v.fmt(ly / 1e6, 3)} million light-years** (Andromeda is 2.5 million). To raise the Earth by 1 cm you would push your end $${v.sci(ratio * 0.01, 2)}$ m, about ${v.fmt(ratio * 0.01 / 9.461e15, 3)} light-years. (Illustrative: it imagines the Earth's mass in surface gravity, as Archimedes' boast does.)`;
          }
          const lhs = wA * dA, rhs = wB * dB;
          if (mode.value === 'proof') return `$W_A d_A = ${wA}\\times${dA} = ${lhs}$, $W_B d_B = ${wB}\\times${dB} = ${rhs}$ · densities of the spread blocks: $${wA}/${2 * dB} = ${v.fix(wA / (2 * dB), 3)}$ and $${wB}/${2 * dA} = ${v.fix(wB / (2 * dA), 3)}$ per unit · row from $${-dA - dB}$ to $${dA + dB}$, centre of weight at $${v.fix((rhs - lhs) / (wA + wB), 3)}$ → ${lhs === rhs ? '**uniform and symmetric: balance**' : '**not uniform: no balance**'}`;
          return `moments $${wA}\\times${dA} = ${lhs}$ and $${wB}\\times${dB} = ${rhs}$, net ${rhs - lhs > 0 ? '+' : ''}${rhs - lhs} → ${lhs === rhs ? '**balance**' : `tilt **${v.fix(Math.abs(tilt(dA, dB, wA, wB, hS.value)), 1)}°**`} · balance needs B at $d_B = W_A d_A/W_B = ${v.fix(lhs / wB, 3)}$ · when the beam turns, the ends move in the ratio $d_A : d_B = ${dA}:${dB}$, so effort × distance = load × distance`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.2
    {
      num: '2.2',
      kind: 'Invention',
      name: 'The wheel and axle',
      credit: 'Mesopotamia, the Caucasus and Europe, c. 3500–3300 BCE (wheeled vehicles appear almost simultaneously)',
      statement: String.raw`A **wheel** fixed to or turning on an **axle** lets a load roll instead of slide. Wheeled vehicles appear in the second half of the fourth millennium BCE almost at once across a wide area: wagon pictographs on clay tablets from Uruk (c. 3500–3350 BCE), a wagon drawn on the Bronocice pot in southern Poland (3631–3380 BCE), and the oldest surviving wooden wheel with its axle, from the Ljubljana Marshes, Slovenia (wheel 3340–3030 BCE, axle 3360–3045 BCE). Where it began is unknown. The potter's wheel, a turntable on an axle, is at least as old in Mesopotamia (Ur, c. 3100 BCE) and older still in the Cucuteni–Trypillia culture.

The same device multiplies force: in a **windlass** or capstan a force on the rim of radius $R$ turns an axle of radius $r$ with a mechanical advantage $R/r$. Hero of Alexandria counted the windlass among his five powers.`,
      idea: String.raw`A sledge must overcome sliding friction $\mu W$ at the ground, with $\mu$ around 0.3–0.6. On a wheel the sliding moves to the axle bearing, where friction $\mu_a W$ acts at the small radius $r$; the pull at the hub needed to overcome it is only $\mu_a W\,r/R$, because the wheel is a lever of arms $R$ and $r$ (tech-2.1). What remains is **rolling resistance**: the wheel sinks into the ground and must keep climbing out of its own rut, which costs roughly $W\sqrt{z/D}$ for a sinkage $z$ and diameter $D$. On a hard road the total is a few per cent of the load, ten times less than dragging. In soft sand the rut is deep, rolling resistance climbs toward sliding friction, and wetting the sand under a sledge (as the Egyptians did) can do almost as well as a wheel.`,
      caption: String.raw`Choose the **ground** and the **load**, and drag the gold handle on the cart to change the **wheel size**. The sledge and the cart are pulled at constant speed; arrows and bars give the pulling force, also counted in people (one person pulling steadily about 250 N). The close-up shows where the resistance comes from: friction at the axle, reduced by the lever ratio $r/R$, and the rut (sinkage exaggerated). On dry sand, small wheels lose most of their advantage, and wetting the sand halves the sledge's friction.`,
      deps: ['tech-2.1'],
      refs: ['Mokyr ch. 2', 'Fall et al. 2014, Phys. Rev. Lett. 112:175502', 'Bulliet, The Camel and the Wheel (1975)'],
      tags: ['ancient', 'c. 3500 BCE', 'friction'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Wheel_and_axle' },
      viz(v) {
        const A = v.stage({ x: [0, 12], y: [-0.75, 4.75], equal: true, axes: false, height: 300, weight: 1.5, minWidth: 380, title: 'drag a load at constant speed' });
        const B = v.stage({ x: [-1.25, 1.25], y: [-1.3, 1.25], equal: true, axes: false, height: 300, weight: 0.85, minWidth: 250, title: 'where a wheel’s resistance comes from' });
        const C = v.stage({ x: [0, 1], y: [0, 4], axes: false, height: 190, weight: 1, minWidth: 320, title: 'pulling force' });
        const D = yearStage(v, [-4700, -1500], { height: 190, weight: 1.3, minWidth: 380, title: 'dated evidence: the first wheels' });
        const surf = v.select('ground', [{ value: 'road', label: 'paved road' }, { value: 'earth', label: 'packed earth' }, { value: 'sand', label: 'dry sand' }], 'earth');
        const load = v.slider('load (tonnes)', 0.2, 20, 2, { log: true });
        const grease = v.toggle('greased axle', true);
        const wet = v.toggle('wet the sand in front of the sledge', false);
        // illustrative coefficients (see readout)
        const MU = { road: 0.4, earth: 0.45, sand: 0.5 }, Z = { road: 0.0001, earth: 0.002, sand: 0.03 };
        const r = 0.04; // axle radius (m)
        const LANE_C = 0.6, LANE_S = 3.55;
        const wheelH = A.handle(10.2, LANE_C + 1.0, { color: 'gold', constrain: (x, y) => [10.2, clamp(y, LANE_C + 0.3, LANE_C + 1.8)] });
        const D_of = () => wheelH.y - LANE_C; // wheel diameter (m): the handle marks the top of the rim
        const forces = () => {
          const W = load.value * 1000 * G, s = surf.value, Dm = D_of();
          const muS = s === 'sand' && wet.value ? 0.25 : MU[s];
          const muA = grease.value ? 0.08 : 0.25;
          const axle = muA * W * r / (Dm / 2), roll = W * Math.sqrt(Z[s] / Dm);
          return { W, sled: muS * W, axle, roll, cart: axle + roll, muS, muA, Dm };
        };
        v.render(() => {
          const F = forces(), s = surf.value;
          wet.el.hidden = s !== 'sand';
          // ---- A: two lanes
          const laneS = LANE_S, laneC = LANE_C;
          for (const y0 of [laneS, laneC]) {
            A.rect(0, y0 - 0.25, 12, y0, { fill: s === 'sand' ? 'gold' : s === 'earth' ? 'orange' : 'muted', fillAlpha: s === 'road' ? 0.25 : 0.2, stroke: false });
            A.line(0, y0, 12, y0, { color: 'muted', width: 1.4 });
          }
          if (s === 'road') for (let x = 0.3; x < 12; x += 0.8) for (const y0 of [laneS, laneC]) A.line(x, y0 - 0.25, x, y0, { color: 'muted', width: 0.8, alpha: 0.5 });
          if (s === 'sand' && wet.value) A.rect(5.5, laneS - 0.25, 8.8, laneS, { fill: 'blue', fillAlpha: 0.35, stroke: false });
          // sledge with block
          A.poly([[6.1, laneS], [8.3, laneS], [8.6, laneS + 0.25], [6.1, laneS + 0.25]], { fill: 'orange', fillAlpha: 0.5, color: 'orange', width: 1.4 });
          const bh = 0.45 + 0.25 * Math.log10(load.value * 5);
          block(A, 7.2, laneS + 0.25, 1.6, bh, `${v.fmt(load.value, 2)} t`);
          // cart
          const Dm = F.Dm, R = Dm / 2, sink = s === 'sand' ? 0.12 : s === 'earth' ? 0.04 : 0;
          const cy = laneC + R - sink;
          A.rect(7.4, cy + 0.02, 10.8, cy + 0.22, { fill: 'orange', fillAlpha: 0.5, color: 'orange', width: 1.4 });
          block(A, 9.1, cy + 0.22, 1.6, bh, `${v.fmt(load.value, 2)} t`);
          for (const wx of [8.0, 9.4 + 0.0]) {
            A.circle(wx === 8.0 ? 8.0 : 10.2, cy, R, { color: 'ink', width: 2.2, fill: 'panel', fillAlpha: 0.6 });
            const cx = wx === 8.0 ? 8.0 : 10.2;
            for (let k = 0; k < 6; k++) { const a = (k * Math.PI) / 3; A.line(cx, cy, cx + R * Math.cos(a), cy + R * Math.sin(a), { color: 'ink', width: 1, alpha: 0.6 }); }
            A.circle(cx, cy, 0.06, { fill: 'ink', fillAlpha: 1 });
          }
          // ropes and pull arrows (length ∝ force on a log-ish scale)
          const arrowLen = (f) => 0.6 + 1.6 * Math.log10(1 + f / 500);
          const pull = (x, y, f, col) => { const L = arrowLen(f); A.line(x, y, x - 1.1, y, { color: 'muted', width: 1.2 }); A.arrow(x - 1.1, y, x - 1.1 - L, y, { color: col, width: 3 }); A.text(`${v.fmt(f / 1000, 3)} kN`, x - 1.1 - L / 2, y + 0.28, { size: 12, color: col, align: 'center', weight: 700 }); };
          pull(6.1, laneS + 0.15, F.sled, 'red');
          pull(7.4, cy + 0.12, F.cart, 'green');
          A.text('sledge', 11.9, laneS + 0.55, { size: 12, color: 'ink', align: 'right', weight: 600 });
          A.text(`cart, wheels ${v.fix(Dm, 2)} m across`, 11.9, laneC - 0.48, { size: 12, color: 'ink', align: 'right', weight: 600 });
          // Keep the drag label inside the stage and above both the rim and load.
          A.text('wheel size', 11.9, Math.max(wheelH.y + 0.3, cy + 0.22 + bh + 0.15), { color: 'gold', math: true, align: 'right', baseline: 'bottom' });
          A.text(`μ = ${v.fix(F.muS, 2)}`, 7.2, laneS - 0.48, { size: 11, color: 'muted', align: 'center' });
          // ---- B: close-up of a wheel
          const Rb = 0.95, rb = 0.16, zb = s === 'sand' ? 0.16 : s === 'earth' ? 0.06 : 0.015;
          const gy = -Rb + zb;
          B.rect(-1.25, -1.3, 1.25, gy, { fill: s === 'sand' ? 'gold' : s === 'earth' ? 'orange' : 'muted', fillAlpha: 0.22, stroke: false });
          B.line(-1.25, gy, 1.25, gy, { color: 'muted', width: 1.4 });
          B.circle(0, 0, Rb, { color: 'ink', width: 2.4, fill: 'panel', fillAlpha: 0.7 });
          B.circle(0, 0, rb, { color: 'orange', width: 2.2 });
          B.circle(0, 0, rb * 0.55, { fill: 'muted', fillAlpha: 0.6, stroke: false });
          // friction at the axle
          B.arrow(-0.02, rb + 0.01, -0.4, rb + 0.01, { color: 'orange', width: 2 });
          B.text('axle friction μₐW', -0.42, rb + 0.14, { size: 11, color: 'orange', align: 'right' });
          B.measure(0, 0, 0, -rb, '');
          B.text('r', 0.05, -rb / 2, { size: 12, color: 'orange', math: true, align: 'left' });
          B.line(0, 0, Rb * Math.cos(-0.5), Rb * Math.sin(-0.5), { color: 'ink', width: 1, dash: [4, 3] });
          B.text('R', 0.42, -0.12, { size: 13, color: 'ink', math: true });
          // rut: contact patch ahead of the wheel
          const xc = Math.sqrt(Math.max(0, Rb * Rb - gy * gy));
          if (zb > 0.02) { B.rect(-1.25, gy - 0.001, -xc * 0.3, -Rb, { fill: 'panel', fillAlpha: 0.9, stroke: false }); B.arrow(xc * 0.2, -Rb - 0.02, xc * 0.95 + 0.05, gy + 0.08, { color: 'red', width: 1.8 }); B.text('climbing out of the rut', 0.05, -1.2, { size: 11, color: 'red', align: 'center' }); }
          B.arrow(0, 0, 0, -0.55, { color: 'muted', width: 1.4 });
          B.corner(`axle: ${v.fmt(F.axle / 1000, 3)} kN · rolling: ${v.fmt(F.roll / 1000, 3)} kN`, 'tl', { size: 11.5, color: 'ink' });
          // ---- C: bars
          const rows = [['sledge', F.sled, 'red'], ['cart', F.cart, 'green']];
          if (s === 'sand') rows.splice(1, 0, ['sledge, wetted sand', 0.25 * F.W, 'blue']);
          const mx = Math.max(...rows.map((q) => q[1]));
          rows.forEach(([lab, f, col], i) => {
            const y = 3.3 - i * 1.15;
            C.rect(0.3, y - 0.35, 0.3 + 0.62 * (f / mx), y + 0.35, { fill: col, fillAlpha: 0.55, stroke: false });
            const labelStyle = { size: 11.5, color: 'ink', align: 'right', baseline: 'middle' };
            if (lab === 'sledge, wetted sand') {
              C.text('sledge,', 0.28, y + 0.14, labelStyle);
              C.text('wetted sand', 0.28, y - 0.14, labelStyle);
            } else C.text(lab, 0.28, y, labelStyle);
            C.text(`${v.fmt(f / 1000, 3)} kN · ${Math.max(1, Math.ceil(f / 250))} people`, 0.32 + 0.62 * (f / mx), y, { size: 11, color: 'ink', align: f / mx > 0.6 ? 'right' : 'left', baseline: 'middle', dx: f / mx > 0.6 ? -8 : 4, plate: true });
          });
          drawYears(v, D, [
            { t: [-4600, -4400], label: 'potter’s wheel, Cucuteni–Trypillia' },
            { t: [-4300, -4000], label: 'clay model wheels, Black Sea', contested: true },
            { t: [-3631, -3380], label: 'Bronocice pot wagon' },
            { t: [-3500, -3350], label: 'Uruk wagon signs' },
            { t: [-3340, -3030], label: 'Ljubljana wheel and axle', color: 'green' },
            { t: -3100, label: 'potter’s wheel, Ur' },
            { t: -1880, label: 'Djehutihotep: sledge on wetted sand', color: 'blue' },
          ], { lanes: 4, ticks: [-4500, -4000, -3500, -3000, -2500, -2000] });
        });
        v.legend([['red', 'sledge (sliding friction)'], ['green', 'wheeled cart (axle friction + rolling)'], ['orange', 'axle and its friction']]);
        v.readout(() => {
          const F = forces();
          return `load ${v.fmt(load.value, 3)} t, weight ${v.fmt(F.W / 1000, 3)} kN · sledge $\\mu = ${v.fix(F.muS, 2)}$: **${v.fmt(F.sled / 1000, 3)} kN** · cart: axle $\\mu_a W r/R = ${v.fix(F.muA, 2)}\\times W\\times ${v.fix(r, 2)}/${v.fix(F.Dm / 2, 2)}$ = ${v.fmt(F.axle / 1000, 3)} kN, rolling $W\\sqrt{z/D}$ = ${v.fmt(F.roll / 1000, 3)} kN, total **${v.fmt(F.cart / 1000, 3)} kN**, ${v.fix(F.sled / F.cart, 1)}× easier · coefficients are typical illustrative values (sinkage $z$ = 0.1, 2, 30 mm); the halving of sledge friction on wet sand follows Fall et al. 2014`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.3
    {
      num: '2.3',
      kind: 'Invention',
      name: 'The inclined plane and the wedge',
      credit: 'Prehistoric; law of the inclined plane: Simon Stevin, 1586',
      statement: String.raw`A load of weight $W$ pushed up a frictionless ramp of slope $\theta$ needs a force along the ramp of only $W\sin\theta$, but must travel $L = H/\sin\theta$ to rise a height $H$: the work $F L = W H$ is the same for every slope. With friction coefficient $\mu$ the force is $W(\sin\theta + \mu\cos\theta)$ and the work $W H\,(1 + \mu/\tan\theta)$, so shallow ramps cost extra work. A block on a ramp stays put without help when $\tan\theta \le \mu$.

A **wedge** is a pair of inclined planes driven between two objects. With half-angle $\alpha$ and friction angle $\varphi = \arctan\mu$ on its faces, a driving force $F$ produces a sideways force on each side of
$$\frac{F}{2\tan(\alpha+\varphi)}, \qquad \text{ideally } \frac{F}{2\tan\alpha};$$
it stays in place by itself (self-locking) when $\alpha < \varphi$.

Ramps are as old as monumental building (a steep sledge ramp at the Hatnub alabaster quarry carries inscriptions of Khufu, c. 2580 BCE), but the inclined plane is missing from Hero's five powers. Its law was first proved convincingly by Simon Stevin in 1586 with his wreath of spheres.`,
      idea: String.raw`Resolve the weight into a component $W\sin\theta$ down the slope and $W\cos\theta$ into it: the push must balance the first plus the friction $\mu W\cos\theta$ that the second produces (mech-1.15). The work-energy theorem (mech-3.1) explains the trade: lifting $W$ by $H$ needs $WH$ however it is done, so a gentler slope can only spread that work over a longer path.

Stevin's proof uses no forces at all. Hang a closed loop of evenly spaced beads over a triangular prism. The festoon hanging below is symmetric and pulls equally on both ends, so it can be removed. If the beads lying on the two faces did not balance, the loop would start to turn, and since turning reproduces the same configuration it would turn for ever: perpetual motion, which Stevin rejected. So the numbers of beads, proportional to the face lengths $L_1, L_2$, balance: $L_1\sin\theta_1 = L_2\sin\theta_2 = H$, which is the law of the inclined plane.`,
      caption: String.raw`**Ramp:** drag the **foot** of the ramp to change its slope and set the friction. The arrows are the weight's components, friction and the push; the right panel plots the push force and the work against slope (the work line is flat when $\mu = 0$). Past the red line the block slides back by itself. **Wedge:** drag the wedge's shoulder to change its angle; it splits the log with a force that grows as the wedge gets thinner, until friction makes it self-locking. **Stevin:** drag the apex of the prism. The bead counts on the two faces change, but the pulls along the faces stay equal.`,
      deps: ['mech-3.1', 'mech-1.15'],
      refs: ['Mokyr ch. 2', 'Stevin, De Beghinselen der Weeghconst (1586)', 'Koetsier 2010, in The Genius of Archimedes, pp. 94–99'],
      tags: ['ancient', 'statics', 'friction'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Inclined_plane' },
      viz(v) {
        const A = v.stage({ x: [-0.3, 12.3], y: [-0.7, 5.6], equal: true, axes: false, height: 300, weight: 1.35, minWidth: 360, title: 'machine' });
        const B = v.stage({ x: [0, 90], y: [0, 3], axes: 'box', gutter: true, height: 300, weight: 1, minWidth: 280 });
        const C = yearStage(v, [-2800, 1700], { height: 150, full: true, title: 'dated evidence: ramps, wedges and the law of the inclined plane' });
        const mode = v.select('machine', [{ value: 'ramp', label: 'ramp' }, { value: 'wedge', label: 'wedge' }, { value: 'stevin', label: 'Stevin’s wreath' }], 'ramp');
        const muS = v.slider('friction coefficient $\\mu$', 0, 0.7, 0.3, { step: 0.01 });
        const H = 4.0, TOP = 10.8;
        const foot = A.handle(4.5, 0, { color: 'accent', label: 'foot', labelPos: 's', constrain: (x) => [clamp(x, 0.2, TOP - 0.6), 0] });
        const shoulder = A.handle(6 + 0.9, 4.7, { color: 'orange', label: 'shoulder', labelPos: 'e', constrain: (x) => [clamp(x, 6.12, 7.6), 4.7] });
        const apex = A.handle(5, 4.2, { color: 'purple', label: 'apex', labelPos: 'n', constrain: (x, y) => [clamp(x, 1.8, 10.2), clamp(y, 2.2, 5.4)] });
        v.render(() => {
          const m = mode.value, mu = muS.value, phi = Math.atan(mu);
          foot.visible = m === 'ramp'; shoulder.visible = m === 'wedge'; apex.visible = m === 'stevin'; muS.el.hidden = m === 'stevin';
          A.setTitle(m === 'ramp' ? 'pushing a block up a ramp' : m === 'wedge' ? 'a wedge splitting a log' : 'Stevin’s wreath of beads (1586)');
          if (m === 'ramp') {
            const th = Math.atan2(H, TOP - foot.x), L = Math.hypot(H, TOP - foot.x);
            A.poly([[foot.x, 0], [TOP, 0], [TOP, H]], { fill: 'muted', fillAlpha: 0.3, color: 'muted', width: 1.5 });
            ground(A, -0.2, 12.2, 0);
            // block at 45% up the slope
            const s0 = 0.45 * L, u = [Math.cos(th), Math.sin(th)], n = [-Math.sin(th), Math.cos(th)], bw = 1.0, bh = 0.7;
            const p0 = [foot.x + s0 * u[0], s0 * u[1]], corner = (a, b) => [p0[0] + a * u[0] + b * n[0], p0[1] + a * u[1] + b * n[1]];
            A.poly([corner(-bw / 2, 0), corner(bw / 2, 0), corner(bw / 2, bh), corner(-bw / 2, bh)], { fill: 'gold', fillAlpha: 0.55, color: 'gold', width: 1.5 });
            const c = corner(0, bh / 2), sc = 2.2; // W drawn as 2.2 units
            A.arrow(c[0], c[1], c[0], c[1] - sc, { color: 'ink', width: 2 }); A.text('W', c[0] + 0.12, c[1] - sc + 0.1, { size: 12, color: 'ink', math: true, align: 'left' });
            const down = sc * Math.sin(th), into = sc * Math.cos(th);
            A.arrow(c[0], c[1], c[0] - down * u[0], c[1] - down * u[1], { color: 'muted', width: 1.6, dash: [4, 3] });
            A.arrow(c[0], c[1], c[0] - into * n[0], c[1] - into * n[1], { color: 'muted', width: 1.6, dash: [4, 3] });
            const push = sc * (Math.sin(th) + mu * Math.cos(th)), fr = sc * mu * Math.cos(th);
            const back = corner(-bw / 2, bh / 2);
            A.arrow(back[0] - push * u[0], back[1] - push * u[1], back[0], back[1], { color: 'accent', width: 3 });
            A.text('push', back[0] - push * u[0] * 0.6, back[1] - push * u[1] * 0.6 + 0.35, { size: 12, color: 'accent', align: 'center', weight: 700 });
            if (mu > 0) { const f0 = corner(0, 0); A.arrow(f0[0], f0[1], f0[0] - fr * u[0], f0[1] - fr * u[1], { color: 'red', width: 2 }); }
            A.text(`${v.fix(th / D2R, 1)}°`, foot.x + 1.25, 0.25, { size: 12, color: 'ink', align: 'left' });
            A.measure(TOP + 0.4, 0, TOP + 0.4, H, '');
            A.text('H', TOP + 0.55, H / 2, { size: 13, color: 'ink', math: true, align: 'left' });
            const slides = Math.tan(th) > mu;
            A.corner(slides ? 'released, the block slides back down' : 'released, the block stays put (friction holds it)', 'tl', { size: 12, color: slides ? 'red' : 'green', weight: 700 });
            // B: force and work vs slope
            B.setView([2, 88], [0, 3]); B.setLabels('slope θ (°)', 'multiples of W  or of WH'); B.setTitle('push force and work against slope');
            B.fn((d) => Math.sin(d * D2R) + mu * Math.cos(d * D2R), { color: 'accent', width: 2.4 });
            B.fn((d) => Math.sin(d * D2R), { color: 'accent', width: 1.4, dash: [5, 4] });
            B.fn((d) => 1 + mu / Math.tan(d * D2R), { color: 'orange', width: 2.4 });
            B.hline(1, { color: 'orange', width: 1.2, dash: [5, 4] });
            const slip = Math.atan(mu) / D2R; if (mu > 0) B.vline(slip, { color: 'red', width: 1.2, dash: [3, 3] });
            const d = th / D2R;
            B.dot(d, Math.sin(th) + mu * Math.cos(th), { r: 5, color: 'accent' });
            B.dot(d, 1 + mu / Math.tan(th), { r: 5, color: 'orange' });
            B.text('work / WH', 70, Math.min(2.85, 1 + mu / Math.tan(70 * D2R)) + 0.14, { size: 11.5, color: 'orange', align: 'center' });
            B.text('force / W', 40, Math.sin(40 * D2R) + mu * Math.cos(40 * D2R) + 0.18, { size: 11.5, color: 'accent', align: 'center' });
            v.legend([['accent', 'push force (dashed: frictionless)'], ['orange', 'work done (dashed: WH)'], ['red', 'friction; self-holding limit tan θ = μ']]);
          } else if (m === 'wedge') {
            const al = Math.atan((shoulder.x - 6) / 4.2); // half-angle: shoulder half-width over wedge length 4.2
            const tip = [6, 0.6 + 0.0], hw = shoulder.x - 6, depth = 2.1; // tip inside the log
            // log split around the wedge
            const gap = (y) => (y > tip[1] ? Math.min(hw, (y - tip[1]) * Math.tan(al)) : 0);
            const logTop = 3.0;
            const crackTip = tip[1] - 0.9;
            A.poly([[1.2, -0.4], [6, -0.4], [6, crackTip], [6 - gap(logTop), logTop], [1.2, logTop]], { fill: 'orange', fillAlpha: 0.35, color: 'orange', width: 1.5 });
            A.poly([[10.8, -0.4], [6, -0.4], [6, crackTip], [6 + gap(logTop), logTop], [10.8, logTop]], { fill: 'orange', fillAlpha: 0.35, color: 'orange', width: 1.5 });
            for (const sx of [-1, 1]) for (let k = 1; k < 4; k++) A.line(6 + sx * (1 + k * 1.1), -0.3, 6 + sx * (1 + k * 1.1), logTop - 0.1, { color: 'orange', width: 0.8, alpha: 0.35 });
            A.poly([[tip[0], tip[1]], [6 + hw, tip[1] + 4.2], [6 - hw, tip[1] + 4.2]], { fill: 'muted', fillAlpha: 0.6, color: 'ink', width: 1.6 });
            // forces
            A.arrow(6, 6.1, 6, tip[1] + 4.3, { color: 'accent', width: 3 }); A.text('F', 6.15, 5.9, { size: 13, color: 'accent', math: true, align: 'left' });
            const side = 1 / (2 * Math.tan(al + phi)), Ls = clamp(0.5 + 0.9 * Math.log2(1 + side), 0.5, 4.2);
            A.arrow(6 - gap(2.0) - 0.05, 2.0, 6 - gap(2.0) - 0.05 - Ls, 2.0, { color: 'green', width: 3 });
            A.arrow(6 + gap(2.0) + 0.05, 2.0, 6 + gap(2.0) + 0.05 + Ls, 2.0, { color: 'green', width: 3 });
            A.text(`${v.fix(side, 2)} F`, 6 + gap(2) + Ls / 2 + 0.2, 2.35, { size: 12, color: 'green', align: 'center', weight: 700, plate: true });
            A.text(`half-angle ${v.fix(al / D2R, 1)}°`, 6 - hw - 0.3, tip[1] + 4.2, { size: 11.5, color: 'ink', align: 'right' });
            const locks = al < phi;
            A.corner(locks ? 'self-locking: the wedge stays in when F is removed' : 'not self-locking: the log squeezes the wedge back out', 'tl', { size: 12, color: locks ? 'green' : 'red', weight: 700 });
            B.setView([1, 45], [0, 10]); B.setLabels('half-angle α (°)', 'side force / F'); B.setTitle('splitting force against wedge angle');
            if (mu > 0) B.vband(1, Math.min(45, phi / D2R), { color: 'green', alpha: 0.12 });
            B.fn((d) => 1 / (2 * Math.tan(d * D2R)), { color: 'green', width: 1.4, dash: [5, 4] });
            B.fn((d) => 1 / (2 * Math.tan(d * D2R + phi)), { color: 'green', width: 2.4 });
            B.dot(al / D2R, Math.min(10, side), { r: 5, color: 'green' });
            if (mu > 0 && phi / D2R < 40) B.text('self-locking', Math.max(2, phi / D2R / 2), 9.2, { size: 11, color: 'green', align: 'center' });
            v.legend([['green', 'side force with friction (dashed: ideal 1/(2 tan α))'], ['accent', 'driving force F']]);
          } else {
            // Stevin's wreath of beads on a triangular prism from (1, 1) to (11, 1) with apex
            const P0 = [1.2, 1.0], P1 = [10.8, 1.0], Q = [apex.x, apex.y];
            A.poly([P0, P1, Q], { fill: 'muted', fillAlpha: 0.25, color: 'muted', width: 1.5 });
            const L1 = Math.hypot(Q[0] - P0[0], Q[1] - P0[1]), L2 = Math.hypot(Q[0] - P1[0], Q[1] - P1[1]), sp = 0.42;
            const n1 = Math.floor(L1 / sp), n2 = Math.floor(L2 / sp);
            for (let k = 0; k <= n1; k++) { const t = k / (L1 / sp); A.dot(P0[0] + t * (Q[0] - P0[0]), P0[1] + t * (Q[1] - P0[1]), { r: 5.5, color: 'accent' }); }
            for (let k = 1; k <= n2; k++) { const t = k / (L2 / sp); A.dot(Q[0] + t * (P1[0] - Q[0]), Q[1] + t * (P1[1] - Q[1]), { r: 5.5, color: 'orange' }); }
            // the festoon (catenary through the two lower corners)
            const span = P1[0] - P0[0], sag = 1.05, a = (() => { let lo = 0.3, hi = 50; for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (mid * (Math.cosh(span / 2 / mid) - 1) > sag) lo = mid; else hi = mid; } return (lo + hi) / 2; })();
            const cat = (x) => P0[1] - sag + a * (Math.cosh((x - (P0[0] + P1[0]) / 2) / a) - 1);
            let acc = 0, prev = [P0[0], cat(P0[0])];
            for (let i = 1; i <= 400; i++) { const x = P0[0] + (span * i) / 400, p = [x, cat(x)]; acc += Math.hypot(p[0] - prev[0], p[1] - prev[1]); if (acc >= sp) { A.dot(p[0], p[1], { r: 5.5, color: 'muted' }); acc = 0; } prev = p; }
            A.text('symmetric festoon: pulls equally on both ends', 6, -0.45, { size: 11.5, color: 'muted', align: 'center' });
            const s1 = (Q[1] - P0[1]) / L1, s2 = (Q[1] - P1[1]) / L2;
            A.text(`${n1 + 1} beads`, (P0[0] + Q[0]) / 2 - 0.3, (P0[1] + Q[1]) / 2 + 0.35, { size: 12, color: 'accent', align: 'right', weight: 700, plate: true });
            A.text(`${n2} beads`, (P1[0] + Q[0]) / 2 + 0.3, (P1[1] + Q[1]) / 2 + 0.35, { size: 12, color: 'orange', align: 'left', weight: 700, plate: true });
            A.corner('no perpetual motion ⇒ the two faces balance', 'tl', { size: 12, color: 'green', weight: 700 });
            B.setView([0, 1], [0, 1.25 * Math.max(L1, L2)]); B.setLabels(null, 'length of beads (units)'); B.setTitle('pull along each face');
            B.setTicks([], null);
            const bar = (x0, L, sn, col, lab) => {
              B.rect(x0, 0, x0 + 0.13, L, { fill: col, fillAlpha: 0.25, color: col, width: 1 });
              B.rect(x0 + 0.17, 0, x0 + 0.3, L * sn, { fill: col, fillAlpha: 0.7, stroke: false });
              B.text(lab, x0 + 0.15, L, { size: 11.5, color: col, align: 'center', baseline: 'bottom', dy: -4, weight: 700 });
            };
            bar(0.08, L1, s1, 'accent', 'left face'); bar(0.58, L2, s2, 'orange', 'right face');
            B.hline(Q[1] - P0[1], { color: 'green', width: 1.5, dash: [5, 4] });
            B.text('L sin θ = H on both faces', 0.5, (Q[1] - P0[1]) + 0.25, { size: 11.5, color: 'green', align: 'center', plate: true });
            v.legend([['accent', 'left-face beads: length L₁ (pale) and pull L₁ sin θ₁', { area: true }], ['orange', 'right face: L₂ and L₂ sin θ₂', { area: true }]]);
          }
          drawYears(v, C, [
            { t: -2580, label: 'Hatnub quarry ramp (Khufu)' },
            { t: -1880, label: 'Djehutihotep sledge painting' },
            { t: 60, label: 'Hero: five powers, wedge but no ramp', color: 'purple' },
            { t: 73, label: 'Masada siege ramp' },
            { t: 1586, label: 'Stevin’s wreath of spheres', color: 'green' },
            { t: 1600, label: 'Galileo, Le Mecaniche', color: 'green' },
          ], { lanes: 2, ticks: [-2500, -2000, -1500, -1000, -500, 1, 500, 1000, 1500] });
        });
        v.readout(() => {
          const mu = muS.value, phi = Math.atan(mu);
          if (mode.value === 'ramp') {
            const th = Math.atan2(H, TOP - foot.x), L = Math.hypot(H, TOP - foot.x);
            const F = Math.sin(th) + mu * Math.cos(th);
            return `slope ${v.fix(th / D2R, 1)}°, path $L = ${v.fix(L, 2)}$, height $H = ${H}$ · push $F/W = \\sin\\theta + \\mu\\cos\\theta = ${v.fix(F, 3)}$ · work $FL/(WH) = ${v.fix((F * L) / H, 3)}$ (frictionless: exactly 1) · force saved ${v.fix(1 / F, 2)}×, extra work ${v.fix(100 * ((F * L) / H - 1), 1)}% · holds itself if $\\tan\\theta \\le \\mu$: ${v.fix(Math.tan(th), 2)} vs ${v.fix(mu, 2)}`;
          }
          if (mode.value === 'wedge') {
            const al = Math.atan((shoulder.x - 6) / 4.2);
            return `half-angle $\\alpha = ${v.fix(al / D2R, 1)}°$, friction angle $\\varphi = ${v.fix(phi / D2R, 1)}°$ · side force per unit drive: ideal $1/(2\\tan\\alpha) = ${v.fix(1 / (2 * Math.tan(al)), 2)}$, with friction $1/(2\\tan(\\alpha+\\varphi)) = ${v.fix(1 / (2 * Math.tan(al + phi)), 2)}$ · ${al < phi ? '**self-locking** ($\\alpha < \\varphi$)' : 'not self-locking'}`;
          }
          const P0 = [1.2, 1.0], P1 = [10.8, 1.0], L1 = Math.hypot(apex.x - P0[0], apex.y - P0[1]), L2 = Math.hypot(apex.x - P1[0], apex.y - P1[1]), Hh = apex.y - 1;
          return `faces $L_1 = ${v.fix(L1, 2)}$, $L_2 = ${v.fix(L2, 2)}$ at $${v.fix(Math.asin(Hh / L1) / D2R, 1)}°$ and $${v.fix(Math.asin(Hh / L2) / D2R, 1)}°$ · pulls along the faces $\\propto L_1\\sin\\theta_1 = ${v.fix(Hh, 3)}$ and $L_2\\sin\\theta_2 = ${v.fix(Hh, 3)}$: **equal**, whatever the shape of the prism`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.4
    {
      num: '2.4',
      kind: 'Invention',
      name: 'The screw',
      credit: 'Hellenistic Mediterranean, by the 3rd century BCE; screw presses by the 1st century BCE',
      statement: String.raw`A **screw** is an inclined plane wrapped round a cylinder: a thread of **lead** $p$ (the advance per turn) on a cylinder of mean radius $r$ climbs at the lead angle $\lambda$ with $\tan\lambda = p/(2\pi r)$. Turned by a handle of radius $R$, it advances a distance $p$ per turn, so its ideal mechanical advantage is
$$\frac{2\pi R}{p}.$$
With thread friction (friction angle $\varphi$) a square thread has efficiency $\eta = \tan\lambda/\tan(\lambda+\varphi)$, and it is **self-locking**, holding its load when the handle is let go, when $\lambda \le \varphi$, which forces $\eta < 50\%$.

Hero of Alexandria (1st century CE) defined the screw as an inclined plane wound round a cylinder, counted it among his five powers, and described screw presses and a tap for cutting internal threads. Screw presses for olives and grapes were in use by the first century BCE.`,
      idea: String.raw`Unroll one turn of the thread and it becomes the hypotenuse of a right triangle with base $2\pi r$ and height $p$ (tech-2.3). The handle's end moves $2\pi R$ while the load moves $p$, and with no friction work in equals work out, so the force ratio is $2\pi R/p$. A fine thread and a long bar make the advantage enormous: a press with a 0.6 m bar and a 30 mm lead multiplies force about 125 times before friction.

Friction is what makes the screw useful as well as strong. The thread is a wedge with a small angle, and like a wedge it locks when its angle is below the friction angle (tech-2.3): the press stays tight while the operator rests, and a screw fastener does not unwind. The price is that more than half the input work goes into friction.`,
      caption: String.raw`Set the **lead** (advance per turn), the screw **diameter**, the **bar** length and the thread **friction**. The **unroll** slider peels one turn of the thread off the cylinder into the inclined plane it really is. The right panel plots efficiency against lead angle: the shaded zone is self-locking, and the dot is your screw. Make the lead coarse enough to leave the zone and the press would spin back under its own load.`,
      deps: ['tech-2.3'],
      refs: ['Mokyr ch. 2', 'Usher, A History of Mechanical Inventions, p. 98', 'Drachmann, The Mechanical Technology of Greek and Roman Antiquity (1963)'],
      tags: ['ancient', 'screw', 'friction'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Screw_(simple_machine)' },
      viz(v) {
        const A = v.stage({ x: [-3.4, 8.6], y: [-0.9, 6.4], equal: true, axes: false, height: 330, weight: 1.4, minWidth: 380, title: 'screw press and one unrolled turn' });
        const B = v.stage({ x: [0, 45], y: [0, 1], axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 280, xlabel: 'lead angle λ (°)', ylabel: 'efficiency η', title: 'efficiency and self-locking' });
        const C = yearStage(v, [-950, 1850], { height: 150, full: true, title: 'dated evidence: the screw' });
        const pS = v.slider('lead $p$ (mm per turn)', 4, 160, 30, { step: 1 });
        const dS = v.slider('screw diameter (mm)', 40, 200, 110, { step: 1 });
        const RS = v.slider('bar radius $R$ (m)', 0.2, 2, 0.6, { step: 0.05 });
        const muS = v.slider('thread friction $\\mu$', 0, 0.4, 0.15, { step: 0.01 });
        const uS = v.slider('unroll one turn', 0, 1, 1, { step: 0.01 });
        const push = 200; // N at the bar end
        const calc = () => {
          const p = pS.value / 1000, r = dS.value / 2000, R = RS.value, lam = Math.atan(p / (2 * Math.PI * r)), phi = Math.atan(muS.value);
          const eta = Math.tan(lam) / Math.tan(lam + phi), ideal = (2 * Math.PI * R) / p;
          return { p, r, R, lam, phi, eta, ideal, F: push * ideal * eta };
        };
        v.render(() => {
          const c = calc();
          // drawing units: cylinder radius 0.55, lead scaled with the true ratio p/r
          const rr = 0.55, pp = clamp(rr * (c.p / c.r), 0.12, 2.6), x0 = -1.2, z0 = 0.8, turns = Math.max(2, Math.floor(4.2 / pp));
          const zTop = z0 + turns * pp;
          // frame, platen, olives
          A.rect(x0 - 2.0, -0.6, x0 + 2.0, -0.35, { fill: 'muted', fillAlpha: 0.5, stroke: false });
          A.rect(x0 - 1.7, -0.35, x0 + 1.7, 0.05, { fill: 'green', fillAlpha: 0.35, color: 'green', width: 1 });
          A.text('olive pulp', x0, -0.15, { size: 10.5, color: 'ink', align: 'center', baseline: 'middle' });
          A.rect(x0 - 1.5, 0.05, x0 + 1.5, z0 - 0.2, { fill: 'orange', fillAlpha: 0.45, color: 'orange', width: 1.2 });
          for (const sx of [-1.95, 1.95]) A.rect(x0 + sx - 0.12, -0.35, x0 + sx + 0.12, zTop + 0.6, { fill: 'orange', fillAlpha: 0.3, color: 'orange', width: 1 });
          A.rect(x0 - 2.1, zTop - 0.1, x0 + 2.1, zTop + 0.25, { fill: 'orange', fillAlpha: 0.45, color: 'orange', width: 1.2 });
          // cylinder
          A.rect(x0 - rr, z0 - 0.2, x0 + rr, zTop + 0.9, { fill: 'muted', fillAlpha: 0.22, color: 'muted', width: 1 });
          // bar across the top
          A.line(x0 - 1.0, zTop + 0.7, x0 + 1.6 + 0.4 * RS.value, zTop + 0.7, { color: 'ink', width: 4 });
          A.arrow(x0 + 1.6 + 0.4 * RS.value, zTop + 0.35, x0 + 1.6 + 0.4 * RS.value, zTop + 0.95, { color: 'accent', width: 2.4 });
          A.text(`${push} N`, x0 + 1.6 + 0.4 * RS.value, zTop + 1.15, { size: 11.5, color: 'accent', align: 'center', weight: 700 });
          // helix (back half faint, front half solid) with the first turn morphing into the unrolled triangle
          const u = uS.value, tanl = c.p / (2 * Math.PI * c.r), base = Math.min(4.9, 3.4 / tanl), rise = base * tanl, tx = 1.7, tz = 2.2; // the unrolled turn, drawn at a fixed base (true slope)
          const helix = (s) => { // s in turns from the bottom; projected point and depth sign
            const a = 2 * Math.PI * s; return [x0 + rr * Math.sin(a), z0 + pp * s, Math.cos(a)];
          };
          for (let k = 0; k < turns * 80; k++) {
            const s1 = k / 80, s2 = (k + 1) / 80;
            if (s1 < 1 && u > 0) continue;
            const a = helix(s1), b = helix(s2), front = a[2] + b[2] > 0;
            A.line(a[0], a[1], b[0], b[1], { color: front ? 'ink' : 'muted', width: front ? 2.2 : 1, alpha: front ? 1 : 0.6 });
          }
          if (u > 0) {
            const pts = [];
            for (let k = 0; k <= 80; k++) {
              const s = k / 80, h = helix(s), flat = [tx + base * s, tz + rise * s];
              pts.push([h[0] + u * (flat[0] - h[0]), h[1] + u * (flat[1] - h[1])]);
            }
            A.path(pts, { color: 'gold', width: 2.6 });
            if (u > 0.98) {
              A.poly([[tx, tz], [tx + base, tz], [tx + base, tz + rise]], { fill: 'gold', fillAlpha: 0.15, color: 'gold', width: 1.2 });
              A.text(`2πr = ${v.fix(2 * Math.PI * c.r * 1000, 0)} mm`, tx + base / 2, tz - 0.3, { size: 12, color: 'ink', align: 'center' });
              A.text(`p = ${pS.value} mm`, tx + base + 0.12, tz + rise / 2, { size: 12, color: 'ink', align: 'left' });
              A.text(`λ = ${v.fix(c.lam / D2R, 1)}°`, tx + 1.2, tz + 0.25 + 0.1 * rise, { size: 12, color: 'gold', align: 'left', weight: 700 });
            }
          }
          A.text('one turn of thread = an inclined plane', tx + base / 2, tz + Math.max(rise, 0) + 0.6, { size: 11.5, color: 'gold', align: 'center' });
          A.arrow(x0, z0 - 0.15, x0, z0 - 0.6, { color: 'green', width: 3 });
          A.text(`${v.fmt(c.F / 1000, 3)} kN`, x0 + 0.15, 0.5 * (z0 - 0.2) + 0.35, { size: 12, color: 'green', align: 'left', weight: 700, plate: true });
          const locks = c.lam <= c.phi;
          A.corner(locks ? 'self-locking: the load cannot turn the screw back' : 'not self-locking: the load spins the screw back', 'tl', { size: 12, color: locks ? 'green' : 'red', weight: 700 });
          // B: efficiency curve
          const phiD = c.phi / D2R;
          if (phiD > 0) B.vband(0, Math.min(45, phiD), { color: 'green', alpha: 0.12 });
          B.fn((d) => (d <= 0 ? 0 : Math.tan(d * D2R) / Math.tan(d * D2R + c.phi)), { color: 'accent', width: 2.4, domain: [0.2, 45] });
          B.hline(0.5, { color: 'faint', width: 1, dash: [4, 3] });
          B.dot(c.lam / D2R, c.eta, { r: 5.5, color: locks ? 'green' : 'red' });
          if (phiD > 1.5) B.text('self-locking', phiD / 2, 0.93, { size: 11, color: 'green', align: 'center' });
          B.text('η = 50%', 44, 0.53, { size: 10.5, color: 'muted', align: 'right' });
          drawYears(v, C, [
            { t: [-911, -609], label: 'screw in Neo-Assyrian Mesopotamia', contested: true },
            { t: -234, label: 'water screw (Archimedes)' },
            { t: -50, label: 'screw presses in use' },
            { t: 60, label: 'Hero: screw = wound incline; tap', color: 'purple' },
            { t: 1450, label: 'Gutenberg’s screw press for printing' },
            { t: 1760, label: 'Wyatt screw-making machine' },
            { t: 1777, label: 'Ramsden screw-cutting lathe' },
          ], { lanes: 3, ticks: [-750, -500, -250, 1, 250, 500, 750, 1000, 1250, 1500, 1750] });
        });
        v.legend([['gold', 'one turn of thread, unrolled'], ['accent', 'efficiency η = tan λ / tan(λ + φ)'], ['green', 'self-locking zone λ ≤ φ', { area: true }]]);
        v.readout(() => {
          const c = calc();
          return `lead angle $\\lambda = \\arctan\\frac{p}{2\\pi r} = ${v.fix(c.lam / D2R, 2)}°$, friction angle $\\varphi = ${v.fix(c.phi / D2R, 1)}°$ · ideal advantage $2\\pi R/p = ${v.fmt(c.ideal, 4)}$ · efficiency **${v.fix(100 * c.eta, 1)}%** · ${push} N on the bar → **${v.fmt(c.F / 1000, 3)} kN** (${v.fmt(c.F / G / 1000, 3)} t-force) on the press · ${c.lam <= c.phi ? 'self-locking' : '**not self-locking**: back-drives under load'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.5
    {
      num: '2.5',
      kind: 'Invention',
      name: 'Pulleys and the block and tackle',
      credit: 'Egypt and Mesopotamia, early 2nd millennium BCE (single pulleys); compound tackle: Greek, by the 4th–3rd century BCE',
      statement: String.raw`A rope over a fixed pulley changes the direction of a force. A **block and tackle**, a rope reeved back and forth between a fixed block and a moving block carrying the load, divides the load between the $n$ rope segments that hold the moving block. With frictionless sheaves the tension is the same in every segment, so a pull
$$T = \frac{W}{n}$$
holds a load $W$, and the free end must be pulled $n$ times as far as the load rises. Every real sheave loses a fraction of the tension: with sheave efficiency $e$ the segment tensions fall as $T e^k$ along the rope, the advantage is $e + e^2 + \cdots + e^n$, and adding sheaves eventually stops helping, never exceeding $e/(1-e)$.

Pulleys appear in Egypt in the Twelfth Dynasty (1991–1802 BCE) and in Mesopotamia in the early second millennium BCE. Plutarch tells how Archimedes, with a compound pulley, single-handedly drew a loaded ship toward him (Marcellus 14); Vitruvius (*De architectura* X.2) names the three-sheave **trispastos** and five-sheave **pentaspastos** used on Roman building sites.`,
      idea: String.raw`Cut the rope segments just above the moving block: the block hangs in equilibrium from $n$ tensions (mech-1.14), so in the ideal case each carries $W/n$. The same conclusion follows from work (tech-2.1): raising the load by $h$ shortens each of the $n$ segments by $h$, so the free end moves $nh$, and the force must be $W/n$ for the work in to equal the work out.

Friction at each sheave means the rope leaving a sheave on the load side carries a little less tension than the rope arriving from the puller, $T_{k} = e\,T_{k-1}$. The segments nearest the free end therefore carry the most, and the ones near the dead end the least. When lowering, the ordering reverses and friction helps.`,
      caption: String.raw`Set the number of supporting segments $n$ and the sheave efficiency $e$, then **drag the gold handle** on the free end down to lift the load. Every segment is labelled with its tension and coloured by it. The free end moves $n$ times as far as the load. The right panel shows the actual mechanical advantage (green) falling away from the ideal $n$ (dashed) and levelling off at $e/(1-e)$. Switch to **lowering** to see friction help the puller.`,
      deps: ['tech-2.1', 'mech-1.14'],
      refs: ['Mokyr ch. 2', 'Vitruvius, De architectura X.2', 'Plutarch, Life of Marcellus 14'],
      tags: ['ancient', 'pulley', 'statics'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Block_and_tackle' },
      viz(v) {
        const A = v.stage({ x: [-3.6, 3.6], y: [-0.4, 10.4], equal: true, axes: false, height: 380, weight: 1.05, minWidth: 300, title: 'block and tackle' });
        const B = v.stage({ x: [0.5, 10.5], y: [0, 10.5], axes: 'box', gutter: true, height: 380, weight: 1, minWidth: 280, xlabel: 'supporting segments n', ylabel: 'mechanical advantage W/T', title: 'advantage against number of segments' });
        const C = yearStage(v, [-2100, 250], { height: 190, full: true, title: 'dated evidence: pulleys and tackle' });
        const nS = v.slider('supporting segments $n$', 1, 8, 4, { int: true });
        const eS = v.slider('sheave efficiency $e$', 0.8, 1, 0.94, { step: 0.005 });
        const mS = v.slider('load (kg)', 50, 3000, 600, { step: 10 });
        const dir = v.select('motion', [{ value: 'up', label: 'lifting' }, { value: 'down', label: 'lowering' }], 'up');
        const pullH = A.handle(-2.4, 1.8, { color: 'gold', label: 'pull', labelPos: 'w', constrain: (x, y) => [-2.4, clamp(y, 0.4, 3.0)] });
        const tens = () => {
          const n = nS.value, e = dir.value === 'up' ? eS.value : 1 / eS.value, W = mS.value * G;
          let s = 0; for (let k = 1; k <= n; k++) s += e ** k;
          const T0 = W / s; return { n, e, W, T0, T: Array.from({ length: n + 1 }, (_, k) => T0 * e ** k), MA: s };
        };
        v.render(() => {
          const t = tens(), n = t.n;
          const pulled = 3.0 - pullH.y, rise = pulled / n;
          const topY = 9.3, d = Math.min(0.62, 5.2 / (n + 1)), xs = (k) => -2.4 + k * d; // segment k = 0 (pull) … n
          const rs = d / 2;
          const botY = 4.0 + rise; // moving block sheave centre height
          // ceiling
          A.rect(-3.5, 9.9, 3.5, 10.3, { fill: 'muted', fillAlpha: 0.4, stroke: false });
          const tmax = Math.max(...t.T), col = (T) => v.mix('accent', 'red', clamp((T / tmax - 0.4) / 0.6, 0, 1));
          // fixed block frame
          const fixedIdx = [], movIdx = [];
          for (let k = 0; k < n; k++) (k % 2 === 0 ? fixedIdx : movIdx).push(k);
          const fx0 = xs(0) - 0.1, fx1 = xs(n - (n % 2 === 0 ? 1 : 0)) + 0.1;
          A.line((xs(0) + xs(Math.max(1, n))) / 2, 9.9, (xs(0) + xs(Math.max(1, n))) / 2, topY + rs + 0.15, { color: 'muted', width: 2 });
          A.rect(Math.min(fx0, xs(0)) - 0.05, topY - rs - 0.08, Math.max(fx1, xs(n)) + 0.05, topY + rs + 0.15, { fill: 'muted', fillAlpha: 0.12, color: 'muted', width: 1, radius: 4 });
          // moving block
          const loadW = 1.4 + 0.25 * Math.log10(mS.value / 50);
          if (n > 1) A.rect(xs(1) - 0.1, botY - rs - 0.08, xs(n - (n % 2 === 1 ? 1 : 0)) + 0.1, botY + rs + 0.08, { fill: 'muted', fillAlpha: 0.12, color: 'muted', width: 1, radius: 4 });
          const hookX = n === 1 ? xs(1) : (xs(1) + xs(n - (n % 2 === 1 ? 1 : 0))) / 2;
          // rope segments
          for (let k = 0; k <= n; k++) {
            const x = xs(k), T = t.T[k];
            let y0, y1;
            if (k === 0) { y0 = pullH.y; y1 = topY; }
            else { y0 = botY; y1 = topY; }
            if (k === n) { if (n % 2 === 0) { y1 = topY + rs; } else { y0 = botY - (n === 1 ? 0.4 : 0); } }
            A.line(x, y0, x, y1, { color: col(T), width: 2.4 + 2.2 * (T / tmax) });
            const ly = k === 0 ? (y0 + y1) / 2 + 0.6 : (y0 + y1) / 2 + (k % 2 ? 0.45 : -0.45);
            if (k > 0 || true) A.text(`${v.fmt(T / 1000, 3)}`, x, ly, { size: 10.5, color: 'ink', align: 'center', baseline: 'middle', plate: true });
          }
          // sheaves
          for (const k of fixedIdx) { const cx = (xs(k) + xs(k + 1)) / 2; A.circle(cx, topY, rs, { color: 'ink', width: 1.6, fill: 'panel', fillAlpha: 0.8 }); A.dot(cx, topY, { r: 2, color: 'ink' }); A.curve((s) => [cx + rs * Math.cos(s), topY + rs * Math.sin(s)], 0, Math.PI, { color: col(t.T[k]), width: 2.6 }); }
          for (const k of movIdx) { const cx = (xs(k) + xs(k + 1)) / 2; A.circle(cx, botY, rs, { color: 'ink', width: 1.6, fill: 'panel', fillAlpha: 0.8 }); A.dot(cx, botY, { r: 2, color: 'ink' }); A.curve((s) => [cx + rs * Math.cos(s), botY + rs * Math.sin(s)], Math.PI, 2 * Math.PI, { color: col(t.T[k]), width: 2.6 }); }
          // load
          const ly = (n === 1 ? botY - 0.4 : botY - rs - 0.08) - 0.5;
          A.line(hookX, ly + 0.5, hookX, ly + 0.0, { color: 'muted', width: 1.6 });
          block(A, hookX, ly - 1.0, loadW, 1.0, `${mS.value} kg`, { color: 'gold', fillAlpha: 0.5 });
          ground(A, -3.5, 3.5, 0);
          A.line(hookX + loadW / 2 + 0.15, 4.0 - 0.4 - 1.5 - (n === 1 ? 0.4 : rs + 0.08) + 0.4, hookX + loadW / 2 + 0.15, ly - 1.0 + 0.0, { color: 'green', width: 0 });
          A.text(`load rose ${v.fix(rise, 2)}`, 3.4, 0.45, { size: 11.5, color: 'green', align: 'right' });
          A.text(`pulled ${v.fix(pulled, 2)}`, -3.45, 0.45, { size: 11.5, color: 'gold', align: 'left' });
          A.text('tensions in kN', 3.4, 9.6, { size: 10.5, color: 'muted', align: 'right' });
          // B
          const e = t.e;
          B.fn((x) => x, { color: 'muted', width: 1.4, dash: [5, 4] });
          const ma = (k) => { let s = 0; for (let j = 1; j <= k; j++) s += e ** j; return s; };
          B.path(Array.from({ length: 10 }, (_, i) => [i + 1, ma(i + 1)]), { color: 'green', width: 2.2 });
          for (let k = 1; k <= 10; k++) B.dot(k, ma(k), { r: k === n ? 5.5 : 2.5, color: k === n ? 'green' : 'muted' });
          if (dir.value === 'up' && e < 1) { const lim = e / (1 - e); if (lim < 10.5) { B.hline(lim, { color: 'red', width: 1.2, dash: [3, 3] }); B.text(`limit e/(1−e) = ${v.fix(lim, 1)}`, 10.3, lim + 0.3, { size: 11, color: 'red', align: 'right' }); } }
          B.text('ideal: n', 8.6, 9.3, { size: 11, color: 'muted', align: 'right' });
          drawYears(v, C, [
            { t: [-1991, -1802], label: 'pulleys, Egypt (12th Dynasty)' },
            { t: [-2000, -1700], label: 'pulleys, Mesopotamia' },
            { t: [-330, -250], label: 'Mechanical Problems', color: 'purple' },
            { t: -240, label: 'Archimedes moves a ship (Plutarch)', contested: true },
            { t: -25, label: 'Vitruvius: trispastos, pentaspastos' },
            { t: 100, label: 'Haterii relief: crane with tackle' },
          ], { lanes: 4, ticks: [-2000, -1500, -1000, -500, 1] });
        });
        v.legend([['accent', 'rope (thicker, redder = more tension)'], ['green', 'actual advantage'], ['muted', 'ideal advantage n', { dash: true }]]);
        v.readout(() => {
          const t = tens(), W = t.W;
          const pulled = 3.0 - pullH.y;
          return `load ${v.fmt(W / 1000, 3)} kN on $n = ${t.n}$ segments · ideal pull $W/n$ = ${v.fmt(W / t.n / 1000, 3)} kN · actual pull **${v.fmt(t.T0 / 1000, 3)} kN** (advantage ${v.fix(t.MA, 2)}, efficiency ${v.fix((100 * t.MA) / t.n, 1)}%) · segment tensions from free end to dead end: ${t.T.slice(1).map((x) => v.fmt(x / 1000, 3)).join(', ')} kN · pulled ${v.fix(pulled, 2)} → load rises ${v.fix(pulled / t.n, 2)}; work in ${v.fmt(t.T0 * pulled / 1000, 3)}, work out ${v.fmt((W * pulled) / t.n / 1000, 3)} (kN × length)`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.6
    {
      num: '2.6',
      kind: 'Principle',
      name: 'Mechanical advantage and conservation of work',
      credit: 'Pseudo-Aristotle, Mechanical Problems (c. 300 BCE) and Hero of Alexandria; stated as conservation of work by Galileo, Le Mecaniche (c. 1600)',
      statement: String.raw`The **mechanical advantage** of a machine is the ratio of the load it moves to the effort applied, $MA = F_{\text{out}}/F_{\text{in}}$; its **velocity ratio** is the ratio of the distances moved, $VR = d_{\text{in}}/d_{\text{out}}$. For any machine, work in equals work out plus the work lost to friction:
$$F_{\text{in}}\,d_{\text{in}} = F_{\text{out}}\,d_{\text{out}} + W_{\text{loss}}, \qquad\text{so}\qquad MA = \eta\cdot VR \le VR .$$
No arrangement of simple machines can multiply work; what is gained in force is lost in distance. For machines in series both $VR$ and the efficiency $\eta$ multiply.

The Roman **treadwheel crane** is the ancient world's great compound machine: men walking inside a large wheel turn a drum that winds a rope running to a block and tackle. Vitruvius (*De architectura* X.2) describes the wheel "of such dimensions that men may walk therein" with a pentaspastos, and the tomb relief of the Haterii (Rome, late 1st century CE) shows one at work.`,
      idea: String.raw`Each stage obeys the law of the lever in its own form: the treadwheel is a wheel and axle with $VR = R_{\text{wheel}}/r_{\text{drum}}$ (tech-2.2), the tackle has $VR = n$ (tech-2.5). The rope that leaves one stage is the input of the next, so the force ratios multiply, and so do the distance ratios. By the work-energy theorem (mech-3.2) the only way the load can rise faster than the input energy allows is if energy appears from nowhere, which is why $MA \le VR$ and every friction loss shows up as $MA < VR$. The ancient writers saw this as a geometrical fact about circles and levers (the *Mechanical Problems*); Galileo in *Le Mecaniche* turned it into the principle that a machine saves force only by spending time and distance.`,
      caption: String.raw`A Roman treadwheel crane, animated. Choose the number of **men**, the **wheel** and **drum** diameters, the **tackle** and the load, and toggle **friction**. The ledger on the right balances the work put in by the walkers against the work done raising the stone plus the losses at each stage. The readout gives the velocity ratio, the actual advantage, the heaviest stone this crew can hold, and the lifting speed: a heavier stone is lifted only by walking farther.`,
      deps: ['tech-2.1', 'tech-2.3', 'tech-2.5', 'mech-3.2'],
      refs: ['Mokyr ch. 2', 'Vitruvius, De architectura X.2', 'Galileo, Le Mecaniche (c. 1600)', 'Landels, Engineering in the Ancient World (1978)'],
      tags: ['ancient', 'work', 'compound machine'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Treadwheel_crane' },
      viz(v) {
        const A = v.stage({ x: [-6.5, 10.6], y: [-0.8, 13.4], equal: true, axes: false, height: 380, weight: 1.35, minWidth: 360, title: 'treadwheel crane' });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 380, weight: 0.85, minWidth: 260, title: 'work ledger for this lift (kJ)' });
        const C = yearStage(v, [-400, 1700], { height: 150, full: true, title: 'dated evidence: compound machines and the principle of work' });
        const men = v.slider('men in the wheel', 1, 4, 2, { int: true });
        const Dw = v.slider('wheel diameter (m)', 2, 6, 4, { step: 0.1 });
        const dd = v.slider('drum diameter (m)', 0.15, 0.6, 0.3, { step: 0.01 });
        const tack = v.select('tackle', [{ value: 1, label: 'single rope' }, { value: 3, label: 'trispastos (3)' }, { value: 5, label: 'pentaspastos (5)' }], 5);
        const mS = v.slider('stone (kg)', 200, 8000, 3000, { step: 50 });
        const fric = v.toggle('friction', true);
        const HL = 8; // lift height (m)
        const MAN = 70, BETA = 30 * D2R, WALK = 0.6; // kg, walking position up the wheel, walking speed m/s (illustrative)
        const calc = () => {
          const n = +tack.value, R = Dw.value / 2, r = dd.value / 2, e = fric.value ? 0.95 : 1, ew = fric.value ? 0.92 : 1;
          let sum = 0; for (let k = 1; k <= n; k++) sum += e ** k; const etaT = sum / n; // tackle; jib-head sheave counted as one more sheave
          const etaJib = e, eta = ew * etaJib * etaT, VR = (n * R) / r, MA = eta * VR;
          const torque = men.value * MAN * G * R * Math.sin(BETA); const maxLoad = (torque / r) * ew * etaJib * sum / G; // kg
          const W = mS.value * G, out = W * HL, inp = out / eta;
          const lossT = inp * ew * etaJib * (1 - etaT), lossJ = inp * ew * (1 - etaJib), lossW = inp * (1 - ew);
          return { n, R, r, VR, MA, eta, maxLoad, out, inp, lossT, lossJ, lossW, walk: VR * HL, speed: WALK / VR, ok: mS.value <= maxLoad };
        };
        let liftT = 0;
        v.animate((t) => {
          const c = calc();
          const frac = c.ok ? (t % 13) / 10 : 0; liftT = clamp(frac, 0, 1); // one lift every 13 s of animation (the real lift is much slower: see the readout)
          const h = liftT * HL, ang = (liftT * c.walk) / c.R; // wheel rotation (rad)
          // ---- A: crane geometry (metres)
          ground(A, -6.4, 9.4, 0);
          const foot = [0, 0], head = [4.2, 12.2];
          A.line(foot[0] - 0.4, 0, head[0], head[1], { color: 'orange', width: 6 });
          A.line(foot[0] + 0.5, 0, head[0], head[1], { color: 'orange', width: 6, alpha: 0.7 });
          A.line(head[0], head[1], -6.0, 0, { color: 'muted', width: 1.2, dash: [5, 4] }); // back-stay
          // treadwheel at the foot, axis at height R + 0.2
          const cxw = -2.4, cyw = c.R + 0.25;
          A.circle(cxw, cyw, c.R, { color: 'orange', width: 3, fill: 'orange', fillAlpha: 0.07 });
          A.circle(cxw, cyw, c.R - 0.25, { color: 'orange', width: 1.2, alpha: 0.6 });
          for (let k = 0; k < 8; k++) { const a = ang + (k * Math.PI) / 4; A.line(cxw, cyw, cxw + (c.R - 0.25) * Math.cos(a), cyw + (c.R - 0.25) * Math.sin(a), { color: 'orange', width: 1.4, alpha: 0.7 }); }
          A.circle(cxw, cyw, c.r, { fill: 'muted', fillAlpha: 0.6, color: 'ink', width: 1.4 });
          // walkers at angle BETA up the wheel on the side that turns the drum
          for (let k = 0; k < men.value; k++) {
            const a = -Math.PI / 2 - BETA + (k - (men.value - 1) / 2) * 0.16, fx = cxw + (c.R - 0.25) * Math.cos(a), fy = cyw + (c.R - 0.25) * Math.sin(a);
            const up = [cxw - fx, cyw - fy], L = Math.hypot(...up), u = [up[0] / L, up[1] / L];
            const hd = [fx + 1.55 * u[0] * 0 + 0, fy + 1.55]; // stand upright
            const sw = 0.3 * Math.sin(4 * ang + 2 * k);
            A.line(fx, fy + 0.85, fx, fy + 1.45, { color: 'ink', width: 2.6 });
            A.circle(fx, fy + 1.65, 0.2, { fill: 'ink', fillAlpha: 1 });
            A.line(fx, fy + 0.85, fx + sw, fy, { color: 'ink', width: 2.2 }); A.line(fx, fy + 0.85, fx - sw, fy, { color: 'ink', width: 2.2 });
            A.line(fx, fy + 1.35, fx + 0.45, fy + 1.0, { color: 'ink', width: 2 });
            void hd;
          }
          // rope: drum → jib head → tackle → stone
          const sz = 0.8 + 0.25 * Math.log10(mS.value / 200), stoneTop = 0.02 + h + sz, hookY = stoneTop + 0.4, tackY = hookY + 0.5;
          A.line(cxw + c.r, cyw, head[0] - 0.25, head[1], { color: 'ink', width: 1.4 });
          A.circle(head[0], head[1], 0.28, { color: 'ink', width: 1.4, fill: 'panel', fillAlpha: 0.8 });
          const nn = c.n, spread = 0.13;
          for (let k = 0; k < nn; k++) { const x = head[0] + 0.15 + (k - (nn - 1) / 2) * spread; A.line(x, head[1] - 0.25, x, tackY, { color: 'ink', width: 1.1 }); }
          A.rect(head[0] + 0.15 - 0.4, tackY - 0.25, head[0] + 0.15 + 0.4, tackY + 0.1, { fill: 'muted', fillAlpha: 0.5, color: 'ink', width: 1 });
          A.line(head[0] + 0.15, tackY - 0.25, head[0] + 0.15, hookY - 0.4, { color: 'ink', width: 1.4 });
          block(A, head[0] + 0.15, 0.02 + h, 1.6 * sz, 1.0 * sz, `${v.fmt(mS.value / 1000, 2)} t`, { color: c.ok ? 'gold' : 'red', fillAlpha: 0.55 });
          A.rect(head[0] + 1.3, 0, head[0] + 4.6, HL, { fill: 'muted', fillAlpha: 0.25, color: 'muted', width: 1 }); A.text('wall being built', head[0] + 2.95, HL / 2, { size: 11, color: 'muted', align: 'center' });
          A.measure(9.2, 0.02, 9.2, 0.02 + h, '');
          A.text(`${v.fix(h, 1)} m`, 9.35, 0.02 + h / 2, { size: 11.5, color: 'green', align: 'left' });
          if (!c.ok) A.text(`too heavy: this crew holds at most ${v.fmt(c.maxLoad, 3)} kg`, 1.5, 6.6, { size: 12.5, color: 'red', align: 'center', weight: 700, plate: true });
          // ---- B: ledger (kJ), with the current lift fraction
          const f = c.ok ? liftT : 0, inp = c.inp * f / 1000, out = c.out * f / 1000;
          const full = c.inp / 1000, sc = 0.78 / full;
          const bar = (x, parts) => { let y = 0.08; for (const [val, col] of parts) { B.rect(x, y, x + 0.26, y + val * sc, { fill: col, fillAlpha: 0.6, stroke: false }); y += val * sc; } return y; };
          B.rect(0.14, 0.08, 0.40, 0.08 + full * sc, { color: 'muted', width: 1, dash: [4, 3] });
          B.rect(0.62, 0.08, 0.88, 0.08 + full * sc, { color: 'muted', width: 1, dash: [4, 3] });
          bar(0.14, [[inp, 'accent']]);
          bar(0.62, [[out, 'green'], [c.lossT * f / 1000, 'red'], [c.lossJ * f / 1000, 'pink'], [c.lossW * f / 1000, 'purple']]);
          B.text('walkers', 0.27, 0.04, { size: 11.5, color: 'ink', align: 'center', baseline: 'middle' });
          B.text('stone + losses', 0.75, 0.04, { size: 11.5, color: 'ink', align: 'center', baseline: 'middle' });
          B.text(`${v.fmt(inp, 3)}`, 0.27, 0.1 + inp * sc + 0.03, { size: 12, color: 'accent', align: 'center', weight: 700 });
          B.text(`${v.fmt(out + (c.lossT + c.lossJ + c.lossW) * f / 1000, 3)}`, 0.75, 0.1 + inp * sc + 0.03, { size: 12, color: 'green', align: 'center', weight: 700 });
          B.text('=', 0.51, 0.08 + Math.max(0.05, inp * sc / 2), { size: 18, color: 'ink', align: 'center', baseline: 'middle' });
        }, { period: 1e9, still: 7 });
        v.render(() => {
          drawYears(v, C, [
            { t: [-330, -250], label: 'Mechanical Problems', color: 'purple' },
            { t: -25, label: 'Vitruvius X.2: treadwheel crane' },
            { t: 60, label: 'Hero, Mechanica', color: 'purple' },
            { t: 100, label: 'Haterii relief, Rome' },
            { t: 1600, label: 'Galileo, Le Mecaniche', color: 'green' },
          ], { lanes: 2, ticks: [-250, 1, 250, 500, 750, 1000, 1250, 1500] });
        });
        v.legend([['accent', 'work by the walkers', { area: true }], ['green', 'work raising the stone (mgh)', { area: true }], ['red', 'tackle friction', { area: true }], ['pink', 'jib-head sheave', { area: true }], ['purple', 'wheel bearing', { area: true }]]);
        v.readout(() => {
          const c = calc();
          return `velocity ratio $VR = n\\,R/r = ${c.n}\\times${v.fix(c.R, 2)}/${v.fix(c.r, 3)} = ${v.fix(c.VR, 1)}$ · efficiency ${v.fix(100 * c.eta, 1)}% → $MA = ${v.fix(c.MA, 1)}$ · ${men.value} walkers (70 kg, 30° up the wheel) hold at most **${v.fmt(c.maxLoad, 3)} kg** · to lift ${HL} m they walk ${v.fmt(c.walk, 3)} m; at ${WALK} m/s the stone rises ${v.fmt(c.speed * 60, 3)} m per minute · work in ${v.fmt(c.inp / 1000, 4)} kJ = out ${v.fmt(c.out / 1000, 4)} kJ + losses ${v.fmt((c.inp - c.out) / 1000, 4)} kJ · modern estimates for a Roman polyspastos: about 3 t with a winch and 6 t with a treadwheel (figures quoted in Wikipedia, not verified at source); walker numbers here are illustrative`;
        });
      },
    },
  ],
};
