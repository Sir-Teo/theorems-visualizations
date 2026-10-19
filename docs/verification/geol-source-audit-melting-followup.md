# Decompression melting audit

Ready for root assessment/integration: **geol-4.10**, with `verify:true` retained for atomic integration. A source inconsistency is explicitly retained in the content; this audit verifies which published version the illustration uses, not which conflicting coefficient set is authoritative. Geol4.6 and its dependencies were preserved. No convection/shared-helper changes in this subset.

## Primary source read and version conflict

Read [Hirschmann2000, GeochemistryGeophysicsGeosystems1:1042, DOI10.1029/2000GC000070](https://agupubs.onlinelibrary.wiley.com/doi/10.1029/2000GC000070) in publisher full text, complete relevant §§3–4 and6.4–7 plus abstract/experimental scope: polynomial fitting, interlaboratory uncertainty, composition filtering and limits of a solidus as input to melt production. The PDF download and supplemental table endpoint return403/error. Publisher text received2026-10-18 has **three incompatible coefficient sets** for the nominal recommended fit:

- Abstract: a=−5.104,b=132.899,c=1120.661.
- Table2 HTML: a=−5.1404654,b=132.899012,c=1120.66061.
- §6.4paragraph39: a=−5.904,b=139.44,c=1108.08.

This is not silently repaired from common secondary citations. A bounded publisher response snapshot is `/tmp/atlas-geol-sources/hirschmann2000-publisher-snapshot.txt`, SHA256 `7be3a6af945b5d66cbc0d02ca08e0789672f778cc9216fe66d7275c2c59fc442` (tool-rendered excerpt, **not a full original PDF**). Abstract and¶39 also checked directly in separate publisher responses. No claim to have reconciled the inconsistency or to have audited the full McKenzie/Bickle1988 original; that unverified original-model credit was removed. The illustrated function is now explicitly called **the polynomial version printed in the abstract**, and the coefficient disagreement remains visible in scope.

## Corrections and independent argument

The source supplies a nominally dry empirical solidus with uncertainty; it does not make this illustration's constant latent heat, fixed melting interval, adiabatic gradient or crust prediction a petrological result. These constants are now chosen assumptions. The displayed equations follow directly from Ta−Ts=(LC+DL)F and T=Ta−LCF. Productivity **per pressure drop** is −dF/dP, correcting the previous wrong sign. The positive root is the first crossing (stable quadratic formula), and the melt interval exists only if the lid is shallower than onset. There is no reversed curve claiming melt when a deeper lid prevents ascent to onset.

Full plotting bounds now include the hottest allowed onset6.101347GPa/188.66km,44.11% chosen melt fraction and the entire offset curve, which were clipped by the old4.2GPa/30%/2100°C axes. Pressure and depth use separate correct axes tied to a stated mantle density3300kg/m³ andg9.8m/s². Onset and potential-temperature markers remain fully inside the frame. Only an onset actually reached on the allowed path gets a gold marker; no-melt states explicitly say so. The former “observed6–7km” comparison and unsupported universal10–20% fractions/plume excess temperatures were removed. The integral is called an **equivalent melt-column inventory**, not a prediction of measured crust thickness or a simulation of fractional extraction/active focusing. Its quadratic F gives an exact cubic integral checked against independent quadrature.

## Validation

- `node --test tests/verification-geol-source-audit-melting.test.mjs`: **4 groups pass**, every91temperature values, all9191temperature/lid pairs, onset polynomial/residual/hydrostatic conversion, latent-heat balance, monotonic fraction bounds, exact stopping boundary, productivity versus independent difference and integral versus independent2000-subinterval Simpson quadrature. Covers hottest clipped case and zero melt at/exceeding onset-depth lid.
- `node tests/verification-geol-source-audit-melting.mjs`: **2 native light/dark groups pass**, all4temperature/lid corners plus actual keyboard steps to the near-onset lid boundary, audited displayed values and complete curve/marker extents (marker radii strictly inside). No runtime/TeX/blank errors.
- Four final `/tmp/atlas-geol-melting-{hot,no-melt}-{light,dark}.png` inspected: hottest full onset/path/offset/meltfraction and thick-lid no-melt state in both themes. Final caption distinguishes the dashed unmelted reference from the solid allowed melting interval; lid wording corrected to deeper-than-onset. Syntax and scoped whitespace clean.
- No central queue/master/package/global-build/shared-helper edits. Original-source disagreement remains a recorded limitation; subjective human/listening and Wave5 gates remain open.
