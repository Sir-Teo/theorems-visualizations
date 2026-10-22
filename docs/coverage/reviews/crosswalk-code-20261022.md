# Independent AI engineering review — classification registry 0.3

October 22, 2026. Reviewer: separate Codex AI engineering reviewer `code_review`, independent of the implementation author. Read-only candidate review against baseline `0317c54a`; no browser, authored edits, other chats or external source retrieval.

## Actionable finding

**P2 — file-receipt validation throws on malformed metadata.** In `scripts/validate-coverage.mjs`, `validateClassificationReviewFiles()` assumes receipt lists and entries have already passed structural validation. Replacing batch.receipts with `[null]` throws `Cannot read properties of null (reading evidencePath)`; replacing it with `{}` throws a non-iterable TypeError. The CLI invokes this helper even when `validateCoverage()` has accumulated malformed-receipt diagnostics, so these inputs replace useful errors with a generic exception. Guard arrays/object entries inside the file helper and add tests that call the file helper with malformed receipts (the existing malformed-metadata test exercises only pure validation).

Initial engineering result: changes requested for this diagnostic robustness defect. No reviewed mapping, source-receipt or digest-binding defect established.

## Independently verified digest and methods

Current exact classification-review digest independently recomputed:

`5103e5a69c8510c3bcfd5d5c754cd0e80375b9c50eb09dfc5ad38c063d918343`

Read validator and registry/source/test deltas. Independently ran `node --test tests/coverage-registry.test.mjs` with Node 22.23.3: **26/26 passed**, zero failures/skips/cancellations. Performed the two in-memory malformed file-helper reproductions above without editing source files.

Independently counted batch scope: **79 keys / 79 rows**, **68 mapped / 11 review**; the 11 review routes comprise six FORD and five ICH entries. Batch remains pending with zero receipts at this checkpoint. The four inventory count/hash pins remain the unchanged 149/42/21/5 contract.

## Inspected contract properties

Digest canonicalization binds registry version/routing policy/kind definitions; batch identity/author/baseline/scope; selected crosswalk rows including routing/review basis; involved pinned inventory editions/codes; relevant classification-source access receipts; and used domain title/scope/exclusions. Status and later receipts are excluded to avoid self-reference. Unrelated pilot next actions are excluded. Changing reviewed mapping/domain/source-access/edition metadata invalidates matching receipt digests, as passing regressions demonstrate.

Routing kind and scope are checked against code-derived semantics, rather than just a free-text rationale. Unknown routes remain excluded and provisional ICH routes remain in review. Bidirectional row/batch scope checks catch dropping a tagged row from review scope or binding a scope key to another batch. A reviewed batch requires matching current source-routing and engineering receipts from separate independent AI identities distinct from the batch author. Evidence paths are constrained to the review directory; file checks require existing text naming the exact receipt digest. These structural checks do not certify source expertise or the truth of a report's assertions.

No exploration artifact code or production runtime is changed in this delta. Classification routing is an editorial planning projection; it does not establish introductory coverage, production acceptance, specialist approval or asset rights.

## Limits

This is engineering review of validation and digest/file binding only. Source-routing accuracy requires the separate source reviewer. No fresh classification body retrieval, human review, learning/accessibility session, expert credential or production acceptance is asserted. Recheck the repaired helper and any changed candidate before treating engineering review as passed.

## Final independent repair recheck

The file-helper P2 is resolved. Independently read the repaired guards for absent/nonarray batches, invalid batch/receipt-list shapes, null/array receipt entries and malformed digest strings before file IO. Replayed both original failures (`receipts=[null]`, `receipts={}`), plus array receipt and malformed-digest cases: all now return concrete diagnostic arrays without throwing. The new async regression exercises the file helper itself.

Independently reran the complete focused registry suite on Node 22.23.3: **27/27 passed**, zero failures/skips/cancellations. Independently recomputed the routing review digest; it remains exactly:

`5103e5a69c8510c3bcfd5d5c754cd0e80375b9c50eb09dfc5ad38c063d918343`

**Final result: passed for independent AI engineering review of this exact classification-routing batch and current validation/file-binding implementation.** No additional actionable engineering finding found. The original finding and repair remain documented above. This supports the engineering dimension only; the separate source-routing reviewer must supply its own conclusion. No source expertise, production coverage/acceptance, human observation or exploration-artifact review is asserted. No repository edit or browser launch performed.
