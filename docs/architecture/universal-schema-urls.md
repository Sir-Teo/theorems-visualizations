# Additive exploration schema and URL contract

**Decision record · version 1.0.0-draft · October 22, 2026.** Adopted for four local prototypes under the user's instruction to proceed. Production integration and public routes remain separate work.

The atlas can add source criticism and interpretation without renaming its 85 collections or altering a frozen chapter. New explorations live beside legacy content, with explicit evidence, rights and review records. A small static builder proves the contract before production loaders acquire new responsibilities.

## Identity and compatibility

| Entity | Identity and storage | Compatibility rule |
| --- | --- | --- |
| Legacy idea | Existing `<collection>-<num>`, e.g. `pma-4.19` | Keep IDs, numbering, kind, deps, see, verify, source citations and current URLs |
| New exploration | `x-<stable-family>-<four-digit-sequence>`, e.g. `x-history-0001` | ID is immutable; title and navigation labels may change without changing identity |
| Planning domain | Existing `D01`–`D30` | Many-to-many coverage view; not a replacement runtime field |
| Pilot | Existing `P01`–`P08` | Editorial project, not an authored-item count |
| Source / selected passage | Source receipt ID; passage ID local to an exploration | Editions, languages, locators and rights remain separate from the idea ID |
| Review | Dimension + reviewer + revision + content/artifact digests + receipt | Stale evidence cannot approve changed content or rendering |

A new namespace avoids collision with old item IDs. The family segment is an identity label, not an obligation to keep the exploration in one domain forever. Moving a lesson among domains never renumbers it.

The [legacy evidence adapter](../../explorations/route-state.mjs) preserves `verify: true` as a legacy uncertainty flag and copies prerequisite IDs without mutating them. It does **not** infer acceptance from “written,” the presence of a visualization, or absence of a verification flag. The adapter is tested but is not wired into the production renderer.

For future legacy enrichment, use sidecar records keyed by the existing item ID. Do not rewrite every chapter to add empty metadata. An absent sidecar means “no additional review information,” not failure or acceptance. Freeze the sidecar path and loader only during the production integration change.

## Executable record contract

The [validator](../../explorations/contract.mjs) and [four real examples](../../explorations/manifest.json) define version 1. No second, untested JSON Schema is presented as authoritative.

| Field group | Required meaning |
| --- | --- |
| `schemaVersion, id, pilotId, revision` | Structural version, canonical identity, editorial pilot and semantic content revision |
| `status, publication` | Draft / in-review / accepted / withdrawn is distinct from local preview / public release |
| `title, subtitle, summary, audience, scope` | Human-readable promise and limits |
| `domainIds, knowledgeModes, methods` | Subject homes, epistemic modes and implemented exploration methods |
| `sources[]` | Receipt ID, creator, edition/date, language, URL, exact locator and a bounded rights decision |
| `passages[]` | Stable local ID, source ID, quotation/paraphrase/original label, text, context, language and UTF-8 SHA-256 |
| `claims[]` | Claim kind, evidence passage IDs and a qualification delimiting what follows |
| `context[], timeline[]` | Necessary context; dates explicitly distinguish day, month, year and approximate precision |
| `prerequisites[], relations[], relatedCollectionIds[]` | Logical dependencies, typed semantic connections and optional navigation are separate |
| `activity` | A supported method-specific task, feedback/reading guide, transfer task and rubric |
| `reviewRequirements[], reviews[]` | Declared independent dimensions and append-only content/artifact receipts |
| `reviewLimitations[]` | Optional reader-visible limitations bound into the reviewed content |
| `extensions` | Namespaced future metadata; never executed or silently treated as a supported learning method |
| `previousRevisions` | Optional distinct revision identifiers whose local notes can be explicitly exported; no automatic migration |

Version 1 implements **source-comparison**, **annotation**, **argument-map** and **measured-data** activities. It recognizes formal, empirical, historical, interpretive, normative, procedural and creative knowledge modes, but does not claim to implement all their interfaces. Case, practice, performance, map and object methods need their own payload validation and accepted vertical slices before registration. Unknown methods fail explicitly.

