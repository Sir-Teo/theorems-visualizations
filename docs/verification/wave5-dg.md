# DG5 — The first fundamental form

Author freeze: 2026-10-21. All ten frozen chapter items are implemented in `content/dg/ch05.js` and `ch05-b.js`, with pure computations in `ch05.shared.js`. Independent reviewer: `wave5_reviewer`; **accepted** in `docs/verification/wave5-dg-review.md`. The reviewer independently passed 16 production groups, 172 native actions and 76 replay gates, inspected all 20 narrow defaults, and verified 1,500 independent metric-model states. No generated catalog, runtime, central ledger, or Git changes were made by this author.

## Sources actually consulted

- Peter Petersen, *Classical Differential Geometry*, UCLA author notes, §§4.3–4.4 (printed pp.92–107), especially area/Gram identity, coordinate transformation, first-form criteria, Mercator and Archimedes examples; Appendix B.7 for terminology/examples. https://www.math.ucla.edu/~petersen/DGnotes.pdf
- Neil Donaldson, UCI Math162A, *Surfaces*, §3.2, Definition3.15 and Theorem3.20: first form and measuring a surface curve. https://webapps.math.uci.edu/~ndonalds/math162a/surfaces.html
- Pavel Tumarkin, Durham Differential GeometryIII, *Solutions9*, Exercise9.1 and9.2(a): explicit associate family, cancellation of mixed terms, inverse stereographic coefficients. The displayed conjugate helicoid has the opposite sign from these notes, and the source label says so. https://www.maths.dur.ac.uk/users/pavel.tumarkin/past/spring17/DG/DG9-sols.pdf
- Paternain–Salo–Uhlmann, *Geometric inverse problems, with emphasis on two dimensions*, author book copy, Theorem3.4.8 and its proof, printed pp.69–72; Lemma3.4.13 pp.72–73 supplies a harmonic function with nonzero differential via local elliptic regularity. This verifies the actual harmonic-conjugate outline used in5.10. https://sites.math.washington.edu/~gunther/publications/GIP2D_driver%20(14).pdf
- Tristan Rivière, PCMI2013 notes written by Nora Loose, §2.5 and Theorems2.9/2.13, corroborate local isothermal existence through the Chern-frame/Beltrami approach. This is a supplementary proof, not the route claimed in the item. https://people.math.ethz.ch/~triviere/pdf/books/Lectures_ParkCity.pdf
- Stanford CS468 Lecture19, p.4: local scalar metric form and the distinction from global uniformization. https://graphics.stanford.edu/courses/cs468-13-spring/assets/lecture19_part1.pdf
- Daniel Daners's Sydney author page/abstract confirms the Mercator/stereographic conformal projection discussion. The linked preprint failed retrieval; no claim depends on an unseen passage. https://smtp.maths.usyd.edu.au/u/daners/publ/abstracts/mercator/

The original Salo course PDF and JYU repository alternate timed out/were inaccessible; they are not the final5.10 evidence or item link. doCarmo/Pressley section labels are retained from the curated syllabus as reading references; direct verification here uses the actual retrieved author/course sources above. Formulas and examples were independently recomputed and the prose is original.

## Scope and numerical honesty

| Item | Model, check, and limits |
|---|---|
|5.1|Sheared quadratic graph; analytic partials, Gram determinant and independently evaluated cross-product norm. The tangent ellipse is a differential image in an orthonormal tangent frame, explicitly not a finite image on the curved surface.|
|5.2|Saddle curve; Simpson256 metric length and512 refinement change versus actual 8–64-segment spatial chord sum. Metric angle is checked against spatial dot products. A refinement change is an estimate, never a certified error bound.|
|5.3|Injective graph patch over a compact rectangle; tensor Simpson32/64 integral versus actual finite planar triangles. The focused ratio plot recomputes all four mesh levels. Injectivity and multiplicity caveat are explicit.|
|5.4|Smooth flat limit of rolled strip, with exact orthonormal partials. Displayed width2.4 is below every offered positive-curvature period. Surface side lengths are integrated, and the changing spatial chord is identified separately. Global periodic extension is only a local isometry.|
|5.5|Catenoid/conjugate-helicoid associate immersion; exact common metric versus finite differences of the displayed map, h=1e−5. Common Simpson512 curve length versus128-chord sums. Only sufficiently small embedded neighborhoods are claimed isometric; full catenoid/helicoid topology is distinguished.|
|5.6|Uniform scaling/rotation versus reciprocal axis scaling; actual vector angles and matrix coefficients. Exact conformal classification uses the offered map and scale==1, never a numerical tolerance. Thus a saved scale1+EPSILON is correctly nonconformal despite rounded coefficients.|
|5.7|Inverse stereographic map on sphere minus north pole; analytic partials and spatial tangent angles, exact length/area factors. A finite planar window is displayed; no finite north-pole image is invented.|
|5.8|Unit-sphere Mercator on a chosen meridian branch, poles excluded. Actual constant-bearing route, spatial finite-difference bearing and differential Tissot circles. The route remains within the longitude branch; circles are explicitly infinitesimal images with common display enlargement, not finite spherical disks or an ellipsoidal Earth map.|
|5.9|Height–longitude region strictly away from poles and shorter than a turn; exact common area compared separately with actual sphere and cylinder facets. Finite meshes need not agree. Polar zone endpoints in the theorem are limiting cases.|
|5.10|General theorem assumes smooth positive-definite metric, locally oriented in the proof; elliptic solvability is identified as analytic input. The widget solves only an explicit paraboloid annular-sector radial formula using55 bisections, and checks inverse/finite-difference residuals. It does not claim a general PDE solver or that arbitrary pointwise frame whitening integrates to coordinates.|

