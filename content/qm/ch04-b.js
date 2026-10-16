// Quantum Mechanics — Chapter 4: The harmonic oscillator (items 4.8–4.13; 4.1–4.7 in ch04.js)
// Units: ħ = m = ω = 1 unless an item says otherwise.
import { TAU, grid, normalize, phaseLUT, drawPsi, phaseWheel, clockSim, fz, sub, FAMILY, hermiteAt, hermiteFns, project, covariance, wigner, wignerAt, husimi, paintPhase, ellipsePts } from './ch04.shared.js';

const PI14 = Math.PI ** -0.25;

/** A periodic grid for split-step evolution of the oscillator: NG points on [−L/2, L/2). */
function oscGrid(NG = 256, L = 20) {
  const dx = L / NG;
  return { x: Float64Array.from({ length: NG }, (_, i) => -L / 2 + i * dx), dx, n: NG };
}
/** Gaussian state with covariance (sxx, sxp) (pure: spp follows) centred at (x0, p0), on the grid x. */
function gaussState(x, x0, p0, sxx, sxp) {
  const ar = 1 / (4 * sxx), ai = -sxp / (2 * sxx), n = x.length, re = new Float64Array(n), im = new Float64Array(n);
  for (let i = 0; i < n; i++) { const y = x[i] - x0, a = Math.exp(-ar * y * y), ph = -ai * y * y + p0 * x[i]; re[i] = a * Math.cos(ph); im[i] = a * Math.sin(ph); }
  normalize(re, im, x[1] - x[0]);
  return { re, im };
}
/** Covariance of a squeezed vacuum: squeeze factor r along the direction at angle φ from the x axis. */
function squeezeCov(r, phi) {
  const a = Math.exp(-2 * r) / 2, b = Math.exp(2 * r) / 2, c = Math.cos(phi), s = Math.sin(phi);
  return { sxx: a * c * c + b * s * s, spp: a * s * s + b * c * c, sxp: (a - b) * s * c };
}
/** Paint the Wigner function of a grid state on a phase-space stage (momentum samples follow the stage's view). */
function drawWigner(v, s, x, re, im, key) {
  const [p0, p1] = s.yr, ps = Array.from({ length: 120 }, (_, k) => p0 + ((p1 - p0) * k) / 119);
  const Wd = wigner(x, re, im, ps, 2);
  paintPhase(v, s, (X, P) => wignerAt(Wd, X, P), { key, res: 2 });
  return Wd;
}
/** Vacuum circle of radius 1/√2 (the 1σ contour of the ground state's Wigner function) around (mx, mp). */
const vacuumCircle = (s, mx, mp) => s.circle(mx, mp, Math.SQRT1_2, { color: 'green', width: 1.4, dash: [4, 3] });

