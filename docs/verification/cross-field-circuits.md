# Cross-field prerequisite audit: computing, circuits and imaging

108 direct prerequisites were added to 99 written items, with matching syllabus dependencies. Seven collections now have 25 written-to-written dependencies into a different field. Distributed computing has 17 and retains an honest shortfall of 8. No source flags were closed and no claims or visualizations changed.

| Collection | Before | Added | After | Shortfall |
| --- | ---: | ---: | ---: | ---: |
| algo | 16 | 9 | 25 | 0 |
| info | 9 | 16 | 25 | 0 |
| dist | 1 | 16 | 17 | 8 |
| cg | 5 | 20 | 25 | 0 |
| ctrl | 13 | 12 | 25 | 0 |
| circ | 8 | 17 | 25 | 0 |
| robot | 15 | 10 | 25 | 0 |
| imaging | 17 | 8 | 25 | 0 |

Counts use distinct directed dependencies and the collection field registry, excluding planned targets, aliases and see-links. The audit read the existing local statement/derivation and the target statement. Exact initial/final edges, file hashes and chapter/syllabus dependency arrays are in [cross-field-circuits.json](cross-field-circuits.json).

## Exact additions and existing claim anchors

### algo

- `algo-2.11` → `pma-3.20`: idea: dominant root wins because (r2/r1)^n tends to zero. Geometric-sequence limit supplies the stated dominant-root asymptotic.
- `algo-3.3` → `prob-1.6.1`: statement: E[sum indicators] = sum probabilities without independence. Linearity of expectation is the mathematical result used by the indicator method.
- `algo-3.12` → `comb-1.5`: idea: different input orders require n! decision-tree leaves. The permutation count supplies the leaf lower bound.
- `algo-4.2` → `ladr-3.46`: statement/idea: seven block products cancel to the four blocks of AB. Row-by-column matrix multiplication identifies the target block identities.
- `algo-5.18` → `prob-1.6.4`: idea: Markov's inequality converts expected collisions and table size into success probability above one half. The probability bound establishes constant expected construction retries.
- `algo-7.16` → `comb-1.7`: statement: (n-1) 2^(n-2) subset/end-city table entries. For each endpoint, the binomial sum counts all subsets of the other n-2 cities.
- `algo-8.20` → `graph-1.8.1`: statement/idea: an Euler tour exists exactly when all degrees are even. Euler's graph criterion is the structural premise of Hierholzer's splicing algorithm.
- `algo-10.18` → `graph-1.5.2`: statement: deleting k-1 MST edges leaves k nonempty components. The tree edge-count characterization applied to components gives the cluster count.
- `algo-11.24` → `ladr-9.43`: statement: every square submatrix determinant is 0 or plus/minus 1; idea: Cramer's determinant ratios. The determinant definition is required to formulate total unimodularity and the integer-coordinate argument.

### info

