# EPI prerequisite independent peer — 20 October 2026

**Accept the combined immutable boundary: producer `a13604f7bae12f3718d28fe089c18e4957e790d3` plus correction `8eb0cb02810d979f8518c1c58dae877b09106fbf`.** I independently archived and reviewed both exact commits; the corrected boundary resolves the findings below. No content, runtime, source flags or global files were changed by this peer.

## Proof and hypothesis review

I independently read each complete consuming statement, argument, caption and scope and every actual target statement/proof idea. All fifteen new dependencies across fourteen consumers are genuine inputs to existing calculations.

| Consumer → target | Independent assessment |
|---|---|
| 1.2 → stat-3.5 | The fixed positive exposure Poisson log likelihood has its maximum at d/T; zero count is a boundary maximum. This is an approximate count model, not an assertion that counts conditional on arbitrary observed stopping times are Poisson. |
| 1.5 → pma-5.15, pma-6.21 | Taylor gives the small-hazard expansion and signed remainder. Integrating log survival yields cumulative hazard for continuous hazard and positive survival. The original cohort and competing-risk restrictions remain. |
| 1.8 → prob-1.6.1 | Expected reference counts add with specified exposures regardless of dependence; this proves neither a Poisson interval nor cross-population comparability. |
| 1.9 → prob-2.2.13 | The nonnegative tail integral gives mean age at death and, after conditioning on survival, mean remaining life. Divergent means remain permitted; period-table interpretation remains explicit. |
| 2.4, 2.8 → prob-2.1.1a | Apply product independence separately under each disease stratum. Products, complements and division give the test-combination/LR formulas. Mixture independence is neither needed nor implied. |
| 2.7 → pma-5.8 | Smooth interior cost minimizers have zero derivative. This yields the LR/density threshold with positive costs/prevalence and a nonzero reference density; boundaries and other stationary candidates must also be compared. |
| 2.11 → prob-1.6.9a | The variance identity rewrites the length-weighted mean, assuming a positive finite first moment and finite second moment. It does not certify empirical screening selection or individual prognosis. |
| 3.2, 3.9 → stat-5.6 | The log-ratio gradients give the displayed large-sample binomial/approximate Poisson formulas at positive interior parameters. Zero observed counts break the log plug-in; finite-sample exactness is not asserted. |
| 3.3 → prob-2.2.1 | Independent sample-proportion variances add after negating the reference term. That variance identity is exact under the sampling model; normality is an additional asymptotic step. |
| 3.12 → prob-1.2.5 | Completing the normal square yields the exponential-tilt tail share, and a common shift multiplies weights. The exponential is an idealized relative weight, not a globally bounded disease probability or empirical guarantee. |
| 4.6 → causal-4.3 | The adjustment set must have no exposure descendants and block every entering path; the theorem must apply at each of the two exposure values with positivity in positive-mass strata. Association alone cannot establish these assumptions. |
| 4.13 → causal-4.4 | Different severity weights can reverse the crude comparison; equal weights preserve a benefit in every stratum. Causal identification additionally requires sufficient measured severity/back-door conditions and both treatment options; a noisy proxy can fail. |

## Findings resolved by the narrow correction

The initial report mixed canonical alias IDs from the atlas loader with literal raw chapter arrays. I compared complete raw objects and full syllabus rows directly instead. The new fifteen additions were exact, but inherited differences remained in three touched rows: 1.5 omitted existing pma-8.6, 1.8 omitted existing epi-1.2 and used the epi-1.7 alias for demo-1.7, and 4.6 used the epi-4.1 alias for causal-1.1. The underlying uses justify synchronizing these rows. Raw 2.7 already agrees with its row (`epi-2.5`, alias stat-6.5); its report entry needed to distinguish literal from canonical IDs. These corrections add no written quota edges.

The retained original 3.9 argument said the event/exposure identity held “whatever the censoring.” That is too broad. If event time X is exponential with rate λ and censoring is C=X/2, no event is observed, while observed time is X/2: E[d]=0 but λE[T]=1/2. For a fixed independent censoring time c, by contrast, E[d]=1−exp(−λc)=λ∫₀ᶜexp(−λt)dt. The corrected idea now says “under non-informative censoring that preserves this hazard in the observed at-risk process.” This resolves the overbroad claim without changing a numerical model or function.

