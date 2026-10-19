# Electrostatic boundaries and images — 2026-10-18

Review of `em-3.4`, `em-3.7`, `em-3.11` and `em-3.12`. Scoped changes preserve every dependency array and the unreviewed entries in `ch03.js` and `ch03-b.js`. The other nine EM reviews belong to a separate parallel batch. Human/listening requirements and the Wave 5 gate remain open.

## Primary sources examined

The official Caltech edition of **Feynman, Leighton and Sands, The Feynman Lectures on Physics, volume II** was read through its full online chapter text:

- [Chapter 5](https://www.feynmanlectures.caltech.edu/II_05.html): §5–5 line-charge field, §5–9 conductor normal field and Eq. (5.8), and the complete §5–10 cavity argument, including its explicit electrostatic and empty-cavity qualifications.
- [Chapter 6](https://www.feynmanlectures.caltech.edu/II_06.html): §§6–6 through 6–9, including the full plane-density derivation (6.28)–(6.30), sphere distance-ratio construction (6.31), and central-image correction (6.32). §6–11 and Eq. (6.35) give the two-sphere field estimate and explicitly discuss its polarization limitation.

These are author treatments of the retained physical results. No original Faraday, Franklin or Kelvin paper was inspected, and the unsupported historical dates/priority embellishments were removed. The numerical reference field is explicitly a chosen illustration; no empirical breakdown constant is certified. The official pages were accessed through the web reader on 2026-10-18. Direct command-line downloads returned HTTP 403, so no downloaded-byte hash is claimed.

## Corrections

| ID | Corrected content and visualization |
| --- | --- |
|3.4|Replaced a universal local-curvature claim with the actual far-separated-sphere approximation, neglecting wire capacitance and mutual polarization. The curve now varies both radius and common potential at fixed total charge: `kQ/[R(R+8)]`. The big sphere's field uses the selected configuration, not another point on that curve. Removed a clamp hiding fields below300V/cm. Adaptive bounds contain the full curve and chosen reference. Equal radii no longer overlap; a broken wire states the omitted separation. Rim-dot area is proportional to density. Gold rings indicate a reference crossing, with no corona prediction. Linear radius steps reach both actual endpoints.|
|3.7|Distinguished an isolated shell's fixed charge from grounding, electric-field independence from additive potential shifts, and fixed outside geometry from a universal total-charge-only law. Removed an unsupported mesh/wavelength shielding guarantee. Replaced inversion of the inner source by a disk Green function valid at the centre; near-centre dragging snaps to zero. Exterior dragging to the origin has a finite constraint. Corrected the inner-wall surface-charge sign and uses exact boundary normal fields, with separate bar normalization. Both walls use a single potential gauge. Zero source settings have zero fields without artificial bright source cores.|
|3.11|Specified the conducting lower half-space and decay at infinity; removed the unsupported isolated-neutral-infinite-plane equivalence. Zero charge remains zero. Showing the mathematical image expands the view to contain it; dragging remains visible. The density/fraction plot expands through the actual40d endpoint, and the dot is no longer clamped at6d. The readout includes the actual physical disk radius. Unit-charge shape curves remain well-defined at zero charge. Increased quadrature panels to4000 so the endpoint numerical comparison is accurate.|
|3.12|Zero charge remains zero. A finite exterior constraint handles dragging to the origin. The distance-spoiling control now moves by a fraction of the remaining radial gap, keeping the trial image strictly inside the conductor even at the closest charge position. The shaded interior states the **target** potential; a residual describes an inadmissible trial boundary field, not a different equilibrium conductor. All angular extrema are included in the plotted points and adaptive axis; the maximum readout is no longer merely the maximum of181 samples.|

## Independent construction and derivations

The new `content/em/electrostatics-audit.shared.js` uses centimetres, nC, V and V/cm; line charges are nC/cm. It does not alter legacy shared functions used by other items. The numerical point potentials have no softened core; physical source singularities are excluded from the drawing as stated.

For an inner line charge `I` at vector `w`, radius `a`, the cavity potential relative to the metal is

`V(u) = -2 KV I log(a |u-w| / |a²-u conjugate(w)|)`.

The denominator squared is `a⁴ - 2a²(u·w) + |u|²|w|²`, which stays nonsingular throughout the cavity for `|w|<a`. The logarithmic singularity has the correct line-charge strength. On `|u|=a`, the denominator is `a|u-w|`, so the boundary value is exactly zero. The remaining logarithm is harmonic inside; uniqueness establishes the construction. At `w=0` it reduces directly to `-2 KV I log(|u|/a)`, without an image at infinity. Its analytic negative gradient is implemented separately. The exterior uses line sources `L` at the real external position, `-L` at its radius-b inversion, and `Q+I+L` at the centre. The latter two sum to the required outer-wall total `Q+I`; subtracting the common boundary constant supplies the same zero gauge as the cavity. These are derived boundary solutions, not claimed as a historical original construction. Inner surface normal points into the cavity, giving `sigma_inner=-eps0 E_radial`; the outer sign is positive.

For the spoiled sphere, on its boundary write `c=cos(theta-angle_of_charge)` and

`V(c)=KV[q/sqrt(R²+a²-2Ra c) + qi/sqrt(R²+b²-2Rb c)]`.

A nonendpoint extremum satisfies `qa/d1³ + qi*b/d2³=0`. When the two terms have opposite signs, raising their ratio to2/3 makes the candidate `c` a linear solve. Only finite candidates strictly between−1 and1 are admitted; both endpoints are always evaluated. The display adds their actual angles before sorting the path. Negative signed trial coordinates are allowed, but `|b|<R` throughout the control range.

## Verification

`node --test tests/verification-em-electrostatics.test.mjs`: **7 groups pass**. Independent evidence includes equipotential/charge conservation throughout240 radius/charge cases; exterior constraint origins/limits; noncentral images and finite-difference potential gradients; centered analytic fields; zero tangential fields on both walls; independent Simpson flux integrals recovering inner and outer charges; exterior/internal source-rearrangement independence; plane normal fields and20000-panel disk integrals through40d; sphere distance ratios, full boundary cancellation, surface-charge integral and force from the three-dimensional surface density; spoiled-sphere extrema compared with independent2001-angle sampling and golden refinement. These finite tests validate implementation; the continuous results use the source/uniqueness derivations above.

The dedicated browser suite `tests/verification-em-electrostatics.mjs` checks actual keyboard sliders, image toggle, and native canvas handle drags in both themes. It tests the four fixed-Q radius/charge endpoint combinations, all signed/zero shell controls and centered charge, plane disk endpoints including40d, visible images, all27 signed/zero spoiled-sphere combinations at the closest physical position, restored images, and off-axis extrema. It rejects runtime/TeX errors and nonfinite displayed paths, handles or readouts. Screenshot evidence is saved as `/tmp/atlas-em-{tip,cavity,plane,sphere}-{light,dark}.png`.

All **8 actual light/dark groups pass**, and all eight screenshots were inspected. Inspection led to a final horizontal margin correction for the equal-radius endpoint; its real endpoint controls were rerun in both themes and both screenshots inspected again. The signed normal-field explanation and sphere-potential fraction typesetting were corrected, with final standard checks on all four IDs in both themes: four runs per theme, zero runtime, TeX/blank or quality warnings and zero static errors/warnings. Scoped whitespace checks pass. The four reviewed source flags are now clear; final ledger integration is recorded in the central journal.

Evidence preservation: the separate nine-item follow-up now uses `em-boundary-sources-followup.md` and `verification-em-boundary-sources{.test,}.mjs`. A parallel filename collision was repaired by recovering this batch's exact original artifacts from its own tool-call log and restoring its recorded control-test refinements; both mathematical suites and this browser suite were rerun after recovery. No content or completed review was discarded.
