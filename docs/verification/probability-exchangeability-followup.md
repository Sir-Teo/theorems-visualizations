# Probability: exchangeability, stopping and arcsine laws — 2026-10-17

Reviewed and resolved the seven assigned source flags: `prob-4.7.1a`, `prob-4.7.9`, `prob-4.7.10`, `prob-4.8.6`, `prob-4.9.1`, `prob-4.9.5`, and `prob-4.9.6`. This report covers those seven entries, rather than the other unflagged entries in the same chapter modules. Subjective human sampling/listening and the Wave 5 verification gate remain open.

## Primary source

Read Rick Durrett, *Probability: Theory and Examples*, **Version 5, January 11, 2019**, from the [author-hosted PDF](https://sites.math.duke.edu/~rtd/PTE/PTE5_011119.pdf). SHA-256: `aeac36cbf5e44c53d69fa60a2d29a393e2d0e8c955ee103bd845d925fd910886`. Printed page numbers are eight below the one-based PDF page numbers.

| Item | Exact source anchor |
|---|---|
| 4.7.1a | Unnumbered reverse-martingale definition immediately before Theorem 4.7.1, printed p.249 / PDF p.257. The `a` suffix is the atlas's stable definition identifier. |
| 4.7.9 | Theorem 4.7.9 and proof, pp.253–254 / PDF pp.261–262. The paragraph following the proof distinguishes conditional independence from representation by a random probability measure on a nice space. |
| 4.7.10 | Theorem 4.7.10 and continuation, pp.254–255 / PDF pp.262–263. Arbitrary zero/one patterns follow from exchangeability. |
| Urn example | §4.3.2, pp.226–227 / PDF pp.234–235: finite-pattern product, exchangeability, martingale proportion and limiting Beta density. |
| 4.8.6 | Theorem 4.8.6, §4.8.1, p.257 / PDF p.265. This section explicitly fixes the natural increment filtration. |
| 4.9.1 | Theorem 4.9.1 and first-zero reflection bijection, p.263 / PDF p.271. |
| 4.9.5 | Lemma 4.9.4 and Theorem 4.9.5 with proof, pp.265–266 / PDF pp.273–274. |
| 4.9.6 | Theorem 4.9.6 and first-return induction, pp.266–267 / PDF pp.274–275. |

Removed historical priority/date credits for de Finetti/Hewitt–Savage, Wald, André and the arcsine laws. These source checks establish the mathematics and numbering; they do not establish original-publication chronology. In particular, Durrett's post-theorem discussion cites Hewitt–Savage (1956), while the previous atlas credit said 1955. No claim that a particular date is the first publication remains.

## Reverse martingale and exchangeability

The reverse definition now distinguishes decreasing fields as sample size increases from increasing fields in ordinary negative-index time. The running-mean example starts at sample size one and terminates at time minus one, avoiding the undefined expression `S_0/0`. Conditional-on-the-next-mean regression is explicitly a consequence of the full filtration identity, not its definition. Bin means have finite-sample discrepancies. Both the five paths and the full 1,500-point scatter are kept in view, replacing fixed path limits and a percentile crop of the scatter.

The de Finetti statement specifies a nonempty standard Borel value space for its random probability kernel. The proof uses countable determining classes and regular conditional distributions for the kernel representation; the finite urn plot is an illustration of a particular exchangeable law.

The previous urn readout compared first-two-draw frequencies in a window of a **finite** proportion to the square of that window's mean. Two distinct issues made that comparison invalid: finite-horizon conditioning does not give independence, and mixing over a nonzero-width window requires averaging products rather than squaring the mean. The corrected display calls the proportion `(a+S_600)/(a+b+600)` a finite proxy. Given `S_N=s`, every binary pattern with that count has the same probability, so the exact conditional first-pair probabilities are

`RR = s(s−1)/(N(N−1))`, `RB or BR = 2s(N−s)/(N(N−1))`, `BB = (N−s)(N−s−1)/(N(N−1))`.

The readout averages these three probabilities over the selected urn counts and compares them with the selected empirical frequencies. Empty windows get an explicit message. Positive half-integer controls represent urn **weights**, which have the same rising-factorial calculation and Beta limit; they are not claimed to be fractional literal balls. The Beta density is explicitly truncated away from its possible endpoint singularities. Its displayed curve and all histogram bars fit in the panel.

The coin-mixture demo previously simulated only `n` draws, even when comparing the first eight coordinates with the eight-head moment. At the allowed value `n=5`, its sixth through eighth estimates were therefore identically zero. The corrected sampler generates `max(n,8)` coordinates, uses only the first `n` for frequency, and all eight for the run comparison. The two-atom view now uses actual atom **probability masses**, alongside histogram bin masses; the previous arbitrary stem-height scaling has been removed. Continuous views retain density units and explicitly truncated continuous curves. Empirical means are no longer printed as exact equalities with their population mean. The limiting-frequency law and its uniqueness follow from the theorem and moment determination on the compact interval, not from a finite histogram.

## Wald and reflection

Wald's statement now fixes the natural increment filtration, which supplies the independence of `{N≥k}` from the next increment. Integrability of the dominating stopped sum follows by Tonelli and `E sum_{k≤N}|xi_k−mu| = EN E|xi_1−mu|`; dominated convergence then gives the identity. The demo always shows the bounded stopping time `N∧2000`, including negative-drift and unfinished runs. It now counts **all 6,000** samples in its histogram, including the maximum and the far tails. Its view includes the stopping barrier. Both mean whiskers fit in the panel. Because the two estimates use the same paths, the readout also reports the mean paired residual `S_{N∧T}−mu(N∧T)` and its Monte Carlo standard error. Sampling whiskers are described as approximate.

The reflection statement now gives integer start/end/time assumptions and the zero convention for nonintegral or out-of-range binomial arguments. Controls preserve the selected endpoint: incompatible parity or reach produces an explicit no-path message rather than silently increasing the endpoint beyond the slider's maximum. The selectable index now covers every possible touching path in the allowed `n≤16` range and reports the clamped effective index. The binomial count uses an exact finite product rather than exponentiating log factorials. A reachable-bridge envelope keeps reflected and original paths visible. First-zero reflection is an involution and preserves the endpoint and nearest-neighbor property; every reflected path from a negative start to a positive endpoint crosses zero, so this proves the bijection.

## Arcsine laws

The last-zero definition includes time zero and the final time. The occupation-time statement fixes start zero, integer horizon, all count values, and the convention for a segment touching the axis: the interior of a positive segment is above zero. Equivalently its midpoint is positive, or `max(S_{k−1},S_k)>0`; neither strictly-positive vertices nor zero visits are being substituted.

The exact finite law is `u_{2k}u_{2n−2k}`, with `u_{2j}=choose(2j,j)/4^j`. The first-return decomposition in 4.9.6 includes positive/negative first excursions and the no-return case; it gives the same law. The limiting integral follows from the local binomial asymptotic uniformly on compact interior intervals. The display does not claim a finite simulation proves the asymptotic theorem.

The old fixed density height clipped endpoint masses, especially at `n=5`. Both diagrams now include all bars. The limiting comparison uses exact integrals of the arcsine CDF over the same bins: endpoint bin averages are finite and integrate to their correct mass, so there is no fabricated cap for an infinite density. Finite occupation bars and limiting averages use separate colours. The discrete and empirical CDFs are actual staircases, rather than linear interpolation through atoms. The Kolmogorov distance checks both sides of every atom; its displayed curve is correctly described as **sampled horizons**, includes 1,000, and labels the marker's exact finite calculation. The endpoint atom supplies the stated rigorous lower bound `distance ≥ u_{2n}`; no unsupported upper-rate claim remains. All eight occupation paths now fit their actual sample range.

## Reproducible checks and limits

- `node --test tests/verification-probability-exchangeability.test.mjs`: **9 tests pass**. Independent enumeration checks all finite count fibres through length 12 for conditional first-pair probabilities, all 256 eight-coordinate coin patterns, and sequential Pólya probabilities for five parameter pairs through eight draws. Complete enumeration of all `2^16` paths checks **both** discrete arcsine laws through `n=8`, using positive segment midpoints independently of the production `max` convention. Normalization is also checked at n=5,25,100,400,1000. Reflection is checked for every short endpoint through horizon 10, including the explicit involution. Asymmetric stopped-tree summation checks Wald at three barriers through horizon 12. Reverse conditional means are checked on every finite ±1 sum fibre through 11 coordinates. Beta densities and moments are checked against independent factorial/half-factorial Beta integrals, including both Beta(20,60) and Beta(60,20) mixtures. Histogram mass and step-CDF geometry receive direct regression checks.
- `node tests/verification-probability-exchangeability.mjs`: **14 light/dark scenario groups pass**, with real clicks, keyboard slider changes, resampling and gold-window drags. These cover all three reverse laws and n endpoints; four urn shape corners, both window-width endpoints and three window positions; all four coin mixing laws, n=5/2000 and atom-weight endpoints; all three Wald laws and normal drift/level endpoints; reflection endpoint/parity combinations and last touching index; both arcsine horizons and all histogram samples. Captured graphics verify unclipped bars/whiskers, actual step CDFs, full scatter/path extent, normalized histograms and exact atom-mass units. No runtime or TeX errors.
- Inspected representative light and dark screenshots for urn, eight-head mixture at n=5, negative-drift Wald, invalid reflection parity, and both arcsine views. This is agent visual inspection of the named scenarios; it does not complete the separately requested human sample review.
- No audio controls are present in these seven entries. No subjective listening is recorded. Global build/static/smoke and central queue/master-plan reconciliation are performed by the coordinating agent after combining parallel batches.
