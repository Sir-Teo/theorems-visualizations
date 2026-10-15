// Music Theory & Acoustics — Chapter 4 shared helpers (timbre and spectrum).
// Plain named exports, imported by ch04.js and ch04-b.js. (Adapted from ch02.shared.js / ch03.shared.js, which are not imported.)

export const TAU = 2 * Math.PI;
export const SR = 44100;

/** Note name and cents offset of a frequency, e.g. "A4 −3 ¢" (M = v.M). */
export function noteOf(M, f, flats) {
  if (!(f > 0)) return '—';
  const m = M.freqToMidi(f), r = Math.round(m), d = Math.round((m - r) * 100);
  return M.noteName(r, flats ? { flats: true } : undefined) + (d ? ` ${d > 0 ? '+' : '−'}${Math.abs(d)} ¢` : '');
}

/** 20 log10 x, floored. */
export const dB = (x) => 20 * Math.log10(Math.max(Math.abs(x), 1e-12));

/**
 * A playhead that follows a sound for `dur` seconds and redraws the viz about 25 times a second
 * (sound only starts from a click, so the timer only runs after one). ph.t is the elapsed time, or null; ph.tag what is playing.
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

/** Scale a buffer (in place) to a given RMS (equal-loudness comparisons at the level of the waveform), then clip-protect. */
export function toRms(buf, rms = 0.18) {
  let s = 0; for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i];
  const r = Math.sqrt(s / Math.max(1, buf.length)), k = r > 0 ? rms / r : 0;
  for (let i = 0; i < buf.length; i++) buf[i] = Math.max(-0.99, Math.min(0.99, buf[i] * k));
  return buf;
}

/** Concatenate buffers with gaps of `gap` seconds. */
export function join(bufs, gap = 0.15, sr = SR) {
  const g = Math.round(gap * sr), out = new Float32Array(bufs.reduce((a, b) => a + b.length, 0) + g * Math.max(0, bufs.length - 1));
  let o = 0; bufs.forEach((b) => { out.set(b, o); o += b.length + g; });
  return out;
}

/** Deterministic white noise in [−1, 1] (mulberry32), so pictures are reproducible. */
export function noiseGen(seed = 7) {
  let a = seed >>> 0 || 1;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 2147483648 - 1; };
}

/**
 * A seamless loop of a periodic tone: harm = [[n, amp, phase], …] (cosine phase), fundamental ≈ f0. The loop holds a whole number
 * of periods, so the fundamental actually used is k·sr/N (within a cent of f0). Returns {buf, f}.
 */
export function periodicLoop(harm, f0, secs = 0.5, sr = SR) {
  const k = Math.max(1, Math.round(f0 * secs)), N = Math.max(2, Math.round((k * sr) / f0)), out = new Float32Array(N);
  for (const [n, a, ph] of harm) {
    if (!a || n * f0 > sr * 0.45) continue;
    const w = (TAU * n * k) / N;
    for (let i = 0; i < N; i++) out[i] += a * Math.cos(w * i + (ph || 0));
  }
  return { buf: out, f: (k * sr) / N };
}

/**
 * Sum of partials with their own envelopes: parts = [{f, a, ph?, env?(t) → gain, d? (exponential decay rate, 1/s)}].
 * opts: {sr, att (s, global linear attack), rel (s, global release at the end)}. Frequencies above 0.45·sr are skipped.
 */
export function partials(parts, dur, opts = {}) {
  const sr = opts.sr || SR, n = Math.round(dur * sr), out = new Float32Array(n);
  for (const p of parts) {
    if (!p.a || !(p.f > 0) || p.f > sr * 0.45) continue;
    const w = (TAU * p.f) / sr, c = Math.cos(w), s = Math.sin(w), r = Math.exp(-(p.d || 0) / sr);
    let x = p.a * Math.cos(p.ph || 0), y = p.a * Math.sin(p.ph || 0);
    if (p.env) {
      const step = 32; let g0 = p.env(0), g1 = p.env(step / sr);
      for (let k = 0; k < n; k++) {
        const j = k % step; if (j === 0 && k) { g0 = g1; g1 = p.env((k + step) / sr); }
        out[k] += x * (g0 + ((g1 - g0) * j) / step);
        const nx = (x * c - y * s) * r; y = (x * s + y * c) * r; x = nx;
      }
    } else {
      for (let k = 0; k < n; k++) { out[k] += x; const nx = (x * c - y * s) * r; y = (x * s + y * c) * r; x = nx; }
    }
  }
  const A = Math.round((opts.att ?? 0) * sr), R = Math.round((opts.rel ?? 0) * sr);
  if (A > 1) for (let k = 0; k < Math.min(A, n); k++) out[k] *= k / A;
  if (R > 1) for (let k = 0; k < Math.min(R, n); k++) out[n - 1 - k] *= k / R;
  return out;
}

