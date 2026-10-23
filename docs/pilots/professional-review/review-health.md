# P06 qualified-review preparation: independent AI health/numeric desk review

Review date:2026-10-22. Reviewer identity:`ai-health-preparation-numeric-reviewer`. Actual role: independent AI source/numeric/planning reviewer. **No clinician, nurse educator, physiology educator, interpreter, human-access/learning reviewer or participant qualification is claimed.** This report cannot populate a qualified decision record or grant lesson acceptance. Only this review file was written; no other packet, source, pilot or Wave file changed.

## Decision

**Bounded preparation desk review: PASS with all qualified/human/source gates retained. No blocking factual, counting or planning defect found in the reviewed packet.** This means the proposed claim exclusions, numeric examples and review questions are inspectable. It does not establish clinical correctness of an eventual schematic, suitability of complete-cycle density for teaching, observation competence, human usability, clinical learning outcomes or publication readiness.

## Source and phase scope

Independently opened the permitted [NHLBI What Breathing Does for the Body](https://www.nhlbi.nih.gov/health/lungs/breathing-benefits) body. Breathing-in and breathing-out sections support the limited relationship in the packet: contraction/downward diaphragm movement accompanies inhalation; relaxation accompanies ordinary exhalation. The body separates gas exchange from ventilation, identifies active/disease conditions as distinct, and displays June27,2025update. Media credit expressly identifies Nucleus Medical Media all-rights-reserved animation. No animation or quantitative physiological data was inspected or reused.

A direction/phase-label-only schematic, qualified for quiet breathing and explicitly without measured pressure/displacement/volume/oxygenation, remains a proposal for professional review. The synthetic phase-change times do not measure diaphragm motion or clinical inspiration/expiration ratios. No sealed rigid-container analogy is introduced.

**No OpenStax work was fetched.** The packet's recorded mechanism conflict and returned-page login stop are retained as historical author observations, not newly independently verified body content. Excluding the conflicting paragraph is a valid source-selection boundary; it is not a publisher correction or clinical approval. Earlier anatomy receipt is historical only. Fresh OGL403 and inherited NCBI Nursing Skills/ATS-ERS2019/ERS-ATS2022 stops remain closed; no alternate copy, login, mirror or downstream resource was accessed. Current spirometry-standard gap remains open and separate.

## Independent numeric review

Ran `python3 docs/pilots/professional-review/audit.py`: PASS. That command also exercises legal fixtures, but this report's independent subject decision is limited to health/timing and preparation metadata, not legal correctness. Then separately implemented Node event/window calculations without importing the Python counting function. I used clipped interval length to identify positive-duration partial observations, exact containment for full cycles and half-open onset membership. Recomputed all supplied IDs, errors and descriptive per-minute values.

H-REGULAR durations:4000,4000,4000,4000,4000ms. H-VARIED durations:2000,6000,3000,6000,3000ms. Each table spans20000ms with five complete joined cycles and valid internal phase labels. Neither is a recording. The full-window descriptive density is60000×5/20000=15cycles/minute for both, despite different intervals. This is a count/window comparison, not the unweighted mean of instantaneous interval rates or a clinical classification.

|Fixture|Included complete IDs|Positive-duration partial IDs|Onset IDs in[start,end)|Complete/onset descriptive density per minute|
|---|---|---|---|---|
|H-FULL-A|1,2,3,4,5|none|1,2,3,4,5|15 /15|
|H-FULL-B|1,2,3,4,5|none|1,2,3,4,5|15 /15|
|H-CROP,2000–18000ms|2,3,4|1,5|2,3,4,5|45/4=11.25 /15|
|H-LEFT,0–4000ms|1|none|1|15 /15|
|H-RIGHT,4000–8000ms|2|none|2|15 /15|
|H-PARTIAL,1000–2000ms|none|1|none|0 /0|
|H-UNKNOWN,20000–24000ms|unknown|unknown|unknown|outside-trace error|
|H-ZERO,4000–4000ms|invalid|invalid|invalid|invalid-window error|
|H-REVERSED,8000–4000ms|invalid|invalid|invalid|invalid-window error|

All nine agree. Milliseconds-to-minute scale is60000; using60against milliseconds would be wrong. Shared4000ms boundary is not counted as an onset in the left half-open window and is counted in the right. A cycle merely touching a window boundary without positive observed duration is not a partial cycle. Whole-cycle containment counts each completed interval only in the appropriate window.

Crop difference is real: complete-cycle containment discards partial observations and introduces boundary-dependent density, while landmark counts use a different convention. Neither rule is certified as a clinical estimator. H-PARTIAL contains observed phase time despite zero counted completions/onsets, so0cannot mean absence of breathing. H-UNKNOWN lies beyond the supplied table and correctly produces unknown/error rather than fabricated zeros. The packet asks qualified reviewers to assess that cropping bias and terminology before authoring.

## Claim, rubric and preparation boundaries

The proposed rubric records selected labels, exact IDs, reader reasons, assistance/access mode and limits rather than scoring diagnostic competence or agreement with an unstated rule. Transfer asks about evidence missing from unfamiliar synthetic tables. It does not request patient data, self-tests, altered breathing, diagnosis, oxygenation inference or medicine changes. Actual responses, participation, consent and privacy arrangements remain blank/future; no learner or accessibility result is supplied by correct fixtures.

README correctly requires a real qualified reviewer to identify role, qualifications, conflicts, exact hashes and approved/changed/outside-competence/unresolved responses. AI cannot supply that professional decision. All five health qualified-decision requests remain open, then draft capacity and eventual exact-artifact/human checks still follow. P07/P08's two unaccepted slots are preserved. Fixture metadata remains review-input-only, runtimeId:null, authoredLesson:false, acceptedLesson:false, qualifiedReviewer:null and patientData:false; professionalApprovals remains empty.

Original `docs/pilots/06-health.md` is byte-identical to current HEAD. Its source conflict, unassigned roles, source/rights restrictions and future clinician/reader gates remain historical inputs; this new packet does not silently rebind or accept that first lesson. Quiet-breathing limitation and air-movement/gas-exchange distinction remain consistent.

Current use is original numbers/proposed original schematic and links. No external figure, animation, passage, patient case or clinical protocol is bundled. Displayed website licensing is not broad permission for a future asset or release. No rights approval, professional review, publisher correction, current-standard review, public release or observed learning/access evidence is established by this desk decision.

## Exact reviewed bindings

|File|SHA-256|
|---|---|
|docs/pilots/professional-review/health.md|`b60904203eea008c5dc4dc8f3766dee551fa62dca3441ab99f4cf2b311efd505`|
|docs/pilots/professional-review/health-traces.json|`90196cd6589cde2ec291fbc28427e7bc6f5a397695c29a26475bbc9adfb63756`|
|docs/pilots/professional-review/sources.json|`5d2249a7487188feac3d62104cfaacccf691acd5851d2dcac6cc9a88fbd3cd67`|
|docs/pilots/professional-review/README.md|`bfbca5480c6b0ee17362aa934ddc22185aee79db5e9fdeb087d4fcc3772ef9ce`|
|docs/pilots/professional-review/audit.py|`4d1f2543db95d0c6df52eee2e028f6a5376c4485dd1e14cdceba80bcc4f3497b`|
|docs/pilots/06-health.md|`04c14c583c60b23797cc3d6ab97fa13819e0c6d90b33b54ceb2aaead2e4e2239`|

Scoped source-record canonical hashes (sorted keys, compact UTF-8 JSON):

- `prep-nhlbi-breathing`: `6948423d2fc5c32bda8d827d1551048f81178c973f20899e9fb77c798d04fb78`.
- `prep-nursing-conflict`: `fbba17388042a4ff5a36e9e910827114467ebcdeeb6fe8dedf46d54ff755b77b`.

Shared-source-file binding does not mean this reviewer verified the unrelated legal bodies/claims. Changed bound content requires a scoped recheck. No product repair was needed or made; all preparation/clinical/human gates remain open.
