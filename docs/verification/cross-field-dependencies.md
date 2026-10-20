# Cross-field prerequisite gate

2026-10-20. The executable inventory in `cross-field-dependencies.json` checks
MASTER_PLAN §7.3 against accepted written and planned prerequisite records. Its acceptance metadata explicitly excludes the frozen BIGHIST3.5candidate edge.

Of 64 non-math collections, **23 have fewer than 25 published prerequisite edges to
written ideas in a different field**. Their combined shortfall is 448 edges. Even
including planned items and planned prerequisites, **19 collections remain below 25**.
The wave gate is open. Counts are not evidence that a prerequisite is justified.

The inventory counts each directed item-to-prerequisite edge once. It separates
written-to-written, written-to-known and whole-syllabus counts; related links and
same-field links between collections do not count. Missing IDs are reported separately.
This distinction prevents an unwritten prerequisite from being presented as currently
available to a reader.

`node scripts/audit-cross-field-deps.mjs` regenerates this inventory while preserving acceptance metadata and explicitly recorded exclusions. Stale, unknown or duplicate exclusions fail instead of silently changing the ledger. `--raw` emits the full code inventory to stdout without writing this file. Neither mode independently accepts prerequisite arguments. Run
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


## Accepted checkpoint through6978d28

Published shortfall857→855 through actual prerequisite arguments: soc4.1→prob3.6.1 for the sparse Poisson limit (soc9→10published,36→37whole) and art4.3→ladr2.22 for dependence of four response vectors in R³ (art7→8published,28→29whole). Root read the actual arguments;53/64collections remain below25published edges and28whole syllabi remain below25. See [network acceptance](soc-erdos-renyi-followup.md), [colour acceptance](art-metamer-followup.md) and [combined checkpoint](checkpoint-6978d28.md).


## Accepted checkpoint through1cf1a67

Published counts remain at shortfall855,53/64collections below25published and28whole syllabi below25. Psych4.8 retains its actually used rca8.13 absolute-integrability prerequisite and moves unused planned art6.2 to related context, reducing the whole-syllabus psych count45→44 without changing published counts. See [retinal acceptance](psych-centresurround-followup.md) and [combined checkpoint](checkpoint-1cf1a67.md).


## Accepted checkpoint through fb1cb6e

The exact accepted snapshot has847 published-edge shortfall,53/64 non-math collections below25 published prerequisites and28 below25 over their complete syllabi. Big History3.9 now explicitly uses the actual kinetic-energy definition mech3.1, with chapter/syllabus synchronized; that collection already met the published target, so the summed shortfall stays847. The inventory excludes the ongoing extinction logistic prerequisite and other unaccepted drafts. Counts do not establish justification; the gate remains open.


## Psychology reaches the published prerequisite target

Three actual existing computations now name their written inputs: psych2.10→prob2.1.12 for independent-pair indicator expectation, psych3.1→nla2.8 for the full-rank log-coordinate least-squares fit, and psych4.4→sig2.10 for group-end finite moving averages before subsampling. Independent semantic/strict/static and six320theme checks pass; no source flags or executable visualizations change. Psychology has25published/48whole-syllabus edges. The current exact inventory has840summed published-edge shortfall,52/64collections below25published and28whole syllabi below25. See [independent acceptance](psych-crossfield-prerequisites-peer.md). Counts remain separate from justification; Wave5's gate is open.


## Political science reaches the published prerequisite target

Six independently reviewed existing arguments now identify their actual written inputs: dot-product norm expansion, directed BFS, cross-product triangle area, positive beta integral, exp/log derivative limits and the variance-bound weak law. Political science has25published/34whole-syllabus edges; current global shortfall834,51/64collections below25published and28whole syllabi below25. Source flags remain separate. The independently reviewed5.8runtime follow-up corrects six rational half-tie allocations while preserving continuous offgrid evaluation; it closes the recorded runtime finding, without counting another original-source review. See [edge acceptance](polsci-crossfield-prerequisites-peer.md) and [rounding acceptance](polsci-aggregation-rounding-peer.md). Inventory is regenerated from immutable4620575, excluding the ongoing BIGHIST4.5draft prerequisite; a guard caught the draft-inclusive833shortfall before updating any current summary.


