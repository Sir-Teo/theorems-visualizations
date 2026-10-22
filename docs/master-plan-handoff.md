# Master plan continuation and integration handoff

**Updated October 22, 2026.** Entry point for future universal-atlas work. Production waves and visual redesign retain their own handoffs and ledgers.

The broader plan now has a versioned coverage registry, eight researched briefs, an additive schema/URL contract, and **two working local prototypes, revised to 0.1.1 after author-led review**. The [integration package](integration/universal-pilots.md) passed a rehearsal on the accepted Wave 6 checkpoint and compatibility checks on frozen expansion/redesign snapshots. This is an implementation foundation and a concrete queue, not a claim that all future disciplines, sources or review needs are solved.

## Read these first

1. [MASTER_PLAN.md](../MASTER_PLAN.md): vision, preservation contract and U0–U5.
2. [Coverage guide](coverage/README.md): inventory, source receipts, classification scope and validation.
3. [Schema and URL decision](architecture/universal-schema-urls.md): implemented contract versus reserved production design.
4. [Exploration authoring](exploration-authoring.md): method, evidence, privacy, access and review workflow.
5. [Pilot index](pilots/README.md), [source decisions](pilots/research/history-literature-resolution.md), and [prototype verification](verification/universal-pilots.md).
6. The active content/redesign handoffs below before any integration.
7. [Latest pilot review](verification/universal-pilots-review.md) and [integration manifest/procedure](integration/universal-pilots.md): concrete fixes, remaining reviews and a read-only rehearsal command.

## Active integration

Continue in `/Users/teodev/.codex/worktrees/universal-pilots-integration/theorems-visualizations`, branch `codex/universal-pilots-integration`, based on accepted checkpoint `facab15e297c645d4826935f2c011a4cf367ee88`. Read the [integration checkpoint](verification/universal-pilots-integration.md) for the current requirements audit and pending reviews. The old root checkout remains preserved; do not restart the integration there.

## What is ready now

| Deliverable | Canonical files | State |
| --- | --- | --- |
| Coverage | `docs/coverage/registry.json` and pinned inventories | 30 domains; 85 primary collection homes; eight cross-listings; 217 classification entries |
| Research | `docs/pilots/*.md` and `docs/coverage/sources.json` | Eight bounded briefs; named access/rights/reviewer gates |
| Data and review contract | `explorations/contract.mjs` | Versioned IDs, evidence, claim boundaries, passage hashes, review history and content/artifact review checks |
| History prototype | `explorations/history.json` | Authored draft; claim/evidence comparison; independent acceptance pending |
| Literature prototype | `explorations/literature.json` | Authored draft; three reading lenses, named Japanese display witness; independent acceptance pending |
| Preview build | `scripts/build-explorations.mjs`; `labs/atlas/` | Isolated static pages; production loader/catalog unchanged |
| State and compatibility helpers | `explorations/route-state.mjs` | Tested legacy URL preservation, bounded public state and no inferred legacy acceptance |
| Verification | Scoped Node/browser tests and verification receipt | Author checks, not specialist or learner acceptance |
| Integration preparation | `docs/integration/universal-pilots.json`; `scripts/check-exploration-integration.mjs` | Explicit additive paths; pinned snapshot rehearsal; differing files refused; master plan manually reconciled |

**Preview locally:** run `PORT=8219 node scripts/serve.mjs` from this checkout if that port is free, then open `http://localhost:8219/labs/atlas/`. Use another free port if needed. Direct pages are `labs/atlas/x-history-0001/` and `labs/atlas/x-literature-0001/`. No public deployment has been performed.

Both new-format draft slots are occupied. The user's instruction authorizes these prototypes without waiting for a reviewer appointment. It does not turn the author into an independent specialist reviewer. Do not silently weaken the two-draft limit to launch the remaining six.

## Concrete queue and exit conditions

