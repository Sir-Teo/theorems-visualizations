# Exploration editions and delivery

October 22, 2026. An additive U3 implementation, separate from the six local prototypes and the [legacy reading candidate](static-reading.md). It introduces retained edition artifacts, candidate routes and a release ledger. It does not deploy or grant rights.

## Two independent decisions

Source acceptance belongs to the existing exploration contract. Four records have current bounded AI receipts: history/literature 0.1.2 and philosophy/agriculture 0.1.0. Craft/performance remain unaccepted. No record, original renderer, browser code, stylesheet, review receipt or local preview is changed by this package.

Delivery belongs to the new edition contract. `editions/manifest.json` lists exact immutable bundles; `editions/releases.json` records explicit public-distribution and withdrawal decisions. **The real release ledger is empty.** Source JSON retains `publication: local-preview`; that label describes its source-review scope. A separate delivery approval can never be inferred from it. Public assembly requires a ledger decision bound to the bundle, delivery code and canonical destination, including every source, editorial material, runtime and supplement. Actual deployment still requires user authorization.

The decision must name the authorizing person/date/scope, independent material reviewers, territories/bases/scopes, an independent engineering review and exact evidence-file hashes. The delivery digest covers the current execution dependency closure and complete copied legacy shell/assets/content/data inventory, not just the new adapter. Only `generated` fields in `data/index.json` and `data/home.json` are normalized; all other delivered input bytes bind exactly. Receipts can attest only what their named reviewers actually checked; a parser cannot verify credentials, grants or authorization. The release owner must inspect that evidence. No real decision or new professional/human approval is created here. Synthetic unit decisions are fixtures only.

## Retained artifacts

`scripts/freeze-exploration-editions.mjs` checks the current preview build and its exact receipts, then freezes accepted records only. The bundle retains the source record, related collection labels, validation context, complete rendered preview, source/artifact digests, review evidence text and hashes, runtime identity and necessary supplements. The runtime snapshot contains all 13 original review-bound sources; delivery copies only the ten browser dependencies, never Node authoring code. Older files are preserved and byte changes at a retained identity/revision are refused. A changed lesson requires a new reviewed content revision. Run `--check` to verify the current source checkpoint without writing.

The four initial bundles share one frozen runtime. Agriculture additionally retains the exact Python reproduction script and offers its matching record under the directory layout the script expects. Its input CSV must be obtained separately from the cited upstream source and match the pinned hash. Neither the original dataset nor arbitrary editorial documents are copied.

The archive is format version 1. Validation currently supports the implemented exploration contract; a future incompatible contract needs an explicit version adapter. Retaining bytes is not a promise that every future runtime or browser will execute them indefinitely. Old source-review evidence remains historical and inspectable.

## Routes and state

| Route relative to deployment base | Behavior |
| --- | --- |
| `explore/` | Catalog of current editions; preview or release scope stated explicitly |
| `explore/<id>/` | Identity and edition history; no automatic redirect or saved-state application |
| `explore/<id>/versions/<revision>/` | Exact retained lesson and runtime; share links remain revision-specific |
| `.../reproduction/` | Agriculture's frozen script/record and instructions |

The delivery adapter changes navigation, asset paths, edition notice, description and release metadata around the frozen preview. It preserves every source/activity field and the entire browser payload. Unknown shell structure or an unretained documentation link fails. This adaptation is an additional engineering review surface; the old artifact receipt does not implicitly review new delivery chrome.

Notes keep `atlas.exploration.v1.<id>.<revision>`. On the same browser origin, the original local preview and its matching delivered edition share that existing revision store. Another origin has a different browser store. There is no server synchronization or automatic cross-revision copy. Existing earlier-note export remains available; explicit reversible migration is still roadmap work. An identity page does not reinterpret an old hash against the latest activity. Native share links created inside an edition already include its immutable path.

Versions use canonical three-part numeric revisions, sorted numerically. A second approval for the same bundle may rebind changed delivery code; it cannot replace the content or make an older revision current. Each identity counts once. Previous published versions remain individually addressable and canonical; a withdrawn highest revision does not silently fall back to another one.

## Preview, release and withdrawal

Preview assembly includes the four retained accepted sources, marks all exploration pages noindex, and supplies no canonical URL or sitemap. It excludes the two studio drafts and does not turn previews into public lessons. The existing legacy companion is assembled by the preceding frozen-inventory builder.

Release assembly includes only ledger editions with exact distribution decisions and an explicit canonical base. Canonical metadata and sitemap entries cover active identity pages and live editions only. With the real empty ledger, it produces no new-format lesson, runtime or canonical exploration URL. Release-mode assembly is still a local operation.

A withdrawal must reference a previously published immutable edition and a named withdrawal decision. The new output retains its identity/version tombstone, safely escaped reason and version list, omits former title/text/activity/record/supplements, removes its sitemap entries, and copies no runtime solely for that withdrawn edition. That revision cannot be republished; a corrected release needs a new revision. Other live versions retain their independent status. Source archives and approval history are not erased.

All builds use a new output directory outside the source checkout. No existing output is updated in place. Public rollout must replace the complete deployed directory and account for host/CDN caches; copying a tombstone over an old directory would leave stale payloads behind. The builder neither performs nor certifies cache purge, takedown, external archives or deployment.

## Commands

```sh
node scripts/freeze-exploration-editions.mjs --check
node --test tests/exploration-editions.test.mjs
node scripts/build-exploration-editions.mjs --out /absolute/new/preview
node scripts/build-exploration-editions.mjs --mode release \
  --base-url https://example.org/project/ --out /absolute/new/release-candidate
```

Use the actual verified deployment base for a real release decision, not the illustrative address. The [integration procedure](../integration/exploration-editions.md) and [verification record](../verification/universal-exploration-editions.md) retain exact evidence and limitations.
