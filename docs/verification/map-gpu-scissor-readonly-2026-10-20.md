# Persistent GPU edge scissor audit — 20 October 2026

**Reject “add per-style-group bounds and scissoring” as a new optimization: the audited renderer already does that.** A tighter bound might reduce some work, but the saved omission evidence does not establish that it could remove most oversized fill cost. This is a separate read-only investigation from the rejected Canvas compositor. No browser, GPU timer, benchmark, renderer implementation or production change was run.

## Actual code path

| Location | Existing behavior |
|---|---|
| `assets/js/map-webgl-scene.js:83–90` | Each cached style group gets a world AABB over all control points of its selected paths. A 256/k padded visibility inventory is reused while it covers the needed viewport. |
| `assets/js/map-scene-edges.js:93–98` | Transform that group AABB to screen coordinates, expand by the current margin `5*width+2` CSS px, intersect the viewport, and visit only mask tiles intersecting the resulting rectangle. Empty intersections are skipped. |
| `assets/js/map-scene-edges.js:99` | Enable SCISSOR_TEST and set the exact group/tile intersection **before** clearing the reused R8 mask and drawing the group's geometry with MAX blending. It is not an unconditional full-mask clear. |
| `assets/js/map-scene-edges.js:100` | Switch to the primary framebuffer, set its corresponding output scissor, and issue a color quad whose own box is the same bounded intersection. It is not an unconditional full-screen color quad. |
| `assets/js/map-scene-edges.js:103` | Disable scissoring after the union pass so subsequent node/decorative passes retain their normal behavior. |
| `assets/js/map-webgl-scene.js:115` | The primary transparent drawing buffer is cleared once per full frame, before decorations and edges; this full-viewport clear is not repeated per style. |
| `assets/js/map-webgl-scene.js:123–127` | Unselected detail groups are collection colors plus the planned/ghost style. Selection instead draws gray/up/down groups. |
| `assets/js/map-scene-retained.js:13–21` | The later retained experiment's unionRegion also intersects group bounds with its requested target/clip and scissors both R8 clear/MAX and color composition. It already preserves this optimization for missing strips/cache targets. Its RGBA cache clear at73 is once per cache build, a different operation. |

A group with null bounds would use the viewport in the low-level union API, but the actual persistent-map `group()` constructor always supplies the computed bounds for nonempty groups. Broad bounds can still cover the full viewport; that conditional case must not be confused with an absent scissor optimization.

The coverage texture is reused, not allocated per style (`map-scene-edges.js:85–91`). At the recorded oversized dimensions7680×4184 it is4096×1953 =7,999,488 R8 pixels. A full-viewport group touches at most2×3 tiles. Scissors trim the partial right/bottom tiles: the sum of cleared/composited rectangle areas is32,133,120 pixels for that group, **not** six times the full mask allocation. Both the mask clear and color composition repeat across different styles because those styles must be composited independently.

## What remains potentially expensive

`SceneEdges.bind()` at78–82 submits **all group.count segment instances for each intersecting tile**. The vertex shader's endpoint test at22–23 and tile viewport/scissor can reject raster work, but scissoring does not eliminate the vertex invocations already submitted. One broad style can therefore resubmit its entire indexed segment inventory up to six times in the oversized view. A tighter bound that leaves the same tile intersections may shrink clears and color-quad fill while leaving those submissions unchanged.

The R8 MAX pass can also shade overlapping segments many times within the bounded rectangle; the final group rectangle includes empty space. These are distinct from unscissored full-screen work. The current evidence cannot choose among repeated vertex/texture work, segment overdraw, mask clears, color fill, bandwidth and render-target scheduling.

The control-point bounds are deliberately coarse. However, for ordinary worldCurve paths (`map-scene-model.js:4–6`), y controls are y0,y0,y1,y1, so the centerline's y extent is already exactly its endpoint interval. For forward edges with endpoint separation at least20 world units, the x controls lie inside the endpoint interval too, so their control hull's x extent is already the endpoint extent. Exact cubic extrema cannot shrink those bounds. Small/reversed x paths and cached inventory currently culled by the shader can inflate bounds, but their share of actual summed screen area is not recorded. Long dependency groups spanning both sides of the viewport can remain full-screen even after tighter curve math.

## Saved omission counters: precise scope

The actual audited source bytes match the saved GPU artifact's hashes:

- `map-scene-edges.js`: `7b3fcf731105674252465c1376942b2f2b549fa51f9a3c9a3ee581a10c242262`.
- `map-webgl-scene.js`: `2422e59c2780e19e0c7b5c11da56127bc23718925ddde3e4d71527e4e45c21b5`.
- `map-scene-model.js`: `a7d10c9ba64acd3f4be8307d07461e0d9fad04f567d0d40dbbebfa37f2a581af`.
- Saved `docs/verification/map-scene-gpu.json`: `ab92cfe0b8121df0f2cb360b7a543ca484ef7043f5d0594daea2938d8de2f131`, unchanged.

