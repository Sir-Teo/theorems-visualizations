// Linguistics & Language — Chapter 1: Phonetics: the sounds of speech (part b: items 1.9–1.15)
// The synthesizer and spectrogram helpers below are the same as in ch01.js (part files cannot import).

// ---------- shared helpers: a formant synthesizer, spectra and spectrograms ----------
// Every sound in this chapter is computed here, sample by sample: a glottal pulse train (or noise) is passed
// through digital resonators (Klatt's cascade formant synthesizer, 1980) and played on a click.
const SR = 16000; // synthesis sample rate (Hz): speech needs little above 7 kHz
const C_TRACT = 35000; // speed of sound in the warm, humid air of the vocal tract (cm/s)
/** Deterministic white noise in [−1, 1] (mulberry32), so pictures are reproducible. */
function noiseGen(seed) {
  let a = seed >>> 0 || 1;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 2147483648 - 1; };
}
/** Piecewise-linear function of time through [[t, value], …], held constant beyond the ends. */
function ramp(pts) {
  return (t) => {
    if (t <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) { const [t0, a] = pts[i - 1], [t1, b] = pts[i]; return t1 > t0 ? a + ((b - a) * (t - t0)) / (t1 - t0) : b; }
    return pts[pts.length - 1][1];
  };
}
/** Coefficients [A, B, C] of Klatt's digital resonator y[n] = A x[n] + B y[n−1] + C y[n−2] (unit gain at 0 Hz). */
function resCoef(F, BW) {
  const T = 1 / SR, C = -Math.exp(-2 * Math.PI * BW * T), B = 2 * Math.exp(-Math.PI * BW * T) * Math.cos(2 * Math.PI * F * T);
  return [1 - B - C, B, C];
}
/** Gain of that resonator at frequency f (exact for the digital filter). */
function resGain(F, BW, f) {
  const [A, B, C] = resCoef(F, BW), w = (2 * Math.PI * f) / SR;
  return A / Math.hypot(1 - B * Math.cos(w) - C * Math.cos(2 * w), B * Math.sin(w) + C * Math.sin(2 * w));
}
/** Gain of the cascade of formant resonators (F, B arrays) at f. */
function tractGain(F, B, f) { let g = 1; for (let k = 0; k < F.length; k++) g *= resGain(F[k], B[k], f); return g; }
const dB = (x) => 20 * Math.log10(Math.max(x, 1e-12));
const BW5 = [70, 95, 130, 200, 280]; // default formant bandwidths (Hz)
const FHI = [3500, 4500]; // F4, F5 (Hz)
/** Glottal flow derivative over one cycle (phase φ in [0, 1)), open quotient oq: d/dφ of the KLGLOTT88 pulse 6.75·x²(1−x), x = φ/oq. */
const glotDeriv = (ph, oq) => (ph < oq ? (6.75 / oq) * (2 * (ph / oq) - 3 * (ph / oq) ** 2) : 0);
/**
 * Klatt-style cascade formant synthesizer. par(t) gives the controls at time t (s), refreshed every millisecond:
 * {f0, av (voicing), ah (aspiration, through the formants), af (frication), F: [F1…], B: [B1…], ff, fb (frication peak and
 * bandwidth), oq (open quotient), nz (nasal zero frequency; a nasal pole at 270 Hz is added when set), lp (low-pass of the
 * voicing: a "voice bar" radiated through closed lips)}. The pulse's closing jump is band-limited (polyBLEP), so the source
 * does not alias. Returns a Float32Array at SR.
 */
