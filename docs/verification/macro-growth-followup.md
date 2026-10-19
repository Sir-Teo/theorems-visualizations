# Growth and development source audit — 2026-10-17

This batch resolves `macro-3.9`, `macro-3.11`, `macro-4.7` and `macro-4.9`.
It leaves the Ramsey and Diamond reviews open, along with the rest of the atlas
queue. No human listening or manual sample gate is marked complete.

## Growth accounting (`macro-3.9`)

Read Solow's [1957 paper](https://economicstrategy.org/wp-content/uploads/2013/10/Solow1957.pdf),
especially the assumptions on pp. 312–313, the private non-farm application on
p. 314 and the seven-eighths calculation on p. 316. The attribution now states the
1909–1949 period and separates that calculation from the modern demonstration.

Compared all **70 country-year records** (ten countries, seven dates) with the
[official PWT 10.0 workbook](https://www.rug.nl/ggdc/docs/pwt100.xlsx), using the
same pinned release as the earlier MRW audit. Every embedded capital-stock value
differed from the named `rnna` series. Replaced these with the source values and
regenerated the rounded input table. Output, employment, human capital and labour
shares were also compared; output rounding is now consistent with the extraction.
The companion **70-year US series**, used by `macro-3.1`, is regenerated from the
same release to keep its capital stock, capital/output ratio and return series
consistent. This source-data repair does not claim a complete source review of
every historical assertion in `macro-3.1`.

Fixed three computation/presentation issues:

- Full-period rates weight intervals by their lengths: 2010–2019 contributes nine
  years, rather than the same weight as a decade. GDP growth now agrees with the
  direct 1960–2019 endpoint log change divided by 59.
- Plot bounds include the sums of all positive and negative contributions,
  rather than net GDP growth or just one negative component.
- The readout calls the capital term **capital accumulation**, since the chart
  decomposes aggregate output, and identifies the rates as log growth. The scope
  distinguishes the finite-interval endpoint-share approximation from the exact
  continuous-time identity, including omitted hours/utilization.

The unrounded source inputs, workbook hash and attribution are in
[pwt-10.0.json](pwt-10.0.json). Reproduce them with
`python3 scripts/verify-pwt.py /path/to/pwt100.xlsx /tmp/pwt-audit.json`.

## Lucas paradox (`macro-3.11`)

Inspected the [original paper](https://www.sfu.ca/~kkasa/lucas90.pdf), pp. 92–93.
It contains the rough income gap of 15 and capital share of 0.4, producing the
rounded return ratio of 58. **1988 is the year of the Summers–Heston citation**;
the entry no longer presents it as an independently established observation year.
The original explicitly acknowledges some investment in poor countries, so the
entry now describes flows as smaller than predicted, rather than absent.

Replaced the vague textbook pointer with the original article and labelled the
PWT picture as a separate modern comparison: income in 2019, mean available
constructed returns over 2000–2019. It does not measure investment flows. The
capital-share slider previously sent the left-hand curve/handle above the fixed
vertical range; the view now includes the full curve at both endpoints.

## Escape from the Malthusian trap (`macro-4.7`)

Checked the [Galor–Weil publication](https://www.aeaweb.org/articles?id=10.1257/aer.90.4.806),
its [original scan](https://faculty.econ.ucdavis.edu/faculty/gclark/210a/readings/GalorWeil1.pdf)
and [Kremer's original paper, especially §III](https://www.steveambler.uqam.ca/511/readings/kremer.1993.pdf).
The [Ashraf–Galor article's abstract](https://www.aeaweb.org/articles?id=10.1257/aer.101.5.2003)
supports the limited statement about technology, population density and living
standards in their 1–1500 CE analysis. No historical parameter calibration is claimed.

Corrected the claim that positive progress below the biological cap necessarily
returns income to subsistence. With constant progress and no transition, this
particular demographic response instead approaches
`y/ybar = exp(gA / (eta*(1-alpha)))`. Its annual log-step version has an independent
closed-form geometric solution, checked in the regression suite.

The marker previously also required `ln(y)>0.4`, delaying its displayed crossing.
It now identifies the first `gA > (1-alpha)*nmax`, with no extra income condition.
The caption distinguishes that sufficient cap threshold from current growth,
which is the difference between progress and actual population drag. Removed the
claim that these chosen mechanisms are necessary for every escape theory and
documented the toy model's progress cap, demographic response and annual steps.

## Institutions (`macro-4.9`)

Obtained `maketable4.zip` through the [authors' MIT archive](https://economics.mit.edu/people/faculty/daron-acemoglu/data-archive)
and read its Stata program. All **64 embedded rows**, including Africa/Asia/neo-Europe
group membership, match the original data within their two-decimal rounding.
Independent NumPy least-squares calculations reproduce OLS, first-stage and 2SLS
coefficients and conventional homoskedastic standard errors for **all eight**
combinations of the three switches. The unrounded full-sample slopes are about
0.5221, −0.6068 and 0.9443; the 2SLS standard error is about 0.1565, matching
[Table 4, p. 1386](https://economics.mit.edu/research/publications/colonial-origins-comparative-development-empirical-investigation).

Checked the [Albouy comment](https://www.aeaweb.org/articles?id=10.1257/aer.102.6.3059)
and [AJR reply](https://www.aeaweb.org/articles?id=10.1257/aer.102.6.3077).
The debated identification is still described as debated. Replaced the claim of
equal Korean starting conditions with the simpler observation of divergence after
partition. Identified the displayed standard error as homoskedastic and the
plotted inputs as rounded.

[ajr-table4.json](ajr-table4.json) records the original data, archive hash and
independent fits. Reproduce it with
`python3 scripts/verify-ajr.py /path/to/maketable4.zip /tmp/ajr-audit.json`
using `pandas` and `numpy`.

## Validation

- `npm test`: 47 math, 20 science-kit and **15 verification regression tests** pass.
- Strict build and full static validation: zero errors or warnings.
- Five affected visualizations (`3.1`, `3.9`, `3.11`, `4.7`, `4.9`) pass browser
  checks in light/dark and selector/toggle modes. The time-dependent picture is
  also captured at its fixed review time.
- `node tests/verification-growth.mjs`: ten growth-accounting countries with both
  share choices, signed stack bounds, weighted readouts, Lucas slider endpoints,
  the no-spillover balanced-income path, the first cap crossing, and all eight
  institutions sample filters pass. These supplement numerical source comparisons.
- Seven affected chapter/item routes pass their smoke checks. The earlier full
  272-route run remains recorded in the main report; this batch uses targeted
  route checks because the router and UI engine did not change.
- Screenshots are reviewed for layout. These automated/source reviews do not
  replace the project's planned human sample or subjective audio listening.
