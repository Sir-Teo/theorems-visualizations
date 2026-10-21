# Independent review: DIST5

Status: **ACCEPTED**. All fifteen items pass independent source, proof, model, native state/replay and visual review. The timeline spacing and shipped FLP introduction relationship are repaired and independently rechecked. No unresolved product finding remains.

Reviewer ownership is this report and temporary independent evidence only. Product content, tests, syllabus, generated data, shared runtime and Git are owned elsewhere. All work used `/Users/teodev/.codex/worktrees/wave-five-shipping/theorems-visualizations`.

## Inventory and actual inputs

Read all fifteen frozen identities in `docs/wave-five-plan.json`, current `content/dist/ch05.js`, `ch05-b.js`, `ch05.shared.js`, AUTHORING and the Computer Science field guide. Independently read the actual statement, proof idea and scope of outside inputs DIST1.2, 1.3, 1.4, 1.7 and 4.8; the extracted records are `/tmp/wave5-dist-review-actual-inputs.json`. TOP9.9 is planned and remains a related link rather than an available proof input. Shared-memory hierarchy and set-agreement proofs are not presented as consequences of message-passing FLP.

The frozen plan's informal pictures are corrected where necessary: no fixed delayed-message unfairness masquerades as FLP; Ω supplies a leader ID rather than a suspect list; the Sperner triangle is not a generated protocol complex; the three-phase demonstration remains within synchronous crash failures; worst-case round optimality requires n≥f+2.

## Sources independently read

Actual local bodies are under `/tmp/atlas-wave5-dist-sources`, with author retrieval receipts and hashes in `receipts.json` and `lynch-sastry2015.json`. Read the relevant bodies rather than inferring results from titles or tables of contents:

- MIT 6.852 Fall 2009 lecture4 slides3–24: weak two-generals validity, infinite silent tails, finite decision-prefix truncation, uniform crash consensus and FloodSet.
- Lecture6 slides3–15 and33–53: the n≥f+2 lower bound, bivalence continuation, early stopping distinction, approximate agreement, uniform atomic commit, and synchronous rotating recovery invariants.
- Fischer–Lynch–Paterson1985 pp375–380: formal state/message/event model, admissible runs, partial correctness, Lemmas1–3 and fair infinite construction. Also read the initial-dead-only countermodel in Theorem2; it is a separate failure model. Rendered and inspected printed375 at `/tmp/wave5-dist-review-flp375.png`.
- Herlihy1991 consensus specification/hierarchy and §4, Figure14/Theorem14 pp143–146: successor consensus, immutable cells, cyclic helping, head scan and n+1 loop bound. Rendered and inspected Figure14/printed145 at `/tmp/wave5-dist-review-herlihy145.png`.
- Aspnes2003 survey §5.1 pp9–11, including actual Algorithm1: n>2t, first-phase strict majority, second-phase adoption/decision thresholds, postdecision participation, elementary weak-adversary argument versus the separately cited strong-adversary extension. Rendered and inspected Algorithm1 at `/tmp/wave5-dist-review-aspnes10.png`.
- Lynch–Sastry2015 §5.3: eventual common correct leader over the infinite output tail; no finite prefix supplies a stabilization certificate.
- Dwork–Lynch–Stockmeyer1988 introduction and Theorems5.1–5.2: unknown bounds versus eventual bounds, crash majority threshold, safety at arbitrary times and conditional progress. MIT lecture23 slides45–61 separately supports the actual single-decree ballot construction and highest-accepted rule; it is not the paper's distributed-clock simulation.
- Saks–Zaharoglou2000 Theorem1.1, §3, §6.1 and the §6.2 construction outline: sufficiently rich input domain, activity property, coherent-label parity and the essential common-prefix compatibility lemma. Rendered and inspected printed1471 at `/tmp/wave5-dist-review-kset1471.png`. The interactive regular triangle checks only the finite parity example, not the advanced schedule construction.

