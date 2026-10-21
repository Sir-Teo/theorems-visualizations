# STOCH5 independent review

Status: accepted on final frozen source after independent source, model, production replay and visual review.

Reviewer: wave5_reviewer. No reviewer content edits.

## Actual sources and hypotheses

Read the actual saved Levin–Peres–Wilmer second-edition book (`/tmp/wave5-stoch-lpw.pdf` and extracted text), including Proposition4.7, Lemmas4.10–4.11, cycle bounds §5.3.2, the undirected diameter definition §7.1.2, Theorem7.4 and proof, Proposition7.14, Example12.19 and §25.3's retained-map algorithm and average stationarity condition. Official source: https://pages.uoregon.edu/dlevin/MARKOV/mcmt2e.pdf . A fresh web open timed out; acceptance relies on the actual locally saved book passages, not the failed retrieval.

Also read Propp–Wilson's actual saved original27-page paper, §2.1/Theorem1 and the explanation of retaining the same random bits at each fixed past time (`/tmp/wave5-stoch-propp-wilson.pdf`, extracted `/tmp/wave5-stoch-review-propp.txt`). The source explicitly warns against forward stopping and regenerating recent maps.

All12 draft statements and proof ideas have been read. The pairwise distance—not the worst distance to stationarity—is submultiplicative. The finite minorization argument has finite irreducible aperiodic hypotheses. Coupon collection gives the elementary n log n scale; the sharper half-n-log-n theorem separately uses Walsh eigenfunctions and a distinguishing-statistic lower bound. Finite-law recurrences and pseudorandom traces are separated from proofs and ideal randomness.

Requested and author-resolved substantive corrections: the CFTP random-map distribution must represent P and preserve π on average; an individual deterministic map need not preserve π. The diameter proof uses the underlying undirected graph, with edge when P(x,y)+P(y,x)>0, rather than directed diameter. Final source bytes retain both corrections. Direct proof prerequisites now include5.6 for Doeblin coupling, probability1.6.4 for cycle Markov/Chebyshev bounds and PMA1.35 for the Walsh/Cauchy–Schwarz TV bound; authored and syllabus dependencies are synchronized.

## Independent calculations

`/tmp/wave5-stoch-review-oracle.mjs` passes697 independent states under Node22:

- Exhaustive32-event TV definitions for101 law pairs; maximal, quantile and independent joint marginals and disagreement inequalities.
- Full2^n coordinate-refresh kernels for dimensions2–7 and times0–24, independently aggregated only after propagation, agree with the authored Hamming-weight recurrence, TV, first/second statistic moments and spectral upper bound.
- Exhaustive fair-sign map sequences through length10 on reflected paths reproduce the independently propagated one-coordinate law.
- Retained-map CFTP compositions across200 size/seed states agree with direct chronological composition, nested image counts and the reported coalescence/output.

Resolved plot observation: the5.9 ceiling horizon put n=4/5 curve endpoints beyond the fixed normalized x range. The author padded its upper bound to2.25; all complete path strokes now pass.

Independent actual production run for1,2,4,9,11,12 passes24 groups across1200/320 both themes,208 physical actions and116 Share/off-grid/integer-invalid/out-of-range/malformed replay checks. Log `/tmp/wave5-stoch-review-production.log`. Minimum full dot/ring clearance2.253708 CSSpx and glyph/halo clearance3.117500 CSSpx. A separate final-scope5.12 rerun passes4 groups/24 actions/20 replays (`/tmp/wave5-stoch-review-production12-final.log`). Complete statement, idea, caption, scope and readout text ranges, display-math inner bounds and full path strokes are checked.

Inspected all24 narrow defaults in both themes and selected hypercube/statistic/CFTP modes. Final visual review found that5.11 statistic bars mistakenly supplied barWidth=.26*step while the framework already multiplies barWidth bydx=step. Their width therefore decayed quadratically and became nearly invisible. Resolved using the dimensionless fraction .26. Independently reran final5.11 at1200/320 in both themes:4groups/40actions/20replays pass (`/tmp/wave5-stoch-review-production11-final.log`). The final run also checks actual drawn histogram widths of at least1CSSpx throughout offered dimensions. Inspected final dimension32 captures at actual320 in both themes: current and stationary bars are now clearly visible and separated. Current12 chapter math groups pass separately from the independent oracles.


## Acceptance

The complete independent production evidence totals32 groups,272 physical actions and156 edited/off-grid/invalid-state replay checks across the focused24-group run and final5.12-scope/5.11-width reruns. All requested source, proof-prerequisite and presentation corrections are present in final frozen bytes. The narrow default and selected endpoint/mode captures are legible in both themes. Numerical recurrences are finite-law examples subject to binary64 rounding; ideal-randomness and finite work-limit assumptions remain explicit.

No unresolved finding or source uncertainty flag remains. No reviewer content changes. As with the other chapters, in-memory source catalog injection exercises the actual renderer without changing generated files; root's source-aligned generated build/integration remains the final shipping gate.
