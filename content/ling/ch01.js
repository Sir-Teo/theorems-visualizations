// Linguistics & Language — Chapter 1: Phonetics: the sounds of speech

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
  if (lf < 1.2) return { ff: lf < 0.2 ? 1800 : 6500, fb: lf < 0.2 ? 5000 : 6000, amp: lf < 0.2 ? 0.45 : 0.1 };
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

// ---------- the vocal tract in mid-sagittal section (cm; face to the LEFT, x grows toward the back, y up) ----------
/** Upper wall from the lips to the glottis: lips, incisors, alveolar ridge, hard palate, velum, uvula, pharynx wall, larynx. */
const WALL = [[0.0, 0.25], [0.6, 0.35], [0.95, 0.05], [1.25, 0.45], [1.7, 0.85], [2.4, 1.35], [3.3, 1.7], [4.3, 1.85], [5.3, 1.7], [6.1, 1.3], [6.8, 0.6], [7.4, -0.2], [7.9, -1.0], [8.1, -2.5], [8.1, -4.5], [7.9, -6.5], [7.6, -8.0], [7.3, -8.9]];
/** Cumulative arc length of a polyline. */
function arcLen(P) { const s = [0]; for (let i = 1; i < P.length; i++) s.push(s[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1])); return s; }
const WALL_S = arcLen(WALL);
/** Point at arc length s along a polyline, with the unit normal pointing down into the airway. */
function along(P, S, s) {
  let i = 1; while (i < P.length - 1 && S[i] < s) i++;
  const t = Math.max(0, Math.min(1, (s - S[i - 1]) / (S[i] - S[i - 1]))), a = P[i - 1], b = P[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  return { x: a[0] + t * (b[0] - a[0]), y: a[1] + t * (b[1] - a[1]), nx: (b[1] - a[1]) / L, ny: -(b[0] - a[0]) / L };
}
/** Nearest point on a polyline: {x, y, s (arc length), d (distance)}. */
function nearestOn(P, S, x, y) {
  let best = { d: 1e9 };
  for (let i = 1; i < P.length; i++) {
    const a = P[i - 1], b = P[i], abx = b[0] - a[0], aby = b[1] - a[1], L2 = abx * abx + aby * aby;
    const t = Math.max(0, Math.min(1, ((x - a[0]) * abx + (y - a[1]) * aby) / L2)), px = a[0] + t * abx, py = a[1] + t * aby, d = Math.hypot(x - px, y - py);
    if (d < best.d) best = { x: px, y: py, d, s: S[i - 1] + t * Math.sqrt(L2) };
  }
  return best;
}
/** Catmull–Rom spline through control points. */
function catmull(pts, n = 7) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t; out.push([0, 1].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3))); }
  }
  out.push(pts[pts.length - 1]); return out;
}
/** Jaw opening (0 closed … 1 open) for a tongue-body height hy. */
const jawOf = (hy) => clampN((1.2 - hy) / 2.4, 0, 1);
/**
 * Tongue control points for a tongue-body (dorsum) position (hx, hy): tip behind the lower incisors, the dorsum hump,
 * and a root that is pulled forward for high front vowels and pushed back into the pharynx for low back ones.
 */
function tongueCtl(hx, hy) {
  const jaw = jawOf(hy), gph = clampN(1.189 + 0.571 * (hy + 0.2) - 0.775 * (hx - 4.5), 0.35, 2.8), bk = clampN((hx - 4.4) / 1.4, 0, 1);
  const tipY = -0.65 - 0.85 * jaw;
  return [[1.55, tipY - 0.8], [1.15, tipY], [Math.max(1.6, hx - 2.2), (tipY + hy) / 2 - 0.15], [hx - 1.15, hy - 0.3], [hx, hy], [hx + 1.1 - 0.35 * bk, hy - 0.35 - 0.55 * bk],
    [Math.min(7.95 - gph, hx + 1.9), hy - 1.2], [7.95 - gph, Math.min(hy - 2.4, -2.2)], [8.0 - 0.85 * gph - 0.15, -4.6], [6.95, -6.1], [6.75, -7.4], [6.9, -8.9]];
}
/** Smallest distance from the tongue (minus its laryngeal end) to the upper wall. */
function tongueGap(pts) { let g = 1e9; for (let i = 0; i < pts.length - 20; i += 2) g = Math.min(g, nearestOn(WALL, WALL_S, pts[i][0], pts[i][1]).d); return g; }
/** Lower the tongue body until it clears the wall by gmin (cm): the handle cannot push the tongue through the palate. */
function fitTongue(hx, hy, gmin = 0.3) { for (let k = 0; k < 60 && tongueGap(catmull(tongueCtl(hx, hy), 4)) < gmin; k++) hy -= 0.05; return hy; }
/**
 * Area function (cm², glottis → lips, sections dl long) read off the drawing: wall-to-tongue distance d → area by a
 * power law (Heinz & Stevens' rule, coefficients fitted so the model's vowels land near measured ones), plus a lip tube
 * whose opening follows the jaw and whose width and length follow rounding.
 */
function areaFunction(hx, hy, round) {
  const pts = catmull(tongueCtl(hx, hy), 7), L = WALL_S[WALL_S.length - 1], A = [], dl = 0.5;
  for (let s = 1.07 + dl / 2; s < L; s += dl) {
    const w = along(WALL, WALL_S, s), d = nearestOn(pts, arcLen(pts), w.x, w.y).d;
    const [a, b] = w.y < -1.0 ? [2.018, 1.445] : w.x < 3.0 ? [4.97, 1.084] : [1.203, 2.182];
    A.push(Math.max(0.05, a * Math.pow(d, b)));
  }
  A.reverse();
  const jaw = jawOf(hy), lipA = Math.max(0.1, (0.3585 + 1.237 * jaw) * (round ? 2.231 : 3.488) * 0.8);
  for (let i = 0; i < (round ? 4 : 2); i++) A.push(lipA);
  return { A, dl: dl * 0.92, lipA };
}
/**
 * Lossless concatenated tubes (areas A[i] from the glottis to the lips, each dl cm), open at the lips (p = 0).
 * Returns [u, p]: the glottal volume velocity and pressure that produce unit volume velocity at the lips.
 * A closed glottis resonates where u = 0; an open one where p = 0. U_lips/U_glottis = 1/u.
 */
function tubeUP(A, dl, f) {
  const k = (2 * Math.PI * f) / C_TRACT, c = Math.cos(k * dl), sn = Math.sin(k * dl);
  let p = 0, u = 1;
  for (let i = A.length - 1; i >= 0; i--) { const Z = 1 / A[i], p2 = c * p + Z * sn * u; u = c * u - (sn * p) / Z; p = p2; }
  return [u, p];
}
/** First n resonances (Hz) of the tube: closed at the glottis (default) or open at both ends. */
function tubeFormants(A, dl, n = 4, openGlottis = false, fmax = 7000) {
  const g = (f) => tubeUP(A, dl, f)[openGlottis ? 1 : 0], out = [];
  let g0 = g(20);
  for (let f = 40; f < fmax && out.length < n; f += 20) {
    const g1 = g(f);
    if (g0 * g1 < 0) { let a = f - 20, b = f, ga = g0; for (let it = 0; it < 30; it++) { const m = (a + b) / 2, gm = g(m); if (ga * gm <= 0) b = m; else { a = m; ga = gm; } } out.push((a + b) / 2); }
    g0 = g1;
  }
  return out;
}
/** Head above the nasal cavity and behind the pharynx (face to the left; the airways are left unfilled). */
const HEAD_UP = [[-0.5, 6.8], [-0.9, 3.8], [-1.55, 3.0], [-2.25, 2.2], [-2.35, 1.9], [-2.0, 1.65], [-1.3, 1.55], [-0.75, 2.6], [0.6, 3.25], [2.6, 3.6], [5.6, 3.65], [7.6, 3.2], [8.35, 2.3], [8.3, 1.2], [8.2, 0.4],
  [7.9, -1.0], [8.1, -2.5], [8.1, -4.5], [7.9, -6.5], [7.6, -8.0], [7.3, -8.9], [7.3, -10.5], [12.5, -10.5], [12.5, 6.8]];
/** Nasal floor (upper surface of the palate), from the velum forward to the nostril. */
const NASAL_FLOOR = [[5.3, 2.1], [4.3, 2.25], [3.3, 2.1], [2.4, 1.75], [1.7, 1.25], [0.3, 1.35], [-1.3, 1.55]];
/** Velum outlines from the end of the hard palate: lower surface, uvula, back and upper surface (raised: sealed against the back wall). */
const VELUM = {
  up: [[6.1, 1.3], [6.8, 0.6], [7.4, -0.2], [7.8, 0.05], [8.18, 0.45], [7.5, 1.35], [6.4, 1.95]],
  down: [[6.1, 1.2], [6.55, 0.35], [6.85, -0.45], [7.15, -0.15], [7.3, 0.7], [6.9, 1.6], [6.2, 2.0]],
};
/**
 * Draw the vocal tract. cfg: {hx, hy (tongue body), round, ctl (custom tongue control points), lipGap (cm between the lips,
 * for labials), teethGap (lower lip to upper teeth, for labiodentals), velum: 'up' | 'down', glottis: 'voiced' | 'voiceless' |
 * 'closed' | 'breathy', mark: {x, y, color}, noise: [x, y] (frication), labels}.
 */
function drawTract(s, cfg) {
  const hy = cfg.hy ?? 0.4, J = 1.05 * jawOf(hy), ctl = cfg.ctl || tongueCtl(cfg.hx ?? 4.5, hy), tg = catmull(ctl, 7);
  const rnd = cfg.round ? 1 : 0, vel = cfg.velum === 'down' ? 'down' : 'up';
  const ulx = -0.72 - 0.45 * rnd, uly = 0.27 - 0.06 * rnd;
  let llEdgeY = -0.2 - J + 0.25 * rnd, llEdgeX = -0.7 - 0.45 * rnd;
  if (cfg.lipGap != null) { llEdgeY = uly - 0.03 - cfg.lipGap; llEdgeX = ulx + 0.1; }
  if (cfg.teethGap != null) { llEdgeY = 0.05 - cfg.teethGap; llEdgeX = 0.82; }
  const tissue = { fill: 'faint', fillAlpha: 0.34, color: 'muted', width: 1.1 };
  // upper head, palate block (upper lip, teeth ridge, hard palate, velum) and lower jaw with the tongue
  s.poly(HEAD_UP, tissue);
  const upLip = [[-1.3, 1.55], [-1.0, 1.25], [-0.98, 0.85], [-1.05 - 0.4 * rnd, 0.5], [ulx - 0.05, uly + 0.05], [ulx, uly], [-0.35 - 0.3 * rnd, 0.2], [0.0, 0.25]];
  const palate = [...upLip, ...WALL.slice(1, 9), ...VELUM[vel], ...NASAL_FLOOR.slice(0, -1)];
  s.poly(palate, tissue);
  s.poly([[5.3, 1.7], ...VELUM[vel], [5.3, 2.1]], { fill: 'pink', fillAlpha: 0.16, color: 'muted', width: 1.1 });
  const lowLip = [[llEdgeX, llEdgeY], [0.05, llEdgeY - 0.05], [0.55, -0.55 - J], [0.82, -0.7 - J]];
  const jawOut = [[6.9, -10.5], [5.8, -10.5], [5.8, -9.6], [5.6, -6.6], [5.2, -5.2], [3.6, -4.1 - 0.4 * J], [1.6, -3.4 - 0.8 * J], [0.2, -3.05 - J], [-0.55, -2.6 - J], [-0.8, -1.7 - J], [-1.0, -1.0 - J], [-1.05 - 0.35 * rnd, -0.45 - J], [llEdgeX - 0.1, llEdgeY - 0.15]];
  s.poly([...lowLip, ...tg.filter((p) => p[1] > -9.0), ...jawOut], tissue);
  // tongue
  s.poly([...tg, [6.3, -6.2], [5.0, -4.3 - 0.3 * J], [3.2, -3.1 - 0.7 * J], [1.9, -2.2 - 0.9 * J], [1.4, -1.5 - J]], { fill: 'pink', fillAlpha: 0.45, stroke: false });
  s.path(tg, { color: 'red', width: 1.8 });
  // teeth
  s.poly([[0.62, 0.62], [1.3, 0.62], [1.25, 0.45], [0.95, 0.05], [0.68, 0.3]], { fill: 'panel', fillAlpha: 1, color: 'muted', width: 1.1 });
  s.poly([[0.95, -0.12 - J], [1.12, -0.05 - J], [1.25, -0.55 - J], [1.05, -0.9 - J], [0.8, -0.72 - J]], { fill: 'panel', fillAlpha: 1, color: 'muted', width: 1.1 });
  // airway walls
  s.path([[ulx, uly], [-0.35 - 0.3 * rnd, 0.2], ...WALL.slice(0, 9), ...VELUM[vel].slice(0, 3)], { color: 'ink', width: 1.7 });
  s.path(WALL.slice(12), { color: 'ink', width: 1.7 });
  s.path([[0.6, -0.42 - J], [0.05, llEdgeY - 0.05], [llEdgeX, llEdgeY]], { color: 'ink', width: 1.7 });
  // glottis: vocal folds seen in section, and a top-view inset
  const gs = cfg.glottis || 'voiced', gy = -8.55, gap = gs === 'voiceless' ? 0.36 : gs === 'closed' ? 0 : gs === 'breathy' ? 0.18 : 0.06, midG = 7.1;
  s.poly([[6.85, gy + 0.22], [midG - gap / 2, gy], [6.85, gy - 0.22]], { fill: 'muted', fillAlpha: 0.9, stroke: false });
  s.poly([[7.4, gy + 0.22], [midG + gap / 2, gy], [7.4, gy - 0.22]], { fill: 'muted', fillAlpha: 0.9, stroke: false });
  const ix = 1.2, iy = -7.6, op = gs === 'voiceless' ? 0.42 : gs === 'closed' ? 0.0 : gs === 'breathy' ? 0.22 : 0.05;
  s.circle(ix, iy, 0.95, { color: 'muted', width: 1, fill: 'faint', fillAlpha: 0.25 });
  for (const sg of [-1, 1]) {
    if (gs === 'voiced' || gs === 'breathy') s.curve((u) => [ix + sg * ((op * (1 + u)) / 2 + 0.035 * Math.sin(u * 18)), iy + 0.72 - (1.44 * (u + 1)) / 2], -1, 1, { color: 'ink', width: 2.2, n: 60 });
    else s.line(ix, iy + 0.72, ix + sg * op, iy - 0.72, { color: 'ink', width: 2.6 });
  }
  s.text(gs === 'closed' ? 'glottis shut' : gs === 'voiceless' ? 'glottis open' : gs === 'breathy' ? 'breathy voice' : 'vocal folds vibrate', ix, iy - 1.3, { align: 'center', size: 11, color: 'muted' });
  s.text('glottis from above', ix, iy + 1.25, { align: 'center', size: 10, color: 'muted' });
  if (cfg.noise) { const [nx, ny] = cfg.noise; for (let k = 0; k < 3; k++) s.curve((u) => [nx - 0.25 - 0.3 * k + 0.07 * Math.sin(u * 9), ny + (u - 0.5) * 0.45], 0, 1, { color: 'orange', width: 1.5, n: 24 }); }
  if (vel === 'down' && cfg.nasalArrow !== false) s.arrow(5.0, 2.95, -0.6, 2.4, { color: 'teal', width: 2, head: 7 });
  if (cfg.mark) s.dot(cfg.mark.x, cfg.mark.y, { r: 5, color: cfg.mark.color || 'gold' });
  if (cfg.labels) {
    const L = (t, x, y, al = 'center') => s.text(t, x, y, { size: 10.5, color: 'muted', align: al });
    L('nasal cavity', 3.4, 2.95); L('velum', 6.6, 2.35); L('hard palate', 3.6, 1.15); L('pharynx', 8.75, -3.4, 'left'); L('larynx', 7.75, -8.0, 'left'); L('tongue', 3.6, -2.0 - 0.6 * J);
  }
}

