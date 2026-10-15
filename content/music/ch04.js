// Music Theory & Acoustics — Chapter 4: Timbre and spectrum (part a: items 4.1–4.8)
import { TAU, SR, noteOf, dB, playhead, finish, toRms, join, noiseGen, periodicLoop, partials, loopVoice, stft, drawSpec, specRamp, centroidOf, INST, sharc } from './ch04.shared.js';

/** Six instruments of the SHARC data used for the comparisons, in score order. */
const ORDER = ['flute', 'oboe', 'clarinet', 'horn', 'trumpet', 'violin'];
const shortName = (k) => (k === 'trumpet' ? 'trumpet' : k === 'horn' ? 'horn' : INST[k]);

/** Min/max envelope of a buffer as two polylines over [t0, t1] seconds in `cols` columns (for drawing long waveforms fast). */
function envelopeOf(buf, sr, t0, t1, cols = 400) {
  const hi = [], lo = [];
  for (let c = 0; c < cols; c++) {
    const a = Math.max(0, Math.floor((t0 + ((t1 - t0) * c) / cols) * sr)), b = Math.min(buf.length, Math.floor((t0 + ((t1 - t0) * (c + 1)) / cols) * sr));
    let mx = 0, mn = 0; for (let i = a; i < b; i++) { if (buf[i] > mx) mx = buf[i]; if (buf[i] < mn) mn = buf[i]; }
    const t = t0 + ((t1 - t0) * (c + 0.5)) / cols; hi.push([t, mx]); lo.push([t, mn]);
  }
  return { hi, lo };
}

/** Fourier coefficients of one period sampled at K points: c0 and, for n = 1…N, amplitude A_n = 2|c_n| and cosine phase φ_n. */
function coeffsOf(M, ys, N) {
  const K = ys.length, { re, im } = M.fftReal(Array.from(ys)), A = new Float64Array(N + 1), P = new Float64Array(N + 1);
  for (let n = 1; n <= N; n++) { A[n] = (2 * Math.hypot(re[n], im[n])) / K; P[n] = Math.atan2(im[n], re[n]); }
  return { c0: re[0] / K, A, P };
}

