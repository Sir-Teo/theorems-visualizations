// Geology & Geophysics — Chapter 3: Plate tectonics on a sphere (part a: 3.1–3.5)
//
// Sources checked / provenance (Oct 2026):
//   3.1  Bullard, Everett & Smith (1965) fit of South America to Africa: Euler pole 42.9° N, 30.1° W, rotation 57.1°, rms misfit
//        ≈ 130 km on the 500-fathom contour (values read from the Virtual Explorer reproduction of their Table 1; the paper itself
//        was not opened). Only coastlines (Natural Earth 110 m) are available here, so the fit is looser than theirs. The fossil
//        and fold-belt localities are approximate points, placed from memory to illustrate the matches Wegener cited.
//   3.2  Polarity time scale: rounded from Cande & Kent (1995) / GPTS 2012–2020 (Wikipedia list of geomagnetic reversals, checked
//        to ±0.06 Myr). Credit: Vine & Matthews 1963 (Nature 199: 947–949, Crossref-checked); Morley & Larochelle 1964 independently.
//   3.3  geometry only; thresholds (20° obliquity) are a convention of this page.
//   3.4  Euler's theorem is mathematics; all numbers are computed.
//   3.5  the ridge polyline is a schematic of the South Atlantic and equatorial Mid-Atlantic Ridge placed from memory (transform
//        offsets omitted); the rate ω is a slider, not a measured value.

import { D, R_EARTH, V, LL, dot, cross, vadd, vscale, vunit, vnorm, angDist, bearing, dest, arc, rotMat, mmul, mapply, rotPts, rotApply, axisAngle, velAt, mod360, wrap180, azDiff, clamp, smallCirc, NORMALS, polarityAt, anomalyProfile, ID3 } from './ch03.shared.js';

