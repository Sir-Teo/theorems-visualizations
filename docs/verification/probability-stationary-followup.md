# Probability: stationary measures and return times — 2026-10-17

Resolved the five queued entries `prob-5.5.1a`, `prob-5.5.2a`, `prob-5.5.6`, `prob-5.5.11` and `prob-5.5.11a`. Closely related unflagged corrections cover the initialization in `5.5.5`, empirical residuals in `5.5.7` and capped-mean interpretation in `5.5.12`. Those neighbors do not reduce the queue count. Wave 5 remains gated.

## Primary source

Rick Durrett, *Probability: Theory and Examples*, fifth edition, author-hosted Version 5, January 11, 2019. The [edition page](https://sites.math.duke.edu/~rtd/PTE/pte.html) links the [reviewed PDF](https://sites.math.duke.edu/~rtd/PTE/PTE5_011119.pdf), SHA-256 `aeac36cbf5e44c53d69fa60a2d29a393e2d0e8c955ee103bd845d925fd910886`. Printed page numbers are eight below PDF page numbers.

Read the stationary-measure definition, pp. 299–300/PDF pp. 307–308; Examples 5.5.1–5.5.2 and the unnumbered reversible-measure definition, p. 300/PDF p. 308; Theorems 5.5.5–5.5.6 and proofs, pp. 301–302/PDF pp. 309–310; the excursion measure and uniqueness discussion, pp. 302–305/PDF pp. 310–313; and Theorems 5.5.10–5.5.12 with the positive/null definition, pp. 305–307/PDF pp. 313–315. Rendered and directly inspected the cycle-condition page. The suffixed stable IDs identify unnumbered definitions, not numbered examples. Removed unsupported 1936 and 1947 timeline credits; the conventional theorem names are retained without historical-priority assertions.

## Definitions and mass conservation

Stationary measures have nonnegative finite singleton masses, possibly infinite total mass, and are nonzero. A finite nonzero invariant measure normalizes to an invariant probability. An infinite stationary measure alone does not exclude a stationary probability in another closed class; the previous explanation asserted too much. Finite-chain existence is now justified by compactness of Cesàro averages rather than an unexplained inference from the right eigenvector.

The original independent bar controls could have total mass greater than one. Their next vector could then contain entries greater than one, but “Step” silently clipped those entries to one, violating mass conservation. It now applies the complete matrix product; controls and axes accommodate the resulting masses. All-zero inputs get an explicit exclusion message. A small positive mass is displayed in scientific notation when decimal rounding would show zero. The readout reports a numerical residual and floating-point tolerance rather than declaring a vector stationary when its error is below 0.004.

Detailed balance implies stationarity by summing nonnegative terms over the departure state. The finite birth–death example satisfies adjacent balance. For the four-state ring with forward probability a, backward 0.9−a and holding 0.1, uniform probability is stationary and each clockwise imbalance is `(2a−0.9)/4`, vanishing exactly at a=0.45. Numerical flow residuals are checked against these analytic conclusions.

## Cycle condition: corrected quantifier and control

Durrett 5.5.6 characterizes **existence of a reversible measure**, not reversibility of an arbitrary preassigned stationary measure. The original statement and proof conflated those assertions in transient chains. A direct counterexample is a biased nearest-neighbor walk on Z: counting measure is stationary, and every closed path has equally many left/right steps so the cycle condition holds, but its edge flows p and q differ. The positive measure `(p/q)^x` is reversible. The source's path-product construction is now stated with the correct existence quantifier. Finite irreducible uniqueness justifies using the normalized stationary law in the displayed ring.

The original button adjusted only f3, clipping it when the target product could not be attained inside its allowed interval. The result could remain nonreversible after clicking “Make reversible.” The corrected button projects all four log probabilities onto `sum(log fi)=4 log(0.3)` with every fi in `[0.1,0.65]`. A common shift followed by clipping is monotone in the shift; the all-minimum and all-maximum endpoints bracket the target. Bisection finds an attainable value for every allowed corner. Products and actual unscaled edge-flow defects now occupy separate panels; arbitrary rescaling no longer hides the units of an edge defect.

## Mean return formula and finite simulations

The excursion measure has value one at the base and total mass `E_x T_x`. Uniqueness gives `pi=pi(x)*mu_x`; summing proves `1=pi(x)*E_x T_x`, including finiteness. The old proof incorrectly attributed finiteness directly to 5.5.10, which only establishes recurrence. The proof now uses the positive proportionality constant explicitly.

The finite-chain examples compute reference stationary probabilities numerically and compare reciprocal sample return means. These reciprocals are not unbiased estimators. Every simulated excursion has a 100,000-step cap; its completion/censoring status is retained, and the readout counts censoring and reports the mean's estimated standard error. The bounded observed variable is `T_x wedge 100000`, distinct from the uncapped mean when censoring occurs. No censoring occurs in the exercised seeded finite-chain scenarios; a deterministic regression explicitly exercises the censoring path.

The neighboring time-reversal example claimed a stationary run while initializing uniformly. It now samples its initial state from the computed stationary probability. Its estimated reversed transitions are described as fluctuating around the dual kernel. The cycle-trick example also labels `mu_hat P−mu_hat` as a finite-sample residual, rather than saying stationarity forces an empirical equality, and includes every transformed bar in the plot range.

## Positive/null recurrence and censored survival

For the reflecting walk, 0 moves to 1; all positive states move up with p and down with q=1−p. The first-return law is

`P(T0=2n)=Catalan(n−1)*p^(n−1)*q^n`.

The eventual return probability is one for p≤1/2 and q/p otherwise. For p<1/2, the finite mean is `1+1/(q−p)=2q/(1−2p)`; at p=1/2 it is null recurrent, and for p>1/2 it is transient, with an infinite uncapped mean. At p=1/2, `P(T0>2n)=choose(2n,n)/4^n`, and the next odd-time tail has the same value. Stirling gives the nonsummable inverse-square-root tail.

The old display treated every unreturned run as though it returned at the cap when computing its survival curve. This forced the endpoint survival to zero, then replaced zeros with a fabricated positive floor. Censored runs now continue to count in `P(T0>t)` through the observed cap. The left panel compares the sample mean of `T0 wedge 5000`, its theoretical capped mean and the uncapped mean only when finite. The recurrence-based survival curve and sampling curve are separate; values below the positive log window are explicitly omitted.

The critical survival formula is computed directly by a central-binomial recurrence. Away from p=1/2, summing first-return masses backwards avoids subtracting a nearly-one CDF from one. Consecutive first-return masses have ratio below `4pq<1`, so an omitted tail beginning with next mass f has bound `f/(1−4pq)`. That bound is reported separately from floating-point roundoff. At the allowed grid values, its largest value is below 1e−18. Capped means follow from the tail sum through time 4999. For example, at p=1/2 the capped mean is about 112.8323 despite the true mean being infinite, and survival at 5000 is about 0.0112832. At p=0.7 the tail approaches 4/7, not zero.

The neighboring class-property illustration now states that its bars are finite sample means of `T_x wedge 5000`. They are not all equal to the censoring level, and their products with pi include both censoring bias and sampling error.

## Independent verification

- [Reference generator](../../scripts/verify-stationary.py) and [data](stationary-references.json): exact Fraction arithmetic solves stationary balance equations and separate first-step hitting equations for all three finite example chains. Fourteen 70-digit reflecting references use Catalan binomial coefficients and a Gauss hypergeometric tail, independently of the production truncated-tail summation; capped means use weighted first-return sums.
- `node --test tests/verification-stationary.test.mjs`: six groups cover all exact finite references and mass conservation, all 81 three-level ring corners and actual detailed balance, the biased-walk quantifier counterexample, independent killed-state evolution at every offered p through 80 steps, 70-digit tail/capped-mean references, and explicit completed/censored sampler cases. Tail tests include the production omission bound; they do not treat a numerical zero below that bound as an exact zero.
- `node tests/verification-stationary.mjs`: real mouse/keyboard controls cover the five reviewed entries and three neighboring entries in both themes. Tests drag masses above one and to zero, check conservation under stepping and normalization, exercise every ring corner and its corrected button, check finite Kac sample sizes/censoring/error readouts, and inspect all three return regimes and near-critical values. They also verify full bar/path ranges and the positive survival contribution of censored runs at the cap. All 16 light/dark groups pass, without runtime or TeX errors. Combined strict build and full static checks pass without errors/warnings, as do the chapter-5 route and all 37 reviewed/corrected entry routes. Global test totals are recorded centrally.
- Direct source and representative product screenshot inspections supplement the proofs and independent computations. These eight entries have no audio control.
