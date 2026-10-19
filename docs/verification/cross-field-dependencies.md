# Cross-field prerequisite gate

2026-10-19. The executable inventory in `cross-field-dependencies.json` checks
MASTER_PLAN §7.3 against all current written and planned records.

Of 64 non-math collections, **56 have fewer than 25 published prerequisite edges to
written ideas in a different field**. Their combined shortfall is 883 edges. Even
including planned items and planned prerequisites, **27 collections remain below 25**.
The wave gate is open. Counts are not evidence that a prerequisite is justified.

The inventory counts each directed item-to-prerequisite edge once. It separates
written-to-written, written-to-known and whole-syllabus counts; related links and
same-field links between collections do not count. Missing IDs are reported separately.
This distinction prevents an unwritten prerequisite from being presented as currently
available to a reader.

Run `node scripts/audit-cross-field-deps.mjs` to regenerate the inventory and
`node --test tests/cross-field-deps.test.mjs` for its counting regression. The test
covers duplicate edges, planned availability, same-field collections and missing IDs.

Reconciliation requires reading the actual argument or model and identifying its
mathematical or scientific inputs, then linking the matching written idea. Synchronize
chapter and syllabus dependencies and check cycles and unknown IDs after each batch.
Do not add arbitrary links to meet the quota. This audit changes no dependencies.