Skeen's original request failed SSL and then timed out; unavailable original Ben-Or and Chandra–Hadzilacos–Toueg paths were not replaced by alternate bodies. No textbook body was claimed from a portal. The chapter supports the scoped claims with the available original papers or the actual official/author exposition. No blocked BIGHIST source or old audit queue was accessed.

## Independent computation

`/tmp/wave5-dist-review-oracle.mjs` and its log pass. These checks do not call the author's tests or use their final agreement flags as the oracle:

| Check | Coverage | Independent condition |
| --- | ---: | --- |
| FloodSet | 3,072 runs | Four distinct original values; two ordered crashing senders, all sixteen receiver subsets for each; time-expanded communication-DAG reachability equals every retained set, and surviving deadline decisions agree. |
| Three-phase commit | 4,160 cases | All vote masks, crash processes/dates/cutoffs; every retained decision including failed processes, commit validity, alive U/READY exclusions, and final survivor completion checked directly. |
| Ben-Or | 2,240 runs; 45,670 phase transitions | All recorded adoption/decision thresholds, immutable decisions and each received ratification's first-phase strict-majority certificate reconstructed from sender-indexed inbox order. FIFO/seeded delivery, both t values, varied inputs and initial crashes. |
| Ballots | 2,160 runs | Distinct promise/vote quorums, highest accepted value at prepare quorum, monotone promises, agreement of all chosen values and eventual completion of the declared stable finite runs. |
| Helping | 3,000 runs | No duplicate operation, exact accumulator state and sequence order at every frame, n+1 own-loop bound, and completion of every nonhalted invocation. A halted invocation need not be threaded after all correct operations finish. |
| Sperner | 2,400 meshes | Independent boundary 0/1-edge parity count and cancellation of interior edges agree with direct fully labeled triangle count. |

`/tmp/wave5-dist-review-midpoint.mjs` and its log independently use BigInt dyadic numerators, rather than floating averaging, for all integer Byzantine report pairs in [−20,20]. All 1,681 cases and 60,516 output coordinates match exactly through twelve rounds; the exact spread satisfies the halving bound. This checks the declared three-correct/one-equivocating-sender model, not an unspecified general-n implementation.

The focused author suite was also run independently with Node22: 17/17 groups pass (`/tmp/wave5-dist-review-focused-tests.log`). It supplements, rather than supplies, the independent oracles above.

These finite checks are evidence about the implemented models. They do not prove wait-free impossibility, probabilistic termination, Ω membership of an unknown observed history, or all possible executions of the general protocols.

## Findings and disposition

1. Fixed: two 2D timeline calls used the Stage3D-style array argument for `line`. The author changed them to 2D paths.
2. Fixed: the two-generals argument initially deleted a nonexistent last message of an unrestricted all-delivered infinite sending execution. It now first truncates after a finite decision round, explicitly permits silent infinite loss tails, and only then removes last deliveries.
3. Fixed: Aspnes's elementary weak adversary cannot observe message contents. Merely being unable to predict future coins also describes the strong adversary; the statement now explicitly names the required message-content restriction.
4. Fixed: changing native results are now checked against the model, rather than only static phrases. The reviewer independently reran all 60 settings with those assertions. Three-phase player First/Next/End-scrubber clicks assert displayed rounds0/1/12 and the serialized step index; actual Share replay preserves a nonfinal round1.
5. Fixed before freeze: the TAS display now retains the real bit0→1, rather than a winner process ID. Its grouped immutable-proposal read and restricted interleavings are explicitly scoped. Ω omits fictitious outputs on the initially crashed process.
6. Fixed: at 320 px and round 12, timeline initial rings covered process-label digits. Fixed CSS-pixel label space now replaces the shrinking data-coordinate offset. The reviewer independently reran all twelve layouts of consumers 3/5/6, including the joint f=3/round=4 saved state; actual glyph/halo-to-ring separation is at least 14.560043 px.
7. Fixed: restoring the original FLP paper introduction only in the syllabus would not ship it, because the loader skips a written item's syllabus row. The authored Paper now also has `introduces: ['dist-5.7']`, with exact preservation assertions. Production fixture metadata includes `intro`, year and authors. Eight fresh metadata layouts verify both relationship headings, actual target IDs, visible chip bounds and complete page bounds.

