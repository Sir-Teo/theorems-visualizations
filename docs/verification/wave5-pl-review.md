# Independent review: PL5

Status: **ACCEPTED** for all twelve frozen PL5 items. No outstanding source, model, state or presentation finding. Final product bytes are frozen; every reviewer browser/server is closed.

## Scope and sources

The reviewer read the twelve frozen identities, current authoring/CS guidance, both authored chapter files, the complete chapter-local reducer/compiler/effect/Lisp helper, and the actual outside input bodies PL2.1, PL2.9, PL4.7, PL4.9, PL4.10 and PL4.11. Planned TOC8.4 is see-only. The initial seven-file author manifest `/tmp/wave5-pl-author-freeze.sha256` matched every file before the native run.

Independently read official Software Foundations MoreStlc introduction/elimination, CBV and recursion rules and References store-consistency, circular-store, extension, preservation and progress material. Read the actual local CMU Pfenning 2004 continuation notes pp1–6 and 2025 CPS lecture20 §§1–5, and Cornell CS6115 monad definitions, state implementation and laws. These support the chapter's declared fragments; they do not prove every combined host extension sound. R7RS continuation/proper-tail readings were preparatory context rather than a replacement for the fixed-answer typed source.

Independently read McCarthy's actual author-hosted transcription pp16–20 and inspected rendered p18, including the later footnote warning about eval. The chapter declares its corrected value-binding/function-replacement subset, dynamic association list, partial pair primitives, and absence of self-hosting or GC. It does not claim literal reconstruction of the inconsistent printed formula. The unavailable Wadler body remains unused; no substitute body was retrieved.

## Independent model evidence

`/tmp/wave5-pl-independent.mjs` uses a separate environment/closure big-step interpreter, rather than the authored substitution reducer or CEK machine. It passed:

- 1,280 pure programs with binder collisions and shadowing, comparing source observations, authored reduction and independently interpreted generated CPS syntax.
- 153 mutable-store cases: 144 closure/alias/update grids and nine actual factorial knots. The final knot function contains its own location and the source contains no fix operator.
- 290 control cases: 144 abortive sums, 144 nearest-handler/rethrow cases, one continuation-before-payload side-effect order case, and an escaping continuation invoked twice with persistent store state.
- Six additional Lisp atom/pair, numeric-looking-symbol, dynamic-scope and conditional short-circuit cases.
- 1,200 extensional state, exception and writer law cases using additional effect functions and observations.

The focused author test file was independently rerun: 15 groups pass. Finite checks are evidence about the implementation, not proofs of universal preservation, CPS equivalence, divergence or monad laws. Actual knot recursion uses the declared reducer; the direct recursive reference interpreter is only an external finite-result oracle.

The source/model review found no outstanding defect. CPS resource exhaustion is inconclusive, numerical errors are separate, continuations actually replace saved frames without rolling back stores, and store typing uses a finite location environment rather than recursively following heap contents. The safety theorem is explicitly scoped to the reference fragment.

## Native review and resolved findings

The fresh full matrix passed all 48 settings (twelve items × actual 1200/320 CSS-pixel widths × light/dark). `/tmp/wave5-pl-review-native.log` records **1,268 counted control/edit actions and 444 URL checks**, including **260 physical Create state link replays**; the other 184 checks cover raw off-grid/integer, oversized and malformed states. Counts are not combined with overlapping refreshes below.

Checks include every preset/mode and visible slider endpoint, physical program edits, First/Next player actions, exact edited/nonfinal-step restoration, hidden controls, type/syntax/literal rejection, deep contexts, CPS shadowing, cutoff and numerical errors, deliberate store corruption and the real McCarthy Paper card. The utility compares computed model observations and exact captured state after replay, measures full readout scroll dimensions, rich text/KaTeX widths, complete dot/ring and path/rectangle bounds and glyphs/halos. Marker/ring minimum was **5.076923 CSS px**; glyph/halo minimum **10.987305 CSS px**. Path and rectangle stroke bounds passed separately; those minima are not an aggregate ink metric. Tolerances are 0.01px for marker/stroke boundary measurements, 0.1px for glyphs and 1px for DOM text/scroll metrics. Screenshots use height 2400 to paint the full tall widget, retaining actual 1200/320 widths.

Pixel review identified three bounded visual defects, all corrected by the author: an invocation with zero discarded frames was colored as capture; the monad figure listed an unused green key; and the Lisp chart mislabeled recursive eval-call nesting as reduction/association-list depth and had an unused key. Final 9/11 replacement settings pass with a direct event-kind color oracle, including both gold invocation boxes. Final 12 replacement four settings pass **128 actions / 40 URL checks / 24 actual Create-link replays**, with the accurate chart title/label and complete error states. A reviewer-only label assertion was initially too strict for a rejected program with no trace; the final assertion checks the label only when a trace exists. No product error was inferred from that harness stop.

A separate final metadata gate on 3/7/12 passed twelve settings, **60 counted actions, 12 actual Create-link replays and 20 physical written-link navigations**. `/tmp/wave5-pl-review-metadata-final.log` is authoritative. It matches build.mjs: source `see` references are filtered to written IDs. Planned TOC8.4 therefore remains absent from runtime related chips and absent from proof prerequisites. Paper metadata/DOI and long diagnostics pass both themes/widths. Earlier unfiltered metadata-fixture evidence is interim, not production acceptance. The author's final fixture implements the equivalent written-ID filter without product changes.

Personally inspected all 228 author default/mode captures across both widths/themes, all 24 own narrow defaults, selected own deep/corrupt/CPS/error captures, and all 56 final 9/11/12 replacement default/mode captures. Final narrow Paper citation, qualification, proof and native-link regions were inspected at full size. Figures/readouts remain legible; bounded summaries and paged full configurations are explicitly distinguished.

Evidence: `/tmp/wave5-pl-independent.mjs`, `/tmp/wave5-pl-independent.log`, `/tmp/wave5-pl-review-math-final.log`, `/tmp/wave5-pl-review-production`, `/tmp/wave5-pl-review-final-production`, `/tmp/wave5-pl-review-final-gallery`, and the logs named above. All 15 focused tests pass on final scientific bytes. Final seven-file v3 manifest matched; the immutable reviewer copy is `/tmp/wave5-pl-review-final-freeze.sha256`. Relative to v2, v3 changes only the test fixture and author evidence, not product/model bytes. Generated-data/export integration remains the coordinator's separate gate.

## Proposed bridge note

The queued PL5.7 fixed-points note accurately consumes the implemented knot: allocation precedes closure creation, the stored function reads the same reference, and no fix term is involved. Its finite store typing does not recursively infer cell contents. The note is accepted with the suggested wording precision: “termination requiring separate analysis” rather than “convergence requiring separate analysis.” No shared bridge file was edited.

No Git operation, full suite, generated-data change, shared-ledger edit or product edit was performed by this review.
