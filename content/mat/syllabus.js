// Syllabus — Materials Science (curated course; see collection.js for references)
// Refs: "Callister" = Callister & Rethwisch, Materials Science and Engineering: An Introduction (10th ed.) —
// section numbers checked against the publisher's table of contents; "Porter–Easterling" = Phase
// Transformations in Metals and Alloys (ch. 1 thermodynamics and phase diagrams, 2 diffusion, 3 interfaces,
// 4 solidification, 5 diffusional transformations, 6 diffusionless transformations; chapter-level).
//
// Sources consulted (research pass, 2026-10):
//   - Callister 10e table of contents (Wiley excerpt PDF):
//     https://www.wiley.com/en-us/Materials+Science+and+Engineering%3A+An+Introduction%2C+10th+Edition-p-9781119405498
//     https://media.wiley.com/product_data/excerpt/76/11197217/1119721776-21.pdf
//   - MIT OCW 3.091 Introduction to Solid-State Chemistry (Fall 2018) syllabus topics:
//     https://ocw.mit.edu/courses/3-091-introduction-to-solid-state-chemistry-fall-2018/pages/syllabus/
//   - MIT OCW 3.60 Symmetry, Structure and Tensor Properties (calendar):
//     https://ocw.mit.edu/courses/3-60-symmetry-structure-and-tensor-properties-of-materials-fall-2005/pages/calendar/
//   - Wikipedia: https://en.wikipedia.org/wiki/Materials_science ;
//     https://en.wikipedia.org/wiki/List_of_scientific_laws_named_after_people (Basquin, Hollomon, Zener–Hollomon)
// Gaps filled after comparison: Hume-Rothery rules, Kirkendall effect, Considère and Hollomon, inverse
// Hall–Petch, Weibull statistics, Basquin/Paris/Miner fatigue laws, Larson–Miller, Scheil, Jominy/CCT,
// shape memory, Kauzmann paradox, Shockley–Queisser, Pilling–Bedworth and Wagner oxidation.
// Deliberate omissions: detailed processing (casting, forming, additive manufacturing), magnetic storage,
// biomaterials, and economic/environmental chapters.
export default {
  collection: 'mat',
  chapters: [
    // ───────────────────────────────────────────────────────────── 1
    {
      n: 1,
      title: 'Bonding, structure and properties',
      summary: String.raw`Materials science links how atoms bond and pack to what a material does. The shape of the interatomic potential sets stiffness, melting point and thermal expansion; crystal structure and its polymorphs set density and anisotropy; and comparing whole classes of materials on property charts turns selection into a design method.`,
      items: [
        { num: '1.1', kind: 'Concept', name: 'Bond-energy curves and bonding types', deps: ['qchem-5.2'], refs: ['Callister §2.5', 'Callister §2.6'],
          pic: 'Switch between ionic, covalent, metallic and van der Waals pair potentials: the well depth tracks melting points, and the readout lists which material class each curve represents.' },
        { num: '1.2', kind: 'Proposition', name: 'Elastic modulus from bond stiffness', deps: ['mat-1.1', 'qchem-5.2'], refs: ['Callister §6.3', 'Callister §2.5'],
          pic: 'Pull on a chain of atoms: the force–extension slope at equilibrium equals the curvature of the bond potential, and stiffer, deeper wells give the moduli of diamond and tungsten versus lead.' },
        { num: '1.3', kind: 'Phenomenon', name: 'Thermal expansion from anharmonicity', deps: ['mat-1.1', 'qchem-5.12'], refs: ['Callister §19.3'],
          pic: 'Heat an atom in an asymmetric well: its mean position drifts outward with temperature, while in a symmetric harmonic well it would not move at all, so expansion vanishes for the parabola.' },
        { num: '1.4', kind: 'Phenomenon', name: 'Polymorphism and allotropy of iron', deps: ['xtal-1.6'], refs: ['Callister §3.6'],
          pic: 'Heat iron through 912 °C and 1394 °C: the structure switches bcc → fcc → bcc, the measured length jumps at each transition, and the dilatometer trace is drawn as it happens.' },
        { num: '1.5', kind: 'Concept', name: 'Anisotropy of single crystals', deps: ['xtal-3.11'], refs: ['Callister §3.15'],
          pic: 'Plot Young’s modulus of iron, copper and tungsten as a 3D surface over directions: strongly lobed for copper, nearly spherical for tungsten, and averaged out in a polycrystal.' },
        { num: '1.6', kind: 'Definition', name: 'Linear and planar atomic densities', deps: ['xtal-4.2', 'xtal-1.5'], refs: ['Callister §3.11'],
          pic: 'Slice an fcc or bcc crystal along a chosen plane: the atoms per unit area are counted, and the densest planes and directions are flagged as the future slip systems.' },
        { num: '1.7', kind: 'Method', name: 'Material property charts (Ashby)', deps: ['mat-1.2'], refs: ['Callister §6.5'],
          pic: 'Plot materials on log axes of modulus against density: classes form bubbles, and dragging a design-index line (E/ρ, E^(1/2)/ρ) picks out the best candidates for a light stiff tie or beam.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 2
    {
      n: 2,
      title: 'Point defects and diffusion in solids',
      summary: String.raw`Even a perfect-looking crystal contains vacancies in equilibrium numbers that grow exponentially with temperature, and these defects let atoms move. Solute atoms dissolve substitutionally or interstitially according to the Hume-Rothery rules. Fick's laws describe the resulting diffusion, an Arrhenius law gives its temperature dependence, and the Kirkendall effect proves that the vacancy mechanism is real.`,
      items: [
        { num: '2.1', kind: 'Proposition', name: 'Equilibrium vacancy concentration', deps: ['pchem-9.1', 'pchem-3.10'], refs: ['Callister §4.2'],
          pic: 'Balance the energy cost of vacancies against their configurational entropy: G(n) has a minimum at n/N = e^(−Q_v/kT), and the fraction of empty sites near melting reaches about one in ten thousand.' },
        { num: '2.2', kind: 'Definition', name: 'Frenkel and Schottky defects', deps: ['mat-2.1', 'xtal-1.9'], refs: ['Callister §12.5'],
          pic: 'In a rock-salt lattice, remove a cation–anion pair (Schottky) or push a cation into an interstitial site (Frenkel): charge neutrality is checked, and the two defect populations are computed against temperature.' },
        { num: '2.3', kind: 'Principle', name: 'Hume-Rothery rules for solid solutions', deps: ['xtal-1.9'], refs: ['Callister §4.3'],
          pic: 'Pick a solvent and solute: size mismatch, crystal structure, electronegativity and valence are compared, and the predicted solubility is set against the real phase diagram (Cu–Ni complete, Cu–Ag limited).' },
        { num: '2.4', kind: 'Concept', name: 'Interstitial solid solutions: carbon in iron', deps: ['xtal-1.7', 'mat-1.4'], refs: ['Callister §4.3'],
          pic: 'Fit a carbon atom into the octahedral holes of fcc and bcc iron: the larger fcc hole explains why austenite dissolves up to 2 % carbon while ferrite holds only 0.02 %.' },
        { num: '2.5', kind: 'Concept', name: 'Vacancy and interstitial diffusion mechanisms', deps: ['mat-2.1', 'mat-2.4'], refs: ['Callister §5.2'],
          pic: 'Animate atoms hopping into neighbouring vacancies and interstitials squeezing between sites: hop rates are drawn from Arrhenius probabilities, and interstitials are seen to move far faster.' },
        { num: '2.6', kind: 'Method', name: 'Fick’s laws in solids: erfc profiles and carburizing', deps: ['pchem-10.2', 'mat-2.5'], refs: ['Callister §5.3', 'Callister §5.4'],
          pic: 'Hold a steel surface at fixed carbon content: the concentration profile follows the error-function solution, and the case depth needed for a gear is found by adjusting time and temperature.' },
        { num: '2.7', kind: 'Law', name: 'Arrhenius temperature dependence of diffusivity', deps: ['mat-2.5', 'kin-2.1'], refs: ['Callister §5.5'],
          pic: 'Plot log D against 1/T for carbon in iron, copper in copper and dopants in silicon: straight lines whose slopes give activation energies, with interstitial diffusers having the shallowest slopes.' },
        { num: '2.8', kind: 'Proposition', name: 'Diffusion length √(Dt) and heat-treatment scaling', deps: ['mat-2.6', 'pchem-10.3'], refs: ['Callister §5.4'],
          pic: 'Pick a target diffusion distance and temperature: the required time is computed from x ≈ √(Dt), and raising the temperature by 100 K is shown to cut a week-long anneal to hours.' },
        { num: '2.9', kind: 'Phenomenon', name: 'Kirkendall effect', deps: ['mat-2.5'], refs: ['Callister §5.2'],
          pic: 'Join copper and brass with inert markers at the interface: zinc diffuses out faster than copper diffuses in, so the markers drift and voids appear on the zinc-rich side.' },
        { num: '2.10', kind: 'Phenomenon', name: 'Short-circuit diffusion along grain boundaries and surfaces', deps: ['mat-2.7'], refs: ['Callister §5.7'],
          pic: 'Compare diffusion through a grain interior, along a grain boundary and over a surface: the lower activation energies of the fast paths dominate at low temperature, visible as a kink in the effective Arrhenius plot.' },
        { num: '2.11', kind: 'Method', name: 'Dopant diffusion in silicon', deps: ['mat-2.6'], refs: ['Callister §5.6'],
          pic: 'Run a two-step pre-deposition and drive-in: a shallow erfc profile is converted into a deeper Gaussian, and the junction depth where dopant equals background concentration is read out.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 3
    {
      n: 3,
      title: 'Dislocations and plastic deformation',
      summary: String.raw`Perfect crystals should be thousands of times stronger than real metals; the discrepancy is explained by dislocations, line defects that let planes slip one row at a time. Their Burgers vectors, slip systems and resolved shear stresses decide when a crystal yields, their interactions harden it, and grain boundaries can be described as arrays of them.`,
      items: [
        { num: '3.1', kind: 'Paradox', name: 'Theoretical shear strength versus real strength', deps: ['mat-1.2'], refs: ['Callister §7.2'],
          pic: 'Slide one atomic plane rigidly over another: the computed shear stress peaks near G/30, while measured yield stresses of pure metals sit around G/10⁵ — a gap of three to four orders of magnitude that dislocations close.' },
        { num: '3.2', kind: 'Definition', name: 'Edge and screw dislocations', deps: ['xtal-1.1'], refs: ['Callister §4.5'],
          pic: 'Insert an extra half-plane into a 3D lattice or shear it along a cut: the edge and screw dislocation lines are traced, and the distorted region around the core is coloured by strain.' },
        { num: '3.3', kind: 'Definition', name: 'Burgers vector and the Burgers circuit', deps: ['mat-3.2'], refs: ['Callister §4.5'],
          pic: 'Walk a closed atom-to-atom loop around a dislocation: it fails to close, and the closure vector — perpendicular to the line for an edge, parallel for a screw — is drawn as b.' },
        { num: '3.4', kind: 'Concept', name: 'Slip systems', deps: ['mat-3.3', 'mat-1.6'], refs: ['Callister §7.4'],
          pic: 'Show the 12 {111}⟨110⟩ systems of fcc and the more numerous but less dense bcc systems: each lights up on a 3D crystal, explaining why fcc metals stay ductile and hcp magnesium is brittle.' },
        { num: '3.5', kind: 'Law', name: 'Schmid’s law and critical resolved shear stress', deps: ['mat-3.4'], refs: ['Callister §7.5'],
          pic: 'Rotate a single crystal under tension: the Schmid factor cos φ cos λ is computed for every slip system, and yielding begins on the system that first reaches the critical resolved shear stress.' },
        { num: '3.6', kind: 'Proposition', name: 'Dislocation strain energy ∝ Gb²', deps: ['mat-3.3'], refs: ['Callister §7.3'],
          pic: 'Integrate the elastic energy around an edge dislocation out to a cutoff radius: it grows logarithmically with size and quadratically with |b|, so a dislocation with 2b splits into two with b.' },
        { num: '3.7', kind: 'Phenomenon', name: 'Frank–Read source', deps: ['mat-3.6'], refs: ['Callister §7.3'],
          pic: 'Pin a dislocation segment at two points and raise the shear stress: it bows out, wraps around the pins and pinches off a loop, regenerating the segment to emit loop after loop.' },
        { num: '3.8', kind: 'Law', name: 'Taylor hardening: σ ∝ √ρ', deps: ['mat-3.7'], refs: ['Callister §7.10'],
          pic: 'Raise the dislocation density in a simulated 2D crystal: dislocations tangle and obstruct one another, and the flow stress needed to move them grows as the square root of their density.' },
        { num: '3.9', kind: 'Principle', name: 'Von Mises criterion: five independent slip systems', deps: ['mat-3.4'], refs: ['Callister §7.6'],
          pic: 'Force a polycrystal grain to change shape arbitrarily: the app counts independent slip systems and shows that fewer than five leaves some shape changes impossible, opening cracks at grain boundaries.' },
        { num: '3.10', kind: 'Model', name: 'Low-angle grain boundaries as dislocation arrays', deps: ['mat-3.3'], refs: ['Callister §4.6'],
          pic: 'Tilt two crystal halves by a small angle: a wall of edge dislocations with spacing b/θ appears at the boundary, and the boundary energy follows the Read–Shockley curve as θ grows.' },
        { num: '3.11', kind: 'Phenomenon', name: 'Deformation twinning', deps: ['mat-3.4', 'xtal-9.4'], refs: ['Callister §7.7'],
          pic: 'Shear a region of crystal so it becomes a mirror image across a twin plane: the twinned region tilts abruptly, and the shear is compared with slip at low temperature or high strain rate.' },
        { num: '3.12', kind: 'Concept', name: 'Partial dislocations and stacking faults', deps: ['mat-3.6', 'xtal-1.5'], refs: ['Callister §4.6'],
          pic: 'Split a full fcc dislocation into two Shockley partials: an ABCABC sequence is locally converted to hcp-like stacking between them, and the separation balances elastic repulsion against fault energy.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 4
    {
      n: 4,
      title: 'Mechanical properties and strengthening',
      summary: String.raw`The tensile test reads stiffness, yield strength, hardening, ultimate strength and ductility from one curve. Because yielding is dislocation motion, every strengthening mechanism impedes dislocations: grain boundaries (Hall–Petch), solute atoms, precipitates and other dislocations. Annealing reverses work hardening through recovery, recrystallization and grain growth.`,
      items: [
        { num: '4.1', kind: 'Concept', name: 'Engineering and true stress–strain curves', deps: ['mat-1.2'], refs: ['Callister §6.3', 'Callister §6.7'],
          pic: 'Pull a virtual tensile bar to fracture: the engineering curve peaks and falls as the bar necks, while the true-stress curve keeps rising, with both computed from the same simulated geometry.' },
        { num: '4.2', kind: 'Law', name: 'Hooke’s law and Poisson’s ratio', deps: ['mat-1.2'], refs: ['Callister §6.3', 'Callister §6.5'],
          pic: 'Stretch a block and watch it narrow: lateral strain is −ν times axial strain, with ν ≈ 0.3 for metals, 0.5 for rubber, and negative for a re-entrant honeycomb (auxetic) you can switch on.' },
        { num: '4.3', kind: 'Definition', name: 'Yield strength and the 0.2 % offset', deps: ['mat-4.1'], refs: ['Callister §6.6'],
          pic: 'On a smooth curve with no sharp yield point, slide a line parallel to the elastic slope offset by 0.2 % strain: its intersection defines the yield strength, and changing the offset changes the number.' },
        { num: '4.4', kind: 'Theorem', name: 'Considère criterion for necking', deps: ['mat-4.1'], refs: ['Callister §6.7'],
          pic: 'Plot true stress and its slope against true strain: necking begins exactly where dσ/dε falls to σ, marked live on the curve and on the deforming bar.' },
        { num: '4.5', kind: 'Law', name: 'Hollomon’s strain-hardening law', deps: ['mat-4.4'], refs: ['Callister §6.7'],
          pic: 'Fit σ = Kεⁿ to true-stress data on log axes: the slope n reads the hardening exponent and, by the Considère condition, equals the true strain at necking.' },
        { num: '4.6', kind: 'Law', name: 'Hall–Petch relation', deps: ['mat-3.10', 'mat-4.3'], refs: ['Callister §7.8'],
          pic: 'Refine the grain size with a slider: dislocations pile up against boundaries, the yield strength rises as σ₀ + k/√d, and measured data for steel are overlaid.' },
        { num: '4.7', kind: 'Paradox', name: 'Inverse Hall–Petch in nanocrystals', deps: ['mat-4.6'], refs: ['Callister §7.8'],
          pic: 'Keep shrinking grains below about 20 nm: grains become too small to hold pile-ups, grain-boundary sliding takes over, and the strength curve turns over instead of rising forever.' },
        { num: '4.8', kind: 'Model', name: 'Solid-solution strengthening', deps: ['mat-2.3', 'mat-3.6'], refs: ['Callister §7.9'],
          pic: 'Scatter solute atoms of adjustable size misfit in a slip plane: the dislocation line bows between them and needs extra stress to break free, rising roughly as the square root of concentration.' },
        { num: '4.9', kind: 'Model', name: 'Precipitation hardening and Orowan bypass', deps: ['mat-3.6', 'mat-4.8'], refs: ['Callister §11.10', 'Porter–Easterling ch. 5'],
          pic: 'Age an Al–Cu alloy: small precipitates are sheared, large ones are bypassed by looping, and the computed strength peaks at an intermediate size — then falls as overaging coarsens them.' },
        { num: '4.10', kind: 'Phenomenon', name: 'Recovery, recrystallization and grain growth', deps: ['mat-3.8', 'mat-2.7'], refs: ['Callister §7.11', 'Callister §7.12'],
          pic: 'Anneal a cold-worked metal in a Monte Carlo grain model: strain-free grains nucleate and consume the deformed ones, hardness drops, and then the grains coarsen with mean size growing as √t.' },
        { num: '4.11', kind: 'Method', name: 'Hardness testing and Tabor’s relation', deps: ['mat-4.3'], refs: ['Callister §6.10'],
          pic: 'Press Brinell, Vickers and Rockwell indenters into a material: the indent size gives hardness, and plotting it against tensile strength shows the rule of thumb H ≈ 3σ_y.' },
      ],
    },
    // ───────────────────────────────────────────────────────────── 5
    {
      n: 5,
      title: 'Fracture, fatigue and creep',
      summary: String.raw`Materials fail by cracks that grow, by repeated loading far below the yield stress, or by slow flow at high temperature. Griffith's energy balance and the stress-intensity factor explain why flaws control brittle strength and why that strength is statistical; S–N curves and the Paris law govern fatigue; and creep laws, Larson–Miller extrapolation and deformation-mechanism maps tell how long a hot component will last.`,
      items: [
        { num: '5.1', kind: 'Concept', name: 'Ductile versus brittle fracture', deps: ['mat-4.1'], refs: ['Callister §8.3', 'Callister §8.4'],
          pic: 'Break a bar of copper and a bar of glass in simulation: cup-and-cone fracture with large strain versus a flat cleavage surface with almost none, drawn with the stress–strain curves side by side.' },
        { num: '5.2', kind: 'Proposition', name: 'Stress concentration at holes and notches', deps: ['mat-4.2'], refs: ['Callister §8.5'],
          pic: 'Pull a plate containing an elliptical hole: the computed stress at the tip rises as 1 + 2a/b, reaching 3 for a circle and diverging as the ellipse flattens into a crack.' },
        { num: '5.3', kind: 'Theorem', name: 'Griffith criterion', deps: ['mat-5.2', 'pchem-4.10'], refs: ['Callister §8.5'],
          pic: 'Grow a crack in a stressed plate: released elastic energy rises as a², the new-surface cost as a, and beyond the critical length the energy curve tips downhill and the crack runs.' },
        { num: '5.4', kind: 'Definition', name: 'Stress intensity and fracture toughness K_IC', deps: ['mat-5.3'], refs: ['Callister §8.5', 'Callister §8.6'],
          pic: 'Choose a material and crack length: K = Yσ√(πa) is compared with K_IC, and a failure map shows which combinations of stress and flaw size are safe for steel, aluminium and glass.' },
        { num: '5.5', kind: 'Phenomenon', name: 'Ductile-to-brittle transition', deps: ['mat-5.1', 'mat-3.4'], refs: ['Callister §8.6'],
          pic: 'Run simulated Charpy tests across temperature for bcc steel and fcc aluminium: the steel’s absorbed energy collapses below a transition temperature — the failure of the Liberty ships — while aluminium’s does not.' },
        { num: '5.6', kind: 'Model', name: 'Weibull statistics of brittle strength', deps: ['mat-5.4'], refs: ['Callister §12.8'],
          pic: 'Break hundreds of ceramic bars with random flaw populations: failure strengths follow a Weibull distribution, and larger specimens are weaker because they are likelier to contain a big flaw.' },
        { num: '5.7', kind: 'Law', name: 'S–N curves and Basquin’s law', deps: ['mat-4.3'], refs: ['Callister §8.8'],
          pic: 'Cycle a specimen at different stress amplitudes: cycles to failure fall on a straight line on log axes, and steel shows a flat fatigue limit while aluminium keeps declining.' },
        { num: '5.8', kind: 'Law', name: 'Paris law for fatigue crack growth', deps: ['mat-5.4', 'mat-5.7'], refs: ['Callister §8.9'],
          pic: 'Grow a crack cycle by cycle with da/dN = C(ΔK)^m: crack length accelerates until K reaches K_IC, and integrating gives the remaining life for an inspection interval you choose.' },
        { num: '5.9', kind: 'Law', name: 'Miner’s rule of cumulative damage', deps: ['mat-5.7'], refs: ['Callister §8.10'],
          pic: 'Apply a load history mixing high and low amplitudes: damage fractions n/N add up toward 1, and reversing the order of loads shows where the linear rule over- or under-predicts.' },
        { num: '5.10', kind: 'Phenomenon', name: 'Creep: primary, secondary and tertiary', deps: ['mat-2.7'], refs: ['Callister §8.12'],
          pic: 'Hold a hot specimen at constant load: strain against time shows a decelerating, then steady, then accelerating stage, and raising the temperature or load shortens every stage.' },
        { num: '5.11', kind: 'Law', name: 'Power-law creep and the Larson–Miller parameter', deps: ['mat-5.10'], refs: ['Callister §8.13', 'Callister §8.14'],
          pic: 'Plot steady creep rate against stress on log axes for several temperatures: lines of slope n shifted by an Arrhenius factor, collapsed onto one master curve by the Larson–Miller parameter.' },
        { num: '5.12', kind: 'Method', name: 'Deformation-mechanism maps', deps: ['mat-5.11', 'mat-3.5'], refs: ['Callister §8.13'],
          pic: 'Drag a point over a stress–homologous-temperature map for nickel: regions of dislocation glide, power-law creep and diffusional creep are coloured with contours of strain rate, and grain size moves the boundaries.' },
      ],
    },
  ],
};
