# Independent review — GEO chapter 5

Status: **accepted**, with the explicitly retained original-source uncertainty on5.9. Source/model bytes are frozen. This report covers only the nine new GEO5 items.

## Source and proof review

Read all statements, proof ideas, scopes, visualizations and pure helpers in `content/geo/ch05.js`, `ch05-b.js` and `ch05.shared.js`. Independently reran the nine chapter math/metadata groups; all pass. Chapter dependencies distinguish supplied shallow-water/compressible identities from earlier narrower fluid results; future shallow-water material is a related link rather than an unfulfilled proof input.

Read actual saved Emanuel MIT12.803 lectures 4 and 5: lecture4 Eqs.4.1–4.8, printed10–13, supplies material circulation and the rotating-frame curl relation; lecture5 Eqs.5.1–5.11, printed15–18, supplies the thermodynamic-surface PV construction and source terms. The authored general circulation formulation explicitly retains baroclinicity; Ertel's statement explicitly requires the vanishing scalar triple product, rather than asserting conservation for every arbitrary passive tracer in baroclinic flow. Its demonstration uses a valid barotropic inertial special case.

Read the actual saved Price wind-circulation text, including its interior Sverdrup limitations and total transport discussion. The final5.6 statement explicitly assumes flat fixed bottom/constant depth to exclude omitted bottom-pressure torque. Read McIntyre's actual §3 pp53–55 and §4 pp57–58: inversion requires boundary data and balance, and the QG reduction is diagnostic. Inspected the actual scanned Plumb pp19 and21: depth-gradient effective beta and the stationary ridge-wave wavenumber agree with the scoped authored derivation. The exact one-dimensional forced ridge convolution is independently derived here, not attributed to an uninspected source equation.

Stommel5.9 correctly retains `verify:true`. The original publisher abstract/metadata supports the limited historical description; original equation pages remain unavailable. No additional source-access attempts or substitute mirror claims were made. The rectangular modern reconstruction has its own complete separated boundary-value derivation and does not purport to reproduce an original figure.

The entire offered affine parameter box avoids material-map collapse, not just the tested samples: for5.2/5.3, `|F−1| ≤ 2 sqrt(.15²+.25²) < .584`, hence `|F| > .416`; nonnegative drag only decreases this integral bound. For5.4, `det F=(1+cτ)(1−a²τ²+b²τ²) ≥ .8×.96=.768`. Thus positive thickness/density and the inverse maps are legitimate throughout the offered domains.

## Independent numerical oracles

External scripts `/tmp/wave5-geo-review-data.mjs` and `/tmp/wave5-geo-review-oracle.py`, with results `/tmp/wave5-geo-review-oracle.log`, compare **7,212 scalar values** independently of the author's tests:

- Integrate the original freely rotating/dragged parcel ODE with SciPy DOP853, including tiny Coriolis and drag rates; compare the material map and velocity, then evaluate independent mass, curl and area/Stokes circulation identities. Maximum map/velocity difference1.56e−15; circulation difference7.11e−15.
- Construct and solve the3D affine matrices with NumPy rather than the chapter inverse helper; compare curl, inverse-transpose tracer gradients and Ertel scalar. Maximum vector difference2.22e−16.
- Integrate the ridge Green kernel with adaptive quadrature, independently of fixed-panel Simpson. Maximum response error9.56e−9 and derivative error1.67e−8 on the tested states. These are empirical comparisons, not certified global bounds.
- Solve the two Stommel boundary equations with80-digit mpmath arithmetic, independently of the stabilized closed-form coefficients. Test both beta signs, zero/tiny beta, all offered aspect extremes and near-wall points; compare streamfunction, first/second derivatives and integrated streamfunction. Maximum second-derivative absolute error1.07e−14; remaining quantities at most2.23e−16.
- Reconstruct the PV polynomial using independent complex Fourier exponentials and differentiated coefficients, including both signs, all deformation-radius extremes and the barotropic limit. Maximum discrepancy4.45e−16.

The examples distinguish actual solutions from algebraic diagnostics, sampled extrema from rigorous bounds, dimensionless normalization from physical units, and residual checks from independent proofs. One valid-state presentation edge was subsequently found:5.7 evaluates `1/abs(B)` for nonzero subnormal beta, yielding an infinite displayed nominal width outside the thin-layer regime. The author fixed the description: for0<|B|<1 it says the nominal width exceeds the basin, taking a reciprocal only for|B|≥1; exact zero retains its symmetric-case explanation. Final reviewer native checks of both signed minimum-subnormal states pass, including physical Create-link replay and finite readouts. No mathematical solution defect was found.

## Final native and visual review

Independently ran the final chapter-local production utility, copied to `/tmp/wave5-geo-review-browser.mjs` with separate artifacts. **36 actual1200/320 light/dark groups pass,760 physical control actions and160 actual URL replay/rejection checks.** Log: `/tmp/wave5-geo-review-browser.log`; images: `/tmp/wave5-geo-review-production`. The reviewer process completed with exit0 and closed its browser.

Checks cover all selectable/toggle modes and their revealed controls, native Home/End and intermediate edits, exact browser-canonical slider/model values, numerical readout agreement, actual Create state link and exact edited snapshot/readout replay, off-grid continuous values, malformed/out-of-range rejection, and both signed minimum-subnormal beta values. Complete statement/proof/caption/scope/readout text and displayed formulas fit the actual viewport. Full dot/ring clearance minimum3.795CSSpx and canvas glyph/halo clearance minimum1.251CSSpx; instrumented arrowheads, paths, contours, circles and rectangles also stay in their plot areas.

Personally inspected all18 final narrow default widgets in both themes (contact sheets `/tmp/wave5-geo-review-contact-{light,dark}-{0,1,2}.png`), including enlarged field arrows, stretching-column default, ridge probe, PV raster/periodic outlines and west/east wall profiles. Inspected actual narrow rich-page captures for4/5/6/9, including the complete hypotheses, units and original-source qualification. Labels, colors and controls are legible and the separate numerical/mathematical scopes remain visible. The final9 math/metadata groups independently rerun clean (`/tmp/wave5-geo-review-math.log`).

The chapter meets the authoring criteria: each item has a distinct question and meaningful interaction, computations implement the declared mathematics, proof ideas supply the relevant cancellations or boundary solve, complete hypotheses and units are visible, source access is honestly described, numerical limits are distinguished from theorem claims, and responsive/theme behavior has independent evidence. The original Stommel equation-page flag remains appropriate; it does not invalidate the independently derived modern reconstruction. No unresolved required fix remains. Both product and author tests remain frozen; only this reviewer report was edited.
