# Wave 6 production inventory

**In progress**, explicitly started 2026-10-22T10:26:01.661Z.

The previous saved wave was explicitly marked complete and all its frozen items were present in actual content. This does not authorize automatic advancement or certify independent acceptance of the current wave.

**Checkpoint scope:** the inventory below records the last accepted export. The expansion branch additionally contains 46 author-verified ideas pending separate peer acceptance: [REP 6, 12 ideas](verification/wave6-rep.md), [TOP 6, 17 ideas](verification/wave6-top.md) and [DG 6, 17 ideas](verification/wave6-dg.md). The frozen assignments and accepted checkpoint remain unchanged.

The last accepted export contains 36/1057 frozen new items; 1021 remain outside that checkpoint. The expansion branch contains 82 of the frozen new items, including its 46 pending ideas. Written counts describe availability, not review acceptance. The [machine-readable inventory](wave-6-plan.json) freezes chapter assignments and identities, including completed chapters. Refresh preserves these assignments. Syllabi remain authoritative for researched source/dependency corrections; preserve source flags and access restrictions.

Run `node scripts/plan-content-wave.mjs --wave 6` to refresh. Only an explicit `--start` changes prepared to in-progress. Completion must be recorded by root after independent chapter and wave gates; this CLI has no completion switch.

