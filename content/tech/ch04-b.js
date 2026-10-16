// History of Technology — Chapter 4: Building, water and power before steam (items 4.7–4.12; 4.1–4.6 are in ch04.js)
import { yearStage, drawYears, RHO, G, undershotP, overshotP, plate, windCp, BETZ } from './ch04.shared.js';

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const D2R = Math.PI / 180;
const smooth = (s) => s * s * (3 - 2 * s);

// ---------------------------------------------------------------- 4.7: the trip hammer, one steady cycle
/**
 * A hammer on a pivoted helve, head mass as a point at arm length L, lifted by lugs on a shaft. theta = elevation of the head above the anvil (rad).
 * Each lug lifts the tail for a fraction `frac` of the lug period T (smooth rise for the first 70% of its contact, then it slips off), so the head is thrown
 * up to thmax and falls freely (theta'' = −(g/L) cos theta) unless the next lug catches it first. Returns the last of five simulated cycles.
 */
function hammerCycle(k, rpm, frac, thmax, L) {
  const T = 60 / (rpm * k), tL = frac * T, N = 1500, dt = T / N, ncyc = 5, out = [];
  const prof = (tt) => { const f = tt / tL; return f >= 0 && f < 0.7 ? thmax * smooth(f / 0.7) : 0; };
  let a = 0, w = 0, impacts = [];
  for (let c = 0; c < ncyc; c++) {
    impacts = [];
    for (let i = 0; i < N; i++) {
      const tt = i * dt, cam = prof(tt), a0 = a;
      w += -(G / L) * Math.cos(a) * dt; a += w * dt;
      if (a <= 0) { if (a0 > 1e-9 && w < 0) impacts.push({ v: -w * L, t: tt }); a = 0; w = 0; }
      if (a < cam) { a = cam; w = Math.max(0, (prof(tt + dt) - cam) / dt); }
      if (c === ncyc - 1) out.push([tt, a, cam]);
    }
  }
  const vImp = impacts.length ? Math.max(...impacts.map((q) => q.v)) : 0;
  return { T, tL, samples: out, vImp, hit: impacts.length > 0, tHit: impacts.length ? impacts[0].t : null, dt };
}

// ---------------------------------------------------------------- 4.11: flat-plate sail on a boat
/** Force (in units of ½ρA = 1, true wind speed 1) of a thin flat sail with chord direction c in an apparent wind A. */
function sailForce(A, c) {
  const sp = Math.hypot(A[0], A[1]); if (sp < 1e-9) return [0, 0];
  const Ah = [A[0] / sp, A[1] / sp];
  const alpha = Math.acos(clamp(Math.abs(Ah[0] * c[0] + Ah[1] * c[1]), 0, 1));
  let n = [-c[1], c[0]]; if (n[0] * Ah[0] + n[1] * Ah[1] < 0) n = [-n[0], -n[1]];
  let Lh = [-Ah[1], Ah[0]]; if (Lh[0] * n[0] + Lh[1] * n[1] < 0) Lh = [-Lh[0], -Lh[1]];
  const { CL, CD } = plate(alpha);
  return [sp * sp * (CD * Ah[0] + CL * Lh[0]), sp * sp * (CD * Ah[1] + CL * Lh[1])];
}
/** Steady boat speed (true wind 1, blowing toward −y) at heading gamma from dead upwind, with the sail trimmed to the best chord angle in [dmin, 90°] to the boat axis; hull drag = ch v². */
function boatSpeed(gamma, dmin, ch) {
  const b = [Math.sin(gamma), Math.cos(gamma)];
  const fwd = (v) => {
    const A = [-v * b[0], -1 - v * b[1]];
    let best = -1e9, bd = dmin;
    for (let d = dmin; d <= 90.001 * D2R * 1; d += 3 * D2R) for (const sg of [-1, 1]) {
      const cc = Math.cos(sg * d), ss = Math.sin(sg * d);
      const c = [-(b[0] * cc - b[1] * ss), -(b[0] * ss + b[1] * cc)];
      const F = sailForce(A, c), fw = F[0] * b[0] + F[1] * b[1];
      if (fw > best) { best = fw; bd = sg * d; }
    }
    return { fw: best, d: bd };
  };
  const f = (v) => fwd(v).fw - ch * v * v;
  if (f(0) <= 0) return { v: 0, d: fwd(0).d };
  let lo = 0, hi = 4; for (let v = 0.05; v <= 4; v += 0.05) { if (f(v) < 0) { hi = v; break; } lo = v; }
  for (let i = 0; i < 25; i++) { const mid = (lo + hi) / 2; if (f(mid) > 0) lo = mid; else hi = mid; }
  return { v: lo, d: fwd(lo).d };
}

