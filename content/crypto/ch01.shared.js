// Cryptography — Chapter 1 shared helpers (classical ciphers and their cryptanalysis).
// Plain named exports, imported by ch01.js and ch01-b.js. No imports of its own.

export const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const mod = (a, n) => ((a % n) + n) % n;
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

// ------------------------------------------------------------------ English letter statistics (embedded data)
/**
 * Letter counts a…z in the English Google Books corpus (version 20120701, words with at least 100,000
 * mentions, 26 letters A–Z only): 3,563,505,777,820 letters in all.
 * Source: Peter Norvig, “English Letter Frequency Counts: Mayzner Revisited, or ETAOIN SRHLDCU” (2012),
 * https://norvig.com/mayzner.html — letter table and the 676-cell bigram table, copied from the page.
 */
export const EN_COUNTS = [286527429118,52905544693,119155568598,136017528785,445155370175,85635440629,66615316232,180074687596,269731642485,5657910830,19261229433,144998552911,89506734085,257770795264,272276534337,76112599849,4292916949,223767519675,232082812755,330535289102,97273082907,37532682260,59712390260,8369138754,59331661972,3205398166];
export const EN_N = EN_COUNTS.reduce((a, b) => a + b, 0); // 3 563 505 777 820
export const EN_P = EN_COUNTS.map((c) => c / EN_N);
export const EN_SOURCE = 'Norvig 2012, Google Books Ngrams (3.56 trillion letters)';
/** Letters by decreasing English frequency: ETAOINSRHLDCUMFPGWYBVKXJQZ. */
export const EN_ORDER = [...A].map((c, i) => [c, EN_P[i]]).sort((a, b) => b[1] - a[1]).map((x) => x[0]).join('');
/** Bigram counts in millions (same source, letter pairs inside words): BI[first][second]; TH = 100 273 (=100.3 billion). */
const BI_RAW = '80,6479,12626,10375,350,2092,5773,385,8923,331,2952,30662,8032,55975,130,5720,63,30309,24562,41921,3356,5778,1689,531,6129,335 4122,308,53,70,16249,4,7,30,3006,655,3,6581,88,59,5510,15,0,3146,1292,482,5215,108,8,1,4976,1 15174,18,2344,63,18368,40,25,16855,7937,3,3317,4202,75,24,22384,37,154,4214,644,12998,4585,6,4,1,1176,21 4260,78,71,1205,21565,78,874,153,13900,135,9,912,513,213,5308,49,20,2409,3560,82,4186,537,230,1,1422,2 19404,763,13458,32937,10647,4588,3371,742,5170,128,464,14953,10536,41005,2044,4838,1614,57754,37766,11634,878,7184,3294,6035,4053,128 4624,8,16,14,6671,4126,14,5,8024,2,3,1830,19,12,13753,6,0,6011,155,2303,2706,1,6,1,257,0 4175,14,6,89,10861,34,698,6415,4276,1,7,1710,278,1851,3726,12,0,5548,1443,434,2418,1,18,1,731,3 26103,124,35,81,86697,63,8,15,21521,1,7,355,359,726,13673,17,12,2380,414,3671,2078,6,135,0,1412,11 8072,2780,19701,8332,10846,5731,7189,59,642,31,1210,12168,8960,68595,23542,2515,319,8887,31818,31673,491,8116,18,621,6,1814 729,2,3,3,1463,2,1,4,78,3,2,3,4,4,1517,6,0,7,3,3,1655,2,1,0,1,0 478,25,6,19,6028,45,72,90,2760,3,13,298,50,1450,171,20,0,77,1340,29,85,4,61,1,168,0 14875,189,333,7123,23382,1508,172,46,17605,3,556,16257,649,166,10909,537,4,283,3990,3486,3812,984,356,9,11984,12 15939,2545,122,19,22360,108,35,15,8958,3,4,130,2709,248,9499,6744,1,88,2618,39,3232,8,16,1,1753,1 9791,122,11723,38130,19504,1894,26872,307,9565,313,1455,1798,782,2052,13099,170,168,258,14350,29360,2218,1466,163,74,2761,123 1621,2726,4692,5511,1089,33130,2651,602,2474,197,1813,10306,15403,49571,5929,6314,29,35994,8176,12466,24531,5021,9318,524,1020,98 9124,37,33,34,13478,41,13,2661,3471,3,23,7415,450,34,10190,3850,1,13378,1539,2983,2948,6,34,1,332,6 4,1,1,1,1,1,0,0,9,0,0,7,1,2,1,0,2,2,4,1,4160,1,0,0,0,0 19333,753,3423,5338,52286,910,2813,426,20516,16,2736,2432,4938,4522,20491,1174,28,3405,11181,10198,3618,1954,360,33,6985,18 6147,223,4363,148,26282,484,70,8889,15510,8,1113,1576,1838,259,11215,5393,210,169,11422,29704,8774,35,663,1,1603,7 14941,72,737,37,33973,160,56,100273,37856,3,13,2776,747,282,29360,121,3,12007,9516,4813,7188,33,2323,3,6408,109 3844,2498,5291,2577,4158,523,3607,30,2852,15,130,9751,3902,11121,300,3835,7,15304,12809,11424,22,82,8,111,129,54 3947,2,7,8,23270,2,3,3,7600,1,0,12,3,4,2005,6,0,25,16,6,62,3,1,0,138,1 10865,30,19,100,10176,45,3,10681,10557,1,30,429,31,2227,6253,21,0,867,989,184,20,0,7,0,68,0 835,2,746,0,615,52,1,118,1111,1,0,17,7,2,76,1885,8,1,2,1316,135,55,6,79,73,0 445,121,381,192,2613,21,73,15,813,1,9,416,668,373,4227,702,0,220,2730,470,37,5,95,4,2,51 702,6,2,1,1402,1,5,19,342,0,1,35,5,4,202,1,1,5,8,7,61,5,6,0,66,75';
export const BI = BI_RAW.split(' ').map((r) => r.split(',').map(Number));
const biRow = BI.map((row) => row.reduce((a, b) => a + (b || 0.5), 0));
/** log2 P(second | first) under that bigram table (zero cells smoothed to half a million). */
export const LOGB = BI.map((row, a) => row.map((x) => Math.log2((x || 0.5) / biRow[a])));
export const LOGP = EN_P.map((p) => Math.log2(p));
/** Top bigrams by count: [['TH', count], …]. */
export const TOP_BIGRAMS = (() => { const o = []; for (let a = 0; a < 26; a++) for (let b = 0; b < 26; b++) o.push([A[a] + A[b], BI[a][b]]); return o.sort((x, y) => y[1] - x[1]); })();
/** Entropy of the unigram model, and of the bigram (first-order Markov) model, in bits per letter. */
export const H1 = -EN_P.reduce((s, p) => s + p * Math.log2(p), 0);
export const H2 = (() => { let h = 0; for (let a = 0; a < 26; a++) for (let b = 0; b < 26; b++) h -= EN_P[a] * (BI[a][b] / biRow[a]) * LOGB[a][b]; return h; })();
export const SUM_P2 = EN_P.reduce((s, p) => s + p * p, 0); // index of coincidence of this English model
export const FRIEDMAN_EN = 0.0667; // Friedman 1922, as usually quoted

