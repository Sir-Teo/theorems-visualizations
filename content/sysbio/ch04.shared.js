// Systems Biology — Chapter 4 shared helpers (toggle-switch steady states, ODE integration, Goldbeter–Koshland cycles).
// Re-exports the chapter-3 helpers (which re-export chapter 1's).
export * from './ch03.shared.js';

/** Hill repression 1/(1+x^n) in units of the half-repression constant. */
export const rep = (x, n) => 1 / (1 + Math.pow(Math.max(x, 0), n));

/** Steady states of the toggle  u' = a1/(1+v^b) − u,  v' = a2/(1+u^g) − v  (all in units of K, rate 1).
 *  Optional signed `ind`: ind > 0 is an inducer that inactivates u (v's promoter sees u/(1+ind)), ind < 0 one that inactivates v (u's promoter sees v/(1+|ind|)). Roots of G(v) − v on [0, a2] (G = v-nullcline composed with u-nullcline); the loop gain at a root is
 *  b·g·[v^b/(1+v^b)]·[u^g/(1+u^g)]; the root is stable iff gain < 1 (eigenvalues −1 ± √gain). Returns [{u, v, gain, stable}] by v. */
export function toggleRoots(a1, a2, b, g, ind = 0, N = 400) {
  const iu = 1 + Math.max(ind, 0), iv = 1 + Math.max(-ind, 0);
  const G = (v) => a2 * rep((a1 * rep(v / iv, b)) / iu, g);
  const h = (v) => G(v) - v;
  const out = [];
  let vp = 0, hp = h(0);
  for (let i = 1; i <= N; i++) {
    // geometric grid on [1e-4, a2] for resolution near 0, with 0 first
    const v = a2 * Math.pow(10, -4 + (4 * i) / N), hv = h(v);
    if (hp * hv <= 0 && hp !== hv) {
      let lo = vp, hi = v, hl = hp;
      for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2, hm = h(m); if (hl * hm <= 0) hi = m; else { lo = m; hl = hm; } }
      const vr = (lo + hi) / 2, u = a1 * rep(vr / iv, b), ue = u / iu, ve = vr / iv;
      const A = (b * Math.pow(ve, b)) / (1 + Math.pow(ve, b)), B = (g * Math.pow(ue, g)) / (1 + Math.pow(ue, g));
      out.push({ u, v: vr, gain: A * B, stable: A * B < 1 });
    }
    vp = v; hp = hv;
  }
  return out;
}

