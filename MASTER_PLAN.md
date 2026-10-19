# Master plan: from *Rudin, visualized* to an atlas of human knowledge

> **Status:** in progress (Phase 0 done, Phase 1 under way) · **Scope:** the whole project ·
> AUTHORING.md stays the rulebook for writing items and gets field-specific extensions (§7).
>
> **Revision 2.** The scope widened from STEM theorems to *the breadth of human knowledge*:
> six more fields (Earth & environment, medicine, economics, social sciences, arts, humanities),
> item kinds beyond theorems (concepts, phenomena, methods, paradoxes, inventions, events), and
> the working name *Ideas, Visualized*. The §11 decisions have been made (see there).

## 0. The one-paragraph version

Today the site covers one subfield, analysis: 1,062 results from Rudin's three books, each with
an interactive picture, all wired into one dependency graph. The goal is the same treatment for
**the load-bearing ideas of human knowledge**. That means theorems and laws, but also models,
mechanisms, phenomena, methods, paradoxes and inventions, across 13 fields: mathematics,
statistics, computer science, physics, chemistry, Earth & environment, biology, medicine,
engineering, economics, the social sciences, the arts, and the humanities. That comes to **85
collections and roughly 12,500 ideas**, still in **one graph**. A reader can follow a single
chain from the completeness of ℝ through the spectral theorem to the hydrogen spectrum, from
Fourier series to the sampling theorem to MRI, from the harmonic series to equal temperament, or
from simple machines to the printing press to the internet. We get there in four steps. First,
generalise the engine so that adding a field means adding a folder, with no code edits (Phase 0).
Next, test the new schema on five pilots from five different fields (Phase 1). Then sketch the whole atlas as a graph of planned results before
writing any of them (Phase 2). Finally, fill that skeleton in four breadth-first waves (Phases
3–6). Alongside the waves, build the connective tissue that only an atlas can offer: cross-field
*bridges*, prerequisite paths, a zoomable map, and proof steppers (Phase 7).

---

## 1. Where we are

### Progress (updated as work lands)

