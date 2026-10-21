// Climate Science — Chapter 2 (part b): radiative transfer, emission height, CO₂ forcing, saturation, line broadening
import { SIG, NU, NN, GRID, planckNu, brightT, standardT, opticalDepths, longwave, emissionLevels, heights, zAtP, humidity, KAPPA_ADIABAT, RD, G0, PS } from './ch02.shared.js';

const fx = (v, x, d = 1) => v.fix(x, d);
const idxOf = (nu) => Math.round((nu - 10) / 5);
/** Temperature profile with lapse rate `gam` K/km (can be zero or negative), floored at `tmin` when gam > 0 */
function profile(Ts, gam, tmin = 216.65) {
  const k = KAPPA_ADIABAT(gam);
  return GRID.pm.map((p) => { const t = Ts * (p / PS) ** k; return gam > 0 ? Math.max(tmin, t) : Math.min(380, t); });
}
const co2Mem = new Map();
/** OLR spectrum etc. for a given column description, memoised on a key */
function column(key, build) { if (!co2Mem.has(key)) { if (co2Mem.size > 300) co2Mem.clear(); co2Mem.set(key, build()); } return co2Mem.get(key); }
function olrFor(T, Ts, o) { return longwave(T, Ts, opticalDepths(T, { ...o, q: o.q || humidity(T) }), { spec: !!o.spec }); }

// forcing curve for 2.8 / 2.9 (OLR against CO₂ at 288 K, fixed profile and humidity), computed once
let FC = null;
function forcingCurve() {
  if (FC) return FC;
  const T = standardT(288), q = humidity(T), pts = [];
  for (let i = 0; i <= 36; i++) { const c = 10 * 10 ** ((i / 36) * Math.log10(5000 / 10)); pts.push([c, longwave(T, 288, opticalDepths(T, { co2: c, q }), {}).olr]); }
  const ref = longwave(T, 288, opticalDepths(T, { co2: 280, q }), {}).olr;
  return (FC = { pts, ref, T, q });
}

