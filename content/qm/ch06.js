// Quantum Mechanics — Chapter 6: Propagators, path integrals and gauge fields (items 6.1–6.4; 6.5–6.8 in ch06-b.js, 6.9–6.12 in ch06-c.js)
// Units: ħ = m = 1 unless an item says otherwise. Split-step evolution on periodic grids of 2^k points.
import {
  TAU, phaseLUT, drawPsi, phaseWheel, fz, packet, pgrid, kOf, freeEvolve, productStepper, spreadPacket, phaseRGB,
} from './ch06.shared.js';

/** Complex Gaussian-weighted quadrature helper: ∫ K(x − x') f(x') dx' for the free kernel, on a uniform x' grid. */
function freeK(d, t) { // (2πit)^{-1/2} e^{i d²/2t} → [re, im]
  const a = (d * d) / (2 * t) - Math.PI / 4, m = 1 / Math.sqrt(2 * Math.PI * t);
  return [m * Math.cos(a), m * Math.sin(a)];
}

export default {
  collection: 'qm',
  chapter: 6,
  title: 'Propagators, path integrals and gauge fields',
  summary: String.raw`The propagator carries a wave function from one time to another; for a free particle it is an explicit spreading Gaussian kernel. Splitting time into small steps leads to Feynman’s sum over all paths, whose stationary-phase limit recovers classical mechanics. Coupling to electromagnetism through the potentials makes gauge transformations act on phases, with physical consequences: the Aharonov–Bohm effect, Landau levels and Dirac’s quantization of magnetic charge. Phase-space pictures and imaginary-time evolution round out the toolkit.`,
  items: [
    // ------------------------------------------------------------------ 6.1
    {
      num: '6.1',
      kind: 'Definition',
      name: 'Propagator',
      statement: String.raw`For a system with Hamiltonian $H$, the **propagator** (or time-evolution kernel) is the integral kernel of the unitary evolution operator $U(t)=e^{-iHt/\hbar}$ in the position representation,
$$K(x,t;x_0,0)=\langle x|e^{-iHt/\hbar}|x_0\rangle ,\qquad \psi(x,t)=\int K(x,t;x_0,0)\,\psi(x_0,0)\,dx_0 .$$
Equivalently $K(\cdot,t;x_0,0)$ is the solution at time $t$ of the Schrödinger equation that starts as the delta function $\delta(x-x_0)$: the amplitude to be found at $x$ after starting exactly at $x_0$. It satisfies $K\to\delta(x-x_0)$ as $t\to0$, and the **composition rule** $K(x,t_2+t_1;x_0,0)=\int K(x,t_2+t_1;y,t_1)\,K(y,t_1;x_0,0)\,dy$ (unitary group property). In the energy basis $K=\sum_n\psi_n(x)\overline{\psi_n(x_0)}\,e^{-iE_nt/\hbar}$.`,
      idea: String.raw`Postulate 5.15 says the state at time $t$ is $U(t)\psi_0$; writing $\psi_0=\int\psi_0(x_0)\,|x_0\rangle\,dx_0$ and inserting the position basis, the matrix elements of $U(t)$ are exactly $K$. Because $U(t)$ is linear, the solution for any initial state is the superposition of solutions for delta-function initial states, each weighted by $\psi_0(x_0)$ — a Huygens principle for matter waves. Unitarity and $U(t_2)U(t_1)=U(t_1+t_2)$ give the composition rule, which is what later lets time be cut into slices (6.3, 6.4).`,
      caption: String.raw`**Drag the handle** on the bottom edge of the top panel to choose the starting point $x_0$: the fan is the amplitude $K(x,t;x_0,0)$ at every later $(x,t)$ (colour = phase, brightness = modulus), computed by evolving a narrow Gaussian (width $0.35$) in place of the delta. Pick the system (free, oscillator, barrier). In the lower panel the packet evolved directly (filled, colour = phase) and the packet rebuilt as $\int K\,\psi_0$ (dots) land on top of each other; $K(x,t;\cdot)$ is a matrix, found here by evolving *every* grid delta (a 128-point grid). The time slider moves in steps of $0.4$.`,
      deps: ['qm-5.15'],
      refs: ['Sakurai ch. 2'],
      credit: 'Dirac, 1933; Feynman, 1948',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Propagator' },
      tags: ['propagator', 'Green function', 'time evolution'],
      viz(v) {
        const M = v.M, NG = 128, G = pgrid(16, NG), x = G.x, dx = G.dx, DT = 0.04, NT = 80, SNAP = 10;
        const POT = { free: () => 0, osc: (X) => 0.5 * X * X, barrier: (X) => 3 * Math.exp(-X * X) };
        const sys = v.select('system', [{ value: 'free', label: 'free' }, { value: 'osc', label: 'oscillator $\\tfrac12x^2$' }, { value: 'barrier', label: 'barrier' }], 'free');
        const tS = v.slider('time $t$', 0.4, 3.2, 1.6, { step: 0.4 });
        const xS = v.slider('packet centre $x_c$', -4, 4, -2, { step: 0.1 });
        const kS = v.slider('packet momentum $k_0$', -3, 3, 1.5, { step: 0.1 });
        const cache = {};
        function kmats(key) {
          if (cache[key]) return cache[key];
          const V = Float64Array.from(x, POT[key]), step = productStepper(M, V, dx, DT, 'strang'), S = [];
          for (let k = 0; k <= NT / SNAP; k++) S.push({ re: new Float64Array(NG * NG), im: new Float64Array(NG * NG) });
          for (let j = 0; j < NG; j++) {
            const re = new Float64Array(NG), im = new Float64Array(NG); re[j] = 1 / dx;
            for (let s = 0; s <= NT; s++) {
              if (s % SNAP === 0) { const Sk = S[s / SNAP]; for (let i = 0; i < NG; i++) { Sk.re[i * NG + j] = re[i]; Sk.im[i * NG + j] = im[i]; } }
              if (s < NT) step(re, im);
            }
          }
          return (cache[key] = { V, step, S });
        }
        const A = v.stage({ x: [-8, 8], y: [0, 3.2], height: 250, axes: 'box', gutter: true, xlabel: 'x', ylabel: 't', full: true, title: 'the fan $K(x,t;x_0,0)$: where a particle started at $x_0$ can be found' });
        const B = v.stage({ x: [-8, 8], y: [-0.05, 0.9], height: 230, axes: 'box', gutter: true, xlabel: 'x', ylabel: '$|\\psi|$', full: true, title: 'evolve directly (filled) vs. integrate against the kernel (dots)' });
        const h0 = A.handle(0, 0, { color: 'ink', r: 6, label: 'x₀', labelPos: 'n', constrain: { x: [-6, 6], y: [0, 0] } });
        let fan = null, fanKey = '';
        let st = null;
        v.render(() => {
          const col = phaseLUT(v), rgb = phaseRGB(v), K = kmats(sys.value);
          const j0 = ((Math.round((h0.x - x[0]) / dx) % NG) + NG) % NG, k = Math.round(tS.value / (DT * SNAP));
          const fk = `${sys.value}|${j0}`;
          if (fk !== fanKey) {
            fanKey = fk; const re = new Float64Array(NG), im = new Float64Array(NG); fan = [];
            for (let i = 0; i < NG; i++) { let d = Math.abs(x[i] - x[j0]); d = Math.min(d, 16 - d); re[i] = Math.exp(-(d * d) / (2 * 0.35 * 0.35)) / (0.35 * Math.sqrt(2 * Math.PI)); }
            for (let s = 0; s <= NT; s++) { fan.push([Float64Array.from(re), Float64Array.from(im)]); if (s < NT) K.step(re, im); }
          }
          A.raster((X, T) => {
            const s = Math.round(T / DT); if (s < 2 || s > NT) return null;
            const i = (((Math.round((X - x[0]) / dx)) % NG) + NG) % NG, a = fan[s][0][i], b = fan[s][1][i], m = Math.hypot(a, b);
            const w = Math.min(1, Math.sqrt(m * Math.sqrt(2 * Math.PI * Math.max(T, 0.2)) / 1.2));
            const c = rgb(Math.atan2(b, a)); return [c[0], c[1], c[2], Math.round(255 * w)];
          }, { res: 2, key: `${fk}|${rgb.key}` });
          A.hline(tS.value, { color: 'gold', width: 1.6, dash: [5, 4] });
          phaseWheel(A, col, A.W - 30, 60, 11);
          // direct evolution vs kernel
          const P0 = packet(x, xS.value, 0.7, kS.value), dre = Float64Array.from(P0.re), dim = Float64Array.from(P0.im);
          for (let s = 0; s < k * SNAP; s++) K.step(dre, dim);
          const Sk = K.S[k], kre = new Float64Array(NG), kim = new Float64Array(NG);
          for (let i = 0; i < NG; i++) { let a = 0, b = 0; for (let j = 0; j < NG; j++) { const r = Sk.re[i * NG + j], q = Sk.im[i * NG + j]; a += r * P0.re[j] - q * P0.im[j]; b += r * P0.im[j] + q * P0.re[j]; } kre[i] = a * dx; kim[i] = b * dx; }
          B.fn((X) => { const f = (X - x[0]) / dx, i = Math.max(0, Math.min(NG - 1, Math.round(f))); return Math.hypot(P0.re[i], P0.im[i]); }, { color: 'muted', width: 1.2, dash: [4, 3], n: 300 });
          drawPsi(B, x, dre, dim, { col, alpha: 0.55 });
          const dots = []; for (let i = 0; i < NG; i += 2) dots.push([x[i], Math.hypot(kre[i], kim[i])]);
          B.dots(dots, { r: 3.2, color: 'ink' });
          let err = 0, nrm = 0; for (let i = 0; i < NG; i++) { err = Math.max(err, Math.hypot(dre[i] - kre[i], dim[i] - kim[i])); nrm += (kre[i] ** 2 + kim[i] ** 2) * dx; }
          st = { err, nrm, t: k * SNAP * DT };
        });
        v.legend([['ink', '$\\int K\\psi_0\\,dx_0$', { dot: true }], ['muted', 'initial packet', { dash: true }]]);
        v.readout(() => st && `$t=${v.fix(st.t, 1)}$: $\\max_x|\\psi_{\\rm direct}-\\int K\\psi_0|=${v.sci(Math.max(st.err, 1e-17), 1)}$, $\\int|\\int K\\psi_0|^2dx=${v.fix(st.nrm, 6)}$ — the kernel is a unitary matrix, so the norm stays 1.`);
      },
    },
    // ------------------------------------------------------------------ 6.2
    {
      num: '6.2',
      kind: 'Theorem',
      name: 'Free-particle propagator',
      statement: String.raw`For $H=p^2/2m$ on $\R$ the propagator is
$$K(x,t;x_0,0)=\sqrt{\frac{m}{2\pi i\hbar t}}\;\exp\!\Big[\frac{i\,m\,(x-x_0)^2}{2\hbar t}\Big]\qquad(t>0),$$
with $\sqrt{i}=e^{i\pi/4}$. Its modulus $\sqrt{m/2\pi\hbar t}$ does not depend on $x$; only the phase does, and the local wavenumber $\partial_x\arg K=m(x-x_0)/\hbar t$ is the one of a classical particle that travelled from $x_0$ to $x$ in time $t$. Convolving $K$ with the Gaussian $\psi_0(x)=(2\pi\sigma^2)^{-1/4}e^{-x^2/4\sigma^2}e^{ik_0x}$ gives the exact spreading packet, with width $\sigma(t)=\sigma\sqrt{1+(\hbar t/2m\sigma^2)^2}$ and centre $\hbar k_0t/m$.`,
      idea: String.raw`In momentum space $e^{-iHt/\hbar}$ is multiplication by $e^{-i\hbar k^2t/2m}$, so $K(x-x_0)=\frac1{2\pi}\int e^{ik(x-x_0)-i\hbar k^2t/2m}dk$. This is a Gaussian integral with an imaginary coefficient; completing the square (the Fresnel integral, i.e. the Fourier transform of a Gaussian, fa-7.6, continued to imaginary width) gives the formula. Since $K$ is a convolution kernel, a Gaussian times a Gaussian-phase integral is again a Gaussian, with the complex width $\sigma^2(1+i\hbar t/2m\sigma^2)$ whose modulus produces the spreading law of qm-3.6.`,
      caption: String.raw`The top-left map colours $\arg K$ for every $(x,t)$: curves of constant phase are the parabolas $x^2/2t=$ const, so the fan gets steeper and steeper stripes away from the source. At the chosen $t$ (top-right) $\operatorname{Re}K$ and $\operatorname{Im}K$ oscillate faster and faster outward (a chirp) inside the constant envelope $1/\sqrt{2\pi t}$. In the bottom panel the dots are a brute-force quadrature of $\int K(x-x')\psi_0(x')dx'$ and the filled curve is the closed-form spreading Gaussian: they agree to quadrature accuracy. Change $\sigma_0,k_0,t$.`,
      deps: ['qm-6.1', 'qm-3.6', 'fa-7.6'],
      refs: ['Sakurai ch. 2', 'Hall ch. 4'],
      credit: 'standard; see Feynman & Hibbs, 1965',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Propagator#Basic_examples:_propagator_of_free_particle_and_harmonic_oscillator' },
      tags: ['free particle', 'Gaussian', 'Fresnel integral'],
      viz(v) {
        const tS = v.slider('time $t$', 0.3, 3, 1.2, { step: 0.05 });
        const sS = v.slider('width $\\sigma_0$', 0.4, 1.5, 0.7, { step: 0.05 });
        const kS = v.slider('momentum $k_0$', -2, 2, 1, { step: 0.1 });
        const A = v.stage({ x: [-6, 6], y: [0.15, 3], height: 250, axes: 'box', gutter: true, xlabel: '$x-x_0$', ylabel: 't', title: 'phase of $K$ (colour) — constant-phase curves $x^2/2t$' });
        const B = v.stage({ x: [-6, 6], y: [-1, 1], height: 250, axes: 'box', gutter: true, xlabel: '$x-x_0$', title: 'the kernel at time $t$' });
        const C = v.stage({ x: [-8, 8], y: [-0.05, 0.9], height: 240, axes: 'box', gutter: true, full: true, xlabel: 'x', ylabel: '$|\\psi|$', title: 'Gaussian packet: quadrature of $K*\\psi_0$ (dots) vs. closed form (filled)' });
        let st = null;
        v.render(() => {
          const t = tS.value, s0 = sS.value, k0 = kS.value, col = phaseLUT(v), rgb = phaseRGB(v);
          A.raster((X, T) => { const c = rgb(X * X / (2 * T) - Math.PI / 4); return [c[0], c[1], c[2], 235]; }, { res: 2, key: rgb.key });
          for (const c of [0.5, 2, 6, 14]) A.curve((u) => [Math.sqrt(2 * c * (0.15 + u * 2.85)), 0.15 + u * 2.85], 0, 1, { color: 'ink', width: 0.9, alpha: 0.5, n: 120 });
          for (const c of [0.5, 2, 6, 14]) A.curve((u) => [-Math.sqrt(2 * c * (0.15 + u * 2.85)), 0.15 + u * 2.85], 0, 1, { color: 'ink', width: 0.9, alpha: 0.5, n: 120 });
          A.hline(t, { color: 'gold', width: 1.8, dash: [5, 4] });
          phaseWheel(A, col, A.W - 30, 60, 11);
          const m = 1 / Math.sqrt(2 * Math.PI * t), sc = 1 / (1.6 * m);
          B.setView([-6, 6], [-1.1, 1.1]);
          B.hline(m * sc, { color: 'muted', dash: [4, 3] }); B.hline(-m * sc, { color: 'muted', dash: [4, 3] });
          B.fn((X) => freeK(X, t)[0] * sc, { color: 'accent', width: 2, n: 1200 });
          B.fn((X) => freeK(X, t)[1] * sc, { color: 'orange', width: 2, n: 1200 });
          B.text(`envelope ±${v.fix(m, 3)}`, 5.8, m * sc, { align: 'right', dy: -8, size: 11, color: 'muted' });
          // convolution
          const NQ = 1801, R = 9, h = (2 * R) / (NQ - 1), p0 = packet(Float64Array.from({ length: NQ }, (_, i) => -R + i * h), 0, s0, k0);
          const xs = [], nre = [], nim = [], are = [], aim = [];
          let err = 0, M0 = 0, M2 = 0;
          for (let X = -8; X <= 8.0001; X += 0.1) {
            let a = 0, b = 0;
            for (let i = 0; i < NQ; i++) { const [kr, ki] = freeK(X + R - i * h, t), pr = p0.re[i], pi = p0.im[i]; a += kr * pr - ki * pi; b += kr * pi + ki * pr; }
            a *= h; b *= h; const [ea, eb] = spreadPacket(X, t, 0, s0, k0);
            xs.push(X); nre.push(a); nim.push(b); are.push(ea); aim.push(eb);
            err = Math.max(err, Math.hypot(a - ea, b - eb)); const r = a * a + b * b; M0 += r; M2 += r * (X - k0 * t) ** 2;
          }
          const xa = Float64Array.from(xs), n2 = 801, XA = Float64Array.from({ length: n2 }, (_, i) => -8 + (16 * i) / (n2 - 1));
          const ere = new Float64Array(n2), eim = new Float64Array(n2); for (let i = 0; i < n2; i++) { const [a, b] = spreadPacket(XA[i], t, 0, s0, k0); ere[i] = a; eim[i] = b; }
          drawPsi(C, XA, ere, eim, { col, alpha: 0.6 });
          C.dots(xs.map((X, i) => [X, Math.hypot(nre[i], nim[i])]), { r: 3, color: 'ink' });
          const sT = s0 * Math.sqrt(1 + (t / (2 * s0 * s0)) ** 2);
          C.hband(0, 0, { color: 'faint' });
          C.vline(k0 * t, { color: 'gold', dash: [4, 3] });
          st = { err, sT, sNum: Math.sqrt(M2 / M0), t, m };
        });
        v.legend([['accent', '$\\operatorname{Re}K$'], ['orange', '$\\operatorname{Im}K$'], ['ink', 'quadrature', { dot: true }]]);
        v.readout(() => st && `$|K|=1/\\sqrt{2\\pi t}=${v.fix(st.m, 4)}$ for every $x$. Spread: formula $\\sigma(t)=\\sigma_0\\sqrt{1+(t/2\\sigma_0^2)^2}=${v.fix(st.sT, 4)}$, measured from the quadrature $${v.fix(st.sNum, 4)}$; the largest difference between quadrature and closed form is $${v.sci(Math.max(st.err, 1e-17), 1)}$.`);
      },
    },
    // ------------------------------------------------------------------ 6.3
    {
      num: '6.3',
      kind: 'Theorem',
      name: 'Trotter product formula and split-step evolution',
      statement: String.raw`Let $T$ and $V$ be self-adjoint operators such that $T+V$ is self-adjoint on the intersection of their domains (or has a self-adjoint closure there). Then in the strong sense
$$e^{-i(T+V)t}\psi=\lim_{N\to\infty}\Big(e^{-iTt/N}e^{-iVt/N}\Big)^{N}\psi\qquad\text{for every }\psi .$$
For $H=p^2/2m+V(x)$ this alternates a kinetic step (a multiplication in momentum space) and a potential step (a multiplication in position space). The symmetrised **Strang** step $e^{-iV\Delta t/2}e^{-iT\Delta t}e^{-iV\Delta t/2}$ is also a strong limit, and for smooth $V$ and smooth $\psi$ its error after a fixed time shrinks like $\Delta t^2$ (the Lie–Trotter step: $\Delta t$). Every factor is unitary, so the norm is exactly preserved.`,
      idea: String.raw`Each factor is unitary and the products of unitaries are unitary; what must be shown is that the product approximates $e^{-i(T+V)t}$. On the common domain, $e^{-iT\tau}e^{-iV\tau}\psi=\psi-i\tau(T+V)\psi+o(\tau)$, so the product is a first-order approximation of the semigroup at every small time; stability (all factors are contractions) lets the errors of $N$ small steps add up to $N\,o(1/N)\to0$ — Trotter's argument, extended by Kato. The commutator $[T,V]$ is the leading error term; symmetrising cancels it and leaves an error $\propto[T,[T,V]]$ and $[V,[V,T]]$ of order $\Delta t^2$.`,
      caption: String.raw`A packet in a double well is run to time $T$ in $N$ steps by the first-order (Lie) and second-order (Strang) splittings; the thin curve is a reference run with $4096$ Strang steps. **Drag $N$** and watch the first panel converge: the filled curve is the product-formula result, the dashed one the reference. The lower panel is the $L^2$ error against $\Delta t=T/N$ for $N=1,2,4,\dots,256$ on log axes with slope-1 and slope-2 guides — a straight line for each scheme. Change the total time $T$ or the well.`,
      deps: ['qm-5.15', 'qm-2.10'],
      refs: ['Sakurai ch. 2'],
      credit: 'Trotter, 1959; Strang, 1968; Feit, Fleck & Steiger, 1982',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Time-evolving_block_decimation#The_Suzuki%E2%80%93Trotter_decomposition' },
      tags: ['product formula', 'split-step', 'numerics'],
      viz(v) {
        const M = v.M, NG = 256, G = pgrid(16, NG), x = G.x, dx = G.dx;
        const Tt = v.slider('total time $T$', 0.5, 3, 2, { step: 0.1, onChange: () => { cacheKey = ''; } });
        const NS = v.slider('steps $N$', 1, 256, 8, { int: true, log: true });
        const sch = v.select('scheme', [{ value: 'both', label: 'both' }, { value: 'lie', label: 'Lie $e^{-iT\\tau}e^{-iV\\tau}$' }, { value: 'strang', label: 'Strang (symmetric)' }], 'both');
        const pot = v.select('potential', [{ value: 'dw', label: 'double well $\\tfrac14(x^2-2)^2$' }, { value: 'osc', label: 'oscillator' }], 'dw', { onChange: () => { cacheKey = ''; } });
        const Vf = (k) => Float64Array.from(x, (X) => (k === 'dw' ? 0.25 * (X * X - 2) ** 2 : 0.5 * X * X));
        const init = () => { const P = packet(x, -1.4, 0.55, 1.2); return { re: P.re, im: P.im }; };
        const run = (V, mode, N, T) => { const s = productStepper(M, V, dx, T / N, mode), q = init(); for (let i = 0; i < N; i++) s(q.re, q.im); return q; };
        const dist = (a, b) => { let s = 0; for (let i = 0; i < NG; i++) s += (a.re[i] - b.re[i]) ** 2 + (a.im[i] - b.im[i]) ** 2; return Math.sqrt(s * dx); };
        let cacheKey = '', V = null, ref = null, errs = null;
        const NN = [1, 2, 4, 8, 16, 32, 64, 128, 256];
        function ensure() {
          const k = `${Tt.value}|${pot.value}`; if (k === cacheKey) return; cacheKey = k;
          V = Vf(pot.value); ref = run(V, 'strang', 4096, Tt.value);
          errs = { lie: NN.map((N) => dist(run(V, 'lie', N, Tt.value), ref)), strang: NN.map((N) => dist(run(V, 'strang', N, Tt.value), ref)) };
        }
        const A = v.stage({ x: [-6, 6], y: [-0.05, 0.9], height: 240, axes: 'box', gutter: true, xlabel: 'x', ylabel: '$|\\psi(T)|$', title: 'the state at time $T$ after $N$ product steps' });
        const B = v.stage({ x: [-0.15, 2.6], y: [-9, 1], height: 240, axes: 'box', gutter: true, xlabel: '$\\log_{10}N$', ylabel: '$\\log_{10}\\|\\psi_N-\\psi_{\\rm exact}\\|$', title: 'error vs. step number: slope $-1$ (Lie) and $-2$ (Strang)' });
        let st = null;
        v.render(() => {
          ensure();
          const col = phaseLUT(v), N = NS.value, T = Tt.value, sh = sch.value;
          A.fn((X) => (pot.value === 'dw' ? 0.25 * (X * X - 2) ** 2 : 0.5 * X * X) / 12, { color: 'faint', n: 200 });
          const q1 = sh !== 'strang' ? run(V, 'lie', N, T) : null, q2 = sh !== 'lie' ? run(V, 'strang', N, T) : null;
          if (q2) drawPsi(A, x, q2.re, q2.im, { col, alpha: 0.55, outline: 'accent' });
          if (q1) drawPsi(A, x, q1.re, q1.im, { col, alpha: q2 ? 0.0 : 0.55, outline: 'orange' });
          const rr = []; for (let i = 0; i < NG; i++) rr.push([x[i], Math.hypot(ref.re[i], ref.im[i])]);
          A.path(rr, { color: 'ink', width: 1.1, dash: [4, 3] });
          const lx = NN.map((n) => Math.log10(n));
          if (sh !== 'strang') { B.path(lx.map((l, i) => [l, Math.log10(errs.lie[i])]), { color: 'orange', width: 2 }); B.dots(lx.map((l, i) => [l, Math.log10(errs.lie[i])]), { r: 3.5, color: 'orange' }); }
          if (sh !== 'lie') { B.path(lx.map((l, i) => [l, Math.log10(errs.strang[i])]), { color: 'accent', width: 2 }); B.dots(lx.map((l, i) => [l, Math.log10(errs.strang[i])]), { r: 3.5, color: 'accent' }); }
          const l0 = Math.log10(errs.lie[0]), s0 = Math.log10(errs.strang[0]);
          B.line(0, l0 + 0.15, 2.4, l0 + 0.15 - 2.4, { color: 'muted', width: 1, dash: [5, 4] }); B.text('slope −1', 2.35, l0 + 0.15 - 2.4, { size: 11, color: 'muted', align: 'right', dy: 10 });
          B.line(0, s0 - 0.35, 2.4, s0 - 0.35 - 4.8, { color: 'muted', width: 1, dash: [5, 4] }); B.text('slope −2', 2.35 - 1.0, s0 - 0.35 - 3.2, { size: 11, color: 'muted', align: 'right', dy: -8 });
          B.vline(Math.log10(N), { color: 'gold', width: 1.6, dash: [4, 3] });
          const slope = (a) => { const i = 3, j = 7; return (Math.log10(a[j]) - Math.log10(a[i])) / (Math.log10(NN[j]) - Math.log10(NN[i])); };
          st = { e1: q1 && dist(q1, ref), e2: q2 && dist(q2, ref), n1: q1 && Math.sqrt(dx * q1.re.reduce((s, a, i) => s + a * a + q1.im[i] ** 2, 0)), n2: q2 && Math.sqrt(dx * q2.re.reduce((s, a, i) => s + a * a + q2.im[i] ** 2, 0)), sl: slope(errs.lie), ss: slope(errs.strang), N, dt: T / N };
        });
        v.legend([['orange', 'Lie (first order)'], ['accent', 'Strang (second order)'], ['ink', 'reference, 4096 steps', { dash: true }]]);
        v.readout(() => st && `$\\Delta t=T/N=${v.fix(st.dt, 4)}$: ` + (st.e1 != null ? `Lie error $${v.sci(st.e1, 2)}$ (norm ${v.fix(st.n1, 8)}), ` : '') + (st.e2 != null ? `Strang error $${v.sci(st.e2, 2)}$ (norm ${v.fix(st.n2, 8)}). ` : '') + `Fitted slopes on $N=8\\ldots128$: Lie $${v.fix(st.sl, 2)}$, Strang $${v.fix(st.ss, 2)}$.`);
      },
    },
    // ------------------------------------------------------------------ 6.4
    {
      num: '6.4',
      kind: 'Principle',
      name: 'Feynman path integral',
      statement: String.raw`The propagator of $H=p^2/2m+V(x)$ is the limit of integrals over time-sliced paths,
$$K(x_b,T;x_a,0)=\lim_{N\to\infty}\Big(\frac{m}{2\pi i\hbar\varepsilon}\Big)^{N/2}\!\!\int\!\cdots\!\int e^{\,iS_N[x_0,\dots,x_N]/\hbar}\,dx_1\cdots dx_{N-1},\qquad \varepsilon=\frac TN,\;x_0=x_a,\;x_N=x_b,$$
with the discretised action $S_N=\sum_{j=0}^{N-1}\varepsilon\big[\tfrac m2\big(\tfrac{x_{j+1}-x_j}{\varepsilon}\big)^2-V\big(\tfrac{x_j+x_{j+1}}2\big)\big]$. Every path between the endpoints contributes a unit-modulus phasor $e^{iS/\hbar}$ of equal weight; the amplitude is the (appropriately normalised) sum of all of them. The integrals are oscillatory, not absolutely convergent, and are defined by the limit (or by a convergence factor, equivalently a slight rotation of time into the complex plane); the formula is a principle that reproduces Schrödinger’s equation, not a theorem with a measure behind it.`,
      idea: String.raw`Cut $e^{-iHT/\hbar}$ into $N$ factors $e^{-iH\varepsilon/\hbar}$ and insert a position resolution of the identity between them (the composition rule of 6.1). Each factor is, by the Trotter formula (6.3) for small $\varepsilon$, a free kernel (6.2) times a potential phase $e^{-i\varepsilon V/\hbar}$: $\langle x_{j+1}|e^{-iH\varepsilon}|x_j\rangle\approx\sqrt{m/2\pi i\hbar\varepsilon}\,e^{i\varepsilon[\ldots]/\hbar}$. Multiplying and integrating over the intermediate points gives the formula. Dirac (1933) had noted that the short-time kernel “corresponds to” $e^{i\int L\,dt/\hbar}$; Feynman (1948) made it the starting point of quantum mechanics.`,
      caption: String.raw`Choose a particle (free or oscillator), the number of time slices $N$ and the end point $x_b$. The top-left panel draws random piecewise-linear paths from $x_a$ to $x_b$, coloured by the phase of $e^{iS}$; green is the classical path. The top-right panel adds their phasors: the gold trail is the running average of $e^{iS}$ over paths drawn from a Gaussian cloud of width $W$ around the straight line, times the known constant. To make the sum converge, far-out paths are tapered by that same Gaussian (a convergence factor): the trail closes in on the black target $K_W$ at the rate $1/\sqrt n$ (bottom), and $K_W$ approaches the true kernel $K$ (green) as $W$ grows — but then the phasors cancel ever more, so the noise grows like $W^{N-1}$.`,
      deps: ['qm-6.3', 'mech-6.5'],
      refs: ['Sakurai ch. 2'],
      credit: 'Dirac, 1933; Feynman, 1948',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Path_integral_formulation' },
      tags: ['path integral', 'action', 'sum over histories'],
      viz(v) {
        const NMAX = 50000, T = 1, XA = -1;
        const reset = () => { key = ''; };
        const sys = v.select('particle', [{ value: 'free', label: 'free' }, { value: 'osc', label: 'oscillator $\\tfrac12x^2$' }], 'free', { onChange: reset });
        const NSl = v.slider('time slices $N$', 2, 6, 3, { int: true, onChange: reset });
        const xbS = v.slider('end point $x_b$', -2, 2, 1, { step: 0.1, onChange: reset });
        const wS = v.slider('convergence width $W$', 0.6, 4, 1.5, { step: 0.1, onChange: reset });
        const nS = v.slider('paths used $n$', 10, NMAX, 5000, { int: true, log: true });
        const A = v.stage({ x: [0, T], y: [-3, 3], height: 250, axes: 'box', gutter: true, xlabel: 't', ylabel: 'x', title: 'sample paths (colour = phase of $e^{iS}$)' });
        const B = v.stage({ x: [-1, 1], y: [-1, 1], height: 250, equal: true, axes: true, title: 'running estimate of $K$ in the complex plane' });
        const C = v.stage({ x: [1, Math.log10(NMAX)], y: [-3, 1.3], height: 210, axes: 'box', gutter: true, full: true, xlabel: '$\\log_{10}n$', ylabel: '$\\log_{10}|\\hat K-K_W|$', title: 'statistical error of the path sum' });
        let key = '', cum = null, ph = null, paths = null, Kex = null, KW = null, cst = 1, Kcl = null, Knote = '';
        function exact(xb) {
          if (sys.value === 'free') { const a = (xb - XA) ** 2 / (2 * T) - Math.PI / 4, m = 1 / Math.sqrt(2 * Math.PI * T); return [m * Math.cos(a), m * Math.sin(a)]; }
          const sn = Math.sin(T), cs = Math.cos(T), a = ((XA * XA + xb * xb) * cs - 2 * XA * xb) / (2 * sn) - Math.PI / 4, m = 1 / Math.sqrt(2 * Math.PI * sn);
          return [m * Math.cos(a), m * Math.sin(a)];
        }
        /** Action of a time-sliced path (ħ = m = 1). */
        const action = (xs, eps, osc) => { let S = 0; for (let j = 0; j < xs.length - 1; j++) { const d = xs[j + 1] - xs[j]; S += (d * d) / (2 * eps); if (osc) S -= (eps * (xs[j] * xs[j] + xs[j + 1] * xs[j + 1])) / 4; } return S; };
        /** The tapered N-slice integral K_W, exactly: a complex Gaussian integral over the N−1 intermediate points. */
        function taperedK(N, xb, W, osc) {
          const eps = T / N, n = N - 1, line = Array.from({ length: N + 1 }, (_, j) => XA + ((xb - XA) * j) / N);
          const Hm = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 2 / eps - (osc ? eps : 0) : Math.abs(i - j) === 1 ? -1 / eps : 0)));
          const b = Array.from({ length: n }, (_, i) => (osc ? -eps * line[i + 1] : 0));
          const E = v.M.eigSym(Hm); let re = 1, im = 0, qr = 0, qi = 0; // ∏ m_k^{-1/2}, Σ c_k²/m_k
          for (let k = 0; k < n; k++) {
            const mr = 1 / (W * W), mi = -E.values[k], mod = Math.hypot(mr, mi), ar = Math.atan2(mi, mr), f = Math.pow(mod, -0.5), a = -0.5 * ar;
            const nr = re * f * Math.cos(a) - im * f * Math.sin(a); im = re * f * Math.sin(a) + im * f * Math.cos(a); re = nr;
            const c = E.vectors.map((row) => row[k]).reduce((s, x, i) => s + x * b[i], 0), d = mr * mr + mi * mi; qr += (c * c * mr) / d; qi += (-c * c * mi) / d;
          }
          const ex = Math.exp(-0.5 * qr), eang = -0.5 * qi, S0 = action(line, eps, osc), A0 = Math.pow(2 * Math.PI * eps, -N / 2) * Math.pow(2 * Math.PI, n / 2);
          const ang = S0 - (Math.PI * N) / 4 + eang, c0 = A0 * ex, rr = re * Math.cos(ang) - im * Math.sin(ang), ii = re * Math.sin(ang) + im * Math.cos(ang);
          return [c0 * rr, c0 * ii];
        }
        function build() {
          const N = NSl.value, xb = xbS.value, W = wS.value, eps = T / N, r = v.rng(11), osc = sys.value === 'osc';
          const line = Array.from({ length: N + 1 }, (_, j) => XA + ((xb - XA) * j) / N);
          cum = { re: new Float64Array(NMAX + 1), im: new Float64Array(NMAX + 1) }; ph = []; paths = [];
          const pA = (-Math.PI * N) / 4;
          cst = Math.pow(2 * Math.PI * eps, -N / 2) * Math.pow(2 * Math.PI * W * W, (N - 1) / 2);
          for (let n = 0; n < NMAX; n++) {
            const xs = line.slice(); for (let j = 1; j < N; j++) xs[j] = line[j] + W * r.normal();
            const S = action(xs, eps, osc), ang = S + pA;
            cum.re[n + 1] = cum.re[n] + Math.cos(ang); cum.im[n + 1] = cum.im[n] + Math.sin(ang);
            if (n < 28) { paths.push(xs); ph.push(S); }
          }
          Kex = exact(xb); KW = taperedK(N, xb, W, osc);
          const sn = Math.sin(T), cs = Math.cos(T);
          Kcl = (t) => (osc ? XA * Math.cos(t) + ((xb - XA * cs) / sn) * Math.sin(t) : XA + ((xb - XA) * t) / T);
          Knote = osc ? 'oscillator: besides the taper, the $N$-slice integral differs from the exact kernel by $O(\\varepsilon^2)$' : 'free: with no taper the $N$-slice integral would equal the exact kernel for every $N$ (composition rule)';
        }
        v.render(() => {
          const sk = `${sys.value}|${NSl.value}|${xbS.value}|${wS.value}`; if (sk !== key) { key = sk; build(); }
          const col = phaseLUT(v), N = NSl.value, n = nS.value;
          const line = (j) => XA + ((xbS.value - XA) * j) / N;
          for (let i = 0; i < paths.length; i++) A.path(paths[i].map((X, j) => [(j * T) / N, X]), { color: col(ph[i]), width: 1.2, alpha: 0.75 });
          A.path(Array.from({ length: N + 1 }, (_, j) => [(j * T) / N, line(j)]), { color: 'muted', width: 1.6, dash: [5, 4] });
          A.curve((t) => [t, Kcl(t)], 0, T, { color: 'green', width: 2.6, n: 80 });
          A.dot(0, XA, { r: 5, color: 'ink' }); A.dot(T, xbS.value, { r: 5, color: 'ink' });
          for (let j = 1; j < N; j++) A.vline((j * T) / N, { color: 'faint', width: 1, dash: [2, 4] });
          phaseWheel(A, col, A.W - 30, 62, 11);
          const est = (m) => [(cst * cum.re[m]) / m, (cst * cum.im[m]) / m];
          const km = Math.hypot(Kex[0], Kex[1]), R = Math.max(0.5, 2.2 * km);
          B.setView([-R, R], [-R, R]);
          B.circle(0, 0, km, { color: 'muted', width: 1, dash: [3, 4] });
          const trail = []; for (let m = 10; m <= n; m = Math.max(m + 1, Math.round(m * 1.04))) trail.push(est(m));
          B.clip(() => { B.path(trail, { color: 'gold', width: 1.6, alpha: 0.9 }); B.dot(...est(n), { r: 5, color: 'gold' }); });
          B.dot(KW[0], KW[1], { r: 6, color: 'ink', label: 'K_W', labelPos: 'se' });
          B.dot(Kex[0], Kex[1], { r: 6, color: 'green', label: 'K', labelPos: 'ne' });
          const errs = []; for (let m = 10; m <= NMAX; m = Math.max(m + 1, Math.round(m * 1.06))) { const e = est(m); errs.push([Math.log10(m), Math.log10(Math.hypot(e[0] - KW[0], e[1] - KW[1]) + 1e-12)]); }
          C.setView([1, Math.log10(NMAX)], [Math.min(-3, Math.min(...errs.map((q) => q[1])) - 0.3), Math.max(1.3, Math.max(...errs.map((q) => q[1])) + 0.3)]);
          C.path(errs, { color: 'gold', width: 1.8 });
          const e0 = Math.log10(cst) - 0.5 * 1;
          C.line(1, e0, Math.log10(NMAX), e0 - 0.5 * (Math.log10(NMAX) - 1), { color: 'muted', dash: [5, 4] });
          C.text('$\\propto1/\\sqrt n$', Math.log10(NMAX) - 0.1, e0 - 0.5 * (Math.log10(NMAX) - 1), { align: 'right', dy: 12, size: 11, color: 'muted' });
          C.vline(Math.log10(n), { color: 'gold', dash: [4, 3] });
        });
        v.legend([['green', 'classical path'], ['gold', 'running average'], ['muted', 'straight line (cloud centre)', { dash: true }]]);
        v.readout(() => {
          if (!cum) return '';
          const n = nS.value, m = nS.value, e = [(cst * cum.re[m]) / m, (cst * cum.im[m]) / m], f = (z) => `${v.fix(z[0], 4)}${z[1] < 0 ? '-' : '+'}${v.fix(Math.abs(z[1]), 4)}\\,i`;
          return `Kernel $K=${f(Kex)}$ (${sys.value === 'free' ? 'Fresnel formula of 6.2' : 'Mehler kernel'}); tapered integral $K_W=${f(KW)}$ (exact Gaussian integral, $W=${v.fix(wS.value, 1)}$); path sum over $n=${n}$ paths $\\hat K=${f(e)}$, $|\\hat K-K_W|=${v.sci(Math.hypot(e[0] - KW[0], e[1] - KW[1]), 2)}$. Every phasor has length 1; the constant in front is $${v.fix(cst, 2)}$. ${Knote}.`;
        });
      },
    },
  ],
};
