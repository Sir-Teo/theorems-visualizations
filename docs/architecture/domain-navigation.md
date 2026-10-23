# Broader domain navigation

The local navigation candidate connects the 30 reviewed orientations to 85 distinct legacy collections and four accepted exploration identities. A field card offers its first question, methods and available starting routes. Search combines words, method and collection/edition/external-reading availability; it stores no history, notes or query parameters. Every card and full orientation remains readable without JavaScript.

This is an additive adapter over the original orientation and edition builders. It preserves the original authored questions, territory, source sections, reading limits, gaps and proposed stewardship roles. It changes delivery links and surrounding navigation. Craft/performance drafts are excluded from delivered edition links. Collection cross-listings do not create duplicate collections or lessons; a collection-level link does not establish coverage for every item.

## Routes and preserved inputs

| Candidate route | Purpose |
| --- | --- |
| `domains/` | Available field cards and optional filters |
| `domains/Dxx/` | The exact current reviewed orientation, or a minimal withdrawal notice |
| `domains/about/` | Source-review and delivery limitations; always noindex |
| `domains/catalog.json` | Available route metadata and distinct counts; no private state |
| `ideas/collections/<id>/` | Existing collection directory, with primary/cross-listed field backlinks |
| `explore/<id>/` | Existing delivered exploration identity and its retained editions |

The root shell, reading index, collection directories and exploration HTML receive guarded, explicitly reported navigation additions in a fresh output only. Individual legacy idea/alias pages and the frozen exploration runtime are unchanged. Earlier `reading-build.json` and `edition-build.json` describe their predecessor stages; `navigation-build.json` records subsequent link additions with before/after hashes. The original `labs/atlas/domains/` source preview is untouched.

The navigation binding extends the complete edition delivery inventory with the five new render/build/style/UI/filter inputs, original orientation code, full registry/catalog/source data, exact original review receipts and edition manifest/release ledger. This binds the joined context and detects changes during assembly. `navigation/releases.json` is excluded from its own approval binding to avoid self-reference; each ledger decision and referenced evidence file is separately hash-bound and confined to the checkout.

## Release and withdrawal

Preview emits all 30 reviewed local orientations and no canonical domain URLs. The real navigation and edition release ledgers are empty. Release mode therefore emits no domain pages/assets/links and no new-format lessons. A `--base-url` is required in release mode, forbidden in preview, and is not itself authorization.

A publish event references an exact JSON decision with selected IDs/revisions, catalog version, selected-source digest, full source artifact digest, complete navigation digest, clean canonical base, authorizer/date/scope, and independent engineering plus source/editorial/software distribution evidence. Material records specify basis, territories and scope. The implementation validates structure, reviewer separation and exact evidence hashes; it cannot certify credentials, actual grants or the truth of a declaration. Those remain substantive responsibilities of the actual release decision. Synthetic test fixtures never enter the real ledger.

Partial releases include only their selected orientations; unavailable neighbors become identity-only nonlinks. A withdrawal requires a previous publication, reserves the identity, and omits former title/body/sources from new outputs and cross-navigation. Withdrawn pages have no canonical entry. All-withdrawn output retains only generic context and notices. Host replacement, removed-file cleanup and cache invalidation remain deployment responsibilities.

The source orientation contract currently supports catalog 0.1.0 and its current revisions. Historical decisions still require the current source digest/artifact/revision. A changed orientation revision needs explicit reviewed ledger migration; this adapter does not promise an immutable archive of all past orientation revisions. A withdrawn revision cannot be silently republished. New lessons, revised methods, languages and situated/community routes require their own source and acceptance work.

## Verification and limits

The [integration package](../integration/domain-navigation.md) composes the prior notebook package without modifying it. The [verification checkpoint](../verification/universal-domain-navigation.md) separates source preservation, offline contracts, browser behavior and independent AI review.

No fresh remote-source retrieval, expanded rights grant, human observation, professional/community approval, new accepted lesson or deployment is supplied. Existing source stops and reading limitations remain authoritative. Private notes stay under the existing revision stores; merely browsing domains never copies or migrates them.
