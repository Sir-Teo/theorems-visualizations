# Catalog-observation preparation verification

Date: 2026-10-23. [Research packet and tasks](../coverage/research/catalog-record-20261023/README.md). This advances the shelves-and-headings preparation card with actual bounded catalog evidence and an explicit unresolved example requirement.

## Results

The source-dir checker passes against three captured Open Library JSON bodies: one work record, one individual edition and one edition at `/entries/5` of a ten-entry response. Captures are pinned by byte length and SHA-256. The work has 75 subject values with six selected; the 1854 edition has two, with both selected; the 2018 illustrated edition has one selected subject and one reported LC-classification value. No work-level value is inherited into an edition.

Five author regression groups pass, no failures/skips. They check missing versus empty fields, repeated/spelled-as-observed subject values, null authority and language, work/edition separation, unknown schedule/holdings, malformed inputs, changed raw bytes, wrong entry locators and altered selected observations. The checker is offline and does not grant cataloging approval. Actual raw captures remain local at `/tmp/atlas-catalog-record-20261023/`; selected metadata remain committed.

Source/editorial review by a separate AI reviewer confirmed the three capture bindings, IDs, revisions, titles, dates, work links, subject counts/positions/spelling and absent/present classification fields. Local MARC650 and DOI-guide bodies support their bounded contextual notes. The reviewer suggested explicitly mentioning MARC650's source-not-specified indicator; the author made that clarification. Open Library FAQ/licensing pages were author web-body readings, not independently reverified by the reviewer. No independent code review, source retrieval or professional approval was performed by that reviewer.

- Final packet SHA-256: `a1ae1bc30ed7825626c7a114b9b1ff44c7526faf2fcdeead86ee14df69c480c7`.
- Helper SHA-256: `3d085167765916e71a9f15fc8839bb1340d9e10ec248015ebb6de1aefcaa7f64`.
- Tests SHA-256: `d0eb676db54962771b66f5405f570b31a5bf97e115aa09d4ae5ca3a952c94c39`.
- Local result: `/tmp/atlas-catalog-record-20261023/check.json`.
- Local regression log: `/tmp/atlas-catalog-record-20261023/tests.log`.

## Scope left open

This is not the desired single institutional record with multiple verified controlled headings and shelf/holdings context. Exact authority identifiers, a schedule edition and actual holdings are missing. Consequently zero authority or canonical classification records are imported. A cataloging reviewer, final rubric and applicable later artifact/human/distribution decisions remain open. Five passing tests do not settle those questions.

Only selected factual catalog metadata and original notes are bundled. Open Library's public-data/CC0-contribution description is recorded alongside its existing-rights qualification. No text, covers or scans of the books are copied. New LOC403 stops for MARC050 and item11023889 are retained and not recovered. Earlier stopped works and the rejected engineering-review operation are untouched.

No previous adapter, canonical source, runtime, release ledger, lesson or dashboard input is modified. The three manual roadmap pointers do not alter source-review digests. This later package is outside the pinned complete candidate and creates no extra pilot slot or accepted lesson.

The reviewer rechecked the final MARC650 clarification and final packet hash. Reversing only that finding reproduced the initially reviewed packet hash `84be58301d7cc5214888092d7db900a86ff4797b72a259f5ae267d7f25a225d2`, confirming no other packet edits in that follow-up.

Read-only preservation checks find only the three intended roadmap-pointer changes among tracked integration files; all earlier code/research/registry files remain unchanged. The original checkout's 3,222-file baseline differs only by the previously authorized handoff pointer, and all three Wave chapter-assignment digests remain frozen. Exact observed heads are in `/tmp/atlas-catalog-record-20261023/preservation.json`.
