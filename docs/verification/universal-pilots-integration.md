# History and literature integration checkpoint

**October 22, 2026 · local integration and the revised review scope are complete.**

Worktree: `/Users/teodev/.codex/worktrees/universal-pilots-integration/theorems-visualizations`.
Branch: `codex/universal-pilots-integration`.
Accepted production base: `facab15e297c645d4826935f2c011a4cf367ee88`. The active Wave 5/6 and redesign worktrees remain separate and continue independently.

## User decision and current state

After the goal was blocked on screen-reader and learner observations, the user said **“skip this”**, then clarified **“just remove this check.”** The mandatory human-session gate is therefore removed for this pair. No waiver system, fabricated observations or passing human-review receipts were added. The optional session protocol remains available for future use.

Both pilots are now **revision 0.1.2**, `status: accepted`, `publication: local-preview`, under these declared requirements:

| Pilot | Required independent AI reviews | Unperformed sessions disclosed |
| --- | --- | --- |
| History | Content, provenance, bounded text-only prototype rights | Screen-reader and learner sessions |
| Literature | Content, English-language comparison / Japanese witness limits, bounded text-only prototype rights | Screen-reader and learner sessions |

The contract still requires content and rights for every exploration and enforces every additional dimension in its declared `reviewRequirements`. History retains provenance; literature retains language. Other briefs retain their own professional, source and asset requirements. Automated access, keyboard, contrast, enlarged-text, privacy and state checks remain in the suite.

The page and workshop index display the human-session limitation. These outcomes establish the declared local review scope, not professional credentials, learning efficacy, universal accessibility or permission to publish. In the planning registry, `reviewed-local`, `localReviewStatus: accepted` and `reviewedRevision: 0.1.2` capture this result; its production `accepted` flag remains false. Neither pilot contributes to Wave 5/6 or public-catalog counts.

## Independent evidence

The separate [history reviewer](universal-pilots-ai-history.md), [literature/language reviewer](universal-pilots-ai-literature.md) and [engineering reviewer](universal-pilots-ai-code.md) rechecked the 0.1.2 delta. Each report preserves earlier findings and explicitly binds its final conclusion to the current digests. Six current scoped AI receipts are appended after the six historical 0.1.1 receipts. No historical receipt was overwritten.

The selected passages, sources, claims and task guides are unchanged. Revision 0.1.2 records the changed review requirements and reader-visible limitation. Earlier 0.1.0/0.1.1 note stores remain untouched and explicitly exportable; they are not silently imported as new-revision answers.

| Pilot | Content digest | Artifact digest |
| --- | --- | --- |
| History | `f1ad96959e069d4f3896063e82bd8468eb3241749096e856a514631e721b72af` | `ffef0964100bbcdd7496cc798bea195a912d93375c4e2b892e4a656736e8dce4` |
| Literature | `f19e81195af44e606595a8d44c7ad16487e29bddbb30ed510e240c0c28416f95` | `2e550a22fd30abaf6a6f5b4d0795701c0e42927d4a7df1743a55b1291cd537be` |

Earlier review findings remain resolved: the central NARA reuse plans match the selected short quotations, and the artifact digest includes the actual displayed related-collection labels. The Koto retrieval stop remains binding; no fresh Japanese-source verification or specialist credential is claimed.

## Verification

- **55/55 focused tests pass** on Node 22.23.3: coverage registry, exploration contract/state/rendering, overlay safety and browser checks. New checks retain mandatory content/rights and enforce additional declared dimensions. Current records validate as accepted with exact receipts; removing a required review or changing a bound artifact still fails.
- The browser checks cover both themes at 320/1280 widths, keyboard controls, no-JavaScript reading, notes/share/reset, blocked storage, source anchors, clipboard races and enlarged text. The upgrade check now explicitly exercises retained **0.1.1 notes**. Narrow light-history and dark-literature captures were inspected for layout; no human screen-reader or learner session is inferred.
- Actual atlas navigation checks pass for five collection round trips (TECH, BIGHIST, POLSCI, LING, ART) and two home round trips, with notes retained and no browser errors. The pilot IDs remain absent from the production home catalog.
- The manifest contains **53 additive files**. Pinned-base overlay verification preserves all 5,552 original snapshot files and runs coverage validation, reproducible preview checks and offline tests. `MASTER_PLAN.md` is reconciled separately and its old bytes are archived exactly.

Current logs are `/tmp/atlas-remove-human-gate-focused.log`, `/tmp/atlas-remove-human-gate-production.log`, `/tmp/atlas-remove-human-gate-integration.log` and `/tmp/atlas-remove-human-gate-preservation.json`. The earlier 3,510-test full-repository checkpoint and strict/static builds remain historical evidence in `/tmp/atlas-integration-goal-20261022/`; they are not claimed as new runs. Current changes are isolated to the pilot package and strategic documentation; affected verification was rerun.

## Preservation and integration boundary

Against the accepted Git base, `MASTER_PLAN.md` is the only modified pre-existing file. Its exact prior bytes remain in [the baseline archive](../integration/universal-pilots-baseline-plan.md); all production files are unchanged. The original root's 3,222-file baseline differs only in the earlier handoff pointer. No writes or messages were sent to either active Wave chat. Expansion, redesign and shipping retain the frozen chapter payload hash `3a53e3ae4a663e1298f411760dd9b633b6e77a8511b50384928858cb427251af` while their branches may advance independently.

The local preview remains at `http://127.0.0.1:64014/labs/atlas/`. The Pages upload allowlist and public home/catalog/router are unchanged. No push, PR, merge or deployment is part of this local integration. Public loading/routes and release-specific territory/asset/withdrawal review remain separate U3 work.

P01/P02 no longer occupy the two unaccepted slots. The next bounded methods can proceed through their own briefs. Optional future observations can inform improvements, but the removed human-session check must not reappear as a blocker for this completed local integration.

## Reproduce

```sh
node scripts/validate-coverage.mjs
node scripts/build-explorations.mjs --check
node --test --test-concurrency=1 tests/coverage-registry.test.mjs tests/explorations.test.mjs tests/explorations-integration.test.mjs tests/explorations-ui.test.mjs
node tests/explorations-production.mjs
```

Use `/tmp/atlas-ci-node22-20261020/node` in this environment and the [integration procedure](../integration/universal-pilots.md) for a pinned snapshot. Refresh the accepted base at any future integration boundary; never overwrite a moving active worktree.
