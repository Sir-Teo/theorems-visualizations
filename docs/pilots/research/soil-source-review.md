# P05 independent AI source/data review · 2026-10-22

Reviewer role: independent AI data/source reviewer. This is a bounded reproducibility and source-column audit, not a soil-scientist credential, instrument calibration audit, or observed learner/accessibility session. No repository files changed.

## Decision

The pinned snapshot is usable for a small, explicitly illustrative measured-point pilot if the conditions below are applied. It does not support a fitted retention function, field-capacity/wilting-point inference, irrigation advice, site representation, or density/conductivity comparison. The existing audit counts reproduce exactly. Keep the synthetic storage calculation separate from observations.

Two concrete authoring issues require attention:

1. **Medium, high confidence: measurement key is not sample + suction.** More than one water-content observation can share a magnitude in a sample. Preserve source row identity. Never collapse these records, average them silently, or imply a uniquely measured water value for every suction.
2. **Medium, high confidence: qualify the water-content unit wording.** The record defines `Vol_Water` literally as “Sample Water Content (%)”; its name suggests a volumetric variable but metadata does not explicitly state volume/volume. The brief's simple “percent” wording is supported. Safest label is **reported water content (%) · source column Vol_Water**. Keep synthetic parameters explicitly identified as assumed volumetric fractions, without converting measured values into inferred storage. If the implementation labels measured values volumetric percent, disclose that this interpretation follows the variable name and is not independently established by the available documentation, or obtain direct supporting documentation.

## Sources and snapshot

- Authoritative record: https://doi.org/10.5281/zenodo.18273606 ; API https://zenodo.org/api/records/18273606 . Cached original API body `/tmp/atlas-u1-20261022/soil-dataset-metadata.json`, SHA-256 `bdbaa937befb09b8e6c1fc6fa904bb13b6f06d53c2d0fa52b6ac2c5e21ffc96e`.
- Title: ReESH_US-DFC: US Dairy Forage Research Center, Prairie du Sac.
- Metadata publication date **2026-01-16**, API created/modified timestamps **2026-03-03**. Do not conflate either with sample date **2025-05-29**. Record number 18273606 is a version DOI; concept DOI18273605 is not the frozen file identifier. No separate semantic version label was present in inspected metadata.
- Creators in order: Ankur Desai, Alison Duff, Susanne Wiesner, Emily Mather, Jonathan Thom, Daniel Beverly, Alex Crookshanks, Trevor Gress, Max Crookshanks.
- Metadata declares open access and `cc-by-4.0`. Attribute creators/title/version DOI, link licence https://creativecommons.org/licenses/by/4.0/ and identify projection/selection, decimal-preserving extraction and any plotting transforms. This review inspected the declaration; it does not investigate ownership of original measurements.
- Characteristics file: https://zenodo.org/api/records/18273606/files/US_DFC_SoilCharacteristics.csv/content ; 2,192 bytes; SHA-256 `6a7d182505f3eafb1854ecccb229aca15ddc8754c8830b9880f73afee49647d4`; MD5 `db214a1990be88e0a58beb463c6f3cf0`.
- Retention file: https://zenodo.org/api/records/18273606/files/US_DFC_SoilWaterRetentionCurves.csv/content ; 111,378 bytes; SHA-256 `41308fba78d50d96152f40b85af43f45a9aed4d53e23568db483889c8ed744b1`; MD5 `561f270b6fd8cb1e77db0e11f31988a4`.
- Fresh web-tool open of the API returned tool-inaccessible in this review. Findings rely on the frozen original API body and hash-matched local CSVs, not a claimed fresh remote retrieval. No denial/stop was bypassed.

## Reproduced checks

Ran repository `python3 docs/pilots/research/soil-quality.py /tmp/atlas-u1-20261022` and separately profiled CSV rows using Python csv, Counter, math.isfinite and SHA-256. Existing audit results match.

