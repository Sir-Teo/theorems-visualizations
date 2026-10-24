import * as U from './ch10.ui.shared.js';
export default {collection:'stat',chapter:10,items:[
{num:"10.15",
kind:"Model",
name:"Hierarchical models and partial pooling",
statement:String.raw`For independent group estimates, suppose
$$Y_i\mid\theta_i\sim N(\theta_i,s_i^2),$$
$$\theta_i\mid\mu,\tau\sim N(\mu,\tau^2),$$
$$\mu\sim N(m_0,v_0),$$
with known sᵢ>0, v₀>0 and a fixed τ≥0. Put
$$d_i=(s_i^2+\tau^2)^{-1},$$
$$V_\mu=\left(v_0^{-1}+\sum_i d_i\right)^{-1},$$
$$m_\mu=V_\mu\left(m_0/v_0+\sum_i d_iY_i\right).$$
Writing $w_i=\tau^2/(s_i^2+\tau^2)$, the marginal posterior mean of θᵢ is $w_iY_i+(1-w_i)m_\mu$, with variance $w_i s_i^2+(1-w_i)^2V_\mu$.`,
idea:String.raw`Integrating each group effect gives Yᵢ|μ∼N(μ,sᵢ²+τ²), so normal conjugacy supplies the posterior for μ. Conditional on μ and the data, θᵢ has mean wᵢYᵢ+(1−wᵢ)μ and variance wᵢsᵢ². Total expectation and total variance give the marginal formulas, including uncertainty in the shared mean. At τ=0 every group equals μ; as τ grows without bound each group estimate approaches its own observed value.`,
caption:String.raw`Move the between-group standard deviation for eight synthetic groups. Compare raw estimates with posterior means and 95% marginal intervals, and inspect the marginal likelihood after both μ and the group effects have been integrated out.`,
scope:String.raw`These data are invented for this illustration, not the historical eight-schools dataset. The shared-mean prior is N(0,100). The slider conditions on τ rather than inferring it; the scaled marginal-likelihood curve is not a normalized posterior for τ. Zero is handled as the exact common-mean model.`,
deps:["stat-10.6","stat-10.2"],
refs:["Liu–Wasserman, chapter 12, hierarchical Bayes; Gelman (2006), §2; conditional-τ calculation supplied"],
links:{"source":"https://www.stat.cmu.edu/~larry/=sml/Bayes.pdf"},
tags:["hierarchical models","partial pooling"],
viz:U.pooling},
{num:"10.16",
kind:"Algorithm",
name:"Importance sampling",
statement:String.raw`Let p be a normalized target density and q a proposal positive wherever |f|p is nonzero. If $\int|f|p<\infty$, independent draws $X_i\sim q$ give the unbiased, strongly consistent estimate
$$\widehat I_N=\frac1N\sum_{i=1}^N f(X_i)\frac{p(X_i)}{q(X_i)}$$
of $I=\int fp$. When $\int f^2p^2/q<\infty$, its variance is $(\int f^2p^2/q-I^2)/N$. Without this second-moment condition, the usual finite-variance RMSE formula is unavailable.`,
idea:String.raw`Multiplying and dividing the integrand by q converts the target integral into an expectation under q. The law of large numbers needs integrability, while the variance formula additionally needs a square-integrable weighted integrand. If only an unnormalized target is known, a ratio of weighted sums can estimate I consistently, but that self-normalized estimate is generally biased at finite N. A few observed weights do not certify adequate tail coverage.`,
caption:String.raw`Estimate a standard-normal right-tail probability using shifted normal proposals. Compare the running weighted estimate with the exact tail probability and inspect the exact standard error when finite. The narrow proposal has genuinely infinite second moment.`,
scope:String.raw`Proposal standard deviations are 0.5, 1 or 2. For 0.5 the target-square/proposal tail integral diverges for every offered mean. The weight-based effective sample size is a diagnostic, not a confidence interval or a replacement for the exact integrand variance.`,
deps:["stat-9.1","rca-6.10"],
refs:["Liu–Wasserman, chapter 12, importance sampling; Gaussian tail second moment derived here"],
links:{"source":"https://www.stat.cmu.edu/~larry/=sml/Bayes.pdf"},
tags:["importance sampling","Monte Carlo"],
viz:U.importance},
{num:"10.17",
kind:"Algorithm",
name:"Metropolis–Hastings sampling of posteriors",
statement:String.raw`For a target density π known up to a positive constant and proposal density q(y|x), Metropolis–Hastings proposes Y from q(·|x), accepts it with probability
$$r(x,y)=\frac{\pi(y)q(x\mid y)}{\pi(x)q(y\mid x)},$$
$$a(x,y)=\min\{1,r(x,y)\},$$
and otherwise keeps the current state. Ratios are evaluated on positive forward proposal mass from a positive-target state; a zero reverse numerator gives acceptance zero. This transition leaves π invariant. Convergence from a starting state requires additional chain conditions.`,
idea:String.raw`The accepted off-diagonal probability flux is min{π(x)q(y|x),π(y)q(x|y)}, which is symmetric in x and y. The rejection probability stays on the diagonal and is automatically symmetric. Detailed balance therefore proves invariance. It does not prove that disconnected regions communicate or that a finite run resembles equilibrium. Under appropriate irreducibility, recurrence and aperiodicity conditions, ergodic theorems justify long-run averages.`,
caption:String.raw`Step through actual proposals for a banana-shaped target. Accepted moves and rejected proposals are distinct; rejections repeat the old state in the histogram. Vary proposal scale to compare short moves with large, often-rejected jumps.`,
scope:String.raw`The target is the normalized transform X=U, Y=V+b(U²−1) of independent standard normals, with Jacobian one. The Gaussian random-walk proposal is symmetric, so its ratio cancels. The chain starts at (0,0); dependent finite-run output is not given an iid standard error or treated as a convergence certificate.`,
deps:["stat-10.1","stat-2.1","rca-8.8"],
refs:["Liu–Wasserman, chapter 12, Metropolis–Hastings; balance including rejection atom supplied"],
links:{"source":"https://www.stat.cmu.edu/~larry/=sml/Bayes.pdf"},
tags:["Metropolis Hastings","Markov chains"],
viz:U.metropolis},
{num:"10.18",
kind:"Algorithm",
name:"Gibbs sampling of posteriors",
statement:String.raw`For a joint density π, a Gibbs update replaces one coordinate by a draw from its full conditional given the current values of all other coordinates. Each such update preserves π, so a fixed-order composition of updates also preserves π. For a standard bivariate normal with |ρ|<1,
$$X\mid Y=y\sim N(\rho y,1-\rho^2),$$
$$Y\mid X=x\sim N(\rho x,1-\rho^2).$$
After full X-then-Y sweeps, the stationary Y sequence has lag-k correlation $\rho^{2k}$.`,
idea:String.raw`Integrating out the old coordinate leaves the other-coordinate marginal, and multiplying it by the new full conditional reconstructs the joint density. Invariance survives composition, although a systematic full sweep is not generally reversible. Substituting Xₜ=ρYₜ₋₁+noise into Yₜ=ρXₜ+noise gives an AR(1) coefficient ρ². This explains the slow full-sweep mixing near either ρ=1 or ρ=−1; ergodicity still needs justification for a general Gibbs model.`,
caption:String.raw`Watch alternating horizontal and vertical updates and compare empirical autocorrelation with the stationary formula. Choose an exact stationary start or a displaced start; the readout distinguishes stationary mean variance from finite-run initialization bias.`,
scope:String.raw`The controls keep |ρ|≤0.99 so both conditional variances stay positive. The exact stationary variance of a mean uses all finite-run autocovariances. For a start at (3,3), the expected Y mean is 3N⁻¹Σₖ₌₁ᴺρ²ᵏ; the stationary correlation curve is not a claim about that transient.`,
deps:["stat-2.1","rca-8.8","stat-10.17"],
refs:["Liu–Wasserman, chapter 12, Gibbs sampling; Gaussian finite-run formulas supplied"],
links:{"source":"https://www.stat.cmu.edu/~larry/=sml/Bayes.pdf"},
tags:["Gibbs sampling","autocorrelation"],
viz:U.gibbs},
{num:"10.19",
kind:"Concept",
name:"Improper priors and posterior propriety",
statement:String.raw`A nonnegative prior weight π with infinite total integral is improper. It defines a proper posterior for data x exactly when
$$0<\int f(x\mid\theta)\pi(\theta)\,d\theta<\infty.$$
A flat prior on a normal mean with known positive sampling variance gives a normal posterior after at least one observation. In a normal hierarchical model whose integrated likelihood L(τ) tends to a positive finite value as the group standard deviation τ tends to zero, the prior $d\tau/\tau$ gives an improper posterior.`,
idea:String.raw`For the normal mean, the likelihood is an integrable Gaussian kernel in θ; no observations would instead leave a constant with infinite integral. For the hierarchical scale, continuity and L(0)>0 bound L(τ) below by a positive constant near zero. Integrating that lower bound against dτ/τ diverges. In log scale t=log τ, the integrand tends to L(0), so extending the lower endpoint accumulates roughly constant mass per unit length.`,
caption:String.raw`Compare the converging flat-normal-mean normalizer with the expanding log-scale integral in the synthetic hierarchical model. A proper half-normal scale prior makes the small-τ contribution finite; the readout labels the finite window actually integrated.`,
scope:String.raw`The hierarchical example integrates out effects and a proper shared-mean prior, with known positive observation errors. A normalized posterior can be unaffected by an arbitrary prior constant while a Bayes factor is not; improper priors therefore cannot be inserted uncritically into model evidence.`,
deps:["stat-10.10","stat-10.6","stat-10.15","stat-10.13"],
refs:["Gelman (2006), Prior distributions for variance parameters in hierarchical models, §4.2; normal-mean contrast supplied"],
links:{"source":"https://sites.stat.columbia.edu/gelman/bayescomputation/Gelman2006.pdf"},
tags:["improper priors","posterior propriety"],
viz:U.improper},
{num:"10.20",
kind:"Paper",
name:"Essay towards solving a problem in the doctrine of chances",
paper:{"authors":"Thomas Bayes and Richard Price","year":1763,"title":"An Essay towards Solving a Problem in the Doctrine of Chances","venue":"Philosophical Transactions of the Royal Society of London 53: 370–418","doi":"10.1098/rstl.1763.0053"},
introduces:["stat-10.1","stat-10.4"],
statement:String.raw`Bayes's table construction chooses an unobserved horizontal position P uniformly on a rectangle. Conditional on that first position, independent uniform throws land to its left with probability P after scaling the width to one. If only the left/right outcomes are observed and s of n throws land to the left, then in modern notation
write A=s+1 and B=n−s+1. Then
$$P\mid s,n\sim\operatorname{Beta}(A,B).$$
The posterior probability that P lies between a and b is the area of this normalized beta density over [a,b].`,
idea:String.raw`The table postulates make the latent position uniform and give the count likelihood proportional to pˢ(1−p)ⁿ⁻ˢ. Bayes's geometrical area argument yields the normalized product; the beta integral expresses it in current notation. His scholium extends the construction to an unknown chance through an additional assumption about the prior chances of counts. The table experiment itself does not prove that every unknown probability deserves a uniform prior. Price's introduction frames the inverse-probability question and communicates the essay.`,
caption:String.raw`Throw seeded balls and observe their left/right results. Move two bounds to measure posterior area. The optional position reveal shows the hidden construction; those coordinates are extra information and are deliberately excluded from the posterior displayed here.`,
scope:String.raw`This illustration concerns Section II, the table postulates, Propositions 8–10 and the scholium, read in a modern retypesetting of the original essay. It does not reproduce the typography of the 1763 printing or claim the whole essay was read. The default view reveals outcomes only, preserving the conditioning information.`,
deps:["comb-1.6","stat-10.4","pma-8.20"],
refs:["Bayes–Price (1763), Section II, postulates through scholium; UCI retypeset PDF pp.8–12"],
links:{"source":"https://sites.socsci.uci.edu/~bskyrms/bio/readings/bayes_essay.pdf"},
tags:["history","inverse probability"],
viz:U.bayesPaper},
{num:"10.21",
kind:"Paper",
name:"Sampling-based approaches to calculating marginal densities",
paper:{"authors":"Alan E. Gelfand and Adrian F. M. Smith","year":1990,"title":"Sampling-Based Approaches to Calculating Marginal Densities","venue":"Journal of the American Statistical Association 85 (410): 398–409","doi":"10.1080/01621459.1990.10476213"},
introduces:["stat-10.18"],
statement:String.raw`Gelfand and Smith studied simulation-based marginal-density estimation, including averages of tractable full conditional densities. For a target component T and remaining variables Z,
$$\pi_T(t)=\mathbb E_{Z\sim\pi_Z}[\pi(t\mid Z)].$$
Their balanced one-way normal example uses group effects θᵢ around μ, a normal prior on μ, and proper inverse-gamma priors on between- and within-group variances. Its four conditional blocks are conjugate, permitting Gibbs updates and conditional-density averages. Each variance conditional adds half its residual sum of squares to the inverse-gamma scale and half its number of residuals to the shape. The normal conditional precisions add the likelihood and prior precisions.`,
idea:String.raw`The density identity is marginalization. For independent replicated chains stopped after k cycles, let Zᵣ denote each terminal conditioning state and independently impute Tᵣ* from π(·|Zᵣ). Replacing g(Tᵣ*) by its conditional expectation given Zᵣ preserves that finite-cycle expectation and removes the nonnegative conditional-variance term. Averaging across independent replications reduces variance for the paired estimate. If Zᵣ has not reached its target law, both methods retain initialization bias. This argument does not assert that every Rao–Blackwellized average along a single correlated chain has smaller asymptotic variance.`,
caption:String.raw`Run independent chains for a chosen number of cycles in a synthetic three-group variance-components model. Compare raw extra conditional draws, averaged full conditional densities and a numerical reference. Step through the four updates of the first chain and watch finite-cycle bias change.`,
scope:String.raw`The data are (−2,−1,0), (0,1,2), (2,3,4), with $\mu\sim N(0,4)$ and both variances independently IG(3,2), using density proportional to $v^{-4}e^{-2/v}$. They illustrate §3.4 rather than reproduce the paper's pump or multinomial experiments. The reference analytically integrates μ and θ and numerically integrates two log variances with their Jacobian. It is a finite-domain quadrature reference, not an exact closed form. Conditional mean error bars use independent replications and do not include initialization bias.`,
deps:["stat-10.18","stat-10.15","stat-10.2","pma-8.17"],
refs:["Gelfand–Smith (1990), §§2.6, 3.4 and discussion; entire original published body read; synthetic numerical example supplied"],
links:{"source":"https://hedibert.org/wp-content/uploads/2013/12/1990GelfandSmith.pdf"},
tags:["history","conditional density estimation"],
viz:U.gelfandPaper}
]};
