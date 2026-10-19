# Pharmacology first-pass source audit

Resolved: **pharm-3.7**. Parent independent mathematical/native checks and screenshot inspection passed; source flag and ledger are reconciled.

## Mathematical source actually read

Jusko and Li (2021), [Assessment of the Kochak-Benet Equation for Hepatic Clearance for the Parallel-Tube Model: Relevance of Classic Clearance Concepts in PK and PBPK](https://pmc.ncbi.nlm.nih.gov/articles/PMC9639621/), *AAPS J* **24**, 5, DOI **10.1208/s12248-021-00656-z**. Read the complete authored mathematical analysis, including Introduction equations 1–3, Table I, Additional Considerations equations 6–7, In Vivo PK equations 8–9, PBPK equation 10 and Limitations. In Vivo PK explicitly discusses oral dose/AUC and the well-stirred intrinsic-clearance relation. This later mathematical commentary supplies its own analysis; the 1973/1977 original papers were not reread, and this review is not presented as empirical validation of the chosen numerical example.

Independently cancelling the displayed well-stirred relations gives `AUCpo = fa*fg*D/x`. This depends on linear kinetics, liver-only systemic elimination, constant absorption/gut fractions, and a common blood-concentration basis. The 100 mg dose, 100 L volume and other numerical presets are chosen illustrations.

Local full HTML `/tmp/atlas-pharm-jusko2021b.html`, SHA-256 `f46771f8e8eadffd57d1014144167da05a18f87aed21b0f22901dbddcfe00f15`; full extracted text `/tmp/atlas-pharm-jusko2021.txt`.

## Corrections and validation

The old explanation incorrectly said enzyme changes barely affect oral AUC at low extraction. In this model oral AUC has an inverse capacity dependence at every extraction ratio: dividing capacity by four multiplies oral AUC by four, and tripling it divides AUC by three. The exposure change combines both availability and systemic-clearance changes. The numerical AUC tail now includes remaining gut drug, which the old `C/k` approximation omitted at short windows. Plot bounds now contain the lowest flow-accounting rectangles and complete concentration curves; small AUC values retain useful precision.

- `node --test tests/verification-pharm-firstpass.test.mjs`: **3 groups pass**. All 16 configured fraction/flow/capacity corners independently verify mass accounting and analytic AUC cancellation; low/high-extraction enzyme factors and flow independence; all 48 corners/modes compare numerical trapezoidal AUC plus exact remaining gut/central tail against analytic AUC (relative error below 0.0001).
- `node tests/verification-pharm-firstpass.mjs`: **2 native light/dark groups pass** after the parent's shared logarithmic-slider endpoint correction. Both themes cover all 16 actual slider corners and all three actual enzyme buttons, independently check AUC and availability/clearance ratios, and check whole concentration curves and flow-accounting rectangles for containment. The corrected maximum is actually 5000 L/h in the native run, also inspected in the regenerated high-capacity screenshot; the configured endpoint is covered independently by the unit tests.
- Inspected regenerated full-size induction/high/dark screenshot after the core correction, as well as baseline/low/light: `/tmp/atlas-pharm-firstpass-3.7-{0,1,2}-{low,high}-{light,dark}.png`.
