// Music Theory & Acoustics — Chapter 5: Hearing (part b: items 5.9–5.15)
import { TAU, SR, noteOf, dB, playhead, finish, toRms, join, partials, loopVoice, erb, erbNumber, erbNumberInv, gammatone, stereo, fTicks, tones } from './ch05.shared.js';

/** Frequency difference limen (Hz) at d′ = 1: Micheyl, Xiao & Oxenham (2012), Model A, ML estimates (f Hz, duration ms, sensation level dB). */
const dlfD1 = (f, d = 300, sl = 40) => 10 ** (0.38 * (f / 1000) ** 0.82 + 0.33 * (d / 100) ** -0.48 + 0.36 * (sl / 10) ** -1.16 - 0.29);
/** The same at the 70.7% point a 2-down-1-up staircase tracks (d′ = 0.77, assuming d′ grows in proportion to Δf). */
const dlf707 = (f, d, sl) => 0.77 * dlfD1(f, d, sl);
const centsOf = (f, df) => 1200 * Math.log2(1 + df / f);
/** Standard normal CDF. */
const Phi = (x) => 0.5 * (1 + Math.sign(x) * Math.sqrt(1 - Math.exp((-2 * x * x) / Math.PI))); // Pólya's approximation, |error| < 0.003

const NOTE = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];

/** A plain harmonic tone (1/k amplitudes, six harmonics) with a short attack and decay, for note demonstrations. */
const pluck = (f, dur = 0.5) => partials([1, 2, 3, 4, 5, 6].map((k) => ({ f: k * f, a: 1 / k, d: 2 + k })), dur, { att: 0.01, rel: 0.08 });

/**
 * Pressure on a rigid sphere (relative to the free field at its centre) for a distant source at angle th from the measurement
 * point, at μ = ka (Rayleigh 1904; series as in Duda & Martens 1998). Returns [re, im] in the e^{+iωt} convention (conjugated).
 */
function spherePressure(mu, th) {
  if (mu < 1e-4) return [1, 0];
  const c = Math.cos(th), N = Math.ceil(mu + 18), cs = Math.cos(mu), sn = Math.sin(mu);
  // spherical Hankel functions h_m = j_m + i y_m by upward recurrence (stable: y_m dominates for m > μ)
  const hr = new Float64Array(N + 2), hi = new Float64Array(N + 2);
  hr[0] = sn / mu; hi[0] = -cs / mu; // h0 = −i e^{iμ}/μ
  hr[1] = (-cs * mu + sn) / (mu * mu); hi[1] = (-sn * mu - cs) / (mu * mu); // h1 = −e^{iμ}(μ + i)/μ²
  for (let m = 1; m <= N; m++) { hr[m + 1] = ((2 * m + 1) / mu) * hr[m] - hr[m - 1]; hi[m + 1] = ((2 * m + 1) / mu) * hi[m] - hi[m - 1]; }
  let P0 = 1, P1 = c, sr = 0, si = 0, pr = 0, pi = 1; // (−i)^{m−1} starts at i for m = 0
  for (let m = 0; m <= N; m++) {
    const dr = m === 0 ? -hr[1] : hr[m - 1] - ((m + 1) / mu) * hr[m], di = m === 0 ? -hi[1] : hi[m - 1] - ((m + 1) / mu) * hi[m]; // h_m'
    const Pm = m === 0 ? 1 : P1, d2 = dr * dr + di * di;
    sr += ((2 * m + 1) * Pm * (pr * dr + pi * di)) / d2; si += ((2 * m + 1) * Pm * (pi * dr - pr * di)) / d2;
    if (m >= 1) { const P2 = ((2 * m + 1) * c * P1 - m * P0) / (m + 1); P0 = P1; P1 = P2; }
    const t = pr; pr = pi; pi = -t; // × (−i)
  }
  return [sr / (mu * mu), -si / (mu * mu)];
}

