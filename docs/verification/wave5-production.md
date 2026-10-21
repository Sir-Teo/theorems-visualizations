# Wave 5 production

Started 2026-10-21 following the user's direction to proceed with new chapters. The [frozen inventory](../wave-five.md) fixes each collection's chapter for this wave; `npm run wave5:plan` refreshes written counts without advancing completed collections into Wave 6. Previous verification work is not a prerequisite to repeat.

## Accepted chapters

These chapters have source/mathematical review, checked visualizations and collection-sized commits on `codex/wave5-current-base`. The first fifteen were authored on `codex/wave-five-production` and transplanted onto published `6cf3d576`; subsequent chapters were authored directly on the current baseline.

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
| Algebra 8: coding theory | 28 | `e225c566` | [review](wave5-alg-review.md) |
| Topology 5: countability and separation | 15 | `f0e8751c` | [review](wave5-top-review.md) |
| Differential geometry 5: the first fundamental form | 10 | `a0e669f7` | [review](wave5-dg-review.md) |
| Manifolds 5: Lie groups | 11 | `8473af2b` | [review](wave5-mfd-review.md) |
| Stochastic processes 5: coupling and mixing | 12 | `270d2154` | [review](wave5-stoch-review.md) |

**253 new ideas accepted in twenty chapters.** Music 9.11 and 9.22 deliberately retain source uncertainty flags for unread original passages; the modern finite mathematics is independently checked, and the historical scope remains explicit. Art 5.4 retains its disclosed secondary MacAdam numerical-table flag; the original experimental conditions and qualitative conclusion were checked directly.

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

The exact current-baseline export `e6506283` at `/tmp/atlas-wave5-current-q_5q9vcg` passes **2,391/2,391 tests on Node22.23.3**, **211 routes with0errors**, strict build **6,861 written/6,713 planned/465chapters/85collections,0errors/warnings**, and static **6,798visualizations,0errors/warnings**. Home JSON is **112,873bytes gzip**. Logs: `/tmp/atlas-wave5-current-{tests,smoke,build,static}.log`. Production `assets/` bytes are identical across the older and current baselines; the prior native matrix remains applicable to the unchanged new-chapter source and renderer. No old source review, deferred map timing or private renderer investigation is being reopened. Preserve the five current-main flags/access restrictions and three explicit uncertainties introduced in the new chapters.

## Work continuing

**778 new ideas remain in 60 Wave 5 collection chapters.** All twenty accepted chapters have finished their author/reviewer checks. The current small pipeline assigns NLA5 to `author_fluid`, PROB6 to `review_music` and independent review of both to `wave5_reviewer`; at most three subagents work concurrently. Continue breadth-first from the remaining entries in the [frozen inventory](../wave-five.md), retaining its original chapter assignments. Follow MASTER_PLAN §7.2: source-led authoring, actual computations, both-theme native/visual checks, independent review, dependency reconciliation and collection-sized commits. Historical verification tasks are not prerequisites to repeat.

