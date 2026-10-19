# Optimization grid: agent sample finding

At b = 2.5, `opt-4.3` searches an x-grid with spacing 0.002 and
returns x = 1.580 in both its original and slack formulations. The
exact constrained optimizer is √2.5 ≈ 1.581139. Consequently the
grid point has positive slack 2.5 − 1.580² = 0.0036, displayed as
0.004, even though the exact constraint is active. The previous
readout attached the claim “zero exactly when active” to this grid
residual without distinguishing it from the exact optimum.

The caption, marker, legend and readout now label grid estimates.
The exact closed-form optimizer is separate. Sublevel endpoints
are reported as the span of feasible grid points, and an empty
grid search no longer certifies that the actual sublevel set is empty.
The general caption describes the optimizer set at the minimum
level without assuming uniqueness. All three current presets have
unique minimizers; in particular the third piecewise-linear function
is 0.15x + 1.6, not a constant. The piecewise-linear minimizer is
x = −1.12, with value 1.432, as the display reports.

Validation: native mode checks pass without runtime, TeX, blank-canvas
or quality warnings in both themes. All six captures were inspected:
the two different panels are visible, the three preset minima change,
and the exact-versus-grid values and residual qualifier remain readable.
No optimizer algorithm or source-verification status is changed.
