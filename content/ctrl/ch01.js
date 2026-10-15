// Control Theory — Chapter 1: Feedback principles (part a: 1.1–1.7)
import {
  cadd, cdiv, cabs, carg, cmul, pmul, ptex, tf, tfmul, tfFeedback, tfAt, tfTeX, logspace, realize, stepExact, simLoop, fitSine,
  bdBlock, bdSum, bdWire, flowDots, GOV, govValve, govStep, govEquilibrium, govCubic, cubicRoots, clocked, trace,
  CAR, carAccel, carTrim, drawCar,
} from './ch01.shared.js';

// ---------- helpers for this file ----------
const TAU = 2 * Math.PI;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const deg = (r) => (r * 180) / Math.PI;
/** Root mean square of the entries of ys whose time ts[i] ≥ t0. */
function rmsSince(ts, ys, t0) { let s = 0, n = 0; for (let i = 0; i < ts.length; i++) if (ts[i] >= t0) { s += ys[i] * ys[i]; n++; } return n ? Math.sqrt(s / n) : 0; }
/** Format a complex number [re, im] as TeX. */
const cxTeX = (v, z, d = 3) => `${v.fix(z[0], d)} ${z[1] < 0 ? '-' : '+'} ${v.fix(Math.abs(z[1]), d)}i`;

/** The centrifugal governor driving a throttle valve, with flywheel engine and steam pipe (for 1.2). */
function drawGovernor(s, { phi, psi, u, flow, load, K, on }) {
  const top = 4.1, La = 1.55, Lk = 1.25, rb = 0.25, pipeY = 0.3, fx = -2.4, fy = 1.0, R = 0.92;
  // steam pipe from the boiler (right) through the valve to the cylinder (left)
  s.rect(-0.75, pipeY - 0.17, 4.2, pipeY + 0.17, { fill: 'muted', fillAlpha: 0.14, color: 'muted', width: 1.2 });
  const vx = 2.6, gap = 0.3;
  const dots = [];
  for (let k = 0; k < 18; k++) {
    const xx = 4.15 - ((((flow * 1.6 + k * gap) % (18 * gap)) + 18 * gap) % (18 * gap));
    if (xx > -0.7) dots.push([xx, pipeY + ((k % 2) - 0.5) * 0.12]);
  }
  s.dots(dots, { r: 2.2, color: 'orange', alpha: 0.35 + 0.65 * u });
  // butterfly valve
  const th = (1 - u) * (Math.PI / 2) * 0.92;
  s.circle(vx, pipeY, 0.22, { color: 'orange', width: 1.2, alpha: 0.6 });
  s.line(vx - 0.17 * Math.cos(th), pipeY - 0.17 * Math.sin(th), vx + 0.17 * Math.cos(th), pipeY + 0.17 * Math.sin(th), { color: 'orange', width: 4 });
  const crank = [vx + 0.42 * Math.cos(th + Math.PI / 2), pipeY + 0.42 * Math.sin(th + Math.PI / 2)];
  s.line(vx, pipeY, crank[0], crank[1], { color: 'ink', width: 2 });
  // cylinder and flywheel
  s.rect(-1.45, -0.05, -0.75, 0.75, { fill: 'muted', fillAlpha: 0.2, color: 'ink', width: 1.5 });
  const pin = [fx + 0.5 * Math.cos(psi), fy + 0.5 * Math.sin(psi)];
  const px = -1.45 + 0.22 + 0.18 * (1 + Math.cos(psi));
  s.line(px, 0.35, pin[0], pin[1], { color: 'ink', width: 2.2 });
  s.rect(px - 0.06, 0.05, px + 0.06, 0.65, { fill: 'ink', fillAlpha: 0.7, stroke: false });
  s.circle(fx, fy, R, { color: 'ink', width: 4 });
  for (let k = 0; k < 6; k++) { const a = psi + (k * Math.PI) / 3; s.line(fx, fy, fx + (R - 0.05) * Math.cos(a), fy + (R - 0.05) * Math.sin(a), { color: 'ink', width: 1.6 }); }
  s.circle(fx, fy, 0.14, { fill: 'ink', fillAlpha: 1, stroke: false });
  s.dot(pin[0], pin[1], { r: 3.5, color: 'ink' });
  // load: a torque arrow opposing the rotation, thicker for more load
  const lw = 1 + 4 * clamp(load, 0, 2);
  s.curve((t) => [fx + 1.18 * Math.cos(t), fy + 1.18 * Math.sin(t)], 2.0, 3.6, { color: 'purple', width: lw, n: 40 });
  const a1 = 2.0; s.arrow(fx + 1.18 * Math.cos(a1 + 0.12), fy + 1.18 * Math.sin(a1 + 0.12), fx + 1.18 * Math.cos(a1), fy + 1.18 * Math.sin(a1), { color: 'purple', width: lw, head: 7 + lw });
  s.text('load', fx - 0.75, fy + 1.3, { color: 'purple', size: 11.5, align: 'right', weight: 600 });
  // drive shaft and bevel gear to the spindle
  s.line(fx, fy, -0.2, fy, { color: 'muted', width: 3 });
  s.poly([[-0.24, fy - 0.2], [-0.12, fy - 0.12], [-0.12, fy + 0.12], [-0.24, fy + 0.2]], { fill: 'muted', fillAlpha: 0.6, color: 'ink', width: 1 });
  s.poly([[-0.2, fy + 0.04], [0.2, fy + 0.04], [0.12, fy + 0.18], [-0.12, fy + 0.18]], { fill: 'muted', fillAlpha: 0.6, color: 'ink', width: 1 });
  // spindle and sleeve
  s.line(0, fy + 0.18, 0, top + 0.28, { color: 'ink', width: 3.5 });
  const ys = top - 2 * Lk * Math.cos(phi);
  s.rect(-0.2, ys - 0.13, 0.2, ys + 0.13, { fill: 'muted', fillAlpha: 0.55, color: 'ink', width: 1.5 });
  // arms, links and balls, back to front
  const balls = [psi, psi + Math.PI].map((a) => ({ c: Math.cos(a), z: Math.sin(a) })).sort((p, q) => p.z - q.z);
  for (const b of balls) {
    const bx = La * Math.sin(phi) * b.c, by = top - La * Math.cos(phi), kx = Lk * Math.sin(phi) * b.c, ky = top - Lk * Math.cos(phi);
    const al = 0.5 + 0.5 * ((b.z + 1) / 2);
    s.line(0, top, bx, by, { color: 'ink', width: 2.4, alpha: al });
    s.line(kx, ky, 0.2 * b.c, ys, { color: 'ink', width: 1.7, alpha: al });
    s.circle(bx, by, rb * (1 + 0.12 * b.z), { fill: 'gold', fillAlpha: 0.35 + 0.65 * al, color: 'ink', width: 1.3, alpha: al });
  }
  s.circle(0, top, 0.08, { fill: 'ink', fillAlpha: 1, stroke: false });
  // the lever: collar end at the sleeve, fulcrum placed so that (valve arm)/(collar arm) = K
  const Lt = 2.3, a = Lt / (1 + Math.max(K, 0.05)), Fx = 0.24 + a, Fy = 2.3;
  const C0 = [0.24, ys], dir = [Fx - C0[0], Fy - C0[1]], dl = Math.hypot(dir[0], dir[1]);
  const E = [Fx + (dir[0] / dl) * (Lt - a), Fy + (dir[1] / dl) * (Lt - a)];
  s.line(Fx, Fy, Fx, Fy - 0.55, { color: 'muted', width: 2 });
  s.poly([[Fx, Fy], [Fx - 0.12, Fy - 0.2], [Fx + 0.12, Fy - 0.2]], { fill: 'muted', fillAlpha: 0.8, stroke: false });
  if (on) {
    s.line(C0[0], C0[1], E[0], E[1], { color: 'ink', width: 3 });
    s.line(E[0], E[1], crank[0], crank[1], { color: 'ink', width: 1.8 });
  } else {
    s.line(C0[0], C0[1], Fx + 0.3, Fy, { color: 'ink', width: 3, alpha: 0.35 });
    s.line(crank[0], crank[1], crank[0], crank[1] + 0.9, { color: 'red', width: 1.8, dash: [4, 3] });
    s.text('disconnected', crank[0] + 0.05, crank[1] + 1.05, { color: 'red', size: 11, align: 'center', weight: 600 });
  }
  s.dot(Fx, Fy, { r: 3.5, color: 'ink' });
  // labels
  s.text('flyballs', -1.2, top + 0.3, { size: 11, color: 'muted', align: 'center' });
  s.text('sleeve', -0.27, ys - 0.3, { size: 11, color: 'muted', align: 'right' });
  s.text('lever', E[0] + 0.12, E[1] + 0.12, { size: 11, color: 'muted', align: 'left' });
  s.text('throttle valve', vx, pipeY - 0.42, { size: 11, color: 'orange', align: 'center' });
  s.text('steam from boiler →', 3.95, pipeY + 0.4, { size: 10.5, color: 'muted', align: 'right' });
  s.text('flywheel', fx, fy - R - 0.3, { size: 11, color: 'muted', align: 'center' });
}

