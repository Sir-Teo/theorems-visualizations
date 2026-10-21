# PROB6 independent review

Status: accepted on final frozen source after independent source, model, production replay and visual review.

Reviewer: wave5_reviewer. No reviewer content edits.

## Actual source and hypotheses

Independently read the actual author-hosted Durrett fifth-edition book, Chapter6, printed pp331–350, including the Birkhoff/maximal-lemma proof, both equidistribution forms, stationary-increment recurrence and Kac proof, all four Liggett proof steps, positive matrices, Poissonization/LIS and passage-time applications. Source: [Durrett's book](https://sites.math.duke.edu/~rtd/PTE/PTE5_011119.pdf); preserved local research `/tmp/wave5-prob-pte.pdf` and chapter text. The live official PDF also opens successfully.

All17 statements and proof ideas have been read. They retain the conditional invariant limit, set-dependent Borel exceptional sets versus every-start intervals, component rather than unconditional drift, Kac's full-saturation condition, and the exact block-stationarity/integrability conditions of the Liggett version. LCS uses joint ergodicity and explains why marginal ergodicity is insufficient. Positive matrices have entrywise log moments; the almost-sure LIS coupling and later attribution of the constant2 are explicit. Finite-box passage optimization is an upper bound for full-lattice passage, not a time-constant estimate.

Two deliberate verify flags remain for the unnumbered source definitions inserted as6.1.1a/6.1.4a; their mathematical content is checked, and the author report identifies the numbering situation. These are preserved inventory flags, not unexamined theorem claims.

## Resolved initial findings

- Collapse arrows now terminate at floor(j/2), matching the actual pushed-forward mass calculation.
- Irrational rotation's Fourier proof now names the written L² trigonometric completeness prerequisite RCA4.24; the invariant-set definition is also explicit. The Riemann-only PMA Parseval statement alone would not cover an arbitrary measurable indicator.
- Rational1/5 examples cache a five-phase cycle, preserving exact finite periodicity even at saved bin-boundary phases; the irrational symbolic values retain their declared binary64 interpretation.

## Independent model evidence

`/tmp/wave5-prob-review-oracle.mjs` passes996 cases under Node22:

-150 independently multiplied exact-BigInt120-factor matrix products, including endpoint and mixed probabilities, agree with recovered logarithmic norms and normalized entries.
-400 constant-matrix states agree with the closed Fibonacci row-sum formula through200 factors.
-24 weighted boxes agree at every destination with independently implemented all-pairs Floyd–Warshall, rather than the authored Dijkstra or author's Bellman–Ford tests.
-416 finite-return states agree with independent gcd component sizes and exact sum-of-return-gap identities.
-Six rational starting phases, including bin boundaries and a subnormal, repeat the cached five-phase orbit exactly through1500 observations.

The chapter's initial15 substantive mathematical tests also pass separately (`/tmp/wave5-prob-review-math.log`), including exhaustive short maximal-lemma observables, return masks, subsequences and strict increasing chains. Final production and visual evidence follows below.


## Preliminary visual inspection

Inspected all34 actual320 visualization defaults in both themes from `/tmp/wave5-prob-production`, including the final dynamically scaled equidistribution histogram. The finite-component averages, strict-maximal set, rational versus irrational orbit, return/saturation example, DP chain, renormalized matrix table and bounded-box paths are legible and distinct. Author's complete68-group native matrix is supplementary; the independent focused native/replay run below also passes.


## Final production acceptance

Independently ran6.2.6,6.3.2,6.3.3,6.4.4,6.5.4 through actual1200/320 production rendering in both themes:20groups,348 physical control/handle actions and80 real Share/off-grid/out-of-range/malformed URL replays pass (`/tmp/wave5-prob-review-production.log`). Conditional controls are exhausted in every revealed mode. The interval handle's physical drag and captured hover extent survive actual Share links; replay must preserve exact model parts and readouts. Complete paths, arrows/heads, circles, rectangles and dot/rings remain in bounds. Minimum full geometry/ring clearance1.632353 CSSpx; minimum glyph/halo clearance3.115624 CSSpx in this independent selection.

Inspected final actual320 rich statement/scope captures for the every-start interval theorem, Kac and joint LCS, alongside all34 narrow visualization defaults and alternative modes. Final equivalent formula layouts fit their actual production text columns, and the narrower scope statements retain their hypotheses. The author's68-case all-item matrix and final targeted captures are supplementary evidence. No remaining source, model, state or presentation finding.

The two documented source-numbering verify flags remain intentionally attached to the inserted unnumbered definitions; no mathematical claim is unexamined. All source bytes are frozen. No reviewer content edits. The runner injects chapter catalog/shard responses in memory; root's source-aligned generated build/export remains the integration gate.


## Final positive-tiny-phase correction

A late raw-state check found avoidable cancellation in `((x % n) + n) % n`: a positive saved phase1e−200 became zero. With interval left endpoint equal to that phase, the first visit was wrongly excluded. The author now returns a nonnegative remainder directly, adds the period only for negative remainders, and normalizes negative zero. This chapter-local helper change is covered by a sixteenth mathematical regression; final16/16 tests and all996 independent oracle cases pass.

A bounded `/tmp` utility independently repeated6.2.6 actual1200/320 in both themes, including physical handle/control edits and three tiny phase=left-endpoint values: Number.MIN_VALUE,1e−200,1e−20. Every raw URL preserves exact phase/interval state, counts the independently expected11visits out of20, and survives an actual Create state link replay unchanged. Final run:4groups,92 physical actions,40 URL/rejection checks (`/tmp/wave5-prob-review-tiny.log`). Browser closed. This resolves the late finding and restores final acceptance on the corrected frozen helper bytes.
