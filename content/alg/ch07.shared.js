// Abstract Algebra (Judson) — Chapter 7: helpers shared by ch07.js and ch07-b.js (plain named exports).
// Letters are numbered A = 0 … Z = 25; all cipher arithmetic is done mod 26 on those numbers.
export * from './ch06.shared.js';

export const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const m26 = (x) => ((x % 26) + 26) % 26;
export const gcdN = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
export const invMod = (a, n) => { for (let x = 1; x < n; x++) if ((a * x) % n === 1 % n) return x; return null; };
export const UNITS26 = [1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25];

// Relative frequencies (percent) of the letters A–Z in running English: the commonly quoted published table
// (rounded to three decimals; it is a standard textbook table, not measured here).
export const ENG = [8.167, 1.492, 2.782, 4.253, 12.702, 2.228, 2.015, 6.094, 6.966, 0.153, 0.772, 4.025, 2.406, 6.749, 7.507, 1.929, 0.095, 5.987, 6.327, 9.056, 2.758, 0.978, 2.36, 0.15, 1.974, 0.074];

export const lettersOnly = (t) => String(t).toUpperCase().replace(/[^A-Z]/g, '');
// Apply a letter map f: 0..25 -> 0..25 to a text; spaces and punctuation pass through.
export const mapText = (txt, f) => [...String(txt).toUpperCase()].map((ch) => { const p = ABC.indexOf(ch); return p < 0 ? ch : ABC[f(p)]; }).join('');
export function counts26(txt) { const c = Array(26).fill(0); for (const ch of String(txt).toUpperCase()) { const p = ABC.indexOf(ch); if (p >= 0) c[p]++; } return c; }
export const abcTicks = ABC.split('').map((ch, j) => [j + 0.5, ch]);

// Euclid on (a, b): rows {a, b, q, r} with a = q b + r, until r = 0.
export function euclidRows(a, b) { const rows = []; while (b) { const q = Math.floor(a / b), r = a - q * b; rows.push({ a, b, q, r }); [a, b] = [b, r]; } return rows; }
export function egcdN(a, b) { if (!b) return { g: a, x: 1, y: 0 }; const r = egcdN(b, a % b); return { g: r.g, x: r.y, y: r.x - Math.floor(a / b) * r.y }; }
// modular power on safe integers (modulus below 9e7)
export function powmod(b, e, m) { let r = 1 % m, x = b % m; while (e > 0) { if (e & 1) r = (r * x) % m; x = (x * x) % m; e = Math.floor(e / 2); } return r; }
// the multiplications square-and-multiply performs for exponent e
export const smSteps = (e) => { const bits = e.toString(2); return { bits, squarings: bits.length - 1, multiplies: bits.split('').filter((c) => c === '1').length - 1 }; };
export const SMALL_PRIMES = [3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67];

/** Judson2023 Example7.4: affine matrix cipher, with a column offset. */
export const hillPair = ([a,b,c,d], [u,w], [x,y]) => [m26(a*x+b*y+u), m26(c*x+d*y+w)];
