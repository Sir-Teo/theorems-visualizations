// Signals & Systems — Chapter 7, landmark paper: Shannon (1949).
//
// Data (verified):
// - Shannon (1949), Proc. IRE 37: 10–21, scan at fab.cba.mit.edu/classes/S62.12/docs/Shannon_noise.pdf (text layer read):
//   Theorem 1 (a function with no frequencies above W is determined by samples 1/2W apart); the signal as a point in
//   2TW dimensions; Theorem 2, C = W log₂(1 + P/N) for white Gaussian noise; Fig. 6 (C/W against P/N in db, with PCM
//   and PPM points and an "about 8 db" gap between practical PCM, at about one error in 10⁵ binary digits, and the
//   ideal curve); Fig. 7 (C/W₀ against W/W₀, W₀ = P/N₀, asymptote log₂e = 1.443).
// - The PCM points here are recomputed with the paper's assumptions (m-level pulses, positive and negative, at 2W per
//   second, error rate ≈ 10⁻⁵, as in Oliver, Pierce & Shannon 1948), not read from the figure: binary PCM needs
//   P/N ≈ 12.9 dB for 2 bits per cycle, where the ideal curve needs 4.8 dB — 8.1 dB, the paper's "about 8 db".
// - Today: turbo codes reach a bit error rate of 10⁻⁵ at Eb/N0 ≈ 0.7 dB for rate 1/2 (Berrou, Glavieux & Thitimajshima
//   1993); LDPC codes have thresholds within 0.0045 dB of the binary-input Shannon limit (Chung, Forney, Richardson &
//   Urbanke 2001, IEEE Comm. Letters 5: 58–60). At 1 bit per cycle (rate 1/2 per dimension) P/N = Eb/N0.

function qfun(M, x) { return 0.5 * M.erfc(x / Math.SQRT2); }
/** P/N (linear) that m-level PCM needs for symbol error rate ≈ pe, and its rate in bits per cycle (2 log2 m). */
function pcmPoint(M, m, pe) {
  let lo = 0.5, hi = 20; for (let i = 0; i < 80; i++) { const a = (lo + hi) / 2; if (2 * (1 - 1 / m) * qfun(M, a) > pe) lo = a; else hi = a; }
  const a = (lo + hi) / 2; return { snr: ((m * m - 1) / 3) * a * a, rate: 2 * Math.log2(m) };
}
const db = (x) => 10 * Math.log10(x);
// band-limited test signal: sum of sinusoids with frequencies up to W = 1
const COMPS = [[0.13, 1.0, 0.3], [0.37, 0.7, 1.1], [0.58, 0.55, 2.0], [0.81, 0.45, 0.4], [0.97, 0.35, 2.7]];
const sig = (t, fmax) => COMPS.reduce((s, [f, a, p]) => (f <= fmax ? s + a * Math.cos(2 * Math.PI * f * t + p) : s), 0);

