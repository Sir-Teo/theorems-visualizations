// Atmosphere & Ocean Dynamics — Chapter 3: Balanced flow (items 3.6–3.9; 3.1–3.5 are in ch03.js)
import { clamp, RAD, TAU, fcor, sgn, log10, pAt, gradP, lapP, geoWind, adjustSim, etaFinal, cubicRoots, betaOf, potentialIntensity, hollandP, hollandV, deficitForVmax, saffirName, RHO_TC } from './ch03.shared.js';

import { simplePI, cycloneCalibration, cycloneAt, CYCLONE_RHO } from './geo-source-audit.js';

const fsafe = (lat) => { const f = fcor(lat); return Math.abs(f) < 1e-6 ? (f < 0 ? -1e-6 : 1e-6) : f; };

export default {
  collection: 'geo',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.6
    {
      num: '3.6', kind: 'Phenomenon', name: 'Friction and cross-isobar flow',
      statement: String.raw`Near the ground a drag force opposes the wind. Modelling it as linear drag $-r\mathbf u$ and balancing it against the pressure-gradient and Coriolis forces gives, for a geostrophic wind $\mathbf u_g$,
$$\mathbf u=\frac{f^2\,\mathbf u_g+rf\,\hat{\mathbf k}\times\mathbf u_g}{f^2+r^2},$$
that is, a wind of speed $|\mathbf u|=|\mathbf u_g|\cos\alpha$ turned by the angle $\alpha=\arctan(r/f)$ toward low pressure, with a component $|\mathbf u_g|\sin\alpha\cos\alpha$ across the isobars. In a low the cross-isobar component is inflow and the surface wind **converges** (rate $\sin\alpha\cos\alpha\,\zeta_g$, with $\zeta_g$ the geostrophic vorticity), in a high it diverges; mass continuity then forces air to rise over lows and sink over highs.`,
      idea: String.raw`With friction the Coriolis force alone can no longer balance the pressure gradient: the three forces form a triangle with the drag opposing the wind, the Coriolis force perpendicular to it on the right (northern hemisphere), and the pressure force closing the triangle, which tilts it so that the pressure force has a component along the wind (balancing the drag) and so points partly in the direction of motion. The wind therefore crosses the isobars toward low pressure. The stronger the drag relative to $f$, the larger $\alpha$; at the equator $f\to0$ the wind flows straight down the gradient. The convergence is the divergence of the cross-isobar flow, $-\nabla\!\cdot\!(\sin\alpha\cos\alpha\,\nabla p/\rho f)$, the same Laplacian of pressure that gives $\zeta_g$ (3.1), and the continuity equation turns it into vertical motion out of the boundary layer, the starting point of Ekman pumping (Chapter 4).`,
      caption: String.raw`**Drag the low** and the gold probe, and **slide the drag rate** $r$ (the drag turns the wind through $\arctan(r/f)$) and the latitude. Faint arrows are the frictionless geostrophic wind; bold arrows are the wind with friction, found by solving the three-force balance at every point. The colours show the horizontal divergence of the surface wind (blue = convergence). The right panel is the force triangle at the probe (in the frame of the wind). With $r=0$ the wind is geostrophic and the divergence vanishes. Linear (Rayleigh) drag is a simple stand-in for turbulent boundary-layer friction; the angles are model values, not observations.`,
      deps: ['geo-3.1'],
      refs: ['Vallis'],
      tags: ['friction', 'boundary layer', 'convergence'],
      scope: String.raw`Steady, linear drag acting on a horizontally uniform layer; real boundary layers have a stress that varies with height (Ekman layer, Chapter 4) and stability-dependent turning angles.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Geostrophic_wind' },
      viz(v) {
        const rr = v.slider('drag rate $r$ ($10^{-5}\\,\\mathrm{s^{-1}}$)', 0, 30, 6, { step: 0.5 });
        const lat = v.slider('latitude $\\varphi$ (°)', -60, 60, 45, { step: 1 });
        const sM = v.stage({ x: [-1500, 1500], y: [-1500, 1500], equal: true, axes: 'box', gutter: true, xlabel: 'east (km)', ylabel: 'north (km)', height: 430, weight: 1.5, minWidth: 320, title: 'surface wind around a low' });
        const sF = v.stage({ x: [-1.45, 1.45], y: [-1.1, 1.3], equal: true, axes: false, height: 430, weight: 0.9, minWidth: 250, title: 'force balance at the probe' });
        const C = [{ x: 0, y: 0, a: -22, s: 520 }];
        const hL = sM.handle(0, 0, { color: 'blue', label: 'L' });
        const hP = sM.handle(550, 300, { color: 'gold', label: 'probe' });
        const RHO = 1.2;
        const windAt = (x, y, f, r) => {
          const [ug, vg] = geoWind(gradP(C, x, y), f, RHO), D = f * f + r * r;
          return [(f * f * ug - r * f * vg) / D, (f * f * vg + r * f * ug) / D, ug, vg];
        };
        const divAt = (x, y, f, r) => { const h = 25, a = windAt(x + h, y, f, r)[0], b = windAt(x - h, y, f, r)[0], c = windAt(x, y + h, f, r)[1], d = windAt(x, y - h, f, r)[1]; return (a - b) / (2 * h * 1e3) + (c - d) / (2 * h * 1e3); };
        let st = {};
        v.render(() => {
          C[0].x = hL.x; C[0].y = hL.y;
          const f = fsafe(lat.value), r = rr.value * 1e-5;
          sM.heat((x, y) => divAt(x, y, f, r) * 1e5, { range: [-6, 6], cmap: 'theme-diverging', neg: 'blue', pos: 'orange', res: 4, key: `${hL.x}|${hL.y}|${f}|${r}` });
          const lv = []; for (let p = 960; p <= 1000; p += 4) lv.push(p);
          sM.clip(() => sM.contour((x, y) => pAt(C, x, y), lv, { color: 'muted', width: 1, alpha: 0.9, labels: true, fmt: (q) => String(Math.round(q)) }));
          for (let gx = -1000; gx <= 1000; gx += 500) for (let gy = -1000; gy <= 1000; gy += 500) {
            const [u, w, ug, vg] = windAt(gx, gy, f, r), sg = Math.hypot(ug, vg); if (sg < 0.3) continue;
            const K = 14;
            sM.arrow(gx, gy, gx + ug * K, gy + vg * K, { color: 'muted', width: 1.4, head: 6, alpha: 0.7 });
            sM.arrow(gx, gy, gx + u * K, gy + w * K, { color: 'ink', width: 2.6, head: 7 });
          }
          // force triangle at the probe, in a frame where the wind points along +x
          const [u, w, ug, vg] = windAt(hP.x, hP.y, f, r), V = Math.hypot(u, w), g = gradP(C, hP.x, hP.y);
          const pgf = [-g[0] / RHO, -g[1] / RHO], cor = [f * w, -f * u], fr = [-r * u, -r * w];
          const dir = V > 1e-9 ? [u / V, w / V] : [1, 0], lf = [-dir[1], dir[0]];
          const P = (a) => [a[0] * dir[0] + a[1] * dir[1], a[0] * lf[0] + a[1] * lf[1]];
          const sc = 1.3 / Math.max(Math.hypot(pgf[0], pgf[1]), 1e-12), pp = P(pgf), cc = P(cor), ff = P(fr);
          // chain: friction, then Coriolis, then pressure  (sum = 0)
          const p0 = [0, 0], p1 = [p0[0] + ff[0] * sc, p0[1] + ff[1] * sc], p2 = [p1[0] + cc[0] * sc, p1[1] + cc[1] * sc], p3 = [p2[0] + pp[0] * sc, p2[1] + pp[1] * sc];
          const cxm = (p0[0] + p1[0] + p2[0]) / 3, cym = (p0[1] + p1[1] + p2[1]) / 3;
          for (const q of [p0, p1, p2, p3]) { q[0] -= cxm; q[1] -= cym + 0.2; }
          sF.arrow(p0[0], p0[1], p1[0], p1[1], { color: 'orange', width: 3 });
          sF.arrow(p1[0], p1[1], p2[0], p2[1], { color: 'blue', width: 3 });
          sF.arrow(p2[0], p2[1], p3[0], p3[1], { color: 'red', width: 3 });
          const lab = (a, b, t, col) => { const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, nx = mx, ny = my + 0.2; const d = Math.hypot(nx, ny) || 1; sF.text(t, mx + nx / d * 0.28, my + ny / d * 0.28, { size: 11, color: col, align: 'center', baseline: 'middle', plate: true }); };
          lab(p0, p1, 'friction $-r\\mathbf u$', 'orange');
          lab(p1, p2, 'Coriolis', 'blue');
          lab(p2, p3, 'pressure', 'red');
          sF.arrow(-0.45, -1.0, 0.45, -1.0, { color: 'ink', width: 3 });
          sF.text('wind $\\mathbf u$ (along +x)', 0, -1.0, { size: 11, color: 'ink', dy: 14, align: 'center' });
          const [ex, ey] = P([ug, vg]);
          st = { f, r, u, w, ug, vg, V, sg: Math.hypot(ug, vg), resid: Math.hypot(p3[0] - p0[0], p3[1] - p0[1]) / sc, ang: Math.atan2(u * vg - w * ug, u * ug + w * vg) / RAD, pgf };
          st.angTurn = Math.acos(clamp((u * ug + w * vg) / (Math.hypot(u, w) * Math.hypot(ug, vg) + 1e-30), -1, 1)) / RAD;
          st.div0 = divAt(hL.x + 1, hL.y + 1, f, r);
          st.zeta0 = lapP(C, hL.x, hL.y) / (RHO * f);
        });
        v.legend([['muted', 'geostrophic wind'], ['ink', 'wind with friction'], ['blue', 'convergence', { area: true }], ['orange', 'divergence', { area: true }]]);
        v.readout(() => {
          const al = Math.atan(Math.abs(st.r / st.f)), pred = -Math.sin(al) * Math.cos(al) * st.zeta0;
          return `$f=${sgn(v, st.f * 1e4, 2)}\\times10^{-4}\\,\\mathrm{s^{-1}}$, $r/|f|=${v.fix(Math.abs(st.r / st.f), 2)}$ → predicted turning $\\alpha=\\arctan(r/|f|)=$ **${v.fix(al / RAD, 1)}°**, speed ratio $\\cos\\alpha=${v.fix(Math.cos(al), 3)}$\nat the probe: geostrophic ${v.fix(st.sg, 1)} m/s, actual ${v.fix(st.V, 1)} m/s (ratio ${v.fix(st.V / Math.max(st.sg, 1e-9), 3)}), turned ${v.fix(st.angTurn, 1)}° toward low pressure; force triangle closes to $${v.sci(st.resid, 1)}\\,\\mathrm{m\\,s^{-2}}$ (zero)\ndivergence at the low's centre, numerical $${v.sci(st.div0, 2)}\\,\\mathrm{s^{-1}}$ vs $-\\sin\\alpha\\cos\\alpha\\,\\zeta_g=${v.sci(pred, 2)}\\,\\mathrm{s^{-1}}$ → upward velocity at 1 km ${v.fix(-st.div0 * 1000 * 100, 2)} cm/s`;
        });
      },
    },

    // ------------------------------------------------------------------ 3.7
    {
      num: '3.7', kind: 'Phenomenon', name: 'Geostrophic adjustment and the Rossby deformation radius',
      statement: String.raw`If a rotating fluid layer of rest depth $H$ is given a localized imbalance (say a step in surface height), gravity and inertia–gravity waves of speed $c=\sqrt{gH}$ carry energy away and the remaining flow settles into geostrophic balance. For a step $\eta=\pm\eta_0/2$ (linearised, $f$-plane, no friction) the final state is
$$\eta(x)=\frac{\eta_0}{2}\,\mathrm{sgn}(x)\bigl(1-e^{-|x|/L_d}\bigr),\qquad v=\frac g f\frac{\partial\eta}{\partial x}=\frac{c\,\eta_0}{2H}e^{-|x|/L_d},\qquad L_d=\frac{\sqrt{gH}}{|f|},$$
a front of width the **Rossby radius of deformation** $L_d$ and a geostrophic jet along it. Without rotation ($f=0$) the same release flattens completely: the surface becomes level and no jet remains. Disturbances much larger than $L_d$ stay nearly balanced and retain their height anomaly; those much smaller radiate away.`,
      idea: String.raw`Potential vorticity is conserved by every fluid column (here $q=\partial_xv-f\eta/H$ is a fixed function of $x$, set by the initial step), while the waves carry away the unbalanced part of the flow. Insert geostrophic balance $v=(g/f)\eta_x$ into the conserved $q$: this gives $\eta_{xx}-\eta/L_d^2=-\eta_0\,\mathrm{sgn}(x)/(2L_d^2)$, whose decaying solution is the one above. The scale $L_d=c/f$ is where a wave's travel time across a distance ($x/c$) equals the rotation time $1/f$: smaller scales are dominated by gravity (they disperse), larger by rotation (they are held in balance, 3.1). Without $f$ there is no conserved $q$ to hold the step in place.`,
      caption: String.raw`The simulation solves the linear shallow-water equations $u_t=fv-g\eta_x$, $v_t=-fu$, $\eta_t=-Hu_x$ on a staggered grid with open boundaries, starting from the step. **Play** the animation, then **slide the latitude** (the layer depth $H$ changes $L_d$ too): the top panel is $\eta$, the middle is the along-front velocity compared with its geostrophic value, the bottom panel is the space–time diagram of $\eta$ in which the outgoing waves run at speed $c$ (dashed lines). The gold dot marks the predicted balanced value at $x=L_d$. At $\varphi=0$ ($f=0$) the step collapses to level. The slow ringing near the centre is the decaying inertial oscillation.`,
      deps: ['geo-3.1', 'fluid-9.6'],
      refs: ['Vallis'],
      tags: ['geostrophic adjustment', 'deformation radius', 'shallow water'],
      credit: 'C.-G. Rossby, J. Marine Research 1 (1937, 1938): "On the mutual adjustment of pressure and velocity distributions in certain simple current systems", I and II',
      scope: String.raw`Linear, inviscid, single layer on an $f$-plane with no mean flow; the nonlinear and stratified cases have the same $L_d$ for small amplitudes with $H$ replaced by an equivalent depth.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Rossby_radius_of_deformation' },
      viz(v) {
        const lat = v.slider('latitude $\\varphi$ (°)', 0, 80, 45, { step: 1 });
        const Hs = v.slider('layer depth $H$ (m)', 50, 5000, 1000, { log: true, sig: 2 });
        const sE = v.stage({ x: [-4, 4], y: [-0.62, 0.62], axes: 'box', gutter: true, xlabel: '$x/L_d$', ylabel: '$\\eta/\\eta_0$', height: 270, weight: 1, minWidth: 300, title: 'surface height' });
        const sV = v.stage({ x: [-4, 4], y: [-0.2, 0.85], axes: 'box', gutter: true, xlabel: '$x/L_d$', ylabel: '$v\\,H/(c\\eta_0)$', height: 270, weight: 1, minWidth: 300, title: 'along-front velocity' });
        const sH = v.stage({ x: [-4, 4], y: [0, 40], axes: 'box', gutter: true, xlabel: '$x/L_d$', ylabel: 'time (h)', height: 270, weight: 1, minWidth: 300, title: 'space–time diagram of $\\eta$' });
        let key = '', sim = null;
        const get = () => {
          const f = fcor(lat.value), k = `${f}|${Hs.value}`;
          if (k !== key) { key = k; sim = adjustSim({ f, H: Hs.value }); sim.rot = f > 0; sim.U = f > 0 ? sim.Ld : 1e6; sim.fe = Math.max(f, 0.05 * 1.031e-4); }
          return sim;
        };
        let st = {};
        v.animate((t) => {
          const S = get(), nf = S.frames.length, idx = clamp(Math.round(t / 14 * (nf - 1)), 0, nf - 1), fr = S.frames[idx];
          const xr = S.rot ? 4 : 3, X = (i) => S.xs[i] / S.U;
          for (const s of [sE, sV, sH]) { s.setView([-xr, xr], null); }
          const lab = S.rot ? '$x/L_d$' : '$x$ (1000 km)';
          sE.setLabels(lab); sV.setLabels(lab, S.rot ? '$v\\,H/(c\\eta_0)$' : '$v\\,H/(c\\eta_0)$'); sH.setLabels(lab);
          const Tmax = S.frames[nf - 1].t / 3600; sH.setView([-xr, xr], [0, Tmax]);
          // η
          const step = []; sE.path([[-xr, -0.5], [0, -0.5], [0, 0.5], [xr, 0.5]], { color: 'faint', width: 1.4, dash: [4, 4] });
          if (S.rot) sE.path(Array.from(S.xs, (x) => [x / S.U, etaFinal(x, S.Ld, 1, true)]).filter((p) => Math.abs(p[0]) <= xr), { color: 'green', width: 1.8, dash: [6, 4] });
          else sE.hline(0, { color: 'green', dash: [6, 4], width: 1.8 });
          const pe = []; for (let i = 0; i < S.nx; i++) if (Math.abs(X(i)) <= xr) pe.push([X(i), fr.eta[i]]);
          sE.path(pe, { color: 'accent', width: 2.6 });
          if (S.rot) sE.dot(1, etaFinal(S.Ld, S.Ld, 1, true), { r: 6, color: 'gold' });
          // v
          const sc = S.H / (S.c * 1);
          if (S.rot) sV.path(Array.from(S.xs, (x) => [x / S.U, 0.5 * Math.exp(-Math.abs(x) / S.Ld)]).filter((p) => Math.abs(p[0]) <= xr), { color: 'green', width: 1.8, dash: [6, 4] });
          sV.hline(0, { color: 'faint' });
          const pv = []; for (let i = 0; i < S.nx; i++) if (Math.abs(X(i)) <= xr) pv.push([X(i), fr.v[i] * sc]);
          sV.path(pv, { color: 'accent', width: 2.6 });
          // Hovmöller
          sH.raster((x, tt) => {
            const fi = clamp(tt * 3600 / S.frames[nf - 1].t * (nf - 1), 0, nf - 1.001), j = Math.floor(fi), b = fi - j;
            const xi = clamp((x * S.U + S.W) / (2 * S.W) * S.nx - 0.5, 0, S.nx - 1.001), i = Math.floor(xi), a = xi - i;
            const A = S.frames[j].eta, B = S.frames[j + 1].eta, e = (1 - b) * ((1 - a) * A[i] + a * A[i + 1]) + b * ((1 - a) * B[i] + a * B[i + 1]);
            const c = v.diverge(clamp(e * 2, -1, 1), 'blue', 'red'); return [c[0], c[1], c[2], 1];
          }, { res: 3, key });
          const fan = []; for (const sg of [-1, 1]) sH.path([[0, 0], [sg * S.c * Tmax * 3600 / S.U, Tmax]], { color: 'ink', width: 1.4, dash: [5, 4] });
          sH.hline(fr.t / 3600, { color: 'gold', width: 2 });
          sH.text('$x=\\pm ct$', xr * 0.97, Tmax * 0.35, { size: 12, color: 'ink', align: 'right', plate: true });
          // measured vs predicted, time-mean over the last inertial period (or last quarter when f = 0)
          const T1 = S.frames[nf - 1].t, win = S.rot ? TAU / S.fe : T1 / 4, sel = S.frames.filter((q) => q.t >= T1 - win);
          const mean = (fn) => sel.reduce((a, q) => a + fn(q), 0) / sel.length;
          const iL = S.xs.findIndex((x) => x > S.Ld), i0 = S.xs.findIndex((x) => x > 0);
          st = { S, etaL: S.rot ? mean((q) => q.eta[iL]) : NaN, v0: mean((q) => q.v[i0]) * sc, eta0c: mean((q) => q.eta[i0]), t: fr.t };
        }, { period: 14, still: 13.9 });
        v.legend([['accent', 'simulation (now)'], ['green', 'predicted balanced state', { dash: true }], ['faint', 'initial step', { dash: true }]]);
        v.readout(() => {
          const S = st.S;
          if (!S.rot) return `$f=0$: no deformation radius ($L_d=\\sqrt{gH}/f\\to\\infty$). Waves of speed $c=${v.fix(S.c, 0)}$ m/s run away in both directions and the surface between them goes level: $\\eta(0)$ averaged over the late frames = ${v.fix(st.eta0c, 3)}$\\eta_0$, $v\\approx0$.`;
          return `$c=\\sqrt{gH}=${v.fix(S.c, 0)}$ m/s, $f=${v.fix(S.f * 1e4, 2)}\\times10^{-4}\\,\\mathrm{s^{-1}}$ → $L_d=c/f=$ **${v.fix(S.Ld / 1000, 0)} km**; t = ${v.fix(st.t / 3600, 1)} h\nin the last inertial period (mean): $\\eta(L_d)=${v.fix(st.etaL, 3)}\\,\\eta_0$ against predicted $(1-e^{-1})/2=${v.fix((1 - Math.exp(-1)) / 2, 3)}$, centre velocity $vH/c\\eta_0=${v.fix(st.v0, 3)}$ against predicted 0.5`;
        });
      },
    },

    // ------------------------------------------------------------------ 3.8
    {
      num: '3.8', kind: 'Method', name: 'Quasi-geostrophic approximation',
      statement: String.raw`The **quasi-geostrophic (QG) approximation** exploits $\mathrm{Ro}\ll1$ and a nearly constant $f$: the horizontal wind is geostrophic at leading order, $\mathbf u\approx\mathbf u_g=\hat{\mathbf k}\times\nabla\psi$, and its slow evolution is governed by one equation for the conservation of a single scalar, the QG potential vorticity,
$$\frac{D_g}{Dt}\Bigl(\nabla^2\psi-\frac{\psi}{L_d^2}+\beta y\Bigr)=0,\qquad D_g=\partial_t+\mathbf u_g\!\cdot\!\nabla,$$
for a single shallow-water layer. Divergent flow is slaved to the balanced flow, and gravity waves are **filtered out**. The simplest test is linear waves on the $\beta$-plane: the full shallow-water system obeys $\omega^3-\omega(f^2+c^2K^2)-\beta c^2k=0$ with three branches (two inertia–gravity waves and one Rossby wave), QG keeps only $\omega=-\beta k/(K^2+L_d^{-2})$, and the relative error of the Rossby branch is $\approx(\omega/f)^2/(1+K^2L_d^2)$, small when the frequency is small compared with $f$.`,
      idea: String.raw`Scale analysis (2.3): when $\mathrm{Ro}\ll1$ the velocity is geostrophic up to an $O(\mathrm{Ro})$ correction. The divergence of the correction is what controls the evolution, and eliminating it between the vorticity equation and the continuity equation leaves the advection of the scalar $q=\nabla^2\psi-\psi/L_d^2+\beta y$ by the geostrophic wind. Starting from the full dispersion relation, the cubic has $\omega^2$ in the denominator after rearranging, $\omega=-\beta k/(K^2+L_d^{-2}-\omega^2/c^2)$, and dropping the $\omega^2/c^2$ term (compared with $f^2/c^2$) gives QG: the error is of relative order $\mathrm{Ro}^2$ with $\mathrm{Ro}\sim\omega/f$. The two other roots of the cubic, $\omega\approx\pm\sqrt{f^2+c^2K^2}$, are the fast waves that QG removes.`,
      caption: String.raw`The left panel is the dispersion relation of linear shallow-water waves on a $\beta$-plane (waves travelling east–west, wavenumber $k$, in units of $1/L_d$) for the full equations, computed as the three roots of the cubic: the two inertia–gravity branches (blue) and the Rossby branch (green), against the QG Rossby wave (gold, dashed). **Slide the deformation radius** $L_d$ (a larger $L_d$ means larger $\beta L_d/f$, hence a larger Rossby number) and the latitude, and drag the gold handle to choose a wave. The right panel shows the relative error of QG, which falls like $\mathrm{Ro}^2$ where Ro $=|\omega|/f$. Only the linear-wave test is shown here, not a nonlinear time-stepping comparison.`,
      deps: ['geo-3.1', 'geo-2.4'],
      refs: ['Vallis'],
      tags: ['quasi-geostrophic', 'filtering', 'Rossby waves'],
      credit: 'J. G. Charney, "On the scale of atmospheric motions", Geofysiske Publikasjoner 17 (1948)',
      scope: String.raw`Valid for $\mathrm{Ro}\ll1$, $L\ll a$ and small variations of the layer thickness; it fails at the equator, in strong jets and in frontal zones where $\mathrm{Ro}\sim1$.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Quasi-geostrophic_equations' },
      viz(v) {
        const lat = v.slider('latitude $\\varphi$ (°)', 10, 80, 45, { step: 1 });
        const LdS = v.slider('deformation radius $L_d$ (km)', 20, 6000, 1000, { log: true, sig: 2 });
        const sD = v.stage({ x: [0.01, 100], xlog: true, y: [1e-3, 100], ylog: true, axes: 'box', gutter: true, xlabel: 'wavenumber $kL_d$', ylabel: '$|\\omega|/f$', height: 400, weight: 1.3, minWidth: 300, title: 'full shallow-water waves vs QG' });
        const sE = v.stage({ x: [0.01, 100], xlog: true, y: [1e-9, 1], ylog: true, axes: 'box', gutter: true, xlabel: 'wavenumber $kL_d$', ylabel: 'relative error of the Rossby wave', height: 400, weight: 1, minWidth: 260, title: 'how wrong is QG?' });
        const hk = sD.handle(1, 0.3, { color: 'gold', label: '', constrain: (x) => { const xx = clamp(x, 0.011, 99); return [xx, qgOf(xx)]; } });
        let mu = 0.1;
        const qgOf = (x) => mu * x / (1 + x * x);
        const rootsOf = (x) => cubicRoots(1 + x * x, mu * x);
        let st = {};
        v.render(() => {
          const f = Math.abs(fcor(lat.value)), Ld = LdS.value * 1e3; mu = betaOf(lat.value) * Ld / f;
          const xk = clamp(hk.x, 0.011, 99);
          // curves
          const N = 200, xs = []; for (let i = 0; i <= N; i++) xs.push(0.01 * Math.pow(1e4, i / N));
          const full = xs.map((x) => { const r = rootsOf(x); return { x, ig: Math.abs(r[2]), ig2: Math.abs(r[0]), ro: Math.abs(r[1]) }; });
          sD.path(full.map((q) => [q.x, q.ig]), { color: 'accent', width: 2.4 });
          sD.path(full.map((q) => [q.x, q.ig2]), { color: 'accent', width: 1.4, dash: [3, 3], alpha: 0.7 });
          sD.path(full.map((q) => [q.x, q.ro]), { color: 'green', width: 2.8 });
          sD.path(xs.map((x) => [x, qgOf(x)]), { color: 'gold', width: 1.8, dash: [6, 4] });
          sD.text('inertia–gravity waves: removed by QG', 0.012, 8, { size: 12, color: 'accent', align: 'left', plate: true });
          sD.text('Rossby wave: kept by QG', 0.02, 0.003 * 1, { size: 12, color: 'green', align: 'left', dy: -6, plate: true });
          // errors
          const err = xs.map((x) => { const r = rootsOf(x), ro = Math.abs(r[1]), q = qgOf(x); return [x, Math.max(Math.abs(ro - q) / ro, 1e-12)]; });
          sE.path(err, { color: 'red', width: 2.6 });
          sE.path(xs.map((x) => { const e = qgOf(x); return [x, Math.max(e * e / (1 + x * x), 1e-12)]; }), { color: 'green', width: 1.6, dash: [5, 4] });
          const r = rootsOf(xk), ro = Math.abs(r[1]), q = qgOf(xk), e0 = Math.abs(ro - q) / ro, est = q * q / (1 + xk * xk);
          sE.vline(xk, { color: 'gold', width: 1.4 });
          sE.dot(xk, Math.max(e0, 1e-12), { r: 6, color: 'gold' });
          sD.vline(xk, { color: 'gold', width: 1, dash: [3, 4] });
          sD.dot(xk, ro, { r: 5, color: 'green' });
          sD.dot(xk, Math.abs(r[2]), { r: 5, color: 'accent' });
          hk.set(xk, ro);
          st = { f, Ld, mu, xk, ro, q, e0, est, ig: Math.abs(r[2]), Ro: q, c: f * Ld };
        });
        v.legend([['accent', 'inertia–gravity branches (full)'], ['green', 'Rossby branch (full)'], ['gold', 'QG Rossby wave', { dash: true }], ['red', 'relative error of QG'], ['green', 'estimate $\\mathrm{Ro}^2/(1+K^2L_d^2)$', { dash: true }]]);
        v.readout(() => `$\\beta=${v.sci(betaOf(lat.value), 2)}\\,\\mathrm{m^{-1}s^{-1}}$, $\\beta L_d/f=${v.fix(st.mu, 3)}$, largest Rossby-wave Rossby number $\\mathrm{Ro}_{\\max}=|\\omega|/f=\\beta L_d/2f=${v.fix(st.mu / 2, 3)}$\nwave $kL_d=${v.fix(st.xk, 2)}$: full Rossby $|\\omega|/f=${v.sci(st.ro, 3)}$, QG $${v.sci(st.q, 3)}$, relative error **$${v.sci(st.e0, 2)}$** vs estimate $${v.sci(st.est, 2)}$ · fast branch $|\\omega|/f=${v.fix(st.ig, 2)}$, a period ${v.fix(TAU / (st.ig * st.f) / 3600, 1)} h wave that QG filters out`);
      },
    },

    // ------------------------------------------------------------------ 3.9
    {
      num: '3.9', kind: 'Phenomenon', name: 'Tropical cyclones',
      verify: false,
      statement: String.raw`A tropical cyclone draws energy from the sea's enthalpy flux. In a steady, axisymmetric idealization, the gradient wind satisfies $V^2+frV=rp'(r)/\rho$. For the Holland-type pressure profile
$$p(r)=p_c+\Delta p\exp[-(R/r)^B],$$
$R$ is the **cyclostrophic** peak radius: at nonzero $f$ the gradient-wind maximum is slightly inward of $R$. The cyclostrophic maximum is $\sqrt{B\Delta p/(\rho e)}$. The dissipative-heating version of the potential-intensity relation (Bister and Emanuel, 1998, Eq. 21) is
$$V_p^2=\frac{C_k}{C_d}\frac{T_s-T_o}{T_o}(k_0^*-k).$$
Here $T_s,T_o$ are absolute sea-surface and outflow temperatures and $k_0^*-k$ is the surface-to-air enthalpy difference. With all other model inputs fixed, a warmer sea increases this intensity scale.`,
      idea: String.raw`The Carnot efficiency is $\eta=(T_s-T_o)/T_s$. If dissipated work is returned as heat at the warm end, $W=\eta(Q_{\rm ocean}+W)$, so $W/Q_{\rm ocean}=\eta/(1-\eta)=(T_s-T_o)/T_o$. This explains the denominator $T_o$; it is not itself a Carnot efficiency. Bister and Emanuel derive the wind relation using steady axisymmetry, hydrostatic and gradient balance, slantwise convective neutrality and approximations relating surface and balanced winds. Independently, differentiating the pressure profile gives $rp'/\rho=(B\Delta p/\rho)x e^{-x}$ with $x=(R/r)^B$; the positive root of the gradient-wind quadratic then determines the wind. The reversible two-temperature efficiency in pchem 3.3 supplies $\eta=1-T_o/T_s$. Returning dissipated work to the warm end changes the bookkeeping to $W=\eta(Q_{\rm ocean}+W)$, so solving gives $W/Q_{\rm ocean}=\eta/(1-\eta)$. The resulting factor is not the efficiency of the unrecycled engine.`,
      caption: String.raw`**Drag the gold SST handle** and change the target fraction, $B$, pressure-profile radius $R$ and latitude. The pressure deficit is calibrated to the actual gradient-wind peak, using its stationary-point equation, rather than a sampled maximum. Blue is gradient wind, orange cyclostrophic and purple geostrophic. The radial panel uses a **logarithmic speed axis** and omits speeds below 0.01 m/s (the central zero is outside that display window); it includes all larger comparison values without clipping. The plan-view heat scale runs from zero to the target speed; arrow lengths are capped for legibility. This is a parametric vortex plus a simplified thermodynamic scale. Chosen inputs: $T_o=203$ K, $C_k/C_d=1$, air temperature $T_s-1$ K, relative humidity 80%, ambient pressure 1010 hPa, density 1.15 kg/m³; constant $c_p=1005$, $L_v=2.5\times10^6$ in SI units and a constant-$L_v$ Clausius–Clapeyron saturation law. These are model assumptions, not fitted hurricane measurements.`,
      deps: ['geo-3.3', 'geo-1.7', 'pchem-3.3'],
      refs: ['Vallis', 'Pierrehumbert'],
      tags: ['hurricane', 'potential intensity', 'gradient wind', 'warm core'],
      credit: 'Pressure-profile implementation: NOAA PaHM developers, Holland-model equations; dissipative heating: M. Bister and K. A. Emanuel, Meteorology and Atmospheric Physics 65 (1998), 233–240, §§3.1–3.2, Eq. 21',
      scope: String.raw`Steady axisymmetric balanced model above the boundary layer, with an illustrative surface enthalpy calculation. This is not the full potential-intensity algorithm, an observational bound, a forecast or a surface-wind category estimator. The geostrophic approximation becomes poor at large Rossby number. Sources: [Bister–Emanuel original](https://texmex.mit.edu/pub/emanuel/PAPERS/bisteremanuel98.pdf), [NOAA PaHM model derivation](https://noaa-ocs-modeling.github.io/PaHM/html/models.html).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Maximum_potential_intensity' },
      viz(v) {
        const frac=v.slider('fraction of the potential-intensity scale',.3,1,.8,{step:.01});
        const Bs=v.slider('profile shape $B$',1,2.5,1.4,{step:.05});
        const Rms=v.slider('pressure-profile radius $R$ (km)',10,100,35,{step:1});
        const lat=v.slider('latitude (°)',8,40,20,{step:1});
        const sP=v.stage({x:[-250,250],y:[-250,250],equal:true,axes:'box',gutter:true,xlabel:'east (km)',ylabel:'north (km)',height:380,weight:1,minWidth:280,title:'gradient speed: 0 → target (m/s)'});
        const sR=v.stage({x:[0,305],y:[.008,1e5],ylog:true,axes:'box',gutter:true,xlabel:'radius (km)',ylabel:'speed (m/s), log scale',height:380,weight:1.1,minWidth:280,title:'radial comparison ≥ 0.01 m/s'});
        const sS=v.stage({x:[17.4,33.6],y:[0,120],axes:'box',gutter:true,xlabel:'sea-surface temperature (°C)',ylabel:'intensity scale (m/s)',height:380,weight:1,minWidth:260,title:'fixed-environment intensity scale'});
        const hS=sS.handle(28,simplePI(28).V,{color:'gold',constrain:x=>{const t=clamp(x,18,33);return[t,simplePI(t).V];}});
        let st={};
        v.render(()=>{
          const pi=simplePI(hS.x),Mo=cycloneCalibration(frac.value*pi.V,Rms.value*1000,Bs.value,Math.abs(fcor(lat.value)));
          const at=r=>cycloneAt(r,Mo),Vr=r=>at(r).V;
          sP.heat((x,y)=>Vr(Math.hypot(x,y)*1000),{range:[0,Mo.V],cmap:'theme',color:'red',res:3,key:`${hS.x}|${frac.value}|${Bs.value}|${Rms.value}|${lat.value}`});
          sP.clip(()=>sP.contour((x,y)=>at(Math.hypot(x,y)*1000).p/100,[880,900,920,940,960,980,1000],{color:'ink',width:1,alpha:.5,labels:false}));
          for(const q of[1,2,3.4])for(let a=0;a<8;a++){const th=a*Math.PI/4+.2,r=q*Mo.R/1000,L=Math.min(3*Vr(r*1000),48);if(r>200)continue;const x=r*Math.cos(th),y=r*Math.sin(th);sP.arrow(x,y,x-Math.sin(th)*L,y+Math.cos(th)*L,{color:'ink',width:1.8,head:6});}
          sP.circle(0,0,Mo.R/1000,{color:'gold',width:1.6,dash:[5,4]});
          sP.text('R',Mo.R/1000*.71,Mo.R/1000*.71,{color:'gold',size:12,dx:8,dy:-8,plate:true});
          const rs=Array.from({length:601},(_,j)=>.01*(300/.01)**(j/600));
          rs.push(Mo.rmax/1000,Mo.R/1000);rs.sort((a,b)=>a-b);
          const curves=['V','geo','cyclo'].map(k=>rs.map(r=>[r,at(r*1000)[k]]));
          const top=Math.max(...curves.flat().map(p=>p[1]));sR.setView([0,305],[.008,top*1.35]);
          for(const[i,color]of['accent','purple','orange'].entries()){let segment=[];const flush=()=>{if(segment.length>1)sR.path(segment,{color,width:i?1.5:2.8,dash:i?[5,4]:undefined});segment=[];};for(const p of curves[i]){if(p[1]>=.01)segment.push(p);else flush();}flush();}
          sR.vline(Mo.R/1000,{color:'gold',dash:[4,4]});sR.dot(Mo.rmax/1000,Mo.V,{r:5,color:'accent'});
          sS.setView([17.4,33.6],[0,simplePI(33).V*1.15]);
          sS.fn(x=>simplePI(x).V,{domain:[18,33],color:'accent',n:120,width:2.6});
          sS.fn(x=>frac.value*simplePI(x).V,{domain:[18,33],color:'gold',n:120,width:1.6,dash:[5,4]});
          sS.text('SST',hS.x,pi.V,{color:'gold',size:11,align:hS.x>25?'right':'left',dx:hS.x>25?-12:12,dy:-14});
          st={Mo,pi,sst:hS.x,top};
        });
        v.legend([['accent','gradient wind'],['purple','geostrophic',{dash:true}],['orange','cyclostrophic',{dash:true}],['gold','R / target fraction',{dash:true}]]);
        v.readout(()=>{const{Mo,pi,sst}=st;return `SST ${v.fix(sst,2)} °C; intensity scale ${v.fix(pi.V,2)} m/s; target/actual peak ${v.fix(Mo.V,2)} m/s at ${v.fix(Mo.rmax/1000,2)} km (profile R=${v.fix(Mo.R/1000,0)} km).\nEnthalpy difference ${v.fix(pi.dk/1000,3)} kJ/kg; Carnot efficiency ${v.fix(pi.eta,3)}, recycled-heat factor ${v.fix(pi.eff,3)}. Central pressure ${v.fix(Mo.pc/100,2)} hPa; deficit ${v.fix(Mo.dp/100,2)} hPa. Peak Rossby number ${v.fix(Mo.V/(Mo.f*Mo.rmax),2)}; gradient-level speeds are not surface-wind categories.`;});
      },
    },
  ],
};
