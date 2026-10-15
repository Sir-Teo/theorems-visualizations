// Classical Mechanics — Chapter 1 (paper): Newton 1687, Philosophiæ Naturalis Principia Mathematica

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const sub = (p, q) => [p[0] - q[0], p[1] - q[1]];
const cross = (p, q) => p[0] * q[1] - p[1] * q[0];
const rot = (u, a) => [u[0] * Math.cos(a) - u[1] * Math.sin(a), u[0] * Math.sin(a) + u[1] * Math.cos(a)];
const unit = (u) => { const n = Math.hypot(u[0], u[1]) || 1; return [u[0] / n, u[1] / n]; };
/**
 * Newton's construction (Book I, Prop. 1). The body moves uniformly from P[k−1] to P[k] in each interval; at P[k] an impulse
 * aimed along dir(P[k]) shifts the point it would have reached, c = 2P[k] − P[k−1], by the distance s[k] (so cC ∥ the impulse).
 * Returns the vertices, the would-be points c and the impulse directions.
 */
function construct(A, B, s, dir) {
  const P = [A, B], c = [null], u = [null];
  for (let k = 1; k < s.length + 1; k++) {
    const pk = P[k], ck = [2 * pk[0] - P[k - 1][0], 2 * pk[1] - P[k - 1][1]], uk = dir(pk);
    c.push(ck); u.push(uk); P.push([ck[0] + s[k - 1] * uk[0], ck[1] + s[k - 1] * uk[1]]);
  }
  return { P, c, u };
}
/** Area of triangle S P Q (signed, positive for anticlockwise motion about S = origin). */
const tri = (P, Q) => cross(P, Q) / 2;
/** Kepler orbit through r0 with velocity v0 about a centre of strength mu at the origin: returns a point function of the true anomaly, or null if unbound. */
function kepler(r0, v0, mu) {
  const r = Math.hypot(...r0), v2 = v0[0] ** 2 + v0[1] ** 2, rv = r0[0] * v0[0] + r0[1] * v0[1], h = cross(r0, v0);
  const ex = ((v2 - mu / r) * r0[0] - rv * v0[0]) / mu, ey = ((v2 - mu / r) * r0[1] - rv * v0[1]) / mu, e = Math.hypot(ex, ey);
  const a = 1 / (2 / r - v2 / mu), p = (h * h) / mu, w = Math.atan2(ey, ex);
  return { e, a, p, h, w, bound: e < 1, T: e < 1 ? 2 * Math.PI * Math.sqrt(a ** 3 / mu) : null, at: (th) => { const rr = p / (1 + e * Math.cos(th - w)); return [rr * Math.cos(th), rr * Math.sin(th)]; } };
}

