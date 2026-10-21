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

- **Prerequisites are used inputs, not analogies.** Read the target proof and identify its step in the consumer, including hypotheses. Put a useful comparison in related links when it does not supply the argument. Synchronize complete raw dependency lists in the item and syllabus. Count field differences from actual collection metadata through the inventory helper; a topic name or folder prefix does not establish its field. For example, PROB belongs to mathematics while STAT belongs to statistics in this atlas.
- An alternate dependency path does not by itself decide whether a direct input is redundant. Compare the actual quantities, hypotheses and conclusion consumed: a stationary travel-time argument does not supply a nearest-colour-locus derivative, and a centre-of-mass vector reduction does not supply its scalar lever arm. Conversely, do not add another citation for a conclusion already supplied by an upstream input. Planned paths do not make unwritten prerequisites available. See the [ART peer](verification/art-prerequisites-independent-peer.md).

## Mathematics (book-anchored and curated)

As in AUTHORING.md. Book-anchored collections (`pma`, `rca`, `fa`, `ladr`, …) use the book's
numbering exactly. For linear algebra, work in ℝ² and ℝ³ with draggable vectors and matrices
you can edit by dragging the images of basis vectors; use the n×n routines in `v.M` (eigen,
SVD, QR, …) rather than hand-rolled ones, and show the invariant the theorem talks about (a span,
an eigen-direction, an orthonormal frame, an ellipse's axes) with live numbers.

- Match approximation claims to boundary hypotheses. Complete cubic interpolation with exact endpoint slopes has the fourth-derivative bound; general natural interpolation can have an endpoint layer of order h² even for x². Show incompatible endpoints as a counterexample rather than silently applying the clamped bound. See the [spline review](verification/wave5-num-review.md).

- Preserve tiny positive phases when wrapping a periodic coordinate. Adding the period to an already nonnegative remainder can erase that phase before a second remainder operation, changing half-open endpoint membership. Test subnormal and tiny saved states through the actual Share URL as well as the pure model. See the [ergodic-theory review](verification/wave5-prob-review.md).

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

- An equation count does not prove existence or uniqueness for arbitrary element laws. For network models, test coefficient and augmented ranks or establish the actual positivity/invertibility hypotheses; conflicting ideal sources can make a structurally balanced system inconsistent.
- State the dimensionless quantity that must be small for an approximation. A small factor alone can fail when multiplied by a large interval or logarithm: the Newtonian rocket approximation requires small final rapidity, not only small exhaust speed. Check normalization and units when passing between a unit direction, four-velocity and four-acceleration. See the [REL peer](verification/rel-independent-peer-followup.md).
- Distinguish signed response coefficients from positive measured magnitudes. At a band extremum strict Hessian signs need nondegeneracy; a quartic minimum can have a zero Hessian. A positive orbit period uses the absolute area derivative and the gradient projected into the orbit plane. See the [CM peer](verification/cm-crossfield-prerequisite-peer.md).

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
- State the censoring/intensity assumptions behind event-count and observed-time identities. Informative censoring can invalidate a baseline constant-hazard interpretation; it is not covered by “whatever the censoring.” See the [independent EPI counterexample](verification/epi-prerequisites-independent-peer.md).
- Atomless multivariate laws can still have atoms in a coordinate marginal (a continuous distribution on a vertical line is an example). Quantile witnesses for sampling bounds must be fixed independently of the sample, include boundary atoms and use the measure actually restricted to the target set. See the [ML peer](verification/ml-crossfield-prerequisite-peer.md).
- Distinguish the sampling law from the conditional resampling law of one observed sample. Retain bootstrap atoms and boundary failures; normalization, studentization and dependence assumptions belong to the actual procedure being computed. See the [bootstrap review](verification/wave5-stat-review.md).

## Computer science

- State whether acceptance is a least fixed point and whether every computation branch halts. Swapping existential/universal states and terminal outcomes complements a finite halting tree by induction; a rejecting self-loop and its dual can both reject under least-fixed-point semantics. Finite branching plus all-branch halting gives a finite tree, but gives no uniform polynomial resource bound. See the [CPLX alternation peer](verification/cplx-alternation-independent-peer.md).

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
- Separate encounter coefficients, surface reaction speeds and first-order transfer rates. The diffusion coefficient in m³/s needs the factor 1000 Nₐ to become L mol⁻¹ s⁻¹. Declare electrochemical current signs and distinguish a one-way Tafel/film approximation from the signed net Butler–Volmer current. See the [kinetics review](verification/wave5-kin-review.md).

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

- Transform uncertainty sets through the model's actual domain. For half-life $\ln 2/k$, intersect a fitted rate interval with $k>0$ first: the image can be bounded, unbounded, or empty. A nonpositive fitted rate supplies no positive-decay point estimate, and a plotting cap is not an interval endpoint. Distinguish central-compartment simulations from clinical recovery. See the [PHARM peer](verification/pharm-independent-combined-peer.md).

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
- A case-control estimand depends on the control-sampling scheme. A finite sampled ratio need not equal its population target; incidence-density sampling does not require a rare-disease approximation. Preserve the original cohort strata and denominators instead of inventing a joint risk score from marginal tables. See the [study-design review](verification/wave5-epi-review.md).

## Economics & finance, social sciences

- Distinguish a limiting equilibrium definition from a finite numerical diagnostic. Full trembling-hand perfection allows action-specific positive lower bounds tending to zero; one uniform family need not reach every perfect equilibrium, and proximity to its sample at a fixed epsilon proves neither limiting membership nor nonmembership. State the actual threshold and equality case in both caption and readout. See the [GAME peer](verification/game-two-input-independent-peer.md).

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
- Keep historical observations separate from authored simulations. Identify the actual sample,
  benchmark, units, time aggregation and horizon cohorts. Arithmetic return sums, compounded
  wealth, population identities and finite-sample statistics answer different questions; a
  residual or fitted parameter alone does not identify a causal effect. See the
  [event-study and fund audit](verification/fin-events-funds-followup.md).
- Separate an accounting identity from a causal closure: MV=PY alone does not fix velocity or output. Label money-finance and reserve-multiplier assumptions; a loan/deposit accounting entry does not remove subsequent funding and settlement constraints. See the [monetary-model review](verification/wave5-macro-review.md).
- Match demographic numerators and exposure denominators by age, period and marital status.
  Distinguish an adjusted reference schedule from an observed population or a biological bound,
  and distinguish hypothetical marital allocations from measured data. Survival weighting in
  net reproduction concerns the prospective mother's survival to childbearing. See the
  [reproduction](verification/demo-reproduction-followup.md) and
  [fertility-index](verification/demo-fertility-indices-followup.md) audits.
- State the whole family a behavioral axiom constrains: checking one pair of alternatives does
  not establish menu-wide independence. Include singleton menus and describe empty menus
  honestly. In games, retain weak best replies at ties, distinguish a computed certificate from
  an exact theorem, and state the update timing and convergence target. See the
  [choice-axiom](verification/psych-luce-followup.md) and
  [minimax/learning](verification/game-minimax-followup.md) audits.

## Arts, music & design

- **Make it audible** when it is about sound: `v.sound()` (once the runtime agent lands it) plays
  tones from partials and sample buffers; offer a "▶ Listen" button next to the picture. Sound
  must never autoplay.
- Music theory items about structure (scales, chords, rhythm) use pitch-class clocks, the
  Tonnetz, piano rolls and necklaces; acoustics items use honest physics (standing waves solved,
  spectra computed by FFT).
- Visual-art items use real optics and colour science (perspective projection computed, colour
  converted through actual colour spaces).
- State the observer, reference white and luminance convention for colour coordinates and source tables. Separate physical renotation targets from adapted, clipped screen previews. A gamut needs a specified colour space or printer profile; there is no universal CMYK boundary. Retain secondary numerical-table provenance even when the original qualitative experiment is verified. See the [colour-space review](verification/wave5-art-review.md).
- **Break it**: inharmonic partials, a different temperament, a vanishing point moved off the
  horizon.

## Humanities

- For sampled historical lists, distinguish a local typical-spacing heuristic, expected bin counts and a finite fitted regression slope. Equal numbers per logarithmic interval do not force collinearity or a slope of one. Keep that qualification consistent in statement, proof, caption and both readout modes. See the [four-consumer BIGHIST peer](verification/bighist-four-consumer-independent-peer.md).

- **Deps** in the history of technology are *enabling* dependencies: what an invention needed to
  exist (the printing press needs movable type, ink, paper and the screw press), plus the
  physics that explains how it works. Give `credit` with inventor and approximate date.
- Visualizations show the invention *working* (a clock escapement ticking, a telegraph keying a
  message, packets routing around a broken link) or the historical dynamics quantitatively (waves
  of advance, Malthusian equilibria) with sliders for the parameters.
- Philosophy items are made concrete through decision problems, probability puzzles and models
  (the two-envelope paradox simulated, Bayesian confirmation computed). Present arguments fairly;
  where philosophers disagree, say so.
- Specify the quantified domain, information available at each time, and permitted updates.
  An outside-domain witness or an added no-exam outcome changes a premise; it does not fulfill
  the original unrestricted claim. Editing a prior is different from conditioning that same
  prior on an observation. A finite model should state which formulation it illustrates and
  which semantic or epistemic assumptions it leaves outside its scope. See the
  [barber](verification/phil-barber-followup.md) and
  [surprise-examination](verification/phil-surprise-followup.md) audits.
- Linguistics items work on real text and sound (Zipf's law on a passage, formant vowel charts).
