# Independent AI engineering review — explicit note copy and recovery

October 22, 2026. Separate Codex engineering reviewer `code_review`, independent of author. Inspected source and ran focused offline tests in the integration worktree only. Only this report written. No browser, author-source change, other-worktree access, deployment or human session. Baseline checkpoint 7fd688a48bb026582fae1d24d86536b29ee4038d.

## Current findings and status

**Final bounded engineering PASS after lossless fallback repair and source/packaging/log recheck; no open actionable finding.** Native tests, packaging checker/docs and final runtime evidence are still being authored and are not assumed complete. Changed source/test files must be rebound in final review.

Independently ran Node 22 `node --test tests/notebooks.test.mjs tests/exploration-editions.test.mjs`: **23/23 passed** (13 notebook + 10 edition groups), no failures/skips/cancellations. Covered original-source/selection/extra-field/progress preservation, new-target defaults, exact-byte/absence undo, same-revision imported note recovery without imported selections, existing/earlier/malformed note export, identity/schema/size/depth/prototype rejection, stale previews, blocked/quota/silent storage failures, mid/postwrite conflicts, later-edit undo refusal, forged target/selection rejection, withdrawal privacy and delivery dependencies. These are meaningful model tests; DOM and storage behavior in a real browser remains a separate check.

## Engineering assessment

Import has 1 MiB UTF-8 / 100 entry limits, individual raw-data limit 200,000 characters, 1,500 character note-copy limit, JSON depth/node budgets and recursive prototype-key rejection. Valid raw malformed strings can remain recovery sources without being interpreted as selections. Oversized local stores remain exportable via raw fallback, and previews explicitly disclose shortening of the displayed raw data. The copy path refuses unreadable destination stores and never silently truncates a draft. Existing destination selections and extra fields are preserved; absent destinations use trusted rendered edition defaults. Imported selections are never copied into another edition.

Copy is an explicit preview/download/checkbox action, protected by Web Locks for manager-to-manager activity. Model rechecks exact source/destination values before journal write and again afterward, persists and verifies full before/after recovery first, and retains that journal on write failure. Undo checks unchanged journal and exact current-after value, restores exact prior bytes or absence and verifies; journals remain exportable after undo/crash/failed write. Original source and unrelated progress stores are not changed. There is no unbacked destructive destination write in the inspected flow.

Existing frozen lesson pages do not participate in manager locks, so these checks cannot make compare/write atomic against arbitrary other same-origin scripts. The UI explicitly instructs closing other lesson tabs and acknowledges last-moment conflict risk; snapshots/backups provide recovery. This is an accurately disclosed limit, not a guarantee of global transactional isolation. Storage denial/quota, failed verification and malformed journals produce explicit status/export paths. Manager-copy/undo remain disabled without storage, Web Locks and secure UUID support.

DOM-facing private data uses textContent, textarea values and Option text; no imported HTML is executed. Module has no fetch/upload/remote transport; the generated page references only local assets, uses no-referrer and noindex/nofollow. Files are intentionally local downloads with private notes; cross-origin transfer requires user export/import, not access to another origin's storage. Storage events invalidate stale prepared commits. No automatic import writes or cross-revision migration occurs. Recovery history intentionally accumulates until the user clears browser data; UI explains quotas/clearing and keeping downloaded recovery.

Notebook metadata includes only identity/revision/state for withdrawn editions, no former content/default selections; unavailable/withdrawn records cannot be selected as copy targets. User-held local notes remain exportable as private data. Empty real release still generates no notebook page or lesson/runtime payload. Catalog/identity/tombstone note links and the reader footer use correct relative depth. Frozen browser payload, original source records and retained runtime remain unchanged by adapter additions. Delivery binding includes every new renderer/browser/style path and previous complete companion inventory, so old approvals cannot silently authorize the changed delivery.

## Exact initial source bindings

| File | SHA-256 |
| --- | --- |
| assets/js/notebook-model.js | `847892be56796b20d5cea5da5b360f76e384b834e4bd5b04e5b5a2ae30195d48` |
| assets/js/notebook-view.js | `00e90aeed1c16582e0fb3b3eef271a67b4813142dc775c0630da57cdfa64be6a` |
| assets/css/notebooks.css | `7711813c152fc0075c833511d88a0d0fdca668ce840c6cca0f113c107937b483` |
| scripts/notebook-pages.mjs | `e68823fe9c40d9bb705ad726fbf9c4e563d4251007c4adadc41a923021e4aee6` |
| scripts/exploration-editions.mjs | `80a90b689fa867ae1beadf6528213bc312db82e873a971c4a4e31014b0c8aa8e` |
| tests/notebooks.test.mjs | `9b9747185a2bab5480cc2ae57c201eed1101391cfa989526dab4fe25782b1034` |
| tests/exploration-editions.test.mjs | `804c2e248b06c835a880c1cb06e8eddef386d96c5502cee1de3a246ccaf76cb2` |
| editions/manifest.json | `d574c9775b056e7b229bc37f47aa974f5a57d6aa7e2086072911a0608ede8ffe` |
| editions/releases.json | `940682500438ddc56f6a4b40df49e9f90ca10d840b920d2b986205d816454270` |
| scripts/build-exploration-editions.mjs | `beff57dba1dcc04b4fd32aee876eea34b2cb39c9ca5c78a06197bed0ab6aed04` |

