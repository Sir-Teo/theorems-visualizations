// Music Theory & Acoustics — Chapter 6 shared helpers (consonance and dissonance).
// Plain named exports, imported by ch06.js and ch06-b.js. Sound and ear helpers of chapters 4–5 are re-exported.

export { TAU, SR, noteOf, playhead, finish, join, partials, loopVoice } from './ch04.shared.js';
export { cbw, erb, tones } from './ch05.shared.js';
import { TAU, SR, partials, finish } from './ch04.shared.js';
import { cbw } from './ch05.shared.js';

// ---------------------------------------------------------------- Plomp & Levelt (1965): their own data

/**
 * Fig. 10 of Plomp & Levelt (1965), "standard curve" of two pure tones: dissonance (their right-hand scale, 0–1) against the
 * frequency difference in units of the critical bandwidth. Traced from the published figure (scan of JASA 38, p. 556) by
 * locating the curve's pixels column by column between the printed grid lines (accuracy about ±0.01 in both coordinates).
 */
export const PL_FIG10 = [[0, 0], [0.01, 0.098], [0.02, 0.147], [0.03, 0.224], [0.04, 0.289], [0.05, 0.376], [0.06, 0.468], [0.07, 0.549], [0.08, 0.618], [0.09, 0.659], [0.1, 0.705], [0.12, 0.788], [0.14, 0.85], [0.16, 0.895], [0.18, 0.934], [0.2, 0.975], [0.22, 0.988], [0.24, 0.993], [0.26, 0.994], [0.28, 0.994], [0.3, 0.985], [0.32, 0.962], [0.34, 0.934], [0.36, 0.899], [0.38, 0.858], [0.4, 0.827], [0.44, 0.716], [0.48, 0.625], [0.52, 0.536], [0.56, 0.458], [0.6, 0.4], [0.65, 0.311], [0.7, 0.242], [0.75, 0.188], [0.8, 0.132], [0.85, 0.101], [0.9, 0.068], [0.95, 0.042], [1.0, 0.022], [1.05, 0.008], [1.1, 0.002], [1.2, 0]];

/** Monotone (Fritsch–Carlson) cubic interpolation through [[x, y], …] (x increasing); constant outside. */
export function pchip(pts) {
  const n = pts.length, x = pts.map((p) => p[0]), y = pts.map((p) => p[1]), d = [], m = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((y[i + 1] - y[i]) / (x[i + 1] - x[i]));
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (3 * (x[i + 1] - x[i - 1])) / ((2 * x[i + 1] - x[i] - x[i - 1]) / d[i - 1] + (x[i + 1] + x[i] - 2 * x[i - 1]) / d[i]);
  return (t) => {
    if (t <= x[0]) return y[0];
    if (t >= x[n - 1]) return y[n - 1];
    let i = 0; while (x[i + 1] < t) i++;
    const h = x[i + 1] - x[i], s = (t - x[i]) / h, s2 = s * s, s3 = s2 * s;
    return (2 * s3 - 3 * s2 + 1) * y[i] + (s3 - 2 * s2 + s) * h * m[i] + (-2 * s3 + 3 * s2) * y[i + 1] + (s3 - s2) * h * m[i + 1];
  };
}
/** Plomp–Levelt standard dissonance (0–1) at a separation of x critical bandwidths (their Fig. 10). */
export const plStd = pchip(PL_FIG10);
/**
 * Dissonance of two equal pure tones in Plomp & Levelt's model: their Fig. 10 read at Δf / CB, with the critical bandwidth taken at
 * the mean frequency (Zwicker & Terhardt's fit to the Zwicker–Flottorp–Stevens critical bands that the paper used).
 */
export const plDiss65 = (f1, f2) => plStd(Math.abs(f2 - f1) / cbw((f1 + f2) / 2));

/**
 * Plomp & Levelt's sum for two complex tones (Section III): sort all partials of both tones, and add the Fig. 10 dissonance of every pair
 * of ADJACENT partials (equal weights, as in the paper). Coinciding partials (Δf = 0) contribute nothing.
 */
export function plComplex(freqs) {
  const f = freqs.slice().sort((a, b) => a - b); let d = 0;
  for (let i = 0; i + 1 < f.length; i++) d += plDiss65(f[i], f[i + 1]);
  return d;
}

/**
 * Medians of the consonance ratings (7-point scale: 1 most dissonant, 7 most consonant) of pairs of pure tones at five mean frequencies,
 * against the frequency difference (Hz): Plomp & Levelt (1965) Figs. 3–7. Read from the published figures (median points, about ±3% in Δf,
 * ±0.05 in score). n = number of subjects retained after the test–retest screen.
 */
