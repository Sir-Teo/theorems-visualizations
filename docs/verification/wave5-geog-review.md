# Independent review — GEOG chapter 7

Status: **accepted**, with the explicitly retained original Töpfer-source uncertainty on 7.4. All required fixes are resolved; source/model bytes remain frozen. Covers the eight frozen-inventory items only.

## Sources and mathematical scope

Read all statements, proof ideas, captions, scopes and helpers. Independently reran the 10 chapter model/metadata groups; all pass.

Read the actual saved Gastner–Newman 2004 paper, pp.7499–7501, Eqs.1–11, and independently rendered/inspected p.7501 (`/tmp/wave5-geog-review-source-gastner2004.png`). The widget implements a valid positive separable reflecting-square special case of its velocity and heat-flow construction. It does not purport to implement arbitrary country geometry, smoothing or surrounding-density choices. Finite-time mass conservation is distinguished from limiting density equalization.

Read and rendered the actual Cambridge Dodgson–Robinson slide77 (`/tmp/wave5-geog-review-source-cambridge2013.png`), with slide76 context. The recursive farthest-point rule agrees; the author's finite closed-segment convention and convex-capsule proof give the stated one-sided complete-polyline deviation bound. Optimality/topology are explicitly not guaranteed.

Read actual Openshaw CATMOG38 §III pp.8–10 from the preserved original PDF text: scale, same-count aggregation and ecological inference are distinct. The fixed sixteen-value widget uses actual exposure-weighted zone means and equal zone weights in its correlation; it does not present synthetic data as population evidence.

Independently opened NOAA NOS112 (Clayton1985), read printed p.5 Eq.1 and its adjacent explanation: the denominator ratio controls a target count and does not select feature identities. Original Töpfer–Pillewizer1966 body access is still flagged on7.4; no original-paper retry was attempted. The USGS pages supplied by the author returned403/timeout to the reviewer; their earlier author access is not represented as a new reviewer success. Representative-fraction unit conversion, Mercator scale, Koch geometry and analytic level sets were independently derived and checked.

Read the actual Robertson–Sanders–Seymour–Thomas paper introduction and independently rendered p.2 (`/tmp/wave5-geog-review-source-fourcolor1997.png`). The text accurately separates its633-configuration reducibility/unavoidability proof from the widget's finite instance certificates. No independent reproduction of those633 cases is claimed. The connected-region/shared-segment convention, loopless planar graph hypothesis and single-point exclusion are appropriate.

The new proof inputs use written material: PDE1.4 supplies the heat equation, STAT1.7 the empirical zone-pair functional, and the actual graph duality/four-colour items supply7.8. Unwritten THERMO7.4 is only a related link.

## Independent oracles

`/tmp/wave5-geog-review-data.mjs` and `/tmp/wave5-geog-review-oracle.py`; result `/tmp/wave5-geog-review-oracle.log`: **31,071 independent scalar/geometric checks pass**.

- Independent segment norms/counts confirm every Koch level0–6 and canonical scaling (maximum total-length difference1.08e−13).
- An iterative, Shapely-distance simplifier independently reproduces retained indices on all tested input families/tolerances, including duplicate/returning endpoints. Independent points along every terminal original edge verify the complete-edge deviation claim.
- DOP853 integrates the actual diffusion velocity independently of cumulative inversion. The mapped coordinates agree within4.33e−15, including amplitude extrema, zero/subnormal time and no-flow boundaries.
- Adaptive quadrature computes initial and mapped-cell populations independently. Shapely polygon areas/unions check cell areas, positivity, complete square coverage and no overlaps; moving-cell population differences are at most1.67e−16.
- Expected adjacency graphs are constructed combinatorially, independently of segment-overlap code. Polygon intersections exclude overlap/corner adjacency errors. Exhaustive assignments independently certify chromatic numbers4,3,2 for the four-region, wheel and grid examples; the poor wheel greedy order uses4 while a3-colouring exists. Both computed certificates have no edge conflicts.
- Direct polynomial level checks confirm the analytic contour points, with maximum elevation discrepancy3.89e−16.

For the full cartogram parameter box, density is bounded below by `.15² > 0`. The separable cumulative derivatives are positive, so each coordinate map is increasing, its Jacobian is positive and cells cannot fold. At finite time its exact Jacobian is initial density divided by the density at the transported point; at uniform time the determinant equals initial density because mean density is1. This proves the distinction used in the readout throughout the offered domain, independently of the sampled checks.

## Required fixes resolved

1. Hillshade raster `res:100` meant100 CSSpx cells; changed to3 for a useful analytic illumination image.
2. Derived-map linear side was `1/sqrt(r)` for denominator ratio `r`; changed to `1/r`. The square root belongs to the feature-count formula, not linear physical map scale. Fixed-size symbol crowding at strong reduction is now stated separately; root added a native width-ratio oracle.
3. Hide azimuth when hillshade is off. Distinguish a truly zero gradient from a positive near-zero magnitude rather than calling every guarded value a critical point; exact saved near-origin states are included in follow-up checks.
4. State orientation preservation for the signed Jacobian formula in7.7. The actual diffusion model already preserves orientation; a generic mass relation otherwise uses the absolute determinant.

All four fixes were read in the final source, and the exact generated candidate was rebuilt before independent native verification.

## Independent native and visual verification

Copied the final chapter utility to `/tmp/wave5-geog-review-browser.mjs` and ran it against the exact source-aligned candidate named in `/tmp/atlas-wave5-geog-candidate-export-path`, with separate captures. **32 actual 1200/320 light/dark groups pass: 296 physical control actions and 200 actual URL replay/rejection checks.** Log `/tmp/wave5-geog-review-browser.log`; captures `/tmp/wave5-geog-review-production`. Exit 0; reviewer browser closed.

This gate checks all selectable and toggle modes, newly revealed inputs, physical Home/End and handle drag, exact native browser-canonical range values, model/readout agreement, complete statement/proof/caption/scope/legend/readout and displayed-math bounds, and full drawing/marker/handle-ring boundaries. It independently measures the rendered map frames to verify the actual `1/r` physical width ratio. Data glyphs are additionally measured against the inner plot clip, not merely the whole canvas. Minimum complete ink/marker clearance is 2.5 CSSpx; minimum glyph/halo clearance is 1.702637 CSSpx.

Actual Create state links restore edited state/readouts exactly. Off-grid continuous values, malformed/out-of-range values and invalid fractional integer states are checked. Special actual Share cases include empty refinement, subnormal simplification tolerance, exact critical versus positive-subnormal/1e−14 near-critical probes, and zero/subnormal heat time with extreme or subnormal density amplitudes. The azimuth is hidden when illumination is off; the illumination image uses the corrected raster resolution.

Personally inspected all 16 final narrow defaults in both themes, full-size contact sheets `/tmp/wave5-geog-review-contact-{light,dark}-{0,1}.png`, and actual narrow rich pages 7.4/7.7/7.8 (`/tmp/wave5-geog-review-rich-{4,7,8}.png`). The reduced-map frame, smooth hillshade/contour relation, decoded aggregation/population colours, nonfolding cartogram grid and actual map/dual labels are clear. The source flags and distinction between instance certificates and the general proof remain visible. All 10 final model/metadata groups independently rerun clean (`/tmp/wave5-geog-review-math.log`).

The chapter meets the authoring criteria: distinct interactions with meaningful calculations; complete units, parameter conventions and hypotheses; proof ideas consistent with their inputs; explicit special-case and numerical scope; honest source access; and independent responsive/theme/state evidence. No unresolved required fix remains. Only this report and bounded `/tmp` reviewer utilities were written. Authored product/tests remain frozen.