export default {
  collection: 'ctrl',
  chapter: 1,
  title: 'Feedback principles',
  summary: String.raw`Feedback means measuring what a system actually does and correcting it by the difference from what we want. That one loop makes behaviour insensitive to the details of the plant and rejects disturbances nobody predicted, but it can also turn a perfectly stable machine into an oscillating one, as the engineers of Watt's governors learned and Maxwell explained. The chapter sets up the loop and its block diagram, solves it for the closed-loop transfer function $PC/(1+PC)$, and introduces the loop transfer function and the sensitivity functions $S$ and $T$ (with $S+T=1$) that measure both the benefits and the risks. It ends with feedforward, the first-order cruise-control loop, positive feedback and memory, Mason's formula for tangled diagrams, and Maxwell's 1868 paper that started the mathematical theory.`,
  items: [
    // ------------------------------------------------------------------ 1.1
    {
      num: '1.1',
      kind: 'Concept',
      name: 'Open-loop versus closed-loop control',
      statement: String.raw`A controller chooses the input $u$ of a system (the **plant**) so that its output $y$ follows a **reference** $r$ in spite of **disturbances** $d$.

- In **open-loop** (feedforward) control the input is computed from the reference and a model of the plant alone, $u=F(r)$, without looking at $y$. It is only as good as the model, and it compensates only the disturbances that were foreseen.
- In **closed-loop** (feedback) control a sensor measures $y$ and the controller acts on the **error** $e=r-y$, for example $u=C(e)$. Whatever makes $y$ drift (an unmodelled hill, a gust, an extra passenger) shows up in $e$ and is corrected, whether or not anyone predicted it.

The price of feedback is a sensor, action that starts only after an error has appeared, sensor noise fed into the plant, and the possibility of instability (1.9).`,
      idea: String.raw`A fixed throttle schedule passes every change in the road straight through to the speed, smoothed only by the car's own drag. A controller that sees the speed error pushes back in proportion to it, and integral action keeps pushing until the error is zero. In a loop the remaining error is just what is needed to produce the corrective force, roughly the open-loop deviation divided by $1+$(loop gain) (1.8). Open loop still has its uses. It is immediate and cannot go unstable, and when a disturbance can be measured it can cancel it before any error appears. That is why practical systems combine the two (1.10).`,
      caption: String.raw`Two identical cars drive the same hilly road, both aiming at 25 m/s. The **red** car's throttle is fixed at the value that holds 25 m/s on a flat road with no load. The **green** car has a speedometer feeding a PI controller. The dashed flag moves at exactly 25 m/s. On every climb the red car falls behind, on every descent it runs ahead, and the green car stays with the flag. Press *Headwind gust*, add payload (the fixed schedule knows nothing about it) or make the hills steeper. Turning the feedback gain down makes the green car drift too.`,
      deps: [],
      see: ['ctrl-1.10'],
      refs: ['Åström–Murray §1.1', 'Franklin–Powell §1.1'],
      tags: ['feedback', 'feedforward'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Open-loop_controller' },
      viz(v) {
        const SP = 4, DT = 0.05, WIN = 90; // simulated seconds per real second, step, chart window
        const hillS = v.slider('hills: steepest grade', 0, 8, 5, { step: 0.5, fmt: (x) => `${v.fix(x, 1)} %` });
        const loadS = v.slider('payload', 0, 600, 250, { step: 10, fmt: (x) => `${Math.round(x)} kg` });
        const kpS = v.slider('feedback gain $k_p$', 0.01, 1, 0.3, { log: true, fmt: (x) => v.fix(x, 3) });
        let gustReq = 0;
        v.button('Headwind gust', () => { gustReq++; });
        const road = v.stage({ x: [-28, 28], y: [-6, 9], equal: true, axes: false, height: 215, full: true });
        const sp = v.stage({ x: [0, WIN], y: [18.5, 31.5], height: 220, axes: 'box', xlabel: 't (s)', ylabel: 'speed (m/s)', weight: 1.45, yticks: [20, 22.5, 25, 27.5, 30] });
        const th = v.stage({ x: [0, WIN], y: [-0.55, 1.08], height: 220, axes: 'box', xlabel: 't (s)', ylabel: 'throttle u', weight: 1, yticks: [-0.5, 0, 0.5, 1] });
        const G = () => hillS.value / 100;
        const grade = (x) => G() * (0.62 * Math.sin((TAU * x) / 640) + 0.38 * Math.sin((TAU * x) / 270 + 1.1));
        const elev = (x) => G() * (-0.62 * (640 / TAU) * Math.cos((TAU * x) / 640) - 0.38 * (270 / TAU) * Math.cos((TAU * x) / 270 + 1.1));
        const u0 = carTrim();
        const wind = (st, t) => { let w = 0; for (const g0 of st.gusts) { const a = t - g0; if (a > 0 && a < 14) w += 12 * Math.sin((Math.PI * a) / 14) ** 2; } return w; };
        const sim = clocked(DT, () => ({ ol: { x: 0, v: CAR.vr, u: u0 }, cl: { x: 0, v: CAR.vr, u: u0, I: 0 }, gusts: [], seen: gustReq, h: { t: [], vo: [], vc: [], uo: [], uc: [], w: [] }, k: 0 }), (st, t, dt) => {
          while (st.seen < gustReq) { st.gusts.push(t); st.seen++; }
          const m = CAR.m0 + loadS.value, w = wind(st, t), kp = kpS.value, ki = kp / 6;
          // open loop: fixed throttle; closed loop: PI on the speed error with anti-windup
          const stepCar = (c, uFn) => {
            const u = uFn(c), a1 = carAccel(c.v, u, grade(c.x), m, w), vm = c.v + a1 * dt;
            const a2 = carAccel(vm, u, grade(c.x + c.v * dt), m, w);
            c.x += dt * (c.v + vm) / 2; c.v += (dt * (a1 + a2)) / 2; c.u = u;
          };
          stepCar(st.ol, () => u0);
          stepCar(st.cl, (c) => {
            const e = CAR.vr - c.v, raw = u0 + kp * e + ki * c.I, u = clamp(raw, -1, 1);
            if (raw === u || Math.sign(e) !== Math.sign(raw - u)) c.I += e * dt;
            return u;
          });
          if (st.k++ % 5 === 0) {
            const H = st.h; H.t.push(t + dt); H.vo.push(st.ol.v); H.vc.push(st.cl.v); H.uo.push(st.ol.u); H.uc.push(st.cl.u); H.w.push(w);
            if (H.t.length > 520) for (const key in H) H[key].shift();
          }
        });
        v.animate((t) => {
          const st = sim.to(t * SP), T = sim.t, H = st.h, xr = CAR.vr * T;
          // ---- road, in a window that moves with the 25 m/s pace flag
          const hc = elev(xr);
          road.setView([xr - 28, xr + 28], [hc - 4.5, hc + 7.5]);
          const xs = []; for (let x = xr - 40; x <= xr + 40; x += 0.5) xs.push([x, elev(x)]);
          road.poly([...xs, [xr + 40, hc - 30], [xr - 40, hc - 30]], { fill: 'green', fillAlpha: 0.1, stroke: false });
          road.path(xs.map(([x, y]) => [x, y + 1.15]), { color: 'faint', width: 1.4 });
          road.path(xs.map(([x, y]) => [x, y + 0.58]), { color: 'faint', width: 1, dash: [6, 6] });
          road.path(xs, { color: 'ink', width: 2.4 });
          for (let x = Math.ceil((xr - 40) / 20) * 20; x < xr + 40; x += 20) {
            road.line(x, elev(x), x, elev(x) - 0.9, { color: 'muted', width: 1.2 });
            road.text(`${x} m`, x, elev(x) - 1.6, { size: 10, color: 'muted', align: 'center' });
          }
          road.line(xr, hc, xr, hc + 6.6, { color: 'ink', width: 1.3, dash: [4, 3] });
          road.poly([[xr, hc + 6.6], [xr + 2.2, hc + 6.1], [xr, hc + 5.6]], { fill: 'ink', fillAlpha: 0.6, stroke: false });
          road.text('pace 25 m/s', xr + 2.6, hc + 6.1, { size: 11, color: 'ink', align: 'left' });
          const w = H.w.length ? H.w[H.w.length - 1] : 0;
          if (w > 0.6) {
            for (let k = 0; k < 3; k++) road.arrow(xr + 25 - k * 4.5, hc + 7.6, xr + 22 - k * 4.5, hc + 7.6, { color: 'teal', width: 2 });
            road.text(`headwind ${v.fix(w, 0)} m/s`, xr + 12, hc + 7.6, { size: 11, color: 'teal', align: 'right' });
          }
          const close = Math.abs(st.ol.x - st.cl.x) < 9;
          const car = (c, lane, col, lift) => {
            const y = elev(c.x) + lane, ang = Math.atan(grade(c.x));
            drawCar(road, c.x, y, ang, { color: col, scale: lane ? 0.9 : 1, alpha: lane ? 0.85 : 1 });
            road.text(`${v.fix(c.v, 1)} m/s`, c.x, y + 2.3 + lift, { size: 11.5, color: col, align: 'center', weight: 600 });
          };
          const off = st.ol.x - xr;
          if (Math.abs(off) < 25.5) car(st.ol, 0.7, 'red', close ? 1.25 : 0);
          else {
            const ex = off > 0 ? xr + 26 : xr - 26, yy = elev(ex) + 3.2;
            road.arrow(off > 0 ? ex - 4 : ex + 4, yy, ex, yy, { color: 'red', width: 2.2 });
            road.text(`open-loop car ${v.fix(Math.abs(off), 0)} m ${off > 0 ? 'ahead' : 'behind'}`, off > 0 ? ex - 4.5 : ex + 4.5, yy, { size: 11.5, color: 'red', align: off > 0 ? 'right' : 'left', weight: 600 });
          }
          car(st.cl, 0, 'green', 0);
          // ---- speed and throttle charts
          const T0 = Math.max(0, T - WIN);
          sp.setView([T0, T0 + WIN], null); th.setView([T0, T0 + WIN], null);
          sp.hband(CAR.vr - 0.5, CAR.vr + 0.5, { color: 'green', alpha: 0.1 });
          sp.hline(CAR.vr, { color: 'ink', dash: [5, 4], width: 1.2 });
          trace(sp, H.t, H.vo, { color: 'red', width: 2 });
          trace(sp, H.t, H.vc, { color: 'green', width: 2.2 });
          th.hline(0, { color: 'faint' });
          trace(th, H.t, H.uo, { color: 'red', width: 2 });
          trace(th, H.t, H.uc, { color: 'green', width: 2.2 });
        }, { still: 16 });
        v.legend([['red', 'open loop: fixed throttle schedule'], ['green', 'closed loop: speedometer + PI controller'], ['ink', 'target 25 m/s', { dash: true }]]);
        v.readout(() => {
          const st = sim.state; if (!st) return '';
          const H = st.h, T = sim.t, t0 = T - 60;
          const ro = rmsSince(H.t, H.vo.map((x) => x - CAR.vr), t0), rc = rmsSince(H.t, H.vc.map((x) => x - CAR.vr), t0);
          return `**open loop**: speed ${v.fix(st.ol.v, 2)} m/s, RMS error over the last minute ${v.fix(ro, 2)} m/s · **closed loop**: ${v.fix(st.cl.v, 2)} m/s, RMS error ${v.fix(rc, 2)} m/s` +
            (ro > 0.02 ? ` · feedback cuts the RMS speed error by a factor of **${v.fix(ro / Math.max(rc, 1e-3), 1)}**` : '');
        });
      },
    },
    // ------------------------------------------------------------------ 1.2
    {
      num: '1.2',
      kind: 'Invention',
      name: 'Watt’s centrifugal governor',
      statement: String.raw`The **centrifugal governor** holds the speed of a steam engine nearly constant under changing load. Two heavy balls on hinged arms are spun by the engine about a vertical spindle. The faster they turn, the further centrifugal force swings them outward and upward, and the arms lift a sleeve that, through a lever, closes the throttle valve admitting steam. If the load increases, the engine slows, the balls drop, the valve opens and more steam restores most of the lost speed; if the load falls, the reverse happens.

It is a **proportional** controller. The valve opening is tied to the ball height, and so to the speed, so a heavier load settles at a slightly lower speed (*droop*). Too much linkage gain, or too little friction in the mechanism, makes the engine **hunt**, oscillating about its set speed with growing amplitude until the valve slams between fully open and shut.`,
      idea: String.raw`At a steady speed $\omega$ the arms hang at the angle where gravity balances centrifugal force, $\cos\varphi=g/(l\omega^2)$. So the sleeve height measures speed, and the lever turns that measurement into valve opening: a closed loop (1.1) built entirely from mechanism. Linearising the engine and the governor about steady running gives a third-order system. Larger linkage gain shrinks the droop, but it also pushes two roots of the characteristic cubic toward the right half-plane, and governor friction pulls them back. Maxwell's 1868 analysis of exactly this trade-off (1.14) began the theory of feedback stability. Watt adapted the device, already used on windmills and millstones, to his rotative steam engines in 1788.`,
      caption: String.raw`The engine (flywheel and cylinder, left) drives the spindle; the flyballs, sleeve and lever set the butterfly valve in the steam pipe. Each run starts from steady running at the design load. From $t=0$ the engine carries the load set by the slider. Drag it, or use the buttons, and watch the balls drop, the valve open and the speed recover to a slightly lower level, the **droop** (green dashed line, predicted from the steady-state balance). Raise the linkage gain (the fulcrum slides toward the sleeve): the droop shrinks, then the engine starts to hunt. Disconnect the governor to see what the engine does on its own.`,
      deps: ['ctrl-1.1'],
      see: ['ctrl-1.14'],
      refs: ['Åström–Murray ch. 1', 'Franklin–Powell §1.4'],
      tags: ['governor', 'history of control'],
      credit: 'James Watt, 1788 (after windmill governors)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Centrifugal_governor' },
      viz(v) {
        const SP = 5, DT = 0.01, WIN = 80;
        const loadS = v.slider('load (% of design)', 60, 140, 115, { step: 1, fmt: (x) => `${Math.round(x)} %` });
        const kS = v.slider('linkage gain $K$', 0.2, 6, 1.4, { log: true, fmt: (x) => v.fix(x, 2) });
        const onT = v.toggle('governor connected', true);
        v.button('Add load +15 %', () => loadS.set(clamp(loadS.value + 15, 60, 140)));
        v.button('Shed load −15 %', () => loadS.set(clamp(loadS.value - 15, 60, 140)));
        const mech = v.stage({ x: [-3.85, 4.2], y: [-0.5, 4.6], equal: true, axes: false, height: 370, weight: 1, minWidth: 330 });
        const sp = v.stage({ x: [0, WIN], y: [70, 135], height: 370, axes: 'box', xlabel: 't', ylabel: 'engine speed (% of design)', weight: 1.15, yticks: [80, 90, 100, 110, 120, 130] });
        const va = v.stage({ x: [0, WIN], y: [-6, 150], height: 160, axes: 'box', xlabel: 't', ylabel: 'valve opening, load (%)', full: true, yticks: [0, 50, 100, 150] });
        const par = () => ({ K: onT.value ? kS.value : 0, beta: 0.8 });
        const TL = () => (GOV.TL0 * loadS.value) / 100;
        const sim = clocked(DT, () => {
          const eq = govEquilibrium({ K: 1, beta: 0.8 }, GOV.TL0);
          return { x: [eq.w, eq.phi, 0], psi: 0, flow: 0, k: 0, h: { t: [], w: [], u: [], L: [] } };
        }, (st, t, dt) => {
          const p = par(), u = govValve(p, st.x[1]);
          govStep(p, st.x, dt, TL());
          st.psi += st.x[0] * dt * 1.15; st.flow += u * dt * 2.2;
          if (st.k++ % 10 === 0) {
            const H = st.h; H.t.push(t + dt); H.w.push((100 * st.x[0]) / GOV.w0); H.u.push(100 * u); H.L.push(loadS.value);
            if (H.t.length > 900) for (const key in H) H[key].shift();
          }
        });
        v.animate((t) => {
          const st = sim.to(t * SP), T = sim.t, H = st.h, p = par();
          drawGovernor(mech, { phi: st.x[1], psi: st.psi, u: govValve(p, st.x[1]), flow: st.flow, load: loadS.value / 100, K: kS.value, on: onT.value });
          const T0 = Math.max(0, T - WIN);
          sp.setView([T0, T0 + WIN], null); va.setView([T0, T0 + WIN], null);
          sp.hline(100, { color: 'ink', dash: [5, 4], width: 1.1 });
          const eq = govEquilibrium(p, TL());
          if (onT.value && !eq.stop) sp.hline((100 * eq.w) / GOV.w0, { color: 'green', dash: [7, 4], width: 1.6 });
          sp.clip(() => trace(sp, H.t, H.w, { color: 'accent', width: 2.3 }));
          va.clip(() => { trace(va, H.t, H.u, { color: 'orange', width: 2 }); trace(va, H.t, H.L, { color: 'purple', width: 1.6, dash: [5, 3] }); });
        }, { still: 9 });
        v.legend([['accent', 'engine speed'], ['ink', 'design speed', { dash: true }], ['green', 'predicted steady speed (droop)', { dash: true }], ['orange', 'valve opening'], ['purple', 'load', { dash: true }]]);
        v.readout(() => {
          const st = sim.state; if (!st) return '';
          const p = par(), eq = govEquilibrium(p, TL()), cub = govCubic(p, TL()), rts = cubicRoots(cub.coef);
          const mr = Math.max(...rts.map((r) => r[0])), w = (100 * st.x[0]) / GOV.w0;
          const head = `speed **${v.fix(w, 1)} %** of design, valve ${v.fix(100 * govValve(p, st.x[1]), 0)} % open, arms at ${v.fix(deg(st.x[1]), 1)}°`;
          if (!onT.value) return `${head} · governor disconnected: the valve stays at 50 %, so any load other than the design load makes the speed run away or collapse`;
          const pair = rts.find((r) => r[1] > 1e-9);
          const lin = pair ? `linearised loop: roots ${v.fix(rts.find((r) => Math.abs(r[1]) < 1e-9)?.[0] ?? rts[0][0], 3)} and $${v.fix(pair[0], 3)}\\pm ${v.fix(pair[1], 3)}i$` : `linearised loop: real roots ${rts.map((r) => v.fix(r[0], 3)).join(', ')}`;
          return `${head} · predicted steady speed ${eq.stop ? '(valve on its stop)' : `${v.fix((100 * eq.w) / GOV.w0, 1)} %, droop ${v.fix(100 - (100 * eq.w) / GOV.w0, 1)} %`} · ${lin}: ${mr < 0 ? '**stable**, oscillations die out' : '**unstable**: the governor hunts'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.3
    {
      num: '1.3',
      kind: 'Concept',
      name: 'Block diagrams of a feedback loop',
      statement: String.raw`A **block diagram** draws a system as boxes connected by arrows. Each box is a subsystem, defined only by how it turns its input signal into its output signal (for a linear time-invariant block, by its transfer function); each arrow carries a signal; a **summing junction** adds its incoming signals with the signs written beside them; a **take-off point** copies a signal to several places.

The canonical feedback loop has five parts: the **reference** $r$; the **comparator** forming the error $e=r-y_m$; the **controller** $C$ turning $e$ into the control signal $u$; the **plant** $P$, whose input $v=u+d$ includes a load **disturbance** $d$ and whose output $y$ is the variable we care about; and the **sensor** $H$, whose reading $y_m=Hy+n$ includes measurement **noise** $n$. Every signal in the loop depends on every external input $r$, $d$ and $n$.`,
      idea: String.raw`A block hides its internals and keeps only its cause-and-effect map, so the diagram makes the flow of signals and the loop explicit. Because linear blocks combine by the rules for series, parallel and feedback connections (sig-2.7), the diagram can be reduced algebraically to one transfer function per input–output pair, which is the subject of 1.4. The loop also explains why feedback is subtle: the controller never sees the disturbance itself, only its effect on $y$ coming back through the sensor, together with the sensor's noise.`,
      caption: String.raw`The loop runs a step of the reference at $t=1$ s and, optionally, a load disturbance at $t=7$ s and sensor noise. Gold dots stream along each wire, sized by the signal it carries at the current instant. Click a block or a junction (or use the selector) to plot its input and output signals below; the cursor marks the current time. Notice that the controller's input $e$ reacts to the disturbance only after it has moved $y$, and that noise enters the loop through the sensor.`,
      deps: ['sig-2.7'],
      refs: ['Åström–Murray §2.2'],
      tags: ['block diagram', 'feedback'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Block_diagram' },
      viz(v) {
        const TEND = 14;
        const C = tf([2, 2], [0, 1]), P = tf([1], [1, 1.5, 0.5]), H = tf([1], [1, 0.1]);
        const sel = v.select('show', [{ value: 'C', label: 'controller' }, { value: 'P', label: 'plant' }, { value: 'H', label: 'sensor' }, { value: 'cmp', label: 'comparator' }, { value: 'sd', label: '$d$ junction' }, { value: 'sn', label: '$n$ junction' }], 'C');
        const dT = v.toggle('load disturbance at $t=7$ s', true);
        const nT = v.toggle('sensor noise', true);
        const dg = v.stage({ x: [0, 20], y: [0.2, 7.2], equal: true, axes: false, height: 245, full: true });
        const sc = v.stage({ x: [0, TEND], y: [-0.6, 2.6], height: 215, axes: 'box', xlabel: 't (s)', full: true });
        const rng = v.rng(7), NZ = Array.from({ length: Math.ceil(TEND / 0.08) + 2 }, () => rng.normal() * 0.03);
        const noise = (t) => { const u = t / 0.08, i = Math.floor(u), f = u - i; return NZ[i] * (1 - f) + NZ[i + 1] * f; };
        let run = null, key = '';
        const getRun = () => {
          const k = `${dT.value}|${nT.value}`;
          if (k !== key) {
            key = k;
            run = simLoop({ C, P, H }, { T: TEND, dt: 0.005, r: (t) => (t >= 1 ? 1 : 0), d: (t) => (dT.value && t >= 7 ? -0.6 : 0), n: (t) => (nT.value ? noise(t) : 0) });
            run.hy = run.ym.map((x, i) => x - run.n[i]);
            run.max = {}; for (const s of ['r', 'e', 'u', 'd', 'v', 'y', 'ym', 'n', 'hy']) run.max[s] = Math.max(0.05, ...run[s].map(Math.abs));
          }
          return run;
        };
        // geometry
        const Y1 = 5.2, Y2 = 2.0;
        const B = { C: [6.3, Y1, 2.3, 1.35], P: [12.6, Y1, 2.3, 1.35], H: [11.2, Y2, 2.3, 1.3] }, S = { cmp: [3.2, Y1], sd: [9.4, Y1], sn: [7.2, Y2] }, R = 0.36;
        const wires = [
          { s: 'r', pts: [[0.6, Y1], [S.cmp[0] - R, Y1]], lab: ['r', 1.4, Y1 + 0.45] },
          { s: 'e', pts: [[S.cmp[0] + R, Y1], [B.C[0] - 1.15, Y1]], lab: ['e', 4.3, Y1 + 0.45] },
          { s: 'u', pts: [[B.C[0] + 1.15, Y1], [S.sd[0] - R, Y1]], lab: ['u', 8.2, Y1 + 0.45] },
          { s: 'd', pts: [[S.sd[0], Y1 + 1.75], [S.sd[0], Y1 + R]], lab: ['d', 9.85, Y1 + 1.5] },
          { s: 'v', pts: [[S.sd[0] + R, Y1], [B.P[0] - 1.15, Y1]], lab: ['v', 10.5, Y1 + 0.45] },
          { s: 'y', pts: [[B.P[0] + 1.15, Y1], [19.4, Y1]], lab: ['y', 18.9, Y1 + 0.45] },
          { s: 'y', pts: [[16, Y1], [16, Y2], [B.H[0] + 1.15, Y2]], lab: ['y', 16.4, 3.6] },
          { s: 'hy', pts: [[B.H[0] - 1.15, Y2], [S.sn[0] + R, Y2]], lab: ['Hy', 8.9, Y2 + 0.45] },
          { s: 'n', pts: [[S.sn[0], 0.45], [S.sn[0], Y2 - R]], lab: ['n', 7.65, 0.75] },
          { s: 'ym', pts: [[S.sn[0] - R, Y2], [S.cmp[0], Y2], [S.cmp[0], Y1 - R]], lab: ['y_m', 4.6, Y2 + 0.45] },
        ];
        const INFO = {
          C: { name: 'controller $C(s)=2+2/s$ (PI)', ins: [['e', 'orange', 'e']], out: ['u', 'accent', 'u'] },
          P: { name: 'plant $P(s)=1/((s+1)(0.5s+1))$', ins: [['v', 'orange', 'v=u+d']], out: ['y', 'accent', 'y'] },
          H: { name: 'sensor $H(s)=1/(0.1s+1)$', ins: [['y', 'orange', 'y']], out: ['hy', 'accent', 'Hy'] },
          cmp: { name: 'comparator $e=r-y_m$', ins: [['r', 'orange', 'r'], ['ym', 'purple', 'y_m']], out: ['e', 'accent', 'e'] },
          sd: { name: 'load junction $v=u+d$', ins: [['u', 'orange', 'u'], ['d', 'purple', 'd']], out: ['v', 'accent', 'v'] },
          sn: { name: 'noise junction $y_m=Hy+n$', ins: [['hy', 'orange', 'Hy'], ['n', 'purple', 'n']], out: ['ym', 'accent', 'y_m'] },
        };
        let legendFor = '';
        dg.onClick((x, y) => {
          for (const [k, [bx, by, w, h]] of Object.entries(B)) if (Math.abs(x - bx) < w / 2 + 0.2 && Math.abs(y - by) < h / 2 + 0.2) { sel.set(k); return; }
          for (const [k, [sx, sy]] of Object.entries(S)) if (Math.hypot(x - sx, y - sy) < 0.8) { sel.set(k); return; }
        });
        const at = (arr, t) => arr[clamp(Math.round(t / 0.005), 0, arr.length - 1)];
        v.animate((t) => {
          const rr = getRun(), tc = t % TEND, cur = sel.value;
          // ---- diagram
          for (const w of wires) {
            const on = INFO[cur].out[0] === w.s || INFO[cur].ins.some((q) => q[0] === w.s);
            const off = (w.s === 'd' && !dT.value) || (w.s === 'n' && !nT.value);
            bdWire(dg, w.pts, { color: on ? 'ink' : 'muted', width: on ? 2.2 : 1.6, alpha: off ? 0.35 : 1 });
            const val = Math.abs(at(rr[w.s], tc)) / rr.max[w.s];
            if (!off) flowDots(dg, w.pts, t * 1.6, 0.55, { r: 1.2 + 3 * Math.min(1, val), color: 'gold' });
            dg.tex(w.lab[0], w.lab[1], w.lab[2], { size: 15, color: off ? 'faint' : 'ink' });
          }
          dg.dot(16, Y1, { r: 3.5, color: 'ink' });
          const blk = { C: ['C(s)', 'controller'], P: ['P(s)', 'plant'], H: ['H(s)', 'sensor'] };
          for (const [k, [bx, by, w, h]] of Object.entries(B)) bdBlock(dg, bx, by, w, h, blk[k][0], { color: cur === k ? 'accent' : 'ink', active: cur === k, sub: blk[k][1] });
          bdSum(dg, ...S.cmp, R, { w: '+', s: '−' }, { color: cur === 'cmp' ? 'accent' : 'ink', active: cur === 'cmp' });
          bdSum(dg, ...S.sd, R, { w: '+', n: '+' }, { color: cur === 'sd' ? 'accent' : 'ink', active: cur === 'sd' });
          bdSum(dg, ...S.sn, R, { e: '+', s: '+' }, { color: cur === 'sn' ? 'accent' : 'ink', active: cur === 'sn' });
          dg.text('reference', 0.6, Y1 - 0.5, { size: 10.5, color: 'muted' });
          dg.text('disturbance', S.sd[0] - 0.3, Y1 + 1.35, { size: 10.5, color: 'muted', align: 'right' });
          dg.text('noise', S.sn[0] - 0.4, 0.55, { size: 10.5, color: 'muted', align: 'right' });
          dg.text('output', 19.4, Y1 - 0.5, { size: 10.5, color: 'muted', align: 'right' });
          dg.corner(`t = ${v.fix(tc, 1)} s`, 'tr', { color: 'muted' });
          // ---- traces of the selected element
          const I = INFO[cur];
          sc.hline(0, { color: 'faint' });
          for (const [s, col] of I.ins) trace(sc, rr.t, rr[s], { color: col, width: 1.8 });
          trace(sc, rr.t, rr[I.out[0]], { color: I.out[1], width: 2.4 });
          sc.vline(tc, { color: 'gold', width: 1.6 });
          for (const [s, col] of [...I.ins, I.out]) sc.dot(tc, at(rr[s], tc), { r: 4, color: col });
          sc.setTitle(I.name);
          if (legendFor !== cur) { legendFor = cur; v.legend([...I.ins.map(([, c, l]) => [c, `input $${l}$`]), [I.out[1], `output $${I.out[2]}$`], ['gold', 'now', { dot: true }]]); }
        }, { period: TEND, still: 9.4 });
        v.readout((t) => {
          const rr = getRun(), tc = (t ?? 0) % TEND, I = INFO[sel.value];
          const vals = [...I.ins, I.out].map(([s, , l]) => `$${l.split('=')[0]}$ = ${v.fix(at(rr[s], tc), 3)}`).join(', ');
          return `${I.name} at $t$ = ${v.fix(tc, 2)} s: ${vals} · output $y$ = ${v.fix(at(rr.y, tc), 3)} against the reference $r$ = ${v.fix(at(rr.r, tc), 0)}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.4
    {
      num: '1.4',
      kind: 'Theorem',
      name: 'Closed-loop transfer function',
      statement: String.raw`Consider the negative-feedback loop of linear time-invariant blocks with controller $C(s)$, plant $P(s)$ and sensor $H(s)$, started from rest, with reference $r$, load disturbance $d$ at the plant input and noise $n$ added to the measurement. Write $G=PC$. If $1+G(s)H(s)$ is not identically zero (the loop is **well posed**), then
$$Y(s)=\underbrace{\frac{PC}{1+PCH}}_{T_{yr}}R(s)+\underbrace{\frac{P}{1+PCH}}_{T_{yd}}D(s)-\underbrace{\frac{PC}{1+PCH}}_{T_{yn}}N(s).$$
In particular the transfer function from reference to output is
$$T(s)=\frac{G(s)}{1+G(s)H(s)} ,$$
and with polynomial fractions $C=n_C/d_C$, $P=n_P/d_P$, $H=n_H/d_H$ every closed-loop transfer function has the denominator $d_Cd_Pd_H+n_Cn_Pn_H$, whose zeros are the **closed-loop poles** (unless a factor cancels).`,
      idea: String.raw`Take Laplace transforms of every block (zero initial conditions), which turns each block into multiplication by its transfer function (sig-9.13): $E=R-HY-N$, $U=CE$, $Y=P(U+D)$. Substituting gives $Y=PC(R-HY-N)+PD$, so $(1+PCH)\,Y=PC\,R+P\,D-PC\,N$, and dividing by $1+PCH$ gives the formula. Reading $G/(1+GH)=G-G\,GH+G\,(GH)^2-\dots$ as signals circulating round the loop explains the shape. When the loop gain $GH$ is large, $T\approx 1/H$, independent of the plant: Black's principle (circ-8.2). The common denominator $1+GH$ (the return difference, 1.5) carries the stability of every closed-loop map at once.`,
      caption: String.raw`Choose a plant and a controller and set the gain $K$; the sensor lag can be switched on. Top: the loop and its closed-loop transfer function $T(s)$, computed by polynomial algebra from $G/(1+GH)$. Left: the step response of that formula, computed exactly from $T(s)$ (blue line), with gold dots from a direct time simulation of the three blocks wired in a loop. They lie on the curve; the readout reports the largest discrepancy. Right: the closed-loop poles (blue ×) are the roots of $1+GH$, and the open-loop poles (grey ×) are where they start at small gain. Raise $K$ on the third-order plant until the poles cross into the right half-plane: formula and simulation still agree, and both diverge.`,
      deps: ['ctrl-1.3', 'sig-9.13', 'circ-8.2'],
      refs: ['Åström–Murray §9.4', 'Franklin–Powell §4.1'],
      tags: ['transfer function', 'feedback'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Closed-loop_transfer_function' },
      viz(v) {
        const M = v.M, TEND = 16;
        const PL = {
          p1: { label: '$1/(s+1)$', P: tf([1], [1, 1]), tex: '\\dfrac{1}{s+1}' },
          p2: { label: '$1/((s+1)(0.5s+1))$', P: tf([1], [1, 1.5, 0.5]), tex: '\\dfrac{1}{(s+1)(0.5s+1)}' },
          p3: { label: '$1/(s+1)^3$', P: tf([1], [1, 3, 3, 1]), tex: '\\dfrac{1}{(s+1)^3}' },
          p4: { label: '$1/(s(s+1))$', P: tf([1], [0, 1, 1]), tex: '\\dfrac{1}{s(s+1)}' },
        };
        const plS = v.select('plant $P$', Object.entries(PL).map(([value, o]) => ({ value, label: o.label })), 'p3');
        const ctS = v.select('controller $C$', [{ value: 'P', label: 'P: $K$' }, { value: 'PI', label: 'PI: $K(1+\\frac{1}{2s})$' }], 'P');
        const kS = v.slider('gain $K$', 0.1, 20, 4, { log: true, fmt: (x) => v.fix(x, 2) });
        const hT = v.toggle('sensor lag $H=1/(0.3s+1)$', false);
        const dg = v.stage({ x: [0, 20.4], y: [0.3, 5.0], equal: true, axes: false, height: 190, full: true });
        const st = v.stage({ x: [0, TEND], y: [-0.6, 2.2], height: 290, axes: 'box', xlabel: 't (s)', ylabel: 'y(t)', weight: 1.45, title: 'unit-step response of the closed loop' });
        const pz = v.stage({ x: [-4.2, 1.6], y: [-3, 3], equal: true, height: 290, weight: 1, axes: true, xlabel: 'Re s', ylabel: 'Im s', title: 'poles in the $s$-plane' });
        let cache = null, ckey = '';
        const compute = () => {
          const k = `${plS.value}|${ctS.value}|${kS.value}|${hT.value}`;
          if (k === ckey) return cache;
          ckey = k;
          const K = kS.value, P = PL[plS.value].P, C = ctS.value === 'P' ? tf([K], [1]) : tf([K / 2, K], [0, 1]), H = hT.value ? tf([1], [1, 0.3]) : tf([1], [1]);
          const G = tfmul(P, C), T = tfFeedback(G, H), L = tfmul(G, H);
          const ex = stepExact(M, T, TEND, 400), sim = simLoop({ C, P, H }, { T: TEND, dt: 0.004 });
          let mx = 0, big = 1; for (let i = 0; i <= 400; i++) { const ys = sim.y[i * 10]; mx = Math.max(mx, Math.abs(ys - ex.y[i])); big = Math.max(big, Math.abs(ex.y[i])); }
          const cl = M.polyRoots(T.den).map((z) => [z.re, z.im]), ol = M.polyRoots(L.den).map((z) => [z.re, z.im]), zs = T.num.length > 1 ? M.polyRoots(T.num).map((z) => [z.re, z.im]) : [];
          // open loop without feedback, scaled so that it also aims at 1 (for comparison)
          const dc = Math.abs(G.den[0]) > 1e-12 ? G.num[0] / G.den[0] : null;
          const olStep = dc ? stepExact(M, tf(G.num.map((x) => x / dc), G.den), TEND, 400) : null;
          cache = { K, P, C, H, G, T, ex, sim, mx, rel: mx / big, cl, ol, zs, olStep };
          return cache;
        };
        v.render(() => {
          const c = compute();
          // ---- diagram (left) and the closed-loop transfer function (right)
          const Y = 3.7, Y2 = 1.35, R = 0.3;
          bdWire(dg, [[0.2, Y], [1.6 - R, Y]]); dg.tex('r', 0.6, Y + 0.38, { size: 15 });
          bdSum(dg, 1.6, Y, R, { w: '+', s: '−' });
          bdWire(dg, [[1.6 + R, Y], [2.75, Y]]); dg.tex('e', 2.2, Y + 0.38, { size: 15 });
          const ctex = ctS.value === 'P' ? v.fix(c.K, 2) : `${v.fix(c.K, 2)}\\left(1+\\tfrac{1}{2s}\\right)`;
          bdBlock(dg, 4.25, Y, 3.0, 1.2, ctex, { color: 'orange', size: 14, sub: 'C(s)' });
          bdWire(dg, [[5.75, Y], [6.75, Y]]); dg.tex('u', 6.25, Y + 0.38, { size: 15 });
          bdBlock(dg, 8.25, Y, 3.0, 1.2, PL[plS.value].tex, { color: 'accent', size: 14, sub: 'P(s)' });
          bdWire(dg, [[9.75, Y], [12.4, Y]]); dg.tex('y', 12.0, Y + 0.38, { size: 15 });
          dg.dot(10.7, Y, { r: 3.2, color: 'ink' });
          bdWire(dg, [[10.7, Y], [10.7, Y2], [9.75, Y2]]);
          bdBlock(dg, 8.25, Y2, 3.0, 1.1, hT.value ? '\\dfrac{1}{0.3s+1}' : '1', { color: 'teal', size: 14, sub: 'H(s)' });
          bdWire(dg, [[6.75, Y2], [1.6, Y2], [1.6, Y - R]]);
          dg.line(13.1, 0.4, 13.1, 4.9, { color: 'faint', width: 1 });
          dg.tex('T(s)=\\dfrac{G}{1+GH}=\\dfrac{PC}{1+PCH}', 16.7, 3.85, { size: 14, color: 'ink' });
          dg.tex(`=${tfTeX(c.T)}`, 16.7, 1.75, { size: 14, color: 'accent' });
          // ---- step responses
          st.hline(1, { color: 'ink', dash: [5, 4], width: 1 });
          st.clip(() => {
            if (c.olStep) trace(st, c.olStep.t, c.olStep.y, { color: 'muted', width: 1.4, dash: [3, 4] });
            trace(st, c.ex.t, c.ex.y, { color: 'accent', width: 2.6 });
            const pts = []; for (let i = 0; i < c.sim.t.length; i += 100) if (Math.abs(c.sim.y[i]) < 50) pts.push([c.sim.t[i], c.sim.y[i]]);
            st.dots(pts, { r: 3.2, color: 'gold' });
          });
          // ---- poles
          pz.vband(0, 5, { color: 'red', alpha: 0.07 });
          for (const p of c.ol) { pz.line(p[0] - 0.13, p[1] - 0.13, p[0] + 0.13, p[1] + 0.13, { color: 'muted', width: 2 }); pz.line(p[0] - 0.13, p[1] + 0.13, p[0] + 0.13, p[1] - 0.13, { color: 'muted', width: 2 }); }
          for (const z of c.zs) pz.circle(z[0], z[1], 0.12, { color: 'green', width: 2 });
          for (const p of c.cl) {
            const col = p[0] > 1e-9 ? 'red' : 'accent', q = [clamp(p[0], -4.1, 1.5), clamp(p[1], -2.9, 2.9)];
            pz.line(q[0] - 0.17, q[1] - 0.17, q[0] + 0.17, q[1] + 0.17, { color: col, width: 3 }); pz.line(q[0] - 0.17, q[1] + 0.17, q[0] + 0.17, q[1] - 0.17, { color: col, width: 3 });
          }
          pz.text('unstable', 0.8, -2.65, { size: 11, color: 'red', align: 'center' });
        });
        v.legend([['accent', 'from the formula $T=G/(1+GH)$'], ['gold', 'direct simulation of the loop', { dot: true }], ['muted', 'open loop, no feedback (scaled to aim at 1)', { dash: true }], ['green', 'closed-loop zeros', { dot: true }]]);
        v.readout(() => {
          const c = compute(), mr = Math.max(...c.cl.map((p) => p[0]));
          const T0 = Math.abs(c.T.den[0]) > 1e-12 ? c.T.num[0] / c.T.den[0] : NaN;
          const poles = c.cl.slice().sort((a, b) => b[0] - a[0]).map((p) => (Math.abs(p[1]) < 1e-9 ? v.fix(p[0], 3) : `$${v.fix(p[0], 3)}${p[1] < 0 ? '-' : '+'}${v.fix(Math.abs(p[1]), 3)}i$`)).join(', ');
          const fin = mr < 0 ? ` · steady state $T(0)$ = ${v.fix(T0, 4)}${Math.abs(T0 - 1) > 1e-6 ? `, so the loop leaves an error of ${v.fix(1 - T0, 4)}` : ': no steady-state error'}` : '';
          return `closed-loop poles: ${poles} → ${mr < 0 ? '**stable**' : '**unstable**'}${fin} · formula vs loop simulation: largest difference $${v.sci(Math.max(c.mx, 1e-16), 2)}$${mr >= 0 ? ` (relative to the largest output, $${v.sci(Math.max(c.rel, 1e-16), 2)}$)` : ''}, so the two agree`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.5
    {
      num: '1.5',
      kind: 'Definition',
      name: 'Loop transfer function and return difference',
      statement: String.raw`Cut a single-loop feedback system at any point, inject a signal $x$ on the downstream side and look at the signal $z$ that arrives back on the upstream side (all other inputs set to zero). For the negative-feedback loop of 1.4 the returned signal is $Z(s)=-L(s)X(s)$, where the **loop transfer function** is the product of all the blocks around the loop,
$$L(s)=P(s)C(s)H(s).$$
The minus sign comes from the comparator. The **return difference** is
$$F(s)=1+L(s)=\frac{X(s)-Z(s)}{X(s)},$$
the injected signal minus what comes back, per unit injected. The closed-loop characteristic equation is $1+L(s)=0$, every closed-loop transfer function has $1+L$ in its denominator, and $|1+L(i\omega)|$ is the distance from the point $L(i\omega)$ to the **critical point** $-1$. For a single loop, $L$ is the same wherever the loop is cut, because scalars commute; for multivariable loops, cutting at the plant input or at its output gives the generally different matrices $CHP$ and $PCH$.`,
      idea: String.raw`With the loop cut and $r=d=n=0$, the injected $x$ passes once through each block and once through the comparator's minus sign, so $z=-PCHx$. Closing the loop forces $z=x$, so $(1+L)x=0$: a nonzero signal can circulate on its own only at an $s$ where $1+L(s)=0$, which is why those $s$ are the closed-loop poles. The return difference measures how far the loop is from such self-sustained circulation. Its size at each frequency is the improvement factor of 1.7 and 1.8 ($S=1/(1+L)$), and its distance from zero along $s=i\omega$ becomes the Nyquist criterion (7.4).`,
      caption: String.raw`Click a wire of the loop to cut it there (red marks). A sine $x=\sin\omega t$ (orange) is injected after the cut; the signal coming back to the other side, $z$ (blue), is simulated block by block, and its steady-state gain and phase are measured by a least-squares sine fit. On the right, the curve $L(i\omega)$ for all frequencies, the point $L(i\omega)$ at the chosen $\omega$, the measured point (gold ring, which lands on it) and the return-difference vector $1+L$ from $-1$ to $L$ (green). Move the cut: the measured $L$ stays the same. Change $\omega$ and $K$ and watch $|1+L|$, the distance to $-1$.`,
      deps: ['ctrl-1.4'],
      see: ['ctrl-7.4'],
      refs: ['Åström–Murray §10.1'],
      tags: ['loop transfer function', 'return difference'],
      viz(v) {
        const wS = v.slider('test frequency $\\omega$', 0.05, 30, 1.5, { log: true, fmt: (x) => `${v.fix(x, x < 1 ? 3 : 2)} rad/s` });
        const kS = v.slider('controller gain $K$', 0.2, 10, 2.5, { log: true, fmt: (x) => v.fix(x, 2) });
        const cutS = v.select('cut the loop at', [{ value: 0, label: '$e$' }, { value: 1, label: '$u$' }, { value: 2, label: '$y$' }, { value: 3, label: '$y_m$' }], 1);
        const dg = v.stage({ x: [0, 20], y: [0.4, 5.6], equal: true, axes: false, height: 185, full: true });
        const sc = v.stage({ x: [0, 1], y: [-2.6, 2.6], height: 270, axes: 'box', xlabel: 't (s)', weight: 1.3, title: 'injected $x$ and returned $z$, in steady state' });
        const ny = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, height: 270, axes: true, weight: 1, xlabel: 'Re', ylabel: 'Im', title: '$L(i\\omega)$ and the return difference $1+L$' });
        const blocks = () => [tf([kS.value], [1]), tf([1], [1, 1.5, 0.5]), tf([1], [1, 0.2])];
        const L = () => tf([kS.value], pmul(pmul([1, 1], [1, 0.5]), [1, 0.2]));
        // the chain from the cut back to the cut: start at block k, comparator sign −1 included once
        const order = [[0, 1, 2], [1, 2, 0], [2, 0, 1], [0, 1, 2]], startAt = [0, 1, 2, 0];
        let cache = null, ckey = '';
        const measure = () => {
          const w = wS.value, cut = +cutS.value, k = `${w}|${kS.value}|${cut}`;
          if (k === ckey) return cache;
          ckey = k;
          const per = TAU / w, Tset = 14, Tend = Tset + 3 * per, dt = Math.min(0.01, per / 300);
          const bl = blocks(), seq = [0, 1, 2].map((i) => bl[(startAt[cut] + i) % 3]).map(realize);
          const offs = [0, seq[0].n, seq[0].n + seq[1].n], NS = offs[2] + seq[2].n;
          // the open chain x → block → block → block; returns the chain output (z is minus this: the comparator)
          const deriv = (X, t, dX) => {
            let u = Math.sin(w * t);
            for (let i = 0; i < 3; i++) {
              const b = seq[i], o = offs[i]; let last = u, y = b.D * u;
              for (let j = 0; j < b.n; j++) { last -= b.a[j] * X[o + j]; y += b.C[j] * X[o + j]; }
              for (let j = 0; j < b.n - 1; j++) dX[o + j] = X[o + j + 1];
              if (b.n) dX[o + b.n - 1] = last;
              u = y;
            }
            return u;
          };
          const X = new Float64Array(NS), Xt = new Float64Array(NS), k1 = new Float64Array(NS), k2 = new Float64Array(NS), k3 = new Float64Array(NS), k4 = new Float64Array(NS);
          const ts = [], zs = [], xsIn = [], N = Math.ceil(Tend / dt);
          for (let n = 0; n <= N; n++) {
            const t = n * dt, y = deriv(X, t, k1);
            if (t >= Tset) { ts.push(t); xsIn.push(Math.sin(w * t)); zs.push(-y); }
            for (let i = 0; i < NS; i++) Xt[i] = X[i] + (dt / 2) * k1[i];
            deriv(Xt, t + dt / 2, k2);
            for (let i = 0; i < NS; i++) Xt[i] = X[i] + (dt / 2) * k2[i];
            deriv(Xt, t + dt / 2, k3);
            for (let i = 0; i < NS; i++) Xt[i] = X[i] + dt * k3[i];
            deriv(Xt, t + dt, k4);
            for (let i = 0; i < NS; i++) X[i] += (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
          }
          const f = fitSine(ts, zs, w);
          // z ≈ amp cos(ωt + φ) = amp sin(ωt + φ + π/2); the injected x = sin ωt, so z/x = amp e^{i(φ+π/2)} = −L
          const ratio = [f.amp * Math.cos(f.phase + Math.PI / 2), f.amp * Math.sin(f.phase + Math.PI / 2)];
          const Lm = [-ratio[0], -ratio[1]];
          const stride = Math.max(1, Math.floor(ts.length / 700));
          cache = { ts: ts.filter((_, i) => i % stride === 0), zs: zs.filter((_, i) => i % stride === 0), xs: xsIn.filter((_, i) => i % stride === 0), Lm, per, Tset };
          return cache;
        };
        dg.onClick((x, y) => {
          const pts = [[3.5, 4.1], [9.05, 4.1], [15.9, 4.1], [6.5, 1.4]];
          let best = 0, bd = 1e9; pts.forEach((p, i) => { const d = Math.hypot(x - p[0], y - p[1]); if (d < bd) { bd = d; best = i; } });
          if (bd < 2.5) cutS.set(best);
        });
        v.render(() => {
          const m = measure(), w = wS.value, Lw = tfAt(L(), w), cut = +cutS.value;
          // ---- diagram: comparator, C, P, sensor, with the cut marked
          const Y = 4.1, Y2 = 1.4, R = 0.34;
          const segs = [
            { pts: [[2.0 + R, Y], [4.7, Y]], lab: ['e', 3.5, Y + 0.42] },
            { pts: [[7.3, Y], [10.8, Y]], lab: ['u', 9.05, Y + 0.42] },
            { pts: [[14.4, Y], [17.4, Y], [17.4, Y2], [14.4, Y2]], lab: ['y', 17.8, 2.75] },
            { pts: [[10.8, Y2], [2.0, Y2], [2.0, Y - R]], lab: ['y_m', 6.5, Y2 + 0.42] },
          ];
          bdSum(dg, 2.0, Y, R, { w: '+', s: '−' });
          bdWire(dg, [[0.3, Y], [2.0 - R, Y]], { alpha: 0.4 }); dg.tex('r=0', 0.9, Y + 0.45, { size: 13, color: 'muted' });
          bdBlock(dg, 6.0, Y, 2.6, 1.3, `${v.fix(kS.value, 2)}`, { color: 'orange', sub: 'C(s)', size: 15 });
          bdBlock(dg, 12.6, Y, 3.6, 1.35, '\\dfrac{1}{(s+1)(0.5s+1)}', { color: 'accent', sub: 'P(s)', size: 12.5 });
          bdBlock(dg, 12.6, Y2, 3.6, 1.25, '\\dfrac{1}{0.2s+1}', { color: 'teal', sub: 'H(s)', size: 12.5 });
          segs.forEach((sg, i) => {
            const cutHere = i === cut;
            bdWire(dg, sg.pts, { color: cutHere ? 'faint' : 'muted', width: cutHere ? 1.3 : 1.7 });
            dg.tex(sg.lab[0], sg.lab[1], sg.lab[2], { size: 15, color: cutHere ? 'muted' : 'ink' });
          });
          // the cut, in the middle of the first segment of the chosen wire: z is read upstream, x injected downstream
          const sg = segs[cut], A = sg.pts[0], Bp = sg.pts[1], mid = [(A[0] + Bp[0]) / 2, (A[1] + Bp[1]) / 2];
          const dir = Math.sign(Bp[0] - A[0]), g = 0.45;
          const up = [mid[0] - dir * g, mid[1]], dn = [mid[0] + dir * g, mid[1]];
          for (const p of [up, dn]) dg.line(p[0], p[1] - 0.32, p[0], p[1] + 0.32, { color: 'red', width: 2.8 });
          const side = mid[1] < 2.5 ? 1 : -1, gen = [dn[0] + dir * 0.55, dn[1] + side * 1.0];
          dg.circle(gen[0], gen[1], 0.36, { color: 'orange', width: 2, fill: 'panel', fillAlpha: 1 });
          dg.curve((q) => [gen[0] - 0.22 + 0.44 * q, gen[1] + 0.14 * Math.sin(TAU * q)], 0, 1, { color: 'orange', width: 1.6, n: 30 });
          dg.arrow(gen[0], gen[1] - side * 0.36, dn[0] + dir * 0.55, dn[1] - side * 0.04, { color: 'orange', width: 1.6, head: 6 });
          dg.tex('x', gen[0] + 0.62, gen[1], { size: 15, color: 'orange' });
          dg.dot(up[0], up[1], { r: 4.5, color: 'accent' });
          dg.tex('z', up[0] - dir * 0.15, up[1] + side * 0.62, { size: 15, color: 'accent' });
          dg.corner('click a wire to cut the loop there', 'tr', { size: 11 });
          // ---- scope: last two periods
          const t1 = m.ts[m.ts.length - 1], t0 = t1 - 2 * m.per;
          sc.setView([t0, t1], null);
          const amp = Math.max(1.15, ...m.zs.map(Math.abs).slice(-300)) * 1.15;
          sc.setView(null, [-amp, amp]);
          sc.hline(0, { color: 'faint' });
          trace(sc, m.ts, m.xs, { color: 'orange', width: 2 });
          trace(sc, m.ts, m.zs, { color: 'accent', width: 2.4 });
          trace(sc, m.ts, m.xs.map((x, i) => x - m.zs[i]), { color: 'green', width: 1.6, dash: [6, 4] });
          // ---- Nyquist-style plane
          const ws = logspace(0.01, 200, 500), curve = ws.map((q) => tfAt(L(), q));
          const lim = Math.max(1.6, ...curve.map((z) => Math.max(Math.abs(z[0]), Math.abs(z[1])))) * 1.08;
          const lo = Math.min(-1.6, ...curve.map((z) => z[0])) - 0.3;
          ny.setView([lo, Math.max(lim, 1.2)], [-Math.max(1.4, lim * 0.75), Math.max(1.4, lim * 0.6)]);
          ny.path(curve, { color: 'purple', width: 2 });
          ny.dot(-1, 0, { r: 5, color: 'red', label: '−1', labelPos: 'nw' });
          ny.arrow(-1, 0, Lw[0], Lw[1], { color: 'green', width: 2.4 });
          { // label beside the middle of the arrow, on its left-hand side (screen pixels)
            const X0 = ny.X(-1), Y0 = ny.Y(0), X1 = ny.X(Lw[0]), Y1 = ny.Y(Lw[1]), ln = Math.hypot(X1 - X0, Y1 - Y0) || 1;
            ny.texPx('1+L', (X0 + X1) / 2 - ((Y1 - Y0) / ln) * 24, (Y0 + Y1) / 2 + ((X1 - X0) / ln) * 24, { size: 14, color: 'green' });
          }
          ny.dot(Lw[0], Lw[1], { r: 5.5, color: 'accent' });
          ny.dot(m.Lm[0], m.Lm[1], { r: 9, hollow: true, color: 'gold', width: 2.2 });
          ny.tex('L(i\\omega)', Lw[0], Lw[1], { size: 14, color: 'accent', dx: 14, dy: 14, align: 'left' });
        });
        v.legend([['orange', 'injected $x=\\sin\\omega t$'], ['accent', 'returned $z=-Lx$'], ['green', '$x-z=(1+L)x$', { dash: true }], ['purple', '$L(i\\omega)$, all $\\omega$'], ['gold', 'measured $L$', { dot: true }]]);
        v.readout(() => {
          const m = measure(), Lw = tfAt(L(), wS.value);
          const names = ['e', 'u', 'y', 'y_m'];
          return `cut at $${names[+cutS.value]}$: measured $|L|$ = ${v.fix(cabs(m.Lm), 4)}, $\\angle L$ = ${v.fix(deg(carg(m.Lm)), 2)}° · formula $L(i\\omega)=PCH$: $|L|$ = ${v.fix(cabs(Lw), 4)}, $\\angle L$ = ${v.fix(deg(carg(Lw)), 2)}° · return difference $|1+L(i\\omega)|$ = **${v.fix(cabs(cadd([1, 0], Lw)), 4)}**, the distance from $L$ to $-1$`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.6
    {
      num: '1.6',
      kind: 'Definition',
      name: 'Sensitivity and complementary sensitivity: S + T = 1',
      statement: String.raw`For a feedback loop with loop transfer function $L=PC$ (unity feedback), the **sensitivity function** and the **complementary sensitivity function** are
$$S(s)=\frac{1}{1+L(s)},\qquad T(s)=\frac{L(s)}{1+L(s)} .$$
$S$ maps an output disturbance to the output and the reference to the error ($e=Sr$); $T$ maps the reference to the output, and the measurement noise to the output with a minus sign. Directly from the definitions,
$$S(s)+T(s)=1\quad\text{for every } s ,$$
as complex numbers. So $S$ and $T$ cannot both be small at the same frequency. Where $|L(i\omega)|\gg1$, $S\approx1/L$ is small and $T\approx1$; where $|L(i\omega)|\ll1$, $T\approx L$ is small and $S\approx1$. The magnitudes need not add to one: $|S|+|T|\ge1$, and near crossover both can exceed $1$.`,
      idea: String.raw`The identity is one line, $\frac{1}{1+L}+\frac{L}{1+L}=\frac{1+L}{1+L}$, but it encodes the basic trade-off of feedback design. Small $|S|$ means good disturbance rejection and low sensitivity to the plant (1.7, 1.8); small $|T|$ means noise is kept out and model errors at high frequency cannot destabilise the loop (8.7). Since $S+T=1$, the designer allots frequencies: large loop gain at low frequency, where disturbances live, and small loop gain at high frequency, where sensor noise and model uncertainty dominate. The peak $\max_\omega|S(i\omega)|$ is the reciprocal of the smallest distance from $L(i\omega)$ to $-1$, a robustness measure (7.7).`,
      caption: String.raw`Left: Bode magnitudes of $|L|$ (purple), $|S|$ (blue) and $|T|$ (orange) on a logarithmic frequency axis; switch the magnitude axis between log and linear. Drag the gold handle along the frequency axis. Right: at that frequency, the complex numbers $S$ and $T$ drawn head to tail always end exactly at $1$, even where both magnitudes exceed one. The green dashed line is $|S+T|$, computed numerically at every frequency. Raise $K$: the region where $|S|\ll1$ widens, and the peak of $|S|$ grows as $L$ approaches $-1$.`,
      deps: ['ctrl-1.5'],
      see: ['ctrl-7.7', 'ctrl-8.3'],
      refs: ['Åström–Murray §12.1', 'Franklin–Powell §4.1'],
      tags: ['sensitivity', 'frequency response'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Sensitivity_(control_systems)' },
      viz(v) {
        const LOOPS = {
          pi: { label: 'PI + two lags', L: (K) => tf([K / 2, K], pmul([0, 1], [1, 1.2, 0.2])) },
          p3: { label: 'P + three lags', L: (K) => tf([K], [1, 3, 3, 1]) },
        };
        const lpS = v.select('loop', Object.entries(LOOPS).map(([value, o]) => ({ value, label: o.label })), 'pi');
        const kS = v.slider('gain $K$', 0.2, 7, 2.5, { log: true, fmt: (x) => v.fix(x, 2) });
        const scS = v.select('magnitude axis', [{ value: 'log', label: 'log' }, { value: 'lin', label: 'linear' }], 'log');
        const bd = v.stage({ x: [0.01, 100], y: [0.01, 100], xlog: true, ylog: true, height: 320, axes: 'box', xlabel: 'ω (rad/s)', ylabel: 'magnitude', weight: 1.45, title: 'Bode magnitudes' });
        const cp = v.stage({ x: [-1, 2.2], y: [-1.6, 1.6], equal: true, height: 320, axes: true, weight: 1, title: '$S(i\\omega)+T(i\\omega)$ in the complex plane' });
        const hd = bd.handle(1, 0.012, { color: 'gold', constrain: (x) => [clamp(x, 0.0101, 99), scS.value === 'log' ? 0.012 : 0.06] });
        let lastScale = 'log';
        const grid = logspace(0.01, 100, 600);
        v.render(() => {
          if (scS.value !== lastScale) {
            lastScale = scS.value;
            bd.setScale(scS.value === 'log' ? { ylog: true, y: [0.01, 100] } : { ylog: false, y: [0, 2.6] });
            hd.y = scS.value === 'log' ? 0.012 : 0.06;
          }
          const Ls = LOOPS[lpS.value].L(kS.value), w = hd.x;
          const vals = grid.map((q) => { const l = tfAt(Ls, q), den = cadd([1, 0], l), S = cdiv([1, 0], den), T = cdiv(l, den); return { l, S, T }; });
          bd.hline(1, { color: 'faint', width: 1 });
          const pts = (f) => grid.map((q, i) => [q, f(vals[i])]);
          bd.clip(() => {
            bd.path(pts((z) => cabs(z.l)), { color: 'purple', width: 1.6, alpha: 0.75 });
            bd.path(pts((z) => cabs(z.S)), { color: 'accent', width: 2.6 });
            bd.path(pts((z) => cabs(z.T)), { color: 'orange', width: 2.6 });
            bd.path(pts((z) => cabs(cadd(z.S, z.T))), { color: 'green', width: 2, dash: [7, 5] });
          });
          bd.vline(w, { color: 'gold', width: 1.4 });
          const l = tfAt(Ls, w), den = cadd([1, 0], l), S = cdiv([1, 0], den), T = cdiv(l, den);
          bd.dot(w, cabs(S), { r: 4.5, color: 'accent' }); bd.dot(w, cabs(T), { r: 4.5, color: 'orange' });
          // ---- complex plane
          const R = Math.max(1.6, cabs(S) + 0.3, cabs(T) + 0.3);
          cp.setView([Math.min(-1, -R + 1), Math.max(2.2, R)], [-R, R]);
          cp.circle(0, 0, 1, { color: 'faint', width: 1, dash: [3, 4] });
          cp.arrow(0, 0, S[0], S[1], { color: 'accent', width: 2.6 });
          cp.arrow(S[0], S[1], S[0] + T[0], S[1] + T[1], { color: 'orange', width: 2.6 });
          cp.arrow(0, 0, T[0], T[1], { color: 'orange', width: 1.4, alpha: 0.45, dash: [5, 4] });
          cp.line(T[0], T[1], 1, 0, { color: 'accent', width: 1.2, alpha: 0.45, dash: [5, 4] });
          cp.dot(1, 0, { r: 6, color: 'green', label: '1', labelPos: 'se' });
          cp.dot(0, 0, { r: 3, color: 'ink' });
          cp.tex('S', S[0] / 2, S[1] / 2, { size: 16, color: 'accent', dx: -12, dy: -10 });
          cp.tex('T', S[0] + T[0] / 2, S[1] + T[1] / 2, { size: 16, color: 'orange', dx: 12, dy: -10 });
        });
        v.legend([['purple', '$|L|$'], ['accent', '$|S|=1/|1+L|$'], ['orange', '$|T|=|L|/|1+L|$'], ['green', '$|S+T|$ (computed)', { dash: true }]]);
        v.readout(() => {
          const Ls = LOOPS[lpS.value].L(kS.value), w = hd.x, l = tfAt(Ls, w), den = cadd([1, 0], l), S = cdiv([1, 0], den), T = cdiv(l, den), sum = cadd(S, T);
          let err = 0, Ms = 0, wM = 0; for (const q of grid) { const lq = tfAt(Ls, q), d = cadd([1, 0], lq), Sq = cdiv([1, 0], d), Tq = cdiv(lq, d); err = Math.max(err, cabs([Sq[0] + Tq[0] - 1, Sq[1] + Tq[1]])); if (cabs(Sq) > Ms) { Ms = cabs(Sq); wM = q; } }
          return `at $\\omega$ = ${v.fix(w, 3)} rad/s: $S$ = $${cxTeX(v, S)}$, $T$ = $${cxTeX(v, T)}$, $S+T$ = $${cxTeX(v, sum, 6)}$ · but $|S|+|T|$ = ${v.fix(cabs(S) + cabs(T), 3)} · largest $|S+T-1|$ over 600 frequencies: $${v.sci(Math.max(err, 1e-17), 1)}$ (rounding) · peak $|S|$ = ${v.fix(Ms, 2)} at $\\omega$ = ${v.fix(wM, 2)}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.7
    {
      num: '1.7',
      kind: 'Principle',
      name: 'Feedback reduces sensitivity to plant variations',
      statement: String.raw`In a unity-feedback loop with $T=PC/(1+PC)$, the relative change of the closed-loop transfer function caused by a relative change of the plant is scaled by the sensitivity function:
$$\frac{dT/T}{dP/P}=\frac{1}{1+PC}=S .$$
For a finite change from $P_0$ to $P$ the identity is exact in the form
$$\frac{T-T_0}{T}=S_0\,\frac{P-P_0}{P},\qquad S_0=\frac{1}{1+P_0C}.$$
So at frequencies where the loop gain $|PC|$ is large, the closed loop is much less sensitive to plant variations than the plant itself; in open loop (no feedback) the output changes in full proportion to the plant.`,
      scope: String.raw`linear loops that stay stable for all the plants considered; the gain in insensitivity is available only where $|PC|\gg1$, and it does not extend to the sensor: in a loop $T\approx1/H$, so sensor errors pass straight through.`,
      idea: String.raw`Differentiate: $dT/dP=C/(1+PC)^2$, so $\frac{P}{T}\frac{dT}{dP}=\frac{1}{1+PC}$. The closed loop's output is set by the comparison $e=r-y$, and the plant matters only through how much error it needs to produce a given output; with large loop gain that error is tiny whatever the plant. This is the principle behind Black's feedback amplifier (circ-8.2): vacuum tubes whose gain drifted by tens of percent, wrapped in feedback, gave amplifiers stable to a fraction of a percent. The price is that high loop gain must be achieved without destabilising the loop (1.9).`,
      caption: String.raw`Forty plants $P_k(s)=k/((\tau s+1)(0.1s+1))$ are drawn at random with the gain $k$ within $\pm\delta$ of 1 (and optionally the time constant $\tau$ within $\pm50\%$ of 1). Left: open loop, driven by the input that would give $y\to1$ for the nominal plant. Right: closed loop with proportional gain $K$ and a fixed prefilter that again aims the nominal plant at 1. The final values fan out by $\pm\delta$ in open loop and much less in closed loop. Bottom: final value against plant gain $k$, with each trial as a dot; the closed-loop slope at $k=1$ is $S_0=1/(1+K)$. Raise $K$ to tighten the bundle, and watch the price: overshoot.`,
      deps: ['ctrl-1.6'],
      refs: ['Åström–Murray §2.5', 'Franklin–Powell §4.1'],
      tags: ['sensitivity', 'robustness'],
      see: ['circ-8.16'],
      viz(v) {
        const M = v.M, TEND = 6, N = 40;
        const dS = v.slider('plant gain spread $\\pm\\delta$', 0, 0.6, 0.5, { step: 0.01, fmt: (x) => `±${Math.round(100 * x)} %` });
        const kS = v.slider('feedback gain $K$', 0.5, 40, 10, { log: true, fmt: (x) => v.fix(x, 1) });
        const tT = v.toggle('vary the time constant too (±50 %)', false);
        let seed = 3;
        v.button('Resample plants', () => { seed++; });
        const so = v.stage({ x: [0, TEND], y: [0, 1.85], height: 240, axes: 'box', xlabel: 't', weight: 1, title: 'open loop: $u=r/k_0$' });
        const scl = v.stage({ x: [0, TEND], y: [0, 1.85], height: 240, axes: 'box', xlabel: 't', weight: 1, title: 'closed loop: gain $K$, prefilter $(1+k_0K)/(k_0K)$' });
        const fv = v.stage({ x: [0.35, 1.65], y: [0.35, 1.65], height: 210, axes: 'box', xlabel: 'plant gain k', ylabel: 'final value', full: true });
        let cache = null, ckey = '';
        const compute = () => {
          const K = kS.value, d = dS.value, k = `${K}|${d}|${tT.value}|${seed}`;
          if (k === ckey) return cache;
          ckey = k;
          const r = v.rng(seed), F = (1 + K) / K, runs = [];
          for (let i = 0; i < N; i++) {
            const g = 1 + d * (2 * r() - 1), tau = tT.value ? 1 + 0.5 * (2 * r() - 1) : 1;
            const P = tf([g], pmul([1, tau], [1, 0.1]));
            const ol = stepExact(M, P, TEND, 180);
            const cl = stepExact(M, tfFeedback(tf([g * K * F], pmul([1, tau], [1, 0.1])), tf([1 / F], [1])), TEND, 180);
            runs.push({ g, tau, ol, cl, olF: ol.y[ol.y.length - 1], clF: cl.y[cl.y.length - 1], olInf: g, clInf: (F * g * K) / (1 + g * K) });
          }
          cache = { runs, K, F, d };
          return cache;
        };
        v.render(() => {
          const c = compute();
          for (const s of [so, scl]) { s.hband(1 - 0.02, 1 + 0.02, { color: 'green', alpha: 0.18 }); s.hline(1, { color: 'ink', dash: [5, 4], width: 1 }); }
          for (const rr of c.runs) {
            trace(so, rr.ol.t, rr.ol.y, { color: 'red', width: 1.2, alpha: 0.55 });
            scl.clip(() => trace(scl, rr.cl.t, rr.cl.y, { color: 'green', width: 1.2, alpha: 0.55 }));
          }
          // final value vs plant gain
          fv.line(0.35, 0.35, 1.65, 1.65, { color: 'red', width: 2 });
          fv.fn((g) => (c.F * g * c.K) / (1 + g * c.K), { color: 'green', width: 2.4, domain: [0.35, 1.65] });
          const S0 = 1 / (1 + c.K);
          fv.line(0.5, 1 - 0.5 * S0, 1.5, 1 + 0.5 * S0, { color: 'accent', width: 1.4, dash: [5, 4] });
          fv.vband(1 - c.d, 1 + c.d, { color: 'gold', alpha: 0.07 });
          for (const rr of c.runs) { fv.dot(rr.g, rr.olF, { r: 3.2, color: 'red' }); fv.dot(rr.g, rr.clF, { r: 3.2, color: 'green' }); }
          fv.dot(1, 1, { r: 5, color: 'ink' });
          fv.text(`closed loop: slope ${v.fix(S0, 3)} = 1/(1+K)`, 1.6, 1 + 0.6 * S0, { size: 11.5, color: 'accent', align: 'right', dy: -14 });
          fv.text('open loop: slope 1', 1.3, 1.37, { size: 11.5, color: 'red', align: 'right' });
        });
        v.legend([['red', 'open loop'], ['green', 'closed loop'], ['accent', 'tangent at $k_0=1$: slope $S_0$', { dash: true }], ['gold', 'range of plant gains', { area: true }]]);
        v.readout(() => {
          const c = compute(), ol = c.runs.map((rr) => rr.olF), cl = c.runs.map((rr) => rr.clF);
          const spO = Math.max(...ol) - Math.min(...ol), spC = Math.max(...cl) - Math.min(...cl);
          // exact finite-change identity checked on the most extreme plant
          const ex = c.runs.reduce((a, b) => (Math.abs(b.g - 1) > Math.abs(a.g - 1) ? b : a));
          const lhs = (ex.clInf - 1) / ex.clInf, rhs = (1 / (1 + c.K)) * (ex.g - 1) / ex.g;
          return `spread of final values: open loop ${v.fix(spO, 3)}, closed loop ${v.fix(spC, 3)}, ratio **${v.fix(spC / Math.max(spO, 1e-9), 3)}** · $S_0=1/(1+K)$ = ${v.fix(1 / (1 + c.K), 3)} · exact identity for the plant with $k$ = ${v.fix(ex.g, 3)}: $(T-T_0)/T$ = ${v.fix(lhs, 4)}, $S_0(P-P_0)/P$ = ${v.fix(rhs, 4)}`;
        });
      },
    },
  ],
};
