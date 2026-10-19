// Physical Chemistry — Chapter 4: Phase transitions of pure substances (part 1: phase diagrams and the Clapeyron family)
import { R, ATM, SUBST, phaseOf, antoineW, pAlt } from './ch04.shared.js';

const PH = { solid: ['blue', 'solid'], liquid: ['teal', 'liquid'], gas: ['orange', 'gas'], sc: ['purple', 'supercritical fluid'], unmodelled: ['muted', 'high-pressure phases not modelled'] };

/** Rejection-sampled point cloud in the unit square (a crude liquid/gas snapshot). */
function cloud(n, dmin, seed, r) {
  const rng = r(seed), pts = [];
  for (let tries = 0; pts.length < n && tries < 20000; tries++) {
    const p = [0.06 + 0.88 * rng(), 0.06 + 0.88 * rng()];
    if (pts.every((q) => Math.hypot(p[0] - q[0], p[1] - q[1]) > dmin)) pts.push(p);
  }
  return pts;
}
function lattice(r, seed) {
  const rng = r(seed), pts = [];
  for (let j = 0; j < 7; j++) for (let i = 0; i < 7; i++) pts.push([0.1 + 0.8 * (i + (j % 2) * 0.5) / 6.5 + 0.012 * (rng() - 0.5), 0.08 + 0.84 * j / 6 + 0.012 * (rng() - 0.5)]);
  return pts.filter((p) => p[0] < 0.95);
}

// ---- 4.6: melting line of ice near 0 degC, p in MPa -------------------------------------------------------
const SLOPE_MPA = 13.5;           // |dp/dT| of the ice-water line, MPa/K (Clapeyron value from 6.01 kJ/mol and -1.63 cm3/mol)

