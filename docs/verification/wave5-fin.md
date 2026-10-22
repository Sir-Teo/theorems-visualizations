# FIN6 — author verification

Status: **AUTHOR FROZEN v1; ready for final independent native review**. Final independent acceptance is pending; all author browsers and servers are closed and the lane is released. All work is in the managed shipping worktree; no generated data, other chapters, shared runtime or Git operations were changed by this author.

## Inventory and source reading

The eleven frozen numbers, kinds and names are retained. The complete6.11 Paper authors,1958 year, full title, venue/pages, JSTOR URL and introduces6.8/6.9 are preserved, with verify:true. Non6 chapters and all top-level syllabus metadata match the original snapshot exactly. Live6.7 consumes the written Farkas alias algo11.18, not the stale frozen plan's direct opt5.14.

Read AUTHORING, economics/finance field guidance, MASTER_PLAN7.2–7.3, all actual prerequisite statements/ideas/scopes in `/tmp/atlas-wave5-fin-prereqs.json`, and the actual alias-resolved Farkas statement/proof in opt5.14. The state-price proof explicitly consumes strong separation and also supplies the finite Farkas alternative. The covariance proof uses the actual regression-slope identity; the swap proof uses date-specific discount factors, not a single unexplained yield.

Actual official source bodies:

- Andrew W. Lo, MIT15.401 (2008), lecture8–9, PDF/slides10–22: forward commitment, cash daily variation, margin and carry replication. Downloaded200 `/tmp/atlas-wave5-fin-sources/forwards.pdf`; actual corresponding text and rendered18/22 viewed. Slide22 uses a discrete approximate financial-futures formula. The chapter's continuous-yield formula is explicitly a supplied continuous-reinvestment derivation, not its literal transcription. The slide's clearing-house wording is not adopted as an absolute absence of default risk.
- Dirk Jenter, MIT15.402 (2003), Capital Structure1 PDF6–9 / slides11–18: actual default-state debt/equity split, value additivity and buying/selling a matching payoff. Local `mm1.pdf/.txt`, rendered6/7 personally read.
- Same course, Capital Structure2 PDF2–7 and12–13: WACC fallacy, tax-shield debt-policy/discount assumptions and financial-distress limitations. Local `mm2.pdf/.txt`. Historical2003 tax percentages and carryforward rules are not presented as current rules.
- BIS Borio–McCauley–McGuire–Sushko (2016), “Covered interest parity lost”, actual web BoxA and limits-to-arbitrage text: domestic-per-foreign quote, matched covered routes and credit/funding/balance-sheet limitations. This is qualitative source use; no original historical basis series is invented.
- CME “Money Calculations for Futures and Options” (2015), actual web settlement-variation paragraph: daily cash banking. No present exchange margin number is adopted.

Local download status/URLs are in `/tmp/atlas-wave5-fin-sources/receipts.json`. Web-body reading records are in `/tmp/atlas-wave5-fin-source-model.md`; these are transparent reading notes, not claimed verbatim archived server responses. Commercial Hull/Luenberger bodies were not inspected. The MM1958 JSTOR request yielded only a tag-manager shell, not the article. That stop is binding: no alternate original body, PDF, mirror or cache recovery was attempted. Paper6.11 keeps verify:true, explicitly limits the historical claim and omits unsupported utility/oil empirical cross-sections.

## Actual model decisions and boundaries

6.1 uses exact rational elimination on the finite binary64 input system; compatible singular and inconsistent targets differ. Achieved payoffs/cost are computed from exact holdings before final rounding. Numeric holdings may exceed binary64 even though cost/payoff stay finite; the readout and zero-placeholder holdings plot explicitly say so. The numeric-holdings residual is then unavailable, not falsely zero.

6.2 distinguishes continuous proportional dividend reinvestment from one known cash dividend atT/2. At zero maturity the cash mode is explicitly its immediate-dividend/ex-dividend limit. Original spot/carry factors are retained through the quote and tiny difference evaluation. Borrowing, shorting and dividend obligations are assumptions; no consumption-commodity convenience-yield equality is claimed.

6.3 computes all twelve authored settlements and external collateral injections. Deposits are not gain. 6.4 computes eight authored paired changes with common n−1 sample denominators; its zero-variation case has no unique hedge. No observed commodity dataset or out-of-sample guarantee is claimed. Tiny squared terms are summed rationally before variance conversion.