## Scope limits

No actual source/rights/professional, real screen-reader or learner approval. No browser execution/pixel verification is claimed. This is a bounded AI engineering review; final native/integration evidence and source/document bindings remain pending. No existing acceptance count, real public release decision, Wave progress or deployed site is changed by this review.

Initial independently recomputed delivery digest: `e3143275dd3d7562d522436427790fd8a42b4ac7cd4c54d1e78e499f0026bae3`, binding 2,516 paths. Final source changes require rebinding.

## Subsequent raw-export finding and packaging inspection

**Resolved P2 — initial plain-text raw fallback could alter the exact stored UTF-16 string.** In notebook-view.js, unreadable-journal export and oversized-source fallback pass raw strings directly to Blob as text/plain. Blob converts unpaired UTF-16 surrogates to U+FFFD. Independently reproduced offline: raw=`"x".repeat(200001)+"\uD800"`; Blob.text() differs, with final code unit 55296 becoming 65533. JSON.stringify(raw) through Blob then JSON.parse preserves it. This contradicts the UI/docs promise of untouched/full stored-string recovery for the very malformed/oversized stores these paths serve. Export a JSON-escaped raw-string envelope (or equivalent lossless encoding), test lone-surrogate round trips for both fallbacks, and retain the structured-import limits explicitly. No author source changed by this reviewer.

Also clarify oversized sources as export-only: current source-info says an oversized source may supply a recovery draft, but prepareCopy rejects every source.raw longer than MAX_RAW even if the proposed notes are short. That refusal is safe; the message should distinguish it from recoverable in-limit malformed sources.

Reviewed new native source: six groups meaningfully exercise explicit preview/download/copy/reader/undo, private URL/network absence, other-tab stale-copy/undo, actual two-origin export/import without initial writes, withdrawn identity-only recovery, malformed files/long drafts/storage/lock denial, keyboard focus and sampled phone/desktop themes. This is test-source inspection, not independent browser execution. The initial 6/6 reported author run predates the fallback repair and is not final evidence.

Reviewed cumulative checker and manifest: one exact preimage adapter replacement + 12 unique additions. Historical 7fd688a48bb026582fae1d24d86536b29ee4038d source is Git-archived and its unchanged edition checker runs in a subprocess before the new delta, avoiding accidental reuse of current imports under a historical manifest. It builds fresh preview/empty-release candidates, runs freeze/offline and optional serial native tests, checks empty release exclusions and compares every unrelated snapshot file. No active checkout receives the delta. Docs honestly disclose non-atomic old-tab conflicts and private local/downloaded recovery; their plain-text preservation claim needs the P2 repair. Final pinned runtime logs remain pending.

Additional inspected checkpoint bindings (expected to change after repair):

| File | SHA-256 |
| --- | --- |
| tests/notebooks-ui.test.mjs | `5b54a9baf40450668b56181420472d8e96775b8a7b265964dde662cafccf0137` |
| scripts/check-notebook-integration.mjs | `3df0dd4e94f80c34ad13df0819b6d1b02a1423883889ae7412eaaf6911372690` |
| docs/architecture/exploration-notebooks.md | `ebcfca976f88fd21cde3a8edfc37bb2f0248c813e6fb87f32274d7f122e6905a` |
| docs/integration/exploration-notebooks.json | `f19f65e681e107487839eea37f588ce27488057e31683de63a3590074ce53946` |
| docs/integration/exploration-notebooks.md | `61c5f9f1e88cb3c9f12ead8e74d9ffd22049bafb5f2bb83cad5e342a1cac9077` |

## Lossless fallback repair — independent recheck

Independently inspected `rawRecoveryText` and both browser fallback callers. Raw strings are now JSON-escaped in an `atlas-raw-recovery` envelope before Blob construction, preserving lone UTF-16 code units. The explicit inspection-only envelope is rejected by the bounded structured importer; it does not bypass size or copy limits. Oversized sources show export-only instructions and no copy targets, separating them from recoverable in-limit malformed sources. Architecture prose now matches those limits. The P2 and misleading oversized-source message are resolved.

Independently reran notebook+edition offline tests: **24/24 passed** (14 notebook + 10 edition groups), no failures/skips/cancellations. The added regression passes malformed and oversized strings containing both valid surrogate pairs and lone surrogates through actual Blob.text()/JSON.parse and verifies exact raw equality plus structured-import rejection. New native test source exercises actual downloads from both oversized-source and unreadable-journal fallbacks and verifies originals remain unchanged; this reviewer did not execute that browser test. Current model/view/unit/native-source hashes independently match the same files in the running a9VOTz integration snapshot. Final pinned native/log outcome remains pending.

