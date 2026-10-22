# History and literature integration checkpoint

**October 22, 2026. Requested independent AI review and repairs complete; actual screen-reader and learner observations remain open. Neither pilot is accepted or published.**

Worktree: `/Users/teodev/.codex/worktrees/universal-pilots-integration/theorems-visualizations`.
Branch: `codex/universal-pilots-integration`.
Accepted base: `facab15e297c645d4826935f2c011a4cf367ee88`, the independently accepted Wave 6 checkpoint used for the initial integration. Later expansion and redesign remain in their own worktrees. This branch does not replace their continuing progress.

## Current review results

The user authorized separate AI reviewers and explicitly kept unobserved human checks open. Three independent review processes inspected the candidate, recorded findings and rechecked the repairs. Their actual roles and limits are in the durable reports:

| Reviewer / evidence | Result and scope |
| --- | --- |
| [History AI review](universal-pilots-ai-history.md) | Content, provenance and bounded prototype-rights checks passed. Independently inspected the two NARA transcript bodies and copyright FAQ. One source-registry mismatch repaired and rechecked. No historian/lawyer credential claimed. |
| [Literature AI review](universal-pilots-ai-literature.md) | Content, English-language comparison and bounded prototype-rights evidence passed. Independently inspected the Academy display, Hearn HTML and Gutenberg catalog. No fresh Koto retrieval or Japanese specialist approval claimed. No text repair required. |
| [Engineering AI review](universal-pilots-ai-code.md) | Code inspection passed after repairing a review-digest binding gap. Independently ran 26 offline tests. This supplemental report supplies no accessibility or learning pass. |

Each pilot has three exact-version review records in its `reviews` array with the actual AI role, report path and current digests. Lifecycle is `in-review`, publication is `local-preview`. These are bounded checks of the selected text-only US local prototypes, not professional credentials or public-distribution clearance. The accessibility and learning dimensions have no passing receipts. Both unaccepted slots remain occupied.

### Repairs

1. **Source receipt consistency:** the central `telegram` and `wilson1917` receipts still described paraphrase-only reuse. Their plans now match the short attributed quotations already present in the pilot, retain excluded assets and keep wider-distribution review separate.
2. **Exact-artifact binding:** related collection labels came from the production registry but were not part of the artifact digest. The digest now binds the actual displayed related labels, including the renderer's ID fallback. An unrelated collection change does not invalidate a pilot. The regression verifies that changing a displayed label rejects previous acceptance receipts.

All six selected passage texts and both content digests are unchanged. Revision remains 0.1.1 so existing notes remain in their current stores. Code changes produce new artifact digests; all three reviewers rechecked these final values. Earlier findings and digests remain in the reports as history, not current approvals.

| Pilot | Content digest | Current artifact digest |
| --- | --- | --- |
| History 0.1.1 | `6a1aaf4c32b5dbf2603b4f3de469297a0a42abe0efbb2eff1d0026cc272043db` | `87d5558bfd38472fe904c3bc37d413a53458cc6ecd0af5933e9659e3d2282899` |
| Literature 0.1.1 | `b562d61ebf5ca44e5e9981c44f24f2203b0b84ba1c5cd975d5a433d9e4084df0` | `182f56098fe2684c55f6e35d1e9e40c982fb7ebf74fe8be6fa720be464a2b3b2` |

## Integration and validation

The explicit manifest now contains **53 additive files**, including the three AI reports. `MASTER_PLAN.md` is reconciled separately. Its accepted-base bytes are preserved exactly in [the baseline archive](../integration/universal-pilots-baseline-plan.md); the earlier Revision 2 archive is retained. Production content, runtime, workflows, ledgers and frozen assignments are outside this package.

Current checks on Node 22.23.3:

