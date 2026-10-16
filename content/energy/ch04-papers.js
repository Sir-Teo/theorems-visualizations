// Energy Systems — Chapter 4, landmark paper: Shockley & Queisser (1961).
//
// Data: the paper's model, recomputed here (no measured data needed). Sun = blackbody at Ts = 6000 K seen under the
// solid-angle factor f_ω = 2.18×10⁻⁵, cell at Tc = 300 K emitting from both faces (as in the paper's standard case,
// t_s = 1, f = 1). Numerically: ultimate efficiency 43.9% at 1.12 eV; detailed-balance maximum 30.4% at 1.32 eV, and
// 29.4% at 1.1 eV — the curve is flat near its top, and the paper quotes "30% for an energy gap of 1.1 ev".
// Today: under the standard AM1.5G spectrum the limit is 33.7% at 1.34 eV (Rühle 2016, Solar Energy 130: 139–147);
// record single-junction cells: GaAs 29.1% (Alta Devices, 2018) and crystalline Si 26.7% (Kaneka, 2017), both from
// Green et al., Solar cell efficiency tables (Prog. Photovolt.).

const KB = 8.617333262e-5, HP = 4.135667696e-15, CL = 2.99792458e8, QE = 1.602176634e-19, SIG = 5.670374419e-8;
const PREF = (2 * Math.PI) / (HP ** 3 * CL ** 2); // photons m⁻² s⁻¹ per eV³ (E in eV)
/** Blackbody photon flux above Eg (per m² per s, hemispherical), temperature T. */
function flux(Eg, T) { const n = 600, Emax = Eg + 36 * KB * T, dE = (Emax - Eg) / n; let s = 0; for (let i = 0; i <= n; i++) { const E = Eg + i * dE; s += ((i === 0 || i === n) ? 0.5 : 1) * (E * E) / Math.expm1(E / (KB * T)); } return PREF * s * dE; }
/** Detailed-balance efficiency: max over V of q V [f Qs − F Qc e^{qV/kTc}] / P. */
function sq(Eg, o) {
  const fw = o.fw * o.conc, Qs = fw * flux(Eg, o.Ts), Qc = o.faces * flux(Eg, o.Tc), P = fw * SIG * o.Ts ** 4;
  const vt = KB * o.Tc, Voc = vt * Math.log(1 + Qs / Qc);
  let best = 0, bv = 0;
  for (let i = 1; i < 400; i++) { const V = (Voc * i) / 400, p = QE * V * (Qs - Qc * Math.expm1(V / vt)); if (p > best) { best = p; bv = V; } }
  return { eta: best / P, u: (Eg * QE * Qs) / P, Voc, Vmp: bv, Jsc: (QE * Qs) / 10, P };
}
const REC = [[1.12, 0.267, 'Si 26.7% (2017)'], [1.42, 0.291, 'GaAs 29.1% (2018)']];

