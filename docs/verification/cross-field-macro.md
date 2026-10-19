# Direct cross-field prerequisite audit: economics, social sciences and humanities

Audited the 11 assigned collections against master plan §7.3. Added **120** direct prerequisite edges on **103** written cards and mirrored every dependency array in the syllabus. Seven collections meet the 25-edge threshold; four retain honest shortfalls. No source flags were closed in this pass.

A qualifying edge has two written endpoints in different registry fields. A remote path to a theorem does not preclude a direct link when the card explicitly uses that theorem in its own proof; repeating a derivation already supplied by an immediate prerequisite was rejected. Generic implementation techniques, merely related examples, planned endpoints and semantically different theorems were excluded.

| Collection | Before | Audit additions | After audit | Audit shortfall |
| --- | ---: | ---: | ---: | ---: |
| macro | 12 | 13 | 25 | 0 |
| fin | 17 | 16 | 33 | 0 |
| game | 8 | 19 | 27 | 0 |
| behav | 10 | 12 | 22 | 3 |
| psych | 16 | 9 | 25 | 0 |
| soc | 18 | 7 | 25 | 0 |
| polsci | 20 | 6 | 26 | 0 |
| demo | 13 | 11 | 24 | 1 |
| art | 12 | 8 | 20 | 5 |
| ling | 10 | 10 | 20 | 5 |
| phil | 18 | 9 | 27 | 0 |

- **behav**: Three edges remained missing at the prerequisite-only audit. The subsequent Gaussian-model correction adds one, leaving a current shortfall of two. Planned Bayes/regression cards and descriptive classification examples are not counted as exact squared-error theorems.
- **demo**: One additional edge would be needed. Most remaining statements derive life-table bookkeeping from existing demography and renewal dependencies. No additional theorem was added solely to reach the threshold.
- **art**: Five additional edges would be needed. Several actual optical prerequisites remain planned (thin lenses, diffraction and related wave optics); perspective constructions and colour examples do not justify duplicate elementary foundations.
- **ling**: Five additional edges would be needed. Much of written phonology and morphology is descriptive. The actual spectrogram result is planned; generic Fourier definitions and unrelated Catalan-pattern results were not substituted to manufacture a written prerequisite.

The JSON companion records every exact directed edge, written status, source and target fields, target title, source file, quotation from the existing claim/derivation, and the reason the prerequisite is used. It also records all resulting qualifying edges so the counts can be independently recomputed.

## Semantic matching

- Independent peer review moved behav-3.18 → stat-3.2 from prerequisite to context (`see`): qualitative classification accuracy does not invoke the exact squared-error estimator-MSE decomposition. This lowers the audit batch to 120 additions on 103 cards.
- The behav-1.9 integration-by-parts edge supports the smooth displayed derivation; it does not claim to supply arbitrary-CDF or step-utility extensions.
- Synchronized five pre-existing syllabus omissions on macro-2.4, fin-3.13, game-3.7, behav-1.9 and psych-2.13; these mirror repairs add no new card-level edges and do not alter the counts.
- Corrected fin-4.3’s “least squares, pma-5.15 in spirit” cross-reference to opt-1.6, which actually supplies least-squares normal equations and residual orthogonality. Taylor’s theorem does not.
- Existing game-3.3 → fa-3.4 is correctly Hahn–Banach separation. The restored fa-5.11 concerns a different affine-group fixed-point theorem, so it was not substituted for Kakutani’s correspondence theorem.
- Lee–Carter’s least-squares rank-one approximation uses nla-1.8 (Frobenius-norm Eckart–Young), rather than the operator-norm-only ladr-7.92.
- Metamerism uses ladr-3.15 (noninjectivity and nonzero kernel), whose statement permits infinite-dimensional domains; the finite-domain rank-nullity theorem was not used to cover the infinite-dimensional spectral claim.

## Subsequent model corrections

Both findings below were subsequently corrected in [the model follow-up](macro-behav-model-followup.md), with independent math and native light/dark checks. That correction also adds behav-3.12 → stat-1.19, raising **current behav to 23** (shortfall 2). The 120-edge table above preserves the dependency-only batch; this extra edge follows the repaired model assumptions and is recorded separately in the JSON.

