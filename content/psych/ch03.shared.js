// Psychology & Perception — Chapter 3: Scaling sensation (helpers shared by ch03.js and ch03-b.js)
export * from './ch02.shared.js';

/** Representative exponents checked against Stevens1961, The Psychophysics of Sensory Function,
 * Table2 p13, with apparent length1.1 from pp11–12. All are approximate group summaries.
 * Source: https://hci.stanford.edu/courses/cs448b/papers/Stevens_Psychophysics.pdf
 * Temperature uses distance above neutral, not a ratio of absolute temperatures.
 */
export const EXPS = [
  { id: 'bright', name: 'brightness (5° target, dark)', short: 'brightness', n: 0.33, c: 'gold' },
  { id: 'smell', name: 'smell (heptane)', short: 'smell', n: 0.6, c: 'green' },
  { id: 'loud', name: 'loudness (binaural, sound pressure)', short: 'loudness', n: 0.6, c: 'purple' },
  { id: 'sacch', name: 'taste (saccharin)', short: 'saccharin', n: 0.8, c: 'pink' },
  { id: 'vib', name: 'vibration (60 Hz, finger)', short: 'vibration', n: 0.95, c: 'orange' },
  { id: 'len', name: 'visual length (projected line)', short: 'length', n: 1.1, c: 'accent' },
  { id: 'press', name: 'pressure on the palm', short: 'palm pressure', n: 1.1, c: 'muted' },
  { id: 'light', name: 'lightness (grey papers)', short: 'lightness', n: 1.2, c: 'blue' },
  { id: 'suc', name: 'taste (sucrose)', short: 'sucrose', n: 1.3, c: 'red' },
  { id: 'heavy', name: 'heaviness (lifted weights)', short: 'heaviness', n: 1.45, c: 'orange' },
  { id: 'warm', name: 'warmth (arm, degrees above neutral)', short: 'warmth', n: 1.6, c: 'red' },
  { id: 'shock', name: 'electric shock (current through fingers)', short: 'electric shock', n: 3.5, c: 'purple' },
];
export const EXP = Object.fromEntries(EXPS.map((e) => [e.id, e]));

/** Ticks for an axis that holds log10(value): returns [[log10 v, label], …] for v = 1, 2, 5 × 10^k inside [lo, hi] (in log10 units). */
export function logTicks(lo, hi, o = {}) {
  const out = [], mult = o.mult || [1, 2, 5];
  const lab = (v) => (v >= 1e6 ? v / 1e6 + 'M' : v >= 1e3 ? v / 1e3 + 'k' : v >= 1 ? String(v) : v >= 0.01 ? String(+v.toFixed(2)) : v.toExponential(0).replace('e-', '·10⁻'));
  for (let k = Math.floor(lo) - 1; k <= Math.ceil(hi) + 1; k++) for (const m of mult) {
    const val = m * Math.pow(10, k), l = Math.log10(val);
    if (l >= lo - 1e-9 && l <= hi + 1e-9) out.push([l, lab(val)]);
  }
  return out;
}
/** Decimal digits adapted to magnitude. */
export const sig = (x, d = 3) => (!isFinite(x) ? '—' : Math.abs(x) >= 100 ? x.toFixed(0) : Math.abs(x) >= 10 ? x.toFixed(Math.max(0, d - 2)) : x.toFixed(Math.max(0, d - 1)));
