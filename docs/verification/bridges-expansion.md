# Bridge expansion and source-grounding audit

Audit date: 2026-10-19. Agent inspection; no human-review gate is closed by this report.

The inventory now has **15 distinct curated bridges**, comprising **138 ordered steps through 135 unique written ideas across 12 fields**. Every step has connecting prose, a written statement, an interactive visualization and a book anchor, explicit reference or original-paper metadata. No bridge step points to a planned-only item or an alias.

## Inventory

| Route slug | Change | Written steps | Fields |
|---|---|---:|---|
| action | Repaired | 8 | math, physics |
| causality | New | 9 | social, med, stats |
| contagion | Repaired | 7 | bio, math, social |
| diffusion | Repaired | 8 | math, med |
| duality | New | 8 | math, cs, econ, physics |
| entropy | Repaired | 13 | physics, cs, stats |
| feedback | New | 10 | eng, med, bio |
| fixed-points | Repaired | 10 | math, econ, cs |
| fourier | Repaired | 11 | math, physics, arts, cs |
| harmonic | New | 10 | math, physics, eng |
| inverse-problems | New | 9 | math, eng, med, physics |
| map-distortion | New | 8 | math, earth |
| spectral | Repaired | 9 | math, physics, arts |
| stability | New | 8 | math, eng, bio, stats |
| symmetry | Repaired | 10 | math, chem, arts, physics |

The seven new walks are not duplicates of the existing Fourier, spectral, entropy or symmetry narratives. Each adds at least four ideas unused in the original eight walks. Duality follows separating bounds and their equality; stability follows perturbation growth; harmonic follows Laplace boundary problems; causality follows identification; feedback follows loop sensitivity; inverse problems follow information loss and regularization; map distortion follows local metric and area change.

## Source-grounding decisions

Bridge prose was checked against the linked written item’s statement, idea and scope, with the existing reference anchors listed below. This is a review of the connection being claimed; it does not independently repeat every underlying item’s source audit or numerical verification.

- **Duality:** finite LP optima, primal/dual feasibility and separating-hyperplane conditions are retained. Max-flow/min-cut is tied to its actual LP dual. The thermodynamic convention is explicitly F(T) = -U*(T), so it is concave rather than a convex conjugate with the wrong sign. Parent review also corrected the conjugate intercept to -f*(y), with the necessary finite-conjugate qualification. The minimax step states finite zero-sum games.
- **Stability:** scalar linearization leaves zero derivatives undecided; the matrix test retains the imaginary-axis Jordan-block qualification. A nonincreasing Lyapunov function is used as a stability certificate without claiming attraction. Lotka–Volterra neutral cycles, Hopf bifurcation, the exact quadratic learning-rate interval and continuous dependence of heat solutions are separate instances with their own assumptions.
- **Harmonic:** the mean-value property, Poisson construction and electrostatic uniqueness refer to different linked results. Ideal flow is restricted to regions with a velocity potential. Conformal velocity transformation retains the nonzero-derivative requirement; panel methods retain the attached, incompressible ideal-flow regime.
- **Causality:** a demographic pooling reversal motivates the comparison but is not by itself a causal proof. Randomization, exchangeability/positivity/consistency, back-door adjustment, collider bias and non-identifiability have separate steps. Hill’s viewpoints are not presented as a sufficient checklist.
- **Feedback:** the loop must stay stable; physiological and engineering gain signs are distinguished. Molecular production-rate variation is not conflated with all intrinsic noise. The autoregulation speed comparison holds the final protein level fixed; delay and bistable memory are explicitly different architectures/regimes.
- **Inverse problems:** uniqueness, numerical conditioning and algorithm performance are kept separate. A continuous limited-angle compact-support Radon map can remain injective but severely unstable. The last step gives an actual nonunique exterior-field problem. Tikhonov filters damp weak singular directions.
- **Map distortion:** the derivative acts between metric tangent planes. Singular-value product controls local area while their ratio controls angular distortion. Mercator and stereographic preserve angles with nonconstant scale; equal-area maps do not thereby preserve shape. The simultaneous-preservation obstruction is local curvature, not a claim that no single map point can be undistorted.

