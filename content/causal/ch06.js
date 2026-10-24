import * as U from './ch06.ui.shared.js';
import { sources } from './ch06.shared.js';
export default {
  collection: 'causal', chapter: 6, title: 'Instruments, bounds and natural experiments',
  summary: String.raw`An instrument changes treatment while satisfying exclusion and exchangeability assumptions. A constant-effect model identifies one causal effect; monotonicity identifies an effect in a particular principal stratum. Without these extra assumptions, compatible counterfactual populations give bounds. Difference-in-differences, cutoff designs and genetic instruments use different identifying assumptions, which the examples make explicit.`,
  items: [
    {
      num: '6.1', kind: 'Definition', name: 'Instrumental variable',
      statement: String.raw`Let Z be a binary proposed instrument with both assignment probabilities positive. Write A(z) for potential treatment and Y(a,z) for potential outcome. In the strong causal-instrument formulation used here, require:

(a) **Relevance:** the finite conditional treatment means differ between Z=1 and Z=0.
(b) **Exclusion:** Y(a,1)=Y(a,0)=Y(a) for every treatment level and unit.
(c) **Joint exchangeability:** Z is independent of the vector of all potential treatments and outcomes.

Also assume well-defined interventions, no interference and consistency: A=A(Z), Y=Y(A,Z). These conditions permit treatment–outcome confounding, but alone generally do not identify the population average treatment effect.`,
      idea: String.raw`Random assignment of Z can make its groups comparable even when the treatment actually received is confounded. Exclusion removes any outcome change that bypasses treatment. Relevance ensures a treatment contrast is available to divide by. In a declared causal graph, arrows and common causes can encode these assumptions; checking observed relevance does not establish the other two. Conditioning on treatment can even open a collider path between the instrument and hidden causes of outcome.`,
      caption: String.raw`Change the instrument’s treatment effect and add a direct outcome path or a shared cause. The exact finite population computes both observed contrasts and their ratio. The arrows describe this model’s assumptions, not a test that certifies a real instrument.`,
      scope: String.raw`The chapter uses a strong joint-independence formulation for a manipulable binary instrument; weaker moment formulations also exist. The binary scene has P(U=1)=1/2, P(Z=1|U)=1/2+k(U−1/2), P(A=1|Z,U)=0.15+sZ+0.2U, and P(Y=1|A,Z,U)=0.1+0.25A+0.25U+dZ. Its controls keep all probabilities in [0,1]. The ATE is 0.25.`,
      deps: ['causal-1.1', 'causal-3.5'], refs: ['Hernán–Robins, What If (19 Aug 2026), §16.1 and Technical Point 16.1, printed pp209–211'], links: { source: sources.book }, tags: ['instrument', 'identification'], viz: U.instrument,
    },
    {
      num: '6.2', kind: 'Theorem', name: 'The Wald (IV) estimand under homogeneity',
      statement: String.raw`Let Z be binary with both arms of positive probability. Suppose A and Y(0) are integrable, consistency holds, and each unit has the same additive treatment effect:
$$Y(a)=Y(0)+\tau a.$$
Assume the mean of Y(0) is the same in both Z arms and the treatment contrast is nonzero. For V=A,Y write
$$\mu_{V,z}=E[V\mid Z=z],$$
$$\Delta_V=\mu_{V,1}-\mu_{V,0}.$$
Then the Wald estimand is
$$\tau=\frac{\Delta_Y}{\Delta_A}.$$
For binary treatment this identifies the population ATE. For real treatment it identifies the common effect per unit increase. A ratio of sample means is an estimator, not this exact population identity.`,
      idea: String.raw`By consistency, Y=Y(0)+τA. Take its conditional expectation in each instrument arm and subtract. The baseline means cancel by the stated exchangeability condition, leaving ΔY=τΔA. Divide by the nonzero treatment contrast. In the displayed structural model A=πZ+γU+e_A and Y=τA+U+dZ+e_Y, independent centered unit-variance noises make the population ratio τ+d/π. The direct effect is magnified when π is small. The population OLS slope also includes the association between A and U.`,
      caption: String.raw`Compare exact population contrasts with the first sampled pair of group means, then inspect repeated Wald estimates. Change hidden confounding, first-stage strength, a direct effect and the noise law. A finite sample need not recover the population ratio exactly.`,
      scope: String.raw`Constant individual additive effects are a sufficient and strong homogeneity assumption. They are not equated with the weaker treated-group structural-mean restriction, which need only identify an ATT. Samples contain equal numbers in the two fixed Z arms; U, e_A and e_Y are independent copies of the chosen standardized noise law. Skewed means centered lognormal with log-SD 0.7; heavy tails means t₃/√3. Ratio means may not exist, so the display uses empirical quantiles and retains estimates outside its histogram window.`,
      deps: ['causal-6.1', 'causal-1.3'], refs: ['Hernán–Robins, What If, §§16.2–16.3 and Technical Points 16.3–16.5; constant-effect derivation supplied here'], links: { source: sources.book }, tags: ['Wald ratio', 'homogeneity'], viz: U.wald,
    },
    {
      num: '6.3', kind: 'Method', name: 'Two-stage least squares',
      statement: String.raw`Let X be the regressor matrix, including an intercept and any endogenous regressors. Let Z be the instrument matrix, including an intercept and included exogenous covariates. Assume Z has full column rank and XᵀP_ZX is invertible, where
$$P_Z=Z(Z^TZ)^{-1}Z^T.$$
First project X onto the instrument space, obtaining $\widehat X=P_ZX$. Regress y on these fitted columns:
$$C=X^TP_ZX,\quad r=X^TP_Zy,$$
$$\widehat\beta=C^{-1}r.$$
With one binary instrument, one treatment and intercepts, its treatment coefficient is the sample Wald ratio whenever the first-stage difference is nonzero. The algebra does not itself establish causal identification.`,
      idea: String.raw`Least squares is orthogonal projection. Since P_Z is symmetric and idempotent, the second-stage normal equations use XᵀP_ZX and XᵀP_Zy. With a binary Z, fitted treatment takes just its two arm means; a regression on two distinct fitted values has slope equal to the difference of outcome arm means divided by the difference of fitted values. Population validity additionally requires the appropriate instrument moment conditions and rank. Under fixed nonzero population relevance and suitable laws of large numbers, sample moments approach their population counterparts.`,
      caption: String.raw`Follow actual treatment observations through the first-stage projection and the second-stage regression. The lower panel repeats the two-stage experiment. Both stages include an intercept, and the small horizontal jitter in the first panel is only for visibility.`,
      scope: String.raw`The scene is the just-identified binary-instrument model in 6.2. It exposes finite-sample variation and invalid exclusion rather than asserting sample unbiasedness. Ordinary second-stage OLS standard errors, which pretend the projected treatment was the original regressor, are not the IV uncertainty calculation. A zero fitted treatment contrast makes the second-stage slope undefined.`,
      deps: ['causal-6.2', 'nla-2.8', 'nla-2.9'], refs: ['Hernán–Robins, What If, §16.2, printed p213; projection derivation supplied here'], links: { source: sources.book }, tags: ['two-stage least squares', 'projection'], viz: U.twoStage,
    },
    {
      num: '6.4', kind: 'Phenomenon', name: 'Weak instruments',
      statement: String.raw`When an instrument barely changes treatment, its sample first-stage contrast can be close to zero. Dividing by it makes Wald/2SLS estimates unstable and amplifies exclusion violations. Neither a finite ratio nor a first-stage F statistic certifies valid inference.

One alternative is to test a candidate effect b using residuals R_i(b)=Y_i−bA_i. With fixed binary assignment, at least two observations per arm, and iid Gaussian structural residuals R_i(τ) having a common mean and positive variance, the pooled two-sample statistic satisfies
$$T(\tau)\sim t_{n-2}.$$
Inverting $|T(b)|\le t_{n-2,0.975}$ gives a confidence set with exact 95% coverage under these assumptions, even with a zero population first stage. This Anderson–Rubin construction may yield an unbounded or disconnected set.`,
      idea: String.raw`At the true effect and with valid exclusion, subtracting τA leaves the structural error, even though that error may be correlated with A. The difference of its two Gaussian arm means is independent of the pooled within-arm sum of squares; the normal and chi-squared decomposition gives Student’s t. The inverse test never divides by the estimated treatment effect of Z. If Δa and Δy are the sample contrasts, the acceptance inequality compares (Δy−bΔa)² with a constant times the pooled variance of Y−bA. Both sides are quadratic in b, so solving one quadratic inequality yields the full set. Weakness can leave faraway candidate effects plausible.`,
      caption: String.raw`Shrink first-stage strength and inspect the ratio histogram, first-stage F and empirical coverage of two interval procedures. The second panel inverts the first sample’s AR test; its readout retains unbounded parts outside the plotted window.`,
      scope: String.raw`AR exactness here is proved only for the displayed valid Gaussian structural-error model. Other noise laws and a direct Z→Y effect deliberately leave those exact assumptions. The comparison normal-Wald interval uses 1.96 times the plug-in structural-residual SE divided by the absolute first-stage difference; it is an asymptotic procedure, not an exact finite-sample interval. Coverage Monte Carlo errors concern independent Bernoulli coverage indicators, not moments of the potentially heavy-tailed ratio. No universal F=10 threshold is asserted.`,
      deps: ['causal-6.3', 'stat-1.9', 'stat-1.10'], refs: ['Hernán–Robins, What If, §16.5 and Fine Point 16.2', 'Mikusheva–Poi, author-hosted draft, §§2–3 (known covariance); restricted unknown-variance Gaussian t inversion proved here'], links: { source: sources.book, research: 'https://economics.mit.edu/sites/default/files/publications/944.pdf' }, tags: ['weak instruments', 'confidence sets'], viz: U.weak,
    },
    {
      num: '6.5', kind: 'Concept', name: 'Compliance types and principal strata',
      statement: String.raw`For a binary instrument and binary treatment, the pair (A(0),A(1)) assigns each unit to one of four principal strata: never-takers (0,0), compliers (0,1), defiers (1,0), or always-takers (1,1). Under consistency and random assignment independent of this pair, write their masses p_N,p_C,p_D,p_A. Then
$$P(A=1|Z=0)=p_D+p_A,$$
$$P(A=1|Z=1)=p_C+p_A,$$
so the first-stage contrast is p_C−p_D. Observing a unit’s assignment and treatment generally does not reveal its principal stratum.`,
      idea: String.raw`At Z=0, a treated unit could be a defier or an always-taker. At Z=1, a treated unit could be a complier or an always-taker. The observed table adds masses that share the observed half of the potential-treatment pair. Equal increases in complier and defier mass can preserve the treatment contrast while changing the hidden population. Monotonicity A(1)≥A(0) removes defiers; it is an additional restriction, not a consequence of observing that treatment is more frequent in the encouraged arm.`,
      caption: String.raw`Change the four latent weights and compare them with the observed assignment–treatment cells. Each observed cell is a mixture of the colored principal strata. Set all weights to zero to see that no population distribution is then defined.`,
      scope: String.raw`The two instrument values must denote well-defined interventions with stable potential treatments and no interference. The scene shows known population masses for explanation; it does not infer an individual’s type from observed compliance. The four displayed conditional cells sum to two because each Z arm separately sums to one.`,
      deps: ['causal-6.1', 'causal-2.10'], refs: ['Hernán–Robins, What If, §16.4, printed pp217–220'], links: { source: sources.book }, tags: ['principal strata', 'compliance'], viz: U.compliance,
    },
    {
      num: '6.6', kind: 'Theorem', name: 'Local average treatment effect (LATE)',
      statement: String.raw`Assume a binary causal instrument and binary treatment, consistency, no interference, exclusion, and joint independence of Z from (A(0),A(1),Y(0),Y(1)). Both Z arms have positive probability and potential outcomes are integrable. If A(1)≥A(0) almost surely and compliers have positive probability, then
$$\tau_C=E[Y(1)-Y(0)\mid C],$$
$$\frac{\Delta_Y}{\Delta_A}=\tau_C.$$
Here C is the event A(0)=0,A(1)=1. This complier average causal effect is a LATE; it need not equal the ATE in the full population.`,
      idea: String.raw`Randomization and consistency identify the assignment contrasts with their potential-outcome contrasts. Exclusion implies that assignment changes no outcome for never-takers and always-takers. Compliers contribute their treatment effect, while defiers contribute its negative. Thus, writing τ_C and τ_D for the conditional effects,
$$\Delta_Y=p_C\tau_C-p_D\tau_D,$$
$$\Delta_A=p_C-p_D.$$
Monotonicity sets p_D=0, and p_C>0 permits division. Without monotonicity, the signed ratio can even lie outside the stratum-specific effect range. Effects in always-takers and never-takers still contribute to the population ATE, despite contributing nothing to the assignment contrast.`,
      caption: String.raw`Compare signed stratum contributions, the Wald ratio, the complier effect and the population ATE. Change complier and defier effects or masses. Defiers can break the equality; zero net first stage or no compliers makes the corresponding quantity unavailable.`,
      scope: String.raw`The supplied population has Y(0)=0 and a constant Y(1) within each stratum, with independent randomized assignment. Never-taker and always-taker effects remain 0.2 and 0.1. The theorem concerns the subpopulation defined by this particular binary causal instrument, not an arbitrary surrogate or all people who happened to take treatment.`,
      deps: ['causal-6.5', 'causal-1.3'], see: ['causal-6.2'], refs: ['Hernán–Robins, What If, §16.4 and Technical Point 16.7, printed p224'], links: { source: sources.book }, tags: ['LATE', 'monotonicity'], viz: U.late,
    },
  ],
};
