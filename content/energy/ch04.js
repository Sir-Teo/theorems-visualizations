// Energy Systems — Chapter 4: Solar energy (items 4.1–4.4; 4.5–4.8 in ch04-b.js, 4.9–4.11 in ch04-c.js, 4.12 in ch04-papers.js)
//
// SOURCES AND PROVENANCE (checked October 2026 unless marked "from memory")
//   4.1 Sun = blackbody at the IAU 2015 nominal effective temperature 5772 K (Resolution B3; exact conversion constants: T_eff 5772 K, R 6.957e8 m,
//     S = 1361 W/m2). The curve drawn is the blackbody model, NOT a measured spectrum: the real extraterrestrial spectrum (e.g. ASTM E490) is weaker than a
//     blackbody in the ultraviolet and carries absorption lines; I could not download a reference table, so none is drawn. Measured value: Kopp & Lean (2011),
//     1360.8 +/- 0.5 W/m2 (SORCE/TIM, 2008 minimum). The "through air" curve is a SCHEMATIC model: Rayleigh optical depth 0.008735 lambda^-4.08 per air mass
//     (lambda in um; coefficient from memory of the Bird–Riordan / Hegner form), an ozone ultraviolet edge and aerosol Angstrom term with ILLUSTRATIVE strengths,
//     and Gaussian dips at the real positions of the O2 (760 nm), H2O (about 940, 1130, 1380, 1870 nm) and CO2 (about 2000 nm) bands with illustrative depths.
//   4.2 Declination delta = 23.44 deg sin(360 (n - 81)/365) (standard approximation, good to about half a degree), no equation of time. Clear-sky beam model
//     I = S (1 + 0.033 cos(360 n/365)) 0.7^(AM^0.678) (Meinel & Meinel, from memory — the form with a 0.7 base is equivalent to exp(-0.357 AM^0.678) in PyAstronomy's
//     documentation of Meinel's formula); air mass from Kasten & Young (1989), from memory. Direct beam only: diffuse light is omitted.
//   4.3 Single-diode cell with ILLUSTRATIVE silicon-like numbers (Jsc 40 mA/cm2 at 1 sun, J0 about 1e-12 A/cm2); nothing here is a measurement of a device.
//   4.4 Green's empirical ideal fill factor FF0 = (v - ln(v + 0.72))/(v + 1), v = Voc/(n kT/q): M. A. Green, Solar Cells 7 (1982) 337–340 (title confirmed;
//     the formula is quoted from memory and is checked below against the numerical diode model).

import { clamp, S0, T_SUN, FW, KB, SIGMA, cell, ivCurve, ffGreen } from './ch04.shared.js';

// ───────────────────────────────────────────── 4.1 helpers
const H_SI = 6.62607015e-34, C_SI = 2.99792458e8, K_SI = 1.380649e-23;
/** Blackbody spectral irradiance at 1 au, W m^-2 nm^-1, for a Sun of effective temperature T. */
function specSun(nm, T) {
  const l = nm * 1e-9, x = (H_SI * C_SI) / (l * K_SI * T);
  return (FW * 2 * Math.PI * H_SI * C_SI * C_SI) / (l ** 5 * Math.expm1(x)) * 1e-9;
}
const BANDS = [[690, 2.5, 0.25, 'O₂'], [720, 7, 0.35, 'H₂O'], [760, 3, 1.6, 'O₂'], [820, 8, 0.3, 'H₂O'], [940, 22, 1.6, 'H₂O'], [1130, 28, 1.7, 'H₂O'],
  [1380, 45, 5, 'H₂O'], [1870, 70, 6, 'H₂O'], [2010, 14, 1.2, 'CO₂'], [2700, 90, 8, 'H₂O']];
/** Schematic atmospheric transmission of the direct beam at air mass am. */
function airT(nm, am) {
  const um = nm / 1000;
  let tau = 0.008735 * um ** -4.08 + 0.1 * (um / 0.5) ** -1.3 + 25 * Math.exp(-(nm - 250) / 20);
  for (const [c, s, d] of BANDS) tau += d * Math.exp(-0.5 * ((nm - c) / s) ** 2);
  return Math.exp(-tau * am);
}
const MONTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31], MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const dateLabel = (n) => { let d = Math.round(n), m = 0; while (m < 11 && d > MONTHS[m]) { d -= MONTHS[m]; m++; } return `${d} ${MN[m]}`; };