| phase | state |
|---|---|
| 0 · Engine | done: registry and schema v2, catalog split (index + lazy planned + per-collection shards), routes, field pages, OKLCH colours, map v2 with field regions and LOD, treemap overview, timeline, bridges, prerequisite planner, runtime numerics (incl. complex linear algebra, generalized eigenproblems, split-step Schrödinger, Nelder–Mead, safe formula parser) and 17 kits (incl. scene3, circuit, quantum, icons), CI, smoke and unit tests |
| 1 · Pilots | LADR complete (ch. 1–9, 365 items); mechanics ch. 1–11 (ch. 12 in production); algorithms ch. 1–7; microeconomics ch. 1–6; music ch. 1–4 |
| 2 · Skeleton | done for all 85 collections (≈ 11,700 planned items from real tables of contents and syllabi, sources in each file header); cross-listings reconcile duplicates (`scripts/crosslist.mjs`, `scripts/dupes.mjs`) |
| 3 · Wave A (first chapters) | written: stat (1–3), qm (1–3), thermo (1–2), psych (1–2), behav (1–2), neuro (1–2), sig (1–2), epi (1–2), phil (1–2), astro (1–2), climate, popgen, game, info, nt, macro, pchem, toc, em, ling, ode, ecol, ctrl, art, comb, waves, geol, physio, demo, soc, fin, rel, polsci, prob, top, geog, alg, logic, graph, tech, bighist · in production: deep, polsci 2, arch, and more (about 20 chapters at a time) |
| Wave 1 (breadth first) | **COMPLETE (2026-10-16): all collections have their opening chapter; fact-check clusters A–G done; 3,737 items, 272 smoke routes, 0 errors.** Definition was: every one of the 81 collections has at least its opening chapter written, interactive and checked, plus the landmark papers whose chapters exist; then a fact-check pass, runtime promotions (v.nn, stereo sound, Wigner/Husimi, frame solver) and a final verification. Deeper chapters resume in wave 2. |
| Wave 2 (second chapters) | **COMPLETE (2026-10-16): every collection has chapters 1 and 2 (gaps filled: fluid 1, mathbio 1, stoch 1); fact-check clusters A–F done.** 56 chapters, about 680 items, each run headless in light, dark and mode variants with 0 quality warnings; 4,446 items in 300 chapters, 272 smoke routes, 0 errors. The fact-check corrected real errors (a wrong Vasicek sign, a wrong reflection formula in the wave equation, one wrong Karp-tree edge, a mixed-up Tyndall table, a haemoglobin extinction table, Rb-87 decay-constant credit, Buri effective size) and retuned the climate column to 2.6 K per doubling at fixed relative humidity (paper: 2.36 K). Still unverifiable and flagged `verify: true`: Palacios-Huerta penalty-kick table (game 2.8), snakes-and-ladders layout (stoch 2.6), Ashcroft–Mermin Hall and Lorenz tables (cm 2.5, 2.6), von Klitzing accuracy (cm 2.14), Buri details, textbook chapter pointers in `refs`. Open syllabus corrections: popgen ch2 dropped four unrelated `stoch-14.*` deps. |
| Wave 3 (third chapters) | **COMPLETE (first pass):** the next unwritten chapter of every collection is written (5,515 items in 368 chapters; build, static check and 272-route smoke test all clean). Authors verified credits and constants while writing; unconfirmable claims are softened and flagged `verify: true`. **Verification follow-up (2026-10-16):** listed dependency/syllabus fixes reconciled; tech 4.1 now solves the thrust constraints and agrees with 0.10748 in the mean-radius convention; Buri series I/II mismatch corrected. Audio-generation and sampled pointer checks pass. **Still open:** full source review, automated audio checks and broader agent visual inspection; other flagged claims (the modern MRW/PWT inputs are now checked). Hall/Lorenz tables and transport model, game 2.8 sample and stoch 2.6 layout have been checked and corrected. See [verification report](docs/verification/waves-3-4.md). |
| Wave 4 (next chapter of each collection) | **COMPLETE (first pass):** the next unwritten chapter of every collection is written (6,684 items in 450 chapters; build, static check and 272-route smoke test clean). Same verification rule as wave 3; any item with an unconfirmed credit or constant should carry `verify: true`, the omitted uncertainty flags in climate 4, macro 4, circ 4 and energy 4 have now received a flagging pass (2026-10-16). About 6,890 planned items remain in later chapters (wave 5 = next unwritten chapter of each of the 80 collections). **Verification follow-up (2026-10-16):** ecology pictures, spin-down explanation/circulation, Ackeret primary reference and imaging Poisson dependency fixed; conditional climate-sensitivity probabilities and Malthusian balanced-growth claims corrected; solar-cell letter and temperature coefficient checked; AK paths now exact; 85 sound actions across 51 items and nine pointer/keyboard scenarios pass. **Still open:** 238 flagged source reviews in the chapter files touched during waves 3–4 (833 initially; 5 additional flags remain, 600 original flags resolved), automated audio checks and broader agent visual inspection. The modern MRW/PWT sample is now source-checked, 72 shared return averages corrected, and growth regressions independently reproduced. A further growth/development source audit resolves four items, corrects growth-accounting source data and averaging, and verifies the institutions replication (2026-10-17). The eight queued ODE reviews are now resolved against Teschl, with mathematical and visualization corrections plus exact-solution and browser regressions; see [ODE audit](docs/verification/ode-followup.md). Seven PDE separation/Fourier reviews are also resolved, with zero-mode, normalization, energy and historical-source corrections; see [PDE audit](docs/verification/pde-fourier-followup.md). The final two queued PDE heat reviews are resolved, correcting a false fixed-time growth claim and invalid numerical bounds, with independent arbitrary-precision evidence; see [heat audit](docs/verification/pde-heat-followup.md). The Gaussian and Lebesgue reviews are resolved, with corrected finite-measure hypotheses, analytic Darboux bounds and independent high-precision references; see [integration audit](docs/verification/vcalc-integrals-followup.md). The final two queued vector-calculus geometry reviews are resolved, with corrected Jacobian/centroid hypotheses, independent reference integrals and polygon-union volumes; see [geometry audit](docs/verification/vcalc-geometry-followup.md). The five queued algebra reviews are resolved against the pinned 2023 Judson edition, with source-based frequency data, exact Hill/RSA examples and corrected raw-RSA security demonstrations; see [algebra audit](docs/verification/algebra-followup.md). Eight representation-theory character reviews are resolved against Serre and Etingof, correcting zero-representation scope, inconclusive averaging, the conjugation preset and coefficient extents; see [character audit](docs/verification/representation-characters-followup.md). Three further representation-theory reviews resolve orbit counting, abelian characters and Frobenius–Schur indicators, with corrected dual-space reasoning, a C4 form-solver defect and a neighboring exterior-power formula; see [counting/type audit](docs/verification/representation-counting-followup.md). The two molecular-symmetry reviews are resolved against Dresselhaus and NIST geometry data, with corrected rigid-motion removal, ammonia geometry and operator-multiplet interpretation; see [molecular audit](docs/verification/representation-molecular-followup.md). The final representation-theory flag is resolved against both 1896 Frobenius originals, distinguishing the character construction from the companion determinant theorem and checking exact determinants; see [original-paper audit](docs/verification/representation-frobenius-followup.md). Four topology reviews resolve covers, total disconnectedness, uncountability and compactification against the specified Munkres edition, with corrected Cantor candidates, uniqueness and sequence visibility; see [topology foundations audit](docs/verification/topology-foundations-followup.md). Two further topology reviews correct the false open-disc boundary maximum, sampled continuity guarantees and clipped function/radius plots, supported by analytic bounds and 80-digit independent references; see [function audit](docs/verification/topology-functions-followup.md). The final two topology flags are resolved with analytic cover bounds, complete compactness counterexamples and honest finite-prefix illustrations; see [cover/equivalence audit](docs/verification/topology-covers-followup.md). The three manifold reviews are resolved with exact torus critical data, corrected Morse scope and explicit zero-time Lie derivatives, supported by independent flow calculations; see [manifold audit](docs/verification/manifolds-followup.md). The Fáry–Milnor review corrects the height-maxima proof and verifies three curve families against independent high-precision quadrature; see [knot audit](docs/verification/knot-curvature-followup.md). The final two differential-geometry reviews correct singular quadric rendering, boundary/transverse-ray conditions and false Klein-bottle parity claims; see [surface audit](docs/verification/dg-surfaces-followup.md). Five conditional-probability and martingale reviews are resolved with corrected finite-versus-exact claims, valid null-slice examples, independent Gaussian integrals and light/dark inputs; see [probability foundations audit](docs/verification/probability-foundations-followup.md). The parallel probability round resolves 23 more flags, with exact upcrossing/offspring calculations, corrected Doob and UI proofs, valid exchangeability and stopped-walk comparisons, and discrete arcsine checks; see [stopping audit](docs/verification/probability-stopping-followup.md), [convergence audit](docs/verification/probability-convergence-followup.md) and [exchangeability audit](docs/verification/probability-exchangeability-followup.md). All remaining 31 probability reviews are resolved, closing that collection’s queue with corrections to service-start queueing, recurrence/coupling proofs, stationary/censored-return examples and Durrett’s actual Harris split construction; see [Markov foundations](docs/verification/probability-markov-foundations-followup.md), [recurrence](docs/verification/probability-recurrence-followup.md), [stationary measures](docs/verification/probability-stationary-followup.md), [Harris chains](docs/verification/probability-harris-followup.md) and [birth/death analytical follow-up](docs/verification/probability-birth-death-followup.md). The next parallel round resolves all 46 graph flags, all five stochastic-process flags, all three combinatorics flags and four number-theory flags, correcting source hypotheses/proofs, finite certificates, censoring, periodicity and visible bounds; the combined suite has 261 passing tests and this round has 126 passing light/dark input groups. See [graph/coloring audits](docs/verification/graph-coloring-applications-followup.md), [stochastic sources](docs/verification/stochastic-processes-followup.md), [combinatorics](docs/verification/combinatorics-sources-followup.md) and [residues/reciprocity](docs/verification/number-theory-residues-followup.md). Ten more original flags are resolved in the [Gauss audit](docs/verification/number-theory-gauss-followup.md) and [numerical interpolation/minimax audit](docs/verification/numerical-sources-followup.md), closing the number-theory source queue with 14 independently rerun math groups and 20 light/dark input groups. Five logic reviews are also resolved with eleven independently rerun mathematical tests and fourteen light/dark input groups; the historical Gödel-paper review remains flagged for primary-text access. See [logic audit](docs/verification/logic-sources-followup.md). Two further LU/growth reviews correct missing nonsingularity, false intermediate factors, zero-pivot success and the original paper’s normalization; see [LU/growth audit](docs/verification/lu-growth-followup.md). Four factorization reviews and seven orthogonal/rational approximation reviews are also resolved, closing the numerical-analysis queue. This continuation resolves 28 original source flags, with 308 combined passing tests and 64 light/dark input groups. The 1947 inversion-paper and Gödel historical source flags remain pending. See [factorization audit](docs/verification/nla-factorization-followup.md) and [orthogonal/rational audit](docs/verification/numerical-orthogonal-rational-followup.md). A further 21 reviews resolve all optimization, statistics and machine-learning source flags and three information-theory flags, correcting certified optima, inference calibration, finite risk laws, randomized testing and exact prefix intervals. See [optimization](docs/verification/optimization-sources-followup.md), [inference](docs/verification/stat-inference-followup.md), [ML foundations](docs/verification/ml-foundations-followup.md), [Stein lemma](docs/verification/info-stein-followup.md) and [source coding](docs/verification/info-coding-followup.md). This batch has 343 combined passing tests, 42 light/dark interaction groups and 31 clean routes; deep learning, cryptography and the last information-theory review continue in parallel. Seven further reviews close the deep-learning and information-theory source queues and resolve two greedy-algorithm reviews; see [deep learning](docs/verification/deep-sources-followup.md), [prefix complexity](docs/verification/info-complexity-followup.md) and [greedy algorithms](docs/verification/algo-greedy-followup.md). At that checkpoint the combined suite had 372 passing tests; these seven reviews add 18 light/dark groups and the expanded route sweep passes 41 routes. A further parallel round resolves 21 original flags, closing the algorithm and cryptography source queues and correcting four causal-graph entries. Exact irrational-flow arithmetic, original 1956 planar-flow history, cipher reductions/controls, honest simplex termination, and collider/SCM/zero-event claims are checked; see [flow](docs/verification/flow-paths-followup.md), [cryptography](docs/verification/crypto-sources-followup.md), [LP](docs/verification/algo-lp-sources-followup.md) and [causal graphs](docs/verification/causal-graphs-followup.md). The combined suite passes 408 tests; this round adds 44 light/dark input groups and 67 routes pass. Causal interventions, automata and complexity reviews continue in parallel. The following 20 reviews close causal inference, complexity theory and distributed computing, with corrected positivity/identification and observational claims, original circuit proofs and actual gate counts, and faithful concurrency atomicity/liveness. See [causal interventions](docs/verification/causal-interventions-followup.md), [circuit complexity](docs/verification/cplx-circuits-followup.md) and [concurrency](docs/verification/distributed-concurrency-followup.md). The combined suite passes 440 tests; this round adds 42 light/dark groups and 91 routes pass. Automata, programming-language and computational-geometry reviews continue in parallel. A further 19 reviews close the automata and programming-language source queues and resolve four electrostatic-boundary reviews. Corrected finite versus universal claims, genuine normalization status, fixed-charge curves and image boundary conditions have 23 new independent math groups and 38 light/dark interaction groups. See [automata](docs/verification/toc-automata-followup.md), [programming languages](docs/verification/pl-reduction-followup.md) and [electrostatic images](docs/verification/em-electrostatics-followup.md). A further 32 original reviews close computational geometry, electromagnetism and waves, and resolve two angular-momentum and seven canonical-ensemble entries. Source-backed corrections cover geometry degeneracies, optical boundary/energy conventions, continuum conductor energy, rotation axes, complete real-harmonic projections and finite-bath tails. See [geometry](docs/verification/cg-geometry-followup.md), [wave interfaces](docs/verification/waves-interfaces-followup.md), [electromagnetic sources](docs/verification/em-boundary-sources-followup.md), [angular momentum](docs/verification/qm-angular-followup.md) and [canonical ensembles](docs/verification/thermo-canonical-followup.md). The combined suite passes 515 tests, this round adds 72 light/dark interaction/animation groups, and 156 routes pass. A further 28 original reviews close quantum mechanics, quantum information, relativity and thermodynamics, with corrected interference/CG conventions, explicit quantum-gate costs, source-faithful repeater/oracle/Trotter behavior, original Einstein/Compton/muon evidence and finite thermodynamic limits. See [spin coupling](docs/verification/qm-spin-coupling-followup.md), [gate universality](docs/verification/qinfo-gate-universality-followup.md), [quantum algorithms](docs/verification/qinfo-algorithm-sources-followup.md), [relativity](docs/verification/rel-source-audit-followup.md) and [thermodynamic limits](docs/verification/thermo-limits-followup.md). The combined suite passes 560 tests, this follow-up adds 62 light/dark input/animation groups, and 191 routes pass. The first two condensed-matter reviews also close with exact modulus/shell accounting and source-backed phonon dispersion; see [lattice audit](docs/verification/cm-source-audit-lattice-followup.md). That checkpoint passes 563 tests and 194 routes. A further18 original reviews correct chemical work/entropy and JANAF interpolation, phonon/polaron limits, tidal/escape conventions and rotating/unsteady fluid models; see [chemical potentials](docs/verification/pchem-source-audit-potentials-followup.md), [calorimetry](docs/verification/pchem-source-audit-calorimetry-followup.md), [phonons/polarons](docs/verification/cm-source-audit-phonons-followup.md), [tides/escape](docs/verification/astro-source-audit-tides-followup.md) and [fluid rotation/Bernoulli](docs/verification/fluid-rotation-bernoulli-followup.md). That subset passes600 tests and216 routes. Twelve further reviews correct finite-packet entropy and Pauling counting, optical/carrier/impurity models, the ring-confinement explanation and photometric conventions; see [entropy](docs/verification/pchem-source-audit-entropy-followup.md), [semiconductor carriers](docs/verification/cm-source-audit-carriers-followup.md), [rings](docs/verification/astro-source-audit-rings-followup.md) and [photometry](docs/verification/astro-source-audit-photometry-followup.md). This continuation closes30 original reviews with62 new mathematical groups and63 light/dark input/animation groups. That checkpoint passes625 tests and230 routes, with zero strict-build/static errors or warnings. A further30 original reviews close the physical-chemistry, astronomy, condensed-matter and crystallography source queues, with corrected potential-flow forces, phase/Kelvin models, stellar populations, semiconductor devices and crystal tensors/indices; see [fluid forces](docs/verification/fluid-forces-followup.md), [coexistence](docs/verification/pchem-source-audit-coexistence-followup.md), [stellar models](docs/verification/astro-source-audit-stellar-models-followup.md), [devices](docs/verification/cm-source-audit-devices-followup.md) and [crystal symmetry](docs/verification/xtal-source-audit-followup.md). This continuation adds56 mathematical groups and62 native light/dark groups;681 tests and263 routes pass. The following18 reviews close the fluid source queue and correct six reaction mechanisms, three variational models and five elastic/dislocation entries; see [fluid boundaries/inertia](docs/verification/fluid-boundaries-inertia-followup.md), [kinetics](docs/verification/kin-source-audit-mechanisms-followup.md), [variational methods](docs/verification/qchem-source-audit-variational-followup.md), [slip](docs/verification/mat-elastic-slip-followup.md) and [twinning/partials](docs/verification/mat-dislocation-microstructure-followup.md). The complete48-review continuation adds93 mathematical and98 native light/dark groups. That checkpoint:718 tests,285 routes, zero strict-build/static errors/warnings and a reconciled source ledger. Ten further original reviews close kinetics and correct molecular force/virial identities, finite dislocation hardening and tensile fitting; see [transition-state originals](docs/verification/kin-source-audit-transition-followup.md), [molecular identities](docs/verification/qchem-source-audit-identities-followup.md), [hardening](docs/verification/mat-hardening-followup.md) and [tensile fits](docs/verification/mat-tensile-fit-followup.md). This complete58-review continuation adds117 mathematical and118 native light/dark groups. That checkpoint:742 tests,296 routes, zero strict-build/static errors/warnings and a reconciled ledger. Four further dispersion/pair-potential and grain-strength reviews correct the London coefficient and attractive-tail integral, and certify pile-up roots/counts; see [dispersion](docs/verification/qchem-source-audit-dispersion-followup.md) and [grain strength](docs/verification/mat-grain-strength-followup.md). This complete62-review continuation adds129 mathematical and126 native light/dark groups. That checkpoint:754 tests,300 routes, zero strict-build/static errors/warnings and a reconciled ledger. A further23 source reviews resolve17 original and6 added flags, with corrections to Stark/degenerate theory, finite materials/hardness protocols, cyclone/Ekman transport, radiative climate, azimuthal projections and cooling lithosphere. The geophysical-fluid source queue closes; named Taylor/Mendeleev originals retain their uncertainty after supported partial corrections. See [cooling lithosphere](docs/verification/geol-cooling-followup.md), [radiative climate](docs/verification/climate-source-audit-radiative-followup.md), [azimuthal projections](docs/verification/geog-source-audit-azimuthal-followup.md) and the full report for all source evidence. This complete continuation resolves79 original and6 added flags, adds196 mathematical and180 native light/dark groups, and passes821 tests/331 routes with zero strict-build/static errors/warnings and a reconciled ledger. Seven further original reviews close geography and correct volcanic/droplet forcing, including the formerly biased equal-area global sample and false arbitrary-start Newton convergence. See [world maps](docs/verification/geog-source-audit-world-followup.md) and [volcanic/droplet forcing](docs/verification/climate-source-audit-forcing-followup.md). That checkpoint:838 tests/341 routes, zero strict-build/static errors/warnings and a reconciled ledger. This continuation resolves86 original and6 added flags with213 mathematical and196 native groups. Fifteen further source reviews close climate and correct continental heat-flow columns, normalized climate inference/polar stability, selection, original Kimura arithmetic, molecular-clock/diversity interpretation and original ecological experiments. See [continental columns](docs/verification/geol-continental-followup.md), [inference/polar response](docs/verification/climate-source-audit-inference-followup.md), [selection](docs/verification/popgen-selection-followup.md), [clock/diversity](docs/verification/popgen-clock-diversity-followup.md), [ecological originals](docs/verification/ecol-source-audit-historical-followup.md) and [plankton](docs/verification/ecol-source-audit-plankton-followup.md). Latest validation:879 tests/361 routes, zero strict-build/static errors/warnings and a reconciled ledger. This continuation resolves100 original and7 added flags with254 mathematical and230 native groups. Ten further original reviews close population genetics and correct age structure, actual genetic evidence, ecological feasibility and trait dynamics; see [age structure](docs/verification/mathbio-source-audit-age-followup.md), [moth counts](docs/verification/popgen-moth-followup.md), [resistance](docs/verification/popgen-resistance-followup.md) and [limiting similarity](docs/verification/ecol-source-audit-packing-followup.md). Latest validation:915 tests/372 routes, zero strict-build/static errors/warnings and a reconciled ledger. This continuation resolves110 original and7 added flags with290 mathematical and252 native groups. Six further original reviews correct spherical plate motion, the complete Vine–Matthews original, ecological lottery/forest dynamics and hybrid neural reset events. See [plate kinematics](docs/verification/geol-kinematics-followup.md), [magnetic original](docs/verification/geol-magnetic-original-followup.md), [forest](docs/verification/ecol-source-audit-forest-followup.md) and [neural events](docs/verification/neuro-izhikevich-followup.md). Melting corrections retain their unresolved coefficient flag. Latest validation:945 tests/382 routes, zero strict-build/static errors/warnings and a reconciled ledger. This continuation resolves116 original and7 added flags with320 mathematical and268 native groups. Eleven further original reviews close ecology and correct historical magnetic chronology, mantle numerical transport, resource geometry, local/global neuronal bifurcations and four swapped original feed-forward-loop labels. See [chronology](docs/verification/geol-magnetic-chronology-followup.md), [convection](docs/verification/geol-source-audit-convection-followup.md), [resources](docs/verification/ecol-source-audit-resources-followup.md), [Hopf](docs/verification/neuro-hopf-followup.md), [SNIC/ML](docs/verification/neuro-morris-lecar-followup.md) and [gene-network labels](docs/verification/sysbio-source-audit-ffl-followup.md). Latest validation:984 tests/394 routes, zero strict-build/static errors/warnings and a reconciled ledger. This continuation resolves127 original and7 added flags with359 mathematical and290 native groups. Seven further original reviews correct predator originals, gene timing and bursting; see [predator/Hopf](docs/verification/mathbio-source-audit-predator-followup.md), [arabinose](docs/verification/sysbio-source-audit-arabinose-followup.md), [bursting](docs/verification/neuro-bursting-followup.md) and [gene programs](docs/verification/sysbio-source-audit-programs-followup.md). Latest validation:1007 tests/402 routes, zero strict-build/static errors/warnings and a reconciled ledger. This continuation resolves134 original and7 added flags with382 mathematical and304 native groups. Eleven further original reviews close the systems-biology source queue and correct Lotka/Volterra, finite HH/Connor–Stevens models, lac/lambda/toggle switches and original Wegener/Bullard/paleomagnetic geometry. See [drift originals](docs/verification/geol-drift-original-followup.md), [paleomagnetism](docs/verification/geol-paleomag-followup.md), [predator laws](docs/verification/mathbio-source-audit-lotka-followup.md) and [toggle original](docs/verification/sysbio-source-audit-toggle-followup.md). Latest full checkpoint:1045tests/415routes, zero strict-build/static errors/warnings and a reconciled ledger. This continuation resolves145 original and7 added flags with420 mathematical and326 native groups. Eleven further original reviews correct channel transitions, passive networks, true compartment input/conduction, original competition proofs and exact hotspot drilling data. See [competition](docs/verification/mathbio-source-audit-competition-followup.md), [networks](docs/verification/circ-source-audit-networks-followup.md), [conduction](docs/verification/neuro-conduction-followup.md) and [hotspot sources](docs/verification/geol-hotspot-followup.md). Kolmogorov1936 receives a supported partial correction with its original flag retained. This continuation resolves156 original and7 added flags with461 mathematical and350 native groups. Latest full checkpoint1086tests/431routes, zero strict-build/static errors/warnings and a reconciled ledger. Five further original flags and one added uncertainty close bioinformatics and correct transistor models; see [BLAST/Markov](docs/verification/bioinf-source-audit-followup.md) and [device models](docs/verification/circ-source-audit-devices-followup.md). This continuation resolves161 original and8 added flags with475 mathematical and362 native groups. Latest full checkpoint1100tests/440routes, zero strict-build/static errors/warnings and a reconciled ledger. The final [myelin audit](docs/verification/neuro-myelin-followup.md) closes neuroscience with six further independent mathematical and two native groups, correcting hidden leak retuning, physical input and similarity/censoring claims. This continuation resolves162 original and8 added flags with481 mathematical and364 native groups. Last completed full checkpoint1100tests/440routes; six additional myelin groups pass separately. Remaining reviews continue with three agents and root. Automated audio and agent visual checks continue. Linguistics corpus trimming remains optional. See [verification report and full queue](docs/verification/waves-3-4.md). |
| Papers | 450 landmark papers across all 13 fields in the syllabi, every citation checked (Crossref, archive.org, PubMed…), each linked to the ideas it introduced; `#/papers` with live filter, era grouping and timeline; "First published in" on idea pages; 72 papers written as interactive items so far (reproducing the original numbers), more as their chapters land |
| Search | one index over written and planned ideas, papers (title, authors, year), fields, collections, chapters, bridges; operators (kind:, field:, col:, year:, by:, is:), facets, typo tolerance; results on the map and timeline |
| 7 · Connective tissue | **15 curated bridges** with 138 steps through 135 unique written ideas across 12 fields; all 41 planned-only steps in the previous walks replaced with available explanations. New walks: duality, stability, harmonic functions, causality, feedback, inverse problems and map distortion. Bridge-level shared pictures and shareable visualization states remain open. See [bridge audit](docs/verification/bridges-expansion.md). |

