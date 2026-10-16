// Quantum Chemistry — Chapter 2: helpers shared by ch02.js and ch02-b.js.
// Atomic units (ħ = mₑ = e = 4πε₀ = 1; length a₀, energy hartree) unless an item says otherwise.

export const TAU = 2 * Math.PI;
export const HARTREE_EV = 27.211386;   // eV per hartree (CODATA 2018: 27.211386245988)
export const RY_EV = 13.605693;        // eV, Rydberg energy hc·R∞ (CODATA 2018: 13.605693122994)
export const A0_PM = 52.917721;        // pm, Bohr radius (CODATA 2018: 52.917721090)

export const fact = (n) => { let f = 1; for (let i = 2; i <= n; i++) f *= i; return f; };

/** Associated Laguerre polynomial L_k^(α)(x). */
export function lagL(k, a, x) {
  if (k === 0) return 1;
  let p = 1, q = 1 + a - x;
  for (let i = 1; i < k; i++) { const c = ((2 * i + 1 + a - x) * q - (i + a) * p) / (i + 1); p = q; q = c; }
  return q;
}
/** Hydrogen-like radial function R_nl(r) for nuclear charge Z (r in a₀): ∫R² r² dr = 1. */
export function Rnl(n, l, r, Z = 1) {
  const rho = (2 * Z * r) / n, N = Math.sqrt(((2 * Z) / n) ** 3 * fact(n - l - 1) / (2 * n * fact(n + l)));
  return N * Math.exp(-rho / 2) * rho ** l * lagL(n - l - 1, 2 * l + 1, rho);
}
/** Associated Legendre P_l^m(x), m ≥ 0, no Condon–Shortley phase. */
export function legP(l, m, x) {
  let pmm = 1; const s = Math.sqrt(Math.max(0, 1 - x * x));
  for (let i = 1; i <= m; i++) pmm *= (2 * i - 1) * s;
  if (l === m) return pmm;
  let p1 = x * (2 * m + 1) * pmm; if (l === m + 1) return p1;
  for (let ll = m + 2; ll <= l; ll++) { const p2 = ((2 * ll - 1) * x * p1 - (ll + m - 1) * pmm) / (ll - m); pmm = p1; p1 = p2; }
  return p1;
}
/** Real spherical harmonic, orthonormal on the sphere: m > 0 ∝ cos mφ, m < 0 ∝ sin|m|φ. */
export function realY(l, m, th, ph) {
  const am = Math.abs(m), N = Math.sqrt(((2 * l + 1) / (4 * Math.PI)) * fact(l - am) / fact(l + am)), P = legP(l, am, Math.cos(th));
  return m === 0 ? N * P : Math.SQRT2 * N * P * (m > 0 ? Math.cos(am * ph) : Math.sin(am * ph));
}
/** Real orbital names (TeX) by l and m. */
export const REAL_NAMES = {
  0: { 0: 's' },
  1: { '-1': 'p_y', 0: 'p_z', 1: 'p_x' },
  2: { '-2': 'd_{xy}', '-1': 'd_{yz}', 0: 'd_{z^2}', 1: 'd_{xz}', 2: 'd_{x^2-y^2}' },
  3: { '-3': 'f_{y(3x^2-y^2)}', '-2': 'f_{xyz}', '-1': 'f_{yz^2}', 0: 'f_{z^3}', 1: 'f_{xz^2}', 2: 'f_{z(x^2-y^2)}', 3: 'f_{x(x^2-3y^2)}' },
};
export const LETTER = 'spdfghi';
export const orbTeX = (n, l, m) => `${n ? n : ''}${REAL_NAMES[l]?.[m] ?? `${LETTER[l]}_{m=${m}}`}`;

/** Azimuth φ₀ of a half-plane through the z axis in which the real harmonic (l, m) is largest in modulus. */
export const phi0 = (m) => (m >= 0 ? 0 : Math.PI / (2 * Math.abs(m)));

/** ∫ f(θ, φ) dΩ on a midpoint grid. */
export function sphereInt(f, nt = 72, np = 144) {
  let s = 0;
  for (let i = 0; i < nt; i++) { const th = ((i + 0.5) / nt) * Math.PI, w = Math.sin(th); for (let j = 0; j < np; j++) s += f(th, ((j + 0.5) / np) * TAU) * w; }
  return (s * Math.PI * TAU) / (nt * np);
}

/** Polar surface r = R0·|f|/max|f| of a real function on the sphere, coloured by sign (accent: +, orange: −). */
export function lobes(s3, f, R0, o = {}) {
  let mx = 0;
  for (let i = 0; i <= 40; i++) for (let j = 0; j < 40; j++) mx = Math.max(mx, Math.abs(f((i / 40) * Math.PI, (j / 40) * TAU)));
  mx = mx || 1;
  s3.surface((th, ph) => { const r = (R0 * Math.abs(f(th, ph))) / mx; return [r * Math.sin(th) * Math.cos(ph), r * Math.sin(th) * Math.sin(ph), r * Math.cos(th)]; },
    [0, Math.PI], [0, TAU], { nu: o.nu ?? 44, nv: o.nv ?? 64, alpha: o.alpha ?? 0.92, colorFn: (th, ph) => (f(th, ph) >= 0 ? 'accent' : 'orange') });
  return mx;
}

/** Zero crossings of a sampled function, refined by linear interpolation: returns the abscissae. */
export function zeros(f, a, b, n = 2000) {
  const out = []; let x0 = a, f0 = f(a);
  for (let i = 1; i <= n; i++) { const x1 = a + ((b - a) * i) / n, f1 = f(x1); if (f0 * f1 < 0) out.push(x0 + ((x1 - x0) * f0) / (f0 - f1)); x0 = x1; f0 = f1; }
  return out;
}

/** Lowest `k` radial levels of −½u'' + [l(l+1)/2r² + V(r)]u = Eu (hartree) on [0, rmax]; Richardson-extrapolated from h and h/2.
 *  Returns {E, u (k arrays on the fine grid, ∫u² dr = 1), h, r(i)}. */
export function radialLevels(M, V, l, k, { rmax = 80, h = 0.04 } = {}) {
  const solve = (hh) => {
    const N = Math.round(rmax / hh), d = new Float64Array(N), e = new Float64Array(N - 1).fill(-0.5 / (hh * hh));
    for (let i = 0; i < N; i++) { const r = (i + 1) * hh; d[i] = 1 / (hh * hh) + (l * (l + 1)) / (2 * r * r) + V(r); }
    return M.tridiagEig(d, e, k);
  };
  const a = solve(2 * h), b = solve(h);
  const E = b.values.map((x, i) => (4 * x - a.values[i]) / 3);
  const u = b.vectors.map((vec) => {
    const w = new Float64Array(vec.length); let s = 0, big = 0, ib = 0;
    for (let i = 0; i < vec.length; i++) { s += vec[i] * vec[i]; if (Math.abs(vec[i]) > big) { big = Math.abs(vec[i]); ib = i; } }
    const c = 1 / Math.sqrt(s * h), sg = Math.sign(vec[Math.min(vec.length - 1, 3)] || 1);
    for (let i = 0; i < vec.length; i++) w[i] = vec[i] * c * sg;
    return w;
  });
  return { E, u, h, r: (i) => (i + 1) * h };
}

/** A palette colour (name) → [r, g, b] through the runtime (works for any theme). */
export const rgbOf = (v, c) => v.rgb(c).slice(0, 3);
