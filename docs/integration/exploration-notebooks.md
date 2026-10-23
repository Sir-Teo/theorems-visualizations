# Notebook integration delta

This package follows the [edition package](exploration-editions.md) at `7fd688a48bb026582fae1d24d86536b29ee4038d`. The manifest names one replacement, `scripts/exploration-editions.mjs`, with its exact preimage SHA-256. All other package paths are additions. Production content/router/build, original exploration source/runtime, immutable bundles and existing review receipts are unchanged. Reconcile master-plan prose separately.

Use the current cumulative checker for the notebook candidate:

```sh
node scripts/check-notebook-integration.mjs \
  --repo /Users/teodev/.codex/worktrees/wave-six-expansion/theorems-visualizations \
  --base facab15e297c645d4826935f2c011a4cf367ee88 \
  --base-url http://teozeng.dev/theorems-visualizations/ --ui
```

The checker reads the exact predecessor commit from this repository’s Git object database, archives it into a disposable directory, and invokes its unchanged edition checker. That replays the original pilot, evidence, reading and edition packages against the explicit accepted base. It then applies this delta to the resulting snapshot, verifies the original adapter preimage, runs frozen-source and offline checks, builds fresh preview/empty-release candidates and optionally runs serial edition/notebook browser checks. All unrelated snapshot files are hash-compared. No active checkout receives the delta. The earlier edition-only checker and 19-file manifest describe their historical commit; use this cumulative checker at the notebook checkpoint, not a mixture of current source and the historical manifest.

Node 22 and the existing local browser/test dependency are required for `--ui`. Native suites wait for one of the two shared browser lanes; they never stop another chat’s browser. The verified destination before real release may differ from the historical Pages metadata used for this empty-ledger test. No release or deployment occurs here.

From the full integrated source tree, the normal builder continues to work:

```sh
node scripts/build-exploration-editions.mjs --out /absolute/new/preview
```

The generated `edition-build.json` binds the new note manager and all delivered dependencies. The phrase “no note migration” in its assembly scope means the build itself does not access or migrate a reader’s private store; migration is only an explicit action inside the new candidate UI. The real release ledger remains empty. See the [architecture](../architecture/exploration-notebooks.md) and [verification checkpoint](../verification/universal-notebooks.md).
