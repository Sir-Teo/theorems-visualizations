# KIN prerequisite producer — 20 October 2026

Sixteen mathematical prerequisites are now explicitly consumed in sixteen written explanations and their exact matching syllabus rows. The read-only inventory reports **9/10/23 → 25/26/39** written-to-written / written-to-known / whole-syllabus crossfield edges, with no unknown dependencies. This is a producer candidate pending separate immutable peer review and coordinator acceptance. No source flag is closed.

I read all complete consuming statements, arguments and scopes and all actual target statements and proof ideas. The new prose identifies the calculation each target supplies and states its relevant assumptions.

| Consumer | Added target | Existing argument that consumes it |
|---|---|---|
| 1.3 | prob-2.1.1a | Independent molecular occupancy events supply the concentration-product factors for idealized elementary encounters. |
| 1.6 | pma-6.21 | The antiderivative of reciprocal concentration squared evaluates the separated integral on a positive-concentration interval. |
| 1.8 | pma-8.6 | Positive power-law rates become affine in log concentration; subtracting two equations gives the order slope. |
| 1.10 | pma-5.15 | Scalar rate linearization about equilibrium has a quadratic remainder; discarding it is the small temperature-jump approximation. |
| 1.12 | pma-8.6 | Exponential addition turns the telescoping sum of state-energy changes around a cycle into product one. |
| 2.2 | pma-5.15 | Taylor expansion of reciprocal temperature gives the small relative jump approximation to Q10. |
| 2.4 | prob-2.1.1a | Independent patch-facing and energetic events yield the squared solid-angle steric factor. |
| 2.7 | ladr-7.29 | A real symmetric Hessian has an orthonormal eigenbasis, separating the local quadratic stable and unstable directions. |
| 2.10 | pma-5.3 | Product, quotient and sum differentiation of the composite rate gives its weighted apparent activation energy. |
| 3.3 | pma-8.6 | Product logarithms and inverse exponentials yield the Eyring plot after dividing out T. |
| 3.5 | pma-5.15 | The smooth extension of x/sin(x) has the high-temperature quadratic expansion, separately from the finite-threshold integral. |
| 3.7 | pma-5.15 | The equal-curvature barrier parabola has exact Taylor remainder δ²/(4λ), bounding the local linear energy relation. |
| 3.10 | ode-3.5 | Diagonalizable linear eigenmodes give the rate-matrix exponential; positive detailed balance makes this star similar to a symmetric matrix. |
| 4.2 | prob-1.6.1 | Linearity sums finite stage waiting-time means; independence is not needed for this mean-addition step. |
| 4.6 | prob-2.2.1 | Independent molecule indicators have additive variance, giving the displayed channel-count relative scatter. |
| 4.11 | ode-1.5 | An affine shift reduces initiation plus branching to scalar exponential growth/decay; zero exponent is integrated separately. |

The qualifiers matter: ideal independent placement is not derived for correlated fluids; logarithms require positive rates and concentrations; a Hessian zero mode needs higher-order analysis; constant elementary Arrhenius parameters are assumed in the composite derivative; the tunnelling expansion requires small u and does not repair the extended-energy crossover pole; variance addition concerns different molecules, not mutually exclusive channels within one molecule. No extra physical theorem is inferred from the mathematical prerequisites.

## Authorized inherited alias correction

The preservation audit found that untouched written KIN 3.4 used `['kin-3.2', 'qm-4.4']`, while its syllabus used `['kin-3.2', 'qchem-1.8']`. Inspection established that qchem 1.8 is explicitly an alias of qm 4.4. The actual qm 4.4 argument proves harmonic zero-point energy by the uncertainty bound/AM–GM and the ladder-operator ground-state identity; this is exactly the zero-point input used by KIN 3.4's isotope barrier calculation. With coordinator authorization, only that syllabus dependency was canonicalized to `qm-4.4`. The item, its existing dependency, its mathematical claims and its runtime remain unchanged. This is no additional quota edge. All **49** written item dependency lists now equal their full syllabus rows.

## Evidence and preservation

The pre-batch KIN snapshot is from parent `f3d24d912f4ba0a6298605495f593d030db0fa5e`, under `/tmp/atlas-kin-prereqs/content/kin`. Evidence is under `/tmp/atlas-kin-prereqs`; these local logs and PNGs are not runtime dependencies.

- `KIN_PREREQUISITES_BASELINE_ROOT=/tmp/atlas-kin-prereqs node tests/verification-kin-prerequisites-preservation.mjs`: all **49 complete item objects and 49 visualization functions** preserved, except sixteen append-only ideas/dependency additions. Every other property, source flag, private helper, collection metadata and shared file is unchanged. Every affected full dependency list is exact; the complete syllabus equals the baseline plus those additions and the one authorized alias correction. All remaining written item/row lists agree too (`guard.log`). This guard requires an explicitly supplied immutable baseline and is excluded from default tests.
- `node tests/verification-kin-prerequisites-math.mjs`: **1,971 independently calculated assertions**, covering all sixteen inputs (`math.log`). Includes exhaustive independent-placement counts, reciprocal decay/half-life, log slopes, the exact water-rate Taylor remainder, cycle telescoping, exact Q10 error, rotated indefinite Hessians, numerical composite-rate derivatives, Eyring linearization, local barrier and tunnelling remainders, detailed-balance similarity, exhaustive weighted Bernoulli channel counts, finite waiting-time means, and shifted branching equations. These are finite witnesses and numerical checks alongside the explicit mathematical derivations, not numerical proofs of the target theorems.
- `node tests/verification-kin-prerequisites.mjs`: **32 fresh native cases**, all sixteen changed proof ideas at actual **320px**, light and dark themes (`native.log`, `native/`). Checks actual DOM bounds and inline mathematics plus runtime/TeX/paint errors. I personally inspected every complete own proof output in both themes: all were legible, with no clipping or horizontal overflow. Full-page outputs are also retained. All browsers closed. Unchanged functions are byte/preservation guarded; this is not a new full-control/replay audit of their existing behavior.
- Final `node scripts/build.mjs --strict`: **0 errors, 0 warnings**, 6684 written / 6890 planned / 450 chapters / 85 collections; home **112721 bytes gzip** (`build-final.log`). `node scripts/check.mjs kin --static`: **49 items, 0 errors, 0 warnings** (`static-final.log`). `git diff --check` passes.
- Read-only `crossFieldInventory(await loadAll())` gives **25/26/39**, no unknowns (`counts.log`). No inventory file was written. No existing bridge step references any changed KIN ID, so no bridge update is needed. No global ledger, coordination file or shared runtime was edited.

The explicit native/math/preservation scripts and small mapping manifest are review aids, not source-acceptance tests. Historical paper-body obligations and all current source flags remain as inherited. Independent peer acceptance is still required.
