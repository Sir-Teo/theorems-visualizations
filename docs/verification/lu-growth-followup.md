# LU and Gaussian growth-factor follow-up — 2026-10-17

Resolved **nla-4.1 and nla-4.6**. Existing dependency arrays and the p-bit shared algorithms used by neighboring entries are preserved. The corrected player and all-stage experiment use a dedicated `content/nla/lu-growth-audit.shared.js`.

Primary evidence actually read:

- [ALAFF §5.2.3, Theorem 5.2.3.4 and proof](https://www.cs.utexas.edu/~flame/laff/alaff-beta/chapter05-lu-factorization-def.html), restricted here to square nonsingular matrices. Read both directions, the inductive block construction and the square operation-count discussion. Snapshot SHA-256 `fea8efeeec4e73a663e72cdb632382bef38c3af3712558c4e5bc2e7cf05ed162`. Unverified ancient/modern priority claims are removed.
- [Trefethen–Schreiber, *Average-case stability of Gaussian elimination* (1990), author-hosted original](https://people.maths.ox.ac.uk/~trefethen/publication/PDF/1990_44.pdf): printed p.336 eq.(0.2); pp.348–349 eqs.(6.1)–(6.2), Figs.6.1–6.2 and the explicit asymptotic qualification. PDF page = printed page −334. Original pages348–349 were rendered and inspected. SHA-256 `7c66c586bc6a0211bc47613c158a5f999472382a7fa3eef859a72f59a804a623`.
- [Urschel, *On the Growth Factor of Random Matrices*, arXiv:2610.06785v1, 5 October 2026](https://arxiv.org/html/2610.06785v1): definition in §1, Theorem 1.4 and its §5.5 argument via Propositions 5.1/5.5. The source now reports a Gaussian-ensemble tail bound, so the former blanket absence-of-theorems claim is removed. Its final-factor definition differs from the displayed all-stage statistic. This review checks that source attribution and scope, and does not claim an independent reproof of the new research theorem. HTML SHA-256 `96b569be06ffad1fc54b847d8ece85c3bfd6a72a3b5bd76a29fe7ca13ee609f3`.

## Corrections

**4.1:** Added the missing nonsingularity hypothesis, completed the leading-minor and uniqueness arguments and gave the exact scalar flop count including divisions. The player formerly discarded the unreduced lower part of the trailing block from its right panel, breaking the intermediate factor identity. It now displays the whole remaining Bk and checks A=LkBk at every frame. A dedicated elimination stops at the first zero required pivot; early breakdown and a zero final pivot are explicit menu choices. Failed runs no longer reach a false “Finished” message or claim an invalid factorization. Small residuals are printed numerically rather than forcibly rounded to zero.

**4.6:** Separated the paper's mean population-standard-deviation normalization from the plot's maximum-entry-normalized median. Computation now tracks transient Schur-complement entries across every stage, excluding stored multipliers; a 3×3 regression has all-stage maximum 2 but final-U maximum 1. The histogram range includes its largest sample rather than dropping the upper tail. The red reference meets the exact logarithmic boundary. All five sizes are selectable, resampling changes the data, and the finite fit and comparison slopes are expressly distinguished from asymptotic results. Unsupported claims about every real application are removed.

## Validation

- `node --test tests/verification-lu-growth.test.mjs`: **6/6**. Every intermediate factor product; all **19,683** ternary 3×3 matrices (11,808 nonsingular); first/final zero pivots; exact flop counts; transient-growth and multiplier exclusions; the sharp Wilkinson family through n=30; scale invariance; histogram tail mass, slope fits and exact plot clipping.
- **Ten independent 90-digit Decimal references** cover the actual binary64 Gaussian UI inputs at n=8,16,32,64,128 and two seeds. Reference elimination uses explicit zeroed Schur matrices rather than in-place multiplier storage. All growth values and pivot permutations agree. Reproduce with `python3 scripts/verify-lu-growth.py`; evidence is `lu-growth-references.json`.
- `node tests/verification-lu-growth.mjs`: **4 passing light/dark real-input groups**. The actual three table draws and product residuals are checked at every textbook frame; first/previous/next/end, both breakdown choices and 16 random resets per theme are exercised. Growth checks cover every size at two seeds, histogram mass and drawn bars, exact worst-curve endpoint and changed samples. No runtime, TeX or blank-stage failures.
- Targeted static validation: two entries, zero warnings/errors. Product screenshots inspected: `/tmp/atlas-lu-partial-light.png`, `/tmp/atlas-lu-breakdown-dark.png`, `/tmp/atlas-lu-growth-dark.png`.

Finite calculations test implementation and counterexamples; source proofs support universal claims. Subjective human/listening checks and the Wave 5 gate remain open.
