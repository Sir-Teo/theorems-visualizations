# Wave6 VCALC6 independent review

Status: independently accepted for local commit. Reviewer is root, independently of author_vcalc. All ten frozen identities pass source/proof, independent numerical, native/state and pixel review. The later combined accepted-export production checkpoint is still required; this chapter report does not claim a completed Wave6.

## Actual inputs read

The reviewer read all ten authored statements, proof ideas, scopes and visualization consumers. Actual written prerequisite bodies were VCALC1.1,1.3,1.9,2.4,3.1,4.6 and PMA10.49 (the last in ch10-b3.js), saved in /tmp/wave6-vcalc-root-prerequisites.json. Curve curvature VCALC1.9 is related context rather than a proof of Gaussian surface curvature; the author synchronized its move to `see` in the chapter and syllabus. The local angle-excess and fine geodesic triangulation facts remain expressly sourced analytic inputs.

Sources actually read by root:

- [MIT18.02 V9 surface integrals](https://ocw.mit.edu/courses/18-02-multivariable-calculus-fall-2007/b99f7b21fccbe519c0839995574b4da8_surface_integrls.pdf): printed1–6/PDF2–7, local /tmp/wave6-vcalc-mit.pdf. Area factors, scalar integrals and oriented flux were checked against the chapter's separate formulas.
- [Morvan DDG07](https://www3.math.tu-berlin.de/geometrie/ps/ddg07/slides/Morvan.pdf): slides20–22/PDF22–24, /tmp/wave6-vcalc-morvan.pdf. Root decoded the embedded text and personally inspected PDF24 pixels. The lantern's finite non-area limit and shrinking geometric distance were checked, without inferring area convergence from mesh diameter.
- [Galloway differential geometry notes](https://www.math.miami.edu/~galloway/IntroDGnotes.pdf): printed147 and149–158/PDF149 and151–160. Root read the triangulation/Euler and local/global Gauss–Bonnet arguments and personally inspected the global-proof page. Compactness, no boundary and the sourced small-geodesic-triangle argument are explicit. A printed explanation saying the radial second derivative vanishes was not copied: only its normality, and hence zero dot product with a tangent, is needed.
- [Knill's Harvard Möbius exhibit](https://people.math.harvard.edu/~knill/teaching/math22a2018/exhibits/moebius/index.html): actual page body and displayed parametrization/normal computation. Root checked the center-circle sign reversal independently; no Stokes theorem for a globally oriented Möbius strip is asserted.
- [Petersen, Classical Differential Geometry](https://www.math.ucla.edu/~petersen/DGnotes.pdf): actual Examples4.2.13/4.2.16/4.4.4 and §4.4 area invariance proof, printed88–89,99–102. These support the sphere-to-cylinder equal-area map and coordinate invariance. A later PDF screenshot request for page106 timed out; no root recovery/retry followed, and no pixel inspection of that page is claimed.

The Caltech Marsden original timed out during research and remained stopped; no same-original body recovery or original-section coverage is claimed. The Archimedes argument is a modern differential proof rather than a claim to have reconstructed his original text.

## Independent numerical oracle

Root's separate seeded exporter /tmp/wave6-vcalc-root-export.mjs and 800-digit mpmath reference /tmp/wave6-vcalc-root-oracle.py passed 6,901 comparisons across871 states. The helper SHA256 f1f0951008381dcb620d9fc0d6468e0913c21751ad9efa0692912ad6f7062083 remained unchanged through final acceptance; later repairs affected display consumers only. Full result: /tmp/wave6-vcalc-root-oracle-second.log.

References independently differentiated the original sphere/torus/helicoid parametrizations (240frames), summed cross products of explicitly constructed lantern triangles (24meshes), integrated the sphere density (15states), computed original-degree flux polynomials (180states), differentiated the fraction-parameter twisted strip (120states), evaluated implicit-ellipsoid and torus curvature/Jacobian formulas (240points), and built indexed quotient meshes to count distinct vertices/edges/faces (18cases). Six48-point curvature integrals were compared with their analytic total using a 4π absolute scale; the other12 refinement values were recorded as diagnostics. Sixteen redistributed-sphere area references were also checked.

Ordinary geometry used3e−12 relative or vector/metric scale, scalar curvature1e−11, and quadrature3e−11; zero/subnormal comparisons separately allowed three minimum binary64 subnormals. In particular the recorded flux maximum relative error1 is from quantities below representable subnormal size, not a uniform relative-accuracy claim. Maximum ordinary component/metric scaled error was below1.3e−15; explicit lantern summation error below9e−15; the tested48-point ellipsoid total error was at most2.57e−10. These are finite tests, not certified quadrature bounds or proofs of the general theorem.

The first oracle failed because the independent reference used the strip's angular derivative while the implementation correctly returned the derivative in fraction-of-turn units. Root corrected its reference by2π and preserved /tmp/wave6-vcalc-root-oracle-first.log; no product repair was made for that reference error.

## Findings and dispositions

1. For original tilt89.99999999999999 degrees, the previous degree-to-radian conversion produced flux1.133107779529596e−15 instead of the high-precision9.921048172113442e−16 (unit half-width/height and uniform unit field). The author now computes the complement in original degrees before conversion, consistently in geometry and integral, while exact±90 remains zero. The independent oracle covers the repair and adjacent signed angles. The visible readout retains the original input through Number.toString; native DOM canonicalization is separately tested.
2. Gauss–Bonnet readout counts used a default24×16 topology while the drawing used30×24. After browser closure the author changed the counts to the actual30×24 quotient mesh and labeled seam/pole identifications. Final native checks independently assert the actual drawn face counts and readouts: torus720/2160/1440; sphere692/2070/1380.
3. Root pixel review found an undrawn blue geometry key in6.6's orange density visualization. After root browser closure the author removed that entry alone. Author and root each reran all four affected layouts; root personally inspected the replacement light/dark pixels. No mathematical helper, UI helper, test or syllabus changed for this repair.
4. The author independently corrected fraction-parameter strip derivatives, interior extrema of the flux graph, and factor placement for tiny constant flux before root's successful oracle. Do not attribute the later reference-unit failure as a new product issue. Its late default-camera improvement makes the flux net visibly two-dimensional and is covered by root's full40 run.

Author native utility failures remain in /tmp/wave6-vcalc-first-failures.txt. Exact DOM string equality means equality with a fresh native range under identical bounds/step/original value; it does not mean equality with String(original). Numeric DOM/model agreement is separately bounded by2e−14 relative, with tiny-value exactness checked. The model and Share retain the original unsnapped input. Another utility failure rejected the mathematically honest word 'undefined' for a chart normal at a sphere-coordinate pole; its invalid-number filter was narrowed, with no model change.

## Final native, pixel and metadata evidence

Root used a fresh production browser/server and the chapter-local author fixture's instrumentation, augmented with independently written consumer assertions for actual parametrized points, finite triangle counts, exact quotient-mesh faces/readouts, pole behavior, direct tiny widths, multiplicity, normal reversal, original-degree flux, underflow disclosures and physical Create-click deltas. Generated data/runtime files were not edited. The final fixture is /tmp/wave6-vcalc-root-native.mjs.

Passing root runs:

- /tmp/wave6-vcalc-root-native-second.log:40 distinct1200/320 light/dark layouts,868 counted UI actions and400 state URL checks, including100 critical layout states and140 actual Create-link replays. This covered source85b4e35a before the sole subsequent6.6 legend removal.
- /tmp/wave6-vcalc-root-native-final-v2.log:8 targeted layouts covering final6.6 and6.9,289 counted actions,116 state URL checks,32 critical layout states,40 actual Create replays,20 unobscured cold rich captures and five actual written prerequisite/related-link navigations. This covers final source205e75b2. The added eight underflow layout cases include a minimum-subnormal speed with area0.36 and an original adjacent90 tilt; each shows the explicit nonzero-input/rounded-zero notice and survives an actual Create-link replay.

Together these two passing runs contain1,157 counted actions,516 state URL checks and180 actual Create-link replays; overlap is intentional for the repaired consumer and added underflow states. Minimum complete marker/ring clearance2.5357142857142847 CSSpx, glyph/halo3.11562442779541, projected path/stroke/head7.035714285714285. Native strings match a fresh identical range exactly; numeric DOM/model agreement is checked separately. Integer fractional/out-of-range and malformed state rejection remain covered. Physical endpoints, modes, singular buttons, toggles and camera drags were exercised. Actual clicked targets were VCALC4.6, PMA10.49, VCALC1.9, VCALC6.6 and VCALC6.7.

Root personally inspected all20 narrow default visualization captures, both final6.6 legend replacements, unobscured long statement/scope captures for6.4/6.8/6.10, critical8192-triangle cubic lantern, minimum-subnormal zone, closed odd-twist seam, signed-curvature torus, original near90 readout and both complete underflow notices. Capture root /tmp/wave6-vcalc-root-native; root-inspect-* files preserve the inspection crops/contact sheets. Ordinary locator screenshots could crop the long6.9 readout; full-page critical captures were used to inspect its complete notice. Cold rich captures explicitly blur focus and scroll to0, avoiding a sticky header being composited over the middle of a full-page image.

Root preserved two fixture defects separately: /tmp/wave6-vcalc-root-native-first.log expected a global Create counter of1 despite retained counters across soft hash navigation; the correction checks a per-click delta. /tmp/wave6-vcalc-root-native-final-targeted.log passed eight layouts and two links, then exposed omitted `see` metadata in the injected index. The fixture now carries actual related metadata, and all five links pass. Both failed processes closed before retry; neither defect required a product change or looser geometry/numerical checks. Failed-run partial totals are excluded from the passing aggregates above.

Final focused tests12/12 and static10/0/0 are in /tmp/wave6-vcalc-root-final-{focused,static}.log. /tmp/wave6-vcalc-root-final-metadata.log proves ten exact frozen identities, synchronized dependencies, unchanged non6/top-level syllabus metadata and a byte-identical helper to the800-digit oracle. Root's final browser/server exited0 and closed before acceptance. The seven author-owned files are frozen in /tmp/wave6-vcalc-peer-accepted-author-freeze-v2.sha256; this independently maintained review report is the eighth accepted file.

AUTHORING§2 rubric: each item passes all six content/interaction/quantity/legibility/correctness/theme criteria. Criterion7 timing remains deferred by the user's explicit renderer-work exclusion; no performance score or millisecond claim is inferred from successful functional renders.

| Item | Load-bearing visual evidence | Criteria1–6 |
| --- | --- | --- |
|6.1|Matching rectangle point and actual coordinate curves on three regular examples|6/6|
|6.2|Computed partials/normal; contrasting chart pole and cone vertex|6/6|
|6.3|Actual tangent parallelograms and independent area refinements|6/6|
|6.4|Explicit finite triangles and distinct refinement regimes|6/6|
|6.5|Same-height sphere/cylinder bands, direct tiny positive area|6/6|
|6.6|Computed density, reversal invariance and double-cover multiplicity|6/6|
|6.7|Attached continuous normal, closed-loop alignment and global sign|6/6|
|6.8|Actual seam geometry and opposite normals after an odd twist|6/6|
|6.9|Visible signed net/field, original-degree flux and honest underflow|6/6|
|6.10|Computed curvature color/integral and actual quotient-mesh topology|6/6|
