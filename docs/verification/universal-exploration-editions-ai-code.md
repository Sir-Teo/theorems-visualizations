# Independent AI engineering review — exploration editions

October 22, 2026. Reviewer: separate Codex AI engineering reviewer `code_review`, independent of the authoring agent. Source inspection and focused offline execution only. Only this report written; no author-source modification, browser launch, deployment or other-worktree access.

## Finding history and current status

**Resolved P2 — distribution decision initially omitted part of the delivery dependency surface.** `scripts/exploration-editions.mjs:9` lists only four new files in DELIVERY_CODE; `scripts/build-exploration-editions.mjs:26` hashes only that list. Both modules directly import mutable static builders/helpers and the current `explorations/render.mjs`; the frozen review runtime binds its historical copy of render.mjs, not the actual current import used by the adapter. A changed imported `canonicalBase`, `esc`, or complete companion builder leaves the delivery digest unchanged, so an existing exact distribution decision can remain valid despite changed delivered behavior or output. Reproduce by observing the delivery-binding map excludes `scripts/static-ideas.mjs`, `scripts/build-static-ideas.mjs`, and `explorations/render.mjs`; changing any of those cannot affect the current four-entry digest. Bind the full delivery dependency surface or an explicitly checked immutable predecessor contract, and test changed dependency invalidates an existing release approval. Sent to author and repaired; independent recheck is recorded below.

Current decision: bounded engineering PASS after repair and final packaging/source/log inspection; no open actionable code finding. Native execution and pixel inspection remain author-run, as distinguished in the final addendum. The real release ledger has zero events, so this finding does not indicate an existing public lesson or unauthorized release. No other concrete defect established in inspected source.

## Independent checks and boundaries

Ran Node22 focused offline suite `node --test tests/exploration-editions.test.mjs`: **10/10 passed**, zero failures/skips/cancellations. Checked exact archive loading and reproducible check-only freeze, content/preview/runtime/evidence mutation rejection, source acceptance separate from distribution, missing material/engineering/destination approvals, preview/release inventory, unchanged embedded browser payload, revision ordering, withdrawal tombstones/no fallback, and rejected assembly modes. Synthetic approvals in tests are explicitly fixtures.

Archive retains four accepted local sources only: history/literature0.1.2 and philosophy/agriculture0.1.0. Studio drafts are excluded. Bundles retain reviewed record, current exact source-review evidence, rendered preview and13-source frozen runtime; only10 browser dependencies are emitted. Byte and normalized JSON hash checks reject changes at existing immutable identity/revision paths. Freeze validates all planned current outputs before writes, refuses replacement and supports check-only. Existing historical bundles are fully checked by archive loading. Future incompatible validation contracts explicitly need a version adapter.

Distribution approvals require an exact immutable bundle, delivery digest and clean explicit destination, all source/editorial/runtime/supplement materials, independent named reviewers, evidence hashes and a named decision. These are engineering gates, not a parser-issued rights grant or verification of reviewer credentials. Evidence paths are restricted and filesystem reads check realpath containment. Withdrawal requires earlier publication and exact edition; a fresh output uses escaped tombstones with no removed activity/title/record/supplement payload. Latest revision is numeric, not latest event order; withdrawn latest does not silently promote older versions. Earlier live versions retain their own status.

Adapter changes navigation/chrome/meta only, preserves full browser payload and selected passage text, and fails unknown shell patterns. Relative asset/link depths and agriculture reproduction directory match frozen dependencies/script expectations. Catalog identity pages do not reinterpret or redirect state. Frozen UI keeps existing revision-specific `atlas.exploration.v1.<id>.<revision>` storage keys, share URLs use the exact current versioned pathname, and earlier-note exports remain available; no private notes are exported by build or automatically migrated. Same-origin local-preview/edition pages intentionally use the same existing revision store.

Assembly delegates to the prior exclusive outside-checkout static builder, adds only its generated routes/assets/reproduction targets, refuses collisions, checks old candidate bytes except explicit nav/sitemap updates, and writes a report. Preview cannot receive a public base; release requires one. Empty real release produces no new lesson/runtime/canonical exploration URL. No in-place update/deployment/cache purge is performed; complete-directory publication remains separate.

Native tests/integration checker and final runtime evidence are still being authored; no completion is inferred. No source/subject, rights/professional, real screen-reader, learner or physical/performance observations were performed by this reviewer. Existing bounded acceptance and human limitations remain intact.

## Exact candidate bindings

