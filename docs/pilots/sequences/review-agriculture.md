# P05 follow-up research: independent agriculture/data review

Review date:2026-10-22. Reviewer identity:`ai-agriculture-sequence-research-reviewer`. Actual role: independent AI research/data reviewer. This is neither an agronomist's approval nor a community/participant mandate. No professional, practical, human learning or accessibility session is claimed. Repository edits are limited to this report; no lesson, acceptance, runtime ID, prerequisite or contact is created.

## Decision and retained gates

**Bounded desk-research decision: PASS with the briefs' preparation gates retained.** No blocking factual or arithmetic repair is required in the reviewed briefs. The irrigation cases are original fictional arithmetic; the Koraput case is an institutional-source comparison with a disclosed unresolved village discrepancy. This is not approval to author or publish either lesson before its specified agronomy/community/location/rights gates close.

One new source-access limitation must be preserved: the independent FAO profile open timed out. It was stopped without retry, alternate host or body recovery. I independently inspected the author's saved earlier tool-returned body instead; that corroborates the narrow source characterization but is not a fresh independent fetch or raw HTTP snapshot. The owner was informed. No stopped-source body was inferred from a snippet.

## Primary-source checks and locators

- [UMN checkbook method](https://extension.umn.edu/natural-resources/conservation/agricultural-soil-and-water/irrigation/irrigation-scheduling-checkbook-method): independent readable body. Method requirements, balance, excess/discrepancy and timing/amount sections support field observation, net-versus-gross awareness and field reconciliation. Author credit names Jerry Wright. Source warns some surplus remains temporarily usable during drainage; the brief correctly identifies its instant-removal case as a simplification, not that full process. Spreadsheet/papers were not executed or independently validated.
- [NDSU AE792](https://www.ndsu.edu/agriculture/extension/publications/irrigation-scheduling-checkbook-method): independent readable body, reviewed February2024, Scherer/Steele credits. HTML Table2 distinguishes corn's48–54inch full roots from36inch management depth. Daily Crop Water Use Estimates supplies the85°F/ninth-week0.25inch/day example; actual growth stage can override calendar week. Definitions/application-efficiency, pumping, balance and trigger sections substantiate regional/soil/stage/system context. Source says estimates are simplified for North Dakota.0.09in/in is an illustrative assumed uniform capacity here, not the source's layered example or a fitted Wisconsin measurement. ASABE-adapted definitions/figure permissions are not this project's licence. No table/figure/worksheet reuse is approved.
- [FAO Koraput profile](https://www.fao.org/giahs/giahs-around-the-world/india-koraput/en): peer open timed out; used saved prior author tool text, `/tmp/atlas-sequences-methods-20261022/fao-koraput-author-tool-capture.txt`. Returned lines17–58 identify2012designation, agricultural/forest/livelihood context and MSSRF requesting agency. Its diversity figures mix unspecified recorded totals with1960s/1990s comparisons; brief correctly avoids a current census or general outcome claim. Lines67–68 link action plan under a2012highlight. Cached capture is provenance-limited, not independent fresh confirmation.
- [MSSRF action plan hosted by FAO](https://www.fao.org/fileadmin/templates/giahs/Action_plan_Koraput.pdf): independently read local pinned PDF title and selected printed pp2–5,9–10 with pypdf. Visually inspected supplied complete printed-p2 rendering using the PDF skill. Title/author and **Definition of output** table match the source receipt: documentation, conservation, utilization and benefit-sharing objectives. These are proposed outputs rather than proof of implementation/effect. The plan contains historical legal/policy, medical and broad social assertions; this brief does not endorse them or extract practices. No complete report/current-policy audit is claimed.
- [MSSRF seed-keepers feature](https://www.mssrf.org/stories-of-change/seed-keepers-odishas-community-seed-banks): independently read full returned feature body, byline Team DIVERSIFARM-India and19May2026 date. Opening names Nuaguda, closing Kumbharaguda while referring to Dutika Mathpadia; discrepancy is real and unresolved. Brief correctly treats the story as mediated attributed experience, distinguishes institutional generalizations, and avoids causal/average benefit or community-mandate claims. Original interview/language/translation/permission were not inspected. No photo, quotation or seed-handling instruction is selected for redistribution.

The three Koraput records are related institutional sources rather than independent confirmations. Reading them does not appoint a local representative. Institutionally reported choices/control/labour/preferences cannot establish population effects, nutrition outcomes or an authoritative practice protocol.

## Independent fictional arithmetic

Ran the supplied Decimal audit successfully. Then separately computed all cases using Python Fraction, without relying on its Decimal implementation or expected-result comparison. Uniform capacity36in×0.09in/in =3.24in water; units cancel correctly. Optional independent conversion gives82.296mm, using25.4mm/in. No volumetric interpretation of the uncertain P05 measured dataset is introduced.

Let C be available-water capacity, D deficit, P effective rain, G gross irrigation, η efficiency, E crop use and L=(1−η)G application loss. Net irrigation N=ηG. Equivalent deficit expressions are D+E−P−N and D+E−P−G+L. Available storage above the illustrative wilting baseline is S=C−D; a within-range end must satisfy S_end=S_start+P+G−L−E−surplus.

|Fictional case|Independent result|Interpretation|
|---|---|---|
|Gross/net|N=0.40in;L=0.10in;D_end=0.75in;S_end=2.49in|Starting storage2.24 +rain0.10 +gross0.50 −loss0.10 −use0.25 =2.49. Adding the same loss again after net irrigation wrongly gives0.85in deficit.|
|Surplus|Raw deficit−0.70in;surplus removed0.70in;end deficit0;end storage3.24in|Starting storage3.04 +rain1.00 −use0.10 −surplus0.70 =3.24. This explicitly accounts for excess, not created/disappearing water.|
|Outside available range|Raw deficit3.35in,0.11in above capacity;formal available storage would be−0.11in|No valid ending deficit/storage is reported. The plan rejects continued unstressed available-water accounting rather than silently clipping a valid recommendation.|

All three checks pass. The surplus case's immediate boundary removal differs from transient physical drainage and is expressly disclosed. Capacity/efficiency/field inputs are hypothetical; the crop-use datum is only a cited regional estimate. Gross/net convention must remain explicit if later examples include both application loss and drainage. Forecast/delivery/action comparisons are proposed reader work, not implemented or agronomically validated timing rules.

## Planning, learner task and rights

P05-L02's question moves from sample observations to field-scale assumptions, meaningful provenance labels and a daily ledger. Field-check corrections preserve earlier estimates and reasons; they do not alter weather history. Final decision thresholds, crop-stage/soil envelope and delivery capacity remain subject to agronomist review. P05-L03's claim/source/actor/time matrix and attributed/proposed/inferred edge labels are appropriate for contrasting evidence scales. Village location must be resolved or a clearly located substitute selected before authoring; no map pin is justified now. Asking whether varieties prove nutrition or labour outcomes exposes missing evidence rather than asserting an effect.

Both queue rows correctly remain `researched-with-open-gates`, authored:false, accepted:false, runtimeId:null and no accepted prerequisites. README retains16follow-up records/eight researched follow-ups, distinct from8original briefs/6authored previews/4local acceptances/24lesson target. It does not add these briefs to delivery totals. Existing two-slot review capacity and first-lesson-specific human-check exception remain bounded. No rights permission, professional review, participant recruitment or outreach is invented.

Links/original bounded commentary and original arithmetic are within the present stated research scope. Public hosting, historical underlying knowledge or an institution's own ASABE permission do not grant this project quotations/photos/translations/practice-reproduction rights. Final selections, distributions and local participant/community context remain open. Medicinal/legal assertions from old plans are not adopted as health advice/current law. No practical irrigation, seed storage or harvesting procedure is approved by this desk review.

## Exact reviewed-file bindings

These hashes bind the reviewed snapshot, not later edits. Shared sources/queue/README files may change through other reviewers; relevant subsequent changes require a recheck. The individual selected source records are additionally hashed with JSON canonicalization (sorted keys, UTF-8, compact separators) to distinguish scoped source review from unrelated records.

|File|SHA-256|
|---|---|
|docs/pilots/sequences/p05-02-irrigation.md|`bb68e98ec05fd1150892e9abb00aaeee8720afb40e18b40b5c1e9762c8ba1370`|
|docs/pilots/sequences/p05-03-koraput.md|`236159dbcd3962657f0cec7a82864e8b611b0a76e97d38f7e56f53d5888653cc`|
|docs/pilots/sequences/research/irrigation-accounting.json|`abd1554dc7e5f70e3fb256c35c30d8e49eda340f5581b42ba3e17031ac0bcd51`|
|docs/pilots/sequences/research/irrigation-accounting.py|`bef282ee754742ba5358ff1759d2972289c250e2dfb2c2b280dbc5692be5218d`|
|docs/pilots/sequences/sources.json|`daae4724054279706470d673f09a5c89c946e95d5d7af7d5abf731c37541f027`|
|docs/pilots/sequences/queue.json|`12bf7a87d5f388e367f279591008ad3cdcb8a4335fbd20f5442dcff3ba6cd1ad`|
|docs/pilots/sequences/README.md|`12504b8214ba1110601e4ab3933ae333bd65a3f5fc9651adbff350d1f41bdb0d`|

|Selected source record|Canonical SHA-256|
|---|---|
|seq-umn-checkbook|`4e7695a61c9cbc2f59068676814432e0472726649a6e9cb03ccc5be78734269e`|
|seq-ndsu-ae792|`165daef077bf44e3238051e5f93d62cac7cdc171894571e865507e020ff2b4d7`|
|seq-fao-koraput|`3f1f1e04052f0c0cecd91841c5c959341ff30b65a5454547447ad2ba9dd2fbc4`|
|seq-koraput-plan|`bed50f21aaa41d843a027a976b6944cefce4d74fad5f52e03d933ae4881dce7f`|
|seq-mssrf-seeds|`94a80f070898251409eb4e80d0aaa8205f920388a579cb605d068337b23c226c`|

Local evidence hashes:

- `/tmp/atlas-sequences-methods-20261022/koraput-action.pdf`: `5bdd12c8c5f1e393e8ef32102e5ffec2aa04e06621a284b99985ee5dbcca7737`.
- `/tmp/atlas-sequences-methods-20261022/koraput-outputs.png`: `bce5752902039ab7fe09f78db294f51f38be2c21608e87adfd37595e840f1aea`.
- `/tmp/atlas-sequences-methods-20261022/fao-koraput-author-tool-capture.txt`: `d33e626799ee12452e40517098b045d62978749bb9d64e4223107997ce1961fc`.

No product repair was made by this reviewer. Only this review file was written. The new independent FAO timeout/cached-evidence limit is reported here for preservation. Numerical checks establish fictional conservation arithmetic only; they cannot close field, agronomy, community, rights, learner or access gates.


## Narrow preservation/binding recheck after P04/P06 research · 2026-10-22

Independently compared current P05-L02/L03 brief bytes and irrigation JSON/Python audit bytes with Git checkpoint `5a86f166`: all four unchanged. Independently compared the complete first17 source-record objects with that checkpoint: all unchanged, including all five P05 records. No FAO refetch or timeout recovery was performed; prior peer timeout and cached-author-body limitations remain binding. The new professional-domain research neither closes P05 agronomy/community/location/rights gates nor reclassifies P05 research as a lesson.

Current queue has16follow-up records: **12researched-with-open-gates +4proposals**. Current sources has**26receipts**. README states those totals and preserves8original briefs,6authored previews,4locally accepted previews and24lesson target. New law/health entries are outside this agriculture source-content review. P05 result remains bounded research PASS with open preparation gates; no new acceptance or human/professional evidence.

Current shared-file binding hashes superseding earlier whole-file hashes only:

- `docs/pilots/sequences/sources.json`: `ecd54002ee1f26ae30b55db68237276555bcf20d7625dd62fc50f30d0c89b9f4`.
- `docs/pilots/sequences/queue.json`: `2dddce061b3e242909ccd97d3db62ebd94d3ae007c1213b9a11fc06e196c1c28`.
- `docs/pilots/sequences/README.md`: `d77cc8e645c000085609c9c9996e4937fd987197cb2a941df023391632b8dd8f`.

All earlier P05-specific source/audit/brief hashes remain valid. Only this narrow append was made to the agriculture report; no other agriculture source or authored file changed.
