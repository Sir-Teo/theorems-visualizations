# GAME5 independent review

Status: **ACCEPTED** after independent source/proof/model, frozen native/state and personal visual review. No unresolved findings; product bytes remain frozen. No acceptance is inferred from author tests.

## Scope and actual sources

Ten new GAME5 items only. Independently read the actual written statements/proofs of game1.1, game1.4, game4.2, game4.4 and micro10.16. GAME4's finite deterministic perfect-information model does not itself cover simultaneous repeated-stage games; the new chapter explicitly supplies that extension from the official multistage sources. MICRO10.16 supplies the present-value comparison, not the different Bertrand stage profits.

Read actual MIT Ozdaglar2010 Lecture15 discounting/finite-game/trigger discussion, Manea2016 Single-Deviation slides2–8 (observable past actions, tail continuity and reverse removal of finite deviations), and Manea2016 Repeated Games slides3–14 (independent mixed-opponent minmax, public randomization, Nash-reversion and full-dimensional strictly individually rational SPE theorem). Local source receipts and actual PDFs/text are in `/tmp/atlas-wave5-game-sources`. Ozdaglar slide10's unique-pure-equilibrium wording is not used as a general theorem: the authored finite-horizon claim is restricted to strict PD with unique full stage equilibrium. The incorrect slide14 incentive inequality is replaced by the direct correct calculation.

Personally inspected original KMRW Stanford scan, printed245–251, including Model1 and Steps1–8. The theorem uses undiscounted finite sums, one-sided privately known TFT commitment type, prior in (0,1), a>1, b<0, a+b<2 and sequential equilibrium. Step7's all-equilibrium defection-round count bound and Step8's additional Pareto-undominated end-window qualification are distinguished. The widget evaluates those loose constants; it does not manufacture an equilibrium trajectory.

Separately read Axelrod's later official TourExec documentation and Fortran source at https://websites.umich.edu/~axe/CC/CC2/TourExec-Doc.html and https://websites.umich.edu/~axe/CC/CC2/TourExec1.1.f.html. These are later program sources, not a recovered body of the blocked 1981 article. The new six-rule tournament is explicitly authored and does not claim the original participant pool or rankings. Spatial rules, self-encounters, boundaries, synchronous update and deterministic tie resolution are explicitly declared.

The original Maskin1986, Axelrod–Hamilton1981 and Nowak–May course-hosted body requests returned403; no alternate original body, cache or host recovery was attempted. O&R portal registration is not a book-body reading. The accessible official exposition supplies the folk/one-deviation theorem evidence; original tournament/spatial body uncertainty remains explicit.

## Independent numerical evidence

Separate NumPy linear solves of (I−δP)V=(1−δ)r and Bellman recurrences checked all256 pairs of four-bit deterministic action masks, six discount factors and two temptation payoffs: 3,072 cases. Independently rebuilt Moore/self neighborhoods, scoring and synchronous tie resolution checked48 lattice trajectories (5×5 and21×21, toroidal/open, four temptation values, three initial boards). Independently evaluated108 public lotteries, actual flipped-action gains and conditional Nash-reversion slacks. These checks total842,592 scalar comparisons; maximum absolute discrepancy5.329070518200751e−15.

Reproducible temporary evidence: `/tmp/wave5-game-review-dump.mjs`, `/tmp/wave5-game-review-models.json`, `/tmp/wave5-game-review-oracle.py`. Actual outside inputs are recorded in `/tmp/wave5-game-review-actual-inputs.json`.

A second independent implementation checked216 complete noisy/forced-error matches,18 full eight-repetition round robins (including self-play role averaging and descriptive MCSE), and54 full60-generation payoff-matrix population updates. These add72,468 scalar comparisons; maximum absolute discrepancy4.218847493575595e−15. Total independent checks so far:915,060 scalar comparisons. Evidence: `/tmp/wave5-game-review-matches.mjs`, `/tmp/wave5-game-review-matches.json`, `/tmp/wave5-game-review-matches.py`.

The coordinator confirmed this source disposition: no additional original-body flag is required for an explicitly authored lattice Model that excludes reproduction of the original parameters/figures/conventions. The403 stop and qualitative-only attribution remain visible in scope; no original-source claim is broadened.

Exact rational TFT checks also give paired equality conditions δ=2/3 andδ=1/4 for T5 (incompatible), versus δ=1/3 for both pairs at T4, R3,P1,S0. Independently ran all15 focused math/metadata groups: pass.

