// Authored finite models for music 7.1–7.2. Exact integer decisions precede
// floating-point conversion to cents; no tolerance decides equality or records.
const C4 = 261.6256, SR = 44100;
const names = ['F', 'C', 'G', 'D', 'A', 'E', 'B', 'F♯', 'C♯', 'G♯', 'D♯', 'A♯', 'E♯'];
const gcd = (a, b) => { while (b) [a, b] = [b, a % b]; return a; };
const ratio = (a, b) => { const g = gcd(a, b); return [a / g, b / g]; };
const label = ([a, b]) => `${a}/${b}`;
const compare = (a, b) => a[0] * b[1] < b[0] * a[1] ? -1 : a[0] * b[1] > b[0] * a[1] ? 1 : 0;
const cents = ([a, b]) => 1200 * Math.log1p(Number(a - b) / Number(b)) / Math.LN2;
const integer = (n, lo, hi) => { if (!Number.isInteger(n) || n < lo || n > hi) throw new RangeError('integer control outside domain'); };
const pitch = k => { const a = 3n ** BigInt(k), b = 1n << BigInt(a.toString(2).length - 1); return [a, b]; };

export function pythagoreanScale(start, count) {
  if (typeof start !== 'string' || !['F', 'C'].includes(start)) throw new RangeError('unknown starting note');
  integer(count, 1, 12);
  const chain = Array.from({ length: count }, (_, k) => {
    const r = pitch(k); return { k, name: names[k + (start === 'C' ? 1 : 0)], ratio: label(r), value: Number(r[0]) / Number(r[1]), cents: cents(r) };
  });
  const order = chain.slice().sort((a, b) => compare(pitch(a.k), pitch(b.k)));
  const gaps = order.map((p, i) => {
    const a = pitch(p.k), b = i + 1 < count ? pitch(order[i + 1].k) : [2n, 1n];
    const r = ratio(b[0] * a[1], b[1] * a[0]);
    return { ratio: label(r), cents: cents(r) };
  });
  return { start, count, fifths: count - 1, rootHz: C4 * (start === 'F' ? 4 / 3 : 1), chain, order, gaps };
}

const cache = new Map();
function orbit(mode) {
  if (cache.has(mode)) return cache.get(mode);
  const out = []; let best = null;
  for (let k = 0; k <= 400; k++) {
    let p, r, close;
    if (mode === 'et') {
      const unfolded = 700 * k, m = Math.floor(unfolded / 1200 + .5), error = unfolded - 1200 * m;
      p = { k, folded: unfolded % 1200, error, distance: Math.abs(error), octaves: m, exactZero: k % 12 === 0 };
      close = [BigInt(Math.abs(error)), 1n];
    } else {
      const base = mode === 'fifth' ? 3n : 5n, a = mode === 'fifth' ? 1 : 2;
      const numerator = base ** BigInt(k), exponent = numerator.toString(2).length - 1, denominator = 1n << BigInt(exponent);
      const upper = numerator * numerator >= 2n * denominator * denominator;
      const nearest = upper ? 2n * denominator : denominator, error = cents([numerator, nearest]);
      r = [numerator, denominator];
      close = numerator >= nearest ? [numerator, nearest] : [nearest, numerator];
      p = { k, folded: error < 0 ? 1200 + error : error, error, distance: Math.abs(error), octaves: exponent + +upper - a * k, exactZero: k === 0 };
    }
    p.record = k > 0 && (!best || compare(close, best) < 0);
    if (p.record) best = close;
    out.push({ p, r });
  }
  cache.set(mode, out); return out;
}

export function rotationModel(mode, count) {
  if (typeof mode !== 'string' || !['fifth', 'third', 'et'].includes(mode)) throw new RangeError('unknown interval');
  integer(count, 1, 400);
  const raw = orbit(mode).slice(0, count + 1), points = raw.map(x => ({ ...x.p }));
  let minGap;
  if (mode === 'et') {
    const sorted = points.map(p => p.folded).sort((a, b) => a - b);
    minGap = Math.min(1200 - sorted.at(-1) + sorted[0], ...sorted.slice(1).map((x, i) => x - sorted[i]));
  } else {
    const sorted = raw.map(x => x.r).sort(compare);
    let best = null;
    for (let i = 0; i < sorted.length; i++) {
      const a = sorted[i], b = i + 1 < sorted.length ? sorted[i + 1] : [2n, 1n];
      const gap = [b[0] * a[1], b[1] * a[0]];
      if (!best || compare(gap, best) < 0) best = gap;
    }
    minGap = cents(best);
  }
  const records = points.filter(p => p.record);
  return { mode, count, points, records, best: records.at(-1), minGap, distinct: mode === 'et' ? Math.min(count + 1, 12) : count + 1, closures: mode === 'et' ? Math.floor(count / 12) : 0 };
}

// Playback convention, not historical evidence: pure sines at a declared C4/F4
// anchor, 10-ms linear end ramps, .12 peak bound per summed event, no autoplay.
export function tuningAudio(start, count, kind) {
  const s = pythagoreanScale(start, count);
  if (typeof kind !== 'string' || !['scale', 'fifth'].includes(kind)) throw new RangeError('unknown audio action');
  if (kind === 'fifth' && count === 1) throw new RangeError('one note has no last fifth');
  const duration = kind === 'scale' ? .3 : 1.2, gap = kind === 'scale' ? .03 : 0;
  const frequencies = kind === 'scale' ? [...s.order.map(p => [s.rootHz * p.value]), [2 * s.rootHz]] : [[s.rootHz * s.chain.at(-2).value, 1.5 * s.rootHz * s.chain.at(-2).value]];
  const frames = Math.round(duration * SR), silence = Math.round(gap * SR), ramp = Math.round(.01 * SR);
  const samples = new Float32Array(frequencies.length * frames + (frequencies.length - 1) * silence);
  frequencies.forEach((fs, i) => {
    const offset = i * (frames + silence);
    for (let j = 0; j < frames; j++) {
      const env = Math.min(1, j / ramp, (frames - 1 - j) / ramp);
      samples[offset + j] = .12 * env * fs.reduce((sum, f) => sum + Math.sin(2 * Math.PI * f * j / SR), 0) / fs.length;
    }
  });
  return { samples, sampleRate: SR, frequencies, frames, silence, ramp };
}
