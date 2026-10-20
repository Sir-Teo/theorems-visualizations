# ARCH3.9: height does not repair the fixed pier

New neighboring verification flag retained pending independent review. This item was not in the original nine ARCH flags. Coordinator authorized its repair after a concrete counterexample, preserving the correct fixed-case maximum-H result. No generic correlated-reaction failure is claimed.

## Finding and source scope

The prior sentence said a taller buttress brings the line inward. At the actual fixed width1.2m and actual maximum-H reaction, height1m gives outer-toe clearance+0.35226982593216505m and factor2.121952951275244, height4m gives+0.008869905790262589m/factor1.0142134917409398, and height12m gives−0.18544544230505622m/factor0.7680491673999832. Increasing height can therefore change the offered model from passing to failing the toe condition.

These are authored dimensions, not survey measurements: mean radius3m, thickness0.5m, clear span5.5m,24 polygonal blocks with radial joints, γ=22kN/m³, per unit depth, under self-weight. The old “6m span” caption confused mean diameter with clear span and is corrected. The shared fixed-block geometry/LP is retained, with every polygon weight, centroid, reaction, joint moment and line checked independently. No shared engine/runtime change.

Historical context is limited to the actual complete Huerta2006 *Geometry and equilibrium: The gothic theory of structural design*, pp23–28, and the conditional plane no-tension calculation in Rodríguez-Mayorga et al.2015 §5.1p8. Actual sources, SHA values and page/renders are in the already accepted `arch-buttress-sources.json` and `/tmp/atlas-worker-two/arch-sources/`. Both papers were fully read for the preceding batch; actual HuertaFig3p24 and Santiago§5.1/Fig7p8/Fig8p9 pixels were personally inspected. Neither supplies the authored dimensions or proves a generic H-only bound. All equations and the fixed-case guarantee below are independently derived.

## Correct height result

For imposed reaction(H,V) atx0, inner pier facexi, outer toexo=xi−w, axisxc=xi−w/2, cut equilibrium gives

`X(d)=[V x0+γwd xc−Hd]/[V+γwd]`.

The outer-toe moment is affine in depth: `V(x0−xo)+d(γw²/2−H)`. Top and base checks suffice, with a positive normal resultant. Herew≥.6m exceeds the radial springing width.5m; every supported x0 lies inside the pier at the top. The derivative of the factor is `−V(x0−xo)/(Hh²)<0`. Thus increasingh at fixedw and arch reaction decreases the factor, regardless of the added pier weight. The asymptotic conditionw≥sqrt(2H/γ) is a limit, not a necessary width for every finite height. The actual required width solves the quadratic toe equation, evaluated with a stable rationalized root.

The middle-third label now checks both bounds and explicitly invokes the usual linear full-contact normal-stress assumption. Outside that middle third does not alone prove overall collapse. Labels/readouts report the selected reaction's toe condition, not whole-building safety. Sliding/crushing/foundations/wind/three-dimensional vault compatibility are excluded.

## Why maximum H is sufficient in this fixed example

The producer's existing min/max states are symmetric and valid. Independent Cramer-rule enumeration of all triples of the50 physical moment inequalities finds30 feasible vertices withHmax=24.5593958629922kN/m. All physical states haveH>0,V>0. End-joint and crown inequalities bound this polytope; no solver's artificial big-M bound is used in this independent enumeration.

Every feasible reaction hasx0≥−3.25m andV/H≥r, withr=V*/H*=2.10997992292249 at the maximum-H state. The ratio inequality is independently checked at every vertex; more strongly, nonnegative weights `[.3883208307971577,.9671169043488349,.5787960735516772]` on physical rows `[1,34,49]` combine to `(r,−1,0)·(H,V,m0)≤0` with RHS residual≈−2e−13 and coefficient residual≤1.4e−15. That is a numerical dual witness forV−rH≥0.

For all offeredw≥.6>.5 andh>0:

`F = V(x0−xo)/(Hh)+11w²/H ≥ (w−.5)(V/H)/h+11w²/H ≥ (w−.5)r/h+11w²/Hmax = F(maxH)`.

The maximum-H state attains the springing extrados and the ratio bound, so equality is attained. This establishes its worst factor in this fixed model; the original min-H state demonstrates existence if its two mirrored piers satisfy the condition. It does not establish the same property for a different arch. Independently minimizing raw moment need not select maxH for wide short piers, but no false classification follows: the factor inequality is the relevant guarantee. The initial assessment and independent enumeration are preserved at `/tmp/atlas-worker-two/arch-3.9-{assessment,vertices}.{mjs,log}`. Reported numerical residuals are floating-point evidence, not a formal interval certificate.

## Verification

Five math groups pass in `tests/verification-arch-buttress-pier.test.mjs`: independent shoelace mass/centroid integration; independent30-vertex equilibrium/joint check; positive dual/all-vertex worst-factor argument; every cut/full height curve/stable quadratic root/two middle-third bounds and actual height counterexample; strict domains and deep-copy isolation. Log `/tmp/atlas-worker-two/arch-buttress-pier-math.log`.

Focused static1item/0errors/0warnings. Native CLI `node tests/verification-arch-buttress-pier.mjs [light|dark] [1450|430|320]`; isolated output override `ARCH_BUTTRESS_PIER_OUTPUT`. Checks every actual block polygon, full arch/cut/width path, glyph/stroke/text, actual controls/selects, all corners, exact off-grid replay, real keyboard endpoints, unsupported raw saved states and rejection/reset notice. No handles or hidden mutable behavior. Source flagtrue is newly set only on3.9. Final completion/pixel inspection recorded below before commit.

All six native viewport/theme groups pass (1450/430/320 ×light/dark), log `/tmp/atlas-worker-two/arch-buttress-pier-native-final.log`. After final prose-only number-spacing corrections, both fresh320light/dark groups also pass (`arch-buttress-pier-final320-{light,dark}.log`); equations/controls/geometry/state were unchanged. Focused static1/0/0 and all five math groups pass. Personally inspected own320light short/tall geometry panels side by side and wide1450dark tall full page: the failing base is visible outside the pier, both full width curves and asymptotes are retained, the middle-third/toe labels and formulas are readable. Fresh final narrow copy pixels have complete controls, readouts and TeX. No remaining uncertainty is asserted within the fixed conditional model; universal building-safety/height-improvement claims are removed and the generic max-H claim is not made.

## Independent-peer precision follow-up

Peer review of13fafb8 found that unsupported17-digit raw saved dimensions were retained by registered/model state while Chromium serialized the actual range to15 significant digits. Local width/height setters now require the raw finite bounded number to round-trip at15 significant digits before the shared setter is called. Excess raw precision is visibly rejected with complete default rollback, and the public scope states the saved-control domain. The mathematical function remains continuous on its declared domain. Shared runtime is unchanged.

Native assertions now require actual DOM numeric value === registered/model value exactly. The regression restores the valid15-digit pair [.612345678901235,4.12345678901235] and separately rejects each peer counterexample raw17-digit value [.61234567890123456,4.1234567890123456], verifying complete default rollback.

Precision follow-up validation: five unchanged math groups and static1/0/0 pass; all six1450/430/320 light/dark native groups pass the stronger exact DOM/valid15digit/invalid17digit assertions. Logs `/tmp/atlas-worker-two/arch-buttress-pier-precision-{math,static,native}.log`; output pixels `/tmp/atlas-worker-two/arch-buttress-pier-precision/`.
