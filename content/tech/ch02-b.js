// History of Technology — Chapter 2 (part b): items 2.7–2.11
import { yearStage, drawYears, block, ground, gear, meshAngle } from './ch02.shared.js';

const D2R = Math.PI / 180;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const G = 9.81;

/**
 * Lagrangian dynamics of point masses on a linkage: pos(q) → [[x, y], …] (one entry per mass), masses m[].
 * Returns q̈ solving M(q) q̈ = Σ mᵢ Jᵢᵀ (g − J̇ᵢ q̇), with J by central differences and J̇q̇ as a second directional derivative.
 */
function lagrangeAccel(pos, m, q, qd) {
  const n = q.length, h = 1e-6, P0 = pos(q), K = P0.length;
  const J = []; // J[k][i] = d p_k / d q_i (2-vector)
  for (let i = 0; i < n; i++) {
    const qp = q.slice(), qm = q.slice(); qp[i] += h; qm[i] -= h;
    const Pp = pos(qp), Pm = pos(qm);
    for (let k = 0; k < K; k++) { (J[k] ||= [])[i] = [(Pp[k][0] - Pm[k][0]) / (2 * h), (Pp[k][1] - Pm[k][1]) / (2 * h)]; }
  }
  const sp = Math.hypot(...qd), eps = sp > 0 ? 1e-4 / sp : 0;
  let Jd = null;
  if (eps) {
    const qp = q.map((x, i) => x + eps * qd[i]), qm = q.map((x, i) => x - eps * qd[i]), Pp = pos(qp), Pm = pos(qm);
    Jd = P0.map((p, k) => [(Pp[k][0] - 2 * p[0] + Pm[k][0]) / (eps * eps), (Pp[k][1] - 2 * p[1] + Pm[k][1]) / (eps * eps)]);
  }
  const Mm = Array.from({ length: n }, () => new Array(n).fill(0)), f = new Array(n).fill(0);
  for (let k = 0; k < K; k++) {
    const a = Jd ? [-Jd[k][0], -G - Jd[k][1]] : [0, -G];
    for (let i = 0; i < n; i++) {
      f[i] += m[k] * (J[k][i][0] * a[0] + J[k][i][1] * a[1]);
      for (let j = 0; j < n; j++) Mm[i][j] += m[k] * (J[k][i][0] * J[k][j][0] + J[k][i][1] * J[k][j][1]);
    }
  }
  if (n === 1) return [f[0] / Mm[0][0]];
  return v_solve(Mm, f);
}
function v_solve(A, b) { // small Gaussian elimination
  const n = b.length, M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = c + 1; r < n; r++) { const f = M[r][c] / M[c][c]; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
  }
  const x = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) { let s = M[r][n]; for (let k = r + 1; k < n; k++) s -= M[r][k] * x[k]; x[r] = s / M[r][r]; }
  return x;
}
function rk4(acc, q, qd, dt) {
  const n = q.length, add = (a, b, s) => a.map((x, i) => x + s * b[i]);
  const a1 = acc(q, qd), q2 = add(q, qd, dt / 2), v2 = add(qd, a1, dt / 2);
  const a2 = acc(q2, v2), q3 = add(q, v2, dt / 2), v3 = add(qd, a2, dt / 2);
  const a3 = acc(q3, v3), q4 = add(q, v3, dt), v4 = add(qd, a3, dt);
  const a4 = acc(q4, v4);
  const qn = new Array(n), vn = new Array(n);
  for (let i = 0; i < n; i++) { qn[i] = q[i] + (dt / 6) * (qd[i] + 2 * v2[i] + 2 * v3[i] + v4[i]); vn[i] = qd[i] + (dt / 6) * (a1[i] + 2 * a2[i] + 2 * a3[i] + a4[i]); }
  return [qn, vn];
}