### Immediate next steps

1. Continue the Wave 3–4 source-review queue: **238 items remain**. The named modern PWT/MRW input audit is complete; its evidence and reproducible extraction are in `docs/verification/pwt-10.0.json` and `scripts/verify-pwt.py`.
2. Complete automated audio/input checks and agent screenshot inspection in light and dark themes. Human review, subjective listening and user approval are not required.
   Reconcile the existing cross-field prerequisite gate: [the inventory](docs/verification/cross-field-dependencies.md)
   finds 54 of64 non-math collections below25 published edges, with27 below25 even across
   planned chapters. Add connections only when the argument or model actually requires them.
   The home JSON gate passes. [All-node map measurements](docs/verification/map-performance.md)
   reach60fps during tested steady panning; rebuild/zoom and oversized-view performance
   remain separate from that result.
3. After the verification gate, begin **Wave 5: the next unwritten chapter in each of the 80 unfinished collections**, keeping the same breadth-first authoring, source review and reconciliation process. The [prepared production inventory](docs/wave-five.md) enumerates 1,031 new items and preserves two already written entries in those chapters; authoring has not started.

### Where we started


| | |
|---|---|
| Content | 3 collections (PMA 364, RCA 388, FA 310 items) · 45 chapters · 181 content modules · ~77k lines |
| Item kinds | 661 theorems, 56 corollaries, 35 lemmas, 24 propositions, 286 definitions; every non-definition has a `viz` |
| Engine | static SPA (`index.html`, `assets/js/app.js`, `graph.js`), viz runtime (`viz/core.js` 2D/3D stages, controls, TeX; `viz/math.js` numerics), build to `data/catalog.json` (737 KB), headless checker with screenshots |
| Pace | the full trilogy was produced in ~3 days of agent-driven work (Oct 12–14), then a numbering-verification pass |

**What is hard-wired to "three Rudin books"** (Phase 0 removes all of it):

- `scripts/lib.mjs:7` `BOOKS`, `:12` `KINDS`, `:13` `ID_RE = /^(pma|rca|fa)-…/`, `:14` `NUM_RE` (two-level only)
- `scripts/build.mjs:52` hand-written map `ROWS`; a single monolithic catalog
- `assets/js/app.js`: `BOOK_INFO`, `BOOK_SHORT`, `bookIdx`, `chapterLabel` (the RCA Prologue special case), search tokens `pma|rca|fa`, homepage copy
- `assets/js/graph.js`: `BOOK_VAR`, `BOOK_SHORT`, `renderFlow` defaulting to three columns, map filter checkboxes, per-book edge colours
- `assets/css/style.css:37–39, 151–153`: `--c-pma/rca/fa` and `[data-book=…]` rules
- `index.html`: brand, `<title>`, meta description, nav links, footer
- `scripts/check.mjs:33` `findBrowser` knows only macOS paths, not `PLAYWRIGHT_BROWSERS_PATH` or Linux

**Lessons from the trilogy build that shape this plan**

