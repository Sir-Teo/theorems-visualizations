# Independent peer: isolated GPU operation census

**Accept the census as a bounded operation-count diagnostic.** Immutable candidate `6fd9268b4032ea38024b54f5a820806bd920d06b` reproduces on checkpoint6981ce3's exact frozen data. The report accurately says that existing style bounds/scissoring are active and that oversized tiled drawing repeats segment submissions. It does not establish GPU cost, picture equivalence, a conservative tighter bound, renderer improvement, production acceptance or the 60fps gate. No timing/FPS measurement or renderer change was made in this review.

## Independent execution and source path

A fresh immutable archive was created at `/tmp/atlas-new-map-peer/census-6fd`. The peer probe `tests/verification-map-census-peer.mjs` uses that archive's test-only `mapScenePrototype` route and server, not the mutable producer checkout. The prototype routes only the browser's graph module to the isolated WebGL experiment; production `assets/js/graph.js` remains unchanged. Its exact hash is `9a8850528193c87e97deba14a387bebff3215e9e67569c125cac265e061f94fc`.

The probe independently intercepts **actual `gl.clear`, `gl.drawArraysInstanced` and `gl.drawArrays` calls**, reads their current GL state, and compares them with an independent tile enumeration. Unlike the producer's tile-start loops, the peer enumerates every viewport tile from zero and intersects each style rectangle. It checks:

- exactly one mask clear, four-vertex instanced coverage draw and four-vertex composite draw per group/tile, in that order;
- enabled scissoring, exact clear/coverage/output scissor boxes, and exact mask/main viewports;
- mask framebuffer for clear/coverage and the default framebuffer for composition;
- color-buffer clear, MAX blending for coverage, additive source-over blend equation for composition, and the coverage-only shader uniform;
- the actual instance argument equals the active group's segment count, the submitted style association is correct, and the actual composite box uniform equals the clipped output rectangle;
- scissoring is disabled after each union.

All **453 GL operation records across 151 group/tile passes** satisfied these checks. Every per-group style, segment count, width, world bound, device rectangle, tile count and logical area also equals the original raw census, not merely its displayed totals. No output picture was compared, and these state checks do not certify all renderer semantics or bound conservatism.

The loaded map has **13,574 nodes and 23,258 endpoint edges**, definitions/planned enabled and all thirteen fields enabled. Every node is visible under those controls. The peer checks the complete node list against written plus decoded planned data, independently reconstructs the complete dependency/pdeps endpoint list, and matches the producer's exact node/endpoint hashes in all four states. This establishes the loaded inventory; it does not mean every loaded edge contributes a fragment to every view. The camera is k=.8 centered on ladr-2.30, which is selected in the two selected states.

| CSS map viewport, DPR2 | Selected | Groups | Group segment inventory | Actual submitted instances | Logical clear pixels | Logical composite pixels | Tile passes |
|---|---:|---:|---:|---:|---:|---:|---:|
|1440×932|no|18|251,266|251,266|75,329,541|75,329,541|18|
|1440×932|yes|3|270,133|270,133|10,796,240|10,796,240|3|
|3840×2092|no|22|432,239|2,579,756|422,936,387|422,936,387|117|
|3840×2092|yes|3|476,457|2,857,707|64,325,840|64,325,840|13|

The oversized submission ratios are **5.96836** and **5.99783** respectively; normal states submit each group's inventory once. This is a segment-instance count, not a dependency-edge count. `group.count` is the length of the visibility index buffer over flattened mesh segments; a dependency can have many segments. Normal collection/ghost groups partition the eligible edge IDs by style, while selected gray/up/down groups can reuse a segment in different style passes. The census explicitly does not deduplicate that cross-style reuse. Cached buffers not drawn in the current pass are excluded.

Logical rectangle area is the sum of disjoint tile intersections for a style. It is counted once for mask clearing and once for color composition, with reuse and overlap across styles intentionally retained. These numbers exclude the separate once-per-frame main-buffer clear and other scene subsystems. They are neither unique output pixels nor shaded-fragment, byte, bandwidth, invocation-time or hardware-work counters. Shader rejection may prevent raster work after submission. The report's interpretation remains appropriately limited and does not choose which edge operation dominates time.

## Exact provenance and fixture dependency

The frozen index SHA is `e30edc52e17812418a9aede80b7842380749c377939762eecc2468eaea20ab42`; planned SHA is `9627cdd57f3131e3876efeeaf5ebe3d1f5d06f6450c1a104a6d1e028c1f8ebbd`. Both match the producer. The immutable edge/scene/model hashes match all three producer hashes, and the original raw census hashes to its documented `d6bff5c4ab8cb4a23007ffc703a939edad14fbb0bc9bb7f01d183a355e61d2b8`.

An archive lacks generated `data/atlas.css`. The peer's first fixture attempt therefore reported `Unsupported scene color ode`. The completed run explicitly serves the **same frozen checkpoint's atlas.css**, SHA `792d9bdaa2e9978863ff78a42a5d5d87e084b9f8d810941de07def487ddff29f`. This is a fixture dependency, not a renderer change. The producer's original server had generated CSS available; its census does not record that CSS hash. Exact reproduction from a bare archive needs this stylesheet or an equivalent generated color stylesheet. This peer run freezes it explicitly rather than relying on the current checkout's generated assets.

Full Chrome **155.0.8059.85**, headless ANGLE Metal, was used solely for actual call/state observation. Concurrent host activity was allowed; no quiet period was requested. All browser pages, browser processes and the peer server closed through `finally` blocks.

Reproduce explicitly:

```sh
node tests/verification-map-census-peer.mjs IMMUTABLE_ARCHIVE /tmp/atlas-continuation/checkpoint4/data OUTPUT_JSON
```

Own raw result is committed as `docs/verification/map-census-independent-peer.json`, SHA `f5bc43fcd155b9b20f32451646348d29be2852b251076011832a9b2220789603`. Original output/log are `/tmp/atlas-new-map-peer/census-independent.{json,log}`. Review edits are limited to this unique report, raw peer result and explicit probe. GEO/GEOL candidates, production graph and shared renderer files were not edited. The next decision remains an independently justified conservative-work reduction, if separately assigned; these counts accept no implementation or performance result.
