# Wave 5 production

Started 2026-10-21 following the user's direction to proceed with new chapters. The [frozen inventory](../wave-five.md) fixes each collection's chapter for this wave; `npm run wave5:plan` refreshes written counts without advancing completed collections into Wave 6. Previous verification work is not a prerequisite to repeat.

## Accepted chapters

These chapters have source/mathematical review, checked visualizations and collection-sized commits on `codex/wave-five-production`.

| Collection/chapter | New ideas | Commit | Independent review |
| --- | ---: | --- | --- |
| ML 5: bias and complexity | 4 | `7c43ff84` | [review](wave5-ml-review.md) |
| Vector calculus 5: line integrals | 10 | `e47809ba` | [review](wave5-vcalc-review.md) |
| Fluid dynamics 5: aerofoils and lift | 8 | `6e44b485` | [review](wave5-fluid-review.md) |
| ODE 5: flows and stability | 18 | `667a762c` | [review](wave5-ode-review.md) |
| Music 9: harmony and chord geometry | 23 | `da04ab8b` | [review](wave5-music-review.md) |
| PDE 5: harmonic functions | 16 | `953048e1` | [review](wave5-pde-review.md) |
| Statistics 9: bootstrap and resampling | 13 | `f586f9e7` | [review](wave5-stat-review.md) |
| Astronomy 5: radiative transfer | 9 | `641494dd` | [review](wave5-astro-review.md) |
| Representation theory 5: group algebra | 14 | `0f879f70` | [review](wave5-rep-review.md) |

**115 new ideas accepted in nine chapters.** Music 9.11 and 9.22 deliberately retain source uncertainty flags for unread original passages; the modern finite mathematics is independently checked, and the historical scope remains explicit.

## Integration checks

The accepted production snapshot is commit `0f879f70`, exported to `/tmp/atlas-wave5-accepted-xb9n693f`. Its checks are independent of ongoing authoring edits.

- Exact-export regression suite: **1,721/1,721 tests pass**, including all six UI tests; no skipped or cancelled tests. Log `/tmp/atlas-wave5-accepted-tests.log`. The working-tree run also passed 1,737 tests (`/tmp/atlas-wave5-nine-chapter-tests.log`); the export excludes 16 pre-existing uncommitted verification tests, rather than dropping accepted tests.
- Exact-export strict build: **6,799 written + 6,775 planned ideas, 459 chapters, 85 collections; 0 errors and 0 warnings**. Home JSON is **113,052 bytes gzip**. Log `/tmp/atlas-wave5-accepted-build.log`.
- Exact-export full static: **6,736 visualizations, 0 errors and 0 warnings**. Log `/tmp/atlas-wave5-accepted-static.log`.
- Exact-export page sweep: **137 routes, 0 errors**, covering every one of the 115 new ideas, all nine new chapter pages and nine collection pages, and home/map/status/about. Routes `/tmp/atlas-wave5-accepted-smoke-routes.json`, log `/tmp/atlas-wave5-accepted-smoke.log`.
- Native control matrix for the nine accepted chapters: **460 distinct item/theme/width cases**, covering light/dark and 1200/320px, with **2,256 real control actions**. Root independently ran the first seven chapters; the astronomy reviewer reran all 36 final astronomy cases, and representation has an author 56-case run plus independent source/math/layout/counterexample checks. Logs and inspected captures are recorded in each review. Final layout refreshes cover ML 5.2b, vcalc 5.4 and PDE 5.9/5.11/5.13; repeated cases are not extra coverage. Root captures live under `/tmp/atlas-wave5-native/`, and final peer astronomy captures under `/tmp/atlas-wave5-astro-reviewed/`.

Chapter-specific checks add independent exact arithmetic, quadrature, ODE solutions, matrix solves, simulation laws, input/state checks and actual audio-buffer checks. Their reports distinguish finite illustrations and numerical error estimates from theorem proofs or measured scientific data.

## Work continuing

The next six author/review pairs are assigned:

| Chapter | Author | Independent reviewer |
| --- | --- | --- |
| Ecology 5 | `author_vcalc` | `review_smallworld` |
| Epidemiology 5 | `author_ml` | `author_fluid` |
| Macroeconomics 5 | `author_fluid` | `author_ml` |
| Chemical kinetics 5 | `review_smallworld` | `author_vcalc` |
| Numerical analysis 5 | `wave5_reviewer` | `review_music` |
| Art 5 | `review_music` | `wave5_reviewer` |

Authors finish their own source/math/browser/visual checks, then review their partner's chapter. Review documents are `docs/verification/wave5-<collection>-review.md`; request content fixes through the author to avoid simultaneous edits. Keep accepted bytes frozen and report readiness to root. Root integrates accepted collection-sized changes, refreshes source/dependency/build/static/native/page checks, and continues through the same frozen inventory. The goal remains unfinished.
