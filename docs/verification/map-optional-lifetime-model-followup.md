# Optional map ownership and lifetime fault models

Source-only boundary against accepted root `b6ca416f8b95b8e93bd12b9973ab0999f6519942`. No implementation, production, original data, routing, timing, browser or full-map execution changed. These explicit probes intentionally retain failing safety expectations and exit nonzero on the four observed failing cases; this is a findings report, not a passed lifecycle gate.

The chunk model directly instantiates actual `chunkedEdgesClass(SceneEdges)` with actual original `SceneEdges` and `SceneBudget`. Its bounded recording GL records allocation, draw, clear and deletion calls and supplies deterministic error injection; it does not rasterize or provide native GPU evidence. One two-point path is repeated 32,769 times to reach both chunk boundaries with a small deterministic input. The source hashes and summaries of all cases are in `map-optional-lifetime-model-evidence.json`; complete call logs remain in the hashed raw files.

Twenty-one of 22 chunk cases satisfy their assertions:

- Normal live snapshot preserves exact ordered membership across chunks of 32,768 and one indices; original-class construction-stream comparison is exercised.
- Metadata ownership denial, explicit metadata removal, the corruption marker, unsupported uploaded join, nonselected fidelity and force-original all retain the original rendering route. Scratch ownership denial and scratch GL-allocation failure are also covered. Original model/group owner entries retain their exact object identities.
- Original reserve pressure drops metadata/scratch before the original reserve can evict an otherwise-evictable original model. An impossible original reserve remains a visible capacity error while preserving the non-evictable existing model/group. The first run incorrectly left only 128 bytes for the original mask, producing an additional mask-capacity failure; that failed run was preserved. The corrected fixture explicitly leaves 12,288 mask bytes plus 128 headroom, with the same ownership expectations.
- Injected live-prefix failure and a chunk GL error clear the current clip and replay the full original stream. The live-prefix call ordering is checked: partial draw, clear, full original draw, then exactly one composite. No claim about raster equality follows from recorded calls.
- The existing private stale/released fault modes, generation change, control change, group-registry removal, coverage-identity replacement, original model release and context loss all reject the snapshot without original replay or partial composite. The runtime frame is cleared in every case.
- Every case, including the failing case below, releases budgeted resources to zero, restores the wrapped budget methods and deletes each recorded GL resource once.

## Finding: released group handle can pass the private liveness check

The unweakened `releaseGroup-alone-must-invalidate` assertion fails. During the first scratch upload the model calls the actual `releaseGroup(g)`, leaving that group in `scene.groups`, and injects a chunk GL error. Original release deletes the buffer and removes its budget owner, but leaves `g.buffer` truthy. The private `live` predicate accepts the retained handle; the catch path records one live replay and one original bind, rather than throwing a stale-snapshot error. The original bind therefore receives a deleted buffer handle. The existing private `fault.mode='released'` additionally sets `g.buffer=null`, so it does not cover this distinction.

This is a private API/fault-contract gap, not a demonstrated user-triggered interleaving: ordinary scene replacement currently releases and removes groups synchronously. Native driver behavior and the full scene's Canvas fallback are outside this source-only probe. The test retains the expected stale-abort/no-replay assertion and its failure; no implementation fix or weaker expectation was substituted.

## Actual scene lifecycle findings

The second probe imports the complete actual `WebGLMapScene` class body, with its full `toString()` compared to accepted source. It rewrites dependency import URLs only and substitutes a minimal painter dependency to avoid unrelated text-canvas behavior. Deterministic document/canvas/Worker fixtures run the actual constructor, initialization, lazy geometry request, draw guard, fallback, disposal and destroy methods. There is no real worker thread, native context event or browser claim.

All three safety cases fail, persisted before assertions:

1. Invoking the actual worker error handler changes status to `geometry worker failed`, then throws `ReferenceError: map is not defined`; the owning map receives zero redraw requests. The free identifier is in `initialize`, outside the constructor's `map` parameter scope.
2. A lazy `edges:8` request is pending when resources are disposed. Its rejection runs after generation advances and changes a deliberately marked replacement-ready state to `Scene generation disposed`, adds `edges:8` to the cleared failure set, hides its scene canvas and clears active status. This isolates the missing generation guard; it is not a fully initialized native restoration case.
3. The same late rejection after actual `destroy()` overwrites `destroyed` and repopulates the cleared failure set on a dead, removed scene. The initialization `ready` catch has dead/generation guards; this lazy catch does not.

No source fix is included. These findings need separately scoped implementation and actual lifecycle validation before any acceptance claim.

## Reproduction and evidence

Create an immutable archive of accepted root `b6ca416f` containing `scripts/lib`, `assets/js` and `tests/map-chunked-indices-model.mjs`, then run from this test boundary:

```
node tests/verification-map-optional-lifetime-model.mjs ARCHIVE UNIQUE_CHUNK_OUTPUT
node tests/verification-map-scene-lifecycle-fault-model.mjs ARCHIVE UNIQUE_SCENE_OUTPUT
```

Both intentionally exit 1 against the unchanged accepted source: chunk 22 cases/one failing contract; scene three cases/three failing contracts. The probes save results before assertions, collect remaining cases after failures, and retain final failure summaries. No default test/status snapshot is added. The existing accepted `map-chunked-indices-model.mjs` still passes its 256 membership fixtures, reserve-priority check and complete original edge-class preservation check.

Raw `/tmp/atlas-map-optional-lifetime/final-chunk/results.json` and `scene-run-1/results.json`, their console logs, and every earlier run are retained with SHA-256 provenance in the evidence JSON. No browser or server was started. Independent deep review remains pending.
