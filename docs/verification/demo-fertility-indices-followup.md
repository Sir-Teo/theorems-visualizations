# Demography4.8/4.9: marital model and Princeton indices

Status: **resolved: demo-4.8 and demo-4.9**. Independent parent source, mathematical, source-array, native-browser and final-image checks pass; flags and queue are reconciled in the integration commit. No shared input/helper/renderer, generated data, ledger, plan or Git mutation was made. The reproduction4.3 work is untouched.

## Source evidence actually read

1. **United Nations, Manual X: Indirect Techniques for Demographic Estimation (1983)**, original official PDF:
   https://www.un.org/development/desa/pd/sites/www.un.org.development.desa.pd/files/files/documents/2020/Jan/un_1983_manual_x_-_indirect_techniques_for_demographic_estimation.pdf
   - Retained `/tmp/atlas-demo-manualx.pdf`, SHA256 `e6b5733e341a6aeae09f35d5b5e5fa7e8a837823a119ace6aed8c85488c602e4`,332PDF pages.
   - Read complete chapterI.E.1, printed23–25(PDF50–52), including Henry's parity-dependent definition, the fixed-pattern assumption, equationsE.1–E.7, Table3, both estimation methods, negative/zero/positive m interpretation, and the separate nuptiality factor needed for overall rates. Read the beginning of the neighboring nuptiality conclusion only as it appears on p23; no fullManual reading claim.
   - Actual printed24 formula/table image inspected: `/tmp/atlas-demo-manualx-page-51.png`. Printed25 image retained as `...page-52.png`. Extract `/tmp/atlas-demo-manualx-used.txt` includes these pages and one additional neighboring page.
   - Table3 gives20–49 n = .460,.431,.395,.322,.167,.024; v =0,−.279,−.667,−1.042,−1.414,−1.671. The existing v values were correct. The prior Hutterite n values were a different standard. EquationE.6's accompanying text recommends least-squares using20–44, excluding45–49.
   - The1974/1978 original papers at JSTOR DOI10.2307/2733910 and10.2307/2735537 returned challenge HTML, not papers. No original-paper reading or original-specific estimation/priority claim is made. Public refs/credit/scope explicitly identify ManualX as the actual technical evidence. The generic method and constants are fully supported by that official exposition; original-paper access remains an explicit documentary limitation.

2. **AnsleyJ.Coale, “Factors associated with the development of low fertility: an historic summary,” Proceedings of the World Population Conference, Belgrade1965, volII (UN1967), printed205–209.** Original acquired from the official UN document-symbol endpoint:
   https://documents.un.org/api/symbol/access?s=E/CONF.41/3&l=en&t=pdf
   - `/tmp/atlas-demo-coale1965-docs.pdf`,525PDF pages, SHA256 `e04ddac1ccdd998e30b60a9e1ad1c4538359fd9989fd345d331f9a4338acf461`.
   - Read the complete five-page authored chapter, PDF219–223, not merely an abstract or secondary quotation. Used definitions§II, paragraphs6–9, exact identity equation1, and Tables1–2. No numerical historical-province claims retained from Table3 or the historical discussion.
   - Actual original p205 and p209 images inspected: `/tmp/atlas-demo-coale1965-page-219.png`, `...page-223.png`. Complete used chapter extract `/tmp/atlas-demo-coale1965-used.txt` also includes neighboringGlickp210; that neighbor is not part of the review claim.
   - Table1 confirms seven reference rates .300,.550,.502,.447,.406,.222,.061. Paragraph6 explicitly says .300 below20 was substituted for the much higher observed teenage Hutterite rate. The reference is therefore adjusted, rather than seven unmodified observed rates or a universal biological bound. Table2 and equation1 confirm all four indices and the exact decomposition.
   - The original Princeton archive URL redirected/403'd during direct acquisition. No newly acquired province dataset or originalproject data-reading claim is made. The authored item plots WPP, not European provinces, so its former syllabus map claim was removed.

3. **UN World Population Prospects2024**, original official fertility-by-age5 CSV, discovered from the official WPP download catalog in the preceding4.3 audit:
   https://population.un.org/wpp/assets/Excel%20Files/1_Indicator%20%28Standard%29/CSV_FILES/WPP2024_Fertility_by_Age5.csv.gz
   - `/tmp/atlas-demo-WPP2024_Fertility_by_Age5.csv.gz`, SHA256 `c0d3b5b7e992902df3be1980cfa86c440c1cd673ecec9d4826142a03aece04ec`.
   - Source validator independently streams the full original and checks every offered10countries×74years×7groups =5180 matched15–49 rows, annual age-group spans and ASFR/birth units. This is10360source scalars: rounded ASFR plus recovered exposure.
   - The officialWPP2024 methodology ASFR definition and source-period/sex-unit sections were already read during4.3; the retained original is `/tmp/atlas-demo-wpp-methodology.pdf`, SHA256 `0c98d8131e61227596fabf21328024a3c6ba05c27dcbbdbf507e5f7edd8a35c9`. Births count live births of both sexes by maternal age; no daughter/sex-ratio factor belongs in either item.
   - Existing ASFR is rounded to0.1births/1000woman-years. Existing exposure equals sourceBirths(thousands)×1000/sourceASFR, rounded to1000woman-years. Across all5180rows, maximum ASFR discrepancy is.05000000000001137per1000 and exposure discrepancy is.5thousand. Reconstructed births can differ from original births by3.1676thousand in one group. Item scope therefore says the count and index are approximate, not exact published WPP indices. Shared arrays were left unchanged.

