# Pharmacology concentration-window source audit

Resolved: **pharm-4.5**. Parent independent mathematical/native checks and screenshot inspection passed; source flag and ledger are reconciled.

## Official labels actually read

- [Theophylline extended-release label, Chartwell/DailyMed](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=9591d4db-2b88-4f0f-b61e-64ba67626e3d), revised February2023, DailyMed updated December10,2025: read complete **Serum Concentration–Effect Relationship**, surrounding **Pharmacokinetics/TableI**, and **Adverse Reactions**. It discusses a10–15mg/L peak range for balancing benefit/risk and adverse effects below20mg/L. This does not validate a10–20mg/L band as universally safe or as an identical peak/trough target.
- [Digoxin official label, DailyMed](https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=f9897bec-c16f-2728-e053-6394a90aecb7), revised April2023, repackaged page updated January1,2026: read complete **sections2.5 and5.3**, including clinical context, sampling time and toxicity below2ng/mL. These directly support the limited concentration associations described; they do not turn0.5–2ng/mL into guaranteed safety/efficacy boundaries.

Both read October19,2026. The chosen comparison bands and rounded PK presets are explicitly distinguished from clinical outcomes and label-specific sampling interpretation. Primary regulatory labels are the sources; underlying trial records were not independently reanalysed.

Local HTML SHA-256: `/tmp/atlas-pharm-theophylline-label.html` `0fecd346bf33dcc123ed0ac0983f55714289e82ebc62c3e0abfd170c8cffcf45`; `/tmp/atlas-pharm-digoxin-label.html` `f65a882830db57d7174f71db554a8c676f0c4a921a4728b62e797ae0523d98f2`.

## Corrections and validation

The old caption/readout called the graph steady state although it only drew accumulation from zero. It now draws the exact periodic profile as the solid curve and startup as a faint dashed comparison. Analytic peak timing and bracketed threshold crossings replace sampled extrema and600-point band-duration estimates. The mean-centering action includes bioavailability and the mg/L-to-ng/mL scale and is explicitly a model operation. Sharp "toxic above/ineffective below" labels are replaced with reference-limit labels. Small centred doses retain enough displayed precision to review the actual model input.

- `node --test tests/verification-pharm-window.test.mjs`: **3 groups pass**. Both presets×all dose/interval corners: independent2500-previous-dose superposition, periodic endpoints, Simpson-integrated mean, numerical extremum checks; exact threshold-duration result compared with100000 midpoint classifications; centre action's units/bioavailability and the counterexample that centring the mean does not keep the whole curve inside the band.
- `node tests/verification-pharm-window.mjs`: **2 native light/dark groups pass** after the final input-precision change and again after the parent's shared logarithmic-slider endpoint correction. Both actual preset buttons, all4 true dose/interval corners per preset and centred-mean action at both interval endpoints; independently checked mean/units and complete startup/steady curves; finite readouts and no page/math errors.
- Inspected full-size theophylline/48h/light and digoxin/2h/dark centred screenshots: `/tmp/atlas-pharm-window-4.5-{0,1}-{low,high,centred-Home,centred-End}-{light,dark}.png`.
