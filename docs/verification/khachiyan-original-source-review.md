# Khachiyan original: overview evidence and scope

The [MathNet full-text endpoint](https://www.mathnet.ru/php/getFT.phtml?jrnid=dan&option_lang=eng&paperid=42319&what=fullt)
now returns all four pages of Khachiyan's original, Doklady244(5),
1093–1096 (1979). Read its complete Russian OCR: the opening result,
localization/separation section, approximate enclosing-ellipsoid lemma,
fixed-precision algorithm, concluding theorem and references. This supports
the page's polynomial-time feasibility claim. Rational denominator
clearing has polynomial encoding growth.

The scope now separates the rounded, enlarged original construction from
the ideal minimum-volume diagram. Earlier Karmarkar and Boyd–Vandenberghe
readings remain the evidence for the other methods. The stale syllabus
“halving” claim is corrected, and the barrier caption allows an optimal
face. The numerical correction described below is validated independently.

OCR formulas are partly damaged. Screenshot requests returned text
placeholders, and shell downloads returned403: no visual inspection or
local PDF hash is claimed. No exact rounding constants are copied into
the page. The overview source flag is closed at that stated scope, without
claiming a reconstruction of the original implementation.


## Central-path correction

The Newton gradient used plus a/slack for the logarithmic terms in
sum(log(b-a*x)), whose derivative is minus a/slack. This drove the
finite path away from correct centering. The sign is corrected; the
Hessian and warm-start schedule stay the same. The caption starts near
the analytic centre, and the readout identifies a numerical point and
the theoretical bound for an exactly centered point. The shown weight
comes from the plotted grid point.

Three regression groups check the actual path against an independent
closed-form rectangle solution and test strict feasibility, stationarity,
monotone objective and the objective-gap bound across101 weights in four
polygon directions, including flat optimal edges. Twelve native
light/dark states cover initial/final cuts, barrier-weight endpoints and
objective directions0/40/45/90. Captures are inspected; runtime and TeX
checks pass. Full regressions and strict build run before commit.
Artifacts: `/tmp/agent-review/lp-barrier-browser.{mjs,json}`, named PNGs,
`lp-barrier-tests.log` and `lp-barrier-regressions.log`.


The direction45-degree endpoint also exposed determinant cancellation in
the ellipsoid covariance matrix, producing zero area and a NaN ratio.
The update now propagates a matrix factor directly. Its principal shrink
factors give the area ratio4/(3sqrt(3)); the readout propagates that area
instead of subtracting nearly equal determinant terms. Independent
half-ellipse membership checks verify enclosure for early cuts; all61
states remain finite through60 cuts in four directions. This changes
the numerical representation, preserving the ideal central-cut geometry.
