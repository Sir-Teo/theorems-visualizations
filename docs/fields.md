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
- **Optional fields** shown on the page: `refs` (where to read more, e.g. `['Taylor §7.3']`),
  `credit` (who and when, e.g. `'Noether, 1918'`), `links` (`{ wikipedia: 'https://…' }`),
  `scope` (see above).
- **Units.** When a readout shows a physical quantity, give its unit (`v.M.si(x, 'J')` formats
  with SI prefixes once the numerics agent lands it; otherwise write the unit by hand). Prefer
  dimensionless sliders (ratios, multiples of a natural scale) when the absolute scale does not
  matter.

## Mathematics (book-anchored and curated)

As in AUTHORING.md. Book-anchored collections (`pma`, `rca`, `fa`, `ladr`, …) use the book's
numbering exactly. For linear algebra, work in ℝ² and ℝ³ with draggable vectors and matrices
you can edit by dragging the images of basis vectors; use the n×n routines in `v.M` (eigen,
SVD, QR, …) rather than hand-rolled ones, and show the invariant the theorem talks about (a span,
an eigen-direction, an orthonormal frame, an ellipse's axes) with live numbers.

## Physics & astronomy, Earth & environment, engineering

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

## Computer science

- **Algorithms run on input the reader can edit**: drag graph nodes and edit weights
  (`v.graph(stage, …)` with `editable`), shuffle or type an array, draw points. Use the
  step-through player `v.steps(…)` with pseudocode for anything with more than a handful of steps,
  and `v.table(stage, …)` for DP tables.
- **The readout proves the claim**: an operation counter against the bound (comparisons vs
  n log₂ n), the loop invariant checked at every step, the potential function in amortized
  analysis, the cut certifying a max flow.
- **Break it**: negative edge weights for Dijkstra, a non-matroid for greedy, adversarial input
  for quicksort, a bad hash function, a graph with a cycle for topological sort.
- Kinds: `Algorithm` (statement = what it computes plus its guarantee), `Theorem` for
  correctness/optimality/lower bounds, `Concept`, `Method`.

## Chemistry & materials

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

## Biology

- **Populations of individuals**: the `agents` kit (individual-based models) beside the
  deterministic equation they converge to — Hardy–Weinberg proportions, logistic growth,
  predator–prey cycles, drift in small populations. Seeded randomness with *New run* buttons.
- **Genotype colours are a house convention** (popgen: AA blue, Aa purple, aa orange); keep them
  consistent within a collection.
- **Break it**: small N (drift), non-random mating, selection, migration, delays, stochasticity.
- Sequences and trees: alignments as DP tables (`v.table`), phylogenies with the `tree` kit,
  genealogies backwards in time (coalescent).

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
- Visual-art items use real optics and colour science (perspective projection computed, colour
  converted through actual colour spaces).
- **Break it**: inharmonic partials, a different temperament, a vanishing point moved off the
  horizon.

## Humanities

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
