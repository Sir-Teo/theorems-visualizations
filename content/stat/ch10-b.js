import * as U from './ch10.ui.shared.js';
export default {collection:'stat',chapter:10,items:[
{num:"10.8",
kind:"Definition",
name:"Credible intervals: equal-tailed and HPD",
statement:String.raw`A posterior credible set C of level 1−α satisfies $\Pr(\theta\in C\mid x)=1-\alpha$. For a continuous posterior, an equal-tailed interval has α/2 posterior mass on either side. A highest-posterior-density set is a superlevel set
$$H_c=\{\theta:\pi(\theta\mid x)\ge c\}$$
with the required mass, when such a threshold exists. Among measurable sets of that mass, H_c has minimum Lebesgue measure. It may be disconnected.`,
idea:String.raw`For any competitor C of the same posterior mass, the density is at least c on H_c minus C and at most c on C minus H_c. Thus $0=\int(1_{H_c}-1_C)\pi\ge c(|H_c|-|C|)$, proving the length comparison for c>0 and finite lengths. Equal-tailed sets instead constrain the two tails. Plateaus may require selecting part of a level set and can make the answer nonunique; reparametrization can change the HPD set because it changes density and length.`,
caption:String.raw`Switch among skewed, symmetric and two-mode beta posteriors and vary the requested mass. The shaded equal-tailed interval and HPD set have the same computed mass; the bimodal HPD has two components.`,
scope:String.raw`Threshold crossings are bracketed numerically for these specified smooth beta families, and component masses use beta CDFs. This is not a generic solver for arbitrary narrow modes or plateaus. The minimizing length is measured in the displayed parameter coordinate.`,
deps:["stat-10.1"],
refs:["Geyer (2009), Bayesian examples, credible/HPD sections; superlevel-set proof supplied"],
links:{"source":"https://www.stat.umn.edu/geyer/s09/5102/examp/bayes.html"},
tags:["credible sets","highest density"],
viz:U.credible},
{num:"10.9",
kind:"Concept",
name:"Frequentist coverage of credible intervals",
statement:String.raw`If a procedure C(X) has posterior probability 1−α for almost every dataset under a proper prior, then
$$c(\theta)=\Pr_\theta\{\theta\in C(X)\},$$
$$\int c(\theta)\pi(\theta)\,d\theta=1-\alpha.$$
This prior-averaged coverage identity does not require the fixed-parameter coverage $\Pr_\theta\{\theta\in C(X)\}$ to equal 1−α at every θ.`,
idea:String.raw`Integrate the indicator of θ belonging to C(x) against the joint law in two orders. Conditioning on x gives posterior mass 1−α; conditioning on θ gives the sampling coverage at that θ. In the normal example, a strongly concentrated, misplaced prior shifts the interval toward its mean and reduces coverage at distant truths. Drawing a fresh truth from the same proper prior on every repetition restores the identity after averaging.`,
caption:String.raw`Compare a fixed true mean with a fresh prior draw on each repetition. The plotted intervals are centered relative to each experiment’s own truth; the bars compare nominal mass, exact model coverage and simulated coverage.`,
scope:String.raw`The scene uses known sampling variance and an exact normal posterior interval. The observed frequency fluctuates around its target; the identity concerns its expectation, not exactly 95% in every finite simulation. An improper prior cannot be used for this prior-averaging experiment.`,
deps:["stat-10.8","stat-8.1","rca-8.8","stat-10.6"],
refs:["Liu–Wasserman, chapter 12, Bayesian/frequentist interpretation; averaging identity and normal coverage derived here"],
links:{"source":"https://www.stat.cmu.edu/~larry/=sml/Bayes.pdf"},
tags:["coverage","calibration"],
viz:U.coverage},
{num:"10.10",
kind:"Definition",
name:"Jeffreys prior",
statement:String.raw`For a regular scalar model with positive Fisher information I(θ), Jeffreys' prior density is proportional to $\sqrt{I(\theta)}$. Under a smooth one-to-one reparametrization $\phi=g(\theta)$ with nonzero derivative,
$$I_\phi(\phi)=I_\theta(\theta)\left(\frac{d\theta}{d\phi}\right)^2.$$
Consequently $\sqrt{I_\phi(\phi)}\,d\phi=\sqrt{I_\theta(\theta)}\,|d\theta|$: the rule defines the same prior measure in either coordinate.`,
idea:String.raw`The score transforms by the chain rule. Squaring it and taking its sampling expectation gives the transformation law for information. Taking the square root produces exactly the absolute Jacobian required for a density. For Bernoulli p, information is 1/[p(1−p)], giving the proper Beta(1/2,1/2) prior. On log odds φ, its density becomes √[p(1−p)]/π, while a uniform-p prior becomes p(1−p).`,
caption:String.raw`Move the marked Bernoulli probability and compare its density with the corresponding point on the log-odds axis. The transformed uniform and Jeffreys curves include their Jacobians; the readout verifies the information identity.`,
scope:String.raw`The Bernoulli endpoints have infinite Jeffreys density but finite total mass. The curves display a finite interior window. Jeffreys priors can be improper in other models; coordinate invariance alone does not establish a uniquely noninformative prior.`,
deps:["stat-10.1","stat-4.2","rca-7.26"],
refs:["Liu–Wasserman, chapter 12, Jeffreys priors; Bernoulli transformation supplied"],
links:{"source":"https://www.stat.cmu.edu/~larry/=sml/Bayes.pdf"},
tags:["Jeffreys prior","invariance"],
viz:U.jeffreys},
{num:"10.11",
kind:"Theorem",
name:"Bernstein–von Mises theorem",
statement:String.raw`One sufficient local form of the Bernstein–von Mises conclusion is as follows. The true parameter θ₀ is interior in $\R^d$; a fixed proper prior has a density continuous and positive near θ₀. Let $\widehat\theta_n\to\theta_0$ in probability and let I be positive definite. Assume, uniformly for h in each compact set,
$$\Delta_n(h)=\ell_n(\widehat\theta_n+h/\sqrt n),$$
$$R_n(h)=\Delta_n(h)-\Delta_n(0),$$
$$R_n(h)=-\tfrac12h^\top Ih+r_n(h),$$
where $\sup_{h\in K}|r_n(h)|\to0$ in $P_{\theta_0}$ probability for every compact K.
Also assume the posterior laws of $\sqrt n(\theta-\widehat\theta_n)$ are tight in probability. Then these laws converge in total variation, in $P_{\theta_0}$ probability, to $N_d(0,I^{-1})$.`,
idea:String.raw`On any fixed compact h-set, the prior density becomes approximately constant and the likelihood ratio becomes Gaussian. Their normalized restrictions therefore approach the restricted normal law in total variation. Posterior tightness in probability allows the compact set to be enlarged until its omitted posterior mass is small with high sampling probability; the normal tail is small there too. Combining the two bounds proves the full result. Asymptotic frequentist coverage further uses the sampling limit of the center, typically an asymptotically normal MLE. TV convergence alone does not control unbounded posterior moments.`,
caption:String.raw`Increase the nested normal sample size and compare three exact conjugate-mixture posteriors in the standardized coordinate √n(θ−sample mean). The TV graph uses numerical integration. Toggle a prior atom at the wrong value: its posterior remains an atom and has exact TV distance one from every continuous normal law.`,
scope:String.raw`These are explicit sufficient local assumptions, not a claim that any model with a likelihood is regular. The normal examples have known variance one. The numerical TV computation reports a separate tail bound; that bound does not bound the quadrature error. Point-mass priors are outside the positive-density hypothesis.`,
deps:["stat-10.1","stat-5.2","stat-10.6"],
refs:["Liu–Wasserman, chapter 12, asymptotic normality; CMU 36-705 Lecture33 (2019), pp.1–3; sufficient local formulation and proof supplied"],
links:{"source":"https://www.stat.cmu.edu/~larry/=sml/Bayes.pdf"},
tags:["asymptotics","posterior normality"],
viz:U.bvm},
{num:"10.12",
kind:"Theorem",
name:"De Finetti’s representation theorem",
statement:String.raw`An infinite sequence of {0,1}-valued random variables is exchangeable when every finite joint law is invariant under coordinate permutations. Such a sequence has a unique probability measure μ on [0,1] for which each ordered word x₁,…,xₙ with s ones has probability
$$\Pr\{(X_1,\ldots,X_n)=x\}=M_{n,s},$$
$$M_{n,s}=\int_0^1p^s(1-p)^{n-s}\,d\mu(p).$$
Equivalently, its law is obtained by drawing P from μ and then drawing the sequence conditionally iid Bernoulli(P). Infinite extendibility is essential.`,
idea:String.raw`For N≥n, conditional on the first N coordinates having K ones, exchangeability makes the first n coordinates a sample without replacement from that population. Couple this with sampling with replacement: the chance of any repeated index is at most n(n−1)/(2N). Thus its word probabilities differ from (K/N)ˢ(1−K/N)ⁿ⁻ˢ by at most that bound. Compactness gives a weakly convergent subsequence of the laws of K/N; bounded continuous polynomial integrands pass to its limit and yield μ. All moments are determined by all-ones words, so polynomial approximation makes μ unique. Conversely an iid mixture is exchangeable. In that representation the conditional law of large numbers identifies the limiting frequency as P.`,
caption:String.raw`A Pólya urn adds one unit to the color just drawn. Compare actual finite-run frequencies with the exact beta-binomial law and the limiting Beta(a,b) density. Switch to the exchangeable pair (0,1)/(1,0) to see why finite exchangeability alone is insufficient.`,
scope:String.raw`This is the Bernoulli version of the representation theorem. A finite urn trajectory is generally dependent without conditioning on the latent limit. The displayed pair has covariance −1/4; every Bernoulli iid mixture has covariance Var(P)≥0 and therefore cannot represent that pair.`,
deps:["prob-3.2.12","prob-3.2.13","prob-3.2.9","prob-2.2.4","comb-1.6"],
refs:["Barber–Candès–Ramdas–Tibshirani, De Finetti’s theorem and related results for infinite weighted exchangeable sequences, §2.1; elementary Bernoulli proof supplied"],
links:{"source":"https://www.stat.berkeley.edu/~ryantibs/papers/defin.pdf"},
tags:["exchangeability","mixtures"],
viz:U.exchangeability},
{num:"10.13",
kind:"Definition",
name:"Bayes factor",
statement:String.raw`For two models H₀,H₁ with proper within-model priors and finite positive marginal densities
$$m_j(x)=\int f_j(x\mid\theta_j)\pi_j(\theta_j)\,d\theta_j,$$
the Bayes factor in favor of H₀ is $B_{01}=m_0(x)/m_1(x)$. For positive prior model probabilities,
$$\frac{\Pr(H_0\mid x)}{\Pr(H_1\mid x)}=B_{01}\frac{\Pr(H_0)}{\Pr(H_1)}.$$
The Bayes factor compares predictive densities; it is not itself a posterior model probability.`,
idea:String.raw`Treat the model index as another unknown and apply Bayes' theorem. Taking a ratio cancels the total data normalizer but retains the prior model odds. In the known-variance normal example, H₀ fixes θ=0 while H₁ puts a proper N(0,τ²) prior on θ. Integrating θ makes the sample-mean predictive variances σ²/n and σ²/n+τ². The common residual-data factor cancels in their ratio.`,
caption:String.raw`Compare the two prior predictive densities at the observed sample mean, then vary sample size, observed mean, alternative spread and prior model probability. The bars compare prior and posterior model probabilities; the readout gives the Bayes factor and posterior-odds identity.`,
scope:String.raw`Marginal likelihood averages over the specified parameter prior. Its dependence on that prior is part of the model comparison. Arbitrary multiplicative constants in improper parameter priors generally make Bayes factors undefined.`,
deps:["stat-10.2","stat-10.1"],
refs:["Liu–Wasserman, chapter 12, Bayesian testing/model comparison; Gaussian ratio derived here"],
links:{"source":"https://www.stat.cmu.edu/~larry/=sml/Bayes.pdf"},
tags:["Bayes factors","model comparison"],
viz:U.bayesFactor},
{num:"10.14",
kind:"Paradox",
name:"Lindley’s paradox",
statement:String.raw`In the known-variance normal mean model, compare H₀:θ=0 with H₁:θ∼N(0,τ²), where τ>0 is fixed. Write $z=\sqrt n\bar X/\sigma$ and $\kappa=n\tau^2/\sigma^2$. Then
$$B_{01}=\sqrt{1+\kappa}\,e^{-D},$$
$$D=\frac{z^2\kappa}{2(1+\kappa)}.$$
Along datasets with fixed finite z and n tending to infinity, the two-sided normal p-value is unchanged, while $B_{01}\sim(\tau\sqrt n/\sigma)e^{-z^2/2}\to\infty$. With fixed positive prior null odds, posterior null probability tends to one.`,
idea:String.raw`Divide the two normal prior predictive densities for the sample mean. Their variance ratio supplies √(1+κ), while the exponent supplies the displayed likelihood contrast. At fixed z the exponential approaches a positive constant, so the growing scale factor dominates. The p-value asks about tail probability under the point null; the Bayes factor compares two specified predictive models. They answer different questions.`,
caption:String.raw`Hold z fixed while increasing n over orders of magnitude. Compare the unchanged two-sided p-value with the changing null posterior probability, and inspect log Bayes factor for alternative prior scales.`,
scope:String.raw`Each n represents a dataset summary chosen to keep z fixed; this is not a nested random trajectory. The limit assumes a fixed proper alternative scale and fixed prior model odds. Shrinking τ with n changes the comparison and can change the limit.`,
deps:["stat-10.13","stat-7.1"],
refs:["Liu–Wasserman, chapter 12, Bayesian testing; fixed-z normal calculation supplied"],
links:{"source":"https://www.stat.cmu.edu/~larry/=sml/Bayes.pdf"},
tags:["Lindley paradox","testing"],
viz:U.lindley}
]};
