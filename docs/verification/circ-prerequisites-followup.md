# CIRC prerequisite arguments — 20 October 2026

Producer candidate requiring independent immutable review. **Seventeen genuine written crossfield prerequisites** are added across fifteen existing written CIRC items. Provisional inventory changes **8/22/40 → 25/39/57** (written-to-written / written-to-known / whole syllabus), zero unknown prerequisites. No global inventory or accepted ledger changes.

The immutable baseline is `91ad005bfc36bedbcfc69262acec3addff09ccb5`, archived at `/tmp/atlas-new-circ-producer/baseline`. I personally read the full consuming statements/ideas/scopes and every actual target statement/proof. The additions explain actual steps rather than merely mentioning another subject.

| Consumer | Added prerequisite | Concrete use / bounded hypotheses |
| --- | --- | --- |
| 2.7 | ladr-3.21 | Rank–nullity converts incidence rank n−c to cycle-space dimension b−n+c. Distinct chord coordinates prove fundamental-loop independence; the count alone does not prove arbitrary element laws are consistent. |
| 2.8 | ladr-3.43 | Actual node-to-branch, conductance, branch-to-node composition produces ADAᵀ with matching oriented branch bases. |
| 2.9 | ladr-3.65 | Zero quadratic energy forces zero grounded potential, giving injectivity; finite square dimensions give surjectivity and invertibility as well. |
| 2.9 | ladr-7.38 | The symmetric positive-operator characterization and the strict Rayleigh identity give the positive eigenvalues actually shown; floating/active cases fall outside the hypotheses. |
| 3.1 | ladr-3.63 | The actual bijective-map proof shows its inverse is linear, establishing source superposition with fixed linear dependent sources; power does not superpose. |
| 3.6 | ladr-7.1 | The rectangular real Euclidean adjoint identity transfers the incidence matrix across the node/branch inner products, giving Tellegen's cancellation on the same oriented graph. |
| 3.7 | ladr-7.5 | Adjoint of an inverse proves the symmetric grounded conductance inverse is symmetric, then scalar transposition swaps the oriented port tests. |
| 3.9 | ladr-3.43 | ABCD cascade order follows composition with a consistent middle-port current sign. Existence of a chosen parameter representation is explicit. |
| 3.10 | ladr-6.12 | Positive resistances define the weighted inner product; Tellegen gives orthogonality to feasible circulations; Pythagoras is exactly the dissipated-power gap and strict minimum. |
| 4.1 | pma-8.6 | The actual exponential/log identities give exact diode inversion and two-current voltage difference. The decade rule is explicitly a forward-current approximation, with the bounded reverse limit distinguished. |
| 4.2 | pma-4.23 | Positive Thévenin resistance and a finite continuous sign-changing residual bracket give an operating point by IVT. The diode obtains the negative bracket from the linear load term, not an unbounded negative diode current. |
| 4.2 | pma-5.10 | For a differentiable nondecreasing device the residual derivative is strictly positive; MVT establishes strict ordering and uniqueness. Continuous nondecreasing devices have a separate direct ordering argument. |
| 4.5 | ode-1.4 | The off-interval RC discharge is the homogeneous linear ODE solved by an integrating factor. The later small-ripple/time-between-peaks substitutions remain approximations. |
| 4.8 | pma-9.28 | On a C¹ device branch, nonzero output-current derivative gives a local differentiable implicit transfer and its slope ratio. Singular denominators/nonsmooth region boundaries are explicitly excluded. |
| 4.9 | logic-2.6 | DNF plus NAND replacements supplies the arbitrary finite positive arity completeness proof, distinct from checking a few CMOS examples. |
| 4.12 | pma-9.17 | On the smooth saturation branch the total derivative is its gate/drain partial array. Incremental KCL yields the full output-conductance gain; crossing device regions invalidates that one-branch expansion. |
| 4.13 | ode-3.9 | The theorem classifies modes of the two-state linearization from its eigenvalues. At g=1 the zero eigenvalue does not establish nonlinear asymptotic stability; that needs the already distinct Lyapunov argument. |

`circ-prerequisites-evidence.json` records the **exact full raw written and syllabus dependency lists before and after** for every changed item, including unchanged pre-existing dependencies. Only the seventeen additions are made; no unrelated metadata alignment or planned-target replacement is hidden in this batch. It also records both inventory snapshots and hashes of the actual own proof/statement captures.

## Preservation, math and native evidence

- `node tests/verification-circ-prerequisites-guard.mjs` passes an explicit-only snapshot audit of **all 56 complete item objects, all visualization function text and all source flags**, permitting only the fifteen strictly appended ideas and seventeen exact dependency additions. The entire syllabus equals its baseline plus the fifteen specified row additions. All other CIRC files are byte-identical. A separate source normalization audit verifies every chapter source byte outside those owned idea/dependency spans (`sourceguard.log`).
- `node --test tests/verification-circ-prerequisites.test.mjs`: **10 independent mathematical groups pass**, importing no circuit/helper implementation. They include forest/parallel/self-loop rank calculations, independent incidence composition and energy, exact grounded triangle inverses/eigenvalues, linear source sums, reciprocal transfer, rectangular adjoint cancellation, weighted energy-gap identities, oriented noncommuting cascades, diode inversion and bracketed roots, negative-load counterexamples, exact RC discharge, implicit transfer derivatives and a singular control, all Boolean functions through arity three via NAND translation, exact square-law common-source slopes, and both latch linear modes including the zero-eigenvalue boundary. Finite witnesses supplement the actual proofs and do not establish unrestricted source or empirical claims.
- Own strict build: **6684/6890/450/85, 0 errors / 0 warnings**, home **112708 gzip bytes**. Focused static all CIRC: **56 / 0 / 0**.
- `CIRC_PREREQUISITE_OUTPUT=<unique directory> node tests/verification-circ-prerequisites.mjs`: **30 fresh actual 320px cases**, all fifteen changed ideas in light and dark, with 60 idea/statement captures. Every changed explanation and math fits; no runtime/TeX/blank errors. I personally read all **30 own changed-idea output PNGs**, including full final lines and the latch matrix in both themes. No inherited statement overflow was found in this pass. This is prose/layout evidence, not unchanged-widget interaction certification. Browsers are closed.

Raw logs, actual images and independent source audit are under `/tmp/atlas-new-circ-producer/evidence`; the immutable baseline is separate. No existing bridge references any changed CIRC ID; no bridge update is required by this batch.

## Separate inherited statement follow-up

This immutable prerequisite boundary deliberately preserves all original statements. Actual argument review found three old overclaims to correct in a separate authorized successor: (1) 2.7's equation count does not by itself imply arbitrary element laws determine a consistent unique solution; unequal parallel ideal voltage sources are inconsistent despite the count. (2) 3.9's claim that any two variables determine the other two ignores the very parameter singularities admitted by its existing scope. (3) 4.2 omits RTh>0 and incorrectly implies the ideal diode tends to large negative current; its reverse current is bounded, while the complete load residual still has a sign-changing bracket. The appended proofs already state these precise conditions. Separate statement corrections and their own both-theme pixels will accompany this batch before combined acceptance.

**CIRC 4.17 is entirely unchanged**, including its source flag, functions, metadata and existing argument. Its original historical body remains open; no recreated original measurement, access bypass or historical source-closure claim is made. BIGHIST is untouched and frozen. Independent peer must review the exact prerequisite commit and the separate statement successor before acceptance.