The original eight walks previously contained **41 planned-only steps**. They have been reworked into complete written-item walks. The material removed includes unwritten Black–Scholes, diffusion-model, black-hole, sampling, molecular-selection-rule and topology/logic endpoints. These can return when their actual items exist; a ghost card is not counted as an available explanation. The repairs also correct stationary versus minimum action, cyclic/sole-result second-law qualifiers, finite/asymptotic compression, statistical fluctuations, real eigenvalues versus positive lengths, mass-weighted normal modes, steady sound spectra versus all timbre, and crystal lattices versus atomic bases.

Existing item-review flags remain on `soc-4.2`, `game-3.4`, `micro-9.7`, `rca-11.8`, `fa-12.23`. They are visible limitations of the underlying inventory, not cleared by bridge authorship. The new bridge-level structural tests deliberately do not equate absence of a verify flag with proof of mathematical correctness.

## Verification performed

Commands:

```sh
node scripts/build.mjs --strict
node --test tests/verification-bridges.test.mjs
node tests/verification-bridges.mjs
```

Results on the final bridge content:

- Strict build: **0 errors, 0 warnings**; 6,684 written and 6,890 planned items in the atlas.
- **17 structural tests passed**: inventory target, unique routes/titles/walks, source-anchored written interactive items, nonempty notes, at least two collections/fields per bridge, and substantive new concepts.
- Browser audit: **30 desktop route/theme checks** at 1280 × 900 and **30 narrow route/theme checks** at 320 × 900. Every bridge’s title, step count and target hrefs match content; no planned cards, KaTeX errors, horizontal overflow, runtime errors or console errors.
- Full-page screenshots for all 15 bridges in both themes: /tmp/theorems-bridges/<slug>-light.png and <slug>-dark.png. Machine results: /tmp/theorems-bridges/results.json. These are reproducible local inspection artifacts rather than committed assets.
- Agent screenshot inspection of the seven new pages in both light and dark confirms readable hierarchy, formula rendering, numbered rails and field colors. This is agent visual inspection, not the plan’s independent human sample or subjective audio listening.

## Remaining master-plan capability

The numerical target and ordered written-item narrative requirement are met. The **“same picture, many guises” bridge-level visualization in MASTER_PLAN §8 is still absent**: scripts/lib.mjs only loads bridge metadata/steps, scripts/build.mjs serializes those fields, and assets/js/app.js pageBridge renders linked journey cards. There is no bridge viz runtime hook, lazy visualization module, teardown or bridge-state serializer. Every linked item has its own interactive picture, but that is not a shared bridge picture. This content-only change does not claim the full Phase 7 feature complete.

The planned Routh–Hurwitz/Nyquist/Turing/CFL, SVM, channel/error-correction and broader geometric-invariance extensions are not fabricated from unrelated items: their matching written lessons were unavailable at this checkpoint. The authored stability, duality and distortion walks use the existing concepts listed above.

## Item-by-item source anchors

The rows below give the exact written module and reference for every ordered bridge step. Notes are in content/bridges/<slug>.js.

### action

| Step | Written source and concept | Reference anchor already carried by the item |
|---|---|---|
| 1 | [opt-1.4: First-order necessary condition: ∇f = 0](../../content/opt/ch01.js) | Nocedal–Wright ch. 2 |
| 2 | [mech-5.2: Fermat’s principle and Snell’s law](../../content/mech/ch05.js) | Taylor §6.1 |
| 3 | [mech-5.7: Brachistochrone: the cycloid](../../content/mech/ch05.js) | Taylor §6.3; Goldstein §2.2 |
| 4 | [mech-5.4: Euler–Lagrange equation](../../content/mech/ch05.js) | Taylor §6.2; Goldstein §2.2 |
| 5 | [mech-6.5: Hamilton’s principle of stationary action](../../content/mech/ch06.js) | Goldstein §2.1; Taylor §7.1 |
| 6 | [mech-7.3: Noether’s theorem](../../content/mech/ch07.js) | Arnold §20; Tong §2.4 |
| 7 | [mech-12.6: Maupertuis’ principle and the Jacobi metric](../../content/mech/ch12.js) | Goldstein §8.6; Arnold §45 |
| 8 | [qm-6.4: Feynman path integral](../../content/qm/ch06.js) | Sakurai ch. 2 |

