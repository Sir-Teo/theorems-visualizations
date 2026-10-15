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
        const M = v.M, X0 = 0.3, QMAX = 40;
        const nS = v.slider('beads $N$', 4, 160, 14, { int: true });
        const shp = v.select('pulse', [{ value: 'gauss', label: 'smooth' }, { value: 'tri', label: 'kinked' }, { value: 'box', label: 'sharp-edged' }], 'gauss');
        const wS = v.slider('pulse width $w/L$', 0.04, 0.2, 0.09, { step: 0.005 });
        const s = v.stage({ x: [-0.01, 1.01], y: [-0.5, 1.3], height: 240, axes: false, full: true });
        const dp = v.stage({ x: [0, QMAX], y: [0, QMAX], height: 250, axes: 'box', xlabel: 'wavenumber k  (units of 2π/L)', ylabel: 'ω  (units of 2πc/L)', title: 'dispersion: chain against continuum' });
        const ep = v.stage({ x: [4, 512], y: [1e-4, 2], xlog: true, ylog: true, height: 250, axes: 'box', xlabel: 'beads N', ylabel: 'rms error after one lap', title: 'convergence to the wave equation' });
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
          s.corner(`t = ${v.fix(tau, 2)} L/c  (lap ${Math.floor(tau) + 1})`, 'tl', { color: 'ink' });
          s.text('ring: the right end is joined to the left end', 0.5, -0.38, { align: 'center', color: 'muted', size: 11.5 });
          // ---- dispersion
          const w = wS.value, name = shp.value, H = 13;
          dp.fn((q) => H * spec(q, w, name), { domain: [0, QMAX], n: 500, fill: 'gold', fillAlpha: 0.25, color: 'gold', width: 1.2 });
          dp.text('pulse spectrum |f̂(k)|', 0.7, H + 1.4, { color: 'gold', size: 11.5 });
          dp.line(0, 0, QMAX, QMAX, { color: 'green', width: 2, dash: [7, 5] });
          dp.text('continuum: ω = ck', QMAX - 1.2, QMAX - 4.2, { color: 'green', size: 11.5, align: 'right' });
          const qe = N / 2;
          dp.fn((q) => (q <= qe ? (N / Math.PI) * Math.sin((Math.PI * q) / N) : NaN), { domain: [0, Math.min(QMAX, qe)], n: 400, color: 'accent', width: 2.4 });
          if (qe < QMAX) { dp.vline(qe, { color: 'red', dash: [3, 4], width: 1.2 }); dp.text('zone edge k = π/a', qe + 0.5, 3, { color: 'red', size: 11.5 }); }
          dp.text('chain: ω = (2c/a) sin(ka/2)', Math.min(qe, QMAX) * 0.55, (N / Math.PI) * Math.sin((Math.PI * Math.min(qe, QMAX) * 0.55) / N) + 2.6, { color: 'accent', size: 11.5, align: 'right' });
          // ---- convergence
          const cv = errCurve();
          ep.path(cv, { color: 'accent', width: 2 });
          ep.dots(cv, { r: 2.2, color: 'accent' });
          const e0 = cv[0][1];
          ep.line(4, e0 * 0.5, 512, e0 * 0.5 * (4 / 512) ** 2, { color: 'muted', dash: [4, 4], width: 1.2 });
          ep.text('slope −2', 40, e0 * 0.5 * (0.1) ** 2 * 0.55, { color: 'muted', size: 11.5 });
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
        const aS = v.slider('amplitude $A$ (cm)', 0.2, 12, 0.6, { log: true, sig: 2 });
        const s = v.stage({ x: [-0.01, 1.01], y: [-0.1, 0.2], height: 230, axes: false, full: true });
        const wl = v.stage({ x: [0, 1], y: [0, 24], height: 240, axes: 'box', xlabel: 'crest position x (m)', ylabel: 't (ms)', title: 'world line of the crest' });
        const sp = v.stage({ x: [0.2, 12], y: [0.96, 1.9], xlog: true, height: 240, axes: 'box', xlabel: 'amplitude A (cm)', ylabel: 'speed / √(T/μ)', title: 'measured pulse speed against amplitude' });
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
          wl.line(X0, 0, X0 + c * 0.024, 24, { color: 'green', width: 2, dash: [7, 5] });
          wl.dots(rec.map((r) => [r[1], tms(r[0])]), { r: 3.2, color: 'gold' });
          if (tau < 1) { const p = S.peak(); if (p.x < 0.95) wl.dot(p.x, tms(tau), { r: 5, color: 'accent' }); }
          // ---- speed against amplitude
          const cv = speedCurve();
          sp.hline(1, { color: 'green', width: 2, dash: [7, 5] });
          sp.text('linear theory: c = √(T/μ)', 0.25, 1.02, { color: 'green', size: 11.5, baseline: 'bottom' });
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
  ],
};
