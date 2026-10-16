// Music Theory & Acoustics — Chapter 8 shared helpers (pitch classes, scales, set classes).
// Plain named exports, imported by ch08.js, ch08-b.js and ch08-c.js. Everything of chapter 7 (and, through it, chapters 4–6) is re-exported.

export * from './ch07.shared.js';
import { circ, seqCents, chordCents, C4, SR, NOTE, mixBuf, TIM } from './ch07.shared.js';

// ---------------------------------------------------------------- arithmetic mod 12 and pitch-class sets

export const mod = (n, m = 12) => ((n % m) + m) % m;
/** Sorted, duplicate-free pitch-class set. */
export const norm = (S) => [...new Set(S.map((x) => mod(x)))].sort((a, b) => a - b);
export const Tn = (S, n) => norm(S.map((x) => x + n));
/** Inversion about n: x -> n - x. */
export const In = (S, n) => norm(S.map((x) => n - x));
export const maskOf = (S) => S.reduce((m, x) => m | (1 << mod(x)), 0);
export const fromMask = (m) => { const S = []; for (let i = 0; i < 12; i++) if (m & (1 << i)) S.push(i); return S; };
export const popc = (m) => { let c = 0; while (m) { c += m & 1; m >>= 1; } return c; };
export const rotMask = (m, n) => { n = mod(n); return ((m << n) | (m >> (12 - n))) & 4095; };
export const invMask = (m, n) => { let r = 0; for (let i = 0; i < 12; i++) if (m & (1 << i)) r |= 1 << mod(n - i); return r; };
export const complement = (S) => { const s = new Set(S); return Array.from({ length: 12 }, (_, i) => i).filter((i) => !s.has(i)); };
export const key = (S) => S.join(',');
export const setStr = (S) => (S.length ? S.join(',') : '∅');
/** Same with the conventional T = 10, E = 11 (used for rows). */
export const teStr = (S, sep = ' ') => S.map((x) => (x === 10 ? 'T' : x === 11 ? 'E' : x)).join(sep);
export const braceStr = (S) => `{${setStr(S)}}`;
export const ic = (d) => { d = mod(d); return Math.min(d, 12 - d); };

/** Interval-class vector (counts of interval classes 1..6). */
export function icv(S) {
  const v = [0, 0, 0, 0, 0, 0];
  for (let i = 0; i < S.length; i++) for (let j = i + 1; j < S.length; j++) v[ic(S[j] - S[i]) - 1]++;
  return v;
}
export const vecStr = (v) => `⟨${v.join(',')}⟩`;

/** Normal order: the rotation of the set that fits in the smallest span, ties broken by packing the small intervals to the left. */
export function normalOrder(S) {
  S = norm(S);
  if (S.length <= 1) return S;
  let best = null;
  for (let r = 0; r < S.length; r++) {
    const rot = S.slice(r).concat(S.slice(0, r).map((x) => x + 12));
    const z = rot.map((x) => x - rot[0]);
    if (!best || z[z.length - 1] < best.z[best.z.length - 1] || (z[z.length - 1] === best.z[best.z.length - 1] && lexLess(z, best.z))) best = { rot, z };
  }
  return best.rot.map((x) => mod(x));
}
function lexLess(a, b) { for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] < b[i]; return false; }
/** Prime form (T/I class representative): the more packed of the normal orders of S and of its inversion, moved to start at 0. */
export function primeForm(S) {
  S = norm(S);
  if (S.length <= 1) return S.length ? [0] : [];
  const z = (T) => { const n = normalOrder(T); return n.map((x) => mod(x - n[0])); };
  const a = z(S), b = z(In(S, 0));
  const sa = a[a.length - 1], sb = b[b.length - 1];
  return sa < sb || (sa === sb && !lexLess(b, a)) ? a : b;
}
/** Prime form for transposition only (T-class). */
export function primeT(S) { S = norm(S); if (!S.length) return []; const n = normalOrder(S); return n.map((x) => mod(x - n[0])); }
/** Which operation takes S to its prime form: {inv, n} meaning T_n S or T_n I S. */
export function toPrime(S) {
  const P = key(primeForm(S));
  for (let n = 0; n < 12; n++) { if (key(Tn(S, n)) === P) return { inv: false, n }; if (key(In(S, n)) === P) return { inv: true, n }; }
  return { inv: false, n: 0 };
}
/** All distinct images of S under the 12 transpositions (and, if `inv`, 12 inversions). */
export function orbit(S, inv = true) {
  const seen = new Map();
  for (let n = 0; n < 12; n++) { const t = Tn(S, n); seen.set(key(t), t); }
  if (inv) for (let n = 0; n < 12; n++) { const t = In(S, n); seen.set(key(t), t); }
  return [...seen.values()];
}