## Finite-window ancestry waiting times

Independently accepted BIGHIST4.5 explicitly uses the actual written prob1.2.4 exponential density/mean/memorylessness argument for stationary Markov lengths and delayed-entry censoring. Chapter/syllabus match; the finite-window expected-count law is independently derived rather than treating selected complete lengths as iid exponentials. The current accepted global shortfall is833,51/64collections below25published and28whole syllabi below25. See [source/model acceptance](bighist-admixture-peer.md).


## Deep learning reaches the published prerequisite target

Exact `e57c6a5` adds eight independently reviewed genuine uses across seven written arguments: multivariable chain rule, matrix composition, symmetric spectral modes, variance, isometries, Pythagoras and norm homogeneity. DEEP now has25published/33known/55whole-syllabus edges. The touched stability bridge note is separately reviewed at `35c129f`. No source flag closes;5.12label and logarithmic-thumb findings remain separately tracked. See [independent review](deep-crossfield-prerequisites-peer.md).

Current accepted global shortfall807,47/64collections below25published,28whole syllabi below25. The explicit frozen BIGHIST3.5candidate edge is excluded from this accepted inventory. Counts remain separate from prerequisite justification.


## Thermodynamics reaches the published prerequisite target

Exact `3fea5ed` adds11independently reviewed derivational uses across10written items: FTC, chain rule, interior extrema, variance, independence, Gaussian integral and Stirling expansion. THERMO now has25published/27known/38whole-syllabus edges. Independent peer read all8actual targets, all10consumers and own20fresh narrow theme outputs. No touched consumer is a bridge step; all visualization functions and sourceflags remain unchanged. See [peer](thermo-prerequisites-independent-peer-2026-10-20.md). Current accepted shortfall796,46/64below25published,28whole syllabi below25, frozenBIGHISTedge excluded. The snapshot-only fullobject guard is explicit-only; enduring defaulttests retain the3independent mathematical groups.


## Control theory reaches the published prerequisite target

Exact `cdc478c` adds12independently reviewed derivational inputs across11written items, bringing CTRL13→25published,22→34known and37→49whole-syllabus. The quotient/chain/determinant/coordinate/Lyapunov/extremum/Lipschitz arguments personally match actual written targets; full50object/function/flag guards, independent766families/7848cascade timepoints,22fresh narrow outputs and4touched feedback/stability cards pass. See [peer](ctrl-crossfield-prerequisites-peer.md). Current accepted shortfall784,45/64below25published,28whole syllabi below25; frozenBIGHISTedge excluded. No source review closes.


## Energy reaches the published prerequisite target

Exact `cabd1be` adds11independently reviewed mathematical uses across10written arguments (extrema, MVT, work/exergy integrals, Taylor bounds, matrix evolution and vector projection), bringing ENERGY14→25published,17→28known,35→46whole. All45objects/functions/flags and fullsyllabusguarded;839independent cases,20fresh narrow theme proof outputs, strict/static pass. Noexistingbridge contains anenergy step. See [peer](energy-crossfield-prerequisites-peer.md). Current accepted shortfall773,44/64below25published,28whole below25. No sourceclosure; frozenBIGHISTedge excluded.


## Robotics and algorithms reach the published prerequisite target

Independent exactcd37ccc accepts10genuine ROBOTuses (15→25written,15→25known,30→40whole) with regularity, rank, spectral and chain/composition arguments. Its accepted3.7camera/convention/runtime remain byteidentical. See [ROBOTpeer](robot-crossfield-prerequisites-peer.md). Exact50424bf adds9genuine ALGOuses (16→25written,18→27known,23→32whole): expectation, Cauchy–Schwarz, Chebyshev/Markov/union bounds, logconcavity, dependence and determinant proofs. See [ALGOpeer](algo-crossfield-prerequisites-peer.md). Full197ALGO and30ROBOTobject/function/flag guards, independent903ROBOTcases and113854ALGOchecks plus fresh18/16narrowtheme proofoutputs pass. NochangedIDis anexistingbridgestep.

