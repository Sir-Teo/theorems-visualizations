// Architecture & Structural Form — Chapter 2: Cables and suspension structures
//
// Sources checked (Oct 2026):
//   Catenary history: Galileo, Two New Sciences (1638) compares the hanging chain with a parabola; Jungius showed it is
//     not one (published posthumously 1669); Jakob Bernoulli posed the problem in Acta Eruditorum (1690) and Leibniz,
//     Huygens and Johann Bernoulli published solutions in June 1691 (MacTutor "Catenary"; MAA Convergence).
//   Golden Gate Bridge (Golden Gate Bridge District, "Design & construction stats" and "Main cable statistics"):
//     main span 4,200 ft (1,280 m), side spans 1,125 ft (343 m), towers 746 ft (227 m) above water, clearance 220 ft
//     (67 m), each main cable 27,572 wires of 0.192 in (4.87 mm), 36 3/8 in (0.92 m) over the wrapping, completed 1937.
//     Cable sag at mid-span 470 ft (143 m): design figure in US Naval Institute Proceedings, April 1935. Wire tensile
//     strength ≈ 235,000 psi (≈ 1,620 MPa) is a secondary-source figure (fire-service and museum articles).
//   Akashi Kaikyō Bridge: central span 1,991 m (was 1,990 m before the 1995 Hyōgo-ken Nanbu earthquake moved the towers),
//     side spans 960 m, pylons 282.8 m above sea level, clearance 65 m, opened 5 April 1998; cables 1,122 mm diameter,
//     290 strands × 127 wires of 5.23 mm (36,830 wires), wire strength 1,800 MPa; stiffening truss 14 m deep, 35.5 m wide
//     (Wikipedia; Verktækni 2002 article; HSBE papers). Its sag is not published in the sources found; ≈ 198 m (span/10)
//     is estimated here from the pylon height and the clearance plus truss depth, and is labelled as an estimate.
//   1915 Çanakkale Bridge: 2,023 m main span, towers 318 m, opened 18 March 2022 (World Highways; ENR).
//   Deck stiffening (WSDOT Tacoma Narrows Bridge history, "The machine" comparison table): Golden Gate 4,200 ft span,
//     25 ft truss (1:168); Bronx–Whitestone 2,300 ft, 11 ft girder (1:209); Tacoma Narrows 1940: 2,800 ft span, 8 ft plate
//     girder (1:350), 39 ft wide (1:72); opened 1 July 1940, collapsed 7 November 1940. Melan's deflection theory (1888),
//     first applied by Moisseiff on the Manhattan Bridge (1909) (Britannica; Melan-equation literature).
//     Tacoma collapse mechanism: K. Y. Billah & R. H. Scanlan, "Resonance, Tacoma Narrows bridge failure, and
//     undergraduate physics textbooks", Am. J. Phys. 59 (2): 118–124 (1991): wind 42 mph, torsional mode 12 c/min (0.2 Hz),
//     Strouhal vortex shedding near 1 Hz at that speed, i.e. not resonance; single-degree-of-freedom torsional flutter
//     (negative aerodynamic damping, flutter derivative A2* changing sign).
//   Cable-stayed: Strömsund Bridge, Sweden, 182 m main span, opened 1956 (often called the first modern cable-stayed
//     bridge); Russky Bridge 1,104 m (2012); Changtai Yangtze River Bridge opened September 2025, main span reported as
//     1,208 m at opening (ENR, SCMP; Wikipedia's list gives 1,176 m).
//   Material assumptions used for illustration (labelled in the items): bridge wire 1,770 MPa, working stress about
//     800 MPa (factor ≈ 2.2), steel unit weight 78.5 kN/m³.

import { textW, placeLabels, drawSupport, frameSolve, internal, deflected } from './ch01.shared.js';

