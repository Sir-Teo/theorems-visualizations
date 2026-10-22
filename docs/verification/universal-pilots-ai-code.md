# Independent AI engineering review — history and literature pilots

Date: October 22, 2026. Reviewer: separate Codex AI engineering reviewer (`code_review`); independent of the authoring agent for this review. This is a bounded source/DOM engineering inspection, not a human accessibility, subject expertise or learner observation.

Reviewed checkout: `/Users/teodev/.codex/worktrees/universal-pilots-integration/theorems-visualizations` at `d638f2ec39435b5ef04439f72d46f5be5da6f54c`.

| Pilot | Revision | Content digest | Artifact digest |
| --- | --- | --- | --- |
| History | 0.1.1 | `6a1aaf4c32b5dbf2603b4f3de469297a0a42abe0efbb2eff1d0026cc272043db` | `8f814e4b133f508639df0be35d30fac37b98960873ff10452c0eaf1f1cab035f` |
| Literature | 0.1.1 | `b562d61ebf5ca44e5e9981c44f24f2203b0b84ba1c5cd975d5a433d9e4084df0` | `70c9d0d487e0fc4d5f55a99a058ab20e2295794b2fd868c68a49257d53cf7385` |

## Methods and evidence

Read `explorations/contract.mjs`, `route-state.mjs`, `render.mjs`, `ui.mjs`, `style.css`; `scripts/build-explorations.mjs`, `check-exploration-integration.mjs`; all exploration test sources including UI and production navigation tests; the review-session protocol and integration checkpoint. Independently recomputed the content and artifact digests using the current builder inputs.

Executed `/tmp/atlas-ci-node22-20261020/node --test tests/explorations.test.mjs tests/explorations-integration.test.mjs`: **25 tests passed, zero failures/skips/cancellations**. This includes reproducibility in check-only mode; no previews were written. Ran an additional in-memory rendering comparison for the finding below. No browser launched, production build run, other worktree modified, or external service contacted.

## Finding: P2 — rendered collection labels are outside exact-artifact review binding

Location: `scripts/build-explorations.mjs:34-45`; `explorations/contract.mjs:22-23`; `explorations/render.mjs:73` (connections section).

The artifact digest covers the record content and six code-file hashes. The builder separately obtains collection titles from `loadRegistry()` and passes them into the renderer. These titles appear as reader-facing links but are absent from the digest. A later accepted collection-title edit can change a pilot’s HTML while its existing independent artifact receipts remain valid. This contradicts the current promise that receipts bind the exact rendered artifact.

Reproduction, performed without editing files: load each record and current code hashes; render it once with `{ [relatedCollectionId]: "Original title" }`, and again with the same map except `"CHANGED READER-FACING TITLE"`. Both pilots produce different HTML; their artifact digests remain identical. Because accepted-state validation only compares that digest, a prior passing receipt would remain current for the changed label.

Repair: include the used collection IDs/titles (resolved exactly as the renderer uses them) in the artifact digest, or put the displayed labels inside the reviewed record. Add a regression proving that changing a displayed external label changes the digest and causes accepted-state validation to reject the old receipt. Preserve the existing intentional exclusion of lifecycle/review additions and avoid binding irrelevant collections if unnecessary.

Result: **changes requested for the exact-artifact engineering contract**. Current drafts may remain local previews while repaired; this finding does not show any incorrect currently displayed title.

## Inspected behaviors with no additional actionable defect found

