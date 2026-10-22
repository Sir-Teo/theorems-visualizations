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
