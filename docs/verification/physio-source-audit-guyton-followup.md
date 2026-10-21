# Physiology Guyton-curve source audit

Resolved: **physio-4.17**. Parent independent mathematical/native checks and screenshot inspection passed; the content flag and source ledger are reconciled.

## Primary source actually read

Guyton (1955), *Determination of Cardiac Output by Equating Venous Return Curves with Cardiac Response Curves*, *Physiol Rev* **35**,123–129, [DOI](https://doi.org/10.1152/physrev.1955.35.1.123). Read all seven original pages **123–129** from the [original article PDF mirror](https://bchcicu.org/wp-content/uploads/2018/10/Physiol-Rev-1955.pdf) and directly inspected p.128/Figure5. These distinguish dog cardiac-response experiments from pump-controlled venous-return experiments, explain collapse limiting return at negative atrial pressure, and equate pressure/flow simultaneously. The article uses **mean circulatory filling pressure**, not an interchangeable claim about mean systemic filling pressure. The entry now distinguishes these terms and uses a chosen filling-pressure intercept, without claiming the displayed numerical curves fit the original experiments.

Local PDF `/tmp/atlas-physio-guyton1955.pdf`, SHA-256 `94aeb69113f33d6e607baddb7cd5e05e43b469613b7c06223c87ba77ce996def`. Original p.128 rendered to `/tmp/atlas-physio-guyton1955-p128.png` and inspected.

## Corrections and validation

The old bounded solver falsely returned negative-flow equilibria for low-volume controls; the displayed check also omitted the collapse clamp. Forward curves are now nonnegative, the positive root is dynamically bracketed, and filling pressure at/below the chosen−2mmHg collapse threshold explicitly reports **no positive forward-flow equilibrium**. That limit is a stated limitation of the chosen fixed-threshold model. Full curves and markers now fit adaptive bounds. The stability argument states its positive-compliance reservoir assumption. All numerical compliance, contractility, sympathetic and collapse parameters are labelled illustrative.

- `node --test tests/verification-physio-source-audit-guyton.test.mjs`: **3 groups pass**. Independent venous slope/plateau/zero relations; all16 actual control corners and1001 volume states; actual positive-root equality and restoring signs; independent analytic inverse on the collapse plateau; directional effects of chosen volume/contractility changes.
- `node tests/verification-physio-source-audit-guyton.mjs`: **2 native light/dark groups pass**. All16 actual volume/tone/contractility/resistance corners, explicit no-flow states and an interior collapse-plateau state; independent equality checks, full curves and marker-radius containment; finite readouts, no page/math errors.
- Inspected full-size high/dark and no-flow/light screenshots: `/tmp/atlas-physio-guyton-4.17-{low,high,collapse}-{light,dark}.png`.
