# Local atlas programme

The 23 October user clarification selects delivery on their computer. No hosting project or public deployment is required. The finished local package is installed under `/Users/teodev/Developer/atlas-local/`; open `Start Atlas.command`, keep its Terminal window open, and use the local browser address it prints. The launcher uses the installed Node.js runtime and binds only to `127.0.0.1`.

## What the local product contains

| Surface | Implemented scope |
| --- | --- |
| Existing atlas | Accepted 7,751-idea legacy library, existing interactive routes and 76 aliases |
| Breadth | 30 field orientations and 30 introductory routes |
| Depth | 30 curated extensions, 40 distinct focal targets, complete declared prerequisite paths with no missing IDs or cycles |
| Pilots | 24 current lessons across eight three-lesson families; 28 immutable retained editions |
| General studies | Four additional lesson identities, each in English and Spanish; eight current language pages |
| Study history | Both 1.0.0 and 1.0.1 retained for each study; 1.0.1 also retains the exact bibliographic/source-data snapshot |
| Connections | Three accepted local journeys with 11 exact lessons and three explicit external readings |
| Sources | Original coverage receipts and four bounded metadata records from Open Library and Crossref |
| Practice | Original paper-interlacing, phrase and explanation activities; explicit private note downloads |
| Operation | Durable bundle, desktop launcher, read-only loopback server, file integrity manifest and reproducible builders |

The total is **28 current authored local lesson identities** (24 pilots + four studies). Route associations, translations, historical editions and metadata records are not additional lesson identities. The Spanish editions cover the four new studies, not the entire library. Source descriptions retain their actual language and reading scope.

## Reproduce a new local version

Use Node 22 or newer from the integration checkout. Choose a new output folder; the builder refuses to overwrite an existing candidate.

```sh
node --test tests/local-program.test.mjs tests/catalog-observations.test.mjs tests/coverage-references.test.mjs tests/stewardship.test.mjs tests/introductory-curriculum.test.mjs tests/exploration-editions.test.mjs tests/notebooks.test.mjs
mkdir -p /path/to/new-local-home/releases
node scripts/build-local-program.mjs --out /path/to/new-local-home/releases/VERSION
ATLAS_PROGRAM_CANDIDATE=/path/to/new-local-home/releases/VERSION node --test tests/local-program-ui.test.mjs
node scripts/install-local-atlas.mjs --bundle /path/to/new-local-home/releases/VERSION --home /path/to/new-local-home
```

The installer creates a launcher, a standalone server, an operating note and `local-integrity.json` containing every packaged file hash. It refuses existing installation files. Retain the older installation or deliberately prepare a new home. It never touches the original checkout or another chat's server. The final programme builder preserves the prior candidate except six explicit entry-navigation additions; the preceding curriculum builder has its own five declared replacements.

## New subjects and editions

`program/studies.json` uses independent `s-…` lesson IDs, a real series ID, domain associations, source references, language text, reasoning tasks and transfer work. It does not borrow P01–P08 identities. More subjects can use this format without changing the eight pilot runtimes. New interaction methods still require a meaningful implementation and tests, not a nominal type label.

The language layer supplies actual text for each enabled language. Current interface support is `en` and `es`; adding a language requires its interface strings and complete lesson text. Native language labels, `lang`, `hreflang`, explicit version paths and English tags on source metadata are present. Translation does not imply a newly inspected source-language witness, cultural authority or professional language review.

After actual source/model checks, record a fresh receipt and freeze:

```sh
node scripts/freeze-local-studies.mjs --date YYYY-MM-DD --evidence docs/verification/NEW-RECEIPT.md
```

Changed content needs a new revision. Frozen bundles contain the original source descriptions, exact source-data snapshots in version 1.0.1 onward, runtime bytes, rendered language pages and author receipt. The archive refuses replacement or altered hashes. Later runtime changes do not rewrite earlier language pages. Current and retained study URLs remain available separately. Source/software claims are bound to their original edition, not silently refreshed.

The `depth` routes select accepted artifacts and compute dependency-first paths. The traversal reports unknown nodes and cycles rather than inventing prerequisites. Some initially considered advanced branches depended on unfinished Wave material; the delivered routes select supported alternatives without modifying those Wave dependencies. Complete declared closure is a graph property, not proof of pedagogical sufficiency or global subject coverage.

## Source federation

`program/federated-catalog.json` keeps provider identity, work/edition kind, actual capture dates and selected fields. Open Library's missing fields remain distinct from present empty fields. Crossref publication, online-publication, deposit and index timestamps remain separate. Equal titles never merge provider records; DOI identity is case-insensitive within the Crossref namespace. Subject strings do not acquire invented authority IDs or shelf locations.

Builds and readers use local snapshots and perform no network requests. A deliberately requested one-record lookup can be captured separately:

```sh
node scripts/lookup-source.mjs openlibrary /books/OL26429580M --out /tmp/new-candidate-record.json
node scripts/lookup-source.mjs crossref 10.1177/1529100612453266 --out /tmp/new-candidate-doi.json
```

Run only an appropriate bounded lookup; do not repeatedly refresh known captures or use the tool for bulk harvesting. A lookup is a candidate, never automatic acceptance. Non-JSON, oversized, failed or redirected responses stop without retry. No abstracts, cover art, source descriptions or work text are imported. Inspect the exact new metadata and applicable provider guidance before adding a record. Source metadata licensing does not license its underlying book or article. The new LOC SRU attempt timed out; no SRU adapter or recovered source is claimed.

## Notes, practice and continuing stewardship

Existing notebook stores and recovery workflows remain intact. Browser storage belongs to its origin; moving to a new local port does not move old notes. Use the existing explicit export/import workflow if desired. New study/practice notes are kept on the current page and downloaded only when requested. They are not placed in shared URLs, uploaded, automatically persisted or turned into a pass/certificate.

The practice activities and blank observation workflow are available locally. No external partner has been recruited, no consent recorded and no practitioner, learner or screen-reader session is invented. Those remain possible real-world activities, rather than software prerequisites or fabricated completion evidence.

Four source questions and eleven classification questions retain their recorded uncertainty. More knowledge, languages and situated traditions can be added through the implemented workflow. These are continuing editorial growth, not a claim that a finite installation has captured all human knowledge. Public release is outside this user-selected local delivery.