- Public state uses explicit finite selections and excludes notes/unknown keys. Hash parsing is bounded, future versions restore defaults, legacy URL semantics remain separate, and legacy verification cannot manufacture acceptance.
- Stored notes are scoped by identity/revision. Corrupt saved data is retained and exportable; failed erasure is described honestly; earlier revisions export separately. Reset targets only the current key. Selection changes invalidate the visible shared link, and delayed clipboard handlers check whether that link remains current before status/focus changes.
- Reader text and embedded JSON are escaped; author-controlled attribute identifiers/languages/URLs pass schema constraints before rendering. Interactive detail uses textContent. Static source forms distinguish quotation from editorial writing. No-JavaScript guides and transfer prompts are rendered in HTML.
- Withdrawal suppresses the former text/title/summary in workshop output while reserving identity; the UI explicitly explains that local withdrawal is not a public takedown system.
- Accepted lifecycle validation requires latest passing receipts for every required dimension and current revision/content/artifact digests, rejects author identity self-approval, and retains historical receipts. Evidence-path existence is checked on accepted builds. These are structural protections; code cannot establish reviewer competence or actual observation.
- Integration overlay is allowlisted and read-only in planning, refuses different destination bytes, limits copying to the explicit package and verifies pinned base files remain unchanged. Tests establish refusal of production paths/traversal and overwrites. The inspection does not independently audit all active Wave 5/6 worktree files.
- Semantic native controls, labels, headings, status regions, skip target, source language metadata, focus styles, light/dark colors and no-network-font layout are present. These attributes support further testing but do not prove screen-reader task success.

## Remaining evidence and limits

Actual screen-reader announcements, repeated changes, focus behavior with assistive technology, denied-storage recovery using assistive technology and source-language pronunciation are **not observed**. Formative learner tasks, confusion, assistance and transfer responses are **not observed**. UI/browser tests were read, not executed by this reviewer. Prior full-suite and production-route results in the integration checkpoint remain author-provided evidence; this review independently ran only the 25 offline tests above. No full accessibility pass, learning pass, professional rights clearance or independent acceptance is granted.

## Independent repair recheck

Rechecked the authoring agent's working-tree repair after the initial finding, before a new commit. `reviewArtifactDigest(record, codeHashes, collectionTitles)` now includes only the resolved labels actually displayed for that record, with the renderer's identical `title || id` fallback. The builder constructs that context once and uses the same function for validation and reported hashes. The new regression covers accepted-state rejection after label changes, stability for unrelated collections and identical fallback behavior. The original omission is **resolved**; no further actionable engineering defect found within this review scope.

Independently reran the offline exploration/integration suites: **26/26 passed**, including the new regression, zero failures/skips/cancellations. Builder `--check` also passed; no output files written.

Rechecked artifact digests (content digests unchanged):

- History 0.1.1: `87d5558bfd38472fe904c3bc37d413a53458cc6ecd0af5933e9659e3d2282899`.
- Literature 0.1.1: `182f56098fe2684c55f6e35d1e9e40c982fb7ebf74fe8be6fa720be464a2b3b2`.

Final engineering result: **passed for this bounded AI source/code inspection**, with the original finding and its repair retained above. This does not supply an `accessibility` or `learning` passing receipt. Actual screen-reader and learner observations remain not observed.

## Final packaging audit

The same independent engineering reviewer checked the packaged receipts after they were recorded: six total, three per pilot, with explicit AI roles and limits, existing report paths and current content/artifact digests. Both candidates remain `in-review` / `local-preview`. Simulated acceptance fails for exactly the missing accessibility and learning reviews. Builder `--check` passes and hashes remain unchanged. The manifest contains 53 files and the additional report-path allowlist is restricted to the three intended AI report names. No mismatch found; no browser launched, repository edits or additional full suite performed by the reviewer.

## Independent 0.1.2 requirement-change recheck

The owner supplied the user's later instruction, “just remove this check,” superseding the earlier proposal to leave human sessions open and the intermediate waiver proposal. Independently inspected the actual uncommitted implementation delta: no waiver mechanism exists. The global contract still mandates content and rights and continues to enforce every declared additional dimension. The pair removes accessibility/learning requirements while retaining history provenance and literature language; actual screen-reader and learner sessions are explicitly disclosed as not performed in both page and workshop index. Accepted UI wording becomes “Reviewed · local preview”; public-release rejection remains unchanged. Optional review-limit text is validated, escaped for HTML and included in the content digest.

