# Field guides

AUTHORING.md is the rulebook for every item. This file adds what changes from field to field:
what counts as a dependency, which kinds to use, how "break a hypothesis" translates, and which
tools to reach for. Read the section for your field before writing a chapter.

## Everywhere

- **The picture must be about this idea and must let the reader test it.** In every field there
  is an equivalent of "break a hypothesis and watch the conclusion fail". Find it and put it on a
  control.
- **Compute honestly.** Simulate the system, sample the distribution, run the algorithm on the
  reader's input. Never draw the curve the claim says should appear; draw what the computation
  produces, and put the number that verifies the claim in the readout.
- **Kinds.** Use the most honest kind (see docs/syllabus.md). The statement of a `Law`, `Model`
  or `Principle` should include the regime where it holds, either in the statement or in the
  optional `scope` field (rendered as "Holds when …").
- **Historical reconstructions.** Cite the original passage and the later decipherment
  or interpretation separately. Publication dates need not date the underlying discovery.
  Distinguish a recomputed anagram from a transcription, a sampled continuous curve
  from an equilibrated finite-link chain, and numerical feasibility from a real
  structure's safety.
- **Optional fields** shown on the page: `refs` (where to read more, e.g. `['Taylor §7.3']`),
  `credit` (who and when, e.g. `'Noether, 1918'`), `links` (`{ wikipedia: 'https://…' }`),
  `scope` (see above).
- **Units.** When a readout shows a physical quantity, give its unit (`v.M.si(x, 'J')` formats
  with SI prefixes once the numerics agent lands it; otherwise write the unit by hand). Prefer
  dimensionless sliders (ratios, multiples of a natural scale) when the absolute scale does not
  matter.

## Mathematics (book-anchored and curated)

Separate a finite search budget from unrestricted mathematical reachability.
A bounded-length front need not be open; local extension can increase the
budget. Use actual region clearance for claimed inscribed balls, and label
grid connectivity or path lengths as numerical approximations.

