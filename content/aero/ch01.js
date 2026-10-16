// Aerospace Engineering — Chapter 1: The atmosphere and aerodynamic forces
//
// Sources checked (Oct 2026): see the header of ch01.shared.js for the full list.
//   1.1 ISA = U.S. Standard Atmosphere 1976 (NOAA-S/T 76-1562): layer table (base heights, lapse rates, base pressures, densities)
//       as reproduced at en.wikipedia.org/wiki/International_Standard_Atmosphere; the picture integrates hydrostatics and compares with it.
//   1.2 Surface pressure from a Hess–Smith panel method (source panels + one vortex density, Kutta condition), shear from a flat-plate
//       boundary-layer estimate (Blasius 0.664/sqrt(Re), Schlichting turbulent 0.0592 Re^-0.2). The separated-wake option is an
//       illustrative dead-air model (constant pressure behind the separation point), not a measurement.
//   1.3 NACA 0012 data: Critzos, Heyson & Boswinkle, NACA TN 3361 (1955), read off Fig. 3(b), R = 1.8e6 and 0.5e6. Aircraft values:
//       AOPA / Plane & Pilot (Cessna 172S), SKYbrary / Airbus (A320; wing area 122.6 m2 from memory), Wikipedia (SR-71).
//   1.4 Sutherland-law air viscosity, perfect-gas tunnels; the cryogenic/pressurised envelope is idealised, not any real facility.
//   1.5 Pitot-tube relations: isentropic stagnation (subsonic) and the Rayleigh pitot formula (supersonic); calibrated airspeed is
//       defined against standard sea level (a0 = 340.294 m/s, p0 = 101325 Pa). Instrument and position errors are not modelled.
//   1.6 a = sqrt(gamma R T), gamma = 1.4, R = 287.053 J/(kg K); the standard value 340.294 m/s at 15 C is the check.

import {
  clamp, lerp, DEG, FT, KT, G0, GAMMA, R_STD, P0, T0, RHO0, A0, LAYERS, H_TOP, geopot, geom, tempH, pressH, pressNum, atmo, gasState,
  impactPressure, casFromQc, machFromQc, tasFromCas, AIRCRAFT, CRITZOS_18, CRITZOS_05, clTab, cdTab, cmTab,
  naca4, camberLine, nacaCamber, panelModel, panelSolve, panelForces, skinFriction, piGroups, texProduct, DIMS,
} from './ch01.shared.js';

const sg = (x, d = 3) => Number(x).toLocaleString('en-US', { maximumSignificantDigits: d });
const fx = (x, d = 2) => (Math.abs(x) < 0.5 * 10 ** -d ? 0 : x).toFixed(d).replace('-', '−');
const sci = (x, d = 2) => { if (!x) return '0'; const e = Math.floor(Math.log10(Math.abs(x))), m = x / 10 ** e; return `${m.toFixed(d)}\\times10^{${e}}`; };

