// Psychology & Perception — Chapter 3: Scaling sensation (helpers shared by ch03.js and ch03-b.js)
export * from './ch02.shared.js';

/**
 * Exponents n of Stevens' power law ψ = k·I^n for some continua, as listed in the commonly reproduced table of
 * Stevens (1957, 1975). Transcribed from a secondary listing (not checked against the original papers): see the
 * `verify` flags of the items that use them. `c` is a palette colour for the gallery.
 */
export const EXPS = [
  { id: 'bright', name: 'brightness (5° target, dark)', short: 'brightness', n: 0.33, c: 'gold' },
  { id: 'smell', name: 'smell (heptane)', short: 'smell', n: 0.6, c: 'green' },
  { id: 'loud', name: 'loudness (3000 Hz, sound pressure)', short: 'loudness', n: 0.67, c: 'purple' },
  { id: 'area', name: 'visual area (projected square)', short: 'visual area', n: 0.7, c: 'teal' },
  { id: 'sacch', name: 'taste (saccharin)', short: 'saccharin', n: 0.8, c: 'pink' },
  { id: 'vib', name: 'vibration (60 Hz, finger)', short: 'vibration', n: 0.95, c: 'orange' },
  { id: 'len', name: 'visual length (projected line)', short: 'length', n: 1.0, c: 'accent' },
  { id: 'press', name: 'pressure on the palm', short: 'palm pressure', n: 1.1, c: 'muted' },
  { id: 'light', name: 'lightness (grey papers)', short: 'lightness', n: 1.2, c: 'blue' },
  { id: 'suc', name: 'taste (sucrose)', short: 'sucrose', n: 1.3, c: 'red' },
  { id: 'heavy', name: 'heaviness (lifted weights)', short: 'heaviness', n: 1.45, c: 'orange' },
  { id: 'rough', name: 'tactual roughness (emery cloth)', short: 'roughness', n: 1.5, c: 'green' },
  { id: 'warm', name: 'warmth (metal on the arm)', short: 'warmth', n: 1.6, c: 'red' },
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
