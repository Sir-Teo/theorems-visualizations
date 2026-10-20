# Finance 5.10 — historical interpretations, monthly total returns and an authored copying chain

Status: RESOLVED after independent parent source reading, mathematical checks, original monthly-source comparison, four native groups and screenshot inspection. The source flag and central queue are reconciled. No human approval gate applies.

Owned scope: only item 5.10, its import and its specific provenance comment in `content/fin/ch05-b.js` (the actual file, rather than ch05-c); syllabus row 5.10; new `source-audit-speculation.js`; `verification-fin-speculation.{test.mjs,mjs}` and `verification-fin-speculation-source.mjs`; this report. Root owns the simultaneous 5.7 follow-up. No Git mutations, central ledgers, plan, build or generated data edits were made.

## Primary sources actually read

1. Peter M. Garber, *Tulipmania*, JPE 97(3),1989,535–560. [Actual published original, university-hosted](https://ms.mcmaster.ca/~grasselli/Garber89.pdf). Local `/tmp/atlas-fin-garber1989.pdf`,27 pages including cover; SHA256 `63955f8cff17274b67e42bc41004a6f6efa38dd0aeb909792556fc8b0e8f322f`. Extraction `/tmp/atlas-fin-garber1989.txt`. Read complete §§I,IV,VI–VII: introduction, market structure/chronology, assessment and conclusion (printed535–537,541–545,555–558). Actual printed557 image inspected: `/tmp/atlas-fin-garber-original-24.png`; companion printed558 render `-25.png` is retained. The source distinguishes rare-bulb scarcity/reproduction and long price declines from the final common-bulb speculation, and emphasizes incomplete evidence and uncertain fundamentals. No original seventeenth-century archival reading or full reading of Garber's source-criticism/data-analysis §§II–III,V is claimed.

2. Peter Temin and Hans-Joachim Voth, *Riding the South Sea Bubble*, AER 94(5),2004,1654–1668. [Actual published original, university-hosted](https://people.bu.edu/chamley/565-24/VothTemin-co.pdf). Local `/tmp/atlas-fin-temin-voth2004.pdf`; SHA256 `f82fd3664ca5e17b4bde862db2bde750b5bebd6148af8ee178b3bd2926b1a699`. This copy has20 PDF pages, including appended citing-article material after the original. Read complete introduction, §I including its Data subsection (1654–1658), and complete §V conclusions (1666–1667). Extraction `/tmp/atlas-fin-temin-voth2004.txt`; actual printed1656/Table1 image inspected at `/tmp/atlas-fin-temin-original-03.png`. The university copy contains teaching highlights. The item attributes the authors' interpretation of Hoare's strategy and their coordination argument, including their warning that synchronization risk is not the only cause. No transcription of their historical prices or independent replication of their bank-profit estimates is claimed.

3. José Moran, Antoine Fosset, Alan Kirman and Michael Benzaquen, *From Ants to Fishing Vessels: A Simple Model for Herding and Exploitation of Finite Resources*, [primary author preprint](https://arxiv.org/abs/2009.10563). Retrieved PDF is dated February25,2021, so the item identifies that version. Local `/tmp/atlas-fin-kirman2020.pdf` (filename refers to the arXiv submission year); SHA256 `e253fbf4724c6aafe85b676eb8a4beebcdf8fd68fe24b31c6ef9b0a2ff2e0066`. Read the opening model discussion in §III, pp6–7, including its distinction between copying a peer and following a majority; actual p6 image inspected at `/tmp/atlas-fin-kirman-original-06.png`. Extraction `/tmp/atlas-fin-kirman2020.txt`. This supports the recruitment motif. The discrete reset/copy rule, rates, price assignment and invariant-law derivation here are explicitly authored; the fishing data, nonlinear resource dynamics and empirical claims are not imported. Kirman's1993 publisher PDF was unavailable through the attempted public route. Its precise unread attribution and the old generic Kindleberger/BKM credits were removed; no1993 primary review or exact replication is claimed.

4. Official French library construction pages were actually opened/read: [10 industry portfolios](https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/Data_Library/det_10_ind_port.html) and [Fama–French factors](https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/Data_Library/f-f_factors.html). The former defines June SIC-based assignment and July–June return calculation; the latter defines Mkt−RF as the value-weighted eligible CRSP market return less RF. The retained original official monthly archives identify CRSP vintage202608:
   - `/tmp/atlas-root-fin-ff.zip`, SHA256 `593f4fbef03181bc0b22ff6292f217689dd1fb79355049ca905d95b262040a66`; extracted `/tmp/atlas-root-fin-ff.csv`, SHA256 `d7d7fe37b150b5b15c9c069b3ba101dfe1af568c6d7b5db6e73cd0a6c0c9e5e5`.
   - `/tmp/atlas-root-fin-industry.zip`, SHA256 `ebd937a4b995d821867aeb956a96f09a666386f38fa82516b7d1767ee4a49ae5`; extracted `/tmp/atlas-root-fin-industry.csv`, SHA256 `18ed376fc42e2327ceaf3d65a02521a6512e7f9e3001007c4da69d7db108aa82`.
   The raw source CSVs were independently compared; no embedded values changed.

## Historical/data corrections

The old definition required an observed crash and asserted a universal faster-collapse shape. The statement now separates a price pattern from identification of a fundamental-value deviation, and attributes the historical interpretations to the sources above. Tulip categories and incomplete evidence are qualified. South Sea numerical anchors (and their imprecise dates) are removed from the modern portfolio chart.

The former caption called every curve “peak=100,” but telecom and the market were divided by their levels on the high-tech peak date. The revised comparison intentionally keeps that shared date and labels it consistently. Each series is100 at March2000, while its own maximum may occur elsewhere; the broad-market series exceeds100 slightly later.

Monthly returns from January1993 through December2005 are compounded, including an initial wealth point at the actual previous month-end, December1992. The actual high-tech maximum is March2000. The plot includes every month from March1995 through March2003, uses the actual month labels at equal monthly spacing and has97 points per series. It is not the NASDAQ index, a raw price series or an estimate of fundamentals. It is gross nominal portfolio total-return growth with dividends reinvested. The market return is Mkt−RF plus RF, not the excess-return series alone.

Direct source comparison covers624 scalar source values (Mkt−RF, RF, HiTec and Telcm across156 months), all471 compounded wealth points,157 calendar labels and291 plotted normalized points. The high-tech five-year gain is599.2221217%; its change through September2002,30 months after the peak, is−79.53751494%. The retrospective date/window selection is stated.

## Exact authored finite-chain mathematics

N100 agents have binary states, and k is the optimistic count. At one micro-update an agent is chosen uniformly. Copying mode resets it to a fair coin with probability ε, otherwise copying a uniformly chosen other agent. Independent mode always uses the fair-coin reset. This is a discrete authored rule; in particular a reset can retain the current state, so its ε is not silently identified with a spontaneous-flip rate in an unread original.

The displayed up/down probabilities are obtained by enumerating the focal agent's state and the other-agent states. They sum to at most1, and their remaining mass is a self-loop. The numerical implementation samples this exact three-outcome row with one uniform variate. All paths include the initial k50 state at sweep0 and400 subsequent sweeps of100 micro-updates each. The horizontal axis is simulation sweeps, not calendar days.

For ε>0 the finite chain is irreducible and has self-loops. Detailed balance yields

`π(k+1)/π(k) = [(N−k)/(k+1)] [(k+a)/(N−k−1+a)]`,

`a=ε(N−1)/(2(1−ε))`.

Thus copying mode has a symmetric beta-binomial stationary count, with mean fraction1/2 and variance `(N+2a)/(4N(2a+1))`. At ε2/(N+1), a1 and the count mass is uniform. Independent resets give Binomial(N,1/2) and fraction SD.05 for N100. Stationarity is checked independently, not fitted from the finite path.

An additional independent finite-time check propagates the complete distribution and verifies the centered-count moment recurrence

`V(n+1)=A V(n)+B`,

`A=1−2e/N−2(1−e)/(N(N−1))`,

`B=e/2+(1−e)N/(2(N−1))`,

where eε in copying mode and e1 in independent mode. Starting at N/2 gives `V(n)=B(1−A^n)/(1−A)`. No claim that400 sweeps reproduce a stationary sample is made.

The assigned price is `100 exp(1.2(k/N−1/2))`, with an assigned reference100. Its entire possible range is54.88116361–182.2118800, which is always inside the fixed plotted view45–195. Threshold130 is an illustrative reporting threshold. It is not a fundamental-value test or an actual quoted market price. Independent prices are not confined to95–105: the invariant mass outside that interval exceeds36%, and inspected finite paths visibly leave it. Exact invariant probability above130 under independent resets is0.0000062895750083; it is shown in scientific percentage notation rather than rounded to an asserted zero.

The old herding/information-cascade attribution is removed. This chain has no private signals, Bayesian inference, order book, market clearing, cash constraints or learning. The source-based motif and own discrete derivation are clearly distinguished. Actual prerequisites fin-1.1 (compounding) and prob-5.5.2a (detailed balance) replace unrelated proof dependencies; nearby behavioral/valuation topics remain related links.

## Executed checks and visual inspection

- `node --test tests/verification-fin-speculation.test.mjs`: five groups pass; final log `/tmp/atlas-fin-speculation-math-final.log`. They cover independent log-compounding and all historical points/dates;401 logarithmically spaced ε values plus the exact uniform-law threshold; every transition row, detailed balance, symmetry and closed moments; explicit labelled-agent enumeration and a separate Gaussian stationary solve for N4/8/100; complete finite-time distribution/moment propagation; both modes at reset endpoints/default across three seeds, exact40000 draws,401 states, bounds, statistics and reseeding.
- `node tests/verification-fin-speculation-source.mjs /tmp/atlas-root-fin-ff.csv /tmp/atlas-root-fin-industry.csv`: all source comparisons above pass; log `/tmp/atlas-fin-speculation-source.log`.
- `node tests/verification-fin-speculation.mjs`: all four final groups pass at1450/430×light/dark; final log `/tmp/atlas-fin-speculation-native-final.log`. Actual keyboard Home/End reaches ε.0005/.05, with an interior native ArrowRight step; both modes, default state, control visibility and reseeding in both modes are exercised. Every 401-state path and invariant vector is independently recomputed, along with all 291 historical plotted points. Readout checks independently verify the historical gain/change, stationary standard deviation, finite frequency, path range and scientific-notation tail percentage. Full path strokes, dot rings, measured text, display TeX, page bounds and runtime errors are checked.
- The first native run found a genuine narrow-screen peak-label clip. The y-view top was increased to124, and the complete native matrix reran successfully. That earlier process/session91552 exited1 and closed its browser. After adding numeric readout checks, final session 13488 exited 0 with its browser closed. The earlier successful rerun 80522 is not used as exit-status evidence.
- `node --check` passes for the chapter/helper/native script. `node scripts/check.mjs fin-5.10 --static` reports 1 item, 0 errors and 0 warnings (log `/tmp/atlas-fin-speculation-static.log`). Item/syllabus identity, prerequisites, related links and references agree; `verify:true` remains. Items 5.6, 5.8 and 5.9 are byte-identical to HEAD; root owns concurrent item 5.7. `git diff --check` passes. No timing benchmark, global build or data regeneration was run.

Regenerated screenshots inspected: `/tmp/atlas-fin-speculation-copying-Home-430-dark.png` (full mobile copying extreme, complete chart, corrected peak label and finite/stationary distinction); `/tmp/atlas-fin-speculation-independent-End-1450-light.png` (desktop dates, independent prices outside95–105, hidden irrelevant control and readable formulas). The final matrix also saves all mode/endpoint and native-interior screenshots with mobile panel crops under `/tmp/atlas-fin-speculation-*`.

## Independent parent integration

Root independently read the cited original sections of Garber, Temin–Voth (including separately extracted columns), and the opening of §III in the February2021 Moran et al. preprint; inspected the original paper images described above; and read both official French construction pages. Root read actual prerequisite items fin-1.1 and prob-5.5.2a, the complete authored helper and all five math groups, and independently assessed the up/down rates, invariant beta-binomial law and finite-time moment recurrence. The historical source comparison was rerun against the retained original CSVs.

All five mathematical groups pass in `/tmp/atlas-root-fin-speculation-math.log`;624 original scalar values,471 compounded wealth points,157 actual month labels and291 normalized plotted points pass in `/tmp/atlas-root-fin-speculation-source.log`. All four1450/430×light/dark native groups pass in `/tmp/atlas-root-fin-speculation-native.log`, with the browser closed and process exited0. Root inspected the final full430-dark copying image, both chart crops and the1450-light independent image. The charts retain complete paths, the March2000 label and clear finite/stationary distinctions. Root clarified the caption and axis as equal monthly intervals/return month; the x coordinates are month ordinals, not claimed exact Gregorian day timestamps. Final native screenshots include that clarification.

Scoped static/syntax checks, queue reconciliation and Wave5 inventory checks pass at integration. Items5.7–5.9 and the file suffix are unchanged by this integration; concurrent item5.6 is excluded from this commit. The earlier author-only identity claim about5.6 describes the earlier frozen handoff; root's shared working tree now contains the separate Shiller follow-up.