export default {
  collection: 'aero',
  chapter: 1,
  title: 'The atmosphere and aerodynamic forces',
  summary: String.raw`Aircraft fly through an atmosphere whose pressure, density and temperature fall with altitude in a standardised way. Every aerodynamic force comes from pressure and shear acting on the surface, and dimensional analysis compresses their dependence on speed, size and air properties into a few coefficients and two numbers: Reynolds and Mach. Measuring airspeed with a pitot tube and correcting it for altitude completes the toolkit.`,
  items: [
    // ───────────────────────────────────────────────────────────────────────────────────── 1.1
    {
      num: '1.1',
      kind: 'Model',
      name: 'The International Standard Atmosphere',
      statement: String.raw`The **International Standard Atmosphere** (ISA, identical to the U.S. Standard Atmosphere 1976 below 86 km) is a fixed, dry-air reference. Temperature is piecewise linear in the geopotential altitude $H$, with sea-level values $T_0 = 288.15$ K, $p_0 = 101\,325$ Pa, $\rho_0 = 1.225$ kg/m³ and lapse rates $-6.5$ K/km up to 11 km, $0$ to 20 km, $+1.0$ to 32 km, $+2.8$ to 47 km, $0$ to 51 km, $-2.8$ to 71 km and $-2.0$ K/km above. Pressure follows from hydrostatic balance $\mathrm{d}p = -\rho g_0\,\mathrm{d}H$ and the ideal-gas law $p = \rho R T$:
$$p = p_b\Bigl(\tfrac{T}{T_b}\Bigr)^{-g_0/(RL)}\ (L \ne 0),\qquad p = p_b\,e^{-g_0 (H-H_b)/(R T_b)}\ (L = 0),$$
chained from layer to layer; density is $\rho = p/RT$ and the speed of sound $a = \sqrt{\gamma R T}$ with $R = 287.05$ J/(kg K), $\gamma = 1.4$.`,
      idea: String.raw`Both the weight of the air above and the ideal-gas law are exact, so $\mathrm{d}\ln p/\mathrm{d}H = -g_0/(RT)$: the only modelling choice is the temperature profile, which ISA fixes as a few straight segments. Where $T$ is linear the integral is a power law, where it is constant an exponential, and the chained formulas reproduce the published layer-base pressures to a few parts per million. Pressure and density fall by a factor of about $e$ every 7 to 8 km (the scale height $RT/g_0$) in the troposphere, and the temperature break at 11 km is why a single exponential is badly wrong.`,
      caption: String.raw`Drag the gold handle (or the slider) up through the atmosphere. Temperature falls at 6.5 K/km to the tropopause, stays at $-56.5$ °C, then rises; pressure and density, drawn on a log axis, decay by orders of magnitude. The red dashed curves are a single isothermal exponential at 15 °C: at 20 km it is already 1.3 times too dense. The readout compares the closed form with a numerical integration of the hydrostatic equation and with the published table.`,
      deps: ['fluid-2.2', 'pchem-1.4'],
      refs: ['Anderson ch. 3'],
      tags: ['atmosphere', 'hydrostatics'],
      scope: String.raw`Dry air at rest, no weather: a reference profile, not a forecast. Geopotential altitude $H = r z/(r+z)$ absorbs the weakening of gravity with geometric height $z$. Real temperatures differ from ISA by tens of kelvin, so aircraft work with "ISA + 15" corrections.`,
      credit: 'ICAO / U.S. Standard Atmosphere 1976 (NOAA, NASA, USAF)',
      viz(v) {
        const alt = v.slider('altitude (km)', 0, 86, 11, { step: 0.1 });
        const view = v.select('view', [{ value: 'air', label: 'aircraft range (0–28 km)' }, { value: 'all', label: 'whole model (0–86 km)' }], 'air', { onChange: () => { if (view.value === 'air' && alt.value > 28) alt.set(28); } });
        const iso = v.toggle('compare an isothermal 15 °C atmosphere', true);
        const common = { axes: 'box', gutter: true, height: 420, minWidth: 240 };
        const A = v.stage({ ...common, x: [170, 300], y: [0, 28], xlabel: 'temperature T (K)', ylabel: 'geometric altitude (km)', title: 'temperature and layers' });
        const B = v.stage({ ...common, x: [0.01, 1.5], y: [0, 28], xlog: true, xlabel: 'relative to sea level', title: 'pressure and density' });
        const C = v.stage({ ...common, x: [285, 345], y: [0, 28], xlabel: 'speed of sound a (m/s)', title: 'speed of sound' });
        const zmax = () => (view.value === 'air' ? 28 : 86);
        const at = (zkm) => atmo(zkm * 1000);
        const isoAt = (zkm) => { const H = geopot(zkm * 1000), p = P0 * Math.exp(-G0 * H / (R_STD * T0)); return { T: T0, p, rho: p / (R_STD * T0), a: A0 }; };
        const mark = [['Cessna 172', 2.59], ['Everest', 8.849], ['A320', 10.668], ['SR-71', 25.908]];
        const h = A.handle(216, 11, { color: 'gold', r: 8, constrain: (x, y) => { const z = clamp(y, 0, zmax()); return [at(z).T, z]; } });
        let sync = false;
        h.onDrag = () => { if (sync) return; sync = true; alt.set(Math.round(h.y * 10) / 10); sync = false; };
        const names = { troposphere: 'troposphere', tropopause: 'isothermal', stratosphere: 'stratosphere', stratopause: 'stratopause', mesosphere: 'mesosphere' };
        v.render(() => {
          const zm = zmax(), z = alt.value, cur = at(z), e = isoAt(z), n = zm > 30 ? 400 : 240;
          A.setView([170, 300], [0, zm]); B.setView(zm > 30 ? [1e-7, 3] : [0.01, 1.5], [0, zm]); C.setView([285, 345], [0, zm]);
          LAYERS.forEach(([H0, , L, , nm], i) => {
            const z0 = geom(H0) / 1000, z1 = (i + 1 < LAYERS.length ? geom(LAYERS[i + 1][0]) : geom(H_TOP)) / 1000;
            if (z0 >= zm) return;
            A.hband(z0, Math.min(z1, zm), { color: i % 2 ? 'teal' : 'accent', alpha: 0.07 });
            if ((Math.min(z1, zm) - z0) * A.sy >= 15) A.text(`${names[nm]}  ${L ? `${L > 0 ? '+' : '−'}${Math.abs(L * 1000)}` : '0'} K/km`, 172, (z0 + Math.min(z1, zm)) / 2, { size: 10, color: 'muted', baseline: 'middle' });
          });
          A.curve((t) => [at(t).T, t], 0, zm, { n, color: 'accent', width: 2.4 });
          B.curve((t) => [at(t).p / P0, t], 0, zm, { n, color: 'accent', width: 2.4 });
          B.curve((t) => [at(t).rho / RHO0, t], 0, zm, { n, color: 'orange', width: 2.4 });
          C.curve((t) => [at(t).a, t], 0, zm, { n, color: 'accent', width: 2.4 });
          if (iso.value) {
            A.curve((t) => [T0, t], 0, zm, { n: 2, color: 'red', dash: true, width: 1.5 });
            B.curve((t) => [isoAt(t).p / P0, t], 0, zm, { n, color: 'red', dash: true, width: 1.5 });
            B.curve((t) => [isoAt(t).rho / RHO0, t], 0, zm, { n, color: 'red', dash: true, width: 1.5, alpha: 0.6 });
            C.curve((t) => [A0, t], 0, zm, { n: 2, color: 'red', dash: true, width: 1.5 });
          }
          for (const [nm, zk] of mark) if (zk < zm) { const T = at(zk).T; A.dot(T, zk, { r: 3.5, color: 'ink' }); if (nm === 'Cessna 172' || nm === 'A320') A.text(nm, T - 3, zk, { size: 10, color: 'ink', baseline: 'middle', align: 'right' }); else A.text(nm, T + 3, zk, { size: 10, color: 'ink', baseline: 'middle' }); }
          for (const S of [A, B, C]) S.hline(z, { color: 'gold', alpha: 0.55, width: 1.2 });
          sync = true; h.set(cur.T, z); sync = false;
          B.dot(cur.p / P0, z, { color: 'accent', r: 5 }); B.dot(cur.rho / RHO0, z, { color: 'orange', r: 5 });
          C.dot(cur.a, z, { color: 'gold', r: 5 });
          v.legend([['accent', 'T, p/p₀, a (ISA)'], ['orange', 'ρ/ρ₀ (ISA)'], ...(iso.value ? [['red', 'isothermal 15 °C', { dash: true }]] : [])]);
        });
        v.readout(() => {
          const z = alt.value, c = at(z), e = isoAt(z), Hh = c.H, pn = pressNum(Hh);
          let worst = 0; for (const [H0, , , pb] of LAYERS) worst = Math.max(worst, Math.abs(pressH(H0) / pb - 1));
          return `$z = ${fx(z, 1)}$ km geometric, $H = ${fx(Hh / 1000, 2)}$ km geopotential · layer: ${c.layer}\n`
            + `$T = ${fx(c.T, 2)}$ K ($${fx(c.T - 273.15, 1)}$ °C) · $p = ${sg(c.p, 5)}$ Pa $= ${fx(100 * c.p / P0, c.p / P0 < 0.01 ? 4 : 2)}\\%$ of sea level · $\\rho = ${sg(c.rho, 4)}$ kg/m³ $= ${fx(100 * c.rho / RHO0, c.rho / RHO0 < 0.01 ? 4 : 2)}\\%$ · $a = ${fx(c.a, 2)}$ m/s\n`
            + `Hydrostatic check: Simpson integration of $\\mathrm{d}\\ln p = -g_0\\mathrm{d}H/(RT)$ gives $${sg(pn, 6)}$ Pa against the closed form $${sg(c.p, 6)}$ Pa (difference $${fx(1e6 * (pn / c.p - 1), 2)}$ ppm). Chained closed forms vs the published layer-base pressures: worst error $${fx(1e6 * worst, 1)}$ ppm over the seven layers; published $\\rho$: 0.3639 at 11 km (here $${sg(at(geom(11000) / 1000).rho, 4)}$), 0.0880 at 20 km (here $${sg(at(geom(20000) / 1000).rho, 3)}$).\n`
            + (iso.value ? `Isothermal 15 °C exponential: $p = ${sg(e.p, 4)}$ Pa, $\\rho = ${sg(e.rho, 3)}$ kg/m³, that is ${fx(e.rho / c.rho, 2)}× the standard density here.` : '');
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 1.2
    {
      num: '1.2',
      kind: 'Concept',
      name: 'Aerodynamic forces from pressure and shear',
      statement: String.raw`All aerodynamic force on a body is transmitted through its surface by exactly two mechanisms: the **pressure** $p$, acting normal to the surface, and the **shear stress** $\tau_w$, acting along it. The resultant is
$$\mathbf F = \oint \bigl(-p\,\mathbf n + \tau_w\,\mathbf t\bigr)\,\mathrm{d}s,$$
with $\mathbf n$ the outward normal. Its component perpendicular to the free stream is the **lift**, the component along it the **drag**; the drag splits into **pressure (form) drag** and **skin-friction drag**. For a streamlined, attached flow lift comes almost entirely from pressure and drag almost entirely from friction; for a blunt or stalled body pressure drag dominates.`,
      idea: String.raw`Newton's second law applied to a control volume around the body (the momentum theorem) says that the force the fluid exerts on the surface is the surface integral of the stress vector, and the stress in a viscous fluid at a wall is just $-p\mathbf n$ plus the wall shear. Pressure is large and unbalanced on the front stagnation region and the suction side; in potential flow the pressure forces cancel exactly in the drag direction (d'Alembert's paradox), so every real drag comes from the boundary layer: its shear directly, and its separation by spoiling the pressure recovery on the rear.`,
      caption: String.raw`A NACA airfoil in a stream from the left. Blue arrows are pressure pushing on the surface, teal arrows are suction pulling away from it, orange arrows are skin friction; the green and red arrows are their vector sum resolved into lift and drag (drag drawn ×20). Switch pressure or friction off and watch which one makes the lift and which the drag. Pull the separation point forward on the upper surface to let the boundary layer detach: pressure drag appears and lift collapses.`,
      deps: ['fluid-2.8', 'fluid-6.1'],
      refs: ['Anderson ch. 2'],
      tags: ['forces', 'pressure', 'friction'],
      scope: String.raw`Pressure comes from an inviscid panel solution (valid while the flow is attached, below roughly $12^\circ$ for a 12 % section); friction from a flat-plate boundary-layer estimate driven by the computed edge speed. The separation model is illustrative: constant pressure behind the separation point.`,
      viz(v) {
        const AF = { '0012': [0, 0, 0.12], '2412': [0.02, 0.4, 0.12], '4412': [0.04, 0.4, 0.12], '0006': [0, 0, 0.06] };
        const cache = {};
        const modelFor = (k) => (cache[k] ||= panelModel(naca4(...AF[k], 60)));
        const sel = v.select('airfoil', Object.keys(AF).map((k) => ({ value: k, label: `NACA ${k}` })), '0012');
        const alpha = v.slider('angle of attack α (°)', -4, 16, 5, { step: 0.1 });
        const Re = v.slider('Reynolds number', 1e5, 1e8, 3e6, { log: true });
        const bl = v.select('boundary layer', [{ value: 'lam', label: 'laminar' }, { value: 'tr', label: 'transition at 30 %' }, { value: 'turb', label: 'turbulent' }], 'tr');
        const sep = v.slider('upper surface separates at x/c =', 0.1, 1, 1, { step: 0.01 });
        const onP = v.toggle('pressure', true), onF = v.toggle('skin friction', true);
        const A = v.stage({ x: [-0.6, 1.5], y: [-0.28, 0.55], equal: true, axes: false, height: 420, full: true });
        const B = v.stage({ x: [0, 1], y: [-1.5, 4], axes: 'box', gutter: true, height: 300, minWidth: 280, xlabel: 'x/c', ylabel: '−C_p (up = suction)', title: 'pressure coefficient' });
        const C = v.stage({ x: [0, 1], y: [0, 12], axes: 'box', gutter: true, height: 300, minWidth: 280, xlabel: 'x/c', ylabel: '1000·c_f', title: 'skin friction' });
        let last = {};
        const pick = (model) => { // panels spaced along the surface for the arrows
          if (model.pick) return model.pick;
          const out = []; let acc = 1e9;
          for (let i = 0; i < model.N; i++) { acc += model.L[i]; if (acc > 0.04) { out.push(i); acc = 0; } }
          return (model.pick = out);
        };
        v.render(() => {
          const model = modelFor(sel.value), N = model.N, n = N / 2, al = alpha.value * DEG, ca = Math.cos(al), sa = Math.sin(al);
          const sol = panelSolve(model, al), cp = Float64Array.from(sol.cp);
          const xtr = bl.value === 'lam' ? 1.01 : bl.value === 'turb' ? 0 : 0.3;
          const fr = skinFriction(model, sol.Vt, Re.value, xtr), cf = fr.cf;
          let ks = N;
          if (sep.value < 0.999) { ks = n; while (ks < N - 1 && model.cx[ks] < sep.value) ks++; const c0 = cp[ks]; for (let i = ks; i < N; i++) { cp[i] = c0; cf[i] = 0; } }
          const cpU = onP.value ? cp : new Float64Array(N), F = panelForces(model, cpU, onF.value ? cf : null, al);
          const rot = (x, y) => [0.25 + (x - 0.25) * ca + y * sa, -(x - 0.25) * sa + y * ca], rv = (x, y) => [x * ca + y * sa, -x * sa + y * ca];
          // free stream
          for (const y of [-0.15, -0.05, 0.05, 0.15]) A.arrow(-0.55, y, -0.35, y, { color: 'muted', width: 1.2, head: 5 });
          A.text('V∞', -0.45, 0.23, { color: 'muted', size: 11, align: 'center' });
          A.poly(model.pts.map(([x, y]) => rot(x, y)), { fill: 'ink', fillAlpha: 0.22, color: 'ink', width: 1.6 });
          if (ks < N) { const [sx, sy] = rot(model.cx[ks], model.cy[ks]); A.dot(sx, sy, { r: 4.5, color: 'red' }); A.text('separation', sx + 0.02, sy + 0.07, { color: 'red', size: 10.5 }); }
          for (const i of pick(model)) {
            const [px, py] = rot(model.cx[i], model.cy[i]), [nx, ny] = rv(model.nx[i], model.ny[i]), [tx, ty] = rv(model.tx[i], model.ty[i]);
            if (onP.value) {
              const len = Math.min(0.5, 0.1 * Math.abs(cp[i]));
              if (len > 0.004) { if (cp[i] > 0) A.arrow(px + nx * len, py + ny * len, px, py, { color: 'accent', width: 1.5, head: 4 }); else A.arrow(px, py, px + nx * len, py + ny * len, { color: 'teal', width: 1.5, head: 4 }); }
            }
            if (onF.value && cf[i] !== 0) { const len = Math.min(0.2, 14 * Math.abs(cf[i])), sgn = Math.sign(cf[i]); if (len > 0.004) A.arrow(px + nx * 0.006, py + ny * 0.006, px + nx * 0.006 + sgn * tx * len, py + ny * 0.006 + sgn * ty * len, { color: 'orange', width: 2, head: 4 }); }
          }
          const Ls = 0.3 * F.cl, Ds = 20 * 0.3 * F.cd;
          A.arrow(0.25, 0, 0.25, Ls, { color: 'green', width: 3.2, head: 9 });
          if (Math.abs(F.cd) > 1e-4) A.arrow(0.25, 0, 0.25 + Ds, 0, { color: 'red', width: 3.2, head: 9 });
          A.tex(String.raw`L`, 0.25, Ls + (Ls >= 0 ? 0.045 : -0.045), { color: 'green', size: 15, align: 'center' });
          A.corner('green: lift L · red: drag D, drawn ×20', 'tl', { color: 'muted' });
          // plots
          const up = [], lo = [], cu = [], cl = [];
          for (let i = n; i < N; i++) { up.push([model.cx[i], -cp[i]]); cu.push([model.cx[i], cf[i] * 1000]); }
          for (let i = 0; i < n; i++) { lo.push([model.cx[i], -cp[i]]); cl.push([model.cx[i], -cf[i] * 1000]); }
          const lo2 = up.concat(lo);
          const ymin = Math.min(-1.2, ...lo2.map((q) => q[1]) ) - 0.2, ymax = Math.max(1.5, ...lo2.map((q) => q[1])) + 0.3;
          B.setView([0, 1], [ymin, ymax]);
          B.hline(0, { color: 'muted', width: 1 });
          B.poly(up.concat(lo.slice().reverse().map(([x, y]) => [x, y])), { fill: 'accent', fillAlpha: 0.14, stroke: false });
          B.path(up, { color: 'accent', width: 2.2 }); B.path(lo, { color: 'accent', width: 2.2, dash: true });
          const cmax = Math.max(4, ...cu.map((q) => q[1]), ...cl.map((q) => q[1])) * 1.1;
          C.setView([0, 1], [0, cmax]);
          C.path(cu.filter((q) => q[1] > 0), { color: 'orange', width: 2.2 }); C.path(cl.filter((q) => q[1] > 0), { color: 'orange', width: 2.2, dash: true });
          if (xtr > 0 && xtr < 1) C.vline(xtr, { color: 'muted', dash: true, width: 1 });
          v.legend([['accent', 'upper surface'], ['accent', 'lower surface', { dash: true }], ['teal', 'suction'], ['orange', 'friction']]);
          last = { sol, F, cp, ks, model, n, up, lo };
        });
        v.readout(() => {
          const { sol, F, ks, up, lo } = last, al = alpha.value, model = last.model;
          // lift from the area between the pressure curves
          let area = 0; for (let i = 0; i < model.N; i++) area += -last.cp[i] * model.ny[i] * model.L[i];
          // thin-airfoil zero-lift angle
          const [m, p] = AF[sel.value]; let a0 = 0; for (let k = 0; k < 400; k++) { const th = (k + 0.5) / 400 * Math.PI, x = (1 - Math.cos(th)) / 2, dy = nacaCamber(x, m, p)[1]; a0 -= dy * (Math.cos(th) - 1) / 400; }
          const clThin = 2 * Math.PI * (al * DEG + a0);
          const flat = bl.value === 'lam' ? 2 * 1.328 / Math.sqrt(Re.value) : bl.value === 'turb' ? 2 * 0.074 * Re.value ** -0.2 : null;
          return `Pressure alone: $c_l = ${fx(F.clp, 3)}$, pressure drag $c_{d,p} = ${fx(F.cdp * 1e4, 1)}\\times10^{-4}$ (zero for attached potential flow: d'Alembert) · friction: $c_{d,f} = ${fx(F.cdf, 4)}$ ($${fx(F.cdf * 1e4, 0)}$ drag counts)${flat ? `; flat plate, both sides: $${fx(flat, 4)}$` : ''}\n`
            + `Resultant: $c_l = ${fx(F.cl, 3)}$, $c_d = ${fx(F.cd, 4)}$, $L/D = ${F.cd > 1e-5 ? fx(F.cl / F.cd, 1) : '\\infty'}$, $c_{m,c/4} = ${fx(F.cm, 3)}$. Checks: Kutta–Joukowski $-2\\Gamma/Vc = ${fx(sol.kj, 3)}$; thin-airfoil $2\\pi(\\alpha-\\alpha_{L0}) = ${fx(clThin, 3)}$ ($\\alpha_{L0} = ${fx(a0 / DEG, 2)}^\\circ$); $\\oint -C_p\\,\\mathrm{d}x\\ (\\text{area between curves}) = ${fx(area, 3)}$.`
            + (ks < model.N ? `\nThe flow is separated behind $x/c = ${fx(model.cx[ks], 2)}$: the pressure there no longer recovers, so form drag appears and the suction side loses lift.` : al > 12 ? '\nAbove about 12–14° a real section of this thickness stalls; the attached-flow solution shown here no longer applies.' : '');
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 1.3
    {
      num: '1.3',
      kind: 'Definition',
      name: 'Lift, drag and moment coefficients',
      statement: String.raw`For a body of reference area $S$ (the wing planform area) and reference length $c$ (the mean chord) in a stream of density $\rho$ and speed $V$, define the **dynamic pressure** $q = \tfrac12\rho V^2$ and the dimensionless coefficients
$$C_L = \frac{L}{qS},\qquad C_D = \frac{D}{qS},\qquad C_M = \frac{M}{qSc}.$$
By the Buckingham $\pi$ theorem they depend only on the dimensionless groups that remain: the shape, the angle of attack $\alpha$, the Reynolds number $Re = \rho V c/\mu$ and the Mach number $M = V/a$. For a given shape, $\alpha$, $Re$ and $M$ the coefficients are the same for every size, speed and altitude.`,
      idea: String.raw`A force depends on $\rho, V, S$ and the other fluid properties; the dimension matrix of mass, length and time has rank 3, so with $n$ variables there are $n - 3$ independent dimensionless products (Buckingham). Choosing $\rho$, $V$, $S$ as repeating variables and solving a $3\times3$ linear system for each remaining variable gives $L/(\rho V^2 S)$, $\mu/(\rho V\sqrt S)$ and $a/V$: lift coefficient, inverse Reynolds number, inverse Mach number. So $C_L = f(\alpha, \text{shape}, Re, M)$; dividing a measured force by $qS$ removes size and speed.`,
      caption: String.raw`Three wings with the same shape, all at the same angle of attack: a wind-tunnel model, a Cessna 172 wing and an A320 wing, each at its own speed and altitude. Their lift forces (left, log scale) differ by six orders of magnitude, but $L/(qS)$ lands on the same measured NACA 0012 point (middle, the rings coincide). Drag the handle along the curve to change $\alpha$: past the stall at about 14° the lift coefficient drops and the drag rises, shown on the drag polar (right) with the best $C_L/C_D$.`,
      deps: ['aero-1.2'],
      refs: ['Anderson ch. 5'],
      tags: ['coefficients', 'dimensional analysis'],
      scope: String.raw`Holds while $Re$ and $M$ are comparable between the cases: the measured curve is for $Re = 1.8\times10^6$ and $M\le0.15$, so the A320 point (higher $Re$ and $M$) is a sketch of the idea, not a prediction. The drag shown is the two-dimensional section drag; a finite wing adds induced drag (chapter 3).`,
      credit: 'Buckingham, 1914; NACA 0012 data: Critzos, Heyson & Boswinkle, NACA TN 3361, 1955',
      viz(v) {
        const alpha = v.slider('angle of attack α (°)', 0, 30, 6, { step: 0.1 });
        const CFG = [
          { name: 'tunnel model', S: 0.3, c: 0.3, z: 0, V: [10, 100, 40], color: 'accent' },
          { name: 'Cessna 172 wing', S: 16.2, c: 1.47, z: 2590, V: [20, 90, 62], color: 'orange' },
          { name: 'A320 wing', S: 122.6, c: 4.29, z: 35000 * FT, V: [100, 300, 231], color: 'teal' },
        ];
        const sl = CFG.map((c) => v.slider(`speed of ${c.name} (m/s)`, c.V[0], c.V[1], c.V[2], { step: 1, log: true }));
        const quantity = v.select('dimensional analysis of', [{ value: 'lift', label: 'lift' }, { value: 'full', label: 'lift with μ and a' }, { value: 'moment', label: 'pitching moment' }], 'lift');
        const A = v.stage({ x: [5, 350], y: [1, 1e8], xlog: true, ylog: true, axes: 'box', gutter: true, height: 340, minWidth: 260, xlabel: 'true airspeed V (m/s)', ylabel: 'lift L (N)', title: 'forces: very different' });
        const B = v.stage({ x: [0, 30], y: [0, 1.6], axes: 'box', gutter: true, height: 340, minWidth: 260, xlabel: 'α (°)', ylabel: 'C_L = L/(qS)', title: 'coefficient: the same' });
        const Cp = v.stage({ x: [0, 0.25], y: [0, 1.6], axes: 'box', gutter: true, height: 340, minWidth: 260, xlabel: 'C_D', ylabel: 'C_L', title: 'drag polar of the section' });
        const hnd = B.handle(6, clTab(CRITZOS_18, 6), { color: 'gold', r: 8, constrain: (x) => [clamp(x, 0, 30), clTab(CRITZOS_18, clamp(x, 0, 30))] });
        let sync = false; hnd.onDrag = () => { if (sync) return; sync = true; alpha.set(Math.round(hnd.x * 10) / 10); sync = false; };
        let best = [0, 0, 0]; for (let a = 0; a <= 30; a += 0.05) { const r = clTab(CRITZOS_18, a) / cdTab(CRITZOS_18, a); if (r > best[0]) best = [r, a, 0]; }
        const state = () => CFG.map((c, i) => { const a = atmo(c.z), V = sl[i].value, q = 0.5 * a.rho * V * V, al = alpha.value, CL = clTab(CRITZOS_18, al), CD = cdTab(CRITZOS_18, al), CM = cmTab(CRITZOS_18, al);
          return { ...c, a, V, q, L: q * c.S * CL, D: q * c.S * CD, M: q * c.S * c.c * CM, Re: a.rho * V * c.c / a.mu, Ma: V / a.a }; });
        v.render(() => {
          const st = state(), al = alpha.value, CL = clTab(CRITZOS_18, al), CD = cdTab(CRITZOS_18, al);
          st.forEach((c) => {
            A.fn((V) => 0.5 * c.a.rho * V * V * c.S * Math.max(CL, 1e-6), { color: c.color, width: 2.2 });
            A.dot(c.V, Math.max(c.L, 1.01), { color: c.color, r: 6 });
          });
          A.text('each curve: L ∝ V²', 6, 4e7, { color: 'muted', size: 10.5 });
          B.fn((a) => clTab(CRITZOS_18, a), { color: 'ink', width: 2.4, domain: [0, 30] });
          B.fn((a) => clTab(CRITZOS_05, a), { color: 'muted', width: 1.6, dash: true, domain: [0, 30] });
          B.fn((a) => 2 * Math.PI * a * DEG, { color: 'green', width: 1.4, dash: true, domain: [0, 12] });
          B.vband(14.2, 14.2, { color: 'red', alpha: 0.5 });
          B.text('stall ≈ 14°', 14.8, 1.52, { color: 'red', size: 10.5 });
          B.text('2π α', 7.5, 0.98, { color: 'green', size: 10.5, align: 'right' });
          st.forEach((c, i) => B.dot(al, c.L / (c.q * c.S), { color: c.color, r: 14 - 4.5 * i, hollow: true, width: 2.4 }));
          sync = true; hnd.set(al, CL); sync = false;
          Cp.curve((t) => [cdTab(CRITZOS_18, t), clTab(CRITZOS_18, t)], 0, 30, { n: 400, color: 'ink', width: 2.2 });
          Cp.line(0, 0, cdTab(CRITZOS_18, best[1]), clTab(CRITZOS_18, best[1]), { color: 'green', dash: true, width: 1.6 });
          Cp.dot(cdTab(CRITZOS_18, best[1]), clTab(CRITZOS_18, best[1]), { color: 'green', r: 5, label: `max L/D = ${fx(best[0], 0)}`, labelPos: 'ne' });
          Cp.dot(CD, CL, { color: 'gold', r: 7 });
          v.legend([['ink', 'NACA 0012, R = 1.8×10⁶'], ['muted', 'R = 0.5×10⁶', { dash: true }], ['green', '2π per radian', { dash: true }]]);
        });
        v.readout(() => {
          const st = state(), al = alpha.value, CL = clTab(CRITZOS_18, al), CD = cdTab(CRITZOS_18, al);
          const lines = st.map((c) => `**${c.name}** (S = ${sg(c.S, 3)} m², ${fx(c.z / 1000, 1)} km): $\\rho = ${fx(c.a.rho, 3)}$, $q = ${sg(c.q, 3)}$ Pa, $L = ${sci(c.L, 2)}$ N, $D = ${sci(c.D, 2)}$ N, $M = ${sci(c.M, 2)}$ N·m → $L/(qS) = ${fx(c.L / (c.q * c.S), 3)}$, $Re = ${sci(c.Re, 1)}$, $M_\\infty = ${fx(c.Ma, 2)}$`);
          const sets = { lift: [['L'], ['rho', 'V', 'S']], full: [['L', 'mu', 'a'], ['rho', 'V', 'S']], moment: [['Mom', 'c'], ['rho', 'V', 'S']] }[quantity.value];
          const vars = [...sets[0], ...sets[1]], G = piGroups(v.M, sets[1], sets[0]);
          const mat = `\\begin{array}{r|${'r'.repeat(vars.length)}} & ${vars.map((n) => DIMS[n].tex).join(' & ')} \\\\ \\hline \\mathrm{M} & ${vars.map((n) => DIMS[n].e[0]).join(' & ')} \\\\ \\mathrm{L} & ${vars.map((n) => DIMS[n].e[1]).join(' & ')} \\\\ \\mathrm{T} & ${vars.map((n) => DIMS[n].e[2]).join(' & ')} \\end{array}`;
          const groups = G.map((g) => `\\pi = ${texProduct([[g.w, 1], ...g.rep.filter(([, e]) => e !== 0)])}`);
          return `At $\\alpha = ${fx(al, 1)}^\\circ$: $C_L = ${fx(CL, 3)}$, $C_D = ${fx(CD, 4)}$, $C_M = ${fx(cmTab(CRITZOS_18, al), 3)}$ (about the quarter chord), $C_L/C_D = ${fx(CL / CD, 1)}$. ${al > 14.2 ? '**Stalled:** the section has lost lift and its drag has risen.' : ''}\n${lines.join('\n')}\n`
            + `Dimension matrix (exponents of M, L, T) $${mat}$ has rank 3 with ${vars.length} variables, so ${vars.length - 3} group${vars.length - 3 > 1 ? 's' : ''}: $${groups.join(',\\quad ')}$ (using $\\rho, V, S$ as repeating variables, solved as a $3\\times3$ linear system).`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 1.4
    {
      num: '1.4',
      kind: 'Concept',
      name: 'Similarity: Reynolds and Mach numbers',
      statement: String.raw`Two flows over geometrically similar bodies at the same angle of attack are **dynamically similar**, and have identical non-dimensional pressure, force and moment coefficients, when
$$Re = \frac{\rho V c}{\mu}\quad\text{and}\quad M = \frac{V}{a}$$
(and the ratio of specific heats) are equal. Reynolds number measures inertia against viscosity and controls the boundary layer, transition, separation and skin friction; Mach number measures compressibility. A scale model in a wind tunnel represents the full-size aircraft only if both match, which in an ordinary tunnel is impossible for a small model, since $Re$ falls with the scale factor at fixed $M$.`,
      idea: String.raw`Non-dimensionalising the Navier–Stokes and energy equations with $V$, $c$, $\rho$ leaves exactly two parameters in the equations and boundary conditions, $Re$ and $M$ (plus $\gamma$ and the Prandtl number): flows with equal parameters are the same solution scaled. At matched Mach, $V = M a$ is fixed by the temperature, so $Re = \rho M a c/\mu$ can only be raised by increasing the density (pressurise the tunnel) or lowering $\mu/a\rho$ (cool it, since $\mu$ falls and $\rho$ rises as $T$ drops). Cryogenic pressurised tunnels exist for this reason.`,
      caption: String.raw`Pick a full-size aircraft (star on the Reynolds–Mach plane), a model scale and a tunnel. The tunnel's operating line (slope 1 on log axes) slides up with pressure, cooling and model size; the shaded band is everything reachable between 1 atm at 320 K and 9 atm at 100 K. The dot is the current test point. Only when the dot reaches the star do both numbers match. On the right the same NACA 0012 measured at two Reynolds numbers stalls differently: the low-$Re$ model underpredicts the maximum lift.`,
      deps: ['fluid-6.5', 'fluid-6.6'],
      refs: ['Anderson ch. 4', 'Anderson ch. 5'],
      tags: ['similarity', 'Reynolds number', 'Mach number'],
      scope: String.raw`Perfect-gas model with Sutherland viscosity, test-section static conditions; the "reachable" band is an idealised bound, not the envelope of any real tunnel (real cryogenic tunnels are limited by dynamic pressure, structure and Mach range).`,
      viz(v) {
        const ac = v.select('full-size aircraft', AIRCRAFT.map((a) => ({ value: a.id, label: a.name })), 'a320');
        const scale = v.slider('model scale', 0.01, 1, 0.05, { log: true, sig: 2 });
        let pS, TS, MS;
        const preset = v.select('tunnel', [{ value: 'atm', label: 'atmospheric' }, { value: 'press', label: 'pressurised' }, { value: 'cryo', label: 'cryogenic' }], 'atm', { onChange: () => { const [p, T] = { atm: [1, 288], press: [5, 300], cryo: [9, 100] }[preset.value]; pS.set(p); TS.set(T); } });
        pS = v.slider('tunnel pressure (atm)', 0.5, 9, 1, { step: 0.1 });
        TS = v.slider('tunnel temperature (K)', 80, 330, 288, { step: 1 });
        MS = v.slider('test Mach number', 0.1, 4, 0.78, { log: true, sig: 2 });
        const A = v.stage({ x: [0.1, 4], y: [3e4, 1e9], xlog: true, ylog: true, axes: 'box', gutter: true, height: 380, minWidth: 300, weight: 1.4, xlabel: 'Mach number M', ylabel: 'Reynolds number (based on chord)', title: 'the Reynolds–Mach plane' });
        const B = v.stage({ x: [0, 32], y: [0, 1.6], axes: 'box', gutter: true, height: 380, minWidth: 260, weight: 1, xlabel: 'α (°)', ylabel: 'c_l', title: 'same section, two Reynolds numbers' });
        const full = () => { const a = AIRCRAFT.find((q) => q.id === ac.value), at = atmo(a.alt), V = a.tas ?? a.mach * at.a, M = V / at.a; return { ...a, at, V, M, Re: at.rho * V * a.chord / at.mu }; };
        const tun = (m, p = pS.value, T = TS.value, c = 1) => { const g = gasState(T, p * P0), V = m * g.a; return g.rho * V * c / g.mu; };
        v.render(() => {
          const F = full(), cm = F.chord * scale.value, pts = [];
          const lo = (m) => tun(m, 1, 320, cm), hi = (m) => tun(m, 9, 100, cm);
          const ms = []; for (let k = 0; k <= 60; k++) ms.push(0.1 * (4 / 0.1) ** (k / 60));
          A.poly(ms.map((m) => [m, hi(m)]).concat(ms.slice().reverse().map((m) => [m, lo(m)])), { fill: 'accent', fillAlpha: 0.1, stroke: false });
          A.path(ms.map((m) => [m, hi(m)]), { color: 'accent', width: 1, alpha: 0.5 }); A.path(ms.map((m) => [m, lo(m)]), { color: 'accent', width: 1, alpha: 0.5 });
          A.path(ms.map((m) => [m, tun(m, pS.value, TS.value, cm)]), { color: 'orange', width: 2.4 });
          A.vline(F.M, { color: 'green', dash: true, width: 1, alpha: 0.6 }); A.hline(F.Re, { color: 'green', dash: true, width: 1, alpha: 0.6 });
          A.dot(F.M, F.Re, { r: 8, color: 'green', label: `${F.name} (full size)`, labelPos: 'nw' });
          const Rt = tun(MS.value, pS.value, TS.value, cm);
          A.dot(MS.value, Rt, { r: 7, color: 'gold', label: 'model test point', labelPos: 'se' });
          B.fn((a) => clTab(CRITZOS_18, a), { color: 'ink', width: 2.4, domain: [0, 32] });
          B.fn((a) => clTab(CRITZOS_05, a), { color: 'red', width: 2.4, domain: [0, 32] });
          B.dot(14.2, 1.33, { color: 'ink', r: 4.5 }); B.dot(12.5, 1.0, { color: 'red', r: 4.5 });
          B.text('R = 1.8×10⁶: c_l,max = 1.33', 1, 1.45, { color: 'ink', size: 11, align: 'left' }); B.text('R = 0.5×10⁶: c_l,max ≈ 1.0', 1, 1.34, { color: 'red', size: 11, align: 'left' });
          v.legend([['green', 'full-size flight condition', { dot: true }], ['orange', 'model line (this tunnel)'], ['accent', 'reachable band (1 atm, 320 K ↔ 9 atm, 100 K)', { area: true }]]);
        });
        v.readout(() => {
          const F = full(), cm = F.chord * scale.value, g = gasState(TS.value, pS.value * P0), Vt = MS.value * g.a, Rt = g.rho * Vt * cm / g.mu;
          const rR = Rt / F.Re, rM = MS.value / F.M;
          const okM = Math.abs(rM - 1) < 0.05, okR = rR > 0.8 && rR < 1.25;
          // pressure needed at this temperature to match Re at the test Mach number
          const rhoN = F.Re * g.mu / (Vt * cm), pN = rhoN * R_STD * g.T / P0;
          return `**${F.name}**: chord ${fx(F.chord, 2)} m, ${F.note}: $V = ${fx(F.V, 0)}$ m/s, $M = ${fx(F.M, 2)}$, $Re = ${sci(F.Re, 2)}$.\n`
            + `**Model** (scale ${fx(scale.value, 3)}, chord ${fx(cm, 3)} m) at ${fx(pS.value, 1)} atm, ${fx(TS.value, 0)} K: $a = ${fx(g.a, 0)}$ m/s, $V = ${fx(Vt, 0)}$ m/s, $M = ${fx(MS.value, 2)}$, $Re = ${sci(Rt, 2)}$ — Mach ${okM ? 'matches' : 'differs'} (ratio ${fx(rM, 2)}), Reynolds ${okR ? 'matches' : 'is too low'} (ratio ${fx(rR, 3)}).\n`
            + `${okM && okR ? '**Both numbers match: the model flow is similar to the full-size flow.**' : `To match $Re$ at this Mach number and temperature the tunnel would need $p = ${sg(pN, 3)}$ atm${pN > 9 ? ' (beyond the 9 atm assumed here)' : ''}.`}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 1.5
    {
      num: '1.5',
      kind: 'Method',
      name: 'Airspeed measurement: indicated and true airspeed',
      statement: String.raw`A **pitot-static probe** senses the total pressure $p_t$ at its nose (where the flow is brought to rest) and the static pressure $p$ at flush side ports; the difference is the **impact pressure** $q_c = p_t - p$. The airspeed indicator converts $q_c$ to a speed assuming standard sea-level air, which defines the **calibrated airspeed**
$$q_c = p_0\Bigl[\bigl(1 + \tfrac{\gamma-1}{2}(V_C/a_0)^2\bigr)^{\gamma/(\gamma-1)} - 1\Bigr]$$
(subsonic form). In flight $q_c = p\bigl[(1+\tfrac{\gamma-1}{2}M^2)^{\gamma/(\gamma-1)}-1\bigr]$, so the same indicated speed at altitude, where $p$ and $a$ are lower, means a larger **true airspeed** $V_T = M a$. At low speed $V_T \approx V_E/\sqrt\sigma$ with the **equivalent airspeed** $V_E$ and density ratio $\sigma = \rho/\rho_0$.`,
      idea: String.raw`Bernoulli's equation along the stagnation streamline gives $p_t = p + \tfrac12\rho V^2$ at low speed; at higher Mach number the isentropic stagnation relation (and, above $M = 1$, the normal shock in front of the probe, the Rayleigh formula) replaces it. The instrument is only a pressure gauge, calibrated once against sea level, so it reads $q_c$, not speed. Aerodynamic loads and stall depend on $q = \tfrac12\rho V^2$, which is what equivalent and indicated airspeed track; navigation needs $V_T$, which requires the density (altitude and temperature) from the standard atmosphere.`,
      caption: String.raw`Left: the same pitot probe at sea level and at the chosen altitude, both flying at the same indicated (calibrated) airspeed. The manometer reads the same impact pressure, but the arrows show that the true speed at altitude is much greater. Right: for the chosen indicated speed, true, equivalent and calibrated airspeed against altitude, with the Mach 0.78 line of a jet airliner; drag the gold handle to climb. Where the constant-CAS climb meets the Mach line is the crossover altitude at which pilots switch from an indicated speed to a Mach number.`,
      deps: ['fluid-2.11', 'aero-1.1'],
      refs: ['Anderson ch. 4'],
      tags: ['pitot tube', 'airspeed'],
      scope: String.raw`Ideal probe in a uniform flow: no position or instrument error, no humidity, standard atmosphere. Calibrated airspeed is the indicated speed corrected for instrument and position error; here they coincide.`,
      viz(v) {
        const cas = v.slider('indicated (calibrated) airspeed (kt)', 60, 500, 280, { step: 1 });
        const alt = v.slider('altitude (km)', 0, 20, 10.7, { step: 0.1 });
        const A = v.stage({ x: [0, 21], y: [0, 9.2], equal: true, axes: false, height: 340, full: true });
        const B = v.stage({ x: [0, 900], y: [0, 20], axes: 'box', gutter: true, height: 380, minWidth: 300, xlabel: 'airspeed (kt)', ylabel: 'altitude (km)', title: 'one indicated speed, many true speeds' });
        const H = B.handle(300, 10.7, { color: 'gold', r: 8, constrain: (x, y) => { const z = clamp(y, 0, 20); return [tasFromCas(cas.value * KT, z * 1000) / KT, z]; } });
        let sync = false; H.onDrag = () => { if (sync) return; sync = true; alt.set(Math.round(H.y * 10) / 10); sync = false; };
        const flight = (casKt, zkm) => {
          const a = atmo(zkm * 1000), qc = impactPressure(casKt * KT / A0, P0), M = machFromQc(qc, a.p), V = M * a.a;
          return { a, qc, M, V, pt: a.p + qc, eas: V * Math.sqrt(a.sigma), q: 0.5 * a.rho * V * V };
        };
        const crossover = (casKt, mach) => { let lo = 0, hi = 30; for (let i = 0; i < 50; i++) { const z = (lo + hi) / 2; if (flight(casKt, z).M < mach) lo = z; else hi = z; } return (lo + hi) / 2; };
        const qcMax = impactPressure(500 * KT / A0, P0);
        const cell = (cx, zkm, title) => {
          const F = flight(cas.value, zkm), k = 2.6 / qcMax;
          A.text(title, cx, 8.9, { size: 12.5, weight: 650, align: 'center', color: 'ink' });
          // flow arrows ∝ true airspeed
          const len = Math.max(0.25, F.V / KT / 900 * 4.6);
          for (const y of [6.2, 7.0, 7.8]) A.arrow(cx - 3.8, y, cx - 3.8 + len, y, { color: 'muted', width: 1.6, head: 6 });
          A.text(`V = ${fx(F.V / KT, 0)} kt true`, cx - 3.8, 8.35, { size: 11, color: 'ink', align: 'left' });
          // probe body and nose
          A.rect(cx - 0.6, 6.6, cx + 3.2, 7.4, { fill: 'ink', fillAlpha: 0.18, color: 'ink', width: 1.6, radius: 6 });
          A.dot(cx - 0.6, 7.0, { r: 4, color: 'accent' }); A.text('p_t', cx - 0.62, 7.62, { size: 11, color: 'accent', align: 'center' });
          A.dot(cx + 1.2, 7.4, { r: 3.5, color: 'orange' }); A.text('p', cx + 1.2, 7.8, { size: 11, color: 'orange', align: 'center' });
          // U-tube
          const lx = cx + 0.2, rx = cx + 1.6, y0 = 2.3, top = 5.4, h = F.qc * k;
          A.line(lx - 0.18, y0, lx - 0.18, top, { color: 'muted', width: 1.4 }); A.line(lx + 0.18, y0, lx + 0.18, top, { color: 'muted', width: 1.4 });
          A.line(rx - 0.18, y0, rx - 0.18, top, { color: 'muted', width: 1.4 }); A.line(rx + 0.18, y0, rx + 0.18, top, { color: 'muted', width: 1.4 });
          A.line(lx - 0.18, y0, rx - 0.18, y0 - 0.0, { color: 'muted', width: 1.4 });
          const lvl = 3.9; // equilibrium level
          A.rect(lx - 0.17, y0, lx + 0.17, lvl - h / 2, { fill: 'accent', fillAlpha: 0.55, stroke: false }); A.rect(rx - 0.17, y0, rx + 0.17, lvl + h / 2, { fill: 'accent', fillAlpha: 0.55, stroke: false });
          A.rect(lx + 0.18, y0, rx - 0.18, y0 + 0.0, { fill: 'accent', fillAlpha: 0.55, stroke: false });
          A.line(lx, 5.4, lx, 6.6, { color: 'accent', width: 1.6 }); A.line(rx, 5.4, rx, 6.6, { color: 'orange', width: 1.6 }); A.line(lx, 6.6, cx, 7.0, { color: 'accent', width: 0 });
          A.measure(rx + 0.55, lvl - h / 2, rx + 0.55, lvl + h / 2, '');
          A.text(`q_c = ${fx(F.qc / 1000, 1)} kPa`, cx + 2.4, lvl, { size: 11, color: 'ink', align: 'left', baseline: 'middle' });
          A.text(`p = ${fx(F.a.p / 1000, 1)} kPa, p_t = ${fx(F.pt / 1000, 1)} kPa`, cx - 0.3, 1.5, { size: 11, color: 'muted', align: 'left' });
          A.text(`CAS ${fx(cas.value, 0)} kt · EAS ${fx(F.eas / KT, 0)} kt · M ${fx(F.M, 2)}`, cx - 0.3, 0.75, { size: 11, color: 'ink', align: 'left', weight: 600 });
        };
        v.render(() => {
          cell(4.6, 0, 'sea level'); cell(15,  alt.value, `${fx(alt.value, 1)} km (${fx(alt.value * 1000 / FT, 0)} ft)`);
          A.line(10.5, 0.3, 10.5, 9, { color: 'grid', width: 1 });
          const cs = cas.value, zs = []; for (let k = 0; k <= 80; k++) zs.push(20 * k / 80);
          B.curve((t) => [flight(cs, t).V / KT, t], 0, 20, { n: 120, color: 'accent', width: 2.6 });
          B.curve((t) => [flight(cs, t).eas / KT, t], 0, 20, { n: 120, color: 'green', width: 2, dash: true });
          B.vline(cs, { color: 'orange', width: 2 });
          B.curve((t) => [0.78 * atmo(t * 1000).a / KT, t], 0, 20, { n: 120, color: 'red', width: 1.6, dash: true });
          B.curve((t) => [atmo(t * 1000).a / KT, t], 0, 20, { n: 120, color: 'muted', width: 1.2, dash: true });
          const zx = crossover(cs, 0.78);
          if (zx < 20) B.dot(flight(cs, zx).V / KT, zx, { r: 5, color: 'red', label: `crossover ${fx(zx, 1)} km`, labelPos: 'w' });
          B.hline(alt.value, { color: 'gold', alpha: 0.5 });
          sync = true; H.set(flight(cs, alt.value).V / KT, alt.value); sync = false;
          B.text('speed of sound', 690, 1.6, { color: 'muted', size: 10.5, align: 'left' });
          v.legend([['accent', 'true airspeed'], ['green', 'equivalent airspeed', { dash: true }], ['orange', 'calibrated (indicated) airspeed'], ['red', 'Mach 0.78', { dash: true }]]);
        });
        v.readout(() => {
          const F = flight(cas.value, alt.value), G = flight(cas.value, 0), z = crossover(cas.value, 0.78);
          return `At ${fx(alt.value, 1)} km: $\\sigma = ${fx(F.a.sigma, 3)}$, $p = ${fx(F.a.p / 100, 1)}$ hPa, $a = ${fx(F.a.a, 1)}$ m/s. Impact pressure $q_c = ${fx(F.qc, 0)}$ Pa (the same as at sea level by construction). True airspeed $${fx(F.V / KT, 1)}$ kt, equivalent $${fx(F.eas / KT, 1)}$ kt, Mach $${fx(F.M, 3)}$; dynamic pressure $\\tfrac12\\rho V^2 = ${fx(F.q, 0)}$ Pa.\n`
            + `Check: $V_E/\\sqrt\\sigma = ${fx(F.eas / Math.sqrt(F.a.sigma) / KT, 1)}$ kt equals $V_T$. Sea level at the same indicated speed: true speed $${fx(G.V / KT, 1)}$ kt. Here CAS exceeds EAS by ${fx(cas.value - F.eas / KT, 1)} kt: compressibility, growing with Mach number. ${z < 20 ? `Crossover to Mach 0.78 at ${fx(z, 1)} km (${fx(z * 1000 / FT / 100, 0)} hundred feet).` : 'This indicated speed never reaches Mach 0.78 below 20 km.'}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 1.6
    {
      num: '1.6',
      kind: 'Definition',
      name: 'Speed of sound and Mach number',
      statement: String.raw`The **speed of sound** is the speed at which a small pressure disturbance travels through a gas; for an ideal gas it depends only on temperature,
$$a = \sqrt{\Bigl(\frac{\partial p}{\partial \rho}\Bigr)_s} = \sqrt{\gamma R T},$$
$340.29$ m/s at $15$ °C in air ($\gamma = 1.4$, $R = 287.05$ J/(kg K)). The **Mach number** of a flow at speed $V$ is $M = V/a$ with $a$ evaluated at the local air temperature. Flight is subsonic for $M<1$, supersonic for $M>1$; a source moving faster than sound outruns its own waves, which pile up on a cone of half-angle $\mu = \arcsin(1/M)$.`,
      idea: String.raw`A sound wave is a tiny, fast (hence adiabatic) and reversible (hence isentropic) compression, so $a^2 = \mathrm{d}p/\mathrm{d}\rho$ at constant entropy; with $p\propto\rho^\gamma$ this is $\gamma p/\rho = \gamma R T$. Since ISA temperature drops to $-56.5$ °C at 11 km, $a$ falls from 340 to 295 m/s: an airliner at a fixed true speed of 231 m/s is at Mach 0.68 at sea level but 0.78 at 35,000 ft. Mach number, not speed, governs compressibility effects, so it is the number that matters for shocks and drag rise (chapter 4).`,
      caption: String.raw`The source moves left to right; rings are the pressure pulses it emitted at equal time steps, drawn in the source's frame. Slide the speed past the speed of sound (red line on the sound-speed chart) and the rings stop running ahead of the source and pile into a Mach cone. Drag the gold handle on the sound-speed curve to change the air temperature, or use the lower chart to see how the Mach number of an aircraft at fixed true speed changes with altitude.`,
      deps: ['pchem-2.7', 'aero-1.1', 'fluid-9.11'],
      refs: ['Anderson ch. 4'],
      tags: ['speed of sound', 'Mach number'],
      scope: String.raw`Ideal gas with constant $\gamma = 1.4$: accurate to a fraction of a percent for air below about 1000 K; above that vibrational excitation lowers $\gamma$ (hypersonic flow, chapter 4).`,
      credit: 'Newton (1687, isothermal), Laplace (1816, adiabatic); Mach, 1887',
      viz(v) {
        const Tsl = v.slider('air temperature T (K)', 180, 400, 288.15, { step: 0.1 });
        const spd = v.slider('source speed V (m/s)', 0, 800, 231, { step: 1 });
        const preset = v.select('example', [{ value: 'c', label: 'custom' }, { value: 'a320', label: 'A320, M 0.78 at FL350' }, { value: 'sr', label: 'SR-71, M 3.2 at 85,000 ft' }, { value: 'c172', label: 'Cessna 172, 124 kt at 8,500 ft' }], 'c', { onChange: () => { const p = { a320: [10.668, 0.78], sr: [25.908, 3.2], c172: [2.59, null] }[preset.value]; if (!p) return; const a = atmo(p[0] * 1000); zS.set(p[0]); Tsl.set(a.T); spd.set(Math.round(p[1] ? p[1] * a.a : 124 * KT)); } });
        const zS = v.slider('altitude for the Mach chart (km)', 0, 28, 10.7, { step: 0.1 });
        const cone = v.toggle('draw the Mach cone', true);
        const A = v.stage({ x: [-2300, 700], y: [-780, 780], equal: true, axes: false, height: 360, full: true });
        const B = v.stage({ x: [180, 400], y: [0, 820], axes: 'box', gutter: true, height: 300, minWidth: 280, xlabel: 'temperature T (K)', ylabel: 'speed of sound a (m/s)', title: 'a = √(γRT)' });
        const C = v.stage({ x: [0, 3.6], y: [0, 28], axes: 'box', gutter: true, height: 300, minWidth: 280, xlabel: 'Mach number V/a at the standard-atmosphere a', ylabel: 'altitude (km)', title: 'fixed true speed, rising altitude' });
        const aT = (T) => Math.sqrt(GAMMA * R_STD * T);
        const hT = B.handle(288.15, aT(288.15), { color: 'gold', r: 8, constrain: (x) => { const T = clamp(x, 180, 400); return [T, aT(T)]; } });
        let sync = false; hT.onDrag = () => { if (sync) return; sync = true; Tsl.set(Math.round(hT.x * 10) / 10); sync = false; };
        const hz = C.handle(0.7, 10.7, { color: 'gold', r: 8, constrain: (x, y) => { const z = clamp(y, 0, 28); return [spd.value / atmo(z * 1000).a, z]; } });
        hz.onDrag = () => { if (sync) return; sync = true; zS.set(Math.round(hz.y * 10) / 10); sync = false; };
        const DT = 0.5; // s between pulses
        v.animate((t) => {
          const a = aT(Tsl.value), V = spd.value, ph = t % DT;
          A.hline(0, { color: 'grid', width: 1 });
          for (let j = 0; j < 14; j++) {
            const age = j * DT + ph, r = a * age;
            if (r > 2600) break;
            A.circle(-V * age, 0, r, { color: j === 0 ? 'gold' : 'accent', width: 1.4, alpha: Math.max(0.25, 1 - age / 7) });
          }
          const M = V / a;
          if (cone.value && M > 1) { const mu = Math.asin(1 / M), L = 2400; A.line(0, 0, -L * Math.cos(mu), L * Math.sin(mu), { color: 'red', width: 2 }); A.line(0, 0, -L * Math.cos(mu), -L * Math.sin(mu), { color: 'red', width: 2 }); A.text(`μ = ${fx(mu / DEG, 1)}°`, -360, 130 + 300 * Math.tan(mu) / 4, { color: 'red', size: 12, align: 'center' }); }
          A.dot(0, 0, { r: 7, color: 'ink' }); A.arrow(30, 0, 30 + Math.min(500, V * 0.55) , 0, { color: 'ink', width: 2.2, head: 8 });
          A.text(`M = ${fx(M, 2)}`, 40, 60, { color: 'ink', size: 14, weight: 650 });
          B.fn(aT, { color: 'accent', width: 2.4, domain: [180, 400] });
          B.dot(216.65, aT(216.65), { r: 4, color: 'ink', label: '−56.5 °C: 295.1 m/s', labelPos: 'se' }); B.dot(288.15, aT(288.15), { r: 4, color: 'ink', label: '15 °C: 340.3 m/s', labelPos: 'ne' });
          B.hline(V, { color: 'red', dash: true, width: 1.3 }); B.text('source speed V', 184, V + 18, { color: 'red', size: 10.5, align: 'left' });
          sync = true; hT.set(Tsl.value, aT(Tsl.value)); sync = false;
          C.curve((z) => [V / atmo(z * 1000).a, z], 0, 28, { n: 140, color: 'accent', width: 2.4 });
          C.vline(1, { color: 'red', width: 1.6, dash: true }); C.vband(1, 3.6, { color: 'red', alpha: 0.05 });
          C.text('supersonic', 1.05, 1.5, { color: 'red', size: 10.5, align: 'left' }); C.text('subsonic', 0.95, 1.5, { color: 'muted', size: 10.5, align: 'right' });
          sync = true; hz.set(V / atmo(zS.value * 1000).a, zS.value); sync = false;
          v.legend([['accent', 'pulses emitted every 0.5 s'], ['gold', 'newest pulse'], ['red', 'Mach cone', { dash: true }]]);
        }, { period: DT, still: 0.2 });
        v.readout(() => {
          const a = aT(Tsl.value), V = spd.value, M = V / a, at = atmo(zS.value * 1000), Mz = V / at.a;
          return `$T = ${fx(Tsl.value, 1)}$ K ($${fx(Tsl.value - 273.15, 1)}$ °C): $a = \\sqrt{\\gamma R T} = ${fx(a, 2)}$ m/s (the standard 340.29 m/s at 15 °C: $${fx(aT(288.15), 2)}$). Molecular speeds are comparable: $v_{\\mathrm{rms}} = \\sqrt{3RT} = ${fx(Math.sqrt(3 * R_STD * Tsl.value), 0)}$ m/s, and $a/v_{\\mathrm{rms}} = \\sqrt{\\gamma/3} = ${fx(Math.sqrt(GAMMA / 3), 3)}$.\n`
            + `Source: $V = ${fx(V, 0)}$ m/s $= ${fx(V / KT, 0)}$ kt, $M = ${fx(M, 3)}$${M > 1 ? `, Mach angle $\\mu = ${fx(Math.asin(1 / M) / DEG, 1)}^\\circ$` : ' (subsonic: the pulses run ahead of the source, bunching only slightly)'}. At ${fx(zS.value, 1)} km in ISA ($T = ${fx(at.T, 1)}$ K, $a = ${fx(at.a, 1)}$ m/s) the same $V$ is $M = ${fx(Mz, 3)}$; at sea level it would be $M = ${fx(V / A0, 3)}$.`;
        });
      },
    },
  ],
};
