// Quantum Chemistry & Spectroscopy — Chapter 4: Approximation methods (items 4.1–4.6; 4.7–4.12 are in ch04-b.js)
import { HARTREE_EV, lagL, fact, boxX, boxMatrix, goldenMin } from './ch04.shared.js';

// Radial quadrature r_i = a (i + ½)², dr = 2a (i + ½): fine near the nucleus, reaches r = 400 a₀ with 3000 points.
const NQ = 3000, AQ = 400 / (NQ * NQ);
const RQ = Float64Array.from({ length: NQ }, (_, i) => AQ * (i + 0.5) ** 2);
const WQ = Float64Array.from({ length: NQ }, (_, i) => 2 * AQ * (i + 0.5));

// Hydrogen trial functions ψ(r) and ψ'(r), one parameter p
const TRIALS = {
  gauss: { psi: (r, p) => Math.exp(-p * r * r), dpsi: (r, p) => -2 * p * r * Math.exp(-p * r * r), lo: 0.03, hi: 1.2 },
  slater: { psi: (r, p) => Math.exp(-p * r), dpsi: (r, p) => -p * Math.exp(-p * r), lo: 0.2, hi: 2.4 },
  lor: { psi: (r, p) => (1 + p * r) ** -3, dpsi: (r, p) => -3 * p * (1 + p * r) ** -4, lo: 0.1, hi: 4 },
};
/** Rayleigh quotient of the trial ψ(r;p) for hydrogen (hartree) and its weight on the exact 1s state. */
function hydrogenTrial(fam, p) {
  const T = TRIALS[fam]; let num = 0, den = 0, ov = 0, kin = 0;
  for (let i = 0; i < NQ; i++) {
    const r = RQ[i], w = WQ[i] * r * r, f = T.psi(r, p), g = T.dpsi(r, p);
    den += w * f * f; kin += 0.5 * w * g * g; num += w * (0.5 * g * g - (f * f) / r); ov += w * f * Math.exp(-r);
  }
  return { E: num / den, T: kin / den, c0: (4 * ov * ov) / den };
}

// Tilted box  H = −½ d²/dx² + F x  on [0, 1]  (ħ = m = 1); box energies E_n = n²π²/2.
const EBOX = (n) => (n * n * Math.PI * Math.PI) / 2;
const boxLevels = (M, F, k = 4) => M.schrodinger1D((x) => F * x, [0, 1], { n: 500, k });