### causality

| Step | Written source and concept | Reference anchor already carried by the item |
|---|---|---|
| 1 | [demo-1.8: Simpson’s paradox in crude death rates](../../content/demo/ch01-b.js) | PHG ch. 2 |
| 2 | [epi-4.6: Confounding](../../content/epi/ch04.js) | Rothman ch. 12; Gordis ch. 15 |
| 3 | [causal-1.1: Potential outcomes](../../content/causal/ch01.js) | Hernán–Robins §1.1; Pearl §7.4 |
| 4 | [causal-2.1: Randomization](../../content/causal/ch02.js) | Hernán–Robins §2.1 |
| 5 | [causal-1.9: Identification by exchangeability, positivity, consistency](../../content/causal/ch01-b.js) | Hernán–Robins §3.1 |
| 6 | [causal-4.3: Back-door criterion](../../content/causal/ch04.js) | Pearl (1995), Definition 3 and Theorem 1, pp.674–675 |
| 7 | [causal-4.5: M-bias: adjusting for a pre-treatment collider](../../content/causal/ch04.js) | Hernán–Robins §18.2; Hernán–Robins §7.4 |
| 8 | [causal-4.10: Completeness of do-calculus; non-identifiable effects](../../content/causal/ch04-b.js) | Shpitser–Pearl (2006), Theorems 1 and 7, Corollary 2; Huang–Valtorta (2006), Theorem 2 |
| 9 | [epi-4.17: The Environment and Disease: Association or Causation?](../../content/epi/ch04-papers.js) | Austin Bradford Hill (1965), The Environment and Disease: Association or Causation? |

### contagion

| Step | Written source and concept | Reference anchor already carried by the item |
|---|---|---|
| 1 | [mathbio-1.2: Exponential (Malthusian) growth](../../content/mathbio/ch01.js) | Murray I ch. 1 |
| 2 | [stoch-3.9: Galton–Watson branching process](../../content/stoch/ch03-b.js) | Grimmett–Stirzaker §5.4; Norris §5.1 |
| 3 | [stoch-3.10: Extinction probability is the least fixed point of the offspring PGF](../../content/stoch/ch03-b.js) | Grimmett–Stirzaker §5.4 |
| 4 | [soc-4.2: The giant component appears at mean degree one](../../content/soc/ch04.js) | Newman ch. 11 |
| 5 | [soc-2.7: The strength of weak ties (Granovetter)](../../content/soc/ch02.js) | E&K §3.2; E&K §3.3 |
| 6 | [soc-1.8: Granovetter’s threshold model of collective behaviour](../../content/soc/ch01-b.js) | E&K §19.6 |
| 7 | [soc-1.9: Fragile cascades: one changed threshold stops the riot](../../content/soc/ch01-b.js) | E&K §19.6 |

### diffusion

