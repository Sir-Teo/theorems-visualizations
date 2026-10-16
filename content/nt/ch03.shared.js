// Number Theory — Chapter 3 shared helpers (plain functions). Re-exports the chapter-2 helpers.
export * from './ch02.shared.js';
import { gcd, mod, ord, primeFactors, totient, isPrime, divisors } from './ch02.shared.js';

/** Units of Z/nZ in increasing order. */
export function unitsOf(n) { const u = []; for (let a = 1; a < n; a++) if (gcd(a, n) === 1) u.push(a); if (n === 1) u.push(0); return u; }
/** Orders of all units: Map a -> ord. */
export function orderTable(n) { const t = new Map(); for (const a of unitsOf(n)) t.set(a, n === 1 ? 1 : ord(a, n)); return t; }
/** Does Z/nZ have a primitive root? (brute force, small n) */
export function hasRoot(n) { if (n <= 2) return true; const ph = totient(n); for (let a = 2; a < n; a++) if (gcd(a, n) === 1 && ord(a, n) === ph) return true; return false; }
/** Smallest primitive root of n or 0. */
export function smallestRoot(n) { if (n <= 2) return n - 1; const ph = totient(n); for (let a = 2; a < n; a++) if (gcd(a, n) === 1 && ord(a, n) === ph) return a; return 0; }
/** Is n of the form 1, 2, 4, p^k, 2 p^k (p odd prime)? */
export function gaussShape(n) { if (n === 1 || n === 2 || n === 4) return true; let m = n % 2 === 0 ? n / 2 : n; if (n % 4 === 0) return false; const f = primeFactors(m); return f.length === 1 && f[0] % 2 === 1; }
/** Factorization [[p, e], ...]. */
export function fac(n) { const out = []; for (let d = 2; d * d <= n; d++) if (n % d === 0) { let e = 0; while (n % d === 0) { n /= d; e++; } out.push([d, e]); } if (n > 1) out.push([n, 1]); return out; }
export const lcm = (a, b) => (a / gcd(a, b)) * b;
/** Cyclic factors of (Z/nZ)^x as orders: [{label, order}], with the extra Z/2 for 2^k, k >= 3. */
export function unitFactors(n) {
  const out = [];
  for (const [p, e] of fac(n)) {
    if (p === 2) { if (e === 2) out.push({ p, e, order: 2, tag: '(ℤ/4ℤ)ˣ' }); else if (e >= 3) { out.push({ p, e, order: 2, tag: 'ℤ/2 (−1)' }); out.push({ p, e, order: 2 ** (e - 2), tag: 'ℤ/' + 2 ** (e - 2) + ' (5)' }); } }
    else out.push({ p, e, order: (p - 1) * p ** (e - 1), tag: 'ℤ/' + (p - 1) * p ** (e - 1) });
  }
  return out;
}
/** Carmichael function lambda(n) = exponent of the unit group. */
export function lambda(n) { let l = 1; for (const f of unitFactors(n)) l = lcm(l, f.order); return l; }
/** Number of elements of each order in a product of cyclic groups with the given orders -> Map(order -> count). */
export function orderCounts(orders) {
  let cur = new Map([[1, 1]]);
  for (const m of orders) {
    const cc = new Map();
    for (let k = 0; k < m; k++) { const o = m / gcd(k, m); cc.set(o, (cc.get(o) || 0) + 1); }
    const nx = new Map();
    for (const [a, ca] of cur) for (const [b, cb] of cc) { const l = lcm(a, b); nx.set(l, (nx.get(l) || 0) + ca * cb); }
    cur = nx;
  }
  return cur;
}
/** Integer polynomial helpers (ascending coefficients, Numbers). */
export function polyDivExact(num, den) {
  const q = new Array(num.length - den.length + 1).fill(0), r = num.slice();
  for (let i = q.length - 1; i >= 0; i--) { q[i] = r[i + den.length - 1] / den[den.length - 1]; for (let j = 0; j < den.length; j++) r[i + j] -= q[i] * den[j]; }
  return q;
}
const cycloCache = new Map();
/** Coefficients (ascending) of the n-th cyclotomic polynomial. */
export function cyclo(n) {
  if (cycloCache.has(n)) return cycloCache.get(n);
  let num = new Array(n + 1).fill(0); num[0] = -1; num[n] = 1;
  for (const d of divisors(n)) if (d < n) num = polyDivExact(num, cyclo(d));
  cycloCache.set(n, num); return num;
}
/** Evaluate an integer polynomial at an integer (BigInt) point. */
export function evalBig(coef, x) { let r = 0n; for (let i = coef.length - 1; i >= 0; i--) r = r * x + BigInt(coef[i]); return r; }
/** Pretty TeX for a polynomial (ascending coefficient array), highest degree first. */
export function polyTex(c, v = 'x', maxTerms = 14) {
  const terms = [];
  for (let i = c.length - 1; i >= 0; i--) if (c[i] !== 0) terms.push([i, c[i]]);
  let s = ''; let shown = 0;
  for (const [i, a] of terms) {
    if (shown >= maxTerms) { s += '+\\cdots'; break; }
    const m = Math.abs(a), mon = i === 0 ? '' : i === 1 ? v : `${v}^{${i}}`;
    const body = i === 0 ? String(m) : (m === 1 ? '' : String(m)) + mon;
    s += (shown === 0 ? (a < 0 ? '-' : '') : a < 0 ? '-' : '+') + body; shown++;
  }
  return s || '0';
}
/** Primes below n. */
export function sieve(n) { const s = new Uint8Array(n + 1); const out = []; for (let i = 2; i <= n; i++) { if (!s[i]) { out.push(i); for (let j = i * i; j <= n; j += i) s[j] = 1; } } return out; }
/** BigInt modpow. */
export function bpow(b, e, m) { let r = 1n; b %= m; if (b < 0n) b += m; while (e > 0n) { if (e & 1n) r = (r * b) % m; b = (b * b) % m; e >>= 1n; } return r; }
/** Strong-test classification of base a for odd n: 'witness' | 'liar'. chain = [a^d, a^{2d}, ..., a^{2^s d}] mod n. */
export function strongChain(a, n) {
  let d = n - 1, s = 0; while (d % 2 === 0) { d /= 2; s++; }
  const chain = [powmodNum(a, d, n)];
  for (let i = 0; i < s; i++) chain.push((chain[i] * chain[i]) % n);
  let liar = chain[0] === 1; for (let i = 0; i < s; i++) if (chain[i] === n - 1) liar = true;
  return { d, s, chain, liar };
}
export function powmodNum(b, e, m) { let r = 1 % m; b = mod(b, m); while (e > 0) { if (e & 1) r = (r * b) % m; b = (b * b) % m; e = Math.floor(e / 2); } return r; }
/** Carmichael numbers below 20000 by Korselt's criterion. */
export function isKorselt(n) { if (n < 3 || isPrime(n)) return false; const f = fac(n); return f.every(([p, e]) => e === 1 && (n - 1) % (p - 1) === 0); }
