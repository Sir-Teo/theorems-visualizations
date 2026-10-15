// Syllabus — Geology & Geophysics (curated course; see collection.js for references)
// Refs: "Stein–Wysession" = An Introduction to Seismology, Earthquakes, and Earth Structure — chapters verified:
// 1 introduction, 2 basic seismological theory, 3 seismology and Earth structure, 4 earthquakes, 5 seismology
// and plate tectonics, 6 seismograms as signals, 7 inverse problems. "Turcotte–Schubert" = Geodynamics
// (chapter-level, following the 2nd/3rd-edition structure: 1 plate tectonics, 2 stress and strain, 3 elasticity
// and flexure, 4 heat transfer, 5 gravity, 6 fluid mechanics, 7 rock rheology, 8 faulting, 9 porous media,
// 10 chemical geodynamics — not re-verified online). "Press–Siever" = Understanding Earth (author-level).
//
// Sources consulted (research pass, 2026-10):
//   - Stein & Wysession chapter list: http://levee.wustl.edu/seismology/book/
//   - MIT OCW 12.001 Introduction to Geology syllabus (minerals and rocks, mapping, plate tectonics, erosion,
//     history of life): https://ocw.mit.edu/courses/12-001-introduction-to-geology-fall-2013/pages/syllabus/
//   - Wikipedia: https://en.wikipedia.org/wiki/Geodynamics (mantle convection, post-glacial rebound,
//     Adams–Williamson, PREM, plumes, geodynamo); https://en.wikipedia.org/wiki/List_of_scientific_laws_named_after_people
//     (Byerlee, Birch, Archie, Steno, Walther)
// Gaps filled after comparison: Steno's principles, faunal succession, Walther's law, Kelvin's age of the Earth,
// closure temperature, cosmogenic dating, triple-junction stability, plate model, Nusselt–Rayleigh scaling,
// flexural bulges, Byerlee and Anderson faulting, Hubbert–Rubey pore pressure, surface-wave dispersion, normal
// modes, Herglotz–Wiechert, Adams–Williamson, Birch's law, Båth's law, rate-and-state friction, Rikitake dynamo.
// Deliberate omissions: petrology and mineral identification beyond Bowen's series, sedimentology and
// geomorphology (river and glacier erosion) — candidates for a later Earth-surface collection.
export default {
  collection: 'geol',
  chapters: [
    // ───────────────────────────────────────────────────────────── 1
    {
      n: 1,
      title: 'Rocks, strata and geologic time',
      summary: String.raw`Geology reads history from rocks. Minerals crystallize in a predictable order from cooling magma, the rock cycle recycles them, and Steno's principles, faunal succession and unconformities order the strata into a relative time scale. Hutton's uniformitarianism demanded deep time, and Kelvin's famous cooling estimate of the Earth's age shows how a sound calculation on a wrong assumption can mislead.`,
      items: [
        { num: '1.1', kind: 'Concept', name: 'Silicate minerals and their structures', deps: ['xtal-1.10'], refs: ['Press–Siever'],
          pic: 'Link SiO₄ tetrahedra into isolated units, chains, sheets and frameworks: the silicon-to-oxygen ratio, cleavage directions and example minerals (olivine, pyroxene, mica, quartz) update with each topology.' },
        { num: '1.2', kind: 'Model', name: 'The rock cycle', deps: ['geol-1.1'], refs: ['Press–Siever'],
          pic: 'Follow a grain of quartz through melting, eruption, weathering, burial and metamorphism: each transition’s rate and typical residence time are shown on a cycle diagram you can step through.' },
        { num: '1.3', kind: 'Phenomenon', name: 'Bowen’s reaction series and fractional crystallization', deps: ['pchem-6.8', 'geol-1.1'], refs: ['Press–Siever'],
          pic: 'Cool a basaltic melt on a simplified phase diagram while removing crystals as they form: the liquid evolves toward silica-rich compositions, reproducing the order olivine, pyroxene, amphibole, mica, quartz.' },
        { num: '1.4', kind: 'Principle', name: 'Steno’s principles of stratigraphy', deps: [], refs: ['Press–Siever'],
          pic: 'Deposit layers, tilt them, intrude a dike and erode: superposition, original horizontality and cross-cutting relations let the reader reconstruct the order of events from the final outcrop.' },
        { num: '1.5', kind: 'Principle', name: 'Faunal succession and correlation', deps: ['geol-1.4'], refs: ['Press–Siever'],
          pic: 'Compare stratigraphic columns from distant sites: matching fossil assemblages lets layers be correlated, as William Smith did for his 1815 map, even where the rock types differ.' },
        { num: '1.6', kind: 'Principle', name: 'Uniformitarianism and unconformities', deps: ['geol-1.4'], refs: ['Press–Siever'],
          pic: 'Build Siccar Point step by step — deposition, folding, uplift, erosion, new deposition — and estimate from modern rates how long the hidden gap in time must be.' },
        { num: '1.7', kind: 'Law', name: 'Walther’s law of facies', deps: ['geol-1.4'], refs: ['Press–Siever'],
          pic: 'Let the sea advance over a coastline with sand, mud and limestone belts side by side: the vertical sequence deposited at one point repeats the lateral sequence of environments.' },
        { num: '1.8', kind: 'Paradox', name: 'Kelvin’s age of the Earth', deps: ['thermo-7.4', 'pde-3.8'], refs: ['Turcotte–Schubert ch. 4'],
          pic: 'Cool a half-space from an initial molten temperature and match the present surface heat flow: the answer is tens of millions of years, until radiogenic heating or mantle convection (Perry’s objection) is switched on.' },
        { num: '1.9', kind: 'Concept', name: 'The geologic time scale', deps: ['geol-1.5', 'geol-2.3'], refs: ['Press–Siever'],
          pic: 'Zoom along a 4.6-billion-year timeline: eons, eras and periods are calibrated by radiometric ages, mass extinctions mark boundaries, and human history occupies the last pixel.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 2
    {
      n: 2,
      title: 'Radiometric dating',
      summary: String.raw`Radioactive decay is a clock that heat, pressure and chemistry cannot reset. Measuring daughter and parent isotopes gives an age; the isochron method removes the need to know the initial daughter content; decay chains and concordia diagrams cross-check uranium–lead ages; and closure temperatures turn ages into thermal histories. Patterson's lead isotopes fixed the age of the Earth at 4.55 billion years.`,
      items: [
        { num: '2.1', kind: 'Law', name: 'Radioactive decay law', deps: ['kin-9.7'], refs: ['Press–Siever', 'Turcotte–Schubert ch. 10'],
          pic: 'Decay a sample of atoms with a chosen half-life: the parent curve falls exponentially and the daughter rises as its mirror image, and the parent–daughter ratio gives the elapsed time.' },
        { num: '2.2', kind: 'Proposition', name: 'The age equation', deps: ['geol-2.1'], refs: ['Turcotte–Schubert ch. 10'],
          pic: 'Enter measured daughter and parent amounts: t = ln(1 + D/P)/λ is computed with error bars propagated from the measurement, showing why different isotope systems suit different ages.' },
        { num: '2.3', kind: 'Method', name: 'The isochron method (Rb–Sr)', deps: ['geol-2.2', 'stat-12.2'], refs: ['Turcotte–Schubert ch. 10'],
          pic: 'Minerals from one rock start on a horizontal line of equal ⁸⁷Sr/⁸⁶Sr; as time runs the points rotate about the intercept, the fitted slope gives the age and the intercept the initial ratio, and disturbing one mineral flags a bad fit.' },
        { num: '2.4', kind: 'Theorem', name: 'Decay chains and secular equilibrium', deps: ['geol-2.1', 'kin-4.1'], refs: ['Turcotte–Schubert ch. 10'],
          pic: 'Run the ²³⁸U chain with its intermediate daughters: after a few half-lives of the longest-lived intermediate, all activities become equal, and disturbing the chain shows the return to equilibrium.' },
        { num: '2.5', kind: 'Method', name: 'U–Pb concordia', deps: ['geol-2.2'], refs: ['Turcotte–Schubert ch. 10'],
          pic: 'Plot ²⁰⁶Pb/²³⁸U against ²⁰⁷Pb/²³⁵U: undisturbed zircons lie on the concordia curve, lead loss pulls them along a chord, and the chord’s intercepts give both crystallization and disturbance ages.' },
        { num: '2.6', kind: 'Method', name: 'Radiocarbon dating and calibration', deps: ['geol-2.2'], refs: ['Press–Siever'],
          pic: 'Date organic samples from ¹⁴C activity: the raw age is converted through a calibration curve that wiggles where atmospheric ¹⁴C varied, so one measurement can map to several calendar ranges.' },
        { num: '2.7', kind: 'Method', name: 'K–Ar and ⁴⁰Ar/³⁹Ar dating', deps: ['geol-2.2'], refs: ['Turcotte–Schubert ch. 10'],
          pic: 'Heat a sample in steps and plot apparent age against released argon: a flat plateau gives a reliable age, while argon loss shows as young ages in the first steps.' },
        { num: '2.8', kind: 'Concept', name: 'Closure temperature and thermochronology', deps: ['geol-2.2', 'mat-2.7'], refs: ['Turcotte–Schubert ch. 10'],
          pic: 'Cool a rock slowly: each mineral–isotope system starts recording when diffusion freezes the daughter in, so the computed ages are staggered, and plotting them against closure temperatures reconstructs the cooling path.' },
        { num: '2.9', kind: 'Event', name: 'Patterson’s age of the Earth from lead isotopes', deps: ['geol-2.3'], refs: ['Turcotte–Schubert ch. 10'],
          pic: 'Plot ²⁰⁷Pb/²⁰⁴Pb against ²⁰⁶Pb/²⁰⁴Pb for meteorites and modern ocean sediment: they line up on a single geochron whose slope gives 4.55 billion years.' },
        { num: '2.10', kind: 'Method', name: 'Cosmogenic-nuclide exposure dating', deps: ['geol-2.1'], refs: ['Press–Siever'],
          pic: 'Expose a boulder surface to cosmic rays: ¹⁰Be builds up toward a saturation where production balances decay, and the concentration gives exposure age, corrected for erosion with a slider.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 3
    {
      n: 3,
      title: 'Plate tectonics on a sphere',
      summary: String.raw`The lithosphere is broken into rigid plates moving over the softer mantle. Because the plates live on a sphere, every relative motion is a rotation about an Euler pole, which predicts how spreading rates vary along a ridge and why transform faults trace small circles. Magnetic stripes date the sea floor, triple junctions can be stable or not, and hotspot tracks record plate motion over the deep mantle.`,
      items: [
        { num: '3.1', kind: 'Hypothesis', name: 'Continental drift (Wegener)', deps: [], refs: ['Turcotte–Schubert ch. 1', 'Press–Siever'],
          pic: 'Drag South America toward Africa on a globe: coastlines at the continental shelf edge fit snugly, and matching fossils, rock belts and glacial striations line up across the closed ocean.' },
        { num: '3.2', kind: 'Phenomenon', name: 'Seafloor spreading and magnetic stripes', deps: ['geol-3.1', 'mat-9.12'], refs: ['Turcotte–Schubert ch. 1', 'Stein–Wysession ch. 5'],
          pic: 'Erupt crust at a ridge while the field flips according to a reversal timeline: symmetric stripes of normal and reversed magnetization appear, and a ship-track magnetometer profile matches them for a chosen spreading rate (Vine–Matthews–Morley).' },
        { num: '3.3', kind: 'Concept', name: 'Plate boundaries: divergent, convergent and transform', deps: ['geol-3.2'], refs: ['Turcotte–Schubert ch. 1'],
          pic: 'Draw a boundary between two plates on a globe and set their motion: the boundary type at each point is classified from the relative velocity, with earthquakes and volcanoes placed accordingly.' },
        { num: '3.4', kind: 'Theorem', name: 'Every plate motion is a rotation about an Euler pole', deps: ['mech-10.1', 'geog-1.3'], refs: ['Stein–Wysession ch. 5', 'Turcotte–Schubert ch. 1'],
          pic: 'Move a rigid cap over a sphere by any sequence of steps: the net displacement is always a single rotation about one axis, whose pole is computed and drawn on the globe.' },
        { num: '3.5', kind: 'Proposition', name: 'Relative plate velocity v = ω × r', deps: ['geol-3.4', 'mech-9.4'], refs: ['Stein–Wysession ch. 5'],
          pic: 'Place an Euler pole and angular speed: velocity arrows along a boundary grow with angular distance from the pole as sin Δ, so spreading is fastest 90° away and zero at the pole.' },
        { num: '3.6', kind: 'Proposition', name: 'Transform faults lie on small circles about the Euler pole', deps: ['geol-3.5'], refs: ['Stein–Wysession ch. 5'],
          pic: 'Fit an Euler pole to the azimuths of transform faults on a mid-ocean ridge: the faults bend along small circles about it, and moving the pole misaligns them visibly.' },
        { num: '3.7', kind: 'Method', name: 'Plate circuits: adding angular velocities', deps: ['geol-3.5'], refs: ['Stein–Wysession ch. 5'],
          pic: 'Chain Euler vectors around three plates (A→B, B→C): the predicted C–A motion is the vector sum, compared with independent data, and a non-closing circuit flags an unrecognized plate.' },
        { num: '3.8', kind: 'Theorem', name: 'Triple-junction stability (McKenzie–Morgan)', deps: ['geol-3.7'], refs: ['Turcotte–Schubert ch. 1'],
          pic: 'Construct the velocity triangle for a junction of ridges, trenches and transforms: the junction is stable only if the three boundary lines meet at a point in velocity space, otherwise it migrates and changes geometry.' },
        { num: '3.9', kind: 'Phenomenon', name: 'Hotspot tracks and absolute plate motion', deps: ['geol-3.5', 'geol-2.7'], refs: ['Turcotte–Schubert ch. 1'],
          pic: 'Move the Pacific plate over a fixed plume: a chain of volcanoes ages away from the hotspot, and changing the Euler pole 47 million years ago produces the Hawaiian–Emperor bend.' },
        { num: '3.10', kind: 'Phenomenon', name: 'Subduction zones and Wadati–Benioff zones', deps: ['geol-3.3'], refs: ['Stein–Wysession ch. 5', 'Turcotte–Schubert ch. 1'],
          pic: 'Plot earthquake hypocentres in a cross-section across a trench: they form a dipping plane down to 700 km, whose dip steepens as the subducting plate gets older in the reader’s model.' },
        { num: '3.11', kind: 'Method', name: 'Paleomagnetism and apparent polar wander', deps: ['geol-3.4', 'em-7.17'], refs: ['Turcotte–Schubert ch. 1'],
          pic: 'Compute paleopoles from remanent magnetization in rocks of different ages: each continent traces an apparent polar-wander path, and two paths merge when the continents are restored to their past positions.' },
        { num: '3.12', kind: 'Model', name: 'The Wilson cycle', deps: ['geol-3.3', 'geol-3.10'], refs: ['Press–Siever'],
          pic: 'Animate an ocean opening from a rift, widening, starting to subduct and closing into a mountain belt: the cycle repeats, assembling and breaking supercontinents over hundreds of millions of years.' },
      ],
    },
  ],
};