export const PL_MEDIANS = {
  125: { n: 11, pts: [[5.0, 2.0], [8.1, 2.2], [11.0, 2.2], [15.0, 2.41], [20.9, 2.7], [30.1, 3.42], [42.5, 3.62], [59.8, 5.02], [84.4, 5.21], [120.5, 5.82], [169, 6.02], [241, 6.22]] },
  250: { n: 10, pts: [[7.2, 3.88], [9.4, 3.69], [13.3, 2.4], [19.7, 2.72], [26.5, 3.11], [38.6, 4.72], [53.2, 5.4], [75.7, 5.12], [107, 5.03], [151, 4.54], [212, 4.44], [299, 5.14], [420, 4.34], [600, 5.24]] },
  500: { n: 11, pts: [[9.1, 3.61], [13.2, 3.0], [19.5, 2.59], [26.2, 2.38], [38.4, 2.59], [53.6, 2.79], [75, 3.79], [107, 5.81], [152, 5.4], [214, 5.8], [303, 5.8], [422, 5.8], [604, 6.19], [848, 5.8]] },
  1000: { n: 10, pts: [[16.2, 2.31], [21.1, 2.81], [30.8, 2.51], [43.6, 2.21], [62.2, 2.2], [85.3, 3.2], [124, 4.41], [171, 6.51], [251, 5.91], [343, 5.6], [500, 6.4], [686, 5.82], [1000, 6.4], [1360, 6.02]] },
  2000: { n: 8, pts: [[26.7, 1.71], [38.8, 2.0], [52.6, 2.0], [76, 1.71], [107, 2.2], [152, 2.79], [213, 3.91], [301, 4.8], [423, 4.8], [595, 5.39], [842, 5.6], [1200, 5.61], [1672, 6.2], [2384, 6.0]] },
};

/**
 * Fig. 11 of Plomp & Levelt (1965): computed dissonance of a 250 Hz complex tone (6 harmonics) against a second such tone of variable
 * frequency. Read from the published figure ([f in Hz, dissonance], their arbitrary units; peaks and troughs read to about ±0.05).
 */
export const PL_FIG11 = [[243.7, 4.4], [245.5, 3.5], [247.2, 2.4], [248.4, 1.4], [250, 0], [251.4, 1.0], [252.6, 2.3], [254.3, 3.9], [256.1, 4.95], [258.5, 5.42], [260.9, 5.53], [262.6, 5.51], [265, 5.35], [268, 5.0], [270.9, 4.58], [273.3, 4.1], [276.3, 3.73], [279.2, 3.45], [282.8, 3.2], [287, 3.04], [291.1, 2.87], [294.1, 2.73], [296.4, 2.57], [300, 2.0], [301.8, 2.18], [304.2, 2.38], [306.5, 2.44], [309.5, 2.34], [312.5, 2.15], [313.6, 2.42], [316.6, 2.82], [319.6, 2.93], [322.5, 2.87], [325.5, 2.76], [327.9, 2.56], [330.2, 2.26], [333.3, 1.6], [336.8, 2.0], [339.1, 2.18], [342.1, 2.42], [345.7, 2.57], [349.2, 2.71], [352.2, 2.76], [355.7, 2.78], [359.3, 2.75], [362.3, 2.63], [365.2, 2.37], [367.6, 2.05], [370.6, 1.51], [372.9, 1.0], [375, 0.5], [377.1, 1.17], [378.9, 1.61], [380.6, 2.0], [382.4, 2.38], [386, 2.64], [390.1, 2.76], [393.7, 2.78], [398.4, 2.73], [402, 2.59], [405.5, 2.32], [408.5, 2.0], [410.9, 1.75], [412.6, 1.53], [414.4, 1.28], [416.7, 0.8], [419.2, 1.09], [422.7, 1.36], [425.7, 1.51], [430, 1.6], [435.2, 1.66], [440.5, 1.72], [446.4, 1.8], [450, 1.89], [454.7, 2.06], [458.9, 2.29], [462.5, 2.52], [466.6, 2.71], [470.8, 2.86], [475.5, 2.97], [479, 3.0], [482.6, 2.95], [485.6, 2.8], [488.5, 2.53], [490.9, 2.22], [493.3, 1.81], [495.1, 1.48], [497.4, 0.8], [500, 0], [502.8, 0.76], [504.5, 1.31], [506.9, 1.98], [509.3, 2.38], [511.7, 2.61], [512.8, 2.72]];

/**
 * Fig. 12 of Plomp & Levelt (1965): computed dissonance of six intervals of 6-harmonic tones against the frequency of the lower tone.
 * Read approximately from the published figure ([f lower in Hz, dissonance]; about ±0.15 in dissonance).
 */
