# Coverage registry and classification crosswalk

**Version 0.2.0 · October 22, 2026 · U1 planning inventory.**

This registry gives the broader atlas a concrete inventory without changing its production catalog. It contains **30 domains, 85 primary collection mappings, eight cross-listings, 217 classification entries, and eight researched pilot briefs (two now have working prototypes)**. Twenty domains have an existing primary collection; ten have none. A foothold is not evidence that a domain has introductory or advanced coverage.

The original 13 runtime fields, collection IDs, chapter assignments, accepted manifests and production ledgers remain authoritative. These files are not loaded by the website, build or content acceptance process.

## Files and contract

| File | Purpose |
| --- | --- |
| [registry.json](registry.json) | Domain scope, aliases, questions, methods, gaps, candidate collections, representation gaps, proposed stewardship, collection mappings and classification crosswalks |
| [classification-inventory.json](classification-inventory.json) | Pinned external code universes, editions, scope levels, source IDs and identifier hashes |
| [sources.json](sources.json) | 42 source receipts, exact locators, access limits, rights plans, conflicts, stopped candidates and dataset hashes |
| [Pilot records](../pilots/pilots.json) | Eight stable pilot IDs, brief paths, domain/source links, contexts, open gates and unassigned review roles |
| [Pilot index](../pilots/README.md) | Bounded topics, sequencing and review work |
| [Validator](../../scripts/validate-coverage.mjs) | Executable version-1 contract and semantic consistency checks |
| [Tests](../../tests/coverage-registry.test.mjs) | Preservation of coverage, code universes, references and planning/acceptance distinctions |

The JSON files use `schemaVersion: 1`. The validator is the executable contract; there is no separate JSON Schema claiming constraints it does not enforce. Version 0.2.0 adds an explicit prototype state with content/preview paths for P01/P02. It still rejects production-acceptance claims in the planning registry. `reviewed-local` with `localReviewStatus` and `reviewedRevision` records a completed local preview review separately from the production `accepted` flag, which remains false. The executable exploration contract and exact receipts establish the local review result. Exact-content independent review belongs to the exploration contract. Changing an inventory edition still requires explicit pin/crosswalk review.

Collection relationships are `primary`, `cross-listed` or `reference-only`. Every current collection must have exactly one primary home; the same collection/domain pair cannot be repeated. The eight additional mappings are navigational footholds, not evidence of whole-domain instruction. There are no reference-only collection mappings yet. Candidate IDs such as `D10-C01` are planning proposals, not runtime collection IDs.

Domain sources are classified honestly: most are classification/discovery seeds. Only the bounded pilot topics have new topic-specific bibliographies. No one has independently reviewed 30 whole-domain syllabi.

## What the external crosswalk covers

| Inventory | Audited level | Entries | Access and limit |
| --- | --- | ---: | --- |
| UNESCO ISCED-F 2013, detailed descriptions published 2015 | Appendix I possible four-digit codes, printed pp. 54–58 | 149 | Text extracted and all five table pages visually inspected; includes residual codes and 9999 |
| OECD FORD, Frascati Manual 2015 | Table 2.2 second-level research fields | 42 | Table text read; later PDF download returned 403 and stopped; no pixel verification claimed |
| Library of Congress Classification | Main-class outline | 21 | Indexed outline; subclasses and schedules not audited |
| UNESCO living heritage | Five broad domains | 5 | Indexed descriptions; later CAPTCHA stopped body access; identifiers are local slugs, not official codes |

The [UNESCO publication hosted by KSH](https://www.ksh.hu/docs/osztalyozasok/keor/isced-f_2013_eng.pdf) controls the education inventory. A [Finnish reference table](https://www.oph.fi/sites/default/files/documents/isced-codes_0.pdf) repeats 0731 and 0910 where the UNESCO table has 0730 and 0920, and includes 0549/0739 absent from the pinned edition. These are recorded discrepancies; they are not silently merged. The UNESCO publication credits UNESCO-UIS, 2015, ISBN 978-92-9189-179-5, and states CC BY-SA 3.0 IGO. This registry retains code identifiers and supplies its own editorial mappings.

**137 entries are mapped, 79 remain review-needed, and one is explicitly excluded.** The exclusion is ISCED 9999, an unknown-field administrative code. “Mapped” means that an editorial home exists. It does not mean the source category is taught, the mapping has specialist approval, or humanity's knowledge has been enumerated. Residual/interdisciplinary categories retain broad candidate homes; the living-heritage mappings retain an access/context review flag.

These inventories intentionally have different granularity. Do not compute a blended coverage percentage from their 217 entries. Future audits can add detailed library schedules, local classifications and community vocabularies with their own versions; never pretend those are covered already.

## Validation

Run from the repository root:

```sh
node scripts/validate-coverage.mjs
node --test tests/coverage-registry.test.mjs
```

The CLI imports only field and collection metadata through `loadRegistry()`. It does not import chapters or syllabi, update accepted counts, generate site files, or write to any worktree. It verifies all 85 primary homes, classification disposition completeness and pinned identifier hashes, known references, brief files, reciprocal pilot/domain links, and the separation of planning from acceptance. The focused tests inject omissions, duplicate mappings, unknown IDs, blocked sources and false acceptance states.

Passing validation establishes structural consistency, not historical, legal, medical, linguistic, practical or pedagogical correctness. The named expert roles remain unassigned. A source's `body-read` receipt applies to its named passage, not to the whole work or every hosted asset.

## Updating the registry

1. Research a bounded gap and record sources, editions, access and rights before proposing a collection.
2. Add or revise a candidate and crosswalk rationale. Keep the canonical collection/item identities and production-ledger ownership.
3. For a new runtime collection, update its single primary mapping and the declared baseline together; retain justified cross-listings.
4. For a new classification edition, inspect the relevant tables and change the inventory, hash pins and crosswalk in one reviewed change.
5. Keep content acceptance, visual redesign, accessibility review and learning evaluation in their proper ledgers. Never infer them from this registry.
6. Run the two focused checks; integrate through the existing local handoff only when the active chat owners reach their boundary.

The [schema/URL contract](../architecture/universal-schema-urls.md) is delivered and two local prototypes are implemented with resolved text-source/reuse scope. Independent reviewer capacity and publication gates remain open. Both new-format draft slots are occupied; keep the two-draft limit. Follow the [master-plan handoff](../master-plan-handoff.md).

## Preservation boundary

The U1 registry work is extended by an isolated U2 prototype package in the root checkout: `explorations/`, generated `labs/atlas/` previews, the draft builder, focused tests and supporting documentation. Original production content, runtime and generated production data remain untouched. This task does not write to either active worktree or send instructions to those chats.

“Expand the waves” continues in `/Users/teodev/.codex/worktrees/wave-six-expansion/theorems-visualizations`. “Improve wave5 and wave6 visuals” continues in `/Users/teodev/.codex/worktrees/wave-visual-redesign/theorems-visualizations`. Their ledgers may advance while this work runs. The master plan's dated production baseline is not overwritten with guessed live counts.

No push, PR, merge, deployment, mass syllabus generation, independent content acceptance or performance work is part of this U1/U2 delivery.
