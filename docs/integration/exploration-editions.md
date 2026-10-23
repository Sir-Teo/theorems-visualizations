# Exploration edition integration

This additive package follows the [static reading package](static-reading.md). Its explicit manifest includes the edition freezer, archive, release ledger, delivery adapter/builder, focused tests and documentation. It replaces no production, pilot, review-bound or Wave source file. Master-plan prose is manually reconciled.

Build a complete local preview from the accepted integration checkout with Node 22:

```sh
node scripts/freeze-exploration-editions.mjs --check
node scripts/build-exploration-editions.mjs --out /absolute/new/preview
```

The predecessor verifies the frozen 7,751-item legacy inventory and generated data, then the edition stage adds four local accepted previews and an Explore navigation link. Before/after hashes verify every preexisting candidate file except that explicit shell change (and sitemap augmentation when an approved release has new URLs). Draft/local source directories and private review archives are excluded. The output is always new and outside the source checkout.

Release-mode assembly requires `--mode release --base-url <verified-base>`. The real ledger is empty, so it emits zero new-format lessons. Tests use synthetic approval/withdrawal fixtures; those are not release evidence. Public distribution and host replacement/cache behavior require their actual review and authorization.

The generated `edition-build.json` records accepted legacy base, exact bundles, delivery code/companion inventory, output digest, current/retained counts, preservation and mode. The [architecture](../architecture/exploration-editions.md) explains identity, state, source review, publication and withdrawal limits.

For a pinned disposable rehearsal of all preceding packages plus these 19 additions:

```sh
node scripts/check-edition-integration.mjs \
  --repo /Users/teodev/.codex/worktrees/wave-six-expansion/theorems-visualizations \
  --base facab15e297c645d4826935f2c011a4cf367ee88 \
  --base-url http://teozeng.dev/theorems-visualizations/ --ui
```

The current base argument comes from the existing accepted checkpoint and previously inspected Pages metadata; it does not claim these new routes are live. Revalidate the destination before any actual release. The checker first rehearses the legacy reading/evidence and original pilot packages, then runs the edition freeze/offline checks, assembles both a local preview and an empty-ledger release candidate, verifies draft/runtime/sitemap exclusion, and optionally runs serial native checks. It compares every preexisting snapshot file afterward and writes `edition-report.json`. Neither active Wave checkout is modified. Final execution evidence is in [the checkpoint](../verification/universal-exploration-editions.md).
