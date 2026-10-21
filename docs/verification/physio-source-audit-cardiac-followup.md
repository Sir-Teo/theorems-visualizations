# Physiology cardiac-output source audit

Resolved after parent integration: **physio-3.6**. Source flag and ledger were updated together after parent reran both suites and inspected the high-stroke-volume screenshot. Scope is the 3.6 object in `content/physio/ch03.js`, the dedicated `physio-source-audit-cardiac.js` helper and dedicated tests. No other chapter-3 item is claimed reviewed.

## Primary source actually read

Lang et al. (2015), [Recommendations for Cardiac Chamber Quantification by Echocardiography in Adults](https://www.asecho.org/wp-content/uploads/2016/02/2015_ChamberQuantificationREV.pdf), *J Am Soc Echocardiogr* **28**, 1–39, [DOI](https://doi.org/10.1016/j.echo.2014.10.003). Read complete printed/PDF pp. **6–10**, especially §1.3's reference-population exclusions and methods, §2.2's EF definition and biplane-method distinction, §2.4 and **Table 2 (p. 7)**, and **Table 4 (p. 10)**. Rendered and directly inspected both table pages via bundled PDFium, in addition to PDF text extraction. The sex-specific biplane ranges are exactly 52–72% and 54–74% in those tables; these are distinct from the pooled 53–73% narrative range in §2.4. The entry now identifies the exact tables/method/year rather than attributing these values to secondary accounts or implying current universal diagnosis cutoffs.

Local source `/tmp/atlas-physio-ase2015.pdf`, SHA-256 `2988fa75a8c81d28dfa45ad678205438aa76e24d7570b7cf09b0a971990da631`; inspected table renders `/tmp/atlas-physio-ase2015p7.png` and `p10.png`.

## Corrections

- Removed the unverified resting-output empirical assertion; definitions and explicit unit conversion suffice. The output identity now includes **/1000** when mL/beat × beats/min becomes L/min. The previous live readout asserted a numerical equality without that factor.
- Source method/year/ranges and references are now precise. The source values provide context and do not fit or validate the chosen model parameters.
- Replaced the misleading comparison that the weak and large-stroke-volume presets produce similar output: their default outputs are about 2.99 and 5.96 L/min. The caption now asks readers to compare computed rectangle areas. The small-stiff comparison is limited to its default rate because EF falls at high rates in this model.
- Presets are explicitly chosen model settings, with neutral baseline/large-stroke-volume labels. Removed implied empirical population measurements.
- Mean arterial pressure uses numerical time averaging, replacing the systolic/diastolic shortcut. The finite warm-up's residual ventricular-volume drift is reported live; no exact periodicity is claimed. No change to the shared chapter-3 ODE was made.
- Both plot windows scale to the actual complete loops/rectangles. Measurement and volume labels track the pressure window.

## Validation

- `node --test tests/verification-physio-source-audit-cardiac.test.mjs`: **4 groups pass**. Independent equal-SV/different-EF and equal-EF/different-CO examples; nonuniform integration against an affine analytic pressure integral; all four presets at their default and 40/130 rates (12 states), independent Simpson integration of ejected aortic volume versus chamber-volume width (within 0.015 mL), inflow/outflow/volume balance (within 0.02 mL), every sampled ideal-valve direction and positive volume, mean-pressure quadrature, and residual volume drift below 0.03 mL. Caption preset comparisons independently checked.
- `node tests/verification-physio-source-audit-cardiac.mjs`: **2 native light/dark groups pass**. All four actual preset selections, their chosen rates and both native rate endpoints. Independently checked displayed SV/EF/CO and unit conversion, finite warm-up drift, complete pressure–volume curve containment, finite readouts and absence of page/math-render errors.
- Directly inspected full-size high-SV/40-rate light and small-stiff/default-rate dark screenshots, including the /1000 conversion, dynamic plot labels and all visible controls/readouts. Files `/tmp/atlas-physio-cardiac-3.6-{0,1,2,3}-default-{light,dark}.png` plus `3.6-2-Home-{light,dark}.png`.
- Scoped syntax and `git diff --check` pass. These are definition, unit, model-consistency and native-control checks; they do not establish empirical clinical validity of the presets or exact periodic convergence of the shared ODE.
