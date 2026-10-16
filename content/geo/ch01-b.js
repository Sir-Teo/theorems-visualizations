// Atmosphere & Ocean Dynamics — Chapter 1: Vertical structure (items 1.7–1.11)
import {
  clamp, lerp, G0, RD, CPD, KAPPA, EPS, GAMMA_DRY, R_STD, USSA_LAYERS, ussaT, ussaPClosed, geopot, geom,
  esat, Lv, rsat, theta, tvirt, dryAscend, moistAscend, lcl, thetaE, parcelCape, profile,
  NORMAN_12Z, NORMAN_17Z, TROP_STATIONS, OCEAN, rho0, freezeT, alphaBeta, tMaxDensity, oceanGrid, bruntVaisala2, slabMix, wmoTropopause,
  skx, sky, skewStageOpts, drawSkewBackground,
} from './ch01.shared.js';

const KM = 1000;
const sgn = (v, x, d = 1) => (x < 0 ? '−' : '') + v.fix(Math.abs(x), d);
const interp = (xs, ys, x) => {
  if (x <= xs[0]) return ys[0]; if (x >= xs[xs.length - 1]) return ys[ys.length - 1];
  let lo = 0, hi = xs.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; (xs[m] <= x ? lo = m : hi = m); }
  return ys[lo] + (ys[hi] - ys[lo]) * (x - xs[lo]) / (xs[hi] - xs[lo]);
};
/** Dew point (K) of vapour pressure e (Pa) by bisection on the saturation curve. */
const dewOf = (e) => { let lo = 180, hi = 330; for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; (esat(m) < e ? lo = m : hi = m); } return (lo + hi) / 2; };
const dewFromRH = (T, RH) => dewOf(RH * esat(T));

