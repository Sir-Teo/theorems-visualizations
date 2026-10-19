# Birth-and-death analytical follow-up — 2026-10-17

This separate follow-up corrects two previously unflagged neighbors,
`prob-5.3.8` and `prob-5.3.11`. It does not remove additional queue entries or
change the eight resolved Markov-foundation IDs.

The primary source is Durrett, *Probability: Theory and Examples*, Version 5,
January 11, 2019, [author PDF](https://sites.math.duke.edu/~rtd/PTE/PTE5_011119.pdf),
SHA-256 `aeac36cbf5e44c53d69fa60a2d29a393e2d0e8c955ee103bd845d925fd910886`.
Theorem 5.3.8 is on [printed p. 285 / PDF p. 293](https://sites.math.duke.edu/~rtd/PTE/PTE5_011119.pdf#page=293).
The scale construction and Theorem 5.3.11 are on
[printed p. 286 / PDF p. 294](https://sites.math.duke.edu/~rtd/PTE/PTE5_011119.pdf#page=294).
The theorem hypotheses and conclusions match these pages. The displayed chains
have no holding probabilities and reflect from zero to one; this is an explicit
special case of the source's more general birth-and-death construction.

## All-state Lyapunov certificates

The old display inspected the drift only through state 400, then claimed that a
finite exceptional set had been found and the theorem applied to every larger
state. Finite inspection cannot establish that conclusion. Its numerical
threshold could also treat a small positive drift as zero.

The replacement draws the first 60 state drifts as illustrations, but derives
the actual conclusion analytically. For the displayed up-probability
`p_x=1/2+b/(x+1)` and `b≥0`:

- For the linear function, drift is `2b/(x+1)`. It is zero for every positive
  state when `b=0` and positive at every positive state when `b>0`.
- For the square, drift is `1+4bx/(x+1)`, always positive. This function cannot
  satisfy the criterion outside a finite set.
- For `log(1+x)`, put `u=1/(x+1)`. The exact drift is
  `log(1−u^2)/2 + b*u*log((1+u)/(1−u))`, with convergent series
  `sum_{k≥1} u^(2k) * (2b/(2k−1) − 1/(2k))`.
  When `b≤1/4` all coefficients are nonpositive; at `b=1/4`, the leading
  coefficient vanishes and all subsequent coefficients are negative. Thus the
  criterion holds with exceptional set `{0}` throughout this range. For
  `b>1/4`, the positive leading term `(2b−1/2)/(x+1)^2` makes the drift eventually
  positive, so this function does not satisfy the criterion for any finite
  exceptional set.

The implementation evaluates that series to avoid cancellation at the critical
parameter. In particular the drift at state one million and `b=1/4` remains
negative; it is not rounded to zero and used to certify an untested region.
Failure of a particular function is explicitly distinguished from a conclusion
that the chain is transient.

## Scale sums and true small escape probabilities

The old display decided infinite-series convergence by comparing only three
finite sums. It also silently clipped transition probabilities, capped enormous
partial sums, floored small exact escape probabilities at `1e-4`, and replaced
zero empirical escape frequencies by a positive plotting surrogate.

The replacement uses the actual, unclipped family probabilities. The parameter
range is `[-.2,.45]`, so all positive-state probabilities lie strictly between
zero and one, including the constant family. The boundary `p_0=1` and the
positive-time first-return convention in the escape probability are explicit.

Infinite classification follows analytic calculations:

- For the inverse family, the product of the down/up ratios is
  `Gamma(m+2−2b)*Gamma(2+2b)/(Gamma(2−2b)*Gamma(m+2+2b))`.
  It is asymptotic to a positive constant times `m^(−4b)`, so the source's scale
  criterion gives recurrence exactly for `b≤1/4`. At the critical value the
  product simplifies to `3/(2m+3)` and the scale sum grows like `1.5*log M`.
- For the square-root family with `b>0`, expanding the logarithm gives a product
  logarithm `−8b*sqrt(m)+O(1)`. Those summands are summable. When `b≤0` each
  down/up ratio is at least one and the sum diverges.
- For the constant family, the summands are a geometric sequence with ratio
  `(1/2−b)/(1/2+b)`. The sum diverges exactly when `b≤0`.

The plotted finite sums are accumulated using logarithms and log-sum-exp; the
left vertical coordinate is explicitly `log10 s(M)`. At the negative constant
extreme, `log10 s(10000)` is about 3679.643, so the true sum exceeds the
floating-point range by thousands of orders of magnitude. It is still drawn
without an artificial plateau.

Exact finite-interval escape probabilities use `exp(−log s(N))`, with no
probability floor. At the same parameter, escape to level 64 is about
`3.75e-24`, visible on the adaptive logarithmic probability axis. Its Monte
Carlo sample typically has zero successes; this is recorded as zero, not a
positive frequency. Hollow downward markers instead display the exact
one-sided 95% binomial upper bound after zero successes:
`u=1−.05^(1/3000)≈.000998`. This follows directly by solving
`P_u(zero successes)=(1−u)^3000=.05`. Captions, legend and readout identify the
bound separately from observed frequencies. Marker positions lie inside the
horizontal view, including level 64.

## Independent checks and limitations

`scripts/verify-birth-death.py` generates
`docs/verification/birth-death-references.json` at 80 decimal digits. Its 60
reference drifts use direct function differences rather than the production
series. Its 72 scale references multiply and sum the actual probabilities with
arbitrary precision rather than using production log-sum-exp. The drift
references include states 1, 10, 400 and one million, and the scale references
include horizons through 10,000.

- `node --test tests/verification-birth-death-followup.test.mjs`: five tests pass.
  These compare all 132 independent references, critical signs, analytic
  parameter boundaries, the critical telescoping product, geometric scale sums,
  finite-interval harmonic equations and the zero-success probability bound.
- `node tests/verification-birth-death-followup.mjs`: four light/dark scenario
  groups pass. Actual keyboard controls cover each function/family, critical
  and nearby parameter values, negative/zero/maximal parameters and resampling.
  Plotted values, classifications, limits, marker semantics and runtime/TeX
  errors are checked.
- Targeted static and whitespace checks pass.
- Representative critical-drift and huge-scale captures were inspected;
  representative files are `/tmp/atlas-birth-death-critical-drift-light.png` and
  `/tmp/atlas-birth-death-huge-scale-dark.png`.

The finite samples illustrate the now justified analytical conclusions. They
are not proofs of recurrence, convergence or an infinite-time outcome. This
follow-up adds no queue-count reduction and does not complete subjective human
or listening checks.

The coordinator also corrected the adjacent `5.3.10` wording from all integers to the nonnegative integers, specified reflection at zero and restricted its interior probabilities to i>=1 and exit interval to 0<=a<x<b. This matches the source setup in Example 5.3.9 and the unchanged finite UI. It does not change the numerical algorithm or queue count.