function synth(par, dur, o = {}) {
  const n = Math.max(1, Math.round(dur * SR)), out = new Float32Array(n), rnd = noiseGen(o.seed ?? 7), rnd2 = noiseGen((o.seed ?? 7) + 101);
  const NF = 5, cA = new Float64Array(NF), cB = new Float64Array(NF), cC = new Float64Array(NF), y1 = new Float64Array(NF), y2 = new Float64Array(NF);
  let ph = 0, q = null, nF = 0, jit = 1, pA = 1, pB = 0, pC = 0, py1 = 0, py2 = 0, zA = 1, zB = 0, zC = 0, zx1 = 0, zx2 = 0;
  let fA = 0, fB = 0, fC = 0, fy1 = 0, fy2 = 0, fx1 = 0, lpY = 0;
  const jitAmt = o.jitter ?? 0.005;
  for (let i = 0; i < n; i++) {
    if (i % 16 === 0) {
      q = par(i / SR); nF = Math.min(NF, q.F.length);
      for (let k = 0; k < nF; k++) { const c = resCoef(Math.min(q.F[k], SR / 2 - 200), q.B[k]); cA[k] = c[0]; cB[k] = c[1]; cC[k] = c[2]; }
      if (q.nz) { [pA, pB, pC] = resCoef(270, 100); const z = resCoef(q.nz, 120); zA = 1 / z[0]; zB = -z[1] / z[0]; zC = -z[2] / z[0]; }
      if (q.af > 0) [fA, fB, fC] = resCoef(Math.min(q.ff ?? 4000, SR / 2 - 300), q.fb ?? 1500);
    }
    // glottal source: flow derivative, one pulse per period
    const f0 = Math.max(40, q.f0 * jit), dt = f0 / SR, oq = q.oq ?? 0.6;
    let e = 0;
    if (q.av > 0) {
      e = glotDeriv(ph, oq);
      const d = ph - oq, J = 6.75 / oq;
      if (d >= 0 && d < dt) { const t = d / dt; e += (J / 2) * (2 * t - t * t - 1); } else if (d < 0 && d > -dt) { const t = d / dt; e += (J / 2) * (t * t + 2 * t + 1); }
      e *= 0.1 * q.av;
    }
    if (q.lp) { lpY += (1 - q.lp) * (e - lpY); e = lpY * (1 + 5 * q.lp); }
    ph += dt; if (ph >= 1) { ph -= 1; jit = 1 + jitAmt * rnd2(); }
    let s = e + (q.ah > 0 ? q.ah * 0.35 * rnd() : 0);
    for (let k = 0; k < nF; k++) { const y = cA[k] * s + cB[k] * y1[k] + cC[k] * y2[k]; y2[k] = y1[k]; y1[k] = y; s = y; }
    if (q.nz) { const yz = zA * s + zB * zx1 + zC * zx2; zx2 = zx1; zx1 = s; const yp = pA * yz + pB * py1 + pC * py2; py2 = py1; py1 = yp; s = yp; }
    let fr = 0;
    if (q.af > 0) { const x = q.af * rnd(); const y = fA * x + fB * fy1 + fC * fy2; fy2 = fy1; fy1 = y; fr = (y - fx1) * 2.2; fx1 = y; }
    out[i] = s + fr;
  }
  return out;
}
/** Scale a buffer to peak `pk` (in place) and fade its ends over `t` seconds (t = 0 for loops). */
function normalise(buf, pk = 0.9, t = 0.012) {
  let m = 0; for (let i = 0; i < buf.length; i++) m = Math.max(m, Math.abs(buf[i]));
  const k = m > 0 ? pk / m : 0, nf = Math.min(Math.floor(t * SR), buf.length >> 1);
  for (let i = 0; i < buf.length; i++) buf[i] *= k;
  for (let i = 0; i < nf; i++) { const g = i / nf; buf[i] *= g; buf[buf.length - 1 - i] *= g; }
  return buf;
}
/** Short-time Fourier transform (Hann window `win` s, hop `hop` s, pre-emphasis 0.95) up to fmax Hz → {db, nT, nb, dt, df, max}. */
function stft(M, x, o = {}) {
  const win = Math.round((o.win ?? 0.006) * SR), hop = Math.max(1, Math.round((o.hop ?? 0.0025) * SR));
  let nfft = 256; while (nfft < win * 2) nfft *= 2; nfft = Math.max(nfft, o.nfft ?? 512);
  const df = SR / nfft, nb = Math.min(nfft / 2, Math.ceil((o.fmax ?? 5000) / df) + 1), nT = Math.ceil(x.length / hop);
  const w = new Float64Array(win); for (let j = 0; j < win; j++) w[j] = 0.5 - 0.5 * Math.cos((2 * Math.PI * (j + 0.5)) / win);
  const db = new Float32Array(nT * nb), re = new Float64Array(nfft), im = new Float64Array(nfft); let max = -1e9;
  for (let f = 0; f < nT; f++) {
    re.fill(0); im.fill(0); const s0 = f * hop - (win >> 1);
    for (let j = 0; j < win; j++) { const k = s0 + j; if (k > 0 && k < x.length) re[j] = (x[k] - 0.95 * x[k - 1]) * w[j]; }
    M.fft(re, im);
    for (let b = 0; b < nb; b++) { const d = 10 * Math.log10(re[b] * re[b] + im[b] * im[b] + 1e-14); db[f * nb + b] = d; if (d > max) max = d; }
  }
  return { db, nT, nb, dt: hop / SR, df, max };
}
/** Draw a spectrogram as ink on the panel (dark = loud), `range` dB deep, time offset t0 (s); cached by `key`. */
function drawSpec(s, S, ink, o = {}) {
  const range = o.range ?? 60, lo = S.max - range, t0 = o.t0 ?? 0;
  s.raster((x, y) => {
    const fi = (x - t0) / S.dt, bi = y / S.df;
    if (fi < 0 || fi > S.nT - 1 || bi < 0 || bi > S.nb - 1) return null;
    const i0 = Math.floor(fi), b0 = Math.floor(bi), i1 = Math.min(i0 + 1, S.nT - 1), b1 = Math.min(b0 + 1, S.nb - 1), u = fi - i0, w = bi - b0;
    const d = (1 - u) * ((1 - w) * S.db[i0 * S.nb + b0] + w * S.db[i0 * S.nb + b1]) + u * ((1 - w) * S.db[i1 * S.nb + b0] + w * S.db[i1 * S.nb + b1]);
    const a = Math.min(1, Math.max(0, (d - lo) / range));
    return a < 0.03 ? null : [ink[0], ink[1], ink[2], Math.round(255 * Math.pow(a, 1.25))];
  }, { key: o.key, res: o.res ?? 2, id: o.id });
}
/** Steady-state single period (P samples, f0 = SR/P) of a vowel: loops seamlessly and gives exact harmonics by DFT. */
function vowelPeriod(F, B, P, o = {}) {
  const f0 = SR / P, reps = Math.ceil(0.25 * f0) + 1;
  const buf = synth(() => ({ f0, av: o.av ?? 1, ah: 0, af: 0, F, B, oq: o.oq, nz: o.nz }), (reps * P) / SR, { jitter: 0 });
  return buf.slice(buf.length - P);
}
/** Harmonic amplitudes (dB) of one period: entry k is harmonic k (k ≥ 1). */
function harmonicsDb(M, per) {
  const { re, im } = M.fftReal(per), n = per.length, out = [];
  for (let k = 0; k <= n / 2; k++) out.push(dB((2 * Math.hypot(re[k], im[k])) / n));
  return out;
}
/** Sustained, seamless vowel loop that can be re-made while a handle is dragged (cross-fades, at most ~14 swaps/s). */
function loopVoice(v) {
  let cur = null, last = 0, tid = 0;
  const swap = (buf, gain) => { const nv = v.sound().samples(buf, SR, { loop: true, gain: 0 }); if (nv.setGain) nv.setGain(gain); if (cur) cur.stop(0.06); cur = nv; last = performance.now(); };
  const api = {
    get on() { return !!cur && cur.playing; },
    start(buf, gain = 0.45) { api.stop(); swap(buf, gain); },
    update(make, gain = 0.45) {
      if (!api.on) return;
      clearTimeout(tid);
      if (performance.now() - last > 70) swap(make(), gain); else tid = setTimeout(() => { if (api.on) swap(make(), gain); }, 75);
    },
    stop() { clearTimeout(tid); if (cur) cur.stop(0.08); cur = null; },
  };
  if (v.onCleanup) v.onCleanup(() => { clearTimeout(tid); });
  return api;
}
/** A playhead that follows a sound for `dur` seconds and redraws ~25 times a second (only ever started from a click). */
function playhead(v) {
  let t0 = 0, dur = 0, id = 0;
  const stop = () => { if (id) clearInterval(id); id = 0; dur = 0; v.invalidate(); };
  if (v.onCleanup) v.onCleanup(() => { if (id) clearInterval(id); id = 0; });
  return {
    start(d) { if (id) clearInterval(id); t0 = performance.now(); dur = d; id = setInterval(() => { if (performance.now() - t0 > dur * 1000 + 80) stop(); else v.invalidate(); }, 40); v.invalidate(); },
    stop,
    get t() { return dur ? (performance.now() - t0) / 1000 : null; },
  };
}