As in AUTHORING.md. Book-anchored collections (`pma`, `rca`, `fa`, `ladr`, …) use the book's
numbering exactly. For linear algebra, work in ℝ² and ℝ³ with draggable vectors and matrices
you can edit by dragging the images of basis vectors; use the n×n routines in `v.M` (eigen,
SVD, QR, …) rather than hand-rolled ones, and show the invariant the theorem talks about (a span,
an eigen-direction, an orthonormal frame, an ellipse's axes) with live numbers.

Keep quantifiers and degenerate cases explicit: one example or one parameter value does
not establish an every-state claim; zero vectors, coincident subspaces and ill-typed terms
may change the conclusion. Distinguish pointwise properties of representatives from
almost-everywhere norms, and coordinate changes within a fixed dimension from arbitrary
maps between dimensions (agent sample statement/hypothesis review).
For remainder algorithms, test an exact first division and define whether the initial
divisor counts as the last nonzero remainder. A deliberately empty initial table and
subpixel geometric examples should be explained rather than treated as render failures.
For grid searches, label the grid optimum and residual separately from an exact solution.
No feasible grid points does not establish an empty feasible set, and a rounded grid
optimizer can have positive slack while the exact constraint is active.
Lifting a solution of a polynomial congruence does not automatically preserve or
increase multiplicative order. Primitive-root lifts need a representative with the
right first nonzero prime-power term and a separate order argument.
Determine quadrature rates from the actual transformed integrand. Adapting coordinates
to a boundary can leave a square-root endpoint: the cylindrical ball midpoint sum has
an N^(-3/2) rate, while its smooth spherical counterpart has an N^(-2) rate.

For gauges, distinguish a minimum from an infimum and state whether the set
contains its boundary. Check the origin before normalizing a ray. A labelled
tangent shape must actually be tangent; a coarse ray search must not turn a
small interior region into a false nonabsorbing example.

## Physics & astronomy, Earth & environment, engineering

- Distinguish a classical differential law from its weak formulation: integrable
  densities alone do not supply classical derivatives at every point. Label sampled
  normalization scales and log-plot floors, and keep a cleared zero-field state visible.
- Keep comparison curves at their labelled reference setting. A curve labelled
  unindented must use zero indentation, and drag comparisons should state when
  changing shape also changes the body's volume.
- **Deps** are derivational: the derivation starts from that law or uses that theorem. A law
  taken as a postulate (Newton's second law, Maxwell's equations) may have only mathematical
  deps, or none.
- **Break it** by leaving the regime of validity: large amplitudes for the small-angle pendulum,
  speeds near *c*, friction or driving for conservation laws, a rotating frame, a non-ideal gas.
- **Simulate with integrators that respect the physics**: velocity Verlet or leapfrog
  (symplectic) for Hamiltonian systems, with an energy readout showing the drift is tiny; RK4/RK45
  for dissipative systems. Show phase space next to real space when it helps.
- Show conserved quantities live (energy, momentum, angular momentum) and the quantity the law
  predicts beside the measured one (period vs amplitude, orbit period vs semi-major axis³ᐟ²).
- Keep an assessed response, a simplified model and an elementary limiting estimate distinct.
  For example, the black-body slope at an effective emission temperature does not by itself
  give the assessed atmospheric Planck response. Check numerical comparisons in the explanation
  as carefully as values in the simulation (agent sample finding: climate 3.4).
- Classify a filter by its actual impulse response: feedback can have exact pole–zero
  cancellation. A finite plotted or summed window cannot establish stability or the full
  truncation error; use an analytic tail bound where available and distinguish zero-state
  behavior from internal stability (agent sample finding: sig 3.12).

- In parcel models, distinguish pressure adjustment from linearized buoyancy.
  Density-gradient formulas need their compressibility or Boussinesq assumptions.
  Sample nonlinear reference curves through the plotted interval, and check axis
  ranges at inversions as well as ordinary lapse rates.

- State the Fourier sign convention and check time advances against an actual
  shifted causal response. Measure the resulting pre-zero signal and reconstruction
  error; a conditional label alone does not establish a counter-example.

## Statistics & data science

- **Simulate, don't assert**: every claim about estimators, tests or intervals is shown by repeated
  sampling from a population the reader controls (shape menu incl. skewed and heavy-tailed laws,
  sample size, *Draw 1 / 100 / 10,000*), building the sampling distribution as a histogram with the
  theoretical one overlaid. Seed the randomness (`v.M.rng(seed)`) from the control settings so
  screenshots are reproducible.
- **The readout compares measured with predicted**: mean, SD, coverage of an interval, size and
  power of a test, Kolmogorov distance — with the Monte Carlo error shown.
- **Break it**: Cauchy data (no mean), dependent samples, tiny n, the wrong model, multiple
  testing, a confounder. Use `v.M.dist` (normal, t, χ², F, gamma, beta, Cauchy, lognormal,
  mixture, Kolmogorov …) rather than hand-rolled laws.
- Machine learning items train on data the reader places (click to add points) and show the
  generalization gap against the bound.

For continuous covariates, state positivity under the target distribution almost
everywhere. Distinguish population zeros from sparse empirical bins; restricting
observed overlap changes the target and does not by itself remove model or
sampling error. Compare an estimator with the truth for its own target group.

## Computer science

Say which variables a probability guarantee is uniform over. A bound at one
fixed sample size does not automatically cover an entire curve, repeated runs
or a sample-dependent hypothesis class. Match summary grid sizes to labels.

Match integer recursion trees to rounded recurrences. Separate exact operation
counts from asymptotic leading terms, and count leaf rows separately from edge
depth. A sufficient balance condition need not be necessary.

For cryptographic experiments, state the sampled keys, nonce/counter distribution,
output position and whether diffusion is measured before feedforward. Match
the cipher variant to its specification. A finite bias threshold or avalanche
measurement does not establish indistinguishability.

- **Algorithms run on input the reader can edit**: drag graph nodes and edit weights
  (`v.graph(stage, …)` with `editable`), shuffle or type an array, draw points. Use the
  step-through player `v.steps(…)` with pseudocode for anything with more than a handful of steps,
  and `v.table(stage, …)` for DP tables.
- **The readout proves the claim**: an operation counter against the bound (comparisons vs
  n log₂ n), the loop invariant checked at every step, the potential function in amortized
  analysis, the cut certifying a max flow.
- **Break it**: negative edge weights for Dijkstra, a non-matroid for greedy, adversarial input
  for quicksort, a bad hash function, a graph with a cycle for topological sort.
- **Count the displayed candidates**: a type-checker panel must include the computed
  higher-order type before claiming a matching candidate. After erasing annotations,
  distinguish a ground principal type (one type) from a principal type containing
  variables (infinitely many instances). Test edited literals as well as abstractions.
- Kinds: `Algorithm` (statement = what it computes plus its guarantee), `Theorem` for
  correctness/optimality/lower bounds, `Concept`, `Method`.

## Chemistry & materials

- Separate a restricted trial family's energy error from correlation energy,
  which uses the fully optimized Hartree–Fock reference. A variational upper
  bound above a dissociation threshold fails to prove binding; it cannot
  prove nonbinding.
- A general electron wavefunction is a spatial spinor; product spatial/spin states
  are special cases. Angular-momentum projection counts describe measurement outcomes,
  not a set of definite three-dimensional vector directions.
  Distinguish angular amplitude |Y| from probability density |Y|².
- **Molecular and quantitative**: particles in a box (`v.mol` kit) whose measured pressure,
  speeds or reaction counts are compared with the macroscopic law; real constants (`v.M.CONST`,
  SI via `v.M.si`) and real substance data (van der Waals a, b; heats of formation) with sources
  in `refs`.
- **Equilibrium as a balance of rates**: show forward and backward rates converging, then perturb
  (Le Chatelier) and watch the shift; free-energy curves with the minimum moving.
- **Break it**: high density for ideal gases, low temperature, non-ideal mixtures, a catalyst that
  changes rates but not the equilibrium.
- Spectra and orbitals: use `v.M.schrodinger1D` for 1D models, `v.M.wavelengthRGB` for colours;
  3D shapes through `v.scene3`.
- In crystallography, separate lattice-plane geometry from empirical facet selection.
  Rational staircase slopes imply a repeating pattern, not identical terraces; a finite
  denominator search cannot certify irrationality. Check presets at every cell-aspect-ratio
  endpoint (agent sample finding: xtal 1.4).

## Biology

- **Populations of individuals**: the `agents` kit (individual-based models) beside the
  deterministic equation they converge to — Hardy–Weinberg proportions, logistic growth,
  predator–prey cycles, drift in small populations. Seeded randomness with *New run* buttons.
- **Genotype colours are a house convention** (popgen: AA blue, Aa purple, aa orange); keep them
  consistent within a collection.
- **Break it**: small N (drift), non-random mating, selection, migration, delays, stochasticity.
- Sequences and trees: alignments as DP tables (`v.table`), phylogenies with the `tree` kit,
  genealogies backwards in time (coalescent).
- Equal seed weight means equal hit chance per valid placement, not equal expected
  hits in a fixed-length region. Account for span via `(L − span + 1) p^weight`,
  and test same-weight randomizers at the minimum and maximum editable weights.

## Medicine & health

- **A simulated population the reader controls**: cohorts on lifelines (Lexis-style), with
  prevalence, risk and rates measured live and compared with the formulas; icon arrays of 100 or
  1,000 people for risks and test results (natural frequencies beat percentages).
- **Bias is the main enemy — make it visible**: confounding (stratify and watch an association
  reverse), selection bias, loss to follow-up, lead-time and length bias in screening, regression
  to the mean.
- **Physiology and pharmacology**: compartment models integrated honestly (`v.M` ODE solvers),
  with dose–response curves on log axes and real parameter values cited in `refs`.
- **Honesty about data**: historical numbers (Snow, Graunt, Doll & Hill) quoted from their source
  and cited; modelled data labelled as models.

## Economics & finance, social sciences

- **Deps**: a model depends on the concepts it is built from (elasticity on demand; the welfare
  theorems on Pareto efficiency and competitive equilibrium) and on the mathematics its analysis
  uses (the implicit function theorem for comparative statics, separating hyperplanes for the
  second welfare theorem).
- **Draggable curves with shaded, numerically read-out areas** (surplus, deadweight loss, tax
  revenue); agents simulated where the claim is about emergence (Schelling, markets with
  heterogeneous traders, cascades).
- **Break an assumption** and show the conclusion failing: non-convex preferences, an
  externality, asymmetric information, a monopolist, increasing returns.
- State models as models. "Comparative advantage" is a `Principle` (or a `Theorem` in a precise
  two-good Ricardian setting); "supply and demand" is a `Model`; "Giffen good" is a
  `Phenomenon`. Avoid presenting contested empirical claims as laws; say what the model assumes.

## Arts, music & design

- **Make it audible** when it is about sound: `v.sound()` (once the runtime agent lands it) plays
  tones from partials and sample buffers; offer a "▶ Listen" button next to the picture. Sound
  must never autoplay.
- Music theory items about structure (scales, chords, rhythm) use pitch-class clocks, the
  Tonnetz, piano rolls and necklaces; acoustics items use honest physics (standing waves solved,
  spectra computed by FFT).
- Check the actual cyclic interval word before an adjacency argument: the diatonic
  TTSTTTS word has no adjacent semitone pair. Fix a tonic when comparing parallel
  modal collections as windows on the line of fifths.
- Analyze the same sample buffer that the Listen control plays, and handle finite-window
  releases explicitly. A finite click or noise burst need not have a perfectly flat spectrum;
  distinguish these from ideal impulses and white-noise power spectra. State the integrability
  or finite-energy assumptions when invoking Fourier inversion or Plancherel (agent sample
  finding: music 4.5). Signal checks do not establish subjective listening quality.
- Visual-art items use real optics and colour science (perspective projection computed, colour
  converted through actual colour spaces).
- **Break it**: inharmonic partials, a different temperament, a vanishing point moved off the
  horizon.

## Humanities

- In articulatory models, label chosen turbulence and voicing thresholds as model
  parameters. A pipe-flow Reynolds threshold does not classify every speech jet.
  Test the actual noise gate below onset and across its transition; this runtime's
  `smoothstep` takes one normalized argument, not two edges and a value.
- In social-network experiments, distinguish found acquaintance chains from graph
  shortest paths. Forwarding one folder to one chosen acquaintance is local routing;
  breadth-first search explores neighbours in successive distance layers.
- **Deps** in the history of technology are *enabling* dependencies: what an invention needed to
  exist (the printing press needs movable type, ink, paper and the screw press), plus the
  physics that explains how it works. Give `credit` with inventor and approximate date.
- Visualizations show the invention *working* (a clock escapement ticking, a telegraph keying a
  message, packets routing around a broken link) or the historical dynamics quantitatively (waves
  of advance, Malthusian equilibria) with sliders for the parameters.
- Philosophy items are made concrete through decision problems, probability puzzles and models
  (the two-envelope paradox simulated, Bayesian confirmation computed). Present arguments fairly;
  where philosophers disagree, say so.
- Linguistics items work on real text and sound (Zipf's law on a passage, formant vowel charts).
