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
const clampN = (x, a, b) => Math.max(a, Math.min(b, x));
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
  let fA = 0, fB = 0, fC = 0, fN = 1, fy1 = 0, fy2 = 0, fx1 = 0, lpY = 0;
  const jitAmt = o.jitter ?? 0.005;
  for (let i = 0; i < n; i++) {
    if (i % 16 === 0) {
      q = par(i / SR); nF = Math.min(NF, q.F.length);
      for (let k = 0; k < nF; k++) { const c = resCoef(Math.min(q.F[k], SR / 2 - 200), q.B[k]); cA[k] = c[0]; cB[k] = c[1]; cC[k] = c[2]; }
      if (q.nz) { [pA, pB, pC] = resCoef(270, 100); const z = resCoef(q.nz, 120); zA = 1 / z[0]; zB = -z[1] / z[0]; zC = -z[2] / z[0]; }
      if (q.af > 0) { const ff = Math.min(q.ff ?? 4000, SR / 2 - 300), fb = q.fb ?? 1500; [fA, fB, fC] = resCoef(ff, fb); fN = 1 / (resGain(ff, fb, ff) * 2 * Math.sin((Math.PI * ff) / SR)); }
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
    if (q.af > 0) { const x = q.af * rnd(); const y = fA * x + fB * fy1 + fC * fy2; fy2 = fy1; fy1 = y; fr = (y - fx1) * fN; fx1 = y; } // unit gain at the peak
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
  if (lf < 1.2) return { ff: lf < 0.2 ? 1800 : 6500, fb: lf < 0.2 ? 5000 : 6000, amp: lf < 0.2 ? 0.45 : 0.2 };
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
      fill(tr.av, s.t0, s.t1, 0.38); fill(tr.nz, s.t0, s.t1, NASALZ[s.plName] || 1700); fill(tr.b2, s.t0, s.t1, 300); fill(tr.b3, s.t0, s.t1, 400);
    } else if (s.mn === 'fricative' || s.mn === 'latfric') {
      if (s.pl.lf > 16) { fill(tr.av, s.t0, s.t1, s.vc ? 0.4 : 0); fill(tr.ah, s.t0, s.t1, s.vc ? 0.35 : 0.5); fill(tr.b1, s.t0, s.t1, 250); }
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
    // ------------------------------------------------------------------ 1.9
    {
      num: '1.9',
      kind: 'Concept',
      name: 'The acoustic vowel space: F1 against F2',
      statement: String.raw`Plotting each vowel as a point with its first formant F1 on the vertical axis (increasing downward) and its second formant F2 on the horizontal axis (increasing to the left) gives the **acoustic vowel space**, and it reproduces the layout of the articulatory vowel chart: high vowels such as [i] and [u] have low F1 and sit at the top, low vowels such as [æ] and [ɑ] have high F1 and sit at the bottom, front vowels have high F2 and sit on the left, back (and rounded) vowels have low F2 and sit on the right. The corner vowels [i], [æ], [ɑ], [u] span a roughly triangular or quadrilateral region inside which the other vowels of a language fall. The first two formants, measured from a recording, are enough to identify most vowels of a given speaker.`,
      idea: String.raw`F1 is governed mainly by the size of the constriction formed by the tongue body (narrow for high vowels, low F1) and F2 mainly by how far forward it is (front constrictions shorten the front cavity and raise F2), as the tube perturbations of ling-1.7 and the articulatory dimensions of ling-1.6 show. So the two acoustic axes are close to the two articulatory ones, and the traditional chart, drawn by phoneticians from what they felt and heard, turned out to be largely a map of formant frequencies. Peterson and Barney's measurements of 76 speakers (1952) made this space the standard picture, and also showed the overlap between speakers that ling-1.10 addresses.`,
      caption: String.raw`The symbols are Peterson and Barney's (1952) average formants of ten American English vowels (keywords *heed, hid, head, had, hod, hawed, hood, who'd, hud, heard*); the dashed outline joins the corner vowels. Drag the **gold** point anywhere: the right panel is the spectrum of a vowel synthesized with exactly that F1 and F2 (harmonics under the formant envelope, peaks marked), and *Listen* plays it in the selected speaker's voice; switch on *sound while dragging* to hear the vowel morph continuously. Compare the speaker groups: same pattern, shifted upward for shorter vocal tracts.`,
      deps: ['ling-1.7', 'ling-1.6'],
      refs: ['Ladefoged & Johnson'],
      tags: ['vowels', 'formants'],
      credit: 'G. E. Peterson & H. L. Barney, 1952',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Formant' },
      viz(v) {
        const M = v.M, LF = (f) => -Math.log(f);
        const grp = v.select('speakers', [{ value: 0, label: 'men' }, { value: 1, label: 'women' }, { value: 2, label: 'children' }, { value: 3, label: 'all' }], 0, { onChange: () => voice.update(loopBuf) });
        const live = v.toggle('sound while dragging', false, { onChange: (on) => { if (on) voice.start(loopBuf()); else voice.stop(); } });
        const ch = v.stage({ x: [LF(3500), LF(700)], y: [LF(1150), LF(240)], height: 390, axes: 'box', minWidth: 300, weight: 1.3, xticks: [3000, 2500, 2000, 1500, 1200, 1000, 800].map((f) => [LF(f), `${f}`]), yticks: [300, 400, 500, 600, 800, 1000].map((f) => [LF(f), `${f}`]), title: 'F1 (Hz, downward) against F2 (Hz, leftward)' });
        const sp = v.stage({ x: [0, 4000], y: [-45, 30], height: 390, axes: 'box', minWidth: 250, title: 'spectrum of the vowel at the gold point (dB)', xticks: [[0, '0'], [1000, '1k'], [2000, '2k'], [3000, '3k'], [4000, '4 kHz']] });
        const H = ch.handle(LF(1250), LF(620), { color: 'gold', r: 9 });
        const voice = loopVoice(v);
        const g = () => (+grp.value === 3 ? 0 : +grp.value);
        const formants = () => { const F1 = Math.exp(-H.y), F2 = Math.exp(-H.x), gi = g(); return [F1, F2, Math.max(F2 + 450, [2450, 2850, 3250][gi]), ...GROUP_HI[gi]]; };
        const f0of = () => [125, 215, 262][g()];
        const loopBuf = () => normalise(vowelPeriod(formants(), BW5, Math.round(SR / f0of())), 0.8, 0);
        H.onDrag = () => voice.update(loopBuf);
        v.soundButton('Listen', (snd) => { live.set(false); const F = formants(), f0 = f0of(); snd.samples(normalise(synth((t) => ({ f0: f0 * (1.04 - 0.08 * t), av: 1, ah: 0, af: 0, F, B: BW5 }), 0.8), 0.85, 0.05), SR, { gain: 0.6 }); });
        let info = null;
        v.render(() => {
          const show = +grp.value === 3 ? [0, 1, 2] : [+grp.value], F = formants(), gi = g();
          for (const k of show) {
            const pt = (row) => [LF(row[2 + k][2]), LF(row[2 + k][1])], corners = ['i', 'æ', 'ɑ', 'u'].map((s) => pt(PB.find((r) => r[0] === s)));
            ch.path([...corners, corners[0]], { color: GROUP_COL[k], width: 1.2, alpha: 0.45, dash: [4, 4] });
            for (const row of PB) { const [x, y] = pt(row); ch.text(row[0], x, y, { size: 17, color: GROUP_COL[k], align: 'center', weight: 600 }); }
          }
          if (show.length === 1) for (const row of PB) { const [x, y] = [LF(row[2 + gi][2]), LF(row[2 + gi][1])]; ch.text(row[1], x, y - 0.075, { size: 10, color: 'muted', align: 'center' }); }
          // nearest vowel of the chosen group
          let best = 0, bd = 1e9; PB.forEach((row, i) => { const d = Math.hypot(Math.log(F[0] / row[2 + gi][1]), Math.log(F[1] / row[2 + gi][2])); if (d < bd) { bd = d; best = i; } });
          ch.line(H.x, H.y, LF(PB[best][2 + gi][2]), LF(PB[best][2 + gi][1]), { color: 'gold', dash: [3, 3], width: 1.2 });
          // spectrum of the synthesized vowel
          const P = Math.round(SR / f0of()), f0 = SR / P, h = harmonicsDb(M, vowelPeriod(F, BW5, P)), src = harmonicsDb(M, vowelPeriod([], [], P)), ref = src[1];
          const tilt = (f) => { const k = f / f0, lo = Math.max(1, Math.floor(k)), hi = lo + 1; return hi < src.length ? src[lo] + (src[hi] - src[lo]) * Math.max(0, k - lo) : src[lo]; };
          const env = (f) => dB(tractGain(F, BW5, f)) + tilt(Math.max(f, f0)) - ref;
          sp.fn(env, { domain: [30, 4000], n: 500, color: 'ink', dash: [5, 4], width: 1.3 });
          for (let k = 1; k * f0 < 4000 && k < h.length; k++) sp.line(k * f0, -45, k * f0, h[k] - ref, { color: GROUP_COL[gi], width: 1.8 });
          for (const [k, lab] of [[0, 'F1'], [1, 'F2']]) { sp.vline(F[k], { color: 'gold', dash: [3, 3] }); sp.dot(F[k], env(F[k]), { r: 5, color: 'gold' }); sp.text(lab, F[k], env(F[k]) + 5, { size: 12, color: 'gold', align: 'center', weight: 650 }); }
          info = { F, near: PB[best], gi, d: bd, f0 };
        });
        v.readout(() => info && `gold point: F1 = **${Math.round(info.F[0])} Hz**, F2 = **${Math.round(info.F[1])} Hz** (synthesized at $f_0$ = ${Math.round(info.f0)} Hz) · nearest ${GROUPS[info.gi].replace(/s$/, '')}'s vowel: **[${info.near[0]}]** as in *${info.near[1]}*${info.d > 0.25 ? ' (but far from every average: an unusual vowel)' : ''}`);
      },
    },
    // ------------------------------------------------------------------ 1.10
    {
      num: '1.10',
      kind: 'Phenomenon',
      name: 'Speaker normalisation of vowels',
      statement: String.raw`The same vowel spoken by different people has very different formant frequencies: children's formants are up to 40–50 % higher than men's because their vocal tracts are shorter, and women's lie in between. In raw hertz the vowel categories of a population therefore overlap heavily (a child's [ʊ] can have the formants of a man's [ʌ]), yet listeners identify vowels across speakers almost effortlessly. They do so by **normalising**: judging each vowel relative to the speaker's own vowel space. Computational normalisations that rescale each speaker's formants, for example the log-mean method (Nearey), which subtracts the speaker's mean log formant, or **Lobanov's** z-scores, which standardise each formant by the speaker's mean and standard deviation, make the categories of different speakers line up and greatly reduce the overlap.`,
      idea: String.raw`To a first approximation a shorter vocal tract multiplies all formants by the same factor (resonances scale as $1/L$, ling-1.8), so on a logarithmic scale a speaker's whole vowel space is shifted rigidly. Subtracting the speaker's mean log formant undoes that shift (Nearey 1978); Lobanov's (1971) z-scores also undo differences in the spread of the space. Listeners appear to use similar information, both from the other vowels they have heard from the speaker (extrinsic normalisation) and from cues within the vowel such as $f_0$ and F3 (intrinsic). The data here are simulated: each speaker's vowels are drawn around Peterson and Barney's group means (ling-1.9), scaled by a random vocal-tract factor and given random token-to-token variation.`,
      caption: String.raw`Each symbol is one vowel token of one simulated speaker (8 men, 8 women, 8 children); ellipses enclose about 80 % of each vowel category. Switch the normalisation: in raw hertz the ellipses sprawl and overlap, after log-mean or Lobanov normalisation they shrink and separate. The readout scores each method by classifying every token with the category centres learned from the other speakers (nearest centre, leave one speaker out). Highlight a group to see its own vowel space; *New speakers* draws another population.`,
      deps: ['ling-1.9'],
      refs: ['Ladefoged & Johnson'],
      tags: ['vowels', 'perception'],
      credit: 'B. M. Lobanov 1971; T. M. Nearey 1978',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Normalization_(sociolinguistics)' },
      viz(v) {
        const M = v.M, VCOL = ['blue', 'orange', 'green', 'red', 'purple', 'teal', 'pink', 'gold', 'gray', 'ink'];
        const norm = v.select('normalisation', [{ value: 'raw', label: 'raw Hz' }, { value: 'nearey', label: 'log-mean (Nearey)' }, { value: 'lobanov', label: 'Lobanov z-scores' }], 'raw');
        const hl = v.select('highlight', [{ value: -1, label: 'all' }, { value: 0, label: 'men' }, { value: 1, label: 'women' }, { value: 2, label: 'children' }], -1);
        let seed = 7, data = null;
        v.button('New speakers', () => { seed++; data = null; });
        const st = v.stage({ x: [0, 1], y: [0, 1], height: 420, axes: 'box', full: true });
        const make = () => {
          const R = v.rng(seed), toks = []; let sid = 0;
          for (let gi = 0; gi < 3; gi++) for (let s = 0; s < 8; s++, sid++) {
            const k = Math.exp(R.normal(0, 0.06)), k1 = Math.exp(R.normal(0, 0.03)), k2 = Math.exp(R.normal(0, 0.03));
            PB.forEach((row, vi) => { const [, F1, F2] = row[2 + gi]; toks.push({ v: vi, g: gi, s: sid, F1: F1 * k * k1 * Math.exp(R.normal(0, 0.08)), F2: F2 * k * k2 * Math.exp(R.normal(0, 0.07)) }); });
          }
          // the three representations of every token
          const by = new Map(); for (const t of toks) { if (!by.has(t.s)) by.set(t.s, []); by.get(t.s).push(t); }
          for (const list of by.values()) {
            const l1 = list.map((t) => Math.log(t.F1)), l2 = list.map((t) => Math.log(t.F2)), G = (M.mean(l1) + M.mean(l2)) / 2;
            const m1 = M.mean(list.map((t) => t.F1)), s1 = M.stdev(list.map((t) => t.F1)), m2 = M.mean(list.map((t) => t.F2)), s2 = M.stdev(list.map((t) => t.F2));
            for (const t of list) { t.raw = [t.F2, t.F1]; t.nearey = [Math.log(t.F2) - G, Math.log(t.F1) - G]; t.lobanov = [(t.F2 - m2) / s2, (t.F1 - m1) / s1]; }
          }
          // leave-one-speaker-out nearest-centre classification, in units scaled so both axes count equally
          const score = (key) => {
            const sx = M.stdev(toks.map((t) => t[key][0])), sy = M.stdev(toks.map((t) => t[key][1])); let ok = 0;
            for (let s = 0; s < 24; s++) {
              const cent = PB.map((_, vi) => { const own = toks.filter((t) => t.v === vi && t.s !== s); return [M.mean(own.map((t) => t[key][0])), M.mean(own.map((t) => t[key][1]))]; });
              for (const t of toks.filter((q) => q.s === s)) { let b = 0, bd = 1e9; cent.forEach((c, vi) => { const d = Math.hypot((t[key][0] - c[0]) / sx, (t[key][1] - c[1]) / sy); if (d < bd) { bd = d; b = vi; } }); if (b === t.v) ok++; }
            }
            return ok / toks.length;
          };
          return { toks, acc: { raw: score('raw'), nearey: score('nearey'), lobanov: score('lobanov') } };
        };
        v.legend(PB.map((row, i) => [VCOL[i], `[${row[0]}] ${row[1]}`, { dot: true }]));
        let info = null;
        v.render(() => {
          if (!data) data = make();
          const key = norm.value, T = data.toks, H = +hl.value;
          const xs = T.map((t) => t[key][0]), ys = T.map((t) => t[key][1]);
          const pad = (a, b) => [a - 0.06 * (b - a), b + 0.06 * (b - a)];
          const [x0, x1] = pad(Math.min(...xs), Math.max(...xs)), [y0, y1] = pad(Math.min(...ys), Math.max(...ys));
          st.setView([-x1, -x0], [-y1, -y0]); // F2 grows to the left, F1 downward
          const inner = (lo, hi) => (z) => z >= lo + 0.04 * (hi - lo) && z <= hi - 0.04 * (hi - lo), nice = (lo, hi, list) => list.filter(inner(lo, hi)), reg = (lo, hi, step) => M.range(Math.floor((hi - lo) / step) + 2).map((i) => Math.ceil(lo / step) * step + i * step).filter(inner(lo, hi));
          const xt = key === 'raw' ? nice(x0, x1, [800, 1000, 1500, 2000, 2500, 3000, 3500]) : reg(x0, x1, key === 'nearey' ? 0.2 : 0.5), yt = key === 'raw' ? nice(y0, y1, [300, 400, 500, 600, 800, 1000, 1200]) : reg(y0, y1, key === 'nearey' ? 0.2 : 0.5);
          const fmt = (z) => (key === 'raw' ? `${z}` : v.fix(z, 1).replace('-', '−'));
          st.setTicks(xt.map((z) => [-z, fmt(z)]), yt.map((z) => [-z, fmt(z)]));
          st.setTitle(key === 'raw' ? 'F1 against F2 in hertz' : key === 'nearey' ? 'log formants minus the speaker’s mean log formant' : 'formants as z-scores within each speaker');
          // category ellipses (1.8 σ) from all tokens
          PB.forEach((_, vi) => {
            const pts = T.filter((t) => t.v === vi).map((t) => [-t[key][0], -t[key][1]]), mx = M.mean(pts.map((p) => p[0])), my = M.mean(pts.map((p) => p[1]));
            let sxx = 0, sxy = 0, syy = 0; for (const [x, y] of pts) { sxx += (x - mx) ** 2; sxy += (x - mx) * (y - my); syy += (y - my) ** 2; }
            const n = pts.length - 1, e = M.eigSym2([[sxx / n, sxy / n], [sxy / n, syy / n]]), r = 1.8;
            st.curve((u) => { const a = r * Math.sqrt(Math.max(e.values[0], 0)) * Math.cos(u), b = r * Math.sqrt(Math.max(e.values[1], 0)) * Math.sin(u); return [mx + a * e.vectors[0][0] + b * e.vectors[1][0], my + a * e.vectors[0][1] + b * e.vectors[1][1]]; }, 0, 2 * Math.PI, { color: VCOL[vi], width: 1.6, fill: VCOL[vi], fillAlpha: 0.06, n: 80 });
          });
          for (const t of T) { const faded = H >= 0 && t.g !== H; st.text(PB[t.v][0], -t[key][0], -t[key][1], { size: faded ? 11 : 13.5, color: VCOL[t.v], align: 'center', alpha: faded ? 0.25 : 0.9, weight: 600 }); }
          info = data.acc;
        });
        v.readout(() => info && `classification of every token by the nearest category centre learned from the other speakers: raw hertz **${Math.round(100 * info.raw)} %** · log-mean **${Math.round(100 * info.nearey)} %** · Lobanov **${Math.round(100 * info.lobanov)} %** correct (chance 10 %)`);
      },
    },
    // ------------------------------------------------------------------ 1.11
    {
      num: '1.11',
      kind: 'Method',
      name: 'Reading speech spectrograms',
      statement: String.raw`A **spectrogram** displays a sound's energy as darkness over time (horizontal) and frequency (vertical), computed by Fourier transforms of short overlapping windows. Its appearance depends on the window: a **wide-band** spectrogram (window of a few milliseconds, shorter than a glottal period) shows each glottal pulse as a vertical striation and the formants as dark horizontal bands; a **narrow-band** one (window of 20–40 ms) resolves the individual harmonics as horizontal lines. Speech sounds have characteristic signatures: vowels are voiced stretches with clear formant bands; stops are near-silent gaps (the closure, perhaps with a low voice bar) ended by a vertical burst spike, sometimes followed by aspiration noise; fricatives are aperiodic noise whose frequency range indicates the place ([s] high, [ʃ] lower, [f] weak and diffuse); nasals are weaker voiced stretches with a strong low-frequency murmur and faint upper formants; approximants look like vowels with moving formants. Segment boundaries are placed where these signatures change abruptly.`,
      idea: String.raw`The short-time Fourier transform trades time resolution against frequency resolution (sig-8.13, and the uncertainty principle behind it): a window shorter than the pitch period cannot separate harmonics but follows the formant envelope and each pulse; a window several periods long separates the harmonics but blurs fast events such as bursts. Because the signatures follow directly from how each manner of articulation shapes the source and the filter (ling-1.4, ling-1.5), a trained reader can segment and partly identify unknown utterances. Boundaries are not instants in the articulation, though: gestures overlap (ling-1.12), so segmentation is a convention applied to the acoustics.`,
      caption: String.raw`A short phrase is synthesized by rule and analysed with the FFT. Drag the **gold** boundary markers to where you think each sound begins and ends (the labels between them tell you what to look for), then switch on *show answer* to compare with the boundaries used in the synthesis; the readout scores your placement. Click inside any segment to hear it alone, or *Listen* to the whole phrase with a moving playhead. Switch between wide-band (5 ms window) and narrow-band (30 ms) analysis to see striations become harmonics.`,
      deps: ['music-4.7', 'ling-1.5'],
      refs: ['Ladefoged & Johnson', 'Jurafsky & Martin ch. 15'],
      tags: ['spectrogram', 'acoustics'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Spectrogram' },
      viz(v) {
        const M = v.M, FM = 7000;
        // phrases as phones with durations; 'j' marks the second half of a diphthong (no boundary before it)
        const PHR = {
          a: { text: 'she saw Bob', ph: [['ʃ', 0.14], ['i', 0.12], ['s', 0.13], ['ɔ', 0.2], ['b', 0.07], ['ɑ', 0.15], ['b', 0.07]] },
          b: { text: 'my name is Anna', ph: [['m', 0.08], ['a', 0.11], ['ɪ', 0.08, 'j'], ['n', 0.06], ['e', 0.11], ['ɪ', 0.06, 'j'], ['m', 0.07], ['ɪ', 0.07], ['z', 0.1], ['æ', 0.14], ['n', 0.07], ['ə', 0.14]] },
          c: { text: 'a cat ate fish', ph: [['ə', 0.08], ['k', 0.08], ['æ', 0.16], ['t', 0.07], ['e', 0.12], ['ɪ', 0.06, 'j'], ['t', 0.07], ['f', 0.13], ['ɪ', 0.1], ['ʃ', 0.16]] },
        };
        const phr = v.select('phrase', Object.entries(PHR).map(([k, p]) => ({ value: k, label: `“${p.text}”` })), 'a', { onChange: () => reset() });
        const band = v.select('analysis', [{ value: 'w', label: 'wide-band' }, { value: 'n', label: 'narrow-band' }], 'w');
        const ans = v.toggle('show answer', false);
        const sg = v.stage({ x: [0, 1], y: [0, FM], height: 330, axes: 'box', full: true, yticks: [[0, '0'], [1000, '1k'], [2000, '2k'], [3000, '3k'], [4000, '4k'], [5000, '5k'], [6000, '6k'], [7000, '7 kHz']] });
        const cache = new Map();
        const get = () => {
          const k = phr.value; if (cache.has(k)) return cache.get(k);
          const P = PHR[k], r = speak(P.ph.map(([p, d]) => [p, d]), { lead: 0.06, tail: 0.06 });
          // segments: diphthong halves merged
          const segs = []; r.segs.forEach((sg0, i) => { if (P.ph[i][2] === 'j') { const last = segs[segs.length - 1]; last.t1 = sg0.t1; last.lab += P.ph[i][0]; } else segs.push({ t0: sg0.t0, t1: sg0.t1, lab: P.ph[i][0] }); });
          const out = { buf: r.buf, dur: r.dur, segs, Sw: stft(M, r.buf, { win: 0.005, fmax: FM }), Sn: stft(M, r.buf, { win: 0.03, hop: 0.004, fmax: FM, nfft: 1024 }) };
          cache.set(k, out); return out;
        };
        const hs = M.range(14).map(() => sg.handle(0, FM * 0.93, { color: 'gold', r: 7 }));
        const reset = () => { const d = get(), n = d.segs.length + 1; hs.forEach((h, i) => { h.visible = i < n; h.set(i < n ? 0.06 + ((d.dur - 0.12) * i) / (n - 1) : 0, FM * 0.93); }); };
        hs.forEach((h, i) => { h.constrain = (x) => { const d = get(), n = d.segs.length + 1, lo = i > 0 ? hs[i - 1].x + 0.012 : 0.0, hi = i < n - 1 ? hs[i + 1].x - 0.012 : d.dur; return [clampN(x, lo, hi), FM * 0.93]; }; });
        reset();
        const ph = playhead(v);
        v.soundButton('Listen', (snd) => { const d = get(); snd.samples(normalise(d.buf.slice(), 0.85, 0.01), SR, { gain: 0.6 }); ph.start(d.dur); });
        let played = null;
        sg.onClick((x) => {
          const d = get(), n = d.segs.length + 1; let i = -1; for (let k = 0; k < n - 1; k++) if (x >= hs[k].x && x < hs[k + 1].x) i = k; if (i < 0) return;
          const a = Math.round(hs[i].x * SR), b = Math.round(hs[i + 1].x * SR), snd = v.sound(); snd.stop();
          snd.samples(normalise(d.buf.slice(a, b), 0.85, 0.008), SR, { gain: 0.6 }); played = i;
        });
        let info = null;
        v.render(() => {
          const d = get(), n = d.segs.length + 1;
          sg.setView([0, d.dur], [0, FM]);
          drawSpec(sg, band.value === 'w' ? d.Sw : d.Sn, v.rgb('ink'), { key: phr.value + band.value, range: 52 });
          // the reader's boundaries and the labels between them
          for (let i = 0; i < n; i++) sg.line(hs[i].x, 0, hs[i].x, FM * 0.93, { color: 'gold', width: 1.4, alpha: 0.9 });
          for (let i = 0; i < n - 1; i++) { const xm = (hs[i].x + hs[i + 1].x) / 2; if (played === i) sg.rect(hs[i].x, FM * 0.86, hs[i + 1].x, FM, { fill: 'gold', fillAlpha: 0.25, stroke: false }); sg.text(d.segs[i].lab, xm, FM * 0.975, { size: 14, color: 'gold', align: 'center', weight: 650 }); }
          // the answer
          const truth = [d.segs[0].t0, ...d.segs.map((s) => s.t1)];
          if (ans.value) { truth.forEach((t) => sg.vline(t, { color: 'green', dash: [5, 4], width: 1.6 })); d.segs.forEach((s) => sg.text(s.lab, (s.t0 + s.t1) / 2, FM * 0.82, { size: 13, color: 'green', align: 'center', weight: 650 })); }
          if (ph.t != null) sg.vline(Math.min(d.dur, ph.t), { color: 'accent', width: 2 });
          const errs = truth.map((t, i) => Math.abs(hs[i].x - t) * 1000);
          info = { mean: M.mean(errs), good: errs.filter((e) => e <= 15).length, n };
        });
        v.readout(() => info && `your boundaries are off by **${Math.round(info.mean)} ms** on average; ${info.good} of ${info.n} within 15 ms of the synthesis boundaries${info.good === info.n ? ' · all placed: well read!' : ''} · stops: gap then burst; fricatives: noise; nasals: weak low murmur; vowels: formant bands`);
      },
    },
    // ------------------------------------------------------------------ 1.12
    {
      num: '1.12',
      kind: 'Phenomenon',
      name: 'Coarticulation and formant transitions',
      statement: String.raw`Speech sounds are not produced one after another like beads on a string: the gestures of neighbouring sounds overlap in time (**coarticulation**), so each consonant is realised differently before different vowels. The clearest trace is in the **formant transitions** at a consonant–vowel boundary: the second formant of [di], [da] and [du] starts at different frequencies, but the transitions all point back toward a common frequency, the consonant's **locus** (about 1800 Hz for [d], 720 Hz for [b] and, before front vowels, about 3000 Hz for [ɡ], according to Delattre, Liberman and Cooper, 1955). Measured across vowels, the F2 at the onset of voicing is close to a linear function of the F2 of the vowel, the **locus equation** $F2_{onset}=k\,F2_{vowel}+c$, whose slope $k$ (between 0 and 1) measures how strongly the vowel coarticulates with the consonant.`,
      idea: String.raw`At the release the tract still has the consonant's shape, which defines a starting resonance; the tongue body, already moving toward the vowel during the closure, makes that starting point vowel-dependent. If the consonant's own resonance (the locus $L$) were reached exactly at the release, all transitions would start at $L$ ($k=0$); if the vowel took over completely, there would be no transition at all ($k=1$). Real speech lies between, so the onsets lie on a line that crosses the diagonal $F2_{onset}=F2_{vowel}$ at $L=c/(1-k)$. Delattre and colleagues found the loci with painted spectrograms played on the Pattern Playback; Lindblom (1963) introduced the locus equation; the transitions are one of the main cues for place (ling-1.3) that a spectrogram reader uses (ling-1.11).`,
      caption: String.raw`Choose a consonant and slide the coarticulation $k$. Left: spectrograms of [Ci e a o u] synthesized with the locus model, with the F2 track (gold) and dashed extensions of the first part of each transition. Right: F2 measured at the onset of voicing in each synthesized syllable (by FFT of its first periods) against the F2 of the vowel; the fitted line is the locus equation, and where it meets the diagonal is the measured locus (dot). With $k=0$ every transition starts at the locus; with $k=1$ there are none. [ɡ] needs two loci, one for front and one for back vowels. *Listen* plays the five syllables.`,
      deps: ['ling-1.11'],
      refs: ['Ladefoged & Johnson'],
      tags: ['coarticulation', 'transitions'],
      credit: 'P. Delattre, A. Liberman & F. Cooper 1955; B. Lindblom 1963',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Coarticulation' },
      viz(v) {
        const M = v.M, VOWS = ['i', 'e', 'a', 'o', 'u'], SEG = 0.32, FM = 4000;
        const cs = v.select('consonant', [{ value: 'b', label: '[b]' }, { value: 'd', label: '[d]' }, { value: 'g', label: '[ɡ]' }], 'd');
        const kS = v.slider('coarticulation $k$', 0, 1, 0.42, { step: 0.01 });
        const sg = v.stage({ x: [0, SEG * 5], y: [0, FM], height: 320, axes: 'box', minWidth: 330, weight: 1.35, xticks: VOWS.map((x, i) => [SEG * (i + 0.5), `[${'bdg'.includes(cs.value) ? cs.value.replace('g', 'ɡ') : ''}${x}]`]), yticks: [[0, '0'], [1000, '1k'], [2000, '2k'], [3000, '3k'], [4000, '4 kHz']] });
        const le = v.stage({ x: [600, 3000], y: [600, 3000], height: 320, axes: 'box', minWidth: 250, title: 'locus equation (Hz)', xlabel: 'F2 of the vowel', ylabel: 'F2 at voicing onset' });
        const PLC = { b: { lf: 0, loc: [220, 720, 2200] }, d: { lf: 1.6, loc: [220, 1800, 2700] }, g: { lf: 6.0, loc: null } };
        const cache = new Map();
        const measureF2 = (buf, t0) => { // F2 from the spectrum of 15 ms of signal starting at t0: highest spectral peak between 900 and 3300 Hz
          const N = 2048, w = Math.round(0.015 * SR), a = Math.round(t0 * SR), re = new Float64Array(N), im = new Float64Array(N);
          for (let j = 0; j < w; j++) re[j] = (buf[a + j] - 0.9 * (buf[a + j - 1] || 0)) * (0.5 - 0.5 * Math.cos((2 * Math.PI * j) / w));
          M.fft(re, im); let best = 0, bf = 0;
          for (let b = Math.round((900 * N) / SR); b < (3300 * N) / SR; b++) { const m = re[b] * re[b] + im[b] * im[b]; if (m > best) { best = m; bf = b; } }
          return (bf * SR) / N;
        };
        const get = () => {
          const key = cs.value + kS.value; if (cache.has(key)) return cache.get(key);
          const sy = VOWS.map((V) => {
            const r = speak([{ sym: cs.value, pl: PLC[cs.value], mn: 'plosive', vc: 1, k: kS.value }, [V, 0.19]], { lead: 0.04, tail: 0.02, vot: 0.012 });
            const tr = r.segs[0].t1, buf = new Float32Array(Math.round(SEG * SR)); buf.set(r.buf.slice(0, buf.length));
            return { buf, tr, F2: r.F[1], vowel: VF[V][1], onset: measureF2(r.buf, tr + 0.014) };
          });
          const all = new Float32Array(sy.length * Math.round(SEG * SR)); sy.forEach((s, i) => all.set(s.buf, i * s.buf.length));
          const out = { sy, all, S: stft(M, all, { win: 0.005, fmax: FM }) }; cache.set(key, out); return out;
        };
        v.soundButton('Listen', (snd) => snd.samples(normalise(get().all.slice(), 0.85, 0.01), SR, { gain: 0.6 }));
        v.legend([['gold', 'F2 track'], ['gold', 'transition extended back', { dash: true }], ['accent', 'measured onsets', { dot: true }], ['red', 'locus (Delattre et al.)', { dash: true }]]);
        let info = null;
        v.render(() => {
          const d = get(), c = cs.value;
          sg.setTicks(VOWS.map((x, i) => [SEG * (i + 0.5), `[${c === 'g' ? 'ɡ' : c}${x}]`]), null);
          drawSpec(sg, d.S, v.rgb('ink'), { key: c + kS.value, range: 50 });
          const locus = c === 'b' ? 720 : c === 'd' ? 1800 : null;
          if (locus) sg.hline(locus, { color: 'red', dash: [6, 4], width: 1.4 });
          else { sg.line(0, 3000, SEG * 2, 3000, { color: 'red', dash: [6, 4], width: 1.4 }); sg.line(SEG * 2, 1500, SEG * 5, 1500, { color: 'red', dash: [6, 4], width: 1.4 }); }
          d.sy.forEach((s, i) => {
            const off = i * SEG, pts = []; for (let t = s.tr; t < s.tr + 0.19; t += 0.004) pts.push([off + t, s.F2(t)]);
            sg.path(pts, { color: 'gold', width: 2.2 });
            const slope = (s.F2(s.tr + 0.012) - s.F2(s.tr)) / 0.012; sg.line(off + s.tr, s.F2(s.tr), off + s.tr - 0.045, s.F2(s.tr) - 0.045 * slope, { color: 'gold', dash: [4, 3], width: 1.5 });
          });
          // locus equation from the measured onsets
          le.line(600, 600, 3000, 3000, { color: 'faint', width: 1.2, dash: [3, 3] });
          le.text('no transition', 2650, 2780, { size: 10.5, color: 'muted', align: 'center' });
          const groups = c === 'g' ? [[0, 1], [2, 3, 4]] : [[0, 1, 2, 3, 4]], fits = [];
          for (const gi of groups) {
            const xs = gi.map((i) => d.sy[i].vowel), ys = gi.map((i) => d.sy[i].onset), f = M.linreg(xs, ys);
            const lo = Math.min(...xs) - 150, hi = Math.max(...xs) + 150; le.line(lo, f.predict(lo), hi, f.predict(hi), { color: 'accent', width: 2 });
            const L = f.slope < 0.97 ? f.intercept / (1 - f.slope) : null;
            if (L && L > 600 && L < 3000) le.dot(L, L, { r: 6, color: 'red' });
            fits.push({ k: f.slope, c: f.intercept, L });
          }
          if (locus) le.hline(locus, { color: 'red', dash: [6, 4], width: 1.2 }); else { le.hline(3000, { color: 'red', dash: [6, 4], width: 1.2 }); le.hline(1500, { color: 'red', dash: [6, 4], width: 1.2 }); }
          d.sy.forEach((s, i) => { le.dot(s.vowel, s.onset, { r: 5, color: 'accent' }); le.text(`[${VOWS[i]}]`, s.vowel + (VOWS[i] === 'o' ? -40 : VOWS[i] === 'u' ? 40 : 0), s.onset + (VOWS[i] === 'o' ? -130 : 120), { size: 12, color: 'accent', align: VOWS[i] === 'o' ? 'right' : VOWS[i] === 'u' ? 'left' : 'center' }); });
          info = { fits, c };
        });
        v.readout(() => info && info.fits.map((f, j) => `${info.c === 'g' ? (j ? 'back vowels: ' : 'front vowels: ') : ''}measured locus equation $F2_{onset}$ = ${v.fix(f.k, 2)} $F2_{vowel}$ + ${Math.round(f.c)} Hz → locus ${f.L ? `**${Math.round(f.L)} Hz**` : 'undefined (slope ≈ 1)'}`).join(' · ') + ` · Delattre et al.: ${info.c === 'b' ? '720' : info.c === 'd' ? '1800' : '≈ 3000 (front)'} Hz`);
      },
    },
    // ------------------------------------------------------------------ 1.13
    {
      num: '1.13',
      kind: 'Phenomenon',
      name: 'Categorical perception of stop consonants',
      statement: String.raw`When listeners hear a continuum of synthetic syllables whose voice onset time increases in equal steps from [ba] to [pa], they do not hear a gradual change: **identification** stays near 100 % /b/ up to a boundary (about 25 ms VOT for English labials), then switches to /p/ within one or two steps. **Discrimination** follows the labels: two stimuli 20 ms apart are told apart well when they straddle the boundary and barely above chance when both fall in the same category, although the acoustic difference is the same. Perception of this kind, where discrimination is predicted by identification, is called **categorical perception**. It is strong for stop consonants and much weaker for vowels, and it is shaped by the listener's language: the boundary sits where the language's categories need it.`,
      idea: String.raw`If listeners could only compare category labels, the probability of answering an ABX trial correctly (is X the same as A or as B?) would be $\tfrac12+\tfrac12(p_A-p_B)^2$, where $p_A, p_B$ are the probabilities of labelling A and B as /p/: discrimination is then at chance within a category and peaks at the boundary. Liberman, Harris, Hoffman and Griffith (1957) found that real discrimination of stop continua nearly matches this prediction. Later work showed it is not purely categorical (listeners do hear some within-category differences, given sensitive tasks), and that chinchillas and infants show similar VOT boundaries, so part of the effect is auditory; but the boundary's location is tuned by experience with a language (ling-1.5).`,
      caption: String.raw`The eight stimuli (top) are [ba]–[pa] syllables synthesized with VOT from 0 to 70 ms; click one to hear it. Then test yourself: *Random step* plays a hidden stimulus and you answer **/b/** or **/p/**; *ABX trial* plays three stimuli and you say whether the third matched the first or the second. Your identification points (gold) and ABX scores (green bars) accumulate beside the curves of a model English listener (boundary 25 ms) and the discrimination it predicts. Only the pairs that straddle the boundary should be easy.`,
      deps: ['ling-1.5'],
      refs: ['Fromkin et al.'],
      tags: ['perception', 'categories'],
      credit: 'A. M. Liberman, K. S. Harris, H. S. Hoffman & B. C. Griffith, 1957',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Categorical_perception' },
      viz(v) {
        const M = v.M, STEPS = M.range(8).map((i) => i * 10), BND = 25, SL = 4;
        const strip = v.stage({ x: [0, 8], y: [0, 1], height: 105, axes: false, full: true });
        const idS = v.stage({ x: [-5, 75], y: [-0.04, 1.08], height: 250, axes: 'box', minWidth: 260, title: 'identification: % heard as /p/', xticks: STEPS.map((x) => [x, `${x}`]), yticks: [[0, '0'], [0.5, '50'], [1, '100']], xlabel: 'VOT (ms)' });
        const dS = v.stage({ x: [-5, 75], y: [0.4, 1.04], height: 250, axes: 'box', minWidth: 260, title: 'ABX discrimination of pairs 20 ms apart: % correct', xticks: STEPS.slice(0, 6).map((x) => [x + 10, `${x}–${x + 20}`]), yticks: [[0.5, '50 (chance)'], [0.75, '75'], [1, '100']] });
        const cache = new Map();
        const stim = (vot) => { if (cache.has(vot)) return cache.get(vot); const r = speak([['p', 0.09], ['a', 0.24]], { vot: vot / 1000, lead: 0.05, f0: (t) => 118 - 18 * t }); const out = { buf: normalise(r.buf, 0.85, 0.01), tr: r.segs[0].t1 }; cache.set(vot, out); return out; };
        const model = (x) => 1 / (1 + Math.exp(-(x - BND) / SL));
        const pred = (pA, pB) => 0.5 + 0.5 * (pA - pB) ** 2;
        let resp = STEPS.map(() => ({ b: 0, p: 0 })), abx = STEPS.slice(0, 6).map(() => ({ n: 0, ok: 0 })), pending = null, last = null;
        const rnd = v.rng(99);
        strip.onClick((x) => { const i = clampN(Math.floor(x), 0, 7), snd = v.sound(); snd.stop(); snd.samples(stim(STEPS[i]).buf, SR, { gain: 0.6 }); last = i; pending = null; });
        v.soundButton('Random step', (snd) => { const i = Math.floor(Math.random() * 8); pending = { type: 'id', i }; snd.samples(stim(STEPS[i]).buf, SR, { gain: 0.6 }); });
        v.button('/b/', () => { if (pending && pending.type === 'id') { resp[pending.i].b++; last = pending.i; pending = null; } });
        v.button('/p/', () => { if (pending && pending.type === 'id') { resp[pending.i].p++; last = pending.i; pending = null; } });
        v.soundButton('ABX trial', (snd) => {
          const j = Math.floor(Math.random() * 6), aFirst = Math.random() < 0.5, xIsA = Math.random() < 0.5;
          const A = stim(STEPS[aFirst ? j : j + 2]).buf, B = stim(STEPS[aFirst ? j + 2 : j]).buf, X = xIsA ? A : B;
          pending = { type: 'abx', j, xIsA }; snd.samples(joinBufs([A, B, X], 0.45), SR, { gain: 0.6 });
        });
        v.button('X = A', () => { if (pending && pending.type === 'abx') { abx[pending.j].n++; if (pending.xIsA) abx[pending.j].ok++; pending = null; } });
        v.button('X = B', () => { if (pending && pending.type === 'abx') { abx[pending.j].n++; if (!pending.xIsA) abx[pending.j].ok++; pending = null; } });
        v.button('Reset', () => { resp = STEPS.map(() => ({ b: 0, p: 0 })); abx = STEPS.slice(0, 6).map(() => ({ n: 0, ok: 0 })); pending = null; last = null; });
        v.legend([['accent', 'model English listener'], ['gold', 'your answers', { dot: true }], ['purple', 'predicted from labels', { dash: true }], ['green', 'your ABX scores', { area: true }]]);
        let info = null;
        v.render(() => {
          // the stimuli: first 120 ms after release, burst → aspiration → voicing
          STEPS.forEach((vot, i) => {
            const s = stim(vot), a = Math.round(s.tr * SR) - 80, n = Math.round(0.12 * SR), pts = [];
            for (let k = 0; k < n; k += 3) pts.push([i + 0.06 + (0.88 * k) / n, 0.42 + 0.3 * s.buf[a + k]]);
            strip.rect(i + 0.03, 0.04, i + 0.97, 0.96, { fill: i === last ? 'gold' : 'grid', fillAlpha: i === last ? 0.18 : 0.35, color: 'faint', width: 1 });
            strip.path(pts, { color: model(vot) > 0.5 ? 'orange' : 'accent', width: 1 });
            strip.text(`${vot} ms`, i + 0.5, 0.86, { size: 11.5, color: 'ink', align: 'center', weight: 600 });
          });
          if (pending) strip.corner(pending.type === 'id' ? 'answer: /b/ or /p/?' : 'answer: X = A or X = B?', 'tr', { color: 'red', weight: 650 });
          // identification
          idS.hline(0.5, { color: 'faint', dash: [3, 3] }); idS.vline(BND, { color: 'faint', dash: [3, 3] });
          idS.fn(model, { domain: [-5, 75], color: 'accent', width: 2.4 });
          STEPS.forEach((x) => idS.dot(x, model(x), { r: 3.5, color: 'accent' }));
          const yours = resp.map((r) => (r.b + r.p ? r.p / (r.b + r.p) : null)), nId = resp.reduce((a, r) => a + r.b + r.p, 0);
          yours.forEach((p, i) => { if (p != null) { idS.dot(STEPS[i], p, { r: 5 + Math.min(5, resp[i].b + resp[i].p), color: 'gold' }); } });
          // discrimination: predicted from labels (model, and yours if you have labelled both stimuli of a pair)
          const centers = STEPS.slice(0, 6).map((x) => x + 10);
          abx.forEach((a, j) => { if (a.n) dS.rect(centers[j] - 3.5, 0.4, centers[j] + 3.5, a.ok / a.n, { fill: 'green', fillAlpha: 0.45, stroke: false }); if (a.n) dS.text(`${a.ok}/${a.n}`, centers[j], Math.max(0.43, a.ok / a.n) + 0.03, { size: 10.5, color: 'green', align: 'center' }); });
          dS.hline(0.5, { color: 'faint', dash: [3, 3] });
          dS.path(centers.map((c, j) => [c, pred(model(STEPS[j]), model(STEPS[j + 2]))]), { color: 'accent', width: 2.4 });
          centers.forEach((c, j) => dS.dot(c, pred(model(STEPS[j]), model(STEPS[j + 2])), { r: 3.5, color: 'accent' }));
          const yp = centers.map((c, j) => (yours[j] != null && yours[j + 2] != null ? [c, pred(yours[j], yours[j + 2])] : null)).filter(Boolean);
          if (yp.length > 1) dS.path(yp, { color: 'purple', width: 2, dash: [5, 4] });
          // your boundary: first 50 % crossing of your identification curve
          let yb = null; for (let i = 0; i < 7; i++) if (yours[i] != null && yours[i + 1] != null && yours[i] < 0.5 && yours[i + 1] >= 0.5) { yb = STEPS[i] + (10 * (0.5 - yours[i])) / (yours[i + 1] - yours[i]); break; }
          const nAbx = abx.reduce((a, r) => a + r.n, 0), okAbx = abx.reduce((a, r) => a + r.ok, 0);
          info = { nId, yb, nAbx, okAbx, peak: pred(model(20), model(40)), inside: pred(model(40), model(60)) };
        });
        v.readout(() => info && `model listener: identical 20 ms steps, but predicted ABX accuracy **${Math.round(100 * info.peak)} %** for the pair 20–40 ms (across the boundary) against **${Math.round(100 * info.inside)} %** for 40–60 ms (inside /p/) · you: ${info.nId} labels${info.yb != null ? `, boundary ≈ **${Math.round(info.yb)} ms**` : ''}, ABX ${info.okAbx}/${info.nAbx} correct`);
      },
    },
    // ------------------------------------------------------------------ 1.14
    {
      num: '1.14',
      kind: 'Model',
      name: 'Vowel systems as maximal dispersion',
      statement: String.raw`The **dispersion theory** of vowel systems (Liljencrants and Lindblom, 1972) proposes that languages choose vowels that are as far apart as possible in auditory space, so that they are easy to tell apart. Model each vowel as a point in the space of possible vowels, measured by its first two formants on an auditory (Bark) scale, and choose $n$ points that minimise the total "energy" $E=\sum_{i<j}1/d_{ij}^2$, where $d_{ij}$ is the auditory distance between vowels $i$ and $j$. The optima for small $n$ match the most common inventories of the world's languages: three vowels go to the corners [i a u], five to [i e a o u], seven to [i e ɛ a ɔ o u]. For larger $n$ the simple model predicts too many high vowels (central [ɨ]-like vowels) compared with real languages, which add mid vowels instead.`,
      idea: String.raw`The repulsive energy pushes points apart like charges confined to a region, so they first occupy the corners of the vowel space and then spread along its edge: the edge is longest along the front–back dimension at the top (high vowels have the widest F2 range), so the optimum fills the periphery and avoids the centre. The space itself is the triangle-like region reachable by the vocal tract, here the hull of the measured cardinal vowels (ling-1.9). Weighting F2 less (because higher formants are perceived less sharply) shrinks the top edge and improves the predictions for larger systems, an observation that led to refinements such as Schwartz and colleagues' dispersion–focalisation theory (1997).`,
      caption: String.raw`The shaded region is the space of possible vowels (outline of the cardinal vowels, on Bark scales: F2 leftward, F1 downward). Choose the number of vowels and watch them repel each other to the configuration of least energy; each settles next to the nearest cardinal vowel symbol, named in the readout. Drag any vowel to disturb the system and see the others rearrange; *Shake* starts again from new random positions (the energy has local minima, so the best of ten starts is animated). Raise the F2 weight to 1 to see the model add extra high vowels, its best-known failure; lower it and mid vowels appear instead.`,
      deps: ['ling-1.9'],
      refs: ['Ladefoged & Johnson'],
      tags: ['vowel systems', 'typology'],
      credit: 'J. Liljencrants & B. Lindblom, 1972',
      scope: String.raw`A model of which vowel qualities languages prefer, valid statistically across languages rather than for any one language; it ignores length, nasality, rounding as a separate dimension, and the role of focal (stable) vowels, and it overpredicts high vowels for systems of more than about seven.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Vowel#Vowel_systems' },
      viz(v) {
        const M = v.M;
        const nS = v.slider('number of vowels $n$', 3, 9, 5, { int: true, step: 1, onChange: () => shake() });
        const wS = v.slider('F2 weight', 0.3, 1.2, 0.5, { step: 0.05, onChange: () => shake() });
        const st = v.stage({ x: [-15, -4.5], y: [-8.6, -1.6], height: 380, axes: 'box', full: true, title: 'auditory vowel space: −F2 (Bark) across, −F1 (Bark) down', xticks: [2400, 2000, 1500, 1000, 700].map((f) => [-bark(f), `${f} Hz`]), yticks: [250, 400, 600, 800].map((f) => [-bark(f), `${f}`]) });
        const card = CARD16.map(([s, F1, F2]) => ({ s, x: -bark(F2), y: -bark(F1) }));
        const hullPts = M.hull(card.map((c) => [c.x, c.y]));
        const inHull = (p) => M.closestOnConvexPoly(p, hullPts);
        let pts = [], it = 0, E = 0, round = 0;
        const hs = M.range(9).map(() => st.handle(-9, -5, { color: 'accent', r: 8, constrain: (x, y) => inHull([x, y]) }));
        const energy = (P, w) => { let e = 0; for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) e += 1 / ((w * (P[i][0] - P[j][0])) ** 2 + (P[i][1] - P[j][1]) ** 2); return e; };
        /** Projected gradient descent on E: each vowel steps along its repulsive force, then is pushed back into the space. */
        const descend = (P, w, it0, iters, drag) => {
          for (let k = 0; k < iters; k++) {
            const n = P.length, g = P.map(() => [0, 0]);
            for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { if (i === j) continue; const dx = w * (P[i][0] - P[j][0]), dy = P[i][1] - P[j][1], d2 = dx * dx + dy * dy + 1e-6, f = 2 / (d2 * d2); g[i][0] += f * dx * w; g[i][1] += f * dy; }
            const step = 0.05 / (1 + (it0 + k) / 300);
            for (let i = 0; i < n; i++) {
              if (drag && hs[i].dragging) { P[i] = [hs[i].x, hs[i].y]; continue; }
              const gl = Math.hypot(g[i][0], g[i][1]) || 1;
              P[i] = inHull([P[i][0] + (step * g[i][0]) / gl, P[i][1] + (step * g[i][1]) / gl]);
            }
          }
          return P;
        };
        const start = (seed, n) => { const R = v.rng(seed); return M.range(n).map(() => inHull([R.uniform(-14, -6), R.uniform(-7.5, -2.5)])); };
        // the energy landscape has local minima: try 10 random starts, then animate the descent from the one that ends lowest
        const shake = () => {
          const n = nS.value, w = wS.value; let best = null;
          for (let k = 0; k < 10; k++) { const seed = 1000 * round + k + 1, e = energy(descend(start(seed, n), w, 0, 1200, false), w); if (!best || e < best.e) best = { e, seed }; }
          pts = start(best.seed, n); it = 0; round++;
        };
        v.button('Shake', () => shake());
        const stepOpt = (w, iters) => { descend(pts, w, it, iters, true); it += iters; };
        const COMMON = { 3: 'i a u', 5: 'i e a o u', 7: 'i e ɛ a ɔ o u' };
        let info = null;
        v.animate(() => {
          if (pts.length !== nS.value) shake();
          if (hs.some((h) => h.dragging)) it = Math.min(it, 150);
          stepOpt(wS.value, 30);
          E = energy(pts, wS.value);
          st.poly(hullPts, { fill: 'accent', fillAlpha: 0.06, color: 'muted', width: 1.2 });
          for (const c of card) st.text(c.s, c.x, c.y, { size: 13, color: 'muted', align: 'center', alpha: 0.75 });
          // springs between nearest neighbours show the repulsion
          for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) { const d = Math.hypot(wS.value * (pts[i][0] - pts[j][0]), pts[i][1] - pts[j][1]); if (d < 3.2) st.line(pts[i][0], pts[i][1], pts[j][0], pts[j][1], { color: 'orange', width: 1, alpha: Math.min(0.6, 0.9 / d) }); }
          const names = pts.map((p) => { let b = 0, bd = 1e9; card.forEach((c, i) => { const d = Math.hypot(wS.value * (c.x - p[0]), c.y - p[1]); if (d < bd) { bd = d; b = i; } }); return card[b].s; });
          hs.forEach((h, i) => { h.visible = i < pts.length; if (i < pts.length && !h.dragging) { h.x = pts[i][0]; h.y = pts[i][1]; } });
          pts.forEach((p, i) => st.text(names[i], p[0], p[1] + 0.42, { size: 15, color: 'accent', align: 'center', weight: 700 }));
          const order = 'i y e ø ɛ œ a ɶ ɯ ɤ ʌ ɑ u o ɔ ɒ'.split(' ');
          info = { n: pts.length, E, names: names.slice().sort((a, b) => order.indexOf(a) - order.indexOf(b)), common: COMMON[pts.length] };
        }, { still: 3 });
        v.readout(() => info && `$n$ = ${info.n}: energy $E$ = ${v.fix(info.E, 3)} · nearest cardinal vowels: **[${info.names.join(' ')}]**${info.common ? ` · most common ${info.n}-vowel system in the world's languages: [${info.common}]` : ''}`);
      },
    },
    // ------------------------------------------------------------------ 1.15
    {
      num: '1.15',
      kind: 'Concept',
      name: 'Tone and intonation',
      statement: String.raw`The pitch of the voice, the fundamental frequency $f_0$ set by the rate of vocal-fold vibration, carries linguistic information in two ways. In a **tone language** the pitch pattern of a syllable distinguishes words: Mandarin [ma] means ‘mother’ with a high level tone (1, Chao's tone letters 55), ‘hemp’ with a rising tone (2, 35), ‘horse’ with a low dipping tone (3, 214) and ‘scold’ with a falling tone (4, 51). More than half of the world's languages are tonal. In every language pitch also forms **intonation**: contours over whole phrases that mark sentence type, focus and phrasing, such as the final fall of an English statement (*You're going.*) and the final rise of a yes–no question (*You're going?*). Tones are defined relative to the speaker's own pitch range, not in absolute hertz.`,
      idea: String.raw`In the source–filter model (ling-1.1) pitch belongs to the source and formants to the filter, so a language can vary $f_0$ freely without changing the vowels, and use it as an independent channel. Chao (1930) described tones by five levels spanning the speaker's range, a notation still in use. Because men, women and children have very different ranges, listeners judge a tone by its shape and by its position relative to the speaker's range (a normalisation like that of ling-1.10). Intonation contours ride on a gradual decline of pitch through the phrase (declination), and in tone languages the two interact.`,
      caption: String.raw`Drag the five **gold** points to draw the pitch contour of the syllable; the vowel is resynthesized with exactly that contour, and the narrow-band spectrogram shows its harmonics following it. In Mandarin mode the faint curves are the four tones in Chao's notation, scaled to this speaker's range, and the readout names the tone your contour is closest to (with Chao numbers read off it) and so the word you would be saying. Switch to English to shape the final pitch movement of *you're going*: a rise makes it a question. Presets put in textbook contours.`,
      deps: ['ling-1.1'],
      refs: ['Ladefoged & Johnson'],
      tags: ['tone', 'intonation'],
      credit: 'Y. R. Chao, 1930 (tone letters)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Tone_(linguistics)' },
      viz(v) {
        const M = v.M, LO = 100, HI = 200;
        const lv = (L) => LO * Math.pow(HI / LO, (L - 1) / 4), Lof = (f) => 1 + (4 * Math.log(f / LO)) / Math.log(HI / LO);
        const TONES = [{ n: 1, ch: '55', w: 'mā', g: 'mother', L: [5, 5, 5, 5, 5] }, { n: 2, ch: '35', w: 'má', g: 'hemp', L: [3, 3.2, 3.6, 4.3, 5] }, { n: 3, ch: '214', w: 'mǎ', g: 'horse', L: [2.1, 1.5, 1.1, 2.0, 3.8] }, { n: 4, ch: '51', w: 'mà', g: 'scold', L: [5, 4.3, 3.3, 2.1, 1.1] }];
        const mode = v.select('language', [{ value: 'zh', label: 'Mandarin [ma]' }, { value: 'en', label: 'English “you’re going”' }], 'zh', { onChange: () => preset(mode.value === 'zh' ? TONES[2].L.map(lv) : EN.q) });
        const EN = { s: [150, 160, 150, 130, 95], q: [150, 158, 148, 135, 205], phones: ['j', ['u', 0.13], 'ɹ', ['ɡ', 0.06], ['o', 0.12], ['ɪ', 0.07], ['ŋ', 0.1]] };
        const pc = v.stage({ x: [0, 0.5], y: [80, 225], height: 300, axes: 'box', minWidth: 300, weight: 1.2, title: 'pitch contour $f_0(t)$ (Hz)', xlabel: 'time (s)' });
        const sg = v.stage({ x: [0, 0.5], y: [0, 1600], height: 300, axes: 'box', minWidth: 250, title: 'narrow-band spectrogram (harmonics)', yticks: [[0, '0'], [400, '400'], [800, '800'], [1200, '1200'], [1600, '1600 Hz']] });
        const cache = new Map();
        const utter = () => {
          const key = mode.value; if (cache.has(key)) return cache.get(key);
          const r0 = mode.value === 'zh' ? speak(['m', ['a', 0.36]], { lead: 0.04, tail: 0.04 }) : speak(EN.phones, { lead: 0.04, tail: 0.05 });
          const t0 = mode.value === 'zh' ? r0.segs[0].t0 + 0.02 : r0.segs[0].t0, t1 = r0.segs[r0.segs.length - 1].t1 - 0.01;
          const out = { dur: r0.dur, t0, t1, phones: mode.value === 'zh' ? ['m', ['a', 0.36]] : EN.phones }; cache.set(key, out); return out;
        };
        const hs = M.range(5).map((i) => pc.handle(0.1 + 0.08 * i, 150, { color: 'gold', r: 8 }));
        const place = () => { const u = utter(); hs.forEach((h, i) => { h.x = u.t0 + ((u.t1 - u.t0) * i) / 4; h.constrain = (x, y) => [h.x, clampN(y, 85, 220)]; }); };
        const preset = (fs) => { place(); hs.forEach((h, i) => h.set(h.x, fs[i])); };
        // contour: cubic interpolation through the five points, flat outside
        const contour = (t) => { const u = utter(), pts = hs.map((h) => [h.x, h.y]); if (t <= pts[0][0]) return pts[0][1]; if (t >= pts[4][0]) return pts[4][1]; const c = catmullAt(pts, t); return clampN(c, 70, 260); };
        const catmullAt = (P, t) => { let i = 0; while (i < 3 && P[i + 1][0] < t) i++; const p0 = P[Math.max(0, i - 1)][1], p1 = P[i][1], p2 = P[i + 1][1], p3 = P[Math.min(4, i + 2)][1], u = (t - P[i][0]) / (P[i + 1][0] - P[i][0]); return 0.5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u); };
        preset(TONES[2].L.map(lv));
        TONES.forEach((T) => { T.btn = v.button(T.w, () => preset(T.L.map(lv))); });
        const bS = v.button('statement', () => preset(EN.s)), bQ = v.button('question', () => preset(EN.q));
        let sound = { key: null };
        const render = () => {
          const key = mode.value + hs.map((h) => Math.round(h.y)).join(); if (sound.key === key) return sound;
          const u = utter(), r = speak(u.phones, { lead: 0.04, tail: mode.value === 'zh' ? 0.04 : 0.05, f0: contour });
          sound = { key, buf: r.buf, dur: r.dur, S: stft(M, r.buf, { win: 0.035, hop: 0.004, fmax: 1600, nfft: 2048 }) };
          return sound;
        };
        v.soundButton('Listen', (snd) => snd.samples(normalise(render().buf.slice(), 0.85, 0.01), SR, { gain: 0.6 }));
        let info = null;
        v.render(() => {
          const zh = mode.value === 'zh', u = utter(), S = render();
          TONES.forEach((T) => { T.btn.hidden = !zh; }); bS.hidden = zh; bQ.hidden = zh;
          pc.setView([0, u.dur], [80, 225]); sg.setView([0, u.dur], [0, 1600]);
          if (zh) {
            for (let L = 1; L <= 5; L++) { pc.hline(lv(L), { color: 'grid', width: 1 }); pc.text(`${L}`, u.dur - 0.004, lv(L), { size: 10.5, color: 'muted', align: 'right' }); }
            TONES.forEach((T) => { const pts = M.range(41).map((k) => { const t = u.t0 + ((u.t1 - u.t0) * k) / 40, x = (4 * k) / 40, i = Math.min(3, Math.floor(x)), a = x - i; return [t, lv(T.L[i] + (T.L[i + 1] - T.L[i]) * a)]; }); pc.path(pts, { color: 'muted', width: 1.2, dash: [4, 4], alpha: 0.7 }); pc.text(`tone ${T.n}`, pts[T.n === 3 ? 22 : 20][0], pts[T.n === 3 ? 22 : 20][1] + (T.n === 4 ? -7 : 7), { size: 10.5, color: 'muted', align: 'center' }); });
          } else { pc.vband(u.t0 + 0.7 * (u.t1 - u.t0), u.t1, { color: 'accent', alpha: 0.06 }); pc.text('final movement', u.t0 + 0.85 * (u.t1 - u.t0), 218, { size: 10.5, color: 'accent', align: 'center' }); }
          pc.curve((t) => [t, contour(t)], u.t0, u.t1, { color: 'gold', width: 2.6, n: 160 });
          drawSpec(sg, S.S, v.rgb('ink'), { key: S.key, range: 45 });
          // classification
          if (zh) {
            const Ls = M.range(5).map((i) => Lof(contour(u.t0 + ((u.t1 - u.t0) * i) / 4)));
            let best = 0, bd = 1e9; TONES.forEach((T, k) => { const d = Math.sqrt(M.mean(T.L.map((L, i) => (L - Ls[i]) ** 2))); if (d < bd) { bd = d; best = k; } });
            const r5 = (L) => clampN(Math.round(L), 1, 5), mn = Math.min(...Ls.slice(1, 4)), chao = Ls[0] > mn + 0.7 && Ls[4] > mn + 0.7 ? `${r5(Ls[0])}${r5(mn)}${r5(Ls[4])}` : `${r5(Ls[0])}${r5(Ls[4])}`;
            info = { zh, T: TONES[best], d: bd, chao };
          } else {
            const a = contour(u.t0 + 0.7 * (u.t1 - u.t0)), b = contour(u.t1), st = (12 * Math.log2(b / a));
            info = { zh, st, q: st > 1.5 };
          }
        });
        v.readout(() => info && (info.zh
          ? `your contour ≈ Chao **${info.chao}** · closest tone: **${info.T.n}** (${info.T.ch}), so the syllable reads **${info.T.w}** ‘${info.T.g}’${info.d > 0.9 ? ' (but not a good match to any tone)' : ''}`
          : `final pitch movement ${info.st >= 0 ? '+' : '−'}${v.fix(Math.abs(info.st), 1)} semitones: heard as a **${info.q ? 'question' : 'statement'}** (*You’re going${info.q ? '?' : '.'}*)`));
      },
    },
  ],
};