Revision 0.1.2 retains 0.1.1 and 0.1.0 in previousRevisions, supporting the existing earlier-note export without changing the storage implementation. Historical AI receipts remain present and are stale for the new revision until fresh receipts are added. Coverage validation permits an explicit reviewed-local authored state while retaining accepted=false for production coverage; that state names its reviewed revision and does not grant publication.

Independently ran the exploration, integration and coverage offline suites: **45/45 passed**, zero failures/skips/cancellations. Builder `--check` passed. Read the updated UI revision-export regression without launching a browser. The new regression verifies mandatory content/rights, enforcement of explicitly declared accessibility/learning and limitation-text digest sensitivity.

Verified final 0.1.2 hashes:

| Pilot | Content digest | Artifact digest |
| --- | --- | --- |
| History | `f1ad96959e069d4f3896063e82bd8468eb3241749096e856a514631e721b72af` | `ffef0964100bbcdd7496cc798bea195a912d93375c4e2b892e4a656736e8dce4` |
| Literature | `f19e81195af44e606595a8d44c7ad16487e29bddbb30ed510e240c0c28416f95` | `2e550a22fd30abaf6a6f5b4d0795701c0e42927d4a7df1743a55b1291cd537be` |

**Bounded AI engineering review passes for this implementation delta; no actionable defect found.** No human observation, specialist credential or unrestricted rights clearance is inferred. Earlier report language describing human sessions as mandatory blockers applies to the superseded 0.1.1 requirements; under the user-authorized 0.1.2 contract those sessions are unperformed limitations, not acceptance requirements for this pair. Fresh exact-version independent AI receipts are still needed for all declared dimensions before changing this candidate from in-review to accepted. No production code edit, browser or other-chat action was performed by this reviewer.


# Independent AI engineering review: P03/P05 methods

Date: October 22, 2026. Reviewer: separate Codex AI engineering reviewer `code_review`, independent of the implementation author. Candidate: integration checkout diff since `e3b85eb1`, including untracked new method modules and JSON. This is source/pure-logic inspection, not a human screen-reader or learner session.

## Actionable findings

**P2: validate omitted-column metadata before rendering.** `explorations/method-models.mjs:26-43` validates measured-data provenance, selection, instruments and rows, but not `dataset.omittedColumns`. `explorations/method-views.mjs` unconditionally renders `d.omittedColumns.join(', ')` in attribution. Taking the actual agriculture record and replacing omittedColumns with undefined, null or a string makes `validateExploration()` return no errors and `renderExploration()` throw a TypeError. This fails the schema promise that malformed authored data receives useful diagnostics before rendering. Validate omittedColumns as an array of nonempty strings (and validate projection metadata if it is part of the declared data contract); add malformed cases. No currently authored value was found malformed.

Initial result: changes requested for this bounded engineering validation defect. Recheck after repair; the remaining findings below do not claim acceptance.

## Independently checked evidence

Read new `method-models.mjs`, `method-views.mjs`, `method-ui.mjs`; core contract/state/render/UI/builder deltas; four records; and `docs/pilots/research/soil-subset.py`. No repository file edited and no browser launched. The author was adding tests concurrently; no broad suite or production build was run by this reviewer at this initial stage. The builder is expected to reject old history/literature artifact receipts until those are rechecked.

Executed in-memory pure-logic checks with Node 22.23.3:

- Twelve normalize/serialize/parse round-trips across P03/P05 with valid defaults, malformed input types, malicious unknown IDs/numeric text and private notes. Public state round-trips and excludes private/unknown fields.
- Synthetic model returns 60 mm for upper .30, lower .15, depth .40 m; rejects blank, reversed fractions, zero depth and infinite input cases.
- Both complete editorial premise lists match their selected guides without missing links; messages remain explicit that matching a guide does not establish truth or moral obligation.

