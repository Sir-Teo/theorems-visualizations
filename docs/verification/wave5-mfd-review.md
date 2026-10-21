# MFD5 independent review

Status: accepted on final frozen source after independent source, model, production replay and visual review.

Reviewer: wave5_reviewer. No content changes by the reviewer. The existing matrix-exponential alias5.5 is preserved.

## Sources and proof prerequisites

Independently read Lee, *Introduction to Smooth Manifolds*, second edition, the relevant Lie subgroup, exponential, adjoint and quotient passages (Theorems19.26,20.12, Proposition20.8 and Theorem21.10) from the actual [book PDF](https://math.berkeley.edu/~jchaidez/materials/reu/lee_smooth_manifolds.pdf). Cross-checked the authored references [Etingof's official MIT notes](https://live.ocw.mit.edu/courses/18-755-lie-groups-and-lie-algebras-ii-spring-2024/mit18_755_s24_lec_full.pdf), especially homogeneous spaces and Theorem9.11, and [Meinrenken's action notes](https://www.math.toronto.edu/mein/teaching/LectureNotes/action.pdf), Theorem1.21 and proof. Ritter's3-page PDF opens but its text is encoded; the closed-subgroup claim/proof was independently checked in Lee rather than inferred from unread encoded text.

All eleven authored statements and proof ideas have been read. They distinguish embedded closed subgroups from connected immersed subgroups, local BCH/logarithm behavior from global identities, and proper/free actions from dense irrational flow. The SU(2) covering is proved by quaternion conjugation, kernel and an invertible differential, without using a future covering item or claiming that an endpoint diagram classifies homotopy.

The prerequisite audit identified that mfd3.4 is the embedded-submanifold definition, not the inverse-function theorem. The author added pma9.24 where IFT is actually used, corrected the homogeneous-space inputs to closed-subgroup and constant-rank results, and matched the Lie-correspondence proof to invariant fields, exponentials and Frobenius. Chapter5 syllabus dependencies are synchronized by the author.

## Independent finite calculations

`/tmp/wave5-mfd-review-oracle.mjs` passes with Node22:

- 400 traceless2×2 exponentials agree with an independently implemented70-term matrix power series.
- 400 quaternion/rotation states agree with independently evaluated Rodrigues rotation, matrix action and antipodal equality. SU(2)'s real4×4 representation respects quaternion multiplication.
- 400 Heisenberg/positive-affine group states agree with independent matrix multiplication and inverse identities.
- Five BCH states agree with independently multiplied exponential series and the quadratic bracket correction.
- All21 offered helper Pell indices agree with an independent second-order integer recurrence. The exact alternating ±1 certificates and nonzero signed stable errors agree; no subtractive cancellation creates a false exact return.

The chapter's15 mathematical tests and DG's11 tests also pass together under Node22 (26/26), separately from these independent oracles.

Resolved initial findings include the spinor scope describing an omitted component when two full complex components were actually drawn; tiny saved t causing undefined scaled BCH ratios; unstable subtractive Pell errors; and a plane-stage equal-aspect near-return plot flattening the data. The author now describes the plotted components correctly, guards underflow, supplies exact BigInt Pell certificates with stable errors, and uses a separate logarithmic return chart with a shared floor. The later production-only findings and resolutions are recorded below.


## Focused native checks

Independent execution of the chapter-local harness runner for5.2,5.6,5.7,5.10,5.12 at actual1200/320 widths in both themes passed692 state checks,364 real control actions and128 replay/rejection checks, producing80 captures. Log: `/tmp/wave5-mfd-review-native.log`. All revealed modes and slider endpoints, edited state remounts, malformed state fallback, and tiny saved BCH steps1e−200 and Number.MIN_VALUE pass. Full dot/ring/handle bounds, actual canvas text ink, display-math viewport bounds and native/model values are checked.

Inspected the narrow captures available through this sweep, including the full-component SU(2) mode and the logarithmic irrational near-return chart. All22 narrow default harness captures across both themes have now been inspected, together with selected SU(2), BCH, covering and quotient modes.


## Final production acceptance

Independently ran final actual production checks for5.3,5.6,5.10,5.12 in both themes at1200/320:16 successful groups and72 edited/off-grid/tiny-value/malformed URL replays across the final focused runs. These use the real Create state link button and exact captured-part/readout comparisons. The physical5.3 handle drag survives Share replay. Steps1e−200 and Number.MIN_VALUE survive actual5.6 URL decoding exactly with an explicit underflow explanation. Final5.10 native End and Share replay pass after the browser-canonical decimal endpoint correction. Logs: `/tmp/wave5-mfd-review-production.log` (successful5.3 groups before the discovered5.6 failure), `/tmp/wave5-mfd-review-production-final.log` (final5.6 groups before a runner-only decimal-serialization assertion), `/tmp/wave5-mfd-review-production12.log`, `/tmp/wave5-mfd-review-production10.log`.

The independent production sweep found the wide5.6 statement display that the harness had missed. The author split it into a definition of Z(t) and a two-line expansion; final full text ranges and display-math bounds pass at320. The runner now compares browser-canonical native range serialization rather than an arbitrary EPS tolerance, while model snapshots must still replay exactly. Author's broad sweep separately found the4π native serialization endpoint issue, now fixed and independently confirmed. BCH now explicitly depends on5.4's exponential/local logarithm; authored and syllabus dependencies match.

Inspected all22 narrow default harness captures and final production statement/scope captures for5.6 light,5.10 dark and5.12 light, plus their charts and selected alternative modes. No clipped formula, marker or legend remains. The final5.12 focused run has full dot/ring clearance at least2.874074 CSSpx and glyph/halo clearance at least3.115623 CSSpx; final5.10 clearance exceeds33 CSSpx. The author independently completed44 production cases and the full1532-state harness matrix as supplementary evidence.

No unresolved content finding or source uncertainty remains. The production utility injects only chapter records/shards in memory; root's source-aligned generated build/export remains the integration gate. All source bytes are frozen after the final metadata correction. No reviewer content edits.
