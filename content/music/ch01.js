// Music Theory & Acoustics — Chapter 1: Sound as a wave

// ---------- shared helpers ----------
/** Gases treated as ideal: heat-capacity ratio γ and molar mass M in kg/mol (room-temperature values). */
const GAS = {
  air: { label: 'air', gamma: 1.4, M: 0.028965 },
  he: { label: 'helium', gamma: 5 / 3, M: 0.0040026 },
  co2: { label: 'CO₂', gamma: 1.29, M: 0.04401 },
  h2: { label: 'hydrogen', gamma: 1.41, M: 0.002016 },
};
/** Laplace's adiabatic speed of sound √(γRT/M) in m/s (C = v.M.CONST, tC in °C). */
const soundSpeed = (C, gas, tC) => Math.sqrt((gas.gamma * C.R * (tC + C.T0)) / gas.M);
/** Ideal-gas density pM/(RT) in kg/m³. */
const gasDensity = (C, gas, tC, p = C.atm) => (p * gas.M) / (C.R * (tC + C.T0));
/** Sound pressure level of an rms pressure (re 20 µPa). */
const splOf = (pRms) => 20 * Math.log10(pRms / 20e-6);
/** Note name and cents offset of a frequency, e.g. "A4 −3 ¢". */
function noteOf(M, f) {
  const m = M.freqToMidi(f), r = Math.round(m), d = Math.round((m - r) * 100);
  return M.noteName(r) + (d ? ` ${d > 0 ? '+' : '−'}${Math.abs(d)} ¢` : '');
}
/**
 * A playhead that follows a sound for `dur` seconds and redraws the viz about 25 times a second
 * (sound only ever starts from a click, so the timer only runs after one). ph.t is the elapsed time, or null.
 */
function playhead(v) {
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
/** Short linear fade in and out (in place) so sample buffers start and stop without clicks. */
function fade(buf, sr, t = 0.02) {
  const n = Math.min(Math.floor(t * sr), buf.length >> 1);
  for (let i = 0; i < n; i++) { const g = i / n; buf[i] *= g; buf[buf.length - 1 - i] *= g; }
  return buf;
}
/** Concatenate sample buffers with `gap` seconds of silence between them. */
function joinBuffers(parts, sr, gap) {
  const g = Math.round(gap * sr), n = parts.reduce((s, p) => s + p.length, 0) + g * (parts.length - 1), out = new Float32Array(n);
  let o = 0; parts.forEach((p, i) => { out.set(p, o); o += p.length + (i < parts.length - 1 ? g : 0); });
  return out;
}
const BLACK_KEYS = new Set([1, 3, 6, 8, 10]);
/** Piano keyboard (one cell per semitone, cell edges halfway in log frequency) between fLo and fHi, on a linear or log x-axis. */
function keyboard(s, M, fLo, fHi, y0, y1, marks) {
  const m0 = Math.round(M.freqToMidi(fLo)), m1 = Math.round(M.freqToMidi(fHi));
  s.rect(fLo, y0, fHi, y1, { fill: 'panel', fillAlpha: 1, stroke: false });
  for (let m = m0; m <= m1; m++) {
    const a = Math.max(fLo, M.midiToFreq(m - 0.5)), b = Math.min(fHi, M.midiToFreq(m + 0.5));
    if (BLACK_KEYS.has(M.mod(m, 12))) s.rect(a, y0 + (y1 - y0) * 0.32, b, y1, { fill: 'ink', fillAlpha: 0.72, stroke: false });
    if (marks && marks.has(m)) s.rect(a, y0, b, y1, { fill: 'gold', fillAlpha: 0.85, stroke: false });
    if (s.X(b) - s.X(a) >= 3.5) s.line(b, y0, b, y1, { color: 'faint', width: 0.7 });
  }
  s.rect(fLo, y0, fHi, y1, { color: 'muted', width: 1 });
}
/** Vertical zigzag spring from (x, yTop) down to (x, yBot). */
function springV(s, x, yTop, yBot, coils, w, st) {
  const pts = [[x, yTop]], L = yTop - yBot, a = 0.1, b = 0.9;
  pts.push([x, yTop - a * L]);
  for (let i = 1; i < 2 * coils; i++) pts.push([x + (i % 2 ? w : -w), yTop - (a + (b - a) * i / (2 * coils)) * L]);
  pts.push([x, yTop - b * L], [x, yBot]);
  s.path(pts, st);
}
/** Velocity-Verlet run of x'' = −(k/m)·x·(1 + β x²/xs²) from (x0, v0), sampled every step dt up to tEnd. */
function springRun(k, m, beta, xs, x0, v0, tEnd, dt) {
  const n = Math.ceil(tEnd / dt), x = new Float64Array(n + 1);
  const acc = (y) => -(k / m) * y * (1 + (beta * y * y) / (xs * xs));
  let y = x0, vel = v0, a = acc(y); x[0] = y;
  for (let i = 1; i <= n; i++) { y += vel * dt + 0.5 * a * dt * dt; const a2 = acc(y); vel += 0.5 * (a + a2) * dt; a = a2; x[i] = y; }
  return { x, dt, n };
}
/** Frequency from the upward zero crossings of a sampled run (NaN if fewer than two). */
function crossingFreq(run) {
  const cr = [], { x, dt, n } = run;
  for (let i = 1; i <= n; i++) if (x[i - 1] < 0 && x[i] >= 0) cr.push((i - 1 + -x[i - 1] / (x[i] - x[i - 1])) * dt);
  return cr.length > 1 ? (cr.length - 1) / (cr[cr.length - 1] - cr[0]) : NaN;
}
/** Audio samples of the same oscillator released from rest at amplitude a (4 Verlet substeps per sample). */
function springSamples(k, m, beta, xs, a, dur, sr = 44100) {
  const n = Math.round(dur * sr), out = new Float32Array(n), sub = 4, dt = 1 / (sr * sub);
  const acc = (y) => -(k / m) * y * (1 + (beta * y * y) / (xs * xs));
  let y = a, vel = 0, ac = acc(y);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < sub; j++) { y += vel * dt + 0.5 * ac * dt * dt; const a2 = acc(y); vel += 0.5 * (ac + a2) * dt; ac = a2; }
    out[i] = y;
  }
  return out;
}

