# Exact deliberate Worker-error contract — protocol-only proposal

Separate closing source/CPU-model boundary after frozen first native stop35fc7302a68d3e584499e9e71297d1a3ef5a3cc4. That stopped output, assertion and all raw/image/event hashes remain unchanged. **No browser, native retry, full map or timing ran.** Root/imaging must independently review this protocol before any further repaired-case execution.

The deliberate uncaught Worker throw is supposed to dispatch a native Worker ErrorEvent and propagate its error to the page. It is wrong to require pageErrors=[] for repairedS1 while preserving that unhandled dispatch. The new Node-side assertion validates output only; it cannot filter, preventDefault, suppress, retry or rewrite a browser event.

For S1 repaired, it requires exactly one pageerror, in order: `declared tiny native worker failure`. The recorded native error sequence must be exactly: trusted native-worker-error with message `Uncaught Error: declared tiny native worker failure`, trusted actual-worker-error-dispatch with that same message in fault phase, and trusted window-error with that same message in fault phase. No additional error record or pageerror is permitted.

For oldS1 the old defect remains expected: pageerrors are exactly `map is not defined`, then the deliberate worker error. Its recorded sequence is the same trusted native worker error, then trusted fault-phase window ReferenceError, then the actual trusted Worker dispatch observer, then trusted propagated window worker error. This strengthens the old loose substring gate while preserving its exact negative outcome. S2/S3 require zero pageerrors and zero Worker/window/fixture error records. Unknown source variant/case, any fixture failure, wrong message, count, trust, phase or order fails.

Exactly two runner literal changes are declared and independently reconstructed against the first boundary: import the new helper, and replace the repaired-only blanket empty-error assertion with one exact contract call before the old/repaired branch. Every other runner byte is exact, including raw-before-assert ordering, normal GPU/Canvas controls, all original negative checks, private source routes/transforms, actual browser/Worker/WebGL observers, pixel helper, stop-on-first-failure, owner cleanup and all thresholds. No error is removed from saved evidence.

The explicit CPU model reads all7preserved native records from the first committed evidence. All satisfy this exact error contract; that does not retroactively make the first aborted run pass or execute any later output gate. Seventeen separate mutations fail: unrelated/duplicate/missing pageerror; wrong/duplicate/missing/untrusted Worker event; wrong phase or missing window propagation; fixture failure; old reference error on repaired source; reordered old errors; unknown variant/case; and unexpected S2/S3 errors. Outcomes are saved before assertions. Evidence /tmp/atlas-ctrl-native-error-contract-model, committed summary map-native-tiny-error-protocol-evidence.json.

The oldS2 detached-reference pixel discrepancy remains unresolved and unchanged. RepairedS2/S3/dark, exact Canvas fallback, context restoration, complete per-object native cleanup chronology and any complete cohort acceptance remain unproved. A later run may stop at another unchanged gate; there is no threshold relaxation, reference substitution, renderer source fix or authorization to retry from this proposal.

Explicit CPU-only reproduction:

```sh
node tests/verification-map-native-tiny-error-contract-model.mjs UNIQUE_OUTPUT
```

For an immutable archive lacking Git history, set MAP_TINY_FIRST_BASELINE to an exact35fc7302archive. The model imports no Playwright and opens no browser/server. This producer changes only the new protocol assertion/helper/model/report/evidence and the two stated runner literals. Existing static light/dark cases and all source/input/helper bytes outside the new tiny protocol remain unchanged. All jobs are closed.