// ---------- a rule synthesizer for syllables: phones → parameter tracks → synth ----------
/** Vowel formant targets F1–F3 (Hz, adult male; Peterson & Barney 1952 for English vowels, cardinal values otherwise). */
const VF = {
  i: [270, 2290, 3010], ɪ: [390, 1990, 2550], e: [400, 2100, 2700], ɛ: [530, 1840, 2480], æ: [660, 1720, 2410], a: [750, 1300, 2500], ɑ: [730, 1090, 2440],
  ɔ: [570, 840, 2410], o: [450, 800, 2500], ʊ: [440, 1020, 2240], u: [300, 870, 2240], ʌ: [640, 1190, 2390], ə: [500, 1500, 2500], y: [260, 1900, 2350],
};
/** Places of articulation: front-cavity length lf (cm, lips to constriction) and formant loci [F1, F2, F3] for transitions. */
const PL = {
  bilabial: { lf: 0, loc: [220, 800, 2200] }, labiodental: { lf: 0.4, loc: [220, 1000, 2300] }, dental: { lf: 1.0, loc: [220, 1600, 2600] },
  alveolar: { lf: 1.6, loc: [220, 1800, 2700] }, postalveolar: { lf: 2.6, loc: [220, 2000, 2500] }, retroflex: { lf: 3.0, loc: [260, 1700, 1800] },
  palatal: { lf: 3.6, loc: [220, 2300, 3000] }, velar: { lf: 6.0, loc: null }, uvular: { lf: 8.0, loc: [450, 1200, 2400] },
  pharyngeal: { lf: 11, loc: [750, 1100, 2400] }, glottal: { lf: 17, loc: null }, 'labial-velar': { lf: 0, loc: [250, 700, 2200] },
};
/** Consonants: [place, manner, voiced]. */
const CONS = {
  p: ['bilabial', 'plosive', 0], b: ['bilabial', 'plosive', 1], t: ['alveolar', 'plosive', 0], d: ['alveolar', 'plosive', 1], ʈ: ['retroflex', 'plosive', 0], ɖ: ['retroflex', 'plosive', 1],
  c: ['palatal', 'plosive', 0], ɟ: ['palatal', 'plosive', 1], k: ['velar', 'plosive', 0], ɡ: ['velar', 'plosive', 1], q: ['uvular', 'plosive', 0], ɢ: ['uvular', 'plosive', 1], ʔ: ['glottal', 'plosive', 0],
  m: ['bilabial', 'nasal', 1], ɱ: ['labiodental', 'nasal', 1], n: ['alveolar', 'nasal', 1], ɳ: ['retroflex', 'nasal', 1], ɲ: ['palatal', 'nasal', 1], ŋ: ['velar', 'nasal', 1], ɴ: ['uvular', 'nasal', 1],
  ʙ: ['bilabial', 'trill', 1], r: ['alveolar', 'trill', 1], ʀ: ['uvular', 'trill', 1], ⱱ: ['labiodental', 'tap', 1], ɾ: ['alveolar', 'tap', 1], ɽ: ['retroflex', 'tap', 1],
  ɸ: ['bilabial', 'fricative', 0], β: ['bilabial', 'fricative', 1], f: ['labiodental', 'fricative', 0], v: ['labiodental', 'fricative', 1], θ: ['dental', 'fricative', 0], ð: ['dental', 'fricative', 1],
  s: ['alveolar', 'fricative', 0], z: ['alveolar', 'fricative', 1], ʃ: ['postalveolar', 'fricative', 0], ʒ: ['postalveolar', 'fricative', 1], ʂ: ['retroflex', 'fricative', 0], ʐ: ['retroflex', 'fricative', 1],
  ç: ['palatal', 'fricative', 0], ʝ: ['palatal', 'fricative', 1], x: ['velar', 'fricative', 0], ɣ: ['velar', 'fricative', 1], χ: ['uvular', 'fricative', 0], ʁ: ['uvular', 'fricative', 1],
  ħ: ['pharyngeal', 'fricative', 0], ʕ: ['pharyngeal', 'fricative', 1], h: ['glottal', 'fricative', 0], ɦ: ['glottal', 'fricative', 1], ɬ: ['alveolar', 'latfric', 0], ɮ: ['alveolar', 'latfric', 1],
  ʋ: ['labiodental', 'approx', 1], ɹ: ['alveolar', 'approx', 1], ɻ: ['retroflex', 'approx', 1], j: ['palatal', 'approx', 1], ɰ: ['velar', 'approx', 1], w: ['labial-velar', 'approx', 1],
  l: ['alveolar', 'latapprox', 1], ɭ: ['retroflex', 'latapprox', 1], ʎ: ['palatal', 'latapprox', 1], ʟ: ['velar', 'latapprox', 1],
};
/** Formant targets of approximants (Hz). */
const APPROX = { ʋ: [300, 1100, 2300], ɹ: [350, 1100, 1550], ɻ: [380, 1300, 1700], j: [280, 2200, 3000], ɰ: [320, 1300, 2400], w: [300, 650, 2200], l: [360, 1150, 2700], ɭ: [380, 1250, 2000], ʎ: [300, 2050, 2900], ʟ: [380, 1000, 2400] };
const NASALZ = { bilabial: 1100, labiodental: 1200, alveolar: 1700, retroflex: 1700, palatal: 2200, velar: 2800, uvular: 2500 };
/** Noise spectrum of a burst or fricative at a place: one resonance of the front cavity, c/4L (flat and weak when the cavity is tiny). */
function noiseShape(pl) {
  const lf = pl.lf;
  if (lf < 1.2) return { ff: lf < 0.2 ? 1800 : 6500, fb: lf < 0.2 ? 5000 : 6000, amp: lf < 0.2 ? 0.45 : 0.35 };
  const ff = Math.min(7000, C_TRACT / (4 * lf));
  return { ff, fb: Math.max(320, 0.3 * ff), amp: 1 };
}
/**
 * Coarticulated consonant formants next to vowel V: locus + k·(vowel − locus), k = 0.42 for F2 unless given. Velars have a
 * vowel-dependent locus (F2 and F3 pinch together); with an explicit k they use two loci, 3000 Hz before front vowels and
 * 1500 Hz before back ones (Delattre, Liberman & Cooper 1955).
 */
