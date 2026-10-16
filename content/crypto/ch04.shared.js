// Cryptography — Chapter 4 shared helpers (stream ciphers, block ciphers, modes of operation).
// Re-exports chapter 3 (and through it chapters 2 and 1); adds real DES, AES-128, ChaCha20 and RC4 implementations
// (checked against the published test vectors in the comments), LFSR/Berlekamp–Massey tools and 4-bit S-box analysis.
export * from './ch03.shared.js';

export const hx = (x, w = 2) => (x >>> 0).toString(16).toUpperCase().padStart(w, '0');
export const popcnt = (x) => { let c = 0; x >>>= 0; while (x) { c += x & 1; x >>>= 1; } return c; };

// ------------------------------------------------------------------ DES (FIPS 46-3 tables, 0-indexed, as in the public-domain pyDes)
const DES_T = {"pc1":[56,48,40,32,24,16,8,0,57,49,41,33,25,17,9,1,58,50,42,34,26,18,10,2,59,51,43,35,62,54,46,38,30,22,14,6,61,53,45,37,29,21,13,5,60,52,44,36,28,20,12,4,27,19,11,3],"left_rotations":[1,1,2,2,2,2,2,2,1,2,2,2,2,2,2,1],"pc2":[13,16,10,23,0,4,2,27,14,5,20,9,22,18,11,3,25,7,15,6,26,19,12,1,40,51,30,36,46,54,29,39,50,44,32,47,43,48,38,55,33,52,45,41,49,35,28,31],"ip":[57,49,41,33,25,17,9,1,59,51,43,35,27,19,11,3,61,53,45,37,29,21,13,5,63,55,47,39,31,23,15,7,56,48,40,32,24,16,8,0,58,50,42,34,26,18,10,2,60,52,44,36,28,20,12,4,62,54,46,38,30,22,14,6],"expansion_table":[31,0,1,2,3,4,3,4,5,6,7,8,7,8,9,10,11,12,11,12,13,14,15,16,15,16,17,18,19,20,19,20,21,22,23,24,23,24,25,26,27,28,27,28,29,30,31,0],"sbox":[[14,4,13,1,2,15,11,8,3,10,6,12,5,9,0,7,0,15,7,4,14,2,13,1,10,6,12,11,9,5,3,8,4,1,14,8,13,6,2,11,15,12,9,7,3,10,5,0,15,12,8,2,4,9,1,7,5,11,3,14,10,0,6,13],[15,1,8,14,6,11,3,4,9,7,2,13,12,0,5,10,3,13,4,7,15,2,8,14,12,0,1,10,6,9,11,5,0,14,7,11,10,4,13,1,5,8,12,6,9,3,2,15,13,8,10,1,3,15,4,2,11,6,7,12,0,5,14,9],[10,0,9,14,6,3,15,5,1,13,12,7,11,4,2,8,13,7,0,9,3,4,6,10,2,8,5,14,12,11,15,1,13,6,4,9,8,15,3,0,11,1,2,12,5,10,14,7,1,10,13,0,6,9,8,7,4,15,14,3,11,5,2,12],[7,13,14,3,0,6,9,10,1,2,8,5,11,12,4,15,13,8,11,5,6,15,0,3,4,7,2,12,1,10,14,9,10,6,9,0,12,11,7,13,15,1,3,14,5,2,8,4,3,15,0,6,10,1,13,8,9,4,5,11,12,7,2,14],[2,12,4,1,7,10,11,6,8,5,3,15,13,0,14,9,14,11,2,12,4,7,13,1,5,0,15,10,3,9,8,6,4,2,1,11,10,13,7,8,15,9,12,5,6,3,0,14,11,8,12,7,1,14,2,13,6,15,0,9,10,4,5,3],[12,1,10,15,9,2,6,8,0,13,3,4,14,7,5,11,10,15,4,2,7,12,9,5,6,1,13,14,0,11,3,8,9,14,15,5,2,8,12,3,7,0,4,10,1,13,11,6,4,3,2,12,9,5,15,10,11,14,1,7,6,0,8,13],[4,11,2,14,15,0,8,13,3,12,9,7,5,10,6,1,13,0,11,7,4,9,1,10,14,3,5,12,2,15,8,6,1,4,11,13,12,3,7,14,10,15,6,8,0,5,9,2,6,11,13,8,1,4,10,7,9,5,0,15,14,2,3,12],[13,2,8,4,6,15,11,1,10,9,3,14,5,0,12,7,1,15,13,8,10,3,7,4,12,5,6,11,0,14,9,2,7,11,4,1,9,12,14,2,0,6,10,13,15,3,5,8,2,1,14,7,4,10,8,13,15,12,9,0,3,5,6,11]],"p":[15,6,19,20,28,11,27,16,0,14,22,25,4,17,30,9,1,7,23,13,31,26,2,8,18,12,29,5,21,10,3,24],"fp":[39,7,47,15,55,23,63,31,38,6,46,14,54,22,62,30,37,5,45,13,53,21,61,29,36,4,44,12,52,20,60,28,35,3,43,11,51,19,59,27,34,2,42,10,50,18,58,26,33,1,41,9,49,17,57,25,32,0,40,8,48,16,56,24]};
const bitsOfHex = (h) => { const o = []; for (const c of h) { const n = parseInt(c, 16); for (let i = 3; i >= 0; i--) o.push((n >> i) & 1); } return o; };
const hexOfBits = (b) => { let s = ''; for (let i = 0; i < b.length; i += 4) s += (b[i] * 8 + b[i + 1] * 4 + b[i + 2] * 2 + b[i + 3]).toString(16).toUpperCase(); return s; };
export { bitsOfHex, hexOfBits };
const perm = (t, b) => t.map((i) => b[i]);
/** The 16 DES round keys (48-bit arrays) of a 64-bit key given as 16 hex digits. */
export function desKeys(keyHex) {
  const k = perm(DES_T.pc1, bitsOfHex(keyHex)); let C = k.slice(0, 28), D = k.slice(28); const out = [];
  for (let r = 0; r < 16; r++) { const s = DES_T.left_rotations[r]; C = C.slice(s).concat(C.slice(0, s)); D = D.slice(s).concat(D.slice(0, s)); out.push(perm(DES_T.pc2, C.concat(D))); }
  return out;
}
/**
 * DES on one block (16 hex digits). Returns {out, L[0..16], R[0..16] (32-bit arrays), K[0..15], rounds[0..15] = {E, X (E xor K), S (32 bits out of the S-boxes), P (after P)}}.
 * decrypt = true applies the round keys in reverse order. Test vector: key 133457799BBCDFF1, plaintext 0123456789ABCDEF -> 85E813540F0AB405.
 */