- `info-1.2` → `prob-2.4.1`: statement: iid sample average surprisal converges almost surely to entropy. The strong law supplies the asserted almost-sure convergence when entropy is finite.
- `info-1.3` → `pma-5.15`: statement/idea: h(p) is approximately 1-2(p-1/2)^2/ln 2 near its maximum. Taylor expansion gives the local quadratic entropy profile.
- `info-1.7` → `prob-1.6.1`: idea: take expectations of log 1/p(x,y) = log 1/p(x) + log 1/p(y|x). Linearity converts the pointwise log factorization into the entropy chain rule.
- `info-1.9` → `pma-1.20`: idea: grouping proves the formula for rational probabilities; continuity extends it to all real probabilities. Density of rational probability vectors supplies the extension step.
- `info-1.10` → `pma-5.13`: idea: l'Hopital's rule at alpha=1 recovers Shannon entropy. The derivative-ratio limit evaluates the indeterminate Renyi expression.
- `info-3.1` → `prob-2.2.3`: idea: finite-alphabet iid surprisals have finite variance; weak law and Chebyshev bound. The L2 weak law gives exactly the probability convergence and displayed rate.
- `info-3.6` → `comb-1.11`: statement: number of types is binomial(n+alphabetSize-1, alphabetSize-1). Stars and bars counts the nonnegative symbol-count vectors summing to n.
- `info-3.6` → `comb-1.12`: statement: the type-class size is the multinomial coefficient of the symbol counts. The multinomial word count supplies the exact size of each class.
- `info-3.10` → `stat-6.4`: idea: optimal regions are Neyman-Pearson likelihood-ratio tests. The simple-hypothesis optimal testing theorem identifies the finite-block optimum used in the explanation.
- `info-3.11` → `pma-3.14`: statement/idea: stationary conditional entropies are non-increasing and therefore converge. Nonnegativity and bounded monotone convergence establish existence of the conditional entropy-rate limit.
- `info-3.13` → `graph-1.2.1a`: statement: random-walk stationary distribution is d_i/(2m). The degree-sum identity (average degree equals 2m/N) normalizes the claimed probability law.
- `info-4.2` → `comb-1.2`: statement: finitely many suffix sets imply an empty or repeated state and termination. Pigeonhole on the finite collection of possible suffix sets supplies the stopping argument.
- `info-4.4` → `pma-3.20`: idea: S^k <= k*lmax; take kth roots and let k tend to infinity. The limits k^(1/k) and lmax^(1/k) tending to one yield McMillan's bound.
- `info-4.14` → `pma-3.26`: idea: sum_L 2^L 2^(-2L-1) = 1. The geometric series evaluates the infinite gamma-code Kraft sum.
- `info-4.16` → `prob-1.6.2`: idea: concavity gives E H(empirical p) <= H(p). Jensen's inequality is the averaging step in the upper bound on expected prefix complexity.
- `info-2.13` → `pma-5.11`: idea: the derivative of binary divergence minus 2(a-b)^2 changes sign at b=a, hence its minimum is zero. The derivative-sign monotonicity theorem supplies the binary Pinsker minimum argument.

### dist

- `dist-1.1` → `graph-1.10.1a`: statement: directed communication channels run along edges of a network graph. The directed-graph definition supplies the communication topology of the message-passing model.
- `dist-1.6` → `alg-2.1`: idea: induction on execution length from initial membership and transition closure. Mathematical induction supplies the entire invariant-assertion proof rule.
- `dist-1.10` → `alg-3.4`: statement: sliding sequence-number windows use arithmetic modulo n. Modular arithmetic supplies wrapping byte positions and acknowledgements in the protocol.
- `dist-2.1` → `graph-1.5.1`: idea: every process is reached and parent time decreases, hence connected acyclic pointers form a spanning tree. The tree characterization supplies the parent-structure correctness conclusion.
- `dist-2.1` → `graph-1.5.2`: statement/idea: save one flood message on each of the n-1 parent-tree edges. The tree edge count supplies the exact flood/convergecast message count.
- `dist-2.3` → `comb-2.1`: statement: rotation-invariant leader outputs occur in permutation orbits of size at least p. Permutation cycle decomposition supplies the orbit structure of ring rotations.
- `dist-2.7` → `prob-2.1.1a`: statement: each candidate draws an independent uniform random number every round. Independence supplies the positive probability of symmetry-breaking outcomes.
- `dist-2.7` → `stoch-2.5`: idea: candidate count is a finite Markov chain absorbed at one with probability one. The absorbing-chain theorem supplies almost-sure termination and finite mean rounds once every transient state reaches the absorbing state.
- `dist-2.8` → `prob-1.6.1`: idea: a constant fraction of active edges disappears in expectation per round. Linearity combines edge-removal indicators in the expected progress argument.
- `dist-2.9` → `graph-5.1.1a`: statement/idea: neighbouring colours stay different under the bit-position recolouring. The proper vertex-colouring definition supplies the invariant and the algorithm's output specification.
- `dist-3.2` → `pma-1.5`: statement: lexicographic timestamp/process pairs define a total order extending causality. The strict-order definition distinguishes the claimed total order from the happened-before partial order.
- `dist-4.4` → `comb-1.2`: idea: finitely many (k-1)-register covering sets force repetition of a covering set. The pigeonhole principle supplies the repeat used to restore the covering invariant.
- `dist-4.7` → `prob-2.1.1a`: statement/idea: fresh fair coin outcomes have a positive lower-bound probability of the progress pattern. Independence of fresh random choices supplies the pattern probabilities; this does not close the retained original-proof gap.
- `dist-4.10` → `comb-1.2`: idea: each of the other n-1 processes can foil a collect at most twice. The pigeonhole count bounds collects before a twice-moving writer or an unchanged collect is found.
- `dist-4.11` → `comb-1.2`: idea: any two strict majorities of n processes intersect. The pigeonhole intersection bound supplies the read/write quorum overlap.
- `dist-2.4` → `prob-1.6.1`: statement/idea: total message count is the sum of identifier travel distances, with mean n H_n over random arrangements. Linearity averages the travel-distance contributions to obtain the stated mean message count.