export default {
  collection: 'sig',
  chapter: 7,
  items: [
    {
      num: '7.19',
      kind: 'Paper',
      name: 'Communication in the Presence of Noise',
      paper: { authors: 'C. E. Shannon', year: 1949, title: 'Communication in the Presence of Noise', venue: 'Proceedings of the IRE 37 (1): 10–21', doi: '10.1109/JRPROC.1949.232969' },
      introduces: ['sig-7.3', 'sig-7.15'],
      statement: String.raw`(1) **Sampling theorem.** A signal containing no frequencies above $W$ is completely determined by its values at instants $1/2W$ apart, and is rebuilt from them as a sum of $\operatorname{sinc}$ pulses,
$$f(t) = \sum_n f\!\left(\tfrac{n}{2W}\right) \frac{\sin \pi(2Wt - n)}{\pi(2Wt - n)}.$$
So a signal of duration $T$ and bandwidth $W$ is a point in a space of $2TW$ dimensions.

(2) **Capacity.** With average signal power $P$ and white Gaussian noise of power $N$ in the band, the highest rate at which binary digits can be sent with arbitrarily small error frequency is
$$C = W \log_2\!\left(1 + \frac{P}{N}\right) \text{ bits per second},$$
achieved in the limit by long codes whose signals fill the sphere of radius $\sqrt{2TW(P+N)}$ like random points, each surrounded by its own nearly non-overlapping noise sphere of radius $\sqrt{2TWN}$. Scope: band-limited channels with additive white Gaussian noise (Theorem 3 bounds other noises); the rate is approached only with growing delay.`,
      idea: String.raw`Nyquist (1928) and Hartley had related signalling speed to bandwidth, and Whittaker (1915) and Kotelnikov (1933) had found sampling-type expansions (sig-5.11). Shannon's paper, written in 1940s wartime and published a year after "A Mathematical Theory of Communication" (info-6.8), gave both results a geometric form that engineers could see: sampling makes every signal a vector, power becomes squared distance, noise a small sphere around each transmitted point, and counting how many noise spheres fit inside the sphere of received signals gives the capacity. The paper also compared real systems (PCM, PPM) with the ideal and found an 8 dB gap that better coding could close, and showed that the best power allocation over a coloured noise spectrum is "water-filling". The sampling theorem (sig-7.3) became the basis of all digital audio, imaging and communications; the capacity formula (sig-7.15) set the target that coding theory chased for 45 years, until turbo and LDPC codes came within a fraction of a decibel of it.`,
      caption: String.raw`**Left**: a band-limited signal (frequencies up to $W$, black) sampled at rate $f_s$ (dots) and rebuilt from the samples alone by sinc pulses (green). Drag the **sampling rate**: at $f_s \ge 2W$ the rebuild locks onto the signal; below it the high frequencies alias and the rebuild is wrong. **Right**: Shannon's Figure 6, capacity per unit bandwidth against signal-to-noise ratio, with PCM points recomputed from the paper's assumptions (one error in about 10⁵ digits) and the codes that later closed the gap; or his Figure 7, capacity as bandwidth grows with fixed power, approaching $1.443\,P/N_0$. Drag the gold point along the axis to read the capacity.`,
      deps: ['sig-5.11', 'sig-7.1', 'info-6.8'],
      refs: [],
      tags: ['sampling', 'channel capacity', 'information theory'],
      credit: 'Claude E. Shannon, 1949',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Shannon%E2%80%93Hartley_theorem' },
      viz(v) {
        const M = v.M;
        const fsr = v.slider('sampling rate f_s / 2W', 0.4, 2, 1.25, { step: 0.01 });
        const fig = v.select('right panel', [{ value: 'f6', label: 'Fig. 6: capacity vs P/N' }, { value: 'f7', label: 'Fig. 7: capacity vs bandwidth' }], 'f6');
        const S = v.stage({ x: [0, 12], y: [-3.6, 3.6], axes: 'box', gutter: true, height: 320, weight: 1.15, minWidth: 260, xlabel: 'time (units of 1/W)', ylabel: 'signal', title: 'sampling and sinc reconstruction' });
        const C = v.stage({ x: [-20, 30], y: [0, 10.5], axes: 'box', gutter: true, height: 320, weight: 1, minWidth: 260, xlabel: 'P/N (db)', ylabel: 'C/W (bits per cycle)', title: 'Shannon’s Figure 6' });
        const hp = C.handle(10, 0, { color: 'gold', constrain: (x) => [M.clamp(x, -19.5, 29.5), 0] });
        const PCM = [2, 3, 4, 5, 6, 8, 12, 16, 32].map((m) => ({ m, ...pcmPoint(M, m, 1e-5) }));
        let st = null;
        v.render(() => {
          // ---- sampling
          const W = 1, fs = 2 * W * fsr.value, Ts = 1 / fs;
          const f = (t) => sig(t, 1.0);
          const n0 = Math.floor(-30 * fs), n1 = Math.ceil((12 + 30) * fs);
          const samples = []; for (let n = n0; n <= n1; n++) samples.push([n * Ts, f(n * Ts)]);
          // ideal low-pass rebuild at the sampling Nyquist frequency fs/2 (what the samples alone determine)
          const sinc = (x) => (Math.abs(x) < 1e-9 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x));
          const rebuild = (t) => samples.reduce((s, [tn, y]) => s + y * sinc((t - tn) / Ts), 0);
          S.fn(f, { color: 'ink', width: 2, domain: [0, 12], n: 500 });
          S.fn(rebuild, { color: 'green', width: 2.2, dash: [6, 3], domain: [0, 12], n: 400 });
          for (const [tn, y] of samples) if (tn >= 0 && tn <= 12) { S.line(tn, 0, tn, y, { color: 'gold', width: 1, alpha: 0.6 }); S.dot(tn, y, { r: 3.5, color: 'gold' }); }
          let err = 0, pw = 0; for (let i = 0; i <= 240; i++) { const t = 2 + (8 * i) / 240; err += (rebuild(t) - f(t)) ** 2; pw += f(t) ** 2; }
          const rel = Math.sqrt(err / pw);
          S.corner(fsr.value >= 1 ? `f_s = ${v.fix(fsr.value, 2)} × 2W: reconstruction error ${v.fix(100 * rel, 1)}%` : `f_s = ${v.fix(fsr.value, 2)} × 2W < 2W: aliasing, error ${v.fix(100 * rel, 0)}%`, 'tl', { size: 12, weight: 700, color: fsr.value >= 1 ? 'green' : 'red' });
          // ---- capacity figures
          if (fig.value === 'f6') {
            C.setView([-20, 30], [0, 10.5]); C.setLabels('P/N (db)', 'C/W (bits per cycle)'); C.setTitle('Shannon’s Figure 6: ideal against PCM');
            C.fn((x) => Math.log2(1 + 10 ** (x / 10)), { color: 'accent', width: 2.6, domain: [-20, 30] });
            for (const p of PCM) { C.dot(db(p.snr), p.rate, { r: 5, hollow: true, color: 'red', width: 1.8 }); }
            const b = PCM[0];
            C.line(db(b.snr), b.rate, db(3), b.rate, { color: 'red', width: 1.2, dash: [3, 3] });
            C.text(`${v.fix(db(b.snr) - db(3), 1)} db`, (db(b.snr) + db(3)) / 2, b.rate, { dy: 13, size: 11.5, color: 'red', weight: 700 });
            C.dot(0.7, 1, { r: 5.5, color: 'purple' }); C.text('turbo 1993', 0.7, 1, { dx: 8, dy: 9, align: 'left', size: 11, color: 'purple', weight: 600 });
            C.dot(0.19, 1, { r: 5.5, color: 'green' }); C.text('LDPC 2001', 0.19, 1, { dx: -8, dy: -10, align: 'right', size: 11, color: 'green', weight: 600 });
            const x = hp.x, cap = Math.log2(1 + 10 ** (x / 10));
            hp.set(x, cap);
            C.vline(x, { color: 'gold', width: 1, dash: [3, 3] });
            C.text(`C/W = ${v.fix(cap, 2)}`, x, cap, { dx: -10, dy: -14, align: 'right', size: 12, weight: 700, color: 'gold', plate: true });
            st = { rel, x, cap };
          } else {
            C.setView([0, 5.2], [0, 1.6]); C.setLabels('W / W₀  (W₀ = P/N₀)', 'C / W₀'); C.setTitle('Shannon’s Figure 7: more bandwidth, same power');
            C.hline(Math.LOG2E, { color: 'faint', width: 1.2, dash: [5, 4] });
            C.text('asymptote log₂ e = 1.443', 5.1, Math.LOG2E, { dy: -8, align: 'right', size: 11.5, color: 'muted', weight: 600 });
            C.fn((x) => (x <= 0 ? 0 : x * Math.log2(1 + 1 / x)), { color: 'accent', width: 2.6, domain: [0.001, 5.2] });
            const x = M.clamp((hp.x + 20) / 50 * 5.2, 0.02, 5.1), cap = x * Math.log2(1 + 1 / x);
            hp.set(hp.x, 0);
            C.dot(x, cap, { r: 6, color: 'gold' });
            C.text(`W = ${v.fix(x, 2)} W₀: C = ${v.fix(cap, 3)} W₀`, x, cap, { dx: 8, dy: 16, align: 'left', size: 12, weight: 700, color: 'gold', plate: true });
            st = { rel, x, cap, f7: true };
          }
          hp.visible = fig.value === 'f6';
        });
        v.legend([['ink', 'band-limited signal (≤ W)'], ['gold', 'samples', { dot: true }], ['green', 'sinc rebuild', { dash: true }], ['accent', 'ideal: C = W log₂(1 + P/N)'], ['red', 'PCM, m levels (recomputed)', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const b = PCM[0];
          const right = st.f7 ? `Fig. 7: at W = ${v.fix(st.x, 2)} W₀ the capacity is ${v.fix(st.cap, 3)} W₀; it never exceeds 1.443 W₀ = 1.443 P/N₀, however wide the band.` :
            `at P/N = ${v.fix(st.x, 1)} db the ideal system carries ${v.fix(st.cap, 2)} bits per cycle · binary PCM at one error in 10⁵ needs ${v.fix(db(b.snr), 1)} db for 2 bits per cycle, the ideal 4.8 db: a gap of **${v.fix(db(b.snr) - db(3), 1)} db** (Shannon: “about 8 db”) · today turbo codes (0.7 db) and LDPC codes (0.19 db, within 0.0045 db of the binary-input limit) sit almost on the curve at 1 bit per cycle, whose ideal is 0 db.`;
          return `sampling at ${v.fix(fsr.value, 2)} × the Nyquist rate 2W: rebuild error ${v.fix(100 * st.rel, 1)}% (the small residual above 2W comes from truncating the infinite sinc series) · ${right}`;
        });
      },
    },
  ],
};