| Collection | Frozen chapter | New items | Preserved items | Later prerequisites at planning |
|---|---|---:|---:|---:|
| ode | 6 · Linearization and phase-plane analysis | 17 | 0 | 2 |
| pde | 6 · Waves in space | 10 | 0 | 1 |
| vcalc | 6 · Surfaces and surface integrals | 10 | 0 | 0 |
| alg | 9 · Isomorphisms | 17 | 0 | 0 |
| rep | 6 · Induced representations | 12 | 0 | 0 |
| top | 6 · Urysohn, Tietze, Tychonoff and metrization | 17 | 0 | 2 |
| dg | 6 · The Gauss map and curvature | 17 | 0 | 0 |
| mfd | 6 · Differential forms and Stokes’s theorem | 20 | 0 | 0 |
| prob | 7 · Brownian Motion | 43 | 0 | 0 |
| stoch | 6 · Card shuffling and spectral gaps | 15 | 0 | 0 |
| graph | 7 · Extremal Graph Theory | 38 | 0 | 0 |
| comb | 6 · Integer partitions | 11 | 0 | 0 |
| nt | 6 · Farey fractions, continued fractions and Pell’s equation | 15 | 0 | 0 |
| logic | 8 · Axiomatic set theory | 11 | 0 | 1 |
| num | 6 · Numerical integration | 13 | 0 | 1 |
| nla | 6 · Eigenvalue algorithms | 16 | 0 | 0 |
| opt | 6 · Linear programming and the simplex method | 11 | 0 | 0 |
| stat | 10 · Bayesian inference | 21 | 0 | 2 |
| ml | 6 · The VC-Dimension | 16 | 0 | 0 |
| deep | 7 · Infinite width: Gaussian processes and kernels | 10 | 0 | 0 |
| causal | 6 · Instruments, bounds and natural experiments | 12 | 0 | 3 |
| algo | 13 · String algorithms | 13 | 0 | 0 |
| toc | 6 · Pushdown automata and the limits of context-free languages | 14 | 0 | 0 |
| cplx | 6 · Interactive proofs | 11 | 0 | 2 |
| info | 6 · Continuous sources and the Gaussian channel | 9 | 0 | 0 |
| crypto | 6 · One-way functions and the foundations | 12 | 0 | 4 |
| dist | 6 · Byzantine agreement | 10 | 0 | 1 |
| pl | 6 · Subtyping and objects | 11 | 0 | 0 |
| cg | 6 · Geometric search structures | 8 | 0 | 0 |
| em | 6 · Electric current | 15 | 0 | 0 |
| waves | 6 · Interference and coherence | 17 | 0 | 1 |
| thermo | 8 · Quantum statistics | 16 | 0 | 4 |
| qm | 9 · Symmetries and conservation laws | 13 | 0 | 0 |
| cm | 6 · Superconductivity | 14 | 0 | 4 |
| qinfo | 6 · The quantum Fourier transform and Shor’s algorithm | 12 | 0 | 0 |
| rel | 6 · The equivalence principle | 13 | 0 | 0 |
| astro | 6 · Stellar structure and energy | 14 | 0 | 1 |
| fluid | 6 · Viscous flow and the Navier–Stokes equations | 13 | 1 | 0 |
| pchem | 6 · Phase diagrams of mixtures | 12 | 0 | 0 |
| kin | 6 · Catalysis and enzyme kinetics | 12 | 0 | 2 |
| qchem | 6 · Bonding in polyatomic molecules | 18 | 0 | 0 |
| xtal | 6 · Diffraction geometry | 13 | 0 | 1 |
| mat | 6 · Phase diagrams of alloys | 10 | 0 | 2 |
| geol | 6 · Stress, rheology and faulting | 8 | 0 | 1 |
| geo | 6 · Waves in rotating, stratified fluids | 7 | 0 | 3 |
| climate | 6 · The ocean, transient warming and sea level | 9 | 0 | 1 |
| geog | 8 · Spatial analysis | 8 | 0 | 0 |
| popgen | 6 · Selection and drift together | 13 | 0 | 1 |
| mathbio | 6 · Oscillators, switches and excitability | 11 | 0 | 5 |
| ecol | 6 · Food webs and community stability | 14 | 0 | 0 |
| neuro | 6 · Spike trains and neural coding | 17 | 0 | 2 |
| bioinf | 6 · Probabilistic phylogenetics | 9 | 0 | 2 |
| sysbio | 6 · Proofreading and robust signalling | 8 | 0 | 1 |
| physio | 6 · Oxygen transport and blood | 15 | 0 | 0 |
| pharm | 6 · Pharmacodynamics: receptors and dose–response | 16 | 0 | 0 |
| epi | 6 · Bias | 6 | 0 | 0 |
| imaging | 6 · Magnetic resonance imaging | 16 | 0 | 4 |
| sig | 6 · Frequency response and filtering | 13 | 0 | 1 |
| ctrl | 6 · Routh–Hurwitz and the root locus | 13 | 0 | 0 |
| circ | 6 · Second-order circuits | 8 | 0 | 0 |
| energy | 6 · Storage | 12 | 0 | 4 |
| solid | 6 · Beams: internal forces and bending stresses | 12 | 0 | 0 |
| robot | 6 · Dynamics | 9 | 0 | 0 |
| aero | 6 · Stability and control | 11 | 0 | 2 |
| micro | 12 · Externalities, public goods and the commons | 16 | 0 | 0 |
| macro | 6 · The open economy in the long run | 7 | 0 | 0 |
| fin | 7 · Options: payoffs and parity | 9 | 1 | 0 |
| game | 6 · Evolution, learning and congestion | 12 | 0 | 0 |
| behav | 7 · Well-being and the two selves | 8 | 0 | 0 |
| psych | 6 · Organization, depth and size | 17 | 0 | 0 |
| soc | 6 · Conformity, opinion dynamics and synchrony | 8 | 0 | 2 |
| polsci | 7 · Weighted voting and power | 11 | 0 | 2 |
| demo | 6 · Stable and stationary populations | 12 | 0 | 0 |
| music | 10 · Rhythm and meter | 13 | 0 | 0 |
| art | 6 · Contrast, constancy and colour appearance | 14 | 0 | 0 |
| arch | 6 · Shells, membranes and form-finding | 11 | 0 | 1 |
| ling | 6 · Meaning: semantics and pragmatics | 16 | 0 | 1 |
| phil | 6 · Bayesian epistemology | 11 | 0 | 0 |
| tech | 7 · Steam, iron and the Industrial Revolution | 14 | 0 | 0 |
| bighist | 6 · The Malthusian world | 11 | 0 | 3 |
