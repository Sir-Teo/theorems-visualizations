// Quantum Chemistry & Spectroscopy — Chapter 3: Many-electron atoms and the periodic table (items 3.1–3.7; 3.8–3.13 are in ch03-b.js)
import { TAU, HARTREE_EV, radialLevels, SYM, IE, groundConfig, madelung, configText, tablePos, blockOf, ORDER, cap, subN, subL, sup, EXCEPTIONS, slaterGroups, slaterShield, slaterZeff, NSTAR } from './ch03.shared.js';

// Particle-in-a-box orbital on [0,1]
const phi = (n, x) => Math.SQRT2 * Math.sin(n * Math.PI * x);
const SUB = '₀₁₂₃₄₅₆₇₈₉';

export default {
  collection: 'qchem',
  chapter: 3,
  title: 'Many-electron atoms and the periodic table',
  summary: String.raw`With more than one electron the Schrödinger equation can no longer be solved exactly, but antisymmetry and screening explain almost everything. The Pauli principle and Slater determinants fix how electrons share orbitals, effective nuclear charge sets the filling order, and Hund's rules pick the ground term. The periodic table, with its trends and its exceptions, falls out; relativity colours gold, and Mendeleev's 1869 table is the empirical pattern all of this explains.`,
  items: [
    // ------------------------------------------------------------------ 3.1
    {
      num: '3.1',
      kind: 'Principle',
      name: 'Pauli exclusion principle and antisymmetry',
      credit: 'Pauli, 1925; antisymmetric wavefunctions: Heisenberg and Dirac, 1926',
      statement: String.raw`Electrons are identical spin-$\tfrac12$ particles, and the complete wavefunction (space and spin) of any system of them changes sign when the coordinates of two electrons are interchanged:
$$\Psi(\dots,\mathbf q_i,\dots,\mathbf q_j,\dots)=-\Psi(\dots,\mathbf q_j,\dots,\mathbf q_i,\dots),\qquad \mathbf q=(\mathbf r,\sigma).$$
Consequently no two electrons can occupy the same spin-orbital (Pauli's exclusion principle, 1925), two electrons of the same spin have vanishing probability density at the same point, and a spatially symmetric two-electron state must be a spin singlet while an antisymmetric one is a triplet.`,
      scope: String.raw`Applies to any fermions; for non-interacting electrons it is exactly the statement that a state is an antisymmetrised product of orbitals (3.2). Pauli's 1925 formulation was for electrons in an atom before the wavefunction was known; the antisymmetry form is the later one.`,
      idea: String.raw`Pauli found in 1925 that the closed shells of the periodic system (2, 8, 18, 32 electrons) are reproduced if every electron has four quantum numbers and no two electrons in an atom may share all four. Once wave mechanics and spin were in place (2.7), Heisenberg and Dirac showed in 1926 that this is a consequence of the exchange antisymmetry of the total wavefunction. If two electrons of the same spin sit at the same point the antisymmetric $\Psi$ equals minus itself there, hence is zero; for two electrons in the same spin-orbital the antisymmetrised function cancels identically.`,
      caption: String.raw`The plane is the pair $(x_1,x_2)$ for two electrons in a one-dimensional box, built from box orbitals $\phi_a,\phi_b$ (blue positive, orange negative). Choose **distinguishable product**, **symmetric spatial part** (spin singlet) or **antisymmetric spatial part** (same spin, $\uparrow\uparrow$). In the antisymmetric case a nodal line runs along the diagonal $x_1=x_2$ and the right panel shows the probability of a small separation vanishing; set $a=b$ and the whole state disappears. The symmetric state does the opposite and piles probability onto the diagonal.`,
      deps: ['qchem-2.7', 'qm-10.3'],
      see: ['qm-10.3'],
      refs: ['McQuarrie ch. 9', 'Szabo–Ostlund ch. 2'],
      tags: ['Pauli principle', 'antisymmetry', 'identical particles'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Pauli_exclusion_principle' },
      viz(v) {
        const M = v.M;
        const aS = v.slider('orbital $a$ (electron 1 in the product)', 1, 4, 1, { int: true });
        const bS = v.slider('orbital $b$', 1, 4, 2, { int: true });
        const mode = v.select('two-electron state', [{ value: 'prod', label: 'distinguishable product' }, { value: 'sym', label: 'symmetric space (singlet)' }, { value: 'anti', label: 'antisymmetric space (same spin)' }], 'anti');
        const sH = v.stage({ x: [0, 1], y: [0, 1], equal: true, axes: 'box', gutter: true, height: 340, weight: 1, xlabel: 'x₁ / L', ylabel: 'x₂ / L', title: '$\\Psi(x_1,x_2)$' });
        const sD = v.stage({ x: [0, 1], y: [0, 3], axes: 'box', gutter: true, height: 340, weight: 1, xlabel: 'separation |x₁ − x₂| / L', ylabel: 'probability density', title: 'how close can the electrons get?' });
        const psi = (a, b, md, x, y) => {
          if (md === 'prod') return phi(a, x) * phi(b, y);
          const p = (phi(a, x) * phi(b, y) + (md === 'sym' ? 1 : -1) * phi(b, x) * phi(a, y)) / Math.SQRT2;
          return a === b ? (md === 'sym' ? phi(a, x) * phi(a, y) : 0) : p;
        };
        let info = null;
        v.render(() => {
          const a = aS.value, b = bS.value, md = mode.value, key = `${a},${b},${md}`;
          // normalisation, distribution of separations, diagonal
          const N = 90, h = 1 / N, bins = new Float64Array(30); let nrm = 0, diag = 0, near = 0;
          for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
            const x = (i + 0.5) * h, y = (j + 0.5) * h, p = psi(a, b, md, x, y) ** 2;
            nrm += p * h * h; bins[Math.min(29, Math.floor(Math.abs(x - y) * 30))] += p * h * h;
          }
          for (let i = 0; i <= 200; i++) { const x = i / 200; diag = Math.max(diag, Math.abs(psi(a, b, md, x, x))); }
          const ref = new Float64Array(30); let nref = 0;
          for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const p = (phi(a, (i + 0.5) * h) * phi(b, (j + 0.5) * h)) ** 2 * h * h; ref[Math.min(29, Math.floor(Math.abs(i - j) / N * 30))] += p; nref += p; }
          const dens = (arr, tot) => Array.from(arr, (c) => (tot > 1e-12 ? (c / tot) * 30 : 0));
          const dd = dens(bins, nrm), dr = dens(ref, nref);
          const area = (arr, k) => arr.slice(0, k).reduce((s, c) => s + c / 30, 0);
          const ymax = Math.max(1, ...dd, ...dr) * 1.15;
          sD.setView([0, 1], [0, ymax]);
          sD.path(dr.flatMap((c, i) => [[i / 30, c], [(i + 1) / 30, c]]), { color: 'muted', width: 1.4, dash: true });
          sD.path(dd.flatMap((c, i) => [[i / 30, c], [(i + 1) / 30, c]]), { color: 'accent', width: 2.2 });
          sD.vline(0.1, { color: 'faint' });
          sH.heat((x, y) => { const p = psi(a, b, md, x, y); return p / 2; }, { range: [-1, 1], cmap: 'theme-diverging', neg: 'orange', pos: 'accent', res: 3, key });
          sH.line(0, 0, 1, 1, { color: 'ink', width: 1.4, dash: true });
          const t1 = [0.3, 0.7], t2 = [0.7, 0.3];
          const sw = psi(a, b, md, t1[0], t1[1]) + (md === 'prod' ? 0 : psi(a, b, md, t2[0], t2[1]));
          info = { nrm, diag, near: area(dd, 3), nearRef: area(dr, 3), md, a, b, swap: [psi(a, b, md, 0.3, 0.7), psi(a, b, md, 0.7, 0.3)], sw };
        });
        v.legend([['accent', 'this state', {}], ['muted', 'distinguishable product', { dash: true }], ['ink', 'x₁ = x₂', { dash: true }]]);
        v.readout(() => info && `$\\int|\\Psi|^2=${v.fix(info.nrm, 3)}$ (${info.nrm < 1e-9 ? '**the state is identically zero**: two same-spin electrons cannot share an orbital' : 'normalised'}) · largest $|\\Psi|$ on the diagonal $x_1=x_2$: ${v.fix(info.diag, 3)}` + `\n$\\Psi(0.3,0.7)=${v.fix(info.swap[0], 3)}$, $\\Psi(0.7,0.3)=${v.fix(info.swap[1], 3)}$ — ${info.md === 'anti' ? 'exchange flips the sign (antisymmetric)' : info.md === 'sym' ? 'exchange leaves it unchanged (symmetric)' : 'no symmetry imposed'}` + `\nprobability that $|x_1-x_2|<0.1L$: ${v.fix(100 * info.near, 1)} % (distinguishable product with the same orbitals: ${v.fix(100 * info.nearRef, 1)} %)`);
      },
    },
    // ------------------------------------------------------------------ 3.2
    {
      num: '3.2',
      kind: 'Definition',
      name: 'Slater determinant',
      credit: 'Slater, 1929 (determinants of orbitals: Heisenberg and Dirac, 1926)',
      statement: String.raw`Given $N$ orthonormal spin-orbitals $\chi_1,\dots,\chi_N$ (each an orbital times a spin function $\alpha$ or $\beta$), their **Slater determinant** is the antisymmetrised product
$$\Psi(\mathbf q_1,\dots,\mathbf q_N)=\frac1{\sqrt{N!}}\begin{vmatrix}\chi_1(\mathbf q_1)&\chi_2(\mathbf q_1)&\cdots&\chi_N(\mathbf q_1)\\ \chi_1(\mathbf q_2)&\chi_2(\mathbf q_2)&\cdots&\chi_N(\mathbf q_2)\\ \vdots&&&\vdots\\ \chi_1(\mathbf q_N)&\chi_2(\mathbf q_N)&\cdots&\chi_N(\mathbf q_N)\end{vmatrix}.$$
It is normalised, changes sign when two electrons are exchanged (two rows swap), and vanishes if two spin-orbitals coincide (two columns equal) or if two electrons of equal spin are at the same point (two rows equal).`,
      scope: String.raw`A single determinant is the simplest wavefunction of independent fermions and the starting point of Hartree–Fock theory; it is generally not the exact many-electron state, which needs a combination of determinants (correlation).`,
      idea: String.raw`The properties of a determinant (pma-9.34: alternating under row swaps, zero when rows or columns repeat) are exactly the requirements of the Pauli principle (3.1). Expanding along a row writes $\Psi$ as the signed sum of the $N!$ permutations of the electrons among the orbitals, and the $1/\sqrt{N!}$ normalises it when the orbitals are orthonormal. Dirac and Heisenberg wrote antisymmetric combinations in 1926; Slater's 1929 paper put the spin-orbitals, spin included, into the determinant.`,
      caption: String.raw`Three electrons live in a box. Choose three spin-orbitals (columns) from $1\uparrow,\dots,3\downarrow$, drag the electrons along the rails (electron 2 can be flipped to $\downarrow$), and read the $3\times3$ matrix of orbital values at their positions. The right panel shows $\Psi$ as a function of $x_1,x_2$ with electron 3 fixed. Try: read the sign flip of the exchanged determinant in the readout; choose the same spin-orbital twice (the determinant is zero everywhere); drag electron 2 onto electron 1 with equal spins (a nodal line).`,
      deps: ['qchem-3.1', 'pma-9.34'],
      see: ['pma-9.34'],
      refs: ['Szabo–Ostlund ch. 2'],
      tags: ['Slater determinant', 'antisymmetry', 'Hartree–Fock'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Slater_determinant' },
      viz(v) {
        const M = v.M;
        const OPT = [1, 2, 3].flatMap((n) => [{ value: `${n}u`, label: `${n}↑` }, { value: `${n}d`, label: `${n}↓` }]);
        const c1 = v.select('column 1: spin-orbital', OPT, '1u'), c2 = v.select('column 2', OPT, '1d'), c3 = v.select('column 3', OPT, '2u');
        const spin2 = v.toggle('electron 2 has spin ↓', false);
        const sA = v.stage({ x: [0, 1], y: [-2.3, 2.2], axes: 'box', gutter: true, height: 340, weight: 1.1, xlabel: 'position in the box', ylabel: 'orbital value', title: 'orbitals and electrons' });
        const sB = v.stage({ x: [0, 1], y: [0, 1], equal: true, axes: 'box', gutter: true, height: 340, weight: 0.9, xlabel: 'x₁', ylabel: 'x₂', title: '$\\Psi$ with electron 3 fixed' });
        const ROW = [-1.55, -1.85, -2.15], X0 = [0.2, 0.5, 0.8];
        const e = [0, 1, 2].map((i) => sA.handle(X0[i], ROW[i], { color: ['accent', 'orange', 'green'][i], r: 8, constrain: (x) => [M.clamp(x, 0.02, 0.98), ROW[i]], label: `${i + 1}` }));
        const parse = (s) => ({ n: +s[0], s: s[1] === 'u' ? 1 : -1 });
        const det3 = (A) => A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) - A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) + A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0]);
        const wf = (cols, xs, ss) => det3(xs.map((x, i) => cols.map((c) => (c.s === ss[i] ? phi(c.n, x) : 0)))) / Math.sqrt(6);
        let info = null;
        v.render(() => {
          const cols = [c1.value, c2.value, c3.value].map(parse);
          const ss = [1, spin2.value ? -1 : 1, -1];
          const xs = e.map((h) => h.x);
          for (let n = 1; n <= 3; n++) sA.fn((x) => phi(n, x), { color: ['accent', 'orange', 'green'][n - 1], alpha: 0.28, width: 1.5 });
          sA.hline(0, { color: 'faint' });
          e.forEach((h, i) => {
            sA.line(h.x, ROW[i], h.x, 0, { color: 'faint', dash: true });
            sA.text(ss[i] > 0 ? '↑' : '↓', h.x, ROW[i] + 0.3, { color: 'ink', size: 15, align: 'center' });
            cols.forEach((c) => { if (c.s === ss[i]) sA.dot(h.x, phi(c.n, h.x), { r: 4, color: 'gold' }); });
          });
          sB.heat((x, y) => wf(cols, [x, y, xs[2]], ss) / 2.2, { range: [-1, 1], cmap: 'theme-diverging', neg: 'orange', pos: 'accent', res: 3, key: `${cols.map((c) => c.n + '' + c.s)},${ss},${xs[2].toFixed(3)}` });
          sB.dot(xs[0], xs[1], { r: 6, color: 'gold' });
          sB.line(0, 0, 1, 1, { color: 'faint', dash: true });
          const A = xs.map((x, i) => cols.map((c) => (c.s === ss[i] ? phi(c.n, x) : 0)));
          const psi = det3(A) / Math.sqrt(6);
          const psiSw = wf(cols, [xs[1], xs[0], xs[2]], [ss[1], ss[0], ss[2]]);
          info = { A, psi, psiSw, dup: cols[0].n === cols[1].n && cols[0].s === cols[1].s || cols[0].n === cols[2].n && cols[0].s === cols[2].s || cols[1].n === cols[2].n && cols[1].s === cols[2].s };
        });
        v.legend([['gold', 'orbital value at the electron', { dot: true }]]);
        v.readout(() => info && `$\\begin{vmatrix}${info.A.map((r) => r.map((x) => v.fix(x, 2)).join('&')).join('\\\\')}\\end{vmatrix}/\\sqrt6=${v.fix(info.psi, 4)}$` + `\nelectrons 1 and 2 exchanged (positions and spins): $\\Psi=${v.fix(info.psiSw, 4)}$ ${Math.abs(info.psi) < 1e-9 ? '(both zero)' : '= $-\\Psi$ ✓'}` + (info.dup ? `\n**two columns are the same spin-orbital: the determinant vanishes for every position.**` : ''));
      },
    },
    // ------------------------------------------------------------------ 3.3
    {
      num: '3.3',
      kind: 'Model',
      name: 'Helium and electron–electron repulsion',
      statement: String.raw`For helium (and the ions $\mathrm{H^-},\mathrm{Li^+},\dots$ with two electrons and nuclear charge $Z$) the Hamiltonian is, in hartree,
$$\hat H=-\tfrac12\nabla_1^2-\tfrac12\nabla_2^2-\frac Z{r_1}-\frac Z{r_2}+\frac1{r_{12}} .$$
Dropping the repulsion $1/r_{12}$ leaves two hydrogen-like electrons with $E^{(0)}=-Z^2$ ($-4$ hartree, $-108.8$ eV for He), far below the measured $-79.0$ eV. In the product of two $1s$ orbitals the repulsion has the expectation value $\langle1/r_{12}\rangle=\tfrac58Z$, giving the first-order energy $-Z^2+\tfrac58Z$ ($-2.75$ hartree for He), and relaxing the orbital exponent gives $-(Z-\tfrac5{16})^2$ ($-2.848$ hartree).`,
      scope: String.raw`Non-relativistic, infinite nuclear mass, ground state $1s^2$ ($^1S$). The experimental reference below is the sum of the first and second ionization energies of helium; it contains small relativistic and mass corrections that these models do not.`,
      idea: String.raw`The nuclear attraction and the repulsion are comparable in size, so the electron–electron term cannot be treated as a small correction: in the ground state it raises the energy by about 30 eV. The first-order estimate ignores that each electron pushes the other away from the nucleus; letting the orbital expand (an effective charge $\zeta<Z$, the variational principle of chapter 4) recovers most of the remainder. What is still missing, about 1.5 eV, is the correlation of the two electrons' instantaneous positions, which no product of one-electron orbitals contains.`,
      caption: String.raw`Slide **$\lambda$** from 0 (no repulsion) to 1 (full repulsion) and the nuclear charge **$Z$** (2 is helium; at $Z=1$ the same bookkeeping asks whether $\mathrm{H^-}$ is bound). Bars show the independent-electron, first-order and variational energies in eV; for $Z=2$ the measured value from NIST ionisation energies is drawn for comparison. The right panel shows one electron's radial distribution at the bare charge and at the relaxed exponent $\zeta=Z-5\lambda/16$: the other electron screens the nucleus.`,
      deps: ['qchem-2.9', 'qchem-3.1'],
      refs: ['McQuarrie ch. 9'],
      tags: ['helium', 'electron repulsion', 'screening'],
      links: { nist: 'https://physics.nist.gov/cgi-bin/ASD/ie.pl?spectra=He&units=1' },
      viz(v) {
        const Hv = HARTREE_EV, Eexp = -(24.587389 + 54.417766);
        const lam = v.slider('repulsion switched on, $\\lambda$', 0, 1, 1, { step: 0.01 });
        const zS = v.slider('nuclear charge $Z$', 1, 6, 2, { int: true });
        const sE = v.stage({ x: [0.4, 4.6], y: [-125, 5], axes: 'box', gutter: true, height: 340, weight: 1.2, xticks: [[1, 'no repulsion'], [2, 'first order'], [3, 'variational'], [4, 'experiment']], ylabel: 'E (eV)', title: 'ground-state energy' });
        const sR = v.stage({ x: [0, 5], y: [0, 1], axes: 'box', gutter: true, height: 340, weight: 1, xlabel: 'r / a₀', ylabel: 'radial distribution', title: 'one electron, $P(r)=4\\zeta^3r^2e^{-2\\zeta r}$' });
        let st = null;
        v.render(() => {
          const Z = zS.value, L = lam.value, z = Z - (5 * L) / 16;
          const E = [-Z * Z, -Z * Z + (5 * Z * L) / 8, -z * z], Eev = E.map((x) => x * Hv);
          const lo = -Z * Z * Hv * 1.12;
          sE.setView([0.4, 4.6], [lo, Math.abs(lo) * 0.05]);
          sE.hline(0, { color: 'faint' });
          const cols = ['muted', 'orange', 'accent'];
          Eev.forEach((e, i) => { sE.rect(i + 0.65, 0, i + 1.35, e, { fill: cols[i], fillAlpha: 0.55, color: cols[i] }); sE.text(v.fix(e, 1), i + 1, e - Math.abs(lo) * 0.035, { color: 'ink', align: 'center', size: 12 }); });
          if (Z === 2 && L === 1) { sE.rect(3.65, 0, 4.35, Eexp, { fill: 'green', fillAlpha: 0.55, color: 'green' }); sE.text(v.fix(Eexp, 1), 4, Eexp - Math.abs(lo) * 0.035, { color: 'ink', align: 'center', size: 12 }); }
          else sE.text(Z === 2 ? 'set λ = 1' : 'not shown', 4, lo * 0.4, { color: 'muted', align: 'center', size: 12 });
          const P = (zz) => (r) => 4 * zz ** 3 * r * r * Math.exp(-2 * zz * r);
          const rmax = 5 / Math.max(1, Z * 0.55);
          sR.setView([0, 5 / Math.max(1, Z * 0.5)], [0, 1.15 * Math.max(...[...Array(200)].map((_, i) => P(Z)((i / 199) * rmax * 2)), ...[...Array(200)].map((_, i) => P(z)((i / 199) * rmax * 2)))]);
          sR.fn(P(Z), { color: 'muted', width: 2, dash: true, fill: 'muted', fillAlpha: 0.08 });
          sR.fn(P(z), { color: 'accent', width: 2.4, fill: 'accent', fillAlpha: 0.14 });
          sR.vline(1.5 / z, { color: 'accent', dash: true });
          st = { Z, L, z, E, Eev, ie1: (-Z * Z / 2) - E[1], ie2: (-Z * Z / 2) - E[2] };
        });
        v.legend([['muted', 'bare charge ζ = Z', { dash: true }], ['accent', 'screened ζ = Z − 5λ/16'], ['green', 'experiment (He)', { area: true }]]);
        v.readout(() => st && `$Z=${st.Z}$, $\\lambda=${v.fix(st.L, 2)}$: independent electrons $${v.fix(st.E[0], 3)}$ Eh; first order $${v.fix(st.E[1], 4)}$ Eh; variational $\\zeta=${v.fix(st.z, 4)}$, $E=${v.fix(st.E[2], 4)}$ Eh.` + (st.Z === 2 && st.L === 1 ? `\nvs experiment $-79.005$ eV $=${v.fix(Eexp / Hv, 4)}$ Eh: errors **${v.fix(st.Eev[0] - Eexp, 1)}** eV (${v.fix((100 * (st.Eev[0] - Eexp)) / Math.abs(Eexp), 0)} %), **${v.fix(st.Eev[1] - Eexp, 2)}** eV (${v.fix((100 * Math.abs(st.Eev[1] - Eexp)) / Math.abs(Eexp), 1)} %), **${v.fix(st.Eev[2] - Eexp, 2)}** eV (${v.fix((100 * Math.abs(st.Eev[2] - Eexp)) / Math.abs(Eexp), 1)} %). Ionisation energy: first order ${v.fix(st.ie1 * Hv, 1)} eV, variational ${v.fix(st.ie2 * Hv, 1)} eV, measured 24.587 eV.` : '') + (st.Z === 1 && st.L === 1 ? `\nThe variational energy $${v.fix(st.E[2], 4)}$ Eh is **above** the neutral atom ($-0.5$ Eh): with a single $1s^2$ product $\\mathrm{H^-}$ does not come out bound.` : ''));
      },
    },
    // ------------------------------------------------------------------ 3.4
    {
      num: '3.4',
      kind: 'Model',
      name: 'Shielding and effective nuclear charge',
      credit: 'Slater, 1930; Clementi and Raimondi, 1963',
      statement: String.raw`In an atom with nuclear charge $Z$ an electron at distance $r$ feels the nucleus screened by the electrons inside its sphere: roughly $Z_{\rm eff}(r)=Z-N_{\rm inside}(r)$, which falls from $Z$ near the nucleus to $Z-(N-1)$ far away. An outer electron's behaviour is summarised by a single number $Z_{\rm eff}=Z-s$ with $s$ the **shielding constant**, so that its orbital resembles a hydrogenic one of charge $Z_{\rm eff}$ and energy $\approx-\tfrac12(Z_{\rm eff}/n^*)^2$. Slater's rules estimate $s$ by counting: $0.35$ per other electron in the same $(ns,np)$ group ($0.30$ for $1s$), $0.85$ for each electron in shell $n-1$, $1.00$ for each deeper one.`,
      scope: String.raw`Slater's rules are an empirical fit to atomic data (1930) and give $s$ to within a few tenths; the Clementi–Raimondi values quoted in the figure come from self-consistent-field orbitals. The model potential below uses Slater-type orbitals for the screening electrons and does not iterate to self-consistency.`,
      idea: String.raw`Gauss's law for spherically symmetric charge (the shell theorem) says that an electron sees only the charge enclosed by its sphere, so inner electrons screen almost completely, same-shell electrons only partly (they are at similar radii and sometimes outside), and outer ones not at all. A penetrating orbital ($s$ more than $p$ more than $d$ at the same $n$) spends part of its time inside the core where $Z_{\rm eff}$ is large, which is why the energies of $s,p,d$ electrons of one shell split in a many-electron atom, although the hydrogenic energies of 2.2 do not (2.6).`,
      caption: String.raw`Pick an element from Li to Ar and the valence subshell. Left: the enclosed-charge picture $Z_{\rm eff}(r)=Z-N_{\rm core}(r)-N_{\rm mates}(r)$ built from Slater-type densities of the core and of the other valence electrons (orange), with the valence radial distribution $r^2R^2$ computed in that potential (blue). Right: Slater's $Z_{\rm eff}$ of the outermost group for Li–Ar (bars) with the self-consistent Clementi–Raimondi values for the second period (dots).`,
      deps: ['qchem-3.3'],
      refs: ['McQuarrie ch. 9'],
      tags: ['screening', 'effective nuclear charge', 'Slater rules'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Slater%27s_rules' },
      viz(v) {
        const M = v.M;
        const zS = v.slider('atomic number $Z$', 3, 18, 11, { int: true });
        const lSel = v.select('valence subshell', [{ value: '0', label: 's' }, { value: '1', label: 'p' }, { value: '2', label: 'd (unoccupied)' }], '0');
        const CRs = { 3: 1.279, 4: 1.912, 5: 2.421, 6: 3.136, 7: 3.834, 8: 4.453, 9: 5.100, 10: 5.758 };
        const sP = v.stage({ x: [0, 8], y: [0, 12], axes: 'box', gutter: true, height: 340, weight: 1.2, xlabel: 'r / a₀', ylabel: 'Z_eff(r)', title: 'charge seen at radius $r$' });
        const sB = v.stage({ x: [2.4, 18.6], y: [0, 7], axes: 'box', gutter: true, height: 340, weight: 1, xlabel: 'atomic number Z', ylabel: 'Z_eff of the outer electron', title: 'across the periods' });
        const cache = {};
        const model = (Z, l) => {
          const key = Z + ',' + l; if (cache[key]) return cache[key];
          const occ = groundConfig(Z), gs = slaterGroups(occ), nv = Z <= 10 ? 2 : 3, gi = gs.findIndex((g) => g.n === nv), gv = gs[gi];
          const zeta = (g, i) => (Z - slaterShield(gs, i)) / NSTAR[g.n];
          const coreG = gs.map((g, i) => ({ g, i })).filter((o) => o.g.n < nv);
          const F = (g, i, r) => M.gammaP(2 * NSTAR[g.n] + 1, 2 * zeta(g, i) * r);
          const mates = gv.N - 1, zv = zeta(gv, gi);
          const Zr = (r) => Z - coreG.reduce((s, o) => s + o.g.N * F(o.g, o.i, r), 0) - mates * M.gammaP(2 * NSTAR[nv] + 1, 2 * zv * r);
          const Vr = (r) => -Zr(r) / r;
          const lv = (L) => radialLevels(M, Vr, L, nv - L, { rmax: 45, h: 0.03 });
          const out = { occ, Zr, nv, gv, sl: Z - slaterShield(gs, gi), Ncore: coreG.reduce((s, o) => s + o.g.N, 0), mates, res: {} };
          for (const L of [0, 1, 2]) { if (L >= nv) continue; const R = lv(L), k = nv - L - 1; let rr = 0, r1 = 0; const u = R.u[k]; for (let i = 0; i < u.length; i++) { rr += u[i] * u[i] * R.h; r1 += u[i] * u[i] * R.r(i) * R.h; } out.res[L] = { E: R.E[k], u, h: R.h, r1 }; }
          return (cache[key] = out);
        };
        let st = null;
        v.render(() => {
          const Z = zS.value; let l = +lSel.value; const m0 = model(Z, 0), nv = m0.nv; if (l >= nv) { l = nv - 1; lSel.set(String(l)); }
          const m = model(Z, l), R = m.res[l];
          sP.setView([0, nv === 2 ? 5 : 8], [0, Z + 0.6]);
          sP.fn(m.Zr, { color: 'orange', width: 2.4, domain: [0.005, 12] });
          sP.hline(Z - m.Ncore - m.mates, { color: 'faint', dash: true });
          sP.hline(m.sl, { color: 'green', dash: true, width: 1.3 });
          // radial distribution u^2 (scaled to fit)
          const u = R.u, h = R.h, pts = []; let mx = 0; for (let i = 0; i < u.length; i += 1) mx = Math.max(mx, u[i] * u[i]);
          const sc = (Z * 0.45) / mx; for (let i = 0; i < u.length && (i + 1) * h < 14; i += 3) pts.push([(i + 1) * h, u[i] * u[i] * sc]);
          sP.path(pts, { color: 'accent', width: 2.2 });
          sP.dot(R.r1, m.Zr(R.r1), { r: 6, color: 'gold' });
          // bars: Slater across Li..Ar
          const vals = []; for (let z = 3; z <= 18; z++) vals.push(slaterZeff(z, slaterGroups(groundConfig(z)).findIndex((g) => g.n === (z <= 10 ? 2 : 3))));
          sB.bars(vals, { x0: 3, dx: 1, color: (val, i) => (i + 3 === Z ? 'accent' : 'muted') });
          Object.entries(CRs).forEach(([z, y]) => sB.dot(+z, y, { r: 5, color: 'green' }));
          st = { Z, l, m, R, nv, cr: CRs[Z] };
        });
        v.legend([['orange', '$Z_{\\rm eff}(r)$ from the enclosed charge'], ['accent', 'valence $r^2R^2$ (scaled)'], ['green', 'Slater $Z-s$ (line) · Clementi–Raimondi (dots)', { dot: true }], ['gold', '$\\langle r\\rangle$', { dot: true }]]);
        v.readout(() => { if (!st) return ''; const { Z, m, nv } = st; const e = (L) => (m.res[L] ? `${nv}${'spd'[L]}: ${v.fix(m.res[L].E, 3)} Eh` : ''); return `${SYM[Z - 1]} (Z=${Z}), ${configText(Z)}. Slater: $Z_{\\rm eff}=Z-s=${v.fix(m.sl, 2)}$` + (st.cr ? `; Clementi–Raimondi ${v.fix(st.cr, 3)}` : '') + `\nmodel orbital energies in the frozen-core potential: ${[0, 1, 2].map(e).filter(Boolean).join(' < ')} — the $s$ electron penetrates the core and is bound more strongly than $p$, then $d$. $\\langle r\\rangle_{${nv}${'spd'[st.l]}}=${v.fix(st.R.r1, 2)}\\,a_0$ where $Z_{\\rm eff}(r)=${v.fix(m.Zr(st.R.r1), 2)}$.`; });
      },
    },
    // ------------------------------------------------------------------ 3.5
    {
      num: '3.5',
      kind: 'Principle',
      name: 'Aufbau principle and the Madelung rule',
      credit: 'Bohr, early 1920s (building-up); Madelung, 1936 (rule)',
      statement: String.raw`The **Aufbau** (building-up) principle: the ground configuration of an atom is obtained by adding electrons one at a time to the available subshells, lowest first, at most $2(2l+1)$ in each (Pauli). The **Madelung rule** gives the order empirically: subshells fill in order of increasing $n+l$, and for equal $n+l$ in order of increasing $n$,
$$1s,\;2s,\;2p,\;3s,\;3p,\;4s,\;3d,\;4p,\;5s,\;4d,\;5p,\;6s,\;4f,\;5d,\;6p,\;7s,\;5f,\;6d,\;7p .$$
The block structure of the periodic table (2, 6, 10, 14 columns for s, p, d, f) is the capacity of the subshells in this order.`,
      scope: String.raw`A rule of thumb: it predicts the experimental ground configuration of most elements but not of about 20 with $Z\le103$ (Cr, Cu, Nb, Mo, Ru, Rh, Pd, Ag, La, Ce, Gd, Pt, Au, Ac, Th, Pa, U, Np, Cm, Lr; 3.11), and it describes neutral-atom ground states only, not ions (a $\mathrm{Fe^{2+}}$ ion loses its $4s$ electrons first).`,
      idea: String.raw`In a hydrogen-like atom all subshells of a shell share one energy (2.6); in a many-electron atom penetration and shielding (3.4) lift $p$ above $s$, $d$ above $p$ and $f$ above $d$ of the same $n$, and the lift is large enough that $4s$ (which penetrates the argon core) lies close to or below $3d$. Ordering by $n+l$ summarises the competition between the growing radius $n$ and the rising effective repulsion with $l$. Bohr's building-up picture of the periods dates from the early 1920s; Madelung stated the $n+l$ rule in 1936.`,
      caption: String.raw`Move the atomic number $Z$ along the table. The ladder shows the subshells in Madelung order (alternate bands share the same $n+l$) with arrows added by Hund's rule; the table highlights the element and shades the filled part, ringing in red every element whose real ground configuration (NIST for $Z\le86$) differs from the Madelung prediction. Flip **Madelung prediction** to see the filling the rule would give; the readout names the subshells that differ.`,
      deps: ['qchem-3.4', 'qchem-2.6'],
      see: ['qm-10.9'],
      refs: ['McQuarrie ch. 9'],
      tags: ['Aufbau', 'Madelung rule', 'periodic table'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Aufbau_principle' },
      viz(v) {
        const zS = v.slider('atomic number $Z$', 1, 103, 26, { int: true });
        const mad = v.toggle('show the Madelung prediction instead of experiment', false);
        const sL = v.stage({ x: [-3.1, 7.6], y: [-0.8, 19.2], axes: false, height: 470, weight: 0.5, minWidth: 250, title: 'subshells in Madelung order' });
        const sT = v.stage({ x: [-0.7, 17.7], y: [-9.6, 0.6], equal: true, axes: false, height: 380, weight: 1.8, minWidth: 420, title: 'the table: filled up to Z' });
        const BL = { s: 'accent', p: 'green', d: 'orange', f: 'purple' };
        let st = null;
        v.render(() => {
          const Z = zS.value, occE = groundConfig(Z), occM = madelung(Z), occ = mad.value ? occM : occE;
          // ladder
          ORDER.forEach((sub, i) => {
            const nl = subN(sub) + subL(sub), y = i, nb = 2 * subL(sub) + 1, k = occ[sub] || 0, diff = (occE[sub] || 0) !== (occM[sub] || 0);
            if (nl % 2 === 0) sL.rect(-3.0, y - 0.5, 7.5, y + 0.5, { fill: 'faint', fillAlpha: 0.1, stroke: false });
            sL.text(sub, -1.5, y, { color: diff ? 'red' : 'ink', size: 13, align: 'right', baseline: 'middle', math: true });
            sL.text(`${nl}`, -0.55, y, { color: 'muted', size: 10, align: 'center', baseline: 'middle' });
            for (let b = 0; b < nb; b++) {
              const up = k > b, dn = k > nb + b;
              sL.rect(b * 1 + 0.05, y - 0.38, b * 1 + 0.95, y + 0.38, { color: diff ? 'red' : 'muted', fill: k ? BL[sub[1]] : false, fillAlpha: up ? 0.14 : 0, width: diff ? 1.6 : 1 });
              if (up) sL.text('↑', b + 0.33, y, { color: 'ink', size: 12, align: 'center', baseline: 'middle' });
              if (dn) sL.text('↓', b + 0.7, y, { color: 'ink', size: 12, align: 'center', baseline: 'middle' });
            }
          });
          sL.text('n + l', -0.55, 19.0, { color: 'muted', size: 10, align: 'center' });
          // table
          for (let z = 1; z <= 103; z++) {
            const [c, r] = tablePos(z), bl = blockOf(z), ex = !!EXCEPTIONS[z], cur = z === Z;
            sT.rect(c - 0.46, -r - 0.46, c + 0.46, -r + 0.46, { color: cur ? 'gold' : ex ? 'red' : 'faint', fill: BL[bl], fillAlpha: z <= Z ? 0.5 : 0.1, width: cur ? 3 : ex ? 1.8 : 0.8 });
            sT.text(SYM[z - 1], c, -r, { size: 11, align: 'center', baseline: 'middle', color: z <= Z ? 'ink' : 'muted' });
          }
          sT.text('La–Lu ▸', 1.5, -8, { color: 'muted', size: 10, align: 'right', baseline: 'middle' }); sT.text('Ac–Lr ▸', 1.5, -9, { color: 'muted', size: 10, align: 'right', baseline: 'middle' });
          const dif = ORDER.filter((x) => (occE[x] || 0) !== (occM[x] || 0));
          st = { Z, dif, nexc: Object.keys(EXCEPTIONS).filter((k) => +k <= Z).length };
        });
        v.legend([['accent', 's block'], ['green', 'p block'], ['orange', 'd block'], ['purple', 'f block'], ['red', 'differs from Madelung', { dot: true }]]);
        v.readout(() => { if (!st) return ''; const { Z, dif } = st; return `**${SYM[Z - 1]}** ($Z=${Z}$), block ${blockOf(Z)}: experiment ${configText(Z)} · Madelung ${configText(Z, madelung(Z))}` + (dif.length ? `\n**exception**: ${dif.map((x) => `${x} ${madelung(Z)[x] || 0} → ${groundConfig(Z)[x] || 0}`).join(', ')}.` : '\nthe rule is right for this element.') + ` Exceptions among the first ${Z} elements: ${st.nexc}.`; });
      },
    },
    // ------------------------------------------------------------------ 3.6
    {
      num: '3.6',
      kind: 'Concept',
      name: 'Exchange energy and the Fermi hole',
      statement: String.raw`Antisymmetry keeps two electrons of the same spin apart even when they do not interact. If an electron of spin $\sigma$ sits at the origin, the density of other electrons of the same spin at distance $r$ is $n_\sigma\,g_{\sigma\sigma}(r)$ with $g_{\sigma\sigma}\to0$ as $r\to0$: a **Fermi (exchange) hole** surrounds each electron. For the non-interacting uniform electron gas of density $n$ (Fermi wavenumber $k_F=(3\pi^2n)^{1/3}$)
$$g_{\sigma\sigma}(r)=1-\Big[\frac{3\,j_1(k_Fr)}{k_Fr}\Big]^2,\qquad g_{\sigma,-\sigma}(r)=1,$$
the hole contains exactly one electron, $n_\sigma\!\int(g_{\sigma\sigma}-1)\,d^3r=-1$, and the Coulomb energy of an electron with its hole is the **exchange energy** $e_x=-\dfrac{3k_F}{4\pi}$ hartree per electron, i.e. $-0.458/r_s$ for $r_s=(3/4\pi n)^{1/3}$ in bohr.`,
      scope: String.raw`Exact for the uniform gas of non-interacting electrons (a Slater determinant of plane waves). In atoms and molecules the hole has the same size scale but is anisotropic; and real electrons also avoid each other through Coulomb correlation, which this picture leaves out (opposite spins are uncorrelated here).`,
      idea: String.raw`In a Slater determinant (3.2) two same-spin rows evaluated at the same point are identical, so the pair density has a node at coincidence; integrating the determinant's pair density over all the other electrons shows that the missing density exactly equals one electron. Electrons of opposite spin do not appear in the same determinant row structure, so they are uncorrelated at this level. The hole lowers the energy because each electron's Coulomb repulsion is computed against a cloud that has had its own-spin neighbours removed: this is the exchange energy, which is why parallel spins in different orbitals are stabilised in atoms (Hund, 3.8).`,
      caption: String.raw`The reference electron (gold) sits at the centre. The map shows $g(r)$, the relative density of a second electron of the chosen spin relation, in a plane through the centre; the right panel plots $g$ along a radius. Change the density through $r_s$: the hole radius is of order $r_s$ (higher density, smaller hole). Same spin: a hole opens, with a first overshoot ring; opposite spin: flat. The readout integrates the hole numerically (it must hold exactly one electron) and the exchange energy.`,
      deps: ['qchem-3.2'],
      refs: ['Szabo–Ostlund ch. 2'],
      tags: ['exchange energy', 'Fermi hole', 'electron gas'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Exchange_interaction' },
      viz(v) {
        const M = v.M;
        const rsS = v.slider('density: Wigner–Seitz radius $r_s$ (a₀)', 1, 6, 2, { step: 0.05 });
        const rel = v.select('second electron has', [{ value: 'same', label: 'the same spin' }, { value: 'opp', label: 'opposite spin' }], 'same');
        const sM = v.stage({ x: [-8, 8], y: [-8, 8], equal: true, axes: 'box', gutter: true, height: 360, weight: 1, xlabel: 'x / a₀', ylabel: 'y / a₀', title: 'relative density $g(r)$ around one electron' });
        const sG = v.stage({ x: [0, 8], y: [0, 1.25], axes: 'box', gutter: true, height: 360, weight: 1, xlabel: 'distance r / a₀', ylabel: 'g(r)', title: 'along a radius' });
        const j1 = (x) => (x < 1e-3 ? x / 3 : (Math.sin(x) - x * Math.cos(x)) / (x * x));
        const gSame = (x) => (x < 1e-6 ? 0 : 1 - (3 * j1(x) / x) ** 2);
        let st = null;
        v.render(() => {
          const rs = rsS.value, kF = Math.cbrt((9 * Math.PI) / 4) / rs, same = rel.value === 'same';
          const g = (r) => (same ? gSame(kF * r) : 1);
          sM.heat((x, y) => g(Math.hypot(x, y)), { range: [0, 1.7], cmap: 'theme', color: 'accent', res: 3, key: `${rs.toFixed(3)},${rel.value}` });
          sM.dot(0, 0, { r: 6, color: 'gold' });
          sM.circle(0, 0, rs, { color: 'ink', dash: true, fill: false });
          sG.hline(1, { color: 'faint', dash: true });
          sG.fn(g, { color: 'accent', width: 2.4, domain: [0, 8], n: 500 });
          sG.fn((r) => 1, { color: 'faint', width: 0.001, fill: 'accent', fillAlpha: 0.13, base: 0 });
          sG.vline(rs, { color: 'muted', dash: true });
          // sum rule and exchange energy (same spin), spin density n_sigma = kF^3 / (6 pi^2)
          const nsig = kF ** 3 / (6 * Math.PI * Math.PI), R = 600 / kF;
          const hole = nsig * 4 * Math.PI * (M.integrate((r) => (gSame(kF * r) - 1) * r * r, 0, R, 60000) - 4.5 / (kF ** 4 * R));
          const ex = 0.5 * nsig * 4 * Math.PI * M.integrate((r) => (gSame(kF * r) - 1) * r, 0, R, 60000);
          let rh = 0; for (let r = 0; r < 20; r += 0.01) { if (nsig * 4 * Math.PI * M.integrate((q) => (1 - gSame(kF * q)) * q * q, 0, r, 200) >= 0.5) { rh = r; break; } }
          st = { rs, kF, hole, ex, exTh: (-3 * kF) / (4 * Math.PI), rh, same };
        });
        v.legend([['accent', 'g(r)'], ['muted', 'g = 1: uncorrelated pair', { dash: true }], ['ink', 'r = r_s', { dash: true }]]);
        v.readout(() => st && `$r_s=${v.fix(st.rs, 2)}$, $k_F=${v.fix(st.kF, 3)}\\,a_0^{-1}$. Hole content (same spin): $n_\\sigma\\!\\int(g-1)\\,d^3r=${v.fix(st.hole, 4)}$ — one missing electron (the $r^{-4}$ tail beyond the integration range is added analytically). Half of it lies within $${v.fix(st.rh, 2)}\\,a_0=${v.fix(st.rh / st.rs, 2)}\\,r_s$.` + `\nexchange energy per electron from the hole, $\\tfrac12 n_\\sigma\\!\\int(g-1)/r\\,d^3r=${v.fix(st.ex, 4)}$ Eh; closed form $-3k_F/4\\pi=${v.fix(st.exTh, 4)}$ Eh $=-0.458/r_s=${v.fix(-0.4582 / st.rs, 4)}$.` + (st.same ? '' : `\nopposite spins: $g\\equiv1$, no hole, no exchange energy between them.`));
      },
    },
    // ------------------------------------------------------------------ 3.7
    {
      num: '3.7',
      kind: 'Definition',
      name: 'Russell–Saunders term symbols',
      credit: 'Russell and Saunders, 1925',
      statement: String.raw`When spin–orbit coupling is small, the electrons' orbital angular momenta add to a total $\mathbf L$ and their spins to a total $\mathbf S$ (Russell–Saunders or LS coupling), and a configuration splits into **terms** labelled $^{2S+1}L$ with $L=\mathrm S,\mathrm P,\mathrm D,\mathrm F,\mathrm G,\dots$ for $L=0,1,2,3,4,\dots$; each term has $(2S+1)(2L+1)$ states, and spin–orbit coupling splits it further into levels $^{2S+1}L_J$, $J=|L-S|,\dots,L+S$. The terms of a configuration are found by listing its microstates $(M_L,M_S)$, allowed by the Pauli principle, and peeling off rectangles: take the largest $M_S$, then the largest $M_L$ remaining, remove the block $|M_L|\le L,\ |M_S|\le S$ of that term, and repeat.`,
      scope: String.raw`Valid for light atoms where electron repulsion dominates spin–orbit coupling (roughly $Z$ below about 50 in the ground configurations); for heavy atoms $jj$ coupling is a better starting point. A term symbol labels a configuration's multiplet; the relative energies of the terms need a calculation, Hund's rules (3.8) give only the lowest.`,
      idea: String.raw`Closed subshells have $L=S=0$ and drop out, so only open subshells matter. The Pauli principle (3.1) removes microstates in which two electrons share $(m_l,m_s)$, which is why $p^2$ has $15$ states instead of $36$ and keeps only $^3P,{}^1D,{}^1S$ and not $^3D$, $^1P$, $^3S$. The counting works because the total angular momentum ladder (addition of angular momenta, qm-7.14) gives each term a full $(M_L,M_S)$ rectangle.`,
      caption: String.raw`Choose a configuration. The grid counts the microstates at each $(M_L,M_S)$. Move **terms peeled off** to remove one rectangle at a time (the next one is outlined): at the end the grid is empty, so every state has been assigned to a term. For $p^2$ and $p^4$ the right panel shows the measured levels of carbon and oxygen (NIST), in the order Hund's rules predict.`,
      deps: ['qchem-3.1', 'qchem-2.8', 'qm-7.14'],
      see: ['qm-7.14'],
      refs: ['McQuarrie ch. 9'],
      tags: ['term symbols', 'LS coupling', 'microstates'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Term_symbol' },
      viz(v) {
        const CF = { p2: [1, 2, 'p²'], p3: [1, 3, 'p³'], p4: [1, 4, 'p⁴'], d2: [2, 2, 'd²'], d3: [2, 3, 'd³'], f2: [3, 2, 'f²'] };
        const sel = v.select('configuration', Object.entries(CF).map(([k, c]) => ({ value: k, label: c[2] })), 'p2');
        const kS = v.slider('terms peeled off', 0, 12, 0, { int: true });
        const sG = v.stage({ x: [-4, 4], y: [-4, 4], axes: false, height: 400, weight: 1.35, title: 'microstates by $M_L$ (rows) and $M_S$ (columns)' });
        const sE = v.stage({ x: [0, 4], y: [0, 3], axes: 'box', gutter: true, height: 400, weight: 0.9, xticks: [], ylabel: 'energy above the ground level (cm⁻¹)', title: 'measured levels (NIST)' });
        const LET = 'SPDFGHIKL';
        const NIST = { p2: { el: 'carbon C I', lv: [['³P', 0], ['¹D', 10192.657], ['¹S', 21648.030]], fine: [0, 16.4167, 43.4135] }, p4: { el: 'oxygen O I', lv: [['³P', 0], ['¹D', 15867.862], ['¹S', 33792.583]], fine: [0, 158.265, 226.977] } };
        const cache = {};
        const build = (key) => {
          if (cache[key]) return cache[key];
          const [l, n] = CF[key], orbs = []; for (let m = -l; m <= l; m++) for (const s of [1, -1]) orbs.push([m, s]);
          const cnt = {}; let total = 0;
          const rec = (start, left, ML, MS2) => { if (!left) { const k = ML + ',' + MS2; cnt[k] = (cnt[k] || 0) + 1; total++; return; } for (let i = start; i < orbs.length; i++) rec(i + 1, left - 1, ML + orbs[i][0], MS2 + orbs[i][1]); };
          rec(0, n, 0, 0);
          const work = { ...cnt }, terms = [];
          for (;;) {
            let S2 = -99; for (const k in work) if (work[k] > 0) S2 = Math.max(S2, +k.split(',')[1]);
            if (S2 < 0 && !Object.values(work).some((x) => x > 0)) break;
            let L = -99; for (const k in work) { const [a, b] = k.split(',').map(Number); if (work[k] > 0 && b === S2) L = Math.max(L, a); }
            terms.push({ L, S2 });
            for (let a = -L; a <= L; a++) for (let b = -S2; b <= S2; b += 2) work[a + ',' + b]--;
          }
          let rem = cnt; const snaps = [{ ...cnt }]; const w2 = { ...cnt };
          for (const t of terms) { for (let a = -t.L; a <= t.L; a++) for (let b = -t.S2; b <= t.S2; b += 2) w2[a + ',' + b]--; snaps.push({ ...w2 }); }
          return (cache[key] = { l, n, cnt, total, terms, snaps });
        };
        const tl = (t) => `^{${t.S2 + 1}}${LET[t.L]}`;
        let st = null;
        v.render(() => {
          const D = build(sel.value), K = Math.min(kS.value, D.terms.length); if (kS.value !== K) kS.set(K);
          const Lmax = D.n * D.l - 0, rows = Object.keys(D.cnt).map((k) => +k.split(',')[0]), mls = [Math.min(...rows), Math.max(...rows)];
          const cols = Object.keys(D.cnt).map((k) => +k.split(',')[1]); const ms2 = [Math.min(...cols), Math.max(...cols)];
          const nR = mls[1] - mls[0] + 1, nC = (ms2[1] - ms2[0]) / 2 + 1;
          sG.setView([-0.8 - nC / 2, nC / 2 + 0.8], [mls[0] - 2.1, mls[1] + 1.4]);
          const snap = D.snaps[K];
          for (let a = mls[0]; a <= mls[1]; a++) { sG.text(`${a}`, -nC / 2 - 0.45, a, { color: 'muted', size: 11, align: 'right', baseline: 'middle' }); }
          for (let b = ms2[0], i = 0; b <= ms2[1]; b += 2, i++) {
            const x = -nC / 2 + 0.5 + i; sG.text(b % 2 === 0 ? `${b / 2}` : `${b}/2`, x, mls[0] - 0.95, { color: 'muted', size: 11, align: 'center' });
            for (let a = mls[0]; a <= mls[1]; a++) {
              const c0 = D.cnt[a + ',' + b] || 0, c = snap[a + ',' + b] || 0, nxt = D.terms[K];
              const inNext = nxt && Math.abs(a) <= nxt.L && Math.abs(b) <= nxt.S2;
              if (c0 > 0) sG.rect(x - 0.45, a - 0.42, x + 0.45, a + 0.42, { color: inNext ? 'orange' : 'faint', width: inNext ? 2.4 : 0.8, fill: c > 0 ? 'accent' : false, fillAlpha: c > 0 ? 0.08 + 0.1 * c : 0 });
              if (c0 > 0) sG.text(`${c}`, x, a, { size: 13, align: 'center', baseline: 'middle', color: c > 0 ? 'ink' : 'faint' });
            }
          }
          sG.text('$M_S$', 0, mls[0] - 1.65, { color: 'muted', size: 12, align: 'center' }); sG.text('$M_L$', -nC / 2 - 0.5, mls[1] + 1.0, { color: 'muted', size: 12, align: 'right' });
          // right panel
          const data = NIST[sel.value];
          sE.el.style.display = data ? '' : 'none';
          if (data) {
            const ymax = data.lv[2][1] * 1.12; sE.setView([0, 4], [-ymax * 0.04, ymax]);
            data.lv.forEach(([nm, e], i) => { sE.segment([0.5, e], [2.2, e], { color: ['accent', 'orange', 'purple'][i], width: 3 }); sE.text(`$^{${nm[0] === '³' ? 3 : 1}}${nm[1]}$  ${v.fix(e, e > 100 ? 0 : 0)}`, 2.35, e, { size: 12, baseline: 'middle', color: 'ink' }); });
            sE.text(data.el, 0.5, ymax * 0.95, { color: 'muted', size: 12 });
          }
          st = { D, K, data };
        });
        v.legend([['orange', 'next term to remove', {}]]);
        v.readout(() => { if (!st) return ''; const { D, K, data } = st; const found = D.terms.slice(0, K); const left = Object.values(D.snaps[K]).reduce((s, c) => s + c, 0); const all = D.terms.map((t) => `$${tl(t)}$`).join(', ');
          const dsum = D.terms.reduce((s, t) => s + (t.S2 + 1) * (2 * t.L + 1), 0);
          return `${D.total} microstates ($\\binom{${2 * (2 * D.l + 1)}}{${D.n}}$). Peeled off: ${found.length ? found.map((t) => `$${tl(t)}$ (${(t.S2 + 1) * (2 * t.L + 1)})`).join(' + ') : 'none yet'} — **${left}** states left.` + (K === D.terms.length ? `\nterms: ${all}; dimensions add to ${dsum} = ${D.total} ✓. Hund's rules: ground term $${tl(D.terms[0])}$ (largest $S$, then largest $L$).` : '') + (data ? `\n${data.el}: levels of $^3P$ at ${data.fine.map((x) => v.fix(x, 1)).join(', ')} cm⁻¹ (J = ${sel.value === 'p2' ? '0, 1, 2' : '2, 1, 0'} listed in order), $^1D$ at ${v.fix(data.lv[1][1], 0)}, $^1S$ at ${v.fix(data.lv[2][1], 0)} cm⁻¹.` : ''); });
      },
    },
  ],
};
