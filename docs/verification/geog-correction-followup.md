# Geography bounded correctness successor

After prerequisite `7bcb87d3efad2734933920d067dda3af050f0b55` and equivalent-wrap `295e92fbdf1c57868ce23399656c7d72e8f9ce6d`, correct two inherited assertions and one raw syllabus omission. This is a separate correctness boundary; no new prerequisite quota credit.

1.7 retains positive oblate/spherical semi-axes a≥b. Its statement now restricts endpoint-only equality of geocentric, reduced and geodetic latitude to a>b and explicitly states equality everywhere on a=b. The existing proof already supplies the sphere limit. At beta=pi/4 and a=b all three angles equal pi/4, so the old unqualified statement was false.

3.5 now states that an unsigned-angle-preserving nonsingular derivative is a positive scalar times an orthogonal map; orientation preservation restricts that orthogonal factor to a rotation. This matches its existing appended SVD argument and statement conventions. Reflection diag(1,-1) has equal singular values and preserves angles despite determinant -1, so the old rotation-only assertion was too narrow.

1.8 already lists geog-1.7 in the item. Its complete proof explicitly uses geocentric latitude psi in the spherical-harmonic formula and cites 1.7; that target defines and derives the latitude conversion. Backfill the raw syllabus list to exactly ['geog-1.6','geog-1.7']. This repairs an existing same-field omission, without changing the item dependency decision or claiming a new crossfield link.

Explicit preservation/math test `tests/verification-geog-correction.mjs` checks all 48 full objects including executable functions and flags, every module/helper byte outside the two exact replacements, and only the one authorized full-row replacement. 3,748 independent checks cover sphere/oblate latitude relations and reflection angle preservation. Strict build and GEOG static check both have zero errors/warnings.

Fresh viewport320 native light/dark run: four cases/eight screenshots, with exact strict-built statement JSON provenance, no page/TeX/mount/blank errors. Both corrected fields fit; unchanged companion fields are also captured. All eight pictures personally inspected in `/tmp/atlas-new-imaging-source/geog-correction-contact.png`; raw `/tmp/atlas-new-imaging-source/geog-correction-native/{native.json,*.png}`. The contact-sheet tool warned about its unavailable font but produced the inspected raster, with raw screenshots unaffected. Browsers/server closed. Source flags, functions, dependencies, numerical helpers, scopes, other text and all other syllabus rows are unchanged. No source closure.
