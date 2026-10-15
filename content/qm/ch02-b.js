// Quantum Mechanics — Chapter 2: The wave function (items 2.9–2.15)
//
// Data (verified):
// - Measured hydrogen Balmer lines, vacuum wavelengths (NIST ASD, rounded; same values as qm-1.4): Hα 656.461 nm, Hβ 486.272 nm,
//   Hγ 434.169 nm, Hδ 410.294 nm. CODATA 2018: Ry = 13.605 693 123 eV, mₑ/mₚ = 1/1836.152 67.
// - Schrödinger 1926 (Erste Mitteilung, Ann. Phys. 384: 361–376, received 27 January 1926): wave equation for hydrogen from
//   the Hamilton–Jacobi equation via S = K lg ψ and a variational principle; ψ required to be real, single-valued, finite and
//   twice differentiable; continuous spectrum for E > 0, discrete E_n = −2π²me⁴/(h²n²) for E < 0 (Bohr's terms), with K = h/2π.
//   Cross-checked with Galler, Canfield & Freericks, Eur. J. Phys. 42 (2021), arXiv:2007.14798.
// - Born 1926 (Z. Phys. 37: 863–867, received 25 June 1926; Delphenich's translation): the main text says Φ_nm "determines the
//   probability" of scattering into a direction; a note added in proof: "a more precise consideration shows that the probability
//   is proportional to the square of the quantity Φ_nm". The note contains no numbers or data.
// - First Born approximation for elastic e⁻–H(1s) scattering (textbook): f = 2a₀(8 + Q²a₀²)/(4 + Q²a₀²)², Q = 2k sin(θ/2);
//   σ = πa₀²(7k⁴a₀⁴ + 18k²a₀² + 12)/(3(1 + k²a₀²)³) (checked numerically in the viz).
import { TAU, grid, packet, normSq, normalize, moments, toMomentum, sampler, phaseLUT, drawPsi, phaseWheel, big, fz } from './ch02.shared.js';

const D2R = Math.PI / 180;
/**
 * CN-evolve a state; every step record ⟨p⟩ and ⟨−V'⟩ in the forms that are exact for the grid Hamiltonian (central-difference
 * momentum, force −Σ Re(ψ̄ᵢψᵢ₊₁)(Vᵢ₊₁ − Vᵢ)), and every `every` steps a snapshot {t, mx, mp, sx, re, im}.
 */
function evolveRecord(M, x, dx, V, re, im, dt, steps, every) {
  const n = x.length, out = [], fine = [];
  const pf = () => { let p = 0, f = 0; for (let i = 1; i < n - 1; i++) { p += (re[i] * (im[i + 1] - im[i - 1]) - im[i] * (re[i + 1] - re[i - 1])) / 2; f -= (re[i] * re[i + 1] + im[i] * im[i + 1]) * (V[i + 1] - V[i]); } return [p, f]; };
  const snap = (t) => { const m = moments(x, re, im); out.push({ t, mx: m.mx, mp: m.mp, sx: m.sx, re: Float32Array.from(re), im: Float32Array.from(im) }); };
  snap(0); fine.push(pf());
  for (let s = 1; s <= steps; s++) { M.crankNicolson1D(re, im, V, dx, dt); fine.push(pf()); if (s % every === 0) snap(s * dt); }
  return { rec: out, fine };
}
/** Numerov integration of u'' = g(r) u outward on [0, R] (u(0) = 0, u ~ r^{l+1}); g = l(l+1)/r² − 2Z/r − ε (Rydberg units). */
function numerov(eps, l, R, N, Z = 1) {
  const h = R / N, u = new Float64Array(N + 1), g = (r) => l * (l + 1) / (r * r) - 2 * Z / r - eps, c = h * h / 12;
  u[0] = 0; u[1] = h ** (l + 1) * (1 - Z * h / (l + 1));
  let g0 = 0, g1 = g(h); // u[0] = 0 so the g(0) term never contributes
  for (let i = 1; i < N; i++) {
    const g2 = g((i + 1) * h);
    u[i + 1] = (2 * u[i] * (1 + 5 * c * g1) - (i > 1 ? u[i - 1] * (1 - c * g0) : 0)) / (1 - c * g2);
    g0 = g1; g1 = g2;
    if (!Number.isFinite(u[i + 1]) || Math.abs(u[i + 1]) > 1e250) { for (let k = i + 2; k <= N; k++) u[k] = u[i + 1] > 0 ? 1e250 : -1e250; break; }
  }
  return { u, h };
}

