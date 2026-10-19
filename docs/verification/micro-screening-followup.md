# Second-degree discrimination: additional follow-up

**Resolved additional follow-up: micro-10.6.** Four independent mathematical groups and all eight final native-browser groups pass. Regenerated desktop/mobile screenshots have been inspected. This item was unflagged and was discovered while reviewing neighboring items; its existing verify state is preserved. It is an additional documented follow-up, not a closure silently taken from the original source-review inventory.

## Exact sources read and limits

Read October 19, 2026:

- Maskin and Riley, *Monopoly with Incomplete Information*, RAND Journal of Economics 15(2):171–196 (1984), [author-hosted original](https://maskin.scholars.harvard.edu/sites/g/files/omnuum10606/files/maskin/files/monopoly_with_incomplete_information.pdf). Read §2 and the finite-type part of §3, printed pp172–178: consumer surplus and hidden types, a zero outside option, the two-type distortion argument, low-type exclusion, Proposition 1, ordered quantities, binding downward IC and the lowest type's zero surplus. The original text is available through the web PDF reader; direct local download returned 403, so no local PDF hash or claim of inspecting original page images is made. The later continuum results and the full paper are not claimed reviewed.
- Sara Ellison's [MIT 14.27 Lecture 13 (2014), complete two-type section pp4–5](https://ocw.mit.edu/courses/14-27-economics-and-e-commerce-fall-2014/01454b51f87e5907b6097de412687b59_MIT14_27F14_Lec13.pdf). Read and inspected the actual four constraints, payment substitutions, low marginal-benefit inequality and high efficiency argument.
- Glenn Ellison's [MIT 14.271 Lecture 3 (2022), complete two-type derivation, slides13–18](https://ocw.mit.edu/courses/14-271-industrial-organization-i-fall-2022/mit14_271_f22_lec3slides.pdf). Read the type/utility/resale hypotheses, participation and IC constraints, binding reductions and distortion observations; inspected the actual formula slides17–18. These authored derivations supply the screening framework. Their equal-type objective is not copied as if it already contained our arbitrary population share; the weighted quadratic extension is derived and checked independently.

The Mussa–Rosen 1978 publisher record and an institutional original-paper link were located, but the original could not be read here (publisher access restriction, institutional mirror unavailable). Its historical credit is explicitly removed rather than represented as a reviewed original. Maskin–Riley credit is retained only for the framework actually read. No empirical values or claims are imported.

Source typographical inconsistencies are not copied: Glenn Ellison's slide14 reverses the cross-partial sign printed on slide13, whereas the specified quadratic model has cross-partial +1. Sara Ellison's p5 participation-implication chain ends with a printed ≤0 despite low IR requiring ≥0. The explicit four slacks and independent profit bound resolve both directly; neither printed inconsistency is used as a hypothesis or proof step.

## Material corrections

The old low-type distortion inequality had the wrong sign: a downward-distorted positive quantity has marginal benefit **above** cost. The closed-form low quantity now includes zero and the exact cutoff phi=(thetaL−2)/8; exclusion eliminates the high type's information rent. The optimum is stated for a specified quadratic two-type model, rather than as a universal property of all screening problems.

For any implementable menu, low IR and high IC give the independent profit upper bound
`(1−phi)[(thetaL−2)qL−qL²/2] + phi[8qH−qH²/2−(10−thetaL)qL]`.
Both quantity quadratics have strictly negative curvature on the offered share range. Their nonnegative maximizers are qH=8 and the stated clipped qL. At that menu the four slacks are exactly `[0, delta*qL, delta*(8−qL), 0]`, where delta=10−thetaL; thus the upper bound is attained. This supplies global optimality beyond the tested grids, including exclusion and all nonnegative quantities.

The former caption reversed utility comparisons by saying buyers prefer points closer to their benefit curve. Utility is the larger vertical gap below the appropriate curve. The new diagram and IR/IC panel show these actual comparisons. All four constraint slacks are calculated directly; the former .05 feasibility tolerance could classify a substantive violation as passing and is replaced with numerical precision only. Assigned profits at failed menus are clearly counterfactual, rather than implemented sales.

The former quantity/payment handles had no economic bounds, negative parts of the low benefit curve were clipped, and the exact zero low package sat against the plotting boundary. Handles and package controls now cover nonnegative quantities0–10 and payments0–50, with padded finite views that include the complete specified benefit curves and all ring/hover footprints. Separate keyboard controls preserve access when the two handles coincide. Purple optimum rings remain visible around the filled selected handles. No unverified generalization to all monotone utility models is made: the quadratic benefit is explicitly used even beyond its peak.

Weak IR/IC optima require a choice convention. The statement and implemented-profit readout explicitly assume intended-package choice at indifference, including participation; they do not claim strict incentives.

## Independent mathematical checks

`node --test tests/verification-micro-screening.test.mjs` passes **4 groups**, after an initial successful prototype run outside the default test glob.

1. All 7,171 actual share/type settings satisfy independent IR/IC, high efficiency, the corrected marginal distortion and exclusion KKT conditions. Exact cutoff buttons produce a zero low quantity for every type setting.
2. An independent two-variable payment linear program enumerates vertices from all four IR/IC constraints and nonnegative payments. It verifies the optimal binding constraints and compares feasible candidate menus against the claimed maximum.
3. Independent complete quantity grids and feasible random menus verify global expected-profit dominance at corners, interior cases and both sides of exclusion. The upper bound comes from low IR and high IC, not production formula reuse; strict concavity makes its attained maximizer global.
4. Independent net-benefit integration verifies welfare, information-rent accounting and the full-information loss. Every actual menu-control corner is independently classified. A genuine negative IC slack is rejected.

Tiny cancellation noise at binding constraints is normalized below1e−12; the feasibility tolerance is1e−9. These are numerical conventions, not an economic allowance for incentive violations.

## Native evidence

Command: `node tests/verification-micro-screening.mjs` exits0 on the final statement, including its explicit share bounds, and the final shared caption stylesheet. Two distinct groups per 1450/430 × light/dark cell give **8 passing groups**: complete model/control corner checks, then native pointer/control reachability. The model matrix contains all64 actual type-share/menu corners, all four optimum buttons and both exact off-grid exclusion boundaries. Independent utility, slack, profit and rent calculations verify drawn states. Every finite curve/area/bar, ring, handle hover footprint and measured custom-label box is checked for containment, alongside display math, page overflow and runtime/readout validity. Native drags verify endpoints and synchronized controls; coincident handles can be separated through their independent sliders.

The initial pointer assertion incorrectly demanded floating-point exactness from CSS pixel coordinates; it caught a 3.3e−7 quantity difference. The corrected native check bounds target error by half a CSS pixel in each axis and separately checks exact handle/control synchronization. No production model change was needed for that browser-coordinate quantization.

Inspected regenerated final screenshots include `/tmp/atlas-micro-screening-optimal-0-430-light.png`, `/tmp/atlas-micro-screening-optimal-1-1450-dark.png`, `/tmp/atlas-micro-screening-optimal-1-430-dark-panel0.png`, `/tmp/atlas-micro-screening-corner-0-15-430-dark-panel1.png`, `/tmp/atlas-micro-screening-coincident-menu-430-dark-panel0.png`, and `/tmp/atlas-micro-screening-boundary-End-430-dark.png`. The complete negative benefit branch, zero low package and optimum rings remain visible; the negative IR slack is fully contained; the exact exclusion state and coincident controls remain legible. The efficient-quantity dash has its own legend entry and readout conclusions explicitly refer to the optimum.

## Local authored-source evidence

- `/tmp/atlas-micro-ellison-discrimination.pdf`, SHA256 `12126bbd644af2a21b4227d72398d7392fdaf0fba5d33760fbdf6e996e105bd1`; `.screening.txt`; renders `-page{3,4}.png` (zero-based indices).
- `/tmp/atlas-micro-glenn-ellison-discrimination.pdf`, SHA256 `31552a06059fd7b874ec86917c69faf67b7ed73a0c70292628297644b0c63d25`; `.screening.txt`; renders `-page{12,13,14,15,16,17}.png`.

Only object10.6, its new helper/tests/report and syllabus row10.6 are changed. Objects10.1–10.5 were compared byte-for-byte with HEAD and are unchanged. `git diff --check` passes. No central ledger, master plan, package, build, verify-state or Git mutation is included.

## Parent independent integration

The parent independently read the stated original Maskin–Riley sections and
both complete authored MIT two-type derivations, checked the explicit profit
upper bound and its attained optimizer, and independently passed all four
mathematical groups, eight final native groups and the scoped static check.
Wide/light optimal and failed-menu screens and narrow/dark exclusion, negative
IR and exact-boundary screens were inspected. Benefit branches, zero low
packages, optimum rings, full slack bars, choice conventions and controls remain
visible. Logs: `/tmp/atlas-root-micro-screening-{math,native,static}.log`.

The existing unflagged state is preserved. This additional resolved follow-up
is now in the central inventory; the original pending count remains196.
