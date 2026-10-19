# Cross-field prerequisite audit: learning and computing

Added **132** direct prerequisite edges across seven collections. Both endpoints are written and have different registered fields. Source statements, derivation ideas and flags are unchanged; matching syllabus dependency lists are synchronized. No browser or rendering work was needed for these metadata-only edits.

| Collection | Before | Added | After | Remaining shortfall |
|---|---:|---:|---:|---:|
| ml | 0 | 21 | 21 | 4 |
| deep | 17 | 12 | 29 | 0 |
| causal | 3 | 22 | 25 | 0 |
| toc | 7 | 20 | 27 | 0 |
| cplx | 3 | 25 | 28 | 0 |
| crypto | 1 | 24 | 25 | 0 |
| pl | 0 | 8 | 8 | 17 |

Five collections meet the 25-edge target. The remaining shortfalls are explicit:

- **ML (4):** Only 25 written entries exist, ending at finite-class uniform convergence. The remaining definitions/corollaries inherit probability through their existing local prerequisites. Extra links to those same foundations, or to later unwritten learning chapters, would pad the count rather than repair a directly used omission.
- **PL (17):** The 46 written entries cover elementary semantics, untyped lambda calculus and simple type safety. Most later proofs use structural induction, substitution and preservation already supplied by local items. Repeating a general induction axiom on each theorem, treating same-field CS links as cross-field, or using merely analogous logical theorems would inflate the graph.

The audit excluded same-field information-theory links from crypto counts, equivalent total-variation/birthday results that belong in see-links, and several already-transitive elementary foundations. The retained deep-4.2 → pma-5.15 link is explicitly named as the local Taylor step; it does not merely cite a foundation inherited through another theorem. The noisy-label definition points to conditional expectation rather than imposing a nice-space kernel hypothesis on arbitrary learning domains.

Two pre-existing syllabus mismatches were reconciled with their written items while mirroring additions: deep-4.2 used opt-7.4 in content but deep-4.1 in the syllabus; pl-3.10 omitted its existing pl-2.8 dependency in the syllabus.

Validation: scoped static check **325 items, 0 errors, 0 warnings**; all 132 edges have written endpoints in different fields; all edited item/syllabus dependency arrays agree; full written-plus-planned graph **13661 nodes, 0 cycles**. A comparison before/after confirmed that prose, visualization function bodies and source flags stayed unchanged. The peer-requested migration to a see-link is separately recorded in the JSON metadata-change list. Scoped whitespace check passes. The JSON ledger records every source and target file, existing-prose excerpt, target title and short reason.

## Exact additions and evidence

### ml

