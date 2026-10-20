# Independent prepared paired-oracle/tiny peer

Review boundary fbb406ab7fbaf66716ba1becb9d3acb26dafeea3→06717752cb1c01875a79ab54d5164d5a7647ebf3, immutable archive `/tmp/atlas-new-map-paired-tiny-peer/archive`. Applied own b1e2860 preparation. Personally read complete observer/hash/reset, epoch/fixture, artifacts, tiny native/model tests and prepared full-oracle runner; no full-map branch executed. Producer report/raw evidence is supplementary, not independent acceptance.

Default `MAP_PAIRED_OUTPUT=/tmp/atlas-new-map-paired-tiny-peer/prepared node tests/map-paired-guarded-oracle.mjs` writes prepared source hashes and exits before browser launch. Its CPU model18 SHA comparisons and symmetric source/guard/original bytes pass. No peer native started before the source findings below.

## Preserved blocking source findings

1. `readRGBAChunks` does not reject null from createFramebuffer. For a nonnull texture and failed allocation, it binds the default READ framebuffer; attachment/readBuffer calls can be invalid while default framebuffer status remains COMPLETE. Subsequent readPixels can observe the default surface and produce a hash of the wrong bytes instead of failing closed. Reject null before attachment/read and prove an injected allocation failure invokes neither readPixels nor consume and restores prior state. Sent directly to producer and coordinator; original boundary remains unchanged.
2. `captureGuardedEpoch` keeps buffers/frames local and publishes window.__pairedEpoch only after all12 draws. If reset/draw/read throws mid-epoch, completed main buffers and actual trace/state are not made available for bounded transport; runner catch saves only existing result/manifest. Expose partial state from start and persist available completed raw buffers, trace/frame/reset failure metadata before closure without another draw or retry. Initialization failure must preserve available observer trace too. First failure still stops before opening another variant. Sent to producer; not an image gate waiver.

These block readiness endorsement of the prepared full runner and helper failure path. No full-map run, image acceptance, production/shared mutation, matrix or timing follows. Fresh independent tiny native and extra nondefault/current-program/content/failure witnesses remain pending a narrow immutable successor; no native gate has been silently retried.