- **54/54 focused tests pass**: coverage registry, exploration contract/state/rendering, overlay safety and browser behavior. This includes the new collection-label review regression. The final in-review records and generated pages also passed the isolated snapshot checks.
- **Pinned-base integration rehearsal passes:** 53 package files overlay the accepted base; all **5,552 original snapshot files** retain their exact bytes. The rehearsal runs coverage validation, preview reproducibility, offline tests and the 10 browser groups. It uses an ephemeral server and one browser, then closes both.
- **Actual atlas navigation passes:** five collection round trips (TECH, BIGHIST, POLSCI, LING, ART), two home round trips, notes retained and no browser errors. Both pilots remain absent from the production home catalog.
- `git diff --check` passes. The six AI receipt digests match the current builder output; all receipt paths are present. Trying to accept either candidate still fails on the missing accessibility and learning reviews.

Current logs: `/tmp/atlas-ai-review-focused.log`, `/tmp/atlas-ai-review-integration.log`, `/tmp/atlas-ai-review-production.log`. The browser integration rehearsal report is `/var/folders/29/bzg0zx0d7jjbyf60_3cjch440000gn/T/atlas-integration-lz8IkA/report.json`. Documentation was reconciled after that run; final offline rehearsal passed at `/var/folders/29/bzg0zx0d7jjbyf60_3cjch440000gn/T/atlas-integration-I16Rf9/report.json` without repeating unchanged browser work. Subsequent documentation-only additions record the final packaging audit and link the two briefs to these results.

The **earlier whole-repository checkpoint** remains valid for its recorded scope: strict build 7,751 written / 5,823 planned, 531 chapters, 85 collections, zero errors/warnings; home JSON 123,750 gzip bytes; static check 7,688 items with no errors/warnings; **3,510/3,510 full-suite tests** passed. That full suite preceded the current review repairs and is not represented as a new full run. Current changes affect only the isolated pilot package and strategy documentation; affected tests and route checks were rerun. Earlier logs remain under `/tmp/atlas-integration-goal-20261022/`.

## Preservation and preview

The original root checkout's 3,222-file baseline is preserved except for the previously added `docs/master-plan-handoff.md` pointer. Against the accepted base, `MASTER_PLAN.md` is the only changed pre-existing tracked file; its old bytes are archived. The other 5,551 original files remain exact. The active expansion and redesign worktrees may advance independently; no writes or messages were sent to them. Their frozen chapter payloads and the shipping checkout retain hash `3a53e3ae4a663e1298f411760dd9b633b6e77a8511b50384928858cb427251af`. The current audit is `/tmp/atlas-ai-review-preservation.json`; it records actual heads without treating their latest work as accepted.

The existing local preview at `http://127.0.0.1:64014/labs/atlas/` serves this integration checkout on the same origin, preserving browser note keys. Verification browsers and ephemeral servers are closed; the user preview service remains. No push, PR, merge or deployment was performed. The Pages upload allowlist is unchanged and excludes the workshop and exploration sources. `noindex` is not privacy.

## Next evidence and acceptance boundary

Use the [real-session protocol](../integration/universal-pilots-review-session.md) for actual screen-reader tasks and formative learner observation. Record the real environment, participant context, actions/answers, assistance and observed barriers. Repair supported findings and append fresh exact-version receipts. Do not infer these observations from code, keyboard automation or screenshots.

The Koto retrieval stop remains binding; the retained earlier body reading is not a fresh verification. The scoped English-language review does not claim Japanese specialist competence. New original-language, historical, media or professional claims need appropriate review. Publication separately requires actual territory/asset/distribution and withdrawal responsibilities.

The full acceptance objective is still open. Continue from these named missing observations rather than relabeling AI checks as human evidence. Do not launch a third unaccepted exploration or modify ongoing Wave 5/6 work to clear the queue.

## Reproducible commands

```sh
node scripts/validate-coverage.mjs
node scripts/build-explorations.mjs --check
node --test --test-concurrency=1 tests/coverage-registry.test.mjs tests/explorations.test.mjs tests/explorations-integration.test.mjs tests/explorations-ui.test.mjs
node tests/explorations-production.mjs
```

Run from the integration worktree with `/tmp/atlas-ci-node22-20261020/node` in this environment. Use the [integration procedure](../integration/universal-pilots.md) for pinned snapshot rehearsal. Refresh the accepted base from the owning handoff at a future real integration boundary; never copy a moving active worktree wholesale.
