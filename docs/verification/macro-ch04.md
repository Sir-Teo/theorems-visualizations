# Macroeconomics chapter 4 verification — 2026-10-18

Scope: all nine chapter 4 items, their stated assumptions, explanation, attribution,
numerical implementation, and native browser interactions. The sources below are
complete primary texts or original replication datasets, obtained in this session;
the cited locations are the relevant sections reviewed, rather than abstracts or
search snippets. A scholarly host's copy of a primary paper is still the original
paper. The visualizations are teaching models, not estimates of historical paths.

## Disposition and evidence

| Item | Disposition | Primary evidence and review |
| --- | --- | --- |
| 4.1 Ramsey–Cass–Koopmans | Remains flagged: historical source access incomplete | The mathematical specialization is checked independently: positive Cobb–Douglas parameters, CRRA including log utility, steady-state marginal product, golden rule, saddle eigenvalues and stable manifold. The former forward shooting method drifted away from the saddle; backward integration from the stable eigenvector now supplies the manifold. The exactly soluble case `theta=alpha` and residuals of both differential equations verify it. [Cass's original journal PDF](https://academic.oup.com/restud/article-pdf/32/3/233/4429329/32-3-233.pdf) returned HTTP 403; the [Ramsey 1928 copy](https://piketty.pse.ens.fr/files/Ramsey1928.pdf) returned 503 (web fetch 502). A downloaded file at `fitelson.org/probability/ramsey.pdf` was **Truth and Probability**, not the saving paper, and was rejected as evidence. The accessible Koopmans draft is scanned and was not used to imply that all three historical originals were checked. |
| 4.2 Diamond | Source review complete | [Diamond (1965), *National Debt in a Neoclassical Growth Model*](https://www.aeaweb.org/aer/top20/55.5.1126-1150.pdf), pp. 1127–1135, especially the two-period/no-bequest assumptions and golden-rule inefficiency argument. The original has **no depreciation**; the card explicitly identifies its full-depreciation, log-utility Cobb–Douglas version as a teaching specialization. Its saving map and inefficiency condition follow directly from the displayed household optimum and resource constraint. Clarified positive initial capital and that a pension/debt intervention must be appropriately designed. |
| 4.3 AK | Remains flagged: Frankel original not obtained | [Rebelo (1991), *Long-Run Policy Analysis and Long-Run Growth*](https://epge.fgv.br/users/rubens/wp-content/uploads/2016/01/long-run-policy-analysis-and-long-run-growth.pdf), pp. 500–505 and the linear-capital benchmark, supports sustained growth with constant returns to reproducible inputs. Externalities are **not required** in Rebelo. The constant-saving version's differential equation is derived directly; exact solution replaces Euler discretization. The separately credited Frankel (1962), *The Production Function in Allocation and Growth: A Synthesis*, original has not been obtained. [Jones's reading list](https://web.stanford.edu/~chadj/GrowthPapers.pdf) verifies bibliographic existence only and does not close that source check. |
| 4.4 Romer ideas | Source review complete | [Romer (1990), *Endogenous Technological Change*](https://web.stanford.edu/~klenow/Romer_1990.pdf), pp. S73–S76 (nonrivalry), S79–S84 (sectors and idea production), S94–S96 (scale in human capital). The original uses research **human capital** and differentiated capital goods. The card now says its fixed research share and `Y=A L_Y` are a teaching reduction. Nonrivalry permits spillovers but does not logically impose exponent one. Clarified that `A'/[A L_A]` is constant while `A'/L_A` rises with A. Corrected reversed panel references, clipped doubled-population line, and the crossing when the research share falls. |
| 4.5 Jones/Bloom | Source review complete | [Jones (1995), *R&D-Based Models of Economic Growth*](https://dxie.people.ust.hk/OnlineMacro/jonesjpe1995.pdf), pp. 759–769, especially (6)–(8), gives the semi-endogenous specification and `g*=lambda n/(1-phi)`. The full scanned PDF was OCRed locally with Tesseract; mathematical equations were also checked algebraically. [Bloom, Jones, Van Reenen and Webb (2020), *Are Ideas Getting Harder to Find?*](https://web.stanford.edu/~chadj/IdeaPF.pdf), pp. 1110–1111, Figures 1–2, supports effort ×23 and productivity ÷41; latest TFP observation is the 2000–2014 average. These are period aggregates, not an observed 84-year continuous path. Exact Riccati growth now runs through year 84 for all controls. The Romer comparison keeps both exponents at one independently of the selected lambda. Zero research-effort growth and phi=1 receive explicit finite readouts. |
| 4.6 Malthus | Source review complete | [Malthus (1798), *An Essay on the Principle of Population*](https://www.gutenberg.org/files/4239/4239-h/4239-h.htm), complete Chapters 1–2; [Galor and Weil (2000)](https://www.fadep.org/wp-content/uploads/2016/10/Dm-3_POPULATION_TECHNOLOGY_AND_GROWTH.pdf), pp. 806–808, discusses the modern Malthusian interpretation. The Cobb–Douglas/log-demographic equations are explicitly a modern stylization. **Corrected substantive error:** sustained technical progress requires balanced income `ybar exp[g/(eta(1-alpha))]`, not income equal to subsistence. Exact piecewise solution replaces a clipped Euler simulation; the technology shock occurs at year 300 with population continuous. The diagram's solid production curve now uses the selected year's technology. |
| 4.7 Escape | Source review complete | [Galor and Weil (2000), *Population, Technology, and Growth*](https://www.fadep.org/wp-content/uploads/2016/10/Dm-3_POPULATION_TECHNOLOGY_AND_GROWTH.pdf), pp. 806–818 (three regimes, education/fertility choices and technology feedback); [Kremer (1993)](https://faculty.econ.ucdavis.edu/faculty/gclark/210a/readings/kremer1993.pdf), pp. 685–686, equations (1)–(4), and pp. 692–695, the finite-speed population/technology reduced form and demographic transition; [Ashraf and Galor (2011)](https://web.williams.edu/Economics/wp/AshrafGalor-Malthus.pdf), introduction, model and empirical analysis of 1–1500 CE, supports the qualified cross-country density/income finding. The simulation's 2%-per-year progress cap and imposed logistic demographic transition are now disclosed; it is not a numerical solution of Galor–Weil's optimizing model. Failure to cross the **maximum** population-drag threshold no longer automatically claims that actual income remains trapped when the demographic transition is enabled. |
| 4.8 MRW | Source review complete | [Mankiw, Romer and Weil (1992), *A Contribution to the Empirics of Economic Growth*](https://eml.berkeley.edu/~dromer/papers/MRW_QJE1992.pdf), pp. 409–420, equations (8)–(12), Tables I–II. Corrected the comparison to adjusted R² .59→.78 in the **same 98-country non-oil sample**; restricted implied alpha=.31, beta=.28 are that sample's Table II values. The paper permits country-specific A(0), assuming its error is uncorrelated with regressors; the former common-level claim was wrong. SCHOOL is a secondary-enrollment investment proxy, whereas PWT `hc` is an efficiency index with a different theoretical coefficient. Re-estimation is explicitly labeled modern and descriptive. Negative adjusted R² bars retain their negative height. |
| 4.9 Institutions | Source review complete; causal interpretation remains contested | [AJR (2001), original journal article](https://economics.mit.edu/sites/default/files/publications/colonial-origins-of-comparative-development.pdf), pp. 1370–1373 and Table 4, column 1; [Albouy (2012), Comment](https://davidalbouy.com/s/AJRrev.pdf), pp. 3059–3068 and robustness tables; [AJR (2012), Reply](https://economics.mit.edu/sites/default/files/publications/The%20Colonial%20Origins%20of%20Compatayive%20Development%20-%20.pdf), pp. 3077–3084 and robustness discussion. Both sides' primary papers were obtained. The card retains the disease/human-capital exclusion concern and disputed mortality data. Conventional standard errors are explicitly identified as homoskedastic. Original replication data and drop-group definitions are checked as below. |

## Original data audit

**PWT 10.01:** [Groningen release page](https://www.rug.nl/ggdc/productivity/pwt/pwt-releases/pwt1001?lang=en),
[complete original Excel download, Dataverse file 354095](https://dataverse.nl/api/access/datafile/354095),
[dataset DOI](https://doi.org/10.34894/QT5BCC). Read the `Data` worksheet.
Compared 85 embedded country rows × six numeric fields (510 checks):

- `y60` and `y19`: `rgdpo/emp/1000`, 1960 and 2019, rounded to three decimals.
- Investment: mean `csh_i`, 1960–2019 inclusive, four decimals.
- Population log growth: `log(pop2019/pop1960)/59`, five decimals.
- `hc60` and `hc19`: original human-capital index, three decimals.

509 initially agreed. Ghana 1960 `y60` was 12.691, while 10.01 rounds to 12.692;
the integrating reviewer applied that one-cell correction in ch03.shared.js. This
1960 field is not used by 4.8's 2019 cross-section. All 510 now agree.

Venezuela's unusual 2019 value was **verified**, not removed as an assumed error:
original `rgdpo=7160.106934`, `emp≈11.6944`, yielding 0.612268 thousand 2017 USD
per worker, rounded to the embedded 0.612. Its status as official data does not
guarantee country-level measurement quality; the visualization is a descriptive
regression of the stated vintage.

**AJR:** [MIT authors' data archive](https://economics.mit.edu/people/faculty/daron-acemoglu/data-archive),
“Table 4: IV Regressions of Log GDP per Capita,”
[original maketable4.zip](https://www.dropbox.com/scl/fi/3yuv9j514zuajzjfluoc1/maketable4.zip?rlkey=pq9l7bxktw1iqxe6fmoh26g79&dl=1).
Read `maketable4.dta`, retain `baseco==1` exactly as `maketable4.do` instructs.
All 64 country identifiers and all 192 rounded `avexpr`, `logpgp95`, `logem4`
cells agree. The source do-file explicitly uses `rich4!=1` and `africa!=1` for
the displayed drop-group sensitivities. From the rounded embedded data:

| Statistic | Recomputed | Published precision |
| --- | ---: | ---: |
| OLS slope | 0.5221296 | 0.52 |
| First stage | −0.6078633 | −0.61 |
| 2SLS slope | 0.9440101 | 0.94 |
| Conventional 2SLS standard error | 0.1563663 | 0.16 |

Input file SHA-256:

```text
pwt1001.xlsx bf2b66c5fd8b465870eeab8bbfa3a57e73253a3236a933286259efbbb5fb67a2
maketable4.zip cd3a1cb197e3065411fce6fabbe06161555468049e6810a28c608d6e361aed34
```

## Validation

- `node tests/verification-macro.mjs`: **8 independent mathematical regression tests passed**.
  Includes the analytic Ramsey solution, both Euler/resource equations, AK slopes,
  diminishing-return steady states, Jones closed-form limits, Malthus impact and
  balanced-growth identities, and the independent covariance-ratio IV identity.
- `node scripts/check.mjs macro/4 --static --fail-on-warnings`: **9 items, zero errors and zero warnings**.
- `node tests/verification-macro-browser.mjs`: actual range input, label/checkbox,
  button, handle drag and scatter click events in light and dark, with pinned local
  **KaTeX 0.16.11**, not a replacement renderer. Result JSON:
  `/tmp/atlas-macro-browser.json`; screenshots: `/tmp/atlas-macro-shots/`.
  **18/18 interaction groups passed**. Screenshots 4.1 dark, 4.6 light and 4.8 dark were inspected: labels and negative bars are legible in the chosen themes. Visual inspection exposed a snap-to-saddle clipping bug at high impatience; the consumption axis now includes the stable manifold and the snap button enables stable-arm projection. A focused repeat for 4.1 passed in **both themes** after that correction. The full-run evidence is also preserved at `/tmp/atlas-macro-browser-full.json`.

Source access failures above are deliberately retained as flags. Mathematical tests
alone are not treated as proof of an inaccessible historical attribution. Closing
4.9's source review does not declare its instrument valid or settle the debate.

Seven source flags closed: macro-4.2 and macro-4.4 through macro-4.9. Two remain: macro-4.1 and macro-4.3, for the specific original-source access reasons in the table.


## Prerequisite audit follow-up

Added derivational prerequisites actually used in the reviewed models, and
synchronized the syllabus: RCK→`ode-6.4` (its saddle path is a stable manifold),
AK→`ode-1.5` (exact exponential flow), Jones→`ode-1.13` (the derived Riccati
idea-growth equation), Malthus→`ode-1.4` (linear log-income differential
equation), MRW/AJR→`stat-12.2` (actual least-squares fits). Source equations
and derivations supporting these links are documented above. A full-module
census after this pass gives macro **23 written cards with cross-field
prerequisites,27 edges,22 distinct targets**; syllabus **32 cards,36 edges,31
targets**. Counts include every written module, not only reviewed chapter4.
