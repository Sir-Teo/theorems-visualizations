# Finance 5.1 and 5.14 — conditional benchmarks and Fama's review

Resolved after independent review: **fin-5.1 and fin-5.14**. Six mathematical groups, all23,477source-value/calendar comparisons, eight final native theme/viewport groups and static checks pass. Original source and final screenshots were inspected. Source flags and ledger are reconciled during this integration; no human approval is required.

## Primary evidence actually read

The actual [Fama (1970) original review](https://people.hec.edu/rosu/wp-content/uploads/sites/43/2023/09/Fama-Efficient-capital-markets-1970.pdf), *Journal of Finance*25(2),383–417, was acquired from HEC's university mirror. Local `/tmp/atlas-fin-fama1970.pdf`,35 scanned pages, SHA256 `7f050b046761e6bc71f00dded22512675c1dbf0d3733c5db8849b01def8a9687`. The front identifies Eugene F. Fama as author; Burton G. Malkiel chairs the session, not a coauthor of this article.

All pages were rendered/OCRed for navigation, but this audit claims reading only the **complete introduction and theory §§I–II,383–388**, and the **complete summary/conclusions §IV,413–416**, plus the paragraph leading into §IV. Formula images384/385 were inspected. Evidence is `/private/tmp/atlas-fin-fama1970-ocr/page-{01..35}.{png,txt}` and `/tmp/atlas-fin-fama1970-ocr.txt`. The PDF has essentially no usable text layer. Rendering used the bundled Python/pdfplumber; OCR used local Tesseract against resolved `/private/tmp` files. OCR alone was not relied on for formulas. No full reading of all empirical literature sections, Samuelson's original, or the split-study original is claimed.

The source states that empirical content requires a specified expected-return theory and risk definition(p384), then derives the fair-game/trading-system implication(p385). It distinguishes submartingale/random-walk assumptions(pp386–387), and discusses sufficient conditions without claiming they are necessary(pp387–388). The historical summary supports weak/semi-strong efficiency in the reviewed studies while identifying specialists and corporate insiders as strong-form exceptions(pp413–416). These are the source's1970 assessments, not current-market findings.

The actual written prerequisite **prob-4.1.14, Taking out what is known**, was read in `content/prob/ch04-a1.js`. Its integrability/measurability hypotheses are met by an integrable abnormal return and bounded measurable position. Both items explicitly use that implication. The syllabus dependencies are synchronized. Fama5.14's irrelevant Bachelier-paper prerequisite is removed; nearby empirical topics are related readings.

## Main correction: a mathematical identity is not a test

The former5.1 defined the residual as `r−E[r|Phi]` and called its zero conditional mean equivalent to efficiency. That mean is zero for every integrable return. The former5.14 used an undefined conditional “price model,” while its simulation simply reduced raw predictability to zero and called that efficient.

Both now specify a separate integrable measurable equilibrium benchmark **b**, supplied by an economic risk model, and state the joint restriction `E[r−b|Phi]=0`. A bounded measurable rule h then has zero expected abnormal gain before costs by taking out what is known. Nonnegative costs cannot turn it into positive expected abnormal gain. This does not claim that all raw returns are unpredictable or independent. Nested information-set implications are conditional on the same benchmark and admissible rules.

The replacement finite model has independent equiprobable signs x and epsilon, `r=.5+beta*x+1.5*epsilon` in percentage points and `b=.5+gamma*x`. Four-state direct enumeration proves:

- conditional abnormal mean `(beta−gamma)*x`;
- expected raw gain of h=x equals beta;
- benchmark compensation gamma and abnormal gain beta−gamma;
- beta=gamma>0 gives predictable raw returns and zero conditional abnormal means under that chosen benchmark.

The model does not establish that gamma is the economically correct risk adjustment. Subtracting the true conditional mean would still be a tautology. All1,681offered beta/gamma pairs are independently enumerated in tests.

## Actual daily data, observation dates and charge scope

Fresh official Kenneth R. French CSV archives were independently compared with the embedded values. Both headers identify CRSP vintage202608:

- [Daily factors archive](https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/ftp/F-F_Research_Data_Factors_daily_CSV.zip):15,897daily total market returns,1963-07-01–2026-08-31, computed as Mkt−RF plus RF at the embedded precision. ZIP SHA256 `2f29e22546069914890a712680a6f81f3680ebc3543b52864484d209ca13a7db`; extracted CSV normalized UTF8 SHA256 `c2dc30c9e89eeea05a689c81fb426f4d76711270733b3731997615cbdff5b247`.
- [Ten-industry archive](https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/ftp/10_Industry_Portfolios_CSV.zip):7,580values,758months×10portfolios,July1963–August2026, first value-weighted monthly section. ZIP SHA256 `ebd937a4b995d821867aeb956a96f09a666386f38fa82516b7d1767ee4a49ae5`; normalized CSV SHA256 `18ed376fc42e2327ceaf3d65a02521a6512e7f9e3001007c4da69d7db108aa82`.

All23,477values match; no embedded return values changed. The original linear-year approximation is replaced **in5.1 only** with the actual source calendar, stored compactly as day gaps. Every date, all64year starts and leap-year coordinates are checked. Canonical SHA256 of comma-joined YYYYMMDD dates is `a963335f0b6ce1fbcd9eb4b6793f78a253924205da71bdf5eeb199804edac42b`. September10→17,2001 and the October19,1987 crash are independently checked. Other chapter items retain their separately scoped existing implementations.

Reproduction, using extracted original CSVs, requires no network:

```
node scripts/verify-fin-efficiency-data.mjs DAILY.csv INDUSTRY.csv
```

The rule starts flat, takes sign of yesterday's return(zero means long), and charges one signal unit to open, two on reversal, and one to close. The first observation supplies a lag, so the full sample has15,896rule days. Exact input-date mapping and every wealth point are checked; curves include the initial wealth of one on the previous actual date. The previous implementation omitted opening/closing and unnecessarily skipped an additional first return.

**This remains an approximate signal-change charge illustration.** The daily target leverage is reset; turnover needed to rebalance a continuing short exposure is uncharged. The control, caption, readout, legend and scope now say so. This was identified by the independent reviewer, accepted and corrected rather than presenting the charge as all-in executable transaction cost. Cash interest, borrowing fees, stale index prices and risk adjustment are also omitted. Gross buy-and-hold is labelled gross. Annualized arithmetic means are daily averages×252, not compound growth rates. Naive IID t-statistics and sample-based efficiency verdicts are removed.

The chapter and syllabus summaries are corrected too: predictable raw returns can compensate for risk, and evidence must be assessed relative to a benchmark. They no longer contradict the corrected item.

## Authored illustrations and statistical limits

The news panel is a normalized deterministic response with chosen leakage and exponential adjustment. Semi-strong entry is constrained to announcement time or later; earlier entry in the strong case assumes knowledge of the eventual news. Both remaining asymptotic level change and actual change through+30min are reported. Neither is called a holding-period return or a risk-adjusted profit. Eventual adjustment may extend beyond the plot.

The industry panel independently checks all120industry/lag autocorrelations. Its ±1.96/sqrt(n) band is labelled an asymptotic **pointwise white-noise reference**, not a simultaneous95% statement about ten industries or120comparisons. Serial dependence, changing variance and required returns require additional modeling; the plot declares no efficiency verdict.

The split panel now uses an exact authored weighted construction. With weight p, post-event increase-group movement is `(1−p)*a(t)` and decrease-group movement is `−p*a(t)`, so their weighted mean stays flat for all p, including0/1. Zero-weight curves are counterfactual. This fixes the old denominator cap, which made the aggregate drift at high weights, and avoids attributing invented magnitudes or synthetic noise to the original paper.

The fund experiment assigns400funds,10independent Gaussian years, known annual noise4%, and chosen net alphas−.8%/+3%. Therefore its statistics are **z scores**, not estimated t statistics. Dynamic histogram limits count all400samples, including forced extreme scores in tests. The positive z>1.96 region is the positive half of a two-sided5% rule:2.5% under zero net alpha. The fee shifts the unskilled null. A finite assigned skill mixture and random winners cannot settle all-information efficiency.

## Validation and independent review

- `node --test tests/verification-fin-efficiency.test.mjs`:6groups pass: full source calendar; all41cost settings across all3actual samples and independently compounded full daily wealth; all1,681benchmark pairs; all21split weights at every date; all31skill weights with forced extreme scores; news values and all120industry/lag correlations.
- `node scripts/verify-fin-efficiency-data.mjs /tmp/atlas-root-fin-daily.csv /tmp/atlas-root-fin-industry.csv`:all23,477source values,15,897dates and64year starts pass.
- `node scripts/check.mjs fin-5.1 fin-5.14 fin-5.13 --static`:3items,0errors,0warnings.
- `node tests/verification-fin-efficiency.mjs`:8groups pass at1450/430×light/dark. Actual inputs cover all6sample/charge boundaries, all16news corners with public-entry clamping, all120industry/lag values, all21event weights, bothfund-share endpoints and actual reseed, all4benchmark corners plus positive equal slopes and native keyboard endpoints. Native checks independently reconstruct every daily wealth point, signal charge, plotted bar, weighted response and all400fund samples. Complete paths/rectangles/glyphs/rings, measured text/halos, strict TeX, display/page overflow and runtime errors pass. Two initial harness-only assertion corrections accommodate the intended semi-entry clamp and Unicode minus formatting; neither loosened production mathematical checks.

A separate agent read the actual Fama sections/formula images, reran math/data validation and reviewed the benchmark proof, nested sets, finite state model, exact event weighting and known-noise fund experiment. It found the signal-change-cost limitation and inconsistent inherited summary above; both were corrected. The independent reviewer accepted both wording fixes and found no remaining scoped defects. Its logs are `/tmp/atlas-review-fin-efficiency-{math,data}.log`; a separate finite-partition check verified nine bounded predictable rules at three matched benchmark slopes. The final native rerun after the map diagnostic passes all eight groups. Parent inspected final rule430/light, news430/dark, industries1450/light, joint1450/dark and funds430/dark screenshots, including centered information-set labels and the longer charge explanation. Non-target finance item bodies remain byte-identical to HEAD. No human approval is required.

Logs: `/tmp/atlas-root-fin-efficiency-{math,native,static}.log`. Screenshots: `/tmp/atlas-fin-efficiency-{rule,news,industries,splits,funds,joint}-{1450,430}-{light,dark}.png`.
