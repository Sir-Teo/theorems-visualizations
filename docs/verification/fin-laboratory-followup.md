# Finance 5.12 — laboratory dividends and an authored price recurrence

Resolved after independent source, mathematical and native-browser review: **fin-5.12**. Four mathematical groups and four final native groups pass, with a separate agent's independent reruns and source/screenshot inspection. The source flag and ledger are reconciled during this integration. Human approval is not required.

## Original evidence actually read

Smith, Suchanek and Williams, “Bubbles, Crashes, and Endogenous Expectations in Experimental Spot Asset Markets,” *Econometrica* 56(5), 1988, 1119–1151, DOI10.2307/1911361. The original scanned PDF was acquired from the [archived HKUST university mirror](https://web.archive.org/web/20140202134430/http://teaching.ust.hk/~bee/papers/040918/1988-Smith_etal-bubbles.pdf). The author-hosted ResearchGate PDF returned403; its inaccessible body was not used as evidence.

Local original `/tmp/atlas-fin-ssw1988.pdf`:34pages,3,273,086bytes, SHA256 `8ab54414fe2555535bdf1d6aac5e437d643de9c767ccbfb37cfe97072c863a66`. The essentially empty PDF text layer was unsuitable. All pages were rendered and OCRed for navigation using the bundled Python/pdfplumber and local Tesseract; evidence is `/private/tmp/atlas-fin-ssw1988-ocr/page-{01..34}.{png,txt}` and `/tmp/atlas-fin-ssw1988-ocr.txt`. OCR navigation does not establish that every page was read.

Root read the complete introduction §1(pp1119–1121), complete experimental procedure §3(pp1122–1125), opening of §4 and TableI(pp1125–1126), the relevant classification paragraph in §5.3(p1146), and complete summary §6.1(pp1147–1148). Root visually inspected the rotated actual TableI scan `/private/tmp/atlas-fin-ssw1988-table1.png`; the independent agent also inspected it and the original p1148 scan. No complete reading of all case studies, statistical regressions or later studies is claimed. Web screenshots returned text references without viewable images and were not relied on.

TableI **design4**, specifically, uses15periods, dividends0/8/28/60cents with equal probabilities, and no terminal buyout. Expected dividend is24cents; expected remaining undiscounted dividends before period1/15 are$3.60/$0.24, followed by zero after the final dividend. Other original designs have different dividends, buyouts or horizons. The summary classifies14of22 experiments without intervention/disruption as bubble–crash markets;9of14 used experienced subjects. Experience attenuated the tendency without guaranteeing its disappearance. The revised item states this scoped subset instead of imposing a universal historical pattern.

## Corrections and authored-model limits

The source benchmark is now explicitly an **undiscounted risk-neutral expected-dividend benchmark**. It is neither a guaranteed realized dividend nor an arbitrary investor's risk-adjusted valuation. Actual cash-flow addition uses written fin-1.5. The separate hollow after-final-dividend marker is imposed by no buyout; no simulated price is forced to reach zero or presented as a discovered crash.

All model parameters and paths are authored. PresetsA/B/C describe high trend, balanced and strong pull; they are no longer labeled inexperienced/once-experienced/twice-experienced. The original auction has bids, offers, cash/share endowments and no short selling. The recurrence simulates none of those mechanisms and is not the paper's lagged-excess-bid regression or an estimated causal learning model.

For t1–15, with initial prices1.9/1.6dollars, the model is

```
F_t = .24(16−t)
w_t = κ + .5(1−κ)(t/15)^6
p_t = max(.02, p_(t−1) + β[p_(t−1)−p_(t−2)]
                 + w_t[F_t−p_(t−1)] + noiseCents/100 * N_t).
```

Each preset's40paths have independent Gaussian innovations across paths. Common draws across presets make comparisons paired without invalidating within-preset averaging. The finite-horizon Lipschitz/floor recurrence has finite second moments, so actual written **prob-2.2.3**, the L² weak law, is a genuine prerequisite. Forty paths remain a finite estimate. The readout gives the largest estimated standard error among each preset's15means; this is neither a simultaneous confidence interval nor a standard error for paired differences.

RD=`mean(p−F)/mean(F)` and RAD=`mean|p−F|/mean(F)` are explicitly defined descriptive quantities with meanF=$1.92. They are not attributed to the1988 study. The sample curves need not be ordered, and a finite sample cannot establish an experience effect.

Five complete paths appear at the current controls, and all40paths enter each of three comparison means. Resampling refreshes **both** panels. Shared adaptive price limits include every displayed path/mean and the entire benchmark. Each staircase step occupies[t−.5,t+.5], so adjacent steps join vertically. Stroke/glyph padding includes the separate terminal marker. The long recurrence was split into equivalent short formulas after the native430px check caught horizontal overflow.

## Executed validation

`node --test tests/verification-fin-laboratory.test.mjs`:4groups pass; root log `/tmp/atlas-root-fin-laboratory-math.log`.

- Exhaustive dividend histories through6remaining periods verify mean.24, variance.0536, all benchmark timing and meanF1.92.
- All335,421offered β/κ/noise settings match an independently reordered chronological recurrence with fixed positive/negative shocks, including activation of the two-cent floor.
- Direct sums verify RD/RAD, peak price/period and descriptive identities without asserting preset order.
- Independent batch mean/variance calculations verify every period of40-path means and sample standard errors; zero-noise paths are deterministic with zero estimated sampling variance.

`node tests/verification-fin-laboratory.mjs`:final4groups pass at1450/430×light/dark, log `/tmp/atlas-root-fin-laboratory-native-final.log`, session10830 exited0. Every group operates all8actual control corners, every preset, resampling and native keyboard endpoints; independently reconstructs all15current-path prices and all40-path comparison means/SEs; and checks complete curve/stroke/glyph/text/TeX bounds, source staircase, terminal separation and runtime errors. Filled multi-dot capture and single hollow-dot capture are checked separately. The final harness includes the hollow marker's actual default1.8px stroke width; an earlier.75px allowance was corrected before final reruns.

`node scripts/check.mjs fin-5.12 --static`:1item,0errors,0warnings, log `/tmp/atlas-root-fin-laboratory-static.log`. Chapter/helper/native-script syntax and diff checks pass. Chapter and syllabus metadata agree. Other chapter item bodies are preserved.

A separate agent independently read the scoped original, checked actual TableI/p1148 scans, reran4math groups and all4final native groups, and found no remaining scoped defects. Logs `/tmp/atlas-fin-laboratory-independent-{math,native}.log`; native session6498 exited0. Root and reviewer inspected regenerated `/tmp/atlas-fin-laboratory-corner-430-dark.png` and `/tmp/atlas-fin-laboratory-resampled-1450-light.png`: all curves fit, source stair timing and separate after marker are visible, and formulas/controls/readouts are legible. No subjective human review is required.
