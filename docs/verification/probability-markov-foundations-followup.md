# Markov foundations follow-up — 2026-10-17

Eight queued reviews are resolved: `prob-5.1.1a`, `prob-5.1.3`, `prob-5.1.4`,
`prob-5.1.5`, `prob-5.2.2`, `prob-5.2.7`, `prob-5.3.1a`, and `prob-5.3.2a`.
The fixes distinguish event-index sampling from visits or elapsed time,
stationarity from fixed-time convergence, finite-horizon outcomes from eventual
ones, and exact constructions from sampled approximations.

## Primary source

Rick Durrett, *Probability: Theory and Examples*, Version 5, January 11, 2019,
[author-hosted PDF](https://sites.math.duke.edu/~rtd/PTE/PTE5_011119.pdf), 490 pages.
SHA-256: `aeac36cbf5e44c53d69fa60a2d29a393e2d0e8c955ee103bd845d925fd910886`.
Printed pages are eight less than PDF page numbers. The author PDF and its local
text extraction were read; current item references link to the exact pages.

| Atlas ID | Source anchor | Scope/numbering comparison |
|---|---|---|
| `5.1.1a` | [§5.2, p. 273](https://sites.math.duke.edu/~rtd/PTE/PTE5_011119.pdf#page=281) | Unnumbered kernel and Markov-chain definitions. The stable suffix denotes the definition; it is not Example 5.1.1. Measurability, probability measures, natural filtration and almost-sure identities for each measurable set are stated. |
| `5.1.3` | [Example 5.1.3, p. 270](https://sites.math.duke.edu/~rtd/PTE/PTE5_011119.pdf#page=278); [Example 5.5.3, pp. 300–301](https://sites.math.duke.edu/~rtd/PTE/PTE5_011119.pdf#page=308) | Urn transitions and stationary binomial law match. Detailed balance and parity distinguish the invariant law from convergence of a point-started chain. |
| `5.1.4` | [Example 5.1.4, pp. 270–271](https://sites.math.duke.edu/~rtd/PTE/PTE5_011119.pdf#page=278) | Neutral binomial resampling has absorbing endpoints. No mutation is being included. The fixation formula follows from its bounded martingale, with almost-sure finite absorption justified. |
| `5.1.5` | [Example 5.1.5, pp. 271–272](https://sites.math.duke.edu/~rtd/PTE/PTE5_011119.pdf#page=279); [Example 5.5.14, pp. 307–308](https://sites.math.duke.edu/~rtd/PTE/PTE5_011119.pdf#page=315) | The source observes the waiting count when service begins, excluding service. Its recursion and empty-state probability differ from the departure-epoch count formerly displayed. |
| `5.2.2` | [Theorem 5.2.2, p. 275](https://sites.math.duke.edu/~rtd/PTE/PTE5_011119.pdf#page=283) | A pi-system containing the whole space, linear closure and bounded nonnegative increasing-limit closure give all bounded measurable functions. The atlas combines the source's linear-closure conditions into the vector-space hypothesis. |
| `5.2.7` | [Theorem 5.2.7, pp. 278–279](https://sites.math.duke.edu/~rtd/PTE/PTE5_011119.pdf#page=286) | The source allows arbitrary symmetric iid increments, without a moment hypothesis. The factor-two upper bound matches; the simple-walk identity is also verified independently, retaining its strict-tail correction. |
| `5.3.1a` | [unnumbered definition, p. 281, and equation (5.3.1), p. 282](https://sites.math.duke.edu/~rtd/PTE/PTE5_011119.pdf#page=289) | Return times start at time one. Infinite recurrence assertions start from the state itself; transient return counts exclude time zero and include zero as a possible count. |
| `5.3.2a` | [unnumbered definitions before Theorem 5.3.3, p. 282](https://sites.math.duke.edu/~rtd/PTE/PTE5_011119.pdf#page=290) | Closedness and positive-time irreducibility match the source. The usual reflexive communication convention needs an explicit qualification for a singleton with no positive-time return. |

The previous Markov, Ehrenfest, Wright–Fisher, Kendall, monotone-class and
reflection priority/date credits were not established from original historical
publications in this batch. Those unsupported timeline claims are removed;
conventional model/theorem names supported by the author text are retained.

## Corrections and independent evidence

### Transition observations, Ehrenfest and Wright–Fisher

The Markov controls generate `N` transitions, not `N` visits to the selected
state. Captions and readouts now report departures among those transitions.
A state with no observed departure has no empirical row law; its gold dots are
omitted rather than plotted as four zero probabilities. More transitions need
not produce infinitely many visits to a transient or inaccessible state.
The rowwise normalization explicitly interprets zero total weight as uniform.
The explanatory limiting-frequency claim is restricted to infinitely many
departures. Tests count transitions directly on an independently specified path,
including an unvisited state and repeated self-transitions.

Ehrenfest's parity flips at every step, so a fixed starting state has a law
supported on just one parity at any fixed time. Occupation frequencies can
nevertheless approach the stationary binomial masses. The display now overlays
an independently propagated time-300 probability vector (purple) alongside the
occupation histogram and stationary law. From the offered fixed starts, its
total variation distance to stationarity is about one half, rather than zero.
Exact finite means are drawn at integer times. Tests cover all offered sizes
`2..60`, both starts and five times, checking normalization, parity and the
mean formula. Detailed-balance checks independently verify stationary flows.

Wright–Fisher's martingale converges to absorption because every interior state
has a positive one-step endpoint probability and their finite minimum is
positive. Bounded convergence then proves the fixation probability `k/N`.
The simulation retains its `40N` cap but counts observed loss, fixation and
unresolved runs separately; unresolved runs are no longer assigned to loss.
Mean observed time is labeled capped whenever necessary. The quoted Bernoulli
standard error refers explicitly to the uncensored eventual event. The rounded
starting count is shown, rather than treating the frequency slider as an exact
unrounded allele count. Independent binomial row checks verify normalization,
harmonicity of `k/N` and positive absorption probability.

### M/G/1: the source's service-start embedding

The old recursion was `(X−1)^+ + A`, for the number immediately after departures.
Durrett's Example 5.1.5 defines a different count: customers waiting when a
service begins, excluding the one in service. The corrected recursion is
`(X+A−1)^+`. At an empty waiting queue, one arrival during service leaves zero
waiting when the next service begins; the old recursion incorrectly left one
for this interpretation.

All captions, axes, simulation updates and reference calculations now use the
service-start count. The independent arrivals assumption, positive arrival rate,
finite positive mean service and finite squared coefficient of variation when
using the mean formula are explicit. The average is over service starts, not
elapsed time. If `a(z)=E[z^A]`, stationarity of the corrected recursion gives

`G(z) = (1−rho)(z−1)/(z−a(z))`.

Consequently `pi(0)=(1−rho)/a(0)`, matching Example 5.5.14, and
`E[X]=rho^2(1+c^2)/(2(1−rho))`. Thus the former mean needed its extra `rho`
removed. For deterministic service, `a(0)=exp(−rho)`; for exponential service,
`a(0)=1/(1+rho)`, so the empty waiting probability is `1−rho^2` and the mean is
`rho^2/(1−rho)`. Independent stationary generating-function differentiation
checks the implemented closed-form means. Empty-state recursion and initial
stationary balance coefficients also pass.

The empty-frequency denominator now excludes the initial observation, matching
the numerator's 20,000 simulated services. The old plotting cap at height 60
could hide the stationary mean near load one; the full reference participates in
the vertical range. Browser controls exercise stable, exact critical, transient
and `rho=.99` loads for both service laws. The critical sample is not described
as having a stationary mean.

### Monotone class and reflection

The former dyadic construction used 65 sampled function values per cell as an
infimum and a 4096-point error as a supremum. It also claimed pointwise
convergence for an indicator whose non-dyadic left endpoint was never reached
by the lower cell approximants. The replacement uses analytic cell infima and
suprema for square root, sine and an indicator with dyadic boundaries
`[3/8,13/16)`. Those particular approximants increase pointwise, including at
both indicator boundaries. Sine critical points are included explicitly.
Tests check all eight levels, coefficient reconstruction, lower-bound and
monotonicity properties, and exact zero indicator error from level four.
The target's discontinuities are drawn as steps with open/closed endpoint marks.
These examples illustrate the abstract theorem; the proof still uses the
pi-lambda theorem and value-based simple-function approximation for general
measurable functions.

The non-pi counterexample includes the whole space in its family, so the
intersection condition is the intended failed hypothesis. Its exact weighted
least-squares projection has values `(1/6,5/6,1/6,−1/2)` on the four atoms and
L2 distance `1/sqrt(20)`. The negative tail was previously clipped below the
plot. It is now fully ranged and independently checked.

Reflection plots previously treated empirical estimates as if they must satisfy
the theorem and attributed a ratio below two only to overshoot. Even a simple
walk hitting an integer without overshoot has an endpoint atom: the identity is
`P(max≥h)=P(S_n≥h)+P(S_n>h)`. Gold exact binomial references now show this.
All outcomes of walks through 12 steps independently verify both tails, the
crossing identity and the factor-two inequality, including non-integer levels
rounded to the next reachable integer threshold. Monte Carlo values are labeled
estimates, and an unobserved conditional event has undefined conditional
frequency. The twin reflects about its actual hit height, including overshoot.
All eight shown paths and the full reflected twin participate in plot limits,
which matters for heavy-tailed increments.

### Return probabilities and communicating classes

The recurrence simulation observes first return within 300 steps. That
probability is now computed independently by propagating the substochastic
nonreturned mass and drawn separately from the eventual return probability.
The readout reports finite-horizon bias numerically; it no longer claims the
sample necessarily converges to the eventual event. Tests include an explicit
chain whose one-, two- and three-step return probabilities are `0,1/2,3/4`,
as well as all five selected states at zero, small and large leak rates.
The transient geometric distribution is specified on `0,1,...`, excluding the
initial visit.

Communication permits a zero-step path on the diagonal, producing equivalence
classes even for a state which immediately exits forever. Durrett's particular
irreducible-set definition uses positive-time hitting probabilities on the
diagonal as well. The item now identifies the singleton exception instead of
calling every communicating class irreducible under both conventions. Node
wiring explicitly documents its absorbing-self-loop fallback for a row with no
selected outgoing edges. Actual pointer edits verify class separation/merging,
closedness, no-return singletons, fallback behavior and reset.

## Validation and limitations

- `node --test tests/verification-markov-foundations.test.mjs`: eight tests pass,
  covering independently specified transition counts, finite laws, harmonic
  equations, generating functions, exact cell ranges, full walk enumeration,
  killed-chain probabilities and the counterexample projection.
- `node tests/verification-markov-foundations.mjs`: all 16 light/dark scenario
  groups pass. Controls use actual keyboard slider changes, buttons and node
  clicks. The suite checks numerical plotted data, captions/readouts, whole
  path/bar/projection visibility, and runtime/TeX errors.
- Targeted static checking of all eight entries: zero errors and warnings.
- Representative captures were inspected at
  `/tmp/atlas-markov-ehrenfest-light.png`,
  `/tmp/atlas-markov-monotone-dark.png`, and
  `/tmp/atlas-markov-queue-dark.png`. Reflection and class captures are also
  saved by the browser suite in both themes.

Only the eight source flags listed above are cleared. The separate subjective
human sample and subjective audio listening remain pending; these entries have
no audio actions. This report does not close the central verification gate or
start Wave 5. Incidental unflagged birth-and-death issues identified in the same module were
reviewed separately in [the analytical follow-up](probability-birth-death-followup.md);
those corrections are not counted among this batch's eight queue resolutions.
