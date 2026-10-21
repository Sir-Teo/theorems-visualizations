# Fixed-index chunks into one MAX mask — read-only feasibility

**A fixed-size streaming pair can avoid both full-capacity scratch and count-then-pack sizing while preserving the existing mask algebra.** Use at most **32,768 Uint32 indices**, meaning131,072CPU bytes plus131,072GPU bytes = **262,144 logical owned bytes**. This is32Ki indices, not32KB, and is not a new renderer, binding implementation, image acceptance or performance result. Existing metadata/enclosure and resource-lifecycle obligations remain. Census b5b680b and membership assessment a83371d are unchanged.

## Why chunks preserve the original coverage operation

The original `SceneEdges.union` (`assets/js/map-scene-edges.js:93–103`) clears one scissored R8 tile, draws all same-style segments with `gl.MAX`, then source-over composites that completed style mask once. The vertex shader at21–28 depends on the supplied firstPoint index, gl_VertexID0–3, point/curve/join textures, view/tile/style uniforms and endpoint flags. It does not use gl_InstanceID, draw-call ordinal, previous instances or a shared mutable counter. Every draw must still be `TRIANGLE_STRIP, first=0, vertexCount=4`, with the same divisor1 Uint32 attribute interpretation. Splitting the index stream into chunks therefore emits the same per-index triangles and interpolants, including endpoint/cap/dash behavior, provided all those inputs stay fixed.

For a tile pixel, let c(i) be the original segment's coverage and let the R8 conversion be Q. Coverage is finite/nonnegative on valid inputs. The original mask is the maximum of all segment coverages and zero. MAX is associative, commutative and idempotent; monotone R8 quantization preserves the maximum of representable results. Partitioning an otherwise identical primitive stream into chunks does not introduce an additional color blend or conversion of a finished color image. Each fragment still enters the same R8 MAX operation. The same mask is therefore obtained from any chunk partition, including1-index chunks and a shorter final chunk. This reasoning is independent of whether CPU filtering is enabled; filtering additionally requires the independently accepted conservative inclusion proof.

Keep the **original outer style order and original disjoint tile partition**, group bounds/scissors, mask texture/format, framebuffer, viewport, tileOffset, transform, widths/cap/dash, endpoint cull and shaders. Clear the mask rectangle **once for the whole successful style/tile**, never between chunks. After the final successful chunk, perform exactly the original one color composite at `union:100`, with its original scissor/origin/box and source-over blend. Do not composite every chunk, merge different styles into one mask, or reorder gray/up/down passes. Overlapping style colors are not MAX-commutative.

## Streaming protocol without a maximum-count pass

For each original style/tile, synchronously borrow the exact IDs, original paths/model ranges and **saved group.coverage** described in a83371d. Traverse the original membership stream in its original order. For each conservative tile-intersecting index, write to CPU scratch[used++] and flush at capacity C≤32768. A flush uploads only those used Uint32 elements into the already allocated fixed GPU store and submits **used**, not capacity, instances. Refill the same CPU array. Flush the final partial prefix once. No `push` accumulator, full CPU index copy, all-tile list, geometric capacity growth or scan-to-size pass is required. Original full group GPU buffers remain intact for fallback.

A typed-array subarray is a view, not a full payload copy, but any chosen upload API/overload and temporary views must be explicit. `slice`, spread, Array.from and convenience concatenation would introduce copies and are outside this bounded design. Native upload/driver staging is separate and must remain disclosed. An empty final prefix causes no upload/draw. Unknown/nonfinite bounds include the original index, so their worst case increases chunk count rather than allocation size.

Fixed capacity means any finite original group can be streamed without a larger pair. A smaller capacity can be chosen from proven non-evicting headroom; if not even one index pair plus required metadata fits, use original full-group binding. A configured32768 ceiling is not permission to allocate that pair before reservation. After control/model/mask/viewport changes, original resource growth can require releasing the optional pair even though its dimensions did not change.

The shader stream is stateless across chunks, but CPU work is not free. Re-enumerating exact membership per tile repeats original endpoint/range tests and conservative checks. More chunks mean more uploads/draws. Reusing the same GPU buffer after a preceding draw is semantically ordered by GL, but the implementation can stall or retain internal copies to honor that dependency. No API-level orphaning (no per-chunk bufferData/reallocation), persistent ring of uncounted GPU buffers, or claimed physical zero-copy is justified. No speed estimate follows from this protocol.

## Failure before the one color composite

Maintain the tile invariant: **primary color has not been modified by this style/tile until its completed mask is committed**. For missing metadata, interrupted enumeration, packing/index error or a recoverable upload failure after any number of chunks, **current-tile replay is valid only while the complete original-frame snapshot remains live and matching**: scene generation, control generation, model object/textures, original group/buffer and saved coverage, view/style/tile state, and all previously composited frame state. Under that condition:

1. Discard the partial CPU prefix; do not composite the incomplete mask.
2. Restore the original mask framebuffer/viewport and exact original scissor. Clear that **same tile mask rectangle** back to zero, even if a prefix already drew there.
3. Restore original MAX blend and call the untouched original full-group coverage bind for this current tile, which rebinds its original buffer/textures/uniforms/attribute state (`bind:78–82`).
4. Perform its one original color composite, then continue the original traversal.

**Expired snapshot is a different failure class.** If the model/group was released or replaced, any scene/control/coverage/view identity expired, or previously composited tiles belong to a different frame state, do not replay the old buffer and do not mix new state into the partial frame. Abort the partial experimental frame and restart a complete original frame from its normal clear with a newly validated snapshot, or invoke the existing complete Canvas fallback. A usable GL context alone does not make stale original resources valid. This rule applies even when the current tile has not yet composited.