export default {
  collection: 'qm',
  chapter: 2,
  items: [
    // ------------------------------------------------------------------ 2.9
    {
      num: '2.9',
      kind: 'Theorem',
      name: 'Ehrenfest’s theorem',
      credit: 'Ehrenfest, 1927',
      statement: String.raw`For a normalized solution of $i\hbar\,\partial_t\psi=-\frac{\hbar^2}{2m}\psi''+V(x)\psi$ (with enough decay that the integrals converge),
$$\frac{d}{dt}\langle x\rangle=\frac{\langle p\rangle}{m},\qquad \frac{d}{dt}\langle p\rangle=\Big\langle-\frac{\partial V}{\partial x}\Big\rangle .$$
Expectation values obey Newton's equations (mech-1.6) **with the force averaged over the wave packet**. They follow the classical trajectory exactly when $\langle V'(x)\rangle=V'(\langle x\rangle)$ — for all states when $V$ is at most quadratic (free particle, uniform field, harmonic oscillator) — and approximately when the packet is narrow compared with the scale on which the force changes, $\tfrac12|V'''|\,(\Delta x)^2\ll|V'|$. In an anharmonic potential a wide packet's mean drifts away from the classical orbit.`,
      idea: String.raw`Differentiate $\langle x\rangle=\int x|\psi|^2$ and use the continuity equation (2.6): $\frac{d}{dt}\langle x\rangle=-\int x\,\partial_xj\,dx=\int j\,dx=\langle p\rangle/m$ after one integration by parts. Likewise, inserting the Schrödinger equation into $\frac{d}{dt}\int\bar\psi(-i\hbar\psi')$ and integrating by parts, the kinetic terms cancel and only $-\int|\psi|^2V'\,dx$ survives. The catch is the order of averaging: Newton would need $V'(\langle x\rangle)$, the theorem gives $\langle V'(x)\rangle$. Expanding $V'$ around $\langle x\rangle$, the difference is $\tfrac12V'''(\langle x\rangle)(\Delta x)^2+\dots$, which vanishes identically for quadratic $V$ — the reason the harmonic oscillator's mean position oscillates classically for any state.`,
      caption: String.raw`A Gaussian packet (height $|\psi|$, colour phase, riding at its mean energy) is released at rest at $x_0$; a classical particle (red) starts at the same place. Gold: the quantum mean $\langle x\rangle$. Right: $(\langle x\rangle,\langle p\rangle)$ against the classical orbit in phase space; bottom: $\langle x\rangle(t)$ against $x_{\rm cl}(t)$. In the **harmonic** well they agree for any width. In the **quartic** or **double** well, widen the packet ($\sigma$): the mean falls behind the classical orbit and its oscillation decays as the packet smears out. The readout checks $\frac{d}{dt}\langle p\rangle=\langle-V'\rangle$ (always true) against $-V'(\langle x\rangle)$ (Newton for the mean, true only for the harmonic well).`,
      deps: ['qm-2.8', 'qm-2.4', 'mech-1.6'],
      see: ['qm-5.17', 'mech-4.2'],
      refs: ['Griffiths §1.5'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Ehrenfest_theorem' },
      tags: ['ehrenfest theorem', 'classical limit'],
      viz(v) {
        const M = v.M, { x, dx } = grid(-12, 12, 601), n = x.length, DT = 0.01, TT = 20, EVERY = 4;
        const POT = {
          harmonic: { label: 'harmonic $\\tfrac12x^2$', V: (X) => 0.5 * X * X, F: (X) => -X },
          quartic: { label: 'quartic $\\tfrac18x^4$', V: (X) => X ** 4 / 8, F: (X) => -(X ** 3) / 2 },
          double: { label: 'double well', V: (X) => (X * X - 4) ** 2 / 16, F: (X) => -X * (X * X - 4) / 4 },
          pendulum: { label: 'pendulum $\\tfrac32(1-\\cos x)$', V: (X) => 1.5 * (1 - Math.cos(X)), F: (X) => -1.5 * Math.sin(X) },
        };
        const pot = v.select('potential', Object.entries(POT).map(([value, p]) => ({ value, label: p.label })), 'quartic');
        const sg = v.slider('packet width $\\sigma$', 0.15, 1.4, 0.7, { step: 0.01 });
        const x0 = v.slider('release point $x_0$', 0.5, 3.2, 2.2, { step: 0.01 });
        const s1 = v.stage({ x: [-4.5, 4.5], y: [-0.5, 8], height: 270, axes: 'box', weight: 1.25, xlabel: 'x', ylabel: 'energy', title: 'potential, packet and classical particle' });
        const s2 = v.stage({ x: [-4, 4], y: [-4, 4], height: 270, axes: true, weight: 1, xlabel: 'x', ylabel: 'p', title: 'phase space' });
        const s3 = v.stage({ x: [0, TT], y: [-4, 4], height: 190, axes: 'box', full: true, xlabel: 't', ylabel: 'x', title: '$\\langle x\\rangle(t)$ (gold) and the classical $x_{\\rm cl}(t)$ (red, dashed)' });
        let key = null, run = null;
        const compute = () => {
          const P = POT[pot.value], V = Float64Array.from(x, P.V), Q = packet(x, x0.value, sg.value, 0);
          const { rec, fine } = evolveRecord(M, x, dx, V, Q.re, Q.im, DT, Math.round(TT / DT), EVERY);
          // classical orbit with the same initial ⟨x⟩, ⟨p⟩ (RK4 at the record times)
          let X = rec[0].mx, Pp = rec[0].mp; const cl = [[X, Pp]], h = DT * EVERY, sub = 4, hh = h / sub;
          for (let k = 1; k < rec.length; k++) {
            for (let s = 0; s < sub; s++) {
              const a1 = P.F(X), k1 = [Pp, a1], k2 = [Pp + hh / 2 * k1[1], P.F(X + hh / 2 * k1[0])], k3 = [Pp + hh / 2 * k2[1], P.F(X + hh / 2 * k2[0])], k4 = [Pp + hh * k3[1], P.F(X + hh * k3[0])];
              X += hh / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); Pp += hh / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
            }
            cl.push([X, Pp]);
          }
          let H = 0; { const m = moments(x, rec[0].re, rec[0].im); let vm = 0; for (let i = 0; i < n; i++) vm += V[i] * (rec[0].re[i] ** 2 + rec[0].im[i] ** 2); H = 0.5 * (m.sp ** 2 + m.mp ** 2) + vm * dx; }
          return { rec, fine, cl, V, H, P, amp0: Math.max(...Array.from(rec[0].re, (r, i) => Math.hypot(r, rec[0].im[i]))) };
        };
        let st = null;
        v.animate((t) => {
          const kk = `${pot.value}|${sg.value}|${x0.value}`; if (kk !== key) { key = kk; run = compute(); }
          const { rec, fine, cl, P, H, amp0 } = run, K = Math.min(rec.length - 1, Math.floor((t / 10) * (rec.length - 1))), R = rec[K], col = phaseLUT(v);
          // potential + packet
          const xm = Math.max(3.2, x0.value + 1.6), top = Math.max(P.V(x0.value) * 1.6, H * 1.6, 1.6);
          s1.setView([-xm, xm], [-0.08 * top, top]);
          s1.fn(P.V, { color: 'muted', width: 2.2, fill: 'muted', fillAlpha: 0.14, base: -0.08 * top, n: 400 });
          drawPsi(s1, x, R.re, R.im, { col, base: H, scale: top * 0.26 / amp0 });
          s1.hline(H, { color: 'ink', dash: [4, 4], width: 1, alpha: 0.5 });
          s1.vline(R.mx, { color: 'gold', width: 2.2 });
          s1.text('⟨x⟩', R.mx, top * 0.95, { color: 'gold', size: 12, dx: 5, baseline: 'top' });
          const xc = cl[K][0]; s1.dot(xc, P.V(xc), { r: 7, color: 'red' });
          s1.text('classical', xc, P.V(xc), { color: 'red', size: 11, dx: xc > 0 ? -10 : 10, dy: -12, align: xc > 0 ? 'right' : 'left' });
          // phase space
          let pm = 1; for (const c of cl) pm = Math.max(pm, Math.abs(c[1])); for (const r of rec) pm = Math.max(pm, Math.abs(r.mp));
          s2.setView([-xm, xm], [-1.2 * pm, 1.2 * pm]);
          s2.path(cl.map((c) => [c[0], c[1]]), { color: 'red', width: 1.6, dash: [5, 4] });
          s2.path(rec.slice(0, K + 1).map((r) => [r.mx, r.mp]), { color: 'gold', width: 2.4 });
          s2.dot(cl[K][0], cl[K][1], { r: 6, color: 'red' }); s2.dot(R.mx, R.mp, { r: 6, color: 'gold' });
          // time series
          s3.setView([0, TT], [-xm, xm]);
          s3.path(cl.map((c, i) => [rec[i].t, c[0]]), { color: 'red', width: 1.6, dash: [5, 4] });
          s3.path(rec.slice(0, K + 1).map((r) => [r.t, r.mx]), { color: 'gold', width: 2.6 });
          s3.vline(R.t, { color: 'muted', dash: [3, 3] });
          // Ehrenfest check at K
          const j = Math.max(1, Math.min(fine.length - 2, K * EVERY)), dpdt = (fine[j + 1][0] - fine[j - 1][0]) / (2 * DT), k0 = K;
          let dev = 0; for (let i = 0; i <= K; i++) dev = Math.max(dev, Math.abs(rec[i].mx - cl[i][0]));
          st = { t: R.t, dpdt, Fav: fine[j][1], Fm: P.F(rec[k0].mx), dev, sx: R.sx, xc };
        }, { period: 10.5, still: 6 });
        v.legend([['gold', 'quantum mean ⟨x⟩, ⟨p⟩'], ['red', 'classical particle', { dash: true }], ['muted', 'potential', { area: true }]]);
        v.readout(() => st && `$t = ${v.fix(st.t, 2)}$ · Ehrenfest: $\\frac{d}{dt}\\langle p\\rangle = ${fz(v, st.dpdt, 4)}$ and $\\langle -V'(x)\\rangle = ${fz(v, st.Fav, 4)}$ ✓ — Newton for the mean would need $-V'(\\langle x\\rangle) = ${fz(v, st.Fm, 4)}$${Math.abs(st.Fav - st.Fm) < 2e-3 * (1 + Math.abs(st.Fm)) ? ' (equal: the force is linear)' : ` (off by ${fz(v, st.Fav - st.Fm, 4)})`} · width now $\\Delta x = ${v.fix(st.sx, 3)}$ · largest gap $|\\langle x\\rangle-x_{\\rm cl}|$ so far: **${v.fix(st.dev, 3)}**.`);
      },
    },
    // ------------------------------------------------------------------ 2.10
    {
      num: '2.10',
      kind: 'Theorem',
      name: 'Momentum-space wave function',
      statement: String.raw`For $\psi\in L^2(\R)$ define the **momentum-space wave function**
$$\phi(p)=\frac{1}{\sqrt{2\pi\hbar}}\int_{-\infty}^{\infty}e^{-ipx/\hbar}\,\psi(x)\,dx,\qquad \psi(x)=\frac{1}{\sqrt{2\pi\hbar}}\int_{-\infty}^{\infty}e^{ipx/\hbar}\,\phi(p)\,dp$$
(the Fourier transform with $k=p/\hbar$, extended to $L^2$ by Plancherel). Then:
(a) $\int|\phi(p)|^2dp=\int|\psi(x)|^2dx$, so $\phi$ is normalized when $\psi$ is (Plancherel, rca-9.13), and $\psi$ is recovered from $\phi$ (inversion, rca-9.11);
(b) $|\phi(p)|^2$ is the probability density of the outcomes of a momentum measurement, and $\langle p\rangle=\int\bar\psi(-i\hbar\psi')dx=\int p|\phi|^2dp$ (2.8);
(c) translating $\psi(x)\mapsto\psi(x-a)$ multiplies $\phi$ by the phase $e^{-ipa/\hbar}$, and a boost $\psi\mapsto e^{ip_0x/\hbar}\psi$ shifts $\phi(p)\mapsto\phi(p-p_0)$.`,
      idea: String.raw`A wave function is a superposition of plane waves $e^{ipx/\hbar}$, the eigenfunctions of $\hat p$ (2.8), and $\phi(p)$ is the amplitude of each — the Fourier inversion theorem says the superposition reproduces $\psi$. Plancherel makes the map unitary, so total probability is the same whichever picture is used, and the generalized Born rule assigns $|\phi(p)|^2dp$ to momenta in $[p,p+dp]$. Because the Fourier transform turns $-i\hbar\,d/dx$ into multiplication by $p$, the expectation of $\hat p$ in position space equals the plain average of $p$ in momentum space. Translation and modulation trade places under the transform, which is why moving a packet only re-colours $\phi$ while giving it momentum moves $|\phi|^2$.`,
      caption: String.raw`Left: $\psi(x)$; right: $\phi(p)$ computed by FFT, both as height (modulus) coloured by phase. **Drag $x_0$**: $\psi$ moves, $|\phi|$ stays put and only its colours wind faster. **Drag $p_0$**: $|\phi|$ slides. **Two slits** gives fringes in momentum — the far-field interference pattern; a **box** gives a sinc. Bottom: press **Measure momentum** to sample outcomes from the Born rule in momentum space; the histogram follows $|\phi(p)|^2$. The readout checks Plancherel and computes $\langle p\rangle$ both ways.`,
      deps: ['qm-2.8', 'rca-9.11', 'rca-9.13'],
      see: ['fa-7.9', 'algo-4.11', 'waves-7.4'],
      refs: ['Griffiths §3.4'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Position_and_momentum_spaces' },
      tags: ['momentum space', 'fourier transform', 'plancherel'],
      viz(v) {
        const M = v.M, NG = 1024, X0 = -40, dxg = 80 / NG, x = Float64Array.from({ length: NG }, (_, i) => X0 + i * dxg);
        const SH = {
          gauss: { label: 'Gaussian', f: (X, w) => Math.exp(-X * X / (4 * w * w)) },
          slits: { label: 'two slits', f: (X, w) => Math.exp(-((X - 2.2 * w) ** 2) / (0.18 * w * w)) + Math.exp(-((X + 2.2 * w) ** 2) / (0.18 * w * w)) },
          box: { label: 'box', f: (X, w) => 0.5 * (Math.tanh((X + 1.6 * w) / 0.08) - Math.tanh((X - 1.6 * w) / 0.08)) },
          cat: { label: 'two momenta', f: (X, w) => Math.exp(-X * X / (4 * w * w)) * 2 * Math.cos(2.2 * X) },
        };
        const sh = v.select('shape', Object.entries(SH).map(([value, S]) => ({ value, label: S.label })), 'slits', { onChange: () => { samples = []; } });
        const w = v.slider('width', 0.4, 2.5, 1, { step: 0.01, onChange: () => { samples = []; } });
        const xs = v.slider('position shift $x_0$', -6, 6, 0, { step: 0.05 });
        const ps = v.slider('momentum boost $p_0$', -4, 4, 0, { step: 0.05, onChange: () => { samples = []; } });
        let samples = [], rng = v.rng(10);
        const sX = v.stage({ x: [-12, 12], y: [-0.05, 1], height: 220, axes: 'box', weight: 1, xlabel: 'x', yticks: [], title: 'position space: $\\psi(x)$' });
        const sP = v.stage({ x: [-8, 8], y: [-0.05, 1], height: 220, axes: 'box', weight: 1, xlabel: 'p', yticks: [], title: 'momentum space: $\\phi(p)$ ($\\hbar=1$)' });
        const sH = v.stage({ x: [-8, 8], y: [0, 1], height: 170, axes: 'box', full: true, xlabel: 'p', ylabel: 'density', title: 'momentum measurements against $|\\phi(p)|^2$' });
        let cur = null;
        v.button('Measure momentum ×1000', () => { if (cur) for (let i = 0; i < 1000; i++) samples.push(cur.draw(rng())); });
        v.button('Clear', () => { samples = []; });
        let st = null;
        v.render(() => {
          const col = phaseLUT(v), S = SH[sh.value], re = new Float64Array(NG), im = new Float64Array(NG);
          for (let i = 0; i < NG; i++) { const a = S.f(x[i] - xs.value, w.value), ph = ps.value * x[i]; re[i] = a * Math.cos(ph); im[i] = a * Math.sin(ph); }
          normalize(re, im, dxg);
          const F = toMomentum(M, x, re, im), rho = Float64Array.from(F.re, (r, i) => r * r + F.im[i] ** 2);
          cur = { draw: sampler(F.p, rho) };
          let ax = 0, ap = 0; for (let i = 0; i < NG; i++) { ax = Math.max(ax, Math.hypot(re[i], im[i])); ap = Math.max(ap, Math.hypot(F.re[i], F.im[i])); }
          sX.setView([-12, 12], [-0.05 * ax, ax * 1.15]); sP.setView([-8, 8], [-0.05 * ap, ap * 1.15]);
          drawPsi(sX, x, re, im, { col }); drawPsi(sP, F.p, F.re, F.im, { col });
          phaseWheel(sX, col, sX.W - 32, 38, 11);
          // histogram
          const rmax = Math.max(...rho); sH.setView([-8, 8], [0, rmax * 1.25]);
          if (samples.length) sH.hist(samples, { bins: 80, range: [-8, 8], density: true, color: 'gold', fillAlpha: 0.35 });
          sH.path(Array.from(F.p, (p, i) => [p, rho[i]]), { color: 'green', width: 2.2 });
          if (!samples.length) sH.corner('press “Measure momentum”', 'tr', { color: 'muted' });
          // checks
          const m = moments(x, re, im); let Np = 0, p1 = 0, p2 = 0; for (let i = 0; i < NG; i++) { Np += rho[i] * F.dp; p1 += F.p[i] * rho[i] * F.dp; p2 += F.p[i] ** 2 * rho[i] * F.dp; }
          const smean = samples.length ? samples.reduce((a, b) => a + b, 0) / samples.length : NaN;
          st = { Nx: normSq(re, im, dxg), Np, mp: m.mp, p1, sp: Math.sqrt(Math.max(0, p2 / Np - (p1 / Np) ** 2)), sxm: m.sx, n: samples.length, smean };
        });
        v.legend([['gold', 'sampled momenta', { area: true }], ['green', '|φ(p)|²'], ['ink', 'modulus, filled by phase']]);
        v.readout(() => st && `Plancherel: $\\int|\\psi|^2dx = ${v.fix(st.Nx, 8)}$, $\\int|\\phi|^2dp = ${v.fix(st.Np, 8)}$ · $\\langle p\\rangle$ from $-i\\hbar\\,d/dx$: ${fz(v, st.mp, 4)}; from $\\int p|\\phi|^2dp$: ${fz(v, st.p1, 4)} · $\\Delta x = ${v.fix(st.sxm, 3)}$, $\\Delta p = ${v.fix(st.sp, 3)}$, product ${v.fix(st.sxm * st.sp, 3)}$\\,\\hbar$` + (st.n ? ` · ${big(st.n)} momentum measurements, mean ${fz(v, st.smean, 3)}` : '') + '.');
      },
    },
    // ------------------------------------------------------------------ 2.11
    {
      num: '2.11',
      kind: 'Theorem',
      name: 'Heisenberg uncertainty principle',
      credit: 'Heisenberg, 1927; Kennard, 1927',
      statement: String.raw`For every normalized $\psi\in L^2(\R)$ for which the quantities are finite,
$$\Delta x\,\Delta p\ \ge\ \frac{\hbar}{2},$$
where $\Delta x$ is the standard deviation of $|\psi(x)|^2$ and $\Delta p$ that of $|\phi(p)|^2$ (2.10). Equality holds exactly for the Gaussians $\psi(x)=C\exp\!\big(-(x-x_0)^2/4\sigma^2+ip_0x/\hbar\big)$. The product is unchanged by rescaling $x\mapsto x/s$ (squeezing $\psi$ widens $\phi$ in proportion), is increased by a chirp $e^{icx^2}$, and is infinite for a $\psi$ with a jump (then $|\phi|^2\sim1/p^2$ and $\Delta p=\infty$). The inequality concerns the spreads of two different measurements on identically prepared particles; it says nothing about the precision of a single instrument.`,
      idea: String.raw`Shift so that $\langle x\rangle=\langle p\rangle=0$. Then $\Delta x^2=\norm{x\psi}^2$ and $\Delta p^2=\hbar^2\norm{\psi'}^2$ (Plancherel, 2.10), and integrating by parts, $\int x\,\partial_x|\psi|^2dx=-1$. So
$1=\big|\int x(\bar\psi\psi'+\psi\bar\psi')\big|\le2\norm{x\psi}\norm{\psi'}$ by Cauchy–Schwarz, i.e. $\Delta x\,\Delta p\ge\hbar/2$. Equality in Cauchy–Schwarz forces $\psi'=-\lambda x\psi$ with $\lambda>0$ real, whose solutions are Gaussians — the function that is its own Fourier transform (fa-7.6). Physically it is the bandwidth theorem for waves (waves-2.10): a short pulse needs a broad band of wave numbers, and de Broglie's $p=\hbar k$ turns wave numbers into momenta.`,
      caption: String.raw`Pick a **shape** and **squeeze** it: $|\psi|^2$ (left) narrows while $|\phi|^2$ (right, by FFT) widens, with $\pm\Delta$ marked on both. Bottom: $\Delta x\,\Delta p$ in units of $\hbar/2$ for every shape at several squeezes — flat lines, since squeezing cannot change the product — and the hatched region below 1 is forbidden. Only the **Gaussian** touches the floor; add a **chirp** and even the Gaussian lifts off. The **box** has a jump, so its $\Delta p$ is limited only by the grid: refine the grid and it grows without bound.`,
      deps: ['qm-2.10', 'waves-2.10', 'fa-7.6'],
      see: ['qm-5.10', 'qm-5.20'],
      refs: ['Griffiths §1.6', 'Hall ch. 12'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Uncertainty_principle' },
      tags: ['uncertainty principle', 'fourier transform'],
      viz(v) {
        const M = v.M, NG = 2048, X0 = -40, dxg = 80 / NG, x = Float64Array.from({ length: NG }, (_, i) => X0 + i * dxg);
        const SH = {
          gauss: { label: 'Gaussian', color: 'green', f: (u) => Math.exp(-u * u / 4) },
          sech: { label: 'sech', color: 'teal', f: (u) => 1 / Math.cosh(u / 1.1) },
          tri: { label: 'triangle', color: 'purple', f: (u) => Math.max(0, 1 - Math.abs(u) / 2.6) },
          cusp: { label: 'cusp $e^{-|x|}$', color: 'orange', f: (u) => Math.exp(-Math.abs(u) / 1.2) },
          two: { label: 'two humps', color: 'pink', f: (u) => Math.exp(-((u - 1.6) ** 2) / 1.2) + Math.exp(-((u + 1.6) ** 2) / 1.2) },
          box: { label: 'box', color: 'red', f: (u) => (Math.abs(u) <= 1.8 ? 1 : 0) },
        };
        const sh = v.select('shape', Object.entries(SH).map(([value, S]) => ({ value, label: S.label })), 'tri');
        const sq = v.slider('squeeze $s$ (width ∝ s)', 0.3, 3, 1, { log: true });
        const ch = v.slider('chirp $c$ in $e^{icx^2}$', 0, 0.6, 0, { step: 0.005 });
        const sX = v.stage({ x: [-10, 10], y: [0, 1], height: 210, axes: 'box', weight: 1, xlabel: 'x', title: '$|\\psi(x)|^2$' });
        const sP = v.stage({ x: [-8, 8], y: [0, 1], height: 210, axes: 'box', weight: 1, xlabel: 'p (ħ = 1)', title: '$|\\phi(p)|^2$' });
        const sL = v.stage({ x: [0.3, 3], y: [0.8, 4], xlog: true, ylog: true, yticks: [1, 1.5, 2, 3, 4], height: 220, axes: 'box', full: true, xlabel: 'squeeze s', ylabel: 'ΔxΔp / (ħ/2)', title: 'the product $\\Delta x\\,\\Delta p$ in units of $\\hbar/2$, for each shape and squeeze' });
        const state = (key, s, c) => {
          const f = SH[key].f, re = new Float64Array(NG), im = new Float64Array(NG);
          for (let i = 0; i < NG; i++) { const a = f(x[i] / s), ph = c * x[i] * x[i]; re[i] = a * Math.cos(ph); im[i] = a * Math.sin(ph); }
          normalize(re, im, dxg);
          const F = toMomentum(M, x, re, im), rho = Float64Array.from(F.re, (r, i) => r * r + F.im[i] ** 2);
          let N = 0, m1 = 0, m2 = 0, q1 = 0, q2 = 0;
          for (let i = 0; i < NG; i++) { const r = re[i] ** 2 + im[i] ** 2; m1 += r * x[i] * dxg; m2 += r * x[i] * x[i] * dxg; N += rho[i] * F.dp; q1 += F.p[i] * rho[i] * F.dp; q2 += F.p[i] ** 2 * rho[i] * F.dp; }
          const sx = Math.sqrt(m2 - m1 * m1), sp = Math.sqrt(q2 / N - (q1 / N) ** 2);
          return { re, im, F, rho, sx, sp, mx: m1, mp: q1 / N };
        };
        let lkey = null, lines = null;
        let st = null;
        v.render(() => {
          const c = ch.value, S = state(sh.value, sq.value, c);
          // lines for all shapes (cached per chirp)
          if (lkey !== c) {
            lkey = c; lines = {};
            for (const k of Object.keys(SH)) lines[k] = [0.3, 0.45, 0.7, 1, 1.45, 2.1, 3].map((s) => { const Q = state(k, s, c); return [s, Q.sx * Q.sp / 0.5]; });
          }
          // position and momentum densities
          const rx = Float64Array.from(S.re, (r, i) => r * r + S.im[i] ** 2), xm = Math.max(...rx), pm = Math.max(...S.rho);
          const XW = Math.max(6, 5 * S.sx + 1), PW = Math.min(40, Math.max(4, 4 * S.sp + 1));
          sX.setView([-XW, XW], [0, xm * 1.3]); sP.setView([-PW, PW], [0, pm * 1.3]);
          sX.vband(S.mx - S.sx, S.mx + S.sx, { color: 'accent', alpha: 0.08 });
          sX.path(Array.from(x, (X, i) => [X, rx[i]]), { color: 'accent', width: 2.4 });
          sX.measure(S.mx - S.sx, xm * 1.12, S.mx + S.sx, xm * 1.12, `2Δx = ${v.fix(2 * S.sx, 3)}`);
          sP.vband(S.mp - S.sp, S.mp + S.sp, { color: 'orange', alpha: 0.08 });
          sP.path(Array.from(S.F.p, (p, i) => [p, S.rho[i]]), { color: 'orange', width: 2.4 });
          if (S.sp < PW) sP.measure(S.mp - S.sp, pm * 1.12, S.mp + S.sp, pm * 1.12, `2Δp = ${v.fix(2 * S.sp, 3)}`);
          else sP.corner(`Δp = ${v.fix(S.sp, 2)}: wider than the window`, 'tr', { color: 'red' });
          // product chart
          const CAP = 3.9, LX = { gauss: 0.36, sech: 0.6, tri: 1.05, cusp: 0.36, two: 0.36, box: 1.2 };
          sL.rect(0.3, 0.8, 3, 1, { fill: 'red', fillAlpha: 0.07, hatch: 'red', hatchAlpha: 0.4, stroke: false });
          sL.hline(1, { color: 'red', width: 1.6 });
          sL.text('forbidden: ΔxΔp < ħ/2', 1, 0.895, { color: 'red', size: 11.5, align: 'center', baseline: 'middle', weight: 600 });
          for (const [k, L] of Object.entries(lines)) {
            const sel = k === sh.value, off = L.some(([, y]) => y > CAP), pts = L.map(([s, y]) => [s, Math.min(y, CAP)]);
            sL.path(pts, { color: SH[k].color, width: sel ? 3 : 1.4, alpha: sel ? 1 : 0.7, dash: off ? [6, 4] : null });
            const lab = off ? `${k}: off the chart (grid-limited)` : SH[k].label.replace(/\$.*\$/, '').trim();
            sL.text(lab, LX[k], Math.min(L[0][1], CAP), { color: SH[k].color, size: 10.5, dy: off ? 10 : -7, weight: sel ? 700 : 500, align: 'left' });
          }
          const ratio = S.sx * S.sp / 0.5;
          sL.dot(sq.value, Math.min(ratio, CAP), { r: 7, color: SH[sh.value].color });
          st = { sx: S.sx, sp: S.sp, ratio, key: sh.value, c };
        });
        v.legend([['accent', '|ψ(x)|² and ±Δx'], ['orange', '|φ(p)|² and ±Δp'], ['red', 'the bound ħ/2']]);
        v.readout(() => st && `$\\Delta x = ${v.fix(st.sx, 4)}$, $\\Delta p = ${v.fix(st.sp, 4)}\\,\\hbar$ (from the FFT of $\\psi$) → $\\Delta x\\,\\Delta p = ${v.fix(st.sx * st.sp, 4)}\\,\\hbar$ = **${v.fix(st.ratio, 4)}** × $\\hbar/2$` + (st.key === 'gauss' && st.c === 0 ? ' — the minimum, attained' : st.key === 'tri' && st.c === 0 ? ' (exact: $\\sqrt{6/5} = 1.0954$)' : st.key === 'sech' && st.c === 0 ? ' (exact: $\\pi/3 = 1.0472$)' : st.key === 'cusp' && st.c === 0 ? ' (exact: $\\sqrt2 = 1.4142$)' : st.key === 'box' ? ' — a jump makes $\\Delta p$ infinite; the finite value comes from the grid ($\\Delta x_{\\rm grid}$ = 0.039)' : '') + '. Squeezing leaves this number fixed.');
      },
    },
    // ------------------------------------------------------------------ 2.12
    {
      num: '2.12',
      kind: 'Model',
      name: 'Free Gaussian wave packet',
      statement: String.raw`For a free particle ($V=0$) the Gaussian state $\psi(x,0)=(2\pi\sigma_0^2)^{-1/4}\exp\!\big(-\frac{(x-x_0)^2}{4\sigma_0^2}+ik_0(x-x_0)\big)$ evolves into
$$\psi(x,t)=\frac{(2\pi\sigma_0^2)^{-1/4}}{\sqrt{1+it/\tau}}\exp\!\Big(-\frac{(x-x_0-vt)^2}{4\sigma_0^2(1+it/\tau)}+ik_0(x-x_0)-\frac{i\hbar k_0^2t}{2m}\Big),\qquad v=\frac{\hbar k_0}{m},\quad \tau=\frac{2m\sigma_0^2}{\hbar}.$$
So $|\psi|^2$ stays Gaussian, its centre moves at the classical velocity $v$, and its width grows as
$$\sigma(t)=\sigma_0\sqrt{1+(t/\tau)^2},$$
while $\Delta p=\hbar/2\sigma_0$ stays constant; $\Delta x\Delta p=\frac\hbar2\sqrt{1+(t/\tau)^2}$ is minimal only at $t=0$. For $t\gg\tau$, $\sigma\approx\Delta p\,t/m$: the packet spreads as a cloud of classical particles with the momentum spread. The phase becomes chirped: the front of the packet carries larger wave numbers than the back.`,
      idea: String.raw`Each plane-wave component $e^{ikx}$ evolves by the phase $e^{-i\hbar k^2t/2m}$ (2.4). The Gaussian's Fourier transform is again Gaussian (fa-7.6), and multiplying it by $e^{-i\hbar k^2t/2m}$ keeps it Gaussian with a complex width, so the inverse transform can be done in closed form; the result is the free Schrödinger kernel acting on the packet (pde-6.8). Spreading is dispersion (waves-3.6): faster components (larger $k$) run ahead, so the front gathers high $k$ and the packet stretches. A narrower start has a broader momentum spread $\hbar/2\sigma_0$, so it spreads faster: after a time of order $\tau$ an initially narrower packet becomes the wider one.`,
      caption: String.raw`Left: the history $|\psi(x,t)|^2$ (time upward) with the classical path $x_0+vt$ (red) and $\pm\sigma(t)$ (green dashed). Right: $\sigma(t)$ from the formula (lines) against a Crank–Nicolson simulation (dots), for your $\sigma_0$ and for $\sigma_0/2$ and $2\sigma_0$ — the narrow packet overtakes the others. Bottom: $\psi$ at the current time, height $|\psi|$ coloured by phase; watch the colours bunch up at the front (the chirp). Pick a **particle** to see what $\tau=2m\sigma_0^2/\hbar$ means in seconds.`,
      scope: String.raw`Non-relativistic free particle. With a potential the width can stay bounded (coherent states of the harmonic oscillator, 4.x) or spread faster (unstable equilibria); interactions with an environment (decoherence) stop macroscopic objects from ever being prepared in such delicate superpositions.`,
      deps: ['qm-2.4', 'waves-3.6', 'pde-6.8'],
      see: ['fa-7.6', 'qm-2.11'],
      refs: ['Griffiths §2.4'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Wave_packet' },
      tags: ['wave packet', 'dispersion', 'free particle'],
      viz(v) {
        const M = v.M, C = M.CONST, X0 = -8, TT = 10, XW = [-22, 32];
        const PHYS = {
          e01: { label: 'electron, σ₀ = 0.1 nm', m: C.me, s: 1e-10 },
          e1u: { label: 'electron, σ₀ = 1 μm', m: C.me, s: 1e-6 },
          c60: { label: 'C₆₀, σ₀ = 1 nm', m: 720 * C.u, s: 1e-9 },
          dust: { label: 'dust grain 1 μg, σ₀ = 1 μm', m: 1e-9, s: 1e-6 },
        };
        const sg = v.slider('initial width $\\sigma_0$ ($\\hbar = m = 1$)', 0.4, 2.2, 0.8, { step: 0.01 });
        const ks = v.slider('wave number $k_0$', 0, 2.2, 1.2, { step: 0.01 });
        const ph = v.select('particle', Object.entries(PHYS).map(([value, p]) => ({ value, label: p.label })), 'e01');
        const s1 = v.stage({ x: XW, y: [0, TT], height: 280, axes: 'box', weight: 1.35, xlabel: 'x', ylabel: 't', title: 'history $|\\psi(x,t)|^2$' });
        const s2 = v.stage({ x: [0, TT], y: [0, 10], height: 280, axes: 'box', weight: 1, xlabel: 't', ylabel: 'σ(t)', title: 'width $\\sigma(t)$: formula (lines), simulation (dots)' });
        const s3 = v.stage({ x: XW, y: [-0.05, 0.6], height: 170, axes: 'box', full: true, xlabel: 'x', yticks: [], title: '$\\psi(x,t)$ now (height $|\\psi|$, colour $\\arg\\psi$)' });
        const sigT = (s0, t) => s0 * Math.sqrt(1 + (t / (2 * s0 * s0)) ** 2);
        const psiAt = (X, t, s0, k0) => {
          const th = t / (2 * s0 * s0), d = 1 + th * th, u = X - X0 - k0 * t;
          const amp = (2 * Math.PI * s0 * s0) ** -0.25 * d ** -0.25 * Math.exp(-u * u / (4 * s0 * s0 * d));
          const phase = -0.5 * Math.atan(th) + u * u * th / (4 * s0 * s0 * d) + k0 * (X - X0) - 0.5 * k0 * k0 * t;
          return [amp * Math.cos(phase), amp * Math.sin(phase)];
        };
        // Crank–Nicolson check of σ(t) (cached per σ₀, k₀)
        const G = grid(-40, 60, 2001); let ckey = null, csim = null;
        const check = (s0, k0) => {
          const P = packet(G.x, X0, s0, k0), Vz = new Float64Array(G.n), out = [[0, moments(G.x, P.re, P.im).sx]];
          for (let s = 1; s <= 500; s++) { M.crankNicolson1D(P.re, P.im, Vz, G.dx, 0.02); if (s % 25 === 0) out.push([s * 0.02, moments(G.x, P.re, P.im).sx]); }
          return out;
        };
        const CA = v.rgb('accent');
        let st = null;
        v.animate((t) => {
          const T = Math.min(TT, t), s0 = sg.value, k0 = ks.value, col = phaseLUT(v);
          const kk = `${s0}|${k0}`; if (kk !== ckey) { ckey = kk; csim = check(s0, k0); }
          // history (analytic density)
          const r0 = 1 / (Math.sqrt(2 * Math.PI) * s0);
          s1.raster((X, Y) => {
            if (Y < 0 || Y > TT || X < XW[0] || X > XW[1]) return null;
            const sgm = sigT(s0, Y), u = X - X0 - k0 * Y, r = Math.exp(-u * u / (2 * sgm * sgm)) / (Math.sqrt(2 * Math.PI) * sgm);
            return [CA[0], CA[1], CA[2], Math.round(255 * Math.min(1, Math.sqrt(r / r0)))];
          }, { res: 2, key: kk });
          const up = [], dn = []; for (let k = 0; k <= 100; k++) { const tt = TT * k / 100, c = X0 + k0 * tt, w = sigT(s0, tt); up.push([c + w, tt]); dn.push([c - w, tt]); }
          s1.clip(() => { s1.path(up, { color: 'green', width: 1.6, dash: [6, 4] }); s1.path(dn, { color: 'green', width: 1.6, dash: [6, 4] }); s1.line(X0, 0, X0 + k0 * TT, TT, { color: 'red', width: 1.8 }); });
          s1.hline(T, { color: 'gold', width: 1.8 });
          // σ(t) curves
          const smax = Math.max(sigT(s0 / 2, TT), sigT(2 * s0, TT), sigT(s0, TT)) * 1.1; s2.setView([0, TT], [0, smax]);
          for (const [f, c, lab] of [[0.5, 'muted', 'σ₀/2'], [2, 'muted', '2σ₀'], [1, 'green', 'σ₀']]) {
            s2.fn((tt) => sigT(s0 * f, tt), { color: c, width: f === 1 ? 2.6 : 1.4, dash: f === 1 ? null : [5, 4] });
            s2.text(lab, TT, sigT(s0 * f, TT), { color: c === 'muted' ? 'muted' : 'green', size: 11, align: 'right', dy: -8, dx: -4 });
          }
          s2.dots(csim, { r: 3.6, color: 'accent' });
          s2.vline(T, { color: 'gold', dash: [4, 3] }); s2.dot(T, sigT(s0, T), { r: 5, color: 'gold' });
          // snapshot
          const NX = 900, re = new Float64Array(NX), im = new Float64Array(NX), xs = new Float64Array(NX);
          for (let i = 0; i < NX; i++) { xs[i] = XW[0] + (XW[1] - XW[0]) * i / (NX - 1); const [a, b] = psiAt(xs[i], T, s0, k0); re[i] = a; im[i] = b; }
          const p0 = (2 * Math.PI * s0 * s0) ** -0.25; s3.setView(XW, [-0.3 * p0, 1.12 * p0]);
          drawPsi(s3, xs, re, im, { col });
          const c = X0 + k0 * T, w = sigT(s0, T);
          s3.dot(c, 0, { r: 5, color: 'red' }); s3.measure(c - w, -0.13 * p0, c + w, -0.13 * p0, '2σ(t)');
          phaseWheel(s3, col, s3.W - 32, 36, 11);
          const near = csim.reduce((b, q) => (Math.abs(q[0] - T) < Math.abs(b[0] - T) ? q : b), csim[0]);
          st = { T, s0, k0, w, tau: 2 * s0 * s0, near, P: PHYS[ph.value] };
        }, { period: 11, still: 6 });
        v.legend([['accent', '|ψ(x,t)|²', { area: true }], ['red', 'classical path x₀ + vt'], ['green', '±σ(t)', { dash: true }], ['accent', 'Crank–Nicolson σ(t)', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const P = st.P, tauS = 2 * P.m * P.s * P.s / C.hbar, yr = tauS / 3.156e7;
          return `$t = ${v.fix(st.T, 2)}$, $\\tau = 2m\\sigma_0^2/\\hbar = ${v.fix(st.tau, 3)}$ · width $\\sigma(t) = ${v.fix(st.w, 4)}$ (formula) vs ${v.fix(st.near[1], 4)} (simulation at $t = ${v.fix(st.near[0], 2)}$, formula there ${v.fix(sigT(st.s0, st.near[0]), 4)}) · centre at $x_0+vt = ${v.fix(X0 + st.k0 * st.T, 3)}$ · for a real **${P.label}**: $\\tau =$ ${tauS < 1e4 ? M.si(tauS, 's', 3) : `${v.fix(yr, 0).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ',')} years`}, and the width doubles after $\\sqrt3\\,\\tau$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.13
    {
      num: '2.13',
      kind: 'Theorem',
      name: 'Matter waves move at the classical velocity',
      statement: String.raw`A free wave packet $\psi(x,t)=\int A(k)\,e^{i(kx-\omega(k)t)}dk$ concentrated near $k_0$, with the de Broglie dispersion relation $\hbar\omega=\hbar^2k^2/2m$, has
(a) **crests** (lines of constant phase of the carrier $e^{i(k_0x-\omega_0t)}$) moving at the **phase velocity** $v_p=\omega_0/k_0=\hbar k_0/2m=v/2$;
(b) an **envelope** moving at the **group velocity** $v_g=d\omega/dk|_{k_0}=\hbar k_0/m=p/m$ — exactly the classical velocity $v$, and $\frac{d}{dt}\langle x\rangle=\langle p\rangle/m$ holds for every packet (2.8, 2.9).
With the relativistic relation $\hbar\omega=\sqrt{m^2c^4+\hbar^2k^2c^2}$ (de Broglie's own choice, 1.9), $v_g=pc^2/E=v$ again equals the particle's velocity while $v_p=c^2/v>c$; the phase velocity carries no signal and depends on the arbitrary zero of energy, the group velocity does not.`,
      idea: String.raw`Expand $\omega(k)\approx\omega_0+v_g(k-k_0)$ for the components near $k_0$: then $\psi\approx e^{i(k_0x-\omega_0t)}\int A(k)e^{i(k-k_0)(x-v_gt)}dk$, a carrier times an envelope that depends only on $x-v_gt$ (waves-3.5). For $\omega=\hbar k^2/2m$ the derivative $d\omega/dk=\hbar k/m$ is twice the ratio $\omega/k$, so the crests run at half the speed of the envelope: they are born at the back, sweep forward through the packet and die out at the front. The identification $v_g=v$ is what makes de Broglie's waves a consistent description of particles; the curvature $\omega''$, ignored here, makes the envelope spread (2.12).`,
      caption: String.raw`Top: $\operatorname{Re}\psi$ (blue) inside its envelope $\pm|\psi|$, computed exactly by evolving every Fourier component with its own $\omega(k)$. A gold dot rides one crest (it hops to a fresh crest when its own fades at the front), the green dot marks the envelope's centre and the red ring a classical particle moving at $p/m$. Bottom: the same as a space–time picture — the crests are the tilted stripes (gold line: phase velocity), the envelope moves along the red classical line. Switch to the **relativistic** relation: now crests outrun light ($v_p=c^2/v$) while the envelope still moves at $v<c$.`,
      deps: ['qm-2.12', 'waves-3.5'],
      see: ['waves-3.4', 'pde-9.3', 'waves-3.9', 'qm-1.9'],
      refs: ['Griffiths §2.4'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Group_velocity' },
      tags: ['group velocity', 'phase velocity', 'wave packet'],
      viz(v) {
        const M = v.M, NG = 2048, XA = -40, L = 160, dxg = L / NG, x = Float64Array.from({ length: NG }, (_, i) => XA + i * dxg), NF = 220, SIG = 4;
        const mode = v.select('dispersion', [{ value: 'nr', label: 'Schrödinger $\\hbar\\omega=\\hbar^2k^2/2m$' }, { value: 'rel', label: 'relativistic $\\hbar\\omega=\\sqrt{m^2c^4+\\hbar^2k^2c^2}$' }], 'nr');
        const ks = v.slider('wave number $k_0$ ($\\hbar = m = c = 1$)', 0.6, 3, 1.6, { step: 0.01 });
        const s1 = v.stage({ x: [-8, 40], y: [-0.85, 0.85], height: 210, axes: 'box', full: true, xlabel: 'x', yticks: [], title: '$\\operatorname{Re}\\psi$ and its envelope $\\pm|\\psi|$' });
        const s2 = v.stage({ x: [-8, 40], y: [0, 14], height: 230, axes: 'box', full: true, xlabel: 'x', ylabel: 't', title: 'space–time: sign of $\\operatorname{Re}\\psi$ (blue +, orange −)' });
        let key = null, run = null;
        const compute = () => {
          const k0 = ks.value, rel = mode.value === 'rel', om = (k) => (rel ? Math.sqrt(1 + k * k) : 0.5 * k * k);
          const vg = rel ? k0 / Math.sqrt(1 + k0 * k0) : k0, vp = om(k0) / k0, T = Math.min(14, 46 / vg);
          const R0 = new Array(NG), I0 = new Array(NG);
          for (let i = 0; i < NG; i++) { const a = Math.exp(-x[i] * x[i] / (4 * SIG * SIG)); R0[i] = a * Math.cos(k0 * x[i]); I0[i] = a * Math.sin(k0 * x[i]); }
          M.fft(R0, I0);
          const kk = Array.from({ length: NG }, (_, m) => (TAU * (m < NG / 2 ? m : m - NG)) / L);
          const frames = [];
          for (let f = 0; f < NF; f++) {
            const t = T * f / (NF - 1), R = new Array(NG), I = new Array(NG);
            for (let m = 0; m < NG; m++) { const ph = -om(kk[m]) * t, c = Math.cos(ph), s = Math.sin(ph); R[m] = R0[m] * c - I0[m] * s; I[m] = R0[m] * s + I0[m] * c; }
            M.ifft(R, I);
            let sw = 0, sx = 0, amax = 0; const amp = new Float32Array(NG);
            for (let i = 0; i < NG; i++) { const a2 = R[i] * R[i] + I[i] * I[i]; sw += a2; sx += a2 * x[i]; amp[i] = Math.sqrt(a2); amax = Math.max(amax, amp[i]); }
            frames.push({ t, re: Float32Array.from(R), im: Float32Array.from(I), amp, cx: sx / sw, amax });
          }
          // follow one crest: nearest local maximum of Re ψ to the previous crest; hop when it leaves the envelope
          const lam = TAU / k0, track = [], segs = [];
          // a crest = a point where arg ψ = 0 (Re ψ > 0 and Im ψ crossing zero upward), located by linear interpolation
          const crestNear = (F, x0, half) => { let best = null; const i0 = Math.max(0, Math.floor((x0 - half - XA) / dxg)), i1 = Math.min(NG - 2, Math.ceil((x0 + half - XA) / dxg)); for (let i = i0; i <= i1; i++) if (F.im[i] < 0 && F.im[i + 1] >= 0 && F.re[i] + F.re[i + 1] > 0) { const X = x[i] + dxg * F.im[i] / (F.im[i] - F.im[i + 1]); if (best == null || Math.abs(X - x0) < Math.abs(best - x0)) best = X; } return best; };
          const ampAt = (F, X) => F.amp[Math.max(0, Math.min(NG - 1, Math.round((X - XA) / dxg)))];
          let cur = crestNear(frames[0], 0, lam / 2) ?? 0, seg = [];
          for (let f = 0; f < NF; f++) {
            const F = frames[f]; if (f > 0) cur = crestNear(F, cur, lam / 2) ?? cur;
            if (ampAt(F, cur) < 0.3 * F.amax) { if (seg.length > 2) segs.push(seg); seg = []; cur = crestNear(F, F.cx - (vp > vg ? 1.2 : -1.2) * SIG, lam / 2) ?? cur; }
            track.push([cur, F.t]); seg.push([F.t, cur]);
          }
          if (seg.length > 2) segs.push(seg);
          let num = 0, den = 0; for (const sg of segs) { const fit = M.linreg(sg.map((q) => q[0]), sg.map((q) => q[1])), w = sg.length; num += fit.slope * w; den += w; }
          const fitE = M.linreg(frames.map((F) => F.t), frames.map((F) => F.cx));
          return { frames, track, vcrest: num / den, venv: fitE.slope, vg, vp, T, k0, rel, a0: frames[0].amax, tau: rel ? null : 2 * SIG * SIG };
        };
        let st = null;
        v.animate((t) => {
          const kk = `${mode.value}|${ks.value}`; if (kk !== key) { key = kk; run = compute(); }
          const { frames, track, T, vg, vp } = run, f = Math.min(NF - 1, Math.floor(((t % 12) / 11) * (NF - 1))), F = frames[f];
          const xr = [-8, Math.max(30, vg * T + 10)];
          s1.setView(xr, [-1.18 * run.a0, 1.18 * run.a0]); s2.setView(xr, [0, T]);
          // envelope and Re ψ
          const env = [], nenv = [], rp = [];
          for (let i = 0; i < NG; i++) { if (x[i] < xr[0] - 1 || x[i] > xr[1] + 1) continue; env.push([x[i], F.amp[i]]); nenv.push([x[i], -F.amp[i]]); rp.push([x[i], F.re[i]]); }
          s1.path(env, { color: 'ink', width: 1.4 }); s1.path(nenv, { color: 'ink', width: 1.4 });
          s1.path(rp, { color: 'accent', width: 1.8 });
          s1.dot(track[f][0], F.re[Math.round((track[f][0] - XA) / dxg)], { r: 6, color: 'gold' });
          s1.dot(F.cx, 0, { r: 6, color: 'green' });
          s1.dot(vg * F.t, -1.02 * run.a0, { r: 7, color: 'red', hollow: true, width: 2.2 });
          s1.text('classical', vg * F.t, -1.02 * run.a0, { color: 'red', size: 11, dx: 10, baseline: 'middle' });
          // space–time
          const CA = v.rgb('accent'), CO = v.rgb('orange');
          s2.raster((X, Y) => {
            if (Y < 0 || Y > T) return null;
            const fr = frames[Math.min(NF - 1, Math.round(Y / T * (NF - 1)))], i = Math.round((X - XA) / dxg); if (i < 0 || i >= NG) return null;
            const r = fr.re[i] / fr.amax, c = r > 0 ? CA : CO; return [c[0], c[1], c[2], Math.round(235 * Math.min(1, Math.abs(r) * 1.3))];
          }, { res: 2, key: kk });
          s2.clip(() => {
            s2.line(0, 0, vg * T, T, { color: 'red', width: 2.2 });
            s2.path(track.slice(0, f + 1), { color: 'gold', width: 2.6 });
            s2.line(0, 0, vp * T, T, { color: 'gold', width: 1.4, dash: [6, 4] });
            if (run.rel) s2.line(0, 0, T, T, { color: 'ink', width: 1.2, dash: [2, 4] });
          });
          if (run.rel) s2.text('light', Math.min(T, xr[1]) * 0.92, Math.min(T, xr[1]) * 0.92, { color: 'ink', size: 11, dx: -6, align: 'right' });
          s2.hline(F.t, { color: 'muted', width: 1, dash: [3, 3] });
          st = run;
        }, { period: 12, still: 6 });
        v.legend([['accent', 'Re ψ'], ['ink', 'envelope ±|ψ|'], ['gold', 'a crest (phase velocity)'], ['green', 'envelope centre', { dot: true }], ['red', 'classical particle p/m']]);
        v.readout(() => st && `$v = p/m = ${v.fix(st.rel ? st.vg : st.k0, 3)}$${st.rel ? ` (momentum $${v.fix(st.k0, 2)}\\,mc$)` : ''} · measured crest speed **${v.fix(st.vcrest, 3)}** vs $v_p=\\omega/k = ${v.fix(st.vp, 3)}$${st.rel ? ` $= c^2/v$ (faster than light)` : ` $= v/2$ (the small excess is the Gouy phase of the spreading packet, $\\tfrac{d}{dt}\\tfrac{\\arctan(t/\\tau)}{2k_0}\\le ${v.fix(1 / (2 * st.k0 * st.tau), 3)}$)`} · measured envelope speed **${v.fix(st.venv, 3)}** vs $v_g = d\\omega/dk = ${v.fix(st.vg, 3)}$ = the classical velocity.`);
      },
    },
    // ------------------------------------------------------------------ 2.14
    {
      num: '2.14',
      kind: 'Paper',
      name: 'Quantisierung als Eigenwertproblem',
      paper: { authors: 'E. Schrödinger', year: 1926, title: 'Quantisierung als Eigenwertproblem (Erste Mitteilung)', venue: 'Annalen der Physik 384 (4): 361–376', doi: '10.1002/andp.19263840404' },
      introduces: ['qm-2.4'],
      credit: 'Erwin Schrödinger, 1926',
      statement: String.raw`Schrödinger showed that the energy levels of hydrogen follow from a wave equation with **no quantum rule added**. Starting from the Hamilton–Jacobi equation of the Kepler problem, he set $S=K\log\psi$ and, instead of solving for $S$, required a quadratic integral of $\psi$ to be stationary; the resulting Euler–Lagrange equation is the (time-independent) wave equation
$$\nabla^2\psi+\frac{2m}{K^2}\Big(E+\frac{e^2}{r}\Big)\psi=0 .$$
Demanding that $\psi$ be real, single-valued, **finite** and twice differentiable throughout space, he found solutions for **every** $E>0$ (a continuous spectrum: the unbound electron) but, for $E<0$, only when $me^2/K\sqrt{-2mE}$ is a whole number $n$:
$$E_n=-\frac{2\pi^2me^4}{h^2n^2}\qquad\text{if }K=\frac{h}{2\pi},$$
exactly Bohr's terms (1.5), hence the Balmer series. Integers now arise the way the number of nodes of a vibrating string does, as eigenvalues of a boundary-value problem. Today's form uses $\hbar$ and the reduced mass; this first communication treated only the stationary equation for hydrogen (the time-dependent equation 2.4 came in the fourth, June 1926).`,
      idea: String.raw`In 1925 quantum numbers were rules imposed on classical orbits (Bohr–Sommerfeld) and Heisenberg had just replaced orbits by matrices. Schrödinger took de Broglie's matter waves (qm-1.17, 1.9) seriously and borrowed the optical–mechanical analogy of the Hamilton–Jacobi equation (mech-12.16): if classical mechanics is the ray limit, there should be a wave equation behind it. Separating his equation in spherical coordinates, the radial part has two kinds of solution at large $r$, one decaying like $e^{-r/na_0}$ and one growing like $e^{+r/na_0}$; for a generic energy the solution regular at the nucleus picks up the growing one, and only at the eigenvalues does it decay. The paper launched wave mechanics: within months Schrödinger treated the oscillator and rotator, built perturbation theory, wrote the time-dependent equation and showed its equivalence with matrix mechanics; Born then reinterpreted $\psi$ (2.15).`,
      caption: String.raw`**Recreation of the paper's central calculation**, by shooting. Left: the radial function $u=rR$ integrated outward from the nucleus at the energy $E$ set by the slider (Rydberg units, reduced mass); the dashed line is the classical turning point. For almost every $E$ it **runs off to $\pm\infty$** — not a finite $\psi$. **Drag the energy** slowly: the runaway flips sign at isolated energies, where the solution decays instead. Right: the sign of the runaway against energy; its zero crossings are the eigenvalues, landing on Bohr's $-13.6\ \text{eV}/n^2$ ticks for every $l$ (choose $s$, $p$, $d$). Switch to **$E>0$**: every energy gives a finite, oscillating solution. Bottom: Balmer lines from the computed eigenvalues, from Bohr's formula and as measured (NIST).`,
      deps: ['qm-1.9', 'qm-1.5', 'mech-12.16', 'qm-1.17'],
      see: ['qm-8.6', 'qm-1.4', 'qm-1.16'],
      refs: [],
      tags: ['schrödinger equation', 'hydrogen', 'history'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Schr%C3%B6dinger_equation#Historical_background_and_development' },
      viz(v) {
        const M = v.M, C = M.CONST, MU = 1 / (1 + C.me / C.mp), RYE = (C.h * C.c * C.Ry) / C.eV, RYH = RYE * MU; // Rydberg energy (eV), reduced-mass corrected
        const MEAS = [656.461, 486.272, 434.169, 410.294], NAMES = ['Hα', 'Hβ', 'Hγ', 'Hδ'], NSTEP = 3000;
        const rng = v.select('energy range', [{ value: 'bound', label: 'bound: $E<0$' }, { value: 'free', label: 'free: $E>0$' }], 'bound', { onChange: () => sync() });
        const lsel = v.select('angular momentum', [{ value: 0, label: '$s$ ($l=0$)' }, { value: 1, label: '$p$ ($l=1$)' }, { value: 2, label: '$d$ ($l=2$)' }], 0);
        const nu = v.slider('energy $E=-13.6\\text{ eV}/\\nu^2$', 0.7, 6.2, 1.86, { step: 0.0005, fmt: (q) => `${v.fix(-RYH / (q * q), 4)} eV` });
        const Ef = v.slider('energy $E$', 0.05, 10, 1.5, { log: true, fmt: (q) => `+${v.fix(q, 2)} eV` });
        const snap = v.button('Snap to the nearest eigenvalue', () => { const ev = eig(+lsel.value); let best = ev[0]; for (const e of ev) if (Math.abs(e - nu.value) < Math.abs(best - nu.value)) best = e; nu.set(best); });
        const sync = () => { const b = rng.value === 'bound'; nu.el.hidden = !b; snap.hidden = !b; Ef.el.hidden = b; };
        const s1 = v.stage({ x: [0, 20], y: [-1.75, 1.75], height: 280, axes: 'box', weight: 1.15, xlabel: 'r / a₀', yticks: [], title: 'radial solution $u(r)=rR(r)$, integrated outward' });
        const s2 = v.stage({ x: [0.7, 8], y: [-1.25, 1.25], height: 280, axes: 'box', weight: 1, xlabel: 'E (eV)', yticks: [[-1, '−∞'], [0, '0'], [1, '+∞']], xticks: [[1, '−13.6'], [2, '−3.40'], [3, '−1.51'], [4, '−0.85'], [6.6, '0'], [8, '+10']], title: 'where $u$ runs off to, against energy' });
        const s3 = v.stage({ x: [395, 670], y: [0, 3], height: 120, axes: false, full: true, title: 'Balmer lines (nm): computed from the eigenvalues, Bohr’s formula, measured' });
        const Rof = (q) => Math.min(110, 4.4 * q * q + 7);
        const shoot = (eps, l, R) => numerov(eps, l, R, NSTEP);
        const tail = (eps, l, R) => { // u(R) relative to the largest |u| inside the classically allowed region
          const { u, h } = shoot(eps, l, R); const rt = eps < 0 ? (1 + Math.sqrt(Math.max(0, 1 + eps * l * (l + 1)))) / -eps : R;
          let mx = 1e-300; const lim = Math.min(u.length - 1, Math.floor(Math.min(R, 1.15 * rt) / h)); for (let i = 1; i <= lim; i++) mx = Math.max(mx, Math.abs(u[i]));
          return { u, h, rt, mx, end: u[u.length - 1] / mx };
        };
        const cacheE = {}, cacheL = {};
        function eig(l) { // eigenvalues ν_n by bisection on the sign of u(R)
          if (cacheE[l]) return cacheE[l];
          const out = [], f = (q) => Math.sign(shoot(-1 / (q * q), l, Rof(q)).u[NSTEP]);
          let q0 = l + 0.55, f0 = f(q0);
          for (let k = 1; k <= 520 && out.length < 6; k++) {
            const q1 = l + 0.55 + k * 0.011, f1 = f(q1);
            if (f1 !== f0) { let a = q0, b = q1, fa = f0; for (let it = 0; it < 50; it++) { const m = (a + b) / 2, fm = f(m); if (fm === fa) { a = m; } else b = m; } out.push((a + b) / 2); }
            q0 = q1; f0 = f1;
          }
          return (cacheE[l] = out);
        }
        const land = (l) => { if (cacheL[l]) return cacheL[l]; const pts = []; for (let k = 0; k <= 330; k++) { const q = 0.7 + 5.5 * k / 330, T = tail(-1 / (q * q), l, Rof(q)); pts.push([q, (2 / Math.PI) * Math.atan(T.end / 2)]); } return (cacheL[l] = pts); };
        const DARK = [14, 15, 22];
        let st = null;
        v.render(() => {
          const l = +lsel.value, bound = rng.value === 'bound', q = nu.value;
          const eps = bound ? -1 / (q * q) : Ef.value / RYH, R = bound ? Rof(q) : 40, T = tail(eps, l, R), ev = eig(l);
          // ---- radial solution
          s1.setView([0, R], [-1.75, 1.75]);
          s1.hline(0, { color: 'faint' });
          if (bound && T.rt < R) { s1.vband(T.rt, R, { color: 'muted', alpha: 0.07 }); s1.vline(T.rt, { color: 'muted', dash: [4, 4] }); s1.text('classically forbidden →', T.rt, 1.62, { color: 'muted', size: 11, dx: 6, baseline: 'top' }); }
          const finite = !bound || Math.abs(T.end) < 0.02, pts = [];
          for (let i = 0; i < T.u.length; i += 3) { const y = T.u[i] / T.mx; pts.push([i * T.h, Math.max(-1.7, Math.min(1.7, y))]); }
          s1.path(pts, { color: finite ? 'green' : 'red', width: 2.6 });
          if (!finite) { const up = T.end > 0; s1.arrow(R * 0.955, up ? 1.25 : -1.25, R * 0.955, up ? 1.68 : -1.68, { color: 'red', width: 2.4, head: 9 }); s1.text(up ? '→ +∞' : '→ −∞', R * 0.94, up ? 1.45 : -1.45, { color: 'red', size: 12.5, align: 'right', weight: 700 }); }
          // exact eigenfunction nearest in energy, for comparison
          s1.corner(bound ? (finite ? 'finite everywhere: an eigenvalue' : 'not finite: no state at this energy') : 'E > 0: finite and oscillating — allowed', 'tr', { color: finite ? 'green' : 'red', weight: 600 });
          // ---- landscape
          const Lp = land(l);
          s2.hline(0, { color: 'faint' });
          s2.rect(6.6, -1.25, 8, 1.25, { fill: 'green', fillAlpha: 0.06, hatch: 'green', hatchAlpha: 0.3, stroke: false });
          s2.text('E > 0: all allowed', 7.3, 1.08, { color: 'green', size: 11, align: 'center' });
          s2.text('…', 6.4, 0, { color: 'muted', size: 14, align: 'center' });
          for (let n = 1; n <= 6; n++) if (n > l) { s2.vline(n, { color: 'muted', dash: [2, 4], width: 1 }); s2.text(`n=${n}`, n, -1.12, { color: 'muted', size: 10.5, align: 'center' }); }
          s2.path(Lp, { color: 'accent', width: 2.2 });
          s2.dots(ev.map((e) => [e, 0]), { r: 5, color: 'green' });
          const X = bound ? q : 6.6 + 1.4 * (Ef.value / 10);
          s2.vline(X, { color: 'gold', width: 2 });
          s2.dot(X, bound ? (2 / Math.PI) * Math.atan(T.end / 2) : 0, { r: 6, color: 'gold' });
          // ---- spectrum (s-state eigenvalues)
          const e0 = eig(0), lamC = [], lamB = [];
          for (let k = 0; k < 4; k++) { const n = k + 3; lamC.push(1e9 / (C.Ry * MU * (1 / e0[1] ** 2 - 1 / e0[n - 1] ** 2))); lamB.push(1e9 / (C.Ry * MU * (1 / 4 - 1 / (n * n)))); }
          s3.rect(395, 0, 670, 3, { fill: DARK, fillAlpha: 1, stroke: false });
          const rows = [[lamC, 2, 'Schrödinger (computed)'], [lamB, 1, 'Bohr’s formula'], [MEAS, 0, 'measured']];
          for (const [L, y, lab] of rows) {
            for (let k = 0; k < 4; k++) s3.line(L[k], y + 0.12, L[k], y + 0.88, { color: M.wavelengthRGB(L[k]), width: 3.2 });
            s3.text(lab, 398, y + 0.5, { color: [220, 220, 230], size: 11, baseline: 'middle' });
          }
          for (let k = 0; k < 4; k++) s3.text(NAMES[k], MEAS[k], 2.9, { color: [220, 220, 230], size: 10.5, align: 'center', baseline: 'top', dx: k === 3 ? 0 : 0 });
          st = { l, bound, E: bound ? -RYH / (q * q) : Ef.value, end: T.end, finite, ev, lamC, lamB, R };
        });
        sync();
        v.legend([['red', 'u(r) runs off: not a state'], ['green', 'u(r) finite: eigenvalue / continuum'], ['accent', 'runaway sign against E'], ['green', 'computed eigenvalues', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const E = st.ev.map((q) => -RYH / (q * q)), Bohr = st.ev.map((q, i) => -RYH / (i + 1 + st.l) ** 2);
          let dmax = 0; E.forEach((e, i) => { dmax = Math.max(dmax, Math.abs(e - Bohr[i])); });
          return `$E = ${v.fix(st.E, 4)}$ eV: ` + (st.bound ? (st.finite ? `the solution stays finite — eigenvalue` : `$u$ at $r = ${v.fix(st.R, 0)}\\,a_0$ is ${st.end > 0 ? '+' : '−'}$${v.sci(Math.abs(st.end), 1)}$ × its inner peak and still growing`) : 'oscillating and finite (continuous spectrum)') +
            ` · computed eigenvalues for $l = ${st.l}$: ${E.slice(0, 4).map((e) => v.fix(e, 4)).join(', ')} eV; Bohr's $-13.598\\,\\text{eV}/n^2$ (reduced mass): ${Bohr.slice(0, 4).map((e) => v.fix(e, 4)).join(', ')} eV (largest difference $${v.sci(dmax || 1e-12, 1)}$ eV, numerical) · Hα: computed ${v.fix(st.lamC[0], 3)} nm, Bohr ${v.fix(st.lamB[0], 3)} nm, measured 656.461 nm (vacuum) — the last 0.01 nm is fine structure and the Lamb shift, beyond this equation.`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.15
    {
      num: '2.15',
      kind: 'Paper',
      name: 'Zur Quantenmechanik der Stoßvorgänge',
      paper: { authors: 'Max Born', year: 1926, title: 'Zur Quantenmechanik der Stoßvorgänge', venue: 'Zeitschrift für Physik 37: 863–867', doi: '10.1007/BF01397477' },
      introduces: ['qm-2.2', 'qm-13.22'],
      credit: 'Max Born, 1926',
      statement: String.raw`Born solved Schrödinger's equation for a collision: an electron arriving as a plane wave $\sin(2\pi z/\lambda)$ on an atom in state $n$, with interaction $V$. To first order in $V$ (what is now the **Born approximation**, 13.22) the outgoing wave far away is a superposition of waves leaving in each direction $(\alpha,\beta,\gamma)$ with amplitudes $\Phi_{nm}(\alpha,\beta,\gamma)$, the atom ending in state $m$ and the electron's energy changing by $h\nu^0_{nm}$. Reading this corpuscularly, $\Phi_{nm}$ "determines the probability" that the electron is thrown into that direction with that energy change; a **note added in proof** corrects this: *a more precise consideration shows that the probability is proportional to the square of $\Phi_{nm}$*. Quantum mechanics thus answers "how probable is a given outcome of the collision", not "what is the state after it", and Born wrote that he himself inclined to give up determinism in the atomic world. The note contains no data; it is a preliminary communication of a longer paper (Z. Phys. 38, 1926).`,
      idea: String.raw`Schrödinger read $\psi$ as a real charge cloud, but a scattered wave spreads in all directions while every electron is detected whole, in one counter. Born's resolution: the wave guides probabilities, the particle is found in one place, and the counting rate in a direction is fixed by the outgoing amplitude there. Why the square: it is $|\psi|^2$ that the Schrödinger equation conserves and that flows with the current $\mathbf j$ (2.5, 2.6); the outgoing current through a sphere of radius $r$ is $\frac{\hbar k}{m}|f(\theta)|^2/r^2$ per unit area, so the number of electrons per unit solid angle, $\frac{\hbar k}{m}|f|^2$, is independent of $r$ — the differential cross-section $|f|^2$ (13.16). The paper gave quantum mechanics its probabilistic interpretation (2.2) and its method for collisions (13.22); Born received the 1954 Nobel Prize for it.`,
      caption: String.raw`**Recreation:** elastic scattering of an electron by a hydrogen atom, with the amplitude given by Born's first-order method, $f=2a_0(8+Q^2a_0^2)/(4+Q^2a_0^2)^2$, $Q=2k\sin\frac\theta2$ (the 1926 note itself has no numbers). Left: the outgoing wave $f(\theta)e^{ikr}/r$ (colour = phase, intensity = amplitude), moving outward; detectors on the ring click one at a time at random (gold). Right: clicks per unit solid angle against angle, building up $|f|^2$ (green). Raise the **energy** and the pattern narrows forward. Switch to the main text's rule **probability ∝ $|\Phi|$**: the clicks follow the red curve instead — and the readout shows why this cannot be right: the flux through the detector sphere would grow with its radius.`,
      deps: ['qm-2.4', 'qm-13.16', 'qm-2.14'],
      see: ['mech-8.17', 'qm-2.6', 'qm-1.11'],
      refs: [],
      tags: ['born rule', 'scattering', 'history'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Born_rule#History' },
      viz(v) {
        const M = v.M, NB = 36;
        const Es = v.slider('electron energy', 10, 1000, 100, { log: true, fmt: (q) => `${q < 100 ? v.fix(q, 1) : Math.round(q)} eV` });
        const rule = v.select('probability ∝', [{ value: 'sq', label: '$|\\Phi|^2$ (note added in proof)' }, { value: 'abs', label: '$|\\Phi|$ (main text)' }], 'sq');
        const Rd = v.slider('detector radius $R$', 3, 9, 7, { step: 0.1, fmt: (q) => `${v.fix(q, 1)} a₀` });
        let extra = 0;
        v.button('+10,000 electrons', () => { extra += 10000; });
        v.button('Reset counts', () => { extra = 0; v.restart(); });
        const s1 = v.stage({ x: [-10, 10], y: [-10, 10], equal: true, height: 330, axes: false, weight: 1, title: 'outgoing wave $f(\\theta)\\,e^{ikr}/r$ and detector clicks' });
        const s2 = v.stage({ x: [0, 180], y: [1e-5, 3], ylog: true, height: 330, axes: 'box', weight: 1.15, xlabel: 'scattering angle θ (degrees)', ylabel: 'per solid angle (a₀²)', xticks: [0, 30, 60, 90, 120, 150, 180], title: 'clicks per unit solid angle against $|f(\\theta)|^2$' });
        const ka = () => Math.sqrt(Es.value / 13.6057);
        const fB = (th, k) => { const Q2 = 4 * k * k * Math.sin(th / 2) ** 2; return 2 * (8 + Q2) / (4 + Q2) ** 2; };
        // uniform random numbers shared by every click (extended as needed): click i uses U[2i], U[2i+1]
        const U = [], r0 = v.rng(1926); const u = (i) => { while (U.length <= i) U.push(r0()); return U[i]; };
        let skey = null, S = null;
        const setup = () => {
          const k = ka(), sq = rule.value === 'sq', NT = 1200, th = [], dens = [];
          for (let i = 0; i <= NT; i++) { const a = (Math.PI * i) / NT, f = fB(a, k); th.push(a); dens.push((sq ? f * f : f) * Math.sin(a)); }
          const draw = sampler(th, dens);
          // cross-sections: σ = ∫|f|² dΩ, and the |f| rule normalized to the same total
          const sig = M.integrate((a) => 2 * Math.PI * fB(a, k) ** 2 * Math.sin(a), 0, Math.PI, 2000), sAbs = M.integrate((a) => 2 * Math.PI * fB(a, k) * Math.sin(a), 0, Math.PI, 2000);
          const sigF = Math.PI * (7 * k ** 4 + 18 * k * k + 12) / (3 * (1 + k * k) ** 3);
          const back = 1 - draw.cdf(Math.PI / 2);
          return { k, sq, draw, sig, sAbs, sigF, back };
        };
        let st = null;
        v.animate((t) => {
          const key = `${Es.value}|${rule.value}`; if (key !== skey) { skey = key; S = setup(); }
          const { k, draw } = S, col = phaseLUT(v), lut = col.lut.map((c) => c.match(/\d+/g).map(Number));
          const nAnim = Math.floor(3 * t + 2.2 * t * t), N = nAnim + extra;
          // ---- the wave
          const w = 2.2 * t, R = Rd.value;
          s1.raster((X, Y) => {
            const r = Math.hypot(X, Y); if (r > 10) return null;
            if (r < 0.9) return null;
            const th = Math.atan2(Math.abs(Y), X), a = fB(th, k) / r, ph = k * r - w, L = lut.length;
            const c = lut[((Math.round((ph / TAU) * L) % L) + L) % L], al = Math.min(1, Math.pow(a / 0.5, 0.6));
            return [c[0], c[1], c[2], Math.round(235 * al)];
          }, { res: 3, key: `${key}|${Math.round(w * 30)}` });
          s1.circle(0, 0, 0.75, { fill: 'red', fillAlpha: 0.35, color: 'red', width: 1 });
          s1.text('H', 0, 0, { color: 'ink', size: 11, align: 'center', baseline: 'middle', weight: 700 });
          s1.arrow(-9.6, 0, -2.2, 0, { color: 'ink', width: 1.8, head: 9 });
          s1.text('incident e⁻', -9.4, 0.7, { color: 'ink', size: 11 });
          s1.circle(0, 0, R, { color: 'muted', width: 1.2, dash: [3, 4] });
          const showN = Math.min(N, 400);
          for (let i = N - showN; i < N; i++) {
            const th = draw(u(2 * i)), sgn = u(2 * i + 1) < 0.5 ? 1 : -1, age = i < nAnim ? (nAnim - i) / (3 + 4.4 * t) : 5;
            s1.dot(R * Math.cos(th), sgn * R * Math.sin(th), { r: age < 0.25 ? 5 : 2.4, color: 'gold', alpha: age < 0.25 ? 1 : 0.55 });
          }
          // ---- histogram per solid angle
          const counts = new Array(NB).fill(0);
          for (let i = 0; i < N; i++) { const b = Math.min(NB - 1, Math.floor((draw(u(2 * i)) / Math.PI) * NB)); counts[b]++; }
          const edges = Array.from({ length: NB + 1 }, (_, i) => (180 * i) / NB), sigR = S.sq ? S.sig : S.sAbs;
          const per = counts.map((c, i) => { const dO = 2 * Math.PI * (Math.cos(edges[i] * D2R) - Math.cos(edges[i + 1] * D2R)); return c ? (sigR * c) / Math.max(N, 1) / dO * (S.sq ? 1 : S.sig / S.sAbs) : 0; });
          if (N) s2.hist({ edges, counts: per }, { color: 'gold', fillAlpha: 0.35, base: 1e-6 });
          s2.fn((d) => fB(d * D2R, k) ** 2, { color: 'green', width: 2.6, n: 300 });
          s2.fn((d) => (fB(d * D2R, k) * S.sig) / S.sAbs, { color: 'red', width: 1.8, dash: [6, 4], n: 300 });
          s2.corner(`${big(N)} electrons detected`, 'tr', { color: 'muted' });
          let back = 0; for (let i = 0; i < N; i++) if (draw(u(2 * i)) > Math.PI / 2) back++;
          st = { N, back: N ? back / N : 0, pBack: S.back, k, sig: S.sig, sigF: S.sigF, R, sq: S.sq, sAbs: S.sAbs };
        }, { period: 12, still: 9 });
        v.legend([['green', 'Born rule: |f(θ)|²'], ['red', 'if probability ∝ |f| (same total)', { dash: true }], ['gold', 'clicks (histogram)', { area: true }]]);
        v.readout(() => st && `$ka_0 = ${v.fix(st.k, 3)}$ · ${big(st.N)} electrons, fraction scattered beyond 90°: **${v.fix(100 * st.back, 2)} %** (predicted by the chosen rule: ${v.fix(100 * st.pBack, 2)} %) · total cross-section $\\int|f|^2d\\Omega = ${v.fix(st.sig / Math.PI, 4)}\\,\\pi a_0^2$ (closed form ${v.fix(st.sigF / Math.PI, 4)}\\,$\\pi a_0^2$) · outgoing flux through the detector sphere, per unit incident flux: with $|\\psi|^2$, $\\oint|f|^2/R^2\\,R^2d\\Omega = ${v.fix(st.sig, 3)}\\,a_0^2$ at any $R$; if probability went with $|\\psi|$ it would be $R\\oint|f|\\,d\\Omega = ${v.fix(st.R * st.sAbs, 2)}\\,a_0^2$ at $R = ${v.fix(st.R, 1)}\\,a_0$, growing with the radius — electrons from nowhere.`);
      },
    },
  ],
};