/** Fixed-step RK4 on a vector field F(y, t); returns the final state after n steps of size h from t0. */
export function rk4Step(F, y, t, h) {
  const add = (a, b, c) => a.map((x, i) => x + c * b[i]);
  const k1 = F(y, t), k2 = F(add(y, k1, h / 2), t + h / 2), k3 = F(add(y, k2, h / 2), t + h / 2), k4 = F(add(y, k3, h), t + h);
  return y.map((x, i) => x + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
}
/** Integrate F from y0 over [0, T] with n steps; returns [[t, ...y]] sampled each `every` steps. */
export function integrate(F, y0, T, n, every = 1) {
  const h = T / n, out = [[0, ...y0]]; let y = y0.slice();
  for (let i = 1; i <= n; i++) { y = rk4Step(F, y, (i - 1) * h, h); if (i % every === 0) out.push([i * h, ...y]); }
  return out;
}

/** Effective Hill coefficient of a monotone increasing response R(x) on x in [xlo, xhi]: ln 81 / ln(EC90/EC10),
 *  where ECq is where R crosses Rmin + q (Rmax − Rmin); Rmin and Rmax are taken from the end points. NaN if not crossed. */
export function hillEff(R, xlo, xhi, n = 600) {
  const xs = [], rs = [];
  for (let i = 0; i <= n; i++) { const x = xlo * Math.pow(xhi / xlo, i / n); xs.push(x); rs.push(R(x)); }
  const r0 = rs[0], r1 = rs[n];
  const at = (q) => {
    const lv = r0 + q * (r1 - r0);
    for (let i = 1; i <= n; i++) if ((rs[i - 1] - lv) * (rs[i] - lv) <= 0 && rs[i] !== rs[i - 1]) {
      const f = (lv - rs[i - 1]) / (rs[i] - rs[i - 1]); return Math.exp(Math.log(xs[i - 1]) + f * (Math.log(xs[i]) - Math.log(xs[i - 1])));
    }
    return NaN;
  };
  const a = at(0.1), b = at(0.9);
  return Math.log(81) / Math.log(b / a);
}

/** Michaelis–Menten saturation g(x) = x/(Km + x). */
export const mm = (x, Km) => x / (Km + x);
/** Steady state of a single covalent-modification cycle (Goldbeter–Koshland): fraction modified x solves
 *  g(x) = r·g(1 − x), r = (kinase activity)/(phosphatase activity), g(x) = x/(Km+x). Bisection. */
export function gk1(r, Km) {
  if (r <= 0) return 0;
  let lo = 0, hi = 1;
  for (let i = 0; i < 70; i++) { const x = (lo + hi) / 2; if (mm(x, Km) - r * mm(1 - x, Km) > 0) hi = x; else lo = x; }
  return (lo + hi) / 2;
}
/** Steady state of a two-step (distributive dual) cycle X0 ⇌ X1 ⇌ X2 with step ratios r1, r2: g(X1) = r1 g(X0), g(X2) = r2 g(X1),
 *  X0 + X1 + X2 = 1. Returns [X0, X1, X2]; bisection on X1. */
export function gk2(r1, r2, Km) {
  if (r1 <= 0) return [1, 0, 0];
  const parts = (x1) => {
    const g1 = mm(x1, Km), q0 = Math.min(g1 / r1, 1 - 1e-12), q2 = Math.min(r2 * g1, 1 - 1e-12);
    return [Km * q0 / (1 - q0), x1, Km * q2 / (1 - q2)];
  };
  let lo = 0, hi = 1;
  for (let i = 0; i < 70; i++) { const x1 = (lo + hi) / 2, p = parts(x1); if (p[0] + p[1] + p[2] > 1) hi = x1; else lo = x1; }
  return parts((lo + hi) / 2);
}

/** Reduced lac-operon model (illustrative, not fitted). Permease P and internal inducer X, time in units of 1/(dilution rate):
 *    P' = α (ε + X^n)/(1 + X^n) − P,     X' = κ (φ + P) · e/(1+e) − X,
 *  e = external inducer / K_transport. At steady state X solves X = κσ(φ + α·D(X)), σ = e/(1+e), D(X) = (ε+X^n)/(1+X^n).
 *  Returns the roots X (ascending) with stability from the slope of the right side (stable iff slope < 1). */
export const lacD = (X, n, eps) => (eps + Math.pow(X, n)) / (1 + Math.pow(X, n));
export function lacRoots(e, p, N = 400) {
  const s = e / (1 + e), top = p.kap * s * (p.phi + p.al) * 1.05 + 1e-9;
  const h = (X) => p.kap * s * (p.phi + p.al * lacD(X, p.n, p.eps)) - X;
  const out = []; let xp = 0, hp = h(0);
  for (let i = 1; i <= N; i++) {
    const X = (top * i) / N, hv = h(X);
    if (hp * hv <= 0 && hp !== hv) {
      let lo = xp, hi = X, hl = hp;
      for (let k = 0; k < 50; k++) { const m = (lo + hi) / 2, hm = h(m); if (hl * hm <= 0) hi = m; else { lo = m; hl = hm; } }
      const x = (lo + hi) / 2, d = 1e-6 * (1 + x);
      const slope = (p.kap * s * p.al * (lacD(x + d, p.n, p.eps) - lacD(x - d, p.n, p.eps))) / (2 * d);
      out.push({ X: x, stable: slope < 1 });
    }
    xp = X; hp = hv;
  }
  return out;
}