| Step | Written source and concept | Reference anchor already carried by the item |
|---|---|---|
| 1 | [stoch-1.8: Random walk on a graph](../../content/stoch/ch01-b.js) | LPW §1.4 |
| 2 | [prob-3.1.2: Local limit for simple random walk (Stirling)](../../content/prob/ch03.js) | Rick Durrett, Probability: Theory and Examples (5th edition, 2019); item 3.1.2 |
| 3 | [pde-3.15: Brownian motion behind the heat equation](../../content/pde/ch03-c.js) | Strauss ch. 2 |
| 4 | [pde-1.4: Diffusion and the heat equation](../../content/pde/ch01.js) | Strauss §1.3 |
| 5 | [physio-1.3: Fick’s law of diffusion across membranes](../../content/physio/ch01.js) | Keener–Sneyd ch. 2 |
| 6 | [pde-3.3: The heat kernel (fundamental solution)](../../content/pde/ch03.js) | Strauss §2.4; Evans §2.3 |
| 7 | [pde-3.4: Solution of the heat equation on the line by convolution](../../content/pde/ch03.js) | Strauss §2.4; Evans §2.3 |
| 8 | [pde-3.14: Conservation of heat and decay](../../content/pde/ch03-c.js) | Strauss §2.4 |

### duality

| Step | Written source and concept | Reference anchor already carried by the item |
|---|---|---|
| 1 | [fa-3.2: Hahn–Banach extension, dominated form](../../content/fa/ch03.js) | Walter Rudin, Functional Analysis (2nd edition, 1991); item 3.2 |
| 2 | [fa-3.4: Hahn–Banach separation theorem](../../content/fa/ch03.js) | Walter Rudin, Functional Analysis (2nd edition, 1991); item 3.4 |
| 3 | [opt-2.7: Separating hyperplane theorem](../../content/opt/ch02.js) | Boyd–Vandenberghe §2.5 |
| 4 | [algo-11.19: LP duality: weak and strong](../../content/algo/ch11-c.js) | Nemirovski, Optimization I (2024), slides 3.38–3.40, PDF pp.240–242; Erickson H.5 and H.7 |
| 5 | [algo-11.21: Max-flow min-cut as LP duality](../../content/algo/ch11-d.js) | Erickson notes: Linear Programming; CLRS 4e §29.3 |
| 6 | [game-3.4: Minimax by linear-programming duality](../../content/game/ch03.js) | MSZ §24.3 |
| 7 | [opt-3.7: The conjugate function](../../content/opt/ch03.js) | Boyd–Vandenberghe §3.3 |
| 8 | [thermo-3.7: Legendre transforms and thermodynamic potentials](../../content/thermo/ch03.js) | Callen ch. 5 |

### entropy

| Step | Written source and concept | Reference anchor already carried by the item |
|---|---|---|
| 1 | [thermo-2.1: Second law: Kelvin–Planck and Clausius statements](../../content/thermo/ch02.js) | Kardar §1.4; Tong ch. 4 |
| 2 | [thermo-2.9: Entropy as a state function](../../content/thermo/ch02.js) | Kardar §1.6; Schroeder §3.2 |
| 3 | [thermo-5.6: Boltzmann entropy](../../content/thermo/ch05.js) | Schroeder §2.6 |
| 4 | [thermo-5.7: The second law as overwhelming probability](../../content/thermo/ch05.js) | Schroeder §2.3 |
| 5 | [thermo-6.6: Gibbs entropy](../../content/thermo/ch06.js) | Tong §1.3.3, pp.22–24; Gibbs (1902), ch.IV, pp.49–51 |
| 6 | [info-1.2: Shannon entropy](../../content/info/ch01.js) | Cover–Thomas §2.1; MacKay ch. 2 |
| 7 | [info-4.6: Block coding approaches the entropy](../../content/info/ch04-b.js) | Cover–Thomas §5.4 |
| 8 | [thermo-5.16: Maxwell’s demon](../../content/thermo/ch05-b.js) | Schroeder §2.6 |
| 9 | [thermo-5.17: Landauer’s principle](../../content/thermo/ch05-b.js) | Kardar §2.7 |
| 10 | [thermo-6.7: Maximum entropy principle](../../content/thermo/ch06.js) | Kardar §2.7 |
| 11 | [info-2.1: Relative entropy (Kullback–Leibler divergence)](../../content/info/ch02.js) | Cover–Thomas §2.3 |
| 12 | [info-3.14: Second law: divergence to equilibrium decreases](../../content/info/ch03-b.js) | Cover–Thomas §4.4 |
| 13 | [deep-1.9: Softmax and cross-entropy loss](../../content/deep/ch01-b.js) | Prince §5.5; Prince §5.7 |

