# Probability convergence and maximal inequalities follow-up

Nine original source-review flags are resolved in this batch: `prob-4.3.11`, `prob-4.4.2`, `prob-4.4.4`, `prob-4.5.1a`, `prob-4.6.1a`, `prob-4.6.2`, `prob-4.6.3`, `prob-4.6.8`, and `prob-4.6.9`. This report covers their statements, proof sketches, attribution, controls and visual computations. It does not certify neighboring unflagged entries or complete the remaining Wave 3–4 gate.

## Source and numbering

The primary reference is Rick Durrett's author-hosted [Probability: Theory and Examples, fifth edition, Version 5](https://sites.math.duke.edu/~rtd/PTE/PTE5_011119.pdf), linked from the [author's edition page](https://sites.math.duke.edu/~rtd/PTE/pte.html). The reviewed PDF is dated January 11, 2019; its SHA-256 is `aeac36cbf5e44c53d69fa60a2d29a393e2d0e8c955ee103bd845d925fd910886`. Printed page numbers are eight below the PDF page numbers. Statements and proofs were read in the original text; PDF page 255 was also rendered and inspected to confirm the upward theorem and zero-one-law notation.

| Item | Printed pages / PDF pages | Verified scope |
|---|---|---|
| 4.3.11 | 231 / 239 | Critical nondegenerate Galton–Watson extinction; integer-valued nonnegative-martingale argument. The finite-variance survival asymptotic is an additional derivation below, not attributed to this theorem or assigned an unverified historical priority. |
| 4.4.2 | 235 / 243 | Submartingale maximal inequality, positive-part maximum, positive threshold, bounded stopping-time proof. |
| 4.4.4 | 236 / 244 | The positive-part maximum and terminal positive-part p-moment for 1 < p < infinity; proof truncates the maximum before applying Hölder and dividing. |
| 4.5.1a | 240 / 248 | Unnumbered increasing-process definition at the beginning of §4.5. The source assumes X₀ = 0; the item explicitly permits nonzero square-integrable X₀ and retains its initial second moment in the expectation identity. The stable suffixed item ID is retained. |
| 4.6.1a | 244 / 252 | Unnumbered uniform-integrability definition and its implication of an L¹ bound on a probability space. The stable suffixed item ID is retained. |
| 4.6.2 | 245 / 253 | The superlinear-moment sufficient criterion, without convexity needed for sufficiency. The unsupported 1915 credit and the extra converse not stated in this source theorem were removed. |
| 4.6.3 | 245–246 / 253–254 | Equivalence between UI and L¹ convergence under convergence in probability; the item states the equivalent (i)–(ii) portion. Removed the unverified historical credit. |
| 4.6.8 | 247 / 255 | Increasing fields, generated limiting field, integrable variable, a.s. and L¹ convergence, identification by the π–λ theorem. |
| 4.6.9 | 247–248 / 255–256 | Event in the generated limiting field, a.s. limit indicator; the independent-sequence tail-event deduction explicitly requires independence. |

Each reviewed item now includes a precise printed-page reference and a direct PDF-page link. Unsupported historical priority was removed; none was inferred from browser output.

## Corrected mathematics and displays

### Critical branching

The old shared branching sampler switched to a rounded normal approximation above 400 individuals. This reviewed item now uses a dedicated sampler with exact independent offspring draws throughout: Bernoulli 0/2, geometric on the nonnegative integers, and Knuth's Poisson(1) sampler. It no longer invokes the shared large-population approximation. The displayed exact survival sequence also uses the full mathematical laws, not truncated probability tables. The sample still has ordinary Monte Carlo error.

Starting at one ancestor, let sₙ be the survival probability. Its recurrences are sₙ₊₁ = sₙ − sₙ²/2, sₙ/(1+sₙ), and 1−exp(−sₙ), respectively. Their variances are 1, 2, and 1. Extinction gives sₙ → 0; the inverse increments converge to variance/2, so Cesàro averaging gives n sₙ → 2/variance. More generally, finite variance gives 1−φ(1−s) = s−variance·s²/2+o(s²), yielding the same argument. This supplies the extra asymptotic claim independently of the numbered source theorem. E[Zₙ | Zₙ>0] = 1/sₙ follows from E Zₙ = 1, and is not a claim that every surviving family has that size.

Removed the hidden cap of 40 on displayed family sizes and the cap of 1 on the orange asymptote. The right axis includes the actual asymptote even at the first generation, where it is not a probability prediction. The left bounds include every displayed family.

### Doob inequalities and increasing process

The maximal-inequality caption previously called the terminal exceedance expression a Markov bound and compared unlike expressions. It now distinguishes λP(Xₙ≥λ), λP(max Xₘ≥λ), and the actual Markov upper bound E Xₙ/λ. The readout labels all 5,000-path expressions as estimates and does not assert a chain of exact inequalities for a finite sample. Plot bounds include all estimated curves. Resampling changes the 50 illustrated paths; the reproducible 5,000-path numerical cohort stays fixed, as its controls indicate.

A finite time horizon alone does not imply finite p-moments. The Lᵖ proof now truncates the maximum, applies Hölder to a finite norm, handles the zero norm, and uses monotone convergence. Infinite terminal moments give an extended-real inequality. The visualization distinguishes exact terminal moments from simulated maximum moments, whose finite-sample estimates can miss the population ordering. Removed arbitrary finite clipping from the ratio/constant curves and made their scale logarithmic. The former cutoff at 30 was inactive over the present p≥1.05 input range; it was not a demonstrated numerical error in that range.

For the increasing process, the chosen filtration includes the initially revealed schedule coin in F₀. All step sizes are consequently predictable. The identity E Xₙ² = E X₀² + E Aₙ and compensation formula are unchanged and verified; removed an overbroad claim that a general discrete martingale has a Brownian time-change representation. The Monte Carlo compensated-square average estimates zero rather than lying exactly on zero. The main panel now includes both the sample path and ±√Aₙ, and the compensated-square panel includes its sample mean as well as the highlighted path.

### UI definition, superlinear criterion and L¹ convergence

For the two spike families, the red curve ranges over all positive integer indices while only six members are drawn. Thresholds use strict >, with open upper endpoints. The right panel is labelled as spike profiles on U, or densities for the continuous examples; it was misleading to call both displays probability laws in the same axes. Normal density peaks at the smallest displayed σ and the largest tail expectations now fit their axes. The threshold region remains meaningful when M exceeds 12; normal cap controls are hidden for families they do not affect. Zero tails are below the positive logarithmic axis and are identified as such.

For Pareto α≥α₀>1, the power criterion has exact C=α₀/(α₀−p) when p<α₀, and infinite moment otherwise. For x log(1+x), production now uses the proved uniform upper bound C=α₀/(α₀−1)²+1: log(1+x)≤log x+1/x, E(X log X)=α/(α−1)², and stochastic ordering places the largest moment at α₀. A separate quadrature estimate of the actual moment is labelled approximate; it is never relied on as a certified upper bound. Integration uses t=log x and includes an analytic omitted-tail estimate in the helper. The red criterion curve is therefore a valid theoretical upper bound independently of quadrature accuracy. Axis bounds are set before drawing and include every upper curve; irrelevant exponent controls are hidden for the logarithmic choice.

The L¹-convergence proof now justifies expectation convergence for bounded variables converging in probability directly by an ε-plus-tail-probability bound, rather than invoking an a.s.-convergence theorem without explanation. For Xₙ=nᵃ 1(U<1/n), all fixed-M tail-sequence suprema use the exact first allowed integer and strict threshold. At a>1 this supremum is infinity; the display labels infinity rather than drawing a fabricated value such as 10⁶. The remaining finite moments and tail curves have sufficient plot range. The distinction between n→infinity at fixed M and the full-family UI test M→infinity is explicit.

### Lévy upward theorem and zero-one law

The upward example's cell means now come from analytic antiderivatives for all four functions, including exact treatment of the two jump locations. The red curve is the maximum over 16,384 fixed midpoints, not a supremum over a continuum. For x⁻¹ᐟ² the true supremum error is infinity at every finite level; this is stated explicitly. Its top-panel height-6 clipping is disclosed. L¹ errors for the jump and unbounded examples are integrated exactly by splitting at jumps or at the conditional mean crossing; smooth/rough examples are labelled midpoint quadrature. Pointwise error uses the actual function value, and finite-sample maximum/error curves are all included in the lower bounds. The plotted log floor does not prove uniform convergence or turn numerical zeros into positive errors.

The zero-one-law statement explicitly defines the generated limiting field. The tail-event deduction now requires an independent underlying sequence; the hidden-coin mixture is dependent and its event has probability 1/2, consistent with Lévy's law. Conditional on the latent drift, the strong law identifies eventual positivity with positive drift almost surely. Full-history Bayes likelihood depends only on Sₙ and yields logistic(Sₙ log ρ). The implementation uses a stable logistic formula. The gold points are estimates of the latent label in an independent cohort of 11,990 paths at matching positions; they do not simulate an infinite future. A minimum of 20 matching paths, point counts, and the largest estimated pointwise standard error are displayed. Finite paths and the theorem concern a.s. convergence, not every possible infinite sequence.

## Checks and limits

- `node --test tests/verification-probability-convergence.test.mjs`: **seven groups pass**. Exact binary offspring enumeration reaches population 1,024 without invoking an approximation; analytic critical survival and independent sample moments agree; dyadic tower identities and means agree with independent quadrature; unbounded L¹ error agrees with integration after x=t²; spike thresholds and infinity cases agree with exact formulas; Bayes agrees with full-history likelihoods; the logarithmic Pareto moment agrees with an independent inverse-variable integral; exact enumeration of finite walks verifies both Doob inequalities; all four predictable schedules satisfy exact conditional compensated-square identities by exhaustive finite-tree averaging.
- `node tests/verification-probability-convergence.mjs`: **18 light/dark input groups pass**. Actual keyboard input exercises every selector and slider endpoint; buttons resample paths; pointer drags move the Lévy probe through near-boundary and interior locations. The checks inspect plotted ranges, source-derived labels, error-free readouts and TeX, unbounded-supremum disclosure, and the absence of a fabricated finite infinite-tail curve. A narrow criterion-only rerun also verifies every curve is drawn in the final updated axis window after changing the Pareto parameters.
- Node syntax checks and `git diff --check` pass for the owned files. No global build or central queue/master-plan edits were performed by this parallel worker; those remain the integrating agent's responsibility.
- Representative product screenshots were inspected directly, including the unbounded Lévy example, critical branching and normal UI densities in light/dark. The rendered source page was also inspected. There are no sound controls in the nine reviewed entries.

The dedicated helper is `content/prob/ch04-convergence.audit.js`; existing shared probability helpers were preserved. These checks support the nine resolved source reviews. They do not establish the correctness of every other item in the files or satisfy the Wave 5 verification gate.