1. **Agents can produce at volume; verification is the bottleneck.** Seven of the last twenty
   commits are renumbering fixes ("checked against Google Books snippets"). New collections
   should prefer sources whose numbering we can actually check (open-access texts) or our own
   numbering.
2. **Unknown-id dependencies were tolerated and reconciled later.** That works for three books
   but not for fifty-nine. We need the planned ids to exist *before* authors cite them, hence the
   skeleton phase.
3. **The quality bar (AUTHORING §2) is what makes the site worth visiting.** Scaling 10× must
   not dilute it. Hence pilots before mass production, plus automated and reviewer gates.

---

## 2. Vision and principles

**Product.** *Ideas, Visualized*: an atlas of the load-bearing ideas of human knowledge. Each
idea gets a faithful statement, an interactive picture you can push on, the reason it is true or
the way it works, and its place in a single cross-field dependency graph. The Rudin trilogy becomes the **Analysis** shelf of the
Mathematics field and keeps its identity and URLs.

Principles:

1. **One graph.** Deps cross collection and field boundaries whenever a derivation really uses
   another result: Gauss's law ← divergence theorem; uncertainty principle ← Cauchy–Schwarz and
   the Fourier transform; Nyquist stability criterion ← argument principle (RCA 10). The
   cross-field edges are the product.
2. **Every result is testable on screen.** The AUTHORING §2 bar applies in every field. Each
   field translates "break a hypothesis" in its own way: in physics you leave the regime of
   validity, in CS you feed the adversarial input, in statistics you violate an assumption and
   watch coverage collapse, in engineering you push a gain past the stability boundary.
3. **Honest computation.** Simulations use integrators that respect the physics (symplectic for
   Hamiltonian systems), probability is shown with seeded samples next to the exact law, and
   algorithms really run on the reader's input.
4. **Measurable completeness.** Every collection has a published syllabus, so "done" is a
   number, not a feeling.
5. **Stable ids forever.** `pma-4.19` never changes. Curated collections never renumber, they
   only append.
6. **Static, fast, offline-friendly.** No server and no build step in the browser. The atlas
   must stay snappy at 10k nodes.

---

## 3. Information architecture

```
Field (13)         Mathematics · Statistics & Data Science · Computer Science · Physics & Astronomy
                   · Chemistry & Materials · Earth & Environment · Biology · Medicine & Health
                   · Engineering · Economics & Finance · Social & Behavioral Sciences
                   · Arts, Music & Design · Humanities
  └ Area           e.g. Mathematics → Analysis · Algebra · Geometry & Topology · Probability
                   · Discrete · Logic · Applied & Computational
      └ Collection e.g. pma, rca, fa · ladr · mech · algo      (a "book" generalised)
          └ Chapter
              └ Item  <collection>-<num>, e.g. pma-4.19, mech-5.3, algo-12.4, prob-2.4.1
```

**Two kinds of collection**

| type | numbering | completeness promise | when to use |
|---|---|---|---|
| **book-anchored** | follows the book (`prob-2.4.1` = Durrett Thm 2.4.1) | every numbered theorem/lemma/corollary/proposition + key definitions | a canonical, theorem-numbered text exists, **preferably open access** so numbers can be verified |
| **curated course** | our own syllabus, `chapter.n`, append-only | every result in the published syllabus | everywhere else, especially physics, chemistry, biology and engineering, where texts number equations, not results. Each item carries `refs` to 1–3 standard texts |

**Routes** (old ones redirect):

| route | page |
|---|---|
| `#/` | atlas home: field cards, cross-field flow, the longest chain in STEM, load-bearing results, featured bridges |
| `#/f/<field>` | field page: areas, collections, the flow between collections |
| `#/c/<col>` · `#/c/<col>/<ch>` | collection and chapter (replaces `#/book/…`, which redirects) |
| `#/t/<id>` | a result (unchanged) |
| `#/map` | atlas map with semantic zoom (field, then collection, chapter, result) |
| `#/bridge/<slug>` | a cross-field narrative (§8) |
| `#/path/<id>` | "everything you need for X": prerequisite planner (§8) |
| `#/status` | coverage dashboard: planned / written / reviewed / verified per collection |

---

## 4. Phase 0: the atlas engine (generalise, no new content)

**Acceptance test:** add a dummy collection `content/zzz/` with a `collection.js` and one
chapter. It shows up on the home page, field page, map, search and status with **zero code
edits**. The Rudin content renders exactly as before (same 1,062 items, same screenshots).

### 4.1 Registry, schema v2

```
content/fields.js            fields → areas: id, title, hue, blurb, order
content/<col>/collection.js  collection metadata (below)
content/<col>/syllabus.js    planned inventory (Phase 2), optional
content/<col>/chNN*.js       chapters, as today
content/bridges/<slug>.js    cross-field narratives (Phase 7)
```

```js
// content/mech/collection.js
export default {
  id: 'mech', short: 'MECH', title: 'Classical Mechanics',
  field: 'physics', area: 'mechanics', order: 10,
  source: { type: 'course', refs: ['Taylor, Classical Mechanics (2005)', 'Goldstein, Poole & Safko 3e', 'Arnold, Mathematical Methods of Classical Mechanics', 'Tong, Lectures on Classical Dynamics'] },
  // book-anchored: source: { type: 'book', author, title, edition, license, url }
  blurb: String.raw`…`,
  chapterLabels: {},            // e.g. rca: { 0: 'Prologue' }
  mapRows: null,                // optional split of a long collection into map rows, e.g. rca: [[0,9],[10,20]]
};
```

Item schema changes (all optional except `kind`):

| field | change |
|---|---|
| `kind` | add **Law, Principle, Postulate, Algorithm, Model, Concept, Phenomenon, Method, Paradox, Hypothesis, Invention, Event** to Theorem/Lemma/Corollary/Proposition/Definition |
| `num` | allow three-level (`2.4.1`) and lettered appendices (`A.3`): `^([A-Z]\|\d{1,2})(\.\d{1,3}){1,2}[a-z]?$` |
| `refs` | pointers into standard texts: `['Griffiths 4e §2.2.1', 'Feynman II-4']` |
| `scope` | regime of validity for laws and models ("non-relativistic, point masses"), rendered as a box |
| `credit` | discoverer and year ("Noether, 1918") |
| `links` | `{ wikipedia, mathlib, nlab }`: external cross-references; Mathlib names checked by script (stretch) |

Chapter files rename the key `book:` to `collection:` in one mechanical commit; ids are untouched.

### 4.2 Build and data

- `scripts/lib.mjs` loads the registry and derives `ID_RE` from it. Collection ids match
  `^[a-z][a-z0-9]{1,7}$`.
- **Split the catalog.** `data/index.json` holds the registry, chapters and light item records
  (id, num, kind, name, deps, see, x/y, stats, flags). `data/col/<id>.json` holds statements and
  tags, lazy-loaded for tooltips, search and pages. Budget: index ≤ 300 KB gzipped at 10k items.
- **Home transfer gate complete (2026-10-19).** `data/home.json` supplies all home summaries
  in 112,823 gzip bytes, with a build-enforced 300,000-byte ceiling. Native HTTP checks cover
  idle time, scrolling and empty search focus. The full index and search details load on demand;
  the separate standalone index-size target remains open. See [budget audit](docs/verification/home-json-budget-followup.md).
- Map layout generalised from the hard-coded `ROWS` (§4.4).
- Collection colours come from the registry. Each field has a hue family; its collections are
  OKLCH shades within it, with light and dark variants, emitted as CSS custom properties.
  `[data-book]` becomes `[data-col]`, with the colour set inline or in a generated stylesheet.
- Coverage statistics for `#/status` (planned/written/reviewed/verify-flagged).

### 4.3 App

- Nav: a **Fields** menu, plus Map, Bridges, About. The brand changes to *Theorems, Visualized*
  and the Analysis shelf keeps "Rudin" in its copy.
- Home: field cards with progress bars; a cross-field flow (fields as columns, chapters on
  hover); the longest chain across the atlas; load-bearing results per field; "new this week".
- Search: field and collection filters (`qm`, `physics:`), LaTeX-insensitive name matching,
  "uses:pma-4.19" queries.
- Theorem page: `refs`, `scope`, `credit` and `links` blocks. "Across the books" becomes
  **Across fields**.

### 4.4 Map v2 (semantic zoom)

The geographic-atlas metaphor: **fields are continents, collections countries, chapters
provinces, results towns.** Collections are placed by a layered layout of the
collection-to-collection dependency graph, with foundations on the left and applications on the
right, grouped into field regions. Inside a collection, the existing per-chapter column/barycentre
layout is reused. Rendering uses Canvas2D with level of detail: zoomed out, collections are blobs
with bundled edges; zoomed in, individual nodes and edges are culled to the viewport. If 10k nodes
and ~30k edges can't hold 60 fps, move to WebGL. Phase 2's ghost nodes give a full-size stress
test before the content exists.

### 4.5 Viz runtime: first additions (cheap, widely needed)

- Stage: `xlog`/`ylog` axes, polar axes, a colour-bar legend for `heat`, a histogram helper.
- `v.M`: FFT (1D/2D, complex and real); n×n linear algebra (LU with pivoting, QR, Jacobi
  symmetric eigen, QR-iteration eigen with complex eigenvalues, n×n SVD, least squares, matrix
  exponential); probability distributions (pdf/cdf/quantile/sample for normal, binomial,
  Poisson, exponential, gamma, beta, χ², t).
- Field kits come later and just in time (§6).

### 4.6 Tooling and CI

- `check.mjs`: targets by field and collection (`physics`, `mech/5`); `findBrowser` honours
  `PLAYWRIGHT_BROWSERS_PATH` and Linux paths; a `--changed` mode (git-diff based).
- New automatic gates in the harness: at least one control or handle (interactivity), a readout
  present, redraw time budget, no console errors, nothing drawn outside the canvas.
- `scripts/smoke.mjs`: every route renders without console errors (home, field, collection,
  chapter, theorem, map, status, bridge).
- A PR workflow running `build --strict`, `check --static`, smoke tests, and a headless run of
  changed chapters. Pages deploy stays on `main`.

---

## 5. The atlas: fields, collections, and what we visualize

Estimates are planning numbers. Anchors marked † are open-access or freely available, which
makes numbering verifiable; licences get confirmed before we commit to an anchor. **B** = book-anchored, **C** = curated
course with refs.

### 5.1 Mathematics (21 collections, ≈ 4,560 items; `game` moved to economics)