/** Planar point-in-ring test in lon/lat (fine for continent-sized rings away from the poles and the date line). */
function inRing(x, y, ring) {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

export default {
  collection: 'geol',
  chapter: 3,
  title: 'Plate tectonics on a sphere',
  summary: String.raw`The lithosphere is broken into rigid plates moving over the softer mantle. Because the plates live on a sphere, every relative motion is a rotation about an Euler pole, which predicts how spreading rates vary along a ridge and why transform faults trace small circles. Magnetic stripes date the sea floor, triple junctions can be stable or not, and hotspot tracks record plate motion over the deep mantle.`,
  items: [
    // ───────────────────────────────────────── 3.1
    {
      num: '3.1',
      kind: 'Hypothesis',
      name: 'Continental drift (Wegener)',
      statement: String.raw`The continents were once joined in a single land mass and have since moved apart horizontally, over distances of thousands of kilometres. The evidence offered for it is geometrical and geological: the facing coasts of the Atlantic fit like torn pieces of paper, and when they are closed, rock belts, fold belts, glacial deposits and fossil land animals and plants that make no sense on opposite sides of an ocean line up across the join. In the form proposed by Wegener (1912), the mechanism was left unspecified — and his own was inadequate — so the hypothesis described *that* the continents moved, not *how*.`,
      idea: String.raw`The argument is a test by coincidence: if the continents never moved, the fit of coastlines and the matching of unrelated features across the join would both have to be accidents. A rigid rotation of one continent about a single axis (Euler's theorem, mech-10.1) is the minimal motion that could close the gap, so one rotation should bring *all* the matching pairs together at once, and the pairs become a quantitative check. What the hypothesis lacked was a mechanism and a way to measure: it needed the sea-floor evidence of the 1950s–60s, and a fit of the continental *shelf edge* instead of the shoreline, to be accepted.`,
      caption: String.raw`Slide the Atlantic closed: South America rotates about the purple Euler pole $E$ (start at the pole of Bullard, Everett & Smith, 1965). The three coloured pairs are matching features on the two sides (approximate localities): they approach each other together as one rotation closes the gap. Drag $E$ away from the published pole and watch the coastlines overlap and the pairs part again; the globe also rotates when you drag the sea.`,
      deps: [],
      refs: ['Turcotte–Schubert ch. 1', 'Press–Siever'],
      tags: ['drift', 'wegener', 'fit'],
      credit: 'Alfred Wegener, 1912 (lecture 6 January 1912, Frankfurt)',
      scope: String.raw`A kinematic hypothesis about relative position only. It says nothing about forces, and a closure by coastlines alone (as here) is only an approximation to the closure of the continental shelf edges.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Continental_drift' },
      verify: true,
      viz(v) {
        const s = v.stage({ height: 430, full: true });
        const G = v.globe(s, { projection: 'orthographic', center: [-12, -8], graticule: 30 });
        const E = G.handle(-30.1, 42.9, { label: 'E', color: 'purple' });
        const pct = v.slider('closure (% of 57.1° rotation)', 0, 100, 100, { step: 1 });
        const AF = G.landmass('Africa'), SA = G.landmass('South America');
        // sample South America on a 1.5° grid (inside the coastline), for the overlap measure
        const samples = [];
        for (let la = -56; la <= 13; la += 1.5) for (let lo = -82; lo <= -34; lo += 1.5) if (inRing(lo, la, SA[0])) samples.push([lo, la, Math.cos(la * D)]);
        const wsum = samples.reduce((a, q) => a + q[2], 0);
        const pairs = [
          { name: 'Mesosaurus beds', a: [-52, -28], b: [20, -29], color: 'green' },
          { name: 'fold belt (Ventana – Cape)', a: [-62, -38], b: [20, -33.5], color: 'gold' },
          { name: 'Permo-Carboniferous tillite', a: [-50, -24.5], b: [27, -27], color: 'pink' },
        ];
        v.render(() => {
          const ang = (57.1 * pct.value) / 100, M = rotMat([E.lon, E.lat], ang);
          G.draw({ land: false });
          G.land(null, { fillAlpha: 0.08, alpha: 0.3, color: 'muted', fill: 'muted' });
          G.polygon(AF, { fill: 'orange', fillAlpha: 0.32, color: 'orange', width: 1.4 });
          for (let a = 0.25; a < 1; a += 0.25) if (a * 100 < pct.value) G.polygon(rotApply(rotMat([E.lon, E.lat], 57.1 * a), SA), { color: 'teal', width: 0.7, alpha: 0.4 });
          G.polygon(rotApply(M, SA), { fill: 'teal', fillAlpha: 0.32, color: 'teal', width: 1.6 });
          for (const p of pairs) {
            const a2 = rotApply(M, p.a);
            G.path([a2, p.b], { color: p.color, width: 1.4, dash: [3, 3], alpha: 0.85 });
            G.dot(a2, { r: 5, color: p.color }); G.dot(p.b, { r: 5, color: p.color });
          }
          s.corner(`rotation ${v.fix(ang, 1)}°`, 'tl');
        });
        v.legend([['orange', 'Africa (fixed)'], ['teal', 'South America'], ['green', 'Mesosaurus beds'], ['gold', 'fold belts'], ['pink', 'tillites']]);
        v.readout(() => {
          const ang = (57.1 * pct.value) / 100, M = rotMat([E.lon, E.lat], ang);
          let ov = 0; for (const q of samples) { const r = rotApply(M, [q[0], q[1]]); if (inRing(r[0], r[1], AF[0])) ov += q[2]; }
          const dists = pairs.map((p) => (angDist(rotApply(M, p.a), p.b) * D * R_EARTH));
          const m = dists.reduce((a, x) => a + x, 0) / dists.length;
          return `pair separations: ${dists.map((d) => v.fix(d / 1000, 1) + '\\,000').join(' · ')} km (mean **${v.fix(m, 0)} km**) · coastline overlap: **${v.fix((100 * ov) / wsum, 1)}%** of South America · pole $E=(${v.fix(E.lat, 1)}^\\circ\\mathrm{N},\\,${v.fix(Math.abs(E.lon), 1)}^\\circ\\mathrm{${E.lon < 0 ? 'W' : 'E'}})$. Bullard et al. closed the 500-fathom contours with rms misfit about 130 km (their pole: $42.9^\\circ$N, $30.1^\\circ$W, $57.1^\\circ$).`;
        });
      },
    },
    // ───────────────────────────────────────── 3.2
    {
      num: '3.2',
      kind: 'Phenomenon',
      name: 'Seafloor spreading and magnetic stripes',
      statement: String.raw`Oceanic crust is created at the mid-ocean ridges and carried symmetrically away on both sides. As basalt cools through the Curie temperature it records the direction of the geomagnetic field, which reverses at irregular intervals; so the crust is a tape recording of the reversal history. Measured along a track across a ridge, the total magnetic field shows long linear *stripes* — positive anomalies over normally magnetized crust, negative over reversely magnetized crust — that mirror each other about the ridge axis and whose widths are the polarity-interval durations multiplied by the half-spreading rate: $w = u\,\Delta t$.`,
      idea: String.raw`The sea floor is built by a conveyor: at distance $x$ from the axis the rock is $x/u$ old, and it carries the polarity the field had when it cooled (thermoremanent magnetization, mat-9.12). The anomaly is the magnetic field of that stripe pattern minus the ambient field, so it is large where the field of a stripe is not cancelled by its neighbours — and it fades when the stripes are narrower than the depth to the magnetic layer, because the field of a thin body spreads out (upward continuation). That is why fast-spreading ridges show clean stripes in the shortest chrons while slow ones blur them, and why the same time scale fits every ocean.`,
      caption: String.raw`Set the half-spreading rate: the upper strip shows the crust, coloured by polarity and labelled with the main chrons; below is the computed total-field anomaly along a ship track (a block model: each stripe a layer of effective susceptibility $\pm0.004$, 2 km thick). Slow the ridge or deepen the layer and the short events (Jaramillo, Olduvai) wash out; switch off reversals and the pattern disappears; tilt the field toward the equator to see how the stripe amplitudes change.`,
      deps: ['geol-3.1', 'mat-9.12'],
      refs: ['Turcotte–Schubert ch. 1', 'Stein–Wysession ch. 5'],
      tags: ['spreading', 'magnetism', 'reversals'],
      credit: 'F. J. Vine & D. H. Matthews, 1963 (and L. W. Morley, independently, 1963–64)',
      scope: String.raw`Needs a field that reverses and a ridge that spreads in a steady, symmetric way. Anomalies are modelled here as 2-D infinitely long stripes, ignoring seafloor topography, the thinner magnetic layers of slow ridges, and the non-vertical boundaries of real polarity transitions (smoothed with the "boundary width" slider).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Vine%E2%80%93Matthews%E2%80%93Morley_hypothesis' },
      verify: true,
      viz(v) {
        const T = 5.9; // Myr covered by the model
        const rate = v.slider('half-spreading rate $u$ (mm/yr)', 5, 80, 25, { step: 1 });
        const incl = v.slider('field inclination $I$ (°)', -90, 90, 60, { step: 1 });
        const depth = v.slider('depth to the magnetic layer (km)', 1, 8, 3, { step: 0.1 });
        const blur = v.slider('boundary width (km)', 0, 10, 2, { step: 0.5 });
        const rev = v.toggle('field reverses', true);
        const strip = v.stage({ x: [-100, 100], y: [0, 1], axes: false, height: 120, full: true });
        const prof = v.stage({ x: [-100, 100], y: [-300, 300], axes: 'box', gutter: true, xlabel: 'distance from the ridge axis (km)', ylabel: 'anomaly (nT)', height: 300, full: true });
        let info = {};
        v.render(() => {
          const u = rate.value, X = T * u, k = 4 * Math.PI * 0.004; // effective susceptibility 0.004 emu, in SI-equivalent factor 4π
          strip.setView([-X, X], [0, 1]); prof.setView([-X, X], [-300, 300]);
          // build blocks on both sides from the polarity scale
          const edges = [0]; for (const [a, b] of NORMALS) { if (a > 0 && a < T) edges.push(a); if (b < T) edges.push(b); }
          edges.push(T); const ev = [...new Set(edges)].sort((a, b) => a - b);
          const blocks = [];
          for (let i = 0; i + 1 < ev.length; i++) {
            const pol = rev.value ? polarityAt((ev[i] + ev[i + 1]) / 2) : 1;
            for (const sg of [-1, 1]) blocks.push({ x0: Math.min(sg * ev[i] * u, sg * ev[i + 1] * u), x1: Math.max(sg * ev[i] * u, sg * ev[i + 1] * u), s: pol * k });
            for (const sg of [-1, 1]) strip.rect(Math.min(sg * ev[i] * u, sg * ev[i + 1] * u), 0.05, Math.max(sg * ev[i] * u, sg * ev[i + 1] * u), 0.78, { fill: pol > 0 ? 'ink' : 'faint', fillAlpha: pol > 0 ? 0.75 : 0.25, color: 'muted', width: 0.5 });
          }
          for (const [nm, a, b] of [['Brunhes', 0, 0.78], ['Matuyama', 0.78, 2.58], ['Gauss', 2.58, 3.58], ['Gilbert', 3.58, T]]) for (const sg of [-1, 1]) strip.text(nm, sg * ((a + b) / 2) * u, 0.92, { size: 10.5, color: 'muted', align: 'center' });
          strip.text('normal ■   reversed □', X * 0.62, 0.0, { size: 11, color: 'muted', baseline: 'bottom' }); strip.vline(0, { color: 'orange', width: 1.5 });
          strip.text('ridge', 0, 0.99, { size: 11, color: 'orange', align: 'center', baseline: 'top' });
          const n = 260, xs = Array.from({ length: n }, (_, i) => -X + (2 * X * i) / (n - 1));
          let ys = anomalyProfile(xs, blocks, { zTop: depth.value, thick: 2, F: 50000, incl: incl.value, dAng: 0 });
          if (blur.value > 0.01) { // Gaussian smoothing = blurred polarity boundaries
            const dx = xs[1] - xs[0], sg = blur.value / dx, h = Math.ceil(3 * sg), ker = []; let ks = 0;
            for (let j = -h; j <= h; j++) { const w = Math.exp(-0.5 * (j / sg) ** 2); ker.push(w); ks += w; }
            ys = ys.map((_, i) => { let a = 0; for (let j = -h; j <= h; j++) { const q = clamp(i + j, 0, n - 1); a += ker[j + h] * ys[q]; } return a / ks; });
          }
          prof.hline(0, { color: 'grid' });
          prof.path(xs.map((x, i) => [x, ys[i]]), { color: 'accent', width: 2 });
          prof.fn(() => 0, { color: 'faint' });
          const mx = Math.max(...ys.map(Math.abs));
          info = { mx, bru: 2 * 0.78 * u, jar: 0.08 * u, X };
          prof.setView([-X, X], [-Math.max(300, Math.ceil(mx / 100) * 100), Math.max(300, Math.ceil(mx / 100) * 100)]);
        });
        v.readout(() => `Brunhes (normal) central stripe: $2\\times0.78\\,\\mathrm{Myr}\\times u=${v.fix(info.bru, 1)}$ km wide; the Jaramillo event (0.08 Myr) is only ${v.fix(info.jar, 1)} km per side, against a layer ${v.fix(depth.value, 1)} km deep · peak anomaly **${v.fix(info.mx, 0)} nT**. Time scale: rounded Cande–Kent values to 5.9 Ma.`);
      },
    },
    // ───────────────────────────────────────── 3.3
    {
      num: '3.3',
      kind: 'Concept',
      name: 'Plate boundaries: divergent, convergent and transform',
      statement: String.raw`Plate boundaries are classified by how the neighbouring plates move relative to each other across the boundary line. At each point let $\mathbf v$ be the velocity of plate B relative to plate A and $\hat{\mathbf n}$ the unit normal pointing into B. If $\mathbf v\cdot\hat{\mathbf n}>0$ the plates separate (**divergent**: ridges, rifts); if $\mathbf v\cdot\hat{\mathbf n}<0$ they approach (**convergent**: trenches, collision zones); if $\mathbf v\perp\hat{\mathbf n}$ they slide past (**transform**). A single boundary can change type along its length, and most are oblique mixtures.`,
      idea: String.raw`The classification is the decomposition of the relative-velocity vector into components perpendicular and parallel to the boundary. Since every relative velocity is $\boldsymbol\omega\times\mathbf r$ about an Euler pole (geol-3.4), the pattern along a boundary is fixed by the pole's position: where the boundary is tangent to a small circle about the pole the motion is pure strike-slip; away from that point, one side diverges and the other converges. This is how the San Andreas fault (transform) sits between the Gulf of California (divergent) and the Aleutian trench (convergent).`,
      caption: String.raw`The boundary is the great-circle arc between the two orange handles; plate B lies to its right. Drag the Euler pole $E$ (or change the rate) and the boundary is recoloured point by point: blue where the plates separate, red where they converge, green where they slide past (obliquity under $20^\circ$). Gold arrows are the motion of each plate relative to the other; the lower graph resolves the velocity into components normal and parallel to the boundary. Move $E$ onto the boundary's great circle to make the whole boundary a ridge or trench.`,
      deps: ['geol-3.2'],
      refs: ['Turcotte–Schubert ch. 1'],
      tags: ['boundaries', 'kinematics'],
      scope: String.raw`Rigid plates meeting at a line; real boundaries are often diffuse zones, and "convergent" may mean subduction or collision depending on the crust involved.`,
      viz(v) {
        const s = v.stage({ height: 400, full: true });
        const G = v.globe(s, { projection: 'orthographic', center: [-165, 25], graticule: 30 });
        const P1 = G.handle(-150, 5, { label: '', color: 'orange' }), P2 = G.handle(-175, 50, { label: '', color: 'orange' });
        const E = G.handle(-100, 40, { label: 'E', color: 'purple' });
        const om = v.slider('rate $\\omega$ (°/Myr)', 0.1, 1.5, 0.7, { step: 0.01 });
        const over = v.select('on a convergent boundary, the overriding plate is', [{ value: 'A', label: 'A (left)' }, { value: 'B', label: 'B (right)' }], 'B');
        const gr = v.stage({ x: [0, 1], y: [-100, 100], axes: 'box', gutter: true, xlabel: 'distance along the boundary (°)', ylabel: 'velocity of B rel. A (mm/yr)', height: 230, full: true });
        const N = 60; let samp = [];
        const classify = (vn, vt) => { const sp = Math.hypot(vn, vt); if (sp < 1e-9) return 'transform'; const o = Math.abs(vn) / sp; if (o < Math.sin(20 * D)) return 'transform'; return vn > 0 ? 'divergent' : 'convergent'; };
        const col = { divergent: 'blue', convergent: 'red', transform: 'green' };
        v.render(() => {
          const pa = [P1.lon, P1.lat], pb = [P2.lon, P2.lat], pol = [E.lon, E.lat];
          const pts = arc(pa, pb, N);
          samp = pts.map((p, i) => {
            const q = pts[Math.min(i + 1, N)], r = pts[Math.max(i - 1, 0)], beta = bearing(r, q); // direction of travel along the boundary
            const vel = velAt(p, pol, om.value); // B relative to A: ω × r
            const bn = beta + 90; // normal pointing into B (right of travel)
            const vn = vel.speed * Math.cos((vel.az - bn) * D), vt = vel.speed * Math.cos((vel.az - beta) * D);
            return { p, beta, vel, vn, vt, cls: classify(vn, vt), d: (i / N) * angDist(pa, pb) };
          });
          G.draw({ land: false });
          G.land(null, { fillAlpha: 0.1, alpha: 0.35, color: 'muted', fill: 'muted' });
          G.smallCircle(pol, angDist(pol, samp[Math.round(N / 2)].p), { color: 'purple', width: 1, dash: [3, 4], alpha: 0.55 });
          for (let i = 0; i < N; i++) { const c = samp[i].cls === samp[i + 1].cls ? samp[i].cls : samp[i].cls; G.path([samp[i].p, samp[i + 1].p], { color: col[c], width: 5 }); }
          for (let i = 3; i < N; i += 6) { // relative motion arrows (each plate moves half)
            const q = samp[i], len = Math.min(10, q.vel.speed / 6);
            if (q.vel.speed < 1) continue;
            G.arrow(q.p, dest(q.p, q.vel.az, len / 2 + 0.01), { color: 'gold', width: 2 });
            G.arrow(q.p, dest(q.p, q.vel.az + 180, len / 2 + 0.01), { color: 'gold', width: 2 });
            const side = (over.value === 'B' ? 1 : -1) * 90;
            if (q.cls === 'convergent') { G.dot(dest(q.p, q.beta + side, 3.2), { r: 4.5, color: 'orange', hollow: true }); G.dot(dest(q.p, q.beta + side, 1), { r: 2.5, color: 'red' }); }
            if (q.cls === 'divergent') G.dot(q.p, { r: 2.5, color: 'ink' });
            if (q.cls === 'transform') { G.dot(dest(q.p, q.beta, 0.8), { r: 2, color: 'ink' }); }
          }
          G.dot(pol, { r: 3, color: 'purple' });
          G.text('A', dest(samp[Math.round(N / 2)].p, samp[Math.round(N / 2)].beta - 90, 9), { size: 15, color: 'ink' });
          G.text('B', dest(samp[Math.round(N / 2)].p, samp[Math.round(N / 2)].beta + 90, 9), { size: 15, color: 'ink' });
          const span = samp[N].d; gr.setView([0, span], [-120, 120]);
          gr.hline(0, { color: 'grid' });
          gr.path(samp.map((q) => [q.d, q.vn]), { color: 'accent', width: 2 });
          gr.path(samp.map((q) => [q.d, q.vt]), { color: 'orange', width: 2 });
          gr.path(samp.map((q) => [q.d, Math.hypot(q.vn, q.vt)]), { color: 'muted', width: 1, dash: true });
        });
        v.legend([['blue', 'divergent'], ['red', 'convergent'], ['green', 'transform'], ['accent', 'normal component $v_n$ (+ = separating)'], ['orange', 'parallel component $v_t$'], ['gold', 'relative motion']]);
        v.readout(() => {
          const c = { divergent: 0, convergent: 0, transform: 0 }; for (const q of samp) c[q.cls]++;
          const sp = Math.max(...samp.map((q) => q.vel.speed)), mn = Math.min(...samp.map((q) => q.vel.speed));
          const pure = samp.reduce((a, q) => (Math.abs(q.vn) < Math.abs(a.vn) ? q : a), samp[0]);
          return `boundary length ${v.fix(samp[N].d, 0)}°: **${v.fix((100 * c.divergent) / (N + 1), 0)}%** divergent, **${v.fix((100 * c.convergent) / (N + 1), 0)}%** convergent, **${v.fix((100 * c.transform) / (N + 1), 0)}%** transform · relative speed ${v.fix(mn, 0)}–${v.fix(sp, 0)} mm/yr · the boundary is most nearly pure strike-slip ($v_n=${v.fix(pure.vn, 1)}$ mm/yr) at ${v.fix(pure.d, 0)}° from the first handle.`;
        });
      },
    },
    // ───────────────────────────────────────── 3.4
    {
      num: '3.4',
      kind: 'Theorem',
      name: 'Every plate motion is a rotation about an Euler pole',
      statement: String.raw`Any displacement of a rigid cap on the sphere that keeps its centre fixed — in particular, any composition of finitely many rotations about axes through the centre — is a single rotation about one axis through the centre (Euler's rotation theorem). The axis meets the surface in two antipodal points; the one about which the rotation is counter-clockwise is the **Euler pole**. Hence every finite motion of a plate, and every relative motion of two plates, is described by one pole and one angle. Rotations about different axes do not commute, so the pole of a sequence depends on the order.`,
      idea: String.raw`A rotation of $\mathbb R^3$ is an orthogonal matrix with determinant $+1$, and a product of such matrices is again one. A $3\times3$ rotation matrix always has the eigenvalue $1$ (the characteristic polynomial is odd-degree and the other two eigenvalues are a conjugate pair of modulus 1 with product 1), whose eigenvector is the fixed axis; the angle follows from the trace, $\operatorname{tr}R=1+2\cos\theta$. The algebra is mech-10.1; here it is applied to a cap on the globe, where the fixed axis is the pole.`,
      caption: String.raw`Three successive rotations (poles $P_1,P_2,P_3$, angles from the sliders) move the grey cap; ghosts show it after each step. The purple star is the single Euler pole of the whole motion, and the slider "fraction" turns the cap about it along the dashed path until it lands exactly on the stepwise result. Reverse the order of the steps to see that the pole changes. The error readout compares the composed matrix with the single rotation, at all the cap's vertices.`,
      deps: ['mech-10.1', 'geog-1.3'],
      refs: ['Stein–Wysession ch. 5', 'Turcotte–Schubert ch. 1'],
      tags: ['rotation', 'euler', 'sphere'],
      credit: 'Leonhard Euler, 1775 (rotation theorem); applied to plates by Bullard, McKenzie & Parker, Morgan, 1960s',
      scope: String.raw`Rigid motions of a sphere about its centre (the Earth's surface treated as a sphere of fixed radius); the theorem is exact, and the 'plate' stays rigid.`,
      viz(v) {
        const s = v.stage({ height: 420, full: true });
        const G = v.globe(s, { projection: 'orthographic', center: [60, 20], graticule: 30 });
        const P = [G.handle(-40, 50, { label: '$P_1$', color: 'orange' }), G.handle(70, -20, { label: '$P_2$', color: 'teal' }), G.handle(130, 35, { label: '$P_3$', color: 'pink' })];
        const A = [v.slider('angle 1 (°)', -90, 90, 40, { step: 1 }), v.slider('angle 2 (°)', -90, 90, -55, { step: 1 }), v.slider('angle 3 (°)', -90, 90, 35, { step: 1 })];
        const frac = v.slider('fraction of the net rotation', 0, 1, 1, { step: 0.01 });
        const reverse = v.toggle('apply the steps in the opposite order', false);
        const cap = smallCirc([20, 10], 13, 48);
        let info = {};
        v.render(() => {
          const order = reverse.value ? [2, 1, 0] : [0, 1, 2], mats = order.map((i) => rotMat([P[i].lon, P[i].lat], A[i].value));
          let R = ID3; const caps = [cap];
          for (const M of mats) { R = mmul(M, R); caps.push(rotApply(R, cap)); }
          const aa = axisAngle(R), Rs = rotMat(aa.pole, aa.angle);
          // error between the composed rotation and the single axis–angle rotation, over the cap vertices
          let err = 0; for (const q of cap) { const a = rotApply(R, q), b = rotApply(Rs, q); err = Math.max(err, angDist(a, b) * D * R_EARTH); }
          G.draw({ land: false });
          G.land(null, { fillAlpha: 0.08, alpha: 0.3, color: 'muted', fill: 'muted' });
          G.polygon(caps[0], { fill: 'muted', fillAlpha: 0.25, color: 'muted', width: 1.2 });
          const gcols = ['orange', 'teal', 'pink'];
          for (let i = 1; i < 3; i++) G.polygon(caps[i], { color: gcols[order[i - 1]], width: 1, alpha: 0.55, dash: [4, 3] });
          // path of the cap's centre under the net rotation
          const cen = [20, 10];
          const pth = []; for (let t = 0; t <= aa.angle; t += aa.angle / 60 || 1) pth.push(rotPts(cen, aa.pole, t));
          G.path(pth, { color: 'purple', width: 1.4, dash: [3, 4], geodesic: false });
          const cur = rotPts(cap, aa.pole, aa.angle * frac.value);
          G.polygon(cur, { fill: 'green', fillAlpha: 0.3, color: 'green', width: 2 });
          for (let i = 0; i < 3; i++) G.dot([P[i].lon, P[i].lat], { r: 5, color: gcols[i] });
          G.dot(aa.pole, { r: 7, color: 'purple' }); G.text('★ E', dest(aa.pole, 0, 3), { size: 14, color: 'purple' });
          G.dot(LL(vscale(V(aa.pole), -1)), { r: 4, color: 'purple', hollow: true });
          info = { aa, err, sum: A.reduce((a, x) => a + x.value, 0) };
        });
        v.legend([['muted', 'initial cap'], ['orange', 'after step 1', { dash: true }], ['teal', 'after step 2', { dash: true }], ['green', 'turned by the net rotation'], ['purple', 'Euler pole $E$ and path of the cap centre']]);
        v.readout(() => `net rotation: **${v.fix(info.aa.angle, 2)}°** about **E = (${v.fix(info.aa.pole[1], 2)}°N, ${v.fix(info.aa.pole[0], 2)}°E)** · sum of the three angles ${v.fix(info.sum, 1)}° (not the net angle: the axes differ) · largest gap between the composed motion and the single rotation over the cap: **${v.sci(Math.max(info.err, 1e-12), 2)}** km`);
      },
    },
    // ───────────────────────────────────────── 3.5
    {
      num: '3.5',
      kind: 'Proposition',
      name: 'Relative plate velocity v = ω × r',
      statement: String.raw`If plate B turns relative to plate A with angular velocity $\boldsymbol\omega$ (axis through the Euler pole, rate $\omega$ in degrees per million years), the relative velocity at the point with position vector $\mathbf r$ is $\mathbf v=\boldsymbol\omega\times\mathbf r$. Its direction is along the small circle about the pole through the point, and its speed is $v=\omega R\sin\Delta$, where $R$ is the Earth's radius and $\Delta$ the angular distance from the pole: it is zero at the pole and its antipode and largest, $\omega R$, on the great circle $90^\circ$ from the pole. One degree per million years is $111.2$ mm/yr.`,
      idea: String.raw`This is the velocity of a point of a rigid body rotating about a fixed axis (mech-9.4): $|\boldsymbol\omega\times\mathbf r|=\omega\,|\mathbf r|\sin\Delta$ because the cross product measures the component of $\mathbf r$ perpendicular to the axis, which is the radius of the small circle $R\sin\Delta$. So spreading rates along a ridge are not constant: they grow with distance from the pole. Measuring how the spreading rate varies along a ridge locates the pole.`,
      caption: String.raw`Drag the Euler pole $E$ and change the rate. Along the schematic South Atlantic ridge, gold arrows show the opening velocity (each plate moves half), and the lower graph plots speed against angular distance from the pole: the dots lie on the curve $\omega R\sin\Delta$. The readout computes $|\boldsymbol\omega\times\mathbf r|$ directly from vectors and compares it with the formula. Place $E$ on the ridge itself to make the speed vanish there.`,
      deps: ['geol-3.4', 'mech-9.4'],
      refs: ['Stein–Wysession ch. 5'],
      tags: ['velocity', 'cross-product', 'spreading'],
      credit: 'Morgan 1968; Le Pichon 1968 (plate velocities from Euler vectors)',
      scope: String.raw`Rigid plates on a spherical Earth. The ridge is a schematic polyline (offsets at fracture zones omitted); the rate $\omega$ is a free slider, not the measured opening rate.`,
      verify: true,
      viz(v) {
        const s = v.stage({ height: 400, full: true });
        const G = v.globe(s, { projection: 'orthographic', center: [-15, 5], graticule: 30 });
        const E = G.handle(-39, 62, { label: 'E', color: 'purple' });
        const om = v.slider('rate $\\omega$ (°/Myr)', 0.05, 1.0, 0.3, { step: 0.01 });
        const ridge = [[-0.5, -54.5], [-13.5, -40], [-13, -30], [-13.5, -20], [-13.5, -10], [-14.5, -2], [-24, 0.5], [-30, 0.5], [-41, 10], [-45, 15]];
        const pts = []; for (let i = 0; i + 1 < ridge.length; i++) pts.push(...arc(ridge[i], ridge[i + 1], 8).slice(i ? 1 : 0));
        const gr = v.stage({ x: [0, 180], y: [0, 120], axes: 'box', gutter: true, xlabel: 'angular distance $\\Delta$ from the Euler pole (°)', ylabel: 'speed (mm/yr)', height: 250, full: true });
        let info = {};
        v.render(() => {
          const pole = [E.lon, E.lat], w = om.value;
          G.draw({ land: false });
          G.land(null, { fillAlpha: 0.1, alpha: 0.35, color: 'muted', fill: 'muted' });
          G.path(pts, { color: 'blue', width: 3.2, geodesic: false });
          G.smallCircle(pole, 90, { color: 'purple', width: 1, dash: [5, 5], alpha: 0.5 });
          const rows = [];
          pts.forEach((p, i) => {
            const vel = velAt(p, pole, w), d = angDist(p, pole);
            const wv = vscale(V(pole), w * D / 1e6), cr = vnorm(cross(wv, V(p))) * R_EARTH * 1e6, fm = w * D / 1e6 * R_EARTH * 1e6 * Math.sin(d * D);
            rows.push({ d, sp: vel.speed, cr, fm });
            if (i % 5 === 2 && vel.speed > 0.5) {
              const len = Math.max(1.2, vel.speed / 9);
              G.arrow(p, dest(p, vel.az, len), { color: 'gold', width: 2 }); G.arrow(p, dest(p, vel.az + 180, len), { color: 'gold', width: 2 });
            }
          });
          G.dot(pole, { r: 4, color: 'purple' });
          gr.fn((x) => w * D * R_EARTH * Math.sin(x * D), { domain: [0, 180], color: 'purple', width: 2 });
          gr.setView([0, 180], [0, Math.max(40, Math.ceil((w * 111.2) / 20) * 20 + 10)]);
          gr.dots(rows.map((r) => [r.d, r.sp]), { r: 3.5, color: 'blue' });
          const dd = Math.max(...rows.map((r) => Math.abs(r.cr - r.fm)));
          info = { max: Math.max(...rows.map((r) => r.sp)), min: Math.min(...rows.map((r) => r.sp)), dd, w, dmin: Math.min(...rows.map((r) => r.d)), dmax: Math.max(...rows.map((r) => r.d)) };
        });
        v.legend([['blue', 'schematic ridge'], ['gold', 'opening velocity'], ['purple', '$\\omega R\\sin\\Delta$ and the $90^\\circ$ circle']]);
        v.readout(() => `$\\omega R=${v.fix(info.w * 111.195, 1)}$ mm/yr is the maximum possible (at $\\Delta=90^\\circ$) · along this ridge ($\\Delta$ from ${v.fix(info.dmin, 0)}° to ${v.fix(info.dmax, 0)}°) the speed runs from **${v.fix(info.min, 1)}** to **${v.fix(info.max, 1)}** mm/yr · $|\\boldsymbol\\omega\\times\\mathbf r|$ from the vectors and $\\omega R\\sin\\Delta$ agree to ${v.sci(Math.max(info.dd, 1e-12), 1)} mm/yr.`);
      },
    },
  ],
};
