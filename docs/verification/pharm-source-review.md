# Pharmacology: source follow-up, 18 October 2026

This first follow-up closes pharm-3.7, pharm-3.11 and pharm-4.5. Six other pharmacology source flags remain, including the partially reviewed pharm-4.6; a closure here does not certify every source in the collection.

## Evidence read

- [Benet (2010), Clearance (née Rowland) concepts: a downdate and an update, complete original eleven-page author paper](https://europepmc.org/articles/PMC3005114?pdf=render), J Pharmacokinet Pharmacodyn 37:529–539, doi:10.1007/s10928-010-9187-8. Read the complete relevant clearance/first-pass discussion, pp. 529–534, including Eqs. (1)–(6), high/low extraction, blood-concentration reference, and the stated 1,500-mL/min average hepatic flow for a 70-kg man. Read the abstract's explicit equilibrium/transport limitations. This is a later paper by a developer of clearance theory, with a full mathematical derivation; it is not falsely recorded as a reading of the still-unread Rowland–Benet–Graham 1973 original.
- [CELLCEPT US prescribing information, complete current label](https://dailymed.nlm.nih.gov/dailymed/fda/fdaDrugXsl.cfm?setid=37241e87-4af4-4dc3-a1aa-ea6f20d8dc40), retrieved 18 October 2026. Read the complete relevant §12.3 absorption, distribution, elimination/metabolism/excretion account and complete cholestyramine interaction subsection. It explicitly describes MPAG-to-MPA recycling, secondary peaks usually 6–12 hours after dosing, and approximately 40% lower MPA AUC after cholestyramine pretreatment in 12 volunteers. These support the example, not the invented meal timing or its numerical parameters. Unrelated indication/dose/safety sections are not being claimed as read.

- [Cockcroft–Gault (1976), Prediction of creatinine clearance from serum creatinine, complete eleven-page original scan](https://www.drugtnt.com/ref/RenalDosing/Cockcroft_1976.pdf), Nephron 16:31–41, doi:10.1159/000180580. Read the complete original using OCR and visual checks of the displayed formula and full limitations discussion. Derivation used 249 men aged 18–92; the selected comparison group substantially overlapped the derivation group. The female 15% reduction was a recommendation, not an independently fitted regression. Steady renal function, muscle mass, urine-collection/assay limitations and creatinine clearance versus inulin clearance are explicitly discussed. Giusti–Hayton 1973's complete original returned HTTP 403, so that attribution remains an open part of pharm-4.6.

Originals are under `/tmp/pharm-primary`. Hughes–Glass–Jacobs 1992 was located at its publisher, but the complete PDF returned HTTP 402; the abstract/metadata do not close pharm-3.12. No attempt was made to bypass the payment requirement.

## Corrections and outcomes

| Item | Outcome |
| --- | --- |
| pharm-3.7 | Closed. The exact displayed liver-only model gives oral AUC=Fa·Fg·D/(fu·CLint) at every extraction level. Corrected the contrary claim that enzyme changes barely affect oral exposure at low extraction: first-pass survival changes little there, but systemic clearance changes strongly. Clarified that all quantities use blood as reference and checked 90 L/h against the cited 1,500 mL/min value. Corrected the finite-curve tail: drug still awaiting absorption contributes future AUC, as does central drug, including coincident absorption and elimination rates. |
| pharm-3.11 | Closed. Read the full relevant original prescribing-information sections rather than search snippets. Qualified secondary peaks as possible rather than inevitable after every meal. The geometric factor assumes continuing meals and fb·fr<1. The old tail estimate used only current central drug and ordinary elimination, omitting future absorption and repeated recycling of remaining gut/bile drug. Derived the exact remaining AUC from U=A+G+fr·GB: U is continuous at meals and drains at CL·C·(1−fb·fr), hence tail U/[CL(1−fb·fr)]. Removed an extra numerical step after the stated 72-hour endpoint. The model now recovers the tenfold exposure at fb=.9, fr=1 even when considerable drug remains stored after 72 hours. |
| pharm-4.6 | Retained. Original Cockcroft–Gault equation and limitations read in full; Giusti–Hayton’s full original remains inaccessible. Removed the silent 5-mL/min/4%-function lower floors and made the normalized impairment cap at 1 consistent with the displayed Q formula. Added the steady-state, body-composition and female-factor limitations. Clarified that curves start drug-free and can remain far from steady state at 96 hours; the marked target is a steady-state mean. Readout describes illustrative model regimens rather than treating invented drug parameters as a patient prescription. |

## Validation

- `node --test tests/verification-pharm-source.test.mjs`: five groups, checking the full inverse oral-exposure sensitivity over low/high extraction and changing flow, blood-flow unit conversion, independently integrated Bateman curves plus exact tails including ka=k, and conservation/geometric exposure for 18 meal/fraction scenarios. Cockcroft–Gault units, sex factor, impairment bounds and equal steady-state means are independently checked. Trapezoidal quadrature error is below 0.01% of the analytic exposure.
- `node tests/verification-physio-pharm-browser.mjs`: serial real Chromium with both themes and pinned KaTeX via `installBrowserAssets`. Exercises normal/inhibited/induced enzyme buttons, low/high capacity and changing flow, and the recirculation endpoints fb=.9/fr=1 and fr=0 with different meal gaps, plus extreme renal-function controls and both sex selections. No source statement is used as a substitute for numerical or control checks.

Evidence paths: `/tmp/physio-pharm-verification-browser.json`, `/tmp/physio-pharm-verification-shots/`.

## Initial-flag coverage ledger

This records the actual review state; a source-location attempt alone is not a completed item review.

| Initial item | Status |
| --- | --- |
| pharm-3.11 | Closed; evidence and validation above. |
| pharm-3.12 | Reviewed; entire model/caption inspected, independent post-infusion ODE checks pass. Hughes1992 full paper still HTTP402; exact drug parameters, simulation scheme and reported comparisons remain unread. |
| pharm-3.4 | Reviewed; retained. Complete Brodie–Bernstein–Mark1952 and Price1960 originals, conditioned thiopental volume/clearance values and clinical brain/waking interpretation remain unread. Reviewed all amount/effect-site equations; independent conservation tests, final-post-last-bolus crossing and full concentration/time plot extents corrected. |
| pharm-3.6 | Reviewed; well-stirred model and 90L/h flow checked against Benet2010. Corrected parallel-tube elasticity labels and capacity clipping. Original parallel-tube comparison/history evidence remains open. |
| pharm-3.7 | Closed; evidence and validation above. |
| pharm-3.9 | Reviewed; retained. Complete Bischoff–Dedrick1968 original and primary anatomical/flow parameters remain unread. Reviewed full perfusion/capacity/eigen/ODE model. Corrected tissue/plasma versus whole-blood reference, effective unbound intrinsic capacity and finite-tail interpretation; independent organ flux and amount balance tested. |
| pharm-4.5 | Closed; complete relevant current prescribing-label concentration/distribution/monitoring sections read; sharp clinical boundaries corrected, steady-state plot/units checked. |
| pharm-4.6 | Reviewed; complete Cockcroft–Gault source, math and browser checked. Giusti–Hayton complete original remains inaccessible. |
| pharm-4.9 | Reviewed; peak-ratio limitation corrected; exact infusion peak/trough/AUC/time-below-MIC independently checked. Original peak/MIC and comparative-toxicity evidence remains open. |

### Hepatic-model follow-up

pharm-3.6 remains flagged for its still-unread original parallel-tube comparison and combined historical attributions. Its well-stirred derivation and reference blood flow are now checked against the complete Benet2010 paper already read above. Corrected the parallel-tube diagram, which incorrectly labeled its flow/capacity elasticities as E and 1−E (those belong to the well-stirred model). For z=capacity/Q the parallel-tube elasticities are 1−z/expm1(z) and z/expm1(z). Expanded the capacity axis to include the 20,000L/h control endpoint. Both models now use the stable expm1 formula and explicit whole-blood reference. A sixth independent math group checks central finite-difference sensitivities at nine capacity/flow combinations in each model; two fresh browser theme groups exercise switching models, intermediate extraction and maximum capacity.

## Therapeutic-reference and infusion review

Read the complete relevant current DailyMed [theophylline extended-release label](https://dailymed.nlm.nih.gov/dailymed/fda/fdaDrugXsl.cfm?setid=f93e20b1-97aa-088d-e053-6394a90a25d4), Serum Concentration–Effect Relationship, full Distribution and Monitoring Serum Concentrations sections; and the [Digoxin label](https://dailymed.nlm.nih.gov/dailymed/fda/fdaDrugXsl.cfm?setid=dba3b3f7-3ff2-4996-8653-b0e54a398bf9), complete §§2.5 and 5.3. Theophylline gives 5–20mcg/mL bronchodilation, 10–15 peaks for most benefit with lower risk, and possible toxicity within 10–20 when binding falls. Digoxin associates <.5ng/mL with less efficacy and >2 with greater toxicity, but permits toxicity below2 and requires appropriately timed sampling. Full label HTML/text is `/tmp/pharm-primary/*-label.*`.

Closed pharm-4.5. Removed sharp “toxic/ineffective” assertions, identified the exact reference-band limitations and sampling conditions, and distinguished the toy’s geometric-mean target from a clinical target. The accent curve formerly showed drug-free accumulation while its caption/readout claimed periodic steady state; it now plots periodic steady state, with drug-free accumulation dashed separately. Digoxin unit conversion is explicit in the existing target-dose calculation.

Reviewed the full 4.9 infusion computation. The threefold peak claim fails at long half-life (the displayed 12-hour example gives only about1.48-fold); qualified the accumulation restriction. Replaced sampled metrics by exact rectangular-infusion peak/trough, daily AUC and threshold-crossing times. Independent concentration integration/sampling checks 27 half-life/interval/MIC combinations. Clinical peak/MIC and toxicity claims still require complete original evidence, so 4.9 remains flagged.

Reviewed all 3.12 content and both infusion modes, including the eigenproblem, stopping conditions, curve/bar ranges and explicit invented-parameter limitations. Independent RK4 mass equations verify nine plasma-holding half-times for three drugs/three durations. Removed an unsupported broad pre-1992 history claim. The complete Hughes1992 paper is still unretrieved (publisher402), so the original six-drug study, scheme, range and Shafer comparison remain source gaps; flag retained.

## Final retained-item follow-up

**pharm-3.4:** Complete Brodie–Bernstein–Mark1952 and Price1960 originals, conditioned thiopental volume/clearance values and clinical brain/waking interpretation remain unread. Reviewed all amount/effect-site equations; independent conservation tests, final-post-last-bolus crossing and full concentration/time plot extents corrected.

**pharm-3.9:** Complete Bischoff–Dedrick1968 original and primary anatomical/flow parameters remain unread. Reviewed full perfusion/capacity/eigen/ODE model. Corrected tissue/plasma versus whole-blood reference, effective unbound intrinsic capacity and finite-tail interpretation; independent organ flux and amount balance tested.

Ten independent math groups now pass. All nine initial pharmacology flags have an actual content/model review; six retain specified source gaps and three are closed. The retained status does not certify unread sources.

Final control validation: all 58 unique physiology/pharmacology item/theme groups passed in serial Chromium with installed pinned KaTeX, actual native controls, runtime/TeX checks and screenshot capture. This includes all newly reviewed eight physiology and five pharmacology items. A text-only Patterson–Starling readout correctly does not contain a KaTeX node; the harness still installs the actual renderer. Selected final screenshots were visually inspected, including severe volume loss/high volume, normal oedema balance, repeat-bolus redistribution and PBPK tail. Static combined physiology/pharmacology/mathbio check: 167 items, zero errors/warnings.