// ---------- the IPA charts ----------
const PLACES = ['bilabial', 'labiodental', 'dental', 'alveolar', 'postalveolar', 'retroflex', 'palatal', 'velar', 'uvular', 'pharyngeal', 'glottal'];
const PLACE_HEAD = [['Bilabial'], ['Labio-', 'dental'], ['Dental'], ['Alveolar'], ['Post-', 'alveolar'], ['Retro-', 'flex'], ['Palatal'], ['Velar'], ['Uvular'], ['Pharyn-', 'geal'], ['Glottal']];
/** Pulmonic consonant chart rows: [manner, label, cells [firstCol, lastCol, voiceless, voiced], shaded (impossible) cells [col, half: 0 both, 2 voiced]]. */
const IPA_ROWS = [
  ['plosive', 'Plosive', [[0, 0, 'p', 'b'], [2, 4, 't', 'd'], [5, 5, 'ʈ', 'ɖ'], [6, 6, 'c', 'ɟ'], [7, 7, 'k', 'ɡ'], [8, 8, 'q', 'ɢ'], [10, 10, 'ʔ', null]], [[9, 0], [10, 2]]],
  ['nasal', 'Nasal', [[0, 0, null, 'm'], [1, 1, null, 'ɱ'], [2, 4, null, 'n'], [5, 5, null, 'ɳ'], [6, 6, null, 'ɲ'], [7, 7, null, 'ŋ'], [8, 8, null, 'ɴ']], [[9, 0], [10, 0]]],
  ['trill', 'Trill', [[0, 0, null, 'ʙ'], [2, 4, null, 'r'], [8, 8, null, 'ʀ']], [[7, 0], [10, 0]]],
  ['tap', 'Tap or flap', [[1, 1, null, 'ⱱ'], [2, 4, null, 'ɾ'], [5, 5, null, 'ɽ']], [[7, 0], [10, 0]]],
  ['fricative', 'Fricative', [[0, 0, 'ɸ', 'β'], [1, 1, 'f', 'v'], [2, 2, 'θ', 'ð'], [3, 3, 's', 'z'], [4, 4, 'ʃ', 'ʒ'], [5, 5, 'ʂ', 'ʐ'], [6, 6, 'ç', 'ʝ'], [7, 7, 'x', 'ɣ'], [8, 8, 'χ', 'ʁ'], [9, 9, 'ħ', 'ʕ'], [10, 10, 'h', 'ɦ']], []],
  ['latfric', 'Lateral fric.', [[2, 4, 'ɬ', 'ɮ']], [[0, 0], [1, 0], [9, 0], [10, 0]]],
  ['approx', 'Approximant', [[1, 1, null, 'ʋ'], [2, 4, null, 'ɹ'], [5, 5, null, 'ɻ'], [6, 6, null, 'j'], [7, 7, null, 'ɰ']], [[10, 0]]],
  ['latapprox', 'Lateral approx.', [[2, 4, null, 'l'], [5, 5, null, 'ɭ'], [6, 6, null, 'ʎ'], [7, 7, null, 'ʟ']], [[0, 0], [1, 0], [9, 0], [10, 0]]],
];
const MANNER_NAME = { plosive: 'plosive', nasal: 'nasal', trill: 'trill', tap: 'tap', fricative: 'fricative', latfric: 'lateral fricative', approx: 'approximant', latapprox: 'lateral approximant' };
/** Example words (a language where the sound is a regular consonant). */
const IPA_EX = {
  p: 'English *pin*', b: 'English *bin*', t: 'English *tin*', d: 'English *din*', ʈ: 'Hindi *ṭamāṭar* ‘tomato’', ɖ: 'Hindi *ḍar* ‘fear’', c: 'Hungarian *tyúk* ‘hen’', ɟ: 'Hungarian *gyár* ‘factory’',
  k: 'English *kin*', ɡ: 'English *go*', q: 'Arabic *qalb* ‘heart’', ɢ: 'Persian *qand* ‘sugar’', ʔ: 'English *uh-oh*', m: 'English *man*', ɱ: 'English *comfort* (before f)', n: 'English *no*',
  ɳ: 'Swedish *barn* ‘child’', ɲ: 'Spanish *año* ‘year’', ŋ: 'English *sing*', ɴ: 'Japanese *san* ‘three’ (at the end of a phrase)', ʙ: 'Kele (Papua New Guinea)', r: 'Spanish *perro* ‘dog’',
  ʀ: 'German *rot* (some speakers)', ⱱ: 'Mono (Congo)', ɾ: 'Spanish *pero* ‘but’; American *water*', ɽ: 'Hindi *baṛā* ‘big’', ɸ: 'Japanese *fuji*', β: 'Spanish *haba* ‘bean’', f: 'English *fan*',
  v: 'English *van*', θ: 'English *thin*', ð: 'English *then*', s: 'English *sip*', z: 'English *zip*', ʃ: 'English *ship*', ʒ: 'English *vision*', ʂ: 'Mandarin *shī* ‘poem’', ʐ: 'Russian *žuk* ‘beetle’',
  ç: 'German *ich* ‘I’', ʝ: 'Spanish *mayo* (many dialects)', x: 'German *Bach*', ɣ: 'Spanish *lago* ‘lake’', χ: 'Arabic *xubz* ‘bread’ (many dialects)', ʁ: 'French *rouge* ‘red’', ħ: 'Arabic *ḥubb* ‘love’',
  ʕ: 'Arabic *ʿayn* ‘eye’', h: 'English *hat*', ɦ: 'Czech *hora* ‘mountain’', ɬ: 'Welsh *llan* ‘church’', ɮ: 'Zulu *dlala* ‘play’', ʋ: 'Dutch *wat* ‘what’', ɹ: 'English *red*', ɻ: 'Mandarin *rén* ‘person’',
  j: 'English *yes*', ɰ: 'Spanish *agua* (relaxed g)', l: 'English *leaf*', ɭ: 'Swedish *Karl*', ʎ: 'Italian *figlio* ‘son’', ʟ: 'Mid-Waghi (New Guinea)',
};
/** IPA vowels: [symbol, height 0 (open) … 3 (close), backness 0 (front) … 1 (back), rounded, example]. */
const IPA_V = [
  ['i', 3, 0, 0, 'English *see*'], ['y', 3, 0, 1, 'French *tu*'], ['ɨ', 3, 0.5, 0, 'Russian *ty* ‘you’'], ['ʉ', 3, 0.5, 1, 'Swedish *ful* (approx.)'], ['ɯ', 3, 1, 0, 'Korean *eu* (ㅡ)'], ['u', 3, 1, 1, 'French *tout*'],
  ['ɪ', 2.5, 0.2, 0, 'English *sit*'], ['ʏ', 2.5, 0.2, 1, 'German *hübsch*'], ['ʊ', 2.5, 0.8, 1, 'English *put*'],
  ['e', 2, 0, 0, 'French *été*'], ['ø', 2, 0, 1, 'French *peu*'], ['ɘ', 2, 0.5, 0, 'rare as a separate vowel'], ['ɵ', 2, 0.5, 1, 'Swedish *full*'], ['ɤ', 2, 1, 0, 'Mandarin *è* ‘hungry’'], ['o', 2, 1, 1, 'French *eau*'],
  ['ə', 1.5, 0.5, 0, 'English *sofa* (2nd vowel)'],
  ['ɛ', 1, 0, 0, 'English *bed*'], ['œ', 1, 0, 1, 'French *peur*'], ['ɜ', 1, 0.5, 0, 'English *bird* (British)'], ['ɞ', 1, 0.5, 1, 'rare as a separate vowel'], ['ʌ', 1, 1, 0, 'English *cup* (older RP)'], ['ɔ', 1, 1, 1, 'British English *thought*'],
  ['æ', 0.5, 0, 0, 'English *cat*'], ['ɐ', 0.5, 0.5, 0, 'German *besser* (final)'],
  ['a', 0, 0, 0, 'Spanish *casa*'], ['ɶ', 0, 0, 1, 'rare; some Danish and Swedish dialects'], ['ɑ', 0, 1, 0, 'English *father*'], ['ɒ', 0, 1, 1, 'British English *lot*'],
];
/** Measured average formants (F1, F2 in Hz) of the 16 cardinal vowels [height, back, round] (male speakers; widely tabulated values). */
const CARD = [[3, 0, 0, 240, 2400], [2, 0, 0, 390, 2300], [1, 0, 0, 610, 1900], [0, 0, 0, 850, 1610], [3, 0, 1, 235, 2100], [2, 0, 1, 370, 1900], [1, 0, 1, 585, 1710], [0, 0, 1, 820, 1530],
  [3, 1, 0, 300, 1390], [2, 1, 0, 460, 1310], [1, 1, 0, 600, 1170], [0, 1, 0, 750, 940], [3, 1, 1, 250, 595], [2, 1, 1, 360, 640], [1, 1, 1, 500, 700], [0, 1, 1, 700, 760]];
/** Formants of a vowel at chart position (height h, backness b, rounding r): bilinear interpolation between the cardinal vowels. */
function chartFormants(h, b, r) {
  const at = (bb, rr, k) => { const col = CARD.filter((c) => c[1] === bb && c[2] === rr).sort((p, q) => p[0] - q[0]); const i = Math.min(2, Math.floor(h)), u = h - i; return col[i][k] + (col[i + 1][k] - col[i][k]) * u; };
  const F1 = (1 - b) * at(0, r, 3) + b * at(1, r, 3), F2 = (1 - b) * at(0, r, 4) + b * at(1, r, 4);
  return [F1, F2, Math.max(F2 + 300, 2350 + 0.2 * (F2 - 1500) - 150 * r)];
}
/** Where a place's articulator meets the upper wall (arc length from the lips, cm). */
const PLACE_S = { dental: 1.35, alveolar: 2.15, postalveolar: 2.75, retroflex: 3.4, palatal: 4.6, velar: 6.7, uvular: 8.5, pharyngeal: 11.6 };
/** Which articulator makes a constriction at arc length s from the lips (cm). */
const regionAt = (s) => (s <= 0.45 ? 'bilabial' : s <= 1.4 ? 'dental' : s <= 2.5 ? 'alveolar' : s <= 3.05 ? 'postalveolar' : s <= 3.8 ? 'retroflex' : s <= 5.8 ? 'palatal' : s <= 7.9 ? 'velar' : s <= 9.4 ? 'uvular' : s <= 16 ? 'pharyngeal' : 'glottal');
/** Tongue control points for a constriction of width `gap` (cm) at a place, optionally at arc length sAt (the rest of the tongue near neutral). */
function consCtl(place, gap, sAt) {
  const s = sAt ?? PLACE_S[place]; if (s == null || place === 'bilabial' || place === 'glottal') return tongueCtl(4.6, 0.2);
  const w = along(WALL, WALL_S, s), tx = w.x + w.nx * gap, ty = w.y + w.ny * gap;
  if (place === 'dental' || place === 'alveolar' || place === 'postalveolar') {
    const c = tongueCtl(4.7, 0.0); c[0] = [tx + 0.45, ty - 0.75]; c[1] = [tx, ty]; c[2] = [tx + 0.75, ty - 0.2]; c[3] = [tx + 1.7, Math.min(ty - 0.35, 0.6)]; return c;
  }
  if (place === 'retroflex') { const c = tongueCtl(4.7, 0.0); c[0] = [tx - 0.55, ty - 0.55]; c[1] = [tx, ty]; c[2] = [tx + 0.75, ty - 0.45]; c[3] = [tx + 1.6, 0.35]; return c; }
  if (place === 'palatal' || place === 'velar') { const c = tongueCtl(tx, ty); c[4] = [tx, ty]; return c; }
  if (place === 'uvular') { const c = tongueCtl(5.7, 0.4); c[5] = [tx, ty]; c[4] = [5.9, 0.55]; return c; }
  const c = tongueCtl(5.0, -0.2); c[7] = [tx, ty]; c[6] = [7.2, -1.2]; return c; // pharyngeal: the root is pulled back
}
/** Drawing configuration of the vocal tract for an IPA consonant symbol. */
function consCfg(sym) {
  const [place, mn, vc] = CONS[sym];
  const gap = mn === 'plosive' || mn === 'nasal' || mn === 'latapprox' ? 0 : mn === 'trill' || mn === 'tap' ? 0.03 : mn === 'fricative' || mn === 'latfric' ? 0.1 : 0.45;
  const cfg = { hy: 0.9, velum: mn === 'nasal' ? 'down' : 'up', glottis: sym === 'ʔ' ? 'closed' : sym === 'ɦ' ? 'breathy' : vc ? 'voiced' : 'voiceless', ctl: consCtl(place, gap) };
  if (place === 'bilabial' || place === 'labial-velar') { cfg.lipGap = place === 'labial-velar' ? 0.3 : gap; cfg.ctl = place === 'labial-velar' ? consCtl('velar', 0.45) : tongueCtl(4.6, 0.2); if (place === 'labial-velar') cfg.round = true; }
  if (place === 'labiodental') { cfg.teethGap = gap; cfg.ctl = tongueCtl(4.6, 0.2); }
  const ws = place === 'bilabial' ? [ -0.65, 0.2] : place === 'labiodental' ? [0.85, 0.04] : PLACE_S[place] != null ? (() => { const w = along(WALL, WALL_S, PLACE_S[place]); return [w.x + w.nx * gap / 2, w.y + w.ny * gap / 2]; })() : [7.13, -8.55];
  cfg.mark = { x: ws[0], y: ws[1], color: 'gold' };
  if (mn === 'fricative' || mn === 'latfric') cfg.noise = [ws[0] + (place === 'bilabial' ? -0.2 : 0), ws[1] - 0.25];
  if (place === 'glottal' && mn === 'fricative') cfg.noise = null;
  return cfg;
}

