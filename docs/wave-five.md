# Wave 5 production inventory

Prepared, **not started**. This inventory selects the earliest chapter with planned items in each unfinished collection. Existing items in partially written chapters are preserved.

80 collections; 1031 new items; 2 items already written in those chapters. The [machine-readable plan](wave-five-plan.json) includes every item, source reference, picture brief and dependency classified as written, within the chapter, elsewhere in this wave, later, or unknown. Later prerequisites are visible authoring/reconciliation work, not silently treated as already available.

The source queue currently has **185 pending reviews**. User review and subjective listening are not required. Start authoring only after the source and automated verification gates in [MASTER_PLAN §7.3](../MASTER_PLAN.md#73-gates-at-the-end-of-each-wave) are satisfied. This plan does not claim that those gates have passed.

Regenerate with `npm run wave5:plan`. Syllabi remain authoritative; verify exact sources and hypotheses before authoring, keep dependencies acyclic, and review, reconcile and commit each collection separately.

| Collection | Next chapter | New items | Already written | Later prerequisite IDs |
|---|---|---:|---:|---:|
| ode | 5 · Flows, invariant sets and Lyapunov stability | 18 | 0 | 1 |
| pde | 5 · Laplace’s equation and harmonic functions | 16 | 0 | 5 |
| vcalc | 5 · Line integrals and conservative fields | 10 | 0 | 0 |
| alg | 8 · Algebraic Coding Theory | 28 | 0 | 0 |
| rep | 5 · The group algebra, Fourier analysis and integrality | 14 | 0 | 0 |
| top | 5 · Countability and separation axioms | 15 | 0 | 1 |
| dg | 5 · The first fundamental form | 10 | 0 | 0 |
| mfd | 5 · Lie groups | 11 | 0 | 1 |
| prob | 6 · Ergodic Theorems | 17 | 0 | 0 |
| stoch | 5 · Coupling and mixing times | 12 | 0 | 0 |
| graph | 6 · Flows | 26 | 0 | 0 |
| comb | 5 · Catalan numbers and lattice paths | 14 | 0 | 0 |
| nt | 5 · Sums of squares and Diophantine equations | 18 | 0 | 2 |
| logic | 7 · Arithmetic and Gödel’s incompleteness theorems | 13 | 0 | 2 |
| num | 5 · Piecewise polynomials and numerical differentiation | 10 | 0 | 0 |
| nla | 5 · Eigenvalue problems: what can be computed | 12 | 0 | 0 |
| opt | 5 · Lagrange duality and the KKT conditions | 16 | 0 | 0 |
| stat | 9 · The bootstrap and resampling | 13 | 0 | 1 |
| ml | 5 · The Bias–Complexity Tradeoff | 4 | 0 | 0 |
| deep | 6 · Generalization and regularization | 17 | 0 | 4 |
| causal | 5 · Adjusting for confounding in observational studies | 14 | 0 | 5 |
| algo | 12 · Randomized, online and streaming algorithms | 23 | 0 | 0 |
| toc | 5 · Context-free grammars | 16 | 0 | 1 |
| cplx | 5 · Randomized computation | 13 | 0 | 2 |
| info | 5 · Channel capacity | 17 | 1 | 0 |
| crypto | 5 · Message integrity and hash functions | 17 | 0 | 0 |
| dist | 5 · Consensus and its impossibility | 15 | 0 | 1 |
| pl | 5 · Data, recursion and effects | 12 | 0 | 1 |
| cg | 5 · Voronoi diagrams and Delaunay triangulations | 14 | 0 | 1 |
| em | 5 · Electric fields in matter | 15 | 0 | 0 |
| waves | 5 · Geometrical optics | 17 | 0 | 0 |
| thermo | 7 · Kinetic theory and transport | 21 | 0 | 5 |
| qm | 8 · Three dimensions and the hydrogen atom | 15 | 0 | 0 |
| cm | 5 · Magnetic order and correlated electrons | 5 | 0 | 6 |
| qinfo | 5 · Query algorithms and quantum search | 9 | 0 | 1 |
| rel | 5 · Fields and matter in special relativity | 10 | 0 | 6 |
| astro | 5 · Radiative transfer and stellar atmospheres | 9 | 0 | 0 |
| fluid | 5 · Aerofoils and lift | 8 | 0 | 0 |
| pchem | 5 · Mixtures and solutions | 17 | 0 | 0 |
| kin | 5 · Reactions in solution and at electrodes | 11 | 0 | 5 |
| qchem | 5 · The chemical bond in diatomic molecules | 13 | 0 | 2 |
| xtal | 5 · The reciprocal lattice | 6 | 0 | 0 |
| mat | 5 · Fracture, fatigue and creep | 10 | 0 | 2 |
| geol | 5 · Gravity, isostasy and flexure | 7 | 0 | 3 |
| geo | 5 · Vorticity and potential vorticity | 9 | 0 | 1 |
| climate | 5 · Energy-balance models, bistability and tipping points | 10 | 0 | 4 |
| geog | 7 · Scale, generalization and representation | 8 | 0 | 0 |
| popgen | 5 · Mutation, migration and load | 8 | 0 | 0 |
| mathbio | 5 · Biochemical kinetics | 13 | 0 | 4 |
| ecol | 5 · Predation, parasitism and mutualism | 12 | 0 | 1 |
| neuro | 5 · Synapses and integrate-and-fire neurons | 11 | 0 | 0 |
| bioinf | 5 · Phylogenetic trees: distances and parsimony | 14 | 0 | 1 |
| sysbio | 5 · Biological oscillators | 6 | 1 | 3 |
| physio | 5 · Respiration and gas exchange | 13 | 0 | 0 |
| pharm | 5 · Nonlinear kinetics, metabolism and interactions | 10 | 0 | 1 |
| epi | 5 · Study designs | 10 | 0 | 0 |
| imaging | 5 · Ultrasound | 12 | 0 | 2 |
| sig | 5 · The continuous-time Fourier transform | 18 | 0 | 0 |
| ctrl | 5 · PID control | 13 | 0 | 0 |
| circ | 5 · Capacitors, inductors and first-order transients | 14 | 0 | 2 |
| energy | 5 · Wind, water, heat and biomass | 12 | 0 | 4 |
| solid | 5 · Torsion | 10 | 0 | 0 |
| robot | 5 · Inverse kinematics | 6 | 0 | 0 |
| aero | 5 · Aircraft performance | 10 | 0 | 0 |
| micro | 11 · Factor markets and time | 13 | 0 | 0 |
| macro | 5 · Money and inflation | 10 | 0 | 0 |
| fin | 6 · Arbitrage, forwards and capital structure | 11 | 0 | 0 |
| game | 5 · Repeated games and cooperation | 10 | 0 | 0 |
| behav | 6 · Social preferences and behavioral games | 9 | 0 | 1 |
| psych | 5 · Colour vision | 9 | 0 | 1 |
| soc | 5 · Diffusion, cascades and contagion | 18 | 0 | 5 |
| polsci | 6 · Electoral systems and party systems | 10 | 0 | 0 |
| demo | 5 · Age structure and projection | 11 | 0 | 1 |
| music | 9 · Harmony and the geometry of chords | 23 | 0 | 0 |
| art | 5 · Perceptual colour spaces and colour order | 9 | 0 | 0 |
| arch | 5 · Beams, columns and trusses | 15 | 0 | 6 |
| ling | 5 · Syntax: the structure of sentences | 16 | 0 | 3 |
| phil | 5 · Decision theory and its puzzles | 16 | 0 | 1 |
| tech | 6 · Lenses, printing and gunpowder | 12 | 0 | 1 |
| bighist | 5 · Farming and the first states | 12 | 0 | 3 |
