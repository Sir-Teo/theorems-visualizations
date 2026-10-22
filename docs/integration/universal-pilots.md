# Universal pilots: additive integration package

**October 22, 2026 · local engineering integration complete; independent acceptance pending.**

The package is now applied on `codex/universal-pilots-integration` in the dedicated managed worktree. Read the [current checkpoint](../verification/universal-pilots-integration.md). The manifest contains 50 files, including four integration-specific additions; the master plan is reconciled separately with its exact accepted-base version archived.

The [package manifest](universal-pilots.json) names every file to carry. Both pilots are revision 0.1.1 drafts. The review and repairs are recorded in [the review receipt](../verification/universal-pilots-review.md). Independent specialist, screen-reader, learner and distribution reviews remain open; no fabricated acceptance receipt is included.

## Rehearse without modifying an active checkout

```sh
node scripts/check-exploration-integration.mjs \
  --repo /Users/teodev/.codex/worktrees/wave-six-expansion/theorems-visualizations \
  --base facab15e297c645d4826935f2c011a4cf367ee88 --ui
```

This base is the accepted Wave 6 checkpoint named in the content continuation handoff at review time. Later author work is not automatically an accepted base. Refresh the choice from the owning chat's ledger before a real integration; use a pinned commit, not a moving worktree copy.

The command exports that commit with `git archive` into a new temporary directory, plans the explicit overlay, refuses differing destination files, then runs the coverage validator, reproducibility check and focused tests there. `--ui` adds one browser, an ephemeral local server and a temporary dependency symlink to this checkout's installed `node_modules`. It does not install packages. All checks close their browser/server. The report lists every package-file hash and confirms the original snapshot files retained their bytes. No source checkout, Git index or active worktree is changed.

Rehearsals against later expansion/redesign commits are compatibility observations only; they cannot accept those commits' content. The temporary snapshot and logs remain inspectable at the path printed by the command. A differing file requires a reviewed merge and a new rehearsal, never an automatic overwrite.

## Actual integration boundary

1. Use the agreed accepted base and current ownership handoffs. Review the exact package hashes and any subsequent differences.
2. Bring over the manifest's additive files. Review each conflict rather than copying whole directories over an active checkout.
3. Reconcile **MASTER_PLAN.md manually**: add the broader vision/roadmap and handoff link while preserving current production facts. The old root master plan is intentionally excluded from automatic copying. README, existing content, assets, wave plans, ledgers and build/deploy workflows are also excluded.
4. Rebuild/check the previews and run the focused tests. Keep the pair out of accepted production counts and preserve legacy note/progress stores.
5. Independently inspect exact artifact digests and required review receipts before editorial acceptance. The current review is by the authoring agent, not an independent specialist or learner.
6. Public loading, catalog links, canonical routes and release review are a later implemented change. Run affected production checks at that boundary.

## Publication isolation

The inspected Pages workflow assembles only `index.html`, `assets`, `content`, `data` and `.nojekyll`. Neither `labs/atlas/` nor `explorations/` is in that upload allowlist. This package does not alter the workflow or production home/router. The preview builder never invokes the production builder. The existing `npm test` glob will discover the new test files when they are integrated; it does not itself publish previews.

Keep that allowlist boundary explicit. `noindex` is not privacy. A host that publishes the repository root would expose preview/editorial files and needs a separate release decision. Local withdrawal hides the reader page and index summary but does not erase source JSON or Git history.

## Review tasks still requiring people

- History: verify the bounded source criticism, conditionality, dependence and transfer rubric.
- Literature: check the display witness/edition labels, English comparisons and original-language boundaries; the Koto recheck timed out, and its prior reading is not a new receipt.
- Accessibility: complete actual screen-reader tasks and report observed behavior. Automated contrast, keyboard and text-size checks are partial evidence.
- Learning: observe readers doing the tasks and transferring the distinction; do not infer learning from successful automated clicks.
- Rights/release: review the real distribution and any additional assets before publication.

Both draft slots remain occupied. Next action: review the revised versions and record concrete findings, then reconcile the package at the normal integration boundary.