| id | collection | type · anchor / refs | est. | flagship visualizations | key cross-links |
|---|---|---|---|---|---|
| `pma` `rca` `fa` | Analysis (Rudin trilogy) | B · existing | 1,062 | (done) | everything |
| `ladr` | Linear algebra | B · Axler, *Linear Algebra Done Right* 4e† | 300 | span/dimension by dragging vectors; eigenvectors as invariant directions of a draggable map; Gram–Schmidt step by step; spectral theorem as ellipse axes; SVD as rotate-stretch-rotate; Jordan chains | FA 12, RCA 4, `qm`, `stat`, `mech` normal modes |
| `alg` | Abstract algebra | B · Judson, *Abstract Algebra: Theory and Applications*† | 250 | dihedral groups acting live; Cayley graphs; cosets colour the group (Lagrange); Sylow counting; Galois correspondence flipping the lattice; RSA from Euler's theorem | `nt`, `crypto`, `rep`, `xtal` |
| `rep` | Representation theory | C · Fulton–Harris, Serre | 100 | character tables; orthogonality as dot products; irreps of Dₙ on functions on a polygon; Fourier analysis on finite groups | `alg`, RCA 9, `qchem` symmetry |
| `top` | Topology | C · Munkres, Hatcher | 300 | gluing squares into torus, Klein bottle and ℝP²; cover games for compactness; Urysohn functions; loops deforming in π₁; path lifting in covering spaces; Brouwer via no-retraction | PMA 2, RCA 2, FA 1, `dg` |
| `dg` | Differential geometry of curves & surfaces | C · do Carmo, Pressley | 180 | Frenet frame riding a space curve; Gauss map; principal curvatures; Theorema Egregium (bend the surface, K stays); geodesics; Gauss–Bonnet angle sums | `mech`, `rel`, `mfd` |
| `mfd` | Manifolds & Riemannian geometry | C · Lee (smooth, Riemannian) | 150 | flows of vector fields; Lie bracket as an unclosed parallelogram; forms and Stokes; de Rham on the punctured plane; curvature; Hopf–Rinow | PMA 10, `rel`, `mech` (symplectic) |
| `vcalc` | Vector calculus | C · Marsden–Tromba, Schey *div grad curl* | 100 | div and curl as flux and circulation densities; live flux counters for Green, Stokes and divergence; path independence; Helmholtz decomposition | PMA 10, `em`, `fluid` |
| `ode` | ODEs & dynamical systems | B · Teschl, *ODEs and Dynamical Systems*† (or C: Hirsch–Smale–Devaney, Strogatz) | 220 | Picard iterates converging; Grönwall envelopes; phase portraits and Hartman–Grobman; Poincaré–Bendixson limit cycles; bifurcation diagrams; Lyapunov functions; Lorenz chaos | PMA 9 contraction, `mech`, `ctrl`, `mathbio`, `kin` |
| `pde` | Partial differential equations | C · Evans, Strauss | 180 | heat smoothing and the maximum principle; d'Alembert and domains of dependence; mean-value property; separation of variables; characteristics; CFL condition | PMA 8, RCA 9, FA 7–8, `em`, `fluid`, `qm` |
| `prob` | Probability | B · Durrett, *Probability: Theory and Examples* 5e† | 350 | running means (LLN); histograms converging to the bell curve (CLT); Borel–Cantelli; characteristic functions; random-walk recurrence in d = 1, 2, 3; martingale convergence; building Brownian motion | RCA 1–8 (deep), `stat`, `thermo`, `stoch` |
| `stoch` | Stochastic processes | C · Norris, Levin–Peres–Wilmer† | 200 | Markov chains mixing (TV-distance curves); Perron–Frobenius; coupling; hitting times; Poisson processes; queues and Little's law; Itô (pathwise) | `prob`, `algo`, `mathbio`, `kin` |
| `graph` | Graph theory | B · Diestel, *Graph Theory*† | 250 | Euler tours; Menger/max-flow on editable graphs; Hall's theorem via augmenting paths; planarity and Kuratowski; a playable R(3,3)=6; Turán graphs; giant component in random graphs | `algo`, `comb`, `circ`, `bioinf` |
| `comb` | Combinatorics | C · Stanley EC1, Aigner, Alon–Spencer | 180 | animated bijections; Catalan families; inclusion–exclusion; Pólya counting with necklaces; probabilistic method; Sperner/LYM | `graph`, `prob` |
| `nt` | Number theory | C · Hardy–Wright, Ireland–Rosen, Apostol | 200 | Euclid's algorithm as rectangle tiling; quadratic reciprocity by lattice points; Pell equations and continued fractions; Gauss circle problem; prime number theorem and zeta zeros | FA 9 (PNT), RCA 10, `alg`, `crypto` |
| `logic` | Logic & foundations | C · Enderton, Smullyan, Kunen | 120 | Cantor diagonal; ordinals as nested pictures; truth tables and completeness; compactness; a Gödel-numbering machine; Löwenheim–Skolem; Zorn/choice | `toc`, `pl`, RCA (maximality) |
| `num` | Numerical analysis | C · Süli–Mayers, Trefethen *ATAP* | 150 | Runge vs Chebyshev nodes; Newton basins; quadrature error rates on log–log axes; stability regions of ODE solvers; floating-point traps | PMA 7 (Weierstrass), `ode`, `nla` |
| `nla` | Numerical linear algebra | C · Trefethen–Bau | 120 | Householder QR step by step; conditioning as ellipse distortion; power iteration; CG convergence; SVD image compression | `ladr`, `ml`, `opt` |
| `opt` | Optimization | C · Boyd–Vandenberghe†, Nocedal–Wright | 150 | separating hyperplanes; gradient-descent trajectories and rates; KKT geometry; LP duality; simplex walking vertices; interior-point central path | FA 3 (Hahn–Banach), `ml`, `ctrl`, `game` |
| `game` | Game theory & social choice | C · Osborne, Maschler–Solan–Zamir | 80 | minimax via separation; Nash via Brouwer; Gale–Shapley stable matching; Shapley value; Arrow's impossibility; VCG mechanisms | `opt`, `top`, `graph` |

### 5.2 Statistics & data science (4 collections, ≈ 580)

| id | collection | type · refs | est. | flagship visualizations | cross-links |
|---|---|---|---|---|---|
| `stat` | Statistical inference | C · Casella–Berger, Wasserman | 200 | Cramér–Rao bound against estimator spread; Neyman–Pearson and ROC curves; CI coverage accumulating over 1,000 repeats; bootstrap; conjugate Bayesian updating; regression as projection | `prob`, `ladr`, `ml` |
| `ml` | Learning theory | B · Shalev-Shwartz & Ben-David† | 200 | VC shattering game; PAC sample complexity; no-free-lunch; perceptron convergence; SVM margins; kernels; boosting; SGD rates | `opt`, `stat`, `prob` |
| `deep` | Deep learning theory | C · Goodfellow et al., Prince *UDL*† | 100 | universal approximation by summed sigmoids; backprop as the chain rule on a graph; vanishing gradients; double descent; attention as soft lookup; convolution equivariance | `ml`, `opt`, `ladr` |
| `causal` | Causal inference | C · Pearl, Hernán–Robins† | 80 | d-separation on editable DAGs; back-door adjustment; Simpson's paradox; instruments; randomization | `stat`, `graph` |

### 5.3 Computer science (8 collections, ≈ 1,260)

| id | collection | type · refs | est. | flagship visualizations | cross-links |
|---|---|---|---|---|---|
| `algo` | Algorithms | C · CLRS 4e, Erickson† (CC BY), Kleinberg–Tardos | 300 | sorting with comparison counters against the decision-tree lower bound; recursion trees (master theorem); Dijkstra/Bellman–Ford/A*; MST cut property; max-flow min-cut; DP tables filling; potential-function amortization; FFT butterflies | `graph`, `opt`, `cplx`, RCA 9 |
| `toc` | Theory of computation | C · Sipser | 200 | DFA ↔ NFA ↔ regex conversions; pumping-lemma game; Myhill–Nerode classes; CFG parse trees; Turing machines running; undecidability diagonal; Rice; Cook–Levin | `logic`, `cplx` |
| `cplx` | Computational complexity | C · Arora–Barak† (draft) | 150 | reduction chains (3SAT → CLIQUE → …); hierarchy theorems; randomized classes; interactive proofs; PCP and hardness of approximation | `toc`, `algo`, `crypto` |
| `info` | Information & coding theory | C · Cover–Thomas, MacKay† | 180 | entropy and Huffman trees; Kraft inequality; typical sets (AEP); capacity; noisy-channel coding by simulation; Hamming codes and syndromes; rate–distortion | `prob`, `thermo`, `sig` |
| `crypto` | Cryptography | C · Katz–Lindell, Boneh–Shoup† | 150 | one-time pad perfect secrecy; Diffie–Hellman; RSA; elliptic-curve chord-and-tangent law; birthday bound; zero-knowledge 3-colouring; LWE lattices | `nt`, `alg`, `cplx` |
| `dist` | Distributed computing | C · Lynch, Attiya–Welch | 80 | Lamport and vector clocks; FLP bivalence; Paxos/Raft invariants step by step; Byzantine 3f+1; gossip spread | `graph`, `prob` |
| `pl` | Programming languages & types | C · Pierce *TAPL* | 100 | λ-reduction graphs; Church–Rosser diamonds; progress and preservation; Curry–Howard proof trees ↔ programs; Hindley–Milner unification | `logic`, `toc` |
| `cg` | Geometry & graphics | C · de Berg et al., Pharr–Jakob–Humphreys† | 100 | de Casteljau/Bézier; Voronoi/Delaunay empty circles; convex hull algorithms; aliasing; Monte Carlo rendering equation; quaternion rotations | `algo`, `sig`, `ladr` |

### 5.4 Physics & astronomy (10 collections, ≈ 1,580; `geo` moved to Earth & environment)