### cg

- `cg-1.1` → `opt-2.1`: statement: affine combinations have weights summing to one and are independent of origin. The affine-combination definition supplies the coordinate-free operation under discussion.
- `cg-1.4` → `pma-10.45`: idea: the shoelace formula is Green's theorem, one half of the boundary integral x dy - y dx. Green's area formula is explicitly invoked to identify the polygon sum with enclosed area.
- `cg-1.5` → `graph-4.1.1`: idea: for simple polygons the inside/outside crossing rule is the polygonal Jordan theorem. Polygonal separation justifies the agreement of crossing and winding rules for a simple polygon.
- `cg-1.6` → `ladr-2.28`: statement: every point has unique barycentric coordinates for affinely independent A,B,C. Unique basis representation after subtracting A establishes uniqueness of the affine coordinates.
- `cg-2.3` → `ladr-2.22`: idea: d+2 lifted vectors (p_i,1) in R^(d+1) must be linearly dependent. The independent-list dimension bound supplies the nonzero null vector defining the Radon partition.
- `cg-2.9` → `pma-3.26`: idea: round costs n*2^t form a geometric sum dominated by the last round. The geometric-series bound gives the total O(n log h) cost across guesses.
- `cg-2.10` → `prob-2.1.1a`: statement/idea: n independent uniform samples and the probability of an empty cap. Independence supplies the empty-cap probability underlying the random-hull model.
- `cg-2.10` → `prob-1.6.1`: idea: integrate the probability that a boundary point is a hull vertex. Linearity averages the vertex-indicator count to obtain expected hull size.
- `cg-2.11` → `graph-4.2.10`: idea: backward analysis bounds new facets using average facet degree below six. The planar edge bound applied to the polyhedral graph/dual supplies the constant expected local complexity.
- `cg-2.11` → `prob-1.6.1`: idea: each pending point is re-examined O(1) times in expectation per level, summed over levels. Linearity turns local expected conflict-list work into the total expected running time.
- `cg-2.12` → `graph-4.2.9`: statement/idea: V-E+F=2 for a convex polyhedral sphere. Euler's plane-graph formula supplies the face/edge complexity calculation.
- `cg-2.12` → `graph-1.2.1a`: idea: each vertex has at least three edges and every edge has two ends, hence 2E >= 3V. The degree-sum identity gives the complementary lower edge bound.
- `cg-3.3` → `graph-4.2.9`: statement: a connected DCEL plane graph has V-E+F=2 including the outer face. Euler's formula is an explicit structural invariant of the represented subdivision.
- `cg-3.5` → `graph-1.5.1a`: idea: the triangulation dual is a tree; its two leaves give two ears. The two-leaves property supplies the non-overlapping ears in the proof.
- `cg-3.6` → `graph-5.1.1a`: idea: three-colour the triangulation so each triangle has all three colours. Proper vertex-colouring and its independent colour classes formulate the guard selection argument.
- `cg-3.6` → `comb-1.2`: idea: the smallest of three colour classes has at most floor(n/3) vertices. The pigeonhole bound gives the quantitative guard count.
- `cg-3.9` → `pma-1.37`: idea: a path bending in free space can be shortened by cutting its corner. The Euclidean triangle inequality is the geometric step forcing shortest-path bends onto obstacle vertices.
- `cg-4.1` → `opt-2.3`: statement: intersection of half-planes a_i dot x <= c_i is a convex polygonal region. Halfspace/polyhedron definitions identify the exact feasible-set object being computed.
- `cg-4.4` → `prob-1.6.1`: statement: expected rebuild count is sum 2/i and expected work is sum (2/i)*O(i). Linearity combines the backward-analysis event indicators and their costs.
- `cg-4.7` → `comb-1.6`: statement: an arrangement of m lines in general position has binomial(m,2) vertices. The pair count gives the exact number of distinct line intersections.

