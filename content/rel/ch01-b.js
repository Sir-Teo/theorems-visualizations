// Special & General Relativity — Chapter 1 (second part): items 1.7–1.12
//
// Facts checked while writing (Oct 2026): muon rest lifetime 2.1969811 µs and mass 105.6583755 MeV/c² (PDG);
// Rossi & Hall, Phys. Rev. 59 (1941) 223 (muon decay in flight, Echo Lake vs Denver; proper lifetime ≈ 2.4 µs there, per a secondary summary);
// Frisch & Smith, Am. J. Phys. 31 (1963) 342 — about 563 muons/h on Mount Washington (~1.9 km) against about 408/h at Cambridge, MA
// Original Frisch–Smith Table I: means563±10/h and408±9/h; p355 corrected 397/550=.722±.021.
// FitzGerald 1889 / Lorentz 1892 contraction proposals (Linda Hall Library, secondary); Terrell and Penrose, 1959 (secondary).
import { gam, toMoving, fromMoving, lightLines, TAU_MU, M_MU, C_KM_US } from './ch01.shared.js';

export default {
  collection: 'rel',
  chapter: 1,
  items: [
    // ───────────────────────────────────────────────────────────── 1.7
    {
      num: '1.7',
      kind: 'Theorem',
      name: 'Invariance of the spacetime interval',
      credit: 'Einstein, 1905 (implicit); Minkowski, 1908 (as a geometry)',
      statement: String.raw`Let two events have time separation $\Delta t$ and displacement $\Delta\mathbf x$ in one inertial frame. Then the **interval**
$$\Delta s^2=c^2\Delta t^2-|\Delta\mathbf x|^2$$
has the same value in every inertial frame (flat spacetime, without gravity). In particular, two events joined by a light signal have $\Delta s^2=0$ in all frames, and the time $\Delta\tau$ between two events at the same place in some frame is given by $\Delta s^2=c^2\Delta\tau^2$ for all observers.`,
      idea: String.raw`The relativity principle (rel-1.2) and the constancy of $c$ (rel-1.3) say that a light flash from one event to another has $c^2\Delta t^2-|\Delta\mathbf x|^2=0$ in every frame, so the form vanishes in all frames at once. By symmetry and linearity the form can then change at most by an overall factor from frame to frame; the factor must be $1$ because the inverse boost would otherwise give its reciprocal. Equivalently, compute with a light clock: the same pair of ticks, seen from two frames, gives different $\Delta t$ and $\Delta x$ but the same $c^2\Delta t^2-\Delta x^2$ (rel-1.5 supplies the clocks).`,
      caption: String.raw`A light clock (a photon bouncing between two mirrors a height $h$ apart) rides in a rocket. **Move the speed slider** and the **mirror height**. Left: the ground frame, where the photon travels a zig-zag whose legs follow from Pythagoras; right: the same two ticks as events on a spacetime diagram, lying on one invariant hyperbola. The ground observer's $\Delta t$ and $\Delta x$ both change with speed, their combination does not.`,
      deps: ['rel-1.2', 'rel-1.3', 'rel-1.5'],
      refs: ['Taylor–Wheeler §3.7', 'Schutz §1.6'],
      tags: ['interval', 'invariant', 'light clock'],
      scope: String.raw`Inertial frames, flat spacetime, motion along the $x$-axis for the picture; the invariance itself holds for any relative direction.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Spacetime#Spacetime_interval' },
      viz(v) {
        const bS = v.slider('rocket speed $v/c$', 0, 0.95, 0.6, { step: 0.01 });
        const hS = v.slider('mirror height $h$', 0.4, 1.3, 0.9, { step: 0.01 });
        const A = v.stage({ x: [-1.2, 7.5], y: [-0.7, 2.7], equal: true, axes: false, height: 300, weight: 1.1, minWidth: 320, title: 'ground frame: the photon\'s path between two ticks' });
        const B = v.stage({ x: [-2.6, 6], y: [-0.9, 6.5], equal: true, axes: false, height: 300, weight: 0.9, minWidth: 280, title: 'spacetime: the two ticks as events' });
        let st = {};
        v.render(() => {
          const b = bS.value, h = hS.value;
          // ground frame: photon covers 2*sqrt(h^2 + (b*dt/2)^2) = dt; solve
          const dt = v.M.bisect((T) => 2 * Math.hypot(h, (b * T) / 2) - T, 2 * h, 2 * h * 40, 1e-12);
          const dx = b * dt;
          A.line(-0.5, 0, 7.5, 0, { color: 'muted', width: 1 });
          const rk = (x0, col, al) => { A.rect(x0 - 0.12, 0, x0 + 0.12, h, { color: col, width: 1.2, fill: col, fillAlpha: al }); A.line(x0 - 0.25, 0, x0 + 0.25, 0, { color: 'ink', width: 3 }); A.line(x0 - 0.25, h, x0 + 0.25, h, { color: 'ink', width: 3 }); };
          const x0 = 0.4; rk(x0, 'orange', 0.15); rk(x0 + dx, 'orange', 0.06);
          A.path([[x0, 0], [x0 + dx / 2, h], [x0 + dx, 0]], { color: 'gold', width: 2.4 });
          A.measure(x0, -0.28, x0 + dx, -0.28, `Δx = ${v.fix(dx, 2)}`);
          A.text(`h = ${v.fix(h, 2)}`, x0 - 0.3, h / 2, { align: 'right', size: 11 });
          A.text(`tick 1`, x0, h + 0.3, { align: 'center', size: 11, color: 'orange' }); A.text('tick 2', x0 + dx, h + 0.3, { align: 'center', size: 11, color: 'orange' });
          // spacetime
          B.line(-1, 0, 7, 0, { color: 'muted', width: 1 }); B.line(0, -0.5, 0, 6.5, { color: 'muted', width: 1 });
          lightLines(B, 8);
          B.curve((u) => [(2 * h) * Math.sinh(u), (2 * h) * Math.cosh(u)], -1.6, 3.0, { color: 'green', width: 1.8 });
          B.line(0, 0, dx, dt, { color: 'orange', width: 2.6 });
          B.line(0, 0, 0, 2 * h, { color: 'accent', width: 2.6 });
          B.dot(dx, dt, { r: 6, color: 'orange', label: 'tick 2 (ground)', labelPos: 'e' });
          B.dot(0, 2 * h, { r: 6, color: 'accent', label: 'tick 2 (rocket)', labelPos: 'w' });
          B.dot(0, 0, { r: 5, color: 'ink', label: 'tick 1', labelPos: 'se' });
          B.line(dx, 0, dx, dt, { color: 'orange', width: 1, dash: [3, 3] });
          st = { dt, dx, h, b };
        });
        v.legend([['orange', 'ground-frame separation'], ['accent', 'rocket-frame separation'], ['green', 'the hyperbola $c^2t^2-x^2=(2h)^2$'], ['gold', 'photon']]);
        v.readout(() => {
          if (!st.dt) return '';
          const s2 = st.dt * st.dt - st.dx * st.dx;
          return String.raw`Ground: $c\Delta t=${v.fix(st.dt, 3)}$, $\Delta x=${v.fix(st.dx, 3)}$, so $c^2\Delta t^2-\Delta x^2=${v.fix(s2, 4)}$. Rocket: $c\Delta t'=2h=${v.fix(2 * st.h, 3)}$, $\Delta x'=0$, so $c^2\Delta t'^2-\Delta x'^2=${v.fix(4 * st.h * st.h, 4)}$. Equal to every digit, although $\Delta t$ and $\Delta x$ moved with $v/c=${v.fix(st.b, 2)}$.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.8
    {
      num: '1.8',
      kind: 'Definition',
      name: 'Light cones: timelike, spacelike and null separation',
      credit: 'Minkowski, 1908',
      statement: String.raw`Given a reference event $O$, every other event $E$ has an interval $\Delta s^2=c^2\Delta t^2-|\Delta\mathbf x|^2$ from it. $E$ is **timelike** separated if $\Delta s^2>0$, **null** (lightlike) if $\Delta s^2=0$ and **spacelike** if $\Delta s^2<0$. The null events form the light cone of $O$; the timelike events inside the upper cone are its **future**, those inside the lower cone its **past**. The class of $E$ does not depend on the inertial frame (rel-1.7); and a signal slower than light can connect $O$ and $E$ only when they are timelike separated, so only these events can be causally related to $O$.`,
      idea: String.raw`Because the interval is a frame-independent number (rel-1.7), its sign is too, which gives a classification every observer agrees on. Spacelike pairs are the ones for which some frame has $\Delta t=0$ and another has either order of the two events; for timelike pairs a frame exists in which both happen at the same place, and the order of time is then the same in all frames. The cone is drawn with the $45^\circ$ lines of rel-1.1.`,
      caption: String.raw`**Click the diagram** to add events, shift-click to remove the nearest, and **drag** the purple event. Each is coloured by its separation from the origin event $O$. Then **boost** to another frame: the cones stay where they are, the events move, but no event ever changes colour.`,
      deps: ['rel-1.7', 'rel-1.1'],
      refs: ['Taylor–Wheeler ch. 6', 'Schutz §1.6'],
      tags: ['light cone', 'causality', 'interval'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Light_cone' },
      viz(v) {
        const bS = v.slider('observer frame $v/c$', -0.9, 0.9, 0, { step: 0.01 });
        const D = v.stage({ x: [-5, 5], y: [-4, 4], equal: true, axes: false, height: 470, full: true, title: 'spacetime of an observer moving at $v$ (events keep their colours)' });
        let ev = [[2.2, 1.1], [1.0, -2.6], [-3.0, 0.6], [-1.2, 3.0], [3.6, 3.6], [-2.5, -2.5], [0.4, 1.5]]; // [x, ct] in the lab frame
        const E = D.handle(2.4, 1.2, { color: 'purple', label: 'E', labelPos: 'ne', r: 8 });
        let st = {};
        const cls = (t, x) => { const s = t * t - x * x; return Math.abs(s) < 0.02 ? 'null' : s < 0 ? 'space' : t > 0 ? 'future' : 'past'; };
        const col = { null: 'gold', space: 'red', future: 'green', past: 'accent' };
        D.onClick((x, y, mod) => {
          const b = bS.value; const [t, xx] = fromMoving(b, y, x);
          if (mod && mod.shift) { let k = -1, m = 1e9; ev.forEach(([x1, t1], i) => { const [tp, xp] = toMoving(b, t1, x1), d = Math.hypot(xp - x, tp - y); if (d < m) { m = d; k = i; } }); if (k >= 0 && m < 0.7) ev.splice(k, 1); }
          else if (ev.length < 24) ev.push([xx, t]);
          v.invalidate();
        });
        v.render(() => {
          const b = bS.value;
          D.line(-5, 0, 5, 0, { color: 'faint', width: 1 }); D.line(0, -4, 0, 4, { color: 'faint', width: 1 });
          D.poly([[0, 0], [8, 8], [-8, 8]], { fill: 'green', fillAlpha: 0.1, stroke: false });
          D.poly([[0, 0], [8, -8], [-8, -8]], { fill: 'accent', fillAlpha: 0.1, stroke: false });
          D.poly([[0, 0], [8, 8], [8, -8]], { fill: 'red', fillAlpha: 0.06, stroke: false }); D.poly([[0, 0], [-8, 8], [-8, -8]], { fill: 'red', fillAlpha: 0.06, stroke: false });
          lightLines(D, 8, { alpha: 0.9, width: 1.8, dash: false });
          D.text('future', 0, 3.3, { color: 'green', size: 13, weight: 700, align: 'center' }); D.text('past', 0, -3.3, { color: 'accent', size: 13, weight: 700, align: 'center' });
          D.text('elsewhere (spacelike)', 4.9, 0.5, { color: 'red', size: 12, align: 'right' }); D.text('elsewhere', -4.9, 0.5, { color: 'red', size: 12, align: 'left' });
          D.dot(0, 0, { r: 6, color: 'ink', label: 'O', labelPos: 'sw' });
          const cnt = { future: 0, past: 0, space: 0, null: 0 };
          for (const [x1, t1] of ev) { const [tp, xp] = toMoving(b, t1, x1), c = cls(t1, x1); cnt[c]++; D.dot(xp, tp, { r: 6, color: col[c] }); }
          const [tl, xl] = fromMoving(b, E.y, E.x), c = cls(tl, xl);
          E.color = col[c];
          st = { c, s2: E.y * E.y - E.x * E.x, tl, xl, cnt, tp: E.y, xp: E.x, b };
        });
        v.legend([['green', 'future timelike'], ['accent', 'past timelike'], ['red', 'spacelike'], ['gold', 'null']]);
        v.readout(() => {
          if (!st.c) return '';
          const w = { future: 'in the **future** of $O$: $O$ can influence it', past: 'in the **past** of $O$: it can influence $O$', space: '**spacelike** to $O$: no causal link, and different frames disagree on which comes first', null: 'on the light cone of $O$: connected by a light signal' }[st.c];
          return String.raw`Event E: $(ct,x)=(${v.fix(st.tl, 2)},${v.fix(st.xl, 2)})$ in the lab frame, $(ct',x')=(${v.fix(st.tp, 2)},${v.fix(st.xp, 2)})$ in this frame; $\Delta s^2=${v.fix(st.s2, 2)}$ in both. E is ${w}.` + '\n' +
            `Clicked events: ${st.cnt.future} future, ${st.cnt.past} past, ${st.cnt.space} spacelike, ${st.cnt.null} null — the same counts in every frame.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.9
    {
      num: '1.9',
      kind: 'Definition',
      name: 'Proper time along a worldline',
      credit: 'Minkowski, 1908',
      statement: String.raw`Along a timelike worldline $x(t)$ with $|dx/dt|<c$ the **proper time** between two events on it is
$$\Delta\tau=\int\sqrt{1-\frac{v(t)^2}{c^2}}\,dt=\frac1c\int\sqrt{c^2\,dt^2-dx^2},$$
the time read by a clock carried along the worldline. It is the Minkowski analogue of arc length (pma-6.27) with the sign of $dx^2$ reversed; it has the same value in every inertial frame. Among all timelike worldlines joining two events, the straight (inertial) one has the **largest** proper time.`,
      idea: String.raw`For a small step the clock is momentarily at rest in a frame where $dx'=0$, so it advances by $d\tau=\sqrt{c^2dt^2-dx^2}/c$, an interval (rel-1.7) divided by $c$ and therefore frame independent. Summing the steps gives the integral, exactly as arc length sums $\sqrt{dx^2+dy^2}$ (pma-6.27). Any detour makes each step $\sqrt{dt^2-dx^2}$ shorter than the straight chord would, because $\sqrt{a^2-b_1^2}+\sqrt{a'^2-b_2^2}\le\sqrt{(a+a')^2-(b_1+b_2)^2}$ — the reversed triangle inequality.`,
      caption: String.raw`**Drag the interior points** (and the end point) sideways to bend the worldline: the right graph accumulates the wristwatch time $\tau(t)$ against coordinate time and always ends below the straight line's. Drag a point more than one unit of $x$ per unit of $ct$ away from its neighbour and the segment turns red: no clock can follow it.`,
      deps: ['rel-1.7', 'pma-6.27'],
      refs: ['Taylor–Wheeler §5.6', 'Schutz §1.6'],
      tags: ['proper time', 'worldline', 'arc length'],
      scope: String.raw`The worldline is drawn as a polygon through the handles, so each leg is uniform motion; the integral is exact for it.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Proper_time' },
      viz(v) {
        const N = 6, T = 6;
        const D = v.stage({ x: [-4, 4], y: [0, 6.4], equal: true, axes: 'box', gutter: true, height: 470, weight: 1.05, minWidth: 330, xlabel: '$x$', ylabel: '$ct$', title: 'a worldline from (0,0) to the end event' });
        const G = v.stage({ x: [0, 6], y: [0, 6.4], axes: 'box', gutter: true, height: 470, weight: 0.8, minWidth: 280, xlabel: 'coordinate time $ct$', ylabel: 'proper time $c\\tau$', title: 'wristwatch time along the way' });
        const hs = []; for (let k = 1; k <= N; k++) hs.push(D.handle([0.3, -0.3, 0.4, -0.3, 0.3, 0.4][k - 1], k, { color: k === N ? 'purple' : 'orange', r: k === N ? 8 : 7, constrain: (x) => [Math.max(-4, Math.min(4, x)), k] }));
        v.button('wiggle', () => { const r = v.rng(Math.floor(Math.random() * 1e6)); hs.forEach((h, k) => { if (k < N - 1) h.set(r.uniform(-0.9, 0.9), k + 1); }); });
        v.button('straighten', () => hs.forEach((h, k) => { if (k < N - 1) h.set((hs[N - 1].x * (k + 1)) / N, k + 1); }));
        let st = {};
        v.render(() => {
          const pts = [[0, 0], ...hs.map((h) => [h.x, h.y])];
          let tau = 0, ok = true; const acc = [[0, 0]];
          for (let k = 1; k < pts.length; k++) {
            const dx = pts[k][0] - pts[k - 1][0], dt = pts[k][1] - pts[k - 1][1], s = dt * dt - dx * dx;
            const bad = s < 0; if (bad) ok = false; else tau += Math.sqrt(s);
            D.line(pts[k - 1][0], pts[k - 1][1], pts[k][0], pts[k][1], { color: bad ? 'red' : 'accent', width: 3 });
            acc.push([pts[k][1], tau]);
          }
          const X = pts[N][0], tS = Math.sqrt(T * T - X * X);
          D.line(0, 0, X, T, { color: 'green', width: 1.6, dash: [5, 4] });
          lightLines(D, 8);
          D.dot(0, 0, { r: 5, color: 'ink' });
          G.line(0, 0, T, T, { color: 'gold', width: 1.2, dash: [4, 4] });
          G.line(0, 0, T, tS, { color: 'green', width: 1.8, dash: [5, 4] });
          if (ok) G.path(acc, { color: 'accent', width: 2.6 });
          for (const p of acc) if (ok) G.dot(p[0], p[1], { r: 3.5, color: 'orange' });
          st = { tau, tS, ok, X };
        });
        v.legend([['accent', 'chosen worldline'], ['green', 'straight line between the endpoints', { dash: true }], ['gold', 'light', { dash: true }]]);
        v.readout(() => {
          if (st.tS === undefined) return '';
          return st.ok ? String.raw`$c\Delta\tau=\sum\sqrt{c^2\Delta t^2-\Delta x^2}=${v.fix(st.tau, 3)}$ along the bent worldline; the straight one gives $\sqrt{6^2-${v.fix(st.X, 2)}^2}=${v.fix(st.tS, 3)}$ — ${st.tau <= st.tS + 1e-9 ? 'the straight line is longer, as the theorem says' : ''}. Coordinate time elapsed: $6$.` : String.raw`A segment is flatter than the light lines (red): it is not a worldline of a clock, and $\sqrt{c^2dt^2-dx^2}$ is imaginary there. The straight worldline would read $${v.fix(st.tS, 3)}$.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.10
    {
      num: '1.10',
      kind: 'Phenomenon',
      name: 'Time dilation',
      credit: 'Einstein, 1905; first direct tests: Ives & Stilwell, 1938; Bailey et al., 1977 (muon storage ring)',
      statement: String.raw`A clock moving with constant speed $v$ relative to an inertial frame $S$ runs slow in $S$: between two of its ticks, $S$-clocks record $\Delta t=\gamma\,\Delta\tau$, where $\Delta\tau$ is the tick period in the clock's own rest frame and $\gamma=1/\sqrt{1-v^2/c^2}\ge1$. The effect is symmetric: each of two inertial observers finds the other's clock slow. It has been confirmed with unstable particles, atomic clocks and spectral lines.`,
      idea: String.raw`Take a light clock, a photon bouncing between mirrors a distance $h$ apart perpendicular to the motion. In its own frame a tick lasts $\Delta\tau=2h/c$. In $S$ the photon must travel the longer zig-zag, but still at speed $c$ (rel-1.3), so $c\Delta t=2\sqrt{h^2+(v\Delta t/2)^2}$ and $\Delta t=\gamma\Delta\tau$. The interval (rel-1.7) says the same: $c^2\Delta t^2-v^2\Delta t^2=c^2\Delta\tau^2$. Proper time (rel-1.9) is the clock's own reading.`,
      caption: String.raw`**Press play, move the speed slider.** A ground light clock (top) and one that moves past it (bottom) are built identically. The photon of the moving clock must travel further, so it ticks less often: compare the counters. The right panel plots $\gamma(\beta)$; the dot is the ratio of ground time to proper time found from the simulation (the tick time of the zig-zag, found by solving $ct=2\sqrt{h^2+(vt/2)^2}$).`,
      deps: ['rel-1.7', 'rel-1.9'],
      refs: ['Taylor–Wheeler §5.8', 'Schutz §1.8'],
      tags: ['time dilation', 'light clock'],
      scope: String.raw`Inertial motion at constant speed; the light clock is an idealization (the effect is the same for any clock). Distances are in arbitrary units with the visual light speed $1.2$ per second, so the clocks tick about once a second.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Time_dilation' },
      viz(v) {
        const bS = v.slider('moving clock speed $v/c$', 0, 0.9, 0.7, { step: 0.01 });
        const A = v.stage({ x: [0, 9.5], y: [-0.2, 3.6], equal: true, axes: false, height: 330, weight: 1.3, minWidth: 340, title: 'ground frame: two light clocks' });
        const B = v.stage({ x: [0, 0.95], y: [1, 3], axes: 'box', gutter: true, height: 330, weight: 0.75, minWidth: 260, xlabel: '$v/c$', ylabel: '$\\gamma$', title: 'tick-rate ratio' });
        const CV = 1.2, h = 0.8, tau0 = (2 * h) / CV;
        let st = {};
        v.animate((t) => {
          const b = bS.value, Tm = v.M.bisect((T) => 2 * Math.hypot(h, (b * CV * T) / 2) - CV * T, tau0, tau0 * 40, 1e-12);
          const tri = (ph, H) => (ph < 0.5 ? 2 * H * ph : 2 * H * (1 - ph));
          const clock = (x, y0, ph, col, name, trail) => {
            A.line(x - 0.25, y0, x + 0.25, y0, { color: 'ink', width: 3 }); A.line(x - 0.25, y0 + h, x + 0.25, y0 + h, { color: 'ink', width: 3 });
            A.dot(x, y0 + tri(ph, h), { r: 6, color: 'gold' });
            A.text(name, x, y0 - 0.22, { color: col, size: 11, align: 'center' });
          };
          // ground clock
          const gx = 8.6, gy = 2.5, gph = ((t % tau0) / tau0);
          clock(gx, gy, gph, 'accent', 'ground clock', false);
          // moving clock
          const mx = 0.6 + b * CV * t, my = 0.2, mph = ((t % Tm) / Tm);
          clock(mx, my, mph, 'orange', 'moving clock', true);
          // trail of the moving photon
          const pts = []; for (let s = Math.max(0, t - 1.6 * Tm); s <= t + 1e-9; s += Tm / 30) pts.push([0.6 + b * CV * s, my + tri((s % Tm) / Tm, h)]);
          A.path(pts, { color: 'gold', width: 1.4, alpha: 0.7 });
          const ng = Math.floor(t / tau0), nm = Math.floor(t / Tm);
          A.text(`ticks: ${ng}`, gx, gy + h + 0.35, { color: 'accent', size: 13, weight: 700, align: 'center' }); A.text(`ticks: ${nm}`, mx, my + h + 0.35, { color: 'orange', size: 13, weight: 700, align: 'center' });
          B.fn((x) => 1 / Math.sqrt(1 - x * x), { color: 'ink', width: 2 });
          B.dot(b, Tm / tau0, { r: 7, color: 'orange' });
          st = { b, ratio: Tm / tau0, ng, nm };
        }, { period: 8, still: 7 });
        v.legend([['accent', 'ground clock'], ['orange', 'moving clock'], ['gold', 'photon']]);
        v.readout(() => {
          if (!st.ratio) return '';
          return String.raw`$v/c=${v.fix(st.b, 2)}$: one tick of the moving clock takes $\Delta t/\Delta\tau=${v.fix(st.ratio, 4)}$ of its proper period; $\gamma=1/\sqrt{1-\beta^2}=${v.fix(1 / Math.sqrt(1 - st.b * st.b), 4)}$. Counted so far: ground ${st.ng}, moving ${st.nm}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.11
    {
      num: '1.11',
      kind: 'Phenomenon',
      name: 'Length contraction',
      credit: 'FitzGerald, 1889 and Lorentz, 1892 (as a hypothesis); Einstein, 1905 (as a consequence of kinematics)',
      statement: String.raw`A rod whose length in its own rest frame is $L_0$ has, when it moves at speed $v$ along its length relative to an inertial frame $S$, a length $L=L_0/\gamma=L_0\sqrt{1-v^2/c^2}$, **defined** as the distance between the positions of its two ends at the same time in $S$. Lengths perpendicular to the motion are unchanged. The effect is reciprocal: a rod at rest in $S$ is shortened by the same factor in the rod's frame. It is a statement about simultaneity-dependent measurement, not about forces compressing the rod.`,
      idea: String.raw`The ends of the rod trace parallel worldlines separated by $L_0/\gamma$ along any line $ct=$ const of $S$, because the rod's own length lies along its line of simultaneity, which is tilted (rel-1.6), and the invariance of the interval (rel-1.7) turns the tilted separation $L_0$ into $L_0/\gamma$ on the horizontal line; time dilation (rel-1.10) is the matching statement along the other axis. FitzGerald and Lorentz introduced a contraction of this size in 1889–1892 to save the ether; here it is a consequence of how simultaneity is defined.`,
      caption: String.raw`The rod (orange strip) and a ground ruler with ticks one unit apart (vertical lines). **Choose who measures.** Ground: the horizontal line $ct=$ const meets the rod in $L_0/\gamma$. Rod: its own lines of simultaneity (tilted) meet two ground ticks one ruler unit apart, and the ruler's ticks turn out only $1/\gamma$ apart in the rod frame. **Move the time slider** to see the measurement does not depend on when it is made.`,
      deps: ['rel-1.6', 'rel-1.10'],
      refs: ['Taylor–Wheeler §3.5', 'Schutz §1.8'],
      tags: ['length contraction', 'simultaneity'],
      scope: String.raw`Rigid rod in uniform motion; photographs of a fast object do not simply show the contracted shape (Terrell and Penrose, 1959): light-travel time also matters.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Length_contraction' },
      viz(v) {
        const bS = v.slider('rod speed $v/c$', 0, 0.95, 0.6, { step: 0.01 });
        const LS = v.slider('rest length $L_0$', 1, 4, 3, { step: 0.05 });
        const tS = v.slider('measurement time $ct$', 0.5, 4, 2, { step: 0.05 });
        const who = v.select('who measures', [{ value: 'g', label: 'ground measures the rod' }, { value: 'r', label: 'rod measures the ground' }], 'g');
        const D = v.stage({ x: [-1.5, 9.5], y: [-1, 5.6], equal: true, axes: false, height: 440, full: true, title: 'spacetime diagram in the ground frame' });
        let st = {};
        v.render(() => {
          const b = bS.value, L0 = LS.value, g = gam(b), c0 = tS.value;
          D.clip(() => {
            for (let k = 0; k <= 9; k++) D.line(k, -1, k, 5.6, { color: 'accent', width: 1.4, alpha: k === 0 ? 0.9 : 0.45 });
            D.poly([[-b, -1], [L0 / g - b, -1], [L0 / g + b * 5.6, 5.6], [b * 5.6, 5.6]], { fill: 'orange', fillAlpha: 0.16, stroke: false });
            D.line(b * -1, -1, b * 5.6, 5.6, { color: 'orange', width: 2.4 }); D.line(L0 / g + b * -1, -1, L0 / g + b * 5.6, 5.6, { color: 'orange', width: 2.4 });
          });
          lightLines(D, 8, { alpha: 0.25 }, 0, 0);
          if (who.value === 'g') {
            const x1 = b * c0, x2 = b * c0 + L0 / g;
            D.line(-1.5, c0, 9.5, c0, { color: 'ink', width: 1.4, dash: [4, 3] });
            D.dot(x1, c0, { r: 6, color: 'green' }); D.dot(x2, c0, { r: 6, color: 'green' });
            D.measure(x1, c0 + 0.0, x2, c0 + 0.0, `L = ${v.fix(L0 / g, 2)}`);
            st = { w: 'g', val: L0 / g, L0, g };
          } else {
            // rod's simultaneity line ct = b x + k, through the rod's rear end at ground time c0
            const xr = b * c0, k = c0 - b * xr, a = Math.floor(xr + 1.5), d = 1;
            const pt = (x) => [x, b * x + k];
            D.line(-1.5, b * -1.5 + k, 9.5, b * 9.5 + k, { color: 'ink', width: 1.4, dash: [4, 3] });
            const [x1, t1] = pt(a), [x2, t2] = pt(a + d);
            D.dot(x1, t1, { r: 6, color: 'green' }); D.dot(x2, t2, { r: 6, color: 'green' });
            D.text(`ruler unit = $${v.fix(d / g, 2)}$ in the rod frame`, x2, t2, { dx: 10, dy: -12, size: 12, color: 'green', align: 'left' });
            st = { w: 'r', val: d / g, L0, g };
          }
        });
        v.legend([['orange', 'the rod'], ['accent', 'ground ruler ticks'], ['ink', 'line of simultaneity of the measurer', { dash: true }]]);
        v.readout(() => {
          if (!st.g) return '';
          return st.w === 'g' ? String.raw`Ground frame: both ends marked at the same ground time: $L=${v.fix(st.val, 3)}$, and $L_0/\gamma=${v.fix(st.L0 / st.g, 3)}$ ($\gamma=${v.fix(st.g, 3)}$).` : String.raw`Rod frame: two ground ticks that are $1$ apart in the ground frame are $${v.fix(st.val, 3)}=1/\gamma$ apart at one instant of the rod's time. The contraction is reciprocal.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────── 1.12
    {
      num: '1.12',
      kind: 'Phenomenon',
      name: 'Cosmic-ray muons reach the ground',
      credit: 'Rossi & Hall, 1941; Frisch & Smith, 1963',
      statement: String.raw`Muons are made high in the atmosphere by cosmic rays and have a mean lifetime $\tau=2.1969811\ \mu$s at rest, so with $c\tau\approx0.66$ km a muon of speed $\beta c\approx c$ would be expected to travel only $\beta c\tau$ on average; yet many reach sea level, some $15$ km below. A muon of total energy $E$ lives $\gamma\tau$ in the Earth's frame, with $\gamma=E/(mc^2)$, so the surviving fraction after a path $d$ is $\exp(-d/(\beta\gamma c\tau))$ instead of $\exp(-d/(\beta c\tau))$. In the muon's frame the same fraction is explained by a contracted atmosphere, of thickness $d/\gamma$.`,
      idea: String.raw`Time dilation (rel-1.10) stretches the muon's lifetime by $\gamma$ as seen from the ground; length contraction (rel-1.11) shortens the atmosphere by the same $\gamma$ as seen by the muon, and both give the same survival probability $e^{-d/(\gamma\beta c\tau)}$, as the invariance of the interval requires. Rossi and Hall (1941) compared muon counts at two heights in Colorado and found the decay in flight to be slower than the lifetime at rest would allow; Frisch and Smith (1963) measured a second altitude comparison, counting about 563 muons per hour on Mount Washington and about 408 at sea level at Cambridge, Massachusetts (Table I); after accidental-count corrections the paper uses397/550=0.722±0.021.`,
      caption: String.raw`**Choose the setting and drag the energy slider.** Left: the fraction of muons still alive at each height as they descend from their birth altitude, with the "naive" lifetime (grey) and the dilated one (blue). Right: the same trip in the muon's own frame, where the atmosphere is contracted to $h/\gamma$ and the muon's lifetime is the ordinary one. In the Mount Washington setting the green mark is the paper's background-corrected 397/550 benchmark for1.907km, independent of the adjustable toy model.`,
      deps: ['rel-1.10', 'rel-1.11', 'ode-1.5'],
      refs: ['Frisch–Smith1963,complete paper §§III–V,Table I,p355; Rossi–Hall1941 pp223,225,228; PDG2024 muon listing'],
      tags: ['muon', 'time dilation', 'cosmic rays'],
      scope: String.raw`A single-speed model: energy loss, the spread of production heights and of energies are ignored, and the “15 km” is an illustrative round number, not a measured mean. Frisch–Smith Table I gives 563±10 and408±9 counts/h; p.355 uses corrected 397/550=0.722±0.021 over 1.907km. Their effective prediction 8.4±2 accounts for slowing/geometry; the 8.8±0.8 reported statistical result is not a precision single-speed fit. The preset energy is only an effective-γ illustration.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Experimental_testing_of_time_dilation' },
      viz(v) {
        const mode = v.select('setting', [{ value: 'atm', label: 'atmosphere, 15 km' }, { value: 'fs', label: 'Mount Washington' }], 'atm', {
          onChange: () => { if (mode.value === 'fs') { hS.set(1.907); EG.set(.1056583755*8.4); } else { hS.set(15); EG.set(3); } },
        });
        const EG = v.slider('muon energy $E$ (GeV)', 0.2, 50, 3, { log: true });
        const hS = v.slider('height $h$ (km)', 1, 20, 15, { step: .001 });
        const A = v.stage({ x: [0, 20], y: [1e-12, 1.5], ylog: true, axes: 'box', gutter: true, height: 340, weight: 1.15, minWidth: 320, xlabel: 'height above ground (km)', ylabel: 'surviving fraction', title: 'in the ground frame' });
        const B = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, weight: 0.9, minWidth: 280, title: 'in the muon’s frame' });
        let st = {};
        v.render(() => {
          const E = EG.value / (M_MU / 1000), g = E, b = Math.sqrt(1 - 1 / (g * g)), h = hS.value;
          const ctau = C_KM_US * TAU_MU, Ln = b * ctau, Ld = b * g * ctau;
          const sn = (z) => Math.exp(-(h - z) / Ln), sd = (z) => Math.exp(-(h - z) / Ld);
          const Z = h;
          A.fn((z) => Math.max(sn(z), 1e-13), { domain: [0, Z], color: 'muted', width: 2, n: 120 });
          A.fn((z) => sd(z), { domain: [0, Z], color: 'accent', width: 2.6, n: 120 });
          A.dot(0, sd(0), { r: 6, color: 'accent' }); A.dot(0, Math.max(sn(0), 1e-13), { r: 6, color: 'muted' });
          if (mode.value === 'fs') A.dot(0,397/550,{r:7,color:'green',label:'paper397/550 (1.907km)', labelPos: 'ne' });
          // muon frame: lengths in km
          const bars = [['atmosphere, ground frame', h, 'muted'], ['atmosphere, muon frame ($h/\\gamma$)', h / g, 'accent'], ['mean path in the muon\'s lifetime ($\\beta c\\tau$)', Ln, 'orange']];
          const mx = Math.max(h, Ln) * 1.05;
          bars.forEach(([lab, len, col], i) => { const y = 0.82 - i * 0.3; B.rect(0.02, y - 0.05, 0.02 + 0.94 * (len / mx), y + 0.05, { fill: col, fillAlpha: 0.5, color: col, width: 1.4 }); B.text(lab + ` = ${v.fix(len, len < 1 ? 3 : 2)} km`, 0.02, y + 0.13, { size: 12, color: 'ink', align: 'left' }); });
          st = { g, b, h, Ln, Ld, sn: sn(0), sd: sd(0) };
        });
        v.legend([['muted', 'without time dilation'], ['accent', 'with time dilation']]);
        v.readout(() => {
          if (!st.g) return '';
          return String.raw`$E/mc^2=\gamma=${v.fix(st.g, 2)}$, $\beta=${v.fix(st.b, 5)}$. Mean path $\beta c\tau=${v.fix(st.Ln, 3)}$ km without dilation, $\beta\gamma c\tau=${v.fix(st.Ld, 2)}$ km with it. Survival after ${v.fix(st.h, 1)} km: $${v.sci(st.sn, 2)}$ (naive) against $${v.sci(st.sd, 2)}$ (dilated); the muon sees an atmosphere ${v.fix(st.h / st.g, 3)} km thick.` + (mode.value === 'fs' ? String.raw` Paper benchmark at 1.907km: corrected 397/550=$${v.fix(397/550,3)}$ (reported 0.722±0.021); raw Table I means 408±9/563±10 per hour. The effective preset is not a monoenergetic fit.` : '');
        });
      },
    },
  ],
};
