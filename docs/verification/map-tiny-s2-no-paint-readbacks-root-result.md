# S2 without added paint readbacks — root result

One new old-S2/light diagnostic exits zero from immutable `00616e6fcdfcddb65cc251ad9d7c86bddcce6224`, after source `5cadebb9`, independent source peer `4dcf9462` and root Node 22 model/PREPARE verification. This is a completed diagnostic measurement; independent saved-evidence review is pending. It establishes neither reference correctness nor repaired lifecycle acceptance.

Root ran once from `/tmp/atlas-root-s2-no-readback-stage`:

```sh
/tmp/atlas-ci-node22-20261020/node tests/verification-map-tiny-s2-no-paint-readbacks-prepare.mjs --root-authorized-s2-no-paint-readbacks-light --output /tmp/atlas-root-s2-no-readback-stage/native-evidence
```

The unique output and sibling `/tmp/atlas-root-s2-no-readback-stage-native-evidence.log` remain intact. Both browser and server close. There is no failed or repeated native attempt. The generated runner resolves dependencies from the staged output, preserving the earlier external-output module-link failure as separate evidence.

Exactly the ten added before/after-paint readbacks are absent; the five property/metric observation pairs, painter calls, original capture sequence, connected control and after-control equality guard remain. Nine complete raw buffers, seven Canvas readbacks and two GL captures remain. All original thresholds and the old negative lifecycle assertions are unchanged. The saved record has 43 events, no page error or fixture failure, and zero cleanup bytes/owners/pending/native objects, terminated workers and disconnected scene.

`fault-canvas-2`, `fault-canvas-3`, final actual, fresh connected reference and after-control actual all hash to `d23157dea4aa595a1fee223abeb54077633fbd005e24ad1ecaf545802a7f85dc`. Their complete raw comparisons are exactly equal. The detached reference remains `7fd820eb5e7a078e87ed90775193b9c079b1f6e5ee1fe5fa32107302df97cf45`: actual versus detached differs at 3,297 RGBA channels/994 pixels in [66,153,178,167), and 2,213 composited RGB channels. This reproduces the earlier glyph-only reference discrepancy.

With the added readback bundle present, the previous saved diagnostic changed paint 3 and final actual to `8df8e48e…`, while paint 2 and the fresh connected control were `d23157de…`. The new result supports sensitivity to omitting that bundle under this sequence, which includes its allocation/hash/record work. It does not identify a browser acceleration, raster, cache or font mechanism, isolate an individual call, or prove that connection alone resolves the original reference discrepancy. The metric/property observers remain present. No reference, threshold, exclusion mask or original failure is replaced.

Root independently verifies all nine raw hashes and PNG decodings, all three complete comparisons, distinct actual-paint equality and unchanged after-control bytes; four whole pictures are personally inspected. Audit: `/tmp/atlas-continuation/s2-no-readback-root-audit.json`. The first offline audit's mistaken raw-RGBA versus composited-PNG assertion is retained in `s2-no-readback-root-audit-first-stop.json`; the corrected offline decoding uses the canonical theme composition and does not rerun native rendering.

First native `35fc7302`, the connected-control diagnostic, its prelaunch dependency stop, and the original exact-zero reference requirement remain preserved. No further native variant is authorized by this result. S2 repair, context restoration, broader lifecycle and production readiness remain open. Wave 5 remains unstarted.