| id | collection | type · refs | est. | flagship visualizations | cross-links |
|---|---|---|---|---|---|
| `mech` | Classical mechanics | C · Taylor, Goldstein, Arnold, Tong† | 220 | Kepler orbits and the effective potential; Euler–Lagrange; Noether (drag a symmetry, watch the conserved quantity); normal modes; tumbling about the intermediate axis; Liouville (phase-space area conserved); Poincaré sections; double-pendulum chaos | `ode`, `ladr`, `vcalc`, `mfd` |
| `em` | Electromagnetism | C · Griffiths, Purcell, Feynman II† | 220 | field lines by superposition; Gauss's law with draggable surfaces; Laplace and the method of images; multipoles; Biot–Savart; Faraday induction; Maxwell to EM waves; Poynting theorem; radiation | `vcalc`, `pde`, RCA 11, `rel` |
| `waves` | Waves & optics | C · Hecht, Crawford | 120 | beats; standing waves; dispersion and group velocity; double slit; gratings; Fraunhofer diffraction as a Fourier transform; Snell from Fermat; polarization | `em`, `sig`, RCA 9 |
| `thermo` | Thermodynamics & statistical mechanics | C · Schroeder, Callen, Kardar, Tong† | 200 | Carnot cycles on PV diagrams; Boltzmann distribution from counting; equipartition; a kinetic-theory gas; Maxwell–Boltzmann speeds; Ising model by Metropolis with a phase transition; Planck's law; Legendre transforms | `prob`, `info`, `opt`, `pchem` |
| `qm` | Quantum mechanics | C · Griffiths, Sakurai, Hall | 250 | wave packets and dispersion; uncertainty as a Fourier pair; box and oscillator eigenstates; tunnelling; hydrogen orbitals; Bloch sphere; sequential Stern–Gerlach; perturbation theory; variational principle; Bell inequalities | `ladr`, FA 12–13, RCA 9, `waves` |
| `rel` | Special & general relativity | C · Taylor–Wheeler, Schutz, Carroll† | 150 | Minkowski diagrams with draggable boosts; twin paradox; four-momentum collisions; equivalence principle; Schwarzschild orbits and perihelion precession; light bending; GPS clocks; gravitational waves | `mech`, `em`, `dg`, `mfd` |
| `astro` | Astrophysics & celestial mechanics | C · Carroll–Ostlie, Murray–Dermott | 100 | Lagrange points; virial theorem; Jeans instability; hydrostatic equilibrium; Chandrasekhar limit; Saha equation; Friedmann expansion; Roche limit | `mech`, `thermo`, `rel` |
| `fluid` | Fluid dynamics | C · Acheson, Kundu | 120 | Bernoulli; Kelvin circulation; potential flow by conformal maps; Joukowski airfoil and Kutta–Joukowski lift; Reynolds number and Stokes flow; boundary layers; Kelvin–Helmholtz | `vcalc`, `pde`, **RCA 14 (conformal mapping)** |
| `cm` | Condensed matter | C · Ashcroft–Mermin, Kittel | 100 | reciprocal lattices; Bloch's theorem; tight-binding bands; Fermi surfaces; phonon dispersion; Drude model | `qm`, `xtal`, `ladr` |
| `qinfo` | Quantum information | C · Nielsen–Chuang | 100 | gates as Bloch-sphere rotations; CHSH violation; no-cloning; teleportation circuit; Deutsch–Jozsa; Grover as a rotation; Shor's period finding; bit-flip code | `qm`, `ladr`, `cplx`, `nt` |
| `geo` | Earth & climate physics | C · Vallis, Pierrehumbert | 80 | Coriolis and inertial circles; geostrophic balance; Ekman spiral; greenhouse layer model; Milankovitch cycles; Lorenz-63 | `fluid`, `thermo`, `ode` |

### 5.5 Chemistry (4 collections, ≈ 480)

| id | collection | type · refs | est. | flagship visualizations | cross-links |
|---|---|---|---|---|---|
| `pchem` | Physical chemistry: thermodynamics & equilibrium | C · Atkins, McQuarrie–Simon | 180 | van der Waals isotherms and the critical point; phase diagrams and Clausius–Clapeyron; ΔG and K; Le Chatelier; Raoult/Henry; Nernst equation; Gibbs phase rule | `thermo`, `kin` |
| `kin` | Chemical kinetics | C · Houston, Steinfeld | 100 | integrated rate laws; Arrhenius and Eyring; steady-state approximation; Lindemann; Michaelis–Menten; Brusselator/BZ oscillations; Gillespie vs mass-action | `ode`, `stoch`, `sysbio` |
| `qchem` | Quantum chemistry & spectroscopy | C · Szabo–Ostlund, McQuarrie | 120 | LCAO and H₂⁺ bonding/antibonding; Hückel π systems as eigenproblems; particle-in-a-box dyes; selection rules; rotational–vibrational spectra; Franck–Condon | `qm`, `ladr`, `rep` |
| `xtal` | Crystallography | C · Hammond, Giacovazzo | 80 | Bravais lattices; point and space groups; Miller indices; Bragg's law; Ewald sphere; diffraction as a Fourier transform; systematic absences; Penrose tilings | `alg`, `rep`, `waves`, `cm` |

### 5.6 Biology (5 collections, ≈ 530)

| id | collection | type · refs | est. | flagship visualizations | cross-links |
|---|---|---|---|---|---|
| `popgen` | Population genetics & evolution | C · Gillespie, Nielsen–Slatkin, Ewens | 120 | de Finetti diagram (Hardy–Weinberg); Wright–Fisher drift; Kimura fixation probability; Fisher's fundamental theorem; Price equation; coalescent trees; F_ST | `prob`, `stoch`, `ode` |
| `mathbio` | Mathematical biology | C · Murray, Edelstein-Keshet | 150 | Lotka–Volterra conserved quantity; competitive exclusion; SIR and the R₀ = 1 threshold; Turing patterns; Leslie matrices (Perron–Frobenius); Fisher–KPP waves; logistic-map period doubling | `ode`, `pde`, `ladr`, `stoch` |
| `neuro` | Computational neuroscience | C · Dayan–Abbott | 80 | Hodgkin–Huxley spikes; FitzHugh–Nagumo phase plane; cable equation; integrate-and-fire f–I curves; Oja's rule finds the principal component; Hopfield energy descent | `ode`, `pde`, `deep`, `ladr` |
| `bioinf` | Bioinformatics algorithms | C · Durbin et al., Compeau–Pevzner | 100 | Needleman–Wunsch/Smith–Waterman tables; Karlin–Altschul statistics; Viterbi gene finding; neighbour-joining and Felsenstein pruning; de Bruijn assembly as Euler paths; BWT | `algo`, `graph`, `stoch` |
| `sysbio` | Systems biology | C · Alon | 80 | Hill functions; toggle-switch bistability; repressilator; feed-forward loops; perfect adaptation via integral feedback; expression noise | `ode`, `kin`, `ctrl` |

### 5.7 Engineering (5 collections, ≈ 630)

| id | collection | type · refs | est. | flagship visualizations | cross-links |
|---|---|---|---|---|---|
| `sig` | Signals & systems | C · Oppenheim–Willsky, Lathi | 180 | convolution by dragging the flipped kernel; sampling theorem and aliasing; DFT/FFT; Laplace and Z-transform pole–zero plots; Butterworth filters; windowing; Parseval; modulation | PMA 8, RCA 9, **FA 6–7 (distributions)**, `ctrl`, `info` |
| `ctrl` | Control theory | C · Åström–Murray†, Franklin–Powell | 150 | PID tuning on a live plant; root locus; Bode plots and the **Nyquist criterion from the argument principle**; Routh–Hurwitz; controllability (Kalman rank); pole placement; LQR; Kalman filter | `ode`, `ladr`, RCA 10, `sig` |
| `circ` | Circuits | C · Agarwal–Lang, Horowitz–Hill | 100 | Kirchhoff's laws solved live on an editable circuit; Thévenin/Norton; maximum power transfer; RLC transients and resonance; phasors; Tellegen's theorem; matrix-tree theorem | `graph`, `ode`, `sig` |
| `solid` | Solid mechanics & structures | C · Gere, Timoshenko | 120 | Mohr's circle as an eigenproblem; beam bending; Euler buckling; torsion; Castigliano; trusses by joints; Griffith fracture; FEM in one dimension | `ladr`, `pde`, `mech` |
| `robot` | Robotics | C · Lynch–Park, *Modern Robotics*† | 80 | SE(3) transforms; forward and inverse kinematics; Jacobian singularities; manipulability ellipsoids (SVD); configuration space and RRT | `ladr`, `mfd`, `ctrl` |

### 5.8 Earth & environment (4 collections, ≈ 360)

| id | collection | refs | est. | flagship visualizations |
|---|---|---|---|---|
| `geol` | Geology & geophysics | Turcotte–Schubert; Stein–Wysession | 100 | plates rotating about Euler poles on a globe; isostasy; radiometric decay chains and isochrons; seismic rays bending through the layered Earth; Gutenberg–Richter statistics; magnetic stripes from reversals |
| `geo` | Atmosphere & ocean dynamics (moved from physics) | Vallis; Pierrehumbert | 80 | Coriolis and inertial circles; geostrophic balance; the Ekman spiral; Rossby waves; Lorenz-63 |
| `climate` | Climate science | Pierrehumbert; Archer; IPCC AR6 WG1 | 100 | energy-balance models with ice–albedo bistability (snowball Earth); the greenhouse layer model; forcing and feedback sliders; Milankovitch cycles; a carbon-cycle box model |
| `geog` | Geography & cartography | Snyder (USGS); Haggett | 80 | map projections with Tissot ellipses (← Theorema Egregium: no flat map is perfect); great circles vs rhumb lines; central places as hexagons; gravity models; Zipf's law of cities |

### 5.9 Medicine & health (4 collections, ≈ 360)

| id | collection | refs | est. | flagship visualizations |
|---|---|---|---|---|
| `physio` | Human physiology | Guyton–Hall; Keener–Sneyd | 120 | pressure–volume loops of the heart (Frank–Starling); Poiseuille flow in vessels; the oxygen–hemoglobin curve and its shifts; the Windkessel model; Nernst/GHK membrane potentials; glucose–insulin feedback |
| `pharm` | Pharmacology | Rowland–Tozer; Goodman & Gilman | 80 | one- and two-compartment kinetics; repeated dosing and accumulation to steady state; dose–response curves and the therapeutic window; receptor occupancy |
| `epi` | Epidemiology & evidence | Rothman; Gordis | 100 | base rates and the positive predictive value of a test; ROC curves; confounding and Simpson's paradox; Kaplan–Meier curves; herd immunity threshold 1 − 1/R₀ |
| `imaging` | Medical imaging | Prince–Links; Kak–Slaney | 60 | CT reconstruction: sinograms, back-projection and filtered back-projection (← Fourier slice theorem); MRI k-space; ultrasound Doppler |

### 5.10 Economics & finance (5 collections, ≈ 550)

