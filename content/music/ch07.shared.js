// Music Theory & Acoustics — Chapter 7 shared helpers (tuning and temperament).
// Plain named exports, imported by ch07.js, ch07-b.js and ch07-c.js. Everything of chapter 6 (and, through it, chapters 4–5) is re-exported.

export * from './ch06.shared.js';
import { cents, harmonic, seqBuf, mixBuf, SR } from './ch06.shared.js';

// ---------------------------------------------------------------- names, constants

export const NOTE = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
export const mname = (m) => `${NOTE[((m % 12) + 12) % 12]}${Math.floor(m / 12) - 1}`;
export const mfreq = (m) => 440 * 2 ** ((m - 69) / 12);
/** Middle C, the reference pitch of every picture in this chapter. */
export const C4 = 261.6256;
/** Signed number as text with a true minus sign: sc(v, -3.2, 1) = "−3.2". */
export const sc = (v, x, d = 0) => (Math.abs(x) < 0.5 * 10 ** -d ? `±${v.fix(0, d)}` : `${x >= 0 ? '+' : '−'}${v.fix(Math.abs(x), d)}`);
export const fold = (c) => ((c % 1200) + 1200) % 1200;
/** The pure fifth, the Pythagorean comma 3^12/2^19 and the syntonic comma 81/80, in cents. */
export const FIFTH = cents(1.5);
export const PCOMMA = 12 * FIFTH - 8400;
export const SCOMMA = cents(81 / 80);
export const M3J = cents(5 / 4);
export const M3P = cents(81 / 64);
/** The timbre used for all listening in this chapter: six harmonics falling off as 0.88^(k−1). */
export const TIM = harmonic(6, 0.88);

// ---------------------------------------------------------------- the pitch circle

/** Point on a circle of radius R for pitch class c (cents, one turn = `period`), clockwise from the top. */
export const circ = (c, R = 1, period = 1200) => [R * Math.sin((2 * Math.PI * c) / period), R * Math.cos((2 * Math.PI * c) / period)];
/** Ring with ticks every `tick` cents and optional labels, on an equal-aspect stage. */
export function ring(s, R = 1, { tick = 100, period = 1200, color = 'faint', len = 0.04, labels = null, ls = 11 } = {}) {
  s.circle(0, 0, R, { color, width: 1.2 });
  for (let c = 0; c < period - 1e-6; c += tick) {
    const a = circ(c, R, period), b = circ(c, R - len, period);
    s.line(a[0], a[1], b[0], b[1], { color: 'muted', width: 1 });
    if (labels) { const p = circ(c, R + 0.1, period); s.text(labels(c), p[0], p[1], { size: ls, color: 'muted', align: 'center', baseline: 'middle' }); }
  }
}

// ---------------------------------------------------------------- tuning a chain of twelve fifths

