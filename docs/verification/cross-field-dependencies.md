# Cross-field prerequisite gate

2026-10-19. The executable inventory in `cross-field-dependencies.json` checks
MASTER_PLAN §7.3 against all current written and planned records.

Of 64 non-math collections, **54 have fewer than 25 published prerequisite edges to
written ideas in a different field**. Their combined shortfall is 876 edges. Even
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

The audited argument for `solid-4.10` now explicitly uses the outward normal cone and supporting-hyperplane inequality of `opt-2.8` to obtain maximum plastic dissipation under associated flow. The chapter and syllabus both identify this written prerequisite. At that checkpoint, solid mechanics had 7 published cross-field edges and the overall published shortfall was 880, with 54 of 64 collections still below 25.

## Orthogonal projection in swept-wing velocity components

The audited vector construction in `aero-4.3` now explicitly applies the unit-vector projection formula from written `ladr-6.55`. The normal and spanwise components are orthogonal and sum to the free-stream velocity. The chapter and syllabus both identify that prerequisite. Aerospace engineering now has 11 published cross-field edges; the overall published shortfall is 879. The gate remains open for 54 of 64 non-math collections, including 27 still below target across the complete syllabus.

## Normal moments and exponential-rate mixtures

The audited `fin-4.11` moment-matching argument now explicitly uses written
`prob-1.2.5` for the standard normal and `prob-2.7.1a` for its moment-generating
function. The `behav-5.3` mixture calculation explicitly integrates the written
`prob-1.2.4` exponential density with its stated mean. Each prerequisite is used
in the argument, with chapter and syllabus synchronized. The [finance audit](fin-factor-premium-followup.md)
and [discounting audit](behav-discounting-followup.md) document the independent
source/model checks. Finance now has16 published cross-field edges and behavior10.
The refreshed shortfall is876;54 of64 collections remain below25 published edges
and27 remain below25 over the complete syllabus. The quota gate remains open.