6.5 labels domestic/foreign quote and continuous rates. A chosen log basis is an authored discrepancy, with BIS qualitative limitations; there is no fabricated post-crisis graph. 6.6 specifies a date0 reset, equal accruals and one curve for both projection and discounting. It computes each coupon plus the telescoping floating leg. Individual tiny coupon rounding and total-PV rounding differ; the readout says so. No principal exchange, multicurve or collateral-market model is inferred.

6.7 states the finite unrestricted-portfolio FTAP with every state possible and strictly positive state prices. Both separation and Farkas arguments are given. The actual two-asset three-state model classifies0<p<2B with rational input arithmetic; boundaries have explicit arbitrage witnesses. Positive exact state prices that round to zero are disclosed. This is not a continuous-time no-free-lunch theorem.

6.8–6.9 use declared operating payoffs40/100/180, positive state prices.35/.30/.25 and distinct physical probabilities.25/.50/.25. Debt is min(F,X), equity the remaining payoff. Risky debt expected return is actually computed; it is not kept constant after default. Zero-price claims have undefined returns. Weighted cash values and expected-return ratios are formed before conversion, preserving tiny debt. Personal reconstruction must use matching state-contingent debt, not an unrelated riskless loan.

6.10's quadratic distress cost is an authored closure on a bounded debt interval. Its analytical interior/endpoint/flat cases are computed. It is neither measured distress probability nor current tax advice. 6.11 draws a modern hypothetical identical-payoff reconstruction with the original-body limitation visible.

## Offline checks and findings

- **15 focused mathematical/metadata groups pass** in `tests/wave5-fin.test.mjs`; log `/tmp/wave5-fin-math-draft.log`.
- Scoped static: **11 items / 0 errors / 0 warnings** (offline only).
- Independent external reference: **1,872 comparisons pass**, 850-digit mpmath original-input formulas and NumPy least squares, including forward yield/cash modes, tiny spot rescue, finite-state boundary decisions, risky/tiny debt, coupon PV/telescoping and sample hedge output. Files `/tmp/wave5-fin-reference.mjs`, `-reference.json`, `-reference.py`, `-reference.log`. Closed-form comparisons allow4e−13 relative plus at most two minimum-subnormal units; expected nonzero results must remain nonzero. Finite comparisons are not a universal numeric error bound.
- Separate exact deep comparison passes non6/top-level baseline preservation. Paper and introduced relationships are covered in durable focused tests.

Pre-native findings retained: root identified unavailable numeric holdings for MIN curvature; malformed matrix shape validation; quote multiplication from an already underflowed fair price; weighted tiny debt products rounded before summation. All are repaired in current drafts and have focused tests. The exact finite cost7 and target1/2/4 survive an overflowing holding; the supplied tiny forward quote is MIN even when fair rounds0; faceMIN debt value and expected payoff remain MIN, while the expected-return ratio is computed from unrounded weighted sums. Subsequent own audit moved tiny variance sums before final rounding and clarified the zero-maturity cash-dividend limit.

## Final author native and visual evidence

The durable utility `tests/wave5-fin-browser.mjs` injects full source metadata in memory only; it never writes generated data. It checks actual model/readout and sampled path/point/bar values, complete glyph/halo and dot/ring extents, strokes and rectangles, full statement/scope/proof/Paper/legend/control widths and readout scroll dimensions. Fresh document navigation is forced for each state. Native control strings are compared to fresh browser-canonical controls while exact snapshots survive actual Create state link restoration. Discrete fields reject nonintegers; continuous controls use step:any. All conditional controls and model-solving buttons are exercised.

