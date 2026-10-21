# Wave 5 — Representation theory chapter 5

Authored 2026-10-21. All 14 planned IDs, rep-5.1–rep-5.14, are complete in `content/rep/ch05.js`, `ch05-b.js` and `ch05-c.js`, with finite group/matrix routines in `ch05.shared.js`. Only chapter 5 syllabus rows were reconciled; IDs and kinds remain unchanged. No old verification drafts, shared runtime, generated data, central plan or ledger was edited by the author.

## Sources and mathematical conventions

The actual primary source used is [Etingof et al., official author text](https://math.mit.edu/~etingof/reprbook.pdf), as currently served with printed pages 61–62, 72–73 and 95–102. This author's book numbers differ from the earlier OCW course notes. No table-of-contents-only reference or unverified Serre section was retained as if its full passage had been read.

| Items | Actual passage/argument | Acceptance details |
| --- | --- | --- |
| 5.1–5.2 | Etingof §§2.2–2.3 and opening of Chapter 4 | Unital complex modules; all coefficients, including signed/complex values; counting-measure convolution without 1/|G|. Group-algebra dependency is the actual linear-representation definition `rep-1.1`, rather than the old permutation-example dependency. |
| 5.3–5.5 | Etingof §4.3 (abelian groups), §4.7, Proposition 4.7.1, and explicit finite calculations | Positive-exponent DFT; inverse negative exponent with factor1/n; translated f(x−s) acquires a positive phase. Circulant uses the **first column** a, Cxy=a(x−y), and negative-exponent eigenvectors. Canonical double-dual evaluation is distinguished from the chosen cyclic-coordinate isomorphism with the dual. |
| 5.6–5.8 | Etingof Theorem 4.1.1(ii), Proposition 3.5.8, Proposition 4.7.1 | Complex splitting field and all irreducible matrix entries; no reduction of noncentral functions to character traces. The transform uses sum f(g)ρ(g), inversion uses ρ(g inverse), and convolution preserves matrix-product order. Plancherel uses unitary models, Hilbert–Schmidt squared norms, degree weights and counting-measure normalization. |
| 5.9 | Above orthogonality/Plancherel plus [Levin–Peres, second edition, §4.3, Theorem 4.9](https://pages.uoregon.edu/dlevin/MARKOV/markovmixing.pdf) | The actual convergence theorem was retrieved from the indexed author-hosted PDF after direct open timed out. Irreducibility/generating support and aperiodicity are both explicit. The Fourier total-variation bound is derived by Cauchy–Schwarz and Plancherel. Nonlazy transpositions are deliberately periodic; the identity-only endpoint deliberately fails generation. |
| 5.10–5.12 | Etingof §5.2, Propositions 5.2.4–5.2.5; §5.3, Theorem 5.3.1 and Proposition 5.3.2 | Exact integer class-algebra multiplication and Cayley–Hamilton establish class-scalar integrality. Character values are sums of roots of unity; the text explicitly writes ρ(g)^m=I and the square-free polynomial t^m−1. Rational algebraic integers are integers. The degree theorem requires irreducibility over C; neither a rounded eigenvalue nor a polynomial fit establishes it. |
| 5.13 | Etingof Theorems 5.4.3–5.4.6 and Lemma 5.4.7, pp.100–102; historical §5.5, p.105 | Full scalar-or-zero/prime-power-class outline, proper normal class-difference subgroup, minimal-counterexample induction and class-equation conclusion. Only **noncentral**, nontrivial prime-power classes qualify. The final class-equation argument follows the source and avoids silently requiring the still-planned algebra Sylow chapter. Solvability is distinguished from abelianity/nilpotence. Burnside's 1904 credit was checked. |
| 5.14 | Etingof §§4.2 and4.6, character/unitary facts; explicit kernel proof | Equality χ(g)=d is required, not absolute trace d. All normal subgroups arise via irreducibles inflated from the quotient, using the faithful regular representation. The empty intersection is the whole group. |

All formulas are paraphrased or derived. The Fourier consequences not named as standalone theorems in Etingof are explicitly identified as calculations from its matrix-coefficient orthogonality, rather than attributed to an unread “Fourier theorem” passage.

## Finite authored models and numerical limits

S3 is implemented as the order-six dihedral group, with labels e,r,r2,s,rs,r2s and sr=r2s. Multiplication, inverses, class counts and character equalities are integer operations. Its standard two-dimensional model is an orthogonal rotation/reflection representation; floating trigonometric entries are not rounded into exact algebraic claims. All transform and projection residuals are shown numerically.

The cyclic examples compute every transform coefficient by complete finite sums. The two C5 polynomials are known exact symbolic cyclotomic/conjugate-pair relations, not inferred by fitting a numeric root. The degree example uses complete S3 and order-eight dihedral character tables and exact class terms. Burnside's board displays every element of the single authored product S3×C12, with complete conjugacy classes, generated class-difference subgroups and independently computed derived series72→3→1. It does not claim to enumerate every group of order72. Central singleton selections explicitly disable the prime-power-class inference.

The random walk computes complete convolution laws. For stay probability λ its nontrivial Fourier blocks are the scalar2λ−1 and the matrixλI; the displayed bound is min(1, sqrt((2λ−1)^(2t)+4λ^(2t))/2). This remains valid at t=0 and at the periodic/frozen endpoints. No sampled success rate or unproved fitted decay rate appears.

## Validation

- `node --test tests/wave5-rep.test.mjs`: **12/12 test groups passed**. Independent oracles include actual three-point permutations for S3 multiplication; all729 coefficient vectors over {-1,0,1}; complete inversion/Plancherel/multiplication checks; rational central-idempotent products; cyclic shift/convolution/circulant identities; exact double-dual exponents; integer class-polynomial annihilation in the group algebra; **205 BigInt path-count walk laws** through40 steps; an exact C5 quotient-polynomial identity; full character-table orthogonality and divisibility sums; every class-difference subgroup and derived quotient of the order72 example; and all eight kernel intersections.
- `node scripts/check.mjs rep/5 --static`: **14 items, 0 errors, 0 warnings**.
- `node scripts/check.mjs rep/5 --shots --modes --jobs=1`, plus `--dark`: **14/14 per theme**, no runtime, TeX, blank-canvas or quality warnings. There are26 screenshots per theme (14 defaults and12 alternative modes/toggles) in `shots/rep-5*.png`.
- `node tests/wave-five-native.mjs rep`: **14 items, 56 theme/width groups, 248 real control actions** passed. Widths320/1200, both themes, visible slider endpoints/options/toggles were exercised; the independent reviewer separately checked endpoint/counterexample states.
- `node tests/wave5-rep-layout.mjs`: **28 mobile math-layout groups** passed, checking display-math scroll bounds and absence of raw readout TeX in addition to runtime/TeX errors.

The author inspected every one of the26 light and26 dark harness screenshots and all28 native mobile screenshots using local image contact sheets. Tables, axes, complex-plane points, controls, formula blocks and readouts fit the inspected layouts. The DFT complex-plane bounds include a margin beyond the extremal magnitude2, protecting dot/ring strokes at amplitude endpoints. Mobile formula blocks were shortened before capture by introducing Aρ, E, Bρ and Dt without changing the mathematics.

Independent reviewer `wave5_reviewer` separately checked all14 statements against primary passages and reported successful exhaustive Fourier, exact BigInt-walk and derived-series oracles. Their source, wording and marker-margin findings were incorporated. The separate [independent review](wave5-rep-review.md) accepts the final source, mathematics and visuals; root records the accepted Git-export integration checks in [the production record](https://github.com/Sir-Teo/theorems-visualizations/blob/e65062834abb37cd2e4bfa1b77d5de6779a98170/docs/verification/wave5-production.md).

Ready for independent acceptance. No known mathematical or layout blocker remains.
