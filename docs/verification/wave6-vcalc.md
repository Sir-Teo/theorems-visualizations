# Wave6 VCALC6 author verification

Status: authored and frozen for independent review by root. All ten frozen identities are implemented; no integrated Wave6 completion is claimed. The author browser and fixture server both closed after successful final runs. Source, helper, UI, syllabus and tests remain immutable during root review.

## Scope and actual sources

The chapter preserves the ten frozen num/kind/name identities,6.1–6.10. It supplies actual parametrizations, derivatives, normals, tangent-area sums, explicit lantern triangles, sphere/cylinder zones, scalar integration with multiplicity, normal continuation, signed flux and differentiated curvature. The numerical displays are finite computations, not theorem certificates.

Actual prerequisite bodies read were VCALC1.1,1.3,1.9,2.4,3.1,4.6 and PMA10.49. In particular VC4.6 requires injectivity and a nonzero Jacobian on an appropriate neighborhood, with omitted sets and multiplicity handled honestly. PMA10.49 supplies the oriented two-form flux identity. VC1.9 concerns curve curvature, not Gaussian curvature:6.10 moves it from `deps` to related `see`, in both authored content and the chapter6 syllabus row. Gaussian curvature is defined in6.10; its proof expressly imports the sourced local geodesic angle-excess and sufficiently fine geodesic triangulation results.

Bodies actually consulted:

- [MIT18.02 V9 Surface Integrals](https://ocw.mit.edu/courses/18-02-multivariable-calculus-fall-2007/b99f7b21fccbe519c0839995574b4da8_surface_integrls.pdf), printed1–6/PDF2–7; cache `/tmp/wave6-vcalc-mit.pdf`. Parametric normals, area elements, scalar integrals and oriented flux.
- [Morvan DDG07 Generalized Curvatures](https://www3.math.tu-berlin.de/geometrie/ps/ddg07/slides/Morvan.pdf), slides20–22/PDF22–24; `/tmp/wave6-vcalc-morvan.pdf`. The Schwarz lantern and the critical non-area limit.
- [Galloway differential geometry notes](https://www.math.miami.edu/~galloway/IntroDGnotes.pdf), printed149–158/PDF151–160; `/tmp/wave6-vcalc-galloway.pdf`. Local angle excess, geodesic triangulation and global Gauss–Bonnet. The authored theorem requires a smooth compact connected oriented closed surface, with no boundary. The printed explanation near equation6.12 that the extrinsic radial second derivative vanishes is not copied: normality suffices for its zero dot product with a tangent.
- [Knill's Harvard Möbius exhibit](https://people.math.harvard.edu/~knill/teaching/math22a2018/exhibits/moebius/index.html), actual displayed parametrization and normal computation. The widget computes the strip derivatives and seam normal, rather than assuming the desired cosine.
- [Petersen, Classical Differential Geometry](https://www.math.ucla.edu/~petersen/DGnotes.pdf), actual Examples4.2.13/4.2.16/4.4.4 and area invariance argument, consulted during the earlier DG work and checked again by root. These support the modern differential hat-box argument; no reading of Archimedes' original text is claimed.

The Caltech Marsden author page timed out and was left stopped; neither its original book body nor precise original-section coverage is claimed. Schey's body was not retrieved. Inherited syllabus source labels remain reading references rather than evidence of consulted original bodies. A distinct UPenn modern hat-box source returned403 and was stopped; an oversized Durham response was not used as evidence for unseen text. No same-original denial recovery was attempted.

## Mathematical and numerical checks

`node --test tests/wave6-vcalc.test.mjs`:12/12 groups pass on frozen bytes. `node scripts/check.mjs vcalc/6 --static`:10 items,0 errors,0 warnings. No full suite/build or generated-data write was performed by this author.

Independent constructions check analytic first derivatives against separate differentiation, exact chart poles versus adjacent regular coordinates, redistributed sphere area and real midpoint refinement, explicit triangle cross-product sums against the finite lantern formula, tiny direct zone widths, scalar single/reversed/double covers, sphere/torus normal continuity, strip derivative units and odd/even seam parity, signed flux including interior extrema, and implicit-ellipsoid/torus curvature and Euler counts. Tests include original-degree89.99999999999999 and its negative, exact±90, minimum subnormal zone width and tiny constant speed.

The lantern uses2mn actual triangles. Its refinement rules are declared: balanced m=n, critical m=n², cubic m=n³; the free-band trend holds m fixed and makes no two-direction mesh-limit claim. Area Gauss24/48 changes are diagnostics, not certified error bounds. Hat-box widths are retained directly, even when separately rounded endpoints coincide. Degenerate zero-width zones are empty. Sphere coordinate poles are chart singularities; the cone vertex is a genuine surface singularity.

For flux, one original-degree trig evaluator reduces near±90 using the original complement before converting to radians. Exact±90 gives exact zero. Tiny factors are placed after unit-domain integration so representable final flux is retained. Subnormal underflow is disclosed in the readout; no uniform relative-accuracy claim is made below representable magnitude. The strip's first derivative is with respect to a fraction of a full turn and includes2π.

Gauss–Bonnet uses actual first/second derivatives to compute K and quadrature of KJ; the theorem's analytic angle-excess/triangulation argument is separate. Counts describe the actual drawn30×24 mesh after seam/pole identification: ellipsoid V692/E2070/F1380, torus720/2160/1440.

Root independently reports6,901 high-precision comparisons across871 states on the frozen helper hash below. That is separate reviewer evidence, not this author's test count; its subnormal comparisons allow an absolute three minimum binary64 subnormals. Root's first strip reference omitted the2π fraction-parameter factor and was corrected without a product change.

## Actual native checks and personally inspected pixels

The fixture serves production app/CSS/runtime and injects the new chapter into its in-memory catalog/detail response; generated data stays untouched. Instrumentation wraps drawing calls in the served response only, with no repository runtime change. All10 items were tested at1200 and320 pixels in both themes, with actual controls, all selector modes, revealed controls, singular buttons, signed states, exact seam ends, true integer counts, physical camera drags, edited/off-grid registered state, invalid-state rejection and actual Create state-link replay.

Final full run `/tmp/wave6-vcalc-native-final.log`:40 layout groups,668 actions,200 replays. Minimum complete marker/ring clearance2.5357142857142847 CSSpx; glyph/halo3.11562442779541; projected path/stroke/head7.035714285714285. After the sole later source change (a clearer initial6.9 camera), targeted5/8/9 repeated all four layouts: `/tmp/wave6-vcalc-native-final-targeted.log`,12 groups,220 actions,92 replays; minima ring5.85, glyph3.11562442779541, path10.35 CSSpx. A later bounded6.6 legend-only replacement is recorded below. Thus the current6.9 camera is covered in every layout, while other source bytes retain the complete40-layout coverage. Both processes exited0 and their browsers/servers closed before lane release.

Checks measure complete authored2D and projected3D paths, arrows, ring strokes, canvas glyph ink/halo, rich-text and KaTeX inner bounds, and numeric readout values. Range strings are compared exactly with a fresh native input under identical min/max/step/original assignment, plus numeric DOM/model agreement within2e−14 relative where meaningful. Chromium canonicalizes the adjacent90 input to the visible range string90; registered model and Share retain the original unsnapped number, and the readout uses Number.toString to disclose it. No shadow state or input snapping is used.

Saved captures live in `/tmp/wave6-vcalc-production`: full pages `vcalc-6.N-{theme}-{width}.png`, visualization crops `-viz.png`, every segmented mode `-modeK.png`, sphere/cone singular states, all four closed strip twists, original adjacent/exact signed90 states, tiny zone widths and subnormal flux states. The author personally inspected all20 narrow default visualization captures, all20 wide defaults, all narrow selector-mode captures, closed twists0–3 in both themes, and tiny-zone captures. Contact sheets `/tmp/wave6-vcalc-inspect-{modes,closed,wide,tiny}-*.jpg` record the last inspection batch. Initial narrow default sheets are `/tmp/wave6-vcalc-{first,last}-{light,dark}.png`. Individual refreshed6.9 light narrow camera and dark near-parallel/tiny-speed captures were also inspected.

Capture limitation: narrow6.9 locator crops are288×1150 and terminate partway through the longest readout. DOM whole-readout/text assertions pass, including the explicit subnormal notice, but those crops alone do not show the final notice. Root's independent native fixture takes full-page critical captures and will inspect the complete notice. No source defect is inferred from this crop; the author did not reopen a browser after releasing the lane.

## Preserved failures and repairs

`/tmp/wave6-vcalc-first-failures.txt` preserves the earlier overly strict native string assertion and a generic invalid-number filter that rejected the mathematically correct word undefined at a chart pole. Both were test defects; neither justified snapping model state or inventing a normal. `/tmp/wave6-vcalc-native-rest.log` and `FAIL-lantern-statement-320.png` preserve a real narrow formula overflow: the equivalent finite lantern formula was split into a short area formula and a separately defined slant factor, then all layouts passed. The hat-box component formula was similarly split before final coverage.

Root's near90 original-input accuracy finding was repaired in the shared degree evaluator, with durable literal high-precision regression. Strip derivative units, tiny-factor placement and flux interior-extremum calculations were repaired during author model checks. The root finding that topology counts used defaults24×16 while drawing30×24 was repaired after browser closure and covered by the final40 native run. The6.9 initial camera was adjusted after pixel inspection and its four layouts rerun. After root review found an undrawn blue geometry key in6.6, root closed its browser and authorized removal of that key alone. The bounded replacement `/tmp/wave6-vcalc-native-legend.log` passed4 layouts/60 actions/16 replays; minimum glyph/halo3.1175003051757812 and path14.833333333333314 CSSpx. No marker was drawn in those states (null minimum reflects no samples, not a finite clearance). Both narrow and wide replacement pixels were personally inspected at `/tmp/wave6-vcalc-legend-final.jpg`. This browser/server closed with exit0 before the revised freeze was sent. No helper/UI/test/syllabus change occurred.

## Immutable manifest

SHA256 at author freeze (report excluded from self-hashing):

```
205e75b2b64f331eb90ec0e6b49fe0b98c1f489267ae2591474af26b3ec973b4  content/vcalc/ch06.js
f1f0951008381dcb620d9fc0d6468e0913c21751ad9efa0692912ad6f7062083  content/vcalc/ch06.shared.js
14a9b6c80746630c87fd7eb5170e84cc102e21b9fb759ec847180bdc1aa6efa9  content/vcalc/ch06.ui.shared.js
5d8e182663863612955c293be1d37cc6707ed0f747101ad285d2821a773100b8  content/vcalc/syllabus.js
714c52f97d3081ff481468f70b9488f80f0f09456f3077bb50d236ff4940d03f  tests/wave6-vcalc.test.mjs
e11b4fa5060c0a05253e2504a41b617007669dc5cee7e5aea13e93589dbd7234  tests/wave6-vcalc-browser.mjs
```

The optional ch06-b.js was unnecessary and does not exist. These six immutable files plus this author report comprise seven actual author-owned files; the independent eighth file `docs/verification/wave6-vcalc-review.md` belongs to root and is intentionally not frozen or edited by the author. Root owns acceptance, integration and serial local commit.
