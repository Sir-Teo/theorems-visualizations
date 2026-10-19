// Energy Systems — Chapter 4, landmark paper: Shockley & Queisser (1961).
// Reviewed 2026-10-18: source passages, corrections, test commands and remaining
// tandem-literature blocker are recorded in docs/verification/energy-ch04.md.
// All cell, atmospheric-notch, cloud and reverse-bias parameters are illustrative.

import { KB, QE, SIGMA as SIG, junction, junctionMax, phot } from './ch04.shared.js';
/** Recompute the paper's geometry with generalized Planck emission at high concentration. */
function sq(Eg, o) {
  const j = junction(Eg, Infinity, o), mp = junctionMax(j), P = o.fw * o.conc * SIG * o.Ts ** 4;
  return { eta: mp.P / P, u: Eg * QE * j.A / P, Voc: j.Voc, Vmp: mp.V, Jsc: QE * j.A / 10, P };
}

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
      statement: String.raw`A single-junction solar cell with band gap $E_g$, illuminated by a blackbody sun and held at a fixed cell temperature, has an efficiency limit set by thermodynamics alone. Photons below $E_g$ are not absorbed; each absorbed photon yields at most one electron–hole pair whose excess energy above $E_g$ is lost as heat; and by **detailed balance** the cell must emit radiation as a blackbody does, so radiative recombination grows as $e^{qV/kT_c}$ and caps the voltage below $E_g/q$. In the paper's dilute-emission approximation, the current is
$$J(V) = q\left[f_\omega Q_s(E_g) - 2\,Q_c(E_g)\,e^{qV/kT_c}\right],$$
and maximising $JV$ gives an efficiency of about **30%** for a 6000 K sun and a 300 K cell, near $E_g \approx 1.1$–$1.3$ eV, against an "ultimate efficiency" (no recombination) of 44%.

Scope: one junction, one electron per photon, unconcentrated sunlight, no nonradiative losses. Concentration, multiple junctions, hot carriers or multiple excitons can exceed it; real cells fall below it.`,
      idea: String.raw`In the 1950s, after the Bell Labs silicon cell (1954, 6%), limits on efficiency were estimated from empirical diode parameters, which made the limit look like a matter of materials quality. Shockley and Queisser argued instead from the principle of detailed balance (thermo-9.10): a body that absorbs light must also emit it, at a rate fixed by Kirchhoff's and Planck's laws (thermo-9.4), so even a perfect material recombines radiatively. That makes the limit a function only of the band gap and the temperatures of sun and cell (energy-4.3). Their calculation supplies a reproducible radiative benchmark (energy-4.5). The paper distinguishes the spectral cutoff loss, the open-circuit voltage loss and the load-matching factor; all three enter the output power.`,
      caption: String.raw`**Left**: the power spectrum of a blackbody sun (photon energy on the axis). Drag the **band gap**: photons below it are lost (red); excess energy above the gap heats the cell (orange); purple allocates the further radiative and load-matching losses, leaving the actual electrical output in green. **Right**: the detailed-balance efficiency against band gap (green) and the "ultimate" efficiency with no recombination (dashed), for the chosen blackbody spectrum. Change the sun's **temperature**, **concentrate** the light (up to the geometric maximum, about 46,000 suns) or let the cell emit from **one face** only, and watch the limit move. At high concentration the visualization extends the original exponential approximation with generalized Planck emission to keep $qV<E_g$.`,
      deps: ['thermo-9.4', 'thermo-9.10', 'energy-4.3'],
      refs: ['Shockley & Queisser (1961), pp. 510–517, Eqs. (2.2), (3.8)–(3.18), (5.2)–(5.6), Fig. 6', 'Markvart (2022), §6, Eqs. (12)–(13), DOI 10.1002/wene.430 (high-concentration extension)'],
      tags: ['photovoltaics', 'thermodynamics', 'efficiency'],
      credit: 'William Shockley & Hans-Joachim Queisser, 1961',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Shockley%E2%80%93Queisser_limit' },
      viz(v) {
        const M = v.M;
        const Eg = v.slider('band gap Eg (eV)', 0.4, 3, 1.1, { step: 0.01 });
        const Ts = v.slider('sun temperature (K)', 4000, 7000, 6000, { step: 10 });
        const lc = v.slider('concentration (log₁₀ suns)', 0, Math.log10(1 / 2.18e-5), 0, { step: 0.01, fmt: (x) => `${Math.round(10 ** x).toLocaleString('en-US')}×` });
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
          const vfrac = R.eta / R.u; // actual electrical share of the above-gap usable energy, including radiative current loss
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
          E.vline(eg, { color: 'gold', width: 1.4 });
          E.dot(eg, R.eta, { r: 7, color: 'gold' });
          E.text(`${v.fix(100 * R.eta, 1)}%`, eg, R.eta, { dx: 10, dy: -12, align: 'left', size: 12.5, weight: 700, color: 'gold', plate: true });
          st = { R, best: curve[bi], o };
        });
        v.legend([['red', 'below gap: not absorbed', { area: true }], ['orange', 'above gap: heat', { area: true }], ['purple', 'radiative and load-matching losses', { area: true }], ['green', 'electrical output', { area: true }], ['muted', 'ultimate efficiency', { dash: true }]]);
        v.readout(() => {
          if (!st) return '';
          const { R, best, o } = st;
          const std = o.Ts === 6000 && o.conc === 1 && o.faces === 2;
          return `Eg = ${v.fix(Eg.value, 2)} eV: efficiency **${v.fix(100 * R.eta, 1)}%** (ultimate ${v.fix(100 * R.u, 1)}%), open-circuit voltage ${v.fix(R.Voc, 3)} V = ${v.fix((100 * R.Voc) / Eg.value, 0)}% of $E_g/q$ · maximum ${v.fix(100 * best[1], 1)}% at ${v.fix(best[0], 2)} eV${std ? ' — Shockley & Queisser: “30% for an energy gap of 1.1 ev” (the curve is flat: 29.4% at 1.1 eV, 30.4% at 1.32 eV)' : ''}. The terrestrial AM1.5G spectrum and measured device records are not plotted.`;
        });
      },
    },
  ],
};
