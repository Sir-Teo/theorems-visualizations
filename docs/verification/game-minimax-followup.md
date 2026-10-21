# Game 3.4 / 3.6 — LP normalization and Robinson's original update rules

Status: **resolved: game-3.4 and game-3.6**. Independent parent source, proof, mathematical, native-browser and image checks passed; source flags and central queue are reconciled in the integration commit. Scope includes their two syllabus rows, isolated `content/game/minimax-audit.js`, explicit model/native tests and a default-glob model-test entry point. No other item, shared solver,
runtime, generated data, central ledger or frozen map experiment is edited.

## Actual sources read

* Bernhard von Stengel, [Zero-Sum Games and Linear Programming Duality,
  arXiv v6, 22 October 2023](https://arxiv.org/abs/2205.11196v6), published in
  *Mathematics of Operations Research* 49(2), 2024, pp.1091–1108,
  [DOI](https://doi.org/10.1287/moor.2022.0149). The actual PDF's complete §2,
  pp.4–7, was read: primal/dual statements, mixed payoff conventions,
  the general game LPs, shift invariance in (10), and the strictly positive
  reduction (11)–(12). Formula images on PDF pp.6–7 were also inspected.
  The paper uses `x` for columns and `y` for rows; the item consistently uses
  `x` for rows and `y` for columns. The introduction and §3 were read for
  context; no full-paper reading or historical-priority audit is claimed.
  Local `/tmp/atlas-game-sources/von-stengel-2023.pdf`, SHA256
  `7a346c1e5c3987c02e58ae0151b105cc79f4900665352777c1f967be65c53539`.
* Julia Robinson, [An Iterative Method of Solving a Game](https://ranger.uta.edu/~weems/NOTES6319/PAPERSONE/robinson.pdf),
  *Annals of Mathematics* 54(2), September 1951, pp.296–301,
  [JSTOR/DOI identity](https://www.jstor.org/stable/1969530). All six original
  article pages were actually read, including Definition 1, its alternate
  timing on p.297, the theorem, eligibility definition, and the complete
  Lemmas 1–4/block-induction proof. The university mirror's extraction omits
  most middle pages, so **each printed page 296–301 was rendered and visually
  read**, rather than relying on metadata or the incomplete extraction.
  Local `/tmp/atlas-game-sources/robinson-1951.pdf`, SHA256
  `076d927a459af3b119f4d94e39cf137d8c8ce482587afef51c08614dda69c92a`.

Robinson credits Brown's procedure and cites RAND P-78, April 1949. Brown's
original was not obtained/read; the item therefore credits his proposal
without inventing a 1951 origin date. Robinson's final display on p.301 appears
to print `min V(t)` where the stated theorem, preceding estimates and proof
require `min U(t)`. The authored item follows the coherent theorem and proof;
this typographical observation is not an alternate convergence theorem.

The broad 1947–1951 list of LP/minimax inventors and unverified MSZ section
references were removed from these two items. The mathematical source above
supports the actual reduction; historical priority and the converse
minimax-to-general-LP theorem are outside this scoped claim. Unread rate
attributions and changing open-problem claims were removed from 3.6.

## Statement, proof and actual prerequisites

For 3.4, `s > −min A` is essential, not merely nonnegativity of the shifted
matrix. The proof supplies primal feasibility with a positive vector,
compactness/finite positive maximum, dual feasibility, and strong duality's
finite attained equal objective. The dual feasible region is unbounded;
the former blanket “both ... bounded” is corrected. Dividing the optimizers
by their common positive sum produces probability vectors and opposite
security inequalities at `1/alpha − s`. This proves minimax without using
minimax as its own prerequisite. The actual bodies of game-3.1 (matrix/security
conventions), game-2.1 (independent mixed payoffs) and algo-11.19 (weak/strong
LP duality and attainment) were read. They replace the circular game-3.3
dependency; game-3.3 is now a related-result link. No prerequisite item was edited.

For 3.6, the actual game-3.3 body supplies the finite zero-sum minimax bracket
and optimal strategies. With zero initial counts, both simultaneous decisions
in round t use the opponent's first t−1 actions; alternating column decisions
instead use the first t row actions, including the new row. Zero scores handle
t=1 without undefined time-zero frequencies. The source permits arbitrary
tie choices; the illustration explicitly chooses the first index.
The proof outline describes eligibility, all-eligible score-spread estimates,
deletion of never-eligible actions, and the block induction, then uses
compactness/continuity to pass from the security-gap theorem to optimal-set
convergence. Neither convergence to one chosen optimum, action convergence,
monotone bounds nor a rate is asserted.

## Authored numerical models and repaired visual behavior

3.4 retains the shared dense simplex solver, but an independent certificate
checks its returned primal/dual constraints, nonnegativity, normalization,
objective difference, value consistency and normalized security gap. Constraint
and probability tolerance is 1e−8; objective tolerance is that times the larger
of 1 and the two objective magnitudes; payoff tolerance is that times the
larger of 1 and max absolute original payoff. The UI displays actual residuals
and tolerances; the old unconditional check mark is removed. This is a
floating-point certificate of the offered examples, not a proof of exact
duality or a certified exact-arithmetic LP solver.

The seeded integer matrices have entries −5 through 5. A native seed control
offers every integer 1–128, allowing saved controls to reproduce the matrix;
the resample button wraps 128→1 and synchronizes the random-matrix selection.
Actual matrix entries are shown. Both handles are constrained to the simplex.
At coincident security levels, concentric blue/orange/green markers and
separate label rows retain all three meanings. The payoff stage has enough
height at 320px for label halos to stay apart.

3.6 implements both original timings with separate selected modes. Its four
fixed 3×3 matrices are RPS, the skew-symmetric example, a saddle example and a
fixed mixed example (formerly called “random” despite never resampling).
Both empirical paths retain every point through selected t. Both faint
4000-round bounds and their bright selected prefixes retain every point;
the former downsampling could omit the final endpoint. Log-axis margins
contain t=1 and t=4000 markers, and the payoff range is derived from the entire
record, including local excursions. Rings mark one LP-certified optimal pair;
the misleading distance to that arbitrary pair and `sqrt(t) × gap` rate cue
are removed. The readout states the actual row/column actions and opponent
prefix lengths. All models are deterministic and contain no empirical data.

A direct nonmonotonicity witness is simultaneous RPS: from rounds 3 to 4 the
lower bound decreases from −1/3 to −1/2 while the upper increases from 1/3
to 1/2. Both changes are genuine, retained, and visible. Finite plotted runs
illustrate the sourced theorem; their finite gaps do not prove convergence.

## Executed evidence

`node --test tests/verification-game-minimax-model.mjs` passes **6 groups**;
log `/tmp/atlas-game-minimax-math.log`.

1. Independent vertex enumeration by determinant/Cramer's rule checks game
   values against the production tableau for all 128 offered random seeds,
   all four fictitious-play presets, constant/zero/degenerate/saddle examples,
   and rectangular one-row/one-column games. Every returned LP certificate
   passes. Over the 128 seeds, maximum constraint and normalization residuals
   are 4.45e−16, objective difference 2.23e−16 and security gap 1.78e−15.
2. Deliberately invalid shift, primal/dual feasibility, normalization, value,
   dimensions and nonfinite outputs are rejected by the certificate.
3. Independent positive affine payoff changes check shifted values and
   unchanged optimal mixtures, including a legitimate negative shift.
4. Every decision, count, empirical mixture and security bound through round
   4000 is independently reconstructed from action prefixes for all four
   presets and both timings. Independent LP vertex values lie within every
   security bracket. First-round timing differences and one-action/tied games
   are checked explicitly.
5. Both lower-drop and upper-rise witnesses are required; full-record bounds
   and first/final endpoint margins are checked throughout every run.
6. Malformed matrices, nonfinite values, invalid horizons and unknown timings
   are rejected.

`node tests/verification-game-minimax.mjs` passes **8 final native groups**:
both items at viewport widths 1440 and 320 in light/dark themes, using the
local assets and `findBrowser()` headless Chromium. Log
`/tmp/atlas-game-minimax-native.log`; final session 21618 exited 0 and its
browser/server were closed. No timing or broader-device claim is made.

For LP, each group operates both matrix choices, actual Home/End seed inputs,
128→1 resampling with the matching selected matrix, certified snapping, and
actual pointer drags to each simplex vertex and outside its boundary. It
checks the displayed security levels against the independently regenerated
matrix, all certificates, and saved native seed/selection/handle replay.
Every coincident security label has a measured nonintersecting text halo.

For fictitious play, each group operates all four games and both timings at
actual rounds 1, 63 and 4000 (including native Home/End). All 4000 faint bound
points, every selected bound prefix and both empirical paths are compared
point-for-point with the model, including the last offered endpoint. Actual
action prefixes are independently tested in the mathematical suite. Saved
game/timing/round controls replay the same readout and plotted geometry.
Complete path strokes, rings/handles, measured text/halos, display math and
page bounds pass in every checked state; no exceptions or TeX errors remain.

Initial native inspection exposed a long two-inequality display at 320px;
it is now split into aligned lines. Screenshot review then exposed crowding
of coincident payoff labels, which the taller payoff panel, separate rows
and concentric markers repair. The final full native run includes these
repairs and an explicit text-halo separation assertion. A subsequent prose
clarification says “Adding s” instead of “The positive shift,” since a
negative s can also produce the required strictly positive matrix; this does
not change the rendered models or formulas.

Regenerated screenshots actually inspected include the desktop LP default
light page and snapped dark page; desktop RPS light and fixed-game final dark
pages; narrow LP snap pages/panels in both themes; narrow outside-handle dark
simplex; narrow fictitious RPS dark and alternating round63 light pages; and
the narrow round4000 dark payoff panel. Formula lines, full simplex markers,
coincident payoff labels and both ends of the log-time plot are readable.
These are `/tmp/atlas-game-{lp-default,lp-snap,lp-handles,fp-default,fp-alternating-63,fp-final}-{1440,320}-{light,dark}.png`,
with corresponding `-panel0/1/2.png` crops produced by the test.

`node scripts/check.mjs game-3.4 game-3.6 --static` reports 2 items,
0 errors, 0 warnings. Syntax and trailing-whitespace checks pass on all seven
handoff paths. Both source flags are still true.

The test scripts are explicit-only `.mjs` files; default test wiring is left
for parent integration. No full build or generated-data regeneration was run.


## Independent parent acceptance

Root visually read all six actual Robinson1951 printed296–301 pages, including both Definition1 update timings, the theorem, eligibility and all four lemmas/block induction. The final p301 display indeed prints minV where the theorem and preceding proof require minU; the public statement follows the coherent result. Root read vonStengel's complete actual§2 pp4–7 and viewed the6–7 formula images. Root independently derived strict-positive feasibility/compact primal attainment, duality normalization, the security bracket and optimal-set limit-point implication; no rate or monotone-bound claim is retained. Actual written game3.1/2.1/3.3 and algo11.19 statements/proofs were read and the dependency uses are genuine.

Root read the complete new helper and both full mathematical/native scripts. Reruns pass **6 independent mathematical groups**, **8 native item/viewport/theme groups**, and static **2items,0errors,0warnings**. Logs `/tmp/atlas-root-game-minimax-{math,native,static}.log`; native97374/static21959 exited0 and closed. The default-glob entry point `tests/verification-game-minimax-model.test.mjs` imports the same passing six-group suite; its explicit rerun passes (`/tmp/atlas-root-game-minimax-default.log`). No production/shared solver change is made.

Root inspected the final desktop light LP page and native-size320px dark coincident security panel, outside-handle simplex, full320px alternating round63 page and dark round4000 bound panel. All three coincident levels have distinct visible rings/labels; all4000 full bound points and selected empirical endpoints remain within the plotted frame. The complete native checks include saved control/handle replay and actual constrained pointer drags.

Read-only guards confirm chapter objects outside3.4/3.6 byte-identical. The3.6-only old local fictitious helper is removed because its sole call is replaced by the isolated implementation; HEAD has exactly its declaration and that call, with no other user. An initial prefix guard correctly detected this removal before being narrowed to permit that exclusive old block. The3.4 header changes only by its new import. Only the two corresponding syllabus rows are staged; any later game-tree drafts remain separate. Queue credit is two original source flags.