function onsetF(pl, V, k) {
  if (!pl.loc) {
    if (pl.lf > 16) return V.slice(); // glottal: the vowel's own formants
    const f2 = k == null ? 0.85 * V[1] + 600 : (V[1] > 1600 ? 3000 : 1500) * (1 - k) + k * V[1];
    return [230, f2, Math.max(V[2] - 150, f2 + 180)];
  }
  const k2 = k ?? 0.42;
  return [pl.loc[0] + 0.15 * (V[0] - pl.loc[0]), pl.loc[1] + k2 * (V[1] - pl.loc[1]), pl.loc[2] + 0.5 * (V[2] - pl.loc[2])];
}
/**
 * Synthesize a phone string, e.g. speak(['a', 'b', 'a']) or speak([['a', 0.2], {pl, mn, vc}, 'a'], {vot: 0.06}).
 * A phone is a vowel symbol, a consonant symbol, or an object {pl: {lf, loc}, mn, vc, sym}. Options: vot (s, for stops),
 * f0 (function of t), seed. Returns {buf, dur, segs (with t0, t1 and the release time tr of stops), tracks}.
 */
function speak(list, o = {}) {
  const DUR = { plosive: 0.075, nasal: 0.075, trill: 0.09, tap: 0.024, fricative: 0.13, latfric: 0.13, approx: 0.07, latapprox: 0.07 };
  const segs = list.map((x) => {
    let p = x, d = null; if (Array.isArray(x)) [p, d] = x;
    if (typeof p === 'string' && VF[p]) return { sym: p, V: VF[p], d: d ?? 0.17 };
    const c = typeof p === 'string' ? { sym: p, pl: PL[CONS[p][0]], plName: CONS[p][0], mn: CONS[p][1], vc: CONS[p][2] } : { ...p };
    return { ...c, d: d ?? (c.sym === 'h' || c.sym === 'ɦ' ? 0.08 : DUR[c.mn]) };
  });
  let t = o.lead ?? 0.05; for (const s of segs) { s.t0 = t; t += s.d; s.t1 = t; }
  const dur = t + (o.tail ?? 0.05), N = Math.ceil(dur * 1000) + 2, arr = () => new Float32Array(N);
  const tr = { av: arr(), ah: arr(), af: arr(), ff: arr().fill(4000), fb: arr().fill(1500), lp: arr(), nz: arr(), b1: arr().fill(BW5[0]), b2: arr().fill(BW5[1]), b3: arr().fill(BW5[2]) };
  const fill = (a, ta, tb, val) => { for (let i = Math.max(0, Math.round(ta * 1000)); i < Math.min(N, Math.round(tb * 1000)); i++) a[i] = val; };
  const nearV = (i) => { for (let k = 1; k < segs.length; k++) { if (segs[i + k]?.V) return segs[i + k].V; if (segs[i - k]?.V) return segs[i - k].V; } return VF.ə; };
  // formant keyframes
  const kf = [[], [], []];
  segs.forEach((s, i) => {
    let tgt, a = s.t0, b = s.t1;
    if (s.V) { tgt = s.V; const pc = segs[i - 1], nc = segs[i + 1]; a += pc ? (pc.V ? 0.03 : pc.mn === 'approx' || pc.mn === 'latapprox' ? 0.06 : 0.045) : 0; b -= nc ? (nc.V ? 0.03 : 0.04) : 0; if (b < a) a = b = (s.t0 + s.t1) / 2; }
    else if (s.mn === 'approx' || s.mn === 'latapprox') { tgt = APPROX[s.sym] || onsetF(s.pl, nearV(i), s.k); a = b = (s.t0 + s.t1) / 2; }
    else if (s.mn === 'nasal') { tgt = onsetF(s.pl, nearV(i), s.k); tgt = [260, tgt[1], tgt[2]]; }
    else tgt = onsetF(s.pl, nearV(i), s.k);
    for (let k = 0; k < 3; k++) { kf[k].push([a, tgt[k]]); if (b > a) kf[k].push([b, tgt[k]]); }
  });
  const Ff = kf.map((k) => ramp(k));
  // sources: vowels first, consonants then override their own span (and the aspiration they push into the vowel)
  segs.forEach((s) => { if (s.V) fill(tr.av, s.t0, s.t1, 1); });
  segs.forEach((s, i) => {
    if (s.V) return;
    const nx = segs[i + 1], ns = noiseShape(s.pl);
    if (s.mn === 'plosive') {
      const glottal = s.pl.lf > 16, vot = o.vot ?? (glottal ? 0 : s.vc ? 0.012 : 0.055);
      fill(tr.av, s.t0, s.t1, 0);
      if (s.vc && o.vot == null) { fill(tr.av, s.t0, s.t1, 0.55); fill(tr.lp, s.t0, s.t1, 0.93); }
      if (vot < 0) { fill(tr.av, s.t1 + vot, s.t1, 0.55); fill(tr.lp, s.t1 + vot, s.t1, 0.93); }
      s.tr = s.t1;
      if (!glottal) { fill(tr.af, s.t1, s.t1 + 0.006, (s.pl.lf < 0.2 ? 0.25 : 0.6) * ns.amp); fill(tr.ff, s.t1, s.t1 + 0.006, ns.ff); fill(tr.fb, s.t1, s.t1 + 0.006, ns.fb); }
      if (vot > 0.004 && nx) { fill(tr.av, s.t1, s.t1 + vot, 0); fill(tr.ah, s.t1 + 0.005, s.t1 + vot, 0.55); fill(tr.b1, s.t1, s.t1 + vot, 320); }
    } else if (s.mn === 'nasal') {
      fill(tr.av, s.t0, s.t1, 0.8); fill(tr.nz, s.t0, s.t1, NASALZ[s.plName] || 1700); fill(tr.b2, s.t0, s.t1, 300); fill(tr.b3, s.t0, s.t1, 400);
    } else if (s.mn === 'fricative' || s.mn === 'latfric') {
      if (s.pl.lf > 16) { fill(tr.av, s.t0, s.t1, s.vc ? 0.45 : 0); fill(tr.ah, s.t0, s.t1, s.vc ? 0.5 : 0.9); fill(tr.b1, s.t0, s.t1, 250); }
      else {
        const sh = s.mn === 'latfric' ? { ff: 3300, fb: 1500, amp: 0.8 } : ns;
        fill(tr.av, s.t0, s.t1, s.vc ? 0.45 : 0); fill(tr.af, s.t0 + 0.01, s.t1 - 0.01, sh.amp * (s.vc ? 0.7 : 1)); fill(tr.ff, s.t0, s.t1, sh.ff); fill(tr.fb, s.t0, s.t1, sh.fb);
        if (s.pl.lf > 10) fill(tr.b1, s.t0, s.t1, 200);
      }
    } else if (s.mn === 'approx' || s.mn === 'latapprox') {
      fill(tr.av, s.t0, s.t1, 0.85); if (s.mn === 'latapprox') { fill(tr.b2, s.t0, s.t1, 160); fill(tr.b3, s.t0, s.t1, 220); }
    } else if (s.mn === 'tap') {
      fill(tr.av, s.t0, s.t1, 0.45); fill(tr.lp, s.t0, s.t1, 0.85);
    } else if (s.mn === 'trill') {
      for (let tt = s.t0; tt < s.t1 - 0.004; tt += 0.034) { fill(tr.av, tt, tt + 0.018, 0.4); fill(tr.lp, tt, tt + 0.018, 0.85); fill(tr.av, tt + 0.018, tt + 0.034, 0.9); fill(tr.lp, tt + 0.018, tt + 0.034, 0); }
      if (s.pl.lf > 7) fill(tr.ah, s.t0, s.t1, 0.15);
    }
  });
  for (const k of ['av', 'ah']) { const a = tr[k], b = a.slice(); for (let i = 2; i < N - 2; i++) a[i] = (b[i - 2] + b[i - 1] + b[i] + b[i + 1] + b[i + 2]) / 5; }
  const f0f = o.f0 || ((tt) => 128 - (22 * tt) / dur);
  const at = (a, tt) => a[Math.min(N - 1, Math.max(0, Math.round(tt * 1000)))];
  const buf = synth((tt) => ({
    f0: f0f(tt), av: at(tr.av, tt), ah: at(tr.ah, tt), af: at(tr.af, tt), ff: at(tr.ff, tt), fb: at(tr.fb, tt), lp: at(tr.lp, tt), nz: at(tr.nz, tt),
    F: [Ff[0](tt), Ff[1](tt), Ff[2](tt), FHI[0], FHI[1]], B: [at(tr.b1, tt), at(tr.b2, tt), at(tr.b3, tt), BW5[3], BW5[4]],
  }), dur, { seed: o.seed ?? 3 });
  return { buf, dur, segs, F: Ff, tracks: tr };
}

