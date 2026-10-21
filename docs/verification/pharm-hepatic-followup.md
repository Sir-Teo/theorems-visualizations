# Pharmacology hepatic-clearance source audit

Resolved: **pharm-3.6**. Parent independent mathematical/native checks and screenshot inspection passed; source flag and ledger are reconciled.

## Mathematical source actually read

Jusko and Li (2021), [Assessment of the Kochak-Benet Equation for Hepatic Clearance for the Parallel-Tube Model: Relevance of Classic Clearance Concepts in PK and PBPK](https://pmc.ncbi.nlm.nih.gov/articles/PMC9639621/), *AAPS J* **24**,5, DOI **10.1208/s12248-021-00656-z**. Read the complete authored mathematical analysis, especially **Introduction equations1–3, Assessment/TableI, Additional Considerations equations6–7, In Vivo PK equations8–9, PBPK equation10, and Limitations**. This commentary contains its own derivations and calculations, including the explicit parallel-tube formula and independently reproducible table; it is a later source for the classic relations, not a claimed rereading of the1973/1977 originals or a new empirical validation of either liver model. The article's debate about model interpretation is not presented as settled empirical fact. The simple displayed relations are independently derived and checked under their stated assumptions.

The chosen90L/h default and presets are now explicitly illustrative. Blood flow, fraction unbound and clearance use a common blood-concentration basis; different models' fitted intrinsic clearances are not asserted interchangeable.

Local full HTML `/tmp/atlas-pharm-jusko2021b.html`, SHA-256 `f46771f8e8eadffd57d1014144167da05a18f87aed21b0f22901dbddcfe00f15`; full extracted text `/tmp/atlas-pharm-jusko2021.txt`.

## Corrections and validation

The well-stirred elasticities E and1−E were incorrectly displayed for the parallel-tube selection. Exact model-specific values now use `eX=u/expm1(u)` and `eQ=1−eX` for parallel tube. Its clearance uses `expm1` for numerical accuracy at low capacity. Capacity extremes0.01 and20000L/h exceeded the previous plot's0.1–10000 axis; both now fit with marker margins. The capacity asymptote is restricted to its visible segment rather than drawing an off-scale diagonal. The text correctly notes that both models approach capacity and flow in their respective limits, with differences between.

- `node --test tests/verification-pharm-hepatic.test.mjs`: **3 groups pass**. All8 actual flow/fraction/intrinsic-capacity corners×both models independently verify mass balance/extraction limits;401 capacities×both models compare exact elasticities with centred logarithmic finite differences; primary TableI rounded anchors; independent fine-step plug-flow integration.
- `node tests/verification-pharm-hepatic.mjs`: **2 native light/dark groups pass**. Both actual model buttons, all3 preset buttons and all8 true slider corners per model/theme; independent clearance and exact-elasticity checks, whole curves/rectangles/marker containment; finite readouts and no page/math errors.
- Inspected full-size low-capacity well-stirred/light and high-capacity parallel-tube/dark screenshots: `/tmp/atlas-pharm-hepatic-3.6-{0,1}-{low,high}-{light,dark}.png`.
