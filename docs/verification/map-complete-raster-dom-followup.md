# Complete production raster DOM experiment — stopped at fidelity failure

**Reject this candidate under the assigned unchanged direct-painter image gate.** The correctness-only smoke stopped at its first scaled-cache hit failure. No performance measurement, expanded matrix or threshold adjustment followed. Production graph.js and all previous experiments/artifacts remain unchanged.

## Bounded implementation and checks

The new test-only `scripts/lib/map-complete-raster-dom-{prototype,runtime,fixture}.mjs` presents the **same existing complete mapRaster Canvas** inside a clipped pointer-transparent DOM layer. Cache construction, original key, highlight identity, four LOD tiers, .6–1.8 zoom interval, coverage and the physically rounded translation are preserved. Cache misses detach the same canvas before original painting, retaining detached native text rasterization. Eligible hits only change CSS presentation; they add no Canvas backing and do not repaint an underlay or words. Ineligible frames detach and call the retained original `_drawProduction()` body. Resize/destroy detach the DOM reference. A cache dimension change zeros the old cache backing before growing it.

The explicit model check passes preservation of the **complete original fallback draw body and painter**, exact cache predicate fragments, and270 independent source-pixel affine mapping witnesses. This proves those source/algebra properties, not a lifecycle or resource acceptance. No production or shared runtime imports these helpers.

`tests/map-complete-raster-dom-native.mjs --smoke` mounts independent original/prototype pages with identical frozen index/planned/graph/helper bytes, camera states and cache history. It records actual cache pixel SHA256, cache metadata, paint/copy counts, and complete DOM screenshots against both unchanged production `_draw()` and current direct `_paint()`. Every image is complete and unmasked. It saves each result before asserting; the raw JSON has `complete:false` because the third state failed.

## Actual failure

The sole run uses Chromium153.0.8010.12, viewport1440×1000, actual map1440×932, DPR1, light. Actual loaded inventory is **13,574 nodes /23,218 edges**, not checkpoint4's23,258 or any later integrated inventory. No claim extends to current unfrozen root data.

| State | DOM vs original mean/255 | DOM vs direct mean/255 | Direct RGB channels differing >20/255 |
|---|---:|---:|---:|
| cold k=.8 |0|0.082800827|0.104067%|
| fractional-pan hit k=.8 |0|1.457475461|0.881021%|
| scaled hit k=1.1, source k=.8 |0.100558337|**2.529006219 — fail**|1.963842%|

The required bound is mean<2/255 and above20 fraction<2%; the mean fails. The scaled hit is a **covered same-LOD ratio1.375**, accepted by production's unchanged cache predicate. Both independent pages retain exactly the same cache metadata and source-pixel SHA `2e0f747f6f0132f68d809be30ce5fb89323011d6fc4c2d4ad83d5bc4840fad7b`. Prototype hit paint count0 and Canvas drawImage count0; original hit drawImage count1. Owned extra raster count is the same2,818,688 pixels at DPR1; the promoted object is literally mapRaster.canvas.

The production screenshot itself differs from the same direct painter by **2.533012935/255 mean,1.963023% above20**, also failing that direct bound. Thus the failure predominantly exposes inherited wide-scale raster resampling drift, rather than a new cache-history/content discrepancy. DOM sampling differs slightly from Canvas drawImage even with identical source pixels/rounded transform. I personally inspected all three complete failing-state PNGs: the DOM and original cached pictures visibly agree closely, while the direct picture has sharper/smaller chapter text and different current-camera stroke/node sampling. This is not grounds to relax the assigned bound or certify the candidate.

## Evidence and limits

Raw result is committed unchanged as `map-complete-raster-dom-smoke.json`; source/protocol text and hashes plus all9 PNG hashes are committed in `map-complete-raster-dom-smoke-evidence.json`. Original files and PNGs: `/tmp/atlas-map-complete-raster-dom-smoke/`; logs: `/tmp/atlas-map-complete-raster-dom-{smoke,model}.log`. The input hashes are index49b65fb05a860fab028600ff07b84a6e6dd7773b959d38aebea72233b54e68f5 and planned9627cdd57f3131e3876efeeaf5ebe3d1f5d06f6450c1a104a6d1e028c1f8ebbd. Production graph9a8850528193c87e97deba14a387bebff3215e9e67569c125cac265e061f94fc is recorded in raw evidence.

This first fixture did **not freeze generated atlas.css**. It served the coordinator file; its observed post-run hash is792d9bdaa2e9978863ff78a42a5d5d87e084b9f8d810941de07def487ddff29f, matching the coordinator's checkpoint4 CSS note. This is an explicit provenance limitation, not a claim of immutable served CSS bytes. Any future independently assigned fixture must freeze/hash atlas.css along with index/planned and source. There was no rerun to repair provenance after the fidelity rejection.

The smoke ends after three states, before dark/DPR2/narrow/oversized, later LOD/focus/filter states, trusted native input/hit tests, resource setter observer, resize/theme/font/destroy coverage or independent peer. **None of those unrun checks is claimed to pass.** Browser and server closed through finally handlers. No timing was collected and no sixty-fps claim is made.

The hypothesis remains distinguishable from the prior split compositor, but the exact requested combination of broad production cache history and direct-painter fidelity fails this bounded counterexample. Tightening cache reuse, adding live text, changing the acceptance reference or running timing would require a new explicit assignment; no such change is included here.
