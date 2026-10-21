# Private transparent-gutter intervention — tiny correctness boundary

20 October 2026. This isolated candidate follows positive original-only phase boundary `bc5e18f4d1b6c4799d78f778e7301711e35e78c1` and preserves the earlier failed-output probe `6c45d07`. It changes **no file under assets**, no production graph/shared runtime, and no prior rejected renderer. It is not accepted for full-map use or timing. Independent immutable peer is the next gate.

## Causal evidence and scope

The original atlas texture can retain populated texels in a later word’s surrounding slot after clear/repack. The authorized eight-case physical-anchor probe retains two exact low/low controls and positive native differences at the predicted high fraction, with identical complete inner glyph texels. In particular, actual chapter style `600 11px Inter`, top/left, zero spacing, DPR2, `rgba(71,115,207,.5)`, raster phase0 has high-X changed output and actual stale GPU border cells. The source-grounded `.375` LINEAR weight prediction and actual uploads/slots/texels/output are preserved in `map-text-atlas-phase-causal.json`. I viewed the original fresh/repacked serif and chapter native images; the serif repacked output has a right-edge mark absent from the fresh image.

The intervention writes only the already allocated slot perimeter. The exact private source transformer `scripts/lib/map-text-atlas-gutter-prototype.mjs` changes three original lines:

1. Clear the existing scratch over `max(current width+2, prior width+2)` and the corresponding height, retaining the existing full-size scratch backing.
2. Translate native glyph rasterization by **one whole physical pixel** in each direction, without changing its DPR scale, font, baseline, spacing, alpha/color or computed anchor.
3. Upload the existing `(width+2) × (height+2)` slot at `(x−1,y−1)` instead of just its inner rectangle.

Returned inner UVs, glyph dimensions/bearings, packing cursor/row pitch, allocation guard, filtering, shaders and upload GL state remain original. The private painter route changes only its import URLs to reach that private atlas. No extra persistent atlas, duplicate scratch, CPU glyph capture or full-texture clear is introduced. The existing `width+2`/`height+2` admissibility test already proves the expanded upload fits. Maxima of old/new cleared dimensions fit the same backing; the model checks256 boundary combinations. Private expanded uploads are observed, not merely inferred.

## Tiny native gates

`node tests/map-text-atlas-gutter.mjs` runs36 cases: DPR1/2 × light/dark × fill/stroke × four profiles, plus all four exact chapter-anchor cases. Profiles vary alphabetic/top/bottom/middle baseline, zero/0.08em spacing, moving raster phase0 versus actual settled fractional raster phase, physical anchor fractions, and genuine allocator wrap followed by clear/reuse. Stroke width1.25 is preserved. The matrix uses original native Inter; it does not substitute a software font or NEAREST filtering.

A further bounded eight-case word fixture makes letter-spacing/kerning/descenders meaningful rather than relying on the one-character `i`: `MAP_ATLAS_MULTIWORD_ONLY=1 MAP_ATLAS_GUTTER_OUTPUT=/tmp/atlas-map-atlas-gutter-multi node tests/map-text-atlas-gutter.mjs`. The string is `AV gj`, both DPR/themes/fill-stroke, nonzero letter spacing, right/center alignment, moving/settled phase, and genuine wrap. Right-aligned text at the fixed near-left anchor can be clipped by the original viewport; the entire GPU inner glyph and complete output buffer are still compared, including that original clipping. No crop or mask enters any gate.

**All44 cases pass**, each with four full native outputs (original fresh/repacked and private fresh/repacked), for176 native captures. Every case verifies:

- Complete actual GPU inner glyph bytes identical between original/private for both histories, and between fresh/repacked within each variant.
- Original-fresh versus private-fresh complete RGBA buffers **exactly equal**.
- Private-fresh versus private-repacked complete RGBA buffers **exactly equal**, maximum difference0.
- Actual fresh and reused private GPU slot perimeter completely transparent.
- Exact original/private inner UVs, bearings, dimensions, physical box, packing cursor/pitch, native scratch size, LINEAR min/mag filters, logical byte/peak owners, wrap counts and GL unpack state.

The36-case original control still differs after repack in10 cases (maximum72); in the additional word fixture it differs in4 cases (maximum104). Guarding only the transparent perimeter eliminates those same-history differences without changing any inner glyph byte or fresh output. This establishes a bounded tiny-scene causal stale-gutter mechanism. It does **not** prove that it explains every prior full-map differing pixel, establish full-map equivalence/fairness, or accept the failed alternate-index renderer.

`node tests/map-text-atlas-gutter-model.mjs /tmp/atlas-map-atlas-gutter/gutter.json` and the same command for the multiword JSON pass. They check the exact three changed original source lines31/32/35,256 slot/scratch extent witnesses, every actual expanded upload (140 +40), same owner budgets/peaks and wrap/final unpack state. The native tests stop at the first failure; there was no private-fix failure to waive. Earlier failed6c45d07 and every original phase/control result remain preserved.

I personally inspected all176 output glyph views in six diagnostic contact sheets: exact painted alpha extent plus margin,4× nearest-neighbor pixel zoom, displayed on a light/dark diagnostic background. Original full lossless PNGs and complete unmasked raw buffers remain primary evidence; the view crop/zoom is solely for legibility, removes no painted pixels and affects no comparison. Dirty marks in the original reused cases disappear in the private variants; stroke, spacing, baselines and descenders are preserved. Browser153.0.8010.12, ANGLE Metal Apple M1; no FPS or duration measured.

## Owners and lifecycle

The private implementation adds **zero logical CPU/GPU owners or bytes**. In these fixtures, the original atlas+scratch total262144 bytes at DPR1 and1048576 at DPR2; original/private peaks match exactly. The shared diagnostic WebGL context is reused sequentially across the final matrix (one active context), each painter is destroyed and its budget checked at0 before the next. Texture/program/VAO/scratch and temporary readback FBO cleanup follow the original destroy path; FBO is explicitly deleted, scratch removed, bindings released, final context explicitly lost. Browser/server close in finally, also on assertion failure. There is no model/worker ownership in this atlas-only fixture.

Diagnostic memory is separate: each native case retains lossless PNGs and two readbacks per variant/history. At DPR2 a draw readback and an atlas readback are524288 bytes each; serializations/base64 strings, Node copies, PNG encoders, driver copies and native framebuffer storage add excluded transient/retained diagnostic costs. These files/models are not original64MB logical owners and make no physical64MB claim. This intervention does not alter the original logical cap, reserve order or atlas dimensions. Physical allocation measurements were not made.

Raw roots `/tmp/atlas-map-atlas-phase`, `/tmp/atlas-map-atlas-gutter`, `/tmp/atlas-map-atlas-gutter-multi`. Full per-case state, upload rectangles, border pixels, exact inner bytes and complete readback SHA256s are committed in `map-text-atlas-{phase-causal,gutter,gutter-multi}.json`. `map-text-atlas-gutter-evidence.json` records original/private source/helper/protocol and artifact hashes. Phase boundarybc5e18f preserves the original first probe/helper exactly; the final helper additionally reuses one context and restores its diagnostic upload wrapper after each painter. No broad full-map/native matrix or benchmark was run. Stop here for deep independent peer and the coordinator’s fair cold/warm ordinal protocol.
