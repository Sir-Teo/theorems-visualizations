// Continuous sources: units, quantization, extremal entropy and convolution.
import * as V from './ch06.ui.shared.js';
const MIT='Polyanskiy–Wu, MIT6.441 (2016)';
const entropyLink={course:'https://ocw.mit.edu/courses/6-441-information-theory-spring-2016/resources/mit6_441s16_chapter_1/'};
export default {collection:'info',chapter:6,title:'Continuous sources and the Gaussian channel',summary:String.raw`A continuous density has entropy relative to a coordinate scale. Quantization reveals that scale, while relative entropy identifies the distributions that maximize uncertainty under a constraint. Convolution and Gaussian coding connect these ideas to noise, bandwidth, energy per bit and power allocation.`,items:[
{num:'6.1',kind:'Definition',name:'Differential entropy',
statement:String.raw`For a real random variable with Lebesgue density $f$, its differential entropy in bits is
$$h(X)=-\int_{\R}f(x)\log_2 f(x)\,dx,$$
with $0\log 0=0$, whenever this signed integral is defined. It may be negative or infinite; if both positive and negative parts have infinite integrals, $h$ is undefined. For finite $h(X)$ and $a\ne0$,
$$h(aX+b)=h(X)+\log_2|a|.$$
Thus a choice of coordinate units matters. For a uniform law on an interval of length $L$, $h=\log_2 L$. For a Gaussian of variance $\sigma^2>0$, $h=\tfrac12\log_2(2\pi e\sigma^2)$.`,
idea:String.raw`The transformed density is $f((y-b)/a)/|a|$. Substitute it into the integral and change variables: the constant logarithm contributes $\log_2|a|$ because the density integrates to one. For a Gaussian, its negative log density is a constant plus $(x-\mu)^2/(2\sigma^2\ln2)$, whose expectation is $1/(2\ln2)$. For a histogram with equal cell width $w$ and masses $p_j$, integrate each constant density $p_j/w$ to obtain $h=H(p)+\log_2w$. A point mass has no Lebesgue density and is not an example with finite differential entropy.`,
caption:String.raw`Edit nonnegative cell weights, stretch the support and move it. The density is normalized, and exact cell integrals show when entropy is negative and why a change of scale adds a logarithm.`,
scope:String.raw`The diagram uses compact piecewise-constant densities, including empty cells. It computes their full integrals; it does not assign a differential entropy to a discrete atom.`,
deps:['info-1.2','pma-6.1'],tags:['entropy','continuous-sources'],refs:[`${MIT}, chapter1 §1.3, PDF11; Gallager, Principles of Digital Communication (28August2007), §§3.6–3.7, printed71–74`],links:entropyLink,viz:V.differentialWidget},
{num:'6.2',kind:'Theorem',name:'Differential entropy as a limit of quantized entropy',
statement:String.raw`A sufficient precise version is the following. Let $f$ be a bounded, compactly supported, Riemann-integrable probability density. For any grid offset $b_\Delta$, let
$$Q_\Delta=\left\lfloor\frac{X-b_\Delta}{\Delta}\right\rfloor.$$
Then
$$H(Q_\Delta)+\log_2\Delta\longrightarrow h(X).$$
The limit is as $\Delta\downarrow0$.
If $\bar f_\Delta$ is the density equal to the average of $f$ on each grid cell, the exact finite-resolution identity is
$$\begin{gathered}H(Q_\Delta)+\log_2\Delta\\=h(X)+D(f\|\bar f_\Delta),\\D(f\|\bar f_\Delta)\ge0.\end{gathered}$$
The stated hypotheses are sufficient, not necessary. Finite differential entropy alone is not asserted to justify exchanging an infinite sum with a limit.`,
idea:String.raw`A cell of probability $p_j$ has average density $p_j/\Delta$, so its contribution to $h(\bar f_\Delta)$ is $-p_j\log_2(p_j/\Delta)$. Summing proves the corrected-entropy identity. Also the two cross-entropy integrals agree:
$$\begin{gathered}\int f\log\bar f_\Delta\\=\int\bar f_\Delta\log\bar f_\Delta.\end{gathered}$$
This gives the divergence identity. Its nonnegativity follows by integrating $-\ln u\ge1-u$ with $u=\bar f_\Delta/f$ where $f>0$; any mass of $\bar f_\Delta$ outside that set only strengthens the inequality.
At every continuity point of $f$, all points in the containing cell lie within $\Delta$ of it, hence $\bar f_\Delta\to f$, even for moving offsets. Riemann integrability makes the exceptional set null. The function $u\log u$, extended by zero at $u=0$, is bounded on $[0,\|f\|_\infty]$. For $\Delta\le1$, all nonzero cells lie in a fixed compact interval. Dominated convergence now proves the result. Nested partitions give a monotonicity statement, but arbitrary moving grids need not.`,
caption:String.raw`Shrink the quantizer step and shift its grid over an editable density. Every cell probability comes from its actual overlap with the histogram; compare corrected discrete entropy with the exact differential entropy.`,
scope:String.raw`The displayed finite histograms satisfy the theorem. The curve samples many actual resolutions and assumes no universal quadratic convergence rate at discontinuities.`,
deps:['info-6.1','info-2.2'],tags:['quantization','entropy'],refs:['Gallager (2007), §§3.6–3.7, printed71–75, cell-average identity and high-rate discussion; explicit compact-density convergence proof supplied here'],links:{course:'https://www.mit.edu/~6.450/handouts/6.450book.pdf'},viz:V.quantizationWidget},
{num:'6.3',kind:'Theorem',name:'The Gaussian maximizes entropy for a given variance',
statement:String.raw`Let $X$ have a density, finite mean $\mu$ and finite positive variance $\sigma^2$. Then its differential entropy is well-defined as a real number or $-\infty$, and
$$h(X)\le\frac12\log_2(2\pi e\sigma^2).$$
Equality holds exactly when $X$ is Gaussian with that mean and variance. More precisely, for the matched Gaussian density $g$,
$$D(f\|g)=h(g)-h(f),$$
with $D=+\infty$ if $h(f)=-\infty$. Mean need not be fixed to obtain the bound; translation does not change entropy. A variance upper bound $\operatorname{Var}(X)\le P$ likewise gives $h(X)\le\tfrac12\log_2(2\pi eP)$ for $P>0$.`,
idea:String.raw`Continuous relative entropy is the integral $\int f\log_2(f/g)$, not a finite-alphabet sum. The inequality $-\ln u\ge1-u$ gives $D\ge0$, with equality only when the two densities agree almost everywhere. Its negative part is integrable because $t\ln t\ge-1/e$ against the probability density $g$. The cross-entropy $-\int f\log_2 g$ is finite: $-\log g$ is a constant plus a quadratic, and the first two moments match. It equals $h(g)$. Consequently $h(f)=h(g)-D$ is defined, cannot be $+\infty$, and has the claimed upper bound and equality condition. This proof also explains why a numerical plot clipped to a finite window must not be used to compute the Gaussian's entropy.`,
caption:String.raw`Compare uniform, Laplace, Gaussian and editable histogram densities after matching their mean and variance. The entropy difference is also their exact divergence from the matched Gaussian.`,
scope:String.raw`Analytic densities include their whole tails in the calculations. Only the displayed curves use a finite window; histogram normalization and moments use the complete finite support.`,
deps:['info-6.1','info-2.2','pma-8.21'],tags:['maximum-entropy','gaussian'],refs:[`${MIT}, chapter1 §1.3, PDF11; Médard, MIT6.441 (2010), Lecture16, exponential-family entropy bound and Gaussian example`],links:entropyLink,viz:V.gaussianMaximumWidget},
{num:'6.4',kind:'Theorem',name:'Maximum-entropy distributions',
statement:String.raw`The support and the constraints determine the entropy maximizer.
(a) Among densities supported in a specified interval of length $L>0$, the unique maximizer is uniform, with entropy $\log_2L$.
(b) Among densities on $[0,\infty)$ with fixed mean $m>0$, the unique maximizer is exponential, $g(x)=m^{-1}e^{-x/m}$, with entropy $\log_2(em)$.
(c) For fixed positive variance, the maximizers are Gaussians, with arbitrary mean if the mean was not prescribed.
More generally, suppose a normalized density on a specified support has the form
$$\begin{gathered}\ln g(x)\\=-\alpha-\sum_j\lambda_jT_j(x).\end{gathered}$$
If admissible densities have the same finite expectations of the $T_j$ as $g$, and $\log g$ is integrable under them, then $g$ uniquely maximizes entropy. This statement requires existence and normalization; a formal exponential expression is not enough. A fixed mean on all of $\R$ alone has no finite maximum.`,
idea:String.raw`The constraints make $-\int f\log_2g$ the same constant for every admissible $f$. Taking $f=g$ shows this constant is $h(g)$, so $h(g)-h(f)$ equals $D(f\|g)\ge0$. For bounded support, $\log g$ is constant. On the nonnegative half-line it is affine in $x$, and matching the mean suffices. For the Gaussian it is quadratic, so matching the relevant first two moments works. Strictness is the equality condition for divergence. To expose a missing constraint, keep the mean at zero while taking uniform laws on $[-a,a]$: their entropies $\log_2(2a)$ diverge as $a\to\infty$. Thus the nonnegative-support assumption in the exponential case does essential work.`,
caption:String.raw`Select the support or moment constraint and edit a test histogram. It is rescaled to satisfy that constraint before comparison. Remove the support restriction from a mean-only problem to see why no maximizer remains.`,
scope:String.raw`The general exponential-family statement is conditional on existence, matching moments and integrability. The scene explicitly distinguishes a mean constraint on the half-line from one on the whole real line.`,
deps:['info-6.3'],tags:['maximum-entropy','constraints'],refs:['Médard, MIT6.441 (2010), Lecture16, normalized exponential-family KL proof; local support and nonexistence cases'],links:{course:'https://ocw.mit.edu/courses/6-441-information-theory-spring-2010/resources/mit6_441s10_lec16/'},viz:V.maximumEntropyWidget},
{num:'6.5',kind:'Theorem',name:'Entropy power inequality',
statement:String.raw`For independent real random variables $X,Y$ with densities, finite variances and finite differential entropies, define their entropy powers by
$$N(X)=\frac{2^{2h(X)}}{2\pi e}.$$
Then
$$N(X+Y)\ge N(X)+N(Y).$$
Equality holds exactly when both variables are Gaussian. Their means and positive variances may differ. Independence is essential: taking $Y=-X$ generally makes the sum a point mass. Entropy power has units of variance and equals the variance for a Gaussian.`,
idea:String.raw`Here is the scalar transport argument for smooth positive densities with the necessary integrable log derivatives. Write $X=T(G)$ and $Y=S(H)$, where $G,H$ are independent standard Gaussians and $T,S$ are increasing inverse-distribution transports. Change of variables gives $h(X)=h(G)+\mathbb E\log_2T'(G)$, and similarly for $Y$.
For $0<\lambda<1$, rotate $(G,H)$ to independent standard Gaussians:
$$\begin{gathered}U=\sqrt\lambda G+\sqrt{1-\lambda}H,\\V=-\sqrt{1-\lambda}G+\sqrt\lambda H.\end{gathered}$$ Put $Z=\sqrt\lambda T(G)+\sqrt{1-\lambda}S(H)$. Conditional on $V$, its derivative with respect to $U$ is $\lambda T'(G)+(1-\lambda)S'(H)$. Thus conditioning and concavity of the logarithm give
$$\begin{gathered}h(Z)\ge h(Z\mid V),\\h(Z\mid V)\ge\lambda h(X)+(1-\lambda)h(Y).\end{gathered}$$
Apply this inequality to $X/\sqrt\lambda$ and $Y/\sqrt{1-\lambda}$ with $\lambda=N(X)/(N(X)+N(Y))$. The two rescaled entropies coincide; simplifying yields the stated entropy-power bound. Equality in the logarithmic inequality requires the independent derivative variables to be equal almost surely, hence constant: the transports are affine and both inputs Gaussian.
For the general finite-variance statement, Rioul's smoothing/transport extension is an additional analytic input. Its entropy-continuity step follows by Gaussian smoothing, the lower bound $h(X+\sqrt\epsilon G)\ge h(X)$, and lower semicontinuity of divergence relative to a fixed Gaussian for the reverse limit. The full general equality characterization uses the equality argument in that extension; the finite convolution experiment is not a proof of it.`,
caption:String.raw`Edit two independent histogram densities and convolve them. Compare the entropy power of the sum with the sum of their entropy powers. Switch to full Gaussian formulas to inspect the equality case.`,
scope:String.raw`Histogram convolutions are computed from exact overlap lengths and analytic linear-segment entropy integrals, subject to floating-point arithmetic. The Gaussian mode uses full analytic tails. Dependence is excluded by the theorem and the model.`,
deps:['info-6.1','info-6.3','info-2.5'],tags:['entropy-power','convolution'],refs:['Rioul, Yet Another Proof of the Entropy Power Inequality, arXiv1606.05969v3 (21February2017), main proof, equality discussion and AppendicesA–D; scalar transport proof and stated extension boundary'],links:{paper:'https://arxiv.org/abs/1606.05969'},viz:V.entropyPowerWidget},
]};
