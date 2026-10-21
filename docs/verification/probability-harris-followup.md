# Probability: Harris chains and the source's split construction — 2026-10-17

Reviewed all ten flags in `content/prob/ch05-z2.js`: `prob-5.8.1a`, `prob-5.8.4`, `prob-5.8.5`, `prob-5.8.6`, `prob-5.8.8`, `prob-5.8.9`, `prob-5.8.10`, `prob-5.8.11`, `prob-5.8.12`, and `prob-5.8.13`. The previous implementation used a different splitting construction under Durrett's numbered lemmas, omitted essential almost-everywhere qualifications, and conflated several finite simulations with exact continuous laws. This batch replaces that material consistently with the source's construction and corrected examples.

## Primary evidence and precise anchors

Rick Durrett, *Probability: Theory and Examples*, **Version 5, January 11, 2019**, [author-hosted PDF](https://sites.math.duke.edu/~rtd/PTE/PTE5_011119.pdf), SHA-256 `aeac36cbf5e44c53d69fa60a2d29a393e2d0e8c955ee103bd845d925fd910886`.

| Items | Read source |
|---|---|
| 5.8.1a | Unnumbered Harris-chain definition and Example 5.8.1, printed p.322 / PDF p.330; Example 5.8.2, pp.322–323 / PDF pp.330–331. The stable `a` identifier denotes the unnumbered definition. |
| 5.8.4–5.8.6 | Auxiliary-kernel construction, p.323 / PDF p.331; all three numbered lemmas and their proofs, p.324 / PDF p.332. |
| 5.8.8 | Example 5.8.7, recurrence definition, Theorem 5.8.8 and subsequent remark, p.325 / PDF p.333. |
| 5.8.9–5.8.11 | Stationary occupation construction, sigma-finiteness, finite-mass-on-A lemma and uniqueness proof, p.326 / PDF p.334. |
| 5.8.12 | Aperiodicity definition, convergence theorem, initial-state hypothesis and almost-everywhere note, p.327 / PDF p.335. |
| 5.8.13 | Explicit nonnegative-independent hypotheses and conditional-exponential proof, p.327 / PDF p.335. |

The author's recurrence proof contains an unresolved internal reference, and the occupation proof contains typographical subscripts. The rewritten explanations supply direct excursion and geometric-trial arguments; those printing defects are not treated as evidence for stronger conclusions. Removed historical priority/date credits: this audit verifies the specified textbook's mathematics, rather than original-publication chronology for Harris, Doeblin, Nummelin or Athreya–Ney.

## Definition and actual source kernels

The definition is stated in the source's **positive-accessibility convention**: every state has positive probability of hitting A. It does not assert almost-sure hitting. A constant common mass `epsilon*rho` is equivalent to the source's `q(x,y)>=epsilon` formulation, with rho a probability supported on B. The old countable-state example incorrectly chose A=B={a} even if `p(a,a)=0`; it now chooses any b with `p(a,b)>0`. The Gaussian example uses A=[−c,c] and **B=R**, rather than claiming that its full-space common density is supported in A.

The old pages described a residual-kernel splitting with a Bernoulli decision kernel from S and a normalized remainder divided by `1−epsilon`. That is a valid alternative construction under suitable hypotheses, but it is **not Lemmas 5.8.4–5.8.6 in the cited source**. The new helper constructs Durrett's full augmented kernel Q on S plus alpha:

- For x outside A, Q(x,S)=p(x,S) and Q(x,alpha)=0.
- For x in A, Q(x,C)=p(x,C)−epsilon*rho(C), and Q(x,alpha)=epsilon.
- Q(alpha,.) is the rho-average of Q's S rows.
- Recovery V fixes S and sends alpha to rho.

Writing U for the S rows of Q gives the finite-matrix identities **V U=Q** and **U V=P**. This is the rectangular-matrix representation of the source's `v pbar=pbar` and `pbar v=p` (the latter restricted to S starts). No division by `1−epsilon` occurs, so the important epsilon-one corner is supported. Heat maps now show P (41×41), Q (42×42), and V (42×41), with probabilities checked before the square-root colour transformation.

The alternating chain recovers first and augments second. Its even skeleton is the augmented Q chain, and its odd skeleton is the original P chain. The atom's next augmented law is Q(alpha,.)=rho U; its next recovered law is rho. The previous display omitted the atom from its TV computation. The corrected conditional-departure histograms use probability masses for **all 42 states**, including an explicitly separate alpha bar, and report empty history groups as unavailable. The expectation lemma now uses `fbar=Vf`, with fbar(x)=f(x) on S and fbar(alpha)=rho(f), and compares the two skeletons at the **same** time index. The four sample functions are bounded on the explicitly finite state space.

## Continuous minorization and finite approximation

For the Gaussian AR(1) means in the interval [a*lo,a*hi], put center=(a*lo+a*hi)/2 and d=abs(a*hi−a*lo)/2. The exact largest common density and its mass are

`m(y)=phi(abs(y−center)+d)`, `epsilon=2 Phi(−d)`.

This replaces a midpoint-integrated, truncated minorant whose estimated epsilon and inverse CDF did not define the claimed exact full-space common measure. Sampling the common law now chooses an equiprobable sign and a standard normal conditioned to exceed d, then returns `center±(Z−d)`. The remainder uses the acceptance probability `1−m(y)/p(x,y)`, evaluated through log densities and `expm1`. The displayed path is no longer clipped and fed back into the dynamics. Its full actual range is visible. A realised count of eligible steps is no longer labelled as providing a conditional expected number of successes: the path and that count depend on the same earlier coin decisions.

Finite examples use the same clearly specified approximation: transitions integrate the Gaussian into 41 cells, with exterior tails folded into the end cells, and the next step starts from a representative centre. The approximation is stochastic and useful for exact finite-matrix demonstrations, but its multi-step law and stationary vector are **not** labelled as the exact continuous Gaussian chain. The existing shared helper is preserved; all new source kernels and continuous sampling routines are in the dedicated `ch05-harris.shared.js`.

## Recurrence and initial-state qualification

The old 5.8.8 replaced Durrett's theorem with a stronger all-state statement and an invalid equivalence between recurrent alpha and almost-sure return from every state. The new statement uses the actual reachability measure

`lambda(C)=sum_{n>=1} 2^(−n) Q^n(alpha,C)`.

In the recurrent case, lambda-positive sets are visited infinitely often **from alpha**, and hitting alpha is almost sure for **lambda-almost every** start. Independent excursions prove the first conclusion. The strong Markov property shows that a reachable set carrying a positive chance of never returning would contradict recurrence at alpha, proving the second.

An exact countable analogue of Example 5.8.7 makes the missing qualification visible. State 0 is absorbing. From j>=2, jump to 0 with probability 1/j², otherwise to j+1. Every such state has positive probability of reaching A={0}; splitting the core with epsilon=1/2 gives a recurrent augmented class {0,alpha}. But the probability of avoiding it for n steps is

`product_{k=j}^{j+n−1}(1−1/k²) = (j−1)(j+n)/(j(j+n−1))`,

which tends to `(j−1)/j`, not zero. Lambda is supported on the recurrent core. This example also supplies a stationary probability delta_0 and aperiodicity, while TV from exceptional start j stays bounded away from zero. Thus the new convergence statement includes the source's essential condition `P_x(R<infinity)=1`, guaranteed only pi-almost everywhere in this generality. The previous “for every state” conclusion is removed.

The AR(1) mode is restricted to |a|<1; its quadratic drift outside a compact set and positive Gaussian transitions give the required hitting property. Its exact finite-time law for n>0 is `N(a^n*x0,(1−a^(2n))/(1−a²))`. At **n=0**, it now shows a genuine Dirac mass and TV=1, rather than replacing it with a tiny positive variance and describing it as a Gaussian density. Gaussian TV is evaluated from analytic crossing points and CDFs; the graph explicitly states its 10^−12 display floor. This replaces coarse absolute-density quadrature labelled “exact,” and an unreported numerical floor.

## Stationary measures and honest cycle accounting

The augmented cycle measure includes the initial alpha and excludes its terminal return. Simply restricting it to S, as the previous formula did, loses the atom's recovered rho contribution and need not be stationary for P. The corrected original measure is **mu=ubar V**. Both measures have total mass `E_alpha R`, and normalisation is only asserted when that mass is finite.

For the source's sigma-finiteness argument, sets `G_{k,m}={x:Q^k(x,alpha)>=1/m}` have finite expected cycle occupation: group visits at least k steps apart and dominate the number of trials by a geometric bound. These sets cover the reachable recurrent class up to a lambda-null set. Initial atom mass is one. Recovery adds only one probability measure to the S part, preserving sigma-finiteness.

The finite examples solve the killed-kernel equations `u_i=Q(alpha,i)+sum_{j in S}u_j Q(j,i)`, with `u_alpha=1`, and recover mu=uV. Their full normalization is cross-checked independently by finite Kac: `E_alpha R=1/(epsilon*pi(A))`. The simulation commits occupation counts only when a **whole augmented cycle** completes. If its 500,000-step budget interrupts a cycle, its entire buffer is discarded and its length reported. No completed-cycle count is used to divide an incomplete final cycle, and no tail states are dropped before normalization.

The finite stationary-measure correspondence now follows Lemma 5.8.10: eta(A)<infinity for any sigma-finite stationary eta; `etabar=eta U`, `etabar(alpha)=epsilon*eta(A)`, and `etabar V=eta`. The S part is `eta−epsilon*eta(A)*rho`, which generally removes mass outside A as well; the old picture merely scaled the bars within A. The atom bar and all other bars use their actual probability masses and a dynamic full range. Residuals of the stationary solve, augmentation, and recovery are reported separately.

The uniqueness example now solves two actual finite augmented occupation systems for two regeneration intervals. Their raw masses differ by the ratio of mean return times, and their normalized recovered vectors agree up to floating-point error. It no longer treats finite-window-normalized simulations as exact proportional measures or claims their stationary vector is the continuous Gaussian density.

## Independent nonnegative Y

The source explicitly requires both X and Y to be nonnegative and independent. The old uncertainty note claiming that the same coefficient `P(X>Y)` could be retained merely by waiting past the negative part of Y was false. For negative Y, the late exponential coefficient generally differs as well.

The corrected counterexample Y~U(−1,2) uses its actual unconditional tail: for 0<=t<1 it is `[(1−t)+(1−exp(−lambda*(t+2)))/lambda]/3`; for t>=1 it is `exp(−lambda*(t−1))*(1−exp(−3*lambda))/(3*lambda)`. Divide by its value at zero for the conditional tail. The display compares this exact curve, the empirical curve, and the exponential reference separately. Zero empirical tails are omitted on the logarithmic axis instead of raised to an artificial positive probability. Other choices satisfy the source's hypotheses and have their exact Laplace-transform coefficients.

## Validation and remaining scope

- `node --test tests/verification-harris.test.mjs`: **10 tests pass**. Independent rational kernels check both source identities, including epsilon=1. All finite Gaussian parameter corners are stochastic. Killed-kernel occupation is checked against independent power-iteration/Kac identities, full balance equations and explicit two-state rational values. A deterministic three-step cycle proves that partial-cycle buffers are discarded completely. Recovery, stationary augmentation and same-time expectations are checked directly.
- The continuous minorant is compared against all interval endpoints/interior points and independently integrated on a fine full-tail grid. A fixed-seed Gaussian sampling check covers six starting/parameter combinations, including near-unit common mass, testing mean, second moment and common-part frequency with eight-standard-error tolerances; it is a sampler regression, not proof of the general theorem.
- `scripts/verify-harris-gaussian.py` generates **8 independent 70-digit references** in `harris-gaussian-references.json` by adaptive integration of absolute Gaussian density differences, split at independently solved polynomial crossings. Production instead sums analytic CDF interval differences. All references agree within 3e−12. Atom/equal-law cases are checked separately.
- Exponential-difference formulas, including negative Y and the t=1 join, agree with direct independent integration over Y. Exceptional-state avoidance agrees with independently multiplied transition probabilities, including its nonzero limiting bound.
- `node tests/verification-harris.mjs`: **20 light/dark interaction groups pass**. Real controls cover continuous minorization endpoints and resampling; source-kernel matrix dimensions and epsilon-one corners; all atom-departure groups and full 42-state TV; all four functions and start/a corners for expectation transfer; recurrent/exceptional starts and horizon endpoints; completed-cycle/a/c corners; stationary augmentation corners; all 16 two-interval corners; AR n=0/1/40 and start/a endpoints, plus exceptional-state failure; all four Y laws and rate endpoints. All displayed data bars, paths and Monte Carlo points stay in their intended ranges. No runtime or TeX errors.
- `node tests/verification-harris.mjs --snapshots` checks all ten final layouts in both themes after restoring plot gutters and shortening axis labels. Representative light/dark plots were inspected directly: continuous minorant, full atom departure law, stationarity/occupation, exceptional starts, and conditional excess. These are explicitly agent checks.
- There are no audio controls in these ten entries. No Wave 5 work is started. The coordinating agent reconciles the central queue/master plan and runs the combined global checks after parallel batches are integrated.