export default {
  collection: 'tech',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.7
    {
      num: '4.7',
      kind: 'Invention',
      name: 'The cam and the trip hammer',
      credit: 'Water-driven pestles and hammers are reported from Han China (first century CE or earlier, interpretations differ); mechanised forge hammers are recorded in Europe from the 12th century',
      verify: true,
      statement: String.raw`A **cam** is a projection on a rotating shaft that lifts a follower and then lets it go; it turns steady rotation into a repeated up-and-down motion. A **trip hammer** is the classic use: a pivoted beam (the helve) carries a heavy head at one end, and lugs on a shaft (a cam shaft turned by a water wheel, 4.4) press down the other end, lift the head and slip off, so that the head drops under gravity on the work. The same arrangement drives the stamps of a fulling mill, which pounded cloth, and the bellows of a forge.

What the sources support: Chinese texts of the Han period, among them Huan Tan's *Xin Lun* (about 20 CE), describe water-driven pestles (although one reading is that they describe a water lever, not a trip hammer), and later work on Han burial models shows vertical water wheels powering batteries of hammers. In Europe, records from Styria (1135 and 1175) and France (1116 and 1249) mention mechanised trip hammers on forges; a claim for a Roman fulling mill rests on a translation that is doubtful. The head of a tilt hammer was limited to about 50 kg, but the stroke rate could be high.

Scope of the picture: the head is a point mass on a massless arm, the lug profile is a made-up smooth lift, there is no rebound, and the numbers are those of a typical small mill chosen for illustration.`,
      idea: String.raw`Raising the head by $h$ stores $mgh$ (mech-3.1); letting it go converts that to speed $v=\sqrt{2gh}$ at the anvil, and the blow is that kinetic energy. The shaft only has to supply the lift, and the water wheel supplies it at a steady rate: mean power = energy per blow times blows per second, where blows per second = (lugs per turn) × (turns per second). The cam profile sets how smoothly the head is lifted, and the release shape sets how cleanly it drops.

What limits the stroke rate is the fall. The head needs a time $t_\mathrm{fall}$ of order $\sqrt{L/g}$ to come down; the next lug arrives after $T=1/(\text{lugs}\times\text{turns/s})$. If $T$ is shorter than the fall the lug catches the head in mid-air, the blow is weaker, and then there is none at all. That is why a mill with many lugs on a slow shaft and a mill with few lugs on a fast shaft give different blows at the same number of strokes.`,
      caption: String.raw`Left: the cam shaft (turning) and the helve; the head is raised by each lug and drops. Right: the timing diagram for one lug period — the lug's lift (orange dashed) and the head's elevation (green), with the blow marked. Set the **lugs**, the **shaft speed**, the **lug width** (how long each lug stays in contact) and the **lift**. Speed the shaft up with many lugs until the head cannot fall before the next lug catches it: the blows weaken and then stop.`,
      deps: ['tech-4.4', 'mech-3.1'],
      see: ['tech-2.10', 'tech-4.6'],
      refs: ['Mokyr ch. 3', 'Needham, Science and Civilisation in China 4.2 and Lewis (1997), as cited by Wikipedia “Trip hammer”'],
      tags: ['medieval', 'prime mover', 'mechanism'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Trip_hammer' },
      viz(v) {
        const A = v.stage({ x: [-1.2, 3.1], y: [-1.0, 1.6], equal: true, axes: false, height: 300, weight: 1, minWidth: 320, title: 'cam shaft and helve' });
        const B = v.stage({ x: [0, 1], y: [0, 30], axes: 'box', gutter: true, height: 300, weight: 1, minWidth: 320, xlabel: 'time within one lug period (s)', ylabel: 'elevation of the head (°)', title: 'timing diagram' });
        const nL = v.slider('lugs on the shaft', 1, 8, 4, { int: true });
        const rpm = v.slider('shaft speed (turns/min)', 2, 40, 12, { step: 0.5 });
        const frac = v.slider('lug contact (fraction of period)', 0.1, 0.8, 0.4, { step: 0.01 });
        const lift = v.slider('lift of the head (°)', 10, 40, 25, { step: 1 });
        const mass = v.slider('head mass (kg)', 10, 100, 50, { step: 1 });
        const L = 1.2; // arm to the head, m
        let cyc = null, key = '';
        v.animate((t) => {
          const k = nL.value, th = lift.value * D2R, kk = `${k}|${rpm.value}|${frac.value}|${lift.value}`;
          if (kk !== key) { key = kk; cyc = hammerCycle(k, rpm.value, frac.value, th, L); }
          const T = cyc.T, tau = t % T, idx = clamp(Math.floor((tau / T) * cyc.samples.length), 0, cyc.samples.length - 1);
          const a = cyc.samples[idx][1];
          // helve: pivot P, tail to the left, head to the right
          const P = [0.9, 0.2], Lt = 0.8, Lh = 1.5, ca = Math.cos(a), sa = Math.sin(a);
          const head = [P[0] + Lh * ca, P[1] + Lh * sa], tail = [P[0] - Lt * ca, P[1] - Lt * sa];
          A.line(-1.2, -0.75, 3.1, -0.75, { color: 'muted', width: 2 });
          A.rect(1.9, -0.75, 2.9, -0.55, { fill: 'muted', fillAlpha: 0.4, color: 'muted', width: 1.2 }); A.text('anvil', 2.4, -0.9, { size: 10.5, color: 'muted', align: 'center', baseline: 'top' });
          A.line(P[0], P[1], P[0], -0.75, { color: 'muted', width: 4 }); A.dot(P[0], P[1], { r: 4, color: 'ink' });
          A.line(tail[0], tail[1], head[0], head[1], { color: 'ink', width: 5, alpha: 0.85 });
          A.rect(head[0] - 0.13, head[1] - 0.13, head[0] + 0.13, head[1] + 0.13, { fill: 'accent', fillAlpha: 0.5, color: 'accent', width: 2 });
          // shaft: lugs; contact point is straight below the shaft centre
          const S = [P[0] - Lt, P[1] + 0.62], rs = 0.18, rl = 0.62, Wl = (cyc.tL / cyc.T) * (360 / k);
          const base = -90 - Wl / 2 + (tau / cyc.T) * (360 / k);
          A.circle(S[0], S[1], rs, { fill: 'muted', fillAlpha: 0.4, color: 'muted', width: 1.5 });
          for (let i = 0; i < k; i++) { const ang = (base + (i * 360) / k) * D2R; A.line(S[0] + rs * Math.cos(ang), S[1] + rs * Math.sin(ang), S[0] + rl * Math.cos(ang), S[1] + rl * Math.sin(ang), { color: 'orange', width: 6 }); }
          A.text('cam shaft', S[0], S[1] + 0.82, { size: 10.5, color: 'muted', align: 'center' });
          A.arrow(S[0] - 0.4, S[1] + 0.5, S[0] - 0.4, S[1] + 0.2, { color: 'muted', width: 1.4, head: 6 });
          if (a < 0.003 && cyc.hit) A.text('blow', head[0] + 0.3, head[1] + 0.25, { size: 11, color: 'red', weight: 700 });
          // timing diagram
          B.setView([0, T], [0, Math.max(30, lift.value * 1.15)]);
          B.path(cyc.samples.map((s) => [s[0], s[2] / D2R]), { color: 'orange', width: 2, dash: [5, 3] });
          B.path(cyc.samples.map((s) => [s[0], s[1] / D2R]), { color: 'green', width: 2.6 });
          B.vline(tau, { color: 'gold', width: 1.2, dash: [4, 3] });
          if (cyc.hit) B.dot(cyc.tHit, 0, { r: 6, color: 'red' });
        }, { period: 1e9, still: 0.9 });
        v.legend([['orange', 'lift given by the lug', { dash: [5, 3] }], ['green', 'elevation of the head'], ['red', 'blow', { dot: true }]]);
        v.readout(() => {
          const k = nL.value, th = lift.value * D2R, m = mass.value, c = cyc || hammerCycle(k, rpm.value, frac.value, th, L);
          const h = L * Math.sin(th), eFall = m * G * h, eHit = 0.5 * m * c.vImp * c.vImp, rate = (k * rpm.value) / 60;
          return `lugs ${k} × ${v.fix(rpm.value, 1)} turns/min = **${v.fix(60 * rate, 0)} blows/min**; lift ${v.fix(h, 2)} m, so a full drop would carry $mgh=${v.fix(eFall, 0)}$ J at ${v.fix(Math.sqrt(2 * G * h), 2)} m/s\nthis cycle: ${c.hit ? `blow at **${v.fix(c.vImp, 2)} m/s**, ${v.fix(eHit, 0)} J (${v.fix(100 * eHit / eFall, 0)}% of a full drop)` : '**the head is caught before it lands: no blow**'}; lug period ${v.fix(1000 * c.T, 0)} ms · mean power into the blows ${v.fix(eHit * rate, 0)} W (illustrative masses and arm)`;
        });
      },
    },

    // ------------------------------------------------------------------ 4.8
    {
      num: '4.8',
      kind: 'Invention',
      name: 'The heavy plough and the horse collar',
      credit: 'Early medieval northern Europe (heavy plough); horse collar: earliest secure depiction in China, 5th century CE (Dunhuang), and in Europe c. 800–1000. Both the dates and the size of their effects are disputed',
      verify: true,
      statement: String.raw`The **heavy plough** has a vertical **coulter** to cut the sod, a **share** to cut it from below and a **mouldboard** to turn it over, so it opens a deep furrow in wet, heavy soils where the older scratch plough (the ard) only scored the surface. It needs a strong team. The **horse collar** is a padded, stiff ring resting on a horse's shoulders, so that the horse pulls with its chest and shoulders and not against its windpipe.

The historical claim associated with Lynn White Jr. (*Medieval Technology and Social Change*, 1962) is that these inventions, together with the horseshoe, let medieval Europe plough the heavy northern soils and raised agricultural output, and that the collar multiplied a horse's useful pull. How much of this survives is disputed. The idea that the older throat-and-girth harness choked the horse goes back to Lefebvre des Noëttes (1931), and a test attributed to him is quoted as limiting two horses to about 1100 lb against about 1½ tons for one horse in a collar (as cited by Needham). Reconstructions by Spruytte (published 1977 and 1983), working with M. Littauer, found that ancient harnesses, correctly fitted, let a horse pull nearly as much; on that view the collar's real gain was a lower point of attachment, which suited ploughing. The modest effect of the collar is also argued by Weller. I could not check the original measurements, so the two views below are presented as claims, not data.

What the picture does compute is statics. The trace from the harness to the plough's clevis is a straight line; the pull along it has a horizontal part that the soil resists and a vertical part that depends on how high the horse's attachment is above the clevis. The numbers for soil resistance and the pull of an animal are illustrative round figures.`,
      idea: String.raw`The plough needs a horizontal force $D$ to cut and turn a furrow of cross-section $A_f$ (depth times width): $D=k A_f$, with a specific draught $k$ that depends on soil and moisture and is tens of kilonewtons per square metre in field trials of modern mouldboard ploughs. Deeper furrows in heavier soils need more animals.

The trace carries a tension $F$ at an angle $\vartheta$ to the horizontal, so the horizontal part is $F\cos\vartheta=D$ and the vertical part is $F\sin\vartheta=D\tan\vartheta$ (arch-1.2): when the horse's attachment is higher than the clevis it lifts the plough and loads the horse's shoulders downward. A lower attachment reduces both. Whether a team can supply $D$ depends on the pull each animal can keep up over the working day, often put at about a tenth of its weight at walking pace (a rule of thumb from secondary sources), and on how much of that the harness lets the animal use: a factor of 1 in the Spruytte view, much less in Lefebvre's.`,
      caption: String.raw`Left: the side view of a plough team. Drag the **orange attachment** point on the horse (the harness) up and down, and the **gold clevis** on the plough beam: the trace tilts, the pull $F$ grows as $D/\cos\vartheta$, and the vertical part lifting the plough (or pressing down the horse) appears. Right: how many animals a furrow needs as it deepens. Choose the **harness view**: Lefebvre's (a horse in the old harness delivers about a fifth of its pull; set from the quoted test ratio) or Spruytte's (nearly all of it). The horse's speed is taken as 1.5 times an ox's, as secondary sources say, so the area ploughed per day differs too.`,
      deps: ['tech-1.8', 'tech-3.3', 'arch-1.2'],
      see: ['tech-4.9', 'mech-1.15'],
      refs: ['Mokyr ch. 3', 'White, Medieval Technology and Social Change (Oxford: Clarendon, 1962)', 'Spruytte, Early Harness Systems (London: Allen, 1983)', 'Weller, Roman Traction Systems (online), and Needham (1986) as cited by Wikipedia “Horse collar”'],
      tags: ['medieval', 'agriculture', 'disputed'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Horse_collar' },
      viz(v) {
        const A = v.stage({ x: [-0.6, 5.2], y: [-0.2, 2.1], equal: true, axes: false, height: 300, weight: 1.15, minWidth: 340, title: 'line of draught' });
        const B = v.stage({ x: [5, 30], y: [0, 14], axes: 'box', gutter: true, height: 300, weight: 1, minWidth: 320, xlabel: 'furrow depth (cm)', ylabel: 'animals needed', title: 'team size' });
        const view = v.select('harness view', [{ value: 'L', label: 'Lefebvre: old harness weak' }, { value: 'S', label: 'Spruytte: nearly equal' }], 'S');
        const kS = v.slider('soil resistance $k$ (kN/m²)', 20, 80, 45, { step: 1 });
        const wF = v.slider('furrow width (cm)', 15, 40, 25, { step: 1 });
        const depth = v.slider('furrow depth (cm)', 5, 30, 18, { step: 1 });
        const ha = A.handle(0.8, 1.35, { color: 'orange', r: 8, label: 'harness', labelPos: 'ne', constrain: { x: [0.8, 0.8], y: [0.8, 1.7] } });
        const hc = A.handle(4.3, 0.55, { color: 'gold', r: 8, label: 'clevis', labelPos: 'ne', constrain: { x: [4.3, 4.3], y: [0.15, 1.2] } });
        const PULL = { horse: 450 * G * 0.1, ox: 600 * G * 0.1 }; // sustained pull, N (illustrative: a tenth of body weight)
        v.render(() => {
          const eff = view.value === 'L' ? 550 / 3000 : 1;
          const D = kS.value * 1000 * (depth.value / 100) * (wF.value / 100);
          const dx = hc.x - ha.x, dy = ha.y - hc.y, th = Math.atan2(dy, dx), F = D / Math.cos(th), Fv = D * Math.tan(th);
          // horse (facing left): body, legs, head
          A.poly([[0.5, 1.15], [0.55, 1.45], [0.9, 1.5], [1.9, 1.4], [2.1, 1.0], [1.9, 0.75], [0.7, 0.8]], { fill: 'muted', fillAlpha: 0.25, color: 'muted', width: 1.4 });
          A.poly([[0.55, 1.45], [0.15, 1.65], [0.0, 1.5], [0.2, 1.25], [0.5, 1.2]], { fill: 'muted', fillAlpha: 0.25, color: 'muted', width: 1.4 });
          for (const x of [0.65, 0.85, 1.7, 1.9]) A.line(x, 0.8, x, 0, { color: 'muted', width: 2.5 });
          A.line(-0.6, 0, 5.2, 0, { color: 'muted', width: 2.5 });
          // plough
          A.path([[hc.x, hc.y], [4.0, 0.3], [3.7, 0.0]], { color: 'ink', width: 3 });
          A.poly([[3.7, 0], [4.1, 0], [3.95, -0.12]], { fill: 'ink', fillAlpha: 0.6, color: 'ink', width: 1 });
          A.line(4.0, 0.3, 4.9, 1.0, { color: 'ink', width: 3 });
          A.text('plough', 4.6, 1.2, { size: 11, color: 'muted' });
          A.rect(2.6, -0.2, 3.7, 0, { fill: 'orange', fillAlpha: 0.18, stroke: false }); A.text('furrow', 3.15, -0.15, { size: 10, color: 'muted', align: 'center' });
          // trace and components
          A.line(ha.x, ha.y, hc.x, hc.y, { color: 'accent', width: 3 });
          const sc = 1.3 / Math.max(F, 1);
          A.arrow(hc.x, hc.y, hc.x - D * sc, hc.y, { color: 'green', width: 2, head: 7 });
          A.arrow(hc.x - D * sc, hc.y, hc.x - D * sc, hc.y + Fv * sc, { color: 'red', width: 2, head: 7 });
          A.text(`D = ${v.fix(D / 1000, 2)} kN`, hc.x - D * sc / 2, hc.y - 0.12, { size: 10.5, color: 'green', align: 'center', baseline: 'top', plate: true });
          if (Math.abs(Fv) > 30) A.text(`${Fv >= 0 ? 'lift' : 'push'} ${v.fix(Math.abs(Fv) / 1000, 2)} kN`, hc.x - D * sc - 0.08, hc.y + Fv * sc / 2, { size: 10.5, color: 'red', align: 'right', plate: true });
          A.text(`angle ${v.fix(th / D2R, 1)}°`, 2.6, 0.95, { size: 11, color: 'accent', align: 'center', plate: true });
          A._D = D; A._F = F; A._Fv = Fv; A._th = th;
          // team size curve
          const dd = (x) => kS.value * 1000 * (x / 100) * (wF.value / 100);
          B.fn((x) => dd(x) / PULL.ox, { color: 'orange', width: 2.4 });
          B.fn((x) => dd(x) / (PULL.horse * eff), { color: 'green', width: 2.4 });
          B.fn((x) => dd(x) / PULL.horse, { color: 'accent', width: 1.6, dash: [5, 3] });
          B.vline(depth.value, { color: 'gold', width: 1.2, dash: [4, 3] });
          B.text('oxen', 29.5, dd(29) / PULL.ox - 0.3, { size: 11, color: 'orange', align: 'right', baseline: 'top', plate: true });
          B.text(view.value === 'L' ? 'horses, old harness' : 'horses, old harness = collar', 29.5, dd(29) / (PULL.horse * eff) + 0.3, { size: 11, color: 'green', align: 'right', baseline: 'bottom', plate: true });
          if (view.value === 'L') B.text('horses, collar', 29.5, dd(29) / PULL.horse + 0.3, { size: 11, color: 'accent', align: 'right', baseline: 'bottom', plate: true });
          B._eff = eff;
        });
        v.legend([['accent', 'trace'], ['green', 'draught $D$ (soil)'], ['red', 'vertical part'], ['orange', 'oxen team'], ['gold', 'chosen depth', { dash: [4, 3] }]]);
        v.readout(() => {
          const D = A._D, eff = B._eff, nOx = D / PULL.ox, nH = D / (PULL.horse * eff), nHc = D / PULL.horse;
          const area = (spd) => (wF.value / 100) * spd * 6 * 3600 / 10000;
          return `furrow ${v.fix(depth.value, 0)} × ${v.fix(wF.value, 0)} cm needs a draught of **${v.fix(D / 1000, 2)} kN**; the trace is at ${v.fix(A._th / D2R, 1)}°, so the tension is ${v.fix(A._F / 1000, 2)} kN and the vertical part ${v.fix(A._Fv / 1000, 2)} kN\nanimals needed (a tenth of the body weight each: 590 N horse, 590 N ox): oxen **${v.fix(nOx, 1)}**, horses **${v.fix(nH, 1)}** (${v.fix(nHc, 1)} with a collar) · ploughed in six hours: oxen ${v.fix(area(0.67), 2)} ha, horses ${v.fix(area(1), 2)} ha (illustrative speeds 0.67 and 1 m/s)`;
        });
      },
    },

    // ------------------------------------------------------------------ 4.9
    {
      num: '4.9',
      kind: 'Invention',
      name: 'The stirrup',
      credit: 'China, 3rd–4th century CE (a single mounting stirrup in a Jin tomb figurine of 302 CE; paired riding stirrups from the 320s–415 CE); spread west through Central Asia from the 6th century',
      verify: true,
      statement: String.raw`A **stirrup** is a footrest hung from the saddle. The earliest datable evidence comes from China: a funerary figurine from a Western Jin tomb near Changsha (302 CE) shows a single stirrup, too short for riding and probably a mounting aid; a double-sided riding stirrup is shown from a tomb near Nanjing (322 CE), and the earliest surviving pair comes from the tomb of Feng Sufu (415 CE). An iron stirrup from Mongolia has a radiocarbon range of 243–405 CE, so the earliest date is not settled. Stirrups reached eastern Europe with Central Asian horsemen, the Avars, around the end of the 6th century, and were adopted widely in the West in the 8th century (an archaeological count finds them in only 13 of 704 eighth-century male graves in Germany).

In 1962 Lynn White Jr. argued that the stirrup made mounted shock combat possible (the rider and horse becoming one body behind the lance) and thereby caused feudalism. Most historians have since rejected that chain of causes: Bullough and Bachrach argued that the stirrup gave little advantage in shock combat and chiefly helped the rider to keep his seat and to mount, and mounted lancers existed long before it.

The picture below is a **model** of one question, what the stirrup could add when a couched lance strikes a target. Its parameters are my assumptions and the conclusion depends on them; it is a way to test the argument, not evidence for either side.`,
      idea: String.raw`When a rider on a galloping horse strikes a target of mass $m_t$ and the lance does not give way, the impulse delivered is the change in momentum of everything that moves with the lance: $J=\mu v$ with the reduced mass $\mu = m_a m_t/(m_a+m_t)$ (a perfectly inelastic blow, mech-2.6). If only the rider's body is behind the lance, $m_a=m_r$; if the rider is locked to the horse, $m_a=m_r+m_h$, which is several times larger.

To use the horse's mass the rider must hold on: the whole force must pass between the rider and the saddle. Without stirrups the rider can transmit a force limited by friction at the seat and grip, $F_\mathrm{max}=\mu_s (m_rg+N_\mathrm{grip})$ (mech-1.15); with stirrups the rider can also brace with the legs. A blow that lasts $\Delta t$ needs a force of about $J/\Delta t$. For a short blow the seat cannot hold, and the stirrup adds only a modest extra force; for a long one (a lance that bends, a charge that drives through) both reach the same full impulse. That is the shape of the modern argument.`,
      caption: String.raw`The curves give the impulse delivered to the target against the duration of the blow, for a rider held by the seat alone (red) and a rider who can also brace in stirrups (green); the dashed ceilings are the rider alone and the rider locked to the horse. The vertical line is the duration you set. Change the **grip**, the **leg bracing** and the **speed**. Make the blow long and the two curves meet; make it short and the horse's mass cannot be used either way. Below, the dated evidence for the stirrup (hollow and dashed where the date is disputed).`,
      deps: ['mech-2.1', 'mech-1.15'],
      see: ['tech-4.8', 'mech-2.6'],
      refs: ['Mokyr ch. 3', 'White, Medieval Technology and Social Change (1962)', 'Bachrach 1970 and Bullough 1970, as cited by Wikipedia “Stirrup”'],
      tags: ['medieval', 'disputed', 'mechanics'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Stirrup' },
      viz(v) {
        const A = v.stage({ x: [0, 0.3], y: [0, 700], axes: 'box', gutter: true, height: 300, weight: 1.15, minWidth: 340, xlabel: 'duration of the blow (s)', ylabel: 'impulse delivered (N s)', title: 'impulse against blow duration' });
        const B = yearStage(v, [150, 820], { height: 190, full: true, title: 'dated evidence' });
        const speed = v.slider('closing speed (m/s)', 3, 12, 7, { step: 0.5 });
        const grip = v.slider('grip force (N)', 0, 1500, 300, { step: 10 });
        const brace = v.slider('leg bracing in stirrups (× body weight)', 0, 2, 1, { step: 0.05 });
        const dt = v.slider('duration of the blow (s)', 0.01, 0.3, 0.05, { step: 0.005 });
        const mr = 80, mh = 450, mt = 80, mus = 0.5;
        const red = (a) => (a * mt) / (a + mt);
        const Jr = () => red(mr) * speed.value, Jf = () => red(mr + mh) * speed.value;
        const Fns = () => mus * (mr * G + grip.value), Fs = () => Fns() + brace.value * mr * G;
        const Jat = (F, t) => Jr() + Math.min(Jf() - Jr(), F * t);
        v.render(() => {
          A.setView([0, 0.3], [0, Jf() * 1.15]);
          A.hline(Jf(), { color: 'muted', width: 1.2, dash: [6, 4] }); A.text('rider and horse as one body', 0.295, Jf(), { size: 10.5, color: 'muted', align: 'right', baseline: 'bottom' });
          A.hline(Jr(), { color: 'muted', width: 1.2, dash: [6, 4] }); A.text('rider alone', 0.295, Jr(), { size: 10.5, color: 'muted', align: 'right', baseline: 'bottom' });
          A.fn((t) => Jat(Fns(), t), { color: 'red', width: 2.6, n: 200 });
          A.fn((t) => Jat(Fs(), t), { color: 'green', width: 2.6, n: 200 });
          A.vline(dt.value, { color: 'gold', width: 1.4, dash: [4, 3] });
          A.dot(dt.value, Jat(Fns(), dt.value), { r: 5, color: 'red' }); A.dot(dt.value, Jat(Fs(), dt.value), { r: 5, color: 'green' });
          drawYears(v, B, [
            { t: 302, label: 'Changsha figurine (302)', contested: true },
            { t: 322, label: 'Nanjing (322)' },
            { t: [243, 405], label: 'Mongolian stirrup (14C)', contested: true },
            { t: 415, label: 'Feng Sufu pair (415)' },
            { t: [575, 628], label: 'Strategikon?', contested: true },
            { t: 600, label: 'Eastern Mediterranean (c. 600)', color: 'green' },
            { t: [700, 800], label: 'Western Europe (8th c.)', color: 'green' },
          ], { lanes: 5, ticks: [200, 300, 400, 500, 600, 700, 800] });
        });
        v.legend([['red', 'seat and grip only'], ['green', 'with stirrups'], ['gold', 'chosen duration', { dash: [4, 3] }]]);
        v.readout(() => {
          const t = dt.value, Jn = Jat(Fns(), t), Js = Jat(Fs(), t), req = (Jf() - Jr()) / t;
          return `masses: rider ${mr} kg, horse ${mh} kg, target ${mt} kg, perfectly inelastic blow (assumptions) → rider alone ${v.fix(Jr(), 0)} N s, locked to the horse ${v.fix(Jf(), 0)} N s\nfor a blow of ${v.fix(1000 * t, 0)} ms: seat holds ${v.fix(Fns(), 0)} N, stirrups ${v.fix(Fs(), 0)} N, whereas the extra impulse needs about ${v.fix(req, 0)} N → delivered **${v.fix(Jn, 0)} N s** without, **${v.fix(Js, 0)} N s** with stirrups (+${v.fix(100 * (Js - Jn) / Jn, 0)}%)`;
        });
      },
    },

    // ------------------------------------------------------------------ 4.10
    {
      num: '4.10',
      kind: 'Invention',
      name: 'The canal pound lock',
      credit: 'Qiao Weiyue, China, 984 CE (Song dynasty, near Huai’an); in Europe, pound locks in the Low Countries and Italy in the 14th–15th centuries',
      verify: true,
      statement: String.raw`A **pound lock** lets a boat change level on a canal. It is a chamber with a gate at each end: the boat enters at one level, the gates are closed, water is let in or out of the chamber through sluices (paddles) until its surface matches the other level, and the boat leaves through the other gate. The older **flash lock** was a single removable weir or gate: opening it let the upper reach rush out, and boats were carried through on the flood (downstream) or hauled up against the current, wasting a great deal of water and sometimes the boat.

The pound lock is credited to Qiao Weiyue, a Song official, in 984 CE: he installed two gates about 250 feet apart, roofed over, on the canal near Huai'an in Jiangsu, to stop barges wrecking on the slipways; Shen Kuo describes such locks in his *Dream Pool Essays* (1088). In Europe, a form of pound lock was built at Vreeswijk in the Netherlands (the sources give 1373 and 1385), the first "true European pound lock" is placed at Damme near Bruges in 1396, and Bertola da Novate built 18 pound locks on the Naviglio di Bereguardo between 1452 and 1458. Mitre gates are attributed to Leonardo da Vinci in the late 15th century. Whether the European lock was invented independently or learnt from China is not established in what I could confirm. The dates come from secondary summaries of Needham, and are flagged unverified.

Scope: the model fills the chamber through paddles that discharge like an orifice; friction in the culverts and leakage are ignored.`,
      idea: String.raw`The water lost by a lockage is fixed by geometry: the chamber's area times the lift, $V=L\,w\,\Delta H$, taken once from the upper pound for each boat that goes up or down. The time taken depends on the paddles: with discharge coefficient $c_d$ and paddle area $a$, the level difference $h$ between the pound and the chamber obeys $A\,\dot h=-c_d a\sqrt{2gh}$ (Torricelli, fluid-2.9), which reaches zero in a finite time $t=2A\sqrt{\Delta H}/(c_d a\sqrt{2g})$. Open the paddles slowly and the lock is slow; open them wide and the boat is knocked about.

A flash lock releases a reach: if the weir's height equals the lift, the reach of length $\ell$ drains by about that height, $V_\mathrm{flash}\approx \ell\,w\,\Delta H$, which is larger than the chamber by the ratio of the reach to the chamber, often a hundred or more. Canals in hilly country could run on the water saved.`,
      caption: String.raw`A boat is taken **up** or **down** (choose) through the lock; the animation runs at a rate you can read from the clock on the picture (time is real time, sped up). The blue line is the water in the chamber. Set the **chamber length and width**, the **lift** and the **paddle area**, and read the water used and the time. The bars compare it with a flash lock for a reach of the chosen length. Below, the dated evidence for the lock (the disputed Vreeswijk date hollow and dashed).`,
      deps: ['tech-4.3', 'fluid-2.9'],
      see: ['tech-4.3', 'tech-8.9'],
      refs: ['Mokyr ch. 3', 'Needham, Science and Civilisation in China 4.3 (as cited by Wikipedia “Lock (water navigation)”)'],
      tags: ['medieval', 'canals', 'hydraulics'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Lock_(water_navigation)' },
      viz(v) {
        const A = v.stage({ x: [0, 100], y: [-2.5, 6], axes: false, height: 280, full: true, title: 'side view of the lock' });
        const Bst = v.stage({ x: [0, 4], y: [-0.15, 1], axes: false, height: 200, weight: 1, minWidth: 300, title: 'water used per boat' });
        const Dd = yearStage(v, [950, 1540], { height: 190, weight: 1.4, minWidth: 360, title: 'dated evidence: the pound lock' });
        const dirS = v.select('boat goes', [{ value: 'up', label: 'up' }, { value: 'down', label: 'down' }], 'up');
        const Ls = v.slider('chamber length (m)', 15, 60, 30, { step: 1 });
        const Ws = v.slider('chamber width (m)', 3, 9, 6, { step: 0.5 });
        const Hs = v.slider('lift $\\Delta H$ (m)', 1, 4, 2.5, { step: 0.1 });
        const Ps = v.slider('paddle area (m²)', 0.1, 1.5, 0.6, { step: 0.05 });
        const Rs = v.slider('flash-lock reach (m)', 500, 5000, 2500, { step: 100 });
        const SPEED = 15;
        function timeline() {
          const Ach = Ls.value * Ws.value, dH = Hs.value, tF = (2 * Ach * Math.sqrt(dH)) / (0.6 * Ps.value * Math.sqrt(2 * G));
          return { Ach, dH, tF, ph: [8, 3, tF, 3, 8] }; // enter, close gate, fill/empty, open gate, leave
        }
        v.animate((t) => {
          const { Ach, dH, tF, ph } = timeline(), up = dirS.value === 'up', total = ph.reduce((a, b) => a + b, 0);
          const tr = (t * SPEED) % total; // real seconds
          let ph0 = 0, acc = 0; while (ph0 < 4 && tr >= acc + ph[ph0]) { acc += ph[ph0]; ph0++; }
          const f = (tr - acc) / ph[ph0];
          const Lc = Ls.value, x0 = 50 - Lc / 2, x1 = 50 + Lc / 2;
          // levels: lower pound 0, upper pound dH. Going up: boat from lower (right) to upper (left)? place the upper pound on the left always
          const hCh = (() => {
            const h0 = up ? 0 : dH, h1 = up ? dH : 0;
            if (ph0 < 2) return h0;
            if (ph0 === 2) { const s = 1 - f, hh = dH * s * s; return up ? dH - hh : hh; }
            return h1;
          })();
          const vol = ph0 < 2 ? 0 : ph0 === 2 ? Ach * Math.abs(hCh - (up ? 0 : dH)) : Ach * dH;
          const bed = -1.5;
          A.rect(0, bed, x0, dH, { fill: 'accent', fillAlpha: 0.22, stroke: false });
          A.rect(x1, bed, 100, 0, { fill: 'accent', fillAlpha: 0.22, stroke: false });
          A.rect(x0, bed, x1, hCh, { fill: 'accent', fillAlpha: 0.32, stroke: false });
          A.line(0, dH, x0, dH, { color: 'accent', width: 2 }); A.line(x1, 0, 100, 0, { color: 'accent', width: 2 }); A.line(x0, hCh, x1, hCh, { color: 'accent', width: 2.4 });
          A.line(0, bed, 100, bed, { color: 'muted', width: 3 }); A.rect(0, bed - 1, 100, bed, { fill: 'muted', fillAlpha: 0.3, stroke: false });
          // gates (upper at x0, lower at x1), raised or closed
          const upOpen = up ? ph0 >= 3 : ph0 <= 0, loOpen = up ? ph0 <= 0 : ph0 >= 3;
          A.line(x0, bed, x0, upOpen ? dH + 0.6 : dH + 1.2, { color: upOpen ? 'faint' : 'ink', width: upOpen ? 2 : 5 });
          A.line(x1, bed, x1, 1.2, { color: loOpen ? 'faint' : 'ink', width: loOpen ? 2 : 5 });
          if (ph0 === 2) A.text(up ? 'paddles open: water in from above' : 'paddles open: water out below', 50, dH + 1.4, { size: 11.5, color: 'accent', align: 'center', weight: 600 });
          const bl = Math.min(Lc - 6, 12);
          let bx;
          if (up) bx = ph0 === 0 ? 96 - f * (96 - (x1 - 1)) : ph0 < 4 ? x1 - 1 : (x1 - 1) - f * (x1 - 1 - 8);
          else bx = ph0 === 0 ? bl + 2 + f * ((x0 + bl + 1) - (bl + 2)) : ph0 < 4 ? x0 + bl + 1 : (x0 + bl + 1) + f * (96 - (x0 + bl + 1));
          const cxm = bx - bl / 2, by = cxm < x0 ? dH : cxm > x1 ? 0 : hCh;
          A.poly([[bx - bl, by + 0.7], [bx, by + 0.7], [bx - 0.9, by - 0.1], [bx - bl + 0.9, by - 0.1]], { fill: 'orange', fillAlpha: 0.7, color: 'orange', width: 1.5 });
          const clock = tr;
          A.corner(`${v.fix(clock / 60, 1)} min · ${['boat enters', 'gate shut', 'chamber fills or empties', 'gate opened', 'boat leaves'][ph0]}`, 'tl', { color: 'ink', weight: 600 });
          A.corner(`water moved from the upper to the lower pound: ${v.fix(vol, 0)} m³`, 'tr', { color: 'accent', weight: 600 });
          A.text('upper pound', 14, dH + 0.5, { size: 11, color: 'muted' }); A.text('lower pound', 86, 0.5, { size: 11, color: 'muted', align: 'right' });
        }, { period: 1e9, still: 4.5 });
        v.render(() => {
          const { Ach, dH } = timeline();
          const pound = Ach * dH, flash = Rs.value * Ws.value * dH, top = Math.max(pound, flash);
          Bst.rect(0.4, 0.05, 1.4, 0.05 + 0.85 * pound / top, { fill: 'green', fillAlpha: 0.55, color: 'green', width: 1.5 });
          Bst.rect(2.4, 0.05, 3.4, 0.05 + 0.85 * flash / top, { fill: 'orange', fillAlpha: 0.55, color: 'orange', width: 1.5 });
          Bst.text(`${v.fix(pound, 0)} m³`, 0.9, 0.08 + 0.85 * pound / top, { size: 12, color: 'green', align: 'center', baseline: 'bottom', weight: 700 });
          Bst.text(`${v.fix(flash, 0)} m³`, 2.9, 0.08 + 0.85 * flash / top, { size: 12, color: 'orange', align: 'center', baseline: 'bottom', weight: 700 });
          Bst.text('pound lock', 0.9, 0.0, { size: 11.5, color: 'ink', align: 'center', baseline: 'top' }); Bst.text('flash lock', 2.9, 0.0, { size: 11.5, color: 'ink', align: 'center', baseline: 'top' });
          drawYears(v, Dd, [
            { t: 984, label: 'Qiao Weiyue, Huai’an (984)', color: 'green' },
            { t: 1088, label: 'Shen Kuo describes it (1088)' },
            { t: [1373, 1385], label: 'Vreeswijk (1373 or 1385)', contested: true },
            { t: 1396, label: 'Damme (1396)' },
            { t: [1452, 1458], label: 'Naviglio di Bereguardo (1452–58)' },
            { t: 1490, label: 'mitre gates, Leonardo (late 15th c.)', contested: true },
          ], { lanes: 4, ticks: [1000, 1100, 1200, 1300, 1400, 1500] });
        });
        v.legend([['accent', 'water'], ['orange', 'boat'], ['green', 'pound lock'], ['orange', 'flash lock']]);
        v.readout(() => {
          const { Ach, dH, tF } = timeline(), pound = Ach * dH, flash = Rs.value * Ws.value * dH;
          return `chamber ${Ls.value} × ${Ws.value} m, lift ${v.fix(dH, 1)} m: each lockage moves **${v.fix(pound, 0)} m³** (${v.fix(pound / 1000, 1)} megalitres) from the upper to the lower pound and takes ${v.fix(tF / 60, 1)} min to fill or empty (paddle discharge coefficient 0.6)\na flash lock draining a ${v.fix(Rs.value / 1000, 1)} km reach by the same height would spend about ${v.fix(flash, 0)} m³ — **${v.fix(flash / pound, 0)} times** as much (model: the reach drains by the weir's height)`;
        });
      },
    },

    // ------------------------------------------------------------------ 4.11
    {
      num: '4.11',
      kind: 'Invention',
      name: 'Sternpost rudder and lateen sail',
      credit: 'Sternpost rudder: a Han pottery boat model (1st century CE) from Guangzhou, and European depictions c. 1180; lateen sail: Mediterranean, 2nd century CE iconography, excavated rigs from about 400 CE. Transmission between regions is argued, not settled',
      verify: true,
      statement: String.raw`Two steering and driving devices changed how ships were handled. The **sternpost rudder** is a vertical blade hinged on the stern post, on the centreline, turned by a tiller; it replaced the paddle-like **steering oars** hung over the quarters of ancient ships. The **lateen sail** is a triangular (or four-sided) sail on a long yard set obliquely to the mast, so that it lies along the boat, like later fore-and-aft sails, and not across it as a **square sail** does.

Dates, as far as I could confirm from secondary sources. For the rudder: a 61 cm pottery junk from a Han tomb in Guangzhou (1st century CE) shows a stern-mounted rudder, which Needham and others take to precede its European appearance by about a thousand years; Arab sources describe a sternpost rudder by 985 (al-Muqaddasi); the oldest known European depictions of a pintle-and-gudgeon rudder, on carvings at Zedelgem and Winchester, are about 1180. Needham held that it passed from China to the West; the sources I read do not give a detailed counter-argument. For the lateen sail: depictions on a 2nd-century gravestone and a 4th-century mosaic, the excavated Yassi Ada II ship of about 400 CE, and the Kelenderis mosaic (late 5th to early 6th century, which some read as square-rigged); by the 6th century it had largely replaced the square sail in Mediterranean pictures. The old belief that it came from the East has been revised in favour of a Mediterranean origin.

The popular claim that the lateen rig took over because it sails better to windward is itself contested: a study by Whitewright found the two rigs' performance very similar, and attributes the change to cost (fewer parts and less rope). The model below therefore does not assume that the lateen is better; it lets you set how close to the boat's axis each rig can be trimmed, and shows what follows.`,
      idea: String.raw`A sail is a foil. In an apparent wind $A=U-V$ (true wind minus the boat's velocity) a thin sail at angle of attack $\alpha$ gives a lift and a drag (fluid-5.4, aero-1.3). Only the part of the sail force along the boat's heading drives it; the keel is assumed to cancel the sideways part. The boat's speed is where that drive equals hull resistance, which here grows as $v^2$.

How close to the wind a boat can point depends mostly on how near the boat's axis the sail can be set. A square sail hangs from a yard that braces round against the shrouds, and cannot be braced far; a sail on an oblique yard can be sheeted nearer the centreline. Set the two limits the same and the polars coincide, which is the Whitewright point: the rig matters through the trim angle, and hull shape matters as much. Note too that the model has no leeway, no heel, and a sail of invented shape; the numbers are for comparison between rigs, not predictions.`,
      caption: String.raw`Polar diagram: the wind blows from the top; the distance from the centre to the curve is the boat's speed in that direction. Set how close to the boat's axis each rig's sail can be trimmed (**square** and **fore-and-aft**) and the **hull drag**. The marked points are the best speed made good toward the wind. Drag the **heading** slider to see the sail trimmed for that heading. Bottom right: the steering oar on the high side loses blade depth as the boat heels, while a rudder on the centreline does not. Below: the dated evidence for the lateen sail and the sternpost rudder.`,
      deps: ['fluid-5.4', 'aero-1.3'],
      see: ['tech-4.6', 'fluid-4.11'],
      refs: ['Mokyr ch. 3', 'Needham, Science and Civilisation in China 4.3, Johnstone & McGrail (1988), as cited by Wikipedia “Rudder”', 'Whitewright (2009–2012), Casson (1995), as cited by Wikipedia “Lateen”'],
      tags: ['medieval', 'ships', 'transmission disputed'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Lateen' },
      viz(v) {
        const A = v.stage({ x: [-1.8, 1.8], y: [-1.8, 1.8], equal: true, axes: false, height: 340, weight: 1.2, minWidth: 340, title: 'boat speed by heading (polar)' });
        const R = v.stage({ x: [0, 30], y: [0, 1.05], axes: 'box', gutter: true, height: 340, weight: 0.9, minWidth: 280, xlabel: 'heel (°)', ylabel: 'blade depth in water', title: 'steering blade of a heeling boat' });
        const Y = yearStage(v, [-600, 1300], { height: 230, full: true, title: 'dated evidence' });
        const dSq = v.slider('closest trim, square sail (°)', 10, 70, 40, { step: 1 });
        const dLa = v.slider('closest trim, fore-and-aft (°)', 5, 70, 20, { step: 1 });
        const hull = v.slider('hull drag', 0.2, 1.2, 0.5, { step: 0.05 });
        const head = v.slider('heading from the wind (°)', 20, 180, 70, { step: 1 });
        const bOff = v.slider('steering oar offset (m)', 0.5, 2, 1.1, { step: 0.05 });
        let key = '', pol = null;
        const G0 = Array.from({ length: 46 }, (_, i) => (i * 4) * D2R);
        v.render(() => {
          const k = `${dSq.value}|${dLa.value}|${hull.value}`;
          if (k !== key) { key = k; pol = { sq: G0.map((g) => boatSpeed(g, dSq.value * D2R, hull.value)), la: G0.map((g) => boatSpeed(g, dLa.value * D2R, hull.value)) }; }
          const vmax = Math.max(0.6, ...pol.sq.map((p) => p.v), ...pol.la.map((p) => p.v));
          A.setView([-vmax * 1.25, vmax * 1.25], [-vmax * 1.25, vmax * 1.25]);
          for (const r of [0.5, 1, 1.5, 2, 2.5].filter((q) => q < vmax * 1.2)) A.circle(0, 0, r, { color: 'grid', width: 1, fill: false });
          const ring = (arr, col) => { const pts = arr.map((p, i) => [p.v * Math.sin(G0[i]), p.v * Math.cos(G0[i])]); A.path(pts, { color: col, width: 2.6 }); A.path(pts.map(([x, y]) => [-x, y]), { color: col, width: 2.6 }); };
          ring(pol.sq, 'orange'); ring(pol.la, 'green');
          const vmg = (arr, sgn) => { let b = 0, bi = 0; arr.forEach((p, i) => { const q = sgn * p.v * Math.cos(G0[i]); if (q > b) { b = q; bi = i; } }); return { v: b, i: bi }; };
          const uSq = vmg(pol.sq, 1), uLa = vmg(pol.la, 1), dSqd = vmg(pol.sq, -1), dLad = vmg(pol.la, -1);
          A.dot(pol.sq[uSq.i].v * Math.sin(G0[uSq.i]), pol.sq[uSq.i].v * Math.cos(G0[uSq.i]), { r: 5, color: 'orange', hollow: true });
          A.dot(pol.la[uLa.i].v * Math.sin(G0[uLa.i]), pol.la[uLa.i].v * Math.cos(G0[uLa.i]), { r: 5, color: 'green', hollow: true });
          // wind arrow
          A.arrow(0, vmax * 1.2, 0, vmax * 0.95, { color: 'gold', width: 3, head: 9 }); A.text('wind', 0.08 * vmax, vmax * 1.08, { size: 11.5, color: 'gold', align: 'left', baseline: 'middle' });
          // the chosen heading: boat with its sail trimmed for the green rig
          const g = head.value * D2R, bs = boatSpeed(g, dLa.value * D2R, hull.value), b = [Math.sin(g), Math.cos(g)];
          const L0 = vmax * 0.22, c = (sg) => [Math.cos(sg * bs.d) * -b[0] - Math.sin(sg * bs.d) * -b[1], Math.sin(sg * bs.d) * -b[0] + Math.cos(sg * bs.d) * -b[1]];
          const bx = b[0] * bs.v, by = b[1] * bs.v;
          A.arrow(0, 0, bx, by, { color: 'green', width: 2, head: 7 }); A.dot(bx, by, { r: 4, color: 'green' });
          const sgn = bs.d >= 0 ? 1 : -1, cc = (() => { const d = Math.abs(bs.d) * sgn; return [-(b[0] * Math.cos(d) - b[1] * Math.sin(d)), -(b[0] * Math.sin(d) + b[1] * Math.cos(d))]; })();
          A.poly([[bx + b[0] * L0 * 0.6, by + b[1] * L0 * 0.6], [bx - b[0] * L0 * 0.6, by - b[1] * L0 * 0.6], [bx - b[0] * L0 * 0.3 + 0, by - b[1] * L0 * 0.3]], { fill: 'green', fillAlpha: 0.0, stroke: false });
          A.line(bx, by, bx + cc[0] * L0, by + cc[1] * L0, { color: 'green', width: 4 });
          A.line(bx + b[0] * L0 * 0.7, by + b[1] * L0 * 0.7, bx - b[0] * L0 * 0.7, by - b[1] * L0 * 0.7, { color: 'ink', width: 2 });
          A._v = { uSq, uLa, dSqd, dLad, bs, vSq: boatSpeed(g, dSq.value * D2R, hull.value) };
          // steering blade
          const heel = Array.from({ length: 31 }, (_, i) => i);
          R.fn((h) => clamp((0.9 - bOff.value * Math.sin(h * D2R)) / 0.9, 0, 1), { color: 'orange', width: 2.6 });
          R.fn((h) => Math.cos(h * D2R), { color: 'green', width: 2.6 });
          R.text('steering oar on the high side', 29.5, 0.18, { size: 10.5, color: 'orange', align: 'right', plate: true });
          R.text('rudder on the centreline', 29.5, 1.0, { size: 10.5, color: 'green', align: 'right', baseline: 'top', plate: true });
          drawYears(v, Y, [
            { t: [-475, -221], label: 'steering oars, Chinese models', color: 'muted' },
            { t: 150, label: '2nd c.: lateen on a gravestone' },
            { t: 75, label: '1st c.: Han rudder model, Guangzhou', color: 'green' },
            { t: 400, label: 'Yassi Ada II (lateen), c. 400' },
            { t: 500, label: 'Kelenderis mosaic (square or lateen?)', contested: true },
            { t: 625, label: 'Kellia graffito (early 7th c.)' },
            { t: 985, label: 'al-Muqaddasi: Arab rudder (985)', color: 'green' },
            { t: 1050, label: 'Dénia dish: lateen, 11th c.' },
            { t: 1180, label: 'Zedelgem and Winchester carvings (c. 1180)', color: 'green' },
          ], { lanes: 5, ticks: [-500, 0, 500, 1000] });
        });
        v.legend([['orange', 'square rig'], ['green', 'fore-and-aft (lateen) rig'], ['gold', 'wind']]);
        v.readout(() => {
          const w = A._v, f = (x) => v.fix(x, 2);
          return `best speed made good to windward: square **${f(w.uSq.v)}** at ${4 * w.uSq.i}° from the wind, fore-and-aft **${f(w.uLa.v)}** at ${4 * w.uLa.i}° (speeds in units of the true wind speed; hull drag ${f(hull.value)} × speed²) · downwind: ${f(w.dSqd.v)} and ${f(w.dLad.v)}\nat heading ${head.value}°: fore-and-aft boat speed ${f(w.bs.v)}, sail trimmed at ${v.fix(Math.abs(w.bs.d) / D2R, 0)}° to the axis; square-rig speed ${f(w.vSq.v)}. Set both limits equal and the curves coincide.`;
        });
      },
    },

    // ------------------------------------------------------------------ 4.12
    {
      num: '4.12',
      kind: 'Paper',
      name: 'The Natural Powers of Water and Wind to Turn Mills',
      credit: 'John Smeaton, 1759',
      verify: true,
      paper: { authors: 'John Smeaton', year: 1759, title: 'An Experimental Enquiry Concerning the Natural Powers of Water and Wind to Turn Mills, and Other Machines, Depending on a Circular Motion', venue: 'Philosophical Transactions of the Royal Society of London 51: 100–174', doi: '10.1098/rstl.1759.0019' },
      introduces: ['tech-4.5'],
      statement: String.raw`Smeaton's paper, read to the Royal Society in 1759 (he received the Society's Copley Medal for it), reports two series of experiments on working models. In the first he measured water wheels (the results are replayed in 4.5): at the same water and the same fall the overshot wheel does about twice the work of the undershot wheel, and each does best turning slowly. In the second part he tested windmill sails. Because natural wind is too uncertain, he carried the sails round a large circle on an arm, pulling it by hand and regulating the speed with a pendulum, so that the sails met an "artificial wind" of known speed (according to the OCR text, sails of 21 inches radius at a centre speed of 6 ft/s). He measured the load the sails could raise and their turns for different angles of weather (the angle between the sail and the plane of rotation), and concluded that sails set at 55° to the axis were not the best for work and that the angle should vary along the sail, larger near the axis than at the tip. For a sail divided in six parts from the axis outward he gave angles of weather of 18°, 19°, 18°, 16°, 12½° and 7° (the OCR layout of the last two is garbled), and he found that concave sails and a wider leading edge did better still.

He also drew general rules from the windmill tests: the speed of the sails at maximum load is nearly proportional to the wind speed; the load at maximum is nearly, a little less than, proportional to the square of the wind speed; and the work done is nearly, a little less than, proportional to the cube of the wind speed.

What the paper changed: it gave a measured, not argued, answer to a question that engineers had been settling by opinion, and its method (vary one parameter on a model, find the maximum, scale up by stated rules) became a template. I read the paper's text only in an OCR transcription, so every figure quoted here is unverified against the printed page.`,
      idea: String.raw`The context was a dispute about what a moving fluid can do to a machine. Mathematicians (Parent, Belidor) had argued from the momentum of the water that an undershot wheel should run at a third of the stream's speed and give a small fraction of its power; Smeaton's own later work on the "mechanic power" of moving bodies bears on the same quarrel over momentum and vis viva. He did not argue; he measured, using a model for which he could vary the head, the load and the wheel speed and compare the work done with the water's available power (ρgQH). For wind he built the whirling arm because no steady wind could be had.

The ideas the paper introduced were the experimental model with its maximum-effect method (add weight to the scale until the product of load and turns is greatest), the efficiency of a water wheel as a measured fraction of the water's power (4.5), the observation that weight beats impulse where a fall is available (4.4), and the twisted windmill sail whose angle of weather varies with the distance from the axis (4.6).`,
      caption: String.raw`Two benches. **Water:** the model wheel of 4.4 at a head of 0.8 m (Smeaton's 27–35 inches); add weight to the scale with the **load** slider (as a fraction of the weight that just stops the wheel) and watch the product of load and speed, his "effect", rise to a maximum and fall; the bands are his measured shares (Tables I and II). **Wind:** the power coefficient of a four-sail mill against tip-speed ratio, for flat sails of Smeaton's six angles, for a single plane angle, and for sails at 55° to the axis (35° of weather); the bars show his six angles. The sail model is the flat-plate blade-element model of 4.6, not his data.`,
      deps: ['tech-4.4', 'tech-4.6'],
      see: ['tech-4.5', 'tech-4.6'],
      refs: ['Smeaton 1759, Phil. Trans. 51:100–174, doi 10.1098/rstl.1759.0019 (Crossref record; text read as OCR at jimclifford.ca)', 'Smeaton 1776, Phil. Trans. 66'],
      tags: ['industrial', '1759', 'experiment'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/John_Smeaton' },
      viz(v) {
        const rig = v.select('bench', [{ value: 'water', label: 'water wheel' }, { value: 'wind', label: 'windmill sails' }], 'water');
        const A = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 300, weight: 1.15, minWidth: 340, xlabel: 'load ÷ load that stops the wheel', ylabel: 'effect (load × speed), ÷ water power', title: 'maximum-effect method' });
        const B = v.stage({ x: [0.5, 6], y: [0, 0.3], axes: 'box', gutter: true, height: 300, weight: 1.15, minWidth: 340, xlabel: 'tip-speed ratio', ylabel: '$C_p$ (model)', title: 'sail angles on the whirling arm' });
        const C = v.stage({ x: [0, 1], y: [0, 25], axes: 'box', gutter: true, height: 300, weight: 0.85, minWidth: 250, xlabel: 'distance from the axis ÷ sail radius', ylabel: 'angle of weather (°)', title: 'Smeaton’s six angles' });
        const wheel = v.select('wheel', [{ value: 'under', label: 'undershot' }, { value: 'over', label: 'overshot' }], 'over');
        const load = v.slider('load in the scale', 0.02, 1, 0.5, { step: 0.01 });
        const uni = v.slider('plane sail: angle of weather (°)', 3, 45, 18, { step: 0.5 });
        const sol = v.slider('sail area ÷ swept area', 0.1, 0.6, 0.3, { step: 0.01 });
        const HM = 0.8, QM = 0.2, vj = Math.sqrt(2 * G * HM);
        const tab = (kind) => {
          const F0 = (() => { const u0 = 0.01, P = kind === 'under' ? undershotP(u0, { Q: QM, H: HM }) : overshotP(u0, { Q: QM, H: HM }).P; return P / u0; })();
          const out = [];
          for (let i = 1; i <= 500; i++) { const u = (vj * i) / 500, P = kind === 'under' ? undershotP(u, { Q: QM, H: HM }) : overshotP(u, { Q: QM, H: HM }).P; if (P <= 0 && i > 5) break; out.push({ u, P, L: clamp(P / u / F0, 0, 1.2) }); }
          return out;
        };
        const tabs = { under: tab('under'), over: tab('over') };
        const at = (kind, L) => { const t = tabs[kind]; let best = t[0]; for (const r of t) if (Math.abs(r.L - L) < Math.abs(best.L - L) && r.u > 0.05) best = r; return best; };
        const SM = [18, 19, 18, 16, 12.5, 7];
        const smeaton = (r) => SM[Math.min(5, Math.floor(r * 6 - 1e-9))] * D2R;
        const lam = Array.from({ length: 40 }, (_, i) => 0.5 + (i * 5.5) / 39);
        let key = '', curves = null;
        v.render(() => {
          const w = rig.value === 'water';
          A.el.style.display = w ? '' : 'none'; wheel.el.hidden = !w; load.el.hidden = !w;
          B.el.style.display = w ? 'none' : ''; C.el.style.display = w ? 'none' : ''; uni.el.hidden = w; sol.el.hidden = w;
          if (w) {
            const t = tabs[wheel.value], PM = RHO * G * QM * HM;
            A.setView([0, 1], [0, 0.85]);
            A.hband(0.28, 0.33, { color: 'accent', alpha: 0.12 }); A.hband(0.52, 0.76, { color: 'green', alpha: 0.12 });
            A.text('Table I: 0.28–0.33', 0.02, 0.335, { size: 10.5, color: 'accent', baseline: 'bottom' }); A.text('Table II: 0.52–0.76', 0.02, 0.77, { size: 10.5, color: 'green', baseline: 'bottom' });
            A.path(t.map((r) => [r.L, r.P / PM]), { color: wheel.value === 'over' ? 'green' : 'accent', width: 2.6 });
            const pk = t.reduce((b, r) => (r.P > b.P ? r : b), t[0]), here = at(wheel.value, load.value);
            A.dot(pk.L, pk.P / PM, { r: 5, hollow: true, color: 'ink', label: 'maximum effect', labelPos: 'n' });
            A.dot(here.L, here.P / PM, { r: 7, color: 'gold' }); A.vline(here.L, { color: 'gold', width: 1.2, dash: [4, 3] });
            A._w = { here, pk, PM };
          } else {
            const k = `${uni.value}|${sol.value}`;
            if (k !== key) {
              key = k;
              const f = (b) => lam.map((l) => windCp(l, b, { solidity: sol.value }));
              curves = { sm: f(smeaton), pl: f(() => uni.value * D2R), ax: f(() => 35 * D2R) };
            }
            B.setView([0.5, 6], [0, Math.max(0.1, ...curves.sm, ...curves.pl, ...curves.ax) * 1.2]);
            B.path(lam.map((l, i) => [l, curves.sm[i]]), { color: 'green', width: 2.8 });
            B.path(lam.map((l, i) => [l, curves.pl[i]]), { color: 'accent', width: 2.2 });
            B.path(lam.map((l, i) => [l, curves.ax[i]]), { color: 'red', width: 2.2 });
            for (let j = 0; j < 6; j++) { C.rect(j / 6 + 0.01, 0, (j + 1) / 6 - 0.01, SM[j], { fill: 'green', fillAlpha: 0.35, color: 'green', width: 1.2 }); C.text(`${SM[j]}°`, (j + 0.5) / 6, SM[j] + 0.6, { size: 11, color: 'green', align: 'center', baseline: 'bottom', weight: 600 }); }
            C.hline(uni.value, { color: 'accent', width: 1.5, dash: [5, 3] }); C.hline(35, { color: 'red', width: 1.5, dash: [5, 3] });
            C.text('plane sail', 0.99, uni.value + 0.5, { size: 10.5, color: 'accent', align: 'right', baseline: 'bottom' });
          }
        });
        v.legend([['green', 'Smeaton’s six angles / overshot'], ['accent', 'plane sail / undershot'], ['red', 'sails at 55° to the axis']]);
        v.readout(() => {
          if (rig.value === 'water') {
            const { here, pk, PM } = A._w, circ = 75 * 0.0254;
            return `${wheel.value === 'over' ? 'overshot' : 'undershot'} model: load ${v.fix(100 * here.L, 0)}% of the stopping load → rim speed ${v.fix(here.u, 2)} m/s (${v.fix(here.u / 0.3048, 1)} ft/s${wheel.value === 'under' ? `; ${v.fix(60 * here.u / circ, 0)} turns/min on a 75-inch wheel` : ''}), effect ${v.fix(100 * here.P / PM, 0)}% of the water's power\nmaximum effect ${v.fix(100 * pk.P / PM, 0)}% at ${v.fix(100 * pk.L, 0)}% of the stopping load (paper's tables, from 4.5: undershot 28–33%, overshot 52–76% of the power of the whole descent; his best load ≈ ¾ of the stopping load)`;
          }
          const mx = (a) => Math.max(...a);
          return `model peaks (flat-plate sails, solidity ${v.fix(sol.value, 2)}): Smeaton's six angles **${v.fix(mx(curves.sm), 3)}**, plane ${v.fix(uni.value, 1)}° **${v.fix(mx(curves.pl), 3)}**, 35° of weather **${v.fix(mx(curves.ax), 3)}**\nthe paper: sails at 55° to the axis were not best for work; angles of weather 18°, 19°, 18°, 16°, 12½°, 7° from the axis outward (OCR layout uncertain); the model need not reproduce his product values and is not fitted to them`;
        });
      },
    },
  ],
};
