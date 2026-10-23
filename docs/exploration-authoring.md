# Authoring and reviewing new exploration methods

> **User-directed continuation · 2026-10-23:** Independent AI, professional, engineering, practitioner, learner and screen-reader reviews are no longer prerequisites for local authoring, acceptance or integration preparation anywhere in this roadmap. Continue with source-backed authoring, automated checks and explicit author-verification records. Retain prior reviews as history and unperformed observations as limitations; do not claim they passed. This direction supersedes conflicting review gates below and in earlier briefs. The two-draft limit is a batch-size preference, not a reason to wait for optional reviewers. Public distribution and real-world evidence remain separate from local completion. See [the current verification record](verification/universal-author-continuation.md).


Read [the master-plan handoff](master-plan-handoff.md) first. This guide supplements [AUTHORING.md](../AUTHORING.md) for the new exploration namespace. It does not change frozen waves, numeric visualization contracts or existing content acceptance.

## Start with the reader task

Choose one bounded question, audience and method. State what the learner should be able to explain or do and what the exploration cannot establish. Use the coverage registry to locate a genuine gap; do not turn every classification term into a lesson.

Research the exact text, data, object or practice. Record the edition/version, language, locator, access status, source limits, rights and qualified review needs. Discovery metadata is not a read receipt. An access stop is preserved; do not recover a denied body through a mirror.

Before authoring a new method, specify its payload and reader states and add meaningful validation. The current renderer supports source comparison, annotation, argument maps and measured data. Unsupported methods must fail explicitly rather than render a generic numeric control.

## Use canonical data

Edit `explorations/*.json`, the [manifest](../explorations/manifest.json) and supporting method code. Do not hand-edit generated `labs/atlas/*/index.html`.

Use stable source/passage IDs. Mark quotation, paraphrase and original explanation distinctly. Recalculate a passage digest only after checking the altered text against its selected source. Record what formatting changed. Keep source editions and contemporary hosting assets separate in rights decisions.

A candidate collection, external resource or cross-listing is not another authored idea. Use justified collection routes until exact accepted-item links are reviewed. Keep semantic relations outside the prerequisite graph.

## Preserve privacy and access

Render meaningful text before JavaScript runs. Controls need keyboard operation, visible focus and a single-pointer alternative to dragging. Use language tags, labels, non-color distinctions and equivalent descriptions. Media must be optional when the learning task permits; where the perceptual task itself cannot be equivalent, state the alternative's limits.

Keep private notes out of URL parameters and public analytics. Scope saved progress by schema, identity and revision. Never overwrite legacy atlas progress keys or silently migrate older notes. Test blocked storage and malformed saved links.

When incrementing a content revision, list known `previousRevisions` so readers can explicitly export earlier notes. Do not silently import them as current answers. Unreadable current notes must remain untouched and exportable; reset must report whether stored erasure actually succeeded. Plain page anchors must not be parsed as activity state.

## Check and accept an exact version

Independent reviews are optional for local work under the 23 October user instruction. Inspect the actual source/model claims and affected interface; repair failures and record the checks that really ran. Do not populate professional, learner, physical-session or screen-reader fields with assumed passes.

Use `scripts/check-local-continuation.mjs` for read-only source/model checks. After the author’s content and affected native checks, record a fresh receipt and run:

```sh
node scripts/check-local-continuation.mjs --record --date YYYY-MM-DD --evidence docs/verification/NEW-RECEIPT.md
```

The command preserves already-valid author receipts and historical independent reviews. It binds changed records to their content/runtime and regenerates preview/orientation links. It does not grant publication or certify real-world observations.

Before freezing a changed artifact, increment its revision and retain earlier revision identities. `freeze-exploration-editions.mjs` preserves immutable old bundles and runtime files; it rejects changed content/runtime under an existing revision. Never edit a receipt already retained in a frozen edition. Use another receipt for later work.

## Validate and hand off

```sh
node scripts/validate-coverage.mjs
node scripts/build-explorations.mjs
node scripts/build-explorations.mjs --check
node --test tests/coverage-registry.test.mjs tests/explorations.test.mjs tests/explorations-ui.test.mjs
node --test tests/explorations-integration.test.mjs tests/exploration-methods.test.mjs
```

Inspect desktop/phone pixels in both themes, native input, no-JavaScript reading, source links, saved-state restoration and local export/reset. Run additional checks only for changed behavior or unresolved risks.

Keep at most two draft/in-review new-format explorations. P01/P02/P03/P05 now pass their declared local review requirements and no longer occupy those slots. P07/P08 currently occupy both slots. Keep the same two-item limit for subsequent methods. Prepare the next briefs and sources without accumulating unreviewed lesson drafts.

Integrate only from the latest accepted production base at the normal handoff boundary. Carry source files, builder, tests and generated previews together; never overwrite an active worktree or copy its entire old checkout into current progress. Public release needs a separate implemented contract and authorization.

Use the [integration package](integration/universal-pilots.md) for a pinned, temporary-snapshot rehearsal. It refuses differing destination files and deliberately excludes automatic replacement of the master plan or production files.

## Method-specific cautions established by the pilots

Argument premises must distinguish interpretations, empirical assumptions and normative additions. Keep source quotations and stipulated scenario facts separate. Structural guidance may identify omitted editorial premises but must not grade moral truth. Native move controls need predictable focus after re-render, and long select options need complete wrapping readouts.

For measured data, preserve the actual observation key and decimal strings. Do not deduplicate by an x coordinate or silently interpolate a relation the source does not define. Pin the source file and verify the complete selected projection; document selection, transformations, exclusions and source-unit uncertainty. Keep assumed model parameters independent of observations. Provide raw tables and a readable, named chart region with keyboard access on narrow screens.

Shared-code changes invalidate all affected artifact reviews even when source content is unchanged. Prepare and inspect candidate renderings, obtain fresh independent equivalence/source checks, then rebuild the accepted package. A stale receipt must continue to fail the builder; it is not current acceptance while the recheck is pending. Preserve the earlier accepted content and notes throughout that maintenance.
