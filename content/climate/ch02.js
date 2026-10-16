// Climate Science — Chapter 2: The greenhouse effect
import { SIG, NU, NN, planckNu, brightT, standardT, opticalDepths, longwave, emissionLevels, heights, zAtP, GRID, humidity, greyColumn, PS } from './ch02.shared.js';

const TE0 = (240 / SIG) ** 0.25; // Earth's effective temperature for 240 W/m² (K)
const fx = (v, x, d = 1) => v.fix(x, d);

// ── grey-column cache (Ts versus optical depth, both radiative and convective) ──────────────────────────────────────
let GREY = null;
function greyCurves() {
  if (GREY) return GREY;
  const taus = [], rad = [], conv = [];
  for (let t = 0; t <= 4.001; t += 0.25) { taus.push(t); rad.push(greyColumn(t, { convect: false, iters: 250 }).Ts); conv.push(greyColumn(t, { iters: 250 }).Ts); }
  return (GREY = { taus, rad, conv });
}

export default {
  collection: 'climate',
  chapter: 2,
  title: 'The greenhouse effect',
  summary: String.raw`The atmosphere is nearly transparent to sunlight but absorbs infrared, so the surface is warmed by downward radiation from above. Layer models show the effect in its simplest form; molecular physics explains why CO₂ and water vapour absorb while N₂ and O₂ do not; and the radiative-transfer picture locates the real mechanism in the emission height and the lapse rate. Band saturation makes CO₂ forcing logarithmic, radiative–convective equilibrium sets the temperature profile, and too much water vapour leads to a runaway.`,
  items: [
    // ───────────────────────────────────────────────────────────── 2.1
    {
      num: '2.1',
      kind: 'Model',
      name: 'Single-layer greenhouse model',
      credit: 'after J. Fourier, 1824; the layer model is the standard textbook idealisation',
      statement: String.raw`Put one thin atmospheric layer above a surface. The layer is transparent to sunlight but absorbs a fraction $\varepsilon$ of the infrared that reaches it and (Kirchhoff, 1.4) emits with the same emissivity $\varepsilon$, both up and down. In steady state each of the three levels must balance, with $T_e$ the effective temperature of the planet (1.6):
- top of the atmosphere: $\ (1-\varepsilon)\,\sigma T_s^4 + \varepsilon\,\sigma T_g^4 = \sigma T_e^4$
- layer: $\ \varepsilon\,\sigma T_s^4 = 2\,\varepsilon\,\sigma T_g^4$, so $T_g^4 = T_s^4/2$
- surface: $\ \sigma T_s^4 = \dfrac{S(1-\alpha)}{4} + \varepsilon\,\sigma T_g^4$

Solving, $T_s = T_e\,\big(\tfrac{2}{2-\varepsilon}\big)^{1/4}$. For a fully absorbing layer ($\varepsilon = 1$) the surface is $2^{1/4}T_e$ — 303 K for Earth's $T_e = 255$ K — and the layer itself sits at exactly $T_e$.`,
      scope: String.raw`A cartoon: one isothermal layer, no convection, no clouds, a grey (wavelength-independent) absorptivity and a perfect-blackbody surface. It overshoots Earth's 288 K for $\varepsilon = 1$ because real heat is carried up by convection, not only by radiation; a layer with $\varepsilon \approx 0.77$ reproduces 288 K.`,
      idea: String.raw`Sunlight passes through the layer untouched, so the planet as a whole must still radiate $\sigma T_e^4$ to space (1.6). But the layer absorbs infrared from below and radiates half of it back down: the surface now receives sunlight *and* downward infrared and must be warmer to get rid of both. The energy bookkeeping at the three levels (1.2, 1.4) fixes the temperatures, and the factor 2 in $T_g^4 = T_s^4/2$ is just "one layer, two faces".`,
      caption: String.raw`Left: energy fluxes in W/m², arrow width proportional to flux; drag $\varepsilon$ and $\alpha$. Middle: the three balances (energy in = energy out) hold at every level. Right: $T_s$ against $\varepsilon$; the dot moves with the slider, the dashed lines are $T_e$ and Earth's observed 288 K.`,
      deps: ['climate-1.6', 'climate-1.4'],
      refs: ['Archer ch. 3'],
      tags: ['greenhouse', 'layer model'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Greenhouse_effect' },
      viz(v) {
        const S0 = 1361;
        const alb = v.slider('albedo $\\alpha$', 0, 0.8, 0.3, { step: 0.01 });
        const eps = v.slider('layer infrared absorptivity $\\varepsilon$', 0, 1, 1, { step: 0.01 });
        const sA = v.stage({ x: [0, 12], y: [0, 10], axes: false, height: 420, weight: 1.35, minWidth: 330, title: 'fluxes (W/m²)' });
        const sB = v.stage({ x: [0, 700], y: [0, 3.2], axes: false, height: 420, weight: 0.9, minWidth: 260, title: 'balance: in = out' });
        const sC = v.stage({ x: [0, 1], y: [240, 320], axes: 'box', gutter: true, height: 420, weight: 0.9, minWidth: 260, xlabel: 'layer absorptivity ε', ylabel: 'surface T (K)', title: 'surface temperature' });
        let R = null;
        const wd = (F) => 1.2 + F / 38;
        const arr = (x, y1, y2, F, color, lab, o = {}) => {
          if (F < 0.5) return;
          sA.arrow(x, y1, x, y2, { color, width: wd(F), head: 8 + F / 60, alpha: o.alpha ?? 1 });
          sA.text(lab ?? fx(v, F, 0), x + (o.dx ?? 0.35), (y1 + y2) / 2, { color, size: 12.5, weight: 700, align: 'left' });
        };
        v.render(() => {
          const a = alb.value, e = eps.value, asr = (S0 * (1 - a)) / 4, Te = (asr / SIG) ** 0.25;
          const Ts = Te * (2 / (2 - e)) ** 0.25, Tg = Ts / 2 ** 0.25;
          const up = SIG * Ts ** 4, lay = SIG * Tg ** 4;
          // bands
          sA.rect(0, 0, 12, 1.15, { fill: 'muted', fillAlpha: 0.22, stroke: false });
          sA.text(`surface  $T_s$ = ${fx(v, Ts)} K`, 11.8, 0.55, { align: 'right', color: 'ink', size: 12.5 });
          sA.rect(0, 5.25, 12, 6.2, { fill: 'blue', fillAlpha: 0.06 + 0.3 * e, color: 'blue', width: 1 });
          sA.text(`layer  $T_g$ = ${fx(v, Tg)} K`, 11.8, 5.72, { align: 'right', color: 'blue', size: 12.5, weight: 600 });
          sA.text('space', 11.8, 9.55, { color: 'muted', size: 11.5, align: 'right' });
          // sunlight: in, reflected
          sA.arrow(1.1, 9.4, 1.1, 1.3, { color: 'gold', width: wd(S0 / 4), head: 11 });
          sA.text(fx(v, S0 / 4, 0), 1.45, 8.3, { color: 'gold', size: 12.5, weight: 700, align: 'left' });
          if (a > 0.005) { sA.arrow(2.6, 1.3, 2.6, 9.4, { color: 'gold', width: wd(S0 * a / 4), head: 8, alpha: 0.55 }); sA.text(fx(v, (S0 * a) / 4, 0), 2.95, 8.3, { color: 'gold', size: 12, weight: 700, align: 'left', alpha: 0.7 }); }
          sA.text('sunlight', 1.1, 9.85, { color: 'gold', size: 11.5, align: 'left', weight: 600 });
          // infrared
          arr(5.2, 1.3, 5.1, up, 'red');
          arr(5.2, 6.3, 9.2, (1 - e) * up, 'red', null, { alpha: 0.6 });
          arr(7.4, 6.3, 9.2, e * lay, 'purple');
          arr(9.6, 5.1, 1.3, e * lay, 'purple');
          sA.text(`OLR = ${fx(v, (1 - e) * up + e * lay, 0)} W/m²`, 6.3, 9.65, { color: 'green', size: 12.5, weight: 700, align: 'center' });
          // balance bars
          const rows = [
            ['top of atmosphere', asr, (1 - e) * up + e * lay],
            ['layer', e * up, 2 * e * lay],
            ['surface', asr + e * lay, up],
          ];
          rows.forEach(([nm, ein, eout], i) => {
            const y = 2.55 - i * 1.05;
            sB.text(nm, 4, y + 0.42, { color: 'ink', size: 12, align: 'left', weight: 600 });
            sB.rect(0, y - 0.05, ein, y + 0.2, { fill: 'gold', fillAlpha: 0.65, stroke: false });
            sB.rect(0, y - 0.32, eout, y - 0.07, { fill: 'red', fillAlpha: 0.55, stroke: false });
            sB.text(`in ${fx(v, ein, 0)}`, ein + 5, y + 0.075, { color: 'ink', size: 11, align: 'left' });
            sB.text(`out ${fx(v, eout, 0)}`, eout + 5, y - 0.195, { color: 'ink', size: 11, align: 'left' });
          });
          // T vs eps
          sC.hline(Te, { color: 'muted', dash: [4, 4] }); sC.hline(288, { color: 'blue', dash: [6, 4] });
          sC.text('$T_e$', 0.03, Te, { color: 'muted', size: 12, align: 'left', baseline: 'bottom', dy: -3 });
          sC.text('observed 288 K', 0.03, 288, { color: 'blue', size: 11.5, align: 'left', baseline: 'bottom', dy: -3 });
          sC.fn((x) => Te * (2 / (2 - x)) ** 0.25, { domain: [0, 1], color: 'accent', width: 2.4 });
          const en = 2 - 2 * (Te / 288) ** 4;
          if (en >= 0 && en <= 1) sC.dot(en, 288, { color: 'blue', hollow: true, r: 5 });
          sC.dot(e, Ts, { color: 'gold', r: 7, label: `${fx(v, Ts)} K`, labelPos: e > 0.6 ? 'nw' : 'ne' });
          R = { asr, Te, Ts, Tg, up, lay, en, e, out: (1 - e) * up + e * lay };
        });
        v.legend([['gold', 'sunlight'], ['red', 'surface infrared'], ['purple', 'layer emission'], ['green', 'OLR']]);
        v.readout(() => R && String.raw`$T_e$ = ${fx(v, R.Te)} K · $T_s = T_e(2/(2-\varepsilon))^{1/4}$ = ${fx(v, R.Ts)} K (greenhouse warming ${fx(v, R.Ts - R.Te)} K) · $T_g^4 = T_s^4/2$ gives $T_g$ = ${fx(v, R.Tg)} K · OLR = ${fx(v, R.out, 1)} W/m² vs absorbed ${fx(v, R.asr, 1)} W/m² · ${R.en <= 1 && R.en >= 0 ? String.raw`288 K needs $\varepsilon$ = ${fx(v, R.en, 2)}` : '288 K is out of reach for this albedo'}`);
      },
    },
    // ───────────────────────────────────────────────────────────── 2.2
    {
      num: '2.2',
      kind: 'Model',
      name: 'Multi-layer and grey-atmosphere models',
      statement: String.raw`Stack $n$ perfectly infrared-absorbing layers over a surface (each transparent to sunlight). Energy balance at every level gives a constant net upward flux $\sigma T_e^4$ between adjacent layers and
$$T_j^4 = j\,T_e^4\ \ (j = 1,\dots,n \text{ from the top}),\qquad T_s^4 = (n+1)\,T_e^4 .$$
The continuous version is a **grey atmosphere** of total infrared optical depth $\tau_\infty$ (the same absorption at all infrared wavelengths): in radiative equilibrium the surface temperature rises as $T_s^4 \approx T_e^4\big(1 + \tfrac34\tau_\infty\big)$ (two-stream; $\tau_\infty \leftrightarrow \tfrac43 n$ matches the stack), and the temperature falls steeply with height from a hot ground. Adding **convective adjustment** — no layer pair steeper than the lapse rate $\Gamma$ — carries heat upward and gives a much cooler surface.`,
      scope: String.raw`Grey absorption, a single infrared band, no clouds, a fixed $\Gamma$ = 6.5 K/km and an absorber with $\tau \propto p^2$ (so it is concentrated in the lower atmosphere). Real gases are far from grey (2.4), which is why the real greenhouse effect is weaker than the layer count suggests.`,
      idea: String.raw`Each extra layer makes the surface see one more "blanket" of downward emission, so $T_s^4$ grows by one unit of $T_e^4$ per layer: the single-layer result (2.1) iterated. Letting the layers become thin and numerous gives a smooth grey atmosphere whose radiative-equilibrium profile is far steeper than a real atmosphere can maintain; air rising in convection (hydrostatic balance and the adiabatic lapse rate of the geo collection) then caps the lapse rate, moving the surface to a temperature near Earth's for $\tau_\infty \approx 1.5$.`,
      caption: String.raw`Left: the stack of $n$ layers with $T_j = j^{1/4}T_e$. Middle: temperature profile of the grey atmosphere computed numerically, with (solid) and without (dashed) convective adjustment. Right: surface temperature against $\tau_\infty$ for both; the dot follows your slider.`,
      deps: ['climate-2.1'],
      refs: ['Archer ch. 3', 'Pierrehumbert'],
      tags: ['greenhouse', 'layer model', 'convection'],
      viz(v) {
        const n = v.slider('number of layers $n$', 0, 8, 2, { int: true });
        const tau = v.slider('grey optical depth $\\tau_\\infty$', 0, 4, 1.5, { step: 0.05 });
        const gam = v.slider('lapse-rate limit $\\Gamma$ (K/km)', 3, 9.8, 6.5, { step: 0.1 });
        const sA = v.stage({ x: [0, 12], y: [0, 10], axes: false, height: 380, weight: 0.9, minWidth: 250, title: 'stack of n layers' });
        const sB = v.stage({ x: [150, 400], y: [0, 28], axes: 'box', gutter: true, height: 380, weight: 1, minWidth: 260, xlabel: 'temperature (K)', ylabel: 'height (km)', title: 'grey atmosphere profile' });
        const sC = v.stage({ x: [0, 4], y: [240, 400], axes: 'box', gutter: true, height: 380, weight: 1, minWidth: 260, xlabel: 'optical depth τ∞', ylabel: 'surface T (K)', title: 'surface temperature' });
        let R = null;
        const cache = new Map();
        const col = (t, g, c) => { const k = `${t.toFixed(2)}|${g.toFixed(1)}|${c}`; if (!cache.has(k)) { if (cache.size > 80) cache.clear(); cache.set(k, greyColumn(t, { convect: c, gamma: g, iters: 250 })); } return cache.get(k); };
        v.render(() => {
          const N = n.value, G = gam.value, t = tau.value, Te = TE0;
          // stack
          const base = 1.4, dy = N > 0 ? Math.min(1.05, 7.2 / (N + 0.5)) : 1;
          sA.rect(0, 0, 12, 1, { fill: 'muted', fillAlpha: 0.22, stroke: false });
          const bar = (y, T, lab, color) => { sA.rect(0.4, y - 0.3, 0.4 + (T - 150) / 30, y + 0.3, { fill: color, fillAlpha: 0.55, color, width: 1 }); sA.text(lab, 0.5 + (T - 150) / 30 + 0.3, y, { color: 'ink', size: 12, align: 'left', weight: 600 }); };
          bar(0.5, Te * (N + 1) ** 0.25, `surface ${fx(v, Te * (N + 1) ** 0.25, 0)} K`, 'red');
          for (let j = N; j >= 1; j--) bar(base + (N - j) * dy + 0.4, Te * j ** 0.25, `layer ${j}: ${fx(v, Te * j ** 0.25, 0)} K`, 'blue');
          sA.text(N === 0 ? 'no layers: surface at $T_e$' : '', 0.6, 1.7, { color: 'muted', size: 12, align: 'left' });
          sA.text('top', 11.8, 9.6, { color: 'muted', size: 11, align: 'right' });
          // profile
          const rad = col(t, G, false), cv = col(t, G, true);
          sB.vline(Te, { color: 'muted', dash: [3, 4] }); sB.text('$T_e$', Te, 27.2, { color: 'muted', size: 11.5, align: 'center' });
          sB.path(rad.T.map((T, i) => [T, rad.z[i]]).concat([]), { color: 'red', dash: [6, 4], width: 2 });
          sB.path(cv.T.map((T, i) => [T, cv.z[i]]), { color: 'accent', width: 2.6 });
          sB.dot(rad.Ts, 0, { color: 'red', hollow: true, r: 5 }); sB.dot(cv.Ts, 0, { color: 'accent', r: 6 });
          // Ts vs tau
          const g = greyCurves();
          sC.hline(288, { color: 'blue', dash: [6, 4] }); sC.text('288 K', 3.95, 288, { color: 'blue', size: 11.5, align: 'right', baseline: 'bottom', dy: -3 });
          sC.path(g.taus.map((x, i) => [x, g.rad[i]]), { color: 'red', dash: [6, 4], width: 2 });
          sC.path(g.taus.map((x, i) => [x, g.conv[i]]), { color: 'accent', width: 2.6 });
          sC.path(Array.from({ length: 41 }, (_, i) => [(i / 40) * 4, Te * (1 + 0.75 * (i / 40) * 4) ** 0.25]), { color: 'muted', width: 1.2, dash: [2, 4] });
          sC.vline(1.5, { color: 'faint' });
          sC.dot(t, rad.Ts, { color: 'red', r: 5 }); sC.dot(t, cv.Ts, { color: 'accent', r: 6.5, label: `${fx(v, cv.Ts, 0)} K`, labelPos: 'se' });
          R = { N, t, Ts: Te * (N + 1) ** 0.25, rad: rad.Ts, cv: cv.Ts, Te };
        });
        v.legend([['red', 'radiative equilibrium', { dash: true }], ['accent', 'with convective adjustment'], ['muted', 'two-stream $T_e(1+\\tfrac34\\tau)^{1/4}$', { dash: true }]]);
        v.readout(() => R && String.raw`$n$ = ${R.N} layers: $T_s = (n+1)^{1/4}T_e$ = ${fx(v, R.Ts)} K, a ${fx(v, R.Ts - R.Te)} K greenhouse warming · grey $\tau_\infty$ = ${fx(v, R.t, 2)}: radiative equilibrium **${fx(v, R.rad)} K**, with convection **${fx(v, R.cv)} K** · matching optical depth for the stack $\tfrac43 n$ = ${fx(v, (4 * R.N) / 3, 2)} · Earth (288 K) needs $\tau_\infty \approx 1.5$ once convection is on`);
      },
    },
  ],
};
