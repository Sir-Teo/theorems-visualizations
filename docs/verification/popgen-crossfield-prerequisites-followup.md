# POPGEN genuine prerequisites — 20 October 2026

Candidate makes **17 genuine prerequisite additions across 14 written explanations, removes one inherited analogy-only prerequisite**, and reconciles twelve inherited syllabus omissions. The net gain is **16**; read-only inventory moves **9/10/19 → 25/26/35** written-to-written/written-to-known/whole-syllabus, with zero unknown targets. Backfills receive no extra quota credit. This is a producer candidate requiring separate immutable peer acceptance. BIOINF candidate and prior KIN/PHYSIO boundaries remain preserved. No biological model, source flag, private helper, runtime or global file changes.

I read the complete actual statements and proof ideas of all eleven newly consumed targets and the full consumer statements, arguments and scopes. Each new edge supplies a mathematical step already needed by the existing argument or stated bound:

| Consumer | Added target(s) | Consumed input and checked limits |
|---|---|---|
| 1.2 segregation ratios | prob-2.1.1a | Independent fair transmissions yield ordered-pair probabilities; fair transmission and equal viability remain assumptions. |
| 1.3 assortment | prob-2.1.1a | Joint independence across the unlinked loci gives gamete and phenotype products; marginal 1:1 ratios alone are insufficient. |
| 1.9 X-linked recursion | ladr-5.55 | Independent eigenvectors span two-dimensional state; diagonal powers separate conserved mean and alternating difference for this fixed linear recursion. |
| 1.10 diversity | prob-2.2.1; prob-1.6.1; ladr-6.14 | Independent bounded gene-copy indicators supply sampling variance; linear expectation gives plug-in bias. Real finite frequency vector and all-ones vector give Cauchy–Schwarz bound H≤1−1/k and uniform equality. |
| 1.16 mixing deficit | prob-1.6.2 | Jensen for convex negative heterozygosity under finite weights, with exact quadratic variance deficit and equality condition. |
| 2.1 sampling model | prob-2.2.1 | Conditional independent Bernoulli draws have additive finite variance; moment calculation alone does not establish absorption. |
| 2.3 expected diversity decay | prob-1.6.1 | Linearity splits first-minus-second moments in the conditional sampling law; expected trajectory distinguished from individual sample paths. |
| 2.9 bottleneck sampling | prob-2.1.1a | Independent draws at fixed source frequency give single-allele absence probability; other allele absences and successive generations need not be independent. |
| 3.2 stationary beta shape | pma-6.21 | Integrate continuous logarithmic-density derivative on compact interior intervals. Positive mutation rates supply integrable endpoint powers; diffusion validity separate. |
| 3.6 branch-length mean | prob-1.6.1 | Weighted finite sum of lineage waiting times has sum of weighted means; independence unnecessary for this step, mutation-on-branches model remains separate. |
| 4.2 constant relative-fitness odds | pma-8.6 | Positive interior odds turn multiplication into log addition; weak-selection replacement and boundary cases separate. |
| 4.4 gradient identity | pma-5.3 | Sum/product derivatives with fixed symmetric viabilities give derivative of mean fitness; finite-step direction is not itself an overshoot bound. |
| 4.5 mean-fitness proof | prob-1.6.2; info-2.2 | Finite normalized positive-weight support permits negative-log Jensen; natural KL is log(2) times bit divergence. Nonnegativity/equality establish strictness, absent support preserved. |
| 4.12 fluctuating environments | prob-2.4.1 | Strong law applies to iid integrable log fitnesses; raw fitness integrability is needed only for separate arithmetic-mean comparison. Zero log-growth rate gives no directional conclusion. |

No empirical, clinical or biological scope is expanded. These are bounded derivations inside the unchanged existing models, not newly estimated biological laws.

## Removal and metadata reconciliation

**Removed:** `stoch-2.4` from written 2.4. Actual stoch-2.4 proves gambler's ruin for independent unit-step bets with fixed probabilities; Wright–Fisher has a different jump law. The existing consumer uses it as a named sanity check, while its proof uses bounded martingale optional stopping. The analogy remains in the prose, but is not a prerequisite. The syllabus already omitted this link, so removing it makes that full item/row list agree. No optional-stopping dependency was removed. This is one fewer counted existing edge.

**Additional genuine bound input:** Cauchy–Schwarz is added to 1.10 because its existing statement already asserts the finite-alphabet upper diversity bound and uniform equality. Actual ladr-6.14 proves the real-vector inequality and equality by orthogonal decomposition/Pythagoras. The new paragraph explicitly applies it to the frequency and all-ones vectors. It is a proof of the already-present bound, not an unrelated link substituted merely for a quota.

**Twelve exact syllabus backfills**, all matching pre-existing written dependencies and adding no new counted edge:

| Row | Previously omitted existing target(s) | Existing use inspected |
|---|---|---|
| 1.4 | prob-2.1.1a | Independent random union gives product probabilities. |
| 1.7 | stat-6.14; stat-3.5 | Pearson fitted-parameter degrees of freedom and fitted frequency; actual target statements/proofs read. |
| 1.8 | comb-1.12 | Multinomial expansion and unordered pair counts; actual theorem/proof read. |
| 1.10 | popgen-1.8 | Multiple-allele diversity formula. |
| 1.12 | popgen-1.2 | Fair single-copy transmissions in path probabilities. |
| 1.13 | popgen-1.10 | Heterozygosity as the redistributed diversity quantity. |
| 1.14 | popgen-1.11 | Existing recessive-load explanation. |
| 1.15 | popgen-1.5 | Random-mating portion of the stated mixture recursion. |
| 2.1 | popgen-1.4 | Independent random sampling/union model. |
| 2.11 | stoch-10.4 | Existing forward/backward Kolmogorov equations reference. This target is planned: its row/name were read, no unavailable authored proof is claimed. |
| 3.5 | popgen-2.1 | Finite population sampling model contrasted with equilibrium approximation. |
| 4.15 | popgen-4.1 | Existing modern survival/reproduction illustration, explicitly separate from historical paper data. |

No alias replacement was needed. All **62 full written item/syllabus dependency lists** now agree, including multiline arrays. Same-field backfills and old already-written crossfield omissions do not increase the new-edge credit.

## Preservation and independent checks

The immutable baseline is exact parent `f893017643c70994854fa6af773c68606a2be26f` at `/tmp/atlas-new-arch-source/popgen-prereqs/baseline`. `tests/popgen-prerequisites-manifest.json` contains exact additions/expected changed ideas, exact row corrections, the exact removed dependency list and the exact display-wrap exception.

Explicit-only `verification-popgen-prerequisites-audit.mjs`, run with `POPGEN_PEER_BASELINE` set to that baseline, compares **all 62 complete objects**, including every executable function source and source/review flag. Only the exact mapped deps/ideas and the one 2.4 dependency removal are permitted. Every nonchapter helper/source-audit/shared/collection file is byte-identical. Complete syllabus comparison permits exactly new edges and the twelve recorded row repairs. All other fields, statements, captions, scopes, refs and functions remain unchanged. No full-object or review-flag snapshots are introduced into default tests.

Native review found the inherited 4.5 proof's displayed chain had **486px internal width in 288px content**. It now uses a gathered display with the identical mathematical chain split across four lines. This is the only changed original idea prefix; all other new explanations append to the exact original idea. The explicit guard normalizes only that exact old/new display. Final actual production display/proof bounds pass. An initial guard fixture used JavaScript replacement-string dollar interpretation; it was corrected to a literal callback replacement, without altering content.

`verification-popgen-prerequisites-math.mjs` passes **17 independent mathematical groups**, with no production formula imports: exact independent transmission counts, eigenmode recurrences, exhaustive weighted multinomial moments/bias correction, Jensen mixing identity, conditional binomial variance/expected diversity/single-sample absence, stationary zero-flux density derivative, weighted branch-time means, exact log-odds recurrence, constant-viability derivative, normalized Jensen/KL fitness bound including boundary support, integrable-log identity/finite expectations and Cauchy–Schwarz diversity bound with uniform equality. These are finite model witnesses alongside actual theorem-proof inspection. All **30 existing POPGEN default tests pass**, none failed/skipped/cancelled; no existing tests changed.

Fresh strict build: **6684 written / 6890 planned / 450 chapters / 85 collections, 0 errors, 0 warnings**. Scoped static: **62 items, 0 errors, 0 warnings**. Git whitespace check passes. Final build payload is recorded in the evidence log.

Fresh native checks cover **14 changed explanations × light/dark at 320px**, runtime/TeX/nonblank visualization mounts followed by separate actual built proof views. Actual proof width is **288 client / 288 scroll**, including internal displayed-math scroll checks after the 4.5 wrap. Complete ideas were captured. I personally inspected all 28 full proof output pixels in eight contact sheets and re-inspected the final extended 1.10 bound output in both themes. Changed text, full wrapped inequality and mathematical glyphs are legible without clipping. These checks certify changed prose and mounting, not a full new control/replay or empirical-source review.

Actual bridge search found no POPGEN references, so no existing bridge requires an edit or native card review. No FPS benchmark, global write, source closure, helper/runtime change or frozen BIGHIST work occurred. Browsers/server closed.

Evidence: `/tmp/atlas-new-arch-source/popgen-prereqs/{baseline,build.log,static.log,math-own.log,math-existing.log,native-final.log,native/}`; native files are `<num>-<theme>-idea.png` and contact sheets. The explicit audit supports `--guard-only` to skip browser work. Separate immutable peer must assess all additions, the removal, exact row repairs, hypotheses and output pixels before acceptance.
