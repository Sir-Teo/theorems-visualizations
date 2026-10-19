# Azimuthal source review: four entries ready for integration

Ready IDs: `geog-5.1`, `geog-5.2`, `geog-5.3`, `geog-5.4`, all in `content/geog/ch05.js`. Flags intentionally remain true until root integrates report/checks/queue. Dependencies and unrelated items preserved.

Primary full technical source: John P. Snyder, *Map Projections—A Working Manual*, USGS Professional Paper1395 (1987), [official publication](https://pubs.usgs.gov/publication/pp1395), [official complete PDF mirror](https://d9-wret.s3.us-west-2.amazonaws.com/assets/palladium/production/s3fs-public/atoms/files/Map%20projections%20-%20A%20working%20manual.pdf). Complete397-page PDF cached `/tmp/atlas-geog-snyder.pdf`, SHA256 `8c4a1f30dd9202816f2717ea97e5fb6d412263f0ee6c40ed6ce8a55918cff078`; extracted text same basename.txt. PDF page = printed page+12. Read the relevant complete spherical features/formulas and limitations, rather than only historical summaries:

- §22, printed164–167/PDF176–179: gnomonic central perspective; great-circle plane argument; sphere-only hemisphere limit; formulas22-1–22-5 and radial/cross scales22-2/22-3.
- §21, printed154–159/PDF166–171: stereographic antipodal perspective, conformality, circle graticule, excluded antipode, sphere formulas21-1–21-4. Circle theorem additionally verified algebraically by substituting the inverse projection into the plane defining a spherical circle.
- §20, printed145–149/PDF157–161: orthographic parallel perspective, visible hemisphere, coordinates20-3/20-4, radial/cross scales20-1a/20-1b. Limb has finite circumference; its *radial differential scale*, not the limb itself, vanishes.
- §25, printed191–197/PDF203–209: distances/bearings only from centre, antipode singularity, formulas25-1/25-2 and radial scale1.
- UN emblem: [United Nations’ own current description](https://www.un.org/en/about-us/un-emblem-and-flag) confirms north-polar equidistant geometry and60°Sextent. No claim about competing1945 design histories retained.

Corrections:

1. Removed unexamined ancient-inventor/priority claims; credits now identify the modern technical source. Gnomonic rhumb-line deviations are unavailable when the route leaves the actual70°display cap, instead of treating null as zero. Coincident endpoint denominator guarded. Numerical sampling remains an illustration alongside the exact plane proof.
2. Stereographic previously called *every circle enclosing* the antipode a straight line (`cA+rho>=179.5`). Corrected exact equation: if centre components are(Cx,Cy,Cz), the image obeys `(Cz+cosρ)(x²+y²)−4Cx x−4Cy y+4(cosρ−Cz)=0`. Only zero quadratic coefficient gives a line. Nonzero coefficient yields circle centre `2(Cx,Cy)/(Cz+cosρ)` and radius `2sinρ/|Cz+cosρ|`, including enclosing cases. The numerical line tolerance1e−10 is declared. No unstable huge-circle fit is used as proof of a line. Predicted boundaries are clipped to the actual110°display cap; angular range is correctly folded when the circle encloses the antipode. A circle centred at the map centre is explicitly an exception to centre displacement. Scale markers beyond150°are omitted, not clamped to a false coordinate.
3. Orthographic clipped highlighted arcs now divide by their actual angular length; at the centre the displayed5°arc was formerly divided by10°. Removed false universal “thinnest azimuthal” claim and clarified parallel projection and limb degeneracy.
4. Equidistant antipode is a limiting boundary, not a bijective image with a unique bearing. Pole preset is exactly90°. A true cross-scale above60 is omitted rather than drawn at a fake/clipped ordinate; exact centre limit is1.

Validation:

- `node --test tests/verification-geog-source-audit-azimuthal.test.mjs`:6 independent groups, including circle-plane/inverse-projection checks over72parameter triples and many points, through/enclosing/concentric cases, finite-difference radial/transverse scales, numerical arc integration, great-circle plane lines and equidistant radii.
- `node tests/verification-geog-source-audit-azimuthal.mjs`:8native item/theme groups. Both themes: all4route presets/toggle plus airport drag; through-antipode button followed by radius100°enclosing case and3°endpoint; orthographic point drag to centre/limb with actual clipped length; all6equidistant centre presets plus Qdrag. Runtime/TeX errors and nonfinite diagnostic geometry/readouts checked. Deliberately clipped map paths are not falsely required to lie inside rectangular stage bounds.
- Inspected screenshots `/tmp/atlas-geog-azimuthal-enclosing-antipode-is-circle-light.png` and `/tmp/atlas-geog-azimuthal-orthographic-clipped-arc-dark.png`; final post-clipping capture rerun. All four routes captured per theme with names in the test.

These are spherical models; no ellipsoidal navigation guarantees or subjective/audio checks claimed.
