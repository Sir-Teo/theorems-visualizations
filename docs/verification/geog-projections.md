# Geography projection source review

Review date:2026-10-18. Covers `geog-5.1`, `5.2`, `5.3`, `5.4`, `5.7`, `6.1`, `6.2`, `6.3`, `6.5`. Flags close only after the numerical and real-renderer browser checks below. Historical priority claims were removed where the historical originals were not inspected; the retained credits identify the mathematical specification actually checked. This does not assert independent inspection of ancient maps or of the original historical projection papers.

## Complete relevant source text inspected

Snyder, *Map Projections—A Working Manual*, USGS Professional Paper1395 (1987), [official record](https://pubs.usgs.gov/publication/pp1395), full public-domain [scan with text layer](https://upload.wikimedia.org/wikipedia/commons/c/cd/MapProjections_AWorkingManual.pdf), SHA256 `8c4a1f30dd9202816f2717ea97e5fb6d412263f0ee6c40ed6ce8a55918cff078`. Direct USGS PDF access returned403; two other scans had no text layer. The complete relevant sections were read from the Commons copy, including surrounding scope and features, not just search excerpts:

- §16 pp.111–115, equidistant conic geometry, features and spherical eqs.(16-1)–(16-5), distinguishing the actual secant cone from the map's mathematical cone constant.
- §20 pp.145–150, orthographic construction and eqs.(20-1)–(20-5): transverse coordinates unchanged, radial scale cos(c), transverse scale1, one hemisphere.
- §21 pp.154–158, stereographic construction, conformality and eqs.(21-1)–(21-4): r=2Rtan(c/2), scale sec²(c/2), projection point excluded.
- §22 pp.164–168, gnomonic construction, great-circle lines, domain less than a hemisphere, spherical equations and table26.
- §25 pp.191–195, azimuthal equidistant domain/features and eqs.(25-1)–(25-2); correct distance/bearing from one centre only.
- §29 pp.239–242 and table41 pp.244–245, Van der Grinten geometry and full forward equations. Equation(29-1)/(29-2), absent from OCR, were inspected directly in the page241 image. The map strongly exaggerates polar areas.
- §30 pp.243–248, sinusoidal equations(30-1)–(30-5), interruption construction and Goode's composite construction.
- §31 pp.249–252, Mollweide equations(31-1)–(31-8), unique auxiliary root and explicitly slow Newton convergence near poles.

Pinned **PROJ9.5.1 primary implementation** inspected in the official project's source, rather than treating software documentation snippets as proof of a historical original:

- [robin.cpp](https://raw.githubusercontent.com/OSGeo/PROJ/9.5.1/src/projections/robin.cpp): complete X/Y node tables, forward function and scale constants. SHA256 `72ca726452c09a555df35e21a9e334c8b5430c0a0531e3f0f01d778613e74a8e`. The atlas's natural cubic spline between the same nodes is explicitly its reconstruction, not PROJ's piecewise polynomials or an asserted original Robinson interpolation.
- [aitoff.cpp](https://raw.githubusercontent.com/OSGeo/PROJ/9.5.1/src/projections/aitoff.cpp): full relevant forward function and Winkel initialization, default cosφ1=2/π. SHA256 `b1328d0ebb3db78db5c1d45b7fb69e551812b33980dbcb25aeead095b89014cb`.
- [igh.cpp](https://raw.githubusercontent.com/OSGeo/PROJ/9.5.1/src/projections/igh.cpp): full relevant forward-zone selection, boundary constant, zone diagram, initialization/central meridians and latitude offset. SHA256 `9397b2176ec8e0857dc8389c579606da00b44c01bb89f4e440f9b25fbd2f2c86`.
- [goode.cpp](https://raw.githubusercontent.com/OSGeo/PROJ/9.5.1/src/projections/goode.cpp): full implementation, SHA256 `e53d8db86a01d16a17b5a1fced988aee2dad52227b0bad817a0ba566a79ff3b9`. Compared its branch/offset with the atlas's more precise continuity-solved join.

The UN emblem page was inaccessible; the unnecessary emblem/design claim was removed. The retained60°S circle is a reference parallel. Fuller's historical dates and unverified mapping comparison were removed; the net is this atlas's gnomonic icosahedral construction. The chosen Goode bounds match PROJ's **continental** layout, not its separate oceanic-view projection.

## Corrections

- Gnomonic readout now compares radial/transverse **principal** scales (Jacobian singular values), rather than mislabeling geographic meridian/parallel scales as radial scales.
- Stereographic images are lines only when the circle **passes through** the antipode, c+ρ=180°, rather than whenever it contains the antipode. Larger containing circles stay circles; predicted radii use absolute value. Singular line cases skip the ill-conditioned circle fit. The asserted universally outward centre displacement was removed. The scale chart expands to include the actual probe rather than silently substituting c=150°; its circle-distance band folds correctly when oriented great-circle angles exceed180°.
- Orthographic radial collapse is distinguished from transverse scale1; the projected limb retains its circle. The finite highlighted arc is labeled with its actual clipped length near centre/limb, and the readout divides by that length.
- The physical secant-cone drawing in5.7 is explicitly an analogy, with a different constant from the equidistant conic; both constants are measured and displayed.
- Sinusoidal area factor is hk sinθ′, where θ′ is the angle between meridians and parallels. The former cosine was wrong. Angular-distortion axes include the full allowed range.
- A monotone Mollweide root equation does not guarantee global Newton convergence. The pedagogic Newton iteration remains unsafeguarded and can fail; the map's actual root solver now brackets every Newton step and falls back to bisection.
- The sphere sample formerly used equally spaced sin(latitude) **and** fewer longitude samples at high latitude, over-weighting the tropics. Equal-area bands now contain equal numbers of sample points (34×68=2312); all shared shape/area/distance summaries update accordingly. The numerical integration test checks the exact spherical mean sin²φ=1/3.
- Aitoff is obtained by halving longitude before an equatorial azimuthal-equidistant projection and doubling its horizontal coordinate, not merely squeezing an existing map. Winkel's pole-line/equator length ratio is2/(π+2)≈.389, not.5.
- Removed an incorrect uniform small-distortion claim for all compromise maps. Area/distance scatter is logarithmic after removal of a common scale; labels now distinguish that statistic from ordinary percentage area error.
- The icosahedral net retains a19-edge spanning tree between20 faces, leaving30−19=11 cuts, each acos(1/√5) long. This mathematical cut count is independently checked.

## Validation

`node tests/verification-geog.test.mjs`: six tests pass. They independently check spherical projection radii and principal scales across multiple bearings; projected great-circle collinearity; stereographic circle equations on both sides of antipode containment; conic true scales and meridian lengths; sinusoidal Jacobian; Mollweide residuals including±89.999°/poles; spherical quadrature; Goode join continuity; icosahedral edge/cut counts; a tabulated Snyder Van der Grinten coordinate, Robinson primary nodes and Winkel geometric limits.

`node tests/verification-geog-browser.mjs`:18 groups pass (nine items, light/dark), pinned real local KaTeX0.16.11 through `installBrowserAssets`. Native buttons, sliders and switches change routes, rhumb-line display, exact antipode passage and containment, map centre, tangent conics at10°/80°, equirectangular contrast, poor Newton starts, projection families and interrupted/icosahedral layouts; the orthographic handle is dragged. No runtime/TeX errors or nonfinite final readouts. Screenshots manually inspected for every item, with light and dark samples. Focused rechecks cover visibility/axis/label fixes: `node tests/verification-geog-browser.mjs 5.2 5.3 6.1 6.3 6.5`. Evidence `/tmp/atlas-geog-browser.log`, `/tmp/atlas-geog-browser-final.log`, `/tmp/atlas-geog-shots/`.

`node scripts/check.mjs climate geo geog --static`:133 items,0 errors,0 warnings after mathematical and prerequisite edits, before flag-only closure; final closure also receives a static pass.
