// Audited finite teaching computations. These are not cryptographic implementations.
import { mix2, feistel8, feistel8inv, invS, popcnt } from './ch04.shared.js';
export const hybridBias = (profile, d, j, l) => profile === 'all' ? d : profile === 'one' ? (j === Math.floor(l / 2) ? d : 0) : d * (j + 1) / l;
export function bernoulliTail(ps, T) {
  let a = [1];
  for (const p of ps) { if (!(p >= 0 && p <= 1)) throw Error('Invalid probability'); const b = new Array(a.length + 1).fill(0); a.forEach((q, i) => { b[i] += q * (1 - p); b[i + 1] += q * p; }); a = b; }
  return a.reduce((s, q, i) => s + (i >= T ? q : 0), 0);
}
export function hybridProbabilities(l, d, profile, T) { return Array.from({ length: l + 1 }, (_, i) => bernoulliTail(Array.from({ length: l }, (_, j) => j < i ? 0.5 : 0.5 + hybridBias(profile, d, j, l)), T)); }
export function collisionProbability(N, q) { if (q <= 1) return 0; if (q > N) return 1; let s = 0; for (let j = 1; j < q; j++) s += Math.log1p(-j / N); return -Math.expm1(s); }
export function coupledAnswers(N, q, random) {
  if (q > N) throw Error('Distinct queries exceed domain');
  const fOut = [], pOut = [], usedP = new Set(), seenF = new Set(); let firstColl = -1;
  for (let i = 0; i < q; i++) { const y = Math.floor(random() * N); fOut.push(y); if (seenF.has(y) && firstColl < 0) firstColl = i; seenF.add(y); let z = y; while (usedP.has(z)) z = Math.floor(random() * N); usedP.add(z); pOut.push(z); }
  return { fOut, pOut, firstColl };
}
export const gcdAudit = (a, b) => { while (b) [a, b] = [b, a % b]; return a; };
export function modPowAudit(b, e, m) { let r = 1; while (e > 0) { if (e % 2) r = r * b % m; b = b * b % m; e = Math.floor(e / 2); } return r; }
export function gmClasses(p, q) {
  const N = p * q, cls = new Uint8Array(N), sq = new Uint8Array(N), counts = [0, 0, 0, 0];
  for (let x = 0; x < N; x++) { let c = 0; if (x % p && x % q) { const a = modPowAudit(x % p, (p - 1) / 2, p) === 1, b = modPowAudit(x % q, (q - 1) / 2, q) === 1; c = a && b ? 1 : !a && !b ? 2 : 3; } cls[x] = c; if (c === 1) sq[x] = 1; counts[c]++; }
  return { N, p, q, cls, sq, counts, qrP: (x) => modPowAudit(x % p, (p - 1) / 2, p) === 1 };
}
export function gmEncrypt(K, b, random) { let r; do { r = Math.floor(random() * K.N); } while (!r || gcdAudit(r, K.N) !== 1); return (r * r % K.N) * (b ? K.y : 1) % K.N; }
export const gmTests = (K) => [(c) => c < K.N / 2 ? 0 : 1, (c) => c % 2 ? 1 : 0, (c) => c % 3 ? 1 : 0, () => 0, (c) => K.sq[c] ? 0 : 1, (c) => K.qrP(c) ? 0 : 1];
export function gmExactAdvantages(K) { return gmTests(K).map((f) => { let wins = 0; for (let c = 0; c < K.N; c++) if ((K.cls[c] === 1 && f(c) === 0) || (K.cls[c] === 2 && f(c) === 1)) wins++; return Math.abs(wins / (K.counts[1] + K.counts[2]) - 0.5); }); }
export function residueWindow(N, page, W, H) { const size = 1024, pages = Math.ceil(N / size), index = Math.max(0, Math.min(pages - 1, page)), start = index * size, count = Math.min(size, N - start), cols = Math.ceil(Math.sqrt(count)), rows = Math.ceil(count / cols), cs = Math.min((W - 24) / cols, (H - 90) / rows); return { pages, index, start, count, cols, rows, cs, x0: (W - cols * cs) / 2, y0: 32 }; }
export const spnPermutation = (j) => 4 * (j % 4) + Math.floor(j / 4);
export function spnRun(S, x, ks, R) { const st = [x]; for (let r = 0; r < R; r++) { x ^= ks[r]; let y = 0; for (let i = 0; i < 4; i++) y |= S[(x >> (4 * i)) & 15] << (4 * i); if (r < R - 1) { let z = 0; for (let j = 0; j < 16; j++) z |= ((y >> j) & 1) << spnPermutation(j); y = z; } x = y; st.push(x); } st.push(x ^ ks[R]); return st; }
export function attackPopulation(S, keys, a, b, differential) { const Si = invS(S), enc = (p) => S[S[p ^ keys[0]] ^ keys[1]] ^ keys[2], counts = new Array(16).fill(0); for (let p = 0; p < 16; p++) for (let g = 0; g < 16; g++) { const u = Si[enc(p) ^ g]; if (differential ? (u ^ Si[enc(p ^ a) ^ g]) === b : ((popcnt(b & u) ^ popcnt(a & p)) & 1) === 0) counts[g]++; } return counts.map((n) => differential ? n / 16 : Math.abs(n / 16 - 0.5)); }
export function toyModeTamper(m, k, iv, cbc, j, bit) { const F = (n) => mix2(k, 5000 + (n & 255)) & 255, c = [iv]; for (let i = 0; i < m.length; i++) c.push(cbc ? feistel8(k, m[i] ^ c[i]) : m[i] ^ F(iv + i + 1)); const c2 = c.slice(); c2[j] ^= 1 << bit; const m2 = []; for (let i = 1; i <= m.length; i++) m2.push(cbc ? feistel8inv(k, c2[i]) ^ c2[i - 1] : c2[i] ^ F(c2[0] + i)); return { c, c2, m2 }; }