- **macro-3.12**: The phrase unemployment rate rises without bound cannot hold for a fraction; the dynamics with Y=min(K/v,L) should be reviewed separately before attaching additional differential-equation claims.
- **behav-3.12**: The general conditional-mean claim rho*x needs joint Gaussian scores or an explicit linear-conditional-mean assumption; independence of skill and luck alone does not imply that exact conditional expectation.

## Validation

- `node scripts/check.mjs --static --fail-on-warnings macro fin game behav psych soc polsci demo art ling phil`: 588 written cards; 0 errors, 0 warnings; exit 0.
- Fresh loadAll registry and per-addition assertions: 120/120 written targets, different FIELDs, matching existing text anchors, unique new source deps, full syllabus/card dependency-array equality for all 103 edited cards.
- validate dependency-cycle scan, written plus planned graph: 0 dependency-cycle errors.
- `git diff --check`: clean.

No browser work was launched for these metadata and cross-reference changes, as requested during the full visual sweeps.

## Added edges

| Written card | Written prerequisite | Existing use |
| --- | --- | --- |
| macro-2.11 | prob-4.1.1a | The stochastic Euler equation explicitly conditions marginal utility on current information. |
| macro-2.12 | prob-4.2.1a | The displayed conditional-mean restriction is the defining martingale property. |
| macro-2.4 | pma-9.23 | The explanation explicitly invokes contraction to obtain convergence to the unique unemployment fixed point. |
| macro-3.9 | pma-9.15 | The derivation differentiates the multivariate production function along the capital and labour paths. |
| macro-3.10 | ladr-6.55 | Partialling out controls is the orthogonal projection used in the existing regression explanation. |
| macro-4.8 | opt-1.6 | The written empirical growth equation is fitted by least squares, whose normal equations are supplied by the target. |
| macro-9.11 | opt-1.6 | The source-card explanation explicitly describes fitting the wage-change curve by least squares. |
| macro-3.8 | ode-1.5 | The existing linearized gap closes exponentially, using the solution of a constant-coefficient scalar growth/decay equation. |
| macro-4.2 | pma-3.14 | The explanation obtains convergence of positive capital iterates by monotonicity and boundedness. |
| macro-3.7 | pma-5.3 | The effective-worker transformation differentiates a quotient and a product to obtain the dilution terms. |
| macro-4.7 | pma-9.15 | The per-capita production identity is logarithmically differentiated to compare technical and population growth. |
| fin-2.5 | rca-3.3 | The immunization proof explicitly applies Jensen to the cash-flow maturity weights. |
| fin-2.11 | prob-2.7.1a | The bond-price calculation evaluates the exponential moment of an integrated Gaussian short rate. |
| fin-2.12 | pma-5.15 | The displayed small-default-probability credit-spread relation is a first-order expansion. |
| fin-3.3 | prob-1.6.1 | Portfolio mean is explicitly derived by linearity of expectation. |
| fin-3.3 | prob-1.6.3 | The covariance bound in the derivation is Cauchy–Schwarz, the p=q=2 case of the target. |
| fin-3.6 | opt-1.4 | The minimum-variance weight is obtained by setting the derivative of the quadratic objective to zero. |
| fin-3.13 | stat-1.3 | The stated error of an estimated mean scales as sample standard deviation divided by square root of sample size. |
| fin-3.14 | stat-1.19 | The mean–variance reduction explicitly relies on every linear portfolio of jointly normal returns being normal. |
| fin-3.14 | prob-2.7.1a | The CARA certainty-equivalent calculation evaluates an exponential moment of normal portfolio wealth. |
| fin-4.3 | opt-1.6 | Market-model beta and residual orthogonality are the normal equations of least squares. |
| fin-4.5 | ladr-3.21 | The sample-covariance singularity statement uses the rank bound of the centred observation matrix. |
| fin-5.2 | prob-2.2.1 | The random-walk calculation adds independent increment variances. |
| fin-5.2 | prob-3.4.1 | The explanation explicitly identifies the central-limit argument for aggregated price increments. |
| fin-5.6 | prob-4.1.15 | The variance-bound proof is the orthogonal conditional-expectation decomposition. |
| fin-5.9 | stat-3.5 | The conditional Gaussian GARCH objective is explicitly maximized as a likelihood. |
| fin-5.11 | prob-4.1.13 | Forward iteration of the conditional pricing equation uses the tower property. |
| game-1.2 | pma-4.16 | Nonempty best responses on compact action spaces are obtained by the extreme value theorem. |
| game-1.2 | opt-1.4 | The smooth interior best response is obtained by setting its action derivative to zero. |
| game-1.3 | prob-1.6.1 | The expected count of pure equilibria is the sum of the individual cell indicator expectations. |
| game-1.3 | prob-2.1.1a | The cell probability factors as 1/m times 1/n using independence of players’ payoff draws. |
| game-1.8 | pma-3.20 | The iterated surviving action bound tends to zero by geometric-power convergence. |
| game-1.10 | prob-1.2.4 | The symmetric mixed quitting time is explicitly exponentially distributed. |
| game-2.1 | prob-2.1.1a | Independent mixing gives joint cell probability p_i q_j. |
| game-2.1 | prob-1.6.1 | The indifference equations are weighted expected payoffs. |
| game-2.9 | stat-2.1 | Obedience is evaluated conditional on the player’s recommendation. |
| game-2.10 | pma-3.6 | The perturbation-limit proof explicitly chooses a convergent subsequence in the finite-dimensional simplex. |
| game-2.11 | prob-1.2.2a | Continuous private payoff shocks induce the threshold probabilities used by the purification argument. |
| game-2.5 | graph-1.2.1 | The finite complementary-pivot path argument uses even parity of degree-one endpoints. |
| game-2.5 | opt-2.3 | Best-response polytopes are defined by linear half-space inequalities. |
| game-2.4 | opt-2.12 | Best-response maximizers of a linear payoff on the simplex form a convex face. |
| game-3.5 | opt-3.6 | The lower envelope of affine payoff functions is concave. |
| game-3.5 | opt-2.12 | A linear payoff over the opponent’s simplex attains a minimum at a pure vertex. |
| game-3.7 | stat-1.16 | The exponential-weights potential proof invokes the Hoeffding exponential-moment bound supplied in the target’s idea. |
| game-3.10 | prob-4.1.1a | The realized-path approachability proof takes conditional expected distance increments. |
| game-4.1 | comb-1.1 | The strategy-count formula multiplies action counts across all decision nodes. |
| behav-1.9 | pma-6.22 | The dominance equivalences are explicitly derived by integration by parts. |
| behav-1.14 | opt-2.12 | The worst prior minimizes a linear expected payoff over an interval at an endpoint. |
| behav-1.7 | ode-1.5 | Solving constant absolute risk aversion makes marginal utility an exponential. |
| behav-3.1 | stat-2.1 | The aspiration-rule payoff explicitly uses the conditional distribution above the acceptance threshold. |
| behav-3.1 | pma-5.15 | The stated second-order loss around the optimal aspiration is the Taylor expansion at a stationary point. |
| behav-3.9 | stat-1.3 | The small-sample explanation uses the sample proportion standard error sqrt(p(1-p)/n). |
| behav-3.10 | prob-2.1.1a | The gambler’s-fallacy diagnosis uses independence of the next outcome from previous outcomes. |
| behav-5.3 | prob-1.2.4 | The hyperbolic discount function is derived as a mixture over an exponential rate distribution. |
| behav-5.10 | causal-3.4 | The discussion identifies common causes of waiting and achievement as the confounding fork behind the uncontrolled association. |
| psych-1.1 | stat-3.5 | The absolute threshold is located by fitting the psychometric curve by maximum likelihood. |
| psych-1.13 | prob-2.1.20 | The number-sense discrimination formula subtracts independent Gaussian magnitude codes. |
| psych-2.7 | stat-3.5 | Rating-category counts are fitted by a multinomial likelihood over the ROC parameters and thresholds. |
| psych-2.10 | stat-2.1 | The AUC identity is explicitly obtained by integrating the conditional signal-win probability over the noise observation. |
| psych-2.13 | prob-2.1.11 | Independent pixel-noise densities multiply before forming the ideal-observer likelihood ratio. |
| psych-2.13 | ladr-6.14 | Cauchy–Schwarz bounds the template response by the signal and template norms, with equality for the matched template; this is the stated cos(theta) efficiency loss. |
| psych-4.4 | prob-2.2.1 | The receptor-pooling signal-to-noise gain adds independent receptor variances. |
| psych-4.8 | pma-5.15 | The stated second-derivative approximation is explicitly obtained by Taylor expansion inside the convolution. |
| soc-2.3 | prob-3.6.1 | The sparse random-graph degree distribution uses the binomial-to-Poisson limit. |
| soc-2.4 | prob-1.6.9a | The friendship-paradox gap uses E[K²]=Var(K)+(EK)². |
| soc-2.9 | prob-2.1.1a | The cross-type random-mixing baseline 2p(1-p) factors independent endpoint probabilities. |
| soc-3.4 | stoch-4.7 | Consensus is derived from convergence of the finite stochastic-matrix powers, beyond existence of a stationary distribution. |
| soc-3.5 | prob-2.2.1 | The consensus-error variance is the sum of weighted independent initial-belief variances. |
| soc-3.5 | prob-1.6.4 | The vanishing-influence sufficiency proof controls consensus error using a variance probability bound. |
| polsci-2.12 | logic-2.3 | Premise-versus-conclusion aggregation is evaluated on valuations of the conjunction p and q. |
| polsci-3.12 | logic-2.4 | The impossibility is about preservation of logical consistency and consequence across the judgment agenda. |
| polsci-5.3 | comb-1.6 | The pivotal-vote probability explicitly counts half-A ballots with the binomial coefficient. |
| polsci-5.4 | prob-2.2.6 | The independent-jury majority converges to the correct decision by the variance-bound weak law. |
| polsci-5.5 | stat-2.1 | The exact common-leader mixture is obtained by conditioning on leader correctness; voters are independent within each conditional law. |
| demo-1.6 | ladr-3.21 | Age–period–cohort nonidentification is proved using the design matrix’s nonzero null vector. |
| demo-2.8 | stat-2.1 | Expected age at death among survivors is computed from the conditional truncated distribution. |
| demo-2.11 | prob-2.1.1a | Cause elimination relies on independent competing survival mechanisms, an assumption not testable from marginal hazards. |
| demo-3.1 | opt-1.6 | The Gompertz explanation explicitly estimates log-hazard slope and intercept by least squares. |
| demo-3.3 | stat-2.1 | The posterior frailty among survivors is obtained by weighting and renormalizing the birth density by survival. |
| demo-3.6 | ladr-7.70 | The mortality-index factorization is explicitly constructed by SVD. |
| demo-3.6 | nla-1.8 | The rank-one mortality fit minimizes squared residuals, so the relevant low-rank theorem is the Frobenius-norm Eckart–Young result, not the operator-norm-only LADR result. |
| demo-3.5 | opt-1.6 | The Brass logit relation is explicitly estimated by ordinary least squares. |
| demo-4.10 | prob-1.6.9a | The length-biased family-size gap uses the identity between second moment, squared mean and variance. |
| demo-4.10 | prob-1.6.13 | The special-case extra-child formula uses equality of Poisson mean and variance. |
| art-1.9 | ladr-6.10 | The three-vanishing-point orthocentre proof uses orthogonality expressed by a vanishing inner product. |
| art-1.10 | ladr-3.1 | Changing station point is explicitly derived as a linear shear and scale of reconstructed floor coordinates. |
| art-1.15 | waves-4.5 | The equal-height reflection construction uses the plane-mirror equal-angle law. |
| art-3.6 | waves-4.15 | The filter-composition derivation explicitly invokes Beer–Lambert attenuation. |
| art-4.3 | ladr-3.15 | Metamerism is explicitly explained by noninjectivity of the linear cone-response map, equivalently a nonzero kernel; the chosen target allows infinite-dimensional domains. |
| art-4.7 | opt-2.1 | The chromaticity region is derived as the convex hull of monochromatic locus points. |
| ling-1.1 | sig-3.10 | Source harmonics are multiplied by the vocal-tract frequency response, as the existing derivation states. |
| ling-1.1 | sig-4.1 | The voiced-source line spectrum is explicitly its Fourier series. |
| ling-2.6 | comb-1.5 | The candidate orderings of k phonological rules are explicitly counted as k! permutations. |
| ling-4.1 | opt-1.6 | The discussion explicitly fits the log frequency–log rank line by least squares, with a warning about that fit. |
| ling-4.2 | prob-2.1.1a | The word-probability derivation multiplies independent keystroke probabilities. |
| ling-4.2 | comb-1.1 | The rank calculation counts M^ell possible strings of a fixed length. |
| ling-4.8 | info-2.7 | The text explicitly states that true conditional entropy cannot increase with context. |
| ling-4.9 | stoch-1.1 | The n-gram model is explicitly identified with a Markov chain on word contexts. |
| phil-1.2 | logic-3.4 | The Venn decision procedure evaluates quantified categorical statements in set-valued interpretations. |
| phil-1.3 | stat-2.1 | The explicit probabilistic qualification of affirming the consequent computes a conditional probability. |
| phil-1.5 | prob-2.1.1a | The existing quantitative argument-strength model uses independent noisy-OR probabilities. |
| phil-1.6 | logic-4.1 | The Tortoise regress distinguishes adding a conditional premise from applying modus ponens. |
| phil-3.1 | logic-4.1 | The sorites derives the endpoint by repeated modus ponens from tolerance instances. |
| phil-3.4 | logic-2.3 | Supertruth is evaluated under classical valuations at every admissible precisification. |
| phil-4.5 | logic-4.2 | Curry’s proof explicitly discharges the assumption to infer the conditional. |
| phil-4.5 | logic-4.1 | Curry’s proof explicitly uses modus ponens before and after conditional proof. |
| phil-4.8 | stat-2.1 | The stated surprise-exam hazard is a probability conditional on no earlier exam. |
| macro-2.14 | opt-1.6 | The historical production-function fit is explicitly a straight-line fit of log output per worker on log capital per worker. |
| macro-4.1 | ode-3.8 | The Ramsey phase-portrait argument explicitly classifies the linearization as a planar saddle from its opposite-sign eigenvalues. |
| behav-1.8 | pma-3.26 | The calibration bound explicitly caps a geometric sum of future utility increments. |
| behav-3.8 | prob-1.1.1 | The Linda inequality is explicitly derived from probability monotonicity under event inclusion. |
| behav-2.12 | prob-1.2.5 | The displayed horizon-dependent loss probability is the normal CDF evaluated after standardizing the stated normal log-return model. |
| psych-2.5 | ladr-3.63 | The sensitivity/bias identification proof explicitly inverts a two-dimensional linear transformation of normal quantiles. |
| soc-4.9 | ode-1.3 | The preferential-attachment age-degree power law is obtained by separating dk/k=dt/(2t). |
| polsci-4.5 | opt-2.3 | The Plott proof identifies voters nearer a challenger with an open halfspace beyond a perpendicular-bisector hyperplane. |
| demo-1.6 | opt-1.6 | The age–period–cohort ambiguity is stated as a least-squares design with a null direction, hence unchanged fitted values and residual objective. |
| art-3.4 | pma-5.8 | The rainbow angle is selected by the interior stationary point of the ray-direction map. |
| art-3.3 | mech-2.3 | Newton’s mixture rule explicitly computes the centre of gravity of weighted arc locations. |
| ling-4.6 | ode-1.4 | The stated Altmann family follows by integrating the nonconstant linear ODE y′=(b/x-c)y. |
| ling-2.13 | comb-1.5 | The factorial typology explicitly enumerates all permutations of the constraint ranking. |
