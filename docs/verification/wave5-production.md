# Wave 5 production

Started 2026-10-21 following the user's direction to proceed with new chapters. The [frozen inventory](../wave-five.md) fixes each collection's chapter for this wave; `npm run wave5:plan` refreshes written counts without advancing completed collections into Wave 6. Previous verification work is not a prerequisite to repeat.

## Accepted chapters

These chapters have source/mathematical review, checked visualizations and collection-sized commits on `codex/wave-five-production`, subsequently transplanted onto published `6cf3d576` in `codex/wave5-current-base`.

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
| Macroeconomics 5: money and inflation | 10 | `7159c893` | [review](wave5-macro-review.md) |
| Epidemiology 5: study designs | 10 | `6612769b` | [review](wave5-epi-review.md) |
| Numerical analysis 5: splines and differentiation | 10 | `110cfdbc` | [review](wave5-num-review.md) |
| Chemical kinetics 5: solution and electrode reactions | 11 | `7ea6ece3`, `8613ac03` | [review](wave5-kin-review.md) |
| Art 5: perceptual colour spaces | 9 | `09d7f36f` | [review](wave5-art-review.md) |
| Ecology 5: predation, disease and mutualism | 12 | `1ec8d0e9` | [review](wave5-ecol-review.md) |

**177 new ideas accepted in fifteen chapters.** Music 9.11 and 9.22 deliberately retain source uncertainty flags for unread original passages; the modern finite mathematics is independently checked, and the historical scope remains explicit. Art 5.4 retains its disclosed secondary MacAdam numerical-table flag; the original experimental conditions and qualitative conclusion were checked directly.

## Earlier-baseline integration checks

The accepted production snapshot is commit `8613ac03`, exported to `/tmp/atlas-wave5-fifteen-foxuinyf`. Its checks exclude ongoing unrelated drafts.

- Exact-export regression suite: **1,792/1,792 tests pass**, including all six UI tests, with no skips or cancellations. Log `/tmp/atlas-wave5-fifteen-accepted-tests.log`. A working-tree run passed **1,808/1,808 tests** (`/tmp/atlas-wave5-fifteen-working-tests.log`); the export excludes 16 pre-existing uncommitted verification tests. All accepted chapter tests remain included.
- Exact-export strict build: **6,861 written + 6,713 planned ideas, 465 chapters, 85 collections; 0 errors and 0 warnings**. Home JSON is **113,186 bytes gzip**. Log `/tmp/atlas-wave5-fifteen-accepted-build.log`.
- Exact-export full static: **6,798 visualizations, 0 errors and 0 warnings**. Log `/tmp/atlas-wave5-fifteen-accepted-static.log`.
- Exact-export page sweep: **211 routes, 0 errors**, covering every one of the 177 new ideas, all fifteen new chapter pages and fifteen collection pages, and home/map/status/about. Routes `/tmp/atlas-wave5-fifteen-accepted-smoke-routes.json`, log `/tmp/atlas-wave5-fifteen-accepted-smoke.log`.
- Native control matrix: **708 distinct item/theme/width cases**, covering light/dark and 1200/320px, with **3,684 real control actions**. Root independently ran the full matrix for thirteen chapters; the astronomy reviewer ran all 36 final astronomy cases, and representation has an author 56-case run plus independent source/math/layout/counterexample checks. Root captures live under `/tmp/atlas-wave5-native/`; final peer astronomy captures under `/tmp/atlas-wave5-astro-reviewed/`.
- Final repaired-item reruns are additional evidence, not extra unique coverage: ML 5.2b, vector calculus 5.4, PDE 5.9/5.11/5.13; epidemiology 20 affected groups/144 actions; ecology 28 groups/120 actions plus the final 5.1/5.7 eight groups/32 actions. Kinetics 5.3/5.5/5.6 passes a separately instrumented **12-group/24-state** full-stroke gate, independently rerun by its peer and root, with minimum 0.5833 CSSpx clearance. Ecology's corresponding final gate has minimum 1.6413 CSSpx clearance. Mathematical routines were unchanged by these padding repairs.

Chapter-specific checks add independent exact arithmetic, quadrature, ODE solutions, matrix solves, simulation laws, input/state checks and actual audio-buffer checks. Their reports distinguish finite illustrations and numerical error estimates from theorem proofs or measured scientific data. The art reviewer independently compared all 2,734 RIT rows, 34 Sharma pairs and 89 CIE cone rows; the epidemiology reviewer read the original historical tables and checked independent likelihood and sampling oracles.

The earlier nine-chapter snapshot `0f879f70` passed 1,721 tests and 137 routes with no errors; logs remain under `/tmp/atlas-wave5-accepted-*`. The present snapshot adds six accepted chapters and their tests.

## Current published-baseline integration

The original authoring branch preceded 848 completed follow-up commits already published in `6cf3d576`. Those completed source, dependency and runtime corrections are retained. The fifteen chapter commits and the kinetics padding fix were cleanly transplanted onto that published baseline in the isolated managed worktree `/Users/teodev/.codex/worktrees/wave-five-shipping/theorems-visualizations`; original checkouts/drafts remain untouched. The earlier test counts above are historical evidence for the stated export, not a current-baseline regression claim.

Current-baseline integrated strict/static, configured Node22 full suite and changed-page checks are pending. No old source review, deferred map timing or private renderer investigation is being reopened. Preserve the five current-main flags/access restrictions and three explicit uncertainties introduced in the new chapters.

## Work continuing

**854 new ideas remain in 65 Wave 5 collection chapters.** All fifteen accepted chapters have finished their author/reviewer checks. The current small pipeline assigns ALG8 to `author_ml`, TOP5 to `review_smallworld` and independent review of both to `wave5_reviewer`; at most three subagents work concurrently. Continue breadth-first from the remaining entries in the [frozen inventory](../wave-five.md), retaining its original chapter assignments. Follow MASTER_PLAN §7.2: source-led authoring, actual computations, both-theme native/visual checks, independent review, dependency reconciliation and collection-sized commits. Historical verification tasks are not prerequisites to repeat.

After the full frozen wave passes its end-of-wave gates, prepare the next breadth-first wave under the master plan. The continuous production goal remains unfinished. This local checkpoint is accepted development work; collection PRs and CI publication remain to be shipped under MASTER_PLAN §7.2.