/**
 * Sustained, seamless sample loop that can be re-made while a control is dragged (cross-fades, at most ~14 swaps a second).
 * api.start(buf, gain, sr), api.update(make, gain, sr) (only while playing), api.stop(), api.on.
 */
export function loopVoice(v) {
  let cur = null, last = 0, tid = 0;
  const swap = (buf, gain, sr) => { const nv = v.sound().samples(buf, sr || SR, { loop: true, gain: 0 }); if (nv.setGain) nv.setGain(gain); if (cur) cur.stop(0.06); cur = nv; last = performance.now(); };
  const api = {
    get on() { return !!cur && cur.playing; },
    start(buf, gain = 0.45, sr = SR) { api.stop(); swap(buf, gain, sr); },
    update(make, gain = 0.45, sr = SR) {
      if (!api.on) return;
      clearTimeout(tid);
      if (performance.now() - last > 70) swap(make(), gain, sr); else tid = setTimeout(() => { if (api.on) swap(make(), gain, sr); }, 75);
    },
    stop() { clearTimeout(tid); if (cur) cur.stop(0.08); cur = null; },
  };
  if (v.onCleanup) v.onCleanup(() => { clearTimeout(tid); });
  return api;
}

/** Magnitude of a two-pole resonance (analog, unit gain at 0 Hz) with centre F and bandwidth B (Hz) at frequency f. */
export function resonance(F, B, f) {
  const s = Math.PI * B, w = TAU * F, x = TAU * f, p2 = s * s + w * w;
  return p2 / Math.sqrt((s * s + (x - w) ** 2) * (s * s + (x + w) ** 2));
}

/** Bessel function J_n(x) of integer order, by the trapezoid rule on Bessel's integral (spectrally accurate). */
export function besselJ(n, x) {
  const N = Math.max(48, Math.ceil(Math.abs(x)) + 2 * Math.abs(n) + 32); let s = 0;
  for (let k = 0; k < N; k++) { const t = (Math.PI * (k + 0.5)) / N; s += Math.cos(n * t - x * Math.sin(t)); }
  return s / N;
}

/**
 * Short-time Fourier transform with a Hann window of `win` s and hop `hop` s, up to fmax Hz → {db, nT, nb, dt, df, max, t0}.
 * Frame f is centred at time t0 + f·dt.
 */
export function stft(M, x, sr = SR, o = {}) {
  const win = Math.max(8, Math.round((o.win ?? 0.03) * sr)), hop = Math.max(1, Math.round((o.hop ?? 0.005) * sr));
  let nfft = 64; while (nfft < win * (o.pad ?? 2)) nfft *= 2;
  const df = sr / nfft, nb = Math.min(nfft / 2, Math.ceil((o.fmax ?? 5000) / df) + 1), nT = Math.max(1, Math.ceil(x.length / hop));
  const w = new Float64Array(win); for (let j = 0; j < win; j++) w[j] = 0.5 - 0.5 * Math.cos((TAU * (j + 0.5)) / win);
  const db = new Float32Array(nT * nb), re = new Float64Array(nfft), im = new Float64Array(nfft); let max = -1e9;
  for (let f = 0; f < nT; f++) {
    re.fill(0); im.fill(0); const s0 = f * hop - (win >> 1);
    for (let j = 0; j < win; j++) { const k = s0 + j; if (k >= 0 && k < x.length) re[j] = x[k] * w[j]; }
    M.fft(re, im);
    for (let b = 0; b < nb; b++) { const d = 10 * Math.log10(re[b] * re[b] + im[b] * im[b] + 1e-14); db[f * nb + b] = d; if (d > max) max = d; }
  }
  return { db, nT, nb, dt: hop / sr, df, max };
}

/** Theme-aware colour ramp for spectrograms: panel → accent → ink as the level rises (t in [0, 1]). Returns {col, key}. */
export function specRamp(v, hot = 'accent') {
  const p = v.rgb('panel'), a = v.rgb(hot), k = v.rgb('ink');
  const col = (t) => {
    if (t <= 0.62) { const u = t / 0.62; return [0, 1, 2].map((i) => p[i] + (a[i] - p[i]) * u); }
    const u = (t - 0.62) / 0.38; return [0, 1, 2].map((i) => a[i] + (k[i] - a[i]) * u * 0.75);
  };
  return { col, key: p.join() + a.join() };
}

/** Draw a spectrogram S (from stft) on stage s with x = time (s, offset t0) and y = frequency (Hz, linear or log), `range` dB deep. */
export function drawSpec(v, s, S, o = {}) {
  const range = o.range ?? 60, lo = S.max - range, t0 = o.t0 ?? 0, R = specRamp(v, o.hot);
  s.raster((x, y) => {
    const fi = (x - t0) / S.dt, bi = y / S.df;
    if (fi < 0 || fi > S.nT - 1 || bi < 0 || bi > S.nb - 1) return null;
    const i0 = Math.floor(fi), b0 = Math.floor(bi), i1 = Math.min(i0 + 1, S.nT - 1), b1 = Math.min(b0 + 1, S.nb - 1), u = fi - i0, w = bi - b0;
    const d = (1 - u) * ((1 - w) * S.db[i0 * S.nb + b0] + w * S.db[i0 * S.nb + b1]) + u * ((1 - w) * S.db[i1 * S.nb + b0] + w * S.db[i1 * S.nb + b1]);
    return R.col(Math.min(1, Math.max(0, (d - lo) / range)));
  }, { key: `${o.key}|${R.key}`, res: o.res ?? 2, id: o.id });
}