Current accepted shortfall754,42/64below25published,27whole syllabi below25; frozenBIGHISTedge excluded. ALGO5.18upperbound/readout/retrycap findings remain separatelyopen and are not certified by prerequisite acceptance. No sourceflagclosure.


## Sociology exceeds the published prerequisite target

Exact `d345105` adds11genuine used dependencies across8items; independentpeer `5fcd25f` confirms actualmoment/Cauchy/spectral/geometricseries/Markov/variance arguments and fixedshuffle/periodicity/tie/boundedbelief qualifications. SOC15→26published,18→29known,41→52whole. Globalshortfall reduces10, not11: current744,41/64below25published,27wholebelow25.53object/function/flag/fullsyllabusguards,38SOCmathgroups, independentgraph/permutation/matrix/tailcases and fresh16narrowtheme pages/ownpixels pass. See [peer](soc-crossfield-prerequisite-peer.md). NochangedIDis anexistingbridgestep. Sourceflags unchanged; frozenBIGHISTedge excluded.


## Imaging reaches the published prerequisite target

Exact `37ea502` adds eight genuine inputs across seven items, taking IMAGING from 17 to 25 published prerequisites (24→32 known, 38→46 whole syllabus). The peer read the actual variance, inverse-function, conditioning, Fourier, projection, SVD and independence arguments. The retained prose separates finite-energy filter identities from heteroscedastic Poisson ROI measurements, and labels the row-angle proxy honestly. Independent review also accepts the inverse-problems bridge note and four narrow statement splits. See [peer evidence](imaging-crossfield-prerequisite-peer.md).

The source queue does not change: Hounsfield3.18 remains open. The singular-energy/native-dose runtime followup for2.9 is separately reviewed and is not certified by this prerequisite review. Current accepted shortfall is736, with40/64 collections below25 published and27 whole syllabi below25. The frozen BIGHIST edge remains excluded.


## Accepted WAVES prerequisites and IMAGING runtime peer

Thirteen actual derivational uses across twelve WAVES items bring written/known/whole counts from 12/20/27 to 25/33/40. Independent target-proof review, 1,145 fresh mathematical cases and 24 narrow theme renders support acceptance, including bounded Taylor, Parseval, Hermitian mode and stationary-ray hypotheses. No existing bridge step is touched. See [WAVES independent peer](waves-crossfield-prerequisites-peer.md). Accepted shortfall is 723, with 39/64 collections below 25 published links and 27 whole syllabi below target.

The separate [IMAGING2.9 runtime peer](imaging-dual-energy-runtime-peer.md) accepts all 41 offered singular pairs as explicit unavailable decompositions, preserves all 5,110 invertible-pair arithmetic, and independently verifies local dose controls and replay. It adds no prerequisite edge and closes no historical-source flag. The frozen BIGHIST edge remains excluded.


## Accepted AERO and DEMO prerequisite batches

Independent [AERO review](aero-crossfield-prerequisite-peer.md) accepts fourteen consumed mathematical inputs across thirteen written items, bringing counts 11/25/55→25/39/69. The harmonic bridge remains accurate. Independent [DEMO review](demo-prerequisites-independent-peer.md) accepts thirteen inputs across twelve items, including the corrected multiline3.14 syllabus row, bringing 12/13/24→25/26/37. All complete changed-row dependency lists now match, and all functions/source flags are preserved. Accepted shortfall is696, with37/64 collections and26 whole syllabi below25. No source obligation closes.


## Accepted GEOL mathematical inputs