- `ml-1.1a → prob-1.6.1a`: The toy success probability is an expectation of 1/(1+K), not substitution of a mean.
- `ml-1.1a → prob-2.1.1a`: The n independent cue coincidences produce the 2^{-n} success parameter of the binomial impostor model.
- `ml-1.1a → comb-1.6`: The exact binomial impostor distribution uses the choice counts for its F−1 trials.
- `ml-2.1a → prob-1.1.1a`: The framework defines risk as the probability mass of an error event under a distribution.
- `ml-2.1a → alg-1.5a`: A predictor is explicitly a mapping from the instance domain to the label set.
- `ml-2.1b → opt-1.1`: ERM is the constrained minimization of an objective over a hypothesis class, including nonunique minimizers.
- `ml-2.1c → rca-2.20`: The memorizer counterexample needs finite sets to have zero uniform Lebesgue mass in the unit square.
- `ml-2.1e → prob-2.2.3a`: The training sample is explicitly an i.i.d. sequence with product law D^m.
- `ml-2.2 → prob-1.6.1`: The displayed overcount identity uses linearity of expectation for the event count N and monotonicity for its positive excess.
- `ml-2.3 → prob-2.1.13`: The realizable finite-class proof multiplies independent survival indicators to get (1−epsilon)^m.
- `ml-3.1 → prob-2.1.13`: The rectangle PAC example computes the probability that all independent examples miss a strip.
- `ml-3.2a → prob-4.1.1a`: Conditional label probabilities are conditional expectations of label-event indicators given the instance sigma-field; this definition does not impose an unnecessary nice-space kernel hypothesis on an arbitrary domain.
- `ml-3.2a → prob-1.6.1`: Linearity of expectation gives the stated unbiasedness of empirical indicator risk.
- `ml-3.2b → prob-4.1.13`: The Bayes-risk proof conditions on x and then averages conditional error over its marginal law.
- `ml-3.2b → prob-1.6.1`: Monotonicity and linearity of expectation turn the pointwise smaller conditional error into global risk optimality and its excess-risk identity.
- `ml-4.1 → prob-2.2.14`: The discussion explicitly invokes the fixed-h law of large numbers before distinguishing uniform representativeness.
- `ml-4.3 → pma-7.9`: The uniform-convergence definition uses the supremum of empirical-risk errors rather than pointwise error.
- `ml-4.5 → prob-2.7.1a`: The proof begins with the moment-generating function of a bounded centered variable.
- `ml-4.5 → prob-1.6.4`: The exponential tail proof explicitly applies Markov to exp(s sum theta_i).
- `ml-4.5 → prob-2.1.13`: The proof factors the mgf of a sum into the independent exponential moments.
- `ml-4.6a → comb-1.1`: The finite-precision argument counts bd independent binary choices by the product rule.

### deep

- `deep-1.1 → ladr-6.2`: The neuron uses the Euclidean inner product and orthogonality to specify its affine decision boundary.
- `deep-1.3 → ladr-3.46`: The network equation v^T sigma(Wx+b) directly uses row-times-column matrix multiplication.
- `deep-1.6 → opt-2.3`: Activation-pattern regions are explicitly intersections of affine halfspaces, hence polyhedra.
- `deep-3.1 → graph-1.10.1a`: The computational object is a directed graph with inputs, parent nodes and shared directed edges.
- `deep-4.2 → ladr-7.29`: The quadratic stability proof diagonalizes a real symmetric matrix in an orthonormal eigenbasis.
- `deep-4.2 → pma-5.15`: The extension from a quadratic to local smooth-loss dynamics explicitly invokes Taylor expansion.
- `deep-4.8 → ladr-7.70`: The linear-network proof uses low-rank matrix factorization and leading spectral subspaces.
- `deep-5.2 → prob-2.2.1`: The initialization derivation adds variances of independent centered summands.
- `deep-5.2 → prob-2.1.13`: The variance of each independent weight-times-activation term factors into the relevant second moments.
- `deep-5.3 → prob-1.6.9`: He initialization computes E[max(0,Z)^2] as a transformed expectation of a symmetric variable.
- `deep-5.4 → prob-3.10.7`: The mean-field explanation invokes joint Gaussian limits of wide-layer preactivations for two inputs.
- `deep-5.5 → ladr-7.57`: The isometry argument uses preservation of orthogonality under multiplication and unitary/orthogonal matrix characterizations.

### causal

