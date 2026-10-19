# Probability: conditional expectation, kernels and martingales — 2026-10-17

Resolved `prob-4.1.1a`, `prob-4.1.8`, `prob-4.1.15a`, `prob-4.1.17` and `prob-4.2.1a`. The custom `a` suffixes identify definitions that are unnumbered in the source; they do not claim that the book numbers those definitions. Human sampling and subjective listening remain pending, and Wave 5 remains gated.

## Primary source

Rick Durrett, *Probability: Theory and Examples*, fifth edition, author-hosted Version 5, January 11, 2019. The [author's edition page](https://sites.math.duke.edu/~rtd/PTE/pte.html) links the [PDF used for this audit](https://sites.math.duke.edu/~rtd/PTE/PTE5_011119.pdf). SHA-256: `aeac36cbf5e44c53d69fa60a2d29a393e2d0e8c955ee103bd845d925fd910886`. PDF page numbers are printed page numbers plus eight.

Read the unnumbered conditional-expectation definition and existence discussion, pp. 205–208, and partition Example 4.1.5; Borel's paradox, Example 4.1.8, p. 210; §4.1.3's unnumbered regular-conditional-distribution definition and continuation of Example 4.1.6, p. 214; Theorem 4.1.17 and proof, p. 215, with the nice-space definition and Theorem 2.1.22, pp. 53–54; and §4.2's unnumbered filtration/martingale definitions and Example 4.2.1, pp. 217–218. Inspected the printed definition page directly as well as extracted mathematical text. These are the author's mathematical statements and proofs. Unsupported Kolmogorov, Borel and Ville historical-priority assertions were removed rather than inferred from a modern textbook.

## Conditional expectation

The partition formula follows by applying the integral identity to each positive-mass cell; Radon–Nikodym gives existence, splitting positive and negative parts for an integrable signed variable. The current hypotheses and proof match this scope.

The original blue polyline did not depict exactly the variable used by the cell-average calculation. It now shows the actual 1,200-slice midpoint step variable. Since 1,200/48 is integral and coarse cuts snap to multiples of 1/48, every cell is an exact union of the underlying slices. For each coarse event, summing cell means times cell widths equals summing the same step values over those cells, up to floating-point rounding. Partial-cell events need not preserve integrals, but equality can occur accidentally: the caption no longer claims guaranteed failure for every nonmeasurable event. Coalesced handles create a smaller partition rather than zero-width cells.

## Borel's paradox

The source uses ordinary or folded spherical coordinates. The source of the discrepancy is the conditioning scheme, not a failure of rotational invariance of uniform area. Here the equatorial band restricts latitude, independently of uniform longitude. The meridian scheme restricts longitude modulo pi, independently of latitude; folding the two longitude branches gives density `|cos psi|/4` on `(-pi,pi]`. These coordinate laws are exact at every available finite width; the folded coordinate approaches position on the limiting meridian as the wedge shrinks. Widening a band does not mix either reference law toward the other.

The histogram uses all selected points in a fixed 20,000-point sample; only the sphere illustration culls back-facing points and thins the unselected background. Reference comparisons now integrate each bin exactly, rather than treating a midpoint density as bin mass. The readout reports empirical L1 discrepancies, without claiming that a finite discrepancy identifies a conditional law. The density range includes every actual histogram bar even at the narrowest width.

## Regular conditional distributions

The definition preserves Durrett's almost-everywhere probability-measure condition and requires measurable evaluations. For conditioning on a variable, exceptional conditioning values are measured under its marginal law. The density-ratio example is restricted to finite positive marginal density.

For `|rho|<1`, factor the joint standard bivariate Gaussian density into `phi(y)` times the `N(rho*y,1-rho²)` density in x. Integrating this identity over arbitrary measurable A and C proves the kernel identity by Tonelli. All y give a Gaussian probability measure; the displayed tests on selected intervals are illustrations, not an all-sets proof.

The display distinguishes analytic total mass one from Simpson integration over the finite interval eight conditional standard deviations either side of the mean. Monte Carlo rectangle probabilities include an estimated sampling standard error. Both heat-map colour range and conditional-density range include the sharp peak at the correlation endpoints. Empty and reversed input intervals are handled explicitly.

The neighboring unflagged `prob-4.1.16` explanation now distinguishes the existence of one probability kernel from a false assertion that all independently chosen versions of all conditional expectations share one exceptional set. Its per-fixed-function almost-sure theorem is unchanged. The neighboring picture also now uses exact Gaussian moment formulas (including the indicator), separates point conditioning from finite-bin averages, and bounds signed integrands using their analytic critical points. The cubic negative lobe is no longer clipped. These neighboring corrections are outside the five queue resolutions.

## Existence on standard Borel spaces

The proof now states the countability and tail steps that a finite picture cannot establish. Transport into a Borel subset B of the real line; choose rational conditional-probability versions, and discard the countable union of exceptional sets for monotonicity and limits at both tails. Right regularization by the infimum over all rationals above x gives a CDF. Conditional monotone convergence and a pi–lambda argument give measurable evaluations and the conditional-probability identity on all Borel sets. The resulting measure is supported on B almost surely; discard that extra exceptional set before pulling it back. A fixed Dirac measure supplies an exceptional-set extension.

The old noisy-dot picture did not consist of legitimate conditional-probability versions. The new model is `X~N(m,1)` independent of `Y~U[0,1]`. Each displayed version equals the Gaussian CDF except possibly when `Y=1/2`. Modifying a function at that single null value leaves a legitimate version. The ordinary slice is unchanged; repairing the designated exceptional slice chooses the Gaussian version there too. This supplies an actual measure-zero mechanism, rather than claiming that small random errors are null sets.

The finite suffix minimum remains explicitly a finite-grid approximation. Its left extrapolation can be positive, and the right empty infimum is set to one. The sampled maximum error is labeled as a maximum over 401 points, not a uniform norm. For ordinary/repaired slices, the Gaussian density bound gives interior error at most grid spacing divided by `sqrt(2*pi)`, with a separate finite right-tail error. The theorem itself still uses all rational points.

## Filtrations and martingales

The hypotheses are adaptedness, integrability and the almost-sure conditional-mean equality or inequality. For the displayed independent Bernoulli increments, `E(X_(m+1)|F_m)=X_m+2p-1`, giving the stated martingale/submartingale/supermartingale cases. The source explicitly explains the superharmonic etymology; the unrelated unsupported historical priority assertion was removed.

The former fixed vertical range clipped biased walks at the control endpoints. The range now includes all 40 visible paths, the empirical mean, the theoretical mean and next-step outcomes. The empirical mean over 2,000 plays is distinguished from `n(2p-1)`; its standard error at n=40 is `sqrt(4*p*(1-p)*40/2000)`. The conditional-mean ring remains attached to the chosen path and time rather than to the ensemble mean.

## Validation

- `npm test`: 47 math, 20 science-kit and 93 verification regressions pass after parallel integration (71 prior/foundations tests and 22 dedicated parallel-batch tests). The five new regressions enumerate every coarse event for four variables and four partitions, check the two Borel laws on an independent product area grid at three widths, compare 16 Gaussian kernels with 70-digit independent integrations, check null-slice changes, repairs and finite-grid errors, and independently integrate all four Gaussian functionals. The conditional-expectation floating-point tolerance is 2e-14; it does not claim symbolic exactness from rounded arithmetic.
- [Independent Gaussian reference generator](../../scripts/verify-probability-kernels.py) and [reference data](probability-kernel-references.json): mpmath error-function probabilities and adaptive integration in the opposite order (integrating X and `Y|X`, while the production code integrates Y and `X|Y`). Conditional probabilities agree within 2e-12 and joint probabilities within 2e-8 over the fixture set.
- [Browser interaction regression](../../tests/verification-probability-foundations.mjs) exercises the five entries and neighboring functional example in light and dark themes (12 scenario groups), real slider/select/toggle/button events and handle/canvas inputs. It checks cell-event distinctions and snapped cuts, normalized visible histograms, Gaussian peaks and empty intervals, null-slice repair behavior, and conditional-mean rings and complete visible path bounds. Direct screenshots cover the partition, Borel histogram, Gaussian kernel, finite CDF and biased walk. These are functional checks, not substitutes for the arguments above.
- Initial five-entry light/dark mode checks have no runtime, TeX, blank-canvas or quality warnings. Combined strict build and static validation pass with 6,684 items, 6,890 planned and 6,621 visualizations, no errors or warnings. The coordinating pass checks the chapter and all 33 corrected entry routes. None of these five entries has an audio control.
