# CAUSAL genuine different-field prerequisites

Producer baseline `83cd228e4ec601a4c9c5517a9c80029e5b3ac30e`; complete CAUSAL source blobs are identical to coordinator `58f5976` before edits. Authoritative metadata classifies CAUSAL and STAT as stats, but PROB/COMB/LADR as math. This prerequisite-only boundary adds **23 genuine different-field edges across 20 written consumers**, moving **2/2/3 to 25/25/26** written/known/whole, confirmed by a read-only inventory call. No same-field STAT link earns quota credit.

All eleven actual complete target statements/proofs and all twenty complete consumer statements/proofs/scopes were read independently, recorded in `/tmp/atlas-new-arch-source/causal-prereqs/actual-proofs.txt`. Deep's separate read-only preparation was useful context, not substitute proof reading. The exact complete raw lists and appended paragraphs are in `tests/causal-prerequisites-manifest.json`.

| Consumer | New target(s) | Consumed step |
|---|---|---|
|1.3|prob-1.6.1;prob-4.1.13|Integrable-effect linearity and treatment-partition tower decomposition into ATT/ATU.|
|1.5|comb-1.1|Count binary treatment allocations indexing an interference response schedule; no assignment independence claimed.|
|1.6|prob-4.1.9|Conditional linearity supplies ATT in the selection-bias decomposition, without exchangeability.|
|1.9|prob-4.1.13|Average identified conditional counterfactual means over discrete covariates.|
|1.10|prob-4.1.13|Average integrable effects over modifier strata.|
|1.11|prob-4.1.13|Nested treatment/stratum fields yield marginal success-probability mixtures before taking odds.|
|2.2|prob-1.6.1;comb-1.6|Count assignments containing one unit, then average fixed outcomes with dependent assignment indicators.|
|2.3|prob-1.6.9a|Centered-square nonnegativity justifies dropping the effect-variance correction after the exact identity.|
|2.4|comb-1.6|Count fixed-arm equally likely assignments in the exhaustive sharp-null tail.|
|2.5|prob-2.2.1|Independent block randomizations give uncorrelated centered block estimators and squared-weight variance sum.|
|2.6|prob-4.1.13|Marginalize already identified stratum means using population rather than arm covariate weights.|
|2.7|prob-4.1.1a;prob-4.1.13|Positive finite-cell conditional expectation cancels propensity, followed by tower averaging; bounded finite tables ensure integrability.|
|2.9|ladr-6.57|Centered finite-population projection and Pythagoras explain the residual-variance component, not the entire Lin asymptotic theorem.|
|3.3|prob-2.1.10|Acyclic non-descendants are functions of noise blocks disjoint from the current node's independent disturbance.|
|4.3|prob-4.1.13|Tower in the interventional law supplies marginalization after the graphical argument justifies replacements.|
|4.4|prob-4.1.13|Nested group/group-plus-stratum fields produce group-specific mixture weights.|
|4.5|ladr-6.61|Population projection normal equations derive the explicit model's M-bias covariance coefficients.|
|4.6|ladr-6.61|Positive-definite population predictor Gram matrices give total/direct coefficients for the specified control spans.|
|4.7|ladr-6.61|Residualizing treatment against the instrument derives the model-specific bias denominator.|
|4.12|ladr-6.61|Within-group baseline/final covariance gives slope rho and descriptive ANCOVA contrast, without causal identification.|

One inherited raw row conflict is repaired without credit: Rubin-paper 1.12's written list is [causal-1.1,causal-1.6,causal-1.7], while the old row listed [causal-1.1,causal-2.1]. Its actual observational matching argument consumes potential outcomes, observed-versus-causal comparison and ignorability. The raw row now matches that justified existing written order. Randomization is historical context here, not an additional proof input. All other full raw lists retain their order exactly.

The explicit optional-baseline guard `verification-causal-prerequisites.mjs` passes **48 complete objects and 48 function serializations**, every flag/scope/caption/model, chapter metadata, helper/collection/audit bytes, the entire **96-row** syllabus and all written/raw dependency lists. Default tests do not freeze full prose or review flags. Own ten mathematics groups/**4,739 checks** include 3,672 complete fixed-size random assignments, both covariance signs/Neyman correction/sample-variance unbiasedness, conditional/tower/IPW finite laws, independent block variances, logistic attenuation/common-RR collapse, discrete sharp-null tails, projection equations for the actual M-bias/bad-control/Z-bias/Lord covariance models, and disjoint noise blocks. All sixteen existing CAUSAL math tests pass unchanged. Strict build 0/0, static48/0/0.

The first full 253px native source-string run has **40 states**. All new complete proofs fit and have no runtime/TeX/blank issue, but it preserves inherited statement overflow in 1.6,1.9,2.6,2.7,2.9,3.3,4.3 (both themes). These require a separate equivalent-wrap successor; the failure is recorded rather than waived. Own final complete production and 253px statement/scope/proof pixel inspection remains pending that successor.

A separate authorized correctness successor is also required for inherited claims about RR collapsibility, sample variance arm sizes/covariance signs, discrete exact-test levels, finite-sample propensity balance, regression adjustment bias/regularity, and controls with direct effects. The prerequisite-only prefix preservation does not accept those overclaims. No runtime, function, source flag, global file or source closure changes. Independent immutable peer is required for the combined final chain. Evidence: `/tmp/atlas-new-arch-source/causal-prereqs/{baseline,actual-proofs.txt,guard-prereq.log,math.log,existing-math.log,build-prereq.log,static-prereq.log,counts.json,text253-initial}`.
