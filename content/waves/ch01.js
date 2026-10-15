// Waves & Optics — Chapter 1: The wave equation
import { TAU, pulse, dpulse, makeChain, wall, rod, ring } from './ch01.shared.js';

/** Periodic pulse on [0, 1): profile `name`, FWHM w, centred at x0. */
const periodic = (name, w, x0) => (x) => { let u = (((x - x0) % 1) + 1) % 1; if (u > 0.5) u -= 1; return pulse(name, u / w); };

/**
 * Exact motion of a ring of N beads (length 1, wave speed c = 1 in the continuum limit) launched so that every
 * Fourier component travels to the right: mode q has ω_q = 2N|sin(πq/N)| (the chain's dispersion relation).
 * Returns the bead displacements y_j(τ), j = 0..N−1, bead j at x = j/N.
 */
function ringChain(M, N, F, tau) {
  const re = new Float64Array(N), im = new Float64Array(N);
  for (let j = 0; j < N; j++) re[j] = F(j / N);
  M.fft(re, im);
  for (let q = 0; q < N; q++) {
    const qq = q <= N / 2 ? q : q - N, w = 2 * N * Math.abs(Math.sin((Math.PI * qq) / N));
    if (2 * q === N) { const c = Math.cos(w * tau); re[q] *= c; im[q] *= c; continue; }
    const ph = -Math.sign(qq) * w * tau, c = Math.cos(ph), s = Math.sin(ph);
    const r = re[q] * c - im[q] * s; im[q] = re[q] * s + im[q] * c; re[q] = r;
  }
  M.ifft(re, im);
  return re;
}

/**
 * Geometrically exact elastic string: N beads moving in the plane, joined by springs of rest length a/(1+ε₀) and
 * axial stiffness EA = T₀/ε₀, so the pre-tension is T₀. Units: L = 1, μ = 1, T₀ = 1 (c = 1). Ends fixed.
 */
function elasticString(N, eps0) {
  const a = 1 / N, l0 = a / (1 + eps0), EA = 1 / eps0, m = a;
  const X = new Float64Array(N + 1), Y = new Float64Array(N + 1), VX = new Float64Array(N + 1), VY = new Float64Array(N + 1);
  const AX = new Float64Array(N + 1), AY = new Float64Array(N + 1), Ts = new Float64Array(N);
  const S = { N, X, Y, VX, VY, Ts, t: 0, dt: 0.4 * a * Math.sqrt(eps0) };
  const acc = () => {
    AX.fill(0); AY.fill(0);
    for (let i = 0; i < N; i++) {
      const dx = X[i + 1] - X[i], dy = Y[i + 1] - Y[i], l = Math.hypot(dx, dy), T = Math.max(0, EA * (l / l0 - 1));
      Ts[i] = T; const fx = (T * dx) / l, fy = (T * dy) / l;
      AX[i] += fx / m; AY[i] += fy / m; AX[i + 1] -= fx / m; AY[i + 1] -= fy / m;
    }
    AX[0] = AY[0] = AX[N] = AY[N] = 0;
  };
  S.set = (fy, fv) => { for (let i = 0; i <= N; i++) { X[i] = i * a; Y[i] = i === 0 || i === N ? 0 : fy(X[i]); VX[i] = 0; VY[i] = i === 0 || i === N ? 0 : fv(X[i]); } S.t = 0; acc(); };
  S.step = () => {
    const dt = S.dt;
    for (let i = 1; i < N; i++) { VX[i] += 0.5 * dt * AX[i]; VY[i] += 0.5 * dt * AY[i]; X[i] += dt * VX[i]; Y[i] += dt * VY[i]; }
    acc();
    for (let i = 1; i < N; i++) { VX[i] += 0.5 * dt * AX[i]; VY[i] += 0.5 * dt * AY[i]; }
    S.t += dt;
  };
  /** position of the highest point (parabolic interpolation through the top bead and its neighbours) */
  S.peak = () => {
    let k = 1; for (let i = 2; i < N; i++) if (Y[i] > Y[k]) k = i;
    const y0 = Y[k - 1], y1 = Y[k], y2 = Y[k + 1], den = y0 - 2 * y1 + y2, d = den < 0 ? (0.5 * (y0 - y2)) / den : 0;
    return { x: X[k] + d * (X[k + 1] - X[k - 1]) / 2, y: y1 };
  };
  return S;
}