If no chunk was submitted yet and the original-frame snapshot still matches, the original once-clear/full-group path suffices. A previous completed tile must not be replayed in color: tiles are disjoint, but replaying the whole style/whole frame over already composited output would double translucent opacity. Likewise, replaying original full coverage on top of a partial mask without clearing is not an acceptable shortcut even if MAX idempotence might mask some errors; a clear/replay gives an auditable recovery invariant.

Context loss, device failure or unusable framebuffer state cannot be assumed recoverable by another GL draw. In that case abort the experimental GL frame and use the existing complete Canvas fallback, which hides the GL canvas; rebuild a later generation only through normal initialization. No partial GL frame may be accepted as the completed picture. A failure after the tile color composite is a different failure boundary and cannot be repaired by current-tile color replay. A future candidate must detect/contain recoverable errors before commit, or choose the complete existing fallback.

### Zero retained indices

If the **entire original membership scan completes successfully** and retains zero indices using an accepted conservative bound, every original primitive either lies outside this clipped output tile or is otherwise included by uncertainty rules. No original coverage can reach that tile. Its source-over composite is transparent and a mathematical no-op. It is safe to skip **only that style/tile's** coverage and transparent color composite; the rest of the original style/tile traversal stays ordered.

Do not infer emptiness from a prefix, an interrupted scan, unsupported metadata, shader endpoint guesses or an uncertain bound. If nothing has flushed, clearing the mask can be deferred until the first nonempty flush; a proven empty tile then requires no clear, draw or composite. If the implementation cleared eagerly, it may still skip the proven transparent composite. It must never sample a stale previous tile's R8 contents as if they were the empty result.

## Ownership and original-resource priority

The scratch pair is one optional owner:CPU4C +GPU4C, at most262144bytes. Count active packed x/y metadata separately; it remains9,291,784bytes for the checkpoint5 detail model, plus declared scalar/model bookkeeping. No captured full upload arrays or retained original CPU group lists from the census belong in a candidate. All required original GPU/native resource owners and their existing full-group buffers take priority.

`SceneBudget.reserve` (`map-scene-gl.js:19–27`) can evict other entries marked evictable. Marking the optional owner non-evictable does **not** protect inactive original prewarmed tiers. Use a synchronous **no-eviction headroom check** covering all optional CPU/GPU owners and transient coexistence before reserving. On insufficient space, drop optional owners and bind the original group. Never evict original geometry to make this optimization fit, never increase the cap, and never allocate first and reserve afterward.

Before **later original-owner growth**—new model, mask resize, control-group rebuild or other original reserve—release optional metadata/pair if needed **before the original allocator sees the constrained budget**. A preflight made only when scratch is first created is insufficient. Reserve-before-growth also applies to optional replacement metadata: old/new CPU arrays coexist unless the old owner is explicitly released first. Fixed capacity avoids scratch growth but does not solve metadata generation/transfer peaks, original allocation ordering, upload staging or delayed driver/GC release. Report those separately;64MB remains a logical owner discipline, not total physical process/GPU memory.

Borrowed descriptors and optional model metadata expire on model object replacement/release, saved-coverage group replacement, control-array replacement, scene generation/context change and destroy. Camera/style changes invalidate conservative filtering inputs but not necessarily saved original membership; use fresh view/style values while retaining original group.coverage. Chunk scanning must not yield with unvalidated borrowed references. On a cancelled/late metadata worker response, release its reserved owner and ignore it; do not resurrect stale IDs/ranges or retain a superseded coordinate array.

## Checkpoint5 arithmetic, not a new run

The following is derived from the unchanged committed census; **no new browser or binding run occurred**. Each total includes original logical owners +active detail x/y +fixed262144 pair, before extra bookkeeping, replacement coexistence and staging:

| Frame | Total bytes | Nominal headroom below64000000 | Original style/tile passes | Nonempty filtered tiles | Chunk coverage draws at32768 |
|---|---:|---:|---:|---:|---:|
|normal none|59,106,264|4,893,736|18|10|10|
|normal selection|59,185,028|4,814,972|3|3|3|
|oversized none|62,467,668|1,532,332|117|70|70|
|oversized selection|62,648,732|1,351,268|13|13|15|

Those empty/nonempty/chunk counts are conditional on acceptance of the census enclosure rule. Selected oversized has two tiles requiring a second chunk; the largest retained tile50271 fits in two32768-capacity flushes. This removes the full-capacity selected scratch deficit without requiring a pre-count maximum. It does not establish that the extra CPU enumeration, uploads or unchanged rectangle work are fast. Other frames/models may lack headroom and must use the original path.

## Disposition and next boundary

The fixed-chunk MAX protocol is **source-grounded feasible** under the stated mask/state/lifetime invariants and an independently accepted conservative filter. It is simpler in allocation shape than count-then-pack and avoids full retained CPU membership. It is not implementation acceptance. The smallest separately assigned next step would model/verify exact borrowed membership, chunk-tail counts, one-clear/one-composite, every partial-prefix failure, no-eviction headroom and metadata/control/context invalidation before any GL binding change. Native same-scene pixel and resource/lifecycle tests plus immutable independent peer remain required for a renderer candidate. No timing or benchmark is authorized by this report.

This report alone is added. Prior census, rejected candidates, raw outputs, production and shared runtime remain unchanged. The independent deep_peer has prepared separate source/model checks and will review this exact immutable report boundary.
