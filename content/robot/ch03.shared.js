// Robotics — Chapter 3: helpers shared by ch03.js (re-exports the chapter-2 toolbox, then adds forward-kinematics helpers)
export * from './ch02.shared.js';
import { cross3, vsc, twistExp, Tmul, I4, Rx, Rz, Ttrans, Trot, vadd, rodrigues } from './ch02.shared.js';

/** The screw axis S = (ω, v) of a revolute joint with unit axis w through the point q:  v = −ω × q. */
export const screwRev = (w, q) => [...w, ...vsc(cross3(w, q), -1)];
/** The screw axis of a prismatic joint with unit direction z:  (0, z). */
export const screwPris = (z) => [0, 0, 0, ...z];
/** Product of exponentials  e^{[S_1]θ_1} ⋯ e^{[S_n]θ_n} M  (S in the fixed frame, M the home pose); `reverse` multiplies in the opposite order. */
export function poe(S, th, M, reverse = false) {
  let T = I4();
  const idx = S.map((_, i) => i);
  if (reverse) idx.reverse();
  for (const i of idx) T = Tmul(T, twistExp(S[i].map((x) => x * th[i])));
  return Tmul(T, M);
}
/** Classical Denavit–Hartenberg link transform  Rot(z,θ) Trans(z,d) Trans(x,a) Rot(x,α). */
export function dhA(th, d, a, al) {
  const c = Math.cos(th), s = Math.sin(th), ca = Math.cos(al), sa = Math.sin(al);
  return [[c, -s * ca, s * sa, a * c], [s, c * ca, -c * sa, a * s], [0, sa, ca, d], [0, 0, 0, 1]];
}
/** The "modified" (Craig; Lynch–Park) link transform  Rot(x,α) Trans(x,a) Rot(z,θ) Trans(z,d). */
export function dhAmod(alPrev, aPrev, th, d) {
  return Tmul(Tmul(Trot(Rx(alPrev)), Ttrans([aPrev, 0, 0])), Tmul(Trot(Rz(th)), Ttrans([0, 0, d])));
}
/** Points of an arc of radius r about the axis through c with unit direction w, from direction u0 (⟂ w) by the signed angle ang. */
export function arcAbout(c, w, u0, ang, r, n = 20) {
  const pts = [];
  for (let k = 0; k <= n; k++) { const R = rodrigues(w, (ang * k) / n); pts.push(vadd(c, vsc([0, 1, 2].map((i) => R[i][0] * u0[0] + R[i][1] * u0[1] + R[i][2] * u0[2]), r))); }
  return pts;
}
