# Coverage and review dashboard

**Local delivery · October 22, 2026.** The editorial dashboard is at `labs/atlas/coverage/`. It advances U3 by making the current inventories, independent work streams and review actions inspectable. It does not complete the master plan, publish the previews or assess what proportion of all human knowledge has been covered.

## Read the measures separately

The snapshot is pinned to **2026-10-22 21:17:51 UTC**. It deliberately remains stable while the other chats continue.

| Scope | Observed counts | Meaning |
| --- | --- | --- |
| Accepted production source | 7,751 written ideas; 5,823 planned IDs; 85 collections | Strict build from accepted commit `facab15e297c645d4826935f2c011a4cf367ee88`; existing source flags remain, and this is not a new peer-review claim |
| Domain navigation | 30 overviews; 85 primary homes; eight cross-listings | Primary homes partition production counts; cross-listings do not add ideas. Overviews are not introductory curricula |
| Pilot programme | Six authored, four locally accepted, eight briefs | History/literature/philosophy/agriculture have bounded local AI acceptance; craft/performance remain in review; law/care remain briefs |
| Sequence target | Six authored and four locally accepted out of 24 planned lessons | Follow-up proposals do not count as authored lessons |
| Frozen Wave 6 | 36 accepted; 239 reported author-verified; 782 outside those checkpoints; 1,057 total | Owner report and canonical accepted identities are distinct. Remaining items may include drafts, so they are not labeled unwritten |
| Visual ledger | 141 redesigned and verified; 12 existing scenes retained; 948 pending; 1,101 total | Separate owner ledger, including 34 items outside the accepted source. These changes are not thereby integrated into production |
| Classification queue | Eleven entries | Six FORD and five heritage decisions retain concrete source/topic/community actions |
| Human accessibility and learning evaluation | Not established | JSON null means unknown at atlas scale. It is neither zero nor an observed passing session |

The saved Wave progress field in the accepted commit says 26. Its actual accepted item IDs and the current owner ledger establish 36. The dashboard exposes this discrepancy without rewriting either ledger. Review ages use the **latest passed current AI receipt** at the snapshot date, not the oldest required review, current wall-clock age or comprehensive freshness. A later `changes-requested` receipt reopens the relevant requirement. Required-review status remains separate from receipt age.

## What the three views support

- **Coverage:** accepted production and planned syllabus by primary domain, unique pilot totals, researched overviews and recorded gaps. The domain filter changes all affected cards and source rows together. Pilot totals deduplicate IDs even when a pilot appears in several domain rows.
- **Work streams:** distinct Wave and visual-review denominators, frozen chapter checkpoints, unavailable human evidence and the 26/36 discrepancy. This tab keeps its own domain selection.
- **Review queue:** eight pilot briefs with current implementation/review state, limitations and next action; eleven classification decisions with source/community actions; the 24-lesson target. Pilot-state and classification filters are independent.

Every data-backed card retains the shared source inspector and Copy data action. Copied chart data contains the scoped underlying evidence rows, which may be more detailed than the plotted aggregate. Evidence flow records pinned commits, source-file hashes, transformations and limits. Tables provide search, sorting, pagination and internal horizontal scrolling on small screens.

## Sources and reproducibility

- [inputs.json](inputs.json): bounded identities, ledger claims, local exact-review projections and source receipts. No chapter statement, private learner note or restricted source body is copied here.
- [model.json](model.json): deterministic joins, partitions and actionable queue rows.
- [app snapshot](../../../coverage-dashboard/src/data.json): reviewed queries, provenance, filters and stable app identity.
- [build-source.json](build-source.json): current authored-source hashes bound to the compiled HTML and content-addressed JSON sidecar.
- [Data review](data-review.md) and [engineering review](code-review.md): independent AI review, findings, repairs and exact scope.

Pinned independent ledgers:

- Expansion: `20ca725d875ffabac8911bbf6a160379673ac178`.
- Visual redesign: `fe3fb93379c4520a5f588c8794d332ad4b3ee97f`.

