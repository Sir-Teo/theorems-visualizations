// Music Theory & Acoustics — Chapter 5 shared helpers (hearing).
// Plain named exports, imported by ch05.js and ch05-b.js. The sound and plotting helpers of chapter 4 are re-exported.

export { TAU, SR, noteOf, dB, playhead, finish, toRms, join, noiseGen, periodicLoop, partials, loopVoice, stft, drawSpec, specRamp } from './ch04.shared.js';
import { TAU, SR } from './ch04.shared.js';

// ---------------------------------------------------------------- frequency scales of the ear

/** Length of the human basilar membrane used with Greenwood's map (mm). */
export const BM_LEN = 35;

/** Greenwood (1990) place–frequency map for the human cochlea: characteristic frequency (Hz) at fractional distance xa from the apex. */
export const greenwood = (xa) => 165.4 * (10 ** (2.1 * xa) - 0.88);
/** Inverse of Greenwood's map: fractional distance from the apex of the place tuned to f. */
export const greenwoodInv = (f) => Math.log10(f / 165.4 + 0.88) / 2.1;
/** Characteristic frequency at x mm from the base (stapes), and the place (mm from the base) for a frequency. */
export const cfAt = (xmm) => greenwood(1 - xmm / BM_LEN);
export const placeOf = (f) => BM_LEN * (1 - greenwoodInv(f));

/** Equivalent rectangular bandwidth of the auditory filter (Glasberg & Moore 1990), Hz. */
export const erb = (f) => 24.7 * (4.37e-3 * f + 1);
/** ERB-number (Cams) of a frequency (Glasberg & Moore 1990). */
export const erbNumber = (f) => 21.4 * Math.log10(4.37e-3 * f + 1);
export const erbNumberInv = (E) => (10 ** (E / 21.4) - 1) / 4.37e-3;
/** Critical-band rate in Bark (Zwicker & Terhardt 1980). */
export const bark = (f) => 13 * Math.atan(7.6e-4 * f) + 3.5 * Math.atan((f / 7500) ** 2);
/** Inverse of bark() by bisection. */
export function barkInv(z) { let lo = 0, hi = 25000; for (let k = 0; k < 50; k++) { const m = (lo + hi) / 2; if (bark(m) < z) lo = m; else hi = m; } return (lo + hi) / 2; }
/** Critical bandwidth (Zwicker & Terhardt 1980), Hz. */
export const cbw = (f) => 25 + 75 * (1 + 1.4 * (f / 1000) ** 2) ** 0.69;

/** Power weighting of a rounded-exponential auditory filter roex(p) centred on fc (Patterson 1976; p = 4 fc / ERB). */
export function roex(f, fc) { const p = (4 * fc) / erb(fc), g = Math.abs(f - fc) / fc; return (1 + p * g) * Math.exp(-p * g); }

// ---------------------------------------------------------------- ISO 226:2003