/** The Bliss copy of the Gettysburg Address (Lincoln, 1864; public domain), text as on Wikisource (Page:Blisscopy-1…3.jpg). */
export const GETTYSBURG = 'Four score and seven years ago our fathers brought forth, on this continent, a new nation, conceived in Liberty, and dedicated to the proposition that all men are created equal. Now we are engaged in a great civil war, testing whether that nation, or any nation so conceived and so dedicated, can long endure. We are met on a great battle-field of that war. We have come to dedicate a portion of that field, as a final resting place for those who here gave their lives that that nation might live. It is altogether fitting and proper that we should do this. But, in a larger sense, we can not dedicate—we can not consecrate—we can not hallow—this ground. The brave men, living and dead, who struggled here, have consecrated it, far above our poor power to add or detract. The world will little note, nor long remember what we say here, but it can never forget what they did here. It is for us the living, rather, to be dedicated here to the unfinished work which they who fought here have thus far so nobly advanced. It is rather for us to be here dedicated to the great task remaining before us—that from these honored dead we take increased devotion to that cause for which they gave the last full measure of devotion—that we here highly resolve that these dead shall not have died in vain—that this nation, under God, shall have a new birth of freedom—and that government of the people, by the people, for the people, shall not perish from the earth.';

// ------------------------------------------------------------------ letters, ciphers
export const norm = (s) => String(s).toUpperCase().replace(/[^A-Z]/g, '');
export const code = (ch) => ch.charCodeAt(0) - 65;
/** Map every A–Z letter (either case) by f(code, letterIndex); other characters are kept. Letters come out upper-case. */
export function mapL(s, f) {
  let j = 0, out = '';
  for (const ch of String(s)) {
    const u = ch.toUpperCase();
    if (ch.length === 1 && u >= 'A' && u <= 'Z') out += A[f(u.charCodeAt(0) - 65, j++)]; else out += ch;
  }
  return out;
}
export const shiftC = (s, k) => mapL(s, (x) => mod(x + k, 26));
export const VALID_A = [1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25];
export const invMod26 = (a) => { for (let x = 1; x < 26; x++) if ((a * x) % 26 === 1) return x; return 0; };
export const affineC = (s, a, b) => mapL(s, (x) => mod(a * x + b, 26));
export const affineD = (s, a, b) => { const ai = invMod26(a); return mapL(s, (y) => mod(ai * (y - b), 26)); };
/** key: 26-letter string, key[i] = ciphertext letter for plaintext letter i. */
export const subC = (s, key) => mapL(s, (x) => key.charCodeAt(x) - 65);
export function subInv(key) { const o = Array(26); for (let i = 0; i < 26; i++) o[key.charCodeAt(i) - 65] = A[i]; return o.join(''); }
export const isPerm = (k) => k.length === 26 && [...A].every((c) => k.includes(c));
export function vigC(s, key, dec = false) {
  const k = norm(key); if (!k) return s;
  return mapL(s, (x, j) => mod(x + (dec ? -1 : 1) * (k.charCodeAt(j % k.length) - 65), 26));
}
/** Fisher–Yates with a seeded generator r() ∈ [0,1). */
export function shuffled(arr, r) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
export const randomPerm = (r) => shuffled([...A], r).join('');
export const randomKey = (r, n) => Array.from({ length: n }, () => A[Math.floor(r() * 26)]).join('');
/** 26! as a BigInt, and a short description. */
export const FACT26 = (() => { let f = 1n; for (let i = 2n; i <= 26n; i++) f *= i; return f; })(); // 403291461126605635584000000
export const LOG2_FACT26 = (() => { let s = 0; for (let i = 2; i <= 26; i++) s += Math.log2(i); return s; })(); // 88.38 bits

