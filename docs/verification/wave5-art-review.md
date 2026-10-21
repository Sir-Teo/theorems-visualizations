# Wave 5 visual art chapter 5 — independent review

Reviewer validation, 2026-10-21. **Accepted:** all nine new items, with 5.4's explicit secondary numerical-data verification flag retained. This accepts the scoped claims, implemented calculations and visual evidence; it does not certify an unread original MacAdam numeric table or a calibrated perceptual experiment.

## Independent source review

Opened the actual [CIE CIELAB definition](https://cie.co.at/eilvterm/17-23-076) and [CIELUV definition](https://cie.co.at/eilvterm/17-23-074), the [20 October 2026 W3C Color 4 draft](https://www.w3.org/TR/2026/CRD-css-color-4-20261020/), and its RGB/XYZ matrix code. The reference white, relative XYZ convention, piecewise lightness, chroma/hue interpretation, zero-chroma ambiguity and approximate uniformity match the chapter. A selected D50 reference changes coordinates without silently adapting the displayed stimulus. The gamut algorithms are specifically identified as authored strategies rather than CSS local-MINDE or ICC rendering intents.

Opened [RIT's renotation source page](https://www.rit.edu/science/munsell-color-science-lab-educational-resources), including the indexed institutional note specifying illuminant C, the 1931 2° observer, the .975 smoked-MgO correction and the warning that these are not actual book-chip measurements. Independently fetched the complete linked table. The numerical data are preserved by H/V/C key; row order in the chapter is grouped by hue.

Read the original [MacAdam 1942 paper](https://www.usailighting.com/stuff/contentmgr/files/1/f386756b8bcf5da65a8d3c26a56b82e7/misc/macadam_1942.pdf): abstract/conditions, observer PGN discussion and Figure 48's explicit tenfold enlargement. Matching variability is not promoted to an observer-independent threshold. The numeric semiaxes/orientations remain explicitly secondary diagram estimates with `verify:true`; that provenance limit is neither hidden nor waived.

Opened [Sharma's author page and external test file](https://hajim.rochester.edu/ece/sites/gsharma/ciede2000/). Direct web PDF fetch timed out; read the downloaded original paper's extracted equations 2–22 and implementation notes in `/tmp/art5-sharma.txt`. Checked the achromatic, hue-wrap, mean-hue and signed interaction branches against the implementation.

Opened the [Conway–Livingstone primary author-hosted paper](https://livingstone.hms.harvard.edu/sites/livingstone.hms.harvard.edu/files/publications/2006_October18.%20Conway_Livingstone.%20Spatial%20and%20Temporal%20Properties%20of%20Cone%20Signals%20in%20Alert%20Macaque%20Primary%20Visual%20Cortex.pdf) and [Webster's author-hosted adaptation review](https://labs.psych.unr.edu/websterlab/files/WebsterAnnualReview2015.pdf). The chapter's cone transform and adaptation ODE are declared models; they do not assert fitted neural weights, unique perceptual hues or exact RGB-complement afterimages. The 2006 cone observer is explicitly distinguished from the 1931 XYZ observer.

## Independent reference calculations

Executed a separate reviewer script, not only the author tests:

- Fetched all **2,734 RIT rows** and compared every value by its H/V/C key: unchanged. Fetched all **34 Sharma reference pairs**: unchanged. Maximum computed-versus-published ΔE00 discrepancy is **4.9498978e−5**, within the four-decimal rounding interval.
- Independently reconstructed both sRGB and Display P3 XYZ matrices by solving their primary-chromaticity/white equations. All entries agree within 1e−15.
- Independently computed Lab and Luv coordinates for **18,522 stimulus/reference-white cases** using a separately written piecewise definition and chromaticity equations. Maximum coordinate residual **1.14e−13**.
- Tested **9,261 P3 inputs**. Both mapped results stay inside sRGB; chroma reduction preserves L*; neutral mapping preserves Y. For each chroma-reduced input, a slightly larger retained-chroma fraction lies outside the declared gamut tolerance, checking the computed boundary rather than merely its membership.
- Fetched all **89 official CIE cone rows** and compared every source value. Independently integrated adjacent trapezoid segments for **45 spectral cases**, including S's shorter valid range. Maximum residual **1.23e−15**.
- Computed all 25 enlarged ellipse extents in xy and u′v′: both diagrams contain them at the maximum offered enlargement. Checked all displayed Munsell leaves' maximum chromas against their view bounds.

Also reran `tests/wave5-art.test.mjs`: **14/14 groups pass**, including transform inverses, transfer joins, exact reference values, cone normalization and adaptation ODE checks.

## Independent browser and visual evidence

A separate reviewer Playwright script passed **26 assertions** across both themes at 320px: all nine default runtime/TeX/mobile formula checks, published pair 29 with its negative interaction contribution and ΔE00=2.0373, the authored-offset provenance notice, zero Lab/Luv at black, and saved native viewing-field replay. The replay test captured actual framework state, destroyed/remounted the visualization with that state and asserted the restored neutral-field readout.

Individually inspected every one of the **nine dark320 defaults and nine light1200 defaults**, plus reviewer captures of the negative interaction bar and restored neutral field in both themes. Full tables/curves, patch labels, axes, controls and readouts fit the inspected pages. The negative cross contribution is drawn below zero with room for its label. Neutral-field replay restores an actually neutral canvas as well as the matching readout. Author's broader 44-group/392-action native evidence remains separate from these reviewer checks; root owns final repository gates.

## Resolved findings and limits

- Required: 5.8's button-owned closure state was not replayable. Author replaced it with a native segmented viewing-field control. Independent capture/remount replay passes in both themes.
- Caption polish: 5.1 now calls the outside-gamut raster region uncoloured, matching the actual display.

No unresolved mathematical, source-attribution or visual blocker found within the declared scope. Item 5.4's secondary numeric-data flag remains intentional. Screen previews cannot verify physical Munsell materials, individual discrimination thresholds or afterimage appearance; the chapter states these limits explicitly.