Text payloads are escaped. Only public HTTPS source links are allowed. No arbitrary HTML, executable code, imported iframe or external script is accepted in authored data. A source's availability does not establish its rights or epistemic reliability.

Displayed evidence must resolve to a body/table/file reading receipt; metadata-only or indexed-only discovery does not qualify. Quotation, paraphrase and original explanation retain distinct rendering labels. The selected receipt's scope still controls what was actually inspected.

## Evidence and relations

`deps` and new `prerequisites` are for what the supplied explanation actually requires. Prerequisites must be resolved against an accepted inventory and checked for cycles at integration. The prototype supplies none and therefore does not load concurrent chapter drafts.

Semantic relations use a separate vocabulary: applies, analogous-to, contrasts-with, influenced-by, evidence-for, challenges, part-of, translation-of and version-of. Each needs a rationale; historically or evidentially significant relations also need sources. Wider semantic graphs may cycle. They must never be fed wholesale into the existing prerequisite planner.

The prototype validator checks targets against an explicitly supplied known-item set. The draft builder supplies no item set; unresolved exact item links therefore fail, while reviewed collection-level navigation is allowed. Future integration supplies the accepted export, not an arbitrary working-tree inventory.

## Lifecycle and review

The author can create a draft, run checks and request review. This is not independent acceptance. Content and rights are mandatory. Every additional dimension listed in `reviewRequirements` also gates acceptance. At the user's explicit instruction on October 22, the P01/P02 screen-reader and learner-session gate was removed. History retains provenance; literature retains language. Their `reviewLimitations` disclose that human sessions were not performed. This changes the required scope, not the results of unperformed reviews.

An independent review receipt names a reviewer and role, independence from the author, the dimension, result, date, evidence path, revision, `contentDigest` and `artifactDigest`. Acceptance requires the latest appended receipt for **every required dimension** to pass for the current revision and both current digests. The content digest includes reader-facing content, source/rights decisions, activity behavior and requirements; only lifecycle/publication labels and review records are excluded. The artifact digest also binds the contract, state helpers, renderer, browser code, stylesheet, preview builder and the resolved related-collection labels displayed by the renderer. Changing a displayed collection title invalidates the artifact review; changing an unrelated collection does not. The builder prints both digests; do not copy them from an older verification receipt.

Historical receipts remain in the append-only array. They do not block rendering a revised draft, and they cannot approve a changed artifact. Append fresh reviews after repairs; never reorder history to make a prior pass appear latest. A latest changes-requested receipt blocks acceptance. Any change to the bound code requires fresh affected review, with all required receipts bound to the current artifact before acceptance.

Scoped AI review is identified explicitly in the reviewer role and linked evidence; it does not imply professional credentials, fresh inspection of a stopped source, actual screen-reader use or learner observation. Prototype rights review is separate from public-distribution clearance. A code validator cannot certify a person's qualifications, independence or the truth of a review. The integration owner must inspect the named receipt and reviewer credentials/context. The builder must also verify that receipt paths exist before treating an accepted record as integrable. Test-fixture reviewer names are never production approvals.

The current builder emits local previews only and rejects `publication: "published"`. A withdrawn local record renders an identity-reserving stub. It does not implement public release or withdraw an already published page. Public withdrawal, translations and public-version retention are production contracts still to implement. No general permission to publish follows from passing prototype tests.

## URL plan

| Purpose | URL relative to deployment base | State now |
| --- | --- | --- |
| Existing idea | `#/t/pma-4.19?…` | Unchanged production route and parameter contract |
| Existing collection/chapter | `#/c/pma`, `#/c/pma/4` | Unchanged |
| Existing field/map/path/bridge/search | Current hash routes | Unchanged; no blanket redirect |
| Prototype index | `labs/atlas/` | Implemented, static HTML, noindex |
| Prototype | `labs/atlas/x-history-0001/` | Implemented, refresh-safe static directory |
| Future public exploration | `explore/x-history-0001/` | Reserved proposal; no fabricated live URL |
| Future public legacy page | `ideas/pma-4.19/` | Proposed prerendered companion; old hash remains functional |
| Future domain/source views | `domains/D20/`, `sources/<receipt-id>/` | Proposed, not generated |

