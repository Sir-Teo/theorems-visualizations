# Static reading integration

This package follows the additive pilot package and the explicit [legacy evidence delta](evidence-view.md). Its [manifest](static-reading.json) contains only additions. Existing production source files, workflows, local pilot artifacts and dashboard inputs remain unchanged.

Run from the universal integration checkout with Node 22:

```sh
node scripts/check-static-integration.mjs \
  --repo /Users/teodev/.codex/worktrees/wave-six-expansion/theorems-visualizations \
  --base facab15e297c645d4826935f2c011a4cf367ee88 \
  --base-url http://teozeng.dev/theorems-visualizations/ \
  --ui
```

This invokes the preceding pinned evidence rehearsal in a disposable Git archive, copies only the explicit static-reading additions, runs focused tests, builds a complete new candidate outside the snapshot and executes serial native/whole-site link checks. It checks every preexisting snapshot file afterward. Neither the original checkout nor active Wave checkouts/indexes are written. `MASTER_PLAN.md` remains manually reconciled.

The returned `reading-report.json` links earlier preflight results, build facts, exact addition hashes, logs and the candidate path. Native screenshots sit beside it. The generated site is not committed and no deployment is performed.

For direct local assembly after a strict production build:

```sh
node scripts/build-static-ideas.mjs --out /absolute/new/candidate-directory
```

That preview has no canonical URL/sitemap and uses noindex. Supply a verified explicit `--base-url` for a release candidate. The output must not exist and must be outside the source checkout; choose a fresh directory after a failed/interrupted candidate build. The new output contains the complete existing interactive companion, not just loose pages. A static file server can serve it at a root or project prefix without rewrite rules.

The frozen roster/data contract rejects active draft inventories and stale shards. A future accepted content base or approved evidence record requires explicit reconciliation of the pin and related review. No copying of a newer working tree's whole state is authorized. The current Pages workflow is intentionally unchanged: rollout to its assembly step remains a separately reviewed and authorized release operation.

See [the architecture contract](../architecture/static-reading.md), [verification record](../verification/universal-static-ideas.md) and [independent AI engineering report](../verification/universal-static-ideas-ai-code.md). Static reading adds navigation and no-JavaScript access, not new lessons, rights approvals, professional credentials or human-observation receipts.