// ------------------------------------------------------------------ statistics
export const counts = (s) => { const c = new Array(26).fill(0); for (const ch of norm(s)) c[code(ch)]++; return c; };
export const total = (c) => c.reduce((a, b) => a + b, 0);
/** Index of coincidence Σ n_i(n_i−1) / (N(N−1)). */
export function icOf(c) { const n = total(c); if (n < 2) return 0; let s = 0; for (const x of c) s += x * (x - 1); return s / (n * (n - 1)); }
export const icText = (s) => icOf(counts(s));
/** Cross-entropy in bits per letter of a text against the English letter model (lower = more English-like). */
export function crossEnt(s) { const L = norm(s); if (!L.length) return 0; let t = 0; for (const ch of L) t -= LOGP[code(ch)]; return t / L.length; }
/** Same, with the bigram model (first letter from the unigram model). */
export function crossEnt2(s) { const L = norm(s); if (!L.length) return 0; let t = -LOGP[code(L[0])]; for (let i = 1; i < L.length; i++) t -= LOGB[code(L[i - 1])][code(L[i])]; return t / L.length; }
/** Shift s ∈ 0…25 maximizing Σ_i p_i · f_{i+s} (the “mutual index of coincidence” of a column with English). */
export function bestShift(cnt) {
  const n = total(cnt) || 1; let best = 0, bv = -1; const all = [];
  for (let s = 0; s < 26; s++) { let v = 0; for (let i = 0; i < 26; i++) v += EN_P[i] * cnt[(i + s) % 26] / n; all.push(v); if (v > bv) { bv = v; best = s; } }
  return { s: best, score: bv, all };
}
export function columnsOf(L, k) { const cols = Array.from({ length: k }, () => ''); for (let i = 0; i < L.length; i++) cols[i % k] += L[i]; return cols; }
/** Mean index of coincidence of the columns for each trial period 1…maxK. */
export function icByPeriod(L, maxK) {
  const out = [];
  for (let k = 1; k <= maxK; k++) { const cols = columnsOf(L, k).filter((c) => c.length > 1); out.push(cols.length ? cols.reduce((s, c) => s + icText(c), 0) / cols.length : 0); }
  return out;
}
/** Smallest period whose mean column IC is within 10% of the best one. */
export function pickPeriod(ics) { const mx = Math.max(...ics); for (let k = 1; k <= ics.length; k++) if (ics[k - 1] >= 0.9 * mx) return k; return 1; }
export function recoverKey(L, k) { return columnsOf(L, k).map((c) => bestShift(counts(c)).s); }
/**
 * Kasiski examination: maximal repeated strings of length ≥ minLen, distances between consecutive occurrences, and
 * for each f = 2…maxF how many distances f divides.
 */