export const PL_FIG12 = {
  '1:2': [[45, 3.6], [64, 0.95], [90, 0.08], [200, 0], [500, 0], [1000, 0.12]],
  '2:3': [[80, 3.5], [111, 1.6], [167, 0.8], [270, 0.5], [470, 0.45], [760, 0.58], [1100, 0.85]],
  '3:5': [[85, 3.5], [119, 1.8], [180, 1.03], [310, 0.73], [470, 0.65], [760, 0.73], [1100, 0.95]],
  '5:6': [[119, 3.6], [180, 2.24], [310, 1.41], [540, 1.18], [810, 1.26], [1100, 1.4]],
  '3:4': [[127, 3.5], [192, 2.24], [310, 1.52], [440, 1.41], [710, 1.6], [1100, 2.0]],
  '4:5': [[134, 3.45], [206, 2.47], [330, 1.71], [500, 1.56], [760, 1.71], [1100, 2.1]],
};

// ---------------------------------------------------------------- Sethares' parametrization and dissonance curves

/** Sethares' (1993) parametrization of the Plomp–Levelt curve for two partials (peak 1, amplitude weight min(a1, a2)), = v.M.plompLevelt. */
const B1 = 3.51, B2 = 5.75, PEAK = Math.exp(-B1 * Math.log(B2 / B1) / (B2 - B1)) - Math.exp(-B2 * Math.log(B2 / B1) / (B2 - B1));
export function pl(f1, f2, a1 = 1, a2 = 1) {
  const s = 0.24 / (0.0207 * Math.min(f1, f2) + 18.96), x = s * Math.abs(f2 - f1);
  return (Math.min(a1, a2) * (Math.exp(-B1 * x) - Math.exp(-B2 * x))) / PEAK;
}

/** Spectrum (list of [ratio, amp]) at fundamental f → partial list [[f, a], …]. */
export const at = (spec, f) => spec.map(([r, a]) => [r * f, a]);

/** Total dissonance of any set of partials [[f, a], …] (sum over all pairs; Sethares). */
export function dissAll(P) {
  let d = 0;
  for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) d += pl(P[i][0], P[j][0], P[i][1], P[j][1]);
  return d;
}
/** Dissonance of two tones with spectra A and B (lists [ratio, amp]) on fundamentals f1, f2: intrinsic parts + all cross pairs. */
export function diss2(A, f1, B, f2) {
  return dissAll(at(A, f1).concat(at(B, f2)));
}
/** Dissonance curve of spectrum spec against a copy of itself (or spec2) at intervals c0..c1 cents above f0 (n + 1 samples). */
export function dissCurve(spec, f0, c0, c1, n = 600, spec2 = spec) {
  const c = new Float64Array(n + 1), d = new Float64Array(n + 1), A = at(spec, f0), iA = dissAll(A);
  for (let i = 0; i <= n; i++) {
    const ci = c0 + ((c1 - c0) * i) / n, B = at(spec2, f0 * 2 ** (ci / 1200));
    let s = iA + dissAll(B);
    for (const [fa, aa] of A) for (const [fb, ab] of B) s += pl(fa, fb, aa, ab);
    c[i] = ci; d[i] = s;
  }
  return { c, d };
}
/** Local minima of a sampled curve {c, d} deeper than `prom` (relative to the curve's range) on both sides; refined by a parabola. */
export function minima({ c, d }, prom = 0.01) {
  let lo = Infinity, hi = -Infinity; for (const x of d) { if (x < lo) lo = x; if (x > hi) hi = x; }
  const tol = prom * (hi - lo || 1), out = [];
  for (let i = 1; i < d.length - 1; i++) {
    if (!(d[i] <= d[i - 1] && d[i] < d[i + 1])) continue;
    let L = d[i], R = d[i];
    for (let j = i - 1; j >= 0 && d[j] >= d[i]; j--) L = Math.max(L, d[j]);
    for (let j = i + 1; j < d.length && d[j] >= d[i]; j++) R = Math.max(R, d[j]);
    if (Math.min(L, R) - d[i] < tol) continue;
    const a = d[i - 1], b = d[i], e = d[i + 1], den = a - 2 * b + e, off = den > 0 ? (0.5 * (a - e)) / den : 0;
    out.push({ c: c[i] + off * (c[1] - c[0]), d: b, depth: Math.min(L, R) - b });
  }
  return out;
}
/** Sample a curve {c, d} at cents x (linear interpolation). */
export function sample({ c, d }, x) {
  const n = c.length - 1, u = ((x - c[0]) / (c[n] - c[0])) * n, i = Math.max(0, Math.min(n - 1, Math.floor(u))), t = u - i;
  return d[i] + (d[i + 1] - d[i]) * t;
}