| File | SHA-256 |
| --- | --- |
| scripts/exploration-editions.mjs | `7f1e3003670c75a474f5065ad98ed2c901dd6e57b9ab3cadf9dc1f4157fc74df` |
| scripts/freeze-exploration-editions.mjs | `f9cd5afbdaf379f11b253d3d1d20474d6292e0de1abe1ec623d2b0f9a048baa3` |
| scripts/build-exploration-editions.mjs | `beff57dba1dcc04b4fd32aee876eea34b2cb39c9ca5c78a06197bed0ab6aed04` |
| assets/css/exploration-delivery.css | `92b422391e406a17175a237c780a83f840148abb065636def1fa92a57dbba026` |
| editions/manifest.json | `d574c9775b056e7b229bc37f47aa974f5a57d6aa7e2086072911a0608ede8ffe` |
| editions/releases.json | `940682500438ddc56f6a4b40df49e9f90ca10d840b920d2b986205d816454270` |
| tests/exploration-editions.test.mjs | `804c2e248b06c835a880c1cb06e8eddef386d96c5502cee1de3a246ccaf76cb2` |
| docs/architecture/exploration-editions.md | `5199f5997e67ec24ceacf669e44bad3251e55d77dd4595dc0fb2f0610f54e404` |
| editions/bundles/x-agriculture-0001/0.1.0.json | `c8b6b3e1547df53f240ae8d132ea25dd471dd27007df28fe866febfdea9ae49e` |
| editions/bundles/x-history-0001/0.1.2.json | `6a98a6138dd8dc19833f6f2a9db87594b44f151a8ca41c25053673dff5ea6530` |
| editions/bundles/x-literature-0001/0.1.2.json | `ffa0b020a06fb25061f3e1c31d70d10ade9ed4aa0e8fcbfdfcdec567e2f0e605` |
| editions/bundles/x-philosophy-0001/0.1.0.json | `532076d58adc072726a860713209a9c838b326b73cf314a45d71a462c3714ac7` |
| editions/runtimes/860f837c7c5bc55c077ec10ee235e326b01a1074104b10f953b7c182ad4f1c53.json | `860f837c7c5bc55c077ec10ee235e326b01a1074104b10f953b7c182ad4f1c53` |

Initial inspected delivery digest: `fb6f6c228699aeac26ce205a937080a19acedc3deb03b3dc4b1ade304b9da0bc`; shared frozen runtime identity: `860f837c7c5bc55c077ec10ee235e326b01a1074104b10f953b7c182ad4f1c53`. Rebind changed code/tests/docs after repair.

## Dependency-binding repair recheck

Independently inspected the repaired DELIVERY_CODE and deliveryBinding: current validator/render dependency closure, static builders/lib and accepted manifest are included; every copied shell/assets/content/data path and byte is included too, rejecting nonregular tree entries and binding extra files. Only declared generation timestamps in data/index.json and data/home.json are normalized away; fields and other bytes remain bound. This closes the reported mutable adapter/companion surface for the current imports. New imports/copy roots must extend the binding contract.

Independently reran all ten offline groups: **10/10 passed**, no failures/skips/cancellations. The new regression first validates an exact synthetic approval, proves timestamp-only changes keep its digest, then independently mutates static-ideas, build-static-ideas, current render helper, content module, CSS and semantic data fields; each changed digest invalidates that old approval. Existing immutable bundle/runtime bytes remain unchanged.

New native test source independently inspected (not executed): complete local link/frozen module closure and private-archive exclusion; exact no-JavaScript passage text, guide and reproduction navigation; real old-preview to edition same-origin note/selection continuity; private-note-free immutable share paths; earlier and malformed note export without overwrite; and16 combinations of four editions, phone/desktop and color schemes. It explicitly serves old preview fixtures only for the continuity test and asserts those directories are absent from output. These are meaningful test designs; actual browser/results/pixels remain pending and no human observations are inferred.

| Additional inspected file | SHA-256 |
| --- | --- |
| tests/exploration-editions-ui.test.mjs | `111cb2b3f67f47dd00f00259695d5231938a10f0913b27a7462679d3c5f36b09` |

Recomputed repaired checkpoint delivery digest: `0dfbd3008112524374c2b4f33cce98caaf6bbeba00a228c6d016964789fd5809`, binding2,512 current input paths. The earlier four-entry digest above is retained only as finding history.

## Final packaging/source and successful rehearsal log inspection

**PASS within independent AI engineering scope; no open actionable finding.** Earlier pending wording is retained as checkpoint history and superseded here. Inspected the final compact edition notice and CSS: native details/summary preserve disclosure of distribution/source-review limits and revision-specific state; no source payload or frozen runtime changes. Native no-JavaScript agriculture assertions now correctly check its 278 observation rows and separate 60 mm model, while other methods retain guide checks. The suite itself checks existing headless browser processes before launch, waits up to 45 seconds and refuses when both lanes remain occupied; this is a process-based precheck, not a general atomic cross-process browser scheduler. No browser was launched or interrupted by this reviewer.