### feedback

| Step | Written source and concept | Reference anchor already carried by the item |
|---|---|---|
| 1 | [ctrl-1.4: Closed-loop transfer function](../../content/ctrl/ch01.js) | Åström–Murray §9.4; Franklin–Powell §4.1 |
| 2 | [ctrl-1.8: Feedback rejects disturbances](../../content/ctrl/ch01-b.js) | Åström–Murray §2.3 |
| 3 | [physio-1.1: Homeostasis and negative feedback](../../content/physio/ch01.js) | Guyton–Hall; Boron–Boulpaep |
| 4 | [physio-1.2: Gain of a feedback system](../../content/physio/ch01.js) | Guyton–Hall |
| 5 | [ctrl-1.7: Feedback reduces sensitivity to plant variations](../../content/ctrl/ch01.js) | Åström–Murray §2.5; Franklin–Powell §4.1 |
| 6 | [sysbio-2.1: Negative autoregulation](../../content/sysbio/ch02.js) | Alon: Autoregulation |
| 7 | [sysbio-2.3: Negative autoregulation buffers production-rate variation](../../content/sysbio/ch02.js) | Alon: Autoregulation |
| 8 | [sysbio-2.2: Negative autoregulation speeds the response](../../content/sysbio/ch02.js) | Alon: Autoregulation |
| 9 | [ctrl-4.9: Time delay limits achievable speed](../../content/ctrl/ch04-b.js) | Åström–Murray §14.3 |
| 10 | [sysbio-4.4: Hysteresis and cellular memory](../../content/sysbio/ch04.js) | Alon: Positive Feedback, Bistability and Memory |

### fixed-points

| Step | Written source and concept | Reference anchor already carried by the item |
|---|---|---|
| 1 | [top-3.17: Every self-map of an interval has a fixed point](../../content/top/ch03-c.js) | Munkres §24 |
| 2 | [pma-9.23: Contraction principle (Banach fixed point theorem)](../../content/pma/ch09-a4.js) | Walter Rudin, Principles of Mathematical Analysis (3rd edition, 1976); item 9.23 |
| 3 | [ode-2.4: Picard–Lindelöf theorem](../../content/ode/ch02.js) | Teschl §2.2 |
| 4 | [num-2.4: Newton’s method](../../content/num/ch02.js) | Süli–Mayers ch. 1 |
| 5 | [game-2.3: Nash’s existence theorem](../../content/game/ch02.js) | MSZ §5.3 |
| 6 | [micro-9.7: Existence of exchange equilibrium](../../content/micro/ch09-b.js) | Varian Ch. 32 |
| 7 | [stoch-4.6: Perron–Frobenius theorem](../../content/stoch/ch04.js) | Grimmett–Stirzaker §6.6 |
| 8 | [stoch-4.15: PageRank](../../content/stoch/ch04-b.js) | LPW §1.5 |
| 9 | [stoch-3.10: Extinction probability is the least fixed point of the offspring PGF](../../content/stoch/ch03-b.js) | Grimmett–Stirzaker §5.4 |
| 10 | [pl-2.9: Fixed-point combinators and recursion](../../content/pl/ch02-b.js) | Pierce §5.2 |

### fourier