- `causal-1.3 → prob-1.6.1`: The ATE identity is linearity of expectation applied to the individual effect.
- `causal-1.3 → prob-4.1.1a`: ATT and ATU are conditional expectations defined by treatment events.
- `causal-1.3 → prob-4.1.13`: The stated mixture of ATT and ATU uses the tower/total-expectation rule.
- `causal-1.6 → prob-4.1.9`: The selection-bias decomposition uses linearity of conditional expectation inside the treated group.
- `causal-1.7 → prob-2.1.1a`: Marginal exchangeability is explicitly independence between each potential outcome and the assignment.
- `causal-1.9 → prob-4.1.13`: Identification first conditions on L and then averages over L: the tower property is the final proof step.
- `causal-1.10 → prob-4.1.13`: The population effect is explicitly the prevalence-weighted mean of stratum effects.
- `causal-1.11 → prob-4.1.18`: The noncollapsibility calculation integrates the conditional binary law over the prognostic factor.
- `causal-2.1 → prob-2.1.1a`: Random assignment is defined by independence of the assignment mechanism and the potential outcomes.
- `causal-2.2 → prob-1.6.1`: Unbiasedness of a randomized difference in means is proved by averaging fixed potential outcomes over assignments.
- `causal-2.4 → comb-1.6`: The exact randomization distribution ranges over the choose(N,n1) equally likely treatment allocations.
- `causal-2.5 → prob-4.1.18`: Blocking randomizes using the conditional assignment law within each stratum.
- `causal-2.6 → prob-4.1.13`: Standardization averages stratum conditional outcome means over their natural covariate law.
- `causal-2.7 → prob-4.1.13`: The IPW proof first establishes the conditional expectation identity given L, then averages it.
- `causal-2.7 → prob-4.1.14`: Inside E[.|L], the inverse propensity is L-measurable and is taken outside the conditional expectation.
- `causal-3.1 → graph-1.10.1a`: A causal DAG is a directed graph whose edges encode parent/child directions.
- `causal-3.3 → prob-2.1.1a`: The Markov conclusion is explicitly conditional on mutually independent exogenous equation noises.
- `causal-3.5 → graph-1.4.1b`: The stated moral-ancestral criterion is vertex separation by Z in an undirected graph.
- `causal-4.4 → prob-4.1.18`: Simpson reversal is computed by marginalizing conditional success probabilities with group-dependent stratum weights.
- `causal-4.5 → prob-1.6.9a`: The explicit linear-model bias calculation uses variances/covariances of its Gaussian variables.
- `causal-4.7 → prob-2.2.1`: The bias-amplification denominators add independent Z, U and noise variances before and after residualization.
- `causal-3.5 → graph-1.3.1a`: The operational d-separation definition quantifies over graph paths with adjacent vertices, ignoring arrow directions.

### toc

- `toc-1.1 → comb-1.1`: The alphabet-size power is obtained by multiplying the independent choices for the n positions.
- `toc-1.2 → alg-1.2`: Regular-language union and its algebra use the ordinary algebra of sets.
- `toc-1.6 → alg-1.7a`: An object encoding must be injective, so different objects receive different strings.
- `toc-1.6 → graph-1.4.1a`: The worked CONNECTED language requires the mathematical definition of connectedness.
- `toc-1.7 → alg-2.1`: String induction is explicitly ordinary induction on the natural-number length.
- `toc-1.9 → logic-2.4`: The decision problem is formulated by the logical definition of satisfiability.
- `toc-1.9 → logic-2.5`: The source directly constructs an equivalent CNF from its falsifying assignments.
- `toc-1.10 → nt-1.6`: The factoring self-reduction relies on the least nontrivial divisor being prime and recursive prime factorization.
- `toc-2.1 → alg-1.5a`: A DFA transition is a total mapping on the Cartesian input/state domain.
- `toc-2.1 → graph-1.10.1a`: The state diagram is the directed labeled graph of transitions.
- `toc-2.3 → comb-4.6`: Accepted-word counting is exactly a transfer-matrix count over the automaton states.
- `toc-2.3 → ladr-8.29`: The stated proof invokes Cayley–Hamilton to turn the transition matrix into a linear recurrence.
- `toc-2.3 → comb-4.4`: The statement identifies the constant-coefficient recurrence with a rational generating function.
- `toc-2.4 → nt-2.1`: The DFA invariant and transition formula are arithmetic in residue classes modulo k.
- `toc-2.6 → alg-1.4a`: The simultaneous machine has a Cartesian product state space and product accepting sets.
- `toc-2.11 → alg-1.7a`: The no-reset observation uses injectivity of each letter permutation to prevent state merges.
- `toc-3.4 → comb-1.2`: The exponential determinization lower bound needs distinct remembered subsets to occupy distinct states.
- `toc-4.4 → alg-1.20a`: Myhill–Nerode begins with a reflexive, symmetric and transitive indistinguishability relation on strings.
- `toc-4.5 → alg-1.24a`: The canonical machine is formed from equivalence classes, using their partition into distinct states.
- `toc-4.6 → alg-1.20`: Uniqueness identifies every minimal DFA with the quotient by a bijection preserving transitions.

