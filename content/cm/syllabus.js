// Syllabus — Condensed Matter Physics (curated course; see collection.js for references)
//
// Sources consulted (research pass, Oct 2026):
//   Ashcroft & Mermin, Solid State Physics (1976) — 34-chapter list (1 Drude … 34 Superconductivity),
//     confirmed against library/bookseller TOCs: https://dk.fchpt.stuba.sk/Record/fchpt.5573 ;
//     refs are chapter-level ("Ashcroft–Mermin ch. N")
//   Kittel, Introduction to Solid State Physics 8e — 22-chapter list:
//     https://en.wikipedia.org/wiki/Introduction_to_Solid_State_Physics
//   S. H. Simon, The Oxford Solid State Basics (Oxford course text) — section-level TOC from the
//     author's course PDF; podcast lecture series: https://www.podcasts.ox.ac.uk/series/oxford-solid-state-basics
//   MIT 8.231 Physics of Solids I syllabus: https://ocw.mit.edu/courses/8-231-physics-of-solids-i-fall-2006/pages/syllabus/
//   Cambridge Mathematical Tripos schedules, Part II Applications of Quantum Mechanics (periodic
//     potentials, crystalline solids, Landau levels): https://www.maths.cam.ac.uk/undergrad/course/schedules.pdf
//   Wikipedia: https://en.wikipedia.org/wiki/Category:Theorems_in_quantum_mechanics (Bloch, Mermin–Wagner)
// Gaps filled after comparison: Madelung constant and van der Waals solids, Thomas–Fermi screening,
//   Matthiessen’s rule, Fermi-liquid quasiparticles, cyclotron resonance, Anderson localization,
//   Lyddane–Sachs–Teller relation, ferroelectric soft modes, polarons, Bloch–Grüneisen law, excitons,
//   Hubbard model and Mott insulators, Kondo effect, cuprate superconductors.
// De-duplicated against parallel syllabi (cm depends on these instead of repeating them):
//   crystallography → xtal (Bravais lattices xtal-1.1/3.2, reciprocal lattice xtal-5.1, Brillouin zones
//   xtal-5.4, Bragg/Laue xtal-6.2/6.4, structure factor, Ewald, powder diffraction, quasicrystals);
//   qm (Bloch’s theorem qm-9.7, Kronig–Penney qm-9.8, tight-binding chain qm-9.9, Bloch oscillations
//   qm-9.10, Landau levels qm-6.8, band filling qm-10.13, exchange/Heisenberg qm-10.14);
//   thermo (Fermi–Dirac thermo-8.4, degenerate Fermi gas thermo-8.9, Sommerfeld expansion and electronic
//   heat capacity thermo-8.10, Pauli paramagnetism thermo-8.11, Einstein solid thermo-5.3, Debye model
//   thermo-9.13/9.14, Curie’s law thermo-6.10, Weiss mean field thermo-11.5, Curie–Weiss thermo-11.6,
//   Mermin–Wagner thermo-11.21); em (Drude model em-6.4, Hall effect em-7.5, plasma frequency em-11.14,
//   diamagnetism em-8.2, domains and hysteresis em-8.9/8.10, Meissner effect em-8.15); energy (photovoltaic
//   cell energy-4.3, Shockley–Queisser limit energy-4.5).
// Deliberate omissions: Hund’s rules and atomic magnetism (qm/qchem), magnetic resonance (qinfo), surfaces,
//   alloys, amorphous solids, Peierls instability (not in the references).
// Landmark papers (kind 'Paper') appended Oct 2026; each citation checked against Crossref, the publisher, or a digitized library copy.
export default {
  collection: 'cm',
  chapters: [
    // ───────────────────────────────────────────────────────────── 1
    {
      n: 1,
      title: 'Electrons in a periodic potential',
      summary: String.raw`Sommerfeld’s free electrons fill a Fermi sphere; put them in a crystal and, by Bloch’s theorem (from quantum mechanics), the states are labelled by a crystal momentum in the Brillouin zone and a band index. A weak periodic potential opens gaps where free-electron energies meet Bragg planes, tight binding builds bands from atomic orbitals, and counting two states per cell per band sorts metals from insulators. The same machinery gives Fermi surfaces, van Hove singularities, Dirac cones in graphene, localized Wannier orbitals, topological edge states and, with disorder, Anderson localization.`,
      items: [
        { num: '1.1', kind: 'Model', name: 'Sommerfeld model: the Fermi sphere of a metal', deps: ['thermo-8.9', 'em-6.4', 'qm-8.1'], refs: ['Ashcroft–Mermin ch. 2', 'Kittel ch. 6'],
          pic: 'Fill a k-space grid of a box with periodic boundary conditions, two electrons per point: the occupied region rounds into a Fermi sphere, the density of states ∝ E^{(d−2)/2} appears in 1, 2 or 3 dimensions, and Fermi energies and velocities of real metals are read out from their electron densities.' },
        { num: '1.2', kind: 'Definition', name: 'Crystal momentum and zone schemes', deps: ['qm-9.7', 'xtal-5.4'], refs: ['Ashcroft–Mermin ch. 8', 'Kittel ch. 7'],
          pic: 'Toggle extended, reduced and repeated zone schemes for the same band structure: branches fold into the first zone by reciprocal-lattice vectors and nothing physical changes.' },
        { num: '1.3', kind: 'Model', name: 'Nearly-free electron model', deps: ['qm-9.7', 'xtal-5.5', 'ladr-7.31'], refs: ['Ashcroft–Mermin ch. 9', 'Kittel ch. 7'],
          pic: 'Band structure as the lattice potential is turned up: the free parabola splits at each zone boundary with gaps 2|U_G| computed by diagonalising the plane-wave Hamiltonian live.' },
        { num: '1.4', kind: 'Phenomenon', name: 'Band gaps at Bragg planes', deps: ['cm-1.3', 'xtal-6.2'], refs: ['Ashcroft–Mermin ch. 9', 'Kittel ch. 7'],
          pic: 'At the zone boundary the two standing waves are drawn with the ionic potential: one piles charge on the ions and sinks, the other between them and rises, and the energy difference equals the gap.' },
        { num: '1.5', kind: 'Model', name: 'Graphene: tight-binding bands and Dirac cones', deps: ['qm-9.9', 'xtal-1.1', 'ladr-7.31'], refs: ['Ashcroft–Mermin ch. 10'],
          pic: 'Honeycomb tight-binding bands as a 3D surface over the Brillouin zone: valence and conduction bands touch in cones at the K points, and making the two sublattices inequivalent opens a gap.' },
        { num: '1.6', kind: 'Theorem', name: 'Each band holds two electrons per primitive cell', deps: ['cm-1.2', 'comb-1.1'], refs: ['Ashcroft–Mermin ch. 8', 'Kittel ch. 7'],
          pic: 'A crystal of N cells with periodic boundary conditions: count the allowed k values in one band (exactly N) and double for spin, as the N slider grows.' },
        { num: '1.7', kind: 'Model', name: 'Fermi surfaces', deps: ['qm-9.9', 'cm-1.1'], refs: ['Ashcroft–Mermin ch. 9', 'Kittel ch. 9'],
          pic: 'Square-lattice tight binding with a filling slider: the Fermi contour grows from a circle to a diamond at half filling and then becomes hole pockets around the zone corners.' },
        { num: '1.8', kind: 'Definition', name: 'Density of states and van Hove singularities', deps: ['qm-9.9', 'cm-1.1'], refs: ['Ashcroft–Mermin ch. 8'],
          pic: 'Histogram the band energies over a fine k-grid: in 1D the density of states diverges at the band edges, in 2D it has a logarithmic peak at the saddle point, and the singularities sit where ∇E = 0.' },
        { num: '1.9', kind: 'Theorem', name: 'Wannier functions', deps: ['qm-9.7', 'qm-9.9', 'rca-4.26'], refs: ['Ashcroft–Mermin ch. 10'],
          pic: 'Fourier-transform the Bloch states of one band over the Brillouin zone to get an orbital centred on one cell; a phase-gauge slider shows how the choice of phases makes it more or less localized.' },
        { num: '1.10', kind: 'Phenomenon', name: 'Topological edge states: the SSH chain', deps: ['qm-9.9', 'pma-3.26'], refs: ['Ashcroft–Mermin ch. 10'],
          pic: 'A chain with alternating hoppings: when the intercell bond is stronger, an open chain hosts two zero-energy states pinned to its ends, and the bulk winding number readout jumps from 0 to 1.' },
        { num: '1.11', kind: 'Phenomenon', name: 'Anderson localization', deps: ['qm-9.9'], refs: ['Kittel ch. 19'],
          pic: 'Add random on-site energies to a tight-binding chain: eigenstates that were extended Bloch waves shrink to exponentially localized blobs, and the localization length readout falls as the disorder slider rises.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 2
    {
      n: 2,
      title: 'Transport and semiclassical dynamics',
      summary: String.raw`Wave packets from one band move at the band’s group velocity while forces change their crystal momentum; band curvature becomes an effective mass, and nearly full bands act as positive holes — which explains the anomalous Hall coefficients that defeated the free-electron model. Wiedemann–Franz and Matthiessen’s rules organize transport, screening and Fermi-liquid ideas explain why independent electrons work so well, and in a magnetic field electrons orbit the Fermi surface, giving cyclotron resonance, quantum oscillations that map Fermi surfaces, and the integer quantum Hall effect.`,
      items: [
        { num: '2.1', kind: 'Definition', name: 'Band velocity', deps: ['cm-1.2'], refs: ['Ashcroft–Mermin ch. 12', 'Kittel ch. 8'],
          pic: 'A wave packet built from Bloch states near a chosen k moves at (1/ħ)∂E/∂k, which slows to zero at the zone boundary although the wave vector is far from zero.' },
        { num: '2.2', kind: 'Law', name: 'Semiclassical equations of motion', deps: ['cm-2.1'], refs: ['Ashcroft–Mermin ch. 12', 'Kittel ch. 8'],
          pic: 'Apply a force to a band electron: its crystal momentum marches uniformly across the zone while its velocity and position follow from the band shape, integrated side by side.' },
        { num: '2.3', kind: 'Definition', name: 'Effective-mass tensor', deps: ['cm-2.2', 'ladr-7.29', 'pma-9.15'], refs: ['Ashcroft–Mermin ch. 12', 'Kittel ch. 8'],
          pic: 'Fit a parabola to the band near a minimum or maximum: the curvature gives the effective mass, negative near the band top, and in 2D its principal axes are the eigenvectors of the Hessian.' },
        { num: '2.4', kind: 'Definition', name: 'Holes', deps: ['cm-2.3', 'qm-10.13'], refs: ['Ashcroft–Mermin ch. 12', 'Kittel ch. 8'],
          pic: 'Remove one electron from a full band and apply a field: the vacancy drifts as a positive charge with positive mass, and the Hall voltage of a nearly full band flips sign accordingly.' },
        { num: '2.5', kind: 'Phenomenon', name: 'Positive Hall coefficients: holes rescue band theory', deps: ['em-7.5', 'cm-2.4'], refs: ['Ashcroft–Mermin ch. 3', 'Kittel ch. 6'],
          pic: 'Measured Hall coefficients are plotted against −1/(ne) from valence: alkali metals sit on the line, while beryllium, zinc and cadmium have the wrong sign — reproduced when the carriers are holes near the top of a nearly full band.' },
        { num: '2.6', kind: 'Law', name: 'Wiedemann–Franz law', deps: ['em-6.4', 'thermo-8.10'], refs: ['Ashcroft–Mermin ch. 1', 'Ashcroft–Mermin ch. 2'],
          pic: 'Plot thermal over electrical conductivity divided by temperature for several metals: Drude’s classical estimate lands close by a lucky cancellation, and the Sommerfeld value π²k²/3e² fits the data.' },
        { num: '2.7', kind: 'Law', name: 'Matthiessen’s rule', deps: ['em-6.4', 'prob-2.1.13'], refs: ['Ashcroft–Mermin ch. 16'],
          pic: 'Add impurity scattering and phonon scattering with separate rate sliders: the resistivities add, giving a temperature-independent residual plus a temperature-dependent part, as in measured curves for samples of different purity.' },
        { num: '2.8', kind: 'Model', name: 'Thomas–Fermi screening', deps: ['cm-1.1', 'vcalc-9.4', 'pma-5.15'], refs: ['Ashcroft–Mermin ch. 17'],
          pic: 'Drop a test charge into an electron gas: the electrons rearrange and the potential falls off as e^{−r/λ}/r with a Thomas–Fermi length set by the density of states, compared with the bare Coulomb tail.' },
        { num: '2.9', kind: 'Concept', name: 'Fermi-liquid quasiparticles', deps: ['cm-1.1', 'thermo-8.4'], refs: ['Ashcroft–Mermin ch. 17'],
          pic: 'Excite an electron just above the Fermi surface: phase space for scattering it off the Fermi sea shrinks as (E − E_F)², so its lifetime grows without bound near E_F, computed by counting allowed final states.' },
        { num: '2.10', kind: 'Phenomenon', name: 'Cyclotron resonance', deps: ['cm-2.3', 'em-7.1'], refs: ['Kittel ch. 8'],
          pic: 'Sweep the magnetic field on a semiconductor in a microwave field: absorption peaks when ω = eB/m*, and rotating the field direction maps out the effective-mass tensor of electrons and holes.' },
        { num: '2.11', kind: 'Phenomenon', name: 'Cyclotron orbits on the Fermi surface', deps: ['cm-2.2', 'cm-1.7', 'pma-9.15'], refs: ['Ashcroft–Mermin ch. 12', 'Kittel ch. 9'],
          pic: 'In a magnetic field k moves along a constant-energy contour while the real-space orbit traces the same shape rotated by 90°; changing the filling turns closed electron orbits into hole orbits or open orbits.' },
        { num: '2.12', kind: 'Phenomenon', name: 'de Haas–van Alphen oscillations', deps: ['qm-6.8', 'cm-1.7'], refs: ['Ashcroft–Mermin ch. 14', 'Kittel ch. 9'],
          pic: 'The computed magnetization oscillates as Landau levels cross the Fermi energy; replotted against 1/B the oscillations are periodic, and the period gives the extremal cross-section of the Fermi surface you drew.' },
        { num: '2.13', kind: 'Phenomenon', name: 'Integer quantum Hall effect', deps: ['qm-6.8', 'em-7.5'], refs: ['Kittel ch. 17'],
          pic: 'Sweep the field across a disordered 2D gas: the Hall resistance locks onto plateaus at h/(νe²) while the longitudinal resistance vanishes, explained by localized bulk states and conducting edge channels.' },
        { num: '2.14', kind: 'Paper', name: 'Fine-structure constant from quantized Hall resistance',
          paper: { authors: 'K. v. Klitzing, G. Dorda and M. Pepper', year: 1980, title: 'New Method for High-Accuracy Determination of the Fine-Structure Constant Based on Quantized Hall Resistance', venue: 'Physical Review Letters 45 (6): 494–497', doi: '10.1103/PhysRevLett.45.494' },
          introduces: ['cm-2.13'], deps: ['qm-6.8', 'em-7.5', 'cm-4.10'], refs: [],
          pic: 'Sweep the gate voltage of a silicon MOSFET at 1.5 K in an 18 T field, as in the paper: the Hall voltage forms flat plateaus at h/ie² while the longitudinal voltage drops to zero, and fitting a plateau gives the fine-structure constant to a few parts per million.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 3
    {
      n: 3,
      title: 'Lattice vibrations, binding and defects',
      summary: String.raw`Crystals are held together by electrostatics in ionic solids and van der Waals forces in noble-gas solids. Their atoms vibrate in normal modes labelled by wave vectors in the Brillouin zone: acoustic branches become sound, and lattices with a basis add optical branches that couple to light (polaritons, the LST relation) and can soften into ferroelectric order. Quantized modes are phonons, measured by neutron scattering; anharmonicity gives thermal expansion and finite heat conduction, phonons limit electrical resistance, and dislocations explain why real crystals are weak.`,
      items: [
        { num: '3.1', kind: 'Model', name: 'Ionic crystals and the Madelung constant', deps: ['xtal-1.1', 'pma-3.54'], refs: ['Ashcroft–Mermin ch. 20', 'Kittel ch. 3'],
          pic: 'Sum the Coulomb energy of one ion in rock salt shell by shell: the naive sum wanders because the series is only conditionally convergent, while summing over neutral cubes (Evjen) settles on 1.7476.' },
        { num: '3.2', kind: 'Model', name: 'Van der Waals solids: the Lennard-Jones crystal', deps: ['xtal-1.5'], refs: ['Ashcroft–Mermin ch. 20', 'Kittel ch. 3'],
          pic: 'Pair Lennard-Jones potentials summed over fcc, hcp and bcc lattices: the cohesive energy versus lattice constant is plotted for each, with the equilibrium spacing and bulk modulus compared with solid argon.' },
        { num: '3.3', kind: 'Model', name: 'Diatomic chain: acoustic and optical branches', deps: ['mech-11.8', 'xtal-5.4', 'ladr-7.29'], refs: ['Ashcroft–Mermin ch. 22', 'Kittel ch. 4'],
          pic: 'A mass-ratio slider opens a gap between two branches; animated modes show neighbours moving together on the acoustic branch and against each other on the optical one.' },
        { num: '3.4', kind: 'Theorem', name: 'Counting phonon branches', deps: ['cm-3.3', 'mech-11.4', 'ladr-7.31'], refs: ['Ashcroft–Mermin ch. 22', 'Kittel ch. 4'],
          pic: 'Choose a 3D crystal with p atoms per cell: the dynamical matrix is diagonalised and exactly 3 acoustic and 3(p − 1) optical branches are found, for 3pN modes in all.' },
        { num: '3.5', kind: 'Definition', name: 'Phonons', deps: ['cm-3.4', 'qm-4.1', 'pma-3.26'], refs: ['Ashcroft–Mermin ch. 23', 'Kittel ch. 4'],
          pic: 'Each normal mode is a quantum oscillator with a ladder of levels ħω(n + ½); a temperature slider fills the ladders according to Bose–Einstein occupation, shown as a heat map over the zone.' },
        { num: '3.6', kind: 'Phenomenon', name: 'Speed of sound from the acoustic branch', deps: ['mech-11.8'], refs: ['Ashcroft–Mermin ch. 22', 'Kittel ch. 4'],
          pic: 'Zoom into the long-wavelength end of the acoustic branch: its slope gives the sound speed a√(K/m), compared with measured sound speeds when the spring constant is fitted from the bulk modulus.' },
        { num: '3.7', alias: 'thermo-6.13', name: 'Dulong–Petit law' },
        { num: '3.8', kind: 'Method', name: 'Inelastic neutron scattering', deps: ['cm-3.5', 'xtal-6.4'], refs: ['Ashcroft–Mermin ch. 24', 'Kittel ch. 4'],
          pic: 'Scatter neutrons of known energy and momentum: conservation picks out a phonon on the dispersion surface, and scanning the detector traces the branches point by point.' },
        { num: '3.9', kind: 'Phenomenon', name: 'Thermal expansion from anharmonicity', deps: ['cm-3.2'], refs: ['Ashcroft–Mermin ch. 25', 'Kittel ch. 5'],
          pic: 'Atoms in an asymmetric (Morse) potential vibrate harder as temperature rises and their average separation grows; a harmonic toggle shows zero expansion at any temperature.' },
        { num: '3.10', kind: 'Phenomenon', name: 'Thermal conductivity of insulators and Umklapp scattering', deps: ['cm-3.5', 'xtal-5.4'], refs: ['Ashcroft–Mermin ch. 25', 'Kittel ch. 5'],
          pic: 'Phonon collisions are drawn in the zone: normal processes conserve total crystal momentum and cannot stop heat flow, while Umklapp processes that leave the zone can, giving the measured conductivity peak versus T.' },
        { num: '3.11', kind: 'Law', name: 'Lindemann melting criterion', deps: ['thermo-5.3', 'cm-3.5'], refs: ['Ashcroft–Mermin ch. 21'],
          pic: 'The rms vibration amplitude computed from the Einstein or Debye model grows with temperature; melting points of real elements land where it reaches about a tenth of the atomic spacing.' },
        { num: '3.12', kind: 'Theorem', name: 'Lyddane–Sachs–Teller relation and polaritons', deps: ['cm-3.3', 'em-11.12'], refs: ['Ashcroft–Mermin ch. 27', 'Kittel ch. 14'],
          pic: 'In an ionic crystal the transverse optical phonon couples to light: the polariton branches avoid crossing, leaving a reflection band between ω_TO and ω_LO whose ratio squared equals ε(0)/ε(∞).' },
        { num: '3.13', kind: 'Phenomenon', name: 'Ferroelectrics and the soft mode', deps: ['cm-3.12', 'thermo-11.13'], refs: ['Kittel ch. 16', 'Ashcroft–Mermin ch. 27'],
          pic: 'Cool a displacive ferroelectric: a transverse optical phonon frequency falls toward zero at T_c, so by the LST relation the static dielectric constant diverges, and below T_c a spontaneous polarization appears in a Landau double well.' },
        { num: '3.14', kind: 'Phenomenon', name: 'Polarons', deps: ['cm-3.12', 'cm-2.3', 'rca-3.3'], refs: ['Kittel ch. 14'],
          pic: 'An electron in an ionic crystal drags a cloud of lattice distortion with it; a coupling-strength slider shows the binding energy and the effective-mass enhancement, from a weak dressing to self-trapping.' },
        { num: '3.15', kind: 'Law', name: 'Bloch–Grüneisen law for phonon resistivity', deps: ['cm-3.5', 'cm-2.7', 'thermo-9.13', 'rca-1.26'], refs: ['Ashcroft–Mermin ch. 26'],
          pic: 'Electron–phonon scattering computed with a Debye spectrum gives a resistivity linear in T at high temperature and falling as T⁵ well below the Debye temperature, overlaid on data for sodium and copper.' },
        { num: '3.16', kind: 'Phenomenon', name: 'Dislocations and the weakness of real crystals', deps: ['xtal-1.1'], refs: ['Kittel ch. 21', 'Ashcroft–Mermin ch. 30'],
          pic: 'Shear a 2D crystal of bonded atoms: sliding a whole plane needs a stress near G/2π, but an edge dislocation glides row by row under a tiny stress, like moving a ruck along a carpet.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 4
    {
      n: 4,
      title: 'Semiconductors and devices',
      summary: String.raw`In a semiconductor the gap is small enough that temperature and impurities control the carrier densities: their product is fixed by the gap, and dopants behave like scaled-up hydrogen atoms. Carriers drift in fields and diffuse down gradients. Joining p- and n-type material builds a depletion layer and a built-in field, giving the diode’s exponential current–voltage curve and, from there, LEDs, transistors, quantum wells and excitons (solar cells and their efficiency limit are developed in energy).`,
      items: [
        { num: '4.1', kind: 'Definition', name: 'Direct and indirect band gaps', deps: ['qm-10.13', 'cm-2.3'], refs: ['Ashcroft–Mermin ch. 28', 'Kittel ch. 8'],
          pic: 'Band edges of GaAs and silicon side by side: a photon (nearly vertical arrow) bridges the direct gap alone, while the indirect gap needs a phonon to supply momentum, and absorption edges are compared.' },
        { num: '4.2', kind: 'Model', name: 'Intrinsic carrier density', deps: ['cm-4.1', 'thermo-8.4', 'cm-2.4', 'pma-8.21'], refs: ['Ashcroft–Mermin ch. 28', 'Kittel ch. 8'],
          pic: 'Thermal excitation across the gap: n_i ∝ T^{3/2} e^{−E_g/2kT} is computed for Ge, Si and GaAs and plotted on an Arrhenius plot whose slope gives the gap.' },
        { num: '4.3', kind: 'Law', name: 'Law of mass action: np = n_i²', deps: ['cm-4.2'], refs: ['Ashcroft–Mermin ch. 28', 'Kittel ch. 8'],
          pic: 'A doping slider adds donors: the electron density rises, the hole density falls in exact proportion, and their product stays pinned to n_i² at fixed temperature.' },
        { num: '4.4', kind: 'Model', name: 'Donors and acceptors as hydrogenic impurities', deps: ['cm-4.1', 'cm-2.3', 'qm-8.12'], refs: ['Ashcroft–Mermin ch. 28', 'Kittel ch. 8'],
          pic: 'Scale the hydrogen atom by the effective mass and dielectric constant: the binding energy drops to about 10 meV and the orbit swells to span hundreds of lattice sites, drawn to scale on the crystal.' },
        { num: '4.5', kind: 'Definition', name: 'Chemical potential versus doping and temperature', deps: ['cm-4.3', 'cm-4.4', 'pma-4.23', 'pma-5.11'], refs: ['Ashcroft–Mermin ch. 28', 'Kittel ch. 8'],
          pic: 'Track the Fermi level of an n-type sample as temperature rises: freeze-out, the extrinsic plateau and the intrinsic regime appear in turn, computed from charge neutrality.' },
        { num: '4.6', kind: 'Model', name: 'Drift, diffusion and the Einstein relation', deps: ['cm-4.5', 'em-6.4', 'thermo-7.6'], refs: ['Ashcroft–Mermin ch. 29'],
          pic: 'Carriers in a density gradient diffuse while a field makes them drift; in equilibrium the two currents cancel, and the simulated ratio of diffusivity to mobility equals kT/e.' },
        { num: '4.7', kind: 'Model', name: 'The p–n junction', deps: ['cm-4.6', 'vcalc-9.4'], refs: ['Ashcroft–Mermin ch. 29', 'Kittel ch. 8'],
          pic: 'Join p- and n-type regions: carriers diffuse and recombine, Poisson’s equation is solved for the depletion layer, and the band diagram bends by the built-in potential as doping sliders move.' },
        { num: '4.8', kind: 'Law', name: 'Shockley diode equation', deps: ['cm-4.7', 'ode-3.13'], refs: ['Ashcroft–Mermin ch. 29', 'Kittel ch. 8'],
          pic: 'Apply a bias: quasi-Fermi levels split, the computed current follows I₀(e^{eV/kT} − 1), rising exponentially forward and saturating in reverse.' },
        { num: '4.9', kind: 'Invention', name: 'Light-emitting diodes', deps: ['cm-4.8', 'cm-4.1', 'pma-5.11'], refs: ['Kittel ch. 17', 'Ashcroft–Mermin ch. 29'],
          pic: 'Forward-bias a junction: injected electrons and holes recombine in the depletion region and emit photons at the gap energy, a gap slider sweeps the colour from infrared to blue, and an indirect-gap toggle shows the emission collapsing.' },
        { num: '4.10', kind: 'Invention', name: 'Field-effect transistor (MOSFET)', deps: ['cm-4.7', 'cm-4.3'], refs: ['Ashcroft–Mermin ch. 29', 'Kittel ch. 17'],
          pic: 'Raise the gate voltage on a metal–oxide–semiconductor stack: the bands bend until an inversion channel forms at the surface, and the drain current switches on past the threshold.' },
        { num: '4.11', kind: 'Model', name: 'Quantum wells and heterostructures', deps: ['cm-4.1', 'cm-2.3', 'qm-3.4'], refs: ['Kittel ch. 18', 'Kittel ch. 17'],
          pic: 'A GaAs layer between AlGaAs barriers: confined subband energies are solved for a width slider, and the emission colour shifts blue as the well narrows.' },
        { num: '4.12', kind: 'Phenomenon', name: 'Excitons', deps: ['cm-4.4', 'qm-8.12'], refs: ['Kittel ch. 15'],
          pic: 'An electron and a hole bind like a hydrogen atom scaled by the reduced effective mass and dielectric constant; the computed Rydberg series of absorption lines just below the gap is compared with cuprous-oxide spectra.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 5
    {
      n: 5,
      title: 'Magnetic order and correlated electrons',
      summary: String.raw`Effective magnetic models describe order, collective excitations and spin-dependent transport. Two-sublattice Ising mean field, low-density magnons, a two-current resistor network and a finite Hubbard dimer expose different mechanisms and different limits. A synthetic resistance-minimum model illustrates the competition of phonon and magnetic scattering without presenting invented material data.`,
      items: [
        { num: '5.1', alias: 'thermo-6.18', name: 'Bohr–van Leeuwen theorem' },
        { num: '5.2', kind: 'Model', name: 'Antiferromagnetism and the Néel temperature', deps: ["pma-4.23","pma-5.11"], refs: ["Arovas, UCSD Physics 210A (2025), §7.13.2, equations (7.407)–(7.414), printed pp. 94–97"],
          pic: 'Solve the zero-field bipartite Ising mean-field branch; alternate sublattice averages and compare staggered order with uniform longitudinal susceptibility, with actual energy/temperature conversion.' },
        { num: '5.3', kind: 'Phenomenon', name: 'Spin waves (magnons)', deps: ["cm-3.5"], refs: ["Arovas, UCSD Physics 211B (2014), §4.9, equations (4.271)–(4.275), printed p. 47"],
          pic: 'A linear chain mode has its computed dispersion and phase-controlled transverse components; a separate three-dimensional continuum panel integrates thermal magnons and states the low-temperature/dilute limits.' },
        { num: '5.4', kind: 'Phenomenon', name: 'Giant magnetoresistance', deps: ["circ-2.3","circ-2.4"], refs: ["Grünberg (2008), Nobel Lecture: From spin waves to giant magnetoresistance and beyond, Rev. Mod. Phys. 80, 1531; section Discovery of Giant Magnetoresistance, pp. 1535–1537, Fig. 10"],
          pic: 'Two finite positive spin-channel resistor networks compare parallel and antiparallel layers; vary scattering contrast and calculate resistances, magnetoresistance and unit-voltage channel currents without an invented field sweep.' },
        { num: '5.5', kind: 'Model', name: 'Hubbard dimer and correlation scales', deps: ["ladr-7.29"], refs: ["Arovas, UCSD Physics 211B (2014), §4.5.1, equation (4.90), printed p. 19 (Hubbard Hamiltonian); dimer sector diagonalization supplied here"],
          pic: 'The open one-bond Hubbard dimer is diagonalized in its singlet sector; eigenvector double occupation and exact finite-cluster spin/charge gaps are compared, explicitly retaining the nonzero U=0 charge gap.' },
        { num: '5.6', kind: 'Phenomenon', name: 'Kondo effect: the resistance minimum', deps: ["cm-2.7","cm-3.15","pma-5.11"], refs: ["Coleman, Heavy Fermions: electrons at the edge of magnetism, §I.A, printed pp. 6–8, equation (3) (weak-coupling scattering logarithm); additive resistance model supplied here"],
          pic: 'A synthetic phonon-plus-logarithmic scattering model shows an actual resistance minimum only where it lies in the chosen finite-temperature window; b=0 removes it and no empirical fit is claimed.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 6
    {
      "n": 6,
      "title": "Superconductivity",
      "summary": "From ideal DC transport to magnetic screening and quantized fluxoid, superconductivity combines collective phase coherence with microscopic pairing. Finite slabs, rings, vortices and Josephson circuits expose different roles of fields and phase. Self-consistent finite-cutoff BCS calculations reveal the gap, isotope assumptions and electronic heat jump, while a separately labeled cuprate guide shows the limits of this elementary picture.",
      "items": [
        {
          "num": "6.1",
          "kind": "Phenomenon",
          "name": "Zero resistance and the critical temperature",
          "deps": [
            "em-6.4"
          ],
          "refs": [
            "Arovas, UCSD Physics239 (2023), C11 §11.1, historical opening and zero-DC-resistance phenomenology"
          ],
          "pic": "Cool an idealized wire through its transition, then compare a zero-resistance ring with a positive residual-resistance alternative. Vary the elapsed time and read the actual fractional current loss."
        },
        {
          "num": "6.2",
          "kind": "Model",
          "name": "London equations and the penetration depth",
          "deps": [
            "em-8.15",
            "em-10.3"
          ],
          "refs": [
            "Arovas C11 §11.3, printed8–9; SI conversion and slab boundary solution supplied here"
          ],
          "pic": "Change slab thickness and superconducting electron density. Inspect the exact finite-slab field and its screening-current derivative, including the field at the center and the spatial mean."
        },
        {
          "num": "6.3",
          "kind": "Phenomenon",
          "name": "Flux quantization in units of h/2e",
          "deps": [
            "cm-6.2",
            "qm-6.7"
          ],
          "refs": [
            "Arovas C11 §11.3, printed9; QM6.7 loop phase; lumped fluxoid derivation supplied here"
          ],
          "pic": "Thread a ring with external flux and choose its winding sector. Vary the kinetic share of its inductance, then compare the actual magnetic flux with the kinetic contribution and the integer fluxoid."
        },
        {
          "num": "6.4",
          "kind": "Model",
          "name": "Ginzburg–Landau theory",
          "deps": [
            "cm-6.2",
            "thermo-11.15"
          ],
          "refs": [
            "Arovas C11 §§11.4.1–11.4.3, printed12–14"
          ],
          "pic": "Move temperature through the transition and inspect the radial free-energy curve alongside the circle of complex order-parameter minima. Change the phase along that circle and compare the computed amplitude and length scales."
        },
        {
          "num": "6.5",
          "kind": "Phenomenon",
          "name": "Type I and type II superconductors",
          "deps": [
            "cm-6.4"
          ],
          "refs": [
            "Arovas C11 §11.5.1, printed22–23; §§11.5.4–11.5.5, printed29–32"
          ],
          "pic": "Change κ and the coherence length. Compare the thermodynamic and upper-instability field scales as they cross at the type boundary. At large κ, add a clearly labeled leading-log London estimate of the lower critical field."
        },
        {
          "num": "6.6",
          "kind": "Phenomenon",
          "name": "Abrikosov vortex lattice",
          "deps": [
            "cm-6.5",
            "cm-6.3"
          ],
          "refs": [
            "Arovas C11 §11.5.6, printed32–38; reciprocal sum and regularized London field supplied here"
          ],
          "pic": "Raise the mean induction and compare triangular and square vortex cells. Watch the computed spacing shrink, inspect a periodic field cross-section, and compare the converged lattice sums and flux per cell."
        },
        {
          "num": "6.7",
          "kind": "Model",
          "name": "Cooper pairs",
          "deps": [
            "cm-1.1",
            "cm-3.5"
          ],
          "refs": [
            "Arovas C12 §12.2, printed3–6; per-spin coupling convention stated here"
          ],
          "pic": "Vary the attraction and compare exact binding with its weak-coupling exponential. Inspect the actual pair-energy probability per logarithmic energy interval, or turn the attraction off and lose the bound state."
        },
        {
          "num": "6.8",
          "kind": "Model",
          "name": "BCS theory and the energy gap",
          "deps": [
            "cm-6.7"
          ],
          "refs": [
            "Arovas C12 §§12.4–12.6, printed9–15; §12.9, printed18–19"
          ],
          "pic": "Change coupling and temperature, solve the gap equation, and inspect the actual quasiparticle dispersion or a broadened density of states. Compare the calculated finite-cutoff gap ratio with its weak-coupling limit."
        },
        {
          "num": "6.9",
          "kind": "Phenomenon",
          "name": "Isotope effect",
          "deps": [
            "cm-6.8",
            "thermo-9.13"
          ],
          "refs": [
            "Arovas C12 §12.9.1, printed20; local harmonic-frequency and finite-cutoff derivative arguments"
          ],
          "pic": "Vary isotope mass and compare the conditional half-power curve with the recalculated critical temperature. Allow a small mass dependence of the coupling and read its actual logarithmic isotope exponent."
        },
        {
          "num": "6.10",
          "kind": "Phenomenon",
          "name": "Josephson effects",
          "deps": [
            "cm-6.3",
            "cm-6.4"
          ],
          "refs": [
            "Arovas C13 §13.3.1, printed21–22; sign orientation chosen explicitly here"
          ],
          "pic": "Set the initial phase and a signed fixed voltage. Move through time, inspect the actual phase phasor and current trace, and compare the frequency and Josephson energy."
        },
        {
          "num": "6.11",
          "kind": "Invention",
          "name": "SQUID magnetometer",
          "deps": [
            "cm-6.10"
          ],
          "refs": [
            "Arovas C13 §13.3.3, printed23; Orlando MIT6.763 Lecture12, actual PDFpage2"
          ],
          "pic": "Thread flux through two unequal junctions and rotate their common phase. Compare their vector sum and actual current with the maximum-current envelope; change loop area to convert flux period into a field period."
        },
        {
          "num": "6.12",
          "kind": "Phenomenon",
          "name": "High-temperature cuprate superconductors",
          "deps": [
            "cm-6.8",
            "cm-5.5"
          ],
          "refs": [
            "Keimer et al., arXiv1409.4673, printed1–7 and Figure2/4 captions, printed17/19"
          ],
          "pic": "Move through doping and temperature on a clearly labeled schematic phase guide. Compare a positive s-wave angular gap with the sign-changing d-wave form, and locate its four nodal directions."
        },
        {
          "num": "6.13",
          "kind": "Paper",
          "name": "The resistance of pure mercury at helium temperatures",
          "paper": {
            "authors": "H. Kamerlingh Onnes",
            "year": 1911,
            "title": "Further experiments with liquid helium. C. On the change of electric resistance of pure metals at very low temperatures etc. IV. The resistance of pure mercury at helium temperatures",
            "venue": "Proceedings of the Section of Sciences, KNAW 13 (II): 1274–1276",
            "url": "https://dwc.knaw.nl/DL/publications/PU00013358.pdf"
          },
          "introduces": [
            "cm-6.1"
          ],
          "deps": [
            "em-6.5",
            "em-6.4"
          ],
          "refs": [
            "Arovas C11 §11.1, opening historical paragraph; resistance-bound derivations supplied here"
          ],
          "pic": "Change a voltage floor, a test current and a persistent-current observation time. Compare the two calculated resistance bounds, then inspect which positive resistances would remain undetected by each protocol."
        },
        {
          "num": "6.14",
          "kind": "Paper",
          "name": "Theory of Superconductivity",
          "paper": {
            "authors": "J. Bardeen, L. N. Cooper and J. R. Schrieffer",
            "year": 1957,
            "title": "Theory of Superconductivity",
            "venue": "Physical Review 108 (5): 1175–1204",
            "doi": "10.1103/PhysRev.108.1175"
          },
          "introduces": [
            "cm-6.8"
          ],
          "deps": [
            "cm-6.7",
            "cm-6.9",
            "cm-3.5",
            "cm-6.13"
          ],
          "refs": [
            "Arovas C12 §§12.4–12.6, printed9–15; §12.9, printed18–22"
          ],
          "pic": "Solve the finite-cutoff BCS model as temperature changes. Switch between the gap and electronic heat capacity, and compare the computed transition ratios with their weak-coupling limits."
        }
      ]
    },
  ],
};
