# BEHAV bounded equation-wrap follow-up — 20 October 2026

Separate successor to prerequisite commit `2afbe7e27409aae87a402cc515291f9e9436e4f8`. Fresh actual 320px testing of that boundary exposed inherited displays that did not fit: 1.1's expectation chain, 1.6's premium/coefficient pair, and 5.3's average-rate chain and original exponential-mixture integral chain. Coordinator explicitly authorized this separate bounded layout correction.

Only four fields in three items change: statements 1.1, 1.6, 5.3 and idea 5.3. The same mathematical tokens, in the same order, now use aligned line breaks; constants, values, hypotheses, original prose and the new prerequisite argument are unchanged. No dependency, syllabus, visualization function, flag or shared runtime changes.

`node tests/verification-behav-equation-wrap-guard.mjs` passes: all **67 full objects/functions/flags** match the immutable prerequisite boundary, except the four approved formatting-equivalent strings. Their equivalence is verified by removing only alignment/environment/spacing tokens and comparing the complete field strings. The previous prerequisite snapshot audit is intentionally specific to its pre-wrap immutable boundary; use this successor audit for the combined state.

Strict build passes **0 errors / 0 warnings**, home **112699 gzip bytes**; focused static **3 / 0 / 0**. The prerequisite mathematical suite remains **12 / 12 passing**.

`BEHAV_WRAP_OUTPUT=<own directory> node tests/verification-behav-equation-wrap.mjs` passes **six fresh 320px runs**, both themes for all three changed items, capturing idea and statement surfaces (12 images). The utility renders the actual strict-built `data/col/behav.json` statement string, rather than substituting an independently rewritten fixture. Every statement and changed idea now has zero horizontal overflow, zero overflowing display math, and no rendering/TeX/blank errors. The producer personally read the eight changed-field output images in both themes, including full bottom lines and the two-step mixture integral. This is bounded text-layout validation and does not certify unchanged widget interactions.

Evidence: `/tmp/atlas-new-behav-wrap/evidence/native`, `/tmp/atlas-new-behav-producer/evidence/wrap-build.log`, `wrap-static.log`. Immutable prerequisite baseline archive: `/tmp/atlas-new-behav-wrap/baseline`. Independent peer should review this commit separately and the prerequisite commit separately; neither claims source closure.