export function des(keyHex, blockHex, decrypt = false) {
  let K = desKeys(keyHex); if (decrypt) K = K.slice().reverse();
  const ip = perm(DES_T.ip, bitsOfHex(blockHex)); let L = ip.slice(0, 32), R = ip.slice(32);
  const Ls = [L], Rs = [R], rounds = [];
  for (let r = 0; r < 16; r++) {
    const E = perm(DES_T.expansion_table, R), X = E.map((b, i) => b ^ K[r][i]); const S = [];
    for (let j = 0; j < 8; j++) { const c = X.slice(6 * j, 6 * j + 6), row = c[0] * 2 + c[5], col = c[1] * 8 + c[2] * 4 + c[3] * 2 + c[4], v = DES_T.sbox[j][row * 16 + col]; for (let i = 3; i >= 0; i--) S.push((v >> i) & 1); }
    const P = perm(DES_T.p, S), nR = L.map((b, i) => b ^ P[i]);
    rounds.push({ E, X, S, P }); L = R; R = nR; Ls.push(L); Rs.push(R);
  }
  const out = hexOfBits(perm(DES_T.fp, R.concat(L)));
  return { out, L: Ls, R: Rs, K, rounds };
}
export const toHex32 = (b) => hexOfBits(b);

// ------------------------------------------------------------------ AES-128 (FIPS 197)
const xt = (a) => ((a << 1) ^ (a & 0x80 ? 0x1b : 0)) & 255;
export const gmul = (a, b) => { let p = 0; for (let i = 0; i < 8; i++) { if (b & 1) p ^= a; a = xt(a); b >>= 1; } return p; };
const SB = (() => {
  const s = new Uint8Array(256), inv = new Uint8Array(256); let p = 1, q = 1;
  do { p = p ^ xt(p); q ^= q << 1; q ^= q << 2; q ^= q << 4; q &= 255; if (q & 0x80) q ^= 0x09; q &= 255; // q = p^-1
       const rot = (x, n) => ((x << n) | (x >> (8 - n))) & 255; const x = q ^ rot(q, 1) ^ rot(q, 2) ^ rot(q, 3) ^ rot(q, 4) ^ 0x63; s[p] = x; } while (p !== 1);
  s[0] = 0x63; for (let i = 0; i < 256; i++) inv[s[i]] = i; return { s, inv };
})();
export const SBOX = SB.s, SBOX_INV = SB.inv;
/** 11 round keys (16 bytes each) of a 16-byte key. */
export function aesKeys(key) {
  const w = []; for (let i = 0; i < 4; i++) w.push([key[4 * i], key[4 * i + 1], key[4 * i + 2], key[4 * i + 3]]);
  let rc = 1;
  for (let i = 4; i < 44; i++) {
    let t = w[i - 1].slice();
    if (i % 4 === 0) { t = [SBOX[t[1]] ^ rc, SBOX[t[2]], SBOX[t[3]], SBOX[t[0]]]; rc = xt(rc); }
    w.push(t.map((b, j) => b ^ w[i - 4][j]));
  }
  const out = []; for (let r = 0; r < 11; r++) out.push([].concat(w[4 * r], w[4 * r + 1], w[4 * r + 2], w[4 * r + 3])); return out;
}
const subB = (s) => s.map((b) => SBOX[b]);
const shiftR = (s) => { const o = new Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) o[4 * c + r] = s[4 * ((c + r) % 4) + r]; return o; };
const mixC = (s) => { const o = new Array(16); for (let c = 0; c < 4; c++) { const a = s.slice(4 * c, 4 * c + 4); o[4 * c] = xt(a[0]) ^ xt(a[1]) ^ a[1] ^ a[2] ^ a[3]; o[4 * c + 1] = a[0] ^ xt(a[1]) ^ xt(a[2]) ^ a[2] ^ a[3]; o[4 * c + 2] = a[0] ^ a[1] ^ xt(a[2]) ^ xt(a[3]) ^ a[3]; o[4 * c + 3] = xt(a[0]) ^ a[0] ^ a[1] ^ a[2] ^ xt(a[3]); } return o; };
const addK = (s, k) => s.map((b, i) => b ^ k[i]);
/** AES-128 encryption of 16 bytes. Returns {out, trace: [{round, op, state}]} (ops: 'input','AddRoundKey','SubBytes','ShiftRows','MixColumns'). Test vector (FIPS 197 C.1): key 00..0f, plaintext 00112233..ff -> 69c4e0d86a7b0430d8cdb78070b4c55a. */
export function aes(key, pt, keys = aesKeys(key)) {
  const tr = []; let s = Array.from(pt); tr.push({ round: 0, op: 'input', state: s });
  s = addK(s, keys[0]); tr.push({ round: 0, op: 'AddRoundKey', state: s });
  for (let r = 1; r <= 10; r++) {
    s = subB(s); tr.push({ round: r, op: 'SubBytes', state: s });
    s = shiftR(s); tr.push({ round: r, op: 'ShiftRows', state: s });
    if (r < 10) { s = mixC(s); tr.push({ round: r, op: 'MixColumns', state: s }); }
    s = addK(s, keys[r]); tr.push({ round: r, op: 'AddRoundKey', state: s });
  }
  return { out: s, trace: tr };
}
export const aesEnc = (key, pt, keys) => aes(key, pt, keys).out;
export function aesDec(key, ct, keys = aesKeys(key)) {
  const ishift = (s) => { const o = new Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) o[4 * ((c + r) % 4) + r] = s[4 * c + r]; return o; };
  const imix = (s) => { const o = new Array(16); for (let c = 0; c < 4; c++) { const a = s.slice(4 * c, 4 * c + 4); for (let r = 0; r < 4; r++) o[4 * c + r] = gmul(a[r], 14) ^ gmul(a[(r + 1) % 4], 11) ^ gmul(a[(r + 2) % 4], 13) ^ gmul(a[(r + 3) % 4], 9); } return o; };
  let s = addK(Array.from(ct), keys[10]);
  for (let r = 9; r >= 0; r--) { s = ishift(s).map((b) => SBOX_INV[b]); s = addK(s, keys[r]); if (r > 0) s = imix(s); }
  return s;
}
export const bytesHex = (a) => Array.from(a, (b) => hx(b)).join('');
export const hexBytes = (h) => { const o = []; for (let i = 0; i < h.length; i += 2) o.push(parseInt(h.substr(i, 2), 16)); return o; };

