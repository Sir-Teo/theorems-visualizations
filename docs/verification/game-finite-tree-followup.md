# Game 4.1 / 4.2 / 4.4 / 4.5 — finite trees, ties and subgame checks

Scope: **game-4.1, game-4.2, game-4.4, game-4.5**, their four syllabus rows,
one isolated finite-tree helper and two explicit test scripts. All four source flags are resolved after independent root acceptance. The 4.3 item, shared
tree/solver/runtime files, accepted minimax chapter/helper/tests and all
16 frozen map paths are outside this change. No full build, generated data,
central ledger or Git mutation was performed. The syllabus was edited only
after the parent released its accepted minimax snapshot.

## Actual textbook evidence read

**Giacomo Bonanno, Game Theory, third edition, 2024**, actual author-hosted
[PDF](https://faculty.econ.ucdavis.edu/faculty/bonanno/PDF/GT_book.pdf), supplied
through the author's [book page](https://faculty.econ.ucdavis.edu/faculty/bonanno/GT_Book.html).
Read the actual §§3.1–3.3 (printed pp.77–86), Theorem3.4.1 and its complete
§3.6 proof (pp.93–95), and §§4.3–4.4 (pp.130–140). These cover finite rooted
trees, distinct outgoing actions, ordinal terminal payoffs, complete plans,
strategic-form redundancies, backward induction with ties, subgames and SPE.
Definition3.1.2 on p.78 and Definition3.2.1 on p.81 were also rendered and
visually inspected. The relevant mathematical definitions and complete
deviation argument were read; no whole-book reading is claimed.

Local `/tmp/atlas-game-tree-sources/bonanno-GT.pdf`, 634 PDF pages, SHA256
`5bea4225a01deae278f613414faaf2a5bca77dd9444e5bb966ee6be4682627a9`.

**Martin J. Osborne and Ariel Rubinstein, A Course in Game Theory, 1994**,
actual textbook content in this [PDF mirror](https://rexresearch1.com/GameTheoryLibrary/CourseGameTheoryOsborne.pdf).
The [authors' book page](https://www.economics.utoronto.ca/osborne/cgt/index.html)
identifies the work; current author downloads require registration, which
was not performed. Read the actual §§6.1.1–6.1.3 definition/strategy/strategic
form material, Definition97.1/97.2, the complete Lemma98.2 one-deviation proof,
the complete Proposition99.2 construction, its p.100 finiteness/uniqueness
discussion and notes pp.114–115. Printed pp.97–100 (PDF pages109–112, one-based)
were rendered and visually read, including the formulas omitted by extraction.
This mirror's PDF is a rendering of the textbook, not a claim to an original
publisher-layout scan or to Kuhn's original paper.

Local `/tmp/atlas-game-tree-sources/osborne-rubinstein-1994.pdf`, 373 PDF pages,
SHA256 `a8a0f04c755cc2ec9874199f237bcda11a511f6b5fe85c607a4604b960b0854c`.

The actual notes pp.114–115 attribute the extensive form to von Neumann and
Morgenstern1944, the formulation and finite-game existence result to Kuhn1953,
and subgame perfection to Selten1965. Those textbook-supported attributions
are retained, with the existence result explicitly called a modern pure-SPE
formulation. The former extra1950 date and broad Zermelo algorithm attribution
are removed from the audited items. No reading of the1944/1953/1965 originals,
or an independent priority investigation, is claimed. Unread MSZ/Osborne
section citations are replaced by the actual definitions/propositions above.

## Hypotheses, claims and prerequisites

4.1 now explicitly defines the **finite deterministic subclass**: a finite
nonempty player set, a finite rooted tree, one mover and a nonempty finite
set of distinctly labelled actions at each nonterminal node, and finite real
payoffs for every player at every terminal node. The root may already be
terminal. Perfect information alone does not imply finiteness or exclude
chance from more general models. No chance nodes or simultaneous choices
are present in these authored examples. The empty product gives one plan for
a player with no decisions. Terminal histories and distinct payoff vectors
are distinguished. The former universal claim that strategy counts grow
faster than the tree is replaced by the actual product formula and an
explicit binary-tree example.

4.2 selects one maximizing action after children have been evaluated and
propagates its **whole** payoff vector. Tied choices can alter an ancestor's
comparison, so first/last tie policies each recompute the whole tree. A terminal
root is the zero-evaluation base case. Finite, nonempty choices guarantee
attainment. The animation's postorder contains every decision node; displayed
values remain hidden until their nodes have been evaluated.

4.4 defines pure SPE by every subgame, including the whole game; the equivalent
one-node test is explicitly required at **every** node. Its proof undoes a
deepest changed decision in any multi-action deviation. With all later choices
already prescribed, the local inequality says undoing cannot lower the
deviator's payoff; finitely many undos bound the whole deviation. Testing only
the initial path is insufficient.

4.5 supplies both directions of the finite induction: child equilibria plus
a maximizing root action yield a pure SPE, even against deviations that change
both the root and later choices; every pure SPE restricts to child SPE and
chooses a maximizing continuation. Thus consistently varying **all** tie
choices yields exactly the pure SPE, rather than combining arbitrary green
branches from one fixed continuation computation. A sufficient uniqueness
condition is stated precisely: each player's payoffs distinguish every two
terminal histories. Ties do not by themselves imply several initial outcomes.
The one-stage choice `a in (0,1)`, payoff `a`, is an independently supplied
counterexample to replacing finiteness by finite horizon without attainment.
The expected-payoff extension to chance moves is outside the illustrated
deterministic scope; it is not asserted to be false.

Actual prerequisite bodies read: game-1.1's strategic form and payoff
conventions, game-1.3's complete unilateral-deviation Nash definition, and
the audited 4.1/4.2/4.4 definitions/method. 4.1 genuinely uses game-1.3 for
its Nash table; 4.4 uses4.1 and1.3 without depending on backward induction;
4.5 uses4.2 and4.4. This gives an acyclic proof chain. No cross-field
prerequisite was added. Syllabus rows match the final dependencies/references
and describe the actual fixed examples and navigation rather than a nonexistent
tree-building tool.

## Corrected models and interfaces

* **Entry ties:** the old hardcoded SPE list ignored the entrant's `l=0`
  indifference and the incumbent's `f=1` indifference. Every one of the four
  pure profiles is now checked by actual whole-plan subgame deviations.
  At `(f,l)=(1,0)` the three pure SPE are `(Out,Fight)`, `(In,Fight)` and
  `(In,Accept)`; at `(1,−1)` there are two; at `(3,0)` both entrant choices
  against Fight are SPE. These weak best replies are retained. All77 offered
  half-unit pairs are checked; mixed equilibria are expressly outside the table.
* **Actual branching:** depth4/branching3 now produces the full121-node,
  81-terminal-history tree, with40 decision evaluations. The old code silently
  substituted branching2. All six depth2/3/4 × binary/ternary choices retain
  their exact inventory. Random sampling produces a fixed example; chance
  does not subsequently intervene in play.
* **Readable complete navigation:** a local inspector shows one node and all
  its immediate children with IDs, mover, action labels and actual continuation
  payoffs. Root/parent/preorder navigation and child clicks reach every original
  node without squeezing81 payoff labels across a320px screen. Following the
  active evaluation step is a separate native toggle. No node/action is deleted
  and no plotted tree is silently replaced by a smaller one.
* **Arbitrary profile checks:**4.5 can edit either action at any inspected
  decision, preserving all other choices. Its checker maximizes each player's
  payoff over **all** of that player's decisions in every subgame while fixing
  opponents. The corruption button first restores the computed profile and
  then changes one strictly suboptimal choice, when one exists. Exactly the
  failing subgames are marked; the old assertion that all ancestors fail was
  false. A supplied off-path failure can leave root-game Nash true. Restore
  returns to the selected coherent tie solution.
* **Counts and state:** the profile-count plot uses `(2^d−1) log10(2)` and the
  node-evaluation plot `log10(2^d−1)`, with complete endpoint glyph margins and
  a readable external legend. It is not a runtime benchmark. Native bounded
  seeds1–64 and tie/size controls replay the same tree. Scoped adapters preserve
  all4.1 leaf edits, selected leaf/cell, the4.4 selected profile, inspected node
  and4.5 complete edited profile. Shape/value/size validation is bounded;
  dependent schema rejection remounts defaults through the existing runtime.

All visual models have two players and deterministic terminal payoffs. The
isolated evaluator also tests one- and three-player trees, terminal roots and
one-action nodes. It requires a prepared tree with unique IDs and rejects
cycles, merged branches, empty decision action sets, repeated information
sets, chance nodes, nonfinite/inconsistent payoffs and invalid profiles.
The shared tree helpers and renderer remain unchanged.

## Executed mathematical evidence

`node --test tests/verification-game-finite-tree-model.mjs`: **7 groups pass**;
log `/tmp/atlas-game-finite-tree-math.log`.

1. All256 two-level binary games with both payoff coordinates in `{0,1}`:
   every one of their8 complete profiles is tested by independent enumeration
   of each player's full alternative plans in every subgame. All checker
   results, the one-node criterion and both BI tie policies agree.
2. All77 entry-control pairs: direct weak-reply inequalities independently
   enumerate every Nash/SPE profile, including both exact ties. The explicit
   default `(Out,Fight)` is Nash at the root but fails only the incumbent's
   subgame, demonstrating why not every ancestor fails.
3. Every128 complete profiles of16 three-level binary games: repeated-player,
   multi-decision deviations are exhaustively enumerated. Every subgame's
   actual best attainable payoff for each player agrees with the separate DP,
   not merely its final yes/no label.
4. All strategic-form cells and complete plans for the three4.1 presets are
   compared with direct path traversal and independent Nash checks.
5. Every64 seed, all seven authored size configurations (including the4.5
   binary depth5), both actual payoff ranges and both tie rules:1,280 solved
   trees with exact node/terminal counts, readiness
   of every postorder step, all selected/tied action values, profile payoffs
   and the local optimality criterion pass. Large trees' exponentially many
   profiles are not claimed to have been exhaustively enumerated.
6. Terminal-only, one-action and three-player cases, a strict-payoff unique
   SPE, ties that change ancestor payoffs, and two off-path tie profiles with
   the same initial terminal history are checked explicitly.
7. Exact profile/evaluation counts and malformed tree/profile rejections pass.

## Native and visual evidence

`node tests/verification-game-finite-tree.mjs`: **20 groups pass**, covering
all four items plus a compound-state group at1440/320px in light/dark. Log:
`/tmp/atlas-game-finite-tree-native-final.log`. The separate final
`TREE_AUDIT_STATE_ONLY=1 node tests/verification-game-finite-tree.mjs` rerun
passes **all4 compound/state groups** on the final source/test bytes, including
the last strict game-key type guard. Log:
`/tmp/atlas-game-finite-tree-state-final.log`. Both processes exited0 and
closed their browsers and servers.

* **4.1:** all three presets, every leaf, all four payoff-slider corners at each
leaf, and every complete-profile table cell. Table data/Nash shading and
selected paths are checked against independent direct traversal. Every
rendered tree-edge endpoint, selected color/width and reached terminal payoff
is checked. Edited payoffs, leaf and cell survive exact saved-state replay.
* **4.2:** all six size choices, both coherent tie rules and every evaluation
frame. Every visible ID, mover, action, evaluated/unvalued payoff and selected
or tied branch is checked against the actual postorder. All121 ternary nodes
are visited, along with actual child clicks, parent/root/preorder navigation,
seed Home/End, seed64→1 wrap and increment, follow-toggle clicks and boundary
no-ops. No future node value is leaked into the inspector.
* **4.4:** all77 actual half-unit payoff pairs with the current profile; all four
profile selections at the double tie. The complete table's Nash/SPE sets and
colors are checked at every pair, with selected paths and saved selections
also checked. The independent mathematical tests cover all four profiles at
every pair.
* **4.5:** every authored depth/tie combination; corruption/restoration; all63 nodes
at depth5 and both actions at every decision; actual best whole-plan deviation
payoffs, exact failing-subgame IDs, root Nash/SPE status, endpoint controls,
profile/count-curve geometry and saved-state replay. A separate compound
profile changes all31 decisions together, preserves them through replay and
checks all subgame deviation values. Terminal action buttons leave the
complete profile unchanged.

Dependent profile-inventory rejection restores the complete default tree,
depth/seed/control state and15-action profile. An out-of-range saved payoff
is rejected before mutation. The final narrow hardening requires the saved
game key to be a string, rejecting a forged `['entry']` value rather than
coercing it to an object key. This last malformed-input case is additionally
run in all four viewport/theme configurations on the final source bytes.

For every captured state, the fixture checks complete path strokes, tree
edge strokes, endpoint markers/rings, measured canvas glyph/halo bounds,
minimum10px canvas fonts, TeX errors, display-math overflow, page overflow
and runtime errors. Picture/state/readout replay comparisons remain exact.
The initial16-group run is retained separately at
`/tmp/atlas-game-finite-tree-native-initial.log`; it is not a cold-font or
final-strengthened-coverage result.

Pictures and exact replay text boxes are captured **after local fonts are
ready and an explicit runtime invalidation has repainted the canvas**. This
is a test-fixture readiness step, not evidence about the first cold-font
frame. A separate delayed-Newsreader reproduction found a pre-existing
runtime issue: releasing the font and awaiting `document.fonts.ready` did
not by itself repaint an idle canvas. The fallback title bounds persisted
until invalidation, after which the Newsreader bounds changed. The parent
received the isolated reproduction `/tmp/atlas-game-tree-cold-font.mjs` and
its `.json`/`.log` evidence for a separate runtime follow-up. This scoped
chapter change leaves the runtime untouched.

The recorded native browser is the local Playwright Chromium headless shell
(`chromium_headless_shell-1243`, mac-arm64). Runtime SHA256 at the start and
end of these runs was
`a6fa1753d9d9e8b9a05a7161fffc58dfd53b27002d9d393a3266aeb96515fe73`;
it includes the parent's separate font-ready/loading-done invalidation fix.
The earlier cold-font reproduction predates that fix. These chapter fixtures
still explicitly repaint after readiness and therefore do not independently
isolate the runtime fix. These are correctness/layout checks, not map timing
or cross-device performance claims.

Agent inspection included the wide light definition/tree/table, wide dark
entry tie table, narrow dark backward-induction inspector, narrow light
off-path Kuhn failure, narrow light/dark ternary continuations, narrow dark
entry subgame, edited strategic-form tables, wide dark compound failure
and narrow light compound full page, plus the narrow dark count plot with
all endpoint glyphs visible. Files follow
`/tmp/atlas-game-tree-{name}-{1440,320}-{light,dark}.png`, with full-resolution
stage crops ending in `-panel0.png` or `-panel1.png`. The inspected layouts
retain readable control wrapping, payoff/action labels, math and legends.

`node scripts/check.mjs game-4.1 game-4.2 game-4.4 game-4.5 --static` checks
four items with **0 errors and0 warnings**. `node --check` passes the chapter,
syllabus, helper and both test scripts. The six scoped files have no trailing
whitespace. No default-glob test wiring has been changed; these scripts run
by explicit path. All four `verify: true` flags remain for parent integration.
The16 protected map files were rechecked against their frozen manifest with
zero mismatches. Source PDFs and all six final scoped paths are hashed in
`/tmp/atlas-game-finite-tree-manifest.json` for the parent handoff.

## Independent root acceptance

Root read the actual Osborne–Rubinstein printed pp. 89–96 (§§6.1.1–6.1.3), the complete actual pp. 97–100 formula/proof images and notes pp. 114–115. This independently supports the complete-plan definition, one-deviation reduction, recursive existence construction and sufficient uniqueness condition. It is a direct reading of the identified textbook rendering, not of Kuhn’s original paper; root does not claim the agent’s additional Bonanno reading as its own.

Root read the complete isolated helper and seven mathematical groups, all four public objects and their visualization bodies, the full native test script, and the actual game-1.1/game-1.3 statement/argument prerequisites. Independent reasoning confirms whole-plan best-deviation dynamic programming, the finite deepest-change proof, coherent whole-vector tie propagation, and the converse from pure SPE to recursive tie choices. Entry ties at f=1 and l=0 retain all weak replies. An off-path failure may leave root Nash true, as the actual example demonstrates.

Root reruns pass **7 mathematical groups**, the same **7 groups through a new default-suite entry file**, **20 full native groups**, and static **4 items / 0 errors / 0 warnings**. Logs are `/tmp/atlas-root-game-finite-tree-{math,default,native,static}.log`; all processes exited 0 and closed their browsers/servers. The native matrix includes all four items plus the compound-state case at 1440/320 px in both themes, on the separately committed font correction. The fixture’s explicit font-readiness repaint remains; it is not the independent runtime-font regression.

Root inspected final narrow complete definition/edited-table, ternary backward-induction, double-tie entry and corrupted-Kuhn pages, the dark compound inspector and dark count-plot panel. All original nodes remain navigable and the full profile remains checkable without compressed leaf labels. Exact guards confirm the six frozen agent file hashes before acceptance, the complete untouched 4.3 object and every other syllabus row. No production graph or shared tree helper is changed. The four final flags and central source queue agree; the seven mathematical groups now run under the default test glob.