export default {
  collection: 'tech',
  chapter: 2,
  items: [
    // ------------------------------------------------------------------ 2.7
    {
      num: '2.7',
      kind: 'Invention',
      name: 'The shadoof',
      credit: 'Mesopotamia, by c. 2200 BCE; Egypt, 2nd millennium BCE',
      statement: String.raw`The **shadoof** (shaduf) is a long pole pivoted on a post, with a bucket hung from the long end and a counterweight, often a lump of clay or stone, on the short end. The operator pulls the empty bucket down into the water and the counterweight helps lift it full. It lifts water about 1–6 m, and field studies of one person working a shadoof in Chad recorded 39 to 130 litres per minute over lifts of 1.8 to 6.2 m (Nwuba 1989, Mirti et al. 1999). A Mesopotamian cylinder seal of about 2200 BCE shows one; in Egypt it appears in the second millennium BCE and is painted in Theban tombs of about 1250 BCE. It is still used today.

The counterweight does not reduce the work needed to lift the water. It **splits** it between the two strokes, so that no stroke needs more than about half the weight of the water.`,
      idea: String.raw`The pole is a lever (tech-2.1). With long arm $a$, short arm $b$, counterweight $C$, empty bucket $m_b$ and water $m_w$, the operator must pull down with $C\,b/a - m_b$ on the way down (the counterweight resists) and push up with $m_b + m_w - C\,b/a$ on the way up (it helps), in weight units, plus a small term for the pole's own weight. The two efforts are equal when $C\,b/a = m_b + m_w/2$: the counterweight then carries the empty bucket and half the water. Whatever $C$ is, the operator's total work per cycle is $m_w g$ times the height of the lift. The counterweight only stores the energy put in on the down stroke and gives it back on the up stroke, so the strong pulling-down muscles share the work with the lifting ones.`,
      caption: String.raw`Set the **counterweight**, the bucket size and the **lift height**; the animation runs one cycle (pull the empty bucket down, fill it, swing it up, empty it into the channel). The middle panel shows the two strokes' efforts against counterweight. The lines cross at the best counterweight, where neither stroke needs more than half the water's weight. The trace at right gives the operator's force through the cycle. The readout checks that the work per cycle is the same for every counterweight, and compares the flow with the field measurements.`,
      deps: ['tech-2.1'],
      refs: ['Mokyr ch. 2', 'Nwuba 1989, J. Agric. Eng. Res. (shadoof field tests, Chad)', 'Mirti et al. 1999, Applied Engineering in Agriculture', 'Yannopoulos et al. 2015, Water 7:5031'],
      tags: ['ancient', 'c. 2000 BCE', 'irrigation'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Shadoof' },
      viz(v) {
        const A = v.stage({ x: [-5.6, 3.6], y: [-1.4, 7.0], equal: true, axes: false, height: 330, weight: 1.15, minWidth: 320, title: 'shadoof (metres)' });
        const B = v.stage({ x: [0, 80], y: [-30, 30], axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 270, xlabel: 'counterweight (kg)', ylabel: 'operator effort (kg-force)', title: 'effort on each stroke' });
        const T = v.stage({ x: [0, 1], y: [-30, 30], axes: 'box', gutter: true, height: 200, weight: 1, minWidth: 280, xlabel: 'phase of the cycle', ylabel: 'force (kgf)', title: 'operator’s force through one cycle (+ pull down, − push up)', xticks: [[0.2, 'down'], [0.45, 'fill'], [0.7, 'up'], [0.95, 'empty']] });
        const C = yearStage(v, [-2600, 2050], { height: 200, weight: 1.3, minWidth: 360, title: 'dated evidence: the shadoof' });
        const cwS = v.slider('counterweight (kg)', 0, 80, 22, { step: 1 });
        const bkS = v.slider('bucket (litres)', 5, 30, 15, { step: 1 });
        const hS = v.slider('lift height (m)', 1, 4.5, 2.2, { step: 0.1 });
        const cpm = v.slider('cycles per minute', 2, 12, 6, { step: 0.5 });
        const a = 3.6, b = 1.2, mb = 2, mp = 10; // long arm, short arm (m), bucket and pole mass (kg): illustrative
        const efforts = (Cw, mw) => { const pt = (mp * (a - b)) / (2 * a); return { down: (Cw * b) / a - mb - pt, up: mb + mw + pt - (Cw * b) / a, best: ((mb + pt + mw / 2) * a) / b }; };
        const force = (s, Cw, mw) => { const e = efforts(Cw, mw); if (s < 0.4) return e.down; if (s < 0.5) return 0; if (s < 0.9) return -e.up; return 0; };
        v.animate((t) => {
          const Cw = cwS.value, mw = bkS.value, h = hS.value, e = efforts(Cw, mw);
          const s = ((t / 6) % 1 + 1) % 1; // phase
          // pole angle: tip height between river and channel
          const Lr = 1.1, bh = 0.45;
          const yBot = Lr + bh - 0.25, yTop = h + Lr + bh + 0.1, Hp = (yBot + yTop) / 2 + 0.2;
          let frac; // 0 = bucket at river, 1 = at channel
          if (s < 0.4) frac = 1 - s / 0.4; else if (s < 0.5) frac = 0; else if (s < 0.9) frac = (s - 0.5) / 0.4; else frac = 1;
          frac = frac * frac * (3 - 2 * frac);
          const yt = yBot + frac * (yTop - yBot), sn = clamp((Hp - yt) / a, -0.95, 0.95), th = Math.asin(sn);
          const tip = [-a * Math.cos(th), Hp - a * sn], cw = [b * Math.cos(th), Hp + b * sn];
          // river, bank and channel
          A.rect(-5.6, -1.4, -1.6, 0, { fill: 'blue', fillAlpha: 0.25, stroke: false });
          A.line(-5.6, 0, -1.6, 0, { color: 'blue', width: 1.5 });
          A.poly([[-1.6, -1.4], [-1.6, h - 0.05], [-0.9, h - 0.05], [-0.9, h + 0.3], [3.6, h + 0.3], [3.6, -1.4]], { fill: 'orange', fillAlpha: 0.22, color: 'orange', width: 1.2 });
          A.rect(-2.95, h - 0.05, -1.6, h + 0.25, { fill: 'orange', fillAlpha: 0.35, color: 'orange', width: 1 });
          A.rect(-2.9, h, -1.65, h + 0.18, { fill: 'blue', fillAlpha: s >= 0.9 || s < 0.05 ? 0.6 : 0.3, stroke: false });
          A.text('channel', -2.3, h + 0.5, { size: 11, color: 'ink', align: 'center' });
          // post and pole
          A.line(0, h + 0.3, 0, Hp, { color: 'orange', width: 5 });
          A.line(tip[0], tip[1], cw[0], cw[1], { color: 'ink', width: 3.5 });
          A.dot(0, Hp, { r: 4, color: 'ink' });
          block(A, cw[0], cw[1] - 0.35, 0.35 + Cw / 160, 0.5, `${Cw}`, { color: 'muted', size: 10.5 });
          // rope, bucket (shifted so it hangs over the river/channel edge)
          const bx = tip[0];
          A.line(bx, tip[1], bx, tip[1] - Lr, { color: 'muted', width: 1.4 });
          const bb = tip[1] - Lr - bh, full = s >= 0.4 && s < 0.95;
          A.poly([[bx - 0.28, bb + bh], [bx + 0.28, bb + bh], [bx + 0.2, bb], [bx - 0.2, bb]], { fill: full ? 'blue' : 'panel', fillAlpha: full ? 0.55 : 0.6, color: 'ink', width: 1.4 });
          // operator force arrow on the rope
          const F = force(s, Cw, mw);
          if (Math.abs(F) > 0.5) { const L = clamp(Math.abs(F) / 18, 0.3, 1.6); const y0 = tip[1] - Lr * 0.5; A.arrow(bx + 0.35, y0, bx + 0.35, y0 - Math.sign(F) * L, { color: F > 0 ? 'accent' : 'red', width: 2.6 }); A.text(`${v.fix(Math.abs(F), 1)} kgf ${F > 0 ? 'pull' : 'push'}`, bx + 0.5, y0 - Math.sign(F) * L / 2, { size: 11.5, color: F > 0 ? 'accent' : 'red', align: 'left', plate: true }); }
          A.measure(3.3, 0, 3.3, h, '');
          A.text(`${v.fix(h, 1)} m`, 3.15, h / 2, { size: 11.5, color: 'ink', align: 'right' });
          A.corner(['pull the empty bucket down', 'fill', 'swing it up full', 'empty into the channel'][s < 0.4 ? 0 : s < 0.5 ? 1 : s < 0.9 ? 2 : 3], 'tl', { size: 12, color: 'ink', weight: 700 });
          // B: efforts against counterweight
          B.hline(0, { color: 'faint', width: 1 });
          B.fn((c) => efforts(c, mw).down, { color: 'accent', width: 2.2 });
          B.fn((c) => efforts(c, mw).up, { color: 'red', width: 2.2 });
          B.fn((c) => Math.max(Math.abs(efforts(c, mw).down), Math.abs(efforts(c, mw).up)), { color: 'muted', width: 1.2, dash: [5, 4] });
          if (e.best <= 80) { B.vline(e.best, { color: 'green', width: 1.4, dash: [4, 3] }); B.text(`best ≈ ${v.fix(e.best, 0)} kg`, e.best + 1.5, 26, { size: 11, color: 'green', align: 'left' }); }
          B.dot(Cw, e.down, { r: 5, color: 'accent' }); B.dot(Cw, e.up, { r: 5, color: 'red' });
          B.text('pull down (empty)', 74, efforts(74, mw).down + 2.5, { size: 11, color: 'accent', align: 'right' });
          B.text('push up (full)', 6, efforts(6, mw).up - 3, { size: 11, color: 'red', align: 'left' });
          // T: trace
          T.hline(0, { color: 'faint', width: 1 });
          T.fn((x) => force(x, Cw, mw), { color: 'ink', width: 2, n: 600 });
          T.between((x) => Math.max(0, force(x, Cw, mw)), () => 0, 0, 1, { fill: 'accent', fillAlpha: 0.2 });
          T.between((x) => Math.min(0, force(x, Cw, mw)), () => 0, 0, 1, { fill: 'red', fillAlpha: 0.2 });
          T.vline(s, { color: 'gold', width: 1.5 });
          drawYears(v, C, [
            { t: -2200, label: 'Mesopotamian seal' },
            { t: [-2100, -1600], label: 'Minoan Crete', contested: true },
            { t: [-1550, -1290], label: 'Egypt, 18th Dynasty' },
            { t: -1250, label: 'Theban tomb paintings' },
            { t: 1989, label: 'field tests, Chad', color: 'green' },
          ], { lanes: 3, laneH: 0.21, ticks: [-2500, -2000, -1500, -1000, -500, 1, 500, 1000, 1500, 2000] });
        }, { period: 6, still: 3.6 });
        v.legend([['accent', 'pull down on the empty bucket'], ['red', 'push up on the full bucket'], ['green', 'counterweight that equalizes the strokes']]);
        v.readout(() => {
          const Cw = cwS.value, mw = bkS.value, h = hS.value, e = efforts(Cw, mw), travel = h + 0.35;
          const wDown = e.down * G * travel, wUp = e.up * G * travel, Lpm = mw * cpm.value, P = (mw * G * travel * cpm.value) / 60;
          return `down stroke ${v.fix(e.down, 1)} kgf, up stroke ${v.fix(e.up, 1)} kgf (best counterweight ${v.fix(e.best, 0)} kg) · work per cycle: ${v.fix(wDown, 0)} J + ${v.fix(wUp, 0)} J = **${v.fix(wDown + wUp, 0)} J** = $m_w g\\,\\Delta h$ = ${v.fix(mw * G * travel, 0)} J, the same for any counterweight · ${v.fix(Lpm, 0)} L/min (field tests: 39–130 L/min) at a useful power of ${v.fix(P, 0)} W · arm lengths, bucket and pole masses are illustrative`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.8
    {
      num: '2.8',
      kind: 'Invention',
      name: 'Archimedes’ screw',
      credit: 'Attributed to Archimedes, 3rd century BCE (attribution disputed)',
      statement: String.raw`The **water screw** (Latin *cochlea*) is an inclined cylinder containing one or more helical blades wound round a central shaft. Its lower end dips into water. As it turns, water is trapped in pockets between the blades and the casing, and each turn carries every pocket one lead further up the axis until it spills out at the top. It lifts large volumes over small heights, and it was used for irrigation, for draining mines and ships, and today as a pump and as a low-head turbine.

Vitruvius (*De architectura* X.6) gives a recipe: a shaft whose diameter is one sixteenth of its length, eight helical channels laid out so that each blade advances one shaft circumference per turn, built out to an overall diameter of one eighth of the length, and set at the slope of the 3-4-5 triangle (rise 3 for length 5, about 37°). The screw works only below a critical inclination; tilt it too steeply and the pockets spill back.

The device is traditionally credited to Archimedes, and Diodorus describes it watering the Nile Delta. But none of his near-contemporaries who describe it credits him, and Dalley and Oleson (2003) argue that Sennacherib's inscriptions describe bronze water screws at Nineveh around 700 BCE, a reading that is **contested**.`,
      idea: String.raw`Follow one helical channel round the screw. Its height above the ground is $h(\phi) = \tfrac{p\phi}{2\pi}\sin\theta + r\sin\phi\cos\theta$: a steady climb from the lead $p$ plus a wobble of amplitude $r\cos\theta$ as the channel goes round. If the wobble is large enough the channel has a low point and a high point on every turn, and water collects in each low point up to the level of the next crest below it. Turning the screw moves the low points up the axis, which is the pumping action (tech-2.4). The wobble wins only while $p\tan\theta < 2\pi r$ at the radius where the water could escape. Over the top of the shaft that radius is the shaft's own, so a steeper screw, a longer lead or a thinner shaft eventually leaves no pockets at all. The flow is the number of channels × the pocket volume × the turning rate; the lift is the length times $\sin\theta$.`,
      caption: String.raw`A working screw in 3D, computed: the blue dots fill the trapped pockets, found by locating the crests of each channel and filling every trough up to its crest. **Drag to rotate** the view. Change the **inclination**, the number of **blades**, the **lead** and the turning rate, or choose Vitruvius's design. The right panel plots the volume lifted per turn against inclination for this geometry: it falls as the screw steepens and reaches zero where the pockets vanish. The 3-4-5 slope is marked.`,
      deps: ['tech-2.4'],
      refs: ['Mokyr ch. 2', 'Vitruvius, De architectura X.6', 'Dalley & Oleson 2003, Technology and Culture 44:1–26', 'Rorres 2000, J. Hydraulic Eng. 126:72'],
      tags: ['ancient', 'c. 250 BCE', 'water lifting'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Archimedes%27_screw' },
      viz(v) {
        const S = v.stage({ x: [-2.7, 2.7], y: [-1.7, 1.9], equal: true, axes: false, height: 360, weight: 1.4, minWidth: 360, title: 'water screw (metres)' });
        const B = v.stage({ x: [5, 70], y: [0, 1], axes: 'box', gutter: true, height: 360, weight: 1, minWidth: 280, xlabel: 'inclination θ (°)', ylabel: 'litres lifted per turn', title: 'volume per turn against inclination' });
        const C = yearStage(v, [-800, 2050], { height: 140, full: true, title: 'dated evidence: the water screw' });
        const sc = v.scene3(S, { yaw: -1.25, pitch: 0.25, axes: false });
        const preset = v.select('design', [{ value: 'vit', label: 'Vitruvius (8 channels)' }, { value: 'mod', label: 'modern (3 blades)' }, { value: 'own', label: 'custom' }], 'vit', { onChange: (x) => apply(x) });
        const thS = v.slider('inclination θ (°)', 5, 70, 36.87, { step: 0.1, onChange: () => { preset.value = preset.value === 'vit' && Math.abs(thS.value - 36.87) > 0.05 ? 'own' : preset.value; } });
        const nS = v.slider('blades (channels)', 1, 8, 8, { int: true, onChange: () => { preset.value = 'own'; } });
        const pS = v.slider('lead / outer diameter', 0.4, 2.5, Math.PI / 2, { step: 0.01, onChange: () => { preset.value = 'own'; } });
        const rpm = v.slider('turns per minute', 2, 40, 12, { step: 1 });
        const L = 4, Ro = 0.25, Ri = 0.125; // Vitruvian proportions: shaft diameter L/16, overall diameter L/8
        function apply(x) { if (x === 'vit') { thS.set(36.87); nS.set(8); pS.set(Math.PI / 2); } else if (x === 'mod') { thS.set(30); nS.set(3); pS.set(1.0); } v.invalidate(); }
        const geom = () => ({ th: thS.value * D2R, N: nS.value, P: pS.value * 2 * Ro });
        /** pockets of chamber j at rotation psi: [{uc, uc2, level}] using the crest function g(u) */
        function pockets(th, N, P, j, psi, du = (2 * Math.PI) / 360) {
          const st = Math.sin(th), ct = Math.cos(th), out = [];
          const u0 = (-2 * Math.PI * j) / N + psi, u1 = (2 * Math.PI * L) / P + psi; // blade s from 0 to L
          const g = (u) => { const sb = (P * (u - psi)) / (2 * Math.PI) + (j * P) / N, sn = Math.sin(u); return sb * st + (sn > 0 ? Ri : Ro) * sn * ct; };
          let prev2 = g(u0), prev = g(u0 + du), crests = [];
          for (let u = u0 + 2 * du; u <= u1; u += du) { const c = g(u); if (prev > prev2 && prev >= c) crests.push([u - du, prev]); prev2 = prev; prev = c; }
          for (let k = 0; k + 1 < crests.length; k++) out.push({ uc: crests[k][0], uc2: crests[k + 1][0], level: crests[k][1] });
          return out;
        }
        function pocketVolume(th, N, P, pk, j, psi, nu = 120, nr = 10) {
          const st = Math.sin(th), ct = Math.cos(th), du = (pk.uc2 - pk.uc) / nu, dr = (Ro - Ri) / nr; let V = 0;
          for (let a = 0; a < nu; a++) {
            const u = pk.uc + (a + 0.5) * du, sb = (P * (u - psi)) / (2 * Math.PI) + (j * P) / N, sn = Math.sin(u);
            for (let b = 0; b < nr; b++) { const r = Ri + (b + 0.5) * dr, hb = sb * st + r * sn * ct; V += clamp((pk.level - hb) / st, 0, P / N) * r * dr * du; }
          }
          return V;
        }
        let cacheKey = '', vol = 0, curve = [];
        const volumePerPocket = (th, N, P, nu, nr) => { // median over pockets of chamber 0 at psi = 0
          const ps = pockets(th, N, P, 0, 0, (2 * Math.PI) / 240); if (ps.length < 1) return 0;
          const vs = ps.map((pk) => pocketVolume(th, N, P, pk, 0, 0, nu, nr)).sort((x, y) => x - y); return vs[Math.floor(vs.length / 2)];
        };
        const update = () => {
          const { th, N, P } = geom(), key = `${th}|${N}|${P}`; if (key === cacheKey) return; cacheKey = key;
          vol = volumePerPocket(th, N, P, 140, 12);
          const gkey = `${N}|${P}`;
          if (curve.key !== gkey) { curve = []; curve.key = gkey; for (let d = 5; d <= 70; d += 1.5) curve.push([d, N * 1000 * volumePerPocket(d * D2R, N, P, 60, 6)]); }
        };
        v.animate((t) => {
          update();
          const { th, N, P } = geom(), psi = (2 * Math.PI * rpm.value * t) / 60;
          const e = [Math.cos(th), 0, Math.sin(th)], nn = [-Math.sin(th), 0, Math.cos(th)], lat = [0, 1, 0];
          const W = (s, r, phi) => { const c = Math.cos(phi), sn = Math.sin(phi); return [(s - L / 2) * e[0] + r * (c * lat[0] + sn * nn[0]), (s - L / 2) * e[1] + r * c, (s - L / 2) * e[2] + r * (c * lat[2] + sn * nn[2]) - 0.0]; };
          sc.begin();
          // ground, lower pool and upper channel
          const zLow = W(0, Ro, -Math.PI / 2)[2] + 0.15, zHigh = W(L, Ro, -Math.PI / 2)[2] + 0.02;
          sc.poly([[-2.4, -0.7, zLow], [-1.2, -0.7, zLow], [-1.2, 0.7, zLow], [-2.4, 0.7, zLow]], { fill: 'blue', fillAlpha: 0.25, color: 'blue', width: 1 });
          const xTop = W(L, 0, 0)[0];
          sc.poly([[xTop - 0.1, -0.5, zHigh], [xTop + 0.9, -0.5, zHigh], [xTop + 0.9, 0.5, zHigh], [xTop - 0.1, 0.5, zHigh]], { fill: 'orange', fillAlpha: 0.2, color: 'orange', width: 1 });
          // casing: end rings and four longitudinal lines
          for (const s of [0, L]) { const ring = []; for (let k = 0; k <= 48; k++) ring.push(W(s, Ro, (2 * Math.PI * k) / 48)); sc.path(ring, { color: 'muted', width: 1.2 }); }
          for (let k = 0; k < 4; k++) sc.line(W(0, Ro, (k * Math.PI) / 2 + 0.4), W(L, Ro, (k * Math.PI) / 2 + 0.4), { color: 'muted', width: 0.8, alpha: 0.5 }, 12);
          sc.line(W(-0.15, 0, 0), W(L + 0.15, 0, 0), { color: 'ink', width: 3 }, 12);
          // blade edges (outer helix of each blade)
          for (let j = 0; j < N; j++) {
            const pts = [];
            for (let u = (-2 * Math.PI * j) / N; u <= (2 * Math.PI * L) / P; u += 0.12) { const s = (P * u) / (2 * Math.PI) + (j * P) / N; if (s < 0 || s > L) continue; pts.push(W(s, Ro, u + psi)); }
            sc.path(pts, { color: j === 0 ? 'orange' : 'ink', width: j === 0 ? 2 : 1, alpha: j === 0 ? 1 : 0.55 });
          }
          // water in the pockets
          const st = Math.sin(th), ct = Math.cos(th), dots = [];
          const nuD = 26, nrD = 3, nsD = 3;
          for (let j = 0; j < N; j++) for (const pk of pockets(th, N, P, j, psi, (2 * Math.PI) / 180)) {
            for (let a = 0; a < nuD; a++) {
              const u = pk.uc + ((a + 0.5) * (pk.uc2 - pk.uc)) / nuD, sb = (P * (u - psi)) / (2 * Math.PI) + (j * P) / N, sn = Math.sin(u);
              for (let b = 0; b < nrD; b++) {
                const r = Ri + ((b + 0.5) * (Ro - Ri)) / nrD;
                for (let c = 0; c < nsD; c++) { const s = sb + ((c + 0.5) * (P / N)) / nsD; if (s < 0 || s > L) continue; if (s * st + r * sn * ct < pk.level) dots.push(W(s, r, u)); }
              }
            }
          }
          if (dots.length) sc.dots(dots, { r: 1.8, color: 'blue', top: false, d: 0 });
          sc.flush();
          const lift = L * Math.sin(th);
          S.corner(vol > 1e-6 ? `lift ${v.fix(lift, 2)} m · ${v.fix(N * vol * 1000, 2)} L per turn` : 'too steep: no pockets, the water runs back', 'tl', { size: 12, color: vol > 1e-6 ? 'ink' : 'red', weight: 700 });
          // B: curve
          const ymax = Math.max(1, ...curve.map((q) => q[1])) * 1.12;
          B.setView([5, 70], [0, ymax]);
          B.path(curve, { color: 'blue', width: 2.4 });
          B.vline(36.87, { color: 'purple', width: 1.2, dash: [4, 3] });
          B.text('3-4-5 slope', 37.6, ymax * 0.93, { size: 11, color: 'purple', align: 'left' });
          B.dot(thS.value, N * vol * 1000, { r: 5.5, color: vol > 1e-6 ? 'blue' : 'red' });
          drawYears(v, C, [
            { t: -700, label: 'Sennacherib’s “bronze screws”', contested: true },
            { t: -250, label: 'credited to Archimedes' },
            { t: -40, label: 'Diodorus: screws in the Nile Delta' },
            { t: -25, label: 'Vitruvius X.6: how to build one', color: 'purple' },
            { t: 1995, label: 'screw turbines (Brada)', color: 'green' },
          ], { lanes: 2, ticks: [-750, -500, -250, 1, 250, 500, 750, 1000, 1250, 1500, 1750, 2000] });
        }, { period: 600, still: 2 });
        v.legend([['blue', 'trapped water'], ['orange', 'one blade’s outer edge'], ['purple', 'Vitruvius’s 3-4-5 slope']]);
        v.readout(() => {
          update();
          const { th, N, P } = geom(), q = (N * vol * rpm.value) / 60, lim = (Math.atan((2 * Math.PI * Ri) / P) / D2R);
          return `screw 4 m long, outer diameter 0.5 m, shaft 0.25 m (Vitruvian proportions), lead ${v.fix(P, 3)} m, ${N} channel${N > 1 ? 's' : ''} · inclination ${v.fix(thS.value, 1)}° → lift ${v.fix(L * Math.sin(th), 2)} m · pocket ${v.fix(vol * 1000, 2)} L × ${N} per turn × ${rpm.value} turns/min = **${v.fix(q * 1000, 2)} L/s** (${v.fix(q * 3600, 1)} m³/h) · pockets need $p\\tan\\theta < 2\\pi r_{\\text{shaft}}$, i.e. θ below ${v.fix(lim, 1)}°${vol > 1e-6 ? '' : ' — **exceeded**'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.9
    {
      num: '2.9',
      kind: 'Invention',
      name: 'Gear trains and the Antikythera mechanism',
      credit: 'Hellenistic Greek, built c. 2nd century BCE (date disputed); recovered from a shipwreck of c. 70–60 BCE',
      statement: String.raw`Two meshing gears with $N_1$ and $N_2$ teeth turn in opposite directions with angular speeds in the ratio $N_2 : N_1$. In a **train**, where gears fixed on a common axle form compound stages, the ratios multiply: the output turns $\prod (N_{\text{driver}}/N_{\text{driven}})$ times per turn of the input, so whole-number tooth counts can represent astronomical period relations as exact fractions.

The **Antikythera mechanism**, a hand-cranked bronze calculator recovered in 1901 from a Roman-era wreck off Antikythera, used about thirty gears in this way. In the reconstruction of Freeth et al. (2006), a year's turn of the main wheel drives the **Moon pointer** through the train $64 \to 38,\ 48 \to 24,\ 127 \to 32$, giving
$$\frac{64}{38}\cdot\frac{48}{24}\cdot\frac{127}{32} = \frac{254}{19}$$
sidereal months per year (254 sidereal months ≈ 19 years), and drives the **Metonic** pointer, which runs round a five-turn spiral of 235 lunar months, through $64 \to 38,\ 53 \to 96,\ 15 \to 53$, giving $5/19$ of a turn per year. A pin-and-slot pair of gears made the Moon pointer speed up and slow down, modelling the Moon's varying speed. Freeth et al. (2021) reconstruct the front planetary display (for example Venus with gears 51, 44, 34, 26, 63). The construction date is debated: estimates range from about 205 BCE to about 100 BCE.`,
      idea: String.raw`A gear is a wheel and axle with teeth (tech-2.2): at the mesh both pitch circles move at the same speed, so $\omega_1 N_1 = \omega_2 N_2$. Compound stages let a designer factor a target ratio into practical tooth counts. The Moon train has to make $254/19 = 2\cdot127/19$, and 127 is prime, so some gear must have 127 teeth. Here it is the large gear d2, fed by the factors 64/38 = 32/19 and 48/24 = 2, which carry the 19.

The accuracy is that of the Greek period relation, not of the bronze. 254 sidereal months are 6939.7 days, 19 tropical years are 6939.6, so the Moon pointer drifts by about 1.3° every 19 years against the real Moon. Change one tooth count and the error becomes a full revolution within a few years.`,
      caption: String.raw`The gears are drawn with their real tooth counts and turn together. Choose the **Moon** or **Metonic** train; time runs at about half a year per second (pause it and drag the **years** slider to scrub). The dial shows the pointer against the Sun pointer (front) or on the 235-month spiral (back). The lower plot is the drift of the pointer from the true Moon or the true lunar months, over a century. **Break it** by changing the big gear's tooth count by one or two and watch the drift take off.`,
      deps: ['tech-2.2'],
      refs: ['Mokyr ch. 2', 'Freeth et al. 2006, Nature 444:587–591', 'Freeth et al. 2021, Sci. Rep. 11:5821', 'Price, Gears from the Greeks (1974)', 'Spinellis 2008, IEEE Computer 41(5):22–27'],
      tags: ['ancient', 'c. 100 BCE', 'gears'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Antikythera_mechanism' },
      viz(v) {
        const A = v.stage({ x: [-60, 150], y: [-110, 60], equal: true, axes: false, height: 340, weight: 1.35, minWidth: 360, title: 'gear train (real tooth counts)' });
        const B = v.stage({ x: [-1.25, 1.25], y: [-1.25, 1.25], equal: true, axes: false, height: 340, weight: 0.9, minWidth: 260, title: 'dial' });
        const P = v.stage({ x: [0, 100], y: [-30, 30], axes: 'box', gutter: true, height: 190, weight: 1, minWidth: 300, xlabel: 'years', ylabel: 'drift', title: 'pointer drift against the sky' });
        const C = yearStage(v, [-260, -40], { height: 190, weight: 1.2, minWidth: 340, title: 'dates proposed for the mechanism' });
        const train = v.select('train', [{ value: 'moon', label: 'Moon (254/19)' }, { value: 'met', label: 'Metonic (5/19)' }], 'moon');
        const big = v.slider('break it: teeth on the big gear', 120, 134, 127, { int: true });
        const yrS = v.slider('years (when paused)', 0, 19, 0, { step: 0.01 });
        const YEAR = 365.2422, SID = 27.321661, SYN = 29.530589;
        let years = 0;
        const def = () => train.value === 'moon'
          ? { names: ['b2', 'c1', 'c2', 'd1', 'd2', 'e2'], N: [64, 38, 48, 24, big.value, 32], bigName: 'd2', orig: 127 }
          : { names: ['b2', 'l1', 'l2', 'm1', 'm2', 'n1'], N: [64, 38, 53, big.value === 127 ? 96 : 96 + (big.value - 127), 15, 53], bigName: 'm1', orig: 96 };
        const ratioOf = (N) => (N[0] / N[1]) * (N[2] / N[3]) * (N[4] / N[5]);
        v.animate((t) => {
          years = v.playing ? (t * 0.5) % 100 : yrS.value;
          const d = def(), N = d.N, r = ratioOf(N), moon = train.value === 'moon';
          big.el.querySelector?.('label');
          // ---- A: layout: b at origin, then c/l, then d/m, then e/n
          const m = 1, rp = (k) => (m * N[k]) / 2;
          const cB = [0, 0];
          const a1 = moon ? -10 * D2R : 20 * D2R, a2 = moon ? -95 * D2R : -60 * D2R, a3 = moon ? 175 * D2R : 10 * D2R;
          const cC = [cB[0] + (rp(0) + rp(1)) * Math.cos(a1), cB[1] + (rp(0) + rp(1)) * Math.sin(a1)];
          const cD = [cC[0] + (rp(2) + rp(3)) * Math.cos(a2), cC[1] + (rp(2) + rp(3)) * Math.sin(a2)];
          const cE = [cD[0] + (rp(4) + rp(5)) * Math.cos(a3), cD[1] + (rp(4) + rp(5)) * Math.sin(a3)];
          const th0 = 2 * Math.PI * years; // b turns once per year
          const th1 = meshAngle(cB, N[0], th0, cC, N[1]);
          const th2 = th1; // same axle
          const th3 = meshAngle(cC, N[2], th2 + 0.0, cD, N[3]);
          const th4 = th3;
          const th5 = meshAngle(cD, N[4], th4, cE, N[5]);
          const cols = ['gold', 'orange', 'orange', 'purple', 'purple', 'accent'];
          // draw the larger gear of each compound pair first
          const order = [[cD, 4], [cD, 3], [cC, 2], [cC, 1], [cB, 0], [cE, 5]];
          const ang = [th0, th1, th2, th3, th4, th5];
          for (const [c, k] of order) gear(A, c[0], c[1], N[k], m, ang[k], { color: cols[k], fillAlpha: k === 4 ? 0.12 : 0.25, width: k === 4 && N[4] !== d.orig && moon ? 2 : 1.1 });
          const lab = (c, k, dx, dy) => A.text(`${d.names[k]}: ${N[k]}`, c[0] + dx, c[1] + dy, { size: 11.5, color: cols[k], align: 'center', weight: 700, plate: true });
          lab(cB, 0, 0, -rp(0) - 9);
          lab(cC, 1, 0, rp(1) + 8); lab(cC, 2, rp(2) + 14, -6);
          lab(cD, 3, -rp(3) - 14, 10); lab(cD, 4, 0, -rp(4) - 7);
          lab(cE, 5, 0, rp(5) + 8);
          A.text(moon ? '→ Moon pointer' : '→ Metonic pointer', cE[0], cE[1] - rp(5) - 8, { size: 11, color: 'accent', align: 'center' });
          A.text('← year (crank)', cB[0], cB[1] + rp(0) + 8, { size: 11, color: 'gold', align: 'center' });
          // ---- B: dial
          if (moon) {
            B.circle(0, 0, 1.12, { color: 'muted', width: 1.2 });
            B.circle(0, 0, 0.95, { color: 'muted', width: 1 });
            for (let k = 0; k < 12; k++) { const a = (k * Math.PI) / 6; B.line(0.95 * Math.cos(a), 0.95 * Math.sin(a), 1.12 * Math.cos(a), 1.12 * Math.sin(a), { color: 'muted', width: 1 }); B.text('♈♉♊♋♌♍♎♏♐♑♒♓'[k], 1.035 * Math.cos(a + Math.PI / 12), 1.035 * Math.sin(a + Math.PI / 12), { size: 11, color: 'muted', align: 'center', baseline: 'middle' }); }
            const sunA = Math.PI / 2 - th0, moonA = Math.PI / 2 - 2 * Math.PI * years * r, trueA = Math.PI / 2 - (2 * Math.PI * years * YEAR) / SID;
            B.line(0, 0, 0.85 * Math.cos(sunA), 0.85 * Math.sin(sunA), { color: 'gold', width: 4 });
            B.circle(0.85 * Math.cos(sunA), 0.85 * Math.sin(sunA), 0.07, { fill: 'gold', fillAlpha: 1 });
            B.line(0, 0, 0.7 * Math.cos(moonA), 0.7 * Math.sin(moonA), { color: 'accent', width: 3 });
            // moon phase ball: half lit according to elongation
            const el = moonA - sunA, mx = 0.7 * Math.cos(moonA), my = 0.7 * Math.sin(moonA);
            B.circle(mx, my, 0.09, { fill: 'ink', fillAlpha: 0.9, stroke: false });
            B.curve((s) => [mx + 0.09 * Math.cos(s), my + 0.09 * Math.sin(s)], -Math.PI / 2, Math.PI / 2, { color: 'panel', width: 0, fill: 'panel', fillAlpha: 1 });
            B.curve((s) => [mx + 0.09 * Math.cos(el) * Math.cos(s), my + 0.09 * Math.sin(s)], -Math.PI / 2, Math.PI / 2, { color: 'muted', width: 1 });
            B.dot(0.62 * Math.cos(trueA), 0.62 * Math.sin(trueA), { r: 3, color: 'green' });
            B.text(`year ${v.fix(years, 2)}`, 0, -0.35, { size: 12, color: 'ink', align: 'center', weight: 700 });
          } else {
            // Metonic spiral: 5 turns, 235 cells; pointer turns 5/19 per year
            const turns = 5, rIn = 0.35, rOut = 1.15;
            const rad = (ang) => rIn + ((rOut - rIn) * ang) / (2 * Math.PI * turns);
            B.curve((s) => [rad(s) * Math.cos(Math.PI / 2 - s), rad(s) * Math.sin(Math.PI / 2 - s)], 0, 2 * Math.PI * turns, { color: 'muted', width: 1, n: 600 });
            for (let k = 0; k <= 235; k++) { const s = (2 * Math.PI * turns * k) / 235, rr = rad(s); B.line((rr - 0.06) * Math.cos(Math.PI / 2 - s), (rr - 0.06) * Math.sin(Math.PI / 2 - s), (rr + 0.04) * Math.cos(Math.PI / 2 - s), (rr + 0.04) * Math.sin(Math.PI / 2 - s), { color: 'faint', width: 0.8 }); }
            const ptr = 2 * Math.PI * years * r, cell = Math.floor((235 * ptr) / (2 * Math.PI * turns)) % 235;
            const trueCell = Math.floor((years * YEAR) / SYN) % 235;
            const sp = (2 * Math.PI * turns * (cell + 0.5)) / 235, rr = rad(sp % (2 * Math.PI * turns));
            B.line(0, 0, (rr + 0.05) * Math.cos(Math.PI / 2 - ptr), (rr + 0.05) * Math.sin(Math.PI / 2 - ptr), { color: 'accent', width: 3 });
            B.dot(rr * Math.cos(Math.PI / 2 - sp), rr * Math.sin(Math.PI / 2 - sp), { r: 5, color: 'accent' });
            B.text(`month ${cell + 1} of 235`, 0, 0.05, { size: 12, color: 'accent', align: 'center', weight: 700 });
            B.text(`true: ${trueCell + 1}`, 0, -0.13, { size: 11, color: 'green', align: 'center' });
          }
          // ---- P: drift over a century
          const ideal = moon ? YEAR / SID : (5 / 19) * (19 * YEAR) / (235 * SYN); // turns per year that would be exact
          const unit = moon ? 360 : (235 / 5) * 1; // degrees of Moon, or months on the spiral (1 turn = 47 months)
          const drift = (y) => (r - ideal) * y * unit;
          const lim = Math.max(2, Math.abs(drift(100)) * 1.1);
          P.setView([0, 100], [-lim, lim]); P.setLabels('years', moon ? 'Moon pointer error (°)' : 'error (lunar months)');
          P.hline(0, { color: 'faint', width: 1 });
          P.fn(drift, { color: big.value === 127 ? 'green' : 'red', width: 2.4 });
          if (big.value !== 127) { const orig = moon ? ratioOf([64, 38, 48, 24, 127, 32]) : 5 / 19; P.fn((y) => (orig - ideal) * y * unit, { color: 'green', width: 1.4, dash: [5, 4] }); }
          P.dot(years, drift(years), { r: 5, color: 'gold' });
          drawYears(v, C, [
            { t: -205, label: 'start date 205 BCE (Carman & Evans)', contested: true },
            { t: -178, label: 'calibration 178 BCE (Voulgaris et al.)', contested: true },
            { t: [-150, -100], label: 'built 150–100 BCE (Freeth et al. 2006)' },
            { t: [-100, -70], label: 'shortly before the wreck (Iversen)', contested: true },
            { t: [-70, -60], label: 'shipwreck', color: 'green' },
          ], { lanes: 3, laneH: 0.21, ticks: [-250, -200, -150, -100, -50] });
        }, { period: 200, still: 7.5 });
        v.legend([['gold', 'b2: turns once a year'], ['accent', 'output pointer'], ['green', 'the real sky (true Moon / true month)'], ['red', 'broken train']]);
        v.readout(() => {
          const d = def(), N = d.N, r = ratioOf(N), moon = train.value === 'moon';
          const fr = moon ? `\\frac{64}{38}\\cdot\\frac{48}{24}\\cdot\\frac{${N[4]}}{32}` : `\\frac{64}{38}\\cdot\\frac{53}{${N[3]}}\\cdot\\frac{15}{53}`;
          if (moon) {
            const ideal = YEAR / SID, err19 = (r - ideal) * 19 * 360;
            return `Moon train: $${fr} = ${v.fix(r, 6)}$ turns per year${N[4] === 127 ? ' $= 254/19$' : ''} · astronomical $365.2422/27.321661 = ${v.fix(ideal, 6)}$ sidereal months per year · drift **${v.fix(err19, 2)}° per 19 years** · tooth counts after Freeth et al. 2006 (the Moon train is also Price's 1974 reading; the Metonic factors are confirmed by Spinellis 2008); the pin-and-slot pair that adds the lunar anomaly is left out here`;
          }
          const ideal = (5 / 19) * (19 * YEAR) / (235 * SYN), errMonths = (r - ideal) * 19 * 47;
          return `Metonic train: $${fr} = ${v.fix(r, 6)}$ turns per year${N[3] === 96 ? ' $= 5/19$' : ''} · 5 turns = 235 months should take $235\\times29.530589 = ${v.fix(235 * SYN, 2)}$ days; 19 tropical years are ${v.fix(19 * YEAR, 2)} days · drift **${v.fix(errMonths, 3)} months per 19 years** (the break-it slider changes m1 by the same amount)`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.10
    {
      num: '2.10',
      kind: 'Invention',
      name: 'The crank and connecting rod',
      credit: 'Roman Asia Minor: Hierapolis sawmill relief, second half of the 3rd century CE',
      statement: String.raw`A **crank** is an arm fixed at right angles to a rotating shaft; a **connecting rod** pinned to the crank's end and to a slider converts rotation into straight back-and-forth motion (or the reverse). With crank radius $r$ and rod length $l$, the slider's distance from the shaft at crank angle $\theta$ is
$$x(\theta) = r\cos\theta + \sqrt{l^2 - r^2\sin^2\theta},$$
a stroke of $2r$ that is close to simple harmonic motion only when $l \gg r$. At the two **dead centres** ($\theta = 0, \pi$) the rod lines up with the crank, and a push along the rod produces no turning effect.

The earliest known machine with a crank and connecting rod is the water-powered stone saw carved on the sarcophagus of Marcus Aurelius Ammianos at Hierapolis (Pamukkale, Turkey), from the second half of the 3rd century CE (Ritti, Grewe & Kessener 2007): a water wheel drives, through a gear train, cranks whose rods push two frame saws. Stone sawmills of the same type were excavated at Gerasa (Jerash) and Ephesus (6th century CE).`,
      idea: String.raw`The geometry is a triangle with sides $r$, $l$ and $x$: the rod's angle $\beta$ obeys $l\sin\beta = r\sin\theta$, which gives $x(\theta)$. Differentiating, the slider's speed is $r\omega\,\sin(\theta+\beta)/\cos\beta$, and by conservation of work (tech-2.6) the torque a rod force $F$ produces is $\tau = F r\sin(\theta+\beta)/\cos\beta$, which vanishes at the dead centres. A wheel driving a saw passes the dead centres without trouble. A rod driving the wheel, as in a later engine, needs a flywheel to carry it through.

Ritti, Grewe and Kessener point out that, with the crank and rod, all the elements of a steam engine (Hero's aeolipile for steam power, cylinders and pistons in force pumps, valves, gearing) existed in the Roman world. They were not put together until the 18th century.`,
      caption: String.raw`A Hierapolis-style saw: the **water wheel** (left) turns a gear pair and a **crank**, whose **rod** drives a saw frame through a stone block. Change the crank radius and the rod length. The top plot compares the saw's position with a pure sine wave of the same stroke (the gap is largest for a short rod); the bottom plot is the turning effect of a push along the rod, zero at the dead centres. Switch to **rod drives wheel** and turn off the flywheel: the engine stalls at a dead centre.`,
      deps: ['tech-2.2'],
      refs: ['Mokyr ch. 2', 'Ritti, Grewe & Kessener 2007, J. Roman Archaeology 20:138–163', 'White, Medieval Technology and Social Change (1962)'],
      tags: ['ancient', 'c. 250 CE', 'mechanism'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Hierapolis_sawmill' },
      viz(v) {
        const A = v.stage({ x: [-4.2, 8.4], y: [-2.3, 3.3], equal: true, axes: false, height: 300, full: true, title: 'water-powered stone saw (after the Hierapolis relief)' });
        const X = v.stage({ x: [0, 360], y: [-1.2, 1.2], axes: 'box', gutter: true, height: 210, weight: 1, minWidth: 280, xlabel: 'crank angle θ (°)', ylabel: 'saw position / r', title: 'saw position against a pure sine', xticks: [0, 90, 180, 270, 360] });
        const Tq = v.stage({ x: [0, 360], y: [-1.3, 1.3], axes: 'box', gutter: true, height: 210, weight: 1, minWidth: 280, xlabel: 'crank angle θ (°)', ylabel: 'torque / (F r)', title: 'turning effect of a push on the rod', xticks: [0, 90, 180, 270, 360] });
        const C = yearStage(v, [-50, 1650], { height: 210, weight: 1.1, minWidth: 320, title: 'dated evidence: cranks and connecting rods' });
        const rS = v.slider('crank radius $r$ (m)', 0.15, 0.6, 0.35, { step: 0.01 });
        const lS = v.slider('rod length / crank radius', 1.15, 8, 3.2, { step: 0.05 });
        const dir = v.select('drive', [{ value: 'wheel', label: 'wheel drives saw' }, { value: 'rod', label: 'rod drives wheel (engine)' }], 'wheel');
        const fly = v.toggle('flywheel', true);
        const kin = (th, r, l) => { const sb = (r * Math.sin(th)) / l, b = Math.asin(clamp(sb, -1, 1)); return { x: r * Math.cos(th) + Math.sqrt(Math.max(0, l * l - r * r * Math.sin(th) ** 2)), b, tq: Math.sin(th + b) / Math.cos(b) }; };
        let stallAt = null;
        v.animate((t) => {
          const r = rS.value, l = lS.value * r, w = 2 * Math.PI * 0.35; // rad/s
          let th = (w * t) % (2 * Math.PI);
          const engine = dir.value === 'rod';
          if (engine && !fly.value) { // without a flywheel the crank stops at the first dead centre it reaches (θ = π, after a power stroke from θ = 0.3)
            th = Math.min(0.3 + w * t, Math.PI); stallAt = th >= Math.PI - 1e-9 ? Math.PI : null;
          } else stallAt = null;
          const K = kin(th, r, l);
          // ---- geometry: crank centre at (2.2, 0.6); saw moves along y = 0.6 toward +x
          const cx = 2.2, cy = 0.6;
          // water wheel and gearing (schematic)
          const wa = th * (18 / 40); // wheel turns slower; gear pair 40→18 steps up
          A.rect(-4.2, -2.3, -0.4, -1.5, { fill: 'blue', fillAlpha: 0.25, stroke: false });
          A.circle(-2.2, 0.0, 1.55, { color: 'orange', width: 2.4, fill: 'orange', fillAlpha: 0.06 });
          for (let k = 0; k < 12; k++) { const a = -wa + (k * Math.PI) / 6; A.line(-2.2 + 1.2 * Math.cos(a), 1.2 * Math.sin(a), -2.2 + 1.75 * Math.cos(a), 1.75 * Math.sin(a), { color: 'orange', width: 3 }); }
          A.line(-2.2, 0, 0.0, 0, { color: 'muted', width: 3 });
          gear(A, 0.0, 0, 40, 0.05, -wa, { color: 'gold', fillAlpha: 0.2 });
          gear(A, 0.0 + 0.05 * (40 + 18) / 2 * Math.cos(0.75), 0.05 * (40 + 18) / 2 * Math.sin(0.75), 18, 0.05, th + 0.2, { color: 'gold', fillAlpha: 0.3 });
          const g2 = [0.05 * 29 * Math.cos(0.75), 0.05 * 29 * Math.sin(0.75)];
          A.line(g2[0], g2[1], cx, cy, { color: 'muted', width: 2.5, dash: [5, 4] });
          // crank disc, crank pin, rod
          A.circle(cx, cy, r * 1.25, { color: 'ink', width: 1.4, fill: fly.value ? 'muted' : 'panel', fillAlpha: fly.value ? 0.25 : 0.4 });
          if (fly.value) A.circle(cx, cy, r * 1.25 + 0.12, { color: 'ink', width: 4, alpha: 0.6 });
          const pin = [cx + r * Math.cos(th), cy + r * Math.sin(th)], sl = [cx + K.x, cy];
          A.line(cx, cy, pin[0], pin[1], { color: 'ink', width: 4 });
          A.line(pin[0], pin[1], sl[0], sl[1], { color: 'accent', width: 3.5 });
          A.dot(cx, cy, { r: 3.5, color: 'ink' }); A.dot(pin[0], pin[1], { r: 4, color: 'accent' });
          // saw frame and blade into a stone block
          const xs = sl[0];
          A.rect(xs, cy - 0.35, xs + 0.25, cy + 0.35, { fill: 'accent', fillAlpha: 0.3, color: 'accent', width: 1.4 });
          A.line(xs + 0.25, cy, xs + 2.8, cy, { color: 'ink', width: 2 });
          for (let k = 0; k < 18; k++) { const x = xs + 0.35 + k * 0.135; A.poly([[x, cy - 0.02], [x + 0.07, cy - 0.12], [x + 0.13, cy - 0.02]], { fill: 'ink', fillAlpha: 0.8, stroke: false }); }
          A.rect(cx + l + 0.4 - 0.2, -2.0, 8.3, cy - 0.12, { fill: 'muted', fillAlpha: 0.35, color: 'muted', width: 1.2 });
          A.text('stone block', 7.2, -1.2, { size: 11.5, color: 'ink', align: 'center' });
          ground(A, -0.4, 8.4, -2.0);
          // dead-centre marks
          for (const a of [0, Math.PI]) A.dot(cx + r * Math.cos(a), cy, { r: 2.5, color: 'red', hollow: true });
          A.corner(stallAt != null ? 'stalled at a dead centre: the rod pushes straight through the shaft' : engine ? 'the rod drives the wheel; the flywheel carries it through the dead centres' : 'the wheel drives the saw', 'tl', { size: 12, color: stallAt != null ? 'red' : 'ink', weight: 700 });
          // ---- X: position vs sine
          const deg = (th / D2R) % 360, off = (u) => (kin(u * D2R, r, l).x - l) / r;
          X.fn(off, { color: 'accent', width: 2.4, n: 360 });
          X.fn((u) => Math.cos(u * D2R), { color: 'muted', width: 1.4, dash: [5, 4] });
          X.dot(deg, off(deg), { r: 5, color: 'accent' });
          X.text(`largest gap ${v.fix(((l - Math.sqrt(l * l - r * r)) / r), 3)} r`, 180, 1.05, { size: 11, color: 'ink', align: 'center' });
          // ---- Tq: torque factor
          Tq.hline(0, { color: 'faint', width: 1 });
          Tq.fn((u) => kin(u * D2R, r, l).tq, { color: 'orange', width: 2.4, n: 360 });
          Tq.fn((u) => Math.sin(u * D2R), { color: 'muted', width: 1.2, dash: [5, 4] });
          for (const u of [0, 180, 360]) Tq.dot(u, 0, { r: 4, color: 'red', hollow: true });
          Tq.text('dead centre', 180, -0.22, { size: 11, color: 'red', align: 'center' });
          Tq.dot(deg, K.tq, { r: 5, color: 'orange' });
          drawYears(v, C, [
            { t: 150, label: 'iron crank, Augusta Raurica' },
            { t: 180, label: 'Han crank-handled fan model', contested: true },
            { t: [250, 300], label: 'Hierapolis sawmill relief', color: 'green' },
            { t: [500, 600], label: 'Gerasa and Ephesus sawmills' },
            { t: 1206, label: 'al-Jazari: crank in water-raising machines' },
            { t: 1588, label: 'Ramelli: 18 crank machines' },
          ], { lanes: 3, laneH: 0.21, ticks: [1, 250, 500, 750, 1000, 1250, 1500] });
        }, { period: 1e9, still: 1.1 });
        v.legend([['accent', 'connecting rod and saw position'], ['muted', 'pure sine (infinitely long rod)', { dash: true }], ['orange', 'torque factor sin(θ+β)/cos β'], ['red', 'dead centres', { dot: true }]]);
        v.readout(() => {
          const r = rS.value, l = lS.value * r;
          return `stroke $2r = ${v.fix(2 * r, 2)}$ m · rod $l = ${v.fix(l, 2)}$ m ($l/r = ${v.fix(lS.value, 2)}$) · deviation from simple harmonic motion at $\\theta = 90°$: $l - \\sqrt{l^2 - r^2} = ${v.fix(l - Math.sqrt(l * l - r * r), 3)}$ m ≈ $r^2/2l = ${v.fix((r * r) / (2 * l), 3)}$ m · rod angle up to ${v.fix(Math.asin(1 / lS.value) / D2R, 1)}° · torque from a rod push vanishes at θ = 0° and 180°${dir.value === 'rod' && !fly.value ? ' · **engine stalled**' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.11
    {
      num: '2.11',
      kind: 'Invention',
      name: 'The counterweight trebuchet',
      credit: 'Eastern Mediterranean, 12th century CE (earliest description: al-Tarsusi, c. 1187)',
      statement: String.raw`A **trebuchet** is a lever artillery engine: a beam pivoted on a frame with a short arm and a long arm, at whose end a **sling** holds the projectile. In the earlier **traction** trebuchet, known in China from the 4th century BCE, crews pulled ropes on the short arm. In the **counterweight** trebuchet a heavy box of earth or stones on the short arm falls, swinging the long arm and the sling up and over until the sling opens and the projectile flies. The earliest description and drawing is by Mardi ibn Ali al-Tarsusi (c. 1187), and the text implies that the engine was already in use. Byzantine reports from 1165 and earlier claims are **disputed**. Counterweight trebuchets threw stones of tens to hundreds of kilograms over a few hundred metres and dominated siege warfare until gunpowder artillery.

Scope: the model below is frictionless, has no air drag and a rigid beam, so its ranges are upper bounds.`,
      idea: String.raw`It is the lever of tech-2.1 run dynamically. The falling counterweight's potential energy (mech-3.6) is shared among the beam, the counterweight itself and the projectile. A long arm and a sling make the projectile's end move much faster than the counterweight, so a large share of the energy can end up in the projectile. The sling also acts as an extra joint that whips the projectile round at the end of the stroke, and a **hinged** counterweight, hanging from the beam, falls more nearly straight down and keeps less kinetic energy for itself. Range then depends on the moment of release: the sling's ring slides off a pin at a chosen angle, setting the launch angle and speed. The equations of motion here are Lagrange's, solved numerically for the beam, the sling and (if hinged) the counterweight's hanger, with the projectile first sliding along the ground.`,
      caption: String.raw`Set the **counterweight**, the **projectile**, the beam's **arm ratio** and the **sling length**, choose a **fixed** or **hinged** counterweight and set the **launch angle** at which the sling releases. The machine is simulated and animated (the still frame catches the release). The middle panel is the flight; the right panel plots range (solid) and efficiency, the projectile's kinetic energy over the counterweight's available potential energy (dashed), against launch angle for both kinds of counterweight. Try a sling of length zero: the efficiency collapses.`,
      deps: ['tech-2.1', 'mech-3.6'],
      refs: ['Mokyr ch. 3', 'Chevedden 2000, Dumbarton Oaks Papers 54:71–116', 'Purton, A History of the Late Medieval Siege (2010)', 'Denny 2005, Eur. J. Phys. 26:561'],
      tags: ['medieval', 'energy', 'mechanism'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Trebuchet' },
      viz(v) {
        const A = v.stage({ x: [-11, 11], y: [-0.8, 15], equal: true, axes: false, height: 330, weight: 1, minWidth: 300, title: 'the machine (metres)' });
        const F = v.stage({ x: [-20, 400], y: [0, 160], axes: 'box', gutter: true, height: 330, weight: 1.15, minWidth: 320, xlabel: 'distance (m)', ylabel: 'height (m)', title: 'flight (no air drag)' });
        const R = v.stage({ x: [10, 80], y: [0, 400], axes: 'box', gutter: true, height: 230, weight: 1, minWidth: 300, xlabel: 'launch angle (°)', ylabel: 'range (m)', title: 'range (solid) and efficiency (dashed, right scale 0–100%)' });
        const C = yearStage(v, [-450, 1350], { height: 230, weight: 1.1, minWidth: 340, title: 'dated evidence: trebuchets' });
        const cwS = v.slider('counterweight (kg)', 500, 12000, 4000, { step: 100 });
        const prS = v.slider('projectile (kg)', 5, 200, 40, { step: 1 });
        const kS = v.slider('arm ratio long : short', 2, 6, 4, { step: 0.1 });
        const slS = v.slider('sling length / long arm', 0, 1.3, 0.8, { step: 0.01 });
        const typ = v.select('counterweight', [{ value: 'fixed', label: 'fixed' }, { value: 'hinged', label: 'hinged' }], 'hinged');
        const relS = v.slider('launch angle (°)', 10, 80, 42, { step: 1 });
        const HP = 6.2, BEAM = 10.5, MBEAM = 700, LC = 1.6;
        const TH0 = Math.PI + 0.72;
        /** simulate one machine; returns {frames: [{t, pts}], releases(angle) → {..}} */
        function simulate(hinged) {
          const k = kS.value, L1 = (BEAM * k) / (k + 1), L2 = BEAM / (k + 1), Ls = Math.max(0.02, slS.value * L1), M = cwS.value, m = prS.value;
          const beamPts = [-L2, -L2 / 2, 0, L1 / 3, (2 * L1) / 3, L1].map((s) => s), mbE = MBEAM / beamPts.length;
          const tipOf = (th) => [L1 * Math.cos(th), HP + L1 * Math.sin(th)];
          const cwOf = (th, ph) => { const e = [-L2 * Math.cos(th), HP - L2 * Math.sin(th)]; return hinged ? [e[0] + LC * Math.cos(ph), e[1] + LC * Math.sin(ph)] : e; };
          const masses = [...beamPts.map(() => mbE), M, m];
          const posFree = (q) => { const th = q[0], ph = hinged ? q[1] : 0, ps = q[hinged ? 2 : 1], tip = tipOf(th); return [...beamPts.map((s) => [s * Math.cos(th), HP + s * Math.sin(th)]), cwOf(th, ph), [tip[0] + Ls * Math.cos(ps), tip[1] + Ls * Math.sin(ps)]]; };
          const projGround = (th) => { const tip = tipOf(th); return [tip[0] + Math.sqrt(Math.max(0, Ls * Ls - tip[1] * tip[1])), 0]; };
          const posGround = (q) => { const th = q[0], ph = hinged ? q[1] : 0; return [...beamPts.map((s) => [s * Math.cos(th), HP + s * Math.sin(th)]), cwOf(th, ph), projGround(th)]; };
          const accG = (q, qd) => lagrangeAccel(posGround, masses, q, qd), accF = (q, qd) => lagrangeAccel(posFree, masses, q, qd);
          let q = hinged ? [TH0, -Math.PI / 2] : [TH0], qd = hinged ? [0, 0] : [0], phase = tipOf(TH0)[1] >= Ls ? 1 : 0;
          const dt = 1 / 1500, frames = [], rel = [];
          const cw0 = cwOf(TH0, -Math.PI / 2)[1], cwMin = HP - L2 - (hinged ? LC : 0), Eav = M * G * (cw0 - cwMin);
          if (phase === 1) { const tip = tipOf(TH0); const ps = Math.atan2(-tip[1], 0.0001); q = [...q, ps]; qd = [...qd, 0]; }
          let prevAng = null;
          for (let step = 0; step < 6000; step++) {
            const t = step * dt;
            if (phase === 0) {
              [q, qd] = rk4(accG, q, qd, dt);
              const tip = tipOf(q[0]);
              // lift-off test: switch when the sling would pull the projectile up
              const P = projGround(q[0]), ps = Math.atan2(P[1] - tip[1], P[0] - tip[0]);
              const h = 1e-5, P2 = projGround(q[0] + h * qd[0]), tip2 = tipOf(q[0] + h * qd[0]), ps2 = Math.atan2(P2[1] - tip2[1], P2[0] - tip2[0]);
              const qf = [...q, ps], qdf = [...qd, (ps2 - ps) / h];
              const af = accF(qf, qdf), Jy = (() => { const e = 1e-6, a = posFree(qf), b = posFree(qf.map((x, i) => x + e * qdf[i])); return (b[b.length - 1][1] - a[a.length - 1][1]) / e; })();
              const yAcc = (() => { const e = 1e-4, pp = posFree(qf.map((x, i) => x + e * qdf[i] + 0.5 * e * e * af[i])), p0 = posFree(qf); return (pp[pp.length - 1][1] - p0[p0.length - 1][1] - e * Jy) * 2 / (e * e); })();
              if (tip[1] >= Ls * 0.999 || yAcc > 0) { phase = 1; q = qf; qd = qdf; }
            } else [q, qd] = rk4(accF, q, qd, dt);
            const pts = phase === 0 ? posGround(q) : posFree(q);
            if (step % 15 === 0) frames.push({ t, pts, q: q.slice(), phase });
            if (phase === 1) {
              // projectile velocity by finite difference of position
              const e = 1e-6, pa = posFree(q), pb = posFree(q.map((x, i) => x + e * qd[i])), p = pa[pa.length - 1];
              const vx = (pb[pb.length - 1][0] - p[0]) / e, vy = (pb[pb.length - 1][1] - p[1]) / e, ang = Math.atan2(vy, vx) / D2R;
              if (vx > 0 && prevAng != null) for (let a = 10; a <= 80; a++) if (prevAng > a && ang <= a && !rel[a]) { const sp = Math.hypot(vx, vy), tf = (vy + Math.sqrt(vy * vy + 2 * G * Math.max(0, p[1]))) / G; rel[a] = { t, p: p.slice(), vx, vy, range: p[0] + vx * tf, eff: (0.5 * m * sp * sp) / Eav, sp, tf }; }
              prevAng = vx > 0 ? ang : (prevAng ?? 180);
              if (q[0] < -0.6 && rel[10]) break;
            }
          }
          return { frames, rel, L1, L2, Ls, Eav, hinged };
        }
        let key = '', sims = {};
        const run = () => { const k = `${cwS.value}|${prS.value}|${kS.value}|${slS.value}`; if (k !== key) { key = k; sims = { fixed: simulate(false), hinged: simulate(true) }; } return sims; };
        v.animate((t) => {
          const S = run(), sim = S[typ.value], r = sim.rel[relS.value];
          const tRel = r ? r.t : Infinity, tEnd = (r ? r.t + r.tf : 3) + 0.8;
          const tt = (t * 0.6) % (tEnd + 0.6); // slowed for viewing
          const fr = sim.frames.reduce((best, f) => (f.t <= Math.min(tt, sim.frames[sim.frames.length - 1].t) ? f : best), sim.frames[0]);
          // ---- A: machine
          ground(A, -11, 11, 0);
          A.poly([[-2.4, 0], [0, HP], [2.4, 0]], { color: 'orange', width: 4, fill: 'orange', fillAlpha: 0.05 });
          const P = tt < tRel ? fr.pts : sim.frames.reduce((best, f) => (f.t <= tRel ? f : best), sim.frames[0]).pts;
          const nb = 6, beamA = P[0], beamB = P[nb - 1], cw = P[nb], pr = P[nb + 1];
          A.line(beamA[0], beamA[1], beamB[0], beamB[1], { color: 'ink', width: 5 });
          A.dot(0, HP, { r: 4, color: 'ink' });
          if (sim.hinged) A.line(beamA[0], beamA[1], cw[0], cw[1], { color: 'muted', width: 2 });
          const cs = 0.55 + 0.25 * Math.log10(cwS.value / 500);
          A.rect(cw[0] - cs, cw[1] - cs, cw[0] + cs, cw[1] + cs, { fill: 'muted', fillAlpha: 0.6, color: 'ink', width: 1.4 });
          A.text(`${v.fmt(cwS.value / 1000, 2)} t`, cw[0], cw[1], { size: 10.5, color: 'ink', align: 'center', baseline: 'middle', weight: 700 });
          if (tt < tRel) { A.line(beamB[0], beamB[1], pr[0], pr[1], { color: 'gold', width: 1.6 }); A.dot(pr[0], pr[1], { r: 5 + Math.log10(prS.value), color: 'gold' }); }
          else if (r) { const tau = tt - tRel, x = r.p[0] + r.vx * tau, y = r.p[1] + r.vy * tau - 0.5 * G * tau * tau; if (y > -0.5 && x < 11) A.dot(x, Math.max(0, y), { r: 5 + Math.log10(prS.value), color: 'gold' }); A.text(`released at ${v.fix(r.sp, 1)} m/s`, 0, 14.2, { size: 12, color: 'gold', align: 'center', weight: 700, plate: true }); }
          // ---- F: flight
          const maxR = Math.max(60, ...['fixed', 'hinged'].map((k) => Math.max(0, ...Object.values(S[k].rel).filter(Boolean).map((x) => x.range))));
          F.setView([-10, maxR * 1.08], [0, Math.max(30, maxR * 0.45)]);
          for (const k of ['fixed', 'hinged']) {
            const rr = S[k].rel[relS.value]; if (!rr) continue;
            const pts = []; for (let i = 0; i <= 80; i++) { const tau = (rr.tf * i) / 80; pts.push([rr.p[0] + rr.vx * tau, rr.p[1] + rr.vy * tau - 0.5 * G * tau * tau]); }
            F.path(pts, { color: k === 'hinged' ? 'accent' : 'orange', width: k === typ.value ? 2.6 : 1.4, dash: k === typ.value ? null : [5, 4] });
            F.dot(rr.range, 0, { r: 4.5, color: k === 'hinged' ? 'accent' : 'orange' });
            F.text(`${v.fmt(rr.range, 3)} m`, rr.range, 0, { size: 11, color: k === 'hinged' ? 'accent' : 'orange', align: 'center', dy: -12, plate: true });
          }
          if (r && tt >= tRel) { const tau = Math.min(tt - tRel, r.tf); F.dot(r.p[0] + r.vx * tau, Math.max(0, r.p[1] + r.vy * tau - 0.5 * G * tau * tau), { r: 5, color: 'gold' }); }
          // ---- R: range and efficiency vs launch angle
          const rmax = Math.max(50, maxR) * 1.1; R.setView([10, 80], [0, rmax]);
          for (const k of ['fixed', 'hinged']) {
            const col = k === 'hinged' ? 'accent' : 'orange', ptsR = [], ptsE = [];
            for (let a = 10; a <= 80; a++) { const x = S[k].rel[a]; if (x) { ptsR.push([a, x.range]); ptsE.push([a, x.eff * rmax]); } }
            R.path(ptsR, { color: col, width: 2.2 }); R.path(ptsE, { color: col, width: 1.4, dash: [5, 4] });
          }
          if (r) { R.vline(relS.value, { color: 'gold', width: 1.2 }); R.dot(relS.value, r.range, { r: 5, color: 'gold' }); }
          drawYears(v, C, [
            { t: -350, label: 'traction trebuchet, Mozi (China)' },
            { t: 1090, label: 'Salamiya', contested: true },
            { t: 1165, label: 'Zevgminon (Choniates)', contested: true },
            { t: 1187, label: 'al-Tarsusi: first description', color: 'green' },
          ], { lanes: 3, laneH: 0.21, ticks: [-250, 1, 250, 500, 750, 1000, 1250] });
        }, { period: 1e9, still: 2.2 });
        v.legend([['accent', 'hinged counterweight'], ['orange', 'fixed counterweight'], ['gold', 'projectile and chosen launch angle']]);
        v.readout(() => {
          const S = run(), sim = S[typ.value], r = sim.rel[relS.value], o = S[typ.value === 'fixed' ? 'hinged' : 'fixed'].rel[relS.value];
          if (!r) return `the projectile never reaches a ${relS.value}° launch angle with this machine: shorten the sling or change the arm ratio`;
          return `long arm ${v.fix(sim.L1, 2)} m, short arm ${v.fix(sim.L2, 2)} m, sling ${v.fix(sim.Ls, 2)} m · counterweight energy available ${v.fmt(sim.Eav / 1000, 3)} kJ · release at ${relS.value}°: speed **${v.fix(r.sp, 1)} m/s**, kinetic energy ${v.fmt((0.5 * prS.value * r.sp * r.sp) / 1000, 3)} kJ, efficiency **${v.fix(100 * r.eff, 1)}%**, range **${v.fmt(r.range, 3)} m**${o ? ` (${typ.value === 'fixed' ? 'hinged' : 'fixed'}: ${v.fmt(o.range, 3)} m, ${v.fix(100 * o.eff, 1)}%)` : ''} · reconstructions: 2 t counterweight, 12–15 kg stones, 120–168 m (Purton); frictionless, drag-free model, so ranges are upper bounds`;
        });
      },
    },
  ],
};
