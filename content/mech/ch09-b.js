// Classical Mechanics — Chapter 9: Non-inertial frames (part b: 9.8–9.13)

import { TAU, DEG, OMEGA, SIDEREAL_H, memo, rk4, rk4rec, idxAt, span, sci, num, rot, zcross, turntable, spinArrow, farrow, series } from './ch09.shared.js';

/** Wrap an angle into (−π, π]. */
const wrap = (a) => { a = (a + Math.PI) % TAU; if (a <= 0) a += TAU; return a - Math.PI; };

// Historical eastward-deflection drops: height (m), latitude (°), measured deflection (mm) ± probable error.
// Sources: Reich, Fallversuche über die Umdrehung der Erde (Freiberg, 1832) via Wikipedia (“Ferdinand Reich”);
// table B1 of B. M. Roehner, arXiv:1112.5408 (2011), compiled from Benzenberg (1804), Bruhat (1955) and Hall (1903).
const DROPS = [
  { key: 'gug', who: 'Guglielmini 1791', h: 78, lat: 44.49, d: 18.9, err: 0, bad: true },
  { key: 'benz', who: 'Benzenberg 1802', h: 76, lat: 53.55, d: 9.0, err: 0 },
  { key: 'reich', who: 'Reich 1831', h: 158.5, lat: 50.887, d: 28.4, err: 0.4 },
  { key: 'hall', who: 'Hall 1903', h: 23, lat: 42.377, d: 1.49, err: 0.05 },
];