- 12 characteristics rows, 12 unique Sample_IDs; 1,106 retention rows across the same12 samples. No duplicate parent keys, orphans, exact retention duplicates, or duplicate `(sample,magnitude,water,instrument)` records.
- All retention Site, Depth_cm, Sampling_Date, Latitude, Longitude, Veg and Bulk_Den_g_m3 values exactly match their joined parent strings; no join multiplication.
- Sampling date only2025-05-29; reported depths0,10,50cm. Four plots, three depths each. These are laboratory curve records associated with samples, not1106 independent field samples or a time series.
- No empty required projected fields; all numeric depth/magnitude/water values finite. All magnitudes positive. Water-content values are within0–100; this confirms arithmetic plausibility only.
- Full-snapshot magnitude range0.0002979–17.3780083 MPa (absolute magnitude column), water-content range1.86–74.74 percent. Range checks do not establish calibration or uncertainty.
- Hypropfilter mapping explicitly documented: **1=WP4C**, **2=HyProp**. Full snapshot counts217 and889 respectively. This is an instrument code, not a quality flag.
- Conductivity flag KS_Soil_Flag has10/12 suspect/use-with-caution and2/12 good. It is defined for conductivity, not all retention rows. Excluding conductivity does not justify describing all retention as invalid or fully validated.
- Density metadata says g m^-3 while values0.85856–1.69114782608696 conflict with normal interpretation of that unit. Do not silently substitute a unit; exclude the field and all derived calculations.

## Proposed bounded selection

Proposed file `/tmp/atlas-p05-three-sample-subset.json`, SHA-256 `3d3bcd635f637f43a9b84bbda1c20519cbdf00742dcba64547d67a3949f7c80b`, 72,912bytes. It retains all278 observed records from plot1 at three reported depths, in original source order. All retained source values are strings preserving decimal text; sourceRow is a 1-based CSV line number including header. This is lossless for the selected projected columns, not a copy of all original columns.

|Sample|Depth cm|Rows|HyProp / WP4C|Magnitude range MPa|Water range %|
|---|---:|---:|---:|---|---|
|US-DFC_1_000|0|102|82 /20|0.0007548–14.1253754|4.68–54.14|
|US-DFC_1_010|10|93|80 /13|0.0003863–17.3780083|4.04–53.32|
|US-DFC_1_050|50|83|75 /8|0.0003377–4.1686938|1.86–31.05|

Rationale: one plot, all three depths, no selection based on desired response or quality flag. All three happen to have conductivity caution flag1; do not cherry-pick the two flag0 samples as if this rated retention quality. The comparison is descriptive and cannot isolate a causal depth effect. It is not representative of the whole site or Wisconsin.

Projection retains Site, Sample_ID, Plot, Depth_cm, MPa_Abs, Vol_Water, Hypropfilter, Sampling_Date. Omitted density and coordinates are not needed for this learning task; omitted texture/conductivity are not bundled. Parent characteristics need not be bundled if no parent-only variable is used.

Duplicate-magnitude examples that must remain separate:

- US-DFC_1_000 magnitude1.0471285: source rows902/904, water19.12/12.21, instrument1 (WP4C).
- US-DFC_1_010 magnitude9.332543: source rows916/922, water5.09/5.31, instrument1.

Show observed points plus an accessible full table. Source-order row IDs distinguish coincident x values. Do not draw interpolated connecting curves unless explicitly described; no fitted model is approved here. Linear magnitude axes will compress many small positive values; a labelled log10 view may be more readable, but raw MPa values and a table must remain available. State whether plot coordinates were transformed; never label log values as original MPa.

## Sign convention and synthetic model

Metadata labels MPa_Abs as sample water potential(-MPa), while CSV contains positive values. Use “water-potential magnitude, MPa (positive source MPa_Abs)” and explain that this displays magnitude rather than a signed positive water potential. This is source-faithful labeling, not an independent confirmation of instrument conventions. “Suction magnitude” should receive the same caveat.

Independent arithmetic check: (0.30−0.15) ×0.40m ×1000mm/m =60mm. These are assumed volumetric fractions in a uniform0.40m layer. They are not thresholds fitted to any selected curve, neither field capacity nor wilting point, and not an irrigation recommendation. Inputs must not imply measured calibration; prefer “assumed upper/lower fraction” rather than crop-science threshold names.

## Useful stable checks for authoring

Verify pinned SHA-256 before extraction; assert allowed Sample_IDs and row counts; preserve every selected source row and instrument enum; reject nonfinite required values; verify all generated point/table values against the source by sourceRow; confirm no excluded density/conductivity fields drive computation; test the independent synthetic conversion. Avoid tests enforcing curve monotonicity or unique suction because the observed source does not guarantee them.

No freshness, temporal trend, representativeness, lab protocol, field management, measurement uncertainty, or professional soil-science approval is established. Treat any such claim as open rather than inferred from the successful data-quality checks.
