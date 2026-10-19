// Atmosphere & Ocean Dynamics — Chapter 3: Balanced flow (items 3.6–3.9; 3.1–3.5 are in ch03.js)
import { clamp, RAD, TAU, fcor, sgn, log10, pAt, gradP, lapP, geoWind, adjustSim, etaFinal, cubicRoots, betaOf, potentialIntensity, hollandP, hollandV, deficitForVmax, hollandMaximum, RHO_TC } from './ch03.shared.js';

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
      verify: true,
      statement: String.raw`A tropical cyclone is a warm-core, nearly axisymmetric vortex that draws its energy from the enthalpy flux from the warm sea. Outside the core the wind is in **gradient-wind balance** (3.3); within the eyewall the Rossby number $V/fr$ is large, so the balance is nearly cyclostrophic. A parametric radial profile (Holland) $p(r)=p_c+(p_n-p_c)e^{-(R_m/r)^B}$ has its cyclostrophic wind maximum at the radius parameter $R_m$, with $V_{\max}\approx\sqrt{B\,\Delta p/(\rho e)}$, $\Delta p=p_n-p_c$. The Coriolis term shifts the gradient-wind maximum slightly inward. With dissipative heating included, the Bister–Emanuel thermodynamic model gives a potential intensity: the **maximum potential intensity** satisfies
$$V_p^2=\frac{C_k}{C_d}\,\frac{T_s-T_o}{T_o}\,\bigl(k_0^*-k\bigr),$$
with sea-surface temperature $T_s$, outflow temperature $T_o$, exchange coefficients $C_k$ and $C_d$ of enthalpy and momentum, and the enthalpy difference between the saturated sea surface and the boundary-layer air. Holding outflow temperature and the chosen boundary-layer humidity fixed, a warmer sea raises this illustrative bound.`,
      idea: String.raw`Air gains enthalpy from the warm sea and flows out at a colder temperature. The Carnot efficiency is $(T_s-T_o)/T_s$. Bister and Emanuel include the return of dissipated kinetic energy as atmospheric heat: in their simplified steady high-wind balance this replaces that factor by $(T_s-T_o)/T_o$ in the intensity equation (1998, eq. 21). This coefficient is not the ordinary Carnot efficiency. The prescribed pressure profile determines gradient wind through $V^2/r+fV=\rho^{-1}dp/dr$; solving it, and locating its maximum, sets the model's pressure deficit for the target speed.`,
      caption: String.raw`**Drag the gold handle** along the potential-intensity curve to change the sea-surface temperature, then set how much of the bound the storm reaches, the profile shape $B$, the cyclostrophic radius scale $R_m$ and the latitude. The plan view is the wind speed of the Holland vortex whose central pressure is chosen (numerically) so that its **gradient wind** peaks at the target speed; the middle panel compares that gradient wind with the geostrophic and cyclostrophic estimates. This is a **parametric vortex plus a simplified potential-intensity formula**, not a time-stepping hurricane simulation (the syllabus plan), and the numbers are model values: $T_o=203$ K, $C_k/C_d=1$, boundary-layer air at $T_s-1$ K and 80% humidity, so the potential intensity is only indicative at low SST.`,
      deps: ['geo-3.3', 'geo-1.7', 'thermo-2.7'],
      refs: ['Holland (1980), Mon. Weather Rev. 108, 1212–1218', 'Bister & Emanuel (1998), §3.1 eq. (21), p. 235'],
      tags: ['hurricane', 'potential intensity', 'gradient wind', 'warm core'],
      credit: 'radial profile: G. J. Holland, Monthly Weather Review 108 (1980) 1212–1218; dissipative-heating potential intensity: M. Bister & K. A. Emanuel (1998), Meteorol. Atmos. Phys. 65: 233–240',
      scope: String.raw`Axisymmetric, steady, gradient-wind balanced above the boundary layer; the maximum potential intensity is an upper bound that real storms rarely reach (shear, dry air, ocean cooling), and the simplified evaluation here (fixed outflow temperature) is not the full potential-intensity algorithm. The displayed wind is above-boundary-layer gradient wind; it is not a prediction of the surface sustained wind used in hurricane categories.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Maximum_potential_intensity' },
      viz(v) {
        const frac = v.slider('fraction of the potential intensity reached', 0.3, 1, 0.8, { step: 0.01 });
        const Bs = v.slider('profile shape $B$', 1, 2.5, 1.4, { step: 0.05 });
        const Rms = v.slider('cyclostrophic radius scale $R_m$ (km)', 10, 100, 35, { step: 1 });
        const lat = v.slider('latitude $\\varphi$ (°)', 8, 40, 20, { step: 1 });
        const sP = v.stage({ x: [-250, 250], y: [-250, 250], equal: true, axes: 'box', gutter: true, xlabel: 'distance east (km)', ylabel: 'north (km)', height: 380, weight: 1, minWidth: 280, title: 'wind speed (m/s), plan view' });
        const sR = v.stage({ x: [0, 300], y: [0, 100], axes: 'box', gutter: true, xlabel: 'radius $r$ (km)', ylabel: 'tangential wind (m/s)', height: 380, weight: 1.1, minWidth: 280, title: 'radial profile' });
        const sS = v.stage({ x: [18, 33], y: [0, 110], axes: 'box', gutter: true, xlabel: 'sea-surface temperature (°C)', ylabel: 'potential intensity $V_p$ (m/s)', height: 380, weight: 1, minWidth: 260, title: 'potential intensity vs SST' });
        const hS = sS.handle(28, potentialIntensity(28).V, { color: 'gold', label: 'SST', labelPos: 'nw', constrain: (x) => { const t = clamp(x, 18, 33); return [t, potentialIntensity(t).V]; } });
        const PN = 101000;
        let key = '', M = null, st = {};
        const model = (sst, fr, B, Rm, la) => {
          const k = `${sst}|${fr}|${B}|${Rm}|${la}`; if (k === key) return M; key = k;
          const f = Math.abs(fcor(la)), Vp = potentialIntensity(sst).V, Vt = fr * Vp, dp = deficitForVmax(Vt, Rm * 1e3, B, f);
          M = { f, Vp, Vt, dp, pc: PN - dp, Rm: Rm * 1e3, B }; return M;
        };
        v.render(() => {
          const sst = hS.x, Mo = model(Math.round(sst * 20) / 20, frac.value, Bs.value, Rms.value, lat.value);
          const Vr = (r) => hollandV(r, Mo.pc, PN, Mo.Rm, Mo.B, Mo.f);
          sP.heat((x, y) => Vr(Math.hypot(x, y) * 1e3), { range: [0, Math.max(40, Mo.Vt * 1.05)], cmap: 'theme', color: 'red', res: 3, key });
          sP.clip(() => sP.contour((x, y) => hollandP(Math.hypot(x, y) * 1e3, Mo.pc, PN, Mo.Rm, Mo.B) / 100, [880, 900, 920, 940, 960, 980, 1000], { color: 'ink', width: 1, alpha: 0.5, labels: false }));
          for (const q of [1, 2, 3.4]) for (let a = 0; a < 8; a++) {
            const th = a * Math.PI / 4 + 0.2, r = q * Mo.Rm / 1e3, V = Vr(r * 1e3), L = Math.min(5 * V, 80) ;
            if (r > 240) continue;
            const x = r * Math.cos(th), y = r * Math.sin(th);
            sP.arrow(x, y, x - Math.sin(th) * L * 0.6, y + Math.cos(th) * L * 0.6, { color: 'ink', width: 1.8, head: 6 });
          }
          sP.circle(0, 0, Mo.Rm / 1e3, { color: 'gold', width: 1.6, dash: [5, 4] });
          sP.text('$R_m$', Mo.Rm / 1e3 * 0.71, Mo.Rm / 1e3 * 0.71, { size: 12, color: 'gold', dx: 8, dy: -8, plate: true });
          // profile
          const rs = []; for (let r = 2; r <= 300; r += 2) rs.push(r);
          const G = (r) => (Mo.pc === PN ? 0 : (PN - Mo.pc) * Math.exp(-Math.pow(Mo.Rm / (r * 1e3), Mo.B)) * Mo.B * Math.pow(Mo.Rm / (r * 1e3), Mo.B) / (r * 1e3)) / RHO_TC;
          sR.setView([0, 300], [0, Math.max(40, Mo.Vt * 1.15)]);
          sR.clip(() => {
            sR.path(rs.map((r) => [r, Math.abs(G(r)) / Mo.f]), { color: 'purple', width: 1.6, dash: [5, 4] });
            sR.path(rs.map((r) => [r, Math.sqrt(r * 1e3 * G(r))]), { color: 'orange', width: 1.6, dash: [5, 4] });
          });
          sR.path(rs.map((r) => [r, Vr(r * 1e3)]), { color: 'accent', width: 3 });
          sR.vline(Mo.Rm / 1e3, { color: 'gold', dash: [4, 4] });
          // SST curve
          sS.fn((x) => potentialIntensity(x).V, { domain: [18, 33], color: 'accent', width: 2.6, n: 80 });
          sS.fn((x) => frac.value * potentialIntensity(x).V, { domain: [18, 33], color: 'gold', width: 1.6, dash: [5, 4] });
          const peak = hollandMaximum(Mo.pc, PN, Mo.Rm, Mo.B, Mo.f), mx = peak.speed, rmx = peak.radius / 1e3;
          st = { Mo, mx, rmx, sst: Math.round(sst * 20) / 20, pi: potentialIntensity(sst), Vr };
        });
        v.legend([['accent', 'gradient wind'], ['purple', 'geostrophic', { dash: true }], ['orange', 'cyclostrophic', { dash: true }], ['gold', 'target (fraction of $V_p$)', { dash: true }]]);
        v.readout(() => {
          const Mo = st.Mo, cyc = Math.sqrt(Mo.B * Mo.dp / (RHO_TC * Math.E)), Ro = st.mx / (Mo.f * st.rmx * 1e3);
          return `SST ${v.fix(st.sst, 1)} °C → potential intensity $V_p=${v.fix(Mo.Vp, 1)}$ m/s (enthalpy difference $k_0^*-k=${v.fix(st.pi.dk / 1000, 1)}$ kJ/kg, dissipative-heating coefficient $(T_s-T_o)/T_o=${v.fix(st.pi.eff, 3)}$); target **${v.fix(Mo.Vt, 1)} m/s** (gradient wind above the boundary layer)\ncentral pressure ${v.fix(Mo.pc / 100, 0)} hPa (deficit ${v.fix(Mo.dp / 100, 0)} hPa, ambient 1010 hPa); computed gradient-wind maximum ${v.fix(st.mx, 1)} m/s at ${v.fix(st.rmx, 0)} km; cyclostrophic estimate $\\sqrt{B\\Delta p/\\rho e}=${v.fix(cyc, 1)}$ m/s; Rossby number there $V/(fr_{\\mathrm{peak}})=${v.fix(Ro, 0)}$ (the Coriolis force is small in the eyewall, large far out)`;
        });
      },
    },
  ],
};
