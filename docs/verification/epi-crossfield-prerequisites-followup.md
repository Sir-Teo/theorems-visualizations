# EPI written cross-field prerequisites — 2026-10-20

This batch adds **15 prerequisite edges across 14 existing written ideas** and the same additions to their syllabus rows. Read-only inventory changes EPI from **10 written-to-written / 11 written-to-known / 29 whole-syllabus** to **25 / 26 / 44**, with zero unknown targets. These producer figures remain provisional pending independent peer acceptance/coordinator integration. This is a mathematical prerequisite/prose change, not biomedical source certification: all original statements, models, functions, empirical claims, references, scopes and source flags are preserved. A separately authorized followup below narrows one inherited censoring phrase in the 3.9 argument and synchronizes three raw syllabus rows.

## Actual consumer and target proof review

Actual authored target statements and proof ideas were read with the complete relevant consumer statement/argument. Each edge is consumed by an existing calculation or identification step:

| Consumer | Added target(s) | Consumed result and bounded hypotheses |
|---|---|---|
| 1.2 incidence rate | stat-3.5 | The actual MLE criterion gives the score solution d/T for the stated Poisson count approximation at fixed positive person-time; zero events give a boundary maximum. It does not make all follow-up/censoring designs exactly Poisson. |
| 1.5 risk from rate | pma-5.15; pma-6.21 | Taylor supplies the small-hazard expansion, relative error and nonnegative second-order overstatement remainder. FTC integrates the log-survival derivative for continuous varying hazard and positive survival with S(0)=1, keeping the cohort/no-competing-risk assumptions. |
| 1.8 SMR | prob-1.6.1 | Linearity sums the reference model's age-specific expected counts at specified exposures, without requiring independence. It does not establish a Poisson interval or cross-population comparability by itself. |
| 1.9 period life table | prob-2.2.13 | Actual tail-moment identity at power one gives age-at-death mean as survival area; applying it to conditional remaining lifetime gives T_x/l_x when l_x>0. Infinite mean is permitted when the area diverges. |
| 2.4 test likelihood ratios | prob-2.1.1a | Product independence is used separately under disease-conditioned and non-disease-conditioned probability laws. Dividing the two products gives multiplied LRs with nonzero denominators; mixture independence is expressly not asserted. |
| 2.7 cut-off cost | pma-5.8 | Interior differentiable extrema have zero derivative; differentiating expected error cost gives the stated density/LR condition when both costs and prevalence are positive and f0>0. Stationarity alone does not establish the global optimum; boundaries/multiple candidates must be compared. |
| 2.8 serial/parallel tests | prob-2.1.1a | Actual intersection-product rule within each disease stratum supplies the serial-positive and parallel-negative intersections; complementing gives all four displayed combinations. Correlated errors fail these products. |
| 2.11 length bias | prob-1.6.9a | The actual variance identity EX²−(EX)² rewrites the length-weighted mean as original mean plus variance/mean, for a positive finite first moment and finite second moment. It is conditional algebra, not validation of real screening selection/prognosis. |
| 3.2 risk ratio | stat-5.6 | Actual multivariate delta method applied to the two regular interior binomial estimates and log-ratio gradient gives the stated large-sample variance. Both independent group sizes grow; zero-count logarithms and exact-interval claims are excluded. |
| 3.3 risk difference | prob-2.2.1 | Uncorrelated-sum variance applied to independent sample proportions with a negative reference term gives the displayed variance exactly under the binomial model. The normal approximation is a separate asymptotic step; paired samples need covariance. |
| 3.9 rate ratio | stat-5.6 | Delta method for independent approximate Poisson rates at fixed exposures gives the plug-in log-rate-ratio variance 1/d1+1/d0 with adequate positive counts. It does not expand the constant-hazard/censoring interpretation. |
| 3.12 prevention paradox | prob-1.2.5 | Actual normal density enables completing the square in exponential case weighting, giving its shifted-normal tail share and whole-weight shift factor. Unbounded exponential weights are explicitly an idealized relative-weight model, not globally valid disease probabilities or a general empirical guarantee. |
| 4.6 confounding | causal-4.3 | Actual back-door theorem supplies the shown intervention adjustment only with no exposure descendants, all entering paths blocked and exposure positivity in positive-mass strata. Association alone does not verify those graph conditions. |
| 4.13 confounding by indication | causal-4.4 | Actual Simpson weighted-average reversal explains apparent harm despite stratum benefit; common-weight adjustment answers the causal question only with sufficient measured severity/back-door conditions and positivity. A noisy proxy can leave residual confounding. |