export default {
  collection: 'music',
  chapter: 4,
  title: 'Timbre and spectrum',
  summary: String.raw`Two tones of equal pitch and loudness can still sound utterly different, and the difference lives largely in the spectrum and in how it changes over the first moments of a note. Fourier series split a periodic tone into harmonics, the smoothness of the waveform sets how fast they fade, and Parseval's identity accounts for its energy harmonic by harmonic. The Fourier transform handles sounds that are not periodic, and the uncertainty principle limits how sharply any sound can be placed in both time and frequency. Attacks, formants and vowels show what the ear listens for beyond the steady spectrum; the missing fundamental and virtual pitch show that pitch is computed by the listener; additive and FM synthesis run the analysis in reverse, and timbre space, vibrato and tremolo close the chapter.`,
  items: [
    // ------------------------------------------------------------------ 4.1
    {
      num: '4.1',
      kind: 'Concept',
      name: 'Timbre and the spectra of instruments',
      statement: String.raw`**Timbre** (tone colour) is the attribute that lets a listener tell two sounds apart when they have the same pitch, loudness and duration: a flute from a clarinet, *ee* from *ah*. It is defined by exclusion and has several dimensions, but its main physical correlates are known:
(a) the **steady-state spectrum**: for a sustained tone of fundamental $f_0$, the relative amplitudes $A_1,A_2,\dots$ of the harmonics at $nf_0$ (2.6). Two summaries matter most: the **spectral centroid** $\sum_n nf_0A_n\big/\sum_nA_n$, heard as brightness, and the balance between odd and even harmonics;
(b) how the spectrum **evolves**: the attack, the decay and slow fluctuations (4.8, 4.15);
(c) **noise and modulation**: breath, bow noise, vibrato (4.16).

The spectrum of an instrument is not a fixed property. It changes with the note played and with loudness, so there is no single "clarinet spectrum".`,
      idea: String.raw`The cochlea splits a sound into frequency bands (5.2) and is nearly deaf to the relative phases of steady harmonics (5.3), so for a steady tone what reaches perception is essentially the list of harmonic levels. Each instrument's physics writes its own list. A cylindrical bore closed at the reed favours odd harmonics in the clarinet's low register (3.3). The flute's gentle air jet leaves few strong harmonics. The brass bell, and nonlinear steepening of the wave in the bore, make loud brass bright (3.5). The violin body's many resonances stamp a jagged envelope on the sawtooth of the bowed string (2.10). One check on the bookkeeping: keeping only the even harmonics of any tone halves its period. The even harmonics of $f_0$ are exactly all the harmonics of $2f_0$, so the tone jumps up an octave.`,
      caption: String.raw`All spectra are measured: each note is Sandell's Fourier analysis (SHARC) of a steady stretch of a McGill University Master Samples recording. Choose an instrument (or click a row of fingerprints) and a note. Left: two periods of the waveform, rebuilt from the measured amplitudes and phases and scaled to equal RMS. Right: the harmonic levels, odd harmonics blue and even ones orange, with the spectral centroid in gold. *Listen* plays the steady spectrum with the same plain 50 ms fade-in for every instrument, at equal RMS, so only the spectrum differs (attacks are the subject of 4.8). Compare the clarinet's E4, where odd harmonics dominate, with its A4, where they no longer do. Then try *odd only* or *even only* on any instrument.`,
      deps: ['music-1.1', 'music-2.6'],
      see: ['music-3.3', 'music-2.10', 'music-3.5', 'music-5.3', 'music-4.15', 'music-6.5'],
      refs: ['Sethares ch. 2', 'Loy I ch. 6'],
      tags: ['timbre', 'spectrum'],
      credit: 'Hermann von Helmholtz, 1863; spectra: G. J. Sandell, SHARC (1991–94), from the McGill University Master Samples',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Timbre' },
      viz(v) {
        const M = v.M, NH = 24;
        const inst = v.select('instrument', ORDER.map((k) => ({ value: k, label: shortName(k) })), 'clarinet');
        const note = v.select('note', ['E4', 'A4', 'C5'], 'E4');
        const keep = v.select('play', [{ value: 'all', label: 'all harmonics' }, { value: 'odd', label: 'odd only' }, { value: 'even', label: 'even only' }], 'all');
        const wv = v.stage({ x: [0, 2], y: [-1.18, 1.18], height: 235, axes: false, weight: 1, title: 'two periods, rebuilt from the data (equal RMS)' });
        const sp = v.stage({ x: [0.3, NH + 0.7], y: [-62, 5], height: 235, axes: 'box', xlabel: 'harmonic n', weight: 1.3, xticks: [1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24], yticks: [[0, '0 dB'], [-20, '−20'], [-40, '−40'], [-60, '−60']], title: 'harmonic levels re the loudest' });
        const fp = v.stage({ x: [-3.6, NH + 4.2], y: [-0.2, 6.05], height: 225, axes: false, full: true, title: 'fingerprints at the same note: harmonics 1–24, stronger = darker (click a row)' });
        const ph = playhead(v);
        const kept = (n) => keep.value === 'all' || (keep.value === 'odd') === (n % 2 === 1);
        const spec = (k = inst.value) => sharc(k, note.value);
        const tone = (k, dur = 1.3) => {
          const S = spec(k), parts = S.amp.map((a, i) => ({ f: (i + 1) * S.f, a: kept(i + 1) ? a : 0, ph: S.ph[i] }));
          return toRms(partials(parts, dur, { att: 0.05, rel: 0.15 }), 0.15);
        };
        v.soundButton('Listen', (snd) => { snd.samples(tone(inst.value), SR, { gain: 0.9 }); ph.start(1.3, inst.value); });
        v.soundButton('all six in turn', (snd) => { snd.samples(join(ORDER.map((k) => tone(k, 0.9)), 0.15), SR, { gain: 0.9 }); ph.start(6 * 1.05, 'seq'); });
        fp.onClick((x, y) => { const i = Math.round(5.5 - y); if (i >= 0 && i < 6) inst.set(ORDER[i]); });
        const R = () => specRamp(v);
        v.render(() => {
          const S = spec(), t = ph.t, cur = ph.tag === 'seq' && t != null ? ORDER[Math.min(5, Math.floor(t / 1.05))] : ph.tag;
          const amps = S.amp.map((a, i) => (kept(i + 1) ? a : 0));
          // ---- waveform
          const rms = Math.sqrt(amps.reduce((s, a) => s + a * a, 0) / 2) || 1, wf = (x) => { let y = 0; for (let i = 0; i < S.n; i++) if (amps[i]) y += amps[i] * Math.cos(TAU * (i + 1) * x + S.ph[i]); return (0.34 * y) / rms; };
          wv.hline(0, { color: 'faint', width: 1 });
          wv.hband(-0.34, 0.34, { color: 'green', alpha: 0.06 });
          wv.vline(1, { color: 'faint', width: 1, dash: [3, 4] });
          wv.fn(wf, { domain: [0, 2], n: 700, color: 'accent', width: 2.2 });
          wv.corner(`${shortName(inst.value)}, ${note.value} = ${v.fix(S.f, 1)} Hz`, 'tl', { color: 'ink', weight: 600 });
          wv.corner('green band: ±RMS', 'bl', { color: 'muted', size: 11 });
          if (cur && cur === inst.value) wv.corner('♪ playing', 'tr', { color: 'gold', weight: 600 });
          // ---- spectrum
          for (let n = 1; n <= Math.min(NH, S.n); n++) {
            const d = S.db[n - 1], on = kept(n), col = n % 2 ? 'accent' : 'orange';
            if (d > -62) sp.rect(n - 0.34, -62, n + 0.34, d, on ? { fill: col, fillAlpha: 0.75, stroke: false } : { fill: col, fillAlpha: 0.08, color: col, width: 1, alpha: 0.5, dash: [2, 2] });
          }
          const cH = centroidOf(amps);
          sp.vline(cH, { color: 'gold', width: 2.2, dash: [6, 4] });
          sp.text(`centroid ${v.fix(cH, 1)}`, cH + 0.4, 1.5, { color: 'gold', size: 11.5, weight: 600, align: 'left' });
          // ---- fingerprints
          const r = R();
          ORDER.forEach((k, i) => {
            const y = 5.5 - i, F = sharc(k, note.value), on = k === inst.value, playing = cur === k;
            fp.text(shortName(k), -0.15, y, { align: 'right', color: on ? 'ink' : 'muted', size: 12.5, weight: on ? 700 : 500 });
            for (let n = 1; n <= NH; n++) {
              const d = n <= F.n ? F.db[n - 1] : -99, u = Math.max(0, Math.min(1, (d + 60) / 60));
              fp.rect(n - 0.47, y - 0.4, n + 0.47, y + 0.4, { fill: r.col(u), fillAlpha: 1, stroke: false });
            }
            const c = centroidOf(F.amp);
            fp.text(`${v.fix(c, 1)} · ${v.fix((c * F.f) / 1000, 2)} kHz`, NH + 0.75, y, { align: 'left', color: on ? 'gold' : 'muted', size: 11.5, weight: on ? 700 : 500 });
            fp.dot(c + 0.5, y, { r: 3.2, color: 'gold', alpha: on ? 1 : 0.55 });
            if (on || playing) fp.rect(0.45, y - 0.46, NH + 0.55, y + 0.46, { color: playing ? 'gold' : 'ink', width: playing ? 2.6 : 1.6, radius: 3 });
          });
          for (const n of [1, 4, 8, 12, 16, 20, 24]) fp.text(String(n), n, -0.08, { align: 'center', color: 'muted', size: 10.5 });
          fp.text('centroid (harmonics · Hz)', NH + 0.75, 5.95, { align: 'left', color: 'muted', size: 10.5 });
        });
        v.legend([['accent', 'odd harmonics'], ['orange', 'even harmonics'], ['gold', 'spectral centroid', { dash: true }]]);
        v.readout(() => {
          const S = spec(), amps = S.amp.map((a, i) => (kept(i + 1) ? a : 0));
          let e = 0, eo = 0, loud = 0, best = 0; amps.forEach((a, i) => { e += a * a; if (i % 2 === 0) eo += a * a; if (a > best) { best = a; loud = i + 1; } });
          const within = amps.filter((a) => a > 0 && dB(a / best) > -20).length, c = centroidOf(amps);
          const wf = (x) => { let y = 0; for (let i = 0; i < S.n; i++) if (amps[i]) y += amps[i] * Math.cos(TAU * (i + 1) * x + S.ph[i]); return y; };
          let pk = 0; for (let i = 0; i < 600; i++) pk = Math.max(pk, Math.abs(wf(i / 600)));
          const crest = pk / Math.sqrt(e / 2);
          const tail = keep.value === 'even' ? ` · only even harmonics: the waveform now repeats twice per period, a tone at ${v.fix(2 * S.f, 1)} Hz (${noteOf(M, 2 * S.f)})` : keep.value === 'odd' ? ' · odd harmonics only: the half-wave symmetry $p(t+T/2)=-p(t)$ holds, the hollow sound of the low clarinet' : '';
          return `${shortName(inst.value)} ${note.value} (${v.fix(S.f, 1)} Hz): loudest harmonic ${loud} · odd harmonics carry ${v.fix((100 * eo) / e, 1)}% of the energy · spectral centroid ${v.fix(c, 2)} harmonics = ${v.fix(c * S.f, 0)} Hz · ${within} harmonic${within === 1 ? '' : 's'} within 20 dB of the loudest · crest factor ${v.fix(crest, 2)}${tail}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.2
    {
      num: '4.2',
      kind: 'Theorem',
      name: 'Fourier series of a periodic tone',
      statement: String.raw`Let $p(t)$ be the pressure of a steady tone with period $T=1/f_0$, integrable over a period. Its **Fourier coefficients** are
$$c_n=\frac1T\int_0^Tp(t)\,e^{-2\pi inf_0t}\,dt,\qquad A_n=2|c_n|,\quad \varphi_n=\arg c_n\quad(n\ge1),$$
and its partial sums are
$$S_Np(t)=c_0+\sum_{n=1}^{N}A_n\cos(2\pi nf_0t+\varphi_n).$$
(a) If $p$ has finite energy over a period, then $S_Np\to p$ in mean square: $\frac1T\int_0^T|p-S_Np|^2\,dt\to0$.
(b) If $p$ is piecewise smooth, then $S_Np(t)\to\tfrac12\big(p(t^-)+p(t^+)\big)$ at every $t$. The convergence is uniform on closed intervals where $p$ is continuous, and uniform everywhere if $p$ is continuous.

So a periodic tone is a sum of **harmonics** at the whole multiples $nf_0$ of its repetition rate, with amplitudes and phases fixed by the waveform. No other frequencies can occur.`,
      idea: String.raw`The functions $e^{2\pi inf_0t}$ are orthonormal over a period (pma-8.10), so the coefficient formula is the only possible choice: it projects $p$ onto each harmonic. The partial sum is the convolution of $p$ with the Dirichlet kernel (pma-8.13), whose spike at $t=0$ sharpens as $N$ grows. Dirichlet's theorem (pma-8.14) turns this into pointwise convergence for piecewise smooth $p$; mean-square convergence follows from the density of trigonometric polynomials (pma-8.9, Weierstrass) and the best-approximation property (pma-8.11). Periodicity is what forces the frequencies onto the grid $nf_0$: a component at any other frequency would not repeat after time $T$. That is why sustained tones of strings and winds have harmonic spectra (2.6, 3.2), while bells and drums, whose sound is not periodic, do not.`,
      caption: String.raw`Choose a waveform, or **draw** one: drag across the right half of the top panel (the first period; the second repeats it). On the left, $N$ phasors of lengths $A_n$ turn at $n$ times the fundamental rate, chained tip to tail. Their height is the partial sum (blue), traced through time against the target (dashed); red shading marks the error. Below are the amplitudes and phases the waveform implies. Raise $N$ and *Listen* (or hold the tone) to hear the sum close in on the waveform. *Build up* plays $N$ = 1, 2, 3, 5, 8, 13, 40 in turn.`,
      deps: ['music-2.6', 'pma-8.9', 'pma-8.10', 'pma-8.14'],
      see: ['sig-4.1', 'sig-4.2', 'sig-4.4', 'music-2.7', 'mech-4.12', 'pde-4.4'],
      refs: ['Benson ch. 2', 'Loy II ch. 3'],
      tags: ['fourier', 'harmonics'],
      credit: 'Joseph Fourier, 1807–1822; Dirichlet, 1829; Ohm and Helmholtz brought it to hearing, 1843–1863',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Fourier_series' },
      viz(v) {
        const M = v.M, K = 1024, NB = 40, F0 = 220, X0 = 0.4, XS = 1.8, CX = -1.55;
        const preset = (name) => {
          const ys = new Float64Array(K);
          if (name === 'clar') {
            const S = sharc('clarinet', 'E4'); let mx = 0;
            for (let i = 0; i < K; i++) { let y = 0; for (let n = 0; n < S.n; n++) y += S.amp[n] * Math.cos((TAU * (n + 1) * i) / K + S.ph[n]); ys[i] = y; mx = Math.max(mx, Math.abs(y)); }
            for (let i = 0; i < K; i++) ys[i] *= 0.95 / mx;
          } else for (let i = 0; i < K; i++) { const u = i / K; ys[i] = name === 'saw' ? 0.95 * (1 - 2 * u) : name === 'square' ? (u < 0.5 ? 0.8 : -0.8) : 0.9 * (u < 0.2 ? 1 : -0.25); }
          return ys;
        };
        let ys = preset('saw'), ver = 0, ck = -1, C = null;
        const coeffs = () => { if (ck === ver) return C; ck = ver; C = coeffsOf(M, ys, NB); let e = 0; for (let i = 0; i < K; i++) e += ys[i] * ys[i]; C.E = e / K; return C; };
        const lv = loopVoice(v);
        const loopBuf = () => { const c = coeffs(), N = nS.value; return periodicLoop(M.range(N, 1).map((n) => [n, 0.3 * c.A[n], c.P[n]]), F0).buf; };
        const sync = () => lv.update(loopBuf, 0.7);
        const sel = v.select('waveform', [{ value: 'saw', label: 'sawtooth' }, { value: 'square', label: 'square' }, { value: 'pulse', label: 'pulse 20%' }, { value: 'clar', label: 'clarinet E4 (measured)' }, { value: 'draw', label: 'drawn' }], 'saw', { onChange: (x) => { if (x !== 'draw') { ys = preset(x); ver++; sync(); } } });
        const nS = v.slider('harmonics kept $N$', 1, NB, 5, { int: true, onChange: sync });
        const hold = v.toggle('hold the tone', false, { onChange: (on) => { if (on) lv.start(loopBuf(), 0.7); else lv.stop(); } });
        const s = v.stage({ x: [-3.1, 4.05], y: [-1.42, 1.42], equal: true, height: 290, axes: false, full: true });
        const am = v.stage({ x: [0.2, NB + 0.8], y: [0, 1.14], height: 185, axes: 'box', xlabel: 'harmonic n', xticks: [1, 5, 10, 15, 20, 25, 30, 35, 40], yticks: [[0.5, '½'], [1, 'max']], title: 'amplitudes $A_n$' });
        const pp = v.stage({ x: [0.2, NB + 0.8], y: [-3.6, 3.6], height: 185, axes: 'box', xlabel: 'harmonic n', xticks: [1, 5, 10, 15, 20, 25, 30, 35, 40], yticks: [[-Math.PI, '−π'], [0, '0'], [Math.PI, 'π']], title: 'phases $\\varphi_n$ (where $A_n$ is not tiny)' });
        let last = null;
        s.onDrag((x, y, phase) => {
          if (x < X0 - 0.05 && phase === 'start') return;
          const u = M.mod((M.clamp(x, X0, X0 + 2 * XS) - X0) / XS, 1), i = Math.round(u * K) % K, yy = M.clamp(y, -1.2, 1.2);
          if (phase === 'start' || !last) { last = [i, yy]; v.pause(); }
          let [i0, y0] = last, d = i - i0; if (d > K / 2) d -= K; if (d < -K / 2) d += K;
          const st = Math.max(1, Math.abs(d));
          for (let j = 0; j <= st; j++) ys[M.mod(i0 + Math.sign(d) * j, K)] = y0 + ((yy - y0) * j) / st;
          last = [i, yy]; if (sel.value !== 'draw') sel.set('draw'); ver++;
          if (phase === 'end') { last = null; v.play(); sync(); }
        });
        const tone = (N, dur) => { const c = coeffs(); return toRms(partials(M.range(N, 1).map((n) => ({ f: n * F0, a: c.A[n], ph: c.P[n] })), dur, { att: 0.02, rel: 0.06 }), 0.14); };
        v.soundButton('Listen', (snd) => snd.samples(tone(nS.value, 1.3), SR, { gain: 0.9 }));
        v.soundButton('Build up', (snd) => snd.samples(join([1, 2, 3, 5, 8, 13, 40].map((N) => tone(N, 0.6)), 0.12), SR, { gain: 0.9 }));
        const S = (c, N, u) => { let y = c.c0; for (let n = 1; n <= N; n++) y += c.A[n] * Math.cos(TAU * n * u + c.P[n]); return y; };
        const target = (u) => { const w = M.mod(u, 1) * K, i = Math.floor(w), f = w - i; return ys[i % K] * (1 - f) + ys[(i + 1) % K] * f; };
        let tau = 0;
        v.animate((t) => {
          const c = coeffs(), N = nS.value;
          tau = M.mod(0.2 * t, 2);
          const xT = (u) => X0 + XS * u;
          // ---- trace
          s.line(X0, 0, X0 + 2 * XS, 0, { color: 'faint', width: 1 });
          s.line(X0 + XS, -1.3, X0 + XS, 1.3, { color: 'faint', width: 1, dash: [3, 4] });
          s.between((x) => target((x - X0) / XS), (x) => S(c, N, (x - X0) / XS), X0, X0 + 2 * XS, { fill: 'red', fillAlpha: 0.13, n: 500 });
          s.fn((x) => target((x - X0) / XS), { domain: [X0, X0 + 2 * XS], n: 700, color: 'muted', width: 1.6, dash: [6, 4] });
          s.fn((x) => S(c, N, (x - X0) / XS), { domain: [X0, X0 + 2 * XS], n: 700, color: 'accent', width: 2.6 });
          // ---- phasor chain (clipped to the left half)
          let px = CX, py = c.c0;
          s.clip(() => {
            s.line(CX - 1.6, 0, X0 - 0.12, 0, { color: 'faint', width: 1 });
            for (let n = 1; n <= N; n++) {
              const a = c.A[n]; if (a < 1e-4) continue;
              const th = TAU * n * tau + c.P[n], qx = px - a * Math.sin(th), qy = py + a * Math.cos(th);
              if (v.M && n <= 14) s.circle(px, py, a, { color: 'muted', width: 0.8, alpha: 0.5 });
              s.line(px, py, qx, qy, { color: n === 1 ? 'orange' : 'ink', width: n === 1 ? 2.2 : 1.4, alpha: n === 1 ? 1 : 0.8 });
              px = qx; py = qy;
            }
          }, [-4, X0 - 0.12], [-1.5, 1.5]);
          s.dot(CX, c.c0, { r: 3, color: 'muted' });
          const yN = S(c, N, tau);
          s.line(Math.min(px, X0 - 0.12), py, xT(tau), yN, { color: 'gold', width: 1.2, dash: [3, 3] });
          s.vline(xT(tau), { color: 'gold', width: 1.2, alpha: 0.6 });
          s.dot(xT(tau), yN, { r: 5, color: 'gold' });
          if (px < X0 - 0.12) s.dot(px, py, { r: 4, color: 'gold' });
          s.text(`${N} phasor${N > 1 ? 's' : ''}`, CX, -1.32, { align: 'center', color: 'muted', size: 11.5 });
          s.corner(sel.value === 'draw' ? 'your waveform' : 'drag across the right half to draw a period', 'tr', { color: 'muted' });
          s.corner(`$S_{${N}}$ after ${v.fix(tau, 2)} periods`, 'tl', { color: 'accent' });
          // ---- amplitudes and phases
          let amx = 1e-9; for (let n = 1; n <= NB; n++) amx = Math.max(amx, c.A[n]);
          for (let n = 1; n <= NB; n++) {
            const a = c.A[n] / amx, on = n <= N;
            am.rect(n - 0.33, 0, n + 0.33, a, { fill: on ? 'accent' : 'muted', fillAlpha: on ? 0.75 : 0.22, stroke: false });
            if (a > 0.02) pp.dot(n, c.P[n], { r: on ? 4 : 3, color: on ? 'accent' : 'muted', alpha: on ? 1 : 0.6 });
          }
          am.vline(N + 0.5, { color: 'accent', width: 1.4, dash: [4, 3] });
          pp.vline(N + 0.5, { color: 'accent', width: 1.4, dash: [4, 3] });
          pp.hline(0, { color: 'faint', width: 1 });
        }, { still: 0.3 / 0.2 });
        v.legend([['accent', 'partial sum $S_N$'], ['muted', 'the waveform', { dash: true }], ['orange', 'phasor of the fundamental'], ['red', 'error', { area: true }]]);
        v.readout(() => {
          const c = coeffs(), N = nS.value;
          let kept = c.c0 * c.c0; for (let n = 1; n <= N; n++) kept += (c.A[n] * c.A[n]) / 2;
          let mx = 0, at = 0; for (let i = 0; i < 2048; i++) { const u = i / 2048, d = Math.abs(target(u) - S(c, N, u)); if (d > mx) { mx = d; at = u; } }
          const rel = Math.sqrt(Math.max(0, 1 - kept / c.E));
          let need = 0; { let k2 = c.c0 * c.c0; for (let n = 1; n <= NB; n++) { k2 += (c.A[n] * c.A[n]) / 2; if (Math.sqrt(Math.max(0, 1 - k2 / c.E)) < 0.05) { need = n; break; } } }
          return `$N$ = ${N}: rms error ${v.fix(100 * rel, 2)}% of the waveform's RMS (from the coefficients, by Parseval 4.4) · largest error ${v.fix(mx, 3)} at ${v.fix(at, 3)} of a period${sel.value === 'saw' || sel.value === 'square' || sel.value === 'pulse' ? ', beside a jump, where the overshoot never shrinks below about 9% of the jump (Gibbs, sig-4.4) although its width does' : ''} · $c_0$ = ${v.fix(c.c0, 3)} · ${need ? `rms error below 5% from $N$ = ${need} on` : 'rms error still above 5% at $N$ = 40'} · at ${F0} Hz, harmonic $N$ sits at ${v.fix((N * F0) / 1000, 2)} kHz`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.3
    {
      num: '4.3',
      kind: 'Theorem',
      name: 'Smoothness controls how fast harmonics decay',
      statement: String.raw`Let $p$ be periodic with Fourier coefficients $c_n$ (4.2), $f_0=1/T$.
(a) If $p,p',\dots,p^{(k-1)}$ are continuous and $p^{(k)}$ is piecewise smooth, then
$$|c_n|\le\frac{C}{|n|^{k+1}} .$$
If moreover $p^{(k)}$ really jumps somewhere, then $|n|^{k+1}|c_n|$ does not tend to $0$, so the bound is sharp. A jump in the waveform gives harmonics falling like $1/n$ (−6 dB per octave of $n$), a corner like $1/n^2$ (−12 dB/oct), a jump in curvature like $1/n^3$ (−18 dB/oct).
(b) If $p$ is infinitely differentiable, $c_n$ decays faster than every power of $n$. If $p$ is real-analytic, the decay is exponential: $|c_n|\le Cr^{|n|}$ for some $r<1$.
(c) Conversely, if $\sum_n|n|^k|c_n|<\infty$ then $p$ has $k$ continuous derivatives.

On a log–log plot of $|c_n|$ against $n$ the harmonics therefore line up with slope $-(k+1)$, and the slope tells how smooth the waveform is.`,
      idea: String.raw`Integrate by parts: $c_n(p')=2\pi inf_0\,c_n(p)$ whenever $p$ is continuous, so each continuous derivative buys a factor $1/n$. At the first derivative that jumps, the integration by parts leaves boundary terms: each jump of size $J$ at $t_j$ contributes $J\,e^{-2\pi inf_0t_j}/(2\pi in)$, which is exactly of order $1/n$. Everything left over is $o(1/n)$ by the Riemann–Lebesgue lemma (rca-5.12). For the converse, an absolutely convergent series of continuous functions can be differentiated term by term. In sound: corners are bright. The bowed string's Helmholtz motion (2.10) is a sawtooth with $1/n$ harmonics, a soft-edged flute tone is dark, and any loss that rounds the corners of a waveform dulls the tone above the harmonic where the rounding becomes visible.`,
      caption: String.raw`Pick a wave: square and sawtooth jump, the triangle has corners, the parabolic wave has jumps in curvature only, and the smooth wave is analytic. On the left the wave is blue and its slope $p'$ orange; arrows mark the deltas where $p$ itself jumps. On the right the log–log spectrum, with reference lines of slope −1, −2, −3 and the measured slope written on each octave of $n$. **Round the corners** with the slider: each corner is smeared over a short time, which adds one power of $1/n$, but only above the knee near $n\approx1/(\text{rounding width})$. Below the knee the harmonics still see a sharp corner. Hold the tone and drag the slider to hear the brightness drain away.`,
      deps: ['music-4.2', 'rca-5.12'],
      see: ['sig-4.8', 'sig-4.12', 'pde-4.9', 'music-2.10', 'music-2.7'],
      refs: ['Benson ch. 2'],
      tags: ['fourier', 'brightness'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Fourier_series#Smoothness' },
      viz(v) {
        const M = v.M, K = 16384, NMAX = 256, F0 = 220;
        // each wave: g(u) on one period u ∈ [0, 1), slope gp(u) between jumps, jumps [[u, size]], order k (first derivative that jumps)
        const R0 = 0.72;
        const W = {
          square: { g: (u) => (u < 0.5 ? 1 : -1), gp: () => 0, jumps: [[0, 2], [0.5, -2]], k: 0, name: 'square' },
          saw: { g: (u) => 1 - 2 * u, gp: () => -2, jumps: [[0, 2]], k: 0, name: 'sawtooth' },
          tri: { g: (u) => (u < 0.5 ? -1 + 4 * u : 3 - 4 * u), gp: (u) => (u < 0.5 ? 4 : -4), jumps: [], k: 1, name: 'triangle' },
          para: { g: (u) => (u < 0.5 ? 16 * u * (0.5 - u) * 0.98 / 1 : -16 * (u - 0.5) * (1 - u) * 0.98), gp: (u) => (u < 0.5 ? 0.98 * (8 - 32 * u) : 0.98 * (-24 + 32 * u)), jumps: [], k: 2, name: 'parabolic' },
          smooth: { g: (u) => ((1 - R0 * R0) / (1 - 2 * R0 * Math.cos(TAU * u) + R0 * R0) - 1) / 5.2, gp: (u) => (-(1 - R0 * R0) * 2 * R0 * TAU * Math.sin(TAU * u)) / (1 - 2 * R0 * Math.cos(TAU * u) + R0 * R0) ** 2 / 5.2, jumps: [], k: Infinity, name: 'smooth (analytic)' },
        };
        const wS = v.select('wave', [{ value: 'square', label: 'square' }, { value: 'saw', label: 'sawtooth' }, { value: 'tri', label: 'triangle' }, { value: 'para', label: 'parabolic' }, { value: 'smooth', label: 'smooth' }], 'square', { onChange: () => sync() });
        const rS = v.slider('round the corners over', 0, 0.12, 0, { step: 0.001, fmt: (x) => (x ? v.fix(100 * x, 1) + '% of a period' : 'off'), onChange: () => sync() });
        const lv = loopVoice(v);
        const cache = new Map();
        const data = () => compute(wS.value, rS.value);
        const compute = (name, rr) => {
          const k = name + '|' + rr; if (cache.has(k)) return cache.get(k); if (cache.size > 40) cache.clear();
          const w = W[name], raw = new Float64Array(K); for (let i = 0; i < K; i++) raw[i] = w.g(i / K);
          const m = Math.round(rr * K); let ys = raw;
          if (m >= 2) { // cyclic moving average over m samples (box rounding)
            ys = new Float64Array(K); const pre = new Float64Array(2 * K + 1); for (let i = 0; i < 2 * K; i++) pre[i + 1] = pre[i] + raw[i % K];
            const h = Math.floor(m / 2); for (let i = 0; i < K; i++) { const a = i - h + K, b = a + m; ys[i] = (pre[b] - pre[a]) / m; }
          }
          const { re, im } = M.fftReal(Array.from(ys)), A = new Float64Array(NMAX + 1);
          for (let n = 1; n <= NMAX; n++) A[n] = (2 * Math.hypot(re[n], im[n])) / K;
          const a1 = A[1] || 1, rel = Array.from(A, (a) => a / a1);
          // octave bands: largest coefficient in [2^j, 2^(j+1)), and the slope between successive bands
          const bands = [];
          for (let j = 0; 2 ** j < NMAX; j++) { let b = 0, at = 0; for (let n = 2 ** j; n < Math.min(NMAX + 1, 2 ** (j + 1)); n++) if (rel[n] > b) { b = rel[n]; at = n; } bands.push([at, b]); }
          const slopes = []; for (let j = 1; j < bands.length; j++) { const [n0, b0] = bands[j - 1], [n1, b1] = bands[j]; if (b0 > 1e-11 && b1 > 1e-11 && n1 > n0) slopes.push([Math.sqrt(n0 * n1), Math.log(b1 / b0) / Math.log(n1 / n0), Math.sqrt(b0 * b1)]); }
          const D = { ys, A, rel, slopes, m };
          cache.set(k, D);
          return D;
        };
        const loopBuf = () => { const d = data(); const h = []; for (let n = 1; n <= NMAX && n * F0 < 19000; n++) if (d.A[n] > 1e-7) h.push([n, 0.25 * d.A[n], 0]); return periodicLoop(h, F0).buf; };
        function sync() { lv.update(loopBuf, 0.6); }
        v.toggle('hold the tone', false, { onChange: (on) => { if (on) lv.start(loopBuf(), 0.6); else lv.stop(); } });
        const ws = v.stage({ x: [0, 2], y: [-2.45, 1.3], height: 290, axes: false, weight: 1, title: 'the wave $p$ and its slope $p\'$' });
        const ls = v.stage({ x: [1, NMAX], y: [1e-7, 3], xlog: true, ylog: true, height: 290, axes: 'box', xlabel: 'harmonic n', weight: 1.3, title: '$|A_n|/A_1$ on log–log axes' });
        const tone = (name, dur) => { const d = compute(name, name === wS.value ? rS.value : 0); const parts = []; for (let n = 1; n <= NMAX && n * F0 < 19000; n++) if (d.A[n] > 1e-7) parts.push({ f: n * F0, a: d.A[n] }); return toRms(partials(parts, dur, { att: 0.02, rel: 0.08 }), 0.13); };
        v.soundButton('Listen', (snd) => snd.samples(tone(wS.value, 1.3), SR, { gain: 0.9 }));
        v.soundButton('jump → corner → smooth', (snd) => snd.samples(join([tone('square', 0.9), tone('tri', 0.9), tone('smooth', 0.9)], 0.15), SR, { gain: 0.9 }));
        v.render(() => {
          const d = data(), w = W[wS.value], r = rS.value, k = w.k + (d.m >= 2 ? 1 : 0);
          // ---- the wave and its slope (offset band below)
          const base = -1.55, f = (x) => { const u = M.mod(x, 1) * K, i = Math.floor(u), t = u - i; return d.ys[i % K] * (1 - t) + d.ys[(i + 1) % K] * t; };
          ws.hline(0, { color: 'faint', width: 1 }); ws.hline(base, { color: 'faint', width: 1 });
          ws.vline(1, { color: 'faint', width: 1, dash: [3, 4] });
          ws.fn(f, { domain: [0, 2], n: 900, color: 'accent', width: 2.4 });
          let slope;
          if (d.m >= 2) { const h = 2 / K; slope = (x) => (f(x + h) - f(x - h)) / (2 * h); } else slope = (x) => w.gp(M.mod(x, 1));
          let smax = 1e-9; for (let i = 0; i < 1600; i++) smax = Math.max(smax, Math.abs(slope(i / 800)));
          const sc = 0.78 / smax;
          ws.fn((x) => base + sc * slope(x), { domain: [0, 2], n: 1600, color: 'orange', width: 1.8 });
          if (d.m < 2) for (const [u, J] of w.jumps) for (const x of [u, u + 1, u + 2]) if (x <= 2.0001) ws.arrow(x, base, x, base + 0.8 * Math.sign(J), { color: 'red', width: 2, head: 8 });
          ws.text('p', 0.03, 1.12, { color: 'accent', math: true, size: 16 });
          ws.text("p′", 0.03, base + 0.78 + 0.1, { color: 'orange', math: true, size: 16 });
          const why = k === 0 ? 'p jumps: harmonics ∝ 1/n' : k === 1 ? 'p continuous, p′ jumps: ∝ 1/n²' : k === 2 ? 'p, p′ continuous, p″ jumps: ∝ 1/n³' : 'every derivative continuous: faster than any power';
          ws.corner(why, 'bl', { color: 'ink', weight: 600 });
          if (d.m < 2 && w.jumps.length) ws.corner('red arrows: deltas in p′ at the jumps', 'tr', { color: 'red', size: 11 });
          // ---- log–log spectrum
          for (const [q, lab] of [[1, '1/n'], [2, '1/n²'], [3, '1/n³']]) {
            ls.fn((n) => n ** -q, { domain: [1, NMAX], color: 'muted', width: 1.1, dash: [5, 4], alpha: 0.75 });
            const nl = q === 1 ? 150 : q === 2 ? 70 : 32; ls.text(lab, nl, nl ** -q * 1.9, { color: 'muted', size: 11, align: 'center' });
          }
          const pts = []; for (let n = 1; n <= NMAX; n++) if (d.rel[n] > 2e-7) pts.push([n, d.rel[n]]);
          ls.dots(pts, { r: 2.6, color: 'accent' });
          if (d.m >= 2) { const nk = 1 / r; if (nk < NMAX) { ls.vline(nk, { color: 'gold', width: 1.4, dash: [4, 3] }); ls.text('knee ≈ 1/width', nk * 1.08, 1.5, { color: 'gold', size: 11, align: 'left' }); } }
          for (const [n, s, b] of d.slopes) if (b > 3e-7 && n > 1.5) ls.text(v.fix(s, 1), n, Math.min(1.5, b * 3.2), { color: 'ink', size: 10.5, align: 'center', weight: 600 });
          ls.corner('numbers: measured slope per octave of n', 'bl', { color: 'muted', size: 11 });
        });
        v.legend([['accent', 'wave / its harmonics'], ['orange', 'slope $p\'$'], ['muted', 'reference slopes −1, −2, −3', { dash: true }]]);
        v.readout(() => {
          const d = data(), w = W[wS.value], k = w.k + (d.m >= 2 ? 1 : 0);
          const tail = d.slopes.filter(([n, , b]) => n > 20 && b > 1e-9).map(([, s]) => s);
          const sl = tail.length ? tail[tail.length - 1] : d.slopes.length ? d.slopes[d.slopes.length - 1][1] : NaN;
          let c = 0, s = 0; for (let n = 1; n <= NMAX && n * F0 < 19000; n++) { c += n * d.A[n]; s += d.A[n]; }
          const pred = Number.isFinite(k) ? `theorem: slope −${k + 1} (${v.fix(6.02 * (k + 1), 0)} dB per octave)` : 'theorem: faster than every power, here $A_n\\propto r^n$ with $r$ = 0.72 (the local slope keeps steepening)';
          return `${w.name}${d.m >= 2 ? `, corners rounded over ${v.fix(100 * rS.value, 1)}% of a period` : ''} · measured slope at the top octave available: ${Number.isFinite(sl) ? v.fix(sl, 2) : '—'} (${Number.isFinite(sl) ? v.fix(6.02 * sl, 1) + ' dB per octave' : 'below the floor'}) · ${pred} · harmonic 21 at ${v.fix(dB(d.rel[21] || 1e-12), 1)} dB re the fundamental · spectral centroid at ${F0} Hz: ${v.fix((c / s) * F0, 0)} Hz`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.4
    {
      num: '4.4',
      kind: 'Theorem',
      name: 'Parseval: a tone’s energy is the sum over harmonics',
      statement: String.raw`Let $p$ be a periodic tone of period $T$ with finite energy per period, and Fourier coefficients $c_n$ (4.2), so that $p(t)=c_0+\sum_{n\ge1}A_n\cos(2\pi nf_0t+\varphi_n)$ in mean square. Then
$$\frac1T\int_0^T|p(t)|^2\,dt=\sum_{n\in\mathbb Z}|c_n|^2=c_0^2+\frac12\sum_{n\ge1}A_n^2 .$$
Hence:
(a) the mean-square pressure, the RMS level and the power of a steady tone depend only on the amplitudes $A_n$, never on the phases $\varphi_n$;
(b) each harmonic contributes $A_n^2/2$ independently of the others;
(c) dropping the harmonics above $N$ removes exactly $\frac12\sum_{n>N}A_n^2$ of the mean square.

The **peak** value, and so the crest factor $\max|p|/p_{\rm rms}$, does depend on the phases.`,
      idea: String.raw`Square the partial sum $S_Np$ and average over a period. The harmonics are orthogonal, so every cross term $A_mA_n\cos(\cdot)\cos(\cdot)$ with $m\ne n$ averages to zero, and $\cos^2$ averages to $\tfrac12$: the mean of $S_N^2$ is $c_0^2+\tfrac12\sum_{n\le N}A_n^2$ whatever the phases. Letting $N\to\infty$ uses the mean-square convergence of 4.2 (Bessel's inequality and completeness: pma-8.12, pma-8.16). The phases only decide where the harmonics' peaks line up. With all phases equal the peaks add into tall spikes; Schroeder's phase choice (1970) staggers them so the waveform stays nearly flat, which is why it is used in test signals and loudspeaker measurements.`,
      caption: String.raw`Drag the tops of the bars to set the twelve harmonic amplitudes; the little dials under them show the phases. Change the phases: *aligned* (all peaks together), *alternating*, *Schroeder* (low crest factor) or *random*; *Scramble* draws new random phases. The waveform changes completely and its peak (red) jumps around, but the green ±RMS lines do not move. On the right, the energy budget: the mean square measured from the waveform itself (left column) always equals the stack of $A_n^2/2$ (right column). Hold the tone and scramble while it sounds: the waveform changes but the loudness does not. (At low fundamentals you may hear a slight change in buzz, because Ohm's acoustic law is only approximate; see 5.3.)`,
      deps: ['music-4.2', 'pma-8.16'],
      see: ['sig-4.6', 'pde-4.6', 'rca-4.26', 'music-5.3'],
      refs: ['Benson ch. 2'],
      tags: ['fourier', 'energy'],
      credit: 'Marc-Antoine Parseval, 1799 (published 1806); Schroeder phases: M. R. Schroeder, 1970',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Parseval%27s_theorem' },
      viz(v) {
        const M = v.M, NH = 12, F0 = 147, KS = 2048;
        const A = M.range(NH, 1).map((n) => Math.min(1, 1 / n)), phi = new Float64Array(NH + 1);
        let seed = 3;
        const phs = v.select('phases', [{ value: 'aligned', label: 'aligned' }, { value: 'alt', label: 'alternating' }, { value: 'schroeder', label: 'Schroeder' }, { value: 'random', label: 'random' }], 'aligned', { onChange: () => sync() });
        v.button('Scramble phases', () => { seed++; phs.set('random'); sync(); });
        v.button('Reset amplitudes', () => { for (let n = 1; n <= NH; n++) A[n - 1] = 1 / n; sync(); });
        const setPhases = (mode = phs.value) => {
          const e = A.reduce((s, a) => s + a * a, 0) || 1, r = v.rng(seed);
          let acc = 0;
          for (let n = 1; n <= NH; n++) {
            if (mode === 'aligned') phi[n] = 0;
            else if (mode === 'alt') phi[n] = n % 2 ? 0 : Math.PI;
            else if (mode === 'random') phi[n] = r.uniform(-Math.PI, Math.PI);
            else { // Schroeder (1970): φ_n = −2π Σ_{l<n} (n − l) p_l, p_l = power fraction of harmonic l
              let s = 0; for (let l = 1; l < n; l++) s += (n - l) * (A[l - 1] * A[l - 1]) / e; phi[n] = M.mod(-TAU * s + Math.PI, TAU) - Math.PI; acc = s;
            }
          }
          return acc;
        };
        const wave = (u) => { let y = 0; for (let n = 1; n <= NH; n++) y += A[n - 1] * Math.cos(TAU * n * u + phi[n]); return y; };
        const stats = () => {
          setPhases(); let s2 = 0, pk = 0;
          for (let i = 0; i < KS; i++) { const y = wave(i / KS); s2 += y * y; pk = Math.max(pk, Math.abs(y)); }
          const ms = s2 / KS, par = A.reduce((s, a) => s + (a * a) / 2, 0);
          return { ms, par, pk };
        };
        const lv = loopVoice(v);
        const loopBuf = () => { setPhases(); return periodicLoop(M.range(NH, 1).map((n) => [n, 0.075 * A[n - 1], phi[n]]), F0).buf; };
        function sync() { lv.update(loopBuf, 0.9); v.invalidate(); }
        v.toggle('hold the tone', false, { onChange: (on) => { if (on) lv.start(loopBuf(), 0.9); else lv.stop(); } });
        v.soundButton('aligned, then Schroeder', (snd) => {
          const bufs = [];
          for (const p of ['aligned', 'schroeder']) { setPhases(p); bufs.push(finish(partials(M.range(NH, 1).map((n) => ({ f: n * F0, a: 0.075 * A[n - 1], ph: phi[n] })), 1.3), 1, SR, 0.03, 0.08)); }
          // both scaled by the same factor, so their RMS levels stay equal
          setPhases();
          let m = 0; for (const b of bufs) for (let i = 0; i < b.length; i++) m = Math.max(m, Math.abs(b[i]));
          snd.samples(join(bufs.map((b) => b.map((x) => (0.9 * x) / m)), 0.25), SR, { gain: 0.8 });
        });
        const bs = v.stage({ x: [0.3, NH + 0.7], y: [-0.36, 1.1], height: 245, axes: 'box', xlabel: 'harmonic n', xticks: M.range(NH, 1), yticks: [[0, '0'], [0.5, '0.5'], [1, '1']], weight: 1.35, title: 'amplitudes $A_n$ (drag) and phases (dials)' });
        const es = v.stage({ x: [0, 3.2], y: [0, 1.1], height: 245, axes: false, weight: 0.75, minWidth: 220, title: 'energy budget' });
        const ws = v.stage({ x: [0, 2], y: [-3.2, 3.2], height: 205, axes: false, full: true });
        bs.onDrag((x, y) => { const n = Math.round(x); if (n >= 1 && n <= NH && y > -0.05) { A[n - 1] = M.clamp(y, 0, 1); sync(); } });
        const hue = (n) => v.mix(v.color('accent'), v.color('teal'), (n - 1) / (NH - 1));
        v.render(() => {
          const st = stats(), rms = Math.sqrt(st.ms);
          // ---- bars and phase dials
          bs.hline(0, { color: 'muted', width: 1 });
          for (let n = 1; n <= NH; n++) {
            bs.rect(n - 0.33, 0, n + 0.33, A[n - 1], { fill: hue(n), fillAlpha: 0.8, stroke: false });
            const X = bs.X(n), Y = bs.Y(-0.2), r = 10, c = bs.ctx;
            c.save(); c.beginPath(); c.arc(X, Y, r, 0, TAU); c.strokeStyle = v.color('muted', 0.8); c.lineWidth = 1.2; c.stroke();
            c.beginPath(); c.moveTo(X, Y); c.lineTo(X + r * Math.cos(phi[n]), Y - r * Math.sin(phi[n])); c.strokeStyle = v.color('ink'); c.lineWidth = 2; c.stroke(); c.restore();
          }
          // ---- energy budget: time-domain mean square vs Σ A²/2 (stacked)
          const top = Math.max(0.2, st.ms, st.par) * 1.12, sy = (e) => e / top;
          es.rect(0.3, 0, 1.3, sy(st.ms), { fill: 'green', fillAlpha: 0.55, color: 'green', width: 1.4 });
          let acc = 0;
          for (let n = 1; n <= NH; n++) { const e = (A[n - 1] * A[n - 1]) / 2; if (e > 0) es.rect(1.9, sy(acc), 2.9, sy(acc + e), { fill: hue(n), fillAlpha: 0.8, color: 'panel', width: 0.8 }); if (e / top > 0.06) es.text(String(n), 2.4, sy(acc + e / 2), { align: 'center', color: 'panel', size: 10.5, halo: false, weight: 600 }); acc += e; }
          es.line(0.15, sy(st.ms), 3.05, sy(st.ms), { color: 'ink', width: 1, dash: [3, 3] });
          es.text('mean of p²', 0.8, -0.0, { align: 'center', baseline: 'top', color: 'ink', size: 10.5, dy: 4 });
          es.text('Σ Aₙ²/2', 2.4, -0.0, { align: 'center', baseline: 'top', color: 'ink', size: 10.5, dy: 4 });
          es.text(v.fix(st.ms, 4), 0.8, sy(st.ms), { align: 'center', baseline: 'bottom', color: 'green', size: 11, weight: 600, dy: -3 });
          es.text(v.fix(st.par, 4), 2.4, sy(st.par), { align: 'center', baseline: 'bottom', color: 'ink', size: 11, weight: 600, dy: -3 });
          // ---- waveform
          const ym = Math.max(1, st.pk) * 1.15;
          ws.setView([0, 2], [-ym, ym]);
          ws.hline(0, { color: 'faint', width: 1 });
          ws.hband(-rms, rms, { color: 'green', alpha: 0.08 });
          ws.hline(rms, { color: 'green', width: 1.6, dash: [6, 4] }); ws.hline(-rms, { color: 'green', width: 1.6, dash: [6, 4] });
          ws.fn((x) => wave(x), { domain: [0, 2], n: 900, color: 'accent', width: 2.2 });
          let at = 0, pk = 0; for (let i = 0; i < 1000; i++) { const y = Math.abs(wave(i / 1000)); if (y > pk) { pk = y; at = i / 1000; } }
          for (const x of [at, at + 1]) ws.dot(x, wave(at), { r: 5, color: 'red' });
          ws.text(`±RMS = ${v.fix(rms, 3)}`, 1.99, rms, { align: 'right', baseline: 'bottom', color: 'green', size: 11.5, weight: 600, dy: -3 });
          ws.corner(`peak ${v.fix(pk, 3)} · crest factor ${v.fix(pk / rms, 2)} (${v.fix(dB(pk / rms), 1)} dB)`, 'tl', { color: 'red', weight: 600 });
          ws.corner('two periods', 'tr', { color: 'muted', size: 11 });
        });
        v.legend([['green', '±RMS, from the waveform'], ['red', 'peak'], ['accent', 'waveform']]);
        v.readout(() => {
          const st = stats();
          return `mean square measured on the waveform (${KS} samples per period): ${v.fix(st.ms, 6)} · Parseval's sum $\\tfrac12\\sum A_n^2$: ${v.fix(st.par, 6)} · difference ${v.sci(Math.abs(st.ms - st.par) || 1e-17, 1)} · RMS ${v.fix(Math.sqrt(st.ms), 4)}, the same for every choice of phases · peak ${v.fix(st.pk, 3)}, crest factor ${v.fix(st.pk / Math.sqrt(st.ms), 2)}: this is what the phases change`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.5
    {
      num: '4.5',
      kind: 'Concept',
      name: 'Continuous spectra and the Fourier transform',
      statement: String.raw`A sound that is not periodic has no Fourier series. Its **Fourier transform**
$$P(f)=\int_{-\infty}^{\infty}p(t)\,e^{-2\pi ift}\,dt$$
spreads its content over a continuum of frequencies. When $P$ is integrable the sound is recovered as $p(t)=\int P(f)e^{2\pi ift}\,df$, and in every case the energy is shared out as $\int|p|^2\,dt=\int|P|^2\,df$ (Plancherel). Typical shapes:
- a sustained periodic tone has a **line spectrum**, lines at $nf_0$ as narrow as the length of the observation allows (the transform of a long stretch of a Fourier series);
- a partial that dies away as $e^{-t/\tau}\cos 2\pi f_kt$ has a **broadened line**, the Lorentzian $|P(f)|^2\propto1/\big(\tau^{-2}+4\pi^2(f-f_k)^2\big)$ near $f_k$. Its full width at half power is $$\Delta f=\frac1{\pi\tau},$$ so the faster the decay, the broader the line;
- a click has a flat, continuous spectrum, and noise a continuous spectrum with no lines at all.`,
      idea: String.raw`Watch a periodic sound for a time $T_{\rm obs}$ and expand it in a Fourier series of period $T_{\rm obs}$. As $T_{\rm obs}\to\infty$ the allowed frequencies $k/T_{\rm obs}$ crowd together and the sum becomes the integral (sig-5.1; rca-9.1, rca-9.11). For a decaying partial the integral can be done exactly: $\int_0^\infty e^{-t/\tau}e^{-2\pi i(f-f_k)t}\,dt=1/(\tau^{-1}+2\pi i(f-f_k))$, whose squared modulus falls to half its peak where $2\pi|f-f_k|=1/\tau$. In a plucked string or a struck bar each partial is such a line, and the upper partials, which die faster, are broader. The width is a direct reading of the decay time, that is of the resonator's $Q=f_k/\Delta f$. A click contains every frequency in equal measure because it is shorter than any period of interest.`,
      caption: String.raw`Choose a sound; each spectrum is computed by FFT from the whole 3 s sound. The organ tone gives lines as narrow as 3 s of listening allows. The guitar pluck and the marimba stroke give lines broadened by their decay, and their higher partials, which die faster, are broader. A woodblock is two short-lived partials smeared into bumps, a click is flat, and noise is a continuum. Drag the decay time $\tau$ (for the plucked and struck sounds): the zoom on the right shows the fundamental's line measured from the sound, the Lorentzian predicted from $\tau$ (dashed), and the half-power width. *Listen* to each.`,
      deps: ['music-4.2', 'rca-9.1', 'rca-9.11'],
      see: ['sig-5.1', 'sig-5.12', 'rca-9.13', 'music-3.11', 'mech-4.7', 'sig-8.11'],
      refs: ['Benson ch. 2', 'Loy II ch. 3'],
      tags: ['fourier transform', 'spectrum'],
      credit: 'Fourier, 1822; Plancherel, 1910',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Fourier_transform' },
      viz(v) {
        const M = v.M, SR2 = 22050, NF = 65536, FMAX = 3000;
        const SND = {
          organ: { name: 'organ pipe (steady)', f1: 196, tau: null },
          guitar: { name: 'guitar pluck', f1: 196, tau: 0.8 },
          marimba: { name: 'marimba stroke', f1: 262, tau: 0.35 },
          block: { name: 'woodblock', f1: 880, tau: 0.025 },
          click: { name: 'click', f1: 1000, tau: null },
          noise: { name: 'noise burst', f1: 1000, tau: null },
        };
        const sel = v.select('sound', [{ value: 'organ', label: 'organ' }, { value: 'guitar', label: 'guitar' }, { value: 'marimba', label: 'marimba' }, { value: 'block', label: 'woodblock' }, { value: 'click', label: 'click' }, { value: 'noise', label: 'noise' }], 'guitar', { onChange: (x) => { if (SND[x].tau) tS.set(SND[x].tau); tS.el.hidden = !SND[x].tau; } });
        const tS = v.slider('decay time $\\tau$ of the fundamental', 0.01, 3, 0.8, { log: true, fmt: (x) => (x < 0.1 ? v.fix(x * 1000, 0) + ' ms' : v.fix(x, 2) + ' s') });
        const wv = v.stage({ x: [0, 1.6], y: [-1.12, 1.12], height: 150, axes: 'box', xlabel: 'time (s)', yticks: [], full: true });
        const sp = v.stage({ x: [0, FMAX], y: [-82, 5], height: 255, axes: 'box', xlabel: 'frequency (Hz)', yticks: [[0, '0 dB'], [-20, '−20'], [-40, '−40'], [-60, '−60'], [-80, '−80']], weight: 1.55, title: '$|P(f)|$ of the whole sound (FFT, 3 s)' });
        const zm = v.stage({ x: [-10, 10], y: [0, 1.1], height: 255, axes: 'box', xlabel: 'f − f₁ (Hz)', yticks: [[0.5, '½'], [1, '1']], weight: 0.85, minWidth: 220, title: 'zoom on the fundamental: power' });
        let key = '', D = null;
        const make = () => {
          const k = sel.value + '|' + (SND[sel.value].tau ? tS.value : ''); if (k === key) return D; key = k;
          const S = SND[sel.value], x = new Float32Array(NF), tau = tS.value, rnd = noiseGen(17), d1 = 1 / tau;
          const parts = [];
          if (sel.value === 'organ') { for (let n = 1; n <= 12; n++) parts.push({ f: n * S.f1, a: n ** -1.2, d: 0 }); }
          else if (sel.value === 'guitar') { for (let n = 1; n <= 24; n++) { const a = Math.abs(Math.sin(n * Math.PI * 0.2)) / n; if (a > 1e-6) parts.push({ f: n * S.f1, a, d: d1 * (1 + 0.12 * (n - 1)) }); } }
          else if (sel.value === 'marimba') { [[1, 1, 1], [3.98, 0.45, 3.2], [9.85, 0.22, 7]].forEach(([r, a, m]) => parts.push({ f: r * S.f1, a, d: d1 * m })); }
          else if (sel.value === 'block') { [[1, 1, 1], [2.31, 0.6, 1.4], [3.9, 0.25, 2]].forEach(([r, a, m]) => parts.push({ f: r * S.f1, a, d: d1 * m })); }
          const t0 = Math.round(0.05 * SR2);
          if (parts.length) {
            const buf = partials(parts, (NF - t0) / SR2, { sr: SR2, att: sel.value === 'organ' ? 0.03 : 0.0015, rel: sel.value === 'organ' ? 0.03 : 0 });
            x.set(buf, t0);
          } else if (sel.value === 'click') { const w = 6; for (let i = 0; i < w; i++) x[t0 + i] = Math.sin((Math.PI * (i + 0.5)) / w) ** 2; }
          else { const n = Math.round(0.4 * SR2), f = Math.round(0.01 * SR2); for (let i = 0; i < n; i++) x[t0 + i] = rnd() * Math.min(1, i / f, (n - i) / f); }
          let mx = 0; for (let i = 0; i < NF; i++) mx = Math.max(mx, Math.abs(x[i])); for (let i = 0; i < NF; i++) x[i] /= mx || 1;
          // whole-sound spectrum
          const re = Float64Array.from(x), im = new Float64Array(NF); M.fft(re, im);
          const df = SR2 / NF, nb = Math.ceil(FMAX / df) + 1, mag = new Float64Array(nb); let mm = 1e-30;
          for (let b = 0; b < nb; b++) { mag[b] = Math.hypot(re[b], im[b]); mm = Math.max(mm, mag[b]); }
          // zoom: direct DTFT on a fine grid around f1
          const lineW = S.tau ? 1 / (Math.PI * tau) : 0, half = S.tau ? Math.max(1.2, 5 * lineW) : sel.value === 'organ' ? 2 : 150, NZ = 161, zf = [], zp = [];
          let zmax = 1e-30;
          for (let j = 0; j < NZ; j++) {
            const f = S.f1 - half + (2 * half * j) / (NZ - 1), w = (TAU * f) / SR2, c = Math.cos(w), s = Math.sin(w);
            let cr = 1, ci = 0, sr = 0, si = 0;
            for (let i = t0; i < NF; i++) { const xi = x[i]; if (xi) { sr += xi * cr; si -= xi * ci; } const nr = cr * c - ci * s; ci = cr * s + ci * c; cr = nr; }
            // rotate back to the start index (only |·| matters)
            const p = sr * sr + si * si; zf.push(f - S.f1); zp.push(p); zmax = Math.max(zmax, p);
          }
          for (let j = 0; j < NZ; j++) zp[j] /= zmax;
          // half-power width by interpolation around the peak
          let jm = 0; for (let j = 1; j < NZ; j++) if (zp[j] > zp[jm]) jm = j;
          let lo = null, hi = null;
          for (let j = jm; j > 0; j--) if (zp[j - 1] < 0.5) { lo = zf[j - 1] + ((0.5 - zp[j - 1]) / (zp[j] - zp[j - 1])) * (zf[j] - zf[j - 1]); break; }
          for (let j = jm; j < NZ - 1; j++) if (zp[j + 1] < 0.5) { hi = zf[j] + ((zp[j] - 0.5) / (zp[j] - zp[j + 1])) * (zf[j + 1] - zf[j]); break; }
          D = { x, mag, mm, df, nb, zf, zp, half, lineW, width: lo != null && hi != null ? hi - lo : null, lo, hi, d1 };
          return D;
        };
        v.soundButton('Listen', (snd) => { const d = make(); snd.samples(Float32Array.from(d.x.subarray(0, Math.round(2.5 * SR2)), (y) => 0.8 * y), SR2, { gain: 0.8 }); });
        v.render(() => {
          const d = make(), S = SND[sel.value];
          // ---- waveform envelope
          const E = envelopeOf(d.x, SR2, 0, 1.6, 500);
          wv.poly([...E.hi, ...E.lo.slice().reverse()], { fill: 'accent', fillAlpha: 0.55, color: 'accent', width: 0.8 });
          if (S.tau) { wv.fn((t) => (t < 0.05 ? NaN : Math.exp(-(t - 0.05) / tS.value)), { domain: [0.05, 1.6], color: 'gold', width: 1.6, dash: [5, 4] }); wv.corner(`gold: $e^{-t/\\tau}$, $\\tau$ = ${tS.value < 0.1 ? v.fix(tS.value * 1000, 0) + ' ms' : v.fix(tS.value, 2) + ' s'}`, 'tr', { color: 'gold' }); }
          wv.corner(S.name, 'tl', { color: 'ink', weight: 600 });
          // ---- full spectrum, pooled per pixel column
          const cols = Math.max(200, Math.round(sp.width || 600)), pts = [];
          for (let c = 0; c < cols; c++) {
            const b0 = Math.floor((c / cols) * (d.nb - 1)), b1 = Math.max(b0 + 1, Math.floor(((c + 1) / cols) * (d.nb - 1)));
            let m = 0; for (let b = b0; b < b1; b++) m = Math.max(m, d.mag[b]);
            pts.push([((b0 + b1) / 2) * d.df, Math.max(-82, dB(m / d.mm))]);
          }
          sp.poly([[0, -82], ...pts, [pts[pts.length - 1][0], -82]], { fill: 'accent', fillAlpha: 0.18, stroke: false });
          sp.path(pts, { color: 'accent', width: 1.4 });
          if (sel.value !== 'click' && sel.value !== 'noise') sp.vline(S.f1, { color: 'gold', width: 1.2, dash: [3, 3] });
          // ---- zoom
          zm.setView([-d.half, d.half], [0, 1.1]);
          if (S.tau) zm.fn((u) => (d.d1 * d.d1) / (d.d1 * d.d1 + (TAU * u) ** 2), { domain: [-d.half, d.half], n: 300, color: 'gold', width: 2, dash: [6, 4] });
          zm.path(d.zf.map((f, j) => [f, d.zp[j]]), { color: 'accent', width: 2.2 });
          zm.hline(0.5, { color: 'faint', width: 1, dash: [3, 3] });
          if (d.width != null && sel.value !== 'noise') {
            zm.measure(d.lo, 0.5, d.hi, 0.5, '');
            zm.text(`Δf = ${v.fix(d.width, d.width < 3 ? 2 : 1)} Hz`, 0, 0.56, { align: 'center', baseline: 'bottom', color: 'ink', size: 11.5, weight: 600 });
          }
        });
        v.legend([['accent', 'measured from the sound'], ['gold', 'decay $e^{-t/\\tau}$ and its Lorentzian', { dash: true }]]);
        v.readout(() => {
          const d = make(), S = SND[sel.value];
          if (S.tau) {
            const pred = 1 / (Math.PI * tS.value);
            return `${S.name}: fundamental ${S.f1} Hz, decay time $\\tau$ = ${tS.value < 0.1 ? v.fix(tS.value * 1000, 0) + ' ms' : v.fix(tS.value, 2) + ' s'} · measured half-power width ${d.width != null ? v.fix(d.width, 3) : '—'} Hz, predicted $1/\\pi\\tau$ = ${v.fix(pred, 3)} Hz · quality factor $Q=f_1/\\Delta f$ ≈ ${v.fix(S.f1 / pred, 0)} · ${sel.value === 'guitar' ? 'partial $n$ decays $1+0.12(n-1)$ times faster, so its line is that much broader' : sel.value === 'marimba' ? 'the overtones (×3.98, ×9.85) decay 3 and 7 times faster: broader lines' : 'two short-lived partials: bumps, no pitch-defining lines'}`;
          }
          if (sel.value === 'organ') return `steady organ-like tone on ${S.f1} Hz, held for the whole 3 s: lines of width ${d.width != null ? v.fix(d.width, 2) : '—'} Hz, close to the limit $0.89/T_{\\rm obs}$ = ${v.fix(0.886 / (NF / SR2 - 0.05), 2)} Hz set by the 3 s of observation (see 4.6) · listen longer and the lines get narrower`;
          let s = 0, s2 = 0, n = 0; for (let b = Math.round(100 / d.df); b < d.nb; b += 7) { const x = dB(d.mag[b] / d.mm); s += x; s2 += x * x; n++; }
          const sd = Math.sqrt(Math.max(0, s2 / n - (s / n) ** 2));
          return sel.value === 'click' ? `a 0.27 ms click: level from 100 Hz to 3 kHz is flat to within ${v.fix(sd, 2)} dB (standard deviation): every frequency at once, none singled out` : `0.4 s of white noise: a continuum with random ripples (standard deviation ${v.fix(sd, 1)} dB across 100 Hz–3 kHz) but no lines anywhere`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.6
    {
      num: '4.6',
      kind: 'Theorem',
      name: 'Time–frequency uncertainty (the Gabor limit)',
      statement: String.raw`Let $z(t)$ be a sound of finite energy, written as a complex (analytic) signal, with Fourier transform $Z(f)$. Measure its **duration** $\Delta t$ and **bandwidth** $\Delta f$ as the standard deviations of the energy distributions $|z(t)|^2$ in time and $|Z(f)|^2$ in frequency (in Hz). Then
$$\Delta t\cdot\Delta f\;\ge\;\frac1{4\pi}\approx0.0796,$$
with equality exactly for Gaussian tone bursts $z(t)=e^{-(t-t_0)^2/4\Delta t^2}\,e^{2\pi if_0t}$, Gabor's "logons". So a note of duration $\Delta t$ cannot have its frequency defined to better than $\Delta f=1/(4\pi\Delta t)$. A 10 ms note is uncertain by at least 8 Hz: 31 cents at A4, but more than a semitone at A2.`,
      idea: String.raw`Put the centre at $t_0=0$, $f_0=0$. Integrating by parts, $\int t\,(|z|^2)'\,dt=-\int|z|^2\,dt$, and the Cauchy–Schwarz inequality bounds the left side by $2\big(\int t^2|z|^2\big)^{1/2}\big(\int|z'|^2\big)^{1/2}$. Plancherel (rca-9.13) turns $\int|z'|^2$ into $4\pi^2\int f^2|Z|^2$, which gives the inequality. Equality in Cauchy–Schwarz forces $z'\propto t\,z$, a Gaussian, and the Gaussian is its own Fourier transform (fa-7.6). In music the limit is felt directly: very short notes lose their pitch and become clicks, and fast passages in the bass blur because a semitone there is only a few hertz wide. Gabor (1946) proposed tiling the time–frequency plane with logons, the idea behind the spectrogram (4.7) and granular synthesis.`,
      caption: String.raw`Drag the note length $\Delta t$ and the pitch. Top left: one note, with its envelope (gold) and the band $\pm\Delta t$. Top right: its power spectrum, with $\pm\Delta f$ and the piano keys it spans. Bottom left: a spectrogram of the five-note figure C–D–E–F–G on that note length, analysed with a window matched to the notes. Long notes are thin horizontal lines; short ones smear vertically until the pitches merge. Bottom right: every note is a point in the $(\Delta t,\Delta f)$ plane; the red region is forbidden, and Gaussian notes sit exactly on its edge. Switch the envelope to a raised cosine, a glide or a pair of notes to move off the edge. *Play the figure* to hear it, and *long → short* to hear the figure dissolve into clicks.`,
      deps: ['music-4.5', 'fa-7.6', 'rca-9.13'],
      see: ['sig-5.15', 'sig-5.4', 'sig-8.13', 'qm-2.11', 'qm-5.20', 'neuro-6.9'],
      refs: ['Benson ch. 2'],
      tags: ['uncertainty', 'fourier transform'],
      credit: 'Dennis Gabor, “Theory of communication”, 1946 (after Heisenberg, 1927, and Weyl, 1928)',
      scope: String.raw`$\Delta t$ and $\Delta f$ here are root-mean-square widths of the energy distributions; other measures of width (−3 dB widths, effective durations) give other constants but the same reciprocal law. The bound limits what a single linear time–frequency analysis can resolve. The ear is a nonlinear system, and in some tasks listeners beat the naive bound (Oppenheim and Magnasco, 2013).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Uncertainty_principle#Signal_processing' },
      viz(v) {
        const M = v.M, NG = 4096, SCALE = [0, 2, 4, 5, 7];
        const shS = v.select('envelope', [{ value: 'gauss', label: 'Gaussian' }, { value: 'hann', label: 'raised cosine' }, { value: 'glide', label: 'glide' }, { value: 'two', label: 'two notes' }], 'gauss');
        const dS = v.slider('note length $\\Delta t$', 0.0008, 0.2, 0.02, { log: true, fmt: (x) => (x < 0.01 ? v.fix(x * 1000, 1) : v.fix(x * 1000, 0)) + ' ms' });
        const fS = v.slider('pitch', 110, 1760, 440, { log: true, fmt: (x) => `${v.fix(x, 0)} Hz (${noteOf(M, x)})` });
        // σ of cos⁴ on [−1/2, 1/2] (the energy of a unit-length raised-cosine window)
        const HC = (() => { let s0 = 0, s2 = 0; for (let i = 0; i < 4000; i++) { const t = (i + 0.5) / 4000 - 0.5, w = Math.cos(Math.PI * t) ** 4; s0 += w; s2 += t * t * w; } return Math.sqrt(s2 / s0); })();
        /** complex envelope of one note at time t (s) with width parameter st, centre 0 */
        const env = (sh, st, f0) => {
          if (sh === 'gauss') return (t) => [Math.exp(-(t * t) / (4 * st * st)), 0];
          if (sh === 'hann') { const L = st / HC; return (t) => [Math.abs(t) < L / 2 ? Math.cos((Math.PI * t) / L) ** 2 : 0, 0]; }
          if (sh === 'glide') { const k = (f0 * (2 ** (1 / 12) - 1)) / (4 * st); return (t) => { const a = Math.exp(-(t * t) / (4 * st * st)), p = Math.PI * k * t * t; return [a * Math.cos(p), a * Math.sin(p)]; }; }
          const d = 2.5 * st; return (t) => [Math.exp(-((t - d) ** 2) / (4 * st * st)) + Math.exp(-((t + d) ** 2) / (4 * st * st)), 0];
        };
        const span = (sh, st) => (sh === 'two' ? 11 : sh === 'hann' ? 0.5 / HC + 0.5 : 8) * st;
        let key = '', D = null;
        const analyse = () => {
          const k = [shS.value, dS.value, fS.value].join(); if (k === key) return D; key = k;
          const sh = shS.value, st = dS.value, f0 = fS.value, e = env(sh, st, f0), L = span(sh, st) * 2, dt = (2 * L) / NG;
          const re = new Float64Array(NG), im = new Float64Array(NG);
          for (let i = 0; i < NG; i++) { const [a, b] = e(-L + i * dt); re[i] = a; im[i] = b; }
          let w0 = 0, w1 = 0, w2 = 0; for (let i = 0; i < NG; i++) { const p = re[i] * re[i] + im[i] * im[i], t = -L + i * dt; w0 += p; w1 += p * t; w2 += p * t * t; }
          const sT = Math.sqrt(Math.max(0, w2 / w0 - (w1 / w0) ** 2));
          const R = Float64Array.from(re), I = Float64Array.from(im); M.fft(R, I);
          const spec = []; let q0 = 0, q1 = 0, q2 = 0;
          for (let j = 0; j < NG; j++) { const kk = j < NG / 2 ? j : j - NG, f = kk / (NG * dt), p = R[j] * R[j] + I[j] * I[j]; q0 += p; q1 += p * f; q2 += p * f * f; spec.push([f, p]); }
          spec.sort((a, b) => a[0] - b[0]);
          const mF = q1 / q0, sF = Math.sqrt(Math.max(0, q2 / q0 - mF * mF));
          let pm = 0; for (const [, p] of spec) pm = Math.max(pm, p);
          D = { sT, sF, mF, spec: spec.map(([f, p]) => [f, p / pm]), e, L };
          return D;
        };
        // spectrogram of the five-note figure, computed on the complex baseband signal around the middle of the figure
        let gkey = '', G = null;
        const figure = () => {
          const k = [shS.value, dS.value, fS.value].join(); if (k === gkey) return G; gkey = k;
          const sh = shS.value, st = dS.value, f0 = fS.value, e = env(sh, st, f0), Dn = (sh === 'two' ? 9 : 6) * st, T = 5 * Dn, n = 8192, fs = n / T;
          const fc = f0 * 2 ** (3.5 / 12), re = new Float64Array(n), im = new Float64Array(n);
          SCALE.forEach((s, j) => {
            const fk = f0 * 2 ** (s / 12), tk = (j + 0.5) * Dn;
            for (let i = 0; i < n; i++) { const t = i / fs - tk; if (Math.abs(t) > span(sh, st) * 1.2) continue; const [a, b] = e(t), ph = TAU * (fk - fc) * t; re[i] += a * Math.cos(ph) - b * Math.sin(ph); im[i] += a * Math.sin(ph) + b * Math.cos(ph); }
          });
          const sw = st * fs, win = Math.max(16, Math.round(8 * sw)); let nfft = 64; while (nfft < 2 * win) nfft *= 2;
          const w = new Float64Array(win); for (let j = 0; j < win; j++) { const u = j - (win - 1) / 2; w[j] = Math.exp(-(u * u) / (4 * sw * sw)); }
          const NT = 150, rows = [], R = new Float64Array(nfft), I = new Float64Array(nfft); let mx = -1e9;
          for (let fI = 0; fI < NT; fI++) {
            R.fill(0); I.fill(0); const c = Math.round(((fI + 0.5) / NT) * n) - (win >> 1);
            for (let j = 0; j < win; j++) { const kk = c + j; if (kk >= 0 && kk < n) { R[j] = re[kk] * w[j]; I[j] = im[kk] * w[j]; } }
            M.fft(R, I);
            const row = new Float32Array(nfft); for (let b = 0; b < nfft; b++) { row[b] = 10 * Math.log10(R[b] * R[b] + I[b] * I[b] + 1e-20); if (row[b] > mx) mx = row[b]; }
            rows.push(row);
          }
          G = { rows, nfft, fs, fc, T, NT, mx, Dn };
          return G;
        };
        const ts = v.stage({ x: [-0.1, 0.1], y: [-1.15, 1.15], height: 200, axes: 'box', xlabel: 'time (ms)', yticks: [], weight: 1, title: 'one note' });
        const fsP = v.stage({ x: [400, 480], y: [0, 1.12], height: 200, axes: 'box', xlabel: 'frequency (Hz)', yticks: [[0.5, '½'], [1, '1']], weight: 1, title: 'its power spectrum' });
        const sg = v.stage({ x: [0, 1], y: [380, 800], height: 255, axes: 'box', xlabel: 'time (ms)', ylabel: 'Hz', weight: 1.25, title: 'spectrogram of C–D–E–F–G' });
        const pl = v.stage({ x: [0.3, 600], y: [0.05, 600], xlog: true, ylog: true, height: 255, axes: 'box', xlabel: 'Δt (ms)', ylabel: 'Δf (Hz)', weight: 0.9, minWidth: 240, title: 'the $(\\Delta t,\\Delta f)$ plane' });
        const ph = playhead(v);
        const noteBuf = (sh, st, f0, fk, sr = SR) => { const e = env(sh, st, f0), L = Math.min(span(sh, st), 1.2), n = Math.round(2 * L * sr), out = new Float32Array(n); for (let i = 0; i < n; i++) { const t = i / sr - L, [a, b] = e(t), p = TAU * fk * (i / sr); out[i] = a * Math.cos(p) - b * Math.sin(p); } return out; };
        const figBuf = (st) => { const sh = shS.value, f0 = fS.value, Dn = (sh === 'two' ? 9 : 6) * st, n = Math.round((5 * Dn + 2 * Math.min(span(sh, st), 1.2)) * SR), out = new Float32Array(n);
          SCALE.forEach((s, j) => { const b = noteBuf(sh, st, f0, f0 * 2 ** (s / 12)), o = Math.round(j * Dn * SR); for (let i = 0; i < b.length && o + i < n; i++) out[o + i] += b[i]; }); return finish(out, 0.8, SR, 0.0005, 0.005); };
        v.soundButton('Play the note', (snd) => { snd.samples(finish(noteBuf(shS.value, dS.value, fS.value, fS.value), 0.8, SR, 0.0005, 0.005), SR, { gain: 0.8 }); ph.start(2 * Math.min(span(shS.value, dS.value), 1.2) + 0.1); });
        v.soundButton('Play the figure', (snd) => { snd.samples(figBuf(dS.value), SR, { gain: 0.8 }); ph.start(5 * 6 * dS.value + 0.2); });
        v.soundButton('long → short', (snd) => { snd.samples(join([0.06, 0.02, 0.006, 0.002].map((st) => figBuf(st)), 0.35), SR, { gain: 0.8 }); ph.start(3); });
        const ms = (x) => x * 1000;
        v.render(() => {
          const d = analyse(), g = figure(), st = dS.value, f0 = fS.value, sh = shS.value;
          // ---- one note
          const L = span(sh, st);
          ts.setView([-ms(L), ms(L)], [-1.15, 1.15]);
          ts.vband(-ms(d.sT), ms(d.sT), { color: 'accent', alpha: 0.1, edges: true });
          const cyc = f0 * 2 * L, nn = Math.min(4000, Math.max(400, Math.round(cyc * 24)));
          ts.fn((x) => { const t = x / 1000, [a, b] = d.e(t), p = TAU * f0 * t; return a * Math.cos(p) - b * Math.sin(p); }, { domain: [-ms(L), ms(L)], n: nn, color: 'ink', width: cyc > 300 ? 0.6 : 1.3, alpha: cyc > 300 ? 0.55 : 1 });
          ts.fn((x) => Math.hypot(...d.e(x / 1000)), { domain: [-ms(L), ms(L)], n: 400, color: 'gold', width: 2 });
          ts.fn((x) => -Math.hypot(...d.e(x / 1000)), { domain: [-ms(L), ms(L)], n: 400, color: 'gold', width: 2 });
          ts.corner(`±Δt = ±${v.fix(ms(d.sT), ms(d.sT) < 10 ? 2 : 1)} ms`, 'tl', { color: 'accent', weight: 600 });
          ts.corner(`${v.fix(cyc / 2, 0)} cycles in view`, 'tr', { color: 'muted', size: 11 });
          // ---- spectrum around f0 with the keyboard
          const W = Math.max(5 * d.sF, f0 * 0.03), a = f0 + d.mF - W, b = f0 + d.mF + W;
          fsP.setView([a, b], [0, 1.12]);
          for (let m = Math.ceil(M.freqToMidi(Math.max(20, a))); m <= M.freqToMidi(b); m++) { const fk = M.midiToFreq(m); fsP.line(fk, 0, fk, 0.06, { color: 'muted', width: 1.4 }); if ((b - a) / (fsP.width || 300) * 40 < fk * 0.06) fsP.text(M.noteName(m), fk, 0.1, { align: 'center', color: 'muted', size: 9.5 }); }
          fsP.vband(f0 + d.mF - d.sF, f0 + d.mF + d.sF, { color: 'accent', alpha: 0.1, edges: true });
          fsP.path(d.spec.filter(([f]) => f0 + f >= a && f0 + f <= b).map(([f, p]) => [f0 + f, p]), { color: 'accent', width: 2.2 });
          fsP.corner(`±Δf = ±${v.fix(d.sF, d.sF < 10 ? 2 : 1)} Hz`, 'tl', { color: 'accent', weight: 600 });
          const semis = (2 * d.sF) / (f0 * (2 ** (1 / 12) - 1));
          fsP.corner(`2Δf spans ${v.fix(semis, semis < 1 ? 2 : 1)} semitone${Math.abs(semis - 1) < 0.005 ? '' : 's'}`, 'tr', { color: semis > 1 ? 'red' : 'muted', size: 11, weight: semis > 1 ? 600 : 500 });
          // ---- spectrogram (baseband rows → absolute frequency)
          const fLo = f0 * 2 ** (-2 / 12), fHi = f0 * 2 ** (9 / 12);
          sg.setView([0, ms(g.T)], [fLo, fHi]);
          const Rp = specRamp(v), lo = g.mx - 40;
          sg.raster((x, y) => {
            const fi = (x / ms(g.T)) * g.NT - 0.5, nu = y - g.fc, bi = (nu / g.fs) * g.nfft;
            const i0 = Math.max(0, Math.min(g.NT - 1, Math.round(fi))), bb = Math.round(bi), b0 = ((bb % g.nfft) + g.nfft) % g.nfft;
            const dd = g.rows[i0][b0]; return Rp.col(Math.min(1, Math.max(0, (dd - lo) / 40)));
          }, { key: `${gkey}|${Rp.key}`, res: 2 });
          sg.axes();
          SCALE.forEach((s) => { const fk = f0 * 2 ** (s / 12); sg.line(0, fk, ms(g.T) * 0.03, fk, { color: 'gold', width: 2 }); sg.line(ms(g.T) * 0.97, fk, ms(g.T), fk, { color: 'gold', width: 2 }); });
          sg.corner(`analysis window matched: σ = ${v.fix(ms(st), st < 0.01 ? 1 : 0)} ms`, 'tl', { color: 'ink', size: 11, plate: true });
          // ---- the (Δt, Δf) plane
          const bound = (x) => 1 / (4 * Math.PI * (x / 1000));
          pl.poly([[0.3, 0.05], [0.3, bound(0.3)], ...M.range(41).map((i) => { const x = 0.3 * (600 / 0.3) ** (i / 40); return [x, bound(x)]; }), [600, 0.05]], { fill: 'red', fillAlpha: 0.14, stroke: false });
          pl.fn(bound, { domain: [0.3, 600], color: 'red', width: 1.8 });
          pl.text('forbidden: Δt·Δf < 1/4π', 1.2, 0.12, { color: 'red', size: 11, align: 'left' });
          const half = (f0 * (2 ** (1 / 12) - 1)) / 2;
          pl.hline(half, { color: 'gold', width: 1.3, dash: [5, 4] });
          pl.text('Δf = ½ semitone', 590, half * 1.25, { color: 'gold', size: 10.5, align: 'right', baseline: 'bottom' });
          pl.dot(ms(d.sT), d.sF, { r: 6, color: 'accent', label: sh === 'gauss' ? 'Gaussian' : sh === 'hann' ? 'raised cosine' : sh === 'glide' ? 'glide' : 'two notes', labelPos: 'ne' });
          if (ph.t != null) sg.corner('♪', 'tr', { color: 'gold', weight: 700 });
        });
        v.legend([['gold', 'envelope / note pitches'], ['accent', '±Δt, ±Δf'], ['red', 'the Gabor bound']]);
        v.readout(() => {
          const d = analyse(), f0 = fS.value, prod = d.sT * d.sF, half = (f0 * (2 ** (1 / 12) - 1)) / 2, tmin = 1 / (4 * Math.PI * half);
          return `measured on the computed note: Δt = ${v.fix(ms(d.sT), 3)} ms, Δf = ${v.fix(d.sF, 3)} Hz · Δt·Δf = ${v.fix(prod, 5)}, the bound $1/4\\pi$ = ${v.fix(1 / (4 * Math.PI), 5)}, ratio ${v.fix(prod * 4 * Math.PI, 4)}${shS.value === 'gauss' ? ' (equality: a Gaussian)' : ''} · in pitch: ±Δf is ±${v.fix(1200 * Math.log2((f0 + d.sF) / f0), 1)} ¢ at ${v.fix(f0, 0)} Hz · to pin the pitch within half a semitone a note must last Δt ≥ ${v.fix(ms(tmin), 1)} ms here`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.8
    {
      num: '4.8',
      kind: 'Phenomenon',
      name: 'Attack transients and the envelope',
      statement: String.raw`The first tens of milliseconds of a note, the **attack transient**, carry much of an instrument's identity. During the attack the spectrum is not yet the steady one: in brass the upper harmonics build up later than the lower ones; a bowed string scratches and its harmonics grow irregularly; a flute speaks with a breathy chiff; a hammered string starts with a broadband thump and every partial then decays at its own rate. The **envelope**, the overall course of the level over time (often idealised as attack–decay–sustain–release), is part of timbre too. When the attack is cut off, listeners confuse instruments far more often (Saldanha and Corso, 1964), and a piano note played backwards no longer sounds like a piano.`,
      idea: String.raw`An instrument is a resonator driven by an exciter. Before the steady oscillation is established, the resonator rings at its own natural frequencies and the exciter's nonlinearity has not yet locked the partials together, so the onset is shaped by the physics of the instrument rather than by the note. A struck or plucked string has no steady state at all: its partials start together and die away separately (2.13), and the shorter lifetimes of the upper partials are the darkening you hear. Because the ear analyses sound in short windows (4.6), the order in which the partials arrive is itself audible. That is what Risset and Mathews found when they resynthesised trumpet tones in 1969: without the staggered entry of the harmonics the tones stopped sounding like trumpets.`,
      caption: String.raw`The four instrument models are illustrative syntheses: their steady spectra are the measured SHARC E4 spectra (the piano's is modelled), and their attacks follow the published descriptions. Choose whose **attack and envelope** and whose **steady spectrum** to combine; matching choices give the instrument itself. Top left: the waveform, with the attack time (10% → 90% of the peak level) bracketed. Top right: the first six harmonics, measured from the synthesized sound by heterodyne analysis; watch the trumpet's upper harmonics arrive late. Bottom: the spectrogram. **Cut** the first milliseconds (red) or **reverse** the note and listen. Then test yourself: *Mystery note* plays a random instrument with its first 80 ms removed. Guess with the buttons and keep score in the readout.`,
      deps: ['music-4.1'],
      see: ['music-2.13', 'music-4.13', 'music-4.15', 'ling-1.5'],
      refs: ['Benson ch. 8', 'Loy I ch. 6'],
      tags: ['envelope', 'timbre'],
      credit: 'Saldanha & Corso, 1964; Risset & Mathews, 1969; Grey, 1977',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Envelope_(music)' },
      viz(v) {
        const M = v.M, F0 = sharc('trumpet', 'E4').f, DUR = 1.35, KIN = ['piano', 'trumpet', 'violin', 'flute'];
        const pianoSpec = { amp: M.range(24, 1).map((n) => Math.abs(Math.sin(n * Math.PI * 0.12)) / n ** 1.05), ph: M.range(24).map(() => 0), ratio: (n) => n * Math.sqrt(1 + 3e-4 * n * n) };
        const steady = (k) => { if (k === 'piano') return pianoSpec; const S = sharc(k, 'E4'); return { amp: S.amp.slice(0, 24), ph: S.ph.slice(0, 24), ratio: (n) => n }; };
        const ss = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
        // envelope models: per-harmonic gain g(n, t), pitch multiplier m(t), noise {amp(t), lo, hi}
        const MODEL = {
          piano: { g: (n, t) => Math.min(1, t / 0.002) * Math.exp(-(0.9 + 0.0035 * n * F0) * t) * (t > 1.15 ? Math.exp(-(t - 1.15) * 25) : 1), m: () => 1, noise: (t) => 0.5 * Math.exp(-t / 0.012), lo: 60, hi: 1200 },
          trumpet: { g: (n, t) => ss((t - 0.006 * (n - 1)) / (0.028 + 0.006 * n)) * (t > 1.1 ? Math.exp(-(t - 1.1) * 18) : 1), m: (t) => 1 - 0.018 * Math.exp(-t / 0.025), noise: (t) => 0.03 * Math.exp(-t / 0.02), lo: 800, hi: 5000 },
          violin: { g: (n, t) => ss(t / (0.07 + 0.008 * n)) * (1 + 0.25 * Math.sin(TAU * (17 + 3 * n) * t) * Math.exp(-t / 0.05)) * (t > 1.1 ? Math.exp(-(t - 1.1) * 12) : 1), m: (t) => 1 + 0.0035 * Math.sin(TAU * 5.6 * t) * ss((t - 0.25) / 0.25), noise: (t) => 0.22 * Math.exp(-t / 0.06) + 0.012, lo: 1500, hi: 7000 },
          flute: { g: (n, t) => ss((t - 0.012 * Math.min(n - 1, 3)) / 0.075) * (1 + 0.06 * Math.sin(TAU * 4.8 * t) * ss((t - 0.3) / 0.3)) * (t > 1.1 ? Math.exp(-(t - 1.1) * 14) : 1), m: (t) => 1 - 0.006 * Math.exp(-t / 0.04), noise: (t) => 0.3 * Math.exp(-t / 0.035) + 0.02, lo: 1200, hi: 9000 },
        };
        /** one note at SR: steady spectrum of kS, attack/envelope of kA */
        const render = (kA, kS) => {
          const S = steady(kS), E = MODEL[kA], n = Math.round(DUR * SR), out = new Float32Array(n), rnd = noiseGen(29);
          const mt = new Float32Array(n); for (let i = 0; i < n; i++) mt[i] = E.m(i / SR);
          const mx = Math.max(...S.amp);
          for (let h = 1; h <= S.amp.length; h++) {
            const a = S.amp[h - 1] / mx, f = F0 * S.ratio(h); if (a < 3e-4 || f > 0.45 * SR) continue;
            let p = S.ph[h - 1] || 0, g0 = E.g(h, 0), g1 = E.g(h, 32 / SR);
            for (let i = 0; i < n; i++) { const j = i % 32; if (j === 0 && i) { g0 = g1; g1 = E.g(h, (i + 32) / SR); } out[i] += a * (g0 + ((g1 - g0) * j) / 32) * Math.cos(p); p += (TAU * f * mt[i]) / SR; }
          }
          // band-limited noise (two one-pole filters: high-pass at lo, low-pass at hi)
          const al = Math.exp((-TAU * E.hi) / SR), ah = Math.exp((-TAU * E.lo) / SR); let l1 = 0, hp = 0, prev = 0;
          for (let i = 0; i < n; i++) { const w = rnd(); l1 = (1 - al) * w + al * l1; hp = ah * (hp + l1 - prev); prev = l1; out[i] += 1.6 * E.noise(i / SR) * hp * (i / SR > 1.15 ? Math.exp(-(i / SR - 1.15) * 20) : 1); }
          return finish(out, 0.8, SR, 0.0005, 0.03);
        };
        const aS = v.select('attack and envelope of', KIN, 'trumpet');
        const sS = v.select('steady spectrum of', KIN, 'trumpet');
        const cS = v.slider('cut the first', 0, 200, 0, { step: 1, fmt: (x) => (x ? v.fix(x, 0) + ' ms' : 'nothing') });
        const rev = v.toggle('play reversed', false);
        let key = '', D = null;
        const note = () => {
          const k = aS.value + '|' + sS.value; if (k === key) return D; key = k;
          const buf = render(aS.value, sS.value), S = stft(M, buf, SR, { win: 0.012, hop: 0.004, fmax: 6000 });
          // heterodyne analysis of harmonics 1–6: amplitude in a 10 ms Hann window every 4 ms over the first 0.3 s
          const W = Math.round(0.01 * SR), hw = M.range(W).map((j) => 0.5 - 0.5 * Math.cos((TAU * (j + 0.5)) / W)), tracks = [];
          const ratio = steady(sS.value).ratio;
          for (let h = 1; h <= 6; h++) { const tr = [], w = (TAU * F0 * ratio(h)) / SR; for (let t = 0; t <= 0.3; t += 0.004) { const c = Math.round(t * SR) - (W >> 1); let re = 0, im = 0; for (let j = 0; j < W; j++) { const x = buf[c + j] || 0; re += x * hw[j] * Math.cos(w * (c + j)); im -= x * hw[j] * Math.sin(w * (c + j)); } tr.push([t, (4 * Math.hypot(re, im)) / W]); } tracks.push(tr); }
          // RMS envelope (5 ms frames) and the attack time 10 % → 90 % of its peak
          const fr = Math.round(0.005 * SR), envl = []; for (let i = 0; i + fr <= buf.length; i += fr) { let s = 0; for (let j = 0; j < fr; j++) s += buf[i + j] ** 2; envl.push([(i + fr / 2) / SR, Math.sqrt(s / fr)]); }
          const pk = Math.max(...envl.map((e) => e[1])), t10 = envl.find((e) => e[1] >= 0.1 * pk)[0], t90 = envl.find((e) => e[1] >= 0.9 * pk)[0];
          // spectral centroid of the first 50 ms vs 0.4–0.8 s
          const cen = (a, b) => { let s = 0, w = 0; for (let f = Math.floor(a / S.dt); f <= Math.min(S.nT - 1, Math.floor(b / S.dt)); f++) for (let bb = 1; bb < S.nb; bb++) { const p = 10 ** (S.db[f * S.nb + bb] / 10); s += bb * S.df * p; w += p; } return s / w; };
          D = { buf, S, tracks, envl, t10, t90, c50: cen(0, 0.05), cSt: cen(0.4, 0.8) };
          return D;
        };
        const playable = (buf, cut, reverse) => {
          const k = Math.round((cut / 1000) * SR); let b = Float32Array.from(buf.subarray(k));
          const f = Math.round(0.005 * SR); if (k) for (let i = 0; i < Math.min(f, b.length); i++) b[i] *= i / f;
          if (reverse) b.reverse();
          return b;
        };
        const ph = playhead(v);
        let mystery = null, score = [0, 0], lastGuess = '';
        v.soundButton('Listen', (snd) => { snd.samples(playable(note().buf, cS.value, rev.value), SR, { gain: 0.8 }); ph.start(DUR - cS.value / 1000); });
        v.soundButton('all four', (snd) => { snd.samples(join(KIN.map((k) => playable(render(k, k), cS.value, rev.value)), 0.25), SR, { gain: 0.8 }); });
        v.soundButton('Mystery note (attack cut)', (snd) => { const k = KIN[Math.floor(Math.random() * 4)]; mystery = k; lastGuess = ''; snd.samples(playable(render(k, k), 80, false), SR, { gain: 0.8 }); v.invalidate(); });
        KIN.forEach((k) => v.button(`${k}?`, () => { if (!mystery) { lastGuess = 'press Mystery note first'; return; } const ok = k === mystery; score = [score[0] + (ok ? 1 : 0), score[1] + 1]; lastGuess = ok ? `yes, it was the ${mystery}` : `no, it was the ${mystery}`; mystery = null; }));
        const wv = v.stage({ x: [0, DUR], y: [-1.05, 1.05], height: 205, axes: 'box', xlabel: 'time (s)', yticks: [], weight: 1, title: 'waveform' });
        const hs = v.stage({ x: [0, 300], y: [-50, 3], height: 205, axes: 'box', xlabel: 'time (ms)', yticks: [[0, '0 dB'], [-20, '−20'], [-40, '−40']], weight: 1, title: 'harmonics 1–6 during the attack' });
        const sg = v.stage({ x: [0, DUR], y: [0, 6000], height: 215, axes: 'box', xlabel: 'time (s)', ylabel: 'Hz', full: true, title: 'spectrogram' });
        const HC = ['accent', 'orange', 'green', 'purple', 'teal', 'pink'];
        v.render(() => {
          const d = note(), cut = cS.value / 1000;
          // ---- waveform
          const E = envelopeOf(d.buf, SR, 0, DUR, 500);
          wv.poly([...E.hi, ...E.lo.slice().reverse()], { fill: 'accent', fillAlpha: 0.5, color: 'accent', width: 0.7 });
          if (cut) wv.vband(0, cut, { color: 'red', alpha: 0.16, edges: true });
          wv.measure(d.t10, 0.93, d.t90, 0.93, '');
          wv.text(`attack ${v.fix((d.t90 - d.t10) * 1000, 0)} ms`, d.t90 + 0.02, 0.93, { align: 'left', color: 'ink', size: 11.5, weight: 600 });
          if (rev.value) wv.corner('played backwards', 'br', { color: 'red', weight: 600 });
          // ---- harmonic tracks
          let tm = 1e-9; for (const tr of d.tracks) for (const [, a] of tr) tm = Math.max(tm, a);
          if (cut) hs.vband(0, Math.min(300, cut * 1000), { color: 'red', alpha: 0.14 });
          d.tracks.forEach((tr, i) => hs.path(tr.map(([t, a]) => [t * 1000, Math.max(-50, dB(a / tm))]), { color: HC[i], width: 2 }));
          d.tracks.forEach((tr, i) => { const end = tr[tr.length - 1]; hs.text(String(i + 1), 296, Math.max(-48, dB(end[1] / tm)), { align: 'right', color: HC[i], size: 11, weight: 700 }); });
          // ---- spectrogram
          drawSpec(v, sg, d.S, { range: 70, key });
          sg.axes();
          if (cut) sg.vband(0, cut, { color: 'red', alpha: 0.2, edges: true });
          if (ph.t != null && !rev.value) sg.vline(cut + ph.t, { color: 'gold', width: 2 });
        });
        v.legend(HC.map((c, i) => [c, `harmonic ${i + 1}`]));
        v.readout(() => {
          const d = note(), same = aS.value === sS.value;
          const who = same ? `the ${aS.value} model` : `the ${aS.value}'s attack on the ${sS.value}'s steady spectrum`;
          return `${who}: attack (10 → 90% of peak level) ${v.fix((d.t90 - d.t10) * 1000, 0)} ms · spectral centroid ${v.fix(d.c50, 0)} Hz in the first 50 ms against ${v.fix(d.cSt, 0)} Hz in the steady part · ${cS.value ? `first ${cS.value} ms cut` : 'nothing cut'}${rev.value ? ', played backwards' : ''} · blind test: ${score[0]} of ${score[1]} right${lastGuess ? ` (${lastGuess})` : mystery ? ' (a mystery note is waiting for your guess)' : ''}`;
        });
      },
    },
  ],
};