### ctrl

- `ctrl-1.2` → `mech-9.6`: idea: gravity balances centrifugal force to give cos(phi)=g/(l*omega^2). The rotating-frame centrifugal force supplies the governor speed-to-height relation.
- `ctrl-1.9` → `ode-3.9`: statement: complex closed-loop poles cross into the right half-plane and give growing oscillations. The eigenvalue stability criterion translates root location into instability.
- `ctrl-1.11` → `mech-1.6`: idea: Newton's law m*v_dot=Fmax*u-kd*v^2-m*g*sin(theta) is linearized. Newton's second law supplies the physical cruise-control plant equation.
- `ctrl-1.13` → `ladr-9.46`: idea: expand det(I-G) as a signed sum over permutations. The permutation formula for determinants supplies the loop-product expansion.
- `ctrl-1.13` → `comb-2.1`: idea: each determinant permutation splits into disjoint cycles, identified with non-touching graph loops. Permutation cycle decomposition gives the combinatorial structure in Mason's formula.
- `ctrl-2.5` → `mech-4.7`: statement/idea: damped mass-spring equation and its stored energy/dissipation correspond to a series RLC equation. The damped harmonic oscillator supplies the mechanical side of the electromechanical analogy.
- `ctrl-2.6` → `mech-6.3`: idea: rolling without slipping constrains wheel velocities to their own directions. The nonholonomic rolling constraint supplies the bicycle kinematics.
- `ctrl-2.7` → `ladr-9.51`: idea: roots of det(sI-A) are the eigenvalues of A. The determinant-eigenvalue equivalence identifies the possible transfer-function poles.
- `ctrl-2.9` → `ode-3.12`: idea: exact variation-of-constants formula between sampling instants. Duhamel's formula yields Phi=e^(AT) and the held-input integral Gamma.
- `ctrl-2.10` → `pma-5.15`: statement: the Pade rational approximant matches the delay Taylor series through degree 2n. Taylor expansion is the local matching condition defining the approximation.
- `ctrl-2.13` → `ladr-7.68`: idea: a transmission zero is a rank loss where the smallest singular value vanishes. The rank/injectivity characterization by positive singular values supports the matrix-zero interpretation.
- `ctrl-12.13` → `prob-4.1.15`: idea: minimum-mean-square estimation is orthogonal projection in a Hilbert space of random variables. Conditional expectation as L2 projection supplies the filtering optimality argument.

### circ

