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
/** Coarticulated consonant formants next to vowel V: locus + k·(vowel − locus). Velars have a vowel-dependent locus. */
function onsetF(pl, V) {
  if (!pl.loc) {
    if (pl.lf > 16) return V.slice(); // glottal: the vowel's own formants
    const f2 = 0.85 * V[1] + 600; return [230, f2, Math.max(V[2] - 150, f2 + 180)]; // velar: F2 and F3 pinch together
  }
  return [pl.loc[0] + 0.15 * (V[0] - pl.loc[0]), pl.loc[1] + 0.42 * (V[1] - pl.loc[1]), pl.loc[2] + 0.5 * (V[2] - pl.loc[2])];
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
    else if (s.mn === 'approx' || s.mn === 'latapprox') { tgt = APPROX[s.sym] || onsetF(s.pl, nearV(i)); a = b = (s.t0 + s.t1) / 2; }
    else if (s.mn === 'nasal') { tgt = onsetF(s.pl, nearV(i)); tgt = [260, tgt[1], tgt[2]]; }
    else tgt = onsetF(s.pl, nearV(i));
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
const clampN = (x, a, b) => Math.max(a, Math.min(b, x));
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
  const ix = 1.2, iy = -7.0, op = gs === 'voiceless' ? 0.42 : gs === 'closed' ? 0.0 : gs === 'breathy' ? 0.22 : 0.05;
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
/** Tongue control points for a constriction of width `gap` (cm) at a place (the rest of the tongue near neutral). */
function consCtl(place, gap) {
  const s = PLACE_S[place]; if (s == null) return tongueCtl(4.6, 0.2);
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
      idea: String.raw`Because the tract filters linearly, convolution in time becomes multiplication in frequency, so each harmonic of the source is simply scaled by the gain of the filter at its frequency. A periodic source has a line spectrum (its Fourier series), so voiced speech is a picket fence of harmonics whose heights trace the filter's resonance curve, while a noise source gives a continuous spectrum with the same peaks. The idea goes back to Johannes Müller's experiments with excised larynges (1848); Chiba and Kajiyama (1941) computed the tract's resonances, and Gunnar Fant's *Acoustic Theory of Speech Production* (1960) made source × filter the standard model; the formant model of timbre is music-4.10.`,
      caption: String.raw`Drag the **F1**, **F2**, **F3** handles on the middle panel to reshape the filter, or pick a preset. The left panel is the source, the right one the output: every harmonic of the output is the source harmonic raised by the filter's gain at that frequency, and the readout checks this against the spectrum of the waveform actually synthesized (time domain, then FFT). Change the pitch: the harmonics slide, the envelope stays. Switch the source to **whisper**: the harmonics vanish but the formant peaks (and the vowel) remain. *Source alone* plays the buzz before the tract shapes it. (The lip radiation is folded into the source here.)`,
      deps: ['music-4.10'],
      refs: ['Ladefoged & Johnson', 'Jurafsky & Martin ch. 15'],
      tags: ['source-filter', 'acoustics'],
      credit: 'J. Müller 1848; T. Chiba & M. Kajiyama 1941; G. Fant 1960',
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
          // noise: averaged spectrum of white noise, alone and through the same filter (Welch, 512-point Hann frames)
          let nS = null, nO = null, wS = null, wO = null;
          if (srcSel.value !== 'voice') {
            const len = 0.5, ns = synth(() => ({ f0: 100, av: 0, ah: 1, af: 0, F: [], B: [] }), len, { seed: 11 }), no = synth(() => ({ f0: 100, av: 0, ah: 1, af: 0, F: Fs, B: BW5 }), len, { seed: 11 });
            const welch = (x) => { const N = 512, acc = new Float64Array(N / 2 + 1); let cnt = 0; for (let s0 = 0; s0 + N <= x.length; s0 += N / 2) { const re = new Float64Array(N), im = new Float64Array(N); for (let j = 0; j < N; j++) re[j] = x[s0 + j] * (0.5 - 0.5 * Math.cos((2 * Math.PI * j) / N)); M.fft(re, im); for (let b = 0; b <= N / 2; b++) acc[b] += re[b] * re[b] + im[b] * im[b]; cnt++; } return Array.from(acc, (a) => 10 * Math.log10(a / cnt + 1e-14)); };
            nS = welch(ns); nO = welch(no);
            wS = ns.slice(4000, 4000 + Math.round(0.03 * SR)); wO = no.slice(4000, 4000 + Math.round(0.03 * SR));
          }
          // reference level: source harmonic 1 = 0 dB; noise spectrum placed 12 dB below
          const ref = hS[1], nref = nS ? M.mean(nS.slice(20, 120)) + 12 : 0;
          cache = { key, P, f0, src, out, hS: hS.map((x) => x - ref), hO: hO.map((x) => x - ref), nS: nS && nS.map((x) => x - nref), nO: nO && nO.map((x) => x - nref), wS, wO, Fs };
          return cache;
        };
        const mkSound = (filtered) => {
          const c = analyse(), f0 = c.f0, mode = srcSel.value, Fs = filtered ? c.Fs : [];
          const buf = synth((t) => ({ f0: f0 * (1.03 - 0.06 * t), av: mode === 'whisper' ? 0 : mode === 'breathy' ? 0.55 : 1, ah: mode === 'voice' ? 0 : mode === 'breathy' ? 0.6 : 1.2, af: 0, F: Fs, B: BW5, oq: mode === 'breathy' ? 0.8 : 0.6 }), 1.1);
          return normalise(buf, 0.85, 0.05);
        };
        v.soundButton('Listen', (snd) => snd.samples(mkSound(true), SR, { gain: 0.6 }));
        v.soundButton('Source alone', (snd) => snd.samples(mkSound(false), SR, { gain: 0.45 }));
        v.legend([['orange', 'source harmonics', { dot: true }], ['ink', 'tract filter $T(f)$'], ['accent', 'output harmonics', { dot: true }], ['muted', 'noise spectrum (whisper)']]);
        let info = null;
        v.render(() => {
          const c = analyse(), mode = srcSel.value, voiced = mode !== 'whisper', noisy = mode !== 'voice', f0 = c.f0, Fs = c.Fs;
          // waveforms: two lanes, source on top, output below (3–4 periods)
          const per = (buf, i) => buf[i % buf.length];
          const norm = (arr) => { let m = 0; for (const x of arr) m = Math.max(m, Math.abs(x)); return m || 1; };
          const n = Math.round(0.03 * SR), mS = norm(c.src), mO = norm(c.out);
          const laneS = [], laneO = [];
          for (let i = 0; i < n; i++) {
            const sv = (voiced ? per(c.src, i) / mS : 0) * (mode === 'breathy' ? 0.6 : 1) + (noisy && c.wS ? (0.5 * c.wS[i]) / norm(c.wS) : 0);
            const ov = (voiced ? per(c.out, i) / mO : 0) * (mode === 'breathy' ? 0.6 : 1) + (noisy && c.wO ? (0.5 * c.wO[i]) / norm(c.wO) : 0);
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
          const noiseCurve = (s, arr) => s.path(arr.map((d, b) => [(b * SR) / 512, d]).filter((p) => p[0] <= FMAX), { color: 'muted', width: 1.3 });
          if (voiced) stems(sS, c.hS, 'orange', -45);
          if (noisy) noiseCurve(sS, c.nS);
          sS.corner(voiced ? `harmonics every ${v.fix(f0, 1)} Hz` : 'flat noise: no harmonics', 'tr', { color: 'orange', weight: 600 });
          sT.fn((f) => dB(tractGain(Fs, BW5, f)), { domain: [0, FMAX], n: 500, color: 'ink', width: 2 });
          hs.forEach((h, k) => sT.vline(F[k], { color: h.color, dash: [3, 4], alpha: 0.7 }));
          const env = (f) => dB(tractGain(Fs, BW5, f));
          if (voiced) {
            stems(sO, c.hO, 'accent', -42);
            // the envelope that the harmonics trace: source trend + filter
            const tilt = (f) => { const k = f / f0; const lo = Math.floor(k), hi = lo + 1; if (lo < 1) return c.hS[1]; return hi < c.hS.length ? c.hS[lo] + (c.hS[hi] - c.hS[lo]) * (k - lo) : c.hS[lo]; };
            sO.fn((f) => env(f) + tilt(f), { domain: [f0, FMAX], n: 400, color: 'faint', width: 1.2, dash: [4, 4] });
          }
          if (noisy) noiseCurve(sO, c.nO);
          for (let k = 0; k < 3; k++) sO.vline(F[k], { color: hs[k].color, dash: [3, 4], alpha: 0.45 });
          // verification at the strongest output harmonic
          let kb = 1; for (let k = 1; k * f0 < FMAX && k < c.hO.length; k++) if (c.hO[k] > c.hO[kb]) kb = k;
          info = { kb, f: kb * f0, s: c.hS[kb], t: env(kb * f0), o: c.hO[kb], f0, voiced, Fs };
          if (voiced) sO.dot(kb * f0, c.hO[kb], { r: 5, color: 'gold' });
        });
        v.readout(() => info && (info.voiced
          ? `$f_0$ = ${v.fix(info.f0, 1)} Hz · formants ${info.Fs.slice(0, 3).map((f) => Math.round(f)).join(', ')} Hz · strongest harmonic: no. ${info.kb} at ${Math.round(info.f)} Hz (gold): source ${v.fix(info.s, 1)} dB + filter ${v.fix(info.t, 1)} dB = **${v.fix(info.s + info.t, 2)} dB**; measured by FFT of the synthesized waveform: **${v.fix(info.o, 2)} dB**`
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
        const vpos = (h, b, r) => { const xf = 6.0 - (2.6 * h) / 3, x = xf + b * (10.6 - xf); return [x + (r ? 0.3 : -0.3), 0.75 + 2.35 * h]; };
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
            [['Close', 3], ['Close-mid', 2], ['Open-mid', 1], ['Open', 0]].forEach(([t, h]) => ch.text(t, C(h, 0)[0] - 0.55, C(h, 0)[1], { size: hs, color: 'muted', align: 'right' }));
            [['Front', 0], ['Central', 0.5], ['Back', 1]].forEach(([t, b]) => ch.text(t, C(3, b)[0], 9.15, { size: hs, color: 'muted', align: 'center' }));
            const seen = new Set();
            for (const [sym, h, b, r] of IPA_V) {
              const key = h + ',' + b; if (!seen.has(key)) { seen.add(key); const [cx, cy] = C(h, b); ch.dot(cx, cy, { r: 2.6, color: 'muted' }); }
              const [x, y] = vpos(h, b, r), on = sym === selV;
              if (on) ch.dot(x, y, { r: fs * 0.82, color: 'accent', hollow: true, width: 2 });
              ch.text(sym, x, y + 0.03, { size: fs, align: 'center', color: on ? 'accent' : 'ink', weight: on ? 650 : 450 });
            }
            ch.text('Where symbols appear in pairs, the one to the right is rounded.', 6.5, 0.12, { size: hs, color: 'muted', align: 'center' });
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
  ],
};