export function kasiski(L, minLen = 3, maxF = 30) {
  const pos = new Map();
  for (let i = 0; i + minLen <= L.length; i++) { const g = L.substr(i, minLen); (pos.get(g) || pos.set(g, []).get(g)).push(i); }
  const reps = [];
  for (const [g, ps] of pos) {
    for (let t = 0; t + 1 < ps.length; t++) {
      const p = ps[t], q = ps[t + 1];
      if (p > 0 && L[p - 1] === L[q - 1]) continue; // not left-maximal: part of a longer repeat
      let len = minLen; while (q + len < L.length && L[p + len] === L[q + len] && p + len < q) len++;
      reps.push({ seq: L.substr(p, len), p, q, dist: q - p, len });
    }
  }
  reps.sort((a, b) => b.len - a.len || a.p - b.p);
  const fac = Array(maxF + 1).fill(0);
  for (const r of reps) for (let f = 2; f <= maxF; f++) if (r.dist % f === 0) fac[f]++;
  return { reps, fac };
}
/** Kasiski's estimate of the period: the largest f whose count is at least 60% of the largest count (multiples of the true period never beat it). */
export function kasiskiPeriod(fac) {
  const mx = Math.max(...fac.slice(2)); if (mx < 3) return 0;
  let best = 0; for (let f = 2; f < fac.length; f++) if (fac[f] >= 0.6 * mx && fac[f] >= 0.6 * (fac[best] || 0)) best = f;
  return best;
}

// ------------------------------------------------------------------ simulated annealing / hill climbing for substitution ciphers
/** Hill-climb a substitution key (plain→cipher decrypt map: dec[c] = plain code) maximizing the bigram log-likelihood of the decryption. */
export function climbSubstitution(cipher, r, { restarts = 6, iters = 3500, start = null } = {}) {
  const c = [...norm(cipher)].map(code), n = c.length;
  const score = (dec) => { let t = LOGP[dec[c[0]]]; for (let i = 1; i < n; i++) t += LOGB[dec[c[i - 1]]][dec[c[i]]]; return t; };
  // start from frequency-rank matching
  const cnt = Array(26).fill(0); c.forEach((x) => cnt[x]++);
  const byFreq = [...Array(26).keys()].sort((a, b) => cnt[b] - cnt[a]);
  let best = null, bs = -Infinity;
  for (let rs = 0; rs < restarts; rs++) {
    let dec = Array(26); if (start && rs === 0) dec = start.slice(); else byFreq.forEach((cl, i) => { dec[cl] = code(EN_ORDER[i]); });
    if (rs > 1) { for (let t = 0; t < 12 * rs; t++) { const i = Math.floor(r() * 26), j = Math.floor(r() * 26); [dec[i], dec[j]] = [dec[j], dec[i]]; } }
    let s = score(dec);
    for (let it = 0; it < iters; it++) {
      const i = Math.floor(r() * 26), j = Math.floor(r() * 26); if (i === j) continue;
      [dec[i], dec[j]] = [dec[j], dec[i]];
      const s2 = score(dec);
      if (s2 >= s) s = s2; else [dec[i], dec[j]] = [dec[j], dec[i]];
    }
    if (s > bs) { bs = s; best = dec.slice(); }
  }
  return { dec: best, score: bs / Math.max(1, n) };
}

