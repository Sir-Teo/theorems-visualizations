// Music Theory & Acoustics — Chapter 3 shared helpers (pipes, drums, bars and bells).
// Plain named exports, imported by ch03.js and ch03-b.js. (Adapted from ch02.shared.js, which is not imported.)

export const TAU = 2 * Math.PI;
export const SR = 44100;
/** Speed of sound (m/s) and density of air (kg/m³) at about 20 °C. */
export const C_AIR = 343;
export const RHO_AIR = 1.2;

/** Note name and cents offset of a frequency, e.g. "A4 −3 ¢" (M = v.M). */
export function noteOf(M, f, flats) {
  if (!(f > 0)) return '—';
  const m = M.freqToMidi(f), r = Math.round(m), d = Math.round((m - r) * 100);
  return M.noteName(r, flats ? { flats: true } : undefined) + (d ? ` ${d > 0 ? '+' : '−'}${Math.abs(d)} ¢` : '');
}

/** Signed cents with a real minus sign, e.g. "+12 ¢", "−3 ¢". */
export const centsTxt = (c, dec = 0) => `${c > 0.5 * 10 ** -dec ? '+' : c < -0.5 * 10 ** -dec ? '−' : '±'}${Math.abs(c).toFixed(dec)} ¢`;

/**
 * A playhead that follows a sound for `dur` seconds and redraws the viz about 25 times a second
 * (sound only starts from a click, so the timer only runs after one). ph.t is the elapsed time, or null.
 */
export function playhead(v) {
  let t0 = 0, dur = 0, id = 0, tag = null;
  const stop = () => { if (id) clearInterval(id); id = 0; dur = 0; tag = null; v.invalidate(); };
  if (v.onCleanup) v.onCleanup(() => { if (id) clearInterval(id); id = 0; });
  return {
    start(d, what = null) {
      if (id) clearInterval(id);
      t0 = performance.now(); dur = d; tag = what;
      id = setInterval(() => { if (performance.now() - t0 > dur * 1000 + 80) stop(); else v.invalidate(); }, 40);
      v.invalidate();
    },
    stop,
    get t() { return dur ? (performance.now() - t0) / 1000 : null; },
    get tag() { return dur ? tag : null; },
  };
}

/** Scale a buffer (in place) to the given peak; short fades at both ends so it starts and stops without clicks. */
export function finish(buf, peak = 0.85, sr = SR, fadeIn = 0.002, fadeOut = 0.04) {
  let m = 0; for (let i = 0; i < buf.length; i++) m = Math.max(m, Math.abs(buf[i]));
  const k = m > 0 ? peak / m : 0, a = Math.min(buf.length >> 1, Math.round(fadeIn * sr)), b = Math.min(buf.length >> 1, Math.round(fadeOut * sr));
  for (let i = 0; i < buf.length; i++) buf[i] *= k;
  for (let i = 0; i < a; i++) buf[i] *= i / a;
  for (let i = 0; i < b; i++) buf[buf.length - 1 - i] *= i / b;
  return buf;
}

/**
 * Sum of exponentially decaying partials, each started at its peak (a struck or plucked body released from rest).
 * parts: [{f, a, d, ph?}] (Hz, amplitude, amplitude decay rate in 1/s, phase). opts: {sr, delay (s), attack (s)}.
 */
export function synth(parts, dur, opts = {}) {
  const sr = opts.sr || SR, n = Math.round(dur * sr), out = new Float32Array(n), k0 = Math.round((opts.delay || 0) * sr);
  const att = Math.max(1, Math.round((opts.attack ?? 0.0015) * sr));
  for (const p of parts) {
    if (!p.a || !(p.f > 0) || p.f > sr * 0.45) continue;
    const w = (TAU * p.f) / sr, c = Math.cos(w), s = Math.sin(w), r = Math.exp(-(p.d || 0) / sr);
    let x = p.a * Math.cos(p.ph || 0), y = p.a * Math.sin(p.ph || 0);
    for (let k = k0; k < n; k++) {
      out[k] += k - k0 < att ? (x * (k - k0)) / att : x;
      const nx = (x * c - y * s) * r; y = (x * s + y * c) * r; x = nx;
    }
  }
  return out;
}

