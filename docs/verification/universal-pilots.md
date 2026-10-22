# History and literature prototype verification

**October 22, 2026 · author verification only.** Both drafts remain unaccepted. This receipt is not an independent historian, language, accessibility or learner review.

**Historical 0.1.0 checkpoint.** The current 0.1.1 fixes, 53-test evidence, artifact digests and integration rehearsals are in [the subsequent review receipt](universal-pilots-review.md). Preserve the hashes and results below as the earlier checkpoint.

## Delivered and exercised

- [History prototype](../../labs/atlas/x-history-0001/index.html): four claims, explicit evidence selection, three support categories, bounded feedback and a transfer task about source dependence.
- [Literature prototype](../../labs/atlas/x-literature-0001/index.html): three reading lenses, named editions/display witness, observation/interpretation distinctions, local notes and a transfer task.
- Static source text and comparison guides are present before JavaScript runs. The prototypes require no publisher/API connection to perform their core tasks.
- Source and reuse decisions are [recorded separately](../pilots/research/history-literature-resolution.md); no modern media assets are copied.
- Local notes are keyed by identity and revision. Links share only validated selections; exports include private notes only when the reader explicitly exports them.
- The existing production loader, router, content and generated production data are not changed.

## Checks

```sh
node scripts/validate-coverage.mjs
node scripts/build-explorations.mjs
node scripts/build-explorations.mjs --check
node --test tests/coverage-registry.test.mjs tests/explorations.test.mjs tests/explorations-ui.test.mjs
```

**43/43 tests pass:** 18 coverage tests, 19 exploration contract/model/route tests and six browser groups. Browser groups contain multiple scenarios.

The checks include classification/evidence separation; source and passage integrity; stale content/artifact reviews being unable to approve acceptance; append-only historical receipts and latest-review precedence; self-approval and premature publication rejection; two-draft capacity; isolation of prerequisites; legacy URL parameters and uncertainty flags; state round-trips and malformed-input fallback; escaped content; local withdrawal; deterministic static generation; native keyboard operation; notes/reload/export/reset; share privacy; blocked storage; JavaScript-disabled reading; and static project-prefix loading.

The installed macOS Chromium's native select type-ahead was exercised with keypresses, followed by keyboard activation of the check button. Initial arrow-key automation did not change the native selection in this headless environment; the passing test uses native type-ahead instead of synthesizing a change event. This is a scoped keyboard check, not a claim that every assistive technology has been tested.

Both prototypes were exercised at 1280px and 320px widths in light/dark themes, with all details expanded for the overflow test. Full-page screenshots and separate readable desktop/phone viewport captures were visually inspected. Source cards, text, controls and the visible full claim remain contained; the long native select option is repeated below it so the claim is readable on a phone.

Network interception in the browser tests observed no external requests. Core tasks use local static assets. Source hyperlinks remain external references and are not mirrored. Test servers used ephemeral ports and did not reuse or stop another chat's server.

## Exact authored content

| ID | Revision | Content digest |
| --- | --- | --- |
| `x-history-0001` | `0.1.0` | `2c44be838e3c085f2ad6c0f5922e66f9bf9b8a981af6ae6982bf45aca9eb156b` |
| `x-literature-0001` | `0.1.0` | `a89c12d9cddc364204d9dc8c29c3b1254a2acd76368cc9bab87a70f5e793d14d` |

These content digests identify the authored JSON, including source/rights boundaries and task logic. The builder additionally computes an artifact digest from the content digest and hashes of `contract.mjs`, `route-state.mjs`, `render.mjs`, `ui.mjs`, `style.css` and `scripts/build-explorations.mjs`. Acceptance requires latest independent receipts bound to the current revision and both digests. A code change therefore cannot silently inherit an older rendering review. Historical receipts remain recoverable without blocking revised draft previews.

| ID | Artifact digest at this verification |
| --- | --- |
| `x-history-0001` | `aa786f2f6da4dd409168dfcd959fba2851ca5a4b930905e8e087c10436d73860` |
| `x-literature-0001` | `3c5c5bd85d446b9dc8457e687826d5d2e7dc4e16a213ef5329681d11de7cf835` |

Recompute digests with the builder before review. These hashes bind the scoped preview implementation; they are not a deployed-site attestation, reviewer signature or substitute for human assessment.

## Preservation

A pre-edit hash baseline covered **3,198 tracked and untracked files** in the root checkout, including pre-existing dirty work. Only the intended master-plan/coverage/pilot documentation, registry data, coverage validator and its test were modified among those files. Original `content/`, `assets/`, production build/server files, README and unrelated dirty/untracked work retain their original bytes.

New implementation is isolated to `explorations/`, `labs/atlas/`, the draft builder, focused tests and the named documentation. No production data build was run.

Other worktrees were read only. Their HEADs advanced independently during this task:

| Worktree | Start | Preservation snapshot |
| --- | --- | --- |
| Expansion | `f69f1c340f1e757fba7ea0d71dde6b559a1f5e40` | `dddfce1074b5095a90710404640f64d5a38d94db` |
| Redesign | `1f75f30a2ad485ecafd63ce4343676daf1d56e7c` | `4b46b05a545b93cafae282dbdc69199e32235813` |
| Shipping drafts | `f0a324f98f5f7f2538f7685b84d1041764a65828` | Unchanged at snapshot |

The frozen `chapters` payload in `docs/wave-6-plan.json` matches its pre-edit SHA-256 in all three worktrees:

`3a53e3ae4a663e1298f411760dd9b633b6e77a8511b50384928858cb427251af`

Canonicalization is Python `json.dumps(chapters, sort_keys=True).encode()`. This verifies frozen assignments, not the concurrent new chapters' correctness. No messages, writes, reset, stash, merge or cherry-pick was sent to those chats/worktrees.

## Remaining before acceptance or release

Independent historian/provenance and literary/language reviews, screen-reader task review, formative learner observation, and release-specific rights/distribution review remain open. No reviewer or participant has been appointed. The author checks above do not satisfy those independent dimensions.

Production sidecar loading, published canonical routes/sitemaps, public withdrawal and migrations remain planned. The local withdrawal stub and URL/state helpers are implemented; they do not establish a deployed public lifecycle. The broader atlas application suite was not rerun because its code and generated production output were not changed.

Use the [continuation handoff](../master-plan-handoff.md) for the next steps. Do not start a third unaccepted exploration or count these two in frozen Wave 6 acceptance totals.
