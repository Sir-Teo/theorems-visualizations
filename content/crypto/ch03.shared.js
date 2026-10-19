// Cryptography — Chapter 3 shared helpers (computational security, pseudorandomness).
// Re-exports chapter 2 (and through it chapter 1) and adds toy generators, statistical tests and a toy keyed function.
export * from './ch02.shared.js';

import { pix } from './ch02.shared.js';
/** pix() with text centred by default (pass align: 'left' / 'right' to override). */
export function pixc(s) { const P = pix(s), t = P.text; P.text = (str, x, y, st) => t(str, x, y, { align: 'center', ...st }); return P; }

/** 32-bit integer mixer (murmur3 finaliser): good avalanche, NOT cryptographic. */
export function mix32(x) {
  x ^= x >>> 16; x = Math.imul(x, 0x85ebca6b); x ^= x >>> 13; x = Math.imul(x, 0xc2b2ae35); x ^= x >>> 16; return x >>> 0;
}
export const mix2 = (a, b) => mix32((mix32(a >>> 0) ^ Math.imul(b >>> 0, 0x9e3779b1)) >>> 0);
export const hex = (x, w = 4) => (x >>> 0).toString(16).toUpperCase().padStart(w, '0');
/** Coupled lazy function/permutation answers at distinct inputs; agree until the first collision. */
export function coupledOracleAnswers(r, N, count) {
  const f = [], p = [], used = new Set();
  for (let i = 0; i < Math.min(count, N); i++) {
    const y = Math.floor(r() * N); let z = y;
    if (used.has(z)) do { z = Math.floor(r() * N); } while (used.has(z));
    f.push(y); p.push(z); used.add(z);
  }
  return { f, p };
}
/** 1.96 standard errors of a proportion p estimated from n samples. */
export const ci95 = (p, n) => 1.96 * Math.sqrt(Math.max(p * (1 - p), 1e-12) / n);
/** Exact Pr[no collision among q uniform draws from N values] as a log. */
export const logNoColl = (N, q) => { let s = 0; for (let i = 1; i < q; i++) s += Math.log1p(-i / N); return s; };

// ------------------------------------------------------------------ toy bit generators (seed → L bits)
export const GENS = [
  { value: 'mixer', label: 'Hash mixer (looks random)' },
  { value: 'lfsr', label: '32-bit LFSR (linear)' },
  { value: 'lcg', label: 'LCG low bit' },
  { value: 'repeat', label: 'Seed repeated' },
  { value: 'biased', label: 'Biased: OR of two bits' },
];
export const GEN_NOTE = {
  mixer: 'The output bits are the top bit of $\\mathrm{mix}(s,i)$ for $i=0,1,\\dots$ — a non-cryptographic hash finaliser, statistically good here.',
  lfsr: 'A 32-bit linear feedback shift register run for $L$ steps: it passes the simple statistical tests yet is a linear recurrence that Berlekamp–Massey recovers from $64$ output bits.',
  lcg: 'The lowest bit of the linear congruential generator $x\\mapsto 1664525x+1013904223 \\bmod 2^{32}$ strictly alternates.',
  repeat: 'The $32$ seed bits repeated over and over (a stretch of $32$ bits to $L$ bits, with period $32$).',
  biased: 'Each output bit is the OR of two mixer bits, so $\\Pr[1]=\\tfrac34$.',
};
/** Output of generator `kind` on the 32-bit seed, L bits (Uint8Array of 0/1). */
export function genBits(kind, seed, L) {
  const out = new Uint8Array(L); seed >>>= 0;
  if (kind === 'mixer') for (let i = 0; i < L; i++) out[i] = mix2(seed, i) >>> 31;
  else if (kind === 'biased') for (let i = 0; i < L; i++) out[i] = (mix2(seed, 2 * i) >>> 31) | (mix2(seed, 2 * i + 1) >>> 31);
  else if (kind === 'lfsr') { let s = seed || 1; for (let i = 0; i < L; i++) { const b = s & 1; s = (s >>> 1) ^ (b ? 0x80200003 : 0); out[i] = b; } }
  else if (kind === 'lcg') { let x = seed; for (let i = 0; i < L; i++) { out[i] = x & 1; x = (Math.imul(x, 1664525) + 1013904223) >>> 0; } }
  else for (let i = 0; i < L; i++) out[i] = (seed >>> (i % 32)) & 1;
  return out;
}
export const randomBitsFrom = (r, L) => { const o = new Uint8Array(L); for (let i = 0; i < L; i++) o[i] = r() < 0.5 ? 1 : 0; return o; };

