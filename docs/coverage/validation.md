# U1 validation and preservation receipt

**October 22, 2026 · registry 0.1.0 · root checkout delivery.**

The requested coverage registry and eight research briefs are present. U1 as a whole remains in progress: the additive schema/URL proposal, source/rights gate closure and reviewer capacity are outstanding. No lesson, professional review or production acceptance is claimed.

## Checks completed

| Check | Result and scope |
| --- | --- |
| `node scripts/validate-coverage.mjs` | PASS: 30 domains; 85 single primary homes; eight cross-listings; 217 classification entries; 38 source receipts; eight brief files |
| `node --test tests/coverage-registry.test.mjs` | 18/18 pass, including failures for lost/duplicate mappings, missing/altered category universes, unknown references, blocked sources and false acceptance claims |
| Classification dispositions | 137 mapped, 79 review-needed, one excluded; no implication of taught coverage or specialist approval |
| Documentation links | Local Markdown link targets checked across master plan, coverage/research companions, registry guide, validation receipt and all pilot documents |
| Soil audit | Executed against pinned local files; both SHA-256 values match; 12 sample records, 1,106 repeated retention measurements, no orphan samples or exact duplicate retention rows |
| Source boundaries | Access stops, density-unit conflict, conductivity flags, diaphragm-description conflict, legal-date limitation and translation/asset gates retained in the briefs/receipts |

The application suite, browser UI and production build were not rerun: this task adds isolated planning data, documentation and a read-only validator, with no product/runtime/content changes. Tests establish the registry's structural contract. They do not establish complete taxonomy coverage, expert review, educational efficacy or accessibility conformance of future lessons.

## Root preservation check

A pre-edit SHA-256 baseline covered **3,164 tracked files**, including files already dirty when this task began. At verification, the sole changed tracked path was `MASTER_PLAN.md`. The other **3,163 tracked files matched the pre-edit bytes**. In particular, the existing README, content, runtime, tests, operational ledgers and authoring guides were not changed by this task.

The two universal companion documents were already untracked at task start and were intentionally updated. Newly added paths are limited to `docs/coverage/`, `docs/pilots/`, `scripts/validate-coverage.mjs` and `tests/coverage-registry.test.mjs`. Previously untracked content/source-audit files were not edited or staged.

The root Revision 2 archive retains SHA-256:

`7f10b05580676436da6cd8df89cccc4368cda6ee4e3ef95960bf838e8eca6a60`

## Other chats and frozen assignments

All access to the other worktrees was read-only. No messages, writes, resets, checkouts or integration operations were sent to their chats. Their progress legitimately advanced during this task:

| Worktree | HEAD at task start | HEAD at preservation check |
| --- | --- | --- |
| Expansion, “Expand the waves” | `cadfbbd974787c1f9e82fa2f880e119b774f6ac6` | `f69f1c340f1e757fba7ea0d71dde6b559a1f5e40` |
| Redesign, “Improve wave5 and wave6 visuals” | `3a9e1cbde87a77c2112739ca8001565a23fd9277` | `1f75f30a2ad485ecafd63ce4343676daf1d56e7c` |
| Preserved shipping checkout | `f0a324f98f5f7f2538f7685b84d1041764a65828` | Same |

These are dated observations, not promises that the active HEADs will remain fixed. Expansion progress/continuation/production ledgers and the redesign ledger changed under their existing work; this task does not certify their new content.

The `chapters` value in `docs/wave-6-plan.json` matched its pre-edit hash in all three worktrees. Canonicalization was Python `json.dumps(chapters, sort_keys=True).encode()`, with SHA-256:

`3a53e3ae4a663e1298f411760dd9b633b6e77a8511b50384928858cb427251af`

This confirms preservation of the frozen assignment payload, separate from mutable progress. The U1 package remains in the root checkout for a later normal handoff; nothing was copied into the active worktrees.