export default {
  collection: 'qm',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.8
    {
      num: '4.8',
      kind: 'Theorem',
      name: 'Coherent states follow classical orbits',
      statement: String.raw`In the harmonic oscillator a coherent state $|\alpha\rangle$ evolves into the coherent state $|\alpha e^{-i\omega t}\rangle$ (times a phase). Hence:
(a) $\langle x\rangle(t)$ and $\langle p\rangle(t)$ follow the classical trajectory exactly: $\langle x\rangle+ i\langle p\rangle/m\omega$ turns uniformly on a circle (an ellipse in $x,p$ units);
(b) the uncertainties stay at the minimum, $\Delta x=\sqrt{\hbar/2m\omega}$, $\Delta p=\sqrt{\hbar m\omega/2}$, $\Delta x\Delta p=\hbar/2$, for all time — the packet does not spread;
(c) more generally, the Wigner function of **any** state rotates rigidly in phase space at angular speed $\omega$.
In an anharmonic potential none of this survives: $\langle x\rangle$ departs from the classical orbit and the packet spreads and shears.`,
      scope: String.raw`Exact for quadratic Hamiltonians (oscillators, free particles, uniform fields). In other potentials a narrow packet follows the classical orbit only until it has spread over the region where the force varies (the Ehrenfest time).`,
      idea: String.raw`Ehrenfest's theorem (qm-2.9) gives $\frac{d}{dt}\langle x\rangle=\langle p\rangle/m$, $\frac{d}{dt}\langle p\rangle=-\langle V'(x)\rangle$; for $V'=m\omega^2x$ the average of the force is the force at the average, so the means obey Hamilton's equations exactly (mech-4.5). The quantum flow of a quadratic Hamiltonian is a rigid rotation of phase space (4.6 is the quarter turn), which carries the Gaussian Wigner function of $|\alpha\rangle$ along without deforming it. With $\lambda x^4$ added, $\langle V'(x)\rangle\neq V'(\langle x\rangle)$ and different energies circulate at different rates, so the blob shears into a spiral.`,
      caption: String.raw`The phase plane shows the state's **Wigner function** $W(x,p)$ (blue positive, red negative) or its **Husimi function** $Q$, computed at every frame from $\Psi(x,t)$, which is evolved by the split-step Fourier method. Green: the path of $(\langle x\rangle,\langle p\rangle)$; red: a classical particle started at the same point; black ellipse: the $1\sigma$ contour from the computed covariance. **Drag the gold start point**. With $\lambda=0$ the blob circles rigidly on the classical orbit and $\Delta x\,\Delta p$ (right) sits at $\tfrac12$. **Raise the anharmonicity $\lambda$**: the blob shears into a spiral, negative fringes appear in $W$, $\Delta x\Delta p$ grows, and $\langle x\rangle$ (bottom) falls away from the classical curve.`,
      deps: ['qm-4.7', 'qm-2.9', 'mech-4.5'],
      see: ['qm-6.12', 'qm-4.6'],
      refs: ['Sakurai ch. 2'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Coherent_state' },
      tags: ['coherent states', 'phase space', 'correspondence principle'],
      viz(v) {
        const M = v.M, G = oscGrid(256, 20), x = G.x, DT = 0.01, PER = 4 * TAU, NH = 50, phi = hermiteFns(x, NH);
        let sim = null;
        const lam = v.slider('anharmonicity $\\lambda$ in $V=\\tfrac12x^2+\\lambda x^4$', 0, 0.05, 0, { step: 0.001, onChange: () => sim.reset() });
        const view = v.select('phase-space picture', [{ value: 'W', label: 'Wigner $W$' }, { value: 'Q', label: 'Husimi $Q$' }], 'W');
        const sP = v.stage({ x: [-4.6, 4.6], y: [-4.6, 4.6], height: 380, axes: 'box', gutter: true, equal: true, weight: 1.1, xlabel: 'x', ylabel: 'p', title: 'phase space at time $t$' });
        const sU = v.stage({ x: [0, PER], y: [0, 2.2], height: 380, axes: 'box', gutter: true, weight: 1, xlabel: 't', ylabel: 'Δx·Δp', title: 'uncertainty product $\\Delta x\\,\\Delta p$' });
        const sX = v.stage({ x: [0, PER], y: [-4, 4], height: 150, axes: 'box', gutter: true, full: true, xlabel: 't', ylabel: '⟨x⟩', title: '$\\langle x\\rangle(t)$ (green) against the classical $x(t)$ (red dashes)' });
        const hS = sP.handle(2.6, 0.8, { color: 'gold', r: 7, label: 'start', labelPos: 'ne', onDrag: () => sim.reset(), constrain: (X, Y) => { const r = Math.hypot(X, Y), k = r > 3.4 ? 3.4 / r : 1; return [X * k, Y * k]; } });
        let stepper = null, sl = null;
        const init = () => {
          const L = lam.value; if (sl !== L) { stepper = M.splitStep1D(Float64Array.from(x, (X) => 0.5 * X * X + L * X ** 4), G.dx, DT); sl = L; }
          const P = gaussState(x, hS.x, hS.y, 0.5, 0), cv = covariance(x, P.re, P.im);
          return { ...P, T: 0, xc: hS.x, pc: hS.y, k: 0, trail: [[cv.mx, cv.mp]], cl: [[hS.x, hS.y]], tr: [[0, Math.sqrt(cv.sxx * cv.spp), cv.mx, hS.x]] };
        };
        const step = (S, dt) => {
          stepper(S.re, S.im);
          const L = lam.value, f = (q) => -q - 4 * L * q ** 3; // classical leapfrog
          S.pc += 0.5 * dt * f(S.xc); S.xc += dt * S.pc; S.pc += 0.5 * dt * f(S.xc);
          S.T += dt; S.k++;
          if (S.k % 5 === 0) { const cv = covariance(x, S.re, S.im); S.trail.push([cv.mx, cv.mp]); S.cl.push([S.xc, S.pc]); S.tr.push([S.T, Math.sqrt(Math.max(0, cv.sxx * cv.spp - cv.sxp * cv.sxp)), cv.mx, S.xc]); }
        };
        sim = clockSim(init, step, DT, 5000);
        let st = null;
        v.animate((t) => {
          const S = sim.at(t), cv = covariance(x, S.re, S.im), key = `${S.k}|${lam.value}|${view.value}|${hS.x}|${hS.y}`;
          let Wd = null;
          if (view.value === 'W') Wd = drawWigner(v, sP, x, S.re, S.im, key);
          else { const c = project(phi, S.re, S.im, G.dx); paintPhase(v, sP, (X, P) => husimi(c.re, c.im, X, P), { key, res: 3, top: 1 / Math.PI }); }
          sP.axes();
          const L4 = lam.value, E0 = 0.5 * (hS.x ** 2 + hS.y ** 2) + L4 * hS.x ** 4;
          sP.contour((X, P) => 0.5 * (X * X + P * P) + L4 * X ** 4, [E0], { color: 'muted', width: 1.2, res: 160 });
          sP.path(S.cl, { color: 'red', width: 1.2, alpha: 0.7 });
          sP.path(S.trail, { color: 'green', width: 2 });
          sP.path(ellipsePts(cv.mx, cv.mp, cv.sxx, cv.spp, cv.sxp, 1), { color: 'ink', width: 1.5 });
          sP.dot(cv.mx, cv.mp, { r: 4.5, color: 'green' }); sP.dot(S.xc, S.pc, { r: 4.5, color: 'red' });
          // uncertainty product
          sU.hline(0.5, { color: 'green', width: 1.3, dash: [5, 4] }); sU.text('ħ/2', PER * 0.98, 0.5, { size: 11, color: 'green', align: 'right', dy: -9 });
          const top = Math.max(1.2, ...S.tr.map((r) => r[1] * 1.1)); sU.setView([0, PER], [0, top]);
          sU.path(S.tr.map((r) => [r[0], r[1]]), { color: 'accent', width: 2.2 });
          sU.dot(S.T, Math.sqrt(Math.max(0, cv.sxx * cv.spp - cv.sxp * cv.sxp)), { r: 5, color: 'gold' });
          // ⟨x⟩ vs classical
          const R = Math.hypot(hS.x, hS.y) + 0.6; sX.setView([0, PER], [-R, R]);
          sX.path(S.tr.map((r) => [r[0], r[3]]), { color: 'red', width: 1.6, dash: [6, 4] });
          sX.path(S.tr.map((r) => [r[0], r[2]]), { color: 'green', width: 2.2 });
          sX.vline(S.T, { color: 'gold', width: 1.2 });
          let dev = 0; for (const r of S.tr) dev = Math.max(dev, Math.abs(r[2] - r[3]));
          st = { T: S.T, cv, dev, Wmin: Wd ? Wd.min : null, Wmax: Wd ? Wd.max : null };
        }, { period: PER, still: 1.3 * TAU });
        v.legend([['accent', '$W>0$', { area: true }], ['red', '$W<0$ / classical', { area: true }], ['green', '$(\\langle x\\rangle,\\langle p\\rangle)$'], ['ink', '$1\\sigma$ ellipse'], ['muted', 'classical energy contour']]);
        v.readout(() => {
          if (!st) return '';
          const pr = Math.sqrt(Math.max(0, st.cv.sxx * st.cv.spp - st.cv.sxp ** 2));
          return `$t = ${v.fix(st.T, 2)}$ · $\\Delta x = ${v.fix(Math.sqrt(st.cv.sxx), 4)}$, $\\Delta p = ${v.fix(Math.sqrt(st.cv.spp), 4)}$, $\\sqrt{\\det\\Sigma} = ${v.fix(pr, 4)}$ (minimum $\\tfrac12$) · largest gap so far between $\\langle x\\rangle$ and the classical $x(t)$: $${st.dev < 1e-3 ? v.sci(Math.max(st.dev, 1e-12), 1) : v.fix(st.dev, 3)}$` + (st.Wmin != null ? ` · $\\min W = ${fz(v, st.Wmin, 4)}$${st.Wmin < -0.005 ? ' (negative: interference)' : ''}` : '') + (lam.value ? ` — with $\\lambda = ${v.fix(lam.value, 3)}$ the state no longer stays coherent.` : ' — exactly classical, as the theorem says.');
        });
      },
    },
    // ------------------------------------------------------------------ 4.9
    {
      num: '4.9',
      kind: 'Model',
      name: 'Squeezed states',
      statement: String.raw`A **squeezed state** is a minimum-uncertainty Gaussian whose phase-space blob is an ellipse instead of a circle: $|\alpha,\xi\rangle=D(\alpha)S(\xi)|0\rangle$ with $S(\xi)=\exp\big(\tfrac12(\bar\xi a^2-\xi a^{\dagger2})\big)$, $\xi=re^{i\theta}$. Squeezing along $x$ (units $\hbar=m=\omega=1$) gives
$$\Delta x=\tfrac1{\sqrt2}e^{-r},\qquad \Delta p=\tfrac1{\sqrt2}e^{r},\qquad \Delta x\,\Delta p=\tfrac12 ,$$
so one quadrature is **quieter than the vacuum** at the cost of the other. Under the oscillator the ellipse rotates rigidly at frequency $\omega$, so $\Delta x(t)$ **breathes at $2\omega$**, dipping below $1/\sqrt2$ twice per period. The squeezed vacuum ($\alpha=0$) contains only even numbers of quanta: $P(2m)=\frac{(2m)!}{2^{2m}(m!)^2}\frac{(\tanh r)^{2m}}{\cosh r}$.`,
      scope: String.raw`Squeezed light is made by parametric down-conversion and used to beat the shot-noise limit, for example in gravitational-wave interferometers; losses degrade squeezing toward the vacuum level.`,
      idea: String.raw`The uncertainty principle (qm-2.11) fixes only the product $\Delta x\Delta p$, more precisely the determinant of the covariance matrix, $\ge\tfrac14$; it says nothing about the shape. A Gaussian $e^{-(a_r+ia_i)x^2}$ with $a_r\ne\tfrac12$ is still a minimum-uncertainty state, just a stretched one. Because the oscillator flow is a rigid rotation of phase space (4.8), the ellipse keeps its shape and the variance of $x$ at time $t$ is the ellipse's width along a rotating direction, $\Delta x(t)^2=\tfrac12(e^{-2r}\cos^2t+e^{2r}\sin^2t)$, periodic with period $\pi$. $S(\xi)$ is generated by $a^2$ and $a^{\dagger2}$, which create and destroy quanta in pairs, hence the even photon numbers.`,
      caption: String.raw`Left: $\Psi(x,t)$ in the well (height $|\Psi|$, colour phase), with the vacuum's shape (green dashes) for comparison. Middle: the computed Wigner function with its $1\sigma$ ellipse and the vacuum circle (green). The state is evolved by the split-step method. **Set the squeezing $r$** and the squeeze direction: the ellipse rotates while keeping its area, so the packet alternately narrows below the vacuum width and widens beyond it. Bottom: $\Delta x(t)$ and $\Delta p(t)$, breathing at twice the oscillator frequency around the vacuum level $1/\sqrt2$. Right: the number distribution at $t=0$ (projection onto Hermite functions). For the squeezed vacuum only even $n$ occur, matching the formula (dots).`,
      deps: ['qm-4.8', 'qm-2.11'],
      see: ['qm-4.12'],
      refs: ['Sakurai ch. 2'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Squeezed_coherent_state' },
      tags: ['squeezed states', 'uncertainty', 'quantum optics'],
      viz(v) {
        const M = v.M, G = oscGrid(256, 20), x = G.x, DT = 0.01, PER = 2 * TAU, NH = 60, phi = hermiteFns(x, NH);
        let sim = null;
        const rs = v.slider('squeezing $r$', 0, 1.2, 0.8, { step: 0.01, onChange: () => sim.reset() });
        const ph = v.slider('squeeze direction (degrees from the x axis)', 0, 90, 0, { step: 1, onChange: () => sim.reset() });
        const x0s = v.slider('displacement $\\langle x\\rangle_0$', 0, 3, 0, { step: 0.05, onChange: () => sim.reset() });
        const sA = v.stage({ x: [-5.5, 5.5], y: [0, 1], height: 280, axes: 'box', gutter: true, weight: 1.3, xlabel: 'x', title: '$\\Psi(x,t)$ against the vacuum shape' });
        const sP = v.stage({ x: [-5, 5], y: [-5, 5], height: 280, axes: 'box', gutter: true, equal: true, weight: 1, xlabel: 'x', ylabel: 'p', title: 'Wigner function' });
        const sN = v.stage({ x: [-0.6, 16.6], y: [0, 1], height: 280, axes: 'box', gutter: true, weight: 0.9, xlabel: 'n', ylabel: 'P(n)', title: 'number distribution at $t=0$' });
        const sT = v.stage({ x: [0, PER], y: [0, 2.5], height: 190, axes: 'box', gutter: true, full: true, xlabel: 't', xticks: [[0, '0'], [Math.PI / 2, 'π/2'], [Math.PI, 'π'], [1.5 * Math.PI, '3π/2'], [TAU, '2π'], [2.5 * Math.PI, '5π/2'], [3 * Math.PI, '3π'], [3.5 * Math.PI, '7π/2'], [4 * Math.PI, '4π']], title: '$\\Delta x(t)$ and $\\Delta p(t)$' });
        let stepper = M.splitStep1D(Float64Array.from(x, (X) => 0.5 * X * X), G.dx, DT), C0 = null;
        const init = () => {
          const c = squeezeCov(rs.value, (ph.value * Math.PI) / 180), P = gaussState(x, x0s.value, 0, c.sxx, c.sxp);
          C0 = project(phi, P.re, P.im, G.dx);
          const cv = covariance(x, P.re, P.im);
          return { ...P, T: 0, k: 0, tr: [[0, Math.sqrt(cv.sxx), Math.sqrt(cv.spp)]] };
        };
        const step = (S, dt) => { stepper(S.re, S.im); S.T += dt; S.k++; if (S.k % 4 === 0) { const cv = covariance(x, S.re, S.im); S.tr.push([S.T, Math.sqrt(cv.sxx), Math.sqrt(cv.spp)]); } };
        sim = clockSim(init, step, DT, 5000);
        let st = null;
        v.animate((t) => {
          const S = sim.at(t), col = phaseLUT(v), cv = covariance(x, S.re, S.im), r = rs.value;
          // Ψ in the well
          let pk = 0; for (let i = 0; i < G.n; i++) pk = Math.max(pk, Math.hypot(S.re[i], S.im[i]));
          const top = Math.max(pk, Math.pow(Math.PI * Math.exp(-2 * r), -0.25)) * 1.15; sA.setView([-5.5, 5.5], [-0.04 * top, top]);
          sA.fn((X) => (0.5 * X * X) / 12 * top, { color: 'muted', width: 1.4, fill: 'muted', fillAlpha: 0.1, n: 300 });
          drawPsi(sA, x, S.re, S.im, { col });
          sA.path(Array.from(x, (X) => [X, PI14 * Math.exp(-0.5 * (X - cv.mx) ** 2)]), { color: 'green', width: 1.8, dash: [6, 4] });
          phaseWheel(sA, col, sA.W - 40, 44, 11);
          // Wigner
          const Wd = drawWigner(v, sP, x, S.re, S.im, `${S.k}|${r}|${ph.value}|${x0s.value}`);
          sP.axes();
          vacuumCircle(sP, cv.mx, cv.mp);
          sP.path(ellipsePts(cv.mx, cv.mp, cv.sxx, cv.spp, cv.sxp, 1), { color: 'ink', width: 1.6 });
          // Δx(t), Δp(t)
          const ymax = Math.max(1.2, Math.exp(r) / Math.SQRT2 * 1.12); sT.setView([0, PER], [0, ymax]);
          sT.hline(Math.SQRT1_2, { color: 'green', width: 1.3, dash: [5, 4] }); sT.text('vacuum 1/√2', 0.1, Math.SQRT1_2, { size: 10.5, color: 'green', dy: -9, plate: true });
          sT.path(S.tr.map((q) => [q[0], q[2]]), { color: 'purple', width: 1.8 });
          sT.path(S.tr.map((q) => [q[0], q[1]]), { color: 'orange', width: 2.4 });
          sT.vline(S.T, { color: 'gold', width: 1.2 }); sT.dot(S.T, Math.sqrt(cv.sxx), { r: 5, color: 'orange' });
          // number distribution
          const P = Array.from(C0.re, (q, k) => q * q + C0.im[k] * C0.im[k]), sv = !x0s.value;
          sN.setView([-0.6, 16.6], [0, Math.max(0.15, ...P.slice(0, 17)) * 1.15]);
          sN.bars(P.slice(0, 17), { x0: 0, dx: 1, color: 'accent' });
          let fdev = 0;
          if (sv) {
            const th = Math.tanh(r), ch = Math.cosh(r), pts = [];
            let w = 1 / ch; for (let m = 0; m <= 8; m++) { pts.push([2 * m, w]); fdev = Math.max(fdev, Math.abs(P[2 * m] - w), Math.abs(P[2 * m + 1])); w *= (th * th * (2 * m + 1) * (2 * m + 2)) / (4 * (m + 1) * (m + 1)); }
            sN.dots(pts, { r: 4, color: 'orange' });
          }
          // breathing period from the recorded minima of Δx
          const mins = []; for (let k = 1; k < S.tr.length - 1; k++) if (S.tr[k][1] < S.tr[k - 1][1] && S.tr[k][1] <= S.tr[k + 1][1]) mins.push(S.tr[k][0]);
          let mean = 0; P.forEach((q, k) => { mean += k * q; });
          st = { S, cv, dxmin: Math.min(...S.tr.map((q) => q[1])), per: mins.length >= 2 ? (mins[mins.length - 1] - mins[0]) / (mins.length - 1) : NaN, fdev, sv, mean, Wmin: Wd.min };
        }, { period: PER, still: 2.4 });
        v.legend([['orange', 'Δx'], ['purple', 'Δp'], ['green', 'vacuum', { dash: true }], ['ink', '$1\\sigma$ ellipse'], ['accent', 'P(n) (projection)', { area: true }], ['orange', 'squeezed-vacuum formula', { dot: true }]]);
        v.readout(() => {
          if (!st) return '';
          const r = rs.value, pr = Math.sqrt(Math.max(0, st.cv.sxx * st.cv.spp - st.cv.sxp ** 2));
          return `now $\\Delta x = ${v.fix(Math.sqrt(st.cv.sxx), 4)}$, $\\Delta p = ${v.fix(Math.sqrt(st.cv.spp), 4)}$, $\\sqrt{\\det\\Sigma} = ${v.fix(pr, 4)}$ (stays $\\tfrac12$) · smallest $\\Delta x$ so far ${v.fix(st.dxmin, 4)} vs $e^{-r}/\\sqrt2 = ${v.fix(Math.exp(-r) / Math.SQRT2, 4)}$` + (Number.isFinite(st.per) ? ` · breathing period ${v.fix(st.per, 3)} $= \\pi/\\omega$ (${v.fix(Math.PI, 3)})` : '') + ` · $\\langle n\\rangle = ${v.fix(st.mean, 3)}$` + (st.sv ? ` (formula $\\sinh^2 r = ${v.fix(Math.sinh(r) ** 2, 3)}$), largest deviation from the even-only law $${v.sci(Math.max(st.fdev, 1e-16), 1)}$` : '') + '.';
        });
      },
    },
    // ------------------------------------------------------------------ 4.10
    {
      num: '4.10',
      kind: 'Phenomenon',
      name: 'Classical limit of oscillator densities',
      statement: String.raw`A classical oscillator of amplitude $A$ spends time near $x$ in proportion to $1/|v(x)|$, so its position density is the **arcsine law**
$$\rho_{\rm cl}(x)=\frac{1}{\pi\sqrt{A^2-x^2}},\qquad |x|<A .$$
For the quantum state $\psi_n$ take the classical amplitude with the same energy, $A=\sqrt{2n+1}$ (units $\hbar=m=\omega=1$). As $n\to\infty$, $|\psi_n|^2$ oscillates ever faster (with $n$ nodes) under the envelope $\rho_{\rm cl}$, its local averages converge to $\rho_{\rm cl}$, and the probability of finding the particle in the classically forbidden region $|x|>A$ tends to 0. In the rescaled variable $x/A$ the distributions converge weakly to the arcsine law.`,
      idea: String.raw`Inside the turning points the WKB approximation gives $\psi_n\approx\frac{C}{\sqrt{p(x)}}\cos\big(\int p\,dx-\tfrac\pi4\big)$ with $p=\sqrt{2E-x^2}$: the amplitude squared is proportional to $1/p\propto1/v$ — the classical dwell time — and the $\cos^2$ averages to $\tfrac12$ over the shrinking local wavelength $2\pi/p$. Near the turning points the solution is an Airy function whose width shrinks like $n^{-1/6}$, so the forbidden-region probability and the distance between the two distributions both go to zero. This is Bohr's correspondence principle for the stationary states of 4.5 against the orbits of mech-4.5.`,
      caption: String.raw`Top: $|\psi_n(x)|^2$ (blue), the classical density $\rho_{\rm cl}$ for the same energy (red), its turning points $\pm A$, and a running average of the quantum density over one local oscillation (green). **Raise $n$** (up to 150): the wiggles get finer and the green average hugs the red curve. Bottom left: the cumulative distributions, quantum against the arcsine law. Bottom right: their largest gap (the Kolmogorov distance) against $n$ on log–log axes, with a fitted power law, and the probability of finding the particle beyond the turning points.`,
      deps: ['qm-4.5', 'mech-4.5'],
      see: ['qm-3.18', 'qm-4.1'],
      refs: ['Griffiths §2.3'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Correspondence_principle' },
      tags: ['correspondence principle', 'classical limit', 'WKB'],
      viz(v) {
        const M = v.M, NMAX = 150, NX = 2401, XL = 19.5, xs = Float64Array.from({ length: NX }, (_, i) => -XL + (2 * XL * i) / (NX - 1)), dx = xs[1] - xs[0];
        const ns = v.slider('quantum number $n$', 0, NMAX, 20, { int: true });
        const scaled = v.toggle('rescale $x$ by the amplitude $A$', false);
        const sA = v.stage({ x: [-6, 6], y: [0, 1], height: 260, axes: 'box', gutter: true, full: true, xlabel: 'x', title: '$|\\psi_n(x)|^2$ under the classical density' });
        const sC = v.stage({ x: [-1.2, 1.2], y: [0, 1], height: 230, axes: 'box', gutter: true, weight: 1, xlabel: 'x / A', yticks: [0, 0.5, 1], title: 'cumulative distributions' });
        const sK = v.stage({ x: [1, NMAX], y: [1e-3, 0.5], height: 230, axes: 'box', gutter: true, xlog: true, ylog: true, weight: 1, xlabel: 'n', title: 'distance to the classical law' });
        // all densities |ψ_n|² on the grid, once (the recurrence produces every n at each point)
        const dens = Array.from({ length: NMAX + 1 }, () => new Float32Array(NX)), tmp = new Float64Array(NMAX + 1);
        for (let i = 0; i < NX; i++) { hermiteAt(xs[i], NMAX + 1, tmp); for (let n = 0; n <= NMAX; n++) dens[n][i] = tmp[n] * tmp[n]; }
        const Fcl = (X, A) => (X <= -A ? 0 : X >= A ? 1 : 0.5 + Math.asin(X / A) / Math.PI);
        const stats = []; // [n, KS, P(outside)]
        for (let n = 0; n <= NMAX; n++) {
          const A = Math.sqrt(2 * n + 1), d = dens[n]; let c = 0, ks = 0, out = 0;
          for (let i = 0; i < NX; i++) { c += d[i] * dx; ks = Math.max(ks, Math.abs(c - Fcl(xs[i], A))); if (Math.abs(xs[i]) > A) out += d[i] * dx; }
          stats.push([n, ks, out]);
        }
        const fitPts = stats.filter((s) => s[0] >= 10), fit = M.linreg(fitPts.map((s) => Math.log(s[0])), fitPts.map((s) => Math.log(s[1])));
        let st = null;
        v.render(() => {
          const n = ns.value, A = Math.sqrt(2 * n + 1), d = dens[n], k = scaled.value ? A : 1;
          const X0 = -1.25 * A, X1 = 1.25 * A;
          // running average over one local period of the density, π/√(2n+1)
          const w = Math.max(1, Math.round((0.5 * Math.PI) / A / dx)), avg = new Float64Array(NX);
          { let s = 0; const cs = new Float64Array(NX + 1); for (let i = 0; i < NX; i++) { s += d[i]; cs[i + 1] = s; } for (let i = 0; i < NX; i++) { const a = Math.max(0, i - w), b = Math.min(NX, i + w + 1); avg[i] = (cs[b] - cs[a]) / (b - a); } }
          let pk = 0; for (let i = 0; i < NX; i++) if (xs[i] > X0 && xs[i] < X1) pk = Math.max(pk, d[i]);
          const ytop = Math.max(pk, 2.2 / (Math.PI * A)) * 1.08;
          sA.setView([X0 / k, X1 / k], [0, ytop * k]); sA.setLabels(scaled.value ? 'x / A' : 'x', undefined);
          const pts = []; for (let i = 0; i < NX; i++) if (xs[i] > X0 - 0.1 && xs[i] < X1 + 0.1) pts.push([xs[i] / k, d[i] * k]);
          sA.poly([[pts[0][0], 0], ...pts, [pts[pts.length - 1][0], 0]], { fill: 'accent', fillAlpha: 0.3, stroke: false });
          sA.path(pts, { color: 'accent', width: n > 60 ? 0.9 : 1.3 });
          sA.fn((u) => { const X = u * k; return Math.abs(X) < A ? k / (Math.PI * Math.sqrt(A * A - X * X)) : NaN; }, { color: 'red', width: 2.2, n: 800 });
          const ap = []; for (let i = 0; i < NX; i++) if (xs[i] > X0 && xs[i] < X1) ap.push([xs[i] / k, avg[i] * k]);
          sA.path(ap, { color: 'green', width: 2.2 });
          for (const s of [-1, 1]) { sA.vline((s * A) / k, { color: 'ink', width: 1, dash: [4, 3], alpha: 0.6 }); sA.text(s < 0 ? '−A' : '+A', (s * A) / k, ytop * k * 0.94, { size: 11, color: 'ink', align: s < 0 ? 'right' : 'left', dx: s * 5 }); }
          // CDFs
          const cq = []; let c = 0; for (let i = 0; i < NX; i++) { c += d[i] * dx; if (xs[i] > -1.2 * A && xs[i] < 1.2 * A) cq.push([xs[i] / A, c]); }
          sC.fn((u) => Fcl(u, 1), { color: 'red', width: 2.2, dash: [6, 4], n: 400 });
          sC.path(cq, { color: 'accent', width: 1.6 });
          // KS vs n
          sK.path(stats.filter((s) => s[0] >= 1).map((s) => [s[0], s[1]]), { color: 'accent', width: 1.8 });
          sK.path(stats.filter((s) => s[0] >= 1).map((s) => [s[0], Math.max(1e-3, s[2])]), { color: 'orange', width: 1.6 });
          sK.fn((q) => Math.exp(fit.intercept) * q ** fit.slope, { color: 'ink', width: 1, dash: [4, 4] });
          if (n >= 1) { sK.dot(n, stats[n][1], { r: 5, color: 'gold' }); sK.dot(n, Math.max(1e-3, stats[n][2]), { r: 4, color: 'gold' }); }
          st = { n, A, ks: stats[n][1], out: stats[n][2] };
        });
        v.legend([['accent', 'quantum $|\\psi_n|^2$ / its CDF'], ['red', 'classical $1/\\pi\\sqrt{A^2-x^2}$ / arcsine CDF'], ['green', 'running average'], ['orange', 'P(beyond ±A)'], ['ink', `fit $\\propto n^{${v.fix(fit.slope, 2)}}$`, { dash: true }]]);
        v.readout(() => st && `$n = ${st.n}$, $E = ${st.n}.5\\,\\hbar\\omega$, amplitude $A = \\sqrt{2n+1} = ${v.fix(st.A, 3)}$ · largest gap between the quantum and classical CDFs **${v.fix(st.ks, 4)}** · probability beyond the turning points **${v.fix(st.out, 4)}** (it is ${v.fix(stats[0][2], 4)} for the ground state) · over $10\\le n\\le150$ the gap falls like $n^{${v.fix(fit.slope, 2)}}$.`);
      },
    },
    // ------------------------------------------------------------------ 4.11
    {
      num: '4.11',
      kind: 'Model',
      name: 'Phonons: quantized normal modes',
      credit: 'Einstein, 1907; Debye, 1912',
      statement: String.raw`A chain of $N$ masses $m$ joined by springs $K$ (ends fixed) has, in harmonic approximation, $N$ independent normal modes (mech-11.5) with frequencies
$$\omega_j=2\sqrt{K/m}\,\sin\frac{j\pi}{2(N+1)},\qquad j=1,\dots,N,$$
and shapes $e_j(l)=\sqrt{\tfrac{2}{N+1}}\sin\frac{jl\pi}{N+1}$. Quantizing, each normal coordinate is an independent quantum oscillator, so the stationary states are labelled by occupation numbers $(n_1,\dots,n_N)$ with
$$E=\sum_j\hbar\omega_j\Big(n_j+\tfrac12\Big).$$
A quantum $\hbar\omega_j$ of vibration is a **phonon** of wave number $k_j=j\pi/(N+1)a$; the vibration energy comes only in these units, and even with no phonons each atom jitters with the zero-point spread $\langle u_l^2\rangle=\sum_j\frac{\hbar}{2m\omega_j}e_j(l)^2$.`,
      scope: String.raw`Harmonic approximation for small vibrations; anharmonic terms make phonons interact (thermal expansion, finite thermal conductivity). Phonons explain the low-temperature heat capacity of solids (Einstein, Debye) and, with electrons, superconductivity.`,
      idea: String.raw`The Hamiltonian $\sum\frac{p_l^2}{2m}+\frac K2\sum(u_{l+1}-u_l)^2$ is a quadratic form; the orthogonal change of variables to normal coordinates $Q_j=\sum_le_j(l)u_l$ diagonalizes both kinetic and potential parts at once, leaving $\sum_j\big(\frac{P_j^2}{2m}+\frac12m\omega_j^2Q_j^2\big)$. Canonical commutators survive orthogonal transformations, so each $(Q_j,P_j)$ pair is an independent oscillator with its own ladder operators (4.3), and the spectrum is the sum. In a number state $\langle u_l\rangle=0$ — the atoms only fluctuate, with variance increased by $2n_j+1$ in mode $j$; a classical-looking travelling or standing wave is a coherent state (4.7) of the mode.`,
      caption: String.raw`Bottom left: every normal mode is its own ladder of levels $\hbar\omega_j(n+\tfrac12)$ — high-$k$ modes have widely spaced rungs. **Click a rung** to set that mode's phonon number (click the bottom rung to empty it). Top: the chain (displacements drawn sideways for visibility) with each atom's probability cloud computed from $\langle u_l^2\rangle$; the thin brackets show the zero-point spread alone. In **number states** the atoms do not move on average — the phonons show up as extra fuzz with the mode's pattern. Switch to **coherent states** with the same mean phonon numbers to see the classical vibration they correspond to. Bottom right: the dispersion relation $\omega(k)$ with the occupied modes.`,
      deps: ['qm-4.3', 'mech-11.5'],
      see: ['qm-4.7', 'qm-4.12'],
      refs: ['Griffiths ch. 5'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Phonon' },
      tags: ['phonons', 'normal modes', 'solid state'],
      viz(v) {
        const M = v.M, N = 10, NMAXQ = 6;
        // dynamical matrix (K = m = 1): diagonalize it honestly
        const Dm = M.zeros(N, N); for (let i = 0; i < N; i++) { Dm[i][i] = 2; if (i > 0) Dm[i][i - 1] = -1; if (i < N - 1) Dm[i][i + 1] = -1; }
        const eg = M.eigSym(Dm), ord = eg.values.map((l, i) => [l, i]).sort((a, b) => a[0] - b[0]);
        const om = ord.map(([l]) => Math.sqrt(l)), ev = ord.map(([, i]) => { const c = eg.vecs[i]; const sg = c[0] < 0 ? -1 : 1; return c.map((q) => q * sg); });
        let edev = 0; for (let j = 0; j < N; j++) edev = Math.max(edev, Math.abs(om[j] - 2 * Math.sin(((j + 1) * Math.PI) / (2 * (N + 1)))));
        const nq = new Array(N).fill(0); nq[0] = 2; nq[2] = 1;
        const mode = v.select('state of each mode', [{ value: 'fock', label: 'number states $|n_j\\rangle$' }, { value: 'coh', label: 'coherent states, $\\langle n_j\\rangle$ the same' }], 'fock');
        v.button('remove all phonons', () => nq.fill(0));
        const sA = v.stage({ x: [-0.2, N + 1.2], y: [-3.6, 3.6], height: 230, axes: false, full: true, title: 'the chain: mean displacement and probability cloud of each atom' });
        const sL = v.stage({ x: [0.3, N + 0.7], y: [0, 7], height: 300, axes: 'box', gutter: true, weight: 1.3, xlabel: 'mode j', ylabel: 'E / ħω₀', xticks: Array.from({ length: N }, (_, j) => j + 1), title: 'one oscillator per mode: click a rung' });
        const sD = v.stage({ x: [0, Math.PI], y: [0, 2.15], height: 300, axes: 'box', gutter: true, weight: 1, xlabel: 'k a', ylabel: 'ω / ω₀', xticks: [[0, '0'], [Math.PI / 2, 'π/2'], [Math.PI, 'π']], title: 'dispersion $\\omega(k)=2\\omega_0\\sin(ka/2)$' });
        sL.onClick((X, Y) => { const j = Math.round(X) - 1; if (j < 0 || j >= N) return; nq[j] = Math.max(0, Math.min(NMAXQ, Math.round(Y / om[j] - 0.5))); v.invalidate(); });
        let st = null;
        v.animate((t) => {
          const coh = mode.value === 'coh';
          // per-atom spread and mean
          const s0 = [], sg = [], mu = [];
          for (let l = 0; l < N; l++) {
            let a = 0, b = 0, m = 0;
            for (let j = 0; j < N; j++) { const e2 = ev[j][l] ** 2; a += e2 / (2 * om[j]); b += (coh ? 1 : 2 * nq[j] + 1) * e2 / (2 * om[j]); if (coh) m += Math.sqrt((2 * nq[j]) / om[j]) * ev[j][l] * Math.cos(om[j] * t); }
            s0.push(Math.sqrt(a)); sg.push(Math.sqrt(b)); mu.push(m);
          }
          const CA = v.rgb('accent'), BG = v.rgb('panel');
          sA.raster((X, Y) => {
            const l = Math.round(X); if (l < 1 || l > N || Math.abs(X - l) > 0.3) return null;
            const z = (Y - mu[l - 1]) / sg[l - 1], q = Math.exp(-0.5 * z * z) * (1 - (Math.abs(X - l) / 0.3) ** 2);
            return [BG[0] + (CA[0] - BG[0]) * q * 0.75, BG[1] + (CA[1] - BG[1]) * q * 0.75, BG[2] + (CA[2] - BG[2]) * q * 0.75];
          }, { res: 2, key: `${coh ? t : 0}|${nq.join(',')}|${mode.value}` });
          for (const X of [0, N + 1]) sA.rect(X - 0.18, -3.4, X, 3.4, { fill: 'muted', fillAlpha: 0.35, hatch: 'muted', hatchAlpha: 0.4, stroke: false });
          const pos = [[0, 0], ...mu.map((m, l) => [l + 1, m]), [N + 1, 0]];
          for (let l = 0; l <= N; l++) { const [a, b] = pos[l], [c, d] = pos[l + 1], zz = []; for (let k = 0; k <= 16; k++) { const u = k / 16; zz.push([a + (c - a) * u, b + (d - b) * u + (k % 2 ? 0.12 : -0.12) * (k && k < 16 ? 1 : 0)]); } sA.path(zz, { color: 'muted', width: 1.1 }); }
          for (let l = 0; l < N; l++) {
            for (const s of [-1, 1]) sA.line(l + 1 - 0.12, mu[l] + s * s0[l], l + 1 + 0.12, mu[l] + s * s0[l], { color: 'ink', width: 1, alpha: 0.55 });
            sA.dot(l + 1, mu[l], { r: 6, color: 'ink' });
          }
          // ladders
          const Emax = Math.max(7, ...om.map((w, j) => w * (nq[j] + 1.5)));
          sL.setView([0.3, N + 0.7], [0, Emax]);
          for (let j = 0; j < N; j++) {
            for (let n = 0; om[j] * (n + 0.5) <= Emax; n++) {
              const E = om[j] * (n + 0.5), on = n === nq[j];
              sL.line(j + 1 - 0.32, E, j + 1 + 0.32, E, { color: on ? (n ? 'gold' : 'accent') : 'muted', width: on ? (n ? 3.4 : 2.2) : 1, alpha: on ? 1 : 0.6 });
            }
            if (nq[j]) sL.text(`n=${nq[j]}`, j + 1, om[j] * (nq[j] + 0.5), { size: 10.5, color: 'ink', align: 'center', dy: -10, weight: 600 });
          }
          // dispersion
          sD.fn((q) => 2 * Math.sin(q / 2), { color: 'orange', width: 2, domain: [0, Math.PI] });
          for (let j = 0; j < N; j++) { const k = ((j + 1) * Math.PI) / (N + 1); sD.dot(k, om[j], { r: 3 + 2.2 * nq[j], color: nq[j] ? 'gold' : 'muted', hollow: !nq[j] }); }
          let E = 0, Z = 0, np = 0; for (let j = 0; j < N; j++) { E += om[j] * (nq[j] + 0.5); Z += om[j] / 2; np += nq[j]; }
          st = { E, Z, np, s0: s0[4], sg: sg[4] };
        }, { period: 40, still: 3 });
        v.legend([['gold', 'occupied level $n_j>0$'], ['accent', 'mode in its ground state'], ['accent', 'probability cloud of each atom', { area: true }], ['ink', 'zero-point spread ±√⟨u²⟩₀'], ['orange', 'ω(k)']]);
        v.readout(() => st && `${st.np} phonon${st.np === 1 ? '' : 's'} · $E = \\sum_j\\hbar\\omega_j(n_j+\\tfrac12) = ${v.fix(st.E, 4)}\\,\\hbar\\omega_0$, of which zero-point $\\tfrac12\\sum_j\\hbar\\omega_j = ${v.fix(st.Z, 4)}\\,\\hbar\\omega_0$ · middle atom: rms displacement ${v.fix(st.sg, 3)} against ${v.fix(st.s0, 3)} from zero-point motion alone (unit $\\sqrt{\\hbar/m\\omega_0}$) · mode frequencies from diagonalizing the spring matrix match $2\\omega_0\\sin\\frac{j\\pi}{2(N+1)}$ to $${v.sci(Math.max(edev, 1e-16), 1)}$.`);
      },
    },
    // ------------------------------------------------------------------ 4.12
    {
      num: '4.12',
      kind: 'Model',
      name: 'Photons as quanta of field modes',
      credit: 'Dirac, 1927',
      statement: String.raw`Each mode of the electromagnetic field in a cavity — here a standing wave $\sin kz$ of frequency $\omega=ck$ — is a harmonic oscillator whose two quadratures are the cosine and sine parts of the electric field. Quantizing it,
$$\hat E(z,t)=\mathcal E_0\big(a\,e^{-i\omega t}+a^\dagger e^{i\omega t}\big)\sin kz,\qquad \hat H=\hbar\omega\Big(a^\dagger a+\tfrac12\Big),\qquad \mathcal E_0=\sqrt{\hbar\omega/\varepsilon_0V}.$$
The number states $|n\rangle$ contain $n$ **photons** of energy $\hbar\omega$ each, with total energy $(n+\tfrac12)\hbar\omega$. In $|n\rangle$ the mean field vanishes at every instant, $\langle\hat E\rangle=0$, yet $\langle\hat E^2\rangle=\mathcal E_0^2(2n+1)\sin^2kz\neq0$ — even the vacuum ($n=0$) has field fluctuations. A field with a definite oscillating mean requires a superposition of photon numbers; a coherent state (4.7) gives the classical wave.`,
      scope: String.raw`One mode of an ideal lossless cavity; free space is the limit of a very large cavity with a continuum of modes. The single-mode picture underlies cavity QED and the laser.`,
      idea: String.raw`Maxwell's equations for one mode amplitude reduce to $\ddot q=-\omega^2q$ with energy $\tfrac12(p^2+\omega^2q^2)$, where $q$ is proportional to the electric field's amplitude and $p$ to the magnetic one — an oscillator, quantized by 4.3. A number state is an energy eigenstate, hence stationary: its distribution of field values is the same at every phase (its Wigner function is rotationally symmetric), so the mean is zero. The variance is $\langle n|(a+a^\dagger)^2|n\rangle=2n+1$ by the ladder rules (4.2). Only states mixing neighbouring $n$ have $\langle a\rangle\neq0$ and hence an oscillating mean field.`,
      caption: String.raw`Top: the cavity between two mirrors. Each gold curve is one possible outcome of measuring the field now (21 evenly spaced quantiles of the computed distribution), the blue curve is the mean field $\langle E\rangle$ and the band is $\pm\Delta E$. Bottom left: the probability of each field value (at the antinode) over two periods, time running to the right. **Choose the state**: in a number state $|n\rangle$ the stripes are horizontal and the mean is zero at all times, however many photons there are; the superposition $(|0\rangle+|1\rangle)/\sqrt2$ already has a sloshing mean; a coherent state oscillates like a classical wave with vacuum-sized noise. Bottom right: the photon-number probabilities drawn on the energy ladder $(n+\tfrac12)\hbar\omega$.`,
      deps: ['qm-4.3', 'em-11.18'],
      see: ['qm-4.7', 'qm-4.13'],
      refs: ['Sakurai ch. 7'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Photon' },
      tags: ['photons', 'field quantization', 'vacuum fluctuations'],
      viz(v) {
        const NH = 40, NXQ = 241, XQ = Float64Array.from({ length: NXQ }, (_, i) => -7 + (14 * i) / (NXQ - 1)), dXQ = XQ[1] - XQ[0], phiQ = hermiteFns(XQ, NH), NT = 200, TH = 4 * Math.PI, SPD = 1.6, PER = TH / SPD;
        let nF = null, aS = null;
        const kind = v.select('state of the mode', [{ value: 'vac', label: 'vacuum $|0\\rangle$' }, { value: 'fock', label: 'number $|n\\rangle$' }, { value: 'sup', label: '$(|0\\rangle+|1\\rangle)/\\sqrt2$' }, { value: 'coh', label: 'coherent $|\\alpha\\rangle$' }], 'fock', { onChange: () => { nF.el.hidden = kind.value !== 'fock'; aS.el.hidden = kind.value !== 'coh'; } });
        nF = v.slider('photon number $n$', 1, 6, 2, { int: true });
        aS = v.slider('$\\alpha$', 0, 2.5, 1.5, { step: 0.05 }); aS.el.hidden = true;
        const sA = v.stage({ x: [-0.08, 1.08], y: [-4, 4], height: 220, axes: false, full: true, title: 'the field in the cavity: possible outcomes now, mean and spread' });
        const sH = v.stage({ x: [0, TH], y: [-5, 5], height: 250, axes: 'box', gutter: true, weight: 1.4, xlabel: 'ωt', ylabel: 'E / 𝓔₀', xticks: [[0, '0'], [Math.PI, 'π'], [TAU, '2π'], [3 * Math.PI, '3π'], [4 * Math.PI, '4π']], title: 'distribution of the field at the antinode over time' });
        const sN = v.stage({ x: [0, 1], y: [0, 8], height: 250, axes: 'box', gutter: true, weight: 1, xlabel: 'probability', ylabel: 'E / ħω', title: 'photon numbers on the ladder $(n+\\frac12)\\hbar\\omega$' });
        const coeffs = () => {
          const re = new Float64Array(NH), im = new Float64Array(NH);
          if (kind.value === 'vac') re[0] = 1;
          else if (kind.value === 'fock') re[nF.value] = 1;
          else if (kind.value === 'sup') { re[0] = Math.SQRT1_2; re[1] = Math.SQRT1_2; }
          else { re[0] = Math.exp(-0.5 * aS.value ** 2); for (let n = 0; n < NH - 1; n++) re[n + 1] = (re[n] * aS.value) / Math.sqrt(n + 1); }
          return { re, im };
        };
        // quadrature distribution at phase θ: |Σ c_n e^{−inθ} ψ_n(X)|²; field E = √2 X (units 𝓔₀, at the antinode)
        const distAt = (c, th) => {
          const p = new Float64Array(NXQ), pr = new Float64Array(NXQ), pi = new Float64Array(NXQ);
          for (let n = 0; n < NH; n++) { if (!c.re[n] && !c.im[n]) continue; const cr = c.re[n] * Math.cos(n * th) + c.im[n] * Math.sin(n * th), ci = c.im[n] * Math.cos(n * th) - c.re[n] * Math.sin(n * th), f = phiQ[n]; for (let i = 0; i < NXQ; i++) { pr[i] += cr * f[i]; pi[i] += ci * f[i]; } }
          for (let i = 0; i < NXQ; i++) p[i] = pr[i] * pr[i] + pi[i] * pi[i];
          return p;
        };
        let D = null;
        const data = () => {
          const key = `${kind.value}|${nF.value}|${aS.value}`; if (D && D.key === key) return D;
          const c = coeffs(), tab = [], mean = [];
          let pmax = 0;
          for (let r = 0; r < NT; r++) { const p = distAt(c, (TH * r) / (NT - 1)); tab.push(p); let m = 0; for (let i = 0; i < NXQ; i++) { m += p[i] * XQ[i]; pmax = Math.max(pmax, p[i]); } mean.push([(TH * r) / (NT - 1), Math.SQRT2 * m * dXQ]); }
          const P = Array.from(c.re, (q, n) => q * q + c.im[n] ** 2);
          let nbar = 0; P.forEach((q, n) => { nbar += n * q; });
          const Emax = Math.max(...mean.map((m) => Math.abs(m[1])));
          let ext = 0; for (const p of tab) for (let i = 0; i < NXQ; i++) if (p[i] > 2e-3 * pmax) ext = Math.max(ext, Math.abs(XQ[i]) * Math.SQRT2);
          return (D = { key, c, tab, mean, pmax, P, nbar, Emax, ext });
        };
        let st = null;
        v.animate((t) => {
          const D = data(), th = (t * SPD) % TH, p = distAt(D.c, th);
          let m = 0, m2 = 0; for (let i = 0; i < NXQ; i++) { m += p[i] * XQ[i]; m2 += p[i] * XQ[i] * XQ[i]; } m *= dXQ; m2 *= dXQ;
          const Em = Math.SQRT2 * m, dE = Math.SQRT2 * Math.sqrt(Math.max(0, m2 - m * m));
          const ylim = Math.max(3.2, D.ext * 1.06);
          // cavity
          sA.setView([-0.08, 1.08], [-ylim, ylim]);
          for (const X of [-0.04, 1]) sA.rect(X, -ylim * 0.95, X + 0.04, ylim * 0.95, { fill: 'muted', fillAlpha: 0.4, hatch: 'muted', hatchAlpha: 0.45, stroke: false });
          sA.hline(0, { color: 'grid' });
          const kz = 3 * Math.PI, smp = v.M.gridSampler(XQ, p);
          for (let k = 0; k < 21; k++) { const E = Math.SQRT2 * smp((k + 0.5) / 21); sA.fn((z) => E * Math.sin(kz * z), { color: 'gold', width: 1, alpha: 0.45, domain: [0, 1], n: 120 }); }
          sA.between((z) => (Em + dE) * Math.sin(kz * z), (z) => (Em - dE) * Math.sin(kz * z), 0, 1, { fill: 'accent', fillAlpha: 0.16 });
          sA.fn((z) => Em * Math.sin(kz * z), { color: 'accent', width: 3, domain: [0, 1], n: 200 });
          sA.corner(`⟨E⟩ = ${fz(v, Em, 3)} 𝓔₀,  ΔE = ${v.fix(dE, 3)} 𝓔₀  (antinode)`, 'tl', { color: 'ink', weight: 600, plate: true });
          // history heat map
          sH.setView([0, TH], [-ylim, ylim]);
          const CA = v.rgb('accent'), BG = v.rgb('panel');
          sH.raster((X, Y) => {
            const r = Math.round((X / TH) * (NT - 1)), i = Math.round(((Y / Math.SQRT2 + 7) / 14) * (NXQ - 1)); if (r < 0 || r >= NT || i < 0 || i >= NXQ) return null;
            const q = Math.min(1, Math.sqrt(D.tab[r][i] / D.pmax));
            return [BG[0] + (CA[0] - BG[0]) * q, BG[1] + (CA[1] - BG[1]) * q, BG[2] + (CA[2] - BG[2]) * q];
          }, { res: 2, key: D.key + '|' + ylim });
          sH.axes();
          sH.path(D.mean, { color: 'green', width: 1.8, dash: [6, 4] });
          sH.vline(th, { color: 'gold', width: 1.6 });
          // ladder
          const top = Math.max(7.5, D.nbar + 3 * Math.sqrt(D.nbar + 0.5) + 1.5); sN.setView([0, 1.05], [0, top]);
          let H = 0;
          for (let n = 0; n + 0.5 < top; n++) {
            const E = n + 0.5; H += D.P[n] * E;
            sN.line(0, E, 1.05, E, { color: 'muted', width: 0.8, alpha: 0.5 });
            if (D.P[n] > 1e-4) sN.rect(0, E - 0.28, D.P[n], E + 0.28, { fill: 'accent', fillAlpha: 0.75, stroke: false });
            if (top < 12 || n % 2 === 0) sN.text(`${n}`, 1.04, E, { size: 9.5, color: 'muted', align: 'right', baseline: 'middle' });
          }
          sN.hline(D.P.reduce((s, q, n) => s + q * (n + 0.5), 0), { color: 'orange', width: 1.6, dash: [5, 4] });
          st = { Em, dE, nbar: D.nbar, H: D.P.reduce((s, q, n) => s + q * (n + 0.5), 0), th };
        }, { period: PER, still: PER * 0.18 });
        v.legend([['gold', 'possible field outcomes (quantiles)'], ['accent', 'mean field ⟨E⟩ ± ΔE'], ['green', '⟨E⟩(t)', { dash: true }], ['orange', 'mean energy ⟨H⟩', { dash: true }]]);
        v.readout(() => st && `photons $\\langle n\\rangle = ${v.fix(st.nbar, 3)}$, energy $\\langle H\\rangle = ${v.fix(st.H, 3)}\\,\\hbar\\omega$ · at the antinode now $\\langle E\\rangle = ${fz(v, st.Em, 3)}\\,\\mathcal E_0$, $\\Delta E = ${v.fix(st.dE, 3)}\\,\\mathcal E_0$` + (kind.value === 'vac' || kind.value === 'fock' ? ` — zero mean at every instant, but $\\Delta E^2 = ${v.fix(st.dE * st.dE, 3)} = 2n+1$` : kind.value === 'coh' ? ` — the mean oscillates with amplitude $2|\\alpha| = ${v.fix(2 * aS.value, 2)}$ and the noise stays at the vacuum level $\\Delta E = 1$` : ' — a definite phase needs neighbouring photon numbers') + '.');
      },
    },
    // ------------------------------------------------------------------ 4.13
    {
      num: '4.13',
      kind: 'Phenomenon',
      name: 'Casimir effect',
      credit: 'Casimir, 1948',
      statement: String.raw`Two parallel, uncharged, perfectly conducting plates a distance $d$ apart in vacuum attract each other with pressure
$$\frac FA=-\frac{\pi^2\hbar c}{240\,d^4},$$
corresponding to an interaction energy $E/A=-\pi^2\hbar c/720\,d^3$. The force comes from the zero-point energies $\tfrac12\hbar\omega$ of the field modes (4.4, 4.12): fewer modes fit between the plates than in the same volume of free space, and the difference of the two (each infinite) sums is finite and independent of how high frequencies are cut off. For a massless scalar field on a line between two points ($1$D) the same reasoning gives $E=-\pi\hbar c/24d$.`,
      scope: String.raw`Ideal conductors at zero temperature and $d$ well above the plasma wavelength of the metal; real metals, finite temperature and surface roughness modify it. Measured with a sphere and a plate (Lamoreaux, 1997) and with parallel plates (Bressi et al., 2002) at micrometre separations.`,
      idea: String.raw`Between the plates the wave number normal to them is quantized, $k_z=n\pi/d$, while outside it is continuous. With a smooth cutoff $e^{-\omega/\Lambda}$ (real mirrors become transparent at high frequency) the sum over $n$ and the corresponding integral both grow like $\Lambda^4$, but by the Euler–Maclaurin formula their difference is $-\tfrac1{12}F'(0)+\tfrac1{720}F'''(0)-\dots$ in terms of the mode-energy function $F$; for the plates only the $F'''$ term survives and gives $-\pi^2/720d^3$ (for the line, $-F'(0)/12=-\pi/24d$). The cutoff drops out as $\Lambda\to\infty$: the force is a property of the low-lying modes that the plates rearrange.`,
      caption: String.raw`Top: **drag the right mirror**. Between the mirrors only standing waves with $d=n\lambda/2$ fit (coloured); outside, every wavelength is allowed (grey). Bottom left: the number of allowed normal wave numbers $k_z$ up to $k$ — a staircase between the plates against the straight line $kd/\pi$ of free space; the shaded gap (half a mode on average) is what the plates remove. Bottom middle: the regulated energy difference, computed by summing $\tfrac12\hbar\omega\,e^{-\omega/\Lambda}$ over the actual modes and subtracting the free-space integral, divided by the exact $-\pi^2\hbar c/720d^3$ (or $-\pi\hbar c/24d$). It tends to 1 as the cutoff $\Lambda d$ grows. **Change the cutoff** to see it. Bottom right: the resulting pressure on log–log axes against $1/d^4$, in pascals for real plates.`,
      deps: ['qm-4.12', 'qm-4.4'],
      see: ['qm-4.11'],
      refs: ['Sakurai ch. 7'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Casimir_effect' },
      tags: ['Casimir effect', 'vacuum energy', 'zero-point energy'],
      viz(v) {
        const M = v.M, HC = M.CONST.hbar * M.CONST.c; // J·m
        const geo = v.select('field', [{ value: '3d', label: 'EM field, parallel plates' }, { value: '1d', label: 'scalar field on a line (1D)' }], '3d');
        const Ls = v.slider('cutoff $\\Lambda d$ (in units of $c/d$)', 2, 100, 20, { log: true });
        const sA = v.stage({ x: [-0.9, 3.6], y: [-1.3, 1.3], height: 200, axes: false, full: true, title: 'mirrors $d$ micrometres apart' });
        const sM = v.stage({ x: [0, 8], y: [0, 8], height: 240, axes: 'box', gutter: true, weight: 1, xlabel: 'k d / π', ylabel: 'modes', title: 'allowed $k_z$ below $k$: plates vs free space' });
        const sR = v.stage({ x: [1.5, 100], y: [0, 1.6], height: 240, axes: 'box', gutter: true, xlog: true, weight: 1, xlabel: 'Λd', title: 'regulated $\\Delta E$ / exact value' });
        const sP = v.stage({ x: [0.1, 10], y: [1e-8, 1e2], height: 240, axes: 'box', gutter: true, xlog: true, ylog: true, weight: 1, xlabel: 'd (µm)', title: 'pressure (Pa) against separation' });
        const hD = sA.handle(1.6, 0, { color: 'gold', r: 8, label: 'd', labelPos: 'n', constrain: (X) => [Math.min(3, Math.max(0.3, X)), 0] });
        /** Regulated energy difference (ħ = c = 1, length unit d): Σ over modes minus the free-space integral. */
        const dE = (g, d, Lam) => {
          if (g === '1d') { // ½Σ_{n≥1} ω_n e^{−ω_n/Λ} − ½(d/π)∫ω e^{−ω/Λ}dω,  ω_n = nπ/d
            const nmax = Math.ceil((45 * Lam * d) / Math.PI) + 10; let s = 0, c = 0;
            for (let n = nmax; n >= 1; n--) { const w = (n * Math.PI) / d, y = 0.5 * w * Math.exp(-w / Lam) - c, tt = s + y; c = tt - s - y; s = tt; }
            return s - 0.5 * (d / Math.PI) * Lam * Lam;
          }
          // per unit area: Σ'_n G(nπ/d) − (d/π)∫G,  G(κ) = (1/2π)∫_κ^∞ ω² e^{−ω/Λ} dω (two polarizations, n = 0 halved)
          const G = (k) => (Math.exp(-k / Lam) * (Lam * k * k + 2 * Lam * Lam * k + 2 * Lam ** 3)) / TAU;
          const nmax = Math.ceil((50 * Lam * d) / Math.PI) + 10; let s = 0, c = 0;
          for (let n = nmax; n >= 0; n--) { const y = (n ? 1 : 0.5) * G((n * Math.PI) / d) - c, tt = s + y; c = tt - s - y; s = tt; }
          return s - (3 * d * Lam ** 4) / (Math.PI * Math.PI);
        };
        const exactE = (g, d) => (g === '1d' ? -Math.PI / (24 * d) : -(Math.PI ** 2) / (720 * d ** 3));
        const exactP = (g, d) => (g === '1d' ? Math.PI / (24 * d * d) : (Math.PI ** 2) / (240 * d ** 4)); // magnitude of the attraction
        let C = {};
        const curves = (g) => {
          if (C[g]) return C[g];
          const ratio = []; for (let k = 0; k <= 50; k++) { const L = 1.5 * (100 / 1.5) ** (k / 50); ratio.push([L, dE(g, 1, L) / exactE(g, 1)]); }
          // pressure from a central difference of the regulated energy at fixed cutoff Λ = 30/d (units µm)
          const pr = []; for (let k = 0; k <= 16; k++) { const d = 0.1 * 100 ** (k / 16), L = 30 / d, h = 0.01 * d; pr.push([d, (dE(g, d + h, L) - dE(g, d - h, L)) / (2 * h)]); } // dE/dd > 0: the energy rises with separation, so the plates attract
          return (C[g] = { ratio, pr });
        };
        const toSI = (g, p) => p * HC * (g === '1d' ? 1e12 : 1e24); // 1/µm² → N (1D), 1/µm⁴ → Pa
        let st = null;
        v.render(() => {
          const g = geo.value, d = hD.x, L = Ls.value, Cv = curves(g);
          // mirrors and modes
          sA.rect(-0.14, -1.2, 0, 1.2, { fill: 'muted', fillAlpha: 0.45, hatch: 'muted', hatchAlpha: 0.5, stroke: false });
          sA.rect(d, -1.2, d + 0.14, 1.2, { fill: 'muted', fillAlpha: 0.45, hatch: 'muted', hatchAlpha: 0.5, stroke: false });
          for (let n = 1; n <= 5; n++) sA.fn((z) => (0.9 - 0.12 * n) * Math.sin((n * Math.PI * z) / d), { color: FAMILY[(n - 1) % FAMILY.length], width: 1.6, alpha: 0.85, domain: [0, d], n: 200 });
          for (let k = 0; k < 9; k++) { const lam = 0.25 + 0.17 * k, a = 0.25 + 0.08 * (k % 4), ph = k * 1.3; sA.fn((z) => a * Math.sin((TAU * z) / lam + ph), { color: 'muted', width: 1, alpha: 0.4, domain: [-0.9, -0.16], n: 120 }); sA.fn((z) => a * Math.sin((TAU * z) / lam + ph), { color: 'muted', width: 1, alpha: 0.4, domain: [d + 0.16, 3.6], n: 120 }); }
          const fl = Math.min(0.55, 0.08 * (1.6 / d) ** (g === '1d' ? 2 : 4));
          sA.arrow(d + 0.2 + fl, 1.12, d + 0.2, 1.12, { color: 'red', width: 2.2, head: 7 }); sA.arrow(-0.2 - fl, 1.12, -0.2, 1.12, { color: 'red', width: 2.2, head: 7 });
          sA.text(`d = ${v.fix(d, 2)} µm`, d / 2, -1.12, { size: 12, color: 'ink', align: 'center', weight: 600, plate: true });
          // counting the allowed normal wave numbers k_z = nπ/d below k, against free space (kd/π of them)
          const stair = []; for (let n = 0; n <= 8; n++) { stair.push([n, n - 1 < 0 ? 0 : n - 1]); stair.push([n, n]); } stair.push([8, 8]);
          sM.between((u) => u, (u) => Math.floor(u), 0, 8, { fill: 'red', fillAlpha: 0.14 });
          sM.line(0, 0, 8, 8, { color: 'muted', width: 1.6, dash: [6, 4] });
          sM.path(stair.slice(1), { color: 'accent', width: 2.2 });
          sM.text('free space: kd/π', 5.6, 6.3, { size: 11, color: 'muted', align: 'right', plate: true });
          sM.text('between plates', 4.4, 2.6, { size: 11, color: 'accent', align: 'left', plate: true });
          // ratio vs cutoff
          sR.hline(1, { color: 'green', width: 1.4, dash: [5, 4] });
          sR.path(Cv.ratio, { color: 'accent', width: 2.2 });
          const rnow = dE(g, 1, L) / exactE(g, 1); sR.dot(L, rnow, { r: 5.5, color: 'gold' });
          // pressure
          if (g === '1d') sP.setView([0.1, 10], [1e-17, 1e-12]); else sP.setView([0.1, 10], [1e-12, 1e2]);
          sP.fn((q) => toSI(g, exactP(g, q)), { color: 'red', width: 2 });
          sP.dots(Cv.pr.map(([q, p]) => [q, toSI(g, p)]), { r: 4, color: 'accent' });
          sP.vline(d, { color: 'gold', width: 1.3, dash: [4, 3] }); sP.dot(d, toSI(g, exactP(g, d)), { r: 6, color: 'gold' });
          sP.setLabels('d (µm)', g === '1d' ? 'force (N)' : 'pressure (Pa)');
          let pdev = 0; for (const [q, p] of Cv.pr) pdev = Math.max(pdev, Math.abs(p / exactP(g, q) - 1));
          st = { g, d, L, rnow, P: toSI(g, exactP(g, d)), pdev };
        });
        v.legend([['accent', 'computed from the mode sums'], ['red', 'Casimir formula'], ['green', 'exact ratio 1', { dash: true }], ['red', 'missing modes', { area: true }]]);
        v.readout(() => st && `with cutoff $\\Lambda d = ${v.fix(st.L, 1)}$ the regulated $\\Delta E$ is **${v.fix(st.rnow, 5)}** × the exact ${st.g === '1d' ? '$-\\pi\\hbar c/24d$' : '$-\\pi^2\\hbar c/720d^3$'} (both sums grow like $\\Lambda^{${st.g === '1d' ? 2 : 4}}$; their difference does not) · pressures from finite differences of the regulated energy match the formula to ${v.fix(100 * st.pdev, 3)}% · at $d = ${v.fix(st.d, 2)}$ µm: ${st.g === '1d' ? `force $\\pi\\hbar c/24d^2 = ${v.sci(st.P, 3)}$ N` : `$\\pi^2\\hbar c/240d^4 = ${v.sci(st.P, 3)}$ Pa, attractive`}.`);
      },
    },
  ],
};
