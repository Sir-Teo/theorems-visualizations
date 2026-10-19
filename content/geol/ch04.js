// Geology & Geophysics — Chapter 4: Heat flow, the cooling lithosphere and mantle convection (part a: 4.1–4.5)
//
// Sources checked / provenance (Oct 2026):
//   4.1  Fourier's law is mathematics plus an empirical constant; the layer conductivities (shale 1.8, sandstone 3.2, rock salt 5.5,
//        granite 2.9 W/m/K) are TYPICAL ROUND VALUES chosen for the picture, not a measured borehole. Pollack, Hurter & Johnson (1993,
//        Rev. Geophys. 31: 267–280, Crossref- and abstract-checked): mean heat flow 65 (continents), 101 (oceans), 87 mW/m² (global),
//        44.2 TW. Jaupart, Labrosse & Mareschal (2007, Treatise on Geophysics 7: 253–303, Crossref-checked) revise the total to 46 ± 3 TW
//        (the 46 TW figure is quoted from a secondary summary of that chapter; the chapter was not opened).
//   4.2  Linear q0 = q* + D·A0: Birch, Roy & Decker (1968) and Roy, Blackwell & Birch (1968, EPSL 5: 1–12), Lachenbruch (1968, JGR 73:
//        6977–6989) — all Crossref-checked; D ≈ 7.5 km (eastern US) and ≈ 10 km (west of the Great Plains) are quoted from a USGS report
//        (Roy et al. 1968, Birch et al. 1968). The "province" points in the plot are SYNTHETIC (generated with q* = 30 mW/m², D = 10 km,
//        ±4 mW/m² noise): they are a model, not the measurements. k = 2.5 W/m/K is a round value.
// Verification 2026-10-18: 4.1 checked against full Pollack et al. (1993), pp. 267–273 and 276–278;
// 4.3 checked against Parsons & Sclater (1977), §2 and Appendix 1, with independent diffusion checks.
//   4.3  Half-space solution is exact mathematics; Tm = 1300 °C, κ = 1 mm²/s are the usual round textbook values. McKenzie (1967, JGR 72:
//        6261–6273) is the Crossref-checked credit for the cooling-lithosphere heat-flow model; Davis & Lister (1974) and Parsons & Sclater
//        (1977) are the oceanic-depth applications (not separately checked).
//   4.4  Parsons & Sclater (1977, JGR 82: 803–827, Crossref-checked): depth 2500 + 350√t (m, t in Myr, quoted valid for t < 70 Myr) and
//        6400 − 3200 exp(−t/62.8) for older crust (drawn from 20 Myr on, where the two forms agree to 10 m). Stein & Stein (1992, Nature 359: 123–129, Crossref-checked): GDH1 depth 2600 + 365√t (t < 20 Myr)
//        and 5651 − 2473 exp(−0.0278 t). The fit coefficients were read from a web summary of the two papers, not from the papers. The
//        curves are the published FITS, not the underlying soundings (no data table is reproduced).
//   4.5  Parsons & Sclater heat-flow law q = 11.3/√t HFU = 473 mW/m² per √Myr and Stein & Stein q = 510/√t (t < 55 Myr), 48 + 96 exp(−0.0278 t)
//        (older) are quoted from memory (verify). The "observed" curve is an ILLUSTRATIVE MODEL of the hydrothermal deficit, not data.
//        Triangular age–area distribution of the sea floor after Parsons (1982, JGR 87: 289–302, Crossref-checked) with round numbers
//        (3.1×10⁸ km² of oceanic crust, oldest crust 180 Myr, hence 3.4 km²/yr of new crust). Hydrothermal share of oceanic heat loss:
//        Stein & Stein (1994, JGR 99: 3081–3095, Crossref-checked) — the size of the effect is not quoted here.

import { MYR, KAPPA, halfSpaceQ, halfSpaceSubs, ridgeHeatIntegrand } from './ch04.shared.js';

const T0C = 10; // mean surface temperature used in the continental pictures (°C)

