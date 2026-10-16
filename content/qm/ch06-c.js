// Quantum Mechanics — Chapter 6, part c: items 6.9–6.12 (Dirac quantization, quantum bouncer, imaginary-time projection, Wigner function)
// Units: ħ = m = 1 unless an item says otherwise (the bouncer uses ħ²/2m = mg = 1).
import {
  TAU, phaseLUT, drawPsi, drawReal, phaseWheel, fz, pgrid, kOf, productStepper, kineticSum, interp, airy, airyZeros, toMomentum, hermiteAt, wigner, wignerAt, paintPhase, packet,
} from './ch06.shared.js';

// ------------------------------------------------------------------ shared by 6.10: Airy eigenfunctions of the bouncer
let BT = null;
/** The first 50 eigenfunctions Ai(z + a_n) of −ψ'' + zψ = Eψ, ψ(0) = 0, on z ∈ [0, 40] (801 points), numerically normalised; E_n = −a_n. */
function bouncer() {
  if (BT) return BT;
  const N = 50, a = airyZeros(N), nz = 801, Z = 40, dz = Z / (nz - 1), z = Float64Array.from({ length: nz }, (_, i) => i * dz), psi = [];
  for (let n = 0; n < N; n++) {
    const f = Float64Array.from(z, (Z0) => airy(Z0 + a[n])); let s = 0; for (let i = 0; i < nz; i++) s += f[i] * f[i];
    const c = 1 / Math.sqrt(s * dz); for (let i = 0; i < nz; i++) f[i] *= c; psi.push(f);
  }
  return (BT = { N, a, z, dz, nz, psi, E: a.map((x) => -x) });
}

