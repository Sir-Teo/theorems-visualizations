// Atmosphere & Ocean Dynamics — Chapter 1: Vertical structure: hydrostatics, lapse rates and stability (items 1.1–1.6)
import {
  clamp, lerp, G0, RD, CPD, KAPPA, RV, EPS, GAMMA_DRY, R_STD, USSA_LAYERS, ussaT, ussaPClosed, ussaPNum, hydroLnP,
  esat, Lv, rsat, theta, gammaMoist, moistAscend, moistPath, satEntropy, dryAscend,
  NORMAN_12Z, NORMAN_17Z, TROP_STATIONS, profile, hydroHeights, ussaRows,
  skx, sky, SKEW_K, skewStageOpts, drawSkewBackground,
} from './ch01.shared.js';

const KM = 1000;
const sgn = (v, x, d = 1) => (x < 0 ? '−' : '') + v.fix(Math.abs(x), d);
/** Linear interpolation of ys over ascending xs (clamped). */
const interp = (xs, ys, x) => {
  if (x <= xs[0]) return ys[0]; if (x >= xs[xs.length - 1]) return ys[ys.length - 1];
  let lo = 0, hi = xs.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; (xs[m] <= x ? lo = m : hi = m); }
  return ys[lo] + (ys[hi] - ys[lo]) * (x - xs[lo]) / (xs[hi] - xs[lo]);
};

