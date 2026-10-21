# GEO 2.7 Taylor–Proudman curl sign — narrow correction

Independent prerequisite review found an inherited sign typo in the owned 2.7 idea. For constant rotation vector and an incompressible smooth velocity field,

`curl(2Ω k × u) = 2Ω [k div(u) − ∂z u] = −2Ω ∂z u`.

The old positive sign is corrected and constant rotation is explicit in that sentence. The pressure-curl result and the conclusion ∂z u=0 are unchanged. This is a separate successor to prerequisite candidate `41e28718ef13f3c5c8338d689b8407f21ff09b47`, requiring bounded independent review.

Only this exact sign/hypothesis text changes in GEO: an explicit comparison against that immutable candidate confirms every other GEO file byte is identical. All functions, source flags, dependencies, syllabus rows and source-audit helpers are therefore preserved. No shared runtime or global file changes.

`node tests/verification-geo-curl-sign-math.mjs` passes **20,705** independent component/curl checks, including a finite-difference witness u=(0,xz,0) for which the y curl component is −2Ωx and the former positive sign fails. `node tests/verification-geo-curl-sign-native.mjs` passes the actual 320px light/dark runs, with no runtime, TeX, blank or idea-overflow errors. Both complete changed-note output images under `/tmp/atlas-new-imaging-source/geo-curl-sign` were personally inspected; the minus sign and surrounding hypotheses are legible and unclipped. Probe log: `/tmp/atlas-new-imaging-source/geo-curl-sign-native.log`. Browsers closed. No source closure or interaction re-certification is claimed.
