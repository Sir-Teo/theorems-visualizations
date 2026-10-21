# game-4.9 / game-4.10: information and realization audit

Candidate scope: the two objects and required isolated import in `content/game/ch04-b.js`, their two rows in `content/game/syllabus.js`, `content/game/information-audit.js`, the explicit model/native tests, and this report. Both source flags are resolved after the independent root acceptance recorded below. This accepts the current textbook-backed exposition, not an original-paper audit. Accepted game-4.6/4.7 (including stepped replay), game-4.8, chapter summary, shared helpers/runtime, generated data, central records and Git were not changed.

## Actual sources and bounded credit

1. Osborne and Rubinstein, *A Course in Game Theory* (1994), actual downloaded 373-page HTML-derived PDF rendering, not an original publisher scan:
   - Author book page: <https://www.economics.utoronto.ca/osborne/cgt/index.html>.
   - Readable rendering: <https://rexresearch1.com/GameTheoryLibrary/CourseGameTheoryOsborne.pdf>.
   - Local PDF `/tmp/atlas-game-tree-sources/osborne-rubinstein-1994.pdf`, SHA256 `a8a0f04c755cc2ec9874199f237bcda11a511f6b5fe85c607a4604b960b0854c`.
   - Actually read Definitions 200.1, 203.1, 203.3 (finite extensive game, complete plans, remembered own experience), Definition 212.1, the complete Proposition 214.1 proof on printed p.215, and the forgotten-own-action counterexample on pp.215–216. Chapter 11 printed-page/PDF mapping is printed+7 for one-based PDF pages; viewed images are `or-actual-def-{207,208,209,210}.png` and `or-actual-proof-{219,220,221,222,223}.png` under `/tmp/atlas-game-information-sources/`.
   - Limit: this rendering has broken/missing formula fragments at the end of printed p.213 and in the converse discussion on p.214. Those missing formulas were not read or credited as intact. The p.215 conditional construction/zero-prefix proof is intact. The visible product pre-sampling converse is independently derived below and checked by enumeration.
2. Giacomo Bonanno, *Game Theory*, third edition (2024), actual complete 634-page author PDF:
   - Author PDF: <https://faculty.econ.ucdavis.edu/faculty/bonanno/PDF/GT_book.pdf>; author page <https://faculty.econ.ucdavis.edu/faculty/bonanno/GT_Book.html>.
   - Local `/tmp/atlas-game-tree-sources/bonanno-GT.pdf`, SHA256 `5bea4225a01deae278f613414faaf2a5bca77dd9444e5bb966ee6be4682627a9`.
   - Actually read Definitions 4.1.1–4.1.2, printed pp.123–124, and complete §7.1, pp.239–242, including Definition 7.1.1, the conversion example, Theorem 7.1.1 and its all-terminal-distributions/other-strategies footnote, and Figure 7.4 with its product-probability obstruction. PDF and printed page numbers coincide here. All six corresponding source page images were viewed, including the complete numerical calculations on p.240.

Original Kuhn (1953) remains **unresolved**: the bounded publisher/JSTOR acquisition attempts returned challenges or empty responses; no chapter was read. The 1950 paper was not substituted. Removed the old unread original-year/priority credit and Piccione–Rubinstein absent-minded-driver attribution. Public credit names the actual textbook expositions; “Kuhn's theorem” is their conventional theorem name. No original priority conclusion is inferred from metadata.

Actual source texts/images and their final hashes are listed in `/tmp/atlas-game-information-frozen-manifest.json` after freeze. Excerpts are not reproduced in the product; statements and proofs are newly worded.

## Actual prerequisites

Read the written statement and proof idea, rather than only titles, of game-4.1 (finite trees, complete off-path plans and strategic form), game-2.1 (finite distributions, between-player independent randomization and linear expectation), and game-1.3 (unilateral whole-plan Nash best replies). The 4.9 visible proof uses all three. The 4.10 visible proof uses 4.9's definitions and inherited finite expectation. Dependencies are 4.9 → 4.1, 2.1, 1.3 and 4.10 → 4.9; no new cross-field or circular edge was introduced.

## Repairs and exact mathematical scope

### 4.9: definitions and authored games

The statement now fixes a finite rooted tree, nonempty finite actions, equal actions within an information set, complete pure plans, independently randomized behaviour, fixed chance probabilities including zero, and exact perfect recall through the ordered own-information/action record. It explicitly excludes an information set containing an ancestor and descendant, matching the finite examples and avoiding conflation with repeated-visit models. A mixed plan's coordinates may be correlated; between-player independence does not imply independence of a player's own contingent choices.

Retained the old authored Matching Pennies and two-type poker payoffs/chance probabilities. They are teaching models, not observed poker data. Every complete pure deviation and every distinct terminal history, including zero-probability and equal-payoff histories, is exposed. P1/P2 plan counts are 2/2 for pennies and 4/2 for poker. A shared information set cannot choose separately at its two nodes.

