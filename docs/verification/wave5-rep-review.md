# Wave 5 representation theory chapter 5 — independent review

Reviewer validation, 2026-10-21. **Accepted:** all 14 new items, rep-5.1 through rep-5.14, in the frozen chapter sources and helper. This review is separate from the author report and root's repository gates.

## Source and convention review

Opened [Etingof et al.'s official author text](https://math.mit.edu/~etingof/reprbook.pdf). Checked §§2.2–2.3, Theorem 4.1.1(ii), Proposition 3.5.8, §4.7, §§5.2–5.4 and the historical note in §5.5. The complex field, unital action, counting convolution, positive transform exponent, negative circulant eigenvectors, full matrix blocks and dimension weights are consistent. The canonical double dual is distinguished from a coordinate choice identifying the dual. Class-sum integrality, degree divisibility, the noncentral prime-power-class lemma and Burnside's class-equation conclusion match the actual source. Kernel equality uses the character itself, not its absolute value.

For convergence, independently retrieved the indexed official [Levin–Peres text, Theorem 4.9](https://pages.uoregon.edu/dlevin/MARKOV/markovmixing.pdf), after direct PDF open timed out. The generating-support and aperiodicity assumptions are explicit. The Fourier bound is identified as a derivation rather than falsely attributed to a standalone passage in Etingof.

## Independently executed mathematical oracles

- Grounded the six S3 labels in explicit permutations of three vertices. All 36 group products and all 36 corresponding standard-representation matrix products agree.
- Enumerated all 729 signed vectors in {-1,0,1}^6. Fourier inversion and weighted energy agree. For each vector, multiplied by each basis point mass using independently composed permutations, then compared the transformed product with the matrix-block product: 4,374 products, maximum absolute residual 2.67e-15.
- Computed exact BigInt random-walk path counts for laziness 0, 1/4, 1/2, 3/4 and 1 through 40 steps: 205 probability laws. Probabilities and TV agree with the helper within 2.23e-16. Every displayed spectral upper bound holds, including both nonmixing endpoints.
- Independently computed derived-series sizes: S3 has 6→3→1, the order-eight dihedral group has 8→2→1, and S3×C12 has 72→3→1.
- Independently checked the three exact integer class-multiplication matrices by Cayley–Hamilton: every annihilation entry is zero. Ascending characteristic coefficients are (-1,3,-3,1), (4,0,-3,1) and (0,-9,0,1).
- Checked all 34 character-row orthogonality pairs across S3 and the order-eight dihedral group, all degree-square sums, and every displayed class-scalar divisibility identity with integer arithmetic.

These checks were executed independently before accepting the author's regression suite. Reran all 12 groups in `tests/wave5-rep.test.mjs`: pass.

## Runtime and visual evidence

Reran `tests/wave5-rep-layout.mjs`: all 14 items × 2 themes at 320px pass, with no clipped display math, raw readout TeX or runtime errors.

A separate reviewer Playwright script exercised actual narrow-page controls in both themes and asserted six cases: periodic endpoint TV=1/2; frozen endpoint TV=5/6; central singleton class with class-difference subgroup order 1; terminal derived stage remains order 1; the incorrect absolute-character test adds three false positives; and an empty kernel intersection has order 6. All 12 checks pass after waiting for render frames.

Individually inspected all 14 light desktop harness defaults and all 14 dark 320px native defaults. Complex-plane markers, full tables, formula blocks, signed bars, derived-series board, controls and readouts are legible. Inspected the final 5.11 exponent notation in the mobile capture. The final 5.13 class-equation proof paragraph was read directly in source after its prose-only replacement; the chart is unchanged. Root owns the broad frozen native matrix; author reports 56 theme/width groups and 248 control actions.

## Review findings resolved

- 5.3: added complex-plane margin beyond ±2 so endpoint coefficient marker strokes are not clipped.
- 5.9: added a direct primary convergence reference, separate from the source for orthogonality and the authored Fourier bound.
- 5.11: replaced ambiguous prose exponents with explicit rho(g)^m=I and t^m−1 math.
- 5.13: the final induction uses the source's class-equation argument and avoids an unfulfilled Sylow prerequisite. The class-difference subgroup and derived series remain distinct; central singleton selections explicitly do not satisfy the noncentral-class lemma.

No unresolved mathematical, source-attribution or visual blocker found. Numerical residuals support the displayed finite examples; the source-backed arguments carry the universal claims.