export default {
  collection: 'mech',
  chapter: 9,
  items: [
    // ───────────────────────────────────────────────────────────── 9.8
    {
      num: '9.8',
      kind: 'Phenomenon',
      name: 'Coriolis force',
      statement: String.raw`In a frame rotating with angular velocity $\boldsymbol\omega$, a body moving with velocity $\mathbf v$ (measured in that frame) feels the **Coriolis force**
$$\mathbf F_{\rm cor} = -2m\,\boldsymbol\omega\times\mathbf v .$$
It is perpendicular to the velocity, so it changes the direction of motion but not the speed. For anticlockwise rotation (seen from above along $\boldsymbol\omega$) it deflects horizontal motion to the **right**, and for clockwise rotation to the left. A ball thrown at speed $v$ across a merry-go-round of diameter $D$ turning at $\omega$ lands about $\omega D^2/v$ to the side of where it was aimed, as long as $\omega D/v \ll 1$. On the Earth the horizontal part of the Coriolis acceleration is $f\,\hat{\mathbf z}\times\mathbf v$ in magnitude $fv$, with the **Coriolis parameter** $f = 2\Omega\sin\lambda$; it deflects motion to the right in the northern hemisphere and to the left in the southern.`,
      idea: String.raw`The Coriolis term is the velocity-dependent part of Newton’s law in a rotating frame (9.6). Seen from the lab, nothing deflects the ball: it keeps the sideways velocity $\omega R$ it shared with the thrower, and during its flight the target is carried round. Both effects are first order in $\omega$, and together they give a sideways drift that grows like $t^2$, as for a constant sideways acceleration $2\omega v$. The centrifugal force adds only a correction of order $\omega^2$. On the Earth only the local vertical component $\Omega\sin\lambda$ of the rotation matters for horizontal motion, which is why the effect vanishes at the equator and changes sign across it.`,
      caption: String.raw`A thrower on the rim (black) aims three balls straight at the red target opposite, at the chosen speed and at $0.6\times$ and $1.7\times$ it. Left: in the lab the balls fly straight, but the merry-go-round turns under them. Right: in the merry-go-round frame they curve to the right, pushed by the Coriolis force (purple arrows, perpendicular to the path) and, more weakly, by the centrifugal force (orange). Bottom: the miss at the far rim against the launch speed, computed exactly, with the Coriolis estimate $\omega D^2/v$ (dashed). Slow balls and fast rotation leave the estimate behind; reverse the rotation and the balls curve the other way.`,
      deps: ['mech-9.6'],
      see: ['geo-2.1'],
      refs: ['Taylor §9.7', 'Goldstein §4.10'],
      tags: ['Coriolis force', 'rotating frame', 'deflection'],
      credit: 'Coriolis, 1835',
      viz(v) {
        const wS = v.slider('rotation rate $\\omega$ (rad/s)', 0.02, 1.2, 0.45, { step: 0.01 });
        const vS = v.slider('launch speed $v$ (m/s)', 2, 20, 6, { step: 0.1 });
        const sense = v.select('turning', [{ value: 'ccw', label: 'anticlockwise (northern hemisphere)' }, { value: 'cw', label: 'clockwise (southern)' }], 'ccw');
        const R = 3, KF = 0.2, D = 2 * R;
        const sL = v.stage({ x: [-3.7, 3.7], y: [-3.7, 3.7], equal: true, axes: false, height: 300, title: 'lab frame, from above' });
        const sR = v.stage({ x: [-3.7, 3.7], y: [-3.7, 3.7], equal: true, axes: false, height: 300, title: 'merry-go-round frame' });
        const sD = v.stage({ x: [2, 20], y: [0.01, 20], xlog: true, ylog: true, axes: 'box', height: 210, full: true, xlabel: 'launch speed v (m/s)', title: 'sideways miss at the far rim (m)' });
        /** A ball thrown from the rim (0, −R) straight at (0, R) in the rotating frame: in the lab it moves on a straight line. */
        const shot = (w, sp) => {
          const vx = w * R, vy = sp, tf = (2 * R * vy) / (vx * vx + vy * vy);
          const lab = (t) => [vx * t, -R + vy * t], rotp = (t) => { const p = lab(t); return rot(p[0], p[1], -w * t); };
          const e = rotp(tf), miss = R * wrap(Math.PI / 2 - Math.atan2(e[1], e[0]));
          return { tf, lab, rotp, miss, sp };
        };
        const COLS = ['teal', 'accent', 'pink'];
        let cur = null;
        v.animate((tA) => {
          const w = (sense.value === 'ccw' ? 1 : -1) * wS.value, sp = vS.value, shots = [0.6, 1, 1.7].map((k) => shot(w, k * sp));
          const t = tA % 3.6;
          // lab
          turntable(sL, R, w * t, { mark: false });
          spinArrow(sL, 0, 0, R + 0.32, Math.PI / 2 + w * t, Math.sign(w) * 1.1, { color: 'orange' });
          const sh = rot(0, -R, w * t), tg = rot(0, R, w * t);
          shots.forEach((S, i) => {
            const tt = Math.min(t, S.tf), p = S.lab(tt), e = S.lab(S.tf);
            sL.line(0, -R, e[0], e[1], { color: COLS[i], width: 1, alpha: 0.3, dash: [3, 4] });
            sL.line(0, -R, p[0], p[1], { color: COLS[i], width: 2 });
            sL.dot(p[0], p[1], { r: 5, color: COLS[i] });
          });
          sL.dot(sh[0], sh[1], { r: 6.5, color: 'ink' });
          sL.circle(tg[0], tg[1], 0.2, { color: 'red', width: 2.4 });
          sL.corner(`t = ${v.fix(t, 2)} s`, 'tl');
          // rotating
          turntable(sR, R, 0, { mark: false });
          sR.line(0, -R, 0, R, { color: 'red', width: 1, dash: [4, 4], alpha: 0.6 });
          shots.forEach((S, i) => {
            const pts = []; for (let j = 0; j <= 120; j++) pts.push(S.rotp((S.tf * j) / 120));
            sR.path(pts, { color: COLS[i], width: 1.1, alpha: 0.35 });
            const tt = Math.min(t, S.tf), done = []; for (let j = 0; j <= 120 && (S.tf * j) / 120 <= tt; j++) done.push(S.rotp((S.tf * j) / 120)); done.push(S.rotp(tt));
            sR.path(done, { color: COLS[i], width: 2.2 });
            if (i === 1) for (let j = 1; j <= 5; j++) { // Coriolis force per unit mass along the main path
              const s = (S.tf * j) / 6, a = S.rotp(s - 1e-4), b = S.rotp(s + 1e-4), q = S.rotp(s), vr = [(b[0] - a[0]) / 2e-4, (b[1] - a[1]) / 2e-4], co = zcross(-2 * w, vr[0], vr[1]);
              farrow(sR, q[0], q[1], co[0], co[1], KF * 0.6, 'purple', null, { width: 1.6, head: 6, alpha: 0.75 });
            }
            const q = S.rotp(tt);
            if (i === 1 && t < S.tf) {
              const a = S.rotp(Math.max(0, tt - 1e-4)), b = S.rotp(tt + 1e-4), vr = [(b[0] - a[0]) / (tt + 1e-4 - Math.max(0, tt - 1e-4)), (b[1] - a[1]) / (tt + 1e-4 - Math.max(0, tt - 1e-4))];
              const co = zcross(-2 * w, vr[0], vr[1]); farrow(sR, q[0], q[1], co[0], co[1], KF, 'purple', null, { width: 2.6 });
              farrow(sR, q[0], q[1], w * w * q[0], w * w * q[1], KF, 'orange', null, { width: 2.6 });
            }
            sR.dot(q[0], q[1], { r: 5, color: COLS[i] });
          });
          sR.dot(0, -R, { r: 6.5, color: 'ink' }); sR.text('thrower', 0, -R, { color: 'ink', size: 11, dy: 16, align: 'center' });
          sR.circle(0, R, 0.2, { color: 'red', width: 2.4 }); sR.text('target', 0, R, { color: 'red', size: 11, dy: -18, align: 'center' });
          sR.corner(w > 0 ? 'balls veer right' : 'balls veer left', 'tl', { color: 'purple', weight: 600 });
          // miss against speed
          const ex = [], est = [];
          for (let j = 0; j <= 80; j++) { const s = 2 * 10 ** (j / 80); ex.push([s, Math.abs(shot(w, s).miss)]); est.push([s, (Math.abs(w) * D * D) / s]); }
          const top = Math.max(...ex.map((q) => q[1]), ...est.map((q) => q[1]));
          sD.setView([2, 20], [Math.max(1e-3, Math.min(...ex.map((q) => q[1])) / 2), Math.max(1, top * 1.8)]);
          sD.path(est, { color: 'ink', width: 1.4, dash: [6, 4] });
          sD.path(ex, { color: 'accent', width: 2.4 });
          shots.forEach((S, i) => { if (S.sp >= 2 && S.sp <= 20) sD.dot(S.sp, Math.abs(S.miss), { r: 5, color: COLS[i] }); });
          cur = { w, sp, S: shots[1] };
        }, { period: 3.6, still: 1.05 });
        v.legend([['accent', 'chosen speed (exact)'], ['teal', '0.6×'], ['pink', '1.7×'], ['purple', 'Coriolis $-2m\\boldsymbol\\omega\\times\\mathbf v$'], ['orange', 'centrifugal'], ['ink', 'estimate $\\omega D^2/v$', { dash: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const { w, sp, S } = cur, est = (Math.abs(w) * D * D) / sp;
          return String.raw`$D = ${D}$ m, $\omega = ${v.fix(w, 2)}$ rad/s, $v = ${v.fix(sp, 1)}$ m/s: flight time ${v.fix(S.tf, 3)} s, miss ${v.fix(Math.abs(S.miss), 3)} m to the ${S.miss > 0 ? 'right' : 'left'}; Coriolis estimate $\omega D^2/v = ${v.fix(est, 3)}$ m (ratio ${v.fix(Math.abs(S.miss) / est, 3)}; the parameter $\omega D/v = ${v.fix((Math.abs(w) * D) / sp, 3)}$ measures how good it is) · in the lab the ball keeps the thrower’s sideways speed $\omega R = ${v.fix(Math.abs(w) * R, 3)}$ m/s while the target is carried ${v.fix(Math.abs(w) * R * S.tf, 2)} m round the rim`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 9.9
    {
      num: '9.9',
      kind: 'Phenomenon',
      name: 'Eastward deflection of falling bodies',
      statement: String.raw`A body dropped from rest at height $h$ and latitude $\lambda$ on the rotating Earth lands east of the foot of the plumb line from its release point. Neglecting air resistance, and to first order in the Earth’s rotation rate $\Omega$, the deflection is
$$d_{\rm E} = \tfrac13\,\Omega g\,t^3\cos\lambda = \frac{2\sqrt2}{3}\,\Omega\cos\lambda\,\frac{h^{3/2}}{\sqrt g},\qquad t = \sqrt{2h/g},$$
the same eastward direction in both hemispheres and largest at the equator. A southward deflection (northward in the southern hemisphere) appears only at second order in $\Omega$ and is negligible for laboratory heights. For a 158.5 m drop at Freiberg ($50.9°$ N) the formula gives about $27.6$ mm. **Reich (1831)** measured $28.4$ mm, averaged over 106 drops down a mine shaft.`,
      idea: String.raw`In the Earth’s frame, the falling body’s downward velocity $v_z = -gt$ makes the Coriolis acceleration $-2\boldsymbol\Omega\times\mathbf v$ (9.8) point east, with size $2\Omega gt\cos\lambda$; integrating twice gives $\tfrac13\Omega gt^3\cos\lambda$. In the inertial frame the explanation is angular momentum: at release the body moves east with the top of the tower, at speed $\Omega(R+h)\cos\lambda$, which is slightly faster than the foot of the tower moves; as it falls it conserves its angular momentum about the axis and runs ahead. The effect is tiny, a few millimetres per hundred metres, so it took careful nineteenth-century drops to see it.`,
      caption: String.raw`Left: the fall seen on the rotating Earth, with the horizontal axis in millimetres, so it is magnified about a thousand times. The ball (gold) follows the integrated path, which lies on the dashed formula curve; the red point is the historical measurement for the chosen experiment, with its error bar. Choose a historical drop or set your own height and latitude: the deflection grows like $h^{3/2}$ and vanishes only at the poles. Right: the formula for this latitude against height, with the measurements (filled) and each one’s prediction at its own latitude (rings). Guglielmini’s 1791 result is known to be unreliable.`,
      deps: ['mech-9.8'],
      refs: ['Taylor §9.8'],
      tags: ['Coriolis force', 'free fall', 'Earth’s rotation'],
      credit: 'Predicted by Newton (1679); measured by Benzenberg (1802), Reich (1831) and Hall (1903)',
      viz(v) {
        const PRE = { reich: 'Reich 1831 (Freiberg)', hall: 'Hall 1903 (Harvard)', benz: 'Benzenberg 1802 (Hamburg)', own: 'your own' };
        let hS = null, lS = null;
        const pre = v.select('drop', Object.entries(PRE).map(([value, label]) => ({ value, label })), 'reich', { onChange: (k) => { const D = DROPS.find((q) => q.key === k); if (D) { hS.set(D.h); lS.set(D.lat); } } });
        hS = v.slider('drop height $h$ (m)', 1, 1000, 158.5, { log: true });
        lS = v.slider('latitude $\\lambda$ (°)', -89, 89, 50.887, { step: 0.01 });
        const sT = v.stage({ x: [-8, 40], y: [0, 170], axes: 'box', height: 330, ylabel: 'height (m)', title: 'the fall on the rotating Earth: millimetres east of the plumb line' });
        const sC = v.stage({ x: [5, 1000], y: [0.1, 400], xlog: true, ylog: true, axes: 'box', height: 330, xlabel: 'h (m)', title: 'eastward deflection (mm)' });
        const g = 9.81;
        const formula = (h, lat) => (1 / 3) * OMEGA * g * Math.cos(lat * DEG) * Math.sqrt(2 * h / g) ** 3;
        const cache = memo();
        const fall = () => cache(hS.value + '|' + lS.value, () => {
          const h = hS.value, lat = lS.value * DEG, Oy = OMEGA * Math.cos(lat), Oz = OMEGA * Math.sin(lat), tf = Math.sqrt((2 * h) / g);
          const f = (t, S) => [S[3], S[4], S[5], -2 * (Oy * S[5] - Oz * S[4]), -2 * Oz * S[3], -g + 2 * Oy * S[3]];
          const n = 3000, dt = (1.02 * tf) / n; let S = [0, 0, h, 0, 0, 0], t = 0; const path = [[0, h]];
          for (let k = 0; k < n; k++) {
            const S2 = rk4(f, t, S, dt);
            if (S2[2] <= 0) { const u = S[2] / (S[2] - S2[2]); S = S.map((c, i) => c + u * (S2[i] - c)); t += u * dt; path.push([S[0] * 1000, 0]); break; }
            S = S2; t += dt; if (k % 10 === 0) path.push([S[0] * 1000, S[2]]);
          }
          return { h, lat: lS.value, east: S[0] * 1000, north: S[1] * 1000, tf: t, path, pred: formula(h, lS.value) * 1000 };
        });
        let cur = null;
        v.animate((tA) => {
          const F = fall(), D = DROPS.find((q) => q.key === pre.value), match = D && Math.abs(D.h - F.h) < 0.05 && Math.abs(D.lat - F.lat) < 0.02;
          const dm = Math.max(F.east, F.pred, match ? D.d + D.err : 0, 1e-6);
          sT.setView([-0.28 * dm, 1.5 * dm], [-0.13 * F.h, 1.1 * F.h]);
          sT.vline(0, { color: 'muted', width: 1.4, dash: [6, 4] });
          sT.text('plumb line', 0, 0.55 * F.h, { color: 'muted', size: 11, dx: 6, align: 'left' });
          sT.rect(-0.28 * dm - 1, -0.2 * F.h, 1.5 * dm + 1, 0, { fill: 'green', fillAlpha: 0.1, stroke: false });
          sT.hline(0, { color: 'green', width: 2 });
          const fc = []; for (let j = 0; j <= 100; j++) { const z = F.h * (1 - j / 100); fc.push([formula(F.h - z, F.lat) * 1000, z]); }
          sT.path(fc, { color: 'green', width: 7, alpha: 0.25 });
          sT.path(fc, { color: 'green', width: 1.4, dash: [6, 4] });
          const frac = Math.min(1, tA / 3), k = Math.max(1, Math.round(frac * (F.path.length - 1)));
          sT.path(F.path.slice(0, k + 1), { color: 'accent', width: 2.6 });
          if (match) {
            sT.line(D.d - D.err, 0, D.d + D.err, 0, { color: 'red', width: 3 });
            sT.dot(D.d, 0, { r: 5.5, color: 'red' });
            sT.text(`${D.who}: ${D.d}${D.err ? ' ± ' + D.err : ''} mm`, D.d, 0, { color: 'red', size: 11.5, dx: 12, dy: -16, align: 'left' });
          }
          const p = F.path[k]; sT.dot(p[0], p[1], { r: 7, color: 'gold' });
          sT.dot(0, F.h, { r: 3, color: 'ink' });
          sT.corner(`fall time ${v.fix(F.tf, 2)} s`, 'tr');
          // deflection against height
          const curve = []; for (let j = 0; j <= 80; j++) { const h = 5 * 200 ** (j / 80); curve.push([h, formula(h, F.lat) * 1000]); }
          sC.path(curve, { color: 'accent', width: 2.4 });
          for (const q of DROPS) {
            const pr = formula(q.h, q.lat) * 1000;
            sC.dot(q.h, pr, { r: 5, hollow: true, color: q.bad ? 'muted' : 'ink' });
            sC.dot(q.h, q.d, { r: 5, color: q.bad ? 'muted' : 'red' });
            if (q.err) sC.line(q.h, q.d - q.err, q.h, q.d + q.err, { color: 'red', width: 2 });
            sC.text(q.who, q.h, q.d, { color: q.bad ? 'muted' : 'red', size: 10.5, dx: q.key === 'gug' ? -8 : 8, dy: q.key === 'benz' ? 12 : q.key === 'gug' ? -12 : -8, align: q.key === 'gug' ? 'right' : 'left' });
          }
          sC.dot(F.h, F.pred, { r: 5.5, color: 'gold' });
          cur = { F, D, match };
        }, { period: 4.5, still: 4 });
        v.legend([['accent', 'integrated fall / formula at this latitude'], ['green', '$\\tfrac13\\Omega g t^3\\cos\\lambda$ along the fall', { dash: true }], ['red', 'measured', { dot: true }], ['ink', 'prediction at the experiment’s latitude', { dot: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const { F, D, match } = cur;
          let out = String.raw`$h = ${v.fmt(F.h, 4)}$ m at $${v.fix(F.lat, 2)}°$: integrated east ${num(v, F.east, 3)} mm, formula $\tfrac13\Omega g t^3\cos\lambda = ${num(v, F.pred, 3)}$ mm; ${F.lat >= 0 ? 'south' : 'north'} ${sci(v, Math.abs(F.north), 2)} mm (second order in $\Omega$)`;
          if (match) {
            out += String.raw` · ${D.who}: measured ${D.d}${D.err ? ' ± ' + D.err : ''} mm, ${v.fix((100 * (D.d - F.pred)) / F.pred, 0)}% from the vacuum formula`;
            if (D.key === 'reich') out += ' · Reich also found 4.4 mm to the south, which rotation cannot explain (it predicts thousandths of a millimetre): air currents in the shaft are the likely cause';
            if (D.key === 'hall') out += ' · Hall used 948 drops of bell-metal balls inside a building; air resistance shortens the deflection';
          }
          return out;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 9.10
    {
      num: '9.10',
      kind: 'Phenomenon',
      name: 'Foucault pendulum',
      statement: String.raw`A long pendulum swinging freely at latitude $\lambda$ does not keep its plane of swing fixed relative to the ground. The plane turns at the rate
$$\Omega_\perp = \Omega\sin\lambda$$
relative to the Earth, clockwise seen from above in the northern hemisphere and anticlockwise in the southern, where $\Omega$ is the Earth’s sidereal rotation rate. One full turn of the plane takes $T_{\rm sid}/\sin\lambda$ with $T_{\rm sid} = 23.93$ h: one sidereal day at a pole, about 31.8 h in Paris ($48.85°$ N, where the plane turns by $11.3°$ per hour), and forever at the equator. Foucault showed this in Paris in 1851, first at the Observatory and then in the Panthéon, with a 28 kg bob on a 67 m wire swinging every 16.4 s. It was the first laboratory demonstration of the Earth’s rotation.`,
      idea: String.raw`For small swings the pendulum (4.4) is a two-dimensional oscillator $\ddot{\mathbf x} = -\omega_0^2\mathbf x - 2\boldsymbol\Omega\times\dot{\mathbf x}$ in the horizontal plane, and only the vertical component $\Omega\sin\lambda$ of the rotation enters the horizontal Coriolis force (9.8). Writing the motion in a frame turning at $-\Omega\sin\lambda$ about the vertical removes the Coriolis term to first order, leaving a plain oscillator whose swing plane stays fixed. So in the Earth’s frame the plane turns at $-\Omega\sin\lambda$: at a pole the Earth simply turns under a fixed plane, while at the equator the vertical component is zero. The rotation rate is also the parallel transport of a vector around a circle of latitude, which links it to geometry.`,
      caption: String.raw`The bob’s path seen from above, with the Earth’s rotation sped up so that the turning shows within a few swings (the readout converts back to the real rate). Right: on the floor, where the swing plane turns and knocks over the ring of pins one by one, as in many museum pendulums. Left: in a frame that does not turn about the local vertical; here the swing stays in one plane and the floor, with its compass and pins, turns beneath it. Released from rest at the edge, the bob traces cusps; pushed from the centre, it traces petals. Bottom: the time for one full turn against latitude, with Paris marked.`,
      deps: ['mech-9.8', 'mech-4.4'],
      refs: ['Taylor §9.9', 'Arnold §27'],
      tags: ['Foucault pendulum', 'Earth’s rotation', 'Coriolis force'],
      credit: 'Foucault, 1851',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Foucault_pendulum' },
      viz(v) {
        const PL = { paris: ['Paris 1851', 48.846], pole: ['North Pole', 90], eq: ['equator', 0], syd: ['Sydney', -33.87] };
        let latS = null;
        const place = v.select('place', Object.entries(PL).map(([value, [label]]) => ({ value, label })), 'paris', { onChange: (k) => latS.set(PL[k][1]) });
        latS = v.slider('latitude $\\lambda$ (°)', -90, 90, 48.846, { step: 0.01 });
        const fS = v.slider('Earth spun faster by', 100, 3000, 700, { log: true });
        const rel = v.select('release', [{ value: 'rest', label: 'from rest at the edge' }, { value: 'push', label: 'pushed from the centre' }], 'rest');
        const sN = v.stage({ x: [-1.3, 1.3], y: [-1.3, 1.3], equal: true, axes: false, height: 300, title: 'frame not turning about the vertical' });
        const sE = v.stage({ x: [-1.3, 1.3], y: [-1.3, 1.3], equal: true, axes: false, height: 300, title: 'on the floor (Earth’s frame)' });
        const sP = v.stage({ x: [-90, 90], y: [12, 3000], ylog: true, axes: 'box', height: 180, full: true, xlabel: 'latitude (°)', title: 'time for the swing plane to turn once (hours)', xticks: [-90, -60, -30, 0, 30, 60, 90] });
        const T0 = TAU * Math.sqrt(67 / 9.81), NP = 40, PR = 0.97;
        const cache = memo();
        const run = () => cache([latS.value, fS.value, rel.value].join('|'), () => {
          const lat = latS.value * DEG, Wz = fS.value * OMEGA * (T0 / TAU) * Math.sin(lat); // in units of the pendulum’s ω0
          const Tp = Math.abs(Wz) > 1e-9 ? Math.min(TAU / Math.abs(Wz), 24 * TAU) : 24 * TAU;
          const f = (t, S) => [S[2], S[3], -S[0] + 2 * Wz * S[3], -S[1] - 2 * Wz * S[2]];
          const y0 = rel.value === 'rest' ? [1, 0, 0, 0] : [0, 0, 1, 0];
          const R = rk4rec(f, y0, Tp, Math.round(Tp / 0.01), 2);
          // turning points (local maxima of r) → angle of the swing plane, unwrapped modulo π
          const tp = [], ang = [];
          for (let i = 1; i < R.y.length - 1; i++) {
            const r = (k) => Math.hypot(R.y[k][0], R.y[k][1]);
            if (r(i) >= r(i - 1) && r(i) > r(i + 1)) {
              let a = Math.atan2(R.y[i][1], R.y[i][0]);
              if (ang.length) { const p = ang[ang.length - 1]; while (a - p > Math.PI / 2) a -= Math.PI; while (a - p < -Math.PI / 2) a += Math.PI; }
              tp.push(R.t[i]); ang.push(a);
            }
          }
          let rate = NaN;
          if (tp.length > 3) { const L = v.M.linreg(tp, ang); rate = L.slope; }
          // pins: first time the bob comes within reach
          const pins = Array.from({ length: NP }, (_, j) => { const a = (TAU * j) / NP, px = PR * Math.cos(a), py = PR * Math.sin(a); let hit = Infinity; for (let i = 0; i < R.y.length; i++) if (Math.hypot(R.y[i][0] - px, R.y[i][1] - py) < 0.05) { hit = R.t[i]; break; } return { a, hit }; });
          return { R, Wz, Tp, rate, pins, lat: latS.value };
        });
        let cur = null;
        v.animate((tA) => {
          const B = run(), R = B.R, t = Math.min(tA * (TAU / 1.7), B.Tp), i = idxAt(R, t), tt = R.t[i], floor = B.Wz * tt;
          for (const [s, phi] of [[sN, floor], [sE, 0]]) {
            s.circle(0, 0, 1.12, { fill: 'gold', fillAlpha: 0.06, color: 'faint', width: 1.2 });
            for (const [lab, a] of [['E', 0], ['N', Math.PI / 2], ['W', Math.PI], ['S', -Math.PI / 2]]) { const p = rot(1.2, 0, a + phi); s.text(lab, p[0], p[1], { color: 'muted', size: 12, align: 'center', weight: 600 }); }
            for (const pin of B.pins) {
              const p = rot(PR * Math.cos(pin.a), PR * Math.sin(pin.a), phi), down = pin.hit <= tt;
              if (down) { const q = rot(PR * 1.07 * Math.cos(pin.a + 0.05), PR * 1.07 * Math.sin(pin.a + 0.05), phi); s.line(p[0], p[1], q[0], q[1], { color: 'red', width: 2, alpha: 0.7 }); }
              else s.dot(p[0], p[1], { r: 3, color: 'ink', ring: false });
            }
            const pts = []; for (let k = Math.max(0, i - 900); k <= i; k++) pts.push(rot(R.y[k][0], R.y[k][1], s === sN ? B.Wz * R.t[k] : 0));
            s.path(pts, { color: 'accent', width: 1.1, alpha: 0.6 });
            const b = rot(R.y[i][0], R.y[i][1], phi);
            s.line(0, 0, b[0], b[1], { color: 'muted', width: 1, alpha: 0.6 });
            s.dot(0, 0, { r: 2.5, color: 'muted' });
            s.dot(b[0], b[1], { r: 7, color: 'gold' });
          }
          const down = B.pins.filter((p) => p.hit <= tt).length;
          sE.corner(`${down} of ${NP} pins down`, 'tl');
          sN.corner(`swing ${Math.floor(tt / TAU) + 1}`, 'tl');
          // precession period against latitude
          sP.fn((x) => (Math.abs(Math.sin(x * DEG)) > 1e-6 ? SIDEREAL_H / Math.abs(Math.sin(x * DEG)) : NaN), { color: 'accent', width: 2.2, n: 400 });
          sP.dot(48.846, SIDEREAL_H / Math.sin(48.846 * DEG), { r: 5, color: 'red' });
          sP.text('Paris: 31.8 h', 48.846, SIDEREAL_H / Math.sin(48.846 * DEG), { color: 'red', size: 11, dx: 8, dy: -10, align: 'left' });
          const lat = B.lat, ph = Math.abs(Math.sin(lat * DEG)) > 1e-6 ? SIDEREAL_H / Math.abs(Math.sin(lat * DEG)) : Infinity;
          if (isFinite(ph) && ph < 2000) sP.dot(lat, ph, { r: 5, color: 'gold' });
          cur = { B, tt };
        }, { period: 26, still: 14 });
        v.legend([['accent', 'path of the bob'], ['gold', 'bob', { dot: true }], ['red', 'pins knocked over / Paris', { dot: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const { B } = cur, lat = B.lat, s = Math.sin(lat * DEG), F = fS.value;
          const real = Math.abs(s) > 1e-6 ? SIDEREAL_H / Math.abs(s) : Infinity;
          const meas = isFinite(B.rate) ? (F * T0) / Math.abs(B.rate) / 3600 : NaN; // one turn of the plane, in real hours
          let out = String.raw`$\lambda = ${v.fix(lat, 2)}°$: predicted $T_{\rm sid}/|\sin\lambda| = ${isFinite(real) ? v.fix(real, 2) + '\\ \\text{h}' : '\\infty'}$ (${v.fix(15.041 * Math.abs(s), 2)}° per hour)`;
          if (isFinite(meas) && Math.abs(B.rate) > 1e-6) out += String.raw` · simulated: the plane turns ${B.rate < 0 ? 'clockwise' : 'anticlockwise'} at ${v.fix(Math.abs(B.rate), 5)} rad per $1/\omega_0$, which with the speed-up removed is one turn in ${v.fix(meas, 2)} h`;
          else out += ' · simulated: the plane does not turn';
          if (place.value === 'paris' && Math.abs(lat - 48.846) < 0.01) out += String.raw` · Panthéon 1851: 67 m wire, period $2\pi\sqrt{\ell/g} = ${v.fix(T0, 2)}$ s, so one turn of the plane takes about ${v.fmt((real * 3600) / T0, 3)} swings`;
          return out;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 9.11
    {
      num: '9.11',
      kind: 'Phenomenon',
      name: 'Inertial circles and geostrophic flow',
      statement: String.raw`On a rotating planet, a parcel of air or water moving horizontally with no force acting on it but the Coriolis force turns steadily: to the right in the northern hemisphere, to the left in the southern. It moves on an **inertial circle** of radius $U/|f|$ at constant speed $U$, completing it in
$$T_{\rm i} = \frac{2\pi}{|f|} = \frac{\pi}{\Omega|\sin\lambda|},\qquad f = 2\Omega\sin\lambda,$$
half a pendulum day: 16.9 h at $45°$ latitude. When a horizontal pressure gradient also acts, the velocity circles around the **geostrophic velocity** $\mathbf u_g = \frac{1}{\rho f}\hat{\mathbf z}\times\nabla p$, at which the Coriolis force balances the pressure force. That velocity runs along the isobars, with low pressure on the left in the northern hemisphere, so the flow goes anticlockwise around a low (a cyclone). Friction damps the inertial circling, and near the ground it turns the settled flow slightly across the isobars toward low pressure.`,
      idea: String.raw`With only the Coriolis force (9.8) the horizontal equations are $\dot u = fv$, $\dot v = -fu$, so the velocity vector rotates at the rate $f$ with constant length, and the path is a circle traversed in $2\pi/f$. A constant pressure-gradient force shifts the centre of that rotation from zero to $\mathbf u_g$, because subtracting $\mathbf u_g$ gives back the force-free equations. The parcel therefore drifts along the isobars while looping, and once friction has removed the loops it simply follows the isobars. Large-scale weather is close to this geostrophic balance, which is why winds blow around highs and lows rather than straight into them.`,
      caption: String.raw`Drag the parcel’s start (gold) and the tip of its initial velocity (blue). Left: the path on the map (in km), with isobars (hPa) and, at the parcel, the Coriolis force (purple), the pressure-gradient force (blue) and friction (red), per unit mass. Right: the velocity itself, plotted as a point in the plane of $(u, v)$ in m/s. With no pressure gradient it runs round a circle centred on zero; with a gradient the circle is centred on the geostrophic velocity (green), and friction spirals it in. Try the southern hemisphere, or latitudes near the equator, where $f \to 0$ and the circles grow without bound.`,
      deps: ['mech-9.8'],
      see: ['geo-2.2', 'geo-3.1', 'fluid-3.10'],
      refs: ['Taylor §9.7'],
      tags: ['Coriolis force', 'geostrophic balance', 'atmosphere'],
      scope: String.raw`Horizontal motion on an $f$-plane: a region small enough that $f$ is constant, with slow vertical motion. Near the equator, or for flows that change in less than an inertial period (small Rossby number fails), the balance does not hold.`,
      viz(v) {
        const mode = v.select('pressure', [{ value: 'none', label: 'none' }, { value: 'uni', label: 'uniform gradient' }, { value: 'low', label: 'a low' }], 'none');
        const fric = v.toggle('surface friction', false);
        const latS = v.slider('latitude (°)', -80, 80, 45, { step: 0.5 });
        const S = v.stage({ x: [-600, 600], y: [-600, 600], equal: true, axes: 'box', height: 340, weight: 1.25, title: 'map: km east and north' });
        const Hd = v.stage({ x: [-25, 25], y: [-25, 25], equal: true, axes: true, height: 340, title: 'velocity $(u, v)$ in m/s' });
        const P0 = S.handle(-180, -60, { color: 'gold' });
        const KV = 5; // km of arrow per km/h of speed (so 10 m/s ↔ 180 km)
        const V0 = S.handle(-180, -60 + KV * 36, { color: 'accent' });
        let last = [P0.x, P0.y];
        P0.onDrag = () => { V0.set(V0.x + P0.x - last[0], V0.y + P0.y - last[1]); last = [P0.x, P0.y]; };
        const KMH = 3.6, ACC = 12960; // km/h per m/s, km/h² per m/s²
        const RHO = 1.2, GU = 0.9, DP = 14, SIG = 260; // uniform gradient (hPa per 100 km), low depth (hPa) and width (km)
        // pressure (hPa) and its gradient (hPa/km)
        const press = (m, x, y) => m === 'uni' ? 1013 - (GU / 100) * x : m === 'low' ? 1013 - DP * Math.exp(-(x * x + y * y) / (2 * SIG * SIG)) : 1013;
        const gradP = (m, x, y) => { if (m === 'uni') return [-GU / 100, 0]; if (m === 'low') { const e = (DP * Math.exp(-(x * x + y * y) / (2 * SIG * SIG))) / (SIG * SIG); return [e * x, e * y]; } return [0, 0]; };
        // pressure-gradient acceleration in km/h²: −(1/ρ)∇p, with 1 hPa/km = 0.1 Pa/m
        const pga = (m, x, y) => { const g = gradP(m, x, y); return [(-0.1 * g[0] * ACC) / RHO, (-0.1 * g[1] * ACC) / RHO]; };
        const cache = memo();
        const run = () => cache([mode.value, fric.value, latS.value, P0.x, P0.y, V0.x, V0.y].join('|'), () => {
          last = [P0.x, P0.y];
          const m = mode.value, f = 2 * OMEGA * 3600 * Math.sin(latS.value * DEG), r = fric.value ? 0.12 : 0; // f in 1/h, friction 1/(8 h)
          const Ti = Math.abs(f) > 1e-6 ? TAU / Math.abs(f) : Infinity, T = Math.min(3 * Ti, 160);
          const F = (t, Y) => { const a = pga(m, Y[0], Y[1]); return [Y[2], Y[3], f * Y[3] + a[0] - r * Y[2], -f * Y[2] + a[1] - r * Y[3]]; };
          const y0 = [P0.x, P0.y, (V0.x - P0.x) / KV, (V0.y - P0.y) / KV];
          const R = rk4rec(F, y0, T, Math.round(T / 0.02), 5, (t, Y) => Math.abs(Y[0]) > 2500 || Math.abs(Y[1]) > 2500);
          // inertial period from the turning of u − u_g (uniform field) or u (no field)
          let turn = 0, tTurn = NaN;
          if (m !== 'low') {
            const ug = Math.abs(f) > 1e-9 ? [pga(m, 0, 0)[1] / f, -pga(m, 0, 0)[0] / f] : [0, 0];
            let prev = Math.atan2(R.y[0][3] - ug[1], R.y[0][2] - ug[0]);
            for (let i = 1; i < R.y.length; i++) {
              const a = Math.atan2(R.y[i][3] - ug[1], R.y[i][2] - ug[0]); let d = a - prev; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; prev = a;
              if (Math.abs(turn + d) >= TAU && isNaN(tTurn)) tTurn = R.t[i - 1] + (R.dt * (TAU - Math.abs(turn))) / Math.abs(d);
              turn += d;
            }
          }
          // mean velocity over the last inertial period (drift)
          let mean = null;
          if (isFinite(Ti) && R.t[R.t.length - 1] > Ti) { const i0 = idxAt(R, R.t[R.t.length - 1] - Ti); let su = 0, sv = 0, n = 0; for (let i = i0; i < R.y.length; i++) { su += R.y[i][2]; sv += R.y[i][3]; n++; } mean = [su / n, sv / n]; }
          return { m, f, r, Ti, T, R, tTurn, mean, U0: Math.hypot(y0[2], y0[3]) };
        });
        let cur = null;
        v.animate((tA) => {
          const B = run(), R = B.R, m = B.m, i = idxAt(R, Math.min((tA * B.T) / 12, R.t[R.t.length - 1])), Y = R.y[i];
          const W = m === 'none' ? 320 : 600; S.setView([-W, W], [-W, W]);
          if (m !== 'none') {
            const lv = []; for (let p = 990; p <= 1040; p += 2) lv.push(p);
            S.contour((x, y) => press(m, x, y), lv, { color: 'muted', width: 1, labels: true, fmt: (p) => String(p), res: 80 });
            if (m === 'low') S.text('L', 0, 0, { color: 'red', size: 20, weight: 700, align: 'center' });
            else { S.text('low', -560, 560, { color: 'red', size: 13, weight: 600 }); S.text('high', 560, 560, { color: 'blue', size: 13, weight: 600, align: 'right' }); }
          }
          S.path(R.y.map((q) => [q[0], q[1]]), { color: 'accent', width: 1, alpha: 0.3 });
          S.path(R.y.slice(0, i + 1).map((q) => [q[0], q[1]]), { color: 'accent', width: 2.2 });
          S.arrow(P0.x, P0.y, V0.x, V0.y, { color: 'accent', width: 1.4, head: 7, alpha: 0.7 });
          const pg = pga(m, Y[0], Y[1]), co = [B.f * Y[3], -B.f * Y[2]], fr = [-B.r * Y[2], -B.r * Y[3]], KA = 7;
          farrow(S, Y[0], Y[1], co[0], co[1], KA, 'purple', null, { width: 2.4 });
          farrow(S, Y[0], Y[1], pg[0], pg[1], KA, 'blue', null, { width: 2.4 });
          farrow(S, Y[0], Y[1], fr[0], fr[1], KA, 'red', null, { width: 2.4 });
          S.dot(Y[0], Y[1], { r: 6, color: 'gold' });
          S.corner(`t = ${v.fix(R.t[i], 1)} h`, 'tr');
          // hodograph in m/s
          const U = R.y.map((q) => [q[2] / KMH, q[3] / KMH]);
          let big = 12; for (const q of U) big = Math.max(big, Math.abs(q[0]) * 1.15, Math.abs(q[1]) * 1.15);
          const ug = Math.abs(B.f) > 1e-9 ? [pg[1] / B.f / KMH, -pg[0] / B.f / KMH] : [NaN, NaN];
          if (isFinite(ug[0])) big = Math.max(big, Math.abs(ug[0]) * 1.2, Math.abs(ug[1]) * 1.2);
          big = Math.min(big, 80);
          Hd.setView([-big, big], [-big, big]);
          Hd.path(U, { color: 'accent', width: 1, alpha: 0.3 });
          Hd.path(U.slice(0, i + 1), { color: 'accent', width: 2 });
          Hd.arrow(0, 0, U[i][0], U[i][1], { color: 'accent', width: 2.4 });
          if (m !== 'none' && isFinite(ug[0])) { Hd.dot(ug[0], ug[1], { r: 6, color: 'green' }); Hd.text('geostrophic', ug[0], ug[1], { color: 'green', size: 11, dy: -14, align: 'center' }); }
          Hd.dot(U[i][0], U[i][1], { r: 5, color: 'gold' });
          cur = { B, i, ug };
        }, { period: 13, still: 5.2 });
        v.legend([['accent', 'path / velocity'], ['purple', 'Coriolis'], ['blue', 'pressure gradient'], ['red', 'friction'], ['green', 'geostrophic velocity', { dot: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const { B, ug } = cur, f = B.f, lat = latS.value;
          if (Math.abs(f) < 1e-6) return 'at the equator $f = 0$: no Coriolis turning, the parcel goes straight (or accelerates straight down the pressure gradient)';
          let out = String.raw`$f = 2\Omega\sin\lambda = ${sci(v, f / 3600, 3)}$ s⁻¹, so $T_{\rm i} = 2\pi/|f| = ${v.fix(B.Ti, 2)}$ h at ${v.fix(lat, 1)}° (half a pendulum day); turning ${f > 0 ? 'clockwise' : 'anticlockwise'}`;
          if (B.m !== 'low' && isFinite(B.tTurn) && !B.r) out += String.raw` · measured: the velocity turns once in ${v.fix(B.tTurn, 2)} h`;
          if (B.m === 'none' && !B.r) out += String.raw` · circle radius $U/|f| = ${v.fix(B.U0 / Math.abs(f), 1)}$ km at $U = ${v.fix(B.U0 / 3.6, 2)}$ m/s`;
          if (B.m === 'uni' && B.mean) out += String.raw` · mean velocity over the last inertial period (${v.fix(B.mean[0] / 3.6, 2)}, ${v.fix(B.mean[1] / 3.6, 2)}) m/s vs geostrophic (${v.fix(ug[0], 2)}, ${v.fix(ug[1], 2)}) m/s: along the isobars`;
          if (B.m === 'low') out += f > 0 ? ' · the parcel ends up circling the low anticlockwise: a cyclone' : ' · southern hemisphere: the low is circled clockwise';
          if (B.r && B.m !== 'none') out += ' · with friction the loops die out and the flow crosses the isobars slightly toward low pressure';
          return out;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 9.12
    {
      num: '9.12',
      kind: 'Model',
      name: 'Restricted three-body problem: Lagrange points',
      statement: String.raw`Two masses $m_1 > m_2$ move on circular orbits about their centre of mass, and a third body of negligible mass moves in their plane. In units where the separation, $G(m_1+m_2)$ and the orbital angular velocity are $1$, and with $\mu = m_2/(m_1+m_2)$, the primaries sit at rest at $(-\mu, 0)$ and $(1-\mu, 0)$ in the co-rotating frame. There the test body obeys
$$\ddot{\mathbf r} = -\nabla U - 2\hat{\mathbf z}\times\dot{\mathbf r},\qquad U = -\tfrac12(x^2+y^2) - \frac{1-\mu}{r_1} - \frac{\mu}{r_2},$$
which conserves the **Jacobi constant** $C = -2U - |\dot{\mathbf r}|^2$. The equilibria are the five **Lagrange points**: three collinear ones $L_1, L_2, L_3$, which are saddles of $U$ and always unstable, and two at the vertices of equilateral triangles on the primaries, $L_4$ and $L_5$. $L_4$ and $L_5$ are maxima of $U$, yet the Coriolis force makes them linearly stable when
$$27\mu(1-\mu) < 1\iff \mu < \mu_{\rm R} = \tfrac12\bigl(1 - \sqrt{23/27}\bigr) \approx 0.0385 .$$
This is Routh’s criterion (Gascheau 1843, Routh 1875). Sun–Jupiter ($\mu \approx 0.00095$) satisfies it, and its Trojan asteroids librate around $L_4$ and $L_5$ on tadpole orbits.`,
      idea: String.raw`In the rotating frame (9.6) the primaries are fixed, the centrifugal force joins gravity in the effective potential $U$, and the Coriolis force does no work; this is why $C$ is conserved, and the curves $-2U = C$ bound where a body of given $C$ can go. Equilibria are critical points of $U$ (3.12). For two-body circular motion (8.2) the triangle points satisfy this exactly: each lies at unit distance from both primaries. Linearizing at $L_4$ gives $\lambda^4 + \lambda^2 + \tfrac{27}{4}\mu(1-\mu) = 0$, whose roots are purely imaginary only when $27\mu(1-\mu) < 1$. A particle that slides off the potential hill is turned back by the Coriolis force, so it circles the summit instead of rolling down.`,
      caption: String.raw`Left: the co-rotating frame, with the effective potential shaded and its contours through $L_1$, $L_2$ and $L_3$ (the zero-velocity curves at those energies). By default it is unrolled along the orbit, with the angle from $m_2$ across and the distance from the centre of mass minus 1 up, which magnifies the thin band where Trojans live; switch to the whole frame to see all five points at once. Drag the gold test particle to choose where it starts at rest, or use the buttons to start near $L_4$ (a tadpole orbit) or near $L_3$ (a horseshoe orbit). Right: the same motion seen from an inertial frame, with the primaries orbiting. Bottom: the growth rate of small perturbations around $L_4$ against the mass ratio, computed from the eigenvalues of the linearized motion. It is zero up to Routh’s value, and above it the particle near $L_4$ drifts away. Raise $\mu$ past $0.0385$ to watch that happen.`,
      deps: ['mech-9.6', 'mech-8.2', 'mech-3.12', 'mech-8.20'],
      see: ['astro-2.1', 'astro-2.2', 'astro-2.4', 'astro-2.5'],
      refs: ['Tong §2.5', 'Goldstein §3.12'],
      tags: ['three-body problem', 'Lagrange points', 'stability'],
      credit: 'Euler, 1767 (collinear); Lagrange, 1772 (triangular); Routh, 1875 (stability)',
      viz(v) {
        let muS = null;
        const SYS = { sj: ['Sun–Jupiter', 9.537e-4], em: ['Earth–Moon', 0.01215], over: ['μ = 0.045 (past Routh)', 0.045] };
        const sys = v.select('system', Object.entries(SYS).map(([value, [label]]) => ({ value, label })), 'sj', { onChange: (k) => muS.set(SYS[k][1]) });
        muS = v.slider('mass ratio $\\mu$', 1e-4, 0.5, 9.537e-4, { log: true, sig: 4 });
        const view = v.select('left panel', [{ value: 'zoom', label: 'unrolled along the orbit' }, { value: 'whole', label: 'whole frame' }], 'zoom');
        const Sz = v.stage({ x: [-180, 180], y: [-0.08, 0.08], axes: 'box', height: 340, weight: 1.25, xticks: [-180, -120, -60, 0, 60, 120, 180], title: 'co-rotating frame, unrolled: angle from $m_2$ (°) against $r - 1$' });
        const Sw = v.stage({ x: [-1.6, 1.6], y: [-1.45, 1.45], equal: true, axes: false, height: 340, weight: 1.25, title: 'co-rotating frame' });
        const I = v.stage({ x: [-1.6, 1.6], y: [-1.6, 1.6], equal: true, axes: false, height: 340, title: 'inertial frame' });
        const Gs = v.stage({ x: [1e-4, 0.5], y: [-0.08, 0.45], xlog: true, axes: 'box', height: 170, full: true, xlabel: 'μ', title: 'growth rate of perturbations at $L_4$: largest $\\mathrm{Re}\\,\\lambda$' });
        // the start point (at rest in the rotating frame) has a handle in both views of the rotating frame
        const toZ = (x, y) => [Math.atan2(y, x) / DEG, Math.hypot(x, y) - 1], fromZ = (a, d) => [(1 + d) * Math.cos(a * DEG), (1 + d) * Math.sin(a * DEG)];
        let start = [Math.cos(85 * DEG) - 9.537e-4, Math.sin(85 * DEG)];
        const Pw = Sw.handle(start[0], start[1], { color: 'gold' }), z0 = toZ(start[0], start[1]), Pz = Sz.handle(z0[0], z0[1], { color: 'gold' });
        const setStart = (x, y) => { start = [x, y]; Pw.set(x, y); const z = toZ(x, y); Pz.set(z[0], z[1]); };
        Pw.onDrag = () => { start = [Pw.x, Pw.y]; const z = toZ(Pw.x, Pw.y); Pz.set(z[0], z[1]); };
        Pz.onDrag = () => { start = fromZ(Pz.x, Pz.y); Pw.set(start[0], start[1]); };
        v.button('start near L4 (tadpole)', () => setStart(Math.cos(85 * DEG) - muS.value, Math.sin(85 * DEG)));
        v.button('start near L3 (horseshoe)', () => setStart(-1.002 - muS.value, 0));
        const MU_R = 0.5 * (1 - Math.sqrt(23 / 27));
        const Ux = (mu, x) => { const a = x + mu, b = x - 1 + mu; return x - ((1 - mu) * a) / Math.abs(a) ** 3 - (mu * b) / Math.abs(b) ** 3; }; // −∂U/∂x on y = 0
        const bis = (f, a, b) => { let fa = f(a); for (let k = 0; k < 100; k++) { const m = (a + b) / 2, fm = f(m); if (fm * fa <= 0) b = m; else { a = m; fa = fm; } } return (a + b) / 2; };
        const lmemo = memo();
        const lpoints = (mu) => lmemo(mu, () => { const e = 1e-9, f = (x) => Ux(mu, x); return [[bis(f, -mu + e, 1 - mu - e), 0], [bis(f, 1 - mu + e, 2.5), 0], [bis(f, -2.5, -mu - e), 0], [0.5 - mu, Math.sqrt(3) / 2], [0.5 - mu, -Math.sqrt(3) / 2]]; });
        const Ueff = (mu, x, y) => -0.5 * (x * x + y * y) - (1 - mu) / Math.hypot(x + mu, y) - mu / Math.hypot(x - 1 + mu, y);
        const growth = (mu) => {
          const s3 = Math.sqrt(3), A = [[0, 0, 1, 0], [0, 0, 0, 1], [0.75, ((3 * s3) / 4) * (1 - 2 * mu), 0, 2], [((3 * s3) / 4) * (1 - 2 * mu), 2.25, -2, 0]];
          const ev = v.M.eig(A).values; let g = -Infinity; for (const z of ev) g = Math.max(g, z.re); return { g, ev };
        };
        const gmemo = memo();
        const gcurve = () => gmemo(1, () => { const out = []; for (let j = 0; j <= 160; j++) { const mu = 10 ** (-4 + (Math.log10(0.5) + 4) * (j / 160)); out.push([mu, Math.max(0, growth(mu).g)]); } return out; });
        const cache = memo();
        const run = () => cache([muS.value, start[0], start[1]].join('|'), () => {
          const mu = muS.value, T = 300;
          const F = (t, Y) => {
            const x = Y[0], y = Y[1], a = x + mu, b = x - 1 + mu, r1 = Math.hypot(a, y), r2 = Math.hypot(b, y), k1 = (1 - mu) / r1 ** 3, k2 = mu / r2 ** 3;
            return [Y[2], Y[3], x - k1 * a - k2 * b + 2 * Y[3], y - k1 * y - k2 * y - 2 * Y[2]];
          };
          let Y = [start[0], start[1], 0, 0], t = 0; const rec = { t: [0], y: [Y] }; let next = 0.05, steps = 0, stop = '';
          const C = (Y) => -2 * Ueff(mu, Y[0], Y[1]) - Y[2] * Y[2] - Y[3] * Y[3], C0 = C(Y); let dC = 0;
          while (t < T && steps < 400000) {
            const r1 = Math.hypot(Y[0] + mu, Y[1]), r2 = Math.hypot(Y[0] - 1 + mu, Y[1]);
            const h = Math.min(0.01, 0.02 * Math.min(r1, r2) ** 1.5, T - t);
            Y = rk4(F, t, Y, h); t += h; steps++;
            if (t >= next) { rec.t.push(t); rec.y.push(Y); next += 0.05; dC = Math.max(dC, Math.abs(C(Y) - C0)); }
            if (Math.min(r1, r2) < 1e-3) { stop = 'collision'; break; }
            if (Math.hypot(Y[0], Y[1]) > 4) { stop = 'escape'; break; }
          }
          const L = lpoints(mu);
          // classify by the angle from m₂ seen from the barycentre
          let amin = 180, amax = -180, past0 = false, past180 = false, prev = Math.atan2(rec.y[0][1], rec.y[0][0]) / DEG;
          for (const q of rec.y) { const a = Math.atan2(q[1], q[0]) / DEG; amin = Math.min(amin, a); amax = Math.max(amax, a); if (Math.sign(a) !== Math.sign(prev)) { if (Math.abs(a) < 90) past0 = true; else past180 = true; } prev = a; }
          const kind = stop ? stop : past0 ? 'passes $m_2$' : past180 ? 'horseshoe' : 'tadpole';
          return { mu, rec, dC, C0, stop, steps, L, amin, amax, kind, T: rec.t[rec.t.length - 1] };
        });
        let cur = null;
        v.animate((tA) => {
          const B = run(), mu = B.mu, L = B.L, n = B.rec.t.length - 1, tt = Math.min((tA / 24) * 300, B.T), zoom = view.value === 'zoom';
          const k = Math.min(n, Math.round(tt / 0.05)), q = B.rec.y[k];
          const UL = L.map(([x, y]) => Ueff(mu, x, y)), LAB = ['L₁', 'L₂', 'L₃', 'L₄', 'L₅'];
          Sz.el.hidden = !zoom; Sw.el.hidden = zoom;
          if (zoom) {
            const yr = Math.min(0.6, Math.max(0.06, 1.6 * Math.cbrt(mu / 3))), Uz = (a, d) => { const p = fromZ(a, d); return Ueff(mu, p[0], p[1]); };
            Sz.setView([-180, 180], [-yr, yr]);
            const lo = 2 * UL[0] - UL[3];
            Sz.heat((a, d) => Math.max(Uz(a, d), lo), { range: [lo, UL[3]], cmap: 'viridis', key: 'z' + mu + '|' + yr, alpha: 0.3, res: 3 });
            for (const f of [0.3, 0.65]) Sz.contour(Uz, [UL[3] - f * (UL[3] - UL[2])], { color: 'muted', width: 1, dash: [4, 4], res: 160 });
            Sz.contour(Uz, [UL[0]], { color: 'red', width: 1.4, res: 160 });
            Sz.contour(Uz, [UL[1]], { color: 'orange', width: 1.4, res: 160 });
            Sz.contour(Uz, [UL[2]], { color: 'purple', width: 1.4, res: 160 });
            Sz.hline(0, { color: 'faint', width: 1, dash: [3, 5] });
            const pts = []; let pa = null;
            for (let j = 0; j <= k; j++) { const z = toZ(B.rec.y[j][0], B.rec.y[j][1]); if (pa !== null && Math.abs(z[0] - pa) > 180) pts.push(null); pts.push(z); pa = z[0]; }
            Sz.path(pts, { color: 'ink', width: 1.4, alpha: 0.85 });
            Sz.dot(0, -mu, { r: 4 + 5 * Math.cbrt(mu / 0.05), color: 'blue' });
            L.forEach((p, j) => { const z = toZ(p[0], p[1]); Sz.dot(z[0], z[1], { r: 3.5, color: 'red' }); Sz.text(LAB[j], Math.min(176, z[0]), z[1], { color: 'red', size: 12, weight: 600, dx: j === 2 ? -6 : 6, dy: j === 0 ? 13 : -11, align: j === 2 ? 'right' : 'left' }); });
            const zq = toZ(q[0], q[1]); Sz.dot(zq[0], zq[1], { r: 5, color: 'gold' });
            Sz.corner(`t = ${v.fix(B.rec.t[k] / TAU, 1)} orbits`, 'tr');
          } else {
            Sw.heat((x, y) => Math.max(Ueff(mu, x, y), UL[0] - 0.6), { range: [UL[0] - 0.6, UL[3] + 0.005], cmap: 'viridis', key: 'U' + mu, alpha: 0.3, res: 3 });
            Sw.contour((x, y) => Ueff(mu, x, y), [UL[0]], { color: 'red', width: 1.4, res: 140 });
            Sw.contour((x, y) => Ueff(mu, x, y), [UL[1]], { color: 'orange', width: 1.4, res: 140 });
            Sw.contour((x, y) => Ueff(mu, x, y), [UL[2]], { color: 'purple', width: 1.4, res: 140 });
            Sw.circle(0, 0, 1, { color: 'faint', width: 1, dash: [3, 5] });
            Sw.path(B.rec.y.slice(0, k + 1).map((p) => [p[0], p[1]]), { color: 'ink', width: 1.4, alpha: 0.85 });
            Sw.dot(-mu, 0, { r: 9, color: 'gold' }); Sw.dot(1 - mu, 0, { r: 4 + 5 * Math.cbrt(mu / 0.05), color: 'blue' });
            LAB.forEach((lab, j) => { Sw.dot(L[j][0], L[j][1], { r: 3.5, color: 'red' }); Sw.text(lab, L[j][0], L[j][1], { color: 'red', size: 12, weight: 600, dx: j === 2 ? -6 : 6, dy: j < 3 ? 13 : j === 3 ? -11 : 11, align: j === 2 ? 'right' : 'left' }); });
            Sw.dot(q[0], q[1], { r: 5, color: 'gold' });
            Sw.corner(`t = ${v.fix(B.rec.t[k] / TAU, 1)} orbits`, 'tl');
          }
          // inertial view
          const th = B.rec.t[k];
          I.circle(0, 0, mu, { color: 'gold', width: 1, dash: [3, 4], alpha: 0.6 }); I.circle(0, 0, 1 - mu, { color: 'blue', width: 1, dash: [3, 4], alpha: 0.6 });
          const tail = []; for (let j = Math.max(0, k - 200); j <= k; j++) { const p = B.rec.y[j]; tail.push(rot(p[0], p[1], B.rec.t[j])); }
          I.path(tail, { color: 'ink', width: 1.4, alpha: 0.85 });
          const m1 = rot(-mu, 0, th), m2 = rot(1 - mu, 0, th), pp = rot(q[0], q[1], th), l4 = rot(L[3][0], L[3][1], th);
          I.line(m1[0], m1[1], l4[0], l4[1], { color: 'red', width: 1, alpha: 0.5, dash: [3, 3] }); I.line(m2[0], m2[1], l4[0], l4[1], { color: 'red', width: 1, alpha: 0.5, dash: [3, 3] });
          I.dot(l4[0], l4[1], { r: 3.5, color: 'red' }); I.text('L₄', l4[0], l4[1], { color: 'red', size: 11, weight: 600, dx: 7, dy: -9, align: 'left' });
          I.dot(m1[0], m1[1], { r: 9, color: 'gold' }); I.dot(m2[0], m2[1], { r: 4 + 5 * Math.cbrt(mu / 0.05), color: 'blue' }); I.dot(pp[0], pp[1], { r: 5, color: 'gold' });
          I.corner('trail: the last 1.6 orbits', 'tl', { size: 11 });
          // growth rate against μ
          Gs.vband(MU_R, 0.5, { color: 'red', alpha: 0.08 });
          Gs.vline(MU_R, { color: 'red', width: 1.2, dash: [5, 4] });
          Gs.text('Routh: μ = 0.0385', MU_R, 0.4, { color: 'red', size: 11, dx: 6, align: 'left' });
          for (const [lab, m] of [['Sun–Jupiter', 9.537e-4], ['Earth–Moon', 0.01215]]) { Gs.vline(m, { color: 'faint', width: 1, dash: [2, 4] }); Gs.text(lab, m, 0.12, { color: 'muted', size: 10.5, align: 'center' }); }
          Gs.path(gcurve(), { color: 'accent', width: 2.4 });
          const gr = growth(mu);
          Gs.dot(mu, Math.max(0, gr.g), { r: 5, color: 'gold' });
          cur = { B, gr };
        }, { period: 26, still: 22 });
        v.legend([['red', 'zero-velocity curve through $L_1$'], ['orange', 'through $L_2$'], ['purple', 'through $L_3$'], ['muted', 'lower levels round $L_4$, $L_5$', { dash: true }], ['ink', 'test particle'], ['accent', 'growth rate at $L_4$']]);
        v.readout(() => {
          if (!cur) return '';
          const { B, gr } = cur, mu = B.mu, L = B.L, hill = Math.cbrt(mu / 3);
          const om = gr.ev.filter((z) => z.im > 1e-9).map((z) => z.im).sort((a, b) => a - b);
          let out = String.raw`$\mu = ${num(v, mu, 5)}$ · $L_1$ and $L_2$ lie ${v.fix(1 - mu - L[0][0], 4)} and ${v.fix(L[1][0] - 1 + mu, 4)} from $m_2$ (Hill radius $(\mu/3)^{1/3} = ${v.fix(hill, 4)}$)`;
          out += gr.g < 1e-7
            ? String.raw` · $L_4$ is stable: eigenvalues $\pm${v.fix(om[0] ?? 0, 4)}i$ and $\pm${v.fix(om[om.length - 1] ?? 0, 4)}i$ (libration period ${v.fix(1 / (om[0] || 1), 1)} orbits), since $27\mu(1-\mu) = ${v.fix(27 * mu * (1 - mu), 4)} < 1$`
            : String.raw` · $L_4$ is unstable: $\mathrm{Re}\,\lambda = ${v.fix(gr.g, 4)}$, since $27\mu(1-\mu) = ${v.fix(27 * mu * (1 - mu), 3)} > 1$`;
          out += String.raw` · this orbit: ${B.kind}` + (B.kind === 'tadpole' ? String.raw`, between ${v.fix(B.amin, 0)}° and ${v.fix(B.amax, 0)}° from $m_2$` : '');
          out += String.raw` · Jacobi constant $C = ${v.fix(B.C0, 5)}$, drift $${sci(v, B.dC)}$ over ${v.fix(B.T / TAU, 1)} orbits`;
          return out;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 9.13
    {
      num: '9.13',
      kind: 'Theorem',
      name: 'Larmor’s theorem',
      statement: String.raw`Let charged particles with the same charge-to-mass ratio $q/m$ move under central forces about a fixed centre, and add a uniform magnetic field $\mathbf B$. To first order in $B$, their motion is the same as the motion without the field, seen from a frame rotating about the centre with the **Larmor angular velocity**
$$\boldsymbol\omega_{\rm L} = -\frac{q\mathbf B}{2m},$$
half the cyclotron frequency. The neglected term is the centrifugal force $m\omega_{\rm L}^2\rho$. Relative to the central force it is of order $(\omega_{\rm L}/\omega_0)^2$, where $\omega_0$ is the orbital frequency, so the theorem holds when the field is weak in this sense. In particular a bound orbit precesses as a whole at $\omega_{\rm L}$. For an electron bound harmonically, the circular motions in the plane perpendicular to $\mathbf B$ have their frequency shifted from $\omega_0$ to $\omega_0 \pm \omega_{\rm L}$, which is the classical explanation of the normal Zeeman triplet.`,
      idea: String.raw`In a frame rotating at $\boldsymbol\omega$, Newton’s law acquires $-2m\boldsymbol\omega\times\dot{\mathbf r}$ and $-m\boldsymbol\omega\times(\boldsymbol\omega\times\mathbf r)$ (9.6), while the Lorentz force $q\mathbf v\times\mathbf B$ becomes $q\dot{\mathbf r}\times\mathbf B + q(\boldsymbol\omega\times\mathbf r)\times\mathbf B$. Choosing $\boldsymbol\omega = -q\mathbf B/2m$ makes the velocity-dependent terms cancel exactly, because both are linear in the velocity, with the same structure as the motion in a uniform field (1.18). What remains are terms quadratic in $B$, which are small for a weak field. A central force is unchanged by the rotation, so it does not spoil the cancellation. Larmor (1897) used this to explain Zeeman’s splitting of spectral lines.`,
      caption: String.raw`A charge in a central field with a magnetic field perpendicular to the page. Left: the orbit with the field (blue) is a rosette, and the dots are the field-free orbit carried round at $\omega_{\rm L} = -qB/2m$; they agree. Right: the same orbit viewed from the Larmor frame, where it nearly closes on the field-free ellipse (dashed green). Bottom: the largest gap between the two over four orbits against the field strength. It grows like $B^2$ (slope 2), so Larmor’s rotation is exact to first order and fails only when $B$ is strong. Switch to a harmonic force to see the Zeeman shift of the two circular modes.`,
      deps: ['mech-9.6', 'mech-1.18'],
      see: ['em-7.20', 'em-7.2'],
      refs: ['Goldstein §5.9'],
      tags: ['Larmor', 'magnetic field', 'rotating frame'],
      credit: 'Larmor, 1897',
      viz(v) {
        const force = v.select('central force', [{ value: 'coul', label: 'Coulomb $1/r^2$' }, { value: 'harm', label: 'harmonic (bound electron)' }], 'coul');
        const bS = v.slider('field $\\omega_c = qB/m$', 0.005, 1.5, 0.08, { log: true });
        const sL = v.stage({ x: [-1.7, 1.7], y: [-1.5, 1.5], equal: true, axes: false, height: 300, title: 'lab frame, field on' });
        const sR = v.stage({ x: [-1.7, 1.7], y: [-1.5, 1.5], equal: true, axes: false, height: 300, title: 'frame rotating at $\\omega_{\\rm L} = -qB/2m$' });
        const sG = v.stage({ x: [0.005, 1.5], y: [1e-6, 3], xlog: true, ylog: true, axes: 'box', height: 190, full: true, xlabel: 'ω_c = qB/m', title: 'largest gap between the orbit and the rotated field-free orbit, over four orbits' });
        const SET = {
          coul: { acc: (x, y) => { const r = Math.hypot(x, y); return [-x / r ** 3, -y / r ** 3]; }, r0: [1, 0], v0: [0, 0.8] },
          harm: { acc: (x, y) => [-x, -y], r0: [1, 0], v0: [0, 0.45] },
        };
        const period = (k) => { if (k === 'harm') return TAU; const r0 = SET.coul.r0, v0 = SET.coul.v0, E = 0.5 * (v0[0] ** 2 + v0[1] ** 2) - 1 / Math.hypot(...r0), a = -1 / (2 * E); return TAU * a ** 1.5; };
        /** Lab orbit with the field and the field-free orbit started with the Larmor-frame velocity; gap = max |r_lab − R(ω_L t) r_free|. */
        const pair = (k, wc, keep = true) => {
          const o = SET[k], wL = -wc / 2, T = 4 * period(k), n = Math.round(T / (keep ? 0.002 : 0.004)), h = T / n;
          const fB = (t, S) => { const a = o.acc(S[0], S[1]); return [S[2], S[3], a[0] + wc * S[3], a[1] - wc * S[2]]; };
          const f0 = (t, S) => { const a = o.acc(S[0], S[1]); return [S[2], S[3], a[0], a[1]]; };
          let A = [...o.r0, ...o.v0], Z = [o.r0[0], o.r0[1], o.v0[0] + wL * o.r0[1], o.v0[1] - wL * o.r0[0]];
          const out = { t: [0], lab: [[A[0], A[1]]], free: [[Z[0], Z[1]]], T, wL }; let gap = 0;
          for (let i = 1; i <= n; i++) {
            A = rk4(fB, 0, A, h); Z = rk4(f0, 0, Z, h);
            const zr = rot(Z[0], Z[1], wL * i * h); gap = Math.max(gap, Math.hypot(A[0] - zr[0], A[1] - zr[1]));
            if (keep && i % 5 === 0) { out.t.push(i * h); out.lab.push([A[0], A[1]]); out.free.push([Z[0], Z[1]]); }
          }
          out.gap = gap; return out;
        };
        const cache = memo(), gcache = memo();
        const run = () => cache(force.value + '|' + bS.value, () => pair(force.value, bS.value));
        const gaps = () => gcache(force.value, () => { const out = []; for (let j = 0; j <= 18; j++) { const wc = 0.005 * 300 ** (j / 18); out.push([wc, pair(force.value, wc, false).gap]); } return out; });
        let cur = null;
        v.animate((tA) => {
          const B = run(), n = B.t.length - 1, k = Math.min(n, Math.round((tA / 14) * n)), wL = B.wL;
          // lab
          sL.path(B.lab.slice(0, k + 1), { color: 'accent', width: 1.8 });
          const dots = []; for (let j = 0; j <= k; j += 12) dots.push(rot(B.free[j][0], B.free[j][1], wL * B.t[j]));
          sL.dots(dots, { r: 2.3, color: 'green' });
          sL.dot(0, 0, { r: 5, color: 'red' });
          sL.dot(B.lab[k][0], B.lab[k][1], { r: 6, color: 'gold' });
          sL.text('⊙ B', 1.5, 1.32, { color: 'muted', size: 13, align: 'right' });
          // Larmor frame
          const ang = wL * B.t[k];
          sR.path(B.free, { color: 'green', width: 1.6, dash: [6, 4] });
          const inR = B.lab.slice(0, k + 1).map((p, j) => rot(p[0], p[1], -wL * B.t[j]));
          sR.path(inR, { color: 'accent', width: 1.8 });
          sR.dot(0, 0, { r: 5, color: 'red' });
          sR.dot(inR[k][0], inR[k][1], { r: 6, color: 'gold' });
          for (const a of [0, Math.PI / 2]) { const e = rot(1.45, 0, a - ang); sR.line(0, 0, e[0] * 0.25, e[1] * 0.25, { color: 'faint', width: 1 }); }
          sR.corner(`frame turned ${v.fix(ang / DEG, 0)}°`, 'tl');
          // gap against field
          const G = gaps();
          const g0 = G[0][1] / G[0][0] ** 2;
          sG.path(G.map(([w]) => [w, g0 * w * w]), { color: 'ink', width: 1.2, dash: [6, 4] });
          sG.path(G, { color: 'accent', width: 2.4 });
          sG.dots(G, { r: 3, color: 'accent' });
          sG.dot(bS.value, B.gap, { r: 5.5, color: 'gold' });
          cur = { B };
        }, { period: 15, still: 13.5 });
        v.legend([['accent', 'orbit with the field'], ['green', 'field-free orbit (rotated at $\\omega_{\\rm L}$ on the left)'], ['ink', 'slope 2: gap $\\propto B^2$', { dash: true }]]);
        v.readout(() => {
          if (!cur) return '';
          const { B } = cur, wc = bS.value, w0 = TAU / period(force.value), wL = wc / 2;
          let out = String.raw`$\omega_{\rm L} = ${num(v, wL, 4)}$, orbital frequency $\omega_0 = ${v.fix(w0, 4)}$: $(\omega_{\rm L}/\omega_0)^2 = ${sci(v, (wL / w0) ** 2, 2)}$ · largest gap over four orbits ${num(v, B.gap, 5)} (orbit size about 1), gap$/(\omega_{\rm L}/\omega_0)^2 = ${v.fix(B.gap / (wL / w0) ** 2, 1)}$, nearly the same for every weak field: the error is second order`;
          if (force.value === 'harm') {
            const ex = [Math.sqrt(1 + wL * wL) - wL, Math.sqrt(1 + wL * wL) + wL];
            out += String.raw` · circular modes: exact $\sqrt{\omega_0^2+\omega_{\rm L}^2} \mp \omega_{\rm L} = ${v.fix(ex[0], 5)}, ${v.fix(ex[1], 5)}$; Larmor $\omega_0 \mp \omega_{\rm L} = ${v.fix(1 - wL, 5)}, ${v.fix(1 + wL, 5)}$ (the normal Zeeman shift)`;
          } else out += String.raw` · the orbit precesses by $\omega_{\rm L}T = ${v.fix((wL * TAU) / w0 / DEG, 2)}°$ per revolution`;
          return out;
        });
      },
    },
  ],
};
