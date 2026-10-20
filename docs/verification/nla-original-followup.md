# NLA3.15: actual 1947 original and replayable modern illustration

Candidate retains `verify:true` for independent acceptance. The chapter replaces only3.15 with an isolated item module; only its corresponding syllabus row changes. Existing arithmetic, norm/reference helpers, all neighboring items and prior tests/fixtures are byte-identical.

## Source actually obtained and compared

The original publisher endpoint still denies direct access. The complete79-page original *Bulletin of the AMS*53(11):1021–1099 PDF was retrieved from the public2025-02-04 publisher capture, not an abstract or a different collected-works paper:

- [Archived original AMS PDF](https://web.archive.org/web/20250204013009id_/https://www.ams.org/journals/bull/1947-53-11/S0002-9904-1947-08909-6/S0002-9904-1947-08909-6.pdf)
- [Original DOI](https://doi.org/10.1090/S0002-9904-1947-08909-6)
- `/tmp/atlas-worker-three/historical-sources/neumann-goldstine1947.pdf`, SHA256 `b6ce0b92f22d90df1ebb868e958583c1397deb360aff3825e7a0024f3b007a21`.

Read original1021–1039,1045–1060,1081–1082 and1089–1099 for every retained historical claim; actual relevant sections include§§1.1–1.5,2.1–2.5,3.3,4.1–4.5,5.1–5.3,6.9 and7.2–7.8. Personally inspected independently rendered actual1045/1052/1056/1092/1098 pixels (`historical-sources/nla1947-p*.png`). The full body is available, but this is a comparison of the material cited in the entry, not a formal verification of all79pages of inequalities. The extracted reading text is beside the PDF.

The paper separates modeling/observational/truncation/computational errors and focuses on computation. Its fixed-point s-digit inputs are exact for its analysis; input conversion belongs to the observational category. It uses strict conditional estimates rather than assuming independent random roundoff. Its ‘definite’ means symmetric nonnegative semidefinite (actual1045footnote21), with nonsingularity needed for inversion. General complete positioning for size exchanges both rows and columns; its direct estimates specialize to definite matrices, with general nonsingular matrices reduced through a Gram matrix. Exact§5.1 uses A* A; the algorithmic§6.9 chooses A A* for convenience. The public summary says Gram reduction and does not conflate these orientations. Actual1092 explicitly interprets an approximate inverse as the exact inverse of a nearby matrix and gives a near-singular alternative. Section7.8 adds statistical assumptions about extreme singular values; its illustrative precision estimates are not universal bounds or direct partial-pivoting guarantees. All retained hypotheses and historical attributions match these anchors.

## Resulting behavior

The separate modern p-bit partial-row-pivoted experiment is retained, with unchanged reference algorithms and documented JavaScript-double limitations. The old syllabus falsely attributed κu and4ⁿu comparison curves to the original paper’s estimates/refutation; it now distinguishes the actual historical analysis from the authored curves. Caption/legend identify both left datasets, all right-panel Gaussian/Hilbert samples, the unit guide and display floor. Numerical readouts retain actual error/residual values, including below the plotted floor.

Resampling previously changed an unregistered seed. A local strict share-state adapter now preserves it exactly, validates integer1..2147483647, and wraps the next resample at the declared maximum. Raw precision/order setters reject fractional/out-of-range inputs before the shared setter can round or clamp them. Both existing family choices and every integer control value remain usable. No shared runtime changes.

Both plots now use the full available width. Independent narrow checks caught a comparison-line endpoint’s half-stroke crossing the plot edge; the diagonal is drawn inside the plot and logarithmic margins contain every full data marker/stroke, including floor values. Unit hline guides intentionally span the plot; their horizontal endpoints are viewport guides rather than sampled data markers. No failed solves are joined over gaps.

## Verification

- Four new mathematical groups pass. An independent Python `Fraction` implementation performs exact-rational ties-to-even p-bit rounding after every operation and independently implements partial-pivoted elimination. It matches all54cases: every Hilbert order2..24 at12/26bits, plus eight seeded Gaussian matrices. Raw local domain checks, all discrete values, saved seed/resample reproducibility/max wrap, finite full datasets and failure-gap semantics also pass.
- All seven existing factorization/reference groups pass unchanged, including the90-digit Hilbert condition estimates at every order2..24 and original exact-rational reference validation. Combined11/11, log `/tmp/atlas-worker-three/nla-original-final-math.log`.
- Focused static1item/0errors/0warnings: `nla-original-static.log`.
- Six fresh native groups1450/430/320×light/dark pass: both families; every precision/order tick and all corners; native keyboard endpoints; multiple actual resamples; snapshot/replay of every dataset/readout; independently edited state including maximum seed and next-resample wrap; direct numericDOM=model;17malformed raw snapshots per group visibly rejected with exact whole-default rollback; all full data paths/markers/text/TeX/page bounds; actual norm and residual reconstruction. Source labels/legend/readouts are explicit. The final captions/legend are included in the fresh430/320groups; earlier1450geometry/executable checks precede only those prose/legend additions. Logs `nla-original-native-{light,dark}.log`, own screenshots `nla-original-native/`.
- Personally inspected own320light default fullpage/Hilbert high-order panel and320dark independently edited replay page/random scatter. Data above unit error remain shown, source versus modern experiment is readable, controls and rendered scientific notation fit. Actual source pixels were independently inspected as above.
- Isolated strict full build at `/tmp/atlas-worker-three/nla-original-build`:6684written/6890planned/450chapters/85collections,0errors/warnings,112784bytes gzip home. Log `nla-original-build.log`. Generated files remain outside the worktree.
- Byte guards confirm every unowned chapter object/syllabus row and prior arithmetic/reference/test files match parent003e624; `git diff --check` passes.

Early narrow test failures were actual diagonal half-stroke clipping, then test instrumentation errors (`M.mm` was not an exported API; a hand-edited select snapshot needs its registered index/label schema rather than a raw string). These were repaired and the full six-group matrix rerun successfully. No source uncertainty is silently closed here; independent peer acceptance remains required.
