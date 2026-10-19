# Stein-lemma source review — 2026-10-18

Completed **info-3.10**. The dependency is preserved; no other information-theory flag is cleared by this review.

Read the complete primary lecture proofs in [Polyanskiy–Wu, MIT 6.441 (2016), chapter 10](https://ocw.mit.edu/courses/6-441-information-theory-spring-2016/26fd180f40b6773bf19b659a4c5e8656_MIT6_441S16_chapter_10.pdf), Theorem 10.6, printed pp.118–119, and [chapter 11](https://ocw.mit.edu/courses/6-441-information-theory-spring-2016/d14633baf528941dcb5ee00a334e1d89_MIT6_441S16_chapter_11.pdf), Theorem 11.1 and its proof, pp.121–123. Chapter 10's alpha denotes acceptance under P; the entry's alpha denotes rejection under P, so the constraint is converted to acceptance at least 1−epsilon. The source permits randomized tests and establishes the fixed-constraint exponent. Historical priority beyond the conventional theorem name is no longer asserted.

SHA-256 of the full PDFs: chapter 10 `65fd20afacb152cc899dd6f4e829c16f5d4eceebeefc94b91dcd2ac6647b22b1`; chapter 11 `8bdc6173a05e80fb46a66f81d004b8b6e94e7eaf2298cf9550138fd1fd24a4cc`.

## Corrections and implementation

The former deterministic-subset definition did not describe the fractional boundary used by the visualization. The definition now uses an acceptance function in [0,1], a non-strict error constraint, and every fixed epsilon in (0,1). The proof uses the likelihood-weight identity rather than summing an invalid per-sequence bound. The converse retains the positive prefactor 1−epsilon−o(1). Requiring both errors to shrink does not by itself select the symmetric Chernoff exponent; the scope now distinguishes the optimizations.

The new scoped helper normalizes binomial masses in the log domain, fills likelihood-ratio classes in decreasing order and randomizes at one boundary. Equal distributions use uniform randomization. The miss probability's logarithm survives floating-point underflow. Bars represent probability **masses**, and their heights sum to the displayed errors. The axes include all three curves and the full endpoint bars. The boundary probability is visible in the plot and readout.

## Independent validation

- `scripts/verify-info-stein.py` independently solves the probability-allocation problem using exact integer combinations and 100-digit Decimal arithmetic. Eight reference cases include equal distributions, reversed likelihood ordering, a fractional class and a miss probability below binary64's range; stored in `info-stein-references.json`.
- `node --test tests/verification-info-stein.test.mjs`: **4 tests pass**. Independent sequence-level enumeration checks every n=1…8 with four values each of p, q and epsilon. Every displayed length 5…300 is checked at six representative parameter pairs and four error bounds for normalized masses, the exact constraint to rounding accuracy and a likelihood-threshold optimality certificate. The one-observation example has randomized miss probability .84 where every admissible deterministic acceptance set has miss probability 1.
- `node tests/verification-info-stein.mjs`: **2 light/dark browser groups pass**, each exercising 32 actual slider endpoint combinations, displayed mass sums, full curve/bar bounds, ties and underflow-safe readouts. Harness, live TeX and page-error checks pass. Inspected the extreme light and tied dark screenshots directly.
- Scoped syntax/static checks pass. These finite checks validate the implementation; the primary likelihood argument supports the asymptotic theorem. Subjective human/listening checks remain open.
