# Wave 3–4 verification checkpoint

**Blocked on the remaining master-plan gates (2026-10-19).** This work starts from cloud commit `8e9e930`, selected by the user on
2026-10-18. The newer local chat's corrections were not transferred and are not counted.
Wave 5 has not started. Browser success is not evidence that a citation or theorem number
has been checked against its source.

## Source-review inventory

The starting checkout had **1,290 source uncertainty flags**, including **367** in the
original analysis collections (`pma`, `rca`, `fa`). The master plan explicitly requested
a missing-flag pass for climate, macroeconomics, circuits and energy chapter 4. That pass
added **31** previously unflagged items to the queue. The first complete source closure,
`ecol-4.6`, leaves **1,320** after that initial batch. Subsequent reviewed batches are
recorded below and in their evidence reports; the generated queue is the authoritative
inventory of flags still present in content.

- [Open source reviews](open-source-reviews.json): IDs, files, names, references and collection totals.
- `node scripts/verification-status.mjs --check`: fails if the inventory differs from content.
- `node scripts/verification-status.mjs --write`: regenerate only after reviewing changes
  and recording evidence. Passing tests alone never clears a source flag.

Six parallel reviewers were authorized by the user: macroeconomics, circuits, solar energy,
climate, geology and probability. Each records primary-source locations and retains flags
where the evidence is incomplete. The root reviewer integrates their reports and checks.

Reviewed source batches have durable evidence ledgers. Each ledger distinguishes source closures from retained gaps:

| Batch | Evidence |
| --- | --- |
| PMA's 22 outstanding source flags | [PMA source review](pma-source-review.md) |
| RCA: all137 initial source flags closed | [RCA source review](rca-source-review.md) |
| Probability's94 source flags closed | [Probability review](prob-source-review.md) |
| Graph's77 source flags closed; native controls complete | [Graph review](graph-source-review.md) |
| Climate chapter 4 and older flagged chapters | [Chapter 4](climate-ch04.md), [older chapters](climate-remaining.md) |
| Circuits chapters 3–4 | [Chapter 3](circ-ch03.md), [chapter 4](circ-ch04.md) |
| Energy chapters 3–4 and aerospace | [Energy 3](energy-ch03.md), [solar](energy-ch04.md), [aerospace](aero-ch04.md) |
| Macroeconomics and game-theory follow-ups | [Macro 4](macro-ch04.md), [macro follow-ups](macro-followup.md), [game sources](game-source-review.md) |
| Geology and stochastic processes | [Geology](geol-source-review.md), [stochastic processes](stoch-source-review.md) |
| Older climate and geophysical-fluid checks | [Climate/geophysical fluids](climate-geo.md) |
| FA: all208 original source flags closed, plus restored canonical sections | [Chapters1–4](fa-ch01-ch04.md), [chapters5–11](fa-source-review.md), [chapters12–13](fa12-13-source-review.md) |
| Learning theory and deep learning | [ML](ml-source-review.md), [deep learning](deep-source-review.md) |
| Electromagnetism, fluid mechanics and waves | [EM](em.md), [fluid](fluid.md), [waves](waves.md) |
| Thermodynamics, chemistry and solids | [Thermo](thermo.md), [physical chemistry](pchem.md), [quantum chemistry](qchem.md), [solid mechanics](solid.md), [crystallography](xtal.md) |
| Quantum mechanics and information | [QM](qm.md), [quantum information](qinfo.md) |
| Statistical and causal inference | [Statistics](stat-source-review.md), [causal inference](causal-source-review.md) |
| Biology and medicine | [Bioinformatics](bioinf-source-review.md), [mathematical biology](mathbio-source-review.md), [physiology](physio-source-review.md), [pharmacology](pharm-source-review.md), [neuro](neuro-source-review.md), [systems biology](sysbio-source-review.md), [population genetics](popgen-source-review.md) |
| Behaviour, psychology, sociology and art | [Behavioural economics](behav-source-review.md), [psychology](psych-source-review.md), [sociology](soc-source-review.md), [art](art-source-review.md) |
| Remaining pure mathematics | [Source review](pure-math-source-review.md), [alignment ledger](pure-math-source-alignment.json) |
| Computing and engineering | [Computing](computing-source-review.md), [owned dispositions](circuits-owned-source-disposition.json) |
| PDE and materials | [PDE](pde-source-review.md), [materials](mat.md), [physics dispositions](physics-source-status.json) |
| Biology follow-ups and kinetics | [Bio dispositions](bio-followup-status.json), [geology/kinetics dispositions](geology-owned-source-ledger.json) |
| Economics, politics and other social sciences | [Owned source dispositions](economics-social-owned-source-ledger.json) |
| Big History chapters3–4 | [Life](bighist-life-source-review.md), [climate/Cambrian](bighist-climate-cambrian.md), [root models](bighist-root-source-review.md), [impact primary papers](bighist-impact-primary-sources.md), [human origins](bighist-human-origins-source-review.md), [admixture](bighist-4-5-source.md), [extinction](bighist-extinction-source-review.md) |
| All eight existing bridges | [Bridge reconciliation](bridge-review.md), [structural target census](structural-gates.json) |