// ------------------------------------------------------------------ ChaCha20 (RFC 8439) and RC4
const rotl = (x, n) => ((x << n) | (x >>> (32 - n))) >>> 0;
export function quarter(s, a, b, c, d) {
  s[a] = (s[a] + s[b]) >>> 0; s[d] = rotl(s[d] ^ s[a], 16); s[c] = (s[c] + s[d]) >>> 0; s[b] = rotl(s[b] ^ s[c], 12);
  s[a] = (s[a] + s[b]) >>> 0; s[d] = rotl(s[d] ^ s[a], 8); s[c] = (s[c] + s[d]) >>> 0; s[b] = rotl(s[b] ^ s[c], 7);
}
/** Initial ChaCha state (16 words) from 8 key words, counter, 3 nonce words. */
export const chachaInit = (key8, counter, nonce3) => Uint32Array.from([0x61707865, 0x3320646e, 0x79622d32, 0x6b206574, ...key8, counter, ...nonce3]);
/** Run the first nr rounds (column, diagonal, column …) on a copy of the state; returns the working state (before the final addition). */
export function chachaRounds(init, nr) {
  const s = Uint32Array.from(init);
  for (let r = 0; r < nr; r++) {
    if (r % 2 === 0) { quarter(s, 0, 4, 8, 12); quarter(s, 1, 5, 9, 13); quarter(s, 2, 6, 10, 14); quarter(s, 3, 7, 11, 15); }
    else { quarter(s, 0, 5, 10, 15); quarter(s, 1, 6, 11, 12); quarter(s, 2, 7, 8, 13); quarter(s, 3, 4, 9, 14); }
  }
  return s;
}
/** Keystream block (16 words) after nr rounds. RFC 8439 §2.3.2 (key 00..1f, counter 1, nonce 000000090000004a00000000): first word 0xe4e7f110. */
export function chachaBlock(init, nr = 20) { const s = chachaRounds(init, nr); for (let i = 0; i < 16; i++) s[i] = (s[i] + init[i]) >>> 0; return s; }
/** RC4 keystream (n bytes) for a key (byte array). */
export function rc4(key, n) {
  const S = new Uint8Array(256); for (let i = 0; i < 256; i++) S[i] = i;
  for (let i = 0, j = 0; i < 256; i++) { j = (j + S[i] + key[i % key.length]) & 255; const t = S[i]; S[i] = S[j]; S[j] = t; }
  const out = new Uint8Array(n); let i = 0, j = 0;
  for (let k = 0; k < n; k++) { i = (i + 1) & 255; j = (j + S[i]) & 255; const t = S[i]; S[i] = S[j]; S[j] = t; out[k] = S[(S[i] + S[j]) & 255]; }
  return out;
}