After the full frozen wave passes its end-of-wave gates, prepare the next breadth-first wave under the master plan. The continuous production goal remains unfinished. Collection PRs are now open as drafts, isolated onto published main; per-PR CI is in progress. The one-line inherited CI YAML repair is tracked separately in [PR16](https://github.com/Sir-Teo/theorems-visualizations/pull/16), and included identically in each collection branch so checks can start. No PR is claimed merged. Local YAML parsing reproduces the old line24/column83 error and passes after replacing the invalid conditional with the declared `npm test` command.

## Collection PRs

| Collection | Pull request | Head |
| --- | --- | --- |
| ml | [#1](https://github.com/Sir-Teo/theorems-visualizations/pull/1) | `e742bfdf` |
| vcalc | [#2](https://github.com/Sir-Teo/theorems-visualizations/pull/2) | `f0e66767` |
| fluid | [#3](https://github.com/Sir-Teo/theorems-visualizations/pull/3) | `b0893206` |
| ode | [#4](https://github.com/Sir-Teo/theorems-visualizations/pull/4) | `a6e3eef1` |
| music | [#5](https://github.com/Sir-Teo/theorems-visualizations/pull/5) | `57235f23` |
| pde | [#6](https://github.com/Sir-Teo/theorems-visualizations/pull/6) | `8fe4c1a4` |
| stat | [#7](https://github.com/Sir-Teo/theorems-visualizations/pull/7) | `93defb71` |
| astro | [#8](https://github.com/Sir-Teo/theorems-visualizations/pull/8) | `df98203e` |
| rep | [#9](https://github.com/Sir-Teo/theorems-visualizations/pull/9) | `ee1ed328` |
| macro | [#10](https://github.com/Sir-Teo/theorems-visualizations/pull/10) | `e29c44b8` |
| epi | [#11](https://github.com/Sir-Teo/theorems-visualizations/pull/11) | `e1d7548c` |
| num | [#12](https://github.com/Sir-Teo/theorems-visualizations/pull/12) | `0684d834` |
| kin | [#13](https://github.com/Sir-Teo/theorems-visualizations/pull/13) | `b7984fa1` |
| art | [#14](https://github.com/Sir-Teo/theorems-visualizations/pull/14) | `3a4e0e05` |
| ecol | [#15](https://github.com/Sir-Teo/theorems-visualizations/pull/15) | `e335d64d` |

## Seventeen-chapter checkpoint

Exact accepted-content snapshot `f0e8751c`, exported to `/var/folders/29/bzg0zx0d7jjbyf60_3cjch440000gn/T/atlas-wave5-seventeen-wzh75e8d`, passes **2,417/2,417 tests on Node22.23.3**, with no failures, skips or cancellations. Strict build: **6,904 written +6,670 planned,467 chapters,85 collections,0 errors/warnings**. Static: **6,841 visualizations,0 errors/warnings**. Home JSON: **113,088 bytes gzip**. Logs: `/tmp/atlas-wave5-seventeen-{tests,build,static}.log`. The targeted sweep passes **52 routes with0errors**, covering all43 new items, their chapters/collections, home/map/status/about and the stability bridge; log `/tmp/atlas-wave5-seventeen-smoke.log`. This checkpoint includes the accepted LaSalle bridge follow-up; production assets remain unchanged.

The ALG8 and TOP5 reports record actual source review, independent model oracles, both-theme 1200/320px native actions, complete production text/marker checks and edited/raw/malformed replay. No new uncertainty flags were needed. All fifteen original collection PRs and CI repair PR16 pass current-head CI and are ready for review. Fluid PR3 passed run39591121792 after replacing a stale fixed inventory count with exact inventory invariants. No PR is merged.

ALG chapter shipping PR: [#17](https://github.com/Sir-Teo/theorems-visualizations/pull/17), isolated head `487d1a09`. Standalone strict build and chapter/planner tests pass; current-head CI run39592153137 passes and the PR is ready for review.

TOP chapter shipping PR: [#18](https://github.com/Sir-Teo/theorems-visualizations/pull/18), isolated head `e0b73de4`. Standalone strict build and chapter/planner tests pass; current-head CI run39592155518 passes and the PR is ready for review.

## Nineteen-chapter checkpoint

Exact accepted-content snapshot `8473af2b`, exported to `/tmp/atlas-wave5-nineteen-68qx4npf`, passes **2,443/2,443 tests on Node22.23.3**, no skips/cancellations. Strict build: **6,925 written +6,649 planned,469 chapters,85 collections,0 errors/warnings**. Static: **6,862 visualizations,0 errors/warnings**. Home JSON: **113,103 bytes gzip**. Logs: `/tmp/atlas-wave5-nineteen-{tests,build,static}.log`. The source-aligned coordinator gate checks all21 new generated statements/scope/source records against authored modules and passes **42 actual320px light/dark production cases,42 physical edits and real Share URL replays** with complete rich-text and formula bounds; log `/tmp/atlas-wave5-nineteen-production.log`. An initial utility incorrectly required an optional scope on every item; the corrected gate requires it exactly when authored. That failed utility assertion is retained separately. The targeted sweep passes **30 routes with0errors**, covering all21 new ideas, both chapters/collections, home/map/status/about and the stability bridge; log `/tmp/atlas-wave5-nineteen-smoke.log`.

DG shipping [PR19](https://github.com/Sir-Teo/theorems-visualizations/pull/19), isolated head `5ced81f8`, passes standalone strict build and12 chapter/planner tests. MFD shipping [PR21](https://github.com/Sir-Teo/theorems-visualizations/pull/21), isolated head `cd06548c`, passes standalone strict build and16 tests. Both are independently accepted; their CI is in progress. The guarded home update is [PR20](https://github.com/Sir-Teo/theorems-visualizations/pull/20), isolated head `32f09d77`. Earlier collection PRs1–15,17–18 and CI repair16 pass current-head CI and are ready for review. No PR is merged. Root aggregate push CI `39592740677` passed source `a63b51e5`; the nineteen-chapter local checkpoint above is newer.

## Twentieth chapter: coupling and mixing

Accepted STOCH5 source `270d2154`, exported to `/tmp/atlas-wave5-twenty-o1glhfh6`, passes strict build **6,937 written/6,637 planned/470 chapters/85 collections,0 errors/warnings**; home **113,105 bytes gzip**. Its scoped static check covers12 visualizations,0 errors/warnings; all12 chapter math groups pass. Source-aligned coordinator production passes **24 actual320px light/dark cases,24 physical edits and real Share replays**, complete generated metadata/text/formula bounds,0pageerrors. Its **16 targeted routes pass with0errors**. Logs: `/tmp/atlas-wave5-twenty-{build,static,tests,production,smoke}.log`. The prior whole-suite checkpoint remains2,443 tests at the nineteen-chapter snapshot; that suite was not repeated for this isolated chapter. The next meaningful integrated batch will include it. DG PR19 now passes current-head CI39594738630 and is ready for review.

STOCH shipping [PR22](https://github.com/Sir-Teo/theorems-visualizations/pull/22), isolated head `a8286c65`, passes standalone strict build and13 chapter/planner tests; CI is starting. The four independently accepted connective steps are included in root source `bc00c804`; that exact export has143 bridge steps through140 written ideas, strict build0errors/warnings,113,794-byte gzip home JSON and six mobile bridge/theme cases with eight native links passing. PROB6 and NLA5 authoring/review continue.