/** Concatenate buffers with gaps of `gap` seconds. */
export function join(bufs, gap = 0.15, sr = SR) {
  const g = Math.round(gap * sr), out = new Float32Array(bufs.reduce((a, b) => a + b.length, 0) + g * Math.max(0, bufs.length - 1));
  let o = 0; bufs.forEach((b) => { out.set(b, o); o += b.length + g; });
  return out;
}

/** A steady periodic tone as a buffer: harmonics [[n, amp], …] of f0, with attack and release (s). */
export function steadyTone(f0, harm, dur, att = 0.03, rel = 0.08, sr = SR) {
  const n = Math.round(dur * sr), out = new Float32Array(n);
  for (const [h, a] of harm) {
    if (!a || h * f0 > sr * 0.45) continue;
    const w = (TAU * h * f0) / sr; for (let k = 0; k < n; k++) out[k] += a * Math.sin(w * k);
  }
  const A = Math.round(att * sr), R = Math.round(rel * sr);
  for (let k = 0; k < n; k++) out[k] *= Math.min(1, k / A, (n - k) / R);
  return out;
}

/**
 * Theme-aware colours for a signed quantity: u in [−1, 1] → blue (−) … panel colour (0) … red (+).
 * Returns {col(u), key}; put key into a raster key so that a theme change redraws it.
 */
export function signedRamp(v, neg = 'blue', pos = 'red') {
  const p = v.rgb('panel'), r = v.rgb(pos), b = v.rgb(neg);
  const col = (u) => { const t = Math.min(1, Math.abs(u)), q = u >= 0 ? r : b, w = Math.pow(t, 0.85); return [0, 1, 2].map((i) => p[i] + (q[i] - p[i]) * w); };
  return { col, key: p.join() + r.join() };
}

const BLACK = new Set([1, 3, 6, 8, 10]);
/** Piano keyboard between fLo and fHi on a frequency axis (cells halfway in log frequency between semitones); marks: Map midi → colour. */
export function keyboard(s, M, fLo, fHi, y0, y1, marks) {
  const m0 = Math.round(M.freqToMidi(fLo)), m1 = Math.round(M.freqToMidi(fHi));
  s.rect(fLo, y0, fHi, y1, { fill: 'panel', fillAlpha: 1, stroke: false });
  for (let m = m0; m <= m1; m++) {
    const a = Math.max(fLo, M.midiToFreq(m - 0.5)), b = Math.min(fHi, M.midiToFreq(m + 0.5));
    if (BLACK.has(M.mod(m, 12))) s.rect(a, y0 + (y1 - y0) * 0.32, b, y1, { fill: 'ink', fillAlpha: 0.72, stroke: false });
    if (marks && marks.has(m)) s.rect(a, y0, b, y1, { fill: marks.get(m), fillAlpha: 0.8, stroke: false });
    if (s.X(b) - s.X(a) >= 3.5) s.line(b, y0, b, y1, { color: 'faint', width: 0.7 });
  }
  s.rect(fLo, y0, fHi, y1, { color: 'muted', width: 1 });
}

/** Hann-windowed magnitude spectrum in dB (re the largest bin) of the last n samples of buf (n a power of two). */
export function spectrumDB(M, buf, n = 8192, sr = SR) {
  const s = Math.max(0, buf.length - n), x = new Array(n); let mean = 0;
  for (let i = 0; i < n; i++) mean += (buf[s + i] || 0) / n; // remove any DC offset first
  for (let i = 0; i < n; i++) x[i] = ((buf[s + i] || 0) - mean) * (0.5 - 0.5 * Math.cos((TAU * i) / n));
  const sp = M.spectrum(x, sr); let mx = 1e-20; for (const a of sp.amp) mx = Math.max(mx, a);
  return { freq: sp.freq, db: Array.from(sp.amp, (a) => 20 * Math.log10(a / mx + 1e-12)), df: sr / n };
}

/** Level (dB, from spectrumDB) of the strongest bin within ±w bins of frequency f, refined by a parabola. */
export function levelAt(S, f, w = 3) {
  const i0 = Math.round(f / S.df); let best = -Infinity, bi = i0;
  for (let i = Math.max(1, i0 - w); i <= Math.min(S.db.length - 2, i0 + w); i++) if (S.db[i] > best) { best = S.db[i]; bi = i; }
  return best;
}
