import { gauss } from './ch03.shared.js';

// Wall geometry of the ventricle as a thick sphere of constant wall volume Vw (mL): cavity V → inner radius, outer radius, thickness (cm).
export function wall(V, Vw) {
  const ri = Math.cbrt((3 * Math.max(V, 1)) / (4 * Math.PI)), ro = Math.cbrt(ri ** 3 + (3 * Vw) / (4 * Math.PI));
  return { ri, ro, h: ro - ri };
}

// Frontal-plane heart vector: sum of Gaussian waves, each with a fixed direction (clinical angle: 0° = lead I, +90° = pointing down).
const WAVES = [
  { n: 'P', mu: 0.045, sd: 0.02, amp: 0.15, ang: 60 }, { n: 'Q', mu: 0.07, sd: 0.007, amp: 0.13, ang: 150 }, { n: 'R', mu: 0.088, sd: 0.011, amp: 1.0, ang: 60 },
  { n: 'S', mu: 0.108, sd: 0.01, amp: 0.3, ang: -135 }, { n: 'T', mu: 0.3, sd: 0.05, amp: 0.32, ang: 45 },
];
/** Heart vector [x, y] (screen coordinates, y up) at time t, with the whole family of directions rotated by `rot` degrees. */
export function hvec(t, rot, which) {
  let x = 0, y = 0;
  for (const w of WAVES) { if (which && !which.includes(w.n)) continue; const a = ((w.ang + rot) * Math.PI) / 180, g = w.amp * gauss(t, w.mu, w.sd); x += g * Math.cos(a); y -= g * Math.sin(a); }
  return [x, y];
}
export const LEADS = [{ n: 'I', ang: 0, color: 'accent' }, { n: 'II', ang: 60, color: 'green' }, { n: 'III', ang: 120, color: 'orange' }];
export const leadAxis = (ang) => [Math.cos((ang * Math.PI) / 180), -Math.sin((ang * Math.PI) / 180)];
export const proj = (H, ang) => { const u = leadAxis(ang); return H[0] * u[0] + H[1] * u[1]; };

