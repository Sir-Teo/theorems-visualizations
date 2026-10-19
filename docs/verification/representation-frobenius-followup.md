# Frobenius original-paper review — 2026-10-17

Resolved `rep-3.16`, the final queued representation-theory review. **803 source reviews remain** in the other collections. Wave 5 remains gated.

## Primary sources and exact anchors

Downloaded the July–December 1896 volume of *Sitzungsberichte der Königlich Preussischen Akademie der Wissenschaften zu Berlin* from its [Internet Archive record](https://archive.org/details/sitzungsberichte1896deutsch). Inspected the original articles, using PDF text/OCR to locate passages and rendered scans to verify critical formulas. The [790-page black-and-white PDF](https://archive.org/download/sitzungsberichte1896deutsch/sitzungsberichte1896deutsch_bw.pdf) has SHA-256 `18c41fd20e08f888d2272328f61d16df0f07934f1a48704054247f7afbbaa761`; the archive's [full-volume OCR text](https://archive.org/download/sitzungsberichte1896deutsch/sitzungsberichte1896deutsch_djvu.txt) has SHA-256 `e73a209ee6da8ef239c023449a5a99b3eba00b49ba28e6a21ec25b28ffee9793`. Printed labels and PDF ordinal pages differ, including a gap between the articles.

| Source passage | Printed pages | PDF ordinal pages | Finding |
| --- | --- | --- | --- |
| [Über Gruppencharaktere](https://archive.org/details/sitzungsberichte1896deutsch/page/985/mode/1up), title and introduction | 985–986 | 273–274 | Correct author/title/year/pages; Frobenius himself says Dedekind communicated the motivating question in April 1896. |
| Same paper, §§1–3 | 987–995 | 275–283 | Counts of products from conjugacy classes, commuting multiplication systems, character solutions, scale initially free, orthogonality and subsequent normalization. Page 995 announces additional arithmetic properties rather than presenting the unrestricted irreducible-factor theorem as already established here. Rendered this page to check the normalization formula. |
| Same paper, §§5–6 | 999–1006 | 287–294 | Central/class-constant determinant and character relations. These do not by themselves establish the unrestricted factorization into irreducible polynomials of degree equal to multiplicity. |
| Same paper, §8 examples | 1011 onward | 299 onward | Worked character-table examples, starting with the alternating group on four symbols. |
| [Über die Primfactoren der Gruppendeterminante](https://archive.org/details/sitzungsberichte1896deutsch/page/1343/mode/1up), introduction | 1343–1345 | 645–647 | Defines the unrestricted matrix with entries indexed by `PQ^-1`, states the factorization results and explicitly distinguishes the preceding character paper. |
| Same paper, §6 | 1361 | 663 | Identifies its character quantities with those introduced by the different method in the first article; degree and multiplicity now have individual meanings. |
| Same paper, §7 | 1362–1363 | 664–665 | Establishes equality of the number of distinct irreducible factors with the number of conjugacy classes. |
| Same paper, §9 | 1368–1371 | 670–673 | States and proves that the exponent of a prime factor equals its degree. Rendered the beginning of this proof, including its degree-two and degree-three identities. |

Also checked [Etingof et al. §4.10, Theorem 4.10.2](https://math.mit.edu/~etingof/reprbook.pdf#page=86), printed pp.78–79/PDF pp.86–87, for the modern regular-representation proof and irreducibility of the determinant factors. That book initially chooses `x_(gh)` and then tracks a column permutation; the visualization uses the original `x_(gh^-1)` convention, so its convolution-operator proof has no extra determinant sign.

## Corrections

Rewrote the paper description to distinguish the first paper's class-character construction from its companion's unrestricted determinant factorization. The earlier explanation incorrectly presented irreducible factors as the first paper's construction of characters and blurred which article supplies the degree/multiplicity theorem. The new description locates the normalization issue, class-count construction and companion theorem explicitly.

Kept the matrix/trace/derivative formulas as a clearly labeled modern reconstruction. The regular representation contains each irreducible with multiplicity equal to its degree; block determinants give the product formula, and the derivative of `det(I+tA)` at zero is the trace. Clarified that there are as many factors as conjugacy classes, without implying a canonical assignment of a polynomial factor to an individual conjugacy class. The complex finite-group scope is explicit.

Removed unsupported exclusive-priority and Molin/1897 chronology claims. The retained April motivation is supported directly by Frobenius's introduction; the credit points to that acknowledgment rather than claiming a separately inspected letter archive. Added precise original/companion references and direct page links. The former unresolved scope note is replaced by the verified distinction between the papers.

Extracted the determinant calculation for direct regression testing, using the group's actual identity index for the derivative's base point. Numerical readouts now distinguish absolute from scaled numerical differences and show zero when zero is computed. Removed artificial `1e−12` floors that had displayed a nonzero discrepancy even for exact agreement. These diagnostics remain observed floating-point differences, not certified error bounds.

## Independent verification and browser evidence

The new regression checks **148 integer input vectors** across Z4, S3, D4, Q8 and A4: zero, all-ones, every coordinate vector and twenty deterministic integer samples per group. Exact BigInt fraction-free elimination independently computes the full group determinant. Both the displayed direct determinant and product of factors agree within the tested scaled tolerance. Each factor also agrees with a separate calculation using character sums and Newton identities (linear sums, quadratic trace identity, cubic trace identity), without reusing the matrix determinant routine. Finite-difference character columns match the independently checked character tables, including complex A4 characters and singular determinant examples.

Passed validation:

- `npm test`: 47 math, 20 science-kit and **48 content-verification tests**.
- `node tests/verification-representation-frobenius.mjs`: both themes, all five group menus and five random samples each; every reconstructed character cell agrees with the expected table. Actual button/menu inputs, no browser errors. Inspected the A4 factor/table screenshot.
- Light/dark item checks: no runtime, TeX, blank or quality warnings.
- Strict build and full static check: 6,684 items, 6,890 planned, 450 chapters and 6,621 visualizations; no warnings/errors.
- Chapter 3 and the paper smoke routes pass with their expected titles.

This clears the last of the fourteen representation-theory flags in the Wave 3–4 queue. It does not close the other collections.
