// Architecture & Structural Form — Chapter 3: Arches and the line of thrust (items 3.1–3.7; 3.8–3.14 are in ch03-b.js)
//
// Sources checked (Oct 2026):
//   Heyman, "The stone skeleton", Int. J. Solids Struct. 2 (2): 249–279 (1966), doi:10.1016/0020-7683(66)90018-7 (Crossref);
//     the three assumptions (no tensile strength, unlimited compressive strength, no sliding) and the safe theorem as stated in
//     Heyman's later accounts and in Wikipedia "Line of thrust". Heyman, "The safety of masonry arches", Int. J. Mech. Sci. 11:
//     363–385 (1969), doi:10.1016/0020-7403(69)90070-8 (geometric factor of safety).
//   Minimum thickness of a semicircular arch under its own weight: Couplet 1730 (hinges assumed at 45°, t/R ≈ 0.101), Heyman's
//     approximation (hinge at 58.8°, t/R ≈ 0.106), the complete solution by Milankovitch giving t/R = 0.10748 with R the MEAN radius
//     (Nikolić, "Graphical simulation of minimum thickness of clamped pointed arch", Savremena dostignuća u građevinarstvu,
//     Subotica 2016, paper 019, Table 2 — which also tabulates the segmental/pointed cases used as a check here); radial joints.
//     Makris & Alexakis, Arch. Appl. Mech. 83: 1511–1533 (2013), doi:10.1007/s00419-013-0763-4: vertical joints give 0.1095.
//   Hooke's anagram: appended to A Description of Helioscopes (London, 1676; some accounts date it 1675); the solution "Ut pendet
//     continuum flexile, sic stabit contiguum rigidum inversum" was published after his death (1705, Posthumous Works).
//   Gaudí's hanging models for the Colònia Güell church (commissioned 1898): strings with small bags of shot, viewed inverted.
//   Poleni's hanging-chain analysis of the dome of St Peter's (1748): see arch-4.6.
//   Computation: every arch here is a stack of voussoirs with radial joints and weights from their polygon areas; thrust lines are
//   found by linear programming (see ch03.shared.js), checked against the published values above.

import { arch, archFromLine, archKey, thrustRows, thrustLP, thrustRange, thrustLine, hinges, minThickness, collapseFactor, centralLine, bestFit, drawArch, drawThrust, funicular, uFromEnds, momentCoef, rot, clamp, f2, drawSupport, placeLabels, blockAt, extradosY } from './ch03.shared.js';

const kN = (x, d = 3) => `${Math.abs(x) < 0.05 ? 0 : x.toLocaleString('en-US', { maximumSignificantDigits: d })} kN`;
const deg = (r) => (r * 180) / Math.PI;
const arrowStyle = (c, w = 2) => ({ color: c, width: w });

