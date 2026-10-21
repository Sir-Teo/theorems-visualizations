# Private lifecycle repair proposal — source/model only

Separate proposal after negative evidence `6833fd9f404af5ac1ce4c4396814c708aaaccb1c`, using unchanged accepted root `b6ca416f8b95b8e93bd12b9973ab0999f6519942` as source input. No production asset, original data, existing chunk runtime, prototype, old fixture, static runner or negative probe is edited. There is no browser, full-map, timing or native lifecycle execution. Integration wiring and native validation remain future work.

## Three minimal declared snippets

The new explicit-only `scripts/lib/map-lifecycle-private-repair.mjs` exports separate scene and chunk source transforms; existing runners do not import it. It requires exactly one match for each original snippet, rejects already-applied/missing/duplicate snippets, and reconstructs the complete input byte-for-byte by reversing only the declared replacements.

1. Worker errors return immediately if the scene is dead or their captured initialization generation has expired. A current error retains the fallback and calls the owning `this.map.draw()` instead of the free `map.draw()` identifier.
2. A lazy geometry request captures its current generation. Its rejection returns immediately after death or generation replacement; a current rejection retains the original failure-set update and fallback.
3. The private chunk variant additionally requires `this.budget.entries.has(g)` in its existing liveness predicate. Releasing an original group removes that owner immediately even though its deleted GL buffer handle remains truthy. The private catch therefore aborts the stale snapshot rather than replaying through that handle. All other liveness checks, clear/replay behavior, rendering code, algorithms and resource ownership remain exact.

The helper does not modify any input file. The comparison generates a new isolated source copy under a unique evidence directory and applies those three snippets there. Its other 59 copied source files remain byte-identical. The original input hashes are checked again after all processes complete. The entire actual scene class body is compared with its supplied source before running any scene model; only dependency import URLs and the deterministic painter dependency fixture are adapted by the unchanged negative scene probe.

## Same safety assertions, old versus private repair

`verification-map-private-lifecycle-repair-model.mjs` invokes the frozen negative probes without changing their cases or expectations against both roots. It saves process logs/results before asserting the comparison. It also runs six additional actual-class saved-callback cases against both versions. No safety assertion is relaxed or replaced by an expected success result.

| Probe | Cases per source | Original failures | Private proposal failures |
| --- | ---: | ---: | ---: |
| Actual chunk class + original SceneEdges/SceneBudget | 22 | 1 | 0 |
| Frozen actual scene fault cases | 3 | 3 | 0 |
| Saved callback / reinitialization cases | 6 | 5 | 0 |

The chunk comparison repeats all original-priority ownership denial, metadata missing/corrupt/unsupported, scratch allocation, live replay, stale/released invalidation, generation/control/registry/coverage/model/context invalidation, owner-identity and cleanup assertions. In particular the release-only case retains its required stale-abort/no-replay expectation; it fails on original source and succeeds with the ownership predicate. The 21 previously passing cases remain passing. Every chunk case frees budgeted resources, restores budget methods and avoids duplicate recorded GL deletion.

The original three scene cases retain their redraw and no-late-mutation requirements. Added cases retain saved old worker error handlers after disposal, destruction and actual reinitialization, reject old lazy geometry promises after actual reinitialization, verify current-generation errors still redraw, and verify old worker messages cannot resolve current requests. The last message guard already succeeds on original source and stays intact. Actual initialization/disposal/destroy methods run; a deterministic Worker and document/canvas fixture plus minimal painter dependency replace platform APIs. Recording GL does not rasterize. These results establish bounded source-model behavior, not native restoration, worker scheduling or pixel fidelity.

## Evidence and reproduction

The proposal depends on the frozen negative probes from `6833fd9f`; do not rewrite them or use their cached outcomes as the comparison. Supply an immutable `b6ca416f` archive with `assets/js` and `scripts/lib`:

```
node tests/verification-map-private-lifecycle-repair-model.mjs ARCHIVE NEW_OUTPUT_DIRECTORY
```

The output directory must not exist. Each old process still exits 1 on the reproduced faults; each privately repaired process exits 0. The comparison requires identical case names and the same probe programs on both roots. Final observed result: 31 cases per source, nine original failing cases, zero proposal failures; 59 other source files preserved.

Raw `/tmp/atlas-map-private-lifecycle-repair-2/comparison.json` contains all six process results and source hashes. Its individual process directories retain complete case snapshots and call logs. The initial proposal attempt at `/tmp/atlas-map-private-lifecycle-repair-1` is also retained: an authoring typo in the new S2 replacement literal omitted a closing parenthesis, causing its two repaired scene imports to fail before cases ran. That typo was corrected in the new helper; the final run used a fresh directory and reran all old and proposal cases. The earlier failure and logs are hashed in the evidence JSON, with no cached result rewrite.

Independent review is pending. Native lifecycle and later integration wiring must independently establish the complete Canvas fallback, worker/context event behavior and pixels; this source-only proposal does not close those gates.