// ---------- vowel data and auditory scales ----------
/**
 * Peterson & Barney (1952), Table II: average f0 and formants F1–F3 (Hz) of ten American English vowels spoken in h_d words
 * by 33 men, 28 women and 15 children: [symbol, keyword, men, women, children], each [f0, F1, F2, F3].
 */
const PB = [
  ['i', 'heed', [136, 270, 2290, 3010], [235, 310, 2790, 3310], [272, 370, 3200, 3730]],
  ['ɪ', 'hid', [135, 390, 1990, 2550], [232, 430, 2480, 3070], [269, 530, 2730, 3600]],
  ['ɛ', 'head', [130, 530, 1840, 2480], [223, 610, 2330, 2990], [260, 690, 2610, 3570]],
  ['æ', 'had', [127, 660, 1720, 2410], [210, 860, 2050, 2850], [251, 1010, 2320, 3320]],
  ['ɑ', 'hod', [124, 730, 1090, 2440], [212, 850, 1220, 2810], [256, 1030, 1370, 3170]],
  ['ɔ', 'hawed', [129, 570, 840, 2410], [216, 590, 920, 2710], [263, 680, 1060, 3180]],
  ['ʊ', 'hood', [137, 440, 1020, 2240], [232, 470, 1160, 2680], [276, 560, 1410, 3310]],
  ['u', 'who’d', [141, 300, 870, 2240], [231, 370, 950, 2670], [274, 430, 1170, 3260]],
  ['ʌ', 'hud', [130, 640, 1190, 2390], [221, 760, 1400, 2780], [261, 850, 1590, 3360]],
  ['ɝ', 'heard', [133, 490, 1350, 1690], [218, 500, 1640, 1960], [261, 560, 1820, 2160]],
];
const GROUPS = ['men', 'women', 'children'];
const GROUP_COL = ['accent', 'orange', 'green'];
/** Higher formants and their scale by speaker group (shorter tracts → higher resonances). */
const GROUP_HI = [[3500, 4500], [4100, 5100], [4600, 5700]];
/** Bark (critical-band rate) of a frequency in Hz (Traunmüller 1990). */
const bark = (f) => (26.81 * f) / (1960 + f) - 0.53;
/** The 16 cardinal vowels [symbol, F1, F2] (male averages, widely tabulated values). */
const CARD16 = [['i', 240, 2400], ['e', 390, 2300], ['ɛ', 610, 1900], ['a', 850, 1610], ['y', 235, 2100], ['ø', 370, 1900], ['œ', 585, 1710], ['ɶ', 820, 1530],
  ['ɯ', 300, 1390], ['ɤ', 460, 1310], ['ʌ', 600, 1170], ['ɑ', 750, 940], ['u', 250, 595], ['o', 360, 640], ['ɔ', 500, 700], ['ɒ', 700, 760]];
/** Concatenate sample buffers with `gap` seconds of silence between them. */
function joinBufs(parts, gap) {
  const g = Math.round(gap * SR), out = new Float32Array(parts.reduce((a, p) => a + p.length + g, 0)); let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length + g; }
  return out;
}

export default {
  collection: 'ling',
  chapter: 1,
  items: [
  ],
};
