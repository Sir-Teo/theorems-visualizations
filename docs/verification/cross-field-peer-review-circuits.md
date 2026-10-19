# Independent peer review of energy cross-field prerequisites

Read **41 source/target pairs across all 11 collections**, including the actual statements, derivations and scopes. **35 links are accepted or accepted with a model qualification; six target refinements are agreed with the owner.** This is a semantic sample, not a census or a quota-filling exercise.

| Collection | Reviewed | Accepted / qualified | Refine / remove |
| --- | ---: | ---: | ---: |
| waves | 4 | 4 | 0 |
| thermo | 3 | 3 | 0 |
| cm | 4 | 3 | 1 |
| qinfo | 4 | 4 | 0 |
| rel | 3 | 3 | 0 |
| fluid | 3 | 2 | 1 |
| xtal | 5 | 5 | 0 |
| mat | 4 | 3 | 1 |
| energy | 3 | 3 | 0 |
| solid | 5 | 2 | 3 |
| aero | 3 | 3 | 0 |

The six refinements concern hypotheses and mathematical scope:

- `cm-3.13` → `opt-3.3`: A Landau polynomial can be globally nonconvex while the chosen phase is a stable local minimum. The global convexity criterion is stronger than the local curvature test actually used. The owner independently identified this issue. Owner replaces opt-3.3 with opt-1.5 (local second-order optimality), mirroring syllabus and energy ledger.
- `fluid-1.2` → `ode-2.4`: The source defines particle paths by X_t=u(X,t), but does not assume a spatially Lipschitz velocity or assert the local unique solution theorem. The ODE/IVP definition is the direct formulation prerequisite; a Lipschitz existence theorem would add unsupported hypotheses. Owner replaces ode-2.4 with ode-1.1, mirroring syllabus and energy ledger.
- `mat-3.6` → `solid-1.14`: The target gives an axial bar with u=sigma^2/(2E). The source needs shear and multiaxial plane-strain energy around a dislocation, including the edge factor 1/(1-nu). The uniaxial formula is an analogy and cannot supply that constitutive energy density. Cylindrical integration remains a valid separate prerequisite. Owner removes solid-1.14 from chapter, syllabus and ledger; no replacement inserted to retain quota.
- `solid-2.6` → `pma-10.39`: The source asserts global displacement reconstruction on a simply connected region. The target only states closed forms exact on a convex region. Local convex patches alone do not state the required global path independence; a matching written curl-free/gradient converse exists. Owner replaces pma-10.39 with vcalc-3.8, mirroring syllabus and ledger.
- `solid-3.9` → `ode-4.3`: The axisymmetric Airy compatibility equation is fourth order: Delta^2 phi=phi^(4)+2phi^(3)/r-phi^(2)/r^2+phi^(1)/r^3=0. Its Euler indicial polynomial is s^2(s-2)^2, giving 1, ln r, r^2, r^2 ln r. The target only states a second-order Frobenius theorem, and the source does not perform a reduction into its hypotheses. Owner removes ode-4.3 from chapter, syllabus and ledger; no unsupported generalized Frobenius target inserted.
- `solid-2.12` → `pma-10.39`: The Airy construction integrates closed one-forms globally on a simply connected plane region, whereas the cited target states convex domains. The actual path-independence step is covered by vcalc-3.8 (plane fields embedded in R3), without restricting the physical domain to convexity. Owner replaces pma-10.39 with vcalc-3.8, mirroring syllabus and ledger.

The owner accepted the five peer-identified refinements and independently found the CM3.13 local-vs-global Hessian issue. The peer does not edit the energy owner's files. The owner confirmed all six metadata changes, exact syllabus mirrors, 557 scoped static items with zero errors/warnings, and zero global dependency cycles. Its batch now has 172 additions; materials and solid mechanics each have 27 cross-field links. BB84 statement/caption/control wording now explicitly matches its independent Bernoulli interception computation.

Same-name links were not rejected by label alone. For example, the fixed-string normal-mode result is exactly the mathematical frequency condition used by standing waves; crystallographic lattice basis vectors are distinguished from the atomic motif; the stereographic conventions differ only by a similarity. The thermodynamic Legendre transform is the negative convex conjugate, so its concavity is consistent with the cited theorem.

The accepted probability product links use the actual finite product rule in prob-2.1.5. BB84's expression requires independent interception/sampling outcomes; the owner was asked to make its Bernoulli-interception interpretation explicit, rather than implying a fixed-size sample has independent outcomes. The Cauchy and Poisson links are constituent formula/definition prerequisites, not claims that those targets alone prove boundary-limit or free-space Green-function theorems.

All exact source text read, target statements, individual assessments and owner actions are preserved in [cross-field-peer-review-circuits.json](cross-field-peer-review-circuits.json). No browser, renderer, source-flag closure, or shared runtime edits were used for this audit.