## Independent native and visual evidence

The reviewer copied the frozen runner into `/tmp/wave5-dist-review-browser.mjs`, changed imports/output path only, checked every frozen hash before and after execution, and ran `DIST_FAST=1` on Node22 in one reserved browser lane. Every navigation includes a unique `qaVisit`, forcing a cold document and avoiding reused-route retained-mode evidence. Chapter metadata is injected in memory into the actual production renderer; generated files are untouched.

`/tmp/wave5-dist-review-native.log`: **60 layouts, 1,504 physical actions, 320 actual URL replay/rejection checks, exit0**. Actual widths 1200/320 and both themes; every mode's visible slider Home/End, intermediate physical edits, integer rejection, continuous off-grid saved states, malformed/out-of-range state rejection and real Create-state-link restoration. All items compare changing live values with their reviewed transition model. Tiny positive/negative report values in 14 are preserved through actual Share reopens. The full dot/ring minimum was 5.618421052631589 CSS px; glyph/halo minimum 3.1156234741210938 CSS px. Finite path/circle/rectangle stroke bounds pass separately. Complete rich-text, control, displayed formula, citation and readout scroll bounds pass; no runtime/TeX errors or page overflow. This run nevertheless exposed the separate visual-overlap finding, so it alone is not acceptance.

All 30 independently captured cold narrow full pages were personally inspected at `/tmp/wave5-dist-review-production/dist-5.N-{light,dark}-320.png`, with contact sheets `/tmp/wave5-dist-review-defaults-0.png` through `-7.png`. The authentic narrow FLP paper card, theorem/scope distinction, final proof prose, complete readouts and default modes are visible. Also inspected the author's 224 default/mode/player images in both widths/themes via `/tmp/wave5-dist-gallery/{320,1200}-00…13.png` and selected full-sized figures. Gallery paths may cache older same-path previews; the reviewer's fresh full-page defaults are authoritative for cold-default assessment. The versioned final gallery at `/tmp/wave5-dist-gallery-final-v2/manifest.json` resolves cached-path ambiguity; its changed timeline sheets were independently inspected in both themes and widths, along with the reviewer's new final full pages.

Final independent replacements and closure:

- `/tmp/wave5-dist-review-timeline-native-final.log`: **12 layouts, 248 physical actions, 68 actual URL replay/rejection checks**, exit 0. Includes the explicit f=3/round=4 real Create-link case, all modes/endpoints, nonfinal three-phase player restoration, complete ink/text/readout bounds and measured label/ring separation. Minimum marker/ring clearance 5.773810 px, glyph/halo clearance 6.228239 px, label-to-full-ring gap 14.560043 px. These replace the affected twelve settings of the earlier sixty; they are not additional unique chapter layouts.
- `/tmp/wave5-dist-review-paper-final.log`: **8 metadata layouts**, exit 0. Actual 1200/320 widths in both themes for 5.7 and 5.15; exact introduction targets and visible chips asserted. Personally inspected the final narrow genuine citation, new header attribution, “Introduced here” and reciprocal “First published in” links. Earlier physical-control/Share checks for these unchanged models remain valid.
- `/tmp/wave5-dist-review-primitives-final.log`: **28,000 additional independent primitive prefixes**, checking real TAS bit transitions and winner/loser return values, CAS sentinel/proposal state and deliberately invalid extensions. The final 17-group focused suite passes again, including authored-versus-syllabus paper preservation (`/tmp/wave5-dist-review-math-final.log`).

All seven author freeze hashes matched before and after the final metadata run. The accepted manifest is copied to `/tmp/wave5-dist-review-final-freeze.sha256`; the initial sixty-layout manifest is separately retained at `/tmp/wave5-dist-review-native-initial.sha256`. Final replacement pages are under `/tmp/wave5-dist-review-timeline-final` and `/tmp/wave5-dist-review-paper-final`. All reviewer browsers and local servers are **CLOSED** and the lane is released. No global build, full suite, Git operation or shared edit was performed; root owns integration.
