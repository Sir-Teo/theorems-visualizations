# Agriculture follow-up: a reviewable daily ledger

Preparation for P05-L02, 22 October 2026. The [dossier](irrigation-ledger-20261022.json) extends the earlier single-day examples into four three-day paths, delivery limits, missing evidence, an explicit correction and a two-sector counterexample. These are original fictional review inputs, not an authored lesson, measured field trial or irrigation recommendation. P07/P08 still occupy both unaccepted draft slots.

## Source and model boundaries

Two successful HTML captures pin the selected [UMN checkbook guidance](https://extension.umn.edu/natural-resources/conservation/agricultural-soil-and-water/irrigation/irrigation-scheduling-checkbook-method) and [NDSU AE792](https://www.ndsu.edu/agriculture/extension/publications/irrigation-scheduling-checkbook-method) prose. Dossier notes identify the inspected headings, raw hashes and limited scope. Linked spreadsheets, PDF/image tables and physical protocols were not validated. No extension table, figure or worksheet is copied.

The fixed capacity is **36 × 0.09 = 3.24 inches** of illustrative available water. The hypothetical pump delivers **0.025 field-equivalent inches/hour**, with at most **24 operating hours/day**. Its fictional boundary fraction is 0.80: of 0.50 gross inches, 0.40 enters this toy accounting domain and 0.10 is lost before it. A separately identified surplus can leave afterward. This parameter is deliberately called a **boundary delivery fraction**, not final stored-water application efficiency. The source uses related efficiency terms in different contexts; silently mixing those boundaries can count a loss twice.

An input already measured at that boundary is used directly. Daily netting removes surplus immediately and cannot resolve event order, transient drainage, within-day peaks, crop stress or a real system's hydraulic behavior. These limitations prevent the arithmetic from acting as an operational schedule. The older reviewed fixtures remain byte-for-byte unchanged; this more explicit convention governs only this new packet.

## Same ending balance, different evidence and paths

Every row below starts at a 1.00-inch deficit, uses a fictional 0.25 inches/day, and applies 0.50 gross inches once. “Early” applies on day 1; “late” applies on day 3. The forecast branch assumes 0.80 inches of rain on day 2; the observation branch instead records a fictional 0.10. Both remain visible. Zero rain on the other days is an explicit scenario value.

| Fictional path | Day 1 deficit | Day 2 deficit | Day 3 deficit | Largest daily-end deficit |
| --- | ---: | ---: | ---: | ---: |
| Forecast, early | 0.85 | 0.30 | 0.55 | 0.85 |
| Forecast, late | 1.25 | 0.70 | 0.55 | 1.25 |
| Observed, early | 0.85 | 1.00 | 1.25 | 1.25 |
| Observed, late | 1.25 | 1.40 | 1.25 | 1.40 |

Within either rain branch, equal total inputs produce equal final balances here, but the paths differ. A daily-end maximum is not a within-day maximum. No deficit trigger, acceptable growth-stage range, crop-loss function or best action is supplied; five concrete review cards ask qualified reviewers to settle those matters before authoring.

## Cases that a final exercise must handle

- **Delivery takes time.** A 0.50-inch request needs 20 hours; 0.60 needs the full 24 hours. A 0.75-inch request needs 30 hours and cannot be reported as delivered that day. The mathematical maximum is not an approved alternative schedule.
- **Measured incoming water is already incoming.** With starting deficit 1.00, use 0.25, rain 0.10 and incoming irrigation 0.40, the ending deficit is 0.75. Applying the fraction a second time incorrectly gives 0.83. The fictional measurement assumes separated irrigation/rain quantities; no actual gauge protocol is established.
- **Account for surplus explicitly.** Starting deficit 0.20 plus use 0.10, rain 1.00 and gross irrigation 0.50 yields raw deficit −1.10. Delivery loss is 0.10; surplus removal is a separate 1.10; final available storage is 3.24. Their meanings differ, and the model does not partition surplus into empirical drainage/runoff.
- **Unknown and invalid are different.** Missing rain has no numeric ending state. A raw deficit of 3.35 exceeds the assumed 3.24 capacity and ends this model; it is not silently clamped into a valid continued trajectory.
- **Reconciliation preserves history.** After day 2 of observed-late, a fictional field check revises deficit 1.40 to 1.10. The −0.30 deficit adjustment and +0.30 storage-estimate adjustment remain visible, with unchanged rain 0.10 and the original branch retained. The revised day-3 deficit is 0.95. This changes an estimate; it does not create a water input or identify the discrepancy's cause.
- **An average can hide the last sector.** Two equal-area sectors receive 0.50 local gross inches on different days. Each day's field-equivalent volume is 0.25 inches and needs 10 hours. Day-1 deficits are 0.85 and 1.25, averaging 1.05; day 2 ends at 1.10 in each. The daily average hides the still-unirrigated sector on day 1. No spatial uniformity or real pivot design follows.

The [offline arithmetic audit](check-irrigation-ledger-20261022.py) uses exact rational arithmetic, storage conservation, area weighting and explicit evidence-state checks. Run it with `python3 -B docs/pilots/sequences/preparation/check-irrigation-ledger-20261022.py`. Its scope is preparation arithmetic; it does not test a learner interface, agronomic validity or real delivery. The [separate AI data/source report](review-irrigation-ledger-20261022.md) records its actual review scope and exact bindings.

## Adjacent source issue and handoff

The [MSSRF feature](https://www.mssrf.org/stories-of-change/seed-keepers-odishas-community-seed-banks) was readable through the web tool before a direct capture attempt stopped at HTTP 307. The inspected body still begins in Nuaguda and ends in Kumbharaguda. No correction, raw downloaded body or substitute account was established. No retry, alternate-host recovery, quotation, photograph, participant permission or outcome evaluation is supplied. P05-L03's location/context gates remain open; the earlier FAO timeout was not revisited.

The [integration package](../../../integration/irrigation-ledger.md) preserves nine existing files, including both briefs, earlier arithmetic, source/queue records, accepted agriculture and the coverage registry. The [verification checkpoint](../../../verification/universal-irrigation-ledger.md) separates arithmetic/source preparation from qualified review, field observations, final artifact/access/learner work and distribution decisions. All five professional decision fields remain empty. Existing source-unit uncertainty in the first agriculture pilot is unchanged.
