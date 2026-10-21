# Diagnostic null-framebuffer correction

Independent peer source review of preserved `06717752` identified a real failure-path blocker: a null createFramebuffer result could bind the default read framebuffer, making its COMPLETE status irrelevant to the intended texture attachment and allowing a wrong-surface read. No full-map test was run and no original renderer was changed.

Separate source successor `a6f4ae5a` rejects a null handle immediately, before attachment, binding or read. The happy path is unchanged. Focused native `tests/map-paired-atlas-null-fbo.mjs` injects null with separate nondefault READ/DRAW FBOs, NONE readBuffer, nonnull PBO, PACK [8,9,2,1], active texture3, nonnull array buffer and VAO. It records actual before/after object identities and the failure before assertions. All state is identical; create=1, bind=0, attach=0, read=0, consume=0; GLerror0. Chrome155.0.8059.85, one tiny run, browser closed. No Canvas/font/map draw or full-map branch was exercised.

Raw `/tmp/atlas-map-paired-null-fbo/null-fbo.json`; exact result/source provenance in `map-paired-atlas-null-fbo-evidence.json`. Prior tiny outputs remain unchanged. This closes only the null-allocation issue; independent peer has separately identified mid-epoch failure-persistence work, so this is not full paired-oracle readiness or acceptance. No full-map, expansion or timing authorization follows.