export default {
  collection: 'geo',
  chapter: 1,
  items: [
    // ------------------------------------------------------------------ 1.7
    {
      num: '1.7', kind: 'Method', name: 'Parcel theory: LCL, CAPE and convective instability',
      statement: String.raw`**Parcel method.** To judge whether a column of air can convect, lift a parcel from the surface (or another level): it rises dry-adiabatically, conserving its potential temperature and mixing ratio, until it saturates at the **lifting condensation level** (LCL); above that it follows a moist adiabat. Compare its virtual temperature $T_{v,p}$ with the environment's $T_{v,e}$ at the same pressure. The level where the parcel first becomes warmer is the **level of free convection** (LFC) and where it becomes colder again the **equilibrium level** (EL); the energy between them,
$$\mathrm{CAPE}=\int_{\rm LFC}^{\rm EL} g\,\frac{T_{v,p}-T_{v,e}}{T_{v,e}}\,dz=\int_{p_{\rm EL}}^{p_{\rm LFC}} R_d\,(T_{v,p}-T_{v,e})\,d\ln p ,$$
is the convective available potential energy (J/kg), the area on a $T$–$\ln p$ diagram; the energy needed below the LFC is the **convective inhibition** (CIN). With no entrainment or drag the strongest updraught is $w_{\max}=\sqrt{2\,\mathrm{CAPE}}$. A layer in which the equivalent potential temperature $\theta_e$ decreases with height is **convectively (potentially) unstable**: lifting it far enough makes it overturn.`,
      idea: String.raw`Each piece is built from earlier ones: the parcel's dry ascent is the adiabat of 1.2 and 1.3, its moist ascent the pseudo-adiabat of 1.6 (with $e_s$ from 1.5), and its buoyancy the quantity whose linearisation gave $N^2$ in 1.4. Integrating the buoyancy force over height is the work it can do, $\tfrac12 w^2$, and since $dz=-RT\,d\ln p/g$ it becomes an area on a diagram with $\ln p$ as the vertical axis. Real updraughts reach roughly half of $\sqrt{2\,\mathrm{CAPE}}$ because of entrainment, precipitation loading and non-hydrostatic pressure forces.`,
      caption: String.raw`A real sounding from Norman, Oklahoma, on 20 May 2013, the day of the Moore tornado (IGRA radiosondes at 12 and 17 UTC). Red: temperature; blue: dew point; black: the parcel. Orange shading is **CAPE** (parcel warmer than its surroundings), blue shading is **CIN**. Choose which air is lifted, then **edit the sounding** with the sliders: warm and moisten the lowest 100 hPa to mimic daytime heating — the cap at 12 UTC melts away and CAPE grows — or warm the mid-troposphere to stabilise it. The middle panel is the buoyancy profile (its area is CAPE); the right panel is $\theta_e$ of the environment, red where it decreases with height (convective instability).`,
      deps: ['geo-1.6', 'geo-1.4'],
      refs: ['Pierrehumbert'],
      tags: ['CAPE', 'LCL', 'convection', 'parcel method'],
      scope: String.raw`Pseudo-adiabatic parcel with virtual-temperature buoyancy, no entrainment, mixing, condensate loading or ice; real updraughts are weaker. CAPE depends on the parcel chosen (surface, mixed-layer or most-unstable).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Convective_available_potential_energy' },
      viz(v) {
        const snd = v.select('sounding', [{ value: 'n17', label: 'Norman 17 UTC' }, { value: 'n12', label: 'Norman 12 UTC' }], 'n17');
        const ptype = v.select('lifted parcel', [{ value: 'sfc', label: 'surface' }, { value: 'ml', label: 'mixed layer (100 hPa)' }, { value: 'mu', label: 'most unstable' }], 'sfc');
        const dT = v.slider('warm the lowest 100 hPa (K)', -8, 8, 0, { step: 0.5 });
        const dTd = v.slider('change dew point there (K)', -12, 4, 0, { step: 0.5 });
        const dMid = v.slider('warm the air above 650 hPa (K)', -6, 6, 0, { step: 0.5 });
        const sk = v.stage(skewStageOpts({ height: 500, title: 'skew-T / log p', weight: 1.4, minWidth: 320 }));
        const sb = v.stage({ x: [-6, 10], y: [0, 16], height: 500, axes: 'box', gutter: true, xlabel: 'buoyancy $T_{v,p}-T_{v,e}$ (K)', ylabel: 'height (km)', title: 'buoyancy: area = CAPE', weight: 0.7, minWidth: 230 });
        const se = v.stage({ x: [320, 370], y: [0, 10], height: 500, axes: 'box', gutter: true, xlabel: '$\\theta_e$ (K)', ylabel: 'height (km)', title: 'environment $\\theta_e$', weight: 0.7, minWidth: 230 });
        let info = null;
        v.render(() => {
          const base = snd.value === 'n17' ? NORMAN_17Z : NORMAN_12Z, ps = base[0][0];
          const rows = base.map(([p, z, T, Td]) => {
            const w1 = clamp((p - (ps - 200)) / 100, 0, 1), w2 = clamp((650 - p) / 150, 0, 1);
            const T2 = T + dT.value * w1 + dMid.value * w2;
            const Td2 = Td == null ? null : Math.min(Td + dTd.value * w1, T2);
            return [p, z, T2, Td2];
          });
          const env = profile(rows);
          // parcel choice
          const sfc = { T: rows[0][2] + 273.15, Td: rows[0][3] + 273.15, p: rows[0][0] };
          let par = sfc;
          if (ptype.value === 'ml') {
            let st = 0, sr = 0, n = 0;
            for (let p = ps; p >= ps - 100; p -= 5) { const T = env.T(p), Td = Math.min(env.Td(p), T); st += theta(T, p); sr += rsat(Td, p * 100); n++; }
            const th = st / n, r = sr / n, T0 = th * (ps / 1000) ** KAPPA, e = r * ps * 100 / (EPS + r);
            par = { T: T0, Td: Math.min(dewOf(e), T0), p: ps };
          } else if (ptype.value === 'mu') {
            let best = -1;
            for (const row of rows) if (row[0] >= ps - 300 && row[3] != null) { const te = thetaE(row[2] + 273.15, row[3] + 273.15, row[0]); if (te > best) { best = te; par = { T: row[2] + 273.15, Td: row[3] + 273.15, p: row[0] }; } }
          }
          const R = parcelCape(env, par.T, par.Td, par.p);
          drawSkewBackground(sk, { moist: true });
          const g = R.grid;
          // shading in virtual temperature
          const seg = (cond, col) => { let up = [], dn = []; const fl = () => { if (up.length > 1) sk.poly([...up, ...dn.reverse()], { fill: col, fillAlpha: 0.38, stroke: false }); up = []; dn = []; };
            g.p.forEach((p, i) => { if (cond(i)) { up.push([skx(g.Tvp[i] - 273.15, p), sky(p)]); dn.push([skx(g.Tve[i] - 273.15, p), sky(p)]); } else fl(); }); fl(); };
          const lfc = R.lfc ?? -1, el = R.el ?? -1;
          seg((i) => R.lfc != null && g.p[i] <= lfc + 1e-9 && g.p[i] >= el - 1e-9 && g.B[i] > 0, 'orange');
          seg((i) => g.B[i] < 0 && (R.lfc == null || g.p[i] >= lfc) && g.p[i] >= R.pL - 400, 'blue');
          sk.path(env.rows.map((r) => [skx(r[2], r[0]), sky(r[0])]), { color: 'red', width: 2.6 });
          sk.path(g.p.map((p, i) => [skx(g.Tve[i] - 273.15, p), sky(p)]), { color: 'red', width: 1.3, dash: [2, 3] });
          sk.path(env.rows.filter((r) => r[3] != null).map((r) => [skx(r[3], r[0]), sky(r[0])]), { color: 'blue', width: 2, dash: [6, 4] });
          sk.path(g.p.map((p, i) => [skx(g.Tvp[i] - 273.15, p), sky(p)]), { color: 'ink', width: 2.4 });
          sk.dot(skx(par.T - 273.15, par.p), sky(par.p), { r: 5, color: 'ink' });
          const mark = (p, label, dx) => { if (p == null) return; const T = g.Tve[Math.round(par.p - p)] - 273.15; sk.dot(skx(T, p), sky(p), { r: 5, color: 'gold' }); sk.text(`${label} ${v.fix(p, 0)}`, skx(T, p), sky(p), { dx: dx, dy: -10, size: 11, color: 'ink', plate: true, align: dx > 0 ? 'left' : 'right' }); };
          const iL = clamp(Math.round(par.p - R.pL), 0, g.p.length - 1), xL = skx(g.Tvp[iL] - 273.15, g.p[iL]); sk.dot(xL, sky(g.p[iL]), { r: 5, color: 'gold' }); sk.text(`LCL ${v.fix(R.pL, 0)} hPa`, xL, sky(g.p[iL]), { dx: -10, dy: 14, size: 11, color: 'ink', plate: true, align: 'right' });
          if (R.lfc != null && Math.abs(R.lfc - R.pL) > 8) mark(R.lfc, 'LFC', 12);
          if (R.el != null && R.cape > 0) mark(R.el, 'EL', 12);
          // buoyancy panel
          const zk = (p) => env.z(p) / KM, pts = []; for (let i = 0; i < g.p.length; i += 4) pts.push([g.Tvp[i] - g.Tve[i], zk(g.p[i])]);
          const zTop = Math.ceil(zk(g.p[g.p.length - 1]) / 2) * 2, bMax = Math.max(3, ...pts.map((q) => q[0])) + 1, bMin = Math.min(-3, ...pts.map((q) => q[0])) - 1;
          sb.setView([bMin, bMax], [0, zTop]);
          for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i]; const c = (a[0] + b[0]) / 2 >= 0 ? 'orange' : 'blue'; sb.poly([[0, a[1]], a, b, [0, b[1]]], { fill: c, fillAlpha: 0.35, stroke: false }); }
          sb.path(pts, { color: 'ink', width: 2.2 }); sb.vline(0, { color: 'muted' });
          for (const [p, nm] of [[R.pL, 'LCL'], [R.lfc, 'LFC'], [R.el, 'EL']]) if (p != null) { sb.hline(zk(p), { color: 'faint', dash: [3, 4] }); sb.text(nm, bMax - 0.2, zk(p), { align: 'right', dy: -8, size: 11, color: 'muted' }); }
          // environment θe
          const eth = rows.filter((r) => r[3] != null && r[0] >= 300).map((r) => [thetaE(r[2] + 273.15, r[3] + 273.15, r[0]), r[1] / KM]);
          const lo = Math.floor(Math.min(...eth.map((q) => q[0])) / 5) * 5 - 5, hi = Math.ceil(Math.max(...eth.map((q) => q[0])) / 5) * 5 + 5;
          se.setView([lo, hi], [0, Math.ceil(eth[eth.length - 1][1])]);
          for (let i = 1; i < eth.length; i++) se.line(eth[i - 1][0], eth[i - 1][1], eth[i][0], eth[i][1], { color: eth[i][0] < eth[i - 1][0] ? 'red' : 'accent', width: eth[i][0] < eth[i - 1][0] ? 4 : 2.4 });
          const thP = thetaE(par.T, par.Td, par.p); se.vline(thP, { color: 'ink', dash: [5, 4] }); se.text(`parcel ${v.fix(thP, 0)} K`, thP, eth[eth.length - 1][1] * 0.97, { dx: -6, size: 11, align: 'right', color: 'ink' });
          let unst = 0; for (let i = 1; i < eth.length; i++) if (eth[i][0] < eth[i - 1][0]) unst += eth[i][1] - eth[i - 1][1];
          info = { R, par, thP, unst, z: (p) => env.z(p) };
        });
        v.legend([['red', 'temperature (dotted: virtual)'], ['blue', 'dew point', { dash: true }], ['ink', 'lifted parcel (virtual $T$)'], ['orange', 'CAPE', { area: true }], ['blue', 'CIN', { area: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { R, par, thP, unst, z } = info;
          return `parcel from ${v.fix(par.p, 0)} hPa: ${sgn(v, par.T - 273.15, 1)} °C, dew point ${sgn(v, par.Td - 273.15, 1)} °C → LCL **${v.fix(R.pL, 0)} hPa** (${v.fix(z(R.pL) / KM, 2)} km, ${sgn(v, R.TL - 273.15, 1)} °C)${R.lfc != null ? `, LFC ${v.fix(R.lfc, 0)} hPa (${v.fix(z(R.lfc) / KM, 1)} km), EL ${v.fix(R.el, 0)} hPa (${v.fix(z(R.el) / KM, 1)} km)` : ', no level of free convection: the parcel never becomes buoyant'}\n**CAPE = ${v.fix(R.cape, 0)} J/kg**, CIN = ${v.fix(R.cin, 0)} J/kg → $w_{\\max}=\\sqrt{2\\,\\mathrm{CAPE}}$ = **${v.fix(R.wmax, 0)} m/s** (real updraughts: about half) · parcel $\\theta_e$ = ${v.fix(thP, 1)} K; ${unst > 0.05 ? `environment is convectively unstable over ${v.fix(unst, 1)} km of the lowest 9 km ($\\theta_e$ decreasing upward)` : 'no layer with $\\theta_e$ decreasing upward below 300 hPa'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.8
    {
      num: '1.8', kind: 'Phenomenon', name: 'Föhn winds',
      statement: String.raw`When moist air is forced over a mountain range, it cools at the dry rate $\Gamma_d$ until it reaches its LCL, then at the smaller moist rate $\Gamma_m$ while it condenses and rains out on the windward side. On descending the lee slope the now drier air warms at the full dry rate $\Gamma_d$ without further evaporative cooling, so it reaches the valley floor **warmer and drier** than the air that started at the same level on the windward side. The warming equals the latent heat released by the precipitation divided by $c_p$, $\Delta T\simeq (L_v/c_p)\,\Delta r$. These warm, dry downslope winds are the **Föhn** of the Alps, the **Chinook** of the Rockies and similar winds elsewhere.`,
      idea: String.raw`The asymmetry comes from the irreversibility of rain: a parcel that kept its condensate would re-evaporate it on the way down, follow the same moist adiabat backwards, and return to its starting temperature (the "reversible" curve in the figure). Precipitation removes the water (and the cooling it would have caused on re-evaporation) and leaves the lee air with only $r_c = r_s(T_{\rm crest},p_{\rm crest})$ of vapour. Each of the steps is an earlier result: dry ascent and descent (1.2), the moist adiabat (1.6) and the LCL (1.7).`,
      caption: String.raw`A parcel of air is carried over a ridge in the standard atmosphere's pressure–height relation (the animation, with the terrain-following parcel in gold; the cloud forms above the LCL). Set the **starting temperature and humidity** and the **ridge height**. The right panel plots temperature against height on the way up (blue) and down (red); the dotted line is what would happen if the water stayed in the parcel. Switch **precipitation** off to see the warming vanish. The readout checks the lee-side warming against $L_v\Delta r/c_p$ from the water that fell out.`,
      deps: ['geo-1.6'],
      refs: ['Pierrehumbert'],
      tags: ['Föhn', 'Chinook', 'orography', 'latent heat'],
      scope: String.raw`Idealised: a single parcel following terrain on a smooth Gaussian ridge in a standard-atmosphere pressure–height relation, pseudo-adiabatic with complete rain-out (the ridge height and parcel values are illustrative, not a particular event); real föhn also involves air descending from aloft and mixing.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/F%C3%B6hn_wind' },
      viz(v) {
        const T0s = v.slider('windward temperature at sea level (°C)', 0, 30, 14, { step: 0.5 });
        const RHs = v.slider('relative humidity (%)', 30, 100, 85, { step: 1 });
        const Hs = v.slider('ridge height (km)', 0.5, 4.5, 2.6, { step: 0.1 });
        const rain = v.toggle('precipitation falls out', true);
        const W = 200, X0 = 100, SIG = 30;
        const sx = v.stage({ x: [0, W], y: [0, 5.2], height: 390, axes: 'box', gutter: true, xlabel: 'distance (km)', ylabel: 'height (km)', title: 'air crossing a mountain range', weight: 1.4, minWidth: 320 });
        const sT = v.stage({ x: [-25, 35], y: [0, 5.2], height: 390, axes: 'box', gutter: true, xlabel: 'temperature (°C)', ylabel: 'height (km)', title: 'temperature of the air along its path', weight: 0.8, minWidth: 240 });
        let M = null;
        const build = () => {
          const T0 = T0s.value + 273.15, p0 = 101325, H = Hs.value, N = 160;
          const Td0 = dewFromRH(T0, RHs.value / 100), L = lcl(T0, Td0, p0);
          const terrain = (x) => H * Math.exp(-(((x - X0) / SIG) ** 2));
          const P = (z) => ussaPClosed(geopot(z * KM));
          const Pc = P(H);
          const up = (p) => (p >= L.p ? dryAscend(T0, p0, p) : moistAscend(L.T, L.p, p, 500));
          const Tc = up(Pc), rc = rsat(Tc, Pc), r0 = rsat(Td0, p0);
          const pts = [];
          for (let i = 0; i <= N; i++) {
            const x = W * i / N, z = terrain(x), p = P(z); let T;
            if (x <= X0) T = up(p); else T = rain.value ? Tc * (p / Pc) ** KAPPA : up(p);
            pts.push({ x, z, p, T });
          }
          let lo = 0, hi = 12; for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; (P(m) > L.p ? lo = m : hi = m); }
          const zL = (lo + hi) / 2;
          const Tlee = pts[N].T, RHlee = rain.value ? rc / rsat(Tlee, pts[N].p) : rsat(Td0, p0) / rsat(Tlee, pts[N].p);
          return { T0, Td0, L, zL, pts, terrain, Tc, rc, r0, Tlee, RHlee, H, Pc, P, up };
        };
        let info = null;
        v.animate((t) => {
          M = build();
          const { pts, terrain, zL, H } = M, N = pts.length - 1;
          // terrain
          const ter = pts.map((q) => [q.x, q.z]);
          sx.poly([[0, 0], ...ter, [W, 0]], { fill: 'muted', fillAlpha: 0.35, color: 'muted', width: 1.5 });
          // cloud above the LCL on the windward slope (and down the lee side if the water is kept)
          if (H > zL) {
            const xw = X0 - SIG * Math.sqrt(-Math.log(zL / H)), xl = rain.value ? X0 + 12 : 2 * X0 - xw;
            const top = []; const bot = [];
            for (let x = xw; x <= xl + 1e-9; x += (xl - xw) / 40) { const z = Math.max(terrain(x), zL); top.push([x, z + 0.35 + 0.25 * Math.sin(Math.PI * (x - xw) / (xl - xw))]); bot.push([x, z]); }
            sx.poly([...bot, ...top.reverse()], { fill: 'accent', fillAlpha: 0.22, stroke: false });
            if (rain.value) for (let x = xw + 4; x < X0 + 4; x += 5) { const z = terrain(x); if (z > 0.1) sx.line(x, z + 0.3, x - 1.2, Math.max(z + 0.03, 0.03), { color: 'blue', width: 1.6, alpha: 0.8 }); }
          }
          sx.hline(zL, { color: 'accent', dash: [4, 5], alpha: 0.5 }); sx.text(`LCL ${v.fix(zL, 2)} km`, W - 3, zL, { dy: -9, size: 11, color: 'accent', align: 'right' });
          // path coloured: windward blue, lee red
          sx.path(pts.filter((q) => q.x <= X0).map((q) => [q.x, q.z + 0.03]), { color: 'blue', width: 3 });
          sx.path(pts.filter((q) => q.x >= X0).map((q) => [q.x, q.z + 0.03]), { color: 'red', width: 3 });
          const s = clamp((t % 10) / 10, 0, 1) * N, i = Math.min(N - 1, Math.floor(s)), f = s - i, q = { x: lerp(pts[i].x, pts[i + 1].x, f), z: lerp(pts[i].z, pts[i + 1].z, f), T: lerp(pts[i].T, pts[i + 1].T, f) };
          sx.dot(q.x, q.z + 0.03, { r: 8, color: 'gold' });
          sx.text(`${sgn(v, q.T - 273.15, 1)} °C`, q.x, q.z + 0.03, { dy: -18, size: 13, color: 'ink', plate: true });
          sx.text(`windward: ${sgn(v, M.T0 - 273.15, 1)} °C`, 3, 4.9, { size: 12, color: 'blue', align: 'left' });
          sx.text(`lee: ${sgn(v, M.Tlee - 273.15, 1)} °C`, W - 3, 4.9, { size: 12, color: 'red', align: 'right' });
          // temperature–height panel
          sT.path(pts.filter((p) => p.x <= X0).map((p) => [p.T - 273.15, p.z]), { color: 'blue', width: 2.8 });
          sT.path(pts.filter((p) => p.x >= X0).map((p) => [p.T - 273.15, p.z]), { color: 'red', width: 2.8 });
          if (rain.value) { const rev = pts.filter((p) => p.x >= X0).map((p) => [M.up(p.p) - 273.15, p.z]); sT.path(rev, { color: 'muted', width: 1.8, dash: [2, 4] }); }
          sT.dot(M.T0 - 273.15, 0, { r: 5, color: 'blue' }); sT.dot(M.Tlee - 273.15, 0, { r: 5, color: 'red' });
          if (M.Tlee - M.T0 > 0.05) sT.arrow(M.T0 - 273.15, 0.12, M.Tlee - 273.15, 0.12, { color: 'orange', width: 2.4 });
          sT.dot(q.T - 273.15, q.z, { r: 7, color: 'gold' });
          const dr = (M.r0 - M.rc) * 1000;
          info = { dT: M.Tlee - M.T0, Tc: M.Tc, dr, est: Lv(280) / CPD * (M.r0 - M.rc), rc: M.rc };
        }, { period: 10, still: 8.6 });
        v.legend([['blue', 'windward ascent'], ['red', 'lee descent'], ['muted', 'if condensate stayed in the parcel', { dash: true }], ['orange', 'net warming'], ['gold', 'parcel']]);
        v.readout(() => {
          if (!M || !info) return '';
          const { dT, Tc, dr, est } = info;
          return `starts ${sgn(v, M.T0 - 273.15, 1)} °C, dew point ${sgn(v, M.Td0 - 273.15, 1)} °C at sea level → LCL **${v.fix(M.zL, 2)} km**; crest (${v.fix(M.H, 1)} km, ${v.fix(M.Pc / 100, 0)} hPa) ${sgn(v, Tc - 273.15, 1)} °C\nlee side at sea level: **${sgn(v, M.Tlee - 273.15, 1)} °C** (${dT >= 0 ? '+' : '−'}${v.fix(Math.abs(dT), 1)} K), relative humidity **${v.fix(M.RHlee * 100, 0)} %** (windward ${v.fix(RHs.value, 0)} %)\n` + (rain.value ? `water removed ${v.fix(dr, 1)} g/kg → $L_v\\Delta r/c_p$ = ${v.fix(est, 1)} K, compared with the actual warming ${v.fix(dT, 1)} K` : 'the condensate stays in the parcel, evaporates again on descent, and the air returns to its starting temperature');
        });
      },
    },
    // ------------------------------------------------------------------ 1.9
    {
      num: '1.9', kind: 'Model', name: 'Seawater equation of state',
      statement: String.raw`The density of seawater, $\rho(S,T,p)$, depends on salinity $S$, temperature $T$ and pressure $p$ through an empirical **equation of state** (EOS-80/TEOS-10), close to $\rho\approx\rho_0\,[1-\alpha(T-T_0)+\beta(S-S_0)]$ locally but with coefficients that vary:
$$\alpha=-\frac1\rho\frac{\partial\rho}{\partial T}\ \text{(thermal expansion)},\qquad \beta=\frac1\rho\frac{\partial\rho}{\partial S}\ \text{(haline contraction)}.$$
$\alpha$ is small in cold water (about $5\times10^{-5}\,\mathrm{K^{-1}}$ near 0 °C, $3\times10^{-4}$ at 30 °C), so salinity dominates the density of polar water. Because $\rho(S,T)$ is **nonlinear**, the isopycnals (curves of constant density) are curved in the $(S,T)$ plane and mixing two water masses of equal density produces water that is *denser* than either (**cabbeling**). Fresh water has its density maximum at 3.98 °C; for $S>24.7$ the freezing point lies above the temperature of maximum density, so seawater keeps getting denser as it cools to freezing.`,
      idea: String.raw`The state function $\rho(S,T)$ is fitted to laboratory measurements (Millero & Poisson 1981; UNESCO 1983) because no simple theory captures hydrogen bonding in liquid water. The curvature $\partial^2\rho/\partial T^2$ is large at low temperature (where $\alpha$ grows rapidly with $T$), so a straight line in the $(S,T)$ plane — what turbulent mixing produces — lies under the curved isopycnal and ends up on its dense side. The figure evaluates the full UNESCO one-atmosphere formula (reproducing its published check values) and differentiates it numerically for $\alpha$ and $\beta$; the density's pressure dependence adds compressibility, which matters for the deep ocean (1.10).`,
      caption: String.raw`The colour map shows density $\sigma=\rho-1000$ kg/m³ at surface pressure over salinity and temperature, with contours every 1 kg/m³ (heavy at 0, 10, 20, 25, 28 and 30; dark purple is light, yellow dense water); the red dashed line is the freezing point, the teal dashed line the temperature of maximum density (it ends where it meets freezing at $S=24.7$). **Drag the two water masses A and B.** The straight line joining them is what mixing produces; the middle panel plots the density along it against the straight line between their densities — the shaded gap is the extra density from **cabbeling**. Press **isopycnal** to move B to the same density as A, which maximises the effect. The right panel shows $\alpha(T)$ for three salinities.`,
      deps: [],
      refs: ['Vallis'],
      tags: ['equation of state', 'density', 'cabbeling'],
      credit: 'Millero & Poisson, 1981; UNESCO (Fofonoff & Millard), 1983',
      scope: String.raw`One-atmosphere density from the EOS-80 polynomial (practical salinity, ITS-90 temperature), $0\le S\le 42$ and $-2\le T\le 40$ °C; at depth, pressure raises density by about 4.5 kg/m³ per 1000 m and changes $\alpha$.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Seawater#Density' },
      viz(v) {
        const SR = [0, 40], TR = [-2, 32];
        const sm = v.stage({ x: SR, y: TR, height: 430, axes: 'box', gutter: true, xlabel: 'salinity $S$ (psu)', ylabel: 'temperature (°C)', title: 'density $\\sigma = \\rho - 1000$ (kg/m³) and two water masses', weight: 1.5, minWidth: 300 });
        const sx = v.stage({ x: [0, 1], y: [0, 1], height: 430, axes: 'box', gutter: true, xlabel: 'fraction of B in the mixture', ylabel: 'density excess (kg/m³)', title: 'density along the mixing line', weight: 0.85, minWidth: 190 });
        const sa = v.stage({ x: [-2, 32], y: [-0.6, 3.6], height: 430, axes: 'box', gutter: true, xlabel: 'temperature (°C)', ylabel: '$\\alpha$ ($10^{-4}$ K$^{-1}$)', title: 'thermal expansion', weight: 0.85, minWidth: 190 });
        const hA = sm.handle(34.5, 2, { color: 'blue', r: 8, label: 'A', labelPos: 'ne', constrain: { x: [0.5, 39], y: [-1.5, 31] } });
        const hB = sm.handle(36.5, 12.9, { color: 'red', r: 8, label: 'B', labelPos: 'ne', constrain: { x: [0.5, 39], y: [-1.5, 31] } });
        const solveT = (S, rho) => { let lo = -2.5, hi = 34; if (rho0(S, lo) < rho || rho0(S, hi) > rho) return null; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; (rho0(S, m) > rho ? lo = m : hi = m); } return (lo + hi) / 2; };
        hB.set(36.5, solveT(36.5, rho0(34.5, 2)));
        v.button('B: same density as A', () => { const T = solveT(hB.x, rho0(hA.x, hA.y)); if (T != null) hB.set(hB.x, T); });
        const frz = [], tmd = []; for (let S = 0; S <= 40; S += 0.5) frz.push([S, freezeT(S)]); for (let S = 0; S <= 24.7; S += 0.5) tmd.push([S, tMaxDensity(S)]);
        let info = null;
        v.render(() => {
          sm.heat((S, T) => rho0(S, T) - 1000, { range: [-5, 32], cmap: 'viridis', res: 3, key: 'sigma' });
          sm.contour((S, T) => rho0(S, T) - 1000, Array.from({ length: 38 }, (_, i) => i - 5), { color: 'ink', width: 0.7, alpha: 0.4, res: 100 });
          sm.contour((S, T) => rho0(S, T) - 1000, [0, 10, 20, 25, 28, 30], { color: 'ink', width: 1.3, alpha: 0.85, res: 100 });
          sm.path(frz, { color: 'red', width: 2.2, dash: [7, 4] }); sm.path(tmd, { color: 'teal', width: 2.4, dash: [7, 4] });
          sm.text('freezing', 36, freezeT(36), { dy: 12, size: 11, color: 'red', plate: true }); sm.text('max density', 8, tMaxDensity(8), { dy: -10, size: 11, color: 'teal', plate: true });
          const A = { S: hA.x, T: hA.y }, B = { S: hB.x, T: hB.y }, rA = rho0(A.S, A.T), rB = rho0(B.S, B.T);
          sm.line(A.S, A.T, B.S, B.T, { color: 'gold', width: 3 });
          const mid = { S: (A.S + B.S) / 2, T: (A.T + B.T) / 2 }; sm.dot(mid.S, mid.T, { r: 5, color: 'gold' });
          // mixing line density
          const f = (x) => rho0(A.S + (B.S - A.S) * x, A.T + (B.T - A.T) * x), lin = (x) => rA + (rB - rA) * x;
          const ex = (r) => r - 1000;
          const ys = []; for (let i = 0; i <= 40; i++) ys.push(f(i / 40));
          const lo = Math.min(rA, rB, ...ys), hi = Math.max(rA, rB, ...ys), pad = Math.max(0.03, (hi - lo) * 0.25);
          sx.setView([0, 1], [ex(lo) - pad, ex(hi) + pad]);
          const poly = []; for (let i = 0; i <= 40; i++) poly.push([i / 40, ex(f(i / 40))]); for (let i = 40; i >= 0; i--) poly.push([i / 40, ex(lin(i / 40))]);
          sx.poly(poly, { fill: 'orange', fillAlpha: 0.35, stroke: false });
          sx.fn((x) => ex(f(x)), { color: 'ink', width: 2.6, domain: [0, 1] }); sx.fn((x) => ex(lin(x)), { color: 'muted', width: 1.8, dash: [6, 4], domain: [0, 1] });
          sx.dot(0, ex(rA), { r: 6, color: 'blue' }); sx.dot(1, ex(rB), { r: 6, color: 'red' });
          let best = 0, bx = 0; for (let i = 0; i <= 100; i++) { const d = f(i / 100) - lin(i / 100); if (d > best) { best = d; bx = i / 100; } }
          if (best > 1e-4) { sx.vline(bx, { color: 'orange', dash: [3, 4] }); sx.text(`+${v.fix(best, 3)}`, bx, ex(f(bx)), { dx: 8, dy: -12, size: 12, color: 'orange', align: 'left', plate: true }); }
          // alpha(T)
          for (const [S, col] of [[0, 'teal'], [10, 'purple'], [35, 'ink']]) {
            const lo = Math.max(-2, freezeT(S)); sa.fn((T) => alphaBeta(S, T).alpha * 1e4, { color: col, width: 2.2, domain: [lo, 32] });
          }
          sa.hline(0, { color: 'muted' });
          const aA = alphaBeta(A.S, A.T), aB = alphaBeta(B.S, B.T);
          sa.dot(A.T, aA.alpha * 1e4, { r: 6, color: 'blue' }); sa.dot(B.T, aB.alpha * 1e4, { r: 6, color: 'red' });
          info = { A, B, rA, rB, aA, aB, best, bx, rm: f(0.5), tA: tMaxDensity(A.S), fA: freezeT(A.S) };
        });
        v.legend([['blue', 'water mass A'], ['red', 'water mass B'], ['gold', 'mixing line'], ['orange', 'extra density (cabbeling)', { area: true }], ['teal', '$\\alpha$ at $S$ = 0'], ['purple', '$S$ = 10'], ['ink', '$S$ = 35']]);
        v.readout(() => {
          if (!info) return '';
          const { A, B, rA, rB, aA, aB, best, bx } = info;
          return `A: $S$ = ${v.fix(A.S, 2)}, ${sgn(v, A.T, 1)} °C → $\\rho$ = **${v.fix(rA, 3)}** kg/m³, $\\alpha$ = ${v.fix(aA.alpha * 1e4, 2)}×10⁻⁴ K⁻¹, $\\beta$ = ${v.fix(aA.beta * 1e4, 2)}×10⁻⁴ psu⁻¹ · B: $S$ = ${v.fix(B.S, 2)}, ${sgn(v, B.T, 1)} °C → $\\rho$ = **${v.fix(rB, 3)}** kg/m³, $\\alpha$ = ${v.fix(aB.alpha * 1e4, 2)}×10⁻⁴ K⁻¹\nmixing A and B in equal parts gives $\\rho$ = ${v.fix(info.rm, 3)} kg/m³, i.e. ${v.fix(info.rm - (rA + rB) / 2, 3)} kg/m³ **above** the mean of the two densities; the largest excess along the line is **${v.fix(best, 3)} kg/m³** at ${v.fix(bx * 100, 0)} % B (an equal-temperature warming of the whole line would need $\\Delta T\\approx$ ${v.fix(best / (rA * 1e-4 * 2.5), 1)} K to match, with $\\alpha\\approx 2.5\\times10^{-4}$)`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.10
    {
      num: '1.10', kind: 'Phenomenon', name: 'Ocean stratification and the thermocline',
      statement: String.raw`Away from the polar seas the ocean is stably stratified: a warm, nearly uniform **mixed layer** tens of metres thick, stirred by wind and cooling, lies over a **thermocline** (pycnocline) where temperature falls and density rises sharply with depth, which in turn lies over a cold, slowly varying abyss. The stratification is measured by the buoyancy frequency
$$N^2=-\frac{g}{\rho}\frac{\partial\rho}{\partial z}=\frac{g}{\rho}\frac{\partial\rho}{\partial(\text{depth})},$$
which peaks in the thermocline, typically at a few to ten cycles per hour ($N\sim 0.005$–$0.02\ \mathrm{s^{-1}}$), at least ten times larger than in the abyss. Stronger winds deepen the mixed layer by entraining thermocline water, and stirring costs potential energy: the work of the wind sets how deep it can mix.`,
      idea: String.raw`Density comes from temperature and salinity through the equation of state of 1.9, and $N^2$ is then the stability formula of 1.4 applied to the density profile. In the thermocline the temperature drops by 10 K or more in a few hundred metres, so $N^2$ is large; in the mixed layer it is nearly zero. The mixed-layer panel uses a bulk (Kraus–Turner-type) energy argument: mixing the top $h$ metres to uniform temperature and salinity raises the potential energy of the water column by $\Delta PE(h)=g\,[\int_0^h\rho\,z\,dz-\bar\rho h^2/2]$, and the layer deepens until $\Delta PE$ equals the wind's turbulent energy input $m\rho_0u_*^3\,t$.`,
      caption: String.raw`Annual-mean temperature and salinity profiles from the World Ocean Atlas 2018 at three places (the Sargasso Sea, the equatorial Pacific and the subpolar North Pacific). The panels show the temperature, the density $\sigma=\rho-1000$ (computed from the UNESCO equation of state of 1.9) and the buoyancy frequency $N$ in cycles per hour; the grey curves are the unperturbed profile. **Raise the wind** (and its duration) to stir the upper ocean in a slab-mixing model (illustrative, with order-one entrainment efficiency): temperature and salinity are made uniform down to the depth where the wind's energy runs out, and watch the thermocline sharpen at the base of the new mixed layer. Annual means smooth the seasonal cycle, so real profiles have thinner mixed layers and sharper thermoclines.`,
      deps: ['geo-1.9', 'geo-1.4'],
      refs: ['Vallis'],
      tags: ['thermocline', 'stratification', 'ocean'],
      scope: String.raw`$N^2$ is computed from density at surface reference pressure of the in-situ temperature, accurate to roughly 10 % in the upper kilometre and only qualitative below (compressibility and the potential-temperature correction are neglected); the mixing model is a bulk estimate with an assumed efficiency $m=1$, drag coefficient $1.3\times10^{-3}$ and no heating, not a forecast.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Thermocline' },
      viz(v) {
        const loc = v.select('location', [{ value: 'sargasso', label: 'Sargasso Sea' }, { value: 'equator', label: 'equatorial Pacific' }, { value: 'papa', label: 'subpolar N. Pacific' }], 'sargasso');
        const rng = v.select('depth range', [{ value: 300, label: 'upper 300 m' }, { value: 1000, label: 'upper 1 km' }, { value: 2000, label: 'to 2 km' }], 1000);
        const U10 = v.slider('wind speed $U_{10}$ (m/s)', 0, 30, 14, { step: 0.5 });
        const days = v.slider('duration (days)', 0.5, 20, 5, { step: 0.5 });
        const mk = (xl, title, w = 1) => v.stage({ x: [0, 1], y: [-1000, 0], height: 440, axes: 'box', gutter: true, xlabel: xl, ylabel: 'depth (m)', title, weight: w, minWidth: 210 });
        const sT = mk('temperature (°C)', 'temperature'), sR = mk('density $\\sigma$ (kg/m³)', 'density'), sN = mk('$N$ (cycles per hour)', 'buoyancy frequency');
        const cache = {}; for (const k of Object.keys(OCEAN)) { const G = oceanGrid(OCEAN[k], 5, 2000); cache[k] = { G, ...bruntVaisala2(G) }; }
        let info = null;
        v.render(() => {
          const zmax = +rng.value, C = cache[loc.value], P = OCEAN[loc.value];
          const n = Math.round(zmax / 5) + 1;
          // wind mixing depth by energy balance
          const ustar = Math.sqrt(1.22 * 1.3e-3 / 1025) * U10.value, E = 1025 * ustar ** 3 * days.value * 86400;
          let h = 0, I = 0, Mm = 0, dz = 5, kk = 0, used = 0;
          for (let i = 1; i < C.G.z.length && E > 0; i++) {
            I += 0.5 * (C.rho[i - 1] * C.G.z[i - 1] + C.rho[i] * C.G.z[i]) * dz; Mm += 0.5 * (C.rho[i - 1] + C.rho[i]) * dz;
            const hh = C.G.z[i], pe = G_(I, Mm, hh); if (pe > E) break; h = hh; used = pe; kk = i;
          }
          function G_(I, Mm, hh) { return G0 * (I - (Mm / hh) * hh * hh / 2); }
          const Gm = h >= 10 ? slabMix(C.G, h) : C.G, D = h >= 10 ? bruntVaisala2(Gm) : { rho: C.rho, N2: C.N2 };
          const tick = zmax <= 300 ? 50 : zmax <= 1000 ? 200 : 500, yt = []; for (let z = 0; z <= zmax; z += tick) yt.push([-z, String(z)]);
          const Nc = (N2) => Math.sqrt(Math.max(N2, 0)) * 3600 / (2 * Math.PI);
          const idx = Array.from({ length: n }, (_, i) => i);
          const lim = (arr, pad) => { const a = Math.min(...arr), b = Math.max(...arr); return [a - pad * (b - a || 1), b + pad * (b - a || 1)]; };
          for (const [s, o, m, key] of [[sT, C.G.T, Gm.T, 'T'], [sR, C.rho.map((r) => r - 1000), D.rho.map((r) => r - 1000), 'R'], [sN, C.N2.map(Nc), D.N2.map(Nc), 'N']]) {
            const a = o.slice(0, n), b = m.slice(0, n), [lo, hi] = key === 'N' ? [0, Math.max(...a, ...b) * 1.1 + 0.5] : lim([...a, ...b], 0.06);
            s.setView([lo, hi], [-zmax, 0]); s.setTicks(null, yt);
            s.path(idx.map((i) => [a[i], -C.G.z[i]]), { color: 'muted', width: 2, alpha: 0.9 });
            s.path(idx.map((i) => [b[i], -C.G.z[i]]), { color: key === 'T' ? 'red' : key === 'R' ? 'accent' : 'teal', width: 2.8 });
            if (h >= 10 && h <= zmax) s.hline(-h, { color: 'gold', dash: [5, 4], width: 1.6 });
          }
          let mi = 0; for (let i = 0; i < Math.min(n, 201); i++) if (D.N2[i] > D.N2[mi]) mi = i;
          // observed-profile mixed-layer depth (0.03 kg/m³ criterion) and N maximum of the unperturbed profile
          let mld = 0; for (let i = 1; i < C.G.z.length; i++) { if (C.rho[i] - C.rho[2] > 0.03) { mld = C.G.z[i]; break; } }
          let m0 = 0; for (let i = 0; i < 201; i++) if (C.N2[i] > C.N2[m0]) m0 = i;
          sN.dot(Nc(D.N2[mi]), -C.G.z[mi], { r: 6, color: 'gold' });
          info = { name: P.name, T0: P.T[0], S0: P.S[0], ustar, E, h, mld, zN: C.G.z[mi], Nmax: Nc(D.N2[mi]), N0: Nc(C.N2[m0]), z0: C.G.z[m0], used, Tdeep: P.T[P.T.length - 1], Ts: Gm.T[0], deep: zmax > 1000 };
        });
        v.legend([['muted', 'annual-mean profile'], ['red', 'temperature (after mixing)'], ['accent', 'density'], ['teal', 'buoyancy frequency'], ['gold', 'mixed-layer depth', { dash: true }]]);
        v.readout(() => {
          if (!info) return '';
          const i = info;
          return `${i.name}: surface ${v.fix(i.T0, 1)} °C, ${v.fix(i.S0, 2)} psu, ${v.fix(i.Tdeep, 1)} °C at 2000 m · unperturbed: mixed layer (Δσ = 0.03 kg/m³) ${v.fix(i.mld, 0)} m, $N$ peaks at **${v.fix(i.N0, 1)} cph** at ${v.fix(i.z0, 0)} m\nwind: $u_*$ = ${v.fix(i.ustar * 100, 2)} cm/s, energy input $m\\rho_0u_*^3t$ = ${v.fix(i.E, 0)} J/m² → ` + (i.h >= 10 ? `layer mixed to **${v.fix(i.h, 0)} m** (cost ${v.fix(i.used, 0)} J/m²), surface temperature ${v.fix(i.Ts, 1)} °C; $N$ now peaks at ${v.fix(i.Nmax, 1)} cph at ${v.fix(i.zN, 0)} m` : 'not enough energy to mix beyond the existing mixed layer') + (i.deep ? '\nbelow about 1 km the surface-referenced $N^2$ is only qualitative (see scope)' : '');
        });
      },
    },
    // ------------------------------------------------------------------ 1.11
    {
      num: '1.11', kind: 'Phenomenon', name: 'Layers of the atmosphere and the tropopause',
      statement: String.raw`The atmosphere is layered by its temperature profile. In the **troposphere** (0 to about 11 km in the 1976 standard atmosphere) temperature falls with height at roughly 6.5 K/km, the air is convectively active and holds almost all the water vapour; the **tropopause** is where the cooling stops, followed by the **stratosphere**, where temperature is constant and then rises (to about 47 km) because ozone absorbs ultraviolet sunlight; above the **stratopause** the **mesosphere** cools again to a minimum near 86 km. The tropopause height varies with latitude and season, from about 17 km in the tropics to 8–10 km at the poles; the WMO defines it as the lowest level at which the lapse rate falls to 2 K/km, provided it stays below 2 K/km in the 2 km above. Static stability $N^2=(g/T)(\Gamma_d-\Gamma)$ jumps by a factor of about four across it.`,
      idea: String.raw`The troposphere is heated from below (the surface absorbs sunlight) and its lapse rate is held near the moist-adiabatic value by convection (1.6); the stratosphere is heated from within by ozone absorption of ultraviolet, so temperature increases with height and the layer is strongly stable (1.4). The tropopause is the crossover. Deep tropical convection pushes the adiabatic troposphere much higher — the surface is hot and the moist lapse rate small — while at the poles the cold surface and weak convection leave a low tropopause.`,
      caption: String.raw`**Left:** the US Standard Atmosphere 1976 to 86 km (the table's seven layers). **Drag the gold handle** up the curve for the temperature, pressure, density, lapse rate and $N$ at any height. **Middle:** real radiosonde temperature profiles (NOAA IGRA, 00 UTC on 15 January or July 2013) for five stations from the equator to the Arctic; **drag the latitude** to pick the nearest station. The orange marker is the WMO lapse-rate tropopause computed from the data; the dashed curve is the standard atmosphere. **Right:** tropopause height against latitude for all ten soundings. The standard atmosphere's ozone heating and the thermosphere above 86 km are not part of the table shown.`,
      deps: ['geo-1.4'],
      refs: ['Pierrehumbert', 'Vallis'],
      tags: ['tropopause', 'atmosphere layers', 'stratosphere'],
      scope: String.raw`The standard atmosphere is a mid-latitude annual mean; ten soundings are an illustration, not a climatology (the WMO criterion can pick a low, weak tropopause in polar winter).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Atmosphere_of_Earth#Layers' },
      viz(v) {
        const season = v.select('season', [{ value: 'jan', label: 'January 2013' }, { value: 'jul', label: 'July 2013' }], 'jan');
        const lat = v.slider('latitude of the radiosonde station (°N)', 0, 70, 35, { step: 1 });
        const sU = v.stage({ x: [170, 300], y: [0, 86], height: 450, axes: 'box', gutter: true, xlabel: 'temperature (K)', ylabel: 'height (km)', title: 'US Standard Atmosphere 1976', weight: 1, minWidth: 260 });
        const sS = v.stage({ x: [-95, 35], y: [0, 30], height: 450, axes: 'box', gutter: true, xlabel: 'temperature (°C)', ylabel: 'height (km)', title: 'radiosonde (IGRA)', weight: 1, minWidth: 260 });
        const sL = v.stage({ x: [0, 75], y: [0, 20], height: 450, axes: 'box', gutter: true, xlabel: 'latitude (°N)', ylabel: 'tropopause height (km)', title: 'WMO tropopause vs latitude', weight: 0.9, minWidth: 240 });
        let zH = 11.0;
        const h = sU.handle(216, 11, { color: 'gold', r: 8, label: 'z', labelPos: 'ne', constrain: (x, y) => { zH = clamp(y, 0, 86); return [ussaT(geopot(zH * KM)), zH]; } });
        const TS = TROP_STATIONS.map((s) => ({ ...s, trop: { jan: wmoTropopause(s.jan), jul: wmoTropopause(s.jul) } }));
        const bands = [[0, 11.019, 'troposphere', 'accent'], [11.019, 47.35, 'stratosphere', 'purple'], [47.35, 51.41, 'stratopause', 'gold'], [51.41, 86, 'mesosphere', 'teal']];
        let info = null;
        v.render(() => {
          for (const [a, b, nm, col] of bands) { sU.hband(a, b, { color: col, alpha: 0.1 }); sU.text(nm, 298, (a + b) / 2, { align: 'right', size: 11, color: col, dy: nm === 'stratopause' ? -2 : 0 }); }
          const zs = []; for (let z = 0; z <= 86; z += 0.5) zs.push(z);
          sU.path(zs.map((z) => [ussaT(geopot(z * KM)), z]), { color: 'ink', width: 2.8 });
          for (const L of USSA_LAYERS.slice(1)) { const z = geom(L[0]) / KM; sU.hline(z, { color: 'faint', dash: [2, 4] }); }
          const H = geopot(zH * KM), T = ussaT(H), p = ussaPClosed(H), rho = p / (R_STD * T);
          const Lr = USSA_LAYERS[USSA_LAYERS.findIndex((_, i) => i + 1 >= USSA_LAYERS.length || H < USSA_LAYERS[i + 1][0])][2]; // dT/dH
          const N2 = G0 / T * (GAMMA_DRY + Lr);
          h.set(T, zH);
          // station
          let k = 0; TS.forEach((s, i) => { if (Math.abs(s.lat - lat.value) < Math.abs(TS[k].lat - lat.value)) k = i; });
          const S = TS[k], rows = S[season.value], tr = S.trop[season.value];
          sS.path(zs.filter((z) => z <= 20).map((z) => [ussaT(geopot(z * KM)) - 273.15, z]), { color: 'muted', width: 1.6, dash: [6, 4] });
          sS.path(rows.map((r) => [r[2], r[1] / KM]), { color: 'red', width: 2.8 });
          if (tr) { sS.hline(tr.z / KM, { color: 'orange', width: 1.6, dash: [5, 4] }); sS.dot(tr.T, tr.z / KM, { r: 7, color: 'orange' }); sS.text(`${v.fix(tr.z / KM, 1)} km`, tr.T, tr.z / KM, { dx: 12, dy: -12, size: 12, color: 'orange', align: 'left', plate: true }); }
          sS.text(S.name + `, ${v.fix(S.lat, 1)}° N`, -93, 1.5, { size: 12, color: 'ink', align: 'left' });
          // latitude panel
          sL.hline(11.0, { color: 'muted', dash: [6, 4] }); sL.text('standard atmosphere: 11 km', 3, 11.0, { align: 'left', dy: 11, size: 11, color: 'muted' });
          for (const [sn, col] of [['jan', 'blue'], ['jul', 'red']]) {
            const pts = TS.filter((s) => s.trop[sn]).map((s) => [s.lat, s.trop[sn].z / KM]);
            sL.path(pts, { color: col, width: 1.4, alpha: 0.5 }); sL.dots(pts, { r: 5, color: col });
          }
          if (tr) sL.dot(S.lat, tr.z / KM, { r: 10, color: 'orange', hollow: true });
          const layer = bands.find((b) => zH >= b[0] && zH < b[1])?.[2] ?? 'mesosphere';
          info = { H, T, p, rho, Lr, N2, layer, S, tr };
        });
        v.legend([['ink', 'standard atmosphere'], ['red', 'radiosonde'], ['orange', 'WMO tropopause'], ['blue', 'January', { dot: true }], ['red', 'July', { dot: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { H, T, p, rho, Lr, N2, layer, S, tr } = info;
          return `height ${v.fix(zH, 1)} km (geopotential ${v.fix(H / KM, 2)} km), ${layer}: $T$ = **${v.fix(T, 1)} K** (${sgn(v, T - 273.15, 1)} °C), $p$ = ${p > 10 ? v.fix(p / 100, 1) : v.fix(p / 100, 4)} hPa, $\\rho$ = ${v.fix(rho * 1000, rho > 0.01 ? 1 : 3)} g/m³, lapse rate ${sgn(v, -Lr * KM, 1)} K/km → $N^2$ = $${v.sci(N2, 2)}$ s⁻², period ${v.fix(2 * Math.PI / Math.sqrt(N2) / 60, 1)} min\n${S.name} (${S.id}), ${season.value === 'jan' ? '15 Jan' : '15 Jul'} 2013 00 UTC: ` + (tr ? `tropopause at **${v.fix(tr.z / KM, 1)} km** (${v.fix(tr.p, 0)} hPa, ${sgn(v, tr.T, 0)} °C)` : 'no tropopause found below the top of the sounding');
        });
      },
    },
  ],
};
