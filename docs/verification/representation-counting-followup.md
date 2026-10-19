# Representation theory: counting and real types — 2026-10-17

Resolved `rep-3.15`, `rep-4.1` and `rep-4.10`; corrected neighboring `rep-4.8` and `rep-4.9`. **806 source reviews remain**, including the Frobenius historical paper and the two molecular-symmetry entries. Subjective listening and the human sample remain pending. Wave 5 remains gated.

## Sources and conclusions

Used the same inspected Serre (1977) book scan and author-hosted Etingof book, with the exact source URLs and SHA-256 hashes recorded in [the character audit](representation-characters-followup.md). Checked the following additional pages directly:

| Entry | Source anchors | Supported claims |
| --- | --- | --- |
| 3.15 | Serre §2.3, Exercises 2.5–2.6, printed p.17/PDF p.26 | Fixed-point characters, invariant dimension, trivial multiplicity and orbit count. The elementary double-counting argument also follows directly from orbit–stabilizer. |
| 4.1 | Serre §3.1, Theorem 9, printed p.25/PDF p.34; Exercise 3.3, printed p.26/PDF p.35; §3.2, Theorem 10, printed p.27/PDF p.36; §5.1, printed p.35/PDF p.44 | One-dimensional irreducibles for abelian groups, products of cyclic characters, dual group and orthogonality. Clarified the cyclic-coordinate construction and the dependence of the displayed isomorphism on that choice. |
| 4.10 | Serre §13.2, Propositions 38–39, printed pp.108–109/PDF pp.116–117; Exercise 13.11, printed p.110/PDF p.118; [Etingof §5.1](https://math.mit.edu/~etingof/reprbook.pdf#page=101), printed pp.93–95/PDF pp.101–103 | Real, complex and quaternionic types; indicator from symmetric/alternating invariants; the count of elements squaring to the identity. The more general square-root expansion follows by computing each irreducible coefficient, including its complex conjugation. |

Removed unverified priority/date credits from these three entries. These ordinary theorem entries retain their mathematical names and precise checked references. This does not resolve the separate source-history review of Frobenius's original paper.

## Corrections and independent evidence

The indicator proof had identified invariant tensors with bilinear forms. It now uses the dual tensor space and the equality of trivial multiplicities under duality. Its class-function expansion now explicitly includes conjugation and uses the previously established reality of the indicator.

The bilinear-form solver misclassified the real sign character of C4. Its equations consisted of roundoff-sized residuals, and a relative tolerance based solely on those residuals treated them as genuine rank. Added a unit-scale floor to the constraint tolerance, preserving the nontrivial equations. The shared correction also repairs entry 4.9. Tests independently substitute each returned form into every matrix-invariance equation and compare symmetric-minus-alternating dimensions with indicators, before and after shear.

The neighboring exterior-power statement in 4.8 placed division by `1+t` inside the product over cycles; the implementation correctly divides only once. Corrected the displayed formula. Every cycle type through S6 is checked against traces of principal minors of actual standard-representation matrices, including the identity's binomial dimensions. This is a targeted formula correction, not a claim that every neighboring historical reference was re-audited.

Extracted the existing fixed-colouring/orbit enumeration without changing its mathematics. Independent checks cover every supported bead count (3–8), colour count (2–4), rotations/dihedral action, and the three cube colour counts: **39 configurations**. Rotation fixed points agree with gcd formulas; reflection/cube fixed points agree with permutation-cycle counts. A separate canonical-word enumeration verifies the necklace/bracelet orbit totals. Cube totals agree with its rotation cycle index: `(k^6 + 3k^4 + 12k^3 + 8k^2)/24`.

For all ten indicator groups, tests directly enumerate squares element by element, check the complex indicator sum, and reconstruct the square-root count on every element. Known real/quaternionic examples and all available invariant-form matrix solutions agree. All 36 abelian groups available in the two sliders pass every row-pair inner product and pointwise-product identity.

## Validation

- `npm test`: 47 math, 20 science-kit and **44 verification tests**, all passing, including sheared form constraints.
- `node tests/verification-representation-counting.mjs`: ten light/dark scenario groups, actual control and canvas inputs. Exercises all three colouring actions at slider endpoints, trivial/maximal abelian groups with repeated/distinct selected rows, every indicator group, every smaller-group irreducible at both shear endpoints, and exterior-power endpoints. No browser errors.
- Five-item light/dark browser checks: no runtime, TeX, blank or quality warnings. Inspected the cube-count summary, maximal abelian table and quaternionic indicator screenshots.
- Strict build and full static check pass: 6,684 items, 6,890 planned, 450 chapters; 6,621 visualizations; no warnings/errors.
- Seven smoke routes pass with expected chapter/item titles: chapters 3–4 and the three reviewed plus two neighboring corrected entries.

The three flags are cleared only for the source-backed entries above. Human/listening checks remain explicitly open.