/** Forte names of the three- and four-note set classes and a few famous larger ones, keyed by prime form (checked against the Wikipedia list of set classes). */
const FORTE_RAW = {
  '0,1,2': '3-1', '0,1,3': '3-2', '0,1,4': '3-3', '0,1,5': '3-4', '0,1,6': '3-5', '0,2,4': '3-6', '0,2,5': '3-7', '0,2,6': '3-8', '0,2,7': '3-9', '0,3,6': '3-10', '0,3,7': '3-11', '0,4,8': '3-12',
  '0,1,2,3': '4-1', '0,1,2,4': '4-2', '0,1,3,4': '4-3', '0,1,2,5': '4-4', '0,1,2,6': '4-5', '0,1,2,7': '4-6', '0,1,4,5': '4-7', '0,1,5,6': '4-8', '0,1,6,7': '4-9', '0,2,3,5': '4-10', '0,1,3,5': '4-11', '0,2,3,6': '4-12', '0,1,3,6': '4-13', '0,2,3,7': '4-14', '0,1,4,6': '4-Z15', '0,1,5,7': '4-16', '0,3,4,7': '4-17', '0,1,4,7': '4-18', '0,1,4,8': '4-19', '0,1,5,8': '4-20', '0,2,4,6': '4-21', '0,2,4,7': '4-22', '0,2,5,7': '4-23', '0,2,4,8': '4-24', '0,2,6,8': '4-25', '0,3,5,8': '4-26', '0,2,5,8': '4-27', '0,3,6,9': '4-28', '0,1,3,7': '4-Z29',
  '0,2,4,7,9': '5-35', '0,2,4,6,8,10': '6-35', '0,1,4,5,8,9': '6-20',
};
const FORTE = {};
for (const [k, name] of Object.entries(FORTE_RAW)) FORTE[key(primeForm(k.split(',').map(Number)))] = name;
FORTE[key(primeForm([0, 1, 3, 5, 6, 8, 10]))] = '7-35';
FORTE[key(primeForm([0, 1, 3, 4, 6, 7, 9, 10]))] = '8-28';
export const forteName = (S) => FORTE[key(primeForm(S))] || null;

// ---------------------------------------------------------------- named collections