## Independent evidence

Evidence directory: `/tmp/atlas-thermo-epi-peer`. All review used immutable archives, not the mutable producer checkout.

- `node tests/verification-epi-prerequisites-peer.mjs`: **1,363 independently authored assertions** (`math-peer.log`), without production helper imports. Covers fixed-exposure likelihood including zero events, exponential remainders, continuous hazard integration, dependent count expectations, exact finite-law survival tail/remaining-life integrals, length-weighted moments, stratum products and mixture dependence, Gaussian cutoff stationarity/global comparisons, exhaustive independent-binomial risk-difference variance, log-risk/count substitution, rate-ratio delta algebra, direct normal exponential-tilt integration, generative back-door/Simpson examples, and the explicit informative-censoring counterexample/fixed independent-censoring identity. Numerical witnesses supplement the mathematical reading; they do not prove statistical coverage or biomedical efficacy.
- Producer math rerun: **11 groups** (`math-producer.log`). Existing EPI source-audit fixture/math suite: **9/9 pass** (`existing-math.log`); this is preservation evidence, not a new historical-source audit.
- Fresh independent native mounting: **28 cases**, fourteen changed ideas at actual **320px** in both themes (`native.log`, `native/`). I personally inspected all complete own proof outputs, including every appended argument, in light and dark; text and equations were legible and unclipped. Runtime/TeX/blank lists and actual prose/math bounds were clean. These are changed-text/default-visualization checks, not recertification of every inherited interaction or biomedical claim.
- The actual built causality bridge's EPI 4.6 card was mounted and personally inspected at **320px in both themes** (`bridge.log`, `bridge-{light,dark}-320.png`). Its note explicitly limits stratification to model assumptions and distinguishes mediators/colliders, matching the added back-door/positivity qualification. No bridge edit is needed. This is the only bridge reference to a changed EPI ID.

Final corrected archive verification:

- Own explicit temporary guard (`guard-final.log`, script `guard.mjs`) compares all **47 complete raw objects and visualization-function sources** with the original pre-batch parent. It permits only fourteen appended ideas, fifteen exact new deps and the literal authorized 3.9 phrase qualification. All other properties/flags, helpers, source-audit module and collection metadata are unchanged. Complete syllabus equality permits only the fifteen original additions and three exact authorized row corrections. Each of the fourteen affected full raw item/row lists now agrees exactly. Untouched inherited row differences at 1.6, 1.12, 4.2, 4.3 and 4.5 remain outside this batch; the report does not claim all untouched rows agree. This snapshot audit is local and explicit, excluded from default tests.
- I read the complete correction diff and report. The three corrected arrays match the existing proof uses described above; raw 2.7 is correctly distinguished from its canonical alias in the revised report. No new edge credit is awarded.
- Corrected 3.9 was freshly mounted at 320px in both themes (`native-final.log`, `native-final/`), with clean runtime/TeX/blank lists and text/math bounds. Both complete proof outputs were personally inspected. I also mounted the **actual strict-built app route** `#/t/epi-3.9` at 320px in both themes, checked the exact censoring qualification and all proof math/prose horizontal bounds, and personally inspected the visible correction (`production.log`, `production-{light,dark}-320.png`). All browser jobs closed.
- Corrected strict build (`build-final.log`): **6684 written / 6890 planned / 450 chapters / 85 collections, 0 errors, 0 warnings**, home **112761 bytes gzip** in this archive. EPI static (`static-final.log`): **47 items, 0 errors, 0 warnings**.
- Read-only final inventory (`counts-final.log`) confirms **25 written-to-written / 26 written-to-known / 44 whole-syllabus**, **zero unknowns**, unchanged by the metadata/qualification correction. No inventory file was written.

Acceptance is for the bounded mathematical prerequisite batch and its resolved metadata/qualification findings. It is not a new historical, clinical or empirical source certification. Historical source obligations and source flags remain untouched.
