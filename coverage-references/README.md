# Versioned classification and subject references

This research adapter implements the first platform step in the [library/context packet](../docs/coverage/research/library-context-20261022.md). Its generated [reference bundle](library-context.json) preserves 35 selected LCC outline rows, seven archived May 2024 schedule rows and eight historical Xwi7xwa comparison rows. These are **50 reference rows across different evidence layers**, not 50 independent subjects or new canonical mappings.

## Identity and meaning

Classification identity is the exact tuple `(kind, scheme, variant, edition kind, edition value, code)`. JSON tuple encoding prevents delimiter collisions. Case and spaces in codes are preserved; no automatic normalization merges distinct source values.

| Adapter namespace | Evidence retained | Limit |
| --- | --- | --- |
| `lcc / subclass-outline` | Retrieval snapshot dated 2026-10-22 | A reading snapshot is not an official edition or full schedule |
| `lcc / full-schedule` | Archived May 2024 selection | No current item-classification claim |
| `brian-deer / xwi7xwa-british-columbia` | Local public scheme dated 2018-03-28 | Historical local variant; no universal equivalence or current community-vocabulary claim |

These adapter labels are editorial identifiers. Every row retains its exact original object and a JSON pointer into the hash-bound research packet, including the original scheme label, editorial scope, candidate domain routes, source ID, page locator and status. All twelve source receipts and eleven retained classification gates are carried forward unchanged. Their access, evidence and reuse limits remain applicable. No source body is retrieved or redistributed by this adapter.

Bare `S` is deliberately insufficient: the LCC outline and historical local scheme have different identities and candidate routes. Neither their equal code strings nor overlapping atlas domain suggestions establish equivalence. The adapter performs no cross-scheme inference or canonical registry update.

Subject headings are a separate reference kind keyed by authority, edition and stable identifier. Labels carry declared language separately; identical text cannot merge different authority records, and a changed label does not itself create a new identity within the same authority edition. This is identity handling, not a translation, language-tag or authority-record validator.

The resource-reference helper requires catalog plus record identity and two separate arrays: classification references and subject-heading references. It permits several headings without treating them as shelf placements. It checks reference resolution, not cataloging correctness or physical location. Current `subjectHeadings` and `resourceRecords` are empty: there is no inspected catalog record or imported community vocabulary. Tests use explicitly fictional records and labels.

## Reproduce and extend

From the repository root:

```sh
node scripts/coverage-references.mjs --check
node --test tests/coverage-references.test.mjs
```

`--check` compares the complete generated object with the exact current input packet, including all preserved limits and rows. `--write` regenerates only `coverage-references/library-context.json` and must be followed by diff inspection and scoped review. It does not fetch sources, accept changed input or grant permission. It is not connected to the production build, navigation or dashboard.

Before importing a real catalog record, select the exact record and authority edition, establish lawful use and intended audience/current vocabulary, retain distinct classifications and headings, and obtain the required cataloging/context review. No broad class label licenses a practical lesson, recording or community asset. Community authority, reuse decisions and publication remain separate evidence; the adapter does not issue community labels.

Future canonical mapping changes require a separately reviewed registry/orientation revision. Existing bound inputs, source stops, pilot slots and release ledgers remain unchanged. This addition is outside the pinned [complete integration candidate](../docs/integration/master-plan-candidate.md); see [integration instructions](../docs/integration/coverage-references.md).
