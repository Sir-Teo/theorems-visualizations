import * as U from './ch07.ui.shared.js';
const NTK='https://proceedings.neurips.cc/paper/2018/file/5a4be1fa34e62bb8a6ec6b91d2462f5a-Paper.pdf';
export default {collection:'deep',chapter:7,title:'Infinite width: Gaussian processes and kernels',
summary:String.raw`Random initialization can converge to a Gaussian process while training, under a different set of assumptions, follows a nearly fixed tangent kernel. Finite matrix formulas expose the role of initialization and the kernel spectrum. Random features, moving neuron distributions and maximal-update scaling show what changes when features are approximated or allowed to learn.`,items:[
{num:'7.1',kind:'Theorem',name:'Wide random networks are Gaussian processes',
statement:String.raw`Consider the supplied shallow network
$$f_m(x)=m^{-1/2}\sum_{j=1}^m a_js_j(x),$$
where $s_j(x)=\sin(w_jx+b_j)$.
The triples are iid; within each triple, $a_j$ is uniform on $\{-1,1\}$ and $w_j,b_j$ are independent standard normals. For every fixed finite input list $x_1,\ldots,x_n$, its output vector converges in distribution to a centered multivariate normal with covariance $K_{rs}=k(x_r,x_s)$, where
$$k(x,y)=\tfrac12(A-B),$$
$$A=e^{-(x-y)^2/2},$$
$$B=e^{-((x+y)^2+4)/2}.$$
These consistent finite-dimensional limits define a Gaussian-process prior. The finite network already has exactly this covariance at every width; its distribution need not yet be Gaussian. Repeated inputs can make $K$ singular.`,
idea:String.raw`At the chosen inputs, one neuron contributes a bounded random vector with mean zero. The multivariate central limit theorem applies to the sum of independent copies divided by the square root of width. To calculate covariance, use $2\sin u\sin v=\cos(u-v)-\cos(u+v)$ and the Gaussian identity $\mathbb E\cos Z=e^{-\operatorname{Var}(Z)/2}$ for a centered normal Z. Here the two variances are $(x-y)^2$ and $(x+y)^2+4$. Every finite matrix is positive semidefinite because it is the covariance of a random feature vector; restricting or reordering inputs preserves the same formula. This supplies the consistent Gaussian finite-dimensional family.

For existence on the whole real line, first apply the countable extension theorem to dyadic inputs. A Gaussian increment has variance at most $|x-z|^2$, since sine is 1-Lipschitz and $\mathbb E w^2=1$. Its fourth moment is therefore at most $3|x-z|^4$. The dyadic chaining argument in the Kolmogorov continuity theorem extends these variables continuously on each bounded interval. Continuity of k identifies every finite-dimensional law of the extension with the Gaussian law above. This constructs a GP without asserting that finite networks converge uniformly to it.`,
caption:String.raw`Sample independent networks and compare their two-input cloud and a one-dimensional projection with the limiting Gaussian. Change width, seed and inputs, including coincident inputs. Covariance has a Monte Carlo standard error; Gaussian shape is a separate assertion.`,
scope:String.raw`This is a proved shallow sine model with Rademacher output weights, not a claim that all networks or every initialization obey this limit. Jacot et al. give a distinct multilayer result with Gaussian parameter initialization. The statement here is finite-dimensional convergence; it does not assert uniform convergence of sample paths or convergence after training.`,
deps:['deep-1.3','prob-3.10.7','stat-1.19','prob-2.1.21','prob-7.1.3'],refs:['Jacot–Gabriel–Hongler 2018, §4 Proposition 1; shallow sine covariance and CLT proof supplied here'],links:{source:NTK},tags:['Gaussian process','infinite width'],viz:U.gpCloud},
{num:'7.2',kind:'Method',name:'Gaussian process regression',
statement:String.raw`Let $f$ have a zero-mean Gaussian-process prior with covariance k. Observe $y_i=f(x_i)+\epsilon_i$ with independent $N(0,\sigma^2)$ noise, independent of f, and $\sigma>0$. Write $K_{ij}=k(x_i,x_j)$ and
$$A=K+\sigma^2I,$$
with $(k_x)_i=k(x_i,x)$.
The posterior at a new input is normal with
$$\mu(x)=k_x^TA^{-1}y,$$
$$v(x)=k(x,x)-k_x^TA^{-1}k_x.$$
Its covariance between two new inputs is $k(x,z)-k_x^TA^{-1}k_z$. A fresh noisy observation has variance $v(x)+\sigma^2$. Positive noise makes A positive definite even with repeated inputs. With no observations the posterior is the prior.`,
idea:String.raw`The training observations and any finite set of test values are jointly Gaussian. Subtract the linear predictor $k_x^TA^{-1}y$ from a test value; the residual has zero covariance with y, hence is independent of y for a joint Gaussian. Computing its variance gives the Schur complement above. Numerically factor $A=LL^T$: triangular solves give $A^{-1}y$, and $v(x)=k(x,x)-\|L^{-1}k_x\|^2$. This avoids explicitly forming an inverse. The posterior variance depends on input locations and noise, not on observed label values.`,
caption:String.raw`Click to add labels to the network-limit GP, remove observations or change noise. Compare latent and future-observation intervals and inspect prior/posterior variances. Repeated inputs remain valid because observation noise stays positive.`,
scope:String.raw`Uses the exact sine-network covariance in 7.1 and a known positive noise SD. The 95% intervals are pointwise posterior probabilities, not a simultaneous credible band or a frequentist coverage guarantee. No hidden diagonal jitter is added. Negative conditional variances within floating-point roundoff are set to zero; a substantive negative value is an error.`,
deps:['deep-7.1','stat-1.19','stat-2.1'],see:['stat-10.6'],refs:['Rasmussen–Williams 2006, chapter 2 Eqs 2.18–2.27, Algorithm 2.1 and noisy-future discussion'],links:{source:'https://gaussianprocess.org/gpml/chapters/RW2.pdf'},tags:['Gaussian process','conditioning'],viz:U.regression},
{num:'7.3',kind:'Definition',name:'Neural tangent kernel',
statement:String.raw`For a differentiable scalar network $f_\theta$ with Euclidean parameter coordinates, its neural tangent kernel is
$$g_\theta(x)=\nabla_\theta f_\theta(x),$$
$$\Theta_\theta(x,z)=g_\theta(x)^Tg_\theta(z).$$
It is a positive-semidefinite kernel. Under full-batch gradient flow for
$$R(\theta)=\frac1{2n}\sum_i(f_\theta(x_i)-y_i)^2,$$
the training prediction vector satisfies
$$\dot f_X=-\Theta_\theta(X,X)(f_X-y)/n.$$
For the sine network and initialization of 7.1, at any fixed finite set of inputs its empirical tangent kernel converges in probability to
$$\Theta(x,z)=k(x,z)+(xz+1)c,$$
where $c=c(x,z)=\tfrac12(A+B)$ and A, B are the exponentials in 7.1. The GP covariance k and tangent kernel $\Theta$ are different objects.`,
idea:String.raw`For coefficients q, the kernel quadratic form is the squared norm of $\sum_iq_i\nabla f(x_i)$, proving nonnegativity. The chain rule gives $\dot f(x)=\nabla f(x)^T\dot\theta$; substituting the loss gradient gives the exact prediction dynamics. A neuron's three derivatives are $m^{-1/2}\sin(wx+b)$ and $m^{-1/2}a\cos(wx+b)$ multiplied by x and 1. Their inner product contributes the sine product plus $a^2(xz+1)$ times the cosine product. At initialization $a^2=1$; averaging independent terms and applying the finite-variance law of large numbers gives the formula. The cosine product uses the same Gaussian characteristic-function calculation as 7.1, with a plus sign.`,
caption:String.raw`Inspect an actual finite gradient Gram matrix at five inputs. Compare its infinite-width limit or their signed difference; change the random seed and width. Color scales and the smallest Gram eigenvalue are reported explicitly.`,
scope:String.raw`The identity is for Euclidean gradient flow with the stated loss normalization. Changing parameter coordinates or per-parameter learning rates changes the effective kernel. Positive semidefinite does not mean every entry is positive or that the Gram matrix is invertible. Initialization convergence alone says nothing about kernel constancy during training.`,
deps:['deep-3.3','deep-7.1','prob-2.2.3'],refs:['Jacot–Gabriel–Hongler 2018, §§2–4 and Theorem 1; supplied shallow-model calculation'],links:{source:NTK},tags:['tangent kernel','gradient flow'],viz:U.ntk},
{num:'7.4',kind:'Theorem',name:'Lazy training: the NTK freezes at infinite width',
statement:String.raw`Fix finitely many bounded inputs and labels, and a finite time T independent of width. Train all three parameter groups of the sine network in 7.1 by the gradient flow in 7.3. Let $\theta_j=(a_j,w_j,b_j)$. Then, as width grows, the largest Euclidean displacement of any neuron is $O_p(m^{-1/2})$, uniformly for $0\le t\le T$. The Frobenius norm of the change in the training Gram matrix is also $O_p(m^{-1/2})$, uniformly on that interval.
The training predictions are $O_p(m^{-1/2})$ from the flow with the frozen initial Gram matrix and the same initial predictions, uniformly on this interval. Together with 7.3, the kernel converges to its deterministic limit. The total Euclidean parameter displacement need only be $O_p(1)$.`,
idea:String.raw`Put $r_0=\sqrt{n^{-1}\sum_i(f_0(x_i)-y_i)^2}$ and $B=\max_i|x_i|$. Energy decreases along gradient flow, so the residual RMS never exceeds $r_0$. The bounded sine and cosine imply
$$|\dot a_j|\le r_0/\sqrt m,$$
$$|\dot w_j|\le B|a_j|r_0/\sqrt m,$$
$$|\dot b_j|\le |a_j|r_0/\sqrt m.$$
Since $|a_j(0)|=1$, integrate the first inequality and insert its bound in the other two. Every neuron moves at most a constant depending on B, T and $r_0$, divided by $\sqrt m$. The initial residual RMS is bounded in probability, by the exact finite-width second moments in 7.1. Smooth bounded trigonometric derivatives then bound each empirical kernel entry's change by the same order. Subtract the actual and frozen prediction ODEs: their difference is driven by kernel drift times a bounded residual, plus a linear term. Grönwall gives the claimed finite-horizon prediction estimate. Summing m squared neuron displacements explains why the total parameter norm need not vanish. The bounds also prevent finite-time escape of parameters, so the smooth finite ODE continues throughout the interval.`,
caption:String.raw`Actually train networks of several widths with RK4. Compare them with exact frozen empirical-kernel flow and inspect kernel drift, the largest neuron displacement and the total displacement separately. Edit training labels and vary the fixed time horizon.`,
scope:String.raw`This proof is for the supplied smooth shallow model and fixed data/time. It is not a universal rate for all deep networks, standard parameterizations, ReLU networks, discrete SGD or times growing with width. The displayed numerical integration has its own step error, separately checked by refinement. Jacot et al.'s multilayer Theorem 2 has its own smoothness and training-direction hypotheses.`,
deps:['deep-7.3','ode-2.4','ode-2.5'],refs:['Jacot–Gabriel–Hongler 2018, §4 Theorem 2; finite-horizon shallow sine proof supplied here'],links:{source:NTK},tags:['lazy training','infinite width'],viz:U.lazy},
{num:'7.5',kind:'Theorem',name:'Wide-network training is kernel regression',
statement:String.raw`For a fixed positive-semidefinite kernel $\Theta$, let $K=\Theta(X,X)$ on n training inputs and retain an initial function $f_0$. The kernel flow for squared loss divided by $2n$ has training predictions
$$r_0=y-f_0(X),$$
$$u_t=y-e^{-Kt/n}r_0.$$
If K is invertible, at any input x,
$$G_t=K^{-1}(I-e^{-Kt/n}),$$
$$f_t(x)=f_0(x)+k_x^TG_tr_0,$$
where $(k_x)_i=\Theta(x,x_i)$. In particular,
$$f_\infty(x)=f_0(x)+k_x^TK^{-1}r_0.$$
For singular K, training residual components in its nullspace persist. The fixed finite-time approximation in 7.4 connects a wide network to this flow; it does not justify exchanging infinite-time and infinite-width limits.`,
idea:String.raw`Diagonalize the real symmetric Gram matrix. In an eigenvector with eigenvalue λ, the residual solves $\dot r=-\lambda r/n$, so its factor is $e^{-\lambda t/n}$. Integrate the off-data equation $\dot f(x)=k_x^T(y-u_t)/n$. For λ>0 the integral factor is $(1-e^{-\lambda t/n})/\lambda$; at λ=0 use its continuous value t/n. This gives a formula that also computes finite-time flow for singular matrices without an unstable inverse. When K is positive definite, all training residuals vanish as time tends to infinity. The initialized off-data term remains: only an identically zero initial function gives the usual zero-initialization kernel interpolant.`,
caption:String.raw`Change time and switch between a random initial function and zero. Edit the training labels; the exact flow and signed residual coefficients update. Duplicate inputs can create a null mode, and conflicting duplicate labels cannot both be fitted.`,
scope:String.raw`The display uses the deterministic limiting tangent kernel, exact finite-matrix exponentials and either zero initialization or one 64-neuron random function. It illustrates the kernel theorem directly, rather than claiming that this finite random function is already a GP sample. Gradient descent has powers $(I-\eta K/n)^s$, with a separate step-size condition; these curves are continuous-time flow. GP posterior regression in 7.2 uses a different covariance and noise model.`,
deps:['deep-7.4','ladr-7.29'],see:['deep-6.11','deep-7.2'],refs:['Jacot–Gabriel–Hongler 2018, §5 least-squares flow; initialized finite-matrix derivation supplied here'],links:{source:NTK},tags:['kernel regression','initialization'],viz:U.kernel},
]};
