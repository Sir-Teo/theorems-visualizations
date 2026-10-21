# Game 3.11 — the 1928 minimax paper and an analytic 2×2 illustration

Resolved: **game-3.11**. Independent source, mathematical, native-input and screenshot checks passed; the source flag and central queue are reconciled. Scope is only3.11, its syllabus row, one isolated helper, the model/default-wrapper/native tests and this report. Accepted neighboring items, shared solvers/runtime and the frozen map experiment remain unchanged.

## Actual primary source read

John von Neumann, **Zur Theorie der Gesellschaftsspiele**, Mathematische
Annalen 100 (1928), pp.295–320, DOI10.1007/BF01448847. The actual26-page
German original scan is hosted by the University of Leipzig:
[original PDF](https://home.uni-leipzig.de/socialcooperationresearch/wp-content/uploads/2020/05/Neumann_Zur_Theorie_der_Gesellschaftsspiele_Mathematische_Annalen_1928_Vol_100__1_295-320.pdf).
This is a university mirror, not an assertion of an author/publisher download.

Local `/tmp/atlas-game-neumann-sources/neumann-1928.pdf`, SHA256
`9c783313bbb6659800d8f0fd93551b889fa810aa20a715a69411256692199de5`.
Read the opening formulation and §I contingent-plan/normal-form reduction,
§II's finite two-player security levels and independent mixing, and the
**complete §III proof, pp.307–311, including footnote10**. All five §III
pages were rendered and visually read, as were pp.303–306 and their formulas
for the examples, product expected payoff, optimal-strategy sets and value.
The OCR misreads some small numerals and inequality signs; the displayed
original formulas were used to resolve them.

Read the relevant §IV opening/coalition discussion and §V higher-player
discussion to establish the paper's actual scope. The retained historical
claim is only that these sections exist and concern coalitions; no audit of
all their coalition formulas or all26 pages is claimed.

The complete §III argument establishes condition(K), preserves continuity
and the level-set properties under partial optimization, interchanges one
maximum and minimum using interval best-reply sets with semicontinuous
endpoints, and then reorders the operators. This replaces the former
secondary-source hedge. The paper explicitly has §IV for three players and
§V for more than three, so saying that it left every case beyond two players
to later work was false. Unsupported broad priority claims and unread claims
about subsequent Ville/1944 proofs were removed. Its two-player theorem is
kept separate from its coalition discussion.

Actual prerequisite statement/idea bodies read: game-3.2's pure saddle and
security-level definitions, and game-2.1's independent probability vectors
and product expected payoff. Adding game-2.1 is genuinely used. The paper
continues to introduce game-3.3 and does not depend on that introduced item.
No cross-field prerequisite or unrelated syllabus row was changed.

## Claims and modern model

The public statement requires finite nonempty action sets, real payoffs,
two players, zero sum and expected payoff under independent randomization.
It distinguishes knowledge of probabilities from observation of the sampled
action before the opponent chooses. Pure security levels **can** differ;
pure saddles, including the existing saddle preset, can already close that
gap. The two-player equality and existence of optimal mixtures are retained.

The authored chart is a modern2×2 illustration with integer entries−9…9,
not a numerical reconstruction of the original proof. The four existing
presets and their keys are retained; a fifth constant-game preset exposes
nonuniqueness. These other constructed examples are not attributed to the
original paper. The Matching Pennies matrix also agrees with the paper's
first2×2 example on p.303.

For `A=[[a,b],[c,d]]`, the two row-reply lines are
`c+(a−c)p` and `d+(b−d)p`; the two column-reply lines are
`b+(a−b)q` and `d+(c−d)q`. Their in-domain intersections and endpoints give
complete piecewise-linear envelopes. An affine segment attains an extremum
at an endpoint, or is flat. Thus evaluating these candidates obtains the
extrema and the complete closed optimal probability intervals, including
pure, parallel, constant and tied cases. Rings show one representative
point; thicker segments show nontrivial optimal intervals.

The former2001-point grid could miss an interior optimum and nevertheless
print that its unequal extrema “agree.” For `[[1,−1],[−1,0]]`, both optimal
probabilities are1/3 and the value is−1/3; the old grid produces a positive
gap exceeding0.0004. The new curves include the actual line intersection.
The displayed extrema/sets are explicitly decimal approximations, and the
floating-point difference is reported against a stated tolerance. No
artificial `+1e−16` floor remains; constant games report a genuine zero.

The helper is bounded to the actual integer edit domain. Its tolerance is
used to identify equal candidate optima, not to manufacture an equality.
Candidate denominators are bounded by36 for this domain, so distinct exact
candidate values are separated by at least1/1296, far above the tolerance
(at most about2.85e−13). The independently checked rational reference below
does not use that tolerance to determine the value or optimal sets.

## Controls, complete pictures and saved state

Every matrix cell remains selectable and editable. Both probability handles
are projected onto their actual envelope values. Separate probability sliders
also reach each control when handles coincide. The adapter preserves the
base preset, all four edited entries and selected cell; the runtime's
registered sliders/handles preserve both probabilities. A strict string
preset key,2×2 integer matrix and bounded cell are validated before mutation.

Horizontal plot margins contain endpoint rings and the handle hover halos.
The vertical range reserves two payoff units beyond the largest entry so
the same halos fit at the±9 limits. Matrix borders, data curves, finite
optimal-interval segments and glyphs are tested as complete shapes. The
horizontal value guide is intentionally an infinite reference line clipped
to the plot by the existing runtime; its offscreen mathematical endpoints
are not treated as a finite-data clipping defect. Axis captions are short
enough for320px, legends wrap, and the theorem formula uses two aligned rows.

## Executed evidence

`node --test tests/verification-game-neumann-model.mjs`: **4 groups pass**;
log `/tmp/atlas-game-neumann-math.log`.

1. Every19^4=130,321 allowed matrix is compared with a separate exact-BigInt
   rational support/indifference reference. Exact rational security
   inequalities independently give the complete optimal intervals.
   Values, optimal sets, all pure saddles, endpoint/intersection geometry
   and interpolated full curves agree.
2. All five presets and explicit constant, duplicate-row/column, boundary
   and degenerate cases pass, including both complete `[0,1]` optimal sets
   and exact zero floating differences for constant games.
3. The one-third example demonstrates the old grid defect and verifies the
   analytic value/probabilities without an epsilon floor.
4. Malformed/noninteger/nonfinite/out-of-range matrix inputs are rejected.

The initial native script passed four1440/320px light/dark groups, including
all five presets, all four cells and all19 integer edit values, probability
endpoints/coincidence, both actual handle drags, exact replay and malformed
state defaults. Its log is `/tmp/atlas-game-neumann-native-initial.log`.
A final strengthened run adds explicit rectangle/finite-line stroke bounds,
native Home/End checks for all three sliders and hovered-handle containment
at the all9 matrix. **All four final groups pass**, log
`/tmp/atlas-game-neumann-native-final.log`. The final process exited0 and
closed its browser and server. Native captures await local fonts and
explicitly repaint before comparison; they are not a cold-font bootstrap
experiment.

The final run checks all1,520 preset/cell/edit-value cases and180 probability
endpoint/midpoint pairs across the four viewport/theme configurations. Both
actual pointer drags are exercised in each configuration. Edited one-third
and constant9 games are each replayed, comparing their complete serialized
state, readout and rendered data/text exactly. Out-of-range entries, a
coerced array preset key and an out-of-range cell are rejected, with the
default matrix and all three default slider values checked afterward.
It also checks transformed canvas text bounds (including rotated labels),
minimum10px canvas fonts, complete data strokes/markers/hover halos, TeX
errors and glyph bounds, display-math overflow, page overflow and runtime
errors. The intentionally clipped infinite value guide is distinguished
from finite data geometry.

Agent inspection included the complete narrow light one-third page, wide
dark one-third page, wide light constant-game curve, narrow dark matrix,
and narrow dark maximum-payoff hover-halo plot. All plotted endpoints,
probability handles, payoff/action labels, controls, wrapped legends,
aligned theorem formula and readout math remain legible. Screenshots are
`/tmp/atlas-game-neumann-{default,edited,flat,thirds,max-halo}-{1440,320}-{light,dark}.png`,
with full-resolution stage crops ending in `-panel0.png`/`-panel1.png`.

Static/syntax/whitespace results and final path/source hashes are recorded
in `/tmp/atlas-game-neumann-manifest.json` at handoff. The source-review flag is cleared following the independent integration below.

## Independent integration

Root read the complete public item, isolated helper, exact-rational tests and browser harness, plus actual game2.1 and3.2 statement/argument bodies. Root read original pp299–306 and the complete pp307–311 proof; actual p303,305 and all five307–311 page images resolved OCR formula/sign errors. The separate counter-review also read the complete introduction/§I, complete §§II–III including footnote10, and the relevant coalition passages in IV/V. No full coalition-formula audit is claimed.

A separate exact BigInt two-variable LP reference used pairwise constraint-line intersections and feasibility, independently of production envelope candidates and the author's support formula: all130,321 offered matrices agree, including17,575 with a nontrivial optimal interval (maximum floating discrepancy1.776e−15). Log: `/tmp/atlas-game-neumann-counterreview-certificates.log`.

That review found sparse JavaScript matrix/cell arrays could bypass `.every` and crash a direct programmatic call. JSON cannot encode holes, but the strict exported/adapter predicates now explicitly check both indexed entries. Sparse matrix regressions are in the default model suite; the native harness directly tests sparse matrix and cell adapter rejection.

Root reran the four exact model groups through the new ordinary-test wrapper, all four native viewport/theme groups, and scoped static validation (1item,0errors,0warnings). All processes exited0. Logs: `/tmp/atlas-root-game-neumann-{math,native,static}.log`. Root inspected the complete320px light thirds page,320px dark maximum-payoff panel and1440px light constant panel. Source hash above matches. Byte guards preserve all chapter content before3.11 except its new import, all other syllabus entries, production graph/runtime and neighboring accepted batches. No generated-data rebuild or full-checkpoint claim is made here.