- `circ-1.10` → `graph-1.9.5`: statement/idea: a spanning tree leaves b-n+1 chords, each producing an independent fundamental loop. The fundamental-cycle basis gives the graph-theoretic loop count.
- `circ-2.7` → `ladr-3.21`: idea: KCL incidence rank n-1 and complementary loop-space dimension b-n+1. Rank-nullity supplies the dimension count separating currents, potentials, and independent equations.
- `circ-2.8` → `ladr-7.9`: statement/idea: L=A diag(g) A^T and v^T L v is the sum of conductance-weighted squared voltage drops. The matrix-adjoint correspondence identifies the transpose factor with the adjoint and gives the Gram quadratic-form identity.
- `circ-2.9` → `ladr-7.62`: statement/idea: the grounded conductance matrix is positive definite, hence invertible. The positive-definite matrix characterization supplies the unique solvability conclusion.
- `circ-2.12` → `ladr-9.43`: statement/idea: tau=det(G), and tree-column minors have determinant zero or plus/minus one. The matrix determinant definition is required to formulate the tree-count/minor identities; it does not substitute for the absent full Cauchy-Binet item.
- `circ-2.13` → `opt-3.6`: statement/idea: effective resistance is a concave function of one resistance and is the minimum of flow energies affine in that resistance. The sign-reversed pointwise-supremum rule proves concavity of the infimum of affine flow-energy functions.
- `circ-2.14` → `stoch-2.2`: idea: hitting probabilities obey the same first-step weighted-average equations as node voltages. The first-step hitting-probability equations supply the stochastic side of the identification.
- `circ-3.6` → `ladr-7.6`: idea: voltage row space and current null space are orthogonal complements. The adjoint range/null-space orthogonality is the linear-algebra step in Tellegen's power identity.
- `circ-3.7` → `ladr-7.5`: idea: the inverse of the symmetric conductance matrix is symmetric. The inverse-adjoint identity supplies the transfer-resistance symmetry.
- `circ-3.9` → `ladr-3.43`: statement: cascading two-port networks multiplies their ABCD matrices. The matrix-of-composition identity supplies the cascade rule.
- `circ-3.11` → `graph-4.6.1a`: statement/idea: place one dual vertex per face and one crossing dual edge per original branch. The plane-dual construction supplies the network correspondence.
- `circ-4.2` → `pma-4.23`: statement/idea: continuous strictly increasing load-line difference changes sign and has exactly one zero. The intermediate value theorem supplies existence of the operating point.
- `circ-4.2` → `num-2.4`: idea: Newton replaces the diode by its tangent conductance/current-source model to find the operating point. Newton's tangent-zero iteration supplies the explicitly described nonlinear circuit solve.
- `circ-4.7` → `cm-4.10`: idea: the insulated gate attracts a surface electron channel only beyond threshold. The MOS depletion/inversion mechanism supplies the physical basis of the voltage-controlled switch model.
- `circ-4.9` → `logic-2.5`: idea: express an arbitrary truth table as an OR of ANDs of literals, then implement those with NAND. Disjunctive normal form supplies the functional-completeness construction.
- `circ-4.11` → `cm-4.6`: idea: emitter-injected electrons diffuse through the thin base and are swept into the collector by its field. Drift and diffusion supply the transport mechanism underlying the bipolar current-gain model.
- `circ-4.13` → `ode-3.9`: statement/idea: outer equilibria are stable, the symmetric equilibrium is a saddle when g>1. The eigenvalue stability criterion supplies the local dynamic interpretation of the loop-slope condition.

### robot

- `robot-1.2` → `ladr-3.21`: idea: honest mobility is n-rank of the constraint Jacobian. Rank-nullity gives the dimension of admissible instantaneous motions.
- `robot-1.3` → `top-2.14`: idea: identify opposite edges of the two-joint angle square to obtain a torus. The square-quotient construction supplies the stated configuration-space topology.
- `robot-2.3` → `ladr-8.46`: idea: split the matrix exponential power series using [omega]^3=-[omega]. The operator-exponential definition supplies the Rodrigues-series derivation.
- `robot-2.5` → `mech-10.20`: statement: unit quaternions compose rotations and q,-q represent the same rotation. The quaternion rotation/double-cover result supplies the rotation representation.
- `robot-2.6` → `ladr-3.43`: idea: appending a homogeneous 1 makes affine composition into matrix multiplication. The matrix-of-composition identity supplies frame chaining.
- `robot-2.10` → `ladr-3.132`: idea: wrench frame conversion is the transpose of twist conversion, by duality. The matrix of the dual map being the transpose supplies the force transformation rule.
- `robot-3.5` → `num-2.13`: idea: controllers track a platform pose incrementally with Newton's method on the loop equations. Newton's method for systems supplies the explicitly discussed forward-kinematics solve.
- `robot-3.6` → `pma-9.28`: idea: the implicit function theorem fails when the output constraint Jacobian loses rank. The implicit function theorem supplies local determination of output from joint coordinates away from singularities.
- `robot-4.6` → `pma-1.35`: idea: Cauchy-Schwarz for JJ^T bounds the motion/force gain product in a general direction. The inner-product inequality supplies the stated off-axis duality bound.
- `robot-4.7` → `ladr-7.111`: statement: product of singular values is proportional to manipulability ellipsoid volume. The singular-value volume formula supplies Yoshikawa's geometric measure.

### imaging

