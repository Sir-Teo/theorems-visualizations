# Independent QINFO5 review

Status: **ACCEPTED**, all nine final frozen items.

## Actual sources and query scope

Independently read Cleve–Ekert–Macchiavello–Mosca's original Quantum Algorithms Revisited §§2–3, printed pp4–7, including the exact one-query refinement, character sums and affine Bernstein–Vazirani form. Inspected the actual rendered p7; the paper's suppressed normalization factors are supplied correctly in the chapter. Read Watrous lectures5 and6, including randomized-versus-exact deterministic Deutsch–Jozsa cost, the Simon marginal and binary post-processing. The chapter explicitly restricts Simon to a promised nonzero period, so it correctly does not silently omit the extra injective-case test needed by the lecture's broader formulation.

Read Brassard–Høyer–Mosca–Tapp §2, equations1–8 and Theorem2; inspected the actual rendered p7. The known-success first-peak choice and bound are correctly stated, including endpoints and oscillatory overshoot. Read Aharonov–Jones–Landau §2.2 and Buhrman–Cleve–Watrous–deWolf §2/Fig1 and inspected their actual rendered p5/p3: the Hadamard imaginary-part sign and pure-state squared-overlap swap probability agree. Inspected the actual rendered Ambainis et al. p2 Figure1 and overview; the finite walk model fixes its coin/shift orientation and does not claim to prove an asymptotic spreading coefficient or search advantage.

All nine items distinguish coherent access/query complexity from oracle construction, data loading, gate cost and physical execution. Deutsch–Jozsa's exponential classical comparison is only with exact deterministic queries. No truth-table readout, seeded measurement sample, finite classical simulation or ballistic width is passed off as a general quantum speedup. Amplitude amplification requires coherent preparation and inversion; its preparation/inverse/phase-test counts are explicit. The Hadamard test assumes controlled-unitary access. Sampling standard error is a model scale, not a confidence guarantee.

## Independent calculations

`/tmp/wave5-qinfo-review-data.mjs` and `/tmp/wave5-qinfo-review-oracle.py`, log `/tmp/wave5-qinfo-review-oracle.log`: **2,671 independent comparisons pass**:

- Dense Walsh character matrices for all displayed oracle families/translations and all Bernstein–Vazirani secrets.
- Exact rational rank-distribution transitions for independent uniform Simon hyperplane samples, including zero runs and failure-bound verification; sampled row spans counted directly without Gaussian elimination.
- Dense16-dimensional Grover oracle/reflection powers for every marked count and displayed round, including no/all marked labels and overshoot.
- Independent90-digit complex preparation/reflection products, including positive-subnormal success weights and endpoints, phases and all selected round counts. Probabilities are checked relatively down to the binary64 subnormal rounding scale, rather than hiding tiny-state defects behind a fixed absolute tolerance.
- Independent analytic expectations and pure-state overlaps for Hadamard/swap circuits.
- Full coin/shift unitary matrix evolution for walk horizons up to40, with an extra unreachable boundary layer; position laws, means and variances agree.

Independently reran all **ten math/metadata groups**, pass. No source/model finding currently requires a correction. The swap diagram clarification was repaired with two target rails and explicit state labels. Author inspection also repaired a subnormal formatting defect chapter-locally; positive model probabilities must remain positive and finite in the actual readout.

## Native and visual evidence

Independent `/tmp/wave5-qinfo-review-browser.mjs` ran all36 actual1200/320 theme/width groups, then reran5.8's four groups after its final control-visibility correction. The other32 item/theme/width states had unchanged source. Final combined evidence: **36 groups,440 physical actions,328 actual URL replay/rejection checks**. Logs `/tmp/wave5-qinfo-review-browser.log` and `/tmp/wave5-qinfo-review-final8.log`; captures `/tmp/wave5-qinfo-review-production`. The final four-group rerun separately passes188 actions and20 URL checks. All reviewer browsers are closed.

Complete statement/idea/caption/scope/readout text and formula bounds, paths, rectangles/bars, circles, arrowheads, canvas glyph/halo and full marker rings pass. Minimum full marker/ring clearance4.795CSSpx; glyph3.116CSSpx. Every visible control, conditional mode and endpoint was exercised, including revealing Hadamard's imaginary-part controls after switching back from swap. Native range strings agree exactly with a newly configured browser range's canonical serialization, while saved model snapshots remain exact.

Edited/off-grid links, invalid discrete/out-of-range/malformed state rejection and actual Create state link replay pass. Amplitude weights MIN_VALUE,2MIN,3MIN,1e-322,1e-200,1e-20,the binary64 value just below one,zero andone at rounds0/2 are checked through physical Create links. The first rendered probability matches its finite scientific representation and remains positive for tiny positive inputs; replayed snapshots and complete readouts agree. Seeded measurement histories are reconstructed, not replaced by new random trials.

Personally inspected all18 narrow defaults in both themes, final5.8 defaults plus three-rail swap and imaginary-part captures, and rich Deutsch–Jozsa/Simon/amplification/walk statements and scopes. Labels, signed bars, rank traces, phasors, probability oscillations and finite walk comparisons are legible. The last visibility correction hides the unobservable preparation phase for the diagonal-U Hadamard example while preserving it for swap. No unresolved mathematical, source, numerical, state or visual issue remains.

All nine items pass AUTHORING§2's seven criteria: theorem-specific hypotheses/conclusions, useful interaction, visible interference/rank/success quantities, live evidence, genuine finite computation, both-theme legibility and responsive redraws. Keep final source frozen.
