// Syllabus — Quantum Chemistry & Spectroscopy (curated course; see collection.js for references)
// Refs: "McQuarrie" = McQuarrie, Quantum Chemistry (2nd ed., 2008); "Szabo–Ostlund" = Modern Quantum Chemistry (Dover).
//
// Sources consulted (research pass, 2026-10):
//   - MIT OCW 5.61 Physical Chemistry (Fall 2017), lecture list and readings keyed to McQuarrie 2e chapters:
//     https://ocw.mit.edu/courses/5-61-physical-chemistry-fall-2017/pages/lecture-notes/
//     https://ocw.mit.edu/courses/5-61-physical-chemistry-fall-2017/pages/readings
//     (McQuarrie 2e: ch. 3 box, 4 postulates, 5 oscillator + vibrational spectra, 6 rigid rotor + rotational
//      spectra, 7 hydrogen, 8 approximation methods, 9 many-electron atoms, 10 one-/two-electron bonds,
//      11 qualitative bonding incl. Hückel, 12 Hartree–Fock–Roothaan, CI/CC/DFT)
//   - Szabo & Ostlund TOC (ch. 1 math review, 2 many-electron wavefunctions, 3 Hartree–Fock, 4 CI, 5 pair and
//     coupled-pair theories, 6 many-body perturbation theory, 7 Green's functions):
//     https://opac.library.iiitk.ac.in/bib/2596 ; https://store.doverpublications.com (Dover ed.)
//   - UC Berkeley CHEM 122 description (group theory, vibronic spectra, Franck–Condon):
//     https://axs.studentorg.berkeley.edu/cocclasses/coursedes/chem122.html
//   - Wikipedia: https://en.wikipedia.org/wiki/Molecular_symmetry ;
//     https://en.wikipedia.org/wiki/List_of_scientific_laws_named_after_people (Kasha, El-Sayed, Beer–Lambert)
// Gaps filled after comparison: ladder operators, time-dependent wave packets, London dispersion and
// Lennard-Jones, coupled cluster, Rabi oscillations, El-Sayed rules, Peierls bond alternation.
// McQuarrie QC has no symmetry or electronic-spectroscopy chapter, so those items carry author-level refs.
// Deliberate omissions: Green's-function methods (Szabo–Ostlund ch. 7) and pair theories beyond CC — too
// specialized for a first atlas pass; semi-empirical methods other than Hückel.
// Landmark papers (kind 'Paper') appended Oct 2026; each citation checked against Crossref, the publisher, or a digitized library copy.
export default {
  collection: 'qchem',
  chapters: [
    // ───────────────────────────────────────────────────────────── 1
    {
      n: 1,
      title: 'Quantum models a chemist lives by',
      summary: String.raw`Chemistry borrows a handful of exactly solvable quantum problems and leans on them constantly. The particle in a box explains why long conjugated dyes absorb red light, the harmonic oscillator underlies every vibrational spectrum, and the rigid rotor every rotational one. Along the way we meet the operator language — Hermitian observables, commutators, uncertainty — that the rest of the course uses.`,
      items: [
        { num: '1.1', kind: 'Postulate', name: 'Time-independent Schrödinger equation', deps: ['qm-2.4'], refs: ['McQuarrie ch. 3'],
          pic: 'Shoot a trial wavefunction across a potential well at an energy you set with a slider: it blows up at the far wall unless the energy hits an eigenvalue, where the tail suddenly settles to zero.' },
        { num: '1.2', kind: 'Postulate', name: 'Born interpretation of the wavefunction', deps: ['qchem-1.1', 'qm-2.2'], refs: ['McQuarrie ch. 4'],
          pic: 'Drop simulated detector clicks one at a time onto a box eigenstate: the histogram of positions fills in |ψ|², and the running integral of the histogram converges to 1.' },
        { num: '1.3', kind: 'Theorem', name: 'Hermitian operators: real eigenvalues, orthogonal states', deps: ['qchem-1.1', 'fa-12.23', 'ladr-7.12', 'qm-5.4'], refs: ['McQuarrie ch. 4'],
          pic: 'Edit a small matrix entry by entry; while it stays Hermitian the eigenvalues sit on the real axis and the eigenvectors stay at right angles, and breaking the symmetry pushes them into the complex plane.' },
        { num: '1.4', kind: 'Model', name: 'Particle in a one-dimensional box', deps: ['qchem-1.1', 'qm-3.3'], refs: ['McQuarrie ch. 3'],
          pic: 'Widen or narrow the box and watch the ladder of levels E ∝ n²/L² squeeze together or spread apart, with each eigenfunction gaining one more node per rung.' },
        { num: '1.5', kind: 'Model', name: 'Free-electron model of conjugated dyes', deps: ['qchem-1.4'], refs: ['McQuarrie ch. 3'],
          pic: 'Lengthen a polymethine chain one double bond at a time: π electrons fill box levels pairwise, the HOMO–LUMO gap shrinks, and the predicted absorption colour slides from ultraviolet through the visible against measured dye values.' },
        { num: '1.6', kind: 'Phenomenon', name: 'Degeneracy in two- and three-dimensional boxes', deps: ['qchem-1.4'], refs: ['McQuarrie ch. 3'],
          pic: 'Stretch a square box into a rectangle: levels that coincided for the square split apart, and the readout counts degeneracies, which reappear only at commensurate aspect ratios.' },
        { num: '1.7', kind: 'Model', name: 'Quantum harmonic oscillator', deps: ['qchem-1.1', 'mech-4.2', 'qm-4.1'], refs: ['McQuarrie ch. 5'],
          pic: 'Eigenfunctions are drawn inside the parabola with the classical turning points marked; raise n and the probability density piles up near the turning points, approaching the classical distribution.' },
        { num: '1.8', alias: 'qm-4.4', name: 'Zero-point energy' },
        { num: '1.9', kind: 'Model', name: 'Rigid rotor and quantized angular momentum', deps: ['qchem-1.1', 'mech-8.2'], refs: ['McQuarrie ch. 6'],
          pic: 'A dumbbell spins on a sphere showing its spherical-harmonic density; step J up and the levels climb as J(J+1) with 2J+1 orientations each, while a moment-of-inertia slider rescales the whole ladder.' },
        { num: '1.10', kind: 'Theorem', name: 'Commutators and the uncertainty principle', deps: ['qchem-1.3', 'qm-5.10'], refs: ['McQuarrie ch. 4'],
          pic: 'Squeeze a Gaussian wave packet in position and watch its momentum distribution (computed by FFT) widen; the product of spreads is read out and never drops below ħ/2, touching it only for the Gaussian.' },
        { num: '1.11', kind: 'Phenomenon', name: 'Tunnelling and the ammonia inversion', deps: ['qchem-1.4', 'qm-3.17'], refs: ['McQuarrie ch. 4'],
          pic: 'A double-well potential with adjustable barrier height: the lowest two levels split into a symmetric and antisymmetric pair, and the splitting — the inversion frequency — falls exponentially as the barrier grows.' },
        { num: '1.12', kind: 'Postulate', name: 'Expectation values and measurement', deps: ['qchem-1.2', 'qchem-1.3', 'prob-2.2.3'], refs: ['McQuarrie ch. 4'],
          pic: 'Prepare a superposition of box states with draggable amplitudes; repeated simulated energy measurements return only eigenvalues, and their average converges to ⟨H⟩ computed from the amplitudes.' },
        { num: '1.13', kind: 'Method', name: 'Ladder operators for the oscillator', deps: ['qchem-1.7', 'qchem-1.10', 'qm-4.2'], refs: ['McQuarrie ch. 5'],
          pic: 'Apply a† and a to oscillator states as buttons: each press moves one rung up or down by ħω with the √n factors shown, and pressing a on the ground state returns exactly zero.' },
        { num: '1.14', kind: 'Postulate', name: 'Time-dependent Schrödinger equation and wave packets', deps: ['qchem-1.1', 'qchem-1.12'], refs: ['McQuarrie ch. 4'],
          pic: 'Launch a wave packet in a box or an oscillator: a single eigenstate only spins its phase while the density stays still, but a superposition sloshes back and forth at the Bohr frequency and revives on schedule.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 2
    {
      n: 2,
      title: 'The hydrogen atom',
      summary: String.raw`The one problem in chemistry solved exactly in three dimensions. Separating the Coulomb problem in spherical coordinates gives the quantum numbers n, l and m, the familiar s, p and d orbital shapes, and the Rydberg formula for the hydrogen spectrum. Electron spin and its coupling to orbital motion complete the picture and prepare the many-electron atom.`,
      items: [
        { num: '2.1', kind: 'Model', name: 'Hydrogen atom: separation in spherical coordinates', deps: ['qchem-1.9', 'mech-8.2', 'qm-8.3'], refs: ['McQuarrie ch. 7'],
          pic: 'Build ψ(r,θ,φ) as a product: a radial curve, an angular pattern on a sphere and their product as a cloud, with sliders for n, l, m that only allow legal combinations.' },
        { num: '2.2', kind: 'Theorem', name: 'Energy levels and the Rydberg formula', deps: ['qchem-2.1'], refs: ['McQuarrie ch. 7'],
          pic: 'Click two levels of the −13.6 eV/n² ladder to emit a photon; the computed lines assemble the Lyman, Balmer and Paschen series, and the Balmer ones light up in their true colours.' },
        { num: '2.3', kind: 'Definition', name: 'Spherical harmonics and s, p, d orbital shapes', deps: ['qchem-2.1', 'qm-7.5'], refs: ['McQuarrie ch. 7'],
          pic: 'Rotate a 3D polar plot of each spherical harmonic coloured by sign; count the angular nodal planes, always equal to l.' },
        { num: '2.4', kind: 'Definition', name: 'Radial distribution function', deps: ['qchem-2.1'], refs: ['McQuarrie ch. 7'],
          pic: 'Toggle between |R|² and r²|R|² for 1s, 2s and 3s: the density peaks at the nucleus but the radial distribution peaks at the Bohr radius, and the radial nodes are counted live (n − l − 1).' },
        { num: '2.5', kind: 'Concept', name: 'Real orbitals as combinations of complex ones', deps: ['qchem-2.3'], refs: ['McQuarrie ch. 7'],
          pic: 'Mix the m = +1 and m = −1 functions with a phase slider: their sum and difference rotate into p_x and p_y, while the energy readout does not change.' },
        { num: '2.6', kind: 'Phenomenon', name: 'Accidental l-degeneracy of hydrogen', deps: ['qchem-2.2', 'mech-12.9'], refs: ['McQuarrie ch. 7'],
          pic: 'Deform the Coulomb potential by a small screening term: the 2s and 2p levels that coincide for pure 1/r split apart, previewing why many-electron atoms fill s before p.' },
        { num: '2.7', kind: 'Postulate', name: 'Electron spin', deps: ['qchem-1.9', 'qm-7.7'], refs: ['McQuarrie ch. 9'],
          pic: 'A simulated Stern–Gerlach magnet splits a beam of silver atoms into exactly two spots; tilting the field rotates the split axis but never produces a third spot.' },
        { num: '2.8', kind: 'Phenomenon', name: 'Spin–orbit coupling and fine structure', deps: ['qchem-2.7', 'qchem-2.3', 'qm-11.9'], refs: ['McQuarrie ch. 9'],
          pic: 'Turn up the nuclear charge Z and watch the 2p level split into j = 1/2 and 3/2 with a gap growing like Z⁴; at hydrogen the splitting is a hair, at heavy atoms it rivals chemical energies.' },
        { num: '2.9', kind: 'Model', name: 'Hydrogen-like ions and Z scaling', deps: ['qchem-2.2'], refs: ['McQuarrie ch. 7'],
          pic: 'Slide Z from 1 to 10: orbitals shrink as 1/Z and energies deepen as Z², and the readout compares He⁺ and Li²⁺ ionization energies with measured values.' },
        { num: '2.10', kind: 'Phenomenon', name: 'Zeeman effect', deps: ['qchem-2.3', 'qchem-2.7', 'qm-11.14'], refs: ['McQuarrie ch. 9'],
          pic: 'Raise a magnetic field slider and watch a p level fan out into 2l + 1 sublevels; the emitted spectral line splits into a triplet, and spin breaks the simple pattern into the anomalous one.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 3
    {
      n: 3,
      title: 'Many-electron atoms and the periodic table',
      summary: String.raw`With more than one electron the Schrödinger equation can no longer be solved exactly, but antisymmetry and screening explain almost everything. The Pauli principle and Slater determinants fix how electrons share orbitals, effective nuclear charge sets the filling order, and Hund's rules pick the ground term. The periodic table, with its trends and its exceptions, falls out.`,
      items: [
        { num: '3.1', kind: 'Principle', name: 'Pauli exclusion principle and antisymmetry', deps: ['qchem-2.7', 'qm-10.3'], refs: ['McQuarrie ch. 9', 'Szabo–Ostlund ch. 2'],
          pic: 'Plot a two-electron wavefunction on the (x₁, x₂) plane: the antisymmetric combination vanishes along the diagonal x₁ = x₂, and forcing two same-spin electrons into one orbital makes the whole picture cancel to zero.' },
        { num: '3.2', kind: 'Definition', name: 'Slater determinant', deps: ['qchem-3.1', 'pma-9.34'], refs: ['Szabo–Ostlund ch. 2'],
          pic: 'Drag spin-orbitals into the rows of a determinant: swapping two rows flips the sign, and duplicating a row makes the determinant and the density collapse to zero.' },
        { num: '3.3', kind: 'Model', name: 'Helium and electron–electron repulsion', deps: ['qchem-2.9', 'qchem-3.1'], refs: ['McQuarrie ch. 9'],
          pic: 'Compare the independent-electron prediction for helium (−108.8 eV) with experiment (−79.0 eV) and switch on the repulsion term perturbatively and variationally to see the gap close.' },
        { num: '3.4', kind: 'Model', name: 'Shielding and effective nuclear charge', deps: ['qchem-3.3'], refs: ['McQuarrie ch. 9'],
          pic: 'An outer electron orbits beyond a cloud of inner electrons whose penetration you can adjust; the effective charge it feels is computed from the enclosed density and plotted across a row of the table.' },
        { num: '3.5', kind: 'Principle', name: 'Aufbau principle and the Madelung rule', deps: ['qchem-3.4', 'qchem-2.6'], refs: ['McQuarrie ch. 9'],
          pic: 'Feed electrons one at a time into an energy-ordered orbital stack; the (n + l, n) ordering reproduces the block structure of the periodic table, highlighted as the configuration grows.' },
        { num: '3.6', kind: 'Concept', name: 'Exchange energy and the Fermi hole', deps: ['qchem-3.2'], refs: ['Szabo–Ostlund ch. 2'],
          pic: 'Fix one electron and map where a second electron is likely to be: with the same spin a hole opens around the first, with opposite spin it does not, and the exchange energy readout tracks the difference.' },
        { num: '3.7', kind: 'Definition', name: 'Russell–Saunders term symbols', deps: ['qchem-3.1', 'qchem-2.8', 'qm-7.14'], refs: ['McQuarrie ch. 9'],
          pic: 'Tabulate all microstates of a p² configuration in an (M_L, M_S) grid and peel off terms one rectangle at a time, leaving ³P, ¹D and ¹S with the right number of states each.' },
        { num: '3.8', kind: 'Principle', name: 'Hund’s rules', deps: ['qchem-3.7', 'qchem-3.6'], refs: ['McQuarrie ch. 9'],
          pic: 'Fill a set of degenerate orbitals with arrows by hand and compare total energies from an exchange model; the high-spin arrangement wins until a crystal-field slider splits the orbitals enough to flip the order.' },
        { num: '3.9', kind: 'Phenomenon', name: 'Periodic trends in ionization energy and radius', deps: ['qchem-3.4', 'qchem-3.5'], refs: ['McQuarrie ch. 9'],
          pic: 'Plot first ionization energies against Z with a cursor: the saw-tooth rises across each period, dips at boron and oxygen, and each feature is traced back to the configuration under the cursor.' },
        { num: '3.10', kind: 'Definition', name: 'Electronegativity (Mulliken and Pauling)', deps: ['qchem-3.9'], refs: ['McQuarrie ch. 11'],
          pic: 'Compare Mulliken’s average of ionization energy and electron affinity with Pauling’s bond-energy scale across the table; a scatter plot shows how closely the two definitions track each other.' },
        { num: '3.11', kind: 'Paradox', name: 'Anomalous configurations of chromium and copper', deps: ['qchem-3.5', 'qchem-3.8'], refs: ['McQuarrie ch. 9'],
          pic: 'Compare the energies of 4s²3d⁴ and 4s¹3d⁵ as exchange stabilization and orbital spacing vary: the naive filling order loses for chromium, a reminder that the Madelung rule is a heuristic, not a law.' },
        { num: '3.12', kind: 'Phenomenon', name: 'Relativistic effects: the colour of gold', deps: ['qchem-2.8', 'qchem-3.9'], refs: ['McQuarrie ch. 9'],
          pic: 'Turn relativity on and off for group 11: the 6s orbital contracts, the 5d–6s gap narrows, and the computed absorption edge of gold moves from the ultraviolet into the blue, turning silver-white metal yellow.' },
        { num: '3.13', kind: 'Paper', name: 'Properties and atomic weights of the elements',
          paper: { authors: 'D. Mendeleev', year: 1869, title: 'Соотношение свойств с атомным весом элементов (The relation of the properties to the atomic weights of the elements)', venue: 'Zhurnal Russkago Khimicheskago Obshchestva 1: 60–77', url: 'https://babel.hathitrust.org/cgi/pt?id=mdp.39015065536586&seq=70' },
          introduces: [], deps: ['qchem-3.9'], refs: ['Mendeleev, complete1869 article in the1926 Menshutkin reprint, pp.4–20; Giunta complete German-abstract translation'],
          pic: "Explore a modern responsive reflow of62 named entries from the German abstract, joint Ni=Co and four anonymous weights45/68/70/180. Separate authored toy arithmetic from Mendeleev's claims and disclose differences from the complete Russian article's1926 reprint." },
      ],
    },
    // ───────────────────────────────────────────────────────────── 4
    {
      n: 4,
      title: 'Approximation methods',
      summary: String.raw`Almost no chemical system is exactly solvable, so the subject runs on two tools. The variational principle turns a guess into an upper bound and, with a linear basis, into a matrix eigenvalue problem; perturbation theory expands around a solvable model. Hellmann–Feynman and the quantum virial theorem connect energies to forces and to kinetic and potential parts.`,
      items: [
        { num: '4.1', kind: 'Theorem', name: 'Variational principle', deps: ['qchem-1.3', 'fa-12.13', 'qm-12.1'], refs: ['McQuarrie ch. 8', 'Szabo–Ostlund ch. 1'],
          pic: 'Tune the width of a Gaussian trial function for the hydrogen atom: the energy curve has a minimum that always stays above the exact −0.5 hartree, and the best Gaussian misses by a computed 15 %.' },
        { num: '4.2', kind: 'Method', name: 'Linear variation and the secular determinant', deps: ['qchem-4.1', 'pma-9.36', 'ladr-7.29'], refs: ['McQuarrie ch. 8', 'Szabo–Ostlund ch. 1'],
          pic: 'Add basis functions one by one to approximate a box with a bump: each new function lowers the eigenvalues, which interlace with the previous set and converge from above.' },
        { num: '4.3', kind: 'Model', name: 'Variational helium: the effective charge 27/16', deps: ['qchem-4.1', 'qchem-3.3'], refs: ['McQuarrie ch. 8'],
          pic: 'Slide the trial exponent ζ in a product of two 1s functions: the energy minimum lands at ζ = 27/16 with error under 2 %, and the readout shows each electron screening the other by 5/16.' },
        { num: '4.4', kind: 'Method', name: 'First-order perturbation theory', deps: ['qchem-1.3', 'qm-11.1'], refs: ['McQuarrie ch. 8'],
          pic: 'Tilt the floor of a particle-in-a-box with a strength slider: the first-order prediction (a straight line) tracks the exact numerically computed levels at small tilt and peels away at large tilt.' },
        { num: '4.5', kind: 'Method', name: 'Second-order perturbation theory', deps: ['qchem-4.4'], refs: ['McQuarrie ch. 8'],
          pic: 'Add the second-order term to the tilted box and watch the ground level always bend downward, as the sum over excited states predicts; levels close together push each other hardest.' },
        { num: '4.6', kind: 'Phenomenon', name: 'Stark effect and polarizability', deps: ['qchem-4.5', 'qchem-2.1'], refs: ['McQuarrie ch. 8'],
          pic: 'Put hydrogen in an electric field: the 1s cloud shifts against the field, the energy falls quadratically, and the excited n = 2 levels instead split linearly because they are degenerate.' },
        { num: '4.7', kind: 'Method', name: 'Degenerate perturbation theory', deps: ['qchem-4.4', 'qchem-1.6', 'qm-11.4'], refs: ['McQuarrie ch. 8'],
          pic: 'Perturb a degenerate pair of square-box states: ordinary perturbation theory blows up, but diagonalizing the 2×2 block gives the correct split and the right mixed eigenfunctions.' },
        { num: '4.8', kind: 'Theorem', name: 'Hellmann–Feynman theorem', deps: ['qchem-1.3', 'pma-9.42', 'qm-11.7'], refs: ['Szabo–Ostlund ch. 1'],
          pic: 'Change a parameter in a Hamiltonian and compare the slope of the energy curve with the expectation value of ∂H/∂λ; the two agree for exact eigenstates and separate for a poor trial function.' },
        { num: '4.9', kind: 'Theorem', name: 'Quantum virial theorem', deps: ['qchem-4.8', 'mech-8.16'], refs: ['McQuarrie ch. 8'],
          pic: 'For power-law potentials of adjustable exponent, the ratio of kinetic to potential energy in the exact ground state is read out and matches the virial prediction; for Coulomb it is exactly −1/2.' },
        { num: '4.10', kind: 'Theorem', name: 'Non-crossing rule', deps: ['qchem-4.7', 'mech-11.13'], refs: ['McQuarrie ch. 11'],
          pic: 'Two diabatic levels cross as a bond length varies; add a coupling slider and the adiabatic curves repel, while states of different symmetry are allowed to cross untouched.' },
        { num: '4.11', kind: 'Phenomenon', name: 'London dispersion forces', deps: ['qchem-4.5', 'qchem-4.6', 'qm-11.17'], refs: ['McQuarrie ch. 8'],
          pic: 'Two Drude oscillators (model atoms) sit at an adjustable separation; second-order coupling of their fluctuating dipoles gives an attraction whose computed curve falls as 1/R⁶, steeper or shallower as the polarizability slider changes.' },
        { num: '4.12', kind: 'Model', name: 'Lennard-Jones potential', deps: ['qchem-4.11'], refs: ['McQuarrie ch. 8'],
          pic: 'Overlay the 12–6 curve on computed repulsion-plus-dispersion energies for argon; the minimum sits at 2^(1/6)σ, and switching the repulsion to an exponential shows how arbitrary the twelfth power is.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 5
    {
      n: 5,
      title: "The chemical bond in diatomic molecules",
      summary: String.raw`Clamped-nuclei energies make a potential curve, and normalized overlapping orbitals turn a one-electron bond into a small generalized eigenproblem. Two-electron antisymmetry, electron repulsion and configuration mixing then reveal the limits of a single orbital product. Orbital filling, spin response, polarity and anharmonic vibration connect these models with chemical descriptions while keeping approximate energies and historical source limits explicit.`,
      items: [
        {"num":"5.1","alias":"qm-12.5","name":"Born–Oppenheimer approximation"},
        { num: "5.2", kind: "Concept", name: "Potential energy curves", deps: ["qm-2.4","qchem-1.7","qchem-4.2"], see: ["qchem-5.3","qm-12.5"], refs: ["C. D. Sherrill, The Born–Oppenheimer Approximation (2005), pp.1–4","McCullagh, Chemistry Lessons §4.5.17; independently derived minimal LCAO curve"],
          pic: String.raw`Move the nuclei along the computed H₂⁺ curve. Inspect total energy, force and the model minimum, then change a chosen nuclear reduced mass to see the local harmonic frequency. Nuclear repulsion is included once; the separated limit is hydrogen plus a proton.` },
        { num: "5.3", kind: "Model", name: "H₂⁺ by LCAO", deps: ["qchem-4.2","qchem-2.1"], see: ["qchem-5.2"], refs: ["McCullagh, Chemistry Lessons §4.5.17; independent normalized integral derivation"],
          pic: String.raw`Change nuclear separation and switch the relative sign. Compare the actual axis amplitude with both computed variational energies. The minus state vanishes at the midpoint; the readout keeps the three-dimensional normalization and the nuclear-repulsion convention explicit.` },
        { num: "5.4", kind: "Definition", name: "Overlap, Coulomb and resonance integrals", deps: ["qchem-5.3"], refs: ["McCullagh, Chemistry Lessons §4.5.17.6; independent prolate-coordinate evaluation"],
          pic: String.raw`Slide the atoms apart and follow S, J and K separately. Read their contributions to the actual diagonal and off-diagonal energy matrix. Overlap is dimensionless; attraction integrals and matrix elements are in Hartree.` },
        { num: "5.5", kind: "Phenomenon", name: "Antibonding is more antibonding than bonding is bonding", deps: ["qchem-5.4"], refs: ["Self-contained algebra from the generalized eigenproblem in 5.3–5.4"],
          pic: String.raw`Vary overlap and a discrete effective coupling, including its sign and zero. Compare the actual energy rungs with the diagonal reference. Positive coupling reverses the ordering; orthogonality removes the magnitude asymmetry.` },
        { num: "5.6", kind: "Model", name: "Valence-bond theory of H₂ (Heitler–London)", deps: ["qchem-5.2","qchem-3.1","qchem-4.2"], refs: ["Fermann & Valeev, Fundamentals of Molecular Integrals Evaluation (2020), selected §§2–6","Independent normalized two-Gaussian Heitler–London calculation"],
          pic: String.raw`Change separation and the Gaussian exponent. Compare actual singlet and triplet energies, including both electron and nuclear repulsion, with the two-atom limit in that same basis. The readout exposes direct and exchange contributions.` },
        { num: "5.7", kind: "Paradox", name: "MO theory’s failure at dissociation", deps: ["qchem-5.3","qchem-5.6","qchem-4.2"], refs: ["McCullagh, Chemistry Lessons §4.5.21, expansion and variational setup; independent Gaussian matrix evaluation"],
          pic: String.raw`Pull the atoms apart and change the normalized CI mixing angle. Compare your Rayleigh quotient with the optimized finite-basis energy and separated atoms. The readout shows ionic and covalent coefficients, rather than treating nonorthogonal AO terms as probabilities.` },
        { num: "5.8", kind: "Model", name: "MO diagrams of second-row diatomics and bond order", deps: ["qchem-5.3","qchem-3.1","qchem-3.8"], see: ["qchem-3.5","qchem-4.11"], refs: ["Purdue, Molecular Orbital Theory, second-level orbitals and bond order","Sherrill, Molecular Orbital Diagram for a Homonuclear Diatomic Molecule, actual one-page diagram","Luo et al., J. Chem. Phys.98,3564–3567 (1993), actual author-hosted abstract only"],
          pic: String.raw`Choose a second-row diatomic and remove or add one electron. Watch the actual slot filling and formal bond-order count. Read the unpaired-electron count, declared ordering and basis-capacity limit. Row spacing is schematic; the numerical outputs are occupation counts.` },
        { num: "5.9", kind: "Phenomenon", name: "Paramagnetism of O₂", deps: ["qchem-5.8"], refs: ["Purdue, Molecular Orbital Theory, O₂ configuration","Self-contained three-state Boltzmann partition sum"],
          pic: String.raw`Compare the oxygen triplet configuration with the nitrogen singlet. Sweep a dimensionless field through zero and inspect the actual three-state probabilities and mean spin. There is no invented liquid-stream trajectory.` },
        { num: "5.10", kind: "Phenomenon", name: "s–p mixing and the N₂/O₂ level switch", deps: ["qchem-5.8","qchem-4.10"], refs: ["Purdue, Molecular Orbital Theory, s–p mixing discussion","Self-contained same-symmetry 2×2 eigenproblem"],
          pic: String.raw`Change the bare s–p separation and same-symmetry coupling. Compare the two calculated sigma levels with an uncoupled pi reference. The sigma pair repels, while the sigma/pi ordering can switch. Chosen energy units do not imply experimental N₂/O₂ values.` },
        { num: "5.11", kind: "Model", name: "Heteronuclear diatomics and bond polarity", deps: ["qchem-4.2","qchem-5.8"], see: ["qchem-3.10"], refs: ["Self-contained orthogonal two-site Hamiltonian and explicitly defined charge operator","Simons, Introduction to Theoretical Chemistry ch.2, qualitative two-site model context"],
          pic: String.raw`Lower either site energy, vary the coupling and change separation. Compare conserved site populations, neutral charges and the signed model dipole. Reversing the energy offset reverses polarity; equal site energies give zero dipole.` },
        { num: "5.12", kind: "Model", name: "Morse potential", deps: ["qchem-5.2","qchem-1.7"], refs: ["Simons, Introduction to Theoretical Chemistry ch.2 §2.9, printed pp.197–199; independent full-line Laguerre and strict-integrability derivation","McCullagh, Chemistry Lessons §4.5.26, potential and Taylor expansion only"],
          pic: String.raw`Compare the Morse well and its local parabola. Vary depth through half-integer thresholds and compare exact bound levels with an independently computed finite-box spectrum at three mesh resolutions. Inspect the signed numerical discrepancy and the explicit absence of an exact level when the well is too shallow.` },
        { num: "5.13", kind: "Paper", name: "The atom and the molecule", deps: ["qchem-3.1"], refs: ["Lewis (1916), publisher metadata and first-page preview only; full original body unchecked","OpenStax Chemistry 2e §7.4, actual formal-charge definition and distinction from actual charge"], paper: {"authors":"Gilbert N. Lewis","year":1916,"title":"The atom and the molecule","venue":"Journal of the American Chemical Society 38 (4): 762–785","doi":"10.1021/ja02261a002"}, introduces: [], verify: true,
          pic: String.raw`Choose a small molecule or ion, then edit equal bond orders and central lone pairs. Use the reference button to restore its modern electron counts. Compare budget, formal charge and terminal duet/octet checks, including boron’s deliberate octet exception.` },
        { num: "5.14", kind: "Paper", name: "Wechselwirkung neutraler Atome und homöopolare Bindung", deps: ["qchem-3.1","qchem-5.6"], refs: ["Heitler & London (1927), actual publisher metadata and complete displayed abstract only; original body unchecked","Fermann & Valeev (2020), selected primitive Gaussian integral sections; independently derived modern model"], paper: {"authors":"W. Heitler and F. London","year":1927,"title":"Wechselwirkung neutraler Atome und homöopolare Bindung nach der Quantenmechanik","venue":"Zeitschrift für Physik 44 (6–7): 455–472","doi":"10.1007/BF01397394"}, introduces: ["qchem-5.6"], verify: true,
          pic: String.raw`Bring two chosen Gaussian atoms together and switch spin symmetry. Inspect the actual two-electron axis slice and exchange-energy shifts from the direct-product reference. The triplet diagonal node follows antisymmetry; relative image brightness is not a probability marginal.` },
      ],
    },
    // ───────────────────────────────────────────────────────────── 6
    {
      "n": 6,
      "title": "Bonding in polyatomic molecules",
      "summary": "Polyatomic bonding uses several models with different purposes: domain geometry, localized angular orbitals and finite π-electron Hamiltonians. Orbital filling and symmetry connect these constructions to cyclic shells, reaction selection and metal d-level splitting. Each visualization computes its declared quantities while keeping empirical geometry, interacting-electron claims and historical source access separate.",
      "items": [
        {
          "num": "6.1",
          "kind": "Model",
          "name": "VSEPR model of molecular shape",
          "deps": [
            "qchem-5.8"
          ],
          "refs": [
            "NPTEL, Principles of Inorganic Chemistry, module 1 lecture 2 §§1.3–1.4; independent domain optimization"
          ],
          "links": {
            "source": "https://archive.nptel.ac.in/content/storage2/courses/104101006/modules/module1/lec2/1.3.html"
          },
          "tags": [
            "molecular shape",
            "domain repulsion"
          ],
          "pic": "Change the number and size of domains, then inspect actual accepted optimization steps. Distinguish the full domain arrangement from the attached-atom angles and compare the final energy with its force residual."
        },
        {
          "num": "6.2",
          "kind": "Model",
          "name": "Hybrid orbitals",
          "deps": [
            "qchem-2.5",
            "qchem-6.1"
          ],
          "refs": [
            "Pauling (1931), selected printed pp.1376–1379; self-contained overlap derivation"
          ],
          "links": {
            "source": "https://boscoh.com/pdf/pauling.pdf"
          },
          "tags": [
            "hybrid orbitals",
            "orthogonality"
          ],
          "pic": "Vary the s fraction of two orthogonal hybrids. Use the three exact family presets, inspect their overlap and follow the angle relation. The signed polar radius depicts an angular slice of each function."
        },
        {
          "num": "6.3",
          "kind": "Model",
          "name": "Walsh diagrams: why water is bent",
          "deps": [
            "qchem-5.8",
            "qchem-6.2"
          ],
          "refs": [
            "Self-contained six-function AH₂ calculation; Walsh (1953) historical metadata only, original body not read"
          ],
          "tags": [
            "Walsh diagram",
            "orbital filling"
          ],
          "pic": "Bend the declared AH₂ model and switch the electron count. Compare orbital branches, the occupied total and the bounded numerical minimum while changing H–H repulsion."
        },
        {
          "num": "6.4",
          "kind": "Model",
          "name": "Hückel molecular orbital theory",
          "deps": [
            "qchem-4.2",
            "qchem-5.5",
            "ladr-7.29"
          ],
          "refs": [
            "MIT 5.61, Robert Field, Fall 2017 Lecture 26, selected PDF 1–10; independent matrix calculation"
          ],
          "links": {
            "source": "https://ocw.mit.edu/courses/5-61-physical-chemistry-fall-2017/0d3d7427e4180c2e1b59bb0c09827092_MIT5_61F17_lec26.pdf"
          },
          "tags": [
            "Hückel theory",
            "graph spectra"
          ],
          "pic": "Switch six-site skeletons and inspect an orbital’s signed coefficients beside the actual Hamiltonian matrix. Compare graph topology, level energies and the numerical eigen residual."
        },
        {
          "num": "6.5",
          "kind": "Model",
          "name": "Ethylene, allyl and butadiene in Hückel theory",
          "deps": [
            "qchem-6.4"
          ],
          "refs": [
            "MIT 5.61Fall 2017 Lecture 26, selected chain treatment; independent discrete-sine derivation"
          ],
          "links": {
            "source": "https://ocw.mit.edu/courses/5-61-physical-chemistry-fall-2017/0d3d7427e4180c2e1b59bb0c09827092_MIT5_61F17_lec26.pdf"
          },
          "tags": [
            "conjugated chains",
            "normal modes"
          ],
          "pic": "Compare two-, three- and four-site chains, choose a valid orbital and change the π charge. See exact normal modes, energies and electron occupations, including allyl’s singly occupied zero mode."
        },
        {
          "num": "6.6",
          "kind": "Phenomenon",
          "name": "Aromatic stabilization of benzene",
          "deps": [
            "qchem-6.4"
          ],
          "refs": [
            "MIT 5.61Fall 2017 Lecture 26, PDF 7–9; independent alternating-ring derivation"
          ],
          "links": {
            "source": "https://ocw.mit.edu/courses/5-61-physical-chemistry-fall-2017/0d3d7427e4180c2e1b59bb0c09827092_MIT5_61F17_lec26.pdf"
          },
          "tags": [
            "benzene",
            "energy reference"
          ],
          "pic": "Alternate the ring’s hopping strengths. Follow the ring energy, the changing strong-dimer reference and their difference separately; compare them with the lowering from the uniform ring."
        },
        {
          "num": "6.7",
          "kind": "Theorem",
          "name": "Hückel’s 4n + 2 rule",
          "deps": [
            "qchem-6.6"
          ],
          "refs": [
            "MIT 5.61Fall 2017 Lecture 26, selected benzene and cyclic-shell argument; independent Fourier derivation"
          ],
          "links": {
            "source": "https://ocw.mit.edu/courses/5-61-physical-chemistry-fall-2017/0d3d7427e4180c2e1b59bb0c09827092_MIT5_61F17_lec26.pdf"
          },
          "tags": [
            "aromaticity",
            "cyclic shells"
          ],
          "pic": "Choose a valid cyclic shell and compare its Frost construction with actual orbital occupations. Distinguish a closed-shell gap from a partially occupied exact degeneracy."
        },
        {
          "num": "6.8",
          "kind": "Definition",
          "name": "Coulson charges and π bond orders",
          "deps": [
            "qchem-6.4"
          ],
          "refs": [
            "MIT 5.61Fall 2017 Lecture 26, PDF 9–10 bond-order discussion; independent density-matrix identities"
          ],
          "links": {
            "source": "https://ocw.mit.edu/courses/5-61-physical-chemistry-fall-2017/0d3d7427e4180c2e1b59bb0c09827092_MIT5_61F17_lec26.pdf"
          },
          "tags": [
            "Coulson bond order",
            "π density"
          ],
          "pic": "Change graph, π charge and one site energy. Inspect the full density matrix beside site populations and check both electron-count and total-charge identities."
        },
        {
          "num": "6.9",
          "kind": "Theorem",
          "name": "Coulson–Rushbrooke pairing theorem",
          "deps": [
            "qchem-6.4"
          ],
          "refs": [
            "Self-contained bipartite matrix proof; Coulson–Rushbrooke (1940) bibliographic metadata only"
          ],
          "links": {
            "model": "https://ocw.mit.edu/courses/5-61-physical-chemistry-fall-2017/0d3d7427e4180c2e1b59bb0c09827092_MIT5_61F17_lec26.pdf"
          },
          "tags": [
            "alternant hydrocarbons",
            "spectral pairing"
          ],
          "pic": "Change a bipartite graph to an odd-cycle graph or add site bias. Compare the actual spectrum with its reflected partner and inspect both the input hypotheses and the anticommutator residual."
        },
        {
          "num": "6.10",
          "kind": "Concept",
          "name": "Frontier orbitals: HOMO and LUMO",
          "deps": [
            "qchem-6.4"
          ],
          "refs": [
            "Self-contained spectral-projector and two-state derivation; modern Hückel setup from MIT 5.61Fall 2017Lecture 26"
          ],
          "links": {
            "source": "https://ocw.mit.edu/courses/5-61-physical-chemistry-fall-2017/0d3d7427e4180c2e1b59bb0c09827092_MIT5_61F17_lec26.pdf"
          },
          "tags": [
            "frontier orbitals",
            "spectral projector"
          ],
          "pic": "Choose an acceptor and valid coupling site. Compare the LUMO projector weights, exact donor lowering and weak-coupling estimate, including the benzene degeneracy."
        },
        {
          "num": "6.11",
          "kind": "Principle",
          "name": "Woodward–Hoffmann rules",
          "deps": [
            "qchem-6.10",
            "qchem-6.5"
          ],
          "refs": [
            "Timothy F. Jamison, MIT 5.13 Organic Chemistry II, October 17, 2003 Lecture 16, complete one-page handout; independent phase/expectation calculation"
          ],
          "links": {
            "source": "https://ocw.mit.edu/courses/5-13-organic-chemistry-ii-fall-2003/49cdb778f30678b8d5519e9ade744f15_lec16_handout.pdf"
          },
          "tags": [
            "orbital symmetry",
            "electrocyclic reactions"
          ],
          "pic": "Switch four and six π electrons, change the initial occupation and compare conrotatory with disrotatory motion. Inspect terminal phase geometry and the actual initial-density expectation."
        },
        {
          "num": "6.12",
          "kind": "Model",
          "name": "Crystal-field splitting",
          "deps": [
            "qchem-2.3",
            "qchem-3.8"
          ],
          "refs": [
            "Drennan/Taylor, MIT 5.111Fall 2008 Lecture Summary 28, complete handout and PDF 5 figure; independent exact angular projection"
          ],
          "links": {
            "source": "https://ocw.mit.edu/courses/5-111-principles-of-chemical-science-fall-2008/c1c824f9d56c6b89055adfa31d7a2c82_lecnotes28.pdf"
          },
          "tags": [
            "crystal field",
            "angular projection"
          ],
          "pic": "Switch octahedral and tetrahedral point ligands and vary their common radius. Follow the computed d-level pattern, its zero trace and R⁻⁵ splitting."
        },
        {
          "num": "6.13",
          "kind": "Phenomenon",
          "name": "High-spin and low-spin complexes",
          "deps": [
            "qchem-6.12",
            "qchem-3.8"
          ],
          "refs": [
            "MIT 5.111Fall 2008 Lecture Summary 28, field-versus-pairing discussion; independent full occupation enumeration"
          ],
          "links": {
            "source": "https://ocw.mit.edu/courses/5-111-principles-of-chemical-science-fall-2008/c1c824f9d56c6b89055adfa31d7a2c82_lecnotes28.pdf"
          },
          "tags": [
            "spin crossover",
            "pairing energy"
          ],
          "pic": "Vary octahedral splitting and pairing cost. Inspect the ground occupations and their possible unpaired counts, especially the nonunique crossing, against the two candidate energy curves."
        },
        {
          "num": "6.14",
          "kind": "Theorem",
          "name": "Jahn–Teller theorem",
          "deps": [
            "qchem-6.12",
            "qchem-4.7"
          ],
          "refs": [
            "MIT 5.73 Introductory Quantum Mechanics I Fall 2005, problem set 7 solutions, selected scientific text and PDF 3–4; independent E⊗e diagonalization"
          ],
          "links": {
            "source": "https://ocw.mit.edu/courses/5-73-introductory-quantum-mechanics-i-fall-2005/2842546132cb04e435063e18ade2d2fb_s7.pdf"
          },
          "tags": [
            "Jahn–Teller",
            "vibronic coupling"
          ],
          "pic": "Change coupling and elasticity, then move around the lower potential surface. Compare a selected distortion with the computed radial branches, minimum radius and energy lowering."
        },
        {
          "num": "6.15",
          "kind": "Phenomenon",
          "name": "Peierls distortion and bond alternation in polyenes",
          "deps": [
            "qchem-6.5",
            "qchem-1.5"
          ],
          "refs": [
            "Self-contained alternating-chain Bloch and finite-matrix derivation; Hückel setup from MIT 5.61Fall 2017Lecture 26"
          ],
          "links": {
            "model": "https://ocw.mit.edu/courses/5-61-physical-chemistry-fall-2017/0d3d7427e4180c2e1b59bb0c09827092_MIT5_61F17_lec26.pdf"
          },
          "tags": [
            "Peierls distortion",
            "finite-size gap"
          ],
          "pic": "Alternate hopping, change finite size and switch boundaries. Compare the actual finite gap with 4tδ while reading electronic energy and the separate elastic cost."
        },
        {
          "num": "6.16",
          "kind": "Paper",
          "name": "The Nature of the Chemical Bond",
          "paper": {
            "authors": "Linus Pauling",
            "year": 1931,
            "title": "The Nature of the Chemical Bond. Application of Results Obtained from the Quantum Mechanics and from a Theory of Paramagnetic Susceptibility to the Structure of Molecules",
            "venue": "Journal of the American Chemical Society 53 (4): 1367–1400",
            "doi": "10.1021/ja01355a027"
          },
          "introduces": [
            "qchem-6.2"
          ],
          "deps": [
            "qchem-5.6",
            "qchem-2.3",
            "qchem-5.14"
          ],
          "refs": [
            "Pauling (1931), selected original scan passages as scoped; independent Gram and Cauchy–Schwarz calculations"
          ],
          "links": {
            "source": "https://boscoh.com/pdf/pauling.pdf"
          },
          "tags": [
            "Pauling (1931)",
            "directional orbitals"
          ],
          "pic": "Switch the canonical tetrahedral and square-planar angular quartets, then rotate two hybrids orthogonally. Inspect the Gram matrix and directional amplitudes while the total angular density stays invariant."
        },
        {
          "num": "6.17",
          "kind": "Paper",
          "name": "Quantentheoretische Beiträge zum Benzolproblem",
          "paper": {
            "authors": "Erich Hückel",
            "year": 1931,
            "title": "Quantentheoretische Beiträge zum Benzolproblem. I. Die Elektronenkonfiguration des Benzols und verwandter Verbindungen",
            "venue": "Zeitschrift für Physik 70 (3–4): 204–286",
            "doi": "10.1007/BF01339530"
          },
          "introduces": [
            "qchem-6.4",
            "qchem-6.6",
            "qchem-6.7"
          ],
          "deps": [
            "qchem-4.2",
            "qchem-5.3"
          ],
          "refs": [
            "Hückel (1931) historical bibliography; original body not read",
            "MIT 5.61Fall 2017Lecture 26, selected PDF 1–10; independent finite graph experiment"
          ],
          "links": {
            "model": "https://ocw.mit.edu/courses/5-61-physical-chemistry-fall-2017/0d3d7427e4180c2e1b59bb0c09827092_MIT5_61F17_lec26.pdf"
          },
          "tags": [
            "Hückel (1931)",
            "ring closure"
          ],
          "pic": "Close neutral four-, six-, eight- and ten-site skeletons. Compare the actual occupied energy, finite frontier status, open-chain shift and isolated-dimer reference."
        },
        {
          "num": "6.18",
          "kind": "Paper",
          "name": "Stereochemistry of Electrocyclic Reactions",
          "paper": {
            "authors": "R. B. Woodward and Roald Hoffmann",
            "year": 1965,
            "title": "Stereochemistry of Electrocyclic Reactions",
            "venue": "Journal of the American Chemical Society 87 (2): 395–397",
            "doi": "10.1021/ja01080a054"
          },
          "introduces": [
            "qchem-6.11"
          ],
          "deps": [
            "qchem-6.10",
            "qchem-6.5",
            "qchem-6.17"
          ],
          "refs": [
            "Woodward–Hoffmann (1965) historical bibliography; original body not read",
            "Jamison, MIT 5.13 Organic Chemistry II, October 17, 2003 Lecture 16, complete handout; independent phase calculation"
          ],
          "links": {
            "model": "https://ocw.mit.edu/courses/5-13-organic-chemistry-ii-fall-2003/49cdb778f30678b8d5519e9ade744f15_lec16_handout.pdf"
          },
          "tags": [
            "Woodward–Hoffmann (1965)",
            "orbital symmetry"
          ],
          "pic": "Choose four or six electrons and rotate the two ends independently. Compare the initial frontier amplitudes, facing phases and complete-density expectation, then recover the conrotatory and disrotatory limits."
        }
      ]
    },
    // ───────────────────────────────────────────────────────────── 7
    {
      n: 7,
      title: 'Hartree–Fock theory and electron correlation',
      summary: String.raw`Modern computational chemistry starts by treating each electron in the average field of the others. The Hartree–Fock equations, cast in a finite basis as the Roothaan–Hall matrix problem and solved self-consistently, give orbitals, energies and Koopmans ionization energies. What they miss — correlation — is recovered by configuration interaction, perturbation theory and coupled clusters, or sidestepped altogether by density functional theory.`,
      items: [
        { num: '7.1', kind: 'Method', name: 'Self-consistent field idea (Hartree)', deps: ['qchem-3.3', 'pma-9.23'], refs: ['Szabo–Ostlund ch. 3', 'McQuarrie ch. 9'],
          pic: 'Iterate for helium: guess an orbital, compute the field it creates, solve for a new orbital, repeat; the orbital exponent and energy converge in a few cycles, and too large a step makes the iteration oscillate.' },
        { num: '7.2', kind: 'Theorem', name: 'Hartree–Fock equations', deps: ['qchem-7.1', 'qchem-3.2', 'qchem-4.1'], refs: ['Szabo–Ostlund ch. 3'],
          pic: 'The Fock operator is split into kinetic, nuclear, Coulomb and exchange pieces shown as separate potentials; switching exchange off restores Hartree’s self-interaction error, visible as a raised energy.' },
        { num: '7.3', kind: 'Method', name: 'Roothaan–Hall equations FC = SCε', deps: ['qchem-7.2', 'qchem-4.2'], refs: ['Szabo–Ostlund ch. 3', 'McQuarrie ch. 12'],
          pic: 'Run a minimal-basis SCF on H₂ step by step: the 2×2 Fock, overlap and density matrices update each cycle, and the total energy settles to −1.117 hartree at 1.4 bohr.' },
        { num: '7.4', kind: 'Concept', name: 'Basis sets: Slater versus Gaussian functions', deps: ['qchem-7.3'], refs: ['Szabo–Ostlund ch. 3', 'McQuarrie ch. 12'],
          pic: 'Fit a Slater 1s function with one, two, three and six Gaussians: the cusp at the nucleus is never captured but the energy error drops fast; a bar chart compares STO-3G, double-zeta and polarized bases on a test molecule.' },
        { num: '7.5', kind: 'Theorem', name: 'Gaussian product theorem', deps: ['qchem-7.4'], refs: ['Szabo–Ostlund ch. 3'],
          pic: 'Multiply two Gaussians centred on draggable atoms: the product is a single Gaussian at a weighted point between them with a computed prefactor — the reason Gaussian integrals are cheap and Slater ones are not.' },
        { num: '7.6', kind: 'Theorem', name: 'Koopmans’ theorem', deps: ['qchem-7.2'], refs: ['Szabo–Ostlund ch. 3'],
          pic: 'Compare negative Hartree–Fock orbital energies with measured photoelectron ionization energies for N₂ and H₂O; most agree within an eV, and the famous N₂ ordering failure is highlighted.' },
        { num: '7.7', kind: 'Concept', name: 'Restricted vs unrestricted Hartree–Fock', deps: ['qchem-7.3', 'qchem-5.7'], refs: ['Szabo–Ostlund ch. 3'],
          pic: 'Stretch H₂ in RHF and UHF: the curves agree near equilibrium, then the UHF solution breaks spin symmetry at the Coulson–Fischer point and dissociates correctly while RHF climbs too high.' },
        { num: '7.8', kind: 'Definition', name: 'Correlation energy', deps: ['qchem-7.2'], refs: ['Szabo–Ostlund ch. 4'],
          pic: 'A bar chart of exact, Hartree–Fock and correlated energies for He, H₂ and H₂O shows the correlation energy as the small final gap — tiny in total energy, but comparable to bond energies.' },
        { num: '7.9', kind: 'Method', name: 'Configuration interaction', deps: ['qchem-7.8', 'qchem-4.2'], refs: ['Szabo–Ostlund ch. 4'],
          pic: 'Mix the doubly excited determinant into H₂ with a coefficient found by diagonalization: the dissociation curve is repaired, and the weight of the excited configuration rises toward 50 % as the bond breaks.' },
        { num: '7.10', kind: 'Paradox', name: 'Size consistency and truncated CI', deps: ['qchem-7.9'], refs: ['Szabo–Ostlund ch. 4'],
          pic: 'Compute the CISD energy of N non-interacting helium atoms: it falls short of N times the single-atom energy by a growing fraction, whereas a size-consistent method scales exactly linearly.' },
        { num: '7.11', kind: 'Method', name: 'Coupled-cluster theory', deps: ['qchem-7.10'], refs: ['Szabo–Ostlund ch. 5', 'McQuarrie ch. 12'],
          pic: 'The exponential ansatz e^T generates products of doubles that CISD omits; a convergence plot ranks CCSD and CCSD(T) against full CI for a small molecule and shows size consistency restored.' },
        { num: '7.12', kind: 'Method', name: 'Møller–Plesset perturbation theory', deps: ['qchem-7.2', 'qchem-4.5'], refs: ['Szabo–Ostlund ch. 6'],
          pic: 'Treat the difference between the true and Fock Hamiltonians as a perturbation: MP2, MP3 and MP4 energies are plotted against full CI and the series is shown oscillating or diverging for a stretched bond.' },
        { num: '7.13', kind: 'Theorem', name: 'Hohenberg–Kohn theorems', deps: ['qchem-4.1', 'qchem-1.2'], refs: ['McQuarrie ch. 12'],
          pic: 'Two different external potentials are tuned to try to give the same ground-state density; the computed densities always differ, and the energy functional evaluated on trial densities is minimized only at the true one.' },
        { num: '7.14', kind: 'Method', name: 'Kohn–Sham density functional theory', deps: ['qchem-7.13', 'qchem-7.2'], refs: ['McQuarrie ch. 12'],
          pic: 'Swap the exchange–correlation functional (none, LDA, a GGA, a hybrid) for a set of molecules and compare predicted bond lengths and atomization energies with experiment, all from the same SCF loop.' },
        { num: '7.15', kind: 'Paper', name: 'Self-Consistent Equations with Exchange and Correlation',
          paper: { authors: 'W. Kohn and L. J. Sham', year: 1965, title: 'Self-Consistent Equations Including Exchange and Correlation Effects', venue: 'Physical Review 140 (4A): A1133–A1138', doi: '10.1103/PhysRev.140.A1133' },
          introduces: ['qchem-7.14'], deps: ['qchem-7.13', 'qchem-7.1'], refs: [],
          pic: 'Iterate the Kohn–Sham loop for an atom: guess a density, build the effective potential with a local-density exchange–correlation term, solve one-electron equations, refill and repeat; the reader watches density and total energy converge and compares the result with Hartree and Hartree–Fock.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 8
    {
      n: 8,
      title: 'Molecular symmetry and group theory',
      summary: String.raw`The symmetry of a molecule constrains its orbitals, its vibrations and its spectra before any integral is computed. We classify molecules into point groups, represent the symmetry operations by matrices, and use character tables and the orthogonality of irreducible characters to sort orbitals and normal modes. The vanishing-integral rule then yields selection rules, polarity and chirality almost for free.`,
      items: [
        { num: '8.1', kind: 'Definition', name: 'Symmetry elements and operations', deps: [], refs: ['McQuarrie'],
          pic: 'Apply E, Cₙ, σ, i and Sₙ to a 3D molecule with buttons: atoms are relabelled to show which operations leave it indistinguishable, and composing two operations produces a third.' },
        { num: '8.2', kind: 'Definition', name: 'Point groups (Schoenflies notation)', deps: ['qchem-8.1'], refs: ['McQuarrie'],
          pic: 'Rotate molecules from H₂O (C₂ᵥ) to NH₃ (C₃ᵥ), benzene (D₆ₕ), CH₄ (T_d) and SF₆ (Oₕ); the full set of operations is listed and the group multiplication table fills in as you compose them.' },
        { num: '8.3', kind: 'Method', name: 'Assigning a point group: the flowchart', deps: ['qchem-8.2'], refs: ['McQuarrie'],
          pic: 'Walk any molecule through the decision tree — linear? high symmetry? principal axis? perpendicular C₂? horizontal mirror? — with the relevant element highlighted in 3D at each question.' },
        { num: '8.4', kind: 'Definition', name: 'Representations and character tables', deps: ['qchem-8.2', 'rep-1.1'], refs: ['McQuarrie'],
          pic: 'Watch the three p orbitals transform under each operation of C₂ᵥ; the transformation matrices appear, their traces fill in a row of the character table, and the matrices block-diagonalize into irreducible pieces.' },
        { num: '8.5', kind: 'Theorem', name: 'Great orthogonality and the reduction formula', deps: ['qchem-8.4', 'rep-3.5', 'rep-3.6'], refs: ['McQuarrie'],
          pic: 'Character rows are drawn as vectors weighted by class size; their dot products vanish pairwise, and projecting a reducible character onto them returns the integer multiplicities of each irrep.' },
        { num: '8.6', kind: 'Method', name: 'Symmetry-adapted linear combinations', deps: ['qchem-8.5', 'rep-3.12'], refs: ['McQuarrie'],
          pic: 'Apply the projection operator to one hydrogen 1s orbital of NH₃ and watch it generate an A₁ combination and a degenerate E pair, which then match up with the nitrogen orbitals of the same symmetry.' },
        { num: '8.7', kind: 'Theorem', name: 'Vanishing integral rule', deps: ['qchem-8.5'], refs: ['McQuarrie'],
          pic: 'Integrate the product of two orbitals numerically over a molecule-shaped grid: when their symmetry species differ the positive and negative regions cancel exactly, whatever the orbital shapes are deformed to.' },
        { num: '8.8', kind: 'Proposition', name: 'Polarity and chirality from symmetry', deps: ['qchem-8.2'], refs: ['McQuarrie'],
          pic: 'Pick a molecule and the app tests its point group: a dipole is allowed only in Cₙ, Cₙᵥ and Cₛ, and chirality only without any improper axis; reflect a chiral molecule and it cannot be rotated back onto itself.' },
        { num: '8.9', kind: 'Method', name: 'Counting normal modes by symmetry', deps: ['qchem-8.5', 'mech-11.4'], refs: ['McQuarrie'],
          pic: 'Attach x, y, z arrows to every atom of H₂O or NH₃, count unmoved atoms under each operation to build the 3N character, subtract translations and rotations, and see the irreps of the vibrations animate.' },
        { num: '8.10', kind: 'Theorem', name: 'IR and Raman activity selection rules', deps: ['qchem-8.7', 'qchem-8.9'], refs: ['McQuarrie'],
          pic: 'Each animated normal mode is checked against the character-table columns: modes transforming like x, y or z light up in the IR spectrum, those like quadratic functions in the Raman spectrum.' },
        { num: '8.11', kind: 'Theorem', name: 'Rule of mutual exclusion', deps: ['qchem-8.10'], refs: ['McQuarrie'],
          pic: 'Compare CO₂ with N₂O, or trans with cis dichloroethylene: in the centrosymmetric molecule no band appears in both the IR and Raman spectra, and removing the inversion centre lets them overlap.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 9
    {
      n: 9,
      title: 'Rotational and vibrational spectroscopy',
      summary: String.raw`Light talks to molecules through the transition dipole, and the rules for when it does so turn the rotor and oscillator models into a reading of bond lengths and force constants. Microwave spectra give moments of inertia, infrared spectra give vibrational frequencies and anharmonicity, rovibrational band structure gives both, and Raman scattering reaches the modes infrared cannot see.`,
      items: [
        { num: '9.1', kind: 'Theorem', name: 'Transition dipole and Fermi’s golden rule', deps: ['qchem-1.14', 'qchem-4.4', 'em-12.7'], refs: ['McQuarrie ch. 8'],
          pic: 'Drive a two-level system with light of tunable frequency: the transition probability builds up only near resonance with a sinc² lineshape that narrows as the interaction time grows, matching the golden-rule rate.' },
        { num: '9.2', kind: 'Principle', name: 'Spectroscopic selection rules', deps: ['qchem-9.1', 'qchem-8.7'], refs: ['McQuarrie ch. 8'],
          pic: 'Pick initial and final states (rotor, oscillator or hydrogen): the transition-dipole integral is computed numerically and drawn as a bright or dark line, showing ΔJ = ±1, Δv = ±1 and Δl = ±1 emerge from the integrals.' },
        { num: '9.3', kind: 'Model', name: 'Microwave spectrum of a rigid diatomic', deps: ['qchem-1.9', 'qchem-9.2'], refs: ['McQuarrie ch. 6'],
          pic: 'Lines at 2B(J+1) appear with even spacing; drag the bond length and the spacing shrinks as 1/r², and fitting a measured CO spectrum returns its bond length to four digits.' },
        { num: '9.4', kind: 'Phenomenon', name: 'Rotational line intensities and Boltzmann populations', deps: ['qchem-9.3', 'thermo-6.1'], refs: ['McQuarrie ch. 6'],
          pic: 'Raise the temperature and the envelope of rotational line intensities shifts to higher J, tracking (2J+1)e^(−E_J/kT); the peak J read off the spectrum works as a thermometer.' },
        { num: '9.5', kind: 'Phenomenon', name: 'Centrifugal distortion', deps: ['qchem-9.3', 'qchem-1.7'], refs: ['McQuarrie ch. 6'],
          pic: 'Spin a diatomic faster with a J slider: the bond stretches and line spacings shrink below 2B; the distortion constant D fitted from the shift predicts the vibrational frequency.' },
        { num: '9.6', kind: 'Model', name: 'Symmetric, spherical and asymmetric tops', deps: ['qchem-9.3', 'mech-10.8'], refs: ['McQuarrie ch. 6'],
          pic: 'Morph a molecule’s principal moments: for a symmetric top the levels depend on J and K, for a spherical top lines merge, and for an asymmetric top the levels split into a computed tangle.' },
        { num: '9.7', kind: 'Model', name: 'Harmonic vibrational spectrum', deps: ['qchem-1.7', 'qchem-9.2'], refs: ['McQuarrie ch. 5'],
          pic: 'Set the force constant and reduced mass of a bond: a single IR line appears at the computed wavenumber, and the dipole-derivative slider shows homonuclear N₂ staying silent.' },
        { num: '9.8', kind: 'Phenomenon', name: 'Anharmonicity, overtones and the Birge–Sponer plot', deps: ['qchem-9.7', 'qchem-5.12'], refs: ['McQuarrie ch. 5'],
          pic: 'Switch the bond to a Morse potential: overtones appear just below 2ν and 3ν, level spacings shrink linearly, and extrapolating them to zero gives an estimate of the dissociation energy.' },
        { num: '9.9', kind: 'Phenomenon', name: 'Rovibrational P and R branches', deps: ['qchem-9.3', 'qchem-9.7'], refs: ['McQuarrie ch. 6'],
          pic: 'Build the HCl fundamental band line by line with ΔJ = ±1: P and R branches flank a missing Q line, and making the upper-state bond longer makes the R branch lines bunch together toward a band head.' },
        { num: '9.10', kind: 'Phenomenon', name: 'Isotope shifts', deps: ['qchem-9.9'], refs: ['McQuarrie ch. 5'],
          pic: 'Toggle between H³⁵Cl and H³⁷Cl or H and D: each line splits or shifts by the reduced-mass ratio, and the doubled lines of natural HCl appear with their 3:1 abundance ratio.' },
        { num: '9.11', kind: 'Phenomenon', name: 'Raman scattering', deps: ['qchem-9.2', 'qchem-4.6'], refs: ['McQuarrie ch. 6'],
          pic: 'Scatter monochromatic light off a molecule whose polarizability oscillates with a vibration: Stokes and anti-Stokes sidebands appear, with the anti-Stokes line fading as the temperature is lowered.' },
        { num: '9.12', kind: 'Concept', name: 'Group frequencies in polyatomic spectra', deps: ['qchem-9.7', 'qchem-8.9'], refs: ['McQuarrie ch. 5'],
          pic: 'Normal modes of a small organic molecule are computed from a force field; the C=O, O–H and C–H stretches stay near fixed wavenumbers as the rest of the molecule is changed.' },
        { num: '9.13', alias: 'waves-4.15', name: 'Beer–Lambert law' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 10
    {
      n: 10,
      title: 'Electronic spectroscopy, photophysics and magnetic resonance',
      summary: String.raw`When light promotes an electron, the nuclei are caught off guard: the Franck–Condon principle explains the shape of absorption bands, and the Jablonski diagram tracks what the excited molecule does next — fluoresce, cross to a triplet, or relax as heat. Einstein's coefficients link absorption to emission and lead to the laser; line widths encode lifetimes and temperature. Magnetic resonance closes the course, reading molecular structure from spins.`,
      items: [
        { num: '10.1', kind: 'Principle', name: 'Franck–Condon principle', deps: ['qchem-5.1', 'qchem-1.7', 'qchem-9.1'], refs: ['McQuarrie'],
          pic: 'Displace the excited-state potential relative to the ground one with a slider: vertical transitions land where the overlap of vibrational wavefunctions is largest, and the computed intensity pattern shifts from a single 0–0 line to a long progression.' },
        { num: '10.2', kind: 'Phenomenon', name: 'Vibronic progressions in absorption spectra', deps: ['qchem-10.1', 'qchem-9.8'], refs: ['McQuarrie'],
          pic: 'Simulate the iodine visible absorption band: the progression of lines converges toward the dissociation limit of the excited state, and a temperature slider adds hot bands from excited ground-state levels.' },
        { num: '10.3', kind: 'Principle', name: 'Spin selection rule and singlet–triplet splitting', deps: ['qchem-9.2', 'qchem-3.6'], refs: ['McQuarrie'],
          pic: 'Compare singlet and triplet excited states built from the same orbitals: exchange puts the triplet lower, and a spin–orbit slider (light to heavy atoms) lets the forbidden singlet–triplet transition gain intensity.' },
        { num: '10.4', kind: 'Model', name: 'Jablonski diagram', deps: ['qchem-10.3'], refs: ['McQuarrie'],
          pic: 'Excite a population of molecules and follow them stochastically through absorption, vibrational relaxation, internal conversion, intersystem crossing, fluorescence and phosphorescence; the rate sliders change the quantum yields read out live.' },
        { num: '10.5', kind: 'Principle', name: 'Kasha’s rule', deps: ['qchem-10.4'], refs: ['McQuarrie'],
          pic: 'Excite into S₁, S₂ or S₃: emission always comes from S₁ because internal conversion between upper states is far faster, until an azulene preset with a large S₂–S₁ gap shows the famous exception.' },
        { num: '10.6', kind: 'Phenomenon', name: 'Stokes shift and the mirror-image rule', deps: ['qchem-10.1', 'qchem-10.5'], refs: ['McQuarrie'],
          pic: 'Absorption and fluorescence spectra are computed from the same displaced potentials: they are mirror images about the 0–0 line, separated by a Stokes shift that grows with the displacement and a solvent-relaxation slider.' },
        { num: '10.7', kind: 'Principle', name: 'El-Sayed rules for intersystem crossing', deps: ['qchem-10.3'], refs: ['McQuarrie'],
          pic: 'Compare intersystem crossing rates between states of the same or different orbital type (ππ* and nπ*): crossings that change orbital type are much faster, shown by the triplet yield of benzophenone versus an aromatic hydrocarbon.' },
        { num: '10.8', kind: 'Law', name: 'Einstein A and B coefficients', deps: ['qchem-9.1', 'thermo-9.10'], refs: ['McQuarrie'],
          pic: 'Two-level atoms in a radiation field of adjustable temperature reach a steady population ratio only if stimulated emission is included; the readout shows A/B ∝ ν³, which makes ultraviolet lasers hard.' },
        { num: '10.9', kind: 'Invention', name: 'The laser and population inversion', deps: ['qchem-10.8', 'qchem-10.4'], refs: ['McQuarrie'],
          pic: 'Pump a three- or four-level system with a slider: below threshold the cavity output is weak spontaneous light, above it the photon number jumps and the upper population clamps, with the threshold computed from losses.' },
        { num: '10.10', kind: 'Phenomenon', name: 'Line broadening: natural, Doppler and pressure', deps: ['qchem-9.1'], refs: ['McQuarrie'],
          pic: 'Adjust lifetime, temperature and pressure: the line morphs between a Lorentzian, a Gaussian and their Voigt convolution, and the readout splits the width into its three contributions.' },
        { num: '10.11', kind: 'Phenomenon', name: 'Rabi oscillations in a two-level system', deps: ['qchem-9.1'], refs: ['McQuarrie ch. 8'],
          pic: 'Drive a two-level system with a strong field: the excited population oscillates sinusoidally at the Rabi frequency, detuning the drive lowers and speeds the oscillation, and damping washes it into the golden-rule regime.' },
        { num: '10.12', kind: 'Method', name: 'Photoelectron spectroscopy', deps: ['qchem-7.6'], refs: ['Szabo–Ostlund ch. 3'],
          pic: 'Ionize a molecule with a fixed photon energy: kinetic-energy peaks map onto orbital energies, and the vibrational fine structure of each band reveals whether the ejected electron was bonding, nonbonding or antibonding.' },
        { num: '10.13', kind: 'Phenomenon', name: 'NMR chemical shift', deps: ['qchem-2.7'], refs: ['McQuarrie'],
          pic: 'Place protons in environments of different electron density: shielding shifts each resonance, and dragging an electronegative substituent closer moves the neighbouring peak downfield.' },
        { num: '10.14', kind: 'Phenomenon', name: 'Spin–spin coupling and multiplet patterns', deps: ['qchem-10.13'], refs: ['McQuarrie'],
          pic: 'Couple a proton to n equivalent neighbours: its line splits into n + 1 peaks with binomial intensities (Pascal’s triangle), and making the shift difference comparable to J distorts the pattern into a second-order roof.' },
      ],
    },
  ],
};
