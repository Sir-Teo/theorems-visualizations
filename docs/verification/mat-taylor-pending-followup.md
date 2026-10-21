# Materials pending-original correction — Taylor 1934

**mat-3.13 remains `verify: true`; zero queue closures are claimed.** The named original is not available in full in this review. This report repairs a separately specified numerical illustration while preserving that source-access limit.

## Source-access status

The [publisher DOI/PDF endpoint](https://royalsocietypublishing.org/doi/pdf/10.1098/rspa.1934.0106) did not yield the full original to the web reader in this pass. Exact DOI/title searches returned bibliographic records, abstracts, later citations and extracts; none supplied the complete 26-page 1934 article. The parent independently found only lecture extracts. No original PDF, hash, full-paper reading, historical priority audit or original-model reproduction is claimed.

The limited broad historical sentence now cites [Kauffmann and Heilmaier, KIT Plasticity lecture, version 14 February 2022](https://www.iam.kit.edu/wk/downloads/PoMI/4a-Dislocations-Concept_web.pdf), complete relevant historical overview slides 20–22 actually read. The full author lecture was acquired for the prior materials review, SHA256 `dec6905b6e504ce4fecb13b419373d44bf1aa85b79d267dbaa8e125a9ff7529f`. Its discussion emphasizes predecessors and a nonlinear history, so the old claim that Taylor coined the term, a detailed description of his unread atomic model, and priority embellishments were removed. This modern author overview does not close a named-original-paper review.

## Supported numerical correction

The old program declared either a large displacement **or a failed force-residual tolerance** to mean that the kink “runs away.” A geometrically bisected threshold and exponential regression then amplified this unproved classification. Fixed endpoints actually make the finite chain's harmonic elastic energy coercive for positive stiffness: the Dirichlet spring quadratic form is positive definite, and neither the bounded substrate term nor the linear force term removes its quadratic growth at infinity. The chain therefore cannot demonstrate unbounded runaway under constant force.

The new illustration states its own energy, boundary conditions and units explicitly, as a modern finite-chain model. It removes threshold bisection and fitted exponential claims. Its interior gradient is independently differentiated from the given energy. The Hessian norm is bounded by `L=4K+2pi²`; gradient descent with `eta=.8/L` satisfies the descent lemma `E(x−eta*g) <= E(x)−eta*(1−L*eta/2)*||g||²`. This analytical statement concerns energy descent, not convergence to a stable or unique minimum.

The UI now plots site-index registry and actual residual history from a finite fresh relaxation. The zero-force reference has its own reported residual. It distinguishes numerical stationarity from budget exhaustion, retains exact fixed endpoints and reports energy change, displacement and pseudotime. A half-step option doubles the iteration budget at the same requested pseudotime; Run longer changes the budget explicitly. Small residuals do not certify minimum stability. The single-site substrate maximum pi is labelled a reference force, not the collective depinning threshold. Histories and registries use adaptive extents, and logarithmic residual flooring is stated.

## Evidence

- `node --test tests/verification-mat-finite-chain.test.mjs`: **5/5 independent math groups passed**. Centered finite differences of an independently written potential check the gradient; nine stiffness/force protocols check sampled energy decrease, immutable initial state, exact endpoints and recomputed final residual; incomplete and zero-budget stationary cases are distinguished; a finer independently stepped Euler trajectory checks half-step refinement at equal pseudotime; registry-width extraction is checked separately. These finite checks supplement the explicit descent/coercivity arguments and do not prove infinite-chain behavior.
- `node tests/verification-mat-finite-chain.mjs`: **2/2 actual light/dark groups passed**, all eight stiffness/force/budget corners, incomplete-state labeling, actual half-step toggle, doubled iteration accounting and Run longer button. Runtime, KaTeX and finite plotted path/dot extents pass. No computed threshold or runaway claim remains in readouts.
- `node scripts/check.mjs mat-3.13 --static`: **one item, 0 errors, 0 warnings**. All three chapter dependency arrays and the completed 3.11/3.12 entries are preserved. Whitespace check clean.
- Captured `/tmp/atlas-mat-taylor-pending-{light,dark}.png`; final dark screenshot inspected. Scope/source flag explicitly retain the original-paper uncertainty.

New helper `content/mat/source-audit-finite-chain.shared.js`; dedicated math/browser checks `tests/verification-mat-finite-chain{.test,}.mjs`. Required remaining source work is acquisition and complete review of Taylor's original before any paper-specific verification closure. The Wave 5 gate remains unchanged.