| id | collection | refs | est. | flagship visualizations |
|---|---|---|---|---|
| `micro` | Microeconomics | Varian; Mankiw; CORE Econ | 160 | draggable supply and demand with taxes, price controls and shaded deadweight loss; indifference maps and pivoting budget lines; income and substitution effects; the Edgeworth box and the welfare theorems; Cournot/Bertrand; the market for lemons |
| `macro` | Macroeconomics | Mankiw; Romer; CORE Econ | 120 | the Solow model converging to steady state; the Keynesian multiplier; IS–LM and AD–AS shifts; the Taylor rule; the quantity theory |
| `fin` | Finance | Luenberger; Hull | 120 | compounding and present value; the efficient frontier and CAPM line; option payoffs and put–call parity; binomial trees converging to Black–Scholes (← heat equation); the Kelly criterion |
| `behav` | Behavioral economics & decisions | Kahneman; Wilkinson–Klaes | 80 | the St Petersburg paradox; risk aversion as concavity (Jensen); prospect-theory value and weighting functions; Allais; hyperbolic vs exponential discounting |
| `game` | Game theory & social choice (moved from math) | Osborne; Maschler–Solan–Zamir | 80 | as in §5.1 |

### 5.11 Social & behavioral sciences (4 collections, ≈ 430)

| id | collection | refs | est. | flagship visualizations |
|---|---|---|---|---|
| `psych` | Psychology & perception | Gescheider; Macmillan–Creelman; Goldstein | 150 | Weber–Fechner and Stevens laws you can test on yourself; signal detection (d′, criteria, ROC); Hick's and Fitts's laws with live timing; the Ebbinghaus forgetting curve and spacing; Rescorla–Wagner learning; illusions and lateral inhibition (Mach bands) |
| `soc` | Networks & collective behavior | Easley–Kleinberg; Schelling; Newman | 100 | Schelling segregation from mild preferences; Granovetter thresholds and cascades; small worlds (Watts–Strogatz); preferential attachment and power laws; the Bass diffusion model |
| `polsci` | Political science & social choice | Taylor–Pacelli; Saari | 100 | one electorate, five voting methods, five winners; Condorcet cycles; Arrow; the median voter; apportionment paradoxes; gerrymandering and the efficiency gap; Banzhaf power |
| `demo` | Demography | Preston–Heuveline–Guillot; Keyfitz–Caswell | 80 | life tables and life expectancy; population pyramids and momentum; stable populations (← Perron–Frobenius); the demographic transition |

### 5.12 Arts, music & design (3 collections, ≈ 350)

| id | collection | refs | est. | flagship visualizations |
|---|---|---|---|---|
| `music` | Music theory & acoustics | Benson; Tymoczko; Sethares; Loy | 150 | standing waves and the harmonic series, with sound; beats and roughness; dissonance curves that change with timbre; Pythagorean and syntonic commas; 12-EDO from continued fractions of log₂(3/2); the pitch-class clock and maximal evenness; the Tonnetz; Euclidean rhythms |
| `art` | Visual art & colour | Kemp; Livingstone; Fairchild; Conway et al. | 120 | linear perspective with draggable vanishing points; anamorphosis; additive vs subtractive colour; CIE chromaticity; simultaneous contrast; the 17 wallpaper groups; halftoning and dithering |
| `arch` | Architecture & structural form | Allen–Zalewski; Heyman | 80 | the hanging chain inverted into an arch (Hooke, Gaudí); thrust lines in masonry; domes; trusses; Sabine reverberation |

### 5.13 Humanities (4 collections, ≈ 470)

