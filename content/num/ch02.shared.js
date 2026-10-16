// Numerical Analysis — Chapter 2 (nonlinear equations): helpers shared by ch02.js and ch02-b.js.
// Everything is ordinary double-precision arithmetic; "true" roots are found by long bisection / Newton polishing.

export const lg = (e) => Math.log10(Math.max(Math.abs(e), 1e-17));
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
export const sup = (n) => String(n).split('').map((d) => (d === '-' ? '⁻' : SUP[+d])).join('');
/** Plain-text scientific notation. */
export function sci(x, d = 3) {
  if (x === 0) return '0'; if (!isFinite(x)) return x > 0 ? '∞' : '−∞';
  const [m, e] = x.toExponential(d - 1).split('e'); return `${m.replace('-', '−')}×10${sup(+e)}`;
}
/** TeX scientific notation. */
export function tsci(x, d = 3) {
  if (x === 0) return '0'; if (!isFinite(x)) return x > 0 ? '\\infty' : '-\\infty';
  const [m, e] = x.toExponential(d - 1).split('e'); return +e === 0 ? m : `${m}\\times10^{${+e}}`;
}
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

/** Bisection to full double precision on a sign-changing bracket. */
export function bisectRoot(f, a, b, n = 200) {
  let fa = f(a);
  for (let i = 0; i < n; i++) {
    const c = (a + b) / 2, fc = f(c);
    if (fc === 0) return c;
    if (fa * fc < 0) b = c; else { a = c; fa = fc; }
  }
  return (a + b) / 2;
}
/** Newton iterates x_0..x_n (stops early at a zero derivative or a non-finite value). mult = multiplicity factor. */
export function newtonSeq(f, df, x0, n, mult = 1) {
  const xs = [x0]; let x = x0;
  for (let i = 0; i < n; i++) {
    const d = df(x); if (!d || !isFinite(d)) break;
    x -= mult * f(x) / d; if (!isFinite(x)) break;
    xs.push(x);
  }
  return xs;
}
/** Secant iterates. */
export function secantSeq(f, x0, x1, n) {
  const xs = [x0, x1];
  for (let i = 0; i < n; i++) {
    const a = xs[xs.length - 2], b = xs[xs.length - 1], fa = f(a), fb = f(b);
    if (fb === fa) break;
    const x = b - fb * (b - a) / (fb - fa); if (!isFinite(x)) break;
    xs.push(x);
  }
  return xs;
}
/** Empirical order p_n = ln(e_{n+1}/e_n) / ln(e_n/e_{n-1}) from the last usable triple of errors (null if none). */
export function lastOrder(errs, floor = 1e-14) {
  for (let i = errs.length - 1; i >= 2; i--) {
    const a = errs[i - 2], b = errs[i - 1], c = errs[i];
    if (a > floor && b > floor && c > floor * 0.1 && a !== b && b !== c) {
      const p = Math.log(c / b) / Math.log(b / a); if (isFinite(p)) return p;
    }
  }
  return null;
}

/** One-variable test functions with derivatives and a bracketed root. */
export const FUN = {
  cosx: { key: 'cosx', tex: '\\cos x - x', f: (x) => Math.cos(x) - x, df: (x) => -Math.sin(x) - 1, d2: (x) => -Math.cos(x), xr: [-1, 3], yr: [-2.8, 2], ra: 0, rb: 1.5, x0: 2.4 },
  cubic: { key: 'cubic', tex: 'x^3 - 2x - 5', f: (x) => x ** 3 - 2 * x - 5, df: (x) => 3 * x * x - 2, d2: (x) => 6 * x, xr: [-0.5, 3.5], yr: [-10, 14], ra: 2, rb: 2.2, x0: 3.2 },
  exp: { key: 'exp', tex: 'e^x - 3', f: (x) => Math.exp(x) - 3, df: (x) => Math.exp(x), d2: (x) => Math.exp(x), xr: [-1.5, 3], yr: [-5, 10], ra: 1, rb: 1.2, x0: -0.5 },
};
for (const F of Object.values(FUN)) F.root = bisectRoot(F.f, F.ra, F.rb);

