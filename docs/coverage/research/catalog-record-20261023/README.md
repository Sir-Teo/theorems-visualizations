# Catalog records: observed labels, classifications and missing authority

Prepared 23 October 2026 for the `shelves-and-headings` research card. The [packet](packet.json) selects three Open Library records and pins their captured bytes, revisions and exact field positions. It is preparation for introductory information literacy, not an authored lesson, cataloging approval or a new accepted mapping.

| Observed record | Subject field | LC-classification field | Scope |
| --- | --- | --- | --- |
| [Work OL55649W](https://openlibrary.org/works/OL55649W.json), revision 82 | 75 strings; six selected | Absent | Work-level metadata; no automatic transfer to an edition |
| [1854 edition OL26429580M](https://openlibrary.org/books/OL26429580M.json), revision 3 | Two strings, both selected | Absent | Metadata reports this publication date; no physical copy inspected |
| [Edition OL34549556M](https://openlibrary.org/books/OL34549556M), revision 3, selected at `/entries/5` of the [ten-entry response](https://openlibrary.org/works/OL55649W/editions.json?limit=10) | One string | `PS3048.A1 2018` | Reported catalog value; no schedule edition or shelf location established |

The ten-entry response reported 1,140 editions, but only its first ten entries were inspected. The selected illustrated edition reports publication in 2018. An earlier discovery-selected 2019 edition had no LC-classification field and was not carried into the packet. No work/edition mismatch is repaired by borrowing metadata from another record.

The work selection includes both `Wilderness areas` and the distinct observed spelling `Wildnerness areas`, as well as `Fiction` and `Nonfiction`. These are catalog strings, not verified judgments about the book. The packet preserves them without correcting spelling, merging terms, or concluding that an apparent inconsistency is resolved. The record supplies no inspected authority identifier or per-label language for those strings.

The [MARC 650 field documentation](https://www.loc.gov/marc/bibliographic/bd650.html) distinguishes topical subject access and its thesaurus/source context, including a source-not-specified indicator. That explains why the word “subjects” alone cannot establish LCSH authority. It does not make the Open Library JSON a MARC record. The [Department of the Interior catalog guide](https://www.doi.gov/library/catalog/help) separately describes subject discovery and a holdings/call-number display; that institution's October 2022 guide supplies context, not Open Library holdings evidence.

## Proposed preparation tasks

1. Identify which record contains the reported LC value and which contains two subject strings. Explain why their shared work link does not permit combining them into a single observed record.
2. Compare a missing field with a present empty array. The captured records establish absence of the property, not that no classification exists elsewhere. The checker retains that distinction.
3. Explain why two identical-looking labels, a spelling variant or a field named `subjects` cannot supply an authority identifier. Keep a record-local observation until the required authority evidence is inspected.
4. List the additional evidence needed to locate a physical copy: institution and holdings context, rather than the reported classification alone. A cataloging reviewer must settle the final task and rubric before it becomes an assessed lesson.

These prompts are original preparation notes. No learner attempted them and no learning outcome is claimed. The intended same-record example combining multiple controlled headings with verified classification/holdings remains unfilled. The three-record comparison makes that missing evidence explicit rather than pretending to satisfy it.

## Reproduce the selections

From the repository root, using the captured files:

```sh
node scripts/catalog-observations.mjs --source-dir /tmp/atlas-catalog-record-20261023
node --test tests/catalog-observations.test.mjs
```

The checker verifies byte length/hash, list position, record identity/revision, absent/present fields and selected values. It never fetches a source. Temporary captures are not bundled; the exact selected observations remain in the committed packet. This differs from the prior [authority-reference adapter](../../../../coverage-references/README.md): observations with unknown authority or schedule edition are not imported into its classification/heading lists.

Only selected factual metadata and original notes are included. The [Open Library data FAQ](https://openlibrary.org/help/faq/using) describes public-domain donations and requests CC0 contributions; its [licensing page](https://openlibrary.org/developers/licensing) also retains possible existing-rights and jurisdictional qualifications. Neither is a blanket grant for books or cover art. No book text, cover, scan, description or third-party blurb is reproduced. Actual distribution remains a separate decision.

The LOC MARC 050 page and item 11023889 returned HTTP 403. They were not retried or recovered elsewhere; search-result discovery of the latter is not an inspected catalog body. An Open Library search URL was unsupported by the web tool but returned HTTP 200 through a normal public API request; this was not a denied endpoint or challenge recovery. The API calls were bounded metadata research, not a catalog crawl or ongoing data service.

Required next evidence: a suitable institutional record and exact authority context, current cataloging review, intended audience and final rubric, and any applicable artifact/access/learner/release work. Both unaccepted pilot slots remain occupied. Existing source-review and canonical registry bindings stay unchanged.