Independently reconstructed all plot 1 rows from the frozen local original CSV (not remote freshness evidence). SHA-256 `41308fba78d50d96152f40b85af43f45a9aed4d53e23568db483889c8ed744b1` matches the record. All **278** projected rows match exact source-row identities, eight columns, decimal strings and order: **102/93/83** for samples 000/010/050. The supplied reproduction script also passes. Repeated magnitudes are retained as distinct observations. Current magnitude range .0003377 to 17.3780083 MPa lies inside the fixed log-axis domain .0001 to 100 MPa. No fit, interpolation or connecting line is introduced.

## Source inspection with no further actionable defect found

New source and note text is escaped in HTML/SVG. Dynamic DOM text uses textContent except scatter HTML, whose strings are escaped and coordinates generated from validated finite numeric fields. IDs used in HTML attributes are constrained. Public states enumerate source sample/point or premise IDs and bounded numeric parameters; arbitrary text/private notes do not enter shared URLs. Existing notes identity/revision storage, corrupt-data export, reset semantics, earlier-version export and clipboard-race guard remain intact.

Argument controls are native buttons/selects; ordered-list actions restore focus after replacement. The premise bank is deliberately unshared; selected ordered premises are shared. Role changes do not silently exchange the other person's preferences. Plot source data is available without JavaScript in full tables; the log-axis and instrument mapping are explicit. Synthetic assumptions are visually and textually separated from observations and do not update raw points.

Builder artifact hashes now include all three new method modules, shared core modules and used related-collection labels. Thus their changes invalidate history/literature receipts too, as expected. Production runtime/content files are outside the inspected delta; no production acceptance or deployment is inferred. Capacity remains two unaccepted pilots; previously accepted history/literature need updated artifact receipts after shared code changes.

## Initial candidate digests

Copied from `/tmp/atlas-next-pair-digests.json` at review start; these are provisional and must be independently recomputed after repairs and final freeze:

| Pilot | Revision | Content digest | Artifact digest |
| --- | --- | --- | --- |
| History | 0.1.2 | `f1ad96959e069d4f3896063e82bd8468eb3241749096e856a514631e721b72af` | `9d0101eb73f6bb3f964aeeaae46c642129928658640872fe82e514e30c143b75` |
| Literature | 0.1.2 | `f19e81195af44e606595a8d44c7ad16487e29bddbb30ed510e240c0c28416f95` | `654876ddfa53635aa5cdd74e124a6d8d9eae693f6ba591ba395b39995cf2c186` |
| Philosophy | 0.1.0 | `0cabe58a8d547b9d8ec2e6cb7cfe1d58c5769bbd85bc8dc165c933dd24ea2218` | `afc348414c98512c9cc20e51435c18f5b9befafab75e132353cb41e73f892754` |
| Agriculture | 0.1.0 | `145a8e43d67936ce7b78fd1069ffd461d3952e9eda39e0307ed895e76c640513` | `85cdece4e9c9ad777527087877902e338228a7c9432bb38d2fbc79ac5df7e99e` |

## Limits

No actual screen-reader announcements, learner comprehension, empirical model applicability, scientific unit interpretation, specialist or legal expertise, or fresh remote source verification is claimed. Keyboard conclusions are engineering source observations only; browser behavior needs its own runtime evidence. The independent engineering review cannot substitute for the declared source/provenance/rights reviews.

## Independent final repair recheck

Inspected the repair: measured-data validation now rejects malformed omittedColumns before rendering and requires a nonempty, unique text projection array. Independently ran `node --test tests/exploration-methods.test.mjs` on Node 22.23.3: **6/6 passed**, zero failures/skips/cancellations. The new malformed-array regression includes the reported crash path. The original P2 is **resolved**. No further actionable engineering defect found within this review scope.

Read the current P03/P05 review-limit statements: they describe local review scope and do not claim professional specialist, screen-reader or learner sessions. Their updated text is included in the content hashes. Independently recomputed all nine bound code-file hashes, current record content digests and used collection-label context, then verified exact equality with the refreshed digest file. Current final hashes:

| Pilot | Revision | Content digest | Artifact digest |
| --- | --- | --- | --- |
| x-history-0001 | 0.1.2 | `f1ad96959e069d4f3896063e82bd8468eb3241749096e856a514631e721b72af` | `bea7f7e523e89e0c36dec0c0bcf66c681dc1ccde92c05cd48079b8e1ad193eef` |
| x-literature-0001 | 0.1.2 | `f19e81195af44e606595a8d44c7ad16487e29bddbb30ed510e240c0c28416f95` | `9597e55409651d2ab0af404cd7d5d9c9ef7b8598e1c21e82ff84a58d39ade0a3` |
| x-philosophy-0001 | 0.1.0 | `57c5cbf2d12cfce4e28395bbd2c929907572aba49c371c9000de03ee7c2c172e` | `7f69901c8cb45ba5cd589774c65ffe45bb92793d17e9ed18da08bbc6be454db3` |
| x-agriculture-0001 | 0.1.0 | `d0f0f916bbed98c6abd120f748e1a4edd05e9496bc39c6dc3b56600eccdbac6d` | `3d78688e111a8e8a24ec2d85bf8bc610f5c13b05f8f6ffeb9ebd00dd8765baed` |

Final result: **bounded independent AI engineering review passed** for these exact artifacts. This review supplies engineering evidence only; it does not grant content/provenance/rights approval or claim human observation. Browser tests, actual assistive-technology use and learner sessions were not performed by this reviewer. Prior P01/P02 source approvals must be independently rechecked against their changed shared-code artifact hashes before accepted-state validation can succeed. No repository edits or browser launches were performed by this reviewer.


## Readable chart final recheck

Independently inspected the final readability delta in method views/UI/style and its UI test assertions. The observed plot retains a 700px minimum SVG width within an overflow-x:auto container, preserving the authored 14px labels on narrow screens. The container is named, focusable, has a visible focus outline, and its static/dynamic captions explain horizontal scrolling. Replacing SVG content retains the parent scroll-region element. The premise bank now exposes its full selected text in a wrapping paragraph on initial application and selection changes; the action objection includes the full selected action label. Both insertions use textContent. No new actionable engineering defect found in this delta.

Recomputed current content and artifact hashes from all nine bound code files, record contents and used collection labels. Exact matches to the refreshed digest file; content digests remain unchanged.

| Pilot | Revision | Content digest | Artifact digest |
| --- | --- | --- | --- |
| x-history-0001 | 0.1.2 | `f1ad96959e069d4f3896063e82bd8468eb3241749096e856a514631e721b72af` | `c002df87d23466b1bcfafea21f67a2db7a294dc2b4118b7aaf701220210b8033` |
| x-literature-0001 | 0.1.2 | `f19e81195af44e606595a8d44c7ad16487e29bddbb30ed510e240c0c28416f95` | `04a0e3d355997fe2c55a8af73d3c707c2aefdb51915a83e7cf66403cc6609e95` |
| x-philosophy-0001 | 0.1.0 | `57c5cbf2d12cfce4e28395bbd2c929907572aba49c371c9000de03ee7c2c172e` | `b39627902223f674aa87adc4bcfbf9bd463d96e39db42fd074445e03452c74f1` |
| x-agriculture-0001 | 0.1.0 | `d0f0f916bbed98c6abd120f748e1a4edd05e9496bc39c6dc3b56600eccdbac6d` | `e4a5eeec558a552bed8bb38c81825de88dfc3e882f5c974e15cac10e21452e6b` |

**Final bounded AI engineering pass applies to these hashes**, superseding the immediately preceding artifact hashes. No browser launched, no tests redundantly run during the owner's browser suite, and no actual screen-reader or learner observation claimed. Runtime chart readability remains supported by the owner's separate visual/browser evidence rather than an invented observation by this reviewer.
