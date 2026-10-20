# Persistent scene GPU-counter diagnostic

This separate experiment supports prioritizing **reuse of completed static edge layers/tiles**. It does not qualify the rejected scene for production or change the full-map 60 fps gate. The earlier 12-case matched artifact remains unchanged.

The explicit Metal context exposes [`EXT_disjoint_timer_query_webgl2`](https://registry.khronos.org/webgl/extensions/EXT_disjoint_timer_query_webgl2/). The profiler uses `TIME_ELAPSED_EXT`, waits for result availability, rejects disjoint results and deletes all query objects. Three warm whole-frame samples are taken for each omission. Omitted components produce deliberately incomplete pictures; their results are diagnostic and are not correctness or FPS evidence.

| Viewport, DPR 2; light, k = 0.8 | Selection | Whole scene, ms | Edges omitted, ms | Nodes omitted, ms | Decorations omitted, ms |
| --- | --- | ---: | ---: | ---: | ---: |
| 1440 × 1000 | none | 36.18 | 0.63 | 40.01 | 38.55 |
| 1440 × 1000 | selected | 4.41 | 0.76 | 4.43 | 4.44 |
| 3840 × 2160 | none | 565.66 | 3.36 | 643.86 | 540.85 |
| 3840 × 2160 | selected | 42.59 | 2.62 | 42.06 | 38.00 |

These are means of three GPU elapsed-counter results, in milliseconds, rather than reciprocal RAF rates. The scene renders directly to WebGL. All disjoint flags and GL error checks passed. Node/label omission leaves the dominant cost present; edge omission removes it. This locates the expensive subsystem without distinguishing vertex processing, coverage-target clears, blending, tile stores, or color composition from each other.

Separately instrumented per-pass query results are also retained. They are **non-additive**: query boundaries and command-stream gaps perturb render-pass scheduling, so their sum can exceed the separately timed whole frame. They should not be used as an exact accounting of independent GPU pass costs.

The experiment ran concurrently with the parent's full checkpoint and other permitted work, with no quiet window. Other GPU work can affect elapsed intervals. There are only three samples per condition, warm stationary transforms, one theme and two DPR-2 viewports. Do not compare these absolute durations with the earlier controlled RAF cadence or extrapolate omission results to the cost of a future cache blit. The large repeated omission effect is the basis for the architectural choice.

Data bytes were captured and fulfilled to every page by the profiler itself. This newer snapshot has **13,574 nodes and 23,078 edges**; index SHA-256 `bf1b28a2fa31303846f37f1f456fbfc9bad6620a6fc89b3407811020ad7d25ca`, planned SHA-256 `67bff095ffb81c4424bb8227034cc690cc8f03a98bac4967146be61dfb0b3645`. It differs from the 23,076-edge matched snapshot. Browser/renderer, individual nanosecond samples, resource sums and helper/data/protocol hashes are retained in [map-scene-gpu.json](map-scene-gpu.json). Reproduce with `node scripts/audit-map-scene-gpu.mjs OUTPUT`; this script is explicit-only and does not alter application wiring.

The next focused prototype should keep the already completed edge picture for a covered transform/LOD range and reuse it through the GPU, then redraw at the exact settled transform. Hover requires the existing order: faint edges, faint nodes, emphasized edges, connected nodes and labels. A shared backdrop can therefore include the faint nodes, with emphasized closure edges and labels remaining separate. It must preserve the same-style opacity union, filters, theme/font invalidation, selection rings, hit state and cold fallback.

The allocation constraint is material. One normal DPR-2 RGBA cache needs 21.47 MB, and one oversized cache needs **128.53 MB**, before geometry, indices, text sources, masks and the primary buffer. A normal cache might fit the current 64 MB owned-resource cap after evicting unused geometry. A full oversized cache cannot. The next experiment needs measured bounded tile reuse/eviction, or an explicitly accounted and tested alternative cap; hiding this allocation, changing resolution or calling a partially rendered omission a pass would not resolve the gate.


Parent independently checked the profiler against the linked extension specification,
verified the protocol hash, all 108 finite nanosecond samples, three samples per
omission/condition, the table means and each recorded false disjoint flag. This
checks the saved diagnostic and its method; it is not an independent timing rerun.
The raw artifact remains unchanged, SHA256
`ab92cfe0b8121df0f2cb360b7a543ca484ef7043f5d0594daea2938d8de2f131`.