Production catalogs are Git-ignored. Capture therefore exports the explicit accepted commit to a temporary directory and runs its strict builder there. Only the nondeterministic generated timestamp in `data/index.json` is normalized to the explicit snapshot time before serialization and hashing. All item and collection fields remain those of the accepted build. Repeating the capture with identical pinned inputs reproduced the complete evidence file.

Local refresh first checks source hashes and reruns the existing pilot and overview artifact validators. New content, changed review receipts or stale rendered pages cannot silently inherit the earlier dashboard's acceptance counts. A changed source requires a new capture and appropriate review. Future new collections also require an explicit coverage-baseline decision; the model currently requires 85 collections and 30 domains.

## Refresh or rebuild locally

Run from the universal integration checkout. Use a supported Node executable; the current verification used Node 22. The existing production server can serve this separate route.

```sh
node scripts/capture-coverage-dashboard.mjs \
  --expansion-repo /Users/teodev/.codex/worktrees/wave-six-expansion/theorems-visualizations \
  --redesign-repo /Users/teodev/.codex/worktrees/wave-visual-redesign/theorems-visualizations \
  --accepted-base facab15e297c645d4826935f2c011a4cf367ee88 \
  --expansion-ref 20ca725d875ffabac8911bbf6a160379673ac178 \
  --redesign-ref fe3fb93379c4520a5f588c8794d332ad4b3ee97f \
  --as-of 2026-10-22T21:17:51Z
node scripts/build-coverage-dashboard-data.mjs
node scripts/build-coverage-dashboard.mjs --build-tool /absolute/installed/data-analytics/scripts/data-app.mjs
node --test tests/coverage-dashboard.test.mjs
node --test tests/coverage-dashboard-ui.test.mjs
```

For a new snapshot, first read the owning continuation handoff and select its accepted base explicitly. Set the intended UTC time and pin each other ledger commit; omitting either ledger ref captures that repository's HEAD once. Later draft commits do not automatically become an accepted base. `localCommit` records capture provenance and may change after an integration commit even when local evidence bytes are identical.

The data command preserves the app ID and lifecycle status. During edits set `buildStatus` to `updating`; set it to `complete` after the requested dashboard work finishes, then rebuild. The build command uses the installed Data app compiler, verifies the complete split bundle, stages only its owned files under `labs/atlas/coverage/`, and removes only the prior verified sidecar named by its manifest. Without `--build-tool`, the command only checks existing source/model/bundle bindings and needs no plugin or build dependencies.

The copied Data runtime remains unchanged and its `AGENTS.md` governs future edits. Author dashboard content under `coverage-dashboard/src/content/` and data under `src/data.json`; do not fork or disable the protected renderer/chrome. The current production upload allowlist excludes the dashboard, pilots and orientations. No deployment, sharing change or recurring refresh job was created.

## Verification and remaining work

Twelve focused offline tests cover unique identities and joins, disjoint inventories, Wave/visual partitioning, later negative reviews, review-age semantics, unknown observations, classification actions, stale source refusal and bundle integrity. Five serialized browser tests cover scoped copies, filters and reset, independent tab state, empty search, source provenance, actual SVG charts, 320px light/dark layouts and project-prefix navigation. The author inspected rendered desktop and phone screenshots. These are engineering checks, not screen-reader or learner observations.

The full additive integration rehearsal passed on accepted base `facab15e297c645d4826935f2c011a4cf367ee88`: 399 package files, all 5,552 accepted-base files byte-preserved. It ran 101 offline tests, 21 pilot browser tests, five orientation browser tests and five dashboard browser tests. The inspectable full report is `/var/folders/29/bzg0zx0d7jjbyf60_3cjch440000gn/T/atlas-integration-Ie26mM/report.json`. Original-checkout preservation also rechecked all 3,222 baseline files; only the previously authorized handoff pointer differs, and all three Wave assignment payload hashes remain unchanged. Source checks do not re-review the restricted BIGHIST 3.5 artifact or source bodies.

Still open: actual human/professional/physical evidence where required, public release and loading, 24 accepted pilot lessons, three cross-method journeys, domain introductory curricula and U4–U5 stewardship. The active master-plan goal remains open.