export default {
  collection: 'arch',
  chapter: 3,
  title: 'Arches and the line of thrust',
  summary: String.raw`Hooke saw that a hanging chain, turned upside down, gives the shape of an arch that stands in pure compression. In a masonry arch the line of thrust is the path of the internal compressive force; Heyman’s safe theorem says that if any such line fits inside the stones, the arch will stand. Masonry is thus a matter of geometry rather than strength: an arch fails by opening hinges, not by crushing, and buttresses, pinnacles and pointed arches are all ways of keeping the line of thrust inside the masonry. Every picture in this chapter is computed by the same small engine: voussoirs with real weights, joints, and a linear program that finds the thrust lines that fit.`,
  items: [
    // ───────────────────────────────────────────────────────────────────────────────────── 3.1
    {
      num: '3.1',
      kind: 'Principle',
      name: 'Hooke’s inversion applied to masonry design',
      statement: String.raw`A flexible chain carrying weights hangs in the funicular polygon of those weights, every link in tension. Turn the picture upside down and every tension becomes a compression: a rigid arch whose axis follows the inverted shape is in equilibrium under the same loads with a line of thrust running along its axis and no bending anywhere. For masonry, which resists compression but not tension, this is a design method: choose the weights that stand for the voussoirs and whatever sits on them, hang them on a chain, invert it, and the arch stands for those loads however thin it is. When the loads change, the arch still stands as long as *some* funicular of the new loads (some horizontal thrust, some end points) fits inside the stone.`,
      idea: String.raw`Hanging and standing are one equilibrium with the signs reversed: at each weight the two chain tensions and the weight close a force triangle (arch-1.4), and the horizontal component $H$ is the same all along (arch-1.5; arch-2.1 has the cable do it). Inverting the picture turns tensions into compressions without changing a force or a length, so the inverted chain is a line of thrust. Its height at any point is the beam moment divided by $H$, so a larger $H$ gives a flatter arch. A thick ring contains many funiculars, which is why real masonry tolerates changes of load that a thin one cannot (solid-9.10 treats the hanging chain itself).`,
      caption: String.raw`The left panel is the chain hanging from two pins, the right panel the same shape turned over, with the stones set around it. Drag any column of weight (down on the chain, up on the arch) to make it heavier or lighter, or pick a preset; change the rise, the thickness of the stone ring, and add an extra load $Q$ on one block. The red line is the most central thrust line that fits the ring; it turns orange where it leaves the stone. Thin the ring or load the arch until no line fits, and the readout gives the thickness that would have been needed. The loads are illustrative numbers, not a real building.`,
      deps: ['arch-2.1', 'solid-9.10'],
      see: ['arch-3.13', 'arch-4.6', 'arch-3.5'],
      refs: ['Heyman'],
      credit: 'Hooke, announced 1675–76; used by Poleni (1748) and Gaudí (hanging models for the Colònia Güell church, from 1898)',
      scope: String.raw`Plane arch of constant thickness under vertical point loads; no sliding, no crushing (arch-3.4). The loads, in kN per metre of depth, are illustrative.`,
      tags: ['hooke', 'funicular', 'form-finding'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Funicular_curve' },
      viz(v) {
        const N = 12, xj = (j) => -1 + (2 * j) / N, xk = (k) => -1 + (2 * k + 1) / N;
        const semi = (() => { const a = arch({ R: 1, t: 0.2, N }); return a.blocks.map((b) => (b.W / a.W) * 120); })();
        const PRE = { semi, equal: Array(N).fill(10), lantern: semi.map((w, k) => (k === 5 || k === 6 ? w + 30 : w)), side: semi.map((w, k) => (k > 6 ? w * 1.7 : w)) };
        const P = semi.slice();
        v.select('weights', [{ value: 'semi', label: 'semicircular ring' }, { value: 'equal', label: 'equal weights' }, { value: 'lantern', label: 'heavy crown' }, { value: 'side', label: 'one-sided' }], 'semi', { onChange: (val) => { PRE[val].forEach((w, k) => { P[k] = w; }); v.invalidate(); } });
        const rise = v.slider('rise of the line, h (span = 2)', 0.35, 1.4, 0.9, { step: 0.01 });
        const thick = v.slider('thickness of the ring, t', 0.02, 0.4, 0.14, { step: 0.005 });
        const live = v.slider('extra load Q (kN)', 0, 150, 0, { step: 1 });
        const kl = v.slider('Q acts on block no.', 1, N, 3, { int: true });
        const S = v.stage({ x: [-1.4, 1.4], y: [-2.0, 0.4], equal: true, axes: false, height: 330, title: 'hanging: the chain in tension' });
        const A = v.stage({ x: [-1.4, 1.4], y: [-0.4, 2.0], equal: true, axes: false, height: 330, title: 'turned over: the arch in compression' });
        let M = null;
        for (const [st, sg] of [[S, -1], [A, 1]]) {
          let drag = null;
          st.onDrag((x, y, ph) => {
            if (ph === 'start') { const k = clamp(Math.floor(((x + 1) / 2) * N), 0, N - 1); drag = Math.abs(x) <= 1.02 ? { k, y0: y, P0: P[k] } : null; }
            else if (drag) P[drag.k] = clamp(drag.P0 + sg * (y - drag.y0) * 110, 0, 260);
            if (ph === 'end') drag = null; v.invalidate();
          });
        }
        function model() {
          const loads = P.map((p, k) => ({ x: xk(k), P: p, k }));
          const Fn = funicular(loads.map((l) => ({ x: l.x + 1, P: l.P })), 0, 0, 2, 1);
          const at = (x) => { const X = x + 1; for (let i = 1; i < Fn.xs.length; i++) if (X <= Fn.xs[i] + 1e-12) return Fn.ys[i - 1] + ((X - Fn.xs[i - 1]) / (Fn.xs[i] - Fn.xs[i - 1])) * (Fn.ys[i] - Fn.ys[i - 1]); return 0; };
          const Hd = -at(0) / rise.value, pts = Array.from({ length: N + 1 }, (_, j) => [xj(j), -at(xj(j)) / Hd]);
          const mk = (t) => archFromLine(pts, t, 0), all = live.value > 0 ? [...loads, { x: xk(kl.value - 1), P: live.value, k: kl.value - 1 }] : loads;
          const g = mk(thick.value), c = centralLine(g, all), fit = bestFit(mk, () => all, {}, 1e-3, 3, 18);
          const u = c ? c.u : fit ? fit.u : [Hd, 0, 0], tl = thrustLine(g, all, u);
          return { loads: all, g, tl, ok: !!c, eps: c ? c.eps : 0, tmin: fit ? fit.t : NaN, Hd, tot: loads.reduce((s, l) => s + l.P, 0), H: u[0] };
        }
        v.render(() => {
          const m = M = model();
          const yAt = (x) => { const tl = m.tl; for (let i = 1; i < tl.length; i++) if (x <= tl[i].p[0] + 1e-9) { const a = tl[i - 1].p, b = tl[i].p; return a[1] + ((x - a[0]) / (b[0] - a[0] || 1)) * (b[1] - a[1]); } return 0; };
          for (const [st, sg] of [[S, -1], [A, 1]]) {
            const Y = (y) => sg * y;
            st.line(-1.3, 0, 1.3, 0, { color: 'faint', dash: [3, 4], width: 1 });
            if (sg > 0) m.g.blocks.forEach((b, k) => st.poly(b.poly, { fill: 'muted', fillAlpha: 0.14 + (k % 2 ? 0.06 : 0), color: 'ink', alpha: 0.7, width: 1 }));
            drawThrust(v, st, m.tl.map((q) => ({ ...q, p: [q.p[0], Y(q.p[1])] })), { color: 'red', width: 2.6 });
            for (const x of [-1, 1]) st.dot(x, 0, { r: 5, color: 'ink' });
            m.loads.forEach((l, i) => {
              const nx = l.x, ny = Y(yAt(nx)), col = i >= N ? 'orange' : 'accent', len = 0.1 + 0.0036 * l.P;
              if (sg < 0) { const sd = 0.04 + 0.0075 * Math.sqrt(l.P); st.line(nx, ny, nx, ny - len, { color: 'muted', width: 1 }); st.rect(nx - sd, ny - len - 2 * sd, nx + sd, ny - len, { fill: col, fillAlpha: 0.35, color: col, width: 1.4, radius: 2 }); }
              else st.arrow(nx, ny + len, nx, ny + 0.015, { color: col, width: 2, head: 7 });
            });
          }
          v.legend([['red', 'chain = thrust line'], ['accent', 'weights of the blocks'], ['orange', 'extra load Q'], ['muted', 'stone ring', { area: true }]]);
        });
        v.readout(() => {
          const m = M || model(), st = m.ok ? `**stands**: the line keeps ${f2(m.eps, 3)} from the nearest edge (thickness ${f2(thick.value, 3)})` : `**falls**: no line fits; this loading needs $t \\ge ${f2(m.tmin, 3)}$`;
          return `Dead load ${kN(m.tot)} · horizontal thrust $H = ${f2(m.H, 1)}$ kN · the design line (no extra load) has $H = ${f2(m.Hd, 1)}$ kN, so $H/\\text{load} = ${f2(m.Hd / m.tot, 3)}$ at rise ${f2(rise.value, 2)} (half-span 1).\n${st}${live.value > 0 ? ` with Q = ${live.value} kN on block ${kl.value}` : ''}; the smallest ring that carries these loads is $t_{\\min} = ${f2(m.tmin, 3)}$.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 3.2
    {
      num: '3.2',
      kind: 'Definition',
      name: 'Line of thrust',
      statement: String.raw`Cut a masonry arch along any joint. The part on one side of the cut is held in equilibrium by its support, its own weight and the loads on it, and by the force that the other part exerts across the joint. That force has a magnitude, a direction and a line of action, and it crosses the joint at a single point. The **line of thrust** is the locus of these crossing points over all the joints: a polygon, in the limit of ever thinner voussoirs a curve. It is the funicular polygon of the loads on the arch, and it marks the path along which the compressive force runs through the stone. If it crosses a joint of depth $t$ at distance $e$ from the middle, the whole joint is in compression while $|e| \le t/6$ (the middle third); for $t/6 < |e| \le t/2$ part of the joint is open (cracked); beyond $t/2$ the line has left the stone and the joint cannot carry the force.`,
      idea: String.raw`Each cut gives a free-body diagram (arch-1.3): the support reaction, the weight of the piece and the force across the cut close a triangle (arch-1.4), so the cut force is fixed once the reaction is. Its horizontal component is the same at every cut, the horizontal thrust $H$. The point where it crosses the joint follows from moment balance about that point, which is exactly the funicular construction of arch-1.5. A masonry arch has three redundant reactions, so many lines of thrust are in equilibrium with the same loads (arch-3.5 takes advantage of that); Hooke's chain (arch-3.1) is one of them.`,
      caption: String.raw`Pick the cut with **joint** and read off the free body to its left: the reaction, the weight of the stones, and the force across the cut, with the small triangle showing that they close. **Thrust** slides the whole line between the lowest and highest horizontal thrust that the ring allows, and every position is a possible state of equilibrium. Thin the ring until the slider has nowhere to go.`,
      deps: ['arch-3.1', 'arch-1.5'],
      see: ['arch-3.5', 'arch-3.7'],
      refs: ['Heyman'],
      scope: String.raw`Plane arch with radial joints under self-weight; units are a half-span of 1 and a unit weight of 22 kN/m³ per metre of depth.`,
      tags: ['thrust line', 'free body'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Line_of_thrust' },
      viz(v) {
        const N = 24, tS = v.slider('thickness t / R', 0.05, 0.4, 0.2, { step: 0.005 });
        const jS = v.slider('joint', 1, N - 1, 7, { int: true }), thr = v.slider('thrust: min (0) → max (1)', 0, 1, 0.5, { step: 0.01 });
        const A = v.stage({ x: [-1.35, 1.35], y: [-0.55, 1.35], equal: true, axes: false, height: 340, weight: 1.5, title: 'the arch cut at joint j' });
        const T = v.stage({ x: [-1.2, 1.2], y: [-1.3, 1.3], equal: true, axes: false, height: 340, weight: 1, minWidth: 240, title: 'force triangle of the left piece' });
        let M = null;
        v.render(() => {
          const g = arch({ R: 1, t: tS.value, N }), rg = thrustRange(g, []);
          thr.el.hidden = !rg;
          if (!rg) { drawArch(v, A, g); A.corner('no thrust line fits this ring: it collapses', 'tl', { color: 'red' }); M = { g }; return; }
          const u = rg.min.map((a, i) => a + thr.value * (rg.max[i] - a)), tl = thrustLine(g, [], u), j = jS.value, q = tl[j];
          const left = g.blocks.slice(0, j).reduce((s, b) => s + b.W, 0), xw = g.blocks.slice(0, j).reduce((s, b) => s + b.W * b.cx, 0) / left, yw = g.blocks.slice(0, j).reduce((s, b) => s + b.W * b.cy, 0) / left;
          drawArch(v, A, g, { blockColor: (k) => (k < j ? 'accent' : 'muted'), fillAlpha: 0.1 });
          drawThrust(v, A, tl, { color: 'red', width: 2.2 });
          const J = g.joints[j]; A.line(J.a[0], J.a[1], J.b[0], J.b[1], { color: 'orange', width: 3 });
          A.dot(q.p[0], q.p[1], { r: 5, color: 'red' });
          const sc = 0.42 / Math.hypot(u[0], u[1]);
          const R0 = [u[0], u[1]], Wl = [0, -left], C = [-u[0], -(u[1] - left)];
          A.arrow(g.c0[0] - sc * R0[0], g.c0[1] - sc * R0[1], g.c0[0], g.c0[1], { color: 'accent', width: 2.4, head: 8 });
          A.arrow(xw, yw, xw, yw - sc * left, { color: 'gold', width: 2.4, head: 8 });
          A.arrow(q.p[0] - sc * C[0], q.p[1] - sc * C[1], q.p[0], q.p[1], { color: 'red', width: 2.4, head: 8 });
          A.text('R', g.c0[0] - sc * R0[0], g.c0[1] - sc * R0[1], { dx: -9, dy: 6, color: 'accent', size: 12, weight: 650 });
          A.text('W', xw, yw - sc * left, { dx: 9, dy: 8, color: 'gold', size: 12, weight: 650 });
          A.text('F', q.p[0] - sc * C[0], q.p[1] - sc * C[1], { dx: 10, dy: -6, color: 'red', size: 12, weight: 650 });
          // triangle R -> W -> F
          const k = 1.5 / Math.max(Math.hypot(...R0), Math.hypot(...C), left), o = [-0.5 * k * R0[0] - 0.1, -0.5 * k * R0[1] + 0.1];
          const p1 = [o[0] + k * R0[0], o[1] + k * R0[1]], p2 = [p1[0] + k * Wl[0], p1[1] + k * Wl[1]], p3 = [p2[0] + k * C[0], p2[1] + k * C[1]];
          T.arrow(o[0], o[1], p1[0], p1[1], { color: 'accent', width: 3, head: 9 }); T.arrow(p1[0], p1[1], p2[0], p2[1], { color: 'gold', width: 3, head: 9 }); T.arrow(p2[0], p2[1], p3[0], p3[1], { color: 'red', width: 3, head: 9 });
          T.text('reaction R', (o[0] + p1[0]) / 2, (o[1] + p1[1]) / 2, { dx: -8, dy: -6, color: 'accent', size: 12, align: 'right', weight: 600 });
          T.text('weight W', (p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2, { dx: 8, color: 'gold', size: 12, align: 'left', weight: 600 });
          T.text('cut force F', (p2[0] + p3[0]) / 2, (p2[1] + p3[1]) / 2, { dx: 8, dy: 8, color: 'red', size: 12, align: 'left', weight: 600 });
          T.dot(o[0], o[1], { r: 3, color: 'ink' });
          T.corner(`closure error ${Math.hypot(p3[0] - o[0], p3[1] - o[1]).toExponential(0)}`, 'bl', { color: 'muted' });
          M = { g, u, q, left, rg, j, F: Math.hypot(...C) };
        });
        v.legend([['red', 'line of thrust'], ['orange', 'the cut'], ['accent', 'stones to the left of the cut', { area: true }]]);
        v.readout(() => {
          if (!M || !M.u) return `No line of thrust fits inside this ring: it is below the minimum thickness (see 3.7).`;
          const { g, q, left, rg, F, j } = M, e = (q.t - 0.5) * g.t, third = Math.abs(e) <= g.t / 6;
          return `Cut at joint ${j} of ${N}: the force across it is $F = ${f2(F, 2)}$ kN per m (reaction ${f2(M.u[1], 2)} up, stones' weight ${f2(left, 2)}), horizontal part $H = ${f2(M.u[0], 2)}$ kN, the thrust there slopes at ${f2(deg(Math.atan2(M.u[1] - left, M.u[0])), 0)}° to the horizontal.\nThe line crosses the joint at $e = ${f2(e, 3)}$ from its middle (positive towards the extrados; $t/2 = ${f2(g.t / 2, 3)}$, $t/6 = ${f2(g.t / 6, 3)}$): ${third ? 'inside the middle third, the whole joint is in compression' : Math.abs(e) <= g.t / 2 ? 'outside the middle third: part of the joint is open (cracked)' : 'outside the stone'}. Allowed $H$ for this ring: ${f2(rg.Hmin, 2)} to ${f2(rg.Hmax, 2)} kN.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 3.3
    {
      num: '3.3',
      kind: 'Concept',
      name: 'Voussoirs, keystone and centering',
      statement: String.raw`A masonry arch is built of wedge-shaped stones, the **voussoirs**, with the **keystone** at the crown. While it is being built an arch has no horizontal thrust: each half is a stack of stones leaning inward, and it can stand on its own only as far up the haunch as the weight of the stones above each joint still falls inside that joint. Above that height the half would topple inward, so the stones are carried on a timber framework, the **centering**, until the keystone closes the ring. Closing the ring is what creates the thrust: the two halves now push on each other, the force across every joint is a line of thrust (arch-3.2), and the centering can be struck if the ring is thick enough for some line of thrust to fit inside it.`,
      idea: String.raw`In a half without a keystone the only force across a joint is the weight of the stones above it, acting vertically through their common centre of gravity (the free end carries nothing, $H = 0$); this is a line of thrust that is a vertical, so the joint holds if that vertical passes through it. Near the springing the joints are almost horizontal and the stones are nearly on top of each other, so the vertical passes through; higher up the joints turn steep and it does not. With the keystone in place the problem is the arch problem of arch-3.2: the admissible thrusts form an interval, and striking the centering is the test of whether it is empty (no sliding and no tension are assumed, arch-3.4).`,
      caption: String.raw`Raise the number of stones on each side. With the centering in place everything stands; switch it off to strike it. Up to some height each half stands alone (red thrust line), above it the stones above the first failing joint turn red and fall inward. With all stones in, set the keystone and strike the centering again: the ring now stands only if the thrust interval is not empty, so thin the ring to see an arch that falls when its centering is removed.`,
      deps: ['arch-1.6'],
      see: ['arch-3.2', 'arch-3.7'],
      refs: ['Salvadori'],
      scope: String.raw`Radial joints, semicircular ring, stones that cannot slide and have no tensile strength; the centering is idealised as a rigid support under the intrados.`,
      tags: ['construction', 'keystone'],
      viz(v) {
        const nS = 8, g0 = (t) => archKey({ R: 1, t, nSide: nS, key: 0.2 });
        const tS = v.slider('thickness t / R', 0.05, 0.4, 0.18, { step: 0.005 });
        const nn = v.slider('stones set on each side', 0, nS, 5, { int: true });
        const key = v.toggle('keystone set', false), cen = v.toggle('centering in place', true);
        const A = v.stage({ x: [-1.45, 1.45], y: [-0.25, 1.35], equal: true, axes: false, height: 330, title: 'building the arch on its centering' });
        const halfOK = (g, n) => {
          // n stones on the left half (blocks 0..n-1): vertical through the centroid of the cap above each joint must cross the joint
          const rows = []; let bad = -1;
          for (let j = 0; j < n; j++) {
            let W = 0, xs = 0; for (let k = j; k < n; k++) { W += g.blocks[k].W; xs += g.blocks[k].W * g.blocks[k].cx; }
            const xb = xs / W, J = g.joints[j], dx = J.b[0] - J.a[0], t = Math.abs(dx) < 1e-9 ? 0.5 : (xb - J.a[0]) / dx;
            rows.push({ j, t, p: [xb, J.a[1] + t * (J.b[1] - J.a[1])] }); if ((t < -1e-9 || t > 1 + 1e-9) && bad < 0) bad = j;
          }
          return { rows, bad };
        };
        let M = null;
        v.render(() => {
          const g = g0(tS.value), n = nn.value, full = n === nS; key.el.hidden = !full; if (!full) key.value = false;
          const placed = (k) => k < n || k >= g.N - n || (k === nS && full && key.value);
          const side = halfOK(g, n), keyed = full && key.value;
          let state = '', bad = -1, rg = null, tl = null;
          if (!cen.value) {
            if (keyed) { rg = thrustRange(g, []); const c = rg && centralLine(g, []); if (c) tl = thrustLine(g, [], c.u); state = rg ? 'ok' : 'falls'; }
            else if (side.bad >= 0) { bad = side.bad; state = 'topple'; } else state = 'free';
          } else state = 'supported';
          const col = (k) => (state === 'topple' && ((k >= bad && k < n) || (k >= g.N - n && k < g.N - bad)) ? 'red' : state === 'falls' ? 'red' : 'muted');
          // ghost of missing stones
          g.blocks.forEach((b, k) => { if (!placed(k)) A.path([...b.poly, b.poly[0]], { color: 'faint', width: 1, dash: [3, 3] }); });
          g.blocks.forEach((b, k) => { if (placed(k)) A.poly(b.poly, { fill: col(k), fillAlpha: col(k) === 'red' ? 0.3 : 0.16 + (k % 2 ? 0.06 : 0), color: 'ink', width: 1, alpha: 0.85 }); });
          if (cen.value) {
            const pts = Array.from({ length: 41 }, (_, i) => { const th = Math.PI - (Math.PI * i) / 40; return [(g.ri - 0.035) * Math.cos(th), (g.ri - 0.035) * Math.sin(th)]; });
            A.path(pts, { color: 'gold', width: 4, alpha: 0.9 });
            for (const th of [0.2, 0.7, 1.2, 1.9, 2.4, 2.94]) { const x = (g.ri - 0.035) * Math.cos(th), y = (g.ri - 0.035) * Math.sin(th); A.line(x, y, x * 0.3, -0.1, { color: 'gold', width: 1.6, alpha: 0.75 }); }
            A.line(-0.3 * 1, -0.1, 0.3, -0.1, { color: 'gold', width: 2 });
          }
          if (!cen.value && state !== 'ok' && state !== 'falls') for (const sg of [1, -1]) { const pts = side.rows.map((r) => [sg * r.p[0], r.p[1]]); if (pts.length) { const last = g.joints[n]; pts.push([sg * (g.blocks[n - 1]?.cx ?? 0), last.a[1]]); A.path(pts, { color: 'red', width: 2 }); } }
          if (tl) drawThrust(v, A, tl, { color: 'red', width: 2.4 });
          A.line(-1.4, 0, 1.4, 0, { color: 'faint', dash: [3, 4], width: 1 });
          A.corner(state === 'supported' ? 'stones carried by the centering' : state === 'topple' ? 'the free halves tip inward: the vertical through their weight leaves joint ' + bad : state === 'free' ? 'each half stands alone as a cantilever' : state === 'ok' ? 'ring closed, centering struck: it stands' : state === 'falls' ? 'no thrust line fits: it collapses when the centering is struck' : '', 'tl', { color: state === 'topple' || state === 'falls' ? 'red' : 'muted' });
          let nfree = 0; for (let m = 1; m <= nS; m++) { if (halfOK(g, m).bad < 0) nfree = m; else break; }
          M = { state, rg, nfree, ang: nfree ? deg(Math.PI - g.joints[nfree].th) : 0, g, bad, n };
        });
        v.legend([['gold', 'timber centering'], ['red', 'line of thrust / stones that fall'], ['muted', 'voussoirs', { area: true }]]);
        v.readout(() => {
          if (!M) return '';
          const base = `Without centering each half can be built up by **${M.nfree}** of ${nS} stones (to ${f2(M.ang, 0)}° above the springing) before it needs support.`;
          if (M.state === 'ok') return `${base}\nWith the keystone in and the centering struck, the ring stands: its horizontal thrust can be anything from ${f2(M.rg.Hmin, 2)} to ${f2(M.rg.Hmax, 2)} kN per m (arch weight ${f2(M.g.W, 1)} kN per m).`;
          if (M.state === 'falls') return `${base}\nWith this thickness no line of thrust fits (the minimum for a semicircular ring is $t/R \\approx 0.107$, arch-3.7): the ring collapses as the centering is struck.`;
          return base;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 3.4
    {
      num: '3.4',
      kind: 'Concept',
      name: 'Heyman’s assumptions for masonry',
      statement: String.raw`Heyman’s limit analysis of masonry rests on three assumptions about the material: **(1)** masonry has no tensile strength, so joints open freely; **(2)** its compressive strength is so large that crushing does not decide anything (stresses are low and the strength is treated as unlimited); **(3)** one stone cannot slide on another (the friction is enough). Under them a masonry structure behaves as a rigid-plastic system whose only way to fail is by forming hinges where the line of thrust touches the surface of the stone, and the safe theorem (arch-3.5) applies. The assumptions are good approximations for typical stone arches and vaults; they are not laws, and each one has a failure mode that appears when it is dropped: crushing at a hinge, sliding along a joint, and, if tension is allowed, extra capacity that cannot be relied on.`,
      idea: String.raw`Each assumption removes one way for a joint to yield. Zero tension means a joint carries only a compressive resultant that lies inside the section, so the admissible region for the line of thrust is the stone itself (arch-3.2). Unlimited compression lets the resultant touch the surface, so a hinge is a point; with a finite strength $\sigma$ the force $F$ needs a contact length, and a triangular stress block puts the line at least $2F/3\sigma$ from the edge. No sliding lets the force cross a joint at any angle to its normal; with a friction coefficient $\mu$ the angle must stay below $\arctan\mu$. All three are linear inequalities on the thrust line, so each relaxation shrinks the set of admissible lines and can only lower the collapse load, apart from a ductile bond strength, which enlarges the set but is brittle in real mortar.`,
      caption: String.raw`A point load stands on the extrados of an arch of 10 m span (slide it and change the ring thickness). The bars are the collapse loads: first under Heyman's three assumptions (hinges only), then with a finite friction coefficient, with a finite compressive strength, and with a bond (tensile) strength, each computed with the slider values below ("falls" means no thrust line fits even before the load is added), and finally the combination selected by the toggles. Switch the three toggles on to combine relaxations: the picture shows the thrust line at collapse, hinges as discs, sliding joints as orange bars, and the readout names the mode that governs. The strengths are illustrative values, not data for any particular masonry.`,
      deps: ['arch-3.3', 'mech-1.15'],
      see: ['arch-3.5', 'solid-4.10'],
      refs: ['Heyman'],
      credit: 'Heyman, 1966',
      scope: String.raw`Plane arch, radial joints, self-weight 22 kN/m³ and a vertical point load per metre of depth. Crushing is modelled by a triangular stress block (line kept $2F/3\sigma$ from the edge), bond as a ductile tension block (eccentricity limit $t/2 + \sigma_t t^2/2F$), friction as a Coulomb limit on every joint.`,
      tags: ['heyman', 'limit analysis'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Line_of_thrust' },
      viz(v) {
        const N = 24, R = 5, P0 = 50;
        const tS = v.slider('ring thickness t (m)', 0.3, 1.2, 0.8, { step: 0.01 }), xS = v.slider('load position x (m)', -4.6, 4.6, -2.5, { step: 0.05 });
        const fT = v.toggle('finite friction', false), muS = v.slider('friction coefficient μ', 0.1, 1, 0.42, { step: 0.01 });
        const cT = v.toggle('finite compressive strength', false), sgS = v.slider('σ (MPa)', 0.05, 50, 1.2, { log: true });
        const bT = v.toggle('bond (tension) strength', false), btS = v.slider('σt (kPa)', 0, 600, 40, { step: 10 });
        const A = v.stage({ x: [-6.2, 6.2], y: [-0.5, 5.8], equal: true, axes: false, height: 330, weight: 1.5, title: 'the arch at collapse' });
        const Bc = v.stage({ x: [0.4, 5.6], y: [0, 100], axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 250, ylabel: 'collapse load (kN/m)', title: 'which assumption protects against what' });
        const cache = new Map();
        const run = (g, loads, useMu, useSig, useBond, key) => {
          const k = `${key}|${useMu ? muS.value : '-'}|${useSig ? sgS.value : '-'}|${useBond ? btS.value : '-'}`;
          if (cache.has(k)) return cache.get(k);
          let inset = null, res = null;
          for (let it = 0; it < (useSig || useBond ? 6 : 1); it++) {
            res = collapseFactor(g, loads, { mu: useMu ? muS.value : undefined, inset: inset ? (j) => inset[j] : 0 });
            if (!res) break;
            if (!useSig && !useBond) break;
            const tl = thrustLine(g, loads, res.u);
            inset = tl.map((q) => { const F = Math.hypot(q.F[0], q.F[1]) || 1; let d = 0; if (useSig) d += (2 * F) / (3 * sgS.value * 1000); if (useBond) d -= (btS.value * g.t * g.t) / (2 * F); return clamp(d, -0.45 * g.t, 0.45 * g.t); });
          }
          const out = res ? { lam: res.lam, u: res.u, inset: inset || null, mu: useMu ? muS.value : undefined } : null;
          if (cache.size > 400) cache.clear(); cache.set(k, out); return out;
        };
        let M = null;
        v.render(() => {
          const g = arch({ R, t: tS.value, N }), x = xS.value, loads = [{ x, P: P0, var: true, k: blockAt(g, x) }], key = `${tS.value}|${x}`;
          const use = [fT.value, cT.value, bT.value];
          muS.el.hidden = !fT.value; sgS.el.hidden = !cT.value; btS.el.hidden = !bT.value;
          const base = run(g, loads, false, false, false, key), onlyMu = run(g, loads, true, false, false, key), onlySg = run(g, loads, false, true, false, key), onlyBd = run(g, loads, false, false, true, key);
          const cur = run(g, loads, use[0], use[1], use[2], key);
          const lams = [base, onlyMu, onlySg, onlyBd].map((r) => (r ? r.lam * P0 : 0)), curL = cur ? cur.lam * P0 : 0;
          const ymax = Math.max(10, ...lams, curL) * 1.18; Bc.setView([0.4, 5.6], [0, ymax]);
          const rs = [base, onlyMu, onlySg, onlyBd, cur];
          Bc.bars([...lams, curL], { x0: 1, dx: 1, color: (val, i) => ['green', 'orange', 'red', 'purple', 'accent'][i], width: 0.55 });
          rs.forEach((r, i) => Bc.text(r ? ([...lams, curL][i]).toFixed(0) : 'falls', 1 + i, r ? [...lams, curL][i] : 0, { dy: -10, size: 11.5, color: r ? 'ink' : 'red', align: 'center' }));
          Bc.setTicks([[1, 'Heyman'], [2, 'friction'], [3, 'crushing'], [4, 'bond'], [5, 'selected']], null);
          // governing mode
          let mode = 'four-hinge mechanism (Heyman’s only failure)';
          if (cur && (use[0] || use[1] || use[2])) {
            const off = [0, 1, 2].filter((i) => use[i]).map((i) => { const u2 = use.slice(); u2[i] = false; const r = run(g, loads, u2[0], u2[1], u2[2], key); return { i, lam: r ? r.lam : 0 }; });
            const gov = off.filter((o) => o.lam > cur.lam * 1.002 + 1e-9).sort((a, b) => b.lam - a.lam)[0];
            if (gov) mode = ['sliding along a joint (friction too low)', 'crushing at a hinge (strength too low)', ''][gov.i];
            else if (use[2] && !use[0] && !use[1]) mode = 'four-hinge mechanism, with the extra capacity of the bond';
            else if (cur.lam >= (base ? base.lam : 0) * 0.998 && use[2]) mode = 'four-hinge mechanism, with the extra capacity of the bond';
          }
          drawArch(v, A, g, { fillAlpha: 0.12 });
          if (cur) {
            const L2 = loads.map((l) => ({ ...l, P: l.P })), tl = thrustLine(g, L2, cur.u);
            drawThrust(v, A, tl, { color: 'red', width: 2.2 });
            const hs = hinges(g, L2, cur.u, { mu: cur.mu, inset: cur.inset ? (j) => cur.inset[j] : 0, all: true }, 1e-5);
            for (const h of hs) { const J = g.joints[h.j]; if (h.side === 'a' || h.side === 'b') A.dot((h.side === 'a' ? J.a : J.b)[0], (h.side === 'a' ? J.a : J.b)[1], { r: 5, color: 'red' }); else A.line(J.a[0], J.a[1], J.b[0], J.b[1], { color: 'orange', width: 4 }); }
            const yl = extradosY(g, x); A.arrow(x, yl + 1.1, x, yl + 0.04, { color: 'gold', width: 3, head: 9 });
            A.text(`${(cur.lam * P0).toFixed(0)} kN/m`, x, yl + 1.12, { dy: -10, size: 12, weight: 650, color: 'gold', align: 'center' });
          }
          M = { cur, base, mode, g, curL, lams };
        });
        v.legend([['red', 'thrust line at collapse'], ['gold', 'load']]);
        v.readout(() => {
          if (!M || !M.cur) return 'No thrust line fits even without the load.';
          const rel = ['friction', 'crushing', 'bond'].filter((_, i) => [fT.value, cT.value, bT.value][i]);
          return `Arch weight ${f2(M.g.W, 0)} kN/m. Under Heyman's assumptions it carries **${f2(M.lams[0], 0)} kN/m** at this position, failing by hinges. With ${rel.length ? rel.join(' + ') : 'none of the relaxations'} switched on: **${f2(M.curL, 0)} kN/m**, ${f2(100 * M.curL / Math.max(1e-9, M.lams[0]), 0)}% of the Heyman value. Governing mode: **${M.mode}**.\nStress check: the force at a hinge is about ${f2(Math.hypot(...M.cur.u.slice(0, 2)), 0)} kN/m on a ${f2(tS.value, 2)} m joint, ${f2(Math.hypot(...M.cur.u.slice(0, 2)) / tS.value / 1000, 2)} MPa if spread over the whole depth (compare it with the strength σ you set).`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 3.5
    {
      num: '3.5',
      kind: 'Theorem',
      name: 'Heyman’s safe theorem',
      statement: String.raw`Take a masonry structure that obeys Heyman’s assumptions (arch-3.4) under given loads. If a line of thrust can be found that is in equilibrium with the loads and lies everywhere inside the masonry, the structure is **safe**: it will not collapse under those loads. The line need not be the one that actually acts, and need not be unique; its existence is enough, and one can search for it with any trial thrust. If no such line exists, safety can no longer be shown and the structure can collapse by forming hinges (arch-3.6). For an arch the admissible lines form a convex family, so the horizontal thrust that goes with them lies in an interval $[H_{\min}, H_{\max}]$ that shrinks to a point when the arch is at the limit of safety.`,
      idea: String.raw`This is the lower-bound (static) theorem of plastic theory (solid-4.10) for a material with no tensile strength and unlimited compressive strength: a state of equilibrium that violates no yield condition certifies safety, whatever the real state of the structure is. One does not need to know how the real arch is cracked, or how far its supports have moved, only that cracks and small movements let it find some admissible state. For the arch the three unknown reactions $(H, V_0, m_0)$ make every condition "the line crosses joint $j$ inside the stone" a linear inequality, so the admissible lines are a polytope whose extreme thrusts are found by a small linear program. Poleni's argument for the dome of St Peter's, and Hooke's inversion (arch-3.1), both use the idea in this form.`,
      caption: String.raw`Drag the two end points of the thrust line along the springing joints and set its horizontal thrust with the slider: the line is drawn in equilibrium with the arch's weight and the load, and is green only while it stays inside the stone. The dashed lines are the lowest and highest thrust lines that fit. Try drawing a line that leaves the stone while the buttons show that another one fits: the arch is still safe. Then load it, or thin the ring, until the allowed interval disappears.`,
      deps: ['arch-3.2', 'arch-3.4', 'opt-4.4'],
      see: ['solid-4.10', 'arch-4.6'],
      refs: ['Heyman'],
      credit: 'Heyman, 1966',
      scope: String.raw`Plane arch, radial joints, vertical loads, Heyman's assumptions: no tension, no crushing, no sliding.`,
      tags: ['safe theorem', 'limit analysis'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Line_of_thrust' },
      viz(v) {
        const N = 24, tS = v.slider('thickness t / R', 0.08, 0.4, 0.2, { step: 0.005 }), wS = v.slider('point load, share of arch weight', 0, 0.8, 0.2, { step: 0.01 });
        const hS = v.slider('horizontal thrust H / total load', 0.02, 0.5, 0.25, { step: 0.001 });
        const A = v.stage({ x: [-1.3, 1.3], y: [-0.25, 1.4], equal: true, axes: false, height: 340, weight: 1.6, title: 'draw a thrust line' });
        const B = v.stage({ x: [0, 0.5], y: [0, 1], axes: 'box', gutter: true, height: 200, weight: 1, minWidth: 240, xlabel: 'horizontal thrust H / total load', title: 'thrusts that fit' });
        let G = arch({ R: 1, t: 0.2, N }), M = null, init = false;
        const proj = (J, x, y) => { const dx = J.b[0] - J.a[0], dy = J.b[1] - J.a[1], t = clamp(((x - J.a[0]) * dx + (y - J.a[1]) * dy) / (dx * dx + dy * dy), 0, 1); return [J.a[0] + t * dx, J.a[1] + t * dy]; };
        const Lh = A.handle(-1, 0.05, { color: 'green', r: 7, constrain: (x, y) => proj(G.joints[0], x, y) });
        const Rh = A.handle(1, 0.05, { color: 'green', r: 7, constrain: (x, y) => proj(G.joints[N], x, y) });
        const Ph = A.handle(-0.5, 1.1, { color: 'gold', r: 7, constrain: (x) => { const xx = clamp(x, -0.92, 0.92); return [xx, extradosY(G, xx)]; } });
        const setFrom = (u, tl) => { Lh.set(...tl[0].p); Rh.set(...tl[N].p); hS.set(u[0] / M.tot); };
        v.button('lowest thrust that fits', () => { if (M && M.rg) { const u = M.rg.min; setFrom(u, thrustLine(G, M.loads, u)); } });
        v.button('highest thrust that fits', () => { if (M && M.rg) { const u = M.rg.max; setFrom(u, thrustLine(G, M.loads, u)); } });
        v.button('most central line', () => { if (M && M.c) setFrom(M.c.u, thrustLine(G, M.loads, M.c.u)); });
        v.render(() => {
          G = arch({ R: 1, t: tS.value, N });
          const x = Ph.x, loads = [{ x, P: wS.value * G.W, k: blockAt(G, x) }], tot = G.W + loads[0].P, rg = thrustRange(G, loads), c = rg ? centralLine(G, loads) : null;
          M = { rg, c, loads, tot };
          if (!init && c) { init = true; const tl0 = thrustLine(G, loads, c.u); Lh.set(...tl0[0].p); Rh.set(...tl0[N].p); hS.set(c.u[0] / tot); }
          Lh.set(...proj(G.joints[0], Lh.x, Lh.y)); Rh.set(...proj(G.joints[N], Rh.x, Rh.y)); Ph.set(x, extradosY(G, x));
          drawArch(v, A, G, { fillAlpha: 0.12 });
          const lw = loads[0].P; if (lw > 1e-6) { const yl = extradosY(G, x); A.arrow(x, yl + 0.0 + 0.1 + 0.5 * wS.value, x, yl + 0.02, { color: 'gold', width: 3, head: 9 }); }
          if (rg) for (const u of [rg.min, rg.max]) { const tl = thrustLine(G, loads, u); for (let i = 0; i + 1 < tl.length; i++) A.line(tl[i].p[0], tl[i].p[1], tl[i + 1].p[0], tl[i + 1].p[1], { color: 'muted', width: 1.2, dash: [4, 3], alpha: 0.9 }); }
          const u = uFromEnds(G, loads, [Lh.x, Lh.y], [Rh.x, Rh.y], hS.value * tot), tl = thrustLine(G, loads, u), fits = tl.every((q) => q.inside);
          drawThrust(v, A, tl, { color: fits ? 'green' : 'red', bad: 'orange', width: 2.8 });
          M.fits = fits; M.u = u; M.tl = tl;
          A.corner(fits ? 'your line fits: the arch is safe' : rg ? 'your line leaves the stone, but another one fits: still safe' : 'no line fits: safety cannot be shown', 'tl', { color: fits ? 'green' : rg ? 'muted' : 'red' });
          // thrust meter
          if (rg) { B.rect(rg.Hmin / tot, 0.25, rg.Hmax / tot, 0.75, { fill: 'green', fillAlpha: 0.25, color: 'green' }); B.text('allowed', rg.Hmax / tot, 0.5, { size: 11.5, color: 'green', align: 'left', dx: 8 }); }
          B.line(hS.value, 0.08, hS.value, 0.92, { color: fits ? 'green' : 'red', width: 3 }); B.dot(hS.value, 0.92, { r: 4.5, color: fits ? 'green' : 'red' });
          B.setView([0, 0.5], [0, 1]);
        });
        v.legend([['green', 'your thrust line (green = inside)'], ['muted', 'lowest and highest thrust that fit', { dash: true }], ['gold', 'load']]);
        v.readout(() => {
          if (!M) return '';
          const { rg, tot } = M;
          return rg ? `Total load ${f2(tot, 1)} kN/m (arch ${f2(G.W, 1)} + point load ${f2(M.loads[0].P, 1)}). The thrusts that fit lie between $H_{\\min} = ${f2(rg.Hmin, 2)}$ and $H_{\\max} = ${f2(rg.Hmax, 2)}$ kN/m (${f2(rg.Hmin / tot, 3)} to ${f2(rg.Hmax / tot, 3)} of the load); yours is ${f2(hS.value * tot, 2)}. **Safe theorem: at least one line fits, so the arch stands.**` : `No thrust line fits inside this ring under this load, so the safe theorem gives no certificate; the arch can collapse (see the next item for how).`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 3.6
    {
      num: '3.6',
      kind: 'Phenomenon',
      name: 'Hinges and the four-hinge collapse mechanism',
      statement: String.raw`Load an arch until no thrust line can fit (arch-3.5). At that limit the line of thrust touches the surface of the stone in at least four places, alternately on the extrados and the intrados. At each touching point a hinge forms, the joint opening on the opposite face, and the arch becomes a mechanism: the rigid pieces between the hinges, with the springings fixed, can move with one degree of freedom, like a four-bar linkage. The collapse load can be found either from equilibrium (the largest load for which a thrust line still fits) or from the motion (the load at which the gravity forces do no work in the mechanism); in the limit the two agree. Hinges are not damage but the normal way a masonry arch carries an unusual load; collapse needs the fourth hinge.`,
      idea: String.raw`Each hinge removes two degrees of freedom from the pieces it joins: three rigid bodies have $3\times 3 = 9$ degrees of freedom, four hinges take away $4\times 2 = 8$, and one remains, a mechanism with a definite motion. In the picture the motion is found by closing the four-bar linkage numerically. Equilibrium says the loads can be carried while a thrust line fits; the principle of virtual work says they cannot be carried by this mechanism once the loads do positive work along it; the safe theorem (arch-3.5) and its upper-bound counterpart (solid-4.10) coincide for the arch, so the two load factors computed here agree to the precision of the discretisation.`,
      caption: String.raw`Slide the load along the arch (the plot on the right shows the collapse load for every position; the curve is clipped where the arch is nearly rigid against it, and bumpy because hinges can only form at the 24 joints) and set its size as a share of the collapse load. With **thrust line** the line moves toward the stone's surface as the share rises; at 100% it touches in four places (discs). With **collapse mechanism** the arch moves as a four-bar linkage: drag the motion slider. The readout checks the collapse load found from equilibrium against the one found from virtual work along the mechanism.`,
      deps: ['arch-3.5', 'mech-6.4'],
      see: ['arch-3.7', 'solid-4.10'],
      refs: ['Heyman'],
      credit: 'Couplet, 1730 (hinge mechanism of the semicircular arch); Heyman, 1966',
      scope: String.raw`Plane arch, radial joints, Heyman's assumptions (no tension, no crushing, no sliding); small displacements for the virtual-work check.`,
      tags: ['hinges', 'mechanism', 'collapse'],
      viz(v) {
        const N = 24;
        const tS = v.slider('thickness t / R', 0.12, 0.4, 0.2, { step: 0.005 }), xS = v.slider('load position x / R', -0.95, 0.95, -0.5, { step: 0.01 });
        const rS = v.slider('load, share of its collapse load', 0, 1.3, 0.8, { step: 0.01 }), mode = v.select('show', [{ value: 'line', label: 'thrust line' }, { value: 'mech', label: 'collapse mechanism' }], 'line');
        const mS = v.slider('mechanism motion', 0, 1, 0.6, { step: 0.01 });
        const A = v.stage({ x: [-1.4, 1.4], y: [-0.25, 1.45], equal: true, axes: false, height: 340, weight: 1.6, title: 'the arch' });
        const B = v.stage({ x: [-1, 1], y: [0, 1], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 250, xlabel: 'load position x / R', ylabel: 'collapse load / arch weight', title: 'where the arch is weakest' });
        const curveCache = new Map();
        const curve = (t) => { const k = t.toFixed(4); if (curveCache.has(k)) return curveCache.get(k); const g = arch({ R: 1, t, N }), pts = []; for (let i = 0; i <= 38; i++) { const x = -0.95 + (1.9 * i) / 38, r = collapseFactor(g, [{ x, P: g.W, var: true, k: blockAt(g, x) }]); if (r) pts.push([x, r.lam]); } if (curveCache.size > 12) curveCache.clear(); curveCache.set(k, pts); return pts; };
        // four-bar closing
        function pickHinges(g, hs) {
          const L = hs.filter((h) => h.side === 'a' || h.side === 'b').sort((a, b) => a.j - b.j || (a.side < b.side ? -1 : 1)), out = [];
          for (const h of L) { const last = out[out.length - 1]; if (last && last.side === h.side) continue; if (last && last.j === h.j) continue; out.push(h); }
          return out.length === 4 ? out : null;
        }
        function mechanism(g, hz, loadK) {
          const pt = (h) => (h.side === 'a' ? g.joints[h.j].a : g.joints[h.j].b), P = hz.map(pt), [P1, H2, H3, P4] = P, d23 = Math.hypot(H3[0] - H2[0], H3[1] - H2[1]), a23 = Math.atan2(H3[1] - H2[1], H3[0] - H2[0]);
          const psiOf = (phi) => {
            const n = Math.max(1, Math.ceil(Math.abs(phi) / 0.004)); let psi = 0;
            for (let i = 1; i <= n; i++) {
              const ph = (phi * i) / n, H2p = rot(H2, P1, ph), f = (ps) => { const q = rot(H3, P4, ps); return Math.hypot(q[0] - H2p[0], q[1] - H2p[1]) - d23; };
              let lo = psi - 0.02, hi = psi + 0.02, fl = f(lo), fh = f(hi), k = 0;
              while (fl * fh > 0 && k++ < 14) { lo -= 0.04; hi += 0.04; fl = f(lo); fh = f(hi); }
              if (fl * fh > 0) return NaN;
              for (let j = 0; j < 40; j++) { const m = (lo + hi) / 2, fm = f(m); if (fm * fl > 0) { lo = m; fl = fm; } else { hi = m; fh = fm; } } psi = (lo + hi) / 2;
            }
            return psi;
          };
          const body = (k) => (k >= hz[0].j && k < hz[1].j ? 'A' : k >= hz[1].j && k < hz[2].j ? 'B' : k >= hz[2].j && k < hz[3].j ? 'C' : null);
          const make = (phi) => {
            const psi = psiOf(phi), H2p = rot(H2, P1, phi), H3p = rot(H3, P4, psi), thB = Math.atan2(H3p[1] - H2p[1], H3p[0] - H2p[0]) - a23;
            return { psi, H2p, H3p, tf: (k, p) => { const b = body(k); if (b === 'A') return rot(p, P1, phi); if (b === 'C') return rot(p, P4, psi); if (b === 'B') { const q = rot(p, H2, thB); return [q[0] + H2p[0] - H2[0], q[1] + H2p[1] - H2[1]]; } return p; }, phi, hinges: [P1, H2p, H3p, P4] };
          };
          // direction: the one that lowers the weights plus the load
          const lx = g.blocks[loadK].cx, work = (sg) => { const m = make(sg * 1e-3); if (!Number.isFinite(m.psi)) return NaN; let w = 0; g.blocks.forEach((b, k) => { const q = m.tf(k, [b.cx, b.cy]); w += b.W * (q[1] - b.cy); }); return w; };
          const w1 = work(1), w2 = work(-1), sg = (Number.isFinite(w1) ? w1 : 1e9) < (Number.isFinite(w2) ? w2 : 1e9) ? 1 : -1;
          // virtual work load factor (load = lam * arch weight at the extrados point of the load)
          const m = make(sg * 1e-3), xl = g.blocks[loadK].cx;
          return { make, sg, d: m, body };
        }
        let M = null;
        v.render(() => {
          const g = arch({ R: 1, t: tS.value, N }), x = xS.value, k = blockAt(g, x), loadsV = [{ x, P: g.W, var: true, k }], cf = collapseFactor(g, loadsV);
          const pts = curve(tS.value);
          const lmin = Math.min(...pts.map((p) => p[1])); B.setView([-1, 1], [0, Math.max(0.5, 3.4 * lmin)]);
          B.path(pts, { color: 'accent', width: 2.4 });
          if (!cf) { drawArch(v, A, g); A.corner('this ring cannot stand even unloaded (t/R < 0.1075)', 'tl', { color: 'red' }); M = { g }; return; }
          B.dot(x, cf.lam, { r: 5.5, color: 'red' });
          const hs = hinges(g, loadsV, cf.u, {}, 1e-6), four = pickHinges(g, hs), rho = rS.value;
          const yl = extradosY(g, x);
          const showMech = mode.value === 'mech' && four; mS.el.hidden = !showMech;
          let vw = NaN;
          if (showMech) {
            const me = mechanism(g, four, k), phi = me.sg * mS.value * 0.16, st = me.make(phi), tfb = (kk, p) => st.tf(kk, p);
            drawArch(v, A, g, { tfBlock: tfb, fillAlpha: 0.14, blockColor: (kk) => (me.body(kk) ? 'orange' : 'muted') });
            if (Number.isFinite(st.psi)) { st.hinges.forEach((p) => A.dot(p[0], p[1], { r: 5.5, color: 'red' })); }
            const q = st.tf(k, [x, yl]); A.arrow(q[0], q[1] + 0.5, q[0], q[1] + 0.03, { color: 'gold', width: 3, head: 9 });
            // virtual work check
            const m1 = me.make(me.sg * 1e-3); if (Number.isFinite(m1.psi)) { let w = 0; g.blocks.forEach((b, kk) => { const p = m1.tf(kk, [b.cx, b.cy]); w += b.W * (p[1] - b.cy); }); const pl = m1.tf(k, [x, yl]); vw = -w / (g.W * (pl[1] - yl)); }
            A.corner('collapse mechanism: three rigid pieces, four hinges', 'tl', { color: 'muted' });
          } else {
            drawArch(v, A, g, { fillAlpha: 0.12 });
            const lam = Math.min(rho, 1) * cf.lam, fixed = [{ x, P: lam * g.W, k }];
            let u = cf.u, tl;
            if (rho < 0.999) { const c = centralLine(g, fixed); if (c) u = c.u; tl = thrustLine(g, fixed, c ? c.u : cf.u); } else tl = thrustLine(g, loadsV, cf.u);
            drawThrust(v, A, tl, { color: 'red', width: 2.6 });
            for (const h of hs) { const J = g.joints[h.j], p = h.side === 'a' ? J.a : J.b; A.dot(p[0], p[1], { r: rho >= 0.999 ? 6 : 4, color: 'red', hollow: rho < 0.999 }); }
            const Pl = rho >= 0.999 ? cf.lam : lam; A.arrow(x, yl + 0.1 + 0.9 * Pl, x, yl + 0.03, { color: 'gold', width: 3, head: 9 });
            A.corner(rho > 1.001 ? 'overloaded: no thrust line fits, the mechanism moves' : rho >= 0.999 ? 'at collapse: the line touches in ' + hs.length + ' places' : 'standing: the line is inside the stone', 'tl', { color: rho > 1.001 ? 'red' : 'muted' });
          }
          M = { g, cf, hs, four, vw, x, k };
        });
        v.legend([['red', 'thrust line, hinges'], ['gold', 'load'], ['orange', 'moving pieces', { area: true }]]);
        v.readout(() => {
          if (!M || !M.cf) return 'This ring is too thin to stand under its own weight.';
          const { g, cf, hs, four, vw } = M, ang = (h) => { const J = g.joints[h.j], p = h.side === 'a' ? J.a : J.b; return deg(Math.atan2(p[0], p[1] - g.C[1])); };
          const lst = hs.map((h) => `${h.side === 'a' ? 'intrados' : 'extrados'} at joint ${h.j} (${f2(Math.abs(ang(h)), 0)}° ${ang(h) < 0 ? 'left' : 'right'} of the crown)`).join('; ');
          return `Collapse load from equilibrium (linear program): **${f2(cf.lam, 3)}** × the arch weight (${f2(cf.lam * g.W, 1)} kN/m), hinges: ${lst || '—'}.\n${four ? `Mechanism with ${four.length} hinges; load factor from virtual work along its motion: **${Number.isFinite(vw) ? f2(vw, 3) : 'switch to "collapse mechanism"'}**.` : `The active set has ${hs.length} touching points, not a four-hinge pattern (a symmetric case, see 3.7).`}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 3.7
    {
      num: '3.7',
      kind: 'Proposition',
      name: 'Minimum thickness of a semicircular arch',
      statement: String.raw`A semicircular arch of mean radius $R$ and uniform thickness $t$, made of radial voussoirs, loaded only by its own weight and obeying Heyman’s assumptions, stands if and only if $t/R \ge 0.1075$ (more exactly 0.10748). At this limit a single thrust line touches the stone in five places: on the extrados at the crown and at both springings, and on the intrados about $54.5^\circ$ on each side of the crown; thinner than that no line fits and the arch falls. The limit depends on the shape (a segmental arch needs far less, an over-complete horseshoe more) and on how the joints are cut (vertical joints give about 0.1095). The **geometric factor of safety** is $t/t_{\min}$ (called the geometrical factor of safety in the masonry literature): it measures how much of the ring could be removed before collapse, so a factor of 2 means twice the minimum thickness for this geometry and loading, rather than a universal margin against other failure modes.`,
      idea: String.raw`At the minimum thickness the interval of admissible thrusts $[H_{\min}, H_{\max}]$ of arch-3.5 has shrunk to a point: the lowest line (which touches the extrados at the crown and the intrados at the haunches) and the highest line (the reverse) coincide. Thickness enters only through the positions of the intrados and extrados and the weights of the voussoirs, so $t_{\min}$ is found by lowering $t$ until the linear program for the thrust line stops having a solution (a bisection). Couplet (1730) assumed where the hinges form (45°, $t/R \approx 0.101$); Heyman's approximate treatment, with hinges at 58.8°, gives about 0.106; Milankovitch's complete solution, which puts each voussoir's weight at its centroid, gives 0.1075 (arch-3.6 shows the same hinge mechanism for a single load).`,
      caption: String.raw`Change the thickness: for a ring above the minimum the lowest and highest thrust lines that fit are drawn (blue and green); the plot on the right shows the allowed interval of $H/W$ closing as $t$ falls, and it reaches a point at $t_{\min}$ (disc). At the minimum, the discs on the arch are the five hinges. Change the embrace angle $\alpha$ to see segmental arches (small $\alpha$) and horseshoes (large $\alpha$): the lower plot shows $t_{\min}/R$ from the engine (line) against the values published for these arches (dots, from the table in Nikolić 2016).`,
      deps: ['arch-3.5'],
      see: ['arch-3.6', 'arch-3.11', 'arch-3.14'],
      refs: ['Nikolić (2016), Graphical Simulation of Minimum Thickness of Clamped Pointed Arch, pp. 199–210, Table 2, zero-eccentricity row; doi:10.14415/konferencijaGFS2016.019', 'Heyman'],
      credit: 'Couplet, 1730; Milankovitch, 1907',
      scope: String.raw`Plane arch of constant thickness, radial joints, self-weight only, Heyman's assumptions. The engine uses 40 voussoirs with the weight at each polygon's centroid, whose semicircular result differs from the Table 2 value by less than 3e-5; this tolerance is not asserted for every embrace angle.`,
      verify: true,
      tags: ['minimum thickness', 'factor of safety'],
      viz(v) {
        const N = 40, tS = v.slider('thickness t / R', 0.02, 0.8, 0.2, { step: 0.0025 }), aS = v.slider('embrace angle α (°)', 30, 135, 90, { step: 5 });
        const A = v.stage({ x: [-1.3, 1.3], y: [-0.2, 1.5], equal: true, axes: false, height: 330, weight: 1.35, title: 'lowest and highest thrust lines' });
        const Bs = v.stage({ x: [0, 0.45], y: [0, 0.6], axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 240, xlabel: 't / R', ylabel: 'H / W (thrust over arch weight)', title: 'allowed horizontal thrust' });
        const C = v.stage({ x: [0, 140], y: [3e-5, 1], ylog: true, axes: 'box', gutter: true, height: 260, full: true, xlabel: 'embrace angle α (°)', ylabel: 'minimum t / R', title: 'minimum thickness against embrace angle: engine and published values' });
        const PUB = [[15, 0.000097], [30, 0.00153], [45, 0.0075], [60, 0.02284], [75, 0.05369], [90, 0.10748], [105, 0.19394], [120, 0.32761], [135, 0.53654]];
        const tmin = (al, n = N) => { const f = bestFit((t) => arch({ R: 1, t, N: n, alpha: (al * Math.PI) / 180 }), () => [], {}, 1e-5, 1.2, 30); return f; };
        const cacheB = new Map(); let curveC = null;
        const bandFor = (al) => { const k = String(al); if (cacheB.has(k)) return cacheB.get(k); const f = tmin(al); const tm = f ? f.t : 0.1, pts = []; for (let i = 0; i <= 22; i++) { const t = tm + (Math.max(0.45, 1.5 * tm) - tm) * (i / 22) ** 1.4, g = arch({ R: 1, t, N, alpha: (al * Math.PI) / 180 }), r = thrustRange(g, []); if (r) pts.push([t, r.Hmin / g.W, r.Hmax / g.W]); } const out = { tm, pts, fit: f }; cacheB.set(k, out); return out; };
        let M = null;
        v.render(() => {
          const al = aS.value, t = tS.value, rad = (al * Math.PI) / 180, g = arch({ R: 1, t, N, alpha: rad }), band = bandFor(al), tm = band.tm;
          if (!curveC) curveC = Array.from({ length: 19 }, (_, i) => { const a = 15 + i * 7; const f = tmin(a); return f ? [a, f.t] : null; }).filter(Boolean);
          const xr = Math.max(1.05, g.ro + 0.1) * 1.05; A.setView([-xr, xr], [-0.2, Math.max(0.5, g.rise + t / 2 + 0.3)]);
          drawArch(v, A, g, { fillAlpha: 0.12 });
          const rg = thrustRange(g, []);
          let hs = [];
          if (rg) {
            const lo = thrustLine(g, [], rg.min), hi = thrustLine(g, [], rg.max);
            for (const [tl, c] of [[lo, 'accent'], [hi, 'green']]) for (let i = 0; i + 1 < tl.length; i++) A.line(tl[i].p[0], tl[i].p[1], tl[i + 1].p[0], tl[i + 1].p[1], { color: c, width: 2.2 });
            if (t <= tm * 1.03) { hs = hinges(g, [], rg.min, {}, 1e-5); for (const h of hs) { const p = h.side === 'a' ? g.joints[h.j].a : g.joints[h.j].b; A.dot(p[0], p[1], { r: 5.5, color: 'red' }); } }
            A.corner(`H from ${f2(rg.Hmin / g.W, 3)} to ${f2(rg.Hmax / g.W, 3)} of the weight`, 'tl', { color: 'muted' });
          } else A.corner('no admissible thrust line for this discrete arch', 'tl', { color: 'red' });
          // band
          const P = band.pts; if (P.length) { Bs.poly([...P.map((p) => [p[0], p[2]]), ...P.slice().reverse().map((p) => [p[0], p[1]])], { fill: 'green', fillAlpha: 0.22, color: 'green', width: 1.4 }); Bs.dot(tm, P[0][1], { r: 5, color: 'red' }); Bs.vline(tm, { color: 'red', width: 1, dash: [2, 3] }); }
          Bs.vline(t, { color: 'accent', width: 1.6, dash: [4, 3] });
          const ym = Math.max(0.2, ...P.map((p) => p[2])) * 1.1; Bs.setView([0, Math.max(0.45, 1.5 * tm, t * 1.03)], [0, ym]); Bs.text(`t_min = ${f2(tm, 4)}`, tm, 0.04 * ym, { dx: 8, align: 'left', size: 11, color: 'red' });
          // published values
          C.path(curveC, { color: 'accent', width: 2.2 }); C.dots(PUB, { r: 4.5, color: 'gold' }); C.dot(al, tm, { r: 6, color: 'red' });
          const pub = PUB.find((p) => p[0] === al);
          M = { g, rg, tm, al, t, pub, hs, band };
        });
        v.legend([['accent', 'lowest thrust line / engine curve'], ['green', 'highest thrust line'], ['gold', 'published values', { dot: true }], ['red', 'hinges at the minimum']]);
        v.readout(() => {
          if (!M) return '';
          const g0 = null; const { tm, al, t, pub, band } = M, gf = t / tm, fg = band.fit ? band.fit.g : g0, hh = band.fit ? hinges(fg, [], band.fit.u, {}, 1e-5) : [];
          const ang = hh.filter((h) => h.side === 'a').map((h) => Math.abs(deg(Math.atan2(fg.joints[h.j].a[0], fg.joints[h.j].a[1] - fg.C[1])))).filter((a) => a < 85 && a > 1);
          return `Embrace angle ${al}°: minimum thickness $t_{\\min}/R = ${f2(tm, 5)}$ from the engine${pub ? `; published value ${pub[1]} (Milankovitch's method, tabulated by Nikolić 2016)` : ''}. Geometric factor of safety $t/t_{\\min} = ${f2(gf, 2)}$ ${gf < 1 ? '(below this model’s threshold)' : ''}.${al === 90 ? ` For the semicircle the intrados hinges are at about ${ang.length ? f2(ang.reduce((a, b) => a + b, 0) / ang.length, 1) : '—'}° from the crown at the minimum; Couplet's assumed 45° gives 0.101 and Heyman's approximation (58.8°) about 0.106.` : ''}`;
        });
      },
    },
  ],
};
