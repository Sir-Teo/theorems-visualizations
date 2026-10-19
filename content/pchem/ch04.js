// Physical Chemistry — Chapter 4: Phase transitions of pure substances (part 1: phase diagrams and the Clapeyron family)
import { R, ATM } from './ch04.shared.js';
import { PHASE_SUBST as SUBST, phaseRegion as phaseOf, visibleSublimationStart, iceMeltingPressure, iceMeltingTemperature, ICE_IH_PMAX, tripleModel } from './pchem-source-audit-phase.shared.js';
import { modelMu, modelLowest, modelMelting, modelBoiling, TRANSITIONS, vaporPressure as antoineW, inverseVaporPressure, apparentHeat, altitudePressure as pAlt, ccBoiling } from './pchem-source-audit-clapeyron.shared.js';

const PH = { solid: ['blue', 'solid'], liquid: ['teal', 'liquid'], gas: ['orange', 'gas'], sc: ['purple', 'supercritical fluid'] };

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

export default {
  collection: 'pchem',
  chapter: 4,
  title: 'Phase transitions of pure substances',
  summary: String.raw`A phase diagram is a map of which phase has the lowest chemical potential at each temperature and pressure. The Clapeyron equation gives the slope of each coexistence line, and its vapour-pressure version, Clausius–Clapeyron, explains why water boils at a lower temperature on a mountain. Water's backward-leaning melting line, the supercritical region where liquid and gas merge, surfaces and curvature (Young–Laplace, Kelvin, capillary rise) complete the picture of a single substance.`,
  items: [
    {
      num: '4.1', kind: 'Concept', name: 'Phase diagram of a pure substance',
      statement: String.raw`An equilibrium bulk phase diagram of a pure substance maps temperature and pressure to stable phases. Coexistence curves separate regions and meet at triple points for particular sets of phases. The liquid-vapour coexistence curve ends at a critical point; beyond it liquid and gas can be connected continuously. The conventional supercritical region has both $T>T_c$ and $p>p_c$. Additional solid polymorphs can introduce more phase boundaries and triple points than this simplified diagram shows.`,
      idea: String.raw`Each point $(T,p)$ is occupied by whichever phase has the smallest molar Gibbs energy (pchem-4.2); on a curve two phases tie, at the triple point three tie. The vaporization curve stops at the critical point of pchem-1.15 because there the liquid and gas branches of the equation of state merge. Because $\mathrm{d}p/\mathrm{d}T=\Delta S/\Delta V$ (pchem-4.3), a transition that opens a big volume (boiling) has a gentle curve and one with a small volume change (melting) a steep one; for water $\Delta V_{\text{fus}}<0$, so the melting curve leans backwards.`,
      caption: String.raw`Drag the state point on the water or CO₂ diagram (log pressure). The water curves use IAPWS correlations; the CO₂ curves are explicit reconstructions. The snapshots only illustrate molecular order and density, with arbitrary particle numbers and motions. CO₂ has no stable liquid below its normal triple pressure. Temperature and pressure controls follow the selected diagram’s actual bounds.`,
      deps: ['pchem-1.15'],
      refs: ['Atkins 4A', 'M–S ch. 23'],
      tags: ['phase diagram', 'triple point', 'critical point'],
      scope: String.raw`Water: IAPWS IF97 Eq. 30 for liquid-vapour saturation, 273.16–647.096 K; IAPWS R14-08(2011) Eqs. 1 and 6 for ice-Ih melting and sublimation, respectively. Its pressure axis stops at 2000 bar below the ice-Ih melting endpoint; solid polymorphs within the solid region are not distinguished. CO₂: NIST-listed triple anchors 216.58 K/5.185 bar and Suehiro critical anchors 304.18 K/73.80 bar; a quadratic in $1-T_c/T$ also passes through a chosen illustrative 273.15 K/34.85 bar point. CO₂ sublimation is a constant-enthalpy interpolation through the triple and chosen 194.69 K/1-atm anchors; melting is an assumed 45.7 bar/K line. These reconstructions are not a validated CO₂ equation of state. Coexistence amounts, metastability and nucleation are not inferred from the snapshot. Primary phase-equilibrium reasoning: Arovas §§2.12.1–2.12.2.`,
      verify: false,
      viz(v) {
        const sel = v.select('substance', [{ value: 'water', label: 'water' }, { value: 'co2', label: 'CO₂' }], 'water');
        const s = v.stage({ x: [200, 700], y: [1e-4, 1e4], ylog: true, axes: 'box', gutter: true, xlabel: '$T$ / K', ylabel: '$p$ / bar', height: 380, weight: 2, minWidth: 320, title: 'phase diagram (log pressure axis)' });
        const sn = v.stage({ x: [0, 1], y: [0, 1], equal: true, axes: false, height: 380, weight: 1, minWidth: 220, title: 'molecular snapshot' });
        const clouds = { solid: lattice(v.rng, 3), liquid: cloud(40, 0.115, 5, v.rng), gas: cloud(7, 0.25, 8, v.rng), sc: cloud(22, 0.17, 11, v.rng) };
        const start = { water: [300, 1], co2: [250, 20] };
        const h = s.handle(300, 1, { color: 'ink', r: 8, constrain: (x,y) => {const S=SUBST[sel.value];return[Math.max(S.T[0],Math.min(S.T[1],x)),Math.max(S.p[0],Math.min(S.p[1],y))];} });
        let cur = 'water';
        const setSub = () => {
          const S = SUBST[sel.value];
          s.setView(S.T, S.p);
          h.set(...start[sel.value]);
          cur = sel.value;
        };
        setSub();
        v.animate(() => {
          if (cur !== sel.value) setSub();
          const S = SUBST[sel.value], [T0, T1] = S.T, [p0, p1] = S.p;
          const cols = Object.fromEntries(Object.entries(PH).map(([k, [c]]) => [k, v.ramp(0.28, c)]));
          s.raster((x, y) => cols[phaseOf(S, x, y)], { res: 3, key: `pd-${sel.value}-${v.color('panel')}` });
          const sub = [], vap = [], mel = [];
          const Ts=visibleSublimationStart(S);
          for (let i = 0; i <= 120; i++) { const T = Ts + (S.Tt - Ts) * i / 120; sub.push([T, S.ps(T)]); }
          for (let i = 0; i <= 160; i++) { const T = S.Tt + (S.Tc - S.Tt) * i / 160; vap.push([T, S.pv(T)]); }
          for (let i = 0; i <= 80; i++) { const p = S.pt * Math.pow(S.pmaxMelt / S.pt, i / 80); mel.push([S.Tm(p), p]); }
          s.path(sub, { color: 'ink', width: 2 }); s.path(vap, { color: 'ink', width: 2 }); s.path(mel, { color: 'ink', width: 2 });
          s.dot(S.Tt, S.pt, { r: 5, color: 'red', label: `triple point (${v.fix(S.Tt, 2)} K, ${v.fmt(S.pt, 4)} bar)`, labelPos: 'se' });
          s.dot(S.Tc, S.pc, { r: 5, color: 'red', label: `critical point (${v.fix(S.Tc, 1)} K, ${v.fmt(S.pc, 4)} bar)`, labelPos: 'nw' });
          const ph = phaseOf(S, h.x, h.y), [c] = PH[ph];
          h.color = c;
          const q = clouds[ph];
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
          return `state point: $T=${v.fix(h.x, 1)}$ K, $p=${v.fmt(h.y, 3)}$ bar → **${PH[ph][1]}**\nAt 1 atm: ${sel.value === 'water' ? 'normal melting and boiling points are approximately 273.15 K and 373.12 K' : `sublimes at ${v.fix(S.Tsub, 2)} K (no liquid below the triple pressure ${v.fix(S.pt, 3)} bar)`}.`;
        });
      },
    },
    {
      num: '4.2', kind: 'Principle', name: 'Phase stability: lowest chemical potential wins',
      statement: String.raw`For an unconstrained pure substance at fixed positive $T$ and $p$, with only pressure-volume work and negligible interfacial contributions, the equilibrium bulk phase minimizes molar Gibbs energy $\mu$. Two phases coexist when they share the minimum; equality of two metastable branches alone is insufficient. Along a smooth branch, $\mathrm{d}\mu=-S_m\,\mathrm{d}T+V_m\,\mathrm{d}p$. The ordering of branch entropies determines their local temperature slopes; a solid-liquid-gas sequence is common, not universal.`,
      idea: String.raw`At constant $T,p$, transfer $\mathrm{d}n$ from phase A to B changes $G$ by $(\mu_B-\mu_A)\mathrm{d}n$ (pchem-3.10). Equilibrium therefore requires the lowest available branch, or a shared minimum. A branch has curvature $\partial^2\mu/\partial T^2=-C_{p,m}/T\le0$ where stable (pchem-3.12). The displayed zero-heat-capacity toy branches are affine in $T$, with gas entropy $172-R\ln(p/1\,\mathrm{bar})$, not a pressure-independent constant. The solid-liquid crossing below is marked as metastable when the gas lies lower. Primary derivation: Arovas §§2.8, 2.12.2, Eqs. 2.283–2.285.`,
      caption: String.raw`The toy model compares all three chemical potentials and thickens their minimum. Change pressure to move the crossings. The zoom shows ice minus liquid chemical potential; its zero is a stable melting point only if the gas is not lower. The readout gives the actual analytic crossing of this model, rather than claiming it equals a separate constant-latent-heat formula.`,
      deps: ['pchem-3.10', 'pchem-4.1'],
      refs: ['Atkins 4B', 'M–S ch. 23'],
      tags: ['chemical potential', 'stability', 'phase diagram'],
      scope: String.raw`Illustrative bulk branches with zero heat capacities, solid/liquid entropies 41 and 63 J/(K mol), gas entropy 172 J/(K mol) at 1 bar, incompressible molar volumes 19.65 and 18.02 cm³/mol, and ideal-gas pressure term $RT\ln(p/1\,\mathrm{bar})$. These chosen constants place the 1-bar crossings at 273.15 and 373.15 K and the model triple pressure near 8 mbar; they are not measured entropy tables. Pressure is limited to 0.001–100 bar; the model does not describe the critical point, high-pressure ice phases or accurate compressed steam.`,
      verify: false,
      viz(v) {
        const lp = v.slider('pressure $p$ (bar)', 1e-3, 100, 1, { log: true, sig: 2, fmt: (x) => (x < 1 ? x.toPrecision(2) : x.toFixed(x < 10 ? 2 : 0)) + ' bar' });
        const mu = modelMu, low = modelLowest;
        const s = v.stage({ x: [240, 420], y: [-14, 36], axes: 'box', gutter: true, xlabel: '$T$ / K', ylabel: '$\\mu$ / (kJ/mol)', height: 380, title: 'chemical potential of each phase' });
        const sz = v.stage({ x: [255, 292], y: [-500, 500], axes: 'box', gutter: true, xlabel: '$T$ / K', ylabel: '$\\mu_{\\text{ice}}-\\mu_{\\text{liq}}$ / (J/mol)', height: 380, weight: 0.8, minWidth: 260, title: 'zoom: melting' });
        const cols = ['blue', 'teal', 'orange'], names = ['solid', 'liquid', 'gas'];
        let trans = [];
        v.render(() => {
          const p = lp.value;
          const bounds = [0,1,2].flatMap(k => [mu(k,240,p)/1000, mu(k,420,p)/1000]), bottom = Math.min(...bounds)-5, top = Math.max(...bounds)+5;
          s.setView([240,420],[bottom,top]);
          const zm = Math.max(500, ...[255,292].map(T => Math.abs(mu(0,T,p)-mu(1,T,p)))) * 1.15;
          sz.setView([255,292],[-zm,zm]);
          const prof = [];
          for (let i = 0; i <= 360; i++) { const T = 240 + 180 * i / 360; prof.push([T, low(T, p)]); }
          trans = [];
          for (let i = 1; i < prof.length; i++) if (prof[i][1] !== prof[i - 1][1]) {
            let a = prof[i - 1][0], b = prof[i][0];
            for (let k = 0; k < 40; k++) { const m = (a + b) / 2; if (low(m, p) === prof[i - 1][1]) a = m; else b = m; }
            trans.push([(a + b) / 2, prof[i - 1][1], prof[i][1]]);
          }
          for (let i = 1; i < prof.length; i++) s.rect(prof[i - 1][0], bottom, prof[i][0], bottom+1.6, { fill: cols[prof[i][1]], fillAlpha: 0.7, stroke: false });
          for (let k = 0; k < 3; k++) s.fn((T) => mu(k, T, p) / 1000, { color: cols[k], width: 1.6, alpha: 0.9 });
          s.fn((T) => mu(low(T, p), T, p) / 1000, { color: 'ink', width: 4.5, alpha: 0.3 });
          for (const [T, , j] of trans) s.dot(T, mu(j, T, p) / 1000, { r: 5, color: 'red', label: `${v.fix(T, 1)} K`, labelPos: 'ne' });
          sz.hline(0, { color: 'teal', width: 2 });
          sz.fn((T) => mu(0, T, p) - mu(1, T, p), { color: 'blue', width: 2.2 });
          sz.text('ice minus liquid (gas may lie lower)', 256, .85*zm, { size: 11, color: 'muted' });
          const Tmz = modelMelting(p);
          sz.dot(Tmz, 0, { r: 5, color: 'red', label: `${v.fix(Tmz, 2)} K${low(Tmz,p)===2?' (metastable)':''}`, labelPos: 'ne' });
          s.text('ice', 246, mu(0, 246, p) / 1000 - 1.6, { color: 'blue' });
          s.text('liquid', 246, mu(1, 246, p) / 1000 + 1.6, { color: 'teal' });
          s.text('vapour', 392, mu(2, 392, p) / 1000 + 2.8, { color: 'orange' });
        });
        v.legend([['blue', 'solid'], ['teal', 'liquid'], ['orange', 'gas'], ['ink', 'lowest μ = stable', { dash: false }]]);
        v.readout(() => {
          const seq = trans.length ? trans.map(([T, a, b]) => `${names[a]} → ${names[b]} at $${v.fix(T, 1)}$ K`).join('; ') : 'no transition in this range';
          const Tbc = modelBoiling(lp.value), stable = low(Tbc,lp.value)!==0;
          return `at $p=${v.fmt(lp.value, 3)}$ bar: ${seq}\nmodel liquid-vapour equality: $T=[109(373.15)-V_l(p-1)10^5]/[109-R\\ln(p/1\\,\\mathrm{bar})]=${v.fix(Tbc,1)}$ K; ${stable?'not pre-empted by the solid branch':'metastable: solid has lower chemical potential'}. Crossings outside 240–420 K are not drawn.`;

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
      credit: 'Clapeyron relation; full modern derivation in Arovas',
      scope: String.raw`Pure-substance first-order coexistence with smooth chemical potentials and nonzero $\Delta V$; not a formula for the critical endpoint where both discontinuities vanish. Primary proof: Arovas §2.12.2, Eqs. 2.283–2.285. The visualization is a first-order local expansion, not an exact finite-offset phase boundary. Its water parameter sets are rounded illustrative values (fusion 6010 J/mol and −1.63 cm³/mol; vaporization 40660 J/mol and 30.12 L/mol). The CO₂ sublimation choice 25200 J/mol is NIST’s listed value at 195 K, applied near 194.69 K with ideal-gas volume; the CO₂ fusion pair 9020 J/mol and 9 cm³/mol is a chosen illustrative estimate, not a verified measurement. No original priority dates are asserted.`,
      verify: false,
      viz(v) {
        const TR = TRANSITIONS;
        const sel = v.select('transition', Object.entries(TR).map(([k, t]) => ({ value: k, label: t.name })), 'wm');
        const s = v.stage({ x: [-1, 1], y: [-1, 1], axes: 'box', gutter: true, height: 340, weight: 1.4, minWidth: 300, xlabel: 'dT / K', ylabel: 'dp / bar', title: 'window around the transition point' });
        const sb = v.stage({ x: [0.4, 3.6], y: [-1, 1], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 240, ylabel: 'μ terms / (J/mol)', xticks: [[1, '−ΔS dT'], [2, 'ΔV dp'], [3, 'Δμ']], title: 'chemical-potential bookkeeping' });
        const h = s.handle(0.5, 0.4, { color: 'ink', r: 8, constrain: (x,y) => {const [a,b]=TR[sel.value].win;return [Math.max(-a,Math.min(a,x)),Math.max(-b,Math.min(b,y))];} });
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
          const ax = Math.min(A,B/Math.abs(slope));
          s.line(-ax, -slope * ax, ax, slope * ax, { color: 'ink', width: 2.2, dash: true });
          s.text('Clapeyron slope', A * 0.1, slope * A * 0.1, { color: 'ink', dx: 8, dy: -10, size: 11 });
          s.dot(0, 0, { r: 4, color: 'ink' });
          // bars
          const a = t.H / t.T * dT, b = t.dV * dp * 1e5, m = Math.max(1, Math.abs(a), Math.abs(b), Math.abs(dmu)) * 1.25;
          sb.setView([0.4, 3.6], [-m, m]);
          sb.hline(0, { color: 'muted' });
          sb.bars([-a, b, dmu], { x0: 1, dx: 1, color: (val, i) => (i < 2 ? (i === 0 ? 'red' : 'blue') : (dmu < 0 ? 'orange' : 'blue')) });
          sb.corner(Math.abs(dmu)<1e-8 ? 'coexistence to first order' : dmu < 0 ? `${t.name.split('→ ')[1]} side is stable` : `${t.name.split(' →')[0].split(': ')[1]} side is stable`, 'tr', { plate: true });
        });
        v.legend([['blue', 'low-T phase stable'], ['orange', 'high-T phase stable']]);
        v.readout(() => {
          const t = TR[sel.value], slope = t.H / (t.T * t.dV);
          return `$\\Delta_{\\text{trs}}S=${v.fix(t.H / t.T, 1)}$ J/(K·mol), $\\Delta_{\\text{trs}}V=${v.sci(t.dV, 3)}$ m³/mol → $\\mathrm{d}p/\\mathrm{d}T=${v.fix(slope / 1e5, 4)}$ bar/K $=${v.fix(slope / 1e3, 1)}$ kPa/K; local linearization only`;
        });
      },
    },
    {
      num: '4.4', kind: 'Law', name: 'Clausius–Clapeyron equation',
      statement: String.raw`For vaporization (or sublimation) well below the critical point, with the vapour treated as a perfect gas and the condensed volume neglected, $\Delta V\approx RT/p$ and the Clapeyron equation becomes
$$\frac{\mathrm{d}\ln p}{\mathrm{d}T}=\frac{\Delta_{\text{vap}}H}{RT^2}\quad\Longrightarrow\quad \ln\frac{p_2}{p_1}=-\frac{\Delta_{\text{vap}}H}{R}\Big(\frac1{T_2}-\frac1{T_1}\Big)$$
if $\Delta_{\text{vap}}H$ is constant. A plot of $\ln p$ against $1/T$ is then a straight line of slope $-\Delta_{\text{vap}}H/R$.`,
      idea: String.raw`Start from $\mathrm{d}p/\mathrm{d}T=\Delta H/(T\Delta V)$ (pchem-4.3) and use $\Delta V=V_{\text{gas}}-V_{\text{liq}}\approx V_{\text{gas}}=RT/p$ (pchem-1.4), so $\mathrm{d}p/p=\Delta H\,\mathrm{d}T/(RT^2)$. Integrating with $\Delta H$ constant gives the line. In reality $\Delta H$ falls with $T$ (it vanishes at the critical point) and the gas is not perfect, so the plot curves slightly.`,
      caption: String.raw`Left: the NIST-listed Stull Antoine fit for water, plotted only from 273.16 to 373 K, against $1000/T$. Drag both points, including onto one another: a coincident secant uses the analytic tangent limit. The inferred enthalpy includes the factor 1000 from the axis. Right: compare a chosen constant-latent-heat approximation with the same fit over its source range. At the lowest altitudes the inverse fit requires a temperature above 373 K and is explicitly unavailable.`,
      deps: ['pchem-4.3', 'pchem-1.4', 'thermo-4.6'],
      refs: ['Atkins 4B', 'M–S ch. 23'],
      tags: ['vapour pressure', 'Clausius–Clapeyron', 'boiling point'],
      credit: 'Clausius–Clapeyron approximation; primary derivation in Arovas',
      scope: String.raw`Clausius–Clapeyron requires negligible condensed volume and ideal vapour; the integrated form additionally fixes latent heat. Full primary derivation: Arovas §2.12.2, Eqs. 2.285–2.287. NIST WebBook’s water Antoine table lists Stull coefficients A=4.6543, B=1435.264, C=−64.848, valid 255.9–373 K with pressure in bar; this panel uses only the liquid-side subset 273.16–373 K and never extrapolates its comparison curve. The apparent enthalpy is a derivative of this fit, not an independent calorimetric measurement. The altitude model integrates ideal-gas hydrostatic balance with sea-level 1.01325 bar, temperature 288.15 K and lapse rate 0.0065 K/m; real weather and humidity are omitted. The constant-H curve uses a chosen 373.124 K, 1-atm reference and H=35–48 kJ/mol.`,
      verify: false,
      viz(v) {
        const xmin=1000/373, xmax=1000/273.16;
        const s = v.stage({ x: [xmin-.025,xmax+.025], y: [-6.4,.5], axes: 'box', gutter: true, xlabel: '$1000\\,\\mathrm{K}/T$', ylabel: '$\\ln(p/\\mathrm{bar})$', height: 360, weight: 1.4, minWidth: 300, title: 'source-domain water vapour-pressure fit' });
        const s2 = v.stage({ x: [0, 9], y: [315, 380], axes: 'box', gutter: true, xlabel: 'altitude / km', ylabel: 'boiling point / K', height: 360, weight: 1, minWidth: 260, title: 'boiling point against model altitude' });
        const constrain=x=>{const xx=Math.min(xmax,Math.max(xmin,x));return[xx,Math.log(antoineW(1000/xx))];};
        const hA=s.handle(1000/363,Math.log(antoineW(363)),{color:'orange',r:7,label:'1',constrain});
        const hB=s.handle(1000/283,Math.log(antoineW(283)),{color:'purple',r:7,label:'2',constrain});
        const alt = v.slider('altitude $h$', 0, 8849, 0, { step: 1, fmt: (x) => `${(x / 1000).toFixed(2)} km` });
        const dHc = v.slider('assumed constant $\\Delta H$', 35, 48, 40.66, { step: 0.01, fmt: (x) => `${x.toFixed(2)} kJ/mol` });
        const invA = inverseVaporPressure;
        const minAltitude = 288.15/.0065*(1-(antoineW(373)/ATM)**(287.05287*.0065/9.80665));
        let sec = 0;
        v.render(() => {
          const x1=hA.x,y1=hA.y,x2=hB.x,y2=hB.y;
          sec=-apparentHeat(x1,x2)/R;
          const slope=sec/1000, ys=[y1+slope*(xmin-x1),y1+slope*(xmax-x1),Math.log(antoineW(273.16)),Math.log(ATM)-dHc.value*1000/R*(xmax/1000-1/373.124)];
          s.setView([xmin-.025,xmax+.025],[Math.min(...ys)-.3,Math.max(...ys,.15)+.3]);
          s.fn(x=>Math.log(antoineW(1000/x)),{domain:[xmin,xmax],color:'accent',width:2.2});
          s.fn(x=>Math.log(ATM)-dHc.value*1000/R*(x/1000-1/373.124),{domain:[xmin,xmax],color:'green',width:1.6,dash:true});
          s.line(xmin,y1+slope*(xmin-x1),xmax,y1+slope*(xmax-x1),{color:'ink',width:1.5,dash:true});
          const p=pAlt(alt.value), fitT=invA(p);
          s.hline(Math.log(p),{color:'muted',dash:true});
          s2.fn(h=>invA(pAlt(h*1000)),{domain:[minAltitude/1000,9],color:'accent',width:2.2});
          s2.fn(h=>ccBoiling(pAlt(h*1000),dHc.value*1000),{color:'green',width:1.8,dash:true});
          const h=alt.value/1000;
          if(fitT<=373&&fitT>=273.16)s2.dot(h,fitT,{r:6,color:'accent'});
          else s2.corner('Antoine inverse exceeds source 373 K ceiling','tl',{color:'orange',plate:true});
          s2.dot(h,ccBoiling(p,dHc.value*1000),{r:5,color:'green'});
          s2.vline(h,{color:'muted',dash:true});
        });
        v.legend([['accent', 'Antoine fit to measured data'], ['green', 'straight-line law with constant ΔH', { dash: true }], ['ink', 'secant through points 1, 2', { dash: true }]]);
        v.readout(() => {
          const p = pAlt(alt.value), Tb = invA(p), Tcc = ccBoiling(p,dHc.value*1000);
          return `${Math.abs(hB.x-hA.x)<1e-6?'near-coincident points: analytic tangent limit':'secant between points 1 and 2'}: $\\Delta H_{\\mathrm{app}}=-1000R\\,\\text{(plotted slope)}=${v.fix(-R*sec/1000,2)}$ kJ/mol at $T\\approx${v.fix(2000/(hA.x+hB.x),1)}$ K\nat $h=${v.fix(alt.value/1000,3)}$ km: $p=${v.fix(p*100,1)}$ kPa; ${Tb<=373&&Tb>=273.16?`Antoine fit boiling point ${v.fix(Tb,1)} K`:'Antoine inverse outside source range; comparison unavailable'}; constant-H prediction ${v.fix(Tcc,1)} K.`;

        });
      },
    },
    {
      num: '4.5', kind: 'Phenomenon', name: 'Triple point',
      statement: String.raw`A triple point specifies a particular three-phase equilibrium of a pure substance. For ordinary water’s ice-Ih/liquid/vapour triple point, the reference coordinates are 273.16 K and 611.657 Pa. These are isolated coexistence coordinates, not a finite area of the diagram. Additional solid polymorphs permit other triple points. In a local ideal-vapour, negligible-condensed-volume approximation, the sublimation and vaporization slopes of $\ln p$ differ by $\Delta_{\mathrm{fus}}H/(RT^2)$ at the normal triple point.`,
      idea: String.raw`The equalities $\mu_s=\mu_l=\mu_g$ impose two independent conditions on $T,p$ for a nonreacting pure substance (pchem-6.1). For these three phases, the triple point has zero intensive degrees of freedom. The local heat difference follows from $\Delta H_{\mathrm{sub}}=\Delta H_{\mathrm{fus}}+\Delta H_{\mathrm{vap}}$ and the Clausius–Clapeyron approximation (pchem-4.4). The thermodynamic kelvin was defined through water’s triple point in 1954; since 2019 it is defined by fixed Boltzmann constant. The 273.16 K reference remains the assigned water triple point on ITS-90; it should not be confused with an exact thermodynamic-temperature determination in the revised SI.`,
      caption: String.raw`Drag the state point or jump to the normal triple point. Exactly at the triple coordinates the vessel shows all three phases; a nearby state does not automatically coexist. The model can also identify two-phase equality to numerical tolerance. The dashed continuations are formal extrapolations of the local constant-enthalpy curves. The steep melting boundary follows the IAPWS ice-Ih correlation over this narrow pressure window.`,
      deps: ['pchem-4.1', 'pchem-4.4'],
      refs: ['Atkins 4A'],
      tags: ['triple point', 'phase rule', 'temperature scale'],
      credit: 'Triple point of water as the kelvin’s defining point: 10th CGPM, 1954; replaced by the Boltzmann-constant definition in 2019',
      scope: String.raw`Water reference coordinates and the melting curve come from IAPWS R14-08(2011), Eqs. 1 and 6 and the stated normal triple point. For a readable local slope comparison, vaporization and sublimation use chosen rounded constant enthalpies 45.05 and 51.06 kJ/mol, whose difference is 6.01 kJ/mol; they are approximations, not tabulated pressure observations or exact curves over the whole window. Numerical equality tolerance is $10^{-9}$ relative in the displayed coordinates; no finite neighbourhood represents three-phase equilibrium. Vessel layers show possible phases, not lever-rule amounts. Historical SI changes are verified in CGPM 10 Resolution 3 (1954) and CGPM 26 Resolution 1 (2018, effective 2019); IAPWS temperatures use ITS-90.`,
      verify: false,
      viz(v) {
        const Tt = 273.16, pt = 611.657, dHv = 45.05e3, dHs = 51.06e3, dHf = dHs - dHv;
        const pvap = (T) => pt * Math.exp(-dHv / R * (1 / T - 1 / Tt)), psub = (T) => pt * Math.exp(-dHs / R * (1 / T - 1 / Tt));
        const s = v.stage({ x: [255, 290], y: [100, 3000], ylog: true, axes: 'box', gutter: true, xlabel: '$T$ / K', ylabel: '$p$ / Pa', height: 380, weight: 1.6, minWidth: 320, title: 'water near the triple point' });
        const sv = v.stage({ x: [0, 1], y: [0, 1], equal: true, axes: false, height: 380, weight: 1, minWidth: 220, title: 'the vessel' });
        const h = s.handle(266, 400, { color: 'ink', r: 8, constrain: { x: [255, 290], y: [100, 3000] } });
        v.button('jump to the triple point', () => h.set(Tt, pt));

        let state = '';
        v.animate(() => {
          const status = tripleModel(h.x,h.y);
          const cs = { solid: v.ramp(0.28, 'blue'), liquid: v.ramp(0.28, 'teal'), gas: v.ramp(0.28, 'orange') };
          const ph=(x,y)=>{const q=tripleModel(x,y);return q==='triple'?'liquid':q.includes(' + ')?q.split(' + ')[0]:q;};
          s.raster((x, y) => cs[ph(x, y)], { res: 3, key: `tp-${v.color('panel')}` });
          s.fn(psub, { domain: [255, Tt], color: 'ink', width: 2.2 });
          s.fn(pvap, { domain: [Tt, 290], color: 'ink', width: 2.2 });
          s.fn(psub, { domain: [Tt, 290], color: 'ink', width: 1.2, dash: true, alpha: 0.7 });
          s.fn(pvap, { domain: [255, Tt], color: 'ink', width: 1.2, dash: true, alpha: 0.7 });
          s.line(Tt, pt, iceMeltingTemperature(3000), 3000, { color: 'ink', width: 2.2 });
          s.dot(Tt, pt, { r: 5, color: 'red', label: 'triple point', labelPos: 'se' });
          s.text('solid', 259, 1500, { color: 'blue', size: 14 }); s.text('gas', 282, 150, { color: 'orange', size: 14 }); s.text('liquid', 281.5, 2000, { color: 'teal', size: 14 });
          const p = status;
          state = p;
          // vessel
          sv.rect(0.12, 0.05, 0.88, 0.95, { color: 'ink', fill: false, width: 2, radius: 8 });
          const layers = p === 'triple' ? [['gas', 0.55, 0.95], ['liquid', 0.25, 0.55], ['solid', 0.05, 0.25]] : p.includes(' + ') ? p.split(' + ').map((q,i)=>[q,.05+i*.4,.45+i*.4]) : p === 'solid' ? [['solid', 0.05, 0.4]] : p === 'liquid' ? [['liquid', 0.05, 0.5]] : [['gas', 0.05, 0.95]];
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
      statement: String.raw`Ice Ih has a negative melting slope near atmospheric pressure because its liquid has smaller molar volume: $\mathrm{d}T_m/\mathrm{d}p\approx-7.4\times10^{-8}$ K/Pa. Typical blade pressures therefore produce a small melting-point depression; pressure alone does not explain skating across all cold-ice conditions. Extreme chosen contact areas can produce very large nominal pressures, so they must be compared with the limits of the ice-Ih phase boundary and of the rigid-contact model.`,
      idea: String.raw`Clapeyron gives $\mathrm{d}T_m/\mathrm{d}p=T\Delta V/\Delta H$ (pchem-4.3). Arovas §2.12.3 computes the small near-atmospheric depression and discusses friction and surface premelting as additional mechanisms. The constant near-zero slope is only a tangent, not a reliable linear continuation to large pressures. This panel instead uses IAPWS R14-08(2011) Eq. 1 for the full ice-Ih melting curve and its stated domain, while keeping the friction energy budget as a separate upper-bound model.`,
      caption: String.raw`Change mass and the assumed contact dimensions; the plotted dot shows the actual nominal gauge pressure $mg/A$, with no upper clipping. Drag its temperature horizontally. The boundary is the IAPWS ice-Ih melting curve with atmospheric pressure subtracted from the vertical coordinate. Pressures above the ice-Ih melting endpoint are shaded as outside this phase model. The friction estimate assumes all dissipated work becomes latent heat and is only an upper bound.`,
      deps: ['pchem-4.3'],
      refs: ['Atkins 4A'],
      tags: ['pressure melting', 'skating', 'premelting'],
      credit: 'Clapeyron pressure melting; modern discussion in Arovas and IAPWS ice-Ih correlation',
      scope: String.raw`Quasi-static bulk ice-Ih/liquid equilibrium; IAPWS Eq. 1 is valid from 251.165 to 273.16 K, ending near 208.566 MPa at the ice-Ih/ice-III/liquid triple point. The plotted pressure is gauge pressure; the correlation uses absolute pressure $0.101325\,\mathrm{MPa}+mg/A$. For larger nominal pressures no ice-Ih melting-temperature prediction is returned. The contact model ignores blade deformation, ice fracture and pressure redistribution. Chosen friction coefficient, speed and 333.6 J/g latent heat are illustrative; conductive, sensible-heat and evaporative losses are omitted. Arovas supplies the modern thermodynamic explanation; uninspected nineteenth-century original priority dates are removed.`,
      verify: false,
      viz(v) {
        const m = v.slider('skater mass $m$', 20, 120, 70, { step: 1, fmt: (x) => `${x} kg` });
        const L = v.slider('contact length', 2, 25, 10, { step: 0.5, fmt: (x) => `${x} cm` });
        const W = v.slider('contact width', 0.05, 3, 1, { step: 0.05, fmt: (x) => `${x.toFixed(2)} mm` });
        const mu = v.slider('friction coefficient $\\mu_k$', 0.003, 0.05, 0.01, { log: true, sig: 2 });
        const sp = v.slider('speed', 1, 12, 5, { step: 0.5, fmt: (x) => `${x} m/s` });
        const s = v.stage({ x: [-14, 1], y: [0, 200], axes: 'box', gutter: true, xlabel: 'ice temperature / °C', ylabel: 'gauge pressure / MPa', height: 380, weight: 1.5, minWidth: 320, title: 'melting line of ice' });
        const sb = v.stage({ x: [0.4, 3.6], y: [0, 200], axes: 'box', gutter: true, height: 380, weight: 1, minWidth: 240, ylabel: 'pressure / MPa', xticks: [[1, 'blade'], [2, 'needed at T'], [3, '1 atm']], title: 'what you have against what you need' });
        const h = s.handle(-5, 7, { color: 'ink', r: 8, constrain: { x: [-14, 0] } });
        let blade = 0;
        v.render(() => {
          blade = m.value * 9.80665 / (L.value * 1e-2 * W.value * 1e-3) / 1e6;
          const upper=Math.max(200,blade*1.15), endpoint=ICE_IH_PMAX/1e6-.101325;
          s.setView([-14,1],[0,upper]);h.set(h.x,blade);
          s.raster((x,y)=>y>endpoint?v.ramp(.2,'muted'):(x>.01||y>iceMeltingPressure(Math.max(251.165,Math.min(273.16,x+273.15)))/1e6-.101325?v.ramp(.3,'teal'):v.ramp(.3,'blue')),{res:3,key:`ice-${upper}-${v.color('panel')}`});
          const line=[];for(let i=0;i<=160;i++){const T=259.15+(iceMeltingTemperature(101325)-259.15)*i/160;line.push([T-273.15,(iceMeltingPressure(T)-101325)/1e6]);}s.path(line,{color:'ink',width:2.2});
          s.text('ice Ih',-11,20,{color:'blue',size:14});s.text('liquid (within Ih model)',-7,Math.min(165,endpoint*.85),{color:'teal',size:12});
          s.vline(0,{color:'muted',dash:true});
          const need=(iceMeltingPressure(h.x+273.15)-101325)/1e6;
          s.segment([h.x,blade],[h.x,need],{color:'red',width:2,dash:true});
          if(blade>endpoint)s.corner('above ice-Ih endpoint: other phases required','tr',{color:'orange',plate:true});
          sb.setView([.4,3.6],[0,1.2*Math.max(blade,need,.101325)]);
          sb.bars([blade,need,.101325],{x0:1,dx:1,color:(val,i)=>['accent','red','muted'][i]});
        });
        v.legend([['teal', 'liquid'], ['blue', 'ice'], ['red', 'pressure comparison']]);
        v.readout(() => {
          const need=(iceMeltingPressure(h.x+273.15)-101325)/1e6,F=m.value*9.80665,Tm=iceMeltingTemperature(101325+blade*1e6),P=mu.value*F*sp.value,melt=P/333600*1000;
          return `nominal blade gauge pressure $p=mg/A=${v.fix(blade,2)}$ MPa; ${Tm===null?'absolute pressure exceeds the ice-Ih model endpoint; melting-temperature prediction unavailable':`IAPWS melting temperature ${v.fix(Tm-273.15,3)} °C, depression ${v.fix(iceMeltingTemperature(101325)-Tm,3)} K from its 1-atm value`}\nice at ${v.fix(h.x,2)} °C: ice-Ih curve requires ${v.fix(need,2)} MPa gauge; chosen pressure is ${blade>=need?'above':'below'} that threshold${Tm===null?' (phase inference invalid beyond Ih model)':''}.\nchosen friction heat $\\mu_k mgv=${v.fix(P,1)}$ W gives a latent-heat upper bound ${v.fix(melt,3)} g/s at333.6 J/g; this assumes no heat losses or warming cost.`;

        });
      },
    },
  ],
};