export default {
  collection: 'music',
  chapter: 5,
  items: [
    // ------------------------------------------------------------------ 5.9
    {
      num: '5.9',
      kind: 'Phenomenon',
      name: 'Pitch discrimination and the JND',
      statement: String.raw`The **just-noticeable difference** (JND), or difference limen, for frequency is the smallest change $\Delta f$ a listener can reliably detect, conventionally the change judged correctly on about 71% or 76% of trials in a two-interval task ("which tone was higher?"). For pure tones of moderate level and a few hundred milliseconds' duration it is remarkably small: about 2–3 Hz at 1 kHz, a Weber fraction $\Delta f/f\approx0.2$–$0.3\%$, or 3–5 cents, much finer than a semitone (100 cents). In cents it is roughly constant from about 500 Hz to 2 kHz, larger at low frequencies, and grows steeply above about 4–5 kHz. It also shrinks with level and with duration. Pooling 583 measurements from 12 studies, Micheyl, Xiao and Oxenham (2012) fitted
$$\log_{10}\mathrm{DLF}=0.38\Big(\frac{f}{\text{kHz}}\Big)^{0.82}+0.33\Big(\frac{d}{100\,\text{ms}}\Big)^{-0.48}+0.36\Big(\frac{L}{10\,\text{dB SL}}\Big)^{-1.16}-0.29$$
for the limen in Hz at $d'=1$, with $d$ the duration and $L$ the sensation level.`,
      idea: String.raw`If pitch were read only from the place of the excitation peak (5.2), the JND would track the slope of the excitation pattern and be roughly a constant fraction of the ERB, about 10 times larger than observed. The fine resolution below 4 kHz is usually credited to timing: auditory nerve fibres fire in phase with the waveform, and the brain can compare the spacing of spikes with great precision. Phase locking weakens above a few kilohertz, which would explain the steep rise in the JND there, and why melodies lose definite pitch above about 5 kHz (5.14). Cents (1.6) make the comparison musical: a JND of 4 cents means the ear can tell apart tunings that differ by much less than the 14-cent gap between a just and an equal-tempered major third.`,
      caption: String.raw`A listening test. Press **Play pair**: two tones, one higher by the current $\Delta$; answer which. The staircase halves its error rate by stepping down after two correct answers and up after one wrong one (2-down-1-up), so it settles where you are right 70.7% of the time. Left: your track, with reversals ringed. Right: the JND across frequency in cents, the Micheyl–Xiao–Oxenham fit at your chosen level (blue band: 20–60 dB SL), with your estimates in gold. A simulated listener's run at 1 kHz is shown to start with; *simulate* repeats it at the current frequency.`,
      deps: ['music-1.6'],
      see: ['music-5.14', 'music-1.5', 'music-3.10', 'music-5.2'],
      refs: ['Loy I ch. 6'],
      tags: ['pitch', 'perception'],
      credit: 'E. H. Weber, 1834 (Weber fraction); Shower & Biddulph, 1931; Wier, Jesteadt & Green, 1977; Micheyl, Xiao & Oxenham, 2012 (meta-analysis)',
      scope: String.raw`Pure tones, two-interval forced choice, trained listeners in quiet. The curve is the fitted model of Micheyl, Xiao & Oxenham (2012) for 300 ms tones, converted from $d'=1$ to the 70.7% point by assuming $d'\propto\Delta f$. Your playback level is unknown, so the sensation level is a choice, not a measurement; untrained listeners often have JNDs several times larger at first and improve with practice.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Just-noticeable_difference' },
      viz(v) {
        const M = v.M, DUR = 300;
        const fS = v.select('frequency', [250, 500, 1000, 2000, 4000, 8000].map((f) => ({ value: f, label: f >= 1000 ? `${f / 1000} kHz` : `${f} Hz` })), 1000, { onChange: () => reset(false) });
        const slS = v.select('assumed level', [20, 40, 60].map((x) => ({ value: x, label: `${x} dB SL` })), 40);
        let track = [], cur = 40, streak = 0, dir = 0, pending = null, msg = 'press Play pair', trial = 0, sim = false;
        const results = new Map();
        const reversals = () => track.filter((t) => t.rev);
        const estimate = () => { const r = reversals().slice(-6); return r.length >= 4 ? Math.exp(M.mean(r.map((t) => Math.log(t.d)))) : null; };
        function reset(keepSim) { track = []; cur = 40; streak = 0; dir = 0; pending = null; sim = !!keepSim; msg = 'press Play pair'; v.invalidate(); }
        function answer(correct) {
          const entry = { n: track.length + 1, d: cur, ok: correct, rev: false };
          let nd = dir;
          if (correct) { streak++; if (streak === 2) { streak = 0; nd = -1; } } else { streak = 0; nd = 1; }
          if (nd !== 0 && dir !== 0 && nd !== dir) entry.rev = true;
          if ((correct && streak === 0) || !correct) { cur = M.clamp(nd < 0 ? cur / Math.SQRT2 : cur * Math.SQRT2, 0.2, 300); dir = nd; }
          track.push(entry);
          const e = estimate(); if (e && reversals().length >= 8) results.set(fS.value, { cents: e, sim });
        }
        const simulate = (f, seed) => {
          const r = v.rng(seed), dl = dlfD1(f, DUR, slS.value);
          reset(true); for (let k = 0; k < 50; k++) { const df = f * (2 ** (cur / 1200) - 1), dp = df / dl; answer(r() < Phi(dp / Math.SQRT2)); }
          msg = `simulated listener (model observer, d′ = Δf / DLF): estimate ${v.fix(estimate() ?? cur, 1)} ¢`;
        };
        simulate(1000, 5); results.set(1000, { cents: estimate(), sim: true });
        const pair = () => { const f = fS.value, hi = f * 2 ** (cur / 1200), r = v.rng(1000 + ++trial), first = r() < 0.5; const ramp = (b) => finish(b, 0.5, SR, 0.02, 0.02); return { first, buf: join([ramp(tones([[first ? hi : f, 1]], DUR / 1000)), ramp(tones([[first ? f : hi, 1]], DUR / 1000))], 0.3) }; };
        v.soundButton('Play pair', (snd) => { if (sim) reset(false); pending = pair(); snd.samples(pending.buf, SR, { gain: 0.8, normalize: false }); msg = `Δ = ${v.fix(cur, 1)} ¢: which was higher?`; });
        v.button('1st was higher', () => { if (!pending) return; const ok = pending.first; answer(ok); msg = ok ? 'correct' : 'wrong'; pending = null; });
        v.button('2nd was higher', () => { if (!pending) return; const ok = !pending.first; answer(ok); msg = ok ? 'correct' : 'wrong'; pending = null; });
        v.button('simulate', () => simulate(fS.value, 7 + trial++));
        v.button('reset', () => { results.clear(); reset(false); });
        const st = v.stage({ x: [0, 52], y: [0.3, 300], ylog: true, height: 280, axes: 'box', gutter: true, xlabel: 'trial', ylabel: 'Δ (cents)', weight: 1, title: 'the staircase' });
        const jn = v.stage({ x: [150, 10000], y: [0.3, 300], xlog: true, ylog: true, height: 280, axes: 'box', gutter: true, xticks: fTicks(150, 10000, [200, 500, 1000, 2000, 5000, 10000]), xlabel: 'frequency (Hz)', ylabel: 'JND (cents)', weight: 1, title: 'the JND across frequency' });
        v.render(() => {
          const f = fS.value, sl = slS.value;
          // staircase
          st.hline(100, { color: 'faint', width: 1, dash: [4, 4] }); st.text('a semitone', 1, 100, { align: 'left', color: 'muted', size: 10.5, dy: -8 });
          const ref = centsOf(f, dlf707(f, DUR, sl)); st.hline(ref, { color: 'accent', width: 1.4, dash: [6, 4] }); st.text('model', 51, ref, { align: 'right', color: 'accent', size: 10.5, dy: -8 });
          if (track.length) st.path(track.map((t) => [t.n, t.d]), { color: 'muted', width: 1.2 });
          for (const t of track) { if (t.rev) st.dot(t.n, t.d, { r: 7, hollow: true, color: 'ink' }); st.dot(t.n, t.d, { r: 3.5, color: t.ok ? 'green' : 'red' }); }
          const e = estimate(); if (e) { st.hline(e, { color: 'gold', width: 2 }); st.text(`estimate ${v.fix(e, 1)} ¢`, 1, e, { align: 'left', color: 'gold', size: 11, dy: -9, weight: 600 }); }
          st.dot(track.length + 1, cur, { r: 5, color: 'gold', hollow: true });
          st.corner(sim ? 'simulated listener' : msg, 'tr', { color: sim ? 'muted' : 'ink', plate: true, size: 11.5 });
          // JND curve
          jn.between((x) => centsOf(x, dlf707(x, DUR, 20)), (x) => centsOf(x, dlf707(x, DUR, 60)), 150, 10000, { fill: 'accent', fillAlpha: 0.12 });
          jn.fn((x) => centsOf(x, dlf707(x, DUR, sl)), { color: 'accent', width: 2.4 });
          jn.hline(100, { color: 'faint', width: 1, dash: [4, 4] }); jn.text('semitone', 160, 100, { align: 'left', color: 'muted', size: 10.5, dy: -8 });
          jn.vline(f, { color: 'gold', width: 1, alpha: 0.5 });
          for (const [ff, r] of results) jn.dot(ff, r.cents, { r: 6, color: 'gold', hollow: r.sim, label: r.sim ? 'simulated' : 'you', labelPos: 'e' });
        });
        v.legend([['green', 'correct'], ['red', 'wrong'], ['gold', 'estimate (mean of the last 6 reversals)'], ['accent', 'Micheyl et al. (2012) fit, 70.7% point']]);
        v.readout(() => {
          const f = fS.value, sl = slS.value, dl = dlf707(f, DUR, sl), e = estimate();
          return `${sim ? msg + ' · ' : ''}${f} Hz, 300 ms tones, assumed ${sl} dB SL: model JND ${v.fix(dl, 2)} Hz = ${v.fix(centsOf(f, dl), 1)} ¢ (Weber fraction ${v.fix((100 * dl) / f, 2)}%) · current Δ ${v.fix(cur, 1)} ¢ = ${v.fix(f * (2 ** (cur / 1200) - 1), 2)} Hz · ${track.length} trials, ${reversals().length} reversals${e ? ` · ${sim ? 'simulated' : 'your'} estimate ${v.fix(e, 1)} ¢ = ${v.fix(f * (2 ** (e / 1200) - 1), 2)} Hz` : ' · an estimate appears after 4 reversals'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.10
    {
      num: '5.10',
      kind: 'Concept',
      name: 'Pitch height and chroma: the pitch helix',
      statement: String.raw`Pitch has two dimensions. **Height** rises steadily with frequency, as $\log_2 f$. **Chroma** (pitch class) is circular: it repeats every octave, so that C3, C4 and C5 share a quality that C and F♯ do not. Drawing pitch as a **helix**, with height along the axis and chroma as the angle, one turn per octave, places
$$\big(R\cos 2\pi c,\ R\sin 2\pi c,\ h\big),\qquad h=\log_2(f/f_{\text{ref}}),\ c=h-\lfloor h\rfloor,$$
so that notes an octave apart lie directly above one another. Projecting onto the base circle keeps chroma alone (the twelve pitch classes of music theory); projecting onto the axis keeps height alone (the pitch of a siren or a glide). Arranging chroma by fifths instead of semitones gives the circle of fifths, a second helix that Shepard also proposed.`,
      idea: String.raw`Octave equivalence comes from the harmonic series (2.6): the partials of a tone at $2f$ are a subset of those at $f$, so the two fuse and are confused, more than any other pair of different pitches. Pitch is logarithmic (1.5), so equal musical steps are equal steps up the helix. The helix is a model of similarity, not a law: listeners who are not musically trained judge octaves less consistently than musicians, and the strength of chroma fades above about 4–5 kHz, where melodies lose their definite pitch (5.14). Shepard tones (5.11) are built to have chroma without height, which is why they can climb forever.`,
      caption: String.raw`Drag the 3D view to rotate the helix, which carries the notes C2–C7 (C notes in gold). Click a key on the keyboard to hear the note and light its point; every note with the same chroma lights up on the same vertical line. *Octaves* plays C2 to C6, climbing straight up. Slide **flatten** to squash the helix onto the chroma circle, or **unwind** to collapse it onto the height axis, and switch the turns to the circle of fifths.`,
      deps: ['music-1.5'],
      see: ['music-5.11', 'music-2.6', 'music-1.6', 'music-6.1'],
      refs: ['Loy I ch. 6'],
      tags: ['pitch', 'octave'],
      credit: 'Moritz Drobisch, 1855; Géza Révész, 1913; Roger Shepard, 1964 and 1982',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Pitch_(music)#Pitch_height_and_chroma' },
      viz(v) {
        const M = v.M, LO = 36, HI = 96;
        const flat = v.slider('flatten (height)', 0, 1, 0, { step: 0.01 });
        const unw = v.slider('unwind (chroma)', 0, 1, 0, { step: 0.01 });
        const order = v.select('turns by', [{ value: 1, label: 'semitones' }, { value: 7, label: 'fifths' }], 1);
        let sel = 60;
        const ph = playhead(v);
        const s3 = v.stage3d({ range: 2.05, height: 360, yaw: 0.5, pitch: 0.32, axes: false, labels: null, weight: 1.2, minWidth: 300, title: 'the pitch helix (drag to rotate)' });
        const kb = v.stage({ x: [LO - 0.5, HI + 0.5], y: [0, 1], height: 360, axes: false, weight: 1, minWidth: 260, title: 'C2 to C7 (click a key)' });
        const pos = (m) => {
          const c = M.mod(m * order.value, 12) / 12, R = 1.3 * (1 - unw.value), h = ((m - 66) / 12) * 0.46 * (1 - flat.value);
          return [R * Math.cos(TAU * c - Math.PI / 2), R * Math.sin(TAU * c - Math.PI / 2), h];
        };
        const play = (m) => { sel = m; v.sound().samples(pluck(M.midiToFreq(m), 0.8), SR, { gain: 0.8 }); ph.start(0.8, m); };
        // keyboard laid out vertically: one row per octave (bottom = C2), 12 columns
        const keyAt = (x, y) => { const oct = Math.floor(y * 6.05), col = Math.floor(((x - LO + 0.5) / (HI - LO + 1)) * 12); const m = LO + 12 * oct + col; return m >= LO && m <= HI && oct >= 0 && oct <= 5 ? m : null; };
        kb.onClick((x, y) => { const m = keyAt(x, y); if (m != null) play(m); });
        v.soundButton('Octaves C2 → C6', (snd) => { snd.samples(join([36, 48, 60, 72, 84].map((m) => pluck(M.midiToFreq(m), 0.55)), 0.08), SR, { gain: 0.8 }); ph.start(5 * 0.63, 'oct'); });
        v.soundButton('chromatic C4 → C5', (snd) => { snd.samples(join(M.range(13).map((k) => pluck(M.midiToFreq(60 + k), 0.3)), 0.03), SR, { gain: 0.8 }); ph.start(13 * 0.33, 'chrom'); });
        v.render(() => {
          const t = ph.t, cur = ph.tag === 'oct' && t != null ? 36 + 12 * Math.min(4, Math.floor(t / 0.63)) : ph.tag === 'chrom' && t != null ? 60 + Math.min(12, Math.floor(t / 0.33)) : sel;
          const pc = M.mod(cur, 12);
          // helix
          s3.curve((u) => { const m = LO + u * (HI - LO); return pos(m); }, 0, 1, { n: order.value === 1 ? 600 : 60, color: 'faint', width: 1.2 });
          s3.line([0, 0, pos(LO)[2] - 0.2], [0, 0, pos(HI)[2] + 0.2], { color: 'muted', width: 1, dash: [3, 4] });
          s3.text('height', [0, 0, pos(HI)[2] + 0.38], { color: 'muted', size: 11 });
          for (let m = LO; m <= HI; m++) {
            const p = pos(m), same = M.mod(m, 12) === pc, isC = M.mod(m, 12) === 0;
            s3.dot(p, { r: m === cur ? 7 : same ? 5 : 3, color: m === cur ? 'red' : same ? 'accent' : isC ? 'gold' : 'muted' });
          }
          const ps = M.range(HI - LO + 1, LO).filter((m) => M.mod(m, 12) === pc).map(pos);
          if (ps.length > 1) s3.path(ps, { color: 'accent', width: 2, alpha: 0.7 });
          // chroma circle labels at the base
          for (let k = 0; k < 12; k++) { const p = pos(LO + k); const lab = NOTE[M.mod((LO + k) * order.value, 12)]; s3.text(lab, [p[0] * 1.18 + 0.0001, p[1] * 1.18, pos(LO)[2] - 0.3], { color: M.mod((LO + k) * order.value, 12) === pc ? 'accent' : 'muted', size: 11 }); }
          s3.text(`${M.noteName(cur)}`, [pos(cur)[0] * 1.15, pos(cur)[1] * 1.15, pos(cur)[2] + 0.18], { color: 'red', size: 12.5 });
          // keyboard grid
          for (let oct = 0; oct <= 5; oct++) for (let col = 0; col < 12; col++) {
            const m = LO + 12 * oct + col; if (m > HI) continue;
            const x0 = LO - 0.5 + ((HI - LO + 1) * col) / 12, x1 = LO - 0.5 + ((HI - LO + 1) * (col + 1)) / 12, y0 = oct / 6.05, y1 = (oct + 0.9) / 6.05, black = [1, 3, 6, 8, 10].includes(col);
            kb.rect(x0 + 0.15, y0, x1 - 0.15, y1, { fill: m === cur ? 'red' : col === pc ? 'accent' : black ? 'ink' : 'panel', fillAlpha: m === cur ? 0.5 : col === pc ? 0.35 : black ? 0.75 : 1, color: m === cur ? 'red' : 'muted', width: m === cur ? 2.5 : 1, radius: 3 });
            if (col === 0) kb.text(`C${oct + 2}`, (x0 + x1) / 2, (y0 + y1) / 2, { align: 'center', color: 'ink', size: 10.5, weight: m === cur ? 700 : 400 });
          }
          kb.corner('same chroma = same column', 'tl', { color: 'accent', size: 11, plate: true });
        });
        v.legend([['red', 'the note played'], ['accent', 'same chroma, other octaves'], ['gold', 'the C notes']]);
        v.readout(() => {
          const m = sel, f = M.midiToFreq(m), h = Math.log2(f / M.midiToFreq(LO));
          return `${M.noteName(m)} = ${v.fix(f, 2)} Hz · height $\\log_2(f/f_{\\mathrm{C2}}) = ${v.fix(h, 3)}$ octaves · chroma ${NOTE[M.mod(m, 12)]} (angle ${v.fix(M.mod(m * order.value, 12) * 30, 0)}°) · octave relatives on this helix: ${M.range(HI - LO + 1, LO).filter((k) => M.mod(k - m, 12) === 0).map((k) => M.noteName(k)).join(', ')} · flatten ${v.fix(100 * flat.value, 0)}%: ${flat.value > 0.95 ? 'only chroma is left' : unw.value > 0.95 ? 'only height is left' : 'both dimensions shown'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.11
    {
      num: '5.11',
      kind: 'Paradox',
      name: 'Shepard tones and the Risset glissando',
      statement: String.raw`A **Shepard tone** is a sum of sinusoids spaced exactly an octave apart, $f_k=f_{\min}2^{k+u}$ $(k=0,\dots,K-1)$, whose amplitudes follow a fixed bell-shaped envelope over log frequency, $A(f)=\exp\!\big(-\log_2^2(f/f_c)/2\sigma^2\big)$. Raising $u$ from 0 to 1 moves every partial up an octave, but the envelope fades the top partial out while a new one fades in at the bottom, so the tone at $u=1$ is *identical* to the tone at $u=0$. Stepping $u$ by $\tfrac1{12}$ gives a chromatic scale that seems to rise for ever (Shepard, 1964); gliding $u$ continuously gives Risset's endless glissando. Such tones have chroma but no definite height: two of them a tritone apart are ambiguous (the tritone paradox).`,
      idea: String.raw`It realises the helix of 5.10 with height removed. Each step changes the chroma unambiguously: every partial moves up a semitone, and the nearest-neighbour motion wins. The overall height, which the ear judges largely from where the spectral energy sits, never changes, because the envelope is fixed; formants work the same way (4.9). The construction is periodic in $u$ with period 1, so the pitch must return to its start after an octave of "rising". The illusion depends on the envelope hiding the wrap-around: make it flat (equal amplitudes) and the jump where a partial vanishes at the top and appears at the bottom becomes audible, and the tone simply resets each cycle.`,
      caption: String.raw`Top: the partials (stems) under the fixed envelope (dashed), moving up as the animation plays; partials fade in at the left and out at the right. Bottom left: the chroma pointer goes round and round. Bottom right: the steps climbed keep increasing while the spectral centroid (the height cue) stays put. Play the loop: the scale or glissando seems to rise for ever. Narrow the envelope, widen it, or switch on **flat** and the illusion collapses into an ordinary scale that resets every octave.`,
      deps: ['music-5.10', 'music-4.9'],
      see: ['music-1.5', 'music-4.12', 'music-5.14'],
      refs: ['Benson ch. 4'],
      tags: ['illusion', 'pitch'],
      credit: 'Roger Shepard, 1964; Jean-Claude Risset, 1969; tritone paradox: Diana Deutsch, 1986',
      scope: String.raw`Octave-spaced partials from 20 Hz upward under a Gaussian envelope in log frequency centred near 640 Hz; partials above 18 kHz are dropped. The envelope shape and width are free design choices, not measurements; the illusion is strongest for envelopes about 1–3 octaves wide.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Shepard_tone' },
      viz(v) {
        const M = v.M, K = 10, FMIN = 20, FC = 640, STEP = 0.3, GLIDE = 8;
        const mode = v.select('mode', [{ value: 'scale', label: 'Shepard scale' }, { value: 'gliss', label: 'Risset glissando' }], 'scale', { onChange: () => sync(true) });
        const sgS = v.slider('envelope width σ', 0.4, 4, 1.4, { step: 0.05, fmt: (x) => `${v.fix(x, 2)} octaves`, onChange: () => sync() });
        const flat = v.toggle('flat (no envelope)', false, { onChange: () => sync() });
        const amp = (f) => (f > 18000 ? 0 : flat.value ? 1 : Math.exp(-(Math.log2(f / FC) ** 2) / (2 * sgS.value ** 2)));
        const period = () => (mode.value === 'scale' ? 12 * STEP : GLIDE);
        const uAt = (t) => { const P = period(), x = M.mod(t, P) / P; return mode.value === 'scale' ? Math.floor(x * 12) / 12 : x; };
        const make = () => {
          const sr = 32000, P = period(), n = Math.round(P * sr), out = new Float32Array(n);
          if (mode.value === 'scale') {
            const L = Math.round(STEP * sr);
            for (let s = 0; s < 12; s++) for (let k = 0; k < K; k++) {
              const f = FMIN * 2 ** (k + s / 12), a = amp(f); if (!a) continue; const w = (TAU * f) / sr;
              for (let i = 0; i < L; i++) { const g = Math.min(1, i / 400, (L - 60 - i) / 1200); if (g > 0) out[s * L + i] += a * g * Math.sin(w * i); }
            }
          } else {
            for (let k = 0; k < K; k++) {
              let p = (TAU * FMIN * P * (2 ** k - 1)) / Math.LN2; // phases that make the loop seamless
              for (let i = 0; i < n; i++) { const u = i / n, f = FMIN * 2 ** (k + u), a = amp(f); if (a > 1e-4) out[i] += a * Math.sin(p); p += (TAU * f) / sr; }
            }
          }
          return { buf: toRms(out, 0.14), sr };
        };
        const lv = loopVoice(v);
        function sync(restart) { if (lv.on) { const m = make(); lv.update(() => m.buf, 0.8, m.sr); if (restart) v.restart(); } v.invalidate(); }
        v.toggle('play the loop', false, { onChange: (x) => { if (x) { const m = make(); lv.start(m.buf, 0.8, m.sr); v.restart(); v.play(); } else lv.stop(); } });
        const sp = v.stage({ x: [20, 20000], y: [0, 1.18], xlog: true, height: 230, axes: 'box', gutter: true, xticks: fTicks(20, 20000), yticks: [], xlabel: 'frequency (Hz)', full: true, title: 'octave-spaced partials under a fixed envelope' });
        const cc = v.stage({ x: [-1.4, 1.4], y: [-1.4, 1.4], equal: true, height: 230, axes: false, weight: 0.7, minWidth: 220, title: 'chroma' });
        const hh = v.stage({ x: [0, 3], y: [-0.5, 3.4], height: 230, axes: 'box', gutter: true, xlabel: 'time (loops)', ylabel: 'octaves', xticks: [0, 1, 2, 3], weight: 1.3, title: 'what changes and what does not' });
        const centroid = (u) => { let s = 0, w = 0; for (let k = 0; k < K; k++) { const f = FMIN * 2 ** (k + u), a = amp(f); s += a * Math.log2(f / FC); w += a; } return w ? s / w : 0; };
        v.animate((t) => {
          const u = uAt(t), P = period(), loops = t / P;
          // spectrum
          sp.fn((f) => amp(f), { color: 'muted', width: 1.4, dash: [6, 4], n: 300 });
          for (let k = 0; k < K; k++) { const f = FMIN * 2 ** (k + u), a = amp(f); if (f > 20000) continue; sp.line(f, 0, f, a, { color: 'accent', width: 3.2 }); sp.dot(f, a, { r: 4, color: k === 5 ? 'gold' : 'accent' }); }
          const fcen = FC * 2 ** centroid(u); sp.vline(fcen, { color: 'green', width: 1.6, dash: [3, 3] }); sp.text('centroid', fcen, 1.12, { color: 'green', size: 11, align: 'center' });
          // chroma
          cc.circle(0, 0, 1, { color: 'faint', width: 1.4 });
          for (let k = 0; k < 12; k++) { const a = Math.PI / 2 - (TAU * k) / 12; cc.text(NOTE[k], 1.22 * Math.cos(a), 1.22 * Math.sin(a), { align: 'center', color: 'muted', size: 10.5 }); }
          const a = Math.PI / 2 - TAU * u; cc.arrow(0, 0, 0.9 * Math.cos(a), 0.9 * Math.sin(a), { color: 'red', width: 2.6 });
          // height chart over 3 loops
          const tl = Math.min(3, loops), stepsF = (x) => (mode.value === 'scale' ? Math.floor(x * 12) / 12 : x);
          hh.fn((x) => stepsF(x), { domain: [0, 3], color: 'red', width: 1.2, alpha: 0.3, n: 600 });
          hh.fn((x) => centroid(M.mod(x, 1)) - centroid(0), { domain: [0, 3], color: 'green', width: 1.2, alpha: 0.3, n: 600 });
          hh.fn((x) => stepsF(x), { domain: [0, tl], color: 'red', width: 2.6, n: 600 });
          hh.fn((x) => centroid(M.mod(x, 1)) - centroid(0), { domain: [0, tl], color: 'green', width: 2.6, n: 600 });
          hh.dot(tl, stepsF(tl), { r: 4, color: 'red' });
          hh.text('chroma steps climbed', 0.08, 3.05, { align: 'left', color: 'red', size: 11 });
          hh.text('centroid (height cue)', 2.9, -0.32, { align: 'right', color: 'green', size: 11 });
        }, { period: 1e9, still: 3 * 12 * 0.3 * 0.62 });
        v.legend([['accent', 'partials (gold: one followed partial)'], ['muted', 'envelope', { dash: true }], ['red', 'chroma'], ['green', 'spectral centroid']]);
        v.readout(() => {
          let lo = Infinity, hi = -Infinity; for (let i = 0; i < 48; i++) { const c = centroid(i / 48); lo = Math.min(lo, c); hi = Math.max(hi, c); }
          const edge = amp(FMIN) + amp(FMIN * 2 ** (K - 1) * 1.99);
          return `${mode.value === 'scale' ? 'Shepard scale: 12 semitone steps per loop' : `Risset glissando: one octave every ${GLIDE} s`} · the spectral centroid wanders only ${v.fix(1200 * (hi - lo), 0)} cents over a loop, while the chroma climbs 1200 · amplitude of partials at the edges of the range ${v.fix(edge, 3)} → ${edge < 0.02 ? '**the wrap-around is hidden**: the tone seems to rise for ever' : '**the wrap-around is audible**: a partial jumps in at the bottom and out at the top each loop'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.12
    {
      num: '5.12',
      kind: 'Phenomenon',
      name: 'Localization: time and level differences',
      statement: String.raw`A listener locates a sound in the horizontal plane mainly by comparing the two ears (**duplex theory**, Rayleigh 1907):
(a) the **interaural time difference** (ITD): the sound reaches the far ear later, by up to about 0.65 ms for a source at the side. For a rigid spherical head of radius $a$ and a distant source at lateral angle $\theta$, Woodworth's formula gives $\mathrm{ITD}=\frac ac(\theta+\sin\theta)$. The ear uses ITDs of the waveform's fine structure below about 1.5 kHz, where the period is longer than the delay, and of envelopes above;
(b) the **interaural level difference** (ILD): the head shadows the far ear, but only for wavelengths comparable to or smaller than the head, so ILDs are negligible at low frequencies and reach 10–20 dB at high ones.

Both cues are the same for every source on a **cone of confusion** around the interaural axis; in the horizontal plane, a source in front and its mirror image behind give identical ITD and ILD. Front–back confusions are resolved by head movements and by the direction-dependent filtering of the outer ear (pinna).`,
      idea: String.raw`Sound travels at $c\approx343$ m/s (1.3), so a 17.5 cm head separates the ears by about half a millisecond of travel. For a distant source, the extra path to the far ear runs straight to the head and then around it along an arc, $a\theta+a\sin\theta$, which gives Woodworth's formula. The ILD is diffraction: when the wavelength is much larger than the head, sound bends round it freely; at high frequencies the head casts a shadow. Rayleigh solved the scattering of a plane wave by a rigid sphere exactly, as a series of spherical harmonics, and that solution, drawn here, gives both cues at once. The two cues complement each other: timing works where shadowing does not, and the poorest localization is in the crossover region near 1.5–3 kHz.`,
      caption: String.raw`Drag the source around the head (top view; nose up). The path to the far ear wraps around the head (orange), and the ghost source (dashed) at the mirror position behind gives exactly the same cues. Right: the ILD against frequency for this direction, from Rayleigh's rigid-sphere solution. Bottom: the ITD against azimuth (Woodworth's formula and the sphere's low-frequency value); every ITD occurs twice, front and back. *Listen* over **headphones**: noise bursts filtered by the sphere's response at each ear; choose ITD only, ILD only, or both.`,
      deps: ['music-1.3'],
      see: ['music-5.13', 'music-1.11', 'mech-4.1'],
      refs: ['Loy I ch. 6'],
      tags: ['localization', 'binaural'],
      credit: 'Lord Rayleigh, 1876–1907 (duplex theory; sphere 1904); Woodworth, 1938; Kuhn, 1977',
      scope: String.raw`A rigid sphere of radius 8.75 cm with ears at ±90°, a distant source in the horizontal plane, no torso or pinnae. Real heads give larger low-frequency ITDs (about 3a/c sin θ, Kuhn 1977, which the sphere solution reproduces) and pinna cues that break the front–back symmetry. With the ears exactly at ±90°, waves creeping round both sides of a sphere meet in phase at the far ear for a source straight to the side (the acoustic *bright spot*), so the sphere's ILD peaks near 60–75° rather than at 90°. Headphone playback places the image inside the head (lateralization) rather than outside.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Sound_localization' },
      viz(v) {
        const M = v.M, A = 0.0875, C = 343, RS = 3.1;
        const s = v.stage({ x: [-3.9, 3.9], y: [-3.9, 3.9], equal: true, height: 330, axes: false, weight: 1, minWidth: 280, title: 'top view (drag the source)' });
        const il = v.stage({ x: [100, 16000], y: [-6, 26], xlog: true, height: 330, axes: 'box', gutter: true, xticks: fTicks(100, 16000, [100, 200, 500, 1000, 2000, 5000, 10000]), xlabel: 'frequency (Hz)', ylabel: 'ILD (dB)', weight: 1, title: 'level difference (rigid sphere)' });
        const it = v.stage({ x: [-180, 180], y: [-0.8, 0.8], height: 200, axes: 'box', gutter: true, xticks: [[-180, '−180° (behind)'], [-90, '−90° left'], [0, '0° front'], [90, '90° right'], [180, '180°']], xlabel: 'azimuth', ylabel: 'ITD (ms)', full: true, title: 'time difference against azimuth' });
        const src = s.handle(RS * Math.sin(0.7), RS * Math.cos(0.7), { color: 'gold', label: 'source', constrain: (x, y) => { const r = Math.hypot(x, y) || 1; return [(RS * x) / r, (RS * y) / r]; } });
        const cue = v.select('play', [{ value: 'both', label: 'ITD + ILD' }, { value: 'itd', label: 'ITD only' }, { value: 'ild', label: 'ILD only' }], 'both');
        const az = () => Math.atan2(src.x, src.y); // 0 = front, + = right
        const woodworth = (phi) => { const th = Math.asin(Math.abs(Math.sin(phi))); return (Math.sign(Math.sin(phi)) * (A / C) * (th + Math.sin(th))); };
        const earP = (f, phi, side) => spherePressure((TAU * f * A) / C, Math.acos(side * Math.sin(phi))); // side +1 right ear
        const ild = (f, phi) => { const r = earP(f, phi, 1), l = earP(f, phi, -1); return dB(Math.hypot(...r) / Math.hypot(...l)); };
        const lowITD = (phi) => { const f = 200, r = earP(f, phi, 1), l = earP(f, phi, -1), d = M.mod(Math.atan2(r[1], r[0]) - Math.atan2(l[1], l[0]) + Math.PI, TAU) - Math.PI; return d / (TAU * f); };
        const cache = new Map();
        const ildCurve = (phi) => { const k = Math.round(phi * 200); if (!cache.has(k)) { if (cache.size > 200) cache.clear(); const pts = []; for (let i = 0; i <= 120; i++) { const f = 100 * 160 ** (i / 120); pts.push([f, ild(f, phi)]); } cache.set(k, pts); } return cache.get(k); };
        const render = () => {
          const N = 32768, sr = SR, phi = az(), r = v.rng(21), reL = new Float64Array(N), imL = new Float64Array(N), reR = new Float64Array(N), imR = new Float64Array(N);
          for (let k = 1; k < N / 2; k++) {
            const f = (k * sr) / N; if (f < 80 || f > 15000) continue;
            const p = r.uniform(0, TAU), x = [Math.cos(p), Math.sin(p)];
            let HR = earP(f, phi, 1), HL = earP(f, phi, -1);
            if (cue.value === 'itd') { const d = woodworth(phi) / 2, w = TAU * f; HR = [Math.cos(-w * d), Math.sin(-w * d)]; HL = [Math.cos(w * d), Math.sin(w * d)]; }
            if (cue.value === 'ild') { HR = [Math.hypot(...HR), 0]; HL = [Math.hypot(...HL), 0]; }
            reL[k] = x[0] * HL[0] - x[1] * HL[1]; imL[k] = x[0] * HL[1] + x[1] * HL[0]; reR[k] = x[0] * HR[0] - x[1] * HR[1]; imR[k] = x[0] * HR[1] + x[1] * HR[0];
            reL[N - k] = reL[k]; imL[N - k] = -imL[k]; reR[N - k] = reR[k]; imR[N - k] = -imR[k];
          }
          M.ifft(reL, imL); M.ifft(reR, imR);
          let pk = 0; for (let i = 0; i < N; i++) pk = Math.max(pk, Math.abs(reL[i]), Math.abs(reR[i]));
          const L = new Float32Array(N), R = new Float32Array(N), g = 0.5 / pk;
          for (let i = 0; i < N; i++) { const t = i / sr, ph = t % 0.25, gate = t < 0.72 && ph < 0.16 ? Math.min(1, ph / 0.005, (0.16 - ph) / 0.005) : 0; L[i] = reL[i] * g * gate; R[i] = reR[i] * g * gate; }
          return { L, R };
        };
        let voice = null;
        v.button('Listen (headphones)', () => { if (voice) voice.stop(); const b = render(); voice = stereo(v, b.L, b.R, SR, { gain: 0.8 }); });
        v.render(() => {
          const phi = az(), side = Math.sign(Math.sin(phi)) || 1, th = Math.asin(Math.abs(Math.sin(phi)));
          // top view
          s.circle(0, 0, RS, { color: 'faint', width: 1, dash: [3, 5] });
          s.poly([[-0.25, 0.95], [0, 1.35], [0.25, 0.95]], { fill: 'muted', fillAlpha: 0.35, color: 'muted' });
          s.circle(0, 0, 1, { fill: 'muted', fillAlpha: 0.15, color: 'ink', width: 1.6 });
          s.rect(-1.12, -0.25, -0.95, 0.25, { fill: 'accent', fillAlpha: 0.8, stroke: false, radius: 2 });
          s.rect(0.95, -0.25, 1.12, 0.25, { fill: 'red', fillAlpha: 0.8, stroke: false, radius: 2 });
          s.text('L', -1.4, 0, { align: 'center', color: 'accent', size: 12, weight: 700 }); s.text('R', 1.4, 0, { align: 'center', color: 'red', size: 12, weight: 700 });
          const sx = Math.sin(phi), sy = Math.cos(phi);
          // wavefronts (perpendicular to the source direction) passing the near ear
          for (const d of [1.5, 2.1, 2.7]) { const cx = d * sx, cy = d * sy; s.line(cx - 1.1 * sy, cy + 1.1 * sx, cx + 1.1 * sy, cy - 1.1 * sx, { color: 'gold', width: 1, alpha: 0.5 }); }
          // near-ear ray and far-ear wrapped path
          const ne = [side, 0], fe = [-side, 0];
          s.line(ne[0] + 3 * sx, ne[1] + 3 * sy, ne[0], ne[1], { color: 'gold', width: 1.8 });
          // the grazing ray touches the head where the radius is perpendicular to the source direction, on the far ear's side
          let tan = [sy, -sx]; if (tan[0] * side > 0) tan = [-sy, sx];
          s.line(tan[0] + 3 * sx, tan[1] + 3 * sy, tan[0], tan[1], { color: 'orange', width: 1.8, alpha: 0.85 });
          const a0 = Math.atan2(tan[1], tan[0]), a1 = Math.atan2(fe[1], fe[0]); let da = a1 - a0; if (da > Math.PI) da -= TAU; if (da < -Math.PI) da += TAU;
          s.curve((u) => [1.04 * Math.cos(a0 + da * u), 1.04 * Math.sin(a0 + da * u)], 0, 1, { color: 'orange', width: 3 });
          // ghost source (cone of confusion)
          const gx = src.x, gy = -src.y;
          if (Math.abs(src.y) > 0.15) { s.dot(gx, gy, { r: 7, hollow: true, color: 'gold' }); s.line(gx, gy, ne[0], ne[1], { color: 'gold', width: 1, dash: [4, 4], alpha: 0.6 }); s.text('same cues', gx, gy + (gy > 0 ? 0.42 : -0.42), { align: 'center', color: 'gold', size: 11 }); }
          s.corner(`azimuth ${v.fix((phi * 180) / Math.PI, 0)}°`, 'tl', { color: 'ink', weight: 600, plate: true });
          // ILD
          il.hline(0, { color: 'faint', width: 1 });
          for (const deg of [30, 60, 90]) { const p = (side * deg * Math.PI) / 180; il.path(ildCurve(p).map(([f, y]) => [f, side * y]), { color: 'muted', width: 1, alpha: 0.45 }); const e = ildCurve(p)[118]; il.text(`${deg}°`, e[0], side * e[1], { color: 'muted', size: 10, align: 'right', dy: -6 }); }
          il.path(ildCurve(phi).map(([f, y]) => [f, side * y]), { color: 'red', width: 2.6 });
          il.vband(100, 1500, { color: 'accent', alpha: 0.06 });
          il.text('ITD region (fine structure)', 130, 23.5, { color: 'accent', size: 10.5, align: 'left' });
          il.text('ILD region', 15000, 23.5, { color: 'red', size: 10.5, align: 'right' });
          // ITD vs azimuth
          it.hline(0, { color: 'faint', width: 1 });
          it.fn((deg) => 1000 * woodworth((deg * Math.PI) / 180), { color: 'accent', width: 2.2, n: 361 });
          it.fn((deg) => 1000 * lowITD((deg * Math.PI) / 180), { color: 'purple', width: 1.4, dash: [5, 4], n: 181 });
          const dg = (phi * 180) / Math.PI, mir = (dg >= 0 ? 180 : -180) - dg;
          it.vline(dg, { color: 'gold', width: 1, alpha: 0.6 });
          it.dot(dg, 1000 * woodworth(phi), { r: 6, color: 'gold' }); it.dot(mir, 1000 * woodworth(phi), { r: 6, color: 'gold', hollow: true });
          it.line(dg, 1000 * woodworth(phi), mir, 1000 * woodworth(phi), { color: 'gold', width: 1, dash: [3, 3] });
        });
        v.legend([['gold', 'source (ring: its mirror image)'], ['orange', 'path around the head'], ['red', 'ILD at your azimuth'], ['accent', 'ITD, Woodworth'], ['purple', 'ITD of the sphere at 200 Hz', { dash: true }]]);
        v.readout(() => {
          const phi = az(), itd = woodworth(phi), lf = lowITD(phi);
          return `azimuth ${v.fix((phi * 180) / Math.PI, 0)}° (lateral angle ${v.fix((Math.asin(Math.abs(Math.sin(phi))) * 180) / Math.PI, 0)}°) · ITD ${v.fix(1000 * itd, 3)} ms (Woodworth), ${v.fix(1000 * lf, 3)} ms (sphere at 200 Hz) · ILD (louder at the ${Math.sin(phi) >= 0 ? 'right' : 'left'} ear) ${v.fix(Math.abs(ild(500, phi)), 1)} dB at 500 Hz, ${v.fix(Math.abs(ild(2000, phi)), 1)} dB at 2 kHz, ${v.fix(Math.abs(ild(8000, phi)), 1)} dB at 8 kHz · mirror source at ${v.fix((((Math.sign(phi) || 1) * Math.PI - phi) * 180) / Math.PI, 0)}°: identical ITD and ILD (cone of confusion)`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.13
    {
      num: '5.13',
      kind: 'Phenomenon',
      name: 'Auditory streaming',
      statement: String.raw`A sequence of alternating tones is heard either as one coherent **stream** or as two separate streams, each with its own rhythm, depending on how far apart the tones are in frequency and how fast they come. In van Noorden's galloping pattern A B A — A B A — …, one stream sounds like a gallop; two streams sound like a fast high beat and a slower low beat, and the gallop disappears. Two boundaries organise the plane of frequency separation against tone repetition time:
(a) below the **fission boundary** the listener can hear only one stream, however hard they try to split it;
(b) above the **temporal coherence boundary** only two streams can be heard; holding them together is impossible;
(c) between the two, perception is ambiguous and can flip, and splitting tends to **build up** over several seconds of listening.`,
      idea: String.raw`Streaming is the auditory system grouping sounds by their likely source, the first step of auditory scene analysis. Tones close in frequency excite overlapping places on the basilar membrane (5.2) and are linked by the same peripheral channels; as the separation grows past a few critical bands (5.4), each tone drives its own channels and the sequence falls apart into two. Speed makes it worse because the links between successive tones weaken as the jumps between them come faster. The fission boundary hardly depends on tempo, the coherence boundary strongly. Composers use it: in the *implied polyphony* of Bach's solo violin and cello works, one fast line sounds as two voices.`,
      caption: String.raw`Top: three cycles of the A B A — pattern on a piano roll, with the predicted organisation drawn over it: a gallop (one stream) or two parallel lines (two streams). Bottom: the plane of tone repetition time against separation, with the two boundaries and your setting. Hold the pattern and slide the separation or tempo until the gallop breaks, then record what you hear with the buttons; your switch points appear as dots.`,
      deps: ['music-5.4'],
      see: ['music-5.15', 'music-5.12', 'music-5.2'],
      refs: ['Loy I ch. 6'],
      tags: ['streaming', 'perception'],
      credit: 'G. A. Miller & Heise, 1950; Bregman & Campbell, 1971; Leon van Noorden, 1975; Albert Bregman, Auditory Scene Analysis, 1990',
      scope: String.raw`Pure tones of 40 ms or more, A fixed at 1 kHz. The two boundaries are drawn *schematically*, in the shape van Noorden reported (a nearly flat fission boundary at a few semitones and a coherence boundary rising with repetition time), not from his data; individual boundaries vary widely and depend on instructions and on how long the listener has been listening.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Auditory_scene_analysis' },
      viz(v) {
        const M = v.M, FA = 1000;
        const trS = v.slider('tone repetition time', 50, 200, 110, { step: 1, fmt: (x) => `${x} ms (${v.fix(1000 / x, 1)} tones/s)`, onChange: () => sync() });
        const dS = v.slider('separation A–B', 0, 16, 6, { step: 0.5, fmt: (x) => `${x} semitones`, onChange: () => sync() });
        const FB = (T) => 3 + 0.004 * (T - 100); // schematic
        const TCB = (T) => 3.5 + 0.075 * (T - 50); // schematic
        const region = (T, d) => (d < FB(T) ? 'one' : d > TCB(T) ? 'two' : 'either');
        const marks = [];
        const cycle = () => {
          const T = trS.value / 1000, n = Math.round(4 * T * SR), out = new Float32Array(n), dur = Math.min(0.75 * T, 0.12), fb = FA * 2 ** (-dS.value / 12);
          [FA, fb, FA].forEach((f, j) => { const o = Math.round(j * T * SR), L = Math.round(dur * SR), R = Math.round(0.008 * SR); for (let i = 0; i < L; i++) out[o + i] += 0.3 * Math.sin((TAU * f * i) / SR) * Math.min(1, i / R, (L - i) / R); });
          return out;
        };
        const lv = loopVoice(v);
        function sync() { lv.update(cycle, 0.8); v.invalidate(); }
        v.toggle('hold the pattern', false, { onChange: (x) => { if (x) { lv.start(cycle(), 0.8); v.restart(); v.play(); } else lv.stop(); } });
        v.button('I hear one stream (gallop)', () => { marks.push([trS.value, dS.value, 'one']); });
        v.button('I hear two streams', () => { marks.push([trS.value, dS.value, 'two']); });
        const pr = v.stage({ x: [0, 12], y: [-17.5, 2], height: 230, axes: 'box', gutter: true, xticks: [0, 4, 8, 12].map((x) => [x, '']), yticks: [[0, 'A 1 kHz'], [-6, '−6'], [-12, '−12'], [-16, '−16 st']], xlabel: 'three cycles of A B A —', full: true, title: 'the pattern' });
        const pl = v.stage({ x: [50, 200], y: [0, 16], height: 260, axes: 'box', gutter: true, xlabel: 'tone repetition time (ms)', ylabel: 'separation (semitones)', full: true, title: 'one stream or two (schematic boundaries after van Noorden, 1975)' });
        v.animate((t) => {
          const T = trS.value, d = dS.value, reg = region(T, d), slot = Math.floor(M.mod(t / (T / 1000), 12));
          // piano roll
          for (let c = 0; c < 3; c++) [[0, 0], [1, -d], [2, 0]].forEach(([j, y]) => { const x = 4 * c + j, on = slot === x; pr.rect(x + 0.06, y - 0.45, x + 0.8, y + 0.45, { fill: j === 1 ? 'orange' : 'accent', fillAlpha: on ? 1 : 0.65, stroke: false, radius: 3 }); });
          const gal = [], A = [], B = [];
          for (let c = 0; c < 3; c++) { gal.push([4 * c + 0.43, 0], [4 * c + 1.43, -d], [4 * c + 2.43, 0]); A.push([4 * c + 0.43, 0], [4 * c + 2.43, 0]); B.push([4 * c + 1.43, -d]); }
          if (reg !== 'two') pr.path(gal, { color: 'ink', width: reg === 'one' ? 2 : 1.2, alpha: reg === 'one' ? 0.8 : 0.35, dash: reg === 'one' ? false : [4, 4] });
          if (reg !== 'one') { pr.path(A, { color: 'accent', width: reg === 'two' ? 2.4 : 1.2, alpha: reg === 'two' ? 0.9 : 0.4, dash: reg === 'two' ? false : [4, 4] }); pr.path(B, { color: 'orange', width: reg === 'two' ? 2.4 : 1.2, alpha: reg === 'two' ? 0.9 : 0.4, dash: reg === 'two' ? false : [4, 4] }); }
          pr.corner(reg === 'one' ? 'one stream: a gallop' : reg === 'two' ? 'two streams: high beat, low beat' : 'ambiguous: either can be heard', 'tr', { color: reg === 'one' ? 'ink' : reg === 'two' ? 'red' : 'purple', weight: 600, plate: true });
          // plane
          pl.between((x) => 16, (x) => TCB(x), 50, 200, { fill: 'red', fillAlpha: 0.1 });
          pl.between((x) => TCB(x), (x) => FB(x), 50, 200, { fill: 'purple', fillAlpha: 0.08 });
          pl.between((x) => FB(x), () => 0, 50, 200, { fill: 'green', fillAlpha: 0.1 });
          pl.fn(TCB, { color: 'red', width: 2 }); pl.fn(FB, { color: 'green', width: 2 });
          pl.text('temporal coherence boundary', 125, TCB(125), { color: 'red', size: 11, align: 'center', dy: -12 });
          pl.text('fission boundary', 190, FB(190), { color: 'green', size: 11, align: 'right', dy: -9 });
          pl.text('always two streams', 60, 14.5, { color: 'red', size: 11, align: 'left' });
          pl.text('always one stream', 60, 1.1, { color: 'green', size: 11, align: 'left' });
          pl.text('either', 175, (FB(175) + TCB(175)) / 2 + 2, { color: 'purple', size: 11, align: 'center' });
          for (const [x, y, k] of marks) pl.dot(x, y, { r: 5, color: k === 'one' ? 'green' : 'red', hollow: true });
          pl.dot(T, d, { r: 7, color: 'gold' });
        }, { period: 1e9, still: 0.5 });
        v.legend([['accent', 'A tones (1 kHz)'], ['orange', 'B tones'], ['green', 'one stream'], ['red', 'two streams'], ['gold', 'your setting']]);
        v.readout(() => {
          const T = trS.value, d = dS.value, reg = region(T, d), fb = FA * 2 ** (-d / 12), dE = erbNumber(FA) - erbNumber(fb);
          return `A = 1000 Hz, B = ${v.fix(fb, 0)} Hz (${v.fix(d, 1)} semitones, ${v.fix(dE, 1)} ERB apart) · one tone every ${T} ms · schematic prediction: **${reg === 'one' ? 'one stream' : reg === 'two' ? 'two streams' : 'ambiguous'}** (fission boundary ${v.fix(FB(T), 1)} st, coherence boundary ${v.fix(TCB(T), 1)} st at this tempo) · your marks: ${marks.length}`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.14
    {
      num: '5.14',
      kind: 'Model',
      name: 'Place and temporal theories of pitch',
      statement: String.raw`Two classical accounts of how the auditory system extracts pitch:
(a) **place theory** (Helmholtz): pitch is read from *where* the basilar membrane is excited (5.2). A complex tone's low harmonics are **resolved**, each producing its own peak in the excitation pattern, and a pattern-matching stage finds the fundamental whose harmonics best fit the peaks (4.12);
(b) **temporal theory** (Seebeck, Schouten, Licklider): pitch is read from *when* nerve fibres fire. Fibres phase-lock to the waveform at the output of their filter, and the common period across channels, found for example by summing autocorrelations of the firing patterns (the **summary autocorrelation**), gives the pitch.

Each explains facts the other cannot. Unresolved high harmonics, which form no separate peaks, still give a (weaker) pitch at the fundamental, as timing predicts. But phase locking fades above about 4–5 kHz, and pure tones above about 5 kHz, though audible and discriminable, lose their musical pitch: melodies become hard to recognise. Modern models combine the two.`,
      idea: String.raw`The cochlea's filters (5.4) widen with frequency, so harmonics below about the 8th fall into separate filters and those above share them. A filter containing several unresolved harmonics outputs a waveform beating at the fundamental (5.6), so its fibres fire at intervals of the period even though no place is tuned there. That is why the missing fundamental (4.11) survives filtering away the low harmonics, and why the phases of unresolved harmonics matter (5.3). Summing the autocorrelation of every channel lines up the common period: the first big peak sits at the lag $1/f_0$. Above the limit of phase locking only the rate of firing, a place code, remains; place alone does not support musical pitch, which suggests that timing is essential.`,
      caption: String.raw`Choose the stimulus and its fundamental. Top left: the excitation pattern (filter output level against place, as frequency); resolved harmonics stand out as separate peaks. Top right: a neurogram, the half-wave rectified and low-passed outputs of 48 model filters over 20 ms: phase locking shows as stripes, and periodicity at $1/f_0$ as vertical banding. Bottom: the summary autocorrelation, with its first main peak marked; it finds the period for unresolved harmonics too. Then try a pure tone above 5 kHz: the stripes vanish (phase locking is gone) and the autocorrelation goes flat. *Melody* plays a tune with the current stimulus.`,
      deps: ['music-5.2', 'music-4.11', 'music-4.12'],
      see: ['music-5.3', 'music-5.9', 'music-4.11', 'music-5.10'],
      refs: ['Rossing ch. 7', 'Loy I ch. 6'],
      tags: ['pitch', 'place theory'],
      credit: 'Helmholtz, 1863 (place); August Seebeck, 1841, and Jan Schouten, 1940 (periodicity); J. C. R. Licklider, 1951 (autocorrelation); Meddis & Hewitt, 1991; melodies above 5 kHz: Attneave & Olson, 1971',
      scope: String.raw`A simple functional model: 48 fourth-order gammatone filters (ERB spacing, 80 Hz–10 kHz), half-wave rectification, and a two-stage low-pass at 3 kHz standing in for the loss of phase locking (an *illustrative* cutoff; in mammals synchrony declines from about 1–2 kHz and is weak above 4–5 kHz). No hair-cell adaptation, no noise, no neural stage beyond autocorrelation.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Pitch_(music)#Theories_of_pitch_perception' },
      viz(v) {
        const M = v.M, FS = 32000, NS = 1920, NCH = 48, LP = 3000, LAG = 15;
        const stim = v.select('stimulus', [{ value: 'all', label: 'harmonics 1–10' }, { value: 'res', label: 'harmonics 2–5' }, { value: 'unres', label: 'harmonics 12–20' }, { value: 'pure', label: 'pure tone' }], 'all', { onChange: () => (cacheK = '') });
        const f0S = v.slider('fundamental / tone', 80, 8000, 200, { log: true, fmt: (x) => `${v.fix(x, 0)} Hz (${noteOf(M, x)})`, onChange: () => (cacheK = '') });
        const harm = () => ({ all: [1, 10], res: [2, 5], unres: [12, 20], pure: [1, 1] }[stim.value]);
        const parts = (f0) => { const [a, b] = harm(), out = []; for (let n = a; n <= b; n++) if (n * f0 < 12000) out.push(n * f0); return out; };
        const chans = M.range(NCH).map((i) => erbNumberInv(erbNumber(80) + ((erbNumber(10000) - erbNumber(80)) * i) / (NCH - 1)));
        let cacheK = '', C = null;
        const analyse = () => {
          const key = `${stim.value}|${Math.round(f0S.value)}`; if (key === cacheK) return C; cacheK = key;
          const f0 = f0S.value, ps = parts(f0), x = new Float32Array(NS);
          for (const f of ps) { const w = (TAU * f) / FS; for (let i = 0; i < NS; i++) x[i] += Math.cos(w * i) / Math.sqrt(ps.length); }
          const a = Math.exp((-TAU * LP) / FS), lev = [], gram = [], sacf = new Float64Array(Math.round((LAG / 1000) * FS));
          const NF = 2048, i0 = NS - 1280;
          chans.forEach((fc) => {
            const g = gammatone(x, fc, FS), y = g.re; let e = 0; for (let i = i0; i < NS; i++) e += y[i] * y[i];
            lev.push(10 * Math.log10(e / (NS - i0) + 1e-12));
            const r = new Float64Array(NS); let s1 = 0, s2 = 0;
            for (let i = 0; i < NS; i++) { const h = Math.max(0, y[i]); s1 = a * s1 + (1 - a) * h; s2 = a * s2 + (1 - a) * s1; r[i] = s2; }
            gram.push(r.slice(i0, i0 + 640));
            const re = new Float64Array(NF), im = new Float64Array(NF); for (let i = 0; i < 1280; i++) re[i] = r[i0 + i];
            M.fft(re, im); for (let k = 0; k < NF; k++) { re[k] = re[k] * re[k] + im[k] * im[k]; im[k] = 0; } M.ifft(re, im);
            for (let L = 0; L < sacf.length; L++) sacf[L] += re[L];
          });
          // normalise: remove the DC part by the zero-lag value of a fully flat response
          const z = sacf[0]; let mean = 0; for (let L = 0; L < sacf.length; L++) mean += sacf[L]; mean /= sacf.length;
          const nac = Array.from(sacf, (q) => q / z);
          // pitch: the local maximum whose multiples (L, 2L, 3L, … within the window) have the highest mean autocorrelation
          let L0 = 1; while (L0 < nac.length - 1 && nac[L0] < nac[L0 - 1]) L0++;
          const at = (q) => { const i = Math.round(q); let m = -Infinity; for (let j = i - 2; j <= i + 2; j++) if (j >= 0 && j < nac.length) m = Math.max(m, nac[j]); return m; };
          const cands = []; for (let L = Math.max(L0, 2); L < nac.length - 1; L++) if (nac[L] >= nac[L - 1] && nac[L] >= nac[L + 1]) { const den = nac[L - 1] - 2 * nac[L] + nac[L + 1], Lf = den < 0 ? L + (0.5 * (nac[L - 1] - nac[L + 1])) / den : L; let sc = 0, n = 0; for (let k = 1; k * Lf < nac.length - 2; k++) { sc += at(k * Lf); n++; } cands.push([L, sc / n, Lf]); }
          let top = -Infinity; for (const c of cands) top = Math.max(top, c[1]);
          const pick = cands.find((c) => c[1] >= top - 0.01);
          const pk = pick ? pick[0] : nac.length - 1, pkF = pick ? pick[2] : pk;
          let mn = Infinity; for (let L = L0 > 1 ? L0 - 1 : 1; L <= pk; L++) mn = Math.min(mn, nac[L]);
          const mx = Math.max(...lev);
          C = { lev: lev.map((q) => q - mx), gram, nac, pk, pkF, depth: nac[pk] - mn, ps };
          return C;
        };
        const resolvedPeaks = (lev) => { const out = []; for (let i = 1; i < NCH - 1; i++) if (lev[i] > lev[i - 1] && lev[i] >= lev[i + 1] && lev[i] > -40) { let l = i, r = i; while (l > 0 && lev[l - 1] < lev[l]) l--; while (r < NCH - 1 && lev[r + 1] < lev[r]) r++; if (lev[i] - Math.max(lev[l], lev[r]) > 3 || l === 0 || r === NCH - 1) out.push(chans[i]); } return out; };
        const melody = [0, 2, 4, 0, 0, 2, 4, 0, 4, 5, 7];
        v.soundButton('Melody', (snd) => { const f0 = f0S.value; snd.samples(join(melody.map((s, j) => toRms(partials(parts(f0 * 2 ** (s / 12)).map((f) => ({ f, a: 1 })), j === 10 ? 0.7 : 0.33, { att: 0.02, rel: 0.05 }), 0.12)), 0.04), SR, { gain: 0.9 }); });
        v.soundButton('one tone', (snd) => snd.samples(toRms(partials(parts(f0S.value).map((f) => ({ f, a: 1 })), 1, { att: 0.02, rel: 0.1 }), 0.12), SR, { gain: 0.9 }));
        const ex = v.stage({ x: [80, 10000], y: [-50, 4], xlog: true, height: 250, axes: 'box', gutter: true, xticks: fTicks(80, 10000, [100, 200, 500, 1000, 2000, 5000, 10000]), xlabel: 'place (as characteristic frequency, Hz)', ylabel: 'level (dB)', weight: 1, title: 'place: the excitation pattern' });
        const ng = v.stage({ x: [0, 20], y: [0, NCH], height: 250, axes: 'box', gutter: true, xlabel: 'time (ms)', yticks: [[0, '80'], [NCH * 0.5, String(Math.round(chans[NCH / 2]))], [NCH - 1, '10k']], ylabel: 'channel (Hz)', weight: 1, title: 'timing: the neurogram' });
        const ac = v.stage({ x: [0, LAG], y: [-0.05, 1.05], height: 200, axes: 'box', gutter: true, xlabel: 'lag (ms)', yticks: [[0, '0'], [1, '1']], full: true, title: 'summary autocorrelation (all channels)' });
        const R = (u) => v.ramp(u, 'accent');
        v.render(() => {
          const A = analyse(), f0 = f0S.value;
          // excitation
          ex.path(chans.map((f, i) => [f, A.lev[i]]), { color: 'accent', width: 2.4 });
          ex.dots(chans.map((f, i) => [f, A.lev[i]]), { r: 2.2, color: 'accent' });
          for (const f of A.ps) ex.vline(f, { color: 'orange', width: 1, alpha: 0.5, dash: [3, 3] });
          const rp = resolvedPeaks(A.lev); for (const f of rp) ex.dot(f, A.lev[chans.indexOf(f)], { r: 5, color: 'green', hollow: true });
          ex.corner(`${rp.length} resolved peak${rp.length === 1 ? '' : 's'}`, 'tr', { color: 'green', weight: 600, plate: true });
          // neurogram
          let gm = 1e-9; for (const r of A.gram) for (const q of r) gm = Math.max(gm, q);
          ng.raster((x, y) => { const c = Math.floor(y), i = Math.floor((x / 20) * 640); if (c < 0 || c >= NCH || i < 0 || i >= 640) return null; return R(Math.min(1, A.gram[c][i] / gm * 1.6)); }, { key: `${cacheK}|${v.rgb('panel').join()}`, res: 2 });
          for (let k = 1; k * (1000 / f0) < 20 && k < 12; k++) ng.vline(k * (1000 / f0), { color: 'gold', width: 1, alpha: 0.6, dash: [3, 4] });
          // SACF
          const lagMs = (L) => (1000 * L) / FS;
          ac.path(A.nac.map((q, L) => [lagMs(L), q]), { color: 'accent', width: 2 });
          for (let k = 1; k * (1000 / f0) < LAG && k < 30; k++) ac.vline(k * (1000 / f0), { color: 'gold', width: 1, alpha: 0.5, dash: [3, 4] });
          const ok = A.depth > 0.12;
          ac.dot(lagMs(A.pkF), A.nac[A.pk], { r: 6, color: A.depth > 0.25 ? 'green' : ok ? 'orange' : 'red', label: ok ? `${A.depth > 0.25 ? '' : 'weak '}pitch ${v.fix(1000 / lagMs(A.pkF), 0)} Hz` : 'no clear peak', labelPos: lagMs(A.pkF) > LAG * 0.75 ? 'nw' : 'ne' });
        });
        v.legend([['accent', 'model response'], ['orange', 'stimulus components'], ['gold', 'multiples of the period $1/f_0$'], ['green', 'resolved peaks / pitch found']]);
        v.readout(() => {
          const A = analyse(), f0 = f0S.value, rp = resolvedPeaks(A.lev), ok = A.depth > 0.12, est = FS / A.pkF;
          const place = rp.length >= 2 ? `place view: ${rp.length} resolved harmonics, spacing ≈ ${v.fix(M.median(rp.slice(1).map((f, i) => f - rp[i])), 0)} Hz` : rp.length === 1 ? 'place view: a single peak (its place gives the pitch of a pure tone)' : 'place view: no resolved harmonics';
          return `${stim.value === 'pure' ? `pure tone ${v.fix(f0, 0)} Hz` : `harmonics ${harm()[0]}–${harm()[1]} of ${v.fix(f0, 0)} Hz (${A.ps.length} below 12 kHz)`} · ${place} · timing view: summary autocorrelation peak at ${v.fix((1000 * A.pkF) / FS, 3)} ms → ${ok ? `${A.depth > 0.25 ? '' : 'weak periodicity, '}**${v.fix(est, 1)} Hz** (${noteOf(M, est)}; true period gives ${v.fix(f0, 1)} Hz)` : '**no clear periodicity**: above the phase-locking limit the timing code is lost'} · peak prominence ${v.fix(A.depth, 3)}`;
        });
      },
    },
    // ------------------------------------------------------------------ 5.15
    {
      num: '5.15',
      kind: 'Phenomenon',
      name: 'Tonal fusion and the mistuned harmonic',
      statement: String.raw`The harmonics of a periodic tone fuse into a single sound with one pitch; the listener does not hear them separately. Two cues drive the fusion, and breaking either one makes a harmonic stand out as a separate tone:
(a) **harmonicity**: mistune one low harmonic of an otherwise harmonic complex and, beyond a few per cent (roughly 1–3% for the lowest harmonics in Moore, Glasberg and Peters's 1986 experiments), it is heard as a separate pure tone alongside the complex; smaller mistunings instead pull the pitch of the whole complex slightly;
(b) **common onset**: start one harmonic some tens of milliseconds before the others, and it is heard separately at first and contributes less to the timbre and pitch of the complex.

These are among the grouping principles of **auditory scene analysis**, the process by which the ear assigns the partials arriving at once to the different sources that made them.`,
      idea: String.raw`In nature, partials that are exact multiples of one fundamental and that start together almost always come from one vibrating source (2.6), so the auditory system treats them as one object, a kind of harmonic sieve: partials passing through the holes at $nf_0$ are grouped, others are rejected. A mistuned harmonic falls between the holes. It also beats against the waveform of its neighbours (5.6), so the waveform's shape changes from period to period at the mistuning rate. A head start works the same way: a partial that was already sounding before the rest arrived is assigned to an earlier event. Like streaming (5.13), fusion is grouping; here it acts on simultaneous partials instead of successive tones.`,
      caption: String.raw`Top: the twelve harmonics of 200 Hz as bars over time (a schematic spectrogram); the chosen harmonic is red, its harmonic position dashed. Mistune it with the slider or start it early. Bottom left: the harmonic sieve, each partial's deviation from the nearest multiple of $f_0$, with a ±2% tolerance band (illustrative). Bottom right: four periods of the waveform at the start and half a beat later; a mistuned harmonic makes the shape drift. Listen to the complex, then to the harmonic alone as a cue, then the complex again, and try to hear it out.`,
      deps: ['music-5.13', 'music-2.6'],
      see: ['music-4.12', 'music-5.6', 'music-5.14', 'music-4.1'],
      refs: ['Sethares ch. 2'],
      tags: ['grouping', 'scene analysis'],
      credit: 'Helmholtz, 1863 (hearing out partials); Moore, Glasberg & Peters, 1985–1986; Darwin & Ciocca, 1992; Albert Bregman, 1990',
      scope: String.raw`Twelve equal-amplitude harmonics of 200 Hz, 0.8 s long. The thresholds quoted are approximate: they depend on the harmonic number, the duration and the listener. The ±2% sieve tolerance and the readout's "likely heard out" rule (beyond about 2–3% mistuning of a low harmonic, or an onset lead of about 30 ms or more) are *illustrative* rules of thumb, not a model fitted to data.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Auditory_scene_analysis' },
      viz(v) {
        const M = v.M, F0 = 200, NH = 12, DUR = 0.8;
        const hS = v.slider('harmonic', 1, NH, 4, { int: true, fmt: (x) => `${x} (${x * F0} Hz)`, onChange: () => sync() });
        const mS = v.slider('mistuning', -8, 8, 4, { step: 0.1, fmt: (x) => `${x > 0 ? '+' : ''}${v.fix(x, 1)}%`, onChange: () => sync() });
        const aS = v.slider('onset lead', 0, 200, 0, { step: 5, fmt: (x) => `${x} ms`, onChange: () => sync() });
        const fOf = (n) => (n === hS.value ? n * F0 * (1 + mS.value / 100) : n * F0);
        const complex = (lead = aS.value / 1000) => {
          const n = Math.round((DUR + lead) * SR), out = new Float32Array(n);
          for (let k = 1; k <= NH; k++) {
            const f = fOf(k), st = k === hS.value ? 0 : Math.round(lead * SR), w = (TAU * f) / SR, R = Math.round(0.01 * SR);
            for (let i = st; i < n; i++) { const j = i - st, L = n - st; out[i] += Math.sin(w * j) * Math.min(1, j / R, (L - j) / (4 * R)); }
          }
          return toRms(out, 0.13);
        };
        const lv = loopVoice(v);
        v.toggle('hold the complex (steady)', false, { onChange: (x) => { if (x) lv.start(loopBuf(), 0.8); else lv.stop(); } });
        const loopBuf = () => { return toRms(partials(M.range(NH, 1).map((k) => ({ f: Math.round(fOf(k) * 2) / 2, a: 1 })), 2), 0.13); };
        function sync() { lv.update(loopBuf, 0.8); v.invalidate(); }
        v.soundButton('complex', (snd) => snd.samples(complex(), SR, { gain: 0.9 }));
        v.soundButton('complex · harmonic alone · complex', (snd) => { const cue = toRms(partials([{ f: fOf(hS.value), a: 1 }], 0.6, { att: 0.02, rel: 0.1 }), 0.1); snd.samples(join([complex(), cue, complex()], 0.35), SR, { gain: 0.9 }); });
        v.soundButton('harmonic vs mistuned', (snd) => { const keep = mS.value; const a = (() => { mS.value = 0; const b = complex(0); mS.value = keep; return b; })(); snd.samples(join([a, complex(0), a, complex(0)], 0.3), SR, { gain: 0.9 }); });
        const sg = v.stage({ x: [-0.22, DUR], y: [0, (NH + 0.8) * F0], height: 250, axes: 'box', gutter: true, xlabel: 'time (s)', ylabel: 'frequency (Hz)', yticks: M.range(NH + 1, 1).filter((k) => k % 2 === 0).map((k) => [k * F0, String(k * F0)]), full: true, title: 'twelve harmonics, one of them mistuned or early' });
        const sv = v.stage({ x: [0.3, NH + 0.7], y: [-9, 9], height: 210, axes: 'box', gutter: true, xticks: M.range(NH, 1), xlabel: 'harmonic n', ylabel: 'deviation (%)', weight: 1, title: 'the harmonic sieve' });
        const wv = v.stage({ x: [0, 4], y: [-1.15, 1.15], height: 210, axes: 'box', gutter: true, xlabel: 'periods', yticks: [], weight: 1, title: 'waveform: now and half a beat later' });
        v.render(() => {
          const h = hS.value, lead = aS.value / 1000, m = mS.value, df = Math.abs(fOf(h) - h * F0);
          for (let k = 1; k <= NH; k++) {
            const f = fOf(k), on = k === h, t0 = on ? -lead : 0;
            if (on && Math.abs(m) > 0.05) sg.line(-0.22, k * F0, DUR, k * F0, { color: 'muted', width: 1, dash: [4, 4] });
            sg.rect(t0, f - 32, DUR, f + 32, { fill: on ? 'red' : 'accent', fillAlpha: on ? 0.85 : 0.55, stroke: false, radius: 3 });
          }
          sg.vline(0, { color: 'faint', width: 1 });
          if (lead > 0) sg.text(`lead ${aS.value} ms`, -lead / 2, fOf(h) + 75, { align: 'center', color: 'red', size: 11 });
          // sieve
          sv.hband(-2, 2, { color: 'green', alpha: 0.12 }); sv.hline(0, { color: 'faint', width: 1 });
          for (let k = 1; k <= NH; k++) { const d = (100 * (fOf(k) - k * F0)) / (k * F0), out = Math.abs(d) > 2; sv.line(k, 0, k, d, { color: out ? 'red' : 'accent', width: 3 }); sv.dot(k, d, { r: 5, color: out ? 'red' : 'accent' }); }
          sv.text('±2% (illustrative)', NH + 0.6, 2.6, { align: 'right', color: 'green', size: 10.5 });
          // waveform drift
          const w0 = (u, t) => { let y = 0; for (let k = 1; k <= NH; k++) y += Math.sin(TAU * fOf(k) * (u / F0 + t)); return y; };
          let pk = 1e-9; for (let i = 0; i < 400; i++) pk = Math.max(pk, Math.abs(w0(i / 400, 0))); const w = (u, t) => w0(u, t) / pk;
          const tl = df > 0.01 ? 0.5 / df : 0;
          wv.hline(0, { color: 'faint', width: 1 });
          wv.fn((u) => w(u, 0), { color: 'accent', width: 1.8, n: 800 });
          if (tl) wv.fn((u) => w(u, Math.round(tl * F0) / F0), { color: 'red', width: 1.6, n: 800, alpha: 0.85 });
          wv.corner(tl ? `half a beat = ${v.fix(1000 * tl, 0)} ms later (red)` : 'harmonic: the shape never changes', 'tr', { color: tl ? 'red' : 'green', size: 11, plate: true });
        });
        v.legend([['accent', 'harmonic partials / waveform at t = 0'], ['red', 'the chosen harmonic / waveform half a beat later'], ['green', 'sieve tolerance']]);
        v.readout(() => {
          const h = hS.value, m = mS.value, f = fOf(h), df = f - h * F0, lead = aS.value;
          const out = (h <= 6 && Math.abs(m) >= 2.5) || (h > 6 && Math.abs(df) >= 20) || lead >= 30;
          return `harmonic ${h} at ${v.fix(f, 1)} Hz instead of ${h * F0} Hz: mistuned by ${v.fix(m, 1)}% = ${v.fix(df, 1)} Hz, so the waveform's shape repeats every ${Math.abs(df) > 0.05 ? `${v.fix(1000 / Math.abs(df), 0)} ms` : '— (never changes)'} · onset lead ${lead} ms · rule of thumb: ${out ? '**likely heard out** as a separate tone' : '**likely fused** into the complex'}${Math.abs(m) > 0 && Math.abs(m) < 3 && !out ? ' (small mistunings shift the pitch of the complex slightly instead)' : ''}`;
        });
      },
    },
  ],
};
