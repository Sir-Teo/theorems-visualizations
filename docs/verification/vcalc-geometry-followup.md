# Change of variables and Pappus review — 2026-10-17

Resolved `vcalc-4.6` and `vcalc-4.10`, closing the four queued vector-calculus
reviews together with the [preceding integration batch](vcalc-integrals-followup.md).
A neighboring convergence-rate correction is recorded separately below.

## Sources and hypotheses

Checked [Toronto MAT237 §4.4, Theorem 1](https://www.math.utoronto.ca/courses/mat237y1/20189/notes/Chapter4/S4.4.html),
including the open-neighborhood, compact-region, injectivity and nonzero-Jacobian
hypotheses and its orientation-reversing example. The entry now states that
precise Riemann version. It explains how coordinate seams require regular pieces
and limiting arguments, rather than an unrestricted exception for arbitrary
zero-area sets. The local relative-error proof now uses compactness and a
Jacobian bounded away from zero. Removed the unverified Euler/Lagrange/Jacobi
priority narrative; the entry cites the presentation actually checked.

Checked [NTNU TMA4100, Applications of Integration](https://wiki.math.ntnu.no/tma4100/2013h/tema/applicationsofintegration),
Pappus's theorem, parts a–b, together with its shell, surface and centroid
formulas. The region must lie on one side of the axis; the curve is simple and
traversed without retracing. Corrected the missing absolute value in the
centroid proof: `2*pi*A*abs(xbar-a)`. Both signed cancellation and overlap of
unsigned shells matter when the region straddles the axis. Removed the unchecked
Pappus/Guldin dating and rediscovery claim; no claim to have established its
historical priority from an original Latin text is made.

## Numerical and visualization corrections

The change-of-variables reference was another 400-by-400 midpoint sum. It is now
an exact polynomial/separable antiderivative for every preset and both integrands.
An orientation-reversing shear demonstrates why the determinant needs an absolute
value; midpoint sums and shading use its magnitude. The image bounds include the
previously clipped parabolic corner at y=3.6. The error chart's 1e-6 display floor
is explicit, and the readout gives the actual computed error.

The Pappus raster sampled 160-by-500 points and claimed 0.5% accuracy for any
shape. It could miss thin regions, and its surface formula did not distinguish
multiple covering. The replacement volume calculation intersects polygon edges
with horizontal slices, folds their intervals into radii and merges overlapping
annuli. Between vertex heights, endpoints are affine. Splitting additionally at
radius sign/order changes makes the annulus-union area quadratic, so Simpson's
rule on each piece is exact up to floating-point roundoff. The independent edge
integral is evaluated in closed form, including edges that cross the axis.

Invalid/self-crossing polygons retain their editable handles but omit undefined
centroids and formulas, with a visible correction prompt. The 3D drawing scales
with the radius and height so it stays visible after edits and rotation. It is
labelled as the revolved boundary; when the axis cuts the region this can contain
overlapping or internal sheets. The computed solid volume counts the union once;
the surface readout explicitly counts swept sheets with multiplicity. The old
claim of automatic disagreement at every axis intersection is removed.

A neighboring correction to `vcalc-4.7` replaces the false universal N^-2 claim
for cylindrical midpoint quadrature. Its radial integrand contains sqrt(1-r²),
so the leading endpoint error has order N^-3/2. Numerical refinement from
N=128 to 1024 gives orders 1.516, 1.512, 1.508 for volume and 1.495, 1.498, 1.499
for the inertia integral, consistent with that endpoint expansion. The caption
also distinguishes the exact z integration and N radial evaluations from the
spherical N² calculation. Cartesian lattice errors are described as erratic,
without claiming a fitted universal rate; the gray curves are comparison guides.

## Evidence and checks

The [independent reference script](../../scripts/verify-vcalc-integrals.py) now
also evaluates Green integrals along each mapped boundary, at 80 digits. It does
not compute another transformed Jacobian integral. All eight references in
[vcalc-integrals-reference.json](vcalc-integrals-reference.json) agree with the
browser's antiderivatives to rounding precision.

- `npm test`: 47 math, 20 science-kit and 31 verification tests pass. New cases
  cover all maps/integrands, orientation reversal, exact annular cylinders/cones,
  a thin rectangle, overlapping radial intervals of a concave U, reversed vertex
  order, and centroid agreement for 60 independent simple polygons on both sides
  of an axis. Invalid shapes are rejected.
- `node tests/verification-vcalc-geometry.mjs`: four light/dark scenario groups
  pass: 32 map/integrand/grid states, both Pappus modes and axis endpoints,
  projected geometry bounds, actual pointer rotation, self-crossing feedback,
  recovery and moving the whole polygon to the other side of the axis.
- Strict build and full static validation: zero errors or warnings.
- Three changed items, light/dark and every selector mode: zero runtime, TeX,
  blank-canvas or quality warnings. Inspected reversed-shear, Pappus and
  coordinate-convergence screenshots directly.
- Four chapter/item smoke routes pass with their expected titles.

**822 queued source reviews remain.** No Wave 5 work has begun.
