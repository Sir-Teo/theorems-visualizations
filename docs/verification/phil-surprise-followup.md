# Philosophy 4.8: surprise examination and a declared finite information model

Status: **resolved: phil-4.8**. Independent parent source, mathematical, native-browser and final-image checks pass; source flag and central queue are reconciled in the integration commit. Changes are limited to item4.8/import, its syllabus row, an isolated helper, two tests and this report. Committed4.7 and all demo work are preserved. No Git mutation, central ledger/plan, generated data, build or shared renderer/control change was made.

## Source actually read

**Timothy Y. Chow, “The Surprise Examination or Unexpected Hanging Paradox,” American Mathematical Monthly105 (1998),41–51; actual author preprint arXiv:math/9903160v2,29April2000.** The publicrefs/credit identify both publication and the particular preprint actually used.

- Accessible PDF: https://courses.csail.mit.edu/6.042/spring15/surprise-paradox.pdf
- Version-specific source link: https://arxiv.org/abs/math/9903160v2
- Retained `/tmp/atlas-phil-chow1998.pdf`,19PDFpages, SHA256 `5ae90b162db68b2feb45f93e8d9a4a6d43169c03417c17c8dc3d2657edf11703`.
- Complete navigation extract `/tmp/atlas-phil-chow1998.txt`, SHA256 `99227865dddb7f28dd8979a5085103b8e075ed57053e6271aa478775a56603fc`.
- Read complete §§1–4, PDFpages1–12: the informal argument and meta-paradox; the logical school's distinct announcement/assumption choices; its formal self-reference argument and qualifications; the epistemological school's explicit two-day knowledge axioms, knowledge-retention alternatives and qualifications; the game-theory analogy and the final conditional-probability discussion. No full19-page or exhaustive-bibliography reading claim is made.
- Inspected actual page8 knowledge-axiom/proof and page11 conditional-probability discussion images: `/tmp/atlas-phil-chow-page-8.png`, `/tmp/atlas-phil-chow-page-11.png`. The text extraction loses some mathematical glyphs, so these actual images were used for the relevant passages.
- Chow §1 emphasizes that formalization matters; §2 distinguishes what follows from the bare exam-occurs premise from what requires assumptions about deducibility from the announcement itself. §3 presents one epistemic formulation with a particular mutually inconsistent assumption set, rather than a universally agreed diagnosis. The revised item fairly reports this distinction and does not declare one accepted resolution of all formulations.
- The final §4 passage discusses conditioning on no earlier quiz and certainty on the last day, using a Shannon-surprise optimization attributed there to Narveson. **This implementation does not claim to reproduce that optimization, its numerical optimum, or an expected1−credence score.** Its optional no-exam outcome and finite support-based certainty convention are expressly authored extensions. The conditional-probability calculation is derived independently below.
- The source's informal story uses the previous night; this illustration chooses a morning checkpoint before that day's exam could occur, with only absence of exams on earlier days observed. That time/information convention is explicit, and no extra overnight signal is assumed.

Removed unread1940s-priority and Kritchman–Raz2010 attribution/technical-link claims. The publisher PDF attempt returned403, and no reading of that paper is claimed or needed for the retained content. No quotations or original-specific numerical beliefs are copied into the item. No claim about a current universal philosophical consensus is made.

## Actual prerequisites

Read the authored bodies before editing metadata:

- `phil-1.1`, validity and soundness: distinction between a valid consequence and the truth/availability of its premises. This is load-bearing for the difference between editing an assumed model and proving an inference from an unchanged announcement.
- `prob-4.1.1a`, conditional expectation: its explicit finite positive-mass partition formula supplies the elementary conditioning rule for an exam-day indicator on the surviving-history cell. The general measure-theoretic results are not used.
- `phil-4.1`, strengthened liar/T-schema/revenge: useful comparison for self-reference, but no T-schema is used in this finite Bayes calculation. Moved to `see` instead of retaining it as the sole prerequisite.

Chapter and matching syllabus row agree on `deps: ['phil-1.1','prob-4.1.1a']` and `see: ['phil-4.1']`. No prerequisite item was edited.

## Declared finite model and proof

The six worlds are an exam on days1…5, or no exam that week. There is at most one exam. Nonnegative public weights `w_1,…,w_5,w_none` are supplied independently before the week and normalized by their positive total T. A zero weight removes that world from this model's possibilities. The learner knows this fixed prior, remembers the absence of earlier exams and receives no other information.

On morning d, before a possible exam that day, the observed event is

`E_d = {exam on d,…,exam on5,no exam}`.

When its mass is positive, the posterior is the prior restricted to E_d and renormalized, and

`h_d = w_d / (w_none + Σ_{j=d}^5 w_j)`.

“Certain today” means **every positive-weight surviving world is today's exam**. It is a declared finite support convention, not a general identification of psychological surprise, probability and knowledge. No higher-order knowledge axioms, self-referential guarantee or announcement-truth update are silently added.

