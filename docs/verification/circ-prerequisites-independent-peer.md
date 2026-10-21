# CIRC prerequisite independent peer — 20 October 2026

**Accept the combined immutable boundary:** prerequisite `1a6f054a6b1bf6b02af7851f0e0a50be0dfc2118`, statement successor `f29bbcb3310a654cb63e4156632ae1d693b99483` and raw-row correction `56e03b7b9395378837bc90f8765aaaeeb2763865`. All three exact commits were independently archived and reviewed. This peer changes no CIRC content, helper, runtime or source flag.

## Independent proof review

I read all complete fifteen consuming statements, ideas, captions and scopes, and all actual target statements and proof ideas. All seventeen new prerequisite edges are consumed by existing derivations. Their hypotheses are bounded appropriately:

| Consumer → target | Actual mathematical use |
|---|---|
| 2.7 → ladr-3.21 | Incidence rank and rank–nullity give the cycle-space dimension. Forest columns establish rank; separate chord coordinates establish a fundamental-loop basis. |
| 2.8 → ladr-3.43 | Matching node/branch coordinate bases compose to ADAᵀ. Reversing a branch changes its coordinates and incidence sign together. |
| 2.9 → ladr-3.65, ladr-7.38 | Grounded positive energy gives an injective finite square map, hence existence and uniqueness. Symmetry and the strict Rayleigh identity give strictly positive eigenvalues. Floating or active networks fall outside the guarantee. |
| 3.1 → ladr-3.63 | A bijective linear map has a linear inverse; this is the source-superposition step with fixed linear dependent sources. Quadratic power does not superpose. |
| 3.6 → ladr-7.1 | The rectangular Euclidean adjoint moves incidence between node and branch spaces, cancelling KCL against KVL on the same oriented graph. No element positivity is used. |
| 3.7 → ladr-7.5 | Invertibility and real symmetry imply a symmetric inverse; scalar transposition swaps consistently oriented port tests. |
| 3.9 → ladr-3.43 | Transmission matrices compose in physical cascade order with the opposite inward middle-port current convention. The chosen representation must exist. |
| 3.10 → ladr-6.12 | Positive resistor weights give an inner product; feasible circulations are orthogonal to the physical current by Tellegen. Pythagoras is exactly the strict dissipation gap. |
| 4.1 → pma-8.6 | Positive exponential/log inversion has domain i>−Iₛ. The two-current voltage difference is exact; the decade step requires forward currents large relative to Iₛ. |
| 4.2 → pma-4.23, pma-5.10 | A continuous finite sign-changing domain bracket gives existence. Positive load resistance and nonnegative device derivative give strict residual ordering and uniqueness by MVT. A continuous nondecreasing kinked device is handled by direct ordering instead. |
| 4.5 → ode-1.4 | Integrating factors solve the isolated diode-off RC discharge exactly until conduction resumes. Small ripple and time-between-peaks substitutions remain approximations. |
| 4.8 → pma-9.28 | A C¹ current-balance branch and nonzero output derivative give the local implicit transfer slope. A singular denominator or nonsmooth region boundary cannot be divided through. |
| 4.9 → logic-2.6 | Finite DNF translated into NAND gives arbitrary finite positive-arity realizability, including constants obtainable from an input. A few illustrated circuits alone would not prove completeness. |
| 4.12 → pma-9.17 | On a differentiable saturation branch the full gate/drain partial array gives the total small-signal derivative. Incremental KCL gives gain with output conductance; crossing device regions invalidates that branch expansion. |
| 4.13 → ode-3.9 | Eigenvalues classify the linearized modes. The zero eigenvalue at critical gain does not certify nonlinear asymptotic stability; the separate nonlinear Lyapunov argument is necessary. |

## Three statement repairs

All three bounded repairs are justified, rather than merely wording changes:

- **2.7:** For variables (v₁,v₂,i₁,i₂), parallel ideal voltage sources impose KVL v₁−v₂=0, KCL i₁+i₂=0 and two fixed source voltages. The coefficient matrix has exact rank three. Unequal source voltages give augmented rank four (inconsistent); equal voltages leave augmented rank three and a free circulation (nonunique). Four equations in four variables do not suffice. The corrected statement preserves independent topological counts and separates constitutive well-posedness.
- **3.9:** A passive series resistor obeys I₂=−I₁ and V₁−V₂=RI₁. Both currents leave a free common voltage, so there is no impedance parametrization. Its admittance matrix has rank one, while its transmission matrix is [[1,R],[0,1]] with determinant one. This ordinary reciprocal example substantiates nonsingular-elimination qualifications and representation-specific reciprocity tests.
- **4.2:** With RTh>0, a nondecreasing device gives F(y)−F(x)≥(y−x)/RTh>0, but existence still needs a domain bracket. A restricted domain can contain no root. With negative load resistance, g(v)=v and RTh=−1 can make F identically zero. The ideal diode tends to bounded −Iₛ under reverse bias, whereas the complete residual tends to −∞ because of the load's linear term. The corrected statement makes these distinctions correctly.

