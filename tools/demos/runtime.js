// Visual test bench for runtime features (log axes, histograms, colour bars, polar grids, sound).
// Render with tools/harness.html?file=tools/demos/runtime.js&id=demo-1.1&theme=light, or `node tools/demos/shoot.mjs`.
export default {
  collection: 'demo',
  chapter: 1,
  title: 'Runtime demo',
  items: [
    {
      num: '1.1',
      kind: 'Theorem',
      name: 'Log axes: Bode magnitude and exponential decay',
      statement: String.raw`An $n$-th order Butterworth low-pass filter has $|H(f)| = 1/\sqrt{1+(f/f_c)^{2n}}$: on log–log axes it is flat, then falls at $20n$ dB per decade. Exponential decay is a straight line on a semi-log plot.`,
      caption: String.raw`Drag the cutoff $f_c$. Left: log–log axes over five decades. Right: log $y$ over less than two decades (mantissa ticks).`,
      viz(v) {
        const s = v.stage({ x: [1, 1e5], y: [1e-4, 4], xlog: true, ylog: true, axes: 'box', grid: true, xlabel: 'f (Hz)', ylabel: '|H|', height: 320 });
        const s2 = v.stage({ x: [0, 10], y: [0.5, 30], ylog: true, axes: 'box', grid: true, xlabel: 't', ylabel: 'N(t)', height: 320 });
        const fc = s.handle(300, Math.SQRT1_2, { color: 'accent', label: 'fc', constrain: (x) => [x, Math.SQRT1_2] });
        const tau = v.slider('$\\tau$', 0.5, 6, 2.5, { step: 0.05 });
        const orders = [[1, 'accent'], [2, 'orange'], [4, 'green']];
        v.render(() => {
          s.hband(Math.SQRT1_2, 1, { color: 'gold', alpha: 0.1 });
          s.vline(fc.x, { color: 'accent', dash: true, alpha: 0.6 });
          for (const [n, col] of orders) s.fn((f) => 1 / Math.sqrt(1 + (f / fc.x) ** (2 * n)), { color: col, width: 2.2 });
          s.dots([1, 10, 100, 1e3, 1e4, 1e5].map((f) => [f, 1 / Math.sqrt(1 + (f / fc.x) ** 2)]), { color: 'accent', r: 3 });
          s2.fn((t) => 25 * Math.exp(-t / tau.value), { color: 'purple', width: 2.4, fill: 'purple', fillAlpha: 0.1 });
          s2.hline(25 / Math.E, { color: 'muted', dash: true });
          s2.dot(tau.value, 25 / Math.E, { color: 'purple', label: 'τ', labelPos: 'ne' });
        });
        v.legend([['accent', '$n=1$'], ['orange', '$n=2$'], ['green', '$n=4$'], ['purple', '$25e^{-t/\\tau}$']]);
        v.readout(() => `$f_c$ = ${v.M.si(fc.x, 'Hz')}; at $10f_c$: $|H| = ${v.fix(1 / Math.sqrt(1 + 100), 4)}$ ($n=1$, −20 dB/decade)`);
      },
    },
    {
      num: '1.2',
      kind: 'Theorem',
      name: 'Log axes: very wide and audio-band ranges',
      statement: String.raw`Power laws $y = x^k$ are straight lines of slope $k$ on log–log axes. The A-weighting curve is drawn on a log-frequency axis over the audible band.`,
      caption: String.raw`Left: twelve decades in $x$ (labels thin to every few decades, $10^n$ style). Right: 20 Hz – 20 kHz with 2–5 mantissa labels.`,
      viz(v) {
        const s = v.stage({ x: [1e-3, 1e9], y: [1e-6, 1e6], xlog: true, ylog: true, axes: 'box', grid: true, height: 320, title: 'power laws' });
        const s2 = v.stage({ x: [20, 20000], y: [-50, 8], xlog: true, axes: 'box', grid: true, height: 320, xlabel: 'Hz', ylabel: 'dB', title: 'A-weighting' });
        const k = v.slider('$k$', -1, 1, 0.5, { step: 0.05 });
        const RA = (f) => (12194 ** 2 * f ** 4) / ((f * f + 20.6 ** 2) * Math.sqrt((f * f + 107.7 ** 2) * (f * f + 737.9 ** 2)) * (f * f + 12194 ** 2));
        v.render(() => {
          s.fn((x) => x ** k.value, { color: 'accent', width: 2.4 });
          s.fn((x) => x ** -0.5, { color: 'orange', dash: true });
          s.fn((x) => 1e-6 * x, { color: 'teal' });
          s2.hband(-3, 3, { color: 'green', alpha: 0.08 });
          s2.fn((f) => 20 * Math.log10(RA(f)) + 2, { color: 'red', width: 2.4 });
          s2.dot(1000, 0, { color: 'red', label: '1 kHz', labelPos: 'n', math: false });
        });
        v.legend([['accent', '$y=x^k$'], ['orange', '$x^{-1/2}$', { dash: true }], ['teal', '$10^{-6}x$'], ['red', 'A-weighting']]);
      },
    },
    {
      num: '1.3',
      kind: 'Theorem',
      name: 'Histograms converge to the density',
      statement: String.raw`The normalised histogram of $n$ i.i.d. samples converges to the density as $n\to\infty$ and the bins shrink.`,
      caption: String.raw`Left: $N(0,1)$ samples, density-normalised, against the true pdf. Right: exponential waiting times on a log count axis — a straight line.`,
      viz(v) {
        const s = v.stage({ x: [-4, 4], y: [0, 0.5], axes: 'box', height: 300, title: 'density histogram' });
        const s2 = v.stage({ x: [0, 8], y: [0.8, 3000], ylog: true, axes: 'box', grid: true, height: 300, title: 'counts, log scale' });
        const n = v.slider('$n$', 50, 20000, 2000, { log: true, int: true });
        const bins = v.slider('bins', 5, 80, 30, { int: true });
        const N = v.M.dist.normal(0, 1), E = v.M.dist.exponential(1);
        v.render(() => {
          const xs = N.sample(v.rng(3), n.value), H = v.M.histogram(xs, { bins: bins.value, range: [-4, 4] });
          s.hist(H, { density: true, color: 'accent' });
          s.fn(N.pdf, { color: 'ink', width: 2 });
          s.vline(v.M.mean(xs), { color: 'orange', dash: true });
          const ws = E.sample(v.rng(5), 10000);
          s2.hist(ws, { bins: 32, range: [0, 8], color: 'teal' });
          s2.fn((x) => 10000 * 0.25 * Math.exp(-x), { color: 'ink', dash: true, width: 1.6 });
        });
        v.legend([['accent', 'histogram', { area: true }], ['ink', 'pdf'], ['orange', 'sample mean', { dash: true }]]);
        v.readout(() => `$n = ${n.value}$, sample s.d. ${v.fix(v.M.stdev(N.sample(v.rng(3), n.value)), 4)}`);
      },
    },
    {
      num: '1.4',
      kind: 'Theorem',
      name: 'Heat maps with colour bars',
      statement: String.raw`A scalar field $u(x,y)$ is shown by colour; the colour bar maps colours back to values.`,
      caption: String.raw`Left: a Gaussian mixture (viridis, bar on the right). Right: $\sin x\cos y$ (diverging map, bar at the bottom, TeX label).`,
      viz(v) {
        const s = v.stage({ x: [-3, 4.2], y: [-3, 3], axes: false, height: 300 });
        const s2 = v.stage({ x: [-Math.PI, Math.PI], y: [-Math.PI, Math.PI], axes: false, height: 300 });
        const p = s.handle(1, 0.5, { color: 'red', label: 'μ' });
        v.render(() => {
          const g = (x, y, a, b, w) => Math.exp(-((x - a) ** 2 + (y - b) ** 2) / (2 * w * w));
          s.heat((x, y) => g(x, y, -1, -1, 0.8) + 0.8 * g(x, y, p.x, p.y, 0.6), { range: [0, 1.1], cmap: 'viridis', key: `${p.x},${p.y}` });
          s.colorbar([0, 1.1], 'viridis', { label: 'density' });
          s2.heat((x, y) => Math.sin(x) * Math.cos(y), { range: [-1, 1], cmap: 'diverging', key: 1 });
          s2.colorbar([-1, 1], 'diverging', { pos: 'bottom', tex: 'u = \\sin x\\cos y', length: 0.55 });
        });
      },
    },
    {
      num: '1.5',
      kind: 'Theorem',
      name: 'Polar grids: roses and spectra',
      statement: String.raw`The rose $r=\cos k\theta$ has $k$ petals for odd $k$ and $2k$ for even $k$. The eigenvalues of a real matrix are symmetric about the real axis.`,
      caption: String.raw`Left: polar grid in degrees. Right: eigenvalues (v.M.eig) of a random $8\times8$ matrix scaled by $1/\sqrt8$, with the unit circle; angle labels in radians.`,
      viz(v) {
        const s = v.stage({ x: [-1.25, 1.25], y: [-1.25, 1.25], equal: true, axes: false, height: 320 });
        const s2 = v.stage({ x: [-1.6, 1.6], y: [-1.6, 1.6], equal: true, axes: false, height: 320 });
        const k = v.slider('$k$', 1, 7, 3, { int: true });
        const seed = v.slider('seed', 1, 40, 7, { int: true });
        v.render(() => {
          s.polarGrid({ rmax: 1, rings: 4, spokes: 12, labelAngle: Math.PI * 5 / 12 });
          s.curve((t) => { const r = Math.cos(k.value * t); return [r * Math.cos(t), r * Math.sin(t)]; }, 0, 2 * Math.PI, { color: 'accent', width: 2.2, fill: 'accent', fillAlpha: 0.12, n: 800 });
          const R = v.rng(seed.value), A = v.M.range(8).map(() => v.M.range(8).map(() => R.normal() / Math.sqrt(8)));
          s2.polarGrid({ spokes: 8, angles: 'rad' });
          s2.circle(0, 0, 1, { color: 'orange', width: 1.6, dash: [5, 4] });
          for (const z of v.M.eig(A, { vectors: false }).values) s2.dot(z.re, z.im, { color: z.im ? 'accent' : 'green', r: 4.5 });
        });
        v.legend([['accent', 'complex pair', { dot: true }], ['green', 'real eigenvalue', { dot: true }], ['orange', 'unit circle', { dash: true }]]);
      },
    },
    {
      num: '1.6',
      kind: 'Theorem',
      name: 'Sound: Sethares dissonance curve',
      statement: String.raw`For a harmonic timbre the summed Plomp–Levelt dissonance of two notes has minima at simple ratios such as $3/2$ and $2$.`,
      caption: String.raw`Drag the ratio and press *Play*. Right: amplitude spectrum (v.M.spectrum) of the two-note signal on log axes.`,
      viz(v) {
        const s = v.stage({ x: [1, 2.1], y: [0, 4.6], axes: 'box', height: 300, xticks: [[1, '1'], [1.25, '5/4'], [4 / 3, '4/3'], [1.5, '3/2'], [5 / 3, '5/3'], [2, '2']], title: 'dissonance vs ratio' });
        const s2 = v.stage({ x: [100, 5000], y: [1e-3, 2], xlog: true, ylog: true, axes: 'box', grid: true, height: 300, title: 'spectrum', xlabel: 'Hz' });
        const f0 = 261.63, timbre = (f) => v.M.range(6).map((j) => [f * (j + 1), 0.88 ** j]);
        const curve = [...v.M.linspace(1, 2.1, 700), 6 / 5, 5 / 4, 4 / 3, 3 / 2, 5 / 3, 2].sort((a, b) => a - b).map((r) => [r, v.M.dissonance(timbre(f0), timbre(f0 * r))]);
        const h = s.handle(1.5, 0, { color: 'accent', label: 'r', constrain: (x) => [x, v.M.dissonance(timbre(f0), timbre(f0 * x))] });
        h.y = v.M.dissonance(timbre(f0), timbre(f0 * 1.5));
        v.soundButton('Play', (snd) => snd.chord(timbre(f0), timbre(f0 * h.x), { duration: 1.2 }));
        v.button('Stop', () => v.sound().stop());
        v.render(() => {
          s.path(curve, { color: 'ink', width: 2 });
          s.vline(h.x, { color: 'accent', dash: true, alpha: 0.6 });
          const fs = 16384, N = 8192, x = v.M.range(N).map((n) => [...timbre(f0), ...timbre(f0 * h.x)].reduce((a, [f, amp]) => a + amp * Math.cos(2 * Math.PI * f * n / fs), 0));
          const sp = v.M.spectrum(x.map((y, n) => y * (0.5 - 0.5 * Math.cos(2 * Math.PI * n / N))), fs);
          s2.path(sp.freq.map((f, i) => [f, 2 * sp.amp[i]]), { color: 'teal', width: 1.4 });
        });
        v.readout(() => `ratio ${v.fix(h.x, 3)} = ${v.fix(v.M.centsBetween(1, h.x), 1)} cents (${v.M.noteName(60)} → ${v.M.noteName(60 + 12 * Math.log2(h.x))}); dissonance ${v.fix(h.y, 3)}; sound ${v.sound().available ? 'available' : 'unavailable'}`);
      },
    },
    {
      num: '1.7',
      kind: 'Theorem',
      name: 'Log-axis tick stress test',
      statement: String.raw`Automatic log ticks over awkward windows: sub-decade, one decade, a few decades, many decades, tiny panels.`,
      caption: String.raw`Each panel is log in $x$ (top label) and in $y$; the curve is $y = x$.`,
      viz(v) {
        const R = [[2, 3], [1, 10], [0.5, 30], [3e4, 2e6], [1e-12, 1e12], [0.002, 0.2], [7, 9000], [1e-5, 1e-3]];
        const S = R.map((r) => v.stage({ x: r, y: r, xlog: true, ylog: true, grid: true, axes: 'box', height: 150, minWidth: 190, title: `[${v.fmt(r[0], 3)}, ${v.fmt(r[1], 3)}]` }));
        v.render(() => { for (const s of S) s.fn((x) => x, { color: 'accent', width: 2 }); });
      },
    },
    {
      num: '1.8',
      kind: 'Definition',
      name: 'setScale: one panel switching between linear and log axes',
      statement: String.raw`$e^{-t}$ and $t^{-2}$ on one stage; toggle the axes in place.`,
      caption: String.raw`Toggle each axis. On semi-log $y$ the exponential is a straight line; on log–log the power law is.`,
      viz(v) {
        const s = v.stage({ x: [0.1, 10], y: [1e-4, 10], height: 300, axes: 'box', gutter: true, grid: true, xlabel: '$t$ (s)', ylabel: '$e^{-t}$, $t^{-2}$', ylog: true });
        const lx = v.toggle('log t', false), ly = v.toggle('log y', true);
        v.render(() => {
          s.setScale({ xlog: lx.value, ylog: ly.value, x: [0.1, 10], y: ly.value ? [1e-4, 10] : [0, 10] });
          s.fn((t) => Math.exp(-t), { color: 'accent', width: 2 });
          s.fn((t) => t ** -2, { color: 'gold', width: 2 });
        });
        v.readout(() => `x: ${lx.value ? 'log' : 'linear'}, y: ${ly.value ? 'log' : 'linear'}`);
      },
    },
    {
      num: '1.9',
      kind: 'Method',
      name: 'v.input: typing a formula',
      statement: String.raw`Type any right-hand side $f(t, x)$; the slope field and a solution update as you type.`,
      caption: String.raw`Try **x(1 - x)**, **sin(t) - x**, **x^2 - t**, or a typo to see the error message.`,
      viz(v) {
        const s = v.stage({ x: [0, 6], y: [-2, 2], height: 300, axes: 'box', xlabel: 't', ylabel: 'x' });
        const f = v.input('$\\dot x = f(t, x) =$', 'x (1 - x) - 0.2 sin(3t)', { vars: ['t', 'x'] });
        v.render(() => {
          const F = f.fn; if (!F) return;
          for (let t = 0.25; t < 6; t += 0.5) for (let x = -1.75; x < 2; x += 0.5) { const m = F(t, x), L = 0.18 / Math.hypot(1, m); s.line(t - L, x - m * L, t + L, x + m * L, { color: 'muted', width: 1 }); }
          let x = 0.1; const pts = [[0, x]]; for (let t = 0; t < 6; t += 0.01) { x += 0.01 * F(t, x); if (!isFinite(x) || Math.abs(x) > 50) break; pts.push([t + 0.01, x]); }
          s.clip(() => s.path(pts, { color: 'accent', width: 2.2 }));
        });
        v.readout(() => (f.error ? `error: ${f.error}` : `f compiled: f(1, 0.5) = ${v.fix(f.fn(1, 0.5), 4)}`));
      },
    },
    {
      num: '1.10',
      kind: 'Definition',
      name: 'Theme-aware ramps, raster rect, text plates',
      statement: String.raw`$\sin x \cos y$ with the 'theme-diverging' colour map, limited to a rectangle, plus a plated corner label.`,
      caption: String.raw`Switch the theme: the ramp is built from the panel colour, so it reads in both. The heat map only fills the dashed rectangle.`,
      viz(v) {
        const s = v.stage({ x: [-4, 4], y: [-3, 3], height: 280, axes: 'box', equal: true, xlabel: '$x$', ylabel: '$y$' });
        v.render(() => {
          s.heat((x, y) => Math.sin(x) * Math.cos(y), { range: [-1, 1], cmap: 'theme-diverging', rect: [-3, -2, 3, 2], key: 1 });
          s.rect(-3, -2, 3, 2, { color: 'muted', dash: true, width: 1 });
          s.corner('max = 1, min = −1', 'tr', { plate: true, color: 'ink' });
          for (let k = 0; k <= 10; k++) s.rect(-3.6 + k * 0.72, -2.9, -3.6 + (k + 1) * 0.72, -2.5, { fill: `rgb(${v.ramp(k / 10).join(',')})`, fillAlpha: 1, stroke: false });
        });
      },
    },
  ],
};
