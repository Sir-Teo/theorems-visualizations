// Climate Science — Chapter 2: The greenhouse effect
import { SIG, NU, NN, planckNu, brightT, standardT, opticalDepths, longwave, emissionLevels, heights, zAtP, GRID, humidity, greyColumn, PS, ozoneProfile } from './ch02.shared.js';

const OZ300 = ozoneProfile(300);

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
    // ───────────────────────────────────────────────────────────── 2.3
    {
      num: '2.3',
      kind: 'Concept',
      name: 'Why CO₂ and H₂O absorb infrared but N₂ and O₂ do not',
      statement: String.raw`A molecule absorbs a photon of infrared light only if the photon can drive one of its vibrations (or rotations) through the oscillating **electric dipole moment** that vibration produces: the transition is allowed when $\partial\mathbf p/\partial Q \neq 0$ for the normal coordinate $Q$ of the mode, and the absorption strength is proportional to $|\partial\mathbf p/\partial Q|^2$ at the mode's frequency. The homonuclear diatomics N₂ and O₂ (99% of the air) have no dipole at any bond length, so their one vibration is infrared-inactive. CO₂ is linear and non-polar, but its bending and asymmetric-stretch modes produce a dipole and absorb (667 and 2349 cm⁻¹); its symmetric stretch does not. Bent H₂O has a permanent dipole and all three vibrations are active, plus a dense rotational spectrum at long wavelengths.`,
      idea: String.raw`Quantum mechanically the transition rate between vibrational levels is set by the matrix element of the dipole operator (the selection rules of the molecular-spectroscopy chapters). For small vibrations the dipole is linear in the normal coordinate, $\mathbf p = \mathbf p_0 + (\partial\mathbf p/\partial Q)\,Q$, so a mode couples to light exactly when the charges $q_i$ move so that $\sum_i q_i\,\mathbf d_i \neq 0$, with $\mathbf d_i$ the displacement of atom $i$ in the mode. Symmetry kills the sum for the symmetric modes of N₂, O₂ and CO₂.`,
      caption: String.raw`Pick a molecule and a normal mode: the atoms vibrate (amplitude slider) and the total dipole moment $\mathbf p(t) = \sum q_i\mathbf r_i(t)$ is traced on the right (arbitrary partial charges, but the symmetry argument does not depend on them). Bottom: the band positions with strength $\propto|\sum q_i\mathbf d_i|^2/\sum m_i|\mathbf d_i|^2$ on top of the 288 K emission spectrum of the Earth: CO₂'s bend at 667 cm⁻¹ sits at the heart of it.`,
      deps: ['qchem-9.7', 'qchem-8.10'],
      refs: ['Archer ch. 4'],
      tags: ['infrared', 'molecular spectroscopy'],
      viz(v) {
        // molecules: positions (Å), masses (u), partial charges (e); modes: displacement vectors per atom (before removing translation)
        const OH = 0.96, hh = (104.5 / 2) * (Math.PI / 180);
        const hx = OH * Math.sin(hh), hy = -OH * Math.cos(hh);
        const MOL = {
          N2: { name: 'N₂', atoms: [[-0.55, 0], [0.55, 0]], m: [14, 14], q: [0, 0], el: ['N', 'N'], col: ['blue', 'blue'] },
          O2: { name: 'O₂', atoms: [[-0.6, 0], [0.6, 0]], m: [16, 16], q: [0, 0], el: ['O', 'O'], col: ['red', 'red'] },
          CO2: { name: 'CO₂', atoms: [[-1.16, 0], [0, 0], [1.16, 0]], m: [16, 12, 16], q: [-0.35, 0.7, -0.35], el: ['O', 'C', 'O'], col: ['red', 'ink', 'red'] },
          H2O: { name: 'H₂O', atoms: [[0, 0], [-hx, hy], [hx, hy]], m: [16, 1, 1], q: [-0.8, 0.4, 0.4], el: ['O', 'H', 'H'], col: ['red', 'muted', 'muted'] },
        };
        const unit = (x, y) => { const n = Math.hypot(x, y); return [x / n, y / n]; };
        const bl = unit(-hx, hy), br = unit(hx, hy); // unit vectors from O toward each H
        const perp = (b, wantPositiveX) => { const c = [-b[1], b[0]]; return (c[0] > 0) === wantPositiveX ? c : [-c[0], -c[1]]; };
        const MODES = [
          { id: 'N2', mol: 'N2', label: 'N₂ stretch', nu: 2331, d: [[-1, 0], [1, 0]] },
          { id: 'O2', mol: 'O2', label: 'O₂ stretch', nu: 1556, d: [[-1, 0], [1, 0]] },
          { id: 'CO2s', mol: 'CO2', label: 'CO₂ symmetric stretch', nu: 1388, d: [[-1, 0], [0, 0], [1, 0]] },
          { id: 'CO2b', mol: 'CO2', label: 'CO₂ bend', nu: 667, d: [[0, 1], [0, -32 / 12], [0, 1]] },
          { id: 'CO2a', mol: 'CO2', label: 'CO₂ asymmetric stretch', nu: 2349, d: [[1, 0], [-32 / 12, 0], [1, 0]] },
          { id: 'H2Ob', mol: 'H2O', label: 'H₂O bend', nu: 1595, d: [[0, 0], perp(bl, true), perp(br, false)] },
          { id: 'H2Os', mol: 'H2O', label: 'H₂O symmetric stretch', nu: 3657, d: [[0, 0], bl, br] },
          { id: 'H2Oa', mol: 'H2O', label: 'H₂O asymmetric stretch', nu: 3756, d: [[0, 0], bl, [-br[0], -br[1]]] },
        ];
        for (const M of MODES) { // remove centre-of-mass translation (mass-weighted) so the molecule oscillates about its centre
          const mol = MOL[M.mol], mt = mol.m.reduce((a, b) => a + b, 0);
          const cx = mol.m.reduce((a, m, i) => a + m * M.d[i][0], 0) / mt, cy = mol.m.reduce((a, m, i) => a + m * M.d[i][1], 0) / mt;
          M.d = M.d.map(([x, y]) => [x - cx, y - cy]);
          const dp = [0, 0]; mol.q.forEach((q, i) => { dp[0] += q * M.d[i][0]; dp[1] += q * M.d[i][1]; });
          const norm = Math.sqrt(mol.m.reduce((a, m, i) => a + m * (M.d[i][0] ** 2 + M.d[i][1] ** 2), 0));
          M.dm = Math.max(...M.d.map((x) => Math.hypot(x[0], x[1]))) || 1; M.dp = dp; M.s = Math.hypot(dp[0], dp[1]); M.inten = (M.s / norm) ** 2; M.active = M.s > 1e-9;
        }
        const maxI = Math.max(...MODES.map((m) => m.inten));
        const sel = v.select('mode', MODES.map((m) => ({ value: m.id, label: m.label })), 'CO2b');
        const amp = v.slider('amplitude (Å)', 0.05, 0.4, 0.22, { step: 0.01 });
        const sM = v.stage({ x: [-2.4, 2.4], y: [-2.0, 1.6], equal: true, axes: false, height: 320, weight: 1, minWidth: 260, title: 'the vibrating molecule' });
        const sD = v.stage({ x: [-2, 0], y: [-1, 1], axes: 'box', gutter: true, height: 300, weight: 1, minWidth: 260, xlabel: 'time (periods)', ylabel: 'dipole moment p (arb. units)', title: 'total dipole moment' });
        const sS = v.stage({ x: [0, 4000], y: [0, 1.25], axes: 'box', gutter: true, height: 280, full: true, xlabel: 'wavenumber (cm⁻¹)', ylabel: 'relative IR strength', title: 'infrared-active vibrations against the Earth’s emission' });
        let R = null;
        const earth = Array.from({ length: 81 }, (_, i) => { const nu = 20 + i * 50; return [nu, planckNu(nu, 288)]; });
        const emax = Math.max(...earth.map((p) => p[1]));
        v.animate((t) => {
          const M = MODES.find((m) => m.id === sel.value), mol = MOL[M.mol], a = amp.value, ph = 2 * Math.PI * t / 1.6;
          const pos = (ph2) => mol.atoms.map((p, i) => [p[0] + a * M.d[i][0] * Math.cos(ph2) / M.dm, p[1] + a * M.d[i][1] * Math.cos(ph2) / M.dm]);
          const P = pos(ph);
          // bonds
          const bonds = M.mol === 'H2O' ? [[0, 1], [0, 2]] : M.mol === 'CO2' ? [[0, 1], [1, 2]] : [[0, 1]];
          for (const [i, j] of bonds) { sM.line(P[i][0], P[i][1], P[j][0], P[j][1], { color: 'muted', width: 6, alpha: 0.7 }); if (M.mol === 'CO2' || M.mol === 'N2' || M.mol === 'O2') sM.line(P[i][0], P[i][1], P[j][0], P[j][1], { color: 'panel', width: 1.5 }); }
          mol.atoms.forEach((_, i) => sM.dot(P[i][0], P[i][1], { r: mol.m[i] > 10 ? 17 : 10, color: mol.col[i], label: mol.el[i], labelPos: 'c' }));
          // dipole arrow from the centre of charge
          const p = [0, 0]; mol.q.forEach((q, i) => { p[0] += q * P[i][0]; p[1] += q * P[i][1]; });
          const p0 = [0, 0]; mol.q.forEach((q, i) => { p0[0] += q * mol.atoms[i][0]; p0[1] += q * mol.atoms[i][1]; });
          const dpv = [p[0] - p0[0], p[1] - p0[1]], mag = Math.hypot(...dpv);
          if (mag > 1e-6) sM.arrow(0, -1.2, dpv[0] * 4, -1.2 + dpv[1] * 4, { color: 'orange', width: 3.4, head: 9 });
          sM.text(M.active ? 'oscillating dipole (×4)' : 'no dipole change', -2.3, -1.85, { color: M.active ? 'orange' : 'muted', size: 12, align: 'left', weight: 600, baseline: 'middle', dy: 0 });
          sM.text(`${mol.name}  ${M.nu} cm⁻¹ (${v.fix(1e4 / M.nu, 1)} µm)`, -2.3, 1.3, { color: 'ink', size: 13, align: 'left', weight: 700 });
          // dipole trace
          const sc = 0.9 / Math.max(...MODES.map((m) => (m.s * 0.4) / m.dm), 1e-9) * 2;
          const ts = Array.from({ length: 121 }, (_, i) => -2 + (i / 120) * 2);
          const pa = (tt, k) => { const Q = pos(2 * Math.PI * (t + tt * 1.6) / 1.6); let s = 0; mol.q.forEach((q, i) => { s += q * Q[i][k]; }); return s - (k === 0 ? p0[0] : p0[1]); };
          sD.hline(0, { color: 'faint' });
          sD.path(ts.map((tt) => [tt, pa(tt, 0) * sc * 0.5]), { color: 'orange', width: 2.4 });
          sD.path(ts.map((tt) => [tt, pa(tt, 1) * sc * 0.5]), { color: 'purple', width: 2.4, dash: [5, 3] });
          sD.dot(0, pa(0, 0) * sc * 0.5, { color: 'orange', r: 5 }); sD.dot(0, pa(0, 1) * sc * 0.5, { color: 'purple', r: 5 });
          sD.text(M.active ? '' : 'p stays zero (up to rounding)', -1, 0.12, { color: 'muted', size: 12, align: 'center' });
          // spectrum
          sS.path(earth.map(([nu, f]) => [nu, (f / emax) * 1.05]), { color: 'gold', width: 1.4, alpha: 0.7 });
          sS.fn((nu) => (planckNu(Math.max(nu, 1), 288) / emax) * 1.05, { domain: [10, 4000], fill: true, color: 'gold', fillAlpha: 0.14, width: 0 });
          sS.text('Earth’s emission (288 K)', 900, 0.8, { color: 'gold', size: 11.5, align: 'left' });
          for (const m of MODES) {
            const on = m.id === M.id, y = m.active ? Math.sqrt(m.inten / maxI) * 0.95 : 0;
            if (m.active) sS.line(m.nu, 0, m.nu, y, { color: on ? 'orange' : 'accent', width: on ? 4 : 2.6 });
            sS.dot(m.nu, y, { r: on ? 6 : 4, color: m.active ? (on ? 'orange' : 'accent') : 'muted', hollow: !m.active });
            sS.text(m.label.replace(' stretch', '').replace('symmetric', 'sym.').replace('asymmetric', 'asym.'), m.nu, y, { size: 10.5, color: on ? 'orange' : 'ink', align: m.id === 'H2Os' ? 'right' : m.id === 'H2Oa' ? 'left' : 'center', dx: m.id === 'H2Os' ? -6 : m.id === 'H2Oa' ? 6 : 0, dy: m.active ? -12 : -12 - (MODES.indexOf(m) % 2) * 14 });
          }
          R = { M, mol };
        }, { period: 1.6, still: 0.3 });
        v.legend([['orange', 'dipole $p_x$'], ['purple', 'dipole $p_y$', { dash: true }], ['accent', 'IR-active mode', { dot: true }], ['muted', 'inactive (hollow)', { dot: true }]]);
        v.readout(() => R && (R.M.active ? String.raw`**${R.M.label}** (${R.M.nu} cm⁻¹): the charges' motion gives $|\sum q_i\mathbf d_i|$ = ${fx(v, R.M.s, 2)} (arb.) ≠ 0, a dipole that oscillates at the mode frequency, so a ${fx(v, 1e4 / R.M.nu, 1)} µm photon can be absorbed · relative strength ${fx(v, R.M.inten / maxI, 2)}` : String.raw`**${R.M.label}** (${R.M.nu} cm⁻¹): $\sum q_i\mathbf d_i = 0$ at every instant — ${R.M.mol === 'CO2' ? 'the two oxygens move in opposite directions and their dipoles cancel' : 'two identical atoms, no dipole at any bond length'}: infrared-inactive, so the gas is transparent to this radiation`));
      },
    },
    // ───────────────────────────────────────────────────────────── 2.4
    {
      num: '2.4',
      kind: 'Phenomenon',
      name: 'The 15 μm CO₂ band and the atmospheric window',
      statement: String.raw`Viewed from space, the Earth's infrared spectrum is not a blackbody curve. Between about 800 and 1200 cm⁻¹ (8–12 µm, the **atmospheric window**) the surface shines through almost unattenuated, and the radiance matches a blackbody near the surface temperature. In the CO₂ **15 µm band** (about 600–750 cm⁻¹) the radiation comes from the cold upper troposphere and lower stratosphere (about 220 K), leaving a deep "bite"; inside it the Q-branch core at 667 cm⁻¹ is emitted from the stratosphere and rises slightly. Ozone adds a notch at 9.6 µm (1042 cm⁻¹), and water vapour absorbs strongly at long wavelengths (rotation band, beyond about 15 µm) and at 6.3 µm. Seen from the ground, the same gases glow: downwelling radiance in the window is small, in the bands it follows the temperature of the nearby air.`,
      scope: String.raw`Clear sky, a mid-latitude-like profile with fixed relative humidity. The absorption spectrum here is a synthetic band model (tuned to give a clear-sky OLR of roughly 240–250 W/m² and about 3.3 W/m² per CO₂ doubling), not line-by-line data: the positions and the qualitative depths of the features are right; the numbers are not those of a spectroradiometer.`,
      idea: String.raw`A gas that absorbs strongly at a wavenumber is also a strong emitter there (Kirchhoff, 1.4), and the radiation reaching space at that wavenumber was emitted from roughly the level where the overlying optical depth is one (2.5). Strong bands are therefore emitted from high, cold air and look dim; weak bands and windows are emitted from low, warm air and look bright. The size of the difference between the surface's blackbody curve and the observed spectrum, summed over all wavenumbers, *is* the greenhouse effect (about 150 W/m² for the all-sky Earth).`,
      caption: String.raw`The computed flux per wavenumber (heavy line) over blackbody curves for several temperatures (faint); the red area is energy the atmosphere keeps from leaving. Switch between the view from space and the view from the ground, and switch gases off one at a time: removing CO₂ opens the 15 µm bite, removing H₂O opens the long-wave end, and adding ozone carves the 9.6 µm notch. Below: the same spectrum as brightness temperature.`,
      deps: ['climate-2.3', 'climate-1.1'],
      refs: ['Archer ch. 4'],
      tags: ['infrared', 'spectrum', 'greenhouse'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Infrared_window' },
      viz(v) {
        const view = v.select('view from', [{ value: 'space', label: 'space (outgoing)' }, { value: 'ground', label: 'ground (downwelling)' }], 'space');
        const co2 = v.slider('CO₂ (ppm)', 10, 3000, 420, { log: true, sig: 2 });
        const Tsl = v.slider('surface temperature (K)', 250, 320, 288, { step: 1 });
        const tCO2 = v.toggle('CO₂', true), tH2O = v.toggle('H₂O', true), tO3 = v.toggle('O₃', false);
        const sA = v.stage({ x: [200, 1500], y: [0, 0.5], axes: 'box', gutter: true, height: 360, full: true, xlabel: 'wavenumber (cm⁻¹)', ylabel: 'flux (W m⁻² per cm⁻¹)', title: 'infrared spectrum' });
        const sB = v.stage({ x: [200, 1500], y: [180, 320], axes: 'box', gutter: true, height: 200, full: true, xlabel: 'wavenumber (cm⁻¹)', ylabel: 'brightness T (K)', title: 'the same spectrum as brightness temperature' });
        const cache = new Map();
        function compute(co2v, Ts, view_, gC, gH, gO) {
          const k = [co2v.toFixed(0), Ts, view_, gC, gH, gO].join('|'); if (cache.has(k)) return cache.get(k);
          if (cache.size > 40) cache.clear();
          const T = standardT(Ts, 6.5, 216.65), q = humidity(T);
          const o = { co2: gC ? co2v : 0, h2o: gH ? 1 : 0, cont: gH ? 1 : 0, q, o3: gO ? OZ300 : null };
          const L = longwave(T, Ts, opticalDepths(T, o), { spec: true });
          const r = { L, spec: view_ === 'space' ? L.olrSpec : L.dnSpec, tot: view_ === 'space' ? L.olr : L.dnSfc, Ts };
          cache.set(k, r); return r;
        }
        const idx = (nu) => Math.round((nu - 10) / 5);
        let R = null;
        v.render(() => {
          const Ts = Tsl.value, r = compute(co2.value, Ts, view.value, tCO2.value, tH2O.value, tO3.value), sp = r.spec;
          const ymax = Math.max(0.5, planckNu(300, Ts) * 1.08);
          const top = Math.ceil(ymax * 20) / 20; sA.setView(null, [0, top]);
          sA.vband(800, 1200, { color: 'green', alpha: 0.07 });
          sA.text('atmospheric window', 1000, top * 0.97, { color: 'green', size: 11.5, align: 'center', weight: 600, baseline: 'top' });
          for (const T of [220, 240, 260, 280, 300]) if (T <= Ts + 15) sA.fn((nu) => planckNu(nu, T), { domain: [200, 1500], color: 'faint', width: 1 });
          sA.fn((nu) => planckNu(nu, Ts), { domain: [200, 1500], color: 'red', width: 1.6, dash: [5, 4] });
          if (view.value === 'space') sA.between((nu) => planckNu(nu, Ts), (nu) => sp[idx(nu)], 205, 1495, { fill: 'red', fillAlpha: 0.2 });
          sA.path(NU.map((nu, i) => [nu, sp[i]]).filter((p) => p[0] >= 200 && p[0] <= 1500), { color: view.value === 'space' ? 'accent' : 'purple', width: 2.4 });
          for (const [nu, lab] of [[667, 'CO₂ 15 µm'], [1042, 'O₃ 9.6 µm'], [300, 'H₂O rotation'], [1400, 'H₂O 6.3 µm']]) sA.text(lab, nu, 0, { size: 11, color: 'muted', align: 'center', baseline: 'bottom', dy: -4 });
          sA.text(`${Ts} K surface`, 1490, planckNu(1490, Ts), { size: 11, color: 'red', align: 'right', baseline: 'bottom', dy: -4 });
          // brightness temperature
          sB.hline(Ts, { color: 'red', dash: [5, 4], width: 1.2 });
          sB.vband(800, 1200, { color: 'green', alpha: 0.07 });
          sB.path(NU.map((nu, i) => [nu, brightT(nu, sp[i])]).filter((p) => p[0] >= 200 && p[0] <= 1500 && p[1] > 0), { color: view.value === 'space' ? 'accent' : 'purple', width: 2.2 });
          const tb = (nu) => brightT(nu, sp[idx(nu)]);
          R = { r, Ts, tb667: tb(670), tb900: tb(900), tb1042: tb(1040), tb400: tb(400), sig: SIG * Ts ** 4 };
        });
        v.legend([['accent', 'spectrum from space'], ['purple', 'spectrum from the ground'], ['red', 'surface blackbody', { dash: true }], ['red', 'trapped energy', { area: true }], ['faint', '220–300 K blackbodies']]);
        v.readout(() => R && String.raw`${view.value === 'space' ? `OLR (10–2000 cm⁻¹)` : `downwelling at the ground`} = **${fx(v, R.r.tot, 1)} W/m²**` + (view.value === 'space' ? String.raw` against the surface's ${fx(v, R.sig, 0)} W/m²: greenhouse effect **${fx(v, R.sig - R.r.tot, 0)} W/m²** · ` : ' · ') + String.raw`brightness temperature: window (900 cm⁻¹) ${fx(v, R.tb900, 0)} K, CO₂ band (670) ${fx(v, R.tb667, 0)} K, ozone (1040) ${fx(v, R.tb1042, 0)} K, rotation band (400) ${fx(v, R.tb400, 0)} K`);
      },
    },
    // ───────────────────────────────────────────────────────────── 2.5
    {
      num: '2.5',
      kind: 'Definition',
      name: 'Optical depth and the Beer–Lambert law in the atmosphere',
      statement: String.raw`For radiation of a given wavenumber travelling along a path through an absorbing medium, the **optical depth** is the integral of the absorption coefficient times the absorber density along the path,
$$\tau = \int \kappa\,\rho\,ds,$$
and the **Beer–Lambert law** says that the transmitted fraction is $e^{-\tau}$. In a plane atmosphere the vertical optical depth above height $z$ is $\tau(z)$ and a slanted ray at angle $\theta$ to the vertical sees $\tau/\cos\theta$. For an absorber with scale height $H$, $\tau(z) = \tau_0 e^{-z/H}$, where $\tau_0$ is the total vertical optical depth. The level seen from space at that wavenumber (the **emission height**) is where $\tau/\cos\theta \approx 1$: $z_e = H\ln(\tau_0/\cos\theta)$, rising with the absorber's strength.`,
      scope: String.raw`Valid for absorption without scattering, at one wavenumber, for a medium whose absorption coefficient does not depend on the intensity. The exponential-density example is the simplest model of a well-mixed gas; the radiating atmosphere itself is treated in 2.6.`,
      idea: String.raw`A thin slab removes a fixed fraction of the light passing through it, $dI = -\kappa\rho\,I\,ds$ (the fraction is proportional to the number of absorbers met); integrating this linear equation gives the exponential. Looking down from space the emitted radiation is weighted by $e^{-\tau}$ of the air above it, so the weighting function $d(e^{-\tau})/dz$ has a peak where $\tau \approx 1$. Weak absorption ($\tau_0 < 1$) reaches the ground; strong absorption is seen only from the top of the atmosphere. Along a finite path with continuous nonnegative $a(s)=\kappa(s)\rho(s)$, the integrating factor in ode 1.4 solves $I\prime+a(s)I=0$ as $I(s)=I(0)\exp[-\int_0^s a(u)\,du]$. The accumulated integral is optical depth. This derivation needs linear absorption without emission or scattering into the beam; the source term of the radiating atmosphere is treated separately in 2.6.`,
      caption: String.raw`Left: the absorber's density (shading), the fraction of ground radiation that reaches height $z$ (blue), and the weighting function — where the radiation seen from space comes from (orange). Drag the handle to read $\tau$ and the transmission at any height; the dashed line is the emission height $\tau/\cos\theta = 1$. Right: emission height against wavenumber for the synthetic CO₂ + H₂O spectrum (2.4): the band at 667 cm⁻¹ is seen from the lower stratosphere, the window from the ground.`,
      deps: ['qchem-9.13', 'geo-1.1', 'ode-1.4'],
      refs: ['Pierrehumbert'],
      tags: ['radiative transfer', 'absorption'],
      viz(v) {
        const t0 = v.slider('total optical depth $\\tau_0$', 0.05, 5000, 20, { log: true, sig: 2 });
        const th = v.slider('viewing angle $\\theta$ (°)', 0, 75, 0, { step: 1 });
        const Hs = v.slider('absorber scale height $H$ (km)', 2, 10, 7, { step: 0.5 });
        const co2 = v.slider('CO₂ in the spectrum panel (ppm)', 50, 3000, 420, { log: true, sig: 2 });
        const sA = v.stage({ x: [0, 1.05], y: [0, 40], axes: 'box', gutter: true, height: 380, weight: 1.1, minWidth: 280, xlabel: 'fraction', ylabel: 'height z (km)', title: 'Beer–Lambert in an exponential atmosphere' });
        const sB = v.stage({ x: [400, 1100], y: [0, 56], axes: 'box', gutter: true, height: 380, weight: 1, minWidth: 280, xlabel: 'wavenumber (cm⁻¹)', ylabel: 'emission height (km)', title: 'emission height of the synthetic spectrum' });
        const h = sA.handle(0.3, 8, { color: 'gold', r: 7, constrain: (x, y) => [0.3, Math.max(0, Math.min(40, y))], label: 'probe' });
        const cache = new Map();
        const sp = (c) => { const k = c.toFixed(0); if (!cache.has(k)) { if (cache.size > 30) cache.clear(); const T = standardT(288), tau = opticalDepths(T, { co2: c }); const pe = emissionLevels(tau); cache.set(k, { pe, T }); } return cache.get(k); };
        let R = null;
        v.render(() => {
          const t = t0.value, H = Hs.value, c = 1 / Math.cos((th.value * Math.PI) / 180), ze = Math.max(0, H * Math.log(t * c));
          const tauz = (z) => t * Math.exp(-z / H);
          // absorber density as shading to the right
          for (let z = 0; z < 40; z += 0.8) sA.rect(0.9, z, 1.05, z + 0.8, { fill: 'orange', fillAlpha: 0.1 + 0.5 * Math.exp(-(z + 0.4) / H), stroke: false });
          sA.text('absorber', 0.975, 1.5, { size: 10.5, color: 'ink', align: 'center' });
          sA.curve((s) => [Math.exp(-tauz(s) * c), s], 0, 40, { color: 'accent', width: 2.6, n: 300 }); // transmission from space... fraction of space-bound light that survives above z
          // weighting function w = d e^{-tau c}/dz
          const w = (z) => (c * tauz(z) / H) * Math.exp(-c * tauz(z));
          const wmax = Math.max(...Array.from({ length: 200 }, (_, i) => w((i / 200) * 40)), 1e-6);
          sA.curve((s) => [(0.85 * w(s)) / wmax, s], 0, 40, { color: 'orange', width: 2.2, n: 300 });
          sA.poly([[0, 0], ...Array.from({ length: 101 }, (_, i) => [(0.85 * w((i / 100) * 40)) / wmax, (i / 100) * 40]), [0, 40]], { fill: 'orange', fillAlpha: 0.12, stroke: false });
          sA.hline(ze, { color: 'muted', dash: [6, 4] });
          sA.text(ze > 0.3 ? `emission height ${fx(v, ze, 1)} km` : 'emitted from the ground', 0.02, ze, { color: 'muted', size: 11.5, align: 'left', baseline: 'bottom', dy: -3 });
          const z = h.y, tz = tauz(z) * c;
          sA.hline(z, { color: 'gold', width: 1.2, alpha: 0.7 });
          sA.dot(Math.exp(-tz), z, { color: 'gold', r: 5 });
          // spectrum panel
          const { pe, T } = sp(co2.value);
          sB.path(NU.map((nu, i) => [nu, zAtP(T, pe[i])]).filter((p) => p[0] >= 400 && p[0] <= 1100), { color: 'accent', width: 2.4 });
          sB.vband(800, 1200, { color: 'green', alpha: 0.07 }); sB.text('window', 950, 54, { color: 'green', size: 11.5, align: 'center' });
          sB.text('CO₂ band core: stratosphere', 800, 46, { color: 'muted', size: 11, align: 'center' });
          sB.hline(11, { color: 'faint', dash: [4, 4] }); sB.text('tropopause', 1095, 11.5, { color: 'muted', size: 10.5, align: 'right' });
          R = { t, c, ze, z, tz, trans: Math.exp(-tz), tot: t * c, win: zAtP(T, pe[(900 - 10) / 5]), core: zAtP(T, pe[(667 - 10) / 5]) };
        });
        v.legend([['accent', 'transmission to space $e^{-\\tau/\\cos\\theta}$'], ['orange', 'weighting function (where it comes from)']]);
        v.readout(() => R && String.raw`$\tau_0$ = ${fx(v, R.t, 2)}, slant factor $1/\cos\theta$ = ${fx(v, R.c, 2)} · at the probe ($z$ = ${fx(v, R.z, 1)} km): $\tau/\cos\theta$ = ${fx(v, R.tz, 2)}, so only **${fx(v, 100 * R.trans, 1)}%** of the light from there escapes · emission height $z_e = H\ln(\tau_0/\cos\theta)$ = ${fx(v, R.ze, 1)} km · synthetic spectrum: window at ${fx(v, R.win, 1)} km, CO₂ core at ${fx(v, R.core, 1)} km`);
      },
    },
  ],
};
