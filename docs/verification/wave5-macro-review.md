# Independent review: macroeconomics chapter 5

Reviewed 2026-10-21. **Accepted**: no mathematical, source-attribution or visual defect requiring a content change was found. Scope: ten items in `content/macro/ch05.js`, quantitative helpers, dedicated tests, reference Python computation, author evidence and final screenshots. Reviewer changes are confined to this report.

## Source and assumption audit

Independently opened and read these authoritative sources:

- [IMF, Money: At the Center of Transactions](https://www.imf.org/en/publications/fandd/issues/series/back-to-basics/money): the three monetary functions. The cycle diagram is accurately described as an authored coordination exercise, with acceptance and settlement assumed. It does not claim to prove money's historical origin or exclude multilateral barter.
- [Bank of England, Money creation in the modern economy](https://www.bankofengland.co.uk/quarterly-bulletin/2014/q1/money-creation-in-the-modern-economy): lending creates deposits; multiplying a fixed reserve stock is not the general operational mechanism. The chapter explicitly separates the restricted geometric exercise from the ledger entry, and does not treat the illustrative reserve target as a current regulation.
- [Humphrey, Richmond Fed WP00-7](https://www.richmondfed.org/-/media/richmondfedorg/publications/research/working_papers/2000/pdf/wp00-7.pdf), printed p.8: accounting identity versus quantity theory. Growth accounting is differentiated correctly, and the price-path inference explicitly fixes the output and velocity paths.
- [Blanchard, MIT 14.452 Topic 6](https://ocw.mit.edu/courses/14-452-macroeconomic-theory-ii-spring-2007/674c807c0213618b99592671bf2b002c_slides06.pdf), slides 10 and 13–17: exact nominal/real gross return relation, competitive factor pricing and benchmark neutrality. The item's fixed-capital static closure is declared separately. A point inflation forecast is correctly distinguished from the statistical expectation of the nonlinear realized real return.
- [Nachega, IMF WP05/221](https://www.imf.org/-/media/websites/imf/imported-full-text-pdf/external/pubs/ft/wp/2005/_wp05221.pdf), printed pp.11–12: seigniorage, inflation tax and declining demand base. The continuous stock/flow identity and chosen exponential demand are explicit derivations. The extra real-balance flow is instantaneous, not mislabeled another steady state.
- [Sargent and Stachurski, adaptive Cagan lecture](https://intro.quantecon.org/cagan_adaptive.html), equations 33.1–33.4: adaptive expectations and expected-inflation demand. The chapter carefully identifies its own continuous constant-real-deficit closure rather than attributing it to the source's discrete exogenous-money-growth implementation. Deriving `m'/m=−a e'` and `M'/M=d/m` gives the stated inflation equation. Its stability signs require the declared `ab<1`; truncation is not a singularity proof.
- [Hanke–Krus original Hyperinflation Table](https://www.cato.org/sites/cato.org/files/pubs/pdf/hanke-krus-hyperinflation-table.pdf): Germany/Zimbabwe rows and footnote *. Reported percentages, peak dates, wholesale versus implied-exchange-rate indices, Old Mutual construction and reported doubling times agree. The curve is explicitly a hypothetical constant-rate conversion of a peak estimate. A common 30-day conversion is not falsely represented as daily observed data or required to match source rounding.
- [San Francisco Fed, inflation costs](https://www.frbsf.org/research-and-insights/publications/doctor-econ/2006/03/inflation/): withdrawal frequency and unexpected nominal-contract redistribution. Resource costs, private opportunity costs and zero-sum transfers remain distinct.
- [Caballero, MIT 14.02 lecture 4 transcript](https://ocw.mit.edu/courses/14-02-principles-of-macroeconomics-spring-2023/1sWJWc4iYESuo4fu0vAqT8aS-KuSosPpq_transcript.pdf), pp.3–5: income and interest-rate money demand. The selected semilog specification and set-valued zero-rate extension are honestly additional assumptions, not implied by a clipped negative intersection alone.

## Independent computations

Reran `node --test tests/wave5-macro.test.mjs`: 12 passes. Read the independent implicit-time adaptive-quadrature Python oracle; it solves a different numerical problem from RK4 and checks price using the expectation-filter identity. Existing tests also substantively check conservation, closed forms, balance sheets, accounting derivatives, root/stability signs and monetary-finance integration.

Additional reviewer-only calculations were executed without editing author files:

- An independently coded Python explicit-midpoint solver integrated expected inflation, log prices and log money with step at most `5e−6` year. Nine combinations of deficit fraction `.2,.7,1.3` and initial expectation `.05,.3,3`, using each JavaScript trace's actual endpoint, agreed to maximum absolute terminal error `2.0643602e−7`, including rapidly growing truncated paths. An initial coarser midpoint step produced larger discretization error; refinement reduced it as expected.
- An independent cash-withdrawal grid of 3,801 values at inflation `0,.04,.2` obeyed the AM–GM lower bound, with continuous optima `244.9489743`, `141.4213562`, `73.8548946` goods and respective grid costs `4.8989796`, `8.4852815`, `16.2480798` goods/year.
- Independent percentage/factor/log conversions gave 30-day doubling times `87.7037688` and `24.3504902` hours. Their small differences from reported table times are explicitly disclosed.

## Visual and browser evidence

Read the dedicated native browser test and final author result: 40 layouts, 280 actual control actions, both themes, actual 320/1200-pixel viewports. The test measures complete dot radii plus one pixel against data clips; it exercises every visible slider endpoint and every select option, checks finite readouts, TeX/runtime/blank errors and horizontal overflow. Root integration remains separate.

Independently inspected full-size captures for all ten items: 5.1 light284, 5.2 dark284 loan mode, 5.3 dark1164, 5.4 light284, 5.5 dark284, 5.6 light284, 5.7 dark284, 5.8 light284 plus final dark284 Zimbabwe mode, 5.9 dark284 and 5.10 light284. Paths follow `/tmp/wave5-macro-5.N-{light,dark}-{1164,284}.png`, with mode variants `-modeK.png`. Axes and scientific readouts are legible; controls wrap; legends distinguish actual graphical quantities. The narrow Cagan scientific residual and historical endpoint marker were reinspected after the final recapture. No clipping, missing graph or misleading interpolation was observed.

Author has frozen the chapter after the final capture run. Review accepts the declared models and historical scope; it does not turn the parameterized examples into empirical causal estimates.