The [independent GEOL review](geol-independent-peer-2026-10-20.md) accepts fifteen actual inputs across fourteen consumers: written/known/whole10/21/48→25/36/63. Full object/function/source-flag preservation, exact syllabus lists, independent equations and28 own inspected narrow theme outputs pass. The same4.2 equation is split for readability. No bridge step is touched. Accepted shortfall681,36/64 below25 published,26whole syllabi below25; source queue unchanged.


## Accepted INFO inputs and entropy bridge

The [independent INFO review](info-independent-peer-2026-10-20.md) accepts sixteen used edges across fifteen consumers:9/9/12→25/25/28. Its Markov pair-chain argument proves only the named finite-chain special case, with explicit stationary/irreducible conditions. Complete57object/function/flag preservation, exact full syllabus lists, independent pair-state mathematics and thirty narrow theme outputs pass. The same peer accepts the coordinator's entropy bridge qualification, including both actual built cards. Shortfall665,35/64 below25published,25whole syllabi below25. No source flag closes.


## Accepted chemical-kinetics inputs

The [independent KIN peer](kin-crossfield-prerequisite-peer.md) accepts sixteen actual inputs across sixteen consumers:9/10/23→25/26/39. All49objects/functions/flags/helpers, every full item/syllabus dependency list, independent mathematics and32narrow theme outputs pass. The3.4syllabus alias now names the already consumed written harmonic-oscillator proof; this adds no edge beyond the sixteen counted inputs. No bridge is touched. Accepted shortfall649,34/64below25published,24whole syllabi below25.


## Accepted physiology inputs

The [independent PHYSIO peer](physio-crossfield-prerequisite-peer.md) accepts fifteen actual inputs across fourteen consumers:10/20/38→25/35/53. All55objects/functions/flags/helpers, complete raw syllabus lists, numerical assertions and28changed narrow-theme proofs pass. The1.3row now matches its written first-law reference, without claiming an unwritten proof. Two default-test dependency assertions retain required subsets and all numerical checks. Feedback/diffusion bridge cards remain accurate. Accepted shortfall634,33/64below25published,24whole syllabi below25; no source closure.


## Accepted atmosphere/ocean inputs and curl correction

The [combined independent GEO peer](geo-prerequisites-independent-peer.md) accepts fifteen inputs across fifteen consumers, giving10/15/31→25/30/46. All34objects/functions/flags/fullsyllabus lists, independent mathematics and thirty narrow theme outputs pass. Its reviewer also identified an inherited2.7curl sign error; a separately authored negative sign with constant-rotation/divergence hypotheses received exact-diff,906component checks and both-theme native review before combined acceptance. Zero-column conclusion and numerical code are unchanged. Accepted shortfall619,32/64below25published,24whole syllabi below25.


## Accepted behavior and epidemiology inputs

The [BEHAV peer](behav-independent-peer.md) accepts fourteen inputs across thirteen consumers,11/15/17→25/29/31, plus four equivalent field wraps. All67objects/functions/flags, exact syllabus lists,106,445independent assertions and32changed-field images pass. No bridge is touched.

The [EPI peer](epi-prerequisites-independent-peer.md) accepts fifteen inputs across fourteen consumers,10/11/29→25/26/44. Three inherited raw syllabus mismatches and the3.9censoring qualification were corrected and re-reviewed; informative censoring has an explicit counterexample. All47objects/functions/flags/helpers and full changed-row lists pass; original/new corrected native outputs and causality bridge cards were personally inspected. No source claim or biomedical scope expands. Accepted global shortfall590,30/64published collections below25,23whole syllabi below25.


## Accepted bioinformatics inputs and accounting safeguard

The [BIOINF peer](bioinf-crossfield-prerequisite-peer.md) accepts fifteen inputs across eleven consumers,10/15/31→25/30/46. All47objects/functions/flags/full raw item/row lists pass, including an existingFekete row backfill. Common valid seed placements and the LSEoverflow sign are precisely qualified/corrected; independent mathematics and22narrow theme outputs pass. No bridge is touched. Accepted shortfall575,29/64below25published,23whole syllabi below25.

