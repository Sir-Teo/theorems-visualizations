# BEHAV prerequisite argument follow-up — 20 October 2026

Candidate production boundary, requiring independent immutable peer review. Fourteen genuine written crossfield edges are added to thirteen existing written items. Local inventory changes from **11/15/17** to **25/29/31** (written-to-written / written-to-known / whole syllabus), with no unknown prerequisites. No acceptance or source-closure claim is made.

Only existing idea text (strictly appended), dependency arrays and the thirteen matching syllabus dependency rows change. All 67 full BEHAV objects, including executable function text, source flags, statements, captions, scopes and other metadata are guarded by `tests/verification-behav-prerequisites-guard.mjs`; other BEHAV files are byte-identical. A separate source-normalization check also verifies that every chapter source byte outside the owned idea/dependency spans is identical to the baseline. No shared runtime, target content, global inventory or bridge is changed.

The producer personally read the actual target statements and proof ideas and the full consumer arguments. These are mathematical prerequisites for the specific steps below, not evidence that the empirical psychology claims have been independently source-verified.

| Consumer | Actual written prerequisite | Consumed proof step and hypotheses |
| --- | --- | --- |
| 1.1 | prob-2.2.16 | Independent St Petersburg truncation normalization. Target payout is exactly twice the consumer payout; its probability limit is halved. Infinite expectation is not treated as an ordinary finite-mean LLN. |
| 1.3 | prob-1.6.1 | Bounded finite-prize utility expectation and common-mixture affinity; payoff independence is unnecessary and distinct from the preference axiom. |
| 1.5 | pma-5.5 | Twice-applied chain rule for the concave utility transformation, on a C² interval with both first derivatives positive and defined coefficients. |
| 1.6 | prob-1.6.1 | Expectation of the Taylor expansion for bounded fair risks tZ. Uniform shrinking-support remainder, positive marginal utility and finite expectations are explicit; arbitrary rare large losses are not covered by finite variance alone. |
| 1.7 | pma-6.21 | Integrate the log marginal utility differential equation and then marginal utility itself. Positive marginal utility, positive CRRA wealth, and the logarithmic γ=1 case are explicit. |
| 1.9 | pma-6.22 | Second integration by parts, with H the integrated CDF difference; endpoint term/signs included. Continuous CDFs give the classical theorem directly; the actual finite lotteries use smooth intervals between atoms and cancellation of continuous boundary traces. No derivative of a CDF at an atom is assumed. |
| 1.14 | pma-4.16 | Attainment of the continuous affine payoff minimum on the compact nonempty finite-state prior interval, followed by its slope sign. No unrestricted infinite-state compactness claim. |
| 3.8 | prob-1.1.1 | Measurable conjunction subset and disjoint complement decomposition, with no independence premise. |
| 3.9 | prob-2.2.1 | Independent common-p Bernoulli variance gives p(1−p)/n. Perfect dependence is an explicit counterexample. |
| 3.10 | prob-2.1.9 | Group the complete finite history into one σ-field to establish next-toss independence, including conditioning on a positive-probability streak. |
| 3.10 | prob-2.3.12 | Actual longest-head-run theorem, repeated under symbol relabelling and intersected probability-one events, gives longest run of either symbol. Finite-n DP probabilities remain separate. |
| 4.2 | opt-3.4 | Two-point normalized Jensen arguments for segregating gains/integrating losses. v(0)=0, strict curvature versus affine equality, and the lack of a deduction for mixed outcomes are explicit. |
| 4.6 | prob-2.2.1 | Total and average variance of independent finite-moment bets, with a repeated-single-coin dependence counterexample. |
| 5.3 | pma-6.21 | Finite-cutoff antiderivative then improper-integral limit for an exponential distribution of rates; k>0 and t≥0 guarantee convergence. |

No existing bridge references any `behav-` item (`content/bridges` independently searched), so this boundary touches no bridge step. The new arguments preserve existing bridge compatibility.

## Validation and evidence

Baseline is the immutable archive of `f1135a6781533903910c8d2b8f4373ccb4a890e9` at `/tmp/atlas-new-behav-producer/baseline`; evidence is `/tmp/atlas-new-behav-producer/evidence`.

- `node --test tests/verification-behav-prerequisites.test.mjs`: all **12 independent mathematical groups pass**, including finite exact Bernoulli/bet enumeration through n=12, all fair coin strings through n=13, bounded-risk premium asymptotics, piecewise atomic integration by parts, strict/affine Jensen cases, finite-state endpoint minima and numerical antiderivative cross-checks. These finite checks corroborate formulas and hypotheses; the actual target proofs justify asymptotic conclusions.
- Explicit snapshot audit: all **67** full objects/functions/source flags and complete syllabus pass. Only the specified appended ideas/dependencies are permitted. `sourceguard.log` separately records all remaining chapter source bytes unchanged.
- Strict build: **0 errors / 0 warnings / 0 unknown**, home **112699 gzip bytes**. Focused static BEHAV: **67 items / 0 errors / 0 warnings**.
- `BEHAV_PREREQUISITE_OUTPUT=<unique directory> node tests/verification-behav-prerequisites.mjs`: **26 fresh 320px light/dark actual native runs**, with 52 actual idea/statement captures. Every new appended proof has been personally read in the producer's own output pixels in both themes. Actual runtime rendering reports no errors, TeX errors or blank outputs. This is a changed-prose check, not certification of unchanged widget behavior or interactions.

The narrow probe exposed **inherited** equation wrapping defects: 1.1's divergent-expectation statement, 1.6's premium-and-A statement, and 5.3's original mixture-integral idea / average-rate statement. They are captured and explicitly logged rather than hidden by the prerequisite test. Changed appendices fit. A separately authorized equivalent equation-wrap follow-up will fix these after this immutable prerequisite boundary; this commit does not change their original mathematical text. The native utility intentionally logs those inherited statement defects and the original 5.3 display instead of claiming every original display fits.

Source flags remain unchanged. Independent peer must review the exact commit and produce its own calculations/native output pixels before accepting the provisional counts.
