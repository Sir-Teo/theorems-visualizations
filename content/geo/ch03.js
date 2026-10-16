// Atmosphere & Ocean Dynamics — Chapter 3: Balanced flow: geostrophy and thermal wind (items 3.1–3.5; 3.6–3.9 are in ch03-b.js)
import { clamp, OMEGA, RAD, TAU, fcor, sgn, log10, RGAS, pAt, gradP, lapP, geoWind, gradientRoots, TBAR, G0, ussaT } from './ch03.shared.js';

const fsafe = (lat) => { const f = fcor(lat); return Math.abs(f) < 1e-6 ? (f < 0 ? -1e-6 : 1e-6) : f; };

export default {
  collection: 'geo',
  chapter: 3,
  title: 'Balanced flow: geostrophy and thermal wind',
  summary: String.raw`Away from the equator and the boundaries, large-scale winds and currents blow along isobars, with the pressure gradient balanced by the Coriolis force. Curvature adds centrifugal terms (gradient and cyclostrophic wind), horizontal temperature gradients make the geostrophic wind change with height (thermal wind), and a disturbed fluid adjusts to balance over the Rossby deformation radius.`,
  items: [
    // ------------------------------------------------------------------ 3.1
    {
      num: '3.1', kind: 'Law', name: 'Geostrophic balance',
      statement: String.raw`When the Rossby number $\mathrm{Ro}=U/fL$ of a horizontal flow is small and friction is negligible, the horizontal pressure-gradient force and the Coriolis force nearly cancel:
$$f\,\hat{\mathbf k}\times\mathbf u_g=-\frac1\rho\nabla_h p\qquad\Longleftrightarrow\qquad u_g=-\frac{1}{\rho f}\frac{\partial p}{\partial y},\quad v_g=\frac{1}{\rho f}\frac{\partial p}{\partial x}.$$
The **geostrophic wind** blows along the isobars (with low pressure on its left in the northern hemisphere, on its right in the southern), and its speed is $|\nabla p|/(\rho|f|)$: closer isobars mean a stronger wind, and the same gradient drives a faster wind at lower latitude. The approximation fails as $f\to0$ near the equator, where $\mathrm{Ro}$ is no longer small.`,
      idea: String.raw`Start from the horizontal momentum equation and divide the terms by their size (2.3): the acceleration $D\mathbf u/Dt$ is $O(\mathrm{Ro})$ compared with the Coriolis force $f\hat{\mathbf k}\times\mathbf u$, so at leading order only Coriolis and the pressure gradient are left. A parcel pushed toward low pressure is deflected by the Coriolis force until it moves at right angles to the pressure force, where the two cancel: it neither accelerates down the gradient nor loses speed, so it circulates along the isobar. The Coriolis force does no work, which is why a steady wind along the isobars is possible at all.`,
      caption: String.raw`**Drag the low (L), the high (H) and the gold probe** on the sea-level pressure map; the arrows are the geostrophic wind computed from the pressure gradient at each grid point (scaled 12 km per m/s), contours every 4 hPa. At the probe the red arrow is the pressure-gradient force, the blue one the Coriolis force on the geostrophic wind, and they are equal and opposite. **Slide the latitude**, through the equator if you like: the wind reverses direction, strengthens as $1/\sin\varphi$ and, where $\mathrm{Ro}$ approaches one (arrows turn red), geostrophy no longer applies. The right panel plots the speed at the probe's gradient against latitude. Illustrative Gaussian pressure systems, not observed data.`,
      deps: ['geo-2.3', 'fluid-3.10'],
      refs: ['Vallis'],
      tags: ['geostrophic wind', 'Coriolis', 'pressure gradient'],
      scope: String.raw`Requires $\mathrm{Ro}\ll1$, negligible friction and a flow slowly varying in time, and $|f|$ not too small; it says nothing about the part of the flow that is not balanced (gravity waves, boundary layers, motion near the equator).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Geostrophic_current' },
      viz(v) {
        const lat = v.slider('latitude $\\varphi$ (°)', -60, 60, 45, { step: 1 });
        const sM = v.stage({ x: [-1600, 1600], y: [-1600, 1600], equal: true, axes: 'box', gutter: true, xlabel: 'east (km)', ylabel: 'north (km)', height: 430, weight: 1.5, minWidth: 320, title: 'sea-level pressure and geostrophic wind' });
        const sV = v.stage({ x: [0, 70], y: [0, 70], axes: 'box', gutter: true, xlabel: '|latitude| (°)', ylabel: 'speed (m/s)', height: 430, weight: 0.9, minWidth: 250, title: 'same gradient, different latitude' });
        const C = [{ x: -400, y: 200, a: -20, s: 520 }, { x: 800, y: -500, a: 11, s: 450 }];
        const hL = sM.handle(C[0].x, C[0].y, { color: 'blue', label: 'L' });
        const hH = sM.handle(C[1].x, C[1].y, { color: 'red', label: 'H' });
        const hP = sM.handle(250, -250, { color: 'gold', label: 'probe' });
        const LS = 500e3, RHO = 1.2, K = 12;
        let st = {};
        v.render(() => {
          C[0].x = hL.x; C[0].y = hL.y; C[1].x = hH.x; C[1].y = hH.y;
          const f = fsafe(lat.value);
          const lv = []; for (let p = 940; p <= 1040; p += 4) lv.push(p);
          sM.clip(() => sM.contour((x, y) => pAt(C, x, y), lv, { color: 'muted', width: 1.1, labels: true, fmt: (q) => String(Math.round(q)) }));
          for (let gx = -1200; gx <= 1200; gx += 400) for (let gy = -1200; gy <= 1200; gy += 400) {
            const [wu, wv] = geoWind(gradP(C, gx, gy), f, RHO), sp = Math.hypot(wu, wv), Ro = sp / (Math.abs(f) * LS);
            if (sp < 0.3) continue;
            const L = Math.min(K * sp, 330) / sp;
            sM.arrow(gx, gy, gx + wu * L, gy + wv * L, { color: Ro > 0.5 ? 'orange' : 'accent', width: 2, head: 7 });
          }
          // probe: forces
          const g = gradP(C, hP.x, hP.y), [wu, wv] = geoWind(g, f, RHO), sp = Math.hypot(wu, wv);
          const FS = 1.1e5; // km per (m/s²)
          const pgf = [-g[0] / RHO, -g[1] / RHO], cor = [f * wv, -f * wu]; // −f k×u = (f v, −f u)
          const cl = (a) => { const m = Math.hypot(a[0], a[1]) * FS; return m > 420 ? 420 / m : 1; };
          const kk = Math.min(cl(pgf), cl(cor));
          sM.arrow(hP.x, hP.y, hP.x + pgf[0] * FS * kk, hP.y + pgf[1] * FS * kk, { color: 'red', width: 2.6 });
          sM.arrow(hP.x, hP.y, hP.x + cor[0] * FS * kk, hP.y + cor[1] * FS * kk, { color: 'blue', width: 2.6 });
          if (sp > 0.3) { const L = Math.min(K * sp, 330) / sp; sM.arrow(hP.x, hP.y, hP.x + wu * L, hP.y + wv * L, { color: 'ink', width: 3 }); }
          st = { g, sp, f, Ro: sp / (Math.abs(f) * LS), pgf, cor, wu, wv };
          // speed vs latitude at the probe's gradient
          const gm = Math.hypot(g[0], g[1]);
          sV.clip(() => {
            sV.fn((x) => gm / (RHO * Math.abs(fcor(Math.max(x, 0.05)))), { domain: [0.5, 70], color: 'accent', width: 2.6, n: 140 });
            sV.fn((x) => Math.abs(fcor(x)) * LS, { domain: [0, 70], color: 'green', width: 1.8, dash: [6, 4] });
          });
          sV.text('geostrophic speed $|\\nabla p|/\\rho|f|$', 69, 10, { color: 'accent', size: 12, align: 'right' });
          sV.text('Ro = 1 line for $L=500$ km', 69, 4, { color: 'green', size: 12, align: 'right' });
          sV.dot(Math.abs(lat.value), clamp(sp, 0, 69), { r: 7, color: 'gold' });
        });
        v.legend([['accent', 'geostrophic wind'], ['orange', 'Ro > 0.5: geostrophy doubtful'], ['ink', 'wind at probe'], ['blue', 'Coriolis force'], ['red', 'pressure-gradient force']]);
        v.readout(() => {
          const gm = Math.hypot(st.g[0], st.g[1]), ang = Math.acos(clamp((st.wu * st.g[0] + st.wv * st.g[1]) / (st.sp * gm + 1e-30), -1, 1)) / RAD;
          const resid = Math.hypot(st.pgf[0] + st.cor[0], st.pgf[1] + st.cor[1]);
          return `$\\varphi=${sgn(v, lat.value, 0)}^\\circ$, $f=${sgn(v, st.f * 1e4, 2)}\\times10^{-4}\\,\\mathrm{s^{-1}}$ · at the probe $|\\nabla p|=${v.fix(gm * 1e5 / 100, 2)}$ hPa per 100 km → $V_g=|\\nabla p|/\\rho|f|=$ **${v.fix(st.sp, 1)} m/s**; angle between wind and $\\nabla p$ = ${v.fix(ang, 1)}° (the wind is along the isobar)\nresidual of the force balance $|\\mathrm{PGF}+\\mathrm{Cor}|=${v.sci(resid, 1)}\\,\\mathrm{m\\,s^{-2}}$ against $|\\mathrm{PGF}|=${v.sci(Math.hypot(st.pgf[0], st.pgf[1]), 2)}$ · Rossby number $V_g/(|f|\\cdot500\\ \\mathrm{km})=${v.fix(st.Ro, 2)}$ ${st.Ro > 0.5 ? '— too large for geostrophic balance to be trusted' : ''}`;
        });
      },
    },

    // ------------------------------------------------------------------ 3.2
    {
      num: '3.2', kind: 'Law', name: 'Buys Ballot’s law',
      statement: String.raw`In the northern hemisphere, an observer who stands with their back to the wind has low pressure on their left (and high pressure on their right); in the southern hemisphere the sides are exchanged. The rule holds for the large-scale, near-surface and free-atmosphere wind away from the equator, where the wind is nearly geostrophic; it is a statement about the direction of the pressure gradient relative to the wind, $\nabla p\parallel\rho f\,(v_g,-u_g)$, whatever the shape of the pressure pattern.`,
      idea: String.raw`It is the geostrophic relation 3.1 read as a left–right rule. Solving $f\hat{\mathbf k}\times\mathbf u=-\nabla p/\rho$ for $\nabla p$ gives $\nabla p=\rho f\,(v,-u)$, which is the wind vector turned $90^\circ$ **clockwise** times $\rho f$. So high pressure is to the right of the wind where $f>0$ and to the left where $f<0$, with low pressure on the other side. The sign of $f$ (2.1) is the only thing that distinguishes the hemispheres.`,
      caption: String.raw`**Drag the gold observer** (who faces downwind) and the pressure systems; the wind is the geostrophic wind of the map. The left panel is the map, the right is the observer's own view (always facing up the page), with the direction toward lower pressure marked on a dial. **Move the map's latitude across the equator**: the low-pressure side is on the left for $\varphi>0$, on the right for $\varphi<0$, and the rule has no meaning in the narrow band where $f\approx0$. The check at the bottom compares the pressure 100 km to the observer's left and right. Illustrative pressure systems.`,
      deps: ['geo-3.1'],
      refs: ['Vallis'],
      tags: ['Buys Ballot', 'geostrophic wind'],
      credit: 'C. H. D. Buys Ballot, Comptes Rendus 45 (1857), 765–768; W. Ferrel had argued the same from theory in 1856',
      scope: String.raw`Holds where the wind is close to geostrophic (outside the tropics and the boundary layer; near the ground friction turns the wind by 10–40° toward low pressure, 3.6), so it is a rule of thumb accurate to some tens of degrees.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Buys_Ballot%27s_law' },
      viz(v) {
        const lat = v.slider('latitude of the map $\\varphi$ (°)', -30, 30, 40, { step: 1 });
        const sys = v.select('pressure pattern', [{ value: 'low', label: 'a low' }, { value: 'high', label: 'a high' }, { value: 'both', label: 'low + high' }], 'low');
        const sM = v.stage({ x: [-1500, 1500], y: [-1500, 1500], equal: true, axes: 'box', gutter: true, xlabel: 'east (km)', ylabel: 'north (km)', height: 400, weight: 1.4, minWidth: 300, title: 'weather map' });
        const sO = v.stage({ x: [-1.3, 1.3], y: [-1.3, 1.3], equal: true, axes: false, height: 400, weight: 1, minWidth: 250, title: 'what the observer sees (facing downwind)' });
        const mk = () => sys.value === 'low' ? [{ x: -250, y: 150, a: -26, s: 520 }] : sys.value === 'high' ? [{ x: -250, y: 150, a: 18, s: 520 }] : [{ x: -450, y: 250, a: -26, s: 480 }, { x: 650, y: -350, a: 18, s: 450 }];
        let C = mk(), sysKey = sys.value;
        const me = sM.handle(500, 150, { color: 'gold', label: 'you' });
        const lowH = sM.handle(-250, 150, { color: 'blue', label: '' });
        let st = {};
        v.render(() => {
          if (sysKey !== sys.value) { sysKey = sys.value; C = mk(); lowH.set(C[0].x, C[0].y); }
          C[0].x = lowH.x; C[0].y = lowH.y;
          const f = fsafe(lat.value), lv = []; for (let p = 940; p <= 1040; p += 4) lv.push(p);
          sM.clip(() => sM.contour((x, y) => pAt(C, x, y), lv, { color: 'muted', width: 1, labels: true, fmt: (q) => String(Math.round(q)) }));
          for (let gx = -1200; gx <= 1200; gx += 400) for (let gy = -1200; gy <= 1200; gy += 400) {
            const [wu, wv] = geoWind(gradP(C, gx, gy), f), sp = Math.hypot(wu, wv); if (sp < 0.3) continue;
            const L = Math.min(11 * sp, 300) / sp; sM.arrow(gx, gy, gx + wu * L, gy + wv * L, { color: 'faint', width: 1.6, head: 6 });
          }
          for (const c of C) sM.text(c.a < 0 ? 'L' : 'H', c.x, c.y, { dy: -4, size: 16, color: c.a < 0 ? 'blue' : 'red', align: 'center', baseline: 'middle' });
          const g = gradP(C, me.x, me.y), [wu, wv] = geoWind(g, f), sp = Math.hypot(wu, wv);
          const dir = sp > 0.05 ? [wu / sp, wv / sp] : [0, 1], left = [-dir[1], dir[0]];
          const pl = pAt(C, me.x + 100 * left[0], me.y + 100 * left[1]), pr = pAt(C, me.x - 100 * left[0], me.y - 100 * left[1]);
          sM.arrow(me.x, me.y, me.x + dir[0] * Math.min(11 * sp, 320), me.y + dir[1] * Math.min(11 * sp, 320), { color: 'ink', width: 3 });
          sM.arrow(me.x, me.y, me.x + left[0] * 160, me.y + left[1] * 160, { color: 'green', width: 1.8, head: 6 });
          // observer's own frame: facing = up. direction toward lower pressure (−∇p) in that frame
          const gm = Math.hypot(g[0], g[1]) + 1e-30, dn = [-g[0] / gm, -g[1] / gm];
          const px = dn[0] * left[0] + dn[1] * left[1] * 1, // component along observer's left
            fw = dn[0] * dir[0] + dn[1] * dir[1];
          const ox = -px, oy = fw; // left = −x on the dial (facing up = +y)
          sO.circle(0, 0, 1.05, { color: 'muted', width: 1.2, fill: 'blue', fillAlpha: 0.04 });
          sO.rect(-1.05, -1.05, 0, 1.05, { color: 'green', fill: 'green', fillAlpha: 0.05, stroke: false });
          sO.line(0, -1.1, 0, 1.1, { color: 'faint', dash: [4, 4] });
          sO.text('LEFT', -0.55, -0.7, { size: 12, color: 'green', align: 'center' });
          sO.text('RIGHT', 0.55, -0.7, { size: 12, color: 'muted', align: 'center' });
          sO.arrow(0, -0.05, 0, 0.85, { color: 'ink', width: 3 });
          sO.text('facing downwind', 0, 1.2, { size: 11, color: 'ink', align: 'center' });
          sO.dot(0, 0, { r: 9, color: 'gold' });
          if (sp > 0.05 && Math.abs(f) > 1.5e-5) {
            sO.arrow(0, 0, ox * 0.95, oy * 0.95, { color: 'blue', width: 3 });
            sO.text('toward lower pressure', ox * 0.95, oy * 0.95, { size: 11, color: 'blue', dx: ox < 0 ? -2 : 2, dy: -12, align: ox < 0 ? 'left' : 'right', plate: true });
          }
          st = { f, sp, pl, pr, ox, oy };
        });
        v.legend([['ink', 'wind'], ['blue', 'toward lower pressure'], ['green', 'your left']]);
        v.readout(() => {
          const side = st.pl < st.pr ? 'LEFT' : 'RIGHT', expect = st.f > 0 ? 'LEFT' : 'RIGHT';
          if (Math.abs(st.f) < 1.5e-5) return `$f=${v.fix(st.f * 1e4, 2)}\\times10^{-4}\\,\\mathrm{s^{-1}}$: too close to the equator, the rule fails (the wind need not follow the isobars).`;
          return `$f=${sgn(v, st.f * 1e4, 2)}\\times10^{-4}\\,\\mathrm{s^{-1}}$ (${st.f > 0 ? 'northern' : 'southern'} hemisphere) · wind ${v.fix(st.sp, 1)} m/s\npressure 100 km to your left ${v.fix(st.pl, 2)} hPa, to your right ${v.fix(st.pr, 2)} hPa → low pressure is on your **${side}**; Buys Ballot predicts ${expect} ${side === expect ? '✓' : '✗'}`;
        });
      },
    },

    // ------------------------------------------------------------------ 3.3
    {
      num: '3.3', kind: 'Proposition', name: 'Gradient wind and cyclostrophic balance',
      statement: String.raw`For steady, frictionless, circular flow of tangential speed $V$ at radius $r$ (counted positive for anticlockwise, cyclonic in the north), the radial momentum balance is
$$\frac{V^2}{r}+fV=\frac1\rho\frac{\partial p}{\partial r}\equiv G\quad\Longrightarrow\quad V=-\frac{fr}{2}\pm\sqrt{\frac{f^2r^2}{4}+rG}.$$
Around a low ($G>0$) the physical root has $V<V_g=G/f$: the **gradient wind is sub-geostrophic**; around a high ($G<0$) it is **super-geostrophic**, and a real root exists only if $G\ge-f^2r/4$: the pressure gradient at the centre of a high cannot exceed $\rho f^2r/4$. When $|f|r\ll V$ (a tornado, a dust devil) the Coriolis term drops and $V=\sqrt{rG}$ is **cyclostrophic balance**, in which the centrifugal force alone opposes the pressure force and either sense of rotation is possible.`,
      idea: String.raw`Replace the straight-line geostrophic balance of 3.1 by the radial equation of motion in a frame following the circular path: the new term is the centrifugal acceleration $V^2/r$. This turns the linear balance into a quadratic in $V$ for given $G$, solved by the quadratic formula. Around a low the centrifugal force and Coriolis force both point outward and share the job of opposing the inward pressure force, so each is smaller than if alone: slower than geostrophic. Around a high the centrifugal force points outward and the pressure force too, and only the inward Coriolis force can balance them, which caps the pressure gradient at $\rho f^2 r/4$ (the discriminant); for $\mathrm{Ro}=V/fr\gg1$ the root tends to $\sqrt{rG}$.`,
      caption: String.raw`**Choose a system** and set the radius, the pressure gradient and the latitude, or press a preset (the synoptic low, a high, a hurricane eyewall, a tornado: round illustrative numbers, not measurements). The left panel shows the three forces on a parcel at the east point of its circle; the right panel is universal: the ratio $V/V_g$ against $|\mathrm{Ro}_g|=|V_g|/(|f|r)$ on a log axis, for lows (green) and highs (red, ending at $1/4$ where the gradient is at its maximum); the dashed red branch is the "anomalous" root. **Raise the gradient on a high** until the solution disappears.`,
      deps: ['geo-3.1'],
      refs: ['Vallis'],
      tags: ['gradient wind', 'cyclostrophic balance', 'centrifugal force'],
      scope: String.raw`Steady, axisymmetric, frictionless, horizontal flow with the pressure and density gradient given; for the boundary layer, time dependence or strongly asymmetric vortices additional terms appear.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Gradient_wind' },
      viz(v) {
        const sysSel = v.select('system', [{ value: 1, label: 'low' }, { value: -1, label: 'high' }], 1);
        const rS = v.slider('radius $r$ (km)', 0.05, 2000, 800, { log: true, sig: 2 });
        const gS = v.slider('pressure gradient (hPa per 100 km)', 0.05, 1e6, 2.5, { log: true, sig: 2 });
        const lat = v.slider('latitude $\\varphi$ (°)', 5, 85, 45, { step: 1 });
        const preset = (r, g, la, s) => () => { rS.set(r); gS.set(g); lat.set(la); sysSel.set(s); v.invalidate(); };
        v.button('synoptic low', preset(800, 2.5, 45, 1));
        v.button('anticyclone', preset(800, 1.5, 45, -1));
        v.button('hurricane eyewall', preset(30, 100, 20, 1));
        v.button('tornado', preset(0.1, 5.9e4, 40, 1));
        const sD = v.stage({ x: [-1.15, 2.6], y: [-1.15, 1.15], equal: true, axes: false, height: 380, weight: 1, minWidth: 260, title: 'forces on a parcel (plan view)' });
        const sR = v.stage({ x: [0.01, 1e6], xlog: true, y: [0, 2.4], axes: 'box', gutter: true, xlabel: '$|\\mathrm{Ro}_g|=|V_g|/(|f|r)$', ylabel: '$V/V_g$', height: 380, weight: 1.2, minWidth: 280, title: 'gradient wind relative to geostrophic' });
        const RHO = 1.2;
        let st = {};
        v.render(() => {
          const s = sysSel.value, r = rS.value * 1e3, f = fcor(lat.value), Gmag = gS.value * 100 / 1e5 / RHO, G = s * Gmag; // m/s²
          const Vg = G / f, Rog = Vg / (f * r), roots = gradientRoots(f, r, G);
          const ok = !!roots;
          // diagram
          for (const q of [1.0, 0.7, 0.4]) sD.circle(0, 0, q, { color: 'faint', width: 1, dash: [3, 4] });
          sD.text(s > 0 ? 'L' : 'H', 0, 0, { size: 22, color: s > 0 ? 'blue' : 'red', align: 'center', baseline: 'middle' });
          const px = 1.0;
          if (ok) {
            const V = roots.reg, cen = V * V / r, cor = f * V, pg = -G; // outward-positive accelerations on the parcel
            const sc = 0.75 / Math.max(Math.abs(cen), Math.abs(cor), Math.abs(pg), 1e-30);
            const A = (val, y0, col, lab) => { sD.arrow(px, y0, px + val * sc, y0, { color: col, width: 3 }); sD.text(lab, px + val * sc, y0, { size: 12, color: col, dy: -12, dx: val * sc >= 0 ? 6 : -6, align: val * sc >= 0 ? 'left' : 'right', plate: true }); };
            sD.dot(px, 0, { r: 7, color: 'gold' });
            A(pg, 0.0, 'red', 'PGF'); A(cen, 0.28, 'orange', 'centrifugal'); A(cor, -0.28, 'blue', 'Coriolis');
            sD.arrow(px, 0.62, px, 0.62 + Math.sign(V) * 0.35, { color: 'ink', width: 2.4 });
            sD.text(`V = ${sgn(v, V, 1)} m/s`, px, 0.62, { size: 12, color: 'ink', dx: 8, dy: -4, align: 'left', plate: true });
            sD.text(V > 0 ? 'anticlockwise' : 'clockwise', 0, -0.98, { size: 12, color: 'muted', align: 'center' });
            st = { ok, V, Vg, Rog, cen, cor, pg, f, r };
          } else {
            sD.text('no real root:', 0, 0.25, { size: 14, color: 'red', align: 'center' });
            sD.text('gradient exceeds ρf²r/4', 0, -0.2, { size: 13, color: 'red', align: 'center' });
            st = { ok, V: NaN, Vg, Rog, f, r, Gmax: RHO * f * f * r / 4 };
          }
          // universal curve
          const lowR = (x) => (Math.sqrt(1 + 4 * x) - 1) / (2 * x);
          sR.hline(1, { color: 'muted', dash: [5, 4] });
          sR.fn(lowR, { domain: [0.01, 1e6], color: 'green', width: 2.6, n: 300 });
          sR.fn((x) => { const D = 1 - 4 * x; return D < 0 ? NaN : (Math.sqrt(D) - 1) / (-2 * x); }, { domain: [0.01, 0.25], color: 'red', width: 2.6, n: 100 });
          sR.fn((x) => { const D = 1 - 4 * x; return D < 0 ? NaN : (-Math.sqrt(D) - 1) / (-2 * x); }, { domain: [0.01, 0.25], color: 'red', width: 1.4, n: 100, alpha: 0.5 });
          sR.fn((x) => 1 / Math.sqrt(x), { domain: [1, 1e6], color: 'orange', width: 1.4, dash: [4, 4], alpha: 0.9 });
          sR.text('cyclostrophic limit $V/V_g=\\mathrm{Ro}_g^{-1/2}$', 40, 1.5, { size: 11, color: 'orange', align: 'left', dy: -2 });
          sR.text('low: $V<V_g$', 3e3, 0.45, { size: 12, color: 'green', align: 'center' });
          sR.text('high: $V>V_g$', 0.014, 1.35, { size: 12, color: 'red', align: 'left' });
          sR.text('anomalous', 0.0115, 2.25, { size: 11, color: 'red', align: 'left' });
          const xr = clamp(Math.abs(Rog), 0.0101, 9.9e5);
          if (ok) sR.dot(xr, Math.abs(Vg) > 0 ? roots.reg / Vg : 1, { r: 7, color: 'gold' });
          else sR.vline(xr, { color: 'red', dash: [4, 4] });
        });
        v.legend([['green', 'low (G > 0)'], ['red', 'high (G < 0)'], ['gold', 'your flow']]);
        v.readout(() => {
          if (!st.ok) return `Gradient ${v.fix(gS.value, 2)} hPa/100 km at $r=${v.fix(rS.value, 1)}$ km is above the maximum $\\rho f^2 r/4$ = ${v.sci(st.Gmax, 2)} Pa/m for a high: no steady circular flow exists, the isobars of a real anticyclone cannot be this tight.`;
          const resid = Math.abs(st.cen + st.cor + st.pg);
          return `$V_g=G/f=${sgn(v, st.Vg, 2)}$ m/s · gradient wind $V=${sgn(v, st.V, 2)}$ m/s (${v.fix(st.V / st.Vg * 100, 0)}% of geostrophic) · $|\\mathrm{Ro}_g|=${v.sci(Math.abs(st.Rog), 2)}$ · Rossby number of the flow $V/fr=${v.sci(Math.abs(st.V / (st.f * st.r)), 2)}$\nforce balance (outward positive): centrifugal $${v.sci(st.cen, 2)}$ + Coriolis $${v.sci(st.cor, 2)}$ + pressure $${v.sci(st.pg, 2)}$ $=${v.sci(resid, 1)}$ m/s²; cyclostrophic estimate $\\sqrt{r|G|}$ = ${v.fix(Math.sqrt(st.r * Math.abs(st.pg)), 2)} m/s`;
        });
      },
    },

    // ------------------------------------------------------------------ 3.4
    {
      num: '3.4', kind: 'Theorem', name: 'Thermal wind balance',
      statement: String.raw`If the flow is in geostrophic balance on every pressure surface and the atmosphere is hydrostatic, then the vertical shear of the geostrophic wind is set by the horizontal temperature gradient on pressure surfaces:
$$\frac{\partial\mathbf u_g}{\partial\ln p}=-\frac{R}{f}\,\hat{\mathbf k}\times\nabla_pT,\qquad\text{i.e.}\qquad \frac{\partial u_g}{\partial\ln p}=\frac Rf\frac{\partial T}{\partial y},\quad \frac{\partial v_g}{\partial \ln p}=-\frac Rf\frac{\partial T}{\partial x}.$$
Equivalently, in height coordinates $\partial u_g/\partial z=-(g/fT)\,\partial T/\partial y$. Thus where the air is colder to the north (as in the winter northern hemisphere) the westerly wind increases with height, in proportion to the temperature gradient; reverse the gradient and the shear reverses. The wind difference between two levels is $\mathbf u_T=\mathbf u_g(p_1)-\mathbf u_g(p_0)=(R/f)\ln(p_0/p_1)\,\hat{\mathbf k}\times\nabla_p\bar T$ with $\bar T$ the layer-mean temperature.`,
      idea: String.raw`Write geostrophic balance on a pressure surface as $f\mathbf u_g=\hat{\mathbf k}\times\nabla_p\Phi$ with $\Phi$ the geopotential, and differentiate with respect to $\ln p$. Hydrostatic balance (1.1) gives $\partial\Phi/\partial\ln p=-RT$, so the shear is $\partial\mathbf u_g/\partial\ln p=-(R/f)\,\hat{\mathbf k}\times\nabla_pT$: only the horizontal temperature gradient survives, because the surface-pressure part of $\nabla\Phi$ is independent of height. Warm columns are thick (the pressure surfaces rise further above those in cold columns), so the slope of pressure surfaces relative to horizontal grows with height; geostrophic wind is proportional to that slope, hence the wind rises with the thickness gradient.`,
      caption: String.raw`**Set the temperature difference across the 4000 km domain** (colder to the north for positive values), the surface wind and the latitude. The left panel shows the tilt of six pressure surfaces: the geopotential height at each level of a column is found by integrating the hydrostatic equation numerically, the surface wind setting the slope of the 1000 hPa surface, and the geostrophic wind is then computed by differencing the height field. The right panel compares that numerically obtained wind (dots) with the thermal-wind formula (line). Reverse the temperature gradient or cross the equator, and the shear reverses. Idealised, height-independent gradient $\partial T/\partial y$ on a standard-atmosphere reference profile.`,
      deps: ['geo-3.1', 'geo-1.1'],
      refs: ['Vallis'],
      tags: ['thermal wind', 'thickness', 'baroclinic'],
      scope: String.raw`Hydrostatic, geostrophic flow ($\mathrm{Ro}\ll1$, away from the equator); friction and the boundary layer, and phase changes of water, are ignored here.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Thermal_wind' },
      viz(v) {
        const dT = v.slider('temperature drop toward the north $\\Delta T$ (K per 4000 km)', -40, 40, 20, { step: 1 });
        const u0 = v.slider('surface wind $u_0$ (m/s)', -10, 20, 5, { step: 1 });
        const lat = v.slider('latitude $\\varphi$ (°)', -70, 70, 45, { step: 1 });
        const sT = v.stage({ x: [-2000, 2000], y: [-1, 1], axes: 'box', gutter: true, xlabel: 'north–south distance $y$ (km)', ylabel: 'height anomaly (m)', height: 400, weight: 1.2, minWidth: 300, title: 'tilt of the pressure surfaces' });
        const sU = v.stage({ x: [-10, 80], y: [0, 14], axes: 'box', gutter: true, xlabel: 'geostrophic wind $u_g$ (m/s)', ylabel: 'height (km)', height: 400, weight: 1, minWidth: 250, title: 'wind profile' });
        const PL = [1000, 850, 700, 500, 300, 200], NY = 81;
        const COL = ['purple', 'blue', 'teal', 'green', 'orange', 'red'];
        let st = {};
        /** geopotential Φ(y, p) with Φ(y, 1000 hPa) = −f u0 y */
        const Phi = (y, p, f, tau) => {
          const n = 64, a = Math.log(1000), b = Math.log(p), h = (b - a) / n; // from p0 down to p: Φ = Φ0 + R ∫_p^{p0} T dlnp
          let s = 0; const T = (lp) => TBAR(Math.exp(lp)) + tau * y;
          for (let i = 0; i <= n; i++) s += (i === 0 || i === n ? 1 : i % 2 ? 4 : 2) * T(a + i * h);
          return -f * u0.value * y + RGAS * Math.abs(s * h / 3) * (p < 1000 ? 1 : -1);
        };
        v.render(() => {
          const f = fsafe(lat.value), tau = -dT.value / 4e6; // K per m
          const ys = []; for (let i = 0; i < NY; i++) ys.push(-2000 + 4000 * i / (NY - 1));
          const prof = PL.map((p) => ys.map((y) => Phi(y * 1e3, p, f, tau) / G0));
          const mid = (k) => prof[k][(NY - 1) / 2];
          const lim = Math.max(30, ...prof.map((a, k) => Math.max(...a.map((z) => Math.abs(z - mid(k))))));
          sT.setView([-2000, 2000], [-lim * 1.15, lim * 1.15]);
          sT.hline(0, { color: 'faint' });
          PL.forEach((p, k) => { sT.path(ys.map((y, i) => [y, prof[k][i] - mid(k)]), { color: COL[k], width: 2.4 }); });
          sT.text(dT.value > 0 ? 'cold →' : 'warm →', 1900, -lim, { size: 12, color: dT.value > 0 ? 'blue' : 'red', align: 'right', dy: -10 });
          sT.text(dT.value > 0 ? '← warm' : '← cold', -1900, -lim, { size: 12, color: dT.value > 0 ? 'red' : 'blue', align: 'left', dy: -10 });
          // numerical geostrophic wind at y = 0 and formula
          const dy = 100e3, num = [], frm = [], zc = [];
          const uTot = [];
          PL.forEach((p) => {
            const u = -(Phi(dy, p, f, tau) - Phi(-dy, p, f, tau)) / (2 * dy) / f;
            num.push(u);
            frm.push(u0.value - (RGAS / f) * tau * Math.log(1000 / p));
            zc.push(Phi(0, p, f, tau) / G0 / 1e3);
          });
          const zz = []; for (let q = 0; q <= 80; q++) { const p = 1000 * Math.pow(0.18, q / 80); zz.push([u0.value - (RGAS / f) * tau * Math.log(1000 / p), Phi(0, p, f, tau) / G0 / 1e3]); }
          sU.setView([Math.min(-10, ...num, ...frm) - 2, Math.max(40, ...num, ...frm) + 6], [0, 14]);
          sU.vline(0, { color: 'faint' });
          sU.path(zz, { color: 'accent', width: 2.4 });
          num.forEach((u, k) => { sU.dot(u, zc[k], { r: 6, color: COL[k] }); });
          
          st = { f, tau, num, frm, zc };
        });
        v.legend([['accent', 'thermal-wind formula'], ...PL.map((p, k) => [COL[k], `${p} hPa (numerical wind)`, { dot: true }])]);
        v.readout(() => {
          const k = 3, err = Math.max(...st.num.map((u, i) => Math.abs(u - st.frm[i])));
          const th = (st.zc[3] - st.zc[0]) * 1000;
          return `$f=${sgn(v, st.f * 1e4, 2)}\\times10^{-4}\\,\\mathrm{s^{-1}}$, $\\partial T/\\partial y=${sgn(v, st.tau * 1e6, 2)}\\times10^{-6}$ K/m · at 500 hPa (z ≈ ${v.fix(st.zc[k], 1)} km) the wind is **${sgn(v, st.num[k], 1)} m/s**, the formula gives ${sgn(v, st.frm[k], 1)} m/s; largest difference over the six levels ${v.fix(err, 2)} m/s\nshear between 1000 and 500 hPa: ${sgn(v, st.num[k] - st.num[0], 1)} m/s ($\\propto\\Delta T/f$): ${st.num[k] > st.num[0] ? 'the wind increases with height' : st.num[k] < st.num[0] ? 'the wind decreases with height' : 'no shear'} · 1000–500 hPa thickness at $y=0$ ≈ ${v.fix(th, 0)} m (mean temperature ${v.fix(th * G0 / (RGAS * Math.log(2)), 0)} K)`;
        });
      },
    },

    // ------------------------------------------------------------------ 3.5
    {
      num: '3.5', kind: 'Phenomenon', name: 'Jet streams',
      statement: String.raw`In mid-latitudes the troposphere is warm on the equatorward side and cold on the poleward side of a narrow frontal zone, and the stratosphere above the tropopause has the opposite gradient. By thermal wind balance (3.4) the westerly geostrophic wind therefore grows with height up to the tropopause and decays above it: a narrow **westerly jet stream** with its core near the tropopause, a few thousand kilometres long and wider than it is deep, with speeds of several tens of metres per second in the winter hemisphere. The stronger and sharper the temperature front, the stronger the jet, $u_{\max}\sim(g/fT)\,(\Delta T/2w)\,z_T$ for a front of half-width $w$ and a tropopause at height $z_T$.`,
      idea: String.raw`Integrate $\partial u_g/\partial z=-(g/fT)\,\partial T/\partial y$ upward from a surface where the wind is weak. Where the temperature drops poleward, the shear is positive and the wind accumulates with height; at the tropopause the temperature gradient reverses (the lower stratosphere is warmer toward the pole, as the tropical tropopause is high and cold), the shear changes sign, and the integral peaks there. The tropopause is also lower and warmer on the poleward side of the front, so the jet sits at the break between the two tropopause heights. The speed is the vertical integral of a shear set by the front's strength and sharpness.`,
      caption: String.raw`The map is the zonal geostrophic wind $u_g(y,z)$ (red westerly, blue easterly) obtained by integrating the thermal-wind shear upward from calm air at the ground through a temperature front centred at $y=0$ with a tropopause that is high (about 15 km) on the warm side and low (about 9 km) on the cold side; contours every 10 m/s, dashed line the tropopause. **Sharpen the front** (smaller width), **strengthen it** (larger $\Delta T$) or change the latitude, and move the gold probe to read the wind profile of any column. The right panel sweeps the front width at the current $\Delta T$. Idealised model, not an analysed section.`,
      deps: ['geo-3.4'],
      refs: ['Vallis'],
      credit: 'W. Oishi detected strong upper-level westerlies over Japan from pilot-balloon tracking in the 1920s (reported in Esperanto and little noticed abroad)',
      scope: String.raw`Applies to the extratropical (polar-front) jets in thermal-wind balance; the subtropical jet is maintained differently, and jet cores in the real atmosphere are shaped by eddies and by moisture as well as by the mean temperature field.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Jet_stream' },
      viz(v) {
        const dT = v.slider('temperature contrast across the front $\\Delta T$ (K)', 0, 30, 9, { step: 1 });
        const wS = v.slider('front half-width $w$ (km)', 150, 1500, 500, { step: 10, log: true, sig: 2 });
        const lat = v.slider('latitude $\\varphi$ (°)', 25, 70, 45, { step: 1 });
        const sM = v.stage({ x: [-3000, 3000], y: [0, 20], axes: 'box', gutter: true, xlabel: 'distance north $y$ (km)', ylabel: 'height (km)', height: 420, weight: 1.6, minWidth: 340, title: 'zonal wind $u_g(y,z)$ in a frontal zone' });
        const sP = v.stage({ x: [-20, 80], y: [0, 20], axes: 'box', gutter: true, xlabel: '$u_g$ (m/s)', ylabel: 'height (km)', height: 420, weight: 0.8, minWidth: 220, title: 'wind profile at the probe' });
        const sS = v.stage({ x: [150, 1500], xlog: true, y: [0, 120], axes: 'box', gutter: true, xlabel: 'front half-width $w$ (km)', ylabel: 'peak wind (m/s)', height: 420, weight: 0.9, minWidth: 220, title: 'jet speed vs front width' });
        const probe = sM.handle(0, 10, { color: 'gold', label: '', constrain: (x, y) => [clamp(x, -2900, 2900), clamp(y, 0.5, 19)] });
        const NY = 121, NZ = 81, Y0 = -3000, Y1 = 3000, Z1 = 20;
        const sstep = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
        const zTrop = (y) => 12.2 - 3.4 * Math.tanh(y / 900);   // km: ≈ 15.6 on the warm (south) side, 8.8 on the cold side
        const shear = (y, z, dTk, w, f) => { // ∂u/∂z (1/s), z in km
          const dTdy = -(dTk / (2 * w * 1e3)) / Math.cosh(y / w) ** 2; // K/m, negative: colder north
          const zt = zTrop(y), s = 1 - 2.4 * sstep((z - zt) / 2.5);
          return -(G0 / (f * ussaT(z * 1e3))) * dTdy * s;
        };
        let key = '', U = null, sweepKey = '', sweep = [];
        const compute = (dTk, w, f) => {
          const k = `${dTk}|${w}|${f}`; if (k === key) return U; key = k;
          const A = new Float32Array(NY * NZ); let mx = 0, mi = 0, mj = 0;
          for (let i = 0; i < NY; i++) {
            const y = Y0 + (Y1 - Y0) * i / (NY - 1); let u = 0, sprev = shear(y, 0, dTk, w, f);
            A[i * NZ] = 0;
            for (let j = 1; j < NZ; j++) { const z = Z1 * j / (NZ - 1), sn = shear(y, z, dTk, w, f); u += 0.5 * (sprev + sn) * (Z1 / (NZ - 1)) * 1e3; sprev = sn; A[i * NZ + j] = u; if (u > mx) { mx = u; mi = i; mj = j; } }
          }
          U = { A, mx, y: Y0 + (Y1 - Y0) * mi / (NY - 1), z: Z1 * mj / (NZ - 1) }; return U;
        };
        const at = (D, y, z) => { const fi = clamp((y - Y0) / (Y1 - Y0) * (NY - 1), 0, NY - 1.001), fj = clamp(z / Z1 * (NZ - 1), 0, NZ - 1.001), i = Math.floor(fi), j = Math.floor(fj), a = fi - i, b = fj - j, A = D.A; return (1 - a) * ((1 - b) * A[i * NZ + j] + b * A[i * NZ + j + 1]) + a * ((1 - b) * A[(i + 1) * NZ + j] + b * A[(i + 1) * NZ + j + 1]); };
        let st = {};
        v.render(() => {
          const f = fcor(lat.value), D = compute(dT.value, wS.value, f);
          sM.heat((y, z) => at(D, y, z), { range: [-80, 80], cmap: 'theme-diverging', neg: 'blue', pos: 'red', res: 3, key: key });
          sM.clip(() => sM.contour((y, z) => at(D, y, z), [-20, -10, 10, 20, 30, 40, 50, 60, 70, 80], { color: 'ink', width: 1, alpha: 0.55, labels: true, fmt: (q) => String(Math.round(q)) }));
          const tp = []; for (let y = -3000; y <= 3000; y += 100) tp.push([y, zTrop(y)]);
          sM.path(tp, { color: 'ink', width: 2, dash: [6, 4] });
          sM.text('tropopause', -2900, zTrop(-2900), { size: 11, color: 'ink', dx: 4, dy: -10, align: 'left', plate: true });
          sM.dot(D.y, D.z, { r: 5, hollow: true, color: 'ink' });
          // profile at probe
          const zs = []; for (let j = 0; j < NZ; j++) zs.push([at(D, probe.x, Z1 * j / (NZ - 1)), Z1 * j / (NZ - 1)]);
          sP.vline(0, { color: 'faint' });
          sP.path(zs, { color: 'accent', width: 2.6 });
          sP.hline(zTrop(probe.x), { color: 'ink', dash: [6, 4] });
          sP.text('tropopause', 78, zTrop(probe.x), { size: 11, color: 'ink', align: 'right', dy: -8 });
          sP.dot(at(D, probe.x, probe.y), probe.y, { r: 6, color: 'gold' });
          // sweep
          const sk = `${dT.value}|${f}`; if (sk !== sweepKey) { sweepKey = sk; sweep = []; for (let q = 0; q <= 16; q++) { const w = 150 * Math.pow(10, q / 16); sweep.push([w, compute(dT.value, w, f).mx]); } compute(dT.value, wS.value, f); }
          sS.path(sweep, { color: 'accent', width: 2.6 });
          sS.fn((x) => D.mx * wS.value / x, { domain: [150, 1500], color: 'green', width: 1.4, dash: [4, 4] });
          sS.text('$\\propto1/w$', 700, D.mx * wS.value / 700, { size: 12, color: 'green', dy: -12 });
          sS.dot(wS.value, D.mx, { r: 7, color: 'gold' });
          st = { D, f, probeU: at(D, probe.x, probe.y), zt: zTrop(D.y) };
        });
        v.readout(() => {
          const D = st.D, est = (G0 / (st.f * 230)) * (dT.value / (2 * wS.value * 1e3)) * 10e3;
          return `$f=${v.fix(st.f * 1e4, 2)}\\times10^{-4}\\,\\mathrm{s^{-1}}$ · jet core ${v.fix(D.mx, 1)} m/s at $y=${v.fix(D.y, 0)}$ km, height **${v.fix(D.z, 1)} km** (the tropopause there is at ${v.fix(st.zt, 1)} km) · at the probe $u_g=${sgn(v, st.probeU, 1)}$ m/s\nscaling $(g/fT)(\\Delta T/2w)\\,z_T$ with $T\\approx230$ K, $z_T=10$ km gives ${v.fix(est, 0)} m/s: speed grows in proportion to $\\Delta T$ and falls with the width $w$ (right panel, with the $1/w$ law dashed) and with $f$`;
        });
      },
    },
  ],
};
