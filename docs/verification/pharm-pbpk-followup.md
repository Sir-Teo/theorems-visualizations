# Pharmacology PBPK source audit

Ready for parent integration: **pharm-3.9**. Source flag remains true pending independent parent checks and ledger update.

## Authored mathematical source actually read

Jusko and Li (2021), [Assessment of the Kochak-Benet Equation for Hepatic Clearance for the Parallel-Tube Model: Relevance of Classic Clearance Concepts in PK and PBPK](https://pmc.ncbi.nlm.nih.gov/articles/PMC9639621/), *AAPS J* **24**, 5, DOI **10.1208/s12248-021-00656-z**. Read the complete authored mathematical analysis; the directly relevant section is **Relevance of Model-Dependent Clearances in PBPK**, equation **10**, its definition of tissue/venous partitioning and free-drug factors, and the complete **Limitations** discussion. This later analysis presents the mass-balance equation and explains its assumptions. The original 1968 thiopental study was not reread and is no longer presented as the numerical model's source. No empirical validation or parameter reconstruction is claimed.

Local full HTML `/tmp/atlas-pharm-jusko2021b.html`, SHA-256 `f46771f8e8eadffd57d1014144167da05a18f87aed21b0f22901dbddcfe00f15`; full extracted text `/tmp/atlas-pharm-jusko2021.txt`.

Every numerical capacity, flow and partition coefficient is now explicitly chosen. A common blood basis, blood/plasma ratio one and unbound fraction one are stated. The parallel topology omits portal flow and other biological complexities. The symmetric-matrix quadratic form is derived independently under these assumptions; it is not used as evidence for clinical accuracy.

## Corrections and evidence

The old fixed log range discarded low concentrations, attempted to plot zero tissue values and drew the 3000-minute marker beyond a 600-minute window. Complete positive curves now fit adaptive log bounds, initially zero tissue concentrations are explicitly omitted, and the base window expands to include the exact marker. Marker values use the actual selected time rather than a nearest stored sample. Tiny concentrations retain significant digits. Exact eigenmode propagation replaces unnecessary time stepping, and eliminated mass is independently integrated from the hepatic loss rate rather than set to dose minus body mass. The 2500–3000-minute slope is labelled a finite-window estimate, which need not yet equal the terminal mode.

- `node --test tests/verification-pharm-pbpk.test.mjs`: **3 groups pass**. All 12 partition/flow/capacity corners at five times through 3000 minutes against an independent, augmented **amount-based** matrix exponential implemented with Taylor scaling/squaring; symmetric conductance quadratic form and eigen residuals; every-point positivity/mass for three contrasting traces and finite-difference verification of the integrated elimination flux.
- `node tests/verification-pharm-pbpk.mjs`: **2 native light/dark groups pass** on the final blood-label formatting and shared local KaTeX/fonts. Three actual partition buttons × two actual base windows × all eight true flow/capacity/time-marker corners per theme. Independent exact endpoint, marker/window, positive-rate and every-point mass checks; all entire log curves and organ rectangles inside bounds; no page/math/readout errors.
- Inspected regenerated full-size hydrophilic/high/late-marker/dark and lipophilic/low/early-marker/light screenshots. Final screenshots: `/tmp/atlas-pharm-pbpk-3.9-{0,1,2}-{0,1}-{0,7}-{light,dark}.png`.