export default {
  collection: 'mech',
  chapter: 1,
  items: [
    // ───────────────────────────────────────────────────────────── 1.19
    {
      num: '1.19',
      kind: 'Paper',
      name: 'Philosophiæ Naturalis Principia Mathematica',
      paper: { authors: 'Isaac Newton', year: 1687, title: 'Philosophiæ Naturalis Principia Mathematica', venue: 'London: Royal Society, printed by Joseph Streater (book, 3 vols. in 1)', url: 'https://archive.org/details/philosophiaenat00newt' },
      introduces: ['mech-1.5', 'mech-1.6', 'mech-1.7', 'mech-1.17', 'mech-8.1'],
      credit: 'Isaac Newton, published 5 July 1687',
      statement: String.raw`The *Principia* founded mechanics on three **laws of motion** — a body persists in rest or uniform straight motion unless compelled by impressed force (mech-1.5); change of motion is proportional to the impressed force and along its line (mech-1.6); to every action there is an equal and opposite reaction (mech-1.7) — and deduced from them, in Book I, the motion of bodies under central forces. Its first theorem, **Book I, Proposition 1**: *if a body is drawn toward a fixed centre by any force whatever, the areas it sweeps out by radii to that centre lie in one fixed plane and are proportional to the times* — Kepler's second law, now true for every central force. Proposition 2 gives the converse, Propositions 11–13 show that motion on a conic with the centre at a focus requires a force inversely proportional to the square of the distance, and Propositions 70–71 that a spherical shell attracts as if its mass sat at its centre (mech-8.1). Book III applies this to the solar system as **universal gravitation** (mech-1.17): one inverse-square force, proportional to the masses, keeps the Moon in its orbit and makes the apple fall, and accounts for Kepler's three laws, the tides and the precession of the equinoxes. Scope: speeds small compared with light and gravitational fields weak (special and general relativity correct it), bodies far larger than atoms.`,
      idea: String.raw`Kepler had found his area law and elliptical orbits empirically (1609); Hooke suggested in 1679 that an orbit compounds a straight inertial motion with a continual attraction toward the Sun, and in 1684 Halley asked Newton which curve an inverse-square attraction would produce. Newton's tract *De motu* answered within months and grew into the *Principia*. Proposition 1 is pure geometry with the laws of motion. In equal times inertia carries the body over equal straight segments, $AB = Bc$, so the triangles $SAB$ and $SBc$ have equal bases and a common vertex: equal areas. A single impulse at $B$ aimed at $S$ adds a motion parallel to $BS$, so the body arrives at $C$ on the line through $c$ parallel to $SB$, and $SBC$ has the same base $SB$ and the same height as $SBc$. Repeating, all the triangles are equal whatever the sizes of the impulses. Let the impulses come ever more often and ever weaker (Lemma III): the polygon becomes a curve, the force acts continually, and the area swept is proportional to the time. Nothing in the argument uses the strength of the force, only its direction — which is why a force aimed anywhere else breaks it.`,
      caption: String.raw`**Newton's figure**: the body is kicked toward $S$ at $B, C, D, \dots$ at equal intervals. Hollow points $c, d, e, \dots$ are where inertia alone would take it; **drag the vertices $C, D, E, \dots$** along the dashed lines parallel to the radius to make each kick stronger, weaker or even repulsive — the shaded triangles keep exactly equal areas (bars on the right). **The limit**: equal inverse-square kicks; raise the number of kicks per orbit and the polygon closes onto Kepler's ellipse (green), sweeping equal areas in equal times. **Break it**: aim the kicks off the centre and the areas change from triangle to triangle. Drag $A$ and $B$ (the first step, i.e. the initial velocity) to change the start.`,
      deps: ['mech-1.8', 'mech-1.3'],
      see: ['mech-2.10'],
      refs: [],
      tags: ['Newton', 'Kepler', 'history'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Philosophi%C3%A6_Naturalis_Principia_Mathematica' },
      viz(v) {
        const M = v.M, MU = 1, NK = 6;
        const mode = v.select('picture', [{ value: 'fig', label: 'Newton’s figure' }, { value: 'lim', label: 'the limit' }], 'fig');
        const nS = v.slider('kicks per orbit', 6, 240, 30, { int: true, log: true });
        const off = v.slider('kicks aimed off the centre by', -40, 40, 0, { step: 1, fmt: (x) => `${Math.round(x)}°` });
        const W = v.stage({ x: [-2.0, 1.75], y: [-1.75, 1.75], equal: true, axes: false, height: 400, weight: 1.45, minWidth: 320, title: 'Book I, Prop. 1: impulses toward the centre $S$' });
        const R = v.stage({ x: [0.3, NK + 1.7], y: [0, 1], axes: 'box', height: 400, weight: 0.8, minWidth: 230, title: 'area of each triangle' });
        const hA = W.handle(1, 0, { color: 'accent', label: 'A', labelPos: 'se' });
        const hV = W.handle(1, 0.6, { color: 'orange', label: 'B', labelPos: 'e' });
        let s = null; // kick displacements in Newton's figure
        const dt = 0.6, DTL = 0.55; // figure interval; time unit that turns AB into the initial velocity in the limit
        const dirAt = () => { const a = (off.value * Math.PI) / 180; return (p) => rot(unit([-p[0], -p[1]]), a); };
        const startB = () => [hV.x, hV.y]; // AB: the first inertial step
        const resetKicks = () => { const d = dirAt(); let P = [[hA.x, hA.y], startB()]; s = []; for (let k = 1; k <= NK; k++) { const r2 = P[k][0] ** 2 + P[k][1] ** 2, sk = (MU * dt * dt) / Math.max(r2, 0.05); s.push(sk); P = construct(P[0], P[1], s, d).P; } };
        resetKicks();
        hA.onDrag = hV.onDrag = () => resetKicks();
        v.button('Reset the kicks to inverse-square', () => resetKicks());
        const kickH = Array.from({ length: NK }, (_, k) => W.handle(0, 0, {
          color: 'gold', label: LETTERS[k + 2], labelPos: 'ne',
          constrain: (x, y) => {
            const G = construct([hA.x, hA.y], startB(), s, dirAt()), c = G.c[k + 1], u = G.u[k + 1];
            s[k] = M.clamp((x - c[0]) * u[0] + (y - c[1]) * u[1], -0.6, 1.2);
            return [c[0] + s[k] * u[0], c[1] + s[k] * u[1]];
          },
        }));
        let st = {};
        v.render(() => {
          const fig = mode.value === 'fig', d = dirAt();
          nS.el.hidden = fig;
          W.setView(fig ? [-1.75, 1.75] : [-2.0, 1.75], fig ? [-0.6, 1.85] : [-1.75, 1.75]);
          W.dot(0, 0, { r: 6, color: 'ink', label: 'S', labelPos: 'sw' });
          if (fig) {
            const G = construct([hA.x, hA.y], startB(), s, d), P = G.P;
            kickH.forEach((h, k) => { h.visible = true; h.x = P[k + 2][0]; h.y = P[k + 2][1]; });
            const areas = [];
            for (let k = 0; k < P.length - 1; k++) {
              const col = k % 2 ? 'teal' : 'accent';
              W.poly([[0, 0], P[k], P[k + 1]], { fill: col, fillAlpha: 0.2, color: col, width: 0.8, alpha: 0.6 });
              areas.push(tri(P[k], P[k + 1]));
            }
            for (let k = 1; k < P.length - 1; k++) {
              const c = G.c[k], u = G.u[k];
              W.line(P[k][0], P[k][1], c[0], c[1], { color: 'muted', dash: [4, 4], width: 1.2 });
              W.line(c[0] - 0.3 * u[0], c[1] - 0.3 * u[1], c[0] + 0.75 * u[0], c[1] + 0.75 * u[1], { color: 'gold', dash: [2, 5], width: 1, alpha: 0.7 });
              W.line(0, 0, P[k][0], P[k][1], { color: 'muted', width: 0.8, alpha: 0.6 });
              W.arrow(c[0], c[1], P[k + 1][0], P[k + 1][1], { color: 'red', width: 1.6, head: 7 });
              W.dot(c[0], c[1], { r: 3.5, color: 'muted', hollow: true, label: LETTERS[k + 1].toLowerCase(), labelPos: 'sw', labelSize: 13 });
            }
            W.path(P, { color: 'ink', width: 2.2 });
            W.arrow(hA.x, hA.y, hV.x, hV.y, { color: 'orange', width: 2, head: 8 });
            const top = Math.max(...areas.map(Math.abs)) * 1.3 || 1, lo = Math.min(0, ...areas) * 1.3;
            R.setView([0.3, areas.length + 0.7], [lo, top]);
            R.setTicks(areas.map((_, k) => [k + 1, `S${LETTERS[k]}${LETTERS[k + 1]}`]), null);
            areas.forEach((a, k) => R.rect(k + 1 - 0.32, 0, k + 1 + 0.32, a, { fill: k % 2 ? 'teal' : 'accent', fillAlpha: 0.5, color: k % 2 ? 'teal' : 'accent' }));
            R.hline(areas[0], { color: 'green', dash: [5, 4], width: 1.4 });
            st = { fig, areas };
          } else {
            kickH.forEach((h) => { h.visible = false; });
            const r0 = [hA.x, hA.y], v0 = [(hV.x - hA.x) / DTL, (hV.y - hA.y) / DTL], K = kepler(r0, v0, MU);
            const N = nS.value, T = K.bound ? K.T : 12, h = T / N;
            // first step: half-kick start so the polygon approximates the orbit through A with velocity v0 (Störmer–Verlet)
            const a0 = 1 / (r0[0] ** 2 + r0[1] ** 2) ** 1.5, B = [r0[0] + v0[0] * h - 0.5 * MU * a0 * r0[0] * h * h, r0[1] + v0[1] * h - 0.5 * MU * a0 * r0[1] * h * h];
            const steps = Math.min(N, 600), ks = [];
            const P = [r0, B];
            for (let k = 1; k < steps; k++) {
              const pk = P[k], r2 = pk[0] ** 2 + pk[1] ** 2, sk = (MU * h * h) / Math.max(r2, 1e-4), u = d(pk); ks.push(sk);
              P.push([2 * pk[0] - P[k - 1][0] + sk * u[0], 2 * pk[1] - P[k - 1][1] + sk * u[1]]);
            }
            if (K.bound) W.curve((th) => K.at(th), 0, 2 * Math.PI, { color: 'green', width: 2, dash: [6, 4], n: 360 });
            const areas = [];
            for (let k = 0; k < P.length - 1; k++) {
              if (N <= 60) W.poly([[0, 0], P[k], P[k + 1]], { fill: k % 2 ? 'teal' : 'accent', fillAlpha: 0.18, stroke: false });
              areas.push(tri(P[k], P[k + 1]));
            }
            W.clip(() => W.path(P, { color: 'ink', width: N > 60 ? 1.6 : 2 }));
            if (N <= 60) W.dots(P.slice(1), { r: 2.6, color: 'gold' });
            W.arrow(hA.x, hA.y, hV.x, hV.y, { color: 'orange', width: 2, head: 8 });
            const n = areas.length, show = areas.slice(0, Math.min(n, 60)), top = Math.max(...show.map(Math.abs)) * 1.3 || 1, lo = Math.min(0, ...show) * 1.3;
            R.setView([0.3, show.length + 0.7], [lo, top]);
            R.setTicks(null, null);
            show.forEach((a, k) => R.rect(k + 1 - 0.36, 0, k + 1 + 0.36, a, { fill: k % 2 ? 'teal' : 'accent', fillAlpha: 0.5, stroke: false }));
            R.hline(K.h * h / 2, { color: 'green', dash: [5, 4], width: 1.4 });
            const close = K.bound && n >= N - 1 ? Math.hypot(P[N] ? P[N][0] - r0[0] : NaN, P[N] ? P[N][1] - r0[1] : NaN) : NaN;
            st = { fig, areas, K, h, close, N };
          }
        });
        v.legend([['accent', 'triangles swept in equal times', { area: true }], ['red', 'impulse toward the centre'], ['muted', 'inertial path (to c, d, …)', { dash: true }], ['green', 'Kepler’s ellipse / equal-area level', { dash: true }]]);
        v.readout(() => {
          const { areas } = st; if (!areas) return '';
          const mn = Math.min(...areas), mx = Math.max(...areas), spread = (mx - mn) / Math.abs(areas[0] || 1);
          const aim = Math.round(off.value) === 0 ? 'kicks aimed at $S$' : `kicks aimed ${Math.round(off.value)}° off $S$`;
          if (st.fig) return `${aim}: triangle areas ${areas.map((a) => v.fix(a, 4)).join(', ')} · relative spread $${v.sci(spread, 2)}$${Math.round(off.value) === 0 ? ' — equal to rounding error, whatever the kick sizes (Prop. 1)' : ' — no longer equal: an off-centre impulse has a torque about $S$'} · kick sizes ${s.map((x) => v.fix(x, 3)).join(', ')}`;
          const { K, h, close, N } = st;
          return `${aim}, ${N} kicks per ${K.bound ? 'orbit' : '12 time units'} · area per interval ${v.fix(areas[0], 5)}, spread $${v.sci(spread, 2)}$ · Kepler's areal rate × interval: $\\tfrac12|\\mathbf r\\times\\mathbf v|\\,\\Delta t$ = ${v.fix((K.h * h) / 2, 5)}${K.bound ? ` · orbit: $e$ = ${v.fix(K.e, 3)}, $a$ = ${v.fix(K.a, 3)}; after one period the polygon misses its start by ${v.fix(close, 4)} (halve the interval and the miss drops about fourfold)` : ' · the start is unbound (hyperbolic): slow the velocity to see an ellipse'}`;
        });
      },
    },
  ],
};