If an exam is guaranteed (`w_none=0`) and at least one exam weight is positive, let L be the largest supported day. The only surviving world in E_L is exam-on-L, so h_L=1. That world has positive prior mass. Thus no nonempty finite prior with this information rule can both guarantee an exam and have an uncertain exam in every supported exam world. The model computes the exact before-week mass of worlds where the exam is already certain at its own morning checkpoint; with no-exam mass0 it is p_L.

If `w_none>0`, every supported exam day's history includes the no-exam alternative, so none is certain. This is an explicit counterexample after relaxing the exam-occurs premise, **not** a fulfillment of both parts of the original announcement or a resolution of its epistemic/provability formulations.

Three zero cases are distinct:

1. All six weights zero: T=0, so no prior distribution exists. This is an invalid setting, not proof that the teacher's announcement is contradictory.
2. Positive total but zero E_d mass: a no-earlier-exam history impossible under the specified prior. Posterior/h_d are undefined (`null` in helper), not zero. The chart says so and draws no probability bars for that panel.
3. Only no-exam weight positive: a valid distribution; all morning histories are possible, all posterior mass is on no exam, and today's exam probability is zero.

Removing the latest supported exam day changes that day's weight to zero and normalizes the **new prior**. It does not constitute learning that the unchanged original plan excluded that day. Repetition exhausts the exam weights in at most five edits; if no-exam mass was zero the resulting distribution is invalid, while positive no-exam mass leaves a valid no-exam-only distribution. These are labeled before-week prior edits, not the students' logical backward induction.

## Implementation

- Six accessible integer relative-weight sliders0…20 and a morning1…5 slider replace draggable bars with hidden thresholds/snap rules. All normalization uses actual weight values. Support and certainty use exact zero tests, not epsilon cutoffs or rounded h labels.
- Previous/Next morning buttons explore the five explicit no-earlier-exam conditionings and disable at the actual endpoints.
- Presets distinguish uniform guaranteed exams, an explicit no-exam possibility, and all-zero undefined weights.
- The latest-day removal button names exactly its actual prior-edit operation.
- Prior and posterior each show the same six labeled worlds; past exam worlds have zero posterior mass, the selected day's bar is outlined, and no-exam mass is purple. Fixed padded views contain all probability bars, strokes and labels, including probability1.
- Undefined panels display their mathematical reason. Readouts state which exam-occurs premise is in force, the history mass, today's conditional probability and support certainty, plus the before-week certainty-event mass.
- Removed the old expected1−credence “surprise” score, the rounded-to1/no-surprise test, different support cutoffs and the claim that empty weights establish the original announcement's inconsistency.

## Independent mathematical evidence

Command:

```sh
node --test tests/verification-phil-surprise.test.mjs
```

`/tmp/atlas-phil-surprise-math-final.log`: **4groups pass**, actual session15225exit0 (also ran its following static check). Draft first ran under`/tmp` and was installed into the default test glob only after passing.

- All729six-world patterns with each weight in{0,1,20}, at all5mornings:3645cases. A separate enumeration of six outcome worlds independently computes posterior/history mass and quantifies certainty over surviving positive worlds; no helper tail routine is reused.
- Every integer magnitude0…20 in every pair of the six weights, with a heterogeneous background, at all5mornings:33,075additional reference comparisons. Test normalization, the identity `P(E_d)×P(world|E_d)=P(world)` for surviving worlds, scale invariance, and successive elimination/conditioning across mornings. These comparison cases include overlaps; no claim of36,720unique complete control settings is made.
- Every nonempty exam-support subset with no-exam mass0 verifies its actual last-day certainty theorem. Adding positive no-exam weight verifies the premise change and loss of certainty. Explicit invalid/unreachable/no-exam-only examples and uniform Friday h=1 versus h=.5 are separate.
- A tiny positive no-exam weight that may round h to1 numerically still yields `certainToday=false` and zero certainty-event mass. Certainty therefore depends on support, not display rounding.
- For all32exam-support patterns and no-exam weights0/1/20, removal changes only the latest positive exam weight, preserves no-exam mass and exhausts in exactly the count of supported exam days. Invalid shape/negative/NaN/day inputs are rejected.

The all-finite-support theorem is the direct latest-day proof above; tests supply independent reference and implementation evidence, not an infinite conclusion from enumeration.

## Native browser and visual evidence

Command:

```sh
node tests/verification-phil-surprise.mjs
```

Final `/tmp/atlas-phil-surprise-native-final-text.log`: **4groups pass** at1450/430pixels × light/dark, actual session**36462exit0**, browser closed in`finally`. This is a complete rerun after the final opening-announcement timing clarification, not an earlier-layout result.

Each group checks:

- All64support corner patterns with weights0/20 at all5mornings:320states, including empty/guaranteed/no-exam-only/unreachable histories.
-15additional heterogeneous weight/morning cases with actual unequal posterior probabilities.
- NativeHome/End/ArrowLeft on all7sliders, actual0/20/19weight values and1/5/4morning values, and coherence of actual input, internal value, output and legal min/max.
- All forward/backward morning steps and their endpoint-disabled buttons. Uniform guaranteed Friday yields h=1 and “certain”; the no-exam preset Friday yields h=.5 and “not certain”.
- Both five-step removal sequences with no-exam weights0 and1, exact single-weight mutations and idempotence after exam weights are exhausted. All presets genuinely set the model.
- Independent six-world reference calculations for the entire prior/posterior, every displayed bar, all numeric labels/readouts, history probabilities and certainty mass. Both undefined panels have explicit diagnostic text and no fabricated probability bars.
- Every rectangle half-stroke and all measured canvas text fits; no display-TeX/page overflow or browser/TeX errors occurs.

A preliminary reused harness banned the literal word “undefined” and failed on the **intentional mathematical undefined-history explanation**. The harness now permits that word while explicitly asserting null quantities and the required explanation for the precise invalid/unreachable states. It still rejects NaN/Infinity and checks all defined probabilities independently. No production behavior was changed to conceal an undefined case. A complete four-group run then passed; a later prose clarification received the final complete rerun above.

Screenshots inspected as actual pixels, with final regenerated files:

-`/tmp/atlas-phil-surprise-guaranteed-friday-430-light.png`: full mobile prior, probability1posterior and all controls/readouts.
-`/tmp/atlas-phil-surprise-guaranteed-friday-430-dark.png`: final full mobile dark, including the clarified announcement and support claim.
-`/tmp/atlas-phil-surprise-unreachable-430-dark-panel1.png`: native-size zero-history explanation.
-`/tmp/atlas-phil-surprise-no-exam-friday-430-dark-panel1.png`: native-size .5/.5 exam/no-exam split.
-`/tmp/atlas-phil-surprise-undefined-prior-430-light-panel0.png`: native-size undefined prior.
-`/tmp/atlas-phil-surprise-no-exam-friday-1450-dark.png`: full desktop dark, both distributions and all controls.

Static:

```sh
node scripts/check.mjs phil-4.8 --static
```

`/tmp/atlas-phil-surprise-static-final.log`:1item,0errors,0warnings; session53082exit0. Its following read-only comparisons prove all neighboring objects, including committed4.7, unchanged againstHEAD and syllabus unchanged outside4.8. The only added chapter import is the isolated surprise helper. `git diff --check` is clean.

## Frozen paths

-`content/phil/ch04-b.js`: only4.8object and its helper import.
-`content/phil/syllabus.js`: only4.8row.
-`content/phil/source-audit-surprise.js`.
-`tests/verification-phil-surprise.test.mjs`.
-`tests/verification-phil-surprise.mjs`.
-`docs/verification/phil-surprise-followup.md`.

Flag remains true pending parent review. The retained prose, finite support model and its explicit limitations are source-backed and independently checked; no unread historical/priority claim or claim of a general resolution is used for closure.


## Independent parent acceptance

Root read the complete actual Chow preprint§§1–4 (PDF1–12), including the distinct bare-premise/self-reference formalizations and knowledge/retention qualifications; actual pages8 and11 were visually read to recover mathematical glyphs absent from extraction. The version/publication distinction and narrower authored morning checkpoint are explicit. No original historical-priority, Shannon optimization reproduction or universal philosophical-resolution claim remains. Root read actual phil1.1 validity/soundness and prob4.1.1a finite-partition conditioning statements/proofs.

Root independently derived the six-world posterior, exact-support certainty, latest-supported-day result, no-exam counterexample and separate invalid-prior/unreachable-history cases. The complete helper, four-group mathematical suite, full native script and complete item were read. Root reruns pass **4 mathematical groups**, **4 native viewport/theme groups** and static **1 item,0 errors,0 warnings**. Logs `/tmp/atlas-root-phil-surprise-{math,native,static}.log`; native36573/static26366 exited0 and closed. Mathematical comparisons enumerate36720cases with an independent world-filter construction, plus scale/sequential-update/support/removal checks. The native evidence covers every64support corner/five mornings, heterogeneous states, all7actual slider endpoints/increments and both five-edit removal sequences, with full plotted/readout/control bounds.

Root inspected the final full430px dark guaranteed-Friday page, exact.5/.5 no-exam posterior, light unreachable-history panel and undefined-prior panel. Probability1 and all labels/strokes fit. Guards confirm the entire earlier chapter prefix (minus only the new isolated import) and suffix from4.9 onward are byte-identical to HEAD, including accepted4.7. Only4.8/import and its syllabus row are staged. Queue credit is one original flag; the1520-test checkpoint remains the earlier accepted24abff6 snapshot.