// ───────────────────────────────────────────── 4.2 helpers
const RAD = Math.PI / 180;
const decl = (n) => 23.44 * Math.sin((2 * Math.PI * (n - 81)) / 365); // degrees
/** Sun position: altitude and azimuth (deg from north, clockwise) at latitude phi, day n, hour h (solar time). */
function sunPos(phi, n, h) {
  const d = decl(n) * RAD, p = phi * RAD, w = 15 * (h - 12) * RAD;
  const sa = Math.sin(p) * Math.sin(d) + Math.cos(p) * Math.cos(d) * Math.cos(w), alt = Math.asin(clamp(sa, -1, 1));
  const ca = Math.cos(alt) < 1e-9 ? 1 : (Math.sin(d) * Math.cos(p) - Math.cos(d) * Math.sin(p) * Math.cos(w)) / Math.cos(alt);
  let az = Math.acos(clamp(ca, -1, 1)) / RAD; if (w > 0) az = 360 - az;
  return { alt: alt / RAD, az, sa };
}
const airMass = (altDeg) => 1 / (Math.sin(altDeg * RAD) + 0.50572 * (altDeg + 6.07995) ** -1.6364);
/** cos of the angle between sunlight and the normal of a panel tilted by beta (deg) and facing the equator. */
function cosInc(phi, n, h, beta) {
  const s = phi < 0 ? -1 : 1, p = Math.abs(phi) * RAD, d = s * decl(n) * RAD, w = 15 * (h - 12) * RAD, b = beta * RAD;
  return Math.sin(d) * Math.sin(p - b) + Math.cos(d) * Math.cos(p - b) * Math.cos(w);
}
const irr = (n, altDeg, atm) => S0 * (1 + 0.033 * Math.cos((2 * Math.PI * n) / 365)) * (atm ? 0.7 ** (airMass(altDeg) ** 0.678) : 1);
/** Daily beam energy on the panel, kWh/m2. */
function dayEnergy(phi, n, beta, atm) {
  let e = 0; const dh = 0.1;
  for (let h = 0; h < 24; h += dh) {
    const sp = sunPos(phi, n, h + dh / 2); if (sp.alt <= 0) continue;
    const c = cosInc(phi, n, h + dh / 2, beta); if (c > 0) e += irr(n, sp.alt, atm) * c * dh;
  }
  return e / 1000;
}

