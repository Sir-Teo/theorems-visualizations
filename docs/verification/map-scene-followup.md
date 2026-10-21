# Persistent WebGL scene: rejected prototype, 2026-10-19

The isolated persistent scene is **not suitable for integration**. It preserves the tested pictures and state, but its matched hardware cadence is lower than the committed Canvas renderer. Production `graph.js` remains unchanged, and the MASTER_PLAN §4.4 full-map 60 fps gate remains open. The prototype is retained for further architectural work; it is not imported by the application or the default test glob.

## Frozen comparison

The coordinated window ran from 2026-10-20 00:04:20 to 00:05:09 UTC (October 19 local). Root and both source agents held browser/heavy jobs; our correctness jobs had exited. Four sequential full Chrome 155.0.8059.80 runs produced 12 cases: Canvas and scene × two viewports × detail zoom, selected focus, and detail pan. Every run reports **ANGLE Metal Renderer: Apple M1**, with `--use-angle=metal` and matching browser/GPU feature provenance.

All 13,574 nodes, **23,076 edges**, 13 fields, planned items and definitions were enabled. Inputs were 24 wheel zoom positions or 60 pan positions after eight warmups; focus requested the existing 600 ms animation. The protocol drains two RAFs for final rendering and records settling separately. Selected/hover statements are cached or primed to **empty strings** to isolate handlers and rendering, rather than measuring real statement layout/network work.

| Viewport, DPR 2 | Interaction | Canvas fps | Scene fps | Canvas / scene CPU draw p95, ms |
| --- | --- | ---: | ---: | ---: |
| 1440 × 1000 | detail zoom | 51.47 | 24.37 | 10.50 / 14.40 |
| 1440 × 1000 | selected focus | 59.92 | 35.68 | 16.30 / 170.30 |
| 1440 × 1000 | detail pan | 59.89 | 57.35 | 0.20 / 1.70 |
| 3840 × 2160 | detail zoom | 13.45 | 4.80 | 8.90 / 37.90 |
| 3840 × 2160 | selected focus | 60.21 | 7.63 | 13.80 / 303.60 |
| 3840 × 2160 | detail pan | 14.21 | 9.39 | 3.60 / 5.00 |

CPU submission intervals and actual RAF cadence measure different work. In particular, small steady-pan submission times do not imply smooth presentation. Focus reaches its elapsed-time target using fewer frames under load: comparable total transition duration does not establish comparable smoothness. Per-case distribution summaries, missed-frame counts, input-only cadence, final drain, setup and settling costs are retained in [map-scene-performance.json](map-scene-performance.json). No scene case used Canvas fallback during this timing window.

The dataset digest is `542d89e37250ccd969e008c75f46b01cfe89ea69ca114d8627738f56403bd305`. The index SHA-256 is `9238574f1c2b1b6794e5c400ab6fedefc367d8a068095140c87e7dcfee47c5c3`; planned data is `9d8bb33c2340bcd5454fdbd42cad0c31a4ca5c063878c016edcc0db343539028`. Graph, all helper/protocol files and these data files have identical before/after hashes in the artifact. This is a newer snapshot than the earlier 23,073-edge hardware audit; the matched pairs here use identical data.

The host was on AC power. Aggregate CPU idle was 80.79% before and 76.80% after; memory compression was approximately 3.9–4.2 GB. Unrelated activity was left undisturbed: the before snapshot includes Python at 9.5% CPU, and the after snapshot includes `secd` at 68.5% and `ctkd` at 29.1% of one core. GPU utilization was not continuously sampled. This is a bounded, single-host light-theme DPR-2 diagnostic, not a claim about every device or every map regime. Earlier concurrent development probes are excluded from the controlled result.

Reproduce each backend/regime with `node scripts/audit-map-scene.mjs OUTPUT --full-chrome --metal --baseline --frames=24 --regime=1440x1000@2 --modes=detail-zoom,focus,pan-detail`, adding `--scene` for the prototype and substituting `3840x2160@2` for the oversized case. The exact four command arrays and all 12 raw results are preserved in the artifact.

## What the prototype actually retains

World-space cubic and quadratic geometry is built in a worker. Persistent point/arc textures, half-float join normals, curve metadata and bounded visibility indices replace per-frame tessellation. Transforms become uniforms. An R8 tiled target combines same-style stroke coverage before source-over color composition; the main image remains in WebGL, with no rendered WebGL-to-Canvas frame copy. Node geometry/flags are persistent. Native Canvas rasterizes words into a bounded atlas, including the existing families, weights, baselines and spacing. During motion, changing-size titles reuse a native 32 px raster; settling restores the exact requested size and physical-pixel phase. Fixed-size node labels retain their original size.

