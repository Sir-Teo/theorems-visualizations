# Pharmacology recirculation source audit

Resolved: **pharm-3.11**. Parent independent mathematical/native checks and screenshot inspection passed; source flag and ledger are reconciled.

## Official primary label actually read

[CELLCEPT official prescribing information, DailyMed](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=37241e87-4af4-4dc3-a1aa-ea6f20d8dc40), revision **July2026**, page updated **August5,2026**, read **October19,2026**. Read complete relevant **section12.3 Metabolism/Excretion** and **Drug Interaction Studies/Cholestyramine**, plus surrounding pharmacokinetic context. The label directly reports MPA secondary peaks usually6–12h post-dose, and approximately40% lower MPA AUC in12 healthy volunteers after cholestyramine pretreatment. These are precise label claims, not an independent rereading of the underlying trial data. The previous text only claimed search-result support; this limitation is replaced by exact directly read label sections. Its clinical example remains distinct from all chosen model inputs and does not instruct treatment.

Local complete HTML `/tmp/atlas-pharm-cellcept-label.html`, SHA-256 `b6a9ab32b1229f9513edce53ee8a8c0c1faf0a1dc8c9fea62b45a21396cb5a49`.

## Mathematical and visual corrections

The old72h terminal-exponential tail missed future exposure from drug still in the gut or gallbladder and from subsequent recycling. Its loop also advanced one step beyond the labelled endpoint. The new exact between-meal linear propagator stops at72h and conserves parent-equivalent mass through the event jumps. Future AUC is `(G+A+fr*GB)/(CL*(1-fb*fr))`, assuming meals continue. This produces the exact geometric infinite-time exposure while separately displaying exposure already accumulated. Duplicate event times are removed only for peak detection, avoiding spurious maxima; bile curves retain both sides of each event to display instantaneous emptying. The whole72h curves now fit the axes, which previously stopped at48h. All numerical pharmacokinetic parameters remain chosen examples, not fitted mycophenolate values.

## Validation

- `node --test tests/verification-pharm-recirculation.test.mjs`: **3 groups pass**. All16 biliary/return/meal corners conserve100mg at every saved state and recover geometric AUC; independent fine-grid trapezoidal exposure plus the remaining-state tail; independent Bateman no-return curve; independent RK4 amount propagation and meal jumps; peak detector ignores duplicate-time artefacts and gives no secondary peaks when return is absent.
- `node tests/verification-pharm-recirculation.mjs`: **2 native light/dark groups pass**. All16 actual slider corners; independent every-state mass and infinite-time exposure checks, true72h endpoint, absent-return peak count, full concentration/bile curves, event drops and marker-radius containment; finite readouts and no page/math errors.
- Inspected full-size low/light and high/dark screenshots: `/tmp/atlas-pharm-recirculation-3.11-{low,high}-{light,dark}.png`.
