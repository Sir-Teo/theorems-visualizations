// Atmosphere & Ocean Dynamics — Chapter 4: Ekman layers (items 4.1–4.4; 4.5–4.7 are in ch04-b.js)
import { clamp, TAU, RAD, RHO_W, fOf, betaOf, ekmanSolve, ekmanSpiral } from './ch04.shared.js';

const YEAR = 3.15576e7; // s
const rightDeg = (re, im) => -Math.atan2(im, re) / RAD; // angle of a vector measured clockwise ("to the right") from the +x direction
const cabs = (re, im) => Math.hypot(re, im);

export default {
  collection: 'geo',
  chapter: 4,
  title: 'Ekman layers',
  summary: String.raw`Near surfaces, friction breaks geostrophic balance. In the Ekman layer the balance among friction, Coriolis and pressure forces twists the current into a spiral, and the net transport runs at right angles to the wind. Converging and diverging Ekman transports pump water vertically, which drives coastal upwelling, spins down vortices and sets the ocean's wind-driven circulation in motion.`,
  items: [
    // ------------------------------------------------------------------ 4.1
    {
      num: '4.1', kind: 'Model', name: 'Ekman spiral',
      statement: String.raw`Let a steady wind stress $\boldsymbol\tau$ act on the surface of a deep ocean in which the pressure gradient is negligible, the Coriolis parameter $f$ is constant and the turbulent stress is $A\,\partial_z\mathbf u$ with a constant eddy viscosity $A$. Writing $\psi=u+iv$, the momentum balance is $if\psi=A\psi_{zz}$, and with $A\psi_z=\tau/\rho$ at $z=0$ and $\psi\to0$ as $z\to-\infty$ it has the solution
$$\psi(z)=\frac{\tau}{\rho\,A}\,\frac{d}{1+i\,\mathrm{sgn} f}\;e^{(1+i\,\mathrm{sgn}f)\,z/d},\qquad d=\sqrt{\frac{2A}{|f|}} .$$
The current at the surface points $45^\circ$ to the right of the wind in the northern hemisphere ($45^\circ$ to the left in the southern); with depth it turns steadily to the right (left) and decays like $e^{z/d}$. At $z=-\pi d$, the **Ekman depth**, it is exactly opposite to the surface current and only $e^{-\pi}\approx4\%$ as large.`,
      idea: String.raw`Away from the pressure gradient, the Coriolis force on the horizontal current is balanced by the vertical divergence of the turbulent stress, $f\hat{\mathbf k}\times\mathbf u=\partial_z(A\,\partial_z\mathbf u)$ (the friction version of geostrophic balance, 3.1). In the complex variable $\psi$ this is the linear equation $\psi_{zz}=(if/A)\psi$, whose decaying solution has a complex exponent $(1\pm i)/d$: the same number controls the decay length and the turning rate, so the current rotates by one radian for each $d$ of depth and has lost a factor $e$ when it has turned by one radian. The stress boundary condition fixes the surface angle: $\psi_0\propto1/(1+i)$ is rotated $45^\circ$ from the wind.`,
      caption: String.raw`Set the wind (it blows toward $+x$, east), the eddy viscosity $A$, the latitude and the hemisphere. **Top left: the hodograph**, the tip of the current vector $\mathbf u(z)$ as depth increases (arrows every $\pi/4$ in depth$/d$ — each is a $45^\circ$ turn); the gold arrow is the depth you pick with the marker slider. **Bottom left:** the same current as components against depth. **Right (drag to rotate): the spiral in 3D.** The readout checks the formula against a numerical solution of $(A\psi_z)_z=if\psi$ on a grid. $A=0.1\ \mathrm{m^2/s}$ is a typical order of magnitude for the upper ocean, not a measurement; observed spirals are usually flatter than this ideal one.`,
      deps: ['fluid-8.11', 'geo-2.1', 'geo-3.1', 'ode-3.13'],
      refs: ['Vallis'],
      tags: ['Ekman layer', 'friction', 'spiral'],
      scope: String.raw`Constant $A$, constant $f$, steady wind, deep water without a pressure gradient. Real eddy viscosity varies with depth and with the wind, which changes the surface angle (see 4.2); the idea that $A$ is a constant is a closure, not a measurement.`,
      credit: 'V. W. Ekman, 1905',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Ekman_spiral' },
      viz(v) {
        const A = v.slider('eddy viscosity $A$ (m²/s)', 0.01, 0.4, 0.1, { step: 0.005 });
        const lat = v.slider('latitude (°)', 10, 80, 40, { step: 1 });
        const hem = v.select('hemisphere', [{ value: 1, label: 'north' }, { value: -1, label: 'south' }], 1);
        const tau = v.slider('wind stress $\\tau$ (N/m²)', 0.02, 0.3, 0.1, { step: 0.01 });
        const dep = v.slider('depth marker $|z|/d$', 0, 8, 1.5, { step: 0.05 });
        const sH = v.stage({ x: [-10, 10], y: [-10, 10], equal: true, axes: true, height: 330, weight: 1, minWidth: 280, title: 'hodograph: current vs depth (cm/s)' });
        const sP = v.stage({ x: [-10, 10], y: [-100, 0], axes: 'box', gutter: true, xlabel: 'current (cm/s)', ylabel: 'depth (m)', height: 300, weight: 1, minWidth: 280, title: 'components against depth' });
        const s3 = v.stage3d({ range: 1.45, height: 440, yaw: -0.8, pitch: 0.38, labels: ['u', 'v', 'z'], weight: 1.2, minWidth: 300, title: 'the spiral' });
        v.legend([['accent', 'u (east)'], ['orange', 'v (north)'], ['gold', 'marker depth']]);
        let st = {};
        v.render(() => {
          const f = fOf(lat.value) * hem.value, sp = ekmanSpiral(A.value, f), d = sp.d, c = tau.value / RHO_W * 100; // cm/s per unit psi
          const U = (t) => { const p = sp.at(-t * d); return [p[0] * c, p[1] * c]; };
          const m0 = cabs(sp.p0[0], sp.p0[1]) * c, lim = m0 * 1.18, TM = 3 * Math.PI;
          sH.setView([-lim, lim], [-lim, lim]);
          sH.hline(0, { color: 'grid' }); sH.vline(0, { color: 'grid' });
          sH.arrow(0, 0, lim * 0.95, 0, { color: 'orange', width: 3 });
          sH.text('wind', lim * 0.5, lim * 0.07, { color: 'orange', size: 12, align: 'center' });
          sH.curve((t) => U(t), 0, TM, { n: 320, color: 'accent', width: 2.4 });
          for (let k = 0; k <= 8; k++) { const p = U(k * Math.PI / 4); sH.arrow(0, 0, p[0], p[1], { color: 'muted', width: 1.2, head: 5, alpha: 0.8 }); }
          const pm = U(dep.value);
          sH.arrow(0, 0, pm[0], pm[1], { color: 'gold', width: 3.2, head: 8 });
          sH.dot(pm[0], pm[1], { r: 5, color: 'gold' });
          sH.dot(...U(0), { r: 4, color: 'accent', label: 'surface', labelPos: 'se' });
          // profile
          sP.setView([-lim, lim], [-TM * d, 0]);
          sP.curve((t) => [U(t)[0], -t * d], 0, TM, { n: 240, color: 'accent', width: 2.4 });
          sP.curve((t) => [U(t)[1], -t * d], 0, TM, { n: 240, color: 'orange', width: 2.4 });
          sP.hline(-dep.value * d, { color: 'gold', width: 1.6, dash: true });
          sP.vline(0, { color: 'grid' });
          sP.hline(-Math.PI * d, { color: 'muted', width: 1, dash: [3, 4] });
          sP.text('Ekman depth $\\pi d$', lim * 0.95, -Math.PI * d, { size: 11, color: 'muted', align: 'right', dy: -8 });
          // 3D
          const zz = (t) => 0.6 - 1.2 * t / TM, S = (t) => { const p = U(t); return [p[0] / m0, p[1] / m0, zz(t)]; };
          s3.curve((t) => S(t), 0, TM, { n: 220, color: 'accent' });
          s3.line([0, 0, 0.6], [0, 0, -0.6], { color: 'muted' });
          for (let k = 0; k <= 8; k++) { const t = k * Math.PI / 4, p = S(t); s3.arrow([0, 0, p[2]], p, { color: 'muted' }); }
          s3.arrow([0, 0, 0.6], [1.2, 0, 0.6], { color: 'orange' });
          s3.text('wind', [1.25, 0, 0.6]);
          s3.arrow([0, 0, zz(dep.value)], S(dep.value), { color: 'gold' });
          // numerical check
          const sol = ekmanSolve(() => A.value, f, 9 * d, 360);
          const a0 = sp.at(0), err = cabs(sol.surf[0] - a0[0], sol.surf[1] - a0[1]) / cabs(a0[0], a0[1]);
          const rev = U(Math.PI);
          st = { f, d, m0, ang: rightDeg(a0[0], a0[1]) * hem.value, err, ratio: cabs(rev[0], rev[1]) / m0, dot: (rev[0] * U(0)[0] + rev[1] * U(0)[1]) / (m0 * cabs(rev[0], rev[1])), pm: cabs(pm[0], pm[1]) };
        });
        v.readout(() => `$f=${v.sci(st.f, 3)}\\ \\mathrm{s^{-1}}$, $d=\\sqrt{2A/|f|}=${v.fix(st.d, 1)}$ m, Ekman depth $\\pi d=${v.fix(Math.PI * st.d, 0)}$ m. Surface current ${v.fix(st.m0, 1)} cm/s at **${v.fix(st.ang, 1)}°** to the ${hem.value > 0 ? 'right' : 'left'} of the wind.\nAt $z=-\\pi d$: speed ${v.fix(100 * st.ratio, 1)}% of the surface value ($e^{-\\pi}=4.3\\%$), direction cosine to the surface current ${v.fix(st.dot, 3)} (opposite). Marker: ${v.fix(st.pm, 2)} cm/s. Formula vs numerical solution: relative error $${v.sci(st.err, 2)}$.`);
      },
    },

    // ------------------------------------------------------------------ 4.2
    {
      num: '4.2', kind: 'Theorem', name: 'Ekman transport is perpendicular to the wind',
      statement: String.raw`Let the horizontal current $\mathbf u(z)$ in a surface layer obey $f\hat{\mathbf k}\times\mathbf u=\partial_z\bigl(A(z)\,\partial_z\mathbf u\bigr)$ for any positive eddy viscosity profile $A(z)$ (not necessarily constant), with stress $\boldsymbol\tau$ at the surface, zero stress and no Ekman current below the layer. Then the depth-integrated **Ekman transport**
$$\mathbf M_E=\int_{-\infty}^{0}\mathbf u\,dz=\frac{1}{\rho f}\,\boldsymbol\tau\times\hat{\mathbf k}$$
has magnitude $\tau/(\rho|f|)$ and points $90^\circ$ to the right of the wind in the northern hemisphere ($90^\circ$ to the left in the southern), whatever the shape of $A(z)$. Only the surface angle and the thickness of the layer depend on $A$.`,
      idea: String.raw`Integrate the momentum balance over the whole layer. The Coriolis term becomes $f\hat{\mathbf k}\times\mathbf M_E$; the friction term is a total derivative, so it equals the stress at the top minus the stress at the bottom, which is $\boldsymbol\tau/\rho$ minus zero. The viscosity profile has dropped out, and what is left is the algebraic relation $f\hat{\mathbf k}\times\mathbf M_E=\boldsymbol\tau/\rho$; solving for $\mathbf M_E$ gives the right angle and the magnitude. The result is the reason Ekman layers matter for large-scale dynamics: the divergence of this transport (4.3) does not depend on the unknowable turbulence closure.`,
      caption: String.raw`Choose a viscosity profile (left panel) and a water depth. **Drag the gold wind handle** around the circle on the right: the green arrow is the numerically integrated transport, in units of $\tau/(\rho|f|)$, and it stays on the unit circle exactly $90^\circ$ from the wind (the hollow green dot is the theorem's prediction). The middle panel is the hodograph of the current, whose shape and surface angle change a lot from profile to profile. Now make the water **shallow** (a rigid bottom cuts the layer off before the current has died away): the hypothesis fails and the transport shrinks and turns toward the wind.`,
      deps: ['geo-4.1', 'geo-3.1'],
      refs: ['Vallis'],
      tags: ['Ekman transport', 'stress', 'rotation'],
      scope: String.raw`Needs the friction layer to be entirely contained in the water column (or to end where the stress vanishes) and no pressure gradient in the layer. A bottom, a coast or a strong pressure gradient changes the transport; near the equator $f\to0$ and $\tau/\rho f$ is unbounded, which is a failure of the balance, not of the ocean (4.6).`,
      credit: 'V. W. Ekman, 1905',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Ekman_transport' },
      viz(v) {
        const prof = {
          const: (z) => 0.1,
          grow: (z) => 0.03 + 0.0025 * (-z),
          decay: (z) => 0.2 * Math.exp(z / 30) + 0.01,
          layer: (z) => (z > -25 ? 0.2 : 0.01),
        };
        const sel = v.select('viscosity $A(z)$', [{ value: 'const', label: 'constant' }, { value: 'grow', label: 'grows with depth' }, { value: 'decay', label: 'dies off with depth' }, { value: 'layer', label: 'mixed layer (25 m)' }], 'const');
        const Hs = v.slider('water depth $H$ (m)', 15, 500, 500, { step: 5 });
        const lat = v.slider('latitude (°)', 10, 80, 40, { step: 1 });
        const hem = v.select('hemisphere', [{ value: 1, label: 'north' }, { value: -1, label: 'south' }], 1);
        const sA = v.stage({ x: [0, 0.3], y: [-250, 0], axes: 'box', gutter: true, xlabel: '$A$ (m²/s)', ylabel: 'depth (m)', height: 330, weight: 0.8, minWidth: 220, title: 'eddy viscosity profile' });
        const sH = v.stage({ x: [-1, 1], y: [-1, 1], equal: true, axes: true, height: 330, weight: 1, minWidth: 260, title: 'current hodograph (cm/s)' });
        const sT = v.stage({ x: [-1.6, 1.6], y: [-1.6, 1.6], equal: true, axes: false, height: 330, weight: 1, minWidth: 260, title: 'transport in units of $\\tau/\\rho|f|$' });
        let th = 0.6;
        const hW = sT.handle(1.3 * Math.cos(th), 1.3 * Math.sin(th), { color: 'gold', label: 'wind', constrain: (x, y) => { const r = Math.hypot(x, y) || 1; return [1.3 * x / r, 1.3 * y / r]; } });
        v.legend([['green', 'integrated transport'], ['gold', 'wind'], ['accent', 'current'], ['muted', 'theorem: unit circle', { dash: true }]]);
        let st = {};
        v.render(() => {
          th = Math.atan2(hW.y, hW.x);
          const f = fOf(lat.value) * hem.value, H = Hs.value, Af = prof[sel.value];
          const sol = ekmanSolve(Af, f, H, 500);
          const tau = 0.1, c = tau / RHO_W; // N/m^2 ; kinematic stress
          const ct = Math.cos(th), sn = Math.sin(th);
          const rot = (re, im) => [re * ct - im * sn, re * sn + im * ct];
          // A profile
          const zmin = -Math.min(H, 250);
          sA.setView([0, 0.3], [zmin * 1.0, 0]);
          sA.fn((x) => 0, { color: 'grid' });
          sA.curve((t) => [Af(-t), -t], 0, -zmin, { n: 400, color: 'purple', width: 2.4 });
          if (H < 250) { sA.hline(-H, { color: 'red', width: 2 }); sA.text('rigid bottom', 0.29, -H, { color: 'red', size: 11, align: 'right', dy: -8 }); }
          // hodograph (rotate by the wind angle)
          let amax = 0; for (let j = 0; j < sol.re.length; j++) amax = Math.max(amax, cabs(sol.re[j], sol.im[j]));
          const lim = amax * c * 100 * 1.2 || 1;
          sH.setView([-lim, lim], [-lim, lim]);
          sH.hline(0, { color: 'grid' }); sH.vline(0, { color: 'grid' });
          const pts = []; for (let j = 0; j < sol.re.length; j += 2) { const p = rot(sol.re[j], sol.im[j]); pts.push([p[0] * c * 100, p[1] * c * 100]); }
          const pl = pts.slice().reverse();
          sH.path(pl, { color: 'accent', width: 2.4 });
          const ps = rot(sol.surf[0], sol.surf[1]);
          sH.arrow(0, 0, ps[0] * c * 100, ps[1] * c * 100, { color: 'accent', width: 3 });
          sH.arrow(0, 0, lim * 0.9 * ct, lim * 0.9 * sn, { color: 'gold', width: 2.6 });
          // transport (unit stress => |T| = 1/|f| ) in units of tau/(rho |f|)
          const T = [sol.T[0] * Math.abs(f), sol.T[1] * Math.abs(f)], Tr = rot(T[0], T[1]);
          sT.circle(0, 0, 1, { color: 'muted', width: 1.4, dash: true, stroke: true });
          sT.hline(0, { color: 'grid' }); sT.vline(0, { color: 'grid' });
          sT.arrow(0, 0, 1.3 * ct, 1.3 * sn, { color: 'gold', width: 2.6 });
          const pa = th - hem.value * Math.PI / 2;
          sT.arrow(0, 0, Tr[0], Tr[1], { color: 'green', width: 3.4 });
          sT.dot(Math.cos(pa), Math.sin(pa), { r: 6, hollow: true, color: 'green' });
          st = { ang: rightDeg(T[0], T[1]) * hem.value, mag: cabs(T[0], T[1]), surf: rightDeg(sol.surf[0], sol.surf[1]) * hem.value, M0: tau / (RHO_W * Math.abs(f)), d: Math.sqrt(2 * Af(0) / Math.abs(f)) };
        });
        v.readout(() => `Integrated transport: **${v.fix(st.ang, 2)}°** to the ${hem.value > 0 ? 'right' : 'left'} of the wind, magnitude **${v.fix(st.mag, 3)}** $\\times\\ \\tau/\\rho|f|$ (= ${v.fix(st.M0, 2)} m²/s for $\\tau=0.1$ N/m²). Surface current at ${v.fix(st.surf, 1)}° — it changes with $A(z)$, the transport does not.${Hs.value < 120 && (Math.abs(st.ang - 90) > 0.3 || Math.abs(st.mag - 1) > 0.01) ? '\nThe layer is cut off by the bottom: the theorem\'s hypothesis (no current below the layer) is violated.' : ''}`);
      },
    },

    // ------------------------------------------------------------------ 4.3
    {
      num: '4.3', kind: 'Phenomenon', name: 'Ekman pumping and suction',
      statement: String.raw`Where the wind stress $\boldsymbol\tau(x,y)$ has curl, the Ekman transport $\mathbf M_E=\boldsymbol\tau\times\hat{\mathbf k}/(\rho f)$ is not divergence-free, and mass conservation requires a vertical velocity at the base of the layer,
$$w_E=\nabla\!\cdot\mathbf M_E=\hat{\mathbf k}\cdot\nabla\times\Bigl(\frac{\boldsymbol\tau}{\rho f}\Bigr)=\frac{1}{\rho f}\,\hat{\mathbf k}\cdot\nabla\times\boldsymbol\tau+\frac{\beta\,\tau_x}{\rho f^{2}}\qquad(\beta=\partial_yf).$$
In the northern hemisphere, cyclonic wind stress (positive curl) draws water up out of the interior (Ekman suction, $w_E>0$) and anticyclonic stress pushes it down (pumping, $w_E<0$); the signs reverse where $f<0$. Typical open-ocean values are $10^{-6}\ \mathrm{m/s}$, tens of metres per year.`,
      idea: String.raw`The Ekman layer is thin, so it is a sheet carrying the transport $\mathbf M_E$ (4.2) and its two-dimensional divergence must be supplied from below: integrating $\nabla\cdot\mathbf u+\partial_zw=0$ across the layer gives $w(\text{base})=\nabla\cdot\mathbf M_E$. Taking the divergence of $\boldsymbol\tau\times\hat{\mathbf k}/\rho f$ turns the cross product into a curl (the vector identity of 'divergence of a rotated field', vcalc-3.4); if $f$ varies, a second term from $\partial_y(1/f)$ appears. The vertical velocity is tiny compared with horizontal currents, but it acts through the whole depth of the interior and so, as shown later (Sverdrup balance), it is what drives the gyres.`,
      caption: String.raw`The map shows the vertical velocity at the base of the Ekman layer in m/yr (blue: suction, up; red: pumping, down) for the wind stress drawn as black arrows. Choose a **basin-wide wind pattern** (westerlies in the north and trades in the south), or **drag the centre of a cyclonic or anticyclonic wind vortex**. Switch the $\beta$-term off to see its effect (small at mid-latitudes), vary the latitude and the stress, or flip the hemisphere. The right panel is a north–south cut through the column of the gold handle. The readout checks the divergence theorem: the area integral of $w_E$ equals the net Ekman transport out through the boundary.`,
      deps: ['geo-4.2', 'vcalc-3.4', 'vcalc-3.10'],
      refs: ['Vallis'],
      tags: ['Ekman pumping', 'wind stress curl', 'vertical velocity'],
      scope: String.raw`Valid for the open ocean away from boundaries and the equator, with the Ekman layer thin compared with the scale of the wind pattern; the stress is a prescribed model (smooth analytic fields), not an observed wind field.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Ekman_transport#Ekman_pumping' },
      viz(v) {
        const Lx = 4000e3, Ly = 3000e3, R = 650e3;
        const pat = v.select('wind pattern', [{ value: 'gyre', label: 'basin winds' }, { value: 'cyc', label: 'cyclonic vortex' }, { value: 'anti', label: 'anticyclonic vortex' }], 'gyre');
        const lat = v.slider('latitude of basin centre (°)', 10, 60, 30, { step: 1 });
        const hem = v.select('hemisphere', [{ value: 1, label: 'north' }, { value: -1, label: 'south' }], 1);
        const tau0 = v.slider('peak stress $\\tau_0$ (N/m²)', 0.02, 0.3, 0.1, { step: 0.01 });
        const beta = v.toggle('include the $\\beta$-term', true);
        const sM = v.stage({ x: [0, 4000], y: [0, 3000], equal: true, axes: 'box', gutter: true, xlabel: 'x (km)', ylabel: 'y (km)', height: 400, weight: 1.5, minWidth: 320, title: '$w_E$ at the base of the Ekman layer (m/yr)' });
        const sC = v.stage({ x: [0, 3000], y: [-100, 100], axes: 'box', gutter: true, xlabel: 'y (km)', ylabel: '$w_E$ (m/yr)', height: 400, weight: 0.9, minWidth: 250, title: 'north–south cut' });
        const hC = sM.handle(2000, 1500, { color: 'gold', label: 'cut / centre', constrain: { x: [300, 3700], y: [300, 2700] } });
        v.legend([['blue', 'suction (up)'], ['red', 'pumping (down)'], ['ink', 'wind stress'], ['accent', '$w_E$ on the cut']]);
        const stress = (x, y) => {
          const T = tau0.value;
          if (pat.value === 'gyre') return [-T * Math.cos(Math.PI * y / Ly), 0];
          const dx = x - hC.x * 1e3, dy = y - hC.y * 1e3, r = Math.hypot(dx, dy) || 1;
          const mag = (pat.value === 'cyc' ? 1 : -1) * T * (r / R) * Math.exp(0.5 * (1 - r * r / (R * R)));
          return [-mag * dy / r, mag * dx / r];
        };
        let st = {};
        v.render(() => {
          const f0 = fOf(lat.value) * hem.value, bt = betaOf(lat.value) * hem.value * 0 + betaOf(lat.value); // beta = 2 Omega cos(phi)/a > 0 in both hemispheres
          const fAt = (y) => beta.value ? f0 + bt * (y - Ly / 2) : f0;
          const Mx = (x, y) => stress(x, y)[1] / (RHO_W * fAt(y)), My = (x, y) => -stress(x, y)[0] / (RHO_W * fAt(y));
          const e = 25e3;
          const wE = (x, y) => ((Mx(x + e, y) - Mx(x - e, y)) + (My(x, y + e) - My(x, y - e))) / (2 * e);
          const wy = (x, y) => wE(x * 1e3, y * 1e3) * YEAR;
          const range = Math.round(80 * (tau0.value / 0.1) * (1e-4 / Math.max(Math.abs(f0), 3e-5)));
          const R0 = Math.max(10, range);
          sM.heat((x, y) => wy(x, y), { range: [-R0, R0], cmap: 'theme-diverging', neg: 'red', pos: 'blue', res: 3, key: [pat.value, lat.value, hem.value, tau0.value, beta.value, Math.round(hC.x / 20), Math.round(hC.y / 20)].join('|') });
          sM.colorbar([-R0, R0], (t) => v.diverge(2 * t - 1, 'red', 'blue'), { pos: 'right', label: 'm/yr', ticks: [-R0, 0, R0] });
          const scale = 190 / Math.max(tau0.value, 1e-3);
          for (let gx = 300; gx <= 3300; gx += 500) for (let gy = 250; gy <= 2800; gy += 350) {
            const [tx, ty] = stress(gx * 1e3, gy * 1e3), m = Math.hypot(tx, ty);
            if (m < 0.006) continue;
            sM.arrow(gx, gy, gx + tx * scale, gy + ty * scale, { color: 'ink', width: 1.6, head: 5 });
          }
          sM.vline(hC.x, { color: 'gold', width: 1.4, dash: [5, 4] });
          // cut
          const ys = []; for (let k = 0; k <= 120; k++) ys.push(k * 25);
          const vals = ys.map((y) => wy(hC.x, Math.min(Math.max(y, 25), 2975)));
          let mx = 20; for (const q of vals) mx = Math.max(mx, Math.abs(q));
          sC.setView([0, 3000], [-mx * 1.15, mx * 1.15]);
          sC.hline(0, { color: 'muted' });
          sC.path(ys.map((y, i) => [y, vals[i]]), { color: 'accent', width: 2.6 });
          sC.fn((y) => 0, { color: 'grid' });
          // divergence theorem
          let area = 0; const nx = 80, ny = 60, dxg = Lx / nx, dyg = Ly / ny;
          for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) area += wE((i + 0.5) * dxg, (j + 0.5) * dyg) * dxg * dyg;
          let flux = 0; const nb = 400;
          for (let i = 0; i < nb; i++) {
            const x = (i + 0.5) * Lx / nb, d = Lx / nb; flux += (My(x, Ly) - My(x, 0)) * d;
          }
          for (let j = 0; j < nb; j++) { const y = (j + 0.5) * Ly / nb, d = Ly / nb; flux += (Mx(Lx, y) - Mx(0, y)) * d; }
          let mxw = 0; for (let i = 1; i < 40; i++) for (let j = 1; j < 30; j++) mxw = Math.max(mxw, Math.abs(wy(i * 100, j * 100)));
          st = { area, flux, mxw, f0 };
        });
        v.readout(() => `$f_0=${v.sci(st.f0, 3)}\\ \\mathrm{s^{-1}}$. Largest $|w_E|$ on the map: **${v.fix(st.mxw, 0)} m/yr**. Divergence theorem: $\\iint w_E\\,dA=${v.fix(st.area / 1e6, 2)}$ Sv, net Ekman transport out of the boundary $=${v.fix(st.flux / 1e6, 2)}$ Sv (1 Sv $=10^6$ m³/s).`);
      },
    },

    // ------------------------------------------------------------------ 4.4
    {
      num: '4.4', kind: 'Phenomenon', name: 'Coastal upwelling',
      statement: String.raw`When the wind blows along a coast with the coast on its left (northern hemisphere, e.g. an equatorward wind off California), the Ekman transport $M_E=\tau/(\rho f)$ carries surface water away from the shore. The lost water is replaced from below within roughly one internal (baroclinic) Rossby radius $L_d=\sqrt{g'H_1}/|f|$ of the coast, at a speed $w\sim M_E/L_d$ (tens of metres per day in strong events). The density interface (thermocline) rises towards the coast and, if the wind persists long enough, cold nutrient-rich water outcrops at the surface; a wind of the opposite sign gives onshore transport and **downwelling**.`,
      idea: String.raw`The coast stops the cross-shore flow, so the offshore Ekman transport of the surface layer (4.2) must be fed by upwelling at the wall: the divergence of $M_E$ is concentrated in the strip where the coast acts, whose width is the Rossby radius, the distance over which a rotating fluid can hold a density jump (3.7). Volume conservation then gives $wL_d\approx M_E$. The rising interface is a geostrophic jet along the shore (the thermal-wind-balanced coastal current), and once the density interface reaches the surface the sea-surface temperature drops sharply, which is how upwelling is seen from satellites.`,
      caption: String.raw`A **two-layer cross-section** looking north (the coast is the hatched wall on the right, ocean to the left). Press play: the wind blows steadily along shore and the interface at the coast rises at the rate $M_E/L_d$ (the model clock is sped up so that surfacing happens in the middle of the loop). Slide $\tau$, the latitude, the upper-layer thickness and the density jump, or switch the wind to **poleward** (downwelling) or **off**. The picture is an idealised linear model, not a simulation of a real coast.`,
      deps: ['geo-4.2', 'geo-3.7'],
      refs: ['Vallis'],
      tags: ['upwelling', 'Ekman transport', 'coast'],
      scope: String.raw`Linear two-layer model, steady alongshore wind uniform in space, no alongshore variation and no bottom friction; it applies for times short compared with $1/f$ times the mixing time, and fails once the interface outcrops (the front then moves offshore instead of rising further).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Upwelling#Coastal_upwelling' },
      viz(v) {
        const wind = v.select('along-shore wind', [{ value: 1, label: 'equatorward (upwelling)' }, { value: -1, label: 'poleward (downwelling)' }, { value: 0, label: 'off' }], 1);
        const tau = v.slider('wind stress $\\tau$ (N/m²)', 0.02, 0.2, 0.08, { step: 0.01 });
        const lat = v.slider('latitude (°)', 15, 55, 35, { step: 1 });
        const H1 = v.slider('upper-layer thickness $H_1$ (m)', 20, 100, 50, { step: 5 });
        const drho = v.slider('density jump $\\Delta\\rho$ (kg/m³)', 0.5, 3, 1.5, { step: 0.1 });
        const s = v.stage({ x: [-60, 0], y: [-150, 10], axes: 'box', gutter: true, xlabel: 'distance from coast (km, offshore to the left)', ylabel: 'depth (m)', height: 400, weight: 1, minWidth: 330, title: 'two-layer cross-section (looking north)' });
        v.legend([['orange', 'warm upper layer'], ['blue', 'cold deep layer'], ['ink', 'flow']]);
        let st = {};
        v.animate((t) => {
          const f = fOf(lat.value), M = tau.value / (RHO_W * f), gp = 9.81 * drho.value / RHO_W, Ld = Math.sqrt(gp * H1.value) / f;
          const wc = M / Ld, tStar = H1.value / wc; // s to surface at the coast
          const tp = Math.min(t / 12, 1) * 1.6 * tStar;
          const sgn = wind.value, eta0 = sgn * wc * tp; // rise of the interface at the coast (m), >0 up
          const Lkm = Ld / 1000, X = 60;
          s.setView([-X, 0.5], [-3 * H1.value, 0.15 * H1.value]);
          const zi = (xk) => { const e = eta0 * Math.exp(-Math.abs(xk) / Lkm); return -(H1.value - e); };
          const N = 160, xs = []; for (let k = 0; k <= N; k++) xs.push(-X + X * k / N);
          const ziV = xs.map((x) => Math.min(0, zi(x))), zb = -3 * H1.value;
          s.poly([...xs.map((x, i) => [x, ziV[i]]), [0, 0], [-X, 0]].reverse(), { fill: 'orange', fillAlpha: 0.22, stroke: false });
          s.poly([[-X, zb], [0, zb], ...xs.map((x, i) => [x, ziV[i]]).reverse()], { fill: 'blue', fillAlpha: 0.22, stroke: false });
          s.path(xs.map((x, i) => [x, ziV[i]]), { color: 'ink', width: 2.4 });
          s.rect(0, zb, 6, 12, { fill: 'muted', fillAlpha: 0.5, hatch: true, stroke: false });
          s.hline(0, { color: 'muted', width: 1 });
          if (sgn !== 0) {
            // surface Ekman layer: offshore (upwelling) or onshore (downwelling) arrows
            const dir = -sgn, al = 16 * Math.min(M / 2.2, 1.5);
            for (let x = -52; x <= -6; x += 9) s.arrow(x - dir * al / 2, -0.12 * H1.value, x + dir * al / 2, -0.12 * H1.value, { color: 'ink', width: 2, head: 6 });
            // return flow at depth (reverse)
            for (let x = -50; x <= -8; x += 14) s.arrow(x + dir * al / 2, -2.2 * H1.value, x - dir * al / 2, -2.2 * H1.value, { color: 'ink', width: 1.6, head: 5, alpha: 0.8 });
            // vertical flow in the strip near the coast
            for (const xk of [-0.5, -1, -1.8].map((q) => q * Lkm)) {
              const L = 22; s.arrow(xk, -1.55 * H1.value, xk, -1.55 * H1.value + sgn * L, { color: 'ink', width: 2, head: 6 });
            }
            s.text('$\\odot$ wind ' + (sgn > 0 ? '(southward)' : '(northward)'), -57, 0.07 * H1.value, { size: 12, color: 'ink', align: 'left' });
          }
          s.vline(-Lkm, { color: 'accent', width: 1.2, dash: [4, 4] });
          s.text('$L_d$', -Lkm, -2.85 * H1.value, { size: 12, color: 'accent', align: 'center' });
          const outcrop = eta0 >= H1.value;
          st = { M, Ld: Lkm, wd: wc * 86400, tStar: tStar / 86400, tp: tp / 86400, eta0, outcrop, front: outcrop ? Lkm * Math.log(eta0 / H1.value) : 0, sgn };
        }, { period: 16, still: 10.5 });
        v.readout(() => `Ekman transport $M_E=\\tau/\\rho f=${v.fix(st.M, 2)}$ m²/s; Rossby radius $L_d=${v.fix(st.Ld, 1)}$ km; coastal upwelling speed $M_E/L_d=${v.fix(st.wd, 1)}$ m/day; time to surface $H_1L_d/M_E=${v.fix(st.tStar, 1)}$ days.\nAfter ${v.fix(st.tp, 1)} days the interface at the coast has moved ${st.sgn >= 0 ? 'up' : 'down'} by ${v.fix(Math.abs(st.eta0), 0)} m${st.outcrop ? `: **the cold layer is at the surface**, its front ${v.fix(st.front, 1)} km offshore` : ''}.`);
      },
    },
  ],
};
