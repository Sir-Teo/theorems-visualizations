# Combined verification checkpoint through fe4305d

October 19, 2026. Source changes are committed through `fe4305d`; isolated unimported drafts for the next source and WebGL batches were excluded from this production snapshot.

- `npm test`: **1,397 tests pass**, zero failures, cancellations or skips. This total includes all six UI tests.
- `node scripts/build.mjs --strict`: **6,684 written + 6,890 planned items**, 450 chapters, 85 collections; zero errors or warnings. Home JSON: **112,811 bytes gzip**, below the 300,000-byte ceiling.
- `node scripts/check.mjs --static`: **6,621 items**, zero errors or warnings.
- `node scripts/smoke.mjs --routes=…`: **35 valid routes**, zero runtime errors. Home, map and about plus the recent aerodynamics, solar/radiative energy, pharmacokinetic, failure/fatigue, micro/macro, beats and loudness pages are included. Every item route resolves to its actual item title.
- `node scripts/verify-wave-queue.mjs`: **203 pending =833 initial+3 added−633 original resolved**, all chapter flags reconcile.

The first new route invocation used an incorrect URL shape and reached not-found pages. Its results are discarded. The smoke runner now rejects unexpected not-found titles while retaining the intentional `#/nope` scenario. An independent negative invocation with `#/aero/4.1` returns exit1; the corrected `#/t/aero-4.1` and other 34 valid routes pass. The previous 17-route checkpoint log already used valid item URLs. This changed-page subset does not repeat the earlier full route inventory.

Logs: `/tmp/atlas-current-checkpoint-{tests,build,static,smoke}.log`, and `/tmp/atlas-smoke-invalid-route.log`. The 53-item/95-action automated sound run remains recorded in [audio follow-up](audio-input-followup.md). Source-specific numerical/browser evidence and screenshots are documented in their individual follow-ups. This checkpoint does not certify the open full-map 60fps, proof-curation or cross-field prerequisite gates, and Wave5 has not started.