export default {
  collection: 'waves',
  chapter: 1,
  title: 'The wave equation',
  summary: String.raw`A chain of coupled oscillators becomes, in the continuum limit, a string obeying the wave equation, whose general solution is two shapes sliding in opposite directions at $c=\sqrt{T/\mu}$. Linearity gives superposition and the complex-exponential bookkeeping of harmonic waves. A travelling wave carries energy, split evenly between motion and stretch, and the string's **impedance** $Z=\sqrt{T\mu}$ decides how much of it is reflected wherever the medium changes, which is why a well-graded taper or a quarter-wave layer can pass a wave on without an echo. The same equation describes sound in a gas, with the speed set by $\gamma P/\rho$, and in three dimensions spherical waves that weaken as $1/r$. Only in odd dimensions do sharp signals stay sharp, and moving sources produce Doppler shifts and, beyond the wave speed, shock cones.`,
  items: [
    // ------------------------------------------------------------------ 1.1
    {
      num: '1.1',
      kind: 'Model',
      name: 'Continuum limit of a chain: the wave equation',
      statement: String.raw`Take $N$ equal beads of mass $m$ spaced $a$ apart, each joined to its neighbours by springs of stiffness $\kappa$ (or threaded on a taut string), so that bead $j$ moves according to
$$m\,\ddot y_j=\kappa\,\big(y_{j+1}-2y_j+y_{j-1}\big).$$
Let $N\to\infty$ and $a\to0$ while the mass per unit length $\mu=m/a$ and the product $\kappa a$ stay fixed ($\kappa a$ is the tension $T$ for a beaded string, or Young's modulus times the cross-section for a rod). Then displacements that vary smoothly on the scale of $a$ obey the **wave equation**
$$\frac{\partial^2 y}{\partial t^2}=c^2\,\frac{\partial^2 y}{\partial x^2},\qquad c=\sqrt{\frac{\kappa a}{\mu}} .$$
Quantitatively: a sinusoid of wavenumber $k$ on the chain has angular frequency
$$\omega=\frac{2c}{a}\,\Big|\sin\frac{ka}{2}\Big|=ck\Big(1-\frac{(ka)^2}{24}+\cdots\Big),$$
so all components with $ka\ll1$ travel at the same speed $c$, while short waves lag behind. A pulse of width $w$ is carried faithfully over a distance $D$ as long as $Da^2/w^3$ is small.`,
      idea: String.raw`Taylor's theorem turns the second difference into a second derivative: $y_{j+1}-2y_j+y_{j-1}=a^2y_{xx}+\tfrac{a^4}{12}y_{xxxx}+\cdots$. Dividing by $m=\mu a$ gives $\ddot y=(\kappa a/\mu)\,y_{xx}$ plus a correction of relative size $(ka)^2$. That correction is the chain's dispersion relation (mech-11.8) expanded near $k=0$. It vanishes in the limit for every fixed $k$, but a sharp pulse always contains wavenumbers comparable to $1/a$. Those components fall behind and trail ripples after the pulse: the continuum description converges like $1/N^2$ for smooth pulses and much more slowly for kinked or sharp-edged ones.`,
      caption: String.raw`A ring of $N$ beads, so the pulse can circulate forever. Every Fourier component of the pulse is launched to the right and moves at the chain's own speed $\omega/k$. The dashed green curve is the continuum wave $f(x-ct)$. With few beads the pulse sheds a trail of ripples and falls behind. Raise $N$ and the beads lock onto the continuum curve. Below left: the chain's dispersion curve against the straight line $\omega=ck$, with the pulse's spectrum shaded underneath; convergence needs the spectrum to sit where the two agree. Below right: the error after one lap against $N$, computed for every $N$. Try the kinked and sharp-edged pulses to see the convergence slow down.`,
      deps: ['mech-11.8'],
      see: ['music-2.1', 'pde-1.3', 'cm-3.6', 'waves-3.3'],
      refs: ['Crawford ch. 2'],
      tags: ['wave equation', 'continuum limit', 'dispersion'],
      credit: 'Johann Bernoulli (beaded string), 1727; Lagrange, 1759',
      scope: String.raw`Holds for small transverse displacements of a uniform chain, on length scales much larger than the spacing $a$, i.e. for wavenumbers $ka\ll1$. Near $ka\sim1$ the chain disperses, and above $k=\pi/a$ it has no further modes at all.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Wave_equation#From_Hooke%27s_law' },
      viz(v) {
        const M = v.M, X0 = 0.3;
        const nS = v.slider('beads $N$', 4, 160, 24, { int: true });
        const shp = v.select('pulse', [{ value: 'gauss', label: 'smooth' }, { value: 'tri', label: 'kinked' }, { value: 'box', label: 'sharp-edged' }], 'gauss');
        const wS = v.slider('pulse width $w/L$', 0.04, 0.2, 0.09, { step: 0.005 });
        const s = v.stage({ x: [-0.01, 1.01], y: [-0.5, 1.3], height: 240, axes: false, full: true });
        const dp = v.stage({ x: [0, 20], y: [0, 20], height: 250, axes: 'box', xlabel: 'wavenumber k  (units of 2π/L)', ylabel: 'ω  (units of 2πc/L)', title: 'dispersion: chain against continuum' });
        const ep = v.stage({ x: [4, 512], y: [1e-4, 8], xlog: true, ylog: true, height: 250, axes: 'box', xlabel: 'beads N', ylabel: 'rms error after one lap', title: 'convergence to the wave equation' });
        const spec = (q, w, name) => {
          if (name === 'gauss') return Math.exp(-((Math.PI * q * w) ** 2) / (4 * Math.LN2));
          const sinc = (z) => (Math.abs(z) < 1e-9 ? 1 : Math.sin(Math.PI * z) / (Math.PI * z));
          return name === 'tri' ? sinc(q * w) ** 2 : Math.abs(sinc(q * w));
        };
        let eKey = '', curve = [];
        const errCurve = () => {
          const k = shp.value + wS.value; if (k === eKey) return curve; eKey = k;
          const F = periodic(shp.value, wS.value, X0), Ns = [...new Set(M.range(36).map((i) => Math.round(4 * 128 ** (i / 35))))];
          curve = Ns.map((N) => {
            const y = ringChain(M, N, F, 1); let e = 0, n = 0;
            for (let j = 0; j < N; j++) { const Y = F(j / N); e += (y[j] - Y) ** 2; n += Y * Y; }
            return [N, Math.sqrt(e / Math.max(n, 1e-12))];
          });
          return curve;
        };
        let tau = 0, ys = null, err = 0;
        v.animate((t) => {
          const N = nS.value, F = periodic(shp.value, wS.value, X0);
          tau = t / 4;
          ys = ringChain(M, N, F, tau);
          let e = 0, nn = 0; for (let j = 0; j < N; j++) { const Y = F(j / N - tau); e += (ys[j] - Y) ** 2; nn += Y * Y; } err = Math.sqrt(e / nn);
          // ---- the chain
          s.hline(0, { color: 'faint', width: 1 });
          s.fn((x) => F(x - tau), { domain: [0, 1], n: 800, color: 'green', width: 2.2, dash: [7, 5] });
          const pts = M.range(N).map((j) => [j / N, ys[j]]); pts.push([1, ys[0]]);
          s.path(pts, { color: 'accent', width: N > 60 ? 1.6 : 1.2, alpha: 0.85 });
          s.dots(pts.slice(0, N), { r: N > 80 ? 2.2 : N > 30 ? 3.2 : 5, color: 'accent' });
          s.corner(`${N} beads, spacing a = L/${N}`, 'tr', { color: 'accent', weight: 600 });
          s.corner(`t = ${v.fix(tau, 2)} L/c, lap ${Math.floor(tau) + 1} · the ring closes up at x = L`, 'tl', { color: 'ink' });
          // ---- dispersion
          const w = wS.value, name = shp.value, qe = N / 2, QM = Math.max(10, 0.62 * N), H = 0.3 * QM;
          dp.setView([0, QM], [0, QM]);
          dp.fn((q) => H * spec(q, w, name), { domain: [0, QM], n: 500, fill: 'gold', fillAlpha: 0.25, color: 'gold', width: 1.2 });
          dp.text('pulse spectrum |f̂(k)|', QM * 0.02, H * 1.08, { color: 'gold', size: 11.5, baseline: 'bottom' });
          dp.line(0, 0, QM, QM, { color: 'green', width: 2, dash: [7, 5] });
          dp.text('continuum: ω = ck', QM * 0.6, QM * 0.6, { color: 'green', size: 11.5, align: 'right', dx: -8, dy: -8 });
          dp.fn((q) => (q <= qe ? (N / Math.PI) * Math.sin((Math.PI * q) / N) : NaN), { domain: [0, qe], n: 400, color: 'accent', width: 2.4 });
          dp.vline(qe, { color: 'red', dash: [3, 4], width: 1.2 });
          dp.text('zone edge k = π/a', qe, QM * 0.93, { color: 'red', size: 11.5, align: 'right', dx: -5 });
          dp.text('chain: ω = (2c/a) sin(ka/2)', qe, N / Math.PI, { color: 'accent', size: 11.5, align: 'right', baseline: 'top', dx: -4, dy: 8 });
          // ---- convergence
          const cv = errCurve();
          ep.path(cv, { color: 'accent', width: 2 });
          ep.dots(cv, { r: 2.2, color: 'accent' });
          const eL = cv[cv.length - 1][1] * 0.4, g = (n) => eL * (512 / n) ** 2;
          ep.line(48, g(48), 512, g(512), { color: 'muted', dash: [4, 4], width: 1.2 });
          ep.text('slope −2 (error ∝ 1/N²)', 150, g(150), { color: 'muted', size: 11.5, align: 'right', baseline: 'top', dx: -6, dy: 4 });
          const cur = cv.reduce((b, p) => (Math.abs(Math.log(p[0] / N)) < Math.abs(Math.log(b[0] / N)) ? p : b), cv[0]);
          ep.vline(N, { color: 'gold', width: 1.5 });
          ep.dot(cur[0], cur[1], { r: 5, color: 'gold' });
        }, { period: 12, still: 3.3 });
        v.legend([['accent', 'beaded chain (exact solution)'], ['green', 'continuum wave $f(x-ct)$', { dash: true }], ['gold', 'spectrum of the pulse', { area: true }]]);
        v.readout(() => {
          const N = nS.value, a = 1 / N, w = wS.value, ka = (2 * a) / w;
          const vp = Math.sin(ka / 2) / (ka / 2), vg = Math.cos(ka / 2);
          return `$\\kappa a=T$ and $m/a=\\mu$ are held fixed, so $c=\\sqrt{\\kappa a/\\mu}$ is the same for every $N$ · at the pulse's typical wavenumber $k\\approx 2/w$: $ka$ = ${v.fix(ka, 3)}, phase speed ${v.fix(vp, 4)} $c$, group speed ${v.fix(vg, 4)} $c$ · rms difference between chain and continuum now: ${v.fix(100 * err, 2)} % · the chain's modes stop at $k=\\pi/a$, i.e. ${N / 2} wavelengths per $L$`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.2
    {
      num: '1.2',
      kind: 'Model',
      name: 'Transverse waves on a stretched string',
      statement: String.raw`A perfectly flexible string with mass per unit length $\mu$, stretched to tension $T$, moves sideways according to
$$\mu\,\frac{\partial^2 y}{\partial t^2}=T\,\frac{\partial^2 y}{\partial x^2},$$
the wave equation with speed
$$c=\sqrt{T/\mu},$$
**provided the slope stays small**. The derivation assumes that $|\partial y/\partial x|\ll1$, so that $\sin\theta\approx\tan\theta$, and that the tension does not change as the string moves. For an elastic string pre-stretched by a strain $\varepsilon_0$, a hump of slope $s$ stretches it further by about $s^2/2$, so the second assumption really needs $s^2\ll2\varepsilon_0$. Larger pulses raise the tension, travel faster than $c$ and change shape.`,
      idea: String.raw`Cut out a short piece of string of length $dx$ and apply Newton's second law (mech-1.6) to its transverse motion. The tension pulls along the string at each end; the vertical components are $T\sin\theta$ at $x+dx$ and $-T\sin\theta$ at $x$. For small slopes $\sin\theta\approx\partial y/\partial x$, so the net force is $T\,\partial_x^2y\,dx$, and the mass is $\mu\,dx$. The ratio $T/\mu$ has units of speed squared: stiffness over inertia, the same combination as in the bead chain of 1.1. When the hump is steep, the string between the fixed ends has to get longer, so the tension rises and the restoring force grows faster than linearly.`,
      caption: String.raw`A pulse is launched to the right on a 1 m string (fixed ends). The dashed green curve is the linear prediction, $f(x-ct)$ with $c=\sqrt{T/\mu}$, reflected upside down at the end. The coloured string is a simulation of an elastic string, pre-stretched by 2 % and allowed to stretch and swing freely in the plane; its colour shows the local tension. Change $T$ and $\mu$ and compare the measured speed with $\sqrt{T/\mu}$: the gold dots are the tracked crest, below left. Then raise the amplitude: the crest starts outrunning the prediction. Below right is the measured speed against amplitude.`,
      deps: ['mech-1.6', 'waves-1.1'],
      see: ['music-2.1', 'pde-1.3', 'music-2.5'],
      refs: ['Crawford ch. 2', 'Hecht ch. 2'],
      tags: ['string', 'wave speed', 'nonlinearity'],
      credit: 'Brook Taylor, 1713; d’Alembert, 1747',
      scope: String.raw`Holds for small slopes, $|\partial_x y|^2\ll\varepsilon_0$ (the extra stretch made by the wave must be small compared with the pre-stretch), for a perfectly flexible string without stiffness or damping. Large amplitudes raise the tension and speed and distort the pulse; bending stiffness makes short waves faster (3.3).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/String_vibration' },
      viz(v) {
        const M = v.M, NB = 200, EPS = 0.02, W = 0.06, X0 = 0.25, SLOW = 0.004, TMAX = 1.65;
        const Ts = v.slider('tension $T$ (N)', 20, 200, 100, { step: 1 });
        const mS = v.slider('density $\\mu$ (g/m)', 2, 20, 10, { step: 0.1 });
        const aS = v.slider('amplitude $A$ (cm)', 0.2, 12, 0.25, { log: true, sig: 2 });
        const s = v.stage({ x: [-0.01, 1.01], y: [-0.1, 0.2], height: 230, axes: false, full: true });
        const wl = v.stage({ x: [0, 1], y: [0, 10], height: 240, axes: 'box', xlabel: 'crest position x (m)', ylabel: 't (ms)', title: 'world line of the crest' });
        const sp = v.stage({ x: [0.2, 12], y: [0.9, 2], xlog: true, height: 240, axes: 'box', xlabel: 'amplitude A (cm)', ylabel: 'speed / √(T/μ)', title: 'measured pulse speed against amplitude' });
        const shape = (x) => pulse('gauss', (x - X0) / W), dshape = (x) => dpulse('gauss', (x - X0) / W) / W;
        const runFor = (A) => { const S = elasticString(NB, EPS); S.set((x) => A * shape(x), (x) => -A * dshape(x)); return S; };
        const fitSpeed = (rec) => { if (rec.length < 6) return NaN; return M.linreg(rec.map((r) => r[0]), rec.map((r) => r[1])).slope; };
        // speed against amplitude, measured once (it depends only on A/L, w/L and the pre-strain)
        let curve = null;
        const speedCurve = () => {
          if (curve) return curve;
          curve = [0.2, 0.5, 1, 1.6, 2.5, 3.5, 5, 6.5, 8, 10, 12].map((Acm) => {
            const S = runFor(Acm / 100), rec = [];
            while (S.t < 1.2) { for (let k = 0; k < 20; k++) S.step(); const p = S.peak(); if (p.x > 0.35 && p.x < 0.8) rec.push([S.t, p.x]); if (p.x >= 0.8) break; }
            return [Acm, fitSpeed(rec)];
          });
          return curve;
        };
        let S = null, key = '', rec = [], tau = 0;
        v.animate((t) => {
          const A = aS.value / 100, c = Math.sqrt(Ts.value / (mS.value / 1000));
          if (key !== String(A)) { key = String(A); S = runFor(A); rec = []; }
          tau = (t * SLOW * c) % TMAX;
          if (tau < S.t - 1e-9) { S = runFor(A); rec = []; }
          while (S.t < tau) { S.step(); if (rec.length < 400 && S.t < 1.0) { const p = S.peak(); if (p.x > 0.33 && p.x < 0.82 && (!rec.length || S.t - rec[rec.length - 1][0] > 0.02)) rec.push([S.t, p.x]); } }
          // ---- the string, with an automatic vertical scale
          const hy = 1.3 * Math.max(A, 0.004), span = 2 * hy;
          s.setView([-0.01, 1.01], [-hy, hy]);
          const ex = (s.height / span) / (s.width / 1.02);
          s.hline(0, { color: 'faint', width: 1 });
          s.fn((x) => A * (shape(x - tau + 0) - pulse('gauss', (2 - x - tau - X0) / W)), { domain: [0, 1], n: 600, color: 'green', width: 2, dash: [7, 5] });
          for (let i = 0; i < NB; i++) {
            const r = S.Ts[i] - 1, col = r > 0.005 ? v.mix('accent', 'red', Math.min(1, r / 1.5)) : 'accent';
            s.line(S.X[i], S.Y[i], S.X[i + 1], S.Y[i + 1], { color: col, width: 2.6 });
          }
          wall(s, 0, -0.5 * hy, 0.5 * hy, -1, 0.01); wall(s, 1, -0.5 * hy, 0.5 * hy, 1, 0.01);
          s.corner(`slow motion · t = ${v.fix((tau / c) * 1000, 2)} ms`, 'tl', { color: 'ink' });
          s.corner(ex > 1.05 ? `vertical scale ×${v.fix(ex, ex < 10 ? 1 : 0)}` : 'true proportions', 'tr', { color: 'muted' });
          // ---- world line
          const tms = (u) => (u / c) * 1000;
          wl.line(X0, 0, X0 + c * 0.01, 10, { color: 'green', width: 2, dash: [7, 5] });
          wl.dots(rec.map((r) => [r[1], tms(r[0])]), { r: 3.2, color: 'gold' });
          if (tau < 1) { const p = S.peak(); if (p.x < 0.95) wl.dot(p.x, tms(tau), { r: 5, color: 'accent' }); }
          // ---- speed against amplitude
          const cv = speedCurve();
          sp.setView([0.2, 12], [0.9, Math.max(1.3, ...cv.map((p) => p[1] || 0)) * 1.04]);
          sp.hline(1, { color: 'green', width: 2, dash: [7, 5] });
          sp.text('linear theory: c = √(T/μ)', 0.24, 1, { color: 'green', size: 11.5, baseline: 'bottom', dy: -4 });
          sp.path(cv, { color: 'accent', width: 2 }); sp.dots(cv, { r: 3, color: 'accent' });
          const vm = fitSpeed(rec);
          sp.vline(aS.value, { color: 'gold', width: 1.4 });
          if (isFinite(vm)) sp.dot(aS.value, vm, { r: 5.5, color: 'gold' });
        }, { still: 0.62 / (0.004 * 100) });
        v.legend([['accent', 'simulated elastic string (red = higher tension)'], ['green', 'linear wave equation', { dash: true }], ['gold', 'tracked crest']]);
        v.readout(() => {
          const c = Math.sqrt(Ts.value / (mS.value / 1000)), vm = fitSpeed(rec), A = aS.value / 100;
          const slope = (1.43 * A) / W, tmax = Math.max(...S.Ts);
          const meas = isFinite(vm) ? `measured crest speed ${v.fix(vm * c, 1)} m/s (${vm >= 1 ? '+' : '−'}${v.fix(Math.abs(vm - 1) * 100, 1)} %)` : 'measuring the crest speed…';
          return `$c=\\sqrt{T/\\mu}$ = ${v.fix(c, 1)} m/s · ${meas} · steepest slope of the pulse ${v.fix(slope, 2)}, extra stretch $\\tfrac12 s^2$ = ${v.fix(50 * slope * slope, 1)} % against the pre-stretch $\\varepsilon_0$ = 2 % · highest tension now ${v.fix(tmax, 2)} $T$`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.3
    {
      num: '1.3',
      kind: 'Theorem',
      name: 'D’Alembert’s solution',
      statement: String.raw`Every twice-differentiable solution of the wave equation $u_{tt}=c^2u_{xx}$ on the whole line is a sum of two travelling shapes,
$$u(x,t)=F(x-ct)+G(x+ct),$$
one moving right and one moving left at speed $c$, each keeping its form. Given the initial displacement $u(x,0)=u_0(x)$ and velocity $u_t(x,0)=v_0(x)$, the two shapes are
$$F=\tfrac12\Big(u_0-\tfrac1c W\Big),\qquad G=\tfrac12\Big(u_0+\tfrac1c W\Big),\qquad W(x)=\int_0^x v_0,$$
which gives **d'Alembert's formula**
$$u(x,t)=\frac{u_0(x-ct)+u_0(x+ct)}{2}+\frac1{2c}\int_{x-ct}^{x+ct}v_0(s)\,ds .$$
In particular $u(x,t)$ depends only on the initial data in the interval $[x-ct,\,x+ct]$ (the **domain of dependence**): nothing travels faster than $c$.`,
      idea: String.raw`In the characteristic coordinates $\xi=x-ct$, $\eta=x+ct$ the chain rule turns $u_{tt}-c^2u_{xx}$ into $-4c^2\,\partial_\xi\partial_\eta u$, so the equation says $\partial_\xi(\partial_\eta u)=0$. Then $\partial_\eta u$ is a function of $\eta$ alone, and integrating once more gives $u=F(\xi)+G(\eta)$. The initial conditions give two equations, $F+G=u_0$ and $c(G'-F')=v_0$; integrating the second and solving yields $F$ and $G$. A displacement alone splits into two equal halves. A velocity alone makes $F$ and $G$ equal and opposite, and its integral $W$ produces a plateau that spreads out at speed $c$ in both directions: a hammer blow does not make a travelling bump but a widening raised step.`,
      caption: String.raw`Two pulses heading for each other. The string (blue) is always the sum of the orange shape $F(x-ct)$ moving right and the purple shape $G(x+ct)$ moving left. **Draw** your own initial displacement by dragging across the top panel, and your own initial velocity across the middle one (try a velocity bump alone: it makes a plateau). Below: $u(x,t)$ in space–time. Drag the gold point: its two characteristic lines run back to the initial line and pick out the only stretch of initial data that can affect it. The readout compares d'Alembert's formula with an independent finite-difference simulation.`,
      deps: ['waves-1.2', 'pde-2.2'],
      see: ['music-2.2', 'pde-2.1', 'pde-2.3', 'pde-2.11'],
      refs: ['Crawford ch. 4', 'Hecht ch. 2'],
      tags: ['wave equation', 'travelling waves', 'characteristics'],
      credit: 'Jean le Rond d’Alembert, 1747',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/D%27Alembert%27s_formula' },
      viz(v) {
        const M = v.M, XL = -4, XR = 4, K = 640, DX = (XR - XL) / K, TE = 4;
        const u0 = new Float64Array(K + 1), v0 = new Float64Array(K + 1), W = new Float64Array(K + 1), du0 = new Float64Array(K + 1);
        let ver = 0, amp = 1, vmax = 1;
        const xi = (i) => XL + i * DX;
        const g = (u) => Math.exp(-4 * Math.LN2 * u * u), dg = (u) => -8 * Math.LN2 * u * g(u);
        const preset = (name) => {
          for (let i = 0; i <= K; i++) {
            const x = xi(i); let a = 0, b = 0;
            if (name === 'meet') { a = 0.85 * g((x + 2) / 0.7) - 0.6 * pulse('skew', -(x - 2) / 0.9); b = -0.85 * dg((x + 2) / 0.7) / 0.7 + 0.6 * dpulse('skew', -(x - 2) / 0.9) / 0.9; }
            else if (name === 'split') { a = 0.9 * g(x / 0.8); }
            else if (name === 'kick') { b = 0.9 * (Math.tanh((x + 0.45) / 0.12) - Math.tanh((x - 0.45) / 0.12)) / 2; }
            u0[i] = a; v0[i] = b;
          }
          u0[0] = u0[K] = 0;
        };
        const lerp = (arr, x, out = 0) => { if (x <= XL) return out === 'end' ? arr[0] : 0; if (x >= XR) return out === 'end' ? arr[K] : 0; const u = (x - XL) / DX, i = Math.floor(u), f = u - i; return arr[i] + (arr[Math.min(K, i + 1)] - arr[i]) * f; };
        let fd = null; // finite-difference check: snapshots every 0.05 on the visible grid
        const prep = () => {
          W[0] = 0; for (let i = 1; i <= K; i++) W[i] = W[i - 1] + 0.5 * DX * (v0[i] + v0[i - 1]);
          for (let i = 0; i <= K; i++) du0[i] = (u0[Math.min(K, i + 1)] - u0[Math.max(0, i - 1)]) / ((Math.min(K, i + 1) - Math.max(0, i - 1)) * DX);
          amp = 0.05; vmax = 0.5; for (let i = 0; i <= K; i++) { amp = Math.max(amp, Math.abs(u0[i]), 0.5 * Math.abs(W[i])); vmax = Math.max(vmax, 1.1 * (Math.abs(du0[i]) + Math.abs(v0[i]))); }
          const h = 0.02, L0 = -8.4, n = Math.round(16.8 / h) + 1, dt = 0.5 * h, r2 = 0.25;
          let a = new Float64Array(n), b = new Float64Array(n), c = new Float64Array(n);
          const U = (x) => lerp(u0, x), V = (x) => lerp(v0, x);
          for (let i = 0; i < n; i++) { const x = L0 + i * h; a[i] = U(x); }
          for (let i = 1; i < n - 1; i++) { const x = L0 + i * h; b[i] = a[i] + dt * V(x) + 0.5 * r2 * (a[i + 1] - 2 * a[i] + a[i - 1]); }
          const snaps = [], i0 = Math.round((XL - L0) / h), nv = Math.round((XR - XL) / h) + 1, every = Math.round(0.05 / dt);
          snaps.push(a.slice(i0, i0 + nv));
          for (let s = 1; s <= Math.round(TE / dt); s++) {
            for (let i = 1; i < n - 1; i++) c[i] = 2 * b[i] - a[i] + r2 * (b[i + 1] - 2 * b[i] + b[i - 1]);
            if (s % every === 0) snaps.push(b.slice(i0, i0 + nv));
            [a, b, c] = [b, c, a];
          }
          fd = { snaps, h, nv };
          ver++;
        };
        const fdAt = (x, t) => {
          const u = (x - XL) / fd.h, j = Math.min(fd.snaps.length - 2, Math.floor(t / 0.05)), i = Math.min(fd.nv - 2, Math.floor(u)), fx = u - i, ft = t / 0.05 - j;
          const S0 = fd.snaps[j], S1 = fd.snaps[j + 1];
          return (1 - ft) * ((1 - fx) * S0[i] + fx * S0[i + 1]) + ft * ((1 - fx) * S1[i] + fx * S1[i + 1]);
        };
        const F = (s) => 0.5 * (lerp(u0, s) - lerp(W, s, 'end')), G = (s) => 0.5 * (lerp(u0, s) + lerp(W, s, 'end'));
        const sol = (x, t) => F(x - t) + G(x + t);
        const vel = (x, t) => 0.5 * (lerp(du0, x + t) + lerp(v0, x + t)) - 0.5 * (lerp(du0, x - t) - lerp(v0, x - t));
        preset('meet'); prep();
        const sel = v.select('initial data', [{ value: 'meet', label: 'two pulses' }, { value: 'split', label: 'displacement only' }, { value: 'kick', label: 'velocity only' }, { value: 'drawn', label: 'drawn' }], 'meet', { onChange: (x) => { if (x !== 'drawn') { preset(x); prep(); v.t = 0; } } });
        const s = v.stage({ x: [XL, XR], y: [-1.15, 1.15], height: 200, axes: false, full: true, title: 'displacement u(x, t) — drag across to draw u₀' });
        const vs = v.stage({ x: [XL, XR], y: [-1.15, 1.15], height: 130, axes: false, full: true, title: 'velocity ∂u/∂t — drag across to draw v₀' });
        const xt = v.stage({ x: [XL, XR], y: [0, TE], height: 220, axes: 'box', xlabel: 'x', ylabel: 'ct', full: true, title: 'space–time: red up, blue down' });
        const P = xt.handle(0.6, 2.4, { color: 'gold', label: 'P', constrain: { x: [XL + 0.1, XR - 0.1], y: [0.05, TE - 0.05] } });
        const painter = (stage, arr, pin) => {
          let last = null;
          stage.onDrag((x, y, phase) => {
            if (phase === 'start') { v.pause(); v.t = 0; if (sel.value !== 'drawn') sel.set('drawn'); last = null; }
            const lim = 0.95 * stage.bounds.y[1], yy = M.clamp(y, -lim, lim), i = Math.round(M.clamp((x - XL) / DX, 0, K));
            if (!last) last = [i, yy];
            const [i1, y1] = last, lo = Math.min(i1, i), hi = Math.max(i1, i);
            for (let j = lo; j <= hi; j++) arr[j] = hi === lo ? yy : y1 + ((yy - y1) * (j - i1)) / (i - i1);
            if (pin) { arr[0] = 0; arr[K] = 0; }
            last = [i, yy];
            if (phase === 'end') { for (let p = 0; p < 3; p++) { const c = Float64Array.from(arr); for (let j = 1; j < K; j++) arr[j] = (c[j - 1] + 2 * c[j] + c[j + 1]) / 4; } last = null; prep(); v.play(); }
            else if (arr === v0) { W[0] = 0; for (let j = 1; j <= K; j++) W[j] = W[j - 1] + 0.5 * DX * (v0[j] + v0[j - 1]); }
          });
        };
        painter(s, u0, true); painter(vs, v0, true);
        let tau = 0;
        v.animate((t) => {
          tau = Math.min(t, TE);
          s.hline(0, { color: 'faint', width: 1 }); vs.hline(0, { color: 'faint', width: 1 });
          s.fn((x) => lerp(u0, x), { color: 'muted', width: 1, dash: [3, 4] });
          s.fn((x) => F(x - tau), { color: 'orange', width: 2 });
          s.fn((x) => G(x + tau), { color: 'purple', width: 2 });
          s.fn((x) => sol(x, tau), { color: 'accent', width: 3.2 });
          s.corner(`ct = ${v.fix(tau, 2)}`, 'tl', { color: 'ink', weight: 600 });
          vs.setView([XL, XR], [-vmax, vmax]);
          vs.fn((x) => lerp(v0, x), { color: 'muted', width: 1, dash: [3, 4] });
          vs.fn((x) => vel(x, tau), { color: 'teal', width: 2.4 });
          // ---- space–time
          xt.heat((x, y) => sol(x, y), { range: [-amp, amp], cmap: 'diverging', key: ver, res: 2 });
          xt.axes();
          const a = P.x - P.y, b = P.x + P.y;
          xt.line(P.x, P.y, a, 0, { color: 'orange', width: 2 });
          xt.line(P.x, P.y, b, 0, { color: 'purple', width: 2 });
          xt.line(Math.max(a, XL), 0.04, Math.min(b, XR), 0.04, { color: 'gold', width: 7, cap: 'butt' });
          xt.text('x − ct = const', (P.x + a) / 2, P.y / 2, { color: 'orange', size: 11.5, align: 'right', dx: -6 });
          xt.text('x + ct = const', (P.x + b) / 2, P.y / 2, { color: 'purple', size: 11.5, align: 'left', dx: 6 });
          xt.hline(tau, { color: 'ink', width: 1.4, dash: [5, 4] });
          // domain of dependence on the top panel when the clock reaches P
          if (Math.abs(tau - P.y) < 0.04) { s.vline(P.x, { color: 'gold', width: 1.5 }); s.dot(P.x, sol(P.x, tau), { r: 5, color: 'gold' }); }
        }, { period: TE + 0.8, still: 1.7 });
        v.legend([['orange', 'right-moving $F(x-ct)$'], ['purple', 'left-moving $G(x+ct)$'], ['accent', 'string $u=F+G$'], ['teal', 'velocity $\\partial_t u$'], ['muted', 'initial data', { dash: true }]]);
        v.readout(() => {
          const a = P.x - P.y, b = P.x + P.y;
          const form = 0.5 * (lerp(u0, a) + lerp(u0, b)) + 0.5 * M.integrate((x) => lerp(v0, x), a, b, 400);
          const fg = sol(P.x, P.y), num = fdAt(P.x, P.y);
          return `at P = (${v.fix(P.x, 2)}, ${v.fix(P.y, 2)}): d'Alembert's formula gives ${v.fix(form, 4)} (from $u_0$ at ${v.fix(a, 2)} and ${v.fix(b, 2)} and $\\int v_0$ between) · $F+G$ = ${v.fix(fg, 4)} · finite-difference simulation of $u_{tt}=c^2u_{xx}$: ${v.fix(num, 4)} (difference ${v.fix(Math.abs(num - form), 4)}) · data outside $[x-ct,\\,x+ct]$ cannot reach P`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.4
    {
      num: '1.4',
      kind: 'Definition',
      name: 'Harmonic waves: wavelength, frequency, phase velocity',
      statement: String.raw`A **harmonic** (sinusoidal) travelling wave is
$$y(x,t)=A\cos(kx-\omega t+\varphi),$$
a solution of the wave equation whenever $\omega=ck$. Its **amplitude** is $A$, its **phase** is $kx-\omega t+\varphi$, and:
- the **wavelength** $\lambda=2\pi/k$ is the repeat distance at a fixed time ($k$ is the **wavenumber**);
- the **period** $T=2\pi/\omega$ is the repeat time at a fixed place, and the **frequency** is $f=1/T$;
- the **phase velocity** $v_p=\lambda/T=f\lambda=\omega/k$ is the speed at which any point of constant phase, a crest for instance, moves.

With $+\omega t$ instead of $-\omega t$ the wave travels in the $-x$ direction. On a non-dispersive medium $v_p=c$ for every wavelength; in a dispersive one (chapter 3) $v_p$ depends on $k$.`,
      idea: String.raw`A crest is a place where the phase equals $2\pi n$; following it means keeping $kx-\omega t$ constant, so $dx/dt=\omega/k$. One wavelength passes a fixed observer in one period, which is the same statement as $v_p=\lambda/T$. A sinusoid is the special case of d'Alembert's solution (1.3) with $F(s)=A\cos(ks+\varphi)$; it matters because any shape can be built from sinusoids (2.3) and, in a linear medium, each one travels independently.`,
      caption: String.raw`Set the wavelength and the period. The gold marker rides one crest and its measured speed is compared with $\lambda/T$. Drag the teal probe: it does not travel, it only bobs up and down, and its trace (below left) repeats every period $T$, wherever you put it. Below right: the same wave in space–time. Crests are the red stripes, and their slope is the phase velocity. Reverse the direction and the stripes tilt the other way.`,
      deps: ['waves-1.3'],
      see: ['music-1.3', 'sig-1.5', 'sig-1.4'],
      refs: ['Hecht ch. 2'],
      tags: ['harmonic wave', 'phase velocity'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Phase_velocity' },
      viz(v) {
        const M = v.M, XM = 8, TW = 6;
        const lS = v.slider('wavelength $\\lambda$ (m)', 0.6, 4, 2.2, { step: 0.05 });
        const pS = v.slider('period $T$ (s)', 0.4, 3, 1.5, { step: 0.05 });
        const dir = v.select('direction', [{ value: 1, label: 'towards $+x$' }, { value: -1, label: 'towards $-x$' }], 1);
        const s = v.stage({ x: [0, XM], y: [-1.45, 1.55], height: 220, axes: 'box', xlabel: 'x (m)', yticks: [], full: true });
        const tr = v.stage({ x: [-TW, 0], y: [-1.3, 1.5], height: 210, axes: 'box', xlabel: 'time before now (s)', yticks: [], title: 'what the probe records' });
        const st = v.stage({ x: [0, XM], y: [-TW, 0], height: 210, axes: 'box', xlabel: 'x (m)', ylabel: 't (s)', title: 'space–time (now at the top): crests are red' });
        const probe = s.handle(5.2, -1.25, { color: 'teal', constrain: 'x', label: 'probe' });
        const y = (x, t) => Math.cos((TAU / lS.value) * x - dir.value * (TAU / pS.value) * t);
        // follow a crest numerically: ternary search for the maximum near a guess
        const crestNear = (x0, t) => { const L = lS.value; let a = x0 - L / 3, b = x0 + L / 3; for (let i = 0; i < 40; i++) { const m1 = a + (b - a) / 3, m2 = b - (b - a) / 3; if (y(m1, t) < y(m2, t)) a = m1; else b = m2; } return 0.5 * (a + b); };
        let crest = 2, lastT = 0, vMeas = NaN, key = '', tPeriod = NaN;
        v.animate((t) => {
          const L = lS.value, T = pS.value, d = dir.value, vp = L / T, k = lS.value + ',' + T + ',' + d;
          if (k !== key || t < lastT) { key = k; crest = crestNear(d > 0 ? 1.5 : 6.5, t); lastT = t; }
          crest = crestNear(crest + d * vp * (t - lastT), t);
          lastT = t;
          vMeas = (crestNear(crest + d * vp * 0.01, t + 0.01) - crest) / 0.01;
          if (crest > XM - 0.3 && d > 0) crest -= Math.round((crest - 1.2) / L) * L;
          if (crest < 0.3 && d < 0) crest += Math.round((6.8 - crest) / L) * L;
          crest = crestNear(crest, t);
          // ---- snapshot
          s.hline(0, { color: 'faint', width: 1 });
          s.fn((x) => y(x, t), { color: 'accent', width: 2.6 });
          const c1 = crest, c2 = crest + (c1 + L < XM - 0.1 ? L : -L);
          s.measure(Math.min(c1, c2), 1.28, Math.max(c1, c2), 1.28, 'λ', { color: 'ink' });
          s.vline(probe.x, { color: 'teal', width: 1, dash: [3, 4] });
          s.dot(probe.x, y(probe.x, t), { r: 6, color: 'teal' });
          s.dot(crest, 1, { r: 7, color: 'gold' });
          s.arrow(crest, 1, crest + d * 0.8, 1, { color: 'gold', width: 2 });
          s.corner(`t = ${v.fix(t, 2)} s`, 'tr', { color: 'ink' });
          // ---- probe trace
          tr.hline(0, { color: 'faint', width: 1 });
          tr.fn((u) => y(probe.x, t + u), { color: 'teal', width: 2.2 });
          tr.dot(0, y(probe.x, t), { r: 5, color: 'teal' });
          // two successive maxima before now (numerically from the samples)
          const NS = 900, smp = M.range(NS + 1).map((i) => y(probe.x, t - TW + (TW * i) / NS)), maxes = [];
          for (let i = NS - 1; i >= 1; i--) if (smp[i] >= smp[i - 1] && smp[i] > smp[i + 1]) { const den = smp[i - 1] - 2 * smp[i] + smp[i + 1]; maxes.push(-TW + (TW * (i + (den < 0 ? (0.5 * (smp[i - 1] - smp[i + 1])) / den : 0))) / NS); }
          if (maxes.length >= 2) { tr.measure(maxes[1], 1.25, maxes[0], 1.25, 'T', { color: 'ink' }); tPeriod = maxes[0] - maxes[1]; }
          // ---- space-time (sliding window: the top row is now)
          const t0 = t - TW;
          st.setView([0, XM], [t0, t]);
          st.heat((x, u) => y(x, u), { range: [-1.4, 1.4], cmap: 'diverging', res: 3 });
          st.axes();
          st.clip(() => st.line(crest - d * vp * 4, t - 4, crest, t, { color: 'gold', width: 3 }));
          st.dot(crest, t, { r: 6, color: 'gold' });
          st.text('now', XM, t, { color: 'ink', size: 11.5, align: 'right', baseline: 'top', dx: -6, dy: 4 });
          st.vline(probe.x, { color: 'teal', width: 1.6 });
        }, { still: 2.3 });
        v.legend([['accent', 'the wave now'], ['gold', 'a crest, followed'], ['teal', 'probe at fixed x']]);
        v.readout(() => {
          const L = lS.value, T = pS.value;
          return `$\\lambda$ = ${v.fix(L, 2)} m, $T$ = ${v.fix(T, 2)} s · $f=1/T$ = ${v.fix(1 / T, 3)} Hz · $k=2\\pi/\\lambda$ = ${v.fix(TAU / L, 3)} rad/m · $\\omega=2\\pi/T$ = ${v.fix(TAU / T, 3)} rad/s · $v_p=\\lambda/T=\\omega/k$ = ${v.fix(L / T, 3)} m/s · measured crest speed ${isFinite(vMeas) ? v.fix(Math.abs(vMeas), 3) : '…'} m/s · probe period ${isFinite(tPeriod) ? v.fix(tPeriod, 3) : '…'} s at $x$ = ${v.fix(probe.x, 2)} m`;
        });
      },
    },
  ],
};