The FA comparison found substantial book-number mismatches. The [alignment ledger](fa-source-alignment.json) and linked chapter reports record canonical restorations and semantic dependency repairs. Original analysis source flags are now resolved; newly restored compact inline flags were separately reconciled against their full-source reviews. All remaining flags now have substantive review dispositions in the unified source-evidence census; reviewed-blocked does not mean source-certified.

## Named follow-ups corrected

**Thrust-line calculation (`tech-4.1`).** The feasibility grid could miss narrow valid
intervals. Joint inequalities now use the architecture chapter's existing LP solver in
force/moment coordinates. The displayed middle thrust line is a convex combination in
those coordinates. The numerical minimum distinguishes intrados radius from mean radius:
about **0.11358** for `t/R_i`, equivalent to **0.10748** for `t/R_mean`. The 192-block
display converges to the radial-joint benchmark rather than comparing incompatible radius
conventions. Regression tests check convergence and every joint of extreme/intermediate
admissible lines. The historical uncertainty flag remains: this numerical correction does
not verify every ancient-invention claim.

Source: Whiting, Ochsendorf & Durand, *Procedural Modeling of Structurally-Sound Masonry
Buildings* (2009), complete author PDF, §3.3 validation, explicitly defines the 0.1075
benchmark using average/centerline radius:
[author PDF](https://cs-people.bu.edu/whiting/resources/pubs/WhitingOchsendorfDurand-09.pdf).

**Spin-down (`geo-4.5`).** The factor-of-two question is resolved by the depth convention.
Greenspan & Howard use two plates separated by `2L` and `T=L/sqrt(nu*Omega)`; the display
uses full depth `H=2L`. It now states that convention explicitly, uses a shared time-scale
function, and draws inflow at both rigid boundaries with an outward interior return. The
previous drawing incorrectly showed top-boundary outflow. The claim that the time always
amounts to a few rotation periods was removed. One rigid boundary has twice the displayed
two-boundary time for the same full depth.

Source: Greenspan & Howard (1963), complete 20-page original, §3, plate separation on
p. 387 and eq. (3.21) on p. 392:
[full paper](https://hannahlab.org/papers/Greenspan_Howard_1963.pdf).

**Plankton coexistence (`ecol-4.6`, source flag closed).** The complete original's Methods
specify initial abundances `0.1+i/100` only for species present at time zero; later arrivals
start at **0.1**. The old code incorrectly used the first formula for later arrivals too.
The original parameter matrices and introduction dates are checked. The logarithmic plot
no longer fabricates pre-introduction populations by raising zero to a plotting floor.
The readout reports finite-run persistence at its stated threshold, not a proof of eternal
coexistence. Step refinement approaches an independent SciPy DOP853 solution of the
original equations (`rtol=1e-11`, `atol=1e-12`) over 20, 50, 100 and 200 days. The full
10,000-day run checks introduction times and finite nonnegative abundances.

Source: Huisman & Weissing, *Nature* 402 (1999), pp. 407–410, eqs. (1)–(3), Fig. 4 and
Methods, complete original:
[full paper](https://www.math.utah.edu/~golden/resources/julie/Huisman_Nature_1999.pdf).

**Limiting similarity (`ecol-4.7`).** A nearly singular overlap matrix is now labelled
numerically unresolved instead of being classified as species loss. Probability-curve
gaps preserve that uncertainty. The displayed fraction uses the selected spacing rather
than the nearest precomputed grid point. Tests check analytic overlap kernels, unresolved
packed Gaussian cases and resolved-equilibrium residuals. The source flag stays open.

**Mathieu equation (`ode-3.18`).** A fixed-size RK4 fundamental-matrix calculation replaces
repeated nested-matrix allocation at every raster pixel. It agrees with the old general
matrix integrator. The damping explanation now includes the required shift
`delta -> delta-c²/4`; damping alone does not just rescale the unshifted equation's
multipliers. Tests check Liouville's determinant and the shifted growth-rate relation.

**Climate-sensitivity transformation (`climate-4.6`).** Stable-branch density, quantiles,
histogram and exceedance probability now consistently condition on `f<1`. Runaway-branch
mass is reported separately; samples beyond the 12 K plotting window retain their mass.
The population mean diverges, while the displayed sample mean is explicitly finite-sample.
The median is computed from the conditional CDF. Narrow Gaussian densities get appropriate
plot bounds. Tests cover normalization on the positive half-line, quantile inversion to
the normal-CDF helper's documented approximation accuracy, tail mass and histogram mass.
The source flag is closed after the full-paper comparison, 16 root mathematical regression
groups, actual slider/button checks in both themes, and inspection of the rendered diagram.

Source: Roe & Baker (2007), *Science* 318, 629–632, complete original, eqs. (1)–(3) and
Figs. 1–2. Conditioning is explicitly this display's convention, not a new empirical claim:
[full paper](https://courses.seas.harvard.edu/climate/pdf/2007/Roe_Baker_2007.pdf).

**Dependencies.** Behavioural-economics syllabus entries 4.1/4.4 now match their written
prerequisites; 4.6 already matched. Graph 4.2.7/4.2.8 explicitly include the plane-graph
definition in both content and syllabus. Imaging 1.7 uses the written Poisson distribution
and rare-event limit instead of depending on the later process chapter. The previously
reported population-genetics `stoch-14.*` dependencies were already absent in this checkout.

## Cross-field prerequisite review

The [integrated ledger check](cross-field-integration.json) confirms all 768 unique additions are present in written chapters and syllabus mirrors, with written endpoints in different registered fields and no graph cycles. Six subject batches checked actual prerequisite roles against the written source and target statements, then received reciprocal peer review. The ledgers retain item-by-item reasons and honest shortfalls; neither collection differences within one field nor contextual `see` links count toward the gate.

| Batch | Addition ledger | Independent review |
| --- | --- | --- |
| Learning and theoretical computing | [Probability](cross-field-probability.json) | [Climate reviewer](cross-field-peer-review-climate.md) |
| Astronomy, climate and biology | [Climate](cross-field-climate.json) | [Probability reviewer](cross-field-peer-review-probability.md) |
| Physics and materials | [Energy](cross-field-energy.json) | [Circuits reviewer](cross-field-peer-review-circuits.md) |
| Computing and engineering | [Circuits](cross-field-circuits.json) | [Energy reviewer](cross-field-peer-review-energy.md) |
| Geology, biology and history | [Geology](cross-field-geology.json) | [Macro reviewer](cross-field-peer-review-macro.md) |
| Economics and humanities | [Macro](cross-field-macro.json) | [Geology reviewer](cross-field-peer-review-geology.md) |

The remaining written-endpoint deficits are ML 21, distributed computing 17, programming languages 8, relativity 14, astronomy 16, neuroscience 19, systems biology 11, behavioural economics 23, demography 24, art 20, architecture 24 and linguistics 20, against the required 25 each. These are unresolved gate shortfalls; no extra chapters or weak links were added to conceal them.

The semantic review also exposed and corrected the [SVD rank claim](nla-rank-followup.md), [concurrence explanation and slider endpoint](qinfo-concurrence-followup.md), and [growth/regression model assumptions](macro-behav-model-followup.md). The [physiology/ecology scope corrections](peer-corrections.md), [Poisson-EM numerical and convergence corrections](imaging-mlem-followup.md), [RCA critical-value legend correction](rca-legend-followup.md), [ALG inverse notation](alg-inverse-followup.md), [LADR DOM-mode presentation](ladr-9-88-mode-followup.md) and [star/grid preset layout](stoch-1-8-mode-followup.md) also passed their focused validation. The final mode sweep additionally exposed [graph direction toggles that discarded edits](algo-graph-modes-followup.md), [an unexplained empty geology quiz graph](geol-1-4-quiz-mode.md), and [invalid bell notation that left a blank stage](music-ringing-blank-mode.md); each source-local correction passed focused native checks in both themes. These corrections do not independently close historical source gaps.

A bounded follow-up used new public primary-source leads and required the complete relevant original before closing a flag. Complete relevant originals resolved additional flags and narrowed the remaining gaps: [pure mathematics](pure-math-source-review.md), [molecular clock and moth sources](retained-source-followup-climate.md), [physics benchmarks](physics-source-acquisition-pass.md), [Starling experiment](geology-bounded-source-followup.md), [computing](computing-bounded-primary-followup.md), and [finance/game/vision](economics-social-acquisition-followup.md). The [limiting-similarity follow-up](ecol-4-7-source-followup.md) separately records the remaining original-figure/equation gaps. The source census is regenerated after these changes; partial subgap closures do not clear an item's remaining flag.

## Verification harness

Screenshot inspection exposed a false pass: missing browser access to the KaTeX CDN caused
plain-text fallbacks while the harness reported no TeX errors. Browser checks now intercept
the existing CDN requests with **local KaTeX 0.16.11**, including its CSS and fonts. The
harness fails if the renderer is absent and records its version. Long statements can put
the diagram outside the viewport, where the runtime correctly pauses drawing; the harness
now waits for fonts, scrolls the diagram into view and settles animation frames before
checking canvases.

The checker also captures uncaught page errors, no longer swallows failed mode clicks,
creates the mode-screenshot directory when needed, checks TeX/canvas failures after mode changes, supports `--report=path`, and offers
`--fail-on-warnings` for schema, TeX, blank-canvas and quality warnings. These improvements
do not convert automated checks into a subjective visual-quality review. An [independently compared throughput benchmark](checker-throughput-benchmark.md) verified20items/47alternate states/67byte-identical screenshots before adopting local pinned assets, stable-asset caching and actual font/frame/CSS-transition readiness for still checks (3.36× faster on that sample). Content, harness and generated data remain uncached; live-animation checks retain their waits. Mode reports checkpoint every25 items and can resume only unchanged passing evidence, including existing screenshot files. Each case captures its collection/helper content hash before and after execution, rejects edits during capture, and stores that hash on the result. Resume and the evidence census accept only matching per-item hashes; source edits made before a later case starts do not invalidate that later case. Theme, viewport and still-state settings must match. Four actual integration checks in [checkpoint integrity](browser-checkpoint-integrity.json) cover in-flight edits, retry, unchanged resume and stale-content rejection.

## Final verification checkpoint

The [final gate report](final-wave-gates.json) reconciles the completed checks with the remaining requirements. Source uncertainty, cross-field deficits and actual human review remain open; wave 5 has not started.

- The strict build passes with **6771 written items, 6890 planned items, 450 chapters and 85 collections**. Static checks have zero errors/warnings; every required visualization and dependency/bridge target exists. The [command record](final-integrated-checks.json) contains actual exit codes and logs, including the expected failing cross-field gate. Passing inventory checks do not pass the underlying unresolved gate.
- The [source census](source-evidence.json) reconciles 15 evidence ledgers: **243 reviewed-blocked flags, zero unreviewed flags and zero integrity issues**. All original analysis flags are resolved. Each retained flag identifies the missing original claim; computational tests do not clear it.
- The [current-input browser census](browser-evidence.json) covers **6688 visualizations in each theme**, with **12499 default-visible alternate states per theme**, real pinned KaTeX, screenshots and zero accepted failures. Whole-collection and runtime fingerprints reject stale captures. The technology supplement additionally guards cross-collection imports across its fresh run; [negative integration cases](external-import-guard-integrity.json) reject missing, changed and unstable guard fixtures.
- The [conditional-control census](conditional-evidence.json) covers **106 discovered items in each theme**, adding **263 conditional states per theme**. All hidden controls in this bounded inventory were reached. Four independent agents inspected all supplied default/conditional screenshots; the [image census](conditional-visual-evidence.json) reconciles actual PNG hashes against their ledgers after corrections. These agent inspections do not count as human reviews. Neither pass enumerates Cartesian products of independent controls or every continuous input; [coverage and limits](conditional-control-coverage.md) records the scope.
- Conditional review found and corrected misleading CAUSAL/KIN labels, the OPT composition rule and chord wording, CPLX shading description, raw LOGIC notation, PCHEM near-zero labels, the MAT initial camera, the PL stock judgment, stale MFD axes, REP table overflow, omitted SIG inverse-error spikes, clipped TECH labels and truncated/clipped XTAL glide orbits. Linked focused reports below retain independent mathematical checks and native control/image evidence. Final captures match the corrected collection inputs.
- [Native audio instrumentation](audio-native.json) passed **100/100 item/theme groups**, including scheduling, non-silent finite output, gesture-only playback and cleanup. Actual subjective listening remains pending. The [retained integration record](supplementary-browser-checks.json) preserves 9 passing UI tests and 272 smoke routes; subsequent source-local repairs have focused native checks and the final captures.
- The final [map measurement](map-performance.json) uses all **13661 nodes and 24142 edges**, stable hashed inputs and five movement scenarios in quiet cloud Chromium at 1280×900, DPR1. Worst draw p95 is **15.1 ms** and frame p95 **16.8 ms**; the measured movement gate passes. Link/small-label detail returns after 160 ms idle, with settled repaint costs recorded separately. This measurement does not certify all hardware or instantaneous full-detail redraws.
- Home JSON is **271035 bytes gzipped**, within the 300000-byte strict-build budget. Dictionary/column transport is lossless; search details load lazily.
- **Twelve of 64 written non-math collections remain below 25 cross-field prerequisites**: ML21, DIST17, PL8, REL14, ASTRO16, NEURO19, SYSBIO11, BEHAV23, DEMO24, ART20, ARCH24, LING20. All 768 reviewed additions pass endpoint, field, syllabus-mirror and acyclicity checks. The gate conservatively uses written endpoints; the broader planned graph still has four deficits. Unused or contextual links were not promoted to prerequisites.
- **Actual human review remains 0/339 pages**. The reproducible [5% sample](human-sample.json) and [served worksheet](human-review.html) match the final sources/build. Run `npm run serve` and open `/docs/verification/human-review.html`; exported findings still require integration into the field guide. Automated worksheet tests use discarded synthetic form data and grant no human credit.

Focused correction evidence: [CAUSAL/KIN/OPT](conditional-circuits-fixes.md), [CPLX/LOGIC/PCHEM](conditional-energy-fixes.md), [MAT/PL](conditional-visual-macro.md), [MFD](mfd-1-1-axis-labels.md), [REP](rep-character-layout-followup.md), [SIG](sig-2-5-recovery-plot.md), [TECH](tech-2-2-wheel-label.md), [XTAL](xtal-glide-followup.md). Original conditional captures are preserved in [the archive manifest](conditional-initial-capture-manifest.json); corrected captures have separate current-input evidence.

## Reproduction

Run `npm install` and configure an installed Chromium (`CHROME_PATH` or the existing browser
finder), then:

```sh
npm run build -- --strict
npm test
npm run test:ui
npm run verify:queue
node scripts/check.mjs --static --quiet --fail-on-warnings
node scripts/check.mjs --quiet --fail-on-warnings --report=/tmp/atlas-light.json
node scripts/check.mjs --dark --quiet --fail-on-warnings --report=/tmp/atlas-dark.json
node scripts/check.mjs --modes --still --jobs=4 --timeout=60000 --report=/tmp/atlas-modes-light.json
node scripts/check.mjs --modes --still --dark --jobs=4 --timeout=60000 --report=/tmp/atlas-modes-dark.json
node scripts/verification-audit.mjs --check
node scripts/verification-source-evidence.mjs --check
node scripts/verification-prerequisite-evidence.mjs --check
node scripts/verification-human-sample.mjs --check
node scripts/verification-human-review-packet.mjs --check
node tests/verification-followup-browser.mjs
node tests/verification-audio.mjs
node scripts/measure-map.mjs
node scripts/smoke.mjs
```

The mode runs can be divided into disjoint collection lists with separate reports and one browser worker each. Supply each matching report with `--resume=path` to retry only missing, failed or stale cases. Reconcile their union with `node scripts/verification-browser-evidence.mjs report1.json report2.json ... --strict`; both themes must cover the current population. The final census combines the original shards with fresh collection corrections and the guarded technology supplement; stale rows are excluded.

The cloud command sandbox requires network-enabled execution for localhost browser servers;
ordinary restricted execution can fail with `listen EPERM` before any test runs.
