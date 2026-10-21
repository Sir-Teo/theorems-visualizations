// Dimensioned rigid-plastic demonstration, not a scale-conversion table or a tester.
export const INDENT = Object.freeze({ g: 9.80665, C: 3, beta: .2, D: 10, sharpStrain: .08, halfAngle: 68 * Math.PI / 180 });
export function flowAt(sref, n, e) { return sref * (e / .002) ** n; }
export function rockwellC(deltaMM) { if (!Number.isFinite(deltaMM)) throw new RangeError('finite differential depth required'); return 100 - deltaMM / .002; }
export function brinellNumber(Pkg, D, d) {
 if (!(Pkg > 0 && d > 0 && d <= D)) throw new RangeError('require 0 < d <= D and positive force');
 // Rationalized spherical-cap depth avoids catastrophic cancellation at small d/D.
 const h = d ** 2 / (2 * (D + Math.sqrt((D - d) * (D + d))));
 return Pkg / (Math.PI * D * h);
}
export function vickersNumber(Pkg, d) { return 2 * Math.sin(INDENT.halfAngle) * Pkg / d ** 2; }
export function indentation(tt, sref, n, Pkg) {
 if (!(sref > 0 && n >= 0 && n <= .5 && Pkg > 0)) throw new RangeError('positive reference flow stress/force and 0 <= n <= .5 required');
 const { g, C, beta, D, sharpStrain, halfAngle } = INDENT, PN = Pkg * g;
 if (tt === 'brinell') {
  const R = D / 2, B = beta / (R * .002);
  const a = (PN / (Math.PI * C * sref * B ** n)) ** (1 / (n + 2));
  if (a > R * (1 + 1e-12)) return { ok: false, reason: 'contact radius exceeds the ball radius', requiredRadius: a, R, D };
  const aa = Math.min(R, a), d = 2 * aa, er = beta * aa / R, h = aa ** 2 / (R + Math.sqrt(Math.max(0, (R - aa) * (R + aa))));
  const pm = PN / (Math.PI * aa ** 2);
  return { ok: true, a: aa, d, D, R, er, h, pm, HB: brinellNumber(Pkg,D,d), ratio: pm / sref };
 }
 if (tt !== 'vickers') throw new RangeError('choose brinell or vickers');
 const er = sharpStrain, pm = C * flowAt(sref,n,er), d = Math.sqrt(2 * PN / pm), hw = d / (2 * Math.SQRT2), h = hw / Math.tan(halfAngle);
 return { ok: true, er, pm, d, hw, h, HV: vickersNumber(Pkg,d), ratio: pm / sref };
}
export function minimumBallExponent(sref, Pkg) { const { D, g, C, beta } = INDENT; return Math.log(Pkg*g/(Math.PI*(D/2)**2*C*sref))/Math.log(beta/.002); }
