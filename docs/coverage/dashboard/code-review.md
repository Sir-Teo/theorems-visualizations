# Independent AI engineering review — coverage dashboard

October 22, 2026. Reviewer: separate Codex AI engineering reviewer `code_review`, independent of the authoring agent. Read-only source/accounting review; no browser, Wave worktree access, blocked-source retrieval or authored-file edits. Packaging/check scripts and tests were still being authored during this review and are not assumed complete.

## Actionable findings

1. **P2 — capture reproducibility includes wall-clock output.** Isolated accepted build correctly protects active checkouts, but data/index.json contains build.mjs's `new Date().toISOString()` field. Capture hashes that entire generated body and copies index.generated into inputs, so identical commits and explicit asOf produce different evidence hashes/inputs on recapture. Current captured asOf is 21:17:51Z while accepted.generated is 21:18:20.132Z. Normalize only this generated metadata to explicit asOf before deriving/hashing the dashboard evidence, document that normalization, and leave the production builder untouched. Test identical generated content with differing raw timestamps yields identical captured evidence for the same asOf.

2. **P2 — redesign attribution can contradict canonical identity.** Model checks that redesign.collectionId exists and ID is in a known canonical set, but never checks those facts agree. Independently changed the first existing item `ode-5.1` to collectionId `stat`: buildCoverageModel accepted it and silently moved visual scope between D01 and D02. Require canonical ID/collection consistency for redesign entries and frozen Wave rows before primary-domain joins. No mismatch exists in current captured input.

3. **P2 — prior passes can hide a later changes-requested receipt.** Model currently filters all current-version receipts to result=passed and satisfies dimensions from any earlier pass. Capture retains both passing and changes-requested records for the current version, so an in-review pilot with a later negative receipt can show that dimension complete. Determine required-review state from latest receipt per dimension; keep explicitly labeled latest passing-receipt age separate if desired. Accepted pilot capture is additionally protected by builder validation, but in-review queue labels still need to preserve later negative findings.

Initial result: changes requested for these bounded accounting/capture issues. Parent was already improving latest-passed-age labels, saved domain-filter definition and refresh artifact checks; those pending tasks are not separately claimed as defects or completed work here.

## Independently checked accounting

Loaded current captured inputs into the pure model; no snapshot or source ledger mutation. Current totals reconcile to **7,751 accepted production / 5,823 planned**, 85 collections, 30 reviewed orientations, six authored/four locally accepted pilots, eight briefs and a separate 24-lesson target. Wave 6 partitions **36 accepted + 239 author-verified + 782 outside checkpoints = 1,057** frozen identities. Visual ledger counts **1,101 scoped = 141 redesigned + 12 retained + 948 pending**, including 34 outside accepted production. Eleven classification rows retain review actions. Human accessibility and learning totals remain null/not established.

Primary-domain assignment and disjoint written/planned canonical sets prevent cross-listing multiplication. Local pilot domain memberships are intentionally overlapping and are not summed for unique global totals. Current visual and frozen-wave IDs match their stated collection prefixes; the mutation in finding 2 exposes a missing defensive validation rather than existing miscounted inputs.

Capture reads pinned Git objects and builds accepted production data in a disposable archive; it does not rebuild an active Wave checkout. Explicit accepted-base handoff and frozen chapter comparison checks are present. Local pilot/orientation artifact validators run before capture. Source export includes bounded paths, commit/hash/derivation descriptions and limitations; it does not claim human or professional review. Snapshot data is a dated observation rather than live monitoring.

## UI/source review

Read DashboardContent.jsx and relevant data-app filter/source interfaces. React escapes displayed strings; local route parts originate from validated IDs/known paths. Domain chart rows use additive production counts; pilot programme/state/release limits and visual scope caveats remain separate. DataComponent/EvidenceChart preserve raw sourceRows alongside displayRows. Review tabs have their own local state/scheme filters; domain selection is intended to apply to coverage/work-stream queries. Actual runtime filter/source export behavior requires the owner's browser checks and was not observed by this reviewer.

Review age is being relabeled explicitly as latest passed current AI receipt age, which avoids implying the oldest required review or comprehensive freshness. Null human evidence remains distinct from zero. No real learner, screen-reader, professional or community observation is granted by this review.

## Exact file hashes at this review checkpoint

These bind the files inspected at report-writing time; the owner was editing concurrently. They are not a final receipt for later repaired bytes.

| File | SHA-256 |
| --- | --- |
| scripts/capture-coverage-dashboard.mjs | `a07b5b58111f59634add7c88dc9b3e987ccabd2df6439ab5a8ce212b6d64afc3` |
| scripts/coverage-dashboard-model.mjs | `ceb07ac4ec9356bcce600b3ac9c3883c7739170c11fae976805f28ef9458e2f3` |
| scripts/build-coverage-dashboard-data.mjs | `37f53ebb1019d3b151a93527ad518c02828ffb51a16c66d83f15ecd7dd5ab085` |
| coverage-dashboard/src/content/dashboard/DashboardContent.jsx | `83a9ad6872e0cebdd58f688009b86a964acdf8c816fda3d5ce312a51558bbefb` |
| docs/coverage/dashboard/inputs.json | `7f4f38a789906a5f2d27cf8565217037c3ce5b8c36688820689f8bcef0206ab5` |