export default {
  collection: 'energy',
  chapter: 4,
  items: [
    {
      num: '4.12',
      kind: 'Paper',
      name: 'Detailed Balance Limit of Efficiency of Solar Cells',
      paper: { authors: 'William Shockley and Hans J. Queisser', year: 1961, title: 'Detailed Balance Limit of Efficiency of p-n Junction Solar Cells', venue: 'Journal of Applied Physics 32 (3): 510–519', doi: '10.1063/1.1736034' },
      introduces: ['energy-4.5', 'mat-9.10'],
      statement: String.raw`A single-junction solar cell with band gap $E_g$, illuminated by a blackbody sun and in thermal equilibrium with its surroundings, has an efficiency limit set by thermodynamics alone. Photons below $E_g$ are not absorbed; each absorbed photon yields at most one electron–hole pair whose excess energy above $E_g$ is lost as heat; and by **detailed balance** the cell must emit radiation as a blackbody does, so radiative recombination grows as $e^{qV/kT_c}$ and caps the voltage below $E_g/q$. The current is
$$J(V) = q\left[f_\omega Q_s(E_g) - 2\,Q_c(E_g)\,e^{qV/kT_c}\right],$$
and maximising $JV$ gives an efficiency of about **30%** for a 6000 K sun and a 300 K cell, near $E_g \approx 1.1$–$1.3$ eV, against an "ultimate efficiency" (no recombination) of 44%.

Scope: one junction, one electron per photon, unconcentrated sunlight, no nonradiative losses. Concentration, multiple junctions, hot carriers or multiple excitons can exceed it; real cells fall below it.`,
      idea: String.raw`In the 1950s, after the Bell Labs silicon cell (1954, 6%), limits on efficiency were estimated from empirical diode parameters, which made the limit look like a matter of materials quality. Shockley and Queisser argued instead from the principle of detailed balance (thermo-9.10): a body that absorbs light must also emit it, at a rate fixed by Kirchhoff's and Planck's laws (thermo-9.4), so even a perfect material recombines radiatively. That makes the limit a function only of the band gap and the temperatures of sun and cell (energy-4.3). The paper was initially hard to publish and was little cited for two decades; it is now one of the most cited papers in solar energy, the benchmark against which every new material is judged (energy-4.5), and the starting point for "third-generation" schemes that try to beat it (mat-9.10).`,
      caption: String.raw`**Left**: the power spectrum of a blackbody sun (photon energy on the axis). Drag the **band gap**: photons below it are lost (red); of each absorbed photon only $E_g$ is usable (green), the excess heats the cell (orange); radiative recombination then takes a further share through the voltage. **Right**: the detailed-balance efficiency against band gap (green) and the "ultimate" efficiency with no recombination (dashed), with record cells today. Change the sun's **temperature**, **concentrate** the light (up to the maximum, 46,000 suns) or let the cell emit from **one face** only, and watch the limit move.`,
      deps: ['thermo-9.4', 'thermo-9.10', 'energy-4.3'],
      refs: [],
      tags: ['photovoltaics', 'thermodynamics', 'efficiency'],
      credit: 'William Shockley & Hans-Joachim Queisser, 1961',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Shockley%E2%80%93Queisser_limit' },
      viz(v) {
        const M = v.M;
        const Eg = v.slider('band gap Eg (eV)', 0.4, 3, 1.1, { step: 0.01 });
        const Ts = v.slider('sun temperature (K)', 4000, 7000, 6000, { step: 10 });
        const lc = v.slider('concentration (log₁₀ suns)', 0, Math.log10(46200), 0, { step: 0.01, fmt: (x) => `${Math.round(10 ** x).toLocaleString('en-US')}×` });
        const faces = v.select('cell emits from', [{ value: '2', label: 'both faces (paper)' }, { value: '1', label: 'one face' }], '2');
        const S = v.stage({ x: [0, 4.5], y: [0, 1.08], axes: 'box', gutter: true, height: 330, weight: 1.1, minWidth: 260, xlabel: 'photon energy (eV)', ylabel: 'spectral power (relative)', title: 'where the sunlight goes' });
        const E = v.stage({ x: [0.4, 3], y: [0, 0.5], axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 260, xlabel: 'band gap Eg (eV)', ylabel: 'efficiency', yticks: [[0, '0'], [0.1, '10%'], [0.2, '20%'], [0.3, '30%'], [0.4, '40%'], [0.5, '50%']], title: 'the detailed-balance limit' });
        let curveKey = '', curve = null;
        let st = null;
        v.render(() => {
          const o = { Ts: Ts.value, Tc: 300, fw: 2.18e-5, conc: 10 ** lc.value, faces: Number(faces.value) };
          const kT = KB * o.Ts, eg = Eg.value;
          // spectrum: E^3/(e^{E/kT}-1), normalised to its peak
          const spec = (x) => (x ** 3) / Math.expm1(x / kT);
          const peak = spec(2.821 * kT);
          const f = (x) => spec(x) / peak;
          S.between((x) => f(x), () => 0, 0.001, eg, { fill: 'red', fillAlpha: 0.35 });
          S.between((x) => f(x), (x) => (f(x) * eg) / x, eg, 4.5, { fill: 'orange', fillAlpha: 0.45 });
          const R = sq(eg, o);
          const vfrac = R.Vmp / eg; // usable voltage fraction at the maximum power point
          S.between((x) => (f(x) * eg) / x, (x) => (f(x) * eg * vfrac) / x, eg, 4.5, { fill: 'purple', fillAlpha: 0.35 });
          S.between((x) => (f(x) * eg * vfrac) / x, () => 0, eg, 4.5, { fill: 'green', fillAlpha: 0.65 });
          S.fn(f, { color: 'ink', width: 1.8, domain: [0.001, 4.5] });
          S.vline(eg, { color: 'ink', width: 1.5, dash: [5, 4] });
          S.text(`Eg = ${v.fix(eg, 2)} eV`, eg, 1.03, { dx: 6, align: 'left', size: 12, weight: 700 });
          // efficiency curve (cached on the settings)
          const key = `${o.Ts}|${o.conc}|${o.faces}`;
          if (key !== curveKey) { curveKey = key; curve = []; for (let x = 0.4; x <= 3.0001; x += 0.02) { const r = sq(x, o); curve.push([x, r.eta, r.u]); } }
          E.path(curve.map((p) => [p[0], p[2]]), { color: 'muted', width: 1.6, dash: [6, 4] });
          E.path(curve.map((p) => [p[0], p[1]]), { color: 'green', width: 2.8 });
          let bi = 0; curve.forEach((p, i) => { if (p[1] > curve[bi][1]) bi = i; });
          E.dot(curve[bi][0], curve[bi][1], { r: 5, color: 'green', hollow: true });
          for (const [x, y, lab] of REC) { E.dot(x, y, { r: 5, color: 'red' }); E.text(lab, x, y, { dx: x < 1.3 ? -6 : 6, dy: 30, align: x < 1.3 ? 'right' : 'left', size: 11, color: 'red', weight: 600, plate: true }); }
          E.vline(eg, { color: 'gold', width: 1.4 });
          E.dot(eg, R.eta, { r: 7, color: 'gold' });
          E.text(`${v.fix(100 * R.eta, 1)}%`, eg, R.eta, { dx: 10, dy: -12, align: 'left', size: 12.5, weight: 700, color: 'gold', plate: true });
          st = { R, best: curve[bi], o };
        });
        v.legend([['red', 'below gap: not absorbed', { area: true }], ['orange', 'above gap: heat', { area: true }], ['purple', 'radiative recombination (voltage below Eg/q)', { area: true }], ['green', 'electrical output', { area: true }], ['muted', 'ultimate efficiency', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { R, best, o } = st;
          const std = o.Ts === 6000 && o.conc === 1 && o.faces === 2;
          return `Eg = ${v.fix(Eg.value, 2)} eV: efficiency **${v.fix(100 * R.eta, 1)}%** (ultimate ${v.fix(100 * R.u, 1)}%), open-circuit voltage ${v.fix(R.Voc, 3)} V = ${v.fix((100 * R.Voc) / Eg.value, 0)}% of $E_g/q$ · maximum ${v.fix(100 * best[1], 1)}% at ${v.fix(best[0], 2)} eV${std ? ' — Shockley & Queisser: “30% for an energy gap of 1.1 ev” (the curve is flat: 29.4% at 1.1 eV, 30.4% at 1.32 eV)' : ''}. Today: 33.7% at 1.34 eV under the real AM1.5G spectrum; best single-junction cells GaAs 29.1%, Si 26.7%.`;
        });
      },
    },
  ],
};