The separately [reviewed accounting tool](cross-field-accounting-independent-peer.md) preserves explicit exclusions and acceptance metadata by default, rejects stale/unknown/duplicate exclusions before writing, and keeps raw output separate. Its frozen fixtures and isolated CLI checks do not access source content or certify candidate arguments. The actual accepted/raw inventories differ only by the one frozen edge.


## Accepted macroeconomics inputs and signed regression notation

The [combined MACRO peer](macro-crossfield-prerequisite-peer.md) accepts sixteen used inputs across fifteen consumers,9/12/15→25/28/31. All48objects/functions/flags/helpers/full raw lists, three justified row repairs and signed-beta clarification pass. Independent QR checks on actual full/OECD samples, theorem calculations and30base+2followup narrow-theme proofs support the review. No bridge is touched. Accepted shortfall559,28/64published collections below25,22whole syllabi below25.


## Accepted circuit inputs and bounded statement repairs

The [combined CIRC peer](circ-prerequisites-independent-peer.md) accepts seventeen inputs across fifteen consumers,8/22/40→25/39/57. Three statements now distinguish structural count from consistency, singular port conversions and diode load/domain/asymptotic hypotheses. ExactBigInt counterexamples,6,138independent assertions,30proof+6actual built-statement narrow-theme images and full56object/function/flag/helper preservation pass. Two touched rows backfill existing inputs without extra credit. No bridge changes or historical source closure:4.17remains unchanged/open. Accepted shortfall542,27/64below25published,22whole syllabi below25.

## POPGEN, TOC and GEOG combined acceptance

[POPGEN](popgen-independent-wrap-peer.md) contributes net sixteen genuine inputs after removing an analogy-only edge; [TOC](toc-crossfield-prerequisite-peer.md) adds eighteen; [GEOG](geog-crossfield-prerequisite-peer.md) adds sixteen. Each reaches25 written inputs. Independent reviews include complete objects/functions/flags/raw lists, actual target proofs, mathematical checks, strict/static validation and fresh narrow light/dark pixels. Bounded statement qualifications and equivalent wraps are included. Live shortfall492,24/64below25published,19whole syllabi below25. No source closure; the frozen excluded edge remains excluded. These changes await the next full integrated checkpoint.

## REL bounded acceptance

[REL independent peer](rel-independent-peer-followup.md) accepts sixteen genuine inputs across twelve consumers,7/8/30→23/24/46. Corrected unit-normalized four-acceleration and the small-rapidity Newtonian rocket criterion, plus three equivalent narrow statements. All57objects/functions/flags/helpers/raw lists,7,341independent assertions and24own narrow native cases pass. REL remains2below the published target. Live476shortfall,24/64below25published,19whole syllabi below25. No source closure; this is after the2167-test checkpoint.

## CM bounded acceptance

[CM peer](cm-crossfield-prerequisite-peer.md) accepts nine genuine mathfield inputs,7/15/15→16/24/24. Same-field physics links receive no quota credit. The combined batch qualifies nondegenerate effective-mass extrema, positive hole/electron orbit periods and the in-plane gradient, and wraps three equivalent statements. All52objects/functions/flags/helpers/fullrawlists and own independent math/narrow pixels pass. CM remains9below25written. Live467shortfall,24/64below25published,19whole syllabi below25. No sourceclosure; later than2167-test checkpoint.

## CLIMATE combined acceptance

[CLIMATE independent peer](climate-independent-peer.md) accepts nineteen genuine inputs across seventeen consumers,6/19/37→25/38/56. Complete51objects/functions/flags/helpers are preserved. Six equivalent statement wraps, exact clickable source links and removal of the unsupported between-blackbody-slopes assertion close independent findings. Seventeen full touched raw lists match; four untouched inherited mismatches remain unendorsed. Independent1,205mathassertions and fresh complete statement/scope/proof pixels pass. Live448shortfall,23/64below25published,19whole syllabi below25; pendingQINFO and frozenBIGHIST inputs remain excluded. No source closure; after2167-test checkpoint.