| Step | Written source and concept | Reference anchor already carried by the item |
|---|---|---|
| 1 | [pma-8.10: Orthonormal systems and Fourier coefficients](../../content/pma/ch08-a2.js) | Walter Rudin, Principles of Mathematical Analysis (3rd edition, 1976); item 8.10 |
| 2 | [pma-8.11: Partial Fourier sums are the best mean-square approximations](../../content/pma/ch08-a3.js) | Walter Rudin, Principles of Mathematical Analysis (3rd edition, 1976); item 8.11 |
| 3 | [pma-8.16: Parseval's theorem](../../content/pma/ch08-a3.js) | Walter Rudin, Principles of Mathematical Analysis (3rd edition, 1976); item 8.16 |
| 4 | [rca-9.1: Fourier transform of an L¹ function](../../content/rca/ch09.js) | Walter Rudin, Real and Complex Analysis (3rd edition, 1987); item 9.1 |
| 5 | [rca-9.13: The Plancherel theorem](../../content/rca/ch09-a3.js) | Walter Rudin, Real and Complex Analysis (3rd edition, 1987); item 9.13 |
| 6 | [mech-4.12: Fourier analysis of periodic driving](../../content/mech/ch04-b.js) | Taylor §5.7; Taylor §5.8 |
| 7 | [music-2.6: The harmonic series](../../content/music/ch02.js) | Benson ch. 4; Loy I ch. 3 |
| 8 | [music-4.2: Fourier series of a periodic tone](../../content/music/ch04.js) | Benson ch. 2; Loy II ch. 3 |
| 9 | [music-4.4: Parseval: a tone’s energy is the sum over harmonics](../../content/music/ch04.js) | Benson ch. 2 |
| 10 | [algo-4.11: Fast Fourier transform (Cooley–Tukey)](../../content/algo/ch04-b.js) | CLRS 4e §30.2; KT §5.6 |
| 11 | [algo-4.15: Integer multiplication via the FFT](../../content/algo/ch04-b.js) | CLRS 4e Ch. 30; Erickson notes: Fast Fourier Transforms |

### harmonic

| Step | Written source and concept | Reference anchor already carried by the item |
|---|---|---|
| 1 | [rca-11.3: The Laplacian; harmonic functions](../../content/rca/ch11.js) | Walter Rudin, Real and Complex Analysis (3rd edition, 1987); item 11.3 |
| 2 | [rca-11.12: The mean value property](../../content/rca/ch11-a2.js) | Walter Rudin, Real and Complex Analysis (3rd edition, 1987); item 11.12 |
| 3 | [rca-11.8: The Dirichlet problem for the disc](../../content/rca/ch11.js) | Walter Rudin, Real and Complex Analysis (3rd edition, 1987); item 11.8 |
| 4 | [em-2.8: Laplace’s equation in charge-free regions](../../content/em/ch02-b.js) | Griffiths §3.1 |
| 5 | [em-3.5: First uniqueness theorem](../../content/em/ch03.js) | Griffiths §3.1 |
| 6 | [em-3.18: Conformal mapping of electrostatic problems](../../content/em/ch03-c.js) | Ostiguy, Longitudinal Profile and Effective Length of a Conventional Dipole Magnet, PAC1993 pp.2901–2903, Eqs.6–9 p.2902; Siu, Conformal Mappings and Application to Electrostatics, Math115 (2006–2007), harmonic pullback derivation |
| 7 | [fluid-4.2: Laplace’s equation for ideal flow](../../content/fluid/ch04.js) | Kundu §7.2; Acheson ch. 1 |
| 8 | [fluid-4.4: Complex potential](../../content/fluid/ch04.js) | Kundu §7.4; Acheson ch. 4 |
| 9 | [fluid-4.15: Conformal maps carry potential flows](../../content/fluid/ch04-c.js) | Theodorsen, NACA Report411, Theory of Wing Sections of Arbitrary Shape, pp229–234 and237 (appendix) |
| 10 | [aero-2.5: Panel methods](../../content/aero/ch02.js) | Anderson ch. 5 |

### inverse-problems

| Step | Written source and concept | Reference anchor already carried by the item |
|---|---|---|
| 1 | [nla-3.1: Condition number of a problem](../../content/nla/ch03.js) | Trefethen–Bau Lec. 12 |
| 2 | [nla-2.11: Least squares via the SVD and the pseudoinverse](../../content/nla/ch02-b.js) | Trefethen–Bau Lec. 11 |
| 3 | [sig-3.13: Inverse systems and deconvolution](../../content/sig/ch03-b.js) | Oppenheim–Willsky §2.3 |
| 4 | [imaging-3.2: Radon transform](../../content/imaging/ch03.js) | Kak–Slaney §3.1; Prince–Links ch. 6 |
| 5 | [imaging-3.4: Fourier slice theorem](../../content/imaging/ch03.js) | Kak & Slaney §3.2, pp.56–59, Eqs.7–18 |
| 6 | [imaging-3.5: Uniqueness of Radon inversion](../../content/imaging/ch03.js) | Kak & Slaney §3.2, pp.56–59; Kuchment & Quinto §XI.2.1, Theorem11.1/proof, and §XI.2.3.1 |
| 7 | [imaging-3.8: Ramp-filter windows and noise](../../content/imaging/ch03-b.js) | Kak–Slaney §3.3; Kak–Slaney §5.2 |
| 8 | [nla-2.13: Tikhonov regularization (ridge regression)](../../content/nla/ch02-b.js) | Golub–Van Loan ch. 6 |
| 9 | [em-4.11: Exterior fields do not determine the inside](../../content/em/ch04-b.js) | Griffiths §3.4 |

### map-distortion

| Step | Written source and concept | Reference anchor already carried by the item |
|---|---|---|
| 1 | [ladr-7.70: Singular value decomposition](../../content/ladr/ch07-c.js) | Sheldon Axler, Linear Algebra Done Right (4th edition, 2024); item 7.70 |
| 2 | [vcalc-4.5: Jacobian as a local area factor](../../content/vcalc/ch04.js) | Marsden–Tromba §6.1 |
| 3 | [geog-3.4: Tissot’s indicatrix](../../content/geog/ch03.js) | Snyder §4 |
| 4 | [rca-14.2: Angles are preserved exactly where f′ ≠ 0](../../content/rca/ch14.js) | Walter Rudin, Real and Complex Analysis (3rd edition, 1987); item 14.2 |
| 5 | [geog-4.2: Mercator projection and the isometric latitude](../../content/geog/ch04.js) | Snyder §7 |
| 6 | [geog-3.6: Equal-area maps keep the indicatrix area constant](../../content/geog/ch03.js) | Snyder §4 |
| 7 | [geog-3.7: No map is both conformal and equal-area](../../content/geog/ch03.js) | Snyder §4 |
| 8 | [geog-5.2: Stereographic projection: conformal, circles to circles](../../content/geog/ch05.js) | Snyder, Map Projections—A Working Manual (1987), §21, pp. 154–159 |

### spectral

| Step | Written source and concept | Reference anchor already carried by the item |
|---|---|---|
| 1 | [ladr-5.5: Eigenvalue](../../content/ladr/ch05.js) | Sheldon Axler, Linear Algebra Done Right (4th edition, 2024); item 5.5 |
| 2 | [ladr-7.12: Eigenvalues of self-adjoint operators are real](../../content/ladr/ch07.js) | Sheldon Axler, Linear Algebra Done Right (4th edition, 2024); item 7.12 |
| 3 | [ladr-7.29: Real spectral theorem](../../content/ladr/ch07-b.js) | Sheldon Axler, Linear Algebra Done Right (4th edition, 2024); item 7.29 |
| 4 | [ladr-7.96: Ellipsoid with principal axes](../../content/ladr/ch07-d.js) | Sheldon Axler, Linear Algebra Done Right (4th edition, 2024); item 7.96 |
| 5 | [ladr-7.70: Singular value decomposition](../../content/ladr/ch07-c.js) | Sheldon Axler, Linear Algebra Done Right (4th edition, 2024); item 7.70 |
| 6 | [fa-12.23: The spectral theorem for normal operators](../../content/fa/ch12-a3.js) | Walter Rudin, Functional Analysis (2nd edition, 1991); item 12.23 |
| 7 | [mech-10.8: Principal axes of inertia](../../content/mech/ch10-b.js) | Taylor §10.4; Goldstein §5.4 |
| 8 | [mech-11.4: Normal modes: the generalized eigenvalue problem](../../content/mech/ch11.js) | Goldstein §6.2; Taylor §11.5 |
| 9 | [music-2.3: Standing waves and normal modes](../../content/music/ch02.js) | Benson ch. 1; Loy I ch. 8 |

### stability

| Step | Written source and concept | Reference anchor already carried by the item |
|---|---|---|
| 1 | [ode-1.8: Linear stability analysis in one dimension](../../content/ode/ch01.js) | Strogatz §2.4 |
| 2 | [ctrl-3.3: Linear stability iff all eigenvalues have negative real part](../../content/ctrl/ch03.js) | Åström–Murray §5.3; Franklin–Powell §3.6 |
| 3 | [ctrl-3.5: Lyapunov functions](../../content/ctrl/ch03.js) | Åström–Murray §5.4 |
| 4 | [ctrl-3.7: The Lyapunov equation AᵀP + PA = −Q](../../content/ctrl/ch03.js) | Åström–Murray §5.4 |
| 5 | [mathbio-3.7: Structural instability of the Lotka–Volterra centre](../../content/mathbio/ch03-b.js) | Kuznetsov, Elements of Applied Bifurcation Theory, second edition, §2.5 pp. 69–72; Teschl, §7.1 pp. 209–213; direct Jacobian calculation for the two displayed perturbations |
| 6 | [ctrl-3.12: Hopf bifurcation as a gain is raised](../../content/ctrl/ch03-b.js) | Åström–Murray §5.5 |
| 7 | [deep-4.2: Stability threshold of the learning rate](../../content/deep/ch04.js) | Goodfellow §4.3 |
| 8 | [pde-3.2: Uniqueness and stability for the heat equation](../../content/pde/ch03.js) | Strauss §2.3 |

### symmetry

| Step | Written source and concept | Reference anchor already carried by the item |
|---|---|---|
| 1 | [alg-3.13: The symmetries of a triangle form a nonabelian group](../../content/alg/ch03.js) | Judson §3.1; Judson §3.2 |
| 2 | [xtal-2.2: Crystallographic restriction theorem](../../content/xtal/ch02.js) | Hammond ch. 2; Giacovazzo ch. 1 |
| 3 | [xtal-3.2: The fourteen Bravais lattices](../../content/xtal/ch03.js) | Hammond ch. 3 |
| 4 | [xtal-3.7: The 230 space groups](../../content/xtal/ch03-b.js) | Hammond ch. 4; Giacovazzo ch. 1 |
| 5 | [music-8.1: Pitch classes and ℤ/12](../../content/music/ch08.js) | Tymoczko ch. 2; Benson ch. 9 |
| 6 | [rep-1.1: Linear representations](../../content/rep/ch01.js) | Serre §1.1; Fulton–Harris §1.1 |
| 7 | [rep-3.5: Orthogonality of irreducible characters](../../content/rep/ch03.js) | Serre §2.3, Theorems 3–5; Etingof et al. §4.5, Theorem 4.5.1 |
| 8 | [mech-7.3: Noether’s theorem](../../content/mech/ch07.js) | Arnold §20; Tong §2.4 |
| 9 | [mech-7.5: Isotropy of space: conservation of angular momentum](../../content/mech/ch07.js) | Goldstein §2.6 |
| 10 | [qm-7.6: Angular momentum generates rotations](../../content/qm/ch07.js) | Griffiths §6.5; Sakurai ch. 3 |

## Parent integration

Parent read the source-anchor report, reran all 17 structural tests and all 60 desktop/narrow/theme browser checks, and inspected full-size duality/light and stability/dark pages. The conjugate-intercept wording received a sign correction during that review; its exact mathematics is now explicit. The change closes the fifteen-narrative target only, with the remaining capability listed above.
