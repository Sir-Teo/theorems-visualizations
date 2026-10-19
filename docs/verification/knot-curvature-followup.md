# Fáry–Milnor source and curvature audit — 2026-10-17

Resolved `dg-3.12`. **791 source reviews remain**, including the two differential-geometry quadric/orientability entries. Human sampling and subjective listening remain pending; Wave 5 remains gated.

## Original papers

Read Milnor, [*On the Total Curvature of Knots*, Annals of Mathematics 52(2), September 1950, pp.248–257](https://people.reed.edu/~ormsbyk/milnor-total-curvature.pdf), including the averaging formula (Theorem 3.1, pp.252–253), curvature-decreasing polygon slide (Corollary 1.2, p.250), isotopic inscribed polygon (Theorem 4.2, pp.254–255), and Corollaries 4.4–4.6 (pp.255–256). Inspected the original statement/proof pages. SHA-256 `db75ff2d20da489355e9a4ed541198ef23d3e50bdf7b4dcf68f6c9938deecd54`.

Also read Fáry, [*Sur la courbure totale d'une courbe gauche faisant un nœud*, Bulletin de la SMF 77 (1949), pp.128–138](https://www.numdam.org/item/10.24033/bsmf.1405.pdf), especially Theorem 3 and proof, pp.136–138/PDF pp.10–12. SHA-256 `fe36983462639347a450aea587256ce2e67071d087704865ae0561f5f10f8722`. Fáry proves the non-strict bound; Milnor supplies strictness and explicitly acknowledges the independent Fáry proof. The published years and independence credit are supported; the previous broad do Carmo chapter reference is replaced by original-paper anchors.

## Proof correction

The old explanation claimed that two height maxima imply a knot can be untied. That is false. One maximum gives an unknot; knots therefore have at least two. Averaging gives the non-strict bound. Strictness follows by inscribing an isotopic polygon and sliding a vertex among four consecutive noncoplanar vertices. A sufficiently small slide preserves knot type and strictly lowers curvature; the new polygon still satisfies the non-strict bound. This separate argument replaces the unsupported positive-measure claim about three maxima. The statement now explicitly specifies an embedded regular C² curve in R³; generalized total curvature is defined using inscribed polygons.

## Example calculations

The atlas's example families are independently checked rather than attributed to the originals. For positive height, the trefoil is a vertical linear stretch of the standard (2,3) torus knot. Shadow coincidences occur at `theta=pi/6+j*pi/3` paired with `theta+pi`; their height separation is exactly `2*epsilon`. Its planar speed is at least2, ensuring regularity at every supported height.

At zero height, the signed planar curvature numerator is proportional to `8.38+6.63c−0.45c²`, where `c=cos(3theta)`. This is at least1.3. The tangent turns twice: its angle is `2theta+arg(r'+2ir)`, whose second term has no net winding because `r>0`. Thus the flat shadow has total curvature4pi; continuity of the regular integrand gives the claimed small-height limit. This limit self-intersects and does not violate the embedded-knot theorem.

Both unknots are graphs over the radius1.3 circle, with heights `epsilon*sin(m*theta)`, m=2 or6. Flattening height is an isotopy (the distinct planar circle coordinates keep every intermediate curve embedded). At zero height both have curvature2pi. The new m=6 family supplies an actual counterexample to the converse: at height0.6 its curvature is approximately`9.49149147585516*pi`, above4pi. At height1.6 it is approximately`11.02458357995805*pi`.

Replaced finite-difference curve derivatives with analytic harmonic derivatives. The total-curvature integrand is `|r'×r''|/|r'|²`, integrated with a 1440-node periodic quadrature. Readouts use approximation signs and identify theorem guarantees separately from numerical results. Plot bounds include the added high-curvature unknot.

## Evidence and checks

[scripts/verify-knot-curvature.py](../../scripts/verify-knot-curvature.py) generates [15 independent 80-digit references](knot-curvature-references.json) using the original radial derivatives and adaptive mpmath quadrature, independently of the harmonic JavaScript implementation.

- `npm test`: 47 math, 20 science-kit and 63 verification tests pass. All15 references agree;1440/2880-node results agree within2e−10 for every one of the 317 supported height settings in all three families. Separate tests check original coordinates, crossing heights, regularity and flat limits.
- `node tests/verification-knot-curvature.mjs`: both light/dark scenarios pass, covering all three selectors, both height endpoints, actual camera drag, plotted values, full ranges and the converse counterexample. One-item mode checks in both themes have no runtime, TeX, blank or quality warnings. Inspected the final display.
- Chapter3 and entry smoke routes pass. Strict build/full static checks pass: 6,684 items,6,890 planned,450 chapters and6,621 visualizations, no warnings/errors. No audio controls occur in this entry.

Sampling and quadrature do not certify the general knot theorem; the source-based proof does.