/** Spectral centroid Σ f·A / Σ A of a harmonic amplitude list (amps[k] is harmonic k + 1) on fundamental f0. */
export function centroidOf(amps, f0 = 1) {
  let s = 0, w = 0; amps.forEach((a, k) => { s += (k + 1) * f0 * Math.abs(a); w += Math.abs(a); });
  return w ? s / w : 0;
}

/** Instrument names for the SHARC data below. */
export const INST = { flute: 'flute', oboe: 'oboe', clarinet: 'clarinet', bassoon: 'bassoon', horn: 'French horn', trumpet: 'trumpet in C', trombone: 'trombone', violin: 'violin', cello: 'cello', pizz: 'violin pizzicato' };

/**
 * Measured steady-state spectrum of one note: {f, n, amp (linear, loudest harmonic = 1), db, ph (cosine phases)}.
 * Data: G. J. Sandell, SHARC timbre database (1991–94, public domain), Fourier analyses of the McGill University Master Samples.
 */
export function sharc(inst, note = 'E4') {
  const r = SHARC[inst][note] || SHARC[inst].E4;
  if (!r._db) { r._db = r.db.split(' ').map(Number); r._ph = r.ph.split(' ').map(Number); r._amp = r._db.map((d) => 10 ** (d / 20)); }
  return { f: r.f, n: r._db.length, amp: r._amp, db: r._db, ph: r._ph };
}

/** All the notes of an instrument in the formant cloud: [{key (MIDI), f, db: [harmonic 1 …] re the loudest harmonic}], up to 5 kHz. */
export function cloud(inst) {
  return CLOUD[inst].split('|').map((row) => { const [k, rest] = row.split(':'); const key = +k; return { key, f: 440 * 2 ** ((key - 69) / 12), db: rest.split(' ').map((x) => -Number(x)) }; });
}