An exhaustive exact-integer classification oracle additionally checked all101³=1,030,301 allowed lottery-control combinations. It found27 false strict-IR classifications caused by rounded boundary payoffs above1; pre-fix reproduction is saved in `/tmp/wave5-game-review-lottery-grid-before.log` and script `/tmp/wave5-game-review-lottery-grid.mjs`. The author repaired both probability and payoff numerators using safe integer arithmetic. Independently reran every setting: zero mismatches (`/tmp/wave5-game-review-lottery-grid-final.log`). Finding resolved; the subsequent16 focused math groups pass. Final exact-boundary actual Create-link/replay and red non-strict-IR marker pass in both themes and widths.

## Findings resolved

- Public-lottery deviation gain previously forced D even when the recommendation was D. Author changed the alternative to the actual flipped action; independent conditional inequalities pass.
- The finite-deviation algorithm frees the first k dates and then returns to the profile. It does not optimize a budget of k changed actions at arbitrary future dates. Caption/control/readout corrected; plot/legend wording was also corrected to match.
- TFT's cooperative path alone is insufficient. All four history states are evaluated; the special weak-SPE knife edge T+S=R+P and δ=(T−R)/(R−S) is stated, separate from public grim's threshold.
- Tournament caption now describes separately seeded pseudorandom repetitions rather than asserting literal probabilistic independence of deterministic seeds.
- Early matrix screenshots lacked direct row/column indices; author had already added these and added an explicit row/column orientation key before final freeze.
- Raw TFT knife-edge coverage now explicitly sets T4 and the TFT policy, including adjacent representable discounts, rather than depending on previous mode traversal.

- Final raw5.7 inspection found that the native range rounded a positive subnormal requested undercut to0.0000 while the readout omitted its actual value. The final readout now explicitly shows requested epsilon=5e−324 and the indistinguishable actual quote; no model/control change.

## Frozen production and personal visuals

Fresh independent final40 cases (all10 items × light/dark × actual1200/320 CSS-pixel widths) pass, exit0:1,500 physical actions and340 actual state-URL replay/rejection checks. The reviewer copied the final utility to `/tmp/wave5-game-review-browser.mjs`, used a separate output directory, and ran against source-aligned production metadata injected in memory. No generated data was edited. Full controls/modes/endpoints, revealed control visibility, per-item model→readout numerical checks, exact snapshot replay, physical Create state link, valid off-grid values, malformed states, out-of-domain values and fractional integer-control rejection were exercised. Raw cases explicitly include TFT at T4, δ1/3 and adjacent representable values, grim threshold and nearby values, exact lottery boundary ticks0/20/10, minimum-positive discount/noise/undercut and exact zero.

The final readout-only5.7 repair was independently rechecked in4 replacement settings:36 physical actions,44 URL checks, exit0. This overlaps the40 unique cases and is not added as new unique coverage. Final marker/ring minimum4.9907407407407405 CSSpx and glyph/halo minimum3.11562442779541 CSSpx for this replacement. The initial full matrix marker/ring minimum is1.9833333333333343 CSSpx, glyph/halo minimum2.482451467803031 CSSpx. Full paths/arrowheads/rectangles/circles are separately asserted nonclipped; these path assertions are not folded into the marker minimum. Full rich text, controls, display formulas, horizontal page bounds and readout scroll height/width pass. The2400px viewport height ensures complete painting of tall widget captures; actual widths remain1200/320. Logs: `/tmp/wave5-game-review-native.log` and `/tmp/wave5-game-review-7-final.log`.

Personally inspected all20 final narrow default widgets in both themes, plus selected wide4/8/9/10, memory-window labels, tournament row/column keys and population mode, exact TFT boundary, exact strict-IR boundary, minimum-positive undercut, and rich statement/scope pages6/9/10. Final requested-epsilon raw capture was inspected after the replacement run. Figures/readouts are complete and legible; scientific claims and source limits remain visible. Screenshots and modes: `/tmp/wave5-game-review-production`; contact sheets `/tmp/wave5-game-review-contact-{light,dark}-{1-4,5-7,8-10}.png`; supplementary raw/rich/wide contacts in `/tmp/wave5-game-review-{raw-modes,rich,wide}.png`.

Independent final static check:10 items,0 errors,0 warnings. Focused math:16 groups pass. Source/test SHA256 manifest `/tmp/wave5-game-review-freeze.sha256` verifies unchanged final bytes; pre-readout-only manifest retained separately. Reviewer browser and server are CLOSED; lane released. No Git, shared-runtime, generated-data or original-checkout changes.