## Final successful cumulative rehearsal — independent log inspection

Final decision: **PASS within this independent AI engineering scope; no open actionable code finding.** Earlier pending statements describe checkpoint history and are superseded by this section. Independently inspected `/var/folders/29/bzg0zx0d7jjbyf60_3cjch440000gn/T/atlas-integration-a9VOTz/notebook-report.json` and sibling stage logs. This is inspection of author-run recorded execution, not independent native execution or visual/human observation. Independent source/packaging checks and 24/24 offline execution are separately recorded above.

Logs agree: predecessor 101 additive + 13 evidence + 9 reading + 10 edition offline, followed by 24 delta offline (14 notebook + 10 repeated edition) and 12 native (5 edition + 7 notebook). That is 159 distinct groups and 169 executions; all pass with no reported failures/skips/cancellations. Native log reports 11 HTML pages, 86 local references, 19 targets and 10 frozen runtime modules, plus successful actual copy/reader/undo, stale other-tab protection, two-origin import/export, withdrawal-only recovery, both lossless fallback downloads, denied-storage/locks/draft limits and keyboard/responsive/no-JavaScript checks. Final four notebook screenshots are author-inspected; this reviewer did not view them or claim screen-reader/learner evidence.

Both candidate build logs match every corresponding build field in the final report. Preview retains 4 local accepted editions and 1 frozen runtime alongside 7,751 legacy ideas; the real empty-ledger release has 0 new-format lessons/runtimes/canonical URLs and no notebook page. Final binding covers 2,516 paths: `ea887f6127fba1c23ea8f5d1fb83f40e8f762be1e49459bddc9aee1f0fb1a309`. Preview output digest `545c67e774b082d3d95f00319a2b58615790cb640a2914bf6d06a2e8907d9f03`; empty-release edition-output digest `c18f7b08644fc2717fad271ede3c2b3b288449cd1a4812aeb7ba461f2783480d`. The latter is unchanged because generic copied assets are bound separately in deliveryFiles.

The cumulative report records 6,119 unrelated snapshot files preserved around the sole exact-preimage adapter replacement and 12 additions; candidate reports record 10,408 preview/10,409 release companion files preserved except explicit shell navigation. Independently compared every current delta source/style/test/checker/manifest/architecture/integration file against the successful-run hashes: all match. Author verification prose and this AI report are finalized afterward, explicitly excluded from claims of browser-executed source. Current author verification hash is bound below. The repair model/view/unit/native-test files also match the exact running snapshot, as checked previously.

The original-checkout/Wave heads, their preservation receipts and image observations in the author document remain attributed observations; this reviewer did not access or modify other worktrees. Empty ledger, unchanged frozen source/runtime/bundles and local-only scope remain explicit. No factual/rights/professional approval, human session, deployment or universally atomic storage transaction is inferred. The identified P2 is resolved and its failure history retained.

Final author-document binding:

| File | SHA-256 |
| --- | --- |
| docs/verification/universal-notebooks.md | `c8f0f4758d2cf4b548270a31513d66698bbe6d92872e7bdccd4573e2390570f7` |

Exact inspected execution records (under a9VOTz above):

| Record | SHA-256 |
| --- | --- |
| notebook-report.json | `7852de92a31f772d5de2d252b9bff8d63cafacc345e4d53e7e56cd161988152d` |
| notebook-freeze.log | `c043f66d8bd4f2a060e70a3f3af6e69a4342312af982933879b7de250e68f100` |
| notebook-offline.log | `86770db6be0451b1f8397a6d8d5b5c03a5bf0cb66ca130d9c7a8d47eb6b62f60` |
| notebook-native.log | `2e42b070c9a4646fe69b8a8933c7edab44b19d0e15bb7b92f6ba0cbbd53403e1` |
| notebook-preview.log | `3e4ed6bdd3da16e8a17c5f77e77abd43bf223c6bcfc29dddbd55540872961a09` |
| notebook-empty-release.log | `6e6a6ef679a4784eadc637b0bc3e11d8912b6375902f08ada7cd8e4876fea64c` |
| check-5.log | `3ebaf32ed14993c847f1cb36e541e0b4bd191e12ab19a447d3f39a489b85629a` |
| evidence-offline.log | `b50fce59494ddeea0fb79ce98962c61aa535860b3e4d3031d3f19581572340c5` |
| reading-offline.log | `3c6432ab287c3d97e27a8725062d3ff6039bda09b033992217a6a47b1f827273` |
| edition-offline.log | `06d836b45a22e245c1d49d3b327c4be198f8b92c07bdf9685d654a14bbff0dbc` |