export default {
  collection: 'climate',
  chapter: 2,
  items: [
    // ───────────────────────────────────────────────────────────── 2.6
    {
      num: '2.6',
      kind: 'Law',
      name: 'Schwarzschild’s equation of radiative transfer',
      credit: 'Karl Schwarzschild, 1906',
      statement: String.raw`For radiation of wavenumber $\nu$ travelling along a path in a gas in local thermodynamic equilibrium that absorbs and emits but does not scatter, the intensity changes at the rate
$$\frac{dI_\nu}{d\tau_\nu} = -\,I_\nu + B_\nu\big(T\big),$$
where $\tau_\nu$ is the optical depth along the path (2.5) and $B_\nu(T)$ the Planck function (1.1) at the local temperature: the beam is **absorbed** at the rate $I_\nu$ and **replenished** by emission at the rate $B_\nu$, so it relaxes toward the local blackbody value. Integrated from the ground to space,
$$\begin{gathered}
I_\nu(\infty)=B_\nu(T_s)\,e^{-\tau_0}\\
 +\int_0^{\tau_0} B_\nu\big(T(\tau)\big)\,e^{-(\tau_0-\tau)}\,d\tau .
\end{gathered}$$
If the temperature is the same everywhere ($T = T_s$) the answer is simply $B_\nu(T_s)$ at every wavenumber — the atmosphere has no effect on the outgoing radiation, however opaque it is.`,
      scope: String.raw`Plane-parallel, non-scattering, local thermodynamic equilibrium (valid below about 60 km); in the thermal infrared scattering by cloud droplets and aerosols must be added. Here the diffusivity approximation (a slant factor 1.66) turns the angular integral into a single flux.`,
      idea: String.raw`Kirchhoff's law (1.4) says that the gas emits as much as it absorbs at the same wavenumber when it is at the same temperature as the radiation field, so a thin slab pushes the beam toward $B_\nu(T)$: absorbing a fraction $d\tau$ of $I_\nu$ and emitting $B_\nu\,d\tau$. Solving the linear equation (Beer–Lambert, 2.5) gives the integral. The greenhouse effect is the statement that $B_\nu(T)$ is smaller in the cold upper air than at the ground; with no temperature drop there is nothing to trap. Use optical depth accumulated along the ray as the path coordinate. For a continuous source B on a finite optical interval, multiplying $I\prime+I=B$ by $e^\tau$ is the integrating-factor construction of ode 1.4. It gives $I(\tau_0)=I(0)e^{-\tau_0}+\int_0^{\tau_0}B(s)e^{-(\tau_0-s)}\,ds$. With the surface boundary and local thermal source this is the stated formal solution; it retains the no-scattering and local-equilibrium hypotheses.`,
      caption: String.raw`Choose a wavenumber. Left: the temperature of the air (orange) and the brightness temperature of the upward radiation (blue) as the beam climbs layer by layer: in an opaque wavenumber the blue curve follows the orange one, in a window it stays at the surface value. Middle: the spectrum computed by integrating the equation at every wavenumber. Right: the greenhouse effect against the lapse rate $\Gamma$ — drag $\Gamma$ to zero (an isothermal atmosphere) and it vanishes; make it negative (an inversion) and gases cool the planet instead.`,
      deps: ['climate-2.5', 'climate-1.4', 'ode-1.4'],
      refs: ['Pierrehumbert'],
      tags: ['radiative transfer', 'greenhouse'],
      viz(v) {
        const nuS = v.slider('wavenumber $\\nu$ (cm⁻¹)', 200, 1500, 667, { step: 5 });
        const gam = v.slider('lapse rate $\\Gamma$ (K/km)', -4, 10, 6.5, { step: 0.1 });
        const co2 = v.slider('CO₂ (ppm)', 20, 2000, 420, { log: true, sig: 2 });
        const sA = v.stage({ x: [180, 330], y: [0, 40], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 250, xlabel: 'temperature (K)', ylabel: 'height (km)', title: 'one wavenumber, built up layer by layer' });
        const sB = v.stage({ x: [200, 1500], y: [180, 300], axes: 'box', gutter: true, height: 340, weight: 1.3, minWidth: 280, xlabel: 'wavenumber (cm⁻¹)', ylabel: 'brightness T (K)', title: 'spectrum from the integral' });
        const sC = v.stage({ x: [-4, 10], y: [-80, 200], axes: 'box', gutter: true, height: 340, weight: 0.9, minWidth: 250, xlabel: 'lapse rate Γ (K/km)', ylabel: 'greenhouse effect (W/m²)', title: 'no temperature drop, no greenhouse' });
        const Ts = 288;
        const G = (g, c) => column(`g${g.toFixed(1)}|${c.toFixed(0)}`, () => { const T = profile(Ts, g); const L = olrFor(T, Ts, { co2: c, spec: true }); return { L, T, G: L.up[0] - L.olr }; });
        const pick = sB.handle(667, 250, { color: 'gold', r: 6, constrain: (x) => [Math.max(200, Math.min(1500, x)), 252] });
        pick.onDrag = () => { nuS.set(Math.round(pick.x / 5) * 5); };
        let R = null;
        v.render(() => {
          const g = gam.value, c = co2.value, nu = nuS.value, { L, T, G: Gm } = G(g, c);
          pick.set(nu, 252);
          const n = idxOf(nu), tau = opticalDepths(T, { co2: c, q: humidity(T) });
          // layer-by-layer upward radiance at this wavenumber
          const z = heights(T), Tb = [brightT(nu, planckNu(nu, Ts))], zz = [0];
          let I = planckNu(nu, Ts);
          for (let i = 0; i < GRID.N; i++) { const t = Math.exp(-1.66 * tau[i][n]); I = I * t + planckNu(nu, T[i]) * (1 - t); Tb.push(brightT(nu, I)); zz.push(z[i]); }
          const zmax = 40;
          sA.path(T.map((t, i) => [t, z[i]]), { color: 'orange', width: 6, alpha: 0.55 });
          sA.dot(Ts, 0, { color: 'red', r: 5, label: 'surface', labelPos: 'ne' });
          sA.path(Tb.map((t, i) => [t, zz[i]]), { color: 'accent', width: 2.8 });
          sA.dot(Tb[Tb.length - 1], zz[zz.length - 1], { color: 'green', r: 6, label: 'to space', labelPos: 'w' });
          sA.hline(zmax, { color: 'faint' });
          // spectrum
          sB.hline(Ts, { color: 'red', dash: [5, 4], width: 1.2 });
          sB.path(NU.map((m, i) => [m, brightT(m, L.olrSpec[i])]).filter((p) => p[0] >= 200 && p[0] <= 1500 && p[1] > 0), { color: 'accent', width: 2.2 });
          sB.vline(nu, { color: 'gold', width: 1.2, alpha: 0.7 });
          // greenhouse vs lapse
          const gs = []; for (let k = -4; k <= 10.01; k += 1) gs.push([k, G(k, c).G]);
          sC.hline(0, { color: 'faint', width: 1.2 }); sC.vline(0, { color: 'faint', dash: [3, 3] });
          sC.path(gs, { color: 'accent', width: 2.6 });
          sC.dot(g, Gm, { color: 'gold', r: 7, label: `${fx(v, Gm, 0)} W/m²`, labelPos: 'nw' });
          sC.text('inversion: gases cool', 0.4, -60, { size: 11, color: 'muted', align: 'left' });
          R = { nu, g, c, Gm, olr: L.olr, up0: L.up[0], tbTop: Tb[Tb.length - 1], tbAir: T[GRID.N - 1] };
        });
        v.legend([['orange', 'air temperature $T(z)$'], ['accent', 'brightness temperature of the upward beam'], ['red', 'surface', { dash: true }]]);
        v.readout(() => R && String.raw`$\nu$ = ${R.nu} cm⁻¹: the beam leaves the ground at 288 K and reaches space at brightness temperature **${fx(v, R.tbTop, 1)} K** · $\Gamma$ = ${fx(v, R.g, 1)} K/km: OLR = ${fx(v, R.olr, 1)} W/m² against the surface's ${fx(v, R.up0, 1)} W/m² (same band), greenhouse effect **${fx(v, R.Gm, 1)} W/m²**${Math.abs(R.g) < 0.06 ? ' — an isothermal atmosphere leaves $I_\\nu = B_\\nu(T_s)$ at every wavenumber, so the effect is exactly zero' : ''}`);
      },
    },
    // ───────────────────────────────────────────────────────────── 2.7
    {
      num: '2.7',
      kind: 'Principle',
      name: 'Emission height and the lapse-rate greenhouse mechanism',
      statement: String.raw`Seen from space, the planet radiates at the temperature of the air at its **effective emission height** $z_e$ (about 5 km for Earth), where $T(z_e) = T_e$ and $\mathrm{OLR} = \sigma T_e^4$. The surface is warmer than $T_e$ only because the temperature rises toward the ground at the lapse rate $\Gamma$:
$$T_s \approx T_e + \Gamma\,z_e .$$
Adding greenhouse gas makes the atmosphere more opaque, which raises $z_e$ to a colder level; the outgoing radiation falls below the absorbed sunlight by the forcing $F$. To restore balance the emission temperature must return to $T_e$, which, with the lapse rate fixed by convection, means the **whole troposphere and the surface warm** together: $\Delta T_s \approx \Gamma\,\Delta z_e$ in a model with no feedbacks.`,
      scope: String.raw`Clear-sky column with a fixed lapse rate of 6.5 K/km and a fixed tropopause temperature; "effective emission height" is a single height standing for a whole spectrum of emission levels (2.4, 2.5). With fixed relative humidity the water vapour feedback is included.`,
      idea: String.raw`Radiative balance only fixes the temperature *at the emission level*, $T_e$ (1.6, 2.6). Convection fixes how fast temperature rises downward from there (the lapse rate, geo-1.2). The surface temperature is the sum. A more opaque atmosphere raises the emission level, and since the air up there is colder than $T_e$ the planet radiates less; the only way back to balance is to warm the whole column until the (now higher) emission level is again at $T_e$.`,
      caption: String.raw`Left: the temperature profile with the effective emission height marked (where the air equals the temperature that matches the OLR). Raise CO₂ and watch the emission height climb and OLR fall; press *restore balance* to warm the column until OLR returns to its reference value. Right: OLR against surface temperature for the reference and the current CO₂: the horizontal shift between the curves is the warming needed.`,
      deps: ['climate-2.6', 'geo-1.2'],
      refs: ['Archer ch. 5', 'Pierrehumbert'],
      tags: ['emission height', 'lapse rate', 'greenhouse'],
      viz(v) {
        const co2 = v.slider('CO₂ (ppm)', 100, 2000, 280, { log: true, sig: 3 });
        const Tsl = v.slider('surface temperature (K)', 275, 310, 288, { step: 0.1 });
        const wv = v.toggle('water vapour follows temperature (fixed relative humidity)', true);
        const sA = v.stage({ x: [190, 310], y: [0, 30], axes: 'box', gutter: true, height: 380, weight: 1, minWidth: 270, xlabel: 'temperature (K)', ylabel: 'height (km)', title: 'temperature profile and emission height' });
        const sB = v.stage({ x: [275, 310], y: [215, 280], axes: 'box', gutter: true, height: 380, weight: 1, minWidth: 270, xlabel: 'surface temperature (K)', ylabel: 'OLR (W/m²)', title: 'OLR against surface temperature' });
        const T288 = standardT(288), q288 = humidity(T288);
        const olr = (c, Ts, fixedW) => column(`o${c.toFixed(1)}|${Ts.toFixed(2)}|${fixedW}`, () => { const T = standardT(Ts); return longwave(T, Ts, opticalDepths(T, { co2: c, q: fixedW ? q288 : humidity(T) }), {}).olr; });
        const OREF = olr(280, 288, false);
        const curve = (c, fixedW) => { const a = []; for (let t = 275; t <= 310.01; t += 2.5) a.push([t, olr(c, t, fixedW)]); return a; };
        const btn = v.button('restore balance', () => { const c = co2.value, fw = !wv.value; let lo = 270, hi = 330; for (let i = 0; i < 24; i++) { const m = (lo + hi) / 2; if (olr(c, m, fw) < OREF) lo = m; else hi = m; } Tsl.set(Math.round(((lo + hi) / 2) * 10) / 10); });
        void btn;
        let R = null;
        v.render(() => {
          const c = co2.value, Ts = Tsl.value, fw = !wv.value, T = standardT(Ts), o = olr(c, Ts, fw);
          const Te = (o / SIG) ** 0.25;
          const Tr = standardT(288), oR = OREF, TeR = (oR / SIG) ** 0.25;
          // effective emission height = height where T(z) = (OLR/σ)^{1/4}; computed from the profile, scaled to the broadband flux
          const zof = (prof, Tt) => { const z = heights(prof); let ze = null; for (let i = 0; i < prof.length - 1; i++) if ((prof[i] - Tt) * (prof[i + 1] - Tt) <= 0) { ze = z[i] + ((prof[i] - Tt) / (prof[i] - prof[i + 1])) * (z[i + 1] - z[i]); break; } return ze ?? 0; };
          const TeB = (olr(c, Ts, fw) / (SIG * 1)) ** 0.25, ze = zof(T, TeB), zeR = zof(Tr, TeR);
          const z = heights(T), zR = heights(Tr);
          sA.path(Tr.map((t, i) => [t, zR[i]]), { color: 'muted', width: 1.8, dash: [5, 4] });
          sA.path(T.map((t, i) => [t, z[i]]), { color: 'accent', width: 2.8 });
          sA.vline(TeR, { color: 'muted', width: 1, dash: [2, 4] });
          sA.hline(zeR, { color: 'muted', width: 1.2, dash: [5, 4] }); sA.dot(TeR, zeR, { color: 'muted', r: 5, hollow: true });
          sA.hline(ze, { color: 'orange', width: 1.8 }); sA.dot(TeB, ze, { color: 'orange', r: 6.5, label: `$z_e$ = ${fx(v, ze, 1)} km`, labelPos: 'e' });
          sA.text(`reference (280 ppm, 288 K): $z_e$ = ${fx(v, zeR, 1)} km`, 192, zeR, { size: 11, color: 'muted', align: 'left', baseline: 'top', dy: 4 });
          sA.dot(Ts, 0, { color: 'red', r: 5, label: `${fx(v, Ts, 1)} K`, labelPos: 'ne' });
          // OLR vs Ts
          sB.hline(OREF, { color: 'green', width: 1.6, dash: [6, 4] }); sB.text('absorbed sunlight ≙ reference OLR', 275.5, OREF, { size: 11, color: 'green', align: 'left', baseline: 'bottom', dy: -3 });
          sB.path(curve(280, false), { color: 'muted', width: 2, dash: [5, 4] });
          sB.path(curve(c, fw), { color: 'accent', width: 2.8 });
          sB.dot(Ts, o, { color: 'orange', r: 7 });
          sB.line(Ts, o, Ts, OREF, { color: o < OREF ? 'red' : 'green', width: 2.5 });
          R = { c, Ts, o, Te: TeB, ze, zeR, F: OREF - olr(c, 288, false) , dev: OREF - o };
        });
        v.legend([['muted', '280 ppm, 288 K (reference)', { dash: true }], ['accent', 'current CO₂'], ['orange', 'effective emission height', { dot: true }], ['green', 'balance', { dash: true }]]);
        v.readout(() => R && String.raw`CO₂ = ${fx(v, R.c, 0)} ppm, $T_s$ = ${fx(v, R.Ts, 1)} K: OLR = **${fx(v, R.o, 1)} W/m²**, ${R.dev > 0.05 ? `**${fx(v, R.dev, 1)} W/m² below** the reference — the planet gains heat` : R.dev < -0.05 ? `${fx(v, -R.dev, 1)} W/m² above the reference — it loses heat` : 'balanced'} · emission temperature ${fx(v, R.Te, 1)} K at $z_e$ = **${fx(v, R.ze, 2)} km** (reference ${fx(v, R.zeR, 2)} km) · $T_s \approx T_e + \Gamma z_e$ = ${fx(v, R.Te + 6.5 * R.ze, 1)} K · instantaneous forcing of the current CO₂ at 288 K: ${fx(v, R.F, 2)} W/m²`);
      },
    },
    // ───────────────────────────────────────────────────────────── 2.8
    {
      num: '2.8',
      kind: 'Law',
      name: 'Logarithmic dependence of CO₂ forcing',
      credit: 'Arrhenius, 1896 (the geometric-arithmetic rule); Myhre et al., 1998 (the fitted coefficient 5.35)',
      statement: String.raw`The change in outgoing radiation caused by a change of CO₂ concentration from $C_0$ to $C$ is, over the range of concentrations of interest (roughly 100 to 2000 ppm),
$$\Delta F \;\approx\; 5.35\,\ln\!\frac{C}{C_0}\ \ \mathrm{W\,m^{-2}},$$
so every doubling adds the same $5.35\ln 2 \approx 3.7$ W/m² (including stratospheric adjustment). The effect of increasing CO₂ by equal *factors* is the same, not by equal *amounts*: $\Delta F$ is linear in $\log C$. At very low concentrations the forcing grows like $\sqrt{C}$ and at very high ones faster than logarithmic.`,
      scope: String.raw`Valid for CO₂ between about 100 and 2000 ppm at modern temperatures and water vapour; the coefficient is the stratosphere-adjusted value for a global mean. The column here has no stratospheric adjustment, so its instantaneous top-of-atmosphere value is smaller (about 3 W/m² per doubling).`,
      idea: String.raw`The centre of the 15 µm band is already opaque, so more gas changes nothing there (2.9); what changes is the **wings**. The absorption coefficient falls off roughly exponentially away from the band centre, $\kappa(\nu) \propto e^{-|\nu-\nu_0|/w}$, so the width of the opaque region (where $\kappa\,u \gtrsim 1$) grows by $w\ln(C'/C)$ on each side when the path $u$ grows by $C'/C$ (2.5). Each doubling widens the opaque band by the same $2w\ln 2$, and each widening removes the same amount of radiation emitted in the neighbourhood. In the stated exponential-wing approximation, write optical depth as $KC\exp[-|\nu-\nu_0|/w]$ with positive K,C,w. Wherever an opaque core exists, solving optical depth one uses the inverse logarithm in pma 8.6 and gives half-width $w\ln(KC)$. The logarithm-of-product rule makes its change $w\ln(C\prime/C)$, equal for equal concentration factors. This explains that toy wing scaling, not the assessed forcing coefficient or its validity outside the stated concentration regime.`,
      caption: String.raw`Top: the outgoing spectrum for the reference (280 ppm) and the current concentration; the shaded difference lies in the *wings* of the 15 µm band. Bottom left: forcing against concentration on a logarithmic axis, with the straight line $5.35\ln(C/C_0)$ scaled to this column; drag the handle (or the slider). Bottom right: the increment from each successive doubling — nearly constant in the middle, smaller at the start ($\sqrt C$ regime).`,
      deps: ['climate-2.4', 'climate-2.6', 'pma-8.6'],
      refs: ['Archer ch. 4', 'IPCC AR6 WG1 ch. 7'],
      tags: ['radiative forcing', 'CO₂', 'saturation'],
      viz(v) {
        const co2 = v.slider('CO₂ (ppm)', 10, 5000, 560, { log: true, sig: 3 });
        const axis = v.select('forcing axis', [{ value: 'log', label: 'logarithmic' }, { value: 'lin', label: 'linear' }], 'log');
        const sA = v.stage({ x: [550, 800], y: [0, 0.4], axes: 'box', gutter: true, height: 270, full: true, xlabel: 'wavenumber (cm⁻¹)', ylabel: 'OLR (W m⁻² per cm⁻¹)', title: 'the wings of the 15 µm band' });
        const sB = v.stage({ x: [10, 5000], y: [-2, 24], xlog: true, axes: 'box', gutter: true, height: 320, weight: 1.15, minWidth: 280, xlabel: 'CO₂ (ppm)', ylabel: 'ΔF = OLR(280) − OLR(C)  (W/m²)', title: 'forcing against concentration' });
        const sC = v.stage({ x: [0, 10], y: [0, 5], axes: 'box', gutter: true, height: 320, weight: 0.85, minWidth: 250, xlabel: 'doubling starting from 10 ppm', ylabel: 'added forcing (W/m²)', title: 'forcing added by each doubling' });
        const fc = forcingCurve();
        const T = fc.T, q = fc.q;
        const spec = (c) => column(`s${c.toFixed(0)}`, () => longwave(T, 288, opticalDepths(T, { co2: c, q }), { spec: true }).olrSpec);
        const F = (c) => { const k = column(`F${c.toFixed(1)}`, () => fc.ref - longwave(T, 288, opticalDepths(T, { co2: c, q }), {}).olr); return k; };
        const handle = sB.handle(560, 0, { color: 'gold', r: 7, constrain: (x) => { const c = Math.max(10, Math.min(5000, x)); return [c, F(c)]; } });
        handle.onDrag = () => co2.set(Math.round(handle.x));
        const Fd = [10, 20, 40, 80, 160, 320, 640, 1280, 2560, 5120].map((c) => F(c));
        const incr = []; for (let i = 0; i < 9; i++) incr.push(Fd[i + 1] - Fd[i]);
        const fit = (() => { // least squares of F against ln(C/280) over 100–2000 ppm
          let sxx = 0, sxy = 0; for (const [c, o] of fc.pts) if (c >= 100 && c <= 2000) { const x = Math.log(c / 280), y = fc.ref - o; sxx += x * x; sxy += x * y; } return sxy / sxx; })();
        let R = null;
        v.render(() => {
          const c = co2.value, s0 = spec(280), s1 = spec(c);
          sA.path(NU.map((m, i) => [m, s0[i]]).filter((p) => p[0] >= 550 && p[0] <= 800), { color: 'muted', width: 2, dash: [5, 4] });
          sA.path(NU.map((m, i) => [m, s1[i]]).filter((p) => p[0] >= 550 && p[0] <= 800), { color: 'accent', width: 2.6 });
          sA.between((nu) => s1[idxOf(nu)], (nu) => s0[idxOf(nu)], 555, 795, { fill: c > 280 ? 'red' : 'green', fillAlpha: 0.3 });
          // forcing curve
          const lin = axis.value === 'lin';
          sB.setScale({ xlog: !lin, x: lin ? [0, 2000] : [10, 5000] });
          sB.hline(0, { color: 'faint' });
          sB.path(fc.pts.map(([cc, o]) => [cc, fc.ref - o]), { color: 'accent', width: 2.6 });
          sB.fn((x) => fit * Math.log(x / 280), { domain: lin ? [20, 2000] : [10, 5000], color: 'green', dash: [6, 4], width: 1.8 });
          sB.vline(280, { color: 'faint', dash: [3, 3] });
          handle.set(c, F(c));
          // doublings
          incr.forEach((d, i) => sC.rect(i + 0.15, 0, i + 0.85, d, { fill: i === Math.floor(Math.log2(c / 10)) ? 'gold' : 'accent', fillAlpha: 0.6, stroke: false }));
          sC.hline(fit * Math.LN2, { color: 'green', dash: [6, 4], width: 1.6 });
          sC.text(`log law: ${fx(v, fit * Math.LN2, 2)}`, 0.1, fit * Math.LN2, { color: 'green', size: 11.5, align: 'left', baseline: 'top', dy: 5 });
          { const k = Math.min(8, Math.max(0, Math.floor(Math.log2(c / 10)))); sC.text(`${10 * 2 ** k} → ${20 * 2 ** k} ppm`, k + 0.5, incr[k], { size: 11, color: 'ink', align: 'center', baseline: 'bottom', dy: -5, weight: 600 }); }
          R = { c, F: F(c), mid: (F(1120) - F(560)), per: fit * Math.LN2 };
        });
        v.legend([['muted', '280 ppm spectrum', { dash: true }], ['accent', 'current'], ['green', 'log law fit', { dash: true }]]);
        v.readout(() => R && String.raw`$C$ = ${fx(v, R.c, 0)} ppm: $\Delta F$ = **${fx(v, R.F, 2)} W/m²** relative to 280 ppm, log-law prediction ${fx(v, fit * Math.log(R.c / 280), 2)} W/m² · fitted coefficient ${fx(v, fit, 2)} $\ln(C/C_0)$ ⇒ **${fx(v, R.per, 2)} W/m² per doubling** (instantaneous at the top of the atmosphere; Myhre et al.: 5.35 ln C/C₀ = 3.71 after stratospheric adjustment) · 560 → 1120 ppm: ${fx(v, R.mid, 2)} W/m²`);
      },
    },
    // ───────────────────────────────────────────────────────────── 2.9
    {
      num: '2.9',
      kind: 'Paradox',
      name: 'The “CO₂ is saturated” argument',
      credit: 'Knut Ångström, 1900 (objection); Plass, 1956 and Möller, 1963 (resolution)',
      statement: String.raw`**The argument.** In the centre of the 15 µm band the lowest few tens of metres of air already absorb essentially all the infrared radiation (a laboratory tube of that length is opaque there), so adding more CO₂ cannot absorb more: the effect of CO₂ is "saturated". **The resolution.** Greenhouse warming does not depend on how much of the surface radiation the *near-surface* air absorbs, but on how much radiation escapes to space, which is controlled by the temperature at the **emission height** where the overlying air becomes transparent (2.4, 2.7). More CO₂ raises that height, even in a band that is opaque from the ground up, and in the wings of the band the emission height rises into the cold troposphere. The effect is not saturated, only logarithmic (2.8).`,
      idea: String.raw`Absorption at the ground (Beer–Lambert, 2.5) and the loss of energy to space (Schwarzschild, 2.6) are different questions. Radiation emitted in the opaque core comes from the cold upper air, so it is already weak; adding gas moves the emission level to somewhat colder air still, and the flux falls a little (it is temperature-limited in the stratosphere, where the lapse rate is zero or negative, so the *core* barely changes). The wings are where the temperature drop between the emission levels is large, and they widen with every doubling.`,
      caption: String.raw`Top left: transmission of the lowest $L$ kilometres of air against wavenumber: the band centre is black after tens of metres, as Ångström said. Top right: the emission height at three wavenumbers against CO₂: all three keep rising. Bottom: where in the atmosphere does added CO₂ matter? Each bar is the OLR change from adding 10% to the CO₂ in that one layer of the column (per unit mass): the effect lives in the upper troposphere and lower stratosphere, not near the ground.`,
      deps: ['climate-2.8', 'climate-2.7'],
      refs: ['Archer ch. 4'],
      tags: ['paradox', 'saturation', 'CO₂'],
      viz(v) {
        const co2 = v.slider('CO₂ (ppm)', 50, 3000, 420, { log: true, sig: 3 });
        const L = v.slider('tube length from the ground $L$ (km)', 0.01, 20, 0.1, { log: true, sig: 2 });
        const sA = v.stage({ x: [560, 800], y: [0, 1.05], axes: 'box', gutter: true, height: 300, weight: 1, minWidth: 270, xlabel: 'wavenumber (cm⁻¹)', ylabel: 'transmission', title: 'the first metres: opaque in the band centre' });
        const sB = v.stage({ x: [50, 3000], y: [0, 55], xlog: true, axes: 'box', gutter: true, height: 300, weight: 1, minWidth: 270, xlabel: 'CO₂ (ppm)', ylabel: 'emission height (km)', title: 'seen from space the emission height keeps rising' });
        const sC = v.stage({ x: [0, 40], y: [-0.2, 1], axes: 'box', gutter: true, height: 280, full: true, xlabel: 'height of the layer (km)', ylabel: 'OLR change per unit mass (relative)', title: 'where does added CO₂ matter?' });
        const T = standardT(288), z = heights(T), q = humidity(T);
        const taus = (c) => column(`t${c.toFixed(0)}`, () => opticalDepths(T, { co2: c, q }));
        const zOf = (c, nu) => column(`ze${c.toFixed(0)}|${nu}`, () => zAtP(T, emissionLevels(taus(c))[idxOf(nu)]));
        const sens = (c) => column(`sens${c.toFixed(0)}`, () => {
          const tau1 = taus(c), tau0 = opticalDepths(T, { co2: 0, q }), base = longwave(T, 288, tau1, {}).olr, out = [];
          for (let i = 0; i < GRID.N; i++) {
            const mod = tau1.slice(); mod[i] = Float64Array.from(tau1[i], (x, n) => x + 0.1 * (x - tau0[i][n]));
            out.push((longwave(T, 288, mod, {}).olr - base) / (0.1 * GRID.dp[i]));
          }
          return out;
        });
        let R = null;
        v.render(() => {
          const c = co2.value, l = L.value, tau = taus(c);
          // transmission through the lowest l km (vertical, 1.66 slant)
          const acc = new Float64Array(NN); let zb = 0;
          for (let i = 0; i < GRID.N && zb < l; i++) {
            const zt = zb + ((RD * T[i]) / G0) * Math.log(GRID.e[i] / GRID.e[i + 1]) * 1e-3, f = Math.min(1, (l - zb) / (zt - zb));
            for (let n = 0; n < NN; n++) acc[n] += tau[i][n] * f;
            zb = zt;
          }
          sA.path(NU.map((m, i) => [m, Math.exp(-1.66 * acc[i])]).filter((p) => p[0] >= 560 && p[0] <= 800), { color: 'accent', width: 2.8 });
          sA.fn(() => 0, { color: 'faint' });
          sA.text(`lowest ${l < 1 ? fx(v, l * 1000, 0) + ' m' : fx(v, l, 1) + ' km'} of air`, 575, 0.97, { size: 12, color: 'accent', align: 'left', weight: 600 });
          sA.text('15 µm centre: opaque', 667, 0.12, { size: 11.5, color: 'ink', align: 'center' });
          // emission heights vs CO₂
          for (const [nu, col, lab] of [[667, 'purple', '667 (core)'], [700, 'orange', '700 (shoulder)'], [740, 'teal', '740 (wing)']]) {
            const pts = []; for (let i = 0; i <= 14; i++) { const cc = 50 * 60 ** (i / 14); pts.push([cc, zOf(cc, nu)]); }
            sB.path(pts, { color: col, width: 2.4 }); sB.dot(c, zOf(c, nu), { color: col, r: 6 });
            sB.text(lab, 3000, pts[pts.length - 1][1], { color: col, size: 11, align: 'right', baseline: 'bottom', dy: -4 });
          }
          sB.hline(11, { color: 'faint', dash: [4, 4] }); sB.text('tropopause', 55, 11, { color: 'muted', size: 10.5, align: 'left', baseline: 'bottom', dy: -2 });
          // sensitivity by layer
          const s = sens(c), smax = Math.max(...s.map(Math.abs)) || 1;
          s.forEach((d, i) => { const z0 = i ? z[i - 1] : 0, z1 = z[i]; sC.rect(z0 + 0.05, 0, Math.max(z0 + 0.15, z1 - 0.05), -d / smax, { fill: d < 0 ? 'red' : 'green', fillAlpha: 0.6, stroke: false }); });
          sC.hline(0, { color: 'faint' });
          sC.text('most of the effect: upper troposphere and lower stratosphere', 39, 0.88, { size: 11.5, color: 'muted', align: 'right' });
          const imax = s.reduce((b, x, i) => (Math.abs(x) > Math.abs(s[b]) ? i : b), 0);
          sC.text('ground layers', 0.5, -0.1, { size: 11, color: 'muted', align: 'left' });
          R = { c, l, tc: Math.exp(-1.66 * acc[idxOf(667)]), zc: zOf(c, 667), zw: zOf(c, 740), zmax: z[imax], low: Math.abs(s[0]) / smax };
        });
        v.legend([['red', 'adding CO₂ here lowers OLR']]);
        v.readout(() => R && String.raw`CO₂ = ${fx(v, R.c, 0)} ppm: transmission of the lowest ${R.l < 1 ? fx(v, R.l * 1000, 0) + ' m' : fx(v, R.l, 1) + ' km'} at 667 cm⁻¹ = **${R.tc < 0.001 ? '< 0.001' : fx(v, R.tc, 3)}** ("saturated") — yet the 667 cm⁻¹ emission height is ${fx(v, R.zc, 1)} km and the 740 cm⁻¹ one ${fx(v, R.zw, 1)} km, both rising with CO₂ · the largest effect per unit mass comes from the layer at ${fx(v, R.zmax, 1)} km; the ground layer has ${fx(v, 100 * R.low, 0)}% of that sensitivity`);
      },
    },
    // ───────────────────────────────────────────────────────────── 2.10
    {
      num: '2.10',
      kind: 'Phenomenon',
      name: 'Pressure broadening of absorption lines',
      statement: String.raw`Collisions interrupt the oscillation of an absorbing molecule, so each absorption line has a Lorentzian shape
$$\begin{aligned}
k(\nu)&=S\,\frac{\gamma/\pi}{(\nu-\nu_0)^2+\gamma^2},\\
\gamma&=\gamma_0\,\frac{p}{p_0}\Big(\frac{T_0}{T}\Big)^{n},
\end{aligned}$$
whose half-width $\gamma$ is proportional to the pressure, while the **line strength $S$** (the area under the line) does not change. At the ground $\gamma \approx 0.07$ cm⁻¹ for CO₂ lines separated by about 1.6 cm⁻¹; in the stratosphere (1–10 hPa) the width falls to the Doppler width, about $6\times10^{-4}$ cm⁻¹, and the gaps between lines open. For a given amount of gas, a broader line profile absorbs more of a band because less of the band lies in transparent gaps.`,
      scope: String.raw`A single band segment of 12 CO₂ lines (illustrative strengths, spacing 1.6 cm⁻¹), shown with a pseudo-Voigt profile (Lorentz plus Doppler). Real bands have thousands of lines of many gases, line mixing and wings that deviate from the Lorentz shape far from the centre.`,
      idea: String.raw`Absorption by a line is the sum over many independent collisions that each reset the phase of the molecular oscillator; the more frequent the collisions (the higher the pressure), the broader the line (quantum collision theory in the molecular-spectroscopy chapters). The integrated line strength depends only on the molecule, so pressure redistributes the same absorption over a wider range of wavenumbers. When a line is strong enough that its centre is saturated, spreading it into the gaps increases the band-average absorption (2.5). For a positive Lorentz width $\gamma$, an antiderivative of the displayed line profile is $(S/\pi)\arctan[(\nu-\nu_0)/\gamma]$. The fundamental theorem pma 6.21 evaluates every finite interval; extending the limits to both infinities gives area S independently of $\gamma$. This normalization is for the ideal unbounded Lorentz line, not a guarantee that a finite plotted band segment contains all of its wings.`,
      caption: String.raw`Top: the absorption coefficient (log scale) of the 12 lines at the chosen pressure. Middle: transmission $e^{-\tau(\nu)}$ for a fixed mean optical depth $\bar\tau$ — the same amount of gas — and the band-average absorption. Bottom: that average against pressure for $\bar\tau = 0.1,\ 1,\ 10$ (the dot is your setting). Lower the pressure and the lines separate and the gaps clear; switch off the pressure broadening and the Doppler width alone applies.`,
      deps: ['qchem-10.10', 'climate-2.4', 'pma-6.21'],
      refs: ['Pierrehumbert'],
      tags: ['spectroscopy', 'line broadening'],
      viz(v) {
        const pS = v.slider('pressure $p$ (hPa)', 1, 1013, 1013, { log: true, sig: 3 });
        const tauS = v.slider('mean optical depth of the band $\\bar\\tau$', 0.05, 30, 1, { log: true, sig: 2 });
        const Tk = v.slider('temperature (K)', 200, 300, 250, { step: 1 });
        const bro = v.toggle('pressure broadening', true);
        const sA = v.stage({ x: [659, 679], y: [1e-2, 1e3], ylog: true, axes: 'box', gutter: true, height: 250, full: true, xlabel: 'wavenumber (cm⁻¹)', ylabel: 'k(ν) / ⟨k⟩', title: 'absorption coefficient (relative to the band average)' });
        const sB = v.stage({ x: [659, 679], y: [0, 1.05], axes: 'box', gutter: true, height: 230, weight: 1.4, minWidth: 300, xlabel: 'wavenumber (cm⁻¹)', ylabel: 'transmission', title: 'transmission for the same amount of gas' });
        const sC = v.stage({ x: [1, 1013], y: [0, 1], xlog: true, axes: 'box', gutter: true, height: 230, weight: 0.9, minWidth: 250, xlabel: 'pressure (hPa)', ylabel: 'band-average absorption', title: 'absorption against pressure' });
        const nu0 = Array.from({ length: 12 }, (_, j) => 660 + 1.6 * j), S = nu0.map((_, j) => Math.exp(-(((j - 5.5) / 3.4) ** 2)));
        const lo = 659.2, hi = 678.4, nG = 1920, dn = (hi - lo) / nG;
        const grid = Array.from({ length: nG + 1 }, (_, i) => lo + i * dn);
        const profileK = (p, T, broad) => {
          const gam = 0.07 * (broad ? p / 1013 : 0) * (296 / T) ** 0.7, wD = 5.7e-4 * Math.sqrt(T / 250);
          const gL = Math.max(gam, 1e-9), fD = 2 * wD, fL = 2 * gL;
          const f = (fD ** 5 + 2.69269 * fD ** 4 * fL + 2.42843 * fD ** 3 * fL ** 2 + 4.47163 * fD ** 2 * fL ** 3 + 0.07842 * fD * fL ** 4 + fL ** 5) ** 0.2;
          const r = fL / f, eta = 1.36603 * r - 0.47719 * r * r + 0.11116 * r ** 3, w = f / 2;
          const k = grid.map((x) => { let s = 0; for (let j = 0; j < 12; j++) { const d = x - nu0[j]; s += S[j] * (eta * (w / Math.PI) / (d * d + w * w) + (1 - eta) * (Math.sqrt(Math.LN2 / Math.PI) / w) * Math.exp((-Math.LN2 * d * d) / (w * w))); } return s; });
          const m = k.reduce((a, b) => a + b, 0) / k.length;
          return k.map((x) => x / m);
        };
        const absorb = (shape, tb) => shape.reduce((a, x) => a + (1 - Math.exp(-tb * x)), 0) / shape.length;
        let R = null;
        const memo = new Map();
        const shape = (p, T, b) => { const k = `${p.toFixed(1)}|${T}|${b}`; if (!memo.has(k)) { if (memo.size > 60) memo.clear(); memo.set(k, profileK(p, T, b)); } return memo.get(k); };
        v.render(() => {
          const p = pS.value, T = Tk.value, tb = tauS.value, b = bro.value, sh = shape(p, T, b);
          sA.path(grid.map((x, i) => [x, Math.max(1e-3, sh[i])]), { color: 'accent', width: 1.8 });
          sA.hline(1, { color: 'faint', dash: [4, 4] }); sA.text('band average', 679, 1, { size: 10.5, color: 'muted', align: 'right', baseline: 'bottom', dy: -2 });
          const tr = sh.map((x) => Math.exp(-tb * x));
          sB.poly([[lo, 1], ...grid.map((x, i) => [x, tr[i]]), [hi, 1]], { fill: 'red', fillAlpha: 0.25, stroke: false });
          sB.path(grid.map((x, i) => [x, tr[i]]), { color: 'accent', width: 1.8 });
          const A = 1 - tr.reduce((a, x) => a + x, 0) / tr.length;
          sB.hline(1 - A, { color: 'orange', width: 1.8, dash: [6, 4] });
          sB.text(`mean transmission ${fx(v, 1 - A, 2)}`, 678.8, 1 - A, { color: 'orange', size: 11.5, align: 'right', baseline: 'bottom', dy: -3 });
          // A against p
          for (const [t2, col] of [[0.1, 'teal'], [1, 'purple'], [10, 'orange']]) {
            const pts = []; for (let i = 0; i <= 12; i++) { const pp = 10 ** ((i / 12) * Math.log10(1013)); pts.push([pp, absorb(shape(pp, T, b), t2)]); }
            sC.path(pts, { color: col, width: 2 }); sC.text(`$\\bar\\tau$=${t2}`, 1013, pts[12][1], { color: col, size: 11, align: 'right', baseline: 'bottom', dy: -3 });
          }
          sC.dot(p, A, { color: 'gold', r: 7 });
          R = { p, A, T, tb, gam: 0.07 * (b ? p / 1013 : 0) * (296 / T) ** 0.7, flat: 1 - Math.exp(-tb) };
        });
        v.legend([['red', 'absorbed fraction', { area: true }]]);
        v.readout(() => R && String.raw`$p$ = ${fx(v, R.p, 0)} hPa: Lorentz half-width $\gamma$ = **${R.gam > 0 ? fx(v, R.gam, 4) : '0'} cm⁻¹** (line spacing 1.6) · band-average absorption **${fx(v, R.A, 3)}** for $\bar\tau$ = ${fx(v, R.tb, 2)}; the maximum possible (lines smeared out flat) is $1-e^{-\bar\tau}$ = ${fx(v, R.flat, 3)}`);
      },
    },
  ],
};
