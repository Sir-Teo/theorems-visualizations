# Mathematical hypotheses and numerical boundaries

Seven sample follow-ups were reviewed and corrected:

| Item | Result |
|---|---|
| fa10.24 | Scope the widget to nonnegative powers, state invertibility/zero-winding requirements for negative powers, qualify quadrature accuracy, label proximity rejection accurately and show the actual scaled Frobenius norm denominator. Remove the artificial additive error floor. |
| fa10.31 | Specify positive annihilating-polynomial degree, distinct roots and positive multiplicities; verify Hermite/value-only interpolation at zero and nonzero Jordan entry. |
| ladr9.16 | State characteristic different from two in the standalone alternating/skew-symmetry equivalence. |
| ladr3.76 | Verify the existing guard rejects degenerate domain and codomain bases separately and together; distinguish near-singularity rejection from exact mathematical dependence. |
| ladr3.130 | Explain the rank1 null plane/dual-range line, minimum-norm producing functional and nonzero-handle limit. Fix the projected-zero fallback to remain in the annihilator. |
| prob4.3.11 | Specify one initial ancestor, required for the stated mean and survival asymptotic. |
| nt3.11 | Exclude even composites with the unit −1 before invoking cyclic unit groups of odd prime powers; mirror the existing CRT dependency in the syllabus. |

The dual-range fallback used the ambient x-axis when the projection vanished,
although that axis is outside the displayed row space. It now uses the first
orthonormal row-space direction. An actual-widget snap regression tests
both ranks at exact and near-zero projections: norm .25, null orthogonality,
and row collinearity at rank1. The underlying duality calculation is unchanged.

The contour readout divided errors by max(||xⁿ||F,10⁻¹²) but displayed an
unscaled norm. It now shows that denominator and scaled Frobenius norms,
without adding 10⁻¹⁷ to measured errors. Contour quadrature is unchanged.

## Validation

The main native pass covers 56 states across seven pages and both themes.
A focused pass covers 20 states on the contour and dual-range pages,
including a contour enclosing exactly one eigenvalue and a reverse-origin
drag; it was repeated after the final contour labels. All captures were
inspected. Runtime and TeX checks pass. These represent 60 distinct
page/theme/control cases, with repeats for changed pages.

Three existing FA10 math groups pass, including an independent power-series
check of the Hermite derivative term. The new dual-range snap regression
passes. A first native assertion expected 50% Fermat pass rate at n=8;
the correct 1/4 rate was already displayed, and only that assertion changed.
A guessed NT test filename did not exist; no NT unit-test credit is claimed.
Strict build, full regressions, review hashes and generated packets are
checked before commit.

Artifacts: `/tmp/agent-review/math-boundary-browser.{mjs,json}`,
`math-boundary-focused-browser.{mjs,json}` and named PNGs. These changes
close sample follow-ups without original-source, human-review or listening
credit. Source flags and cross-field prerequisite counts are unchanged.