// ------------------------------------------------------------------ statistical tests (each returns a z-like statistic, ≈ N(0,1) on random bits)
/** Linear complexity of a bit string (Berlekamp–Massey over GF(2)). */
export function linComplexity(s) {
  const n = s.length; let C = new Uint8Array(n + 1), B = new Uint8Array(n + 1); C[0] = 1; B[0] = 1;
  let L = 0, m = -1;
  for (let N = 0; N < n; N++) {
    let d = s[N]; for (let i = 1; i <= L; i++) d ^= C[i] & s[N - i];
    if (d) { const T = C.slice(); for (let i = 0; i + N - m <= n; i++) C[i + N - m] ^= B[i]; if (L <= N / 2) { L = N + 1 - L; m = N; B = T; } }
  }
  return L;
}
export const TESTS = [
  { value: 'freq', label: 'Frequency' },
  { value: 'runs', label: 'Runs' },
  { value: 'auto', label: 'Autocorrelation (lag $k$)' },
  { value: 'lin', label: 'Linear complexity' },
];
export function testZ(kind, b, lag = 1) {
  const L = b.length;
  if (kind === 'freq') { let S = 0; for (let i = 0; i < L; i++) S += b[i]; return (S - L / 2) / (Math.sqrt(L) / 2); }
  if (kind === 'runs') { let R = 1; for (let i = 1; i < L; i++) if (b[i] !== b[i - 1]) R++; return (R - (1 + (L - 1) / 2)) / (Math.sqrt(L - 1) / 2); }
  if (kind === 'auto') { const n = L - lag; let a = 0; for (let i = 0; i < n; i++) if (b[i] === b[i + lag]) a++; return (a - n / 2) / (Math.sqrt(n) / 2); }
  return (linComplexity(b.subarray(0, 256)) - 128) / 1.03;
}

// ------------------------------------------------------------------ a toy keyed function on 16 bits and on 8 bits
export const prf16 = (k, x) => mix2(k, x) & 0xffff;
export const prf32 = (k, x) => mix2(k, x);
/** A keyed permutation of 0..255 (4-round Feistel on nibbles with a hashed round function). */
export function feistel8(k, x) {
  let l = x >> 4, r = x & 15;
  for (let i = 0; i < 4; i++) { const f = mix2(k, (i << 4) | r) & 15; [l, r] = [r, l ^ f]; }
  return (l << 4) | r;
}

// ------------------------------------------------------------------ message-sequence ladder (pixel space, via pix())
/** Draw a ladder diagram: two lifelines (names), rows = [{dir: 1|-1|0, text, color}]; returns row y positions. */
export function ladder(P, names, rows, o = {}) {
  const { W } = P, x1 = o.x1 ?? Math.max(70, W * 0.16), x2 = o.x2 ?? W - Math.max(90, W * 0.2), top = o.top ?? 44, rh = o.rh ?? 26;
  [[x1, names[0], 'accent'], [x2, names[1], 'orange']].forEach(([x, n, c]) => {
    const bw = Math.max(104, n.length * 8.2 + 22); P.rect(x - bw / 2, 8, bw, 22, { fill: c, fillAlpha: 0.16, color: c, width: 1.5, radius: 7 });
    P.text(n, x, 19, { size: 12, weight: 700, color: c, halo: false });
    P.line(x, 34, x, top + rows.length * rh + 6, { color: 'faint', width: 1.5, dash: true });
  });
  const ys = rows.map((r, i) => top + i * rh + rh / 2);
  rows.forEach((r, i) => {
    const y = ys[i], col = r.color || 'ink';
    if (r.dir === 1) P.arrow(x1 + 3, y, x2 - 3, y, { color: col, width: 1.8 });
    else if (r.dir === -1) P.arrow(x2 - 3, y, x1 + 3, y, { color: col, width: 1.8 });
    if (r.dir === 0) P.text(r.text, (x1 + x2) / 2, y, { size: 12, color: col, weight: 600, halo: false });
    else P.text(r.text, (x1 + x2) / 2, y - 9, { size: 11.5, color: col, weight: 600, halo: false });
  });
  return ys;
}
