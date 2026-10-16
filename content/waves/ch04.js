// Waves & Optics — Chapter 4: Light at interfaces (items 4.1–4.8; 4.9–4.15 are in ch04-b.js)
import { TAU, deg, rad, fresnel, carg } from './ch04.shared.js';

/**
 * Huygens construction at a plane interface (used by 4.5 and 4.6). A plane wave of speed 1/n1 hits the line y = 0 at angle th1
 * (from the normal) and sweeps along the interface from xs to xe; every point struck so far emits a wavelet, and the new front
 * is the common tangent. Everything below is geometry: wavelet radii and tangent lines, no Snell/reflection law is used.
 */
function interfaceViz(v, refract) {
  const XS = -3, XE = 3, P = 8;
  const n1S = v.slider('index of the upper medium $n_1$', 1, 2.5, 1, { step: 0.01 });
  const n2S = v.slider('index of the lower medium $n_2$', 1, 2.5, 1.5, { step: 0.01 });
  if (!refract) { n1S.el.hidden = true; n2S.el.hidden = true; }
  const aS = v.slider('angle of incidence $\\theta_1$ (degrees)', 5, 80, 35, { step: 1 });
  const S = v.stage(refract
    ? { x: [-5.2, 5.2], y: [-4.2, 4.4], equal: true, axes: false, height: 440, title: 'wavelets from the points the front has already reached' }
    : { x: [-5.2, 5.2], y: [-1.2, 5.2], equal: true, axes: false, height: 400, title: 'wavelets from the points of the mirror already reached' });
  let rd = null;
  const hit = (cx, r0, px, sgn) => { // tangent point from P=(px,0) to the circle (cx,0), radius r0, on side sgn (+1 up, -1 down)
    const d = px - cx; if (r0 >= d) return null;
    const b = Math.acos(r0 / d); return [cx + r0 * Math.cos(b), sgn * r0 * Math.sin(b)];
  };
  v.animate((t) => {
    const n1 = refract ? n1S.value : 1, n2 = refract ? n2S.value : 1, th1 = rad(aS.value);
    const u = (t % P) / P, xt = XS + 0.02 + u * (XE - XS - 0.02), d = xt - XS;
    const s1 = Math.sin(th1), c1 = Math.cos(th1);
    if (refract) {
      S.rect(-5.2, -4.2, 5.2, 0, { fill: 'blue', fillAlpha: Math.min(0.28, 0.06 + 0.1 * (n2 - 1)), stroke: false });
      S.rect(-5.2, 0, 5.2, 4.4, { fill: 'blue', fillAlpha: Math.min(0.28, 0.06 + 0.1 * (n1 - 1)), stroke: false });
      S.line(-5.2, 0, 5.2, 0, { color: 'ink', width: 1.5 });
    } else {
      S.rect(-5.2, -1.2, 5.2, 0, { fill: 'muted', fillAlpha: 0.25, hatch: true, stroke: false });
      S.line(-5.2, 0, 5.2, 0, { color: 'ink', width: 3 });
    }
    S.line(0, -(refract ? 3.6 : 0.2), 0, 4.3, { color: 'faint', width: 1, dash: [3, 4] });
    S.line(XS, 0, XE, 0, { color: 'gold', width: 4 });
    // incident front
    const L = (XE - xt) * c1;
    S.line(xt, 0, xt + L * c1, L * s1, { color: 'accent', width: 3 });
    // beam edges
    const dir = [s1, -c1];
    S.line(XS - 3.6 * dir[0], 3.6 * c1, XS, 0, { color: 'accent', width: 1, alpha: 0.4, dash: [4, 4] });
    S.line(XE - 3.6 * dir[0], 3.6 * c1, XE, 0, { color: 'accent', width: 1, alpha: 0.4, dash: [4, 4] });
    S.arrow(-1.8 * dir[0], 1.8 * c1, -0.5 * dir[0], 0.5 * c1, { color: 'accent', width: 1.6, head: 8 });
    const N = 12;
    let thR = null, thT = null, ratio = null;
    for (let k = 0; k < N; k++) {
      const xk = XS + (d * k) / (N - 1);
      if (d < 1e-3) break;
      const rr = (xt - xk) * s1;
      if (rr < 0.01) continue;
      if (!refract) S.curve((a) => [xk + rr * Math.cos(a), rr * Math.sin(a)], 0, Math.PI, { color: 'green', width: 1, alpha: 0.7, n: 60 });
      else {
        const r2 = ((n1 / n2) * (xt - xk) * s1);
        S.curve((a) => [xk + r2 * Math.cos(a), -r2 * Math.sin(a)], 0, Math.PI, { color: 'green', width: 1, alpha: 0.7, n: 60 });
        S.curve((a) => [xk + rr * Math.cos(a), rr * Math.sin(a)], 0, Math.PI, { color: 'purple', width: 1, alpha: 0.3, n: 60 });
      }
    }
    if (d > 0.15) {
      const r0 = d * s1; // distance the very first wavelet has travelled (in medium 1 for reflection)
      const T1 = hit(XS, r0, xt, 1);
      if (T1) {
        S.line(xt, 0, T1[0], T1[1], { color: refract ? 'purple' : 'green', width: refract ? 2 : 3.2, dash: refract ? [5, 4] : false });
        thR = deg(Math.atan2(T1[1], xt - T1[0]));
      }
      if (refract) {
        const rt = (n1 / n2) * d * s1;
        const T2 = hit(XS, rt, xt, -1);
        if (T2) {
          S.line(xt, 0, T2[0], T2[1], { color: 'green', width: 3.2 });
          thT = deg(Math.atan2(-T2[1], xt - T2[0]));
          S.dot(T2[0], T2[1], { r: 3, color: 'green' });
        }
        ratio = rt / d;
      }
    }
    rd = { n1, n2, th1: aS.value, thR, thT, ratio, d };
  }, { period: P, still: 4.4 });
  v.legend(refract
    ? [['accent', 'incident front'], ['green', 'wavelets and front in medium 2'], ['purple', 'reflected (not the subject here)', { dash: true }], ['gold', 'points reached so far']]
    : [['accent', 'incident front'], ['green', 'wavelets and reflected front'], ['gold', 'points of the mirror reached so far']]);
  v.readout(() => {
    if (!rd) return '';
    if (!refract) return rd.thR == null ? 'the wave has only just touched the mirror' : `incident angle (from the normal) $\\theta_1=${v.fix(rd.th1, 1)}^\\circ$ · reflected front built from the wavelets leaves at $\\theta_r=${v.fix(rd.thR, 2)}^\\circ$`;
    if (rd.d <= 0.15) return 'the wave has only just touched the interface';
    if (rd.thT == null) return `$n_1\\sin\\theta_1=${v.fix(rd.n1 * Math.sin(rad(rd.th1)), 3)}>n_2$: the wavelets in medium 2 are too small for the points reached to share a tangent line, so no refracted wave exists (total internal reflection, 4.9)`;
    return `$n_1\\sin\\theta_1=${v.fix(rd.n1 * Math.sin(rad(rd.th1)), 4)}$ · refracted front measured from the wavelets: $\\theta_2=${v.fix(rd.thT, 2)}^\\circ$, so $n_2\\sin\\theta_2=${v.fix(rd.n2 * Math.sin(rad(rd.thT)), 4)}$ · wavelet radius in 2 over radius in 1 $=n_1/n_2=${v.fix(rd.ratio, 3)}$`;
  });
}

