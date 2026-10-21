# Independent SYSBIO5 review

Status: **ACCEPTED**, six new items5.1–5.6 on final frozen source. Existing5.7 and its historical source flag remain outside this work.

## Source and mathematical audit

Independently read the actual original Elowitz–Leibler Nature2000 Box1 and inspected its rendered printed337. The dimensionless six-ODE model, decay ratio, leakage and scaling are faithfully distinguished from noisy experimental fluorescence. Independently checked the full Jacobian characteristic polynomial, all six roots, critical-gain polynomial and the lower bound a_c≥4/3. The completed proof now supplies the missing inequality, and a scale-aware near-zero eigenvalue guard reports inconclusive linear classification rather than a false stability certificate. A local crossing is explicitly separated from nonlinear Hopf nondegeneracy and from the existence of a stable cycle.

Read Higham's normalized Hes1 equations and phase/magnitude relations in the author's earlier successful full-body receipt `/tmp/wave5-sysbio-higham-read.txt`. My fresh independent PMC request returned reCAPTCHA; no full fresh retrieval is claimed. The characteristic equation and quadrant-correct atan2 crossing are independently derived. The actual model is Hes1; Monk's separately named p53 and NFκB systems are context, not fabricated p53 trajectories. Constant history, interpolation and the sub-step-delay predictor are stated.

Read the actual Tsai–Theriot–Ferrell2014 TextS1 prose and parameter tables, and inspected the recovered embedded-EMF equation rendering. The square-root-r activation/inactivation factors match the original. The source's contradictory Plx/APC-off prose and table are explicitly identified; the documented table convention is consistently used. The2014 kinetic model, fixed-r assumption, feedback deletion and cascade-lag variation are distinguished from the2008 design comparison and its unreproduced experimental/supplementary results. The clamped scalar response is not called an equilibrium curve of the open four-ODE oscillator.

Independently read the actual JRC2009 §2.1 equations1–5 and Table1. The shipped Kai implementation is explicitly the tabulated Rust four-phosphoform model, with implicit KaiB-mediated sequestration, nonnegative-rate control range and conserved populations. Its actual period is about20.7h, not an imposed24h. Uniform rate multiplication is correctly proved to rescale time and cannot be sold as temperature compensation. The original experimental temperature-compensation statement is separate from this uncalibrated rate model. The author's retrospective Nakajima/Monk abstract-reading receipt is identified as a paraphrased earlier reading, not an archived original response; my fresh PubMed responses were footer-only. Independently read vanZon's primary full-body description corroborating the reported in-vitro phenomenon and its different proposed compensation mechanism.

The discarded2007 allosteric attempt is recorded honestly in author verification: its printed rates imply K0≈5.81μM versus KaiA_total=.58μM, contradicting its desired high-affinity regime. I independently confirmed that unit conversion and the concentration-squared sequestration convention. No replacement constants or periodic curve are silently fitted, and that failed reproduction is not shipped as a successful one. These access/model-version limits do not affect the directly inspected equations used by the final widgets. No additional source flag is required for those explicitly limited claims.

## External numerical evidence

`/tmp/wave5-sysbio-review-data.mjs` and `/tmp/wave5-sysbio-review-oracle.py`, log `/tmp/wave5-sysbio-review-oracle.log`, pass **111,396 independent root and trajectory-sample comparisons**. These construct the full6×6 Jacobian and its numerical spectrum, solve independent scalar equilibrium/crossing polynomials, integrate separately written ODEs with adaptive DOP853 and integrate the DDE by dense method-of-steps intervals.

The independent runs cover repressilator 220 model-time units, Cdk 420 min, Rust 240 h and Hes1 700 min, including zero-delay ODE dynamics. Maximum observed absolute differences in their respective model coordinates are4.12e-4,5.75e-7,1.28e-5 and5.59e-4. These are observed discretization comparisons, not certified global error bounds. The runtime's fixed-step histories, finite-window peak estimates and unresolved periods remain explicitly numerical; neither solver nor a plotted loop proves global attraction.

Independently reran all **14 focused math groups**, pass.

## Independent native and visual evidence

`/tmp/wave5-sysbio-review-browser.mjs`: **24 groups,276 physical actions,120 actual URL replay/rejection checks**, actual1200/320 CSSpx and both themes. Log `/tmp/wave5-sysbio-review-browser.log`; captures `/tmp/wave5-sysbio-review-production`. All modes, conditional controls, newly revealed slider endpoints, full statement/proof/scope/caption/control/legend/readout bounds, formulas, glyph halos, paths and complete marker rings pass. Native marker coordinates agree with the computed model. Minimum full ink/ring clearance11.945CSSpx; glyph3.116CSSpx.

Edited/off-grid state and readouts survive real Create state link replay; invalid/malformed states are rejected. Hes1 positive-subnormal,1e-200 and.027min delays replay exact saved model values without NaN or missing history. All12 narrow default widgets in both themes were personally inspected, along with rich Hes1/Kai scopes and the tuning, uniform-rate and clamped-total modes. Labels, units, actual traces and inventory/conservation readouts are legible. Tall locator-only screenshots may omit their last lines; complete full-page captures and DOM text bounds confirm actual content fits.

All six new items pass AUTHORING§2's seven criteria: specific hypotheses and controls, visible stability/lag/feedback quantities, live numerical evidence, actual integrations, distinct experiments, both-theme legibility and responsive cached redraws. No unresolved mathematical, source, numerical, state or visual finding remains. Reviewer browser closed; preserve source freeze.