// ---------------------------------------------------------------- ratios

export const cents = (r) => 1200 * Math.log2(r);
export const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
/** Simplest ratio p/q (p ≥ q, q ≤ maxQ) within tol cents of an interval, or the nearest one. Returns {p, q, err}. */
export function nearRatio(c, maxQ = 9, tol = 18) {
  let best = null;
  for (let q = 1; q <= maxQ; q++) for (let p = q; p <= 4 * q; p++) {
    if (gcd(p, q) !== 1) continue;
    const e = c - cents(p / q);
    if (Math.abs(e) <= tol && (!best || p * q < best.p * best.q)) best = { p, q, err: e };
  }
  if (best) return best;
  let nb = null;
  for (let q = 1; q <= maxQ; q++) for (let p = q; p <= 4 * q; p++) { if (gcd(p, q) !== 1) continue; const e = c - cents(p / q); if (!nb || Math.abs(e) < Math.abs(nb.err)) nb = { p, q, err: e }; }
  return nb;
}
/** Prime factorization of a positive integer → [[p, e], …]. */
export function factor(n) {
  const out = []; let m = n;
  for (let p = 2; p * p <= m; p++) { let e = 0; while (m % p === 0) { m /= p; e++; } if (e) out.push([p, e]); }
  if (m > 1) out.push([m, 1]);
  return out;
}
/** Euler's gradus suavitatis of an integer n = Π p^e: Γ(n) = 1 + Σ e (p − 1). */
export const gradusN = (n) => 1 + factor(n).reduce((s, [p, e]) => s + e * (p - 1), 0);
export const lcm = (a, b) => (a / gcd(a, b)) * b;
/** Gradus of an interval or chord given as integers in lowest terms (e.g. [4, 5, 6]): Γ(lcm). */
export function gradus(terms) { const g = terms.reduce((a, b) => gcd(a, b)); const t = terms.map((x) => x / g); return gradusN(t.reduce(lcm, 1)); }
/** Tenney height log2(p·q) of p/q in lowest terms. */
export const tenney = (p, q) => Math.log2((p / gcd(p, q)) * (q / gcd(p, q)));
/** Just intervals of the octave used across the chapter: [p, q, name]. */
export const JUST = [[1, 1, 'unison'], [16, 15, 'semitone'], [9, 8, 'whole tone'], [6, 5, 'minor third'], [5, 4, 'major third'], [4, 3, 'fourth'], [7, 5, 'septimal tritone'], [45, 32, 'tritone'], [3, 2, 'fifth'], [8, 5, 'minor sixth'], [5, 3, 'major sixth'], [7, 4, 'harmonic seventh'], [16, 9, 'minor seventh'], [15, 8, 'major seventh'], [2, 1, 'octave']];

// ---------------------------------------------------------------- spectra

/** n harmonics with amplitudes roll^(k−1) (roll < 1) or k^roll (roll ≤ 0 used as a power: 0 = equal, −1 = 1/k). */
export function harmonic(n = 6, roll = 0.88) {
  return Array.from({ length: n }, (_, k) => [k + 1, roll > 0 ? roll ** k : (k + 1) ** roll]);
}
/** Stretched (A > 2) or compressed (A < 2) partials f·A^{log2 j} (Slaymaker; Mathews & Pierce), amplitudes roll^(j−1). */
export function stretched(n, A, roll = 0.88) {
  return Array.from({ length: n }, (_, k) => [A ** Math.log2(k + 1), roll ** k]);
}
/** Ideal free–free uniform beam: mode frequency ratios (Fletcher & Rossing, as quoted by Sethares). */
export const BEAM = [1, 2.758, 5.406, 8.936, 13.35, 18.645, 24.82];
/** Measured overtone ratios of one note (bar 4 of a jublag, bar 8 of an ugal) of a Balinese gamelan: Jones, Gee & Grimshaw (2010), Table I. */
export const JUBLAG = [1, 2.77, 5.18, 5.33];
export const UGAL = [1, 2.61, 4.80, 4.94, 6.32];
/** One of Sethares' three timbres "induced" by 10-tone equal temperament: partials at b^k, b = 2^(1/10), k as listed. */
export const TET10 = [0, 10, 17, 20, 25, 28, 30];

/** Short label for an amplitude-weighted spectrum. */
export const ratioStr = (r) => (Math.abs(r - Math.round(r)) < 0.005 ? String(Math.round(r)) : r.toFixed(2));

