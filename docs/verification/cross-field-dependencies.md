# Cross-field prerequisite gate

2026-10-19. The executable inventory in `cross-field-dependencies.json` checks
MASTER_PLAN §7.3 against all current written and planned records.

Of 64 non-math collections, **54 have fewer than 25 published prerequisite edges to
written ideas in a different field**. Their combined shortfall is 880 edges. Even
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

## First reconciliation batch

Two published connections now follow the actual arguments, with chapter and syllabus kept
in sync: `pchem-2.2 → pma-6.21` supplies the fundamental theorem that evaluates the
positive-volume isothermal work integral; `qchem-1.12 → prob-2.2.3` supplies the finite-variance
weak law and standard-error calculation for independent repeated measurements. The prose
now states those hypotheses and avoids promising that each sampled mean stays in its
one-standard-error band. Both chemistry collections now have25 published cross-field edges.
No source-review flags were cleared by adding these links.

## Supporting planes in plastic collapse

The audited argument for `solid-4.10` now explicitly uses the outward normal cone and supporting-hyperplane inequality of `opt-2.8` to obtain maximum plastic dissipation under associated flow. The chapter and syllabus both identify this written prerequisite. Solid mechanics now has7published cross-field edges; the overall published shortfall is880, with54of64collections still below25.