export default {
  collection: 'music',
  chapter: 1,
  title: 'Sound as a wave',
  summary: String.raw`Sound is a travelling disturbance of air pressure: parcels of air rock back and forth while a pattern of compressions and rarefactions races on at about 343 m/s. The chapter sets up the quantities that describe it (frequency, wavelength, speed, amplitude, intensity) and the two logarithmic scales the ear imposes on them, octaves and cents for pitch and decibels for level. It then asks how loudness depends on frequency, where hearing begins and ends, and what happens when waves add, bounce off walls and bend around them.`,
  items: [
    // ------------------------------------------------------------------ 1.1
    {
      num: '1.1',
      kind: 'Concept',
      name: 'Sound as a pressure wave',
      statement: String.raw`Sound in air is a small travelling disturbance of the air's pressure and density. A vibrating surface shoves the layer of air next to it; each thin layer (a *parcel*) is pushed forward and pulled back about its resting place and passes the push on to its neighbour. The parcels move **along** the direction of travel, so the wave is *longitudinal*, and they do not travel with it: what propagates is a pattern of **compressions** (pressure above ambient) and **rarefactions** (below).

For a plane wave let $\xi(x,t)$ be the displacement of the parcel whose resting place is $x$, and $p(x,t)$ the excess pressure. A layer that is stretched ($\partial\xi/\partial x>0$) is rarefied, so
$$p=-B\,\frac{\partial\xi}{\partial x},\qquad \xi=\hat\xi\sin(\omega t-kx)\ \Longrightarrow\ p=\hat p\cos(\omega t-kx),\quad \hat p=\rho c\,\omega\,\hat\xi,$$
where $B=\rho c^2$ is the adiabatic bulk modulus, $\rho$ the density and $c$ the speed of sound. The pressure peaks a quarter wavelength away from the displacement peaks. The swings are tiny: $\hat p=1$ Pa, a loud tone of about 91 dB, is a hundred-thousandth of atmospheric pressure and moves the air by less than a micrometre at 1 kHz.`,
      idea: String.raw`Apply Newton's second law to a thin slab of air: the pressure difference across it accelerates it, $\rho\,\partial^2\xi/\partial t^2=-\partial p/\partial x$. Its change of thickness changes its pressure, $p=-B\,\partial\xi/\partial x$. Together these give the wave equation $\partial^2\xi/\partial t^2=c^2\,\partial^2\xi/\partial x^2$ with $c=\sqrt{B/\rho}$ (the fluid model of waves-1.11), whose solutions are shapes sliding at speed $c$. Parcels crowd together where those behind have moved forward more than those ahead ($\partial\xi/\partial x<0$), which is where $\xi$ crosses zero going down, not where it is largest. Each parcel just oscillates, so its average position never changes.`,
      caption: String.raw`Press play: the piston drives the air; each dot is a parcel, its displacement magnified about $10^5$ times and the motion slowed down. Follow a **gold** parcel: it only rocks about its rest mark while the crowding (shaded red) travels on. The graph below shows $\xi$ and $p$ along the tube; switch it to compare them, and note that compressions sit where $\xi$ crosses zero going down. Change $f$ and $\hat p$, then press *Listen* (your volume knob sets the absolute level; the ratios between settings are honest).`,
      deps: ['waves-1.11'],
      refs: ['Benson ch. 1', 'Loy I ch. 4'],
      tags: ['waves', 'pressure'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Longitudinal_wave' },
      viz(v) {
        const M = v.M, C = M.CONST, TAU = 2 * Math.PI, L = 2, VIS_F = 0.55;
        const c = soundSpeed(C, GAS.air, 20), rho = gasDensity(C, GAS.air, 20);
        const fq = v.slider('frequency $f$', 170, 1700, 343, { log: true, fmt: (x) => Math.round(x) + ' Hz' });
        const pa = v.slider('pressure amplitude $\\hat p$', 0.3, 10, 2, { log: true, fmt: (x) => v.fmt(x, 2) + ' Pa' });
        const graph = v.select('graph', [{ value: 'xi', label: 'displacement $\\xi$' }, { value: 'p', label: 'pressure $p$' }, { value: 'both', label: 'both' }], 'both');
        const shade = v.toggle('shade compressions', true);
        v.soundButton('Listen', (snd) => snd.tone(fq.value, { duration: 2, gain: (0.3 * pa.value) / 10, release: 0.25 }));
        const tube = v.stage({ x: [-0.24, L + 0.03], y: [-0.78, 0.7], height: 210, axes: false, full: true });
        const gr = v.stage({ x: [-0.24, L + 0.03], y: [-1.45, 1.55], height: 170, axes: 'box', yticks: [], xlabel: 'x (m)', full: true });
        const R = v.rng(11);
        const parcels = M.range(1150).map(() => [R.uniform(0.008, L - 0.008), R.uniform(-0.46, 0.46)]);
        const tracers = [[0.43, 0.2], [1.04, -0.22], [1.62, 0.04]];
        let st = null;
        v.animate((t) => {
          const f = fq.value, lam = c / f, k = TAU / lam, w = TAU * f, ph = TAU * VIS_F * t;
          // drawn strain k·D grows with the amplitude (it never exceeds 0.5, so parcels never cross)
          const kap = 0.12 + (0.36 * Math.log10(pa.value / 0.3)) / Math.log10(10 / 0.3), D = kap / k;
          const xiReal = pa.value / (rho * c * w);
          st = { f, lam, xiReal, X: D / xiReal, u: pa.value / (rho * c), slow: VIS_F / f };
          const xi = (x) => D * Math.sin(ph - k * x);
          // ---- tube
          if (shade.value) {
            const n = 180;
            for (let i = 0; i < n; i++) {
              const a = (i * L) / n, b = ((i + 1) * L) / n, pn = Math.cos(ph - (k * (a + b)) / 2);
              tube.rect(a, -0.5, b, 0.5, { fill: pn > 0 ? 'red' : 'blue', fillAlpha: 0.32 * Math.abs(pn), stroke: false });
            }
          }
          tube.dots(parcels.map(([x0, y]) => [x0 + xi(x0), y]), { r: 1.7, color: 'ink', alpha: 0.62 });
          for (const [x0, y] of tracers) {
            tube.line(x0 - D, y, x0 + D, y, { color: 'gold', width: 4, alpha: 0.35 });
            tube.line(x0, y - 0.08, x0, y + 0.08, { color: 'ink', width: 1.6 });
            tube.dot(x0 + xi(x0), y, { r: 5.5, color: 'gold' });
          }
          const xp = xi(0);
          tube.rect(xp - 0.075, -0.5, xp, 0.5, { fill: 'gray', fillAlpha: 0.85, color: 'muted', width: 1 });
          tube.line(-0.24, 0, xp - 0.075, 0, { color: 'muted', width: 4 });
          tube.line(-0.02, 0.52, L, 0.52, { color: 'ink', width: 2 });
          tube.line(-0.02, -0.52, L, -0.52, { color: 'ink', width: 2 });
          tube.text('piston', -0.12, 0.6, { align: 'center', color: 'muted', size: 12 });
          // label one compression and one rarefaction, and measure λ between compressions
          let xc = M.mod(ph, TAU) / k; while (xc < 0.12) xc += lam;
          if (xc < L - 0.18) tube.text('compression', xc, 0.6, { align: 'center', color: 'red', size: 12, weight: 600 });
          const xr = xc + lam / 2 < L - 0.18 ? xc + lam / 2 : xc - lam / 2;
          if (xr > 0.2 && xr < L - 0.18) tube.text('rarefaction', xr, 0.6, { align: 'center', color: 'blue', size: 12, weight: 600 });
          let x1 = M.mod(ph, TAU) / k; while (x1 < 0.02) x1 += lam;
          if (x1 + lam < L - 0.01) { tube.measure(x1, -0.62, x1 + lam, -0.62, `λ = ${M.si(lam, 'm')}`, { color: 'ink', math: false, size: 12 }); }
          // ---- graph of ξ and p along the tube
          gr.hline(0, { color: 'faint', width: 1 });
          if (graph.value !== 'p') gr.fn((x) => Math.sin(ph - k * x), { domain: [0, L], color: 'accent', width: 2.6 });
          if (graph.value !== 'xi') gr.fn((x) => Math.cos(ph - k * x), { domain: [0, L], color: 'red', width: 2.6 });
          for (const [x0] of tracers) {
            gr.vline(x0, { color: 'gold', dash: [3, 4], alpha: 0.8 });
            if (graph.value !== 'p') gr.dot(x0, Math.sin(ph - k * x0), { r: 4.5, color: 'gold' });
          }
          if (graph.value !== 'p') gr.corner(`ξ̂ = ${M.si(xiReal, 'm')} (forward = up)`, 'tl', { color: 'accent', weight: 600 });
          if (graph.value !== 'xi') gr.corner(`p̂ = ${v.fmt(pa.value, 3)} Pa (compression = up)`, 'tr', { color: 'red', weight: 600 });
        }, { still: 0.35 });
        v.legend([['accent', 'displacement $\\xi$ of the parcel resting at $x$'], ['red', 'excess pressure $p$'], ['gold', 'tracer parcels and their rest marks', { dot: true }]]);
        v.readout(() => st && `$f$ = ${Math.round(st.f)} Hz, $\\lambda = c/f$ = ${M.si(st.lam, 'm')} with $c$ = ${v.fix(c, 1)} m/s (air, 20 °C) · $\\hat p$ = ${v.fmt(pa.value, 3)} Pa: SPL ${v.fix(splOf(pa.value / Math.SQRT2), 1)} dB, $\\hat p/p_{\\rm atm} = ${v.sci(pa.value / C.atm, 2)}$ · parcel speed $\\hat u=\\hat p/\\rho c$ = ${M.si(st.u, 'm/s')}, displacement $\\hat\\xi=\\hat u/\\omega$ = ${M.si(st.xiReal, 'm')} (drawn $\\times${v.sci(st.X, 1)}$) · slow motion: 1 s on screen = ${M.si(st.slow, 's')} of real time`);
      },
    },
    // ------------------------------------------------------------------ 1.2
    {
      num: '1.2',
      kind: 'Model',
      name: 'Simple harmonic motion and the sine wave',
      statement: String.raw`A mass $m$ on a spring that obeys Hooke's law $F=-kx$ satisfies $m\ddot x=-kx$. Every solution is a sinusoid
$$x(t)=a\sin(\omega_0 t+\varphi),\qquad \omega_0=\sqrt{k/m},\qquad f_0=\frac{\omega_0}{2\pi},$$
with amplitude $a$ and phase $\varphi$ fixed by the initial position and velocity, and with a frequency that does **not** depend on the amplitude. Equivalently, $x(t)=\Im\big(a\,e^{i(\omega_0t+\varphi)}\big)$ is the shadow of a point moving uniformly round a circle of radius $a$ (a rotating *phasor*). Any system nudged slightly away from a stable equilibrium (a tuning-fork tine, a string, the air in a bottle) moves this way, and the sound of simple harmonic motion is a **pure tone**, the building block of every other sound.`,
      idea: String.raw`Try $x=\Im(Ae^{i\omega t})$: then $\ddot x=-\omega^2x$, which matches $\ddot x=-(k/m)x$ exactly when $\omega^2=k/m$. The two constants $a,\varphi$ fit any initial position and velocity, and uniqueness for linear ODEs leaves no other solutions (the oscillator of mech-4.2). Because $t\mapsto e^{it}$ runs round the unit circle at unit speed (rca-0.7), the motion is the projection of uniform circular motion. So pitch goes as $\sqrt{k/m}$: four times the mass halves $f_0$, an octave down. If the restoring force is not proportional to $x$ the argument breaks: the period then depends on the amplitude and the waveform is no longer a sine.`,
      caption: String.raw`Play: the phasor turns at $\omega_0$ and its shadow (dashed line) tracks the mass, which is simulated independently by a Verlet integrator (gold trail). Change $k$, $m$, $a$ and $\varphi$ and press *Listen*: the pitch moves as $\sqrt{k/m}$, and *$m$, then $4m$* drops exactly an octave. Switch to the **stiffening** spring and raise $a$: the mass runs ahead of the phasor, the frequency rises with amplitude and the tone gains harmonics.`,
      deps: ['rca-0.7', 'mech-4.2'],
      refs: ['Benson ch. 1', 'Loy I ch. 5'],
      tags: ['oscillation', 'sinusoid'],
      scope: String.raw`Holds when the restoring force is proportional to the displacement (small oscillations about a stable equilibrium) and friction is negligible; damping makes the amplitude decay, and a nonlinear force makes the frequency depend on amplitude.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Simple_harmonic_motion' },
      viz(v) {
        const M = v.M, TAU = 2 * Math.PI, XS = 0.5e-3, WIN = 10e-3, AMAX = 1.5, X0 = 2.55, X1 = 7.25;
        const law = v.select('spring', [{ value: 'hooke', label: 'Hooke: $F=-kx$' }, { value: 'stiff', label: 'stiffening: $F=-kx\\,(1+x^2/x_s^2)$' }], 'hooke');
        const kS = v.slider('stiffness $k$', 1e3, 1e5, 3.8e4, { log: true, fmt: (x) => M.si(x, 'N/m', 2) });
        const mS = v.slider('mass $m$', 1, 50, 5, { log: true, fmt: (x) => v.fmt(x, 2) + ' g' });
        const aS = v.slider('amplitude $a$', 0.1, 1.5, 0.8, { step: 0.01, fmt: (x) => v.fix(x, 2) + ' mm' });
        const pS = v.slider('phase $\\varphi$', 0, 360, 30, { step: 1, fmt: (x) => Math.round(x) + '°' });
        const beta = () => (law.value === 'stiff' ? 1 : 0);
        const tone = (k, m, dur) => fade(springSamples(k, m, beta(), XS, aS.value * 1e-3, dur).map((y) => (0.9 * y) / (AMAX * 1e-3)), 44100);
        v.soundButton('Listen', (snd) => snd.samples(tone(kS.value, mS.value * 1e-3, 1.4), 44100, { gain: 0.5 }));
        v.soundButton('$m$, then $4m$', (snd) => snd.samples(joinBuffers([tone(kS.value, mS.value * 1e-3, 0.9), tone(kS.value, 4 * mS.value * 1e-3, 0.9)], 44100, 0.15), 44100, { gain: 0.5 }));
        const s = v.stage({ x: [-1.3, 7.35], y: [-1.5, 1.52], equal: true, height: 330, axes: false, full: true });
        let key = null, run = null, info = null;
        const update = () => {
          const k = kS.value, m = mS.value * 1e-3, a = aS.value * 1e-3, phi = (pS.value * Math.PI) / 180, b = beta();
          const kk = [k, m, a, phi, b].join();
          if (kk === key) return; key = kk;
          const w0 = Math.sqrt(k / m), f0 = w0 / TAU, dt = 1 / (f0 * 400);
          run = springRun(k, m, b, XS, a * Math.sin(phi), a * w0 * Math.cos(phi), WIN, dt);
          const meas = springRun(k, m, b, XS, a * Math.sin(phi), a * w0 * Math.cos(phi), Math.max(WIN, 6 / f0), dt);
          let gap = 0;
          for (let i = 0; i <= run.n; i++) gap = Math.max(gap, Math.abs(run.x[i] - a * Math.sin(w0 * i * dt + phi)));
          info = { w0, f0, fm: crossingFreq(meas), gap: gap / a, a, phi };
        };
        const xT = (t) => X0 + ((X1 - X0) * t) / WIN;
        v.animate((t) => {
          update();
          const { w0, a, phi } = info, r = a / (AMAX * 1e-3), tc = ((t % 6) / 6) * WIN;
          const th = w0 * tc + phi, sc = 1 / (AMAX * 1e-3);
          const ic = Math.min(run.n, Math.floor(tc / run.dt)), fr = tc / run.dt - ic;
          const xs = (run.x[ic] + (run.x[Math.min(run.n, ic + 1)] - run.x[ic]) * fr) * sc;
          // phasor
          s.line(-1.15, 0, X1, 0, { color: 'faint', width: 1, dash: [4, 4] });
          s.line(0, -1.1, 0, 1.1, { color: 'faint', width: 1 });
          s.circle(0, 0, 1, { color: 'grid', width: 1 });
          s.circle(0, 0, r, { color: 'muted', width: 1.4 });
          s.curve((u) => [0.24 * Math.cos(u), 0.24 * Math.sin(u)], 0, M.mod(th, TAU), { color: 'orange', width: 1.6, n: 60 });
          s.arrow(0, 0, r * Math.cos(th), r * Math.sin(th), { color: 'accent', width: 2.8 });
          s.dot(0, r * Math.sin(th), { r: 3.5, color: 'accent' });
          s.line(r * Math.cos(th), r * Math.sin(th), xT(tc), r * Math.sin(th), { color: 'accent', dash: [5, 4], width: 1.2, alpha: 0.8 });
          s.text('phasor', 0, -1.32, { align: 'center', color: 'muted', size: 12 });
          // spring and mass (simulated)
          s.line(1.4, 1.38, 2.1, 1.38, { color: 'ink', width: 2 });
          for (let i = 0; i < 6; i++) s.line(1.45 + i * 0.12, 1.38, 1.53 + i * 0.12, 1.47, { color: 'muted', width: 1 });
          springV(s, 1.75, 1.38, xs + 0.16, 9, 0.11, { color: 'ink', width: 1.6 });
          s.rect(1.53, xs - 0.16, 1.97, xs + 0.16, { fill: 'gold', fillAlpha: 0.9, color: 'ink', width: 1.2 });
          s.text('m', 1.75, xs, { align: 'center', math: true, color: 'ink', size: 15 });
          // time trace: the phasor's shadow (ideal) against the simulated mass
          s.line(X0, -1.18, X1, -1.18, { color: 'muted', width: 1 });
          for (let ms = 0; ms <= 10; ms += 2) { s.line(xT(ms / 1e3), -1.22, xT(ms / 1e3), -1.14, { color: 'muted', width: 1 }); s.text(ms + (ms === 10 ? ' ms' : ''), xT(ms / 1e3), -1.33, { align: 'center', color: 'muted', size: 11 }); }
          s.curve((u) => [xT(u), r * Math.sin(w0 * u + phi)], tc, WIN, { color: 'accent', width: 1.5, alpha: 0.35, n: 500 });
          s.curve((u) => [xT(u), r * Math.sin(w0 * u + phi)], 0, tc, { color: 'accent', width: 2.2, n: 500 });
          const step = Math.max(1, Math.round(run.n / 140)), trail = [];
          for (let i = 0; i <= ic; i += step) trail.push([xT(i * run.dt), run.x[i] * sc]);
          s.dots(trail, { r: 2.6, color: 'gold' });
          s.line(xT(tc), -1.12, xT(tc), 1.12, { color: 'muted', width: 1, alpha: 0.5 });
          s.dot(xT(tc), xs, { r: 5, color: 'gold' });
          s.line(1.97, xs, xT(tc), xs, { color: 'gold', width: 1, alpha: 0.5 });
          s.tex('a\\sin(\\omega_0t+\\varphi)', X1, 1.33, { align: 'right', color: 'accent', size: 14 });
        }, { still: 2.2 });
        v.legend([['accent', 'phasor and its shadow $a\\sin(\\omega_0 t+\\varphi)$'], ['gold', 'simulated mass (Verlet)', { dot: true }], ['orange', 'phase angle $\\omega_0t+\\varphi$']]);
        v.readout(() => {
          update();
          const { w0, f0, fm, gap } = info;
          const head = `$\\omega_0=\\sqrt{k/m}$ = ${v.fix(w0, 0)} rad/s, $f_0=\\omega_0/2\\pi$ = ${v.fix(f0, 1)} Hz (${noteOf(M, f0)}), $T_0$ = ${M.si(1 / f0, 's')}`;
          if (law.value === 'hooke') return `${head} · simulated mass: $f$ = ${v.fix(fm, 1)} Hz, largest gap from the shadow ${v.fix(100 * gap, 3)}% of $a$: simple harmonic, for every amplitude`;
          return `${head} · simulated mass: $f$ = ${v.fix(fm, 1)} Hz, ${v.fix(100 * (fm / f0 - 1), 1)}% above $f_0$, gap from the shadow up to ${v.fix(100 * gap, 0)}% of $a$: not simple harmonic, and the pitch now depends on the amplitude`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.3
    {
      num: '1.3',
      kind: 'Definition',
      name: 'Frequency, period and wavelength',
      statement: String.raw`For a periodic wave, the **period** $T$ is the time one full cycle takes at a fixed place, and the **frequency** $f=1/T$ is the number of cycles per second, measured in hertz (Hz). The **wavelength** $\lambda$ is the distance between successive crests at one instant. A crest advances one wavelength in one period, so
$$\lambda=cT=\frac{c}{f},$$
where $c$ is the speed of the wave in the medium. A sinusoidal wave is $p=\hat p\cos(\omega t-kx)$ with angular frequency $\omega=2\pi f$ and wavenumber $k=2\pi/\lambda$, and $\omega/k=c$. The source sets $f$; the medium sets $c$ and therefore $\lambda$. In air at 20 °C ($c\approx343$ m/s) the audible range, roughly 20 Hz to 20 kHz, spans wavelengths from about 17 m down to 1.7 cm.`,
      idea: String.raw`Follow one crest: after one period the place it occupied has gone through a full cycle and the crest has moved to where the next crest was, one wavelength on. Distance over time gives $c=\lambda/T=\lambda f$. In the sinusoid this is the statement that $\omega t-kx$ is constant along $x=ct$, i.e. $\omega=ck$. Since the medium cannot change how often the source pushes, a tone that passes from air into water keeps its frequency and stretches its wavelength by the ratio of speeds.`,
      caption: String.raw`Drag the frequency over the whole audible range. Top: a snapshot of the pressure along the air, with a ruler in metres that rescales to keep three wavelengths in view. Left: the trace at the microphone, against time in ms. Right: the wavelength on a logarithmic ruler beside everyday objects. Change the **medium**: $\lambda$ changes, $f$ (and what *Listen* plays) does not.`,
      deps: ['music-1.1', 'music-1.2'],
      refs: ['Loy I ch. 4'],
      tags: ['frequency', 'wavelength'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Wavelength' },
      viz(v) {
        const M = v.M, C = M.CONST, TAU = 2 * Math.PI, VIS_F = 0.5, NL = 3.2, XM = 2.6;
        const MED = {
          air: { label: 'air', c: soundSpeed(C, GAS.air, 20), note: 'air at 20 °C' },
          he: { label: 'helium', c: soundSpeed(C, GAS.he, 20), note: 'helium at 20 °C' },
          water: { label: 'water', c: 1482, note: 'fresh water at 20 °C' },
          steel: { label: 'steel', c: 5900, note: 'steel (bulk longitudinal waves, ≈)' },
        };
        const fq = v.slider('frequency $f$', 20, 20000, 343, { log: true, fmt: (x) => M.si(x, 'Hz', 3) });
        const med = v.select('medium', Object.entries(MED).map(([value, o]) => ({ value, label: o.label })), 'air');
        v.soundButton('Listen', (snd) => snd.tone(fq.value, { duration: 1.6, gain: fq.value > 4000 ? 0.07 : 0.2 }));
        const sp = v.stage({ x: [0, NL], y: [-1.5, 1.75], height: 190, axes: 'box', yticks: [], xlabel: 'x (m)', full: true, title: 'snapshot: pressure along the air at one instant' });
        const tp = v.stage({ x: [0, NL], y: [-1.5, 1.75], height: 185, axes: 'box', yticks: [], xlabel: 't (ms)', weight: 1, title: 'at the microphone: pressure against time' });
        const lr = v.stage({ x: [0.004, 800], y: [0, 1], xlog: true, height: 185, axes: 'box', yticks: [], xlabel: 'λ (m)', weight: 1.1, title: 'the wavelength on a log ruler' });
        const OBJ = [[0.024, 'coin'], [0.19, 'hand'], [1.75, 'person'], [12, 'bus'], [105, 'football pitch']];
        let st = null;
        v.animate((t) => {
          const f = fq.value, c = MED[med.value].c, lam = c / f, T = 1 / f, ph = TAU * VIS_F * t, k = TAU / lam;
          st = { f, c, lam, T };
          // ---- space
          sp.setView([0, NL * lam], null);
          const n = 120;
          for (let i = 0; i < n; i++) {
            const a = (i * NL * lam) / n, b = ((i + 1) * NL * lam) / n, pn = Math.cos(ph - (k * (a + b)) / 2);
            sp.rect(a, -1.5, b, 1.15, { fill: pn > 0 ? 'red' : 'blue', fillAlpha: 0.14 * Math.abs(pn), stroke: false });
          }
          sp.hline(0, { color: 'faint', width: 1 });
          sp.fn((x) => Math.cos(ph - k * x), { color: 'accent', width: 2.6, fill: 'accent', fillAlpha: 0.1 });
          let xc = (M.mod(ph, TAU) / TAU) * lam; while (xc < 0.25 * lam) xc += lam;
          sp.measure(xc, 1.38, xc + lam, 1.38, `λ = ${M.si(lam, 'm')}`, { color: 'ink', math: false, size: 12.5, offset: -11 });
          sp.vline(xc, { color: 'muted', dash: [2, 4], width: 1 }); sp.vline(xc + lam, { color: 'muted', dash: [2, 4], width: 1 });
          const pm = Math.cos(ph - TAU * XM);
          sp.vline(XM * lam, { color: 'gold', dash: [5, 4], width: 1.4 });
          sp.dot(XM * lam, pm, { r: 6, color: 'gold', label: 'mic', labelPos: 'e', math: false });
          // ---- time at the microphone (newest sample on the right)
          tp.setView([0, NL * T * 1e3], null);
          tp.hline(0, { color: 'faint', width: 1 });
          const pAt = (tau) => Math.cos(ph - TAU * (NL - tau / (T * 1e3)) - TAU * XM);
          tp.fn(pAt, { color: 'gold', width: 2.4 });
          let tc = M.mod(NL + XM - ph / TAU, 1) * T * 1e3; if (tc < 0.1 * T * 1e3) tc += T * 1e3;
          tp.measure(tc, 1.38, tc + T * 1e3, 1.38, `T = ${M.si(T, 's')}`, { color: 'ink', math: false, size: 12.5, offset: -11 });
          tp.vline(tc, { color: 'muted', dash: [2, 4], width: 1 }); tp.vline(tc + T * 1e3, { color: 'muted', dash: [2, 4], width: 1 });
          tp.dot(NL * T * 1e3, pm, { r: 6, color: 'gold' });
          // ---- log ruler
          lr.rect(c / 20000, 0, c / 20, 1, { fill: 'accent', fillAlpha: 0.08, stroke: false });
          lr.text(`audible band in ${MED[med.value].label}`, Math.sqrt((c / 20000) * (c / 20)), 0.93, { align: 'center', color: 'accent', size: 11 });
          OBJ.forEach(([x, lab], i) => {
            lr.line(x, 0, x, 0.22, { color: 'muted', width: 1.4 });
            lr.text(lab, x, 0.29 + (i % 2) * 0.12, { align: 'center', color: 'muted', size: 11 });
          });
          lr.line(lam, 0, lam, 0.66, { color: 'accent', width: 3 });
          lr.dot(lam, 0.66, { r: 6, color: 'accent' });
          lr.text(M.si(lam, 'm'), lam, 0.77, { align: lam > 60 ? 'right' : lam < 0.02 ? 'left' : 'center', color: 'accent', size: 12.5, weight: 600 });
        }, { still: 0.3 });
        v.legend([['accent', 'pressure along $x$ at one instant'], ['gold', 'pressure at the microphone against time'], ['red', 'compression', { area: true }], ['blue', 'rarefaction', { area: true }]]);
        v.readout(() => st && `$f$ = ${M.si(st.f, 'Hz')}, so the period is $T=1/f$ = ${M.si(st.T, 's')} · in ${MED[med.value].note}, $c$ = ${v.fix(st.c, 0)} m/s, so $\\lambda=c/f$ = ${M.si(st.lam, 'm')} · check: $\\lambda f$ = ${v.fix(st.lam * st.f, 1)} m/s $= c$ · $k=2\\pi/\\lambda$ = ${M.si(TAU / st.lam, 'rad/m')}, $\\omega=2\\pi f$ = ${M.si(TAU * st.f, 'rad/s')} · slow motion: 1 s on screen = ${M.si(VIS_F / st.f, 's')}`);
      },
    },
    // ------------------------------------------------------------------ 1.4
    {
      num: '1.4',
      kind: 'Law',
      name: 'Speed of sound (Newton–Laplace)',
      statement: String.raw`Sound travels through a fluid at $c=\sqrt{B_S/\rho}$, where $B_S$ is the adiabatic bulk modulus and $\rho$ the density. For an ideal gas $B_S=\gamma p$, so
$$c=\sqrt{\frac{\gamma p}{\rho}}=\sqrt{\frac{\gamma RT}{M}},$$
with $p$ the pressure, $T$ the absolute temperature, $M$ the molar mass, $R$ the gas constant and $\gamma=c_p/c_v$ the heat-capacity ratio (7/5 for air, 5/3 for helium). The speed grows as $\sqrt T$, is much larger in light gases, and does **not** depend on the pressure at a fixed temperature. In dry air at 20 °C, $c\approx343$ m/s.

Newton (1687) assumed the compressions were isothermal, which gives $\sqrt{p/\rho}$, short of the measured speed by the factor $1/\sqrt\gamma$ (about 15% for air). Laplace (1816) saw that the compressions are adiabatic.`,
      idea: String.raw`The wave equation of 1.1 gives $c^2=B/\rho$, where $B=-V\,dp/dV$ measures how hard the gas resists squeezing. Isothermally $pV$ is constant (the ideal gas law, thermo-1.4), so $B_T=p$. But the compressions alternate hundreds of times a second and are half a wavelength apart, far too quickly and too far for heat to flow out of them, so they are adiabatic, $pV^\gamma$ constant (thermo-1.16), and $B_S=\gamma p$: the squeezed gas also heats, and pushes back harder. Using $p/\rho=RT/M$ turns $\sqrt{\gamma p/\rho}$ into $\sqrt{\gamma RT/M}$; at fixed $T$, raising $p$ raises $\rho$ in proportion and leaves $c$ unchanged.`,
      caption: String.raw`Drag the handle along the curve to change the temperature, and pick a gas. The green curve is Laplace's adiabatic law, the red dashed one Newton's isothermal prediction, and the black ring the measured speed in dry air at 0 °C. Switch the **model** to Newton and watch every pulse in the race fall behind its true position. Change the pressure: $\rho$ changes, $c$ does not. *Listen* compares a 0.5 m open pipe filled with air and with the chosen gas.`,
      deps: ['music-1.1', 'thermo-1.4', 'thermo-1.16'],
      see: ['thermo-1.17'],
      refs: ['Benson ch. 3', 'Loy I ch. 4'],
      tags: ['speed of sound', 'gases'],
      credit: 'Newton, 1687; Laplace, 1816',
      scope: String.raw`Holds for an ideal gas at small amplitude, when the wavelength is much longer than the molecules' mean free path, so heat cannot flow across half a wavelength and each compression is adiabatic. Here $\gamma$ is held at its room-temperature value (for CO₂ it drifts with temperature), and humidity is ignored.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Speed_of_sound' },
      viz(v) {
        const M = v.M, C = M.CONST, LP = 0.5, TW = 0.25, ORDER = ['air', 'he', 'co2', 'h2'];
        const gasSel = v.select('gas', ORDER.map((value) => ({ value, label: GAS[value].label })), 'air');
        const model = v.select('model', [{ value: 'laplace', label: 'Laplace (adiabatic)' }, { value: 'newton', label: 'Newton (isothermal)' }], 'laplace');
        const pS = v.slider('pressure $p$', 50, 200, 101.3, { step: 0.1, fmt: (x) => v.fix(x, 1) + ' kPa' });
        const cOf = (g, tC, mdl) => Math.sqrt(((mdl === 'newton' ? 1 : g.gamma) * C.R * (tC + C.T0)) / g.M);
        const gr = v.stage({ x: [-50, 130], y: [0, 500], height: 340, axes: 'box', grid: true, xlabel: 'T (°C)', ylabel: 'c (m/s)', weight: 1, title: 'speed against temperature' });
        const race = v.stage({ x: [-105, 435], y: [-0.85, 3.75], height: 340, axes: false, weight: 1.15, title: `a pulse races down four tubes (first ${TW} s, slowed ×10)` });
        const h = gr.handle(20, cOf(GAS.air, 20, 'laplace'), { color: 'accent', label: 'T', constrain: (x) => { const T = M.clamp(x, -45, 125); return [T, cOf(GAS[gasSel.value], T, model.value)]; } });
        const pipe = (g) => cOf(g, h.x, model.value) / (2 * LP);
        v.soundButton('pipe in air', (snd) => snd.tone(pipe(GAS.air), { harmonics: 6, rolloff: 1.6, duration: 1.1, gain: 0.22 }));
        v.soundButton('pipe in this gas', (snd) => snd.tone(pipe(GAS[gasSel.value]), { harmonics: 6, rolloff: 1.6, duration: 1.1, gain: 0.22 }));
        v.animate((t) => {
          const g = GAS[gasSel.value], T = h.x, mdl = model.value, other = mdl === 'newton' ? 'laplace' : 'newton';
          h.y = cOf(g, T, mdl);
          gr.setView(null, [0, 1.22 * cOf(g, 130, 'laplace')]);
          gr.fn((x) => cOf(g, x, 'laplace'), { color: 'green', width: mdl === 'laplace' ? 3 : 1.8 });
          gr.fn((x) => cOf(g, x, 'newton'), { color: 'red', width: mdl === 'newton' ? 3 : 1.8, dash: [7, 5] });
          const yl = gr.bounds.y[1];
          gr.text('Laplace  √(γRT/M)', 128, cOf(g, 128, 'laplace') + 0.035 * yl, { align: 'right', baseline: 'bottom', color: 'green', size: 12, weight: 600 });
          gr.text('Newton  √(RT/M)', 128, cOf(g, 128, 'newton') - 0.035 * yl, { align: 'right', baseline: 'top', color: 'red', size: 12, weight: 600 });
          const cL = cOf(g, T, 'laplace'), cN = cOf(g, T, 'newton');
          gr.measure(T, cN, T, cL, `${v.fix(100 * (1 - cN / cL), 1)}% short`, { color: 'red', math: false, size: 12, offset: -14 });
          gr.dot(T, cOf(g, T, other), { r: 4, color: other === 'newton' ? 'red' : 'green' });
          if (gasSel.value === 'air') gr.dot(0, 331.3, { r: 5, hollow: true, color: 'ink', label: 'measured, 0 °C', labelPos: 'se', math: false });
          // ---- race
          const tc = t % 3.3, tp = (Math.min(tc, 2.5) / 2.5) * TW;
          for (let x = 0; x <= 400; x += 100) { race.line(x, -0.42, x, -0.34, { color: 'muted', width: 1 }); race.text(x + (x === 400 ? ' m' : ''), x, -0.6, { align: 'center', color: 'muted', size: 11 }); }
          race.line(0, -0.38, 420, -0.38, { color: 'muted', width: 1 });
          ORDER.forEach((id, i) => {
            const y = 3 - i, gg = GAS[id], sel = id === gasSel.value, col = sel ? 'accent' : 'muted';
            const c1 = cOf(gg, T, mdl), c2 = cOf(gg, T, other), x1 = Math.min(420, c1 * tp), x2 = Math.min(420, c2 * tp);
            race.rect(0, y - 0.24, 420, y + 0.24, { color: 'faint', width: 1 });
            race.rect(0, y - 0.24, x1, y + 0.24, { fill: col, fillAlpha: sel ? 0.22 : 0.12, stroke: false });
            race.line(x2, y - 0.3, x2, y + 0.3, { color: other === 'newton' ? 'red' : 'green', width: 1.6, dash: [4, 3] });
            race.line(x1, y - 0.3, x1, y + 0.3, { color: col, width: 3.5 });
            race.text(gg.label, -10, y, { align: 'right', color: sel ? 'accent' : 'ink', size: 12.5, weight: sel ? 700 : 500 });
            race.text(`${Math.round(c1)} m/s`, Math.min(x1 + 6, 360), y + 0.38, { align: 'left', color: col, size: 11 });
          });
          race.corner(`t = ${v.fix(tp, 3)} s`, 'tr', { color: 'ink', weight: 600 });
        }, { still: 2.2, period: 3.3 });
        v.legend([['green', 'Laplace (adiabatic)'], ['red', 'Newton (isothermal)', { dash: true }], ['accent', 'chosen gas and model']]);
        v.readout(() => {
          const g = GAS[gasSel.value], T = h.x, p = pS.value * 1e3, rho = gasDensity(C, g, T, p);
          const cL = Math.sqrt((g.gamma * p) / rho), cN = Math.sqrt(p / rho), f1 = pipe(g);
          return `${g.label} at ${v.fix(T, 1)} °C and ${v.fix(p / 1e3, 1)} kPa: $\\rho = pM/RT$ = ${v.fmt(rho, 4)} kg/m³, $\\gamma$ = ${v.fix(g.gamma, 3)} → $c=\\sqrt{\\gamma p/\\rho}$ = ${v.fix(cL, 1)} m/s; Newton's $\\sqrt{p/\\rho}$ = ${v.fix(cN, 1)} m/s is ${v.fix(100 * (1 - cN / cL), 1)}% low (factor $1/\\sqrt\\gamma$) · change $p$: $\\rho$ follows it, $c$ does not · open pipe, $L$ = ${LP} m: $f_1=c/2L$ = ${v.fix(f1, 0)} Hz (${noteOf(M, f1)})${model.value === 'newton' ? ' in Newton’s (wrong) world' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.5
    {
      num: '1.5',
      kind: 'Concept',
      name: 'Pitch is logarithmic: the octave',
      statement: String.raw`Perceived pitch follows the **logarithm** of frequency. Over most of the musical range two pairs of tones sound like the same interval when their frequency **ratios** are equal, not their differences: 200 → 300 Hz sounds like the same step as 400 → 600 Hz, while 400 → 500 Hz sounds smaller. The most important ratio is $2:1$, the **octave**. Tones an octave apart sound so alike that music gives them the same letter name (A2 = 110 Hz, A3 = 220 Hz, A4 = 440 Hz), so rising $n$ octaves multiplies the frequency by $2^n$, and pitch height is proportional to $\log_2 f$. A piano keyboard is therefore a logarithmic frequency axis: each key multiplies the frequency by $2^{1/12}$. The law loosens at the extremes of hearing, and listeners tend to prefer octaves slightly wider than $2:1$.`,
      idea: String.raw`A logarithm turns ratios into differences, $\log(rf)=\log r+\log f$ (pma-8.6), so equal ratios become equal steps of pitch. A sequence with equal differences $f_0+k\Delta$ has ratios $1+\Delta/(f_0+k\Delta)$ that shrink toward 1, so its steps sound smaller and smaller; the geometric sequence $f_0r^k$ keeps the same ratio and sounds evenly spaced. Physiologically, the cochlea lays out frequencies along the basilar membrane on a roughly logarithmic place map, so equal ratios move the excitation by roughly equal distances.`,
      caption: String.raw`Pick a spacing and press *Play the sequence*. The same tones are marked on a linear axis (top) and on a logarithmic axis, which is just a piano keyboard (bottom). Equal differences look even on the top axis but crowd together on the keyboard, and they sound like shrinking steps; equal ratios look even on the keyboard and sound even. Drag the first and last tone; click a key to hear it and the key an octave higher, which share a name.`,
      deps: ['music-1.3', 'pma-8.6'],
      refs: ['Sethares ch. 2', 'Loy I ch. 3'],
      tags: ['pitch', 'octave'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Octave' },
      viz(v) {
        const M = v.M, F_LO = 50, F_HI = 2000, KLO = 52, KHI = 1980, Y = 0.8, STEP = 0.5;
        const mode = v.select('spacing', [{ value: 'lin', label: 'equal differences $+\\Delta f$' }, { value: 'log', label: 'equal ratios $\\times r$' }, { value: 'oct', label: 'octaves $\\times 2$' }], 'lin');
        const nS = v.slider('number of tones', 3, 12, 8, { int: true });
        const lin = v.stage({ x: [0, F_HI], y: [0, 1.08], height: 165, axes: 'box', yticks: [], xlabel: 'f (Hz)', full: true, title: 'a linear frequency axis' });
        const lg = v.stage({ x: [F_LO, F_HI], y: [0, 1.08], xlog: true, height: 165, axes: 'box', yticks: [], xlabel: 'f (Hz)', full: true, title: 'a logarithmic frequency axis: the piano keyboard' });
        const hA = lg.handle(110, Y, { color: 'accent', constrain: (x) => [M.clamp(x, 55, hB.x / 1.6), Y] });
        const hB = lg.handle(1320, Y, { color: 'accent', constrain: (x) => [M.clamp(x, hA.x * 1.6, 1900), Y] });
        const ph = playhead(v);
        let playing = null, clicked = null;
        const tones = () => {
          const f0 = hA.x, f1 = hB.x, n = nS.value;
          if (mode.value === 'oct') { const out = []; for (let f = f0; f <= F_HI; f *= 2) out.push(f); return out; }
          if (mode.value === 'lin') return M.range(n).map((k) => f0 + ((f1 - f0) * k) / (n - 1));
          return M.range(n).map((k) => f0 * Math.pow(f1 / f0, k / (n - 1)));
        };
        const voice = { harmonics: 4, rolloff: 1.4, duration: 0.42, gain: 0.2, release: 0.12 };
        v.soundButton('Play the sequence', (snd) => {
          const fs = tones(); playing = fs; clicked = null;
          fs.forEach((f, i) => snd.tone(f, { ...voice, delay: i * STEP }));
          ph.start(fs.length * STEP);
        });
        lg.onClick((x, y) => {
          if (y > 0.5) return;
          const m = Math.round(M.freqToMidi(M.clamp(x, KLO, KHI / 2)));
          const snd = v.sound(); snd.stop();
          snd.tone(M.midiToFreq(m), { ...voice, duration: 0.6 }); snd.tone(M.midiToFreq(m + 12), { ...voice, duration: 0.6, delay: 0.7 });
          clicked = m; playing = null; ph.start(1.4);
        });
        v.render(() => {
          hB.visible = mode.value !== 'oct'; nS.el.hidden = mode.value === 'oct';
          const fs = tones(), t = ph.t, cur = t != null && playing ? Math.floor(t / STEP) : -1;
          const marks = new Set();
          if (t != null && clicked != null) marks.add(t < 0.7 ? clicked : clicked + 12);
          for (const S of [lin, lg]) {
            // alternate octaves of A
            for (let a = 55, i = 0; a < F_HI; a *= 2, i++) {
              S.rect(Math.max(a, S === lin ? 0 : F_LO), 0.52, Math.min(2 * a, F_HI), 1.08, { fill: i % 2 ? 'accent' : 'orange', fillAlpha: 0.07, stroke: false });
              const xm = S === lin ? 1.5 * a : a * Math.SQRT2;
              if (S.X(Math.min(2 * a, F_HI)) - S.X(a) > 70) S.text(`A${i + 1}–A${i + 2}`, xm, 1.0, { align: 'center', color: 'muted', size: 10.5 });
            }
            keyboard(S, M, KLO, KHI, 0.04, 0.5, marks);
            S.path(fs.map((f) => [f, Y]), { color: 'gold', width: 1.5, alpha: 0.6 });
            let lastX = -1e9;
            fs.forEach((f, i) => {
              const on = i === cur;
              S.dot(f, Y, { r: on ? 8 : 5, color: on ? 'red' : 'gold' });
              const X = S.X(f);
              if (X - lastX > 30) { S.text(M.noteName(Math.round(M.freqToMidi(f))), f, Y + 0.13, { align: 'center', color: on ? 'red' : 'ink', size: 11 }); lastX = X; }
            });
          }
        });
        v.legend([['gold', 'the tones of the sequence', { dot: true }], ['orange', 'one octave (×2), alternately shaded', { area: true }]]);
        v.readout(() => {
          const fs = tones(), r = fs.slice(1).map((f, i) => f / fs[i]), d = fs.slice(1).map((f, i) => f - fs[i]);
          const rs = r.map((x) => v.fix(x, 2)).join(', ');
          if (mode.value === 'lin') return `equal differences: every step adds $\\Delta f$ = ${v.fix(d[0], 0)} Hz, but the ratios shrink, ${rs}: the steps sound smaller and smaller and crowd together on the keyboard`;
          if (mode.value === 'log') return `equal ratios: every step multiplies by $r$ = ${v.fix(r[0], 3)} (ratios ${rs}), although the differences grow from ${v.fix(d[0], 0)} Hz to ${v.fix(d[d.length - 1], 0)} Hz: the steps sound equal and sit evenly on the keyboard`;
          return `octaves: ${fs.map((f) => `${v.fix(f, 0)} Hz`).join(' → ')}, ratio 2 each time; names ${fs.map((f) => M.noteName(Math.round(M.freqToMidi(f)))).join(', ')}: the same letter every time, the same distance (12 keys) on the keyboard`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.6
    {
      num: '1.6',
      kind: 'Definition',
      name: 'Cents',
      statement: String.raw`The **cent** divides the octave into 1200 equal steps on a logarithmic scale. The interval from $f_1$ up to $f_2$ measures
$$c(f_1,f_2)=1200\,\log_2\frac{f_2}{f_1}\ \text{cents},$$
so an octave is $1200$ ¢, an equal-tempered semitone $100$ ¢, the pure fifth $3/2$ is $701.955$ ¢ and the pure major third $5/4$ is $386.314$ ¢; an interval downward has negative cents. Because the logarithm turns products into sums, **stacking intervals multiplies their ratios and adds their cents**: $c(f_1,f_3)=c(f_1,f_2)+c(f_2,f_3)$. Small differences of pitch are quoted in cents: two successive tones a few cents apart are near the limit of what listeners can tell apart in the middle of the range (the threshold varies from listener to listener, roughly from 3 to 10 ¢).`,
      idea: String.raw`Pitch is logarithmic (1.5), so the right ruler for intervals is $\log f$, and choosing base 2 with the factor 1200 makes the octave exactly 1200 units. The identity $\log_2(r_1r_2)=\log_2r_1+\log_2r_2$ (pma-8.6) is the whole content of "ratios multiply, cents add". Stacking pure intervals exposes the small mismatches that tuning theory is about: four fifths less two octaves overshoot a pure major third by the syntonic comma, 21.5 ¢, and twelve fifths overshoot seven octaves by the Pythagorean comma, 23.5 ¢.`,
      caption: String.raw`Top: intervals stacked end to end on a cents axis. Choose a chain, or build your own with the buttons; the readout multiplies the ratios and adds the cents, and they always agree. The magnifier shows the tiny gap (a *comma*) between two chains, and *chain ends* plays it. Bottom: drag $f_2$ against $f_1$; *together* lets you hear the difference as beats, and *5 ¢ vs 50 ¢* plays both kinds of pair.`,
      deps: ['music-1.5', 'pma-8.6'],
      refs: ['Benson ch. 5', 'Sethares app. B'],
      tags: ['intervals', 'cents'],
      credit: 'Alexander J. Ellis, 1885',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Cent_(music)' },
      viz(v) {
        const M = v.M;
        const IV = {
          '3/2': { p: 3, q: 2, color: 'accent' }, '4/3': { p: 4, q: 3, color: 'purple' }, '5/4': { p: 5, q: 4, color: 'green' },
          '6/5': { p: 6, q: 5, color: 'teal' }, '2/1': { p: 2, q: 1, color: 'orange' },
        };
        const PRE = {
          syn: { label: 'syntonic comma', a: ['3/2', '3/2', '3/2', '3/2', '-2/1', '-2/1'], b: ['5/4'] },
          pyth: { label: 'Pythagorean comma', a: Array(12).fill('3/2'), b: Array(7).fill('2/1') },
          dies: { label: 'diesis', a: ['5/4', '5/4', '5/4'], b: ['2/1'] },
          custom: { label: 'my chain', a: ['3/2', '4/3'], b: ['2/1'] },
        };
        const sel = v.select('chain', Object.entries(PRE).map(([value, o]) => ({ value, label: o.label })), 'syn');
        const toCustom = () => { if (sel.value !== 'custom') { PRE.custom.a = PRE[sel.value].a.slice(); PRE.custom.b = PRE[sel.value].b.slice(); sel.set('custom'); } };
        const add = (e) => () => { toCustom(); if (PRE.custom.a.length < 24) PRE.custom.a.push(e); };
        v.button('$+\\tfrac32$', add('3/2')); v.button('$+\\tfrac54$', add('5/4')); v.button('$+\\tfrac65$', add('6/5')); v.button('$-$ octave', add('-2/1'));
        v.button('clear', () => { toCustom(); PRE.custom.a = []; PRE.custom.b = []; });
        const f1S = v.slider('$f_1$', 110, 880, 440, { log: true, fmt: (x) => Math.round(x) + ' Hz' });
        const top = v.stage({ x: [-100, 1500], y: [0.35, 3.6], height: 255, axes: 'box', yticks: [], xlabel: '¢', full: true, title: 'stacking intervals: ratios multiply, cents add' });
        const bot = v.stage({ x: [-150, 150], y: [0, 1], height: 150, axes: 'box', yticks: [], xticks: [-150, -100, -50, 0, 50, 100, 150].map((c) => [c, (c > 0 ? '+' : c < 0 ? '−' : '') + Math.abs(c) + ' ¢']), full: true, title: 'two tones: $f_2$ against $f_1$' });
        const h2 = bot.handle(50, 0.45, { color: 'orange', label: 'f₂', labelPos: 'n', constrain: (x) => [M.clamp(x, -148, 148), 0.45] });
        const centsOf = (e) => (e[0] === '-' ? -1 : 1) * 1200 * Math.log2(IV[e.replace('-', '')].p / IV[e.replace('-', '')].q);
        const total = (ch) => ch.reduce((s, e) => s + centsOf(e), 0);
        const ratio = (ch) => {
          let P = 1, Q = 1;
          for (const e of ch) { const I = IV[e.replace('-', '')]; if (e[0] === '-') { P *= I.q; Q *= I.p; } else { P *= I.p; Q *= I.q; } const g = M.gcd(P, Q); P /= g; Q /= g; }
          return [P, Q];
        };
        const frac = ([P, Q]) => (Q === 1 ? `${P}` : `\\tfrac{${P}}{${Q}}`);
        const f2 = () => f1S.value * Math.pow(2, h2.x / 1200);
        const pair = { harmonics: 4, rolloff: 1.5, duration: 0.55, gain: 0.2, release: 0.1 };
        v.soundButton('$f_1$ then $f_2$', (snd) => { snd.tone(f1S.value, pair); snd.tone(f2(), { ...pair, delay: 0.65 }); });
        v.soundButton('together', (snd) => snd.chord(f1S.value, f2(), { ...pair, duration: 2.5 }));
        v.soundButton('5 ¢ vs 50 ¢', (snd) => {
          const f = f1S.value;
          [[0, 5], [1.6, 50]].forEach(([d, c]) => { snd.tone(f, { ...pair, delay: d }); snd.tone(f * Math.pow(2, c / 1200), { ...pair, delay: d + 0.62 }); });
        });
        v.soundButton('chain ends', (snd) => {
          const P = PRE[sel.value], cA = total(P.a), cB = P.b.length ? total(P.b) : 0, sh = 1200 * Math.floor(cA / 1200);
          const fa = f1S.value * Math.pow(2, (cA - sh) / 1200), fb = f1S.value * Math.pow(2, (cB - sh) / 1200);
          snd.tone(fa, pair); snd.tone(fb, { ...pair, delay: 0.65 }); snd.chord(fa, fb, { ...pair, duration: 2.2, delay: 1.35 });
        });
        const rowA = [1.75, 2.35], rowB = [0.75, 1.35];
        const drawRow = (ch, [y0, y1]) => {
          let c0 = 0;
          for (const e of ch) {
            const dc = centsOf(e), I = IV[e.replace('-', '')], down = e[0] === '-', a = Math.min(c0, c0 + dc), b = Math.max(c0, c0 + dc);
            top.rect(a, y0, b, y1, { fill: I.color, fillAlpha: down ? 0.1 : 0.32, color: I.color, width: 1.2, dash: down ? [4, 3] : null });
            const px = top.X(b) - top.X(a), lab = (down ? '÷' : '×') + (I.q === 1 ? I.p : `${I.p}/${I.q}`);
            if (px > 30) top.text(lab, (a + b) / 2, (y0 + y1) / 2 + (px > 62 ? 0.09 : 0), { align: 'center', color: 'ink', size: 11.5, weight: 600 });
            if (px > 62) top.text(`${dc > 0 ? '+' : '−'}${v.fix(Math.abs(dc), 1)}`, (a + b) / 2, (y0 + y1) / 2 - 0.13, { align: 'center', color: 'muted', size: 10 });
            c0 += dc;
          }
          return c0;
        };
        v.render(() => {
          const P = PRE[sel.value], cA = total(P.a), cB = P.b.length ? total(P.b) : null;
          let lo = 0, hi = 0, acc = 0;
          for (const e of P.a) { acc += centsOf(e); lo = Math.min(lo, acc); hi = Math.max(hi, acc); }
          if (cB != null) hi = Math.max(hi, cB);
          hi = Math.max(hi, lo + 600);
          const pad = 0.04 * (hi - lo);
          top.setView([lo - pad, hi + pad], null);
          drawRow(P.a, rowA);
          if (cB != null) drawRow(P.b, rowB);
          top.text('stacked intervals', lo - pad * 0.6, 2.47, { align: 'left', color: 'muted', size: 11 });
          if (cB != null) top.text('compared with', lo - pad * 0.6, 1.47, { align: 'left', color: 'muted', size: 11 });
          top.line(cA, 0.55, cA, 2.5, { color: 'accent', width: 1.6, dash: [4, 3] });
          if (cB != null) {
            top.line(cB, 0.55, cB, 2.5, { color: 'orange', width: 1.6, dash: [4, 3] });
            // magnifier on the gap between the two chain ends
            const span = hi - lo + 2 * pad, ix0 = hi + pad - 0.42 * span, ix1 = hi + pad - 0.02 * span, e = (cA + cB) / 2, hw = Math.max(25, 0.8 * Math.abs(cA - cB) + 8);
            const mp = (c) => ix0 + ((c - (e - hw)) / (2 * hw)) * (ix1 - ix0);
            top.rect(ix0, 2.62, ix1, 3.52, { fill: 'panel', fillAlpha: 1, color: 'muted', width: 1 });
            top.line((ix0 + ix1) / 2, 2.62, e, 2.5, { color: 'muted', width: 1, dash: [2, 3] });
            for (let c = Math.ceil((e - hw) / 10) * 10; c <= e + hw; c += 10) top.line(mp(c), 2.62, mp(c), 2.68, { color: 'muted', width: 1 });
            top.rect(ix0, 3.08, Math.max(ix0, Math.min(ix1, mp(cA))), 3.3, { fill: 'accent', fillAlpha: 0.3, stroke: false });
            top.rect(ix0, 2.76, Math.max(ix0, Math.min(ix1, mp(cB))), 2.98, { fill: 'orange', fillAlpha: 0.3, stroke: false });
            top.rect(mp(Math.min(cA, cB)), 2.72, mp(Math.max(cA, cB)), 3.34, { fill: 'red', fillAlpha: 0.22, stroke: false });
            top.line(mp(cA), 3.04, mp(cA), 3.34, { color: 'accent', width: 2 });
            top.line(mp(cB), 2.72, mp(cB), 3.02, { color: 'orange', width: 2 });
            top.text(`gap ${v.fix(Math.abs(cA - cB), 2)} ¢`, mp(Math.max(cA, cB)) + 0.012 * span, 3.03, { align: 'left', color: 'red', size: 12, weight: 700 });
            top.text(`zoom ×${Math.round((ix1 - ix0) / (2 * hw))}`, ix0 + 0.01 * span, 3.43, { align: 'left', color: 'muted', size: 10.5 });
          }
          // ---- two tones
          bot.vband(-8, 8, { color: 'green', alpha: 0.1 });
          for (const c of [-100, 100]) { bot.vline(c, { color: 'muted', width: 1 }); bot.text(noteOf(M, f1S.value * Math.pow(2, c / 1200)), c, 0.9, { align: 'center', color: 'muted', size: 11 }); }
          for (let c = -140; c <= 140; c += 10) if (c % 50) bot.line(c, 0, c, 0.06, { color: 'faint', width: 1 });
          bot.text('≈ smallest audible step', 0, 0.12, { align: 'center', color: 'green', size: 10.5 });
          bot.dot(0, 0.45, { r: 6, color: 'accent', label: 'f₁', labelPos: 's', math: true });
          bot.measure(0, 0.72, h2.x, 0.72, `${v.fix(h2.x, 1)} ¢`, { color: 'orange', math: false, size: 12, offset: -11 });
        });
        v.legend([['accent', 'fifth $3/2$', { area: true }], ['purple', 'fourth $4/3$', { area: true }], ['green', 'major third $5/4$', { area: true }], ['teal', 'minor third $6/5$', { area: true }], ['orange', 'octave $2/1$ (dashed: down)', { area: true }]]);
        v.readout(() => {
          const P = PRE[sel.value], cA = total(P.a), rA = ratio(P.a), direct = 1200 * Math.log2(rA[0] / rA[1]);
          const counts = {};
          for (const e of P.a) counts[e] = (counts[e] || 0) + 1;
          const sum = Object.entries(counts).map(([e, n]) => `${e[0] === '-' ? '−' : '+'}${n > 1 ? n + '×' : ''}${v.fix(Math.abs(centsOf(e)), 2)}`).join(' ').replace(/^\+/, '');
          let s = P.a.length ? `product of ratios $${frac(rA)}$ = ${v.fix(rA[0] / rA[1], 5)} → $1200\\log_2$ = ${v.fix(direct, 2)} ¢; sum of cents ${sum || '0'} = ${v.fix(cA, 2)} ¢ ${Math.abs(direct - cA) < 1e-6 ? '✓' : '✗'}` : 'empty chain: add intervals with the buttons';
          if (P.b.length) { const rB = ratio(P.b), cB = total(P.b); s += ` · vs $${frac(rB)}$ = ${v.fix(cB, 2)} ¢: gap ${v.fix(Math.abs(cA - cB), 2)} ¢, ratio $${frac(rA[0] * rB[1] > rB[0] * rA[1] ? ratio([...P.a, ...P.b.map((e) => (e[0] === '-' ? e.slice(1) : '-' + e))]) : ratio([...P.b, ...P.a.map((e) => (e[0] === '-' ? e.slice(1) : '-' + e))]))}$`; }
          return `${s} · two tones: $f_1$ = ${v.fix(f1S.value, 1)} Hz, $f_2$ = ${v.fix(f2(), 2)} Hz, $f_2/f_1$ = ${v.fix(f2() / f1S.value, 5)} → ${v.fix(h2.x, 1)} ¢ ($\\Delta f$ = ${v.fix(f2() - f1S.value, 2)} Hz, the beat rate when played together)`;
        });
      },
    },
  ],
};
