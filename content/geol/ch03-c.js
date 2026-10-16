// Geology & Geophysics — Chapter 3: Plate tectonics on a sphere (part c: 3.11–3.15)
//
// Sources checked / provenance (Oct 2026):
//   3.11 The apparent-polar-wander paths are a MODEL: a synthetic absolute motion of Eurasia (rotation about a pole at 40° N, 100° E at
//        0.17°/Myr) and an illustrative opening of the North Atlantic (rotation of North America about a pole at 88° N, 28° E, 38°
//        in 170 Myr; the real pole and angle are of this order but were not looked up). The geocentric axial dipole relation
//        tan I = 2 tan λ is standard. Credit to Creer, Irving & Runcorn (1954) and Runcorn (1956) is from memory.
//   3.12 Wilson, J. T. (1966) "Did the Atlantic close and then re-open?", Nature 211: 676–681 (Crossref-checked). Stage names
//        (embryonic, young, mature, declining, terminal, suture) follow the usual textbook list with the examples East African
//        Rift, Red Sea, Atlantic, Pacific, Mediterranean, Himalaya; rates in the sliders are illustrative, not a fit.
//   3.13 Wegener (1912) Geologische Rundschau 3 (4): 276–292, Crossref-checked; the lecture was given 6 January 1912 in Frankfurt (also
//        printed in Petermanns Geographische Mitteilungen 58). The paper itself was not read: its arguments are described from the
//        standard account. The hypsometric mixture is SCHEMATIC, tuned to three summary numbers (land 29.2% of the area, mean land
//        elevation 0.84 km, mean ocean depth 3.68 km; the last two quoted from memory), not the real ETOPO histogram.
//   3.14 Vine & Matthews (1963) Nature 199: 947–949: read from a scan. Facts used: survey of H.M.S. Owen, November 1962, over the
//        Carlsberg Ridge (50 × 40 nautical miles centred on 5°25′ N, 61°45′ E); Fig. 4 models with blocks of effective
//        susceptibility 0.0027 (0.0053 under the median valley in profiles 2 and 3), T = 0.376 Oe, I = −6°, profile bearing 044° for the
//        Carlsberg profile, T = 0.48 Oe, I = 65°, bearing 120° (Mid-Atlantic), T = 0.5 Oe, I = 60°, bearing 073° (Pacific); present
//        declination 356° for Carlsberg. The paper gives no spreading rate or polarity time scale. The block depth and
//        thickness are not stated (the paper says the thickness is uncertain by a factor of two), so they are sliders here; the
//        declination for the other two profiles is not in the figure caption and is taken as 0°.
//   3.15 McKenzie & Parker (1967) Nature 216: 1276–1280 (Crossref-checked). The paper's slip vectors were not read; the "observed"
//        slip azimuths here are SYNTHETIC: predicted by the MORVEL (DeMets et al. 2010) North America–Pacific pole as quoted in a
//        course table (48.9° N, 71.7° W, 0.75°/Myr, North America relative to Pacific; not checked against the paper), plus 7° noise.

import { D, R_EARTH, V, LL, angDist, bearing, dest, arc, rotMat, rotPts, rotApply, velAt, mod360, wrap180, azDiff, azDiff180, clamp, meanAngle, fitPole, poleMisfit, polarityAt, NORMALS, anomalyProfile, gauss, HYPS, hypsDensity } from './ch03.shared.js';

