# Gauss density regularity: agent sample finding

`em-1.15` asserted the classical differential identity at every point
for a continuous “or merely integrable” charge density. Integrability
cannot support that claim: changing a density at just one point leaves
all volume integrals unchanged. For example, a density equal to one
only at the origin has zero integral over every region, so the zero
field satisfies the integral law but not the claimed pointwise identity
at the origin.

The classical statement now explicitly assumes a continuously
differentiable field and continuous density. The divergence theorem
gives the integral of a continuous difference as zero on every region,
so the difference vanishes pointwise. The weak formulation is written
separately using smooth compactly supported test functions. The
symmetric-box O(h²) averaging estimate is explicitly conditional on
continuous second derivatives of the density.

The smooth-blob figure remains a classical example. Its labels now
explain the per-unit-length reduction to cross-sectional area and the
sampled density scale used for normalization, rather than calling it
relative to the possibly zero central density. The normalizer samples
blob centres and has a positive fallback for an empty painting; it is
not a certified continuum supremum. The fixed finite-difference map
and quadrature remain numerical approximations.

The log plot already floors errors at 10⁻¹² but its old axis lower bound
excluded that floor for a cleared painting. The corrected range keeps
the floor visible; the readout reports an actually zero sampled-map
error as zero and declares the plotting floor separately.

Validation: strict build and native light/dark renders; box-size endpoints,
clear, negative-charge painting by native drag, and reset pass in both
themes. The regression checks that the zero-error floor lies inside
the plot. Both reset and cleared captures were inspected in both
themes. No original-source flag or prerequisite count changes.
