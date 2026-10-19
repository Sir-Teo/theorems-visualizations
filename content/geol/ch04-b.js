// Geology & Geophysics — Chapter 4: Heat flow, the cooling lithosphere and mantle convection (part b: 4.6–4.10)
//
// Sources checked / provenance (Oct 2026):
//   4.6  Plate model: McKenzie (1967, JGR 72: 6261–6273, Crossref-checked) and Parsons & Sclater (1977, JGR 82: 803–827). The series
//        solutions are standard separation-of-variables results (computed here; the subsidence series was also cross-checked against the
//        half-space limit). Empirical fits for the comparison: Parsons & Sclater 6400 − 3200 exp(−t/62.8) m and Stein & Stein (1992)
//        GDH1 5651 − 2473 exp(−0.0278 t) m, quoted from a web summary of the papers (not opened). The plate thicknesses those papers fit
//        (about 125 and 95 km) are quoted from memory and not repeated as facts; Johnson & Carlson (1992) are reported by a web summary
//        to find ≈104 ± 9 km. The slider is a free parameter, not a fit.
//   4.7  Rayleigh numbers: critical values 657.5 (two free-slip surfaces), 1100.65 (one free) and 1707.76 (two rigid) are the classical
//        Rayleigh/Jeffreys/Pellew–Southwell results, quoted from memory. Mantle values (ρ = 4000 kg/m³, g = 10 m/s², α = 3×10⁻⁵ K⁻¹,
//        ΔT = 3000 K, h = 2890 km, κ = 10⁻⁶ m²/s) are round numbers; the viscosity slider is a free parameter. The simulation is
//        this chapter's own solver (shared file): 2-D, infinite Prandtl number, free-slip, constant viscosity, aspect ratio 2√2, capped at
//        Ra = 10⁵ because the grid (80 × 28) cannot resolve thinner boundary layers; verified against the onset (conduction at Ra = 500,
//        convection at 1500; theory 657.5 for this wavelength).
//   4.8  The Nu and w_rms tables were produced offline by that solver (Ra = 10³…10⁵, converged to a steady state) and are a MODEL
//        result, not data. The Nu ∝ Ra^{1/3} argument is the boundary-layer theory of Turcotte & Oxburgh (1967, J. Fluid Mech. 28:
//        29–42, Crossref-checked) and Howard (1966, Crossref-checked); the 'laboratory exponents near 0.3' and the "plate speed of cm/yr"
//        are stated as scalings from the model only.
//   4.9  Morgan (1971, Nature 230: 42–43), Wilson (1963, Can. J. Phys. 41: 863–870), Griffiths & Campbell (1990, EPSL 99: 66–78),
//        Richards, Duncan & Courtillot (1989, Science 246: 103–107) are all Crossref-checked for title, venue and year. The model
//        plume has constant viscosity (real plume tails are narrow because hot rock is much less viscous), so the head/tail contrast
//        is weaker than in nature.
//   4.10 Solidus: Hirschmann (2000, G-cubed 1, Crossref-checked), T = 1120.66 + 132.9 P − 5.104 P² (°C, GPa), as given in its abstract
//        by a web summary. Adiabat gradient 15 K/GPa, latent-heat term 500 K per unit melt fraction and liquidus − solidus = 700 K are
//        ROUND MODEL NUMBERS that give a productivity of about 10 %/GPa (typical of textbook values; not looked up). McKenzie & Bickle (1988, J.
//        Petrology 29: 625–679, Crossref-checked) is the credit for the quantitative decompression-melting model.

import { MYR, KAPPA, plateT, plateQ, plateSubs, halfSpaceQ, halfSpaceSubs, makeConvection, CONV_L } from './ch04.shared.js';

// Offline results of makeConvection (80×28 for Ra ≤ 10⁴, 102×36 above; steady state; see provenance note 4.8).
const NU_TABLE = [[1e3, 1.74], [2e3, 2.70], [5e3, 3.87], [1e4, 4.87], [2e4, 6.02], [5e4, 7.98], [1e5, 9.97]];
const W_TABLE = [[2e3, 8.7], [5e3, 17.7], [1e4, 28.5], [2e4, 44.8], [5e4, 80.3], [1e5, 124.5]];
const H_MANTLE = 2.89e6; // m
const RA_OF_ETA = (eta) => (4000 * 10 * 3e-5 * 3000 * H_MANTLE ** 3) / (KAPPA * eta);

/** Least-squares line in log–log of points [[x, y]…] → {slope, c (so that y = c x^slope)}. */
function logFit(pts) {
  const n = pts.length, lx = pts.map((p) => Math.log(p[0])), ly = pts.map((p) => Math.log(p[1]));
  const mx = lx.reduce((a, b) => a + b, 0) / n, my = ly.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0; for (let i = 0; i < n; i++) { sxy += (lx[i] - mx) * (ly[i] - my); sxx += (lx[i] - mx) ** 2; }
  const slope = sxy / sxx; return { slope, c: Math.exp(my - slope * mx) };
}
const STILL = () => typeof window !== 'undefined' && window.__vizStill;