The poker preset is A=1, B=1/3, C=2/3, with expected payoff (1/3, −1/3). High strictly prefers bet: 1+C=5/3 > 1. Low is indifferent: 1−3C=−1. Conditional on a bet, the high-card probability is 3/4, making P2's call and fold payoffs both −1. Thus every complete pure deviation is weakly worse; linearity gives the mixed-deviation conclusion. Removed the false caption that both players/types are indifferent. Numeric regret is separately labelled with tolerance 1e−12 and is not presented as an exact theorem certificate.

### 4.10: every terminal history, not just payoff

For a given mixed plan μ, define ρ(h) as its mass of plans consistent with the player's own preceding actions. Perfect recall gives the same own prefix within each information set. At positive prefix mass use β_I(a)=ρ(ha)/ρ(h); at exact zero use any distribution. No epsilon threshold replaces a small positive prefix by zero.

On every terminal history of positive own mass, conditional factors telescope to the own consistent-plan mass. If that mass is zero, the first own transition from positive to zero has β=0, making all continuations zero regardless of subsequent arbitrary fallback. Zero chance factors and incompatible opposing pure plans also give zero under both descriptions. This establishes equality at each terminal history against every opposing pure profile; independent finite mixtures and opposing behaviour distributions preserve it. A player without decisions has the empty plan of mass one.

For the converse, pre-sample each information-set action independently with its behaviour probability. A complete plan's mass is the product across all its information sets. Perfect recall ensures no set repeats along a path; unused coordinates sum to one, leaving exactly the path product. This does not assert that the original given μ has independent coordinates. Removed that false sentence from the old proof and the unnecessary equilibrium-payoff corollary.

The transparent authored perfect-recall tree has four P1 plans `(L,a), (L,b), (R,a), (R,b)`. Its allocation controls cover the whole simplex:

    μ = (u, (1−u)v, (1−u)(1−v)w, (1−u)(1−v)(1−w)).

The five terminal probabilities, in distinct history order Lla, Llb, Lra, Lrb, R, are

    (q μ1, q μ2, (1−q) μ1, (1−q) μ2, μ3+μ4).

The readout retains all four weights, all conditional numerators/denominators, every paired terminal probability, and the product pre-sampling mixture. Six deterministic presets expose the full construction, correlated coordinates, two different realization-equivalent mixtures, an exact zero prefix, and a positive 1e−14 prefix. The old opaque random weights/hidden seed were replaced so every state is derived from declared controls on every render.

The authored forgotten-own-action tree has B after A=L and A=R in the same information set. Own records differ, so perfect recall fails without repeating any information set along a path. The target mixture `(λ,0,0,1−λ)` produces `(λ,0,0,1−λ)` on La,Lb,Ra,Rb. Every behaviour distribution has the rank-one form `(pr,p(1−r),(1−p)r,(1−p)(1−r))`, determinant zero. The target determinant λ(1−λ) is positive exactly for 0<λ<1. Endpoints have equivalent behaviour p=r=λ. The selected behaviour's maximum discrepancy is labelled a discrepancy, not an optimized distance; equal expected utility never substitutes for terminal-distribution equivalence.

## Controls, geometry and saved state

All probability/allocation/fallback controls have the full continuous domain [0,1], `step='any'`. Six-significant-digit formatting is display formatting only; exact floating-point model and saved values are retained. There is no opaque stochastic seed or extra state adapter. Both selectors, hidden retained controls, all presets and every data/geometry record are rebuilt directly from current controls on each render, including the first restored frame.

Native range inputs may serialize a value such as 1/3 to a shorter decimal even with `step='any'`. Tests compare the actual DOM value string to a fresh detached native range with identical min/max/step assigned `String(exactSavedValue)`, while requiring exact model/snapshot equality and exact replay. This distinguishes benign native serialization from step-grid sanitization. No production canonicalization/rounding wrapper remains. Values such as .123456789, 1/3, 2/3 and 1e−14 are covered; controls remain continuous.

The focused renderer retains all nodes/edges/leaves, including zero-reach ones. Tree edge labels contain action names, while full probabilities and information constraints remain in the readout. Poker's dashed C connector goes above the intervening check terminal so that terminal is not represented as part of C. Distinct terminal IDs, not repeated payoff values, label probability bars. Full glyph and backing-plate bounds are checked; all canvas fonts are at least 10.5px. The source theorem/definition and complete proof idea remain visible as ordinary selectable prose and TeX.

## Validation and reproducible commands

Final outcome: **six analytical groups and eight complete plate-aware native groups pass; static check: two items, zero errors, zero warnings.** Every owned browser/server process exited. Inspected final full pages and panels across both widths/themes: pennies/poker, positive/zero own-prefix, off-grid perfect recall and the forgotten-action example. Narrow poker labels remain separated with their backgrounds; every terminal ID/payoff remains visible.


    node --test tests/verification-game-information-model.mjs
    node tests/verification-game-information.mjs
    node scripts/check.mjs game-4.9 game-4.10 --static