All paths must work under both `/` and a static-host project base such as `/theorems-visualizations/`. Generated prototypes use relative asset and collection links; tests load them under an emulated project prefix. No rewrite server is required.

Public routes should contain semantic HTML, a self-canonical URL and sitemap entries **only for accepted, published material**. Drafts remain noindex and outside sitemap/home/search/production counts. Do not publish a canonical tag pointing at an unimplemented route. “Noindex” is not authentication: private or restricted evidence must never be embedded merely because a page is a draft.

A future opt-in legacy redirect must preserve the exact idea ID, alias resolution, query parameters, embed mode and visualization state. First audit and test every existing route family. Keep unknown legacy parameters opaque until their owner defines a migration; never strip saved state to simplify routing. The old router is not changed by this delivery.

An alias maps once to a canonical identity, with provenance and no cycles. It must not cause duplicate authored counts or chains of redirects. Reserve retired public IDs and provide a tombstone when appropriate; do not recycle an ID for a different idea.

## Saved state and privacy

The implemented fragment contract is `#v=1&task=…&evidence=…&category=…` for history, or `#v=1&lens=…&category=…` for literature. Only known enum values survive normalization. Unsupported versions and fragments over 1,000 characters restore defaults with a visible explanation.

Private notes never enter a share link. Local storage uses `atlas.exploration.v1.<id>.<revision>` so a new revision cannot silently overwrite old notes. Export includes identity, revision, selections and notes. Reset affects only that pilot revision. Existing atlas progress keys are untouched. A future migration must be explicit and reversible; there is no account or server synchronization.

Revision 0.1.1 adds explicit export of listed earlier-revision stores. Unreadable current data is preserved and included in the reader's export, rather than overwritten by new typing. Failed deletion is reported accurately. Native page/source anchors preserve current work. A changed selection invalidates an old displayed share link; a delayed clipboard response cannot restore its stale instructions.

## Build, verification and rollout

1. Edit canonical JSON and supporting code; register only two unaccepted prototypes.
2. Run `node scripts/build-explorations.mjs`. It writes only `labs/atlas/` and never calls the production builder.
3. Run `node scripts/build-explorations.mjs --check` and the scoped tests in the [handoff](../master-plan-handoff.md).
4. Review exact versions and source/rights scope. Run screen-reader and formative learner checks; automation is only part of access verification.
5. Integrate at the existing content/redesign handoff boundary, using the latest accepted production base. Build sidecar/catalog support behind an opt-in reader path.
6. Prove route compatibility, static no-JavaScript content, alias behavior, bounded home payload, link semantics and unchanged prerequisite outputs before a public-path migration.
7. Public release is a separate authorized operation. Roll back an integration by removing the additive loader/link, retaining old IDs, content and progress. These prototypes require no production rollback because they are not loaded there.

Implementation status and future work are tracked in [the master-plan handoff](../master-plan-handoff.md). This contract supports measured extension; it is not a claim that every future domain's data or review model is already solved.

## Argument and measured-data additions

`argument-map` validates a bounded premise bank, explicit interpretation/empirical-assumption/normative-addition kinds, actions with objections, and source-linked editorial guides. Public state contains guide, actor, action and ordered unique premise IDs. Native buttons edit that list; structural guidance does not compute moral truth or logical validity.

`measured-data` carries the frozen projected rows inside the reviewed content. It validates unique source-row identities, positive finite magnitudes, reported percent range, instrument codes and exclusion of density/conductivity columns. Sample plus magnitude is deliberately not a unique key. Public state contains sample/comparison/source-row IDs and bounded synthetic parameters; full text/data tables work without JavaScript. The reproduction script verifies the entire projection against the hash-pinned original CSV. The log10 plot has no connecting/fitted lines; the assumed storage model never consumes measured rows.

All three added method modules are bound into every artifact digest. Extending shared code triggers renewed exact-artifact reviews of existing accepted previews. Review roles, unperformed human observations and release scope remain separate.
