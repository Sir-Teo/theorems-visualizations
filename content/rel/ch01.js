// Special & General Relativity — Chapter 1: Spacetime and the two postulates (items 1.1–1.6; 1.7–1.12 in ch01-b.js)
// Landmark papers 1.13 and 1.14 live in ch01-papers.js and ch01-p.js.
//
// Facts checked while writing (Oct 2026): Galileo's cabin passage, Dialogue Concerning the Two Chief World Systems (1632);
// Minkowski's lecture "Raum und Zeit", Cologne, September 1908 (printed 1909) — origin of "world-line";
// de Sitter 1913 (double stars; extinction-theorem caveat; Brecher 1977); Alväger et al., Phys. Lett. 12 (1964) 260–262;
// Poincaré's 1900 reading of Lorentz's local time as the reading of clocks set by light signals (secondary sources only).
import { gam, P, lightLines } from './ch01.shared.js';

export default {
  collection: 'rel',
  chapter: 1,
  title: 'Spacetime and the two postulates',
  summary: String.raw`Two short assumptions — the laws of physics are the same in every inertial frame, and light travels at the same speed in all of them — are enough to overturn absolute time. Synchronizing clocks with light signals shows that simultaneity depends on the observer, yet one combination of time and distance, the spacetime interval, is shared by everyone. Proper time, time dilation and length contraction follow, and cosmic-ray muons show them happening in nature.`,
  items: [
    // ───────────────────────────────────────────────────────────── 1.1
    {
      num: '1.1',
      kind: 'Definition',
      name: 'Events, worldlines and spacetime diagrams',
      credit: 'Minkowski, 1908 (the term “world-line”)',
      statement: String.raw`An **event** is an idealized point of spacetime: a place and an instant, labelled in an inertial frame by $(ct,x,y,z)$. A **worldline** is the set of events a particle passes through. In a **spacetime diagram** (one space dimension $x$ across, $ct$ upward) a particle at rest is a vertical line, a particle moving uniformly is a straight line whose angle with the vertical has tangent $v/c$, and light is the pair of $45^\circ$ lines $x=\pm ct$. A particle with mass has $|v|<c$ everywhere, so its worldline is steeper than $45^\circ$ at every event.`,
      idea: String.raw`Plotting position against time (mech-1.1) turns a motion into a curve, and measuring time in units of $c$ puts both axes in the same unit, so the speed of light becomes the fixed slope $1$. Everything a later chapter does with events (simultaneity, intervals, cones) is geometry on this diagram, and the slope bound $|dx/d(ct)|<1$ is the picture of "nothing overtakes light".`,
      caption: String.raw`**Drag the green start handle** along the axis, move the **speed** slider and choose uniform or oscillating motion. The upper strip is the track at the chosen time; the diagram below records the whole history of the same particle. Push the speed above $1$ and the worldline turns red where it is flatter than the light lines: no massive particle can do that.`,
      deps: ['mech-1.1'],
      refs: ['Taylor–Wheeler ch. 1', 'Schutz §1.4'],
      tags: ['spacetime diagram', 'worldline', 'event'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/World_line' },
      viz(v) {
        const kind = v.select('motion', [{ value: 'uni', label: 'uniform' }, { value: 'osc', label: 'oscillating' }], 'uni');
        const bS = v.slider('speed $v/c$ (peak speed if oscillating)', 0, 1.4, 0.45, { step: 0.01 });
        const Tn = v.slider('now: $ct$', 0.2, 8, 5, { step: 0.05 });
        const A = v.stage({ x: [-4, 4], y: [-1, 1], height: 170, full: true, axes: false, title: 'the track at the chosen time' });
        const D = v.stage({ x: [-4, 4], y: [0, 8], height: 420, full: true, axes: 'box', gutter: true, xlabel: '$x$', ylabel: '$ct$', title: 'spacetime diagram' });
        const S0 = D.handle(-1, 0, { color: 'green', label: 'start', labelPos: 'se', constrain: (x) => [Math.max(-3, Math.min(3, x)), 0] });
        let st = {};
        v.render(() => {
          const b = bS.value, T = Tn.value, x0 = S0.x, osc = kind.value === 'osc';
          const xAt = (t) => (osc ? x0 + b * Math.sin(t) : x0 + b * t);
          const vAt = (t) => (osc ? b * Math.cos(t) : b);
          // track
          A.line(-4, 0, 4, 0, { color: 'muted', width: 2 });
          const R = T;
          A.line(x0 - R, 0.45, x0 + R, 0.45, { color: 'gold', width: 3, alpha: 0.7 });
          A.text('light flashed at the start', x0, 0.7, { color: 'gold', size: 11, align: 'center' });
          A.dot(xAt(T), 0, { r: 9, color: Math.abs(vAt(T)) > 1 ? 'red' : 'accent', label: 'particle', labelPos: 's' });
          // diagram
          D.clip(() => {
            lightLines(D, 12, {}, 0, x0);
            D.hline(T, { color: 'faint', width: 1, dash: [3, 3] });
            let run = null, col = null; const N = 400;
            const flush = () => { if (run && run.length > 1) D.path(run, { color: col, width: 2.6 }); run = null; };
            for (let k = 0; k <= N; k++) {
              const t = (T * k) / N, c = Math.abs(vAt(t)) > 1 ? 'red' : 'accent';
              if (c !== col) { const last = run && run[run.length - 1]; flush(); col = c; run = last ? [last] : []; }
              run.push([xAt(t), t]);
            }
            flush();
          });
          D.dot(xAt(T), T, { r: 6, color: 'purple', label: 'event now', labelPos: 'ne' });
          D.dot(x0, 0, { r: 4, color: 'green' });
          st = { vNow: vAt(T), fast: osc ? b > 1 : b > 1 };
        });
        v.legend([['accent', 'worldline ($|v|<c$)'], ['red', 'worldline flatter than light', { }], ['gold', 'light rays', { dash: true }]]);
        v.readout(() => {
          const a = Math.atan(Math.abs(st.vNow)) * 180 / Math.PI;
          return String.raw`Slope of the worldline now: $dx/d(ct)=v/c=${v.fix(st.vNow, 2)}$, i.e. ${v.fix(a, 1)}° from the vertical (light: 45°). ` + (Math.abs(st.vNow) <= 1 && !st.fast ? 'The worldline stays inside the light lines.' : '**Outside the light lines — not the worldline of anything with mass.**');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.2
    {
      num: '1.2',
      kind: 'Principle',
      name: 'Principle of relativity',
      credit: 'Galileo, 1632 (ship’s cabin); stated for all of physics by Poincaré and Einstein, 1905',
      statement: String.raw`The laws of physics take the same form in every inertial frame. Equivalently, an experiment carried out entirely inside a closed laboratory, prepared the same way, gives the same outcome whatever uniform velocity the laboratory has: no internal measurement reveals one's own uniform motion. Galileo's cabin argument (1632) states this for mechanics; the relativity principle extends it to all physical laws, light and electromagnetism included.`,
      idea: String.raw`Newton's laws keep their form under the Galilean change of frame (mech-1.8), so mechanical experiments cannot detect uniform motion. Maxwell's equations were not invariant under that change (em-13.2), which seemed to single out a rest frame of the ether. The principle of relativity insists that no such frame exists for any law, and the next postulate then fixes what must replace the Galilean map. Below, if light obeyed Galilean addition relative to an ether, the light-clock experiment would betray the motion.`,
      caption: String.raw`Two identical laboratories run the same three experiments in the **ground** view: a collision, a pendulum, a light pulse between mirrors. Raise the speed of the lower laboratory: every readout in its own coordinates stays equal to that of the upper one. Switch the **light law** to "Galilean ether" and the light round trip in the moving laboratory changes, so the laboratory could measure its velocity — exactly what the principle forbids.`,
      deps: ['mech-1.8'],
      refs: ['Taylor–Wheeler §3.1', 'Schutz §1.1'],
      tags: ['relativity principle', 'inertial frames'],
      scope: String.raw`Inertial laboratories (no rotation, no gravity gradients). The internal motions drawn are slow compared with $c$ and use classical mechanics; the light pulse is idealized.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Galileo%27s_ship' },
      viz(v) {
        const bS = v.slider('speed of lab B, $u/c$', 0, 0.6, 0.45, { step: 0.01 });
        const law = v.select('light law', [{ value: 'rel', label: 'same speed in every frame' }, { value: 'gal', label: 'Galilean ether (c ± u)' }], 'rel');
        const view = v.select('view from', [{ value: 'ground', label: 'ground' }, { value: 'B', label: 'lab B' }], 'ground');
        const S = v.stage({ x: [-0.5, 12.5], y: [-3, 3.6], equal: true, axes: false, height: 340, full: true });
        const C = 3, LW = 3.4, LH = 2.4, PER = 4;
        const rtTime = (u, gal) => (gal ? 3 / (C - u) + 3 / (C + u) : 6 / C);
        let st = {};
        const lab = (ox, oy, tt, u, gal, name, col) => {
          S.rect(ox, oy, ox + LW, oy + LH, { color: col, width: 2, fill: col, fillAlpha: 0.07 });
          S.text(name, ox + 0.1, oy + LH + 0.18, { color: col, size: 12, weight: 700, align: 'left' });
          S.line(ox, oy + 0.25, ox + LW, oy + 0.25, { color: 'muted', width: 1.5 });
          // collision on the floor
          const w = 1.3, r = 0.15, tc = (1.7 - 2 * r) / w;
          let x1 = 0.3 + w * tt, x2 = 2.0;
          if (tt > tc) { x1 = 0.3 + w * tc; x2 = Math.min(3.1, 2.0 + w * (tt - tc)); }
          S.dot(ox + x1, oy + 0.25 + r, { r: 7, color: 'accent' }); S.dot(ox + x2, oy + 0.25 + r, { r: 7, color: 'orange' });
          // pendulum
          const th = 0.45 * Math.cos(2 * Math.PI * tt / 2), px = ox + 2.6, py = oy + 1.75;
          S.line(px, py, px + Math.sin(th), py - Math.cos(th), { color: 'ink', width: 1.4 });
          S.dot(px + Math.sin(th), py - Math.cos(th), { r: 6, color: 'green' }); S.dot(px, py, { r: 2.5, color: 'ink' });
          // light pulse between mirrors
          const cr = gal ? C - u : C, cl = gal ? C + u : C, T = 3 / cr + 3 / cl, p = tt % T;
          const lx = p < 3 / cr ? 0.2 + cr * p : 3.2 - cl * (p - 3 / cr);
          S.line(ox + 0.2, oy + 2.0, ox + 0.2, oy + 2.25, { color: 'ink', width: 3 }); S.line(ox + 3.2, oy + 2.0, ox + 3.2, oy + 2.25, { color: 'ink', width: 3 });
          S.line(ox + 0.2, oy + 2.125, ox + 3.2, oy + 2.125, { color: 'gold', width: 1, alpha: 0.35, dash: [3, 3] });
          S.dot(ox + lx, oy + 2.125, { r: 5, color: 'gold' });
        };
        v.animate((t) => {
          const tt = t % PER, u = bS.value * C, gal = law.value === 'gal';
          const xB = 0.5 + u * tt, xA = 8;
          const shift = view.value === 'B' ? 0.5 - xB : 0;
          lab(xA + shift, 0.4, tt, 0, gal, 'lab A (at rest on the ground)', 'accent');
          lab(xB + shift, -2.8, tt, u, gal, 'lab B (moving at ' + v.fix(bS.value, 2) + ' c)', 'orange');
          S.arrow(xB + shift + LW + 0.2, -1.6, xB + shift + LW + 0.2 + 0.4 + 1.2 * bS.value * 3, -1.6, { color: 'orange', width: 2 });
          st = { A: rtTime(0, gal), B: rtTime(u, gal), gal, b: bS.value };
        }, { period: PER, still: 1.4 });
        v.legend([['accent', 'ball 1'], ['orange', 'ball 2'], ['green', 'pendulum bob'], ['gold', 'light pulse']]);
        v.readout(() => {
          if (!st.A) return '';
          const d = Math.abs(st.B - st.A) > 1e-9;
          return String.raw`Every laboratory measures in its own coordinates: collision — the moving ball stops and the target leaves at the same speed (velocities exchanged); pendulum period $2.00$ s; light round trip A: $${v.fix(st.A, 3)}$ s, B: $${v.fix(st.B, 3)}$ s.` + '\n' +
            (d ? String.raw`**Lab B's light round trip differs**: it could infer its own speed from $T_B/T_A$ — the principle is violated.` : 'No readout distinguishes lab B from lab A: nothing inside reveals its uniform motion.');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.3
    {
      num: '1.3',
      kind: 'Postulate',
      name: 'Invariance of the speed of light',
      credit: 'Einstein, 1905',
      statement: String.raw`In every inertial frame, light in vacuum travels with the same speed $c=299\,792\,458$ m/s, whatever the motion of its source. A pulse emitted by a moving source therefore spreads, in any inertial frame, as a sphere centred on the place where the **emission** happened, not on where the source is now. This is the second postulate of special relativity; it sits beside the principle of relativity (rel-1.2) and replaces the Galilean addition $c\pm v$.`,
      idea: String.raw`Maxwell's equations give one wave speed (em-11.1), and under the relativity principle that speed cannot depend on the frame; so it also cannot depend on the source's velocity, which is a frame statement. The alternative, an emitter ("ballistic") theory where light inherits the source's velocity, would send light from the approaching part of an orbiting binary faster than from the receding part, so for a distant binary the arrival order of the flashes would be scrambled. De Sitter pointed out in 1913 that such distortions are not seen; Brecher (1977) repeated the test with X-ray binaries, and CERN measured photons from fast $\pi^0$ decays (Alväger et al., 1964).`,
      caption: String.raw`**Left:** a source moving to the right flashes at regular intervals. Under the postulate each ring stays centred on its emission point (the rings are off-centre toward the back); under the emitter theory they all stay centred on the source. **Right:** emission time against arrival time for a binary star seen from afar, with $D$ the light travel time in orbital periods. Raise $D$ under the emitter theory until the curve folds back: the star would be seen in several places at once.`,
      deps: ['em-11.1', 'em-13.2'],
      refs: ['Einstein1905,complete introduction and §§1–2; deSitter/Brecher/Alväger original experimental checks still pending'],
      tags: ['speed of light', 'postulate'],
      scope: String.raw`Light (and any massless signal) in vacuum, in inertial frames. The binary has an illustrative orbital speed $\beta=10^{-4}$, not a particular star. The astronomical test is complicated by absorption and re-emission in the interstellar medium (the extinction theorem), which is why laboratory and X-ray tests were added.`,
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/De_Sitter_double_star_experiment' },
      viz(v) {
        const th = v.select('theory', [{ value: 'light', label: 'light postulate' }, { value: 'emit', label: 'emitter (ballistic)' }], 'light');
        const bS = v.slider('source speed $v/c$', 0, 0.8, 0.5, { step: 0.01 });
        const Dl = v.slider('$D$ (light travel time, orbital periods)', 1, 1e6, 3000, { log: true });
        const BORB = 1e-4;
        const A = v.stage({ x: [-6, 6], y: [-2.6, 2.6], equal: true, axes: false, height: 320, weight: 1.2, minWidth: 320, title: 'wavefronts from a moving flashing source' });
        const B = v.stage({ x: [-1, 3], y: [0, 2], axes: 'box', gutter: true, height: 320, weight: 0.9, minWidth: 280, xlabel: 'arrival time $-D$ (periods)', ylabel: 'emission time (periods)', title: 'binary star seen from far away' });
        let st = {};
        v.animate((t) => {
          const b = bS.value, emit = th.value === 'emit', te0 = 0.6, x0 = -4;
          const xs = x0 + b * t;
          A.clip(() => {
            for (let te = 0; te <= t + 1e-9; te += te0) {
              const r = t - te, xe = x0 + b * te, cx = emit ? xs : xe;
              A.circle(cx, 0, r, { color: 'gold', width: 1.4, alpha: 0.85 });
            }
          });
          A.dot(xs, 0, { r: 6, color: 'red', label: 'source', labelPos: 's' });
          if (t > 0.01) A.arrow(xs, 0.0, xs + 0.9 * b + 0.01, 0.0, { color: 'red', width: 1.6 });
          // front speed measured from the rings
          const cxf = (tt) => (emit ? x0 + b * tt : x0), vf = (cxf(t + 0.01) + t + 0.01 - cxf(t) - t) / 0.01, vb = -(cxf(t + 0.01) - t - 0.01 - cxf(t) + t) / 0.01;
          // arrival-time curve
          const D = Dl.value, amp = D * BORB;
          const cur = (te) => { const vl = BORB * Math.sin(2 * Math.PI * te); const x=-(BORB/(2*Math.PI))*Math.cos(2*Math.PI*te); return emit ? te + (D-x)/(1+vl)-D : te-x; };
          const R = Math.max(1, amp * 1.15);
          B.setView([-R, 2 + R], [0, 2]);
          B.path(Array.from({ length: 401 }, (_, k) => { const te = k / 200; return [cur(te), te]; }), { color: emit ? 'red' : 'accent', width: 2.4 });
          B.line(0, 0, 2, 2, { color: 'gold', width: 1, dash: [4, 4] });
          let folded = false; for (let k = 1; k <= 400; k++) if (cur(k / 200) <= cur((k - 1) / 200)) folded = true;
          st = { vf, vb, emit, folded, D, crit: 1 / (2 * Math.PI * BORB) };
        }, { period: 8, still: 4.5 });
        v.legend([['gold', 'wavefront'], ['red', 'source'], ['accent', 'postulate'], ['red', 'emitter theory', { dash: true }]]);
        v.readout(() => {
          if (st.vf === undefined) return '';
          return String.raw`Lab-frame speed of the front ahead of the source: $${v.fix(st.vf, 2)}\,c$, behind: $${v.fix(st.vb, 2)}\,c$ ` + (st.emit ? '(the source speed is added — no frame-independent $c$).' : '(always $c$, in every direction).') + '\n' +
            (st.emit ? String.raw`Binary at $D=${v.fix(st.D, 0)}$ periods: the arrival order is ${st.folded ? '**scrambled** (the curve folds; scrambling begins near $D\\approx' + v.fix(st.crit, 0) + '$)' : 'still ordered (it scrambles once $D\\gtrsim' + v.fix(st.crit, 0) + '$)'}. This is an idealized propagation model; actual binary-star tests also require source/medium modelling.` : 'Light postulate: arrival order stays monotone; the tiny orbital light-travel-time modulation is retained.');
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.4
    {
      num: '1.4',
      kind: 'Phenomenon',
      name: 'Michelson–Morley null result',
      credit: 'Michelson, 1881; Michelson & Morley, 1887',
      statement: String.raw`If light travelled at $c$ relative to a stationary ether and the Earth moved through it at speed $v$, a Michelson interferometer with two equal perpendicular arms of length $L$ would show a fringe shift $N=\dfrac{L}{\lambda}\beta^2\cos2\theta$ (to leading order, $\beta=v/c$) as it is turned through angle $\theta$ about the wind direction. For $L\approx11$ m, $\lambda\approx550$ nm and $v=30$ km/s the swing for a quarter turn is $2L\beta^2/\lambda\approx0.4$ fringe. Michelson and Morley found nothing near it (their paper: rel-1.13), and modern rotating-cavity experiments find no anisotropy of the speed of light at the $10^{-17}$ level.`,
      idea: String.raw`Light has to cross each arm and return; in an ether wind the arm along the wind costs $2Lc/(c^2-v^2)$ while the arm across it costs $2L/\sqrt{c^2-v^2}$, a difference of order $L\beta^2/c$. With the invariant speed of light (rel-1.3) and the relativity principle (rel-1.2) the round trip is $2L/c$ in every orientation, so there is nothing to detect. Lorentz and FitzGerald (1889, 1892) proposed instead a physical shortening of the arm along the wind by $\sqrt{1-\beta^2}$, which also cancels the difference exactly.`,
      caption: String.raw`A model of the experiment, **not the 1887 data** (those are in rel-1.13). **Turn the table** with the angle slider and raise the **ether wind**; choose what is true. For an ether at rest and light speed $c$ in it, the fringes shift as $\cos2\theta$ twice per turn. With the contraction of the arm along the wind, or with special relativity, the curve is flat. The grey band is the size of shift the 1887 experiment excluded.`,
      deps: ['rel-1.3', 'mech-1.8', 'waves-6.8'],
      refs: ['Taylor–Wheeler ch. 3'],
      tags: ['ether', 'interferometry', 'null result'],
      scope: String.raw`The pictured arm lengths and wavelength are the ones of the 1887 apparatus (about $11$ m folded path, $\lambda\approx550$ nm), with the Earth's orbital speed $30$ km/s as the default wind. Round-trip times are exact in the ether model; fringe numbers ignore the finite size of the beam splitter.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Michelson%E2%80%93Morley_experiment' },
      viz(v) {
        const vS = v.slider('ether wind $v$ (km/s)', 1, 400, 30, { log: true });
        const thS = v.slider('table angle $\\theta$ (°)', 0, 360, 40, { step: 1 });
        const mode = v.select('truth', [{ value: 'eth', label: 'ether, rigid arms' }, { value: 'con', label: 'ether + contraction' }, { value: 'sr', label: 'relativity' }], 'eth');
        const L = 11, LAM = 5.5e-7, C = 299792.458;
        const t1 = (b, th, con) => { // round trip of an arm at angle th to the wind, units L/c (ether frame, wind along x)
          const ax = Math.cos(th) * (con ? Math.sqrt(1 - b * b) : 1), ay = Math.sin(th);
          const ad = ax * b; return (2 * Math.sqrt(ad * ad + (1 - b * b) * (ax * ax + ay * ay))) / (1 - b * b);
        };
        const Nfr = (b, th, m) => (m === 'sr' ? 0 : ((L / LAM) * (t1(b, th, m === 'con') - t1(b, th + Math.PI / 2, m === 'con'))));
        const A = v.stage({ x: [-1.6, 1.6], y: [-1.6, 1.6], equal: true, axes: false, height: 330, weight: 0.85, minWidth: 250, title: 'the interferometer, from above' });
        const B = v.stage({ x: [0, 360], y: [-0.4, 0.4], axes: 'box', gutter: true, height: 330, weight: 1.2, minWidth: 300, xticks: [0, 90, 180, 270, 360], xlabel: 'table angle $\\theta$ (°)', ylabel: 'fringe shift $N$', title: 'fringe shift against angle' });
        let st = {};
        v.render(() => {
          const b = vS.value / C, th = (thS.value * Math.PI) / 180, m = mode.value;
          const top = Math.max(0.1, 1.15 * (L / LAM) * b * b);
          // apparatus
          const u = [Math.cos(th), Math.sin(th)], n = [-u[1], u[0]];
          for (const o of [-1.1, -0.55, 0, 0.55, 1.1]) A.arrow(-1.5, o, -0.95, o, { color: 'teal', width: 1.2, alpha: 0.5, head: 6 });
          A.text('ether wind', -1.55, 1.4, { color: 'teal', size: 11, align: 'left' });
          for (const [d, col] of [[u, 'orange'], [n, 'accent']]) {
            A.line(0, 0, 1.0 * d[0], 1.0 * d[1], { color: col, width: 2 });
            A.line(1.0 * d[0] - 0.09 * (-d[1]), 1.0 * d[1] - 0.09 * d[0], 1.0 * d[0] + 0.09 * (-d[1]), 1.0 * d[1] + 0.09 * d[0], { color: 'ink', width: 4 });
          }
          A.line(-0.1, -0.1, 0.1, 0.1, { color: 'ink', width: 3, alpha: 0.6 });
          A.dot(0, 0, { r: 3, color: 'gold' });
          // plot
          B.setView([0, 360], [-top, top]);
          B.hband(-0.01, 0.01, { color: 'muted', alpha: 0.35 });
          const f = (a) => Nfr(b, (a * Math.PI) / 180, 'eth');
          B.fn(f, { color: 'faint', width: 1.4, dash: [4, 4], n: 361 });
          B.fn((a) => Nfr(b, (a * Math.PI) / 180, m), { color: m === 'eth' ? 'red' : 'green', width: 2.6, n: 361 });
          B.vline(thS.value, { color: 'gold', width: 1.4 });
          B.dot(thS.value, Nfr(b, th, m), { r: 6, color: m === 'eth' ? 'red' : 'green' });
          st = { N: Nfr(b, th, m), amp: (L / LAM) * b * b, m, v: vS.value };
        });
        v.legend([['red', 'ether, rigid arms'], ['faint', 'ether prediction (reference)', { dash: true }], ['green', 'contraction / relativity'], ['muted', '$|N|<0.01$ fringe', { area: true }]]);
        v.readout(() => {
          if (st.amp === undefined) return '';
          return String.raw`Wind $${v.fix(st.v, 0)}$ km/s: the ether theory with rigid arms predicts $N=\pm${v.fix(st.amp, 3)}\cos 2\theta$ (quarter-turn swing $${v.fix(2 * st.amp, 2)}$ fringe); at this angle $N=${v.fix(st.N, 3)}$.` + '\n' +
            (st.m === 'eth' ? `At 30 km/s the swing is 0.4 fringe; the 1887 experiment saw less than a twentieth of that.` : `Prediction: $N=0$ at every angle.`);
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.5
    {
      num: '1.5',
      kind: 'Definition',
      name: 'Clock synchronization by light signals',
      credit: 'Einstein,1905,§1 synchronization convention',
      statement: String.raw`Two identical clocks at rest at different places in an inertial frame are **synchronized** by light signals as follows. A pulse leaves clock $A$ when it reads $t_e$, is reflected at clock $B$ and returns to $A$ when it reads $t_r$. Clock $B$ is correctly set if its reading at the reflection event equals $t_e+\tfrac12(t_r-t_e)$. Applied from one master clock to a whole lattice of clocks, this defines the time coordinate of the frame. The convention assigns equal one-way travel times to the two directions. A measurement of one-way speed between separated clocks already depends on their synchronization.`,
      idea: String.raw`If the speed of light is $c$ in every direction (rel-1.3), the pulse spends equal times on the way out and back, so the moment of reflection is the midpoint of the round trip, and a clock at distance $d$ must be set to $t_e+d/c$ when the pulse reaches it. Einstein (1905), §1, uses this equal-time prescription to define time throughout a frame. The next item shows that two frames do not agree on it.`,
      caption: String.raw`**Drag the target clock $P$** anywhere and watch the pulse from the master clock at the centre. The ring is the outgoing pulse; each lattice clock jumps to $t_e+d/c$ as the ring passes and then ticks along; the orange ring is the echo returning from $P$. Compare the set value with half of the measured round trip.`,
      deps: ['rel-1.3'],
      refs: ['Einstein1905,On the Electrodynamics of Moving Bodies,complete §1'],
      tags: ['synchronization', 'radar', 'convention'],
      scope: String.raw`Clocks at rest in one inertial frame, light speed isotropic. Light's one-way speed cannot be measured without already having synchronized clocks, so the isotropy is part of the definition.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Einstein_synchronisation' },
      viz(v) {
        const S = v.stage({ x: [-4.4, 4.4], y: [-4.2, 4.2], equal: true, axes: false, height: 460, full: true, title: 'a lattice of clocks set by a pulse from the master clock (c = 1)' });
        const Pt = S.handle(2.4, 1.3, { color: 'purple', label: 'P', labelPos: 'ne', r: 9 });
        let st = {};
        v.animate((t) => {
          const d = Math.hypot(Pt.x, Pt.y);
          S.circle(0, 0, t, { color: 'gold', width: 2.2 });
          if (t > d) S.circle(Pt.x, Pt.y, t - d, { color: 'orange', width: 1.8, alpha: 0.9 });
          S.line(0, 0, Pt.x, Pt.y, { color: 'faint', width: 1, dash: [3, 3] });
          for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) {
            const x = 1.5 * i, y = 1.5 * j, r = Math.hypot(x, y), set = t >= r;
            if (!i && !j) continue;
            S.dot(x, y, { r: 11, color: set ? 'green' : 'faint', hollow: !set });
            S.text(set ? v.fix(t, 1) : '–', x, y, { size: 9, align: 'center', baseline: 'middle', color: set ? 'ink' : 'muted' });
          }
          S.dot(0, 0, { r: 15, color: 'accent', hollow: true }); S.text(v.fix(t, 1), 0, 0, { size: 10, align: 'center', baseline: 'middle', color: 'ink' });
          S.text('master', 0, -0.62, { size: 10, align: 'center', color: 'accent' });
          st = { d, t, back: t >= 2 * d };
        }, { period: 10, still: 5 });
        v.legend([['gold', 'outgoing pulse'], ['orange', 'echo from P'], ['green', 'clock already set']]);
        v.readout(() => {
          if (!st.d && st.d !== 0) return '';
          return String.raw`$P$ is at distance $d=${v.fix(st.d, 2)}$. The pulse leaves at $t_e=0$ and the echo is back at $t_r=2d/c=${v.fix(2 * st.d, 2)}$ (${st.back ? 'back already' : 'not yet back'}). The rule sets $P$ to $t_e+\tfrac12(t_r-t_e)=${v.fix(st.d, 2)}$ at the moment the pulse arrives — the same as $d/c$. Setting every clock to $0$ on arrival instead would leave $P$ behind by $d/c$.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.6
    {
      num: '1.6',
      kind: 'Phenomenon',
      name: 'Relativity of simultaneity',
      credit: 'Einstein, 1905',
      statement: String.raw`Events that are simultaneous in one inertial frame are in general not simultaneous in another moving relative to it along the line joining them. In Einstein's train, two lightning strikes at the two ends of a train happen at the same platform time. The observer at the middle of the train, who moves toward one flash and away from the other, receives the front flash first and rightly concludes (the flashes started at equal distances, and light has the same speed in both directions) that the front strike came first. Two events separated by $\Delta x$ along the motion that are simultaneous in frame $S$ differ in time by $\Delta t'=-\gamma\beta\,\Delta x/c$ in a frame $S'$ moving at $v=\beta c$.`,
      idea: String.raw`Each observer defines "same time" with light signals sent from the midpoint (rel-1.5). The platform observer's midpoint sees both flashes at once; but the train moves while the light travels, so its midpoint runs into the front flash early and flees from the rear flash. Both observers apply the same rule with the same light speed (rel-1.3), and by the principle of relativity (rel-1.2) neither has a better claim, so simultaneity cannot be absolute. In the diagram, lines of simultaneity of the train tilt toward the light line by the train's angle.`,
      caption: String.raw`**Press play and change the train speed.** Left: the platform picture, with the train carrying the orange observer. Right: the same history as a spacetime diagram, with the platform's "now" line moving up; the orange lines are the train's lines of simultaneity through the two strikes, tilted by $\arctan\beta$. At $\beta=0$ they coincide with the platform's.`,
      deps: ['rel-1.5', 'rel-1.2'],
      refs: ['Taylor–Wheeler §3.4', 'Schutz §1.5'],
      tags: ['simultaneity', 'train'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Relativity_of_simultaneity' },
      viz(v) {
        const bS = v.slider('train speed $v/c$', 0, 0.8, 0.5, { step: 0.01 });
        const A = v.stage({ x: [-6, 8], y: [-2.6, 2.6], equal: true, axes: false, height: 300, weight: 1.15, minWidth: 330, title: 'platform picture' });
        const Dg = v.stage({ x: [-4, 4], y: [-1, 7], axes: 'box', gutter: true, height: 300, weight: 0.9, minWidth: 280, xlabel: '$x$', ylabel: '$ct$', title: 'spacetime diagram (platform frame)' });
        const L = 2;
        let st = {};
        v.animate((tau) => {
          const b = bS.value, tmax = L / (1 - b) + 0.7, t = -1 + (tau / 10) * (tmax + 1);
          const cx = b * t;
          // platform
          A.line(-6, -0.8, 8, -0.8, { color: 'muted', width: 2 });
          A.dot(0, -0.8, { r: 7, color: 'accent', label: 'platform observer', labelPos: 's' });
          A.rect(cx - L, -0.5, cx + L, 0.7, { color: 'orange', fill: 'orange', fillAlpha: 0.15, width: 2 });
          A.dot(cx, 0.1, { r: 7, color: 'orange' }); A.text('train observer', cx, 1.15, { color: 'orange', size: 12, align: 'center' });
          if (t > 0) for (const x of [-L, L]) A.circle(x, 0.1, t, { color: 'gold', width: 1.6, alpha: 0.9 });
          if (t > 0) { A.text('flash A', L, 2.2, { size: 11, color: 'gold', align: 'center' }); A.text('flash B', -L, 2.2, { size: 11, color: 'gold', align: 'center' }); }
          const tF = L / (1 + b), tR = L / (1 - b);
          // diagram
          Dg.clip(() => {
            Dg.line(-L, 0, -L + 6, 6, { color: 'gold', width: 1.4 }); Dg.line(L, 0, L - 6, 6, { color: 'gold', width: 1.4 });
            Dg.line(-6 * b, -6, 6 * b, 6, { color: 'orange', width: 2 }); Dg.line(0, -1, 0, 7, { color: 'accent', width: 2 });
            Dg.line(-L, 0, -L + 7 * b, 7, { color: 'orange', width: 1, alpha: 0.5, dash: [2, 3] }); Dg.line(L, 0, L + 7 * b, 7, { color: 'orange', width: 1, alpha: 0.5, dash: [2, 3] });
            Dg.line(-4, b * (-4 - L), 4, b * (4 - L), { color: 'orange', width: 1.6, dash: [5, 3] });
            Dg.line(-4, b * (-4 + L), 4, b * (4 + L), { color: 'orange', width: 1.6, dash: [5, 3] });
            Dg.hline(t, { color: 'accent', width: 1.4, alpha: 0.7 });
          });
          Dg.dot(-L, 0, { r: 5, color: 'gold', label: 'B', labelPos: 'sw' }); Dg.dot(L, 0, { r: 5, color: 'gold', label: 'A', labelPos: 'se' });
          Dg.dot(0, L, { r: 6, color: 'accent', label: 'both seen', labelPos: 'ne' });
          Dg.dot(b * tF, tF, { r: 6, color: 'orange', label: 'A seen', labelPos: 'e' });
          Dg.dot(b * tR, tR, { r: 6, color: 'orange', label: 'B seen', labelPos: 'e' });
          st = { b, tF, tR, dtp: 2 * gam(b) * b * L, t };
        }, { period: 10, still: 4.5 });
        v.legend([['gold', 'light from the strikes'], ['accent', 'platform observer'], ['orange', 'train observer, simultaneity lines', { dash: true }]]);
        v.readout(() => {
          if (!st.b && st.b !== 0) return '';
          return String.raw`Platform: both flashes strike at $ct=0$ and arrive together at $ct=L=${v.fix(2, 2)}$. Train observer: sees A at $ct=${v.fix(st.tF, 2)}$ and B at $ct=${v.fix(st.tR, 2)}$ (platform clock). In the train's frame A happened $\Delta t'=${v.fix(st.dtp, 2)}$ (in $ct$ units) **before** B: the two strikes are not simultaneous there. At $v=0$ all agree.`;
        });
      },
    },
  ],
};