export default {
  collection: 'geo',
  chapter: 1,
  title: 'Vertical structure: hydrostatics, lapse rates and stability',
  summary: String.raw`The atmosphere and ocean are thin layers held down by gravity, so pressure is nearly hydrostatic and falls exponentially with height. A rising parcel cools at the dry adiabatic lapse rate until water condenses and releases latent heat; comparing the parcel with its surroundings decides whether the air is stable, which the buoyancy frequency measures. The ocean's density depends nonlinearly on temperature and salinity, setting its own stratification. The pictures run on the 1976 US Standard Atmosphere, real radiosonde soundings from the NOAA IGRA archive, the Murphy–Koop vapour-pressure formula, the UNESCO seawater equation of state and World Ocean Atlas profiles.`,
  items: [
    // ------------------------------------------------------------------ 1.1
    {
      num: '1.1', kind: 'Law', name: 'Hydrostatic balance and scale height',
      statement: String.raw`In a fluid at rest, or moving with vertical accelerations much smaller than $g$, the vertical momentum equation reduces to **hydrostatic balance**
$$\frac{\partial p}{\partial z} = -\rho g .$$
The pressure at a height is the weight of the fluid above it per unit area. For an ideal gas $p = \rho R T$ this gives $d\ln p/dz = -g/(RT) = -1/H$ with the **scale height** $H = RT/g$; if $T$ is constant, $p = p_0\,e^{-z/H}$, and in general $p(z) = p_0\exp\!\big(-\int_0^z dz'/H(z')\big)$. For Earth's air ($T\approx 250$–$290$ K) $H \approx 7$–$8.5$ km, so half the atmosphere's mass lies below $H\ln 2 \approx 5.5$ km.`,
      idea: String.raw`Take a horizontal slab of thickness $\delta z$ and unit area: the fluid below pushes up with $p(z)$, the fluid above pushes down with $p(z+\delta z)$, and gravity pulls down with the slab's weight $\rho g\,\delta z$. If the slab is not accelerating the three forces cancel, which is the equation above as $\delta z\to 0$. Substituting the ideal-gas law from pchem-1.10 turns it into a separable equation for $\ln p$, solved by quadrature (here by Simpson's rule on the real temperature profile). The approximation fails only for strong vertical accelerations, as in the cores of thunderstorms, and for very small scales.`,
      caption: String.raw`**Drag the gold handle** up the pressure profile (left): the middle panel shows the fraction of the column's mass below it, the right panel compares the net pressure push on a slab of adjustable thickness with its weight. Choose the atmosphere: an *isothermal* one (slide $T$ and watch the e-folding heights $H$, $2H$, … move), the *US Standard Atmosphere 1976* whose pressure is **integrated numerically** here and checked against the published layer-base pressures (gold dots), or a *radiosonde* from Norman, Oklahoma, where the measured pressure levels are compared with the heights the hydrostatic integral of the measured temperatures predicts.`,
      deps: ['fluid-2.2', 'pchem-1.10'],
      refs: ['Vallis', 'Pierrehumbert'],
      tags: ['hydrostatic balance', 'scale height', 'atmosphere'],
      scope: String.raw`Valid when vertical accelerations are small compared with $g$ (horizontal scale much larger than depth); the exponential form needs constant $T$ and $g$, the integral form only an ideal gas.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Hydrostatic_equilibrium' },
      viz(v) {
        const mode = v.select('atmosphere', [{ value: 'iso', label: 'isothermal' }, { value: 'ussa', label: 'US Standard 1976' }, { value: 'obs', label: 'radiosonde (Norman, OK)' }], 'ussa');
        const Tiso = v.slider('isothermal temperature $T$ (K)', 180, 320, 250, { step: 1 });
        const dzS = v.slider('slab thickness (km)', 0.1, 5, 1, { step: 0.1 });
        // US Standard Atmosphere pressure by numerical integration, tabulated every 100 m
        const lpU = [Math.log(101325)]; for (let i = 0; i < 848; i++) lpU.push(hydroLnP(ussaT, i * 100, (i + 1) * 100, lpU[i], 25));
        const ussaP = (z) => Math.exp(interp(lpU.map((_, i) => i * 100), lpU, z)) / 100;
        // radiosonde: measured p(z), and p(z) from hydrostatic integration of the measured T
        const rows = NORMAN_12Z, zm = rows.map((r) => r[1]), lpm = rows.map((r) => Math.log(r[0])), zh = hydroHeights(rows);
        const obsP = (z) => Math.exp(interp(zm, lpm, z)), hydP = (z) => Math.exp(interp(zh, lpm, z)), obsT = (z) => interp(zm, rows.map((r) => r[2] + 273.15), z);
        const M = () => {
          if (mode.value === 'iso') { const T = Tiso.value, H = R_STD * T / G0; return { zmin: 0, zmax: 50 * KM, P: (z) => 1013.25 * Math.exp(-z / H), T: () => T, ymax: 50 }; }
          if (mode.value === 'ussa') return { zmin: 0, zmax: 84.8 * KM, P: ussaP, T: ussaT, ymax: 86 };
          return { zmin: zm[0], zmax: zm[zm.length - 1], P: obsP, T: obsT, ymax: 21 };
        };
        const sp = v.stage({ x: [0.1, 1100], y: [0, 86], xlog: true, height: 400, axes: 'box', gutter: true, xlabel: 'pressure $p$ (hPa)', ylabel: 'height (km)', title: 'pressure profile', weight: 1.15, minWidth: 280 });
        const sm = v.stage({ x: [0, 1], y: [0, 86], height: 400, axes: 'box', gutter: true, xlabel: 'fraction of mass below', ylabel: 'height (km)', title: 'where the mass is', weight: 0.8, minWidth: 220 });
        const sb = v.stage({ x: [0.4, 2.6], y: [0, 1], height: 400, axes: 'box', gutter: true, xticks: [[1, 'net push'], [2, 'weight']], ylabel: 'force per unit area (Pa)', title: 'a slab: push vs weight', weight: 0.8, minWidth: 220 });
        let zH = 5500;
        const h = sp.handle(500, 5.5, { color: 'gold', label: 'z', constrain: (x, y) => { const m = M(); zH = clamp(y * KM, m.zmin, m.zmax); return [m.P(zH), zH / KM]; } });
        let info = null;
        v.render(() => {
          const m = M(); Tiso.el.hidden = mode.value !== 'iso';
          zH = clamp(zH, m.zmin, m.zmax);
          const pLo = m.P(m.zmax) * 0.6, p0 = m.P(m.zmin);
          sp.setView([pLo, 1100], [0, m.ymax]); sm.setView([0, 1], [0, m.ymax]);
          const zs = []; for (let z = m.zmin; z <= m.zmax; z += m.zmax / 240) zs.push(z);
          sp.path(zs.map((z) => [m.P(z), z / KM]), { color: 'accent', width: 2.6 });
          if (mode.value === 'iso') {
            const H = R_STD * Tiso.value / G0;
            for (let n = 1; n <= 5 && n * H < m.zmax; n++) { sp.dot(p0 * Math.exp(-n), n * H / KM, { r: 4, color: 'orange' }); sp.text(`${n}H`, p0 * Math.exp(-n), n * H / KM, { dx: 12, dy: -2, size: 11, color: 'orange' }); }
          } else if (mode.value === 'ussa') {
            for (const L of USSA_LAYERS) sp.dot(L[3] / 100, L[0] / KM, { r: 4.5, color: 'gold' });
          } else {
            sp.path(rows.map((r, i) => [Math.exp(lpm[i]), zh[i] / KM]), { color: 'green', width: 2, dash: [6, 4] });
            sp.dots(rows.map((r, i) => [r[0], r[1] / KM]), { r: 2.8, color: 'ink' });
          }
          // mass fraction
          const frac = (z) => 1 - m.P(z) / p0;
          sm.path(zs.map((z) => [frac(z), z / KM]), { color: 'accent', width: 2.6 });
          let lo = m.zmin, hi = m.zmax; for (let i = 0; i < 50; i++) { const mid = (lo + hi) / 2; (frac(mid) < 0.5 ? lo = mid : hi = mid); }
          const zHalf = (lo + hi) / 2;
          sm.vline(0.5, { color: 'faint', dash: [3, 4] }); sm.hline((zHalf) / KM, { color: 'faint', dash: [3, 4] });
          sm.dot(0.5, zHalf / KM, { r: 4.5, color: 'green' }); sm.text(`half: ${v.fix((zHalf - m.zmin) / KM, 2)} km`, 0.5, zHalf / KM, { dx: 10, dy: 12, size: 11, color: 'green' });
          sm.hline(zH / KM, { color: 'gold', width: 1.4 }); sm.dot(frac(zH), zH / KM, { r: 6, color: 'gold' });
          h.set(m.P(zH), zH / KM);
          // slab: net pressure force vs weight (Simpson over the slab)
          const dz = Math.min(dzS.value * KM, m.zmax - zH), z1 = zH + dz;
          const dP = (m.P(zH) - m.P(z1)) * 100;
          const rho = (z) => m.P(z) * 100 / (RD * m.T(z));
          let wgt = 0; const n = 40; for (let i = 0; i <= n; i++) wgt += (i === 0 || i === n ? 1 : i % 2 ? 4 : 2) * rho(zH + dz * i / n); wgt *= G0 * dz / (3 * n);
          sb.setView([0.4, 2.6], [0, Math.max(dP, wgt) * 1.2 + 1e-9]);
          sb.bars([dP, wgt], { x0: 1, dx: 1, color: (val, i) => (i ? 'orange' : 'accent') });
          sb.text(v.fix(dP, dP < 100 ? 2 : 0), 1, dP, { dy: -10, size: 12, color: 'accent' }); sb.text(v.fix(wgt, wgt < 100 ? 2 : 0), 2, wgt, { dy: -10, size: 12, color: 'orange' });
          let extra = '';
          if (mode.value === 'ussa') extra = `\nnumerical integral at 11 km: ${v.fix(ussaPNum(11000), 2)} Pa (published table 22632.1 Pa); at 20 km: ${v.fix(ussaPNum(20000), 2)} Pa (table 5474.89 Pa)`;
          if (mode.value === 'obs') extra = `\nheight of the 500 hPa surface: measured ${v.fix(interp(lpm.slice().reverse(), zm.slice().reverse(), Math.log(500)), 0)} m, from hydrostatic integration of the measured $T$: ${v.fix(interp(lpm.slice().reverse(), zh.slice().reverse(), Math.log(500)), 0)} m`;
          info = { p: m.P(zH), T: m.T(zH), zHalf: zHalf - m.zmin, dP, wgt, p0, extra, zmin: m.zmin };
        });
        v.legend([['accent', 'pressure profile'], ['gold', 'handle / published table'], ['orange', 'e-fold heights / weight'], ['green', 'half the mass / integrated $T$']]);
        v.readout(() => {
          if (!info) return '';
          const { p, T, zHalf, dP, wgt, p0, extra } = info, Hs = R_STD * T / G0;
          return `height ${v.fix(zH / KM, 2)} km: $p$ = **${v.fix(p, p < 10 ? 3 : 1)} hPa** (${v.fix(100 * p / p0, 1)}% of the surface value), $T$ = ${v.fix(T, 1)} K, local scale height $RT/g$ = **${v.fix(Hs / KM, 2)} km**\nhalf of the mass lies below **${v.fix(zHalf / KM, 2)} km** ($H\\ln 2$ would give ${v.fix(R_STD * T / G0 * Math.LN2 / KM, 2)} km at this $T$) · slab: net pressure push ${v.fix(dP, 2)} Pa, weight $\\int\\rho g\\,dz$ = ${v.fix(wgt, 2)} Pa → ratio **${v.fix(dP / wgt, 4)}**${extra}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.2
    {
      num: '1.2', kind: 'Law', name: 'Dry adiabatic lapse rate',
      statement: String.raw`A parcel of dry air that rises (or sinks) without exchanging heat with its surroundings, and that stays at the pressure of the surrounding air, obeys $c_p\,dT = \dfrac{RT}{p}\,dp$. With hydrostatic balance $dp = -\rho g\,dz$ this gives
$$\Gamma_d \;=\; -\frac{dT}{dz}\bigg|_{\text{parcel}} \;=\; \frac{g}{c_p} \;\approx\; \frac{9.81\ \mathrm{m\,s^{-2}}}{1004.6\ \mathrm{J\,kg^{-1}K^{-1}}}\;=\;9.76\ \mathrm{K\,km^{-1}} ,$$
independent of height, pressure and temperature (to the extent that $c_p$ is constant and the parcel's density matches its surroundings). Equivalently $T\propto p^{R/c_p}$, with $R/c_p = 0.2857$ for air.`,
      idea: String.raw`The first law for an adiabatic parcel, $dh = c_p\,dT = dp/\rho$, says the enthalpy change is entirely the work $dp/\rho$ done as the pressure changes. Hydrostatic balance (1.1) converts $dp/\rho$ into $-g\,dz$, so $c_p\,dT = -g\,dz$. Rising air cools because it expands against lower pressure; sinking air warms by compression. The strict result is $\Gamma = (g/c_p)(T_{\text{parcel}}/T_{\text{env}})$ because the parcel's pressure equals the environment's but its density need not; the correction is a percent or so.`,
      caption: String.raw`The black profile is the environment (drag its eight gold handles, or pick a preset). **Drag the blue handle** up or down: the parcel, which starts at the *start height* with the environment's temperature, follows the dry adiabat (blue) obtained by **integrating the first law numerically** through the environment's own hydrostatic pressure. Shading marks where it is warmer (orange: it keeps rising) or colder (blue: it sinks back) than its surroundings. The right panel shows each layer's environmental lapse rate against $\Gamma_d$ = 9.76 K/km: layers cooler than that are stable.`,
      deps: ['geo-1.1', 'pchem-2.7'],
      refs: ['Pierrehumbert', 'Vallis'],
      tags: ['lapse rate', 'adiabatic', 'parcel'],
      scope: String.raw`Unsaturated air, no mixing with the environment, no heat exchange, parcel pressure equal to the environment's; $g$ and $c_p$ constant over the depth considered.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Lapse_rate' },
      viz(v) {
        const ZK = [0, 1, 2, 3, 4, 6, 8, 10];
        const preset = v.select('environment', [{ value: 'std', label: 'standard atmosphere' }, { value: 'inv', label: 'Norman 12 UTC (cap)' }, { value: 'dry', label: 'dry adiabatic' }, { value: 'iso', label: 'isothermal' }, { value: 'own', label: 'my own' }], 'std', { onChange: () => apply() });
        const z0s = v.slider('start height (km)', 0, 6, 0, { step: 0.5 });
        const rowsN = NORMAN_12Z;
        const setP = {
          std: () => ZK.map((z) => ussaT(z * KM) - 273.15),
          inv: () => ZK.map((z) => interp(rowsN.map((r) => r[1] / KM), rowsN.map((r) => r[2]), z)),
          dry: () => ZK.map((z) => 15 - GAMMA_DRY * KM * z),
          iso: () => ZK.map(() => -5),
        };
        const sE = v.stage({ x: [-62, 32], y: [0, 10], height: 440, axes: 'box', gutter: true, xlabel: 'temperature (°C)', ylabel: 'height (km)', title: 'environment and a lifted parcel', weight: 1.4, minWidth: 300 });
        const sG = v.stage({ x: [-12, 16], y: [0, 10], height: 440, axes: 'box', gutter: true, xlabel: 'lapse rate $-dT/dz$ (K/km)', ylabel: 'height (km)', title: 'environment vs $\\Gamma_d$', weight: 0.8, minWidth: 230 });
        const Hs = ZK.map((z, i) => sE.handle(0, z, { color: 'gold', r: 6, constrain: (x) => [clamp(x, -62, 32), z], onDrag: () => { preset.value = 'own'; } }));
        const apply = () => { if (preset.value === 'own') return; const T = setP[preset.value](); Hs.forEach((h, i) => h.set(T[i], ZK[i])); };
        apply();
        let zp = 3.5;
        const hp = sE.handle(0, 3.5, { color: 'accent', r: 7, label: 'parcel', labelPos: 'w', constrain: (x, y) => { zp = clamp(y, 0, 10); return [parcelT(zp) , zp]; } });
        const Te = (z) => interp(ZK, Hs.map((h) => h.x), z) + 273.15;                    // K, z in km
        let st = null;
        function parcelT(z) { return st ? st.Tp(z) - 273.15 : 0; }
        v.render(() => {
          const z0 = z0s.value;
          // hydrostatic ln p(z) from the environment, and the parcel by RK4 on dT/dz = κ T d ln p/dz
          const dz = 0.05, N = 200, lnp = [0], Tp = [], zs = []; // grid every 50 m up to 10 km; ln p relative to 1000 hPa at z = 0
          for (let i = 0; i < N; i++) { const a = i * dz, b = a + dz, f = (z) => -G0 / (RD * Te(z)) * KM; lnp.push(lnp[i] + dz / 6 * (f(a) + 4 * f(a + dz / 2) + f(b))); }
          const idx = (z) => z / dz;
          const lnpAt = (z) => { const x = idx(z), i = Math.min(N - 1, Math.floor(x)); return lnp[i] + (lnp[i + 1] - lnp[i]) * (x - i); };
          // parcel: integrate the ODE outward from the start height in both directions
          const T0 = Te(z0), ode = (z1) => { const n = Math.max(1, Math.ceil(Math.abs(z1 - z0) / dz)), h = (z1 - z0) / n; let T = T0, z = z0; const fT = (zz, TT) => KAPPA * TT * (-G0 / (RD * Te(zz)) * KM); for (let k = 0; k < n; k++) { const k1 = fT(z, T), k2 = fT(z + h / 2, T + h / 2 * k1), k3 = fT(z + h / 2, T + h / 2 * k2), k4 = fT(z + h, T + h * k3); T += h / 6 * (k1 + 2 * k2 + 2 * k3 + k4); z += h; } return T; };
          const Tpf = (z) => ode(z);
          st = { Tp: Tpf };
          // environment
          sE.path(ZK.map((z, i) => [Hs[i].x, z]), { color: 'ink', width: 2.6 });
          sE.path([0, 10].map((z) => [dryAdiabat(z), z]), { color: 'accent', width: 1, dash: [5, 5], alpha: 0.7 });
          function dryAdiabat(z) { return Tpf(z) - 273.15; }
          // buoyancy shading between parcel and environment from start to the handle
          const za = Math.min(z0, zp), zb = Math.max(z0, zp);
          if (zb - za > 0.02) {
            const zz = []; for (let k = 0; k <= 40; k++) zz.push(za + (zb - za) * k / 40);
            const tp = zz.map((z) => Tpf(z));
            for (const col of ['orange', 'blue']) {
              let up = [], dn = [];
              const flush = () => { if (up.length > 1) sE.poly([...up, ...dn.reverse()], { fill: col, fillAlpha: 0.28, stroke: false }); up = []; dn = []; };
              zz.forEach((z, k) => { const d = tp[k] - Te(z); if (col === 'orange' ? d >= 0 : d < 0) { up.push([tp[k] - 273.15, z]); dn.push([Te(z) - 273.15, z]); } else flush(); });
              flush();
            }
          }
          sE.hline(z0, { color: 'faint', dash: [3, 4] }); sE.dot(T0 - 273.15, z0, { r: 4, color: 'accent', hollow: true });
          const Tpz = Tpf(zp); hp.set(Tpz - 273.15, zp);
          // lapse-rate bars
          const slopes = [];
          for (let i = 0; i + 1 < ZK.length; i++) {
            const g = -(Hs[i + 1].x - Hs[i].x) / (ZK[i + 1] - ZK[i]); slopes.push(g);
            sG.rect(0, ZK[i], g, ZK[i + 1], { fill: g < GAMMA_DRY * KM ? 'green' : 'red', fillAlpha: 0.35, color: g < GAMMA_DRY * KM ? 'green' : 'red', width: 1 });
          }
          sG.vline(GAMMA_DRY * KM, { color: 'accent', width: 2 }); sG.vline(0, { color: 'faint' });
          sG.text('Γd = 9.76', GAMMA_DRY * KM, 9.4, { dx: 6, align: 'left', size: 12, color: 'accent' });
          const dTe = Te(zp) , dTp = Tpz - Te(zp);
          // finite-difference lapse rate of the parcel path around the handle
          const e = 0.05, Gp = -(Tpf(Math.min(10, zp + e)) - Tpf(Math.max(0, zp - e))) / (Math.min(10, zp + e) - Math.max(0, zp - e));
          st.info = { Gp, Tpz, Tez: Te(zp), dTp, ratio: Gp / (GAMMA_DRY * KM), closed: T0 * Math.exp(KAPPA * (lnpAt(zp) - lnpAt(z0))), z0, zp };
        });
        v.legend([['ink', 'environment'], ['accent', 'parcel (dry adiabat)'], ['orange', 'parcel warmer: rises', { area: true }], ['blue', 'parcel colder: sinks', { area: true }]]);
        v.readout(() => {
          if (!st?.info) return '';
          const { Gp, Tpz, Tez, dTp, ratio, closed, z0, zp } = st.info;
          return `$\\Gamma_d = g/c_p$ = ${v.fix(G0 / CPD * KM, 3)} K/km. Parcel lifted from ${v.fix(z0, 1)} to ${v.fix(zp, 1)} km: $T$ = **${sgn(v, Tpz - 273.15, 1)} °C** (closed form $T_0(p/p_0)^{R/c_p}$ ${sgn(v, closed - 273.15, 1)} °C), cooling at **${v.fix(Gp * 1, 2)} K/km** along the path = ${v.fix(ratio, 3)} $\\times\\, g/c_p$ ($\\approx T_{\\rm parcel}/T_{\\rm env}$ correction) · environment ${sgn(v, Tez - 273.15, 1)} °C, so the parcel is ${v.fix(Math.abs(dTp), 1)} K **${dTp > 0.05 ? 'warmer (buoyant)' : dTp < -0.05 ? 'colder (it sinks back)' : 'equal'}**`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.3
    {
      num: '1.3', kind: 'Definition', name: 'Potential temperature',
      statement: String.raw`The **potential temperature** of air at pressure $p$ and temperature $T$ is the temperature it would have if brought adiabatically to the reference pressure $p_0 = 1000$ hPa:
$$\theta \;=\; T\left(\frac{p_0}{p}\right)^{R/c_p},\qquad \frac{R}{c_p}\approx 0.2857 .$$
$\theta$ is conserved by adiabatic, frictionless motion, so it labels air parcels in the same way $T$ would if pressure never changed. On a vertical profile, $\partial\theta/\partial z>0$ means the air is statically stable, $\partial\theta/\partial z=0$ neutral (dry adiabatic) and $\partial\theta/\partial z<0$ unstable; and $\dfrac{\partial\ln\theta}{\partial z} = \dfrac{1}{T}\big(\Gamma_d-\Gamma\big)$ with $\Gamma=-\partial T/\partial z$.`,
      idea: String.raw`Integrating the dry-adiabatic relation $d\ln T = (R/c_p)\,d\ln p$ (1.2) from $(p,T)$ to $p_0$ gives the formula, and shows $\theta$ is the constant of integration: every point of one dry adiabat has the same $\theta$. Differentiating $\ln\theta = \ln T + (R/c_p)\ln(p_0/p)$ in height and using hydrostatic balance (1.1) gives the stability formula, so $\theta$ increasing upward and the environmental lapse rate being below $\Gamma_d$ say the same thing.`,
      caption: String.raw`The left panel is a skew-T diagram (isotherms lean right, the faint orange curves are dry adiabats) of a real sounding: choose Norman, Oklahoma, at 12 or 17 UTC on 20 May 2013, Cambridge Bay (Arctic Canada) in January, or the standard atmosphere. **Drag the gold handle** along the temperature curve: the orange line takes that air **adiabatically to 1000 hPa** (integrated numerically), where its temperature is read off as $\theta$. Right: $\theta$ against height for the whole sounding; red segments are where $\theta$ decreases with height (convectively unstable layers), and almost everywhere else it increases.`,
      deps: ['geo-1.2'],
      refs: ['Pierrehumbert', 'Vallis'],
      tags: ['potential temperature', 'adiabat', 'stability'],
      credit: 'von Helmholtz, 1888 (as the θ of an adiabatic change); named "potential temperature" by von Bezold, 1888',
      scope: String.raw`Dry (unsaturated) air; for saturated air the moist analogues $\theta_e$ and $\theta_w$ are conserved instead (1.6, 1.7). $p_0 = 1000$ hPa is a convention (some oceanographers use other references).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Potential_temperature' },
      viz(v) {
        const SND = {
          n17: { name: 'Norman OK, 20 May 2013 17 UTC', rows: NORMAN_17Z },
          n12: { name: 'Norman OK, 20 May 2013 12 UTC', rows: NORMAN_12Z },
          cam: { name: 'Cambridge Bay, 15 Jan 2013 00 UTC', rows: TROP_STATIONS[4].jan },
          std: { name: 'US Standard Atmosphere 1976', rows: ussaRows(16000, 250) },
        };
        const sel = v.select('sounding', [{ value: 'n17', label: 'Norman 17 UTC' }, { value: 'n12', label: 'Norman 12 UTC' }, { value: 'cam', label: 'Cambridge Bay (Jan)' }, { value: 'std', label: 'standard atmosphere' }], 'n17');
        const sk = v.stage(skewStageOpts({ height: 480, title: 'skew-T / log p: sounding and the adiabat of the chosen air', weight: 1.3, minWidth: 300 }));
        const sr = v.stage({ x: [250, 420], y: [0, 16], height: 480, axes: 'box', gutter: true, xlabel: 'potential temperature $\\theta$ (K)', ylabel: 'height (km)', title: '$\\theta$ against height', weight: 0.8, minWidth: 230 });
        let pH = 700, cur = () => profile(SND.n17.rows.filter((r) => r[0] >= 100)), curKey = '', P = null, info = null;
        const h = sk.handle(0, 0, { color: 'gold', r: 7, label: 'air', labelPos: 'ne', constrain: (x, y) => { const P = cur(); pH = clamp(1000 * Math.exp(-y), P.pTop, P.pSfc); return [skx(P.T(pH) - 273.15, pH), sky(pH)]; } });
        v.render(() => {
          if (curKey !== sel.value) { curKey = sel.value; P = profile(SND[curKey].rows.filter((r) => r[0] >= 100)); cur = () => P; pH = clamp(pH, P.pTop, P.pSfc); }
          drawSkewBackground(sk, { moist: false });
          const rows = P.rows;
          sk.path(rows.map((r) => [skx(r[2], r[0]), sky(r[0])]), { color: 'red', width: 2.6 });
          if (rows[0][3] != null) sk.path(rows.filter((r) => r[3] != null).map((r) => [skx(r[3], r[0]), sky(r[0])]), { color: 'blue', width: 2, dash: [6, 4] });
          const T = P.T(pH), th = theta(T, pH);
          // numerical adiabatic descent/ascent to 1000 hPa: RK4 on dT/dlnp = κ T
          let Tn = T, lp = Math.log(pH), lp1 = Math.log(1000); const n = 40, hh = (lp1 - lp) / n; const path = [[skx(T - 273.15, pH), sky(pH)]];
          for (let i = 0; i < n; i++) { const f = (x) => KAPPA * x; const k1 = f(Tn), k2 = f(Tn + hh / 2 * k1), k3 = f(Tn + hh / 2 * k2), k4 = f(Tn + hh * k3); Tn += hh / 6 * (k1 + 2 * k2 + 2 * k3 + k4); lp += hh; const pp = Math.exp(lp); path.push([skx(Tn - 273.15, pp), sky(pp)]); }
          sk.path(path, { color: 'orange', width: 3 });
          sk.dot(Tn - 273.15, 0, { r: 6, color: 'orange', label: `θ = ${v.fix(Tn, 1)} K`, labelPos: 'n' });
          h.set(skx(T - 273.15, pH), sky(pH));
          // θ profile
          const zk = rows.map((r) => r[1] / KM), th_ = rows.map((r) => theta(r[2] + 273.15, r[0]));
          sr.setView([Math.floor((Math.min(...th_) - 5) / 10) * 10, Math.ceil((Math.max(...th_) + 5) / 10) * 10], [0, Math.ceil(Math.max(...zk) / 2) * 2]);
          for (let i = 0; i + 1 < rows.length; i++) { const up = th_[i + 1] >= th_[i]; sr.line(th_[i], zk[i], th_[i + 1], zk[i + 1], { color: up ? 'accent' : 'red', width: up ? 2.4 : 4 }); }
          const zH = P.z(pH) / KM; sr.dot(theta(T, pH), zH, { r: 6, color: 'gold' }); sr.hline(zH, { color: 'faint', dash: [3, 4] });
          // local stability dθ/dz by centred difference in z
          const dz = 0.15, pu = (() => { let lo = P.pTop, hi = P.pSfc; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; (P.z(m) / KM > zH + dz ? lo = m : hi = m); } return (lo + hi) / 2; })(), pd = (() => { let lo = P.pTop, hi = P.pSfc; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; (P.z(m) / KM > zH - dz ? lo = m : hi = m); } return (lo + hi) / 2; })();
          const dth = (theta(P.T(pu), pu) - theta(P.T(pd), pd)) / (P.z(pu) - P.z(pd)) * KM;
          info = { T, th, Tn, dth, lapse: GAMMA_DRY * 1000 - dth * T / th * 1 };
        });
        v.legend([['red', 'temperature'], ['blue', 'dew point', { dash: true }], ['orange', 'dry adiabat to 1000 hPa'], ['gold', 'chosen air']]);
        v.readout(() => {
          if (!info) return '';
          const { T, th, Tn, dth } = info;
          return `${SND[curKey].name}: air at ${v.fix(pH, 0)} hPa, ${sgn(v, T - 273.15, 1)} °C (${v.fix(T, 1)} K) → $\\theta$ = **${v.fix(Tn, 2)} K** by numerical integration; formula $T(p_0/p)^{R/c_p}$ gives ${v.fix(th, 2)} K\n$\\partial\\theta/\\partial z$ here = **${sgn(v, dth, 1)} K/km** → ${dth > 0.5 ? 'stable (θ increases upward)' : dth < -0.5 ? 'unstable (θ decreases upward)' : 'nearly neutral'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.4
    {
      num: '1.4', kind: 'Definition', name: 'Static stability and the buoyancy frequency',
      statement: String.raw`Displace a parcel adiabatically by $\zeta$ from its equilibrium height in an atmosphere with potential temperature profile $\theta(z)$. Its buoyancy acceleration is $\ddot\zeta = g\,(T_{\rm p}-T_{\rm e})/T_{\rm e} \approx -N^2\zeta$, with the **buoyancy (Brunt–Väisälä) frequency**
$$N^2 \;=\; \frac{g}{\theta}\frac{\partial\theta}{\partial z} \;=\; \frac{g}{T}\big(\Gamma_d-\Gamma\big),\qquad \Gamma=-\frac{\partial T}{\partial z}.$$
If $N^2>0$ (environmental lapse rate below the dry adiabatic one) the parcel oscillates sinusoidally at angular frequency $N$, period $2\pi/N$ (about 10 min in the lower troposphere, 5 min in the stratosphere); if $N^2=0$ it is neutral; if $N^2<0$ the displacement grows exponentially at rate $\sqrt{-N^2}$ and the layer is statically unstable. In the ocean the same formula holds with density: $N^2 = -(g/\rho)\,\partial\rho/\partial z$ (1.10).`,
      idea: String.raw`A displaced parcel keeps its own $\theta$ (adiabatic, 1.3) but takes the pressure of its new surroundings, so its buoyancy depends only on how the environment's $\theta$ differs from the parcel's: $T_p-T_e\approx -\zeta\,(T/\theta)\,\partial\theta/\partial z$. This is a restoring force linear in $\zeta$ when $\partial\theta/\partial z>0$ — a harmonic oscillator whose frequency is the formula above — and an anti-restoring force otherwise. The same $N$ later sets the frequency of internal gravity waves (geo-6.5) and the Richardson-number criterion for shear instability (geo-7.6).`,
      caption: String.raw`Left: the environment (black line, a constant lapse rate $\Gamma$ that you set; the parcel starts at 1.5 km) and the displaced parcel on its dry adiabat (blue). Press play: the parcel is advanced with the **full buoyancy $g(T_p-T_e)/T_e$** (not the linearised one) and its height is recorded on the right, against the dashed prediction $\zeta_0\cos Nt$. Slide $\Gamma$ across 9.76 K/km: stable air oscillates, with period shortening as the layer gets more stable (inversions), the neutral case sits still, and an unstable lapse rate sends the parcel away exponentially. The model clock runs 40 times faster than real time.`,
      deps: ['geo-1.3', 'fluid-9.9'],
      refs: ['Vallis'],
      tags: ['stability', 'buoyancy frequency', 'oscillation'],
      credit: 'Väisälä, 1925; Brunt, 1927',
      scope: String.raw`Dry air and small, adiabatic displacements; for saturated air $N_m^2$ uses the moist lapse rate (1.6), and for large displacements the parcel's pressure no longer equals the environment's in a hydrostatic sense only to first order.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Brunt%E2%80%93V%C3%A4is%C3%A4l%C3%A4_frequency' },
      viz(v) {
        const gam = v.slider('environmental lapse rate $\\Gamma$ (K/km)', -8, 14, 5, { step: 0.1, onChange: () => S.reset() });
        const dz0 = v.slider('initial displacement $\\zeta_0$ (m)', -600, 600, 300, { step: 10, onChange: () => S.reset() });
        const MT = 40, z0 = 1500, Tsfc = 288.15, ZT = 3000;
        const Te = (z) => Tsfc - gam.value * z / KM;
        const lnpR = (z) => { const n = 24, h = (z - z0) / n; let s = 1 / Te(z0) + 1 / Te(z); for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) / Te(z0 + i * h); return -G0 / RD * s * h / 3; };
        const Tp = (z) => Te(z0) * Math.exp(KAPPA * lnpR(z));
        const acc = (z) => G0 * (Tp(z) - Te(z)) / Te(z);
        const sL = v.stage({ x: [-30, 32], y: [0, 3], height: 400, axes: 'box', gutter: true, xlabel: 'temperature (°C)', ylabel: 'height (km)', title: 'environment and displaced parcel', weight: 0.9, minWidth: 260 });
        const sT = v.stage({ x: [0, 30], y: [-1, 1], height: 400, axes: 'box', gutter: true, xlabel: 'model time (min)', ylabel: 'displacement $\\zeta$ (m)', title: 'height of the parcel', weight: 1.3, minWidth: 300 });
        const init = () => ({ z: z0 + dz0.value, w: 0, hist: [[0, dz0.value]] });
        const S = v.sim(init, (s, dt, t) => { const dtm = dt * MT; s.w += acc(s.z) * dtm; s.z += s.w * dtm; if (s.z < 0 || s.z > ZT) { s.z = clamp(s.z, 0, ZT); s.w = 0; } s.hist.push([(t + dt) * MT / 60, s.z - z0]); }, { dt: 0.05 });
        let info = null;
        v.animate((t) => {
          const s = S.advance(Math.min(t, 45));
          // N² by finite differences of θ(z) of the environment (pressure from hydrostatic integration)
          const th = (z) => Te(z) * Math.exp(-KAPPA * lnpR(z));
          const dzz = 40, N2 = G0 / th(z0) * (th(z0 + dzz) - th(z0 - dzz)) / (2 * dzz);
          const N2formula = G0 / Te(z0) * (GAMMA_DRY * KM - gam.value) / KM;
          sL.path([[Te(0) - 273.15, 0], [Te(ZT) - 273.15, 3]], { color: 'ink', width: 2.6 });
          sL.path([0, 3].map((z) => [Tp(z * KM) - 273.15, z]), { color: 'accent', width: 1.3, dash: [5, 5], alpha: 0.8 });
          sL.hline(z0 / KM, { color: 'faint', dash: [3, 4] });
          const zc = s.z / KM; sL.dot(Tp(s.z) - 273.15, zc, { r: 7, color: 'gold' });
          sL.arrow(Tp(s.z) - 273.15, zc, Tp(s.z) - 273.15, zc + acc(s.z) * 60 / KM, { color: 'red', width: 2.4 });
          sL.text('equilibrium', -29, z0 / KM, { dy: -9, size: 11, color: 'muted' });
          // time series
          const A = Math.max(Math.abs(dz0.value) * 1.25, 100), unstable = N2 < 0 && Math.abs(dz0.value) > 0;
          const maxZ = Math.max(A, ...s.hist.map((p) => Math.abs(p[1])));
          sT.setView([0, 30], [-maxZ * 1.1, maxZ * 1.1]);
          const N = N2 > 0 ? Math.sqrt(N2) : 0, kk = N2 < 0 ? Math.sqrt(-N2) : 0;
          sT.path(s.hist.map(([tm, z]) => [tm, z]), { color: 'accent', width: 2.6 });
          sT.hline(0, { color: 'faint' });
          const th0 = (tm) => N2 > 0 ? dz0.value * Math.cos(N * tm * 60) : N2 < 0 ? dz0.value * Math.cosh(kk * tm * 60) : dz0.value;
          sT.fn(th0, { color: 'orange', width: 1.5, dash: [6, 4], domain: [0, 30] });
          // measured period: successive upward zero crossings
          const zc2 = []; for (let i = 1; i < s.hist.length; i++) if (s.hist[i - 1][1] < 0 && s.hist[i][1] >= 0) zc2.push(s.hist[i][0]);
          const Pm = zc2.length >= 2 ? zc2[zc2.length - 1] - zc2[zc2.length - 2] : null;
          info = { N2, N2formula, N, kk, Pm, bound: s.z <= 0 || s.z >= ZT };
        }, { period: 45, still: 28 });
        v.legend([['ink', 'environment'], ['accent', 'parcel'], ['red', 'buoyancy force'], ['orange', 'linear theory', { dash: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { N2, N2formula, N, kk, Pm, bound } = info;
          return `$\\Gamma$ = ${v.fix(gam.value, 1)} K/km vs $\\Gamma_d$ = ${v.fix(GAMMA_DRY * KM, 2)} K/km → $N^2$ = **$${v.sci(N2, 3)}$ s⁻²** (finite differences of $\\theta$) · formula $(g/T)(\\Gamma_d-\\Gamma)$ = $${v.sci(N2formula, 3)}$ s⁻²\n` +
            (N2 > 0 ? `stable: $N$ = **${v.fix(N, 4)} s⁻¹**, predicted period $2\\pi/N$ = **${v.fix(2 * Math.PI / N / 60, 2)} min**${Pm ? `, simulated period ${v.fix(Pm, 2)} min` : ''}`
              : N2 < 0 ? `unstable: growth rate $\\sqrt{-N^2}$ = ${v.fix(kk, 4)} s⁻¹, e-folding time ${v.fix(1 / kk / 60, 1)} min${bound ? ' — the parcel has hit the boundary of the layer' : ''}` : 'neutral: no restoring force, the parcel stays where it is put');
        });
      },
    },
    // ------------------------------------------------------------------ 1.5
    {
      num: '1.5', kind: 'Law', name: 'Clausius–Clapeyron and saturation vapour pressure',
      statement: String.raw`The saturation vapour pressure $e_s(T)$ over liquid water, the vapour pressure at which evaporation and condensation balance, satisfies the **Clausius–Clapeyron equation**
$$\frac{d\ln e_s}{dT} \;=\; \frac{L_v}{R_v T^2},$$
where $L_v\approx 2.5\times10^6$ J/kg is the latent heat of vaporisation and $R_v = 461.5$ J/(kg K) the gas constant of water vapour. At atmospheric temperatures this is about **6–7 % per kelvin**, so $e_s$ roughly doubles for every 10 K of warming; the **relative humidity** is $\mathrm{RH}=e/e_s(T)$, and cooling air at fixed $e$ reaches saturation at the **dew point** $T_d$, where $e_s(T_d)=e$.`,
      idea: String.raw`At a flat liquid–vapour interface the specific Gibbs energies of the two phases are equal, so along the coexistence curve $dg_\ell=dg_v$ gives $(s_v-s_\ell)\,dT=(v_v-v_\ell)\,de_s$ (pchem-4.4). The latent heat is $L_v=T(s_v-s_\ell)$ and the vapour volume $v_v\approx R_vT/e_s$ dwarfs the liquid's, which yields the equation. Integrating it with $L_v(T)$ gives the nearly exponential curve; the figure integrates it numerically and compares with the accurate Murphy–Koop (2005) fit to the measured vapour pressure of water.`,
      caption: String.raw`**Drag the gold point**: left–right sets the air temperature, up–down its actual vapour pressure $e$. The black curve is the accurate saturation vapour pressure (Murphy & Koop 2005); the dashed green curve is the Clausius–Clapeyron equation **integrated numerically** from the triple point with $L_v(T)$, the dotted red one with $L_v$ held constant (which drifts away from the data at low temperature). Above the curve the air would be supersaturated (it condenses); the horizontal line meets the curve at the dew point (open circle). Toggle the axis to a log scale and the curve straightens out: exponential growth. The right panel is the growth rate $d\ln e_s/dT$ in %/K.`,
      deps: ['pchem-4.4'],
      refs: ['Pierrehumbert'],
      tags: ['Clausius–Clapeyron', 'humidity', 'vapour pressure'],
      credit: 'Clapeyron, 1834; Clausius, 1850',
      scope: String.raw`Flat surface of pure liquid water, vapour treated as an ideal gas and the liquid's volume neglected; below 0 °C the curve shown is for supercooled liquid (ice has a lower $e_s$).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Clausius%E2%80%93Clapeyron_relation' },
      viz(v) {
        const logY = v.toggle('logarithmic vapour pressure', false);
        const sC = v.stage({ x: [-20, 40], y: [0, 75], height: 400, axes: 'box', gutter: true, xlabel: 'temperature (°C)', ylabel: 'vapour pressure (hPa)', title: 'saturation vapour pressure', weight: 1.3, minWidth: 300 });
        const sR = v.stage({ x: [-20, 40], y: [5, 9], height: 400, axes: 'box', gutter: true, xlabel: 'temperature (°C)', ylabel: '$d\\ln e_s/dT$ (% per K)', title: 'growth rate per kelvin', weight: 0.8, minWidth: 230 });
        const T0 = 273.16; // triple point
        // numerical Clausius–Clapeyron integral, RK4 in T, from e_s(273.16 K)
        const cc = []; { let e = Math.log(esat(T0)); const f = (T) => Lv(T) / (RV * T * T); const h = 0.25; cc.push([T0, e]); for (let T = T0; T < 330; T += h) { e += h / 6 * (f(T) + 4 * f(T + h / 2) + f(T + h)); cc.push([T + h, e]); } e = Math.log(esat(T0)); const dn = [[T0, e]]; for (let T = T0; T > 245; T -= h) { e -= h / 6 * (f(T) + 4 * f(T - h / 2) + f(T - h)); dn.unshift([T - h, e]); } cc.unshift(...dn.slice(0, -1)); }
        const cc2 = []; { const f = (T) => 2.501e6 / (RV * T * T), h = 0.25; let e = Math.log(esat(T0)); cc2.push([T0, e]); for (let T = T0; T < 330; T += h) { e += h / 6 * (f(T) + 4 * f(T + h / 2) + f(T + h)); cc2.push([T + h, e]); } e = Math.log(esat(T0)); const dn = [[T0, e]]; for (let T = T0; T > 245; T -= h) { e -= h / 6 * (f(T) + 4 * f(T - h / 2) + f(T - h)); dn.unshift([T - h, e]); } cc2.unshift(...dn.slice(0, -1)); }
        const ccConst = (TC) => Math.exp(interp(cc2.map((p) => p[0]), cc2.map((p) => p[1]), TC + 273.15)) / 100;
        const ccE = (TC) => Math.exp(interp(cc.map((p) => p[0]), cc.map((p) => p[1]), TC + 273.15)) / 100;
        const h = sC.handle(25, 20, { color: 'gold', r: 7, label: 'air', labelPos: 'ne', constrain: { x: [-20, 40], y: [0.2, 75] } });
        let info = null;
        v.render(() => {
          const lg = logY.value; sC.setScale({ ylog: lg, y: lg ? [0.5, 100] : [0, 75] });
          sC.fn((T) => esat(T + 273.15) / 100, { color: 'ink', width: 2.6, domain: [-20, 40] });
          sC.fn(ccE, { color: 'green', width: 2, dash: [7, 4], domain: [-20, 40] });
          sC.fn(ccConst, { color: 'red', width: 1.6, dash: [2, 4], domain: [-20, 40] });
          const T = h.x, e = h.y, es = esat(T + 273.15) / 100, RH = e / es;
          // dew point by bisection
          let lo = -60, hi = T; if (e < es) { for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; (esat(m + 273.15) / 100 < e ? lo = m : hi = m); } }
          const Td = e < es ? (lo + hi) / 2 : T;
          sC.hline(e, { color: 'faint', dash: [3, 4] }); sC.vline(T, { color: 'faint', dash: [3, 4] });
          sC.dot(T, es, { r: 4.5, color: 'ink' });
          if (e < es && Td > -20) { sC.dot(Td, e, { r: 6, color: 'blue', hollow: true }); sC.text(`dew point ${v.fix(Td, 1)} °C`, Td, e, { dx: 8, dy: 14, size: 11, color: 'blue' }); }
          if (e > es) sC.text('supersaturated: condenses', -18, lg ? 80 : 70, { size: 12, color: 'red' });
          // growth rate: finite difference of Murphy–Koop vs analytic L/(R_v T²)
          const rate = (TC) => 100 * (Math.log(esat(TC + 273.15 + 0.05)) - Math.log(esat(TC + 273.15 - 0.05))) / 0.1;
          sR.fn(rate, { color: 'ink', width: 2.6, domain: [-20, 40] });
          sR.fn((TC) => 100 * Lv(TC + 273.15) / (RV * (TC + 273.15) ** 2), { color: 'green', width: 2, dash: [7, 4], domain: [-20, 40] });
          sR.vline(T, { color: 'faint', dash: [3, 4] }); sR.dot(T, rate(T), { r: 6, color: 'gold' });
          info = { T, e, es, RH, Td, rate: rate(T), cc: ccE(T), ratio10: esat(T + 283.15) / esat(T + 273.15) };
        });
        v.legend([['ink', 'Murphy–Koop (2005)'], ['green', 'C–C integrated, $L_v(T)$', { dash: true }], ['red', 'C–C integrated, constant $L_v$', { dash: true }], ['gold', 'air state'], ['blue', 'dew point']]);
        v.readout(() => {
          if (!info) return '';
          const { T, e, es, RH, Td, rate, cc, ratio10, } = info;
          return `$T$ = ${sgn(v, T, 1)} °C: $e_s$ = **${v.fix(es, es < 10 ? 2 : 1)} hPa** (C–C integral: ${v.fix(cc, es < 10 ? 2 : 1)} hPa), $e$ = ${v.fix(e, 2)} hPa → relative humidity **${v.fix(RH * 100, 0)} %**, dew point **${sgn(v, Td, 1)} °C**\n$d\\ln e_s/dT$ = **${v.fix(rate, 2)} %/K** (formula $L_v/R_vT^2$: ${v.fix(100 * Lv(T + 273.15) / (RV * (T + 273.15) ** 2), 2)} %/K) · ${v.fix(ratio10, 2)}$\\times$ more vapour is needed to saturate air 10 K warmer`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.6
    {
      num: '1.6', kind: 'Proposition', name: 'Moist adiabatic lapse rate',
      statement: String.raw`A saturated parcel that rises adiabatically condenses vapour and is warmed by the latent heat released, so it cools more slowly than a dry one. For condensate that falls out (the pseudo-adiabatic process) the lapse rate is
$$\Gamma_m \;=\; \frac{g\,\big(1+\dfrac{L_v r_s}{R T}\big)}{c_p+\dfrac{L_v^2\, r_s\,\varepsilon}{R\,T^2}} \;<\;\Gamma_d,$$
with $r_s=\varepsilon e_s/(p-e_s)$ the saturation mixing ratio and $\varepsilon=R/R_v=0.622$. It is $\approx 3$–$4$ K/km near 30 °C at the surface and approaches $\Gamma_d$ for cold, dry air or at low pressure where $r_s\to0$.`,
      idea: String.raw`Combine the first law with latent heat release, $c_p\,dT - RT\,d\ln p = -L_v\,dr_s$, with the Clausius–Clapeyron slope of $r_s(T,p)$ (1.5) and hydrostatic balance (1.1). Because $r_s$ rises steeply with $T$ and falls with $p$, there is more vapour to condense per kelvin of cooling in warm air, so $\Gamma_m$ is smallest in the warm lower tropics, and it grows with height as the air cools. This is why moist adiabats on a skew-T diagram fan out from the dry ones, and why tropical air aloft is so warm.`,
      caption: String.raw`The skew-T diagram shows the temperature at each pressure; the faint orange curves are dry adiabats, the faint green dashed ones moist adiabats. **Drag the two handles** along the 1000 hPa line to start saturated parcels at different temperatures (warm: red; cold: blue): each rises along its **numerically integrated** pseudo-adiabat while the dotted line is the dry adiabat from the same point. The right panel plots $\Gamma_m$ against temperature at 1000, 700 and 500 hPa — from about 3.6 K/km for 30 °C air at the surface up to the dry value for the coldest air.`,
      deps: ['geo-1.2', 'geo-1.5'],
      refs: ['Pierrehumbert'],
      tags: ['moist adiabat', 'latent heat', 'lapse rate'],
      scope: String.raw`Pseudo-adiabatic ascent: all condensate removed instantly, the heat capacity of vapour and liquid neglected; liquid water only (no ice, so below 0 °C the supercooled branch); parcel pressure equals the environment's.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Lapse_rate#Moist_adiabatic_lapse_rate' },
      viz(v) {
        const sk = v.stage(skewStageOpts({ height: 480, title: 'saturated parcels on a skew-T diagram', weight: 1.3, minWidth: 300 }));
        const sg = v.stage({ x: [-30, 40], y: [2, 10.5], height: 480, axes: 'box', gutter: true, xlabel: 'temperature (°C)', ylabel: '$\\Gamma_m$ (K/km)', title: 'moist lapse rate', weight: 0.8, minWidth: 230 });
        const hA = sk.handle(24, 0, { color: 'red', r: 7, label: 'warm', labelPos: 'ne', constrain: { x: [-30, 40], y: [0, 0] } });
        const hB = sk.handle(-8, 0, { color: 'blue', r: 7, label: 'cold', labelPos: 'ne', constrain: { x: [-30, 40], y: [0, 0] } });
        const ps = []; for (let p = 100000; p >= 10000; p -= 1000) ps.push(p);
        let info = null;
        v.render(() => {
          drawSkewBackground(sk, { dry: true, moist: true });
          const res = [];
          for (const [h, col] of [[hA, 'red'], [hB, 'blue']]) {
            const T0 = h.x + 273.15, path = moistPath(T0, ps);
            sk.path(path.map(([T, p]) => [skx(T - 273.15, p / 100), sky(p / 100)]), { color: col, width: 3 });
            sk.path(ps.map((p) => [skx(dryAscend(T0, 100000, p) - 273.15, p / 100), sky(p / 100)]), { color: col, width: 1.5, dash: [2, 4], alpha: 0.9 });
            const at = (pp) => path[Math.round((100000 - pp) / 1000)][0];
            const s0 = satEntropy(T0, 100000), s1 = satEntropy(at(40000), 40000);
            // lapse rate between 1000–950 hPa and 500–450 hPa, from the integrated path and hydrostatic Δz
            const lapse = (pa, pb) => { const Ta = at(pa), Tb = at(pb), Tm = (Ta + Tb) / 2, dz = RD * Tm / G0 * Math.log(pa / pb); return (Ta - Tb) / dz * KM; };
            res.push({ col, T0, T500: at(50000), g0: lapse(100000, 95000), g5: lapse(50000, 45000), gf: gammaMoist(T0, 100000) * KM, dS: (s1 - s0) / s0, tp: at(30000) });
          }
          for (const P of [100000, 70000, 50000]) sg.fn((TC) => gammaMoist(TC + 273.15, P) * KM, { color: P === 100000 ? 'ink' : P === 70000 ? 'purple' : 'teal', width: 2.2, domain: [-30, 40] });
          sg.hline(GAMMA_DRY * KM, { color: 'accent', width: 1.8, dash: [6, 4] });
          sg.text('Γd = 9.76', -29, GAMMA_DRY * KM, { dy: -9, size: 11, color: 'accent' });
          for (const r of res) { sg.dot(r.T0 - 273.15, r.gf, { r: 6, color: r.col }); }
          for (const [P, nm, col] of [[100000, '1000 hPa', 'ink'], [70000, '700', 'purple'], [50000, '500 hPa', 'teal']]) sg.text(nm, 14, gammaMoist(287.15, P) * KM, { dx: 10, dy: -9, align: 'left', size: 11, color: col });
          info = res;
        });
        v.legend([['red', 'warm parcel'], ['blue', 'cold parcel'], ['accent', 'dry adiabat', { dash: true }], ['green', 'moist adiabats', { dash: true }]]);
        v.readout(() => {
          if (!info) return '';
          const f = (r, name) => `**${name}** (${sgn(v, r.T0 - 273.15, 0)} °C at 1000 hPa): $\\Gamma_m$ = ${v.fix(r.g0, 2)} K/km at 1000 hPa (formula ${v.fix(r.gf, 2)}), ${v.fix(r.g5, 2)} K/km at 500 hPa; arrives at 500 hPa at ${sgn(v, r.T500 - 273.15, 1)} °C (dry: ${sgn(v, dryAscend(r.T0, 100000, 50000) - 273.15, 1)} °C); entropy drift ${v.fix(Math.abs(r.dS) * 100, 2)} %`;
          return f(info[0], 'warm') + '\n' + f(info[1], 'cold') + `\n$\\Gamma_d$ = ${v.fix(GAMMA_DRY * KM, 2)} K/km; the formula and the integrated path agree, and both stay below $\\Gamma_d$`;
        });
      },
    },
  ],
};
