# Representation theory: characters — 2026-10-17

Resolved eight queued reviews: `rep-3.4`, `3.5`, `3.6`, `3.7`, `3.8`, `3.9`, `3.12`, `3.13`. Six representation-theory reviews remain open. The total source queue is **809**; the Wave 5 gate remains closed.

## Primary-source evidence

Compared the statements and proofs directly with Serre, *Linear Representations of Finite Groups* (1977), and the author-hosted Etingof et al., *Introduction to Representation Theory*. Printed page numbers differ from PDF page numbers. The publisher [Serre edition record](https://link.springer.com/book/10.1007/978-1-4684-9458-7?page=2) identifies the edition; the inspected [book scan](https://ebooks.karbust.me/Mathematics/Jean-Pierre%20Serre%20-%20Linear%20Representations%20of%20Finite%20Groups%20%281977%29%20%5B978-1-4684-9458-7%5D.pdf) has 178 PDF pages. [Etingof's author-hosted book](https://math.mit.edu/~etingof/reprbook.pdf) has 235 PDF pages. SHA-256 hashes of the downloaded sources:

- Serre: `b6c0432dfc882618110c25a489c8fa0d93f1e64da4fba4950eb90c1b8348dcc2`
- Etingof et al.: `ff004d17471bbd344f6c33e6fb9964d49affbf5f111d65167935d7087ece1443`

| Items | Checked source anchors | Conclusion |
| --- | --- | --- |
| 3.4–3.5 | Serre §2.3, printed p.15/PDF p.24, Theorem 3; Etingof §4.5, printed pp.67–68/PDF pp.75–76, Theorem 4.5.1 | Hermitian inner product, class-size weights and conjugation are essential. Orthogonality holds over the complex numbers. |
| 3.6–3.7 | Serre printed p.16/PDF p.25, Theorem 4 and Corollaries 1–2; §2.2, printed pp.13–15/PDF pp.22–24 | Inner products recover multiplicities; characters determine semisimple complex representations. Averaging an arbitrary matrix need not yield an invertible witness. |
| 3.8 | Serre Theorem 5, printed p.17/PDF p.26; Etingof Theorem 4.5.1 | The norm is the sum of squared multiplicities. Include zero representations: nonnegative, positive only for nonzero representations. Schur's lemma also gives the endomorphism dimension. |
| 3.9 | Serre §2.4, Proposition 5 and Corollaries 1–2, printed pp.17–18/PDF pp.26–27 | Regular character, multiplicities equal to degrees, and sum of squared degrees. |
| 3.12 | Serre §2.6, Theorem 8, printed p.21/PDF p.30; Etingof Problem 4.5.2, printed p.69/PDF p.77 | Character-weighted central idempotents give the canonical isotypic projections. |
| 3.13 | Serre §2.2, Corollaries 2–3; Etingof Proposition 4.7.1, printed p.72/PDF p.80, and Theorem 4.6.2, printed p.71/PDF p.79 | Coefficient orthogonality requires orthonormal bases for invariant Hermitian forms; arbitrary coordinate changes need not preserve it. |

Rendered and inspected the Serre inner-product page and Etingof coefficient formula to verify conjugation bars and indices rather than relying on extracted text. Removed unverified historical priority/date credits from these eight entries, and replaced uninspected secondary references with the checked source anchors. The separate Frobenius historical-paper entry remains flagged.

## Corrections

- **3.4:** Q8's second computation now genuinely sums over elements through their class indices; previously it repeated the class-weighted calculation. The hypotheses now explicitly specify a finite group.
- **3.5:** The proof chooses unitary bases; the mosaic description specifies the real part of a product, including complex-character examples.
- **3.7:** Restricted the statement to complex representations. Distinguished existence of an isomorphism from a successful particular averaged matrix. Added a zero-matrix control, evaluated actual invertibility, and corrected the text for inconclusive averages. Reducible nonisomorphic representations can share constituents and have nonzero singular intertwiners; the proof no longer implies otherwise. Plot extents adapt to all displayed transformed polygons.
- **3.8:** Included the zero representation in the norm statement. Increased the multiplicity sliders' upper bound to 5: the conjugation preset has multiplicities `(5,1,3,2,2)`, degree 24 and norm 43; previously its first slider displayed a clamped value inconsistent with the computation.
- **3.12:** Simplified the trace argument for the projection scalar. Clarified that circle area represents absolute component value and a component vanishing for the chosen vector does not establish absence of that representation type. Extracted the character-weighted projection for direct checking.
- **3.13:** Corrected the basis-dependence wording and made the coefficient plot extent follow actual values. Shearing can produce coefficients larger than the old fixed vertical range.

## Independent and functional checks

The four added numerical regression tests in `tests/content-verification.test.mjs` check actual matrix products/traces and the full coefficient Gram matrices for S3, D4, D5, D6, Q8 and A4. Independently constructed permutation actions check every S4 and S5 character-table column: standard representations, sign, perfect matchings, two-element subsets and exterior squares. Regular multiplicities agree with degrees. The six cube-object characters are checked against independently known fixed-point counts, in class order `(e,(12),(12)(34),(123),(1234))`:

| Objects | Character |
| --- | --- |
| Four diagonals | `(4,2,0,1,0)` |
| Six faces | `(6,0,2,0,2)` |
| Eight vertices | `(8,0,0,2,0)` |
| Twelve edges | `(12,2,0,0,0)` |
| Three face axes | `(3,1,3,0,1)` |
| Six edge axes | `(6,2,2,0,0)` |

Fifty deterministic test vectors compare the six hexagon projections with independent discrete Fourier formulas, including the two absent one-dimensional types. Averaging tests cover the trace-scalar formula, a traceless/zero average for equal irreducibles, no-common-constituent zero averages and a nonzero singular average between reducible nonisomorphic representations.

Validation passed:

- `npm test`: 47 math, 20 science-kit, 40 content-verification tests. The augmented coefficient Gram assertions also pass in the final content-test run.
- `node tests/verification-representation.mjs`: 16 light/dark scenario groups covering all eight entries; actual menu, slider, button and table-canvas inputs. Includes all 30 cube object/class combinations per theme, all six regular/conjugation group choices, both coefficient groups with every sheared diagonal selection, zero/random averages, zero/maximal multiplicities and the conjugation preset. Instrumented plot coordinates remain inside their view bounds. No browser errors.
- Eight-item browser checks in each theme: no runtime, TeX, blank or quality warnings. Inspected screenshots of the conjugation multiplicities and the sheared coefficient table/plot.
- Strict build: 6,684 items and 6,890 planned items in 450 chapters, no warnings/errors. Full static check: 6,621 visualizations, no warnings/errors.
- Nine smoke routes: the chapter and all eight reviewed items, each with the expected title and no errors.

The theorem sources and independent checks support clearing only these eight flags.