// ------------------------------------------------------------------ Enigma
/** Rotor wirings (A→…) and turnover letters, Enigma I (Army/Air Force), as listed on Wikipedia “Enigma rotor details” and Crypto Museum. */
export const ROTORS = {
  I: ['EKMFLGDQVZNTOWYHXUSPAIBRCJ', 'Q'], II: ['AJDKSIRUXBLHWTMCQGZNPYFVOE', 'E'], III: ['BDFHJLCPRTXVZNYEIWGAKMUSQO', 'V'],
  IV: ['ESOVPZJAYQUIRHXLNFTGKDCMWB', 'J'], V: ['VZBRGITYUPSDNHLXAWMJQOFECK', 'Z'],
};
export const REFLECTORS = { A: 'EJMZALYXVBWFCRQUONTSPIKHGD', B: 'YRUHQSLDPXNGOKMIEBFZCWVJAT', C: 'FVPJIAOYEDRZXWGCTKUQSBNMHL' };
/** Parse plugboard text such as “AM FI NV”; returns {map, pairs, error}. */
export function parsePlug(str) {
  const map = [...Array(26).keys()], pairs = []; let error = null;
  const toks = String(str).toUpperCase().split(/[^A-Z]+/).filter(Boolean);
  const used = new Set();
  for (const t of toks) {
    if (t.length !== 2) { error = `“${t}” is not a pair of letters`; continue; }
    const [a, b] = [code(t[0]), code(t[1])];
    if (a === b) { error = `${t} joins a letter to itself`; continue; }
    if (used.has(a) || used.has(b)) { error = `a letter occurs in two pairs (${t})`; continue; }
    used.add(a); used.add(b); map[a] = b; map[b] = a; pairs.push(t);
  }
  if (pairs.length > 13) error = 'at most 13 pairs';
  return { map, pairs, error };
}
/**
 * Enigma I simulator. cfg: {rotors: [left, middle, right] names, refl: 'A'|'B'|'C', rings: [0..25]×3 (Ringstellung, A = 0),
 * pos: [0..25]×3 (letters in the windows), plug: 'AM FI …'}.
 * press(x) steps the rotors (with the double-step anomaly) and sends the letter x through; it returns the
 * output letter and the 10 contact indices of the signal path.
 */
export function makeEnigma(cfg) {
  const rot = cfg.rotors.map((n) => ROTORS[n]);
  const fw = rot.map(([w]) => [...w].map(code));
  const bw = fw.map((f) => { const b = Array(26); f.forEach((y, x) => { b[y] = x; }); return b; });
  const notch = rot.map(([, n]) => code(n));
  const refl = [...REFLECTORS[cfg.refl]].map(code);
  const rings = cfg.rings.slice(), plug = parsePlug(cfg.plug || '').map;
  const E = {
    pos: cfg.pos.slice(),
    reset() { E.pos = cfg.pos.slice(); },
    step() {
      const p = E.pos;
      const midAt = p[1] === notch[1], rightAt = p[2] === notch[2];
      if (midAt) { p[0] = (p[0] + 1) % 26; p[1] = (p[1] + 1) % 26; } else if (rightAt) p[1] = (p[1] + 1) % 26;
      p[2] = (p[2] + 1) % 26;
    },
    /** Signal through the rotor stack at the current positions (no stepping). */
    path(x) {
      const off = E.pos.map((q, i) => q - rings[i]);
      const f = (i, v) => mod(fw[i][mod(v + off[i], 26)] - off[i], 26);
      const b = (i, v) => mod(bw[i][mod(v + off[i], 26)] - off[i], 26);
      const p1 = plug[x], r2 = f(2, p1), r1 = f(1, r2), r0 = f(0, r1), u = refl[r0];
      const l0 = b(0, u), l1 = b(1, l0), l2 = b(2, l1), out = plug[l2];
      return [x, p1, r2, r1, r0, u, l0, l1, l2, out];
    },
    press(x) { E.step(); const tr = E.path(x); return { out: tr[9], trace: tr, pos: E.pos.slice() }; },
    /** Encipher letters (others pass through unchanged and do not step). */
    run(text) { let o = ''; for (const ch of String(text).toUpperCase()) o += ch >= 'A' && ch <= 'Z' && ch.length === 1 ? A[E.press(code(ch)).out] : ch; return o; },
  };
  return E;
}
export const posName = (p) => p.map((x) => A[x]).join('');

// ------------------------------------------------------------------ formatting
const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '-': '⁻' };
export const supInt = (n) => String(n).split('').map((c) => SUP[c] ?? c).join('');
/** 1.2×10⁹-style plain text. */
export function sciText(x, d = 2) {
  if (!isFinite(x)) return '∞'; if (x === 0) return '0';
  const e = Math.floor(Math.log10(Math.abs(x))); if (e > -3 && e < 6) return String(+x.toPrecision(d + 1)).replace('-', '−');
  const m = x / 10 ** e; return `${m.toFixed(d - 1)}×10${supInt(e)}`;
}
/** Time in seconds → “3.2 hours”, “4.0×10¹⁷ years”. */
export function dur(sec) {
  if (!isFinite(sec)) return 'forever';
  const u = [[1e-6, 'µs', 1e-6], [1e-3, 'ms', 1e-3], [60, 's', 1], [3600, 'min', 60], [86400, 'hours', 3600], [31557600, 'days', 86400], [Infinity, 'years', 31557600]];
  if (sec < 1e-6) return '< 1 µs';
  for (const [lim, name, unit] of u) if (sec < lim) { const v = sec / unit; return `${v >= 100 ? sciText(v, 2) : +v.toPrecision(2)} ${name}`; }
  return '';
}
export const AGE_UNIVERSE_S = 13.787e9 * 31557600; // Planck 2018: 13.787 ± 0.020 Gyr