export default {
  collection: 'pchem',
  chapter: 4,
  title: 'Phase transitions of pure substances',
  summary: String.raw`A phase diagram is a map of which phase has the lowest chemical potential at each temperature and pressure. The Clapeyron equation gives the slope of each coexistence line, and its vapour-pressure version, Clausius–Clapeyron, explains why water boils at a lower temperature on a mountain. Water's backward-leaning melting line, the supercritical region where liquid and gas merge, surfaces and curvature (Young–Laplace, Kelvin, capillary rise) complete the picture of a single substance.`,
  items: [
    {
      num: '4.1', kind: 'Concept', name: 'Phase diagram of a pure substance',
      statement: String.raw`For a pure substance in equilibrium, the pressure–temperature plane is divided into regions in which a single phase (solid, liquid, gas) is the stable one. Regions are separated by coexistence curves (sublimation, melting, vaporization) on which two phases are in equilibrium. The three curves meet at the triple point, where all three coexist; the vaporization curve ends at the critical point, beyond which liquid and gas are no longer distinguishable and one speaks of a supercritical fluid.`,
      idea: String.raw`Each point $(T,p)$ is occupied by whichever phase has the smallest molar Gibbs energy (pchem-4.2); on a curve two phases tie, at the triple point three tie. The vaporization curve stops at the critical point of pchem-1.15 because there the liquid and gas branches of the equation of state merge. Because $\mathrm{d}p/\mathrm{d}T=\Delta S/\Delta V$ (pchem-4.3), a transition that opens a big volume (boiling) has a gentle curve and one with a small volume change (melting) a steep one; for water $\Delta V_{\text{fus}}<0$, so the melting curve leans backwards.`,
      caption: String.raw`Drag the state point across the diagram of water or CO$_2$ (log pressure axis) and watch the molecular snapshot change as you cross each line. Note that CO$_2$ at 1 bar has no liquid region (it sublimes), while water at 1 bar is liquid between 273 K and 373 K. The triple and critical points are marked with their values.`,
      deps: ['pchem-1.15'],
      refs: ['Atkins 4A', 'M–S ch. 23'],
      tags: ['phase diagram', 'triple point', 'critical point'],
      scope: String.raw`The curves are **reconstructions** through standard anchor points, not tabulated data: the vaporization curve is $\ln(p/p_c)=Ax+Bx^2$ with $x=1-T_c/T$ fitted through the triple, critical and one more point (normal boiling point of water; $p\approx 34.85$ bar at 273.15 K for CO$_2$), the sublimation curve is a Clausius–Clapeyron line through the triple point, and the melting lines use the Clapeyron slope (water: $-135$ bar/K, bending slightly to end at the IAPWS ice Ih–ice III–liquid point, 2085.66 bar and 251.165 K; CO$_2$: about $+46$ bar/K from $\Delta_{\text{fus}}H\approx 9.0$ kJ/mol and an assumed $\Delta V\approx 9$ cm$^3$/mol). Other solid phases (ice II, III, V, …) are not drawn. Anchors: water $T_t=273.16$ K, $p_t=611.657$ Pa, $T_c=647.096$ K, $p_c=22.064$ MPa; CO$_2$ $T_t=216.58$ K, $p_t=5.185$ bar, $T_c=304.13$ K, $p_c=73.77$ bar.`,
      verify: true,
      viz(v) {
        const sel = v.select('substance', [{ value: 'water', label: 'water' }, { value: 'co2', label: 'CO₂' }], 'water');
        const s = v.stage({ x: [200, 700], y: [1e-4, 1e4], ylog: true, axes: 'box', gutter: true, xlabel: '$T$ / K', ylabel: '$p$ / bar', height: 380, weight: 2, minWidth: 320, title: 'phase diagram (log pressure axis)' });
        const sn = v.stage({ x: [0, 1], y: [0, 1], equal: true, axes: false, height: 380, weight: 1, minWidth: 220, title: 'molecular snapshot' });
        const clouds = { solid: lattice(v.rng, 3), liquid: cloud(40, 0.115, 5, v.rng), gas: cloud(7, 0.25, 8, v.rng), sc: cloud(22, 0.17, 11, v.rng) };
        const start = { water: [300, 1], co2: [250, 20] };
        const h = s.handle(300, 1, { color: 'ink', r: 8, constrain: { x: [200, 700], y: [1e-4, 1e4] } });
        let cur = 'water';
        const setSub = () => {
          const S = SUBST[sel.value];
          s.setView(S.T, S.p);
          h.set(...start[sel.value]); h.constrain = { x: S.T, y: S.p };
          cur = sel.value;
        };
        v.animate(() => {
          if (cur !== sel.value) setSub();
          const S = SUBST[sel.value], [T0, T1] = S.T, [p0, p1] = S.p;
          const cols = Object.fromEntries(Object.entries(PH).map(([k, [c]]) => [k, v.ramp(0.28, c)]));
          s.raster((x, y) => cols[phaseOf(S, x, y)], { res: 3, key: `pd-${sel.value}-${v.color('panel')}` });
          const sub = [], vap = [], mel = [];
          for (let i = 0; i <= 120; i++) { const T = T0 + (S.Tt - T0) * i / 120; sub.push([T, S.ps(T)]); }
          for (let i = 0; i <= 160; i++) { const T = S.Tt + (S.Tc - S.Tt) * i / 160; vap.push([T, S.pv(T)]); }
          for (let i = 0; i <= 80; i++) { const p = S.pt * Math.pow(S.pmaxMelt / S.pt, i / 80); mel.push([S.Tm(p), p]); }
          s.path(sub, { color: 'ink', width: 2 }); s.path(vap, { color: 'ink', width: 2 }); s.path(mel, { color: 'ink', width: 2 });
          s.dot(S.Tt, S.pt, { r: 5, color: 'red', label: `triple point (${v.fix(S.Tt, 2)} K, ${v.fmt(S.pt, 4)} bar)`, labelPos: 'se' });
          s.dot(S.Tc, S.pc, { r: 5, color: 'red', label: `critical point (${v.fix(S.Tc, 1)} K, ${v.fmt(S.pc, 4)} bar)`, labelPos: 'nw' });
          const ph = phaseOf(S, h.x, h.y), [c] = PH[ph];
          h.color = c;
          const q = clouds[ph] || [];
          sn.rect(0.02, 0.02, 0.98, 0.98, { color: 'muted', fill: false, radius: 8 });
          const jit = ph === 'solid' ? 0.004 : ph === 'liquid' ? 0.01 : 0.02;
          q.forEach(([x, y], i) => {
            const a = v.t * (1.5 + (i % 5) * 0.4) + i * 2.1;
            sn.dot(x + jit * Math.cos(a), y + jit * Math.sin(a * 1.3), { r: ph === 'gas' ? 6 : 7, color: c });
          });
          sn.corner(PH[ph][1], 'tl', { plate: true, color: c });
        }, { period: 20, still: 1 });
        v.legend([['blue', 'solid'], ['teal', 'liquid'], ['orange', 'gas'], ['purple', 'supercritical fluid']]);
        v.readout(() => {
          const S = SUBST[sel.value], ph = phaseOf(S, h.x, h.y);
          return `state point: $T=${v.fix(h.x, 1)}$ K, $p=${v.fmt(h.y, 3)}$ bar → **${PH[ph][1]}**\nAt 1 atm: ${sel.value === 'water' ? 'melts at 273.15 K and boils at 373.12 K' : `sublimes at ${v.fix(S.Tsub, 2)} K (no liquid below the triple pressure ${v.fix(S.pt, 3)} bar)`}.`;
        });
      },
    },
    {
      num: '4.2', kind: 'Principle', name: 'Phase stability: lowest chemical potential wins',
      statement: String.raw`At fixed $T$ and $p$ a pure substance present in several phases is stable in the phase of lowest molar Gibbs energy $\mu(T,p)$ (the chemical potential). Two phases coexist exactly where their chemical potentials are equal, and the slopes follow from $\mathrm{d}\mu=-S_m\,\mathrm{d}T+V_m\,\mathrm{d}p$: $\mu$ falls with $T$ at a rate equal to the molar entropy, so the gas (largest $S_m$) overtakes the liquid, and the liquid the solid, as $T$ rises. Raising $p$ raises each $\mu$ by $V_m\,\mathrm{d}p$, which moves the gas curve most.`,
      idea: String.raw`Spontaneous change at constant $T$, $p$ lowers $G$ (pchem-3.10), so matter flows into the phase with smaller $\mu$ until the two $\mu$ are equal. The schematic $\mu(T)$ curves are affine at fixed pressure, with slopes $-S_{\text{solid}}>-S_{\text{liquid}}>-S_{\text{gas}}$ (pchem-3.12), so as the temperature rises the stable branch passes solid, liquid, gas; the crossing temperatures are the melting and boiling points. Since $V_{\text{gas}}\gg V_{\text{liq}}$, pressure shifts $\mu_{\text{gas}}$ strongly and the others hardly at all.`,
      caption: String.raw`The three lines are $\mu(T)$ for ice, liquid water and vapour at the chosen pressure; the stable (lowest) branch is thickened and the strip below the plot shows which phase it is. Move the pressure slider: the boiling point slides along with the gas line, the melting point barely moves, and below the triple pressure the liquid never appears (sublimation).`,
      deps: ['pchem-3.10', 'pchem-4.1'],
      refs: ["Tong §§4.4, 5.1.1, Eqs. (4.21)–(4.22), (5.3)–(5.5)"],
      tags: ['chemical potential', 'stability', 'phase diagram'],
      scope: String.raw`A **model**: constant molar entropies $S_{\text{ice}}=41$, $S_{\text{liq}}=63$, $S_{\text{gas}}=172$ J/(K·mol) (chosen so that $\Delta_{\text{fus}}S=22.0$ and $\Delta_{\text{vap}}S=109$ J/(K·mol), i.e. $6.01$ kJ/mol at 273.15 K and $40.66$ kJ/mol at 373.15 K), perfect-gas pressure dependence $RT\ln p$ for the vapour and constant molar volumes $19.65$ and $18.02$ cm$^3$/mol for ice and liquid. The model's triple pressure (about 8 mbar) is therefore a little higher than the real 6.1 mbar.`,
      viz(v) {
        const Ss = 41, Sl = 63, Sg = 172, Tm0 = 273.15, Tb0 = 373.15, Vs = 19.65e-6, Vl = 18.02e-6;
        const lp = v.slider('pressure $p$ (bar)', 1e-3, 3000, 1, { log: true, sig: 2, fmt: (x) => (x < 1 ? x.toPrecision(2) : x.toFixed(x < 10 ? 2 : 0)) + ' bar' });
        const mu = (ph, T, p) => {
          const dP = (p - 1) * 1e5;
          if (ph === 0) return -Ss * (T - Tm0) + Vs * dP;
          if (ph === 1) return -Sl * (T - Tm0) + Vl * dP;
          return -Sl * (Tb0 - Tm0) - Sg * (T - Tb0) + R * T * Math.log(p);
        };
        const low = (T, p) => { const m = [mu(0, T, p), mu(1, T, p), mu(2, T, p)]; return m.indexOf(Math.min(...m)); };
        const s = v.stage({ x: [240, 420], y: [-14, 36], axes: 'box', gutter: true, xlabel: '$T$ / K', ylabel: '$\\mu$ / (kJ/mol)', height: 380, title: 'chemical potential of each phase' });
        const sz = v.stage({ x: [255, 292], y: [-500, 500], axes: 'box', gutter: true, xlabel: '$T$ / K', ylabel: '$\\mu_{\\text{ice}}-\\mu_{\\text{liq}}$ / (J/mol)', height: 380, weight: 0.8, minWidth: 260, title: 'zoom: melting' });
        const cols = ['blue', 'teal', 'orange'], names = ['solid', 'liquid', 'gas'];
        let trans = [];
        v.render(() => {
          const p = lp.value;
          const allMu = [240, 420].flatMap(T => [0, 1, 2].map(k => mu(k, T, p) / 1000));
          const bottom = Math.min(-14, ...allMu) - 2, upper = Math.max(36, ...allMu) + 2;
          s.setView([240, 420], [bottom, upper]);
          const prof = [];
          for (let i = 0; i <= 360; i++) { const T = 240 + 180 * i / 360; prof.push([T, low(T, p)]); }
          trans = [];
          for (let i = 1; i < prof.length; i++) if (prof[i][1] !== prof[i - 1][1]) {
            let a = prof[i - 1][0], b = prof[i][0];
            for (let k = 0; k < 40; k++) { const m = (a + b) / 2; if (low(m, p) === prof[i - 1][1]) a = m; else b = m; }
            trans.push([(a + b) / 2, prof[i - 1][1], prof[i][1]]);
          }
          for (let i = 1; i < prof.length; i++) s.rect(prof[i - 1][0], bottom, prof[i][0], bottom + .035 * (upper - bottom), { fill: cols[prof[i][1]], fillAlpha: 0.7, stroke: false });
          for (let k = 0; k < 3; k++) s.fn((T) => mu(k, T, p) / 1000, { color: cols[k], width: 1.6, alpha: 0.9 });
          s.fn((T) => mu(low(T, p), T, p) / 1000, { color: 'ink', width: 4.5, alpha: 0.3 });
          for (const [T, , j] of trans) s.dot(T, mu(j, T, p) / 1000, { r: 5, color: 'red', label: `${v.fix(T, 1)} K`, labelPos: 'ne' });
          sz.hline(0, { color: 'teal', width: 2 });
          sz.fn((T) => mu(0, T, p) - mu(1, T, p), { color: 'blue', width: 2.2 });
          sz.text('ice is stable below', 256, 440, { size: 11, color: 'muted' });
          const Tmz = Tm0 + (Vs - Vl) * (p - 1) * 1e5 / (Ss - Sl);
          sz.dot(Tmz, 0, { r: 5, color: 'red', label: `${v.fix(Tmz, 2)} K`, labelPos: 'ne' });
          s.text('ice', 246, mu(0, 246, p) / 1000 - 1.6, { color: 'blue' });
          s.text('liquid', 246, mu(1, 246, p) / 1000 + 1.6, { color: 'teal' });
          s.text('vapour', 392, mu(2, 392, p) / 1000 + 2.8, { color: 'orange' });
        });
        v.legend([['blue', 'solid'], ['teal', 'liquid'], ['orange', 'gas'], ['ink', 'lowest μ = stable', { dash: false }]]);
        v.readout(() => {
          const seq = trans.length ? trans.map(([T, a, b]) => `${names[a]} → ${names[b]} at $${v.fix(T, 1)}$ K`).join('; ') : 'no transition in this range';
          const Tbc = 1 / (1 / Tb0 - R * Math.log(lp.value) / 40660);
          return `at $p=${v.fmt(lp.value, 3)}$ bar: ${seq}\nClausius–Clapeyron (pchem-4.4) with constant $\\Delta_{\\text{vap}}H=40.66$ kJ/mol predicts the boiling point $${v.fix(Tbc, 1)}$ K ${trans.length && trans.some((t) => t[2] === 2 && t[1] === 1) ? '— an approximation that neglects condensed-phase pressure shifts' : ''}`;
        });
      },
    },
    {
      num: '4.3', kind: 'Theorem', name: 'Clapeyron equation',
      statement: String.raw`Along a coexistence curve between phases $\alpha$ and $\beta$ of a pure substance the slope is
$$\frac{\mathrm{d}p}{\mathrm{d}T}=\frac{\Delta_{\text{trs}}S}{\Delta_{\text{trs}}V}=\frac{\Delta_{\text{trs}}H}{T\,\Delta_{\text{trs}}V},$$
where $\Delta_{\text{trs}}H$ and $\Delta_{\text{trs}}V$ are the molar enthalpy and volume of the transition at that point. The sign of $\Delta V$ decides whether the line leans forward or backward; the size of $\Delta V$ decides how steep it is.`,
      idea: String.raw`On the curve $\mu_\alpha(T,p)=\mu_\beta(T,p)$ and it stays true after a small step $(\mathrm{d}T,\mathrm{d}p)$ along the curve, so $\mathrm{d}\mu_\alpha=\mathrm{d}\mu_\beta$. Inserting $\mathrm{d}\mu=-S_m\mathrm{d}T+V_m\mathrm{d}p$ (pchem-3.12) gives $-S_\alpha\mathrm{d}T+V_\alpha\mathrm{d}p=-S_\beta\mathrm{d}T+V_\beta\mathrm{d}p$, i.e. $\Delta S\,\mathrm{d}T=\Delta V\,\mathrm{d}p$. At equilibrium $\Delta S=\Delta H/T$ because the transition is reversible at constant $T$ and $p$ (pchem-4.2).`,
      caption: String.raw`Choose a transition. The plot is a magnified window around the transition point (offsets $\mathrm{d}T$, $\mathrm{d}p$); the dashed line is the Clapeyron slope $\Delta H/(T\Delta V)$. Drag the point off the line: the colour (and the bars below) show which phase has the lower $\mu$, because $\mu_\beta-\mu_\alpha=-\Delta S\,\mathrm{d}T+\Delta V\,\mathrm{d}p$ no longer vanishes. The bars cancel exactly on the line.`,
      deps: ['pchem-4.2', 'pchem-3.12'],
      refs: ['Atkins 4B', 'M–S ch. 23'],
      tags: ['Clapeyron', 'coexistence curve', 'latent heat'],
      credit: 'Clapeyron, 1834 (graphical form); thermodynamic derivation by Clausius, 1850',
      scope: String.raw`Any first-order transition of a pure substance. The numbers are standard values at the transition points: water melting at 273.15 K ($\Delta H=6.01$ kJ/mol, $\Delta V=-1.63$ cm$^3$/mol); water boiling at 373.12 K ($40.66$ kJ/mol; $\Delta V=30.12$ L/mol from steam-table molar volumes of vapour and liquid); CO$_2$ sublimation at 194.69 K ($26.1$ kJ/mol; $\Delta V\approx RT/p=15.97$ L/mol, the solid's volume being negligible); CO$_2$ melting at 216.58 K ($9.02$ kJ/mol, $\Delta V\approx +9$ cm$^3$/mol, an estimate).`,
      verify: true,
      viz(v) {
        const TR = {
          wm: { name: 'water: ice → liquid', T: 273.15, H: 6010, dV: -1.63e-6, win: [1.5, 150], ref: null },
          wb: { name: 'water: liquid → vapour', T: 373.124, H: 40660, dV: 30.12e-3, win: [8, 0.5], ref: 'antoine' },
          cs: { name: 'CO₂: solid → vapour', T: 194.69, H: 26150, dV: 8.314462618 * 194.69 / 101325, win: [8, 1.1], ref: null },
          cm: { name: 'CO₂: solid → liquid', T: 216.58, H: 9020, dV: 9.0e-6, win: [4, 250], ref: null },
        };
        const sel = v.select('transition', Object.entries(TR).map(([k, t]) => ({ value: k, label: t.name })), 'wm');
        const s = v.stage({ x: [-1, 1], y: [-1, 1], axes: 'box', gutter: true, height: 340, weight: 1.4, minWidth: 300, xlabel: 'dT / K', ylabel: 'dp / bar', title: 'window around the transition point' });
        const sb = v.stage({ x: [0.4, 3.6], y: [-1, 1], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 240, ylabel: 'μ terms / (J/mol)', xticks: [[1, '−ΔS dT'], [2, 'ΔV dp'], [3, 'Δμ']], title: 'chemical-potential bookkeeping' });
        const h = s.handle(0.5, 0.4, { color: 'ink', r: 8 });
        let cur = '';
        v.render(() => {
          const t = TR[sel.value];
          if (cur !== sel.value) { cur = sel.value; s.setView([-t.win[0], t.win[0]], [-t.win[1], t.win[1]]); h.set(t.win[0] * 0.5, t.win[1] * 0.4); }
          const slope = t.H / (t.T * t.dV) / 1e5;       // bar/K
          const dT = h.x, dp = h.y;
          const dmu = -t.H / t.T * dT + t.dV * dp * 1e5;     // mu_beta − mu_alpha
          const lo = 'blue', hi = 'orange';
          const A = t.win[0], B = t.win[1];
          // phase colouring: dmu<0 → beta (high-T phase side) stable
          s.raster((x, y) => { const d = -t.H / t.T * x + t.dV * y * 1e5; return d < 0 ? v.ramp(0.28, hi) : v.ramp(0.28, lo); }, { res: 3, key: `cl-${sel.value}-${v.color('panel')}` });
          s.line(-A, -slope * A, A, slope * A, { color: 'ink', width: 2.2, dash: true });
          s.text('Clapeyron slope', A * 0.1, slope * A * 0.1, { color: 'ink', dx: 8, dy: -10, size: 11 });
          s.dot(0, 0, { r: 4, color: 'ink' });
          // bars
          const a = t.H / t.T * dT, b = t.dV * dp * 1e5, m = Math.max(1, Math.abs(a), Math.abs(b), Math.abs(dmu)) * 1.25;
          sb.setView([0.4, 3.6], [-m, m]);
          sb.hline(0, { color: 'muted' });
          sb.bars([-a, b, dmu], { x0: 1, dx: 1, color: (val, i) => (i < 2 ? (i === 0 ? 'red' : 'blue') : (dmu < 0 ? 'orange' : 'blue')) });
          sb.corner(dmu < 0 ? `${t.name.split('→ ')[1]} side is stable` : `${t.name.split(' →')[0].split(': ')[1]} side is stable`, 'tr', { plate: true });
        });
        v.legend([['blue', 'low-T phase stable'], ['orange', 'high-T phase stable']]);
        v.readout(() => {
          const t = TR[sel.value], slope = t.H / (t.T * t.dV);
          let extra = '';
          if (t.ref === 'antoine') {
            const d = (antoineW(373.0) - antoineW(372.9)) / 0.1 * 1e5;
            extra = `\nindependent check: slope of the Antoine fit to measured vapour pressures (NIST WebBook, Stull) near 372.95 K is $${v.fix(d / 1000, 2)}$ kPa/K — ${v.fix(100 * Math.abs(d - slope) / Math.abs(slope), 1)}% difference; this is a fitted-data derivative`;
          }
          return `$\\Delta_{\\text{trs}}S=${v.fix(t.H / t.T, 1)}$ J/(K·mol), $\\Delta_{\\text{trs}}V=${v.sci(t.dV, 3)}$ m³/mol → $\\mathrm{d}p/\\mathrm{d}T=${v.fix(slope / 1e5, 4)}$ bar/K $=${v.fix(slope / 1e3, 1)}$ kPa/K${extra}`;
        });
      },
    },
    {
      num: '4.4', kind: 'Law', name: 'Clausius–Clapeyron equation',
      statement: String.raw`For vaporization (or sublimation) well below the critical point, with the vapour treated as a perfect gas and the condensed volume neglected, $\Delta V\approx RT/p$ and the Clapeyron equation becomes
$$\frac{\mathrm{d}\ln p}{\mathrm{d}T}=\frac{\Delta_{\text{vap}}H}{RT^2}\quad\Longrightarrow\quad \ln\frac{p_2}{p_1}=-\frac{\Delta_{\text{vap}}H}{R}\Big(\frac1{T_2}-\frac1{T_1}\Big)$$
if $\Delta_{\text{vap}}H$ is constant. A plot of $\ln p$ against $1/T$ is then a straight line of slope $-\Delta_{\text{vap}}H/R$.`,
      idea: String.raw`Start from $\mathrm{d}p/\mathrm{d}T=\Delta H/(T\Delta V)$ (pchem-4.3) and use $\Delta V=V_{\text{gas}}-V_{\text{liq}}\approx V_{\text{gas}}=RT/p$ (pchem-1.4), so $\mathrm{d}p/p=\Delta H\,\mathrm{d}T/(RT^2)$. Integrating with $\Delta H$ constant gives the line. In reality $\Delta H$ falls with $T$ (it vanishes at the critical point) and the gas is not perfect, so the plot curves slightly.`,
      caption: String.raw`Left: $\ln p$ of water against $1000/T$ using the Antoine fit to measured vapour pressures. Drag the two points: the dashed secant has slope $-\Delta H_{\text{app}}/R$; compare the enthalpy you read off with the literature values at 298 K and 373 K. Right: slide the altitude, and compare the boiling point predicted by the straight-line law (from 1 atm) with the Antoine curve.`,
      deps: ['pchem-4.3', 'pchem-1.4', 'thermo-4.6'],
      refs: ["Tong §5.1.2; NIST Chemistry WebBook water Antoine coefficients (Stull, 1947)"],
      tags: ['vapour pressure', 'Clausius–Clapeyron', 'boiling point'],
      credit: 'Clausius–Clapeyron approximation',
      scope: String.raw`Low to moderate pressures ($p\ll p_c$) with $V_{\text{gas}}\gg V_{\text{liq}}$. The "data" curve is the Antoine equation $\log_{10}(p/\text{bar})=4.6543-1435.264/(T/\text{K}-64.848)$ (Stull 1947, listed by the NIST WebBook for 255.9–373 K), with no universal fit-error bound asserted; the sea-level inversion slightly extrapolates past 373 K. Heights use the dry standard-atmosphere tropospheric power law, a model rather than weather data. Literature: $\Delta_{\text{vap}}H=40.66$ kJ/mol at 373 K and 44.0 kJ/mol at 298 K.`,
      viz(v) {
        const s = v.stage({ x: [2.6, 3.8], y: [-5.4, 0.3], axes: 'box', gutter: true, xlabel: '$1000\\,\\mathrm{K}/T$', ylabel: '$\\ln(p/\\mathrm{bar})$', height: 360, weight: 1.4, minWidth: 300, title: 'ln p against 1/T for water' });
        const s2 = v.stage({ x: [0, 9], y: [320, 380], axes: 'box', gutter: true, xlabel: 'altitude / km', ylabel: 'boiling point / K', height: 360, weight: 1, minWidth: 260, title: 'boiling point against altitude' });
        const hA = s.handle(1000 / 363, Math.log(antoineW(363)), { color: 'orange', r: 7, label: '1', constrain: (x) => [Math.min(3.78, Math.max(1000 / 373, x)), Math.log(antoineW(1000 / Math.min(3.78, Math.max(1000 / 373, x))))] });
        const hB = s.handle(1000 / 283, Math.log(antoineW(283)), { color: 'purple', r: 7, label: '2', constrain: (x) => [Math.min(3.78, Math.max(1000 / 373, x)), Math.log(antoineW(1000 / Math.min(3.78, Math.max(1000 / 373, x))))] });
        const alt = v.slider('altitude $h$', 0, 8849, 0, { step: 10, fmt: (x) => `${(x / 1000).toFixed(2)} km` });
        const dHc = v.slider('assumed constant $\\Delta H$', 35, 48, 40.66, { step: 0.01, fmt: (x) => `${x.toFixed(2)} kJ/mol` });
        const invA = (p) => 1435.264 / (4.6543 - Math.log10(p)) + 64.848;
        let sec = 0;
        v.render(() => {
          s.fn((x) => Math.log(antoineW(1000 / x)), { domain: [1000 / 373, 1000 / 255.9], color: 'accent', width: 2.2 });
          s.fn((x) => Math.log(ATM) - dHc.value * 1000 / R * (x / 1000 - 1 / 373.124), { domain: [2.6, 3.9], color: 'green', width: 1.6, dash: true });
          const x1 = hA.x, y1 = hA.y, x2 = hB.x, y2 = hB.y;
          sec = Math.abs(x2 - x1) < 1e-10 ? -Math.LN10 * 1435.264 * 1e6 / (1000 - 64.848 * x1) ** 2 : (y2 - y1) / (x2 - x1) * 1000;         // d ln p / d(1/T) in K
          s.line(x1 - 0.3, y1 - 0.3 * sec / 1000, x2 + 0.3, y2 + 0.3 * sec / 1000, { color: 'ink', width: 1.5, dash: true });
          s.dot(1000 / 373.124, Math.log(ATM), { r: 4, color: 'muted', label: '1 atm', labelPos: 'ne' });
          const p = pAlt(alt.value * 1);
          s.hline(Math.log(p), { color: 'muted', dash: true });
          s2.fn((h) => { const pp = pAlt(h * 1000); return invA(pp); }, { color: 'accent', width: 2.2 });
          s2.fn((h) => 1 / (1 / 373.124 - R * Math.log(pAlt(h * 1000) / ATM) / (dHc.value * 1000)), { color: 'green', width: 1.8, dash: true });
          const h = alt.value / 1000;
          s2.dot(h, invA(p), { r: 6, color: 'accent' });
          s2.dot(h, 1 / (1 / 373.124 - R * Math.log(p / ATM) / (dHc.value * 1000)), { r: 5, color: 'green' });
          s2.vline(h, { color: 'muted', dash: true });
        });
        v.legend([['accent', 'Antoine fit to measured data'], ['green', 'straight-line law with constant ΔH', { dash: true }], ['ink', 'secant through points 1, 2', { dash: true }]]);
        v.readout(() => {
          const p = pAlt(alt.value), Tb = invA(p), Tcc = 1 / (1 / 373.124 - R * Math.log(p / ATM) / (dHc.value * 1000));
          return `secant between points 1 and 2: $\\Delta H_{\\text{app}}=-R\\cdot\\text{slope}=${v.fix(-R * sec / 1000, 2)}$ kJ/mol, at $T\\approx${v.fix(2000 / (hA.x + hB.x), 0)}$ K\nat $h=${v.fix(alt.value / 1000, 2)}$ km: $p=${v.fix(p * 100, 1)}$ kPa, boiling point $${v.fix(Tb, 1)}$ K ($${v.fix(Tb - 273.15, 1)}$ °C) from the data fit, $${v.fix(Tcc, 1)}$ K from the straight line`;
        });
      },
    },
    {
      num: '4.5', kind: 'Phenomenon', name: 'Triple point',
      statement: String.raw`Three specified phases of a pure substance coexist at an isolated temperature and pressure. A substance with several solid polymorphs can have several triple points; this panel concerns ice Ih, liquid water and vapour. For water it is 273.16 K and 611.657 Pa (about 6 mbar). At the triple point the three curves meet with different slopes, because $\Delta_{\text{sub}}H=\Delta_{\text{fus}}H+\Delta_{\text{vap}}H$ exceeds $\Delta_{\text{vap}}H$; in the ideal-vapour, negligible-condensed-volume approximation, on a $\ln p$ plot the sublimation curve is steeper than the vaporization curve by $\Delta_{\text{fus}}H/(RT^2)$.`,
      idea: String.raw`Two conditions $\mu_s=\mu_l$ and $\mu_l=\mu_g$ in the two unknowns $T$ and $p$ generically fix an isolated point (the phase rule of pchem-6.1 says $F=3-3=0$). The slopes at that point come from Clausius–Clapeyron (pchem-4.4) with $\Delta H=\Delta_{\text{sub}}H$ below and $\Delta_{\text{vap}}H$ above, and the difference is the enthalpy of fusion. Because the triple point of water is a reproducible fixed point, it was used from 1954 until 2019 to define the kelvin as $1/273.16$ of its temperature; since the 2019 redefinition via the Boltzmann constant its thermodynamic temperature is measured, with the best estimate remaining near 273.16 K; ITS-90 still assigns this fixed point 273.16 K.`,
      caption: String.raw`A close-up of water near its triple point (log pressure). Drag the state point, or press the button to jump to the triple point: the button selects the triple point and shows all three phases. Elsewhere the vessel shows the stable phase in this schematic model. The dashed continuations are the metastable curves (supercooled water, superheated ice). Compare the kink in the log-pressure slope with $\Delta_{\text{fus}}H/RT^2$.`,
      deps: ['pchem-4.1', 'pchem-4.4'],
      refs: ["IAPWS R14-08(2011), §§3–4 and Table 1","BIPM CGPM1954 Resolution3; MeP-K-19D §2"],
      tags: ['triple point', 'phase rule', 'temperature scale'],
      credit: 'Triple point of water as the kelvin’s defining point: 10th CGPM, 1954; replaced by the Boltzmann-constant definition in 2019',
      scope: String.raw`The curves are Clausius–Clapeyron lines anchored at the triple point with $\Delta_{\text{vap}}H=45.05$ kJ/mol, $\Delta_{\text{sub}}H=51.06$ kJ/mol, $\Delta_{\text{fus}}H=6.01$ kJ/mol (literature values near 0 °C, taken as constant over the window, so a model); the melting line is drawn with its local rounded, almost vertical slope of $-135$ bar/K.`,
      viz(v) {
        const Tt = 273.16, pt = 611.657, dHv = 45.05e3, dHs = 51.06e3, dHf = dHs - dHv;
        const pvap = (T) => pt * Math.exp(-dHv / R * (1 / T - 1 / Tt)), psub = (T) => pt * Math.exp(-dHs / R * (1 / T - 1 / Tt));
        const s = v.stage({ x: [255, 290], y: [100, 3000], ylog: true, axes: 'box', gutter: true, xlabel: '$T$ / K', ylabel: '$p$ / Pa', height: 380, weight: 1.6, minWidth: 320, title: 'water near the triple point' });
        const sv = v.stage({ x: [0, 1], y: [0, 1], equal: true, axes: false, height: 380, weight: 1, minWidth: 220, title: 'the vessel' });
        const h = s.handle(266, 400, { color: 'ink', r: 8, constrain: { x: [255, 290], y: [100, 3000] } });
        v.button('jump to the triple point', () => h.set(Tt, pt));
        const tol = (x, y) => Math.abs(x - Tt) < 1e-8 && Math.abs(Math.log(y / pt)) < 1e-8;
        let state = '';
        v.animate(() => {
          const near = tol(h.x, h.y);
          const cs = { solid: v.ramp(0.28, 'blue'), liquid: v.ramp(0.28, 'teal'), gas: v.ramp(0.28, 'orange') };
          const ph = (x, y) => y < pt ? (y > psub(x) ? 'solid' : 'gas') : x < Tt - (y - pt) / 1.35e7 ? 'solid' : y > pvap(x) ? 'liquid' : 'gas';
          s.raster((x, y) => cs[ph(x, y)], { res: 3, key: `tp-${v.color('panel')}` });
          s.fn(psub, { domain: [255, Tt], color: 'ink', width: 2.2 });
          s.fn(pvap, { domain: [Tt, 290], color: 'ink', width: 2.2 });
          s.fn(psub, { domain: [Tt, 290], color: 'ink', width: 1.2, dash: true, alpha: 0.7 });
          s.fn(pvap, { domain: [255, Tt], color: 'ink', width: 1.2, dash: true, alpha: 0.7 });
          s.line(Tt, pt, Tt - (3000 - pt) / 1.35e7, 3000, { color: 'ink', width: 2.2 });
          s.dot(Tt, pt, { r: 5, color: 'red', label: 'triple point', labelPos: 'se' });
          s.text('solid', 259, 1500, { color: 'blue', size: 14 }); s.text('gas', 282, 150, { color: 'orange', size: 14 }); s.text('liquid', 281.5, 2000, { color: 'teal', size: 14 });
          const p = near ? 'triple' : ph(h.x, h.y);
          state = p;
          // vessel
          sv.rect(0.12, 0.05, 0.88, 0.95, { color: 'ink', fill: false, width: 2, radius: 8 });
          const layers = p === 'triple' ? [['gas', 0.55, 0.95], ['liquid', 0.25, 0.55], ['solid', 0.05, 0.25]] : p === 'solid' ? [['solid', 0.05, 0.4]] : p === 'liquid' ? [['liquid', 0.05, 0.5]] : [['gas', 0.05, 0.95]];
          for (const [k, y0, y1] of layers) {
            const c = { solid: 'blue', liquid: 'teal', gas: 'orange' }[k];
            sv.rect(0.13, y0, 0.87, y1, { fill: c, fillAlpha: k === 'gas' ? 0.1 : 0.35, stroke: false });
            if (k === 'gas') for (let i = 0; i < 6; i++) sv.dot(0.2 + 0.12 * i + 0.02 * Math.sin(v.t + i), (y0 + y1) / 2 + 0.2 * Math.sin(2 * i + v.t * 0.7), { r: 4, color: c });
            if (k === 'solid') for (let i = 0; i < 5; i++) sv.dot(0.22 + 0.14 * i, (y0 + y1) / 2, { r: 6, color: c });
          }
          if (p === 'triple') sv.corner('ice + water + vapour', 'tl', { plate: true, color: 'red' });
          else sv.corner(p, 'tl', { plate: true });
        }, { period: 20, still: 1 });
        v.readout(() => {
          const kink = dHf / (R * Tt * Tt);
          return `at the triple point $T_t=273.16$ K, $p_t=611.657$ Pa: slope of $\\ln p$ is ${v.fix(dHs / (R * Tt * Tt), 4)} K⁻¹ on the sublimation curve and ${v.fix(dHv / (R * Tt * Tt), 4)} K⁻¹ on the vaporization curve; the difference ${v.fix(kink, 4)} K⁻¹ $=\\Delta_{\\text{fus}}H/RT^2$ with $\\Delta_{\\text{sub}}H=\\Delta_{\\text{fus}}H+\\Delta_{\\text{vap}}H$ ($${v.fix(dHs / 1000, 2)}=${v.fix(dHf / 1000, 2)}+${v.fix(dHv / 1000, 2)}$ kJ/mol)\nstate point: $T=${v.fix(h.x, 2)}$ K, $p=${v.fix(h.y, 0)}$ Pa → ${state === 'triple' ? '**all three phases coexist**' : `**${state}**`}`;
        });
      },
    },
    {
      num: '4.6', kind: 'Paradox', name: 'Water’s negative melting slope and the ice-skating myth',
      statement: String.raw`Ice is less dense than liquid water, so $\Delta_{\text{fus}}V<0$ and the Clapeyron slope of the melting curve is negative, about $-13.5$ MPa per kelvin: pressure lowers the melting point by roughly $0.0074$ K per bar. It is often said that skates glide because the blade's pressure melts the ice beneath. A numerical check shows that this alone cannot explain skating on cold ice: for the default 70 kg and 1 cm$^2$ contact area the linear estimate is only about 0.51 K, far below a 5 K depression. The controls also allow extreme assumed contact areas where the pressure is large enough that this linear model needs checking.`,
      idea: String.raw`From the Clapeyron equation (pchem-4.3), $\mathrm{d}T_m/\mathrm{d}p=T\Delta V/\Delta H=273.15\times(-1.63\times10^{-6})/6010\approx-7.4\times10^{-8}$ K/Pa. The local linear extrapolation to $-10$ °C would require about 135 MPa. The default contact-area assumption supplies much less. This calculation isolates pressure melting; the separate friction-energy budget does not model heat transport, surface premelting or actual blade contact mechanics.`,
      caption: String.raw`The window shows the melting line of ice near 0 °C. The black dot is the skater's state: ice at temperature $T$ and the blade pressure $p=mg/A$. Pressure melting needs the dot to lie in the liquid region, above the line. Drag the dot sideways to change the ice temperature, change mass and blade contact area, and watch how far it stays below the line. The readout also gives a rough energy budget for friction heating.`,
      deps: ['pchem-4.3'],
      refs: ["IAPWS R14-08(2011), §3.1 and Table 1; local Clapeyron model"],
      tags: ['pressure melting', 'skating', 'premelting'],
      credit: 'Negative ice-Ih melting slope',
      scope: String.raw`Quasi-static melting-point depression only; the line is the linear Clapeyron approximation $p=13.5\,\text{MPa/K}\times(273.15\,\text{K}-T)$ (a local approximation near atmospheric pressure; no accuracy bound is claimed at large blade pressures). The friction estimate is an upper bound on the melt rate that ignores conduction into the ice and uses typical, not measured, values of the friction coefficient and speed; the contact areas are illustrative.`,
      viz(v) {
        const m = v.slider('skater mass $m$', 20, 120, 70, { step: 1, fmt: (x) => `${x} kg` });
        const L = v.slider('contact length', 2, 25, 10, { step: 0.5, fmt: (x) => `${x} cm` });
        const W = v.slider('contact width', 0.05, 3, 1, { step: 0.05, fmt: (x) => `${x.toFixed(2)} mm` });
        const mu = v.slider('friction coefficient $\\mu_k$', 0.003, 0.05, 0.01, { log: true, sig: 2 });
        const sp = v.slider('speed', 1, 12, 5, { step: 0.5, fmt: (x) => `${x} m/s` });
        const s = v.stage({ x: [-14, 1], y: [0, 200], axes: 'box', gutter: true, xlabel: 'ice temperature / °C', ylabel: 'pressure / MPa', height: 380, weight: 1.5, minWidth: 320, title: 'melting line of ice' });
        const sb = v.stage({ x: [0.4, 3.6], y: [0, 1], ylog: true, axes: 'box', gutter: true, height: 380, weight: 1, minWidth: 240, ylabel: 'pressure / MPa', xticks: [[1, 'blade'], [2, 'needed at T'], [3, '1 atm']], title: 'what you have against what you need' });
        const h = s.handle(-5, 7, { color: 'ink', r: 8, constrain: { x: [-14, 0.8] } });
        let blade = 0;
        v.render(() => {
          blade = m.value * 9.80665 / (L.value * 1e-2 * W.value * 1e-3) / 1e6;
          const ymax = Math.max(200, 1.15 * blade);
          s.setView([-14, 1], [0, ymax]); h.set(h.x, blade);
          s.raster((x, y) => y > 208.566 ? v.ramp(.25, 'muted') : (y > SLOPE_MPA * -x ? v.ramp(0.3, 'teal') : v.ramp(0.3, 'blue')), { res: 3, key: `ice-${v.color('panel')}` });
          s.line(-14, SLOPE_MPA * 14, 0, 0, { color: 'ink', width: 2.2 });
          s.text('liquid water', -7, 150, { color: 'teal', size: 14 }); s.text('ice', -11, 20, { color: 'blue', size: 14 });
          s.vline(0, { color: 'muted', dash: true });
          const need = SLOPE_MPA * -h.x;
          s.segment([h.x, blade], [h.x, need], { color: 'red', width: 2, dash: true });
          sb.setView([0.4, 3.6], [0.05, 1000]);
          sb.bars([blade, need > 0 ? need : NaN, 0.101], { x0: 1, dx: 1, color: (val, i) => ['accent', 'red', 'muted'][i] });
        });
        v.legend([['teal', 'liquid'], ['blue', 'ice'], ['red', 'shortfall']]);
        v.readout(() => {
          const need = SLOPE_MPA * -h.x, dT = blade / SLOPE_MPA, F = m.value * 9.80665;
          const P = mu.value * F * sp.value, melt = P / 333.6e3 * 1000;     // g/s
          return `blade pressure $p=mg/A=${v.fix(blade, 1)}$ MPa → melting point lowered by $${v.fix(dT, 2)}$ K in the local linear model; ice at $${v.fix(h.x, 1)}$ °C needs $${v.fix(Math.max(0, need), 0)}$ MPa (${need <= 0 ? 'already above the zero-pressure melting temperature' : need > blade ? v.fix(need / blade, 1) + '× the supplied pressure' : 'supplied pressure exceeds the linear threshold'})\nfriction heat $\\mu_k mg v\\approx${v.fix(P, 0)}$ W could melt at most ${v.fix(melt, 2)} g of ice per second ($\\Delta_{\\text{fus}}H=333.6$ J/g) — an upper bound, with no heat conducted away${blade > 208.566 ? ' · pressure is beyond the ice-Ih melting region: no actual phase prediction' : ''}`;
        });
      },
    },
  ],
};