Two dependency corrections, synchronized in full raw lists with the syllabus:5.4 and5.10 now include `pma-9.24`, the actual inverse function theorem step used in their ideas. The chapter5.10 syllabus picture now describes the explicit example honestly rather than suggesting a universal numerical solver. All other frozen inventories/kinds/dependencies are preserved.

## Focused verification

- `node --test tests/wave5-dg-math.test.mjs`: **11/11 groups pass**. Independent central differences reconstruct spatial partials and curve speeds; tests check graph determinants/positivity, chord/mesh refinement, the smooth rolling limit, the full associate family, angle preservation/failure, stereo inverse/scale, Mercator bearing and inverse, the exact cylinder polygon-area deficit, and the monotone isothermal inverse. Complete author/syllabus dependency lists are compared, not filtered subsets.
- `node scripts/check.mjs dg/5 --static`: **10 items,0 errors,0 warnings**.
- `node tests/wave5-dg-browser.mjs`: **40 actual production-layout groups** (10items×light/dark×1200/320), **624 physical slider/segmented-choice/camera-drag actions**, **172 replay gates**. All offered segmented options and their visible slider endpoints are exercised; no inert/revealed control inventory is hidden by a test fixture. Continuous slider instances use `step:'any'`; native numeric DOM values are checked directly against registered model values.
- The native test invokes the actual Share button and reopens its generated URL after edited controls/cameras, comparing exact saved parts and live readout. Off-grid continuous raw saves retain their exact values. Extra5.6 saves at1,1+EPSILON,1+1e−14 verify exact conformality classification and successful restore. Out-of-range raw slider saves and malformed encoded URLs notify while leaving a usable default visualization.
- Production markup, CSS, runtime, codec, module loading, and Share UI are unmodified. Because root owns generated data, this author probe injects only the new chapter's catalog/detail records and removal of their planned ghosts **in memory through browser routes**, using the same fields as the builder. It does not claim to be a whole-tree strict build; root performs integration/build gates independently.
- At each checked state, fonts are ready and the visible visualization receives a fresh frame. Full native dot radii plus actual rings are measured against the real2D clip or3D canvas: minimum clearance **5.3092032196 CSSpx**. Actual canvas text glyph boxes plus stroke halos have minimum clearance **3.1175003052 CSSpx**. Statement, idea, caption, scope and readout text ranges are checked against inner content padding; displayed math and its inner KaTeX widths are checked separately. No runtime/TeX/overflow/nonfinite readout failure remains.

Native inspection fixed two narrow statement displays (5.2/5.3), improved the5.3 convergence plot's vertical range, and corrected the5.10 low-radius gold-marker stroke clearance. Independent review found the5.6 tolerance-based classification issue; its exact predicate and raw-next-float regressions are now in place.

## Captures inspected

All40 default production layouts were captured and author-inspected, with all20 narrow light/dark visualizations inspected directly or in contact sheets. All30 narrow mode captures were also inspected, alongside desktop defaults. The complete rich fields and both theme layouts are included in the full-page captures; the mathematical/display text bounds above are actual production measurements.

- Full pages: `/tmp/wave5-dg-production/dg-5.N-{light,dark}-{1200,320}.png`.
- Fresh visualization crops: same stem plus `-viz.png`.
- Every offered segmented mode: same stem plus `-modeK.png` (items5.2/5.3/5.6/5.9/5.10).
- Author contact sheets: `/tmp/dg5-{light,dark}-{first,last}.png`, `/tmp/dg5-wide-{first,last}.png`, `/tmp/dg5-modes-{light,dark}.png`.

The diagrams are dimensionless mathematical examples. Camera foreshortening does not preserve displayed planar angles; all angle claims use the actual tangent-vector inner products, not screen angles. Finite polygons/meshes and finite-difference residuals remain explicitly labeled approximations.