/** Interpolate ys over fs linearly in log f (clamped at the ends). */
export function logInterp(fs, ys, f) {
  if (f <= fs[0]) return ys[0];
  if (f >= fs[fs.length - 1]) return ys[ys.length - 1];
  let i = 0; while (fs[i + 1] < f) i++;
  const w = Math.log(f / fs[i]) / Math.log(fs[i + 1] / fs[i]);
  return ys[i] + w * (ys[i + 1] - ys[i]);
}
/** ISO 226:2003, Table 1: frequencies, exponent α_f, magnitude L_U (dB) and threshold of hearing T_f (dB SPL), 20 Hz–12.5 kHz. */
export const ISO226 = {
  f: [20, 25, 31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000, 12500],
  af: [0.532, 0.506, 0.48, 0.455, 0.432, 0.409, 0.387, 0.367, 0.349, 0.33, 0.315, 0.301, 0.288, 0.276, 0.267, 0.259, 0.253, 0.25, 0.246, 0.244, 0.243, 0.243, 0.243, 0.242, 0.242, 0.245, 0.254, 0.271, 0.301],
  Lu: [-31.6, -27.2, -23, -19.1, -15.9, -13, -10.3, -8.1, -6.2, -4.5, -3.1, -2, -1.1, -0.4, 0, 0.3, 0.5, 0, -2.7, -4.1, -1, 1.7, 2.5, 1.2, -2.1, -7.1, -11.2, -10.7, -3.1],
  Tf: [78.5, 68.7, 59.5, 51.1, 44, 37.5, 31.5, 26.5, 22.1, 17.9, 14.4, 11.4, 8.6, 6.2, 4.4, 3, 2.2, 2.4, 3.5, 1.7, -1.3, -4.2, -6, -5.4, -1.5, 6, 12.6, 13.9, 12.3],
};
/** Threshold of hearing (dB SPL, ISO 226:2003 T_f, log-interpolated). */
export const thresholdQuiet = (f) => logInterp(ISO226.f, ISO226.Tf, f);
/** SPL (dB) of a pure tone of frequency f with loudness level `phon` (ISO 226:2003 formula). */
export function phonToSpl(f, phon) {
  const af = logInterp(ISO226.f, ISO226.af, f), Lu = logInterp(ISO226.f, ISO226.Lu, f), Tf = logInterp(ISO226.f, ISO226.Tf, f);
  const Af = 4.47e-3 * (10 ** (0.025 * phon) - 1.15) + (0.4 * 10 ** ((Tf + Lu) / 10 - 9)) ** af;
  return (10 / af) * Math.log10(Af) - Lu + 94;
}
/** Loudness level (phon) of a pure tone at SPL L (inverse of phonToSpl by bisection; 0 below threshold). */
export function splToPhon(f, L) {
  let lo = 0, hi = 130;
  if (L <= phonToSpl(f, lo)) return 0;
  for (let k = 0; k < 50; k++) { const m = (lo + hi) / 2; if (phonToSpl(f, m) < L) lo = m; else hi = m; }
  return (lo + hi) / 2;
}

// ---------------------------------------------------------------- the travelling wave

/**
 * Passive long-wave (WKB) model of the basilar-membrane travelling wave. The local resonance follows Greenwood's map,
 * ω_r(x) = 2π·cfAt(x); the partition impedance per unit mass is δω_r + i(ω − ω_r²/ω); the fluid gives k² = −iωK²/(that).
 * Returns n+1 samples from base (x = 0) to apex (x = 35 mm): {x, re, im, env} of the membrane velocity (complex, peak |v| = 1).
 */
export function travellingWave(f, n = 420, K = 3, delta = 0.12) {
  const w = TAU * f, xs = new Float64Array(n + 1), re = new Float64Array(n + 1), im = new Float64Array(n + 1), env = new Float64Array(n + 1);
  let ph = 0, dec = 0, pk = null, mx = 0;
  for (let i = 0; i <= n; i++) {
    const x = (BM_LEN * i) / n, wr = TAU * cfAt(x), Dr = delta * wr, Di = w - (wr * wr) / w, D2 = Dr * Dr + Di * Di;
    const ar = (-w * K * K * Di) / D2, ai = (-w * K * K * Dr) / D2, r = Math.hypot(ar, ai);
    const kr = Math.sqrt(Math.max(0, (r + ar) / 2)), ki = -Math.sqrt(Math.max(0, (r - ar) / 2));
    if (pk) { const dx = BM_LEN / n; ph += ((kr + pk[0]) / 2) * dx; dec += ((ki + pk[1]) / 2) * dx; }
    pk = [kr, ki];
    const km = Math.hypot(kr, ki), ka = Math.atan2(ki, kr), a = km ** 1.5 * Math.exp(dec), th = 1.5 * ka - ph;
    xs[i] = x; re[i] = a * Math.cos(th); im[i] = a * Math.sin(th); env[i] = a; if (a > mx) mx = a;
  }
  for (let i = 0; i <= n; i++) { re[i] /= mx; im[i] /= mx; env[i] /= mx; }
  return { x: xs, re, im, env, n };
}

