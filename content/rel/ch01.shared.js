// Shared helpers for Special & General Relativity — Chapter 1 (units c = 1 unless stated; events (t, x) drawn with x across, t up).

export const gam = (b) => 1 / Math.sqrt(1 - b * b);
/** (t, x) in the lab frame → (t′, x′) in the frame moving at +b. */
export const toMoving = (b, t, x) => { const g = gam(b); return [g * (t - b * x), g * (x - b * t)]; };
/** (t′, x′) in the frame moving at +b → (t, x) in the lab frame. */
export const fromMoving = (b, tp, xp) => { const g = gam(b); return [g * (tp + b * xp), g * (xp + b * tp)]; };
/** Plot position of an event (t, x). */
export const P = (t, x) => [x, t];

/** The two light lines through (t0, x0), drawn across the stage window. */
export function lightLines(s, R = 12, st = {}, t0 = 0, x0 = 0) {
  s.line(x0 - R, t0 - R, x0 + R, t0 + R, { color: 'gold', width: 1.2, alpha: 0.55, dash: [4, 4], ...st });
  s.line(x0 - R, t0 + R, x0 + R, t0 - R, { color: 'gold', width: 1.2, alpha: 0.55, dash: [4, 4], ...st });
}

/** Muon rest lifetime in µs and mass in MeV/c² (PDG). */
export const TAU_MU = 2.1969811;
export const M_MU = 105.6583755;
export const C_KM_US = 0.299792458; // km per µs