- `imaging-1.4` → `fa-7.1`: statement: the optical transfer function is the two-dimensional Fourier transform of the integrable PSF. The multivariable L1 Fourier-transform definition supplies H for the PSF itself; a whole-plane sinusoidal input need not be L1. Imaging uses cycles per length rather than Rudin's angular-frequency/unitary normalization, with the displayed 2pi kernel accounting for the convention.
- `imaging-1.6` → `prob-2.2.1`: idea: averaging n independent pixels/frames divides the noise standard deviation by sqrt(n). Additivity of uncorrelated variances supplies the noise-averaging law.
- `imaging-2.9` → `ladr-9.50`: statement/idea: two material thicknesses are recovered by an invertible 2x2 matrix whose determinant vanishes for coincident energies. The determinant-invertibility criterion supplies the basis-decomposition uniqueness condition.
- `imaging-3.6` → `fa-6.33`: idea: shift-invariant linear point-source blur implies b=f*(1/r). The translation-invariant-operator representation supplies the convolution step from point response to general object.
- `imaging-3.11` → `ladr-6.13`: statement: Kaczmarz correction is the residual divided by squared row norm, times the row normal. Orthogonal decomposition supplies the hyperplane projection formula and its distance decrease.
- `imaging-3.12` → `opt-1.6`: statement/idea: SIRT is a diagonally scaled gradient iteration on weighted least-squares normal equations. The least-squares objective and normal equations supply the reconstruction target.
- `imaging-4.6` → `rel-4.15`: statement/idea: a stopped positron-electron pair produces two back-to-back 511 keV photons. Four-momentum conservation in annihilation supplies the PET coincidence geometry and energy.
- `imaging-4.8` → `stat-3.12`: statement/idea: the Poisson EM update never decreases the likelihood; subsets lose that guarantee. The EM likelihood-monotonicity theorem supplies the exact full-data iteration guarantee.

## Direct applications already reachable by another path

Four added links were already reachable through a chain of prerequisites. They are retained because the local proof explicitly reapplies the result for a different step; none merely repeats a transitive foundation:

- `cg-3.9` → `pma-1.37`: The corner-cutting proof explicitly requires the Euclidean triangle inequality; its old route through convex-hull definitions never states this shortest-path step.
- `robot-3.6` → `pma-9.28`: The idea expressly names the implicit function theorem to determine output from joint coordinates; this is a fresh local-solution application beyond the earlier mobility count.
- `robot-4.6` → `pma-1.35`: The idea expressly applies Cauchy-Schwarz to the two reciprocal quadratic forms; the old route reaches it through the unrelated Jacobian chain-rule proof.
- `circ-4.11` → `cm-4.6`: The active transistor explanation directly invokes minority-carrier diffusion across the base and field-driven collection; the old route uses transport for a single equilibrium p-n junction.

## Distributed-computing shortfall

All 47 written items were reviewed. The 17 supported cross-field edges leave a shortfall of 8. Shortest-path/MST correctness links point into algorithms, also CS. Tree/convergecast facts in synchronizers and termination detection are already supplied by dist-2.1. General poset/lattice results suitable for the causality and consistent-cut proofs are not represented by a matching written item; specialized poset theorems would be unrelated. The clock bounds use elementary interval arithmetic and indistinguishability, while the remaining shared-memory arguments use CS definitions and invariants. These were not padded with broad mathematical foundations.

## Syllabus synchronization and validation

The 99 touched items now have exactly the same dependency lists in their chapter and syllabus. Eight syllabus entries had pre-existing drift (info-1.2, info-2.13, cg-4.1, ctrl-2.13, robot-3.6, imaging-4.6, circ-3.7, circ-4.7); the JSON preserves both old lists and the synchronized result.

`node scripts/check.mjs algo info dist cg ctrl circ robot imaging --static --fail-on-warnings` checked 523 visualizations: **0 errors, 0 warnings**. A fresh loader/validator check confirmed all 108 additions are present, all targets are written and in a different field, and the complete written/planned dependency graph has **0 cycles**. Before/after comparisons confirm only `deps` arrays changed in the 63 content/syllabus files. Existing informational planned-target notices remain and do not contribute to the counts. No browser work was launched during the final sweeps.

## Reciprocal peer follow-up

The imaging-1.4 target was refined to fa-7.1 because its integrable PSF has a Fourier transform while the whole-plane sinusoidal test input is not L1. The dependency ledger and syllabus are synchronized; counts are unchanged. Later text/model repairs to dist-2.7, robot-3.6 and imaging-4.8 are separately recorded in [imaging-mlem-followup.md](imaging-mlem-followup.md), outside the dependency-only snapshot comparison above.