| Order / milestone | Work | Dependency and exit condition |
| --- | --- | --- |
| Now · U1 review | Inspect the registry crosswalk and proposed stewardship | 79 review-needed classification entries retain explicit dispositions; no invented coverage percentages |
| Now · U2 first pair | Independently review P01 source criticism and P02 literary/language scope | Competent named reviewers inspect the exact current digests; resolve changes requested |
| Now · U2 access/learning | Screen-reader task review and formative reader observation | Both tasks can be completed using their promised alternatives; observed defects repaired; receipts identify scope |
| Next · U2 contracts | Finalize source/annotation payloads from actual review findings | Changes preserve static text, old state or an explicit migration, and exact-content review validity |
| Next · U2 acceptance | Accept the first pair through the new-format contract | Latest receipt for every required dimension passes for the current revision and content/artifact digests; do not add them to frozen Wave 6 counts |
| Next · U2 methods | P03 argument, P05 measured data, P07 practice, P08 performance, in bounded batches | Close each brief's source/asset/reviewer gates; implement its method contract; at most two unaccepted drafts |
| Gated · U2 professions | P04 law and P06 care | Qualified legal/clinical review and the specific temporal/physiological gates; no generic automated approval |
| U3 integration | Add opt-in production loading and evidence/review UI | Integrate from latest accepted base; old `verify`, IDs, links, deps, embeds and saved states survive |
| U3 routes | Generate accepted public pages and aliases | Real static paths, canonical metadata/sitemap, project-base tests, no duplicate counts, no draft leakage |
| U3 orientation | Research 30 scoped domain overviews | Each has real sources, questions, gaps, language/place context, a maintainer role and a useful next step |
| U3 sequences | Research and build three lessons per pilot, 24 total | The 16 follow-ups are currently proposals; research each before authoring, then independently accept |
| U3 journeys | Water and a city; a woven cloth; how an account becomes evidence | All claimed lesson targets exist and are accepted; distinguish evidence, analogy and prerequisite |
| U3 dashboard | Coverage and review queue | Reconcile exact canonical IDs and ledger denominators; separate authored, accepted, redesigned, access-reviewed and evaluated |
| U4 introductory breadth | At least three accepted introductory explorations per domain | Versioned syllabi; no duplication through cross-listing; method/place/language audit |
| U4–U5 deeper work | Research specialties and locally informed editions | Source and reviewer capacity before freezing small batches; preserve mathematical/scientific depth |
| U5 stewardship | Corrections, source freshness, edition migrations, rights and withdrawal | Named release scope, dates, responsibilities and reproducible review; recurring jobs only when requested |

This queue defines dependencies, not a calendar forecast. Measure actual sourcing, authoring, engineering and review effort during U2. Do not project the old quantitative chapter throughput onto translation, law, care or embodied practice.

## Scope ownership and other chats

**“Expand the waves”** owns ongoing production in:

`/Users/teodev/.codex/worktrees/wave-six-expansion/theorems-visualizations`

Read that checkout's `docs/wave-continuation.md`, `docs/wave-6-plan.json`, `docs/wave-6.md` and `docs/verification/wave6-production.md`. Its latest accepted export and ledgers supersede the master plan's dated snapshot.

**“Improve wave5 and wave6 visuals”** owns:

`/Users/teodev/.codex/worktrees/wave-visual-redesign/theorems-visualizations`

Its `docs/verification/wave5-visual-redesign.md` defines scope and review. Preserved shipping drafts remain in `/Users/teodev/.codex/worktrees/wave-five-shipping/theorems-visualizations`.

The universal package originated in the older root checkout and is now applied to this dedicated accepted-base integration worktree. Do not treat the old root checkout as the latest atlas. No writes or instructions were sent to the active chats by this task. Future coordination messages need user authorization; reading status does not require interrupting work.

## Safe integration procedure

1. Read current Git status and relevant handoffs; preserve every unrelated dirty or untracked file.
2. Use the current accepted integration base. Carry only the universal package's intended paths, never an old whole-worktree snapshot.
3. Reconcile the master-plan sections rather than overwriting newer progress. Preserve the Revision 2 archive and frozen assignment payload.
4. Run coverage validation against the destination's actual collection metadata. A genuinely new collection needs one primary mapping and a declared baseline update.
5. Keep prototype JSON, renderer/state/contract, builder, tests, generated previews and documentation together. Rebuild previews in the destination.
6. Run scoped checks below. If production loading/routing is then changed, additionally run the current strict production build, static checks, affected UI/dependency checks and home-JSON budget at that accepted base.
7. Keep draft previews out of published indexes and accepted counts. `noindex` is not privacy or a substitute for an explicit release decision.
8. Preserve existing local progress and note stores. Do not reset, stash, cherry-pick over, or clean another chat's active work.
9. Record integration evidence and exact versions. No push, PR, merge or deployment is authorized merely by this handoff.

## Commands and scope

```sh
node scripts/validate-coverage.mjs
node scripts/build-explorations.mjs
node scripts/build-explorations.mjs --check
node --test tests/coverage-registry.test.mjs tests/explorations.test.mjs tests/explorations-ui.test.mjs
node --test tests/explorations-integration.test.mjs
```

The draft build writes only `labs/atlas/`. It does not invoke `scripts/build.mjs` or load chapter modules. Browser checks use an ephemeral local port, independent of the active chats' servers. The production application suite is required when integrating runtime changes, not to make a planning artifact look accepted.

## Open decisions that must stay visible

- Qualified reviewers and learner participants are not assigned or recruited.
- Selected-text rights are scoped for local prototypes; wider publication needs its actual distribution review.
- The Japanese source is a modern institutional display witness, not a critical edition or facsimile.
- Its Koto recheck timed out during the latest review; retain the earlier body-read receipt without claiming fresh verification or recovering a stopped source through another host.
- The six other methods are briefed; their components/assets are not implemented.
- Public routes, sidecar loading, public withdrawal and note migrations are specified future work, not live features.
- Detailed library schedules, community vocabularies and many place/language traditions remain outside the current crosswalk.
- Map-performance work stays deferred; it is not reopened through “future readiness.”

When a new source, method or field exposes a limitation, version the contract and record the decision. Readiness means the next step, evidence and preservation boundary are explicit; it does not mean the open-ended master plan is finished.