### cplx

- `cplx-1.9 → graph-1.1.1b`: Graph isomorphism is one of the explicitly defined NP-intermediate candidates.
- `cplx-1.9 → nt-1.1`: The natural factoring decision problem is formulated using divisibility and a bound on a nontrivial divisor.
- `cplx-2.1 → logic-2.5`: The variable/clause gadget construction starts with a 3CNF formula and its literal occurrences.
- `cplx-2.1 → alg-1.4a`: The 3DM instance is a relation of triples in a Cartesian product of three sets.
- `cplx-2.6 → opt-4.4`: The comparison and relaxation are linear-program feasibility over the real cube.
- `cplx-2.6 → opt-2.3`: Each clause is interpreted as a halfspace cutting away a falsifying cube vertex.
- `cplx-2.6 → logic-2.5`: The reduction directly uses the literal/clause structure of conjunctive normal form.
- `cplx-2.7 → graph-1.9.1b`: The problem and reduction measure the edge cut induced by a vertex bipartition.
- `cplx-2.8 → graph-2.1.1c`: The reduction begins with a vertex cover instance, one incident-edge set per vertex.
- `cplx-2.8 → graph-1.9.5a`: The cover/hitting-set duality transposes the graph incidence matrix.
- `cplx-2.9 → graph-5.1.1a`: The target problem is a proper vertex coloring with three colors.
- `cplx-2.9 → graph-4.2.1a`: Planarity is an explicit restriction of the problem and of the crossover-gadget embedding.
- `cplx-2.11 → logic-2.5`: The dichotomy uses CNF clause representations, including Horn and bijunctive constraints.
- `cplx-2.13 → logic-1.3`: The polynomial-isomorphism proof is explicitly an efficient Schröder–Bernstein construction.
- `cplx-2.14 → graph-5.5.1a`: The paper discussion directly uses clique and independent-set problems and graph complementation.
- `cplx-3.1 → logic-2.4`: TAUTOLOGY is defined by truth under every assignment, and the proof negates satisfiability.
- `cplx-3.2 → nt-3.1`: Pratt verification proves an element has multiplicative order p−1 modulo p.
- `cplx-3.2 → alg-4.28`: Polynomial verification explicitly evaluates modular powers by repeated squaring.
- `cplx-3.2 → nt-1.6`: The recursive certificate supplies and verifies the prime factorization of p−1.
- `cplx-3.4 → logic-3.4`: The two-player witness/challenge definition is the satisfaction semantics of existential and universal quantifiers.
- `cplx-3.4 → logic-2.4`: The formula-minimization example asks logical equivalence under every Boolean assignment.
- `cplx-3.7 → logic-2.5`: The completeness construction explicitly chooses 3CNF versus 3DNF according to the last quantifier.
- `cplx-4.1 → graph-1.10.1a`: The circuit object and directed gate dependencies are a finite directed acyclic graph.
- `cplx-4.6 → logic-1.2`: Arbitrary one-bit advice sequences encode all unary languages, producing an uncountable class.
- `cplx-4.11 → logic-2.8`: Associativity of the generate/propagate Boolean operation uses the Boolean algebra laws on AND and OR.

### crypto