export const PRESETS = {
  diatonic: [0, 2, 4, 5, 7, 9, 11],
  pentatonic: [0, 2, 4, 7, 9],
  wholetone: [0, 2, 4, 6, 8, 10],
  octatonic: [0, 1, 3, 4, 6, 7, 9, 10],
  hexatonic: [0, 1, 4, 5, 8, 9],
  harmMinor: [0, 2, 3, 5, 7, 8, 11],
  melMinor: [0, 2, 3, 5, 7, 9, 11],
  major: [0, 4, 7],
  minor: [0, 3, 7],
  dom7: [0, 4, 7, 10],
  dim7: [0, 3, 6, 9],
  aug: [0, 4, 8],
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
};
/** Rotation of a scale's step pattern: pcs of the mode that starts on degree r (0-based), tonic placed at `tonic`. */
export function modeOf(S, r, tonic = 0) {
  const base = S[r];
  return norm(S.map((x) => x - base + tonic));
}
export const MODE_NAMES = ['Ionian', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian', 'Locrian'];

// ---------------------------------------------------------------- the pitch-class clock

/** Point for pitch class k on a clock of radius R (C at the top, clockwise). */
export const clk = (k, R = 1) => circ(k * 100, R);
/** Pitch class nearest the point (x, y) of a clock stage. */
export const pcAt = (x, y) => mod(Math.round((Math.atan2(x, y) / (2 * Math.PI)) * 12));
/** Draw the empty clock: ring, ticks, numerals (and optionally note names outside). */
export function drawClock(s, { R = 1, names = false, num = true, dim = false } = {}) {
  s.circle(0, 0, R, { color: 'faint', width: 1.2 });
  for (let k = 0; k < 12; k++) {
    const a = clk(k, R), b = clk(k, R - 0.05);
    s.line(a[0], a[1], b[0], b[1], { color: 'muted', width: 1 });
    if (num) { const p = clk(k, R + 0.13); s.text(String(k), p[0], p[1], { size: 11, color: dim ? 'faint' : 'muted', align: 'center', baseline: 'middle' }); }
    if (names) { const p = clk(k, R + 0.3); s.text(NOTE[k], p[0], p[1], { size: 11, color: 'muted', align: 'center', baseline: 'middle' }); }
  }
}
/** Closed polygon through the pitch classes of a set (sorted around the clock). */
export function polyOf(s, S, R, o = {}) {
  const P = norm(S).map((k) => clk(k, R));
  if (P.length >= 3) s.poly(P, { fill: o.color || 'accent', fillAlpha: o.fillAlpha ?? 0.1, color: o.color || 'accent', width: o.width ?? 1.4, alpha: o.alpha ?? 0.8 });
  else if (P.length === 2) s.line(P[0][0], P[0][1], P[1][0], P[1][1], { color: o.color || 'accent', width: o.width ?? 1.6 });
}
/** Dots for a set on the clock. */
export function dotsOf(s, S, R, o = {}) {
  norm(S).forEach((k) => { const p = clk(k, R); s.dot(p[0], p[1], { r: o.r ?? 7, color: o.color || 'accent', hollow: o.hollow, alpha: o.alpha }); });
}
export const CLOCK_STAGE = { x: [-1.5, 1.5], y: [-1.5, 1.5], equal: true, axes: false, height: 380 };

// ---------------------------------------------------------------- sound

/** Pitch classes as semitones above C4, melodic (ascending, wrapping into the next octave). */
export function melody(S, tonic = 0, dur = 0.42) {
  const P = S.slice(); const out = [];
  let last = -1;
  P.forEach((k) => { let c = k * 100; while (c < last) c += 1200; out.push([c]); last = c; });
  return seqCents(out, C4 * 2 ** (tonic / 12) / 2 ** (0 / 12), dur, 0.03);
}
/** A scale from `tonic` (pc), ascending one octave through the set S, with the tonic repeated on top. */
export function scaleBuf(S, tonic = 0, dur = 0.4) {
  const R = norm(S.map((x) => x - tonic)); const cs = R.map((x) => [x * 100]); cs.push([1200]);
  return seqCents(cs, C4 * 2 ** (tonic / 12), dur, 0.03);
}
/** The scale from `tonic` over a drone on the tonic and its fifth. */
export function droneScale(S, tonic = 0, dur = 0.5) {
  const sc = scaleBuf(S, tonic, dur), f = (C4 * 2 ** (tonic / 12)) / 2;
  const d = mixBuf([[TIM, f], [TIM, f * 1.5]], sc.length / SR), out = new Float32Array(sc.length);
  for (let i = 0; i < out.length; i++) out[i] = 0.75 * sc[i] + 0.45 * (d[i] || 0);
  return out;
}
export const chordBuf = (S, dur = 1.6) => chordCents(S.map((k) => k * 100), C4, dur);
export { circ, seqCents, chordCents, C4, SR, NOTE };

// ---------------------------------------------------------------- Fourier transform of a pitch-class set

/** f_k = sum over the set of exp(-2 pi i j k / 12): [re, im]. */
export function fcoef(S, k) { let re = 0, im = 0; for (const j of S) { const a = (-2 * Math.PI * j * k) / 12; re += Math.cos(a); im += Math.sin(a); } return [re, im]; }
export const fmag = (S, k) => Math.hypot(...fcoef(S, k));
/** Interval function IF(d) = number of ordered pairs (a, b) in S x S with b - a = d (mod 12). */
export function ifun(S) { const v = new Array(12).fill(0); for (const a of S) for (const b of S) v[mod(b - a)]++; return v; }

// ---------------------------------------------------------------- all sets, set classes, enumeration (computed once)

let _all = null;
/** Every subset of the 12 pitch classes as a bitmask 0..4095, grouped by T/I class and by T class. */
export function classes() {
  if (_all) return _all;
  const tiOf = new Int32Array(4096).fill(-1), tOf = new Int32Array(4096).fill(-1);
  const ti = [], t = [];
  for (let m = 0; m < 4096; m++) {
    if (tOf[m] < 0) { const id = t.length, mem = []; for (let n = 0; n < 12; n++) { const r = rotMask(m, n); if (tOf[r] < 0) { tOf[r] = id; mem.push(r); } } t.push(mem); }
    if (tiOf[m] < 0) { const id = ti.length, mem = []; for (let n = 0; n < 12; n++) for (const r of [rotMask(m, n), invMask(m, n)]) if (tiOf[r] < 0) { tiOf[r] = id; mem.push(r); } ti.push(mem); }
  }
  _all = { ti, t, tiOf, tOf };
  return _all;
}
/** Fixed points of each of the 24 operations (T0..T11, then I0..I11) among the k-element sets: array of 24 counts. */
export function fixCounts(k) {
  const out = new Array(24).fill(0);
  for (let m = 0; m < 4096; m++) {
    if (popc(m) !== k) continue;
    for (let n = 0; n < 12; n++) { if (rotMask(m, n) === m) out[n]++; if (invMask(m, n) === m) out[12 + n]++; }
  }
  return out;
}

// ---------------------------------------------------------------- the dihedral group of order 24

/** An operation is [inv, n]: inv = 0 gives x -> x + n, inv = 1 gives x -> n - x. Compose: apply a first, then b. */
export function compose(a, b) {
  // b(a(x)): a(x) = s*x + n_a with s = +1 or -1
  const sa = a[0] ? -1 : 1, sb = b[0] ? -1 : 1;
  return [a[0] ^ b[0], mod(sb * a[1] + b[1])];
}
export const opName = (o) => `${o[0] ? 'I' : 'T'}${o[1]}`;
export const opSub = (o) => `${o[0] ? 'I' : 'T'}<sub>${o[1]}</sub>`;
export const applyOp = (S, o) => (o[0] ? In(S, o[1]) : Tn(S, o[1]));

// ---------------------------------------------------------------- spelling, staff and keyboard

export const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
export const LET_PC = [0, 2, 4, 5, 7, 9, 11];
export const accStr = (a) => (a === 0 ? '' : a > 0 ? '♯'.repeat(a) : '♭'.repeat(-a));
/** Diatonic step number (C0 = 0, one per letter) and accidental to MIDI number. */
export const stepMidi = (step, acc = 0) => 12 * (Math.floor(step / 7) + 1) + LET_PC[mod(step, 7)] + acc;
export const stepName = (step, acc = 0) => `${LETTERS[mod(step, 7)]}${accStr(acc)}${Math.floor(step / 7)}`;
/** Spell a MIDI number as [step, accidental], using sharps or flats for black keys. */
export function spell(m, sharp = true) {
  const o = Math.floor(m / 12) - 1, pc = mod(m, 12);
  const SH = [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [3, 0], [3, 1], [4, 0], [4, 1], [5, 0], [5, 1], [6, 0]];
  const FL = [[0, 0], [1, -1], [1, 0], [2, -1], [2, 0], [3, 0], [4, -1], [4, 0], [5, -1], [5, 0], [6, -1], [6, 0]];
  const [l, a] = (sharp ? SH : FL)[pc];
  return [o * 7 + l, a];
}
export const midiFreq = (m) => 440 * 2 ** ((m - 69) / 12);
/** Bottom-line diatonic step of each clef. */
export const CLEFS = { treble: { bottom: 30, name: 'G clef (treble)', shift: 0 }, bass: { bottom: 18, name: 'F clef (bass)', shift: 0 }, alto: { bottom: 24, name: 'C clef (alto)', shift: 0 } };
/** Draw five staff lines on stage s (x from x0 to x1); a step is half a line spacing (stage y units = steps above the bottom line). */
export function drawStaff(s, x0, x1) {
  for (let i = 0; i < 5; i++) s.line(x0, 2 * i, x1, 2 * i, { color: 'muted', width: 1.2 });
}
/** Notehead with ledger lines. y in steps above the bottom line. */
export function noteHead(s, x, y, o = {}) {
  const c = o.color || 'ink';
  if (y < 0) for (let l = -2; l >= y - 0.01; l -= 2) s.line(x - 0.55, l, x + 0.55, l, { color: 'muted', width: 1.2 });
  if (y > 8) for (let l = 10; l <= y + 0.01; l += 2) s.line(x - 0.55, l, x + 0.55, l, { color: 'muted', width: 1.2 });
  s.dot(x, y, { r: o.r ?? 7, color: c, alpha: o.alpha });
  if (o.acc) s.text(o.acc, x - 0.95, y, { size: 19, color: c, align: 'center', baseline: 'middle', weight: 700 });
}

// ---------------------------------------------------------------- small multiples

/** A miniature clock centred at (cx, cy) of radius r, drawn in data units on an equal-aspect stage. */
export function mini(s, cx, cy, r, S, o = {}) {
  s.circle(cx, cy, r, { color: o.border || 'faint', width: o.bw ?? 1.2, fill: o.fill, fillAlpha: o.fillAlpha });
  const P = norm(S).map((k) => [cx + r * Math.sin((2 * Math.PI * k) / 12), cy + r * Math.cos((2 * Math.PI * k) / 12)]);
  if (P.length >= 3 && o.poly !== false) s.poly(P, { fill: o.color || 'accent', fillAlpha: 0.12, color: o.color || 'accent', width: 1, alpha: 0.7 });
  else if (P.length === 2) s.line(P[0][0], P[0][1], P[1][0], P[1][1], { color: o.color || 'accent', width: 1 });
  P.forEach((p) => s.dot(p[0], p[1], { r: o.dot ?? 3, color: o.color || 'accent' }));
  if (o.tick) s.dot(cx, cy + r, { r: 1.8, color: 'muted' });
}
/** Maximum |f_k| over all subsets of each cardinality: MAXF[card][k]. */
let _maxf = null;
export function maxFourier() {
  if (_maxf) return _maxf;
  _maxf = Array.from({ length: 13 }, () => new Array(7).fill(0));
  for (let m = 0; m < 4096; m++) { const S = fromMask(m), c = S.length; for (let k = 1; k <= 6; k++) _maxf[c][k] = Math.max(_maxf[c][k], fmag(S, k)); }
  return _maxf;
}
/** Z-related pairs (same T/I-class-invariant interval vector, different classes), as [[maskA, maskB], …] sorted by cardinality. */
export function zPairs() {
  const { ti } = classes(), g = {};
  ti.forEach((mem) => { const S = fromMask(mem[0]), k = `${S.length}:${icv(S).join('')}`; (g[k] = g[k] || []).push(mem); });
  const out = [];
  Object.values(g).filter((a) => a.length > 1).forEach((a) => { for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) out.push([a[i], a[j]]); });
  return out.sort((p, q) => popc(p[0][0]) - popc(q[0][0]) || key(primeForm(fromMask(p[0][0]))).localeCompare(key(primeForm(fromMask(q[0][0])))));
}
