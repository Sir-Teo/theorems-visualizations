// History of Technology — Chapter 4 shared helpers (imported by ch04.js and ch04-b.js).
// Re-exports the chapter 3 helpers (dated-evidence strip, year formatting, lumps), and adds the physical models
// of this chapter: the water-wheel power models, the flat-plate sail/blade-element model and the arch thrust line.
export * from './ch03.shared.js';

export const RHO = 1000; // kg/m³ (water)
export const G = 9.81;   // m/s²

// ---------------------------------------------------------------- water wheels (idealised models, not fits to data)
/** Undershot wheel in a close-fitting race: the jet leaves the sluice at v = sqrt(2gH) and pushes flat floats (impulse). `leak` is the share of the flow that slips past the floats. */
export function undershotP(u, { Q, H, leak = 0.25 }) {
  const v = Math.sqrt(2 * G * H);
  return u >= 0 && u < v ? RHO * Q * (1 - leak) * (v - u) * u : 0;
}
/** How full a bucket gets at rim speed u (m/s): the buckets are sized so that they just fill at u = 1/1.5 m/s; slower than that they are over-full (fill capped at 1, the rest overflows at the top), faster they fill only partly. */
export function bucketFill(u) { return Math.min(1, 1 / Math.max(1e-6, 1.5 * u)); }
/** Overshot wheel of radius R = 0.45 H fed at the top: weight of the water in the buckets does the work. Returns {P, Qused, fall}. */
export function overshotP(u, { Q, H }) {
  const R = 0.45 * H;
  if (u <= 0) return { P: 0, Qused: 0, fall: 0, R };
  const fill = bucketFill(u);                                  // a bucket's fill when it is loaded at the top
  const thetaD = (125 + 55 * (1 - fill)) * Math.PI / 180;      // angle from the top at which the bucket begins to spill (fuller buckets spill sooner)
  const cent = 1 - Math.min(0.5, u * u / (G * R));             // centrifugal spill of the water at the top, capped
  const Qused = Q * Math.min(1, 1.5 * u) * cent;               // flow that is actually carried down (the rest overflows when buckets are over-full)
  const fall = R * (1 - Math.cos(thetaD));
  return { P: Math.max(0, RHO * G * Qused * fall - 0.5 * RHO * Qused * u * u), Qused, fall, R };
}
/** Breast-shot wheel of radius R = 0.4 H, water admitted 60° after the top: partly impulse of the incoming jet, partly weight in the buckets. */
export function breastP(u, { Q, H, leak = 0.25 }) {
  const R = 0.4 * H, thIn = Math.PI / 3, hIn = H - R * (1 + Math.cos(thIn)), vIn = Math.sqrt(2 * G * Math.max(0, hIn));
  if (u <= 0) return 0;
  const fill = bucketFill(u), thetaD = (125 + 55 * (1 - fill)) * Math.PI / 180;
  const Qused = Q * Math.min(1, 1.5 * u) * (1 - Math.min(0.5, u * u / (G * R)));
  const weight = RHO * G * Qused * R * Math.max(0, Math.cos(thIn) - Math.cos(thetaD));
  const impulse = u < vIn ? RHO * Q * (1 - leak) * (vIn - u) * u : 0;
  return Math.max(0, weight + impulse * 0.6 - 0.5 * RHO * Qused * u * u);
}

// ---------------------------------------------------------------- flat-plate sails (thin plate, model polar)
/** Lift and drag coefficients of a thin flat plate at angle of attack a (radians, any sign): CL = 1.1 sin 2a, CD = 0.05 + 1.3 sin² a. A model polar, chosen to look like a thin cloth or board sail. */
export function plate(a) {
  return { CL: 1.1 * Math.sin(2 * a), CD: 0.05 + 1.3 * Math.sin(a) ** 2 };
}

/**
 * Blade-element/momentum power coefficient of a windmill with B flat sails of constant chord.
 * lambda = tip speed / wind speed; beta(r) = angle of weather (radians, measured from the plane of rotation) at the radial fraction r in (0, 1];
 * solidity: total sail area / swept area. Returns Cp = P / (½ρπR²U³), by iterating the axial and tangential induction factors.
 */
export function windCp(lambda, beta, { B = 4, solidity = 0.2, hub = 0.15, n = 18 } = {}) {
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const r = hub + (1 - hub) * (i + 0.5) / n, dr = (1 - hub) / n;
    const lr = lambda * r, c = solidity * Math.PI / B, b = beta(r); // chord in units of R: sigma_local = B c / (2 pi r)
    const sig = B * c / (2 * Math.PI * r);
    let a = 0.2, ap = 0, phi = 0.5;
    for (let it = 0; it < 80; it++) {
      phi = Math.atan2(1 - a, lr * (1 + ap));
      const { CL, CD } = plate(phi - b);
      const Cn = CL * Math.cos(phi) + CD * Math.sin(phi), Ct = CL * Math.sin(phi) - CD * Math.cos(phi);
      const s2 = Math.sin(phi) ** 2, sc = Math.sin(phi) * Math.cos(phi);
      let aN = 1 / (4 * s2 / (sig * Cn || 1e-9) + 1);
      let apN = 1 / (4 * sc / (sig * Ct || 1e-9) - 1);
      if (!isFinite(aN)) aN = a; if (!isFinite(apN)) apN = ap;
      aN = Math.max(-0.2, Math.min(0.9, aN)); apN = Math.max(-0.5, Math.min(2, apN));
      a = 0.7 * a + 0.3 * aN; ap = 0.7 * ap + 0.3 * apN;
    }
    phi = Math.atan2(1 - a, lr * (1 + ap));
    const { CL, CD } = plate(phi - b), Ct = CL * Math.sin(phi) - CD * Math.cos(phi);
    const W2 = ((1 - a) / Math.sin(phi)) ** 2;
    sum += B * c * W2 * Ct * r * dr;
  }
  return Math.max(0, lambda * sum / Math.PI);
}
export const BETZ = 16 / 27;