## Corrected scope and model

###4.8

Replaced the country regression on overall rates and reconstructed standard with explicitly authored positive **marital** rates using the verified six-age standard. The fixed age-pattern assumption is visible through an authored nonlinear departure:

`r_i = M n_i exp(m v_i + δ(v_i/1.414)^2)`.

Controls are M=.10…1.20(step.01), m=0…4(step.02), δ=−.8….8(step.02). Fit the five20–44 log ratios by unweighted least squares and leave45–49 as a hollow, omitted prediction point. Fitted parameters are actual unclamped estimates, including negative m. Withδ=0, fit recovers the generating M,m exactly. Withδ≠0, model misspecification can alter fitted m; no country's stopping/contraception is inferred.

The three20–49 totals multiply annual rates by5 and are labeled hypothetical totals under continuous marital exposure. They are not called all-womenTFR or actual completed fertility. The natural baseline uses fittedM, and the readout identifies that choice. Its difference from another model schedule is not called births proved prevented. Both y-domains include every rate, fit, baseline, logarithm and complete prediction line, with stroke/marker margins.

###4.9

All births, recovered exposure and the adjusted reference now use the same15–49 groups in the same calendar year. The prior code used births10–54 against a15–49 reference. WPP fertility is all-women fertility; married/unmarried exposures and birth allocations are expressly authored. Existing shared `married()` and `HUT` are untouched because4.7 uses them.

The isolated logistic gives proportions currently married, with A its midpoint and E its ceiling; neither is called mean age at marriage or shareevermarried. Controls A15…32(step.5), E.4…1(step.01) give strictly interior shares, so both positive denominators are valid throughout. A hypothetical nonmarital birth share h0….6(step.01) allocates B_u=hB and B_m=(1−h)B. This allocation is not a WPP marital-status observation or causal model.

The full identity is displayed with both contributions. Four dynamic bars showIf,Ig,Ih,Im; an index above1 stays visible and is described as above the reference under the assumptions. Removed the claim that Ig>1 proves biological impossibility or an incorrect marriage curve. Indirect standardization's remaining age-composition dependence is stated and independently demonstrated. These explicit source, sample and model hypotheses replace the old Hutterite “from memory” scope.

## Independent mathematical evidence

Command:

`node --test tests/verification-demo-fertility-indices.test.mjs`

Final `/tmp/atlas-demo-fertility-math-final.log`: **5groups pass**, actual command exit0. Draft was first run under`/tmp` before installation in the default glob.

- Verify both original/official table transcriptions and their distinct age standards.
-100generating parameter combinations, including every endpoint and interiors: independent pairwise-difference regression slope and separately averaged intercept, positive rates, both normal equations, exactδ0identification, independently computed model totals, and strict objective increase under parameter perturbations. Confirm an actually negative fitted m remains valid.
- Alter only45–49 by100× and prove fitted M,m do not change; check rate-level rescaling, positive-rate hypotheses and rejection of invalid input.
- All740WPPcountry-years×8marriage/allocation corners: direct expected-birth accumulations independently reproduce all four indices/denominators, matched partialTFR, both contributions, full identity, no-nonmarital reduction, positive denominators, exposure-scale invariance, and cases withIg>1.
- Construct a fixed-rate/different-exposure counterexample to complete age-composition removal; check a pure-standard population, birth-share0/1, zero births and invalid denominators.

Source command:

`node tests/verification-demo-fertility-indices-source.mjs /tmp/atlas-demo-WPP2024_Fertility_by_Age5.csv.gz`

`/tmp/atlas-demo-fertility-source.log`: **all5180rows/10360scalars pass**, actual session82640exit0. Reports original SHA and maximum discrepancies above. No shared data correction needed.

## Native browser, numerical and visual evidence

Command:

`node tests/verification-demo-fertility-indices.mjs`

Final `/tmp/atlas-demo-fertility-native-final.log`: **8groups pass**, actual final session43392exit0, browser closed in`finally`. This first complete run passed on the final production/helper/native source; the final log is a copy of its retained`...native-first.log`, not a separate unexecuted claim.