// ---- data: G. J. Sandell, SHARC timbre database, from the McGill University Master Samples (public domain).
// SHARC: for each note, the amplitude (here converted to dB re the loudest harmonic, 0.1 dB) and phase (radians) of every harmonic
// below 10 kHz in a steady-state stretch of the recording; trailing harmonics below −70 dB are dropped. Sounding pitch.
export const SHARC = {
  flute: { E4: { f: 329.63, db: '-2.5 0.0 -11.2 -13.0 -22.1 -28.3 -20.3 -41.8 -62.3 -39.4 -44.6 -53.1 -60.4 -63.7 -57.1 -54.2 -72.5 -73.5 -76.5 -66.2 -58.8 -65.2 -68.1 -73.0 -64.6 -59.3 -62.2 -72.2 -62.7', ph: '-1.17 -1.62 -2.01 2.68 0.25 -0.95 -2.97 -2.98 -0.3 -1.12 -2.61 2.81 0.64 -0.89 -1.23 -2.06 1.45 1.0 0.06 -1.57 0.77 1.01 -0.65 -1.76 -0.47 0.66 0.11 -2.81 1.85' }, A4: { f: 440.0, db: '0.0 -2.8 -17.1 -15.5 -19.5 -32.1 -40.7 -38.3 -45.4 -48.4 -53.9 -52.7 -58.5 -62.3 -61.7 -71.9 -75.7 -72.6 -60.5 -74.2 -66.9', ph: '2.17 0.41 0.72 3.01 -1.03 -1.5 -2.83 -1.21 2.18 -1.62 -0.13 2.16 -2.19 2.58 -2.06 -0.96 -3.01 -1.07 1.91 0.31 -2.58' }, C5: { f: 523.25, db: '0.0 -6.6 -19.0 -17.5 -32.5 -41.1 -54.4 -44.6 -49.1 -66.5 -64.3 -63.9 -58.1 -56.2 -57.2 -61.1 -67.2 -66.9', ph: '-1.88 -1.78 -0.55 -1.73 -0.75 -0.56 -2.95 2.03 0.46 -0.81 -0.64 1.4 0.19 2.88 2.27 0.27 2.76 1.87' } },
  oboe: { E4: { f: 329.63, db: '-7.0 -2.4 -5.5 0.0 -11.3 -33.7 -33.5 -25.8 -21.7 -35.8 -38.2 -42.3 -54.7 -43.4 -46.5 -46.1 -62.1 -57.4 -55.9 -54.3 -62.1 -55.2 -57.5 -67.7 -77.8 -72.4 -62.7 -58.0 -64.0', ph: '-1.91 -1.32 -0.83 -2.04 -3.04 -2.89 -3.04 -1.15 -0.16 -1.96 -2.21 0.98 1.21 -0.49 0.41 1.26 -2.5 2.15 2.64 2.11 2.63 1.71 3.14 -0.53 -2.16 -1.97 -2.3 -1.77 -1.13' }, A4: { f: 440.0, db: '-11.3 0.0 -6.0 -5.9 -20.7 -14.2 -23.6 -17.1 -30.3 -33.4 -25.2 -42.4 -50.1 -46.3 -56.9 -64.8 -57.1 -45.6 -49.6 -48.0 -54.7 -61.2', ph: '1.88 0.3 -1.98 -3.06 -2.23 -2.85 0.16 2.42 1.05 3.07 0.08 2.98 -0.74 0.82 2.05 1.93 -2.12 -3.01 1.13 0.79 -0.36 2.49' }, C5: { f: 523.25, db: '-8.2 0.0 -15.3 -6.8 -22.1 -6.6 -31.6 -21.1 -28.1 -30.5 -49.1 -42.9 -51.3 -45.0 -46.1 -44.2 -55.0 -46.9 -50.6', ph: '0.31 3.12 -0.1 -1.37 -0.6 -0.73 0.88 2.92 -2.58 -1.53 -2.77 -2.4 2.16 2.71 -0.95 -2.01 -2.24 1.23 -0.01' } },
  clarinet: { E4: { f: 329.63, db: '-3.1 -29.5 -3.8 -13.0 0.0 -28.9 -10.6 -17.6 -20.4 -21.5 -23.0 -18.2 -29.8 -23.5 -29.0 -44.3 -28.7 -44.5 -37.4 -64.2 -48.9 -48.8 -49.6 -52.9 -54.0 -59.7 -59.7 -58.1 -66.4 -69.5', ph: '1.63 1.27 2.48 0.67 0.66 0.78 -2.39 -1.51 2.24 -2.72 -0.76 1.06 -0.12 -1.72 0.03 2.97 -1.88 -1.61 1.18 -1.8 -0.66 -0.83 2.18 1.11 2.08 1.32 -1.12 -1.84 2.93 -2.0' }, A4: { f: 440.0, db: '0.0 -7.8 -2.3 -17.1 -27.3 -26.9 -23.4 -38.0 -37.6 -35.2 -40.0 -39.6 -43.7 -53.8 -71.5 -61.9 -61.3 -72.2 -66.0 -67.6 -59.3 -68.9', ph: '2.33 -0.92 -1.21 1.23 0.41 -2.91 -0.21 2.34 1.66 -2.58 -0.35 0.43 1.97 -1.12 -1.84 0.35 1.71 0.38 -0.29 2.64 -0.94 -1.72' }, C5: { f: 523.25, db: '0.0 -22.9 -16.5 -31.3 -22.0 -17.4 -26.9 -25.4 -49.8 -48.2 -44.6 -49.2 -45.9 -69.7 -61.2 -68.0 -65.1 -62.2 -63.2', ph: '1.34 -1.56 2.2 -0.82 -2.25 1.38 2.45 0.32 -1.78 0.86 0.13 -2.36 2.1 2.54 2.35 0.42 1.39 2.8 -1.2' } },
  bassoon: { E4: { f: 329.63, db: '-6.8 0.0 -11.2 -24.2 -29.6 -32.7 -44.8 -47.0 -54.2 -52.0 -55.8 -55.9 -56.2 -52.2 -54.2 -58.0 -63.6 -73.9 -64.9 -60.8 -75.0 -62.9 -78.3 -71.1 -63.3 -77.7 -68.2 -73.1 -68.2 -61.8', ph: '-0.72 -2.15 -0.81 2.99 0.71 -0.95 2.43 -1.99 0.79 2.56 0.17 1.16 -0.28 -2.78 0.49 2.36 -2.83 0.97 -1.42 1.11 -0.95 2.39 -0.07 -1.28 0.02 -0.88 1.93 0.11 2.62 1.1' } },
  horn: { E4: { f: 329.63, db: '0.0 -0.3 -7.1 -17.2 -23.8 -38.7 -49.3 -47.0 -52.8 -62.3 -66.0 -77.5 -75.2 -70.0 -78.6 -67.9 -67.6', ph: '2.48 0.9 -0.36 -2.15 2.65 1.12 0.87 0.28 -0.94 -1.95 -2.93 -2.91 -1.24 -0.86 -1.52 -2.53 -2.81' }, A4: { f: 440.0, db: '0.0 -8.6 -24.3 -38.9 -53.0 -51.1 -54.9 -52.7 -54.2 -57.9 -67.1 -61.8 -60.5 -63.8 -63.0 -74.3 -63.8 -65.5 -68.1 -65.0 -67.9 -67.5', ph: '-1.83 -1.13 -1.1 -0.9 -0.98 0.61 1.38 2.07 3.03 -2.68 -1.23 -0.22 0.55 1.66 2.54 -2.94 -2.03 -0.68 -0.68 0.3 0.67 0.69' }, C5: { f: 523.25, db: '0.0 -13.1 -32.3 -46.7 -61.5 -70.5 -57.0 -62.3 -61.7 -79.9 -64.9 -72.3 -80.8 -76.4 -68.0', ph: '-1.85 -0.62 -0.27 0.67 1.21 2.06 0.18 1.54 2.05 -0.94 -0.19 0.93 0.62 -0.34 0.1' } },
  trumpet: { E4: { f: 329.63, db: '-6.3 0.0 -3.1 -7.7 -5.1 -7.2 -9.9 -6.7 -7.5 -10.7 -17.2 -22.2 -24.8 -25.1 -27.7 -28.1 -29.5 -29.9 -32.7 -34.0 -37.4 -39.5 -41.4 -43.2 -46.3 -47.4 -47.0 -49.7 -50.6 -53.3', ph: '-2.74 0.26 2.38 -0.82 1.35 -2.35 0.18 2.72 -0.93 1.61 -1.88 0.59 -2.87 -0.46 2.12 -1.25 1.54 -1.99 0.81 -2.82 -0.05 2.66 -0.92 1.56 -2.03 0.42 3.02 -0.42 2.55 -0.93' }, A4: { f: 440.0, db: '0.0 -4.5 -5.0 -0.1 -3.9 -5.9 -9.7 -15.5 -18.9 -22.5 -25.5 -30.2 -30.7 -34.8 -39.5 -44.8 -48.8 -50.3 -53.5 -54.6 -58.1 -62.1', ph: '-1.05 -1.09 -2.28 2.9 1.54 -0.17 -1.1 -2.1 3.1 2.0 0.8 -0.13 -0.78 -1.75 -2.65 2.29 1.3 0.58 -0.1 -0.91 -2.42 2.44' }, C5: { f: 523.25, db: '-9.0 -0.4 0.0 -10.7 -8.1 -16.3 -19.3 -25.9 -26.7 -32.0 -35.7 -38.6 -45.3 -46.5 -46.6 -49.6 -53.5 -61.4 -54.9', ph: '0.27 1.11 1.25 2.34 1.16 1.49 1.71 1.91 2.42 2.18 2.83 3.02 -2.96 3.02 2.69 -2.75 -2.45 -2.13 1.62' } },
  trombone: { E4: { f: 329.63, db: '-4.8 0.0 -5.6 -12.2 -22.5 -29.9 -41.2 -42.3 -49.8 -56.1 -62.3 -60.7 -61.2 -62.5 -61.9 -63.3 -63.3 -65.1 -59.9 -64.7 -64.6 -70.4 -70.1 -76.8 -78.3 -67.2', ph: '-0.97 1.15 2.32 -2.82 -1.25 0.61 1.92 -2.57 -0.81 1.36 3.07 -2.6 -0.71 2.6 -1.26 1.46 -1.88 0.16 2.79 -0.99 2.18 -0.64 3.12 2.94 -2.57 2.62' } },
  violin: { E4: { f: 329.63, db: '-0.8 -2.6 -2.7 -5.2 -10.8 -12.1 0.0 -27.9 -10.1 -23.9 -9.2 -16.7 -19.2 -34.5 -43.7 -34.0 -32.0 -34.8 -30.5 -31.3 -50.5 -48.4 -37.9 -39.3 -50.3 -47.1 -46.1 -51.5 -57.0 -52.3', ph: '0.75 1.41 2.17 1.9 2.89 1.26 0.94 -1.03 -1.34 -3.01 -2.83 -1.05 0.91 -0.79 2.55 0.99 -0.63 1.79 -0.28 1.66 -1.48 2.11 -1.77 -0.15 0.2 2.69 -0.01 2.37 -2.58 -2.56' }, A4: { f: 440.0, db: '0.0 -23.0 -12.5 -14.5 -5.9 -27.2 -14.9 -17.2 -14.5 -32.6 -32.1 -40.0 -36.8 -32.8 -38.6 -33.4 -42.5 -41.5 -39.9 -40.2 -47.1 -36.4', ph: '1.5 -3.01 -1.85 -1.56 0.8 2.83 1.22 2.74 -1.69 2.47 -0.64 -0.7 3.01 2.01 1.06 -1.56 2.19 2.47 0.99 1.25 -2.34 2.64' }, C5: { f: 523.25, db: '-1.6 -1.1 0.0 -2.6 -19.6 -7.2 -12.4 -18.0 -29.8 -29.8 -33.4 -31.9 -31.2 -35.4 -41.3 -37.2 -38.6 -52.9 -42.8', ph: '-2.44 -1.67 -2.06 -1.05 -2.94 0.39 -2.78 -0.71 1.93 -2.82 0.02 2.88 -0.27 -1.15 -2.58 -1.35 -1.79 1.66 -0.72' } },
  cello: { E4: { f: 329.63, db: '-5.5 -2.0 -8.4 -2.4 0.0 -8.0 -16.1 -13.3 -14.6 -14.8 -12.2 -26.1 -24.8 -36.1 -22.2 -25.1 -42.7 -36.7 -28.6 -28.5 -29.2 -52.2 -39.6 -31.7 -33.7 -34.5 -36.6 -55.7 -42.1 -33.9', ph: '-2.22 1.48 3.03 1.03 0.13 3.07 1.63 -0.19 2.21 1.06 3.13 2.16 0.8 2.12 -0.07 -2.83 -2.17 3.0 -1.81 0.02 1.9 1.78 1.69 -1.79 -3.06 -2.73 1.28 -2.5 -1.88 1.57' } },
  pizz: { E4: { f: 329.63, db: '0.0 -9.7 -23.2 -20.4 -32.0 -34.8 -35.5 -44.8 -37.8 -38.4 -49.5 -58.2 -67.5 -73.6 -65.3 -70.7 -62.3 -64.2 -77.0 -68.6 -74.8 -72.2 -72.1 -74.2 -83.5 -74.6 -70.4 -69.9', ph: '-1.64 -2.07 -2.35 -1.06 -2.86 -0.35 -2.82 -2.54 3.12 0.65 -3.04 1.63 1.11 -3.12 0.64 -1.44 2.69 -0.01 0.63 0.81 -3.08 -2.82 2.12 1.73 -0.64 0.33 0.48 2.22' } },
};
// CLOUD: every note of five instruments, 'midi:−dB of harmonic 1 −dB of harmonic 2 …|…' (integer dB re the loudest harmonic, up to 5 kHz).
export const CLOUD = {
  bassoon: '23:13 14 11 6 8 13 8 14 0 9 6 14 13 13 13 16 20 17 23 25 32 41 31 27 37 27 36 21 27 31 39 29 33 35 32 46 35 39 44 44 38 43 43 44 42 41 48 44 53 44 52 42 43 46 42 43 44 44 43 43 43 40 50 56 46 43 43 45 44 45 46 44 43 43 49 44 46 46 46 47|24:7 5 5 0 1 2 8 12 2 4 7 6 8 16 23 36 27 23 15 24 19 14 18 15 37 27 24 30 32 36 34 41 50 49 41 47 54 45 44 42 49 49 41 49 43 55 39 53 41 48 46 50 46 51 49 57 53 50 61 57 54 51 52 50 49 53 51 51 52 53 52 56 54 56 52 55|26:9 7 8 1 0 8 5 15 13 16 33 22 30 46 48 44 32 40 34 28 36 43 44 54 45 42 41 46 49 58 70 58 58 63 70 67 80 54 55 61 59 58 67 48 62 59 57 69 59 61 63 64 68 59 67 63 66 62 64 64 60 59 60 56 55 54 56 58|28:11 11 7 5 2 4 13 0 24 13 27 26 30 30 27 39 23 18 21 40 40 41 43 41 44 55 47 58 54 71 56 70 58 60 58 67 56 69 58 70 61 66 61 67 62 63 63 71 65 63 60 66 63 60 60 62 63 67 75 64|29:8 8 3 0 1 3 7 15 10 23 26 29 30 20 33 27 21 30 43 49 51 46 45 47 56 63 64 59 59 57 63 59 60 70 58 55 59 61 64 68 66 62 60 66 73 59 71 71 64 65 61 62 65 70 63 58 59|31:14 13 8 13 0 8 30 21 41 23 24 33 21 28 32 39 47 36 35 41 48 42 38 47 58 66 57 59 62 66 60 61 63 64 66 77 60 75 68 64 67 64 65 76 78 69 70 67 71 68 64|33:18 20 10 0 11 14 42 26 21 21 23 36 33 33 49 38 36 47 48 52 67 56 72 65 64 61 67 53 68 66 68 64 69 63 64 67 66 68 80 75 76 66 68 63 67|35:11 9 2 0 17 15 15 14 16 15 19 39 38 30 28 38 50 41 43 45 45 58 66 59 53 56 61 56 55 55 47 55 50 64 59 65 61 58 60 63|36:11 6 0 2 10 25 13 13 30 28 27 40 31 30 42 50 54 47 57 56 63 58 67 68 64 54 62 53 66 71 48 66 67 67 60 60 69 67|38:14 7 0 8 12 18 26 30 26 39 46 43 43 48 49 80 54 54 66 70 55 74 57 60 58 52 56 55 61 62 56 72 64 60|40:16 6 0 10 24 22 35 29 35 38 35 45 55 50 49 51 59 68 71 57 57 61 55 57 57 68 67 63 60 56|41:12 0 0 10 15 14 17 19 25 32 39 45 48 49 44 44 51 56 53 59 56 42 43 50 50 56 59 57|43:10 0 5 17 37 39 22 28 41 44 47 49 57 71 64 55 58 65 69 65 67 71 63 58 70|45:19 0 14 26 18 33 38 38 42 56 61 61 58 56 72 63 80 66 65 60 64 69|47:8 0 17 13 19 39 34 41 42 54 58 61 62 63 76 54 64 58 62 60|48:3 0 21 13 26 31 34 58 47 55 60 59 54 50 57 62 60 57 64|50:0 1 13 30 33 39 53 47 61 60 54 47 46 52 54 57 56|52:7 0 11 24 30 33 45 47 54 52 56 56 56 52 54|53:9 0 19 22 27 35 49 60 54 59 55 55 65 78',
  horn: '26:20 14 9 4 1 0 0 2 2 4 5 7 9 9 10 11 14 15 15 16 17 19 20 22 23 27 30 33 37 34 35 37 39 39 37 37 39 40 41 41 40 41 42 43 45 46 46 51 56 57 53 52 53 51 54 57 61 60 63 63 66 65 64 70 71 68 67 71|28:23 14 7 4 0 0 1 2 4 5 8 9 9 11 13 15 15 16 18 18 20 22 24 28 33 36 32 34 36 36 35 34 35 36 39 40 39 40 41 41 41 43 47 48 46 44 46 46 49 50 51 54 55 56 54 56 57 60 58 61|29:19 11 4 2 0 0 1 2 3 5 7 7 9 13 15 16 18 20 21 24 25 27 32 42 41 43 43 42 42 43 44 44 46 46 49 50 51 52 54 55 55 55 59 62 67 68 75 69 70 61 67 64 66 69 73 80 64|31:19 10 4 2 0 1 2 3 4 6 8 11 15 16 20 20 23 26 30 35 41 41 41 48 49 49 48 49 48 51 53 55 53 54 58 58 64 65 59 56 54 62 62 54 53 59 58 58 62 62 64|33:15 6 2 0 0 2 3 4 6 8 12 16 16 19 22 24 28 33 37 38 40 44 41 44 46 50 52 52 52 53 58 62 66 62 62 74 72 77 78 64 79 74 80 80 74|35:13 4 2 0 2 3 5 7 8 12 15 17 20 24 28 33 40 37 41 42 42 45 46 49 52 52 54 55 59 62 56 62 64 73 69 70 73 75 76 80|36:13 3 0 0 2 3 6 7 10 14 17 19 21 25 33 41 42 44 45 45 50 49 53 52 54 57 58 61 62 65 66 63 63 74 74 73 71 75|38:9 2 0 1 2 5 7 12 17 18 22 25 28 36 38 42 44 48 52 54 58 70 61 58 60 62 63 66 67 72 68 78 75 72|40:10 2 0 4 7 9 13 19 20 25 30 38 41 46 48 50 51 52 54 56 66 80 65 71 71 67 80 80 80 80|41:9 1 0 3 8 11 16 20 25 30 37 48 49 53 54 53 55 57 64 69 75 65 80 77 78 78 75 79|43:9 0 2 6 10 14 19 23 30 40 50 50 54 55 59 63 64 61 63 63 73 68 68 68 80|45:8 0 2 7 11 17 19 25 33 42 45 44 48 54 55 59 63 69 68 68 73 72|47:5 0 4 11 16 21 29 37 43 48 50 54 58 59 64 62 72 66 70 73|48:3 0 4 9 16 21 30 46 50 48 55 62 67 75 68 76 66 69 73|50:3 0 5 11 19 26 41 49 45 50 55 57 58 65 60 66 64|52:0 0 7 17 24 39 49 47 53 62 66 78 75 70 79|53:0 0 7 14 20 33 44 40 45 48 53 58 68 69|55:0 5 15 25 43 54 54 66 68 72 71 80|57:0 9 24 39 53 51 55 53 54 58 67|59:0 12 24 39 55 61 61 59 67 69|60:0 13 32 47 61 70 57 62 62|62:0 17 34 46 62 60 69 72',
  trombone: '28:18 10 7 10 4 2 0 2 2 2 4 6 6 8 9 9 11 12 10 10 11 12 13 15 15 16 16 16 18 19 22 22 22 24 24 26 27 29 27 27 27 28 29 29 29 30 31 31 31 33 34 36 36 37 37 39 39 40 41 42|29:15 5 6 8 2 1 0 2 1 3 3 3 6 5 5 7 6 4 5 7 7 10 10 10 11 10 11 13 14 15 15 16 17 19 18 19 20 20 20 22 23 24 25 25 25 27 27 28 29 29 29 29 29 29 30 31 31|31:15 6 8 2 1 0 2 1 3 4 5 6 6 7 7 7 9 12 13 13 14 15 16 18 20 21 22 22 24 27 28 27 28 30 30 31 33 34 35 36 38 40 40 42 42 44 43 44 46 46 47|33:13 6 8 2 0 1 0 3 3 4 5 7 9 8 11 13 16 17 18 20 22 24 25 27 28 28 32 33 33 33 35 38 39 41 43 44 45 49 50 50 51 52 53 55 59|35:12 4 5 2 2 0 4 5 6 7 10 10 12 15 17 19 21 22 24 27 29 31 32 36 37 40 41 42 43 45 47 49 50 53 55 54 54 55 55 55|36:11 7 3 2 0 0 4 3 6 7 9 10 12 14 16 17 18 19 22 24 26 27 30 32 32 33 36 37 38 40 42 43 45 45 46 48 50 50|38:10 8 3 0 0 4 5 8 9 12 15 18 21 22 25 27 30 32 35 39 40 43 43 44 46 48 50 52 56 56 56 57 62 66|40:6 7 0 1 1 3 6 9 12 17 21 23 27 29 33 37 38 42 46 48 52 54 60 58 56 56 59 60 63 65|41:5 7 2 0 3 3 6 9 12 16 20 23 25 28 30 33 38 39 42 46 48 50 53 55 59 57 61 64|43:4 0 0 1 3 7 9 12 17 19 22 26 29 33 37 41 42 45 47 48 51 51 55 59 58|45:4 0 1 4 6 9 14 19 22 28 32 35 39 42 47 51 55 56 58 57 58 60|47:5 0 0 6 7 13 16 20 25 28 33 37 41 44 49 53 57 60 63 64|48:4 0 0 4 6 13 20 23 27 32 37 42 46 54 59 64 72 66 58|50:7 0 3 6 13 22 25 30 36 42 45 47 54 56 57 56 57|52:5 0 6 12 22 30 41 42 50 56 62 61 61 63 62|53:7 0 5 11 19 25 31 40 47 63 63 72 65 62|55:1 0 9 17 23 29 37 43 47 51 53 65|57:0 0 8 18 26 33 41 50 53 60 55|59:0 5 12 20 28 38 48 54 53 54|60:0 4 9 17 26 36 39 43 45|62:0 11 19 26 38 48 56 56',
  clarinet: '38:0 24 3 13 3 8 11 15 13 14 26 21 24 33 31 32 43 32 40 41 37 45 41 38 45 37 54 48 45 50 50 50 59 54|40:0 36 9 29 11 28 5 17 12 21 30 27 23 24 22 31 22 36 32 32 24 25 36 32 52 39 62 36 51 36|41:0 44 9 33 13 49 5 12 15 22 18 26 17 32 28 25 23 20 21 24 37 39 46 54 49 49 55 38|43:0 40 9 32 17 15 13 24 21 20 30 31 37 32 40 28 34 32 43 52 49 48 67 53 56|45:0 42 6 28 9 21 9 14 16 20 21 23 27 22 32 28 33 25 31 46 42 42|47:0 35 9 27 11 19 11 22 23 20 32 26 14 22 30 41 43 33 48 40|48:0 34 5 27 8 17 6 28 20 24 29 22 29 27 42 31 39 42 46|50:2 28 3 20 0 6 12 13 16 20 17 17 19 28 21 23 28|52:3 29 4 13 0 29 11 18 20 22 23 18 30 24 29|53:10 29 4 11 0 16 12 24 8 16 21 25 32 37|55:13 23 2 0 10 14 14 6 17 27 17 27|57:0 8 2 17 27 27 23 38 38 35 40|59:0 18 0 2 9 5 18 24 31 26|60:0 23 16 31 22 17 27 25 50|62:0 9 9 26 18 22 29 25|64:0 15 6 12 9 18 35|65:0 9 18 26 17 33 29|67:0 9 12 6 19 41|69:0 11 11 17 42|71:12 0 24 23 25|72:0 1 16 27|74:0 4 8 17',
  oboe: '47:7 16 3 4 0 5 19 41 30 32 34 16 23 24 27 30 28 36 40 42|48:5 17 6 1 0 7 25 22 17 20 21 21 25 47 41 51 36 41 51|50:5 3 6 0 11 18 35 30 20 16 21 28 33 47 39 41 42|52:7 2 5 0 11 34 34 26 22 36 38 42 55 43 46|53:1 1 0 5 6 23 19 21 26 25 39 43 47 37|55:8 4 0 7 15 26 13 21 31 33 37 55|57:11 0 6 6 21 14 24 17 30 33 25|59:7 0 21 21 25 12 21 25 22 39|60:8 0 15 7 22 7 32 21 28|62:3 0 22 26 13 22 39 33|64:6 0 26 23 31 37 36|65:7 0 28 24 25 43 42|67:0 5 17 12 15 67|69:0 1 20 21 26|71:0 12 16 26 27|72:0 11 6 12|74:0 6 5 16|76:0 26 19|77:7 4 0',
};
