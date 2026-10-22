# History and literature integration checkpoint

**October 22, 2026. Goal remains active until the remaining reviews and safe integration are complete.**

Worktree: `/Users/teodev/.codex/worktrees/universal-pilots-integration/theorems-visualizations`.
Branch: `codex/universal-pilots-integration`.
Accepted base: `facab15e297c645d4826935f2c011a4cf367ee88`, independently accepted Wave 6 checkpoint identified by the active content handoff. Later expansion and redesign remain in their own worktrees and are not replaced by this branch.

## Integrated scope

The existing 46-file pilot package is applied additively. Four integration-specific files add the exact prior master-plan archive, this checkpoint, a real-session review protocol and an actual atlas-navigation smoke check. The 50-file manifest remains explicit. Revision 3 of the master plan is reconciled separately, with the accepted base's exact previous plan preserved in [the baseline archive](../integration/universal-pilots-baseline-plan.md). The earlier Revision 2 archive is also retained unchanged.

The pilots remain 0.1.1 drafts with empty independent-review arrays. No acceptance record, reader observation, professional qualification or publication clearance is invented. Content digests remain unchanged from the [author review](universal-pilots-review.md). Final artifact digests below reflect the staging cleanup of extra end-of-file blank lines and one whitespace-only generated line.

This is an integration branch for the full objective, not a replacement objective restricted to prototypes. Independent acceptance and any resulting repairs are still required. The package is connected to the existing atlas through the implemented collection/home links. It is not included in the deployed home catalog or Pages upload allowlist while its publication gates remain open.

## Requirements and current evidence

| Requirement | Evidence / state |
| --- | --- |
| Use an accepted production base | Active content handoff identifies `facab15e…`; isolated managed worktree created from that exact commit |
| Preserve ongoing Wave 5/6 work | No writes/messages to either active chat; exact frozen chapter payload and root-file baseline recorded |
| Integrate additive source, UI, tests and strategic plan | Package copied, exact baseline plan archived, Revision 3 reconciled on the dedicated branch |
| Preserve production catalog counts and strict/static behavior | Strict build: 7,751 written / 5,823 planned, 531 chapters, 85 collections, zero errors/warnings; home JSON 123,750 gzip bytes. Static: 7,688 items, zero errors/warnings |
| Whole-repository integration checks | PASS: 3,510 / 3,510 tests, zero failures/skips/cancellations, 383.628 seconds on Node 22.23.3 |
| Native links between pilots and accepted atlas | PASS: five actual collection round trips (TECH, BIGHIST, POLSCI, LING, ART), two home round trips, notes retained, no browser errors; drafts absent from home catalog |
| Independent source/content/language and rights review | Pending reviewer authorization/receipts; author verification is not substituted |
| Actual screen-reader task review | Not observed; [session protocol](../integration/universal-pilots-review-session.md) prepared |
| Formative learner observation | Not observed; same protocol specifies tasks and evidence without fabricated responses |
| Independent acceptance of current exact artifact | Not achieved; all required latest receipts must exist and match revision/content/artifact digests |
| Publication | Not performed; deployment allowlist unchanged; explicit actual distribution/asset review remains open |

## Reproducible commands

Use Node 22.23.3 in this environment (`/tmp/atlas-ci-node22-20261020/node`). Commands run from the integration worktree:

```sh
node scripts/validate-coverage.mjs
node scripts/build-explorations.mjs --check
node scripts/build.mjs --strict
node scripts/check.mjs --static --quiet
node --test --test-concurrency=1 tests/*.test.mjs
node tests/explorations-production.mjs
```

The production build is run only in this isolated worktree. Test servers use ephemeral ports, with one browser at a time for this task. Preserve the two active chats' own browser/server lanes. Do not rerun the broad suite after documentation-only changes; rerun affected checks after actual repairs.

## Remaining review work

The user has been asked whether separate AI reviewers should perform source/language/code checks or whether independent receipts are available. No separate reviewer has been launched without that answer. AI review, if selected, must identify its actual role and limits. It does not manufacture a human screen-reader session or learner observation. No external reviewer has been contacted.

The [review-session protocol](../integration/universal-pilots-review-session.md) is ready to collect the missing observations. Keep the full goal active, preserve this branch, and continue from the evidence that arrives rather than relabeling these missing gates as passed.

## Engineering checkpoint results

The isolated strict build, static check, complete serial suite and production route smoke check pass. Logs are under `/tmp/atlas-integration-goal-20261022/`: `build.log`, `static.log`, `full-tests.log` and `production-routes.log`. The existing 53 pilot tests are included in the 3,510 total; do not add them again. A focused rerun of the three integration safety tests also passes after extending the manifest's allowed integration-report paths.

A byte comparison of all 5,552 files in the accepted Git tree found exactly one changed existing path, `MASTER_PLAN.md`. Its exact old bytes are retained in the integration baseline archive. All production content, runtime/assets, scripts, workflows, ledgers and original source flags are unchanged. No production item was added, accepted or redesigned by this branch. The full build regenerates ignored data locally; the deployment allowlist continues to exclude the pilot sources and workshop.

The prior preview service is transferred to this integration checkout on the same loopback origin so existing browser note keys remain usable. This serves the accepted atlas build together with the integrated pilot pages; it is not a public deployment. All verification browsers and ephemeral test servers are closed. Only the user preview service remains running.

**Goal completion audit:** engineering integration is achieved on the dedicated local branch. Independent source/language/rights review, actual screen-reader observation and formative learner evidence remain unproven. No independent acceptance is claimed. Keep the goal active and continue from these missing evidence items; do not redefine full completion as this engineering checkpoint.

## Final staged artifact and preservation audit

Staging exposed whitespace errors in previously untracked files that an unstaged diff had not inspected. Extra final blank lines were removed, the empty timeline line no longer emits spaces, and the previews were regenerated. The final 53 focused tests pass in 6.238 seconds, and all five collection/two home round trips pass again after regeneration. The 3,510-test full suite preceded this whitespace-only cleanup; unchanged production files and the final affected checks establish its scope without claiming a second full run.

| Pilot | Revision | Final artifact digest |
| --- | --- | --- |
| History | 0.1.1 | `8f814e4b133f508639df0be35d30fac37b98960873ff10452c0eaf1f1cab035f` |
| Literature | 0.1.1 | `70c9d0d487e0fc4d5f55a99a058ab20e2295794b2fd868c68a49257d53cf7385` |

The original chat checkout's 3,222-file baseline differs only in `docs/master-plan-handoff.md`, which now points here. The active expansion and redesign branches advanced independently to `434e3e73…` and `9374d608…` during the final preservation snapshot; no writes or messages were sent to them. Shipping stayed at `f0a324f9…`. All three retain frozen `chapters` hash `3a53e3ae4a663e1298f411760dd9b633b6e77a8511b50384928858cb427251af` using Python's sorted-key JSON serialization. This is preservation evidence, not acceptance of their new work.
