# Number theory: residues, sign counts and reciprocity — 2026-10-17

Reviewed the four queued entries `nt-4.2`, `nt-4.4`, `nt-4.6` and `nt-4.8` in `ch04.js` and `ch04-b.js`. The collection is a curated course; the audit replaces unchecked book section pointers and historical dates with precise primary course proofs. Existing dependency arrays and shared number-theory helpers are preserved.

## Primary evidence

The [MIT 18.781 course's notes page](https://ocw.mit.edu/courses/18-781-theory-of-numbers-spring-2012/pages/lecture-notes/) explicitly credits Joseph Lee in collaboration with instructor Abhinav Kumar, Spring 2012. Its session 10 link is titled **Lecture 9**, and session 11 is **Lecture 10**; these are the document titles used in the content references, avoiding an invented correspondence between session number and document number.

- [Lecture 9: Quadratic Residues, Quadratic Reciprocity](https://ocw.mit.edu/courses/18-781-theory-of-numbers-spring-2012/d5cdd1b802194a2a236eed934da8ae36_MIT18_781S12_lec9.pdf), seven PDF pages: mathematical pp.1–6 and a license page. SHA256 `10dada2c965d0788541c85dd11f957ddb9f35a9b9f36a3060bf52d2daad362e8`. Read Lemma 39 and the subsequent symbol/multiplicativity argument pp.1–2 (Euler); Lemma 40 and its complete cancellation proof pp.2–3 (Gauss); Theorem 41 and parity argument pp.3–5; and Theorem 42 with the complete lattice partition proof pp.5–6 (reciprocity). Rendered and directly inspected the Gauss page. Typographical/extraction slips in the notes' symmetric-remainder definition are not copied: for least nonnegative residue b, use b if b<p/2 and b−p otherwise.
- [Lecture 10: Jacobi Symbol, Computation, Zolotareff's Definition](https://ocw.mit.edu/courses/18-781-theory-of-numbers-spring-2012/785c307302fa0fd1113b0fd6bdaf6f4a_MIT18_781S12_lec10.pdf), four PDF pages. SHA256 `c68d12174d4db886820dd5338b830f0d9e96fd43ab783f9d069ad4b513e2e8fe`. Read pp.1–2: the zero Legendre convention, prime reciprocity and supplements, Jacobi's prime-factor definition, multiplicativity and the warning that +1 does not imply a square. The extension to odd coprime products follows by multiplying prime laws, using the two parity identities explicitly supplied in the atlas proof. Denominator one has the empty product value one.

The original 1748/1808/1796/1844/1837 priority statements were not independently established and have been removed. Conventional theorem names remain. This does not claim those original historical papers were read; it verifies the current mathematical entries against the authored primary proofs above.

## Corrections

**Zero residues.** Both the Euler and Gauss demonstrations silently changed an input divisible by p into the residue one. They now retain the actual zero residue, show the computed zeros, and explicitly state that the theorem's nonzero hypothesis fails. Gauss's coincident zero markers are muted and are not classified as positive multiples. Away from zero, the factorial cancellation proof gives the signed product and the permutation of absolute residues as required. Euler's chart tests all units, while its selected repeated-squaring ladder may also demonstrate a nonunit in composite mode; the readout says which set its universal finite check covers.

**Composite reciprocity.** The original caption falsely said the displayed composite symbols stopped obeying reciprocity. They were already computed as **Jacobi** symbols; coprime odd composites satisfy precisely that reciprocity law. The corrected text distinguishes this valid extension from noncoprime inputs. The controls no longer silently try to substitute another prime when equal inputs are selected: their old nearest-prime call could select the same prime again, violating its own intended repair. Equal or shared-factor inputs instead remain visible as excluded hypotheses.

The lattice partition now counts `S1+S2+D=hp*hq`, with D the diagonal points. Previously the readout asserted `S1+S2=hp*hq` even when D was nonzero. For coprime inputs D is zero and the two signs multiply to the rectangle parity. For noncoprime inputs both Jacobi symbols are zero and no coprime reciprocity equality is asserted. The source proof counts strict sides only under its distinct-prime hypothesis.

**Actual squares.** The Jacobi chart omitted gold square markers whenever the symbol was zero, because its nonunit branch returned first. Nonunit squares do exist: 9 is a square modulo45 but its Jacobi symbol is zero. The marker is now computed independently before that branch. Red hatched +1 nonsquares, genuine square markers and zero-symbol classes remain distinct. The caption states that all nonzero classes are drawn and even modulus inputs round upward to the next odd integer.

## Validation

`node --test tests/verification-number-theory-residues.test.mjs` runs four independent groups. It executes the actual visualization functions with recording stages, not a second unconnected model:

- All 7,080 Euler control combinations, compared with repeated BigInt multiplication and separately enumerated squares, including every selectable prime/composite modulus and excluded zero.
- All 6,840 Gauss control combinations, directly checking every signed multiple, complete absolute permutation, negative-count parity and zero exception.
- All 6,962 reciprocity control combinations, with independent integer lattice comparisons, full point-count identity, equal/shared-factor exclusions and coprime Jacobi reciprocity. No prime-selection repair is presumed to work merely from a method name.
- Every odd modulus3–99 and nonzero class, with independently factored/brute-squared Jacobi values and exact marker membership. Additional checks cover all signed numerators across primes through101 and the denominator-one convention.

`tests/verification-number-theory-residues.mjs` uses real sliders and toggles in both themes, including multiples of selected primes, equal primes, noncoprime9/15, coprime9/25, and the nonunit square9 modulo45. It checks visible plot ranges, actual counts/markers, correct exclusion/extension labels and runtime/TeX errors. All eight light/dark browser groups pass without runtime or TeX errors. The four flags were cleared after those checks; combined repository outcomes are recorded centrally. There are no audio controls in these four entries; Wave5 remains gated.