// ------------------------------------------------------------------ LFSRs and Berlekamp–Massey
/** Fibonacci LFSR with feedback taps (bit mask over the register, bit 0 = oldest): returns the first L output bits. Output = bit 0, new bit = parity(state & taps). */
export function lfsrBits(n, taps, state, L) {
  const out = new Uint8Array(L); let s = state;
  for (let i = 0; i < L; i++) { out[i] = s & 1; const f = popcnt(s & taps) & 1; s = (s >>> 1) | (f << (n - 1)); }
  return out;
}
/** Period of the LFSR started from state 1 (≤ 2^n − 1). */
export function lfsrPeriod(n, taps) {
  let s = 1, c = 0; do { const f = popcnt(s & taps) & 1; s = (s >>> 1) | (f << (n - 1)); c++; } while (s !== 1 && c < (1 << n) + 1); return s === 1 ? c : 0;
}
/** Berlekamp–Massey over GF(2): returns {Lprof: linear complexity after each prefix length 0…N, C: connection polynomial at the end (C[0]=1)} and a predictor of later bits. */
export function bm(s) {
  const n = s.length; let C = new Uint8Array(n + 1), B = new Uint8Array(n + 1); C[0] = 1; B[0] = 1;
  let L = 0, m = -1; const prof = [0];
  for (let N = 0; N < n; N++) {
    let d = s[N]; for (let i = 1; i <= L; i++) d ^= C[i] & s[N - i];
    if (d) { const T = C.slice(); for (let i = 0; i + N - m <= n; i++) C[i + N - m] ^= B[i]; if (L <= N / 2) { L = N + 1 - L; m = N; B = T; } }
    prof.push(L);
  }
  return { Lprof: prof, L, C: C.slice(0, L + 1) };
}
/** Continue a sequence with the recurrence s_t = XOR_{i=1..L} C[i] s_{t-i}. */
export function predict(s, C, L, extra) {
  const o = Array.from(s); for (let t = s.length; t < s.length + extra; t++) { let b = 0; for (let i = 1; i <= L; i++) b ^= C[i] & o[t - i]; o.push(b); } return o.slice(s.length);
}

