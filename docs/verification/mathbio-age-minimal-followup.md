# Bounded MATHBIO 4.14 per-call and minimal-pattern followup

The MATHBIO4.14 convergence failure at checkpoint13 `d4bceeceeb2dee2d197c974133327f8d4993bb67` remains **OPEN** and checkpoint13 remains **FAILED**. Previous evidence-only diagnostic `787bf97c7a70f728095a3d81ab17875ab3c0aba8` retains the original unchanged-file failure and inspector failure with coarse/middle rates equal. This separate bounded continuation did not produce another failing caller or prove a root cause. It justifies no correction, weaker assertion, retry/quarantine or forced runtime policy. No physical model, quadrature, reference root or assertion changed.

## Declared observers and reductions

The immutable source remains `/tmp/atlas-new-mathbio-age-diagnostic/source`, archived exact d4bceece. The original test/helper/all MATHBIO module hashes remain exactly the preceding diagnostic's hashes. In particular, test SHA2560d11ad82d82f6884100454fcdfbf67b694b41761c8593b1cfbe6712bf540795e and helper SHA25609bf13ef0f6449ec3aaf462aad88177a51a1690f1b90feada0cc2435cee5b19a are unchanged.

Four finite call patterns were declared before each cohort: the full seven actual tests; the actual PDE test followed by actual convergence test; twelve actual default-h helper warmups (b=.3,1,2 ×stable/young/old/flat) followed by actual convergence test; and the actual convergence test alone. Reductions copy the original convergence callback verbatim, with absolute imports into the same immutable source. They remove warmup/check contexts rather than changing the tested physics or convergence assertion.

Two explicit per-call observers were tried. The helper-return observer uses a loader overlay that changes only the final return into an equivalent result object, records requested h and actual local h/na/nt/r, assigns a WeakMap identity to the actual returned object and returns that same object. Its source signature/defaults and every calculation preceding the return are unchanged, but this extra return observation can change optimization. The caller observer leaves the entire helper module untransformed and adds a wrapper only in a diagnostic copy of the test import/call binding. It records arguments and returned h/na/nt/r/age count/object identity, then returns the exact object. That wrapper likewise changes the call/optimization history. Neither observer is equivalent evidence to an unobserved failed run.

Both observers also enable inspector pause-on-exceptions, ready to capture a failed caller's actual a/c/d fields and a===c/a===d/c===d in the same declared history. A separate inspector-only cohort keeps direct calls and the entire helper bytes untouched. Its reduced-file matching captures the same fields on failure, without a helper-return or caller-return hook. Debugger scope materialization remains a caveat. All observer source versions, transformed-source hashes/literals, copied test sources, arguments, PID metadata and raw outcomes are pinned in the adjacent evidence manifest.

## Complete finite observations

Runtime remains Node26.8.2/V8 14.6.202.34-node.28, darwin arm64. This continuation launched98 bounded child commands, all recorded and completed. These are diagnostic configurations, not a pass-rate acceptance criterion:

| Cohort | Fixed bound and outcome |
|---|---|
| Helper-return observer |6 children for each of the four patterns =24; no failure. |
| Caller-return observer, helper bytes untouched |6 for each pattern =24; no failure. |
| Inspector-only direct calls |10 full-file,8 PDE/convergence,8 warm12/convergence,8 cold/convergence =34; no failure. |
| Concurrency-two scheduling probe |8 declared pairs =16 children: each pair runs the exact file alongside an observer child; first4 use inspector-only, last4 caller-return observer. No failure. This is not a full-suite retry. |

The per-call cohorts retain948 primitive snapshots of actual returns. Every recorded requested/default h equals returned h; na=round(12/h), nt=round(30/h), and age count=na+1. Every returned object has a distinct WeakMap identity within its process. All rates exactly match the previously retained normal rates for the same b/h. No caller failed in any of these same per-call histories. Therefore the key requested failing combination—actual requested h, returned object/grid/rate, and failed caller bindings in one history—was **not obtained**. Correct observed returns do not retroactively explain away the earlier failures.

The final pairs specifically vary process-level CPU/compiler scheduling with concurrency2 while leaving the exact test/helper assertions intact. Their success neither proves nor disproves a tiering/scheduling mechanism. No new failing tier/return trace, minimal failing subset, helper mutation or numerical-reference defect was identified. The prior paused coarse/middle anomaly remains a concrete actionable lead; an optimizer bug or precise caller-versus-helper corruption remains unproved.

## Stop boundary and retained evidence

Per coordinator instruction, all observations are frozen and further child variants have stopped. No speculative corrective patch is proposed. The original failed checkpoint, prior two failing diagnostic children and all previous39 observations remain intact. The98 new commands are a separate cohort; do not merge them into a new successful checkpoint or substitute them for a full default suite. No browser, map, full-suite or timing execution occurred.

Own nondefault utilities are verification-mathbio-age-call-observer.mjs, verification-mathbio-age-minimal-diagnostic.mjs, verification-mathbio-age-minimal-inspector.mjs and verification-mathbio-age-paired-diagnostic.mjs. They require explicit archive/output paths and are not imported by the default suite. The minimal runner enforces unique empty output; the paired runner fixes its maximum at eight pairs and stops on a failure. Raw root `/tmp/atlas-new-mathbio-age-calls` contains every source/configuration and progress manifest under run-1 through run-4. The adjacent evidence JSON pins full raw SHA/size manifest, child arguments/statuses, source hashes and per-call grid/identity audit. All child processes have exited; no browser/server/background job is active.
