# Game4.13: geometric lines, colouring certificates and finite-game scope

Candidate for independent review; flag remains true. No original 1963 paper or original Patashnik proof is certified.

## Primary technical evidence

Read Golomb and Hales, *Hypercube Tic-Tac-Toe*, MSRI Publications42 (2002), §§1–3, printed pp.167–171, in the [actual official17-page PDF](https://library.slmath.org/books/Book42/files/golomb.pdf). The first PDF page is blank. Read the geometric-line definition, Theorem1 and both counting arguments, extra-mark monotonicity, and the distinctions among line-free colourings, drawn play and optimal game values. Inspected actual printed169–171 pixels (PDF4–6), including the formula, small-board discussion and pairing construction. Local source `/tmp/atlas-coordinator/sources/positional/golomb-hales-2002.pdf`, SHA256 `2288e7a8291f7179a46c6dde2d79e776c29ba425e9a177ba572ec74e8785404d`.

Read Conlon and Kamčev, *Intervals in the Hales–Jewett theorem*, [actual four-page author paper](https://www.its.caltech.edu/~dconlon/Intervals.pdf), §1 p.1, the combinatorial-line definition and formal Hales–Jewett statement; also its beginning p.2 explanatory proof discussion. Inspected actual p.1 pixels. Its all-forward wildcard lines form a subset of the geometric lines here, so its two-colouring theorem implies the claimed sufficiently-high-dimensional no-colouring condition. Local `conlon-kamcev-intervals.pdf`, SHA256 `587e452703b22c003742cc0eeafa904a13f8786eddb13405346634d887b9d416`. This is a reading of a primary technical author's theorem statement, not the unread 1963 original or a certification of the paper's unrelated new interval result. Direct AMS access to the original was denied; a catalogue/record was not substituted for reading it.

The finite-game deduction is given explicitly: no line-free full colouring excludes drawn normal play; backward induction supplies a winning player; strategy stealing with an extra own mark excludes a second-player win. No numerical general dimension threshold or constructive optimal strategy is claimed.

## Corrections and finite contract

The old search cache omitted its budget, silently reduced some selected dimensions, could paint an unassigned partial cell red as though it were a global impossibility certificate, and described an arbitrary unbalanced colouring as a possible full alternating draw. The replacement has fifteen explicit boards n=2–5,d=1–4 with n^d≤256, two explicit budgets, and three distinct outcomes: a complete line-free witness, complete exhaustive nonexistence, or budget-limited unknown. The deepest valid partial prefix is shown for unsuccessful searches. Every result includes its visited-node count and budget. Fixing cell zero blue uses exact colour symmetry. The cache includes both board and budget and returns defensive copies.

Found colourings are checked for alternating-compatible colour counts. A compatible colouring supplies some cooperative drawn play-out, since every prefix remains line-free; it does not supply a drawing strategy. An unbalanced witness makes no drawn-play claim. For example the first returned4^3 witness is unbalanced, and its 1,000-node search is unknown while its300,000-node search finds a witness. The visualization never reports a minimax result. Complete3^3/3^4 nonexistence searches do support the theorem's first-player conclusion.

Every actual square is selectable; blank margins and inter-board gaps leave selection unchanged. Previous/Next cell makes selection accessible through native buttons. Full incidence lines, all cells, all fifteen table rows, board/budget and exact selection survive saved-state replay. A selection attached to the wrong board or an unavailable board/budget is rejected. No sound is applicable to this item.

## Validation

- Four mathematical groups pass: independent endpoint-pair line enumeration for every offered board and the exact counting formula; independent complete small-colouring enumeration and a product of all line-free3×3 planes certifying3^3 nonexistence; every full/partial witness, prefix, budget and colour-count claim; complete square hit/incidence and malformed-state domains. `/tmp/atlas-coordinator/game-hypercube-math.log`.
- Targeted static check: one item, zero errors/warnings. `/tmp/atlas-coordinator/game-hypercube-static.log`.
- Six native viewport/theme groups (1450,430,320×light/dark) exercise every board and both budgets, actual square/blank clicks and buttons, full table/cell/line geometry, exact replay and invalid selection, complete glyph/path/stroke/text/TeX bounds. `/tmp/atlas-coordinator/game-hypercube-native.log`. Actual narrow full page, dense4^4 partial board and table screenshots were inspected separately from source-page pixels.
- Strict combined build: `/tmp/atlas-coordinator/game-hypercube-build.log`.
- Exact guards preserve neighboring4.11 and4.12 object bodies and every other syllabus row; only the obsolete exclusive hypercube helpers, item, isolated helper/tests/report and owned syllabus row change. Shared runtime and game helpers remain unchanged.

## Independent acceptance — 2026-10-20

Worker two independently reviewed exact `2bf0ae7` in `/tmp/atlas-worker-two/hypercube-peer`, modifying only evidence output paths, and recommends acceptance with no actionable findings. Read actual Golomb–Hales pp.167–171 and Conlon–Kamčev §1 pp.1–2; inspected original printed169–171 and Conlon p.1 pixels. Independently transcribed the source's4^4 tensor colouring:128/128 colour counts and all520 geometric lines bichromatic. Also independently enumerated all forward combinatorial lines and checked inclusion/count((n+1)^d−n^d) for every offered family. This separate known witness does not change the truth of a budget-stopped search's unknown result.

Fresh four math groups, one static item with zero errors/warnings, and both320px light/dark native groups pass. Native review covers all15boards×2budgets, every outcome type, actual square/blank/buttons, full table and geometry, exact replay and invalid state. Personally inspected independent dense4^4 partial/table and3^3 full-page screenshots. Evidence `/tmp/atlas-worker-two/hypercube-peer-{math,static,independent,light,dark}.log`, `hypercube-peer-evidence/`. Mathematical implication, balanced-colouring distinction, exact scope and unread-source limits are accepted; coordinator clears only game4.13.

## Timeline metadata follow-up

Removed the modern exposition's2002 from the credit field because the catalog builder heuristically uses credit years as timeline dates. The full2002 source citation remains in references; the audit never certified a first-invention year from that technical exposition or the unread1963 original. Mathematical content, state, visualization and source acceptance are unchanged.
