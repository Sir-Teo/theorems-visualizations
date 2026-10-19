# Physiology Patterson–Starling source audit

Resolved: **physio-3.11**. Parent independent mathematical/native checks and screenshot inspection passed; the content flag and source ledger are reconciled.

## Primary source actually read

Patterson and Starling (1914), [On the mechanical factors which determine the output of the ventricles](https://pmc.ncbi.nlm.nih.gov/articles/PMC1420422/), *J Physiol* **48**, 357–379, DOI **10.1113/jphysiol.1914.sp001669**. Downloaded all23 original page scans, read complete pp. **357–360 and374–379** by OCR and directly inspected the original pp. **378–379**. The paper distinguishes pressure from venous inflow: when inflow is imposed, output remains nearly independent of arterial load through adjustments of venous pressure; elevated venous pressure during failure need not imply increased output. Its discussion explicitly defers detailed volume curves to a subsequent paper. The earlier summary incorrectly treated this as direct measurement of the displayed diastolic-volume/output law.

The entry now distinguishes the coupled heart–lung preparation with imposed inflow from the chosen fixed-rate, pressure-driven left-heart model. No claim is made that its control values, diastolic-volume curves or hormone state reproduce the1914 data. The rounded water-column conversion and chosen model parameters are explicit.

Local HTML `/tmp/atlas-physio-patterson1914.html`, SHA-256 `853e43a340c401f8cb92662940071b0d6d00ebe6d9f1b7f46fb374aa2fc6c678`; original scan378 `d1487714cde1ee8f3448155592eceb94851c4e324e0872743f340f6298a74bce`; scan379 `4cfb6f9a04784025f137652cfa7760b5ee6ff976f6ee1c6331682c3dc34d1768`.

## Corrections and validation

Replaced the sparse13-point inverse interpolation with bracketed26-iteration bisection of the actual model response. The readout now uses the beat at the solved pressure; targets outside the bracket are rejected. Pressure plots include the full2–26mmHg sweep and native handle endpoints, with adaptive output/volume bounds.

- `node --test tests/verification-physio-source-audit-patterson.test.mjs`: **3 groups pass**. Independent analytic inversion of a saturating response, rejection of unbracketed targets, all4 actual reservoir-height/resistance corners, actual model residual below1e-6L/min, sign checks around the root, stroke-volume/heart-rate units and the required filling-pressure change under increased arterial load.
- `node tests/verification-physio-source-audit-patterson.mjs`: **2 native light/dark groups pass**. Actual height3/32cm and resistance0.7/2.6 controls, independently checked output recovery, full curves and marker/handle-radius containment, finite readouts and no page/math errors.
- Inspected original source pp.378–379 and full-size low/light and high/dark screenshots: `/tmp/atlas-physio-patterson-3.11-{low,high}-{light,dark}.png`.
