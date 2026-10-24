import * as U from './ch06.ui.shared.js';
import { sources } from './ch06.shared.js';
export default { collection: 'causal', chapter: 6, items: [
  {
    num: '6.7', kind: 'Theorem', name: 'Manski’s no-assumption bounds',
    statement: String.raw`Let A,Y(0),Y(1) be binary, assume consistency Y=Y(A), and know the population distribution of (A,Y). Write p_ay=P(A=a,Y=y). Without an exchangeability or instrumental assumption, the sharp bounds on τ=E[Y(1)−Y(0)] are
$$-p_{01}-p_{10}\le\tau\le p_{00}+p_{11}.$$
Their width is one. If one additionally assumes monotone treatment response Y(1)≥Y(0) for every unit, the sharp interval becomes
$$0\le\tau\le p_{00}+p_{11}.$$
“No assumption” still retains the stated binary support and consistency.`,
    idea: String.raw`In the treated group Y(1) is observed; its missing Y(0) may be anywhere between zero and one. In the untreated group the reverse holds. The smallest effect fills untreated missing Y(1) with zero and treated missing Y(0) with one. Reversing these choices gives the largest effect. Both completions preserve the entire observed table. Mixing the two completions attains every intermediate effect. With monotone response, an untreated Y=1 must have Y(1)=1, and a treated Y=0 must have Y(0)=0. The remaining two cell types contribute any amount from zero up to their combined mass, proving the second interval and its sharpness.`,
    caption: String.raw`Edit the observed cell weights, then slide between counterfactual completions without changing any observation. Compare the unrestricted interval with the additional monotone-response assumption. The gold point is the ATE of an actual completed population.`,
    scope: String.raw`These are population identification bounds for binary outcomes, not confidence limits estimated from a finite sample. Monotone outcome response differs from the no-defiers restriction on potential treatments. All-zero observed weights define no probability law and produce no interval.`,
    deps: ['causal-1.3'], refs: ['Supplied missing-potential-outcome proof; Hernán–Robins, What If, Technical Point 16.2 for the role of bounds; Balke–Pearl 1997, §1 historical context'], links: { source: sources.book }, tags: ['partial identification', 'Manski bounds'], viz: U.noAssumptions,
  },
  {
    num: '6.8', kind: 'Theorem', name: 'Balke–Pearl bounds with an instrument',
    statement: String.raw`Let Z,A,Y be binary and suppose both Z arms have positive probability. Impose consistency, exclusion and joint independence of Z from all potential treatments and outcomes. A response type is
$$t=(a_0,a_1,y_0,y_1)\in\{0,1\}^4.$$
Let q_t be its population mass, and let p_ay.z=P(A=a,Y=y|Z=z) be known. Feasible populations obey q_t≥0, Σ_tq_t=1 and, for every a,y,z,
$$\sum_{t:a_z=a,\ y_a=y}q_t=p_{ay.z}.$$
Minimizing and maximizing Σ_t(y₁−y₀)q_t over these 16 masses gives the sharp ATE bounds. If the constraints are infeasible, no population satisfies the stated model. No monotonicity assumption is needed.`,
    idea: String.raw`Every admissible causal population induces a distribution on the sixteen potential-response types. Randomization and consistency give exactly the displayed linear cell constraints, and its ATE is the linear objective. Conversely, any nonnegative feasible mass vector defines a causal model: sample a type independently of Z, then set A=a_Z and Y=y_A. Thus there are no missing constraints in this finite representation. A nonempty feasible set is a closed subset of a probability simplex, so both objective extremes are attained. Their attaining populations establish sharpness, and mixtures preserve the observations while filling the interval. Excluding defiers deletes four response types and can tighten the bounds or make the model infeasible.`,
    caption: String.raw`Edit the two conditional tables and compute exact rational bounds. The stacked bars show a feasible population formed by mixing the two attaining extremes. Try a perfect-compliance table, an incompatible table, or the additional no-defiers assumption.`,
    scope: String.raw`The scene solves both finite linear programs with exact rational arithmetic and checks every observed-cell equality in its witnesses. A fixed pivot budget is retained as an explicit solver status rather than interpreted as infeasibility. Integer input weights are normalized within each Z arm; a zero-weight arm has undefined conditional probabilities. Identification intervals at known population tables are distinct from sampling confidence intervals. Relevance is not required merely to compute bounds.`,
    deps: ['causal-6.1', 'causal-6.7', 'opt-6.2', 'opt-6.6'], refs: ['Balke–Pearl 1997, Bounds on Treatment Effects from Studies with Imperfect Compliance, §§2–3, pp1171–1173; response-type sharpness construction supplied here'], links: { source: sources.bounds }, tags: ['Balke–Pearl bounds', 'linear programming'], viz: U.bounds,
  },
  {
    num: '6.9', kind: 'Theorem', name: 'The instrumental inequality',
    statement: String.raw`Suppose an instrumental model has finite treatment, outcome and instrument state spaces, consistency, exclusion, and joint independence of Z from the potential responses. Every instrument value considered has positive probability. Write p_ay.z=P(A=a,Y=y|Z=z). For each treatment a, these probabilities satisfy
$$\sum_y\max_z p_{ay.z}\le1.$$
A population-table violation refutes the conjunction of these assumptions. Passing this necessary restriction does not establish the validity of a proposed instrument in the real causal system.`,
    idea: String.raw`For fixed a,y,z, consistency and exclusion express the observed cell as the event A(z)=a and Y(a)=y among units assigned z. Joint independence removes the conditioning on Z. This event is contained in Y(a)=y, so its probability is at most P(Y(a)=y), regardless of z. Take the maximum over z separately for each outcome, then sum over y. The potential-outcome events for different y are disjoint and exhaust the population, so the sum is at most one. For example, if A is always zero but Y equals Z deterministically, the two maxima at a=0 sum to two.`,
    caption: String.raw`Edit the conditional probabilities through nonnegative cell weights. Compare each treatment-specific sum of maxima with one. The incompatible preset keeps treatment fixed while flipping outcome with the instrument, creating a direct violation.`,
    scope: String.raw`The theorem is a necessary condition for finite variables; the scene uses binary ones. The plotted table is treated as a population distribution. A finite empirical table may violate an inequality through sampling noise, so applying this as a statistical test requires separate uncertainty control. Failure does not tell us which assumption is wrong.`,
    deps: ['causal-6.1'], see: ['causal-6.8'], refs: ['Balke–Pearl 1997, §3 Eq6 and its generalized form, p1173; event-inclusion proof supplied here'], links: { source: sources.bounds }, tags: ['instrumental inequality', 'falsification'], viz: U.inequality,
  },
  {
    num: '6.10', kind: 'Method', name: 'Difference-in-differences',
    statement: String.raw`Consider treated-group indicator G and periods 0,1. Group G=1 starts treatment between the periods; controls remain untreated. Let Y_t(0) denote the never-treated outcome and Y_t(1) the outcome under the treated path. Assume consistency, no interference, integrable outcomes, both groups present, and no mean anticipation in the treated group. If untreated mean trends are parallel,
$$E[Y_1(0)-Y_0(0)\mid G=1]$$
$$=E[Y_1(0)-Y_0(0)\mid G=0],$$
then the period-1 ATT equals the difference-in-differences of observed means:
$$E[Y_1-Y_0\mid G=1]$$
$$-E[Y_1-Y_0\mid G=0].$$
Parallel pre-treatment trends alone do not establish the required post-period counterfactual restriction.`,
    idea: String.raw`Subtract the control change from the treated change. Add and subtract the treated group’s untreated period-1 mean. The treatment-effect term is the ATT. Parallel untreated trends cancel the remaining difference of untreated changes, while no anticipation lets the observed treated-group baseline replace its untreated baseline. If the untreated trend difference is δ and the baseline anticipation effect is a, the population DiD instead equals ATT+δ−a. A shock that starts only in the post period can leave every earlier population trend parallel while creating δ≠0.`,
    caption: String.raw`Follow two groups over four periods and copy the control change to construct a counterfactual. Change trend differences, a hidden post-period shock or anticipation. Repeated samples compare measured estimator moments with the exact sampling calculation for this model.`,
    scope: String.raw`This is a two-group, one-adoption-time design. Each group has n independently sampled units observed at all four times; a unit-specific intercept is shared across its observations. Time innovations are independent with variance one, so the DiD sampling SD is exactly 2/√n. Under normal innovations its sampling law is exactly Gaussian; other modes retain the stated mean/variance but need not have a Gaussian finite-sample law. This does not extend ordinary two-way fixed effects automatically to staggered adoption or few correlated clusters.`,
    deps: ['causal-1.3', 'stat-1.3'], refs: ['Roth–Sant’Anna–Bilinski–Poe, 9 Jan 2023, What’s Trending in Difference-in-Differences?, §2, pp5–9'], links: { source: sources.did }, tags: ['difference-in-differences', 'parallel trends'], viz: U.difference,
  },
  {
    num: '6.11', kind: 'Method', name: 'Regression discontinuity design',
    statement: String.raw`In a sharp cutoff design, treatment is A=1{X≥c}. Assume consistency, no interference, and running-variable support approaching c from both sides. Suppose the conditional potential-outcome means m_a(x)=E[Y(a)|X=x] admit versions continuous at c. Then the observed right-minus-left mean limit identifies the cutoff effect:
$$\lim_{x\downarrow c}E[Y\mid X=x]$$
$$-\lim_{x\uparrow c}E[Y\mid X=x]$$
$$=m_1(c)-m_0(c).$$
Separate local linear fits estimate these two intercept limits. Their finite-bandwidth difference can have bias and requires adequate rank on both sides.`,
    idea: String.raw`Below the cutoff, consistency identifies the observed conditional mean with m₀(x); above it, with m₁(x). Continuity extends these two observed-side limits to the same cutoff, giving the contrast. The value at a zero-probability cutoff is understood through these continuous versions, not through an arbitrary conditional-expectation version at a singleton. Weighted least squares near c estimates each side’s intercept. A concurrent jump in the untreated mean contributes to the observed jump and invalidates its interpretation as treatment alone. An uneven density of running inputs, by itself, is not the same as discontinuity of potential-outcome means.`,
    caption: String.raw`Change the bandwidth, right-side curvature, input density or an explicit untreated jump. Inspect the two actual triangular-weighted fits and their repeated-noise sampling distribution. Narrow windows can leave too few local inputs to fit a line.`,
    scope: String.raw`The cutoff is zero and the true treatment effect is 0.7. Inputs form fixed midpoint grids on each side. The untreated mean is 0.5x plus right-side curvature times x², with an optional right-side jump. Independent noise has SD 0.5. Repeats condition on the same inputs, so exact linear-weight means and variances are available; the Gaussian curve is shown only for Gaussian noise. Curvature bias at a finite bandwidth and the explicit untreated jump are kept separate. This is sharp RD, not the additional assumptions needed for fuzzy RD.`,
    deps: ['causal-1.1', 'nla-2.8', 'nla-2.9'], refs: ['Hernán–Robins, What If, Fine Point 16.3, printed p225; conditional-mean and local-fit derivations supplied here'], links: { source: sources.book }, tags: ['regression discontinuity', 'local identification'], viz: U.discontinuity,
  },
  {
    num: '6.12', kind: 'Method', name: 'Mendelian randomization',
    statement: String.raw`Mendelian randomization proposes genetic variation as an instrument for an exposure. Genetic association with exposure supplies relevance; exclusion and independence from causes of the outcome still require justification. In a homogeneous linear model with a valid nondegenerate variant G, define its population association slopes
$$b_X=\frac{\operatorname{Cov}(G,X)}{\operatorname{Var}(G)},$$
$$b_Y=\frac{\operatorname{Cov}(G,Y)}{\operatorname{Var}(G)}.$$
If b_X≠0, the ratio b_Y/b_X identifies the common exposure effect. A direct variant effect on outcome or confounding by ancestry can break this conclusion.`,
    idea: String.raw`Write Y=τX+ε with Cov(G,ε)=0. Taking covariance with G gives Cov(G,Y)=τCov(G,X), so the ratio cancels the variant variance. A direct outcome contribution αG instead adds α to b_Y, producing bias α/b_X. Several valid variants may give consistent ratio slopes, but agreement cannot establish all assumptions: shared confounding can move multiple slopes together. Finite-sample variant associations add further noise, and weak estimated exposure slopes again create unstable ratios.`,
    caption: String.raw`Compare five synthetic variant associations, their first-sample estimates and repeated ratios for one selected variant. Change genetic strength, add a direct effect or shared ancestry. The green line gives the known exposure effect of the model.`,
    scope: String.raw`Five biallelic genotypes are conditionally independent binomial(2,p_j+d_jC) given C=±1. The baseline p_j are 0.20,0.25,0.30,0.35,0.40. Without structure d_j=0 and U=u; with structure d_j=0.04+0.01j for j=0,…,4 and U=C+u. Exposure is a weighted sum of centered genotypes plus U and noise. Outcome is 0.7 times exposure plus U, the selected direct genotype effect and noise. All three noises are independent copies of the chosen standardized law. These are synthetic identification experiments, not a claim about a disease or the effect of a particular medical intervention.`,
    deps: ['causal-6.2', 'causal-6.3'], refs: ['Hernán–Robins, What If, Fine Point 16.1 and §16.5; synthetic genotype/ancestry model and covariance calculation supplied here'], links: { source: sources.book }, tags: ['Mendelian randomization', 'genetic instruments'], viz: U.genetics,
  },
] };