Canvas remains the input, keyboard and exact world-space hit-testing surface. While WebGL is active its backing is one pixel; CSS dimensions and listeners remain intact. Loss, unavailable WebGL, allocation limits and cold unprepared geometry return to full-resolution Canvas. The test-only resize hook avoids allocating a second full input backing while the scene is active.

The **64,000,000-byte cap is a logical owned-resource cap**, not a physical GPU-memory guarantee. The artifact separately sums world point/join/curve textures, segment-index buffers, node/flag textures, GPU word atlas, connected native word source Canvas, and R8 coverage. The production-sized prototype atlas is 2048 × 512: 4,194,304 bytes for each of its GPU and native source copies. Coverage is at most 8,000,000 R8 pixels, tiled without MSAA. The largest timing peak is 52,763,660 owned logical bytes. The filtered scale-16 lifecycle case remains below 64 MB after evicting inactive geometry.

Primary RGBA drawing storage is reported separately: 21,473,280 logical bytes at the normal DPR-2 map size, and 128,532,480 at the oversized size. The input backing contributes four bytes while active. Both contexts request no depth/stencil and the scene records zero MSAA samples. Driver alignment, shader/VAO objects, texture upload staging, compositor/swap-chain/backbuffer copies and delayed driver deallocation are not exposed as physical allocation totals by WebGL. Worker construction has additional transient CPU arrays; retained range/path objects are not covered by the GPU-byte cap. These distinctions prevent interpreting the cap as a process-memory ceiling.

Context loss terminates the worker and releases all tracked resources to zero before a replacement generation is constructed. Font source canvases are removed on destruction and failed initialization. Oversized allocation or unavailable capabilities preserve the complete Canvas state rather than silently dropping edges or labels.

## Correctness and limits

Explicit-only checks pass: six model/resource tests; four native word/node fixtures; four edge fixtures; 28 full-map comparisons (both themes and DPR 1/2); and two lifecycle groups. The latter exercise actual context loss/restoration, unavailable/tiny-budget initialization, exact fallback pixels, state preservation, 320 px sizing, oversized coverage, cold scale-16 recovery and destruction. An independent full linear hit search matches the existing binned hit test at 240 points per theme across five LOD/zoom scales and both complete/filtered inventories, with zero mismatches. Full scene GL error checks are made in the correctness harness; blocking GL queries are not inserted into each timed frame. The independent painter fixture uses its larger default 2048 × 1024 atlas; the full-scene prototype uses the explicitly smaller atlas accounted above.

The independent Bernstein sampling checks the chosen 0.2-device-pixel centerline tolerance. Native stroke fixtures verify duplicate/crossing opacity (alpha 140 ± 1), dash/cap behavior, tiled composition and reused geometry. Full-map images compare the committed Canvas display path with the scene at the same transform. Maximum mean channel difference is 1.208/255; at most 1.962% of RGB channels differ by more than 20/255, in dark DPR-1 detail. These are bounded picture comparisons, not pixel identity. Analytical circle/rectangle coverage, R8 MAX coverage at partly covered crossings, native font hinting versus detached Canvas caches, and half-float join normals can differ at antialiased boundaries. Dark/light overview and selected-hover screenshots, both DPRs, narrow layouts and the independent font/node fixtures were inspected.

The stroke-union requirement follows the [HTML Canvas stroke algorithm](https://html.spec.whatwg.org/multipage/canvas.html#dom-context-2d-stroke). R8 MAX uses the [OpenGL ES MAX blend equation](https://raw.githubusercontent.com/KhronosGroup/OpenGL-Refpages/main/es3.0/glBlendEquation.xml); its sampled coverage is an approximation to geometric antialias union, rather than a proof of identical Skia rasterization. Texture formats, source uploads and context restoration follow the [WebGL 2 specification](https://registry.khronos.org/webgl/specs/latest/2.0/).

## Next architectural experiment

Retaining geometry alone has not removed the expensive work. Every changing frame still submits geometry and clears/composites per-color coverage regions. The large disparity between submission time and presentation cadence is consistent with rendering/composition pressure, while the large cold index-upload intervals also show synchronization cost. The current measurements do **not** isolate a hardware GPU timer counter, so fill-rate/bandwidth attribution remains an inference.

The next focused experiment should measure individual GPU passes and evaluate reuse of completed static scene layers/tiles, preserving stroke union, color order, native labels, exact hit state and final exact rendering. It must account for the memory tradeoff: a full oversized RGBA snapshot alone needs 128.5 MB, already twice this prototype's owned-resource cap. A useful design needs bounded tiles/eviction or a separately justified tested cap; moving allocation outside the accounting or reducing resolution would not close the gate. The current correct prototype and its failed timings remain available as the reference for that work.
