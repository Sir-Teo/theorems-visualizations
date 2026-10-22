# Legacy evidence view and sidecar contract

Implemented locally on October 22, 2026. This is a production-code integration slice of U3, not a release or an acceptance of existing lessons. The real `evidence/manifest.json` is empty. History, literature and the other new-format prototypes retain their separate local preview contract and review bindings.

## Reader behavior

An existing written idea has a collapsed **Sources and review status** disclosure. Opening it lazily imports the evidence view and fetches its catalog; home and unopened explanations fetch neither. The existing visualization stays mounted. The view separates the legacy verification flag, item references/qualifications and collection-level reading route from any independently reviewed sidecar. A missing flag or sidecar never becomes an acceptance claim.

The optional `#/evidence/<legacy-id>` route resolves canonical written ideas and aliases. Its return link preserves the original ID and entire opaque query suffix, including embed mode, duplicate parameters, encoded values and literal question marks. Alias resolution retains that suffix. All assets/data resolve relative to the deployment base. This is a JavaScript fragment route; discoverable static legacy pages remain future work.

The view distinguishes no published record, unavailable/unverifiable data, stale target bindings and a withdrawn record. Asynchronous completion checks the current view before replacing the DOM. Authored metadata renders as text; outbound source links must be credential-free HTTPS. New evidence does not enter prerequisites, progress, search, lesson counts or saved visualization state.

## Authoritative files

| File | Responsibility |
| --- | --- |
| `assets/js/evidence-model.js` | Browser-safe validation, canonical serialization, legacy snapshot and opaque route conversion |
| `assets/js/evidence-view.js`, `assets/css/evidence.css` | Lazy retrieval and scoped reader presentation |
| `evidence/manifest.json` | Explicit entries: `targetId` and a simple local JSON filename; currently no entries |
| `scripts/evidence-sidecars.mjs` | Build validation, review/report binding and public/minimal-withdrawal export |
| `scripts/evidence-module-digest.mjs` | Non-evaluating parse/hash of the selected authored module's local static ESM dependency closure |
| `scripts/build.mjs` | Prepare evidence before atomic data-directory replacement; emit catalog and selected per-target shards |

The executable validator is authoritative; there is no parallel untested JSON schema. A record uses schema version 1, canonical written target ID, semantic revision, `local-only`, `public` or `withdrawn` publication state, author, scope, update date and exact target digest. Ordinary records require 1–50 sources and 1–50 qualified claims, explicit limitations, declared review dimensions and append-only review history. Unknown fields fail validation, preventing accidental export of unsupported/private metadata.

Every source needs its creator, title, edition, exact locator, claim boundary, HTTPS URL, actual body/table/file-read type and date, and bounded reuse decision. Every claim resolves source IDs and includes a qualification. These structural checks cannot establish that reading occurred or that reuse is lawful. Source and distribution decisions still need real evidence.

## Binding and review workflow

1. Select an actual written canonical idea, source passages and intended distribution scope. Keep a working record local-only until its release-specific decisions and reviews are ready. Do not register synthetic fixture receipts.
2. Use the same normalized item/collection supplied by the production builder. `legacyEvidenceSnapshot` binds title, kind, statement, scope, credit, references, links, written/planned prerequisites, collection citation and implementation digest. Both authored `verify: true` and compact `verify: 1` preserve the legacy uncertainty flag.
3. Compute the target SHA-256 from canonical snapshot serialization. The implementation digest hashes the authored entry module and transitive local static import/re-export modules using Node's parser without linking or evaluation. Dynamic imports, nonlocal imports and non-JavaScript dependencies are refused. This conservative static contract does not bind arbitrary fetched data or external runtime resources; those need an explicit extension before a record can claim to cover them.
4. Set the intended record publication state before content review: `evidenceContent` excludes only the reviews array. Changing publication, scope, source decisions, requirements or any other content invalidates the content digest. Artifact SHA-256 binds content digest, target digest and the sorted code hashes returned by `evidenceCodeHashes`, including all runtime assets and the evidence/build implementation.
5. Obtain independent receipts for content and rights plus all declared additional dimensions. Each receipt names the actual reviewer ID/role, independence, dimension, result, date, summary, revision and both content/artifact digests. AI reviewers must identify their bounded AI role. Append repairs/reviews; the latest receipt for each required dimension must pass the exact current binding before public export.
6. Each public record's referenced `docs/verification/*.md` report must exist and contain its target, receipt revision, reviewer, dimension and exact digests. This binds reports to receipts, but does not authenticate identity, expertise or observations. Inspect the actual report and release scope before integration.
7. Run the strict build. Preparation returns per-record bindings for inspection; it never invents receipts or promotes records. The authoring API is `implementationDigest`, `evidenceCodeHashes`, `legacyEvidenceSnapshot`, `canonicalEvidence` and `evidenceContent`; an interactive authoring tool is not implemented in this slice.

Local-only records are validated but not exported. Public output is `data/evidence.json` plus `data/evidence/<targetId>.json`; only exported targets receive an implementation digest in their existing collection detail shard. Catalog and individual payloads share the browser's 500,000-character limit. The empty registry therefore changes no existing collection shard or home payload.

The browser verifies catalog structure, payload SHA-256, target snapshot, current content and exact required review bindings. Artifact/code matching is enforced at build time; browser checks are consistency checks, not cryptographic authentication against a malicious publisher. Whole-site deployment must keep runtime, detail shards, catalog and sidecars from the same reviewed build.

Withdrawal exports only identity, revision, reason and date. Previous claims, sources and reviews are omitted from the public shard; the notice does not mark the underlying legacy idea withdrawn. The current builder still requires a valid canonical target and binding. Removal of the target itself, public-version archival and withdrawal across separate deployments remain broader stewardship work.

## Integration and limits

Use the [pinned rehearsal procedure](../integration/evidence-view.md), [verification checkpoint](../verification/universal-evidence.md) and [independent AI engineering review](../verification/universal-evidence-ai-code.md). The explicit production changes are confined to `assets/js/app.js` and `scripts/build.mjs` in the universal integration checkout. Existing content modules, prerequisite graph, accepted pilot artifacts, progress stores and active Wave worktrees are preserved.

Public new-exploration catalogs/routes, static metadata/sitemaps, note migration, public-version retention, professional/community review and actual learner/screen-reader observations remain separate work. No feature in this slice grants publication permission or converts an unobserved check into a pass.
