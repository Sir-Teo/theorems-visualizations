# Macroeconomics source follow-ups — 2026-10-18

Source checks **macro-3.9 and macro-3.11 are closed**, following review of the
complete relevant primary papers and the original PWT dataset. This supplements
[the chapter 4 evidence](macro-ch04.md).

## 3.9 Growth accounting

[Solow (1957), *Technical Change and the Aggregate Production Function*](https://economicstrategy.org/wp-content/uploads/2013/10/Solow1957.pdf),
*Review of Economics and Statistics* 39(3), 312–320: pp. 312–313, equations
(1a), (2), (2a), give neutral technology and factor-share growth accounting;
pp. 316–317 and the p. 320 summary support the seven-eighths result for U.S.
nonfarm output per hour, 1909–1949. The card now states constant returns explicitly.
The modern illustration uses employment and human capital, not Solow's historical
hours series. Törnqvist interval weights approximate the continuous-time input
contributions; the displayed residual is exact by construction.

Fixed three implementation errors:

- A 59-year average now weights the last nine-year interval by nine, rather than
  giving it the same weight as each ten-year interval.
- Axis limits include the sums of all positive and all negative stacked components,
  so a negative residual cannot hide part of a positive input stack.
- The contribution of total capital to total GDP growth is called “capital,” rather
  than “capital deepening,” which would require per-worker accounting.

Independent tests recover known productivity growth from synthetic Cobb–Douglas
data and check that unequal intervals reproduce endpoint annualized log growth.

## 3.11 Lucas paradox

[Lucas (1990), *Why Doesn't Capital Flow from Rich to Poor Countries?*](https://www.sfu.ca/~kkasa/lucas90.pdf),
*American Economic Review* 80(2), 92–96. The complete six-page PDF (including its
archive cover) was OCRed with Tesseract. Page 92 gives the 15-fold income gap,
capital elasticity .4, and `15^1.5≈58`; pp. 92–93 discuss labor quality, with an
effective-worker gap of approximately three and return ratio of approximately five.
The text refers to Summers and Heston's **1988 publication**; it does not establish
that these are observations for calendar 1988. That incorrect date claim is removed.
Lucas explicitly acknowledges some international investment, so the card now says
observed flows fall short of the model prediction.

The right-hand panel remains a different, explicitly identified PWT illustration.
Axis limits now include Venezuela and the very large predicted returns at low
capital elasticities. Constructed PWT return dispersion is described as an
illustration of the motivation, not as direct capital-flow evidence.

## Original PWT audit

Used [PWT 10.01's original Excel workbook](https://dataverse.nl/api/access/datafile/354095),
linked by [Groningen](https://www.rug.nl/ggdc/productivity/pwt/pwt-releases/pwt1001?lang=en).
`Data` worksheet, exact country/year identifiers:

- 70 growth-accounting rows × five numeric fields = **350 checks**: `rgdpna` and
  `rnna` rounded to integers, `emp` to three decimals, `hc` and `labsh` to four.
  Every embedded value agrees.
- **85 internal-rate-of-return checks**: mean nonmissing `irr` in 2000–2019,
  rounded to four decimals, or null when wholly unavailable. Every value agrees.
- Chapter 4's independent 510-cell check covers the cross-section's incomes,
  investment, population growth and human capital.

## Validation

- `node tests/verification-macro.mjs`: **10 tests passed**, including two new,
  independent growth-accounting regressions.
- `node tests/verification-macro-followup-browser.mjs`: the initial follow-up run
  passed **6/6 native interaction groups** for macro-3.9, macro-3.11 and game-2.8
  in light/dark, with pinned local KaTeX 0.16.11. Country/share selections, handle
  dragging and changed elasticity/normalization are exercised.
- `node scripts/check.mjs macro-3.9 macro-3.11 game/2 --static --fail-on-warnings`:
  **13 selected items, zero errors and zero warnings**.
- Reviewed screenshots of 3.9 dark and 3.11 light after the interactions; plot
  bounds, signed contributions and extreme implied returns remain legible.

Runtime evidence is in `/tmp/atlas-macro-followup-browser.json`; screenshots in
`/tmp/atlas-macro-shots/`. No causal interpretation is inferred from the accounting
residual or the PWT return comparison.
