// Energy Systems — Chapter 4: Solar energy, items 4.5–4.8 (Shockley–Queisser limit, multijunction cells, maximum power point tracking, temperature)
//
// SOURCES AND PROVENANCE (checked October 2026 unless marked "from memory")
//   4.5 Complete original Shockley–Queisser 1961, Rühle 2016 and Herrmann–Würfel 2005 author proof read. Full generalized Planck emission,
//     source-audit-radiative.shared.js, replaces the Boltzmann exponential approximation at high concentration. Selected source is 5772 K blackbody.
//     Rühle's separate AM1.5G/298.15 K limits are 33.16% for two emitting faces and 33.77% with a perfect rear reflector, both at 1.34 eV.
//   4.6 Independently derived ideal spectrum-splitting extension: each junction absorbs AND emits only within its assigned energy window.
//     Requires ideal spectral filters; no interjunction photon exchange, non-radiative loss or reproduction of Henry/De Vos numerical results.
//     Series operation keeps all junctions in their forward photovoltaic quadrant. Gap-search candidates are local numerical searches.
//   4.7 Perturb-and-observe is a standard hill-climbing controller. The irradiance history is an INVENTED illustrative cloud sequence; the cell is the illustrative
//     single-diode model of 4.3.
//   4.8 Cell temperature from ambient: T_cell = T_amb + (NOCT - 20) G/800 with NOCT = 45 C (a typical datasheet value, from memory; the definition of NOCT as
//     the cell temperature at 800 W/m2, 20 C ambient, 1 m/s wind is confirmed by SAM/PVPMC (2026-10-16)). J0 follows n_i^2 ~ T^3 exp(-Eg/kT). Photocurrent temperature coefficient
//     +0.05 %/K is an illustrative round number. Quoted commercial silicon power coefficients vary by technology (literature values between -0.2 and -0.4 %/K).

import { clamp, KB, S0, QE, FW, T_SUN, SIGMA, pin, cell, ivCurve } from './ch04.shared.js';
import {radiativeJunctionAudit as junction,radiativeMaximumAudit as junctionMax,radiativeStackAudit as stack,radiativeEnergyAudit as engy,RADIATIVE_INPUTS_AUDIT as DB} from './source-audit-radiative.shared.js';

const Tc0 = 300;
/** Detailed-balance single junction at gap Eg: efficiency and loss shares of the incident power. */
function sqPoint(Eg, o) {
  const Pin = pin(o.conc), j = junction(Eg, Infinity, o), mp = junctionMax(j);
  const absE = (FW * o.conc * engy(Eg, Infinity, T_SUN) * QE) / Pin;      // fraction of incident power in photons above the gap
  const usable = (Eg * QE * j.solar) / Pin;                                    // each absorbed photon keeps only Eg
  const eta = mp.P / Pin;
  return { eta, below: 1 - absE, therm: absE - usable, conversion: usable - eta, Voc: j.Voc, Vmp: mp.V, j };
}