// ── helpers ─────────────────────────────────────────────────────────────────────────────────────────────────────────
const COLS = ['orange', 'purple', 'pink', 'gold', 'teal', 'green'];
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const MN = (kn, d = 3) => `${(kn / 1000).toLocaleString('en-US', { maximumSignificantDigits: d })} MN`;
/** Dense Gaussian elimination with partial pivoting; b may be a vector or an array of vectors (several RHS). */
function gauss(A0, B0) {
  const n = A0.length, A = A0.map((r) => r.slice()), multi = Array.isArray(B0[0]), B = multi ? B0.map((r) => r.slice()) : B0.map((x) => [x]);
  const m = B[0].length;
  for (let i = 0; i < n; i++) {
    let p = i; for (let r = i + 1; r < n; r++) if (Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r;
    [A[i], A[p]] = [A[p], A[i]]; [B[i], B[p]] = [B[p], B[i]];
    const piv = A[i][i] || 1e-300;
    for (let r = i + 1; r < n; r++) { const f = A[r][i] / piv; if (!f) continue; for (let c = i; c < n; c++) A[r][c] -= f * A[i][c]; for (let c = 0; c < m; c++) B[r][c] -= f * B[i][c]; }
  }
  const X = Array.from({ length: n }, () => new Array(m).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let c = 0; c < m; c++) { let acc = B[i][c]; for (let k = i + 1; k < n; k++) acc -= A[i][k] * X[k][c]; X[i][c] = acc / A[i][i]; }
  return multi ? X : X.map((r) => r[0]);
}
/** Bisection for a decreasing or increasing f on [lo, hi] (geometric midpoint when both positive). */
function bisect(f, lo, hi, it = 70, geo = true) {
  let flo = f(lo);
  for (let k = 0; k < it; k++) { const mid = geo && lo > 0 ? Math.sqrt(lo * hi) : (lo + hi) / 2, fm = f(mid); if (Math.sign(fm) === Math.sign(flo)) { lo = mid; flo = fm; } else hi = mid; }
  return geo && lo > 0 ? Math.sqrt(lo * hi) : (lo + hi) / 2;
}
/** Catenary parameter a for span L and sag d: a (cosh(L/2a) − 1) = d. */
function catA(L, d) { return bisect((a) => a * (Math.cosh(L / (2 * a)) - 1) - d, 1e-4 * L, 1e5 * L); }
/**
 * String polygon of a weightless cable from (0, ya) to (L, yb) carrying vertical loads P_k (down, > 0) at x_k (sorted),
 * with horizontal tension H: y = chord − M/H, M the simple-beam moment. Returns {xs, ys, V (shear per segment)}.
 */
function stringPoly(loads, ya, yb, L, H) {
  const tot = loads.reduce((a, l) => a + l.P, 0), Rb = loads.reduce((a, l) => a + l.P * l.x, 0) / L, Ra = tot - Rb;
  const xs = [0, ...loads.map((l) => l.x), L], V = [];
  let shear = Ra; for (let k = 0; k <= loads.length; k++) { V.push(shear); if (k < loads.length) shear -= loads[k].P; }
  const ys = [ya]; let M = 0;
  for (let k = 1; k < xs.length; k++) { M += V[k - 1] * (xs[k] - xs[k - 1]); ys.push(ya + ((yb - ya) * xs[k]) / L - M / H); }
  ys[ys.length - 1] = yb;
  return { xs, ys, V, Ra, Rb, tot };
}
const polyLen = (xs, ys) => { let s = 0; for (let k = 1; k < xs.length; k++) s += Math.hypot(xs[k] - xs[k - 1], ys[k] - ys[k - 1]); return s; };
/** Member style by axial force: red tension, blue compression, width ∝ |N|. */
const forceStyle = (N, Nmax, wmin = 1, wmax = 7) => ({ color: N >= 0 ? 'red' : 'blue', width: wmin + (wmax - wmin) * Math.min(1, Math.abs(N) / Math.max(1e-9, Nmax)) });

// Bridges (see header for sources). Lengths in m.
const BRIDGES = {
  gg: { name: 'Golden Gate (1937)', L: 1280, side: 343, top: 227, deck: 67, sag: 143, sagNote: 'design sag 470 ft', A: 2 * 27572 * Math.PI / 4 * 0.00487 ** 2, fu: 1620, truss: 7.6 },
  ak: { name: 'Akashi Kaikyō (1998)', L: 1991, side: 960, top: 282.8, deck: 65, sag: 198, sagNote: 'sag ≈ span/10, estimated', A: 2 * 36830 * Math.PI / 4 * 0.00523 ** 2, fu: 1800, truss: 14 },
};

export default {
  collection: 'arch',
  chapter: 2,
  title: 'Cables and suspension structures',
  summary: String.raw`A cable can only pull, so it takes up exactly the funicular shape of its loads: a polygon under point loads, a parabola under a uniform deck, a catenary under its own weight. The same equilibrium rule, written with force densities, shapes whole nets. Sag controls cable force through $H = wL^2/8d$, and that one relation sizes every suspension bridge, from the Golden Gate to the Akashi Kaikyō. Stiffening the deck against moving loads was the decisive problem of the long-span era, solved by the deflection theory and then, at Tacoma Narrows, overtaken by aerodynamics; cable-stayed bridges carry the deck with straight stays instead.`,
  items: [
    // ───────────────────────────────────────────────────────────────────────────────────── 2.1
    {
      num: '2.1',
      kind: 'Model',
      name: 'Cables under point loads take funicular shapes',
      statement: String.raw`A perfectly flexible, inextensible cable of given length $\ell$, hung between two supports and carrying vertical loads $P_1, \dots, P_n$, comes to rest in the **funicular polygon** of those loads: straight between the loads, kinked at each one. Its horizontal tension $H$ is the same in every segment, and the shape is
$$y(x) = y_{\text{chord}}(x) - \frac{M(x)}{H},$$
where $M$ is the bending moment a simply supported beam of the same span would have under the same loads. Of all the funicular polygons (one for each $H$), the cable picks the one whose length is $\ell$: a shorter cable means a larger $H$. The segment tensions are $T_k = H\sqrt{1 + y_k'^2}$, largest where the cable is steepest.

Written node by node, equilibrium says $\sum_j q_{ij}(\mathbf x_j - \mathbf x_i) + \mathbf p_i = 0$ with **force densities** $q_{ij} = T_{ij}/\ell_{ij}$; for given $q$ this is a *linear* system, and the same equations shape a whole cable net in three dimensions.`,
      idea: String.raw`A cable has no bending stiffness, so the only force it can carry is a tension along itself. At a load point the two segment tensions and the load must close as a force triangle (arch-1.4); with no horizontal loads the horizontal components of all segments are equal, and each segment's slope is (shear)/$H$, which integrates to the beam-moment formula. This is Varignon's funicular polygon (arch-1.5) built by the cable itself: the pole distance in the force diagram is $H$, and its position is fixed by the cable's length. Fixing the force densities instead of the length makes the node equations linear (Schek's force-density method, arch-6.6), which is how cable nets and membranes are form-found.`,
      caption: String.raw`Drag the four weights sideways to move them and up or down to make them heavier (10 kN per metre of drop), drag support **B**, and change the cable length. The cable is recomputed from equilibrium every frame; the force polygon on the right is built from the same numbers, with the pole distance equal to $H$. Shorten the cable towards its chord and watch $H$ explode. Switch the right panel to **cable net**: a 7 × 7 net on a saddle-shaped boundary is solved live from its force densities (drag to rotate it); raising the corners or changing the ratio of the two families' force densities reshapes it, and every node balances exactly.`,
      deps: ['arch-1.5'],
      see: ['arch-6.6', 'mech-5.11', 'arch-3.1'],
      refs: ['Allen & Zalewski'],
      credit: 'Varignon, 1725; force densities: Schek, 1974',
      tags: ['cables', 'funicular', 'form-finding'],
      viz(v) {
        const panel = v.select('right panel', [{ value: 'poly', label: 'force polygon' }, { value: 'net', label: 'cable net (force densities)' }], 'poly');
        const lenS = v.slider('cable length / chord', 1.005, 1.4, 1.08, { step: 0.001 });
        const rise = v.slider('corner rise (m)', 0, 3, 1.5, { step: 0.05 });
        const qr = v.slider('q₁ / q₂', 0.25, 4, 1, { log: true });
        const pn = v.slider('node load (kN)', 0, 40, 10, { step: 0.5 });
        const S = v.stage({ x: [-1.2, 21.2], y: [-9, 3], equal: true, axes: false, height: 380, weight: 1.45, title: 'a cable carrying four weights (m)' });
        const F = v.stage({ x: [-5.6, 5.6], y: [-5.4, 5.4], equal: true, axes: false, height: 380, weight: 1, minWidth: 260, title: 'force polygon' });
        const sc = v.scene3(F, { yaw: -0.65, pitch: 0.5, axes: false, hint: false, lim: 4 });
        const LS = 20;
        const X = [3.4, 7.6, 12.2, 16.6], P = [20, 35, 15, 30];
        let last = null;
        const nodeY = (x) => { if (!last) return -3; const { xs, ys } = last; for (let k = 1; k < xs.length; k++) if (x <= xs[k]) return ys[k - 1] + (ys[k] - ys[k - 1]) * (x - xs[k - 1]) / (xs[k] - xs[k - 1] || 1); return ys[ys.length - 1]; };
        const B = S.handle(LS, 0, { color: 'accent', label: 'B', constrain: (x, y) => [LS, clamp(y, -5, 3)] });
        B.labelPos = 'e';
        const hs = X.map((x0, i) => S.handle(x0, -4, { color: COLS[i], constrain: (x, y) => {
          const xx = clamp(x, 0.6, LS - 0.6), yn = nodeY(xx); X[i] = xx; P[i] = clamp(Math.round((yn - 0.5 - y) * 10), 5, 60);
          return [xx, yn - 0.5 - P[i] / 10];
        } }));
        function solve() {
          const loads = X.map((x, i) => ({ x, P: P[i], i })).sort((a, b) => a.x - b.x);
          const chord = Math.hypot(LS, B.y), target = lenS.value * chord;
          const H = bisect((h) => polyLen(stringPoly(loads, 0, B.y, LS, h).xs, stringPoly(loads, 0, B.y, LS, h).ys) - target, 0.01, 1e6);
          const st = stringPoly(loads, 0, B.y, LS, H);
          const T = st.V.map((V, k) => H * Math.hypot(1, (st.ys[k + 1] - st.ys[k]) / (st.xs[k + 1] - st.xs[k])));
          return { ...st, loads, H, T, chord, target };
        }
        // cable net: 7 × 7 grid, boundary fixed on a hyperbolic-paraboloid edge, solved by force densities
        const NG = 7, idx = (i, j) => i * NG + j, isB = (i, j) => i === 0 || j === 0 || i === NG - 1 || j === NG - 1;
        const edges = []; for (let i = 0; i < NG; i++) for (let j = 0; j < NG; j++) { if (i + 1 < NG) edges.push([idx(i, j), idx(i + 1, j), 1]); if (j + 1 < NG) edges.push([idx(i, j), idx(i, j + 1), 2]); }
        function solveNet() {
          const q0 = 40, q = (fam) => (fam === 1 ? q0 * qr.value : q0), h = (NG - 1) / 2;
          const P0 = []; for (let i = 0; i < NG; i++) for (let j = 0; j < NG; j++) { const x = i - h, y = j - h; P0.push([x, y, isB(i, j) ? (rise.value * x * y) / (h * h) : 0]); }
          const free = []; for (let i = 0; i < NG; i++) for (let j = 0; j < NG; j++) if (!isB(i, j)) free.push(idx(i, j));
          const fi = new Map(free.map((n, k) => [n, k])), nf = free.length;
          const A = Array.from({ length: nf }, () => new Array(nf).fill(0)), R = Array.from({ length: nf }, () => [0, 0, -pn.value]);
          for (const [a, b, fam] of edges) {
            const qq = q(fam);
            for (const [u, w] of [[a, b], [b, a]]) { if (!fi.has(u)) continue; const r = fi.get(u); A[r][r] += qq; if (fi.has(w)) A[r][fi.get(w)] -= qq; else for (let c = 0; c < 3; c++) R[r][c] += qq * P0[w][c]; }
          }
          const Xs = gauss(A, R); free.forEach((n, k) => { P0[n] = Xs[k]; });
          let res = 0; for (const n of free) { const f = [0, 0, -pn.value]; for (const [a, b, fam] of edges) { if (a !== n && b !== n) continue; const o = a === n ? b : a; for (let c = 0; c < 3; c++) f[c] += q(fam) * (P0[o][c] - P0[n][c]); } res = Math.max(res, Math.hypot(...f)); }
          const N = edges.map(([a, b, fam]) => q(fam) * Math.hypot(P0[a][0] - P0[b][0], P0[a][1] - P0[b][1], P0[a][2] - P0[b][2]));
          return { P: P0, N, res };
        }
        v.render(() => {
          const net = panel.value === 'net';
          for (const c of [rise, qr, pn]) c.el.hidden = !net;
          F.setTitle(net ? 'cable net: 7 × 7 nodes, saddle boundary (drag to rotate)' : 'force polygon (pole distance = H)');
          const st = solve(); last = st;
          const Tmax = Math.max(...st.T);
          // chord and sag
          S.line(0, 0, LS, B.y, { color: 'muted', dash: [5, 4], width: 1 });
          let kd = 1, dmax = 0; st.xs.forEach((x, k) => { const dd = (B.y * x) / LS - st.ys[k]; if (dd > dmax) { dmax = dd; kd = k; } });
          S.line(st.xs[kd], st.ys[kd], st.xs[kd], (B.y * st.xs[kd]) / LS, { color: 'green', width: 1.2, dash: [2, 3] });
          // cable segments
          for (let k = 0; k + 1 < st.xs.length; k++) S.line(st.xs[k], st.ys[k], st.xs[k + 1], st.ys[k + 1], { color: 'red', width: 1.6 + 5 * st.T[k] / Math.max(Tmax, 1), alpha: 0.9 });
          drawSupport(v, S, 0, 0, 'pin'); drawSupport(v, S, LS, B.y, 'pin');
          S.text('A', 0, 0, { dx: -10, dy: -2, align: 'right', size: 12, weight: 650, color: 'ink' });
          // weights
          st.loads.forEach((l, k) => {
            const xn = st.xs[k + 1], yn = st.ys[k + 1], side = 0.4 + Math.sqrt(l.P) * 0.12, yb = yn - 0.5 - l.P / 10;
            S.line(xn, yn, xn, yb + side / 2, { color: 'muted', width: 1 });
            S.rect(xn - side / 2, yb - side / 2, xn + side / 2, yb + side / 2, { fill: COLS[l.i], fillAlpha: 0.35, color: COLS[l.i], width: 1.5, radius: 2 });
            hs[l.i].set(xn, yb);
          });
          const labs = st.loads.map((l, k) => ({ x: st.xs[k + 1], y: st.ys[k + 1] - 0.5 - l.P / 10, text: `${l.P} kN`, color: COLS[l.i], weight: 650, r: 10, prefer: [1, 0] }));
          const segL = st.T.map((T, k) => ({ x: (st.xs[k] + st.xs[k + 1]) / 2, y: (st.ys[k] + st.ys[k + 1]) / 2, text: net ? `q = ${(T / Math.hypot(st.xs[k + 1] - st.xs[k], st.ys[k + 1] - st.ys[k])).toFixed(1)} kN/m` : `${T.toFixed(0)} kN`, color: 'red', size: 10.5, r: 2, prefer: [0, -1] }));
          placeLabels(v, S, [...segL, ...labs, { x: st.xs[kd], y: (st.ys[kd] + (B.y * st.xs[kd]) / LS) / 2, text: `sag ${dmax.toFixed(2)} m`, color: 'green', size: 10.5, r: 1, prefer: [1, 0] }], { points: [[S.X(0), S.Y(0), 24], [S.X(LS), S.Y(B.y), 24]] });
          if (!net) {
            const tot = st.tot, u = Math.min(8.6 / tot, 8.6 / st.H), xL = -4.4, top = (tot * u) / 2;
            const pts = [top]; st.loads.forEach((l) => pts.push(pts[pts.length - 1] - l.P * u));
            const px = xL + st.H * u, py = pts[0] + st.H * u * ((st.ys[1] - st.ys[0]) / (st.xs[1] - st.xs[0]));
            st.loads.forEach((l, k) => F.line(xL, pts[k], xL, pts[k + 1], { color: COLS[l.i], width: 5 }));
            pts.forEach((p, k) => F.line(px, py, xL, p, { color: 'red', width: 1.2 + 3.5 * st.T[k] / Math.max(Tmax, 1), alpha: 0.85 }));
            F.line(xL, py, px, py, { color: 'accent', width: 1.5, dash: [5, 4] });
            F.dot(px, py, { r: 4.5, color: 'accent' });
            F.text('O', px, py, { dx: 9, align: 'left', size: 12, weight: 650, color: 'accent' });
            const yb = Math.min(...pts, py) - 0.55;
            F.line(xL, yb, px, yb, { color: 'accent', width: 1.2 }); for (const xx of [xL, px]) F.line(xx, yb - 0.15, xx, yb + 0.15, { color: 'accent', width: 1.2 });
            F.text(`H = ${st.H.toFixed(1)} kN`, (xL + px) / 2, yb, { dy: 12, align: 'center', size: 11, weight: 650, color: 'accent' });
            F.text(`ΣP = ${tot} kN`, xL, pts[0], { dx: -6, dy: -10, align: 'left', size: 10.5, color: 'muted' });
          } else {
            const nt = solveNet(), inner = nt.N.filter((_, k) => !(isB(Math.floor(edges[k][0] / NG), edges[k][0] % NG) && isB(Math.floor(edges[k][1] / NG), edges[k][1] % NG))), Nmax = Math.max(...inner), Nmin = Math.min(...inner);
            sc.begin();
            edges.forEach(([a, b], k) => { const bd = isB(Math.floor(a / NG), a % NG) && isB(Math.floor(b / NG), b % NG); if (bd) { sc.line(nt.P[a], nt.P[b], { color: 'ink', width: 2.2, alpha: 0.7 }); return; } const t = (nt.N[k] - Nmin) / Math.max(1e-9, Nmax - Nmin); sc.line(nt.P[a], nt.P[b], { color: t > 0.5 ? 'red' : 'orange', width: 1 + 3 * t }); });
            for (let i = 0; i < NG; i++) for (let j = 0; j < NG; j++) { const p = nt.P[idx(i, j)]; if (isB(i, j)) sc.dot(p, { r: 3, color: 'ink' }); else if (pn.value > 0) sc.line(p, [p[0], p[1], p[2] - 0.12 * Math.sqrt(pn.value)], { color: 'gold', width: 1.4 }); }
            sc.flush();
            F.corner(`net forces ${Nmin.toFixed(0)}–${Nmax.toFixed(0)} kN · node residual ${nt.res.toExponential(0)} kN`, 'bl', { color: 'muted' });
          }
          v.legend(net ? [['red', 'most-tensioned net members (thickness ∝ force)'], ['orange', 'less-tensioned members'], ['gold', 'node loads'], ['ink', 'fixed boundary']]
            : [['red', 'cable segments and rays (thickness ∝ tension)'], ['accent', 'pole distance = H', { dash: true }], ['green', 'sag below the chord', { dash: true }]]);
        });
        v.readout(() => {
          const st = last || solve();
          let worst = 0;
          st.loads.forEach((l, k) => {
            const seg = (j) => { const dx = st.xs[j + 1] - st.xs[j], dy = st.ys[j + 1] - st.ys[j], L = Math.hypot(dx, dy); return [st.T[j] * dx / L, st.T[j] * dy / L]; };
            const a = seg(k), b = seg(k + 1); worst = Math.max(worst, Math.hypot(b[0] - a[0], b[1] - a[1] - l.P));
          });
          const len = polyLen(st.xs, st.ys);
          return `Cable length **${len.toFixed(3)} m** (target ${st.target.toFixed(3)} m, chord ${st.chord.toFixed(2)} m) · horizontal tension **H = ${st.H.toFixed(1)} kN** in every segment · largest tension ${Math.max(...st.T).toFixed(1)} kN · worst node imbalance ${worst.toExponential(1)} kN · force densities $q = T/\\ell$ = ${st.T.map((T, k) => (T / Math.hypot(st.xs[k + 1] - st.xs[k], st.ys[k + 1] - st.ys[k])).toFixed(1)).join(', ')} kN/m.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 2.2
    {
      num: '2.2',
      kind: 'Model',
      name: 'Suspension cables under a uniform deck',
      statement: String.raw`A cable of span $L$ and sag $d$ that carries a load $w$ **uniform per horizontal metre** hangs in the parabola
$$y(x) = \frac{4d}{L^2}\,x\,(L - x)$$
(measured down from the chord), with horizontal tension $H = wL^2/8d$. A suspension bridge comes close to this case: the deck is far heavier than the cable and hangs from it by many closely spaced hangers. Two things spoil the parabola: the hangers deliver the deck load in lumps, so the cable is really a polygon (2.1), and the cable's own weight is uniform per metre of *cable*, not of span, which pulls the shape towards a catenary (2.3). Both effects shrink as the hangers multiply and as the deck-to-cable weight ratio grows.`,
      idea: String.raw`With $H$ constant and the load uniform per horizontal metre, vertical equilibrium of a short piece of cable gives $H\,y'' = w$: the second derivative is constant, so the shape is a parabola, the moment diagram of a uniformly loaded beam divided by $H$ (2.1). At mid-span $M = wL^2/8$, which with $y = d$ gives $H = wL^2/8d$ (2.4). The exact shape with lumped hanger loads and the cable's self-weight is found here by iterating: compute the loads (deck lumps at the hangers, cable weight along its current length), find the funicular with the required sag, re-measure the cable, repeat until nothing changes (solid-9.9 treats the parabola itself).`,
      caption: String.raw`Slide the ratio of deck weight to cable weight, the number of hangers and the sag ratio. The computed cable (blue) is compared with the parabola (green dashed) and the catenary (red dashed) of the same span and sag; the lower panel magnifies the gap, in percent of the sag. With a light deck the cable follows the catenary; with a heavy deck and many hangers it lies on the parabola. With few hangers the kinks at the hangers dominate.`,
      deps: ['arch-2.1', 'solid-9.9'],
      see: ['arch-2.3'],
      refs: ['Allen & Zalewski'],
      tags: ['cables', 'parabola'],
      viz(v) {
        const ratio = v.slider('deck weight / cable weight', 0.01, 100, 4, { log: true });
        const nh = v.slider('hangers', 2, 40, 9, { int: true });
        const sr = v.slider('sag / span', 0.05, 0.5, 0.2, { step: 0.005 });
        const A = v.stage({ x: [-3, 103], y: [-30, 3], axes: false, height: 300, full: true, title: 'the computed cable, deck and hangers (span 100)' });
        const Bs = v.stage({ x: [0, 100], y: [-3, 3], axes: 'box', gutter: true, height: 210, full: true, xlabel: 'position along the span', ylabel: 'shape − parabola (% of sag)' });
        const L = 100;
        function shape(d, n, r) {
          const base = []; for (let k = 0; k <= 200; k++) base.push((L * k) / 200);
          const hx = []; for (let k = 1; k <= n; k++) hx.push((L * k) / (n + 1));
          const xs = [...new Set([...base, ...hx].map((x) => +x.toFixed(9)))].sort((a, b) => a - b);
          const isH = xs.map((x) => hx.some((h) => Math.abs(h - x) < 1e-6));
          const Wd = r / (1 + r), Wc = 1 / (1 + r);
          let ys = xs.map((x) => -(4 * d * x * (L - x)) / (L * L)), H = 1;
          for (let it = 0; it < 40; it++) {
            const seg = []; for (let k = 1; k < xs.length; k++) seg.push(Math.hypot(xs[k] - xs[k - 1], ys[k] - ys[k - 1]));
            const tot = seg.reduce((a, b) => a + b, 0), wc = Wc / tot;
            const loads = []; for (let k = 1; k < xs.length - 1; k++) loads.push({ x: xs[k], P: wc * (seg[k - 1] + seg[k]) / 2 + (isH[k] ? Wd / (n + 1) : 0) });
            const st0 = stringPoly(loads, 0, 0, L, 1); const sag0 = -Math.min(...st0.ys);
            H = sag0 / d; ys = st0.ys.map((y) => y / H);
          }
          return { xs, ys, H, isH, hx, Wd, Wc };
        }
        let cur = null;
        v.render(() => {
          const d = sr.value * L, s = shape(d, nh.value, ratio.value); cur = s;
          A.setView([-3, 103], [-d - 9, 3]);
          const a = catA(L, d), cat = (x) => a * Math.cosh((x - L / 2) / a) - a * Math.cosh(L / (2 * a)), par = (x) => -(4 * d * x * (L - x)) / (L * L);
          // deck and hangers
          const yd = -d - 5;
          A.rect(0, yd - 1.6, L, yd, { fill: 'muted', fillAlpha: 0.25, color: 'muted', width: 1 });
          s.hx.forEach((x) => { const k = s.xs.findIndex((xx) => Math.abs(xx - x) < 1e-6); A.line(x, s.ys[k], x, yd, { color: 'muted', width: 1.1 }); });
          A.fn(par, { domain: [0, L], color: 'green', width: 1.6, dash: [7, 5] });
          A.fn(cat, { domain: [0, L], color: 'red', width: 1.6, dash: [3, 4] });
          A.path(s.xs.map((x, k) => [x, s.ys[k]]), { color: 'accent', width: 2.6 });
          for (const x of [0, L]) { A.rect(x - 1, yd - 4, x + 1, 2, { fill: 'gray', fillAlpha: 0.35, color: 'muted', width: 1 }); }
          A.text(`deck ${(100 * s.Wd).toFixed(0)}% of the weight, ${nh.value} hangers`, L / 2, yd - 1.6, { dy: 13, align: 'center', size: 11, color: 'muted' });
          // deviation panel
          const dev = s.xs.map((x, k) => (100 * (s.ys[k] - par(x))) / d), devC = s.xs.map((x) => (100 * (cat(x) - par(x))) / d);
          const m = Math.max(0.5, ...dev.map(Math.abs), ...devC.map(Math.abs)) * 1.15;
          Bs.setView([0, 100], [-m, m]);
          Bs.hline(0, { color: 'green', width: 1.4, dash: [7, 5] });
          Bs.path(s.xs.map((x, k) => [x, devC[k]]), { color: 'red', width: 1.6, dash: [3, 4] });
          Bs.path(s.xs.map((x, k) => [x, dev[k]]), { color: 'accent', width: 2.2 });
          v.legend([['accent', 'computed cable'], ['green', 'parabola (load uniform per span)', { dash: true }], ['red', 'catenary (load uniform per cable length)', { dash: true }]]);
        });
        v.readout(() => {
          const s = cur, d = sr.value * L, par = (x) => -(4 * d * x * (L - x)) / (L * L);
          const a = catA(L, d), cat = (x) => a * Math.cosh((x - L / 2) / a) - a * Math.cosh(L / (2 * a));
          const dp = Math.max(...s.xs.map((x, k) => Math.abs(s.ys[k] - par(x)))) / d * 100, dc = Math.max(...s.xs.map((x) => Math.abs(cat(x) - par(x)))) / d * 100;
          const dcab = Math.max(...s.xs.map((x, k) => Math.abs(s.ys[k] - cat(x)))) / d * 100;
          return `Deck = **${(100 * s.Wd).toFixed(1)}%** of the total weight · largest gap from the parabola **${dp.toFixed(2)}%** of the sag (catenary vs parabola: ${dc.toFixed(2)}%; computed cable vs catenary: ${dcab.toFixed(2)}%) · $H = ${v.fix(s.H, 3)}$ × total weight, against $wL/8(d/L) = ${v.fix(1 / (8 * sr.value), 3)}$ for a pure parabola.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 2.3
    {
      num: '2.3',
      kind: 'Proposition',
      name: 'Parabola versus catenary',
      statement: String.raw`A uniform chain hanging under its own weight takes the **catenary** $y = a\cosh(x/a)$, with $a = H/w$ (horizontal tension over weight per unit *length of chain*); a cable carrying a load uniform per unit *horizontal distance* takes the **parabola**. For the same span $L$ and sag $d$ the two curves are not equal, but they agree to first order in the sag ratio $d/L$: expanding $\cosh$ gives
$$a\cosh\frac{x}{a} - a = \frac{x^2}{2a} + \frac{x^4}{24a^3} + \dots,$$
so the difference, relative to the sag, grows like $(d/L)^2$. At the sag ratios of suspension bridges ($d/L \approx 1/10$) it is a fraction of a percent of the sag; for a deep chain it is large. A cable carrying both kinds of load, $H y'' = w_{\text{deck}} + w_{\text{cable}}\sqrt{1 + y'^2}$, hangs between the two.`,
      idea: String.raw`For the chain the load on a piece of length $ds$ is $w\,ds = w\sqrt{1+y'^2}\,dx$, so $H y'' = w\sqrt{1+y'^2}$, whose solution is the hyperbolic cosine (mech-5.11). For the deck the $\sqrt{1+y'^2}$ is replaced by 1 and the solution is a parabola (2.2). Where the cable is nearly flat the square root is nearly 1, which is why the two coincide for shallow sags and part company when the ends get steep. Galileo compared the hanging chain with a parabola in 1638; Jungius showed they differ (published 1669), and Leibniz, Huygens and Johann Bernoulli found the catenary in 1691. Turned upside down, the catenary is the funicular of an arch carrying only its own weight (arch-3.1).`,
      caption: String.raw`Slide the sag ratio from very shallow to deeper than the span, and the deck's share of the load from 0 (a bare chain) to 1 (a weightless cable under a uniform deck). The gold curve is the computed funicular for that mix, between the catenary (red) and the parabola (green). The dots are a real chain of 16 equal links of the catenary's length, solved link by link: it lies on the catenary, not the parabola. The right panel plots the largest gap between catenary and parabola against the sag ratio, on log axes: a slope of 2.`,
      deps: ['arch-2.2', 'mech-5.11'],
      see: ['arch-3.1', 'solid-9.9'],
      refs: ['Allen & Zalewski'],
      credit: 'Leibniz, Huygens and Johann Bernoulli, 1691',
      tags: ['catenary', 'parabola', 'cables'],
      viz(v) {
        const sr = v.slider('sag / span', 0.02, 1.5, 0.7, { log: true });
        const sh = v.slider('deck share of the load per metre', 0, 1, 0.5, { step: 0.01 });
        const chainT = v.toggle('hang a chain of 16 equal links', true);
        const A = v.stage({ x: [-0.56, 0.56], y: [-0.4, 0.06], equal: true, axes: false, height: 340, weight: 1.25, title: 'equal span and sag' });
        const Bs = v.stage({ x: [0.02, 1.5], y: [0.003, 50], xlog: true, ylog: true, axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 260, xlabel: 'sag / span', ylabel: 'largest gap (% of sag)', title: 'catenary − parabola' });
        const curves = (r) => {
          const a = catA(1, r), c = a * Math.cosh(0.5 / a);
          return { a, cat: (x) => a * Math.cosh(x / a) - c, par: (x) => r * (4 * x * x - 1) };
        };
        const maxGap = (r) => { const { cat, par } = curves(r); let m = 0; for (let k = 0; k <= 100; k++) { const x = -0.5 + k / 100; m = Math.max(m, Math.abs(cat(x) - par(x))); } return (100 * m) / r; };
        const GAP = []; for (let k = 0; k <= 70; k++) { const r = 0.02 * Math.pow(75, k / 70); GAP.push([r, maxGap(r)]); }
        // mixed funicular H y'' = s + (1 − s) sqrt(1 + y'^2), from the low point; find H for the sag
        function mixed(r, s) {
          const run = (H) => { let y = 0, p = 0; const n = 120, h = 0.5 / n, pts = [[0, 0]]; const f = (pp) => (s + (1 - s) * Math.sqrt(1 + pp * pp)) / H;
            for (let k = 0; k < n; k++) { const k1 = f(p), k2 = f(p + (h / 2) * k1), k3 = f(p + (h / 2) * k2), k4 = f(p + h * k3); y += h * p + (h * h / 6) * (k1 + k2 + k3); p += (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4); pts.push([(k + 1) * h, y]); } return pts; };
          const H = bisect((Hh) => run(Hh)[120][1] - r, 1e-4, 1e4);
          return run(H).map(([x, y]) => [x, y - r]);
        }
        // a chain of n equal links with equal weights at the joints, of total length len, spanning 1
        function chain(len, n = 16) {
          const l = len / n, ang = (H) => Array.from({ length: n }, (_, k) => Math.atan(((n - 1) / 2 - k) / H));
          const H = bisect((Hh) => ang(Hh).reduce((a, t) => a + l * Math.cos(t), 0) - 1, 1e-4, 1e5);
          const pts = [[-0.5, 0]]; ang(H).forEach((t) => { const [x, y] = pts[pts.length - 1]; pts.push([x + l * Math.cos(t), y - l * Math.sin(t)]); });
          return pts;
        }
        let info = {};
        v.render(() => {
          const r = sr.value, { a, cat, par } = curves(r);
          const pad = 0.08 * Math.max(r, 0.15);
          A.setView([-0.56, 0.56], [-r - pad, Math.max(0.05, 0.12 * r)]);
          A.line(-0.56, 0, 0.56, 0, { color: 'faint', width: 1 });
          A.fn(par, { domain: [-0.5, 0.5], color: 'green', width: 2, dash: [7, 5] });
          A.fn(cat, { domain: [-0.5, 0.5], color: 'red', width: 2.2 });
          const mx = mixed(r, sh.value), mxAll = [...mx.slice().reverse().map(([x, y]) => [-x, y]), ...mx.slice(1)];
          A.path(mxAll, { color: 'gold', width: 2.2, dash: sh.value === 0 || sh.value === 1 ? [2, 3] : null });
          let ch = null;
          if (chainT.value) {
            let len = 0; for (let k = 0; k < 400; k++) { const x0 = -0.5 + k / 400, x1 = x0 + 1 / 400; len += Math.hypot(1 / 400, cat(x1) - cat(x0)); }
            ch = chain(len);
            A.path(ch, { color: 'ink', width: 1, alpha: 0.6 }); A.dots(ch.slice(1, -1), { r: 3.2, color: 'ink' });
          }
          for (const x of [-0.5, 0.5]) A.dot(x, 0, { r: 4, color: 'muted' });
          A.measure(0, 0, 0, -r, `d = ${v.fix(r, 3)} L`);
          // right: gap vs sag ratio
          Bs.path(GAP, { color: 'red', width: 2.2 });
          const g = maxGap(r);
          Bs.dot(r, g, { r: 5, color: 'red' });
          Bs.path([[0.02, GAP[0][1] / 3], [0.3, (GAP[0][1] / 3) * 225]], { color: 'muted', width: 1, dash: [4, 4] });
          Bs.text('slope 2', 0.045, (GAP[0][1] / 3) * 5.06, { dx: 4, dy: 12, align: 'left', size: 10.5, color: 'muted' });
          Bs.vline(143 / 1280, { color: 'accent', width: 1, dash: [3, 3] }); Bs.text('Golden Gate', 143 / 1280, 25, { dx: -4, align: 'right', size: 10.5, color: 'accent' });
          let chCat = 0, chPar = 0; if (ch) for (const [x, y] of ch) { chCat = Math.max(chCat, Math.abs(y - cat(x))); chPar = Math.max(chPar, Math.abs(y - par(x))); }
          info = { a, g, chCat: (100 * chCat) / r, chPar: (100 * chPar) / r, mx };
          v.legend([['red', 'catenary'], ['green', 'parabola', { dash: true }], ['gold', 'funicular of the mixed load'], ['ink', 'chain of 16 equal links', { dot: true }]]);
        });
        v.readout(() => {
          const r = sr.value, i = info;
          const ch = chainT.value ? ` · the 16-link chain is within **${i.chCat.toFixed(1)}%** of the sag from the catenary, ${i.chPar.toFixed(1)}% from the parabola` : '';
          return `Catenary parameter $a = H/w = ${v.fix(i.a, 3)}\\,L$ · largest gap between catenary and parabola **${i.g < 1 ? i.g.toFixed(3) : i.g.toFixed(1)}%** of the sag, i.e. ${v.fmt(i.g / 100 * r * 1000, 3)} m on a 1 km span with this sag ratio${ch}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 2.4
    {
      num: '2.4',
      kind: 'Proposition',
      name: 'Cable tension and sag: H = wL²/8d',
      statement: String.raw`A cable of span $L$ and sag $d$ carrying a load $w$ per horizontal metre has horizontal tension
$$H = \frac{wL^2}{8d}$$
everywhere, and its largest tension, at the supports, is $T_{\max} = H\sqrt{1 + 16\,(d/L)^2}$. Halving the sag doubles the tension: a flat cable is impossible, since $H \to \infty$ as $d \to 0$. A deeper sag lowers the cable force (and so the steel needed) but makes the cable longer and the towers taller, so there is an economic sag ratio, in practice around $d/L \approx 1/8$ to $1/11$. Because a cable must also carry its own weight, there is a span at which a cable of given material can carry nothing else: the stress from self-weight alone reaches the working stress when $L \approx 8(d/L)\,\sigma/\gamma$.`,
      idea: String.raw`Cut the cable at mid-span and take moments about a support for one half: the load $wL/2$ acts at $L/4$, and the only other force with a lever arm is $H$ at height $d$, so $H d = (wL/2)(L/4)$. This is the beam moment $wL^2/8$ carried by a couple of the cable tension and the tower-top-to-cable lever arm (2.1, 2.2); deeper sag means a longer lever arm and less force. The vertical component at the support is $wL/2$, and the slope there is $4d/L$, giving $T_{\max}$. Adding self-weight $\gamma A$ to $w$ and setting $A = T_{\max}/\sigma$ gives a linear equation for $A$ whose denominator vanishes at the limiting span.`,
      caption: String.raw`Slide the sag ratio, the span and the deck load. Left: the cable to scale, with its tension. Right: tension per unit of load against sag ratio, and a *cost index* (cable steel plus towers whose cost is assumed to grow with the square of their height; the tower weighting is illustrative): its minimum moves as you change the weighting. Golden Gate (1/8.9) and Akashi Kaikyō (≈ 1/10, estimated) are marked. Push the span up and the cable spends more and more of its strength holding itself up. Material: wire 1,770 MPa used at about 800 MPa, steel 78.5 kN/m³ (assumed).`,
      deps: ['arch-2.2'],
      see: ['arch-2.5'],
      refs: ['Allen & Zalewski'],
      tags: ['cables', 'sag', 'design'],
      viz(v) {
        const rS = v.slider('sag ratio d/L', 1 / 30, 1 / 4, 1 / 12, { step: 0.001, fmt: (x) => `1/${(1 / x).toFixed(1)}` });
        const LS = v.slider('span L (m)', 200, 5000, 1280, { step: 10 });
        const wS = v.slider('deck load (kN/m)', 20, 400, 200, { step: 5 });
        const kS = v.slider('tower cost weighting (illustrative)', 0, 4, 1, { step: 0.05 });
        const A = v.stage({ x: [-0.12, 1.12], y: [-0.06, 0.36], equal: true, axes: false, height: 330, weight: 1.2, title: 'the cable to scale' });
        const Bs = v.stage({ x: [1 / 32, 1 / 3.6], y: [0, 4.6], xlog: true, axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 260, xlabel: 'sag ratio d/L', ylabel: 'per unit of load wL', xticks: [[1 / 30, '1/30'], [1 / 20, '1/20'], [1 / 15, '1/15'], [1 / 10, '1/10'], [1 / 8, '1/8'], [1 / 6, '1/6'], [1 / 4, '1/4']], title: 'tension and cost against sag' });
        const SIG = 800e3, GAM = 78.5, CLR = 70; // kPa, kN/m³, m clearance below the cable's low point
        function design(r, L, w) {
          const c = (L * Math.sqrt(1 + 16 * r * r)) / (8 * r), lf = 1 + (8 / 3) * r * r, den = SIG - c * GAM * lf;
          if (den <= 0) return { ok: false, c };
          const Acab = (c * w) / den, wt = w + GAM * Acab * lf, H = (wt * L) / (8 * r), T = H * Math.sqrt(1 + 16 * r * r);
          return { ok: true, A: Acab, H, T, wt, len: L * lf, selfShare: (GAM * Acab * lf) / wt };
        }
        const cost = (r, L, w, k) => { const D = design(r, L, w); if (!D.ok) return Infinity; const h = r * L + CLR; return D.A * D.len + k * 0.004 * h * h * (L / 1000); };
        let cur = {};
        v.render(() => {
          const r = rS.value, L = LS.value, w = wS.value, D = design(r, L, w), hT = r + CLR / L;
          A.setView([-0.16, 1.12], [-0.07, Math.max(0.2, hT + 0.07)]);
          // towers, deck, cable
          A.line(-0.1, 0, 1.1, 0, { color: 'faint', width: 1 });
          for (const x of [0, 1]) A.rect(x - 0.008, 0, x + 0.008, hT, { fill: 'gray', fillAlpha: 0.4, color: 'muted', width: 1 });
          const yd = (CLR * 0.75) / L;
          A.rect(0, yd - 0.006, 1, yd, { fill: 'muted', fillAlpha: 0.3, stroke: false });
          A.fn((x) => hT - 4 * r * x * (1 - x), { domain: [0, 1], color: D.ok ? 'red' : 'faint', width: D.ok ? 1.5 + Math.min(6, D.A * 2) : 1.5, dash: D.ok ? null : [5, 4] });
          for (let k = 1; k < 16; k++) { const x = k / 16; A.line(x, hT - 4 * r * x * (1 - x), x, yd, { color: 'muted', width: 0.7, alpha: 0.6 }); }
          A.line(-0.03, hT, -0.03, hT - r, { color: 'green', width: 1.2 }); A.text(`d = ${(r * L).toFixed(0)} m`, -0.04, hT - r / 2, { align: 'right', size: 11, color: 'green' });
          A.text(`L = ${L.toLocaleString('en-US')} m`, 0.5, 0, { dy: 12, align: 'center', size: 11, color: 'muted' });
          if (D.ok) {
            A.arrow(1, hT, 1.09, hT, { color: 'accent', width: 2 }); A.text(`H = ${MN(D.H)}`, 1.1, hT, { dy: -12, align: 'right', size: 11, weight: 650, color: 'accent' });
          } else A.text('the cable cannot even carry itself at this span and sag', 0.5, hT * 0.55, { align: 'center', size: 12, weight: 650, color: 'red' });
          // right panel
          const rs = []; for (let k = 0; k <= 120; k++) rs.push((1 / 32) * Math.pow(32 / 3.6, k / 120));
          Bs.fn((x) => 1 / (8 * x), { color: 'accent', width: 2 });
          Bs.fn((x) => Math.sqrt(1 + 16 * x * x) / (8 * x), { color: 'red', width: 1.6, dash: [6, 4] });
          const cs = rs.map((x) => cost(x, L, w, kS.value)), cmin = Math.min(...cs.filter(isFinite));
          const ropt = rs[cs.indexOf(cmin)];
          if (isFinite(cmin)) Bs.path(rs.map((x, k) => [x, isFinite(cs[k]) ? Math.min(4.6, cs[k] / cmin) : null]), { color: 'green', width: 2.2 });
          if (isFinite(cmin)) { Bs.dot(ropt, 1, { r: 5, color: 'green' }); Bs.text(`cheapest ≈ 1/${(1 / ropt).toFixed(1)}`, ropt, 1, { dy: 16, align: 'center', size: 10.5, weight: 650, color: 'green' }); }
          Bs.vline(r, { color: 'gold', width: 2 });
          for (const [rr, lab, dy] of [[143 / 1280, 'Golden Gate', 4.35], [198 / 1991, 'Akashi (est.)', 3.95]]) { Bs.vline(rr, { color: 'muted', width: 1, dash: [3, 3] }); Bs.text(lab, rr, dy, { dx: -4, align: 'right', size: 10, color: 'muted' }); }
          cur = { D, ropt, cmin };
          v.legend([['accent', 'H / wL = 1/(8 d/L)'], ['red', 'T_max / wL', { dash: true }], ['green', 'cost index (÷ its minimum)'], ['gold', 'your sag ratio']]);
        });
        v.readout(() => {
          const { D } = cur, r = rS.value, L = LS.value, w = wS.value;
          const Llim = 8 * r * SIG / GAM / Math.sqrt(1 + 16 * r * r) / (1 + (8 / 3) * r * r);
          if (!D.ok) return `At $d/L$ = 1/${(1 / r).toFixed(1)} the limiting span for a cable working at 800 MPa is **${(Llim / 1000).toFixed(1)} km**; this span exceeds it, so the cable cannot carry even its own weight.`;
          const dEq = Math.sqrt((4 * D.A / 2) / Math.PI);
          return `$H = wL^2/8d$ = **${MN(D.H)}** (with self-weight, $w$ = ${D.wt.toFixed(0)} kN/m) · $T_{\\max}$ = ${MN(D.T)} · steel area **${D.A.toFixed(3)} m²** (two cables ≈ ${(dEq * 1000).toFixed(0)} mm diameter each) · the cable's own weight is **${(100 * D.selfShare).toFixed(0)}%** of the load · limiting span at this sag ratio ${(Llim / 1000).toFixed(1)} km.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 2.5
    {
      num: '2.5',
      kind: 'Invention',
      name: 'The suspension bridge',
      statement: String.raw`A suspension bridge hangs its deck from vertical **hangers** attached to two **main cables**, which pass over the tops of two **towers** and are anchored in massive **anchorages** at each end. The deck load travels deck → hangers → main cables (in tension) → over the tower saddles, where the cable force splits into a vertical push down the towers and a horizontal pull that the back-stay cables carry to the anchorages, which resist it by weight and friction or by rock. Because the cable works in pure tension in high-strength wire, the form scales to the longest spans built: the Golden Gate Bridge (1937) spans 1,280 m between towers 227 m high; the Akashi Kaikyō Bridge (1998) spans 1,991 m from cables of 36,830 wires each; the 1915 Çanakkale Bridge (2022) spans 2,023 m.`,
      idea: String.raw`Under the dead load the main cable is the parabola of 2.2 and carries $H = wL^2/8d$ (2.4). At the saddle the main-span cable and the back-stay meet; if both leave the tower at the same angle their horizontal pulls cancel and the tower is in pure compression, which is why back-stays are laid out to mirror the main cable and why towers can be slender. The anchorage must resist the full horizontal $H$ plus the back-stay's uplift. The model here is solved as a plane frame (the same solver as arch-1.1 and arch-1.8): cable and hangers as axial members, deck and towers as beams; its horizontal cable force matches $wL^2/8d$ to within the small share of load the deck carries by bending.`,
      caption: String.raw`Choose a bridge; its span, side spans, tower height and clearance are real, and its sag is the design figure (Golden Gate) or an estimate (Akashi). The vertical scale is exaggerated. Set the dead load (assumed, both cables together) and drag the truck along the deck. Every member is coloured by its computed force (red tension, blue compression, thickness ∝ force); the readout compares the frame solution with $H = wL^2/8d$ and the cable stress with the wire strength. Side spans are drawn as straight back-stays (in reality they are suspended too).`,
      deps: ['arch-2.4'],
      see: ['arch-2.6', 'arch-1.8'],
      refs: ['Salvadori'],
      credit: 'Finley, 1801 (Jacob’s Creek); Roebling (Brooklyn, 1883)',
      tags: ['bridges', 'cables'],
      viz(v) {
        const defaults = { gg: 400, ak: 600 };
        const which = v.select('bridge', [{ value: 'gg', label: 'Golden Gate' }, { value: 'ak', label: 'Akashi Kaikyō' }], 'gg', { onChange: (k) => { wS.set(defaults[k]); truck.set(0.62 * BRIDGES[k].L, BRIDGES[k].deck); } });
        const wS = v.slider('dead load (kN/m)', 100, 800, 400, { step: 10 });
        const PS = v.slider('truck (MN)', 0, 20, 6, { step: 0.5 });
        const s = v.stage({ x: [-450, 1730], y: [-20, 260], height: 360, full: true, axes: false, title: 'elevation (vertical scale exaggerated)' });
        const truck = s.handle(900, 67, { color: 'gold', constrain: (x) => { const b = BRIDGES[which.value]; return [clamp(x, 0.03 * b.L, 0.97 * b.L), b.deck]; } });
        function model(b, w, P, xP) {
          const n = 20, nodes = [], el = [], sup = {}, loads = {};
          const add = (x, y) => (nodes.push({ x, y }), nodes.length - 1);
          const bL = add(0, 0), bR = add(b.L, 0), dL = add(0, b.deck), dR = add(b.L, b.deck), tL = add(0, b.top), tR = add(b.L, b.top);
          const aL = add(-b.side, b.deck), aR = add(b.L + b.side, b.deck);
          const cab = [tL], dk = [dL];
          for (let k = 1; k < n; k++) { const x = (b.L * k) / n; cab.push(add(x, b.top - (4 * b.sag * x * (b.L - x)) / (b.L * b.L))); dk.push(add(x, b.deck)); }
          cab.push(tR); dk.push(dR);
          const T = { EA: 5e8, EI: 2e8, kind: 'tower' }, C = { EA: 200e6 * b.A, EI: 50, kind: 'cable' }, Hg = { EA: 4e6, EI: 1, kind: 'hanger' }, D = { EA: 2e8, EI: 2e8 * (b.truss / 7.6) ** 2, kind: 'deck' };
          el.push({ i: bL, j: dL, ...T }, { i: dL, j: tL, ...T }, { i: bR, j: dR, ...T }, { i: dR, j: tR, ...T });
          el.push({ i: aL, j: tL, ...C, relI: true, relJ: true, part: 'back' }, { i: tR, j: aR, ...C, relI: true, relJ: true, part: 'back' });
          for (let k = 0; k < n; k++) el.push({ i: cab[k], j: cab[k + 1], ...C, relI: k === 0, relJ: k === n - 1, part: 'main' });
          for (let k = 1; k < n; k++) el.push({ i: cab[k], j: dk[k], ...Hg, relI: true, relJ: true });
          for (let k = 0; k < n; k++) el.push({ i: dk[k], j: dk[k + 1], ...D, q: -w, relI: k === 0, relJ: k === n - 1 });
          sup[bL] = [1, 1, 1]; sup[bR] = [1, 1, 1]; sup[aL] = [1, 1, 0]; sup[aR] = [1, 1, 0];
          if (P > 0) { const k = clamp(Math.round((xP / b.L) * n), 1, n - 1); loads[dk[k]] = [0, -P, 0]; }
          return { sol: frameSolve(nodes, el, sup, loads), cab, dk, nodes, aL, aR, bL, bR };
        }
        let cur = null;
        v.render(() => {
          const b = BRIDGES[which.value];
          truck.y = b.deck; truck.x = clamp(truck.x, 0.03 * b.L, 0.97 * b.L);
          s.setView([-b.side - 0.04 * b.L, b.L + b.side + 0.04 * b.L], [-0.1 * b.top, 1.16 * b.top]);
          const P = PS.value * 1000, M = model(b, wS.value, P, truck.x), sol = M.sol; cur = { b, M, M0: P > 0 ? model(b, wS.value, 0, 0) : M };
          s.rect(-b.side - 0.1 * b.L, -0.1 * b.top, b.L + b.side + 0.1 * b.L, 0, { fill: 'blue', fillAlpha: 0.08, stroke: false });
          const Nmax = Math.max(...sol.el.map((e) => Math.abs(internal(e, 0).N)));
          const order = ['deck', 'hanger', 'tower', 'cable'];
          for (const kind of order) sol.el.filter((e) => e.kind === kind).forEach((e) => {
            const a = sol.nodes[e.i], c = sol.nodes[e.j], N = internal(e, 0).N;
            if (kind === 'deck') { s.line(a.x, a.y, c.x, c.y, { color: 'muted', width: 4, alpha: 0.6 }); return; }
            const st = forceStyle(N, Nmax, kind === 'hanger' ? 0.6 : 1.2, kind === 'tower' ? 9 : 6);
            s.line(a.x, a.y, c.x, c.y, { ...st, alpha: kind === 'hanger' ? 0.65 : 0.95 });
          });
          for (const k of [M.aL, M.aR]) { const p = sol.nodes[k]; s.rect(p.x - 0.025 * b.L, p.y - 0.11 * b.top, p.x + 0.025 * b.L, p.y + 0.02 * b.top, { fill: 'gray', fillAlpha: 0.45, color: 'muted', width: 1 }); }
          // truck arrow
          if (P > 0) { s.arrow(truck.x, b.deck + 0.2 * b.top, truck.x, b.deck + 0.03 * b.top, { color: 'gold', width: 3 }); s.text(`truck ${PS.value} MN`, truck.x, b.deck + 0.2 * b.top, { dy: -9, align: 'center', size: 10.5, weight: 650, color: 'gold' }); }
          // labels
          const H = internal(sol.el.find((e) => e.part === 'main'), 0).N * Math.cos(Math.atan2(sol.nodes[M.cab[1]].y - b.top, sol.nodes[M.cab[1]].x));
          const tow = internal(sol.el[1], 0).N, back = internal(sol.el[4], 0).N;
          placeLabels(v, s, [
            { x: b.L / 2, y: b.top - b.sag, text: `main cable: H = ${MN(H)}`, color: 'red', weight: 650, prefer: [0, -1], r: 3 },
            { x: 0, y: b.top, text: `tower ${MN(-tow)} compression`, color: 'blue', weight: 650, prefer: [1, -1], r: 6 },
            { x: -b.side / 2, y: (b.top + b.deck) / 2, text: `back-stay ${MN(back)}`, color: 'red', prefer: [-1, 0], r: 3 },
            { x: b.L / 2, y: b.deck, text: `${b.name}: span ${b.L.toLocaleString('en-US')} m, sag ${b.sag} m (${b.sagNote})`, color: 'muted', size: 10.5, prefer: [0, 2], r: 2 },
          ]);
          const ex = (s.height / (1.26 * b.top)) / (s.width / (b.L + 2 * b.side + 0.08 * b.L));
          s.corner(`vertical scale × ${ex.toFixed(1)}`, 'tr', { color: 'muted' });
          v.legend([['red', 'tension (thickness ∝ force)'], ['blue', 'compression'], ['muted', 'deck (a beam)'], ['gold', 'truck (drag it)']]);
        });
        v.readout(() => {
          const { b, M, M0 } = cur, sol = M.sol, w = wS.value;
          const Hof = (S) => { const e0 = S.el.find((e) => e.part === 'main'), ang = Math.atan2(S.nodes[e0.j].y - S.nodes[e0.i].y, S.nodes[e0.j].x - S.nodes[e0.i].x); return internal(e0, 0).N * Math.cos(ang); };
          const main = sol.el.filter((e) => e.part === 'main'), H0 = Hof(M0.sol), Hf = Hof(sol), Hform = (w * b.L * b.L) / (8 * b.sag), Tmax = Math.max(...main.map((e) => internal(e, 0).N));
          const sig = Tmax / b.A / 1000, mBase = Math.abs(sol.R[M.bL][2]) / 1000;
          return `Dead load alone: frame $H$ = **${MN(H0)}** vs $wL^2/8d$ = ${MN(Hform)} (${v.fix(100 * (H0 / Hform - 1), 1)}%: the deck takes a sliver by bending) · the truck adds ${MN(Hf - H0, 2)} · cable tension at the tower ${MN(Tmax)} → stress **${sig.toFixed(0)} MPa** in ${b.A.toFixed(2)} m² of wire (strength ${b.fu.toLocaleString('en-US')} MPa, i.e. ${(100 * sig / b.fu).toFixed(0)}%) · anchorage pull ${MN(Math.hypot(...sol.R[M.aL].slice(0, 2)))} · left tower base moment ${v.fmt(mBase, 3)} MN·m.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 2.6
    {
      num: '2.6',
      kind: 'Concept',
      name: 'Deck stiffening against moving loads',
      statement: String.raw`A cable alone changes shape whenever its load changes: a heavy truck at the quarter point pulls a kink into it. The **stiffening girder or truss** of the deck spreads a concentrated load over many hangers, so the cable sees a nearly uniform load and keeps its shape. How stiff the deck must be depends on how the cable helps. The *elastic theory* (Rankine, Navier, 19th century) treats the cable's shape as fixed, so the deck alone resists the uneven part of the load and must be deep. The **deflection theory** (Melan, 1888) adds the restoring effect of the large dead-load tension $H$ acting on the deflection $v$:
$$EI\,v'''' - H\,v'' = p(x) - h\,\frac{8d}{L^2},$$
where $h$ is the extra cable tension set by the cable's stretch. Since $H$ grows with span, long spans need relatively shallower decks; first used by Moisseiff on the Manhattan Bridge (1909), it allowed the slender decks of the 1930s, down to the 1:350 plate girders of the Tacoma Narrows Bridge (1940).`,
      idea: String.raw`The term $-Hv''$ says that a deflected cable under tension pushes back, like a taut string: the gravity stiffness of the cable. It is absent from the elastic theory, which therefore overestimates deck moments, and the more so the longer and heavier the bridge, because the ratio of cable stiffness to deck stiffness is governed by the length $\sqrt{EI/H}$ compared with the span. The compatibility condition $hL_e/E_cA_c = (8d/L^2)\int_0^L v\,dx$ (the cable stretches by the extra sag) closes the system. The deflection theory was correct for vertical loads. Tacoma Narrows did not fall because of it: in a 42 mph wind its thin, shallow deck twisted in a 0.2 Hz torsional mode that drew energy from the wind (single-degree-of-freedom torsional flutter, a negative aerodynamic damping), not from a gust frequency matching it (Billah & Scanlan 1991; see arch-7.9).`,
      caption: String.raw`Choose a deck: span and deck depth are real (WSDOT comparison table); the dead load, the chord areas that set $EI$ from the depth, and the sag ratio 1/10 are illustrative assumptions shared by all three. Drag the truck position and change its weight, or override the depth. The deck's deflection (top, exaggerated) and bending moment (bottom) are solved by finite differences in both theories: green includes the cable's gravity stiffness (deflection theory), orange leaves it out (elastic theory). For the slender Tacoma girder the two disagree by a large factor.`,
      deps: ['arch-2.5'],
      see: ['arch-7.9', 'aero-6.10'],
      refs: ['Salvadori'],
      credit: 'Melan, 1888; Moisseiff, 1909',
      tags: ['bridges', 'stiffness', 'Tacoma Narrows'],
      viz(v) {
        const PRE = { gg: { name: 'Golden Gate', L: 1280, h: 7.6 }, bw: { name: 'Bronx–Whitestone', L: 701, h: 3.35 }, tn: { name: 'Tacoma Narrows 1940', L: 853, h: 2.44 } };
        const pre = v.select('deck', [{ value: 'gg', label: 'Golden Gate (25 ft truss, 1:168)' }, { value: 'bw', label: 'Bronx–Whitestone (11 ft, 1:209)' }, { value: 'tn', label: 'Tacoma 1940 (8 ft, 1:350)' }], 'tn', { onChange: (k) => hS.set(PRE[k].h) });
        const hS = v.slider('deck depth (m)', 1, 16, 2.44, { step: 0.01 });
        const xS = v.slider('truck at (× span)', 0.05, 0.95, 0.27, { step: 0.005 });
        const PS = v.slider('truck (MN on 30 m)', 0.5, 8, 3, { step: 0.1 });
        const A = v.stage({ x: [0, 1], y: [-1, 1], axes: false, height: 230, full: true, title: 'deck deflection (exaggerated)' });
        const B = v.stage({ x: [0, 1], y: [-1, 1], axes: 'box', gutter: true, height: 230, full: true, xlabel: 'position along the span (fraction)', ylabel: 'deck moment (MN·m)' });
        const W = 150, E = 2e8, EcAcPerH = 1 / 0.003; // kN/m dead load; kPa; cable sized to work at ≈ 600 MPa (strain 0.003)
        function solveDeck(L, depth, xp, P, useH) {
          const d = L / 10, H = (W * L * L) / (8 * d), EI = E * 0.12 * depth * depth, EcAc = H * EcAcPerH, n = 199, dx = L / (n + 1);
          const a4 = EI / dx ** 4, a2 = (useH ? H : 0) / dx ** 2;
          // pentadiagonal SPD matrix, simply supported ends (ghost v_-1 = -v_1)
          const band = (i, j) => { const k = Math.abs(i - j); let val = k === 0 ? 6 * a4 + 2 * a2 : k === 1 ? -4 * a4 - a2 : k === 2 ? a4 : 0; if (k === 0 && (i === 0 || i === n - 1)) val -= a4; return val; };
          const p = new Array(n).fill(0), u = new Array(n).fill(8 * d / (L * L));
          for (let i = 0; i < n; i++) { const x = (i + 1) * dx; if (Math.abs(x - xp * L) <= 15) p[i] = P / 30; }
          const solveBand = (rhs) => { // Gaussian elimination restricted to the band (no pivoting; SPD)
            const N = n, Ab = Array.from({ length: N }, (_, i) => { const r = new Float64Array(5); for (let k = -2; k <= 2; k++) if (i + k >= 0 && i + k < N) r[k + 2] = band(i, i + k); return r; }), b = rhs.slice();
            for (let i = 0; i < N; i++) for (let r = i + 1; r <= Math.min(N - 1, i + 2); r++) { const f = Ab[r][i - r + 2] / Ab[i][2]; for (let c = i; c <= Math.min(N - 1, i + 2); c++) Ab[r][c - r + 2] -= f * Ab[i][c - i + 2]; b[r] -= f * b[i]; }
            const x = new Array(N).fill(0); for (let i = N - 1; i >= 0; i--) { let acc = b[i]; for (let c = i + 1; c <= Math.min(N - 1, i + 2); c++) acc -= Ab[i][c - i + 2] * x[c]; x[i] = acc / Ab[i][2]; } return x;
          };
          const vp = solveBand(p), v1 = solveBand(u), Ip = vp.reduce((a, b) => a + b, 0) * dx, I1 = v1.reduce((a, b) => a + b, 0) * dx;
          const Le = L * (1 + 8 * (d / L) ** 2), h = ((8 * d / (L * L)) * Ip) / (Le / EcAc + (8 * d / (L * L)) * I1);
          const vv = [0, ...vp.map((x, i) => x - h * v1[i]), 0], Mm = vv.map((_, i) => (i === 0 || i === n + 1 ? 0 : -EI * (vv[i + 1] - 2 * vv[i] + vv[i - 1]) / (dx * dx)));
          return { v: vv, M: Mm, h, H, EI, dx, n, lam: Math.sqrt(EI / H) };
        }
        let cur = null;
        v.render(() => {
          const L = PRE[pre.value].L, depth = hS.value, P = PS.value * 1000;
          const dt = solveDeck(L, depth, xS.value, P, true), et = solveDeck(L, depth, xS.value, P, false); cur = { dt, et, L, depth };
          const xs = dt.v.map((_, i) => i / (dt.n + 1));
          const vmax = Math.max(...et.v.map(Math.abs), ...dt.v.map(Math.abs), 1e-9), k = 0.6 / vmax;
          A.setView([-0.02, 1.02], [-0.8, 0.95]);
          A.line(0, 0, 1, 0, { color: 'faint', width: 1, dash: [4, 4] });
          A.path(xs.map((x, i) => [x, -k * et.v[i]]), { color: 'orange', width: 2.2 });
          A.path(xs.map((x, i) => [x, -k * dt.v[i]]), { color: 'green', width: 2.6 });
          A.rect(xS.value - 15 / L, 0.03, xS.value + 15 / L, 0.13, { fill: 'gold', fillAlpha: 0.5, color: 'gold', width: 1.4, radius: 2 });
          A.arrow(xS.value, 0.3, xS.value, 0.15, { color: 'gold', width: 2.4 });
          for (const x of [0, 1]) drawSupport(v, A, x, 0, 'pin');
          A.corner(`${PRE[pre.value].name}: span ${L} m, depth ${depth.toFixed(2)} m (1:${(L / depth).toFixed(0)})`, 'bl', { color: 'muted' });
          const Mx = Math.max(...et.M.map(Math.abs), ...dt.M.map(Math.abs)) / 1000 * 1.12;
          B.setView([0, 1], [-Mx, Mx]);
          B.hline(0, { color: 'faint', width: 1 });
          B.path(xs.map((x, i) => [x, et.M[i] / 1000]), { color: 'orange', width: 2 });
          B.path(xs.map((x, i) => [x, dt.M[i] / 1000]), { color: 'green', width: 2.4 });
          B.vline(xS.value, { color: 'gold', width: 1, dash: [3, 3] });
          v.legend([['green', 'deflection theory (cable tension stiffens)'], ['orange', 'elastic theory (cable shape fixed)'], ['gold', 'truck']]);
        });
        v.readout(() => {
          const { dt, et, L, depth } = cur, dv = Math.max(...dt.v.map(Math.abs)), ev = Math.max(...et.v.map(Math.abs)), dm = Math.max(...dt.M.map(Math.abs)) / 1000, em = Math.max(...et.M.map(Math.abs)) / 1000;
          return `Deflection theory: largest deflection **${dv.toFixed(2)} m**, largest moment **${v.fmt(dm, 3)} MN·m** · elastic theory: ${ev.toFixed(2)} m, ${v.fmt(em, 3)} MN·m (×${(em / dm).toFixed(1)}) · dead-load tension $H$ = ${MN(dt.H)}, extra tension $h$ = ${MN(dt.h)} · stiffness length $\\sqrt{EI/H}$ = ${dt.lam.toFixed(0)} m against a span of ${L} m (depth/span 1:${(L / depth).toFixed(0)}).`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 2.7
    {
      num: '2.7',
      kind: 'Invention',
      name: 'Cable-stayed bridges: fan and harp',
      statement: String.raw`A **cable-stayed** bridge hangs its deck from straight stays running directly to one or more pylons, with no main cable and usually no anchorages: the horizontal components of the stays on the two sides of a pylon balance each other, and the deck itself carries them back to the pylon as **compression**. In a **fan** layout the stays converge near the pylon top; in a **harp** they are parallel, anchored up the height of the pylon. A stay at angle $\theta$ to the horizontal carrying a deck panel of weight $W$ pulls with $T = W/\sin\theta$, so shallow stays far from the pylon are the most heavily loaded and push the most compression into the deck. The form spread after the Strömsund Bridge (Sweden, 1956, 182 m) and now reaches spans of about 1.1–1.2 km (Russky Bridge, 1,104 m, 2012; Changtai Yangtze River Bridge, 2025).`,
      idea: String.raw`Each stay is a straight two-force member, so equilibrium at its deck anchor splits the panel weight into the stay tension and a horizontal push into the deck (the force triangle of arch-1.4): $T = W/\sin\theta$, $N = W/\tan\theta$. The deck compression accumulates from the free end to the pylon. A fan gives the steepest average angle (least steel, least deck compression) but crowds anchors at the pylon head; a harp looks calm and is simpler to anchor, but an unbalanced load bends the pylon because the stays meet it at different heights. The model here is a linear plane frame (the solver of arch-1.1), which is accurate for stayed bridges to first order since the stays are nearly straight.`,
      caption: String.raw`Switch between fan and harp, change the pylon height and the number of stays, and drag the traffic patch along the deck. Stays are drawn with thickness ∝ tension (red), the deck coloured by its computed compression (blue), the pylon by its axial force; the dashed line is the deflected shape, exaggerated. The readout checks the frame against the hand rule $T \approx W/\sin\theta$ and compares the pylon bending in the two layouts. (Dead load 150 kN/m and stay sizes are illustrative.)`,
      deps: ['arch-2.4'],
      see: ['arch-1.4', 'arch-2.5'],
      refs: ['Salvadori'],
      credit: 'Strömsund Bridge, 1956',
      tags: ['bridges', 'cable-stayed'],
      viz(v) {
        const lay = v.select('layout', [{ value: 'fan', label: 'fan' }, { value: 'harp', label: 'harp' }], 'fan');
        const hS = v.slider('pylon height (m)', 40, 140, 80, { step: 1 });
        const nS = v.slider('stays per side', 3, 12, 7, { int: true });
        const qS = v.slider('traffic patch (kN/m over 60 m)', 0, 200, 80, { step: 5 });
        const s = v.stage({ x: [-215, 215], y: [-45, 160], equal: true, axes: false, height: 340, full: true, title: 'single-pylon cable-stayed bridge, 2 × 200 m' });
        const patch = s.handle(90, 0, { color: 'gold', constrain: (x) => [clamp(x, -170, 170), 0] });
        const L = 200, QD = 150, BASE = -35;
        function model(type, h, n, xp, ql) {
          const nodes = [], el = [], sup = {}, loads = {}, add = (x, y) => (nodes.push({ x, y }), nodes.length - 1);
          const xs = []; for (let k = 1; k <= n; k++) xs.push((L * (k - 0.25)) / n);
          const dx = [-L, ...xs.slice().reverse().map((x) => -x), 0, ...xs, L];
          const dk = dx.map((x) => add(x, 0)), mid = dk[n + 1];
          const base = add(0, BASE);
          const tops = []; // pylon anchor nodes (bottom to top)
          if (type === 'fan') tops.push(add(0, h)); else for (let k = 1; k <= n; k++) tops.push(add(0, (h * xs[k - 1]) / xs[n - 1]));
          const DK = { EA: 3e8, EI: 1e6, kind: 'deck' }, PY = { EA: 6e8, EI: 3e8, kind: 'pylon' }, ST = { EA: 195e6 * 0.02, EI: 1, kind: 'stay' };
          for (let k = 0; k + 1 < dk.length; k++) { const xm = (dx[k] + dx[k + 1]) / 2; el.push({ i: dk[k], j: dk[k + 1], ...DK, q: -(QD + (Math.abs(xm - xp) <= 30 ? ql : 0)) }); }
          el.push({ i: base, j: mid, ...PY }); let prev = mid; for (const t of tops) { el.push({ i: prev, j: t, ...PY }); prev = t; }
          for (let k = 0; k < n; k++) {
            const top = type === 'fan' ? tops[0] : tops[k];
            el.push({ i: dk[n + 2 + k], j: top, ...ST, relI: true, relJ: true, side: 1, k }); el.push({ i: dk[n - k], j: top, ...ST, relI: true, relJ: true, side: -1, k });
          }
          sup[base] = [1, 1, 1]; sup[dk[0]] = [0, 1, 0]; sup[dk[dk.length - 1]] = [0, 1, 0];
          return { sol: frameSolve(nodes, el, sup, loads), xs, dk, mid, base, tops };
        }
        let cur = null;
        v.render(() => {
          const h = hS.value, n = nS.value, M = model(lay.value, h, n, patch.x, qS.value), sol = M.sol; cur = M;
          s.setView([-215, 215], [-48, h + 22]);
          s.rect(-215, BASE - 15, 215, BASE, { fill: 'blue', fillAlpha: 0.08, stroke: false });
          const stays = sol.el.filter((e) => e.kind === 'stay'), Ns = stays.map((e) => internal(e, 0).N), Smax = Math.max(...Ns);
          const deck = sol.el.filter((e) => e.kind === 'deck'), Nd = deck.map((e) => internal(e, (e.L) / 2).N), Dmax = Math.max(...Nd.map(Math.abs), 1);
          deck.forEach((e, k) => { const a = sol.nodes[e.i], c = sol.nodes[e.j], t = Math.abs(Nd[k]) / Dmax; s.line(a.x, 0, c.x, 0, { color: Nd[k] < 0 ? 'blue' : 'red', width: 3 + 6 * t, alpha: 0.35 + 0.6 * t }); });
          stays.forEach((e, k) => { const a = sol.nodes[e.i], c = sol.nodes[e.j]; s.line(a.x, a.y, c.x, c.y, forceStyle(Ns[k], Smax, 0.8, 5.5)); });
          sol.el.filter((e) => e.kind === 'pylon').forEach((e) => { const a = sol.nodes[e.i], c = sol.nodes[e.j]; s.line(a.x, a.y, c.x, c.y, { color: 'blue', width: 7, alpha: 0.75 }); });
          // deflected shape (deck), exaggerated
          let dmax = 1e-9; for (const e of deck) for (const xi of [0, 0.5, 1]) dmax = Math.max(dmax, Math.abs(deflected(sol, e, xi, 1)[1]));
          const kx = 12 / dmax, pts = []; for (const e of deck) for (let q = 0; q <= 6; q++) pts.push(deflected(sol, e, q / 6, kx));
          s.path(pts, { color: 'ink', width: 1.2, dash: [5, 4], alpha: 0.7 });
          drawSupport(v, s, -L, 0, 'roller'); drawSupport(v, s, L, 0, 'roller');
          s.rect(patch.x - 30, 2.5, patch.x + 30, 2.5 + qS.value / 25, { fill: 'gold', fillAlpha: 0.45, color: 'gold', width: 1 });
          // labels: the outermost stays on each side
          const outer = stays.filter((e) => e.k === n - 1), lab = outer.map((e) => { const a = sol.nodes[e.i], c = sol.nodes[e.j]; return { x: (a.x * 0.7 + c.x * 0.3), y: (a.y * 0.7 + c.y * 0.3), text: `${MN(internal(e, 0).N, 2)}`, color: 'red', weight: 650, r: 2, prefer: [e.side, -1] }; });
          const iMid = deck.findIndex((e) => sol.nodes[e.j].x === 0);
          lab.push({ x: -L / 4, y: 0, text: `deck compression up to ${MN(Dmax, 2)}`, color: 'blue', weight: 650, r: 3, prefer: [0, 2] });
          placeLabels(v, s, lab);
          void iMid;
          v.legend([['red', 'stay tension (thickness ∝ force)'], ['blue', 'deck and pylon compression'], ['ink', 'deflected deck (exaggerated)', { dash: true }], ['gold', 'traffic patch']]);
        });
        v.readout(() => {
          const M = cur, sol = M.sol, stays = sol.el.filter((e) => e.kind === 'stay');
          const out = stays.find((e) => e.k === Math.floor(nS.value / 2) && e.side === -1), a = sol.nodes[out.i], c = sol.nodes[out.j], sinT = (c.y - a.y) / Math.hypot(c.x - a.x, c.y - a.y);
          const W = QD * (L / nS.value), hand = W / sinT, Nout = internal(out, 0).N;
          const pyl = sol.el.find((e) => e.kind === 'pylon'), Mbase = Math.abs(sol.R[M.base][2]) / 1000;
          return `Middle stay on the left (θ = ${(Math.asin(sinT) * 180 / Math.PI).toFixed(1)}°): frame **${MN(Nout)}**, hand rule $W/\\sin\\theta$ = ${MN(hand)} for its ${(L / nS.value).toFixed(0)} m of dead load · total stay tension ${MN(stays.reduce((acc, e) => acc + internal(e, 0).N, 0))} · pylon base: ${MN(-internal(pyl, 0).N)} compression, bending moment **${v.fmt(Mbase, 3)} MN·m** (${lay.value}).`;
        });
      },
    },
  ],
};