- `crypto-1.3 → nt-2.1`: Encryption correctness is addition and subtraction of congruence classes modulo 26.
- `crypto-1.5 → alg-1.14a`: The substitution key is a permutation of the alphabet.
- `crypto-1.5 → comb-1.5`: The key-space size is the factorial count of alphabet permutations.
- `crypto-1.7 → comb-1.1`: The key-space size is a product of L independent 26-letter choices.
- `crypto-1.8 → comb-1.5`: The coincidence index counts ordered pairs without replacement with falling factorials.
- `crypto-1.9 → alg-1.15`: Reciprocity is checked by composing rotor permutations and their inverses around the reflector.
- `crypto-1.9 → comb-2.11`: The reflector is explicitly a fixed-point-free involution; its conjugate inherits reciprocity and no fixed points.
- `crypto-2.1 → stat-2.1`: Perfect secrecy is posterior equals prior, derived using the conditional-distribution/Bayes identity.
- `crypto-2.1 → prob-2.1.1a`: The definition explicitly requires independent sampling of message and secret key.
- `crypto-2.2 → prob-3.6.3a`: The optimal guessing advantage is half the total variation distance of the two ciphertext laws.
- `crypto-2.3 → alg-1.20`: The one-time-pad proof uses the unique key solution and bijective XOR translation to preserve the uniform law.
- `crypto-2.4 → comb-1.2`: The short-key impossibility is a pigeonhole argument: at most |K| decryptions cannot cover more than |K| messages.
- `crypto-2.7 → alg-3.22`: Reusing a pad exposes m1 XOR m2 by cancellation in the bitwise additive group.
- `crypto-3.10 → prob-2.1.11`: The randomized attack uses the product law of two independent encryption-coin samples to compute collision probability.
- `crypto-3.11 → alg-1.14a`: PRP security compares the oracle to a uniformly random permutation, with inverse access for a strong PRP.
- `crypto-3.12 → prob-1.1.1`: The CPA proof explicitly bounds the union of challenge-nonce equality events by q/2^n.
- `crypto-3.13 → comb-1.6`: The upper bound counts choose(q,2) potentially colliding pairs.
- `crypto-3.13 → prob-1.1.1`: Subadditivity over pairwise-collision events gives the stated upper bound.
- `crypto-3.15 → nt-4.8`: The public nonsquare y must have Jacobi symbol+1, and the security experiment distinguishes it from a square.
- `crypto-4.3 → alg-1.15`: Invertibility of an SPN follows from composing its bijective substitution, bit permutation and key-mixing layers.
- `crypto-4.4 → alg-1.15`: The Feistel proof explicitly composes reversible rounds and reverses the order for inversion.
- `crypto-4.4 → alg-3.22`: XOR cancellation reconstructs the previous left half without inverting F.
- `crypto-4.8 → prob-2.1.13`: The piling-up bias formula factors the expectation of a product of independent signed error bits.
- `crypto-3.10 → prob-1.1.1`: Coin equality implies ciphertext equality; monotonicity of probability gives the stated lower bound 2^{-w} even when distinct coins merge.

### pl

- `pl-1.1 → graph-1.5.3a`: The syntax representation is a finite rooted tree, with constructor nodes and immediate subterm children.
- `pl-1.2 → alg-2.5`: The statement explicitly gives the strong-induction-on-size formulation of structural induction.
- `pl-1.7 → alg-2.6`: Termination follows from impossibility of an infinite strictly decreasing positive-integer size measure.
- `pl-1.10 → alg-1.8a`: The denotation of sequencing is explicitly composition of partial state-transforming maps.
- `pl-1.10 → logic-3.4`: Validity of a Hoare triple evaluates pre/post assertions in initial and final stores.
- `pl-2.2 → alg-1.24a`: Terms are considered modulo alpha equivalence: the representation is a quotient into equivalence classes.
- `pl-3.10 → logic-4.1`: Curry’s derivation explicitly uses implication elimination by modus ponens twice.
- `pl-3.10 → logic-4.2`: The other load-bearing rule in Curry’s argument discharges C to derive C→Z, the deduction-theorem step.

## Independent peer correction

Climate independently reviewed a broad sample and identified cplx-2.9 → graph-5.1.1 as supporting only the four-color comparison sentence. It is now a see-link in the content and syllabus. The direct coloring-definition and plane-embedding prerequisites remain, and CPLX still has 28 qualifying links. The final ledger contains **132 additions**.