No historical, clinical or empirical claim is newly certified by these links. In particular the likelihood/delta approximations, idealized case weighting and causal graph assumptions remain explicitly conditional.

## Complete dependency changes and preservation

The following lists **every changed full-item and syllabus deps array**. The originally retained differences in rows 1.5, 1.8 and 4.6 are now synchronized to the actual raw written lists in a separately authorized metadata followup. These synchronize preexisting written uses and add no quota edges. Raw 2.7 uses epi-2.5 (an alias of stat-6.5), not the loader-normalized ID; its item and row were already consistent. Historical original-candidate evidence is `/tmp/atlas-epi-prereqs-evidence/deps.json`; corrected raw item/row evidence is `/tmp/atlas-epi-metadata-followup/deps.json`.

| Item | Full item before → after | Syllabus row before → after |
|---|---|---|
| 1.2 | `[epi-1.1]` → `[epi-1.1, stat-3.5]` | `[epi-1.1]` → `[epi-1.1, stat-3.5]` |
| 1.5 | `[epi-1.1, epi-1.2, pma-8.6]` → `[epi-1.1, epi-1.2, pma-8.6, pma-5.15, pma-6.21]` | `[epi-1.1, epi-1.2]` → `[epi-1.1, epi-1.2, pma-8.6, pma-5.15, pma-6.21]` |
| 1.8 | `[demo-1.7, epi-1.2]` → `[demo-1.7, epi-1.2, prob-1.6.1]` | `[epi-1.7]` → `[demo-1.7, epi-1.2, prob-1.6.1]` |
| 1.9 | `[epi-1.6, mathbio-4.1]` → `[epi-1.6, mathbio-4.1, prob-2.2.13]` | `[epi-1.6, mathbio-4.1]` → `[epi-1.6, mathbio-4.1, prob-2.2.13]` |
| 2.4 | `[epi-2.2]` → `[epi-2.2, prob-2.1.1a]` | `[epi-2.2]` → `[epi-2.2, prob-2.1.1a]` |
| 2.7 | `[epi-2.5]` → `[epi-2.5, pma-5.8]` | `[epi-2.5]` → `[epi-2.5, pma-5.8]` |
| 2.8 | `[epi-2.2]` → `[epi-2.2, prob-2.1.1a]` | `[epi-2.2]` → `[epi-2.2, prob-2.1.1a]` |
| 2.11 | `[epi-2.10]` → `[epi-2.10, prob-1.6.9a]` | `[epi-2.10]` → `[epi-2.10, prob-1.6.9a]` |
| 3.2 | `[epi-3.1]` → `[epi-3.1, stat-5.6]` | `[epi-3.1]` → `[epi-3.1, stat-5.6]` |
| 3.3 | `[epi-3.1]` → `[epi-3.1, prob-2.2.1]` | `[epi-3.1]` → `[epi-3.1, prob-2.2.1]` |
| 3.9 | `[epi-1.2]` → `[epi-1.2, stat-5.6]` | `[epi-1.2]` → `[epi-1.2, stat-5.6]` |
| 3.12 | `[epi-3.10]` → `[epi-3.10, prob-1.2.5]` | `[epi-3.10]` → `[epi-3.10, prob-1.2.5]` |
| 4.6 | `[causal-1.1, causal-3.5]` → `[causal-1.1, causal-3.5, causal-4.3]` | `[epi-4.1, causal-3.5]` → `[causal-1.1, causal-3.5, causal-4.3]` |
| 4.13 | `[epi-4.6]` → `[epi-4.6, causal-4.4]` | `[epi-4.6]` → `[epi-4.6, causal-4.4]` |

