# Population-genetics source review C2 — peppered-moth evidence

**popgen-4.13 ready for central integration; flag remains true.** Wave 5 remains gated.

## Original primary source read

Cook, Grant, Saccheri and Mallet, [Selective bird predation on the peppered moth: the last experiment of Michael Majerus (2012), Biology Letters8:609–612](https://dash.harvard.edu/bitstreams/7312037c-b346-6bd4-e053-0100007fdf3b/download), full original Harvard author-repository PDF, five physical pages including the repository cover. SHA256 `9abb78b3b687feee50764ee2b8fdbdabe8fc2f67035dd038a0d2fd9de81ae8de`. Complete original main text and references read: physical2–5 = printed609–612. Relevant full Methods printed610 and Results/Table2/Discussion611; printed611 was also visually inspected in a rendered scan.

The original specifies dominant inheritance of carbonaria, low-density local-moth release onto natural branches,4,864 released moths, absent individuals presumed eaten and about26% of disappearances directly observed as bird predation. It reports daily selection.091 with likelihood-estimated95% interval.028–.157. This is daily survival, not whole-generation viability. Its Table2 labels six release-count rows **2002–2007**, whereas Figure1 labels the corresponding survival series **2001–2006** (confirmed visually). The atlas explicitly uses **Table2 labels as printed** and exposes the conflict; it does not claim to have resolved original calendar metadata.

Detailed supplementalS3 and the older Haldane/Kettlewell/1986 originals were not read. Unneeded original-specific priority claims, purported historical endpoint calibration and an ancillary transposon-paper claim were removed. The phenomenon entry now rests on the complete original2012 experiment, not on an unread original historical reconstruction. Bürger’s complete genotype-selection treatment §4.2–4.3 pp.12–15 (author PDF SHA256 `b835aeed538990a30684fb57d7acdbb8ecfe4b0e53a6f9d5997d3295dec9fa15`) supports the separate two-allele model.

## Corrections and independent statistical reconstruction

The old historical anchors were not supported as a consistent data series, mixed populations, and a55-generation path extended beyond its calendar viewport. The left view now openly uses chosen synthetic endpoint targets and a generation axis0–55. Both rise and decline curves retain explicit dominant-phenotype and allele distinctions; the target-fit button fits only those chosen synthetic endpoints.

The right view shows actual survival proportions from **all six Table2 count rows**, with observed counts fixed while toy selection controls move. Its independently specified binomial model gives each year a typical-survival baseline u_y and a common melanic ratio r, with probabilities u_y and r*u_y. For each r, differentiation yields a quadratic for u_y, solved using its cancellation-safe smaller root. Profiling those six baselines and maximizing in r gives **r≈.9090719, s≈.0909281, LR≈8.633284**, reproducing the article’s rounded coefficient and Table2 fitted expected counts. The module does not claim to reconstruct all of supplementalS3 or its reported interval calculation. The reported interval is attributed to the original; daily inference remains separate from synthetic generation-level coefficients.

## Verification

- `node --test tests/verification-popgen-moth.test.mjs`: **4/4 independent groups passed**: independently counted diploid genotype survivors for both regimes; independent root bisection and chosen endpoint attainment; all original counts summing to4,864 and survival ratios; independent baseline score-root solutions; a SciPy**1.18.1** `minimize_scalar` profile reference (r=.9090718849626173, LR=8.633284037176963); and all12 source-table expected counts to their printed rounding.
- `node tests/verification-popgen-moth.mjs`: **2/2 actual light/dark groups passed**: four toy-control corners, real target-fit button reaching98%/10% at the chosen generations, all12 source observations unchanged, explicit six Table2 year labels, actual fit-overlay toggle, and full path extents. Runtime/KaTeX checks pass. An initial test sampled immediately after clicking, before the render frame; it was fixed to wait for the actual UI update and rerun successfully. No product defect was hidden by that harness timing correction.
- Combined moth/sickle helper regression: **7/7 math groups passed**. Scoped static: **one item,0errors,0warnings**. All five dependency arrays preserved; prior4.12 and other entries retained. No existing shared helper or central file changed; whitespace clean.
- Screens `/tmp/atlas-popgen-moth-{fit,counts}-{light,dark}.png`; inspected fit light. Original table scan `/tmp/atlas-popgen-cook-table-4.png` was also inspected. Finite mathematical/UI checks do not certify every original causal inference or resolve its conflicting year labels.

New exports appended to `content/popgen/source-audit-empirical.shared.js`; prior sickle functions unchanged.
