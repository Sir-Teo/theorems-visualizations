# Finance 5.15 and coupled 5.6 — population forecasts, finite proxies and actual source data

Status: **RESOLVED after independent parent source, mathematical, data, native and screenshot checks.** Item5.15 and the source ledger are reconciled; previously unflagged5.6 is an additional consistency correction with no source-queue closure credit. No human approval gate applies.

Owned scope: only the 5.6 object/import in `content/fin/ch05-b.js`, 5.15 object/import in `content/fin/ch05-c.js`, their two syllabus rows, new `source-audit-shiller.js`, `verification-fin-shiller.{test.mjs,mjs}`, `verification-fin-shiller-source.mjs` and this report. Shared input data/helpers and all neighboring item bodies are preserved. No Git mutations, central ledger/plan changes, build, data regeneration or timing tests were run.

## Actual originals and construction notes read

The actual 16-page published original was acquired from the [McMaster university mirror](https://ms.mcmaster.ca/~grasselli/Shiller81.pdf): Robert J. Shiller, *Do Stock Prices Move Too Much to be Justified by Subsequent Changes in Dividends?*, AER 71(3), 1981, pp.421–436. Local `/tmp/atlas-fin-shiller1981.pdf`, SHA256 `02c0e6f4f747a7585fe44a885a39117dd6a695478e80b9be7325d8fe3fd08d88`. The scan has almost no embedded text. Rendered all pages and OCR read **the complete original**, including the introduction, §§I–VI, both Appendix data descriptions and references. OCR `/tmp/atlas-fin-shiller1981-ocr.txt` (62,329 characters); page images/text `/private/tmp/atlas-fin-shiller1981-ocr/page-{01..16}.{png,txt}`. Tesseract requires the canonical `/private/tmp` path on this machine; the first `/tmp` attempt failed before recognition, then all 16 canonical-path pages succeeded.

Actually inspected original images for printed pp.424,425,431,434 (`page-04.png`, `page-05.png`, `page-11.png`, `page-14.png`). They establish the beginning-period price/end-period dividend timing, dividend-known information assumption, different price/dividend trend exponents, infinite target versus recursive terminal approximation, Table 2 values and January-price/WPI data construction. Table 2 directly reports Data Set 1 rate .0480, price SD 50.12 and proxy SD 8.968; those are attributed printed statistics, not a claimed reproduction.

The author's [current online data and construction notes](https://shillerdata.com/) were actually opened/read. They describe monthly averages of daily closing prices, dividend-rate interpolation from quarterly totals since 1926 and annual Cowles observations earlier, and the CPI splice. The directly linked original workbook was downloaded:

- Author-linked URL: `https://img1.wsimg.com/blobby/go/e5e77e0b-59d1-44d9-ab25-4763ac982e53/downloads/1449043e-a1ed-4e2e-8e9c-7b9a2a064493/ie_data.xls?ver=1791297298731`.
- Local `/tmp/atlas-fin-shiller-ie-data.xls`, SHA256 `98a54927942e842ec07ffe73000998e793953708c345b6b27bb363e9ada8366a`.
- Read actual Data-sheet headers and all 1,824 monthly rows for 1871–2022 programmatically. Every calendar has all twelve distinct months. All 456 embedded annual P/dividend-rate/CPI scalars match twelve-month source means within their stored 2/3/2-decimal rounding. No shared input changes were needed.

The current original validates the embedded annual values; this does not independently certify the old header's September 2023 workbook timestamp. The authored panels identify the later annual-mean/CPI series and its annual timing approximation. They no longer call it a reproduction of original Figure 1 or use the original January/WPI statistics as if they were their own results. Original archival Cowles/WPI records, LeRoy–Porter and named later criticism papers were not separately acquired/read; precise unread attributions and broad later-literature claims were removed from these two items.

## Population result and empirical scope

If the infinite discounted cash-flow sum exists in L² and the price is its exact conditional expectation, orthogonality gives `Var(p*) = Var(p) + E[(p*−p)^2]` at each date. The proof uses the actual written conditional L² projection result prob-4.1.15, which was read. Present-value discounting uses actual fin-1.5. The theorem does not require every demeaned time-series sample, or every finite target estimated from an arbitrary terminal value, to inherit its inequality. Stationarity helps identify one population law across time; fitting a trend does not prove it.

Both items now separate this result from a later-data finite proxy. No universal “any plausible discount rate,” “the bound stays broken,” “terminal choices never matter,” “perfectly rational stock market,” fixed empirical dividend-autocorrelation claim or preordained historical tail conclusion remains. A ratio above 1 is reported as a selected sample comparison, not an automatic efficiency verdict or valid significance test.

## Timing, trend and finite continuation

For local observation indices t=0,…,n−1, fit g by OLS of log real price on time. Price uses division by `exp(g t)`; the end-period dividend rate uses `exp(g(t+1))`, matching the distinct exponents in the original Eq.3. Real levels use the unchanged annual CPI inputs and 2022 CPI base. Since the inputs are annual means of monthly price/dividend-rate/CPI observations, the alignment is explicitly illustrative rather than exact cash-flow accounting for the historical portfolio.

The finite proxy is exactly

```
q_(n−1) = K
q_t = (d_t + q_(t+1))/(1+r),  t < n−1.
```

Thus the separately summed cash flows are d_0,…,d_(n−2). The final observation's dividend and all later cash flows are represented by K. The helper does not silently drop a final payment while claiming to sum it. Terminal sensitivity is exactly `(1+r)^−(n−1−t) ΔK`, also verified by direct discounted sums at every offered rate. Both historical items offer sample-mean price and last observed price as continuation proxies, and report the first-date weight of the assumption in 5.6.

## Authored Gaussian benchmark, not an equilibrium stock market

The old numerical forecast formula was **valid under current-dividend-known, predividend timing**; it was not falsely reported as an algebraic defect. The repair makes this timing and its limits explicit:

```
d_t = μ + x_t
x_t = ρ x_(t−1) + η_t
Var(x_t) = s²,  η_t iid N(0,s²(1−ρ²)),  x_0 ~ N(0,s²)
p_t = μ/r + x_t/(1+r−ρ)
```

The simulation knows d_t at t. Conditional future means sum to the displayed price. Gaussian dividends and prices can be negative; this is a signed-cash-flow present-value process without a limited-liability stock-market equilibrium interpretation. The displayed mean/SD match transformed later dividends; persistence is chosen, not estimated or claimed to reproduce a named criticism. The 400 paths share standard-normal draws across settings until resampling, with independent paths within each setting.

Writing R=1+r and γ=1/R, the exact population variances are

```
Var(p)  = s²/(R−ρ)²
Var(p*) = s² γ² (1+γρ)/[(1−γ²)(1−γρ)]
σ(p)/σ(p*) = sqrt((R²−1)/(R²−ρ²)) ≤ 1.
```

For simulated last-price continuation, K=p_(n−1) from d_(n−1), the tower identity preserves `p_t=E_t q_t` at every t. A sample-mean K need not. Neither case guarantees sample variance ordering along every realized path. The independent tests include an explicit strictly reversed sample with d=[1,2,3], ρ=0, μ=2 and r=.05, using exact last-price continuation. The strict reversal persists in a neighborhood, which has positive probability under the nondegenerate Gaussian model.

Every one of 400 finite ratios enters the histogram. Its upper edge exceeds both the maximum simulated ratio and the later-data comparison. Samples are assigned using the actual drawn bin edges, avoiding floating-point boundary misclassification and the former folded overflow tail. Counts above 1 and above the later-data ratio, population ratio, finite range/mean and negative-value counts are displayed descriptively. There is no assertion that the historical ratio must lie far in the tail.

## Executed independent checks

1. `node --test tests/verification-fin-shiller.test.mjs`: **6 groups pass**, `/tmp/atlas-fin-shiller-math-final.log`, process session 7053 exited 0. First prototyped and passed outside the default glob. Independent checks cover normal-equation trend fits and all transformed points; all 164 sample/rate/terminal combinations by explicit discounted sums; exact terminal sensitivity and final-dividend exclusion; all 4,100 rate/persistence choices via conditional-PV recursion/finite conditional sums; separate Toeplitz covariance sums of 2,048 discounted cash flows; exhaustive innovation trees for tower/orthogonality; the strict sample-order counterexample; all 400 paths across 72 length/rate/persistence/terminal/seed combinations by independent direct sums, exact draw counts and negative-value accounting; large-tail histogram examples with every sample counted. Finite sign trees test moment/tower identities, not Gaussian distributional claims.
2. `PYTHONPATH=/tmp/atlas-fin-shiller-python ATLAS_SHILLER_PYTHON=/Users/teodev/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 node tests/verification-fin-shiller-source.mjs /tmp/atlas-fin-shiller-ie-data.xls`: **all source comparisons pass**, `/tmp/atlas-fin-shiller-source.log`. `xlrd` is installed only under `/tmp/atlas-fin-shiller-python`; no repo dependencies changed.
3. `node tests/verification-fin-shiller.mjs`: **8 groups pass**, both items at 1450/430 × light/dark, `/tmp/atlas-fin-shiller-native.log`, session 42343 exited 0 and browser closed. Each checks both windows, both actual terminal buttons, rate endpoints/default; 5.15 additionally checks persistence 0/.9/.99, independent full 400-path ratios, every bin/count and reseeding. Native Home/End and interior ArrowLeft inputs are verified. All historical path points, rate-curve points, selected dot/ring, complete histogram rectangles, measured text/halos, display TeX, page bounds, numerical readouts and runtime errors are checked.
4. `node scripts/check.mjs fin-5.6 fin-5.15 --static`: **2 items, 0 errors, 0 warnings**, `/tmp/atlas-fin-shiller-static.log`, session 95932 exited 0. Chapter/syllabus/native syntax and `git diff --check` pass. Exact item/syllabus num/kind/name/paper/introduces/deps/see/refs agree. Item 5.15 retains `verify:true`; 5.6 remains unflagged. Neighbor bodies 5.7–5.9 and 5.11–5.14 are byte-identical to HEAD; 5.10 is separately owned by parent integration. Shared data/helpers were not changed.

## Actual screenshot inspection

Inspected `/tmp/atlas-fin-shiller-5.6-default-430-light.png`: complete narrow formula/paragraph flow, time and rate curves, selected marker and clear sample-statistic readout. Inspected native-size `/tmp/atlas-fin-shiller-5.15-persistent-mean-430-light-panel1.png`: all tail bars remain in the plot and the comparison guide is visible. Inspected `/tmp/atlas-fin-shiller-5.15-exact-continuation-1450-light.png`: actual later-data/continuation curves, full histogram/legend, controls and exact population versus finite counts are legible. Also inspected `/tmp/atlas-fin-shiller-5.15-persistent-mean-430-dark.png` (complete narrow original/model distinction, all tail bins, descriptive finite counts and formulas) and native-size `/tmp/atlas-fin-shiller-5.6-native-interior-430-dark-panel1.png` (rate curve with selected near-endpoint dot/ring entirely contained). Full default, persistent-mean, exact-continuation, resampled and native-interior captures are retained under `/tmp/atlas-fin-shiller-*`, with separate mobile panel crops.

## Independent parent acceptance

Root independently read the actual original introduction and complete §I (pp421–426), complete §§V–VI (pp432–434), Appendix A and B (pp434–435), and the Table2 original statistics. Root inspected readable original424/425/431/434 images, confirming beginning-period price, known end-period dividend, unequal trend exponents, recursive terminal approximation, the .0480/50.12/8.968 printed values and January/WPI construction. Root's independent reading is this stated subset; the authoring agent read the entire original. Root also opened the current author construction notes, inspected actual XLS headers and representative raw/annual means, and reran the full1,824-row/456-scalar comparison. The unchanged source workbook hash agrees with the retained acquisition.

Root read actual fin-1.5 and prob-4.1.15, the complete helper and mathematical/native/source tests. Root independently derived the conditional price, stationary discounted-covariance variance and ratio `sqrt((R²−1)/(R²−rho²))`, and checked the finite tower/terminal indexing. The current-dividend-known forecast formula was valid in the previous code; the accepted correction concerns explicit timing, scope, continuation and unjustified finite-sample conclusions.

Root reran six mathematical groups (`/tmp/atlas-root-fin-shiller-math.log`), the original source comparison (`/tmp/atlas-root-fin-shiller-source.log`), all eight1450/430×light/dark native groups (`/tmp/atlas-root-fin-shiller-native.log`; process89151 exited0 and browser closed), and scoped static2items0/0 (`/tmp/atlas-root-fin-shiller-static.log`). Root inspected the final5.6 full narrow light page,5.15 persistent-mean full narrow dark page, desktop exact-continuation page, native-size histogram tail and selected near-endpoint rate crops. All400 finite ratios remain counted, full tails/guides and selected rings are visible, and no significance/stock-equilibrium claim is inferred. Neighbor bodies and shared data are unchanged at integration.