Inspected `check-edition-integration.mjs`, the 19 unique existing file addition manifest and integration/architecture/author verification prose. The checker composes the prior pinned static/evidence/additive rehearsal, copies explicit allowlisted regular additions, checks immutable freeze, runs offline tests, builds both preview and actual empty-ledger release, verifies zero released lessons/runtimes/sitemap routes and compares every preexisting snapshot file afterward. Optional native execution is serial. The package requests no production/source replacement; new shell navigation is candidate-only. Current docs accurately keep local source acceptance, distribution decisions and actual deployment distinct.

Independently read the final successful rehearsal report and associated logs in `/var/folders/29/bzg0zx0d7jjbyf60_3cjch440000gn/T/atlas-integration-tdtGNf/`. This is **log inspection, not independent native execution**. Counts agree:101 preceding additive + 13 evidence/share-state + 9 reading + 10 edition offline + 5 edition native = 138 passing scoped checks, no reported failures/skips/cancellations. This run does not rerun the legacy-reading native suite. Edition native log records 10 HTML pages, 70 local references, 16 distinct targets and 10 retained browser modules, plus passing no-JavaScript text/model/reproduction navigation, same-origin revision notes/selections, pinned private-note-free share paths, earlier/malformed exports and responsive tests. Its 16 default layout combinations and 4 activity screenshots are automated captures; this reviewer did not view them or conduct human observations. The author separately records eight actual image inspections, explicitly not all 20 captures.

Both candidate build logs match every build field in the final report. Preview has 4 current/4 retained editions, 1 runtime and 0 canonical exploration pages; the real empty-ledger release has 0 of each. Both preserve the 7,751-item legacy companion. The report records 6,101 preexisting snapshot files preserved and 10,405 preview/10,406 release companion files preserved, with copied shell navigation as the sole intentional existing-file change in these builds. These are checker/log results, not an independent repeat of the filesystem-preservation run.

Final delivery digest `01388324c9391510c1bcd3166d045b245e4fe6ba1ca11cf353befc182f1262c8` binds 2,512 input paths. Preview generated digest `63a5d9ea87f31b482b336a998173140e72075a6f7e4da2d551d1548f946f1bb3`; empty release `c18f7b08644fc2717fad271ede3c2b3b288449cd1a4812aeb7ba461f2783480d`. Current source/test/archive/manifest/architecture/integration hashes exactly match the successful run. The author verification document changed afterward to record results and is freshly bound below; this AI report is necessarily finalized afterward too. Original/Wave preservation and pixel statements remain attributed author observations; this reviewer did not access other worktrees. Real release ledger remains empty; no fresh rights, subject/professional approval, human session or deployment follows.

Final additional packaging bindings:

| File | SHA-256 |
| --- | --- |
| scripts/check-edition-integration.mjs | `dd3571eb9d37941b470b9a80e8aa8815cd5274d2f32079652c2f44db2142289c` |
| docs/integration/exploration-editions.json | `8cde682c80ea5ad95285a3eb04b1f4d353ab21ec2b45f8ce51d68ed696727d90` |
| docs/integration/exploration-editions.md | `6af595a6e187855c351a0a394c8f7b6936c93d8b7ef93c5c4b982c0a4ae50138` |
| docs/verification/universal-exploration-editions.md | `fa041e8785b0e0000288d47349c2430ecc124e0f42817bef33ca9b7650ae6fec` |

Exact inspected execution-record bindings (under the rehearsal directory above):

| Record | SHA-256 |
| --- | --- |
| edition-report.json | `8783d07f934875b0bf9b9c803f48473c90b69d2aad19b45cbdbe15357b909e49` |
| edition-freeze.log | `c043f66d8bd4f2a060e70a3f3af6e69a4342312af982933879b7de250e68f100` |
| edition-offline.log | `3d17d540de78f6d1c144deb1cd936b48d68c1f4f51787d87ad9dce793f8488a9` |
| edition-preview.log | `fe4686a4077bea34dadc794902dde432ab8c3cdbc0886f173582908a46324a4b` |
| edition-empty-release.log | `e114434244b699411f1d0503e2695ed80a35ce46cd2bc9b0358ebbf826e1c0f2` |
| edition-native.log | `893232f76060d83e2ffb37e9e04e237a528fe2595f5d2adb41e065fb292e039d` |
| check-5.log | `ac8ba900606e6702928350afef0e04936696bd68e3ac894121063e680e1a821c` |
| evidence-offline.log | `3a6b8cb7eb5f13e2789f805bb217cf3fdbe3a8e5a144885dc93291c427c53400` |
| reading-offline.log | `486ab5f62baaf46accdb088585a42387bbe9a3bfb6405bc850aef6a5ecb57177` |
