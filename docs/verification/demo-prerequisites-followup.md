# DEMO prerequisites — producer candidate, 20 October 2026

Thirteen used mathematical prerequisite edges were added to twelve written items and the exact matching syllabus rows. DEMO moves from **12 to 25 written-to-written**, **13 to 26 written-to-known**, and **24 to 37 whole-syllabus** crossfield edges. These are producer counts pending independent review, not accepted global inventory updates. There is no source closure.

All target statements and proof ideas were read, together with the consuming statements and arguments. The last edge was identified through the actual `kc(j,z)` horizon calculation in 3.14 and the shared drift estimator, rather than a general association between forecasting and probability.

| Consumer | Added target | Actual input to the existing argument |
|---|---|---|
| demo-1.4 | pma-8.6 | Exponential addition and its inverse logarithm solve the doubling equation. |
| demo-1.6 | ladr-3.11 | The displayed APC tilt maps to zero under the fitted-rate design map. |
| demo-2.8 | prob-4.1.1a | The surviving first moment divided by survival probability is the conditional mean. |
| demo-2.10 | pma-6.12 | Integral linearity moves the finite sum of cause densities through each interval integral. |
| demo-2.11 | prob-2.1.1a | Independent latent death times give a product of survival events, hence additive cumulative hazards. |
| demo-3.3 | prob-4.1.1a | Survival conditioning normalizes the gamma-weighted frailty mean used in the cohort hazard. |
| demo-3.6 | ladr-7.70 | The first singular component factors into age loadings and the time index. |
| demo-3.14 | prob-2.2.1 | Uncorrelated finite-variance yearly innovations give horizon variance hσ² and standard deviation σ√h. |
| demo-4.2 | pma-6.1 | The grouped fertility sum is the Riemann integral of the piecewise-constant age schedule. |
| demo-4.7 | pma-8.6 | Logarithms turn the strictly positive multiplicative fertility indices into additive effects. |
| demo-4.8 | pma-8.6 | Taking logarithms converts the multiplicative marital-rate model to an affine fit. |
| demo-4.8 | ladr-6.61 | Orthogonal projection onto the constant and age-pattern columns minimizes squared fit error. |
| demo-4.10 | prob-1.6.9a | Substituting the second-moment/variance identity yields the child-weighted family-size gap. |

The explanations state necessary boundaries: positive survival and finite mean for 2.8; latent independence rather than observable verification for 2.11; normalization of survivor frailty for 3.3; nonzero loading sum for the rescaling in 3.6; Gaussian innovations as an additional coverage assumption for 3.14; positive indices for log effects in 4.7; distinct age-pattern entries for coefficient uniqueness in 4.8; and positive mean plus finite second moment for 4.10. Forecast intervals continue to omit parameter uncertainty, as the existing scope says. No executable model was changed.

Two tempting links were rejected. `demo-1.7 → epi-1.8` would create a cycle because epi-1.8 already depends on demo-1.7. The finite-interval uniform differentiation theorem pma-9.42 does not itself justify the improper integral in demo-2.13. The operator-norm approximation theorem ladr-7.92 was also excluded from the Frobenius least-squares claim in 3.6; the SVD decomposition itself is the input added here.

## Verification and preservation

- `node tests/verification-demo-prerequisites-math.mjs`: **4,179 independent cases**. Includes exact APC kernel witnesses, exhaustive truncated finite death-age distributions, constant competing hazards and product survival, direct Simpson integration of gamma survivor moments, orthogonal singular-factor reconstruction, projection normal equations and Pythagoras, grouped-age areas, size-weighted family moments, and exhaustive ±2 innovation sums through horizon 12. The last witnesses deliberately have a non-Gaussian law: the variance theorem alone does not yield normal quantiles.
- `node tests/verification-demo-prerequisites.mjs`: **24 fresh native cases**, all twelve changed explanations at an actual **320px viewport**, light and dark themes. No runtime, TeX or blank-panel failures; each changed explanation and all its inline mathematics fit. All 24 complete output PNGs were personally inspected and were legible without clipping or overflow. Browsers closed after testing.
- `node scripts/build.mjs --strict`: **0 errors, 0 warnings**, 6684 written / 6890 planned / 450 chapters / 85 collections. Static checks for the twelve changed IDs: **0 errors, 0 warnings**.
- An explicit temporary baseline guard at `/tmp/atlas-new-imaging-source/demo-guard.mjs` checked **all 50 DEMO item objects and all 50 visualization functions**. Every property except the owned appended explanations and added dependencies is identical; matching syllabus rows differ only by the exact new dependencies. Shared helpers, collection metadata, and source-audit files are byte-identical. No source flags changed. This snapshot guard is not a default test or a source-acceptance gate.
- Existing bridge steps were searched for the changed IDs: **no bridge consumers**. No bridge, shared runtime, global inventory or accepted ledger was edited.

Raw logs, 24 screenshot paths and their SHA256 hashes are listed in `demo-prerequisites-evidence.json`; raw output is under `/tmp/atlas-new-imaging-source/demo-prerequisites`. The two new probes are explicit-only verification scripts. Independent immutable-candidate review remains required before acceptance. This prerequisite work does not audit historical source claims or clear reproduction/fertility source boundaries.

## Independent-peer syllabus correction

The peer found that 3.14's multiline syllabus row had escaped the producer edit. A narrow followup adds `prob-2.2.1` to that row. The earlier removal-based baseline guard could confirm that no unwanted dependencies were added but did not require every expected addition; its original claim of exact row matching was too strong. The corrected guard now checks the full expected dependency list for every owned row explicitly. Item prose, numerical functions, flags, native evidence and the counts above are unchanged.