## Limits

Engineering source/pure-model inspection only; no newly authored test suite or packaging completion assumed. No remote body inspection, new Git acceptance, production publication or edits to other work streams performed. Recheck repairs and freeze exact file hashes before issuing final engineering approval.

## Final independent repair and implementation recheck

All three reported findings are resolved. Capture now normalizes only accepted index.generated to the explicit snapshot time before stable serialization/hash, documents that derivation and supports pinned expansion/redesign commit refs. The reported full repeated-capture equality is owner-provided evidence; this reviewer inspected the normalization/ref implementation without accessing the Wave worktrees or rerunning capture. Model rejects visual and frozen-wave IDs whose canonical collection conflicts with their attributed collection. Latest receipt per required dimension now controls missingRequiredReviews and accepted-state assertions, while the explicitly labeled latest passing receipt age remains a separate measure.

Independently ran the completed focused offline suite on Node 22.23.3: **12/12 passed**, zero failures/skips/cancellations. This includes original attribution/negative-receipt regressions, inventory/partition reconciliation, stale local evidence refusal, bundle integrity/path rejection and the current recomputed snapshot/model/compiled artifact binding check. No browser or authored-file edits performed.

The new checker recomputes reviewed data from captured inputs, checks their current local hashes and invokes pilot/orientation validators in the selected root before deriving current acceptance counts. It compares the saved source snapshot/model with that deterministic projection, permitting only explicit app identity/lifecycle metadata. The owned split bundle requires fixed index.html plus content-addressed JSON paths, byte/hash integrity and exact equality with reviewed source data. Current source binding hashes match the inspected authored files; HTML/snapshot/runtime hashes match the delivered manifest. Existing changed owned bundle bytes are refused before staging a replacement. No-argument checks need no compiler; only explicit --build-tool builds via the supplied Data app compiler. Staging targets the separate labs/atlas/coverage route and removes only the prior verified sidecar named by its manifest.

Integration preflight now packages the isolated dashboard source/build/check/tests and calls its check alongside existing pilot/orientation checks. Browser suites are separate sequential commands, preserving one task browser lane. Full final manifest-count/summary completion was still being finalized by the owner and is not inferred here. The README records distinct denominators, timestamp normalization, null human evidence, latest-passed-age limits, refresh workflow and local-only release scope. No production/Wave runtime content mutation or public deployment is authorized by these checks.

**Final bounded independent AI engineering review passes for the inspected repaired files and exact current bindings below. No additional actionable engineering finding found.** Independent data review and actual human/professional/physical observations remain separate. This does not declare the full master plan complete.

### Final exact hashes

| File | SHA-256 |
| --- | --- |
| scripts/capture-coverage-dashboard.mjs | `a07b5b58111f59634add7c88dc9b3e987ccabd2df6439ab5a8ce212b6d64afc3` |
| scripts/coverage-dashboard-model.mjs | `ceb07ac4ec9356bcce600b3ac9c3883c7739170c11fae976805f28ef9458e2f3` |
| scripts/build-coverage-dashboard-data.mjs | `750146a8ca447bc4fa0cc3cfb5974f004c19f8aeba047bf395c6091182ef2b83` |
| scripts/build-coverage-dashboard.mjs | `55edd8c00c3bb59727eec4dfb71816118ee148a4b9c45c8290f175399c264728` |
| coverage-dashboard/src/content/dashboard/DashboardContent.jsx | `821295fda6178b19c1a5b06a8a390aea1ac64d579535d2e532cc58ca4af53669` |
| coverage-dashboard/src/content/dashboard/coverage.css | `214347dc646bc556c0261cb9b64bf21f9d29caaee00d4a15aecc554638aaf2e1` |
| coverage-dashboard/src/data.json | `f7e8caebee7e27fad2c6a40b4c296dfbcd0742bc0aedebdf9a336aedcaa0481f` |
| docs/coverage/dashboard/inputs.json | `306d9f348240e9c252508146dcfde0452c87f1a25204be5f6bfa021a484aebb9` |
| docs/coverage/dashboard/model.json | `69e2a35c800b6cadef0c76c7e55ed20997b48cf70e788b311ea0db6299414c5d` |
| docs/coverage/dashboard/build-source.json | `d657de4f2632ce146948cd5912323b5129bc7e15ddfff46985b6557901ab1be8` |
| scripts/check-exploration-integration.mjs | `8785d9d1cdc2a4bc686037993153dc82cc24ef01ef0c90737a093cabfa535184` |
| tests/coverage-dashboard.test.mjs | `ebdcc37793a00575f60494f523c8f3f826d58460371a72b6df9c7003f5b0977d` |
| tests/coverage-dashboard-ui.test.mjs | `aa4b2dd0abd1af6aca52754be9689ba191df0b1a31402a23851f2cfd3f545c27` |

Delivered HTML SHA-256: `3477df7fbc43db3215d13f4891a0591dd0691e3362a585fa2352a57a62e94b6b`.

Delivered snapshot SHA-256: `f7e8caebee7e27fad2c6a40b4c296dfbcd0742bc0aedebdf9a336aedcaa0481f`.

Copied runtime SHA-256 from the verified build manifest: `9e3ede84b28aded3c7379b6e6a5611f0d95b9977eb0f781e279ceefabfcbd27e`.