The model test is explicit-only; no default-suite import was added by this agent. Six analytical groups independently check:

- Exact terminal-polynomial formulas and full pure-deviation payoffs on 729 probability triples for both pennies and poker; exact preset reasoning is separate from residuals.
- 6,561 allocation/opponent grid cases against explicit five-terminal polynomials, and product-mixture converse reconstruction. The grid is a reference audit within a continuous domain, not exhaustive coverage of the real interval.
- All 165 four-weight denominator-eight simplex points inverted independently into allocation controls; exact-zero fallback choices and a positive 1e−14 prefix with 1e−29 terminal-error tolerance; distinct equivalent mixtures.
- A separate 16-plan perfect-recall tree on 100 normalized integer-weight mixtures, with independent bit-index terminal classification, including zero plan weights.
- 729 forgotten-action triples, determinant identities, both degenerate endpoints, and equal-payoff/distinct-distribution cases.
- Complete plan and own-record inventories, chance-zero and terminal-root/empty-plan cases, malformed trees/information constraints/distributions and out-of-domain controls.

Native suite: two items × widths 320/1440 × light/dark = eight groups. In each width/theme, 4.9 exercises 54 three-control reference samples, both analytic equilibrium presets, all terminal/deviation records and off-grid replay. 4.10 exercises all six presets and 54 recall/forget reference samples, zero/tiny prefixes, degenerate endpoints, exact compound off-grid replay, all visible control Home/End endpoints and malformed-state default recovery (three malformed values per item). Every check requires the actual complete rendered model to equal independent helper evaluation of the exact saved values; snapshots, readout and geometry must reconstruct exactly (geometry tolerance 1e−9). Font-ready invalidation precedes geometry capture; this is not an independent cold-font-runtime audit.

Assertions cover full stroked geometry/markers, glyph and backing-plate/page/control/TeX bounds, pairwise text separation, no runtime/TeX errors, and every terminal record. Plate-to-other-glyph checks were added after screenshot inspection caught the narrow poker label backgrounds crowding. Terminal-edge action labels were moved toward their leaves, avoiding that occlusion. Earlier eight groups passed glyph-only bounds; final evidence is the stronger plate-aware run, not that earlier check.

Evidence logs: `/tmp/atlas-game-information-math-final.log`, `/tmp/atlas-game-information-static.log`, `/tmp/atlas-game-information-native-final-plates.log`. Final screenshot identities and logs are included in the frozen manifest. Earlier `/tmp/atlas-game-information-native-first.log` records the overly strict DOM bit-equality assertion failing on native 1/3 serialization; the assertion was replaced by the independent native-range oracle, not by rounding the production model. An interim local normalization-wrapper diagnostic was removed before the final run; it is not final production evidence.

Final scope guard compares chapter bytes before the 4.9 marker (subtracting the single isolated import) and all syllabus bytes outside the two owned rows to the initial snapshots. They match exactly. Those author checks retained both flags for independent root acceptance. The original 1953 reading remains unresolved independently of the checked textbook mathematics.

## Independent root acceptance

Root read the complete revised definitions, theorem and proof; the entire isolated model/renderer and mathematical/native tests; the actual used game4.1,2.1 and1.3 arguments; the actual Osborne–Rubinstein definitions, conditional/zero-prefix proof and counterexample; and complete Bonanno§7.1/Definitions4.1.1–4.1.2, including the all-terminal-history quantifier. Root inspected the actual ORp215 formula/diagram page and Bonanno123/124/240/241/242 pages. All six frozen owned paths and17actualsource/page identities match. The OR rendering limitations remain disclosed. The original1953chapter is still unacquired and no original-year/priority finding is accepted. Every material claim in the current finite exposition is supported by the actual textbook sources and the complete newly worded proof.

Root independently checked the whole-plan poker best replies, conditional telescoping with exact-zero prefixes, pre-sampling converse and determinant obstruction. Six mathematical groups, the entire eight native width/theme groups and static2/0/0 all pass with exit0. Logs: `/tmp/atlas-root-game-information-{math,native,static}.log`. The native checks retain exact model/saved values and separately compare actual DOM strings with native serialization; they do not round the probability model. A root wrapper `verification-game-information.test.mjs` includes the six independently checked groups in the default suite.

Root inspected the complete320-dark poker equilibrium and320-light rare-prefix pages,1440-dark forgotten-action page and320-dark off-grid tree panel. Full histories, terminal IDs/payoffs, information connectors, tiny positive probabilities and label plates remain visible in the checked states. Exact guards preserve all chapter bytes before4.9 except the required import, all unrelated syllabus bytes, accepted4.6/4.7 including stepped replay, and4.8. Both current source flags and queue/plan counts are reconciled. The accepted combined checkpoint throughb229c72 remains its exact1,604-test snapshot; it excludes this later batch.
