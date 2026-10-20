# Combined checkpoint through 55c657d

The exact accepted Git snapshot `55c657d69652f0f7c162bdaca97b8f63e52ebe9f` is exported to `/tmp/atlas-checkpoint-55c657d`. It excludes ongoing music, colour and vault drafts. Generated workspace data is copied only from this accepted export.

- **1,582 default tests pass**, including all six UI tests, with no failures, cancellations or skips. Session 20248 exited 0; `/tmp/atlas-checkpoint-source684-tests.log`.
- **Strict build:** 6,684 written + 6,890 planned items in 450 chapters and 85 collections, with 0 errors or warnings. Home JSON is 112,816 bytes gzip, below 300,000. Session 61684 exited 0; `/tmp/atlas-checkpoint-source684-build.log`.
- **Full static:** 6,621 items, 0 errors or warnings. Session 79019 exited 0; `/tmp/atlas-checkpoint-source684-static.log`.
- **Changed-page sweep:** 92 distinct validated routes, 0 errors. Session 68866 exited 0; `/tmp/atlas-checkpoint-source684-routes.json` and `...-smoke.log`. This adds five accepted item routes to the preceding 87-route subset; it is not an all-route sweep.
- **Source queue in the export:** 152 pending = 833 initial + 3 added − 684 original resolved, across 2,260 scoped items. Session 77391 exited 0; `/tmp/atlas-checkpoint-source684-queue.log`. Explicit GIT_DIR/GIT_WORK_TREE provides only the checker’s historical comparison; the checked content comes from the export.
- **Cross-field inventory:** published shortfall 858; 53 of 64 non-math collections have fewer than 25 published prerequisite edges, and 28 complete syllabi remain below 25. Political science rises from 16 to 19 published edges and from 25 to 28 across its complete syllabus through the product rule for independent events, variance weak law and finite-partition conditional expectation. Session 92086 exited 0; `/tmp/atlas-checkpoint-source684-cross.log`.
- **Flagship proof curation:** 2/100 accepted, distinct from 102 historical control checks. Freshness/evidence verifier passes; `/tmp/atlas-checkpoint-source684-curation.log`. It performs no new source/proof review.

## Preserved failure and test correction

The first full run through 5d4efd2 had 1,581/1,582 passing tests: only the existing treemap resize-focus assertion failed. Its original log and other first-export logs remain `/tmp/atlas-checkpoint-source684-*-before-focus-fix.log`. The first 92-route sweep passed. An isolated focus rerun also passed; that alone was not treated as resolution.

A 12-iteration event trace (`...-focus-trace.mjs`/`.log`) reproduced four stale-node comparisons while redraws restored focus to the same named current chapter. The old locator could resolve a node immediately before the next redraw removed it, then compare that removed node with the correctly focused replacement. Commit 55c657d fixes the test: it observes removal of the old node and atomically checks the resized SVG’s width and the connected focused chapter’s exact label, before Enter opens that chapter. There is no added focus action and no production renderer/runtime change. All six UI tests pass separately against the built export (`...-ui-focus-fixed-export.log`), then the fresh exact 55c657d export is built before the complete successful 1,582-test rerun above. No passing result replaces the failed diagnostic log.

Since the preceding 6522f86 checkpoint, [exchange-proof curation](ladr-exchange-followup.md) adds the second flagship and 6 default mathematical groups; [finite juries/shared leader](polsci-jury-followup.md) closes two original flags with 5 groups; and [centipede/ultimatum](game-centipede-ultimatum-followup.md) closes two with 5 groups. Their 32 distinct full native viewport/theme groups pass (8 exchange, 12 jury, 12 game); 12 extra jury malformed-state/layout groups are recorded separately. Actual sources/prerequisite arguments, independent mathematics, all offered controls/replay and final screenshots support the acceptances. None of the active drafts is included.

Accepted SHA256:

```
data/index.json 551ef93a8636f675e8392804388314384c19b6c84db078775805728644626cf3
data/planned.json 39f2a5939d23d816b86f0327f765f7ba70337898bcef87cbb8b9097d12eb8d02
assets/js/graph.js 9a8850528193c87e97deba14a387bebff3215e9e67569c125cac265e061f94fc
assets/js/viz/core.js a6fa1753d9d9e8b9a05a7161fffc58dfd53b27002d9d393a3266aeb96515fe73
```

All 16 frozen retained-renderer experiment files still match their manifest. Historical timing/data identities remain unchanged; this new catalog identity is not substituted into an old benchmark. Source, cross-field, full-map 60 fps and 100-flagship proof-curation gates remain open. Automated audio remains 53 items/95 actions; no active music draft is counted. Wave 5 remains prepared and unstarted: 80 chapters, 1,031 new + 2 preserved items. Human review, subjective listening and user approval are not required. Nothing is pushed.
