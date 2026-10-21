# Map performance deferred; timing screen retired

On 2026-10-20 the user explicitly removed map performance from the wave gates and authorized starting Wave 5 and continuing future content waves in a fresh session. MASTER_PLAN §7.3 now retains the content correctness, dependency, visualization, independent review and home-JSON requirements. Map timing, renderer matrix expansion and private prototype lifecycle investigations are a separate deferred workstream, not prerequisites to content authoring.

The 13 isolated timing runtime/runner/model/peer-script/manifest files were removed from the active tree. They were never imported by production assets or the default test suite. Their exact source remains recoverable at commit `51f12b83ad940b2af5476ba58827d7e72d6aaeff` and `/tmp/atlas-root-curve-timing-stage`.

The [failed result](map-curve-timing-root-result.md), [independent audit](map-curve-timing-independent-imaging-peer.md), committed evidence JSON and raw `/tmp/atlas-root-curve-timing-state` plus sibling log are preserved unchanged. The observed timing failure remains a failure; removal does not certify performance or permit experimental renderer adoption. The 60 fps target is deferred and unmet.

No production renderer changes, new native timing run or cleanup of historical evidence accompanies retirement. Existing content/source restrictions, including frozen BIGHIST3.5, remain in force. Follow [the compact content-wave handoff](../wave-continuation.md) rather than restarting the old verification loop.