The added 4.13 argument also correctly separates linear stability at negative eigenvalues from the critical nonlinear claim: for the normalized critical tanh dynamics, the quadratic Lyapunov derivative is strictly negative away from the origin because |tanh(x)|<|x| for x≠0. The linearized critical matrix itself has a zero mode.

## Preservation, raw rows and evidence

Evidence root: `/tmp/atlas-thermo-circ-peer`. All reads used immutable archives, not a mutable producer checkout.

- Own explicit temporary guard (`guard.mjs`, `guard-initial.log`) compares **all 56 complete raw item objects, visualization function sources, source flags and module metadata** against the original pre-prerequisite parent. It permits only fifteen appended ideas, seventeen exact new deps and the three reviewed statement fields. A separate source normalization compares every chapter byte outside those exact owned spans; every other CIRC file, including private/shared helpers, is byte-identical. CIRC 4.17 is completely unchanged, including its source-open flag and historical-body limitation.
- Initial full raw row comparison found touched 3.1 missing its existing circ-2.9 invertibility prerequisite and 3.7 missing its existing circ-2.8 symmetric-conductance prerequisite. Both uses are explicit in the old proofs. The coordinator authorized narrow exact row synchronization, with no extra written-edge credit. Untouched inherited row differences at 2.15, 3.4, 3.5, 4.3 and 4.7 are recorded and remain outside this batch.
- `node tests/verification-circ-prerequisites-peer.mjs`: **6,138 independently authored assertions**, no CIRC/helper imports (`math-peer.log`). Includes exact BigInt graph ranks across all four-node graphs with self-loops, a parallel-edge incidence witness, exact inconsistent/underdetermined augmented ranks, grounded weighted triangle energy/inverse/eigenvalues/source sums/reciprocity, rectangular adjoints and orientation-invariant composition, weighted power gaps, fifty passive series-port families and noncommuting cascades, diode inversion/domain and reverse asymptotics, positive-load bracketed roots plus negative-load/restricted-domain/kinked controls, exact off-interval RC discharge, implicit slopes and a singular control, full square-law common-source slopes, all Boolean functions through arity three via an independent NAND construction, latch modes and the critical Lyapunov sign. Numerical witnesses supplement the actual proofs and do not prove unrestricted physical/source claims.
- Producer mathematical suite: **13/13 groups** (`math-producer.log`). Existing CIRC source-audit mathematical/fixture suites: **39/39 tests** (`existing-math.log`); preservation evidence only, not new source certification.
- Own fresh native prerequisite run: **30 cases**, all fifteen changed proof ideas at actual **320px**, light and dark (`native.log`, `native/`). I personally inspected all thirty complete own proof outputs, including full final lines and latch matrix. Runtime/TeX/blank checks and prose/math overflow checks pass. This does not recertify every inherited widget interaction.
- Own fresh built-statement run: **6 cases**, all three corrected statements at actual **320px**, both themes (`statements.log`, `statements/`). The harness renders the exact strings fetched from the strict-built `data/col/circ.json`; statement and idea fields both pass overflow/runtime/TeX/blank checks. I personally inspected every complete corrected-statement output; rank/consistency, port representation and diode-domain/asymptotic qualifications are visible and legible. All browser jobs closed.
- Initial combined strict build: **6684 written / 6890 planned / 450 chapters / 85 collections, 0 errors, 0 warnings**, home **112708 bytes gzip** (`build.log`). Full CIRC static: **56 items, 0 errors, 0 warnings** (`static.log`). Read-only inventory gives **25/39/57**, zero unknowns (`counts.log`). No global inventory file was written.
- Actual changed-ID bridge search finds **no CIRC references in existing bridge steps**; no bridge change is needed.

## Final metadata correction verification

I read the exact `56e03b7` diff, complete correction report and actual prerequisite arguments. The corrected full raw syllabus lists are 3.1 = `['circ-2.5', 'circ-2.9', 'ladr-3.63']` and 3.7 = `['circ-3.6', 'circ-2.8', 'ladr-7.5']`, exactly matching their unchanged full items. The missing dependencies were already written and consumed; neither adds quota credit.

The final own combined guard (`guard-final.log`) passes against the original pre-prerequisite parent: all 56 objects/functions/flags/private helpers/source bytes, seventeen exact additions, fifteen append-only ideas, three reviewed statement repairs, and the complete expected syllabus including only the two authorized inherited row repairs. **All fifteen touched raw item/row lists match exactly.** Direct recursive source comparison finds only `syllabus.js` differs from the previously native-tested statement successor. The strict-built `data/col/circ.json` is also byte-identical to that prior output, so the fresh own proof/statement pixels apply to the final exact boundary without pretending to rerun unchanged native work.

Final strict build (`build-final.log`): **6684 written / 6890 planned / 450 chapters / 85 collections, 0 errors, 0 warnings**, home **112706 bytes gzip**. Full CIRC static (`static-final.log`): **56 / 0 / 0**. Final read-only inventory (`counts-final.log`): **25/39/57**, zero unknowns. The count remains provisional until coordinator integration; no global file was written.

This accepts the bounded mathematical prerequisite/statement batch and resolved metadata findings. It does not close historical sources, recreate original measurements or certify CIRC 4.17's still-open historical body.
