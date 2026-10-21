# LADR 2.22 — exchange proof and fixed-ambient illustration

Accepted as the second curated flagship proof after independent source/proof, mathematical, native-input and screenshot checks. This item had no pending Wave3–4 source flag; curation does not close a queued review.

Scope is only item 2.22 in `content/ladr/ch02.js`, its one syllabus row,
`content/ladr/exchange-audit.js`, two explicit test scripts, and this report.
The chapter's existing private scene/math helpers and every other item are
preserved. No shared runtime, renderer, curation registry, verifier, ledger,
Git state, default-glob wiring, full build or generated data was changed.
The item's absent `verify` metadata is preserved as directed by the parent;
flagship acceptance/registry work belongs to the parent. The syllabus was
edited only after the parent released it following its separate 2.30 audit.

## Actual author source and prerequisites read

Sheldon Axler, *Linear Algebra Done Right*, fourth edition, actual author
PDF revision 16 August 2026, from [the author's book](https://linear.axler.net/LADR4e.pdf).
The cached source is `/tmp/atlas-flagship-axler4e-20260816.pdf`, SHA256
`1207d90a1310e79dea2ec3068f853e20b8306928eda122ae13fdfab50f41ea08`.
Printed p.35 is PDF p.49: the complete 2.22 statement and both proof steps
were read, including why the first inserted nonzero u cannot be the deleted
entry, why the current independent u-prefix excludes all u deletions, and
why a remaining original w must exist at every step. The rendered page
`/tmp/atlas-flagship-exchange-source-049.png` was inspected as well as the
extracted text.

Also read the actual definitions 2.4 (printed p.29), 2.9 (p.30), 2.15
(p.32), 2.17 (p.33), and complete 2.19 lemma/proof (pp.33–34), including
its span-preserving deletion and empty-list/zero-space discussion. Actual
written atlas prerequisite statement/idea bodies 2.4, 2.9, 2.15, 2.17 and
2.19 were inspected. Existing direct dependencies 2.19, 2.15 and 2.9 are
retained; there is no new cross-field prerequisite or circular dependency.

The public theorem and proof are rewritten in our own words. The explicit
finite spanning list already forces finite dimensionality; no additional
assumption is needed. Empty cases are stated: m=0 is immediate; n=0 means
V={0}, hence m=0 for an independent list. The proof invariant is a list of
length n, spanning the original V, with the inserted u-prefix first. Each
insertion makes the list dependent. Lemma 2.19 supplies an entry in the
span of its predecessors; the independent prefix excludes a u, so deletion
removes a different original w and preserves the span. Thus m insertions
consume m distinct members of the original n-list. Choosing the *first*
dependent prefix is one valid choice under 2.19, whose proof need not use
that specific choice.

The former Grassmann/Steinitz date credit was unsupported by an original
source read in this audit. It was removed, with an author-proof reference
and direct source link retained. This is source attribution, with no new
historical priority assertion.

## Reproduced defects and repairs

The old initial note assumed dragged W still spanned R³. Its insertion
note could therefore incorrectly claim an outside u was already in that
span, and subsequent notes claimed an invariant that was not established.
The model now fixes V=R³ and checks W before allowing an insertion. A
rank-deficient W stops explicitly; it is not silently reinterpreted as a
different ambient vector space.

The old dependent-U note said “m vectors in R³ never are” independent even
for m=2 or 3. Zero u₁ and parallel u₁/u₂ are now offered cases and stop at
the actual first dependent prefix with its computed relation. A separate
statement about all four-vector lists in R³ is used only for m=4.

A preliminary concern about a *reachable* null-dependence dereference was
corrected before implementation: all offered n are at least three, so an
inserted n+1 list in R³ is dependent even if W did not span R³. That concern
is **not** claimed as a reproduced user-state crash. The new helper still
has a defensive uncertain/no-reliable-certificate stop, tested by injected
solver failures, rather than dereferencing a missing relation.

The old four-decimal coordinate signature could leave sufficiently small
changes stale. Trace snapshots now retain complete numeric coordinates and
are rebuilt on input and from an unrounded signature. A scoped state
adapter restores all five W and four U vectors (including hidden entries)
and the actual camera yaw/pitch, then rebuilds before the saved step is
restored. Generic projected 2D handle state is insufficient for this opaque
3D scene. The old shared scene helper remains unchanged.

Native mobile checking exposed ambiguous input at nearly coincident
projected tips. A local “tip to drag” selector can isolate each named
handle without changing its vector or the other drawn geometry. A target
outside the chosen list length is explicitly identified as inactive. This
allows zero/parallel cases and each of the nine offered tips to remain
operable without modifying shared hit testing.

## Bounded numerical model and complete records

All n=3,4,5 and m=2,3,4 choices remain: nine size combinations. Five
starting cases offer valid lists, parallel u's, zero u₁, nonspanning W and
near dependence. Every vector tip is confined to the closed radius-2 ball.
The complete coordinate arrays and all coefficient/partial-sum records are
retained; readout values are explicitly rounded to six significant digits,
while replay retains full numeric values.

The isolated helper uses the runtime M.svd/M.lstsq APIs. Each nonzero column
is normalized first, so changing only a vector's nonzero length does not
change its rank test. Singular values at most 1e−12 times the largest are
treated as dependent; values strictly above 1e−7 pass independence. The
intermediate interval pauses the model instead of asserting exact rank.
Nonzero inputs smaller than 1e−150 also pause before unsafe normalization.
Zero columns have a valid empty/zero relation. Relations must have finite
coefficients/partial sums and relative reconstruction residual ≤1e−10;
absolute and relative residuals are shown. These are floating-point tests,
not symbolic proofs or a decision procedure for all real rank questions.
The theorem and author proof have no tolerance.

Every successful insertion has a separate dependent-list frame, certificate
frame and span-preserving deletion frame; a final frame counts distinct
original w indices. Hypothesis failures and uncertainty are complete
terminal frames. Whole certificates, including intermediate partial sums
that exceed the original vector ball, determine the fitted view. The view
radius is reported. Large relations may shrink the original-vector drawing;
no coefficient or partial segment is clipped away to avoid that cost.

Vector names at nearly coincident projected tips are grouped, with scoped
side/row placement and leaders for displaced name groups; full separate coordinate records
remain in the readout. Current-list and removed-vector records wrap as
ordinary text, replacing the old unwrapped canvas chip row. Scoped
pseudocode wrapping preserves all text on 320px. Plot fitting leaves space
for vector strokes, arrowheads, rings, handle halos and labels.

## Validation

`node --test tests/verification-ladr-exchange-model.mjs`: six groups pass,
log `/tmp/atlas-ladr-exchange-model.log`.

- All nine default size combinations and all 4,608 combinations from
  512 seeded rational list pairs × nine sizes are checked against an
  independent exact-BigInt minor-rank reference. It independently determines
  first dependent prefixes, rank, and the allowed number of exchanges.
  Every insertion/certificate/deletion/final frame is checked, including
  complete coefficient reconstructions and all partial sums, constant span,
  list length, original identity, and distinct-w deletion.
- Zero/parallel U stops at its real prefix; rank-deficient and empty W never
  insert an outside u. Empty U completes without an exchange in spanning W.
- Independent nonzero column scales down to 1e−100 preserve the rank test;
  a 1e−9 near-dependent perturbation pauses while a 1e−5 perturbation passes.
  Unsafe tiny inputs, numerical gray zones and injected absent/inaccurate
  certificates stop safely. Snapshot coordinates do not follow later caller
  mutation.
- Vector/camera schemas reject sparse, nonfinite, malformed, out-of-ball and
  out-of-angle values; preset copies remain independent.

`node tests/verification-ladr-exchange.mjs`: **eight groups pass** — four
main groups and four strengthened corner groups, at 1440px and 320px in
both themes. Log `/tmp/atlas-ladr-exchange-native-final.log`.

The four main groups each traverse all five starting cases × nine size
combinations, including every one of the 246 proof frames (984 main-frame
checks overall). Rendered trace inventories, vector records, coefficients,
partial sums, frame phases, list lengths and readouts match the independently
math-checked helper. Actual named-tip drags verify each of the nine vectors
moves and reaches its radius-2 bound. The tip selector also makes otherwise
nearly coincident handles individually accessible. An actual background
rotation changes camera state. Every preset, a nondefault proof step, edited
vectors and camera are reloaded from a full snapshot; vectors, frame,
readout, note and complete drawing records agree exactly. A 1e−6 coordinate
edit is retained. Malformed vector/camera/preset state rejects and remounts
complete defaults, including controls. First/previous/next, Home/End,
scrubber and play/pause navigation are exercised.

The four corner groups add all nine zero tips, all nine collinear tips,
and a well-resolved relation with coefficient magnitudes about 100,000 and
large intermediate cancellation. In the chosen extreme camera view its
fitted radius is about 140,000; its relative reconstruction residual is
about 1.46e−11, below the displayed 1e−10 criterion. The full partial-sum
path is retained even though original unit vectors then appear tiny.
Canonical camera endpoints ±π yaw and ±1.45 pitch replay, and selecting a
named vector outside the current list length explicitly leaves no active
tip instead of dragging another vector.

Every main/corner check measures complete finite vector/relation/leader
strokes, arrowheads, rings, handle halos and actual font-ready glyph boxes.
Glyph halos are checked against one another and against markers, not only
against canvas edges. Full TeX, note, pseudocode and readout bounds, internal
overflow, page width and errors are checked. The collinear fixture exposed
a real one-column label fallback defect: several names piled at its top.
Scoped side placement and leaders fix this without changing the shared
scene. The all-zero fixture also exposed a marker crossing a name row;
placement now reserves actual marker space. Adaptive local coordinate axes
keep labels spread at the fitted certificate scale. No missing coefficient,
vector or relation segment is hidden to pass the bounds checks.

The extra `node tests/verification-ladr-exchange.mjs --corners-only` mode
provides a short focused replay of the four corner groups. Its passing log
is `/tmp/atlas-ladr-exchange-corners.log`; the final default command includes
both main and strengthened corner groups against the final implementation.

Screens were regenerated under
`/tmp/atlas-ladr-exchange-{initial,valid,parallel,zero,flat,near,dragged,bounds,coincident,collinear,cancellation}-{1440,320}-{light,dark}.png`,
with corresponding `-panel.png` crops. Inspected narrow light parallel
(full page), narrow light near-dependence panel, wide light radius-bound
panel, narrow dark zero (full page), wide dark nonspanning W (full page),
narrow dark dragged panel, narrow dark coincident and collinear panels,
narrow light cancellation (full page), and wide dark cancellation panel.
Labels, source prose/math, controls and data remain readable and within
bounds. The large-certificate scale limitation is visible and reported.

Fixtures wait for `document.fonts.ready` and explicitly invalidate before
canonical comparisons. This is font-ready/reinvalidated evidence, not a
claim about initial cold-font behavior. The parent-owned font-ready runtime
fix is present (core SHA256
`a6fa1753d9d9e8b9a05a7161fffc58dfd53b27002d9d393a3266aeb96515fe73`).

`node scripts/check.mjs ladr-2.22 --static`: one item, zero errors/warnings.
Module syntax and scoped trailing-whitespace checks pass. Final six-path,
source/runtime and validation-log SHA256 values are frozen in
`/tmp/atlas-ladr-exchange-manifest.json`. All sixteen protected map files
match their retained manifest. Earlier candidate game 3.11 hashes have been
intentionally superseded by the parent's accepted 7ee82f3 review/repairs;
none of those files was edited by this audit. All browser/server processes
from this work are closed at handoff. Parent acceptance and registry update
remain separate.

## Independent flagship acceptance

Root read the complete actual author p35 statement/proof and inspected its PDF49 image, confirming the invariant, exclusion of the independent u-prefix and distinct original-w removals. The earlier basis-curation review had already read the actual2.19 source proof. For this audit root read the actual written2.9,2.15 and2.19 statements/arguments, the complete final item, new helper, model/native tests and the one-sided Jacobi SVD/least-squares code it uses. Finite spanning already implies finite dimensionality; empty-list/zero-space cases are correctly included.

Root independently checked the normalized rank policy, uncertainty/residual stops, finite relation records and frame invariant against the exact-minor reference, then reran all6 model groups through the new ordinary-test wrapper and all8 native groups (4main+4corners), all exit0. Scoped static reports1item,0errors/0warnings. Logs: `/tmp/atlas-root-ladr-exchange-{math,native,static}.log`. The final note explicitly calls a numerical dependent-U stop a numerical check, preserving the formal theorem/model distinction. No shared runtime/SVD or scene helper was changed.

Root inspected the complete320px light parallel-U and large-cancellation pages plus the320px dark collinear panel. The tests retain the entire large relation and actual vector/camera/step state; its scale/residual limitation is visible, not hidden. Byte guards preserve the chapter helper prefix except the isolated import/separator, every other object, every other syllabus row and accepted2.30. The absent source flag remains absent. The registry now records2/100 curated proofs, with item/helper/math/source identities and exact evidence links; the historical102-player control inventory remains separate. The last complete1,566-test checkpoint predates these6 new default groups and is not relabeled as a later full run.