export default {
  collection: 'qchem',
  chapter: 4,
  title: 'Approximation methods',
  summary: String.raw`Almost no chemical system is exactly solvable, so the subject runs on two tools. The variational principle turns a guess into an upper bound and, with a linear basis, into a matrix eigenvalue problem; perturbation theory expands around a solvable model, with a different recipe when the levels are degenerate. Hellmann–Feynman and the quantum virial theorem connect energies to forces and to kinetic and potential parts, the non-crossing rule says what happens when two levels meet, and second-order perturbation theory of fluctuating dipoles gives the London dispersion force and, through it, the Lennard-Jones potential.`,
  items: [
    // ------------------------------------------------------------------ 4.1
    {
      num: '4.1',
      kind: 'Theorem',
      name: 'Variational principle',
      credit: 'Rayleigh–Ritz variational method: Ritz, 1909; used by Schrödinger, 1926; upper-bound property for excited states: Eckart, 1930',
      statement: String.raw`Let $H$ be a Hermitian operator bounded below with lowest eigenvalue $E_0$. For every normalisable trial state $\psi$ in the domain of $H$,
$$E[\psi]=\frac{\langle\psi|H|\psi\rangle}{\langle\psi|\psi\rangle}\;\ge\;E_0,$$
with equality exactly when $\psi$ is a ground state. More generally $E[\psi]\ge E_k$ whenever $\psi$ is orthogonal to the $k$ lowest eigenstates, and the stationary points of $E[\psi]$ are the eigenstates (the Euler–Lagrange equation of the quotient is $H\psi=E\psi$).`,
      scope: String.raw`Needs a Hamiltonian bounded from below, which every molecular Hamiltonian is. The bound is on the energy only: a small energy error gives a wavefunction error of order the *square root* of it, so other properties converge more slowly.`,
      idea: String.raw`Expand the trial state in the eigenstates of $H$ (the spectral theorem for self-adjoint operators, 1.3 and fa-12.13): $\psi=\sum_n c_n\phi_n$. Then $E[\psi]-E_0=\sum_n|c_n|^2(E_n-E_0)/\sum_n|c_n|^2$, a weighted average of non-negative numbers, hence $\ge0$, and zero only if all the weight sits on the ground level. Minimising over a family of trial functions therefore always gives the best upper bound the family allows; this is why a guess with an adjustable parameter is worth making.`,
      caption: String.raw`The trial function is for the **hydrogen atom** (atomic units). Choose a family, then drag the parameter $p$: the left panel is the Rayleigh quotient $E(p)$, computed by numerical integration, with the exact $-0.5$ hartree as a dashed line; the right panel compares the radial density $4\pi r^2\psi^2$ with the exact $1s$ one. Notice that no value of $p$ goes below the dashed line, that the exponential family touches it at $\zeta=1$ (because the exact $1s$ function belongs to that family), and that the readout's weight $|c_{1s}|^2$ reaches 1 only there. The Gaussian cannot reproduce the nuclear cusp and misses by about 15 %.`,
      deps: ['qchem-1.3', 'fa-12.13', 'qm-12.1'],
      see: ['qm-12.1', 'fa-12.13'],
      refs: ['McQuarrie ch. 8', 'Szabo–Ostlund ch. 1'],
      tags: ['variational principle', 'upper bound', 'trial function'],
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Variational_method_(quantum_mechanics)' },
      viz(v) {
        const fam = v.select('trial family', [
          { value: 'gauss', label: 'Gaussian $e^{-pr^2}$' }, { value: 'slater', label: 'exponential $e^{-pr}$' }, { value: 'lor', label: 'rational $(1+pr)^{-3}$' },
        ], 'gauss', { onChange: () => showSl() });
        const sl = { gauss: v.slider('parameter $p$', 0.03, 1.5, 0.28, { step: 0.005 }), slater: v.slider('parameter $p$', 0.2, 2.4, 0.6, { step: 0.005 }), lor: v.slider('parameter $p$', 0.1, 4, 0.9, { step: 0.01 }) };
        const showSl = () => { for (const k in sl) sl[k].el.hidden = k !== fam.value; };
        showSl();
        const sE = v.stage({ x: [0, 4], y: [-0.55, 0.4], axes: 'box', gutter: true, height: 320, weight: 1, xlabel: 'parameter p', ylabel: 'E[ψ] (hartree)', title: 'Rayleigh quotient' });
        const sR = v.stage({ x: [0, 6], y: [0, 0.65], axes: 'box', gutter: true, height: 320, weight: 1, xlabel: 'r (bohr)', ylabel: '4πr²ψ²', title: 'radial density' });
        const cache = {};
        const curve = (f) => {
          if (cache[f]) return cache[f];
          const T = TRIALS[f], pts = []; for (let i = 0; i <= 120; i++) { const p = T.lo + ((T.hi - T.lo) * i) / 120; pts.push([p, hydrogenTrial(f, p).E]); }
          let best = pts[0]; for (const q of pts) if (q[1] < best[1]) best = q;
          const pOpt = goldenMin((p) => hydrogenTrial(f, p).E, Math.max(T.lo, best[0] - (T.hi - T.lo) / 60), Math.min(T.hi, best[0] + (T.hi - T.lo) / 60), 1e-7);
          return (cache[f] = { pts, pOpt, Emin: hydrogenTrial(f, pOpt).E });
        };
        let info = null;
        v.render(() => {
          const f = fam.value, T = TRIALS[f], c = curve(f), p = sl[f].value;
          const { E, T: kin, c0 } = hydrogenTrial(f, p);
          sE.setView([T.lo, T.hi], [-0.56, 0.45]);
          sE.hline(-0.5, { color: 'green', dash: true, width: 1.6 });
          sE.hline(0, { color: 'faint' });
          sE.path(c.pts.filter((q) => q[1] < 0.45), { color: 'accent', width: 2.4 });
          sE.dot(c.pOpt, c.Emin, { r: 5, color: 'orange', label: 'minimum', labelPos: 'ne' });
          sE.dot(p, Math.min(E, 0.44), { r: 7, color: 'gold' });
          sE.tex(String.raw`E_0=-\tfrac12`, T.hi - 0.03 * (T.hi - T.lo), -0.525, { color: 'green', align: 'right' });
          // densities
          let nrm = 0; for (let i = 0; i < NQ; i++) nrm += WQ[i] * RQ[i] ** 2 * T.psi(RQ[i], p) ** 2;
          const D = (r) => (r * r * T.psi(r, p) ** 2) / nrm;
          sR.fn((r) => 4 * r * r * Math.exp(-2 * r), { color: 'green', width: 2, dash: true, domain: [0, 6] });
          sR.fn(D, { color: 'accent', width: 2.4, domain: [0, 6], fill: true });
          info = { E, kin, c0, p, pOpt: c.pOpt, Emin: c.Emin, f };
        });
        v.legend([['accent', 'trial'], ['green', 'exact $E_0$ / exact $1s$', { dash: true }], ['orange', 'best $p$', { dot: true }]]);
        v.readout(() => info && `$E[\\psi_p]=${v.fix(info.E, 4)}$ hartree $\\;\\ge\\;E_0=-0.5000$ (excess ${v.fix(info.E + 0.5, 4)}, i.e. ${v.fix(100 * (info.E + 0.5) / 0.5, 1)} % of $|E_0|$) · $\\langle T\\rangle=${v.fix(info.kin, 3)}$\n weight on the exact $1s$ state $|c_{1s}|^2=${v.fix(info.c0, 3)}$ · best $p=${v.fix(info.pOpt, 4)}$ gives $E=${v.fix(info.Emin, 4)}$ (${v.fix(100 * (info.Emin + 0.5) / 0.5, 1)} % above)` + (info.f === 'gauss' ? `\nanalytic check, Gaussian: $E(p)=\\tfrac32p-2\\sqrt{2p/\\pi}=${v.fix(1.5 * info.p - 2 * Math.sqrt((2 * info.p) / Math.PI), 4)}$, minimum $-4/(3\\pi)=-0.4244$ at $p=8/(9\\pi)=0.2829$` : ''));
      },
    },
    // ------------------------------------------------------------------ 4.2
    {
      num: '4.2',
      kind: 'Method',
      name: 'Linear variation and the secular determinant',
      credit: 'Ritz, 1909; interlacing of roots: Hylleraas and Undheim, 1930, and MacDonald, 1933',
      statement: String.raw`Take trial functions $\psi=\sum_{i=1}^{N}c_i\chi_i$ from a fixed set of $N$ basis functions. Making the Rayleigh quotient stationary in the coefficients gives the generalised eigenvalue problem
$$\sum_j (H_{ij}-E\,S_{ij})\,c_j=0,\qquad H_{ij}=\langle\chi_i|H|\chi_j\rangle,\;S_{ij}=\langle\chi_i|\chi_j\rangle,$$
whose nontrivial solutions need the **secular determinant** $\det(\mathbf H-E\mathbf S)=0$. Its $N$ roots $E^{(N)}_1\le\dots\le E^{(N)}_N$ satisfy $E^{(N)}_k\ge E_k$ (each is an upper bound to the $k$-th exact level) and, when a basis function is added, they interlace: $E^{(N+1)}_k\le E^{(N)}_k\le E^{(N+1)}_{k+1}$.`,
      scope: String.raw`Orthonormal bases make $\mathbf S=\mathbf 1$; the bound and the interlacing hold for any basis of a Hermitian $H$ bounded below. The bounds are on eigenvalues only.`,
      idea: String.raw`In the span of the basis the Rayleigh quotient is a quotient of two quadratic forms, and its stationary points are the eigenvectors of the pencil $(\mathbf H,\mathbf S)$ (for $\mathbf S=\mathbf 1$ this is the real spectral theorem, ladr-7.29; invertibility of $\mathbf H-E\mathbf S$ fails exactly where its determinant vanishes, pma-9.36). The $N$-dimensional space is a subspace of the $(N+1)$-dimensional one, so the min-max principle forces each root down or keeps it as more functions are added, and the old roots can never fall below the next new root.`,
      caption: String.raw`A particle in a box $[0,1]$ ($\hbar=m=1$) with a Gaussian bump of height $V_0$ at the centre. The basis functions are the first $N$ levels of the *empty* box, $\sqrt2\sin(k\pi x)$. Drag the basis size $N$: the left panel plots the lowest roots against $N$ (dashed lines are the finite-difference exact levels) and every curve falls monotonically from above; the middle panel is the wavefunction of the chosen level in the current basis against the exact one; the right panel is the secular function $\operatorname{sgn}D\,|D|^{1/N}$ with $D(E)=\det(\mathbf H-E)$, whose zero crossings are the roots. Increase $V_0$ and watch how many functions are needed.`,
      deps: ['qchem-4.1', 'pma-9.36', 'ladr-7.29'],
      see: ['qm-12.2', 'qm-12.3'],
      refs: ['McQuarrie ch. 8', 'Szabo–Ostlund ch. 1'],
      tags: ['Rayleigh–Ritz', 'secular determinant', 'basis expansion'],
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Rayleigh%E2%80%93Ritz_method' },
      viz(v) {
        const M = v.M, NB = 14;
        const bump = (x) => Math.exp(-(((x - 0.5) / 0.09) ** 2));
        const B = boxMatrix(bump, NB, 1500);
        const nS = v.slider('basis size $N$', 1, NB, 3, { int: true });
        const V0 = v.slider('bump height $V_0$', 0, 800, 250, { step: 5 });
        const lev = v.select('level shown', [{ value: 0, label: '1st' }, { value: 1, label: '2nd' }, { value: 2, label: '3rd' }], 0);
        const sC = v.stage({ x: [0.5, NB + 0.5], y: [0, 100], axes: 'box', gutter: true, height: 320, weight: 1.05, minWidth: 280, xlabel: 'basis size N', ylabel: 'E (ħ=m=1)', title: 'roots against basis size' });
        const sW = v.stage({ x: [0, 1], y: [-2.2, 2.2], axes: 'box', gutter: true, height: 320, weight: 1, minWidth: 260, xlabel: 'x', ylabel: 'ψ', title: 'wavefunction' });
        const sD = v.stage({ x: [0, 100], y: [-1, 1], axes: 'box', gutter: true, height: 320, weight: 0.95, minWidth: 260, xlabel: 'E', ylabel: 'D(E), rescaled', title: 'secular function' });
        const Hn = (N, v0) => Array.from({ length: N }, (_, i) => Array.from({ length: N }, (_, j) => (i === j ? EBOX(i + 1) : 0) + v0 * B[i][j]));
        const roots = (N, v0) => M.eigSym(Hn(N, v0)).values.slice().reverse();
        let info = null, exactKey = '', exact = null;
        v.render(() => {
          const N = nS.value, v0 = V0.value, k = lev.value;
          if (exactKey !== String(v0)) { exact = M.schrodinger1D((x) => v0 * bump(x), [0, 1], { n: 700, k: 5 }); exactKey = String(v0); }
          const Ex = exact.E, hi = Math.max(Ex[3] * 1.2, 30);
          sC.setView([0.5, NB + 0.5], [0, hi]);
          for (let j = 0; j < 4; j++) sC.hline(Ex[j], { color: 'green', dash: true, alpha: 0.7 });
          const all = []; for (let n = 1; n <= NB; n++) all.push(roots(n, v0));
          for (let j = 0; j < 4; j++) {
            const pts = []; for (let n = j + 1; n <= NB; n++) pts.push([n, all[n - 1][j]]);
            sC.path(pts, { color: j === k ? 'accent' : 'muted', width: j === k ? 2.4 : 1.2, alpha: j === k ? 1 : 0.8 });
            sC.dots(pts.filter((q) => q[1] < hi), { r: 3, color: j === k ? 'accent' : 'muted' });
          }
          sC.vline(N, { color: 'orange', width: 1.6 });
          // wavefunction in the current basis
          const eg = M.eigSym(Hn(N, v0)), idx = N - 1 - Math.min(k, N - 1), c = eg.vecs[idx];
          const xs = M.linspace(0, 1, 301), psi = xs.map((x) => c.reduce((s, ci, i) => s + ci * Math.SQRT2 * Math.sin((i + 1) * Math.PI * x), 0));
          const pe = exact.psi[k], sg = psi.reduce((s, y, i) => s + y * M.clamp(pe[Math.round((i / 300) * (pe.length - 1))], -1e9, 1e9), 0) < 0 ? -1 : 1;
          sW.fn((x) => 4 * bump(x) * (v0 > 0 ? 1 : 0), { color: 'faint', fill: true, fillAlpha: 0.1, width: 1 });
          sW.hline(0, { color: 'faint' });
          sW.path(Array.from(exact.x, (x, i) => [x, pe[i]]), { color: 'green', width: 2, dash: true });
          sW.path(xs.map((x, i) => [x, sg * psi[i]]), { color: 'accent', width: 2.4 });
          sW.text('bump (shape only)', 0.5, -1.8, { color: 'faint', align: 'center', size: 11 });
          // secular function
          const rr = roots(N, v0), Emax = hi;
          sD.setView([0, Emax], [-1.2, 1.2]);
          const H = Hn(N, v0), pts = [];
          for (let i = 0; i <= 400; i++) { const E = (Emax * i) / 400, A = H.map((r, a) => r.map((x, b) => x - (a === b ? E : 0))), d = M.det(A); pts.push([E, Math.sign(d) * Math.abs(d) ** (1 / N)]); }
          const sc = Math.max(...pts.map((q) => Math.abs(q[1])), 1e-9); for (const q of pts) q[1] /= sc;
          sD.hline(0, { color: 'faint' });
          sD.path(pts.map(([e, y]) => [e, y]), { color: 'accent', width: 2 });
          for (const r of rr) if (r < Emax) sD.dot(r, 0, { r: 5, color: 'orange' });
          // checks
          let inter = true, upper = true;
          for (let j = 0; j < Math.min(N, 5); j++) { if (rr[j] < Ex[j] - 1e-3) upper = false; }
          if (N >= 2) { const prev = roots(N - 1, v0); for (let j = 0; j < N - 1; j++) if (!(rr[j] <= prev[j] + 1e-9 && prev[j] <= rr[j + 1] + 1e-9)) inter = false; }
          info = { r0: rr[k] ?? NaN, ex: Ex[k], inter, upper, N, have: k < N };
        });
        v.legend([['accent', 'roots / basis state'], ['green', 'exact (finite difference)', { dash: true }], ['orange', 'current $N$']]);
        v.readout(() => info && (info.have ? `level ${lev.value + 1}: $E^{(${info.N})}=${v.fix(info.r0, 3)}$ against exact $${v.fix(info.ex, 3)}$ (excess ${v.fix(info.r0 - info.ex, 3)}) · ` : `level ${lev.value + 1} does not exist yet with $N=${info.N}$ functions · `) + `bound $E^{(N)}_k\\ge E_k$ for all shown levels: ${info.upper ? '**holds**' : '**violated**'} · interlacing with $N-1$ roots: ${info.N < 2 ? 'n/a' : info.inter ? '**holds**' : '**violated**'}`);
      },
    },
    // ------------------------------------------------------------------ 4.3
    {
      num: '4.3',
      kind: 'Model',
      name: 'Variational helium: the effective charge 27/16',
      credit: 'Kellner, 1927 (effective nuclear charge in helium); Hylleraas, 1928–29 (correlated trial functions)',
      statement: String.raw`Take for the two electrons of a helium-like ion of nuclear charge $Z$ the product of two hydrogenic $1s$ functions with a common adjustable exponent $\zeta$, $\psi=\frac{\zeta^3}{\pi}e^{-\zeta(r_1+r_2)}$. Then, in hartree,
$$E(\zeta)=\underbrace{\zeta^2}_{\langle T\rangle}\;\underbrace{-\,2Z\zeta}_{\langle V_{ne}\rangle}\;+\;\underbrace{\tfrac58\zeta}_{\langle 1/r_{12}\rangle},$$
minimal at $\zeta^*=Z-\tfrac5{16}$ with $E(\zeta^*)=-(Z-\tfrac5{16})^2$. For helium, $\zeta^*=\tfrac{27}{16}=1.6875$ and $E=-2.8477$ hartree, $1.9\,\%$ above the exact non-relativistic energy $-2.9037$. Each electron screens the nucleus from the other by $\tfrac5{16}$ of a unit charge.`,
      scope: String.raw`A product of orbitals cannot describe the electrons avoiding each other (correlation); the remaining error, about $0.055$ hartree, is $1.5$ eV, and the Hartree–Fock limit (7.2) is only a little better than this single-parameter result. The same trial function does not bind H$^-$.`,
      idea: String.raw`Without repulsion the two electrons would each be a hydrogenic $1s$ electron with $\zeta=Z$ and $E=-Z^2$ ($-4$ hartree, $-108.8$ eV for helium); the repulsion integral $\langle1/r_{12}\rangle=\tfrac58\zeta$ is positive and grows with $\zeta$, so the best compromise lets the electrons spread out a little, i.e. lowers $\zeta$ below $Z$. Minimising the parabola gives the screening $\tfrac5{16}$. At the minimum $\langle T\rangle=-E$ and $\langle V\rangle=2E$, the virial theorem (4.9) in action, and by the variational principle (4.1) the result can never be below the exact energy.`,
      caption: String.raw`Choose the nuclear charge $Z$ and drag $\zeta$. Left: the three terms of $E(\zeta)$ and their sum, with the exact energy (dashed green) and the unscreened value $\zeta=Z$ (grey dot). Right: the radial density of one electron for your $\zeta$ and for $\zeta=Z$: with the charge screened the cloud is a little bigger. Notice that the minimum sits at $\zeta=Z-5/16$ for every $Z$, that for $Z=1$ the minimum lies *above* the energy of an H atom plus a free electron ($-0.5$), so this trial function wrongly predicts H$^-$ unbound, and that the percentage error shrinks with $Z$.`,
      deps: ['qchem-4.1', 'qchem-3.3', 'qm-12.4'],
      see: ['qm-12.4'],
      refs: ['McQuarrie ch. 8'],
      tags: ['helium', 'screening', 'variational'],
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Helium_atom' },
      viz(v) {
        // exact non-relativistic ground-state energies of two-electron ions (hartree)
        const EXACT = { 1: -0.527751, 2: -2.903724, 3: -7.279913, 4: -13.655566 };
        const Zs = v.select('nuclear charge $Z$', [{ value: 1, label: 'H$^-$ (1)' }, { value: 2, label: 'He (2)' }, { value: 3, label: 'Li$^+$ (3)' }, { value: 4, label: 'Be$^{2+}$ (4)' }], 2);
        const zS = v.slider('exponent $\\zeta$', 0.6, 5, 27 / 16, { step: 0.005 });
        const sE = v.stage({ x: [0.6, 5], y: [-9, 10], axes: 'box', gutter: true, height: 330, weight: 1.15, xlabel: 'ζ', ylabel: 'energy (hartree)', title: 'E(ζ) and its parts' });
        const sR = v.stage({ x: [0, 5], y: [0, 1.2], axes: 'box', gutter: true, height: 330, weight: 0.9, xlabel: 'r (bohr)', ylabel: '4πr²|φ|²', title: 'one electron' });
        let info = null;
        v.render(() => {
          const Z = +Zs.value, z = zS.value, E = (q) => q * q - 2 * Z * q + 0.625 * q, zo = Z - 5 / 16, lo = 0.6, hi = 5;
          const eMin = -(Z * Z) - 1, eMax = 3 * Z * Z / 2 + 4;
          sE.setView([lo, hi], [Math.min(-9, eMin * 1.0), Math.max(10, eMax)]);
          sE.hline(0, { color: 'faint' });
          sE.hline(EXACT[Z], { color: 'green', dash: true, width: 1.8 });
          sE.fn((q) => q * q, { color: 'orange', width: 1.4, alpha: 0.8 });
          sE.fn((q) => -2 * Z * q, { color: 'purple', width: 1.4, alpha: 0.8 });
          sE.fn((q) => 0.625 * q, { color: 'red', width: 1.4, alpha: 0.8 });
          sE.fn(E, { color: 'accent', width: 2.6 });
          sE.dot(zo, E(zo), { r: 5, color: 'green', label: 'minimum', labelPos: 'se' });
          sE.dot(Z, E(Z), { r: 5, color: 'muted', hollow: true, label: 'ζ = Z', labelPos: 'ne' });
          sE.vline(z, { color: 'gold', dash: true });
          sE.dot(z, E(z), { r: 7, color: 'gold' });
          const D = (q) => (r) => 4 * q ** 3 * r * r * Math.exp(-2 * q * r);
          sR.setView([0, 5 / Math.max(1, Z * 0.55)], [0, 1.5 * Z * 0.6 + 0.1]);
          sR.fn(D(Z), { color: 'muted', dash: true, width: 1.8 });
          sR.fn(D(z), { color: 'gold', width: 2.4, fill: true });
          info = { Z, z, e: E(z), zo, eo: E(zo), ex: EXACT[Z] };
        });
        v.legend([['accent', '$E(\\zeta)$'], ['orange', '$\\langle T\\rangle=\\zeta^2$'], ['purple', '$\\langle V_{ne}\\rangle$'], ['red', '$\\langle 1/r_{12}\\rangle$'], ['green', 'exact', { dash: true }]]);
        v.readout(() => info && `$E(\\zeta)=${v.fix(info.e, 4)}$ hartree (${v.fix(info.e * HARTREE_EV, 2)} eV) · minimum at $\\zeta^*=Z-\\tfrac5{16}=${v.fix(info.zo, 4)}$ with $E=${v.fix(info.eo, 4)}$ · exact $${v.fix(info.ex, 4)}$: error ${v.fix(100 * (info.eo - info.ex) / Math.abs(info.ex), 2)} %\nscreening by the other electron $\\sigma=Z-\\zeta^*=${v.fix(info.Z - info.zo, 4)}$ · at the minimum $\\langle T\\rangle/E=${v.fix(info.zo ** 2 / info.eo, 3)}$ (virial: $-1$)` + (info.Z === 1 ? `\n**this trial function lies above $-0.5$ (the H atom + free electron), so it fails to bind H$^-$**` : ''));
      },
    },
    // ------------------------------------------------------------------ 4.4
    {
      num: '4.4',
      kind: 'Method',
      name: 'First-order perturbation theory',
      credit: 'Rayleigh, 1877 (vibrating systems); Schrödinger, 1926 (quantum mechanics)',
      statement: String.raw`Let $H(\lambda)=H^{(0)}+\lambda W$ with $H^{(0)}\phi_n=E^{(0)}_n\phi_n$ and a **nondegenerate** level $E^{(0)}_n$. Then
$$E_n(\lambda)=E^{(0)}_n+\lambda\,\langle\phi_n|W|\phi_n\rangle+O(\lambda^2),\qquad |\psi_n\rangle=|\phi_n\rangle+\lambda\sum_{m\ne n}\frac{\langle\phi_m|W|\phi_n\rangle}{E^{(0)}_n-E^{(0)}_m}|\phi_m\rangle+O(\lambda^2).$$
The first-order energy is the average of the perturbation in the *unperturbed* state.`,
      scope: String.raw`Valid when $|\lambda W_{mn}|\ll|E^{(0)}_n-E^{(0)}_m|$ for the neighbouring levels; the series is in general only asymptotic. If $E^{(0)}_n$ is degenerate, 4.7 applies.`,
      idea: String.raw`Insert the power series $E=E^{(0)}+\lambda E^{(1)}+\cdots$, $\psi=\phi+\lambda\psi^{(1)}+\cdots$ into $(H^{(0)}+\lambda W)\psi=E\psi$ and collect powers of $\lambda$. At order $\lambda$ take the inner product with $\phi_n$; since $H^{(0)}$ is Hermitian (1.3) the term $\langle\phi_n|(H^{(0)}-E^{(0)}_n)\psi^{(1)}\rangle$ vanishes, leaving $E^{(1)}=\langle\phi_n|W|\phi_n\rangle$. Projecting on $\phi_m$ instead gives the coefficients of $\psi^{(1)}$, with the energy denominators.`,
      caption: String.raw`A particle in the box $[0,1]$ ($\hbar=m=1$, $E^{(0)}_n=n^2\pi^2/2$) is tilted by $W=Fx$. Drag $F$. Left: the exact levels (solid, from finite differences) and the first-order prediction $E^{(0)}_n+F/2$ (dashed): every level moves up at the *same* rate $F\langle x\rangle=F/2$, because each box state has $\langle x\rangle=\tfrac12$. Right: the actual state against the unperturbed one. The readout's ratio $\max_m|W_{mn}|/|E^{(0)}_n-E^{(0)}_m|$ is the small parameter: while it is small the line is accurate, and the dashed line peels away from the curve as it approaches 1.`,
      deps: ['qchem-1.3', 'qm-11.1'],
      see: ['qm-11.1'],
      refs: ['McQuarrie ch. 8'],
      tags: ['perturbation theory', 'first order', 'particle in a box'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Perturbation_theory_(quantum_mechanics)' },
      viz(v) {
        const M = v.M, FMAX = 80;
        const nS = v.select('level $n$', [1, 2, 3].map((n) => ({ value: n, label: String(n) })), 1);
        const fS = v.slider('tilt $F$ (slope of the floor)', -FMAX, FMAX, 25, { step: 0.5 });
        const sE = v.stage({ x: [-FMAX, FMAX], y: [0, 60], axes: 'box', gutter: true, height: 330, weight: 1.15, xlabel: 'F', ylabel: 'E (ħ = m = 1)', title: 'levels against the tilt' });
        const sP = v.stage({ x: [0, 1], y: [-0.2, 2.6], axes: 'box', gutter: true, height: 330, weight: 0.9, xlabel: 'x', ylabel: '|ψ|² and V', title: 'the state' });
        const curves = []; for (let i = 0; i <= 40; i++) { const F = -FMAX + (2 * FMAX * i) / 40; curves.push([F, boxLevels(M, F, 3).E]); }
        let info = null;
        v.render(() => {
          const n = +nS.value, F = fS.value, sol = boxLevels(M, F, 3), E = sol.E[n - 1];
          const lo = Math.min(...curves.map((c) => c[1][0])), hi = Math.max(...curves.map((c) => c[1][2]));
          sE.setView([-FMAX, FMAX], [Math.min(0, lo) - 2, hi + 3]);
          for (let j = 1; j <= 3; j++) {
            sE.path(curves.map((c) => [c[0], c[1][j - 1]]), { color: j === n ? 'accent' : 'muted', width: j === n ? 2.6 : 1.3 });
            sE.line(-FMAX, EBOX(j) - FMAX / 2, FMAX, EBOX(j) + FMAX / 2, { color: j === n ? 'orange' : 'faint', dash: true, width: j === n ? 1.8 : 1 });
          }
          sE.vline(F, { color: 'gold', dash: true });
          sE.dot(F, E, { r: 6, color: 'accent' });
          sE.dot(F, EBOX(n) + F / 2, { r: 6, color: 'orange', hollow: true });
          // state panel
          const ps = sol.psi[n - 1], dens = (x) => 2 * Math.sin(n * Math.PI * x) ** 2;
          sP.fn(dens, { color: 'muted', dash: true, width: 1.6 });
          sP.path(Array.from(sol.x, (x, i) => [x, ps[i] * ps[i]]), { color: 'accent', width: 2.4 });
          const vs = F === 0 ? 0 : 2.2 / Math.abs(F);
          sP.path([[0, F < 0 ? 2.4 : 0.1], [1, F < 0 ? 0.1 : 2.4]].map(([x, y]) => [x, y]), { color: 'red', width: 1.4, alpha: F === 0 ? 0 : 0.8 });
          void vs;
          const xe = ps.reduce((s, p, i) => s + p * p * sol.x[i], 0) * (sol.x[1] - sol.x[0]);
          sP.vline(0.5, { color: 'orange', dash: true }); sP.vline(xe, { color: 'accent', dash: true });
          let ratio = 0; for (let m = 1; m <= 40; m++) if (m !== n) ratio = Math.max(ratio, Math.abs(F * boxX(m, n)) / Math.abs(EBOX(n) - EBOX(m)));
          info = { n, F, E, e1: EBOX(n) + F / 2, ratio, xe };
        });
        v.legend([['accent', 'exact'], ['orange', 'first order $E^{(0)}+F/2$', { dash: true }], ['muted', 'unperturbed', { dash: true }], ['red', 'the tilted floor (shape)']]);
        v.readout(() => info && `$E_${info.n}$ exact $=${v.fix(info.E, 3)}$ · first order $E^{(0)}_${info.n}+\\langle W\\rangle=${v.fix(EBOX(info.n), 3)}+${v.fix(info.F / 2, 3)}=${v.fix(info.e1, 3)}$ · error ${v.fix(info.e1 - info.E, 3)}\nsmall parameter $\\max_m|W_{mn}|/|E^{(0)}_n-E^{(0)}_m|=${v.fix(info.ratio, 3)}$ · $\\langle x\\rangle$ in the perturbed state $=${v.fix(info.xe, 3)}$ (unperturbed: 0.500)`);
      },
    },
    // ------------------------------------------------------------------ 4.5
    {
      num: '4.5',
      kind: 'Method',
      name: 'Second-order perturbation theory',
      credit: 'Rayleigh, 1877; Schrödinger, 1926',
      statement: String.raw`For a nondegenerate level the second-order correction in $H=H^{(0)}+\lambda W$ is
$$E^{(2)}_n=\sum_{m\ne n}\frac{|\langle\phi_m|W|\phi_n\rangle|^2}{E^{(0)}_n-E^{(0)}_m},\qquad E_n=E^{(0)}_n+\lambda E^{(1)}_n+\lambda^2E^{(2)}_n+\cdots.$$
Every excited level $m$ above $n$ pushes it down, every level below pushes it up, and the push is stronger the closer the level and the larger the matrix element. In particular $E^{(2)}_0\le0$ for the ground state.`,
      scope: String.raw`Needs the sum over *all* states, including the continuum for atoms and molecules, which is why in practice it is evaluated by other means (Dalgarno–Lewis, finite basis, MP2 in 7.12).`,
      idea: String.raw`At order $\lambda^2$ the projection on $\phi_n$ gives $E^{(2)}=\langle\phi_n|W|\psi^{(1)}\rangle$; inserting the first-order state of 4.4, $\psi^{(1)}=\sum_m\phi_m W_{mn}/(E_n-E_m)$, produces the sum. For the ground state every denominator is negative, so the second-order correction is negative, which is also what the variational principle (4.1) requires of the exact curve $E_0(\lambda)$ near $\lambda=0$: it is concave.`,
      caption: String.raw`The same tilted box as 4.4. Left: exact $E_n(F)$ (solid) with the first-order line (dashed) and the line plus $F^2E^{(2)}$ (dotted): the parabola follows the curve much further. Right: the contributions $|x_{mn}|^2/(E_n-E_m)$ of each intermediate level $m$ to $E^{(2)}$ (blue pushes down, orange up) with the running total. Choose the level $n$: for $n=1$ everything pushes down and the nearest level dominates; for $n=2$ the level below pushes up. The readout compares the sum with the curvature measured from the exact levels at $\pm2$.`,
      deps: ['qchem-4.4', 'qm-11.2', 'qm-11.3'],
      see: ['qm-11.3'],
      refs: ['McQuarrie ch. 8'],
      tags: ['perturbation theory', 'second order', 'level repulsion'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Perturbation_theory_(quantum_mechanics)' },
      viz(v) {
        const M = v.M, FMAX = 80, MM = 14;
        const nS = v.select('level $n$', [1, 2, 3].map((n) => ({ value: n, label: String(n) })), 1);
        const fS = v.slider('tilt $F$', -FMAX, FMAX, 40, { step: 0.5 });
        const sE = v.stage({ x: [-FMAX, FMAX], y: [0, 60], axes: 'box', gutter: true, height: 330, weight: 1.15, xlabel: 'F', ylabel: 'E (ħ = m = 1)', title: 'one level against the tilt' });
        const sB = v.stage({ x: [0.5, MM + 0.5], y: [-1, 1], axes: 'box', gutter: true, height: 330, weight: 1, xlabel: 'intermediate level m', ylabel: 'contribution to E⁽²⁾', title: 'who pushes the level?' });
        const curves = []; for (let i = 0; i <= 40; i++) { const F = -FMAX + (2 * FMAX * i) / 40; curves.push([F, boxLevels(M, F, 3).E]); }
        const e2 = (n, terms) => { let s = 0; for (let m = 1; m <= terms; m++) if (m !== n) s += boxX(m, n) ** 2 / (EBOX(n) - EBOX(m)); return s; };
        let info = null;
        v.render(() => {
          const n = +nS.value, F = fS.value, E2 = e2(n, 400);
          const col = curves.map((c) => c[1][n - 1]), lo = Math.min(...col), hi = Math.max(...col);
          sE.setView([-FMAX, FMAX], [Math.min(lo, EBOX(n) - FMAX / 2 + 2 * 0) - 4, hi + 4]);
          sE.path(curves.map((c) => [c[0], c[1][n - 1]]), { color: 'accent', width: 2.6 });
          sE.line(-FMAX, EBOX(n) - FMAX / 2, FMAX, EBOX(n) + FMAX / 2, { color: 'orange', dash: true, width: 1.6 });
          sE.fn((f) => EBOX(n) + f / 2 + f * f * E2, { color: 'green', width: 2, dash: [2, 3] });
          sE.vline(F, { color: 'gold', dash: true });
          sE.dot(F, boxLevels(M, F, 3).E[n - 1], { r: 6, color: 'accent' });
          // contributions
          const cs = []; for (let m = 1; m <= MM; m++) cs.push(m === n ? 0 : boxX(m, n) ** 2 / (EBOX(n) - EBOX(m)));
          const mx = Math.max(...cs.map(Math.abs), 1e-6) * 1.8;
          sB.setView([0.5, MM + 0.5], [-mx, mx]);
          sB.hline(0, { color: 'faint' });
          let run = 0; const cum = [];
          cs.forEach((c, i) => { run += c; cum.push([i + 1, run]); });
          sB.bars(cs, { x0: 1, color: (val) => (val < 0 ? 'accent' : 'orange'), width: 0.7 });
          sB.path(cum, { color: 'green', width: 2 }); sB.dots(cum, { r: 3, color: 'green' });
          sB.hline(E2, { color: 'green', dash: true, alpha: 0.6 });
          const Fh = 2, lv = (f) => boxLevels(M, f, 3).E[n - 1];
          info = { n, F, E2, run, fd: ((lv(Fh) + lv(-Fh)) / 2 - lv(0)) / (Fh * Fh), ex: boxLevels(M, F, 3).E[n - 1] };
        });
        v.legend([['accent', 'exact level'], ['orange', 'first order', { dash: true }], ['green', 'first + second order', { dash: [2, 3] }]]);
        v.readout(() => info && `$E^{(2)}_${info.n}=\\sum_m|x_{m${info.n}}|^2/(E_${info.n}-E_m)=${v.fix(info.E2, 5)}$ (the ${MM} terms drawn sum to $${v.fix(info.run, 5)}$) · curvature from the exact levels at $F=\\pm2$: $${v.fix(info.fd, 5)}$\nat $F=${v.fix(info.F, 1)}$: exact $${v.fix(info.ex, 3)}$, first order $${v.fix(EBOX(info.n) + info.F / 2, 3)}$, with second order $${v.fix(EBOX(info.n) + info.F / 2 + info.F ** 2 * info.E2, 3)}$`);
      },
    },
    // ------------------------------------------------------------------ 4.6
    {
      num: '4.6',
      kind: 'Phenomenon',
      name: 'Stark effect and polarizability',
      credit: 'Stark, 1913 (observation); Schrödinger, 1926 and Epstein, 1926 (quantum theory); hydrogen polarizability $\\alpha=9/2$: Waller, 1926, and Wentzel, 1926',
      statement: String.raw`In a uniform field $\mathcal F$ along $z$ the hydrogen Hamiltonian acquires $W=\mathcal F z$ (atomic units, electron charge $-1$). The nondegenerate ground state shifts quadratically,
$$E_{1s}(\mathcal F)=-\tfrac12-\tfrac12\,\alpha\,\mathcal F^2+\cdots,\qquad \alpha=2\sum_{m}\frac{|\langle m|z|1s\rangle|^2}{E_m-E_{1s}}=\tfrac92\ \text{a.u.},$$
because $\langle z\rangle_{1s}=0$ and the field induces the dipole $p=\alpha\mathcal F$. The $n=2$ level is degenerate (2s and 2p), $z$ couples the 2s to the $2p_0$ state, and the first-order shifts are *linear*, $E=-\tfrac18\pm3\mathcal F$ (for the $m=0$ pair); the $2p_{\pm1}$ states do not shift to first order.`,
      scope: String.raw`Weak fields only: a real hydrogen atom in a static field is ionised by tunnelling (the levels are resonances). The numerical model below uses a finite basis that cannot ionise, so the slider stops at $\mathcal F=0.004$ a.u., where the $n=2$ levels are still well below the field's saddle point ($1\ \text{a.u.}=5.14\times10^{11}$ V/m; laboratory fields are $10^{-5}$ a.u. or less, so the effects drawn here are enormously exaggerated).`,
      idea: String.raw`For a nondegenerate level the first-order shift is $\langle z\rangle=0$ by parity (the unperturbed state has definite parity), so the leading effect is second order (4.5): the field mixes in $p$ states, which lowers the energy and shifts the electron *against* the field, giving the induced dipole. In the degenerate $n=2$ shell the correct zeroth-order states are mixtures of 2s and 2p (4.7), which already have a permanent dipole $\mp3$ a.u., hence the linear shift. The numbers below come from diagonalising $H_0+\mathcal Fz$ in a basis of $r^{l+1}e^{-\lambda r}L_k^{(2l+2)}(2\lambda r)Y_{l0}$ with $l\le4$.`,
      caption: String.raw`Left: the lowest $m=0$ levels of hydrogen against the field, computed by diagonalisation in a finite basis (solid). Choose the ground-state view for $E_{1s}(\mathcal F)-E_{1s}(0)$ against the textbook parabola $-\tfrac94\mathcal F^2$, or the $n=2$ shell for the linear shifts $-\tfrac18\pm3\mathcal F$ (dashed). Right: a cross-section of the electron cloud in the $xz$ plane; the field points along $+z$ (arrow). For the $1s$ state the picture is the *change* of density caused by the field (the shift is far too small to see in the density itself): charge moves toward $-z$ and leaves a deficit at $+z$. The two $n=2$ clouds are strongly one-sided from the start, one toward each side, and the readout's slope $dE/d\mathcal F$ equals the average $\langle z\rangle$ of that cloud.`,
      deps: ['qchem-4.5', 'qchem-2.1', 'qm-11.16'],
      see: ['qm-11.16'],
      refs: ['McQuarrie ch. 8'],
      tags: ['Stark effect', 'polarizability', 'hydrogen'],
      verify: true,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Stark_effect' },
      viz(v) {
        const M = v.M, LAM = 0.6, KB = 7, LM = 5, NR = 1600, RMAX = 70, AQ6 = RMAX / (NR * NR);
        // basis u_{kl}(r) = r^{l+1} e^{-λr} L_k^{(2l+2)}(2λr); matrices H0, S, Z (z-coupling) precomputed once (quadrature r = a(i+½)²)
        const fns = []; for (let l = 0; l <= LM; l++) for (let k = 0; k < KB; k++) fns.push({ l, k });
        const nF = fns.length, r = Float64Array.from({ length: NR }, (_, i) => AQ6 * (i + 0.5) ** 2), wq = Float64Array.from({ length: NR }, (_, i) => 2 * AQ6 * (i + 0.5));
        const U = fns.map(({ l, k }) => Float64Array.from(r, (x) => x ** (l + 1) * Math.exp(-LAM * x) * lagL(k, 2 * l + 2, 2 * LAM * x)));
        const dU = fns.map(({ l, k }) => Float64Array.from(r, (x) => { const L = lagL(k, 2 * l + 2, 2 * LAM * x), Lp = k > 0 ? -lagL(k - 1, 2 * l + 3, 2 * LAM * x) : 0; return Math.exp(-LAM * x) * ((l + 1) * x ** l * L - LAM * x ** (l + 1) * L + x ** (l + 1) * 2 * LAM * Lp); }));
        const S = [], H0 = [], Zm = [];
        for (let i = 0; i < nF; i++) { S.push(new Array(nF).fill(0)); H0.push(new Array(nF).fill(0)); Zm.push(new Array(nF).fill(0)); }
        for (let i = 0; i < nF; i++) for (let j = i; j < nF; j++) {
          const A = fns[i], B = fns[j]; let s = 0, hh = 0, z = 0;
          if (A.l === B.l) { for (let q = 0; q < NR; q++) { const w = wq[q]; s += w * U[i][q] * U[j][q]; hh += w * (0.5 * dU[i][q] * dU[j][q] + ((A.l * (A.l + 1)) / (2 * r[q] * r[q]) - 1 / r[q]) * U[i][q] * U[j][q]); } }
          else if (Math.abs(A.l - B.l) === 1) { const l = Math.min(A.l, B.l); for (let q = 0; q < NR; q++) z += wq[q] * U[i][q] * r[q] * U[j][q]; z *= (l + 1) / Math.sqrt((2 * l + 1) * (2 * l + 3)); }
          S[i][j] = S[j][i] = s; H0[i][j] = H0[j][i] = hh; Zm[i][j] = Zm[j][i] = z;
        }
        const solve = (F) => M.genEig(H0.map((row, i) => row.map((x, j) => x + F * Zm[i][j])), S);
        const base = solve(0), E00 = base.values[0];
        const FMAX = 0.004, NL = 4, NS = 25, mapF = Array.from({ length: NS + 1 }, (_, i) => (FMAX * i) / NS);
        const map = mapF.map((F) => solve(F).values.slice(0, NL));
        const fS = v.slider('field $\\mathcal F$ (a.u.)', 0, FMAX, 0.0025, { step: 0.0001, decimals: 4 });
        const lvS = v.select('state shown', [{ value: 0, label: '1s: change of density' }, { value: 1, label: '2nd level (n = 2)' }, { value: 2, label: '3rd level (n = 2)' }], 0);
        const viewS = v.select('left panel', [{ value: 'gs', label: 'ground-state shift' }, { value: 'n2', label: 'n = 2 shell' }], 'gs');
        const sM = v.stage({ x: [0, FMAX], y: [-12, 0], axes: 'box', gutter: true, height: 340, weight: 1.05, xlabel: 'field F (a.u.)', ylabel: 'E (hartree)', title: 'Stark map, m = 0' });
        const sC = v.stage({ x: [-6, 6], y: [-6, 6], equal: true, axes: 'box', gutter: true, height: 340, weight: 0.95, xlabel: 'x (bohr)', ylabel: 'z (bohr)', title: 'cloud in the xz plane' });
        // radial lookup tables R_kl(r) = u/r for the cloud
        const NT = 500, RC = 14, tab = fns.map(({ l, k }) => Float64Array.from({ length: NT + 1 }, (_, i) => { const x = Math.max((i / NT) * RC, 1e-9); return x ** l * Math.exp(-LAM * x) * lagL(k, 2 * l + 2, 2 * LAM * x); }));
        const legendre = (l, x) => { let p0 = 1, p1 = x; if (l === 0) return 1; for (let q = 2; q <= l; q++) { const p2 = ((2 * q - 1) * x * p1 - (q - 1) * p0) / q; p0 = p1; p1 = p2; } return p1; };
        const normed = (sol, k) => { const c = sol.vecs[k]; let nrm = 0, zz = 0; for (let i = 0; i < nF; i++) for (let j = 0; j < nF; j++) { nrm += c[i] * c[j] * S[i][j]; zz += c[i] * c[j] * Zm[i][j]; } const cut = c.map((x) => x / Math.sqrt(nrm)); return { cut, act: cut.map((x, i) => (Math.abs(x) > 1e-4 ? i : -1)).filter((i) => i >= 0), dz: zz / nrm }; };
        const psiAt = (st, x, z) => { const rr = Math.hypot(x, z); if (rr > RC - 0.1) return 0; const ct = rr < 1e-9 ? 1 : z / rr, f = (rr / RC) * NT, i0 = Math.min(NT - 1, Math.floor(f)), t = f - i0; let psi = 0; for (const i of st.act) { const l = fns[i].l; psi += st.cut[i] * (tab[i][i0] * (1 - t) + tab[i][i0 + 1] * t) * Math.sqrt((2 * l + 1) / (4 * Math.PI)) * legendre(l, ct); } return psi; };
        let info = null;
        v.render(() => {
          const F = fS.value, k = +lvS.value, sol = solve(F), E = sol.values[k], st = normed(sol, k), st0 = normed(base, 0), n2 = viewS.value === 'n2';
          if (!n2) {
            sM.setView([0, FMAX], [-6.5, 0.5]); sM.setLabels('field F (a.u.)', 'E(F) − E(0)  (10⁻⁵ hartree)');
            sM.hline(0, { color: 'faint' });
            sM.fn((f) => -2.25 * f * f * 1e5, { color: 'orange', dash: true, width: 1.6 });
            sM.path(mapF.map((f, i) => [f, (map[i][0] - E00) * 1e5]), { color: 'accent', width: 2.6 });
            sM.dot(F, (sol.values[0] - E00) * 1e5, { r: 6, color: 'gold' });
          } else {
            sM.setView([0, FMAX], [-0.15, -0.095]); sM.setLabels('field F (a.u.)', 'E (hartree)');
            sM.fn((f) => -0.125 - 3 * f, { color: 'green', dash: true, width: 1.6 }); sM.fn((f) => -0.125 + 3 * f, { color: 'green', dash: true, width: 1.6 });
            sM.hline(-0.125, { color: 'faint' });
            for (let j = 1; j < NL; j++) sM.path(mapF.map((f, i) => [f, map[i][j]]), { color: j === k ? 'accent' : 'muted', width: j === k ? 2.6 : 1.5 });
            if (k > 0) sM.dot(F, E, { r: 6, color: 'gold' });
          }
          sM.vline(F, { color: 'gold', dash: true, alpha: 0.6 });
          const key = `${F},${k}`;
          if (k === 0) {
            let mx = 1e-12; for (let a = -6; a <= 6; a += 0.5) for (let b = -6; b <= 6; b += 0.5) mx = Math.max(mx, Math.abs(psiAt(st, a, b) ** 2 - psiAt(st0, a, b) ** 2));
            sC.raster((x, z) => { const rr = Math.hypot(x, z); if (rr > RC - 0.1) return null; const d = (psiAt(st, x, z) ** 2 - psiAt(st0, x, z) ** 2) / mx; return v.diverge(M.clamp(d * 1.4, -1, 1), 'orange', 'accent'); }, { res: 3, key });
          } else {
            sC.raster((x, z) => { const rr = Math.hypot(x, z); if (rr > RC - 0.1) return null; return v.ramp(Math.sqrt(Math.min(1, (psiAt(st, x, z) ** 2 * 4 * Math.PI) / 0.12)), 'accent', 'panel'); }, { res: 3, key });
          }
          sC.dot(0, 0, { r: 3, color: 'ink' });
          sC.arrow(4.8, -1.2, 4.8, 1.8, { color: 'red', width: 2 }); sC.text('field', 4.8, 2.4, { color: 'red', align: 'center', size: 11 });
          sC.setTitle(k === 0 ? '1s: density with field minus without (blue +, orange −)' : 'electron density |ψ|²');
          info = { F, k, E, dz: st.dz, alpha: F > 0 ? (-2 * (sol.values[0] - E00)) / (F * F) : NaN, slope: (solve(F + 1e-4).values[k] - solve(Math.max(0, F - 1e-4)).values[k]) / (F > 1e-4 ? 2e-4 : 1e-4) };
        });
        v.legend([['accent', 'computed levels'], ['orange', '$-\\tfrac94\\mathcal F^2$', { dash: true }], ['green', '$-\\tfrac18\\pm3\\mathcal F$', { dash: true }]]);
        v.readout(() => info && `level ${info.k + 1}: $E=${v.fix(info.E, 6)}$ hartree · $\\langle z\\rangle=${v.fix(info.dz, 4)}$ bohr · slope $dE/d\\mathcal F=${v.fix(info.slope, 4)}$ (equals $\\langle z\\rangle$, see 4.8)\nground-state polarizability from the curvature: $\\alpha_{\\rm est}=-2(E_{1s}(\\mathcal F)-E_{1s}(0))/\\mathcal F^2=${isNaN(info.alpha) ? '—' : v.fix(info.alpha, 3)}$ a.u. (exact $4.5$) · $\\mathcal F=${v.fix(info.F, 4)}$ a.u. $=${v.fix(info.F * 5.14220674763e11 / 1e9, 2)}$ GV/m`);
      },
    },
  ],
};
