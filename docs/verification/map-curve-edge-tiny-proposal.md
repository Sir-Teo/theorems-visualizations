# Curve edge tiny gate: source and preparation proposal

This is an unwired, new-files-only native edge correctness harness for exact curve factory `f8eb0b366bb98ff906315469f9cc022089f73465` against the actual original `SceneEdges`, `SceneBudget` and `buildWorldPaths` pinned from `90e2e8166a8553008490c67f68ec5fbc862c2045`. No native browser test has run. Existing renderer assets, curve source, static runners and fixtures are unchanged. Independent source/PREPARE review must precede root authorization of the native command.

The guarded final preparation passed 32 bounded recipes with 11 closed served sources. The four child checks saved their outcomes before assertions: default preparation even with the native flag set succeeded; missing flag, near-miss flag and altered candidate were refused as expected. Every guarded child recorded zero browser/server/network attempts. The final results and prepared manifest hashes are in `map-curve-edge-tiny-proposal-evidence.json`; raw evidence is `/tmp/atlas-curve-edge-tiny/prepare-final`. Earlier successful preparation remains in `prepare-1`. There were no unexpected failures in this harness preparation. No job remains running.

## Cases and actual geometry

Sixteen healthy recipes cross butt/round caps, dashed/solid styles, DPR 1/2 and single/multiple tiles with fractional scale and translation. Sixteen further recipes cross DPR 1/2 with full-curve, empty, genuine 32768+1 tail, live replay, released-group abort, metadata denial, scratch denial and original priority. Every range comes from the actual builder. The tail uses two builder-verified one-segment paths and an ordered repeated path list, rather than fabricated segment ranges. Empty geometry is intentionally transparent and is excluded from the positive submission requirement.

Every intended healthy curve case requires real nonempty scratch uploads, positive optimized/index/chunk counters, no original binds, and exact RGBA equality with a separately created fresh original context. Tail submissions must be exactly 32768 and 1. The original subject must itself paint nonempty pixels before the curve subject runs. An original failure stops the run before the alternate context opens.

Live fault injection occurs after a real prefix and requires clear, full original replay and exactly one composite in that order. The released-group case calls actual `releaseGroup(group)` alone after the first actual scratch upload, retaining the truthy deleted handle. It requires stale abort, no replay, no composite and no deleted-buffer bind. Its fresh original reference is explicitly clear-only: the required output is transparent, because the partial mask must never reach the primary canvas. This is an abort safety oracle, not equivalence to a successful full render.

Metadata and scratch denial require original fallback without scratch submissions. Original priority first creates optional scratch, then reserves and allocates a real original-owned native buffer, requiring the optional owner to drop. Driver allocation failure remains a failure to retain, not a simulated allocation success.

## Evidence, ownership and cleanup

Future native output records actual `browser.version()` and queried WebGL version, renderer, vendor and shading language strings in the same invocation. Debug unmasked strings are recorded when supported. Native resources have creation/deletion chronology through cleanup, and budget reservations/releases retain owner snapshots. Assertions recompute exactly one explicit deletion for each created object, inspect the whole chronology for deleted-buffer rebinds, require budget zero and observe actual context loss. This is more than a final zero-live census; it is still limited to these edge contexts, not MapView or worker lifecycle.

Each metadata allocation is one backing buffer with 16 bytes of bounds and 8 bytes of start/count snapshot per path plus 4096 bookkeeping bytes; CPU and GPU scratch are separately counted. Native pressure is real allocated GPU storage. Diagnostic RGBA, submission snapshots, fixture IDs and original upload staging are reported separately and are not falsely counted as candidate budget owners. The logical 64 MB budget is not a total browser/GPU physical-memory ceiling. No current full-map fit or timing claim follows.

The runner saves headers before transport, saves every received raw chunk and descriptor before validating its offset/length/SHA, and checks the assembled byte count and SHA. Metadata, owner/event history, raw RGBA and index snapshots are persisted before native assertions. Failed or incomplete transport remains explicitly incomplete. The first failure stops later cases; page, browser and server cleanup run in finally blocks. No cached result is substituted for a native observation.

## Commands and execution boundary

Preparation only:

```sh
node tests/map-curve-edge-tiny.mjs BASE_ROOT NEW_PREPARE_OUT
node tests/verification-map-curve-edge-tiny-prepare.mjs BASE_ROOT NEW_GUARDED_OUT
```

The completed guarded command used `BASE_ROOT=/tmp/atlas-curve-prototype/run-2/proposal-source` and `NEW_GUARDED_OUT=/tmp/atlas-curve-edge-tiny/prepare-final`. Its builder checks are source/model evidence, not native evidence.

Future root-only command, **not executed by this proposal**:

```sh
MAP_CURVE_EDGE_ROOT_RUN=ROOT_AUTHORISED_CURVE_EDGE_PIXELS_2026_10_20 node tests/map-curve-edge-tiny.mjs --run-root-only PREPARED_JSON NEW_RUN_OUT
```

Both the exact mode and exact flag are required. Default PREPARE opens zero server/browser/network even if the flag is present. Preparation pins all served bytes plus controller/pins hashes. Native execution refuses changes after preparation. The Node controller executes from the immutable stage and imports `playwright-core` there; it does not generate a runner under the output folder. The stage must provide that dependency resolvable from the controller. A resolve-only check succeeded here without importing Playwright or opening a browser; arbitrary external output directories do not alter this source-relative module resolution.

This gate excludes fonts, workers, MapView, S2 lifecycle repair acceptance, broader rendering acceptance and injected same-count style-ID mutation resilience. The exact factory retains its separately reviewed closed-world no-writer premise. No observer/full-map wiring or browser execution is included.
