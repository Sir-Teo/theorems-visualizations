# Hotspot tracks: original evidence and actual drilling coordinates

Ready for integration: **geol-3.9**, flag retained until accepted. Scoped `hotspot-audit.shared.js`; other plate items/shared helpers preserved.

## Primary evidence actually read

Read the complete six-page original Tarduno et al.2003, *The Emperor Seamounts: Southward Motion of the Hawaiian Hotspot Plume in Earth's Mantle*, Science301:1064–1069, DOI10.1126/science.1086442, from the [University-of-Hawaii academic original PDF](https://ftp.soest.hawaii.edu/engels/Stanley/Textbook_update/Science_301/Tarduno-03.pdf). `/tmp/atlas-geol-sources/tarduno2003.pdf`,7PDFpages with provider cover; SHA256 `d2f581764ee3507961ead078182be1f2fca84f02c043003732b1b0116bb44215`. Read all scientific paragraphs, methods discussion, interpretation, limitations, figures/captions and references through the end before the unrelated RNA paper on1069. Rendered p1067/Fig3 inspected `/tmp/atlas-geol-sources/tarduno-paleolatitude-1067.png`.

Original p1065 gives Koko1206 age49.15±0.21Ma and Nintoku1205 age55.59±0.25Ma; p1066 gives Detroit1203 age75.82±0.62Ma. These sample means are not conflated with the failed plateau ages from1204, the older81Ma884 sample or a precise eruption age of an entire seamount. Original paleomagnetic progression/secondary-remanence/secular-variation discussion and competing Detroit averaging models are retained as source evidence, not a new atlas reanalysis. The paper does not require a direction change in plate motion to explain the bend. Supporting tables/data were not acquired; no independent raw-Ar/paleomagnetic reanalysis is claimed.

Read all scientific text of [Morgan1971 original letter transcription](https://www.mantleplumes.org/Morgan1971.html), Nature230:42–43, including fixed-source/absolute-frame proposal, full argument, caption and references. Cache `/tmp/atlas-geol-sources/morgan1971.html` SHA256 `60ca192454c2b143b205e11a5f26d43f76ba58cac0dfe5eddc98167706d4098d`. This supports the historical hypothesis, not all of its proposed plate-driving or mantle-chemistry claims. Wilson1963 original and Sharp–Clague2006 full paper not acquired/read; their unsupported priority/date/accepted-bend anecdotes removed rather than silently certified.

Read complete coordinate header records from official original ODP197 coring tables (remaining drilling rows acquired but not reused):

| Hole | Latitude N | Longitude E | Official original table | Cached HTML SHA256 |
|---|---|---|---|---|
|1206A|34°55.5485′|172°8.7536′|[chapter6 TableT1](https://www.iodp.tamu.edu/publications/197_IR/chap_06/c6_t1.htm)|`05ad149f5ebd30dafb040419393e188e612d53aea75b0720356c490a1833eafe`|
|1205A|41°19.9986′|170°22.6992′|[chapter5 TableT1](https://www.iodp.tamu.edu/publications/197_IR/chap_05/c5_t1.htm)|`2b25b07a87807d27c97a9e61e59a8fda0b2379f2397d3d984bf1dd4d660814c0`|
|1203A|50°56.9976′|167°44.3969′|[chapter3 TableT1](https://www.iodp.tamu.edu/publications/197_IR/chap_03/c3_t1.htm)|`e46c847000cc1da7f7a0e3d493fba9d72c4bbb7cc987053902872c0f0c02cfee`|

Caches `/tmp/atlas-geol-sources/odp120{3,5,6}.html`. This supplies original drill locations, not remembered centres or a complete chain; the present−155.3°/19.4° anchor remains explicitly chosen.

## Corrections and calculations

Replaced six memory-rounded seamount centres/ages, including unsupported±3Myr/±0.5° uncertainty, with these three source-matched drill holes and original quoted age errors. The plot uses central ages/equal spatial weights and does not claim an uncertainty-propagated likelihood. Removed universal70–90mm/yr/accepted47Ma assertions and the implied ability to infer a unique change of plate direction from the bend alone.

The two-stage geometry is explicit: an older volcano experiences the older rotation first and younger rotation second. Past source latitude increases northward, so its chronological drift toward the present is southward. Parameters are reference-point initial speeds, not a guarantee of constant speed at every site or with changing source latitude. Units use1mm/yr=1km/Myr.

The old unbounded Nelder–Mead followed by unrelated slider clipping could report neither the optimized point nor a minimum in the displayed domain. New bounded coordinate pattern search evaluates only offered values, accepts strict improvements and reports finite evaluations/actual returned RMS. No global optimum or unique geological reconstruction is asserted; no hidden startup optimization runs.

The old right-side “observations” used **model** cumulative distances at observed ages, obscuring spatial disagreement, and called age-versus-distance slope speed. New gold dots use actual great-circle distances of source locations from the chosen anchor; the model curve uses its own radial distances. Radial distance differs from circular arc length except in special geometries, so its slope is not called the speed. All points and full model curve set padded bounds.

`node --test tests/verification-geol-hotspot.test.mjs`: **5groups pass**. Exact three original age/coordinate fixtures; independent quaternion stage composition and continuity at all128corners; reference-speed unit conversion and closed circular radial-distance identity; bounded nonincreasing actual-RMS search at all boundary/drift corners; independent full radial point values and equal-weight residual calculation.

`node tests/verification-geol-hotspot.mjs`: **2native light/dark groups pass**, all128actual seven-slider corners plus4improve-fit scenarios per theme; actual returned parameters/RMS, independent observed distances and full quantitative path/dot bounds. `/tmp/atlas-geol-hotspot-native.log`. Representative fixed/drifting screenshots inspected; standard light/dark checks clean. No Wave5 gate closure.
