import * as U from './ch10.ui.shared.js';
export default {collection:'stat',chapter:10,title:"Bayesian inference",summary:String.raw`Prior assumptions and sampling models determine a posterior, a predictive distribution and a model comparison. Conjugate calculations make the update explicit; coverage, parameter transformations and asymptotic limits reveal what the results do and do not imply. Hierarchical models and Monte Carlo methods extend the calculation, with historical examples that keep finite-simulation error and initialization bias visible.`,items:[
{num:"10.1",
kind:"Theorem",
name:"Bayes’ theorem for densities",
statement:String.raw`Let $\pi(\theta)$ be a proper prior density and $f(x\mid\theta)$ a jointly measurable sampling density. For an observation $x$ with finite, positive marginal density
$$m(x)=\int f(x\mid t)\pi(t)\,dt,$$
the posterior density is
$$\pi(\theta\mid x)=\frac{f(x\mid\theta)\pi(\theta)}{m(x)}.$$
The formula specifies a version of the conditional density for almost every such $x$. The likelihood is a function of the parameter; it need not integrate to one over parameters.`,
idea:String.raw`The joint density factors as prior times sampling density. Integrating out the parameter gives the observation's marginal density by Fubini–Tonelli. Dividing the joint density by that marginal makes the parameter density integrate to one and recovers the joint law when multiplied back. For a mixture prior, each component's posterior weight is its prior weight times its own marginal likelihood, normalized across components.`,
caption:String.raw`Adjust three positive mixture weights, the number of Bernoulli trials and the success count. The prior and posterior are normalized densities; the likelihood is rescaled to area one solely for plotting. The second panel shows how evidence changes component weights.`,
scope:String.raw`The illustration uses a mixture of Beta(1,1), Beta(2,8) and Beta(8,2). The success selector is capped by the trial count. All component normalizers use beta functions; the chart grid does not determine the posterior.`,
deps:["stat-2.1","rca-8.8"],
refs:["Liu–Wasserman, Statistical Machine Learning, chapter 12, §12.1; mixture calculation supplied"],
links:{"source":"https://www.stat.cmu.edu/~larry/=sml/Bayes.pdf"},
tags:["Bayes theorem","posterior"],
viz:U.bayes},
{num:"10.2",
kind:"Definition",
name:"Posterior predictive distribution",
statement:String.raw`If a future observation $Y$ is conditionally independent of the observed data $x$ given $\theta$, its posterior predictive density is
$$p(y\mid x)=\int f(y\mid\theta)q(\theta)\,d\theta,$$
where $q(\theta)=\pi(\theta\mid x)$.
When the required second moments exist,
write $m_\theta=\mathbb E[Y\mid\theta,x]$ and $V_\theta=\operatorname{Var}(Y\mid\theta,x)$. Then
$$\operatorname{Var}(Y\mid x)=A+B,$$
$$A=\mathbb E[V_\theta\mid x],$$
$$B=\operatorname{Var}(m_\theta\mid x).$$
For $Y\mid\theta\sim N(\theta,\sigma^2)$ and $\theta\mid x\sim N(m,V)$, the predictive law is $N(m,\sigma^2+V)$.`,
idea:String.raw`Draw a parameter from its posterior and then a future observation from the model at that parameter. Integrating this two-stage joint law gives the predictive distribution. Splitting Y into its conditional mean and a zero-conditional-mean residual makes the covariance term vanish, proving the variance identity. In the normal location model, the plug-in distribution at m omits exactly V units of variance.`,
caption:String.raw`Compare actual two-stage predictive draws with the predictive and plug-in normal curves. Change the observed sample size and prior spread; the variance bars separate observation noise, parameter uncertainty and their sum.`,
scope:String.raw`The displayed variance comparison is for a known-variance normal location model. Posterior prediction is not universally wider than every possible plug-in distribution. A single simulated draw has no sample variance estimate.`,
deps:["stat-10.1","rca-8.8"],
refs:["Liu–Wasserman, chapter 12, posterior prediction; total-variance derivation supplied"],
links:{"source":"https://www.stat.cmu.edu/~larry/=sml/Bayes.pdf"},
tags:["prediction","uncertainty"],
viz:U.predictive},
{num:"10.3",
kind:"Definition",
name:"Conjugate prior",
statement:String.raw`A family of priors is conjugate for a sampling model when updating any member by admissible data gives another member of that family. For a likelihood proportional to
$$\exp\{\eta(\theta)^\top T(x)-nA(\theta)\},$$
a normalizable prior of the form
$$\pi_{a,b}(\theta)\propto h(\theta)e^{Q_{a,b}(\theta)},$$
$$Q_{a,b}(\theta)=\eta(\theta)^\top a-bA(\theta)$$
updates to $\pi_{a+T(x),b+n}$, provided the new normalizing constant is finite and positive.`,
idea:String.raw`Multiplication of likelihood and prior adds their exponents. The sufficient statistic enters a and the number of observations enters b; the base factor h is unchanged. This algebra explains beta–Bernoulli, gamma–Poisson and known-variance normal conjugacy. Hyperparameters can encode prior precision or exposure without being literal observations from the experiment.`,
caption:String.raw`Switch between Bernoulli, Poisson and normal observations, then add seeded data. The density remains in its conjugate family while the sufficient-statistic and precision/exposure bars update.`,
scope:String.raw`The example uses proper priors and fixed sampling models. For Poisson counts, exposure replaces sample count when observations have unequal known exposures. Conjugacy is a computational closure property, not a guarantee that the prior describes the application well.`,
deps:["stat-10.1","stat-1.17"],
refs:["Liu–Wasserman, chapter 12, conjugate families; natural-parameter update derived here"],
links:{"source":"https://www.stat.cmu.edu/~larry/=sml/Bayes.pdf"},
tags:["conjugacy","exponential family"],
viz:U.conjugacy},
{num:"10.4",
kind:"Model",
name:"Beta–binomial updating",
statement:String.raw`Let $X_1,\ldots,X_n\mid p$ be independent Bernoulli(p), let $s=\sum_iX_i$, and give p a Beta(a,b) prior with $a,b>0$. Then
$$p\mid X\sim\operatorname{Beta}(a+s,b+n-s).$$
For $n>0$, its mean is
$$m=\frac{a+s}{a+b+n}.$$
With $w=n/(a+b+n)$, this is
$$m=(1-w)\frac{a}{a+b}+w\frac{s}{n}.$$
With no observations the posterior is the prior.`,
idea:String.raw`The Bernoulli likelihood contributes powers p to s and 1−p to n−s. Adding those powers to the beta density gives the updated shape parameters, and the beta integral supplies its normalizer. The mean identity separates the prior's total shape from the sample size. Under a fixed true interior p, increasingly many independent observations eventually dominate any fixed proper beta prior.`,
caption:String.raw`Choose the true coin probability and prior shapes, then reveal a nested prefix of seeded tosses. The posterior density and mean trajectory use the actual successes; prior and data weights explain their relative influence.`,
scope:String.raw`Beta shapes below one produce infinite endpoint densities. The plot omits singular endpoints rather than replacing infinity by zero; probabilities and means retain the exact beta model. Each seed denotes one reproducible sequence.`,
deps:["stat-10.3","pma-8.20"],
refs:["Liu–Wasserman, chapter 12, beta–Bernoulli example"],
links:{"source":"https://www.stat.cmu.edu/~larry/=sml/Bayes.pdf"},
tags:["beta distribution","conjugacy"],
viz:U.beta},
{num:"10.5",
kind:"Proposition",
name:"Laplace’s rule of succession",
statement:String.raw`Under a uniform prior on a Bernoulli probability p, observing s successes among n independent trials gives
$$q_s=\Pr(X_{n+1}=1\mid S_n=s),$$
$$q_s=\frac{s+1}{n+2}.$$
If each repeated experiment first draws p uniformly and then generates its trials, the conditional success probability of the next trial among experiments with the same s is exactly this value.`,
idea:String.raw`The uniform density is Beta(1,1). Beta updating gives Beta(s+1,n−s+1), and a future Bernoulli success has probability equal to the posterior mean. Calibration follows because the same prior and sampling model generate the repeated experiments. A finite simulation estimates that conditional probability with binomial sampling error; it does not turn the uniform prior into a universal definition of ignorance.`,
caption:String.raw`Simulate many independent coins, drawing each coin’s p uniformly before its observed and future tosses. Compare the next-toss frequency within each success-count group with (s+1)/(n+2), and inspect how many experiments fall in each group.`,
scope:String.raw`The bars show the prediction ±2 exact binomial standard errors conditional on the displayed group count, clipped to [0,1]. They are not exact confidence intervals or simultaneous bands. Empty groups supply no frequency estimate. The claim depends on the specified prior-predictive experiment.`,
deps:["stat-10.4","stat-10.2"],
refs:["Liu–Wasserman, chapter 12, beta–Bernoulli prediction; calibration argument supplied"],
links:{"source":"https://www.stat.cmu.edu/~larry/=sml/Bayes.pdf"},
tags:["prediction","calibration"],
viz:U.succession},
{num:"10.6",
kind:"Model",
name:"Normal–normal model and precision weighting",
statement:String.raw`Suppose $X_i\mid\theta\sim N(\theta,\sigma^2)$ independently, with known $\sigma>0$, and $\theta\sim N(\mu,\tau^2)$ with $\tau>0$. Put
$$P_0=\tau^{-2},\quad P_x=n\sigma^{-2}.$$
Then the posterior is $N(m,V)$ with
$$V=(P_0+P_x)^{-1},$$
$$m=\frac{P_0\mu+P_x\bar X}{P_0+P_x}.$$
For n=0 the data contribution is zero and the prior remains unchanged.`,
idea:String.raw`Expand the prior and likelihood quadratic forms in θ. Their squared coefficients add to P₀+Pₓ and their linear coefficients add to P₀μ+PₓX̄. Completing the square identifies both the posterior mean and variance. Precision, rather than standard deviation, is the additive measure of information in this particular model.`,
caption:String.raw`Move the prior mean, prior spread, sample mean and sample size. Compare the prior and posterior curves with the two precision contributions.`,
scope:String.raw`Sampling variance is known; uncertainty about σ requires a different model. At zero observations the sample-mean setting has zero weight. The parameter posterior variance V is distinct from the future-observation variance σ²+V.`,
deps:["stat-10.3"],
refs:["Liu–Wasserman, chapter 12, normal conjugacy"],
links:{"source":"https://www.stat.cmu.edu/~larry/=sml/Bayes.pdf"},
tags:["normal model","precision"],
viz:U.normal},
{num:"10.7",
kind:"Model",
name:"Gamma–Poisson model",
statement:String.raw`Use the shape–rate convention
$$\pi(\lambda)=\frac{b^a}{\Gamma(a)}\lambda^{a-1}e^{-b\lambda}$$
for $a,b>0$ and $\lambda>0$.
Independent counts with known exposures have total count s and total exposure t, giving posterior $\operatorname{Gamma}(a+s,b+t)$. For future exposure u>0, a future count K has
$$\Pr(K=k\mid x)=c_k r^A(1-r)^k,$$
$$c_k=\frac{\Gamma(A+k)}{\Gamma(A)k!},\quad r=\frac B{B+u},$$
where A=a+s and B=b+t. Its mean is uA/B and variance is uA/B+u²A/B².`,
idea:String.raw`The likelihood kernel is λˢe⁻ᵗλ, so multiplication changes the gamma shape and rate. Integrating a future Poisson mass against the posterior uses the gamma integral and gives the negative-binomial mass above. Total variance adds variability of the random rate to the Poisson variance. The excess is relative to a Poisson with the same mean, not every Poisson distribution.`,
caption:String.raw`Change the total count, exposure and prior, then simulate future counts through posterior rate draws. Compare the count histogram with the negative-binomial predictive law and the Poisson law at the posterior mean rate.`,
scope:String.raw`The model uses shape and rate; the sampling library internally takes shape and scale 1/rate. Counts are nonnegative integers, exposures are nonnegative, and a positive count at zero total exposure is impossible. Histogram mass outside the visible count window is reported.`,
deps:["stat-10.3","pma-8.17","stat-10.2"],
refs:["Liu–Wasserman, chapter 12, conjugacy and prediction; exposure calculation supplied"],
links:{"source":"https://www.stat.cmu.edu/~larry/=sml/Bayes.pdf"},
tags:["Poisson model","prediction"],
viz:U.gamma}
]};
