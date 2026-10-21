# Heat-ball and Tychonoff review — 2026-10-17

Resolved the two remaining queued PDE source reviews, `pde-3.11` and `pde-3.12`.

## Sources

Read [Baisheng Yan's author-hosted heat-equation notes](https://users.math.msu.edu/users/yanb/847ch3.pdf):
Theorem 4.4 and its derivative estimate (printed pp. 6–7), Theorem 4.12
(uniform strip growth condition, p. 12), and Theorem 4.16 with its normalization
calculation (pp. 16–18). These replace the generic Evans pointer in the two entries.

Also inspected the original [Suzuki–Watson mean-value abstract](https://www.mathsoc.jp/section/complex/PDF/1999_2.pdf#page=30),
printed pp. 25–26. Its heat-ball definition and integral normalization agree after
putting `c=r²/(4*pi)`. Removed the unverified Fulks-versus-Watson priority narrative;
the entry now attributes its presentation to the source actually checked.

The [journal's Tychonoff record](https://www.mathnet.ru/eng/sm6410) confirms author,
title, 1935, volume 42(2) and pp. 199–216. The modern parameterization is checked
against Yan's theorem, not claimed as a transcription of the original paper.

## Mathematical and numerical corrections

The Tychonoff entry incorrectly claimed super-Gaussian growth at every fixed
positive time. Uniqueness requires growth constants uniform on a whole time
strip. The Cauchy estimate instead gives a Gaussian bound at each fixed time,
with time-dependent constants. The proof now records that distinction explicitly.

Its old claimed rounding bound was invalid: the supposed circle maximum only
looked at the positive real axis. For alpha=1.9, t=0.15 and rho=0.85, sampling the
actual complex contour already exceeds that bound by almost **35 orders of
magnitude**. The code also omitted contour quadrature aliasing and used recent
terms as if they bounded the entire omitted series.

The replacement stores Taylor coefficients rather than overflowing factorial
derivatives, uses compensated sums, bounds the full contour using its angular
extent, bounds discrete Cauchy aliasing on a larger circle, and bounds the entire
remaining series by its decreasing term ratio. Roundoff remains an estimate;
the UI explicitly avoids claiming an interval-arithmetic certificate. Rejected
probe values and unreliable finite differences are omitted. Small values are
omitted from logarithmic plots rather than being raised to a fictitious floor.

For heat balls, the change of variable `a=b²` removes the fractional endpoint
behavior from the quadrature, and the transformed weight avoids division by tiny
time depths. Constants now reproduce to about 3e-15; exact caloric polynomials,
an exponential/cosine solution and a shifted kernel agree across the control
extremes. For the non-solution x², the defect is independently
`r²/(2*pi*3^(5/2))`. Both the full ball and signed cumulative integrals stay in view.

Three neighboring unflagged corrections are recorded separately from the queue:

- `pde-3.13`: specified the L2 initial-data class and weighted Fourier existence
  criterion; labelled the exponent cap used for rendering instead of overflowing
  the theoretical amplification readout.
- `pde-3.14`: retained the Gaussian factor in the diffusive-scale asymptotic,
  supplied the kernel-translation/dominated-convergence argument, and stopped
  applying the whole-line decay estimate to an insulated bar. Added a defined
  zero-heat state and corrected plot bounds.
- `pde-3.15`: diffusivity is half the mean-square displacement growth rate in
  one dimension, rather than displacement per time.

## Independent evidence and checks

[tychonoff-reference.json](tychonoff-reference.json) contains 66 independently
computed probes. [The extraction script](../../scripts/verify-tych.py) uses real
power-series recurrences with `mpmath==1.3.0`, independently of the JS contour
algorithm. It requires agreement between 200-digit/400-term and
300-digit/600-term evaluations before writing any references.

Of the 132 value/derivative comparisons, the JavaScript algorithm accepts **110**
and rejects **22**. Every accepted result agrees with its reference within the
reported estimate; the worst observed relative error is below 1.6e-11.
These are sampled validation results, not a proof of every floating-point value.

- `npm test`: 47 math, 20 science-kit and **26 content-verification tests** pass.
- `node tests/verification-diffusion.mjs`: 24 heat-ball function/radius/corner
  states; accepted/unfloored Tychonoff curves at both exponent extremes; eight
  accepted/rejected probe states; maximum backward amplification; insulated-bar
  behavior; and a zero-heat case made with three real pointer drags.
- Five affected visualizations checked in light/dark and selector modes, with
  representative screenshots inspected. Strict build and full static validation
  pass; the chapter and both reviewed item routes pass smoke checks.

The source queue now contains **826** pending reviews. Wave 5 remains gated.
