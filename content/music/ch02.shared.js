// Music Theory & Acoustics — Chapter 2 shared helpers (vibrating strings).
// Plain named exports, imported by ch02.js and ch02-b.js.

export const TAU = 2 * Math.PI;
export const SR = 44100;

/** Note name and cents offset of a frequency, e.g. "A4 −3 ¢" (M = v.M). */
export function noteOf(M, f, flats) {
  if (!(f > 0)) return '—';
  const m = M.freqToMidi(f), r = Math.round(m), d = Math.round((m - r) * 100);
  return M.noteName(r, flats ? { flats: true } : undefined) + (d ? ` ${d > 0 ? '+' : '−'}${Math.abs(d)} ¢` : '');
}

/**
 * A playhead that follows a sound for `dur` seconds and redraws the viz about 25 times a second
 * (sound only starts from a click, so the timer only runs after one). ph.t is the elapsed time, or null.
 */
export function playhead(v) {
  let t0 = 0, dur = 0, id = 0;
  const stop = () => { if (id) clearInterval(id); id = 0; dur = 0; v.invalidate(); };
  if (v.onCleanup) v.onCleanup(() => { if (id) clearInterval(id); id = 0; });
  return {
    start(d) {
      if (id) clearInterval(id);
      t0 = performance.now(); dur = d;
      id = setInterval(() => { if (performance.now() - t0 > dur * 1000 + 80) stop(); else v.invalidate(); }, 40);
      v.invalidate();
    },
    stop,
    get t() { return dur ? (performance.now() - t0) / 1000 : null; },
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

/** Typical decay rate (1/s) of a string partial at frequency f: higher partials die faster. */
export const decayOf = (f) => 0.8 + 0.0035 * f;

/**
 * Sum of exponentially decaying partials, each started at its peak (cosine phase, as for a string released from rest).
 * parts: [{f, a, d}] (Hz, amplitude, decay rate in 1/s). opts.touchAt (s) and opts.extra (array of extra decay rates,
 * one per part) switch every part to the decay rate d + extra[i] from that moment on (a finger landing on the string).
 */
export function synth(parts, dur, opts = {}) {
  const sr = opts.sr || SR, n = Math.round(dur * sr), out = new Float32Array(n);
  const k1 = opts.touchAt != null ? Math.round(opts.touchAt * sr) : n;
  parts.forEach((p, i) => {
    if (!p.a || !(p.f > 0) || p.f > sr * 0.45) return;
    const w = (TAU * p.f) / sr, c = Math.cos(w), s = Math.sin(w);
    const r1 = Math.exp(-(p.d || 0) / sr), r2 = Math.exp(-((p.d || 0) + (opts.extra ? opts.extra[i] || 0 : 0)) / sr);
    let x = p.a * Math.cos(p.ph || 0), y = p.a * Math.sin(p.ph || 0);
    for (let k = 0; k < n; k++) {
      out[k] += x;
      const r = k < k1 ? r1 : r2, nx = (x * c - y * s) * r;
      y = (x * s + y * c) * r; x = nx;
    }
  });
  return out;
}

/**
 * Exact sine coefficients b_n = 2∫₀¹ y(x) sin(nπx) dx, n = 1..N, of the polyline through (xs[i], ys[i]) on [0, 1]
 * (ys must vanish at both ends). Integrating by parts twice leaves only the slope jumps at the corners:
 * b_n = (2/(nπ)²) Σ_j (s_{j−1} − s_j) sin(nπ x_j).
 */
export function polyCoeffs(xs, ys, N) {
  const out = new Float64Array(N), J = xs.length;
  const slope = (j) => (ys[j + 1] - ys[j]) / (xs[j + 1] - xs[j]);
  const jumps = [];
  for (let j = 1; j < J - 1; j++) { const d = slope(j - 1) - slope(j); if (Math.abs(d) > 1e-12) jumps.push([xs[j], d]); }
  for (let n = 1; n <= N; n++) {
    const k = n * Math.PI; let s = 0;
    for (const [x, d] of jumps) s += d * Math.sin(k * x);
    out[n - 1] = (2 * s) / (k * k);
  }
  return out;
}

/** Sine coefficients of a triangular pluck of height h at x = p (string of length 1): b_n = 2h sin(nπp) / (n²π² p(1−p)). */
export function triCoeffs(p, h, N) {
  const out = new Float64Array(N);
  for (let n = 1; n <= N; n++) out[n - 1] = (2 * h * Math.sin(n * Math.PI * p)) / (n * n * Math.PI * Math.PI * p * (1 - p));
  return out;
}

/** Linear interpolation of samples ys on the uniform grid of [0, 1]. */
export function lerpGrid(ys, x) {
  const K = ys.length - 1; if (x <= 0) return ys[0]; if (x >= 1) return ys[K];
  const u = x * K, i = Math.floor(u), f = u - i; return ys[i] + (ys[Math.min(K, i + 1)] - ys[i]) * f;
}

/** The odd, 2-periodic extension of a function y on [0, 1] with y(0) = y(1) = 0 (what d'Alembert's formula needs). */
export function oddExt(y) {
  return (x) => { const u = ((x % 2) + 2) % 2; return u <= 1 ? y(u) : -y(2 - u); };
}

/** y(x, τ) = Σ b_n sin(nπx) cos(nπτ) over the first N modes (τ = ct/L, so one period is τ = 2). */
export function modal(b, N, x, tau) {
  let s = 0; for (let n = 1; n <= N; n++) s += b[n - 1] * Math.sin(n * Math.PI * x) * Math.cos(n * Math.PI * tau);
  return s;
}

/** Partials of the force on the bridge for mode amplitudes b (∝ the end slope, so the n-th has amplitude n·b_n). */
export function bridgeParts(b, f1, N = b.length, ratio = (n) => n) {
  const parts = [];
  for (let n = 1; n <= N; n++) { const f = f1 * ratio(n); parts.push({ f, a: n * b[n - 1], d: decayOf(f) }); }
  return parts;
}

/** Spectral centroid Σ f·a / Σ a of partial amplitudes (absolute values). */
export function centroid(parts) {
  let s = 0, w = 0; for (const p of parts) { s += p.f * Math.abs(p.a); w += Math.abs(p.a); }
  return w ? s / w : 0;
}

/** Initial-shape presets sampled on K + 1 points of [0, 1] (all vanish at the ends). */
export function presetShape(name, K = 240) {
  const ys = new Float64Array(K + 1);
  for (let i = 0; i <= K; i++) {
    const x = i / K; let y = 0;
    if (name === 'pluck') y = x < 0.3 ? (0.85 * x) / 0.3 : (0.85 * (1 - x)) / 0.7;
    else if (name === 'bump') y = 0.85 * Math.exp(-(((x - 0.32) / 0.075) ** 2)) * Math.sin(Math.PI * x) / Math.sin(Math.PI * 0.32);
    else if (name === 'flat') y = 0.7 * Math.min(1, Math.max(0, Math.min((x - 0.15) / 0.12, (0.85 - x) / 0.12)));
    else if (name === 'two') y = 0.75 * (Math.exp(-(((x - 0.25) / 0.06) ** 2)) - Math.exp(-(((x - 0.7) / 0.06) ** 2)));
    else if (name === 'mode2') y = 0.75 * Math.sin(2 * Math.PI * x);
    ys[i] = y;
  }
  ys[0] = 0; ys[K] = 0;
  return ys;
}

/**
 * Freehand editing of a sampled shape: dragging on stage s paints ys (clamped to ±lim, ends pinned at 0).
 * onEdit(phase) is called on start / move / end.
 */
export function shapePainter(s, getYs, onEdit, lim = 1) {
  let last = null;
  s.onDrag((x, y, phase) => {
    const ys = getYs(), K = ys.length - 1;
    const yy = Math.max(-lim, Math.min(lim, y)), i = Math.round(Math.max(0, Math.min(1, x)) * K);
    if (phase === 'start' || !last) last = [i, yy];
    const [i0, y0] = last, a = Math.min(i0, i), b = Math.max(i0, i);
    for (let j = a; j <= b; j++) { const f = b === a ? 1 : (j - i0) / (i - i0); ys[j] = y0 + (yy - y0) * Math.max(0, Math.min(1, f)); }
    ys[0] = 0; ys[K] = 0; last = [i, yy];
    // a light smoothing pass so that a shaky hand does not create a spray of high modes
    if (phase === 'end') { const c = Float64Array.from(ys); for (let j = 1; j < K; j++) ys[j] = (c[j - 1] + 2 * c[j] + c[j + 1]) / 4; last = null; }
    onEdit(phase);
  });
}

/** Nut and bridge drawn as small wedges under the string ends at x = 0 and x = len. */
export function posts(s, len = 1, y = 0, size = 0.16, col = 'muted') {
  for (const x of [0, len]) s.poly([[x, y], [x - size * 0.22, y - size], [x + size * 0.22, y - size]], { fill: col, fillAlpha: 0.8, color: col, width: 1 });
}

const BLACK = new Set([1, 3, 6, 8, 10]);
/** Piano keyboard between fLo and fHi (cells halfway in log frequency between semitones); marks: Map midi → colour. */
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
export const isBlack = (M, m) => BLACK.has(M.mod(m, 12));

/** Stiff-string partial n: n·f0·√(1 + B n²). */
export const stiff = (f0, B, n) => n * f0 * Math.sqrt(1 + B * n * n);

/**
 * Bowed string by digital waveguide (velocity waves, one cell per sample, McIntyre–Schumacher–Woodhouse friction).
 * The string runs from the nut (cell 0) to the bridge (cell N); the bow sits a fraction beta of the length from the bridge.
 * o: {f1 (Hz), beta, FN (N), vb (m/s), Z (kg/s), dur (s), rec (periods recorded at the end, 0 = none),
 *     mus, mud, v0 (friction curve), g, lp (bridge reflection loss and low-pass), sr}.
 * Returns {N, f, sr, out (bridge force), vbow (string velocity at the bow), stick (0/1 per sample), snaps (displacement
 * snapshots over the last rec periods, metres), ib}.
 */
export function bowSim(o) {
  const sr = o.sr || SR, N = Math.max(8, Math.round(sr / (2 * o.f1))), steps = Math.round(o.dur * sr);
  const mus = o.mus ?? 0.8, mud = o.mud ?? 0.3, v0 = o.v0 ?? 0.2, g = o.g ?? 0.99, lp = o.lp ?? 0.6, Z = o.Z, vb = o.vb, FN = o.FN;
  const ib = Math.max(1, Math.min(N - 1, Math.round(N * (1 - o.beta))));
  const r = new Float64Array(N + 1), l = new Float64Array(N + 1), y = new Float64Array(N + 1);
  const out = new Float32Array(steps), vbow = new Float32Array(steps), stick = new Uint8Array(steps);
  const rec = o.rec ? Math.round(o.rec * 2 * N) : 0, snaps = [];
  const kap = FN / (2 * Z), dmu = mus - mud, ustar = Math.max(0, Math.sqrt(kap * dmu * v0) - v0);
  const mu = (u) => mud + (dmu * v0) / (v0 + u);
  // largest root of u + kap·mu(u) = a on (u*, a], or −1 when the slipping branch does not reach a
  const slipRoot = (a) => {
    if (ustar + kap * mu(ustar) > a) return -1;
    let lo = ustar, hi = a;
    for (let it = 0; it < 32; it++) { const m = 0.5 * (lo + hi); if (m + kap * mu(m) > a) hi = m; else lo = m; }
    return 0.5 * (lo + hi);
  };
  let stuck = true, lps = 0;
  const dt = 1 / sr;
  for (let k = 0; k < steps; k++) {
    r.copyWithin(1, 0, N); l.copyWithin(0, 1, N + 1);
    r[0] = -l[0];
    lps = (1 - lp) * r[N] + lp * lps; l[N] = -g * lps;
    const vh = r[ib] + l[ib], uh = vb - vh, a = Math.abs(uh), sg = uh >= 0 ? 1 : -1;
    let vv;
    if (stuck && 2 * Z * a <= mus * FN) vv = vb; // static friction holds
    else { const u = slipRoot(a); vv = u < 0 ? vb : vb - sg * u; } // slip on the friction curve, or re-stick
    stuck = vv === vb;
    const dv = vv - vh;
    r[ib] += dv; l[ib] += dv;
    for (let i = 1; i < N; i++) y[i] += (i === ib ? vv : r[i] + l[i]) * dt;
    out[k] = r[N] - l[N]; vbow[k] = vv; stick[k] = stuck ? 1 : 0;
    if (rec && k >= steps - rec) snaps.push(Float32Array.from(y));
  }
  return { N, f: sr / (2 * N), sr, out, vbow, stick, snaps, ib };
}

/**
 * Felt hammer striking a stiff string, by modal synthesis. String: f1 (Hz), B (inharmonicity), L (m), mu (kg/m), NM modes,
 * decays d(f). Hammer: mass mh (kg), felt law F = K·u^p (u = felt compression, m), speed V (m/s), striking at x = beta·L.
 * Returns {F (contact force every dtRec), dtRec, tc (contact time), Fmax, q, qd (mode state at the end), w (rad/s),
 * snaps (mode displacements every dtSnap), dtSnap, uh (hammer position at the snapshots), vOut (rebound speed)}.
 */
export function hammerSim(o) {
  const NM = o.NM || 48, L = o.L, mu = o.mu, beta = o.beta, mh = o.mh, K = o.K, p = o.p, tEnd = o.tEnd || 0.008, dt = o.dt || 1e-6;
  const w = new Float64Array(NM), sn = new Float64Array(NM), q = new Float64Array(NM), qd = new Float64Array(NM), damp = new Float64Array(NM);
  const mModal = (mu * L) / 2;
  for (let n = 1; n <= NM; n++) { w[n - 1] = TAU * stiff(o.f1, o.B || 0, n); sn[n - 1] = Math.sin(n * Math.PI * beta); damp[n - 1] = o.decay ? o.decay(w[n - 1] / TAU) : 0; }
  let u = 0, ud = o.V, tc = 0, Fmax = 0;
  const dtRec = 1e-5, dtSnap = o.dtSnap || 2.5e-5, F = [], snaps = [], uh = [];
  const steps = Math.round(tEnd / dt), recEvery = Math.round(dtRec / dt), snapEvery = Math.round(dtSnap / dt);
  for (let k = 0; k <= steps; k++) {
    let yh = 0; for (let n = 0; n < NM; n++) yh += q[n] * sn[n];
    const comp = u - yh, f = comp > 0 ? K * Math.pow(comp, p) : 0;
    if (f > 0) tc += dt; if (f > Fmax) Fmax = f;
    if (k % recEvery === 0) F.push(f);
    if (k % snapEvery === 0) { snaps.push(Float64Array.from(q)); uh.push(u); }
    ud -= (f / mh) * dt; u += ud * dt;
    for (let n = 0; n < NM; n++) { qd[n] += (-w[n] * w[n] * q[n] - 2 * damp[n] * qd[n] + (f * sn[n]) / mModal) * dt; q[n] += qd[n] * dt; }
  }
  return { F, dtRec, tc, Fmax, q, qd, w, snaps, dtSnap, uh, vOut: -ud, NM };
}