// ------------------------------------------------------------------ 4-bit S-boxes, difference/linear tables
export const SBOXES = {
  heys: { name: 'Heys tutorial S-box', S: [0xE, 4, 0xD, 1, 2, 0xF, 0xB, 8, 3, 0xA, 6, 0xC, 5, 9, 0, 7] },
  present: { name: 'PRESENT S-box', S: [0xC, 5, 6, 0xB, 9, 0, 0xA, 0xD, 3, 0xE, 0xF, 8, 4, 7, 1, 2] },
  linear: { name: 'Affine (linear) map', S: Array.from({ length: 16 }, (_, x) => ((x << 1) | (x >> 3)) & 15 ^ 6) },
};
export const invS = (S) => { const o = new Array(16); S.forEach((y, x) => { o[y] = x; }); return o; };
/** Difference distribution table: DDT[a][b] = #{x : S(x) ^ S(x^a) = b}. */
export const ddt = (S) => { const T = Array.from({ length: 16 }, () => new Array(16).fill(0)); for (let a = 0; a < 16; a++) for (let x = 0; x < 16; x++) T[a][S[x] ^ S[x ^ a]]++; return T; };
/** Linear approximation table (counts − 8): LAT[a][b] = #{x : a·x = b·S(x)} − 8. */
export const lat = (S) => { const T = Array.from({ length: 16 }, () => new Array(16).fill(0)); for (let a = 0; a < 16; a++) for (let b = 0; b < 16; b++) { let c = 0; for (let x = 0; x < 16; x++) if ((popcnt(a & x) ^ popcnt(b & S[x])) & 1) c++; T[a][b] = 8 - c; } return T; };