At1450px and430px, both themes:

-4.8: all27three-level parameter combinations, including exact-model, positive/negative departures, negative fits, high/lowtails; nativeHome/End/ArrowLeft on each of3sliders (actual endpoints .1/1.2;0/4;−.8/.8, and adjacent1.19/3.98/.78). Independently recompute all6rates,5-point pairwiseOLS,6fit/baselinepoints and6logpoints, omitted-point hollowglyph, every numeric readout, six complete bars and both curves plus regression line.
-4.9: all10countries×2endpointyears×8A/E/h corners =160states per theme/viewport. NativeHome/End/ArrowLeft on each of4sliders verifies1950/2023/2022,15/32/31.5,.4/1/.99,0/.6/.59. Independently recompute matched source rates/exposures/logistic shares and expected-birth ratios, all7bars/28stepvertices/4indexbars and readouts/fullidentity. An actually observedIg>1 case is asserted and screenshotted.
- Complete paths with half-stroke widths, rectangle strokes, filled marker ring and hollow marker stroke radii are inside plot bounds. Every measured canvas-text glyph and clippedtext halo, displayTeX and page width is contained; no page errors, invalid numbers, blank charts or TeX errors.

Screenshots inspected as actual pixels:

-`/tmp/atlas-demo-fertility-4.8-negative-fit-430-light.png` full mobile, showing the negative fitted m and all controls/readouts.
-`/tmp/atlas-demo-fertility-4.9-high-index-430-light.png` full mobile, Ig≈4.108 completely visible.
-`/tmp/atlas-demo-fertility-4.8-low-tail-430-dark-panel0.png` and`...panel1.png` native-size panels, including tiny positive tails and hollow excluded point.
-`/tmp/atlas-demo-fertility-4.9-nonmarital-430-dark-panel1.png`, Ih≈4.067 and all labels contained.
-`/tmp/atlas-demo-fertility-4.9-high-index-1450-dark.png` full desktop, allbars/controls/formulas readable.

Static:

`node scripts/check.mjs demo-4.8 demo-4.9 --static`

`/tmp/atlas-demo-fertility-static-final.log`:2items,0errors,0warnings, actual session34486exit0.

Read-only byte comparisons confirmed4.7/4.10/4.11/4.12 objects unchanged againstHEAD; syllabus outside4.8/4.9 unchanged. No build or timing test was run.

## Frozen integration scope

-`content/demo/ch04-b.js`: only4.8/4.9 objects and isolatedhelper import.
-`content/demo/syllabus.js`: only matching4.8/4.9 rows.
-`content/demo/source-audit-fertility-indices.js`.
-`tests/verification-demo-fertility-indices.test.mjs`.
-`tests/verification-demo-fertility-indices.mjs`.
-`tests/verification-demo-fertility-indices-source.mjs`.
-This report.

Flags remain true for parent integration. The accessible official ManualX evidence supports the actual4.8 generic method/table/assumptions; it does not constitute reading either1974/1978original. The original4.9chapter was acquired, read and its formula/table images inspected.


## Independent parent acceptance

Root read the actual ManualX printed23–25 fertility-model text and visually read the original p24 table/equations/recommended20–44 fit. Root read actual Coale printed205–206 definitions and decomposition, and viewed original205 and209 (both exact tables); the agent additionally read the complete205–209 chapter. Root does not claim that additional historical discussion reading. The actual WPP ASFR definitions/units were already read in the preceding reproduction audit. The1974/1978 original-paper limitation remains explicit; no retained original-specific claim depends on an unread paper.

Root read the complete authored helper, mathematical, source-array and native check implementations, both complete objects and actual written demo4.1 prerequisite. Independent derivation confirms the log-OLS normal equations, unchanged fit under altering only excluded45–49, and exact decomposition from H=Hm+Hu. Rates have annual woman-year units, totals multiply by five, and all indices use one matched15–49 period. Authored current-marriage shares and birth allocation are separate from observed WPP quantities.

Root reruns pass **5 mathematical groups**, the entire **5180row/10360scalar** original-source comparison, scoped static **2items,0errors,0warnings**, and **8 native item/viewport/theme groups**. Logs `/tmp/atlas-root-demo-fertility-{math,source,static,native}.log`; source35184,static73366,native37791 all exited0/closed. Root inspected final full430px negative-fit and high-index light pages, dark low-tail and nonmarital panels; all offered excess-reference values and excluded-point styling remain visible. Complete geometric, glyph, text and TeX bounds pass.

Guards confirm all neighboring chapter objects/shared code, syllabus outside4.8/4.9 and committed4.3 unchanged. An initial header guard failed only because it omitted the inserted blank import separator; the corrected exact-new-import-plus-separator guard passes without unrelated mutation. Queue credit is exactly two original flags, closing the demography source queue.
