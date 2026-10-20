// Waves & Optics — Chapter 3: Dispersion and wave packets
import { TAU, MEDIA, dwdk } from './ch03.shared.js';

export default {
  collection: 'waves',
  chapter: 3,
  title: 'Dispersion and wave packets',
  summary: String.raw`When wave speed depends on frequency, a wave group travels at the group velocity $d\omega/dk$ rather than the phase velocity, and pulses spread as they go. Beats and modulation show the idea in miniature; water waves, periodic chains and waveguides give rich dispersion relations with wakes, band gaps and evanescent waves. Nonlinearity can balance dispersion to make solitons, and causality ties the dispersion of a medium to its absorption through the Kramers–Kronig relations.`,
  items: [
    // ------------------------------------------------------------------ 3.1
    {
      num: '3.1',
      kind: 'Phenomenon',
      name: 'Beats',
      statement: String.raw`Two harmonic waves of nearby frequencies $f_1$ and $f_2$ add to a signal that oscillates at the mean frequency $\bar f=(f_1+f_2)/2$ with an amplitude that swells and fades slowly. For equal amplitudes,
$$\cos 2\pi f_1t+\cos 2\pi f_2t=2\cos\big(\pi\,\Delta f\,t\big)\cos\big(2\pi\bar f t\big),\qquad \Delta f=|f_2-f_1|.$$
The envelope $2|\cos\pi\Delta f t|$ has zeros every $1/\Delta f$, so the loudness (the intensity) pulsates at the **beat frequency** $\Delta f$, the difference of the two frequencies, not at half of it. With unequal amplitudes $a_1,a_2$ the envelope $\sqrt{a_1^2+a_2^2+2a_1a_2\cos 2\pi\Delta f t}$ still repeats every $1/\Delta f$ but no longer reaches zero.`,
      idea: String.raw`This is superposition (1.6) applied to two harmonic waves (1.4), and the identity behind it is the product-to-sum formula. The cleanest way to see it is with rotating arrows: each tone is an arrow turning at its own frequency, and the sum is the diagonal of the parallelogram. The arrows line up and the sum is longest once per relative turn, that is once per $1/\Delta f$, and point oppositely half a turn later, which is why the pulsation rate is the *difference* of the two frequencies.`,
      caption: String.raw`Orange and purple are the two tones; blue is their sum with its envelope (green). The panel on the right shows the same two tones as arrows turning at $f_1$ and $f_2$: their vector sum (gold) is the instantaneous value, and its length oscillates between $a_1+a_2$ and $|a_1-a_2|$. Shrink $\Delta f$ and the beats slow down; lower $a_2/a_1$ and the nodes fill in. The speaker shifts the lower tone to 440 Hz while preserving the frequency difference and amplitude ratio.`,
      deps: ['waves-1.6'],
      see: ['music-2.3'],
      refs: ['Crawford ch. 6', 'Hecht ch. 7'],
      tags: ['beats', 'superposition'],
      scope: String.raw`Linear superposition of two sinusoids. The ear (or a detector) perceives a beat only when $\Delta f$ is small compared with $\bar f$ and less than a few tens of hertz; for larger differences it hears two separate tones.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Beat_(acoustics)' },
      viz(v) {
        const M = v.M, T = 4, NS = 4000;
        const f1S = v.slider('frequency $f_1$ (Hz)', 8, 16, 10, { step: 0.5 });
        const dS = v.slider('difference $\\Delta f=f_2-f_1$ (Hz)', 0.5, 3, 1, { step: 0.05 });
        const rS = v.slider('amplitude ratio $a_2/a_1$', 0.2, 1, 1, { step: 0.05 });
        v.soundButton('hear the beat (scaled to 440 Hz)', (snd) => snd.tone([[440, 1], [440 + dS.value, rS.value]], { duration: 4 }));
        const B = v.stage({ x: [0, T], y: [-2.3, 2.3], axes: 'box', gutter: true, xlabel: 'time (s)', yticks: [], height: 250, weight: 2.2, minWidth: 340, title: 'their sum' });
        const C = v.stage({ x: [-2.3, 2.3], y: [-2.3, 2.3], equal: true, axes: false, height: 250, weight: 1, minWidth: 240, title: 'turning arrows' });
        const A = v.stage({ x: [0, T], y: [-1.15, 1.15], axes: 'box', gutter: true, xlabel: 'time (s)', yticks: [], height: 150, full: true, title: 'the two tones' });
        let tm = null, vis = 0, fbar = 0, df = 0, tc = 0;
        v.animate((t) => {
          const f1 = f1S.value, d = dS.value, f2 = f1 + d, a1 = 1, a2 = rS.value;
          df = d; fbar = (f1 + f2) / 2; tc = t % T;
          const y1 = (x) => a1 * Math.cos(TAU * f1 * x), y2 = (x) => a2 * Math.cos(TAU * f2 * x);
          const env = (x) => Math.sqrt(a1 * a1 + a2 * a2 + 2 * a1 * a2 * Math.cos(TAU * d * x));
          A.fn(y1, { color: 'orange', width: 1.5, n: 1600 });
          A.fn(y2, { color: 'purple', width: 1.5, n: 1600 });
          B.fn((x) => env(x), { color: 'green', width: 1.6, dash: [5, 4], n: 600 });
          B.fn((x) => -env(x), { color: 'green', width: 1.6, dash: [5, 4], n: 600 });
          B.fn((x) => y1(x) + y2(x), { color: 'accent', width: 2.2, n: 1600 });
          B.vline(tc, { color: 'gold', width: 1.2, alpha: 0.7 });
          B.dot(tc, y1(tc) + y2(tc), { r: 5, color: 'gold' });
          // measured beat period: minima of the successive positive peak heights of the sum
          const pk = [];
          let prev = y1(0) + y2(0), cur = y1(T / NS) + y2(T / NS);
          for (let i = 2; i <= NS; i++) {
            const nxt = y1((i * T) / NS) + y2((i * T) / NS);
            if (cur > prev && cur >= nxt && cur > 0) pk.push([((i - 1) * T) / NS, cur]);
            prev = cur; cur = nxt;
          }
          const mx = Math.max(...pk.map((p) => p[1])), mins = [];
          for (let j = 1; j < pk.length - 1; j++) if (pk[j][1] < pk[j - 1][1] && pk[j][1] <= pk[j + 1][1] && pk[j][1] < 0.6 * mx) mins.push(pk[j][0]);
          tm = mins.length >= 2 ? (mins[mins.length - 1] - mins[0]) / (mins.length - 1) : null;
          vis = a1 * a2 > 0 ? (2 * a1 * a2) / (a1 * a1 + a2 * a2) : 0;
          // phasors
          const p1 = [a1 * Math.cos(TAU * f1 * tc), a1 * Math.sin(TAU * f1 * tc)];
          const p2 = [a2 * Math.cos(TAU * f2 * tc), a2 * Math.sin(TAU * f2 * tc)];
          C.circle(0, 0, a1 + a2, { color: 'faint', fill: false, width: 1, dash: [4, 4] });
          C.circle(0, 0, Math.abs(a1 - a2), { color: 'faint', fill: false, width: 1, dash: [4, 4] });
          C.arrow(0, 0, p1[0], p1[1], { color: 'orange', width: 2 });
          C.arrow(p1[0], p1[1], p1[0] + p2[0], p1[1] + p2[1], { color: 'purple', width: 2 });
          C.arrow(0, 0, p1[0] + p2[0], p1[1] + p2[1], { color: 'gold', width: 3 });
        }, { period: T, still: 1.37 });
        v.legend([['orange', 'tone 1, $f_1$'], ['purple', 'tone 2, $f_2$'], ['accent', 'sum'], ['green', 'envelope', { dash: true }], ['gold', 'vector sum']]);
        v.readout(() => `$\\bar f=${v.fix(fbar, 2)}$ Hz · $\\Delta f=${v.fix(df, 2)}$ Hz, so predicted beat period $1/\\Delta f=${v.fix(1 / df, 3)}$ s · measured from the minima of the peak heights: ${tm == null ? 'fewer than two beats in the window' : '$' + v.fix(tm, 3) + '$ s'} · envelope between ${v.fix(Math.abs(1 - rS.value), 2)} and ${v.fix(1 + rS.value, 2)} (relative to $a_1$), fringe visibility $2a_1a_2/(a_1^2+a_2^2)=${v.fix(vis, 3)}$`);
      },
    },
    // ------------------------------------------------------------------ 3.2
    {
      num: '3.2',
      kind: 'Method',
      name: 'Amplitude modulation and sidebands',
      statement: String.raw`**Amplitude modulation** multiplies a carrier $\cos\omega_c t$ by a slowly varying factor carrying the message. For a single-tone message of frequency $\omega_m\ll\omega_c$ and modulation index $m$,
$$y(t)=\big(1+m\cos\omega_m t\big)\cos\omega_c t=\cos\omega_c t+\tfrac m2\cos(\omega_c+\omega_m)t+\tfrac m2\cos(\omega_c-\omega_m)t .$$
The spectrum is the carrier flanked by two **sidebands** at $\omega_c\pm\omega_m$, each of relative amplitude $m/2$, so the signal occupies a band of width $2\omega_m$ (for a general message, twice its bandwidth). A detector that follows the envelope of $y$ recovers the message $1+m\cos\omega_m t$ if $m\le 1$; for $m>1$ the factor $1+m\cos\omega_m t$ changes sign, the envelope is $|1+m\cos\omega_m t|$ and the recovered message is distorted (**overmodulation**).`,
      idea: String.raw`The product of two cosines is a sum of two cosines, which turns "carrier times message" into three spectral lines; for a general message the same argument applies line by line, which is the multiplication-to-shifting property of the Fourier transform (2.9): multiplying by $\cos\omega_c t$ copies the message spectrum to $\pm\omega_c$. Beats (3.1) are the two-line case seen in time. The sidebands carry all the information, and the carrier is only a reference. The envelope detector measures $|{\rm envelope}|$, which equals the message only while the message-plus-one stays positive.`,
      caption: String.raw`Raise the modulation index $m$: the envelope (dashed) deepens, and the spectrum shows the sidebands growing as $m/2$ (they are measured from an FFT of the plotted signal). At $m=1$ the envelope just touches zero. Beyond $m=1$ the envelope detector (rectify, then average over one carrier period; green) no longer follows the message (blue dashed): it folds the negative part back up. The spectrum itself is still three lines: the distortion is in the detector, not in the sidebands.`,
      deps: ['waves-3.1', 'waves-2.9'],
      see: ['sig-4.1'],
      refs: ['Crawford ch. 6'],
      tags: ['modulation', 'spectrum'],
      scope: String.raw`Holds for $\omega_m\ll\omega_c$ (the envelope is defined) and a linear detector. The simple envelope detector used here is the rectify-and-average model, not a circuit simulation.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Amplitude_modulation' },
      viz(v) {
        const M = v.M, N = 4096;
        const fcS = v.slider('carrier $f_c$ (Hz)', 24, 64, 40, { int: true });
        const fmS = v.slider('message $f_m$ (Hz)', 1, 5, 2, { int: true });
        const mS = v.slider('modulation index $m$', 0, 2, 0.6, { step: 0.05 });
        const A = v.stage({ x: [0, 1], y: [-2.3, 2.3], axes: 'box', gutter: true, xlabel: 'time (s)', yticks: [], height: 230, full: true, title: 'modulated carrier and its envelope' });
        const B = v.stage({ x: [0, 1], y: [-1.2, 2.5], axes: 'box', gutter: true, xlabel: 'time (s)', height: 220, weight: 1, minWidth: 300, title: 'message and what a detector recovers', yticks: [0, 1, 2] });
        const C = v.stage({ x: [20, 60], y: [0, 1.15], axes: 'box', gutter: true, xlabel: 'frequency (Hz)', ylabel: 'amplitude', height: 220, weight: 1, minWidth: 300, title: 'spectrum (FFT)' });
        let sbm = 0, err = 0, over = false;
        const y = new Float64Array(N);
        v.render(() => {
          const fc = fcS.value, fm = fmS.value, m = mS.value;
          for (let i = 0; i < N; i++) { const t = i / N; y[i] = (1 + m * Math.cos(TAU * fm * t)) * Math.cos(TAU * fc * t); }
          const msg = (t) => 1 + m * Math.cos(TAU * fm * t);
          A.fn((t) => msg(t), { color: 'green', width: 1.5, dash: [5, 4], n: 400 });
          A.fn((t) => -msg(t), { color: 'green', width: 1.5, dash: [5, 4], n: 400 });
          A.path(Array.from(y, (yy, i) => [i / N, yy]), { color: 'accent', width: 1.4 });
          // envelope detector: rectify, average over one carrier period (circular), scale by pi/2
          const W = Math.max(2, Math.round(N / fc)), det = new Float64Array(N);
          let acc = 0; for (let j = 0; j < W; j++) acc += Math.abs(y[(j - (W >> 1) + N) % N]);
          for (let i = 0; i < N; i++) { det[i] = (acc / W) * (Math.PI / 2); acc += Math.abs(y[(i + 1 + (W >> 1)) % N]) - Math.abs(y[(i - (W >> 1) + N) % N]); }
          B.fn(msg, { color: 'accent', width: 2, dash: [5, 4], n: 400 });
          B.path(Array.from(det, (d, i) => [i / N, d]).filter((_, i) => i % 4 === 0), { color: 'green', width: 2.4 });
          B.hline(0, { color: 'faint', width: 1 });
          let s2 = 0, cnt = 0;
          for (let i = 0; i < N; i++) { const t = i / N; if (t > 0.05 && t < 0.95) { const e = det[i] - msg(t); s2 += e * e; cnt++; } }
          err = Math.sqrt(s2 / cnt); over = m > 1;
          const X = M.fftReal(Array.from(y));
          const amp = (k) => (2 * Math.hypot(X.re[k], X.im[k])) / N;
          B.setView([0, 1], [Math.min(-0.2, 1 - m - 0.2), Math.max(2.5, 1 + m + 0.3)]);
          C.setView([Math.max(0, fc - 5 * fm - 2), fc + 5 * fm + 2], [0, 1.15]);
          for (let k = Math.max(1, Math.floor(fc - 5 * fm - 2)); k <= fc + 5 * fm + 2; k++) {
            const a = amp(k);
            if (a > 1e-3) C.line(k, 0, k, a, { color: k === fc ? 'accent' : 'orange', width: 4 });
          }
          sbm = (amp(fc - fm) + amp(fc + fm)) / 2 / amp(fc);
          C.text('carrier', fc, amp(fc) + 0.06, { color: 'accent', size: 12, align: 'center' });
          C.text('$f_c-f_m$', fc - fm, amp(fc - fm) + 0.06, { color: 'orange', size: 12, align: 'center' });
          C.text('$f_c+f_m$', fc + fm, amp(fc + fm) + 0.06, { color: 'orange', size: 12, align: 'center' });
        });
        v.legend([['accent', 'signal / carrier'], ['green', 'envelope $1+m\\cos\\omega_m t$ (A), detector output (B)'], ['orange', 'sidebands']]);
        v.readout(() => `$m=${v.fix(mS.value, 2)}$ · sideband/carrier from the FFT $=${v.fix(sbm, 3)}$ against the predicted $m/2=${v.fix(mS.value / 2, 3)}$ · occupied band $2f_m=${2 * fmS.value}$ Hz · rms error of the recovered message $=${v.fix(err, 3)}$ ${over ? ' — **overmodulated**: the detector returns $|1+m\\cos\\omega_m t|$' : ' (small: the message is recovered)'}`);
      },
    },
    // ------------------------------------------------------------------ 3.3
    {
      num: '3.3',
      kind: 'Definition',
      name: 'Dispersion relation',
      statement: String.raw`A linear, translation-invariant medium supports harmonic waves $e^{i(kx-\omega t)}$ only for those pairs $(k,\omega)$ that satisfy a medium-dependent relation
$$\omega=\omega(k)\qquad(\text{equivalently } k=k(\omega)),$$
the **dispersion relation**. It encodes everything about linear propagation: the **phase velocity** of a harmonic wave is $v_p=\omega/k$, the wavelength is $\lambda=2\pi/k$, the period $T=2\pi/\omega$. A medium is **non-dispersive** when $\omega=ck$ is a straight line through the origin (all wavelengths travel at the same speed); otherwise it is **dispersive**. Examples: the ideal string $\omega=ck$; a stiff string $\omega^2=c^2k^2(1+k^2/k_0^2)$; a chain of masses $m$ joined by springs $K$ with spacing $a$, $\omega=2\sqrt{K/m}\,|\sin(ka/2)|$; a cold plasma, $\omega^2=\omega_p^2+c^2k^2$; deep water, $\omega^2=gk$.`,
      idea: String.raw`Substituting a plane wave into the linear equation of motion turns each derivative into a multiplication, $\partial_x\to ik$ and $\partial_t\to-i\omega$, so the PDE becomes an algebraic relation between $\omega$ and $k$; this is how the string's $\omega=ck$ (1.3, 1.4), the chain's sine law (mech-11.8) and the others are obtained. Because the equation is linear, any wave is a sum of such plane waves (2.9), each evolving with its own $\omega(k)$, so the dispersion relation determines the whole dynamics.`,
      caption: String.raw`Choose a medium and drag the gold point along its $\omega(k)$ curve (dashed: the non-dispersive line $\omega=k$). On the right the corresponding sinusoid $\cos(kx-\omega t)$ runs: the red marks follow its crests, the blue dot is a fixed probe that oscillates with period $T=2\pi/\omega$. The chain's curve ends at the zone edge $k=\pi/a$: shorter waves are indistinguishable from longer ones on the beads. Units are chosen so that the relevant constants equal 1 ($c=1$, $g=1$, $a=1$, $\omega_p=1$).`,
      deps: ['waves-1.4', 'mech-11.8', 'pde-9.3'],
      see: ['pde-9.3', 'mech-11.8'],
      refs: ['Crawford ch. 6'],
      tags: ['dispersion', 'phase velocity'],
      scope: String.raw`Linear, translation-invariant, time-independent media. The formulas drawn are the standard idealised relations for each medium (the stiff string, plasma and deep water are small-parameter models).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Dispersion_relation' },
      viz(v) {
        const keys = ['none', 'stiff', 'chain', 'plasma', 'deep'];
        const sel = v.select('medium', [{ value: 'none', label: 'string' }, { value: 'stiff', label: 'stiff string' }, { value: 'chain', label: 'chain of masses' }, { value: 'plasma', label: 'plasma' }, { value: 'deep', label: 'deep water' }], 'chain');
        const A = v.stage({ x: [0, 3.5], y: [0, 4.2], axes: 'box', gutter: true, xlabel: 'wavenumber k', ylabel: 'frequency ω', height: 300, weight: 1, minWidth: 300, title: 'dispersion relation' });
        const B = v.stage({ x: [0, 25], y: [-1.5, 1.5], axes: 'box', gutter: true, xlabel: 'position x', yticks: [], height: 300, weight: 1.3, minWidth: 320, title: 'the wave with this (k, ω)' });
        const kmax = () => (sel.value === 'chain' ? Math.PI : 3.2);
        const w = () => MEDIA[sel.value].w;
        const h = A.handle(1, MEDIA.chain.w(1), { color: 'gold', r: 8, label: 'k, ω', constrain: (x) => { const kk = v.M.clamp(x, 0.15, kmax()); return [kk, w()(kk)]; } });
        let vp = 0, tcur = 0;
        v.animate((t) => {
          const f = w(), kk = h.x, om = f(kk); tcur = t;
          h.set(kk, om);
          A.fn((x) => x, { color: 'muted', width: 1.2, dash: [5, 4], domain: [0, 3.4] });
          A.fn(f, { color: 'accent', width: 3, domain: [0.001, kmax()] });
          if (sel.value === 'chain') { A.vline(Math.PI, { color: 'faint', width: 1, dash: true }); A.text('zone edge π/a', Math.PI - 0.05, 3.8, { color: 'muted', size: 12, align: 'right' }); }
          A.line(0, 0, kk, om, { color: 'red', width: 1.2, dash: [3, 3] });
          // wave
          const u = (x) => Math.cos(kk * x - om * t);
          B.fn(u, { color: 'accent', width: 2.8, n: 600 });
          for (let j = -2; j < 60; j++) { const xc = (om * t + TAU * j) / kk; if (xc > 0 && xc < 25) B.dot(xc, 1, { r: 4.5, color: 'red' }); }
          B.dot(12, u(12), { r: 7, color: 'blue' });
          B.vline(12, { color: 'faint', width: 1, dash: true });
          vp = om / kk;
        }, { still: 1.1 });
        v.legend([['accent', 'ω(k)'], ['muted', 'ω = k (non-dispersive)', { dash: true }], ['red', 'crests'], ['blue', 'fixed probe']]);
        v.readout(() => {
          const kk = h.x, om = w()(kk);
          return `$k=${v.fix(kk, 2)}$, $\\lambda=2\\pi/k=${v.fix(TAU / kk, 2)}$ · $\\omega=${v.fix(om, 3)}$, $T=2\\pi/\\omega=${v.fix(TAU / om, 2)}$ · phase velocity $\\omega/k=${v.fix(vp, 3)}$ (a crest moves $\\lambda$ in time $T$: $\\lambda/T=${v.fix(TAU / kk / (TAU / om), 3)}$) · ${Math.abs(vp - 1) < 1e-6 && sel.value === 'none' ? 'non-dispersive: $\\omega/k$ is the same for every $k$' : 'dispersive: $\\omega/k$ changes with $k$'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 3.4
    {
      num: '3.4',
      kind: 'Definition',
      name: 'Phase velocity and group velocity',
      statement: String.raw`For a medium with dispersion relation $\omega(k)$ the **phase velocity** is $v_p=\omega/k$: the speed of the crests of a single harmonic wave. The **group velocity** is
$$v_g=\frac{d\omega}{dk},$$
the slope of the dispersion curve. Two waves of wavenumbers $k_0\pm\delta$ and frequencies $\omega_1,\omega_2$ add to
$$\cos(k_1x-\omega_1t)+\cos(k_2x-\omega_2t)=2\cos\!\Big(\delta\,x-\tfrac{\omega_2-\omega_1}{2}\,t\Big)\cos\!\big(k_0x-\bar\omega t\big),$$
a carrier whose crests move at $\bar\omega/k_0$ inside an envelope that moves at $(\omega_2-\omega_1)/(k_2-k_1)$. As $\delta\to0$ the envelope speed tends to $d\omega/dk$ at $k_0$. In a non-dispersive medium the two coincide; otherwise crests slide through the envelope, forwards when $v_p>v_g$ and backwards when $v_p<v_g$.`,
      idea: String.raw`Beats (3.1) in space and time: the product-to-sum identity separates a fast carrier from a slow envelope, and the envelope's speed is the ratio of its frequency to its wavenumber, which are the *differences* $\Delta\omega$ and $\Delta k$ of the components. On the dispersion curve (3.3) that ratio is the slope of the chord joining the two points; shrinking the chord gives the tangent. The crest speed is instead the slope of the line from the origin. The mean value theorem (pma 5.10) identifies the two-wave envelope speed with $\omega\prime(\xi)$ at some intermediate wavenumber, provided $\omega$ is continuous on that interval and differentiable inside it. If $\omega\prime$ is continuous near $k_0$, shrinking the interval makes this chord speed tend to $\omega\prime(k_0)$. This explains the derivative limit without equating a finite-band chord with the derivative exactly.`,
      caption: String.raw`Choose a medium and drag the gold point to set the mean wavenumber $k_0$; the slider sets the half-separation $\delta$. Left: the sum of the two waves moving in time, a red mark following a crest (speed $\omega/k$) and a green mark riding the envelope peak (speed $\Delta\omega/\Delta k$); watch the crests slip through the envelope. Right: the red line from the origin has slope $v_p$; the green chord between the two component points has slope $v_g$, almost the tangent for small $\delta$. For deep water the envelope moves at half the crest speed; for capillary ripples faster than the crests.`,
      deps: ['waves-3.3', 'waves-3.1', 'pma-5.10'],
      refs: ['Crawford ch. 6', 'Hecht ch. 7'],
      tags: ['group velocity', 'phase velocity'],
      credit: 'Group velocity: attributed to W. R. Hamilton (1839); full treatment in Rayleigh, Theory of Sound (1877)',
      scope: String.raw`Two-component picture valid for any dispersion relation; identifying the envelope speed with $d\omega/dk$ needs $\delta$ small enough that $\omega(k)$ is nearly straight over $[k_1,k_2]$.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Group_velocity' },
      viz(v) {
        const sel = v.select('medium', [{ value: 'none', label: 'non-dispersive' }, { value: 'deep', label: 'deep water' }, { value: 'cap', label: 'capillary ripples' }, { value: 'plasma', label: 'plasma-like' }], 'deep');
        const dS = v.slider('half-separation $\\delta$', 0.05, 0.4, 0.15, { step: 0.01 });
        const TT = 12;
        const A = v.stage({ x: [-5, 40], y: [-2.6, 2.6], axes: 'box', gutter: true, xlabel: 'position x', yticks: [], height: 280, weight: 1.6, minWidth: 340, title: 'sum of two waves' });
        const B = v.stage({ x: [0, 3.2], y: [0, 3.2], axes: 'box', gutter: true, xlabel: 'k', ylabel: 'ω', height: 280, weight: 1, minWidth: 280, title: 'on the dispersion curve' });
        const w = () => MEDIA[sel.value].w;
        const h = B.handle(1.2, MEDIA.deep.w(1.2), { color: 'gold', r: 8, label: 'k₀', constrain: (x) => { const kk = v.M.clamp(x, 0.55, 2.4); return [kk, w()(kk)]; } });
        let vpm = 0, vgc = 0, vgt = 0;
        v.animate((t) => {
          const f = w(), k0 = h.x, d = dS.value, k1 = k0 - d, k2 = k0 + d, w1 = f(k1), w2 = f(k2);
          h.set(k0, f(k0));
          const wb = (w1 + w2) / 2, dw = (w2 - w1) / 2;
          vpm = wb / k0; vgc = dw / d; vgt = dwdk(f, k0);
          const tc = t % TT;
          const y = (x) => Math.cos(k1 * x - w1 * tc) + Math.cos(k2 * x - w2 * tc);
          const E = (x) => 2 * Math.abs(Math.cos(d * x - dw * tc));
          A.fn(E, { color: 'green', width: 1.6, dash: [5, 4], n: 500 });
          A.fn((x) => -E(x), { color: 'green', width: 1.6, dash: [5, 4], n: 500 });
          A.fn(y, { color: 'accent', width: 2.2, n: 1400 });
          const xc = vpm * tc, xg = vgc * tc;
          A.vline(xc, { color: 'red', width: 1, alpha: 0.5, dash: true });
          A.dot(xc, y(xc), { r: 6, color: 'red' });
          A.dot(xg, E(xg), { r: 7, color: 'green' });
          A.text('t = ' + v.fix(tc, 1), 39.5, -2.3, { color: 'muted', size: 12, align: 'right' });
          B.fn(f, { color: 'accent', width: 2.8, domain: [0.01, 3.2] });
          B.line(0, 0, k0, wb, { color: 'red', width: 2 });
          B.line(k1, w1, k2, w2, { color: 'green', width: 3.2 });
          const ext = 0.7; B.line(k0 - ext, f(k0) - ext * vgt, k0 + ext, f(k0) + ext * vgt, { color: 'ink', width: 1, dash: [3, 3] });
          B.dot(k1, w1, { r: 4.5, color: 'green' }); B.dot(k2, w2, { r: 4.5, color: 'green' });
        }, { period: TT, still: 7 });
        v.legend([['red', 'crest, speed $\\bar\\omega/k_0$'], ['green', 'envelope, speed $\\Delta\\omega/\\Delta k$'], ['ink', 'tangent $d\\omega/dk$', { dash: true }]]);
        v.readout(() => `$k_0=${v.fix(h.x, 2)}$ · crest speed $\\bar\\omega/k_0=${v.fix(vpm, 3)}$ · envelope speed $\\Delta\\omega/\\Delta k=${v.fix(vgc, 3)}$ · tangent slope $d\\omega/dk=${v.fix(vgt, 3)}$ (difference ${v.fix(Math.abs(vgc - vgt), 4)}, shrinking as $\\delta\\to0$) · $v_g/v_p=${v.fix(vgc / vpm, 2)}$`);
      },
    },
    // ------------------------------------------------------------------ 3.5
    {
      num: '3.5',
      kind: 'Theorem',
      name: 'Wave packets travel at the group velocity',
      statement: String.raw`Let a wave packet be a superposition $\psi(x,t)=\int A(k)\,e^{i(kx-\omega(k)t)}\,dk$ whose amplitude $A$ is concentrated in a narrow band around $k_0$ (width $\sigma_k$), in a medium with smooth dispersion relation $\omega(k)$. Then for times short enough that the dispersive spreading is still small the packet's envelope moves rigidly with the **group velocity** $v_g=\omega'(k_0)$:
$$|\psi(x,t)|\approx|\psi(x-v_gt,\,0)|,$$
while the carrier crests move at $\omega(k_0)/k_0$. More precisely, $\omega(k)\approx\omega_0+v_g(k-k_0)+\tfrac12\omega''(k_0)(k-k_0)^2+\dots$, the linear term gives pure translation at $v_g$, and the quadratic and higher terms are what distort the packet (3.6).`,
      idea: String.raw`Use $\kappa=k-k_0$ as the offset. Expanding $\omega$ about $k_0$ gives $\psi=e^{i(k_0x-\omega_0t)}J$, where $J$ integrates $A(k_0+\kappa)$ times $e^{i\kappa(x-v_gt)}$ and the remaining phase $e^{-itR(\kappa)}$. Here $R(\kappa)=\tfrac12\omega''(k_0)\kappa^2+\cdots$. If the neglected terms are small over the band, what remains is the Fourier integral of $A$ evaluated at $x-v_gt$: the initial envelope, translated. The stationary-phase view says the same: the integrand oscillates wildly in $k$ except where the phase $kx-\omega(k)t$ is stationary, i.e. $x=\omega'(k)t$, and the main contribution comes from near $k_0$. This uses that a pulse is a continuous superposition of waves (2.9) and the two-wave result (3.4). Taylor's theorem (pma 5.15) controls the dropped phase: on a retained band
$$|k-k_0|\le\Delta k,$$
where $|\omega\prime\prime|\le M$, the first-order remainder has magnitude at most $M(k-k_0)^2/2$. The phase error is therefore at most $|t|M\Delta k^2/2$. A small bound justifies the rigid-envelope approximation on that band; curvature or a long elapsed time invalidates it.`,
      caption: String.raw`Choose a medium and drag the gold point to change the central wavenumber $k_0$; the slider changes the spectral width (a narrower spectrum is a longer packet). Top: the packet at time $t$ and its envelope; the green marker is the peak found numerically from the sum of 61 plane waves. Bottom left: the space–time map of $|\psi|^2$: the bright ridge is a straight line of slope $\omega'(k_0)$ (green), not the crest line (red dashed). Bottom right: where $k_0$ sits on the dispersion curve, with its tangent.`,
      deps: ['waves-3.4', 'waves-2.9', 'pma-5.15'],
      refs: ['Crawford ch. 6'],
      tags: ['wave packet', 'group velocity'],
      scope: String.raw`Valid when $\omega''(k_0)\,\sigma_k^2\,t\ll1$ (narrow-band packet, short times); beyond that the packet spreads while its centre still moves at $v_g$ (to this order).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Wave_packet' },
      viz(v) {
        const sel = v.select('medium', [{ value: 'none', label: 'non-dispersive' }, { value: 'deep', label: 'deep water' }, { value: 'cap', label: 'capillary ripples' }, { value: 'plasma', label: 'plasma-like' }], 'deep');
        const sS = v.slider('spectral width $\\sigma_k$', 0.05, 0.25, 0.1, { step: 0.01 });
        const TM = 20, XL = -20, XR = 60, NK = 61;
        const A = v.stage({ x: [XL, XR], y: [-1.15, 1.15], axes: 'box', gutter: true, xlabel: 'position x', yticks: [], height: 190, full: true, title: 'the packet now' });
        const B = v.stage({ x: [XL, XR], y: [0, TM], axes: 'box', gutter: true, xlabel: 'position x', ylabel: 'time', height: 300, weight: 1.6, minWidth: 320, title: 'space–time map of |ψ|²' });
        const C = v.stage({ x: [0, 3.2], y: [0, 3.2], axes: 'box', gutter: true, xlabel: 'k', ylabel: 'ω', height: 300, weight: 1, minWidth: 260, title: 'dispersion curve' });
        const w = () => MEDIA[sel.value].w;
        const h = C.handle(1.2, MEDIA.deep.w(1.2), { color: 'gold', r: 8, label: 'k₀', constrain: (x) => { const kk = v.M.clamp(x, 0.6, 2.3); return [kk, w()(kk)]; } });
        const modes = () => {
          const k0 = h.x, s = sS.value, f = w(), ks = [], am = [], om = [];
          for (let i = 0; i < NK; i++) { const k = k0 + ((i / (NK - 1)) * 2 - 1) * 3 * s; ks.push(k); am.push(Math.exp(-((k - k0) ** 2) / (2 * s * s))); om.push(f(k)); }
          let sa = 0; for (const a of am) sa += a;
          return { ks, am, om, sa, k0 };
        };
        const psi = (P, x, t) => { let re = 0, im = 0; for (let i = 0; i < NK; i++) { const ph = P.ks[i] * x - P.om[i] * t; re += P.am[i] * Math.cos(ph); im += P.am[i] * Math.sin(ph); } return [re / P.sa, im / P.sa]; };
        let P = modes(), xpk = 0, vg = 0, tt = 0;
        v.animate((t) => {
          P = modes(); const f = w(), k0 = P.k0; h.set(k0, f(k0)); vg = dwdk(f, k0); tt = t % TM;
          const env = (x) => { const z = psi(P, x, tt); return Math.hypot(z[0], z[1]); };
          const re = (x) => psi(P, x, tt)[0];
          A.fn(env, { color: 'green', width: 1.6, dash: [5, 4], n: 360 });
          A.fn((x) => -env(x), { color: 'green', width: 1.6, dash: [5, 4], n: 360 });
          A.fn(re, { color: 'accent', width: 2.2, n: 900 });
          let best = -1; for (let i = 0; i <= 400; i++) { const x = XL + ((XR - XL) * i) / 400, e = env(x); if (e > best) { best = e; xpk = x; } }
          A.dot(xpk, best, { r: 6, color: 'green' });
          A.vline(vg * tt, { color: 'green', width: 1, alpha: 0.5, dash: true });
          // space-time map
          B.raster((x, tm) => { const z = psi(P, x, tm), q = z[0] * z[0] + z[1] * z[1]; return v.ramp(Math.min(1, Math.sqrt(q)), 'accent', 'panel'); }, { res: 3, key: `${sel.value}|${k0.toFixed(3)}|${sS.value}|${v.color('panel')}` });
          B.line(0, 0, vg * TM, TM, { color: 'green', width: 2 });
          const vp = f(k0) / k0; B.line(0, 0, vp * TM, TM, { color: 'red', width: 1.5, dash: [5, 4] });
          B.hline(tt, { color: 'gold', width: 1.4 });
          C.fn(f, { color: 'accent', width: 2.8, domain: [0.01, 3.2] });
          const e = 0.8; C.line(k0 - e, f(k0) - e * vg, k0 + e, f(k0) + e * vg, { color: 'green', width: 2 });
          C.vband(k0 - 3 * sS.value, k0 + 3 * sS.value, { color: 'orange', alpha: 0.18 });
        }, { period: TM, still: 14 });
        v.legend([['accent', 'real part of ψ'], ['green', 'envelope; ridge $x=v_gt$'], ['red', 'crest line $x=v_pt$', { dash: true }], ['orange', 'spectrum band']]);
        v.readout(() => `$k_0=${v.fix(P.k0, 2)}$ · group velocity $\\omega'(k_0)=${v.fix(vg, 3)}$, phase velocity $${v.fix(w()(P.k0) / P.k0, 3)}$ · at $t=${v.fix(tt, 1)}$ the numerically located peak is at $x=${v.fix(xpk, 1)}$, prediction $v_gt=${v.fix(vg * tt, 1)}$ (difference ${v.fix(Math.abs(xpk - vg * tt), 1)}, growing slowly with the spreading)`);
      },
    },
    // ------------------------------------------------------------------ 3.6
    {
      num: '3.6',
      kind: 'Phenomenon',
      name: 'Dispersive spreading of a pulse',
      statement: String.raw`Let a narrow-band pulse with initial Gaussian envelope $\psi(x,0)=e^{-x^2/4\sigma_0^2}$ (so $|\psi|^2$ has rms width $\sigma_0$) travel in a medium whose dispersion relation has curvature $\beta=\omega''(k_0)$. In the frame moving at the group velocity, the envelope obeys $i\partial_t\psi=-\tfrac{\beta}{2}\partial_x^2\psi$ and stays Gaussian with an rms width
$$\sigma(t)=\sigma_0\sqrt{1+\Big(\frac{t}{\tau}\Big)^{2}},\qquad \tau=\frac{2\sigma_0^2}{|\beta|},$$
and a **chirp**: the local wavenumber (the $x$-derivative of the phase) varies linearly across the pulse,
$$q(x,t)=\frac{(t/\tau)\,\operatorname{sgn}\beta}{2\sigma_0^{2}\,\big(1+(t/\tau)^2\big)}\;x .$$
If $\beta=0$ (non-dispersive, or at a point of zero curvature) the shape is preserved to this order. Shorter pulses (larger bandwidth) have smaller $\tau\propto\sigma_0^2$ and spread sooner.`,
      idea: String.raw`In wavenumber space the pulse is a Gaussian (the Gaussian is its own Fourier transform, fa-7.6), and propagation multiplies each component by the phase $e^{-i\beta(k-k_0)^2t/2}$. A Gaussian times a quadratic phase is still a Gaussian with complex width $\sigma_0^2+i\beta t/2$, which gives both the growth of the width and the chirp: the faster components, which sit at one end of the pulse, drift away from the slower ones. The group velocity (3.5) sets where the pulse is; the curvature $\beta$ sets how fast it fattens. The Gaussian integral (pma 8.21) evaluates the intensity normalization: for $a>0$, $\int e^{-ax^2}dx=\sqrt{\pi/a}$, and differentiating in $a$ gives the normalized second moment $1/(2a)$. This is why the Gaussian intensity parameter is its rms width. Plancherel (rca 9.13) then shows that multiplication of its spectrum by the unit-modulus quadratic propagation phase preserves the continuum $L^2$ norm. The widening Gaussian must reduce its peak accordingly; the finite periodic FFT has the corresponding discrete norm identity and its own finite-window limitations.`,
      caption: String.raw`Top: the real wave in the frame of the packet (blue) with its envelope (green) and initial envelope (dashed), propagated by an FFT of the Gaussian with the quadratic phase. Bottom left: the rms width of $|\psi|^2$ measured from the numerical field (dots follow the clock) against the predicted $\sigma_0\sqrt{1+(t/\tau)^2}$. Bottom right: the local wavenumber (red, measured from the phase) against the straight-line chirp prediction (dashed). Set the curvature $\beta$ to zero and nothing changes with time; widen the pulse (large $\sigma_0$) and the spreading slows down as $\tau\propto\sigma_0^2$.`,
      deps: ['waves-3.5', 'fa-7.6', 'pma-8.21', 'rca-9.13'],
      refs: ['Crawford ch. 6'],
      tags: ['dispersion', 'pulse spreading'],
      scope: String.raw`Quadratic (second-order) dispersion about the carrier $k_0$; third-order dispersion adds skewed tails and is neglected. In real media the sign of $\beta$ decides whether the chirp runs up or down.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Dispersion_(optics)' },
      viz(v) {
        const M = v.M, N = 1024, L = 120, dx = L / N, K0 = 5, TT = 24;
        const sS = v.slider('initial width $\\sigma_0$', 1, 4, 2, { step: 0.1 });
        const bS = v.slider('curvature $\\beta=\\omega\'\'(k_0)$', 0, 2, 1, { step: 0.05 });
        const A = v.stage({ x: [-30, 30], y: [-1.3, 1.3], axes: 'box', gutter: true, xlabel: 'x − vg·t', yticks: [], height: 230, full: true, title: 'the pulse in its own frame' });
        const B = v.stage({ x: [0, TT], y: [0, 4.5], axes: 'box', gutter: true, xlabel: 'time t', ylabel: 'σ(t) / σ₀', height: 230, weight: 1, minWidth: 280, title: 'width against time' });
        const C = v.stage({ x: [-20, 20], y: [-1.2, 1.2], axes: 'box', gutter: true, xlabel: 'x − vg·t', ylabel: 'local wavenumber q', height: 230, weight: 1, minWidth: 280, title: 'chirp' });
        const xs = Array.from({ length: N }, (_, i) => (i - N / 2) * dx);
        const field = (t) => {
          const s0 = sS.value, b = bS.value, re = new Float64Array(N), im = new Float64Array(N);
          for (let i = 0; i < N; i++) re[i] = Math.exp(-xs[i] * xs[i] / (4 * s0 * s0));
          M.fft(re, im);
          for (let i = 0; i < N; i++) {
            const kk = (TAU / L) * (i < N / 2 ? i : i - N), ph = -0.5 * b * kk * kk * t, c = Math.cos(ph), s = Math.sin(ph);
            const a = re[i], bb = im[i]; re[i] = a * c - bb * s; im[i] = a * s + bb * c;
          }
          M.ifft(re, im); return { re, im };
        };
        const widthOf = (F) => { let s = 0, m2 = 0; for (let i = 0; i < N; i++) { const q = F.re[i] ** 2 + F.im[i] ** 2; s += q; m2 += q * xs[i] * xs[i]; } return Math.sqrt(m2 / s); };
        let tn = 0, wn = 0, wp = 0, fitq = 0;
        v.animate((t) => {
          tn = t % TT; const s0 = sS.value, b = bS.value, tau = (2 * s0 * s0) / Math.max(b, 1e-9);
          const F = field(tn); wn = widthOf(F) / s0; wp = b === 0 ? 1 : Math.sqrt(1 + (tn / tau) ** 2);
          const idx = (x) => Math.min(N - 1, Math.max(0, Math.round(x / dx + N / 2)));
          const env = (x) => { const i = idx(x); return Math.hypot(F.re[i], F.im[i]); };
          A.fn((x) => Math.exp(-x * x / (4 * s0 * s0)), { color: 'muted', width: 1.2, dash: [5, 4], n: 400 });
          A.fn(env, { color: 'green', width: 1.6, n: 500 });
          A.fn((x) => -env(x), { color: 'green', width: 1.6, n: 500 });
          A.fn((x) => { const i = idx(x); return F.re[i] * Math.cos(K0 * x) - F.im[i] * Math.sin(K0 * x); }, { color: 'accent', width: 1.8, n: 1500 });
          // width curve
          B.fn((tt) => (b === 0 ? 1 : Math.sqrt(1 + (tt / tau) ** 2)), { color: 'green', width: 2.4, domain: [0, TT] });
          const pts = []; for (let j = 0; j <= 24; j++) { const tj = (TT * j) / 24; if (tj <= tn + 1e-9) pts.push([tj, widthOf(field(tj)) / s0]); }
          B.dots(pts, { r: 3, color: 'accent' });
          B.dot(tn, wn, { r: 7, color: 'gold' });
          // chirp: q = Im(psi* psi')/|psi|^2
          const q = []; let dev = 0, cnt = 0;
          for (let i = 1; i < N - 1; i++) {
            const x = xs[i]; if (Math.abs(x) > 20) continue;
            const m2 = F.re[i] ** 2 + F.im[i] ** 2; if (m2 < 1e-3) { q.push(null); continue; }
            const dr = (F.re[i + 1] - F.re[i - 1]) / (2 * dx), di = (F.im[i + 1] - F.im[i - 1]) / (2 * dx);
            const qq = (F.re[i] * di - F.im[i] * dr) / m2; q.push([x, qq]);
            const pred = b === 0 ? 0 : (tn / tau) * x / (2 * s0 * s0 * (1 + (tn / tau) ** 2));
            if (Math.abs(x) < 2 * s0) { dev = Math.max(dev, Math.abs(qq - pred)); cnt++; }
          }
          fitq = dev;
          C.fn((x) => (b === 0 ? 0 : (tn / tau) * x / (2 * s0 * s0 * (1 + (tn / tau) ** 2))), { color: 'muted', width: 1.6, dash: [5, 4] });
          C.path(q, { color: 'red', width: 2.4 });
        }, { period: TT + 2, still: 15 });
        v.legend([['accent', 'real wave'], ['green', 'envelope / predicted width'], ['muted', 'initial envelope; predicted chirp', { dash: true }], ['red', 'measured local wavenumber']]);
        v.readout(() => `$t=${v.fix(tn, 1)}$, $\\tau=2\\sigma_0^2/\\beta=${bS.value > 0 ? v.fix((2 * sS.value * sS.value) / bS.value, 1) : '\\infty'}$ · measured width $\\sigma/\\sigma_0=${v.fix(wn, 3)}$, predicted $\\sqrt{1+(t/\\tau)^2}=${v.fix(wp, 3)}$ · largest deviation of the measured chirp from the straight line (inside $|x|<2\\sigma_0$): ${v.fix(fitq, 4)}`);
      },
    },
    // ------------------------------------------------------------------ 3.7
    {
      num: '3.7',
      kind: 'Model',
      name: 'Deep and shallow water waves',
      statement: String.raw`Small-amplitude gravity waves on water of uniform depth $h$ (with $g$ the gravitational acceleration, surface tension and viscosity neglected) have the dispersion relation
$$\omega^2=g\,k\tanh(kh).$$
For long waves, $kh\ll1$ (**shallow water**), $\tanh kh\approx kh$ and $\omega\approx\sqrt{gh}\,k$: non-dispersive, with $v_p=v_g=\sqrt{gh}$. For short waves, $kh\gg1$ (**deep water**), $\tanh kh\to1$ and $\omega=\sqrt{gk}$: $v_p=\sqrt{g/k}$ grows with wavelength and the group velocity is exactly half the phase velocity,
$$v_g=\frac{v_p}{2}\Big(1+\frac{2kh}{\sinh 2kh}\Big)\longrightarrow\frac{v_p}{2}.$$
In deep water longer waves outrun shorter ones, and a group advances at half the speed of the crests inside it.`,
      idea: String.raw`The relation comes from solving Laplace's equation for the velocity potential in the water layer with the free-surface and bottom conditions; the depth dependence $\cosh k(z+h)$ makes the pressure restoring force $\propto k\tanh kh$. Taking the limits of $\tanh$ gives the two regimes, and differentiating the relation (3.4) gives $v_g$; $2kh/\sinh2kh\to1$ for $kh\to0$ and $\to0$ exponentially for large $kh$. In the shallow limit the dispersion relation reduces to the wave equation of 1.1, with speed set by depth.`,
      caption: String.raw`Drag the gold point along the speed curves (left) to change the depth for a fixed wavelength $\lambda=10$ m. The tank (right) holds a group made of two waves of nearby wavelength: the red mark follows a crest, the green mark follows the envelope. In deep water the group is visibly slower than the crests; in shallow water both move together at $\sqrt{gh}$ (dashed line on the left). Speeds are in units of $\sqrt{gh}$.`,
      deps: ['waves-3.3'],
      refs: ['Crawford ch. 6'],
      tags: ['water waves', 'dispersion'],
      scope: String.raw`Linear (small-amplitude) waves on an inviscid layer of uniform depth; surface tension matters for wavelengths below a few centimetres, and nonlinear steepening for waves comparable to the depth.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Airy_wave_theory' },
      viz(v) {
        const g = 9.81, lam = 10, k = TAU / lam, TT = 10, X0 = 8;
        const A = v.stage({ x: [0, 6], y: [0, 1.15], axes: 'box', gutter: true, xlabel: 'kh', ylabel: 'speed / √(gh)', height: 300, weight: 1, minWidth: 300, title: 'phase and group speed' });
        const B = v.stage({ x: [0, 60], y: [-10, 1.6], axes: 'box', gutter: true, xlabel: 'x (m)', ylabel: 'height (m)', height: 300, weight: 1.5, minWidth: 340, title: 'a wave group in a tank' });
        const vpF = (kh) => Math.sqrt(Math.tanh(kh) / kh);
        const vgF = (kh) => 0.5 * vpF(kh) * (1 + (2 * kh) / Math.sinh(2 * kh));
        const hd = A.handle(1.3, 0, { color: 'gold', r: 8, label: 'kh', constrain: (x) => [v.M.clamp(x, 0.1, 6), 0] });
        let kh = 1.3, d = 1, vp = 0, vg = 0;
        v.animate((t) => {
          kh = hd.x; hd.set(kh, vgF(kh)); const h = kh / k; d = h;
          A.fn(vpF, { color: 'red', width: 2.6, domain: [0.02, 6] });
          A.fn(vgF, { color: 'green', width: 2.6, domain: [0.02, 6] });
          A.hline(1, { color: 'muted', width: 1.2, dash: [5, 4] });
          A.fn((x) => 1 / Math.sqrt(x), { color: 'muted', width: 1.2, dash: [2, 4], domain: [0.9, 6] });
          A.dot(kh, vpF(kh), { r: 5, color: 'red' });
          const wf = (kk) => Math.sqrt(g * kk * Math.tanh(kk * h));
          const dd = 0.12 * k, k1 = k - dd, k2 = k + dd, w1 = wf(k1), w2 = wf(k2), wb = (w1 + w2) / 2, dw = (w2 - w1) / 2;
          vp = wb / k; vg = dw / dd;
          const tc = t % TT;
          const eta = (x) => 0.35 * (Math.cos(k1 * (x - X0) - w1 * tc) + Math.cos(k2 * (x - X0) - w2 * tc));
          const env = (x) => 0.7 * Math.abs(Math.cos(dd * (x - X0) - dw * tc));
          B.rect(0, -h, 60, -9.99, { fill: 'orange', fillAlpha: 0.25, hatch: 'orange', hatchGap: 6, stroke: false });
          B.line(0, -h, 60, -h, { color: 'orange', width: 3 });
          B.between((x) => -h, eta, 0, 60, { fill: 'accent', fillAlpha: 0.2 });
          B.fn(eta, { color: 'accent', width: 2.6, n: 700 });
          B.fn(env, { color: 'green', width: 1.4, dash: [5, 4], n: 400 });
          const xc = X0 + vp * tc, xg = X0 + vg * tc;
          B.dot(xc, eta(xc), { r: 6, color: 'red' }); B.dot(xg, env(xg), { r: 7, color: 'green' });
          B.text('depth h = ' + v.fix(h, 2) + ' m', 59, -h + 0.5, { color: 'muted', size: 12, align: 'right' });
        }, { period: TT, still: 6 });
        v.legend([['red', 'phase speed $v_p$'], ['green', 'group speed $v_g$'], ['muted', 'shallow limit $\\sqrt{gh}$; deep limit', { dash: true }]]);
        v.readout(() => {
          const h = d, c0 = Math.sqrt(g * h);
          return `$h=${v.fix(h, 2)}$ m, $kh=${v.fix(kh, 2)}$ · $v_p=${v.fix(vp, 2)}$ m/s, $v_g=${v.fix(vg, 2)}$ m/s, $v_g/v_p=${v.fix(vg / vp, 3)}$ (deep limit $0.5$) · shallow-water speed $\\sqrt{gh}=${v.fix(c0, 2)}$ m/s · regime: ${kh < 0.3 ? 'shallow (non-dispersive)' : kh > 3 ? 'deep (dispersive)' : 'intermediate'}`;
        });
      },
    },
  ],
};