At original immutable candidate a13604f7, temporary explicit guard `/tmp/atlas-epi-prereqs-evidence/guard.mjs` compared the complete baseline/candidate objects including actual function source. At that candidate, all **47** written objects retained every field except exactly these 14 append-only idea paragraphs and 15 deps; the entire syllabus retained every field except these same additions. The later raw followup audit additionally permits only the three declared syllabus-list corrections and the literal 3.9 censoring qualification; it preserves all other raw fields/functions/flags. All existing shared helpers and `epi-source-audit.js` are byte-for-byte unchanged. Baseline, mapping, guard output and read-only inventory are in that same directory. No snapshot assertion is added to default tests, and no global inventory/source queue is edited.

## Independent checks and native pixels

`node tests/verification-epi-prereq-audit.mjs` passes **11 independent mathematical groups**, without production helper imports: fixed-exposure Poisson likelihood including zero boundary; constant-risk Taylor remainder and continuous-hazard FTC; dependent expected-count linearity; exact discrete survival tail/remaining-life integrals; conditional-product LRs/serial-parallel probabilities and mixture dependence; smooth Gaussian cost cut-off derivative/cost comparisons; finite length-weighted moments; exact independent-binomial risk-difference variance and log-risk gradients; fixed-exposure Poisson log-rate delta variance; Gaussian exponential tilt/tail/whole-weight identities; and generative binary common-cause standardization/Simpson reversal with positivity. These check conditional mathematical models, not biomedical efficacy or empirical transfer.

The **9 existing EPI source-audit mathematical/fixture tests pass** unchanged. This preserves their previous checks; it is not a new source-closure assertion.

`EPI_PREREQ_OUTPUT=<own-directory> node tests/verification-epi-prereq-prose.mjs` passes **28 fresh native mounted pages**, all 14 changed ideas at **320px, light and dark**. Runtime/TeX/blank lists are clean; actual idea scroll widths and all rendered TeX rectangles fit. Complete ideas are captured, and all separately captured appended paragraphs were inspected in both themes with readable, unclipped prose/equations. Text isolation is performed after native mounting checks, keeping the 284px content width. Evidence: `/tmp/atlas-epi-prereqs-evidence/native/` and `native.log`. This does not recertify every inherited interaction or biomedical source claim.

Strict build: **6684 written + 6890 planned, 450 chapters, 85 collections; 0 errors, 0 warnings**, home **112759 bytes gzip**. EPI static: **47 items, 0 errors, 0 warnings**. Logs: `/tmp/atlas-epi-prereqs-evidence/{math,existing-math,build,static,guard}.log`.

## Bridge assessment

The actual changed-ID bridge search finds only `content/bridges/causality.js` → epi-4.6. Its note already states that a common cause mixes mechanisms, stratification removes confounding under model assumptions, and mediators/colliders require different treatment. The new paragraph makes the back-door/positivity assumptions explicit and remains compatible with that bounded note. No bridge update is needed or made.


## Authorized raw metadata and censoring followup

The 1.5 row now retains its already-written pma-8.6 exponential-solution input. The 1.8 row now uses already-written demo-1.7 and epi-1.2, which support its explicit direct-standardization comparison and person-time calculation. The 4.6 row uses canonical causal-1.1 in place of its epi-4.1 alias. Raw 2.7 remains epi-2.5 in both item and row; the earlier report had mixed this with loader-normalized stat-6.5. These are metadata/report corrections, with no additional written/known/whole-syllabus edge credit.

The inherited 3.9 argument's “whatever the censoring” is narrowed to non-informative censoring preserving the hazard in the observed at-risk process. Informative censoring can break E[d]=lambda E[T]: with event time X exponential and censor C=X/2, no event is observed but lambda E[T]=1/2. This qualification agrees with the existing conditional-hazard argument and appended approximation limits. No runtime or model function changes. Full followup checks and exact raw-list evidence are recorded in `epi-prerequisites-metadata-followup.md`.
