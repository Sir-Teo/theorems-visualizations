# Domain navigation integration delta

This package follows the [notebook checkpoint](exploration-notebooks.md) at `83ad6c31a3982f3722d7b5550188c1d85668c087`. Its [manifest](domain-navigation.json) names exactly 15 additions and zero replacements. Original orientation records/code/receipts, accepted pilots, immutable bundles, production content and the earlier integration packages stay unchanged. Reconcile master-plan prose separately.

Run the cumulative rehearsal from this Git checkout:

```sh
node scripts/check-domain-navigation-integration.mjs \
  --repo /Users/teodev/.codex/worktrees/wave-six-expansion/theorems-visualizations \
  --base facab15e297c645d4826935f2c011a4cf367ee88 \
  --base-url http://teozeng.dev/theorems-visualizations/ --ui
```

The checker verifies every notebook-delta input against its exact historical commit, then invokes the unchanged notebook checker and its pinned predecessors. It applies only the navigation additions to the disposable accepted-base snapshot, checks the original orientation artifact, runs the focused offline suite, assembles fresh preview and empty-release outputs, and optionally runs domain/edition/notebook browser tests serially. All preexisting snapshot files are hash-compared. No active Wave checkout receives any change.

Node 22 and the existing local browser/test dependency are needed for `--ui`. The native suites observe the shared two-browser limit and never terminate another chat's browser. Use the historical canonical base only for this empty-ledger test; a future real release must verify its actual destination. This command is not deployment.

Build from a complete integrated source tree:

```sh
node scripts/build-domain-navigation.mjs --out /absolute/new/preview
```

Output must be a fresh directory outside the checkout. `navigation-build.json` binds source and delivery inputs, counts, generated file hashes and every explicit navigation replacement. Old build reports describe their predecessor stages; the new report records the final navigation changes. Original source orientations and exploration runtime bytes are not edited.

Preview offers 30 orientations, 85 distinct collection entrances and four accepted exploration identities. Real release mode retains zero orientations while its ledger is empty. Distribution approval, human/professional evidence and public rollout remain separate. See the [architecture](../architecture/domain-navigation.md), [verification](../verification/universal-domain-navigation.md), [AI code review](../verification/universal-domain-navigation-ai-code.md) and [AI content-scope review](../verification/universal-domain-navigation-ai-content.md).
