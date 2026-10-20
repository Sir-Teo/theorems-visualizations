# Cross-field prerequisite gate

2026-10-19. The executable inventory in `cross-field-dependencies.json` checks
MASTER_PLAN §7.3 against all current written and planned records.

Of 64 non-math collections, **53 have fewer than 25 published prerequisite edges to
written ideas in a different field**. Their combined shortfall is 857 edges. Even
including planned items and planned prerequisites, **28 collections remain below 25**.
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

## Conditional tails and finite-average risk

The rational-bubble forward identity in `fin-5.11` explicitly uses the written
tower property `prob-4.1.13`; its dividend-tail and integrability conditions are
now stated. The actual finite-variance weak law `prob-2.2.3` supplies the
relative-risk limit in `behav-4.6`, with its bounded independent bets and correct
dollar units. Both links are synchronized with the syllabi and independently
audited in the [bubble](fin-bubbles-followup.md) and
[bracketing](behav-bracketing-followup.md) reports. Parallel applications are
related links. Finance now has17 published cross-field edges and behavior11.
Published shortfall874;54/64collections and27whole-syllabus collections remain
below25. The gate remains open.


## Conditional trading systems and diffusion

The reviewed efficiency entries `fin-5.1` and `fin-5.14` explicitly use
`prob-4.1.14`, taking out a bounded measurable position from a conditional
expectation. Integrability and the separately specified benchmark are stated;
subtracting the true conditional mean alone is identified as an identity.
Bachelier's Gaussian in `fin-5.13` explicitly applies the written heat kernel
`pde-3.3` at diffusivity sigma²/2. Original source/formula reading and independent
model checks support all three connections; chapter and syllabus are synchronized.
See the [efficiency](fin-efficiency-followup.md) and
[Bachelier](fin-bachelier-followup.md) reports. Finance has 20 published edges;
the refreshed shortfall is 871. The gate remains open for 54 of 64 collections,
including 27 below target even across their complete syllabi.

## Finite laboratory-path averages

The reviewed laboratory illustration `fin-5.12` now explicitly uses written
`prob-2.2.3` for the finite-second-moment weak law applied to independent
simulated paths. A fixed-period finite-horizon Lipschitz/floor recurrence has
finite variance. The displayed40-path mean and estimated standard error remain
finite estimates; pairing noise across presets does not invalidate averaging
within each preset. Original-source and independent model/native checks are in
the [laboratory audit](fin-laboratory-followup.md). Chapter and syllabus agree.
Finance has21published cross-field edges; the total shortfall is870, with54of64
collections below25published edges and27below25across their complete syllabi.
The gate remains open.

## Daily exits, detailed balance and conditional forecasts

Four newly audited finance connections bring finance to25published cross-field edges. Finance5.7 applies the finite-variance weak law `prob-2.2.3` to independent authored daily exit outcomes;5.10 derives the finite copying chain's invariant law using actual detailed-balance item `prob-5.5.2a`;5.6 and5.15 explicitly use conditional-L² projection `prob-4.1.15` for the population variance identity. Root read the actual prerequisite bodies and independently checked the arguments, source scope and native models. Related historical/model topics remain related links. See [daily exits](fin-arbitrage-followup.md), [copying chain](fin-speculation-followup.md) and [conditional forecasts](fin-shiller-followup.md).

The checkpoint throughc211d3a has published shortfall866,53of64non-math collections below25published edges, and27below25acrosscomplete syllabi. This remains an open gate; valid arguments, rather than count alone, justify these links.


Accepted snapshot24abff6 (2026-10-19): finance has29published cross-field edges, psychology16 and demography12. Four genuine normal/variance/weak-law links in finance and one finite-probability link in psychology were added through source/proof review. The unused stable-population dependency in reproduction4.3 was removed; demography’s complete syllabus therefore falls from25to24. Combined published shortfall stays866 and the quota gate remains open. This inventory excludes ongoing drafts.


Accepted snapshot `00b1ea9`: psychology has 19 published cross-field prerequisites and philosophy 18. Classical scaling uses the actual written symmetric spectral theorem, positive-operator factorization and normal-noise distribution; the surprise-exam illustration uses actual finite conditional probability. Root read those prerequisite arguments and checked their model use. The four additional published edges reduce the combined shortfall from 866 to 862. There are still 53 of 64 collections below 25 published edges and 28 below 25 over their complete syllabi. No arbitrary prerequisite was added to meet a count. The inventory excludes ongoing drafts. See [MDS](psych-mds-followup.md) and [conditional-information audit](phil-surprise-followup.md).


## Accepted checkpoint through 6522f86

This inventory is generated from the exact accepted export, excluding ongoing exchange-proof, jury and experimental-game drafts. The published shortfall is861;53/64 non-math collections and28 whole syllabi remain below25. Philosophy now has19 published cross-field edges: the actual ODE argument used by its authored hysteresis model supplies one new edge. Psychology retains19. Removing an unused planned Pólya-urn dependency from attachment gives sociology36 whole-syllabus edges and9 published edges; no quota-filling link was substituted. Counts remain an inventory, not proof of prerequisite quality.


## Accepted checkpoint through 55c657d

The exact accepted export excludes active music, colour and vault drafts. Political science rises from 16 to 19 published cross-field edges and 25 to 28 over its complete syllabus: jury 5.4 genuinely uses the written independent-product rule and variance weak law; 5.5 uses finite-partition conditional expectation. Root read the actual prerequisite arguments and checked their use in the finite and conditional proofs. The published shortfall falls 861→858; 53/64 non-math collections and 28 whole syllabi remain below 25. The gate remains open. See [jury acceptance](polsci-jury-followup.md) and [combined checkpoint](checkpoint-55c657d.md).


## Accepted checkpoint through b229c72

Art rises from 6 to 7 published cross-field edges and from 27 to 28 across its whole syllabus: trichromacy 4.2 explicitly uses the written basis criterion ladr-2.28 for existence and uniqueness. Root read its actual argument and checked its use with the full-rank primary matrix. The published shortfall falls from 858 to 857; 53/64 non-math collections and 28 whole syllabi remain below 25. No arbitrary prerequisites are added. See [cone-matching acceptance](art-cones-trichromacy-followup.md) and [combined checkpoint](checkpoint-b229c72.md).
