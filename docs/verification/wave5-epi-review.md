# Independent review — Wave 5 epidemiology chapter 5

Reviewer: author_fluid. Scope: new `content/epi/ch05.js`, `ch05-b.js`, `ch05.shared.js`, dedicated tests and author evidence. Existing 5.9 alias is outside this review. Only this report is reviewer-owned; requested content repairs go through author_ml.

## Sources, estimands and interpretation

Read the actual [Cheung et al. 2019 incidence-density paper](https://academic.oup.com/ije/article/48/6/1981/5519661), especially Introduction and sparse-data discussion; [Kim2015 author manuscript](https://www.meb.ki.se/biostat/cc2024/papers/syllabus/7_Kim_EurJEpi_2015_comparison%20of%20NCC%20and%20CC%20designs.pdf), Methods; [Mansournia/Jewell/Greenland2018 author manuscript](https://escholarship.org/content/qt7xc7191b/qt7xc7191b.pdf), abstract/introduction and cumulative/density/cohort sampling distinctions; and [Maclure1991 original abstract](https://pubmed.ncbi.nlm.nih.gov/1985444/). PMC URLs challenged direct access, so accessible primary-author manuscripts were used. The chapter correctly distinguishes cohort risks and rates, end-noncase odds-ratio sampling, matched risk-set proportional-hazard estimation, baseline subcohort designs and paired-window hazard weighting. Finite estimates fluctuate rather than being forced equal to targets; approximate uncertainty is labeled; confounding, censoring, temporal trends and rare-acute-event assumptions are exposed. The six design conclusions agree with the stated models.

The Horvitz–Thompson calculation in5.6 estimates exposure prevalence in a fixed finite cohort, using the actual probability of ever being assayed. It is explicitly not sold as a survival-regression estimator. Complete follow-up in that fixed demonstration gives noncases positive selection probability. Future cases remain eligible risk-set controls, sampling excludes the present case and is without replacement within each set. Conditional likelihood compares cases with the correctly timed sampled risk sets. Matching on exposure eliminates discordant information. The ecological example is an authored, internally consistent joint mixture; it does not claim to transcribe Robinson's census. Robinson's DOI full text was inaccessible, and I do not claim to have independently read that original empirical analysis.

Independently viewed original rendered scans `/tmp/wave5-epi-doll-p1530.png`, `-p1531.png` and `/tmp/wave5-epi-framingham-p38.png`, `-p41.png`, with source PDFs also opened online:

- [Doll/Hill1954 reprint](https://s3.amazonaws.com/alatoldsite/images/stories/demo/pdf/Tabaco/Otraspub/DollHillBMJ1954.pdf): all four cause-specific standardized-rate vectors, observed lung counts [0,12,11,13], expected [3.77,14.20,10.73,7.31], 29-month male35+ scope, tobacco grams/day including ex-smokers, and one contributory lung death match. Rounded-count Pearson sum8.547 supports the displayed source's rounded8.5. Zero observed nonsmoker deaths is correctly not zero underlying risk; adjusted confidence intervals are not invented.
- [Kannel et al.1961](https://laoha.org/wp-content/uploads/2024/01/Framingham.pdf): Tables6/8 numerators, denominators and expected incidences match all displayed sex/category cells. LVH partitions the definite-hypertension subgroup. Table6's missing-specimen note explains differing cholesterol denominators. Table1 and results independently confirm5127 initially disease-free participants and186 cases. Modern Wilson limits apply only to crude proportions and are clearly separate from the paper's age-sex reference comparisons. No fabricated joint risk calculator or intervention effect is inferred.

## Independent computation

Authored suite rerun: `node --test tests/wave5-epi.test.mjs`, **10/10 pass**.

Additional independent Python oracle `/tmp/wave5-epi-peer.py`, with JSON inputs assembled from the actual generated cohorts:

- Eighteen nested/full-cohort fits across three HRs and three seeds, independently maximizing the directly assembled person-level conditional log likelihood by golden-section search. Maximum absolute log-HR discrepancy **7.30e−8**.
- Observed-information intervals obtained from numerical curvature of that independent objective: maximum endpoint discrepancy **4.29e−7**.
- Exhaustive enumeration of **180** distinct two-control sampling histories on a six-person cohort: ever-inclusion probabilities agree to1e−12, and averaging actual HT estimates recovers exact exposure prevalence to1e−12. This is separate from the authored four-person exhaustive test.
- Four Wilson intervals, including zero/all-case limits, independently checked as score-test boundary solutions to1e−10.

Manually traced outcome-dependent sampling algebra, stationary prevalence balance, matching/crossover odds weighting, person-time stopping rules, confounding/informative-loss switches, constant-hazard sampling and ecological aggregation. No substantive computation or interpretation defect found.

## Native and visual checks

Inspected all40 author screenshots across light/dark and content860/350 via contact sheets, plus full-size actual320px narrow default risk-set output. Independently ran `node scripts/check.mjs epi/5 --dark --w=284 --modes --shots --still --jobs=2`: **10/10 clean**, static0errors/0warnings, no runtime/TeX/blank/quality warning. Root handles the shared full native matrix.

Requested bounded presentation repairs before acceptance: earliest-event gold ring in5.3 had only6.412px left clearance for a6px radius plus stroke at actual320px width; extend lifeline left padding. Its long comparison x-label clipped its final letter; shorten this and similarly long box labels in5.2/5.6/5.7/5.8. No data, source, estimand or mathematical change requested.

Final repairs verified: lifeline padding is now −.06T; the five requested x-labels are shorter. Re-ran the independently instrumented risk-set native gate at actual320/1200px, light/dark: **4/4 layouts, 40 actions pass**, including the earliest-event endpoint and full marker radius plus1px clearance. Re-ran all ten items light284 and the five changed items dark284 with modes: **15/15 clean**, no static/runtime/TeX/blank/quality warnings. Re-ran the authored math suite after repairs: **10/10 pass**. Inspected full-size final dark284 captures for all five changed items; labels fit and the selected rings remain visible. Original light/dark/wide/narrow contact-sheet inspection covers the other layouts.

**ACCEPTED.** No remaining required source, model, numerical or presentation issue within the stated scope. Preserve the accepted chapter bytes; root handles integration and the shared native matrix.