I recalculated the three-sample means directly from its raw nanoseconds. At3840 CSS px/DPR2/unselected, whole scene is565.660ms and edges-omitted is3.360ms; selected is42.588ms and2.618ms. Normal unselected is36.178ms and0.629ms. These support the **edge subsystem** as dominant in those old diagnostic states, not mask clear/composite fill specifically. The profiler wraps the entire union call (`scripts/audit-map-scene-gpu.mjs:21–24`); its omission branch at28–30 removes both union and direct edge drawing. No saved per-style rectangle, scissored area, tile-submission count or isolated-clear/composite counter exists.

The artifact's unselected indexBuffers counts809(normal)/172(oversized) are retained index-buffer inventories, **not active per-frame style counts**. Initial bundled views and multiple model-scale keys can remain cached. Multiplying those numbers by viewport pixels would manufacture an unsupported fill estimate. The active unselected detail draw constructs at most one color group per collection plus the ghost style; the selected branch has three groups.

These are old13574-node/23078-edge, three-sample, warm stationary, light/DPR2 GPU elapsed-counter diagnostics that ran concurrently with other work. Per-pass queries are non-additive and omission pictures are incomplete. They neither certify60fps nor isolate a future scissor speedup. This audit does not extend them to today's larger edge inventory.

## Conservative screen-bound derivation

For a group rectangle Bg and a disjoint tile partition, the existing logical rectangle area is Ag = area(viewport ∩ outwardRounded(transform(Bg) expanded by margin)). Summed tile-intersection areas equal Ag. The explicit R8 clear area and final color-quad area each equal Ag; the sum over groups is2ΣAg for those two logical operations. This does not count overlapping geometry fragments, vertex processing, storage bytes or GPU timing.

A future tighter bound must enclose **the actual quantized shader mesh and antialias support**, not merely exact mathematical Bezier extrema. The shader at`map-scene-edges.js:24–28` places corners at

`q*k + translation + join*outer*side + rotatedJoin*endpointExtension`,

with outer = width/2 +1/DPR. Stored interior join components are clamped by the model's10-length miter bound; interior extension is zero. Endpoints use normal-length joins and extension≤outer. An axis-conservative extrusion bound is therefore at least10*outer for interior joins and2*outer for endpoints, plus conservative float/half-float and transformed-point error. Bounds from exact curves additionally need the flattening allowance (`tolerancePixels/model.scale * k`) and coordinate quantization error, or must instead use actual uploaded point attributes. Outward floor/ceil and a raster guard then produce integer device bounds clipped to the viewport/tile.

The current `5*width+2` margin is the implementation's existing rule; it is not by itself a proof that replacing a loose control hull with a tight curve hull preserves every shader corner for all clamped joins. This audit found no actual clipped-pixel witness and makes no new clipping-failure claim. It means that tightening the hull while blindly retaining that padding would not meet the requested conservative proof obligation.

For every output pixel in a style, all contributing segments must still enter the **same MAX coverage union**, followed by one source-over color composition for that style. Per-edge source-over, or overlapping independently composited subgroups, would change duplicate/crossing opacity. Spatial subdivision is safe only with disjoint output cells and the complete same-style union in each cell; existing integer tiles already have that property. Mask texelFetch/nearest sampling and bounded quads avoid reading stale mask regions outside the freshly cleared rectangle.

## Falsifiable next step, if assigned

Do not build another renderer or run a benchmark on the premise that group scissoring is missing. A small **non-timing call/area census** on frozen current input is the warranted first test: record active style IDs, group.count, current group rectangles, tile intersections, scissored clear pixels, color-quad pixels and repeated instance submissions. Distinguish cached index buffers from actually drawn groups. Check that recorded GL scissors/quad boxes exactly match the source-derived integer rectangles.

Only if that census finds meaningful coarse-bound waste should an independent interval/quantized-mesh bound be computed and compared. If the safe bound leaves most Ag or tile intersections unchanged, reject this optimization before implementation. A claim to remove most rectangle fill requires demonstrating more than half of ΣAg is safely removable; it still would not prove most GPU time is removable.

If a bounded implementation were later assigned, require complete same-style duplicate/crossing/dash/cap/miter/loop pixels, fractional transforms, tile boundaries, actual unselected/selected map pictures, all masks/resources and original group order to match. No edge, strip or low-alpha pixel may be omitted to produce a favorable area count. Only correctness success would justify a separately authorized quiet timing comparison with the edge pass otherwise unchanged. Nothing in this plan was implemented or measured here.
