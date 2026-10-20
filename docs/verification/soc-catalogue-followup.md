# Sociology 4.15: finite catalogue sums and the original book-sales estimate

Candidate; verification flag remains true for independent coordinator acceptance. This batch changes only 4.15, its syllabus row and corresponding source-header note, an isolated finite model, unique checks and report.

## Actual original source

Read Brynjolfsson, Hu and Smith, *Consumer Surplus in the Digital Economy: Estimating the Value of Increased Product Variety at Online Booksellers*, Management Science49(11):1580–1596 (2003), complete original publisher-layout PDF hosted by NYU: https://oz.stern.nyu.edu/cite05/readings/brynjolfsson4.pdf. Read the abstract/context, complete §4.2 on pp.1587–1589 including Tables2–4, regression/Eq.12, integral estimate/Eq.13, and the relevant §4.3 pp.1589–1590 explaining the separate economic calculation. PDF and page-marked extraction `/tmp/atlas-worker-three/longtail2003.{pdf,txt}`. Actual p.1588 equation/table image `/tmp/atlas-worker-three/longtail-original-table4.png` was inspected.

The source uses one publisher's 321 titles observed in three summer2001 weeks (861 observations), fits slope−0.871, and takes N=2.3million available books. Table4's 39.2% is the fitted share above rank100,000, with reported standard error2.5percentage points. It is not a direct 2000 census of Amazon transactions. The study's later application estimates year2000 welfare using additional market, price and elasticity assumptions. The new item states only the Table4 context and does not reproduce a welfare calculation. Raw publisher data, original regression and economic assumptions are not claimed independently replicated.

Unsupported Anderson/Elberse history and streaming percentages and a universal empirical exponent range have been removed. The actual 2003 original replaces the old secondhand2010 attribution.

## Model repairs

The finite authored model now sums every integer title weight directly. No Euler–Maclaurin approximation, fractional catalogue rank or silent substitution N=max(requestedN,2S) remains. Offered N=100/1000/10000 and shelf percentages0/1/10/50/100 give exact integer shelf counts, including empty/full endpoints. Both positive-rank plots display every offered weight and cumulative rank with complete glyph/stroke containment. Empty shelves have no fictitious positive-rank guide and are reported as zero served. The source's integral estimate at N=2.3million and the finite discrete illustration are explicitly distinct.

Fixed-N/S exponent monotonicity and fixed-S catalogue extension follow from the authored positive weights; these mathematical comparisons do not assert that real online demand retains a fixed shape. Series convergence at alpha>1 is an unnormalized infinite-catalogue fact. No finite demand share is labeled consumer surplus or a market forecast.

## Verification

`node --test tests/verification-soc-catalogue.test.mjs`: 3 groups pass, `/tmp/atlas-worker-three/catalogue-math.log`. Independent compensated sums using exponential/log weights check all offered catalogue/shelf pairs and critical exponents. Exact BigInt rational harmonic sums at alpha1 check normalization and rank masses. Empty/full shelves, head+tail complement, rank transfer and exponent/catalogue monotonicity, and malformed-domain rejection are checked.

Final native/static evidence follows after completion. No empirical refit or human-review claim is made.

`node scripts/check.mjs soc-4.15 --static`: 1 item, zero errors/warnings, `/tmp/atlas-worker-three/catalogue-static.log`.

`node tests/verification-soc-catalogue.mjs`: 6 matrices pass at1450/430/320px light/dark. Every size/shelf combination and exponent endpoints/1, both representable sides of1 and a fractional value, every rank/glyph/cumulative path, complete stroke/text/TeX/page bounds, actual native range/output/ARIA, Home/End, replay and malformed choices are checked. Log `/tmp/atlas-worker-three/catalogue-native.log`; screenshots `catalogue-{default,empty,full}-WIDTH-THEME{,-panelN}.png`. Actual desktop/mobile light/dark plots and empty/full shelf endpoints were inspected. All geometry assertions remain enforced.
