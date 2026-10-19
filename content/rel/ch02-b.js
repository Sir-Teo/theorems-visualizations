// Special & General Relativity — Chapter 2 (items 2.8–2.14): paradoxes, Doppler, aberration, groups
import { gam, toMoving, fromMoving, P, atanh, lightLines, ETA, mm, mv, tr, I4, boost4, rot4, lorentzDefect, det4, pmatrix } from './ch02.shared.js';

export default {
  collection: 'rel',
  chapter: 2,
  items: [
    // ───────────────────────────────────────────────────────────── 2.8
    {
      num: '2.8',
      kind: 'Paradox',
      name: 'Ladder (pole-in-barn) paradox',
      statement: String.raw`A pole of rest length $L_p$ moves along the axis of a barn of rest length $L_b<L_p$ at speed $v$, with $L_p/\gamma<L_b$. In the barn's frame the contracted pole fits inside, so both doors can be shut at the same instant with the pole entirely within. In the pole's frame the barn is contracted even more, to $L_b/\gamma\ll L_p$, so the pole can never be inside. The resolution is that the two door-closing events, simultaneous in the barn frame, are **not** simultaneous in the pole frame: the far door closes first, before the pole's front end gets there and the near door closes after the pole's rear end has passed. No frame sees the pole hit a closed door, and no contradiction arises.`,
      idea: String.raw`Length contraction (rel-1.11) is the statement that the two ends of a moving object are located *simultaneously* in the observer's frame, and simultaneity is relative (rel-1.6). The two door-closing events are separated in the barn frame by $\Delta t=0$ and $\Delta x=L_b$; the Lorentz transformation (2.1) puts them $\Delta t'=-\gamma\beta L_b/c$ apart in the pole frame. The question "is the pole inside the barn?" compares the pole's two ends with the doors at one moment, and each frame answers it with a different set of moments.`,
      caption: String.raw`The same spacetime in the barn frame (left) and the pole frame (right). The pole is the blue strip, the barn's walls are orange, closed doors are thick red. **Drag the gold line** in either panel to step that frame's time and watch the snapshot of pole and barn on it. Raise $v/c$ or lengthen the pole: when $L_p/\gamma$ exceeds $L_b$ the pole no longer fits at any moment and the closed doors would hit it.`,
      deps: ['rel-1.11', 'rel-2.1'],
      refs: ['Schutz §1.11', 'Taylor–Wheeler ch. 5'],
      tags: ['length contraction', 'simultaneity'],
      viz(v) {
        const Lb = 1;
        const bS = v.slider('$v/c$', 0.3, 0.97, 0.8, { step: 0.01 });
        const LpS = v.slider('pole rest length $L_p$', 0.5, 2.5, 1.6, { step: 0.05 });
        const mk = (title) => v.stage({ x: [-2.6, 4.6], y: [-3.2, 3.2], equal: true, axes: false, height: 520, weight: 1, minWidth: 320, title });
        const SA = mk('barn frame: barn at rest, pole moving'), SB = mk('pole frame: pole at rest, barn moving');
        const hA = SA.handle(-2.2, -1.2, { color: 'gold', constrain: 'y', r: 7 }), hB = SB.handle(-2.2, 0.4, { color: 'gold', constrain: 'y', r: 7 });
        let st = {};
        v.render(() => {
          const b = bS.value, g = gam(b), Lp = LpS.value, lc = Lp / g, r0 = (Lb - lc) / 2, fits = lc < Lb;
          const h = fits ? Math.min(0.6 * r0 / b, 1.4) : 0.2;
          const M = [(t, x) => [t, x], (t, x) => [g * (t - b * x), g * (x - b * t) - g * r0]];
          const S = [SA, SB], hand = [hA, hB], T = 3.4;
          for (let i = 0; i < 2; i++) {
            const s = S[i], m = M[i], pt = (t, x) => P(...m(t, x));
            s.clip(() => {
              s.line(-20, -20, 20, 20, { color: 'gold', alpha: 0.28, dash: [4, 4] }); s.line(-20, 20, 20, -20, { color: 'gold', alpha: 0.28, dash: [4, 4] });
              // the pole's worldstrip
              s.poly([pt(-T * 3, r0 - T * 3 * b), pt(T * 3, r0 + T * 3 * b), pt(T * 3, r0 + lc + T * 3 * b), pt(-T * 3, r0 + lc - T * 3 * b)], { fill: 'accent', fillAlpha: 0.2, stroke: false });
              s.path([pt(-T * 3, r0 - T * 3 * b), pt(T * 3, r0 + T * 3 * b)], { color: 'accent', width: 1.4 }); s.path([pt(-T * 3, r0 + lc - T * 3 * b), pt(T * 3, r0 + lc + T * 3 * b)], { color: 'accent', width: 1.4 });
              // the barn's walls and the closed doors
              for (const X of [0, Lb]) {
                s.path([pt(-T * 3, X), pt(T * 3, X)], { color: 'orange', width: 1.8, alpha: 0.7 });
                s.path([pt(-h, X), pt(h, X)], { color: 'red', width: 6 });
              }
            });
            for (const X of [0, Lb]) { const d = pt(0, X); s.dot(d[0], d[1], { r: 5, color: 'red' }); }
            const dA = pt(0, 0), dB = pt(0, Lb);
            s.text('door 1 closes', dA[0], dA[1], { dx: -8, dy: 12, align: 'right', size: 10.5, color: 'red' }); s.text('door 2 closes', dB[0], dB[1], { dx: 8, dy: -10, size: 10.5, color: 'red' });
            // snapshot on the gold line
            const now = hand[i].y;
            s.hline(now, { color: 'gold', width: 1.2, alpha: 0.8 });
            let pole, barn;
            if (i === 0) { pole = [r0 + b * now, r0 + b * now + lc]; barn = [0, Lb]; }
            else { pole = [0, Lp]; barn = [-b * now - g * r0, Lb / g - b * now - g * r0]; }
            s.segment([barn[0], now - 0.09], [barn[1], now - 0.09], { color: 'orange', width: 7 });
            s.segment([pole[0], now + 0.09], [pole[1], now + 0.09], { color: 'accent', width: 7 });
            s.dot(barn[0], now - 0.09, { r: 4, color: 'red' }); s.dot(barn[1], now - 0.09, { r: 4, color: 'red' });
          }
          // events in the pole frame
          const d1 = M[1](0, 0), d2 = M[1](0, Lb);
          const tEnter = (-g * r0) / b, tExit = (Lb / g - g * r0 - Lp) / b;
          st = { b, g, Lp, lc, fits, r0, d1, d2, tEnter, tExit, nowA: hA.y, nowB: hB.y };
        });
        v.legend([['accent', 'pole'], ['orange', 'barn walls'], ['red', 'doors shut'], ['gold', 'time of the snapshot', { dash: true }]]);
        v.readout(() => {
          const { b, g, Lp, lc, fits, d1, d2, tEnter, tExit } = st; if (!g) return '';
          return String.raw`$\gamma=${v.fix(g, 3)}$. **Barn frame:** pole length $L_p/\gamma=${v.fix(lc, 3)}$ against barn $L_b=1$ — ${fits ? 'it fits with room to spare, so both doors shut at $t=0$ with the pole inside' : '**too long**: it never fits, a door shut at that moment would strike it'}.` + '\n' +
            String.raw`**Pole frame:** barn length $L_b/\gamma=${v.fix(1 / g, 3)}$ against pole $L_p=${v.fix(Lp, 2)}$. The door events are now at $ct'=${v.fix(d2[0], 2)}$ (door 2) and $ct'=${v.fix(d1[0], 2)}$ (door 1): ${fits ? `door 2 shuts ${v.fix(d1[0] - d2[0], 2)} earlier, long before the pole's front end gets there, and the pole's front leaves (at $ct'=${v.fix(tExit, 2)}$) before the rear enters (at $ct'=${v.fix(tEnter, 2)}$)` : 'the order and spacing are different, but the pole overlaps a closed door'} — consistent with the barn frame.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.9
    {
      num: '2.9',
      kind: 'Phenomenon',
      name: 'Relativistic Doppler effect',
      statement: String.raw`A source of proper frequency $f_0$ moves with speed $v=\beta c$ relative to an observer. If $\theta$ is the angle, measured in the observer's frame at the moment of emission, between the source's velocity and the direction from the source to the observer, the received frequency is
$$f=\frac{f_0}{\gamma\,(1-\beta\cos\theta)}.$$
Head-on ($\theta=0$) this is $f_0\sqrt{(1+\beta)/(1-\beta)}$, directly away ($\theta=\pi$) it is $f_0\sqrt{(1-\beta)/(1+\beta)}$, and for light emitted at $\theta=\pi/2$ in the observer's frame it is $f_0/\gamma$, a pure time-dilation redshift with no classical counterpart. The relation holds for light and for any wave in vacuum.`,
      idea: String.raw`Crests are emitted at intervals $\gamma T_0$ of the observer's time (time dilation, rel-1.10), at points $\beta\gamma T_0$ apart along the path. The later crest has a different distance to travel, shorter by $\beta\gamma T_0\cos\theta$, so the arrival interval is $\gamma T_0(1-\beta\cos\theta)$. The classical Doppler shift for a moving source is the same expression without the $\gamma$; the whole relativistic correction is that one factor from time dilation. A moving observer gives the same formula in the observer's own angle, with no preferred medium.`,
      caption: String.raw`**Choose the speed and the direction of motion** relative to the line towards the observer $O$; the animation shows crests emitted at equal proper intervals by the moving source. The crests bunch up ahead of it. The readout measures the arrival times of two successive drawn crests at $O$ and compares the frequency with the formula; the right panel plots the formula against $\theta$ together with the classical (no time dilation) value.`,
      deps: ['rel-2.1', 'rel-1.10', 'waves-1.14'],
      refs: ['Taylor–Wheeler ch. L', 'Schutz §2.7'],
      tags: ['Doppler effect', 'redshift', 'waves'],
      scope: String.raw`Light in vacuum (any wave whose phase velocity is $c$ in vacuum). The angle $\theta$ is measured in the observer's frame at emission; an observer who receives the light perpendicular to the source's velocity sees $\gamma f_0$ instead.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Relativistic_Doppler_effect' },
      viz(v) {
        const bS = v.slider('$v/c$', 0, 0.95, 0.6, { step: 0.01 });
        const aS = v.slider('direction of motion $\\theta$ (°)', 0, 180, 40, { step: 1 });
        const A = v.stage({ x: [-6, 6], y: [-4, 4], equal: true, axes: false, height: 440, weight: 1.2, minWidth: 330, title: 'crests in the observer\'s frame ($c=1$)' });
        const B = v.stage({ x: [0, 180], y: [0, 5], axes: 'box', gutter: true, height: 440, weight: 0.8, minWidth: 270, xlabel: 'angle $\\theta$ (degrees)', ylabel: '$f/f_0$', title: 'received frequency against emission angle' });
        const S0 = [-4.5, 0], O = [4.5, 0], T0 = 0.5;
        let st = {};
        v.animate((tt) => {
          const b = bS.value, th = (aS.value * Math.PI) / 180, g = gam(b), te = g * T0;
          const dir = [Math.cos(th), Math.sin(th)], PRE = 4; tt += PRE;
          const pos = (t) => [S0[0] + b * (t - PRE) * dir[0], S0[1] + b * (t - PRE) * dir[1]];
          A.clip(() => {
            for (let k = 0; k * te <= tt; k++) {
              const tk = k * te, p = pos(tk), r = tt - tk;
              A.circle(p[0], p[1], r, { color: 'accent', width: 1.2, alpha: Math.max(0.15, 1 - r / 12) });
            }
          });
          A.path(Array.from({ length: 41 }, (_, i) => pos((tt * i) / 40 + 0)), { color: 'orange', width: 1.5, alpha: 0.6 });
          const p = pos(tt);
          A.arrow(p[0], p[1], p[0] + 1.2 * dir[0], p[1] + 1.2 * dir[1], { color: 'orange', width: 2.4, head: 9 });
          A.dot(p[0], p[1], { r: 6, color: 'orange', label: 'source', labelPos: 'sw' }); A.dot(O[0], O[1], { r: 6.5, color: 'green', label: 'O', labelPos: 'ne' });
          // measured frequency from two successive crests (k = 0, 1)
          const k0 = Math.floor(PRE / te);
          const arr = (k) => k * te + Math.hypot(O[0] - pos(k * te)[0], O[1] - pos(k * te)[1]);
          const meas = T0 / (arr(k0 + 1) - arr(k0));
          const pm = pos((k0 + 0.5) * te), n = [O[0] - pm[0], O[1] - pm[1]], nn = Math.hypot(n[0], n[1]);
          const cosT = (n[0] * dir[0] + n[1] * dir[1]) / nn, thetaEff = Math.acos(cosT);
          const pred = 1 / (g * (1 - b * cosT));
          st = { b, g, meas, pred, thetaEff, cosT };
          const cur = (b2) => 1 / (gam(b2) * (1 - b2 * Math.cos(th)));
          B.fn((x) => 1 / (g * (1 - b * Math.cos((x * Math.PI) / 180))), { color: 'accent', width: 2.2 });
          B.fn((x) => 1 / (1 - b * Math.cos((x * Math.PI) / 180)), { color: 'muted', width: 1.4, dash: true });
          B.hline(1, { color: 'faint', dash: true }); B.vline(90, { color: 'faint', dash: true });
          B.dot(90, 1 / g, { r: 5, color: 'red' }); B.text(`1/γ = ${v.fix(1 / g, 3)}`, 92, 1 / g, { dx: 6, dy: 14, size: 10.5, color: 'red' });
          const xe = (thetaEff * 180) / Math.PI;
          B.dot(xe, pred, { r: 6.5, color: 'green' });
          B.dot(0, Math.sqrt((1 + b) / (1 - b)), { r: 4.5, color: 'ink' });
        }, { period: 7, still: 3 });
        v.legend([['accent', 'relativistic'], ['muted', 'classical (no $\\gamma$)', { dash: true }], ['green', 'the drawn crests', { dot: true }], ['red', 'emitted at $90^\\circ$: $f_0/\\gamma$', { dot: true }]]);
        v.readout(() => {
          const { b, g, meas, pred, thetaEff } = st; if (!g) return '';
          return String.raw`$\beta=${v.fix(b, 2)}$, $\gamma=${v.fix(g, 3)}$. Angle between velocity and the direction to $O$ at emission: $\theta=${v.fix((thetaEff * 180) / Math.PI, 1)}^\circ$. Frequency from the arrival times of two successive crests: $f/f_0=${v.fix(meas, 4)}$; formula $1/\gamma(1-\beta\cos\theta)=${v.fix(pred, 4)}$. Head-on: $\sqrt{(1+\beta)/(1-\beta)}=${v.fix(Math.sqrt((1 + b) / (1 - b)), 3)}$; receding: $${v.fix(Math.sqrt((1 - b) / (1 + b)), 3)}$; sideways emission: $1/\gamma=${v.fix(1 / g, 3)}$.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.10
    {
      num: '2.10',
      kind: 'Phenomenon',
      name: 'Aberration of light and the headlight effect',
      credit: 'Bradley, 1728 (stellar aberration); Einstein, 1905 (relativistic law)',
      statement: String.raw`A light ray making angle $\theta$ with the direction of relative motion in frame $S$ makes angle $\theta'$ in a frame $S'$ moving at speed $\beta c$ along that direction, where
$$\cos\theta'=\frac{\cos\theta+\beta}{1+\beta\cos\theta}.$$
Directions are thrown forward, so an observer moving at speed $\beta c$ sees the stars crowd into a cone about the direction of travel; and a source that emits isotropically in its own frame beams into the forward direction when seen from the laboratory, half of its light falling inside the cone $\cos\theta=\beta$ whose half-angle is about $1/\gamma$ for $\beta\to1$ (the headlight effect). The law holds for all inertial frames and is the same transformation law as velocity addition applied to a ray of speed $c$.`,
      idea: String.raw`A photon has velocity $c(\cos\theta,\sin\theta)$ in $S$; the velocity-addition formulas of 2.4 give its components in $S'$, with the transverse component picking up the factor $1/\gamma(1+\beta\cos\theta)$, and the speed stays $c$. The longitudinal part $(\cos\theta+\beta)/(1+\beta\cos\theta)$ is exactly the composition of the rapidity of the frame and of the ray, so rays with $\theta$ near $\pi$ (from behind) are pushed through the equator into the forward hemisphere.`,
      caption: String.raw`Stars (or rays) are drawn on a disc whose centre is the direction of travel, radius = angle from that direction. **Raise $v/c$:** the right-hand sky is the left one pushed towards the centre, and the gold ring (the equator $\theta=90^\circ$) shrinks to the cone $\cos\theta'=\beta$. Switch to the *headlight* reading to see the isotropic lamp beam up in the laboratory.`,
      deps: ['rel-2.4'],
      refs: ['Taylor–Wheeler ch. L'],
      tags: ['aberration', 'headlight effect', 'relativistic beaming'],
      viz(v) {
        const bS = v.slider('$v/c$', 0, 0.99, 0.7, { step: 0.01 });
        const mode = v.select('picture', [{ value: 'sky', label: 'sky of a moving observer' }, { value: 'lamp', label: 'headlight of a moving lamp' }], 'sky');
        const mk = (title, w) => v.stage({ x: [-3.5, 3.5], y: [-3.5, 3.5], equal: true, axes: false, height: 400, weight: w, minWidth: 260, title });
        const A = mk('', 1), Bs = mk('', 1);
        const C = v.stage({ x: [0, 180], y: [0, 180], axes: 'box', gutter: true, height: 400, weight: 0.8, minWidth: 250, xlabel: 'angle before, $\\theta$ (°)', ylabel: 'angle after, $\\theta\'$ (°)', title: 'the aberration map' });
        const N = 520, pts = [];
        for (let i = 0; i < N; i++) { const z = 1 - (2 * (i + 0.5)) / N, ph = i * 2.399963229728653; pts.push([Math.acos(z), ph]); }
        let st = {};
        v.render(() => {
          const b = bS.value, g = gam(b), lamp = mode.value === 'lamp';
          const f = (th) => Math.acos(Math.max(-1, Math.min(1, (Math.cos(th) + b) / (1 + b * Math.cos(th)))));
          A.setTitle(lamp ? 'lamp frame: emitted equally in all directions' : 'rest frame: stars spread over the sky');
          Bs.setTitle(lamp ? `laboratory: lamp moving at $v/c=${v.fix(b, 2)}$` : `moving observer, $v/c=${v.fix(b, 2)}$`);
          const sc = 3.3 / Math.PI;
          for (const [S, map] of [[A, (th) => th], [Bs, f]]) {
            S.polarGrid({ rings: [Math.PI / 6 * sc, Math.PI / 3 * sc, Math.PI / 2 * sc, 2 * Math.PI / 3 * sc, 5 * Math.PI / 6 * sc, Math.PI * sc], spokes: 0, rmax: Math.PI * sc, angles: false, labels: false });
            S.circle(0, 0, Math.PI * sc, { color: 'muted', width: 1.2 });
            S.circle(0, 0, map(Math.PI / 2) * sc, { color: 'gold', width: 2.2 });
            for (const [th, ph] of pts) {
              const r = map(th) * sc;
              const t = th / Math.PI;
              S.dot(r * Math.cos(ph), r * Math.sin(ph), { r: 2.1, color: t < 0.5 ? 'accent' : 'orange' });
            }
            S.dot(0, 0, { r: 3, color: 'ink' });
            
          }
          C.line(0, 0, 180, 180, { color: 'faint', dash: true });
          C.fn((x) => (f((x * Math.PI) / 180) * 180) / Math.PI, { color: 'accent', width: 2.4 });
          C.dot(90, (f(Math.PI / 2) * 180) / Math.PI, { r: 6, color: 'gold' });
          C.hline((f(Math.PI / 2) * 180) / Math.PI, { color: 'faint', dash: true }); C.vline(90, { color: 'faint', dash: true });
          // fraction of stars in the forward hemisphere after the map
          let fw = 0; for (const [th] of pts) if (f(th) < Math.PI / 2) fw++;
          let cone = 0; for (const [th] of pts) if (f(th) < Math.acos(b)) cone++;
          st = { b, g, lamp, eq: (f(Math.PI / 2) * 180) / Math.PI, fw: fw / N, cone: cone / N };
        });
        v.legend([['accent', 'front hemisphere before'], ['orange', 'back hemisphere before'], ['gold', 'the equator $\\theta=90^\\circ$']]);
        v.readout(() => {
          const { b, g, lamp, eq, fw, cone } = st; if (!g) return '';
          return String.raw`$\beta=${v.fix(b, 2)}$, $\gamma=${v.fix(g, 2)}$. The equator ($\theta=90^\circ$) goes to $\theta'=\arccos\beta=${v.fix(eq, 1)}^\circ$ (compare $1/\gamma=${v.fix((180 / Math.PI) / g, 1)}^\circ$ for $\beta\to1$). ` + (lamp ? String.raw`Fraction of the lamp's rays within $\arccos\beta$ of the forward direction (the lab's $90^\circ$ beam): ${v.fix(cone * 100, 0)}% of the sample (expected 50%); in the lamp frame they all lie within $90^\circ$.` : String.raw`Fraction of the sky now in the forward hemisphere: ${v.fix(fw * 100, 0)}% (expected $(1+\beta)/2=${v.fix((1 + b) * 50, 0)}$%).`);
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.11
    {
      num: '2.11',
      kind: 'Phenomenon',
      name: 'Terrell–Penrose rotation',
      credit: 'Penrose, 1959; Terrell, 1959',
      statement: String.raw`A photograph of a fast-moving object is not a snapshot of its Lorentz-contracted shape: light from different points of the object left at different times, from different positions. For an object of small angular size, all rays reaching the camera nearly parallel, the effects of length contraction and of light-travel time combine so that the image is exactly that of the object at rest, **rotated** through the angle $\arcsin\beta$ about the axis perpendicular to both the motion and the line of sight. A moving sphere therefore still photographs as a perfect circle, and a moving cube shows its trailing face with widths $1/\gamma$ for the face towards the camera and $\beta$ for the side face.`,
      idea: String.raw`Points at greater distance from the camera emitted earlier, and by then (in the camera frame) the object was displaced backwards by $\beta c\,\Delta t$. For parallel rays this displacement exactly undoes the contraction of the depth direction in a way that looks like a rotation: the face's width in the image is $1/\gamma=\cos\varphi$ while the side face, normally invisible, appears with width $\beta=\sin\varphi$, where $\sin\varphi=\beta$. The calculation here solves $t+|{\bf P}(t)-{\bf C}|=0$ for each corner and projects it.`,
      caption: String.raw`A cube moving to the right past a pinhole camera; the picture is built honestly by finding, for every corner, the moment its light left so that it reaches the camera at $t=0$. **Raise $v/c$:** the cube turns, showing a side face, while the contracted *snapshot* (dashed) would show nothing of the sort. **Move the camera back** (distance $D$) so that the rays become parallel and the widths of the faces approach $1/\gamma$ and $\beta$. The right panel looks down on the scene: the dashed square is the contracted cube, the blue one marks where the light actually left from (the cube is placed so that its centre's light leaves from $X_0$), and the red arrows show the difference at each corner.`,
      deps: ['rel-2.10', 'rel-1.11'],
      refs: ['Taylor–Wheeler ch. L'],
      tags: ['Terrell rotation', 'length contraction', 'imaging'],
      scope: String.raw`Rigid inertial motion, a pinhole camera, objects small compared with the camera distance (for the exact rotation); at close range the image is still computed exactly but is not a pure rotation.`,
      viz(v) {
        const bS = v.slider('$v/c$', 0, 0.98, 0.8, { step: 0.01 });
        const dS = v.slider('camera distance $D$', 3, 60, 30, { step: 1, log: true });
        const xS = v.slider('cube position $X_0$ at the photo', -2.5, 2.5, 0, { step: 0.05 });
        const what = v.select('show', [{ value: 'cam', label: 'camera image' }, { value: 'both', label: 'image and snapshot' }, { value: 'snap', label: 'snapshot only' }], 'both');
        const A = v.stage({ x: [-3.2, 3.2], y: [-1.5, 1.5], equal: true, axes: false, height: 400, weight: 1.25, minWidth: 330, title: 'the photograph' });
        const Bv = v.stage({ x: [-2.8, 2.8], y: [-1.7, 1.7], equal: true, axes: false, height: 400, weight: 0.9, minWidth: 280, title: 'seen from above (camera far below)' });
        const faces = [];
        for (const ax of [0, 1, 2]) for (const sg of [-1, 1]) {
          const o = [0, 1, 2].filter((i) => i !== ax), cs = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, c]) => { const p = [0, 0, 0]; p[ax] = sg; p[o[0]] = a; p[o[1]] = c; return p; });
          const e1 = cs[1].map((x, i) => x - cs[0][i]), e2 = cs[2].map((x, i) => x - cs[1][i]);
          const nrm = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
          if (nrm[ax] * sg > 0) cs.reverse();
          faces.push({ ax, sg, cs });
        }
        const FACE_COL = { '0,1': 'green', '0,-1': 'orange', '1,1': 'purple', '1,-1': 'muted', '2,-1': 'accent', '2,1': 'faint' };
        let st = {};
        v.render(() => {
          const b = bS.value, g = gam(b), D = dS.value, X0 = xS.value;
          // lab position at emission and the image of a corner (sx, sy, sz) of a unit cube
          const emit = (sx, sy, sz, t0) => {
            const a = sx * 0.5 / g, y = sy * 0.5, z = sz * 0.5;
            if (t0 !== undefined) return { x: X0 + a, y, z, t: 0 };
            const w = X0 + b * Math.sqrt(X0 * X0 + D * D) + a;
            const R2 = w * w + y * y + (z + D) ** 2;
            const te = (b * w - Math.sqrt(b * b * w * w + (1 - b * b) * R2)) / (1 - b * b);
            return { x: w + b * te, y, z, t: te };
          };
          const proj = (e) => [(D * e.x) / (e.z + D), (D * e.y) / (e.z + D)];
          const draw = (S, snap, camAlpha) => {
            const info = [];
            for (const F of faces) {
              const q = F.cs.map((c) => proj(snap ? emit(c[0], c[1], c[2], 0) : emit(c[0], c[1], c[2])));
              const area = q.reduce((s, p, i) => { const r = q[(i + 1) % 4]; return s + p[0] * r[1] - r[0] * p[1]; }, 0);
              if (area <= 0) continue;
              const key = F.ax + ',' + F.sg;
              S.poly(q, snap ? { fill: false, color: 'ink', width: 1.4, dash: [5, 4], alpha: 0.75 } : { fill: FACE_COL[key], fillAlpha: 0.38, color: 'ink', width: 1.8 });
              info.push({ key, w: Math.max(...q.map((p) => p[0])) - Math.min(...q.map((p) => p[0])) });
            }
            return info;
          };
          let info = [];
          if (what.value !== 'snap') info = draw(A, false);
          if (what.value !== 'cam') draw(A, true);
          if (b > 0 && what.value !== 'snap') { // rest cube ghost
            const q = [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]].map(([x, y]) => [x + X0, y]);
            A.poly(q, { fill: false, color: 'muted', width: 1, dash: [1, 4], alpha: 0.6 });
          }
          // top view: footprints at emission and at the photograph
          const fp = (snap) => [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz]) => { const e = emit(sx, 0, sz, snap ? 0 : undefined); return [e.x, e.z]; });
          const snapFp = fp(true), emFp = fp(false);
          Bv.poly(snapFp, { fill: false, color: 'ink', width: 1.4, dash: [5, 4] });
          Bv.poly(emFp, { fill: 'accent', fillAlpha: 0.15, color: 'accent', width: 1.6 });
          for (let i = 0; i < 4; i++) { Bv.arrow(snapFp[i][0], snapFp[i][1], emFp[i][0], emFp[i][1], { color: 'red', width: 1.4, head: 6, alpha: 0.9 }); }
          for (const c of emFp) { Bv.line(c[0], c[1], c[0], c[1] - 1.4, { color: 'gold', width: 1, alpha: 0.5, dash: [2, 3] }); }
          Bv.arrow(0, -1.45, 0, -1.65, { color: 'gold', width: 2, head: 7 }); Bv.text('to the camera', 0.1, -1.55, { size: 10.5, color: 'gold', dx: 8 });
          Bv.text('motion →', 2.7, 1.5, { align: 'right', size: 11, color: 'ink' });
          const front = info.find((k) => k.key === '2,-1'), lead = info.find((k) => k.key === '0,1'), trail = info.find((k) => k.key === '0,-1');
          st = { b, g, front: front && front.w, side: (lead && lead.w) || (trail && trail.w) || 0, which: lead ? 'leading' : trail ? 'trailing' : 'no' };
        });
        v.legend([['accent', 'where the light left from'], ['ink', 'contracted snapshot', { dash: true }], ['red', 'shift of each corner from the contracted shape']]);
        v.readout(() => {
          const { b, g, front, side, which } = st; if (!g) return '';
          const phi = (Math.asin(b) * 180) / Math.PI;
          return String.raw`$\beta=${v.fix(b, 2)}$: apparent rotation $\arcsin\beta=${v.fix(phi, 1)}^\circ$. Image widths: face towards the camera ${front === undefined ? '—' : v.fix(front, 3)} (far-camera prediction $1/\gamma=${v.fix(1 / g, 3)}$), ${which} side face ${v.fix(side, 3)} (prediction $\beta=${v.fix(b, 3)}$). The snapshot shows only the front face, shortened to $1/\gamma$, and no side face.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.12
    {
      num: '2.12',
      kind: 'Paradox',
      name: 'Faster-than-light signals violate causality',
      statement: String.raw`Suppose signals could travel at speed $u>c$ in every inertial frame. Then there are two observers, moving relative to each other at speed $\beta c$ with $\beta<1$, who can arrange a message and its reply so that the reply arrives at the original sender **before** the message was sent. Specifically, if the sender at $x=0$ sends a message of speed $u$ to a receiver who moves at $\beta c$, and the receiver immediately answers with a signal of speed $u$ in his own frame, then the reply returns before the original emission exactly when $\beta\,(u/c+c/u)>2$, i.e. $\beta>\beta_c=\dfrac{2u/c}{1+u^2/c^2}$. For any $u>c$ the critical $\beta_c$ is below $1$, so a suitable moving station always exists; as $u\to\infty$, $\beta_c\to0$.`,
      idea: String.raw`The order of two events is frame-independent only when they are timelike separated (rel-1.8): for a spacelike pair a boost can reverse it (2.1). A superluminal signal connects spacelike separated events, so in some inertial frame it goes backwards in time. Each leg is harmless on its own; chaining the message with a reply sent in another frame, which uses a differently tilted line of simultaneity, closes a loop in time, and a reply could prevent the message that provoked it.`,
      caption: String.raw`**Drag the receiver's event** $A$ and change the signal speed $u$ and the station's speed $\beta$. Left: sender (black), message (blue), the station (orange) and its reply (red when it arrives before the emission, green otherwise). Middle: the same events in the station's frame, where the reply is *forward* in time but the message runs backwards. Right: the arrival time $t_B$ of the reply as a function of $\beta$, which crosses zero at $\beta_c$.`,
      deps: ['rel-2.1', 'rel-1.8'],
      refs: ['Taylor–Wheeler §4.3', 'Taylor–Wheeler §6.1'],
      tags: ['causality', 'tachyonic signalling', 'spacelike separation'],
      viz(v) {
        const uS = v.slider('signal speed $u/c$', 1.05, 30, 3, { log: true, sig: 3 });
        const bS = v.slider('station speed $\\beta$', 0, 0.99, 0.75, { step: 0.01 });
        const A = v.stage({ x: [-1.2, 3.8], y: [-3.2, 3.2], equal: true, axes: false, height: 440, weight: 1, minWidth: 300, title: 'frame of the sender' });
        const Bst = v.stage({ x: [-3.0, 4.2], y: [-3.2, 3.2], equal: true, axes: false, height: 440, weight: 1, minWidth: 300, title: 'frame of the station' });
        const C = v.stage({ x: [0, 1], y: [-2, 2], axes: 'box', gutter: true, height: 440, weight: 0.75, minWidth: 250, xlabel: 'station speed $\\beta$', ylabel: 'reply arrival time $ct_B$', title: 'arrival time of the reply' });
        const H = A.handle(1.5, 0.5, { color: 'purple', label: 'A', labelPos: 'ne', constrain: (x) => { const xx = Math.max(0.6, Math.min(3, x)); return [xx, xx / uS.value]; } });
        const tB = (u, b, xA) => {
          const tA = xA / u, [tp, xp] = toMoving(b, tA, xA), g = gam(b), s = (xp + b * tp) / (u - b);
          return g * (tp + s + b * (xp - u * s));
        };
        let st = {};
        v.render(() => {
          const u = uS.value, b = bS.value, xA = H.x;
          H.set(xA, xA / u);
          const tA = xA / u, tb = tB(u, b, xA), loop = tb < 0;
          const bc = (2 * u) / (1 + u * u);
          const Ev = { O: [0, 0], A: [tA, xA], B: [tb, 0] };
          const [tp, xp] = toMoving(b, tA, xA), g = gam(b);
          // panels: map (t, x) → plot
          for (const [S, m] of [[A, (t, x) => [t, x]], [Bst, (t, x) => toMoving(b, t, x)]]) {
            const pt = (e) => P(...m(...e));
            S.clip(() => {
              S.line(-30, -30, 30, 30, { color: 'gold', alpha: 0.35, dash: [4, 4] }); S.line(-30, 30, 30, -30, { color: 'gold', alpha: 0.35, dash: [4, 4] });
              S.path([[-5, 0], [5, 0]].map(pt), { color: 'ink', width: 2.2 });
              S.path([[-5, xA + b * (-5 - tA)], [5, xA + b * (5 - tA)]].map(pt), { color: 'orange', width: 2.2 });
              if (loop) S.poly([pt(Ev.O), pt(Ev.A), pt(Ev.B)], { fill: 'red', fillAlpha: 0.12, stroke: false });
              S.path([pt(Ev.O), pt(Ev.A)], { color: 'accent', width: 3 }); S.path([pt(Ev.A), pt(Ev.B)], { color: loop ? 'red' : 'green', width: 3 });
            });
            for (const [k, c] of [['O', 'ink'], ['A', 'purple'], ['B', loop ? 'red' : 'green']]) { const p = pt(Ev[k]); S.dot(p[0], p[1], { r: 5.5, color: c, label: k, labelPos: k === 'B' ? 'sw' : k === 'O' ? 'se' : 'ne' }); }
          }
          C.hline(0, { color: 'muted', dash: true });
          C.fn((bb) => Math.max(-2, Math.min(2, tB(u, bb, xA))), { color: 'accent', width: 2.2, domain: [0, 0.99] });
          C.vline(bc, { color: 'gold', dash: true }); C.text('$\\beta_c$', bc, 1.85, { color: 'gold', dx: 6, size: 12 });
          C.dot(b, Math.max(-2, Math.min(2, tb)), { r: 6.5, color: loop ? 'red' : 'green' });
          st = { u, b, bc, tb, tA, loop, tp, xp };
        });
        v.legend([['ink', '$O$ message sent; $A$ received and reply sent; $B$ reply arrives', { dot: true }], ['accent', 'message'], ['orange', 'station'], ['green', 'reply (before: red)'], ['gold', 'light', { dash: true }]]);
        v.readout(() => {
          const { u, b, bc, tb, tA, loop, tp, xp } = st; if (!u) return '';
          return String.raw`Message speed $u=${v.fix(u, 2)}c$ (arrives at $ct_A=${v.fix(tA, 3)}$ in the sender's frame; in the station's frame the same message leaves at $ct'=0$ and arrives at $ct'_A=${v.fix(tp, 3)}$, i.e. ${tp < 0 ? 'before its own emission' : 'after the emission'}). Station speed $\beta=${v.fix(b, 2)}$: the reply gets back at $ct_B=${v.fix(tb, 3)}$ — ${loop ? '**before the message was sent**' : 'after the message was sent, no loop'}. Threshold $\beta_c=2u/(1+u^2)=${v.fix(bc, 3)}$ (here $\beta\,(u+1/u)=${v.fix(b * (u + 1 / u), 3)}$ against 2).`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.13
    {
      num: '2.13',
      kind: 'Definition',
      name: 'Lorentz and Poincaré groups',
      statement: String.raw`The **Lorentz group** $O(1,3)$ is the set of real $4\times4$ matrices $\Lambda$ with $\Lambda^{\mathsf T}\eta\Lambda=\eta$, $\eta=\operatorname{diag}(1,-1,-1,-1)$, i.e. the linear maps that preserve the interval. They have $\det\Lambda=\pm1$ and $\Lambda^0{}_0\ge1$ or $\le-1$; the connected component of the identity, the **proper orthochronous** group $SO^+(1,3)$, is generated by the three rotations and the three boosts, and every element is a rotation times a boost. The **Poincaré group** adds translations: $x\mapsto\Lambda x+a$ with $a\in\R^4$, the full group of symmetries of Minkowski spacetime that preserve the interval of every pair of events.`,
      idea: String.raw`Preserving the quadratic form $t^2-\mathbf x^2$ means $\Lambda^{\mathsf T}\eta\Lambda=\eta$, the matrix equation which in a boost along $x$ reduces to $\cosh^2\varphi-\sinh^2\varphi=1$ (2.3). Counting the free parameters in a solution gives six: three rotation angles and three boost rapidities. The set is closed under multiplication and inverse (so it is a group), but it is not abelian: boosts in different directions do not commute and their composition contains a rotation (2.14). Translations commute with each other and combine with $\Lambda$ into the ten-parameter Poincaré group.`,
      caption: String.raw`**Build** $\Lambda=R_x(\psi)\,R_z(\theta)\,B(\varphi,\alpha)$ from a boost of rapidity $\varphi$ in the direction $\alpha$ of the $xy$-plane and two rotations. The matrix updates live and $\Lambda^{\mathsf T}\eta\Lambda-\eta$ stays at rounding level. The panels show where six chosen events go, with the invariant light cone untouched; switch on the **translation** to get a Poincaré map, which moves the events but not the intervals between them. *Multiply into product* accumulates a product of such transformations, which is again a Lorentz matrix.`,
      deps: ['rel-2.1', 'ladr-9.9', 'alg-3.30'],
      refs: ['Carroll ch. 1'],
      tags: ['Lorentz group', 'Poincaré group', 'symmetry'],
      viz(v) {
        const phi = v.slider('boost rapidity $\\varphi$', 0, 2, 0.8, { step: 0.01 });
        const al = v.slider('boost direction $\\alpha$ (°)', -180, 180, 30, { step: 1 });
        const th = v.slider('rotation about $z$: $\\theta$ (°)', -180, 180, 25, { step: 1 });
        const ps = v.slider('rotation about $x$: $\\psi$ (°)', -90, 90, 0, { step: 1 });
        const tra = v.toggle('add a translation (Poincaré)', false);
        const A = v.stage({ x: [-4, 4], y: [-3, 4.4], equal: true, axes: false, height: 420, weight: 1, minWidth: 290, title: '$(x, ct)$ projection' });
        const B = v.stage({ x: [-4, 4], y: [-4, 4], equal: true, axes: false, height: 420, weight: 1, minWidth: 290, title: '$(x, y)$ projection' });
        let prod = I4(), nprod = 0;
        v.button('Multiply into product', () => { prod = mm(curL(), prod); nprod++; });
        v.button('Reset product', () => { prod = I4(); nprod = 0; });
        const curL = () => { const a = (al.value * Math.PI) / 180; return mm(rot4('x', (ps.value * Math.PI) / 180), mm(rot4('z', (th.value * Math.PI) / 180), boost4(Math.tanh(phi.value) * Math.cos(a), Math.tanh(phi.value) * Math.sin(a), 0))); };
        const EV = [[0.4, 1.2, 0.2, 0], [1.5, 0.3, -0.5, 0.3], [-0.5, -1.1, 0.8, 0], [2.0, -0.6, -0.7, 0.2], [-1.3, 0.8, -1.0, -0.4], [0.9, -1.6, 0.5, 0]];
        const interval = (a, b) => { const d = a.map((x, i) => x - b[i]); return d[0] ** 2 - d[1] ** 2 - d[2] ** 2 - d[3] ** 2; };
        let st = {};
        v.render(() => {
          const L = curL(), a4 = tra.value ? [0.6, 0.9, -0.5, 0] : [0, 0, 0, 0];
          const img = EV.map((e) => mv(L, e).map((x, i) => x + a4[i]));
          let dI = 0; for (let i = 0; i < EV.length; i++) for (let j = i + 1; j < EV.length; j++) dI = Math.max(dI, Math.abs(interval(EV[i], EV[j]) - interval(img[i], img[j])));
          for (const [S, ix, iy] of [[A, 1, 0], [B, 1, 2]]) {
            S.line(-4, 0, 4, 0, { color: 'faint' }); S.line(0, -4, 0, 4.4, { color: 'faint' });
            if (ix === 1 && iy === 0) lightLines(S, 8);
            else S.circle(0, 0, 1, { color: 'gold', alpha: 0.5, dash: true });
            // basis vectors of the new frame (images of e_t, e_x, e_y)
            const cols = [[0, 'accent'], [1, 'orange'], [2, 'green']];
            for (const [c, col] of cols) { const e = L.map((r) => r[c]); S.arrow(a4[ix], a4[iy], a4[ix] + e[ix], a4[iy] + e[iy], { color: col, width: 2.2, head: 7 }); }
            for (let i = 0; i < EV.length; i++) {
              S.dot(EV[i][ix], EV[i][iy], { r: 4, color: 'muted', hollow: true });
              S.dot(img[i][ix], img[i][iy], { r: 5, color: 'purple', label: String(i + 1), labelPos: 'ne' });
              S.segment([EV[i][ix], EV[i][iy]], [img[i][ix], img[i][iy]], { color: 'purple', alpha: 0.3, dash: true });
            }
            if (a4[0] || a4[1]) S.dot(a4[ix], a4[iy], { r: 4, color: 'ink', label: 'a', labelPos: 'sw' });
          }
          st = { L, dI, defect: lorentzDefect(L), det: det4(L), pd: lorentzDefect(prod), pdet: det4(prod), g: L[0][0] };
          // swap ix/iy: the (x, t) panel plots x across and t up
        });
        v.legend([['accent', 'image of $e_t$'], ['orange', 'image of $e_x$'], ['green', 'image of $e_y$'], ['muted', 'event', { dot: true }], ['purple', 'image of the event', { dot: true }]]);
        v.readout(() => {
          const { L, dI, defect, det, pd, pdet, g } = st; if (!L) return '';
          return String.raw`$$\Lambda=${pmatrix(L, v.fix, 3)}$$` + String.raw`$\Lambda^{\mathsf T}\eta\Lambda-\eta$: largest entry $${v.sci(defect, 2)}$; $\det\Lambda=${v.fix(det, 6)}$; $\Lambda^0{}_0=\gamma=${v.fix(g, 3)}\ge1$. Largest change in an interval between two of the six events: $${v.sci(dI, 2)}$${tra.value ? ' (translation included)' : ''}. Product of ${nprod} saved transformations: defect $${v.sci(pd, 2)}$, $\det=${v.fix(pdet, 6)}$.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 2.14
    {
      num: '2.14',
      kind: 'Phenomenon',
      name: 'Thomas–Wigner rotation',
      credit: 'Thomas, 1926; Wigner, 1939',
      statement: String.raw`Two boosts in different directions do not compose to a pure boost. If frame $S'$ moves with velocity $\mathbf w_1$ relative to $S$ and $S''$ moves with velocity $\mathbf w_2$ relative to $S'$ (axes of each frame carried without rotation), then $S''$ moves relative to $S$ with some velocity $\mathbf u$, and its axes are rotated, relative to those obtained from $S$ by the single pure boost $\mathbf u$, through the **Wigner rotation angle** $\epsilon$. In terms of the angle $\alpha$ between $\mathbf w_1$ and $\mathbf w_2$,
$$\tan\frac\epsilon2=\frac{\sin\alpha}{k+\cos\alpha},\qquad k=\sqrt{\frac{(\gamma_1+1)(\gamma_2+1)}{(\gamma_1-1)(\gamma_2-1)}}.$$
For perpendicular boosts $\cos\epsilon=\dfrac{(1+\gamma_1+\gamma_2+\gamma_1\gamma_2)^2}{(1+\gamma_1)(1+\gamma_2)(1+\gamma_1\gamma_2)}-1$. It vanishes for collinear boosts and for small speeds; a gyroscope taken around a closed loop in velocity space is turned by an angle proportional to the enclosed hyperbolic area (the origin of Thomas precession).`,
      idea: String.raw`Boosts along one axis form a one-parameter subgroup, but boosts along different axes generate rotations: the commutator of two boosts in the Lie algebra of the Lorentz group (2.13) is a rotation generator. Hence $B(\mathbf w_1)B(\mathbf w_2)=B(\mathbf u)R$ with $R$ a rotation — the polar decomposition of the product. The velocity space of all boosts is a hyperbolic geometry, so a loop of boosts leaves the transported frame rotated by its area defect, just as parallel transport around a loop on a sphere rotates a vector.`,
      caption: String.raw`Left: choose two boosts (speeds and the angle between them); the product matrix is decomposed into a pure boost and a rotation, and the rotation of the carried axes is drawn against their original orientation. Right: **drag the three velocities** of a loop $0\to v_1\to v_2\to v_3\to0$ in velocity space (the disc is $|\mathbf v|<c$); each step is a pure boost of the current frame, and the gyroscope arrow at each corner shows its accumulated orientation. The final arrow is turned though the frame is back at rest.`,
      deps: ['rel-2.13', 'rel-2.4', 'ladr-7.93'],
      refs: ['Taylor–Wheeler ch. L'],
      tags: ['Wigner rotation', 'Thomas precession', 'boost composition'],
      viz(v) {
        const b1 = v.slider('first boost $\\beta_1$ (along $x$)', 0.05, 0.97, 0.6, { step: 0.01 });
        const b2 = v.slider('second boost $\\beta_2$', 0.05, 0.97, 0.7, { step: 0.01 });
        const aS = v.slider('angle $\\alpha$ between them (°)', 0, 180, 90, { step: 1 });
        const A = v.stage({ x: [-1.6, 1.6], y: [-1.6, 1.6], equal: true, axes: false, height: 400, weight: 1, minWidth: 290, title: 'the carried axes after two boosts' });
        const B = v.stage({ x: [-1.25, 1.25], y: [-1.25, 1.25], equal: true, axes: false, height: 400, weight: 1.1, minWidth: 300, title: 'a loop in velocity space ($|\\mathbf v|<c$)' });
        const W = [B.handle(0.5, 0.0, { color: 'accent', label: '$v_1$', labelPos: 'e' }), B.handle(0.55, 0.55, { color: 'accent', label: '$v_2$', labelPos: 'ne' }), B.handle(-0.1, 0.65, { color: 'accent', label: '$v_3$', labelPos: 'n' })];
        for (const h of W) h.onDrag = () => { const r = Math.hypot(h.x, h.y); if (r > 0.97) h.set((h.x / r) * 0.97, (h.y / r) * 0.97); };
        const inv = (L) => mm(ETA, mm(tr(L), ETA));
        const rotAngle = (L) => { // pure rotation part of a Lorentz matrix: Λ = B R
          const g = L[0][0], u = [L[1][0] / g, L[2][0] / g, L[3][0] / g];
          const R = mm(boost4(-u[0], -u[1], -u[2]), L);
          return Math.atan2(R[2][1], R[1][1]);
        };
        let st = {};
        v.render(() => {
          const be1 = b1.value, be2 = b2.value, al = (aS.value * Math.PI) / 180;
          const g1 = gam(be1), g2 = gam(be2);
          const L = mm(boost4(be1, 0, 0), boost4(be2 * Math.cos(al), be2 * Math.sin(al), 0));
          const gg = L[0][0], u = [L[1][0] / gg, L[2][0] / gg], eps = rotAngle(L);
          const kk = Math.sqrt(((g1 + 1) * (g2 + 1)) / ((g1 - 1) * (g2 - 1)));
          const epsF = -2 * Math.atan2(Math.sin(al), kk + Math.cos(al)); // sign: turning clockwise when the second boost is counter-clockwise from the first
          // axes
          const c = Math.cos(eps), s = Math.sin(eps);
          A.circle(0, 0, 1, { color: 'faint', width: 1 });
          A.arrow(0, 0, 1, 0, { color: 'muted', width: 1.6, head: 7 }); A.arrow(0, 0, 0, 1, { color: 'muted', width: 1.6, head: 7 });
          A.text('$x$', 1.1, 0, { color: 'muted' }); A.text('$y$', 0, 1.12, { color: 'muted' });
          A.arrow(0, 0, c, s, { color: 'red', width: 2.6, head: 8 }); A.arrow(0, 0, -s, c, { color: 'orange', width: 2.6, head: 8 });
          A.text("$x''$", 1.1 * c, 1.1 * s, { color: 'red' }); A.text("$y''$", -1.12 * s, 1.12 * c, { color: 'orange' });
          A.curve((t) => [0.55 * Math.cos(t * eps), 0.55 * Math.sin(t * eps)], 0, 1, { color: 'gold', width: 2.4 });
          A.text(`ε = ${v.fix((eps * 180) / Math.PI, 2)}°`, 0.15, -0.35, { size: 12, color: 'gold', align: 'left' });
          // velocity loop
          B.circle(0, 0, 1, { color: 'ink', width: 1.4 }); B.text('$c$', 0.72, 0.78, { color: 'muted' });
          const pts = [[0, 0], ...W.map((h) => [h.x, h.y]), [0, 0]];
          B.path(pts, { color: 'muted', width: 1.6, dash: [5, 4] });
          let Lk = I4(); const angs = [0];
          for (let k = 1; k < pts.length; k++) {
            const [vx, vy] = pts[k], gk = 1 / Math.sqrt(1 - vx * vx - vy * vy);
            const w4 = mv(inv(Lk), [gk, gk * vx, gk * vy, 0]);
            Lk = mm(Lk, boost4(w4[1] / w4[0], w4[2] / w4[0], 0));
            const R = mm(boost4(-vx, -vy, 0), Lk);
            angs.push(Math.atan2(R[2][1], R[1][1]));
          }
          for (let k = 0; k < 4; k++) {
            const [vx, vy] = pts[k], a = angs[k];
            B.arrow(vx, vy, vx + 0.2 * Math.cos(a), vy + 0.2 * Math.sin(a), { color: k === 0 ? 'ink' : 'green', width: 2.4, head: 6 });
          }
          const net = angs[4];
          B.arrow(0, 0, 0.26 * Math.cos(net), 0.26 * Math.sin(net), { color: 'red', width: 3, head: 8 });
          B.text(`net turn ${v.fix((net * 180) / Math.PI, 2)}°`, 0, -0.18, { size: 11.5, color: 'red', align: 'center' });
          st = { eps, epsF, u, gg, g1, g2, net, defect: lorentzDefect(L) };
        });
        v.legend([['red', 'carried $x$-axis of $S\'\'$ ($=$ turn)'], ['orange', 'carried $y$-axis'], ['green', 'gyroscope at each corner'], ['ink', 'gyroscope at the start']]);
        v.readout(() => {
          const { eps, epsF, u, gg, g1, g2, net } = st; if (!gg) return '';
          return String.raw`$\gamma_1=${v.fix(g1, 3)}$, $\gamma_2=${v.fix(g2, 3)}$; the composite moves at $\mathbf u=(${v.fix(u[0], 3)},${v.fix(u[1], 3)})c$, $\gamma=${v.fix(gg, 3)}$. Wigner rotation from the matrix product: $\epsilon=${v.fix((eps * 180) / Math.PI, 3)}^\circ$; from the formula: $${v.fix((epsF * 180) / Math.PI, 3)}^\circ$. Right: after the loop of three boosts and the return to rest the gyroscope is turned by $${v.fix((net * 180) / Math.PI, 3)}^\circ$ — with no rotation ever applied.`;
        });
      },
    },
  ],
};