export default {
  collection: 'waves',
  chapter: 4,
  title: 'Light at interfaces',
  summary: String.raw`Light is an electromagnetic wave whose speed in matter is reduced by the refractive index. Huygens’ wavelet construction gives the laws of reflection and refraction, and the electromagnetic boundary conditions give their strengths — the Fresnel equations — with Brewster’s angle, total internal reflection, the evanescent wave and the half-wave phase flip as consequences. Dispersion splits white light in prisms and rainbows, fibres trap light by total internal reflection, and absorbing media dim it exponentially.`,
  items: [
    // ------------------------------------------------------------------ 4.1
    {
      num: '4.1',
      kind: 'Model',
      name: 'Light as an electromagnetic wave',
      statement: String.raw`Maxwell’s equations in empty space admit transverse waves of electric and magnetic field travelling at the speed $c=1/\sqrt{\mu_0\varepsilon_0}\approx 2.998\times10^{8}$ m/s, and **light is such a wave**. Every wave of this kind obeys $c=\lambda f$ and carries photon energy $E=hf=hc/\lambda$ in the quantum description. The visible colours are one narrow band, roughly $380$–$750$ nm, of a spectrum that stretches continuously from radio waves ($\lambda\gtrsim1$ m) through microwaves, infrared, visible and ultraviolet light to X-rays and gamma rays ($\lambda\lesssim10$ pm); the names are conventions, and nothing changes physically at their borders.`,
      idea: String.raw`Maxwell found (1865) that the speed of his field disturbances equals the measured speed of light, and concluded that light is electromagnetic; Hertz produced and measured radio waves with the same properties in 1887–88. The plane-wave solutions of em-11.2 give a wave of any wavelength, so the differences between a radio wave and a gamma ray are differences in $\lambda$ (and hence in how matter responds, and in photon energy), not in kind. The frequency of a wave never changes; $\lambda$ and speed change together when it enters matter (4.3).`,
      caption: String.raw`Drag the wavelength slider over eighteen decades (or jump to examples): the vertical line moves across the spectrum, and the readout gives frequency and photon energy from $f=c/\lambda$ and $E=hc/\lambda$. The lower strip magnifies the visible band, coloured by wavelength; outside it the lower panel says so. Band borders are conventional and differ between textbooks.`,
      deps: ['em-11.2', 'waves-1.4'],
      refs: ['Hecht ch. 3'],
      tags: ['electromagnetic spectrum', 'light'],
      scope: String.raw`Band boundaries are conventions (the ones used here: gamma below 10 pm, X-rays to 10 nm, ultraviolet to 380 nm, visible to 750 nm, infrared to 1 mm, microwaves to 1 m). The relation $c=\lambda f$ holds in vacuum; in a medium use $v=\lambda f$ with $v=c/n$.`,
      credit: 'Maxwell, 1865; Hertz, 1887–88',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Electromagnetic_spectrum' },
      viz(v) {
        const M = v.M, C = M.CONST;
        const bands = [
          [1e-14, 1e-11, 'gamma rays', 'pink'], [1e-11, 1e-8, 'X-rays', 'purple'], [1e-8, 3.8e-7, 'ultraviolet', 'blue'],
          [3.8e-7, 7.5e-7, 'visible', 'green'], [7.5e-7, 1e-3, 'infrared', 'red'], [1e-3, 1, 'microwaves', 'orange'], [1, 1e4, 'radio waves', 'teal'],
        ];
        const lS = v.slider('wavelength $\\lambda$ (m)', 1e-14, 1e4, 5.5e-7, { log: true, sig: 3, fmt: (x) => x.toExponential(1) });
        const jump = [['FM radio, 100 MHz', 3], ['microwave oven, 2.45 GHz', C.c / 2.45e9], ['thermal infrared, 10 µm', 1e-5], ['green light', 5.5e-7], ['medical X-ray, 0.1 nm', 1e-10], ['gamma ray, 1 pm', 1e-12]];
        for (const [nm, x] of jump) v.button(nm, () => lS.set(x));
        const S = v.stage({ x: [1e-14, 1e4], xlog: true, y: [0, 1], axes: 'box', gutter: true, xlabel: 'wavelength (m)', yticks: [], height: 190, full: true, title: 'the electromagnetic spectrum' });
        const Z = v.stage({ x: [380, 750], y: [0, 1], axes: 'box', gutter: true, xlabel: 'wavelength (nm)', yticks: [], height: 120, full: true, title: 'the visible band' });
        let info = null;
        v.render(() => {
          const lam = lS.value, f = C.c / lam, E = (C.h * f) / C.e;
          bands.forEach(([a, b, name, col], i) => {
            S.vband(a, b, { color: col, alpha: 0.18 });
            S.text(name, name === 'visible' ? 5.3e-7 : Math.sqrt(a * b), name === 'visible' ? 0.78 : i % 2 ? 0.3 : 0.55, { size: 12, color: 'muted', align: 'center' });
          });
          for (let k = 0; k < 40; k++) { const a = 3.8e-7 * Math.pow(7.5 / 3.8, k / 40), b = 3.8e-7 * Math.pow(7.5 / 3.8, (k + 1) / 40); S.vband(a, b, { color: M.wavelengthRGB(a * 1e9 * 1.0), alpha: 0.9 }); }
          S.vline(lam, { color: 'ink', width: 2 });
          S.dot(lam, 0.9, { r: 5, color: 'gold' });
          Z.raster((x) => M.wavelengthRGB(x), { res: 2, key: 'strip' });
          const vis = lam >= 3.8e-7 && lam <= 7.5e-7;
          if (vis) { Z.vline(lam * 1e9, { color: 'ink', width: 2 }); Z.dot(lam * 1e9, 0.5, { r: 6, color: 'gold' }); }
          else Z.text('(outside the visible band)', 565, 0.5, { size: 13, color: 'ink', align: 'center', plate: true });
          info = { lam, f, E, name: (bands.find((b) => lam >= b[0] && lam < b[1]) || bands[6])[2] };
        });
        v.readout(() => (info ? `${info.name} · $\\lambda=${v.sci(info.lam, 3)}$ m · $f=c/\\lambda=${v.sci(info.f, 3)}$ Hz · photon energy $hc/\\lambda=${v.sci(info.E, 3)}$ eV` : ''));
      },
    },
    // ------------------------------------------------------------------ 4.2
    {
      num: '4.2',
      kind: 'Definition',
      name: 'Irradiance',
      statement: String.raw`The **irradiance** (intensity) $I$ of a light wave is the time average of the magnitude of its Poynting flux $\mathbf S=\mathbf E\times\mathbf B/\mu_0$ over the response time $\tau$ of the detector, in W/m². For a plane wave in vacuum with field amplitude $E_0$,
$$S(t)=c\varepsilon_0E_0^2\cos^2(\omega t),\qquad I=\langle S\rangle=\tfrac12c\varepsilon_0E_0^2 ,$$
and in a medium of index $n$ one gets $I=\tfrac12 n c\varepsilon_0E_0^2$. The flux itself fluctuates at $2\omega$; the average over a window of length $\tau$ leaves a ripple of relative size $|\sin\omega\tau/(\omega\tau)|$, which is negligible once $\tau$ spans many periods. Optical periods are femtoseconds, so every ordinary detector reports only $I$.`,
      idea: String.raw`The Poynting vector (em-11.5) is quadratic in the field, so it is never negative and has the mean value one half of its peak; the oscillating part is $\tfrac12\cos2\omega t$, whose average over a window of $\tau$ is a sinc-shaped fraction of its amplitude. Irradiance is therefore proportional to the *square* of the amplitude: doubling the field quadruples the intensity, and when waves add (6.1) it is amplitudes that add, not irradiances.`,
      caption: String.raw`Blue: the field $E(t)$. Orange: the instantaneous flux $\propto E^2$, flickering at twice the frequency. Green: what a detector with response time $\tau$ (in optical periods) reports, a running average of the orange curve. Make $\tau$ shorter than a period and the ripple appears; make it long and the green line flattens onto the dashed value $\tfrac12$ (which is $I$). The lower graph shows the ripple amplitude, $|\mathrm{sinc}(2\pi\tau/T)|$, against $\tau$; use the field slider to convert to W/m².`,
      deps: ['em-11.5'],
      refs: ['Hecht ch. 3'],
      tags: ['irradiance', 'Poynting flux'],
      scope: String.raw`Plane monochromatic wave, linear medium. For a wave with two or more frequencies the average over $\tau$ also removes beat terms faster than $1/\tau$. The relation $I=\tfrac12 n c\varepsilon_0E_0^2$ uses the phase velocity and a non-magnetic medium.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Irradiance' },
      viz(v) {
        const M = v.M, C = M.CONST;
        const tS = v.slider('detector response time $\\tau$ (optical periods)', 0.05, 20, 0.8, { log: true, sig: 2 });
        const eS = v.slider('field amplitude $E_0$ (V/m)', 1, 5000, 100, { log: true, sig: 2 });
        const A = v.stage({ x: [0, 10], y: [-1.25, 1.25], axes: 'box', gutter: true, xlabel: 'time (optical periods)', yticks: [-1, 0, 0.5, 1], height: 260, full: true, title: 'field, flux, and what the detector reports' });
        const B = v.stage({ x: [0.05, 50], xlog: true, y: [0, 1.05], axes: 'box', gutter: true, xlabel: 'response time τ (optical periods)', ylabel: 'ripple / mean', height: 170, full: true });
        const sinc = (x) => (Math.abs(x) < 1e-9 ? 1 : Math.sin(x) / x);
        v.render(() => {
          const tau = tS.value, w = TAU;
          const flux = (x) => Math.cos(w * x) ** 2;
          const avg = (x) => 0.5 + (0.5 * (Math.sin(2 * w * x) - Math.sin(2 * w * (x - tau)))) / (2 * w * tau);
          A.fn((x) => Math.cos(w * x), { color: 'accent', width: 1.4, n: 1600, alpha: 0.8 });
          A.fn(flux, { color: 'orange', width: 1.6, n: 1600 });
          A.hline(0.5, { color: 'ink', dash: [5, 4], width: 1.2 });
          A.vband(10 - tau < 0 ? 0 : 10 - tau, 10, { color: 'gold', alpha: 0.15 });
          A.fn(avg, { color: 'green', width: 3, n: 1600 });
          B.fn((x) => Math.abs(sinc(w * x)), { color: 'green', width: 2, n: 400 });
          B.vline(tau, { color: 'gold', width: 1.5 });
          B.dot(tau, Math.abs(sinc(w * tau)), { r: 5, color: 'gold' });
        });
        v.legend([['accent', 'field $E(t)$'], ['orange', 'flux $\\propto E^2$'], ['green', 'detector reading'], ['gold', 'averaging window', { area: true }]]);
        v.readout(() => {
          const tau = tS.value, E0 = eS.value, I = 0.5 * C.c * C.eps0 * E0 * E0;
          const mean = M.integrate((x) => Math.cos(TAU * x) ** 2, 0, 10, 2000) / 10;
          return `numerical mean of $\\cos^2$ over 10 periods $=${v.fix(mean, 4)}$ (predicted $1/2$) · ripple at this $\\tau$: $${v.fix(Math.abs(sinc(TAU * tau)) * 100, 1)}\\%$ of the mean\n$E_0=${v.fix(E0, 0)}$ V/m gives $I=\\tfrac12c\\varepsilon_0E_0^2=${v.fix(I, I < 10 ? 3 : 1)}$ W/m² (full sunlight, about 1000 W/m², corresponds to $E_0\\approx870$ V/m)`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.3
    {
      num: '4.3',
      kind: 'Definition',
      name: 'Refractive index and optical path length',
      statement: String.raw`The **refractive index** of a transparent medium is $n=c/v$, the ratio of the speed of light in vacuum to its phase speed in the medium; the frequency is unchanged on entering, so the wavelength shrinks to $\lambda=\lambda_0/n$. Along a path $\gamma$ the **optical path length** is
$$\mathrm{OPL}=\int_\gamma n\,ds .$$
It is the distance light would travel in vacuum in the time it takes to traverse $\gamma$ in the medium ($\mathrm{OPL}=c\,t$), and $2\pi\,\mathrm{OPL}/\lambda_0$ is the phase accumulated along the path, so it counts wavelengths, $nL/\lambda_0$ of them in a slab of thickness $L$.`,
      idea: String.raw`In a linear medium the plane-wave solutions of Maxwell's equations keep their frequency but have $k=n\omega/c$ (em-11.8), so a ray of length $L$ spends time $nL/c$ in the medium and its phase advances by $k L=n\omega L/c$. Writing everything in terms of the vacuum wavelength lets interference (chapter 6) be computed by comparing optical path lengths, and it is the quantity that Fermat's principle (5.2) makes stationary.`,
      caption: String.raw`A short pulse (carrier plus envelope) enters a glass slab (orange). Top: the pulse in the slab experiment; bottom: the same pulse in vacuum at the same instant. Inside the slab the wave crests are closer together ($\lambda_0/n$) and the pulse is squeezed, because it moves at $c/n$. Raise $n$ or the thickness and watch the lag behind the vacuum pulse grow: it always equals $(n-1)L$, the extra optical path. Reflections at the slab faces are left out.`,
      deps: ['em-11.8'],
      refs: ['Hecht ch. 4'],
      tags: ['refractive index', 'optical path'],
      scope: String.raw`Non-dispersive, lossless slab (a single index). In a real glass the pulse envelope moves at the group velocity, $c/n_g$, with $n_g=n-\lambda_0\,dn/d\lambda_0$, and the phase at $c/n$ (3.4); the figure uses $n_g=n$.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Optical_path_length' },
      viz(v) {
        const nS = v.slider('index of the slab $n$', 1, 2.5, 1.5, { step: 0.01 });
        const LS = v.slider('slab thickness $L$ (vacuum wavelengths $\\lambda_0$)', 0.5, 6, 3, { step: 0.1 });
        const X0 = -8, X1 = 14, A0 = 2, W = 2.2, TT = 26;
        const S1 = v.stage({ x: [X0, X1], y: [-1.5, 1.5], axes: 'box', gutter: true, xlabel: 'position (units of λ₀)', yticks: [], height: 190, full: true, title: 'with the slab' });
        const S2 = v.stage({ x: [X0, X1], y: [-1.5, 1.5], axes: 'box', gutter: true, xlabel: 'position (units of λ₀)', yticks: [], height: 190, full: true, title: 'vacuum only, same instant' });
        let info = null;
        v.animate((t) => {
          const n = nS.value, L = LS.value, c0 = t - 8;
          const opl = (x) => (x < A0 ? x : x < A0 + L ? A0 + n * (x - A0) : x + (n - 1) * L);
          const E = (x) => { const u = opl(x) - c0; return Math.exp(-((u / W) ** 2)) * Math.cos(TAU * u); };
          const Ev = (x) => { const u = x - c0; return Math.exp(-((u / W) ** 2)) * Math.cos(TAU * u); };
          S1.rect(A0, -1.5, A0 + L, 1.5, { fill: 'orange', fillAlpha: 0.14, color: 'orange' });
          S1.fn(E, { color: 'accent', width: 1.8, n: 2200 });
          S2.rect(A0, -1.5, A0 + L, 1.5, { fill: 'orange', fillAlpha: 0.05, color: 'faint', dash: [4, 4] });
          S2.fn(Ev, { color: 'accent', width: 1.8, n: 1800 });
          // pulse centres: OPL(x) = c0
          const xc = c0 < A0 ? c0 : c0 < A0 + n * L ? A0 + (c0 - A0) / n : c0 - (n - 1) * L;
          S1.dot(xc, 0, { r: 5, color: 'gold' });
          S2.dot(c0, 0, { r: 5, color: 'gold' });
          if (Math.abs(xc - c0) > 0.05) S2.dot(xc, 0, { r: 5, color: 'gold', hollow: true });
          info = { n, L, lag: c0 - xc, inside: xc > A0 && xc < A0 + L };
        }, { period: TT, still: 11.5 });
        v.readout(() => (info ? `slab: $\\lambda=\\lambda_0/n=${v.fix(1 / info.n, 3)}\\,\\lambda_0$, it holds $nL/\\lambda_0=${v.fix(info.n * info.L, 2)}$ wavelengths · $\\mathrm{OPL}=nL=${v.fix(info.n * info.L, 2)}\\,\\lambda_0$ against a geometric length $L=${v.fix(info.L, 2)}\\,\\lambda_0$ · the pulse is now $${v.fix(Math.max(0, info.lag), 2)}\\,\\lambda_0$ behind its vacuum twin (hollow dot), at most $(n-1)L=${v.fix((info.n - 1) * info.L, 2)}\\,\\lambda_0$` : ''));
      },
    },
    // ------------------------------------------------------------------ 4.4
    {
      num: '4.4',
      kind: 'Principle',
      name: 'Huygens’ principle',
      statement: String.raw`Every point of a wavefront may be regarded as the source of a secondary spherical wavelet that spreads at the speed of the wave in the medium. The wavefront a time $t$ later is the **envelope** (common tangent surface) of all these wavelets, those of radius $vt$ centred on the original front. In a homogeneous medium the construction reproduces the propagation of plane and spherical waves, and with a different speed on the two sides of a boundary it yields the laws of reflection and refraction (4.5, 4.6).`,
      idea: String.raw`Huygens proposed the construction in his *Traité de la lumière* (completed 1678, published 1690) to explain reflection, refraction and the double refraction of Iceland spar, with no justification beyond its success. Fresnel (1818) supplied the missing physics by letting the secondary waves *interfere*, the Huygens–Fresnel principle (7.1), and Kirchhoff derived it from the wave equation (7.2). The bare envelope construction has two faults the later theory repairs: it predicts a backward wave, and it cannot say how bright the new front is.`,
      caption: String.raw`A front (green) is cut into $N$ points, each of which emits a half-wavelet of radius $r=vt$ (blue). The thick orange curve is the front obtained from the discs themselves (the upper boundary of their union); the dashed green curve is the exact displaced front. For few points the envelope is scalloped; as $N$ grows it becomes smooth. Choose a plane, diverging or converging front, or a slit, and watch the front follow: bending at the edges of the slit, passing through the focus of the converging wave, and spreading.`,
      deps: ['waves-1.12'],
      refs: ['Hecht ch. 4'],
      tags: ['Huygens', 'wavefront'],
      credit: 'Huygens, 1678 (published 1690)',
      scope: String.raw`A geometric construction for a wave moving in one direction in a homogeneous, isotropic medium. It gives wavefront positions, not amplitudes, and in its bare form lets the wavelets travel backward as well (not drawn here).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Huygens%E2%80%93Fresnel_principle' },
      viz(v) {
        const M = v.M;
        const shape = v.select('initial front', [{ value: 'plane', label: 'plane' }, { value: 'div', label: 'diverging' }, { value: 'conv', label: 'converging' }, { value: 'slit', label: 'slit' }], 'plane');
        const nS = v.slider('number of source points $N$', 3, 60, 9, { int: true });
        const rS = v.slider('time: wavelet radius $r=vt$', 0.05, 5, 1.6, { step: 0.05 });
        const aS = v.slider('slit half-width $a$', 0.4, 2.5, 1.0, { step: 0.05 });
        const S = v.stage({ x: [-4.5, 4.5], y: [-0.6, 5.6], equal: true, axes: false, height: 440, title: 'Huygens’ construction' });
        let info = null;
        v.render(() => {
          aS.el.hidden = shape.value !== 'slit';
          const N = nS.value, r = rS.value;
          let pts = [];
          const R0 = 3.2, span = rad(38);
          if (shape.value === 'plane' || shape.value === 'slit') {
            const hw = shape.value === 'slit' ? aS.value : 3.4;
            for (let i = 0; i < N; i++) { pts.push([-hw + (2 * hw * i) / (N - 1), 0]); }
            S.line(-4.5, 0, -hw, 0, { color: 'faint', width: 5 }); S.line(hw, 0, 4.5, 0, { color: 'faint', width: 5 });
            S.line(-hw, r, hw, r, { color: 'green', width: 1.5, dash: [6, 4] });
            if (shape.value === 'slit') {
              S.curve((a) => [hw + r * Math.cos(a), r * Math.sin(a)], 0, Math.PI / 2, { color: 'green', width: 1.5, dash: [6, 4] });
              S.curve((a) => [-hw - r * Math.cos(a), r * Math.sin(a)], 0, Math.PI / 2, { color: 'green', width: 1.5, dash: [6, 4] });
            }
          } else if (shape.value === 'div') {
            for (let i = 0; i < N; i++) { const f = -span + (2 * span * i) / (N - 1); pts.push([R0 * Math.sin(f), R0 * Math.cos(f) - R0]); }
            S.curve((f) => [(R0 + r) * Math.sin(f), (R0 + r) * Math.cos(f) - R0], -span, span, { color: 'green', width: 1.5, dash: [6, 4], n: 80 });
          } else {
            const Rc = 4.2;
            for (let i = 0; i < N; i++) { const f = -span + (2 * span * i) / (N - 1); pts.push([Rc * Math.sin(f), Rc - Rc * Math.cos(f) - 0]); }
            S.curve((f) => [(Rc - r) * Math.sin(f), Rc - (Rc - r) * Math.cos(f)], -span, span, { color: 'green', width: 1.5, dash: [6, 4], n: 80 });
            S.dot(0, Rc, { r: 4, color: 'muted', hollow: true, label: 'focus', labelPos: 'e' });
          }
          // initial front
          S.path(pts, { color: 'green', width: 2.5 });
          // wavelets
          for (const [px, py] of pts) {
            S.curve((a) => [px + r * Math.cos(a), py + r * Math.sin(a)], 0, Math.PI, { color: 'accent', width: 1, alpha: 0.45, n: 50 });
            S.dot(px, py, { r: 2.5, color: 'accent' });
          }
          // numerical envelope = upper boundary of the union of the discs
          const xs = M.linspace(-4.5, 4.5, 900), up = [];
          for (const x of xs) {
            let best = null;
            for (const [px, py] of pts) { const dx = x - px; if (Math.abs(dx) <= r) { const y = py + Math.sqrt(r * r - dx * dx); if (best == null || y > best) best = y; } }
            up.push(best == null ? null : [x, best]);
          }
          S.path(up, { color: 'orange', width: 3 });
          info = { N, r };
        });
        v.readout(() => info ? `${info.N} wavelets of radius $r=${v.fix(info.r, 2)}$ · thick orange: upper boundary of their union; dashed: exact displaced front (plane: shifted by $r$; spherical: radius $R\\pm r$; slit: edges rounded by quarter-circles of radius $r$)` : '');
      },
    },
    // ------------------------------------------------------------------ 4.5
    {
      num: '4.5',
      kind: 'Law',
      name: 'Law of reflection',
      statement: String.raw`When light is reflected at a smooth plane surface, the reflected ray lies in the plane of incidence (the plane containing the incident ray and the normal), and the angle of reflection equals the angle of incidence:
$$\theta_r=\theta_i .$$
Both angles are measured from the normal. The result holds for any wavelength and for all polarizations; what depends on them is only *how much* is reflected (4.7).`,
      idea: String.raw`With Huygens' principle (4.4): the plane front reaches the mirror point by point, and the wavelet from the first point has spread by $vt$ when the last point is just reached. Since the wavelets stay in the same medium they share one speed, so the common tangent through the contact point and the first wavelet is the mirror image of the incident front: two right triangles with equal hypotenuse and a common side are congruent, giving $\theta_r=\theta_i$. The same law follows from Fermat's principle (5.2) as the path of least length.`,
      caption: String.raw`The blue front sweeps along the mirror; each point of the mirror struck so far (gold) has emitted a wavelet. The green line is the common tangent of the wavelets, the reflected front. Change $\theta_1$ and the reflected front tilts the same way: the readout measures its angle from the geometry of the wavelets and compares it with the incident angle. Pause the animation to inspect any instant.`,
      deps: ['waves-4.4'],
      refs: ['Hecht ch. 4'],
      tags: ['reflection', 'Huygens'],
      credit: 'known to Euclid and Hero of Alexandria (antiquity)',
      verify: true,
      scope: String.raw`Specular reflection from a surface smooth on the scale of the wavelength; a rough surface scatters diffusely (each patch still reflects specularly). Valid in any isotropic medium.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Specular_reflection' },
      viz(v) { interfaceViz(v, false); },
    },
    // ------------------------------------------------------------------ 4.6
    {
      num: '4.6',
      kind: 'Law',
      name: 'Snell’s law of refraction',
      statement: String.raw`A ray passing from a transparent medium of index $n_1$ into one of index $n_2$ stays in the plane of incidence, and its angles to the normal obey
$$n_1\sin\theta_1=n_2\sin\theta_2 .$$
It bends toward the normal on entering the optically denser medium ($n_2>n_1$) and away from it on leaving. If $n_1\sin\theta_1>n_2$ there is no refracted ray (total internal reflection, 4.9). The law also gives the frequency-independent statement that $k_x=\omega n\sin\theta/c$ is the same on both sides, i.e. the phase along the interface is continuous.`,
      idea: String.raw`With Huygens’ principle (4.4): the front sweeps along the interface at speed $v_1/\sin\theta_1$. In the same time the wavelet from the first contact point spreads only to $v_2t$ in medium 2, so the common tangent through the moving contact point makes $\sin\theta_2=v_2t/d$ with the interface, and $\sin\theta_1=v_1t/d$; dividing, $\sin\theta_1/\sin\theta_2=v_1/v_2=n_2/n_1$. Fermat (5.2) gives it as the path of least time, and the phase-matching view is the boundary condition behind the Fresnel equations (4.7).`,
      caption: String.raw`Set the two indices and the angle $\theta_1$. The blue front arrives along the interface; green wavelets live in the second medium, smaller where light is slower. Their common tangent (solid green) is the refracted front; the readout measures its angle from the construction and shows that $n_1\sin\theta_1$ and $n_2\sin\theta_2$ agree. Make $n_1>n_2$ and raise $\theta_1$: the wavelets become too small to share a tangent and the refracted wave disappears.`,
      deps: ['waves-4.4', 'waves-4.3'],
      refs: ['Hecht ch. 4'],
      tags: ['refraction', 'Snell'],
      credit: 'Ibn Sahl, c. 984; Harriot, c. 1602; Snell, c. 1621; Descartes, 1637',
      verify: true,
      scope: String.raw`Isotropic media with a plane boundary; for birefringent crystals (9.9) the second ray does not obey it. The sine form holds for phase velocities, so with dispersion each colour refracts differently (4.12). Priority is disputed: the dates are those of the earliest known statements and are not exact.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Snell%27s_law' },
      viz(v) { interfaceViz(v, true); },
    },
    // ------------------------------------------------------------------ 4.7
    {
      num: '4.7',
      kind: 'Theorem',
      name: 'Fresnel equations',
      statement: String.raw`For a monochromatic plane wave incident at angle $\theta_1$ from a non-magnetic medium of index $n_1$ on a flat interface with $n_2$ (with $\theta_2$ given by Snell’s law), the reflected and transmitted amplitudes are, for polarization perpendicular (s) and parallel (p) to the plane of incidence,
$$r_s=\frac{n_1\cos\theta_1-n_2\cos\theta_2}{n_1\cos\theta_1+n_2\cos\theta_2},\quad t_s=\frac{2n_1\cos\theta_1}{n_1\cos\theta_1+n_2\cos\theta_2},$$
$$r_p=\frac{n_2\cos\theta_1-n_1\cos\theta_2}{n_2\cos\theta_1+n_1\cos\theta_2},\quad t_p=\frac{2n_1\cos\theta_1}{n_2\cos\theta_1+n_1\cos\theta_2}.$$
The reflectance $R=|r|^2$ and transmittance $T=\dfrac{n_2\cos\theta_2}{n_1\cos\theta_1}|t|^2$ satisfy $R+T=1$ for each polarization. At normal incidence both give $R=\left(\dfrac{n_1-n_2}{n_1+n_2}\right)^2$ (about 4% for air to glass).`,
      idea: String.raw`Maxwell's boundary conditions (em-10.7) require the tangential components of $\mathbf E$ and $\mathbf H$ to be continuous across the interface; with the phases already matched by Snell’s law (4.6), each polarization gives two linear equations for $r$ and $t$, solved by the formulas above. $R+T=1$ is conservation of the normal energy flux (4.2 and em-11.5), and the factor in $T$ accounts for the change of beam width and wave speed. Fresnel obtained the sine and tangent laws in 1823 from his elastic-solid theory; the electromagnetic derivation came later.`,
      caption: String.raw`Left: $R$ (solid) and $T$ (dashed) against angle of incidence for s (blue) and p (purple) polarization. Set $n_1$ and $n_2$ with the sliders, drag the angle, and read off $R+T$ (always 1). Right: the three rays with line weight showing their power for the chosen polarization. Try $n_1>n_2$: at the critical angle $R\to1$ (4.9). The p curve touches zero at Brewster’s angle (4.8).`,
      deps: ['em-10.7', 'em-11.9', 'waves-4.6'],
      refs: ['Hecht ch. 4'],
      tags: ['Fresnel', 'reflectance'],
      credit: 'Fresnel, 1823 (memoir read 7 January 1823; published 1831)',
      verify: true,
      scope: String.raw`Plane wave, flat interface between two lossless, non-magnetic, isotropic media. Metals and absorbing media need a complex index; thin films add multiple reflections (6.5). Sign conventions for $r_p$ vary between textbooks (this page follows Hecht).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Fresnel_equations' },
      viz(v) {
        const n1S = v.slider('$n_1$ (incident side)', 1, 3, 1, { step: 0.01 });
        const n2S = v.slider('$n_2$ (other side)', 1, 3, 1.5, { step: 0.01 });
        const aS = v.slider('angle of incidence $\\theta_1$ (degrees)', 0, 89.5, 45, { step: 0.5 });
        const pol = v.select('polarization drawn in the rays', [{ value: 's', label: 's' }, { value: 'p', label: 'p' }, { value: 'u', label: 'unpolarized' }], 'u');
        const A = v.stage({ x: [0, 90], y: [0, 1.04], axes: 'box', gutter: true, xlabel: 'angle of incidence θ₁ (degrees)', ylabel: 'fraction of power', height: 320, weight: 1.6, minWidth: 320, title: 'reflectance and transmittance' });
        const B = v.stage({ x: [-2, 2], y: [-1.7, 1.7], equal: true, axes: false, height: 320, weight: 1, minWidth: 260, title: 'the three rays' });
        let st = null;
        v.render(() => {
          const n1 = n1S.value, n2 = n2S.value, th = rad(aS.value);
          const F = (a) => fresnel(n1, n2, rad(a));
          A.fn((a) => F(a).Rs, { color: 'accent', width: 2.2, n: 360 });
          A.fn((a) => F(a).Rp, { color: 'purple', width: 2.2, n: 360 });
          A.fn((a) => F(a).Ts, { color: 'accent', width: 1.6, dash: [5, 4], n: 360 });
          A.fn((a) => F(a).Tp, { color: 'purple', width: 1.6, dash: [5, 4], n: 360 });
          if (n1 > n2) A.vline(deg(Math.asin(n2 / n1)), { color: 'green', width: 1, dash: [3, 4] });
          A.vline(aS.value, { color: 'gold', width: 1.5 });
          const f = F(aS.value);
          const mode = pol.value, Rr = mode === 's' ? f.Rs : mode === 'p' ? f.Rp : (f.Rs + f.Rp) / 2, Tt = mode === 's' ? f.Ts : mode === 'p' ? f.Tp : (f.Ts + f.Tp) / 2;
          B.rect(-2, -1.7, 2, 0, { fill: 'blue', fillAlpha: 0.08 + 0.05 * (n2 - 1), stroke: false });
          B.rect(-2, 0, 2, 1.7, { fill: 'blue', fillAlpha: 0.08 + 0.05 * (n1 - 1), stroke: false });
          B.line(-2, 0, 2, 0, { color: 'ink', width: 1.4 });
          B.line(0, -1.5, 0, 1.5, { color: 'faint', width: 1, dash: [3, 4] });
          const si = Math.sin(th), ci = Math.cos(th), L = 1.6;
          B.arrow(-si * L, ci * L, 0, 0, { color: 'accent', width: 4, head: 11 });
          B.line(0, 0, si * L, ci * L, { color: 'red', width: 0.7 + 7 * Rr });
          if (!f.tir) B.line(0, 0, Math.sin(Math.asin(f.sinT)) * L, -Math.cos(Math.asin(f.sinT)) * L, { color: 'green', width: 0.7 + 7 * Tt });
          st = { f, Rr, Tt, n1, n2 };
        });
        v.legend([['accent', '$R_s$ (solid), $T_s$ (dashed)'], ['purple', '$R_p$, $T_p$'], ['red', 'reflected ray'], ['green', 'transmitted ray']]);
        v.readout(() => {
          if (!st) return '';
          const f = st.f, r0 = ((st.n1 - st.n2) / (st.n1 + st.n2)) ** 2;
          return `$R_s=${v.fix(f.Rs, 4)}$, $T_s=${v.fix(f.Ts, 4)}$, sum $=${v.fix(f.Rs + f.Ts, 6)}$ · $R_p=${v.fix(f.Rp, 4)}$, $T_p=${v.fix(f.Tp, 4)}$, sum $=${v.fix(f.Rp + f.Tp, 6)}$\nnormal incidence: $((n_1-n_2)/(n_1+n_2))^2=${v.fix(r0, 4)}$ · amplitudes now $r_s=${v.fix(f.rs[0], 3)}$, $r_p=${v.fix(f.rp[0], 3)}$${f.tir ? ' (complex beyond the critical angle: $|r|=1$)' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.8
    {
      num: '4.8',
      kind: 'Law',
      name: 'Brewster’s angle',
      statement: String.raw`At the angle of incidence $\theta_B$ with
$$\tan\theta_B=\frac{n_2}{n_1}$$
the p-polarized (in-plane) component of light is not reflected at all: $r_p=0$. At this angle the reflected and refracted rays are perpendicular ($\theta_B+\theta_2=90^\circ$), and light reflected from an interface is completely s-polarized. For air to glass ($n=1.5$) $\theta_B\approx56.3^\circ$; for air to water ($n=1.33$), $\approx53.1^\circ$.`,
      idea: String.raw`The numerator of $r_p$ in the Fresnel equations (4.7) vanishes when $n_2\cos\theta_1=n_1\cos\theta_2$; combined with Snell’s law (4.6) this forces $\sin 2\theta_1=\sin2\theta_2$, i.e. $\theta_1+\theta_2=90^\circ$. Physically the p-polarized refracted wave drives oscillating dipoles in the second medium along the direction of the field, which is perpendicular to the refracted ray; a dipole radiates nothing along its own axis, and at $\theta_B$ that axis points exactly along the would-be reflected ray.`,
      caption: String.raw`Left: $R_p$, $R_s$ and the degree of polarization of the reflected light for unpolarized incidence ($P=(R_s-R_p)/(R_s+R_p)$, green). Drag the angle to $\theta_B$ (marked): $R_p$ touches zero. Right: the rays, with the double arrow showing the direction in which the p-polarized dipoles in medium 2 oscillate, perpendicular to the refracted ray. When that arrow lines up with the (dotted) reflected direction nothing is radiated there. Presets give air–glass, air–water, and the internal angle glass–air.`,
      deps: ['waves-4.7'],
      refs: ['Hecht ch. 4'],
      tags: ['Brewster', 'polarization'],
      credit: 'Brewster, 1815',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Brewster%27s_angle' },
      scope: String.raw`Non-magnetic, lossless media with real indices. For absorbing media (metals) $r_p$ reaches only a minimum (the “principal angle”). Dispersion makes $\theta_B$ slightly colour-dependent.`,
      viz(v) {
        const n1S = v.slider('$n_1$', 1, 2.5, 1, { step: 0.01 });
        const n2S = v.slider('$n_2$', 1, 2.5, 1.5, { step: 0.01 });
        const aS = v.slider('angle of incidence $\\theta_1$ (degrees)', 0, 89.5, 40, { step: 0.1 });
        v.button('air → glass', () => { n1S.set(1); n2S.set(1.5); });
        v.button('air → water', () => { n1S.set(1); n2S.set(1.333); });
        v.button('glass → air', () => { n1S.set(1.5); n2S.set(1); });
        v.button('go to Brewster', () => aS.set(Math.round(deg(Math.atan(n2S.value / n1S.value)) * 10) / 10));
        const A = v.stage({ x: [0, 90], y: [0, 1.04], axes: 'box', gutter: true, xlabel: 'angle of incidence θ₁ (degrees)', height: 320, weight: 1.6, minWidth: 320, title: 'reflectance of the two polarizations' });
        const B = v.stage({ x: [-2.2, 2.2], y: [-1.9, 1.9], equal: true, axes: false, height: 320, weight: 1, minWidth: 260, title: 'the rays and the dipoles' });
        let st = null;
        v.render(() => {
          const n1 = n1S.value, n2 = n2S.value, th = rad(aS.value), thB = Math.atan(n2 / n1);
          const F = (a) => fresnel(n1, n2, rad(a));
          A.fn((a) => F(a).Rs, { color: 'accent', width: 2.2, n: 360 });
          A.fn((a) => F(a).Rp, { color: 'purple', width: 2.4, n: 360 });
          A.fn((a) => { const f = F(a); return f.Rs + f.Rp > 1e-9 ? (f.Rs - f.Rp) / (f.Rs + f.Rp) : 0; }, { color: 'green', width: 1.8, dash: [5, 4], n: 360 });
          A.vline(deg(thB), { color: 'green', width: 1.2 });
          A.vline(aS.value, { color: 'gold', width: 1.5 });
          if (n1 > n2) A.vline(deg(Math.asin(n2 / n1)), { color: 'red', width: 1, dash: [3, 4] });
          const f = F(aS.value);
          B.rect(-2.2, -1.9, 2.2, 0, { fill: 'blue', fillAlpha: 0.08 + 0.05 * (n2 - 1), stroke: false });
          B.line(-2.2, 0, 2.2, 0, { color: 'ink', width: 1.4 });
          B.line(0, -1.7, 0, 1.7, { color: 'faint', width: 1, dash: [3, 4] });
          const si = Math.sin(th), ci = Math.cos(th), L = 1.7;
          B.arrow(-si * L, ci * L, 0, 0, { color: 'accent', width: 3, head: 10 });
          B.line(0, 0, si * L, ci * L, { color: 'red', width: 0.7 + 7 * f.Rp, alpha: 0.9 });
          let angRT = null;
          if (!f.tir) {
            const t2 = Math.asin(f.sinT);
            B.line(0, 0, Math.sin(t2) * L, -Math.cos(t2) * L, { color: 'green', width: 2.5 });
            // dipole direction: perpendicular to the refracted ray, in the plane of incidence
            const dx = Math.cos(t2), dy = Math.sin(t2), cx = Math.sin(t2) * L * 0.6, cy = -Math.cos(t2) * L * 0.6;
            B.arrow(cx - 0.45 * dx, cy - 0.45 * dy, cx + 0.45 * dx, cy + 0.45 * dy, { color: 'purple', width: 3, head: 9, both: true });
            B.line(0, 0, si * L * 1.1, ci * L * 1.1, { color: 'purple', width: 1, dash: [2, 4] });
            angRT = 180 - aS.value - deg(t2);
          }
          st = { f, thB, angRT, n1, n2 };
        });
        v.legend([['accent', '$R_s$'], ['purple', '$R_p$'], ['green', 'degree of polarization of reflected light', { dash: true }], ['red', 'reflected ray (width ∝ $R_p$)']]);
        v.readout(() => st ? `$\\theta_B=\\arctan(n_2/n_1)=${v.fix(deg(st.thB), 2)}^\\circ$ · at the chosen angle $R_p=${v.sci(st.f.Rp, 3)}$, $R_s=${v.fix(st.f.Rs, 4)}$ · angle between reflected and refracted rays: ${st.angRT == null ? 'none (total reflection)' : '$' + v.fix(st.angRT, 2) + '^\\circ$'}` : '');
      },
    },
  ],
};
