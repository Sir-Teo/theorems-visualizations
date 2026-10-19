# Probability stopping and example follow-up — 2026-10-17

Seven queued source reviews are resolved: `prob-4.2.7a`, `prob-4.2.8a`,
`prob-4.2.10`, `prob-4.3.2`, `prob-4.3.4`, `prob-4.3.4a`, and
`prob-4.3.8a`. Four closely related, unflagged neighbors receive corrections:
`prob-4.2.8`, `prob-4.2.9`, `prob-4.3.1`, and `prob-4.3.8`. These neighboring
corrections do not remove additional queue entries.

## Primary source and numbering

The reference is Rick Durrett's author-hosted *Probability: Theory and Examples*,
Version 5, January 11, 2019:
[author PDF](https://sites.math.duke.edu/~rtd/PTE/PTE5_011119.pdf).
The downloaded 490-page PDF has SHA-256
`aeac36cbf5e44c53d69fa60a2d29a393e2d0e8c955ee103bd845d925fd910886`.
Printed page numbers are eight less than the PDF page numbers. Text extraction
was checked against the author PDF; page anchors below identify the relevant
printed material, rather than later editions or secondary summaries.

| Atlas ID | Source location | Result of comparison |
|---|---|---|
| `4.2.7a` | [p. 219, unnumbered definition after Theorem 4.2.7](https://sites.math.duke.edu/~rtd/PTE/PTE5_011119.pdf#page=227) | Predictability is measurability at time `n−1`; the transform sums stakes times increments. The suffix is an atlas identifier for an unnumbered definition. |
| `4.2.8a` | [p. 220, unnumbered definition after Theorem 4.2.8](https://sites.math.duke.edu/~rtd/PTE/PTE5_011119.pdf#page=228) | Events `{N=n}` belong to the current filtration. The equivalence with `{N≤n}` follows by finite unions/differences; infinity is an allowed value. |
| `4.2.10` | [p. 221, Theorem 4.2.10](https://sites.math.duke.edu/~rtd/PTE/PTE5_011119.pdf#page=229) | Both positive-part terms, the submartingale hypothesis and the completed-upcrossing convention match. The proof must also control an incomplete final bet, which is nonnegative after truncating the process at the lower level. |
| `4.3.2` | [p. 225, Theorem 4.3.2](https://sites.math.duke.edu/~rtd/PTE/PTE5_011119.pdf#page=233) | Predictability starts at `n=1`; uniqueness is almost sure at every time. The compensator sums conditional increments using the summation index `m`. This also avoids the printed formula's repeated-`n` summation typo. |
| `4.3.4` | [pp. 225–226, Theorem 4.3.4 and proof](https://sites.math.duke.edu/~rtd/PTE/PTE5_011119.pdf#page=233) | The two infinite-occurrence/divergence events agree almost surely. The source assumes trivial initial information, but its proof works unchanged with nontrivial initial information: the centered count begins at zero and has increments bounded by one. This minor extension is identified in the reference. |
| `4.3.4a` | [pp. 226–227, unnumbered urn scheme in §4.3.2](https://sites.math.duke.edu/~rtd/PTE/PTE5_011119.pdf#page=234) | Reinforcement by one gives the Beta limit with the two initial color counts as parameters. Reinforcement by `c` divides both parameters by `c`. The stable suffix represents this unnumbered example, not another numbered theorem. |
| `4.3.8a` | [pp. 230–231, equation (4.3.4), Lemma 4.3.9 and Theorem 4.3.11](https://sites.math.duke.edu/~rtd/PTE/PTE5_011119.pdf#page=238) | Independent offspring, absorbing zero, the finite-mean calculation and generating-function iteration match. Mean one alone does not imply extinction: the deterministic one-child law is an exception. |

Historical priority claims for the upcrossing inequality, conditional
Borel–Cantelli lemma, urn scheme and branching process were not established by
an original historical publication in this review. Their unsupported timeline
credits are removed. The conditional Borel–Cantelli item uses the descriptive
source-backed name. No historical priority was inferred from a textbook's
conventional theorem name.

## Corrections and mathematical evidence

### Predictability and stopping

The predictability display previously declared success after checking the current
outcome sequence and 40 random sequences. It now exhausts all 4096 possible
12-round outcomes and compares stakes at each round for every common past.
This establishes the classification in this finite model; it does not claim a
finite test establishes measurability on arbitrary spaces. All three past-based
systems pass; the peek system fails at all 12 rounds. Peek guarantees
nonnegative gains and gains strictly when a win occurs; an all-loss sequence
still earns zero, so the former "wins every time" language was inaccurate.

The stopping display now defines its horizon precisely. Hitting rules give
infinity when there is no hit by time 40; last-visit and first-maximum rules
refer to `[0,40]`. Sampled futures can provide witnesses of failure, but agreement
among sampled futures is explicitly not a proof. The two hitting rules depend
only on the observed prefix. In contrast, paths with the same initial value can
have different answers to `{N=0}` for the last-zero or maximum rules. Exhaustive
ten-step prefix tests verify the former; explicit witnesses verify the latter.
All displayed alternative futures and stopping markers are included in the
vertical range.

### Upcrossings

The old blue curve was a Monte Carlo average accompanied by a claimed inequality
against the deterministic bound. A sample mean need not satisfy that inequality.
The replacement computes the expected count by propagating the exact finite
walk law, up to floating-point roundoff. Its state records the current position
and whether an upcrossing bet is active. A transition from an active state to a
position at least the upper level adds its probability to the expected count.
The same state probabilities compute the expected positive part in the bound.

Independent enumeration of every walk through 12 steps agrees with both curves
for three probabilities and four bands, including bands above and below the
starting point. Additional 200-step checks verify the inequality across the
available probability extremes and narrow extreme bands. The source argument
also explains why an unfinished final bet cannot create a negative contribution
after replacing `X` by its lower-truncated process. The sample path has an
adaptive range, and the two level handles occupy separate horizontal positions
so narrow bands remain selectable when the walk has large vertical drift.

### Doob decomposition and conditional Borel–Cantelli

Doob's display now distinguishes the exact martingale mean from its 400-path
estimate, includes the latter's estimated standard error, and ranges all drawn
sample and mean curves. The local-time and quadratic-compensator examples are
explicitly restricted to the fair walk. Independent conditional branch tests
check fairness of the compensated increment for every eight-step prefix, four
functions and three probabilities; path reconstruction and predictable
compensator increments also pass. At probability one half, the absolute-value
compensator counts pre-step visits to zero and the squared-walk compensator is
exactly time.

The conditional Borel–Cantelli proof now gives both cases explicitly. If the
centered count converges, the two nondecreasing sums are either both finite or
both infinite. If it oscillates to both infinities, the occurrence count must be
unbounded for positive excursions and the conditional-probability sum must be
unbounded for negative excursions. The ordinary independent-event reduction
now specifies the natural filtration; independence of the events alone does not
justify conditioning on an arbitrary larger filtration.

The environment example's information includes its past walk and event outcomes;
the event probability uses the walk before the next step and a fresh independent
uniform draw. Thus the displayed rate is the stated conditional probability,
even if the coin selecting the walk's drift is not revealed. Finite counts no
longer purport to decide infinite divergence. The scatter range also includes
the newly selected path, rather than only the fixed background sample.

### Pólya urn and branching

A continuous-Beta sampling threshold was previously applied to a finite-draw
urn fraction, which is discrete. The display now adds the exact finite-draw
beta-binomial bin densities and reports empirical Kolmogorov distances to both
the finite law and its continuous limit, with no invalid sampling threshold.
The finite variance is `b*r*n / ((b+r)^2*(b+r+1)*(b+r+n))`. Histogram limits include
all empirical and exact bars and the full Beta-density maximum; the old density
cap could hide peaks. The finite law is computed by rising-product/adjacent-mass
formulas and checked against an independent sequential urn probability
recursion for nine initial-count choices and all five offered draw counts.
Atomic Kolmogorov tests include both sides of each jump. The proof identifies
the Beta mixture by finite sequence probabilities and the strong law, rather
than treating arbitrary mixed sequence probabilities as moments without explanation.

The branching definition states the finite-mean condition used by its expectation
calculation and notes the critical deterministic exception. The existing exact
individual-child tree sampler is retained. Poisson and geometric offspring
laws use normalized finite truncations; their omitted tails are bounded below
`2e-15` throughout the offered mean range. All 37 offered mean settings for all
three laws pass normalization, mean and generating-function checks. The cap is
applied after completing a generation, so that generation is sampled in full.
The orange reference is the unconditional mean for the implemented offspring
law, not a claim that a single capped sample equals its expectation.

### Closely related unflagged corrections

- `4.2.8`: the transform's finite sample mean can exceed zero; a two-standard-error
  band is an estimate, not a guaranteed theorem bound. The plain-game theoretical
  endpoint now participates in the range calculation.
- `4.2.9`: the stopped walk's expectation has the monotonicity property; its
  empirical mean fluctuates. The fixed, unsupported `±0.1` assertion is replaced
  with an estimated terminal standard error. All shown stopped paths and mean
  curves are ranged dynamically.
- `4.3.1`: the source theorem requires a martingale. The former scope incorrectly
  suggested a submartingale or supermartingale suffices. A biased walk is a
  direct counterexample. Finite range classifications no longer identify the
  infinite theorem alternatives, and all displayed paths are included in range.
- `4.3.8`: [the setup preceding Theorem 4.3.8, p. 229](https://sites.math.duke.edu/~rtd/PTE/PTE5_011119.pdf#page=237)
  explicitly requires strictly positive coordinate densities. The atlas omitted
  this while claiming a positive limiting density almost surely. Coordinate
  equivalence is now stated. For example, one fair Bernoulli coordinate replaced
  by a deterministic one has positive affinity but a likelihood ratio which is
  zero on half the reference space; this refutes the previous one-sided
  hypothesis. The zero-one dependency is corrected to `prob-2.5.3`. The entire
  displayed trajectories and Monte Carlo estimates participate in range
  calculations; finite curves are not assertions that convergence has occurred.

## Validation and limits

- `node --test tests/verification-probability-stopping.test.mjs`: six tests pass,
  covering exhaustive finite events, independent probability recursions,
  conditional fairness, moments and offspring tails/PGFs.
- `node tests/verification-probability-stopping.mjs`: 22 light/dark scenario groups
  cover all seven queued entries and four neighboring entries. These use actual
  clicks, keyboard slider changes, resampling buttons and level-handle drags.
  They also inspect plotted data, exact expectations/bin masses, drawing bounds,
  readout labels, and runtime/TeX errors.
- Targeted static checking of all 11 changed entries: zero errors or warnings.
- Representative captures were inspected at
  `/tmp/atlas-stopping-upcrossing-light.png`,
  `/tmp/atlas-stopping-polya-dark.png` and
  `/tmp/atlas-stopping-branching-dark.png`; the browser suite also saves Doob,
  branching and upcrossing captures in both themes.

The source flags above are cleared only for the seven fully reviewed queue
entries. These mathematical, visual and automated interaction checks do not
complete the separately required subjective human sample or subjective audio
listening. None of these items has an audio action. Wave 5 remains gated by the
central verification ledger, maintained separately by the coordinating agent.
