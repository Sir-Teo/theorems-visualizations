# Demography 4.3 — maternal survival, reproduction units and one coherent hazard reconstruction

Status: **RESOLVED after independent parent source, mathematical, original-data, native and screenshot checks.** The source flag and queue are reconciled. No human approval gate applies.

Owned scope: only item 4.3/imports in `content/demo/ch04.js`, matching syllabus row 4.3, new `source-audit-reproduction.js`, `verification-demo-reproduction.{test.mjs,mjs}`, `verification-demo-reproduction-source.mjs` and this report. Shared input data/helpers/renderers and all neighboring items are unchanged. No Git mutations, central ledger/plan edits, global build, generated data or timing tests were performed. Acquisition/compute waited for the parent timing-hold release; all final processes are closed.

## Primary official sources actually read

1. [United Nations Demographic Yearbook, natality Table 3 technical notes](https://unstats.un.org/unsd/Demographic/products/dyb/DYBNat/NotesNatStatTab03.htm), complete HTML read: definitions, rate computation, reliability/limitations, coverage and earlier-data notes. Retained `/tmp/atlas-demo-un-natality-notes.html`. It defines live daughters, the hypothetical prospective mother's lifetime exposure to period mortality/fertility, the five-year multiplier, matching female life-table periods and the conditional replacement interpretation. It also distinguishes synthetic-period from real-cohort experience and warns about grouped/source differences. The note's shorthand Lx/radix is interpreted with actual life-table person-year units, rather than treating a five-year exposure as a dimensionless probability.

2. [WPP 2024 Methodology](https://population.un.org/wpp/assets/Files/WPP2024_Methodology.pdf), actual original `/tmp/atlas-demo-wpp-methodology.pdf`, SHA256 `0c98d8131e61227596fabf21328024a3c6ba05c27dcbbdbf507e5f7edd8a35c9`. Read the actual total-fertility subsection on printed p.7, complete age-specific-fertility subsection pp.8–11, opening sex-ratio-at-birth discussion p.11, and relevant glossary entries for ASFR, female life tables, NRR and SRB (printed pp.57,60–62). No complete reading of the entire methodology report or its underlying cited empirical papers is claimed. Selected extraction `/tmp/atlas-demo-wpp-used-extracts.txt`. Actual printed p.57 ASFR-unit and p.61 NRR/person-year images inspected: `/tmp/atlas-demo-wpp-unit-page-66.png`, `/tmp/atlas-demo-wpp-nrr-page-70.png`.

3. WPP's actual download catalog and source definitions were read from the official application and [downloads catalog](https://population.un.org/wpp/assets/downloads.json), retained `/tmp/atlas-demo-wpp-downloads.json`. The catalog explicitly defines lx as survivors per 100,000 births and Lx as interval person-years. The actual indicator-notes CSV defines SRB in males per 100 female births, TFR in live births per woman and NRR in daughters per woman. The methodology glossary states ASFR per 1,000 women per year; the helper converts it to per woman-year.

4. Acquired the following **original official compressed CSVs**, using the exact catalog paths. All are under `https://population.un.org/wpp/assets/Excel%20Files/1_Indicator%20%28Standard%29/CSV_FILES/`. Exact source URLs, local paths and byte sizes are retained in `/tmp/atlas-demo-source-manifest.json`:

| Original filename | Local path | SHA256 |
| --- | --- | --- |
| WPP2024_Demographic_Indicators_Medium.csv.gz | `/tmp/atlas-demo-WPP2024_Demographic_Indicators_Medium.csv.gz` | `286ac36bb1415e2e1ade03acfef0a29f0e4c087e2f78e38c48f50c5df89082bc` |
| WPP2024_Fertility_by_Age5.csv.gz | `/tmp/atlas-demo-WPP2024_Fertility_by_Age5.csv.gz` | `c0d3b5b7e992902df3be1980cfa86c440c1cd673ecec9d4826142a03aece04ec` |
| WPP2024_Life_Table_Abridged_Medium_1950-2023.csv.gz | `/tmp/atlas-demo-WPP2024_Life_Table_Abridged_Medium_1950-2023.csv.gz` | `3d6e82f23023b5f20e1c190752758f637599974fdcac02d38b94c80c4081f982` |

Full-archive verification independently rereads the originals, checks all offered 50 country-years, `VarID=2`, female sex, ages and interval spans, and compares all 2,800 input scalars: 450 ASFR values within stored 0.1/1,000 rounding; 1,100 female lx and 1,100 female Lx within integer rounding; 50 each SRB, NRR and TFR exactly. All pass, so no shared inputs were changed. Smaller direct source-row excerpts are retained at the corresponding `*-selected.csv` paths, with provenance/hashes in `/tmp/atlas-demo-source-subsets.json`, for parent inspection. These excerpts are not used in place of the final full-archive check.

Actual existing prerequisites demo-4.2 and demo-2.3 were read: the five-year fertility integral and life-table person-year/radix accounting are genuinely used. Mathbio-4.5 was read and moved to a related link rather than retained as a necessary proof dependency. Unread historical invention attributions and the unsupported country-specific percentage assertion were removed.

## Correct interpretation and units

NRR weights the prospective **mother's** survival from her own birth to each childbearing age. It counts her live daughters at birth; there is no second multiplication by each daughter's later probability of reaching adulthood. The old statement described the latter incorrectly. A direct synthetic-cohort test now verifies the distinction: 400 of 1,000 prospective mothers survive a fertile interval, each has two births, half girls, so 400 live daughters per 1,000 initial girls gives NRR .4, not .16.

With ASFR f in births per woman-year and a common daughter fraction b, gross contributions are `5 b f`. Net grouped contributions are `b f (L/l0)`, where `L/l0` is years lived in that five-year interval per newborn prospective mother. It already includes the interval width; multiplying by another five would be wrong. Stored SRB is boys per 100 girls, so `b=100/(100+SRB)`, equivalently `1/(1+s)` for s boys per girl. Assuming one period-wide b across maternal ages is explicit. All nine groups 10–14 through 50–54 are included; the former shaded 15–49-only range is corrected to the actual offered fertility interval.

The valid-life-table/nonnegative-fertility inequality is `0≤NRR≤GRR`. These are period synthetic-cohort measures. The generational replacement interpretation requires unchanged schedules and no migration; it is not a claim about current population size or next-year growth. Male fertility constraints and momentum are not computed.

## Exact, consistent authored slider model

The old code powered the **mean** survival in a five-year band for the bars while powering pointwise survival for the separate curve. In general these operations differ. The baseline official-L aggregation was legitimate, but its nonlinear hazard transformation did not correspond to the displayed curve.

The new local reconstruction interpolates log survivorship between each pair of official female lx knots; equivalently it chooses a constant hazard in each interval. Both the curve and bars use `S_k(x)=S(x)^k`. For interval width n, endpoint survivals u≥v>0 and multiplier k≥0, the exact exposure is

```
E_k = n u^k [1−exp(−z)]/z,  z=k log(u/v),
E_0=n,  and E_k=n u^k when u=v.
```

`expm1` evaluates the near-flat expression stably. Net maternity bar heights are `b f E_k/5`, so their areas equal the exact integral of the same displayed model survival. All offered female lx values are positive (minimum 6 per 100,000), so the declared log interpolation is well-defined. The survival graph is shown through age 100; it retains the actual positive survivor knot there rather than forcing the open final age group to zero.

At k=0 the implementation returns exactly NRR=GRR and S=1. Since S is in (0,1], increasing k cannot increase the integral or NRR. The gross area stays fixed. The powered-mean shortcut is not used.

Three quantities remain explicitly separate:

- the selected reconstructed `NRR(k)`;
- the local constant-fertility-band sum using actual official `Lx/l0` person-years at baseline mortality;
- the published UN period NRR.

The readout labels all three and leaves published/baseline references unchanged while the slider moves. It does not attribute the full difference to one unverified cause. Among the offered inputs, the largest interpolation-versus-L difference is .0012145454 daughters (Mexico1950: reconstructed2.2158113383 versus grouped2.2170258837). The largest grouped-versus-published difference is .0149204202 (China1990: grouped1.1176204202 versus published1.1027). Raw source scalars independently match; grouped schedules, constant within-band fertility and the common birth-sex share are approximation assumptions, not data corrections.

## Executed checks

- `node --test tests/verification-demo-reproduction.test.mjs`: **4 groups pass**, `/tmp/atlas-demo-reproduction-math-final.log`, process exited 0. First prototyped outside the default glob. Independent Simpson integration checks exact exposure at all 61 settings, flat/near-flat/steep authored hazards; every 50×61 offered case checks nine band integrals, all curves, monotonicity, baseline/source L bounds and no-mortality equality. Radix invariance, fertility scaling, birth-sex units, explicit live-daughter cohort accounting and a strict powered-mean-versus-mean-power counterexample are covered. The first prototype's deliberately steep artificial hazard exposed insufficient reference-quadrature resolution; refining the independent quadrature resolved it, with the production formula unchanged.
- `node tests/verification-demo-reproduction-source.mjs /tmp/atlas-demo-WPP2024_Demographic_Indicators_Medium.csv.gz /tmp/atlas-demo-WPP2024_Fertility_by_Age5.csv.gz /tmp/atlas-demo-WPP2024_Life_Table_Abridged_Medium_1950-2023.csv.gz`: **all 2,800 source scalars pass**, `/tmp/atlas-demo-reproduction-source-final.log`, session 69587 exited 0. Validator uses only standard Python csv/gzip through Node; no dependency or input changes.
- `node tests/verification-demo-reproduction.mjs`: **4 groups pass**, 1450/430 × light/dark, `/tmp/atlas-demo-reproduction-native.log`, session 78459 exited 0/browser closed. All 50 country-year button combinations at hazard 0/1/3 are checked per group. Independent numerical quadrature, all 27 rectangles, 802 curve points, 22 source knots, official-L/published references and numerical readouts are compared. Actual Home/End reach 0/3 and native ArrowRight reaches .05. Complete rectangle/path strokes, exact source-dot radius, measured text/halos, TeX, runtime and page bounds pass.
- `node scripts/check.mjs demo-4.3 --static`: **1 item, 0 errors, 0 warnings**, `/tmp/atlas-demo-reproduction-static.log`, session 17187 exited 0. Chapter/helper/syllabus/native syntax and `git diff --check` pass. Exact item/syllabus identity/deps/see/refs agree and the flag is retained. Neighbor bodies 4.1/4.2/4.4–4.6 are byte-identical to HEAD.

## Saved visual evidence actually inspected

Inspected full `/tmp/atlas-demo-reproduction-high-mortality-430-dark.png`: maternal-survival definition, formulas, distinct colored gross/net/loss areas, full survival path and knots, controls and all three baseline/reference readouts remain legible. Inspected `/tmp/atlas-demo-reproduction-no-mortality-1450-light.png`: NRR=GRR, S=1 with complete top/endpoints, exact absence of mortality loss and clear reference distinction. Also inspected native-size `/tmp/atlas-demo-reproduction-high-mortality-430-dark-panel0.png` (full nine-band loss/net rectangles) and `/tmp/atlas-demo-reproduction-no-mortality-430-light-panel1.png` (S=1 and all source knots within the padded plot). All default/high-mortality/no-mortality/native-interior screenshots and mobile panel crops are retained under `/tmp/atlas-demo-reproduction-*`.

## Independent parent acceptance

Root read the actual UN natality definitions/computation and relevant limitations; WPP2024 total/age-specific fertility excerpts and actual glossary57/61images (including NRR and person-years), and the sex-ratio-at-birth definition. Root read the actual demo4.2 fertility and demo2.3 life-table bodies, the complete isolated helper and all mathematical/source/native checks. Root independently derived the interval exposure integral of S(x)^k, the no-mortality equality and monotonicity, and verified the one-generation maternal-survival/live-daughter accounting without a second survival factor.

Root reran four math groups, the full original compressed-source comparison of2800scalars across50country-years and scoped static1item0/0 in process82930, exit0. Logs `/tmp/atlas-root-demo-reproduction-{math,source,static}.log`. Root reran all four native1450/430×light/dark groups in process41957, exit0/browserclosed; `/tmp/atlas-root-demo-reproduction-native.log`. Root inspected the final high-mortality full narrow dark page, no-mortality full desktop light page, nine-band mortality/net crop and S=1/source-knot crop. All27rectangles,802curvepoints,22sourceknots, numeric/readout references and native0/3/.05 controls are checked. Shared inputs and neighboring bodies remain unchanged; the official grouped/published references are distinct from the exact declared local interpolation.
