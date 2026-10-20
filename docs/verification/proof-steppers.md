# Existing proof-player inventory

The atlas contains **102 written theorem, lemma, proposition or corollary items**
whose visualization directly creates a steps player. All 102 pass a native
first/next/last-control audit after the basis-reduction repair. The complete
[item inventory](proof-stepper-inventory.json) records titles, modules, remaining
source flags, player sizes and explanatory-frame counts.

Run `node scripts/audit-proof-steppers.mjs` to repeat the audit. It loads each
actual visualization, waits for visible canvas pixels, checks render/TeX
errors, and operates native keyboard and button controls. The pebbling lesson
starts in its manual game; the audit selects its existing “optimal strategy”
mode before testing the proof player.

The first pass exposed a real crash in `ladr-2.30`: the initial proof frame had
no `before` list, although rendering accessed that list. Commit `6b27d7a` adds
the empty list and a browser regression that traverses all seven frames. An
initial-paint timing race in the short observation harness was handled by
waiting for actual painted pixels, rather than ignoring persistent blank
panels. The final complete run passes **102/102**.

This establishes working controls for the existing inventory. It does not
establish that all 102 are the master plan's curated flagship proofs, that every
proof is mathematically valid, or that every frame has received a visual/source
audit. Those claims need their own evidence. The original 291 steps-kit calls
across algorithms, models and other item kinds are not counted as 291 proofs.

## Source and proof curation

The separate [curation registry](flagship-proof-curation.json) starts at **1/100** accepted results. Its first entry, [basis extraction](flagship-basis-followup.md), has actual source/proof/prerequisite reading, exhaustive finite reference checks and all-frame native geometry/replay checks. It corrects false two-survivor and R² claims for degenerate input, plus stale proof frames after state replay. The older 102-player control inventory remains separate.

Run `node scripts/verify-flagship-curation.mjs` to check evidence links and the hashes of curated item/support code. This only detects stale records; it does not perform another proof audit or curate the other 99 results.