export default {
  collection: 'energy',
  chapter: 4,
  items: [
    // ───────────────────────────────────────────────────────── 4.5
    {
      num:'4.5',kind:'Theorem',name:'Shockley–Queisser limit',
      statement:String.raw`An ideal junction absorbs every photon above its gap $E_g$, creates one electron–hole pair per absorbed photon, and recombines only by emitting light. Let $\dot N(T,V)$ be the hemispherical photon flux above $E_g$ with photon chemical potential $qV$. For $F=C(R_\odot/d)^2\le1$ and $m$ emitting faces, our chosen thermal-background balance is
$$\begin{aligned}G&=F[\dot N(T_s,0)-\dot N(T_c,0)],\\J(V)/q&=G-m[\dot N(T_c,V)-\dot N(T_c,0)].\end{aligned}$$
The electrical limit at the selected gap is $\eta=\max_V VJ(V)/P_{\rm in}$. Emission, temperature and the illumination spectrum set the voltage and efficiency; increasing material quality alone cannot remove the radiative loss within these assumptions.

The pictured 5772 K blackbody at one Sun, 300 K cell temperature and front-only emission gives a computed peak near **30.5% at 1.26 eV**. Rühle's separate **AM1.5G, 25°C** calculation gives 33.16% with both faces emitting, or 33.77% with a perfect rear reflector, both near 1.34 eV.`,
      idea:String.raw`The full generalized Planck distribution is
$$\begin{aligned}B(E,T,V)&=\frac{2\pi E^2}{h^3c^2}\\&\quad\times[\exp((E-qV)/kT)-1]^{-1},\end{aligned}$$
and $\dot N=\int_{E_g}^{\infty}B\,dE$. The exponential diode law is recovered when $E-qV\gg kT$; retaining the denominator's minus one matters near the gap under strong concentration. For a sharp absorbing step, emission grows without bound as $qV$ approaches $E_g$, so a finite illumination reaches open circuit below that gap. Maximum power occurs at a lower voltage. A small gap captures many photons but discards more excess energy; a large gap offers higher voltage with fewer photons. Their balance creates the efficiency peak.`,
      caption:String.raw`Left: a sunlight budget versus gap. Red is unabsorbed sub-gap power; orange is energy above the gap discarded on thermalization; purple is the remaining pair energy not delivered electrically, including recombination and the operating point; green is output. The ring marks the largest sampled efficiency on a 0.025 eV grid. Right: current normalized by short-circuit current, the maximum-power rectangle and the gap voltage. Vary concentration, cell temperature or emitting faces. The photon distribution retains its full Bose denominator throughout the range.`,
      deps:['energy-4.1','energy-4.3','cm-4.1'],refs:['Shockley & Queisser 1961, complete original pp. 510–519, especially §§2–5','Herrmann & Würfel 2005, complete author proof, Eqs. 7/14','Rühle 2016, complete original pp. 139–147, generalized emission and emitting-face distinction'],
      links:{original:'https://doi.org/10.1063/1.1736034',emission:'https://doi.org/10.1119/1.1904623',tabulation:'https://doi.org/10.1016/j.solener.2016.02.015'},tags:['photovoltaics','thermodynamics','efficiency'],
      scope:String.raw`One pair per photon, step absorption/emission, fixed 5772 K blackbody Sun and selected cell temperature, with no non-radiative recombination, resistive loss or spectral conversion. Sunlight replaces a fraction F of the front hemisphere; the remaining front directions and exposed rear face receive blackbody ambient radiation at the cell temperature. Front-only emission corresponds to a perfect rear mirror. Concentration is limited to 1/(R/d)^2. The AM1.5G reference values use a different spectrum and 25°C; the picture computes its own blackbody values. The plotted peak indicator samples gaps every 0.025 eV. At extreme small-gap/full-concentration states the positive open-circuit gap may be too small to resolve in a rounded voltage display; it is retained separately in the computation.`,
      credit:'Shockley & Queisser 1961; generalized Planck emission and numerical teaching extension',verify: false,
      viz(v) {
        const Eg = v.slider('band gap $E_g$ (eV)', 0.4, 3, 1.34, { step: 0.01 });
        const lc = v.slider('concentration', 1, DB.maxConcentration, 1, { log: true, fmt: (x) => `${Math.round(x).toLocaleString('en-US')}×` });
        const Tc = v.slider('cell temperature (K)', 250, 400, 300, { step: 1 });
        const faces = v.select('cell emits from', [{ value: '1', label: 'front only' }, { value: '2', label: 'both faces' }], '1');
        const L = v.stage({ x: [0.25, 3.15], y: [-.05, 1.05], axes: 'box', gutter: true, height: 340, weight: 1.25, minWidth: 290, xlabel: 'band gap $E_g$ (eV)', ylabel: 'share of incident sunlight', title: 'where the sunlight goes', yticks: [[0, '0'], [0.25, '25%'], [0.5, '50%'], [0.75, '75%'], [1, '100%']] });
        const R = v.stage({ x: [0, 1.5], y: [0, 60], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 260, xlabel: 'voltage V (V)', ylabel: '$J/J_{sc}$', title: 'the ideal cell at this gap' });
        let key = '', tab = null, st = null;
        v.render(() => {
          const o = { conc: lc.value, Tc: Tc.value, faces: Number(faces.value) };
          const k = `${o.conc}|${o.Tc}|${o.faces}`;
          if (k !== key) { key = k; tab = []; for(let i=0;i<=104;i++){const e=.4+i*.025;tab.push([e,sqPoint(e,o)]);} }
          const lay = (f) => tab.map(([e, p]) => [e, f(p)]);
          const c1 = lay((p) => p.eta), c2 = lay((p) => p.eta + p.conversion), c3 = lay((p) => p.eta + p.conversion + p.therm);
          const band = (top, bot, col, a) => { const pts = top.concat(bot.slice().reverse()); L.poly(pts, { fill: col, fillAlpha: a, stroke: false }); };
          band(c3.concat([[3, 1]]).slice(0, -1).map(([e, y]) => [e, 1]), c3, 'red', 0.4);
          band(c3, c2, 'orange', 0.45); band(c2, c1, 'purple', 0.4);
          band(c1, c1.map(([e]) => [e, 0]), 'green', 0.6);
          L.path(c1, { color: 'green', width: 2.6 });
          let bi = 0; tab.forEach(([, p], i) => { if (p.eta > tab[bi][1].eta) bi = i; });
          const best = tab[bi];
          L.dot(best[0], best[1].eta, { r: 5, color: 'green', hollow: true });
          L.vline(Eg.value, { color: 'gold', width: 1.6 });
          const p = sqPoint(Eg.value, o);
          L.dot(Eg.value, p.eta, { r: 7, color: 'gold' });
          // Normalize current so full concentration retains readable axes.
          const j=p.j,Jsc=QE*j.A*.1;
          R.setView([-.05*Math.max(.6,Eg.value*1.05),Math.max(.6,Eg.value*1.05)],[-.08,1.2]);
          const pts=[];for(let i=0;i<=200;i++){const V=j.Voc*i/200;pts.push([V,i===200?0:Math.max(0,j.J(V)/j.A)]);}
          const Jm=j.J(p.Vmp)/j.A;
          R.rect(0,0,p.Vmp,Jm,{fill:'green',fillAlpha:.3,color:'green',width:1.6});
          R.rect(0,0,j.Voc,1,{fill:false,color:'muted',dash:[5,4],width:1.2});R.path(pts,{color:'accent',width:3});
          R.vline(Eg.value,{color:'gold',width:1.4,dash:[5,4]});R.text('$E_g/q$',Eg.value,1.08,{dx:-5,align:'right',size:12,color:'gold',weight:700});
          R.dot(p.Vmp,Jm,{r:6,color:'green'});R.dot(j.Voc,0,{r:4,color:'red'});
          st = { p, best, o, Jsc };
        });
        v.legend([['red', 'below the gap: not absorbed', { area: true }], ['orange', 'excess above the gap: heat', { area: true }], ['purple', 'remaining conversion loss', { area: true }], ['green', 'electrical output', { area: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { p, best, o } = st;
          const std = o.conc === 1 && o.Tc === 300 && o.faces === 1;
          return `$E_g=${v.fix(Eg.value, 2)}$ eV: efficiency **${v.fix(100 * p.eta, 1)}%** = 100% − ${v.fix(100 * p.below, 1)}% (below gap) − ${v.fix(100 * p.therm, 1)}% (heat) − ${v.fix(100 * p.conversion, 1)}% (remaining conversion loss) · $V_{oc}=${v.fix(p.Voc, 3)}$ V = ${v.fix((100 * p.Voc) / Eg.value, 0)}% of $E_g/q$ · largest sampled curve value ${v.fix(100 * best[1].eta, 1)}% at ${v.fix(best[0], 2)} eV` +
            (std ? `\nBlackbody-Sun model. Rühle 2016 separately reports 33.77% at 1.34 eV for AM1.5G, 298.15 K and a perfect rear reflector; with both faces emitting the value is 33.16%.` : '');
        });
      },
    },

    // ───────────────────────────────────────────────────────── 4.6
    {
      num:'4.6',kind:'Concept',name:'Multijunction cells',
      statement:String.raw`Dividing the solar spectrum among junctions with decreasing gaps lets each junction convert a narrower photon-energy range. This picture uses an **ideal spectrum splitter and spectral filters**: each junction absorbs and emits only in its assigned window, with radiative balance from energy-4.5. This optical assumption defines the model; an unfiltered physical tandem additionally exchanges luminescent photons between junctions.

In a series-connected stack every junction carries one shared current. Here each operates in its forward photovoltaic range, so $0\le j\le\min G_i$ and $P_{\rm series}=qj\sum_iV_i(j)$. Independently loaded junctions choose their own power points, giving, for the **same gaps and optical model**,
$$\max_j qj\sum_i V_i(j)\;\le\;\sum_i\max_{j_i}qj_iV_i(j_i).$$
The independent configuration uses $2N$ terminals; a three-junction device has six.`,
      idea:String.raw`Spectral windows reduce the mismatch between photon energy and band gap. They help only when their gaps and connections make use of that spectrum. In series, one junction's small available current can constrain the rest, so a poorly matched added junction can lower output. Independently loading every junction offers at least as much power for fixed gaps because the shared-current operating points form a subset of the independently available choices. Equality requires compatible individual maximum-power currents. Choosing gaps is a separate numerical search; the bars show search candidates rather than a proof of the globally optimal gaps.`,
      caption:String.raw`Choose one to three junctions and drag the gap handles. Pale colours show absorbed spectral windows. Darker density allocates the **actual electrical output**, including the fraction of generated current collected at the chosen power point. The plot shows 0.3–4.2 eV; calculations integrate each full model window, including the high-energy tail. Press **optimise the gaps** for a numerical candidate. Bars compare searched candidates for one, two and three junctions under the selected connection and concentration. Gold marks the current selected configuration.`,
      deps:['energy-4.5'],refs:['Independent spectral-window extension of generalized radiative balance in energy-4.5','Henry 1980 and De Vos 1980: historical bibliographic attribution only; their numerical results and coupled optical models are not reproduced'],
      links:{balance:'https://doi.org/10.1063/1.1736034',emission:'https://doi.org/10.1119/1.1904623',history:'https://biblio.ugent.be/publication/207802'},tags:['photovoltaics','tandem','efficiency'],
      scope:String.raw`A 5772 K blackbody source, 300 K cells, one emitting face per junction and ideal filters restricting each junction's absorption AND emission to its assigned interval. Remaining sky directions are at the cell temperature. No interjunction photon recycling, non-radiative recombination, lattice or tunnel-junction losses. These computed values are not a generic unfiltered-tandem limit or a reproduction of Henry/De Vos. Series searches are restricted to nonnegative junction voltages; independent loading uses each junction's own maximum. Gap-search candidates are local numerical results within 0.4–3.9 eV, without a certificate of global optimality. The displayed spectral range is cropped; electrical calculations integrate complete windows.`,
      credit:'Multijunction history: C. H. Henry 1980; A. De Vos 1980. Ideal-filter model independently derived here.',verify: false,
      viz(v) {
        const M = v.M;
        const N = v.select('junctions', [{ value: '1', label: '1' }, { value: '2', label: '2' }, { value: '3', label: '3' }], '2');
        const conn = v.select('connection', [{ value: 'series', label: 'in series (2-terminal)' }, { value: 'indep', label: 'independently loaded' }], 'series');
        const lc = v.slider('concentration', 1, DB.maxConcentration, 1, { log: true, fmt: (x) => `${Math.round(x).toLocaleString('en-US')}×` });
        const S = v.stage({ x: [.15, 4.25], y: [-.1, 1.12], axes: 'box', gutter: true, height: 340, weight: 1.4, minWidth: 300, xlabel: 'photon energy (eV)', ylabel: 'solar power per eV (relative)', title: 'the spectrum, sliced by the junctions' });
        const B = v.stage({ x: [0.4, 3.6], y: [0, 0.7], axes: 'box', gutter: true, height: 340, weight: 0.8, minWidth: 240, xlabel: 'number of junctions', ylabel: 'efficiency', title: 'gap-search candidates', xticks: [[1, '1'], [2, '2'], [3, '3']], yticks: [[0, '0'], [0.1, '10%'], [0.2, '20%'], [0.3, '30%'], [0.4, '40%'], [0.5, '50%'], [0.6, '60%'], [0.7, '70%']] });
        const hs = [S.handle(1.8, 0.03, { color: 'blue', r: 8, constrain: { x: [0.4, 3.9], y: [0.03, 0.03] } }), S.handle(1.3, 0.03, { color: 'green', r: 8, constrain: { x: [0.4, 3.9], y: [0.03, 0.03] } }), S.handle(0.9, 0.03, { color: 'orange', r: 8, constrain: { x: [0.4, 3.9], y: [0.03, 0.03] } })];
        const opt = {}; let st = null;
        const O = () => ({ conc: lc.value, Tc: Tc0, faces: 1 });
        const gaps = () => hs.slice(0, Number(N.value)).map((h) => h.x).sort((a, b) => b - a);
        const best = (n) => {
          const k = `${n}|${conn.value}|${lc.value}`; if (opt[k]) return opt[k];
          const o = O(), starts = { 1: [1.35], 2: [1.75, 1.1], 3: [1.95, 1.45, 0.95] }[n];
          const f = (g) => (g.some((x) => x < 0.4 || x > 3.9) ? 1 : -stack(g, o, conn.value).eta);
          const r = M.nelderMead(f, starts, { step: 0.15, tol: 1e-7, maxIt: 250 });
          return (opt[k] = { gaps: [...r.x].sort((a, b) => b - a), eta: -r.fx });
        };
        v.button('optimise the gaps', () => { const b = best(Number(N.value)); b.gaps.forEach((g, i) => hs[i].set(g, 0.03)); });
        v.render(() => {
          const n = Number(N.value), o = O();
          hs.forEach((h, i) => { h.visible = i < n; });
          const g = gaps(), res = stack(g, o, conn.value);
          const kT = KB * T_SUN, f = (x) => (x ** 3 / Math.expm1(x / kT)) / ((2.82144 * kT) ** 3 / Math.expm1(2.82144));
          const cols = ['blue', 'green', 'orange'];
          hs.slice(0,n).sort((a,b)=>b.x-a.x).forEach((h,i)=>{h.color=cols[i];});
          S.between(f, () => 0, 0.3, g[n - 1], { fill: 'red', fillAlpha: 0.3 });
          g.forEach((E, i) => {
            const hiE = i === 0 ? 4.2 : g[i - 1], part=res.parts[i], work=part.solar>0?part.P/(QE*part.solar):0;
            S.between(f, () => 0, E, hiE, { fill: cols[i], fillAlpha: 0.25 });
            S.between((x) => (f(x) * work) / x, () => 0, E, hiE, { fill: cols[i], fillAlpha: 0.6 });
            S.vline(E, { color: cols[i], width: 1.6 });
          });
          S.fn(f, { color: 'ink', width: 1.8, domain: [0.3, 4.2], n: 300 });
          for (let i = 0; i < n; i++) hs[i].set(hs[i].x, 0.03);
          const bars = [1, 2, 3].map((m) => best(m).eta);
          B.setView([0.4, 3.6], [0, Math.max(0.4, Math.max(...bars, res.eta) * 1.2)]);
          B.bars(bars, { x0: 1, dx: 1, color: (val, i) => (i + 1 === n ? 'green' : 'accent') });
          bars.forEach((b, i) => B.text(`${v.fix(100 * b, 1)}%`, i + 1, b, { dy: -8, align: 'center', size: 12, weight: 700, color: 'ink' }));
          B.hline(res.eta, { color: 'gold', width: 2, dash: [6, 4] });
          v.legend([['red','below the lowest gap',{area:true}],...cols.slice(0,n).map((c,i)=>[c,n===1?'single junction':i===0?'top junction':i===n-1?'bottom junction':'middle junction',{area:true}])]);
          st = { res, g, o, bars, n };
        });
        v.readout(() => {
          if (!st) return '';
          const { res, g, bars, n } = st;
          return `Gaps ${g.map((x) => v.fix(x, 2)).join(', ')} eV: efficiency **${v.fix(100 * res.eta, 1)}%** (${n === 1 ? 'single junction' : `${v.fix(100 * (res.eta - bars[0]), 1)} points relative to the searched single-junction candidate ${v.fix(100 * bars[0], 1)}%`}) · junction voltages ${res.parts.map((p) => v.fix(p.V, 2) + ' V').join(', ')}` +
            (conn.value === 'series' && n > 1 ? ` · net generation currents ${res.parts.map((p) => v.fix(p.A * QE * 0.1, 1)).join(', ')} mA/cm² available, ${v.fix(res.j * QE * 0.1, 1)} mA/cm² shared` : '') + `\nSearched candidates (model): ${bars.map((b, i) => `${i + 1} junction${i ? 's' : ''} ${v.fix(100 * b, 1)}%`).join(' · ')}.`;
        });
      },
    },

    // ───────────────────────────────────────────────────────── 4.7
    {
      num: '4.7',
      kind: 'Method',
      name: 'Maximum power point tracking',
      statement: String.raw`The maximum power point $(V_{mp},J_{mp})$ of a cell or module (energy-4.4) moves with irradiance and temperature, so a fixed load wastes power. A **maximum power point tracker** adjusts the operating voltage to stay at the peak. In **perturb and observe**, every control period the voltage is stepped by $\pm\Delta V$ and the power measured: if the power rose, the next step has the same sign, otherwise the sign reverses,
$$V_{k+1}=V_k+\operatorname{sgn}\!\big[(V_k-V_{k-1})(P_k-P_{k-1})\big]\,\Delta V.$$
Because $P(V)$ is single-peaked, the controller climbs to the peak and then oscillates around it with amplitude of order $\Delta V$.

Scope: uniform illumination, so one peak; the step size trades tracking speed against steady-state ripple, and rapid irradiance changes can mislead the algorithm.`,
      idea: String.raw`The power curve of a cell rises, peaks, and falls (energy-4.4), so the sign of the slope $dP/dV$ tells which way the maximum lies, and a perturbation tests that sign without knowing the cell model. The controller is a discrete gradient ascent: it needs only a voltage actuator (in practice the duty cycle of a DC–DC converter) and a power measurement. At the peak $dP/dV=0$, so it hunts back and forth across it; a larger $\Delta V$ follows moving peaks faster but wastes more power in the ripple, though since $P$ is flat at the top the loss is quadratic in the offset. A weakness is that a sudden brightening during a step can raise $P$ for the wrong reason and send the controller the wrong way for one step.`,
      caption: String.raw`The cell is lit by an invented cloud sequence (shaded strip, top). **Left** (top) the green dashed curve is the power available at the true maximum power point and the blue curve what the controller delivers; **right**, the power–voltage curve at this instant with the controller's recent positions (gold trail) hunting around the peak (green ring). Change the **step size** to see slow tracking after a cloud edge (small step) versus ripple (large step), or switch to a **fixed voltage** to see what tracking is worth. Press play or drag the time.`,
      deps: ['energy-4.4'],
      refs: ['De Soto five-parameter model, temperature dependence; https://pvpmc.sandia.gov/modeling-guide/2-dc-module-iv/single-diode-equivalent-circuit-models/de-soto-five-parameter-module-model/'],
      tags: ['photovoltaics', 'control', 'optimisation'],
      scope: String.raw`Single peak (uniform illumination); the cloud history and cell parameters are illustrative.`,
      viz(v) {
        const dv = v.slider('step size $\\Delta V$ (mV)', 1, 60, 10, { step: 1 });
        const mode = v.select('controller', [{ value: 'po', label: 'perturb & observe' }, { value: 'fixed', label: 'fixed 0.50 V' }], 'po');
        const DUR = 20, DT = 0.1, N = Math.round(DUR / DT);
        const ss = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
        const gOf = (t) => 1 - 0.72 * Math.min(ss((t - 4) / 0.6), 1 - ss((t - 9.2) / 0.6)) - 0.35 * Math.max(0, Math.sin((2 * Math.PI * (t - 13)) / 1.6)) * (t > 13 && t < 17 ? 1 : 0);
        const mk = (g) => cell({ suns: g, T: 298.15, j0ref: 1e-12, n: 1, rs: 0.8, rsh: 2000 });
        const A = v.stage({ x: [0, DUR], y: [0, 28], axes: 'box', gutter: true, height: 300, weight: 1.35, minWidth: 300, xlabel: 'time (s)', ylabel: 'power (mW/cm²)', title: 'power delivered' });
        const B = v.stage({ x: [0, 0.7], y: [0, 28], axes: 'box', gutter: true, height: 300, weight: 1, minWidth: 260, xlabel: 'voltage V (V)', ylabel: 'power (mW/cm²)', title: 'the power curve now' });
        let key = '', sim = null;
        const run = () => {
          const k = `${dv.value}|${mode.value}`; if (k === key) return; key = k;
          const dV = dv.value / 1000, Vs = [], Ps = [], Pm = [], Vm = [];
          let V = 0.42, dir = 1, Pprev = -1;
          for (let i = 0; i <= N; i++) {
            const t = i * DT, c = mk(gOf(t)), m = c.pmax();
            Pm.push(m.P); Vm.push(m.V);
            if (mode.value === 'fixed') V = 0.5;
            const P = Math.max(0, V * c.J(V)); Vs.push(V); Ps.push(P);
            if (mode.value === 'po') { if (i > 0 && P < Pprev) dir = -dir; Pprev = P; V = clamp(V + dir * dV, 0.05, 0.69); }
          }
          sim = { Vs, Ps, Pm, Vm };
        };
        let st = null;
        v.animate((t) => {
          run();
          const tt = clamp(t, 0, DUR), k = Math.min(N, Math.round(tt / DT));
          A.hband(0, 28, { color: 'muted', alpha: 0 });
          for (let i = 0; i < N; i++) A.rect(i * DT, 0, (i + 1) * DT, 2.2 * gOf(i * DT), { fill: 'gold', fillAlpha: 0.25, stroke: false });
          A.text('irradiance (shaded strip, max 1 sun)', 0.3, 2.9, { size: 11, color: 'muted', align: 'left', plate: true });
          A.path(sim.Pm.map((p, i) => [i * DT, p]), { color: 'green', width: 2, dash: [6, 4] });
          A.path(sim.Ps.slice(0, k + 1).map((p, i) => [i * DT, p]), { color: 'accent', width: 2.6 });
          A.vline(tt, { color: 'faint', width: 1 });
          A.dot(tt, sim.Ps[k], { r: 6, color: 'gold' });
          const c = mk(gOf(tt));
          B.setView([0, 0.7], [0, Math.max(6, Math.ceil((sim.Pm[k] * 1.25) / 2) * 2)]);
          B.path(ivCurve(c, 0, c.voc(), 120).map(([V, J]) => [V, V * J]), { color: 'accent', width: 2.6 });
          for (let i = Math.max(0, k - 12); i < k; i++) B.dot(sim.Vs[i], sim.Ps[i], { r: 3.5, color: 'gold', alpha: 0.4 + 0.5 * ((i - (k - 12)) / 12) });
          B.dot(sim.Vm[k], sim.Pm[k], { r: 8, color: 'green', hollow: true });
          B.dot(sim.Vs[k], sim.Ps[k], { r: 7, color: 'gold' });
          let e = 0, em = 0, eN = 0, emN = 0; for (let i = 0; i <= k; i++) { e += sim.Ps[i]; em += sim.Pm[i]; } for (let i = 0; i <= N; i++) { eN += sim.Ps[i]; emN += sim.Pm[i]; }
          st = { g: gOf(tt), V: sim.Vs[k], Vm: sim.Vm[k], P: sim.Ps[k], Pm: sim.Pm[k], eff: e / em, effAll: eN / emN, tt };
        }, { period: DUR, still: 7 });
        v.legend([['green', 'available at the true maximum', { dash: true }], ['accent', 'delivered by the controller']]);
        v.readout(() => {
          if (!st) return '';
          return `t = ${v.fix(st.tt, 1)} s, light ${v.fix(st.g, 2)} sun: operating ${v.fix(st.V, 3)} V (true peak at ${v.fix(st.Vm, 3)} V) delivers ${v.fix(st.P, 2)} of ${v.fix(st.Pm, 2)} mW/cm² · tracking efficiency so far **${v.fix(100 * st.eff, 1)}%**, over the whole 20 s ${v.fix(100 * st.effAll, 1)}%`;
        });
      },
    },

    // ───────────────────────────────────────────────────────── 4.8
    {
      num: '4.8',
      kind: 'Phenomenon',
      name: 'Hot panels produce less',
      statement: String.raw`A silicon-like solar cell generally loses voltage and maximum power as it warms: the dark saturation current rises much faster than the photocurrent. In the chosen fixed-gap, ideality-one approximation,
$$J_0\propto T^3e^{-E_g/k_BT},\qquad V_{oc}\simeq\frac{k_BT}{q}\ln\frac{J_{ph}}{J_0},$$
so, neglecting the small temperature dependence of $J_{ph}$,
$$\frac{dV_{oc}}{dT}\simeq-\frac{E_g/q-V_{oc}}{T}-\frac{3k_B}{q}.$$
For $E_g=1.12$ eV and $V_{oc}\simeq0.63$ V near 298 K, this is about $-1.9$ mV/K. The exact power coefficient depends on the device and its operating point; the readout computes it for the chosen model.`,
      idea: String.raw`The temperature dependence of the intrinsic carrier population drives a strong increase in junction leakage. More of the photocurrent is then cancelled by the diode current at the same voltage, reducing the voltage available to a load. The numerical model includes a small imposed photocurrent increase and finite series and shunt resistances. A separate, simplified NOCT relation converts ambient temperature and sunlight into cell temperature; real module-temperature models additionally account for wind and mounting.`,
      caption: String.raw`Set the **ambient temperature** and the **sunshine**: the cell temperature follows (about 31 K above ambient at one sun, from the illustrative NOCT of 45 °C). The left panel overlays the I–V curve at 25 °C (dashed) with the hot one; the right panel plots the maximum power against cell temperature, with its tangent giving the temperature coefficient. The readout gives the voltage slope and the local fractional power slope $(1/P_{max})dP_{max}/dT$. **Illustrative model**, silicon-like parameters.`,
      deps: ['energy-4.3'],
      refs: ['SAM, Module: Nominal operating cell temperature; https://samrepo.nlr.gov/help/pv_module.html', 'Sandia PVPMC, NOCT Cell Temperature; https://pvpmc.sandia.gov/modeling-guide/2-dc-module-iv/cell-temperature/noct-cell-temperature/', 'De Soto five-parameter model, temperature dependence; https://pvpmc.sandia.gov/modeling-guide/2-dc-module-iv/single-diode-equivalent-circuit-models/de-soto-five-parameter-module-model/'],
      tags: ['photovoltaics', 'temperature', 'performance'],
      scope: String.raw`Ideal-diode silicon-like cell with $n=1$ and fixed band gap. The chosen NOCT of 45 °C is illustrative, not a measured module specification. The simple temperature rise law scales linearly with irradiance and omits the wind, mounting and conversion-efficiency corrections present in the full SAM model.`,
      viz(v) {
        const Ta = v.slider('ambient temperature (°C)', -10, 45, 30, { step: 1 });
        const G = v.slider('sunshine (suns)', 0.2, 1.2, 1, { step: 0.01 });
        const S = v.stage({ x: [0, 0.8], y: [0, 55], axes: 'box', gutter: true, height: 330, weight: 1.2, minWidth: 290, xlabel: 'voltage V (V)', ylabel: 'current density (mA/cm²)', title: 'I–V curve at 25 °C and hot' });
        const P = v.stage({ x: [-10, 95], y: [0.7, 1.15], axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 260, xlabel: 'cell temperature (°C)', ylabel: 'maximum power relative to 25 °C', title: 'power against temperature', yticks: [[0.7, '70%'], [0.8, '80%'], [0.9, '90%'], [1, '100%'], [1.1, '110%']] });
        const mk = (Tc, g) => cell({ suns: g, T: Tc + 273.15, j0ref: 1e-12, n: 1, rs: 0.6, rsh: 3000, alpha: 0.0005 });
        let st = null;
        v.render(() => {
          const g = G.value, Tcell = Ta.value + ((45 - 20) / 0.8) * g, c = mk(Tcell, g), c0 = mk(25, g);
          S.setView([0, 0.8], [0, Math.max(10, Math.ceil((c0.jsc() * 1.1) / 5) * 5)]);
          S.path(ivCurve(c0, 0, c0.voc(), 140), { color: 'muted', width: 2, dash: [6, 4] });
          S.path(ivCurve(c, 0, c.voc(), 140), { color: 'red', width: 3 });
          const m0 = c0.pmax(), m = c.pmax();
          S.rect(0, 0, m0.V, m0.J, { fill: 'muted', fillAlpha: 0.12, color: 'muted', width: 1.2, dash: [4, 4] });
          S.rect(0, 0, m.V, m.J, { fill: 'red', fillAlpha: 0.2, color: 'red', width: 1.6 });
          S.dot(c.voc(), 0, { r: 6, color: 'red' }); S.dot(c0.voc(), 0, { r: 6, color: 'muted', hollow: true });
          const rel = (T) => mk(T, g).pmax().P / m0.P;
          P.hline(1, { color: 'faint', width: 1, dash: [4, 4] });
          P.fn(rel, { domain: [-10, 95], color: 'accent', width: 3, n: 40 });
          P.vline(25, { color: 'faint', width: 1, dash: [4, 4] });
          P.dot(Tcell, rel(Tcell), { r: 8, color: 'red' });
          const h = 2, dVoc = (mk(Tcell + h, g).voc() - mk(Tcell - h, g).voc()) / (2 * h), dP = (rel(Tcell + h) - rel(Tcell - h)) / (2 * h);
          const T0 = Tcell; P.line(T0 - 12, rel(T0) - dP * 12, T0 + 12, rel(T0) + dP * 12, { color: 'orange', width: 1.8 });
          st = { Tcell, m, m0, dVoc, dP, voc: c.voc(), voc0: c0.voc() };
        });
        v.legend([['muted', '25 °C', { dash: true }], ['red', 'at the cell temperature']]);
        v.readout(() => {
          if (!st) return '';
          const { Tcell, m, m0, dVoc, dP, voc, voc0 } = st;
          return `Cell temperature ${v.fix(Tcell, 0)} °C: $V_{oc}=${v.fix(voc, 3)}$ V (${v.fix(1000 * (voc - voc0), 0)} mV from 25 °C) · slope $dV_{oc}/dT=${v.fix(1000 * dVoc, 2)}$ mV/K (${v.fix((100 * dVoc) / voc, 2)}%/K) · maximum power ${v.fix(m.P, 2)} mW/cm² = **${v.fix((100 * m.P) / m0.P, 1)}%** of its 25 °C value, local coefficient ${v.fix(100 * dP * m0.P / m.P, 2)}%/K`;
        });
      },
    },
  ],
};
