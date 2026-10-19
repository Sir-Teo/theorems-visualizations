// Atmosphere & Ocean Dynamics — Chapter 4: Ekman layers (items 4.5–4.7; 4.1–4.4 are in ch04.js)
import { clamp, TAU, RAD, RHO_W, fOf, betaOf, ekmanSolve, ekmanSpiral } from './ch04.shared.js';

import { finiteEkman } from './geo-source-audit.js';

const cabs = (re, im) => Math.hypot(re, im);

export default {
  collection: 'geo',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.5
    {
      num: '4.5', kind: 'Phenomenon', name: 'Spin-down of a rotating fluid',
      statement: String.raw`Stir a fluid that fills a container rotating at angular velocity $\Omega$, so that it moves relative to the container with small angular velocity $\omega_0\ll\Omega$ (small Rossby number). The relative motion does not decay by viscous diffusion across the container, which would take $R^2/\nu$; it decays exponentially on the much shorter **Ekman spin-down time**
$$\tau_E\sim\frac{H}{\sqrt{\nu\Omega}}=\Omega^{-1}E^{-1/2},\qquad E=\frac{\nu}{\Omega H^{2}},$$
(up to a factor of order one depending on how many walls are rigid: here $\tau_E=H/(2\sqrt{\nu\Omega})$ for two rigid lids), because the thin Ekman layers on the lids act as pumps. For $n$ rigid horizontal boundaries the leading-order decay rate is $n\sqrt{\nu\Omega}/H$ ($n=1$ for a stress-free top and $n=2$ for two rigid lids). The number of rotation periods therefore scales as $E^{-1/2}/(2\pi n)$; the secondary circulation carries particles in the bottom boundary layer towards the axis.`,
      idea: String.raw`In the interior the flow is geostrophic and, by the Taylor–Proudman theorem (2.7), does not vary along the axis, so it cannot slow down by itself. Only the thin Ekman layers on the lids can exert friction. The interior swirl $V=\omega r$ drives a cross-flow in each layer toward lower pressure with transport $V\delta_E/2$, $\delta_E=\sqrt{2\nu/f}$, $f=2\Omega$; its convergence is the pumping velocity $w_E=\delta_E\zeta/2$ of 4.3. Squeezing or stretching the interior columns changes their relative vorticity at the rate $f\,\partial_zw$. For two rigid lids $w(0)=+w_E$ and $w(H)=-w_E$, so $\dot\zeta=f\partial_zw=-2fw_E/H=-2\sqrt{\nu\Omega}\,\zeta/H$. With a stress-free top $w(H)=0$, halving the decay rate. Both rigid-lid boundary layers flow inward; the interior flows radially outward and its vertical motion points away from each lid. The fluid spins down not by diffusion of momentum but by being circulated through the boundary layer.`,
      caption: String.raw`Press play and watch the **top view** of a rotating tank, drawn in the frame turning with it: gold dots are idealized particles just above the floor, grey dots track only the interior angular displacement (their outward drift is omitted). The interior swirl decays; the particles also drift inward. They sample the height of maximum inward Ekman velocity, $z=\pi\delta_E/4$, where radial and azimuthal speeds are approximately $-0.3224$ and $0.6776$ times the interior swirl; particles on the no-slip floor itself would have zero velocity. The **side view** shows the Ekman circulation (inflow along each rigid lid, vertical motion away from the lids, and radial outflow in the interior) with arrows that fade as the swirl dies. The right plot compares $e^{-t/\tau_E}$ with the diffusive decay on the scale $R^2/\nu$. Change the viscosity, depth, rotation rate, lids and initial Rossby number $\epsilon=\omega_0/\Omega$. Linear theory: valid for $\epsilon\ll1$ (the picture is not a Navier–Stokes simulation).`,
      deps: ['geo-4.3', 'geo-2.7'],
      refs: ['Vallis', 'Oruba, Soward & Dormy (2017), §1.1 and Appendix A; https://arxiv.org/abs/1611.06511'],
      tags: ['spin-down', 'Ekman layer', 'rotating tank'],
      scope: String.raw`Small Rossby number, $E\ll1$, a container with rigid lids (or a lid and a free surface), a cylinder of radius $R\gg\delta_E$ and a homogeneous fluid. The time scale quoted here is the linear one; Greenspan & Howard (1963) give the full theory including the side-wall layer and the nonlinear spin-up.`,
      credit: 'H. P. Greenspan & L. N. Howard, 1963 (J. Fluid Mech. 17: 385–404)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Tea_leaf_paradox' },
      viz(v) {
        const R = 0.1; // m
        const nu = v.slider('viscosity $\\nu$ (m²/s)', 3e-7, 1e-4, 1e-6, { log: true, sig: 2, fmt: (x) => x.toExponential(1) });
        const Hc = v.slider('fluid depth $H$ (cm)', 3, 20, 8, { step: 0.5 });
        const Om = v.slider('rotation rate $\\Omega$ (rad/s)', 0.5, 8, 3, { step: 0.1 });
        const eps = v.slider('initial Rossby number $\\epsilon$', 0.02, 0.5, 0.1, { step: 0.01 });
        const lid = v.select('lids', [{ value: 2, label: 'two rigid lids' }, { value: 1, label: 'free top surface' }], 2);
        const sT = v.stage({ x: [-R * 100, R * 100], y: [-R * 100, R * 100], equal: true, axes: false, height: 330, weight: 1, minWidth: 260, title: 'top view in the rotating frame (cm)' });
        const sS = v.stage({ x: [0, 11], y: [-1.5, 22], axes: 'box', gutter: true, xlabel: 'radius (cm)', ylabel: 'height (cm)', height: 330, weight: 1, minWidth: 260, title: 'side view: Ekman circulation' });
        const sD = v.stage({ x: [0, 1], y: [1e-3, 1.2], ylog: true, axes: 'box', gutter: true, xlabel: 'time (s)', ylabel: 'swirl $\\omega/\\omega_0$', height: 330, weight: 1, minWidth: 260, title: 'decay of the swirl' });
        v.legend([['gold', 'particles in the floor layer'], ['muted', 'interior tracers'], ['accent', '$e^{-t/\\tau_E}$'], ['red', 'diffusion on $R^2/\\nu$', { dash: true }]]);
        const rg = v.rng(7), N = 90;
        const leaves = Array.from({ length: N }, () => [Math.sqrt(rg()) * 0.97 * R * 100, rg() * TAU]);
        const tracers = Array.from({ length: 50 }, () => [Math.sqrt(rg()) * 0.97 * R * 100, rg() * TAU]);
        let st = {};
        v.animate((t) => {
          const H = Hc.value / 100, W = Om.value;
          const tE = lid.value === 2 ? H / (2 * Math.sqrt(nu.value * W)) : H / Math.sqrt(nu.value * W), tD = R * R / nu.value;
          const tp = t * tE / 3, dec = Math.exp(-tp / tE), Theta = eps.value * W * tE * (1 - dec); // angle turned relative to the container
          const contr = Math.exp(-0.3224 * Theta);
          sT.circle(0, 0, R * 100, { color: 'ink', width: 2, fill: 'blue', fillAlpha: 0.05 });
          for (const [r, a] of tracers) { const th = a + Theta; sT.dot(r * Math.cos(th), r * Math.sin(th), { r: 2.6, color: 'muted' }); }
          for (const [r, a] of leaves) { const th = a + 0.6776 * Theta, rr = r * contr; sT.dot(rr * Math.cos(th), rr * Math.sin(th), { r: 3.4, color: 'gold' }); }
          sT.text('rotation $\\Omega$ (anticlockwise)', 0, -R * 100 * 1.02, { size: 11, color: 'muted', align: 'center' });
          // side view
          const Hcm = Hc.value; sS.setView([0, 11], [-2.5, Math.max(22, Hcm + 3)]);
          sS.rect(0, 0, R * 100, Hcm, { color: 'ink', width: 2, fill: 'blue', fillAlpha: 0.06 });
          sS.rect(0, -0.9, R * 100, 0, { fill: 'muted', fillAlpha: 0.5, stroke: false });
          if (lid.value === 2) sS.rect(0, Hcm, R * 100, Hcm + 0.9, { fill: 'muted', fillAlpha: 0.5, stroke: false });
          const k = dec * Math.min(1.5, Math.sqrt(eps.value / 0.1)), len = 2 * k;
          for (const r of [3, 5, 7, 9]) {
            sS.arrow(r + len / 2, 0.6, r - len / 2, 0.6, { color: 'ink', width: 2, head: 5 });
            if (lid.value === 2) sS.arrow(r + len / 2, Hcm - 0.6, r - len / 2, Hcm - 0.6, { color: 'ink', width: 2, head: 5 });
            sS.arrow(r - len / 2, Hcm / 2, r + len / 2, Hcm / 2, { color: 'orange', width: 2, head: 5 });
          }
          for (const r of [1.5, 4, 6.5, 9]) {
            const dz = Hcm * 0.22 * k;
            sS.arrow(r, Hcm * 0.2, r, Hcm * 0.2 + dz, { color: 'accent', width: 2, head: 5 });
            if (lid.value === 2) sS.arrow(r, Hcm * 0.8, r, Hcm * 0.8 - dz, { color: 'accent', width: 2, head: 5 });
          }
          sS.text('floor layer: inflow', 5.5, -0.9, { size: 11, color: 'muted', align: 'center', dy: 12 });
          sS.text(lid.value === 2 ? 'lid layer: inflow' : 'stress-free surface', 5.5, Hcm + 1.2, { size: 11, color: 'muted', align: 'center' });
          sS.text('interior: radial outflow', 5.5, Hcm * 0.5, { size: 11, color: 'orange', align: 'center', dy: 14 });
          // decay plot
          const Tmax = 6 * tE;
          sD.setView([0, Tmax], [1e-3, 1.2]);
          sD.fn((x) => Math.exp(-x / tE), { color: 'accent', width: 2.6, n: 200 });
          sD.fn((x) => Math.exp(-x / tD), { color: 'red', width: 2, dash: true, n: 50 });
          sD.vline(tp, { color: 'gold', width: 1.6 });
          sD.dot(tp, Math.max(dec, 1.2e-3), { r: 5, color: 'gold' });
          st = { tE, tD, E: nu.value / (W * H * H), per: TAU / W, tp, dec, Theta, contr, Ro: eps.value };
        }, { period: 15, still: 6 });
        v.readout(() => `$E=\\nu/\\Omega H^2=${v.sci(st.E, 2)}$; spin-down time $\\tau_E=${v.fix(st.tE, 1)}$ s $=${v.fix(st.tE / st.per, 1)}$ rotation periods; viscous diffusion time $R^2/\\nu=${v.fix(st.tD, 0)}$ s, i.e. **${v.fix(st.tD / st.tE, 0)} times slower**.\nAt $t=${v.fix(st.tp, 1)}$ s the swirl is ${v.fix(100 * st.dec, 0)}% of its start; the turn so far is ${v.fix(st.Theta, 2)} rad, and the leaves have contracted to ${v.fix(100 * st.contr, 0)}% of their initial radius.`);
      },
    },

    // ------------------------------------------------------------------ 4.6
    {
      num: '4.6', kind: 'Phenomenon', name: 'Equatorial upwelling',
      statement: String.raw`Easterly trade winds along the equator ($\tau_x<0$) drive a surface Ekman transport that is poleward on both sides, because $f=\beta y$ changes sign: to the right of the wind in the north, to the left in the south. The two flows diverge at the equator, and water is drawn up from the thermocline there, cooling the sea surface in a narrow tongue. Since $\tau/\rho f\to\infty$ as $f\to0$, the Ekman balance must be modified near the equator: with a linear drag $r$ in the layer, $\mathbf M=\bigl(r\tau_x,\,-f\tau_x\bigr)/\bigl[\rho(r^2+f^2)\bigr]$, which stays finite, and the upwelling velocity at the base of the layer is
$$w=\partial_yM_y=-\frac{\beta\tau_x}{\rho}\,\frac{r^{2}-f^{2}}{(r^2+f^2)^2},$$
largest at the equator, positive for $|y|<r/\beta\,(\text{width}\sim 2^{\circ}\text{–}3^\circ)$ and weakly negative (downwelling) on the flanks.`,
      idea: String.raw`Away from the equator this is just the Ekman transport of 4.2, $M_y=-\tau_x/\rho f$, which is poleward on both sides and grows without limit toward $y=0$: its divergence is the upwelling. To get a finite answer one has to keep the term that Ekman's balance drops, here a Rayleigh drag $-r\mathbf u$ that takes over where $|f|<r$ (within $r/\beta$ of the equator). The transport then peaks at $|f|=r$ and the equator is a line of divergence of strength $\beta\tau_x/\rho r^2$. In the real equatorial ocean a zonal pressure gradient (a tilted thermocline) balances most of the wind stress and equatorial waves (6.2) set the structure; the linear-drag model captures only the Ekman part of it.`,
      caption: String.raw`**Left:** a north–south cross-section of the surface layer. Surface arrows show the meridional transport (poleward on both sides), upward arrows at the layer base show the upwelling, and the thermocline (black) is raised at the equator and depressed on the flanks by (upwelling rate)$\times$(time) — press play for a 20-day sequence; this linear rise is a toy, since waves would adjust it. **Middle:** the meridional transport: the red dashed curve is the plain Ekman formula $-\tau_x/\rho f$, which blows up at the equator; the blue curve includes drag with the damping time you choose. **Right:** the upwelling velocity. Make the wind weaker, the damping shorter (broader, weaker tongue) or longer. The drag time is an assumed model parameter, not a measurement.`,
      deps: ['geo-4.2', 'geo-2.4'],
      refs: ['Vallis'],
      tags: ['equatorial upwelling', 'beta plane', 'Ekman transport'],
      scope: String.raw`A linear, steady, x-independent surface layer with Rayleigh drag, ignoring the zonal pressure gradient and equatorial waves; the real equatorial upwelling is shaped by these as well, and the numbers here (drag time, layer depth) are illustrative.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Upwelling#Equatorial_upwelling' },
      viz(v) {
        const tau = v.slider('trade-wind stress $|\\tau_x|$ (N/m²)', 0.01, 0.12, 0.05, { step: 0.005 });
        const days = v.slider('drag time $1/r$ (days)', 0.5, 10, 2, { step: 0.1 });
        const hE = 50, BETA = 2.28e-11;
        const sS = v.stage({ x: [-1800, 1800], y: [-140, 12], axes: 'box', gutter: true, xlabel: 'latitude north of equator (km; 111 km = 1°)', ylabel: 'depth (m)', height: 340, weight: 1.35, minWidth: 320, title: 'surface layer and thermocline' });
        const sM = v.stage({ x: [-1800, 1800], y: [0, 10], axes: 'box', gutter: true, xlabel: 'y (km)', ylabel: '$M_y$ (m²/s)', height: 340, weight: 1, minWidth: 250, title: 'meridional Ekman transport' });
        const sW = v.stage({ x: [-1800, 1800], y: [-1, 4], axes: 'box', gutter: true, xlabel: 'y (km)', ylabel: '$w$ (m/day)', height: 340, weight: 1, minWidth: 250, title: 'upwelling velocity at the layer base' });
        v.legend([['red', 'plain Ekman $\\tau/\\rho f$', { dash: true }], ['accent', 'with drag'], ['orange', '$w$']]);
        let st = {};
        v.animate((t) => {
          const r = 1 / (days.value * 86400), T = -tau.value; // easterly
          const f = (y) => BETA * y * 1e3;
          const My = (y) => -f(y) * T / (RHO_W * (r * r + f(y) ** 2));
          const MyPlain = (y) => -T / (RHO_W * f(y));
          const w = (y) => -(BETA * T / RHO_W) * (r * r - f(y) ** 2) / (r * r + f(y) ** 2) ** 2 * 86400; // m/day
          const tt = Math.min(t / 12, 1) * 20; // days
          const w0 = w(0);
          const mpk = My(r / BETA / 1e3);
          // side view
          sS.setView([-1800, 1800], [-140, 12]);
          const th = (y) => -100 + clamp(w(y) * tt, -30, 45);
          sS.rect(-1800, -hE, 1800, 0, { fill: 'accent', fillAlpha: 0.1, stroke: false });
          sS.hline(0, { color: 'muted' });
          sS.path(Array.from({ length: 241 }, (_, k) => { const y = -1800 + 15 * k; return [y, th(y)]; }), { color: 'ink', width: 2.6 });
          const sc = 280 / Math.max(mpk, 1e-9) * 0.9;
          for (const y of [-1500, -1100, -750, -450, 450, 750, 1100, 1500]) {
            const m = My(y); sS.arrow(y - m * sc / 2 * 0 , -hE / 2, y + m * sc * 0.5 / 1, -hE / 2, { color: 'accent', width: 2.2, head: 6 });
          }
          for (const y of [-900, -450, -150, 0, 150, 450, 900]) {
            const wv = w(y); if (Math.abs(wv) < 0.05) continue;
            const L = clamp(wv * 7, -28, 28); sS.arrow(y, -hE - 4, y, -hE - 4 + L, { color: 'orange', width: 2.2, head: 6 });
          }
          sS.text('easterly trades blow toward the west', 0, 7, { size: 11, color: 'muted', align: 'center' });
          // transport
          const ymax = Math.max(1.2 * mpk, 1);
          sM.setView([-1800, 1800], [-ymax, ymax]);
          sM.hline(0, { color: 'grid' }); sM.vline(0, { color: 'grid' });
          sM.fn((y) => clamp(MyPlain(y), -ymax * 1.5, ymax * 1.5), { color: 'red', width: 2, dash: true, n: 400 });
          sM.fn(My, { color: 'accent', width: 2.8, n: 300 });
          sM.vline(r / BETA / 1e3, { color: 'muted', width: 1, dash: [3, 4] }); sM.vline(-r / BETA / 1e3, { color: 'muted', width: 1, dash: [3, 4] });
          // w
          const wm = Math.max(w0, 0.3);
          sW.setView([-1800, 1800], [-0.45 * wm, 1.15 * wm]);
          sW.hline(0, { color: 'muted' });
          sW.fn(w, { color: 'orange', width: 2.8, n: 300, fill: true, base: 0 });
          sW.vline(r / BETA / 1e3, { color: 'muted', width: 1, dash: [3, 4] });
          // net check: integral of w from -Y to Y = 2 M_y(Y) (days)
          const Y = 1200; let I = 0; const nn = 800; for (let i = 0; i < nn; i++) { const y = -Y + (i + 0.5) * 2 * Y / nn; I += w(y) * 2 * Y * 1e3 / nn; }
          st = { w0, mpk, width: r / BETA / 1e3, I: I / 86400, J: 2 * My(Y), tt, plain: MyPlain(300), damp: My(300) };
        }, { period: 16, still: 11 });
        v.readout(() => `Peak transport ${v.fix(st.mpk, 2)} m²/s at $|y|=r/\\beta=${v.fix(st.width, 0)}$ km (${v.fix(st.width / 111, 1)}°); equatorial upwelling **${v.fix(st.w0, 2)} m/day** ($\\beta|\\tau_x|/\\rho r^2$). At 300 km: plain Ekman ${v.fix(st.plain, 2)} vs with drag ${v.fix(st.damp, 2)} m²/s.\nCheck: $\\int_{-1200}^{1200}w\\,dy=${v.fix(st.I, 3)}$ m²/s $=2M_y(1200\\ \\mathrm{km})=${v.fix(st.J, 3)}$ m²/s. Elapsed ${v.fix(st.tt, 0)} days.`);
      },
    },

    // ------------------------------------------------------------------ 4.7
    {
      num: '4.7', kind: 'Paper', name: 'On the influence of the earth’s rotation on ocean-currents',
      paper: { authors: 'V. Walfrid Ekman', year: 1905, title: 'On the influence of the earth’s rotation on ocean-currents', venue: 'Arkiv för Matematik, Astronomi och Fysik 2 (11): 1–52', url: 'https://empslocal.ex.ac.uk/people/staff/gv219/classics.d/Ekman05.pdf' },
      introduces: ['geo-4.1', 'geo-4.2'],
      credit: 'V. W. Ekman, 1905',
      statement: String.raw`Ekman asked why drifting sea ice and surface water do not move along the wind but to the right of it (in the northern hemisphere), as Fridtjof Nansen had noticed on the *Fram* expedition. He showed, for a steady wind over a deep ocean of uniform turbulent (eddy) viscosity on a rotating Earth, that the current at the surface runs $45^\circ$ to the right of the wind, that it turns clockwise (viewed from above) and weakens with depth in a spiral, that it points against the surface current at the depth $D=\pi\sqrt{2A/|f|}$ where it is only about 4% as large, and that the **net transport** of the whole wind-driven layer is perpendicular to the wind (to the right, $\tau/\rho f$ per unit width) — independent of the value of the viscosity.`,
      idea: String.raw`Ekman explicitly reports Nansen's ice-drift deflection of 20°–40° on p. 2. His §1 assumes horizontally uniform steady motion, constant density and viscosity, and no horizontal pressure gradient. The infinite-depth solution is Eq. (5), p. 7; depth and integrated transport follow in Eqs. (6)–(7), p. 9. He also solves a finite uniform-depth sea with a rigid no-slip bottom: pp. 12–14, Eqs. (8)–(9). Bottom stress changes the integrated balance, so finite-depth transport need not be perpendicular. Its magnitude can exceed the infinite-depth value, and its direction can even have a small component against the wind. The surface angle oscillates slightly around 45° as depth increases; it is not monotone.`,
      caption: String.raw`This reconstruction evaluates the analytic constant-viscosity boundary-value solution, not points digitized from the paper. **Left:** wind direction (orange), current spiral (blue, normalized by the largest current speed) and transport (green, length $0.75|f\mathbf M|$ for unit kinematic wind stress). The two vector types use different normalizations. The grey wedge is Nansen's **ice** observation as reported by Ekman, not a water-current calibration. **Right:** surface angle for a no-slip bottom versus $h/D$. Small depths approach zero deflection; the deep-water limit is 45°. The finite-depth transport angle and magnitude are computed without capping. Change depth, viscosity and latitude; the latter two set the dimensional depth scale.`,
      deps: ['geo-2.1', 'fluid-6.4', 'geo-4.1', 'geo-4.2'],
      refs: [],
      tags: ['Ekman', 'history', 'spiral'],
      scope: String.raw`Constant viscosity, density and Coriolis parameter; steady horizontally uniform flow. With complex velocity $w=u+iv$, upward coordinate $z\in[-h,0]$ and unit kinematic stress, $Aw''=ifw$, $w(-h)=0$, $Aw'(0)=1$. Thus $w=\sinh(k(z+h))/(Ak\cosh kh)$ and $M=(1-\mathrm{sech}\,kh)/(if)$, $k=(1+i)\sqrt{f/(2A)}$. Only $h/D\to\infty$ removes bottom stress exactly. The linked scan contains all pp. 1–14 used here; printed pp. 48–49 are missing, so no claims from that later friction discussion are made.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Ekman_spiral' },
      verify: false,
      viz(v) {
        const A = v.slider('eddy viscosity $A$ (m²/s)', 0.02, 0.4, 0.1, { step: 0.005 });
        const lat = v.slider('latitude (°)', 20, 80, 70, { step: 1 });
        const rat = v.slider('depth ratio $h/D$', 0.1, 3, 3, { step: 0.05 });
        const sP = v.stage({ x: [-1.25, 1.25], y: [-1.25, 1.25], equal: true, axes: true, height: 360, weight: 1, minWidth: 280, title: 'plan view: wind, current, transport' });
        const sC = v.stage({ x: [0, 3.15], y: [0, 60], axes: 'box', gutter: true, xlabel: 'water depth / Ekman depth, $h/D$', ylabel: 'deflection of the surface current (°)', height: 360, weight: 1, minWidth: 280, title: 'surface deflection vs water depth' });
        v.legend([['orange', 'wind'], ['accent', 'current spiral'], ['green', 'transport'], ['muted', 'Nansen band (ice)'], ['red', '45° (deep water)', { dash: true }]]);
        // dimensionless curve: unit viscosity scale, any f
        const f1 = 1e-4, A1 = 0.1, d1 = Math.sqrt(2 * A1 / f1), D1 = Math.PI * d1;
        const curve = [];
        for (let k = 0; k <= 60; k++) { const rr = 0.05 + k * (3.05 - 0.05) / 60, s = finiteEkman(A1, f1, rr * D1); curve.push([rr, -Math.atan2(s.surf[1], s.surf[0]) / RAD]); }
        let st = {};
        v.render(() => {
          const f = fOf(lat.value), d = Math.sqrt(2 * A.value / f), D = Math.PI * d, h = rat.value * D;
          const sol = finiteEkman(A.value, f, h);
          const ang = -Math.atan2(sol.surf[1], sol.surf[0]) / RAD;
          const Tn = [sol.T[0] * f, sol.T[1] * f], mag = cabs(Tn[0], Tn[1]), tang = -Math.atan2(Tn[1], Tn[0]) / RAD;
          let mx = 0; for (let j = 0; j < sol.re.length; j++) mx = Math.max(mx, cabs(sol.re[j], sol.im[j]));
          const nrm = (re, im) => [re / mx, im / mx];
          sP.hline(0, { color: 'grid' }); sP.vline(0, { color: 'grid' });
          // Nansen wedge 20-40 deg to the right of the wind (+x): angles -20..-40 deg
          const wedge = [[0, 0]]; for (let a = 20; a <= 40; a += 2) wedge.push([0.95 * Math.cos(-a * RAD), 0.95 * Math.sin(-a * RAD)]);
          sP.poly(wedge, { fill: 'muted', fillAlpha: 0.25, stroke: false });
          sP.arrow(0, 0, 0.95, 0, { color: 'orange', width: 3.2 });
          sP.text('wind', 0.5, 0.08, { size: 12, color: 'orange', align: 'center' });
          sP.path(sol.re.map((_, j) => nrm(sol.re[j], sol.im[j])), { color: 'accent', width: 2.2 });
          const p0 = nrm(sol.surf[0], sol.surf[1]);
          sP.arrow(0, 0, p0[0] * 0.95, p0[1] * 0.95, { color: 'accent', width: 3 });
          const tl = mag * 0.75, ta = -tang * RAD;
          sP.arrow(0, 0, tl * Math.cos(ta), tl * Math.sin(ta), { color: 'green', width: 3.4 });
          sP.text('transport', 0.04, tl * Math.sin(ta) * 0.5, { size: 11, color: 'green', align: 'left' });
          // curve
          sC.hline(45, { color: 'red', width: 1.6, dash: true });
          sC.hband(20, 40, { color: 'muted', alpha: 0.2 });
          sC.path(curve, { color: 'accent', width: 2.8 });
          sC.dot(rat.value, ang, { r: 6, color: 'gold' });
          sC.text('Ekman 1905: 45°', 2.95, 46.5, { size: 11, color: 'red', align: 'right' });
          sC.text('Nansen: 20–40° (ice)', 2.0, 30, { size: 11, color: 'muted', align: 'center' });
          st = { D, h, ang, mag, tang, d };
        });
        v.readout(() => `Ekman depth $D=\\pi\\sqrt{2A/f}=${v.fix(st.D, 1)}$ m; water depth ${v.fix(st.h, 1)} m. Surface angle **${v.fix(st.ang, 3)}°** right of wind; transport angle ${v.fix(st.tang, 3)}°, magnitude ${v.fix(st.mag, 5)} $\\tau/(\\rho f)$.\nInfinite-depth limits: surface 45°, transport 90° with normalized magnitude 1. At finite depth the bottom supplies stress; neither transport limit is imposed on the computation.`);
      },
    },
  ],
};