// ------------------------------------------------------------------ pixel-space drawing on a stage declared x:[0,1], y:[0,1], axes:false
/** Draw in CSS pixels, origin top-left, y downward. */
export function pix(s) {
  const W = s.width, H = s.height;
  const px = (x) => s.invX(x), py = (y) => s.invY(y);
  return {
    W, H,
    text: (str, x, y, st) => s.textPx(String(str), x, y, st),
    rect: (x, y, w, h, st) => s.rect(px(x), py(y + h), px(x + w), py(y), st),
    line: (x1, y1, x2, y2, st) => s.line(px(x1), py(y1), px(x2), py(y2), st),
    path: (pts, st) => s.path(pts.map(([x, y]) => (x == null ? null : [px(x), py(y)])), st),
    dot: (x, y, st) => s.dot(px(x), py(y), st),
    arrow: (x1, y1, x2, y2, st) => s.arrow(px(x1), py(y1), px(x2), py(y2), st),
    /** data → pixel for a click */
    at: (x, y) => [s.X(x), s.Y(y)],
  };
}
/** A row of letters, one per cell (fixed advance cw), starting at (x, y) = left, vertical middle. colorOf(i) → palette name. */
export function letterRow(P, str, x, y, cw, colorOf, st = {}) {
  for (let i = 0; i < str.length; i++) P.text(str[i], x + (i + 0.5) * cw, y, { size: st.size || 13, weight: st.weight || 600, align: 'center', color: colorOf ? colorOf(i) : 'ink', halo: false });
}
/** Wrap a letter string into rows of n. */
export const rowsOf = (str, n) => { const o = []; for (let i = 0; i < str.length; i += n) o.push(str.slice(i, i + n)); return o; };
export const groups5 = (s) => s.replace(/(.{5})/g, '$1 ').trim();

// ------------------------------------------------------------------ key equivocation (unicity distance, item 1.10)
/**
 * For the Vigenère family with key length L (26^L keys, all enumerated), the posterior over keys given the first n ciphertext letters,
 * under the bigram model of English, for n = 0…N: entropy of that posterior (the key equivocation H(K | c₁…cₙ), in bits) and the
 * top-scoring keys at the end. Returns {H: Float64Array(N+1), keys(n) → [{key, score}] top 6}.
 */
export function equivocation(cipherCodes, L, N) {
  const K = 26 ** L, c = cipherCodes, scores = new Float64Array(K), digits = [];
  for (let i = 0, d = 1; i < L; i++, d *= 26) { const a = new Uint8Array(K); for (let k = 0; k < K; k++) a[k] = Math.floor(k / d) % 26; digits.push(a); }
  const H = new Float64Array(N + 1); H[0] = L * Math.log2(26);
  const entropy = () => {
    let m = -Infinity; for (let k = 0; k < K; k++) if (scores[k] > m) m = scores[k];
    let Z = 0, W = 0; for (let k = 0; k < K; k++) { const d = scores[k] - m; if (d < -48) continue; const w = Math.pow(2, d); Z += w; W += w * d; }
    return Math.log2(Z) - W / Z;
  };
  const snaps = []; // the score vector after n letters is only kept for requested n
  for (let j = 0; j < N; j++) {
    const dj = digits[j % L], dp = digits[(j + L - 1) % L];
    for (let k = 0; k < K; k++) {
      const p = mod(c[j] - dj[k], 26);
      scores[k] += j === 0 ? LOGP[p] : LOGB[mod(c[j - 1] - dp[k], 26)][p];
    }
    H[j + 1] = entropy();
  }
  return { H, scoresAt: null, final: scores, K, digits };
}
/** Top keys (as letter strings) by score from an equivocation() result computed for exactly n letters. */
export function topKeys(res, L, count = 6) {
  const idx = [...Array(res.K).keys()]; idx.sort((a, b) => res.final[b] - res.final[a]);
  return idx.slice(0, count).map((k) => ({ key: Array.from({ length: L }, (_, i) => A[res.digits[i][k]]).join(''), score: res.final[k] }));
}