export default {
  collection: 'geol',
  chapter: 4,
  items: [
    // ───────────────────────────────────────── 4.6
    {
      num: '4.6',
      kind: 'Model',
      name: 'The plate model',
      statement: String.raw`Let the cooling lithosphere be a plate of fixed thickness $a$ whose base is held at the mantle temperature $T_m$ (the asthenosphere resupplies heat) and whose top is at $T_0$. Starting from a uniform $T_m$ at the ridge, the solution is
$$T=T_0+(T_m-T_0)\Big[\frac za+\sum_{n\ge1}\frac{2}{n\pi}\sin\frac{n\pi z}{a}\,e^{-n^2\pi^2\kappa t/a^2}\Big].$$
Young plates behave like the half-space of 4.3 (depth $\propto\sqrt t$, $q\propto1/\sqrt t$); old plates approach the linear steady geotherm, so the depth tends to a constant and the heat flow to $k(T_m-T_0)/a$, with the approach governed by the time $a^2/\pi^2\kappa$ (about 30 Myr for $a=100$ km).`,
      idea: String.raw`The heat equation $\partial_tT=\kappa\,\partial_z^2T$ on $0<z<a$ with fixed ends has the steady solution $z/a$ and a transient expanded in the sine modes $\sin(n\pi z/a)$, each decaying with rate $n^2\pi^2\kappa/a^2$. For $t\ll a^2/\kappa$ the whole series is needed and the base never matters (half-space); for $t\gg a^2/\pi^2\kappa$ only the $n=1$ term survives and the isotherms stop deepening. The model repairs the failure of the $\sqrt t$ law on old sea floor, where depth and heat flow level off.`,
      caption: String.raw`Vary the plate thickness $a$: the plate curves (gold) leave the half-space curves (dashed) at the age where the cooling reaches the base, and level off at a depth and heat flow set by $a$. The published empirical fits for depth are drawn for comparison. Drag the age probe in the cross-section; the base of the plate is the dotted line.`,
      deps: ['geol-4.4', 'pde-4.11'],
      refs: ['Turcotte–Schubert ch. 4'],
      tags: ['lithosphere', 'plate model', 'flattening'],
      credit: 'McKenzie, 1967; Parsons & Sclater, 1977',
      scope: String.raw`A one-dimensional conduction model with a fixed basal temperature: it assumes the asthenosphere supplies whatever heat is needed, and it ignores small-scale convection under the plate, heat production and hydrothermal cooling. The thickness is a fitted parameter of the model, not an observation.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Seafloor_depth_versus_age' },
      verify: true,
      viz(v) {
        const a = v.slider('plate thickness $a$ (km)', 50, 160, 100, { step: 1 });
        const dT = v.slider('$T_m-T_0$ (K)', 1200, 1450, 1300, { step: 10 });
        const yt = [[0, '0'], [-50, '50'], [-100, '100'], [-150, '150']];
        const A = v.stage({ x: [0, 150], y: [-160, 0], axes: 'box', gutter: true, xlabel: 'age (Myr)', ylabel: 'depth (km)', yticks: yt, height: 330, weight: 1.1, minWidth: 260, title: 'Plate temperature' });
        const B = v.stage({ x: [0, 180], y: [-6.4, -2.2], axes: 'box', gutter: true, xlabel: 'age (Myr)', ylabel: 'sea-floor depth (km)', yticks: [[-2, '2'], [-3, '3'], [-4, '4'], [-5, '5'], [-6, '6']], height: 330, weight: 1, minWidth: 240 });
        const C = v.stage({ x: [1, 200], y: [20, 600], xlog: true, ylog: true, axes: 'box', gutter: true, xlabel: 'age (Myr)', ylabel: 'heat flow (mW/m²)', height: 330, weight: 1, minWidth: 240 });
        const probe = A.handle(60, -8, { color: 'gold', constrain: 'x', label: 'age', labelPos: 'ne' });
        const GD = (t) => (t < 20 ? 2600 + 365 * Math.sqrt(t) : 5651 - 2473 * Math.exp(-0.0278 * t));
        const PS = (t) => (t < 20 ? 2500 + 350 * Math.sqrt(t) : 6400 - 3200 * Math.exp(-t / 62.8));
        let info = {};
        v.render(() => {
          const am = a.value * 1000, d = dT.value, t = Math.min(Math.max(probe.x, 1), 150); probe.set(t, -8);
          A.heat((x, y) => (-y >= a.value ? 1 : plateT(-y * 1000, Math.max(x, 0.05), am, { Tm: d }) / d), { range: [0, 1], cmap: 'magma', res: 3, key: `p${a.value}_${d}` });
          A.hline(-a.value, { color: 'ink', dash: [2, 3], width: 1.6 });
          A.contour((x, y) => (-y >= a.value ? d : plateT(-y * 1000, Math.max(x, 0.05), am, { Tm: d })), [200, 600, 1000], { color: 'ink', width: 0.8, alpha: 0.5 });
          A.vline(t, { color: 'gold', dash: true });
          const ts = Array.from({ length: 181 }, (_, i) => Math.max(i, 0.3));
          B.path(ts.map((x) => [x, -(2500 + halfSpaceSubs(x, { Tm: d })) / 1000]), { color: 'accent', width: 1.6, dash: [5, 3] });
          B.path(ts.map((x) => [x, -(2500 + plateSubs(x, am, { Tm: d })) / 1000]), { color: 'gold', width: 2.6 });
          B.path(ts.map((x) => [x, -PS(x) / 1000]), { color: 'orange', width: 1.2, alpha: 0.8 });
          B.path(ts.map((x) => [x, -GD(x) / 1000]), { color: 'teal', width: 1.2, dash: [2, 3], alpha: 0.8 });
          B.vline(t, { color: 'gold', dash: true, alpha: 0.5 });
          const tl = Array.from({ length: 140 }, (_, i) => Math.exp((i / 139) * Math.log(200)));
          C.path(tl.map((x) => [x, halfSpaceQ(x, { Tm: d }) * 1000]), { color: 'accent', width: 1.6, dash: [5, 3] });
          C.path(tl.map((x) => [x, plateQ(x, am, { Tm: d }) * 1000]), { color: 'gold', width: 2.6 });
          C.vline(t, { color: 'gold', dash: true, alpha: 0.5 });
          info = { t, tau: (am * am) / (Math.PI * Math.PI * KAPPA) / MYR, wInf: plateSubs(1e4, am, { Tm: d }), qInf: plateQ(1e4, am, { Tm: d }) * 1000, w: plateSubs(t, am, { Tm: d }), wh: halfSpaceSubs(t, { Tm: d }), q: plateQ(t, am, { Tm: d }) * 1000, qh: halfSpaceQ(t, { Tm: d }) * 1000 };
        });
        v.legend([['accent', 'half-space (4.3, 4.4)', { dash: true }], ['gold', 'plate model'], ['orange', 'Parsons & Sclater fit'], ['teal', 'GDH1 fit', { dash: true }]]);
        v.readout(() => `Plate $a=${v.fix(a.value, 0)}$ km: time constant $a^2/\\pi^2\\kappa=${v.fix(info.tau, 0)}$ Myr; limits depth $2500+${v.fix(info.wInf, 0)}$ m, heat flow $kT/a=${v.fix(info.qInf, 0)}$ mW/m². At ${v.fix(info.t, 0)} Myr: subsidence ${v.fix(info.w, 0)} m (half-space ${v.fix(info.wh, 0)} m), heat flow ${v.fix(info.q, 0)} mW/m² (half-space ${v.fix(info.qh, 0)}).`);
      },
    },

    // ───────────────────────────────────────── 4.7
    {
      num: '4.7',
      kind: 'Phenomenon',
      name: 'Mantle convection and the Rayleigh number',
      statement: String.raw`A fluid layer of depth $h$ heated from below and cooled from above, with density $\rho(1-\alpha(T-T_0))$ and viscosity $\eta$, is stable against buoyancy until the dimensionless
$$\mathrm{Ra}=\frac{\rho g\alpha\,\Delta T\,h^3}{\kappa\,\eta}$$
exceeds a critical value of order $10^3$ (657.5 for two free surfaces, 1708 for two rigid ones). Above it, the layer convects; at large Ra the heat is carried by a nearly isothermal, vigorously stirred interior and thin thermal boundary layers at top and bottom. For the Earth's mantle $\mathrm{Ra}\sim10^6$–$10^8$, so it convects, and the plates are its cold top boundary layer.`,
      idea: String.raw`Ra compares the time heat takes to diffuse across the layer ($h^2/\kappa$) with the time a buoyant blob takes to rise ($\eta/\rho g\alpha\Delta T h$): a warm blob that rises faster than it cools drives a flow. Linear stability of the conductive state (the Rayleigh–Bénard problem, fluid-10.8) gives the threshold; the mantle's very high viscosity (about $10^{22}$ Pa s) is more than compensated by its thickness, which enters cubed. Conduction (4.1) sets the thermal diffusion that competes with the flow.`,
      caption: String.raw`A live 2-D simulation (infinite Prandtl number, free-slip box, hot below and cold above). Change the **viscosity**: above $\mathrm{Ra}\approx700$ rolls start, and the temperature field develops thin boundary layers and a nearly isothermal interior (right: the horizontally averaged temperature). The simulation is capped at $\mathrm{Ra}=10^5$ because the grid cannot resolve thinner layers; the mantle's own Ra is in the readout. Press *Restart* to repeat.`,
      deps: ['fluid-10.8', 'geol-4.1', 'fluid-2.5'],
      refs: ['Turcotte–Schubert ch. 6'],
      tags: ['convection', 'Rayleigh number', 'mantle'],
      credit: 'Rayleigh, 1916 (stability criterion); Holmes, 1931 and Pekeris, 1935 (mantle convection)',
      scope: String.raw`Holds for a Boussinesq fluid of constant viscosity heated from below. The real mantle has strongly temperature- and stress-dependent viscosity, internal heating, phase changes and a cold stagnant lid, all of which change the pattern but not the main idea. The simulation is two-dimensional.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Mantle_convection' },
      verify: true,
      viz(v) {
        const eta = v.slider('mantle viscosity $\\eta$ (Pa s)', 1e20, 1e27, 3e24, { log: true, sig: 2 });
        const A = v.stage({ x: [0, CONV_L], y: [0, 1], height: 300, equal: true, axes: false, weight: 1.7, minWidth: 320, title: 'Temperature (hot = light) and streamlines' });
        const P = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, xlabel: 'mean temperature $\\bar T$', ylabel: 'height $z/h$', height: 300, weight: 0.7, minWidth: 200 });
        let S = null, simRa = 0, timer = null, tEnd = 0.4, done = false, info = {};
        const clampRa = (r) => Math.min(Math.max(r, 300), 1e5);
        const fresh = () => {
          const ra = clampRa(RA_OF_ETA(eta.value)); simRa = ra;
          S = makeConvection({ nx: ra > 3e4 ? 96 : 80, nz: ra > 3e4 ? 34 : 28, Ra: ra });
          tEnd = ra >= 5e4 ? 0.12 : ra > 1e4 ? 0.25 : 0.45; done = false;
          if (STILL()) { S.advance(tEnd); done = true; }
        };
        const tick = () => {
          timer = null;
          if (!S || done) return;
          done = S.advance(tEnd, 12);
          v.invalidate();
          if (!done) timer = setTimeout(tick, 0);
        };
        const kick = () => { if (!timer && !done) timer = setTimeout(tick, 0); };
        fresh();
        v.button('Restart', () => { fresh(); kick(); });
        v.onCleanup(() => { if (timer) clearTimeout(timer); timer = null; done = true; });
        v.render(() => {
          const want = clampRa(RA_OF_ETA(eta.value));
          if (Math.abs(Math.log(want / simRa)) > 0.01) { fresh(); }
          kick();
          S.wrms();
          A.heat((x, y) => S.at(x, y), { range: [0, 1], cmap: 'magma', res: 4, key: `c${S.steps}_${simRa}` });
          const ps = []; let pm = 0; for (let k = 0; k < S.P.length; k++) pm = Math.max(pm, Math.abs(S.P[k]));
          if (pm > 1e-3) { for (let i = -5; i <= 5; i++) if (i) ps.push((i / 5.5) * pm); A.contour((x, y) => S.psiAt(x, y), ps, { color: 'ink', width: 0.9, alpha: 0.5, res: 100 }); }
          const prof = []; for (let j = 0; j < S.nz; j++) { let m = 0; for (let i = 0; i < S.nx; i++) m += S.T[j * S.nx + i]; prof.push([m / S.nx, (j + 0.5) * S.dz]); }
          P.path([[1, 0], [0, 1]], { color: 'muted', dash: true, width: 1.4 });
          P.path([[1, 0], ...prof, [0, 1]], { color: 'accent', width: 2.4 });
          const nu = S.nu().mean;
          info = { Ra: RA_OF_ETA(eta.value), simRa, nu, w: S.wrms(), t: S.time, done, steps: S.steps };
        });
        v.legend([['accent', 'horizontal mean $\\bar T(z)$'], ['muted', 'conductive profile', { dash: true }], ['ink', 'streamlines']]);
        v.readout(() => {
          const flow = info.nu > 1.03 ? `convecting: $\\mathrm{Nu}=${v.fix(info.nu, 2)}$ times the conductive heat flux, boundary layers $\\approx h/2\\mathrm{Nu}=${v.fix(H_MANTLE / 1000 / (2 * info.nu), 0)}$ km if scaled to the mantle` : 'conducting: no flow survives';
          return `Mantle Ra for this viscosity: $${v.sci(info.Ra, 2)}$; simulated at $\\mathrm{Ra}=${v.sci(info.simRa, 2)}$${info.Ra > 1e5 ? ' (cap)' : ''}, critical about $660$ (free-slip). ${flow}. Model time $${v.fix(info.t, 3)}\\,h^2/\\kappa$${info.done ? '' : ' (running…)'}.`;
        });
      },
    },

    // ───────────────────────────────────────── 4.8
    {
      num: '4.8',
      kind: 'Proposition',
      name: 'Boundary-layer scaling: Nu ∝ Ra^(1/3)',
      statement: String.raw`In vigorous convection (Ra far above critical) the heat flux, scaled by the conductive flux, the Nusselt number $\mathrm{Nu}$, grows as
$$\mathrm{Nu}\;\propto\;\mathrm{Ra}^{1/3},$$
independently of the layer depth $h$, and the typical flow speed grows as $\mathrm{Ra}^{2/3}\kappa/h$. The thermal boundary layers have thickness $\delta\sim h/2\mathrm{Nu}$ and are themselves marginally unstable.`,
      idea: String.raw`Suppose the boundary layer thickens by conduction until its own local Rayleigh number $\rho g\alpha(\Delta T/2)\delta^3/\kappa\eta$ reaches a critical value $\mathrm{Ra}_\delta$ of order 10³ and then breaks off. Then $\delta\propto(\kappa\eta/\rho g\alpha\Delta T)^{1/3}$ does not contain $h$, so $\mathrm{Nu}\sim h/\delta\propto\mathrm{Ra}^{1/3}$. Energy balance on the sinking sheets (heat advected at speed $u$ through a layer $\delta$) then gives $u\sim\kappa/\delta\cdot(\ldots)\propto\mathrm{Ra}^{2/3}\kappa/h$. This supports fixing the heat flow from Rayleigh numbers rather than from the details of the flow (the "parameterized" thermal history of the Earth).`,
      caption: String.raw`Left: Nusselt number against Rayleigh number on log axes, from this page's own solver (table, steady states), with the line $C\,\mathrm{Ra}^{1/3}$ (adjust $C$). Right: rms vertical speed against Ra with a $2/3$ slope. Press *Run now* to compute a new point live with the solver at the chosen Ra (it may take a few seconds). The mantle extrapolation in the readout is a scaling, not a prediction.`,
      deps: ['geol-4.7'],
      refs: ['Turcotte–Schubert ch. 6'],
      tags: ['convection', 'scaling', 'Nusselt number'],
      credit: 'Turcotte & Oxburgh, 1967; Howard, 1966',
      scope: String.raw`An asymptotic scaling for isoviscous, bottom-heated convection at high Ra. Measured exponents fall slightly below 1/3 (here ≈ 0.31 over the resolved range; laboratory values near 0.3); with strongly temperature-dependent viscosity or internal heating the effective exponent and prefactor change.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Rayleigh%E2%80%93B%C3%A9nard_convection' },
      verify: true,
      viz(v) {
        const live = v.slider('live run: Ra', 1e3, 1e5, 3e4, { log: true, sig: 2 });
        const C = v.slider('line $C$ in $\\mathrm{Nu}=C\\,\\mathrm{Ra}^{1/3}$', 0.1, 0.4, 0.215, { step: 0.001 });
        const live_pts = []; let timer = null, running = false, prog = '';
        const N = v.stage({ x: [500, 2e5], y: [1, 20], xlog: true, ylog: true, axes: 'box', gutter: true, xlabel: 'Rayleigh number Ra', ylabel: 'Nusselt number Nu', height: 340, weight: 1.1, minWidth: 280 });
        const W = v.stage({ x: [500, 2e5], y: [3, 300], xlog: true, ylog: true, axes: 'box', gutter: true, xlabel: 'Rayleigh number Ra', ylabel: 'rms vertical speed ($\\kappa/h$)', height: 340, weight: 1.1, minWidth: 280 });
        const run = () => {
          if (running) return; running = true;
          const ra = live.value, nz = ra > 3e4 ? 36 : 28, S = makeConvection({ nx: Math.round(nz * 2.828), nz, Ra: ra });
          const tEnd = ra >= 5e4 ? 0.1 : 0.4, step = () => {
            const ok = S.advance(tEnd, 12); prog = `${Math.round((100 * S.time) / tEnd)}%`; v.invalidate();
            if (ok) { running = false; prog = ''; live_pts.push({ Ra: ra, Nu: S.nu().mean, w: S.wrms() }); v.invalidate(); } else timer = setTimeout(step, 0);
          };
          step();
        };
        v.button('Run now', run);
        v.button('Clear live points', () => { live_pts.length = 0; });
        v.onCleanup(() => { if (timer) clearTimeout(timer); running = false; });
        const fitHi = logFit(NU_TABLE.filter((p) => p[0] >= 1e4)), fitW = logFit(W_TABLE.filter((p) => p[0] >= 1e4));
        let info = {};
        v.render(() => {
          const xs = [500, 2e5];
          N.line(xs[0], C.value * Math.cbrt(xs[0]), xs[1], C.value * Math.cbrt(xs[1]), { color: 'green', width: 2 });
          N.path(NU_TABLE.map((p) => [p[0], p[1]]), { color: 'accent', width: 1, alpha: 0.5 });
          N.dots(NU_TABLE.map((p) => [p[0], p[1]]), { r: 5.5, color: 'accent' });
          N.dots(live_pts.map((p) => [p.Ra, p.Nu]), { r: 6, color: 'gold' });
          const w0 = W_TABLE.find((p) => p[0] === 1e4)[1];
          W.line(xs[0], w0 * (xs[0] / 1e4) ** (2 / 3), xs[1], w0 * (xs[1] / 1e4) ** (2 / 3), { color: 'green', width: 2 });
          W.dots(W_TABLE.map((p) => [p[0], p[1]]), { r: 5.5, color: 'accent' });
          W.dots(live_pts.map((p) => [p.Ra, p.w]), { r: 6, color: 'gold' });
          if (prog) N.corner(`running… ${prog}`, 'tl');
          const eta22 = 1e22, Ram = RA_OF_ETA(eta22);
          info = { sl: fitHi.slope, sw: fitW.slope, Ram, Num: fitHi.c * Ram ** fitHi.slope, wm: fitW.c * Ram ** fitW.slope * (KAPPA / H_MANTLE) * 3.156e7 * 100 };
        });
        v.legend([['accent', 'solver (table)', { dot: true }], ['gold', 'live run', { dot: true }], ['green', 'slope 1/3 (left), 2/3 (right)']]);
        v.readout(() => `Fitted log–log slope for $\\mathrm{Ra}\\ge10^4$: $\\mathrm{Nu}\\propto\\mathrm{Ra}^{${v.fix(info.sl, 3)}}$ (theory 1/3), speed $\\propto\\mathrm{Ra}^{${v.fix(info.sw, 2)}}$ (theory 2/3). Scaling the fit to the mantle at $\\eta=10^{22}$ Pa s ($\\mathrm{Ra}=${v.sci(info.Ram, 2)}$): $\\mathrm{Nu}\\approx${v.fix(info.Num, 0)}$, vertical speeds of the order of ${v.fix(info.wm, 1)} cm/yr.`);
      },
    },

    // ───────────────────────────────────────── 4.9
    {
      num: '4.9',
      kind: 'Phenomenon',
      name: 'Mantle plumes',
      statement: String.raw`Narrow upwellings of hot rock, mantle plumes, are proposed to rise from a hot thermal boundary layer deep in the mantle. A starting plume has a large buoyant head that spreads beneath the lithosphere and a thin conduit (the tail) that stays fixed relative to the deep mantle. Wilson (1963) and Morgan (1971) suggested that a plume tail under a moving plate leaves a chain of volcanoes of progressively greater age, and the arrival of a head has been linked to flood basalts.`,
      idea: String.raw`A hot layer of low density under a colder, denser one is unstable once the local Rayleigh number of the layer exceeds its critical value (4.7). A blob that detaches rises, and fluid is fed to it from behind through a conduit, so a head forms; laboratory experiments (Griffiths and Campbell) and theory give a head several times wider than the tail, which entrains little surrounding fluid. When the head reaches the cold lid it flattens; the tail continues to supply melt, and as the plate moves a track of volcanoes forms above it.`,
      caption: String.raw`A hot blob at the base starts a plume in the simulation of 4.7 (constant viscosity, so the head/tail contrast is weaker than in nature). The row of volcanoes at the top records the plate moving across the fixed plume after the head arrives; choose the plate speed relative to the plume's rise speed and the Rayleigh number, and press *Restart*.`,
      deps: ['geol-4.7'],
      refs: ['Turcotte–Schubert ch. 6'],
      tags: ['plumes', 'hotspots', 'convection'],
      credit: 'Wilson, 1963 (hotspot hypothesis); Morgan, 1971 (plumes from the lower mantle)',
      scope: String.raw`A hypothesis that explains many features (age-progressive volcanic chains, large igneous provinces) but whose seismic imaging and depth of origin remain debated. The model here has constant viscosity and no compositional effects; real plume heads need not be as symmetric.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Mantle_plume' },
      verify: true,
      viz(v) {
        const ra = v.select('Rayleigh number', [{ value: 1e4, label: '$10^4$' }, { value: 3e4, label: '$3\\times10^4$' }, { value: 1e5, label: '$10^5$' }], 1e5);
        const vp = v.slider('plate speed ÷ plume rise speed', 0.02, 0.6, 0.25, { step: 0.01 });
        const A = v.stage({ x: [0, CONV_L], y: [0, 1], height: 320, equal: true, axes: false, weight: 1.6, minWidth: 320, title: 'Temperature (hot = light); plate on top moving right' });
        const B = v.stage({ x: [0, CONV_L], y: [0, 1], axes: 'box', gutter: true, xlabel: 'position along the plate', ylabel: 'age of volcano ($h^2/\\kappa$)', height: 320, weight: 0.8, minWidth: 220, title: 'Volcano age against distance' });
        let S = null, timer = null, done = false, arrive = null, info = {};
        const arrived = () => {
          let m = 0;
          for (const j of [S.nz - 1, S.nz - 2]) for (let i = 0; i < S.nx; i++) { const x = (i + 0.5) * S.dx; if (Math.abs(x - CONV_L / 2) < 0.4) m = Math.max(m, S.T[j * S.nx + i]); }
          return m > 0.25;
        };
        const fresh = () => {
          const R = Number(ra.value), nz = R > 3e4 ? 36 : 28;
          S = makeConvection({ nx: Math.round(nz * 2.828), nz, Ra: R }); S.initPlume({ bump: 1, w: 0.12, layer: 0.06 }); arrive = null; done = false;
          if (STILL()) { while (arrive == null && S.time < 0.2) { S.step(0.002); if (arrived()) arrive = S.time; } if (arrive != null) S.advance(arrive * 2); done = true; }
        };
        const tick = () => {
          timer = null; if (!S || done) return;
          const t0 = performance.now();
          while (performance.now() - t0 < 12) {
            S.step(0.002);
            if (arrive == null && arrived()) arrive = S.time;
            if (S.time > 0.3 || (arrive != null && S.time > arrive * 2.2)) { done = true; break; }
          }
          v.invalidate(); if (!done) timer = setTimeout(tick, 0);
        };
        const kick = () => { if (!timer && !done) timer = setTimeout(tick, 0); };
        fresh();
        let lastRa = ra.value;
        v.button('Restart', () => { fresh(); kick(); });
        v.onCleanup(() => { if (timer) clearTimeout(timer); timer = null; done = true; });
        v.render(() => {
          if (ra.value !== lastRa) { lastRa = ra.value; fresh(); }
          kick();
          A.heat((x, y) => S.at(x, y), { range: [0, 0.8], cmap: 'magma', res: 4, key: `p${S.steps}_${ra.value}` });
          // volcano track on a plate moving to the right over the fixed plume axis (box centre)
          const trk = [];
          if (arrive != null) {
            const vrise = 1 / arrive, vpl = vp.value * vrise, now = S.time, gap = arrive * 0.2;
            for (let ti = arrive, n = 0; ti <= now && n < 40; ti += gap, n++) {
              const x = CONV_L / 2 + vpl * (now - ti);
              if (x > CONV_L - 0.05) break;
              trk.push([x, now - ti]);
            }
            trk.forEach((p, n) => A.dot(p[0], 0.965, { r: 6, color: n === 0 ? 'red' : 'orange' }));
            A.text('plate →', 0.08, 0.93, { size: 11, color: 'ink', align: 'left', plate: true });
          }
          A.vline(CONV_L / 2, { color: 'faint', dash: true, alpha: 0.4 });
          B.setView([0, CONV_L], [0, Math.max(S.time * 1.05, 1e-3)]);
          B.setTicks(null, null);
          if (trk.length) { B.path(trk, { color: 'muted', width: 1.4 }); B.dots(trk, { r: 5, color: 'orange' }); B.dot(trk[0][0], trk[0][1], { r: 6, color: 'red' }); }
          let wid = 0; { const j = Math.floor(0.4 * S.nz); for (let i = 0; i < S.nx; i++) if (S.T[j * S.nx + i] > 0.4) wid += S.dx; }
          let wh = 0; { const j = S.nz - 3; for (let i = 0; i < S.nx; i++) if (S.T[j * S.nx + i] > 0.25) wh += S.dx; }
          info = { arrive, wid, wh, t: S.time, trk: trk.length, done };
        });
        v.legend([['orange', 'volcanoes (older to the right)', { dot: true }], ['red', 'first eruption', { dot: true }]]);
        v.readout(() => {
          const head = info.arrive == null ? 'the head is still rising' : `the head reached the lid at $t=${v.fix(info.arrive, 4)}$ (mean rise speed $${v.fix(1 / info.arrive, 0)}\\,\\kappa/h$); hot region under the lid ${v.fix(info.wh, 2)}$h$ wide against a tail ${v.fix(info.wid, 2)}$h$ wide at 40% height`;
          return `Model time $${v.fix(info.t, 4)}\\,h^2/\\kappa$: ${head}. ${info.trk} volcano${info.trk === 1 ? '' : 'es'} so far, spaced by the plate speed times the interval.`;
        });
      },
    },

    // ───────────────────────────────────────── 4.10
    {
      num: '4.10',
      kind: 'Phenomenon',
      name: 'Decompression melting',
      statement: String.raw`Solid mantle that rises nearly adiabatically cools only slowly (about 10–15 K per GPa), while the solidus temperature falls much faster with decreasing pressure (about 100–130 K/GPa near the surface). A parcel with potential temperature $T_p$ therefore crosses the solidus at a pressure $P_0$ set by $T_p$, and then melts increasingly as it keeps rising, without being heated. Beneath ridges and plumes this produces melt fractions of the order of 10–20 % and, after extraction, oceanic crust some 6–7 km thick; a lithospheric lid stops the melting at its base and thins the product.`,
      idea: String.raw`In the pressure–temperature plane the adiabat (nearly vertical) crosses the sloping solidus at $P_0$; above it, melting absorbs latent heat, so the temperature falls below the solid adiabat, while the temperature excess over the solidus is converted into melt in proportion to $(T_{\rm liq}-T_{\rm sol})$ per unit melt fraction. Balancing the excess against the solidus slope gives $dF/dP\approx(dT_s/dP-\Gamma)/(L/c_p+T_{\rm liq}-T_{\rm sol})$, about 10 % per GPa. A hotter mantle (a plume, $T_p$ higher by 100–200 K) crosses the solidus deeper and yields thicker crust, as at Iceland. The Clapeyron slope of the solidus is the thermodynamic input (pchem-4.3).`,
      caption: String.raw`Left: the pressure–temperature path of rising mantle (dashed: solid adiabat; solid: path with latent heat once melting begins) against the dry solidus of Hirschmann (2000). Right: melt fraction against depth. Raise $T_p$ (a plume) or thicken the lithospheric lid (an old plate or a plume under a continent) and watch the onset depth, the final melt fraction and the model crust thickness change. Round model numbers, not a petrological calculation.`,
      deps: ['geol-4.7', 'pchem-4.3', 'thermo-1.16', 'thermo-4.5'],
      refs: ['Turcotte–Schubert ch. 4'],
      tags: ['melting', 'solidus', 'adiabat'],
      credit: 'McKenzie & Bickle, 1988 (decompression-melting model); Hirschmann, 2000 (solidus)',
      scope: String.raw`Holds for dry peridotite undergoing batch melting during passive upwelling with efficient melt extraction. Water, carbon dioxide or a compositional change moves the solidus; real melting is closer to fractional than to batch, and the crust thickness formula ignores active upwelling and melt freezing in the lid.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Decompression_melting' },
      verify: true,
      viz(v) {
        const Tp = v.slider('potential temperature $T_p$ (°C)', 1200, 1650, 1350, { step: 5 });
        const lid = v.slider('lithospheric lid thickness (km)', 0, 100, 0, { step: 1 });
        const G = 15, LC = 500, DL = 700, KMGPA = 30.9;
        const Ts = (P) => 1120.66 + 132.899 * P - 5.104 * P * P;
        const P0of = (tp) => { // tp + G P = Ts(P): solve with bisection on [0, 8]
          if (tp - Ts(0) <= 0) return 0;
          let lo = 0, hi = 8; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (tp + G * m - Ts(m) > 0) lo = m; else hi = m; } return (lo + hi) / 2;
        };
        const Ff = (P, P0, Pl) => { const Pm = Math.max(P, Pl); return P >= P0 ? 0 : Math.max(0, ((132.899 - G) * (P0 - Pm) - 5.104 * (P0 * P0 - Pm * Pm)) / (LC + DL)); };
        const L = v.stage({ x: [1000, 2100], y: [-4.2, 0], axes: 'box', gutter: true, xlabel: 'temperature (°C)', ylabel: 'pressure (GPa)', yticks: [[0, '0'], [-1, '1'], [-2, '2'], [-3, '3'], [-4, '4']], height: 360, weight: 1.2, minWidth: 280 });
        const R = v.stage({ x: [0, 30], y: [-4.2, 0], axes: 'box', gutter: true, xlabel: 'melt fraction $F$ (%)', ylabel: 'depth (km)', yticks: [[0, '0'], [-1, '31'], [-2, '62'], [-3, '93'], [-4, '124']], height: 360, weight: 0.8, minWidth: 220 });
        let info = {};
        v.render(() => {
          const tp = Tp.value, Pl = lid.value / KMGPA, P0 = P0of(tp);
          L.curve((P) => [Ts(P), -P], 0, 4.2, { n: 100, color: 'red', width: 2.4 });
          L.curve((P) => [Ts(P) + DL, -P], 0, 4.2, { n: 100, color: 'red', width: 1.2, dash: [3, 3], alpha: 0.7 });
          L.line(tp, 0, tp + G * 4.2, -4.2, { color: 'accent', dash: true, width: 1.6 });
          if (P0 > 0) {
            const Pe = Math.max(Pl, 0);
            L.curve((P) => [tp + G * P - LC * Ff(P, P0, Pl), -P], Pe, P0, { n: 80, color: 'accent', width: 2.6 });
            L.dot(tp + G * P0, -P0, { r: 5, color: 'gold' });
            if (Pl > 0) L.hline(-Pl, { color: 'muted', dash: true });
          }
          L.dot(tp, 0, { r: 4, color: 'accent', label: '$T_p$', labelPos: 'n' });
          const Pg = Array.from({ length: 160 }, (_, i) => (i / 159) * Math.max(P0, 0.01));
          R.path(Pg.map((P) => [100 * Ff(P, P0, Pl), -P]), { color: 'orange', width: 2.4 });
          if (Pl > 0) R.hband(-Pl, 0, { color: 'muted', alpha: 0.25 });
          const Pend = Math.max(Pl, 0), Fmax = Ff(Pend, P0, Pl);
          const thick = P0 > Pl ? v.M.integrate((P) => Ff(P, P0, Pl), Pl, P0, 200) * 1e9 / (9.8 * 2900) / 1000 : 0;
          info = { P0, d0: P0 * KMGPA, Fmax, thick, nomelt: P0 <= Pl };
        });
        v.legend([['red', 'dry solidus (Hirschmann 2000)'], ['red', 'solidus + 700 K', { dash: true }], ['accent', 'rising mantle path'], ['gold', 'melting begins', { dot: true }]]);
        v.readout(() => (info.P0 <= 0 ? 'The mantle is below the solidus at the surface: no melting.' : info.nomelt ? `Melting would begin at ${v.fix(info.d0, 0)} km, but the lid is thicker: no melt.` : `Melting begins at $P_0=${v.fix(info.P0, 2)}$ GPa (${v.fix(info.d0, 0)} km), reaches $F=${v.fix(100 * info.Fmax, 1)}\\%$ at the base of the lid, and $\\int F\\,dP/\\rho_c g=${v.fix(info.thick, 1)}$ km of model crust ($\\rho_c=2900$ kg/m³). Observed oceanic crust: about 6–7 km.`));
      },
    },
  ],
};