export default {
  collection: 'energy',
  chapter: 4,
  title: 'Solar energy',
  summary: String.raw`The Sun delivers about a kilowatt per square metre at noon, with a spectrum close to that of a 5800 K blackbody, but the average a panel sees depends on latitude, tilt and weather. Photovoltaic cells convert sunlight with a semiconductor junction; a single band gap can capture at most about a third of the energy — the Shockley–Queisser limit — and practical issues such as temperature, shading and maximum-power tracking set real performance. Concentration and multiple junctions push beyond.`,
  items: [
    // ───────────────────────────────────────────────────────── 4.1
    {
      num: '4.1',
      kind: 'Law',
      name: 'The solar spectrum and the solar constant',
      statement: String.raw`The Sun radiates approximately as a blackbody of effective temperature $T_\odot \approx 5772\ \text{K}$ (the nominal value fixed by the IAU in 2015). At the mean Earth–Sun distance $d$ the radiant power per unit area facing the Sun, the **solar constant** or total solar irradiance, is the Stefan–Boltzmann flux diluted by the inverse-square law,
$$S=\sigma T_\odot^{4}\left(\frac{R_\odot}{d}\right)^{2}\approx 1361\ \text{W/m}^2,$$
and its spectral distribution is Planck's, $S_\lambda=(R_\odot/d)^2\,2\pi hc^2\lambda^{-5}/(e^{hc/\lambda kT_\odot}-1)$, peaking near $\lambda_{\max}=b/T_\odot\approx 500$ nm. About half the power lies in the visible and near infrared below 1 µm, a few per cent in the ultraviolet; the atmosphere removes part of it by scattering and by absorption in bands.

Scope: the blackbody is a model of the Sun's visible-to-infrared output; the real spectrum is weaker in the ultraviolet and has absorption lines. The solar constant varies by about 0.1 % over the 11-year cycle.`,
      idea: String.raw`A hot surface radiates according to Planck's law (qm-1.1); integrating over wavelength gives the Stefan–Boltzmann law, and the flux thins as the square of the distance because the same power spreads over a sphere of radius $d$. Plugging in the Sun's effective temperature and angular size gives 1361 W/m², in line with space measurements (Kopp and Lean 2011 found $1360.8\pm0.5$ W/m²). Wien's displacement law places the peak at 500 nm — the middle of the visible band — and all the later results in this chapter start from this one spectrum: it fixes what photons a cell can use (energy-4.5) and how hot a concentrator can get (energy-4.10).`,
      caption: String.raw`The coloured curve is the Sun's spectral irradiance; the grey strip marks the visible band. Change the **solar temperature** and watch the peak slide (Wien) while the total area, shown in the readout, scales as $T^4$. Switch to **through air** and raise the air mass: the ultraviolet disappears, scattering bites into the blue, and notches appear at the oxygen, water and CO$_2$ bands. The right panel shows how much of the power lies below each wavelength. The air curve is a **schematic model** (band positions are real, depths illustrative).`,
      deps: ['qm-1.1'],
      refs: ['Tester ch. 13', 'MacKay ch. 6'],
      tags: ['solar', 'spectrum', 'blackbody'],
      scope: String.raw`Holds for the spectrum outside the atmosphere to the accuracy of a blackbody model; ground-level spectra depend on air mass, water vapour, ozone and aerosols.`,
      credit: 'Kopp & Lean, 2011 (modern measurement of the solar constant)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Solar_constant' },
      verify: true,
      viz(v) {
        const Tsl = v.slider('solar temperature $T$ (K)', 4000, 7500, 5772, { step: 1 });
        const view = v.select('view', [{ value: 'space', label: 'above the atmosphere' }, { value: 'air', label: 'through air (schematic)' }], 'space');
        const AM = v.slider('air mass', 1, 5, 1.5, { step: 0.1 });
        const S = v.stage({ x: [200, 2500], y: [0, 2.4], axes: 'box', gutter: true, height: 340, weight: 1.5, minWidth: 300, xlabel: 'wavelength (nm)', ylabel: 'spectral irradiance (W m⁻² nm⁻¹)', title: 'sunlight at 1 au' });
        const C = v.stage({ x: [100, 4000], y: [0, 1], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 260, xlabel: 'wavelength (nm)', ylabel: 'fraction of power below λ', title: 'where the power is', yticks: [[0, '0'], [0.25, '25%'], [0.5, '50%'], [0.75, '75%'], [1, '100%']] });
        let cumKey = null, cum = null, st = null;
        v.render(() => {
          const T = Tsl.value, air = view.value === 'air';
          AM.el.hidden = !air;
          const f = (nm) => specSun(nm, T), g = (nm) => f(nm) * airT(nm, AM.value);
          const peak = f((2.897771955e6 / T)), top = peak * 1.12;
          S.setView([200, 2500], [0, top]);
          S.vband(400, 700, { color: 'muted', alpha: 0.12 });
          S.fn(f, { domain: [200, 2500], color: 'gold', fill: true, fillAlpha: air ? 0.12 : 0.28, width: 2.2, n: 500 });
          S.fn((nm) => specSun(nm, T_SUN), { domain: [200, 2500], color: 'muted', width: 1.2, dash: [5, 4], n: 300 });
          if (air) {
            S.fn(g, { domain: [200, 2500], color: 'accent', fill: true, fillAlpha: 0.35, width: 2, n: 1200 });
            for (const [c, , , lab] of [[760, 0, 0, 'O₂'], [940, 0, 0, 'H₂O'], [1130, 0, 0, 'H₂O'], [1380, 0, 0, 'H₂O'], [1870, 0, 0, 'H₂O'], [2010, 0, 0, 'CO₂']]) {
              if (c === 2010) S.text(lab, 2100, top * 0.2, { size: 11, color: 'muted', align: 'left' }); else S.text(lab, c, top * 0.93 - (c > 1000 ? 0.0 : 0), { size: 11, color: 'muted', align: 'center', dy: c === 760 ? 0 : 0 });
            }
            S.text('O₃ edge', 205, top * 0.62, { size: 11, color: 'muted', align: 'left', plate: true });
          }
          S.vline(2897771.955 / T, { color: 'orange', width: 1.2, dash: [3, 3] });
          S.text(`Wien peak ${v.fix(2897771.955 / T, 0)} nm`, 2897771.955 / T, top * 0.2, { dx: 6, align: 'left', size: 11.5, color: 'orange', weight: 600 });
          S.text('visible', 550, top * 0.04, { align: 'center', size: 11, color: 'muted' });
          // cumulative fraction (cached on T)
          if (cumKey !== T) {
            cumKey = T; const n = 8000, dl = 4, arr = []; let s = 0; // 50 .. 32050 nm
            for (let i = 0; i <= n; i++) { const nm = 50 + i * dl; if (i) s += 0.5 * (f(nm) + f(nm - dl)) * dl; arr.push(s); }
            const tot = SIGMA * T ** 4 * FW; cum = (nm) => Math.min(1, arr[Math.max(0, Math.min(n, Math.round((nm - 50) / dl)))] / tot);
          }
          C.fn(cum, { domain: [100, 4000], color: 'gold', width: 2.4, n: 400 });
          C.vband(400, 700, { color: 'muted', alpha: 0.12 });
          const uv = cum(400), vis = cum(700) - cum(400);
          C.dot(400, uv, { r: 4, color: 'purple' }); C.dot(700, cum(700), { r: 4, color: 'green' });
          C.text(`${v.fix(100 * uv, 0)}% UV`, 400, uv, { dx: -8, dy: -10, align: 'right', size: 11.5, color: 'purple', weight: 600 });
          C.text(`${v.fix(100 * cum(700), 0)}% below 700 nm`, 700, cum(700), { dx: 10, dy: 12, align: 'left', size: 11.5, color: 'green', weight: 600 });
          const total = SIGMA * T ** 4 * FW;
          let ground = null;
          if (air) { let s2 = 0; const dl = 5; for (let nm = 200; nm < 2500; nm += dl) s2 += g(nm + dl / 2) * dl; let s1 = 0; for (let nm = 200; nm < 2500; nm += dl) s1 += f(nm + dl / 2) * dl; ground = { s2, s1 }; }
          st = { T, total, uv, vis, ground, air };
        });
        v.legend([['gold', 'blackbody Sun at the chosen $T$'], ['muted', '5772 K (nominal)', { dash: true }], ['accent', 'after the atmosphere (schematic, direct beam)', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { T, total, uv, vis, ground, air } = st;
          return `$T=${v.fix(T, 0)}$ K: $S=\\sigma T^4(R_\\odot/d)^2=$ **${v.fix(total, 0)} W/m²** (Wien peak ${v.fix(2897771.955 / T, 0)} nm) · below 400 nm ${v.fix(100 * uv, 1)}%, visible ${v.fix(100 * vis, 1)}%, beyond 700 nm ${v.fix(100 * (1 - uv - vis), 1)}%` +
            (T === 5772 ? ` · measured: $1360.8\\pm0.5$ W/m² (Kopp & Lean 2011)` : '') +
            (air && ground ? `\nBetween 200 and 2500 nm the schematic air path (air mass ${v.fix(AM.value, 1)}) passes ${v.fix(100 * ground.s2 / ground.s1, 0)}% of the beam power; a blackbody curve has no spectral lines, so treat the notches as illustrative.` : '');
        });
      },
    },

    // ───────────────────────────────────────────────────────── 4.2
    {
      num: '4.2',
      kind: 'Model',
      name: 'Solar geometry: insolation, latitude and tilt',
      statement: String.raw`At latitude $\varphi$ on day $n$ the Sun's declination is $\delta\approx 23.44^\circ\sin\!\big(360^\circ\tfrac{n-81}{365}\big)$ and its altitude $\alpha$ at hour angle $\omega=15^\circ(t-12\,\text{h})$ satisfies $\sin\alpha=\sin\varphi\sin\delta+\cos\varphi\cos\delta\cos\omega$. A flat panel tilted by $\beta$ toward the equator receives the beam irradiance $I(\alpha)$ times the cosine of the angle of incidence,
$$\cos\theta=\sin\delta\,\sin(\varphi-\beta)+\cos\delta\,\cos(\varphi-\beta)\cos\omega\quad(\varphi\ge0),$$
so the daily energy is $E(\beta)=\int I\,\max(\cos\theta,0)\,dt$. The noon Sun is normal to the panel when $\beta=\varphi-\delta$; summed over the whole year, the best fixed tilt comes out close to (a little below) the latitude.

Scope: direct beam only, clear sky, equator-facing fixed panel, solar time (no equation of time); real sites lose to clouds and gain some diffuse light.`,
      idea: String.raw`Sunlight is a parallel beam, so a surface collects its irradiance times the cosine of the angle between the beam and the surface normal (the same geometry as a shadow). Tilting the panel by $\beta$ is the same as moving it to latitude $\varphi-\beta$ on a Sun of the same declination — which is why the noon Sun is overhead for a panel tilted $\varphi-\delta$. The air mass $1/\sin\alpha$ of the beam's path through the atmosphere (energy-4.1) dims low Sun, so hours near sunrise and sunset count for less than the cosine alone would say. Integrating over the day and the year turns a small cosine into the familiar rule “tilt about the latitude”.`,
      caption: String.raw`**Left**: the sky as seen from the site, zenith at the centre; the three thin curves are the Sun's paths at the solstices and equinox, the thick one is the chosen day, and the gold dot is the Sun at the chosen **hour**. **Right**: daily energy on the panel against its tilt for that day (blue) and averaged over the year (green); the dot is your tilt, the rings the best tilts. Drag latitude and day, then compare the tilt that makes the noon Sun normal ($\varphi-\delta$) with the tilt that maximises the whole day. Switch off the atmosphere to see the pure geometry.`,
      deps: ['energy-4.1'],
      refs: ['Tester ch. 13', 'MacKay ch. 6'],
      tags: ['solar', 'geometry', 'insolation'],
      scope: String.raw`Beam irradiance on an equator-facing fixed plane under a clear-sky air-mass model; no diffuse sky light, clouds, shading or tracking.`,
      verify: true,
      viz(v) {
        const lat = v.slider('latitude $\\varphi$ (°)', -60, 70, 40, { step: 1 });
        const day = v.slider('day of year', 1, 365, 172, { step: 1, int: true, fmt: (x) => dateLabel(x) });
        const tilt = v.slider('panel tilt $\\beta$ (°)', 0, 90, 40, { step: 1 });
        const hour = v.slider('hour (solar time)', 0, 24, 12, { step: 0.1 });
        const atm = v.toggle('clear-sky atmosphere (off: no air)', true);
        const sky = v.stage({ x: [-108, 108], y: [-108, 108], equal: true, axes: false, height: 350, weight: 1, minWidth: 280, title: 'sun paths (looking down; north up)' });
        const E = v.stage({ x: [0, 90], y: [0, 12], axes: 'box', gutter: true, height: 350, weight: 1.15, minWidth: 280, xlabel: 'panel tilt β (°)', ylabel: 'kWh m⁻² per day', title: 'energy on the panel' });
        let annKey = '', ann = null, st = null;
        const path = (phi, n) => { const pts = []; for (let h = 0; h <= 24.001; h += 0.1) { const p = sunPos(phi, n, h); pts.push(p.alt > 0 ? [(90 - p.alt) * Math.sin(p.az * RAD), (90 - p.alt) * Math.cos(p.az * RAD)] : null); } return pts; };
        v.render(() => {
          const phi = lat.value, n = day.value, b = tilt.value, A = atm.value;
          for (const r of [30, 60, 90]) sky.circle(0, 0, r, { color: 'grid', width: r === 90 ? 1.6 : 1 });
          for (let a = 0; a < 360; a += 45) sky.line(0, 0, 90 * Math.sin(a * RAD), 90 * Math.cos(a * RAD), { color: 'grid', width: 0.8 });
          for (const [t, x, y] of [['N', 0, 99], ['E', 99, 0], ['S', 0, -99], ['W', -99, 0]]) sky.text(t, x, y, { size: 12, weight: 700, color: 'muted', align: 'center', baseline: 'middle' });
          sky.text('alt 60°', 0, -30, { size: 10, color: 'muted', dy: 9 }); sky.text('alt 30°', 0, -60, { size: 10, color: 'muted', dy: 9 }); sky.text('horizon', 0, -90, { size: 10, color: 'muted', dy: 9 });
          for (const d of [172, 80, 355]) sky.path(path(phi, d), { color: 'muted', width: 1, alpha: 0.6 });
          sky.path(path(phi, n), { color: 'orange', width: 3 });
          const sp = sunPos(phi, n, hour.value);
          if (sp.alt > 0) sky.dot((90 - sp.alt) * Math.sin(sp.az * RAD), (90 - sp.alt) * Math.cos(sp.az * RAD), { r: 8, color: 'gold' });
          // energy vs tilt
          const key = `${phi}|${A}`;
          if (key !== annKey) {
            annKey = key; ann = [];
            for (let bb = 0; bb <= 90; bb += 3) { let s = 0, c = 0; for (let d = 3; d <= 365; d += 7) { s += dayEnergy(phi, d, bb, A); c++; } ann.push([bb, s / c]); }
          }
          const cur = []; for (let bb = 0; bb <= 90; bb += 3) cur.push([bb, dayEnergy(phi, n, bb, A)]);
          const mx = Math.max(...cur.map((p) => p[1]), ...ann.map((p) => p[1]));
          E.setView([0, 90], [0, Math.max(2, Math.ceil(mx * 1.12))]);
          E.vline(Math.min(90, Math.abs(phi)), { color: 'faint', width: 1.2, dash: [4, 4] });
          E.text(`φ = ${v.fix(Math.abs(phi), 0)}°`, Math.min(90, Math.abs(phi)), 0, { dx: 5, dy: -8, align: 'left', size: 11, color: 'muted' });
          E.path(cur, { color: 'accent', width: 2.4 });
          E.path(ann, { color: 'green', width: 2.4 });
          const bc = cur.reduce((a, p) => (p[1] > a[1] ? p : a)), ba = ann.reduce((a, p) => (p[1] > a[1] ? p : a));
          E.dot(bc[0], bc[1], { r: 6, color: 'accent', hollow: true }); E.dot(ba[0], ba[1], { r: 6, color: 'green', hollow: true });
          const eNow = dayEnergy(phi, n, b, A);
          E.dot(b, eNow, { r: 7, color: 'gold' });
          const c = cosInc(phi, n, hour.value, b);
          st = { phi, n, b, eNow, bc, ba, annNow: ann[Math.round(b / 3)] ? ann[Math.min(ann.length - 1, Math.round(b / 3))][1] : 0, eHor: dayEnergy(phi, n, 0, A), c, alt: sp.alt, d: decl(n) };
        });
        v.legend([['accent', 'chosen day'], ['green', 'yearly average per day'], ['orange', 'sun path of chosen day'], ['muted', 'solstices and equinox']]);
        v.readout(() => {
          if (!st) return '';
          const { phi, n, b, eNow, bc, ba, annNow, eHor, c, alt, d } = st;
          return `${dateLabel(n)}: declination $\\delta=${v.fix(d, 1)}^\\circ$ · noon altitude ${v.fix(90 - Math.abs(phi - d), 1)}° · tilt ${v.fix(b, 0)}°: **${v.fix(eNow, 2)} kWh/m²** that day (flat: ${v.fix(eHor, 2)}) · best tilt for the day ${v.fix(bc[0], 0)}° (noon Sun normal at $\\varphi-\\delta=${v.fix(Math.abs(phi) - (phi < 0 ? -d : d), 0)}^\\circ$), best fixed tilt for the year ${v.fix(ba[0], 0)}° (latitude ${v.fix(Math.abs(phi), 0)}°), yearly mean at your tilt ${v.fix(annNow, 2)}\n` +
            (alt > 0 ? `At this hour the Sun is ${v.fix(alt, 0)}° above the horizon and the beam meets the panel at $\\cos\\theta=${v.fix(Math.max(c, 0), 2)}$.` : 'The Sun is below the horizon at this hour.');
        });
      },
    },

    // ───────────────────────────────────────────────────────── 4.3
    {
      num: '4.3',
      kind: 'Model',
      name: 'The photovoltaic cell: an illuminated diode',
      statement: String.raw`A solar cell is a p–n junction (cm-4.7) whose current is shifted by the photogenerated current $J_{ph}$, proportional to the light intensity. In the single-diode model
$$J(V)=J_{ph}-J_0\Big(e^{\,qV/nkT}-1\Big),$$
(with series and shunt resistances adding $V\to V+JR_s$ and a leak $-(V+JR_s)/R_{sh}$). The **short-circuit current** is $J_{sc}\approx J_{ph}$, and the **open-circuit voltage** is
$$V_{oc}=\frac{nkT}{q}\ln\!\Big(\frac{J_{ph}}{J_0}+1\Big),$$
which grows only logarithmically with illumination (about $60n$ mV per decade at room temperature) while $J_{sc}$ grows linearly.

Scope: one junction with a single exponential dark characteristic; for $V>0$ and $J>0$ the cell delivers power. Real devices add recombination in the depletion region ($n\to2$), resistive losses and non-ideal collection.`,
      idea: String.raw`In the dark the cell is a diode (cm-4.8, circ-4.1): $J_{dark}=-J_0(e^{qV/nkT}-1)$. Light creates electron–hole pairs that the junction field sweeps apart, adding a voltage-independent current $J_{ph}$ in the reverse direction, so the illuminated curve is the dark curve lifted by $J_{ph}$ — the superposition principle for a linear photocurrent. The curve now dips into the fourth quadrant, where $V>0$ and current flows out, and there the diode delivers power. Setting $J=0$ gives $V_{oc}$: the voltage at which the diode's forward current exactly cancels the light current. That the voltage depends only on the logarithm of the light is why cells keep working in dim light, and why $J_0$ (recombination) controls the voltage.`,
      caption: String.raw`The solid curve is the illuminated cell, drawn with current out of the cell positive; the dashed curve is the same diode in the dark. Slide the **light intensity**: the whole curve rises by $J_{ph}$ and $V_{oc}$ creeps up. Change $J_0$ (a worse junction recombines more) or the ideality factor $n$ and see the voltage fall. The right panel shows $V_{oc}$ against light on a log axis: a straight line of slope $nkT\ln10/q$ per decade. “Real” turns on a series and a shunt resistance. **All parameters are illustrative.**`,
      deps: ['circ-4.1', 'cm-4.7'],
      refs: ['Tester ch. 13'],
      tags: ['photovoltaics', 'diode', 'junction'],
      scope: String.raw`Single-diode model, one sun $\approx 100$ mW/cm$^2$; parameters here are silicon-like but illustrative.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Theory_of_solar_cells' },
      viz(v) {
        const suns = v.slider('light intensity (suns)', 0.01, 10, 1, { log: true, sig: 2 });
        const lj0 = v.slider('$\\log_{10}J_0$ (A/cm²)', -14, -8, -12, { step: 0.1 });
        const nn = v.slider('ideality factor $n$', 1, 2, 1, { step: 0.05 });
        const TC = v.slider('cell temperature (°C)', 0, 80, 25, { step: 1 });
        const real = v.select('parasitics', [{ value: '0', label: 'ideal' }, { value: '1', label: 'real ($R_s$, $R_{sh}$)' }], '0');
        const S = v.stage({ x: [-0.15, 0.85], y: [-14, 50], axes: 'box', gutter: true, height: 340, weight: 1.4, minWidth: 300, xlabel: 'voltage V (V)', ylabel: 'current density out of the cell (mA/cm²)', title: 'current–voltage curve' });
        const R = v.stage({ x: [0.01, 10], xlog: true, y: [0.3, 0.9], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 260, xlabel: 'light intensity (suns)', ylabel: 'open-circuit voltage (V)', title: 'open-circuit voltage against log(light)' });
        let st = null;
        const mk = (s) => cell({ suns: s, T: TC.value + 273.15, j0ref: 10 ** lj0.value, n: nn.value, rs: real.value === '1' ? 1.2 : 0, rsh: real.value === '1' ? 800 : Infinity });
        v.render(() => {
          const c = mk(suns.value), dark = mk(0);
          S.hline(0, { color: 'ink', width: 1 }); S.vline(0, { color: 'ink', width: 1 });
          S.path(ivCurve(dark, -0.15, 0.85, 120).map(([V, J]) => [V, J]), { color: 'muted', width: 2, dash: [6, 4] });
          const cv = ivCurve(c, -0.15, 0.85, 160);
          S.path(cv, { color: 'accent', width: 3 });
          const voc = c.voc(), jsc = c.jsc();
          S.arrow(0.25, dark.J(0.25), 0.25, c.J(0.25), { color: 'orange', width: 1.8 });
          S.text('shift by $J_{ph}$', 0.25, 0.5 * (c.J(0.25) + dark.J(0.25)), { dx: 8, align: 'left', size: 11.5, color: 'orange', plate: true });
          S.dot(0, jsc, { r: 6, color: 'green', label: '$J_{sc}$', labelPos: 'ne' });
          S.dot(voc, 0, { r: 6, color: 'red', label: '$V_{oc}$', labelPos: 'ne' });
          // Voc vs suns
          const vocAt = (s) => mk(s).voc();
          const lo = vocAt(0.01), hi = vocAt(10);
          R.setView([0.01, 10], [Math.max(0, lo - 0.05), hi + 0.06]);
          R.fn((x) => vocAt(x), { domain: [0.01, 10], color: 'red', width: 2.6, n: 40 });
          R.dot(suns.value, voc, { r: 7, color: 'gold' });
          const a = nn.value * KB * (TC.value + 273.15);
          st = { c, voc, jsc, slope: a * Math.LN10, pm: c.pmax() };
        });
        v.legend([['accent', 'illuminated'], ['muted', 'dark', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { c, voc, jsc, slope, pm } = st;
          const formula = (c.a * Math.log(c.jph / c.j0 + 1));
          return `$J_{sc}=${v.fix(jsc, 1)}$ mA/cm² · $V_{oc}=${v.fix(voc, 3)}$ V (formula $\\tfrac{nkT}{q}\\ln(J_{ph}/J_0+1)=${v.fix(formula, 3)}$ V${c.rs ? ', which ignores the leaks' : ''}) · slope ${v.fix(1000 * slope, 0)} mV per decade of light · maximum power ${v.fix(pm.P, 1)} mW/cm² (efficiency ${v.fix((100 * pm.P) / (100 * suns.value), 1)}% of ${v.fix(100 * suns.value, 0)} mW/cm²)`;
        });
      },
    },

    // ───────────────────────────────────────────────────────── 4.4
    {
      num: '4.4',
      kind: 'Definition',
      name: 'Maximum power point and fill factor',
      statement: String.raw`A cell connected to a load operates at a point $(V,J)$ on its illuminated characteristic and delivers power density $P=VJ$. The **maximum power point** $(V_{mp},J_{mp})$ maximises $P$, i.e. $d(VJ)/dV=0$, equivalently $dJ/dV=-J/V$ (the slope of the curve equals minus that of the line from the origin). The **fill factor** is the dimensionless squareness of the curve,
$$FF=\frac{V_{mp}J_{mp}}{V_{oc}J_{sc}},\qquad \eta=\frac{V_{oc}J_{sc}FF}{P_{in}}.$$
For an ideal diode $FF$ depends only on $v_{oc}=qV_{oc}/nkT$ and rises toward 1 as $v_{oc}$ grows; series resistance lowers it.

Scope: single-diode cell under constant illumination; $0<FF<1$, and for good silicon cells $FF\approx0.8$.`,
      idea: String.raw`Along the curve the product $VJ$ starts at zero (short circuit), ends at zero (open circuit) and is positive in between, so it has a maximum; where it occurs the load line through the origin is tangent to a level set of $P$. The same extremum problem appears in circ-3.5 for a linear source, where matching the load to the source resistance is optimal; here the source is nonlinear, so the matching load is $R_{mp}=V_{mp}/J_{mp}$ at one particular intensity — and moves when the light changes (energy-4.7). Because the exponential is so steep, the knee of the curve is sharp and the fill factor sits near 0.8 even though $V_{mp}$ is only about 85 % of $V_{oc}$.`,
      caption: String.raw`Drag the **gold operating point** along the I–V curve (left): the orange rectangle $V\times J$ is the power delivered, the dashed one is $V_{oc}\times J_{sc}$, and the fill factor is the ratio of the green maximum rectangle to the dashed one. The right panel shows the same power as a curve in $V$. Switch on **series resistance** and the knee rounds off, the fill factor falls and the load that extracts the most power changes. The line from the origin through the point is the load resistance $V/J$.`,
      deps: ['energy-4.3', 'circ-3.5'],
      refs: ['Tester ch. 13'],
      tags: ['photovoltaics', 'fill factor', 'power'],
      scope: String.raw`Single-diode silicon-like cell, one sun, illustrative parameters.`,
      credit: 'Fill-factor expression: M. A. Green, 1982',
      verify: true,
      viz(v) {
        const rs = v.select('series resistance $R_s$', [{ value: '0', label: '0' }, { value: '1', label: '1 Ω cm²' }, { value: '3', label: '3 Ω cm²' }, { value: '6', label: '6 Ω cm²' }], '0');
        const suns = v.slider('light intensity (suns)', 0.1, 5, 1, { log: true, sig: 2 });
        const ll = v.toggle('show load lines', true);
        const S = v.stage({ x: [0, 0.8], y: [0, 50], axes: 'box', gutter: true, height: 340, weight: 1.3, minWidth: 290, xlabel: 'voltage V (V)', ylabel: 'current density J (mA/cm²)', title: 'operating point' });
        const P = v.stage({ x: [0, 0.8], y: [0, 28], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 260, xlabel: 'voltage V (V)', ylabel: 'power density (mW/cm²)', title: 'power curve' });
        const mk = () => cell({ suns: suns.value, T: 298.15, j0ref: 1e-12, n: 1, rs: Number(rs.value), rsh: 2000 });
        let c = mk();
        const h = S.handle(0.45, 30, { color: 'gold', r: 8, constrain: (x) => { const V = clamp(x, 0.005, c.voc() - 0.002); return [V, c.J(V)]; } });
        let st = null;
        v.render(() => {
          c = mk();
          const voc = c.voc(), jsc = c.jsc(), mp = c.pmax();
          S.setView([0, 0.8], [0, Math.max(10, Math.ceil((jsc * 1.1) / 5) * 5)]);
          P.setView([0, 0.8], [0, Math.max(5, Math.ceil((mp.P * 1.3) / 2) * 2)]);
          const V = clamp(h.x, 0.005, voc - 0.002), J = c.J(V);
          h.set(V, J);
          S.rect(0, 0, voc, jsc, { color: 'muted', stroke: true, fill: false, dash: [5, 4], width: 1.3 });
          S.rect(0, 0, mp.V, mp.J, { fill: 'green', fillAlpha: 0.25, color: 'green', width: 1.6 });
          S.rect(0, 0, V, J, { fill: 'orange', fillAlpha: 0.35, color: 'orange', width: 2 });
          S.path(ivCurve(c, 0, voc, 160), { color: 'accent', width: 3 });
          if (ll.value) {
            const tail = (V1, J1, col) => S.line(0, 0, V1 * 1.3, J1 * 1.3, { color: col, width: 1.2, dash: [4, 4] });
            tail(mp.V, mp.J, 'green'); tail(V, J, 'orange');
          }
          S.dot(mp.V, mp.J, { r: 6, color: 'green', hollow: true });
          S.text('$J_{sc}V_{oc}$', voc, jsc, { dx: 6, dy: -2, align: 'left', size: 11, color: 'muted' });
          P.path(ivCurve(c, 0, voc, 160).map(([vv, jj]) => [vv, vv * jj]), { color: 'accent', width: 3 });
          P.hline(voc * jsc, { color: 'muted', width: 1, dash: [5, 4] });
          P.dot(mp.V, mp.P, { r: 6, color: 'green', hollow: true });
          P.dot(V, V * J, { r: 8, color: 'gold' });
          const v0 = voc / c.a;
          st = { V, J, voc, jsc, mp, FF: mp.P / (voc * jsc), Pin: 100 * suns.value, ffG: ffGreen(v0), v0 };
        });
        v.legend([['orange', 'power at your load', { area: true }], ['green', 'maximum power', { area: true }], ['muted', '$V_{oc}\\times J_{sc}$', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { V, J, voc, jsc, mp, FF, Pin, ffG, v0 } = st;
          return `Your load: $V=${v.fix(V, 3)}$ V, $J=${v.fix(J, 1)}$ mA/cm², $P=${v.fix(V * J, 2)}$ mW/cm² (${v.fix((100 * V * J) / mp.P, 0)}% of the maximum), $R=V/J=${v.fix((1000 * V) / J, 1)}\\ \\Omega\\,\\text{cm}^2$ · maximum power point $V_{mp}=${v.fix(mp.V, 3)}$ V ($${v.fix((100 * mp.V) / voc, 0)}\\%$ of $V_{oc}$), $P_{mp}=${v.fix(mp.P, 2)}$ → **FF = ${v.fix(FF, 3)}**, efficiency ${v.fix((100 * mp.P) / Pin, 1)}%\nIdeal-diode fill factor from the empirical formula with $v_{oc}=${v.fix(v0, 1)}$: ${v.fix(ffG, 3)} ${rs.value === '0' ? '(the model here has a small shunt leak)' : '— series resistance has lowered it'}.`;
        });
      },
    },
  ],
};