export default {
  collection: 'ling',
  chapter: 1,
  title: 'Phonetics: the sounds of speech',
  summary: String.raw`Speech is sound shaped by the vocal tract: the larynx supplies a buzz or a hiss, and the tongue, lips and velum filter it. Articulatory phonetics classifies consonants by place, manner and voicing and vowels by tongue position and lip rounding, and the International Phonetic Alphabet gives each sound one symbol. Acoustically, vowels are identified by their formants, the resonances of the tract, so the vowel chart can be measured from a recording; a 17 cm tube already explains where those resonances sit. Perception then imposes its own structure on the continuous signal: it normalises away differences between speakers, hears categories where the acoustics vary smoothly, and uses pitch to carry tone and intonation.`,
  items: [
    // ------------------------------------------------------------------ 1.1
    {
      num: '1.1',
      kind: 'Model',
      name: 'Speech production as source and filter',
      statement: String.raw`A speech sound is produced by a **source** and shaped by a **filter**. The source is either the quasi-periodic puffs of air let through by the vibrating vocal folds (voicing), turbulent noise at a narrowing (whisper, aspiration, frication), or both. The filter is the air in the vocal tract from the larynx to the lips (and the nose, when the velum is lowered), whose resonances, the **formants**, depend on its shape; the radiated sound is the flow at the lips, differentiated by radiation into the open air. If the tract is treated as a linear, time-invariant system over stretches of a few tens of milliseconds, the output spectrum is the product
$$P(f)=S(f)\,T(f)\,R(f),\qquad\text{i.e.}\qquad L_P(f)=L_S(f)+L_T(f)+L_R(f)\ \ \text{in decibels,}$$
of the source spectrum $S$ (lines at the harmonics $k f_0$ of the voice, falling about 12 dB per octave, or a flat noise continuum), the tract's transfer function $T$ (peaks at the formants) and the radiation characteristic $R$ (rising about 6 dB per octave). The larynx and the articulators work independently: the vocal folds set pitch and voice quality, the tongue, lips and jaw set the formants.`,
      idea: String.raw`Because the tract filters linearly, convolution in time becomes multiplication in frequency, so each harmonic of the source is simply scaled by the gain of the filter at its frequency. A periodic source has a line spectrum (its Fourier series), so voiced speech is a picket fence of harmonics whose heights trace the filter's resonance curve, while a noise source gives a continuous spectrum with the same peaks. The idea goes back to Johannes Müller's experiments with excised larynges in the 1830s; Chiba and Kajiyama (1941) computed the tract's resonances, and Gunnar Fant's *Acoustic Theory of Speech Production* (1960) made source × filter the standard model; the formant model of timbre is music-4.10.

The harmonic-by-harmonic step uses the LTI eigenfunction calculation (sig 3.9): for an absolutely integrable impulse response $h$, inserting $e^{i\omega t}$ in the convolution integral gives $e^{i\omega t}\int h(\tau)e^{-i\omega\tau}\,d\tau$. Thus each harmonic retains its frequency and acquires the transfer factor at that frequency. Apply this to the tract and radiation filters over a fixed-shape window; it does not assert exact linearity or independence of the source and tract in actual speech.`,
      caption: String.raw`Drag the **F1**, **F2**, **F3** handles on the middle panel to reshape the filter, or pick a preset. The left panel is the source, the right one the output: every harmonic of the output is the source harmonic raised by the filter's gain at that frequency, and the readout checks this against the spectrum of the waveform actually synthesized (time domain, then FFT). Change the pitch: the harmonics slide, the envelope stays. Switch the source to **whisper**: the harmonics vanish but the formant peaks (and the vowel) remain. *Source alone* plays the buzz before the tract shapes it. (The lip radiation is folded into the source here.)`,
      deps: ['music-4.10', 'sig-3.9'],
      refs: ['Ladefoged & Johnson', 'Jurafsky & Martin ch. 15'],
      tags: ['source-filter', 'acoustics'],
      credit: 'J. Müller 1830s; T. Chiba & M. Kajiyama 1941; G. Fant 1960',
      scope: String.raw`Holds when the vocal tract can be treated as a linear, time-invariant filter (sound pressures far below the steady airflow, shapes changing slowly compared with the period) and the source is unaffected by the tract. It is only approximate when the two interact: high voices whose $f_0$ approaches F1, rapid articulatory movements, and nasal coupling, which adds antiresonances.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Source%E2%80%93filter_model' },
      viz(v) {
        const M = v.M, FMAX = 5000;
        const srcSel = v.select('source', [{ value: 'voice', label: 'voiced' }, { value: 'whisper', label: 'whisper' }, { value: 'breathy', label: 'breathy' }], 'voice');
        const f0S = v.slider('pitch $f_0$', 70, 320, 121, { log: true, fmt: (x) => v.fix(SR / Math.round(SR / x), 1) + ' Hz' });
        const F = [500, 1500, 2500];
        const PRE = { ə: [500, 1500, 2500], i: [270, 2290, 3010], a: [750, 1300, 2500], u: [300, 870, 2240] };
        const ttl = (t) => ({ height: 210, axes: 'box', minWidth: 236, title: t, x: [0, FMAX], xticks: [[0, '0'], [1000, '1k'], [2000, '2k'], [3000, '3k'], [4000, '4k'], [5000, '5 kHz']] });
        const wav = v.stage({ x: [0, 0.03], y: [-2.35, 1.45], height: 160, axes: false, full: true });
        const sS = v.stage({ ...ttl('source $S(f)$ (dB)'), y: [-45, 12] });
        const sT = v.stage({ ...ttl('× tract filter $T(f)$ (dB)'), y: [-30, 36] });
        const sO = v.stage({ ...ttl('= output $S(f)\\,T(f)$ (dB)'), y: [-42, 16] });
        const hs = F.map((f, k) => sT.handle(f, 30, { color: ['accent', 'orange', 'purple'][k], label: `F${k + 1}`, labelPos: 's', constrain: (x) => [clampN(x, k === 0 ? 150 : F[k - 1] + 180, k === 2 ? 4300 : F[k + 1] - 180), 30] }));
        hs.forEach((h, k) => { h.onDrag = () => { F[k] = h.x; }; });
        for (const name of Object.keys(PRE)) v.button(`[${name}]`, () => { PRE[name].forEach((f, k) => { F[k] = f; hs[k].set(f, 30); }); });
        const formants = () => [F[0], F[1], F[2], ...FHI];
        let cache = { key: null };
        const analyse = () => {
          const P = Math.round(SR / f0S.value), Fs = formants(), key = P + '|' + Fs.map(Math.round).join(',') + '|' + srcSel.value;
          if (cache.key === key) return cache;
          const src = vowelPeriod([], [], P), out = vowelPeriod(Fs, BW5, P);
          const hS = harmonicsDb(M, src), hO = harmonicsDb(M, out), f0 = SR / P;
          // noise: averaged spectra (Welch, Hann frames) of white noise alone and through the same filter;
          // breathy voice: pulses plus aspiration, analysed together with long frames so harmonics and noise share one scale
          const welch = (x, N) => { const acc = new Float64Array(N / 2 + 1); let cnt = 0; for (let s0 = 0; s0 + N <= x.length; s0 += N / 2) { const re = new Float64Array(N), im = new Float64Array(N); for (let j = 0; j < N; j++) re[j] = x[s0 + j] * (0.5 - 0.5 * Math.cos((2 * Math.PI * j) / N)); M.fft(re, im); for (let b = 0; b <= N / 2; b++) acc[b] += re[b] * re[b] + im[b] * im[b]; cnt++; } return Array.from(acc, (a) => 10 * Math.log10(a / cnt + 1e-14)); };
          let nS = null, nO = null, wS = null, wO = null, nN = 512;
          const ref = hS[1];
          if (srcSel.value === 'whisper') {
            const len = 0.5, ns = synth(() => ({ f0: 100, av: 0, ah: 1, af: 0, F: [], B: [] }), len, { seed: 11 }), no = synth(() => ({ f0: 100, av: 0, ah: 1, af: 0, F: Fs, B: BW5 }), len, { seed: 11 });
            nS = welch(ns, 512); nO = welch(no, 512);
            const nref = M.mean(nS.slice(20, 120)) + 12; nS = nS.map((x) => x - nref); nO = nO.map((x) => x - nref);
            wS = ns.slice(4000, 4000 + Math.round(0.03 * SR)); wO = no.slice(4000, 4000 + Math.round(0.03 * SR));
          } else if (srcSel.value === 'breathy') {
            const len = 0.6, par = (F) => () => ({ f0, av: 0.55, ah: 0.6, af: 0, F, B: BW5 }), ns = synth(par([]), len, { seed: 11, jitter: 0 }), no = synth(par(Fs), len, { seed: 11, jitter: 0 });
            const pure = synth(() => ({ f0, av: 1, ah: 0, af: 0, F: [], B: [] }), len, { jitter: 0 }), cal = Math.max(...welch(pure, 2048).slice(1, 60));
            nN = 2048; nS = welch(ns, 2048).map((x) => x - cal); nO = welch(no, 2048).map((x) => x - cal);
            wS = ns.slice(4000, 4000 + Math.round(0.03 * SR)); wO = no.slice(4000, 4000 + Math.round(0.03 * SR));
          }
          cache = { key, P, f0, src, out, hS: hS.map((x) => x - ref), hO: hO.map((x) => x - ref), nS, nO, nN, wS, wO, Fs };
          return cache;
        };
        const mkSound = (filtered) => {
          const c = analyse(), f0 = c.f0, mode = srcSel.value, Fs = filtered ? c.Fs : [];
          const buf = synth((t) => ({ f0: f0 * (1.03 - 0.06 * t), av: mode === 'whisper' ? 0 : mode === 'breathy' ? 0.55 : 1, ah: mode === 'voice' ? 0 : mode === 'breathy' ? 0.6 : 1.2, af: 0, F: Fs, B: BW5 }), 1.1);
          return normalise(buf, 0.85, 0.05);
        };
        v.soundButton('Listen', (snd) => snd.samples(mkSound(true), SR, { gain: 0.6 }));
        v.soundButton('Source alone', (snd) => snd.samples(mkSound(false), SR, { gain: 0.45 }));
        v.legend([['orange', 'source', { dot: true }], ['ink', 'tract filter $T(f)$'], ['accent', 'output', { dot: true }], ['muted', 'noise spectrum (whisper)']]);
        let info = null;
        v.render(() => {
          const c = analyse(), mode = srcSel.value, voiced = mode !== 'whisper', noisy = mode !== 'voice', f0 = c.f0, Fs = c.Fs;
          // waveforms: two lanes, source on top, output below (3–4 periods)
          const per = (buf, i) => buf[i % buf.length];
          const norm = (arr) => { let m = 0; for (const x of arr) m = Math.max(m, Math.abs(x)); return m || 1; };
          const n = Math.round(0.03 * SR), mS = norm(c.src), mO = norm(c.out);
          const laneS = [], laneO = [];
          for (let i = 0; i < n; i++) {
            const sv = noisy ? c.wS[i] / norm(c.wS) : per(c.src, i) / mS, ov = noisy ? c.wO[i] / norm(c.wO) : per(c.out, i) / mO;
            laneS.push([i / SR, 0.55 + 0.5 * sv]); laneO.push([i / SR, -1.2 + 0.85 * ov]);
          }
          wav.hline(0.55, { color: 'faint' }); wav.hline(-1.2, { color: 'faint' });
          wav.path(laneS, { color: 'orange', width: 1.6 }); wav.path(laneO, { color: 'accent', width: 1.6 });
          wav.text('source: ' + (mode === 'voice' ? 'glottal flow derivative, one pulse per period' : mode === 'whisper' ? 'turbulent noise' : 'pulses + noise'), 0.0003, 1.28, { size: 11.5, color: 'orange', align: 'left' });
          wav.text('output at the lips', 0.0003, -0.25, { size: 11.5, color: 'accent', align: 'left' });
          if (voiced) for (let k = 0; k * c.P < n; k++) wav.vline((k * c.P) / SR + 0.6 * c.P / SR, { color: 'orange', dash: [2, 4], alpha: 0.5 });
          wav.measure(0.0002, -2.12, 0.0102, -2.12, '10 ms', { color: 'muted', size: 11, math: false, offset: -9 });
          // spectra
          const stems = (s, h, col, lo) => { for (let k = 1; k * f0 < FMAX && k < h.length; k++) { s.line(k * f0, lo, k * f0, h[k], { color: col, width: 1.6, alpha: 0.85 }); s.dot(k * f0, h[k], { r: 2.2, color: col }); } };
          const noiseCurve = (s, arr, col) => s.path(arr.map((d, b) => [(b * SR) / c.nN, d]).filter((p) => p[0] <= FMAX), { color: col, width: mode === 'breathy' ? 1.2 : 1.3 });
          if (mode === 'voice') stems(sS, c.hS, 'orange', -45);
          if (noisy) noiseCurve(sS, c.nS, mode === 'breathy' ? 'orange' : 'muted');
          sS.corner(voiced ? `harmonics every ${v.fix(f0, 1)} Hz` : 'flat noise: no harmonics', 'tr', { color: 'orange', weight: 600 });
          sT.fn((f) => dB(tractGain(Fs, BW5, f)), { domain: [0, FMAX], n: 500, color: 'ink', width: 2 });
          hs.forEach((h, k) => sT.vline(F[k], { color: h.color, dash: [3, 4], alpha: 0.7 }));
          const env = (f) => dB(tractGain(Fs, BW5, f));
          if (mode === 'voice') {
            stems(sO, c.hO, 'accent', -42);
            // the envelope that the harmonics trace: source trend + filter
            const tilt = (f) => { const k = f / f0; const lo = Math.floor(k), hi = lo + 1; if (lo < 1) return c.hS[1]; return hi < c.hS.length ? c.hS[lo] + (c.hS[hi] - c.hS[lo]) * (k - lo) : c.hS[lo]; };
            sO.fn((f) => env(f) + tilt(f), { domain: [f0, FMAX], n: 400, color: 'faint', width: 1.2, dash: [4, 4] });
          }
          if (noisy) noiseCurve(sO, c.nO, mode === 'breathy' ? 'accent' : 'muted');
          for (let k = 0; k < 3; k++) sO.vline(F[k], { color: hs[k].color, dash: [3, 4], alpha: 0.45 });
          // verification at the strongest output harmonic
          let kb = 1; for (let k = 1; k * f0 < FMAX && k < c.hO.length; k++) if (c.hO[k] > c.hO[kb]) kb = k;
          info = { kb, f: kb * f0, s: c.hS[kb], t: env(kb * f0), o: c.hO[kb], f0, mode, Fs };
          if (mode === 'voice') sO.dot(kb * f0, c.hO[kb], { r: 5, color: 'gold' });
        });
        v.readout(() => info && (info.mode === 'breathy' ? `breathy voice: weaker pulses plus aspiration noise, analysed together (long-window FFT): the harmonics still stand out below about 1.5 kHz, while noise fills in between them higher up; the formant peaks ${info.Fs.slice(0, 3).map((f) => Math.round(f)).join(', ')} Hz are unchanged`
          : info.mode === 'voice' ? `$f_0$ = ${v.fix(info.f0, 1)} Hz · formants ${info.Fs.slice(0, 3).map((f) => Math.round(f)).join(', ')} Hz · strongest harmonic: no. ${info.kb} at ${Math.round(info.f)} Hz (gold): source ${v.fix(info.s, 1)} dB + filter ${v.fix(info.t, 1)} dB = **${v.fix(info.s + info.t, 2)} dB**; measured by FFT of the synthesized waveform: **${v.fix(info.o, 2)} dB**`
          : `whisper: the source is noise, so the output has no harmonics and no pitch, but its spectrum still peaks at ${info.Fs.slice(0, 3).map((f) => Math.round(f)).join(', ')} Hz, the formants of the filter, which is why whispered vowels stay intelligible`));
      },
    },
    // ------------------------------------------------------------------ 1.2
    {
      num: '1.2',
      kind: 'Definition',
      name: 'The International Phonetic Alphabet',
      statement: String.raw`The **International Phonetic Alphabet** (IPA) assigns one symbol to each speech sound that distinguishes words in some language, so that any utterance in any language can be written unambiguously, one symbol per segment, independent of spelling. Transcriptions are written in square brackets, as in [ʃɪp] for *ship*. Each consonant symbol is defined by three articulatory coordinates:

- **voicing**: whether the vocal folds vibrate (voiced, right-hand symbol of a pair) or not (voiceless, left);
- **place**: where the airway is narrowed, from the lips (bilabial) back to the larynx (glottal);
- **manner**: how narrow the constriction is and how air escapes (plosive, nasal, trill, tap, fricative, lateral, approximant).

So [b] *is* "voiced bilabial plosive". A vowel symbol is defined by the position of the highest point of the tongue (height: close … open; backness: front … back) and by lip rounding. Diacritics refine any symbol (aspiration [pʰ], nasalisation [ã], length [aː]); further symbols cover clicks, implosives and ejectives, which use other airstreams.`,
      idea: String.raw`The chart is a coordinate system rather than a list: rows are manners, columns are places from the front of the mouth to the back, and pairs in a cell differ only in voicing, so neighbouring symbols are acoustically and articulatorily close. Empty cells are sounds no language is known to contrast; shaded cells are judged impossible (a nasal needs an oral closure in front of the velum, so a glottal nasal cannot exist). The alphabet was created in 1888 by the International Phonetic Association (founded 1886 by Paul Passy and colleagues for language teaching) on the principle "one sound, one symbol", with Latin letters wherever possible.`,
      caption: String.raw`Click any symbol. Its row (manner) and column (place) light up, the vocal tract on the left takes that articulation (gold: where the airway is narrowed; the velum drops for nasals; the glottis inset shows voicing), and *Listen* plays it between two [a] vowels, synthesized by rule from its place, manner and voicing, whose spectrogram appears on the right. Switch to **vowels** to click around the vowel trapezoid: the tongue body moves to the corresponding position and the vowel is synthesized from formants measured for the cardinal vowels.`,
      deps: [],
      refs: ['Ladefoged & Johnson'],
      tags: ['IPA', 'transcription'],
      credit: 'International Phonetic Association, 1886; alphabet 1888',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/International_Phonetic_Alphabet' },
      viz(v) {
        const M = v.M;
        const mode = v.select('chart', [{ value: 'c', label: 'consonants' }, { value: 'v', label: 'vowels' }], 'c');
        const ch = v.stage({ x: [0, 13], y: [0, 9.5], height: 300, axes: false, full: true });
        const tr = v.stage({ x: [-2.5, 9.6], y: [-9.6, 4.6], equal: true, height: 320, axes: false, minWidth: 280 });
        const sp = v.stage({ x: [0, 0.6], y: [0, 6000], height: 320, axes: 'box', xlabel: 'time (s)', minWidth: 280, yticks: [[0, '0'], [1000, '1k'], [2000, '2k'], [3000, '3k'], [4000, '4k'], [5000, '5k'], [6000, '6 kHz']] });
        let selC = 'b', selV = 'i';
        const where = {};
        IPA_ROWS.forEach(([, , cells], i) => cells.forEach(([a, b, vl, vd]) => { if (vl) where[vl] = [i, a, b, 0]; if (vd) where[vd] = [i, a, b, 1]; }));
        const rowY = (i) => 7.5 - i;
        const symX = (a, b, half) => (b > a ? 2 + (a + b + 1) / 2 + (half ? 0.42 : -0.42) : 2 + a + (half ? 0.72 : 0.28));
        const vpos = (h, b, r) => { const xf = 6.0 - (2.6 * h) / 3, x = xf + b * (10.6 - xf); return [x + (r ? 0.3 : -0.3), 1.15 + 2.3 * h]; };
        const VROW = Object.fromEntries(IPA_V.map((r) => [r[0], r]));
        ch.onClick((x, y) => {
          const px = ch.X(x), py = ch.Y(y); let best = null, bd = 26;
          if (mode.value === 'c') for (const sym of Object.keys(where)) { const [i, a, b, half] = where[sym]; const d = Math.hypot(ch.X(symX(a, b, half)) - px, ch.Y(rowY(i)) - py); if (d < bd) { bd = d; best = sym; } }
          else for (const [sym, h, b, r] of IPA_V) { const [qx, qy] = vpos(h, b, r); const d = Math.hypot(ch.X(qx) - px, ch.Y(qy) - py); if (d < bd) { bd = d; best = sym; } }
          if (best) { if (mode.value === 'c') selC = best; else selV = best; }
        });
        const cache = new Map();
        const example = (key) => {
          if (cache.has(key)) return cache.get(key);
          let out;
          if (mode.value === 'c' || key.length === 1 && CONS[key] && !VROW[key]) {
            const sym = key, mn = CONS[sym][1], d = mn === 'fricative' || mn === 'latfric' ? 0.16 : mn === 'trill' ? 0.1 : null;
            out = speak(['a', d ? [sym, d] : sym, 'a']);
          } else {
            const [, h, b, r] = VROW[key], F = chartFormants(h, b, r);
            const dur = 0.5, buf = synth((t) => ({ f0: 125 - 20 * t, av: 1, ah: 0, af: 0, F: [F[0], F[1], F[2], ...FHI], B: BW5 }), dur);
            out = { buf, dur, F };
          }
          out.S = stft(M, out.buf, { win: 0.005, fmax: 6000 });
          cache.set(key, out); return out;
        };
        const cur = () => (mode.value === 'c' ? selC : selV);
        v.soundButton('Listen', (snd) => { const e = example(cur()); snd.samples(normalise(e.buf.slice(), 0.85, 0.02), SR, { gain: 0.6 }); });
        let info = null;
        v.render(() => {
          const ink = v.rgb('ink'), u = ch.X(1) - ch.X(0), fs = clampN(u * 0.33, 10, 19), hs = clampN(u * 0.17, 8.5, 11.5);
          if (mode.value === 'c') {
            const [ri, ca, cb] = where[selC];
            ch.rect(0, rowY(ri) - 0.5, 13, rowY(ri) + 0.5, { fill: 'accent', fillAlpha: 0.1, stroke: false });
            ch.rect(2 + ca, 0, 3 + cb, 9.5, { fill: 'accent', fillAlpha: 0.1, stroke: false });
            IPA_ROWS.forEach(([, lab, cells, shaded], i) => {
              const y0 = rowY(i) - 0.5, y1 = rowY(i) + 0.5;
              for (const [c, half] of shaded) ch.rect(2 + c + (half === 2 ? 0.5 : 0), y0, 3 + c, y1, { fill: 'muted', fillAlpha: 0.32, stroke: false });
              ch.text(lab, 0.12, rowY(i), { size: hs + 0.5, color: i === ri ? 'accent' : 'ink', align: 'left', weight: i === ri ? 650 : 500 });
              const merged = cells.some(([a, b]) => b > a);
              for (let j = 0; j <= 11; j++) { if (merged && (j === 3 || j === 4)) continue; ch.line(2 + j, y0, 2 + j, y1, { color: 'grid', width: 1 }); }
              for (const [a, b, vl, vd] of cells) for (const [sym, half] of [[vl, 0], [vd, 1]]) {
                if (!sym) continue; const x = symX(a, b, half), on = sym === selC;
                if (on) ch.dot(x, rowY(i), { r: fs * 0.82, color: 'accent', hollow: true, width: 2 });
                ch.text(sym, x, rowY(i) + 0.02, { size: fs, align: 'center', color: on ? 'accent' : 'ink', weight: on ? 650 : 450 });
              }
            });
            for (let i = 0; i <= 8; i++) ch.line(0, rowY(i) - 0.5 + (i === 8 ? 0 : 0), 13, rowY(i) - 0.5, { color: 'grid', width: 1 });
            ch.line(0, 8, 13, 8, { color: 'grid', width: 1 });
            PLACE_HEAD.forEach((lines, j) => lines.forEach((t, k) => ch.text(t, 2.5 + j, lines.length === 1 ? 8.75 : 8.98 - 0.45 * k, { size: hs, align: 'center', color: j >= ca && j <= cb ? 'accent' : 'muted', weight: j >= ca && j <= cb ? 650 : 500 })));
            const [place, mn, vc] = CONS[selC];
            drawTract(tr, consCfg(selC));
            info = { c: true, sym: selC, desc: `${vc ? 'voiced' : 'voiceless'} ${place === 'alveolar' && (where[selC][2] > where[selC][1]) ? 'alveolar' : place} ${MANNER_NAME[mn]}`, mn };
          } else {
            // the vowel trapezoid
            const C = (h, b) => vpos(h, b, 0).map((z, k) => (k === 0 ? z + 0.3 : z));
            ch.path([C(3, 0), C(3, 1), C(0, 1), C(0, 0), C(3, 0)], { color: 'muted', width: 1.4 });
            for (const h of [2, 1]) ch.path([C(h, 0), C(h, 1)], { color: 'grid', width: 1.2 });
            ch.path([C(3, 0.5), C(0, 0.5)], { color: 'grid', width: 1.2 });
            [['Close', 3], ['Close-mid', 2], ['Open-mid', 1], ['Open', 0]].forEach(([t, h]) => ch.text(t, C(h, 0)[0] - 0.85, C(h, 0)[1], { size: hs, color: 'muted', align: 'right' }));
            [['Front', 0], ['Central', 0.5], ['Back', 1]].forEach(([t, b]) => ch.text(t, C(3, b)[0], 9.15, { size: hs, color: 'muted', align: 'center' }));
            const seen = new Set();
            for (const [sym, h, b, r] of IPA_V) {
              const key = h + ',' + b; if (!seen.has(key)) { seen.add(key); const [cx, cy] = C(h, b); ch.dot(cx, cy, { r: 2.6, color: 'muted' }); }
              const [x, y] = vpos(h, b, r), on = sym === selV;
              if (on) ch.dot(x, y, { r: fs * 0.82, color: 'accent', hollow: true, width: 2 });
              ch.text(sym, x, y + 0.03, { size: fs, align: 'center', color: on ? 'accent' : 'ink', weight: on ? 650 : 450 });
            }
            ch.text('Where symbols appear in pairs, the one to the right is rounded.', 6.5, 0.42, { size: hs, color: 'muted', align: 'center' });
            const [, h, b, r] = VROW[selV];
            drawTract(tr, { hx: 3.2 + 2.5 * b, hy: fitTongue(3.2 + 2.5 * b, -0.9 + 0.85 * h), round: !!r, velum: 'up', glottis: 'voiced', mark: { x: 3.2 + 2.5 * b, y: fitTongue(3.2 + 2.5 * b, -0.9 + 0.85 * h), color: 'gold' } });
            const HN = { 3: 'close', 2.5: 'near-close', 2: 'close-mid', 1.5: 'mid', 1: 'open-mid', 0.5: 'near-open', 0: 'open' }, BN = { 0: 'front', 0.2: 'near-front', 0.5: 'central', 0.8: 'near-back', 1: 'back' };
            const F = chartFormants(h, b, r), measured = CARD.some((c) => c[0] === h && c[1] === b && c[2] === r);
            info = { c: false, sym: selV, desc: `${HN[h]} ${BN[b]} ${r ? 'rounded' : 'unrounded'} vowel`, F, measured };
          }
          const e = example(cur());
          sp.setView([0, e.dur], [0, 6000]);
          drawSpec(sp, e.S, ink, { key: mode.value + cur(), range: 48 });
          if (e.segs) for (const sg of e.segs) if (!sg.V) { sp.vline(sg.t0, { color: 'gold', dash: [4, 4], alpha: 0.8 }); sp.vline(sg.t1, { color: 'gold', dash: [4, 4], alpha: 0.8 }); }
          sp.corner(mode.value === 'c' ? `[a${cur()}a]` : `[${cur()}]`, 'tr', { color: 'accent', weight: 650, size: 14 });
        });
        const MD = { plosive: 'complete closure, then a release burst', nasal: 'oral closure with the velum lowered, so air flows out through the nose', trill: 'the articulator vibrates against another in the airstream', tap: 'a single quick contact', fricative: 'a gap narrow enough to make the airflow turbulent (a hiss)', latfric: 'tongue centre closed, turbulent air escapes along the sides', approx: 'articulators close together but not enough for turbulence', latapprox: 'tongue centre closed, air flows smoothly along the sides' };
        v.readout(() => info && (info.c
          ? `**[${info.sym}]** = ${info.desc}: ${MD[info.mn]} · e.g. ${IPA_EX[info.sym] || '—'} · gold lines on the spectrogram mark the consonant in [a${info.sym}a]`
          : `**[${info.sym}]** = ${info.desc} · synthesized with F1 ≈ ${Math.round(info.F[0])} Hz, F2 ≈ ${Math.round(info.F[1])} Hz (${info.measured ? 'measured cardinal value' : 'interpolated between the measured cardinal vowels'}) · e.g. ${VROW[info.sym][4]}`));
      },
    },
    // ------------------------------------------------------------------ 1.3
    {
      num: '1.3',
      kind: 'Concept',
      name: 'Place of articulation',
      statement: String.raw`The **place of articulation** of a consonant is where along the vocal tract the airway is narrowed or closed: the meeting point of an *active* articulator (lower lip, tongue tip or blade, tongue body, tongue root, vocal folds) with a *passive* one (upper lip, upper teeth, alveolar ridge, hard palate, velum, uvula, back wall of the pharynx). From the lips inward the IPA distinguishes bilabial [p], labiodental [f], dental [θ], alveolar [t], postalveolar [ʃ], retroflex [ʈ], palatal [c], velar [k], uvular [q], pharyngeal [ħ] and glottal [ʔ] places. Acoustically, place is signalled by the spectrum of the noise made at the constriction, which is shaped mainly by the resonances of the **front cavity** between the constriction and the lips (roughly a quarter-wave resonator, peaking near $c/4L_f$ for a front cavity of length $L_f$), and by the formant transitions into neighbouring vowels.`,
      idea: String.raw`At the moment a stop is released, a short burst of turbulent noise is generated at the constriction. The cavity behind it is nearly decoupled by the narrow opening, so the burst is filtered mostly by the front cavity, a tube closed at the constriction and open at the lips: its lowest resonance is about $c/4L_f$. The front cavity is absent for [p] (a flat, weak, low burst), about 1.5–2 cm for [t] (a peak near 4–5 kHz), and 5–7 cm for [k] (a compact peak near 1.5–2 kHz), so the burst spectrum moves steadily downward as the closure moves back. At the glottis the "front cavity" is the whole tract, whose resonances are just the vowel formants of the uniform tube (ling-1.8). The labels themselves come from the IPA chart (ling-1.2).`,
      caption: String.raw`Drag the **gold** handle along the roof of the mouth, from the lips back to the glottis. The tongue or lips close the tract there; the shaded stretch is the front cavity. The right panel is the spectrum of the release burst, computed by FFT of noise filtered by that cavity, with dashed lines at its predicted resonances $(2n-1)\,c/4L_f$; the strip below is the spectrogram of [aCa] synthesized with this closure. *Listen* plays it; *p, t, k, ʔ* plays the four main English and German stops in turn. Watch the burst peak fall as the front cavity lengthens.`,
      deps: ['ling-1.2'],
      refs: ['Ladefoged & Johnson'],
      tags: ['consonants', 'articulation'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Place_of_articulation' },
      viz(v) {
        const M = v.M, FM = 7600;
        const tr = v.stage({ x: [-2.5, 9.6], y: [-9.6, 4.6], equal: true, height: 340, axes: false, minWidth: 280, weight: 1.1 });
        const sp = v.stage({ x: [0, FM], y: [-42, 4], height: 340, axes: 'box', title: 'burst spectrum (dB)', minWidth: 260, xticks: [[0, '0'], [2000, '2k'], [4000, '4k'], [6000, '6 kHz']] });
        const sg = v.stage({ x: [0, 0.5], y: [0, 6000], height: 150, axes: 'box', full: true, yticks: [[0, '0'], [2000, '2k'], [4000, '4k'], [6000, '6 kHz']] });
        const h0 = along(WALL, WALL_S, 2.1);
        const H = tr.handle(h0.x, h0.y, { color: 'gold', r: 8, constrain: (x, y) => { const q = nearestOn(WALL, WALL_S, x, y); return [q.x, q.y]; } });
        const SYM = { bilabial: 'p', dental: 't̪', alveolar: 't', postalveolar: 't̠', retroflex: 'ʈ', palatal: 'c', velar: 'k', uvular: 'q', pharyngeal: '—', glottal: 'ʔ' };
        // formant loci along the tract (for [a] context), interpolated between the canonical places
        const LOC = [[0, [220, 800, 2200]], [1.2, [220, 1600, 2600]], [2.1, [220, 1800, 2700]], [3.4, [260, 1700, 1800]], [4.6, [220, 2300, 3000]], [6.7, [220, 2000, 2200]], [8.5, [450, 1200, 2400]], [11.6, [750, 1100, 2400]], [17, [750, 1300, 2500]]];
        const locAt = (s) => { let i = 1; while (i < LOC.length - 1 && LOC[i][0] < s) i++; const [s0, a] = LOC[i - 1], [s1, b] = LOC[i], u = clampN((s - s0) / (s1 - s0), 0, 1); return a.map((x, k) => x + (b[k] - x) * u); };
        const sOf = () => nearestOn(WALL, WALL_S, H.x, H.y).s;
        const lfOf = (s) => (s < 0.45 ? 0 : s);
        const cons = (s) => ({ sym: SYM[regionAt(s)], pl: { lf: lfOf(s), loc: s > 16 ? null : locAt(s) }, mn: 'plosive', vc: 0 });
        const cache = new Map();
        const get = (s) => {
          const key = Math.round(s * 10);
          if (cache.has(key)) return cache.get(key);
          const lf = lfOf(s), res = lf >= 0.8 ? [1, 2, 3].map((n) => ((2 * n - 1) * C_TRACT) / (4 * lf)).filter((f) => f < FM) : [];
          // burst: noise through the front-cavity resonances (in parallel); a labial burst has no front cavity and is flat
          const n = Math.round(0.25 * SR), rnd = noiseGen(5), x = new Float32Array(n);
          if (!res.length) { let y = 0; for (let i = 0; i < n; i++) { const w = rnd(); x[i] = w - 0.55 * y; y = w; } }
          else for (const [k, f] of res.entries()) { const [A, B, C] = resCoef(f, 0.22 * f + 120), g = 1 / (k + 1); let y1 = 0, y2 = 0; const r2 = noiseGen(9 + k); for (let i = 0; i < n; i++) { const y = A * r2() + B * y1 + C * y2; y2 = y1; y1 = y; x[i] += g * y * (f / 1000); } }
          const N = 512, acc = new Float64Array(N / 2 + 1); let cnt = 0;
          for (let s0 = 0; s0 + N <= n; s0 += N / 2) { const re = new Float64Array(N), im = new Float64Array(N); for (let j = 0; j < N; j++) re[j] = x[s0 + j] * (0.5 - 0.5 * Math.cos((2 * Math.PI * j) / N)); M.fft(re, im); for (let b = 0; b <= N / 2; b++) acc[b] += re[b] * re[b] + im[b] * im[b]; cnt++; }
          const spec = Array.from(acc, (a) => 10 * Math.log10(a / cnt + 1e-14)), mx = Math.max(...spec);
          // smooth over 5 bins so the curve shows the envelope rather than noise
          const sm = spec.map((_, b) => { let t = 0, c = 0; for (let j = -2; j <= 2; j++) if (spec[b + j] != null) { t += spec[b + j]; c++; } return t / c - mx; });
          let pk = 1; for (let b = 2; b < sm.length && (b * SR) / N < FM; b++) if (sm[b] > sm[pk]) pk = b;
          const syl = speak(['a', cons(s), 'a']);
          const out = { lf, res, sm, peak: (pk * SR) / N, syl, S: stft(M, syl.buf, { win: 0.005, fmax: 6000 }) };
          cache.set(key, out); return out;
        };
        v.soundButton('Listen', (snd) => snd.samples(normalise(get(sOf()).syl.buf.slice(), 0.85, 0.02), SR, { gain: 0.6 }));
        v.soundButton('p, t, k, ʔ', (snd) => {
          const parts = [0.1, 2.1, 6.7, 17.3].map((s) => normalise(get(s).syl.buf.slice(), 0.85, 0.02)), gap = Math.round(0.18 * SR);
          const out = new Float32Array(parts.reduce((a, p) => a + p.length + gap, 0)); let o = 0; for (const p of parts) { out.set(p, o); o += p.length + gap; }
          snd.samples(out, SR, { gain: 0.6 });
        });
        v.legend([['gold', 'constriction', { dot: true }], ['gold', 'front cavity', { area: true }], ['accent', 'burst spectrum'], ['orange', 'predicted $(2n-1)\\,c/4L_f$', { dash: true }]]);
        let info = null;
        v.render(() => {
          const s = sOf(), reg = regionAt(s), d = get(s);
          const cfg = { hy: 0.9, glottis: reg === 'glottal' ? 'closed' : 'voiceless', velum: 'up', ctl: consCtl(reg, 0, s) };
          if (reg === 'bilabial') cfg.lipGap = 0;
          drawTract(tr, cfg);
          // front cavity: the stretch of wall from the lips to the closure
          if (s > 0.3) { const pts = []; for (let u = 0; u <= s; u += 0.1) { const w = along(WALL, WALL_S, u); pts.push([w.x + w.nx * 0.25, w.y + w.ny * 0.25]); } tr.path(pts, { color: 'gold', width: 7, alpha: 0.45 }); }
          tr.text(`${reg} [${SYM[reg]}]`, -2.3, -4.1, { size: 13, color: 'ink', align: 'left', weight: 650 });
          tr.text(s < 0.45 ? 'no front cavity' : `front cavity L = ${v.fix(s, 1)} cm`, -2.3, -4.8, { size: 12, color: 'muted', align: 'left' });
          // spectrum
          sp.path(d.sm.map((y, b) => [(b * SR) / 512, y]).filter((p) => p[0] <= FM), { color: 'accent', width: 2.2 });
          for (const f of d.res) sp.vline(f, { color: 'orange', dash: [5, 4], width: 1.5 });
          if (d.res.length) sp.dot(d.peak, d.sm[Math.round((d.peak * 512) / SR)], { r: 4.5, color: 'gold' });
          sp.corner(d.res.length ? `c/4L = ${Math.round(d.res[0])} Hz` : 'flat: nothing in front of the closure', 'tr', { color: 'orange', weight: 600 });
          // spectrogram of [aCa]
          sg.setView([0, d.syl.dur], [0, 6000]);
          drawSpec(sg, d.S, v.rgb('ink'), { key: Math.round(s * 10), range: 48 });
          const c = d.syl.segs[1]; sg.vline(c.t1, { color: 'gold', dash: [4, 3], width: 1.4 });
          sg.text('burst', c.t1 + 0.004, 5600, { size: 11, color: 'gold', align: 'left' });
          sg.corner(`[a${SYM[reg] === '—' ? '?' : SYM[reg]}a]`, 'tr', { color: 'accent', weight: 650 });
          info = { s, reg, d };
        });
        v.readout(() => info && (info.reg === 'pharyngeal'
          ? `pharyngeal closure at ${v.fix(info.s, 1)} cm from the lips: generally judged impossible, since the tongue root cannot seal against the back of the pharynx (the nearest real sound, the epiglottal stop [ʡ], closes lower down); the model would predict a low burst near ${Math.round(info.d.res[0])} Hz`
          : info.reg === 'glottal' ? `glottal stop [ʔ]: the vocal folds close; the "front cavity" is the whole tract (${v.fix(info.s, 1)} cm), so its resonances ${info.d.res.map((f) => Math.round(f)).join(', ')} Hz are just the schwa formants and there is no separate burst`
          : info.d.res.length ? `${info.reg} [${SYM[info.reg]}]: front cavity $L_f$ = ${v.fix(info.s, 1)} cm → predicted lowest resonance $c/4L_f$ = **${Math.round(info.d.res[0])} Hz**; strongest peak of the computed burst spectrum: **${Math.round(info.d.peak)} Hz**`
          : `bilabial [p]: the closure is at the lips, nothing filters the burst, so its spectrum is flat and weak and falls gently with frequency`));
      },
    },
    // ------------------------------------------------------------------ 1.4
    {
      num: '1.4',
      kind: 'Concept',
      name: 'Manner of articulation',
      statement: String.raw`The **manner of articulation** is how narrow a constriction is and how the air gets past it. In a **stop** (plosive) the oral tract is completely closed, pressure builds up behind the closure, and its release makes a burst; in a **nasal** the oral tract is also closed but the velum is lowered, so air flows out through the nose; in a **fricative** the gap is so narrow that the airflow through it becomes turbulent and hisses; in an **approximant** the articulators come close enough to change the resonances but not to make turbulence; a **vowel** has the most open tract. Trills (repeated vibration of an articulator in the airstream), taps (one fast contact) and laterals (air escaping past the sides of the tongue) complete the list. Whether a constriction is a fricative is decided by aerodynamics: the flow through it turns turbulent when its Reynolds number $\mathrm{Re}=uD/\nu$ exceeds roughly 1800, where $u$ is the air speed in the constriction, $D$ its width and $\nu$ the kinematic viscosity of air.`,
      idea: String.raw`Treat the larynx and the oral constriction as two orifices in series fed by the lungs at pressure $P_s$. Each orifice of area $A$ passing volume flow $U$ costs a pressure drop $\tfrac12\rho\,(U/A)^2$ (Bernoulli), so the pressure in the mouth is $P_{oral}=P_s\,A_g^2/(A_g^2+A_c^2)$ and the jet speed in the constriction is $u=\sqrt{2P_{oral}/\rho}$. Closing the mouth ($A_c\to0$) stops the flow and raises $P_{oral}$ to $P_s$, which also stops voicing, since the vocal folds need a pressure drop of a couple of cm H₂O across them; opening the nasal port relieves the pressure, which is why nasals can be voiced indefinitely. Narrowing the constriction raises $u$ until the jet becomes turbulent, and the noise it radiates grows steeply, roughly as $u^3A^{1/2}$ (Stevens), so fricatives sit in a narrow band of areas around 0.05–0.2 cm². Place is the other dimension (ling-1.3).`,
      caption: String.raw`Slide the constriction area from **closed** to wide open (it sits at the alveolar ridge, so the sounds run [t]/[d] → [s]/[z] → [ɹ] → [a]). The animation shows air parcels from the lungs: they speed up through narrow passages, swirl when the flow turns turbulent, and stop when the tract is closed, while the red shading is the air pressure. The gauges compute the pressures, the Reynolds number and the radiated noise level; the manner is read off them, not looked up. Lower the velum to make a nasal, and switch voicing off to see why voiceless fricatives hiss louder. *Listen* plays [aCa] synthesized with these settings, shown in the spectrogram.`,
      deps: ['ling-1.3'],
      refs: ['Ladefoged & Johnson'],
      tags: ['consonants', 'aerodynamics'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Manner_of_articulation' },
      viz(v) {
        const M = v.M, PS = 784, RHO = 1.14, NU = 1.6e-5, REC = 1800, AN = 0.25, CMH2O = 98.07;
        const areaOf = (u) => (u < 0.03 ? 0 : Math.pow(10, -2.3 + (3.0 * (u - 0.03)) / 0.97));
        const uS = v.slider('constriction area $A_c$', 0, 1, 0.42, { step: 0.005, fmt: (u) => { const A = areaOf(u); return A === 0 ? 'closed' : v.fix(A, A < 0.1 ? 3 : 2) + ' cm²'; } });
        const nas = v.toggle('velum lowered (nasal)', false);
        const voi = v.toggle('voiced', true);
        const tube = v.stage({ x: [0, 24], y: [-2.9, 4.3], height: 220, axes: false, full: true });
        const gauge = v.stage({ x: [0, 1], y: [0, 4.9], height: 250, axes: false, minWidth: 250, weight: 0.85 });
        const sg = v.stage({ x: [0, 0.6], y: [0, 7000], height: 250, axes: 'box', minWidth: 280, yticks: [[0, '0'], [2000, '2k'], [4000, '4k'], [6000, '6 kHz']] });
        const neutral = new Array(34).fill(3);
        const aero = () => {
          const Ac = areaOf(uS.value), An = nas.value ? AN : 0, Ag = voi.value ? 0.1 : 0.3, Aeff = Ac + An;
          const Po = (PS * Ag * Ag) / (Ag * Ag + Aeff * Aeff);
          const U = Aeff > 0 ? (Math.sqrt((2 * PS) / RHO) * Ag * Aeff * 1e-4) / Math.sqrt(Ag * Ag + Aeff * Aeff) : 0;
          const uc = Ac > 0 ? Math.sqrt((2 * Po) / RHO) : 0, D = Math.sqrt((4 * Ac * 1e-4) / Math.PI), Re = (uc * D) / NU, dPg = PS - Po;
          const gv = voi.value ? clampN((dPg - 200) / 300, 0, 1) : 0;
          const Ln = Ac > 0 ? 30 * Math.log10(Math.max(uc, 1e-3)) + 5 * Math.log10(Ac) - 41.4 : -99, turb = M.smoothstep(REC, 1.6 * REC, Re), gn = turb * Math.pow(10, Ln / 20);
          // the open glottis is itself a narrowing: voiceless sounds get aspiration noise from it ([h])
          const ug = Math.sqrt((2 * dPg) / RHO), Lg = voi.value ? -99 : 30 * Math.log10(Math.max(ug, 1e-3)) + 5 * Math.log10(Ag) - 41.4 - 8, gh = voi.value || Ac === 0 ? 0 : Math.pow(10, Lg / 20);
          let F = null;
          if (Ac > 0) { const A = neutral.slice(); for (let i = 28; i <= 30; i++) A[i] = Math.min(3, Ac); F = tubeFormants(A, 0.5, 3); }
          let manner = Ac === 0 ? (nas.value ? 'nasal stop' : 'stop (plosive)') : gn > 0.03 ? 'fricative' : F[0] < 380 ? 'approximant' : voi.value ? 'vowel' : 'voiceless vowel ([h]-like)';
          let sym = Ac === 0 ? (nas.value ? 'n' : voi.value ? 'd' : 't') : manner === 'fricative' ? (voi.value ? 'z' : 's') : manner === 'approximant' ? (voi.value ? 'ɹ' : 'ɹ̥') : voi.value ? 'a' : 'h';
          if (nas.value && Ac > 0) { manner = 'nasalized ' + manner; sym += '\u0303'; }
          return { Ac, An, Ag, Aeff, Po, U, Uc: Aeff > 0 ? (U * Ac) / Aeff : 0, Un: Aeff > 0 ? (U * An) / Aeff : 0, uc, Re, dPg, gv, Ln, gn, gh, F, manner, sym };
        };
        let syl = { key: null };
        const sound = () => {
          const a = aero(), key = [Math.round(uS.value * 200), nas.value, voi.value].join();
          if (syl.key === key) return syl;
          let buf, segs;
          if (a.Ac === 0) { const r = speak(['a', a.sym, 'a']); buf = r.buf; segs = [r.segs[1].t0, r.segs[1].t1]; }
          else {
            const Fa = VF.a, Fc = a.F, t0 = 0.05, d1 = 0.15, tr = 0.045, dc = 0.17, T1 = t0 + d1, T2 = T1 + tr, T3 = T2 + dc, T4 = T3 + tr, dur = T4 + d1 + 0.05;
            const mix = (t) => (t < T1 ? 0 : t < T2 ? (t - T1) / tr : t < T3 ? 1 : t < T4 ? 1 - (t - T3) / tr : 0);
            buf = synth((t) => { const m = mix(t); return { f0: 128 - (25 * t) / dur, av: (1 - m) + m * a.gv, ah: m * Math.min(1.2, 4 * a.gh), af: m * Math.min(1.3, 1.1 * a.gn), ff: 5470, fb: 1600, nz: a.An && m > 0.4 ? 1700 : 0, F: [...Fa.map((f, k) => f + (Fc[k] - f) * m), ...FHI], B: BW5 }; }, dur);
            segs = [T2, T3];
          }
          syl = { key, buf, segs, dur: buf.length / SR, S: stft(M, buf, { win: 0.005, fmax: 7000 }) };
          return syl;
        };
        v.soundButton('Listen', (snd) => snd.samples(normalise(sound().buf.slice(), 0.85, 0.02), SR, { gain: 0.6 }));
        // particles: oral and nasal paths; speed ∝ (flow / local area), compressed so that slow flows still move
        const R = v.rng(4), oral = M.range(150).map(() => [R(), R() * 2 - 1]), nasal = M.range(60).map(() => [R(), R() * 2 - 1]);
        const CX = 17.6;
        const halfOral = (x, a) => (x < 3.4 ? 2.2 : x < 5.8 ? 0.55 : x < 6.25 ? Math.max(0.04, 0.55 * Math.sqrt(a.Ag / 0.6)) : Math.abs(x - CX) < 0.55 ? 0.95 * Math.sqrt(Math.min(3, a.Ac) / 3) : x < 20.6 ? 0.95 : 0.95 + 0.3 * (x - 20.6));
        const OPATH = [[1.6, 0], [20.6, 0], [24.5, 0]], NPATH = [[1.6, 0], [8.6, 0], [9.6, 1.7], [10.1, 3.1], [20.6, 3.1], [24.5, 3.1]];
        const pathPos = (P, u) => { const S = arcLen(P), L = S[S.length - 1], q = along(P, S, u * L); return [q.x, q.y, q.nx, q.ny]; };
        const timeTable = (P, half, U) => { // cumulative travel time along a path, sampled at 240 points
          const n = 240, tt = [0]; let acc = 0, last = pathPos(P, 0);
          for (let i = 1; i <= n; i++) { const p = pathPos(P, i / n), ds = Math.hypot(p[0] - last[0], p[1] - last[1]), A = Math.max(0.02, half(p[0], p[1]) ** 2 * 3.3), speed = 0.6 + 2.2 * Math.pow((U * 1e6) / A / 100, 0.45); acc += ds / speed; tt.push(acc); last = p; }
          return tt;
        };
        let info = null;
        v.animate((t) => {
          const a = aero(), S = sound();
          info = a;
          // ---- the schematic tract: lungs, trachea, glottis, pharynx and mouth, nasal branch
          const pres = (P) => clampN(P / PS, 0, 1);
          tube.rect(0.3, -2.3, 3.4, 2.3, { fill: 'red', fillAlpha: 0.2, color: 'muted', width: 1.3 });
          tube.text('lungs', 1.85, 1.75, { size: 11.5, color: 'muted', align: 'center' });
          tube.text('8 cm H₂O', 1.85, -1.75, { size: 11, color: 'red', align: 'center' });
          tube.rect(3.4, -0.55, 5.9, 0.55, { fill: 'red', fillAlpha: 0.2, stroke: false });
          tube.rect(6.25, -0.95, CX - 0.55, 0.95, { fill: 'red', fillAlpha: 0.02 + 0.18 * pres(a.Po), stroke: false });
          if (nas.value) tube.poly([[8.4, 0.95], [9.6, 0.95], [10.6, 2.6], [20.6, 2.6], [20.6, 3.6], [9.9, 3.6], [8.6, 0.95]], { fill: 'red', fillAlpha: 0.02 + 0.18 * pres(a.Po), stroke: false });
          const wall = { color: 'ink', width: 2.2 };
          tube.line(3.4, 0.55, 5.9, 0.55, wall); tube.line(3.4, -0.55, 5.9, -0.55, wall);
          const hc = 0.95 * Math.sqrt(Math.min(3, a.Ac) / 3);
          tube.path([[6.25, 0.95], [8.4, 0.95]], wall);
          tube.path([[9.7, 0.95], [CX - 0.9, 0.95], [CX - 0.45, hc], [CX + 0.45, hc], [CX + 0.9, 0.95], [20.6, 0.95]], wall);
          tube.path([[6.25, -0.95], [CX - 0.9, -0.95], [CX - 0.45, -hc], [CX + 0.45, -hc], [CX + 0.9, -0.95], [20.6, -0.95]], wall);
          tube.path([[8.4, 0.95], [9.4, 2.6], [9.9, 3.6], [20.6, 3.6]], { color: 'muted', width: 1.6 }); tube.path([[9.7, 0.95], [10.6, 2.6], [20.6, 2.6]], { color: 'muted', width: 1.6 });
          // velum: a flap that seals the nasal branch or hangs open
          if (nas.value) tube.line(9.7, 0.95, 10.4, 0.25, { color: 'pink', width: 4 }); else tube.line(8.4, 0.95, 9.7, 0.95, { color: 'pink', width: 4 });
          tube.text('velum', 9.05, nas.value ? -0.35 : 1.3, { size: 10.5, color: 'muted', align: 'center' });
          // glottis
          const hg = 0.55 * Math.sqrt(a.Ag / 0.6) * (voi.value ? 0.55 + 0.45 * Math.abs(Math.sin(t * 9)) : 1);
          tube.poly([[5.9, 0.55], [6.25, hg], [6.25, 0.55]], { fill: 'muted', fillAlpha: 0.9, stroke: false }); tube.poly([[5.9, -0.55], [6.25, -hg], [6.25, -0.55]], { fill: 'muted', fillAlpha: 0.9, stroke: false });
          tube.text(voi.value ? 'vocal folds (vibrating)' : 'glottis open', 6.1, -1.35, { size: 10.5, color: 'muted', align: 'center' });
          tube.text('constriction', CX, -1.35, { size: 10.5, color: 'gold', align: 'center' });
          tube.text('lips', 20.6, -1.35, { size: 10.5, color: 'muted', align: 'center' });
          if (nas.value) tube.text('nose', 21.7, 3.1, { size: 10.5, color: 'teal', align: 'left' });
          // particles
          const drawFlow = (pts, P, U, nasalPath) => {
            const half = (x, y) => (nasalPath && y > 0.9 ? 0.45 : halfOral(x, a));
            const tt = timeTable(P, half, U), T = tt[tt.length - 1];
            for (const [ph, eta] of pts) {
              let u;
              if (U <= 0) u = ph * 0.82; // no flow: parcels sit still (behind a closure they are merely compressed)
              else { const tau = (ph * T + t) % T; let lo = 0, hi = tt.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (tt[m] < tau) lo = m; else hi = m; } u = (lo + (tau - tt[lo]) / (tt[hi] - tt[lo] || 1)) / (tt.length - 1); }
              const [x, y, nx, ny] = pathPos(P, u);
              if (U <= 0 && !nasalPath && x > CX - 0.6) continue;
              let w = half(x, y) * 0.85 * eta;
              let px = x + nx * w, py = y + ny * w;
              if (!nasalPath && x > CX + 0.2 && x < 23 && a.Re > REC && U > 0) { const k = Math.min(1, (x - CX) / 2), amp = k * Math.min(0.75, 0.22 * Math.log2(a.Re / REC) + 0.15); py += amp * Math.sin(17 * ph + 6 * t + 3 * x) * Math.cos(5 * eta + 4 * t); px += 0.25 * amp * Math.sin(11 * eta + 7 * t); }
              if (py > -2.8 && py < 4.2) tube.dot(px, py, { r: 2.1, color: nasalPath ? 'teal' : U > 0 ? 'accent' : 'muted' });
            }
          };
          drawFlow(oral, OPATH, a.Uc, false);
          if (nas.value) drawFlow(nasal, NPATH, a.Un, true);
          if (a.Ac === 0) tube.text(nas.value ? 'mouth closed: all air leaves through the nose' : 'closed: no flow, pressure behind the closure rises to the lung pressure', 12, -2.35, { size: 11.5, color: 'red', align: 'center' });
          else if (a.Re > REC) tube.text('turbulent jet', CX + 2.2, -0.0 + 1.45, { size: 11, color: 'orange', align: 'center' });
          tube.text(`${a.manner} [${a.sym}]`, 23.8, -2.35, { size: 14, color: 'accent', align: 'right', weight: 650 });
          // ---- gauges
          const bar = (row, label, frac, col, marks, val) => {
            const y = 4.35 - row * 1.2;
            gauge.text(label, 0.03, y + 0.27, { size: 11.5, color: 'ink', align: 'left' });
            gauge.text(val, 0.97, y + 0.27, { size: 11.5, color: col, align: 'right', weight: 650 });
            gauge.rect(0.03, y - 0.28, 0.97, y, { fill: 'grid', fillAlpha: 0.7, stroke: false });
            gauge.rect(0.03, y - 0.28, 0.03 + 0.94 * clampN(frac, 0, 1), y, { fill: col, fillAlpha: 0.75, stroke: false });
            for (const [f, txt] of marks) { const x = 0.03 + 0.94 * f; gauge.line(x, y - 0.4, x, y + 0.08, { color: 'ink', width: 1.6 }); gauge.text(txt, x, y - 0.52, { size: 10, color: 'muted', align: 'center' }); }
          };
          bar(0, 'pressure in the mouth', a.Po / PS, 'red', [], `${v.fix(a.Po / CMH2O, 1)} cm H₂O`);
          bar(1, 'pressure drop across the glottis', a.dPg / PS, a.dPg > 200 ? 'green' : 'red', [[200 / PS, 'voicing needs ≈ 2']], `${v.fix(a.dPg / CMH2O, 1)} cm H₂O`);
          const lr = (x) => (Math.log10(Math.max(x, 10)) - 1) / 4;
          bar(2, 'Reynolds number in the constriction', lr(a.Re), a.Re > REC ? 'orange' : 'accent', [[lr(REC), 'turbulent above ≈ 1800']], a.Ac ? Math.round(a.Re).toLocaleString('en-US') : '—');
          const nl = Math.max(a.Ln + 20 * Math.log10(Math.max(1e-6, M.smoothstep(REC, 1.6 * REC, a.Re))), -60);
          bar(3, 'turbulence noise, re [s]', (nl + 60) / 66, 'orange', [[50 / 66, '−10 dB']], a.Ac && a.Re > REC ? `${Math.round(nl) === 0 ? '0' : v.fix(nl, 0)} dB` : 'none');
          // ---- spectrogram of [aCa]
          sg.setView([0, S.dur], [0, 7000]);
          drawSpec(sg, S.S, v.rgb('ink'), { key: S.key, range: 48 });
          for (const x of S.segs) sg.vline(x, { color: 'gold', dash: [4, 3], width: 1.4 });
          sg.corner(`[a${a.sym}a]`, 'tr', { color: 'accent', weight: 650 });
        }, { still: 1.3 });
        v.readout(() => info && `$A_c$ = ${info.Ac ? v.fix(info.Ac, 3) + ' cm²' : '0 (closed)'} · flow $U$ = ${v.fix(info.U * 1e3, 2)} L/s · jet speed $u = \\sqrt{2P_{oral}/\\rho}$ = ${v.fix(info.uc, 1)} m/s · Re = ${Math.round(info.Re)} · ${info.F ? `F1 of the tract = ${Math.round(info.F[0])} Hz · ` : ''}**${info.manner}**${voi.value && info.gv < 0.15 ? ' · voicing fails: almost no pressure drop across the vocal folds' : ''}`);
      },
    },
    // ------------------------------------------------------------------ 1.5
    {
      num: '1.5',
      kind: 'Concept',
      name: 'Voicing and voice onset time',
      statement: String.raw`A sound is **voiced** when the vocal folds vibrate during it and **voiceless** when they are held apart. For stops, voicing is best described by the **voice onset time** (VOT): the interval from the release of the closure to the start of vocal-fold vibration, negative when voicing starts before the release. Three regions are used by the world's languages:

- **prevoiced** stops, VOT below about −30 ms: voicing runs through the closure, [b];
- **short-lag** stops, VOT from about 0 to 30 ms: plain voiceless unaspirated, [p];
- **long-lag** stops, VOT above about 40 ms: aspirated, [pʰ], the gap filled with breathy noise.

Languages carve this one phonetic dimension differently: Spanish contrasts prevoiced /b/ with short-lag /p/, English contrasts short-lag /b/ with long-lag /p/, and Thai uses all three.`,
      idea: String.raw`Voicing needs air flowing through the glottis, which a closed mouth soon stops (ling-1.4); to keep the folds vibrating through a closure the speaker must expand the pharynx, so prevoicing takes effort, and voicing in a closure radiates only as a low "voice bar". After the release, if the folds are still apart, air rushes through the open glottis and makes aspiration noise in the formant region until they close and vibrate. Lisker and Abramson (1964) measured VOT in eleven languages and found that this single timing variable separates the stop categories of every one of them, with the categories clustering in the same three regions. The manner here is plosive (ling-1.4); only the timing of the larynx relative to the lips changes.`,
      caption: String.raw`Drag the **gold** handle along the VOT axis (bottom) from −150 to +120 ms. The waveform and spectrogram show the synthesized syllable: a low voice bar before the release when VOT is negative, the burst at time 0, then aspiration noise until voicing starts (green line). The coloured bands are the categories that listeners of the chosen language hear, with Lisker and Abramson's (1964) production means marked; English puts both [b] and [p] in its /b/, while Spanish puts [p] in its /p/. *Listen*, or play the three types in a row.`,
      deps: ['ling-1.4'],
      refs: ['Ladefoged & Johnson'],
      tags: ['voicing', 'VOT'],
      credit: 'L. Lisker & A. S. Abramson, 1964',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Voice_onset_time' },
      viz(v) {
        const M = v.M, T0 = -0.17, T1 = 0.22;
        const lang = v.select('listener', [{ value: 'en', label: 'English' }, { value: 'es', label: 'Spanish' }, { value: 'th', label: 'Thai' }], 'en');
        const wav = v.stage({ x: [T0, T1], y: [-1.15, 1.5], height: 140, axes: false, full: true });
        const sg = v.stage({ x: [T0, T1], y: [0, 5000], height: 190, axes: 'box', full: true, yticks: [[0, '0'], [1000, '1k'], [2000, '2k'], [3000, '3k'], [4000, '4k'], [5000, '5 kHz']], xticks: [-0.15, -0.1, -0.05, [0, '0'], 0.05, 0.1, 0.15, [0.2, '200 ms']].map((x) => (Array.isArray(x) ? x : [x, `${Math.round(x * 1000)}`])) });
        const ax = v.stage({ x: [-180, 130], y: [-1.25, 1.2], height: 120, axes: false, full: true });
        const H = ax.handle(45, 0, { color: 'gold', r: 9, constrain: (x) => [clampN(x, -150, 120), 0] });
        // categories heard by listeners (approximate boundaries) and production means (Lisker & Abramson 1964, labial stops)
        const LANG = {
          en: { cats: [[-180, 25, '/b/', 'accent'], [25, 130, '/p/', 'orange']], means: [[1, '/b/'], [58, '/p/']] },
          es: { cats: [[-180, 0, '/b/', 'accent'], [0, 130, '/p/', 'orange']], means: [[-138, '/b/'], [4, '/p/']] },
          th: { cats: [[-180, -20, '/b/', 'accent'], [-20, 35, '/p/', 'green'], [35, 130, '/pʰ/', 'orange']], means: [[-97, '/b/'], [6, '/p/'], [64, '/pʰ/']] },
        };
        const cache = new Map();
        const syl = (vot) => {
          const key = Math.round(vot);
          if (cache.has(key)) return cache.get(key);
          const dcl = Math.max(0.1, -vot / 1000 + 0.03), r = speak([['p', dcl], ['a', 0.26]], { vot: vot / 1000, lead: 0.06, f0: (t) => 120 - 15 * t });
          const tr = r.segs[0].t1, S = stft(M, r.buf, { win: 0.005, fmax: 5000 });
          const out = { buf: r.buf, tr, S }; cache.set(key, out); return out;
        };
        const play = (snd, vots) => {
          const parts = vots.map((x) => normalise(syl(x).buf.slice(), 0.85, 0.015)), gap = Math.round(0.25 * SR);
          const out = new Float32Array(parts.reduce((a, p) => a + p.length + gap, 0)); let o = 0; for (const p of parts) { out.set(p, o); o += p.length + gap; }
          snd.samples(out, SR, { gain: 0.6 });
        };
        v.soundButton('Listen', (snd) => play(snd, [H.x]));
        v.soundButton('[b], [p], [pʰ]', (snd) => play(snd, [-90, 10, 70]));
        v.legend([['gold', 'release (burst)', { dash: true }], ['green', 'voicing starts', { dash: true }], ['muted', 'production means (Lisker & Abramson 1964)', { dot: true }]]);
        let info = null;
        v.render(() => {
          const vot = H.x, d = syl(vot), L = LANG[lang.value];
          // waveform, aligned so that the release is at 0
          const i0 = Math.max(0, Math.round((d.tr + T0) * SR)), i1 = Math.min(d.buf.length, Math.round((d.tr + T1) * SR));
          let mx = 0; for (let i = i0; i < i1; i++) mx = Math.max(mx, Math.abs(d.buf[i]));
          const pts = []; for (let i = i0; i < i1; i += 2) pts.push([i / SR - d.tr, d.buf[i] / (mx || 1)]);
          wav.path(pts, { color: 'accent', width: 1.1 });
          const vOn = Math.max(vot, 0) / 1000;
          wav.vline(0, { color: 'gold', dash: [5, 4], width: 1.6 }); wav.vline(vot / 1000, { color: 'green', dash: [5, 4], width: 1.6 });
          if (Math.abs(vot) > 6) wav.measure(Math.min(0, vot / 1000), 1.12, Math.max(0, vot / 1000), 1.12, `VOT ${vot > 0 ? '+' : '−'}${Math.abs(Math.round(vot))} ms`, { color: 'ink', math: false, size: 11.5, offset: -10 });
          if (vot < -6) wav.text('voice bar', vot / 2000, -1.02, { size: 11, color: 'muted', align: 'center' });
          if (vot > 12) wav.text('aspiration', vOn / 2, -1.02, { size: 11, color: 'orange', align: 'center' });
          wav.text('vowel [a]', 0.15, -1.02, { size: 11, color: 'muted', align: 'center' });
          // spectrogram
          drawSpec(sg, d.S, v.rgb('ink'), { key: Math.round(vot), t0: -d.tr, range: 50 });
          sg.vline(0, { color: 'gold', dash: [5, 4], width: 1.6 }); sg.vline(vot / 1000, { color: 'green', dash: [5, 4], width: 1.6 });
          // the VOT axis with the listener's categories
          for (const [a, b, lab, col] of L.cats) { ax.rect(a, -0.45, b, 0.45, { fill: col, fillAlpha: 0.2, stroke: false }); ax.text(lab, (Math.max(a, -175) + b) / 2, 0.8, { size: 13, color: col, align: 'center', weight: 650 }); }
          for (const [a] of L.cats.slice(1)) ax.vline(a, { color: 'ink', width: 1.5, dash: [3, 3] });
          ax.line(-180, 0, 130, 0, { color: 'muted', width: 1 });
          for (let x = -150; x <= 120; x += 30) { ax.line(x, -0.5, x, -0.38, { color: 'muted', width: 1 }); ax.text(`${x > 0 ? '+' : x < 0 ? '−' : ''}${Math.abs(x)}${x === 120 ? ' ms' : ''}`, x, -0.8, { size: 10.5, color: 'muted', align: x === 120 ? 'right' : 'center' }); }
          for (const [m, lab] of L.means) { const x = Math.max(-176, m); ax.dot(x, 0, { r: 4.5, color: 'muted' }); ax.text(m < -176 ? `${lab} ${m} ←` : '', x + 4, -0.25, { size: 10, color: 'muted', align: 'left' }); }
          const ph = vot < -10 ? 'prevoiced [b]' : vot <= 30 ? 'short-lag [p]' : 'aspirated [pʰ]';
          const heard = (lg) => LANG[lg].cats.find(([a, b]) => vot >= a && vot < b)[2];
          info = { vot, ph, en: heard('en'), es: heard('es'), th: heard('th') };
        });
        v.readout(() => info && `VOT = **${info.vot > 0 ? '+' : info.vot < 0 ? '−' : ''}${Math.abs(Math.round(info.vot))} ms**: phonetically ${info.ph} · heard as English **${info.en}**, Spanish **${info.es}**, Thai **${info.th}**`);
      },
    },
    // ------------------------------------------------------------------ 1.6
    {
      num: '1.6',
      kind: 'Concept',
      name: 'Vowels: height, backness and rounding',
      statement: String.raw`Vowels are made with an open vocal tract and are classified by three articulatory dimensions: **height** (how close the highest part of the tongue body comes to the roof of the mouth: close, close-mid, open-mid, open), **backness** (whether that highest point is towards the front, centre or back of the mouth), and **lip rounding**. The IPA vowel chart is a stylised map of tongue positions, a trapezoid because the tongue has more room to move front and back when it is high. The cardinal vowels [i e ɛ a ɑ ɔ o u] are reference points spaced around its edge. Acoustically, the first formant falls as the tongue rises (F1 tracks height inversely), the second formant falls as the tongue moves back (F2 tracks backness), and rounding lowers F2 and F3 by lengthening and narrowing the lip tube.`,
      idea: String.raw`The tongue body divides the tract into a back cavity (pharynx) and a front cavity (mouth) joined by a constriction. Raising the tongue narrows that constriction and lowers F1 (a Helmholtz-like resonance of the back cavity with the constriction as its neck), while pulling the tongue down and back narrows the pharynx and raises F1. Moving the constriction forward shortens the front cavity and lengthens the back one, raising F2; rounding the lips adds a narrow tube in front and lowers the formants affiliated with the front of the tract. These are exactly the perturbations of the uniform tube (ling-1.8) computed here from the drawing; the symbols and their positions come from the IPA chart (ling-1.2).`,
      caption: String.raw`Drag the **tongue body** (blue handle) around the mouth and toggle **lip rounding**. The tract's cross-sectional area along its length (bottom strip) is read off the drawing, and its resonances F1–F3 are computed by a chain-of-tubes model; the right panel places the result on an F1–F2 chart beside the measured cardinal vowels (grey), naming the nearest one. *Listen* synthesizes the vowel from the computed formants; with *sound while dragging* on, it sounds continuously and follows your drag. Try a high front tongue for [i], low back for [ɑ], and round a high back tongue for [u].`,
      deps: ['ling-1.2'],
      refs: ['Ladefoged & Johnson'],
      tags: ['vowels', 'articulation'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Vowel' },
      viz(v) {
        const M = v.M;
        const rnd = v.toggle('lips rounded', false, { onChange: () => voice.update(loopBuf) });
        const live = v.toggle('sound while dragging', false, { onChange: (on) => { if (on) voice.start(loopBuf()); else voice.stop(); } });
        const tr = v.stage({ x: [-2.5, 9.6], y: [-9.6, 4.6], equal: true, height: 360, axes: false, minWidth: 280, weight: 1.1 });
        const LF = (f) => -Math.log(f);
        const ch = v.stage({ x: [LF(2700), LF(480)], y: [LF(1000), LF(185)], height: 360, axes: 'box', minWidth: 260, title: 'computed formants on the F1–F2 chart', xticks: [2500, 2000, 1500, 1000, 700, 500].map((f) => [LF(f), f >= 1000 ? `${f / 1000}k` : `${f}`]), yticks: [200, 300, 400, 600, 800].map((f) => [LF(f), `${f}`]), xlabel: 'F2 (Hz)', ylabel: 'F1 (Hz)' });
        const af = v.stage({ x: [0, 18.5], y: [0, 10], height: 130, axes: 'box', full: true, title: 'area function read off the drawing: cross-section $A$ (cm²) against distance from the glottis (cm)', yticks: [0, 5, 10] });
        const H = tr.handle(3.4, 1.2, { color: 'accent', r: 8, constrain: (x, y) => { const hx = clampN(x, 3.0, 5.8); return [hx, fitTongue(hx, clampN(y, -1.0, 1.9))]; } });
        H.set(3.4, fitTongue(3.4, 1.9));
        const CSYM = ['i', 'e', 'ɛ', 'a', 'y', 'ø', 'œ', 'ɶ', 'ɯ', 'ɤ', 'ʌ', 'ɑ', 'u', 'o', 'ɔ', 'ɒ'];
        const voice = loopVoice(v);
        let cache = { key: null };
        const model = () => {
          const key = [v.fix(H.x, 2), v.fix(H.y, 2), rnd.value].join();
          if (cache.key === key) return cache;
          const { A, dl, lipA } = areaFunction(H.x, H.y, rnd.value), F = tubeFormants(A, dl, 3);
          let best = 0, bd = 1e9;
          CARD.forEach((c, i) => { const d = Math.hypot(Math.log(F[0] / c[3]), Math.log(F[1] / c[4])); if (d < bd) { bd = d; best = i; } });
          cache = { key, A, dl, lipA, F, near: best, dist: bd };
          return cache;
        };
        const loopBuf = () => { const m = model(); return normalise(vowelPeriod([...m.F, ...FHI], BW5, 133), 0.8, 0); };
        H.onDrag = () => voice.update(loopBuf);
        v.soundButton('Listen', (snd) => { live.set(false); const m = model(); snd.samples(normalise(synth((t) => ({ f0: 126 - 22 * t, av: 1, ah: 0, af: 0, F: [...m.F, ...FHI], B: BW5 }), 0.8), 0.85, 0.05), SR, { gain: 0.6 }); });
        for (const [nm, x, y, r] of [['i', 3.3, 1.9, false], ['ɑ', 5.6, -1.0, false], ['u', 5.6, 1.9, true]]) v.button(`[${nm}]`, () => { H.set(x, fitTongue(x, y)); rnd.set(r); voice.update(loopBuf); });
        let info = null;
        v.render(() => {
          const m = model();
          drawTract(tr, { hx: H.x, hy: H.y, round: rnd.value, velum: 'up', glottis: 'voiced' });
          if (rnd.value) tr.text('rounded', -1.9, -1.4, { size: 11, color: 'purple', align: 'center' });
          // F1–F2 chart
          CARD.forEach((c, i) => ch.text(CSYM[i], LF(c[4]), LF(c[3]), { size: 15, color: i === m.near ? 'accent' : 'muted', align: 'center', weight: i === m.near ? 700 : 450 }));
          ch.dot(LF(m.F[1]), LF(m.F[0]), { r: 7, color: 'gold' });
          ch.corner(`nearest: [${CSYM[m.near]}]`, 'tr', { color: 'accent', weight: 650, size: 13 });
          // area function: glottis on the left, lips on the right
          const L = m.A.length * m.dl;
          m.A.forEach((a, i) => af.rect(i * m.dl, 0, (i + 1) * m.dl - 0.04, Math.min(a, 10), { fill: i >= m.A.length - (rnd.value ? 4 : 2) ? 'purple' : 'accent', fillAlpha: 0.55, stroke: false }));
          af.text('glottis', 0.3, 9.0, { size: 10.5, color: 'muted', align: 'left' }); af.text('lips', L - 0.1, 9.0, { size: 10.5, color: 'purple', align: 'right' });
          info = { F: m.F, near: CSYM[m.near], L, minA: Math.min(...m.A), at: m.A.indexOf(Math.min(...m.A.slice(0, m.A.length - 4))) * m.dl };
        });
        v.readout(() => info && `tongue body ${H.y > 0.6 ? 'high' : H.y > -0.2 ? 'mid' : 'low'} and ${H.x < 4.0 ? 'front' : H.x < 4.9 ? 'central' : 'back'}, lips ${rnd.value ? 'rounded' : 'spread'} · tube model: F1 = **${Math.round(info.F[0])} Hz**, F2 = **${Math.round(info.F[1])} Hz**, F3 = ${Math.round(info.F[2])} Hz (tract ${v.fix(info.L, 1)} cm) · nearest cardinal vowel **[${info.near}]**`);
      },
    },
    // ------------------------------------------------------------------ 1.7
    {
      num: '1.7',
      kind: 'Concept',
      name: 'Formants: resonances of the vocal tract',
      statement: String.raw`The **formants** F1, F2, F3, … of a speech sound are the resonance frequencies of the vocal tract, seen as peaks of the envelope of its spectrum. They are properties of the filter, not of the source: changing the pitch $f_0$ moves the harmonics, which always sit at $k f_0$, but leaves the envelope and its peaks where they are, so a vowel keeps its identity when sung on different notes. The harmonics only *sample* the envelope at multiples of $f_0$; formant frequencies must be inferred from those samples, which is easy for a low voice (harmonics close together compared with the formant bandwidths) and becomes impossible once $f_0$ is comparable to F1.`,
      idea: String.raw`In the source–filter model (ling-1.1) the output spectrum is the product of a harmonic line spectrum and the filter's transfer function. Raising $f_0$ spreads the lines apart but cannot move the resonances, which are set by the tract's shape (music-4.9 makes the same point for instruments). A spectrogram of a vowel sung on a rising glide shows it directly: the harmonics fan out as diverging curves, while the bands where they are strong stay horizontal. When the harmonic spacing exceeds the width of a formant peak, the peak can fall between two harmonics and become invisible; sopranos singing high notes face exactly this, and often move F1 up to the nearest harmonic, at the cost of vowel clarity.`,
      caption: String.raw`Pick a vowel and drag the pitch $f_0$. Left: the harmonics (stems) under the fixed resonance curve of the tract (dashed), computed from one period of the synthesized vowel; the red marker is F1 as an analyst would estimate it from the harmonics alone (the strongest harmonic once the source's slope is removed, refined by a parabola through its neighbours). Right: a narrow-band spectrogram of the vowel sung on a glide from 100 to 800 Hz, with the true formants as dashed lines and the current pitch marked; *Sing the glide* plays it. Raise $f_0$ past 400 Hz on [i] or [u] and watch the estimate of F1 break down.`,
      deps: ['ling-1.1', 'music-4.9'],
      refs: ['Ladefoged & Johnson', 'Jurafsky & Martin ch. 15'],
      tags: ['formants', 'acoustics'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Formant' },
      viz(v) {
        const M = v.M, FM = 4000, GL = [100, 800], GD = 2.6;
        const vow = v.select('vowel', ['i', 'ɛ', 'a', 'ɔ', 'u'].map((x) => ({ value: x, label: `[${x}]` })), 'a');
        const f0S = v.slider('pitch $f_0$', 80, 1000, 120, { log: true, fmt: (x) => `${Math.round(SR / Math.round(SR / x))} Hz` });
        const sp = v.stage({ x: [0, FM], y: [-62, 30], height: 300, axes: 'box', minWidth: 280, title: 'spectrum of one period (dB)', xticks: [[0, '0'], [1000, '1k'], [2000, '2k'], [3000, '3k'], [4000, '4 kHz']] });
        const sg = v.stage({ x: [0, GD], y: [0, FM], height: 300, axes: 'box', minWidth: 280, title: 'sung glide, narrow-band spectrogram', xlabel: 'time (s)', yticks: [[0, '0'], [1000, '1k'], [2000, '2k'], [3000, '3k'], [4000, '4 kHz']] });
        const Fof = () => [...VF[vow.value], ...FHI];
        const glideF0 = (t) => GL[0] * Math.pow(GL[1] / GL[0], Math.min(1, t / GD));
        const glides = new Map();
        const glide = () => {
          if (glides.has(vow.value)) return glides.get(vow.value);
          const F = Fof(), buf = synth((t) => ({ f0: glideF0(t), av: 1, ah: 0, af: 0, F, B: BW5 }), GD + 0.05, { jitter: 0.002 });
          const g = { buf, S: stft(M, buf, { win: 0.045, hop: 0.01, fmax: FM, nfft: 2048 }) }; glides.set(vow.value, g); return g;
        };
        const ph = playhead(v);
        v.soundButton('Listen', (snd) => { const f0 = SR / Math.round(SR / f0S.value), F = Fof(); snd.samples(normalise(synth((t) => ({ f0: f0 * (1 + 0.012 * Math.sin(2 * Math.PI * 5.5 * t)), av: 1, ah: 0, af: 0, F, B: BW5 }), 1.2), 0.85, 0.06), SR, { gain: 0.55 }); });
        v.soundButton('Sing the glide', (snd) => { snd.samples(normalise(glide().buf.slice(), 0.85, 0.06), SR, { gain: 0.5 }); ph.start(GD); });
        v.legend([['accent', 'harmonics $k f_0$', { dot: true }], ['ink', 'tract resonance curve', { dash: true }], ['orange', 'true formants F1–F3', { dash: true }], ['red', 'F1 estimated from the harmonics', { dot: true }]]);
        let info = null;
        v.render(() => {
          const P = Math.round(SR / f0S.value), f0 = SR / P, F = Fof();
          const per = vowelPeriod(F, BW5, P), h = harmonicsDb(M, per), src = harmonicsDb(M, vowelPeriod([], [], P));
          const ref = src[1];
          // resonance curve placed on the harmonics: filter gain + the source's trend
          const tilt = (f) => { const k = f / f0, lo = Math.max(1, Math.floor(k)), hi = lo + 1; return hi < src.length ? src[lo] + (src[hi] - src[lo]) * Math.max(0, k - lo) : src[lo]; };
          sp.fn((f) => dB(tractGain(F, BW5, f)) + tilt(Math.max(f, f0)) - ref, { domain: [30, FM], n: 500, color: 'ink', dash: [5, 4], width: 1.4 });
          for (let k = 0; k < 3; k++) { sp.vline(F[k], { color: 'orange', dash: [3, 4], alpha: 0.8 }); sp.text(`F${k + 1}`, F[k], 27, { size: 11.5, color: 'orange', align: 'center', weight: 650 }); }
          for (let k = 1; k * f0 < FM && k < h.length; k++) { sp.line(k * f0, -62, k * f0, h[k] - ref, { color: 'accent', width: 1.8 }); sp.dot(k * f0, h[k] - ref, { r: 3, color: 'accent' }); }
          // F1 as estimated from the harmonics: the strongest harmonic below 1.2 kHz, refined by a parabola through its neighbours
          const hf = h.map((x, k) => x - src[k]); // harmonics with the source's slope removed: samples of the filter gain
          let kb = 1; for (let k = 1; k * f0 < 1200 && k < hf.length; k++) if (hf[k] > hf[kb]) kb = k;
          let est = kb * f0;
          if (kb > 1 && hf[kb + 1] != null) { const a = hf[kb - 1], b = hf[kb], c = hf[kb + 1], den = a - 2 * b + c; if (den < 0) est = f0 * (kb + clampN((0.5 * (a - c)) / den, -0.5, 0.5)); }
          sp.dot(est, h[kb] - ref + 4, { r: 5.5, color: 'red' });
          sp.corner(`f₀ = ${Math.round(f0)} Hz`, 'tr', { color: 'accent', weight: 650 });
          // glide spectrogram
          const g = glide();
          drawSpec(sg, g.S, v.rgb('ink'), { key: 'g' + vow.value, range: 50 });
          for (let k = 0; k < 3; k++) sg.hline(F[k], { color: 'orange', dash: [5, 4], width: 1.3 });
          const tNow = f0 >= GL[0] && f0 <= GL[1] ? (GD * Math.log(f0 / GL[0])) / Math.log(GL[1] / GL[0]) : null;
          if (tNow != null) { sg.vline(tNow, { color: 'accent', width: 1.6 }); sg.dot(tNow, f0, { r: 4, color: 'accent' }); }
          if (ph.t != null) sg.vline(Math.min(GD, ph.t), { color: 'gold', width: 2 });
          info = { f0, F1: F[0], est, err: (100 * (est - F[0])) / F[0], kb };
        });
        v.readout(() => info && `$f_0$ = ${Math.round(info.f0)} Hz, so harmonics every ${Math.round(info.f0)} Hz · true F1 = ${info.F1} Hz · F1 read off the harmonics = **${Math.round(info.est)} Hz** (${info.err >= 0 ? '+' : '−'}${v.fix(Math.abs(info.err), 0)} %)${info.f0 > 0.8 * info.F1 ? ' · the harmonics are now too sparse to show the F1 peak: the estimate is just the nearest harmonic' : ''}`);
      },
    },
    // ------------------------------------------------------------------ 1.8
    {
      num: '1.8',
      kind: 'Model',
      name: 'The uniform tube: a quarter-wave resonator',
      statement: String.raw`Model the vocal tract as a uniform tube of length $L$ (about 17 cm for an adult man, 14.5 cm for a woman), closed at the glottis, where the folds are nearly shut, and open at the lips. Plane sound waves in it resonate when the tube holds an odd number of quarter wavelengths, i.e. at
$$F_n=\frac{(2n-1)\,c}{4L},\qquad n=1,2,3,\ldots$$
With $c\approx350$ m/s in warm humid air and $L=17.5$ cm this gives 500, 1500, 2500 Hz: the formants of the neutral vowel schwa [ə]. Narrowing the tube changes the resonances in a predictable way: a constriction near a maximum of the volume velocity of a mode (a pressure node) lowers that formant, while one near a pressure maximum raises it. A tube open at both ends would instead resonate at $n\,c/2L$.`,
      idea: String.raw`At a closed end the air cannot move (volume velocity zero, pressure maximal); at an open end the pressure is atmospheric (pressure zero). The standing waves that fit these conditions have a quarter, three quarters, five quarters … of a wavelength in the tube, as for a stopped organ pipe (music-3.3). For non-uniform shapes the tube is cut into short sections and the transfer matrices of the sections are multiplied; resonances are the frequencies where the volume velocity at the glottis vanishes for unit flow at the lips. Perturbation theory explains the direction of the shifts: narrowing a section increases the kinetic (inertial) energy stored where the air moves fast and decreases the potential (compressional) energy where the pressure swings, so the sign of (kinetic − potential) energy density, the **sensitivity function**, tells whether that formant falls or rises (ling-1.7).

For the stated lossless uniform tube, a harmonic pressure amplitude satisfies $P''+(\omega/c)^2P=0$. The constant-coefficient solution theorem (ode 3.13) gives the complete pair $\cos(\omega x/c)$ and $\sin(\omega x/c)$ for $\omega>0$. The closed-glottis condition is $P'(0)=0$, leaving only the cosine, while the open-lip condition $P(L)=0$ requires $\omega L/c=(2n-1)\pi/2$. Converting angular frequency to hertz yields the displayed odd-quarter-wave formula. This boundary calculation is for pressure, not the opposite node convention for volume velocity.`,
      caption: String.raw`Slide the tube length, then drag the **gold** handle to squeeze the tube anywhere (up and down sets the area). The middle panel shows the standing wave of the chosen formant, pressure (red) and volume velocity (blue), with the sensitivity shaded: blue where narrowing *lowers* this formant, red where it *raises* it. The right panel is the tube's response with its computed resonances (solid) against the uniform-tube values $(2n-1)c/4L$ (dashed). Squeeze near the lips (rounding) and every formant drops; squeeze near the glottis and they rise. Switch the glottis end to **open** to break the quarter-wave pattern.`,
      deps: ['ling-1.7', 'music-3.3', 'ode-3.13'],
      refs: ['Ladefoged & Johnson'],
      tags: ['tube model', 'acoustics'],
      credit: 'T. Chiba & M. Kajiyama 1941; G. Fant 1960',
      scope: String.raw`Holds for plane-wave propagation, i.e. below roughly 4–5 kHz where the tube's width is small compared with the wavelength, ignoring losses (which broaden the peaks), the yielding walls and the nasal side branch. A real tract is curved and non-uniform; the uniform tube describes only the neutral vowel, and other vowels are perturbations of it.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Acoustic_resonance#Closed_tube' },
      viz(v) {
        const M = v.M, A0 = 3.0, N = 70, FMX = 5000;
        const LS = v.slider('tube length $L$', 10, 20, 17.5, { step: 0.1, fmt: (x) => v.fix(x, 1) + ' cm' });
        const modeSel = v.select('show mode', [{ value: 0, label: 'F1' }, { value: 1, label: 'F2' }, { value: 2, label: 'F3' }], 0);
        const ends = v.select('glottis end', [{ value: 'closed', label: 'closed' }, { value: 'open', label: 'open' }], 'closed');
        const tube = v.stage({ x: [-0.8, 20.6], y: [-1.6, 1.6], height: 150, axes: false, full: true });
        const md = v.stage({ x: [0, 20], y: [-1.25, 1.25], height: 220, axes: 'box', minWidth: 270, title: 'standing wave and sensitivity (cm from the glottis)', yticks: [] });
        const tf = v.stage({ x: [0, FMX], y: [-25, 42], height: 220, axes: 'box', minWidth: 270, title: 'tube response (dB)', xticks: [[0, '0'], [1000, '1k'], [2000, '2k'], [3000, '3k'], [4000, '4k'], [5000, '5 kHz']] });
        const Hs = tube.handle(14.5, 0.55, { color: 'gold', r: 8, constrain: (x, y) => [clampN(x, 0.6, LS.value - 0.3), clampN(y, 0.18, 1.0)] });
        v.button('Uniform again', () => Hs.set(Hs.x, 1.0));
        const areas = () => { const L = LS.value, dl = L / N, Ac = A0 * Hs.y * Hs.y, xc = Math.min(Hs.x, L - 0.3); return { L, dl, A: M.range(N).map((i) => { const x = (i + 0.5) * dl; return A0 - (A0 - Ac) * Math.exp(-(((x - xc) / 1.0) ** 2)); }) }; };
        const modeShape = (A, dl, f) => { // pressure and volume velocity along the tube (glottis → lips), driven by unit flow at the lips
          const k = (2 * Math.PI * f) / C_TRACT, c = Math.cos(k * dl), sn = Math.sin(k * dl); let p = 0, u = 1; const P = [p], U = [u];
          for (let i = A.length - 1; i >= 0; i--) { const Z = 1 / A[i], p2 = c * p + Z * sn * u; u = c * u - (sn * p) / Z; p = p2; P.push(p); U.push(u); }
          return { P: P.reverse(), U: U.reverse() };
        };
        const formantsOf = () => { const { A, dl } = areas(); return tubeFormants(A, dl, 5, ends.value === 'open', 9000); };
        v.soundButton('Listen', (snd) => { const F = formantsOf(); snd.samples(normalise(synth((t) => ({ f0: 120 - 15 * t, av: 1, ah: 0, af: 0, F, B: BW5 }), 0.9), 0.85, 0.05), SR, { gain: 0.6 }); });
        v.legend([['red', 'pressure'], ['accent', 'volume velocity'], ['accent', 'narrowing lowers the formant', { area: true }], ['red', 'narrowing raises it', { area: true }]]);
        let info = null;
        v.render(() => {
          const { L, dl, A } = areas(), open = ends.value === 'open', F = tubeFormants(A, dl, 5, open, 9000), Fu = M.range(5).map((n) => (open ? ((n + 1) * C_TRACT) / (2 * L) : ((2 * n + 1) * C_TRACT) / (4 * L)));
          tube.setView([-0.8, Math.max(20.6, L + 0.8)], [-1.6, 1.6]);
          md.setView([0, L], [-1.25, 1.25]);
          // the tube, radius ∝ √area
          const top = A.map((a, i) => [(i + 0.5) * dl, Math.sqrt(a / A0)]), bot = top.map(([x, y]) => [x, -y]);
          tube.poly([[0, 1], ...top, [L, Math.sqrt(A[N - 1] / A0)], [L, -Math.sqrt(A[N - 1] / A0)], ...bot.reverse(), [0, -1]], { fill: 'accent', fillAlpha: 0.1, stroke: false });
          tube.path([[0, Math.sqrt(A[0] / A0)], ...top, [L, Math.sqrt(A[N - 1] / A0)]], { color: 'ink', width: 2.2 });
          tube.path([[0, -Math.sqrt(A[0] / A0)], ...top.map(([x, y]) => [x, -y]), [L, -Math.sqrt(A[N - 1] / A0)]], { color: 'ink', width: 2.2 });
          if (!open) tube.line(0, -1.05, 0, 1.05, { color: 'ink', width: 5 });
          tube.text(open ? 'glottis (open)' : 'glottis (closed)', 0, -1.4, { size: 11, color: 'muted', align: 'left' });
          tube.text('lips (open)', L, -1.4, { size: 11, color: 'muted', align: 'right' });
          tube.line(Hs.x, -Hs.y, Hs.x, Hs.y, { color: 'gold', dash: [3, 3], width: 1.2 });
          tube.text(`A = ${v.fix(A0 * Hs.y * Hs.y, 2)} cm²`, Hs.x, Hs.y + 0.42, { size: 11, color: 'gold', align: 'center' });
          // mode shape and sensitivity of the chosen formant
          const n = +modeSel.value, f = F[n], ms = modeShape(A, dl, f);
          const xs = M.range(N + 1).map((i) => i * dl), pm = Math.max(...ms.P.map(Math.abs)), um = Math.max(...ms.U.map(Math.abs));
          const sens = M.range(N).map((i) => { const ke = (0.5 * (ms.U[i] ** 2 + ms.U[i + 1] ** 2)) / A[i], pe = 0.5 * (ms.P[i] ** 2 + ms.P[i + 1] ** 2) * A[i]; return ke / (um * um / A0) - pe / (pm * pm * A0); });
          const sm = Math.max(...sens.map(Math.abs)) || 1;
          sens.forEach((sv, i) => md.rect(i * dl, 0, (i + 1) * dl, sv / sm, { fill: sv > 0 ? 'accent' : 'red', fillAlpha: 0.16, stroke: false }));
          md.path(xs.map((x, i) => [x, ms.P[i] / pm]), { color: 'red', width: 2.2 });
          md.path(xs.map((x, i) => [x, ms.U[i] / um]), { color: 'accent', width: 2.2 });
          md.hline(0, { color: 'faint' }); md.vline(Hs.x, { color: 'gold', dash: [3, 3] });
          md.corner(`F${n + 1} = ${Math.round(f)} Hz`, 'tr', { color: 'ink', weight: 650 });
          // response (cascade of resonators at the computed formants, the filter that is played)
          tf.fn((x) => dB(tractGain(F, BW5, x)), { domain: [0, FMX], n: 500, color: 'ink', width: 2 });
          Fu.forEach((x, k) => { if (x < FMX) tf.vline(x, { color: 'orange', dash: [4, 4], width: 1.3 }); if (F[k] < FMX) tf.vline(F[k], { color: k === n ? 'accent' : 'muted', width: k === n ? 2 : 1.2 }); });
          const iC = Math.min(N - 1, Math.floor(Hs.x / dl)), sc = sens[iC] / sm;
          info = { L, F, Fu, open, squeezed: Hs.y < 0.97, n, sc };
        });
        v.readout(() => info && `computed: ${info.F.slice(0, 3).map((x) => Math.round(x)).join(', ')} Hz · ${info.open ? 'open–open tube $nc/2L$' : 'quarter-wave $(2n-1)c/4L$'}: ${info.Fu.slice(0, 3).map((x) => Math.round(x)).join(', ')} Hz${info.squeezed ? ` · at the squeeze the sensitivity of F${info.n + 1} is ${info.sc > 0.05 ? '**positive**, so narrowing lowers it' : info.sc < -0.05 ? '**negative**, so narrowing raises it' : 'near zero, so it barely moves'} (now ${info.F[info.n] < info.Fu[info.n] ? '−' : '+'}${Math.round(Math.abs(info.F[info.n] - info.Fu[info.n]))} Hz)` : ''}`);
      },
    },
  ],
};
