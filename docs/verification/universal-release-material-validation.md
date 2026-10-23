# Release-material validation checkpoint

Local repair verified on 22 October 2026, against complete predecessor `d11438852c631528b6f27d8107f025e9bf677b7e`. Edition and domain release validators now require each material's exact identity, type and cardinality. Combining two required source/material IDs into one field no longer satisfies two separate decisions. Reordered valid materials remain accepted. No reader page, source content, browser code, review receipt or real release ledger changes.

## Reproduction and verification

[The integration delta](../integration/release-material-validation.md) pins two replacement preimages and five additions. Run:

```sh
node scripts/check-release-material-integration.mjs
```

Passing Node 22.23.3 archive report: `/var/folders/29/bzg0zx0d7jjbyf60_3cjch440000gn/T/atlas-release-material-integration-L0fJea/report.json`. Its two targeted regression groups reproduce the original missing-rejection failures on the unmodified predecessor. After the exact replacements, **40 scoped groups pass**: six material-validation, ten edition, eleven domain-navigation and thirteen journey groups, with no failures, cancellations or skips. Those same forty groups also passed in the integration worktree before the archive rehearsal; the archive supplies a separate reproducibility check, not forty new distinct requirements.

The new tests cover 36 release selections: four exact retained editions (including supplements), all 30 individual domains, all domains together and a two-domain subset. They verify 72 valid material orders, reject 110 adjacent comma-combined pairs and 216 missing/repeated/unknown/non-string material lists. All 36 selections also reject stale live delivery decisions, retain valid historical withdrawal, and reject malformed material decisions even when followed by withdrawal. Fixtures and reviewer identities exist only in memory; no actual permission or independent review is implied.

Strict legacy build and static validation pass with zero errors/warnings: 7,751 accepted ideas, 531 authored chapters, 85 collections, home catalog 123,750 bytes gzip. Static validation does not execute stopped visualizations or revisit remote sources.

## Complete generated-output parity

| Candidate | Files compared | Byte-identical files | Allowed differences |
| --- | ---: | ---: | --- |
| Local preview | 10,480 | 10,477 | Three build reports, binding fields only |
| Empty real release | 10,415 | 10,412 | Three build reports, binding fields only |

The reports are `edition-build.json`, `navigation-build.json` and `journey-build.json`. All non-binding report fields also match. Every generated HTML, CSS, JavaScript, source payload, catalog, asset, data file and route remains byte-identical. Browser behavior is unchanged by this server-side validator repair; no native suite was rerun or new human observation claimed. The earlier browser evidence remains historical for the identical reader bytes.

Preview still contains four retained local explorations, 30 domain orientations and three unaccepted journey candidates; zero new lessons. Real edition/domain/journey ledgers are empty. Empty release emits no new-format lesson, domain or journey payload. The checker preserves **6,093 unrelated committed source files**, changes only the two declared source files, and retains all earlier manifests/review evidence. Four roadmap documents are separately reconciled by the integration owner.

| Replacement | Preimage SHA-256 | Current SHA-256 |
| --- | --- | --- |
| `scripts/exploration-editions.mjs` | `80a90b689fa867ae1beadf6528213bc312db82e873a971c4a4e31014b0c8aa8e` | `8b149076a46b93672745133b77aa8f95b61aacc98b233673e87e9be0f8143a99` |
| `scripts/domain-navigation.mjs` | `b71b38bac79298c6c961c8fcb4c88db7d948580d6fac613d36becac9b23746f1` | `5f651c0ac8b53e6d73bc0b97c683ca75618ba7d0bf09b0df36a8c767b11201ed` |

| Delivery binding | Historical digest | Current digest |
| --- | --- | --- |
| Edition delivery | `ea887f6127fba1c23ea8f5d1fb83f40e8f762be1e49459bddc9aee1f0fb1a309` | `5748790774a7711051c19ca0afaf66042c22635a1f0603649e530d233988daa3` |
| Domain navigation | `5717f96499c09be3c025bbb3942d52be7691143715f64a34b132d5e92485fddb` | `69fe9aa5990324d24bebc482197b319eb4003f2aaa35e4614ee6d5c38a474f23` |
| Composed journey delivery | `43a976946250477f0fa8ed7b344101fa2b8e3085bb606ba9d66a96fb4bd46605` | `76bfce0034c3eeb09e09e84db31f92f8d3417c91444daba349a77e2cb50dcbdc` |

Accepted source editions, frozen browser-runtime/content review artifacts, original orientation artifacts, and journey research remain unchanged. Delivery fingerprints change because validation code is part of the execution dependency closure. The prior exact-artifact delivery reviews remain historical; rendered-output parity does not transform them into approval of the new validators.

## Evidence logs

All logs are in the report directory. `EXPECTED_FAILURE` is the scoped predecessor reproduction, not an accepted failing current build.

| Log | Result | SHA-256 |
| --- | --- | --- |
| `legacy-build.log` | PASS | `01b6258791323660e97ff459cdcc90c3f7ec777da602ae1d18f01a3698480b22` |
| `legacy-static.log` | PASS | `c07e324eb26f65dff0249591e823fd193fa07b34d0d1b1413a466c7a580dc543` |
| `predecessor-regressions.log` | EXPECTED_FAILURE | `af3ff190563952dfe5b5ee17f9696abc2afde2b1454c7d82649075387a7e57ad` |
| `before-preview.log` | PASS | `b761523b5853cee1b83d2da1e8b11650ac26bf8937c6a221a65efa5759b3426d` |
| `before-release.log` | PASS | `ac6b9dca6d490ba7263af54cf812bad6a51da79f6b704b66081f6b873d588af1` |
| `current-offline.log` | PASS | `a00510edd527b30ff09cce47c2b7966ff7417461f6ba14477b1f261bd9c193e2` |
| `preview.log` | PASS | `03c77114ca88311f98881bee9592c0cde36e56976a92d96ef0006fc0b97692e5` |
| `release.log` | PASS | `bb63812e2a2d28006e2cbc7542ed9275a585370d3192d5ba49b1b33395cb60b1` |

After these tests, only this checkpoint prose was finalized. `/var/folders/29/bzg0zx0d7jjbyf60_3cjch440000gn/T/atlas-release-material-integration-L0fJea/final-reconciliation.json` records final addition/replacement/document hashes and a repeated predecessor-source comparison. It does not imply the final prose was present during earlier execution. The original report is preserved.

## Open work and preservation

Final independent engineering review remains open after the previously recorded reviewer-service rejection. That invocation was not retried or redirected; this repair is author work with executable evidence. Review of the new delivery bindings, real material/distribution decisions, actual human/professional checks and deployment/cache handling remain separate requirements. No public release is authorized here.

The original-checkout audit checked 3,222 baseline files; only the previously authorized handoff pointer differs. All three Wave checkouts retain frozen chapter assignment digest `3a53e3ae4a663e1298f411760dd9b633b6e77a8511b50384928858cb427251af`; their own heads may advance. Details: `/tmp/atlas-release-material-preservation-20261022.json`. No Wave, dashboard, other-chat, source-stop or private-note operation was performed.

The whole U0–U5 goal remains active. Independent roadmap work can continue on the eleven retained classification gates and the documented curriculum/sequence preparation gaps while exact engineering and actual specialist/human evidence are pending. No missing observation or review is recorded as a pass.