// ---------------------------------------------------------------- Helmholtz (1863), Appendix XV

/**
 * Helmholtz's roughness of two beating partials (Sensations of Tone, App. XV): r = 16 B'B'' · β²/(β² + 4π²δ²) · θ²(pδ)²/(θ² + (pδ)²)²,
 * written here with frequencies: δ = half the relative interval of the two partials, the beat rate b = |f2 − f1|, and θ-factor peaking
 * where the beat rate reaches b0 (Helmholtz: about 30 beats a second, θ = 15/264 for c' = 264). β is the damping of the ear's resonators:
 * β = 0.121 makes their response fall to 1/10 of its intensity a semitone off tune (Helmholtz's "third degree", Part I ch. 7).
 */
export function helmPair(f1, a1, f2, a2, b0 = 30, beta = 0.121) {
  const b = Math.abs(f2 - f1), dl = b / (f1 + f2), u = b / b0;
  return 16 * a1 * a2 * (beta * beta) / (beta * beta + 4 * Math.PI * Math.PI * dl * dl) * (u * u) / ((1 + u * u) ** 2);
}

// ---------------------------------------------------------------- harmonicity (virtual pitch), illustrative

/**
 * A simple harmonic-template ("virtual pitch") model, in the spirit of Terhardt (1974): for candidate fundamentals f0 (subharmonics of the
 * partials, down to fmin), score how much amplitude lies within ~σ cents of an integer multiple of f0, weighting the k-th harmonic by 1/√k;
 * return the best score (0–1) and its f0. ILLUSTRATIVE: a toy measure, not a calibrated perceptual model.
 */
export function harmonicity(P, { sigma = 12, fmin = 40, kmax = 16 } = {}) {
  const tot = P.reduce((s, p) => s + p[1], 0) || 1; let best = 0, bf = 0;
  for (const [fp] of P) for (let k = 1; k <= kmax; k++) {
    const f0 = fp / k; if (f0 < fmin) break;
    let sc = 0;
    for (const [f, a] of P) {
      const h = Math.max(1, Math.round(f / f0)), dc = 1200 * Math.log2(f / (h * f0));
      sc += (a * Math.exp(-0.5 * (dc / sigma) ** 2)) / Math.sqrt(h);
    }
    sc /= tot;
    if (sc > best + 1e-9) { best = sc; bf = f0; }
  }
  return { h: best, f0: bf };
}

// ---------------------------------------------------------------- sound

/** A tone buffer: spectrum [[ratio, amp], …] on f, dur seconds; `decay` (1/s, scaled up for higher partials) for plucked or struck sounds. */
export function toneBuf(spec, f, dur = 1.2, o = {}) {
  const parts = spec.map(([r, a]) => ({ f: r * f, a, d: o.decay ? o.decay * (1 + 0.5 * (r - 1)) : 0 }));
  return partials(parts, dur, { att: o.att ?? (o.decay ? 0.004 : 0.03), rel: o.rel ?? 0.15 });
}
/** Mix several tones (each [spec, f]) into one buffer, normalized to a comfortable peak. */
export function mixBuf(notes, dur = 1.4, o = {}) {
  const bufs = notes.map(([spec, f]) => toneBuf(spec, f, dur, o)), out = new Float32Array(bufs[0].length);
  for (const b of bufs) for (let i = 0; i < out.length; i++) out[i] += b[i];
  return finish(out, o.peak ?? 0.8);
}
/** A sequence of chords (each a list of [spec, f]) with gaps, as one buffer. */
export function seqBuf(chords, dur = 0.9, gap = 0.12, o = {}) {
  const parts = chords.map((ch) => mixBuf(ch, dur, o)), g = Math.round(gap * SR), out = new Float32Array(parts.reduce((s, b) => s + b.length + g, 0));
  let off = 0; for (const b of parts) { out.set(b, off); off += b.length + g; }
  return out;
}

// ---------------------------------------------------------------- drawing

/** Ticks for an interval axis in cents labelled by just ratios (or note names) within [c0, c1]. */
export function ratioTicks(c0, c1, list = [[1, 1], [6, 5], [5, 4], [4, 3], [3, 2], [5, 3], [2, 1], [5, 2], [3, 1], [4, 1]]) {
  return list.map(([p, q]) => [cents(p / q), `${p}/${q}`]).filter(([c]) => c >= c0 - 0.5 && c <= c1 + 0.5);
}
/** Interval name for a number of equal-tempered semitones. */
export const SEMI_NAMES = ['P1', 'm2', 'M2', 'm3', 'M3', 'P4', 'TT', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8'];
