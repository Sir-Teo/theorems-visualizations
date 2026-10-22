# Universal pilots: additive integration package

**October 22, 2026 · six local previews; scoped AI reviews recorded; real-world and release gates open.**

The package is now applied on `codex/universal-pilots-integration` in the dedicated managed worktree. Read the [current checkpoint](../verification/universal-pilots-integration.md). The manifest contains 88 files, including five independent AI review roles and the whole-roadmap execution ledger and [classification review](../coverage/crosswalk-review.md); the master plan is reconciled separately with its exact accepted-base version archived.

The [package manifest](universal-pilots.json) names every file to carry. Four pilots are accepted for local preview under declared bounded AI review: P01/P02 at 0.1.2, P03/P05 at 0.1.0. Two further digital prototypes, P07/P08, remain in review. The [studio checkpoint](../verification/universal-pilots-studio.md) records the latest changes and exact hashes. The [author review](../verification/universal-pilots-review.md) is preserved; the first pair’s independent AI findings, repairs and initial six scoped receipts are recorded in the [historical integration checkpoint](../verification/universal-pilots-integration.md). The user removed the mandatory screen-reader and learner-session check for P01/P02. Neither session was performed; both are disclosed as limitations. Professional credentials and public-distribution clearance are not claimed.

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
4. Rebuild/check the previews and run the focused tests. Keep the pilots out of accepted production counts and preserve legacy note/progress stores.
5. Independently inspect exact artifact digests and required review receipts before editorial acceptance. The current source/language/prototype-reuse receipts identify separate AI reviewers and their limits. The independent code report does not supply an accessibility or learner pass.
6. Public loading, catalog links, canonical routes and release review are a later implemented change. Run affected production checks at that boundary.

## Publication isolation

The inspected Pages workflow assembles only `index.html`, `assets`, `content`, `data` and `.nojekyll`. Neither `labs/atlas/` nor `explorations/` is in that upload allowlist. This package does not alter the workflow or production home/router. The preview builder never invokes the production builder. The existing `npm test` glob will discover the new test files when they are integrated; it does not itself publish previews.

Keep that allowlist boundary explicit. `noindex` is not privacy. A host that publishes the repository root would expose preview/editorial files and needs a separate release decision. Local withdrawal hides the reader page and index summary but does not erase source JSON or Git history.

## Remaining review and publication gates

- History: retain the bounded AI content/provenance/reuse results; new claims beyond that corpus need appropriate further review.
- Literature: retain the bounded AI English comparison and reuse results. Original-language specialist approval is not claimed; the Koto recheck timed out and its prior reading is not a new receipt.
- Accessibility: automated contrast, keyboard and text-size checks remain. Actual screen-reader sessions were not performed and are optional follow-up for this pair after the user's removal of that gate.
- Learning: learner sessions were not performed and are optional follow-up for this pair. Do not infer learning efficacy from automated clicks.
- Rights/release: review the real distribution and any additional assets before publication.

The first pair no longer occupies the unaccepted slots. Carry this reviewed local package at the normal integration boundary without writing over active Wave chats. Public loading and release remain separate U3 work; the next method pilots follow their own briefs.

P03/P05 add source-linked argument reconstruction and measured-data inspection. Their specialist/human/publication gates remain explicit; see the current method checkpoint. P07/P08 now have reviewed digital structure and generated media, with physical/performer/access/learning and release gates still open. Both unaccepted slots are occupied; independent U1/U3 work can proceed. The active goal still covers the full master-plan execution ledger.