// ---------------------------------------------------------------- masonry arch (thrust-line statics, Heyman's assumptions)
/**
 * A circular voussoir arch of intrados radius 1 (centre at the origin), thickness t (as a fraction of the intrados radius), half-opening angle alpha,
 * N voussoir joints from the crown (k = 0) to the springing (k = N). Returns the joints and the feasible region of crown thrust (H, yc):
 * a symmetric thrust line exists inside the masonry for each such pair. H is in units of the weight of a half arch.
 */
export function archGeometry(t, alpha, N = 24) {
  const Ri = 1, Re = 1 + t, dth = alpha / N, Wk = [], xk = [];
  let Wtot = 0;
  for (let k = 0; k < N; k++) {
    const w = 0.5 * (Re * Re - Ri * Ri) * dth;
    const rc = (2 / 3) * (Re ** 3 - Ri ** 3) / (Re * Re - Ri * Ri) * (Math.sin(dth / 2) / (dth / 2));
    const th = (k + 0.5) * dth;
    Wk.push(w); xk.push(rc * Math.sin(th)); Wtot += w;
  }
  return { Ri, Re, N, alpha, dth, Wk, xk, Wtot };
}
/** The radial position rho_k (between Ri and Re when the thrust line is inside the masonry) of the thrust line at joint k, for crown thrust H (units of half-arch weight) at height yc. */
export function thrustAt(A, H, yc) {
  const out = [], { N, dth, Wk, xk, Wtot } = A;
  let V = 0, M = 0; const Hh = H * Wtot;
  out.push(yc);
  for (let k = 1; k <= N; k++) {
    V += Wk[k - 1]; M += Wk[k - 1] * xk[k - 1];
    const th = k * dth;
    out.push((Hh * yc + M) / (Hh * Math.cos(th) + V * Math.sin(th)));
  }
  return out;
}
/** Exact feasible interval in H and B = H*yc for the discrete voussoir model.
 * Each joint gives a lower and upper affine bound on B. Every lower bound must
 * lie below every upper bound; eliminating B leaves a one-dimensional interval.
 * The diagnostic scan is used only to draw an inadmissible line after failure. */
export function archFeasible(A, nH = 70, nY = 40) {
  const { Ri, Re, N, dth, Wk, xk, Wtot } = A;
  const lower = [], upper = [];
  let V = 0, M = 0;
  for (let k = 0; k <= N; k++) {
    if (k) { V += Wk[k - 1]; M += Wk[k - 1] * xk[k - 1]; }
    const c = Math.cos(k * dth), vs = V * Math.sin(k * dth) / Wtot, m = M / Wtot;
    lower.push([Ri * c, Ri * vs - m]);
    upper.push([Re * c, Re * vs - m]);
  }
  let Hmin = 0, Hmax = Infinity, possible = true;
  for (const [a, b] of lower) for (const [c, d] of upper) {
    const slope = a - c, rhs = d - b;
    if (Math.abs(slope) < 1e-13) { if (rhs < -1e-12) possible = false; }
    else if (slope > 0) Hmax = Math.min(Hmax, rhs / slope);
    else Hmin = Math.max(Hmin, rhs / slope);
  }
  const point = (H) => {
    const lo = Math.max(...lower.map(([a, b]) => a * H + b));
    const hi = Math.min(...upper.map(([a, b]) => a * H + b));
    return { H, yc: (lo + hi) / (2 * H) };
  };
  if (possible && Hmax > 0 && Hmin <= Hmax + 1e-12) {
    Hmin = Math.max(Hmin, 1e-12);
    return { ok: true, Hmin, Hmax, min: point(Hmin), max: point(Hmax),
      middle: point((Hmin + Hmax) / 2) };
  }
  let best = null;
  for (let i = 0; i < nH; i++) {
    const H = 0.05 * Math.pow(60, i / (nH - 1));
    for (let j = 0; j < nY; j++) {
      const yc = Ri + (Re - Ri) * (j + 0.5) / nY;
      const viol = Math.max(...thrustAt(A, H, yc).map((rho) => Math.max(Ri - rho, rho - Re, 0)));
      if (!best || viol < best.viol) best = { H, yc, viol };
    }
  }
  return { ok: false, Hmin, Hmax, best };
}
