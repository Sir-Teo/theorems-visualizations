// Atmosphere & Ocean Dynamics — Chapter 2: Rotation
//
// Constants used by the pictures (all in SI):
//   Ω = 7.2921e-5 rad/s  (2π per sidereal day, 86 164 s); mean Earth radius a = 6.371e6 m; equatorial radius 6.378137e6 m;
//   GM = 3.986004e14 m³/s²  (the geocentric gravitational constant).
const OMEGA = 7.2921e-5, A_E = 6.371e6, RE_EQ = 6.378137e6, GM = 3.986004e14, G0 = 9.80665;
const RAD = Math.PI / 180, TAU = 2 * Math.PI;
const fcor = (latDeg, mult = 1) => 2 * OMEGA * mult * Math.sin(latDeg * RAD);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const sgn = (v, x, d = 1) => (x < 0 ? '−' : '') + v.fix(Math.abs(x), d);
const log10 = (x) => Math.log(x) / Math.LN10;
/** Short text for a number with an exponent, inside $…$ */
const sci = (v, x, d = 2) => (x === 0 ? '0' : v.sci(x, d));

/** Level surface of Φ = −GM/r − ½ Ω² r² cos²φ through the equatorial radius RE_EQ: r(φ) by bisection. */
function levelR(phi, om) {
  const P0 = -GM / RE_EQ - 0.5 * om * om * RE_EQ * RE_EQ;
  let lo = 0.5 * RE_EQ, hi = 1.3 * RE_EQ;
  const Phi = (r) => -GM / r - 0.5 * om * om * r * r * Math.cos(phi) ** 2;
  for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; (Phi(m) < P0 ? lo = m : hi = m); }
  return (lo + hi) / 2;
}
/** Tilt (rad) of the effective gravity away from the radial direction at radius r, latitude phi, spin om. */
function tiltOf(r, phi, om) {
  const ch = om * om * r * Math.sin(phi) * Math.cos(phi), cn = om * om * r * Math.cos(phi) ** 2;
  return Math.atan2(ch, GM / (r * r) - cn);
}

