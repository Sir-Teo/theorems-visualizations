# Additive journey research package

This package prepares the three U3 routes in [the journey plans](../journeys/README.md). It contains no renderer, new lesson, release decision or accepted journey. The [manifest](journey-planning.json) has 12 explicit additions, no replacements, and predecessor `7ad07b261e300effde6f900ce38814b1f6474d20`.

Apply only those additions to that predecessor in a disposable source archive. Reject path collisions or non-regular files. Run the journey check and its eight test groups there, and compare every preexisting source-file hash. Keep the research checkpoint separate from earlier runtime packages and their frozen inputs. The previous navigation preview supplies a read-only link-resolution check for the ten target paths; it is not rebuilt or edited by this package.

The four roadmap documents—`MASTER_PLAN.md`, `docs/master-plan-execution.md`, `docs/master-plan-handoff.md` and `docs/architecture/universal-schema-urls.md`—require manual reconciliation. They are not copied over another chat’s progress or added to an old frozen manifest.

```sh
node scripts/check-journey-plans.mjs
node --test tests/journey-plans.test.mjs
```

The validator binds the original accepted legacy snapshot, selected content projections, retained edition bundles/runtime/reviews, title/path/prerequisite metadata and retained provider-source receipts. It rejects unaccepted targets, invented reading/gap links, stopped-source reuse, and research masquerading as acceptance. Its scope is trusted repository planning files, not a general public-input parser or semantic proof of the prose.

The next integration slice needs a candidate catalog/reader composed after domain navigation. Its targets must come from the actual delivered inventory: a reviewed local edition may be absent from a release, and withdrawn payloads must remain absent. The legal gap must not become a working lesson link. Root/project-prefix navigation, no-JavaScript access, keyboard/narrow-layout behavior, release exclusions and preservation need their own evidence once that runtime exists. See the [checkpoint](../verification/universal-journey-planning.md).