- **44 distinct ordinary configurations**, eleven items ×1200/320×light/dark: **1,112 physical actions,600 URL checks,264 actual Shares**, exit0 (`/tmp/wave5-fin-native-second.log`). Actual Share click counter independently matches264. Panel-open actions are included in physical actions, not additional counts.
- After exact-zero swap canonicalization, final item6 replacement **4 configurations /140 actions /72 URL checks /32 Shares**, exit0 (`/tmp/wave5-fin-native-swap-final.log`). After the giant-axis tick repair, final item1 replacement **4 /108 /60 /28**, exit0 (`/tmp/wave5-fin-native-replication-final.log`). These overlap the full44 and are not added as new unique coverage.
- Final critical supplement: **22 narrow item/theme groups,90 raw states,182 physical actions,180 URL checks,90 actual Shares**, exit0 (`/tmp/wave5-fin-critical-second.log`). This includes singular compatible/incompatible and overflowing/tiny-curvature replication, rescued tiny carry quotes, signed MIN parity neighbours and exact-zero time, zero futures variance and overflowing hedge ratio, zero notional, exact-zero par-coupon button, strict state-price boundaries and positive rational prices rounding0, tiny/default/zero debt and equity, flat/zero/tiny trade-off components and Paper zero/mispriced claims.
- **Seven actual written prerequisite/Paper link clicks**, no Shares (`/tmp/wave5-fin-links-final.log`). Targets: fin1.13,fin1.2,fin2.6,fa3.4, alias-resolved opt5.14,fin6.8,fin6.9. Actual loaded statement/proof was checked. Authored deps retain algo11.18; the production alias resolves to opt5.14, as in the actual build.
- Final **44 cold default/full-rich text captures** pass after the last wording-only Paper cleanup, with zero physical/Share/URL actions (`/tmp/wave5-fin-default-final.log`). No broad control matrix is claimed repeated by that capture-only pass.

Minimum full marker/ring clearance in ordinary/critical checks is11.613636364 CSSpx; minimum glyph/halo clearance is3.115623474 CSSpx. Full path/rectangle strokes pass separately, and those minima are not aggregate minima over all ink. Item6 has only paths/bars, so its marker-only minimum is unavailable, not a zero-clearance failure.

Personally inspected every final narrow default in both themes (22 images) and every wide default overview (22), plus selected cash-income mode, maximum and critical images. Current44-default image paths/hashes are recorded in `/tmp/wave5-fin-gallery-v1/manifest.json`; captures are in `/tmp/wave5-fin-production`. Personally read complete actual dark320 rich pages6/7/11, including swap indices/formulas, FTAP strict positivity/proof/alias link and the full Paper bibliography, original-body flag/scope and both introduced relationships. Final Paper wording was re-read in the final capture. Selected full-size raw images include unavailable numeric holdings at MIN, finite1e200 holdings with compact ticks, cash-dividend underflow, original-factor parity rescue, exact-zero par coupon and tiny debt return/quantization. No remaining author pixel finding.

## Retained failures and bounded repairs

The initial320 default pilot (`/tmp/wave5-fin-default-pilot.log`) found long statement displays3/6/7/10; equivalent split definitions passed all eight affected narrow settings. First full control run (`/tmp/wave5-fin-native-first.log`) stopped at a test-only one-ulp Node/Chromium exp-coordinate difference. Transcendental-derived coordinates now use the existing numeric tolerance while snapshot comparisons remain exact. No underlying formula was altered for this test distinction.

Root's later tiny parity fixture exposed basis×time rounding0 before funding growth could rescue a representable difference. The corrected expression retains original basis/time factors and the analytic expm1-ratio limit. At domestic.2,time.49,basisMIN it returnsMIN; time.4 is correctly below range, signed.5 and time0 neighbours pass. Fifteen focused groups and1,872 external comparisons pass after repair.

Own audit found exact zero par coupon represented as−0 at r=.005,slope−.001,T10. Its exact original-input exponent is zero; canonicalizing exact zero uses no tolerance clamp. A durable button/Share fixture verifies+0. Dense-own-index validation also rejects inherited array holes without altering valid model systems.

Initial critical attempt (`/tmp/wave5-fin-critical-final.log`) caught a genuine giant holding-axis tick crop at k=1e−200. Compact chapter-local scientific ticks repair it; the exact curve/holdings values are unchanged and the full critical rerun passes. Positive cash-dividend underflow is explicitly disclosed while original fraction/spot factors determine carry. Final Paper cleanup only removes the implementation phrase verify:true from visible prose and restores normal spacing around1958; the actual metadata flag remains true.

## Freeze and handoff

Final15 focused tests pass (`/tmp/wave5-fin-math-final.log`), scoped static11/0/0 (`/tmp/wave5-fin-static-final.log`), and all1,872 author external references pass (`/tmp/wave5-fin-reference-final.log`). Non6/top-level syllabus deep preservation and exact full Paper/introduces checks pass. Original-body access stops remain binding; no historical measured data is invented or uncertainty flag cleared.

The eight-file author manifest is `/tmp/wave5-fin-author-freeze-v1.sha256`. All author browsers/servers are explicitly closed; the lane is released to the coordinator. Product, syllabus, tests and this author report are frozen pending independent findings. No final independent acceptance or integration pass is asserted by this author report.