export default {
  collection: 'geol',
  chapter: 4,
  title: 'Heat flow, the cooling lithosphere and mantle convection',
  summary: String.raw`A global heat-flow compilation by Pollack and colleagues (1993) estimated 44.2 terawatts leaving the Earth’s surface. On the continents radiogenic heat shapes the geotherm; in the oceans, the lithosphere is a thermal boundary layer that thickens as it cools, so ocean depth grows as the square root of age and heat flow falls as its inverse. Underneath, the mantle convects at a Rayleigh number in the millions, with plumes rising from the deep and melting by decompression feeding volcanoes.`,
  items: [
    // ───────────────────────────────────────── 4.1
    {
      num: '4.1',
      kind: 'Law',
      name: 'Fourier’s law and the conductive geotherm',
      statement: String.raw`Heat conducted through a solid flows down the temperature gradient and is proportional to it: $\mathbf q=-k\nabla T$, with $k$ the thermal conductivity (W m$^{-1}$ K$^{-1}$). In steady state, with no heat sources, in a column varying only with depth $z$, the flux $q$ is the same at every depth, so $dT/dz=q/k(z)$: the temperature rises linearly in each layer, steeply in poor conductors and gently in good ones. Measuring $dT/dz$ in a borehole and $k$ on the core gives the surface heat flow $q=k\,dT/dz$.`,
      idea: String.raw`Fourier's law is an empirical constitutive relation, true when the temperature varies slowly compared with the mean free path of the heat carriers (phonons, here). Combined with energy conservation, $\nabla\cdot\mathbf q=0$ in steady state without sources, it forces $q$ to be constant down a one-dimensional column, so a change of rock type changes the gradient but never the flux. This is why geothermal gradients (typically 20–30 K/km) are quoted together with the conductivity, and why heat flow, not gradient, is the quantity that is mapped over the globe.`,
      caption: String.raw`Drag the **probe** up and down the borehole (left panel) and change the surface heat flow $q$. The middle panel shows the gradient $dT/dz$ in each layer, the right panel the flux $k\,dT/dz$: the gradient jumps at each contact while the flux stays a single value. Switch to the uniform column and the temperature becomes one straight line. The layer conductivities are typical round values, not a real well.`,
      deps: ['thermo-7.3', 'pde-1.5'],
      refs: ['Pollack, Hurter & Johnson (1993), Heat flow from the Earth’s interior, pp. 267–273 and 276–278; doi:10.1029/93RG01249'],
      tags: ['heat flow', 'conduction', 'geotherm'],
      credit: 'Joseph Fourier, 1822 (Théorie analytique de la chaleur)',
      scope: String.raw`Holds for conduction in a stationary solid, steady state and no internal sources or advection (fluid flow in the rock, which is common in the top kilometres, breaks it). Global means: about 65 mW/m² on continents, 101 mW/m² in oceans (Pollack et al. 1993), 44.2 TW in total in that study (a historical estimate, including a hydrothermal correction).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Thermal_conduction#Fourier\'s_law' },
      viz(v) {
        const LAY = [
          { name: 'shale', k: 1.8, h: 0.7, col: 'orange' },
          { name: 'sandstone', k: 3.2, h: 0.9, col: 'gold' },
          { name: 'rock salt', k: 5.5, h: 0.5, col: 'teal' },
          { name: 'granite', k: 2.9, h: 1.5, col: 'purple' },
        ];
        const ZMAX = LAY.reduce((a, l) => a + l.h, 0);
        const q = v.slider('surface heat flow $q$ (mW/m²)', 20, 120, 65, { step: 1 });
        const mode = v.select('column', [{ value: 'lay', label: 'four rock types' }, { value: 'uni', label: 'uniform, $k=2.9$' }], 'lay');
        const kAt = (z) => { if (mode.value === 'uni') return 2.9; let a = 0; for (const l of LAY) { a += l.h; if (z <= a) return l.k; } return LAY[3].k; };
        const layers = () => (mode.value === 'uni' ? [{ name: 'uniform rock', k: 2.9, h: ZMAX, col: 'accent' }] : LAY);
        const Tz = (z) => { let t = T0C, a = 0; for (const l of layers()) { const d = Math.min(l.h, Math.max(z - a, 0)); t += (q.value / l.k) * d; a += l.h; if (z <= a) break; } return t; };
        const yt = [[0, '0'], [-1, '1'], [-2, '2'], [-3, '3']];
        const S1 = v.stage({ x: [0, 170], y: [-ZMAX, 0], axes: 'box', gutter: true, xlabel: 'temperature $T$ (°C)', ylabel: 'depth (km)', yticks: yt, height: 340, weight: 1.2, minWidth: 240 });
        const S2 = v.stage({ x: [0, 40], y: [-ZMAX, 0], axes: 'box', gutter: true, xlabel: 'gradient $dT/dz$ (°C/km)', yticks: yt, height: 340, weight: 0.9, minWidth: 200 });
        const S3 = v.stage({ x: [0, 130], y: [-ZMAX, 0], axes: 'box', gutter: true, xlabel: 'flux $k\\,dT/dz$ (mW/m²)', yticks: yt, height: 340, weight: 0.9, minWidth: 200 });
        const probe = S1.handle(10, -1.6, { color: 'gold', constrain: 'y', label: 'probe', labelPos: 'ne' });
        let info = {};
        v.render(() => {
          S2.setView([0, Math.max(40, ...layers().map(l => 1.1 * q.value / l.k))], [-ZMAX, 0]);
          let a = 0;
          for (const S of [S1, S2, S3]) {
            a = 0;
            for (const l of layers()) { S.hband(-(a + l.h), -a, { color: l.col, alpha: 0.12 }); a += l.h; }
          }
          a = 0;
          for (const l of layers()) { S1.text(`${l.name}, ${l.k} W/m/K`, 165, -(a + l.h / 2), { align: 'right', size: 11, color: l.col }); a += l.h; }
          S1.curve((z) => [Tz(z), -z], 0, ZMAX, { n: 200, color: 'accent', width: 2.4 });
          // gradient and flux step plots
          a = 0; const gp = [], fp = [];
          for (const l of layers()) { const g = q.value / l.k; gp.push([g, -a], [g, -(a + l.h)], null); fp.push([q.value, -a], [q.value, -(a + l.h)], null); a += l.h; }
          S2.path(gp, { color: 'orange', width: 2.4 });
          S3.vline(q.value, { color: 'green', width: 2.4 });
          const z = Math.min(Math.max(-probe.y, 0.02), ZMAX - 0.02), k = kAt(z), g = q.value / k;
          probe.set(10, -z);
          S1.hline(-z, { color: 'gold', dash: true, alpha: 0.8 });
          S1.dot(Tz(z), -z, { r: 5, color: 'gold' });
          S2.dot(g, -z, { r: 5, color: 'gold' }); S3.dot(q.value, -z, { r: 5, color: 'gold' });
          info = { z, k, g, T: Tz(z) };
        });
        v.legend([['accent', 'temperature'], ['orange', 'gradient'], ['green', 'heat flux (constant)'], ['gold', 'probe']]);
        v.readout(() => `Probe at $z=${v.fix(info.z, 2)}$ km: $k=${v.fix(info.k, 1)}$ W/m/K, $T=${v.fix(info.T, 0)}$ °C, $dT/dz=${v.fix(info.g, 1)}$ °C/km, so $k\\,dT/dz=${v.fix(info.k * info.g, 1)}$ mW/m² $=q$ at every depth.`);
      },
    },

    // ───────────────────────────────────────── 4.2
    {
      num: '4.2',
      kind: 'Model',
      name: 'Radiogenic heating and the continental geotherm',
      statement: String.raw`Continental crust contains uranium, thorium and potassium whose decay produces heat at a rate $A$ (W/m$^3$), largest in the upper crust. In steady conduction, $k\,d^2T/dz^2=-A(z)$. If the heat production is a uniform layer of thickness $h$ and rate $A_0$ above a base flux $q_m$ (the "reduced" heat flow from below), then
$$q_0=q_m+A_0\,h,\qquad T(z)=T_0+\frac{q_0 z}{k}-\frac{A_0z^2}{2k}\quad(z\le h),$$
and the same $q_0=q_m+hA_0$ holds when $A$ decays exponentially, $A=A_0e^{-z/h}$. Within a heat-flow province the surface heat flow is therefore a straight line in the surface heat production $A_0$, with slope $h$ and intercept $q_m$.`,
      idea: String.raw`Integrate the heat equation once from depth up to the surface: the flux leaving the top is the flux entering from below plus all the heat generated in between (conservation of energy, with Fourier's law from 4.1). With a layer of production $A_0$ and thickness $h$ this is $q_0=q_m+A_0h$. Birch, Roy and others found that heat flow and surface radioactivity of plutons in a province do lie on a line, which says that the crust's enrichment is arranged in a layer of characteristic thickness $h$ about 8–10 km. The decay constants and half-lives behind $A$ are those of 2.1: the same atoms that date rocks warm them.`,
      caption: String.raw`The right panel shows a **synthetic** province (14 points, generated with a hidden line and noise): fit it with $q_m$ and $h$, or press *Best fit*. The gold handle on the model line sets $A_0$, which controls the geotherm on the left (dashed: the geotherm that would hold if $q_0$ were carried by conduction alone, with no heat production). Make $A_0\,h$ large and the Moho temperature runs away: the crust cannot be uniformly enriched to the base.`,
      deps: ['geol-4.1', 'geol-2.1', 'pde-1.5'],
      refs: ['Turcotte–Schubert ch. 4'],
      tags: ['heat production', 'geotherm', 'continents'],
      credit: 'Birch, Roy & Decker; Roy, Blackwell & Birch; Lachenbruch (1968)',
      scope: String.raw`Holds in a steady state, for a province where the crust's heat production varies laterally but its vertical distribution is similar. The simple linear law describes granite-dominated provinces; the values of $q_m$ and $h$ are properties of each province (about 7.5 km for the eastern US and 10 km west of the Great Plains in the original fits).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Geothermal_gradient' },
      verify: true,
      viz(v) {
        const K = 2.5, MOHO = 35;
        const rng = v.rng(42);
        const pts = []; for (let i = 0; i < 14; i++) { const A = 0.4 + 5.2 * rng(); pts.push([A, 30 + 10 * A + 4 * rng.normal()]); }
        const model = v.select('production profile', [{ value: 'uni', label: 'uniform layer' }, { value: 'exp', label: 'exponential' }], 'uni');
        const qm = v.slider('base flux $q_m$ (mW/m²)', 10, 60, 30, { step: 0.5 });
        const hh = v.slider('thickness $h$ (km)', 4, 20, 10, { step: 0.5 });
        v.button('Best fit', () => {
          const n = pts.length, mx = pts.reduce((a, p) => a + p[0], 0) / n, my = pts.reduce((a, p) => a + p[1], 0) / n;
          let sxy = 0, sxx = 0; for (const p of pts) { sxy += (p[0] - mx) * (p[1] - my); sxx += (p[0] - mx) ** 2; }
          const sl = sxy / sxx; hh.set(Math.min(20, Math.max(4, sl))); qm.set(Math.min(60, Math.max(10, my - sl * mx)));
        });
        const L = v.stage({ x: [0, 1400], y: [-60, 0], axes: 'box', gutter: true, xlabel: 'temperature (°C)', ylabel: 'depth (km)', yticks: [[0, '0'], [-10, '10'], [-20, '20'], [-30, '30'], [-40, '40'], [-50, '50'], [-60, '60']], height: 380, weight: 1, minWidth: 240 });
        const R = v.stage({ x: [0, 6], y: [0, 130], axes: 'box', gutter: true, xlabel: 'surface heat production $A_0$ (µW/m³)', ylabel: 'surface heat flow $q_0$ (mW/m²)', height: 380, weight: 1.1, minWidth: 260 });
        const hand = R.handle(2.5, 55, { color: 'gold', label: '$A_0$', constrain: (x) => { const X = Math.min(Math.max(x, 0.1), 6); return [X, qm.value + hh.value * X]; } });
        let info = {};
        v.render(() => {
          const A0 = Math.min(Math.max(hand.x, 0.1), 6), h = hh.value, q0 = qm.value + h * A0;
          hand.set(A0, q0);
          const Tm_ = (z) => { // z in km; A0 µW/m³ × km = mW/m²; k in W/m/K → T in K from (mW/m²·km)/(W/m/K) = K
            if (model.value === 'uni') {
              if (z <= h) return T0C + (q0 * z) / K - (A0 * z * z) / (2 * K);
              return T0C + (qm.value * h) / K + (A0 * h * h) / (2 * K) + (qm.value * (z - h)) / K;
            }
            return T0C + (qm.value * z) / K + ((A0 * h * h) / K) * (1 - Math.exp(-z / h));
          };
          L.hline(-MOHO, { color: 'muted', dash: true });
          L.text('Moho (35 km)', 1390, -MOHO + 2, { align: 'right', size: 11, color: 'muted' });
          L.curve((z) => [T0C + (q0 * z) / K, -z], 0, 60, { color: 'muted', dash: true, width: 1.4 });
          L.curve((z) => [Tm_(z), -z], 0, 60, { n: 200, color: 'accent', width: 2.4 });
          L.dot(Tm_(MOHO), -MOHO, { r: 5, color: 'orange' });
          // heat production profile as a thin strip
          const prof = (z) => (model.value === 'uni' ? (z <= h ? A0 : 0) : A0 * Math.exp(-z / h));
          L.curve((z) => [prof(z) * 120, -z], 0, 60, { n: 200, color: 'red', width: 1.6, alpha: 0.9 });
          R.line(0, qm.value, 6, qm.value + 6 * h, { color: 'accent', width: 2.2 });
          R.hline(qm.value, { color: 'muted', dash: true });
          R.dots(pts.map((p) => [p[0], p[1]]), { r: 4.5, color: 'ink' });
          const rms = Math.sqrt(pts.reduce((a, p) => a + (p[1] - qm.value - h * p[0]) ** 2, 0) / pts.length);
          info = { q0, A0, T35: Tm_(MOHO), rms };
        });
        v.legend([['accent', 'geotherm'], ['muted', 'no-source geotherm', { dash: true }], ['red', 'heat production (scaled)'], ['ink', 'synthetic province data', { dot: true }]]);
        v.readout(() => `$q_0=q_m+hA_0=${v.fix(info.q0, 1)}$ mW/m² at $A_0=${v.fix(info.A0, 2)}$ µW/m³. Temperature at 35 km: ${v.fix(info.T35, 0)} °C${info.T35 > 1000 ? ' (crust would be molten: the layer is too enriched)' : ''}. Misfit to the synthetic province: rms ${v.fix(info.rms, 1)} mW/m².`);
      },
    },

    // ───────────────────────────────────────── 4.3
    {
      num: '4.3',
      kind: 'Model',
      name: 'Half-space cooling of the oceanic lithosphere',
      statement: String.raw`Treat new sea floor as a half-space $z>0$ that is at the mantle temperature $T_m$ when it forms at the ridge and whose surface is held at $T_0$. It then cools by conduction as it moves away at constant speed; at age $t$ the temperature depends on depth only through $z/\sqrt{\kappa t}$:
$$T(z,t)=T_0+(T_m-T_0)\,\mathrm{erf}\!\Big(\frac{z}{2\sqrt{\kappa t}}\Big).$$
Isotherms deepen as $\sqrt{\kappa t}$; the thermal lithosphere (the depth of, say, the $0.9\,T_m$ isotherm) is $z_L\approx2.32\sqrt{\kappa t}$.`,
      idea: String.raw`Horizontal conduction is negligible compared with horizontal advection by the moving plate, so each column cools independently as a one-dimensional diffusion problem: $\partial_tT=\kappa\,\partial_z^2T$ with the initial and boundary conditions above. The problem has no length scale of its own, so the solution is a function of the similarity variable $\eta=z/2\sqrt{\kappa t}$ alone, and is the half-line diffusion solution (pde-3.8, 4.1's conduction law). With $\kappa\approx10^{-6}$ m²/s, $z_L\approx116$ km at 80 Myr.`,
      caption: String.raw`The heat map is the temperature in a cross-section of the sea floor; the horizontal axis is age (equivalently, distance from the ridge at the chosen spreading rate). Drag the **age probe**; the green curve is the $0.9\,T_m$ isotherm. In *collapse* mode the profiles at four ages fall on one curve against $z/2\sqrt{\kappa t}$.`,
      deps: ['geol-4.1', 'pde-3.8'],
      refs: ['Parsons & Sclater (1977), An analysis of the variation of ocean floor bathymetry and heat flow with age, §2 and Appendix 1; doi:10.1029/JB082i005p00803'],
      tags: ['lithosphere', 'cooling', 'erf'],
      credit: 'McKenzie, 1967 (cooling-lithosphere heat-flow model); Parsons & Sclater, 1977',
      scope: String.raw`Holds for sea floor younger than about 70–80 Myr, before the basal heat supply of the asthenosphere stops the thickening (the plate model, 4.6); also ignores shear heating, hydrothermal cooling and the heat of the crust.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Seafloor_spreading' },
      viz(v) {
        const Tm = v.slider('mantle temperature $T_m$ (°C)', 1200, 1450, 1300, { step: 5 });
        const rate = v.slider('half-spreading rate (mm/yr)', 5, 60, 30, { step: 1 });
        const view = v.select('right panel', [{ value: 'prof', label: 'profile at probe age' }, { value: 'col', label: 'similarity collapse' }], 'prof');
        const yt = [[0, '0'], [-50, '50'], [-100, '100'], [-150, '150']];
        const A = v.stage({ x: [0, 100], y: [-150, 0], axes: 'box', gutter: true, xlabel: 'age (Myr)', ylabel: 'depth (km)', yticks: yt, height: 340, weight: 1.5, minWidth: 300, title: 'Cross-section of new sea floor' });
        const B = v.stage({ x: [0, 1400], y: [-150, 0], axes: 'box', gutter: true, xlabel: 'temperature (°C)', ylabel: 'depth (km)', yticks: yt, height: 340, weight: 0.9, minWidth: 240 });
        const probe = A.handle(60, -8, { color: 'gold', constrain: 'x', label: 'age', labelPos: 'ne' });
        const T = (zkm, tMyr) => { if (tMyr <= 0) return zkm <= 0 ? 0 : Tm.value; return Tm.value * (v.M.erf(zkm * 1000 / (2 * Math.sqrt(KAPPA * tMyr * MYR)))); };
        let info = {};
        v.render(() => {
          const tm = Tm.value, t = Math.min(Math.max(probe.x, 2), 100);
          probe.set(t, -8);
          A.heat((x, y) => T(-y, x) / tm, { range: [0, 1], cmap: 'magma', res: 3, key: 'T' + tm });
          A.contour((x, y) => T(-y, x), [200, 600, 1000, 0.9 * tm], { color: 'ink', width: 0.9, alpha: 0.55 });
          A.curve((x) => [x, -2.32 * Math.sqrt(KAPPA * x * MYR) / 1000], 0.2, 100, { n: 160, color: 'green', width: 2.4 });
          A.vline(t, { color: 'gold', dash: true });
          if (view.value === 'prof') {
            B.setView([0, Math.max(1400, tm + 50)], [-150, 0]); B.setLabels('temperature (°C)', 'depth (km)'); B.setTicks(null, yt);
            B.curve((z) => [T(z, t), -z], 0, 150, { n: 200, color: 'accent', width: 2.4 });
            const g = tm / Math.sqrt(Math.PI * KAPPA * t * MYR) * 1000; // °C/km at the surface
            B.line(0, 0, tm, -tm / g, { color: 'orange', dash: true, width: 1.5 });
            B.hline(-2.32 * Math.sqrt(KAPPA * t * MYR) / 1000, { color: 'green', dash: true });
            B.vline(tm, { color: 'muted', dash: true });
          } else {
            B.setView([0, 3], [0, 1]); B.setLabels('depth $z/(2\\sqrt{\\kappa t})$', '$(T-T_0)/(T_m-T_0)$'); B.setTicks(null, null);
            const cols = ['blue', 'teal', 'orange', 'purple'], ages = [5, 20, 50, 100];
            B.curve((e) => [e, v.M.erf(e)], 0, 3, { color: 'ink', width: 3, alpha: 0.35 });
            ages.forEach((a, i) => B.curve((e) => [e, T(2 * e * Math.sqrt(KAPPA * a * MYR) / 1000, a) / tm], 0, 3, { color: cols[i], width: 1.6, dash: [4, 3] }));
          }
          const zL = (2.32 * Math.sqrt(KAPPA * t * MYR)) / 1000;
          info = { t, zL, dist: (rate.value * t), q: halfSpaceQ(t, { Tm: tm, T0: 0, k: 3.138 }) * 1000 };
        });
        v.legend([['green', '0.9 $T_m$ isotherm'], ['accent', 'erf profile'], ['orange', 'surface gradient', { dash: true }], ['ink', 'contours 200/600/1000 °C']]);
        v.readout(() => `Age $${v.fix(info.t, 0)}$ Myr (${v.fix(info.dist, 0)} km from the ridge at this rate): lithosphere thickness $z_L=2.32\\sqrt{\\kappa t}=${v.fix(info.zL, 0)}$ km; surface heat flow $k T_m/\\sqrt{\\pi\\kappa t}=${v.fix(info.q, 0)}$ mW/m² (with $k=3.14$ W/m/K).`);
      },
    },

    // ───────────────────────────────────────── 4.4
    {
      num: '4.4',
      kind: 'Proposition',
      name: 'Ocean depth grows as √age',
      statement: String.raw`If the cooling lithosphere floats in isostatic balance, the ocean floor must subside as the column of rock contracts. Integrating the density excess of the half-space cooling profile (4.3) gives a sea-floor depth below the ridge-crest level
$$w(t)=\frac{2\rho_m\alpha(T_m-T_0)}{\rho_m-\rho_w}\sqrt{\frac{\kappa t}{\pi}}\;\approx\;350\sqrt{t/\mathrm{Myr}}\ \text{m},$$
with $\alpha$ the thermal expansion coefficient and $\rho_m$, $\rho_w$ the mantle and water densities. The empirical depth–age curves are $2500+350\sqrt t$ m for ages below about 70 Myr and flatten for old sea floor.`,
      idea: String.raw`Isostasy (the column mass, down to a level below the lithosphere, must be the same everywhere) turns a temperature deficit into extra water depth: $\rho_w\,w+\int\rho\,dz=\text{const}$. Because $\rho=\rho_m[1+\alpha(T_m-T)]$, the extra mass of the cold column is $\rho_m\alpha\int(T_m-T)dz$, which by the erf profile is proportional to $\sqrt{\kappa t}$, and each metre of water added replaces mantle by water at a density contrast $\rho_m-\rho_w$. The prefactor from round values is about 350 m per $\sqrt{\rm Myr}$, which is what Parsons and Sclater found by fitting; older sea floor sits shallower than the law predicts, which motivates the plate model (4.6).`,
      caption: String.raw`Left: depth versus age (or versus $\sqrt{\rm age}$, where the half-space law is a straight line). Gold curve: the model with your $\alpha$ and $T_m$; the two other curves are the published empirical fits (not raw soundings). Right: the density excess whose depth integral (shaded) is the subsidence at the probe age; the readout compares the numerical integral with the closed form.`,
      deps: ['geol-4.3', 'vcalc-8.8'],
      refs: ['Turcotte–Schubert ch. 4'],
      tags: ['bathymetry', 'isostasy', 'subsidence'],
      credit: 'Davis & Lister, 1974; Parsons & Sclater, 1977',
      scope: String.raw`Holds for sea floor younger than about 70–80 Myr; older sea floor is shallower than the $\sqrt t$ law (flattening, 4.6). Ignores sediment loading and the crust's own buoyancy, and uses the ridge-crest depth of 2500 m as the zero level.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Seafloor_depth_versus_age' },
      verify: true,
      viz(v) {
        const alpha = v.slider('thermal expansion $\\alpha$ (10⁻⁵/K)', 2, 4, 3, { step: 0.05 });
        const Tm = v.slider('$T_m-T_0$ (K)', 1100, 1500, 1300, { step: 10 });
        const ax = v.select('age axis', [{ value: 'age', label: 'age' }, { value: 'sqrt', label: '√age' }], 'age');
        const PS = (t) => (t < 20 ? 2500 + 350 * Math.sqrt(t) : 6400 - 3200 * Math.exp(-t / 62.8));
        const GD = (t) => (t < 20 ? 2600 + 365 * Math.sqrt(t) : 5651 - 2473 * Math.exp(-0.0278 * t));
        const yt = [[-2, '2'], [-3, '3'], [-4, '4'], [-5, '5'], [-6, '6']];
        const S = v.stage({ x: [0, 180], y: [-6.6, -2.2], axes: 'box', gutter: true, xlabel: 'age (Myr)', ylabel: 'depth (km)', yticks: yt, height: 340, weight: 1.4, minWidth: 300 });
        const D = v.stage({ x: [0, 140], y: [-150, 0], axes: 'box', gutter: true, xlabel: 'density excess $\\rho-\\rho_m$ (kg/m³)', ylabel: 'depth (km)', yticks: [[0, '0'], [-50, '50'], [-100, '100'], [-150, '150']], height: 340, weight: 0.8, minWidth: 220 });
        const probe = S.handle(40, -4, { color: 'gold', label: 'age', labelPos: 'ne', constrain: 'x' });
        let info = {}, previousSquareRoot = false;
        v.render(() => {
          const al = alpha.value * 1e-5, dT = Tm.value, sq = ax.value === 'sqrt';
          if (sq !== previousSquareRoot) {
            const age = previousSquareRoot ? probe.x * probe.x : probe.x;
            probe.set(sq ? Math.sqrt(age) : age, probe.y);
            previousSquareRoot = sq;
          }
          const X = (t) => (sq ? Math.sqrt(t) : t);
          const deepestModel = -(2500 + halfSpaceSubs(180, { Tm: dT, T0: 0, alpha: al })) / 1000;
          S.setView(sq ? [0, 13.5] : [0, 180], [Math.min(-6.6, deepestModel - 0.2), -2.2]);
          S.setLabels(sq ? '$\\sqrt{\\text{age}}$  (Myr$^{1/2}$)' : 'age (Myr)', 'depth (km)');
          S.setTicks(sq ? [[0, '0'], [Math.sqrt(10), '10'], [Math.sqrt(40), '40'], [Math.sqrt(90), '90'], [Math.sqrt(160), '160']] : null, yt);
          const ts = Array.from({ length: 181 }, (_, i) => i);
          const mod = (t) => -(2500 + halfSpaceSubs(t, { Tm: dT, T0: 0, alpha: al })) / 1000;
          S.path(ts.map((t) => [X(t), -PS(t) / 1000]), { color: 'orange', width: 1.8 });
          S.path(ts.map((t) => [X(t), -GD(t) / 1000]), { color: 'teal', width: 1.8, dash: [5, 3] });
          S.path(ts.map((t) => [X(t), mod(t)]), { color: 'gold', width: 2.6 });
          const tp = Math.min(Math.max(sq ? probe.x * probe.x : probe.x, 1), 180);
          probe.set(X(tp), mod(tp));
          // density excess panel
          const rhoM = 3300, rhoW = 1000;
          D.setView([0, Math.max(140, 1.1 * rhoM * al * dT)], [-150, 0]);
          const dr = (z) => rhoM * al * dT * (1 - v.M.erf(z * 1000 / (2 * Math.sqrt(KAPPA * tp * MYR))));
          D.curve((z) => [dr(z), -z], 0, 150, { n: 200, color: 'accent', width: 2.2 });
          D.path([[0, 0], ...Array.from({ length: 151 }, (_, z) => [dr(z), -z]), [0, -150]], { close: true, fill: 'accent', fillAlpha: 0.2, color: 'accent', width: 0.5 });
          const maxDepth = 8 * Math.sqrt(KAPPA * tp * MYR) / 1000; // integrate the density tail too, even below the plotted window
          const I = v.M.integrate(dr, 0, maxDepth, 600) * 1000; // kg/m² (z in km → m)
          const w = I / (rhoM - rhoW);
          info = { t: tp, w, wf: halfSpaceSubs(tp, { Tm: dT, T0: 0, alpha: al }), ps: 350 * Math.sqrt(tp) };
        });
        v.legend([['gold', 'half-space model'], ['orange', 'Parsons & Sclater (1977) fit'], ['teal', 'Stein & Stein (1992) GDH1 fit', { dash: true }]]);
        v.readout(() => `At ${v.fix(info.t, 0)} Myr: numerical $\\int(\\rho-\\rho_m)dz/(\\rho_m-\\rho_w)=${v.fix(info.w, 0)}$ m, closed form $=${v.fix(info.wf, 0)}$ m, young-crust fit $350\\sqrt t=${v.fix(info.ps, 0)}$ m${info.t > 70 ? ' (extrapolated beyond its 0–70 Myr range)' : ''} (below the 2500 m ridge crest). For $t>80$ Myr the half-space curve keeps falling but the sea floor does not.`);
      },
    },

    // ───────────────────────────────────────── 4.5
    {
      num: '4.5',
      kind: 'Proposition',
      name: 'Oceanic heat flow falls as 1/√age',
      statement: String.raw`The surface heat flow of the half-space cooling model (4.3) is the gradient at the surface times the conductivity:
$$q(t)=\frac{k\,(T_m-T_0)}{\sqrt{\pi\kappa t}}\;\approx\;\frac{0.45\ \text{W m}^{-2}}{\sqrt{t/\mathrm{Myr}}},$$
so heat flow decreases as $t^{-1/2}$, from several hundred mW/m² at the ridge towards about 50–100 mW/m² on old crust. Integrated over the sea floor with its age–area distribution, this gives most of the Earth's oceanic heat loss.`,
      idea: String.raw`Differentiate the erf profile of 4.3 at $z=0$: $\partial_zT|_0=(T_m-T_0)/\sqrt{\pi\kappa t}$, then multiply by $k$ (4.1). The $t^{-1/2}$ singularity at the ridge is integrable, so the total heat lost by a patch of age distribution $A(t)$ is finite: $\int q\,dA$. On crust younger than about 50–60 Myr measured values are far below this curve because seawater circulating through cracks carries away heat that conduction probes do not see; the shortfall is the signature of hydrothermal circulation, and the measured heat flow only reaches the conductive curve on older, sediment-sealed crust.`,
      caption: String.raw`Left (log–log): the conductive law (blue), two published empirical fits (as quoted) and an **illustrative model** of the observed conductive heat flow (red), reduced by hydrothermal circulation on crust younger than the sealing age. Right: heat loss per 10 Myr of age for a triangular age distribution of the ocean floor (round numbers); the area between the curves is the missing hydrothermal flux. Drag the age probe.`,
      deps: ['geol-4.3'],
      refs: ['Turcotte–Schubert ch. 4'],
      tags: ['heat flow', 'hydrothermal', 'sea floor'],
      credit: 'Parsons & Sclater, 1977; Stein & Stein, 1994 (hydrothermal flux)',
      scope: String.raw`Holds as the lithospheric conductive heat flow in the half-space model; the conductive flow measured in probes on young crust is lower because of hydrothermal circulation, and measured heat flow also departs from $t^{-1/2}$ on old sea floor (plate model, 4.6). The age–area distribution used for the total is an approximation.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Heat_flow#Oceanic_heat_flow' },
      verify: true,
      viz(v) {
        const dT = v.slider('$T_m-T_0$ (K)', 1100, 1500, 1350, { step: 10 });
        const kk = v.slider('conductivity $k$ (W/m/K)', 2.5, 4, 3.3, { step: 0.05 });
        const ts = v.slider('sealing age (Myr)', 20, 90, 60, { step: 1 });
        const f0 = v.slider('conductive fraction at the ridge', 0, 0.6, 0.2, { step: 0.02 });
        const AREA = 3.1e14, TM = 180; // m², Myr
        const C = (2 * AREA) / TM; // m² per Myr of age at t = 0
        const qth = (t) => halfSpaceQ(t, { Tm: dT.value, T0: 0, k: kk.value }) * 1000;
        const fc = (t) => (t >= ts.value ? 1 : 1 - (1 - f0.value) * (1 - t / ts.value) ** 2);
        const PSq = (t) => 473 / Math.sqrt(t);
        const SSq = (t) => (t < 55 ? 510 / Math.sqrt(t) : 48 + 96 * Math.exp(-0.0278 * t));
        const H = v.stage({ x: [1, 200], y: [20, 700], xlog: true, ylog: true, axes: 'box', gutter: true, xlabel: 'age (Myr)', ylabel: 'heat flow (mW/m²)', height: 340, weight: 1.2, minWidth: 280 });
        const G = v.stage({ x: [0, 180], y: [0, 3], axes: 'box', gutter: true, xlabel: 'age (Myr)', ylabel: 'heat loss per 10 Myr of age (TW)', height: 340, weight: 1, minWidth: 260 });
        const probe = H.handle(8, 150, { color: 'gold', label: 'age', labelPos: 'ne', constrain: (x) => [Math.min(Math.max(x, 1), 180), qth(Math.min(Math.max(x, 1), 180)) * fc(Math.min(Math.max(x, 1), 180))] });
        let info = {};
        v.render(() => {
          const tt = Array.from({ length: 160 }, (_, i) => Math.exp(Math.log(1) + (i / 159) * (Math.log(200) - Math.log(1))));
          H.path(tt.map((t) => [t, qth(t)]), { color: 'accent', width: 2.4 });
          H.path(tt.map((t) => [t, PSq(t)]), { color: 'orange', width: 1.4, dash: [5, 3] });
          H.path(tt.map((t) => [t, SSq(t)]), { color: 'teal', width: 1.4, dash: [2, 3] });
          H.path(tt.map((t) => [t, qth(t) * fc(t)]), { color: 'red', width: 2.4 });
          H.vline(ts.value, { color: 'muted', dash: true, alpha: 0.6 });
          const tp = Math.min(Math.max(probe.x, 1), 180); probe.set(tp, qth(tp) * fc(tp));
          // global integral: heat loss per 10 Myr bin
          const dens = (t) => (qth(t) / 1000) * C * (1 - t / TM) * 10 / 1e12; // TW per 10 Myr
          G.fn((t) => dens(t), { domain: [0.5, 180], color: 'accent', width: 2.2, fill: true, base: 0 });
          G.fn((t) => dens(t) * fc(t), { domain: [0.5, 180], color: 'red', width: 2.2, fill: true, base: 0 });
          G.vline(tp, { color: 'gold', dash: true });
          // substitute t = u² to remove the integrable 1/√t singularity at the ridge
          const tot = v.M.integrate((u) => ridgeHeatIntegrand(u, { area: AREA, maxAge: TM, Tm: dT.value, k: kk.value }), 0, Math.sqrt(TM), 400) / 1e12;
          const cond = v.M.integrate((u) => ridgeHeatIntegrand(u, { area: AREA, maxAge: TM, Tm: dT.value, k: kk.value }) * fc(u * u), 0, Math.sqrt(TM), 400) / 1e12;
          info = { tp, q: qth(tp), qo: qth(tp) * fc(tp), tot, cond };
        });
        v.legend([['accent', 'conductive law $t^{-1/2}$'], ['orange', 'P&S fit 473/√t (quoted)', { dash: true }], ['teal', 'Stein & Stein fit (quoted)', { dash: true }], ['red', 'model of observed (hydrothermal deficit)']]);
        v.readout(() => `At ${v.fix(info.tp, 0)} Myr: law ${v.fix(info.q, 0)} mW/m², model-observed ${v.fix(info.qo, 0)} mW/m². Integrated over the ocean floor: ${v.fix(info.tot, 1)} TW from the law, ${v.fix(info.cond, 1)} TW conducted in the model, so ${v.fix(info.tot - info.cond, 1)} TW (${v.fix(100 * (1 - info.cond / info.tot), 0)}%) is carried by water.`);
      },
    },
  ],
};