// ---------------------------------------------------------------- filters

/**
 * Fourth-order gammatone filter (complex one-pole cascade) at centre fc with bandwidth 1.019·ERB, applied to x.
 * Returns {re, im} of the analytic output (unit gain at fc); |re + i·im| is the envelope.
 */
export function gammatone(x, fc, sr = SR) {
  const b = TAU * 1.019 * erb(fc), a = Math.exp(-b / sr), w = (TAU * fc) / sr, cr = a * Math.cos(w), ci = a * Math.sin(w), n = x.length;
  const R = [0, 0, 0, 0], I = [0, 0, 0, 0], g = 2 * (1 - a) ** 4, outR = new Float32Array(n), outI = new Float32Array(n);
  for (let k = 0; k < n; k++) {
    // demodulate-free form: y = c·y + in, stages in cascade (input real)
    let inR = x[k], inI = 0;
    for (let s = 0; s < 4; s++) { const yr = cr * R[s] - ci * I[s] + inR, yi = ci * R[s] + cr * I[s] + inI; R[s] = yr; I[s] = yi; inR = yr; inI = yi; }
    outR[k] = inR * g; outI[k] = inI * g;
  }
  return { re: outR, im: outI };
}

// ---------------------------------------------------------------- stereo playback (the runtime's sound API is mono)

/**
 * Play a stereo buffer (two Float32Arrays) through the viz's audio context. Returns {stop()}. Must be called from a user gesture.
 * Work-around: the runtime's v.sound() mixes to mono, so this primes it (to create the context) and then builds its own stereo source.
 */
export function stereo(v, L, R, sr = SR, o = {}) {
  const snd = v.sound();
  snd.tone(440, { gain: 0, duration: 0.01, attack: 0.002, release: 0.005 });
  const ac = snd.ctx; if (!ac || !L || !L.length) return { stop() {}, playing: false };
  try {
    const buf = ac.createBuffer(2, L.length, sr); buf.getChannelData(0).set(L); buf.getChannelData(1).set(R);
    const src = ac.createBufferSource(), g = ac.createGain(); src.buffer = buf; src.loop = !!o.loop; g.gain.value = o.gain ?? 0.7;
    src.connect(g); g.connect(ac.destination); src.start(ac.currentTime + 0.02);
    const voice = { playing: true, stop() { try { const t = ac.currentTime; g.gain.setTargetAtTime(0, t, 0.02); src.stop(t + 0.12); } catch { /* stopped */ } voice.playing = false; } };
    src.onended = () => { voice.playing = false; v.invalidate(); };
    if (v.onCleanup) v.onCleanup(() => voice.stop());
    return voice;
  } catch { return { stop() {}, playing: false }; }
}

// ---------------------------------------------------------------- small drawing helpers

/** Ticks for a log-frequency axis between lo and hi (Hz). */
export function fTicks(lo, hi, list = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000]) {
  return list.filter((f) => f >= lo * 0.999 && f <= hi * 1.001).map((f) => [f, f >= 1000 ? `${f / 1000}k` : String(f)]);
}

/** Pure-tone sum: parts = [[f, amp, phase?], …], dur seconds, with short linear fades. */
export function tones(parts, dur, sr = SR, fade = 0.02) {
  const n = Math.round(dur * sr), out = new Float32Array(n);
  for (const [f, a, p = 0] of parts) {
    if (!a || !(f > 0) || f > sr * 0.45) continue;
    const w = (TAU * f) / sr; for (let k = 0; k < n; k++) out[k] += a * Math.sin(w * k + p);
  }
  const F = Math.min(n >> 1, Math.round(fade * sr));
  for (let k = 0; k < F; k++) { const g = k / F; out[k] *= g; out[n - 1 - k] *= g; }
  return out;
}
