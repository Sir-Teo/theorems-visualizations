# Independent failed chunked-binding audit and capture supplement

**Keep exact candidate `acf697eda8a235710428df17c14e431d3183d655` rejected under its first exact image gate.** This independent audit reproduces the reported failure, preserves the actual compared readbacks, and narrows the discrepancy to frame-history/text-atlas evolution. It does not accept the implementation, waive the image gate, repair any renderer, certify unrun lifecycle cases, or establish speed. No timing/FPS ran. PL preparation `6be18b2` and all earlier CIRC/map boundaries are preserved.

I archived the exact rejected commit at `/tmp/atlas-new-map-failure-peer/archive`, read its complete private adapter/fixture/native probe and the original scene, edge shader/union, painter, text-atlas and allocator paths. The commit changes only private scripts/tests and report/raw evidence, preserving production/shared runtime. `verification-map-chunk-failure-peer.mjs` independently verifies fixture/source hashes, raw-record identity, complete original edge-class inclusion, all 33 resource sums and the stopped failure. Its output is `/tmp/atlas-new-map-failure-peer/evidence/read-only-audit.json`.

## Original record and source assessment

The committed matrix has 33 light states, first32 exact comparisons zero, last comparison31327 differing RGBA channels/max121. The failure is oversized viewport3840×2160, actual map3840×2092/backing7680×4184, DPR2, k=.8, dx12.375/dy−8.125, moving=true. Its preceding oversized unselected case executed **zero** optimized tiles; its successful selected case executed13 optimized tiles/15 chunks. None of this certifies dark themes or the unrun fault/lifecycle matrix.

I personally viewed the original producer's complete actual and Canvas-direct PNGs. Neither is the missing original-GPU oracle: the actual PNG was a third redraw. The original record remains unchanged and its missing-readback limitation remains historical evidence. The separate capture below supplies new evidence rather than replacing it.

The adapter keeps the complete original union/shaders/scissors/one-clear/one-composite and only replaces eligible mask binding. Its saved-coverage stream uses original ordered IDs, Float64 path endpoint predicate and ascending ranges; every constructor index is compared without retaining the full input array. Metadata comes from genuine detail4 Float32 uploads, with an outward half-join envelope. The actual supplemental metadata has J=3.982421875, maxAbs=13731.115234375, and9291784 x/y bytes for1161473 points. At the failing view the declared domain checks pass. I found no demonstrated enclosure or membership breach in this bounded source audit; this is not a complete implementation/lifecycle acceptance.

Optional reservation has synchronous non-eviction preflight and releases optional owners before an otherwise-over-budget original reserve. Actual reported failure totals reconcile to62471764 current/63895600 peak, mask7999488 pixels, pair131072CPU+131072GPU, bookkeeping4096, three original models retained. The physical primary drawing buffer alone is128532480 bytes and is excluded by the inherited logical budget. Driver staging, old/new native allocations, existing CPU constructions and diagnostic readbacks are not physical-cap evidence. Lifetime/fault branches beyond the reached tests remain unverified.

## One reconstructed state, four exact captured frames

The coordinator explicitly authorized one isolated capture after initial source review, then a bounded transport correction after its tooling failure. The first attempt's128532480-byte POST caused Playwright/Node `ERR_STRING_TOO_LONG`; it persisted no compared readbacks and is **not** a renderer result. Its log `/tmp/atlas-new-map-failure-peer/capture.log` is preserved; no child browser remained. The renewed attempt streams at most1MiB per POST with exact offset/length checks. Each raw file has123 chunks,128532480 verified bytes and SHA256. Browser and server closed, and no subsequent map native run followed.

The renewed test uses unchanged frozen checkpoint5 data/source68aa4e2, unchanged renderer/protocol/limits and Chrome155.0.8059.85/Metal. It reconstructs oversized light DPR2 unselected→selected with the same original comparison/third-redraw/Canvas-cleanup sequence; both preceding comparisons pass. It then captures synchronous **C1, O1, O2, C2** (`C` chunked, `O` forceOriginal) without any await between their draws/readPixels. View, model, full group identities/state, metadata and scratch identities remain equal after all four draws; tx1574.35, ty−1071.0500000000002, k=.8, moving=true. C1 and C2 each execute70 chunks/117 optimized tiles. Timers/font events cannot interleave in that synchronous four-draw sequence; internal cache/resource state can evolve.

| Comparison | Differing channels | Differing pixels | Max channel difference |
| --- | ---: | ---: | ---: |
| C1−O1 |31327|8929|121|
| O1−O2 |0|0|0|
| C2−O2 |0|0|0|
| C1−C2 |31327|8929|121|

Raw SHA256:

- C1: `08fd6a441f0f6562e958d18ef88a4765e1f6a59ad7a8f5553faa9826c2b15907`.
- O1, O2 and C2: `2433e75ca074e653e258bb8597675b245461aeae3bbeabb2461bae56025b717d`.

Exact bytes reside in `/tmp/atlas-new-map-failure-peer/capture-chunked/{C1,O1,O2,C2}.rgba`, bottom-left origin RGBA8. Four readback arrays coexist before comparison/transfer: **514129920 diagnostic CPU payload bytes**, outside prototype owners. Browser/network and offline decoding can add transient copies. References are dropped after sequential transfer and the page/browser are closed. This is explicitly not a physical64MB pass.

`map-chunk-failure-peer-capture.json` preserves before/after view, control/group/model/texture identities, atlas keys/packing/generation, GL parameters/uniforms, allocator owners/resources, stats, exact differences, file checksums and all chunk offsets/lengths. `verification-map-chunk-failure-images-peer.py` independently rereads the raw files, checks hashes/counts and reproduces all differences offline. Exact RGBA PNGs flip rows only; separately named white-display PNGs aid viewing. Difference images amplify max per-pixel RGBA delta×4 on black. The raw/capture/PNG/log manifest is `map-chunk-failure-peer-manifest.json`.

## Pixel localization and bounded interpretation

I personally inspected the complete saved C1/O1 white-display images, the complete/cropped amplified difference and the actual/reference crop at screen x5100..5999,y3590..3689. The sparse differences lie on horizontal text-row/glyph-boundary strips; the example shows chapter labels “8 · Compact groups” and “9 · Lie algebras…” with tiny underline-like artifacts. The total bounding rectangle is x3128..7679,y128..3658. These viewed differences do not resemble omitted curve segments. O1/O2 and C2/O2 difference images are zero by independent raw-byte calculation.

The atlas snapshots show substantial history evolution: C1 generation7→9/cache96→2; O1 generation9/cache2→85; O2/C2 generation9/cache85 unchanged. The source clears the atlas cache/packing on canvas resize and on overflow; `SceneTextAtlas.clear()` does not clear GPU texels. Word sampling uses LINEAR filtering, so uncleared neighboring border texels after repacking are a plausible mechanism for glyph-boundary artifacts. This is a **source-based hypothesis**, not a separately isolated proof: the supplement did not start a cold forceOriginal frame from an identical cloned atlas history, capture per-pass masks, or change the atlas to test causality.

The demonstrated result is narrower: the same first-frame difference is reproduced and later chunked/original frames match exactly once their internal state stabilizes. No persistent filtering discrepancy is observed in this particular warmed state. It is unjustified to call the initial failure fixed, to accept alternate binding, or to certify the inherited atlas from that observation. Any further original-only history isolation, source correction, rerun or matrix work requires the coordinator's next bounded assignment. No more map browser work is started by this report.
