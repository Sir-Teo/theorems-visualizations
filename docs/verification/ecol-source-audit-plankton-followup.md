# Plankton source review ready: ecol-4.6

`ecol-4.6` in `content/ecol/ch04.js` is ready; flag remains true for root's atomic integration. Existing helper `ch04.shared.js` was not changed. Dedicated source-data/run helper, math/browser tests and this report are new.

Primary source: [Huisman & Weissing, Nature402 (1999), 407–410, complete author-hosted paper](https://www.rug.nl/research/gelifes/tres/publications/_pdf/hw99_nat.pdf), linked by the [authors' Groningen publication list](https://www.rug.nl/research/gelifes/tres/publications/1999?lang=en), [publisher DOI](https://doi.org/10.1038/46540). All four original pages were read, including equations1–3 on407, Figure2/chaos discussion408–409, Figure4 and bifurcation counterexamples409, conclusions and complete Methods410. Cache `/tmp/atlas-ecol-huisman1999.pdf` SHA256 `0b72ae5da166ac3f9080b50822704066978f1e9fd2f236d798333d120b0abbeb`. PDF page = printed−406. Page407 begins with the end of an unrelated preceding paper; only the Huisman/Weissing text was used.

Methods410 specifies resource-row/species-column K and C matrices, supply `[6,10,14,4,9]`, growth1/day and mortality/turnover0.25/day. All120entries were compared after transposition to species-first storage. Species1–5 start at0.1+i/100, later arrivals at exactly0.1, with cohorts at1000,3000,5000days. The authors' simulations reportedly continued beyond250,000days; neither their finite evidence nor the atlas's10,000-day reproduction is a permanence proof.

Corrections:

- Corrected later introductions, formerly0.16–0.22 because the initial-species formula was incorrectly reused. Removed an unused initial-state parameter and extra integration beyond the requested endpoint.
- Removed positive plotting floor0.0011: previously every not-yet-introduced species had a drawn positive line from day0. Now zeroes are omitted and the logarithmic axis fits every actual positive abundance. Species9–12 use dashed lines to distinguish the repeated color cycle; all species have a legend.
- Divergence plot now fits its actual finite log-difference data; zero differences are omitted instead of replaced by an arbitrary positive floor. Growing finite differences are described as evidence consistent with the reported chaotic regime, not a standalone chaos proof.
- External supply concentrations are constant; dynamic resources/species fluctuate. Removed the false statement that transients can never exclude species, since the same source's Figure3 has exclusion regimes. Final “12 above0.01” is an explicitly finite threshold count, not a claim of permanent coexistence.

Validation:

`node --test tests/verification-ecol-source-audit-plankton.test.mjs`: **6groups pass**. Full120source coefficients; exact introduction schedule/levels and positive finite resources/abundances through10,000days; independent exact resource-plus-consumer mass balance including every introduction impulse; short transient compared with separately implemented Heun integration of the original ODEs (100,000steps, not another RK4); short-time step-halving consistency; actual-positive logarithmic bounds without fabricated zeroes. Long chaotic paths are not required to match pointwise across methods.

The exact balance is a useful independent invariant: because mortality=turnover=D, `M_j=R_j+Σ_i C_ji N_i` obeys `M'_j=D(S_j−M_j)` between introductions; each introduction adds its known C-weighted abundance. The complete trajectory satisfies this analytic solution, including impulses, within1e−7relative comparison.

`node tests/verification-ecol-source-audit-plankton.mjs`: **2native item/theme groups pass**. Actual5→12→5 selection repeated twice in each theme; checks the rendered cohort start times and0.1levels, every actual positive plotted ordinate and log bounds, final counts, dashed identities and finite difference-plot limits; no runtime/TeX/nonfinite diagnostics.

Inspected screenshots `/tmp/atlas-ecol-plankton-unintroduced-species-omitted-light.png` and `/tmp/atlas-ecol-plankton-finite-sensitive-dependence-dark.png`; matching opposite-theme captures retained.