export default {
  collection: 'geo',
  chapter: 2,
  title: 'Rotation',
  summary: String.raw`On a rotating planet, motions slower than a day feel the Coriolis force, set by the local vertical component of the Earth's spin. Free motions become inertial circles, the Rossby number measures how much rotation matters, and the β effect — the change of the Coriolis parameter with latitude — is the seed of large-scale wave dynamics. Strong rotation also makes flows nearly two-dimensional, as the Taylor–Proudman theorem says.`,
  items: [
    // ------------------------------------------------------------------ 2.1
    {
      num: '2.1', kind: 'Definition', name: 'Coriolis parameter f = 2Ω sin φ',
      statement: String.raw`Seen from the rotating Earth (angular velocity $\Omega$, one turn per sidereal day), a free particle of velocity $\mathbf u$ has an apparent acceleration $-2\boldsymbol\Omega\times\mathbf u$. For motion along the surface only the part of $\boldsymbol\Omega$ normal to the ground matters, namely $\Omega\sin\varphi$ at latitude $\varphi$, and the horizontal Coriolis acceleration is $-f\,\hat{\mathbf k}\times\mathbf u$ with the **Coriolis parameter**
$$f = 2\Omega\sin\varphi,\qquad \Omega = \frac{2\pi}{86\,164\ \mathrm{s}} \approx 7.292\times10^{-5}\ \mathrm{s^{-1}} .$$
It is positive in the northern hemisphere (deflection to the right of the motion), zero at the equator, negative in the southern hemisphere (deflection to the left), and largest, $|f|\approx1.46\times10^{-4}\,\mathrm{s^{-1}}$, at the poles.`,
      idea: String.raw`Decompose $\boldsymbol\Omega$ into a part along the local vertical, $\Omega\sin\varphi$, and a part along the local northward horizontal, $\Omega\cos\varphi$. The vertical part makes the ground turn under a horizontally moving parcel, which appears as a sideways force $2\Omega\sin\varphi\,\hat{\mathbf k}\times\mathbf u$ obtained from the rotating-frame acceleration of mech-9.8; the horizontal part gives forces mostly in the vertical direction and is negligible for shallow, large-scale flow. So $f$ is twice the local rate at which the horizontal plane rotates about the vertical, and changes sign across the equator.`,
      caption: String.raw`**Drag the gold observer** up and down the meridian on the globe (or drag the dot on the curve). The cross-section shows $\boldsymbol\Omega$ resolved into the component normal to the ground (green, $\Omega\sin\varphi$) and the component along the ground (purple, $\Omega\cos\varphi$); only the green part turns the horizontal plane. The curve shows $f(\varphi)$: it vanishes at the equator and changes sign.`,
      deps: ['mech-9.8', 'geog-1.2'],
      refs: ['Vallis'],
      tags: ['Coriolis', 'rotation'],
      credit: 'G.-G. Coriolis, 1835',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Coriolis_parameter' },
      viz(v) {
        const Gs = v.stage({ height: 340, weight: 1, minWidth: 250, title: 'the observer' });
        const Xs = v.stage({ x: [-1.75, 1.75], y: [-1.5, 1.5], equal: true, axes: false, height: 340, weight: 1, minWidth: 250, title: 'meridian cross-section' });
        const Fs = v.stage({ x: [-90, 90], y: [-1.75, 1.75], height: 340, axes: 'box', gutter: true, xlabel: 'latitude $\\varphi$ (°)', ylabel: '$f$ ($10^{-4}\\,\\mathrm{s^{-1}}$)', xticks: [-90, -60, -30, 0, 30, 60, 90], title: 'Coriolis parameter', weight: 1, minWidth: 250 });
        const G = v.globe(Gs, { projection: 'orthographic', center: [-30, 20], graticule: 30, drag: false });
        let lat = 45;
        const me = G.handle(-30, 45, { label: 'you', color: 'gold', constrain: (l, f) => [-30, clamp(f, -90, 90)], onDrag: (p) => { lat = p.lat; } });
        const hf = Fs.handle(45, fcor(45) * 1e4, { color: 'gold', label: '', constrain: (x) => [clamp(x, -90, 90), fcor(clamp(x, -90, 90)) * 1e4] });
        hf.onDrag = () => { lat = hf.x; };
        v.render(() => {
          if (Math.abs(me.lat - lat) > 1e-9) me.set(-30, lat);
          if (Math.abs(hf.x - lat) > 1e-9) hf.set(lat, fcor(lat) * 1e4);
          const phi = lat * RAD, f = fcor(lat);
          // globe
          G.set({ center: [-30, lat * 0.55] });
          G.draw();
          const par = []; for (let l = -180; l <= 180; l += 4) par.push([l, lat]);
          G.path(par, { color: 'gold', width: 1.6, geodesic: false });
          G.arrow([-30, lat], [-2, lat], { color: 'orange', width: 2 });
          // cross-section
          Xs.circle(0, 0, 1, { fill: 'blue', fillAlpha: 0.07, color: 'muted', width: 1.4 });
          Xs.line(-1.15, 0, 1.15, 0, { color: 'faint', dash: [4, 4] });
          Xs.line(0, -1.25, 0, 1.25, { color: 'muted', dash: [6, 4] });
          Xs.arrow(0, 1.05, 0, 1.42, { color: 'orange', width: 2.4 });
          Xs.tex('\\boldsymbol\\Omega', 0.17, 1.38, { color: 'orange', size: 15 });
          const P = [Math.cos(phi), Math.sin(phi)], nv = P, tv = [-Math.sin(phi), Math.cos(phi)], L = 0.85;
          Xs.line(P[0] - 0.55 * tv[0], P[1] - 0.55 * tv[1], P[0] + 0.55 * tv[0], P[1] + 0.55 * tv[1], { color: 'ink', width: 2.2 });
          const tipV = [P[0] + L * Math.sin(phi) * nv[0], P[1] + L * Math.sin(phi) * nv[1]];
          const tipH = [P[0] + L * Math.cos(phi) * tv[0], P[1] + L * Math.cos(phi) * tv[1]];
          const tipO = [P[0], P[1] + L];
          Xs.line(tipV[0], tipV[1], tipO[0], tipO[1], { color: 'faint', dash: [3, 3] });
          Xs.line(tipH[0], tipH[1], tipO[0], tipO[1], { color: 'faint', dash: [3, 3] });
          Xs.arrow(P[0], P[1], tipO[0], tipO[1], { color: 'orange', width: 2.2 });
          Xs.arrow(P[0], P[1], tipH[0], tipH[1], { color: 'purple', width: 2.4 });
          if (Math.abs(lat) > 1) Xs.arrow(P[0], P[1], tipV[0], tipV[1], { color: 'green', width: 2.6 });
          Xs.arrow(P[0], P[1], P[0] + 0.32 * nv[0], P[1] + 0.32 * nv[1], { color: 'ink', width: 1.2, head: 6 });
          Xs.tex('\\Omega\\sin\\varphi', tipV[0] + (Math.abs(lat) < 10 ? 0 : 0.0), tipV[1], { color: 'green', size: 13, dx: 18, dy: lat >= 0 ? 8 : -10 });
          Xs.tex('\\Omega\\cos\\varphi', tipH[0], tipH[1], { color: 'purple', size: 13, align: 'right', dx: -8, dy: -4 });
          Xs.dot(P[0], P[1], { r: 6, color: 'gold' });
          Xs.tex('\\text{up}', P[0] + 0.32 * nv[0], P[1] + 0.32 * nv[1], { color: 'muted', size: 11, dx: -16, dy: 14 });
          // f(φ)
          Fs.hline(0, { color: 'muted' });
          Fs.fn((x) => fcor(x) * 1e4, { domain: [-90, 90], color: 'accent', width: 2.6, n: 181 });
          Fs.vline(0, { color: 'faint', dash: [3, 4] });
          Fs.text('f > 0: deflect right', 38, 1.3, { color: 'green', size: 11, align: 'center' });
          Fs.text('f < 0: deflect left', -38, -1.3, { color: 'red', size: 11, align: 'center' });
        });
        v.readout(() => {
          const f = fcor(lat), Tsd = TAU / OMEGA;
          const inert = Math.abs(f) < 1e-12 ? '∞' : v.fix(TAU / Math.abs(f) / 3600, 1) + ' h';
          const fou = Math.abs(f) < 1e-12 ? '∞' : v.fix(Tsd / Math.abs(Math.sin(lat * RAD)) / 3600, 1) + ' h';
          return `$\\varphi=${sgn(v, lat, 1)}^\\circ$ · $f=2\\Omega\\sin\\varphi=${sgn(v, f * 1e4, 3)}\\times10^{-4}\\,\\mathrm{s^{-1}}$ · $\\Omega\\sin\\varphi=${sgn(v, OMEGA * Math.sin(lat * RAD) * 1e5, 2)}\\times10^{-5}$ and $\\Omega\\cos\\varphi=${v.fix(OMEGA * Math.cos(lat * RAD) * 1e5, 2)}\\times10^{-5}\\,\\mathrm{s^{-1}}$\nvertical component of the spin: ${v.fix(Math.abs(Math.sin(lat * RAD)) * 100, 0)}% of $\\Omega$ · turning period of the horizontal plane $4\\pi/|f|$ = ${fou} (a Foucault pendulum's swing plane) · inertial period $2\\pi/|f|$ = ${inert}`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.2
    {
      num: '2.2', kind: 'Phenomenon', name: 'Inertial oscillations',
      statement: String.raw`A parcel on a rotating planet that feels no horizontal force except the Coriolis force obeys $\dot u = fv,\ \dot v=-fu$. Its speed is constant and it moves on a circle of radius $R_i = |\mathbf u|/|f|$, **clockwise** where $f>0$ (northern hemisphere) and anticlockwise where $f<0$, with the **inertial period**
$$T_i=\frac{2\pi}{|f|}=\frac{T_{\rm sidereal\ day}}{2|\sin\varphi|}\approx\frac{11.97\ \mathrm h}{|\sin\varphi|}.$$
At $45^\circ$ this is about 17 hours. With weak friction the circles slowly shrink, $\mathbf u\propto e^{-rt}$; the motion shows up as a sharp peak at frequency $|f|/2\pi$ in the clockwise (northern) rotary spectrum of current records after a storm.`,
      idea: String.raw`Write $w=u+iv$. The equations of motion collapse to $\dot w=-if\,w$ (add $-rw$ for friction), solved by $w=w_0e^{-ift}$: a constant-speed rotation with angular frequency $f$, the Coriolis force bending the path just enough to keep the speed constant, since the force does no work. The radius follows from $u=R_i f$. The rotation sense is fixed by the sign of $f$ from 2.1, and the frequency equals $|f|$ whatever the speed, which is why a storm that pushes the surface ocean sets it ringing at the local inertial frequency.`,
      caption: String.raw`The parcel has been given a push of speed $U$ and then left alone; the dot moves along the numerically integrated path (RK4), the middle panel shows $u(t)$ and $v(t)$, and the right panel the rotary power spectrum of $u+iv$ (negative frequency = clockwise). **Slide the latitude** (including to the southern hemisphere, where the circle reverses) and change the damping: the spectral peak always sits at $-f/2\pi$. Time series from real current meters are not included; this is the model's response.`,
      deps: ['geo-2.1', 'mech-9.11'],
      refs: ['Vallis'],
      tags: ['inertial oscillation', 'Coriolis'],
      scope: String.raw`Valid for a freely moving parcel with no pressure gradient or wind; in the real ocean the inertial oscillations are forced by wind and damped by mixing and by radiating waves.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Inertial_wave' },
      viz(v) {
        const lat = v.slider('latitude $\\varphi$ (°)', -80, 80, 45, { step: 1 });
        const U = v.slider('initial speed $U$ (m/s)', 0.05, 1.5, 0.4, { step: 0.05 });
        const damp = v.select('friction', [{ value: 0, label: 'none' }, { value: 6, label: 'weak (6 d)' }, { value: 2, label: 'strong (2 d)' }], 0);
        const s1 = v.stage({ x: [-5, 5], y: [-5, 5], equal: true, axes: true, height: 330, title: 'path of the parcel (km)', weight: 1, minWidth: 250 });
        const s2 = v.stage({ x: [0, 16], y: [-1, 1], height: 330, axes: 'box', gutter: true, xlabel: 'time (days)', ylabel: 'velocity (cm/s)', title: 'velocity components', weight: 1.1, minWidth: 270 });
        const s3 = v.stage({ x: [-2.5, 2.5], y: [1e-6, 2], ylog: true, height: 330, axes: 'box', gutter: true, xlabel: 'frequency (cycles/day), − = clockwise', ylabel: 'power', title: 'rotary spectrum', weight: 1.1, minWidth: 270 });
        const NS = 1024, TT = 16 * 86400;
        let key = '', run = null;
        function integrate() {
          const f = fcor(lat.value), u0 = U.value, r = damp.value ? 1 / (damp.value * 86400) : 0;
          const k = `${f}|${u0}|${r}`; if (k === key) return run; key = k;
          const dt = TT / NS, sub = 8, h = dt / sub;
          const F = (s) => [s[2], s[3], f * s[3] - r * s[2], -f * s[2] - r * s[3]];
          let s = [0, 0, u0, 0];
          const X = [0], Y = [0], Uu = [u0], Vv = [0];
          for (let i = 0; i < NS; i++) {
            for (let j = 0; j < sub; j++) {
              const k1 = F(s), k2 = F(s.map((q, m) => q + 0.5 * h * k1[m])), k3 = F(s.map((q, m) => q + 0.5 * h * k2[m])), k4 = F(s.map((q, m) => q + h * k3[m]));
              s = s.map((q, m) => q + h / 6 * (k1[m] + 2 * k2[m] + 2 * k3[m] + k4[m]));
            }
            X.push(s[0]); Y.push(s[1]); Uu.push(s[2]); Vv.push(s[3]);
          }
          // rotary spectrum of u+iv, Hann window
          const re = new Array(NS), im = new Array(NS);
          for (let i = 0; i < NS; i++) { const w = 0.5 * (1 - Math.cos(TAU * i / NS)); re[i] = Uu[i] * w; im[i] = Vv[i] * w; }
          v.M.fft(re, im);
          const pw = [], fr = [];
          for (let i = 0; i < NS; i++) { const kk = i < NS / 2 ? i : i - NS; fr.push(kk / (TT / 86400)); pw.push(re[i] * re[i] + im[i] * im[i]); }
          const pmax = Math.max(...pw);
          let kpk = 0; for (let i = 1; i < NS; i++) if (pw[i] > pw[kpk]) kpk = i;
          let rmax = 0; for (let i = 0; i <= NS; i++) rmax = Math.max(rmax, Math.hypot(X[i] - (Math.abs(f) > 0 ? 0 : 0), Y[i] + u0 / f));
          let sp0 = Math.hypot(Uu[0], Vv[0]), sp1 = Math.hypot(Uu[NS], Vv[NS]);
          run = { f, r, X, Y, Uu, Vv, fr, pw, pmax, fpk: (() => { const a = Math.log(pw[(kpk + NS - 1) % NS] + 1e-30), b = Math.log(pw[kpk] + 1e-30), c = Math.log(pw[(kpk + 1) % NS] + 1e-30); const d = 0.5 * (a - c) / (a - 2 * b + c); return (fr[kpk] + d / (TT / 86400)); })(), sp0, sp1, dt };
          return run;
        }
        v.animate((t) => {
          const R = integrate(), Ri = U.value / Math.abs(R.f) / 1000;
          const ext = Math.max(1.4 * Ri, 0.5);
          s1.setView([-ext * 1.1, ext * 1.1], [-ext * 1.1, ext * 1.1]);
          const pts = R.X.map((x, i) => [x / 1000, R.Y[i] / 1000]);
          s1.path(pts, { color: 'accent', width: 1.8, alpha: 0.85 });
          const i = clamp(Math.floor(((t % 12) / 12) * NS), 0, NS);
          s1.path(pts.slice(0, i + 1), { color: 'gold', width: 2.6 });
          s1.circle(0, -U.value / R.f / 1000, Ri, { color: 'green', dash: [5, 4], width: 1.2 });
          s1.dot(pts[i][0], pts[i][1], { r: 6, color: 'gold' });
          s1.arrow(pts[i][0], pts[i][1], pts[i][0] + R.Uu[i] / U.value * ext * 0.22, pts[i][1] + R.Vv[i] / U.value * ext * 0.22, { color: 'red', width: 2 });
          s1.dot(0, 0, { r: 4, color: 'muted' }); s1.text('start', 0, 0, { dx: 8, dy: 12, size: 11, color: 'muted' });
          const ts = R.Uu.map((_, k) => k * R.dt / 86400);
          const sc = 100 * U.value, Td0 = TAU / Math.abs(R.f) / 86400;
          s2.setView([0, Math.min(16, 5.5 * Td0)], [-sc * 1.15, sc * 1.15]);
          s2.hline(0, { color: 'muted' });
          s2.path(ts.map((q, k) => [q, R.Uu[k] * 100]), { color: 'accent', width: 1.8 });
          s2.path(ts.map((q, k) => [q, R.Vv[k] * 100]), { color: 'orange', width: 1.8 });
          s2.vline(i * R.dt / 86400, { color: 'gold', width: 1.5 });
          const Td = Td0;
          for (let q = 1; q * Td < 16; q++) s2.vline(q * Td, { color: 'faint', dash: [3, 4] });
          s3.vline(-R.f * 86400 / TAU, { color: 'green', dash: [5, 4], width: 1.6 });
          s3.vline(R.f * 86400 / TAU, { color: 'faint', dash: [3, 4] });
          const sp = []; for (let k = NS / 2; k < NS; k++) sp.push([R.fr[k], R.pw[k] / R.pmax + 1e-12]); for (let k = 0; k <= NS / 2; k++) sp.push([R.fr[k], R.pw[k] / R.pmax + 1e-12]);
          s3.path(sp, { color: 'accent', width: 2 });
          s3.text('$-f/2\\pi$', -R.f * 86400 / TAU, 0.9, { color: 'green', size: 12, dx: 6, dy: 8 });
        }, { period: 12, still: 3.5 });
        v.legend([['gold', 'parcel now'], ['green', 'radius $U/|f|$', { dash: true }], ['accent', 'u'], ['orange', 'v']]);
        v.readout(() => {
          const R = integrate(), f = R.f, Ti = TAU / Math.abs(f) / 3600;
          let dev = 0; for (let k = 0; k <= NS; k += 1) dev = Math.max(dev, Math.abs(Math.hypot(R.X[k], R.Y[k] + U.value / f) - U.value / Math.abs(f)));
          const drift = damp.value ? '' : ` · speed drift of the integrator $${v.sci(Math.abs(R.sp1 / R.sp0 - 1), 1)}$`;
          return `$f=${sgn(v, f * 1e4, 3)}\\times10^{-4}\\,\\mathrm{s^{-1}}$ · inertial period $2\\pi/|f|$ = **${v.fix(Ti, 2)} h** (sidereal day/(2 sin φ) = ${v.fix(TAU / OMEGA / 3600 / (2 * Math.abs(Math.sin(lat.value * RAD))), 2)} h) · ${f > 0 ? 'clockwise' : 'anticlockwise'}, radius $U/|f|$ = ${v.fix(U.value / Math.abs(f) / 1000, 2)} km${damp.value ? '' : ' (largest departure of the integrated orbit from that circle: ' + v.fix(dev, 1) + ' m)'}\nspectral peak at ${sgn(v, R.fpk, 3)} cycles/day; predicted $-f/2\\pi$ = ${sgn(v, -f * 86400 / TAU, 3)} cycles/day${drift}`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.3
    {
      num: '2.3', kind: 'Definition', name: 'Rossby number',
      statement: String.raw`For a flow with characteristic speed $U$ and horizontal length scale $L$ on a planet with Coriolis parameter $f$, the **Rossby number** is
$$\mathrm{Ro}=\frac{U}{fL},$$
the ratio of the advective acceleration $U^2/L$ to the Coriolis acceleration $fU$, equivalently of the rotation period $2\pi/f$ to the time $L/U$ the flow takes to cross its own scale (up to $2\pi$). When $\mathrm{Ro}\ll1$ rotation dominates and the flow is close to geostrophic balance; when $\mathrm{Ro}\gtrsim1$ the Coriolis force is a small perturbation.`,
      idea: String.raw`Compare the two terms in the horizontal momentum equation, $\mathbf u\!\cdot\!\nabla\mathbf u\sim U^2/L$ and $f\hat{\mathbf k}\times\mathbf u\sim fU$; their ratio is $U/(fL)$. Equivalently, a parcel moving at $U$ for the crossing time $L/U$ is turned through an angle $fL/U=1/\mathrm{Ro}$ radians by the Coriolis force: a straight path for $\mathrm{Ro}\gg1$ and full inertial circles (2.2) for $\mathrm{Ro}\ll1$. Because $U$ and $L$ range over many orders of magnitude, Ro does too, so one number classifies flows from a bathtub to the ocean gyres.`,
      caption: String.raw`The map shows $\log_{10}\mathrm{Ro}$ over all speeds and length scales at the chosen latitude (blue: rotation dominates, orange: negligible; the green line is $\mathrm{Ro}=1$). **Drag the gold handle** or watch the labelled examples (order-of-magnitude scales). On the right, a parcel crosses a box of size $L$: the path bends by $1/\mathrm{Ro}$ radians while it crosses.`,
      deps: ['geo-2.1', 'fluid-3.10'],
      refs: ['Vallis'],
      tags: ['Rossby number', 'scaling'],
      credit: 'Named for C.-G. Rossby (1930s)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Rossby_number' },
      viz(v) {
        const lat = v.slider('latitude $\\varphi$ (°)', -80, 80, 45, { step: 1 });
        const sm = v.stage({ x: [-2, 7.3], y: [-3, 3], height: 380, axes: 'box', gutter: true, xticks: [[-2, '1 cm'], [0, '1 m'], [1, '10 m'], [3, '1 km'], [5, '100 km'], [6, '1000 km'], [7, '10 000 km']], yticks: [[-3, '1 mm/s'], [-2, '1 cm/s'], [-1, '10 cm/s'], [0, '1 m/s'], [1, '10 m/s'], [2, '100 m/s']], xlabel: 'length scale $L$', ylabel: 'speed $U$', title: '$\\log_{10}\\mathrm{Ro}$ over the scales of motion', weight: 1.5, minWidth: 300 });
        const sd = v.stage({ x: [-0.1, 1.1], y: [-0.1, 1.1], equal: true, axes: false, height: 380, title: 'a parcel crossing a box of size $L$', weight: 0.9, minWidth: 250 });
        const EX = [
          ['bathtub vortex', 0.3, 0.1, 'ne'], ['tornado', 100, 70, 'n'], ['sea breeze', 2e4, 5, 'se'], ['hurricane', 1e5, 40, 'ne'],
          ['Gulf Stream', 5e4, 1.5, 'sw'], ['ocean eddy', 3e4, 0.15, 'se'], ['weather system', 1e6, 12, 'n'], ['ocean gyre', 5e6, 0.02, 'ne'],
        ];
        const hd = sm.handle(5.2, 0.7, { color: 'gold', label: 'you', constrain: { x: [-2, 7.3], y: [-3, 3] } });
        v.render(() => {
          const f = Math.max(Math.abs(fcor(lat.value)), 1e-7), lf = log10(f);
          sm.heat((x, y) => clamp(y - x - lf, -6, 6), { range: [-6, 6], cmap: 'theme-diverging', neg: 'blue', pos: 'orange', key: lat.value, res: 3 });
          for (const k of [-2, 0, 2]) { const c = x0 => x0 + lf + k; sm.line(-2, c(-2), 7.3, c(7.3), { color: k === 0 ? 'green' : 'muted', width: k === 0 ? 3 : 1, dash: k === 0 ? false : [4, 4], alpha: k === 0 ? 1 : 0.7 }); }
          sm.text('Ro = 1', 6.2, 6.2 + lf, { color: 'green', size: 12, align: 'center', dy: -9 });
          sm.text('rotation dominates', 5.4, -2.4, { color: 'blue', size: 12, align: 'center', plate: true });
          sm.text('rotation negligible', -0.1, 2.4, { color: 'orange', size: 12, align: 'center', plate: true });
          for (const [nm, L, U0, pos] of EX) { sm.dot(log10(L), log10(U0), { r: 5, color: 'ink' }); sm.text(nm, log10(L), log10(U0), { dx: pos.includes('e') ? 8 : pos.includes('w') ? -8 : 0, dy: pos.includes('n') ? -9 : pos.includes('s') ? 12 : 0, align: pos.includes('e') ? 'left' : pos.includes('w') ? 'right' : 'center', size: 11, color: 'ink', plate: true }); }
          // box panel
          const Ro = Math.pow(10, hd.y - hd.x - lf), sg = fcor(lat.value) >= 0 ? 1 : -1;
          sd.rect(0, 0, 1, 1, { color: 'muted', fill: 'blue', fillAlpha: 0.05 });
          const cx = 0, cy = 0.5 - sg * Ro, pts = [];
          let exit = false;
          for (let s = 0; s <= 4 * TAU && !exit; s += 0.01) {
            const x = Ro * Math.sin(s), y = 0.5 - sg * Ro * (1 - Math.cos(s));
            if (Ro > 0.3 && (x > 1.04 || y < -0.04 || y > 1.04)) { pts.push([x, y]); exit = true; } else pts.push([x, y]);
            if (Ro <= 0.3 && s > 2.2 * TAU) break;
          }
          sd.clip(() => sd.path(pts, { color: 'accent', width: 2.6 }));
          sd.dot(0, 0.5, { r: 5, color: 'muted' });
          const sx = 1 / Ro, tx = Ro * Math.sin(sx), ty = 0.5 - sg * Ro * (1 - Math.cos(sx));
          if (sx < 4 * TAU && Math.abs(tx) < 1.3) sd.dot(tx, ty, { r: 6, color: 'gold' });
          sd.text('start', 0, 0.5, { dx: 8, dy: -10, size: 11, color: 'muted' });
          sd.text('crossing time $L/U$', tx, ty, { dx: 10, dy: -12, size: 11, color: 'gold', align: 'left', plate: true });
          sd.text('$L$', 0.5, 0, { dy: 14, size: 13, color: 'muted', align: 'center' });
          sd.corner(Ro > 1 ? 'nearly straight' : 'strongly curved', 'tr', { color: Ro > 1 ? 'orange' : 'blue' });
        });
        v.readout(() => {
          const f = Math.max(Math.abs(fcor(lat.value)), 1e-7);
          const Ro = Math.pow(10, hd.y - hd.x - log10(f)), turn = 1 / Ro;
          const exs = EX.map(([nm, L, U0]) => `${nm} ${sci(v, U0 / (f * L), 1).includes('e') ? '$' + sci(v, U0 / (f * L), 1) + '$' : v.fix(U0 / (f * L), 2)}`).join(' · ');
          return `$f=${v.fix(f * 1e4, 2)}\\times10^{-4}\\,\\mathrm{s^{-1}}$ · your flow: $U=${v.sci(Math.pow(10, hd.y), 2)}$ m/s, $L=${v.sci(Math.pow(10, hd.x), 2)}$ m, $\\mathrm{Ro}=U/fL=$ **$${v.sci(Ro, 2)}$** → turned through $1/\\mathrm{Ro}$ = ${v.fix(turn * 180 / Math.PI, turn > 100 ? 0 : 1)}° while crossing: ${Ro < 0.1 ? 'strongly rotating' : Ro < 1 ? 'rotation matters' : 'rotation weak'}\nexamples at this latitude, Ro: ${exs}`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.4
    {
      num: '2.4', kind: 'Model', name: 'Equations of motion on the sphere and the β-plane',
      statement: String.raw`In latitude $\varphi$ and longitude $\lambda$ on a sphere of radius $a$, the horizontal momentum equations of a shallow fluid are
$$\frac{Du}{Dt}-\frac{uv\tan\varphi}{a}-fv=-\frac{1}{\rho a\cos\varphi}\frac{\partial p}{\partial\lambda},\qquad \frac{Dv}{Dt}+\frac{u^2\tan\varphi}{a}+fu=-\frac{1}{\rho a}\frac{\partial p}{\partial\varphi},$$
with $f=2\Omega\sin\varphi$ (the metric terms $uv\tan\varphi/a$, $u^2\tan\varphi/a$ come from the curvature of the coordinates). Near a latitude $\varphi_0$ use Cartesian $x=a\cos\varphi_0\,\lambda$, $y=a(\varphi-\varphi_0)$ and expand $f=f_0+\beta y+\dots$ with $f_0=2\Omega\sin\varphi_0$, $\beta=2\Omega\cos\varphi_0/a$. The **$f$-plane** keeps $f=f_0$; the **$\beta$-plane** keeps $f=f_0+\beta y$; in both the metric terms are dropped, which is justified when $L\ll a$.`,
      idea: String.raw`The equations come from writing the acceleration $D\mathbf u/Dt$ in spherical coordinates (the unit vectors turn as a parcel moves, producing the metric terms) and adding $-f\hat{\mathbf k}\times\mathbf u$ from 2.1. Expanding $\sin\varphi=\sin(\varphi_0+y/a)$ about $\varphi_0$ gives $f=f_0+\beta y-\tfrac12f_0y^2/a^2+\dots$, so the $f$-plane is accurate to relative order $(L/a)\cot\varphi_0$ and the $\beta$-plane to order $(L/a)^2$. The whole point of the $\beta$-plane is that it keeps the one effect of curvature that has qualitatively new consequences, the north–south variation of $f$ (see 2.3's scalings and the Rossby waves of Chapter 8).`,
      caption: String.raw`**Drag the gold handle** on the error map to choose the patch's central latitude $\varphi_0$ and its half-width $L$. The globe shows the patch (orange circle), the middle panel compares the true $f(y)=2\Omega\sin(\varphi_0+y/a)$ with the $f$-plane (flat) and $\beta$-plane (tilted) approximations, and the map shows the maximum error over the patch relative to the largest $|f|$ in it; the green line marks a 10% error. Switch the map between the two approximations.`,
      deps: ['geo-2.1', 'fluid-6.4'],
      refs: ['Vallis'],
      tags: ['beta plane', 'shallow water'],
      credit: 'beta-plane approximation introduced by C.-G. Rossby, 1939',
      scope: String.raw`Needs $L\ll a$ (metric terms dropped) and a shallow fluid layer (traditional approximation: the $2\Omega\cos\varphi$ terms are neglected); the $f$-plane additionally needs $L\ll a\tan\varphi_0$, which fails near the equator.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Beta_plane' },
      viz(v) {
        const mode = v.select('error map of', [{ value: 'f', label: '$f$-plane' }, { value: 'b', label: '$\\beta$-plane' }], 'b');
        const Gs = v.stage({ height: 340, weight: 0.95, minWidth: 240, title: 'the patch' });
        const Fs = v.stage({ x: [-1000, 1000], y: [0, 1.5], height: 340, axes: 'box', gutter: true, xlabel: 'north–south distance $y$ (km)', ylabel: '$f$ ($10^{-4}\\,\\mathrm{s^{-1}}$)', title: '$f(y)$: exact and approximate', weight: 1.1, minWidth: 260 });
        const Es = v.stage({ x: [0, 85], y: [2, 4.3], height: 340, axes: 'box', gutter: true, xticks: [0, 15, 30, 45, 60, 75], yticks: [[2, '100'], [3, '1000'], [4, '10 000']], xlabel: 'central latitude $\\varphi_0$ (°)', ylabel: 'half-width $L$ (km)', title: 'relative error of the approximation', weight: 1.1, minWidth: 260 });
        const G = v.globe(Gs, { projection: 'orthographic', center: [0, 40], graticule: 30, drag: false });
        // precomputed error tables
        const NLAT = 86, NL = 47, NS = 41;
        const tab = { f: new Float64Array(NLAT * NL), b: new Float64Array(NLAT * NL) };
        for (let i = 0; i < NLAT; i++) for (let j = 0; j < NL; j++) {
          const l0 = i, L = Math.pow(10, 2 + 0.05 * j) * 1000, p0 = l0 * RAD, f0 = 2 * OMEGA * Math.sin(p0), be = 2 * OMEGA * Math.cos(p0) / A_E;
          let fm = 0, ef = 0, eb = 0;
          for (let k = 0; k < NS; k++) { const y = -L + 2 * L * k / (NS - 1), fe = 2 * OMEGA * Math.sin(p0 + y / A_E); fm = Math.max(fm, Math.abs(fe)); ef = Math.max(ef, Math.abs(fe - f0)); eb = Math.max(eb, Math.abs(fe - f0 - be * y)); }
          tab.f[i * NL + j] = ef / fm; tab.b[i * NL + j] = eb / fm;
        }
        const look = (m, lat0, lL) => { const a = clamp(lat0, 0, 84.999), b = clamp((lL - 2) / 0.05, 0, NL - 1.001), i = Math.floor(a), j = Math.floor(b), fa = a - i, fb = b - j, T = tab[m]; return (1 - fa) * ((1 - fb) * T[i * NL + j] + fb * T[i * NL + j + 1]) + fa * ((1 - fb) * T[(i + 1) * NL + j] + fb * T[(i + 1) * NL + j + 1]); };
        const hd = Es.handle(40, 3.2, { color: 'gold', label: 'patch', constrain: { x: [0, 85], y: [2, 4.3] } });
        v.render(() => {
          const lat0 = hd.x, L = Math.pow(10, hd.y) * 1000, p0 = lat0 * RAD, f0 = 2 * OMEGA * Math.sin(p0), be = 2 * OMEGA * Math.cos(p0) / A_E;
          // globe
          G.set({ center: [0, clamp(lat0, 0, 70)] }); G.draw();
          const rr = Math.min(L / A_E / RAD, 90);
          G.smallCircle([0, lat0], rr, { color: 'orange', width: 2.2, fill: 'orange', fillAlpha: 0.2 });
          G.dot(0, lat0, { r: 4, color: 'orange' });
          // f(y)
          const fe = (y) => 2 * OMEGA * Math.sin(p0 + y * 1000 / A_E) * 1e4, ff = () => f0 * 1e4, fb = (y) => (f0 + be * y * 1000) * 1e4;
          let lo = Infinity, hi = -Infinity; for (let k = 0; k <= 60; k++) { const y = -L / 1000 + 2 * L / 1000 * k / 60; for (const g of [fe, fb]) { lo = Math.min(lo, g(y)); hi = Math.max(hi, g(y)); } }
          lo = Math.min(lo, ff()); hi = Math.max(hi, ff());
          const pad = Math.max(0.08, (hi - lo) * 0.12);
          Fs.setView([-L / 1000, L / 1000], [Math.max(lo - pad, -1.7), Math.min(hi + pad, 1.8)]);
          Fs.hline(0, { color: 'faint' });
          Fs.between(mode.value === 'f' ? ff : fb, fe, -L / 1000, L / 1000, { fill: mode.value === 'f' ? 'blue' : 'orange', fillAlpha: 0.2 });
          Fs.fn(fe, { color: 'ink', width: 2.8, n: 120 });
          Fs.fn(ff, { color: 'blue', width: 2, dash: [6, 4] });
          Fs.fn(fb, { color: 'orange', width: 2, dash: [6, 4] });
          Fs.dot(0, f0 * 1e4, { r: 4, color: 'gold' });
          // error map
          const m = mode.value;
          Es.heat((x, y) => look(m, x, y), { range: [0, 0.5], cmap: 'theme', color: 'red', key: m, res: 3 });
          Es.contour((x, y) => look(m, x, y), [0.1], { color: 'green', width: 2.4, res: 80 });
          Es.text('10% error', 12, 2.28, { color: 'green', size: 11, plate: true });
        });
        v.legend([['ink', 'exact $2\\Omega\\sin\\varphi$'], ['blue', '$f$-plane: $f_0$', { dash: true }], ['orange', '$\\beta$-plane: $f_0+\\beta y$', { dash: true }]]);
        v.readout(() => {
          const lat0 = hd.x, Lk = Math.pow(10, hd.y), p0 = lat0 * RAD, f0 = 2 * OMEGA * Math.sin(p0), be = 2 * OMEGA * Math.cos(p0) / A_E;
          return `$\\varphi_0=${v.fix(lat0, 1)}^\\circ$, $L=${v.fix(Lk, 0)}$ km ($=${v.fix(Lk * 1000 / A_E / RAD, 1)}^\\circ$ of latitude) · $f_0=${v.fix(f0 * 1e4, 3)}\\times10^{-4}\\,\\mathrm{s^{-1}}$, $\\beta=2\\Omega\\cos\\varphi_0/a=${v.fix(be * 1e11, 3)}\\times10^{-11}\\,\\mathrm{m^{-1}s^{-1}}$ · $\\beta L/f_0=${v.fix(be * Lk * 1000 / Math.max(f0, 1e-12), 2)}$\nmaximum error over the patch: $f$-plane **${v.fix(look('f', lat0, hd.y) * 100, 1)}%**, $\\beta$-plane **${v.fix(look('b', lat0, hd.y) * 100, 1)}%** of the largest $|f|$`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.5
    {
      num: '2.5', kind: 'Concept', name: 'Effective gravity: centrifugal force folded into g',
      statement: String.raw`In the frame of the rotating Earth a resting parcel feels, besides the gravitational attraction $\mathbf g_{\rm grav}=-\nabla\Phi_g$, the centrifugal acceleration $\Omega^2\mathbf r_\perp$ pointing away from the axis, $\mathbf r_\perp$ being its distance vector from the axis. Both derive from potentials, so they combine into an **effective gravity** $\mathbf g=-\nabla\Phi$ with $\Phi=\Phi_g-\tfrac12\Omega^2r^2\cos^2\varphi$. The plumb line points along $\mathbf g$, not toward the centre (it tilts toward the equator, by at most about $0.1^\circ$ near $45^\circ$), and the surfaces of constant $\Phi$ ("level" surfaces, geopotential surfaces) are flattened spheroids. The solid Earth and the oceans settle to such a surface, so with "vertical" defined along $\mathbf g$ and horizontal along the level surface, the centrifugal force disappears from the equations of motion.`,
      idea: String.raw`The centrifugal acceleration is $\Omega^2$ times the perpendicular distance from the axis, the gradient of $\tfrac12\Omega^2r^2\cos^2\varphi$, so it can be absorbed into a geopotential. Near the surface its size relative to gravity is $\Omega^2a/g\approx 0.0035$, small but not negligible: it has a component along the ground, $\Omega^2a\sin\varphi\cos\varphi$, that would push everything toward the equator. Over geological time the planet's shape adjusts until the surface is a level surface of $\Phi$, so that component is exactly cancelled by the slope of the surface: oblateness is the planet's response to its own spin. Only the Coriolis force (2.1) is left in the momentum equation.`,
      caption: String.raw`**Drag the gold observer** along the surface. The left panel is a meridian cross-section whose shape is the numerically solved level surface of $\Phi$ through the equator (its departure from a sphere is magnified by the slider so that you can see it). The middle panel shows the force triangle at your latitude (the centrifugal arrow is magnified so the tilt is visible). **Spin the planet up** with the slider: at 17 times the Earth's spin the equator would be weightless. The right panel plots the tilt of the plumb line against latitude.`,
      deps: ['geo-2.1', 'geog-1.6'],
      refs: ['Vallis'],
      tags: ['gravity', 'centrifugal force', 'geopotential'],
      scope: String.raw`Treats the gravitational field as that of a point mass (so the computed flattening is smaller than the real one, which includes the attraction of the equatorial bulge itself); the correction is of the same order as the effect.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Equatorial_bulge' },
      viz(v) {
        const mult = v.slider('spin rate $\\Omega/\\Omega_{\\rm Earth}$', 0, 15, 1, { step: 0.25 });
        const mag = v.slider('shape magnification', 1, 300, 80, { step: 1 });
        const Xs = v.stage({ x: [-1.55, 1.55], y: [-1.4, 1.4], equal: true, axes: false, height: 350, title: 'meridian cross-section (level surface of $\\Phi$)', weight: 1.1, minWidth: 260 });
        const Ts = v.stage({ x: [-0.35, 0.95], y: [-1.2, 0.25], equal: true, axes: false, height: 350, title: 'forces at the observer', weight: 0.9, minWidth: 240 });
        const Ps = v.stage({ x: [-90, 90], y: [0, 0.12], height: 350, axes: 'box', gutter: true, xticks: [-90, -60, -30, 0, 30, 60, 90], xlabel: 'latitude (°)', ylabel: 'plumb-line tilt (°)', title: 'tilt of the plumb line', weight: 1, minWidth: 240 });
        let lat = 45;
        let tabR = []; for (let i = 0; i <= 45; i++) tabR.push(levelR(i * 2 * RAD, OMEGA) / RE_EQ);
        const rdraw = (deg) => { const f = clamp(Math.abs(deg), 0, 90) / 2; const i = Math.floor(f), t = f - i; return 1 + mag.value * ((1 - t) * tabR[i] + t * tabR[Math.min(i + 1, 45)] - 1); };
        const hd = Xs.handle(0.7, 0.7, { color: 'gold', label: 'you', constrain: (x, y) => { const th = clamp(Math.atan2(y, Math.max(x, 1e-6)), -Math.PI / 2, Math.PI / 2); lat = th / RAD; const r = rdraw(lat); return [r * Math.cos(th), r * Math.sin(th)]; } });
        let lastKey = '';
        v.render(() => {
          const om = OMEGA * mult.value;
          const key = `${mult.value}`;
          if (key !== lastKey) { tabR = []; for (let i = 0; i <= 45; i++) tabR.push(levelR(i * 2 * RAD, om) / RE_EQ); lastKey = key; }
          const phi = lat * RAD;
          // shape
          const shape = []; for (let d = -90; d <= 90; d += 3) { const r = rdraw(d), th = d * RAD; shape.push([r * Math.cos(th), r * Math.sin(th)]); }
          const left = shape.map(([x, y]) => [-x, y]);
          Xs.poly([...shape, ...left.slice().reverse()], { fill: 'blue', fillAlpha: 0.08, color: 'ink', width: 2 });
          Xs.circle(0, 0, 1, { color: 'faint', dash: [4, 4], width: 1 });
          Xs.line(0, -1.3, 0, 1.3, { color: 'muted', dash: [6, 4] });
          Xs.line(-1.2, 0, 1.2, 0, { color: 'faint', dash: [3, 4] });
          Xs.arrow(0, 1.18, 0, 1.38, { color: 'orange', width: 2.2 }); Xs.tex('\\Omega', 0.1, 1.32, { color: 'orange', size: 14 });
          const r = rdraw(lat), P = [r * Math.cos(phi), r * Math.sin(phi)];
          // effective vertical (true direction from the physical field), drawn on the magnified picture
          const rr = levelR(phi, om), dl = 0.02 * RAD, rA = levelR(phi + dl, om), rB = levelR(phi - dl, om);
          const slope = -(rA - rB) / (2 * dl) / rr; // tilt of the level surface from the sphere: tan δ
          const dg = tiltOf(rr, phi, om);
          Xs.arrow(P[0], P[1], P[0] + 0.35 * Math.cos(phi), P[1] + 0.35 * Math.sin(phi), { color: 'muted', width: 1.5, head: 7, dash: [3, 3] });
          Xs.dot(P[0], P[1], { r: 6, color: 'gold' });
          Xs.text('plumb line ≈ radial: ' + v.fix(Math.abs(dg) / RAD, 3) + '° off', P[0], P[1], { dx: 10, dy: -14, size: 11, color: 'muted', plate: true });
          // force triangle in tangent coordinates (x toward the equator, y up)
          const gr = GM / (rr * rr), cn = om * om * rr * Math.cos(phi) ** 2, ch = om * om * rr * Math.sin(phi) * Math.cos(phi) * Math.sign(phi || 1) * 1;
          const k = om > 0 ? 0.45 / (om * om * rr / gr) : 1; // magnification of the centrifugal arrow
          const sx = Math.sign(phi || 1);
          const cX = Math.abs(ch) / gr * k, cY = cn / gr * k;
          Ts.line(0, 0.2, 0, -1.15, { color: 'faint', dash: [4, 4] });
          Ts.arrow(0, 0, 0, -1, { color: 'blue', width: 2.6 }); Ts.tex('\\text{gravitation}', 0.04, -0.55, { color: 'blue', size: 12, align: 'left', dx: 6 });
          Ts.arrow(0, -1, cX, -1 + cY, { color: 'orange', width: 2.4 }); Ts.tex('\\text{centrifugal}\\ (\\times' + v.fix(k / (1) , 0) + ')', cX, -1 + cY, { color: 'orange', size: 12, align: 'left', dx: 8, dy: -4 });
          Ts.arrow(0, 0, cX, -1 + cY, { color: 'ink', width: 2.8 }); Ts.tex('\\mathbf g', cX * 0.5, (-1 + cY) * 0.5, { color: 'ink', size: 14, dx: 12 });
          Ts.line(-0.3, 0, 0.3, 0, { color: 'ink', width: 2 });
          Ts.dot(0, 0, { r: 5, color: 'gold' });
          Ts.text('toward the equator →', 0.5, 0.12, { size: 11, color: 'muted', align: 'center' });
          // tilt vs latitude
          const dmax = tiltOf(RE_EQ, 45 * RAD, om) / RAD;
          Ps.setView([-90, 90], [0, Math.max(0.12, dmax * 1.25)]);
          const pts = []; for (let d = 0; d <= 90; d += 2) pts.push([d, levelFor(d, om)]);
          Ps.path(pts.map(([d, y]) => [-d, y]).reverse().concat(pts), { color: 'accent', width: 2.6 });
          Ps.dot(lat, Math.abs(tiltOf(rr, phi, om)) / RAD, { r: 6, color: 'gold' });
          Ps.hline(0.1, { color: 'faint', dash: [3, 4] }); Ps.text('0.1°', -88, 0.1, { size: 11, color: 'muted', dy: -9 });
          Ps.vline(45, { color: 'faint', dash: [3, 4] }); Ps.vline(-45, { color: 'faint', dash: [3, 4] });
          function levelFor(d, o) { return Math.abs(tiltOf(levelR(d * RAD, o), d * RAD, o)) / RAD; }
        });
        v.readout(() => {
          const om = OMEGA * mult.value, phi = lat * RAD, rr = levelR(phi, om);
          const dl = 0.02 * RAD, slope = Math.atan(-(levelR(phi + dl, om) - levelR(phi - dl, om)) / (2 * dl) / rr), dg = Math.abs(tiltOf(rr, phi, om));
          const rp = levelR(Math.PI / 2, om), fl = (RE_EQ - rp) / RE_EQ;
          const gr = GM / (rr * rr), ge = Math.hypot(gr - om * om * rr * Math.cos(phi) ** 2, om * om * rr * Math.sin(phi) * Math.cos(phi));
          return `$\\varphi=${sgn(v, lat, 1)}^\\circ$ · $g_{\\rm grav}=${v.fix(gr, 3)}$, $\\Omega^2a\\cos\\varphi=${v.fix(om * om * rr * Math.cos(phi), 4)}$ → $|\\mathbf g|=${v.fix(ge, 3)}\\ \\mathrm{m/s^2}$ · tilt of $\\mathbf g$ from the radius: ${v.fix(dg / RAD, 4)}°, slope of the computed level surface: ${v.fix(Math.abs(slope) / RAD, 4)}° (they agree: the surface is normal to $\\mathbf g$)\nflattening $(r_e-r_p)/r_e=${v.fix(fl, 5)}$ = 1/${fl > 0 ? v.fix(1 / fl, 0) : '∞'} for a point-mass Earth; $\\Omega^2a/g=${v.fix(om * om * RE_EQ / gr, 5)}$`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.6
    {
      num: '2.6', kind: 'Paradox', name: 'The bathtub-vortex myth',
      statement: String.raw`It is commonly said that bath water drains anticlockwise in the northern hemisphere and clockwise in the southern, because of the Coriolis force. In a sink or tub ($L\sim0.3$ m, $U\sim0.1$ m/s) the Rossby number is of order $10^3$, so the Coriolis force is negligible, and the direction is set by whatever residual rotation of the water, or asymmetry of the basin, is left from filling. Only if the water is left undisturbed for a day or more, in a very symmetric tank, does the Coriolis effect decide, as the careful experiments of Shapiro (Boston) and of Trefethen et al. (Sydney) found. The large-scale cyclonic/anticyclonic rotation of weather systems, with $\mathrm{Ro}\lesssim1$, is a different matter.`,
      idea: String.raw`A ring of fluid that contracts from radius $R_0$ to $r$ conserves its absolute angular momentum: $rv_\theta+\tfrac12fr^2=R_0v_0+\tfrac12fR_0^2$. Starting from rest relative to the Earth ($v_0=0$) the swirl acquired near the drain is only $v_\theta\approx fR_0^2/2r$, a few mm/s at best for a tub and far below any residual swirl $v_0R_0/r$ from stirring ($v_0$ of a mm/s already wins). So the effect is $1/\mathrm{Ro}$ times smaller than the advection (2.3). Residual rotation decays only slowly, by Ekman spin-down on a timescale $H/\sqrt{\nu\,f/2}$ (hours for tub-sized depths), so reliable experiments wait many such times.`,
      caption: String.raw`Left: top-down view of fluid rings spiralling into the drain, including both the Coriolis-induced swirl and the residual swirl you set (**rate, sense, waiting time**). Middle: the ratio of the residual swirl to the Coriolis swirl against waiting time (log scale): the Coriolis effect wins only below the green line. Right: the two swirl velocities against radius. Spin the planet faster with the last slider to see the Coriolis effect take over.`,
      deps: ['geo-2.3'],
      refs: ['Vallis'],
      tags: ['Coriolis', 'misconception', 'Rossby number'],
      credit: 'A. H. Shapiro, 1962; L. M. Trefethen et al., 1965',
      scope: String.raw`Idealised axisymmetric drain with inviscid ring contraction and exponentially decaying initial swirl; real tubs also have wall boundary layers, asymmetries and residual convection.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Coriolis_force' },
      viz(v) {
        const lat = v.slider('latitude $\\varphi$ (°)', -80, 80, 45, { step: 1 });
        const stir = v.slider('stirring left after filling (rev/min)', 0.001, 10, 0.3, { log: true });
        const sense = v.select('sense of stirring', [{ value: 1, label: 'anticlockwise' }, { value: -1, label: 'clockwise' }], -1);
        const wait = v.slider('waiting time (h)', 0, 120, 0, { step: 1 });
        const mult = v.slider('planet spin ($\\times$ Earth)', 1, 10000, 1, { log: true, sig: 2 });
        const R0 = 0.3, H = 0.3, NU = 1e-6, rmin = 0.012, q = (R0 * R0 - rmin * rmin) / (2 * 120);
        const s1 = v.stage({ x: [-0.34, 0.34], y: [-0.34, 0.34], equal: true, axes: false, height: 330, title: 'view from above (cm)', weight: 0.95, minWidth: 250 });
        const s2 = v.stage({ x: [0, 120], y: [1e-3, 1e5], ylog: true, height: 330, axes: 'box', gutter: true, xlabel: 'waiting time (h)', ylabel: '(residual swirl)/(Coriolis swirl)', title: 'does the planet decide?', weight: 1, minWidth: 250 });
        const s3 = v.stage({ x: [0.012, 0.3], y: [1e-6, 1], xlog: true, ylog: true, height: 330, axes: 'box', gutter: true, xlabel: 'radius $r$ (m)', ylabel: 'swirl speed $v_\\theta$ (m/s)', title: 'swirl at radius $r$', weight: 1, minWidth: 250 });
        const hw = s2.handle(0, 1, { color: 'gold', label: 'wait', constrain: (x) => { const t = clamp(x, 0, 120); wait.set(Math.round(t)); return [t, Math.max(ratioAt(t), 1.01e-3)]; } });
        const par = () => {
          const f = fcor(lat.value, mult.value), Om = Math.abs(f) / 2, tau = H / Math.sqrt(NU * Math.max(Om, 1e-9));
          const w0 = stir.value * TAU / 60 * sense.value; // rad/s, + anticlockwise
          return { f, tau, w0 };
        };
        function ratioAt(th) { const { f, tau, w0 } = par(); return 2 * Math.abs(w0) * Math.exp(-th * 3600 / tau) / Math.max(Math.abs(f), 1e-12); }
        v.render(() => {
          const { f, tau, w0 } = par(), w = w0 * Math.exp(-wait.value * 3600 / tau), v0 = w * R0;
          const vth = (r) => (R0 / r) * v0 + 0.5 * f * (R0 * R0 / r - r);
          // spiral: dθ = −(vθ/q) dr
          const N = 260, rs = [], th = [0]; for (let i = 0; i <= N; i++) rs.push(R0 * Math.pow(rmin / R0, i / N));
          for (let i = 1; i <= N; i++) { const a = vth(rs[i - 1]), b = vth(rs[i]); th.push(th[i - 1] + 0.5 * (a + b) / q * (rs[i - 1] - rs[i])); }
          const nrings = 10;
          for (let k = 0; k < nrings; k++) {
            const off = TAU * k / nrings;
            s1.path(rs.map((r, i) => [r * Math.cos(off + th[i]), r * Math.sin(off + th[i])]), { color: k === 0 ? 'gold' : 'accent', width: k === 0 ? 2.4 : 1.4, alpha: k === 0 ? 1 : 0.8 });
          }
          s1.circle(0, 0, R0, { color: 'muted', width: 1.6 });
          s1.circle(0, 0, rmin, { color: 'ink', width: 1.6, fill: 'ink', fillAlpha: 0.3 });
          const net = th[N];
          const tot = Math.abs(net), turns = tot / TAU;
          s1.corner(Math.abs(v0) < 1e-12 && Math.abs(f) < 1e-12 ? 'no swirl' : `drains ${net > 0 ? 'anticlockwise' : 'clockwise'}`, 'tl', { color: net > 0 ? 'orange' : 'purple', plate: true });
          s1.corner(`${v.fix(turns, turns < 0.1 ? 4 : 2)} turns on the way in`, 'bl', { color: 'muted' });
          s1.text('tub', 0.2, 0.2, { size: 11, color: 'muted' });
          // ratio
          s2.hline(1, { color: 'green', width: 2.6 }); s2.text('Coriolis wins below this line', 118, 1, { color: 'green', size: 11, align: 'right', dy: -10 });
          s2.fn((t) => Math.max(ratioAt(t), 1e-4), { domain: [0, 120], color: 'accent', width: 2.6, n: 160 });
          hw.set(wait.value, Math.max(ratioAt(wait.value), 1.01e-3));
          // profiles
          const rr = []; for (let i = 0; i <= 80; i++) rr.push(0.012 * Math.pow(0.3 / 0.012, i / 80));
          s3.path(rr.map((r) => [r, Math.max(Math.abs(R0 / r * v0), 1e-9)]), { color: 'orange', width: 2.4 });
          s3.path(rr.map((r) => [r, Math.max(Math.abs(0.5 * f * (R0 * R0 / r - r)), 1e-9)]), { color: 'blue', width: 2.4 });
          s3.path(rr.map((r) => [r, Math.max(Math.abs(vth(r)), 1e-9)]), { color: 'ink', width: 1.4, dash: [5, 4] });
        });
        v.legend([['orange', 'residual swirl'], ['blue', 'Coriolis swirl'], ['ink', 'total', { dash: true }]]);
        v.readout(() => {
          const { f, tau, w0 } = par(), R = ratioAt(wait.value), tStar = R > 1 || true ? tau * Math.log(Math.max(2 * Math.abs(w0) / Math.max(Math.abs(f), 1e-12), 1)) / 3600 : 0;
          return `$f=${sgn(v, f * 1e4, 2)}\\times10^{-4}\\,\\mathrm{s^{-1}}$ · basin $L=0.3$ m, $U=\\tfrac12 fR_0\\approx${v.sci(0.5 * Math.abs(f) * R0, 1)}$ m/s from the planet alone; residual $v_0=\\omega R_0=${v.sci(Math.abs(w0) * R0 * Math.exp(-wait.value * 3600 / tau), 2)}$ m/s\nresidual/Coriolis = **${R > 100 ? v.sci(R, 2) : v.fix(R, 2)}** → ${R > 1 ? 'the leftover stirring decides the direction' : 'the planet decides the direction'} · spin-down time $H/\\sqrt{\\nu f/2}=${v.fix(tau / 3600, 1)}$ h; the ratio falls below 1 after ≈ ${v.fix(tStar, 0)} h`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.7
    {
      num: '2.7', kind: 'Theorem', name: 'Taylor–Proudman theorem and Taylor columns',
      statement: String.raw`For a homogeneous (constant-density) fluid in a frame rotating at $\boldsymbol\Omega=\Omega\hat{\mathbf k}$, suppose the motion is steady, inviscid and slow enough that the Rossby number (2.3) is small, so that the momentum equation reduces to $2\boldsymbol\Omega\times\mathbf u=-\nabla p/\rho$. Taking its curl and using $\nabla\!\cdot\!\mathbf u=0$ gives
$$\frac{\partial\mathbf u}{\partial z}=0:$$
the whole velocity field, all three components, is independent of the coordinate along the rotation axis. The flow is therefore two-dimensional and rigid along $z$; in particular an obstacle on the bottom of a rotating fluid is the base of a **Taylor column**, a cylinder of nearly stagnant fluid extending through the whole depth (and the flow goes around it).`,
      idea: String.raw`Take the curl of $2\Omega\hat{\mathbf k}\times\mathbf u=-\nabla p/\rho$: the right side vanishes, and the left becomes $2\Omega\,\partial\mathbf u/\partial z$ once $\nabla\!\cdot\!\mathbf u=0$ is used. Equivalently, geostrophic balance (3.1) is hydrostatic-free in a homogeneous fluid, so the pressure, and hence the horizontal velocity, cannot vary with $z$, and continuity then makes $w$ uniform too. It fails when the flow changes on the time scale $1/\omega$ of rotation or faster: rotating fluids carry **inertial waves** of frequency $\omega=2\Omega|k_z|/|\mathbf k|<2\Omega$, so a slow disturbance ($\omega\ll f$) has $k_z\ll|\mathbf k|$ (columns) while a fast one ($\omega>f$) cannot propagate and stays near its source.`,
      caption: String.raw`A ridge on the floor is swept slowly to and fro at frequency $\omega$ in a rotating fluid of Coriolis parameter $f$ (here: the exact linear inertial-wave response, a 2-D version of the Taylor column). The colours show the stream function (arrows: the velocity) at the moment shown; the right panel shows its amplitude along the vertical through the ridge. **Slide $f/\omega$**: at large $f/\omega$ the disturbance stands as a tall rigid column of height $\sim a\sqrt{(f/\omega)^2-1}$; as $f/\omega\to1$ it breaks up, and for $f/\omega<1$ (or $f=0$) it decays within about one ridge width, as in an ordinary non-rotating fluid.`,
      deps: ['geo-2.3', 'fluid-3.11'],
      refs: ['Vallis'],
      tags: ['Taylor–Proudman', 'rotating fluid', 'inertial waves'],
      credit: 'J. Proudman, 1916; G. I. Taylor, 1917 and 1923',
      scope: String.raw`Linear, inviscid, homogeneous fluid with $\mathrm{Ro}\ll1$ and slow time dependence ($\omega\ll f$); viscous (Ekman) and stratification effects limit real columns.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Taylor%E2%80%93Proudman_theorem' },
      viz(v) {
        const th = v.slider('rotation rate over forcing frequency, $f/\\omega$', 0, 12, 5, { step: 0.05 });
        const sf = v.stage({ x: [-4, 4], y: [0, 5], equal: true, axes: false, height: 340, title: 'streamfunction $\\psi$ and velocity (x–z plane)', weight: 1.3, minWidth: 300 });
        const sp = v.stage({ x: [0, 1.05], y: [0, 5], height: 340, axes: 'box', gutter: true, xlabel: 'amplitude of $\\psi$ above the ridge crest', ylabel: 'height $z/a$', title: 'how far up does it reach?', weight: 0.7, minWidth: 230 });
        const NX = 161, NZ = 101, X0 = -4, DX = 8 / (NX - 1), DZ = 5 / (NZ - 1);
        let gridKey = null, grid = null;
        function field(T) {
          if (gridKey === T) return grid; gridKey = T;
          const g = new Float64Array(NX * NZ);
          if (T > 1) { // hyperbolic: ψ = ½[ψb(x − cz) + ψb(x + cz)], c = 1/√(T²−1)
            const c = 1 / Math.sqrt(T * T - 1), gs = (x) => Math.exp(-x * x / 2);
            for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const x = X0 + i * DX, z = j * DZ; g[j * NX + i] = 0.5 * (gs(x - c * z) + gs(x + c * z)); }
          } else { // elliptic: Poisson extension of a Gaussian with decay exp(−|k| z/s), s = √(1−T²)
            const s = Math.sqrt(Math.max(1 - T * T, 1e-9));
            const NK = 220, kmax = 7, dk = kmax / NK;
            for (let j = 0; j < NZ; j++) { const zp = j * DZ / s; const amp = []; for (let m = 0; m <= NK; m++) { const k = m * dk; amp.push(Math.exp(-k * k / 2 - k * zp) * dk * (m === 0 || m === NK ? 0.5 : 1) / Math.PI); }
              for (let i = 0; i < NX; i++) { const x = X0 + i * DX; let sum = 0; for (let m = 0; m <= NK; m++) sum += amp[m] * Math.cos(m * dk * x); g[j * NX + i] = sum * Math.sqrt(TAU); } }
          }
          grid = g; return g;
        }
        const at = (g, x, z) => { const fx = clamp((x - X0) / DX, 0, NX - 1.001), fz = clamp(z / DZ, 0, NZ - 1.001), i = Math.floor(fx), j = Math.floor(fz), a = fx - i, b = fz - j; return (1 - b) * ((1 - a) * g[j * NX + i] + a * g[j * NX + i + 1]) + b * ((1 - a) * g[(j + 1) * NX + i] + a * g[(j + 1) * NX + i + 1]); };
        v.animate((t) => {
          const T = th.value, g = field(T), ph = Math.cos(t * 0.9 * 1.0);
          sf.heat((x, z) => at(g, x, z) * ph, { range: [-1, 1], cmap: 'theme-diverging', neg: 'blue', pos: 'orange', key: `${T}|${ph.toFixed(2)}`, res: 3 });
          sf.contour((x, z) => at(g, x, z) * ph, [-0.8, -0.6, -0.4, -0.2, 0.2, 0.4, 0.6, 0.8], { color: 'ink', width: 0.9, alpha: 0.5, res: 70 });
          sf.field((x, z) => { const e = 0.02; return [(at(g, x, z + e) - at(g, x, z - e)) / (2 * e) * ph, -(at(g, x + e, z) - at(g, x - e, z)) / (2 * e) * ph]; }, { color: 'ink', spacing: 30, alpha: 0.7 });
          // ridge on the floor
          const rid = []; for (let x = -4; x <= 4.001; x += 0.1) rid.push([x, 0.28 * Math.exp(-x * x / 2) * (ph >= 0 ? 1 : 1)]);
          sf.poly([[-4, 0], ...rid, [4, 0]], { fill: 'ink', fillAlpha: 0.55, color: 'ink' });
          sf.text(T === 0 ? 'no rotation' : T > 1 ? 'rotating, $f>\\omega$: beams' : 'rotating, $f<\\omega$: no waves', -3.9, 4.7, { size: 12, color: 'muted', plate: true });
          if (T > 1) { const c = 1 / Math.sqrt(T * T - 1); sf.line(0, 0, Math.min(4, c * 5), 5, { color: 'green', dash: [5, 4] }); sf.line(0, 0, -Math.min(4, c * 5), 5, { color: 'green', dash: [5, 4] }); }
          // amplitude profile
          const prof = []; for (let j = 0; j < NZ; j++) prof.push([g[j * NX + (NX - 1) / 2] / g[(NX - 1) / 2], j * DZ]);
          sp.path(prof, { color: 'accent', width: 2.6 });
          sp.vline(0.5, { color: 'faint', dash: [3, 4] });
          // reference: no rotation (Laplace)
          if (T !== 0) { const c0 = []; const gl = (z) => { let s = 0; const NK = 160, dk = 7 / NK; for (let m = 0; m <= NK; m++) s += Math.exp(-((m * dk) ** 2) / 2 - m * dk * z) * dk * (m === 0 || m === NK ? 0.5 : 1) / Math.PI; return s * Math.sqrt(TAU); };
            const n0 = gl(0); for (let j = 0; j < NZ; j += 2) c0.push([gl(j * DZ) / n0, j * DZ]); sp.path(c0, { color: 'red', width: 1.8, dash: [5, 4] }); }
          if (T > 1) { const zh = 1.1774 * Math.sqrt(T * T - 1); if (zh < 5) { sp.hline(zh, { color: 'green', dash: [4, 4] }); sp.text('$1.18\\sqrt{(f/\\omega)^2-1}$', 1.02, zh, { size: 11, color: 'green', align: 'right', dy: -9 }); } }
        }, { period: 7, still: 0 });
        v.legend([['accent', 'amplitude, this rotation'], ['red', 'no rotation', { dash: true }], ['green', 'beam / predicted half-height', { dash: true }]]);
        v.readout(() => {
          const T = th.value, g = field(T), mid = (NX - 1) / 2, A0 = g[mid];
          let zh = 5; for (let j = 0; j < NZ; j++) if (g[j * NX + mid] / A0 < 0.5) { zh = (j - 1 + (g[(j - 1) * NX + mid] / A0 - 0.5) / (g[(j - 1) * NX + mid] / A0 - g[j * NX + mid] / A0)) * DZ; break; }
          // vertical rigidity: variation of ψ between z = 0 and z = a above the crest
          const j1 = Math.round(1 / DZ), rig = g[j1 * NX + mid] / A0;
          return `$f/\\omega=${v.fix(T, 2)}$ · amplitude half-way height measured on the computed field: **${zh >= 4.99 ? '> 5' : v.fix(zh, 2)}** $a$${T > 1 ? `; theorem-regime prediction $1.177\\sqrt{(f/\\omega)^2-1}=${v.fix(1.1774 * Math.sqrt(T * T - 1), 2)}$ $a$` : ''} · at one ridge width above the crest the amplitude is still ${v.fix(rig * 100, 0)}% of its floor value (non-rotating: ${v.fix(100 * (function () { let s = 0, s0 = 0; const NK = 160, dk = 7 / NK; for (let m = 0; m <= NK; m++) { const w = (m === 0 || m === NK ? 0.5 : 1); s += Math.exp(-((m * dk) ** 2) / 2 - m * dk) * w; s0 += Math.exp(-((m * dk) ** 2) / 2) * w; } return s / s0; })(), 0)}%)`;
        });
      },
    },
  ],
};