export default {
  collection: 'qm',
  chapter: 6,
  items: [
    // ------------------------------------------------------------------ 6.9
    {
      num: '6.9',
      kind: 'Theorem',
      name: 'Dirac quantization of magnetic charge',
      statement: String.raw`Suppose a magnetic monopole of strength $g$ (total magnetic flux $g$ through any enclosing surface, $\mathbf B=g\hat{\mathbf r}/4\pi r^2$) exists, and charged quantum particles of charge $e$ move in its field. A vector potential for $\mathbf B$ cannot be regular on the whole sphere: it must have a line singularity — a **Dirac string** carrying the flux $g$ into the monopole — or be defined on two overlapping patches related by the gauge transformation $\psi_N=e^{i e g\varphi/2\pi\hbar}\psi_S$ ($\varphi$ the azimuth). The string is unobservable (its direction a pure gauge, qm-6.6) and the wave function single valued if and only if the Aharonov–Bohm phase of a loop around it is trivial:
$$e^{\,i e g/\hbar}=1\iff e\,g=2\pi\hbar\,n,\quad n\in\mathbb Z,\qquad\text{i.e. } g=n\,\Phi_0,\ \Phi_0=\frac he .$$
(In Gaussian units this reads $eg=\tfrac12 n\hbar c$; the smallest charge is $g_D=\hbar c/2e\approx68.5\,e$ in those units.) One monopole anywhere in the universe would therefore force every electric charge to be a multiple of $2\pi\hbar/g$.`,
      idea: String.raw`Away from the string the potential $\mathbf A_N=\frac{g(1-\cos\theta)}{4\pi r\sin\theta}\hat{\boldsymbol\varphi}$ gives the monopole field and is singular on the negative $z$ axis, where it looks like a solenoid carrying flux $g$ (6.7: Stokes). That is physically invisible only if the Aharonov–Bohm phase $eg/\hbar$ of a loop around it is a multiple of $2\pi$. Equivalently, take the string to the south axis in one patch and to the north axis in the other: the two potentials differ by $\nabla(g\varphi/2\pi)$, so the wave functions differ by $e^{ieg\varphi/2\pi\hbar}$, which must wind an integer number of times as $\varphi$ goes round the equator. Dirac (1931) drew this conclusion for electric charge quantization; the integer $n$ is the Chern number of the resulting line bundle over the sphere.`,
      caption: String.raw`Drag the magnetic charge $q=g/\Phi_0$ (in units of the flux quantum). **Left:** the monopole’s radial field and its Dirac string (**drag the handle** to move the string anywhere on the sphere). The string is drawn in green and dashed when the phase $e^{2\pi iq}$ around it is $1$ — then it cannot be seen — and in red when it is not. **Middle:** the transition function $e^{iq\varphi}$ between the two gauge patches as $\varphi$ goes once round the equator (the spiral’s radius grows only so you can count the turns): it closes only for integer $q$; otherwise the red arc is the mismatch. **Right:** an electron interference pattern for beams passing on either side of the string is shifted by $q$ fringes — invisible exactly when $q$ is an integer.`,
      deps: ['qm-6.7', 'em-10.18'],
      refs: ['Sakurai ch. 2'],
      credit: 'Dirac, 1931',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Magnetic_monopole#Dirac_quantization' },
      tags: ['magnetic monopole', 'charge quantization', 'Dirac string'],
      viz(v) {
        const M = v.M, aem = M.CONST.alpha;
        const qS = v.slider('magnetic charge $q=g/\\Phi_0$', 0, 4, 0.6, { step: 0.05 });
        const R = 1.45;
        const A = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, axes: false, height: 300, title: 'monopole, its field and a Dirac string' });
        const B = v.stage({ x: [-1.9, 1.9], y: [-1.9, 1.9], equal: true, axes: false, height: 300, title: 'transition function $e^{iq\\varphi}$ round the equator' });
        const C = v.stage({ x: [-1.5, 1.5], y: [0, 2.35], height: 300, axes: 'box', gutter: true, xlabel: 'position across the screen (fringes)', ylabel: 'intensity', title: 'interference around the string' });
        const hS = A.handle(-0.45 * R, -0.89 * R, { color: 'ink', r: 6, label: 'string', labelPos: 'se', constrain: (x, y) => { const r = Math.hypot(x, y) || 1; return [(R * x) / r, (R * y) / r]; } });
        let st = null;
        v.render(() => {
          const q = qS.value, frac = q - Math.floor(q), integer = Math.min(frac, 1 - frac) < 0.012, scol = integer ? 'green' : 'red';
          A.circle(0, 0, R, { color: 'muted', width: 1.4, fill: 'accent', fillAlpha: 0.05 });
          for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU; A.arrow(0.25 * Math.cos(a), 0.25 * Math.sin(a), 0.95 * R * Math.cos(a) * 0.92, 0.95 * R * Math.sin(a) * 0.92, { color: 'accent', width: 1.2, alpha: 0.55 }); }
          A.dot(0, 0, { r: 7, color: 'red', label: 'g', tex: true, labelPos: 'ne' });
          A.line(0, 0, hS.x, hS.y, { color: scol, width: integer ? 2 : 4, dash: integer ? [4, 4] : null, alpha: integer ? 0.7 : 1 });
          const ang = Math.atan2(hS.y, hS.x), lx = 0.62 * R * Math.cos(ang), ly = 0.62 * R * Math.sin(ang);
          A.circle(lx, ly, 0.17, { color: 'purple', width: 2, fill: 'purple', fillAlpha: 0.12 });
          A.tex(`\\text{loop round the string: }e^{2\\pi i q}=${integer ? '1' : `e^{i\\,${v.fix(TAU * q, 2)}}`}`, -1.95, 1.85, { color: 'purple', size: 12, align: 'left' });
          A.text(integer ? 'string invisible' : 'string would be seen', 0, -1.85, { align: 'center', color: scol, size: 13, weight: 600 });
          // transition function
          B.circle(0, 0, 1, { color: 'faint', width: 1 });
          const pts = []; for (let k = 0; k <= 400; k++) { const u = (k / 400) * TAU, r = 1 + 0.12 * (u / TAU) * Math.max(1, Math.ceil(q)); pts.push([r * Math.cos(q * u), r * Math.sin(q * u)]); }
          B.path(pts, { color: 'accent', width: 2.2 });
          const rEnd = 1 + 0.12 * Math.max(1, Math.ceil(q));
          B.dot(1, 0, { r: 6, color: 'green', label: 'φ=0', labelPos: 's' });
          B.dot(pts[400][0], pts[400][1], { r: 6, color: scol, label: 'φ=2π', labelPos: 'sw' });
          if (!integer && q > 0.01) B.curve((u) => [(rEnd + 0.3) * Math.cos(u), (rEnd + 0.3) * Math.sin(u)], 0, TAU * frac, { color: 'red', width: 3.5 });
          B.text(`winds ${v.fix(q, 2)} times`, 0, 0, { align: 'center', color: 'muted', size: 13 });
          // fringes
          C.fn((y) => 1 + Math.cos(TAU * y), { color: 'muted', width: 1.6, dash: [5, 4], n: 400 });
          C.fn((y) => 1 + Math.cos(TAU * (y - q)), { color: scol === 'red' ? 'accent' : 'green', width: 2.6, n: 400 });
          C.vline(0, { color: 'faint' }); C.vline(q % 1 > 0.5 ? q - Math.round(q) : q - Math.floor(q), { color: 'gold', dash: [3, 3] });
          st = { q, integer };
        });
        v.legend([['muted', 'no monopole', { dash: true }], ['accent', 'with the string']]);
        v.readout(() => st && `$g/\\Phi_0=${v.fix(st.q, 2)}$: the phase around the string is $eg/\\hbar=2\\pi q=${v.fix(TAU * st.q, 3)}$ rad, so the fringes move by ${v.fix(st.q, 2)} spacings (mod 1: ${v.fix(((st.q % 1) + 1) % 1, 2)}) — ${st.integer ? '**trivial: the string is gauge, the monopole is allowed**' : '**visible: this $g$ is forbidden for charge $e$**'}. Allowed values: $g=n\\,h/e$; in Gaussian units $eg=n\\hbar c/2$, smallest $g_D=\\hbar c/2e=e/2\\alpha\\approx${v.fix(1 / (2 * aem), 1)}\\,e$ (SI: $g_{\\min}=h/e=4.136\\times10^{-15}$ Wb).`);
      },
    },
    // ------------------------------------------------------------------ 6.10
    {
      num: '6.10',
      kind: 'Model',
      name: 'Quantum bouncer: the Airy function',
      statement: String.raw`A particle of mass $m$ in the uniform gravitational field $V=mgz$ above a perfectly reflecting floor at $z=0$ ($V=\infty$ for $z<0$) has the discrete spectrum and eigenfunctions
$$E_n=-a_n\,\varepsilon,\qquad \psi_n(z)=\frac{\mathrm{Ai}\!\big(z/\ell+a_n\big)}{\sqrt{\ell}\,\lvert\mathrm{Ai}'(a_n)\rvert},\qquad \ell=\Big(\frac{\hbar^2}{2m^2g}\Big)^{1/3},\ \ \varepsilon=mg\ell,\quad n=1,2,\dots$$
where $a_n<0$ are the zeros of the Airy function ($a_1\approx-2.338$, $a_2\approx-4.088$, $a_3\approx-5.521$) and for large $n$ $a_n\approx-\big[\tfrac{3\pi}{2}(n-\tfrac14)\big]^{2/3}$. In a state with many levels excited the packet bounces with the classical period $2\sqrt{2h/g}$, spreads and collapses, and — because the energies are not equally spaced — revives only at a much later time.`,
      idea: String.raw`The Schrödinger equation $-\tfrac{\hbar^2}{2m}\psi''+mgz\,\psi=E\psi$ becomes $\psi''=(z/\ell-E/\varepsilon)\psi/\ell^2$, i.e. Airy’s equation $y''=xy$ in the variable $x=z/\ell-E/\varepsilon$. The solution that decays for large $z$ is $\mathrm{Ai}$ (the other, $\mathrm{Bi}$, blows up); the floor demands $\mathrm{Ai}(-E/\varepsilon)=0$, which quantises $E$ at the zeros. The spacing $E_{n+1}-E_n\propto n^{-1/3}$ shrinks slowly, so the superposition dephases and rephases at the (long) revival time instead of exactly repeating (compare the oscillator, qm-4.3, with exactly equal spacing and strictly periodic motion); by Ehrenfest’s theorem (qm-2.9) the centre follows the classical bounce for the first periods.`,
      caption: String.raw`Units $\hbar^2/2m=mg=1$ ($\ell=\varepsilon=1$). The top panel is the potential $V=z$ with a packet released at rest from height $h$, evolved **exactly** as $\sum_nc_ne^{-iE_nt}\psi_n$ (50 Airy states, $c_n=\langle\psi_n|\psi_0\rangle$); the dot is the classical bouncing ball. The bottom panel is the survival probability $|\langle\psi_0|\psi(t)\rangle|^2$: spikes at every classical period $T_c=2\sqrt h$, shrinking as the packet spreads, and the full revival much later. Switch to *eigenstate* to see $\mathrm{Ai}(z+a_n)$ with its $n-1$ nodes, and compare the zeros with the table of $\mathrm{Ai}$. For neutrons ($\ell=5.9\,\mu$m, $E_1=1.41$ peV) the states were seen in 2002.`,
      deps: ['qm-3.1', 'qm-2.9'],
      refs: ['Sakurai ch. 2'],
      credit: 'Gea-Banacloche, 1999; neutron states: Nesvizhevsky et al., 2002',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Airy_function' },
      tags: ['Airy function', 'bouncing ball', 'revival'],
      viz(v) {
        const M = v.M, BQ = bouncer(), N = BQ.N, nz = BQ.nz, z = BQ.z, dz = BQ.dz, PER = 24;
        const mode = v.select('show', [{ value: 'packet', label: 'released packet' }, { value: 'eig', label: 'eigenstate' }], 'packet');
        const hS = v.slider('release height $h$', 6, 20, 12, { step: 0.5, onChange: () => { key = ''; } });
        const sS = v.slider('packet width $\\sigma$', 0.5, 1.5, 0.8, { step: 0.05, onChange: () => { key = ''; } });
        const win = v.select('time window', [{ value: 'b', label: 'first bounces' }, { value: 'r', label: 'to the revival' }], 'b');
        const nS = v.slider('eigenstate $n$', 1, 12, 3, { int: true });
        const S1 = v.stage({ x: [-1, 24], y: [0, 24], height: 270, axes: 'box', gutter: true, full: true, xlabel: 'z', ylabel: 'E', title: 'a packet bouncing on the floor in uniform gravity' });
        const S2 = v.stage({ x: [0, 5], y: [-0.05, 1.1], height: 220, axes: 'box', gutter: true, full: true, xlabel: '$t/T_c$', ylabel: '$|\\langle\\psi_0|\\psi(t)\\rangle|^2$', title: 'survival probability: bounce echoes and revival' });
        let key = '', c = null, Tc = 1, trev = 1, curve = null, tw = [0, 5], top = 24;
        function build() {
          const h = hS.value, s = sS.value; Tc = 2 * Math.sqrt(h);
          const f = new Float64Array(nz); let nrm = 0; for (let i = 0; i < nz; i++) { f[i] = Math.exp(-((z[i] - h) ** 2) / (4 * s * s)); nrm += f[i] * f[i]; } nrm = 1 / Math.sqrt(nrm * dz); for (let i = 0; i < nz; i++) f[i] *= nrm;
          c = new Float64Array(N); for (let n = 0; n < N; n++) { let a = 0; for (let i = 0; i < nz; i++) a += BQ.psi[n][i] * f[i]; c[n] = a * dz; }
          const surv = (t) => { let re = 0, im = 0; for (let n = 0; n < N; n++) { const w = c[n] * c[n], ph = -BQ.E[n] * t; re += w * Math.cos(ph); im += w * Math.sin(ph); } return re * re + im * im; };
          let best = 0, bt = 0; for (let t = 8 * Tc; t < 150 * Tc; t += Tc / 25) { const q = surv(t); if (q > best) { best = q; bt = t; } }
          trev = bt; tw = [0, 5];
          curve = { surv, trev, best };
          top = Math.max(24, h + 10);
        }
        let st = null;
        v.animate((t) => {
          const k = `${hS.value}|${sS.value}`; if (k !== key) { key = k; build(); }
          const col = phaseLUT(v), h = hS.value, f = t / PER;
          const W = win.value === 'b' ? 5 * Tc : 1.15 * trev, tt = f * W, tc = tt / Tc;
          S1.setView([-1, top], [0, top]);
          S1.line(0, 0, 0, top, { color: 'ink', width: 3 });
          S1.fn((x) => (x >= 0 ? x : NaN), { color: 'muted', width: 2, fill: 'muted', fillAlpha: 0.1, base: 0, n: 80 });
          S1.text('floor', 0.3, top - 1, { size: 11, color: 'muted' });
          const re = new Float64Array(nz), im = new Float64Array(nz);
          if (mode.value === 'packet') {
            for (let n = 0; n < N; n++) { const a = -BQ.E[n] * tt, cr = c[n] * Math.cos(a), ci = c[n] * Math.sin(a), p = BQ.psi[n]; for (let i = 0; i < nz; i++) { re[i] += cr * p[i]; im[i] += ci * p[i]; } }
            let mx = 0; for (let i = 0; i < nz; i++) mx = Math.max(mx, re[i] * re[i] + im[i] * im[i]);
            S1.hline(h, { color: 'muted', width: 1, dash: [4, 4] });
            drawPsi(S1, z, re, im, { col, mode: 'abs2', base: h, scale: 5 / Math.max(mx, 0.05), outline: 'ink' });
            const tau = ((tt / Tc + 0.5) % 1 + 1) % 1 - 0.5; // classical: z = h − t'², t' = tau·T_c measured from the top of the bounce
            const zcl = Math.max(0, h - (tau * Tc) ** 2);
            S1.dot(zcl, h, { r: 6, color: 'gold' });
          } else {
            const n = nS.value - 1, E = BQ.E[n];
            S1.hline(E, { color: 'muted', width: 1, dash: [4, 4] });
            drawReal(S1, z, BQ.psi[n], { col, base: E, scale: 4, alpha: 0.6 });
            S1.vline(E, { color: 'red', width: 1, dash: [3, 3] }); S1.text('turning point $z=E$', E, 0.8, { size: 11, color: 'red', align: 'center', dx: 0 });
            for (let m = 0; m < 6; m++) S1.hline(BQ.E[m], { color: 'faint', width: 1 });
            S1.text(`E = ${v.fix(E, 4)}`, 22.5, E, { align: 'right', dy: -8, size: 12 });
          }
          phaseWheel(S1, col, S1.W - 42, 60, 11);
          // survival curve
          S2.setView([0, W / Tc], [-0.05, 1.1]);
          const xs = []; const nn = 1400; for (let i = 0; i <= nn; i++) { const x = (i / nn) * (W / Tc); xs.push([x, curve.surv(x * Tc)]); }
          S2.path(xs, { color: 'accent', width: 1.6 });
          S2.vline(tc, { color: 'gold', width: 1.6, dash: [4, 3] });
          if (win.value === 'r') { S2.vline(trev / Tc, { color: 'green', width: 1, dash: [3, 4] }); S2.text(`revival ≈ ${v.fix(trev / Tc, 1)} T_c`, trev / Tc - 0.2, 1.0, { align: 'right', size: 11, color: 'green' }); }
          st = { tc, surv: curve.surv(tt), Tc, trev, sum: c.reduce((a, b) => a + b * b, 0) };
        }, { period: PER, still: PER * 0.28 });
        v.legend([['gold', 'classical ball', { dot: true }], ['accent', 'survival probability']]);
        v.readout(() => {
          const a = BQ.a, E = BQ.E, mn = M.CONST.mn, g0 = M.CONST.g0, hb = M.CONST.hbar, l = Math.cbrt((hb * hb) / (2 * mn * mn * g0)), eps = mn * g0 * l;
          return `Zeros of Ai: $a_1,a_2,a_3=${a.slice(0, 3).map((x) => v.fix(x, 4)).join(',\\ ')}$; asymptotic $a_{20}\\approx-[\\tfrac{3\\pi}2\\cdot19.75]^{2/3}=${v.fix(-Math.pow(1.5 * Math.PI * 19.75, 2 / 3), 3)}$ vs. $${v.fix(a[19], 3)}$. ` +
            (st ? `At $t=${v.fix(st.tc, 2)}\\,T_c$ ($T_c=2\\sqrt h=${v.fix(st.Tc, 2)}$): survival $${v.fix(st.surv, 3)}$, $\\sum|c_n|^2=${v.fix(st.sum, 5)}$; revival at $\\approx${v.fix(st.trev / st.Tc, 0)}\\,T_c$ (numerical). ` : '') +
            `Neutron: $\\ell=${v.fix(l * 1e6, 2)}\\,\\mu$m, $\\varepsilon=${v.fix((eps / M.CONST.e) * 1e12, 3)}$ peV, $E_1=${v.fix(((E[0] * eps) / M.CONST.e) * 1e12, 2)}$ peV.`;
        });
      },
    },
    // ------------------------------------------------------------------ 6.11
    {
      num: '6.11',
      kind: 'Method',
      name: 'Imaginary-time projection to the ground state',
      statement: String.raw`Let $H$ have a ground state $\phi_0$ with energy $E_0$ below the rest of the spectrum, and let $\psi$ be any state with $\langle\phi_0|\psi\rangle\neq0$. Evolving in **imaginary time** $t=-i\tau$ and renormalising,
$$\psi(\tau)=\frac{e^{-H\tau/\hbar}\psi}{\lVert e^{-H\tau/\hbar}\psi\rVert}=\frac{\sum_nc_ne^{-(E_n-E_0)\tau/\hbar}\phi_n}{\big\lVert\cdots\big\rVert}\;\longrightarrow\;\phi_0\quad(\tau\to\infty),$$
with $\lVert\psi(\tau)-\phi_0\rVert=O\big(e^{-(E_1-E_0)\tau/\hbar}\big)$ and $\langle H\rangle_\tau-E_0=O\big(e^{-2(E_1-E_0)\tau/\hbar}\big)$, where $E_1$ is the next level with $c_n\neq0$. If $\psi$ is orthogonal to $\phi_0$ (by symmetry, or by projecting it out at every step) the same procedure converges to the lowest remaining level.`,
      idea: String.raw`Expand $\psi=\sum c_n\phi_n$ (spectral theorem, qm-5.x). The evolution operator $e^{-iHt/\hbar}$ of 6.1 continued to $t=-i\tau$ becomes the Euclidean operator $e^{-H\tau/\hbar}$, which multiplies each component by a real decay $e^{-E_n\tau/\hbar}$; after dividing by the norm the components are weighted by $e^{-(E_n-E_0)\tau/\hbar}$, which kill the excited ones at a rate set by the gap. It is a power method for the operator $e^{-H\tau}$. Numerically the Trotter product (6.3) works unchanged with real factors $e^{-V\Delta\tau/2}e^{-T\Delta\tau}e^{-V\Delta\tau/2}$; the stationary state is slightly biased by the step ($O(\Delta\tau^2)$). Kosloff and Tal-Ezer (1986) used it as a “direct relaxation method”; the same idea is the engine of diffusion Monte Carlo.`,
      caption: String.raw`Choose a potential, a trial state, and let imaginary time run (play button or the animation). The top panel shows the (renormalised) state $\psi(\tau)$ relaxing onto the ground state (dashed green). The bottom-left panel is $\log_{10}\big(\langle H\rangle_\tau-E_{\rm final}\big)$: a straight line of slope $-2(E_1-E_0)\log_{10}e$ (dashed guide) until the time-step floor. **An even trial state** (try *symmetric*) cannot reach the odd first excited level, so its slope is set by the $E_2-E_0$ gap; **switch on “project out ground state”** to converge to the *first excited state* instead. The bottom-right bars are the weights $|c_n(\tau)|^2$ of the lowest eigenstates (exact eigenvectors of the same grid Hamiltonian).`,
      deps: ['qm-6.1', 'qm-3.2'],
      refs: ['Sakurai ch. 2'],
      credit: 'Kosloff & Tal-Ezer, 1986 (grid relaxation); Wick rotation: Wick, 1954',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Imaginary_time' },
      tags: ['imaginary time', 'ground state', 'power method'],
      viz(v) {
        const M = v.M, NG = 128, G = pgrid(14, NG), x = G.x, dx = G.dx, DT = 0.02;
        const reset = () => { key = ''; };
        const pot = v.select('potential', [{ value: 'dw', label: 'double well' }, { value: 'osc', label: 'oscillator' }, { value: 'quart', label: 'quartic $\\tfrac14x^4$' }], 'dw', { onChange: reset });
        const trial = v.select('trial state', [{ value: 'off', label: 'offset Gaussian' }, { value: 'sym', label: 'symmetric' }, { value: 'odd', label: 'antisymmetric' }], 'off', { onChange: reset });
        const defl = v.toggle('project out ground state', false, { onChange: reset });
        const Vf = (k) => (X) => (k === 'dw' ? 0.25 * (X * X - 2.2) ** 2 : k === 'osc' ? 0.5 * X * X : 0.25 * X ** 4);
        const specCache = {};
        function spectrum(k) {
          if (specCache[k]) return specCache[k];
          const V = Float64Array.from(x, Vf(k)), kk = Array.from({ length: NG }, (_, m) => kOf(m, NG, dx)), H = Array.from({ length: NG }, () => new Array(NG).fill(0));
          for (let j = 0; j < NG; j++) for (let l = j; l < NG; l++) { let s = 0; const d = (j - l) * dx; for (let m = 0; m < NG; m++) s += 0.5 * kk[m] * kk[m] * Math.cos(kk[m] * d); H[j][l] = H[l][j] = s / NG + (j === l ? V[j] : 0); }
          const E = M.eigSym(H), idx = E.values.map((e, i) => i).sort((a, b) => E.values[a] - E.values[b]), vecs = idx.slice(0, 8).map((i) => { const u = Float64Array.from({ length: NG }, (_, r) => E.vectors[r][i]); let s = 0; for (const a of u) s += a * a; const f = 1 / Math.sqrt(s * dx); for (let r = 0; r < NG; r++) u[r] *= f; return u; });
          return (specCache[k] = { V, E: idx.slice(0, 8).map((i) => E.values[i]), phi: vecs });
        }
        let key = '', hist = null;
        function build() {
          const sp = spectrum(pot.value), V = sp.V, deflate = defl.value, tg = deflate ? 1 : 0;
          const st0 = trial.value, re = new Float64Array(NG), im = new Float64Array(NG);
          for (let i = 0; i < NG; i++) re[i] = st0 === 'off' ? Math.exp(-((x[i] - 1.3) ** 2) / (2 * 0.6 ** 2)) : st0 === 'sym' ? Math.exp(-((x[i] - 1.4) ** 2) / 1.0) + Math.exp(-((x[i] + 1.4) ** 2) / 1.0) : x[i] * Math.exp(-(x[i] * x[i]) / 3.0);
          const nrm = (a, b) => { let s = 0; for (let i = 0; i < NG; i++) s += a[i] * a[i] + b[i] * b[i]; const f = 1 / Math.sqrt(s * dx); for (let i = 0; i < NG; i++) { a[i] *= f; b[i] *= f; } };
          const proj = (a) => { if (!deflate) return; let o = 0; for (let i = 0; i < NG; i++) o += sp.phi[0][i] * a[i]; o *= dx; for (let i = 0; i < NG; i++) a[i] -= o * sp.phi[0][i]; };
          proj(re); nrm(re, im);
          const w0 = sp.phi.map((p) => { let o = 0; for (let i = 0; i < NG; i++) o += p[i] * re[i]; return o * dx; });
          let nxt = tg + 1; while (nxt < 7 && w0[nxt] * w0[nxt] < 1e-10) nxt++;
          const gap = sp.E[nxt] - sp.E[tg], tmax = Math.max(5, Math.min(60, 10 / gap)), NS = Math.round(tmax / DT);
          const step = productStepper(M, V, dx, DT, 'strang', true), snaps = [], En = new Float64Array(NS + 1), W = [];
          const energy = () => { const T = kineticSum(M, re, im, dx); let U = 0; for (let i = 0; i < NG; i++) U += V[i] * (re[i] * re[i] + im[i] * im[i]); return T + U * dx; };
          for (let s = 0; s <= NS; s++) {
            if (s % 2 === 0) snaps.push(Float64Array.from(re));
            En[s] = energy();
            W.push(sp.phi.slice(0, 6).map((p) => { let o = 0; for (let i = 0; i < NG; i++) o += p[i] * re[i]; o *= dx; return o * o; }));
            if (s < NS) { step(re, im); proj(re); nrm(re, im); }
          }
          const Ef = En[NS], pts = []; for (let s = 0; s <= NS; s++) { const e = En[s] - Ef; if (e > 1e-12 && s * DT < 0.9 * tmax) pts.push([s * DT, Math.log10(e)]); }
          hist = { sp, tg, nxt, gap, tmax, NS, snaps, En, W, Ef, pts, V };
          key = `${pot.value}|${trial.value}|${defl.value}`;
        }
        const A = v.stage({ x: [-4.5, 4.5], y: [-1.0, 1.1], height: 240, axes: 'box', gutter: true, full: true, xlabel: 'x', ylabel: '$\\psi(x,\\tau)$', title: 'imaginary-time evolution relaxes the state onto the ground state' });
        const Bst = v.stage({ x: [0, 5], y: [-10, 1], height: 220, axes: 'box', gutter: true, xlabel: '$\\tau$', ylabel: '$\\log_{10}(\\langle H\\rangle-E_\\infty)$', title: 'energy error: slope $-2\\Delta\\log_{10}e$, $\\Delta$ = gap to the next level reached' });
        const Cst = v.stage({ x: [-0.5, 5.5], y: [0, 1.05], height: 220, axes: 'box', gutter: true, xlabel: 'eigenstate $n$', ylabel: '$|c_n|^2$', title: 'weights on the lowest eigenstates' });
        let st = null;
        v.animate((t) => {
          if (key !== `${pot.value}|${trial.value}|${defl.value}`) build();
          const h = hist, tau = Math.min(h.tmax, (t / 14) * 0.9 * h.tmax), s = Math.round(tau / DT), i2 = Math.min(h.snaps.length - 1, Math.round(s / 2)), psi = h.snaps[i2];
          let sc = 0; for (const a of psi) sc = Math.max(sc, Math.abs(a));
          A.fn((X) => interp(x, h.V, X) / 8, { color: 'muted', width: 1.4, n: 300 });
          const tgt = h.sp.phi[h.tg], sg = psi.reduce((q, a, i) => q + a * tgt[i], 0) < 0 ? -1 : 1;
          A.path(Array.from(x, (X, i) => [X, sg * tgt[i]]), { color: 'green', width: 2, dash: [5, 4] });
          drawReal(A, x, psi, { col: phaseLUT(v), base: 0, scale: 1, alpha: 0.5 });
          A.text('$V/8$', 4.4, h.V[Math.round((4.4 - x[0]) / dx)] / 8, { align: 'right', size: 11, color: 'muted', dy: -8 });
          Bst.setView([0, 0.9 * h.tmax], [Math.min(-8, ...h.pts.map((q) => q[1])) - 0.3, Math.max(...h.pts.map((q) => q[1])) + 0.5]);
          Bst.path(h.pts, { color: 'accent', width: 2.2 });
          const anchor = h.pts.find((q) => q[1] < -3) || h.pts[h.pts.length - 1], sl = -2 * h.gap * Math.LOG10E;
          Bst.line(anchor[0] - 0.3 * h.tmax, anchor[1] - sl * 0.3 * h.tmax, anchor[0] + 0.3 * h.tmax, anchor[1] + sl * 0.3 * h.tmax, { color: 'red', width: 1.4, dash: [5, 4] });
          Bst.vline(tau, { color: 'gold', width: 1.6, dash: [4, 3] });
          Cst.bars(h.W[s].map((q) => q), { x0: 0, dx: 1, color: (q, k) => (k === h.tg ? 'green' : 'accent') });
          st = { tau, E: h.En[s], Ef: h.Ef, gap: h.gap, tg: h.tg, nxt: h.nxt, exact: h.sp.E[h.tg], tmax: h.tmax, slope: (() => { const p = h.pts.filter((q) => q[1] < -2 && q[1] > -6); if (p.length < 3) return NaN; const a = p[0], b = p[p.length - 1]; return (b[1] - a[1]) / (b[0] - a[0]); })() };
        }, { period: 14, still: 14 * 0.45 });
        v.legend([['green', 'exact eigenstate', { dash: true }], ['accent', '$\\psi(\\tau)$'], ['red', 'predicted slope', { dash: true }]]);
        v.readout(() => st && `$\\tau=${v.fix(st.tau, 2)}$: $\\langle H\\rangle=${v.fix(st.E, 6)}$ → target $E_${st.tg}=${v.fix(st.exact, 6)}$ (diagonalised on the same grid; the stepper’s fixed point differs by $O(\\Delta\\tau^2)$: $${v.sci(Math.abs(st.Ef - st.exact), 1)}$). Gap used: $E_${st.nxt}-E_${st.tg}=${v.fix(st.gap, 3)}$ (the next level the trial state touches), predicted slope $${v.fix(-2 * st.gap * Math.LOG10E, 3)}$, measured $${v.fix(st.slope, 3)}$ per unit $\\tau$.`);
      },
    },
    // ------------------------------------------------------------------ 6.12
    {
      num: '6.12',
      kind: 'Definition',
      name: 'Wigner quasi-probability distribution',
      statement: String.raw`For a pure state $\psi(x)$ the **Wigner function** is
$$W(x,p)=\frac1{\pi\hbar}\int_{-\infty}^{\infty}\overline{\psi(x+y)}\,\psi(x-y)\,e^{2ipy/\hbar}\,dy ,$$
a real function on phase space (for a mixed state replace $\psi(x-y)\overline{\psi(x+y)}$ by $\rho(x-y,x+y)$). It has the properties: (i) real; (ii) the marginals are the probability densities, $\int W\,dp=|\psi(x)|^2$ and $\int W\,dx=|\varphi(p)|^2$ (so $\iint W=1$); (iii) averages of Weyl-ordered observables are phase-space integrals, $\langle f(x,p)\rangle=\iint fW$; (iv) $|W|\le1/\pi\hbar$. But $W$ is **not** a probability distribution: it takes negative values for almost every state — by Hudson’s theorem a pure state has $W\ge0$ everywhere only if it is a Gaussian — and the negative regions are a signature of non-classicality.`,
      idea: String.raw`Integrating the definition over $p$ turns $e^{2ipy/\hbar}$ into $\pi\hbar\,\delta(y)$ and leaves $|\psi(x)|^2$; integrating over $x$ and using the Fourier transform (qm-2.10) gives $|\varphi(p)|^2$. Because $W$ is bilinear in $\psi$, a superposition of two packets has the two single-packet blobs plus a cross term, $2\operatorname{Re}\big[\overline{\psi_1}\psi_2\big]$-like, located midway between them and oscillating in $p$ at the rate set by their separation; this interference term is what makes the marginal $|\psi|^2$ the sum of two bumps without a fringe pattern in $x$ while $W$ itself carries the fringes — and goes negative. The Wigner function (1932) is the bridge to classical phase space (mech-12.4) and to the Moyal expansion, in which $W$ obeys the classical Liouville equation up to $\hbar^2$ corrections.`,
      caption: String.raw`Choose a state: a Gaussian (with position $x_0$, momentum $p_0$, width $s$ and a chirp $c$ that shears it), a **cat** (two Gaussian packets at $\pm a$ with relative phase $\theta$) or an oscillator eigenstate $|n\rangle$. Blue is $W>0$, red is $W<0$, with the colour scale clipped at $1/\pi$. The two lower panels check the marginals: dots are $\int W\,dp$ and $\int W\,dx$ computed from the picture, the curves are $|\psi(x)|^2$ and $|\varphi(p)|^2$ computed directly. For the cat, **increase the separation $a$**: oscillating negative fringes appear between the packets, and their spacing in $p$ is $\pi/a$; $\theta$ shifts them.`,
      deps: ['qm-2.10', 'mech-12.4'],
      refs: ['Hall ch. 13'],
      credit: 'Wigner, 1932; Hudson, 1974',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Wigner_quasiprobability_distribution' },
      tags: ['Wigner function', 'phase space', 'quasi-probability'],
      viz(v) {
        const M = v.M, NG = 256, G = pgrid(20, NG), x = G.x, dx = G.dx, np = 121, ps = Float64Array.from({ length: np }, (_, i) => -6 + (12 * i) / (np - 1)), dp = 12 / (np - 1);
        const st = v.select('state', [{ value: 'g', label: 'Gaussian' }, { value: 'cat', label: 'cat (two packets)' }, { value: 'fock', label: 'oscillator $|n\\rangle$' }], 'cat');
        const x0S = v.slider('position $x_0$', -3, 3, 0, { step: 0.1 }), p0S = v.slider('momentum $p_0$', -3, 3, 0, { step: 0.1 });
        const sS = v.slider('width $s$ ($\\sigma_x=s/\\sqrt2$)', 0.4, 2, 1, { step: 0.05 }), cS = v.slider('chirp $c$', -1.5, 1.5, 0, { step: 0.05 });
        const aS = v.slider('half-separation $a$', 0, 4, 2.2, { step: 0.05 }), thS = v.slider('relative phase $\\theta$', 0, TAU, 0, { step: 0.05 });
        const nS = v.slider('$n$', 0, 5, 2, { int: true });
        const upd = () => { const m = st.value; for (const c of [x0S, p0S, sS, cS]) c.el.hidden = m !== 'g'; for (const c of [aS, thS]) c.el.hidden = m !== 'cat'; nS.el.hidden = m !== 'fock'; };
        const W0 = v.stage({ x: [-6, 6], y: [-6, 6], equal: true, height: 320, axes: true, xlabel: 'x', ylabel: 'p', title: 'Wigner function $W(x,p)$' });
        const MX = v.stage({ x: [-6, 6], y: [-0.05, 0.6], height: 320, axes: 'box', gutter: true, xlabel: 'x', ylabel: 'density', title: 'marginal over $p$ vs. $|\\psi(x)|^2$' });
        const MP = v.stage({ x: [-6, 6], y: [-0.05, 0.6], height: 320, axes: 'box', gutter: true, xlabel: 'p', ylabel: 'density', title: 'marginal over $x$ vs. $|\\varphi(p)|^2$' });
        let key = '', S = null;
        function build() {
          const m = st.value, re = new Float64Array(NG), im = new Float64Array(NG);
          if (m === 'g') { const s = sS.value, c = cS.value, x0 = x0S.value, p0 = p0S.value; for (let i = 0; i < NG; i++) { const d = x[i] - x0, am = Math.exp(-(d * d) / (2 * s * s)), ph = p0 * x[i] + 0.5 * c * d * d; re[i] = am * Math.cos(ph); im[i] = am * Math.sin(ph); } }
          else if (m === 'cat') { const a = aS.value, th = thS.value; for (let i = 0; i < NG; i++) { const g1 = Math.exp(-((x[i] - a) ** 2) / 2), g2 = Math.exp(-((x[i] + a) ** 2) / 2); re[i] = g1 + g2 * Math.cos(th); im[i] = g2 * Math.sin(th); } }
          else { const n = nS.value, buf = new Float64Array(6); for (let i = 0; i < NG; i++) { hermiteAt(x[i], 6, buf); re[i] = buf[n]; } }
          let s = 0; for (let i = 0; i < NG; i++) s += re[i] * re[i] + im[i] * im[i]; const f = 1 / Math.sqrt(s * dx); for (let i = 0; i < NG; i++) { re[i] *= f; im[i] *= f; }
          const Wd = wigner(x, re, im, ps, 2);
          const pdir = Array.from(ps, (P) => { let a = 0, b = 0; for (let i = 0; i < NG; i++) { const ph = -P * x[i]; a += re[i] * Math.cos(ph) - im[i] * Math.sin(ph); b += re[i] * Math.sin(ph) + im[i] * Math.cos(ph); } return ((a * a + b * b) * dx * dx) / TAU; });
          const rows = Wd.nx, dxr = Wd.xs[1] - Wd.xs[0], mx = [], mp = new Float64Array(np); let tot = 0, abs = 0;
          for (let r = 0; r < rows; r++) { let sx = 0; for (let k = 0; k < np; k++) { const w = Wd.W[r * np + k]; sx += w * dp; mp[k] += w * dxr; tot += w * dp * dxr; abs += Math.abs(w) * dp * dxr; } mx.push([Wd.xs[r], sx]); }
          let e1 = 0, e2 = 0; for (const [X, val] of mx) { const i = Math.round((X - x[0]) / dx); e1 = Math.max(e1, Math.abs(val - (re[i] * re[i] + im[i] * im[i]))); }
          for (let k = 0; k < np; k++) e2 = Math.max(e2, Math.abs(mp[k] - pdir[k]));
          S = { re, im, Wd, mx, mp, pdir, tot, abs, e1, e2, min: Wd.min, max: Wd.max, key: `${m}|${x0S.value}|${p0S.value}|${sS.value}|${cS.value}|${aS.value}|${thS.value}|${nS.value}` };
        }
        let last = '';
        v.render(() => {
          upd();
          const k = `${st.value}|${x0S.value}|${p0S.value}|${sS.value}|${cS.value}|${aS.value}|${thS.value}|${nS.value}`; if (k !== last) { last = k; build(); }
          paintPhase(v, W0, (X, P) => wignerAt(S.Wd, X, P), { key: S.key, res: 2 });
          W0.axes();
          const col = phaseLUT(v);
          MX.setView([-6, 6], [-0.03, Math.max(0.1, 1.2 * Math.max(...S.mx.map((q) => q[1])))]);
          MP.setView([-6, 6], [-0.03, Math.max(0.1, 1.2 * Math.max(...S.pdir))]);
          MX.fn((X) => { const i = Math.max(0, Math.min(NG - 1, Math.round((X - x[0]) / dx))); return S.re[i] ** 2 + S.im[i] ** 2; }, { color: 'ink', width: 1.6, n: 400 });
          MX.dots(S.mx.filter((_, i) => i % 2 === 0), { r: 3, color: 'accent' });
          MP.path(Array.from(ps, (P, i) => [P, S.pdir[i]]), { color: 'ink', width: 1.6 });
          MP.dots(Array.from(ps, (P, i) => [P, S.mp[i]]).filter((_, i) => i % 3 === 0), { r: 3, color: 'orange' });
        });
        v.legend([['accent', '$W>0$', { area: true }], ['red', '$W<0$', { area: true }]]);
        v.readout(() => S && `$\\iint W=${v.fix(S.tot, 5)}$ · $\\min W=${v.fix(S.min, 4)}$ (bound $-1/\\pi=${v.fix(-1 / Math.PI, 4)}$), $\\max W=${v.fix(S.max, 4)}$ (bound $1/\\pi=${v.fix(1 / Math.PI, 4)}$) · negativity $\\iint|W|-1=${v.fix(S.abs - 1, 4)}$ · marginal checks: $x$ $${v.sci(Math.max(S.e1, 1e-17), 1)}$, $p$ $${v.sci(Math.max(S.e2, 1e-17), 1)}$ (largest difference). ${S.abs - 1 < 1e-3 ? 'No negative region: a Gaussian state, as Hudson’s theorem requires.' : 'Negative regions: the state is not a Gaussian.'}`);
      },
    },
  ],
};
