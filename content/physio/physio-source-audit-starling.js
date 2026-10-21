// Classical frozen-compartment teaching model, not Starling's measured perfusion data.
// Polynomial is reproduced in Weinstein (2017), equation46, with c in g/dL and pi in mmHg.
export const oncoticPressure = c => 2.1*c + .16*c*c + .009*c**3;
export function frozenFiltration(Pc, protein, duration, { Kf = .01, Pi = -3, tissueProteinPressure = 0, mass = 1000 } = {}) {
  const oncotic = oncoticPressure(protein), balance = Pi + oncotic - tissueProteinPressure;
  const flux = Kf * (Pc - balance), gain = flux * duration * mass / 100;
  return { oncotic, balance, flux, gain };
}