// ---------------------------------------------------------------- 2-D nonlinear systems
const solve2 = (J, F) => { const det = J[0][0] * J[1][1] - J[0][1] * J[1][0]; if (!det || !isFinite(det)) return null; return [(F[0] * J[1][1] - F[1] * J[0][1]) / det, (J[0][0] * F[1] - J[1][0] * F[0]) / det]; };
export { solve2 };
/** Largest singular value of a 2x2 matrix. */
export function norm2(A) {
  const S = A[0][0] ** 2 + A[0][1] ** 2 + A[1][0] ** 2 + A[1][1] ** 2, D = A[0][0] * A[1][1] - A[0][1] * A[1][0];
  return Math.sqrt((S + Math.sqrt(Math.max(S * S - 4 * D * D, 0))) / 2);
}
export const inv2 = (J) => { const det = J[0][0] * J[1][1] - J[0][1] * J[1][0]; return det ? [[J[1][1] / det, -J[0][1] / det], [-J[1][0] / det, J[0][0] / det]] : null; };
export const nrm = (a) => Math.hypot(a[0], a[1]);

export const SYS = {
  hyp: {
    key: 'hyp', name: 'circle and hyperbola', texF: String.raw`x^2+y^2=4,\quad xy=1`,
    F: ([x, y]) => [x * x + y * y - 4, x * y - 1],
    J: ([x, y]) => [[2 * x, 2 * y], [y, x]],
    view: [[-3.2, 3.2], [-3.2, 3.2]], K: Math.sqrt(5), x0: [2.6, 0.4],
  },
  sine: {
    key: 'sine', name: 'circle and sine curve', texF: String.raw`y=\sin 2x,\quad x^2+y^2=2`,
    F: ([x, y]) => [y - Math.sin(2 * x), x * x + y * y - 2],
    J: ([x, y]) => [[-2 * Math.cos(2 * x), 1], [2 * x, 2 * y]],
    view: [[-2.4, 2.4], [-2.4, 2.4]], K: 2.9, x0: [0.3, 1.9],
  },
};
for (const S of Object.values(SYS)) {
  const roots = [];
  for (let i = 0; i <= 24; i++) for (let j = 0; j <= 24; j++) {
    let p = [-3 + i / 4, -3 + j / 4];
    for (let k = 0; k < 60; k++) { const d = solve2(S.J(p), S.F(p)); if (!d) break; p = [p[0] - d[0], p[1] - d[1]]; if (!isFinite(p[0]) || Math.abs(p[0]) > 50) break; }
    if (isFinite(p[0]) && nrm(S.F(p)) < 1e-12 && !roots.some((r) => Math.hypot(r[0] - p[0], r[1] - p[1]) < 1e-7)) roots.push(p);
  }
  S.roots = roots;
}
export const nearestRoot = (S, p) => { let best = Infinity; for (const r of S.roots) best = Math.min(best, Math.hypot(p[0] - r[0], p[1] - r[1])); return best; };
export function newtonSys(S, p0, n, damped = false) {
  const pts = [p0]; let p = p0;
  for (let i = 0; i < n; i++) {
    const F = S.F(p), d = solve2(S.J(p), F); if (!d) break;
    let a = 1;
    if (damped) { const f0 = F[0] ** 2 + F[1] ** 2; while (a > 1e-4) { const q = [p[0] - a * d[0], p[1] - a * d[1]], Fq = S.F(q); if (Fq[0] ** 2 + Fq[1] ** 2 <= (1 - 2e-4 * a) * f0) break; a /= 2; } }
    p = [p[0] - a * d[0], p[1] - a * d[1]]; if (!isFinite(p[0]) || Math.abs(p[0]) > 1e6) break;
    pts.push(p);
  }
  return pts;
}
