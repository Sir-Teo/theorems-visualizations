# Single-factor S2 paint-readback omission proposal

This is a new **source/model/PREPARE proposal**, not a native result. It implements the single control in `17b5c141d3189ce87104bcb7a7f5703fc01133e3`: omit only the painter observer's before-read and after-read calls across its five paints. Property/metric observations, actual painter invocations, original capture chronology, errors and comparisons remain fixed. First stop `35fc7302`, protocol `1730a9cc`, prelaunch dependency stop, and both native histories (`35fc` and root `6ddf9109` / independent `a446d806`) are not modified or reclassified.

The new identity is `tiny-old-S2-no-paint-readbacks-light-v1`. The entry point `tests/verification-map-tiny-s2-no-paint-readbacks-prepare.mjs` defaults to blocked PREPARE, using a unique `atlas-tiny-s2-no-readbacks-prepare-` temporary directory. Explicit output must not exist, even as an empty directory. Its only execution switch is `--root-authorized-s2-no-paint-readbacks-light`, which has **not been invoked**. Old full-case and previous diagnostic flags reject. Root must separately authorise native execution after independent source review. The generated runner retains the known bare `playwright-core` import: an eventual native output must have dependency resolution available, such as a new output within an immutable stage with the existing dependency symlink. This proposal does not repair or conceal the prior external-output dependency stop.

## Exact source factor and buffer accounting

The new helper composes the exact original source through the unchanged pinned `63608647d8bf52a872f9e4c6493fb54b693d88b5` diagnostic helper. The latter's full SHA256 is required before composition; original runner/fixture hashes remain required too. The saved pre-factor fixture SHA256 is independently pinned to `396ca38574fa48c5979db6b8eb51f2d8934a74beec06b11537f611be7ca1c660`. Every replacement must occur exactly once and reverses byte-for-byte. The PREPARE manifest records both the complete reconstruction and the smaller factor-only delta against that baseline, including generated runner hashes parameterized by immutable source root and unique output paths.

The factor removes these two call sites, replacing each with an explicit absent comment:

```
observeRead('diagnostic-before-paint-'+ordinal,c.canvas);
observeRead('diagnostic-after-paint-'+ordinal,c.canvas);
```

The `paintState` before/after calls remain, including all current-font measurements, computed/context/font properties, map/scene input records, event/paint ordinals and original painter calls. No context normalization, cache setting, extra paint, frame wait, font load or suppressed event is introduced. The connected control still appends before context creation, temporarily swaps only `m.ctx`, uses the same saved painter once, and restores/removes in `finally`. Its capture remains a real `observeRead`, now diagnostic-read ordinal 1. The after-control original Canvas equality guard remains unchanged.

Ten labels are explicitly absent: before/after labels for paint ordinals 1–5. Their omission does not create blank or fabricated images, replacement hashes or false observation events. Nine full raw buffers remain in this exact order:

1. `control-gpu-0`
2. `control-reference`
3. `fault-before-fallback-1`
4. `fault-canvas-2`
5. `fault-canvas-3`
6. `reference`
7. `actual-final-canvas`
8. `diagnostic-connected-reference`
9. `diagnostic-actual-after-connected`

The first seven are the original buffers, with the same capture labels and calls. The last two remain the distinct connected and after-control observations. There are seven Canvas readbacks and two GL captures. Native output assertions require exactly this ordered inventory, five before/after property observation pairs with ordinals 1–5, exactly one connected diagnostic read at ordinal 1, and no event fabricating an omitted readback label. These same assertions are exercised by the adverse model checks; the model records are explicitly contract fixtures, not fabricated native evidence.

The remaining generated-runner distinctions are the new identity/scope, explicit inventory assertions and identity-only copy of the supplementary comparator. Complete raw/RGB comparisons of all three original final buffers remain. The original detached/reference comparison helper and thresholds are unchanged. The retained `fault-canvas-2` and `fault-canvas-3` hashes can distinguish the two actual paints without reintroducing between-paint readbacks. No exact agreement is required or predicted for the connected control. An eventual changed result would show sensitivity to this readback omission bundle under this sequence, not a proved acceleration, cache or font mechanism.

The existing checked 64 KiB transport and raw-before-assertion persistence, original error contract and old negative lifecycle result, 64M/8M logical caps, complete comparisons, original capture ordering, finally cleanup/restoration and first-unexpected-failure stop remain. The new inventory assertions run only after raw metadata/images and full comparisons have been saved. All application, fonts, renderer, original diagnostic source, accepted fixtures, helpers and current full-case source are unedited. The PREPARE manifest hashes 72 protected source paths, including the unchanged original composition helper and the new proposal sources.

## Focused source/model/PREPARE evidence

Run once against final source:

```
node tests/verification-map-tiny-s2-no-paint-readbacks-model.mjs /tmp/atlas-ctrl-s2-no-readback-proposal-model-closing
```

Generated-source syntax, complete reverse reconstruction, exact saved baseline fixture hash, absence of the two call sites, retained property/metric/painter/capture/connected-finally source, and protected hashes pass. Three actual PREPARE subprocesses pass: default blocked, explicit PREPARE and explicit unique output. Twenty-six adverse checks reject: twelve inventory mutations (missing/extra/reordered/duplicate buffers, fabricated omitted reads, old/extra read ordinals and missing/extra/changed paint observations), two altered original source inputs, and twelve bad argument/output cases. Existing raw/file bytes and empty directories remain intact. The first source/model/PREPARE pass is separately retained at `/tmp/atlas-ctrl-s2-no-readback-proposal-model`; final source only gives the default temporary output prefix its distinct identity. Neither pass starts a browser/server or executes native code. The companion evidence JSON records the final results.

Independent review must precede any separate root-native authorisation. No old failure is retried or overwritten. Repaired S2, reference correctness, context restoration, production/full-map readiness, lifecycle acceptance and timing remain unproved and outside this proposal.
