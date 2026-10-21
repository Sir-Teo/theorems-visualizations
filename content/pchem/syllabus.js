// Syllabus — Physical Chemistry: Thermodynamics & Equilibrium (curated course; see collection.js for references)
// Refs: "Atkins" = Atkins, de Paula & Keeler, Physical Chemistry 11e (topic codes 1A, 5B … where verified,
// otherwise Focus-level); "M–S" = McQuarrie & Simon, Physical Chemistry: A Molecular Approach (chapter-level).
//
// Sources consulted (research pass, 2026-10):
//   - Atkins 11e topic list (Foci 1–5 topic codes verified):
//     https://learncheme.com/physical-chemistry-textbook-screencasts-atkins-11th-ed/
//   - McQuarrie & Simon chapter numbers (17 Boltzmann factor, 23 phase equilibria, 24 solutions I …) via the
//     solutions-manual and Molecular Thermodynamics contents: https://uscibooks.aip.org/?p=2655 ,
//     https://uscibooks.directfrompublisher.com/node/297
//   - MIT OCW 5.60 Thermodynamics & Kinetics (Spring 2008) lecture list:
//     https://ocw.mit.edu/courses/5-60-thermodynamics-kinetics-spring-2008/pages/lecture-notes/
//   - Univ. of Ljubljana physical chemistry outline (phase rule, Nernst, Debye–Hückel):
//     https://www.fmf.uni-lj.si/en/study-physics/programmes/1fiz/2025/7000777/courses/1139
//   - Univ. of Florida CHM6430 Chemical Thermodynamics syllabus:
//     https://www.chem.ufl.edu/wp-content/uploads/sites/38/2016/08/CHM6430-Fall2016-Bowers.pdf
//   - Wikipedia: https://en.wikipedia.org/wiki/List_of_scientific_laws_named_after_people (Raoult, Henry,
//     Ostwald dilution, Langmuir, Faraday, Le Chatelier, Hess, Graham, Dalton, Gibbs–Helmholtz)
// Gaps filled after comparison: calorimetry and Kirchhoff's law, drug-binding style coupled equilibria,
// Ostwald dilution and Kohlrausch, Donnan equilibrium, surface chemistry (Langmuir/BET), transport
// (Fick, Einstein–Smoluchowski, Stokes–Einstein). Deliberate omissions: detailed ternary diagrams beyond the
// triangle reading, liquid crystals, polymer solution thermodynamics (Flory–Huggins lives in `mat`).
// Landmark papers (kind 'Paper') appended Oct 2026; each citation checked against Crossref, the publisher, or a digitized library copy.
export default {
  collection: 'pchem',
  chapters: [
    // ───────────────────────────────────────────────────────────── 1
    {
      n: 1,
      title: 'Gases: perfect and real',
      summary: String.raw`The perfect gas law gathers Boyle's, Charles's and Avogadro's observations into one equation, and the kinetic model explains it as the drumming of point molecules whose speeds follow the Maxwell–Boltzmann distribution. Real molecules attract and take up space: the compression factor and virial expansion measure the departure, and van der Waals's two-parameter equation captures liquefaction, the critical point and the law of corresponding states.`,
      items: [
        { num: '1.1', kind: 'Law', name: 'Boyle’s law', deps: [], refs: ['Atkins 1A', 'M–S ch. 16'],
          pic: 'Push a piston into a cylinder of simulated gas at fixed temperature: the measured pressure traces a hyperbola and PV stays flat — until a high-density toggle adds molecular size and attractions and the product drifts.' },
        { num: '1.2', kind: 'Law', name: 'Charles’s and Gay-Lussac’s laws', deps: [], refs: ['Atkins 1A'],
          pic: 'Heat a gas at constant pressure or constant volume and plot V or P against temperature; straight lines for several gases all extrapolate to the same intercept at −273.15 °C.' },
        { num: '1.3', kind: 'Principle', name: 'Avogadro’s principle', deps: [], refs: ['Atkins 1A'],
          pic: 'Fill equal boxes with hydrogen, nitrogen and xenon at the same temperature and pressure: very different masses, identical molecule counts — and a dense-gas slider shows where the equality breaks.' },
        { num: '1.4', kind: 'Law', name: 'Perfect gas equation pV = nRT', deps: ['pchem-1.1', 'pchem-1.2', 'pchem-1.3'], refs: ['Atkins 1A', 'M–S ch. 16'],
          pic: 'A 3D surface of p over (V, T) with isotherms, isobars and isochores drawn on it; drag a state point and the readout confirms pV/nRT = 1 everywhere on the ideal surface.' },
        { num: '1.5', alias: 'thermo-1.5', name: 'Dalton’s law of partial pressures' },
        { num: '1.6', kind: 'Model', name: 'Kinetic model of gases: pressure from collisions', deps: ['pchem-1.4', 'mech-2.1'], refs: ['Atkins Focus 1', 'M–S ch. 27'],
          pic: 'Hard spheres bounce in a box while a wall gauge sums momentum transfer per unit time; the time-averaged pressure matches Nm⟨v²⟩/3V, and shrinking the box raises the hit rate exactly as predicted.' },
        { num: '1.7', alias: 'thermo-6.15', name: 'Maxwell–Boltzmann speed distribution' },
        { num: '1.8', alias: 'thermo-7.2', name: 'Graham’s law of effusion' },
        { num: '1.9', kind: 'Definition', name: 'Collision frequency and mean free path', deps: ['pchem-1.6'], refs: ['Atkins Focus 1', 'M–S ch. 27'],
          pic: 'Track one tagged molecule and histogram the distances between its collisions: the mean matches kT/(√2 σp), shrinking as the pressure slider rises, and the distribution is exponential.' },
        { num: '1.10', kind: 'Law', name: 'Barometric formula', deps: ['pchem-1.4'], refs: ['Atkins Focus 1'],
          pic: 'Let simulated molecules settle in a gravitational field: their height histogram decays exponentially with scale height RT/Mg, so heavier gases hug the floor — and a convecting mixed layer shows why Earth’s atmosphere is not sorted by mass below 100 km.' },
        { num: '1.11', kind: 'Definition', name: 'Compression factor Z', deps: ['pchem-1.4'], refs: ['Atkins 1C', 'M–S ch. 16'],
          pic: 'Plot Z = pV/nRT against pressure for H₂, N₂, CH₄ and CO₂ from tabulated data: attractions pull Z below 1 at moderate pressure and repulsions push it above 1 at high pressure.' },
        { num: '1.12', kind: 'Model', name: 'Virial equation and the Boyle temperature', deps: ['pchem-1.11'], refs: ['Atkins 1C', 'M–S ch. 16'],
          pic: 'The second virial coefficient B(T) is computed from a Lennard-Jones potential by numerical integration; it changes sign at the Boyle temperature, where the gas briefly behaves ideally over a range of pressures.' },
        { num: '1.13', kind: 'Model', name: 'Van der Waals equation', deps: ['pchem-1.4', 'pchem-1.11', 'thermo-4.1'], refs: ['Atkins 1C', 'M–S ch. 16'],
          pic: 'Turn the a (attraction) and b (excluded volume) sliders up from zero: the ideal isotherms bend, develop wiggles below a temperature you can find, and the readout gives Z for the chosen gas.' },
        { num: '1.14', alias: 'thermo-4.3', name: 'Maxwell equal-area construction' },
        { num: '1.15', kind: 'Phenomenon', name: 'The critical point', deps: ['pchem-1.13', 'pchem-1.14', 'thermo-4.2'], refs: ['Atkins 1C', 'M–S ch. 16'],
          pic: 'Raise the temperature and watch the liquid–vapour tie line shrink to a point where the isotherm has an inflection; the critical constants 8a/27Rb, a/27b², 3b are read out, and simulated density fluctuations grow huge near it (critical opalescence).' },
        { num: '1.16', kind: 'Principle', name: 'Law of corresponding states', deps: ['pchem-1.15'], refs: ['Atkins 1C', 'M–S ch. 16'],
          pic: 'Rescale measured Z data for several gases to reduced pressure and temperature: curves that looked unrelated collapse onto one family, except for strongly polar or quantum gases like H₂O and He.' },
        { num: '1.17', kind: 'Paper', name: 'Traité élémentaire de chimie',
          paper: { authors: 'A.-L. Lavoisier', year: 1789, title: 'Traité élémentaire de chimie, présenté dans un ordre nouveau et d’après les découvertes modernes', venue: 'Paris: Cuchet (book, 2 vols.)', url: 'https://archive.org/details/traitlmentairede01lavo' },
          introduces: [], deps: [], refs: [],
          pic: 'Recreate the mercury-calx experiment: heat mercury in a retort joined to a bell jar of air for twelve days and watch about a sixth of the air disappear as red calx forms; heat the calx strongly to recover that same volume of “vital air”, with a running balance showing the total mass unchanged at every step.' },
        { num: '1.18', kind: 'Paper', name: 'Masses relatives des molécules élémentaires des corps',
          paper: { authors: 'A. Avogadro', year: 1811, title: 'Essai d’une manière de déterminer les masses relatives des molécules élémentaires des corps, et les proportions selon lesquelles elles entrent dans ces combinaisons', venue: 'Journal de Physique, de Chimie et d’Histoire Naturelle 73: 58–76', url: 'https://books.google.com/books?id=MxgTAAAAQAAJ&pg=PA58' },
          introduces: ['pchem-1.3'], deps: ['pchem-1.1', 'pchem-1.2'], refs: [],
          pic: 'Combine gas volumes as Gay-Lussac measured — two of hydrogen and one of oxygen give two of steam, one of nitrogen and one of oxygen give two of nitric oxide — and try to explain them with indivisible atoms: it fails until equal volumes hold equal numbers of molecules that can split in two, and then relative molecular masses follow from gas densities.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 2
    {
      n: 2,
      title: 'The first law and thermochemistry',
      summary: String.raw`Energy is conserved: the internal energy of a system changes only by the heat and work that cross its boundary. Enthalpy is the bookkeeping device for processes at constant pressure, heat capacities measure how it changes with temperature, and because both are state functions, reaction enthalpies can be combined like algebra through Hess's law. Adiabatic and throttling expansions show the first law at work in engines and refrigerators.`,
      items: [
        { num: '2.1', kind: 'Law', name: 'First law of thermodynamics', deps: ['mech-3.6', 'thermo-1.11'], refs: ['Atkins 2A', 'M–S ch. 19'],
          pic: 'Pump heat in and draw work out of a gas through a piston: two bars for q and w change with the path you drag on a pV diagram, while their sum ΔU depends only on the endpoints.' },
        { num: '2.2', kind: 'Definition', name: 'Expansion work: reversible and irreversible', deps: ['pchem-2.1', 'pchem-1.4', 'pma-6.21'], refs: ['Atkins 2A', 'M–S ch. 19'],
          pic: 'Expand a gas against a single drop in external pressure, then in two, five and many steps: the shaded work area grows toward the reversible isotherm’s nRT ln(V₂/V₁), which it never exceeds.' },
        { num: '2.3', kind: 'Theorem', name: 'State functions and exact differentials', deps: ['pchem-2.1', 'pma-9.41', 'pma-10.39'], refs: ['Atkins 2D', 'M–S ch. 19'],
          pic: 'Integrate dU and đq around closed loops you draw on a pV diagram: the U loop integral is always zero, the heat loop integral equals the enclosed area, and the mixed-partials test flags which is exact.' },
        { num: '2.4', alias: 'thermo-1.14', name: 'Enthalpy' },
        { num: '2.5', kind: 'Definition', name: 'Heat capacities and Cp − Cv', deps: ['pchem-2.4', 'thermo-1.13'], refs: ['Atkins 2B', 'M–S ch. 19'],
          pic: 'Measure temperature rise per joule in both modes; for a perfect gas Cp − Cv equals R exactly, and for a liquid the computed difference uses the expansivity and compressibility sliders.' },
        { num: '2.6', kind: 'Theorem', name: 'Equipartition and gas heat capacities', deps: ['pchem-2.5', 'pchem-1.6', 'thermo-6.12'], refs: ['M–S ch. 19'],
          pic: 'Count translational, rotational and vibrational quadratic terms for He, N₂ and CO₂ to predict Cv; measured data versus temperature show the vibrational steps arriving late — the first sign that equipartition fails.' },
        { num: '2.7', kind: 'Theorem', name: 'Reversible adiabatic expansion: pVᵞ = const', deps: ['pchem-2.5', 'pchem-2.2'], refs: ['Atkins 2E', 'M–S ch. 19'],
          pic: 'Compress a gas in an insulated cylinder: the adiabat is steeper than the isotherm through the same point, the temperature rises as V^(1−γ), and a diesel-ignition preset shows the fuel catching fire.' },
        { num: '2.8', kind: 'Method', name: 'Calorimetry', deps: ['pchem-2.4', 'pchem-2.5'], refs: ['Atkins Focus 2'],
          pic: 'Burn a sample in a simulated bomb calorimeter: the temperature trace, the heat-leak correction and the calibrated heat capacity combine into ΔU of combustion, which is then converted to ΔH.' },
        { num: '2.9', kind: 'Law', name: 'Hess’s law', deps: ['pchem-2.3', 'pchem-2.4'], refs: ['Atkins Focus 2', 'M–S ch. 19'],
          pic: 'Drag reaction arrows around an enthalpy ladder: any route from graphite plus oxygen to CO₂ — direct, or through CO — adds up to the same ΔH.' },
        { num: '2.10', kind: 'Definition', name: 'Standard enthalpies of formation', deps: ['pchem-2.9'], refs: ['Atkins Focus 2', 'M–S ch. 19'],
          pic: 'Pick a reaction from a list; the tabulated formation enthalpies of products and reactants are stacked against the element baseline and their difference gives ΔᵣH°.' },
        { num: '2.11', kind: 'Law', name: 'Kirchhoff’s law', deps: ['pchem-2.10', 'pchem-2.5'], refs: ['Atkins Focus 2', 'M–S ch. 19'],
          pic: 'Move a reaction from 298 K to 1000 K: the enthalpy change shifts by the integral of ΔCp, drawn as a shaded area between the products’ and reactants’ heat-capacity curves.' },
        { num: '2.12', kind: 'Method', name: 'Born–Haber cycle and bond enthalpies', deps: ['pchem-2.9'], refs: ['Atkins Focus 2'],
          pic: 'Build the NaCl formation cycle step by step — sublimation, ionization, dissociation, electron gain, lattice formation — and solve for the lattice enthalpy, compared with an electrostatic estimate.' },
        { num: '2.13', kind: 'Phenomenon', name: 'Joule–Thomson effect and inversion temperature', deps: ['pchem-2.4', 'pchem-1.13'], refs: ['Atkins 2D', 'M–S ch. 19'],
          pic: 'Throttle a van der Waals gas through a porous plug at constant enthalpy: it cools below the inversion temperature and warms above it, and an isenthalp map shows how the Linde process liquefies air.' },
        { num: '2.14', kind: 'Model', name: 'Adiabatic flame temperature', deps: ['pchem-2.11'], refs: ['Atkins Focus 2'],
          pic: 'Burn methane in air or pure oxygen with an excess-air slider: the heat released goes into heating products, giving a computed flame temperature that falls as nitrogen and excess air dilute it.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 3
    {
      n: 3,
      title: 'Entropy, the second and third laws, and free energy',
      summary: String.raw`The second law says entropy of an isolated system never decreases; the Clausius inequality turns this into a test for spontaneity and Carnot's analysis into a ceiling on engine efficiency. Boltzmann's formula reads entropy as a count of microstates, and the third law fixes its zero. Focusing on the system alone, the Helmholtz and Gibbs energies become the quantities chemists minimize, and the Maxwell relations connect what can be measured to what cannot.`,
      items: [
        { num: '3.1', kind: 'Law', name: 'Second law of thermodynamics', deps: ['pchem-2.1', 'thermo-2.1'], refs: ['Atkins 3A', 'M–S ch. 20'],
          pic: 'Two blocks at different temperatures exchange heat in small packets: every allowed exchange raises total entropy, and forcing a packet uphill is only possible by spending work, shown on a running ledger.' },
        { num: '3.2', kind: 'Definition', name: 'Thermodynamic entropy dS = đq_rev/T', deps: ['pchem-3.1', 'pchem-2.3'], refs: ['Atkins 3A', 'M–S ch. 20'],
          pic: 'Integrate đq/T along different reversible paths between two states of a perfect gas: heat depends on the path, but the entropy integral is the same every time.' },
        { num: '3.3', kind: 'Theorem', name: 'Carnot cycle and its efficiency', deps: ['pchem-3.2', 'pchem-2.7', 'thermo-2.7'], refs: ['Atkins 3A', 'M–S ch. 20'],
          pic: 'Run a Carnot cycle on pV and TS diagrams with draggable reservoir temperatures: the efficiency readout matches 1 − T_c/T_h, and any other cycle drawn between the same temperatures scores lower.' },
        { num: '3.4', kind: 'Theorem', name: 'Clausius inequality', deps: ['pchem-3.3', 'thermo-2.8'], refs: ['Atkins 3A', 'M–S ch. 20'],
          pic: 'For cycles with a friction slider, the sum of q/T over the cycle is computed: zero for the reversible cycle, negative once friction or finite-rate heat transfer is switched on.' },
        { num: '3.5', kind: 'Proposition', name: 'Entropy of expansion, heating and mixing', deps: ['pchem-3.2'], refs: ['Atkins 3B', 'M–S ch. 20'],
          pic: 'Three mini-panels compute ΔS for a gas doubling its volume, a block heated from T₁ to T₂ and two gases mixing; the mixing entropy peaks at equal mole fractions at R ln 2 per mole.' },
        { num: '3.6', kind: 'Law', name: 'Trouton’s rule', deps: ['pchem-3.5'], refs: ['Atkins 3B'],
          pic: 'Plot ΔH_vap against boiling temperature for dozens of liquids: most lie near a line of slope 85 J/(K·mol), while hydrogen-bonded water and alcohols sit visibly above it.' },
        { num: '3.7', kind: 'Principle', name: 'Boltzmann’s entropy formula S = k ln W', deps: ['pchem-3.5', 'pma-8.22', 'thermo-5.6'], refs: ['Atkins Focus 13', 'M–S ch. 20'],
          pic: 'Distribute N particles between two halves of a box and count arrangements exactly: ln W per particle approaches the mixing entropy as N grows, with Stirling’s approximation drawn beside the exact count.' },
        { num: '3.8', kind: 'Law', name: 'Third law and residual entropy', deps: ['pchem-3.7'], refs: ['Atkins Focus 3', 'M–S ch. 21'],
          pic: 'Freeze a crystal of CO molecules that can point either way: the frozen-in disorder leaves R ln 2 of entropy at 0 K, and the ice-rules count for water gives Pauling’s R ln(3/2), compared with calorimetry.' },
        { num: '3.9', kind: 'Method', name: 'Absolute entropies from heat capacities', deps: ['pchem-3.8', 'pchem-2.5'], refs: ['Atkins Focus 3', 'M–S ch. 21'],
          pic: 'Integrate Cp/T from 0 K through melting and boiling for a real substance: the Debye T³ extrapolation, the smooth segments and the jumps at transitions add up to the tabulated standard entropy.' },
        { num: '3.10', kind: 'Definition', name: 'Helmholtz and Gibbs energies', deps: ['pchem-3.4', 'mech-12.1', 'thermo-3.9'], refs: ['Atkins 3D', 'M–S ch. 22'],
          pic: 'Toggle between constraints (constant T,V or constant T,p) for a process: the system’s A or G is shown falling exactly when the total entropy of system plus surroundings rises.' },
        { num: '3.11', kind: 'Theorem', name: 'Maximum non-expansion work equals −ΔG', deps: ['pchem-3.10'], refs: ['Atkins 3D', 'M–S ch. 22'],
          pic: 'Run a fuel cell slowly or quickly: electrical work collected approaches −ΔG at vanishing current and falls short as the current slider rises, with the difference released as heat.' },
        { num: '3.12', kind: 'Theorem', name: 'Fundamental equation and Maxwell relations', deps: ['pchem-3.10', 'pma-9.41', 'thermo-3.12'], refs: ['Atkins 3E', 'M–S ch. 22'],
          pic: 'A thermodynamic square with draggable corners generates the four Maxwell relations; each is checked numerically on a van der Waals gas by finite differences of its computed functions.' },
        { num: '3.13', kind: 'Theorem', name: 'Gibbs–Helmholtz equation', deps: ['pchem-3.12'], refs: ['Atkins 3E', 'M–S ch. 22'],
          pic: 'Plot G/T against 1/T for a reaction from tabulated data: the slope is ΔH, and the readout extrapolates G to a new temperature and compares it with direct calculation.' },
        { num: '3.14', kind: 'Definition', name: 'Pressure dependence of G and fugacity', deps: ['pchem-3.12', 'pchem-1.13'], refs: ['Atkins 3E', 'M–S ch. 22'],
          pic: 'Integrate V dp for a perfect gas and a van der Waals gas: the real-gas Gibbs energy is matched by replacing p with an effective fugacity, whose ratio to p is plotted against pressure.' },
        { num: '3.15', kind: 'Theorem', name: 'Thermodynamic equation of state and internal pressure', deps: ['pchem-3.12'], refs: ['Atkins 2D', 'M–S ch. 22'],
          pic: 'Compute (∂U/∂V)_T = T(∂p/∂T)_V − p for a perfect gas (zero) and a van der Waals gas (a/V²), and watch a free-expansion simulation cool only in the second case.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 4
    {
      n: 4,
      title: 'Phase transitions of pure substances',
      summary: String.raw`A phase diagram is a map of which phase has the lowest chemical potential at each temperature and pressure. The Clapeyron equation gives the slope of each coexistence line, and its vapour-pressure version, Clausius–Clapeyron, explains boiling-point changes with altitude. Water's backward-leaning melting line, metastable superheated and supercooled states, surfaces and curvature round out the picture.`,
      items: [
        { num: '4.1', kind: 'Concept', name: 'Phase diagram of a pure substance', deps: ['pchem-1.15'], refs: ['Atkins 4A', 'M–S ch. 23'],
          pic: 'Drag a state point across the p–T diagrams of CO₂ and water: the phase shown in a molecular snapshot changes at each line, and the triple point and critical point are labelled with their values.' },
        { num: '4.2', kind: 'Principle', name: 'Phase stability: lowest chemical potential wins', deps: ['pchem-3.10', 'pchem-4.1'], refs: ['Atkins 4B', 'M–S ch. 23'],
          pic: 'Plot μ(T) for solid, liquid and gas as straight-ish lines with slope −S: the lowest one is shaded, and raising the pressure slider shifts the gas line most, moving the crossings.' },
        { num: '4.3', kind: 'Theorem', name: 'Clapeyron equation', deps: ['pchem-4.2', 'pchem-3.12'], refs: ['Atkins 4B', 'M–S ch. 23'],
          pic: 'Pick any coexistence line and compute its slope from ΔS/ΔV at a point; the predicted tangent is overlaid on measured data, steep for melting and gentle for boiling.' },
        { num: '4.4', kind: 'Law', name: 'Clausius–Clapeyron equation', deps: ['pchem-4.3', 'pchem-1.4', 'thermo-4.6'], refs: ['Atkins 4B', 'M–S ch. 23'],
          pic: 'Plot ln p against 1/T for water’s vapour pressure: a straight line of slope −ΔH_vap/R, used to predict the boiling point at the top of Everest; turn on the temperature dependence of ΔH and the small curvature appears.' },
        { num: '4.5', kind: 'Phenomenon', name: 'Triple point', deps: ['pchem-4.1', 'pchem-4.4'], refs: ['Atkins 4A'],
          pic: 'Pump the pressure down over a sample of water at 0.01 °C: it boils and freezes simultaneously, and the sublimation and vaporization curves are shown meeting with different slopes.' },
        { num: '4.6', kind: 'Paradox', name: 'Water’s negative melting slope and the ice-skating myth', deps: ['pchem-4.3'], refs: ['Atkins 4A'],
          pic: 'Compute how much a skater’s blade pressure lowers the melting point: only a fraction of a kelvin, far too little at −10 °C, so the computation sends the reader looking for frictional heating and surface premelting instead.' },
        { num: '4.7', kind: 'Phenomenon', name: 'Supercritical fluids and continuity of states', deps: ['pchem-1.15', 'pchem-4.1'], refs: ['Atkins 4A'],
          pic: 'Take a path around the critical point from liquid to vapour: density changes smoothly with no boiling, while a path straight across the coexistence line shows the density jump.' },
        { num: '4.8', alias: 'thermo-4.9', name: 'Metastability: superheating and supercooling' },
        { num: '4.9', kind: 'Definition', name: 'Surface tension', deps: ['pchem-3.10'], refs: ['Atkins Focus 14'],
          pic: 'Stretch a soap film on a wire frame: the force per unit length stays constant as the film area grows, unlike a rubber sheet, and the work done equals γ times the new area.' },
        { num: '4.10', alias: 'thermo-4.10', name: 'Classical nucleation theory' },
        { num: '4.11', kind: 'Law', name: 'Young–Laplace pressure', deps: ['pchem-4.9'], refs: ['Atkins Focus 14'],
          pic: 'Connect a small and a large bubble by a tube: the higher pressure 2γ/r inside the small one drives it to empty into the large one, the opposite of naive intuition.' },
        { num: '4.12', kind: 'Law', name: 'Kelvin equation', deps: ['pchem-4.11', 'pchem-4.4'], refs: ['Atkins Focus 14'],
          pic: 'Shrink a droplet’s radius: its vapour pressure rises above the flat-surface value exponentially, so small drops evaporate while large ones grow — the basis of cloud seeding and Ostwald ripening.' },
        { num: '4.13', kind: 'Phenomenon', name: 'Capillary rise', deps: ['pchem-4.11'], refs: ['Atkins Focus 14'],
          pic: 'Dip tubes of adjustable radius and contact angle into a liquid: the column height follows 2γcos θ/ρgr, and a non-wetting mercury preset shows depression instead of rise.' },
        { num: '4.14', alias: 'thermo-4.16', name: 'Ehrenfest classification of phase transitions' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 5
    {
      "n": 5,
      "title": "Mixtures and solutions",
      "summary": "Partial molar quantities and chemical potentials describe how a mixture responds when its composition changes. Ideal and dilute limits require different reference states; activities and a regular-solution model expose their limits. Solvent chemical potential connects phase shifts, osmosis and extraction, with empirical pure-component anchors kept separate from chosen mixture closures.",
      "items": [
        {
          "num": "5.1",
          "kind": "Definition",
          "name": "Partial molar quantities",
          "deps": [
            "pchem-3.10"
          ],
          "refs": [
            "MIT3.020 (2021), Lecture16, pp.1–4, partial molar properties and Euler identity"
          ],
          "pic": "Move the composition and interaction controls. The tangent intercepts are computed derivatives of the same extensive volume; their weighted sum reconstructs the mixture’s molar volume."
        },
        {
          "num": "5.2",
          "kind": "Definition",
          "name": "Chemical potential",
          "deps": [
            "pchem-5.1",
            "pchem-3.10"
          ],
          "refs": [
            "MIT5.60 (2008), Lecture14, pp.1–5, chemical potential and transfer equilibrium"
          ],
          "pic": "Choose the initial allocation of A and advance the dimensionless exchange time. The actual nonlinear exchange equation determines both compartments and the free-energy history."
        },
        {
          "num": "5.3",
          "kind": "Theorem",
          "name": "Gibbs–Duhem equation",
          "deps": [
            "pchem-5.1",
            "pchem-5.2",
            "thermo-3.6"
          ],
          "refs": [
            "MIT3.020 (2021), Lecture16, pp.2–4, Gibbs–Duhem and tangent construction"
          ],
          "pic": "Change the shape of one common molar-volume function and inspect the two weighted derivatives. The inconsistent branch deliberately adds an independent slope to one partial volume, breaking the shared-extensive-property hypothesis."
        },
        {
          "num": "5.4",
          "kind": "Proposition",
          "name": "Gibbs energy and entropy of mixing of perfect gases",
          "deps": [
            "pchem-5.2",
            "pchem-3.5",
            "thermo-4.12"
          ],
          "refs": [
            "MIT5.60 (2008), Lecture22, p.1, ideal-mixture Gibbs energy, entropy and enthalpy"
          ],
          "pic": "Vary composition, amount and temperature. Compare distinguishable species with an identical-gas partition removal and inspect the endpoint limits."
        },
        {
          "num": "5.5",
          "kind": "Law",
          "name": "Raoult’s law and ideal solutions",
          "deps": [
            "pchem-5.2",
            "pchem-1.4",
            "pchem-3.14"
          ],
          "refs": [
            "MIT5.60 (2008), Lecture21, p.5, Raoult chemical-potential derivation",
            "NIST Chemistry WebBook benzene/toluene Antoine tables: Willingham et al.1945 and Pitzer–Scott1943 rows"
          ],
          "pic": "Use the NIST pure benzene and toluene vapour-pressure anchors in an ideal binary mixture. The computed vapour composition generally differs from the chosen liquid composition."
        },
        {
          "num": "5.6",
          "kind": "Law",
          "name": "Henry’s law",
          "deps": [
            "pchem-5.5"
          ],
          "refs": [
            "NIST Chemistry WebBook CO₂ Henry table, selected .035mol/(kg bar),2400K compilation row",
            "IUPAC (2021), Henry’s law constants, solubility versus volatility conventions"
          ],
          "pic": "Compare a fixed-pressure reservoir with a sealed headspace. Changing temperature in the sealed branch changes both equilibrium pressure and dissolved fraction while conserving total carbon-dioxide amount."
        },
        {
          "num": "5.7",
          "kind": "Model",
          "name": "Ideal-dilute solutions",
          "deps": [
            "pchem-5.5",
            "pchem-5.6"
          ],
          "refs": [
            "MIT3.020 (2021), Lecture17, pp.2–4, dilute standard states and regular-solution activity model"
          ],
          "pic": "Choose a synthetic interaction parameter, dilution and error tolerance. The two curves show errors relative to the solvent’s Raoult line and the solute’s Henry line."
        },
        {
          "num": "5.8",
          "kind": "Definition",
          "name": "Activity and activity coefficients",
          "deps": [
            "pchem-5.7",
            "pchem-5.2"
          ],
          "refs": [
            "MIT3.020 (2021), Lecture17, pp.1–4, activity conventions and dilute solutions"
          ],
          "pic": "Switch the reference convention and compare the resulting activity coefficients. The chemical-potential readout evaluates both conventions side by side."
        },
        {
          "num": "5.9",
          "kind": "Model",
          "name": "Regular solutions",
          "deps": [
            "pchem-5.4",
            "pchem-5.8"
          ],
          "refs": [
            "MIT3.020 (2021), Lecture17, pp.3–4, regular solution; Lecture19, pp.1–5, free-energy curvature and phase separation"
          ],
          "pic": "Move the interaction parameter through the critical value and choose an overall composition. Compare a constrained homogeneous sample with the equilibrium two-phase convex envelope."
        },
        {
          "num": "5.10",
          "kind": "Concept",
          "name": "Colligative properties",
          "deps": [
            "pchem-5.7",
            "pchem-4.2"
          ],
          "refs": [
            "DeVoe, Thermodynamics and Chemistry, v10 (2020), §12.4, pp.376–382; MIT5.60 Lecture23, pp.1–4"
          ],
          "pic": "Count independent particles with the ideal factor i and inspect the computed liquid–solid and liquid–vapour crossings. The branches use generic solvent constants, not measured water curves."
        },
        {
          "num": "5.11",
          "kind": "Law",
          "name": "Boiling-point elevation",
          "deps": [
            "pchem-5.10",
            "pchem-3.13"
          ],
          "refs": [
            "MIT5.60 (2008), Lecture23, pp.1–2; DeVoe §12.4.2, pp.379–381"
          ],
          "pic": "Compare the leading molal law with the finite ideal constant-enthalpy equation. Increasing concentration reveals the approximation error computed from the two equations."
        },
        {
          "num": "5.12",
          "kind": "Law",
          "name": "Freezing-point depression",
          "deps": [
            "pchem-5.10",
            "pchem-3.13"
          ],
          "refs": [
            "DeVoe (2020), §12.4.1, pp.377–379, pure-solid assumption and dilute freezing depression"
          ],
          "pic": "Run a synthetic cryoscopic determination using a chosen unknown molar mass and loading. Compare linear inference with the finite ideal-model temperature depression."
        },
        {
          "num": "5.13",
          "kind": "Law",
          "name": "Osmotic pressure (van ’t Hoff equation)",
          "deps": [
            "pchem-5.10",
            "pchem-5.2",
            "pchem-3.12"
          ],
          "refs": [
            "DeVoe (2020), §12.4.4, pp.381–382, osmotic pressure and dilute limit; MIT5.60 Lecture23, pp.3–4"
          ],
          "pic": "Change solute amount, initial solution volume and column area. The computed column height balances hydrostatic pressure against the final diluted van’t Hoff concentration."
        },
        {
          "num": "5.14",
          "kind": "Invention",
          "name": "Reverse osmosis desalination",
          "deps": [
            "pchem-5.13",
            "pchem-3.11"
          ],
          "refs": [
            "US Bureau of Reclamation, Yuma Desalting Plant Operations: Reverse Osmosis, membrane/pressure description",
            "DeVoe (2020), §12.4.4; reversible work integral and declared flux closure derived here"
          ],
          "pic": "Choose feed particle concentration, recovery and applied pressure. The signed flux chart shows the current osmotic threshold; the recovery chart computes the reversible-work integral."
        },
        {
          "num": "5.15",
          "kind": "Law",
          "name": "Ideal solubility and the van ’t Hoff solubility equation",
          "deps": [
            "pchem-5.12",
            "pchem-5.8",
            "pchem-3.13"
          ],
          "refs": [
            "DeVoe (2020), §12.5.3, pp.386–387, Eq.12.5.11 and limits of ideal solubility",
            "NIST naphthalene phase-transition table: Andon–Connett1980, crystal I→liquid,19.046kJ/mol at353.376K"
          ],
          "pic": "Use a chosen NIST naphthalene fusion anchor in the ideal-solubility equation. Vary temperature and total loading to distinguish an unsaturated all-dissolved sample from solid–liquid coexistence."
        },
        {
          "num": "5.16",
          "kind": "Law",
          "name": "Nernst distribution law",
          "deps": [
            "pchem-5.8",
            "pchem-5.2"
          ],
          "refs": [
            "DeVoe (2020), §12.6.3, pp.394–395, Eqs.12.6.7–8 and dilute distribution law",
            "IUPAC Gold Book, partition ratio P04440: same definite chemical form, distinction from distribution ratio"
          ],
          "pic": "Compare one extraction with repeated fresh-solvent stages at the same total solvent volume. Switch to the association counterexample to distinguish monomer partition ratio from total distribution ratio."
        },
        {
          "num": "5.17",
          "kind": "Paper",
          "name": "Rolle des osmotischen Druckes: Lösungen und Gase",
          "paper": {
            "authors": "J. H. van ’t Hoff",
            "year": 1887,
            "title": "Die Rolle des osmotischen Druckes in der Analogie zwischen Lösungen und Gasen",
            "venue": "Zeitschrift für Physikalische Chemie 1: 481–508",
            "doi": "10.1515/zpch-1887-0151"
          },
          "introduces": [
            "pchem-5.13"
          ],
          "deps": [
            "pchem-1.4",
            "thermo-2.9",
            "pchem-5.13"
          ],
          "refs": [
            "van ’t Hoff (1887), original identity/DOI; W.Ramsay English translation, Philosophical Magazine (1888), opening §§I–II, accessible typed transcription",
            "DeVoe (2020), §12.4.4, pp.381–382, dilute osmotic equation; finite-step work derived here"
          ],
          "verify": true,
          "pic": "Increase the number of finite osmotic expansion steps. Their computed staircase work approaches the reversible integral; the diagram shows the actual pressure law and the step pressures."
        }
      ]
    },
    {
      n: 6,
      title: 'Phase diagrams of mixtures',
      summary: String.raw`With more than one component, the Gibbs phase rule counts how many variables can change while phases coexist. Binary liquid–vapour diagrams explain distillation and azeotropes, partially miscible liquids show upper and lower critical solution temperatures, and solid–liquid diagrams show eutectics and compounds. The lever rule reads phase amounts off a tie line, and the common-tangent construction on the Gibbs energy curve explains it all.`,
      items: [
        { num: '6.1', kind: 'Theorem', name: 'Gibbs phase rule', deps: ['pchem-4.2', 'pchem-5.2', 'thermo-4.8'], refs: ['Atkins 4A', 'M–S ch. 23'],
          pic: 'Choose the number of components and coexisting phases: the app counts unknowns and equilibrium conditions to give F = C − P + 2, and on a diagram shows areas, lines and points with 2, 1 and 0 degrees of freedom.' },
        { num: '6.2', kind: 'Concept', name: 'Pressure–composition diagram of an ideal binary', deps: ['pchem-5.5', 'pchem-6.1'], refs: ['Atkins 5C', 'M–S ch. 24'],
          pic: 'Lower the pressure over a liquid mixture: bubbles appear at the bubble-point line with a vapour richer in the volatile component, and the liquid and vapour compositions are joined by a tie line.' },
        { num: '6.3', kind: 'Theorem', name: 'Lever rule', deps: ['pchem-6.2'], refs: ['Atkins 5C', 'M–S ch. 24'],
          pic: 'Drag the overall composition along a tie line like a fulcrum on a see-saw: the amounts of the two phases are read out in inverse proportion to the lever arms, checked by a mass balance.' },
        { num: '6.4', kind: 'Method', name: 'Fractional distillation and theoretical plates', deps: ['pchem-6.3'], refs: ['Atkins 5C', 'M–S ch. 24'],
          pic: 'Step up a temperature–composition diagram plate by plate: each vaporize–condense cycle enriches the vapour, and a column-height slider shows how many plates a given separation needs.' },
        { num: '6.5', kind: 'Phenomenon', name: 'Azeotropes', deps: ['pchem-6.4', 'pchem-5.9'], refs: ['Atkins 5C', 'M–S ch. 24'],
          pic: 'Raise the non-ideality parameter: the boiling curve develops a maximum or minimum where liquid and vapour compositions coincide, and the distillation simulation stalls there — why ethanol cannot be distilled past 96 %.' },
        { num: '6.6', kind: 'Phenomenon', name: 'Partially miscible liquids and consolute points', deps: ['pchem-5.9', 'pchem-6.3'], refs: ['Atkins 5C'],
          pic: 'Shake hexane and nitrobenzene at different temperatures: two layers form inside a dome whose top is the upper critical solution temperature, and a water–triethylamine preset shows a lower one instead.' },
        { num: '6.7', kind: 'Method', name: 'Common-tangent construction on G(x)', deps: ['pchem-5.9', 'pchem-6.3', 'rca-3.1'], refs: ['Atkins 5C'],
          pic: 'Roll a straight line under a double-well ΔG_mix curve until it touches twice: the touching points are the coexisting compositions, the convex hull of the curve is the true Gibbs energy, and the inflection points mark the spinodal.' },
        { num: '6.8', kind: 'Concept', name: 'Eutectic phase diagrams', deps: ['pchem-6.1', 'pchem-5.12'], refs: ['Atkins Focus 5', 'M–S ch. 25'],
          pic: 'Cool a lead–tin melt of chosen composition: the cooling curve shows a slope change at the liquidus and a halt at the eutectic temperature, and the microstructure panel fills with primary crystals then lamellae.' },
        { num: '6.9', kind: 'Phenomenon', name: 'Compound formation and incongruent melting', deps: ['pchem-6.8'], refs: ['Atkins Focus 5'],
          pic: 'Add a compound to a binary system: with congruent melting the diagram looks like two eutectic systems side by side; slide its stability down and a peritectic appears where the compound decomposes before melting.' },
        { num: '6.10', kind: 'Method', name: 'Zone refining', deps: ['pchem-6.8'], refs: ['Atkins Focus 5'],
          pic: 'Pass a molten zone along a rod repeatedly: impurities with distribution coefficient k < 1 ride along with the zone, and the computed impurity profile drops by orders of magnitude after a few passes.' },
        { num: '6.11', kind: 'Method', name: 'Ternary phase diagrams', deps: ['pchem-6.1', 'pchem-6.3'], refs: ['Atkins Focus 5'],
          pic: 'Drag a point in a triangle whose corners are three pure components: the distances to the sides read out the three mole fractions, and a two-phase region with tie lines shows the lever rule in two dimensions.' },
        { num: '6.12', kind: 'Paper', name: 'On the Equilibrium of Heterogeneous Substances',
          paper: { authors: 'J. Willard Gibbs', year: 1876, title: 'On the Equilibrium of Heterogeneous Substances', venue: 'Transactions of the Connecticut Academy of Arts and Sciences 3: 108–248 (1876) and 343–524 (1878)', url: 'https://archive.org/details/transactionsconn03conn' },
          introduces: ['pchem-6.1', 'pchem-5.2', 'pchem-5.3'], deps: ['thermo-2.9', 'thermo-1.11', 'thermo-3.4', 'thermo-2.19'], refs: [],
          pic: 'Build a phase diagram from free-energy surfaces: the reader shapes G for each phase of a binary system, Gibbs’ tangent construction picks out the coexisting phases, and counting components and phases anywhere on the diagram confirms F = C − P + 2.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 7
    {
      n: 7,
      title: 'Chemical equilibrium',
      summary: String.raw`A reacting mixture slides downhill in Gibbs energy along the extent of reaction until the slope vanishes; that condition is the equilibrium constant, ΔG° = −RT ln K. Le Chatelier's principle describes the response to disturbances qualitatively, and the van 't Hoff equation quantifies the temperature dependence. The same machinery handles acids and bases, buffers, solubility and the industrial choice of temperature and pressure.`,
      items: [
        { num: '7.1', kind: 'Definition', name: 'Extent of reaction and reaction Gibbs energy', deps: ['pchem-5.2'], refs: ['Atkins Focus 6', 'M–S ch. 26'],
          pic: 'Drag the extent ξ of N₂O₄ ⇌ 2NO₂ from all reactant to all product: the total G curve is drawn, its slope ΔᵣG is the tangent, and the bottom of the valley is the equilibrium mixture.' },
        { num: '7.2', kind: 'Theorem', name: 'ΔᵣG = ΔᵣG° + RT ln Q', deps: ['pchem-7.1', 'pchem-5.4'], refs: ['Atkins Focus 6', 'M–S ch. 26'],
          pic: 'Set any mixture of reactants and products: the reaction quotient Q and ΔᵣG are computed, and an arrow shows which way the reaction will run — never the wrong way, whatever Q you pick.' },
        { num: '7.3', kind: 'Theorem', name: 'ΔᵣG° = −RT ln K', deps: ['pchem-7.2'], refs: ['Atkins Focus 6', 'M–S ch. 26'],
          pic: 'Move ΔᵣG° with a slider and watch K swing over orders of magnitude on a log axis: ±5.7 kJ/mol at room temperature changes K tenfold, and the equilibrium composition updates live.' },
        { num: '7.4', kind: 'Law', name: 'Law of mass action', deps: ['pchem-7.3'], refs: ['Atkins Focus 6', 'M–S ch. 26'],
          pic: 'Start the same reaction from many different initial mixtures: every trajectory ends at compositions with the same value of the activity quotient, plotted as a hyperbola-like curve.' },
        { num: '7.5', kind: 'Proposition', name: 'Kp, Kc and standard states', deps: ['pchem-7.4', 'pchem-1.4'], refs: ['Atkins Focus 6', 'M–S ch. 26'],
          pic: 'Convert an equilibrium constant between pressure and concentration standard states: the factor (RT/p°)^Δn is shown, equal to 1 only when the gas moles balance.' },
        { num: '7.6', kind: 'Phenomenon', name: 'Why equilibrium lies between pure reactants and products', deps: ['pchem-7.1', 'pchem-5.4'], refs: ['Atkins Focus 6'],
          pic: 'Turn the mixing term on and off: without it G is a straight line and the reaction would go to completion, with it the curve always has an interior minimum, even for strongly favoured reactions.' },
        { num: '7.7', kind: 'Principle', name: 'Le Chatelier’s principle', deps: ['pchem-7.4'], refs: ['Atkins Focus 6', 'M–S ch. 26'],
          pic: 'Perturb an equilibrium mixture by adding reactant, removing product, compressing or heating: the computed new equilibrium shifts to partly counteract each change, shown as before/after bars.' },
        { num: '7.8', kind: 'Paradox', name: 'Le Chatelier’s exceptions: inert gas and added reactant', deps: ['pchem-7.7', 'pchem-7.5'], refs: ['Atkins Focus 6'],
          pic: 'Add argon at constant volume (no shift) and at constant pressure (shift toward more moles), then add N₂ to an ammonia mixture rich in nitrogen and watch the equilibrium shift to make more N₂ — the principle misread.' },
        { num: '7.9', kind: 'Theorem', name: 'Van ’t Hoff equation', deps: ['pchem-7.3', 'pchem-3.13'], refs: ['Atkins Focus 6', 'M–S ch. 26'],
          pic: 'Plot ln K against 1/T: exothermic reactions slope one way and endothermic the other, with slope −ΔH°/R, and the readout predicts K at a new temperature.' },
        { num: '7.10', kind: 'Concept', name: 'Coupled reactions and ATP', deps: ['pchem-7.3'], refs: ['Atkins Focus 6'],
          pic: 'Pair an uphill reaction with ATP hydrolysis: the combined ΔG° turns negative, and adjusting the cellular ATP/ADP ratio shows the real driving force can be far larger than the standard value.' },
        { num: '7.11', kind: 'Invention', name: 'Haber–Bosch ammonia synthesis', deps: ['pchem-7.7', 'pchem-7.9'], refs: ['Atkins Focus 6'],
          pic: 'Choose temperature and pressure for N₂ + 3H₂ ⇌ 2NH₃: the equilibrium yield map favours low T and high p, while a rate overlay shows why industry compromises at 400–500 °C, 150–300 atm with a catalyst.' },
        { num: '7.12', kind: 'Definition', name: 'Acid–base equilibria: pH, Ka and pKa', deps: ['pchem-7.4'], refs: ['Atkins Focus 6'],
          pic: 'Dilute a weak acid step by step: the fraction dissociated grows while pH rises, computed exactly from Ka and water autoionization, so very dilute acid never becomes basic.' },
        { num: '7.13', kind: 'Proposition', name: 'Buffers and the Henderson–Hasselbalch equation', deps: ['pchem-7.12'], refs: ['Atkins Focus 6'],
          pic: 'Add strong acid drop by drop to pure water and to an acetate buffer: the buffer’s pH barely moves near its pKa and then collapses once the base is used up, unlike pure water which plunges at once.' },
        { num: '7.14', kind: 'Method', name: 'Titration curves', deps: ['pchem-7.13'], refs: ['Atkins Focus 6'],
          pic: 'Titrate weak and strong acids with base: the full pH curve is computed, the half-equivalence point reads off pKa, and an indicator slider shows which colour change marks the equivalence point.' },
        { num: '7.15', kind: 'Law', name: 'Solubility product and the common-ion effect', deps: ['pchem-7.4'], refs: ['Atkins Focus 6'],
          pic: 'Add NaCl to a saturated AgCl solution: silver concentration drops along a hyperbola of fixed Ksp, then rises again at high chloride as complex ions form — the simple model’s limit.' },
        { num: '7.16', kind: 'Method', name: 'Ellingham diagram', deps: ['pchem-7.3'], refs: ['Atkins Focus 6'],
          pic: 'Plot ΔG° of oxide formation against temperature for several metals and carbon: the CO line slopes downward, crossing the others, and each crossing marks the temperature above which carbon can smelt that ore.' },
        { num: '7.17', kind: 'Paper', name: 'Sur un énoncé général des lois des équilibres chimiques',
          paper: { authors: 'H. Le Chatelier', year: 1884, title: 'Sur un énoncé général des lois des équilibres chimiques', venue: 'Comptes rendus hebdomadaires des séances de l’Académie des sciences 99: 786–789', url: 'https://archive.org/details/comptes-rendus-hebdomadaires-academie-des-sciences_1884-11-10_99_19' },
          introduces: ['pchem-7.7'], deps: ['pchem-7.4', 'pchem-7.9'], refs: [],
          pic: 'Disturb an equilibrium — N₂O₄ ⇌ 2NO₂ or the ammonia synthesis — by changing temperature, pressure or a concentration and watch the composition shift to oppose the change, with the note’s numbered cases (including the exceptions where nothing moves) checked one by one against the equilibrium constant.' },
        { num: '7.18', kind: 'Paper', name: 'Technische Darstellung von Ammoniak aus den Elementen',
          paper: { authors: 'F. Haber and R. Le Rossignol', year: 1913, title: 'Über die technische Darstellung von Ammoniak aus den Elementen', venue: 'Zeitschrift für Elektrochemie und angewandte physikalische Chemie 19 (2): 53–72', doi: '10.1002/bbpc.19130190201' },
          introduces: ['pchem-7.11'], deps: ['pchem-7.7', 'pchem-7.9', 'kin-6.1', 'pchem-7.17'], refs: [],
          pic: 'Run Haber’s high-pressure circulating reactor: choose temperature and pressure and read the equilibrium ammonia fraction (about a tenth of a percent at 1 atm, over ten percent at 200 atm near 500 °C), then add the osmium or uranium catalyst and see the approach to equilibrium become fast enough to recycle the gas.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 8
    {
      n: 8,
      title: 'Electrolytes and electrochemistry',
      summary: String.raw`Ions interact over long distances, so even dilute electrolyte solutions are far from ideal; the Debye–Hückel theory explains the activity coefficients through the ionic atmosphere. Separating oxidation from reduction in an electrochemical cell turns ΔG into a measurable voltage, and the Nernst equation gives its concentration dependence. Electrode potentials, Pourbaix diagrams, conductivity and batteries are the applications.`,
      items: [
        { num: '8.1', kind: 'Definition', name: 'Mean ionic activity coefficient and ionic strength', deps: ['pchem-5.8'], refs: ['Atkins 5F', 'M–S ch. 25'],
          pic: 'Mix salts of different charge types: ionic strength is computed from all ions, weighting the doubly charged ones by four, and individual-ion activities are shown to be unmeasurable while the mean is not.' },
        { num: '8.2', kind: 'Law', name: 'Debye–Hückel limiting law', deps: ['pchem-8.1', 'vcalc-9.4', 'thermo-10.7'], refs: ['Atkins 5F', 'M–S ch. 25'],
          pic: 'Simulate ions in solution and plot the charge density around a central ion: an oppositely charged atmosphere of radius 1/κ forms, and ln γ± falls as √I, matching data only below about 0.01 M.' },
        { num: '8.3', kind: 'Phenomenon', name: 'Salting in and salting out', deps: ['pchem-8.2', 'pchem-7.15'], refs: ['Atkins 5F'],
          pic: 'Add inert salt to a sparingly soluble salt or a protein: solubility first rises as activity coefficients fall, then drops at high ionic strength, matching the extended Debye–Hückel curve only at the start.' },
        { num: '8.4', kind: 'Concept', name: 'Galvanic cells and half-reactions', deps: ['pchem-3.11'], refs: ['Atkins Focus 6'],
          pic: 'Build a Daniell cell from zinc and copper half-cells: electrons flow through the wire, ions through the salt bridge, and removing the bridge stops the current instantly.' },
        { num: '8.5', kind: 'Theorem', name: 'Cell potential and ΔG = −nFE', deps: ['pchem-8.4', 'pchem-7.2'], refs: ['Atkins Focus 6'],
          pic: 'Balance a cell with a variable external voltage: no current flows exactly at the cell potential, which is converted to ΔᵣG via Faraday’s constant and compared with thermochemical tables.' },
        { num: '8.6', kind: 'Law', name: 'Nernst equation', deps: ['pchem-8.5'], refs: ['Atkins Focus 6'],
          pic: 'Change the ion concentrations in each half-cell: the cell voltage moves by 59/n mV per decade at 25 °C, reaches zero exactly when Q = K, and the battery is dead.' },
        { num: '8.7', kind: 'Definition', name: 'Standard electrode potentials and the electrochemical series', deps: ['pchem-8.6'], refs: ['Atkins Focus 6'],
          pic: 'Drag pairs of couples onto a vertical potential ladder referenced to the hydrogen electrode: the higher one is reduced, the lower one oxidized, and the cell voltage is their difference.' },
        { num: '8.8', kind: 'Model', name: 'Concentration cells and the glass pH electrode', deps: ['pchem-8.6'], refs: ['Atkins Focus 6'],
          pic: 'Two identical electrodes in solutions of different concentration give a voltage set only by the ratio; a glass electrode in solutions of varying pH traces the 59 mV per pH unit line.' },
        { num: '8.9', kind: 'Proposition', name: 'Reaction entropy and enthalpy from cell EMF', deps: ['pchem-8.5', 'pchem-3.13'], refs: ['Atkins Focus 6'],
          pic: 'Measure a simulated cell voltage at several temperatures: the slope dE/dT gives ΔS and, through Gibbs–Helmholtz, ΔH, compared with calorimetric values.' },
        { num: '8.10', kind: 'Law', name: 'Faraday’s laws of electrolysis', deps: ['pchem-8.4'], refs: ['Atkins Focus 6'],
          pic: 'Pass a chosen current for a chosen time through copper sulfate: the plated mass grows linearly with charge, and switching to silver nitrate deposits mass in the ratio of molar mass to charge.' },
        { num: '8.11', kind: 'Method', name: 'Pourbaix diagrams', deps: ['pchem-8.6', 'pchem-7.12'], refs: ['Atkins Focus 6'],
          pic: 'Drag a point over the potential–pH map of iron in water: regions of immunity, corrosion and passivation are computed from Nernst lines, with water’s stability window drawn between dashed lines.' },
        { num: '8.12', kind: 'Law', name: 'Kohlrausch’s law and the Ostwald dilution law', deps: ['pchem-8.2', 'pchem-7.12'], refs: ['Atkins Focus 16'],
          pic: 'Plot molar conductivity against √c: strong electrolytes fall along Kohlrausch’s straight line, while acetic acid plunges as its dissociation fraction follows Ostwald’s dilution law.' },
        { num: '8.13', kind: 'Phenomenon', name: 'Donnan equilibrium and membrane potentials', deps: ['pchem-8.6', 'pchem-5.13'], refs: ['Atkins Focus 6'],
          pic: 'Trap charged proteins on one side of a membrane permeable to small ions: the small ions redistribute unevenly, a membrane potential appears, and the Nernst potential for each ion is read out.' },
        { num: '8.14', kind: 'Invention', name: 'Batteries and fuel cells', deps: ['pchem-8.6', 'pchem-3.11'], refs: ['Atkins Focus 6'],
          pic: 'Discharge a lead–acid, a lithium-ion and a hydrogen fuel cell model: voltage curves fall with state of charge or current, and the energy-density readout compares them with petrol.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 9
    {
      n: 9,
      title: 'Statistical thermodynamics',
      summary: String.raw`Thermodynamic quantities are averages over molecular energy levels. The Boltzmann distribution weights each level, the partition function sums the weights, and from it come the internal energy, entropy, heat capacity and even equilibrium constants. Translational, rotational, vibrational and electronic contributions factorize, which explains why modes freeze out at low temperature and how spectroscopy feeds thermodynamic tables.`,
      items: [
        { num: '9.1', kind: 'Law', name: 'Boltzmann distribution', deps: ['pchem-3.7', 'thermo-6.1'], refs: ['Atkins Focus 13', 'M–S ch. 17'],
          pic: 'Let quanta of energy hop randomly among many oscillators: the occupation histogram settles into an exponential whose slope gives 1/kT, and doubling the total energy halves the slope.' },
        { num: '9.2', kind: 'Definition', name: 'Molecular partition function', deps: ['pchem-9.1', 'thermo-6.2'], refs: ['Atkins Focus 13', 'M–S ch. 17'],
          pic: 'For a ladder of levels you can edit, q is shown as the number of thermally accessible states: about 1 at low T, growing as the temperature slider reaches the level spacing.' },
        { num: '9.3', kind: 'Proposition', name: 'Translational partition function and thermal wavelength', deps: ['pchem-9.2', 'qchem-1.6'], refs: ['Atkins Focus 13', 'M–S ch. 18'],
          pic: 'Sum the particle-in-a-box levels of a 3D container directly and compare with V/Λ³: the agreement is perfect for ordinary gases, and shrinking the box or cooling helium shows the sum breaking down.' },
        { num: '9.4', kind: 'Proposition', name: 'Rotational partition function and symmetry number', deps: ['pchem-9.2', 'qchem-1.9'], refs: ['Atkins Focus 13', 'M–S ch. 18'],
          pic: 'Sum (2J+1)e^(−BJ(J+1)/kT) term by term against the high-temperature formula kT/σB; switching from HCl to H₂ shows the symmetry number halving q and the approximation failing at low T.' },
        { num: '9.5', kind: 'Proposition', name: 'Vibrational and electronic partition functions', deps: ['pchem-9.2', 'qchem-1.7', 'qchem-2.2'], refs: ['Atkins Focus 13', 'M–S ch. 18'],
          pic: 'Compute q_vib = 1/(1 − e^(−θ/T)) for I₂, N₂ and H₂ on one temperature axis: the soft iodine bond is excited at room temperature, the stiff H₂ bond hardly at all, and electronic q stays 1 except for O₂ and NO.' },
        { num: '9.6', kind: 'Theorem', name: 'Thermodynamic functions from the partition function', deps: ['pchem-9.2'], refs: ['Atkins Focus 13', 'M–S ch. 18'],
          pic: 'Differentiate ln q numerically to get U, S, A and Cv for any level scheme you draw; a two-level system shows the Schottky heat-capacity bump and the entropy approaching k ln 2.' },
        { num: '9.7', alias: 'thermo-6.14', name: 'Freezing out of degrees of freedom' },
        { num: '9.8', alias: 'thermo-5.11', name: 'Sackur–Tetrode equation' },
        { num: '9.9', kind: 'Paradox', name: 'Gibbs paradox', deps: ['pchem-9.8', 'pchem-3.5', 'thermo-4.13'], refs: ['Atkins Focus 13'],
          pic: 'Remove a partition between two gases and dial their distinguishability from different to identical: the mixing entropy stays R ln 2 until the gases become identical, then drops to zero discontinuously, fixed by the 1/N! factor.' },
        { num: '9.10', kind: 'Phenomenon', name: 'Ortho- and para-hydrogen', deps: ['pchem-9.4', 'qchem-3.1'], refs: ['Atkins Focus 13', 'M–S ch. 18'],
          pic: 'Separate the rotational sum into even and odd J weighted by nuclear-spin degeneracy: the equilibrium ortho:para ratio goes from 0 at low T to 3:1 at room temperature, and the slow conversion shows in the heat capacity.' },
        { num: '9.11', kind: 'Theorem', name: 'Equilibrium constants from partition functions', deps: ['pchem-9.6', 'pchem-7.3'], refs: ['Atkins Focus 13', 'M–S ch. 18'],
          pic: 'Compute K for I₂ ⇌ 2I from spectroscopic constants alone and plot it against temperature with experimental values; the dissociation energy and the translational factors are shown as separate contributions.' },
        { num: '9.12', kind: 'Model', name: 'Einstein and Debye models of solid heat capacity', deps: ['pchem-9.5', 'mech-11.8', 'thermo-5.3', 'thermo-9.13'], refs: ['Atkins Focus 13', 'M–S ch. 18'],
          pic: 'Fit diamond’s heat capacity with one oscillator frequency (Einstein) or a spectrum of phonons (Debye): both reach 3R at high T (Dulong–Petit), but only Debye follows the T³ law at low T.' },
        { num: '9.13', kind: 'Definition', name: 'Canonical ensemble', deps: ['pchem-9.2', 'thermo-6.2'], refs: ['Atkins Focus 13', 'M–S ch. 17'],
          pic: 'A small system exchanges energy with a large bath: sampled system energies follow e^(−E/kT) weighted by the density of states, and their spread shrinks relative to the mean as the system size grows.' },
        { num: '9.14', kind: 'Phenomenon', name: 'Equilibrium isotope effects', deps: ['pchem-9.11', 'qchem-1.8'], refs: ['M–S ch. 18'],
          pic: 'Compute the equilibrium constant of H₂ + D₂ ⇌ 2HD and of oxygen-isotope exchange between water and carbonate from zero-point energies: the computed temperature dependence is the basis of isotope paleothermometry.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 10
    {
      n: 10,
      title: 'Molecules in motion: transport',
      summary: String.raw`Gradients in concentration, momentum and temperature drive fluxes of matter, momentum and heat, and simple kinetic theory predicts all three transport coefficients from the mean free path. In liquids, diffusion is a random walk: Fick's laws describe the average, Einstein's relation links the spread to time, and Stokes–Einstein links diffusion to viscosity. Ionic mobilities tie transport to electrochemistry.`,
      items: [
        { num: '10.1', kind: 'Law', name: 'Fick’s first law', deps: ['pchem-5.2', 'thermo-7.6'], refs: ['Atkins Focus 16', 'M–S ch. 27'],
          pic: 'Particles random-walk across a box with a concentration gradient: a counter at a mid-plane measures net flux, proportional to the gradient, and flattening the gradient stops the flow without stopping the motion.' },
        { num: '10.2', kind: 'Law', name: 'Fick’s second law (the diffusion equation)', deps: ['pchem-10.1', 'vcalc-8.6'], refs: ['Atkins Focus 16'],
          pic: 'Release a drop of dye in a 1D channel: the simulated walker histogram spreads as a Gaussian of variance 2Dt, matching the numerical solution of the diffusion equation step for step.' },
        { num: '10.3', kind: 'Theorem', name: 'Einstein–Smoluchowski relation ⟨x²⟩ = 2Dt', deps: ['pchem-10.2', 'thermo-7.9'], refs: ['Atkins Focus 16'],
          pic: 'Follow many random walkers and plot their mean-square displacement against time: a straight line whose slope gives D, while the mean displacement stays at zero — diffusion is slow over long distances.' },
        { num: '10.4', kind: 'Law', name: 'Stokes–Einstein relation', deps: ['pchem-10.3', 'thermo-7.8'], refs: ['Atkins Focus 16'],
          pic: 'Watch Brownian particles of adjustable radius in liquids of adjustable viscosity: measured D follows kT/6πηr, and Perrin-style counting recovers Avogadro’s number from the trajectories.' },
        { num: '10.5', kind: 'Model', name: 'Kinetic theory of transport coefficients', deps: ['pchem-1.9', 'pchem-10.1'], refs: ['Atkins Focus 16', 'M–S ch. 27'],
          pic: 'Shear a dilute gas between plates: molecules carry momentum across one mean free path, giving a viscosity that the readout shows is independent of pressure — Maxwell’s surprising prediction — until the free path reaches the plate gap.' },
        { num: '10.6', kind: 'Law', name: 'Fourier’s law of heat conduction', deps: ['pchem-10.5', 'thermo-7.3'], refs: ['Atkins Focus 16'],
          pic: 'Hold the ends of a rod at different temperatures: the steady profile is linear with heat flux set by the conductivity, and the transient approach is the same diffusion equation with a different coefficient.' },
        { num: '10.7', kind: 'Definition', name: 'Ionic mobility and conductivity', deps: ['pchem-10.4', 'pchem-8.12'], refs: ['Atkins Focus 16'],
          pic: 'Apply a field to ions in solution: drift speed is proportional to field strength, and the anomalously high mobility of H⁺ is shown as proton hopping along a hydrogen-bonded chain (the Grotthuss mechanism).' },
        { num: '10.8', kind: 'Theorem', name: 'Nernst–Einstein relation', deps: ['pchem-10.7', 'pchem-10.3'], refs: ['Atkins Focus 16'],
          pic: 'Measure the diffusion coefficient and the mobility of the same ion in two simulations: their ratio is kT/ze every time, the first glimpse of the fluctuation–dissipation theorem.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 11
    {
      n: 11,
      title: 'Molecular interactions and surfaces',
      summary: String.raw`The forces between molecules — dispersion, dipolar, hydrogen bonding — decide whether a substance boils at 20 K or 400 K and whether two liquids mix. At surfaces those forces drive adsorption, which Langmuir and BET isotherms quantify, and wetting, which Young's equation describes. Surfactants, colloids and the Sabatier principle of catalysis follow.`,
      items: [
        { num: '11.1', kind: 'Concept', name: 'Intermolecular forces and boiling points', deps: ['qchem-4.11', 'pchem-1.13'], refs: ['Atkins Focus 14'],
          pic: 'Plot boiling points of the noble gases, alkanes and group 14–17 hydrides against molar mass: dispersion explains the steady rise, and H₂O, HF and NH₃ jump off the trend through hydrogen bonding.' },
        { num: '11.2', kind: 'Phenomenon', name: 'Hydrogen bonding and the anomalies of water', deps: ['pchem-11.1'], refs: ['Atkins Focus 14'],
          pic: 'Simulate a hydrogen-bond network in 2D: cooling increases its order and opens the structure, so the density peaks near 4 °C and ice floats — switch off the directional bonding and the anomaly vanishes.' },
        { num: '11.3', kind: 'Phenomenon', name: 'Hydrophobic effect', deps: ['pchem-11.2', 'pchem-3.5'], refs: ['Atkins Focus 14'],
          pic: 'Insert oily solutes into a water lattice model: water molecules order around each one, and clustering the solutes frees water and raises the total entropy, driving aggregation.' },
        { num: '11.4', kind: 'Model', name: 'Langmuir adsorption isotherm', deps: ['pchem-7.4'], refs: ['Atkins Focus 19', 'M–S ch. 31'],
          pic: 'Gas molecules land on and leave a grid of sites: coverage versus pressure rises and saturates at one monolayer, exactly following Kp/(1 + Kp), until lateral interactions are switched on.' },
        { num: '11.5', kind: 'Model', name: 'BET isotherm and surface-area measurement', deps: ['pchem-11.4'], refs: ['Atkins Focus 19', 'M–S ch. 31'],
          pic: 'Let molecules stack in multilayers above the first: the isotherm rises without bound near the vapour pressure, and the linearized BET plot returns the monolayer capacity and the surface area of a powder.' },
        { num: '11.6', kind: 'Concept', name: 'Physisorption versus chemisorption', deps: ['pchem-11.4', 'qchem-5.2'], refs: ['Atkins Focus 19'],
          pic: 'Bring a molecule toward a surface along two potential curves: a shallow physisorption well far out and a deep chemisorption well close in, separated by a barrier whose height decides whether dissociation is activated.' },
        { num: '11.7', kind: 'Theorem', name: 'Gibbs adsorption isotherm', deps: ['pchem-4.9', 'pchem-5.3'], refs: ['Atkins Focus 14'],
          pic: 'Add surfactant to water: surface tension falls with ln c and the slope gives the surface excess — the number of molecules crowding at the interface — until the curve flattens at the CMC.' },
        { num: '11.8', kind: 'Phenomenon', name: 'Surfactants, micelles and the CMC', deps: ['pchem-11.7', 'pchem-11.3'], refs: ['Atkins Focus 14'],
          pic: 'Raise the amphiphile concentration in a lattice simulation: free monomers accumulate until a critical concentration, beyond which every added molecule joins a micelle, shown by the sharp break in the monomer count.' },
        { num: '11.9', kind: 'Law', name: 'Young’s equation and contact angles', deps: ['pchem-4.9'], refs: ['Atkins Focus 14'],
          pic: 'Adjust the three interfacial tensions: a drop on a surface spreads, beads or balls up with the contact angle set by force balance at the contact line, and texturing the surface produces the lotus effect.' },
        { num: '11.10', kind: 'Model', name: 'DLVO theory of colloid stability', deps: ['pchem-8.2', 'qchem-4.11'], refs: ['Atkins Focus 14'],
          pic: 'Add salt to a colloid: the double-layer repulsion shrinks with the Debye length while van der Waals attraction stays, and the energy barrier against coagulation collapses at a computed critical salt concentration.' },
        { num: '11.11', kind: 'Principle', name: 'Sabatier principle and volcano plots', deps: ['pchem-11.4', 'pchem-11.6'], refs: ['Atkins Focus 19'],
          pic: 'Vary the adsorption energy of an intermediate on a model catalyst: too weak and nothing sticks, too strong and the surface poisons, and the computed rate traces a volcano with the best metals near the peak.' },
      ],
    },
  ],
};