/** Names along the chain of fifths, E♭ … G♯. Fifth number i joins CHAIN[i] to CHAIN[i + 1]; the last, G♯–E♭, is where a wolf sits by default. */
export const CHAIN = ['E♭', 'B♭', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F♯', 'C♯', 'G♯'];
/** Semitone (from C) of chain element j. */
export const chainSemi = (j) => (((7 * (j - 3)) % 12) + 12) % 12;
/**
 * Pitch classes (cents above C, indexed by semitone) of a tuning given by the sizes of its twelve fifths f[0..11]
 * (f[i] joins CHAIN[i] to CHAIN[i + 1]). The chain is cut at fifth w (the "wolf": f[w] is not used) and the note CHAIN[a] is placed
 * at `apc` cents above C; every other note is reached from it along the chain, as when a tuner works outward from a starting note.
 */
export function tuneChain(f, w, a, apc) {
  const pos = new Array(12).fill(0); pos[a] = apc;
  for (let j = a, k = 0; k < 12 && j !== w; k++) { const nj = (j + 1) % 12; pos[nj] = pos[j] + f[j]; j = nj; }
  for (let j = a, k = 0; k < 12; k++) { const pj = (j + 11) % 12; if (pj === w) break; pos[pj] = pos[j] - f[pj]; j = pj; }
  const pcs = new Array(12).fill(0);
  for (let j = 0; j < 12; j++) pcs[chainSemi(j)] = fold(pos[j]);
  return pcs;
}
/** The usual case: wolf (or closing fifth) at G♯–E♭, C at 0. */
export const tuneFromFifths = (f) => tuneChain(f, 11, 3, 0);
/** Size of the interval from semitone r up by `n` semitones in a tuning pcs (cents). */
export const ivl = (pcs, r, n) => fold(pcs[(r + n) % 12] - pcs[r]);
/** Sizes (cents above the root) of the notes of a major or minor triad on semitone r. */
export const triadC = (pcs, r, minor = false) => [0, ivl(pcs, r, minor ? 3 : 4), ivl(pcs, r, 7)];
/** Absolute cents (above C4) of the notes of a triad on semitone r, root placed in the octave above middle C when `up`. */
export const triadAbs = (pcs, r, minor = false, base = 0) => { const t = triadC(pcs, r, minor), root = pcs[r] > 600 ? pcs[r] - 1200 : pcs[r]; return t.map((x) => base + root + x); };

// ---------------------------------------------------------------- sound

/** One buffer of several chords (each a list of cents above f0), `dur` seconds each with `gap` between. */
export function seqCents(chords, f0 = C4, dur = 1.1, gap = 0.12, spec = TIM, o = {}) {
  return seqBuf(chords.map((cs) => cs.map((c) => [spec, f0 * 2 ** (c / 1200)])), dur, gap, o);
}
/** One chord (cents above f0). */
export function chordCents(cs, f0 = C4, dur = 1.8, spec = TIM, o = {}) {
  return mixBuf(cs.map((c) => [spec, f0 * 2 ** (c / 1200)]), dur, o);
}
export { SR };

// ---------------------------------------------------------------- continued fractions and equal divisions

/** First n partial quotients of the continued fraction of x (floating point; fine for n ≤ 14 with doubles). */
export function cfExpand(x, n = 12) {
  const a = []; let y = x;
  for (let i = 0; i < n; i++) { const q = Math.floor(y); a.push(q); const r = y - q; if (r < 1e-9) break; y = 1 / r; }
  return a;
}
/** Convergents [[p, q], …] of [a0; a1, a2, …]. */
export function convs(a) {
  const out = []; let p0 = 1, q0 = 0, p1 = a[0], q1 = 1; out.push([p1, q1]);
  for (let i = 1; i < a.length; i++) { const p2 = a[i] * p1 + p0, q2 = a[i] * q1 + q0; out.push([p2, q2]); p0 = p1; q0 = q1; p1 = p2; q1 = q2; }
  return out;
}
/** Best approximation to the interval of c cents by a step of an n-note equal division: [steps, error in cents (tempered − pure)]. */
export function edoApprox(n, c) { const k = Math.round((n * c) / 1200); return [k, (k * 1200) / n - c]; }
/** Interval names (5-limit and a few more) used for tables: [p, q, name]. */
export const J5 = [[16, 15, 'minor second'], [9, 8, 'major second'], [6, 5, 'minor third'], [5, 4, 'major third'], [4, 3, 'fourth'], [45, 32, 'tritone'], [3, 2, 'fifth'], [8, 5, 'minor sixth'], [5, 3, 'major sixth'], [9, 5, 'minor seventh'], [15, 8, 'major seventh']];

/**
 * Pairs of partials (harmonics 1..H of the given fundamentals) of different notes that are within `lim` Hz of each other:
 * [{d (Hz apart), i, j (notes), hi, hj (harmonic numbers)}], sorted by d. d < 0.05 means the partials coincide.
 */
export function nearPairs(freqs, H = 6, lim = 12) {
  const out = [];
  for (let i = 0; i < freqs.length; i++) for (let j = i + 1; j < freqs.length; j++) for (let a = 1; a <= H; a++) for (let b = 1; b <= H; b++) {
    const d = Math.abs(a * freqs[i] - b * freqs[j]); if (d < lim) out.push({ d, i, j, hi: a, hj: b });
  }
  return out.sort((x, y) => x.d - y.d);
}
