# Topology: extrema and uniform continuity — 2026-10-17

Resolved `top-4.11` and `top-4.13`. **797 source reviews remain**, including the Lebesgue-number and compactness-equivalence entries. Wave 5 remains gated.

## Primary text

Compared both statements and proofs with Munkres, *Topology*, second edition, using the verified scan/hash recorded in [the foundations audit](topology-foundations-followup.md):

- Theorem 27.4, printed p.174/PDF sheet 95: continuous images of compact spaces and attainment of extrema. Added the nonempty-domain condition needed to assert the existence of extremizers. The explanation now justifies boundedness using the finite-subcover argument for the intervals `(-n,n)` rather than an incorrect dependency inference.
- Theorem 27.6, printed p.176/PDF sheet 96, with Lemma 27.5 on pp.175–176/sheets 95–96: the uniform-continuity proof uses a Lebesgue number of a cover, which need not equal the infimum of arbitrarily chosen pointwise radii.

Replaced broad section references with these checked anchors and removed unverified historical priority/date credits. The numerical functions below are the atlas's examples; their properties were verified independently rather than attributed to Munkres.

## Extreme-value correction and global argument

The wave example is `f(x,y)=sin(2.5x)+cos(2y)+0.4xy` on the unit disc. It was falsely described as having its supremum only on the boundary. Its unique global maximum is interior, approximately at

`(0.63237667936847718959, 0.06340748491104683252)`, with value `2.00795725432927459626`.

This conclusion does not come from a dense grid:

1. The interior point `(π/5,0)` has value 2. On the boundary, if `|y|≥0.45`, the value is at most `1+cos(0.9)+0.2<2`. Otherwise a positive x satisfies `x>sqrt(1−0.45²)`, giving an upper bound `1+sin(2.5sqrt(1−0.45²))+0.18<2`; for nonpositive x the upper bound is 1.2. Thus a global maximizer on the compact closed disc must be interior.
2. Any point with value at least 2 lies in the rectangle `0.35<x<0.9`, `|y|<0.45`. Outside it, the corresponding bounds are 1.2, `1+cos(0.9)+0.2`, `1+sin(0.875)+0.18`, and `1+sin(2.25)+0.18`, all strictly below 2.
3. Throughout that rectangle the Hessian is negative definite: its negative diagonal magnitudes are bounded below by `6.25 min(sin(0.875),sin(2.25))` and `4cos(0.9)`, whose product exceeds `0.4²`. Hence there is only one stationary maximum. Independent 80-digit stationary equations reproduce the coordinates/value above.
4. There is no interior local minimum. For `|y|<π/4`, the second y derivative is negative. For `π/4≤|y|<1`, the magnitude of the sine term in the first y derivative exceeds `2sin(2)>0.4`, so that derivative cannot vanish. Therefore every closed-disc minimum is on the boundary, and the open-disc infimum is not attained.

The tilted plane has exact closed-disc extrema `±sqrt(1.36)` at the two normalized coefficient vectors; neither is attained on the open disc. The new UI makes this contrast explicit: noncompactness allows failure of attainment but does not require it.

Removed the dense-grid arrays mislabeled as true extrema. Markers/readouts now identify finite sample maxima/minima separately from analytic references. The heat-map range uses the a priori bound `|f|≤2.2`. Corrected an overlapping maximum/probe label and inspected the result.

## Uniform-continuity correction

The old local radii came from searching a 421-point sample and were treated as whole-domain guarantees. They can overestimate the admissible neighborhood and were evaluated at the nearest sample rather than at the dragged point. Replaced this with all solutions of the exact level equations, evaluated numerically:

- For `sin(3x²)`, enumerate the sine level crossings in phase `[0,12]`, map them back to x, and take the nearest crossing.
- For `1/x`, solve the two rational level equations directly, retaining only crossings in `[a,1]`.
- Cap the displayed local radius at the domain width. When the entire domain stays within the chosen epsilon band, this is a valid finite choice rather than an assertion of a finite largest unrestricted radius.

The uniform line has independent mathematical support. The sine derivative has magnitude at most 12, so `δ=ε/12` works. For the inverse example, the worst pair begins at a: solving `1/a−1/(a+δ)=ε` gives `δ=εa²/(1−εa)` when `ε<1/a−1`; otherwise the displayed capped radius is `1−a`. The formula is used as the guarantee rather than a sampled minimum. The pairs `1/n` and `1/(n+1)` explicitly establish failure on `(0,1]`.

Removed the height-14 cap that clipped values up to 200, and the fixed logarithmic lower bound that hid radii near `1.25e−6`. Graphs, bands, local markers and the uniform line now fit their actual ranges. Rounded numeric radii are labeled approximate.

## Reproducible checks

[scripts/verify-topology-functions.py](../../scripts/verify-topology-functions.py) writes [topology-function-references.json](topology-function-references.json). It uses mpmath at 80 digits and monotone-interval bisection, independently of the JavaScript inverse-trigonometric formulas. The fixture contains 102 local/uniform radius references and the wave stationary point. Runtime tests also check the global bound/concavity inequalities, every supported grid density, admissible neighborhoods and sharpness of uncapped inverse guarantees.

Validation passed:

- `npm test`: 47 math, 20 science-kit and **54 content-verification tests**.
- `node tests/verification-topology-functions.mjs`: four light/dark scenario groups. Both functions and disc domains, grid endpoints, actual probe drags, every epsilon/domain endpoint, agreement of displayed local radii with the calculation, and complete function/logarithmic plot ranges. No browser errors.
- Two-item light/dark checks: no runtime, TeX, blank or quality warnings. Inspected the open-disc interior maximum and the inverse plot at its smallest domain endpoint/epsilon.
- Strict build/full static check: 6,684 items, 6,890 planned, 450 chapters and 6,621 visualizations, no warnings/errors.
- Three smoke routes pass: chapter 4 and both reviewed entries. Neither entry has audio controls.

`top-4.12` and `top-4.16` remain flagged for the separate cover-radius and compactness-proof corrections identified in the preceding audit. This batch does not claim those reviews complete.
