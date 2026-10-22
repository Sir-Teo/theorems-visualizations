# Legacy evidence integration package

This package adds an optional production evidence view while preserving the independent additive [universal pilot package](universal-pilots.md). Its [explicit manifest](evidence-view.json) pins accepted base `facab15e297c645d4826935f2c011a4cf367ee88`, the preimage hashes of exactly two production replacements and a narrow list of additions. It does not copy an active Wave checkout or use its draft HEAD as an accepted base.

## Rehearse without touching another checkout

From the universal integration checkout, with Node 22 and its existing browser dependency available:

```sh
node scripts/check-evidence-integration.mjs \
  --repo /Users/teodev/.codex/worktrees/wave-six-expansion/theorems-visualizations \
  --base facab15e297c645d4826935f2c011a4cf367ee88 \
  --ui
```

The command archives that exact Git commit to a new temporary directory, runs the unchanged additive pilot preflight, and builds the accepted baseline. It requires the manifest's accepted commit and exact production preimages, copies only the explicit evidence paths, then runs the integrated strict build, static checks, evidence/share-state tests and (with `--ui`) serial native evidence plus existing application tests. It never writes to the source repository, original checkout or another worktree's index.

Every existing generated data file must match. Only the existing `generated` timestamp in `index.json` and `home.json` is ignored; all other fields are compared. Only the evidence catalog/shard namespace may be added. Every old snapshot source file except the two named replacements must remain byte-identical. The returned report records source hashes, exact base, logs, snapshot and generated-data parity. Browser screenshots stay beside the temporary report. Omit `--ui` only for an explicitly scoped offline rehearsal, not to claim native verification.

This first empty-registry rehearsal deliberately requires exact old-shard parity. A future approved sidecar would add implementation provenance to its target shard and needs a separately reviewed integration-parity rule; do not relax the check broadly. Likewise, a later accepted production base requires explicit reconciliation of both replacements, a new pinned manifest and rerun. A preimage mismatch is a conflict to resolve, not permission to overwrite newer code.

## Review and integration boundary

The original 431-file additive manifest remains separate and still refuses production replacements. Its whole-roadmap/handoff docs explain the newer feature, but its rehearsal alone does not integrate this feature. `MASTER_PLAN.md` remains a manual reconciliation item. Use both packages together for this checkpoint; do not report an evidence UI pass from the additive preflight alone.

The real evidence registry is empty. No synthetic test source or receipt is installed in the public catalog. No new exploration is published and no lesson/acceptance count changes. The production changes and new source files live only in `codex/universal-pilots-integration`; no push, merge, PR or deployment is performed.

Before moving to a different accepted base, read that chat's current handoff and reconcile rather than copying whole production files. Preserve legacy routes/aliases, opaque queries, embeds, local storage, home budget and dependency output. Keep new-format local preview artifacts together and maintain their own exact review bindings. Rollback of this slice restores the two base files and removes its explicit additions; existing content and progress need no migration.

See the [implemented contract](../architecture/legacy-evidence.md), [verification record](../verification/universal-evidence.md), and [AI engineering report](../verification/universal-evidence-ai-code.md) for scope and evidence. Broader U3 public exploration loading/static routes and release decisions remain in the [execution queue](../master-plan-execution.md).
