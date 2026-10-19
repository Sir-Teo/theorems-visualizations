# Positivity: population condition and sampled overlap

`causal-1.8` used P(L=l)>0 to select covariate values without limiting
L to a discrete variable. That condition is vacuous for a continuous
covariate distribution, including the page's own example. The binary
population condition now holds for almost every covariate value under
the target distribution; the discrete formula is identified separately.
Consistency and exchangeability are explicit in the identification
argument, and the actually used consistency prerequisite is mirrored in
the syllabus. This is an internal collection link, adding no cross-field
quota credit.

The illustration uses a logistic propensity strictly between zero and
one. Its sparse sampled treatment groups therefore do not establish
structural nonpositivity. Red bands now identify the actual rule: an
occupied bin has fewer than three observations in an arm. The readout
uses the number of occupied bins and compares each estimated contrast
with its own target group's simulated truth. The retained-bin result
is no longer called automatically correct: at the default setting it
is about 4.24 versus 5.07 for those bins. Finite sampling, coarse binning
and outcome-model error remain distinct from population identification.
An unavailable retained-bin estimate has an explicit message.

Native inspection also found that extreme extrapolated lines and some
observations left the fixed outcome-axis range. It now includes the
observations and fitted-line endpoint values. Treatment assignment,
potential outcomes, fits and numerical contrasts are unchanged.

## Reference read

Read the complete relevant text of Hernán and Robins, *Causal Inference:
What If*, [2 January 2025 author PDF](https://miguelhernan.org/s/hernanrobins_WhatIf_2jan25.pdf):
§3.3, printed p. 32 (PDF 41); Technical Point 2.3, p. 25 (PDF 34);
and Fine Point 12.2, p. 163 (PDF 172). These cover target-population
positivity, continuous-covariate integration, and structural versus random
zeros. The remainder of the book was not read in this follow-up. Its
text supports the definition and distinction; this is not a reading of
Rosenbaum and Rubin's 1983 original and closes no historical source flag.

Retrieved 2026-10-19; PDF SHA-256:
`79df35dc15e18ab80061aa5553e330b49c822c270650dab5b4aaaab61c7c22dd`.

## Validation

Actual native range inputs cover the default rule, flat assignment,
maximum steepness at both switch-position endpoints, and a fresh treatment
allocation, in both themes. Ten controlled captures and both default
captures were inspected. All readouts remain finite, use the revised
occupied-bin/target wording, and have no runtime or real-TeX errors.
Strict build, source reconciliation, sample hashes, prerequisite mirrors
and the acyclic graph check pass. The cross-field total remains 777,
with nine shortfalls. The prior full regression suite passes; these
wording, axis and readout qualifications add no new numerical test.