| id | collection | refs | est. | flagship visualizations |
|---|---|---|---|---|
| `ling` | Linguistics | Fromkin et al.; Ladefoged; Jurafsky–Martin | 120 | the vowel space from formants; Zipf's and Heaps' laws on real text; syntax trees and recursion; Grimm's law as sound change; language family trees (← phylogenetics) |
| `phil` | Philosophy & reasoning | Sainsbury; Resnik; SEP | 120 | Zeno's paradoxes and convergent series (← PMA 3); the sorites and fuzzy boundaries; Newcomb and the two envelopes; Bayesian confirmation and the raven paradox; Sleeping Beauty; the veil of ignorance as maximin |
| `tech` | History of technology | Cardwell; Usher; Mokyr | 150 | **the tech tree as a dependency graph**: simple machines → water wheel → clockwork escapement → printing press → steam engine (Watt's governor) → telegraph → radio → transistor → laser → GPS (trilateration) → internet (packet routing); each invention shown working, with deps into the physics that explains it |
| `bighist` | Big history & quantitative history | Christian; Clark; Turchin–Nefedov | 80 | deep time on a log axis; farming spreading as a wave of advance (← Fisher–KPP); the Malthusian trap and the escape from it; plague as SIR; secular cycles |

Also added: `mat` Materials science (chemistry, ≈ 100), `ecol` Ecology (biology, ≈ 100),
`aero` Aerospace engineering and `energy` Energy systems (engineering, ≈ 80 each).

**Totals:** 85 collections (3 existing + 82 new) across 13 fields · ≈ 11,400 new items · **≈ 12,500 overall**.

---

## 6. Viz kits (runtime extensions, built just in time)

Content never imports anything; kits hang off `v` (`v.graph(...)`, `v.steps(...)`) and are
documented in AUTHORING with a demo page in `tools/kits.html`. Each kit ships with the first wave
that needs it and is frozen (additive changes only) once a collection depends on it.

| kit | provides | first needed by |
|---|---|---|
| core additions | log/polar axes, colour bars, histograms; FFT; n×n linear algebra; distributions | Phase 0 |
| `graph` | node-link drawing, directed/weighted, layouts (force, layered, circular, tree, grid), editable (add, drag, delete), highlight paths, cuts and matchings | `algo`, `graph`, `toc`, `stoch`, `causal`, `bioinf`, `circ` |
| `steps` | timeline of precomputed states with step, back and scrub controls, plus a pseudo-code panel with the active line | `algo`, proofs, `nla`, `toc`, `dist` |
| `table` | matrices and tables with highlighted or editable cells | DP tables, Cayley tables, truth tables, transition matrices, character tables |
| `sim` | Verlet/leapfrog/symplectic Euler, RK45, implicit Euler; particle systems; energy-drift readout; Gillespie SSA | `mech`, `thermo`, `astro`, `kin`, `popgen` |
| `grid` | 1D/2D finite differences (heat, wave, advection, reaction–diffusion); split-step Fourier Schrödinger | `pde`, `qm`, `mathbio`, `em` |
| `fields` | field lines and streamlines in 2D/3D, equipotentials, flux through a draggable surface | `vcalc`, `em`, `fluid` |
| `freq` | Bode, Nyquist, root locus, pole–zero plots | `sig`, `ctrl`, `circ` |
| `circuit` | schematic symbols on a grid plus an MNA solver (DC/AC/transient) | `circ`, `ctrl` |
| `mol` | ball-and-stick (3D), MO/energy-level diagrams, orbital slices | `qchem`, `xtal`, `pchem` |
| `automata` | DFA/NFA/PDA/TM on `graph`, plus a tape renderer | `toc`, `cplx` |
| `quantum` | qubit state, Bloch sphere, circuit diagram simulator (≤ 6 qubits) | `qm`, `qinfo` |
| `nt` | BigInt modpow, egcd, sieve, Pollard ρ, continued fractions, elliptic-curve arithmetic | `nt`, `alg`, `crypto` |
| `lattice` | lattices, reciprocal lattices, symmetry operations, tilings | `xtal`, `cm`, `alg` |
| `units` | SI formatting with prefixes; CODATA constants; dimension check in readouts | all physical sciences |

---

## 6b. Visualizing everything

The rule is simple: **no idea without a picture you can push on, and no part of the atlas you
cannot see at a glance.**

**Every kind of idea has a visual grammar.**

| kind | the picture shows | the reader tests it by |
|---|---|---|
| Theorem / Lemma / Corollary | the hypotheses and the conclusion on a concrete instance | breaking a hypothesis and watching the conclusion fail |
| Law / Principle / Postulate | a simulation obeying the law, with the predicted vs measured quantity read out | leaving the regime of validity |
| Model | the model's state and its key output curve | moving the parameters across thresholds |
| Algorithm | the algorithm running step by step on editable input, invariant and operation counter live | editing the input, stepping, feeding adversarial cases |
| Concept / Definition | the defining picture, examples and non-examples side by side | toggling between examples and non-examples |
| Phenomenon / Paradox | the effect produced live (and heard, for sound) | changing the conditions that create or dissolve it |
| Method | the method applied to a problem, before and after | swapping problems and watching it succeed or fail |
| Invention / Event | the device working, or the historical dynamic quantitatively | operating the mechanism; sliding the parameters of history |

**Kits cover the fields** (the runtime gives every viz the same look and behaviour):

| kit | fields it serves |
|---|---|
| core stages, handles, sliders, 3D, TeX; log/polar axes, histograms, colour bars | everything |
| numerics (FFT, n×n linear algebra, distributions, symplectic and adaptive integrators, Gillespie, units, number theory) | mathematics, physics, chemistry, biology, statistics, engineering |
| `graph`, `steps`, `table` | algorithms, graph theory, automata, Markov chains, causal DAGs, DP, Cayley tables, payoff matrices |
| `phasePlane`, `fields` | ODEs, mechanics, ecology, neuroscience, kinetics, control; vector calculus, electromagnetism, fluids |
| `quantum`, `mol`, `circuit` | quantum mechanics and computing; chemistry and spectroscopy; circuits and electronics |
| `globe`, `timeline`, `agents`, `curves`, `tree` | geography, geology, climate; history and deep time; social and ecological simulations; economics; phylogenetics, linguistics, syntax |
| `sound` (audio) | music, acoustics, hearing, signals |

**Automated gates** (scripts/check.mjs): runtime errors, blank canvases, TeX errors, and
*quality warnings* for a static picture (no control, handle, drag, click or hover) or a missing
live readout. Screenshots in light, dark and every mode are reviewed per chapter.

**Seeing the whole atlas:**

- *Everything at a glance*: a zoomable treemap of fields → collections → chapters (area ∝ ideas,
  solid = written, pale = planned) on the home and field pages.
- *The map*: every idea as a node in one graph, field regions shelf-packed; semantic zoom with
  bundled collection-to-collection edges when far out, individual edges and labels when close;
  hover lights up ancestry and descendants; planned ideas as ghost nodes.
- *Flows*: how chapters and collections feed one another (home, field and collection pages).
- *Lineage*: on every page, the prerequisites a chosen number of steps back.
- *Timeline* (next): every idea with a `credit` year placed on a zoomable log/linear timeline,
  from Euclid to CRISPR.
- *Bridges* and *paths* (§8): curated cross-field walks and computed prerequisite plans.

## 7. Authoring at scale

### 7.1 Field guides (extend AUTHORING.md)

`docs/fields/<field>.md`, one per field, each with: what counts as a dependency, the kinds used,
notation conventions, how "break a hypothesis" translates, the colour semantics, which kits to
reach for, and three exemplary items. Highlights:

- **Physics / chemistry.** Every Law, Principle and Model states its `scope`. Readouts carry
  units. Simulations show their conserved quantities (energy drift < 0.1%). The "break it" mode
  leaves the regime: large-angle pendulum, relativistic speeds, real gas near its critical point.
- **CS.** Algorithms run on input the reader can edit (drag the graph, shuffle the array). The
  readout shows the invariant being maintained and an operation counter against the proven
  bound. Lower bounds show the adversary or the decision tree.
- **Statistics.** Simulation verifies theory: seeded samples, the empirical law beside the exact
  one, a **Resample** button, coverage that accumulates over repeats.
- **Biology / engineering.** Parameter sliders that cross thresholds (R₀ = 1, the Turing
  instability, a gain margin). Stochastic and deterministic versions side by side.

### 7.2 The production line (per collection)

1. **Syllabus** (Phase 2): inventory of `num, kind, name, deps, refs, pic`, reviewed first. This
   is where structural correctness lives, so it is **researched, not recalled**: tables of
   contents of the references, two or three university course syllabi, lists of named results,
   and encyclopedia entries are compared; facts and refs are verified; the sources are recorded
   in the file (docs/syllabus.md, "Research first"). A separate research audit per field checks
   coverage against those sources before chapters are written.
2. **Brief**: `collection.js`, chapter summaries, notation, shared helpers, the kits needed, and
   a *variety plan* so neighbouring items don't look alike.
3. **Authoring**: parallel agents, one part file (8–12 items) each, following AUTHORING and the
   field guide.
4. **Automated gates**: `build --strict`, static check, headless run with light, dark and
   all-modes screenshots, the new harness gates (§4.6).
5. **Review**: an independent reviewer agent per chapter. It checks statements against `refs`,
   verifies computational honesty, scores the AUTHORING §2 rubric from screenshots, and loops
   fixes until each item passes.
6. **Reconcile**: zero unknown deps into written collections; `see` links; bridge updates.
7. **Ship**: one PR per collection, with CI green and a "new" line on the home page.

When we execute, each wave is a natural fit for an orchestrated multi-agent workflow (fan out
authoring by part, then a reviewer agent per chapter). Proceed autonomously after each verification gate, committing in reviewable steps.

### 7.3 Gates at the end of each wave

- 0 build errors; 0 unknown deps pointing into written collections.
- 100% of non-definition items have a passing `viz`.
- Every non-math collection has ≥ 25 cross-field deps; every touched bridge updated.
- Agent visual inspection and automated native-input/audio checks, with findings fed back into the field guide.
- The map holds 60 fps with all written and planned nodes; the home page loads ≤ 300 KB of JSON
  (gzipped).

---

## 8. Phase 7: connective tissue (runs alongside the waves)

These are features only an atlas can have, and the main reason to build one.

1. **Bridges**: 15+ curated cross-field narratives, each an ordered walk through existing items
   with connecting prose and a "same picture, many guises" viz:
   - *Fourier*: PMA 8 → RCA 9 → FA 7 → sampling theorem → uncertainty principle → X-ray diffraction → MRI → JPEG
   - *Spectral theorem*: LADR → FA 12 → QM observables → normal modes → PCA → PageRank/Perron–Frobenius → Markov mixing
   - *Fixed points*: Banach → Picard–Lindelöf → Brouwer → Nash → Bellman value iteration
   - *Convexity and duality*: Hahn–Banach → separating hyperplanes → LP duality → max-flow min-cut → SVM → Legendre transforms in thermodynamics
   - *Least action*: Euler–Lagrange → Fermat's principle → geodesics → Noether → path integrals
   - *Entropy*: Boltzmann → Shannon → KL divergence → maximum entropy → Landauer
   - *Diffusion*: random walks → Brownian motion → heat equation → Fick → Fisher–KPP → MCMC
   - *Stability*: Lyapunov → Routh–Hurwitz → Nyquist → Turing instability → CFL
   - *Harmonic functions*: RCA 11 → electrostatics → potential flow → conformal maps → airfoils
   - *Symmetry*: groups → representations → crystallography → selection rules → conservation laws
2. **Prerequisite planner** (`#/path/<id>`): the ancestor closure of any result, topologically
   sorted and collapsible by chapter, with "I know this" marks stored per browser, which show
   the frontier of what to learn next.
3. **Proof steppers** for ~100 flagship results: `v.steps` drives the viz through the proof idea
   (cover with balls → extract a finite subcover → take the minimum radius).
4. **Shareable states and embeds**: control and handle state encoded in the URL
   (`#/t/mech-5.3?s=…`), plus `?embed=1` for course pages and slides.
   **Implemented (2026-10-19):** runtime controls, native2D handles, Stage3D camera,
   proof step and paused clock round trip; custom edited data has an explicit opt-in API
   and visible coverage limits. Malformed or outdated states restore fresh defaults.
   See [implementation and native evidence](docs/verification/shareable-state-followup.md).
5. **Status dashboard** (`#/status`): coverage, review state, verify flags, unknown deps, kit usage.
6. **External cross-references**: Wikipedia for everything; Mathlib declaration names for math
   items where they exist (checked by script); Feynman Lectures and OpenStax for physics.
7. **Stretch**: offline PWA; keyboard-operable handles and text alternatives for every viz;
   translations.

---

## 9. Roadmap

Breadth-first: after Wave A every field has a shelf, and foundations land before the
collections that depend on them.

| phase | contents | new items | exit criterion |
|---|---|---|---|
| **0 · Engine** | registry, schema v2, catalog split, routes, field pages, colours, map v2 groundwork, core runtime additions, CI and smoke tests | 0 | dummy collection appears with zero code edits; Rudin unchanged |
| **1 · Pilots** | `ladr` (math, book-anchored), `mech` (physics), `algo` (CS), `micro` (economics), `music` (arts) + kits `graph`, `steps`, `table`, audio, numerics + the first field guides | ≈ 1,100 | schema and kit APIs frozen; pilot retrospective folded into AUTHORING |
| **2 · Skeleton** | syllabi for all 80 remaining collections (≈ 10,000 planned entries with deps); ghost nodes on the map; `#/status`; map v2 at full scale | (planned) | every planned id exists; the planned graph is acyclic; each field's syllabus reviewed |
| **3 · Wave A**: every field gets a shelf | `vcalc`, `ode`, `prob`, `em`, `qm`, `thermo`, `toc`, `info`, `stat`, `sig`, `mathbio`, `pchem`, `climate`, `epi`, `macro`, `psych`, `art`, `tech` + kits `grid`, `fields`, `freq`, `automata` | ≈ 3,000 | all 13 fields live; first bridges (Fourier, Spectral, Entropy, Diffusion) |
| **4 · Wave B**: core curriculum | `alg`, `graph`, `nla`, `num`, `opt`, `stoch`, `waves`, `ml`, `ctrl`, `kin`, `popgen`, `qchem`, `circ`, `fin`, `behav`, `physio`, `pharm`, `soc`, `polsci`, `ling`, `phil` + kits `circuit`, `mol`, `nt` | ≈ 2,900 | prerequisite planner; bridges (Fixed points, Duality, Stability) |
| **5 · Wave C**: depth | `top`, `dg`, `mfd`, `pde`, `nt`, `comb`, `logic`, `rep`, `game`, `rel`, `fluid`, `crypto`, `cplx`, `solid`, `geol`, `geog`, `ecol`, `demo`, `arch`, `bighist` | ≈ 2,800 | proof steppers for the first 50 flagships; bridges (Least action, Harmonic, Symmetry) |
| **6 · Wave D**: frontiers & crossovers | `astro`, `cm`, `qinfo`, `geo`, `deep`, `causal`, `dist`, `pl`, `cg`, `neuro`, `bioinf`, `sysbio`, `xtal`, `robot`, `mat`, `aero`, `energy`, `imaging` + kits `quantum`, `lattice` | ≈ 1,700 | ≈ 12,500 items; 15+ bridges; 100 proof steppers |
| **7 · Connective tissue** | runs alongside 3–6 (§8) | — | — |

**Effort, roughly.** The trilogy, about 1,000 items, took around three days of agent-driven
production. At that rate the new content alone is a few weeks of production time. With the
review loops and reconciliation this plan adds, expect two to three times that. Phases 0–2
are worth doing carefully, because every later item inherits their decisions.

---

## 10. Risks and mitigations

| risk | mitigation |
|---|---|
| Quality dilution at 10× volume | pilots first; harness gates; a reviewer agent per chapter; automated audio/input and agent visual checks; field guides with exemplars |
| Wrong statements in the empirical sciences (dropped assumptions, wrong regimes) | mandatory `scope` for laws and models; `refs` on every curated item; reviewer checks against refs; `verify: true` remains the honest flag |
| Numbering-verification sink (as with Rudin) | open-access anchors only, or curated numbering; append-only ids |
| Copyright | the paraphrase rule as today; never transcribe; no copied figures; open licences respected (attribution in `collection.js`) |
| Dependency semantics drifting between fields | a written definition of "dep" per field guide; syllabus review fixes structure before authoring |
| Performance at 10k nodes / 30k edges | catalog sharding; level-of-detail map; WebGL fallback; tested early on Phase 2 ghost nodes |
| Kit sprawl / API churn | kits are frozen once used, demo pages act as tests, content never imports |
| Scope creep | every collection is independently shippable; waves have exit criteria; Wave D can be trimmed without harming anything earlier |

---

## 11. Decisions (taken)

1. **Name:** *Ideas, Visualized*. "Theorems" was too narrow once the scope became the breadth of
   human knowledge; the Rudin trilogy stays a named shelf with its original URLs.
2. **Anchor policy:** open-access book anchors where a canonical numbered free text exists
   (`ladr`, `alg`, `prob`, `graph`, `ml`); curated syllabi with refs everywhere else.
3. **Order:** breadth-first. Five pilots in five fields, then Wave A gives every one of the 13
   fields a shelf.
4. **Planned items:** visible as faded ghost nodes on the map, on chapter pages ("On the
   syllabus") and on `#/status`; each has its own page showing its place in the graph.
5. **Git flow:** work on a feature branch (`claude/stem-atlas`) with CI checks; merge to `main`
   (which deploys) once a phase is green.
6. **Scope:** all of §5, including game theory, earth and climate, robotics, and the six non-STEM
   fields (§5.8–5.13).
