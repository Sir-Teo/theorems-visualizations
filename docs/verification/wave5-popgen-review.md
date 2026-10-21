# Independent review — POPGEN chapter 5

Status: **accepted**, with the explicitly retained original Haldane-body source flag on 5.4. Source/model bytes remain frozen. Covers only the eight new items 5.1–5.8. Original Haldane-body uncertainty on 5.4 remains flagged.

## Sources, hypotheses and proofs

Read all eight statements, proof ideas, scopes, visualizations and pure helper implementations. Independently reran all 12 chapter math groups; all pass. Actual Felsenstein source text `/tmp/atlas-popgen-felsenstein.txt` was read at III.6, Eqs. III-19–26 (recessive and partial-dominance mutation balance), IV.7, Eqs. IV-24–30 (the exact haploid and dominant-diploid migration life cycles), and II problem 19 (symmetric drive is a simplifying assumption; sex limitation matters). The authored quadratic root and convergence arguments were checked directly from genotype bookkeeping rather than importing a rare-allele approximation as an exact theorem.

Independently opened the actual Kimura–Crow 1969 publisher PDF and read §3, printed 133–134, including the relative/census cost distinction and model-dependent fertility interpretation. Its continuous approximation is not misrepresented as the new discrete telescoping identity. A fresh Nunney request timed out; no follow-up access attempts were made. The author's successful earlier source reading is distinguished from the reviewer's fresh access. The original Haldane 1957 body remains unread, explicitly flagged, and is not claimed as a source of a reproduced calculation.

The official Berger–Cerf 2024 PDF opened successfully for the finite positive-mutation model and normalized selection/mutation equations in §1.1. A later request for its long-chain theorem passage timed out. The author supplied `/tmp/wave5-popgen-quasi-read.txt`, explicitly a retrospective paraphrase of an earlier successful Theorem 1.9 reading, not an archived original response or a fresh successful retrieval. No repeated source-access loop was used. The asymptotic claim is independently checked mathematically below. No equality-case claim is imported.

The life cycles are complete and internally consistent: newborn diploid allele frequencies, viability selection, gametic unidirectional mutation or migration, and subsequent random mating are distinguished. Dominance and equilibrium hypotheses delimit the load limits. Female-only drive uses actual separate gamete pools. The quasispecies widget distinguishes finite time, finite reversible mutation and the no-return scalar approximation. Its threshold is an asymptotic frequency transition, not finite-genome extinction or an empirical viral prediction.

For the binary sharp-peak model, an independent renewal argument verifies the long-chain statement. Write the finite equilibrium mean fitness as λ = 1 + (σ−1)x₀. Its master component gives

`1/(σ−1) = Σ[n≥1] (Mⁿ)₀₀ / λⁿ`,

where independent symmetric site flips give `(Mⁿ)₀₀ = [(1+(1−2u)ⁿ)/2]^ℓ`. Along ℓu→a with ℓ→∞ and u→0, each fixed-n return probability tends to exp(−an). Any subsequential λ-limit above 1 permits dominated convergence in the series and therefore equals σ exp(−a). The lower bound λ≥σ(1−u)^ℓ forces this above-1 limit when a<log σ; if a>log σ there can be no above-1 subsequential limit, hence λ→1. The exact mean-fitness identity then gives the stated master-frequency limits. This independently supports the claim without pretending to have freshly read the inaccessible theorem pages.

## Independent calculations

Scripts `/tmp/wave5-popgen-review-data.mjs` and `/tmp/wave5-popgen-review-oracle.py`; results `/tmp/wave5-popgen-review-oracle.log`: **6,099 independent scalar comparisons pass**.

- Reconstruct surviving genotype contributions and gametic mutation with 80-digit arithmetic; solve the monotone equilibrium polynomial by bisection, avoiding the chapter's quadratic-root formula. Includes recessive, partial dominance, threshold/loss and subnormal dominance cases. Root discrepancy at most 5.56e−17.
- Solve substitution frequency by exact odds multiplication and compare accumulated logarithmic deficits and the rigorous death-fraction interval. Maximum accumulated-log discrepancy 1.07e−14.
- Independently reconstruct haploid/diploid selection followed by migration and compare both equilibrium forms, including absorbing boundaries.
- Evolve the **full binary sequence population** for lengths 4 and 6 using every pairwise Hamming-distance transition, not the chapter's class convolution. Compare class aggregates at 0, 1, 17, 150 and 500 generations, across mutation rates and fitness advantages, with the separately specified no-return approximation. Maximum discrepancy 1.53e−14.
- Use exact rational egg/sperm unions, survival and sex-specific transmission to verify genotype inventories and both gamete pools, including heterozygote costs and unequal pools. Maximum binary64 discrepancy 2.23e−16.
- Verify the affine migration solution with high-precision arithmetic at zero, complete and subnormal immigration, including generation zero.

The author independently corrected finite-sample initial quantization before freeze: all sample times, including generation zero, use attainable counts K/(2N), and the plotted expectation starts from that same rounded count. At reviewer's request the scope explicitly calls the deterministic seeded illustration pseudorandom. No substantive mathematical defect remains identified.

## Final native and visual checks

Independently ran the final chapter-local production utility in `/tmp/wave5-popgen-review-browser.mjs`, with separate `/tmp/wave5-popgen-review-production` artifacts. **All 32 actual 1200/320 light/dark groups pass: 500 physical control actions and 176 actual URL replay/rejection checks.** Final log `/tmp/wave5-popgen-review-browser.log`; exit 0, browser closed.

The run checks all modes, newly revealed inputs, Home/End and intermediate physical edits, browser-canonical native/model values, computed plotted marker locations and load-bar contributions, complete formula/text/readout bounds, full ink/stroke/ring boundaries, exact edited Create-link snapshot/readout replay, off-grid values and malformed/out-of-range rejection. Positive-subnormal, 1e−200 and 1e−20 dominance and migration states pass actual Create-link replay. Minimum full marker/ring clearance is 1.956648 CSSpx and minimum glyph/halo clearance is 3.115623 CSSpx. The final quantized finite-sample code and pseudorandom scope are included in this independent run.

Personally inspected all 16 narrow defaults in both themes via full-size contact sheets `/tmp/popgen-default-{light,dark}-{0,1}.png`, and the final finite-sample and female-only-drive mode captures. The sample visibly fluctuates around its deterministic expectation; egg and sperm curves separate in female-only mode. Inspected actual 320px rich pages for 5.1, 5.3, 5.5 and 5.8, including long hypotheses, limits, scope and split formulas (`/tmp/wave5-popgen-review-rich-{1,3,5,8}.png`). Curves, references, genotype inventories, text and controls remain legible. All 12 final math groups pass independently; `/tmp/wave5-popgen-review-math.log`.

The chapter meets the authoring criteria: distinct useful interactions, faithful calculations, complete model hypotheses and units, meaningful proof ideas, exact-versus-limiting scope, honest source access and independent responsive/theme evidence. No unresolved required fix remains. Only this reviewer report and bounded `/tmp` oracle/runner artifacts were written; authored product/tests remain frozen.
