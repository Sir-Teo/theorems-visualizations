// Number Theory — Chapter 4 shared helpers. Re-exports the chapter-3 helpers (which re-export chapter 2's).
export * from './ch03.shared.js';
import { gcd, mod, powmod, isPrime, fac } from './ch03.shared.js';

/** Largest prime <= m (at least 2). */
export const primeAtMost = (m) => { let p = Math.max(2, Math.floor(m)); while (!isPrime(p)) p--; return p; };
/** Nearest odd prime to m within [lo, hi]. */
export function nearOddPrime(m, lo = 3, hi = 1000) {
  m = Math.round(m); for (let d = 0; d < 1000; d++) for (const c of [m - d, m + d]) if (c >= lo && c <= hi && c > 2 && isPrime(c)) return c;
  return 3;
}
/** Legendre symbol (a/p), p odd prime: 1, -1 or 0. */
export function legendre(a, p) { a = mod(a, p); if (a === 0) return 0; return powmod(a, (p - 1) / 2, p) === 1 ? 1 : -1; }
/** Jacobi symbol (a/n), n odd positive, by factoring n. */
export function jacobi(a, n) { let r = 1; for (const [p, e] of fac(n)) { const l = legendre(a, p); if (l === 0) return 0; if (e % 2 && l < 0) r = -r; } return r; }
/** Set of squares (including 0) modulo n. */
export function squaresMod(n) { const s = new Set(); for (let x = 0; x < n; x++) s.add((x * x) % n); return s; }
/** Smallest quadratic non-residue modulo odd prime p. */
export function nonResidue(p) { for (let z = 2; z < p; z++) if (legendre(z, p) === -1) return z; return 0; }
/** Reduce to the symmetric range (-n/2, n/2]. */
export const sym = (x, n) => { x = mod(x, n); return x > n / 2 ? x - n : x; };
/** Number of inversions of an array. */
export function inversions(arr) { let c = 0; for (let i = 0; i < arr.length; i++) for (let j = i + 1; j < arr.length; j++) if (arr[i] > arr[j]) c++; return c; }
/** Quadratic Gauss sum with arbitrary weights: sum_{a=1}^{n-1} w(a) exp(2 pi i a / n) -> [re, im]. */
export function gaussSum(n, w) { let re = 0, im = 0; for (let a = 1; a < n; a++) { const t = (2 * Math.PI * a) / n, c = w(a); re += c * Math.cos(t); im += c * Math.sin(t); } return [re, im]; }
/** Signed Jacobi weights (a/n) for use in gaussSum. */
export const jw = (n) => (a) => jacobi(a, n);