export default {
  collection: 'geol',
  chapter: 3,
  items: [
    // ───────────────────────────────────────── 3.11
    {
      num: '3.11',
      kind: 'Method',
      name: 'Paleomagnetism and apparent polar wander',
      statement: String.raw`Rocks record the direction of the field at their formation. If the field averaged over some thousands of years is that of a geocentric axial dipole, the inclination $I$ of the remanent magnetization gives the latitude of the rock when it formed, $\tan I=2\tan\lambda$, and its declination points to the geographic pole. The pole computed from a rock of age $t$ is its **paleopole**; a continent's paleopoles of successive ages trace an **apparent polar wander (APW) path**. Because the pole did not move relative to the Earth's spin axis (to first order), the paths of different continents should coincide, and where they do not, the continents moved relative to each other: rotating one continent about the right Euler pole (geol-3.4) makes their paths merge.`,
      idea: String.raw`A dipole field has a latitude-dependent dip (em-7.17): vertical at the poles, horizontal at the equator, with $\tan I = 2\tan\lambda$. A single measurement therefore gives the distance to the pole, the declination the direction, so the pole's position in the continent's coordinates. If the continent moves, its coordinates turn under a fixed pole: the *apparent* motion of the pole is the inverse of the continent's motion. Two continents with the same history would show the same path; the angle between their paths at a given age is the rotation separating them.`,
      caption: String.raw`The globe shows the north pole region with Eurasia, Greenland and North America at their present positions; the two curves are the model paleopaths of the pole (0–200 Ma) in North American (blue) and Eurasian (orange) coordinates. Drag "restore the Atlantic" to rotate North America (and each of its poles by the opening angle of its own age) about the opening pole: at 100% the two paths merge. Choose an age to read the paleolatitude of a site and its inclination on the dipole curve below (the paths are a model, not data).`,
      deps: ['geol-3.4', 'em-7.17'],
      refs: ['Turcotte–Schubert ch. 1'],
      tags: ['paleomagnetism', 'apw', 'dipole'],
      credit: 'Creer, Irving & Runcorn, 1954; Runcorn 1956 (apparent polar wander paths of Europe and North America)',
      scope: String.raw`Holds when the time-averaged field is a geocentric axial dipole (a good approximation for the last few hundred Myr), the remanent magnetization is primary and the rocks are not tilted. The paths drawn here are a model, built to show the geometry.`,
      verify: true,
      viz(v) {
        const NORTH = [0, 90], EAxis = [100, 40], wEU = 0.17, OPEN = [28, 88], TOP = 170, ATOT = 38;
        const opening = (t) => ATOT * Math.min(t / TOP, 1);
        const ages = []; for (let t = 0; t <= 200; t += 20) ages.push(t);
        const pEU = (t) => rotPts(NORTH, EAxis, -wEU * t);
        const pNA = (t) => rotPts(pEU(t), OPEN, -opening(t));
        const s = v.stage({ height: 430, full: true });
        const G = v.globe(s, { projection: 'orthographic', center: [-25, 70], graticule: 15 });
        const rest = v.slider('restore the Atlantic (%)', 0, 100, 0, { step: 1 });
        const tsel = v.slider('age of the pole (Ma)', 0, 200, 100, { step: 20 });
        const inc = v.stage({ x: [-90, 90], y: [-90, 90], axes: 'box', gutter: true, xlabel: 'latitude $\\lambda$ (°)', ylabel: 'inclination $I$ (°)', height: 260, full: false, weight: 0.8, equal: false });
        const lamH = inc.handle(40, 0, { color: 'gold', constrain: 'x', label: '$\\lambda$' });
        const SNA = [-100, 40], SEU = [10, 50];
        const NA = G.landmass('North America'), EU = G.landmass('Eurasia'), GL = G.landmass('Greenland');
        let info = {};
        v.render(() => {
          const f = rest.value / 100, tt = tsel.value;
          G.draw({ land: false });
          G.land(null, { fillAlpha: 0.08, alpha: 0.3, color: 'muted', fill: 'muted' });
          const Mna = rotMat(OPEN, f * opening(tt));
          G.polygon(rotApply(Mna, NA), { fill: 'blue', fillAlpha: 0.2, color: 'blue', width: 1.4 });
          G.polygon(EU, { color: 'orange', width: 1.4 });
          G.polygon(rotApply(Mna, GL), { color: 'blue', width: 1, alpha: 0.7 });
          const na = ages.map((t) => rotPts(pNA(t), OPEN, f * opening(t))), eu = ages.map(pEU);
          G.path(eu, { color: 'orange', width: 2.4, geodesic: false }); G.path(na, { color: 'blue', width: 2.4, geodesic: false });
          ages.forEach((t, i) => { G.dot(eu[i], { r: 3.5, color: 'orange' }); G.dot(na[i], { r: 3.5, color: 'blue' }); if (t % 40 === 0) { G.text(`${t}`, dest(eu[i], 45, 2.2), { size: 10, color: 'orange' }); G.text(`${t}`, dest(na[i], 225, 2.2), { size: 10, color: 'blue' }); } });
          G.dot(NORTH, { r: 4, color: 'ink', hollow: true });
          const ia = ages.indexOf(tt); const gap = ia >= 0 ? angDist(na[ia], eu[ia]) : angDist(rotPts(pNA(tt), OPEN, f * opening(tt)), pEU(tt));
          const pa = rotPts(pNA(tt), OPEN, 0);
          const latNA = 90 - angDist(SNA, pa), latEU = 90 - angDist(SEU, pEU(tt));
          G.dot(SNA, { r: 4, color: 'blue', hollow: true }); G.dot(SEU, { r: 4, color: 'orange', hollow: true });
          inc.fn((x) => Math.atan(2 * Math.tan(x * D)) / D, { color: 'purple', width: 2.2, domain: [-89.9, 89.9] });
          inc.hline(0, { color: 'grid' }); inc.vline(0, { color: 'grid' });
          const iNA = Math.atan(2 * Math.tan(latNA * D)) / D, iEU = Math.atan(2 * Math.tan(latEU * D)) / D;
          inc.dot(latNA, iNA, { r: 5, color: 'blue', label: 'NA site', labelPos: 'se' }); inc.dot(latEU, iEU, { r: 5, color: 'orange', label: 'EU site', labelPos: 'nw' });
          const lam = lamH.x; lamH.set(lam, Math.atan(2 * Math.tan(lam * D)) / D);
          info = { gap, open: opening(tt), latNA, latEU, iNA, iEU, lam, f };
        });
        v.legend([['blue', 'North American APW path (0–200 Ma)'], ['orange', 'Eurasian APW path'], ['purple', '$\\tan I=2\\tan\\lambda$']]);
        v.readout(() => `at ${tsel.value} Ma the two poles are **${v.fix(info.gap, 1)}°** apart (the opening angle at that age is ${v.fix(info.open, 1)}°; after restoring ${v.fix(100 * info.f, 0)}% of it) · paleolatitude of the North American site (100° W, 40° N): **${v.fix(info.latNA, 1)}°**, inclination $${v.fix(info.iNA, 1)}^\\circ$; of the Eurasian site (10° E, 50° N): ${v.fix(info.latEU, 1)}°, inclination $${v.fix(info.iEU, 1)}^\\circ$ · handle: $\\lambda=${v.fix(info.lam, 1)}^\\circ\\Rightarrow I=${v.fix(Math.atan(2 * Math.tan(info.lam * D)) / D, 1)}^\\circ$ (steeper than the field-line slope $\\lambda$).`);
      },
    },
    // ───────────────────────────────────────── 3.12
    {
      num: '3.12',
      kind: 'Model',
      name: 'The Wilson cycle',
      statement: String.raw`Ocean basins open and close in a recurring sequence: a continent rifts (embryonic stage: the East African Rift), the rift becomes a young narrow ocean (Red Sea), widens into a mature ocean with passive margins on both sides (Atlantic), starts to consume itself by subduction and begins to shrink (declining: Pacific), narrows to a remnant (terminal: Mediterranean) and finally closes in a continental collision that leaves a mountain belt and a suture (Himalaya). The old suture is a line of weakness where a new rift can start, so the cycle repeats and continents assemble and break apart over hundreds of millions of years.`,
      idea: String.raw`Mass and area on a sphere are conserved: new oceanic lithosphere produced at ridges must be consumed at trenches over geological time, so an ocean grows while spreading exceeds subduction and shrinks when subduction wins. The width of an ocean basin obeys $\dot w=u-c$, where $u$ is the spreading rate and $c$ the rate at which the plate on one side is consumed; adding the geometry that the ridge itself can be subducted gives the whole life-cycle from the two rates and the time at which subduction begins. The idea that the Atlantic might have closed and re-opened came from the matching of Appalachian–Caledonian fauna (the former Iapetus ocean).`,
      caption: String.raw`The animation runs the cycle forward in time (about 500 Myr in 14 s; use pause and the restart control). Sky-blue = ocean floor (darker = older), yellow = continents, orange = ridge, red = subducting slab, brown = mountains. Change the spreading and convergence rates or the time subduction starts: with slow subduction the ocean stays open; with fast subduction the ridge itself is consumed. The graph is the ocean width $w(t)$.`,
      deps: ['geol-3.3', 'geol-3.10'],
      refs: ['Press–Siever'],
      tags: ['wilson-cycle', 'supercontinent', 'basins'],
      credit: 'J. Tuzo Wilson, 1966',
      scope: String.raw`A one-dimensional kinematic cartoon with constant rates and a single trench; real basins have several margins, changes of rate and oblique motions, and the cycle length varies widely.`,
      verify: true,
      viz(v) {
        const u = v.slider('spreading rate $u$ (mm/yr, full)', 10, 120, 40, { step: 1 });
        const c = v.slider('subduction rate $c$ (mm/yr)', 10, 150, 50, { step: 1 });
        const Ts = v.slider('subduction starts (Myr after rifting)', 50, 400, 150, { step: 5 });
        const PERIOD = 14, TT = 500, W = 1500;
        const s = v.stage({ x: [-5200, 5200], y: [-640, 330], axes: false, height: 330, full: true });
        const g = v.stage({ x: [0, TT], y: [0, 7000], axes: 'box', gutter: true, xlabel: 'time since rifting (Myr)', ylabel: 'ocean width (km)', height: 200, full: true });
        let key = '', traj = [];
        const run = () => {
          const k = `${u.value}|${c.value}|${Ts.value}`; if (k === key) return; key = k; traj = [];
          let a = 0, b = 0, ridge = true, col = false, tcol = null;
          for (let t = 0; t <= TT; t++) {
            traj.push({ t, a, b, ridge, col, tcol, sub: t >= Ts.value && !col });
            if (col) continue;
            const sub = t >= Ts.value;
            if (ridge) { a += u.value / 2; b += u.value / 2 - (sub ? c.value : 0); if (b <= 0) { b = 0; ridge = false; } }
            else { a -= sub ? c.value : 0; if (a <= 0) { a = 0; col = true; tcol = t; } }
            if (t === 0 && !sub) { /* embryonic stage handled in drawing */ }
          }
        };
        const stageName = (S) => {
          const w = S.a + S.b;
          if (S.col) return 'suture: continental collision (Himalaya)';
          if (w < 150 && S.ridge && !S.sub) return 'embryonic: rift valley (East African Rift)';
          if (S.ridge && !S.sub && w < 1500) return 'young ocean (Red Sea)';
          if (S.ridge && !S.sub) return 'mature ocean (Atlantic)';
          if (S.ridge && S.sub) return 'declining ocean: subduction under way (Pacific)';
          return w < 2500 ? 'terminal ocean: the ridge is gone (Mediterranean)' : 'declining ocean: the ridge has been subducted';
        };
        let info = {};
        v.animate((t) => {
          run();
          const tau = Math.min(TT, Math.max(0, (t / PERIOD) * TT)), S = traj[Math.round(tau)];
          const xL = -S.a, xR = S.b, w = S.a + S.b;
          // mantle and lithosphere
          s.rect(-5200, -640, 5200, -90, { fill: 'orange', fillAlpha: 0.08, stroke: false });
          s.text('mantle', -4900, -420, { size: 12, color: 'muted' });
          // continents
          const cA = { x0: xL - W, x1: xL }, cB = { x0: xR, x1: xR + W };
          const emb = w < 150 && S.ridge && !S.sub;
          s.rect(cA.x0, -90, cA.x1, 40, { fill: 'gold', fillAlpha: 0.45, color: 'gold', width: 1.2 });
          s.rect(cB.x0, -90, cB.x1, 40, { fill: 'gold', fillAlpha: 0.45, color: 'gold', width: 1.2 });
          // oceanic crust by age (darker = older), both flanks
          const slices = 36;
          if (S.a > 0) for (let i = 0; i < slices; i++) { const x0 = xL + (i * S.a) / slices, x1 = xL + ((i + 1) * S.a) / slices; s.rect(x0, -50, x1, -8, { fill: 'blue', fillAlpha: 0.1 + 0.35 * (1 - (i + 0.5) / slices), stroke: false }); }
          if (S.b > 0) for (let i = 0; i < slices; i++) { const x0 = xR - (i * S.b) / slices, x1 = xR - ((i + 1) * S.b) / slices; s.rect(x1, -50, x0, -8, { fill: 'blue', fillAlpha: 0.1 + 0.35 * (1 - (i + 0.5) / slices), stroke: false }); }
          if (w > 0) s.rect(xL, -8, xR, 0, { fill: 'blue', fillAlpha: 0.15, stroke: false });
          // ridge
          if (S.ridge && w > 0) { s.line(0, -60, 0, 25, { color: 'orange', width: 3 }); s.text('ridge', 0, 55, { size: 12, color: 'orange', align: 'center' }); }
          if (emb) s.text('rift', 0, 55, { size: 12, color: 'orange', align: 'center' });
          // subduction under B
          if (S.sub && w > 0) { const x = xR, pts = [[x, -50], [x + 800, -520], [x + 800 + 45, -520 + 45], [x, -8]]; s.poly(pts, { fill: 'red', fillAlpha: 0.4, color: 'red', width: 1.6 }); s.text('trench', x - 20, 55, { size: 12, color: 'red', align: 'right' }); }
          // mountains at the suture
          if (S.col) { const age = tau - S.tcol, h = Math.min(260, 40 + age * 2.5); s.poly([[xR - 700, 40], [xR, 40 + h], [xR + 700, 40]], { fill: 'muted', fillAlpha: 0.4, color: 'muted', width: 1.4 }); s.text('mountain belt', xR, 40 + h + 22, { size: 12, color: 'muted', align: 'center' }); }
          s.text(`${Math.round(tau)} Myr · ${stageName(S)}`, 0, 300, { size: 13, color: 'ink', align: 'center', math: false });
          // width graph
          g.path(traj.map((q) => [q.t, q.a + q.b]), { color: 'accent', width: 2.2 });
          g.vline(tau, { color: 'gold', width: 1.6 }); g.dot(tau, w, { r: 5, color: 'gold' });
          g.vline(Ts.value, { color: 'red', dash: true, alpha: 0.6 });
          const peak = traj.reduce((m, q) => (q.a + q.b > m.w ? { w: q.a + q.b, t: q.t } : m), { w: 0, t: 0 });
          info = { tau, w, S, peak, close: traj.find((q) => q.col) };
        }, { period: PERIOD, still: 9.4, autoplay: true });
        v.legend([['accent', 'ocean width $w(t)$'], ['red', 'subduction starts', { dash: true }], ['gold', 'now']]);
        v.readout(() => `$\\dot w=u-c$ while the ridge is alive: spreading ${u.value} mm/yr against subduction ${c.value} mm/yr ${c.value > u.value ? '(subduction wins: the ocean shrinks)' : '(spreading wins: it keeps widening)'} · widest ${v.fix(info.peak.w, 0)} km at ${info.peak.t} Myr · ocean width now **${v.fix(info.w, 0)} km** · ${info.close ? 'the continents collide at ' + info.close.tcol + ' Myr' : 'no collision within 500 Myr'} · oldest sea floor ${v.fix(info.S.a / (u.value / 2), 0)} Myr (west side).`);
      },
    },
    // ───────────────────────────────────────── 3.13
    {
      num: '3.13',
      kind: 'Paper',
      name: 'Die Entstehung der Kontinente',
      paper: {
        authors: 'Alfred Wegener',
        year: 1912,
        title: 'Die Entstehung der Kontinente',
        venue: 'Geologische Rundschau 3 (4): 276–292',
        doi: '10.1007/BF02202896',
      },
      introduces: ['geol-3.1'],
      statement: String.raw`Wegener argued that the continents are not fixed: the Earth's surface has two preferred levels, continental blocks standing near sea level and ocean floors about $4.5$ km lower, instead of the single bell-shaped distribution of heights expected if the crust were one material raised and lowered at random. Two levels mean two kinds of crust, a lighter continental one floating isostatically higher than a denser oceanic one; and since the lighter material floats, the continents can move horizontally across the denser floor. He joined this to the fit of the Atlantic coasts and to matching geology and fossils, and concluded that the continents had been united and have drifted apart.`,
      idea: String.raw`Before 1912 the standard view was of a cooling, contracting Earth with land bridges that rose and sank to explain the matching fossils. Wegener's geophysical argument (the title of his 1912 lecture series was about the geophysical basis of the evolution of the large features of the Earth's crust) rested on two ingredients: the *bimodal hypsometric curve* (the area-weighted histogram of heights) and isostasy (geol-5.2), by which lighter, thicker continental columns float higher than thinner, denser oceanic ones. Both are quantitatively checked today; the missing piece he could not supply was a mechanism, and his estimates of the drift rate were too fast.`,
      caption: String.raw`Top: a schematic hypsometric curve (a mixture tuned to the Earth's land fraction, mean land height $0.84$ km and mean ocean depth $3.68$ km, **not** the true ETOPO histogram — see the note in the item) against a single-material alternative with the same mean and spread: only the two-level curve has the observed double peak. Bottom: columns of continental and oceanic crust floating in the mantle; the computed ocean depth must match the abyssal peak. Press "one material" to give the ocean the continent's thickness and density: the ocean basin disappears.`,
      deps: ['geol-5.2', 'geol-1.5'],
      refs: [],
      tags: ['wegener', 'hypsometry', 'isostasy', 'history'],
      credit: 'Alfred Wegener, 1912',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Alfred_Wegener' },
      verify: true,
      viz(v) {
        const mode = v.select('height distribution', [{ value: 'two', label: 'two kinds of crust (observed shape)' }, { value: 'one', label: 'one material (unimodal)' }], 'two');
        const tc = v.slider('continental crust thickness $t_c$ (km)', 20, 50, 33, { step: 0.5 }), rc = v.slider('density $\\rho_c$ (g/cm³)', 2.6, 3.0, 2.8, { step: 0.01 });
        const to = v.slider('oceanic crust thickness $t_o$ (km)', 4, 10, 7, { step: 0.1 }), ro = v.slider('density $\\rho_o$ (g/cm³)', 2.7, 3.1, 2.9, { step: 0.01 });
        const rm = v.slider('mantle density $\\rho_m$ (g/cm³)', 3.2, 3.4, 3.3, { step: 0.01 });
        v.button('one material', () => { to.set(tc.value); ro.set(rc.value); });
        v.button('standard values', () => { tc.set(33); rc.set(2.8); to.set(7); ro.set(2.9); rm.set(3.3); });
        const h = v.stage({ x: [-11, 9], y: [0, 0.5], axes: 'box', gutter: true, xlabel: 'height above sea level (km)', ylabel: 'share of the Earth\'s area per km', height: 270, full: true });
        const col = v.stage({ x: [0, 10], y: [-48, 8], axes: false, height: 330, full: true });
        // moments of the mixture (numerical)
        let m1 = 0, m2 = 0; const dh = 0.02; for (let x = -12; x < 10; x += dh) { const d = hypsDensity(x) * dh; m1 += x * d; m2 += x * x * d; }
        const sd = Math.sqrt(m2 - m1 * m1);
        let info = {};
        v.render(() => {
          const E = 0.84, rw = 1.03, d = (rm.value * (tc.value - E) - rc.value * tc.value + ro.value * to.value - rm.value * to.value) / (rm.value - rw);
          // histogram panel
          h.vline(0, { color: 'muted', dash: true, alpha: 0.6 }); h.text('sea level', -0.2, 0.47, { size: 11, color: 'muted' });
          if (mode.value === 'two') h.fn((x) => hypsDensity(x), { color: 'accent', width: 2.2, fill: true, n: 500, domain: [-11, 9] });
          else h.fn((x) => gauss(x, m1, sd), { color: 'red', width: 2.2, fill: true, domain: [-11, 9] });
          h.fn((x) => hypsDensity(x), { color: 'faint', width: 1, alpha: mode.value === 'two' ? 0 : 0.7, domain: [-11, 9], n: 300 });
          h.vline(-d, { color: 'green', width: 2 }); h.text(`predicted depth −${v.fix(d, 1)} km`, -d - 0.2, 0.3, { size: 11, color: 'green', align: 'right' });
          h.vline(E, { color: 'orange', width: 1.4, dash: true });
          // columns
          const x0 = 1, x1 = 4, y0 = 6, y1 = 9;
          col.rect(x0, -45, x0 + 3, E, { fill: 'orange', fillAlpha: 0.1, stroke: false });
          col.rect(0, -45, 10, -45.5, { color: 'muted' });
          col.rect(x0, E - tc.value, x0 + 3, E, { fill: 'gold', fillAlpha: 0.5, color: 'gold' });
          col.rect(x0, -45, x0 + 3, E - tc.value, { fill: 'orange', fillAlpha: 0.22, stroke: false });
          col.rect(y0, -d, y0 + 3, 0, { fill: 'blue', fillAlpha: 0.25, color: 'blue' });
          col.rect(y0, -d - to.value, y0 + 3, -d, { fill: 'purple', fillAlpha: 0.5, color: 'purple' });
          col.rect(y0, -45, y0 + 3, -d - to.value, { fill: 'orange', fillAlpha: 0.22, stroke: false });
          col.hline(0, { color: 'muted', dash: true, alpha: 0.6 });
          col.text(`continent: ${v.fix(E, 2)} km high, crust ${v.fix(tc.value, 0)} km`, x0 + 1.5, 6.5, { size: 11, color: 'gold', align: 'center' });
          col.text(`ocean floor ${v.fix(d, 1)} km deep`, y0 + 1.5, 6.5, { size: 11, color: 'blue', align: 'center' });
          col.text('mantle', 5, -30, { size: 12, color: 'muted', align: 'center' });
          col.text('compensation level: equal weight of every column above this line', 5, -41, { size: 11, color: 'muted', align: 'center' });
          info = { d, E };
        });
        v.legend([['accent', 'schematic two-level hypsometric curve'], ['red', 'single material, same mean and spread'], ['green', 'depth predicted by isostasy'], ['orange', 'mean continental height']]);
        v.readout(() => {
          let pk = [-12, 0]; for (let x = -9; x < -2; x += 0.05) if (hypsDensity(x) > pk[1]) pk = [x, hypsDensity(x)];
          let pl = [0, 0]; for (let x = 0.01; x < 4; x += 0.01) if (hypsDensity(x) > pl[1]) pl = [x, hypsDensity(x)];
          return `isostatic balance: $d=\\dfrac{\\rho_m(t_c-e)-\\rho_c t_c+\\rho_o t_o-\\rho_m t_o}{\\rho_m-\\rho_w}=$ **${v.fix(info.d, 2)} km** (with $e=0.84$ km) · modes of the schematic curve: land ${v.fix(pl[0], 1)} km and abyssal plain ${v.fix(pk[0], 1)} km, a gap of **${v.fix(pl[0] - pk[0], 1)} km** · mean ocean depth of the mixture ${v.fix(-(m1 * 1) / 0.708 + 0.292 * 0.84 / 0.708, 2)} km (literature value ≈ 3.7 km). ${info.d < 1 ? 'With one material there is no basin: the "ocean" is barely below sea level.' : ''}`;
        });
      },
    },
    // ───────────────────────────────────────── 3.14
    {
      num: '3.14',
      kind: 'Paper',
      name: 'Magnetic Anomalies Over Oceanic Ridges',
      paper: {
        authors: 'F. J. Vine and D. H. Matthews',
        year: 1963,
        title: 'Magnetic Anomalies Over Oceanic Ridges',
        venue: 'Nature 199 (4897): 947–949',
        doi: '10.1038/199947a0',
      },
      introduces: ['geol-3.2'],
      statement: String.raw`Vine and Matthews proposed that the linear magnetic anomalies over mid-ocean ridges are produced by sea-floor spreading together with reversals of the Earth's field: new crust is magnetized in the field of its time, and symmetric stripes of alternately normal and reversed blocks, a few tens of kilometres wide, spread from the ridge axis. Computing the field of blocks about $20$ km wide, alternately magnetized, with a more strongly magnetized block under the median valley, they reproduced the form of the anomaly profiles over the Carlsberg Ridge (Indian Ocean), the Mid-Atlantic Ridge and the Pacific "grain" better than uniformly magnetized crust could, and predicted that about half of the oceanic crust is reversely magnetized.`,
      idea: String.raw`In 1962 H.M.S. Owen surveyed the crest of the Carlsberg Ridge; uniformly normal crust (the usual model, using the bathymetry) gave computed profiles that "bear little resemblance" to the observed ones, and the authors found that part of the crust seemed to be reversed. Combining Hess's picture of ocean-floor spreading (convection brings new crust up at the ridge), the evidence for periodic reversals of the field (geol-10.4) and thermoremanent magnetization (geol-10.3), they showed that alternating blocks reproduce the amplitude and shape of the anomalies. They gave **no spreading rate and no time scale**: calibrating the stripes to the reversal time scale (and so the spreading rate) came afterwards, with Vine & Wilson (1965) and others. The same idea was reached independently by L. Morley (1963, published 1964).`,
      caption: String.raw`This reconstructs the paper's Fig. 4 model (not its observed data: the original profiles are not reproduced here): blocks of effective susceptibility $0.0027$ e.m.u. (twice that under the median valley), $T$, $I$ and profile bearing as in the figure caption for each of the three profiles. Choose the profile, the block width and the depth and thickness of the layer (the paper says the thickness is uncertain to a factor two, so these are yours). Switch off reversals to get the uniform-normal model: with no reversed blocks there is no pattern of stripes. The readout converts block width to time at an assumed half-spreading rate.`,
      deps: ['geol-10.3', 'geol-10.4', 'geol-3.13'],
      refs: [],
      tags: ['vine-matthews', 'anomalies', 'history'],
      credit: 'F. J. Vine & D. H. Matthews, 1963',
      links: { doi: 'https://doi.org/10.1038/199947a0' },
      verify: true,
      viz(v) {
        const PRE = {
          carl: { name: 'Carlsberg Ridge (Fig. 4, no. 3)', F: 37600, incl: -6, dAng: 356 - 44, ratio: 2 },
          atl: { name: 'Mid-Atlantic Ridge (no. 2)', F: 48000, incl: 65, dAng: 0 - 120, ratio: 2 },
          pac: { name: 'Pacific grain (no. 1)', F: 50000, incl: 60, dAng: 0 - 73, ratio: 1 },
        };
        const pr = v.select('profile', Object.entries(PRE).map(([k, p]) => ({ value: k, label: p.name })), 'carl');
        const bw = v.slider('block width (km)', 5, 40, 20, { step: 1 });
        const zt = v.slider('depth to the top of the blocks (km)', 1, 6, 2, { step: 0.1 });
        const th = v.slider('thickness of the blocks (km)', 0.5, 4, 2, { step: 0.1 });
        const ku = v.slider('half-spreading rate for the readout (mm/yr)', 5, 40, 15, { step: 1 });
        const rev = v.toggle('reversals (alternating blocks)', true);
        const strip = v.stage({ x: [-100, 100], y: [0, 1], axes: false, height: 110, full: true });
        const prof = v.stage({ x: [-100, 100], y: [-400, 400], axes: 'box', gutter: true, xlabel: 'distance across the ridge (km)', ylabel: 'total-field anomaly (nT = γ)', height: 300, full: true });
        let info = {};
        v.render(() => {
          const P = PRE[pr.value], w = bw.value, blocks = [];
          const n = Math.ceil(100 / w) + 1;
          for (let i = -n; i <= n; i++) {
            const c = i * w, central = i === 0, pol = !rev.value ? 1 : (Math.abs(i) % 2 === 0 ? 1 : -1);
            const k = 0.0027 * 4 * Math.PI * (central ? P.ratio : 1);
            blocks.push({ x0: c - w / 2, x1: c + w / 2, s: pol * k });
            strip.rect(c - w / 2, 0.1, c + w / 2, 0.9, { fill: pol > 0 ? 'ink' : 'faint', fillAlpha: pol > 0 ? (central ? 0.9 : 0.6) : 0.25, color: 'muted', width: 0.6 });
          }
                    const xs = Array.from({ length: 201 }, (_, i) => -100 + i);
          const ys = anomalyProfile(xs, blocks, { zTop: zt.value, thick: th.value, F: P.F, incl: P.incl, dAng: P.dAng });
          const mx = Math.max(...ys.map(Math.abs)); const yl = Math.max(100, Math.ceil(mx / 100) * 100);
          prof.setView([-100, 100], [-yl, yl]);
          prof.hline(0, { color: 'grid' }); prof.path(xs.map((x, i) => [x, ys[i]]), { color: rev.value ? 'accent' : 'red', width: 2.2 });
          info = { mx, w, P, ptp: Math.max(...ys) - Math.min(...ys) };
        });
        v.legend([['ink', 'normal blocks (central block = median valley)'], ['faint', 'reversed blocks'], ['accent', 'computed anomaly (alternating blocks)'], ['red', 'computed anomaly (uniform normal crust)']]);
        v.readout(() => `${info.P.name}: $T=${v.fix(info.P.F / 1e5, 3)}$ oersted, $I=${info.P.incl}^\\circ$ · peak anomaly **${v.fix(info.mx, 0)} γ**, peak-to-peak ${v.fix(info.ptp, 0)} γ · a ${info.w} km block is $${info.w}/${ku.value}=${v.fix(info.w / ku.value, 2)}$ Myr of crust at ${ku.value} mm/yr per side (the Brunhes chron is 0.78 Myr, which at ${ku.value} mm/yr gives a ${v.fix(2 * 0.78 * ku.value, 0)} km central block) — a calibration the 1963 paper did not make.`);
      },
    },
    // ───────────────────────────────────────── 3.15
    {
      num: '3.15',
      kind: 'Paper',
      name: 'The North Pacific: an Example of Tectonics on a Sphere',
      paper: {
        authors: 'D. P. McKenzie and R. L. Parker',
        year: 1967,
        title: 'The North Pacific: an Example of Tectonics on a Sphere',
        venue: 'Nature 216 (5122): 1276–1280',
        doi: '10.1038/2161276a0',
      },
      introduces: ['geol-3.4'],
      statement: String.raw`McKenzie and Parker showed that the surface of the Earth could be treated as a mosaic of rigid "paving stones" that move without internal deformation, and that on a sphere the motion of each is a rotation about an Euler pole (geol-3.4). Applying this to the Pacific, they showed that the directions of slip in earthquakes along its northern boundary, from California through Alaska to the Aleutians, are consistent with a single rotation, and that if the map is redrawn in a Mercator projection with the pole as the pole of the projection, the slip vectors on the boundary become parallel and the small circles about the pole become straight horizontal lines.`,
      idea: String.raw`In 1967 the faults were known (strike-slip on the San Andreas and Queen Charlotte faults, thrusting at the Aleutian trench) and earthquake fault-plane solutions gave slip directions. Rigid motion on a sphere means that the slip vector at each point is tangent to a small circle about one pole, so a single pole must fit all the slip directions along the boundary. A Mercator projection whose "equator" is the great circle $90^\circ$ from the pole turns every small circle about the pole into a straight line parallel to the equator, so the test is simply whether the slip vectors are horizontal. This clean statement of rigid-plate kinematics, written within a year of Wilson's transform faults, is the precursor of Morgan's (1968) and Le Pichon's (1968) global plate models.`,
      caption: String.raw`Gold arrows are the slip directions at ten places along the Pacific–North America boundary (synthetic: predicted by a hidden pole plus $7^\circ$ of noise, since the paper's own fault-plane solutions are not reproduced here); purple arrows are the directions predicted by your pole $E$. Drag $E$ on the globe: in the lower map (a Mercator projection about $E$) your predictions are exactly horizontal, and the observed vectors become parallel to them only when $E$ is right. "Best fit" finds the least-squares pole.`,
      deps: ['geol-3.3', 'geol-3.2', 'geol-3.14'],
      refs: [],
      tags: ['mckenzie-parker', 'pacific', 'euler-pole', 'history'],
      credit: 'D. P. McKenzie & R. L. Parker, 1967',
      links: { doi: 'https://doi.org/10.1038/2161276a0' },
      verify: true,
      viz(v) {
        const HID = [-71.7, 48.9], OM = -0.75; // Pacific relative to North America: clockwise about the NA-relative-to-Pacific pole
        const sites = [['Southern California', [-116.5, 33.4]], ['Parkfield', [-120.4, 35.9]], ['Cape Mendocino', [-124.2, 40.4]], ['Queen Charlotte', [-132.5, 53]], ['Fairweather', [-137.5, 58.5]], ['Kodiak', [-152, 57]], ['Shumagin', [-160, 54.2]], ['Unalaska', [-166, 53]], ['Andreanof', [-175, 51.5]], ['Rat Islands', [178, 51.5]]];
        const rng = v.rng(21), pts = sites.map((q) => q[1]);
        const obs = pts.map((p) => mod360(velAt(p, HID, OM).az + 7 * rng.normal()));
        const best = fitPole(pts, obs, [0, 60], 1);
        const s = v.stage({ height: 400, full: true });
        const G = v.globe(s, { projection: 'orthographic', center: [-145, 45], graticule: 15 });
        const E = G.handle(-100, 25, { label: 'E', color: 'purple' });
        v.button('Best fit', () => E.set(best.pole[0], best.pole[1]));
        v.button('Reset', () => E.set(-100, 25));
        const m = v.stage({ x: [-150, 150], y: [-25, 85], equal: true, axes: false, height: 330, full: true, title: 'Mercator projection about the pole $E$' });
        const NA = G.landmass('North America'), EU = G.landmass('Eurasia'), landRings = [...NA, ...EU];
        let info = {};
        v.render(() => {
          const pole = [E.lon, E.lat], th0 = meanAngle(pts.map((p) => bearing(pole, p)));
          const proj = (p) => { const d = angDist(p, pole), b = bearing(pole, p), lat = 90 - d; return [wrap180(b - th0), (Math.log(Math.tan(Math.PI / 4 + (clamp(lat, -85, 85) * D) / 2))) / D, d]; };
          G.draw({ land: false });
          G.land(null, { fillAlpha: 0.1, alpha: 0.35, color: 'muted', fill: 'muted' });
          let sq = 0; const res = [];
          pts.forEach((p, i) => {
            const pred = velAt(p, pole, -1).az, e = azDiff(pred, obs[i]); sq += e * e; res.push(e);
            G.smallCircle(pole, angDist(p, pole), { color: 'purple', width: 0.7, alpha: 0.25 });
            G.arrow(p, dest(p, obs[i], 7), { color: 'gold', width: 2.4 }); G.arrow(p, dest(p, pred, 7), { color: 'purple', width: 1.8 });
            G.dot(p, { r: 3, color: 'ink' });
          });
          G.dot(pole, { r: 4, color: 'purple' });
          const mx = pts.reduce((a, p) => a + proj(p)[0], 0) / pts.length; m.setView([mx - 110, mx + 110], [-25, 85]);
          // Mercator about the pole
          m.hline(0, { color: 'grid' });
          for (const lat of [0, 15, 30, 45, 60, 75]) { const y = Math.log(Math.tan(Math.PI / 4 + (lat * D) / 2)) / D; m.hline(y, { color: 'grid', alpha: 0.6 }); m.text(`${90 - lat}°`, mx - 108, y + 1.5, { size: 10, color: 'muted' }); }
          m.text('angular distance from E', mx - 108, 82, { size: 10, color: 'muted' });
          for (const ring of landRings) {
            const out = []; let prev = null;
            for (const p of ring) { const q = proj(p); if (q[2] < 8 || q[2] > 118) { out.push(null); prev = null; continue; } if (prev && Math.abs(q[0] - prev[0]) > 180) out.push(null); out.push([q[0], q[1]]); prev = q; }
            m.path(out, { color: 'muted', width: 1, alpha: 0.7 });
          }
          pts.forEach((p, i) => {
            const a = proj(p), b = proj(dest(p, obs[i], 7)), c = proj(dest(p, velAt(p, pole, -1).az, 7));
            const sg = Math.abs(b[0] - a[0]) > 180 ? 0 : 1;
            m.arrow(a[0], a[1], c[0], c[1], { color: 'purple', width: 1.8, head: 6 });
            if (sg) m.arrow(a[0], a[1], b[0], b[1], { color: 'gold', width: 2.4, head: 6 });
            m.dot(a[0], a[1], { r: 3, color: 'ink' });
          });
          info = { rms: Math.sqrt(sq / pts.length), res, pole };
        });
        v.legend([['gold', 'observed (synthetic) slip direction'], ['purple', 'direction predicted by $E$'], ['muted', 'coastlines']]);
        v.readout(() => `rms slip-direction misfit **${v.fix(info.rms, 1)}°** for $E=(${v.fix(E.lat, 1)}^\\circ\\mathrm{N},\\,${v.fix(Math.abs(E.lon), 1)}^\\circ\\mathrm{${E.lon < 0 ? 'W' : 'E'}})$ · least-squares pole $(${v.fix(best.pole[1], 1)}^\\circ\\mathrm{N},\\,${v.fix(Math.abs(best.pole[0]), 1)}^\\circ\\mathrm{${best.pole[0] < 0 ? 'W' : 'E'}})$ with rms ${v.fix(best.rms, 1)}° (noise 7°; the hidden MORVEL pole is $48.9^\\circ$N, $71.7^\\circ$W) · the McKenzie–Parker pole itself is not quoted here.`);
      },
    },
  ],
};
